// Geometría de la obra: alto de muros bajo el techo, aberturas, ambientes
// (recintos cerrados por muros) y metrado de la estructura de Techos por piso.
import type { PlanoElem } from '../ConcretoPlanoCad';
import type { EstructuraTechos } from './obraPisos';
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS } from '../techos/techosCadCatalog';
import { modeloTensor } from '../techos/tensores';
import { coberturaDesdeCorreas, panoUnaAgua, TANQUES_ROTOPLAS } from '../techos/coberturaAuto';
import { precio, precioBarraPerfil, claveCobertura } from '../../lib/catalogoPrecios';

export const NKp = (x: number, y: number) => `${Math.round(x * 1000)}_${Math.round(y * 1000)}`;

// ---------------------------------------------------------------------------
// Aberturas (puertas / ventanas / vanos)
// ---------------------------------------------------------------------------
export type TipoAbertura = 'puerta' | 'puerta_doble' | 'puerta_bano' | 'puerta_corrediza' | 'porton' | 'ventana' | 'ventana_corrediza' | 'ventana_cocina' | 'ventanal' | 'ventana_alta' | 'mampara' | 'vano';

export const PRESETS_ABERTURA: Record<TipoAbertura, { nombre: string; w: number; h: number; sill: number }> = {
  puerta: { nombre: 'Puerta', w: 0.9, h: 2.1, sill: 0 },
  puerta_doble: { nombre: 'Puerta doble', w: 1.6, h: 2.1, sill: 0 },
  puerta_bano: { nombre: 'Puerta de baño', w: 0.7, h: 2.1, sill: 0 },
  puerta_corrediza: { nombre: 'Puerta corrediza', w: 1.8, h: 2.1, sill: 0 },
  porton: { nombre: 'Portón / cochera', w: 2.6, h: 2.4, sill: 0 },
  ventana: { nombre: 'Ventana', w: 1.2, h: 1.2, sill: 0.9 },
  ventana_corrediza: { nombre: 'Ventana corrediza', w: 1.5, h: 1.2, sill: 0.9 },
  ventana_cocina: { nombre: 'Ventana de cocina', w: 1.0, h: 0.8, sill: 1.1 },
  ventanal: { nombre: 'Ventanal (piso a techo)', w: 2.4, h: 2.2, sill: 0 },
  ventana_alta: { nombre: 'Ventana alta (baño)', w: 0.6, h: 0.5, sill: 1.6 },
  mampara: { nombre: 'Mampara / vidrio', w: 2.0, h: 2.1, sill: 0 },
  vano: { nombre: 'Vano libre', w: 1.0, h: 2.1, sill: 0 },
};
export interface Abertura {
  id: string;
  tipo: TipoAbertura;
  t: number;    // distancia del inicio del muro al centro (m)
  w: number;    // ancho (m)
  h: number;    // alto (m)
  sill: number; // antepecho (m); 0 en puertas
  carpiId?: string;      // diseño de CarpiMetal colocado en este vano
  carpiNombre?: string;
  incluir?: boolean;     // el diseño de CarpiMetal suma a la cotización (por defecto sí)
  obs?: string;          // observación que sale en la cotización
}

export const esPuerta = (t: TipoAbertura) => t === 'puerta' || t === 'puerta_doble' || t === 'puerta_bano' || t === 'puerta_corrediza' || t === 'porton';
export const esVidrio = (t: TipoAbertura) => t === 'ventana' || t === 'ventana_alta' || t === 'mampara' || t === 'ventana_corrediza' || t === 'ventana_cocina' || t === 'ventanal';

export const largoMuro = (e: PlanoElem) => (e.x2 !== undefined && e.y2 !== undefined ? Math.hypot(e.x2 - e.x1, e.y2 - e.y1) : 0);

// Mantiene la abertura dentro del muro.
export function ajustarAbertura(ab: Abertura, L: number): Abertura {
  const w = Math.min(ab.w, Math.max(0.3, L - 0.1));
  const t = Math.min(Math.max(ab.t, w / 2 + 0.05), L - w / 2 - 0.05);
  return { ...ab, w, t };
}

// ---------------------------------------------------------------------------
// Superficie del techo y alto de los muros
// ---------------------------------------------------------------------------
type Tri = [number, number, number][]; // 3 vértices (x, y, z)

