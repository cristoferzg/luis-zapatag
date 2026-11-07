// =============================================================================
// Memoria de cálculo de Techos (prediseño RNE E.020 / E.090), sin interfaz.
// La usan la pestaña "Análisis estructural" (3D de pandeo, recomendados) y la
// memoria imprimible, para que los números sean siempre los mismos.
//
//  • Cargas de servicio por m² (muerta + viva) repartidas por área tributaria.
//  • Columnas: carga crítica de Euler con factor de seguridad 3 ≥ carga axial.
//  • Vigas, cordones y correas: flecha 5qL⁴/384EI ≤ L/240 (correas L/180).
//  • Todas: esbeltez λ = KL/r ≤ 200 (correas y arriostres ≤ 300).
//  • Viento (E.020): q = 0.005·V² kg/m²; succión en techo Cp = −0.7.
// Es un PREdiseño: el cálculo definitivo lo firma un ingeniero colegiado.
// =============================================================================
import type { Node3D, Segment3D, CoverageZone3D, RolEstructuralSegmento, PerfilTubularItem } from './techosCadEngineTypes';
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS } from './techosCadCatalog';
import { propsPerfil, factorK, limitesLambda, seAnaliza, cumpleTramo, perfilMasEconomico, CargasGrupo } from './propiedadesPerfil';
import { precio, clavePerfilDe } from '../../lib/catalogoPrecios';
import { perfilSuperior, alerosConCanaleta } from './canaletas';
import { zonaPrincipal } from './mecanismoMovil';

export type Riesgo = 'BAJO' | 'MEDIO' | 'ALTO';
export type EstadoMemoria = 'CUMPLE' | 'OBSERVACION' | 'NO_CUMPLE';

export interface EntradasCargas { cargaMuertaKgM2?: number; cargaVivaKgM2?: number; velocidadVientoKmH?: number; zonaSismica?: string }

const E_ACERO = 200e9; // Pa
const G = 9.81;
const SECUNDARIOS = ['correa', 'arriostre'];

export const NOMBRE_ROL: Record<string, string> = {
  columna: 'Columnas', cordon_superior: 'Cordón superior', cordon_inferior: 'Cordón inferior', diagonal: 'Diagonales',
  montante: 'Montantes', viga_principal: 'Vigas principales', viga_secundaria: 'Vigas secundarias', correa: 'Correas',
  arriostre: 'Arriostres', columna_concreto: 'Columnas de concreto', tensor_viento: 'Tensores',
};
const nombreRol = (r: string) => NOMBRE_ROL[r] || (r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, ' '));
const singular = (r: string) => nombreRol(r).replace(/es$/, '').replace(/s$/, '').replace(/^Cordón superior$/, 'Cordón superior');
const perfilDe = (id: string) => INVENTARIO_PERFILES_TUBULARES.find(p => p.id === id);
const largoDe = (nodes: Record<string, Node3D>, s: Segment3D) => {
  const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
  return a && b ? Math.hypot(b.x - a.x, b.y - a.y, (b.z || 0) - (a.z || 0)) : 0;
};

/** Precio por metro del perfil (Catálogo de precios, que viene por barra comercial). */
export function precioMetroPerfil(p: PerfilTubularItem): number {
  const largo = p.longitudComercialM || 6;
  return precio(clavePerfilDe(p), (p.costoMetroSol || 0) * largo) / largo;
}

/**
 * Luz libre de cálculo de una pieza: el tramo más largo ENTRE APOYOS, no el largo
 * del tubo. Una correa de 18 m que pasa sobre 5 vigas trabaja con luces de ~4 m;
 * una viga que pasa sobre una columna intermedia, igual. Apoyos:
 *  • correas y vigas secundarias: las vigas, cordones superiores o vigas secundarias
 *    que las cruzan por debajo (en planta, a menos de 0.6 m de altura);
 *  • vigas: las columnas cuya cabeza cae sobre la viga.
 * Columnas, barras de tijeral y arriostres: su propio largo (van de nudo a nudo).
 */
