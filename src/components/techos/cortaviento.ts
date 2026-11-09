// Techo CON CORTAVIENTO (sin cumbrera): la nave a dos aguas o parabólica se parte en la
// cumbrera; un lado sube `abertura` metros y vuela `vuelo` metros por encima del otro.
// Queda una ranura vertical a lo largo de toda la nave por donde sale el aire caliente
// y no entra la lluvia (el lado alto la tapa).
//
// Función pura: recibe la nave ya armada y devuelve una nueva.
//  • El lado alto se levanta de forma gradual: 0 en su alero (las columnas no cambian)
//    y `abertura` en la cumbrera.
//  • En la cumbrera cada nodo se duplica: el original queda con el lado bajo y la copia
//    (etiqueta "…-CV") sube con el lado alto; un montante une los dos.
//  • El cordón superior del lado alto se prolonga `vuelo` m sobre el lado bajo (nodo
//    "CORTAVIENTO-n") y lleva sus correas, para que la plancha vuele encima.
import type { Node3D, Segment3D } from './techosCadEngineTypes';

export interface OpcionesCortaviento {
  abertura: number;            // m que sube el lado alto en la cumbrera (alto de la ranura)
  vuelo: number;               // m que el lado alto pasa por encima del lado bajo
  ladoAlto: 'derecha' | 'izquierda';
  moverInferior: boolean;      // parabólico: también sube el arco inferior (el tijeral sigue paralelo)
}

const ROLES_TIJERAL = new Set(['cordon_superior', 'cordon_inferior', 'montante', 'diagonal']);

export const esCortaviento = (nodes: Record<string, object | undefined>) =>
  Object.values(nodes).some(n => /^CORTAVIENTO-/.test((n as { nodeLabel?: string } | undefined)?.nodeLabel || ''));