// Esquina de la torre del tanque y su sobretecho: no son parte de los pisos.
export const esNodoTanque = (n: { nodeLabel?: string } | undefined) => /^TQ/.test(n?.nodeLabel || '');

// Polígonos del techo: las coberturas guardadas o, si no hay, las que se
// deducen de las correas (mismo cálculo que "Cubrir con correas" en Techos).
export function poligonosTecho(est: EstructuraTechos, sinTanques = false): { x: number; y: number; z: number }[][] {
  const N = est.nodes || {};
  const zonas = Object.values(est.coverageZones || {}).map(z => z.nodeIdsBoundary || []).filter(l => !sinTanques || !l.some(id => esNodoTanque(N[id] as any)));
  const propias = zonas.filter(l => !l.some(id => esNodoTanque(N[id] as any)));
  const aPuntos = (ls: string[][]) => ls.map(l => l.map(id => N[id]).filter(Boolean).map(n => ({ x: n.x, y: n.y, z: n.z }))).filter(p => p.length >= 3);
  if (propias.length) return aPuntos(zonas);
  // Sin coberturas propias: techo de una agua como un solo paño (encima de vigas y correas).
  const pl = panoUnaAgua(N as any, (est.segments || {}) as any);
  if (pl) return [...aPuntos(zonas), pl.pts];
  return aPuntos([...zonas, ...coberturaDesdeCorreas(N, est.segments || {}).map(p => p.ids)]);
}

function trianglesCobertura(est: EstructuraTechos): Tri[] {
  const tris: Tri[] = [];
  poligonosTecho(est).forEach(p => {
    for (let i = 1; i < p.length - 1; i++) tris.push([[p[0].x, p[0].y, p[0].z], [p[i].x, p[i].y, p[i].z], [p[i + 1].x, p[i + 1].y, p[i + 1].z]]);
  });
  return tris;
}

const cacheTris = new WeakMap<object, Tri[]>();
function trisDe(est: EstructuraTechos) {
  let t = cacheTris.get(est);
  if (!t) { t = trianglesCobertura(est); cacheTris.set(est, t); }
  return t;
}

// Alturas de la cara inferior del techo encima de (x, z): todas las capas.
function alturasTechoEn(x: number, z: number, tris: Tri[], est: EstructuraTechos): number[] {
  const out: number[] = [];
  tris.forEach(([a, b, c]) => {
    const d = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2]);
    if (Math.abs(d) < 1e-9) return;
    const l1 = ((b[2] - c[2]) * (x - c[0]) + (c[0] - b[0]) * (z - c[2])) / d;
    const l2 = ((c[2] - a[2]) * (x - c[0]) + (a[0] - c[0]) * (z - c[2])) / d;
    const l3 = 1 - l1 - l2;
    if (l1 >= -0.02 && l2 >= -0.02 && l3 >= -0.02) out.push(l1 * a[1] + l2 * b[1] + l3 * c[1]);
  });
  if (out.length) return out;
  // Sin cobertura: usar correas / cordón superior cercanos en planta.
  const N = est.nodes || {};
  Object.values(est.segments || {}).forEach(s => {
    if (!['correa', 'cordon_superior'].includes(s.rolEstructural)) return;
    const A = N[s.nodeAId], B = N[s.nodeBId];
    if (!A || !B) return;
    const vx = B.x - A.x, vz = B.z - A.z, L2 = vx * vx + vz * vz;
    const t = L2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((x - A.x) * vx + (z - A.z) * vz) / L2));
    const px = A.x + vx * t, pz = A.z + vz * t;
    if (Math.hypot(px - x, pz - z) <= 0.6) out.push(A.y + (B.y - A.y) * t);
  });
  return out;
}

export interface ContextoMuro { estructura: EstructuraTechos | null; base: number; tope?: number }

// Alto libre bajo el techo en (x, z) sobre la base del piso; null si no hay techo encima.
export function altoBajoTecho(x: number, z: number, ctx: ContextoMuro): number | null {
  if (!ctx.estructura) return ctx.tope !== undefined ? ctx.tope - ctx.base : null;
  const ys = alturasTechoEn(x, z, trisDe(ctx.estructura), ctx.estructura).filter(y => y > ctx.base + 1.0);
  let top = ys.length ? Math.min(...ys) : undefined;
  if (ctx.tope !== undefined) top = top === undefined ? ctx.tope : Math.min(top, ctx.tope);
  return top === undefined ? null : top - ctx.base;
}

