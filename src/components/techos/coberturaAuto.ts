// Cobertura automática a partir de las correas y tanque elevado (Rotoplas) con
// su torre metálica y sobretecho. Funciones puras: reciben y devuelven escena.
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';

type NodoMin = { id: string; x: number; y: number; z: number; nodeLabel?: string };
type SegMin = { id: string; nodeAId: string; nodeBId: string; rolEstructural: string };

// Techo de UNA sola agua (plano), aunque se haya armado a mano con correas un
// poco más bajas que las vigas: se ajusta un plano a lo más alto de la
// estructura (vigas, correas y cordones, muestreados cada 0.5 m; fuera columnas,
// tanques y el marco bajo a media altura) y se sube hasta quedar encima de todo.
// Devuelve las 4 esquinas en planta del techo con su altura, o null si no es un
// solo plano (dos aguas, curvo…). `a` y `b`: pendiente en X y en Z.
export function panoUnaAgua(nodes: Record<string, { x: number; y: number; z?: number; nodeLabel?: string } | undefined>, segments: Record<string, { id: string; nodeAId: string; nodeBId: string; rolEstructural?: string }>): { pts: { x: number; y: number; z: number }[]; a: number; b: number } | null {
  const muestras: { x: number; y: number; z: number }[] = [];
  Object.values(segments).forEach(s => {
    if (/^tq[0-9a-z]+_/.test(s.id) || /columna|tensor|arriostre|diagonal|montante/.test(s.rolEstructural || '')) return;
    const A = nodes[s.nodeAId], B = nodes[s.nodeBId];
    if (!A || !B || /^TQ/.test(A.nodeLabel || '')) return;
    const L = Math.hypot(B.x - A.x, B.y - A.y, (B.z || 0) - (A.z || 0));
    const k = Math.max(1, Math.ceil(L / 0.5));
    for (let i = 0; i <= k; i++) {
      const t = i / k;
      muestras.push({ x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t, z: (A.z || 0) + ((B.z || 0) - (A.z || 0)) * t });
    }
  });
  const top = muestras.filter(p => !muestras.some(q => q.y > p.y + 0.3 && Math.hypot(q.x - p.x, q.z - p.z) < 0.3));
  if (top.length < 6) return null;
  const n = top.length;
  const m = (f: (p: { x: number; y: number; z: number }) => number) => top.reduce((s, p) => s + f(p), 0) / n;
  const mx = m(p => p.x), mz = m(p => p.z), my = m(p => p.y);
  const sxx = m(p => (p.x - mx) ** 2), szz = m(p => (p.z - mz) ** 2), sxz = m(p => (p.x - mx) * (p.z - mz));
  const sxy = m(p => (p.x - mx) * (p.y - my)), szy = m(p => (p.z - mz) * (p.y - my));
  const det = sxx * szz - sxz * sxz;
  if (Math.abs(det) < 1e-6) return null;
  const a = (sxy * szz - szy * sxz) / det, b = (szy * sxx - sxy * sxz) / det, c = my - a * mx - b * mz;
  const res = top.map(p => p.y - (a * p.x + b * p.z + c));
  if (Math.max(...res) - Math.min(...res) > 0.35) return null;
  const sube = Math.max(0, ...res);
  const xs = top.map(p => p.x), zs = top.map(p => p.z);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  if (x1 - x0 < 0.5 || z1 - z0 < 0.5) return null;
  // Rectangular en planta: cada esquina tiene estructura cerca (un techo en L no).
  const esquinas = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  if (!esquinas.every(([ex, ez]) => top.some(p => Math.hypot(p.x - ex, p.z - ez) < 0.8))) return null;
  const y =(x: number, z: number) => a * x + b * z + c + sube;
  return { a, b, pts: [{ x: x0, y: y(x0, z0), z: z0 }, { x: x1, y: y(x1, z0), z: z0 }, { x: x1, y: y(x1, z1), z: z1 }, { x: x0, y: y(x0, z1), z: z1 }] };
}