const APOYA_CORREA = /^viga|^cordon_superior/;
export function luzLibre(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, s: Segment3D): number {
  const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
  if (!a || !b) return 0;
  const L = Math.hypot(b.x - a.x, b.y - a.y, (b.z || 0) - (a.z || 0));
  const rol = s.rolEstructural;
  const esCorrea = rol === 'correa' || rol === 'viga_secundaria';
  const esViga = /^viga/.test(rol);
  if (!esCorrea && !esViga) return L;
  const ts: number[] = [];
  const ax = a.x, az = a.z || 0, dx = b.x - a.x, dz = (b.z || 0) - az;
  Object.values(segments).forEach(o => {
    if (o.id === s.id) return;
    const c = nodes[o.nodeAId], d = nodes[o.nodeBId];
    if (!c || !d) return;
    if (esCorrea && APOYA_CORREA.test(o.rolEstructural) && o.rolEstructural !== 'correa') {
      // Cruce en planta (x, z) de los dos ejes.
      const ex = d.x - c.x, ez = (d.z || 0) - (c.z || 0);
      const den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-9) return; // paralelas
      const cx = c.x - ax, cz = (c.z || 0) - az;
      const t = (cx * ez - cz * ex) / den, u = (cx * dz - cz * dx) / den;
      if (t <= 0.01 || t >= 0.99 || u < -0.02 || u > 1.02) return;
      const yS = a.y + t * (b.y - a.y), yO = c.y + u * (d.y - c.y);
      if (Math.abs(yS - yO) <= 0.6) ts.push(t);
    }
    if (esViga && o.rolEstructural === 'columna') {
      // Cabeza de columna (su nudo más alto) sobre el eje de la viga.
      const top = c.y >= d.y ? c : d;
      const v = { x: top.x - a.x, y: top.y - a.y, z: (top.z || 0) - (a.z || 0) };
      const dd = { x: b.x - a.x, y: b.y - a.y, z: (b.z || 0) - (a.z || 0) };
      const t = (v.x * dd.x + v.y * dd.y + v.z * dd.z) / Math.max(1e-9, L * L);
      if (t <= 0.01 || t >= 0.99) return;
      const dist = Math.hypot(v.x - t * dd.x, v.y - t * dd.y, v.z - t * dd.z);
      if (dist <= 0.15) ts.push(t);
    }
  });
  if (!ts.length) return L;
  const pts = [0, ...ts.sort((x, y) => x - y), 1];
  let max = 0;
  for (let i = 1; i < pts.length; i++) max = Math.max(max, pts[i] - pts[i - 1]);
  return Math.max(0.05, max * L);
}