// Perfil superior del muro (alto sobre su base) a lo largo de su eje.
// Con "hasta el techo" sigue la pendiente; si no, alto constante H.
export function perfilMuro(e: PlanoElem, ctx: ContextoMuro): { t: number; h: number }[] {
  const L = largoMuro(e);
  const Hfijo = e.H || 2.6;
  if (!e.hastaTecho || L < 0.01 || (!ctx.estructura && ctx.tope === undefined)) return [{ t: 0, h: Hfijo }, { t: L, h: Hfijo }];
  const n = Math.max(2, Math.ceil(L / 0.25) + 1);
  const pts: { t: number; h: number }[] = [];
  for (let i = 0; i < n; i++) {
    const t = (L * i) / (n - 1);
    const x = e.x1 + ((e.x2! - e.x1) * t) / L, z = e.y1 + ((e.y2! - e.y1) * t) / L;
    const h = altoBajoTecho(x, z, ctx);
    pts.push({ t, h: Math.max(0.3, h ?? Hfijo) });
  }
  // Simplifica tramos colineales.
  return pts.filter((p, i) => i === 0 || i === pts.length - 1 || Math.abs((pts[i + 1].h - p.h) - (p.h - pts[i - 1].h)) > 0.005);
}

export function areaPerfil(perfil: { t: number; h: number }[]) {
  let a = 0;
  for (let i = 1; i < perfil.length; i++) a += (perfil[i].t - perfil[i - 1].t) * (perfil[i].h + perfil[i - 1].h) / 2;
  return a;
}

export function areaAberturas(e: PlanoElem) {
  return (e.aberturas || []).reduce((s, a) => s + a.w * a.h, 0);
}

// ---------------------------------------------------------------------------
// Ambientes: caras cerradas del grafo de muros de un piso
// ---------------------------------------------------------------------------
export interface Ambiente { key: string; poly: { x: number; y: number }[]; area: number; cx: number; cy: number }

export function detectarAmbientes(muros: PlanoElem[]): Ambiente[] {
  type Seg = { a: { x: number; y: number }; b: { x: number; y: number } };
  let segs: Seg[] = muros.filter(m => m.x2 !== undefined && m.y2 !== undefined).map(m => ({ a: { x: m.x1, y: m.y1 }, b: { x: m.x2!, y: m.y2! } }));
  if (segs.length < 3) return [];
  // Puntos de corte: extremos sobre otros muros (uniones en T) y cruces.
  const cortes: { x: number; y: number }[][] = segs.map(() => []);
  segs.forEach((s, i) => segs.forEach((o, j) => {
    if (i === j) return;
    const r = { x: s.b.x - s.a.x, y: s.b.y - s.a.y }, q = { x: o.b.x - o.a.x, y: o.b.y - o.a.y };
    const den = r.x * q.y - r.y * q.x;
    if (Math.abs(den) < 1e-9) return;
    const t = ((o.a.x - s.a.x) * q.y - (o.a.y - s.a.y) * q.x) / den;
    const u = ((o.a.x - s.a.x) * r.y - (o.a.y - s.a.y) * r.x) / den;
    if (t > 0.001 && t < 0.999 && u > -0.001 && u < 1.001) cortes[i].push({ x: s.a.x + r.x * t, y: s.a.y + r.y * t });
  }));
  const partes: Seg[] = [];
  segs.forEach((s, i) => {
    const L = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
    const pts = [s.a, ...cortes[i], s.b].sort((p, q) => Math.hypot(p.x - s.a.x, p.y - s.a.y) / L - Math.hypot(q.x - s.a.x, q.y - s.a.y) / L);
    for (let k = 1; k < pts.length; k++) if (Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y) > 0.01) partes.push({ a: pts[k - 1], b: pts[k] });
  });
  segs = partes;
  const V = new Map<string, { x: number; y: number }>();
  const adj = new Map<string, Set<string>>();
  const add = (p: { x: number; y: number }) => { const k = NKp(p.x, p.y); if (!V.has(k)) { V.set(k, p); adj.set(k, new Set()); } return k; };
  segs.forEach(s => { const a = add(s.a), b = add(s.b); if (a !== b) { adj.get(a)!.add(b); adj.get(b)!.add(a); } });
  const ang = (from: string, to: string) => { const p = V.get(from)!, q = V.get(to)!; return Math.atan2(q.y - p.y, q.x - p.x); };
  const orden = new Map<string, string[]>();
  adj.forEach((ns, k) => orden.set(k, [...ns].sort((p, q) => ang(k, p) - ang(k, q))));
  const usados = new Set<string>();
  const caras: Ambiente[] = [];
  adj.forEach((ns, u) => ns.forEach(v => {
    if (usados.has(`${u}>${v}`)) return;
    const ciclo: string[] = [];
    let a = u, b = v, guard = 0;
    while (!usados.has(`${a}>${b}`) && guard++ < 500) {
      usados.add(`${a}>${b}`); ciclo.push(a);
      const lista = orden.get(b)!; const i = lista.indexOf(a);
      const c = lista[(i - 1 + lista.length) % lista.length];
      a = b; b = c;
    }
    if (ciclo.length < 3) return;
    const poly = ciclo.map(k => V.get(k)!);
    let s2 = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], cr = p.x * q.y - q.x * p.y;
      s2 += cr; cx += (p.x + q.x) * cr; cy += (p.y + q.y) * cr;
    }
    const area = s2 / 2;
    if (area <= 0.5) return; // cara exterior (negativa) o residuos
    caras.push({ key: [...ciclo].sort().join('|'), poly, area, cx: cx / (3 * s2), cy: cy / (3 * s2) });
  }));
  return caras;
}