// Polígonos de cobertura (ids de nodos en orden) que cubren las correas.
// Entre cada correa y la vecina más cercana a cada lado se forma una franja;
// las franjas en el mismo plano se unen en una sola zona (un agua, dos aguas…).
// Los techos curvos/parabólicos quedan como varias franjas (una por pendiente).
export function coberturaDesdeCorreas(nodes: Record<string, NodoMin>, segments: Record<string, SegMin>): { ids: string[]; pendientePct: number }[] {
  const cs = Object.values(segments)
    .filter(s => s.rolEstructural === 'correa')
    .map(s => ({ s, A: nodes[s.nodeAId], B: nodes[s.nodeBId] }))
    .filter(c => c.A && c.B && !/^TQ/.test(c.A.nodeLabel || '') && Math.hypot(c.B.x - c.A.x, c.B.z - c.A.z) > 0.05);
  if (cs.length < 2) return [];

  const quads = new Map<string, NodoMin[]>();
  cs.forEach(c => {
    const L = Math.hypot(c.B.x - c.A.x, c.B.z - c.A.z);
    const ux = (c.B.x - c.A.x) / L, uz = (c.B.z - c.A.z) / L;
    const mejor: Record<string, { d: number; q: NodoMin[] }> = {};
    cs.forEach(o => {
      if (o === c) return;
      const pa = (p: NodoMin) => ({ t: (p.x - c.A.x) * ux + (p.z - c.A.z) * uz, n: -(p.x - c.A.x) * uz + (p.z - c.A.z) * ux });
      const a = pa(o.A), b = pa(o.B);
      let nA: NodoMin, nB: NodoMin;
      if (Math.abs(a.t) < 0.12 && Math.abs(b.t - L) < 0.12) { nA = o.A; nB = o.B; }
      else if (Math.abs(b.t) < 0.12 && Math.abs(a.t - L) < 0.12) { nA = o.B; nB = o.A; }
      else return;
      if (Math.abs(a.n - b.n) > 0.05) return; // no paralela
      const dn = (a.n + b.n) / 2;
      if (Math.abs(dn) < 0.05 || Math.abs(dn) > 6.5) return;
      const dy = ((nA.y + nB.y) - (c.A.y + c.B.y)) / 2;
      if (Math.abs(dy) > Math.abs(dn) * 1.6 + 0.05) return; // salto vertical: otro techo
      const lado = dn > 0 ? '+' : '-';
      const d = Math.hypot(dn, dy);
      if (!mejor[lado] || d < mejor[lado].d) mejor[lado] = { d, q: [c.A, c.B, nB, nA] };
    });
    Object.values(mejor).forEach(({ q }) => quads.set(q.map(n => n.id).sort().join('|'), q));
  });

  // Agrupa por plano (normal + distancia al origen).
  const grupos = new Map<string, { q: NodoMin[][]; nrm: [number, number, number] }>();
  quads.forEach(q => {
    const u = [q[1].x - q[0].x, q[1].y - q[0].y, q[1].z - q[0].z], v = [q[3].x - q[0].x, q[3].y - q[0].y, q[3].z - q[0].z];
    let n: [number, number, number] = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const len = Math.hypot(...n) || 1; n = [n[0] / len, n[1] / len, n[2] / len];
    if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
    const off = n[0] * q[0].x + n[1] * q[0].y + n[2] * q[0].z;
    const key = `${Math.round(n[0] * 40)}_${Math.round(n[1] * 40)}_${Math.round(n[2] * 40)}_${Math.round(off * 8)}`;
    const g = grupos.get(key) || { q: [], nrm: n };
    g.q.push(q); grupos.set(key, g);
  });

  const areaPlanta = (p: NodoMin[]) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.z - b.x * a.z; } return Math.abs(s) / 2; };
  const out: { ids: string[]; pendientePct: number }[] = [];
  grupos.forEach(g => {
    const pend = Math.round((Math.hypot(g.nrm[0], g.nrm[2]) / Math.max(1e-6, g.nrm[1])) * 100);
    const todos = new Map<string, NodoMin>();
    g.q.forEach(q => q.forEach(n => todos.set(n.id, n)));
    const hull = cascoConvexo([...todos.values()]);
    const suma = g.q.reduce((s, q) => s + areaPlanta(q), 0);
    if (hull.length >= 3 && areaPlanta(hull) <= suma * 1.04 + 0.05) out.push({ ids: hull.map(n => n.id), pendientePct: pend });
    else g.q.forEach(q => out.push({ ids: q.map(n => n.id), pendientePct: pend }));
  });
  return out;
}

