// =============================================================================
// Revisión del diseño de Techos: encuentra lo que descuadra un techo armado a
// mano (copiar/pegar, nodos movidos): nodos repetidos en el mismo punto,
// perfiles duplicados o de largo cero, nodos sueltos, extremos que quedan a
// unos centímetros de una viga sin tocarla y columnas que no llegan al piso.
// Funciones puras: revisar() lista los problemas y arreglar() devuelve la
// escena corregida (no toca el original).
// =============================================================================
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';

export type TipoProblema = 'nodo_repetido' | 'perfil_repetido' | 'perfil_cero' | 'nodo_suelto' | 'sin_conectar' | 'columna_flotando';

export interface Problema {
  id: string;
  tipo: TipoProblema;
  titulo: string;
  detalle: string;
  ids: string[];          // elementos a resaltar (nodos y/o perfiles)
  // datos para arreglarlo
  nodoId?: string; haciaNodoId?: string; punto?: { x: number; y: number; z: number };
}

export interface Escena { nodes: Record<string, Node3D>; segments: Record<string, Segment3D>; coverageZones: Record<string, CoverageZone3D> }

export const NOMBRE_TIPO: Record<TipoProblema, string> = {
  nodo_repetido: 'Nodos repetidos en el mismo punto',
  perfil_repetido: 'Perfiles duplicados (uno encima de otro)',
  perfil_cero: 'Perfiles de largo cero',
  nodo_suelto: 'Nodos sueltos (sin perfil)',
  sin_conectar: 'Extremos que no llegan a conectar',
  columna_flotando: 'Columnas que no llegan al piso',
};

const TOL_MISMO = 0.02;   // 2 cm: mismo punto
const TOL_CERCA = 0.20;   // hasta 20 cm: "casi conecta" (más lejos es un volado a propósito)
const cm = (m: number) => `${Math.round(m * 100)} cm`;
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
const nombreRol = (r?: string) => (r || 'perfil').replace(/_/g, ' ');

function puntoEnSegmento(p: Node3D, A: Node3D, B: Node3D) {
  const vx = B.x - A.x, vy = B.y - A.y, vz = (B.z || 0) - (A.z || 0), L2 = vx * vx + vy * vy + vz * vz;
  const t = L2 < 1e-9 ? 0 : ((p.x - A.x) * vx + (p.y - A.y) * vy + ((p.z || 0) - (A.z || 0)) * vz) / L2;
  const tc = Math.max(0, Math.min(1, t));
  const q = { x: A.x + vx * tc, y: A.y + vy * tc, z: (A.z || 0) + vz * tc };
  return { q, t, d: dist(p, q) };
}