// ---------------------------------------------------------------------------
// Metrado de la estructura de Techos por piso
// ---------------------------------------------------------------------------
export interface MetradoTechosPiso { perfiles: number; metros: number; kg: number; costoAcero: number; coberturaM2: number; costoCobertura: number; coberturas: string[] }

export function metradoTechosPorPiso(est: EstructuraTechos | null, bases: number[]): MetradoTechosPiso[] {
  const out: MetradoTechosPiso[] = bases.map(() => ({ perfiles: 0, metros: 0, kg: 0, costoAcero: 0, coberturaM2: 0, costoCobertura: 0, coberturas: [] }));
  if (!est || !bases.length) return out;
  const N = est.nodes || {};
  const piso = (y: number) => { let k = 0; bases.forEach((b, i) => { if (y >= b - 0.01) k = i; }); return k; };
  Object.values(est.segments || {}).forEach(s => {
    const a = N[s.nodeAId], b = N[s.nodeBId];
    if (!a || !b) return;
    const L = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const p = INVENTARIO_PERFILES_TUBULARES.find(x => x.id === s.profileId);
    const ten = modeloTensor(s.profileId);
    // Las vigas de un entrepiso son el techo del piso de abajo.
    const y = Math.min(a.y, b.y), horizontal = Math.abs(a.y - b.y) < 0.01;
    const o = out[piso(horizontal && y > 0.05 ? y - 0.05 : y + 0.01)];
    o.perfiles++; o.metros += L; o.kg += L * (p?.pesoLinealKgM || ten?.kgM || 0);
    o.costoAcero += L * (p ? precioBarraPerfil(p, p.costoMetroSol * (p.longitudComercialM || 6)) / (p.longitudComercialM || 6) : ten ? precio(ten.clave) / (ten.tipo === 'varilla' ? 6 : 1) : 0);
  });
  Object.values(est.coverageZones || {}).forEach(z => {
    const pts = (z.nodeIdsBoundary || []).map(id => N[id]).filter(Boolean);
    if (pts.length < 3) return;
    let ax = 0, ay = 0, az = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const u = [pts[i].x - pts[0].x, pts[i].y - pts[0].y, pts[i].z - pts[0].z], v = [pts[i + 1].x - pts[0].x, pts[i + 1].y - pts[0].y, pts[i + 1].z - pts[0].z];
      ax += u[1] * v[2] - u[2] * v[1]; ay += u[2] * v[0] - u[0] * v[2]; az += u[0] * v[1] - u[1] * v[0];
    }
    const area = Math.hypot(ax, ay, az) / 2;
    const c = INVENTARIO_COBERTURAS.find(x => x.id === z.coberturaMaterialId);
    const o = out[piso(Math.min(...pts.map(p => p.y)) + 0.01)];
    o.coberturaM2 += area; o.costoCobertura += area * (c ? precio(claveCobertura(c.id), c.costoM2Sol) : 0);
    if (c && !o.coberturas.includes(c.nombre)) o.coberturas.push(c.nombre);
  });
  return out;
}

