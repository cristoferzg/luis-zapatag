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
import { propsPerfil, esVigaH, factorK, limitesLambda, seAnaliza, cumpleTramo, perfilMasEconomico, CargasGrupo } from './propiedadesPerfil';
import { precio, clavePerfilDe, leerCatalogo } from '../../lib/catalogoPrecios';
import { perfilSuperior, alerosConCanaleta } from './canaletas';
import { zonaPrincipal } from './mecanismoMovil';
import { disenarColumnaCA, type DisenoColumnaCA } from './columnaConcreto';
import { disenarZapata, type DisenoZapata } from './zapata';
import { crucesPared } from './arriostresPared';
import { modeloTensor } from './tensores';

export type Riesgo = 'BAJO' | 'MEDIO' | 'ALTO';
export type EstadoMemoria = 'CUMPLE' | 'OBSERVACION' | 'NO_CUMPLE';

export interface EntradasCargas { cargaMuertaKgM2?: number; cargaVivaKgM2?: number; velocidadVientoKmH?: number; zonaSismica?: string; tipoSuelo?: string; categoriaUso?: string; capacidadSueloKgCm2?: number }

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
// Candidatos por techo (se calculan una vez por objeto `segments`): antes, cada pieza recorría TODAS
// las demás (millones de comparaciones en un techo de 2 800 piezas).
const candidatosLuz = new WeakMap<object, { apoyos: Segment3D[]; columnas: Segment3D[] }>();
const candidatosDe = (segments: Record<string, Segment3D>) => {
  let c = candidatosLuz.get(segments);
  if (!c) {
    const todos = Object.values(segments);
    c = { apoyos: todos.filter(o => APOYA_CORREA.test(o.rolEstructural) && o.rolEstructural !== 'correa'), columnas: todos.filter(o => o.rolEstructural === 'columna') };
    candidatosLuz.set(segments, c);
  }
  return c;
};
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
  const cand = candidatosDe(segments);
  (esCorrea && esViga ? [...cand.apoyos, ...cand.columnas] : esCorrea ? cand.apoyos : cand.columnas).forEach(o => {
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
  const nCols = Math.max(1, segs.filter(s => (s.rolEstructural === 'columna' || s.rolEstructural === 'columna_concreto') && Math.min(nodes[s.nodeAId]?.y ?? 9, nodes[s.nodeBId]?.y ?? 9) < 0.1).length);
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
  // Columnas metálicas: UNA sola regla con el sismo (ver columnaQueCumple). La memoria, el 3D,
  // «Aplicar recomendados» y el Asistente leen este mismo resultado: ya no se contradicen.
  const colRec = columnaQueCumple(nodes, segments, inputs, lista);
  if (colRec) lista.forEach(p => { if (p.rol === 'columna') p.optimoId = colRec.perfilId; });
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

/**
 * Columna metálica a usar (todas iguales): el tubo MÁS ECONÓMICO del catálogo que cumple a la vez
 *  1. esbeltez, carga axial y el mínimo de obra (3" × 3" × 3 mm) en cada columna (cumpleTramo);
 *  2. el sismo X (pórticos): deriva ≤ límite y flexión de la columna;
 *  3. el sismo Y (a lo largo) SIN agregar cruces: muchas obras no llevan arriostres ni tensores
 *     por presupuesto, así que primero se busca una columna que trabaje sola en voladizo.
 * Si ninguna cumple el sismo Y sola, se elige la más barata que cumple 1 y 2 y se marca
 * `necesitaCrucesY` (recién ahí se agregan cruces de pared). Si ninguna cumple 1 y 2: `sinColumna`.
 * Si la actual cumple todo, solo se cambia cuando el ahorro vale la pena (AHORRO_MIN).
 */
export function columnaQueCumple(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, inputs: EntradasCargas, piezas: PiezaAnalizada[]):
  { perfilId: string; necesitaCrucesY: boolean; sinColumna: boolean } | null {
  const cols = piezas.filter(p => p.rol === 'columna');
  if (!cols.length) return null;
  const ctx = contextoCargas(nodes, segments, inputs);
  const cCol = ctx.cargasDe('columna');
  const cuenta: Record<string, number> = {};
  cols.forEach(c => { cuenta[c.perfilId] = (cuenta[c.perfilId] || 0) + 1; });
  const actual = perfilDe(Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0]);
  const galv = !!actual?.id?.includes('galv');
  const U2 = 1.2 * ctx.D + 1.6 * ctx.L;
  const pesoOtros = piezas.filter(p => p.rol !== 'columna').reduce((t, p) => t + p.L * (perfilDe(p.perfilId)?.pesoLinealKgM || 0), 0);
  const Lcols = cols.reduce((t, p) => t + p.L, 0);
  const evalua = (p: PerfilTubularItem) => {
    if (!cols.every(c => cumpleTramo(p, 'columna', c.Lc, cCol))) return null;
    const segs = { ...segments };
    cols.forEach(c => { segs[c.id] = { ...segs[c.id], profileId: p.id }; });
    const q = calcularSismo(nodes, segs, inputs, ctx.areaTecho, ctx.D, ctx.L, pesoOtros + Lcols * (p.pesoLinealKgM || 0), ctx.nCols, U2);
    if (q) completarSismo(q, nodes, segs);
    return { x: !q || (q.deriva <= q.derivaLim && q.ratioFlexion <= 1), y: !q?.dirY || q.dirY.estado !== 'NO_CUMPLE' };
  };
  const candidatos = INVENTARIO_PERFILES_TUBULARES
    // Columnas de viga H: se busca entre vigas H (el usuario las eligió); si no, entre tubos.
    .filter(p => esVigaH(actual) ? esVigaH(p) : ['tubo_cuadrado', 'tubo_rectangular'].includes(p.categoria) && p.id.includes('galv') === galv)
    .map(p => ({ p, $: precioMetroPerfil(p) })).filter(x => x.$ > 0)
    .sort((a, b) => a.$ - b.$ || a.p.pesoLinealKgM - b.p.pesoLinealKgM);
  let soloX: PerfilTubularItem | null = null, elegido: PerfilTubularItem | null = null;
  for (const { p } of candidatos) {
    const r = evalua(p);
    if (!r || !r.x) continue;
    if (!soloX) soloX = p;
    if (r.y) { elegido = p; break; }
  }
  const mezcla = Object.keys(cuenta).length > 1;
  if (elegido) {
    const ra = actual ? evalua(actual) : null;
    const quedarse = !mezcla && actual && ra?.x && ra.y && !ahorroVale(precioMetroPerfil(actual), precioMetroPerfil(elegido));
    return { perfilId: quedarse ? actual!.id : elegido.id, necesitaCrucesY: false, sinColumna: false };
  }
  if (soloX) return { perfilId: soloX.id, necesitaCrucesY: true, sinColumna: false };
  // Ninguna columna alcanza el sismo X: se usa la más barata que cumple esbeltez y mínimos (o la actual).
  const est = candidatos.find(({ p }) => cols.every(c => cumpleTramo(p, 'columna', c.Lc, cCol)))?.p;
  return { perfilId: (est || actual)?.id || cols[0].perfilId, necesitaCrucesY: false, sinColumna: true };
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
  /** Análisis sísmico estático (E.030-2018). */
  sismo: Sismo | null;
  /** Zapata aislada típica (E.050 / E.060). */
  zapata: DisenoZapata | null;
  anclaje: Anclaje | null;
}

/**
 * Análisis sísmico estático (RNE E.030-2018), simplificado para naves de acero livianas:
 *  V = Z·U·C·S / R · P  (C/R ≥ 0.11), T = hn / CT (CT = 35, pórticos de acero),
 *  P = peso del acero + área × (D + 0.25 L)  (techos: 25 % de la carga viva),
 *  R = 4 (pórticos ordinarios de acero, OMF, estructura regular).
 * Cada columna toma V / n (cubierta como diafragma). Pórtico con el tijeral o la viga soldados a la columna
 * (nudo rígido) y base empotrada: Δe = V·h³ / 12EI, Δ = 0.75·R·Δe, deriva Δ/h ≤ 0.010 (acero);
 * flexión M = V·h/2, fb = M/S ≤ 0.6·Fy·1.33. Sin viga ni tijeral arriba: voladizo (V·h³/3EI, M = V·h).
 */
export interface Sismo {
  Z: number; U: number; C: number; S: number; R: number; Tp: number; TL: number; T: number; hn: number;
  zona: string; suelo: string; categoria: string;
  PKg: number; VKg: number; VColKg: number; nCols: number; perfilCol: string;
  deltaCm: number; deriva: number; derivaLim: number; MColKgM: number; fbKgCm2: number; fbAdmKgCm2: number; ratioFlexion: number;
  estado: EstadoMemoria; motivo: string;
  /** Columnas de concreto armado (si las hay): diseño E.060 con el sismo de arriba. */
  concreto?: DisenoColumnaCA | null;
  /** Dirección Y (a lo largo de la nave): columnas en voladizo + cruces de pared si las hay. */
  dirY?: DireccionY | null;
  /** Modos de vibración (X, Y y torsión) con su periodo. */
  modos?: { n: number; T: number; tipo: string; masa: string }[];
}
export interface DireccionY {
  sistema: 'arriostrado' | 'voladizo'; nCruces: number; deltaCm: number; deriva: number; derivaLim: number; T: number;
  fuerzaVarillaKg: number; capVarillaKg: number; varilla: string; estado: EstadoMemoria; motivo: string;
}
/** Anclaje de cada columna frente al levantamiento por viento (y el momento por sismo en bases rígidas). */
export interface Anclaje { tipo: string; pernos: number; diam: string; demandaKg: number; capacidadKg: number; levantamientoKg: number; estado: EstadoMemoria; motivo: string }
const S_SUELO: Record<string, Record<string, number>> = {
  Z4: { S0: 0.8, S1: 1.0, S2: 1.05, S3: 1.10 }, Z3: { S0: 0.8, S1: 1.0, S2: 1.15, S3: 1.20 },
  Z2: { S0: 0.8, S1: 1.0, S2: 1.20, S3: 1.40 }, Z1: { S0: 0.8, S1: 1.0, S2: 1.60, S3: 2.00 },
};
const TP_TL: Record<string, [number, number]> = { S0: [0.3, 3.0], S1: [0.4, 2.5], S2: [0.6, 2.0], S3: [1.0, 1.6] };
const U_CAT: Record<string, number> = { A: 1.5, B: 1.3, C: 1.0 };

/** Parámetros y cortante basal (comunes al acero y al concreto). */
function cortanteBasal(nodes: Record<string, Node3D>, inputs: EntradasCargas, area: number, D: number, L: number, pesoKg: number, nCols: number, R: number) {
  const hn = Math.max(...Object.values(nodes).map(n => n.y));
  const zona = inputs.zonaSismica || 'Z4', suelo = inputs.tipoSuelo || 'S2', categoria = inputs.categoriaUso || 'C';
  const Z = FACTOR_Z[zona] ?? 0.45, S = S_SUELO[zona]?.[suelo] ?? 1.05, U = U_CAT[categoria] ?? 1.0;
  const [Tp, TL] = TP_TL[suelo] || TP_TL.S2;
  const T = hn / 35;
  let C = T < Tp ? 2.5 : T < TL ? 2.5 * Tp / T : 2.5 * Tp * TL / (T * T);
  C = Math.max(C, 0.11 * R);
  const PKg = pesoKg + area * (D + 0.25 * L);
  const VKg = (Z * U * C * S / R) * PKg;
  return { hn, zona, suelo, categoria, Z, S, U, Tp, TL, T, C, PKg, VKg, VColKg: VKg / Math.max(1, nCols) };
}

/** Tijerales de acero sobre columnas de CONCRETO ARMADO (apoyo articulado: columnas en voladizo). */
function sismoConcreto(nodes: Record<string, Node3D>, colsCA: Segment3D[], inputs: EntradasCargas, area: number, D: number, L: number, pesoKg: number, nCols: number, uKgM2: number): Sismo {
  const R = 4;
  const b = cortanteBasal(nodes, inputs, area, D, L, pesoKg, nCols, R);
  const h = Math.max(...colsCA.map(s => Math.abs(nodes[s.nodeAId].y - nodes[s.nodeBId].y)));
  // Pu = reacción última del techo + peso propio de la columna (25 × 25 de partida; ×1.4).
  const PuKg = (area * uKgM2) / Math.max(1, nCols) + 0.25 * 0.25 * h * 2400 * 1.4;
  const ca = disenarColumnaCA(h, PuKg, b.VColKg, R);
  return {
    Z: b.Z, U: b.U, C: b.C, S: b.S, R, Tp: b.Tp, TL: b.TL, T: b.T, hn: b.hn, zona: b.zona, suelo: b.suelo, categoria: b.categoria,
    PKg: b.PKg, VKg: b.VKg, VColKg: b.VColKg, nCols, perfilCol: `Concreto armado ${ca.b} × ${ca.h} cm, ${ca.n} Ø ${ca.barra}`,
    deltaCm: ca.deltaCm, deriva: ca.deriva, derivaLim: ca.derivaLim, MColKgM: ca.MuKgM, fbKgCm2: 0, fbAdmKgCm2: 0,
    ratioFlexion: ca.MuKgM / Math.max(1, ca.phiMnKgM), estado: ca.estado, motivo: ca.motivo, concreto: ca,
  };
}

/** Dirección Y (cruces de pared o voladizo) y modos de vibración X, Y, torsión. */
function completarSismo(q: Sismo, nodes: Record<string, Node3D>, segments: Record<string, Segment3D>) {
  const cols = Object.values(segments).filter(s => /^columna/.test(s.rolEstructural || '') && nodes[s.nodeAId] && nodes[s.nodeBId]);
  if (!cols.length) return;
  const h = Math.max(...cols.map(s => Math.abs(nodes[s.nodeAId].y - nodes[s.nodeBId].y)));
  const g = G;
  // Rigidez lateral de cada columna en Y (voladizo): 3EI/h³.
  let kColY: number;
  if (q.concreto) { const Ec = 15000 * Math.sqrt(210) * 98066.5, Ig = (q.concreto.b / 100) * (q.concreto.h / 100) ** 3 / 12; kColY = 3 * Ec * 0.7 * Ig / h ** 3; }
  else { const pc = perfilDe(cols.find(s => s.rolEstructural === 'columna')!.profileId), pr = propsPerfil(pc); kColY = pr ? 3 * E_ACERO * pr.iMinCm4 * 1e-8 / h ** 3 : 1e5; }
  // Cruces de pared: varillas a tracción (solo la mitad trabaja en cada sentido).
  const cruces = crucesPared(nodes, segments);
  let kBr = 0, cosProm = 1, area = 0, varilla = '';
  cruces.forEach(s => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    const L = Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)), cos = Math.abs((a.z || 0) - (b.z || 0)) / L;
    const m = modeloTensor(s.profileId), d = m ? m.diamMm : (perfilDe(s.profileId)?.anchoMm || 16);
    const A = Math.PI * (d / 1000) ** 2 / 4;
    kBr += 0.5 * E_ACERO * A * cos * cos / L; cosProm = cos; area = A; varilla = m?.nombre || perfilDe(s.profileId)?.nombre || '';
  });
  const kY = cols.length * kColY + kBr;
  const deltaE = (q.VKg * g) / kY, delta = 0.75 * q.R * deltaE;
  const deriva = delta / h, derivaLim = q.concreto ? 0.007 : 0.010;
  const Vbr = q.VKg * (kBr / kY);
  const activas = Math.max(1, cruces.length / 2);
  const fuerza = Vbr / activas / Math.max(0.2, cosProm);
  const cap = area ? 0.9 * 2530 * area * 1e4 : 0;
  const TY = 2 * Math.PI * Math.sqrt(q.PKg / kY);
  let estado: EstadoMemoria = 'CUMPLE', motivo = cruces.length ? 'Cruces de pared toman el sismo Y' : 'Columnas en voladizo (sin cruces de pared)';
  if (deriva > derivaLim) { estado = 'NO_CUMPLE'; motivo = `Deriva Y ${deriva.toFixed(4)} > ${derivaLim}: agregar cruces de arriostre en las paredes`; }
  else if (cruces.length && fuerza > cap) { estado = 'NO_CUMPLE'; motivo = 'Varillas de las cruces insuficientes: usar Ø 3/4"'; }
  q.dirY = { sistema: cruces.length ? 'arriostrado' : 'voladizo', nCruces: cruces.length, deltaCm: delta * 100, deriva, derivaLim, T: TY, fuerzaVarillaKg: fuerza, capVarillaKg: cap, varilla, estado, motivo };
  // Modos: X (de la memoria), Y y torsión con la rigidez de cada columna repartida en planta.
  const deX = q.deltaCm / 100 / (0.75 * q.R), kX = deX > 0 ? q.VKg * g / deX : kY;
  const TX = 2 * Math.PI * Math.sqrt(q.PKg / kX);
  const bases = cols.map(s => { const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; const n = a.y <= b.y ? a : b; return { x: n.x, z: n.z || 0 }; });
  const xc = bases.reduce((t, p) => t + p.x, 0) / bases.length, zc = bases.reduce((t, p) => t + p.z, 0) / bases.length;
  const Lx = Math.max(...bases.map(p => p.x)) - Math.min(...bases.map(p => p.x)), Lz = Math.max(...bases.map(p => p.z)) - Math.min(...bases.map(p => p.z));
  let kT = bases.reduce((t, p) => t + (kX / bases.length) * (p.z - zc) ** 2 + kColY * (p.x - xc) ** 2, 0);
  cruces.forEach(s => { const a = nodes[s.nodeAId]; kT += (kBr / Math.max(1, cruces.length)) * (a.x - xc) ** 2; });
  const J = q.PKg * (Lx * Lx + Lz * Lz) / 12;
  const TT = kT > 0 ? 2 * Math.PI * Math.sqrt(J / kT) : 0;
  q.modos = [{ T: TX, tipo: 'Traslación X (pórticos)', masa: '≈ 100 % UX' }, { T: TY, tipo: 'Traslación Y (a lo largo)', masa: '≈ 100 % UY' }, { T: TT, tipo: 'Torsión en planta', masa: '≈ 100 % RZ' }]
    .sort((a, b) => b.T - a.T).map((m, i) => ({ n: i + 1, ...m }));
}

