// =============================================================================
// Canaletas y bajadas de agua automáticas. La canaleta va en el alero bajo
// (un lado en techos de una caída, los dos en dos aguas) a todo el largo del
// techo; las bajadas van en los extremos y cada 10 m como máximo. Se dibujan
// en el 3D y suman su metrado al presupuesto. Se pueden apagar por diseño
// (campo opcional `canaleta` en la cobertura principal).
// =============================================================================
import type { Node3D, Segment3D, CoverageZone3D, CanaletaCfg, FormaCanaleta, LadosCanaleta, BajadaCanaleta } from './techosCadEngineTypes';
import { precio, itemCatalogo } from '../../lib/catalogoPrecios';
import { zonaPrincipal } from './mecanismoMovil';
import { panoUnaAgua } from './coberturaAuto';

export const NOMBRE_FORMA: Record<FormaCanaleta, string> = { rectangular: 'Rectangular (U)', media_cana: 'Media caña (redonda)', moldura: 'Moldura / cornisa (K)', cajon: 'Cajón (canal ancho)', escondida: 'Escondida (detrás del muro)' };
export const NOMBRE_LADOS: Record<LadosCanaleta, string> = { caida: 'Solo en el borde de la caída', caida_lados: 'Caída y los costados', perimetro: 'Todo el borde del techo' };
export const NOMBRE_BAJADA: Record<BajadaCanaleta, string> = { tubo: 'Tubo de bajada hasta el piso', gargola: 'Gárgola (chorro libre, sin tubo)' };
export const cfgCanaleta = (zonas: Record<string, CoverageZone3D>): Required<CanaletaCfg> => {
  const c = zonaPrincipal(zonas)?.canaleta;
  const forma = c?.forma || 'rectangular';
  // La escondida va solo en el borde de la caída (detrás del parapeto) y es de plancha galvanizada.
  if (forma === 'escondida') return { activa: c?.activa !== false, material: 'galvanizada', forma, lados: 'caida', bajada: c?.bajada || 'gargola' };
  return { activa: c?.activa !== false, material: c?.material || 'galvanizada', forma, lados: c?.lados || 'caida', bajada: c?.bajada || 'tubo' };
};

type P3 = { x: number; y: number; z: number };
/** Un tramo de canaleta: puntos a lo largo del borde (altura del borde de la plancha),
 *  hacia dónde queda "afuera" (horizontal) y si es el borde de la caída (lleva bajadas). */
export interface TramoCanaleta { pts: P3[]; afuera: { x: number; z: number }; caida: boolean }

