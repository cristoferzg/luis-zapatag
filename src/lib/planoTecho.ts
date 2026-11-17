// Planta de un techo de Techos Metálicos para usarla de FONDO en Gasfitería y Electricidad:
// el contorno, las columnas y las líneas de vigas/correas vistas desde arriba (x, z → x, y),
// movidas para que la esquina quede en (0, 0). Se puede elegir el techo abierto en Techos o
// cualquiera de los diseños guardados (cada usuario ve solo los suyos).
import { safeStorage } from './storageManager';
import { getCachedTechosDesigns } from './techosDesignsRepo';

type Escena = { nodes?: Record<string, { x: number; y: number; z: number }>; segments?: Record<string, { nodeAId: string; nodeBId: string; rolEstructural?: string }> } | null;

export interface LineaPlanta { x1: number; y1: number; x2: number; y2: number; r?: string }
export interface PlantaTecho { ancho: number; largo: number; columnas: { x: number; y: number }[]; lineas: LineaPlanta[] }

/** Techos que se pueden elegir de fondo: el abierto ahora y los guardados. */
export function techosDisponibles(): { id: string; nombre: string }[] {
  const lista: { id: string; nombre: string }[] = [];
  const actual = safeStorage.getItem<Escena>('innova_techos_escena_actual', null);
  if (actual && Object.keys(actual.nodes || {}).length > 1) lista.push({ id: 'actual', nombre: 'Techo abierto en Techos' });
  getCachedTechosDesigns().forEach(d => { if (Object.keys(d.nodes || {}).length > 1) lista.push({ id: d.id, nombre: d.nombre || 'Techo sin nombre' }); });
  return lista;
}

function escenaDe(id?: string): Escena {
  if (id && id !== 'actual') {
    const d = getCachedTechosDesigns().find(x => x.id === id);
    if (d) return { nodes: d.nodes, segments: d.segments };
  }
  return safeStorage.getItem<Escena>('innova_techos_escena_actual', null);
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;

/** Planta del techo elegido (null: no hay techo o no tiene área). */
export function plantaTecho(id?: string): PlantaTecho | null {
  const e = escenaDe(id);
  const N = e?.nodes || {};
  const ns = Object.values(N).filter(n => isFinite(n.x) && isFinite(n.z));
  if (ns.length < 2) return null;
  const x0 = Math.min(...ns.map(n => n.x)), z0 = Math.min(...ns.map(n => n.z));
  const W = Math.max(...ns.map(n => n.x)) - x0, L = Math.max(...ns.map(n => n.z)) - z0;
  if (W < 0.5 || L < 0.5) return null;
  const segs = Object.values(e?.segments || {});
  const conRol = segs.some(s => s.rolEstructural);
  const vistos = new Set<string>(), columnas: { x: number; y: number }[] = [];
  const vistasL = new Set<string>(), lineas: LineaPlanta[] = [];
  segs.forEach(s => {
    const a = N[s.nodeAId], b = N[s.nodeBId]; if (!a || !b) return;
    const vertical = Math.hypot(a.x - b.x, a.z - b.z) < 0.01;
    if (vertical) {
      if (Math.abs(a.y - b.y) < 0.3 || (conRol && s.rolEstructural !== 'columna')) return;
      const k = `${a.x.toFixed(2)}_${a.z.toFixed(2)}`; if (vistos.has(k)) return; vistos.add(k);
      columnas.push({ x: r3(a.x - x0), y: r3(a.z - z0) });
      return;
    }
    // En planta los cordones, montantes y diagonales de un tijeral caen sobre la misma línea: se dibuja una vez.
    const p1 = { x: r3(a.x - x0), y: r3(a.z - z0) }, p2 = { x: r3(b.x - x0), y: r3(b.z - z0) };
    const [u, v] = p1.x < p2.x || (p1.x === p2.x && p1.y <= p2.y) ? [p1, p2] : [p2, p1];
    const k = `${u.x.toFixed(2)},${u.y.toFixed(2)},${v.x.toFixed(2)},${v.y.toFixed(2)}`;
    if (vistasL.has(k) || lineas.length > 4000) return; vistasL.add(k);
    lineas.push({ x1: u.x, y1: u.y, x2: v.x, y2: v.y, r: s.rolEstructural });
  });
  return { ancho: r3(W), largo: r3(L), columnas, lineas };
}

/** Color de cada línea del techo en el fondo (tenue, para que no compita con las instalaciones). */
export const colorLineaTecho = (r?: string) => /correa/.test(r || '') ? '#94a3b8' : /arriostre|tensor/.test(r || '') ? '#cbd5e1' : '#64748b';