function calcularSismo(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, inputs: EntradasCargas, area: number, D: number, L: number, pesoKg: number, nCols: number, uKgM2: number): Sismo | null {
  const cols = Object.values(segments).filter(s => s.rolEstructural === 'columna' && nodes[s.nodeAId] && nodes[s.nodeBId]);
  const colsCA = Object.values(segments).filter(s => s.rolEstructural === 'columna_concreto' && nodes[s.nodeAId] && nodes[s.nodeBId]);
  if (!cols.length && colsCA.length) return sismoConcreto(nodes, colsCA, inputs, area, D, L, pesoKg, nCols, uKgM2);
  if (!cols.length) return null;
  const cuenta: Record<string, number> = {};
  cols.forEach(s => { cuenta[s.profileId] = (cuenta[s.profileId] || 0) + 1; });
  const perfilId = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0][0];
  const p = perfilDe(perfilId), pr = propsPerfil(p);
  if (!p || !pr) return null;
  const h = Math.max(...cols.map(s => Math.abs(nodes[s.nodeAId].y - nodes[s.nodeBId].y)));
  const hn = Math.max(...Object.values(nodes).map(n => n.y));
  const zona = inputs.zonaSismica || 'Z4', suelo = inputs.tipoSuelo || 'S2', categoria = inputs.categoriaUso || 'C';
  const Z = FACTOR_Z[zona] ?? 0.45, S = S_SUELO[zona]?.[suelo] ?? 1.05, U = U_CAT[categoria] ?? 1.0, R = 4;
  const [Tp, TL] = TP_TL[suelo] || TP_TL.S2;
  const T = hn / 35;
  let C = T < Tp ? 2.5 : T < TL ? 2.5 * Tp / T : 2.5 * Tp * TL / (T * T);
  C = Math.max(C, 0.11 * R);
  const PKg = pesoKg + area * (D + 0.25 * L);
  const VKg = (Z * U * C * S / R) * PKg;
  const VColKg = VKg / Math.max(1, nCols);
  // Viga H: el alma va en el plano del pórtico (como en el 3D), trabaja con su eje fuerte; en Y (a lo largo), el débil.
  const vigaH = esVigaH(p);
  const I = (vigaH ? pr.iMaxCm4 : pr.iMinCm4) * 1e-8; // m⁴
  const nudoRigido = Object.values(segments).some(s => /cordon_|viga_principal/.test(s.rolEstructural || ''));
  const deltaE = (VColKg * G * h ** 3) / ((nudoRigido ? 12 : 3) * E_ACERO * I); // m
  const delta = 0.75 * R * deltaE;
  const deriva = delta / Math.max(0.1, h), derivaLim = 0.010;
  const c = (vigaH ? p.anchoMm : Math.min(p.anchoMm, p.altoMm || p.anchoMm)) / 20; // cm (mitad del peralte / del lado menor)
  const MColKgM = VColKg * h / (nudoRigido ? 2 : 1);
  const fb = (MColKgM * 100) / ((vigaH ? pr.iMaxCm4 : pr.iMinCm4) / c);
  const fbAdm = 0.6 * 3200 * 1.33;
  const ratioFlexion = fb / fbAdm;
  let estado: EstadoMemoria = 'CUMPLE', motivo = 'Cumple deriva y flexión de columnas';
  if (deriva > derivaLim) { estado = 'NO_CUMPLE'; motivo = `Deriva ${deriva.toFixed(4)} > ${derivaLim}: usar columnas más rígidas o arriostrar`; }
  else if (ratioFlexion > 1) { estado = 'NO_CUMPLE'; motivo = `Flexión en columna ${fb.toFixed(0)} > ${fbAdm.toFixed(0)} kg/cm²`; }
  return { Z, U, C, S, R, Tp, TL, T, hn, zona, suelo, categoria, PKg, VKg, VColKg, nCols, perfilCol: p.nombre, deltaCm: delta * 100, deriva, derivaLim, MColKgM, fbKgCm2: fb, fbAdmKgCm2: fbAdm, ratioFlexion, estado, motivo };
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