export function aplicarCortaviento(
  nodesIn: Record<string, Node3D>, segsIn: Record<string, Segment3D>, o: OpcionesCortaviento,
): { nodes: Record<string, Node3D>; segs: Record<string, Segment3D> } | null {
  const lista = Object.values(nodesIn);
  if (!lista.length || o.abertura <= 0) return null;
  const xMin = Math.min(...lista.map(n => n.x)), xMax = Math.max(...lista.map(n => n.x));
  const luz = xMax - xMin;
  if (luz < 2) return null;
  // Se trabaja siempre con el lado alto a la derecha; la izquierda es su espejo.
  const espejo = o.ladoAlto === 'izquierda';
  const ex = (x: number) => (espejo ? xMin + xMax - x : x);
  const nodes: Record<string, Node3D> = {};
  lista.forEach(n => { nodes[n.id] = { ...n, x: ex(n.x) }; });
  const segs: Record<string, Segment3D> = {};
  Object.values(segsIn).forEach(s => { segs[s.id] = { ...s }; });

  const xc = xMin + luz / 2;
  const EPS = 0.02;
  const enCumbrera = (n: Node3D) => Math.abs(n.x - xc) < EPS;

  // Nodos de cordón superior / del tijeral.
  const sup = new Set<string>(), tij = new Set<string>();
  Object.values(segs).forEach(s => {
    if (s.rolEstructural === 'cordon_superior') { sup.add(s.nodeAId); sup.add(s.nodeBId); }
    if (ROLES_TIJERAL.has(s.rolEstructural || '')) { tij.add(s.nodeAId); tij.add(s.nodeBId); }
  });
  const sube = (id: string) => sup.has(id) || (o.moverInferior && tij.has(id));
  // Debe haber nodo de cumbrera en cada pórtico (si no, la nave no se puede partir).
  const cumbre = Object.values(nodes).filter(n => enCumbrera(n) && sup.has(n.id));
  if (!cumbre.length) return null;

  // 1) Lado alto: sube gradual hasta la cumbrera.
  const original = Object.fromEntries(Object.values(nodes).map(n => [n.id, { x: n.x, y: n.y }]));
  Object.values(nodes).forEach(n => {
    if (n.x > xc + EPS && sube(n.id)) n.y += o.abertura * Math.max(0, (xMax - n.x) / (xMax - xc));
  });

  // 2) Cumbrera: copia de cada nodo que sube, para el lado alto.
  const copia: Record<string, string> = {};
  Object.values(nodes).filter(n => enCumbrera(n) && sube(n.id)).forEach(n => {
    const id = `${n.id}_cv`;
    nodes[id] = { id, x: n.x, y: n.y + o.abertura, z: n.z, nodeLabel: `${n.nodeLabel || n.id}-CV` };
    copia[n.id] = id;
  });
  const lado = (id: string) => (original[id] ? original[id].x - xc : 0);
  Object.values(segs).forEach(s => {
    const a = copia[s.nodeAId], b = copia[s.nodeBId];
    if (a && !b && lado(s.nodeBId) > EPS) s.nodeAId = a;
    else if (b && !a && lado(s.nodeAId) > EPS) s.nodeBId = b;
  });
  // Correas y arriostres a lo largo de la cumbrera: el lado alto lleva las suyas.
  Object.values(segsIn).forEach(s => {
    const a = copia[s.nodeAId], b = copia[s.nodeBId];
    if (a && b && (s.rolEstructural === 'correa' || s.rolEstructural === 'arriostre')) {
      segs[`${s.id}_cv`] = { ...s, id: `${s.id}_cv`, nodeAId: a, nodeBId: b };
    }
  });

  // 3) Montantes verticales en la cumbrera de cada pórtico (une lado bajo y lado alto).
  const porZ = new Map<string, Node3D[]>();
  Object.values(nodes).filter(enCumbrera).forEach(n => {
    if (!tij.has(n.id) && !copia[n.id] && !/_cv$/.test(n.id)) return;
    const k = n.z.toFixed(2); porZ.set(k, [...(porZ.get(k) || []), n]);
  });
  const existe = new Set(Object.values(segs).map(s => [s.nodeAId, s.nodeBId].sort().join('|')));
  const perfilMontante = Object.values(segs).find(s => s.rolEstructural === 'montante' || s.rolEstructural === 'cordon_superior')?.profileId || '';
  porZ.forEach(ns => {
    ns.sort((a, b) => a.y - b.y);
    for (let i = 0; i + 1 < ns.length; i++) {
      const k = [ns[i].id, ns[i + 1].id].sort().join('|');
      if (existe.has(k) || ns[i + 1].y - ns[i].y < 0.02) continue;
      const id = `s_cv_mon_${ns[i].id}`;
      segs[id] = { id, nodeAId: ns[i].id, nodeBId: ns[i + 1].id, profileId: perfilMontante, rolEstructural: 'montante' };
      existe.add(k);
    }
  });

  // 4) Vuelo del lado alto sobre el lado bajo (prolonga su cordón superior).
  if (o.vuelo > 0.02) {
    const puntas: { z: number; id: string; prof: string }[] = [];
    Object.entries(copia).forEach(([orig, cv]) => {
      if (!sup.has(orig)) return;
      const T = nodes[cv];
      const s = Object.values(segs).find(q => q.rolEstructural === 'cordon_superior' && (q.nodeAId === cv || q.nodeBId === cv));
      if (!s) return;
      const R = nodes[s.nodeAId === cv ? s.nodeBId : s.nodeAId];
      if (!R || R.x <= T.x + 0.01) return;
      const m = (T.y - R.y) / (R.x - T.x); // sube hacia la cumbrera
      const id = `${cv}_vuelo`;
      nodes[id] = { id, x: T.x - o.vuelo, y: T.y + m * o.vuelo, z: T.z, nodeLabel: `CORTAVIENTO-${puntas.length + 1}` };
      const sid = `s_cv_vuelo_${cv}`;
      segs[sid] = { id: sid, nodeAId: cv, nodeBId: id, profileId: s.profileId, rolEstructural: 'cordon_superior' };
      const correa = Object.values(segs).find(q => q.rolEstructural === 'correa');
      puntas.push({ z: T.z, id, prof: correa?.profileId || s.profileId });
    });
    puntas.sort((a, b) => a.z - b.z);
    for (let i = 0; i + 1 < puntas.length; i++) {
      const id = `s_cv_correa_vuelo_${i}`;
      segs[id] = { id, nodeAId: puntas[i].id, nodeBId: puntas[i + 1].id, profileId: puntas[i].prof, rolEstructural: 'correa' };
    }
  }
  // Sin vuelo igual se marca la nave como cortaviento (para el 3D y la cobertura).
  if (!Object.values(nodes).some(n => /^CORTAVIENTO-/.test(n.nodeLabel || ''))) {
    const n0 = Object.values(copia)[0];
    if (n0) nodes[n0].nodeLabel = `CORTAVIENTO-1`;
  }

  if (espejo) Object.values(nodes).forEach(n => { n.x = ex(n.x); });
  return { nodes, segs };
}