export function revisar(esc: Escena): Problema[] {
  const { nodes, segments } = esc;
  const out: Problema[] = [];
  const N = Object.values(nodes), S = Object.values(segments);
  const grado: Record<string, string[]> = {};
  S.forEach(s => { (grado[s.nodeAId] ||= []).push(s.id); (grado[s.nodeBId] ||= []).push(s.id); });

  // 1. Nodos repetidos (mismo punto)
  const visto = new Set<string>();
  N.forEach(a => {
    if (visto.has(a.id)) return;
    const grupo = N.filter(b => b.id !== a.id && !visto.has(b.id) && dist(a, b) < TOL_MISMO);
    if (!grupo.length) return;
    [a, ...grupo].forEach(n => visto.add(n.id));
    out.push({ id: `rep_${a.id}`, tipo: 'nodo_repetido', titulo: `${grupo.length + 1} nodos en (${a.x.toFixed(2)}, ${a.y.toFixed(2)}, ${(a.z || 0).toFixed(2)})`,
      detalle: 'Se unen en uno solo y los perfiles quedan conectados.', ids: [a.id, ...grupo.map(n => n.id)], nodoId: a.id });
  });
  const raiz = (id: string) => { const n = nodes[id]; if (!n) return id; const r = N.find(m => dist(m, n) < TOL_MISMO); return r ? r.id : id; };

  // 2. Perfiles de largo cero y 3. duplicados
  const pares = new Map<string, Segment3D>();
  S.forEach(s => {
    const A = nodes[s.nodeAId], B = nodes[s.nodeBId];
    if (!A || !B) return;
    if (dist(A, B) < TOL_MISMO) {
      out.push({ id: `cero_${s.id}`, tipo: 'perfil_cero', titulo: `${nombreRol(s.rolEstructural)} de largo cero`, detalle: 'No mide nada: se borra.', ids: [s.id] });
      return;
    }
    const ra = raiz(s.nodeAId), rb = raiz(s.nodeBId);
    // Mismo tramo y mismo rol (un arriostre sobre una correa es a propósito).
    const k = [ra, rb].sort().join('|') + '|' + (s.rolEstructural || '');
    const prev = pares.get(k);
    if (prev) out.push({ id: `dup_${s.id}`, tipo: 'perfil_repetido', titulo: `Perfil repetido (${nombreRol(s.rolEstructural)})`, detalle: `Hay dos iguales en el mismo tramo (${dist(A, B).toFixed(2)} m): cuenta doble en el despiece. Se borra la copia.`, ids: [s.id, prev.id] });
    else pares.set(k, s);
  });

  // 4. Nodos sueltos
  const enZona = new Set<string>();
  Object.values(esc.coverageZones || {}).forEach(z => z.nodeIdsBoundary.forEach(id => enZona.add(id)));
  N.forEach(n => {
    if (grado[n.id]?.length || enZona.has(n.id) || visto.has(n.id)) return;
    out.push({ id: `suelto_${n.id}`, tipo: 'nodo_suelto', titulo: `Nodo ${n.nodeLabel || n.id} sin perfiles`, detalle: 'Quedó de una copia o un borrado: se elimina.', ids: [n.id] });
  });

  // 5. Extremos que casi conectan y 6. columnas en el aire
  N.forEach(n => {
    const propios = grado[n.id] || [];
    if (propios.length !== 1 || visto.has(n.id)) return;
    const s = segments[propios[0]];
    const otro = nodes[s.nodeAId === n.id ? s.nodeBId : s.nodeAId];
    if (!otro) return;
    const esColumna = /^columna/.test(s.rolEstructural || '');
    if (esColumna && n.y < otro.y) {
      if (n.y > 0.05 && !n.isFixedSupport) out.push({ id: `flota_${n.id}`, tipo: 'columna_flotando', titulo: `Columna con la base a ${n.y.toFixed(2)} m del piso`,
        detalle: 'No llega al suelo ni se apoya en nada: se baja al piso (0.00 m).', ids: [s.id, n.id], nodoId: n.id, punto: { x: n.x, y: 0, z: n.z || 0 } });
      return;
    }
    // ¿Hay un nodo muy cerca? → unir con ese nodo.
    let mejorNodo: Node3D | null = null, dN = Infinity;
    N.forEach(m => { if (m.id === n.id || m.id === otro.id || !grado[m.id]?.length) return; const d = dist(m, n); if (d >= TOL_MISMO && d < dN) { dN = d; mejorNodo = m; } });
    // ¿Hay una viga/correa muy cerca? → apoyarlo encima.
    let mejorSeg: { s: Segment3D; q: { x: number; y: number; z: number }; d: number } | null = null;
    S.forEach(o => {
      if (o.id === s.id || o.nodeAId === n.id || o.nodeBId === n.id) return;
      const A = nodes[o.nodeAId], B = nodes[o.nodeBId];
      if (!A || !B) return;
      const r = puntoEnSegmento(n, A, B);
      if (r.t < -0.001 || r.t > 1.001) return;
      if (!mejorSeg || r.d < mejorSeg.d) mejorSeg = { s: o, q: r.q, d: r.d };
    });
    const ms = mejorSeg as { s: Segment3D; q: { x: number; y: number; z: number }; d: number } | null;
    const mn = mejorNodo as Node3D | null;
    if (ms && ms.d < 0.015) return; // ya toca la viga (dentro del ancho del tubo)
    if (mn && dN < TOL_CERCA && (!ms || dN <= ms.d + 0.02)) {
      out.push({ id: `cerca_${n.id}`, tipo: 'sin_conectar', titulo: `${nombreRol(s.rolEstructural)} a ${cm(dN)} de otro nodo`,
        detalle: `Su extremo no toca el nodo ${mn.nodeLabel || mn.id}: se une a él.`, ids: [s.id, n.id, mn.id], nodoId: n.id, haciaNodoId: mn.id });
    } else if (ms && ms.d < TOL_CERCA) {
      out.push({ id: `cerca_${n.id}`, tipo: 'sin_conectar', titulo: `${nombreRol(s.rolEstructural)} a ${cm(ms.d)} de ${nombreRol(ms.s.rolEstructural)}`,
        detalle: `Su extremo queda ${ms.q.y > n.y + 0.005 ? 'debajo de' : ms.q.y < n.y - 0.005 ? 'encima de' : 'al costado de'} la ${nombreRol(ms.s.rolEstructural)} sin tocarla: se apoya sobre ella.`,
        ids: [s.id, n.id, ms.s.id], nodoId: n.id, punto: ms.q });
    }
  });
  return out;
}