/**
 * Memoria temporal: varias partes de la pantalla (módulo, visor 3D, análisis) piden la memoria del MISMO techo
 * a la vez; en un techo grande (2 800 piezas) cada cálculo tarda segundos. Si no cambió nada (mismos nudos,
 * piezas, zonas, cargas y precios del catálogo) se devuelve el último resultado.
 */
const memoriaCache: { nodes?: object; segments?: object; zonas?: object; inputs?: string; catalogo?: object; resultado?: Memoria }[] = [];
export function calcularMemoria(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, zonas: Record<string, CoverageZone3D>, inputs: EntradasCargas): Memoria {
  const claveInputs = JSON.stringify(inputs || {}), catalogo = leerCatalogo();
  const hit = memoriaCache.find(c => c.nodes === nodes && c.segments === segments && c.zonas === zonas && c.inputs === claveInputs && c.catalogo === catalogo);
  if (hit?.resultado) return hit.resultado;
  const resultado = calcularMemoriaSinCache(nodes, segments, zonas, inputs);
  memoriaCache.unshift({ nodes, segments, zonas, inputs: claveInputs, catalogo, resultado });
  if (memoriaCache.length > 6) memoriaCache.length = 6;
  return resultado;
}

function calcularMemoriaSinCache(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, zonas: Record<string, CoverageZone3D>, inputs: EntradasCargas): Memoria {
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
      cambio: rec ? (estado !== 'CUMPLE' || (p && precioMetroPerfil(rec) > precioMetroPerfil(p)) ? 'refuerzo' : 'ahorro') : undefined,
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
  const sismo = calcularSismo(nodes, segments, inputs, area, cargas.D, cargas.L, pesoTotalKg, ctx.nCols, cargas.U2);
  if (sismo) completarSismo(sismo, nodes, segments);
  // Zapata típica: carga de servicio y última por columna + peso de la columna; momento del sismo en la base.
  const zapata = (() => {
    const cols = Object.values(segments).filter(s => /^columna/.test(s.rolEstructural || '') && nodes[s.nodeAId] && nodes[s.nodeBId]);
    if (!cols.length) return null;
    const h = Math.max(...cols.map(s => Math.abs(nodes[s.nodeAId].y - nodes[s.nodeBId].y)));
    const ca = sismo?.concreto;
    const pesoCol = ca ? (ca.b / 100) * (ca.h / 100) * h * 2400 : 0;
    const P = (area * (cargas.D + cargas.L)) / ctx.nCols + pesoCol;
    const Pu = (area * cargas.U2) / ctx.nCols + 1.4 * pesoCol;
    // Concreto en voladizo: M = V·h. Acero con nudo rígido: M = V·h/2 (placa base sobre pedestal de c = 40 cm).
    const M = sismo ? (ca ? sismo.VColKg * h : sismo.VColKg * h / 2) : 0;
    const c = ca ? Math.max(ca.b, ca.h) : 40;
    try { return disenarZapata(P, Pu, M, c, inputs.capacidadSueloKgCm2 || 1.5); } catch { return null; }
  })();
  // Anclaje: pernos tipo J (acero) o espárragos de la plancha embebida (concreto) contra el levantamiento.
  const anclaje: Anclaje | null = (() => {
    if (!sismo) return null;
    const levant = Math.max(0, -reacciones.levantamientoKg);
    const nPernos = 4, Ab = 1.98; // Ø 5/8"
    const cap = nPernos * 0.75 * 0.75 * 4200 * Ab;               // φRnt (ASTM A307 / A36)
    const ca = sismo.concreto;
    // Base rígida (acero): el momento por sismo se reparte en el par de pernos de cada lado (brazo ≈ 0.20 m).
    const tirSismo = ca ? 0 : (sismo.MColKgM / 0.2) / 2;
    const demanda = levant + tirSismo;
    const ok = demanda <= cap;
    return { tipo: ca ? 'Plancha embebida con 4 espárragos Ø 5/8"' : 'Placa base con 4 pernos J Ø 5/8" (ASTM A307)', pernos: nPernos, diam: '5/8"',
      demandaKg: demanda, capacidadKg: cap, levantamientoKg: levant, estado: ok ? 'CUMPLE' : 'NO_CUMPLE',
      motivo: ok ? 'Los pernos resisten el levantamiento por viento' + (tirSismo ? ' y el momento por sismo' : '') : 'Pernos insuficientes: usar Ø 3/4" o 6 pernos' };
  })();
  const estado: EstadoMemoria = grupos.some(g => g.estado === 'NO_CUMPLE') || sismo?.estado === 'NO_CUMPLE' || sismo?.dirY?.estado === 'NO_CUMPLE' || anclaje?.estado === 'NO_CUMPLE' ? 'NO_CUMPLE' : grupos.some(g => g.estado === 'OBSERVACION') ? 'OBSERVACION' : 'CUMPLE';
  return {
    datos: { tipo, luz, largo, alturaCol, alturaMax: ys.length ? Math.max(...ys) : 0, area, pendientePct, nCols: ctx.nCols, nPiezas: piezas.length, cobertura },
    cargas, grupos, reacciones, pesoTotalKg, kgM2: area > 0 ? pesoTotalKg / area : 0, estado, piezas, cuenta, tijeral: ctx.tijeral, sismo, zapata, anclaje,
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

/**
 * Cambios recomendados COMPLETOS (botón «Aplicar cambios recomendados» del 3D):
 *  1. el perfil más económico que cumple en cada pieza (como en Análisis estructural);
 *  2. si el sismo X (pórticos) no cumple deriva o flexión, las columnas metálicas pasan al tubo
 *     más económico del catálogo con el que sí cumplen (se recalcula la memoria con cada candidato);
 *  3. si el sismo Y (a lo largo) no cumple, se indica que hacen falta cruces de pared (las agrega el 3D).
 */
export function cambiosRecomendados(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, zonas: Record<string, CoverageZone3D>, inputs: EntradasCargas): {
  nuevos: Record<string, string>; columnaSismo: string | null; sinColumnaQueCumpla: boolean; necesitaCrucesY: boolean; sismoAntes: boolean;
} {
  // Todo sale de analizarPiezas (perfiles + columna con sismo, ver columnaQueCumple): el mismo resultado
  // que muestra la memoria. Aplicarlo deja la memoria en su punto fijo (aplicar otra vez no cambia nada).
  const piezas = analizarPiezas(nodes, segments, inputs);
  const nuevos: Record<string, string> = {};
  piezas.forEach(p => { if (p.optimoId && p.optimoId !== p.perfilId) nuevos[p.id] = p.optimoId; });
  const col = columnaQueCumple(nodes, segments, inputs, piezas);
  const antes = calcularMemoria(nodes, segments, zonas, inputs).sismo;
  const cambiaCol = piezas.some(p => p.rol === 'columna' && nuevos[p.id]);
  const columnaSismo = col && cambiaCol && !col.sinColumna && !!antes && antes.estado === 'NO_CUMPLE' ? (perfilDe(col.perfilId)?.nombre || null) : null;
  return { nuevos, columnaSismo, sinColumnaQueCumpla: !!col?.sinColumna, necesitaCrucesY: !!col?.necesitaCrucesY && !crucesPared(nodes, segments).length,
    sismoAntes: !!antes && antes.estado === 'NO_CUMPLE' };
}