/** Cargas de servicio que recibe cada tipo de pieza (las mismas que usa "Aplicar recomendados"). */
export function contextoCargas(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, inputs: EntradasCargas) {
  const ns = Object.values(nodes);
  const xs = ns.map(n => n.x), zs = ns.map(n => n.z || 0);
  const areaTecho = ns.length ? (Math.max(...xs) - Math.min(...xs)) * (Math.max(...zs) - Math.min(...zs)) : 0;
  const D = inputs.cargaMuertaKgM2 || 15, L = inputs.cargaVivaKgM2 || 30;
  const qArea = (D + L) * G; // N/m²
  const segs = Object.values(segments);
  const nCols = Math.max(1, segs.filter(s => s.rolEstructural === 'columna' && Math.min(nodes[s.nodeAId]?.y ?? 9, nodes[s.nodeBId]?.y ?? 9) < 0.1).length);
  const LVigas = segs.filter(s => /^viga|^cordon_superior/.test(s.rolEstructural)).reduce((x, s) => x + largoDe(nodes, s), 0);
  const LCorreas = segs.filter(s => s.rolEstructural === 'correa').reduce((x, s) => x + largoDe(nodes, s), 0);
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  // Tijerales: las correas se apoyan en los nudos, así que las barras trabajan a
  // fuerza axial. Cordones: N = M/d con M = w·luz²/8; diagonales y montantes: el
  // cortante del apoyo V = w·luz/2. w = carga por tijeral (área tributaria).
  const cordones = segs.filter(s => s.rolEstructural === 'cordon_superior');
  const montantes = segs.filter(s => s.rolEstructural === 'montante').map(s => largoDe(nodes, s));
  const hayTijeral = cordones.length > 0 && segs.some(s => s.rolEstructural === 'cordon_inferior');
  let tijeral: { w: number; luz: number; d: number; M: number; Ncordon: number; V: number } | null = null;
  if (hayTijeral) {
    let sx = 0, sz = 0;
    cordones.forEach(s => { const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; if (a && b) { sx += Math.abs(b.x - a.x); sz += Math.abs((b.z || 0) - (a.z || 0)); } });
    const luz = sx >= sz ? Math.max(...xs) - Math.min(...xs) : Math.max(...zs) - Math.min(...zs);
    const w = qArea * clamp(areaTecho / Math.max(0.01, LVigas), 0.5, 6) * 1.2;        // N/m por tijeral
    const d = Math.max(0.3, montantes.length ? Math.max(...montantes) : luz / 20);     // peralte
    const M = (w * luz * luz) / 8;
    tijeral = { w, luz, d, M, Ncordon: M / d / 1000, V: (w * luz) / 2 / 1000 };
  }
  const cargasDe = (rol: string): CargasGrupo => {
    if (rol === 'columna') return { PkN: (areaTecho * qArea / 1000 / nCols) * 1.5 };   // ×1.5 viento/sismo y reparto desigual
    if (tijeral && (rol === 'cordon_superior' || rol === 'cordon_inferior')) return { PkN: tijeral.Ncordon };
    if (tijeral && rol === 'diagonal') return { PkN: tijeral.V * 1.4 };
    if (tijeral && rol === 'montante') return { PkN: tijeral.V };
    if (/^viga|^cordon_superior/.test(rol) && LVigas > 0) return { qNm: qArea * clamp(areaTecho / LVigas, 0.5, 4) * 1.2 };
    if (rol === 'correa' && LCorreas > 0) return { qNm: qArea * clamp(areaTecho / LCorreas, 0.3, 2.5) };
    return {};
  };
  return { areaTecho, nCols, D, L, qArea, cargasDe, tijeral };
}

/** Demanda / capacidad de una pieza (null si solo se verifica la esbeltez). */
function verificar(p: PerfilTubularItem | undefined, rol: string, L: number, c: CargasGrupo) {
  const pr = propsPerfil(p);
  if (!pr) return null;
  if (c.PkN) {
    const Pcr = (Math.PI ** 2 * E_ACERO * pr.iMinCm4 * 1e-8) / Math.pow(factorK(rol as RolEstructuralSegmento) * Math.max(L, 0.01), 2) / 1000;
    const cap = Math.min(Pcr / 3, 0.6 * 250e3 * pr.areaCm2 * 1e-4); // pandeo (FS 3) o fluencia, lo menor (kN)
    return { tipo: 'axial' as const, demanda: c.PkN, capacidad: cap, ratio: c.PkN / Math.max(1e-9, cap) };
  }
  if (c.qNm) {
    const flecha = (5 * c.qNm * L ** 4) / (384 * E_ACERO * pr.iMaxCm4 * 1e-8);
    const adm = L / (SECUNDARIOS.includes(rol) ? 180 : 240);
    return { tipo: 'flecha' as const, demanda: flecha * 1000, capacidad: adm * 1000, ratio: flecha / adm };
  }
  return null;
}

export interface PiezaAnalizada {
  id: string; rol: string; nombre: string; perfilId: string; perfil: string;
  /** Largo del tubo (m): para pesos y metrados. */
  L: number;
  /** Luz libre de cálculo (m): tramo más largo entre apoyos. Manda en todas las verificaciones. */
  Lc: number;
  lambda: number; limite: number; PcrkN: number; ratio: number | null; riesgo: Riesgo;
  /** Perfil más económico (precio del catálogo) que cumple TODAS las verificaciones con esta luz (null: ninguno alcanza). */
  optimoId: string | null;
}