// Casco convexo en planta (x, z) sin puntos colineales.
function cascoConvexo(pts: NodoMin[]): NodoMin[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.z - b.z);
  if (p.length < 3) return p;
  const cr = (o: NodoMin, a: NodoMin, b: NodoMin) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower: NodoMin[] = [], upper: NodoMin[] = [];
  p.forEach(q => { while (lower.length >= 2 && cr(lower[lower.length - 2], lower[lower.length - 1], q) <= 1e-6) lower.pop(); lower.push(q); });
  [...p].reverse().forEach(q => { while (upper.length >= 2 && cr(upper[upper.length - 2], upper[upper.length - 1], q) <= 1e-6) upper.pop(); upper.push(q); });
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export function zonasDesdeCorreas(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, coberturaId: string): Record<string, CoverageZone3D> {
  const out: Record<string, CoverageZone3D> = {};
  coberturaDesdeCorreas(nodes, segments).forEach((p, i) => {
    const id = `zone_auto_${Date.now()}_${i}`;
    out[id] = { id, nombre: `Cobertura ${i + 1}`, nodeIdsBoundary: p.ids, coberturaMaterialId: coberturaId, pendientePorcentaje: p.pendientePct, orientacionInclinacionDeg: 0 };
  });
  return out;
}

// ---------------------------------------------------------------------------
// Tanque elevado
// ---------------------------------------------------------------------------
export const TANQUES_ROTOPLAS: Record<number, { diametro: number; alto: number }> = {
  600: { diametro: 0.97, alto: 1.05 },
  1100: { diametro: 1.10, alto: 1.42 },
  2500: { diametro: 1.55, alto: 1.65 },
};

export interface OpcionesTanque {
  litros: 600 | 1100 | 2500;
  x: number; z: number;        // centro en planta (m)
  cotaBase: number;            // donde apoyan las patas (m)
  cotaPorPata?: number[];      // sobre el techo: altura de apoyo de cada pata (4)
  alturaSoporte: number;       // alto de la torre (m)
  perfilId: string;
  sobretecho: boolean;
  coberturaId: string;
  pendientePct: number;
}