// Tanques Rotoplas colocados desde Techos (nodos "TQ<litros>-P1..4@<id>").
export interface TanqueObra {
  id: string; numero: number; x: number; y: number; z: number; litros: number; lado: number; diametro: number; alto: number;
  cotaBase: number;              // donde apoya la torre
  ySobretecho: number | null;    // techito sobre el tanque (se hace en Techos)
  sobretechoCobertura?: string;  // material del sobretecho
  sobretechoM2: number;
}
export function tanquesEnEstructura(est: EstructuraTechos | null): TanqueObra[] {
  if (!est) return [];
  const grupos = new Map<string, { xs: number[]; ys: number[]; zs: number[]; litros: number; techo: number[]; base: number[] }>();
  Object.values(est.nodes || {}).forEach(n => {
    const lab = n.nodeLabel || '';
    const m = /^TQ(\d+)-P\d@(.+)$/.exec(lab);
    const st = /^TQS-\d@(.+)$/.exec(lab);
    const bs = /^TQB-\d@(.+)$/.exec(lab);
    const gid = m?.[2] || st?.[1] || bs?.[1];
    if (!gid) return;
    const g = grupos.get(gid) || { xs: [], ys: [], zs: [], litros: 0, techo: [], base: [] };
    if (m) { g.xs.push(n.x); g.ys.push(n.y); g.zs.push(n.z); g.litros = Number(m[1]); } else if (st) g.techo.push(n.y); else g.base.push(n.y);
    grupos.set(gid, g);
  });
  const zonas = Object.values(est.coverageZones || {});
  return [...grupos.entries()].filter(([, g]) => g.xs.length).sort(([a], [b]) => a.localeCompare(b)).map(([id, g], k) => {
    const tk = TANQUES_ROTOPLAS[g.litros] || TANQUES_ROTOPLAS[1100];
    const lado = Math.max(...g.xs) - Math.min(...g.xs);
    const zona = zonas.find(z => z.nodeIdsBoundary.some(nid => (est.nodes[nid]?.nodeLabel || '').endsWith(`@${id}`)));
    const pts = zona ? zona.nodeIdsBoundary.map(nid => est.nodes[nid]).filter(Boolean) : [];
    let ax = 0, ay = 0, az = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const u = [pts[i].x - pts[0].x, pts[i].y - pts[0].y, pts[i].z - pts[0].z], v = [pts[i + 1].x - pts[0].x, pts[i + 1].y - pts[0].y, pts[i + 1].z - pts[0].z];
      ax += u[1] * v[2] - u[2] * v[1]; ay += u[2] * v[0] - u[0] * v[2]; az += u[0] * v[1] - u[1] * v[0];
    }
    return {
      id, numero: k + 1, litros: g.litros, lado, diametro: tk.diametro, alto: tk.alto,
      cotaBase: g.base.length ? Math.min(...g.base) : Math.max(...g.ys),
      sobretechoCobertura: zona ? (INVENTARIO_COBERTURAS.find(c => c.id === zona.coberturaMaterialId)?.nombre || zona.coberturaMaterialId) : undefined,
      sobretechoM2: Math.hypot(ax, ay, az) / 2,
      x: g.xs.reduce((a, b) => a + b, 0) / g.xs.length, y: Math.max(...g.ys), z: g.zs.reduce((a, b) => a + b, 0) / g.zs.length,
      ySobretecho: g.techo.length ? Math.min(...g.techo) : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Cielo raso (falso techo de drywall) por piso y bajo el sobretecho del tanque
// ---------------------------------------------------------------------------
export const KEY_CIELOS = 'concreto_cielos';               // Record<nivel | 'tanque:<id>', CieloRaso>
export const KEY_AMBIENTES = 'concreto_ambientes_nombres'; // Record<'<nivel>#<clave>', nombre>

export interface CieloRaso {
  activo: boolean;
  modo: 'plano' | 'inclinado'; // plano: horizontal · inclinado: sigue la pendiente del techo
  altura: number;              // m sobre el piso (modo plano)
  materialId: string;          // placa de drywall
}
export const cieloDefault = (altoPiso?: number): CieloRaso => ({
  activo: true, modo: 'plano', materialId: 'drywall_standard_125',
  altura: Math.round(Math.max(2.3, Math.min(2.7, (altoPiso || 3) - 0.3)) * 100) / 100,
});

type P2 = { x: number; y: number };
export function areaPoligono(p: P2[]) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; } return Math.abs(s) / 2; }
export function perimetroPoligono(p: P2[]) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += Math.hypot(b.x - a.x, b.y - a.y); } return s; }
function dentro(p: P2, poly: P2[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
function casco(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: P2[] = [], up: P2[] = [];
  p.forEach(q => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-9) lo.pop(); lo.push(q); });
  [...p].reverse().forEach(q => { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 1e-9) up.pop(); up.push(q); });
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}