/**
 * ÚNICA regla de elección de perfil (la usan la memoria, "Aplicar recomendados",
 * "Perfil más económico que cumple" y las plantillas): el perfil de la misma familia
 * con el MENOR precio por metro del Catálogo de precios que pasa todas las
 * verificaciones que imprime la memoria (esbeltez, carga axial o flecha, mínimos de obra).
 */
export function perfilOptimo(actual: PerfilTubularItem | undefined, rol: string, Lc: number, cargas: CargasGrupo): PerfilTubularItem | null {
  return perfilMasEconomico(INVENTARIO_PERFILES_TUBULARES, actual, rol as RolEstructuralSegmento, Lc, precioMetroPerfil, cargas);
}

/**
 * Ahorro mínimo para sugerir cambiar un perfil que YA cumple: 8 % del precio por metro
 * y al menos S/ 1.00 por metro. Por debajo de eso no compensa (otro tubo que comprar,
 * cortar y soldar distinto, y la diferencia se va en desperdicio de barras).
 * Si el perfil NO cumple, siempre se cambia por el más barato que cumple.
 */
export const AHORRO_MIN = { pct: 8, solesPorMetro: 1 };
export const ahorroVale = (actual: number, nuevo: number) => actual - nuevo >= Math.max(AHORRO_MIN.solesPorMetro, actual * AHORRO_MIN.pct / 100) - 1e-9;

/** Cada pieza con su esbeltez, carga crítica y riesgo (para el 3D y el detalle). */
export function analizarPiezas(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, inputs: EntradasCargas): PiezaAnalizada[] {
  const { cargasDe } = contextoCargas(nodes, segments, inputs);
  const lista: PiezaAnalizada[] = [];
  Object.values(segments).forEach(s => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    if (!a || !b || !seAnaliza(s.rolEstructural)) return;
    const L = largoDe(nodes, s);
    const Lc = luzLibre(nodes, segments, s);
    const p = perfilDe(s.profileId);
    const pr = propsPerfil(p) || { areaCm2: 4, iMinCm4: 6, rMinCm: 1.2, iMaxCm4: 6 };
    const K = factorK(s.rolEstructural);
    const lambda = (K * Lc * 100) / pr.rMinCm;
    const lim = limitesLambda(s.rolEstructural);
    const PcrkN = (Math.PI ** 2 * E_ACERO * pr.iMinCm4 * 1e-8) / Math.pow(K * Math.max(Lc, 0.01), 2) / 1000;
    const c = cargasDe(s.rolEstructural);
    const v = verificar(p, s.rolEstructural, Lc, c);
    const ratio = v ? v.ratio : null;
    const cumple = !!p && cumpleTramo(p, s.rolEstructural, Lc, c);
    // ALTO: pasa la esbeltez máxima o la carga/flecha supera lo admisible.
    const riesgo: Riesgo = lambda > lim.maximo || (ratio !== null && ratio > 1) ? 'ALTO'
      : cumple ? 'BAJO' : 'MEDIO';
    // Perfil a usar: el más barato que cumple; si el actual cumple y nada es más barato, se queda.
    const opt = perfilOptimo(p, s.rolEstructural, Lc, c);
    // Si el actual ya cumple, solo se sugiere cambiar cuando el ahorro vale la pena (ver AHORRO_MIN).
    const optimoId = cumple && p && (!opt || !ahorroVale(precioMetroPerfil(p), precioMetroPerfil(opt))) ? p.id : (opt?.id ?? null);
    lista.push({ id: s.id, rol: s.rolEstructural, nombre: '', perfilId: s.profileId, perfil: p?.nombre || s.profileId, L, Lc, lambda, limite: lim.maximo, PcrkN, ratio, riesgo, optimoId });
  });
  // Nombres legibles: "Columna 3 (x 0.00 · z 5.00)", numeradas por posición.
  const centro = (id: string) => { const s = segments[id]; const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; return { x: (a.x + b.x) / 2, z: ((a.z || 0) + (b.z || 0)) / 2 }; };
  const porRol = new Map<string, PiezaAnalizada[]>();
  lista.forEach(p => porRol.set(p.rol, [...(porRol.get(p.rol) || []), p]));
  porRol.forEach(arr => {
    arr.map(p => ({ p, c: centro(p.id) })).sort((u, w) => u.c.z - w.c.z || u.c.x - w.c.x)
      .forEach(({ p, c }, i) => { p.nombre = `${singular(p.rol)} ${i + 1} (x ${c.x.toFixed(2)} · z ${c.z.toFixed(2)})`; });
  });
  return lista;
}

