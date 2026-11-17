// =============================================================================
// Cruces de arriostre en las PAREDES laterales (dirección Y, a lo largo de la nave).
// Sin ellas, en la dirección Y las columnas trabajan solas en voladizo. Con una cruz de
// varilla lisa (tensor con templador) en el primer y el último paño de cada costado, el
// sismo Y lo toman las varillas a tracción y la nave queda mucho más rígida.
// =============================================================================
import type { Node3D, Segment3D } from './techosCadEngineTypes';
import { modeloTensor } from './tensores';

const r2 = (v: number) => Math.round(v * 100) / 100;

interface ColInfo { id: string; base: string; top: string; z: number; x: number }
function columnas(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>): ColInfo[] {
  return Object.values(segments).filter(s => /^columna/.test(s.rolEstructural || '') && nodes[s.nodeAId] && nodes[s.nodeBId]).map(s => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    const [base, top] = a.y <= b.y ? [a, b] : [b, a];
    return { id: s.id, base: base.id, top: top.id, z: base.z || 0, x: base.x };
  });
}
const lados = (cols: ColInfo[]) => {
  const m = new Map<number, ColInfo[]>();
  cols.forEach(c => { const k = r2(c.x); m.set(k, [...(m.get(k) || []), c]); });
  return [...m.values()].map(v => v.sort((p, q) => p.z - q.z));
};

/** Cruces de pared existentes: tensores o arriostres verticales entre columnas de un mismo costado. */
export function crucesPared(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>): Segment3D[] {
  const cols = columnas(nodes, segments);
  const xs = new Set(cols.map(c => r2(c.x)));
  return Object.values(segments).filter(s => {
    if (!/arriostre|tensor_viento/.test(s.rolEstructural || '')) return false;
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    if (!a || !b) return false;
    return Math.abs(a.x - b.x) < 0.05 && xs.has(r2(a.x)) && Math.abs(a.y - b.y) > 0.5 && Math.abs((a.z || 0) - (b.z || 0)) > 0.5;
  });
}

/** Agrega una cruz (2 varillas) en el primer y el último paño de cada costado. */
export function agregarCrucesPared(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, modelo = 'TEN-VAR-58'): Record<string, Segment3D> {
  const out = { ...segments };
  const existe = new Set(crucesPared(nodes, segments).map(s => [s.nodeAId, s.nodeBId].sort().join('|')));
  const perfil = modeloTensor(modelo) ? modelo : 'TEN-VAR-58';
  lados(columnas(nodes, segments)).forEach((fila, li) => {
    if (fila.length < 2) return;
    const panos = fila.length === 2 ? [0] : [0, fila.length - 2];
    panos.forEach(i => {
      const c1 = fila[i], c2 = fila[i + 1];
      [[c1.base, c2.top], [c2.base, c1.top]].forEach(([a, b], k) => {
        const clave = [a, b].sort().join('|');
        if (existe.has(clave)) return;
        const id = `s_cruz_pared_${li}_${i}_${k}`;
        out[id] = { id, nodeAId: a, nodeBId: b, profileId: perfil, rolEstructural: 'tensor_viento', funcionTensor: 'cruz', tensorAuto: true } as Segment3D;
      });
    });
  });
  return out;
}
