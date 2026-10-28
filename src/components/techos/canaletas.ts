// =============================================================================
// Canaletas y bajadas de agua automáticas. La canaleta va en el alero bajo
// (un lado en techos de una caída, los dos en dos aguas) a todo el largo del
// techo; las bajadas van en los extremos y cada 10 m como máximo. Se dibujan
// en el 3D y suman su metrado al presupuesto. Se pueden apagar por diseño
// (campo opcional `canaleta` en la cobertura principal).
// =============================================================================
import type { Node3D, CoverageZone3D } from './techosCadEngineTypes';
import { precio, itemCatalogo } from '../../lib/catalogoPrecios';
import { zonaPrincipal } from './mecanismoMovil';

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

export function metradoCanaletas(nodes: Record<string, Node3D>, zonas: Record<string, CoverageZone3D>): LineaCanaleta[] {
  if (!canaletaActiva(zonas)) return [];
  const ns = Object.values(nodes || {});
  if (ns.length < 2) return [];
  const zs = ns.map(n => n.z || 0);
  const largo = Math.max(...zs) - Math.min(...zs) + 2 * VUELO_ALERO_M;
  const aleros = alerosConCanaleta(perfilSuperior(nodes));
  if (!aleros.length || largo < 0.5) return [];
  const bajadasPorLado = posicionesBajadas(0, largo).length;
  const bajadas = bajadasPorLado * aleros.length;
  const alturaProm = aleros.reduce((s, a) => s + a.y, 0) / aleros.length;
  const tipo = zonaPrincipal(zonas)?.canaleta?.material || 'galvanizada';
  const out: LineaCanaleta[] = [];
  const add = (clave: string, cantidad: number, nota: string) => {
    if (cantidad <= 0) return;
    const it = itemCatalogo(clave); const p = precio(clave);
    out.push({ clave, nombre: it?.nombre || clave, unidad: it?.unidad || 'und', cantidad, precio: p, subtotal: cantidad * p, nota });
  };
  const mCanaleta = Math.ceil(largo * aleros.length * 1.05 * 10) / 10;
  add(tipo === 'pvc' ? 'agua:canaleta_pvc' : 'agua:canaleta_galv', mCanaleta, `${aleros.length} lado${aleros.length > 1 ? 's' : ''} × ${largo.toFixed(2)} m + 5 %`);
  add('agua:soporte', Math.ceil(largo / 0.8) * aleros.length, 'un soporte cada 80 cm');
  add('agua:tapa', 2 * aleros.length, 'tapa en cada extremo');
  add('agua:embudo', bajadas, 'salida de canaleta a bajada');
  add(tipo === 'pvc' ? 'agua:bajada_pvc' : 'agua:bajada_galv', Math.ceil(bajadas * (alturaProm + 0.3) * 10) / 10, `${bajadas} bajadas de ${alturaProm.toFixed(2)} m (una cada ${MAX_TRAMO_BAJADA_M} m como máximo)`);
  add('agua:abrazadera', bajadas * Math.max(2, Math.ceil(alturaProm / 1.2)), 'abrazadera cada 1.20 m');
  add('agua:codo', bajadas * 2, '2 codos por bajada');
  return out;
}
