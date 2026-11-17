// CERRAMIENTO LATERAL (paredes de aluzinc) de una nave de Techos Metálicos.
// Las planchas van verticales por fuera de las columnas, atornilladas a LARGUEROS (correas de pared)
// horizontales que van de columna a columna. Se guarda como la canaleta: en la zona principal de cobertura
// (`cerramiento`), así viaja con el diseño. Este archivo da la geometría (3D, CAD) y el metrado (costos).
//  • Lados: izquierda (x mínima) y derecha (x máxima) = los costados de la luz; adelante / atrás = frontis.
//  • Altura: desde `desdeM` (0 = desde el piso; o encima de un muro / zócalo) hasta la cabeza de las columnas.
//  • Separación recomendada de largueros: 1.50 m con plancha ≥ 0.40 mm y vanos ≤ 6 m; 1.20 m si la plancha
//    es más delgada o el vano entre columnas es mayor (más viento por larguero).
import type { Node3D, Segment3D, CoverageZone3D, PerfilTubularItem, CerramientoCfg } from './techosCadEngineTypes';
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS } from './techosCadCatalog';
import { zonaPrincipal } from './mecanismoMovil';
import { precio, claveCobertura } from '../../lib/catalogoPrecios';
import { precioMetroPerfil } from './memoriaCalculo';
import { cumpleTramo } from './propiedadesPerfil';

export type LadoCerramiento = 'izquierda' | 'derecha' | 'adelante' | 'atras';
export const NOMBRE_LADO_CERR: Record<LadoCerramiento, string> = { izquierda: 'Costado izquierdo', derecha: 'Costado derecho', adelante: 'Frontis adelante', atras: 'Frontis atrás' };
export type { CerramientoCfg };

export const cfgCerramiento = (zonas: Record<string, CoverageZone3D>): Required<CerramientoCfg> => {
  const c = zonaPrincipal(zonas)?.cerramiento;
  return {
    activo: c?.activo === true,
    lados: c?.lados?.length ? c.lados : ['izquierda', 'derecha'],
    desdeM: Math.max(0, c?.desdeM ?? 0),
    coberturaId: c?.coberturaId || 'cob_aluzinc_tr4_040',
    separacionM: c?.separacionM || 0,          // 0 = la recomendada
    perfilId: c?.perfilId || '',              // '' = el recomendado por viento
  };
};
export const cerramientoActivo = (zonas: Record<string, CoverageZone3D>) => cfgCerramiento(zonas).activo;

interface Col { x: number; z: number; yTop: number; ancho: number; alto: number }
export interface Larguero { lado: LadoCerramiento; a: [number, number, number]; b: [number, number, number]; largo: number }
export interface PanoPared { lado: LadoCerramiento; pts: [number, number, number][]; largo: number; alto: number; normal: [number, number, number] }
export interface GeometriaCerramiento {
  largueros: Larguero[]; panos: PanoPared[]; perfil: PerfilTubularItem; separacion: number; separacionRecomendada: number;
  filas: number; areaM2: number; metrosLarguero: number; vanoMax: number;
}

const perfilDe = (id: string) => INVENTARIO_PERFILES_TUBULARES.find(p => p.id === id);

/** Presión de viento de diseño sobre la pared (Pa): ≈ 40 kg/m² (E.020, presión + succión, viento de la costa y sierra). */
export const VIENTO_PARED_PA = 392;

/**
 * Perfil del larguero: el elegido, o el tubo MÁS ECONÓMICO que cumple con el viento sobre la pared
 * (flecha ≤ L/180 con la carga de su franja = presión × separación; el lado alto va perpendicular a la pared).
 */
export function perfilLarguero(cfg: Required<CerramientoCfg>, vano: number, sep: number): PerfilTubularItem {
  if (cfg.perfilId && perfilDe(cfg.perfilId)) return perfilDe(cfg.perfilId)!;
  const qNm = VIENTO_PARED_PA * sep;
  const ok = INVENTARIO_PERFILES_TUBULARES
    .filter(p => (p.categoria === 'tubo_rectangular' || p.categoria === 'tubo_cuadrado') && !p.id.includes('galv') && p.espesorMm >= 1.2)
    .map(p => ({ p, $: precioMetroPerfil(p) }))
    .filter(x => x.$ > 0 && cumpleTramo(x.p, 'correa', Math.max(1, vano), { qNm }))
    .sort((a, b) => a.$ - b.$ || a.p.pesoLinealKgM - b.p.pesoLinealKgM);
  return ok[0]?.p || INVENTARIO_PERFILES_TUBULARES.find(p => p.categoria === 'tubo_rectangular' && p.anchoMm >= 100) || INVENTARIO_PERFILES_TUBULARES[0];
}