// Torre de 4 patas con anillo superior y diagonales; sobretecho a un agua con
// su cobertura. Las esquinas de la plataforma se etiquetan TQ<litros>-P<n>@<id>
// para que Concreto dibuje el tanque encima.
export function generarTanque(o: OpcionesTanque): { nodes: Record<string, Node3D>; segments: Record<string, Segment3D>; zones: Record<string, CoverageZone3D> } {
  const gid = `tq${Date.now().toString(36)}`;
  const tk = TANQUES_ROTOPLAS[o.litros] || TANQUES_ROTOPLAS[1100];
  const h = Math.round((tk.diametro + 0.2) * 100) / 200; // medio lado
  const esq = [[-h, -h], [h, -h], [h, h], [-h, h]];
  const apoyo = esq.map((_, i) => o.cotaPorPata?.[i] ?? o.cotaBase);
  // La plataforma queda horizontal: sobre la pata más alta + alto de la torre.
  const yP = Math.max(...apoyo) + o.alturaSoporte;
  const nodes: Record<string, Node3D> = {}, segments: Record<string, Segment3D> = {}, zones: Record<string, CoverageZone3D> = {};
  const N = (id: string, x: number, y: number, z: number, label: string, fijo = false) => { nodes[id] = { id, x, y, z, nodeLabel: label, isFixedSupport: fijo }; return id; };
  const S = (id: string, a: string, b: string, rol: Segment3D['rolEstructural']) => { segments[id] = { id, nodeAId: a, nodeBId: b, profileId: o.perfilId, rolEstructural: rol }; };
  // Solo las patas que llegan al suelo llevan zapata; sobre el techo van empernadas a la estructura.
  const base = esq.map(([dx, dz], i) => N(`${gid}_b${i}`, o.x + dx, apoyo[i], o.z + dz, `TQB-${i + 1}@${gid}`, apoyo[i] < 0.05));
  const plat = esq.map(([dx, dz], i) => N(`${gid}_p${i}`, o.x + dx, yP, o.z + dz, `TQ${o.litros}-P${i + 1}@${gid}`));
  for (let i = 0; i < 4; i++) {
    S(`${gid}_col${i}`, base[i], plat[i], 'columna');
    S(`${gid}_ani${i}`, plat[i], plat[(i + 1) % 4], 'arriostre');
    S(`${gid}_dia${i}`, base[i], plat[(i + 1) % 4], 'diagonal');
  }
  S(`${gid}_tr0`, plat[0], plat[2], 'arriostre');
  if (o.sobretecho) {
    const libre = tk.alto + 0.35;
    const caida = (2 * h) * (o.pendientePct / 100);
    const top = esq.map(([dx, dz], i) => N(`${gid}_s${i}`, o.x + dx, yP + libre + (dz < 0 ? caida : 0), o.z + dz, `TQS-${i + 1}@${gid}`));
    for (let i = 0; i < 4; i++) {
      S(`${gid}_post${i}`, plat[i], top[i], 'columna');
      S(`${gid}_st${i}`, top[i], top[(i + 1) % 4], i % 2 === 0 ? 'correa' : 'cordon_superior');
    }
    zones[`${gid}_cob`] = { id: `${gid}_cob`, nombre: `Sobretecho tanque ${o.litros} L`, nodeIdsBoundary: top, coberturaMaterialId: o.coberturaId, pendientePorcentaje: o.pendientePct, orientacionInclinacionDeg: 0 };
  }
  return { nodes, segments, zones };
}

// ---------------------------------------------------------------------------
// Caída del techo y orientación del diseño
// ---------------------------------------------------------------------------
export type DireccionCaida = 'izquierda' | 'derecha' | 'adelante' | 'atras';
export const NOMBRE_CAIDA: Record<DireccionCaida, string> = { izquierda: 'Izquierda', derecha: 'Derecha', adelante: 'Adelante (calle)', atras: 'Atrás' };

// Dirección (en planta) hacia donde escurre el agua de cada polígono del
// techo: la proyección horizontal de su normal. En planta, +Z es "adelante".
export function caidaDePoligono(p: { x: number; y: number; z: number }[]): { dx: number; dz: number; pendientePct: number } | null {
  if (p.length < 3) return null;
  let nx = 0, ny = 0, nz = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const u = [p[i].x - p[0].x, p[i].y - p[0].y, p[i].z - p[0].z], v = [p[i + 1].x - p[0].x, p[i + 1].y - p[0].y, p[i + 1].z - p[0].z];
    nx += u[1] * v[2] - u[2] * v[1]; ny += u[2] * v[0] - u[0] * v[2]; nz += u[0] * v[1] - u[1] * v[0];
  }
  if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
  const h = Math.hypot(nx, nz);
  if (ny < 1e-9 || h / ny < 0.01) return { dx: 0, dz: 0, pendientePct: 0 }; // plano
  return { dx: nx / h, dz: nz / h, pendientePct: Math.round((h / ny) * 100) };
}

export function nombreDireccion(dx: number, dz: number): DireccionCaida {
  return Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? 'derecha' : 'izquierda') : (dz > 0 ? 'adelante' : 'atras');
}

