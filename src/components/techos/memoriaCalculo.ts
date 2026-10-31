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
import { propsPerfil, factorK, limitesLambda, seAnaliza, cumpleTramo, perfilRecomendado, CargasGrupo } from './propiedadesPerfil';
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
  id: string; rol: string; nombre: string; perfilId: string; perfil: string; L: number;
  lambda: number; limite: number; PcrkN: number; ratio: number | null; riesgo: Riesgo;
}

/** Cada pieza con su esbeltez, carga crítica y riesgo (para el 3D y el detalle). */
export function analizarPiezas(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, inputs: EntradasCargas): PiezaAnalizada[] {
  const { cargasDe } = contextoCargas(nodes, segments, inputs);
  const lista: PiezaAnalizada[] = [];
  Object.values(segments).forEach(s => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    if (!a || !b || !seAnaliza(s.rolEstructural)) return;
    const L = largoDe(nodes, s);
    const p = perfilDe(s.profileId);
    const pr = propsPerfil(p) || { areaCm2: 4, iMinCm4: 6, rMinCm: 1.2, iMaxCm4: 6 };
    const K = factorK(s.rolEstructural);
    const lambda = (K * L * 100) / pr.rMinCm;
    const lim = limitesLambda(s.rolEstructural);
    const PcrkN = (Math.PI ** 2 * E_ACERO * pr.iMinCm4 * 1e-8) / Math.pow(K * Math.max(L, 0.01), 2) / 1000;
    const v = verificar(p, s.rolEstructural, L, cargasDe(s.rolEstructural));
    const ratio = v ? v.ratio : null;
    // ALTO: pasa la esbeltez máxima o la carga/flecha supera lo admisible.
    const riesgo: Riesgo = lambda > lim.maximo || (ratio !== null && ratio > 1) ? 'ALTO'
      : (p && cumpleTramo(p, s.rolEstructural, L, cargasDe(s.rolEstructural))) || lambda <= lim.bajo ? 'BAJO' : 'MEDIO';
    lista.push({ id: s.id, rol: s.rolEstructural, nombre: '', perfilId: s.profileId, perfil: p?.nombre || s.profileId, L, lambda, limite: lim.maximo, PcrkN, ratio, riesgo });
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
  rol: string; nombreRol: string; perfilId: string; perfil: string; cant: number; Lmax: number; Ltot: number; pesoKg: number;
  lambdaMax: number; lambdaLim: number;
  verif: { tipo: 'axial' | 'flecha'; demanda: number; capacidad: number; ratio: number } | null;
  estado: EstadoMemoria; motivo: string; recomendado?: string; recomendadoId?: string;
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

  // Grupos: tipo de pieza + perfil. Manda el tramo más largo.
  const mapa = new Map<string, PiezaAnalizada[]>();
  piezas.forEach(p => { const k = `${p.rol}|${p.perfilId}`; mapa.set(k, [...(mapa.get(k) || []), p]); });
  const orden = ['columna', 'viga_principal', 'cordon_superior', 'cordon_inferior', 'montante', 'diagonal', 'viga_secundaria', 'correa', 'arriostre'];
  const grupos: GrupoMemoria[] = [...mapa.values()].map(arr => {
    const { rol, perfilId } = arr[0];
    const p = perfilDe(perfilId);
    const Lmax = Math.max(...arr.map(x => x.L)), Ltot = arr.reduce((s, x) => s + x.L, 0);
    const lambdaMax = Math.max(...arr.map(x => x.lambda));
    const lim = limitesLambda(rol as RolEstructuralSegmento);
    const cargas = ctx.cargasDe(rol);
    const v = verificar(p, rol, Lmax, cargas);
    let estado: EstadoMemoria = 'CUMPLE', motivo = 'Cumple esbeltez' + (v ? (v.tipo === 'axial' ? ' y carga axial' : ' y flecha') : '');
    if (lambdaMax > lim.maximo) { estado = 'NO_CUMPLE'; motivo = `Esbeltez ${lambdaMax.toFixed(0)} > ${lim.maximo}`; }
    else if (v && v.ratio > 1) { estado = 'NO_CUMPLE'; motivo = v.tipo === 'axial' ? `Carga ${v.demanda.toFixed(1)} kN > admisible ${v.capacidad.toFixed(1)} kN` : `Flecha ${v.demanda.toFixed(0)} mm > ${v.capacidad.toFixed(0)} mm`; }
    else if (p && !cumpleTramo(p, rol as RolEstructuralSegmento, Lmax, cargas)) { estado = 'OBSERVACION'; motivo = rol === 'columna' ? 'Espesor o lado menor al mínimo de obra (2 mm · 50 mm)' : 'Espesor menor al mínimo de obra'; }
    else if (lambdaMax > lim.bajo) { motivo += ' · esbeltez cerca del límite'; }
    const rec = estado !== 'CUMPLE' ? perfilRecomendado(INVENTARIO_PERFILES_TUBULARES, p, rol as RolEstructuralSegmento, Lmax, cargas) : null;
    return {
      rol, nombreRol: nombreRol(rol), perfilId, perfil: p?.nombre || perfilId, cant: arr.length, Lmax, Ltot,
      pesoKg: Ltot * (p?.pesoLinealKgM || 0), lambdaMax, lambdaLim: lim.maximo, verif: v, estado, motivo,
      recomendado: rec && rec.id !== perfilId ? rec.nombre : (estado !== 'CUMPLE' && !rec ? 'Ningún perfil del catálogo alcanza: agrega un apoyo o arriostre intermedio' : undefined),
      recomendadoId: rec && rec.id !== perfilId ? rec.id : undefined,
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

/** Perfil que cumple para cada pieza de los grupos que no cumplen (id de pieza → id de perfil). */
export function perfilesQueCumplen(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, inputs: EntradasCargas): Record<string, string> {
  const m = calcularMemoria(nodes, segments, {}, inputs);
  const nuevos: Record<string, string> = {};
  m.grupos.forEach(g => {
    if (!g.recomendadoId) return;
    m.piezas.forEach(p => { if (p.rol === g.rol && p.perfilId === g.perfilId) nuevos[p.id] = g.recomendadoId!; });
  });
  return nuevos;
}