/** Une el nodo `de` en `en`: los perfiles y coberturas pasan a usar `en`. */
function unirNodo(e: Escena, de: string, en: string) {
  if (de === en || !e.nodes[en]) return;
  Object.values(e.segments).forEach(s => {
    if (s.nodeAId === de) e.segments[s.id] = { ...e.segments[s.id], nodeAId: en };
    if (e.segments[s.id].nodeBId === de) e.segments[s.id] = { ...e.segments[s.id], nodeBId: en };
  });
  Object.values(e.coverageZones).forEach(z => {
    if (z.nodeIdsBoundary.includes(de)) e.coverageZones[z.id] = { ...z, nodeIdsBoundary: z.nodeIdsBoundary.map(id => (id === de ? en : id)).filter((id, i, l) => id !== l[i - 1]) };
  });
  if (e.nodes[de]?.isFixedSupport && !e.nodes[en].isFixedSupport) e.nodes[en] = { ...e.nodes[en], isFixedSupport: true };
  delete e.nodes[de];
}

/** Quita perfiles de largo cero (mismo nodo) y duplicados exactos (mismo par de nodos). */
function limpiarPerfiles(e: Escena) {
  const pares = new Set<string>();
  Object.values(e.segments).forEach(s => {
    const k = [s.nodeAId, s.nodeBId].sort().join('|') + '|' + (s.rolEstructural || '');
    if (s.nodeAId === s.nodeBId || pares.has(k)) delete e.segments[s.id];
    else pares.add(k);
  });
}

export function arreglar(esc: Escena, problemas: Problema[]): Escena {
  const e: Escena = { nodes: { ...esc.nodes }, segments: { ...esc.segments }, coverageZones: { ...esc.coverageZones } };
  problemas.forEach(p => {
    if (p.tipo === 'nodo_repetido') p.ids.slice(1).forEach(id => unirNodo(e, id, p.ids[0]));
    else if (p.tipo === 'perfil_cero' || p.tipo === 'perfil_repetido') delete e.segments[p.ids[0]];
    else if (p.tipo === 'nodo_suelto') delete e.nodes[p.ids[0]];
    else if (p.tipo === 'sin_conectar' && p.nodoId && p.haciaNodoId) unirNodo(e, p.nodoId, p.haciaNodoId);
    else if ((p.tipo === 'sin_conectar' || p.tipo === 'columna_flotando') && p.nodoId && p.punto && e.nodes[p.nodoId]) {
      e.nodes[p.nodoId] = { ...e.nodes[p.nodoId], ...p.punto, ...(p.tipo === 'columna_flotando' ? { isFixedSupport: true } : {}) };
    }
  });
  limpiarPerfiles(e);
  return e;
}

/** Arregla todo, repitiendo: al subir una correa, la columna que la sostenía puede quedar corta. */
export function arreglarTodo(esc: Escena): Escena {
  let e = esc;
  for (let i = 0; i < 6; i++) {
    const p = revisar(e);
    if (!p.length) break;
    e = arreglar(e, p);
  }
  return e;
}