export interface GrupoMemoria {
  rol: string; nombreRol: string; perfilId: string; perfil: string; cant: number;
  /** Luz libre máxima (entre apoyos) que manda en las verificaciones. */
  Lmax: number;
  /** Largo máximo de tubo del grupo (si es mayor que la luz libre, la pieza pasa sobre apoyos). */
  LtuboMax: number;
  Ltot: number; pesoKg: number;
  lambdaMax: number; lambdaLim: number;
  verif: { tipo: 'axial' | 'flecha'; demanda: number; capacidad: number; ratio: number } | null;
  estado: EstadoMemoria; motivo: string;
  /** Perfil a usar (el mismo que aplican los botones). Vacío si el actual ya es el más económico que cumple. */
  recomendado?: string; recomendadoId?: string;
  /** refuerzo: el actual no cumple · ahorro: el actual cumple pero hay uno más barato que también cumple. */
  cambio?: 'refuerzo' | 'ahorro';
  /** Diferencia de costo al cambiar (S/; negativo = ahorro). */
  difCosto?: number;
  /** Verificación del perfil recomendado (para mostrar que sí cumple). */
  verifRec?: { lambda: number; ratio: number | null };
  /** Ids de las piezas del grupo. */
  ids: string[];
}

export interface Memoria {
  datos: { tipo: string; luz: number; largo: number; alturaCol: number; alturaMax: number; area: number; pendientePct: number | null; nCols: number; nPiezas: number; cobertura: string };
  cargas: { D: number; L: number; V: number; qViento: number; succion: number; zona: string; Z: number; U1: number; U2: number; U3: number };
  grupos: GrupoMemoria[];
  reacciones: { servicioKg: number; ultimaKg: number; levantamientoKg: number; nCols: number };
  pesoTotalKg: number; kgM2: number;
  estado: EstadoMemoria;
  piezas: PiezaAnalizada[];
  cuenta: Record<Riesgo, number>;
  tijeral: { w: number; luz: number; d: number; M: number; Ncordon: number; V: number } | null;
}

const FACTOR_Z: Record<string, number> = { Z4: 0.45, Z3: 0.35, Z2: 0.25, Z1: 0.10 };

function tipoDeTecho(nodes: Record<string, Node3D>): { tipo: string; pendientePct: number | null } {
  const perfil = perfilSuperior(nodes).filter(p => p.y > 0.1);
  if (perfil.length < 2) return { tipo: 'Estructura', pendientePct: null };
  const yMax = Math.max(...perfil.map(p => p.y)), yMin = Math.min(...perfil.map(p => p.y));
  const pend = new Set<number>();
  for (let i = 1; i < perfil.length; i++) {
    const dx = perfil[i].x - perfil[i - 1].x;
    if (dx > 0.05) pend.add(Math.round(Math.abs((perfil[i].y - perfil[i - 1].y) / dx) * 20) / 20);
  }
  const aleros = alerosConCanaleta(perfil);
  const span = perfil[perfil.length - 1].x - perfil[0].x;
  if (pend.size > 4 && yMax - yMin > 0.5) return { tipo: 'Curvo (arco / parabólico)', pendientePct: null };
  if (aleros.length === 2) return { tipo: 'Dos aguas', pendientePct: Math.round(((yMax - yMin) / Math.max(0.01, span / 2)) * 100) };
  if (yMax - yMin > 0.15) return { tipo: 'Una agua', pendientePct: Math.round(((yMax - yMin) / Math.max(0.01, span)) * 100) };
  return { tipo: 'Plano o caída a lo largo', pendientePct: null };
}

