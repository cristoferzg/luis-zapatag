// Cobertura automática a partir de las correas y tanque elevado (Rotoplas) con
// su torre metálica y sobretecho. Funciones puras: reciben y devuelven escena.
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';

type NodoMin = { id: string; x: number; y: number; z: number; nodeLabel?: string };
type SegMin = { id: string; nodeAId: string; nodeBId: string; rolEstructural: string };

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
  const yP = o.cotaBase + o.alturaSoporte;
  const esq = [[-h, -h], [h, -h], [h, h], [-h, h]];
  const nodes: Record<string, Node3D> = {}, segments: Record<string, Segment3D> = {}, zones: Record<string, CoverageZone3D> = {};
  const N = (id: string, x: number, y: number, z: number, label: string, fijo = false) => { nodes[id] = { id, x, y, z, nodeLabel: label, isFixedSupport: fijo }; return id; };
  const S = (id: string, a: string, b: string, rol: Segment3D['rolEstructural']) => { segments[id] = { id, nodeAId: a, nodeBId: b, profileId: o.perfilId, rolEstructural: rol }; };
  const base = esq.map(([dx, dz], i) => N(`${gid}_b${i}`, o.x + dx, o.cotaBase, o.z + dz, `TQB-${i + 1}@${gid}`, true));
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