/** Bordes del techo que llevan canaleta según `lados`. Sirve para el 3D y el metrado. */
export function tramosCanaleta(nodes: Record<string, Node3D>, segments: Record<string, Segment3D> | undefined, lados: LadosCanaleta): TramoCanaleta[] {
  const V = VUELO_ALERO_M;
  const out: TramoCanaleta[] = [];
  const pl = segments ? panoUnaAgua(nodes, segments) : null;
  if (pl && Math.abs(pl.b) > 0.02 && Math.abs(pl.b) > Math.abs(pl.a)) {
    // Techo de una agua que cae a lo largo (Z).
    const [P0, P1, , P3] = pl.pts;
    const x0 = Math.min(P0.x, P1.x), x1 = Math.max(P0.x, P1.x), z0 = P0.z, z1 = P3.z;
    const y = (x: number, z: number) => P0.y + (x - P0.x) * pl.a + (z - z0) * pl.b;
    const bajaEnZ1 = P3.y < P0.y;
    const zb = bajaEnZ1 ? z1 + V : z0 - V, za = bajaEnZ1 ? z0 : z1;
    out.push({ pts: [{ x: x0, y: y(x0, zb), z: zb }, { x: x1, y: y(x1, zb), z: zb }], afuera: { x: 0, z: bajaEnZ1 ? 1 : -1 }, caida: true });
    if (lados !== 'caida') {
      [x0, x1].forEach((x, i) => out.push({ pts: [{ x, y: y(x, za), z: za }, { x, y: y(x, zb), z: zb }], afuera: { x: i ? 1 : -1, z: 0 }, caida: false }));
    }
    if (lados === 'perimetro') out.push({ pts: [{ x: x0, y: y(x0, za), z: za }, { x: x1, y: y(x1, za), z: za }], afuera: { x: 0, z: bajaEnZ1 ? -1 : 1 }, caida: false });
    return out;
  }
  // Techo que cae a lo ancho (X): perfil superior por x, a lo largo de Z.
  const perfil = perfilSuperior(nodes);
  if (perfil.length < 2) return [];
  const zs = Object.values(nodes).map(n => n.z || 0);
  const zMin = Math.min(...zs) - V, zMax = Math.max(...zs) + V;
  const aleros = alerosConCanaleta(perfil);
  aleros.forEach(al => {
    const x = al.x + al.hacia * V;
    out.push({ pts: [{ x, y: al.y, z: zMin }, { x, y: al.y, z: zMax }], afuera: { x: al.hacia, z: 0 }, caida: true });
  });
  if (lados !== 'caida') {
    // Costados (frente y fondo): siguen el perfil del techo.
    [zMin, zMax].forEach((z, i) => out.push({ pts: perfil.map(p => ({ x: p.x, y: p.y, z })), afuera: { x: 0, z: i ? 1 : -1 }, caida: false }));
  }
  if (lados === 'perimetro' && aleros.length === 1) {
    const a = perfil[0], b = perfil[perfil.length - 1];
    const alto = aleros[0].hacia < 0 ? b : a, hacia = aleros[0].hacia < 0 ? 1 : -1;
    out.push({ pts: [{ x: alto.x + hacia * V, y: alto.y, z: zMin }, { x: alto.x + hacia * V, y: alto.y, z: zMax }], afuera: { x: hacia, z: 0 }, caida: false });
  }
  return out;
}

const largoTramo = (t: TramoCanaleta) => t.pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - t.pts[i].x, p.y - t.pts[i].y, p.z - t.pts[i].z), 0);

export const MAX_TRAMO_BAJADA_M = 10;
export const VUELO_ALERO_M = 0.30;

export interface AleroCanaleta { x: number; y: number; hacia: -1 | 1 } // hacia: lado del alero (−x / +x)

/** Perfil superior del techo (altura máxima en cada x). */
export function perfilSuperior(nodes: Record<string, Node3D>) {
  const mapa = new Map<number, number>();
  Object.values(nodes || {}).forEach(n => { const x = Math.round(n.x * 20) / 20; mapa.set(x, Math.max(mapa.get(x) ?? -Infinity, n.y)); });
  return [...mapa.entries()].map(([x, y]) => ({ x, y })).sort((a, b) => a.x - b.x);
}

/** Aleros que llevan canaleta, a partir del perfil superior. */
export function alerosConCanaleta(perfil: { x: number; y: number }[]): AleroCanaleta[] {
  if (perfil.length < 2) return [];
  const a = perfil[0], b = perfil[perfil.length - 1];
  const yMax = Math.max(...perfil.map(p => p.y));
  const iMax = perfil.findIndex(p => p.y === yMax);
  const span = Math.max(0.001, b.x - a.x);
  const dosAguas = (perfil[iMax].x - a.x) > span * 0.2 && (b.x - perfil[iMax].x) > span * 0.2 && yMax - Math.min(a.y, b.y) > 0.15;
  if (dosAguas) return [{ x: a.x, y: a.y, hacia: -1 }, { x: b.x, y: b.y, hacia: 1 }];
  return a.y <= b.y + 0.01 ? [{ x: a.x, y: a.y, hacia: -1 }] : [{ x: b.x, y: b.y, hacia: 1 }];
}

export const canaletaActiva = (zonas: Record<string, CoverageZone3D>) => {
  const z = zonaPrincipal(zonas);
  return !!z && z.canaleta?.activa !== false;
};