/** Separación recomendada entre largueros (m). */
export function separacionRecomendada(coberturaId: string, vanoMax: number): number {
  const esp = INVENTARIO_COBERTURAS.find(c => c.id === coberturaId)?.espesorMm || 0.4;
  return esp >= 0.4 && vanoMax <= 6.01 ? 1.5 : 1.2;
}

function columnas(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>): Col[] {
  const out: Col[] = [];
  Object.values(segments).forEach(s => {
    if (!/^columna/.test(s.rolEstructural || '')) return;
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    if (!a || !b || Math.abs(a.y - b.y) < 0.5) return;
    const [bajo, alto] = a.y <= b.y ? [a, b] : [b, a];
    if (bajo.y > 0.4) return; // columnas de un segundo nivel o apoyos elevados: no
    const p = perfilDe(s.profileId);
    const conc = s.rolEstructural === 'columna_concreto' ? (s.seccionCm?.[0] || 25) / 100 : 0;
    out.push({ x: bajo.x, z: bajo.z || 0, yTop: alto.y, ancho: conc || (p?.anchoMm || 100) / 1000, alto: conc || ((p?.altoMm || p?.anchoMm || 100) / 1000) });
  });
  return out;
}

export function geometriaCerramiento(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, zonas: Record<string, CoverageZone3D>): GeometriaCerramiento | null {
  const cfg = cfgCerramiento(zonas);
  if (!cfg.activo) return null;
  const cols = columnas(nodes, segments);
  if (cols.length < 2) return null;
  const xMin = Math.min(...cols.map(c => c.x)), xMax = Math.max(...cols.map(c => c.x));
  const zMin = Math.min(...cols.map(c => c.z)), zMax = Math.max(...cols.map(c => c.z));
  const lineas: { lado: LadoCerramiento; cols: Col[]; eje: 'z' | 'x'; fuera: number }[] = [
    { lado: 'izquierda', cols: cols.filter(c => Math.abs(c.x - xMin) < 0.06).sort((a, b) => a.z - b.z), eje: 'z', fuera: -1 },
    { lado: 'derecha', cols: cols.filter(c => Math.abs(c.x - xMax) < 0.06).sort((a, b) => a.z - b.z), eje: 'z', fuera: 1 },
    { lado: 'atras', cols: cols.filter(c => Math.abs(c.z - zMin) < 0.06).sort((a, b) => a.x - b.x), eje: 'x', fuera: -1 },
    { lado: 'adelante', cols: cols.filter(c => Math.abs(c.z - zMax) < 0.06).sort((a, b) => a.x - b.x), eje: 'x', fuera: 1 },
  ];
  // Vano más largo entre columnas de las paredes elegidas (manda la separación de largueros).
  let vanoMax = 0;
  lineas.filter(l => cfg.lados.includes(l.lado)).forEach(l => l.cols.slice(1).forEach((c, i) => {
    vanoMax = Math.max(vanoMax, l.eje === 'z' ? c.z - l.cols[i].z : c.x - l.cols[i].x);
  }));
  const sepRec = separacionRecomendada(cfg.coberturaId, vanoMax);
  const sep = cfg.separacionM > 0.3 ? cfg.separacionM : sepRec;
  const perfil = perfilLarguero(cfg, vanoMax, sep);
  const dL = Math.max(perfil.anchoMm, perfil.altoMm || perfil.anchoMm) / 1000; // el lado alto del larguero, perpendicular a la pared (resiste el viento)
  const largueros: Larguero[] = [], panos: PanoPared[] = [];
  let filasMax = 0;
  lineas.forEach(l => {
    if (!cfg.lados.includes(l.lado) || l.cols.length < 2) return;
    const colMedio = Math.max(...l.cols.map(c => (l.eje === 'z' ? c.ancho : c.alto))) / 2;
    const off = l.fuera * (colMedio + dL / 2);            // eje del larguero, pegado a la cara de afuera de las columnas
    const offPlancha = l.fuera * (colMedio + dL + 0.01);  // plancha por fuera del larguero
    const y0 = cfg.desdeM, yTop = Math.min(...l.cols.map(c => c.yTop));
    if (yTop - y0 < 0.5) return;
    // Filas: una abajo (a 15 cm), una arriba (15 cm bajo la cabeza) y las de en medio a no más de `sep`.
    const yA = y0 + 0.15, yB = yTop - 0.15;
    const filas = Math.max(2, Math.ceil((yB - yA) / sep - 1e-6) + 1);
    filasMax = Math.max(filasMax, filas);
    const ys = Array.from({ length: filas }, (_, k) => yA + (yB - yA) * k / (filas - 1));
    const p = (s: number, y: number, o: number): [number, number, number] => l.eje === 'z' ? [l.cols[0].x + o, y, s] : [s, y, l.cols[0].z + o];
    const s0 = l.eje === 'z' ? l.cols[0].z : l.cols[0].x, s1 = l.eje === 'z' ? l.cols[l.cols.length - 1].z : l.cols[l.cols.length - 1].x;
    l.cols.slice(1).forEach((c, i) => {
      const a = l.eje === 'z' ? l.cols[i].z : l.cols[i].x, b = l.eje === 'z' ? c.z : c.x;
      ys.forEach(y => largueros.push({ lado: l.lado, a: p(a, y, off), b: p(b, y, off), largo: b - a }));
    });
    // La plancha cubre de punta a punta (más la columna de cada extremo) y de `desdeM` a la cabeza.
    const e0 = s0 - colMedio, e1 = s1 + colMedio;
    panos.push({ lado: l.lado, largo: e1 - e0, alto: yTop - y0,
      pts: [p(e0, y0, offPlancha), p(e1, y0, offPlancha), p(e1, yTop, offPlancha), p(e0, yTop, offPlancha)],
      normal: l.eje === 'z' ? [l.fuera, 0, 0] : [0, 0, l.fuera] });
  });
  if (!panos.length) return null;
  return { largueros, panos, perfil, separacion: sep, separacionRecomendada: sepRec, filas: filasMax,
    areaM2: panos.reduce((t, q) => t + q.largo * q.alto, 0), metrosLarguero: largueros.reduce((t, g) => t + g.largo, 0), vanoMax };
}