// Zonas que cubre el cielo raso: los ambientes del piso; si no hay muros
// cerrados, la huella de los muros o de las columnas de la estructura.
export function regionesCielo(muros: PlanoElem[], est: EstructuraTechos | null, base: number): P2[][] {
  const amb = detectarAmbientes(muros);
  if (amb.length) return amb.map(a => a.poly);
  const pts: P2[] = [];
  muros.forEach(m => { if (m.x2 !== undefined && m.y2 !== undefined) pts.push({ x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 }); });
  if (pts.length < 3 && est) {
    const N = est.nodes || {};
    Object.values(est.segments || {}).forEach(sg => {
      if (!sg.rolEstructural.startsWith('columna')) return;
      const a = N[sg.nodeAId], b = N[sg.nodeBId];
      if (!a || !b || esNodoTanque(a) || esNodoTanque(b)) return;
      if (Math.min(a.y, b.y) <= base + 0.1 && Math.max(a.y, b.y) > base + 0.5) pts.push({ x: a.x, y: a.z });
    });
  }
  const h = casco(pts);
  return h.length >= 3 && areaPoligono(h) > 0.5 ? [h] : [];
}

export interface MallaCielo { tris: number[]; contornos: number[][]; area: number; perimetro: number; areaPlanta: number; recortado: boolean; alturaMin: number; alturaMax: number }

// Malla del cielo raso (coordenadas absolutas x, y, z). En modo plano se baja
// donde el techo queda más bajo que la altura pedida (aleros, curvas).
export function mallaCielo(regiones: P2[][], cfg: CieloRaso, ctx: ContextoMuro): MallaCielo {
  const out: MallaCielo = { tris: [], contornos: [], area: 0, perimetro: 0, areaPlanta: 0, recortado: false, alturaMin: Infinity, alturaMax: 0 };
  if (!regiones.length) return out;
  const paso = 0.25;
  const cache = new Map<string, number>();
  const alto = (x: number, z: number) => {
    const k = NKp(x, z);
    const c = cache.get(k);
    if (c !== undefined) return c;
    const techo = altoBajoTecho(x, z, ctx);
    let y: number;
    if (cfg.modo === 'inclinado' && techo !== null) y = techo - 0.15;
    else {
      y = cfg.altura;
      if (techo !== null && techo - 0.05 < y) { y = techo - 0.05; out.recortado = true; }
    }
    y = Math.max(1.8, y);
    out.alturaMin = Math.min(out.alturaMin, y); out.alturaMax = Math.max(out.alturaMax, y);
    cache.set(k, y);
    return y;
  };
  let celdasPlanta = 0, area3d = 0;
  regiones.forEach(poly => {
    out.areaPlanta += areaPoligono(poly);
    out.perimetro += perimetroPoligono(poly);
    out.contornos.push(poly.flatMap(p => [p.x, ctx.base + alto(p.x, p.y), p.y]));
    const xs = poly.map(p => p.x), zs = poly.map(p => p.y);
    const x0 = Math.floor(Math.min(...xs) / paso) * paso, x1 = Math.max(...xs), z0 = Math.floor(Math.min(...zs) / paso) * paso, z1 = Math.max(...zs);
    for (let x = x0; x < x1 - 1e-6; x += paso) for (let z = z0; z < z1 - 1e-6; z += paso) {
      if (!dentro({ x: x + paso / 2, y: z + paso / 2 }, poly)) continue;
      const v = [[x, z], [x + paso, z], [x + paso, z + paso], [x, z + paso]].map(([a, b]) => [a, ctx.base + alto(a, b), b]);
      [[0, 1, 2], [0, 2, 3]].forEach(([i, j, k]) => {
        out.tris.push(...v[i], ...v[j], ...v[k]);
        const u = [v[j][0] - v[i][0], v[j][1] - v[i][1], v[j][2] - v[i][2]], w = [v[k][0] - v[i][0], v[k][1] - v[i][1], v[k][2] - v[i][2]];
        area3d += Math.hypot(u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]) / 2;
      });
      celdasPlanta += paso * paso;
    }
  });
  // Corrige el escalonado de la rejilla con el área exacta en planta.
  out.area = celdasPlanta > 0 ? area3d * (out.areaPlanta / celdasPlanta) : 0;
  if (!isFinite(out.alturaMin)) out.alturaMin = 0;
  return out;
}