export function calcularMemoria(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, zonas: Record<string, CoverageZone3D>, inputs: EntradasCargas): Memoria {
  const ctx = contextoCargas(nodes, segments, inputs);
  const piezas = analizarPiezas(nodes, segments, inputs);
  const ns = Object.values(nodes);
  const xs = ns.map(n => n.x), zs = ns.map(n => n.z || 0), ys = ns.map(n => n.y);
  const luz = ns.length ? Math.max(...xs) - Math.min(...xs) : 0, largo = ns.length ? Math.max(...zs) - Math.min(...zs) : 0;
  const cols = Object.values(segments).filter(s => s.rolEstructural === 'columna');
  const alturaCol = cols.reduce((m, s) => Math.max(m, Math.abs((nodes[s.nodeAId]?.y ?? 0) - (nodes[s.nodeBId]?.y ?? 0))), 0);
  const { tipo, pendientePct } = tipoDeTecho(nodes);
  const zp = zonaPrincipal(zonas);
  const cobertura = zp ? (INVENTARIO_COBERTURAS.find(c => c.id === zp.coberturaMaterialId)?.nombre || zp.coberturaMaterialId) : 'Sin cobertura';

  // Cargas (kg/m²) y combinaciones LRFD.
  const V = inputs.velocidadVientoKmH || 75;
  const qViento = 0.005 * V * V;
  const succion = 0.7 * qViento;
  const zona = inputs.zonaSismica || 'Z4';
  const cargas = { D: ctx.D, L: ctx.L, V, qViento, succion, zona, Z: FACTOR_Z[zona] ?? 0.45, U1: 1.4 * ctx.D, U2: 1.2 * ctx.D + 1.6 * ctx.L, U3: 0.9 * ctx.D - succion };

  // Grupos: tipo de pieza + perfil actual + perfil a usar (cada pieza con su luz
  // libre elige el más económico que cumple; las que eligen el mismo van juntas).
  const mapa = new Map<string, PiezaAnalizada[]>();
  piezas.forEach(p => { const k = `${p.rol}|${p.perfilId}|${p.optimoId ?? '-'}`; mapa.set(k, [...(mapa.get(k) || []), p]); });
  const orden = ['columna', 'viga_principal', 'cordon_superior', 'cordon_inferior', 'montante', 'diagonal', 'viga_secundaria', 'correa', 'arriostre'];
  const grupos: GrupoMemoria[] = [...mapa.values()].map((arr): GrupoMemoria => {
    const { rol, perfilId, optimoId } = arr[0];
    const p = perfilDe(perfilId);
    const Lmax = Math.max(...arr.map(x => x.Lc)), Ltot = arr.reduce((s, x) => s + x.L, 0), LtuboMax = Math.max(...arr.map(x => x.L));
    const lambdaMax = Math.max(...arr.map(x => x.lambda));
    const lim = limitesLambda(rol as RolEstructuralSegmento);
    const cargas = ctx.cargasDe(rol);
    const v = verificar(p, rol, Lmax, cargas);
    let estado: EstadoMemoria = 'CUMPLE', motivo = 'Cumple esbeltez' + (v ? (v.tipo === 'axial' ? ' y carga axial' : ' y flecha') : '');
    if (lambdaMax > lim.maximo) { estado = 'NO_CUMPLE'; motivo = `Esbeltez ${lambdaMax.toFixed(0)} > ${lim.maximo}`; }
    else if (v && v.ratio > 1) { estado = 'NO_CUMPLE'; motivo = v.tipo === 'axial' ? `Carga ${v.demanda.toFixed(1)} kN > admisible ${v.capacidad.toFixed(1)} kN` : `Flecha ${v.demanda.toFixed(0)} mm > ${v.capacidad.toFixed(0)} mm`; }
    else if (p && !cumpleTramo(p, rol as RolEstructuralSegmento, Lmax, cargas)) { estado = 'OBSERVACION'; motivo = rol === 'columna' ? 'Columna menor al mínimo de obra (3" × 3" × 3 mm)' : 'Espesor menor al mínimo de obra'; }
    else if (lambdaMax > lim.bajo) { motivo += ' · esbeltez cerca del límite'; }
    const rec = optimoId && optimoId !== perfilId ? perfilDe(optimoId) : undefined;
    let verifRec: GrupoMemoria['verifRec'];
    if (rec) {
      const pr = propsPerfil(rec);
      const vr = verificar(rec, rol, Lmax, cargas);
      verifRec = { lambda: pr ? (factorK(rol as RolEstructuralSegmento) * Lmax * 100) / pr.rMinCm : 0, ratio: vr ? vr.ratio : null };
    }
    return {
      rol, nombreRol: nombreRol(rol), perfilId, perfil: p?.nombre || perfilId, cant: arr.length, Lmax, LtuboMax, Ltot,
      pesoKg: Ltot * (p?.pesoLinealKgM || 0), lambdaMax, lambdaLim: lim.maximo, verif: v, estado, motivo,
      recomendado: rec ? rec.nombre : (!optimoId ? 'Ningún perfil del catálogo alcanza: agrega un apoyo o arriostre intermedio' : undefined),
      recomendadoId: rec?.id,
      cambio: rec ? (estado === 'CUMPLE' ? 'ahorro' : 'refuerzo') : undefined,
      difCosto: rec && p ? (precioMetroPerfil(rec) - precioMetroPerfil(p)) * Ltot : undefined,
      verifRec, ids: arr.map(x => x.id),
    };
  }).sort((a, b) => (orden.indexOf(a.rol) + 99 * +(orden.indexOf(a.rol) < 0)) - (orden.indexOf(b.rol) + 99 * +(orden.indexOf(b.rol) < 0)) || b.Lmax - a.Lmax);

  const pesoTotalKg = grupos.reduce((s, g) => s + g.pesoKg, 0);
  const area = ctx.areaTecho;
  const reacciones = {
    nCols: ctx.nCols,
    servicioKg: (area * (cargas.D + cargas.L)) / ctx.nCols,
    ultimaKg: (area * cargas.U2) / ctx.nCols,
    levantamientoKg: (area * cargas.U3) / ctx.nCols,
  };
  const cuenta: Record<Riesgo, number> = { BAJO: 0, MEDIO: 0, ALTO: 0 };
  piezas.forEach(p => { cuenta[p.riesgo]++; });
  const estado: EstadoMemoria = grupos.some(g => g.estado === 'NO_CUMPLE') ? 'NO_CUMPLE' : grupos.some(g => g.estado === 'OBSERVACION') ? 'OBSERVACION' : 'CUMPLE';
  return {
    datos: { tipo, luz, largo, alturaCol, alturaMax: ys.length ? Math.max(...ys) : 0, area, pendientePct, nCols: ctx.nCols, nPiezas: piezas.length, cobertura },
    cargas, grupos, reacciones, pesoTotalKg, kgM2: area > 0 ? pesoTotalKg / area : 0, estado, piezas, cuenta, tijeral: ctx.tijeral,
  };
}

/**
 * Perfil a usar en cada pieza (id de pieza → id de perfil): el más económico que
 * cumple, el mismo que muestra la memoria. Lo usan "Aplicar recomendados",
 * "Perfil más económico que cumple" y las plantillas.
 */
export function perfilesQueCumplen(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, inputs: EntradasCargas): Record<string, string> {
  const nuevos: Record<string, string> = {};
  analizarPiezas(nodes, segments, inputs).forEach(p => { if (p.optimoId && p.optimoId !== p.perfilId) nuevos[p.id] = p.optimoId; });
  return nuevos;
}