// Caída principal del diseño: la del agua más grande (sin tanques).
export function caidaPrincipal(nodes: Record<string, NodoMin>, segments: Record<string, SegMin>, zones: Record<string, { nodeIdsBoundary: string[] }>): DireccionCaida | null {
  const propias = Object.values(zones).map(z => z.nodeIdsBoundary).filter(ids => !ids.some(id => /^TQ/.test(nodes[id]?.nodeLabel || '')));
  const polis = (propias.length ? propias : coberturaDesdeCorreas(nodes, segments).map(p => p.ids)).map(ids => ids.map(id => nodes[id]).filter(Boolean));
  let mejor: { a: number; d: DireccionCaida } | null = null;
  polis.forEach(p => {
    const c = caidaDePoligono(p);
    if (!c || !c.pendientePct) return;
    let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i].x * q.z - q.x * p[i].z; }
    if (!mejor || Math.abs(a) > mejor.a) mejor = { a: Math.abs(a), d: nombreDireccion(c.dx, c.dz) };
  });
  return mejor ? (mejor as { a: number; d: DireccionCaida }).d : null;
}

// Gira (múltiplos de 90°) o refleja todo el diseño en planta alrededor de su
// centro, conservando los ids. Las columnas, tijerales y coberturas se mueven juntos.
export function transformarEscena<N extends NodoMin>(nodes: Record<string, N>, op: 'girar90' | 'girar180' | 'girar270' | 'reflejarX' | 'reflejarZ'): Record<string, N> {
  const ns = Object.values(nodes);
  if (!ns.length) return nodes;
  const minX = Math.min(...ns.map(n => n.x)), maxX = Math.max(...ns.map(n => n.x)), minZ = Math.min(...ns.map(n => n.z)), maxZ = Math.max(...ns.map(n => n.z));
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const f = (x: number, z: number): [number, number] => {
    const dx = x - cx, dz = z - cz;
    switch (op) {
      case 'girar90': return [-dz, dx];
      case 'girar180': return [-dx, -dz];
      case 'girar270': return [dz, -dx];
      case 'reflejarX': return [-dx, dz];
      default: return [dx, -dz];
    }
  };
  const tmp = ns.map(n => ({ n, p: f(n.x, n.z) }));
  // Vuelve a apoyar la obra en el mismo origen (esquina mínima).
  const ox = minX - Math.min(...tmp.map(t => t.p[0])), oz = minZ - Math.min(...tmp.map(t => t.p[1]));
  const r = (v: number) => Math.round(v * 1000) / 1000;
  const out: Record<string, N> = {};
  tmp.forEach(({ n, p }) => { out[n.id] = { ...n, x: r(p[0] + ox), z: r(p[1] + oz) }; });
  return out;
}

// Operación que lleva la caída actual a la dirección pedida.
export function opParaCaida(actual: DireccionCaida, deseada: DireccionCaida): 'girar90' | 'girar180' | 'girar270' | null {
  const orden: DireccionCaida[] = ['derecha', 'adelante', 'izquierda', 'atras']; // +90° en planta (x→z)
  const k = (orden.indexOf(deseada) - orden.indexOf(actual) + 4) % 4;
  return k === 0 ? null : k === 1 ? 'girar90' : k === 2 ? 'girar180' : 'girar270';
}

// ---------------------------------------------------------------------------
// Pendiente del techo (%)
// ---------------------------------------------------------------------------
// Pendiente mínima referencial por tipo de cobertura (según fabricantes; el
// usuario decide). Sirve solo para avisar.
export const PENDIENTE_MIN_PCT: Record<string, number> = {
  aluzinc_tr4: 10, aluzinc_tr5: 10, calamina_galvanizada: 15, fibrocemento_eternit: 27,
  policarbonato_alveolar: 10, upvc_termoacustica: 10, panel_sandwich_pur: 5, plancha_acero_deck: 3,
  malla_raschel: 0, lona_pvc: 10, policarbonato_compacto: 10,
};

function poligonosPropios(nodes: Record<string, NodoMin>, segments: Record<string, SegMin>, zones: Record<string, { nodeIdsBoundary: string[] }>) {
  const propias = Object.values(zones).map(z => z.nodeIdsBoundary).filter(ids => !ids.some(id => /^TQ/.test(nodes[id]?.nodeLabel || '')));
  return (propias.length ? propias : coberturaDesdeCorreas(nodes, segments).map(p => p.ids)).map(ids => ids.map(id => nodes[id]).filter(Boolean));
}