// Cielo raso bajo el sobretecho de un tanque: cuadrado de la plataforma.
export function mallaCieloTanque(t: TanqueObra): MallaCielo {
  const h = t.lado / 2, y = t.y + t.alto + 0.15;
  const v = [[t.x - h, y, t.z - h], [t.x + h, y, t.z - h], [t.x + h, y, t.z + h], [t.x - h, y, t.z + h]];
  return {
    tris: [...v[0], ...v[1], ...v[2], ...v[0], ...v[2], ...v[3]], contornos: [v.flat()],
    area: t.lado * t.lado, areaPlanta: t.lado * t.lado, perimetro: 4 * t.lado, recortado: false, alturaMin: t.alto + 0.15, alturaMax: t.alto + 0.15,
  };
}

// Sobrepecho: murete de ladrillo alrededor de la plataforma del tanque
// (opcional, se agrega en Concreto). Clave: id del tanque.
export const KEY_SOBREPECHOS = 'concreto_sobrepechos';
export interface Sobrepecho { activo: boolean; ladrilloId: string; alto: number; holgura: number }
export const sobrepechoDefault = (): Sobrepecho => ({ activo: true, ladrilloId: 'ladrillo_pandereta', alto: 1.0, holgura: 0.3 });
export const perimetroSobrepecho = (t: TanqueObra, s: Sobrepecho) => 4 * (t.lado + 2 * s.holgura);

// ---------------------------------------------------------------------------
// Capas de la estructura de Techos según el rol de cada perfil
// ---------------------------------------------------------------------------
export type CapaEstructura = 'columnas' | 'tijerales' | 'correas' | 'arriostres' | 'vigas' | 'otros';
export const CAPAS: Record<CapaEstructura, { nombre: string; color: string; hex: number }> = {
  columnas: { nombre: 'Columnas', color: '#475569', hex: 0x55606e },
  tijerales: { nombre: 'Tijerales', color: '#2563eb', hex: 0x5f6f82 },
  correas: { nombre: 'Correas', color: '#0891b2', hex: 0x6b8796 },
  arriostres: { nombre: 'Arriostres y tensores', color: '#9333ea', hex: 0x7c6f8e },
  vigas: { nombre: 'Vigas / entrepiso', color: '#059669', hex: 0x5c7468 },
  otros: { nombre: 'Otros', color: '#78716c', hex: 0x77736e },
};
export function capaDeRol(rol: string): CapaEstructura {
  if (rol.startsWith('columna') || rol === 'placa_base') return 'columnas';
  if (['cordon_superior', 'cordon_inferior', 'diagonal', 'montante', 'cartela'].includes(rol)) return 'tijerales';
  if (rol === 'correa') return 'correas';
  if (rol === 'arriostre' || rol === 'tensor_viento') return 'arriostres';
  if (['viga_principal', 'viga_secundaria', 'piso_deck'].includes(rol)) return 'vigas';
  return 'otros';
}
