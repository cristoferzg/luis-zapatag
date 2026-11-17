// =============================================================================
// Cinta LED en vigas (techo sol y sombra, pérgolas). Las vigas marcadas con
// `led: true` llevan cinta LED por debajo: se dibuja encendida en el 3D (más
// fuerte de noche) y suma cinta, perfil difusor, fuentes y conectores al
// presupuesto. Campo opcional: los diseños anteriores no cambian.
// =============================================================================
import type { Node3D, Segment3D } from './techosCadEngineTypes';
import { precio, itemCatalogo } from '../../lib/catalogoPrecios';

export const METROS_POR_FUENTE_LED = 10; // una fuente de 12 V cada 10 m de cinta

export const largoLed = (nodes: Record<string, Node3D>, segments: Record<string, Segment3D>) =>
  Object.values(segments || {}).filter(s => s.led).reduce((t, s) => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    return a && b ? t + Math.hypot(b.x - a.x, b.y - a.y, (b.z || 0) - (a.z || 0)) : t;
  }, 0);

export interface LineaLed { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota: string }

export function metradoLed(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>): LineaLed[] {
  const L = largoLed(nodes, segments);
  if (L < 0.5) return [];
  const tramos = Object.values(segments).filter(s => s.led).length;
  const out: LineaLed[] = [];
  const add = (clave: string, cantidad: number, nota: string) => {
    if (cantidad <= 0) return;
    const it = itemCatalogo(clave); const p = precio(clave);
    out.push({ clave, nombre: it?.nombre || clave, unidad: it?.unidad || 'und', cantidad, precio: p, subtotal: cantidad * p, nota });
  };
  const m = Math.ceil(L * 1.05 * 10) / 10;
  add('led:cinta', m, `${tramos} tramos · ${L.toFixed(2)} m + 5 %`);
  add('led:perfil', m, 'perfil de aluminio con difusor');
  add('led:fuente', Math.max(1, Math.ceil(L / METROS_POR_FUENTE_LED)), `una cada ${METROS_POR_FUENTE_LED} m`);
  add('led:conector', tramos * 2, '2 por tramo');
  add('led:cable', Math.ceil(L * 0.5 + 5), 'alimentación (≈ mitad del recorrido + 5 m)');
  add('led:control', 1, 'interruptor / control remoto');
  return out;
}