/** Posiciones (z) de las bajadas a lo largo de una canaleta. */
export function posicionesBajadas(z0: number, z1: number): number[] {
  const L = Math.abs(z1 - z0);
  const n = Math.max(2, Math.ceil(L / MAX_TRAMO_BAJADA_M) + 1);
  return Array.from({ length: n }, (_, i) => z0 + ((z1 - z0) * i) / (n - 1));
}

export interface LineaCanaleta { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota: string }

export function metradoCanaletas(nodes: Record<string, Node3D>, zonas: Record<string, CoverageZone3D>, segments?: Record<string, Segment3D>): LineaCanaleta[] {
  if (!canaletaActiva(zonas)) return [];
  if (Object.keys(nodes || {}).length < 2) return [];
  const cfg = cfgCanaleta(zonas);
  const tramos = tramosCanaleta(nodes, segments, cfg.lados);
  const caidas = tramos.filter(t => t.caida);
  if (!caidas.length) return [];
  const largoTotal = tramos.reduce((s, t) => s + largoTramo(t), 0);
  if (largoTotal < 0.5) return [];
  const bajadas = caidas.reduce((n, t) => n + posicionesBajadas(0, largoTramo(t)).length, 0);
  const alturaProm = caidas.reduce((s, t) => s + t.pts[0].y, 0) / caidas.length;
  const tipo = cfg.material;
  const out: LineaCanaleta[] = [];
  const add = (clave: string, cantidad: number, nota: string) => {
    if (cantidad <= 0) return;
    const it = itemCatalogo(clave); const p = precio(clave);
    out.push({ clave, nombre: it?.nombre || clave, unidad: it?.unidad || 'und', cantidad, precio: p, subtotal: cantidad * p, nota });
  };
  const mCanaleta = Math.ceil(largoTotal * 1.05 * 10) / 10;
  add(tipo === 'pvc' ? 'agua:canaleta_pvc' : 'agua:canaleta_galv', mCanaleta, `${NOMBRE_FORMA[cfg.forma]} · ${NOMBRE_LADOS[cfg.lados].toLowerCase()} · ${largoTotal.toFixed(2)} m + 5 %`);
  const escondida = cfg.forma === 'escondida';
  add('agua:soporte', tramos.reduce((n, t) => n + Math.ceil(largoTramo(t) / 0.8), 0), escondida ? 'un soporte anclado al muro cada 80 cm' : 'un soporte cada 80 cm');
  if (escondida) {
    // Canaleta escondida: babeta que sella el muro sobre la canaleta y un rebose por tramo
    // (si se tapa, el agua sale a la calle y no al interior). El parapeto es obra de albañilería.
    add('agua:babeta', Math.ceil(largoTotal * 1.05 * 10) / 10, 'babeta / tapajuntas a lo largo del muro (el parapeto se cotiza en Obra Civil)');
    add('agua:rebose', caidas.length, 'un rebose por canaleta, más arriba que la salida');
  }
  // Tapas en los extremos abiertos: todo el borde no tiene; con costados quedan 2 por caída en la parte alta.
  add('agua:tapa', cfg.lados === 'perimetro' ? 0 : 2 * caidas.length, 'tapa en cada extremo');
  if (cfg.lados !== 'caida') add('agua:esquinero', cfg.lados === 'perimetro' ? 4 : 2 * caidas.length, 'unión en las esquinas');
  if (cfg.bajada === 'gargola') {
    add('agua:gargola', bajadas, escondida ? 'gárgola que atraviesa el muro (salida a la calle)' : 'salida libre del agua (sin tubo de bajada)');
  } else {
    add('agua:embudo', bajadas, 'salida de canaleta a bajada');
    add(tipo === 'pvc' ? 'agua:bajada_pvc' : 'agua:bajada_galv', Math.ceil(bajadas * (alturaProm + 0.3) * 10) / 10, `${bajadas} bajadas de ${alturaProm.toFixed(2)} m (una cada ${MAX_TRAMO_BAJADA_M} m como máximo)`);
    add('agua:abrazadera', bajadas * Math.max(2, Math.ceil(alturaProm / 1.2)), 'abrazadera cada 1.20 m (a columna o muro)');
    add('agua:codo', bajadas * 2, '2 codos por bajada');
  }
  return out;
}