// Pendiente del agua principal (la más grande) y cota del alero (lo más bajo del techo).
export function pendienteActual(nodes: Record<string, NodoMin>, segments: Record<string, SegMin>, zones: Record<string, { nodeIdsBoundary: string[] }>): { pct: number; yAlero: number; exacto: number } | null {
  const polis = poligonosPropios(nodes, segments, zones);
  if (!polis.length) return null;
  let mejor: { a: number; pct: number } | null = null;
  polis.forEach(p => {
    // Pendiente exacta (sin redondear) para que el cambio de % sea preciso.
    let nx = 0, ny = 0, nz = 0;
    for (let i = 1; i < p.length - 1; i++) {
      const u = [p[i].x - p[0].x, p[i].y - p[0].y, p[i].z - p[0].z], v = [p[i + 1].x - p[0].x, p[i + 1].y - p[0].y, p[i + 1].z - p[0].z];
      nx += u[1] * v[2] - u[2] * v[1]; ny += u[2] * v[0] - u[0] * v[2]; nz += u[0] * v[1] - u[1] * v[0];
    }
    const pctExacto = Math.abs(ny) > 1e-9 ? (Math.hypot(nx, nz) / Math.abs(ny)) * 100 : 0;
    let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i].x * q.z - q.x * p[i].z; }
    if (p.length >= 3 && (!mejor || Math.abs(a) > mejor.a)) mejor = { a: Math.abs(a), pct: pctExacto };
  });
  const yAlero = Math.min(...polis.flat().map(n => n.y));
  return mejor ? { pct: Math.round((mejor as { a: number; pct: number }).pct * 10) / 10, yAlero, exacto: (mejor as { a: number; pct: number }).pct } : null;
}

// Cambia la pendiente subiendo o bajando todo lo que está sobre el alero en
// la misma proporción (tijerales, correas, columnas del lado alto…). El alero
// y lo que está debajo no se mueven. No toca los tanques.
export function cambiarPendiente<N extends NodoMin>(nodes: Record<string, N>, segments: Record<string, SegMin>, zones: Record<string, { nodeIdsBoundary: string[] }>, nuevoPct: number): Record<string, N> | null {
  const act = pendienteActual(nodes, segments, zones);
  if (!act || act.pct <= 0 || nuevoPct <= 0) return null;
  const f = nuevoPct / act.exacto;
  const out: Record<string, N> = {};
  Object.values(nodes).forEach(n => {
    const mover = !/^TQ/.test(n.nodeLabel || '') && n.y > act.yAlero + 0.005;
    out[n.id] = mover ? { ...n, y: Math.round((act.yAlero + (n.y - act.yAlero) * f) * 1000) / 1000 } : n;
  });
  return out;
}

// Techo plano: le da caída hacia `dir` con `pct` %. Todo lo elevado (sobre el
// suelo) sube según su distancia al alero; el alero queda a su altura actual.
export function inclinarTechoPlano<N extends NodoMin>(nodes: Record<string, N>, dir: DireccionCaida, pct: number): Record<string, N> {
  const ns = Object.values(nodes).filter(n => n.y > 0.05 && !/^TQ/.test(n.nodeLabel || ''));
  if (!ns.length || pct <= 0) return nodes;
  const minX = Math.min(...ns.map(n => n.x)), maxX = Math.max(...ns.map(n => n.x)), minZ = Math.min(...ns.map(n => n.z)), maxZ = Math.max(...ns.map(n => n.z));
  // distancia desde el alero bajo (el lado hacia donde cae el agua)
  const dist = (n: N) => dir === 'adelante' ? maxZ - n.z : dir === 'atras' ? n.z - minZ : dir === 'derecha' ? maxX - n.x : n.x - minX;
  const out: Record<string, N> = {};
  Object.values(nodes).forEach(n => {
    const mover = n.y > 0.05 && !/^TQ/.test(n.nodeLabel || '');
    out[n.id] = mover ? { ...n, y: Math.round((n.y + dist(n) * pct / 100) * 1000) / 1000 } : n;
  });
  return out;
}