export interface LineaCerramiento { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota: string }

/** Materiales del cerramiento: planchas, largueros, pernos autoperforantes y esquineros. */
export function metradoCerramiento(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, zonas: Record<string, CoverageZone3D>): LineaCerramiento[] {
  const g = geometriaCerramiento(nodes, segments, zonas);
  if (!g) return [];
  const cfg = cfgCerramiento(zonas);
  const cob = INVENTARIO_COBERTURAS.find(c => c.id === cfg.coberturaId) || INVENTARIO_COBERTURAS[0];
  const out: LineaCerramiento[] = [];
  const add = (clave: string, nombre: string, unidad: string, cantidad: number, pu: number, nota: string) => {
    if (cantidad <= 0) return;
    out.push({ clave, nombre, unidad, cantidad, precio: pu, subtotal: cantidad * pu, nota });
  };
  const util = (cob.anchoUtilMm || 1000) / 1000;
  const planchas = g.panos.reduce((t, q) => t + Math.ceil(q.largo / util), 0);
  const altoProm = g.panos.reduce((t, q) => t + q.alto, 0) / g.panos.length;
  const m2Compra = g.panos.reduce((t, q) => t + Math.ceil(q.largo / util) * util * q.alto, 0);
  add(`cerr:${cob.id}`, `${cob.nombre} (paredes)`, 'm²', Math.ceil(m2Compra * 10) / 10, precio(claveCobertura(cob.id), cob.costoM2Sol),
    `${planchas} planchas verticales de ${altoProm.toFixed(2)} m · ${g.panos.map(q => NOMBRE_LADO_CERR[q.lado].toLowerCase()).join(', ')}`);
  const barras = Math.ceil(g.metrosLarguero * 1.05 / (g.perfil.longitudComercialM || 6));
  add(`cerr:larguero`, `Largueros: ${g.perfil.nombre}`, 'm', Math.ceil(g.metrosLarguero * 10) / 10, precioMetroPerfil(g.perfil),
    `${g.filas} filas a ${g.separacion.toFixed(2)} m${Math.abs(g.separacion - g.separacionRecomendada) < 0.01 ? ' (recomendado)' : ''} · ${barras} barras de ${g.perfil.longitudComercialM || 6} m`);
  const pernos = Math.ceil(g.areaM2 * (cob.pernosRequeridosPorM2 || 4));
  add('cerr:pernos', 'Pernos autoperforantes con arandela (paredes)', 'und', pernos, precio('techos:perno_epdm', 38) / 100, `${(cob.pernosRequeridosPorM2 || 4)} por m² en cada larguero`);
  // Esquineros (remate de esquina) donde se juntan dos paredes elegidas, y remate arriba de cada pared.
  const L = new Set(g.panos.map(q => q.lado));
  const esquinas = (['izquierda', 'derecha'] as const).reduce((n, a) => n + (['adelante', 'atras'] as const).filter(b => L.has(a) && L.has(b)).length, 0);
  add('cerr:remates', 'Remates de aluzinc (esquinas y borde superior)', 'm', Math.ceil((esquinas * altoProm + g.panos.reduce((t, q) => t + q.largo, 0)) * 10) / 10, precio('techos:remate', 12),
    `${esquinas} esquineros + remate superior`);
  return out;
}
