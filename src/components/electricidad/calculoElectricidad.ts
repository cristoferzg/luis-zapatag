// =============================================================================
// Electricidad: cálculo a partir de la geometría.
//   · sugerirCircuitos / circuitoParaPunto: reparte los puntos en circuitos (CNE-U).
//   · trazarAutomatico: tuberías en L desde el tablero (luces por el techo, tomas por
//     el piso), cada interruptor a las luces que controla, alimentador y línea a tierra.
//   · grafo por circuito: conexiones, curvas, cajas de paso y conductores por tramo.
//   · cuadroCargas: potencia instalada, máxima demanda, corriente, protecciones.
//   · avisosCNE y metradoEle (materiales, dispositivos, tablero, pozo y mano de obra).
// =============================================================================
import { precio, claveJornal, itemCatalogo } from '../../lib/catalogoPrecios';
import {
  claveCable, claveTuboEle, claveCurva, claveUnion, claveConector, claveTM, claveID, LARGO_BARRA_ELE, NOMBRE_CABLE, NOMBRE_TUBO,
} from '../../catalogo/electricidad';
import {
  ALIM, PT, BREAKER_MAX, COS_FI, CotizacionEle, Circuito, H_TABLERO, H_TECHO, Pt, Punto, Ruta, TENSION, TipoPunto, UsoCircuito, USOS, MuroRef,
  corriente, defPunto, dimensionar, esEspecial, esInterruptor, esLuz, nombrePunto, nuevoCircuito, potencia, renumerar, uid, nombreCircuito,
} from './modeloElectricidad';

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const man = (a: Pt, b: Pt) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const f2 = (n: number) => n.toFixed(2);
export const largoRuta = (t: Ruta) => t.pts.slice(1).reduce((s, p, i) => s + dist(p, t.pts[i]), 0);
export function proyectar(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  const t = L2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
  const q = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, q, d: dist(p, q) };
}
export const TOL_PUNTO = 0.09;
/** Separación (m) con que se dibuja cada circuito para que no se tapen los que van juntos. */
export function offsetCircuito(cot: { circuitos: Circuito[] }, id: string) {
  if (id === ALIM) return -0.05; if (id === PT) return 0.05;
  const n = cot.circuitos.length, i = Math.max(0, cot.circuitos.findIndex(c => c.id === id));
  return Math.max(-0.14, Math.min(0.14, (i - (n - 1) / 2) * 0.035));
}
/** Desplaza una polilínea en ángulo recto (para que los circuitos que van juntos se distingan). */
export function desplazar(pts: Pt[], off: number): Pt[] {
  if (!off || pts.length < 2) return pts;
  const nrm = (a: Pt, b: Pt) => { const L = dist(a, b) || 1; return { x: -(b.y - a.y) / L, y: (b.x - a.x) / L }; };
  return pts.map((p, i) => {
    const n1 = i > 0 ? nrm(pts[i - 1], p) : null, n2 = i < pts.length - 1 ? nrm(p, pts[i + 1]) : null;
    let n = n1 && n2 ? (Math.abs(n1.x - n2.x) + Math.abs(n1.y - n2.y) < 1e-6 ? n1 : { x: n1.x + n2.x, y: n1.y + n2.y }) : (n1 || n2)!;
    if (n1 && n2 && Math.abs(n1.x * n2.x + n1.y * n2.y) > 0.2 && n !== n1) n = n1;
    return { x: p.x + n.x * off, y: p.y + n.y * off };
  });
}

const usoDe = (t: TipoPunto): UsoCircuito | undefined => defPunto(t).uso;

// ── Circuitos ───────────────────────────────────────────────────────────────
const LIM_PUNTOS: Partial<Record<UsoCircuito, number>> = { alumbrado: 12, tomas: 12, cocina: 8 };
const LIM_W: Partial<Record<UsoCircuito, number>> = { alumbrado: 1500, tomas: 2500, cocina: 3500 };
export const cargaCircuito = (cot: { puntos: Punto[] }, id: string) => cot.puntos.filter(p => p.circuito === id).reduce((s, p) => s + potencia(p), 0);
export const puntosCircuito = (cot: { puntos: Punto[] }, id: string) => cot.puntos.filter(p => p.circuito === id && !esInterruptor(p.tipo));

/** Circuito para un punto nuevo: uno del mismo uso con espacio, o uno nuevo (exclusivos siempre nuevos). */
export function circuitoParaPunto(cot: { puntos: Punto[]; circuitos: Circuito[] }, tipo: TipoPunto, w?: number): { circuitos: Circuito[]; id?: string } {
  const d = defPunto(tipo), uso = d.uso;
  if (!uso || esEspecial(tipo)) return { circuitos: cot.circuitos, id: undefined };
  if (!d.exclusivo) {
    const c = cot.circuitos.find(k => k.uso === uso && (esInterruptor(tipo) || (puntosCircuito(cot, k.id).length < (LIM_PUNTOS[uso] || 99) && cargaCircuito(cot, k.id) + (w ?? d.w) <= (LIM_W[uso] || 1e9))));
    if (c) return { circuitos: cot.circuitos, id: c.id };
  }
  const nuevo = nuevoCircuito(cot.circuitos, uso, d.exclusivo ? d.nombre.replace('Salida de fuerza para ', '').replace(/^./, m => m.toUpperCase()) : undefined);
  const dm = dimensionar(uso, w ?? d.w);
  const cs = renumerar(ordenar([...cot.circuitos, { ...nuevo, ...dm }]));
  return { circuitos: cs, id: nuevo.id };
}
const ORDEN_USO: UsoCircuito[] = ['alumbrado', 'tomas', 'cocina', 'fuerza', 'debil'];
const ordenar = (cs: Circuito[]) => [...cs].sort((a, b) => ORDEN_USO.indexOf(a.uso) - ORDEN_USO.indexOf(b.uso));

/** Recalcula interruptor, sección y tubo de los circuitos que el usuario no fijó. */
export function redimensionar(cot: CotizacionEle): CotizacionEle {
  let cambio = false;
  const cs = cot.circuitos.map(c => {
    if (c.manual || c.uso === 'debil') return c;
    const dm = dimensionar(c.uso, cargaCircuito(cot, c.id));
    if (dm.breaker === c.breaker && dm.seccion === c.seccion && dm.tubo === c.tubo) return c;
    cambio = true; return { ...c, ...dm };
  });
  return cambio ? { ...cot, circuitos: cs } : cot;
}

/** Reparte todos los puntos en circuitos según el uso (CNE-U): alumbrado, tomas, cocina, exclusivos y comunicaciones. */
export function sugerirCircuitos(cot: CotizacionEle): { circuitos: Circuito[]; puntos: Punto[] } {
  const out: Circuito[] = [];
  const asign = new Map<string, string>();
  const grupo = (uso: UsoCircuito, ps: Punto[], desc: string) => {
    if (!ps.length) return;
    // Ordena por zonas (de adelante hacia atrás) y reparte en circuitos parejos que no pasen el límite.
    const orden = [...ps].sort((a, b) => (a.y + a.x * 0.15) - (b.y + b.x * 0.15));
    const W = orden.reduce((s, q) => s + potencia(q), 0);
    const n = Math.max(1, Math.ceil(orden.length / (LIM_PUNTOS[uso] || 99)), Math.ceil(W / (LIM_W[uso] || 1e9)));
    const grupos: Punto[][] = Array.from({ length: n }, () => []);
    let gi = 0, acc = 0;
    orden.forEach(p => {
      if (gi < n - 1 && grupos[gi].length && (grupos[gi].length >= Math.ceil(orden.length / n) || acc + potencia(p) / 2 > W / n)) { gi++; acc = 0; }
      grupos[gi].push(p); acc += potencia(p);
    });
    grupos.forEach((g, i) => {
      const c = { ...nuevoCircuito(out, uso, grupos.length > 1 ? `${desc} ${i + 1}` : desc) };
      Object.assign(c, dimensionar(uso, g.reduce((s, q) => s + potencia(q), 0)));
      out.push(c); g.forEach(p => asign.set(p.id, c.id));
    });
  };
  const ps = cot.puntos.filter(p => !esEspecial(p.tipo));
  grupo('alumbrado', ps.filter(p => usoDe(p.tipo) === 'alumbrado' && !esInterruptor(p.tipo)), 'Alumbrado');
  grupo('tomas', ps.filter(p => usoDe(p.tipo) === 'tomas'), 'Tomacorrientes');
  grupo('cocina', ps.filter(p => usoDe(p.tipo) === 'cocina'), 'Tomas cocina y lavandería');
  ps.filter(p => defPunto(p.tipo).exclusivo).forEach(p => {
    const c = nuevoCircuito(out, 'fuerza', nombrePunto(p, cot.puntos));
    Object.assign(c, dimensionar('fuerza', potencia(p)));
    out.push(c); asign.set(p.id, c.id);
  });
  const debiles = ps.filter(p => usoDe(p.tipo) === 'debil');
  if (debiles.length) { const c = nuevoCircuito(out, 'debil'); out.push(c); debiles.forEach(p => asign.set(p.id, c.id)); }
  // Interruptores: al circuito de la primera luz que controlan (o de la luz más cercana).
  const luces = ps.filter(p => esLuz(p.tipo));
  ps.filter(p => esInterruptor(p.tipo)).forEach(p => {
    const l = (p.controla || []).map(id => luces.find(x => x.id === id)).find(Boolean) || [...luces].sort((a, b) => dist(a, p) - dist(b, p))[0];
    const c = l && asign.get(l.id);
    if (c) asign.set(p.id, c); else if (out.find(k => k.uso === 'alumbrado')) asign.set(p.id, out.find(k => k.uso === 'alumbrado')!.id);
  });
  return { circuitos: renumerar(out), puntos: cot.puntos.map(p => ({ ...p, circuito: asign.get(p.id) })) };
}

// ── Trazado automático ──────────────────────────────────────────────────────
interface Destino { p: Pt; key: string }
interface Arbol { nodos: Pt[]; aristas: [number, number][]; raices: number[]; destinoNodo: Map<string, number> }
/** Árbol en L: cada destino se une al punto más cercano de lo ya trazado (el más cercano primero). */
function arbolL(raices: Pt[], destinos: Destino[]): Arbol {
  const nodos: Pt[] = [], aristas: [number, number][] = [];
  const nodoEn = (p: Pt) => { const i = nodos.findIndex(n => dist(n, p) < 0.005); if (i >= 0) return i; nodos.push({ x: r3(p.x), y: r3(p.y) }); return nodos.length - 1; };
  const rs = raices.map(nodoEn);
  const destinoNodo = new Map<string, number>();
  const pend = [...destinos];
  while (pend.length) {
    let best = { i: 0, d: Infinity, p: nodos[rs[0]], arista: -1, nodo: rs[0] };
    pend.forEach((de, i) => {
      rs.forEach(r => { const d = man(nodos[r], de.p); if (d < best.d - 1e-6) best = { i, d, p: nodos[r], arista: -1, nodo: r }; });
      destinoNodo.forEach(n => { const d = man(nodos[n], de.p); if (d < best.d - 1e-6) best = { i, d, p: nodos[n], arista: -1, nodo: n }; });
      aristas.forEach(([a, b], k) => {
        const A = nodos[a], B = nodos[b];
        const q = { x: Math.max(Math.min(A.x, B.x), Math.min(Math.max(A.x, B.x), de.p.x)), y: Math.max(Math.min(A.y, B.y), Math.min(Math.max(A.y, B.y), de.p.y)) };
        const d = man(q, de.p) + 0.0001;
        if (d < best.d - 1e-6) best = { i, d, p: q, arista: k, nodo: -1 };
      });
    });
    const de = pend.splice(best.i, 1)[0];
    let desde: number, horizontalPrimero: boolean;
    if (best.arista >= 0) {
      const [a, b] = aristas[best.arista];
      const horiz = Math.abs(nodos[a].y - nodos[b].y) < 1e-6;
      desde = nodoEn(best.p);
      if (desde !== a && desde !== b) aristas.splice(best.arista, 1, [a, desde], [desde, b]);
      horizontalPrimero = !horiz;
    } else { desde = best.nodo; horizontalPrimero = Math.abs(de.p.x - nodos[desde].x) >= Math.abs(de.p.y - nodos[desde].y); }
    const P = nodos[desde];
    const esq = horizontalPrimero ? { x: de.p.x, y: P.y } : { x: P.x, y: de.p.y };
    const fin = nodoEn(de.p);
    if (fin === desde) { destinoNodo.set(de.key, fin); continue; }
    if (dist(esq, P) > 0.005 && dist(esq, de.p) > 0.005) { const k = nodoEn(esq); aristas.push([desde, k], [k, fin]); }
    else aristas.push([desde, fin]);
    destinoNodo.set(de.key, fin);
  }
  return { nodos, aristas, raices: rs, destinoNodo };
}
/** Árbol → rutas (polilíneas entre el tablero, las cajas y las derivaciones). */
function rutasDeArbol(ar: Arbol, circuito: string, via: 'techo' | 'piso'): Ruta[] {
  const ady = ar.nodos.map(() => [] as number[]);
  ar.aristas.forEach(([a, b], i) => { ady[a].push(i); ady[b].push(i); });
  const destinos = new Set(ar.destinoNodo.values());
  const corte = (n: number) => ar.raices.includes(n) || destinos.has(n) || ady[n].length !== 2;
  const usada = ar.aristas.map(() => false), out: Ruta[] = [];
  const visit = (n: number) => ady[n].forEach(i0 => {
    if (usada[i0]) return;
    const pts: Pt[] = [ar.nodos[n]]; let i = i0, cur = n;
    for (;;) {
      usada[i] = true; const [a, b] = ar.aristas[i]; cur = a === cur ? b : a; pts.push(ar.nodos[cur]);
      if (corte(cur)) break;
      const sig = ady[cur].find(k => !usada[k]); if (sig === undefined) break; i = sig;
    }
    const lim = pts.filter((p, k) => k === 0 || k === pts.length - 1 || Math.abs((pts[k - 1].x - p.x) * (pts[k + 1].y - p.y) - (pts[k - 1].y - p.y) * (pts[k + 1].x - p.x)) > 1e-6);
    out.push({ id: uid(), circuito, via, pts: lim, auto: true });
    visit(cur);
  });
  ar.raices.forEach(visit);
  ar.nodos.forEach((_, n) => { if (corte(n)) visit(n); });
  return out;
}
function cruzaMuro(a: Pt, b: Pt, muros: MuroRef[]) {
  return muros.some(m => {
    const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: m.x2 - m.x1, y: m.y2 - m.y1 };
    const den = r.x * s.y - r.y * s.x; if (Math.abs(den) < 1e-9) return false;
    const qp = { x: m.x1 - a.x, y: m.y1 - a.y };
    const t = (qp.x * s.y - qp.y * s.x) / den, u = (qp.x * r.y - qp.y * r.x) / den;
    if (t <= 0.02 || t >= 0.98 || u <= 0 || u >= 1) return false;
    const L = Math.hypot(s.x, s.y), pos = u * L;
    return !(m.vanos || []).some(v => Math.abs(pos - v.t) <= v.w / 2 + 0.05);
  });
}
/** Luces que controla cada interruptor: las que eligió el usuario o las más cercanas sin muro de por medio. */
export function enlazarInterruptores(cot: CotizacionEle): Punto[] {
  const luces = cot.puntos.filter(p => esLuz(p.tipo));
  const tomadas = new Set(cot.puntos.filter(p => esInterruptor(p.tipo)).flatMap(p => p.controla || []));
  return cot.puntos.map(p => {
    if (!esInterruptor(p.tipo)) return p;
    const ok = (p.controla || []).filter(id => luces.some(l => l.id === id));
    if (ok.length) return ok.length === (p.controla || []).length ? p : { ...p, controla: ok };
    const n = p.tipo === 'int_conmutador' ? 1 : defPunto(p.tipo).retornos || 1;
    const cand = luces.filter(l => !cruzaMuro(p, l, cot.fondo.muros)).sort((a, b) => (tomadas.has(a.id) ? 1 : 0) - (tomadas.has(b.id) ? 1 : 0) || dist(a, p) - dist(b, p));
    const elegidas = (cand.length ? cand : [...luces].sort((a, b) => dist(a, p) - dist(b, p))).slice(0, n);
    elegidas.forEach(l => tomadas.add(l.id));
    return elegidas.length ? { ...p, controla: elegidas.map(l => l.id) } : p;
  });
}
/** Traza todas las rutas desde el tablero. Devuelve también los enlaces interruptor → luces. */
export function trazarAutomatico(cot: CotizacionEle): { rutas: Ruta[]; puntos: Punto[]; notas: string[] } {
  const notas: string[] = [];
  const td = cot.puntos.find(p => p.tipo === 'tablero');
  if (!td) return { rutas: [], puntos: cot.puntos, notas: ['Pon el tablero de distribución (TD) para trazar los circuitos.'] };
  // Cada interruptor va en el circuito de la luz que controla.
  const enl = enlazarInterruptores(cot);
  const puntos = enl.map(p => { if (!esInterruptor(p.tipo)) return p; const l = enl.find(x => x.id === (p.controla || [])[0]); return l?.circuito && l.circuito !== p.circuito ? { ...p, circuito: l.circuito } : p; });
  const out: Ruta[] = [];
  cot.circuitos.forEach(c => {
    const ps = puntos.filter(p => p.circuito === c.id && !esInterruptor(p.tipo));
    (['techo', 'piso'] as const).forEach(via => {
      const ds = ps.filter(p => defPunto(p.tipo).via === via);
      if (ds.length) out.push(...rutasDeArbol(arbolL([td], ds.map(p => ({ p, key: p.id }))), c.id, via));
    });
    // Interruptores: bajada desde la luz que controlan.
    puntos.filter(p => p.circuito === c.id && esInterruptor(p.tipo)).forEach(s => {
      const l = puntos.find(x => x.id === (s.controla || [])[0]); if (!l) return;
      const perp = s.rot % 180 === 0; // en muro horizontal: primero entra al ambiente (en y)
      const esq = perp ? { x: s.x, y: l.y } : { x: l.x, y: s.y };
      const pts = [{ x: s.x, y: s.y }, esq, { x: l.x, y: l.y }].filter((p, i, a) => i === 0 || dist(p, a[i - 1]) > 0.005);
      if (pts.length >= 2) out.push({ id: uid(), circuito: c.id, via: 'techo', pts: pts.map(p => ({ x: r3(p.x), y: r3(p.y) })), auto: true });
    });
  });
  const sinCirc = puntos.filter(p => !esEspecial(p.tipo) && !cot.circuitos.some(c => c.id === p.circuito));
  if (sinCirc.length) notas.push(`${sinCirc.length} punto(s) sin circuito: toca "Sugerir circuitos".`);
  const med = puntos.find(p => p.tipo === 'medidor');
  if (med) out.push(...rutasDeArbol(arbolL([med], [{ p: td, key: td.id }]), ALIM, 'piso'));
  else notas.push('Pon el medidor para trazar el alimentador.');
  const pozo = puntos.find(p => p.tipo === 'pozo_tierra');
  if (pozo) out.push(...rutasDeArbol(arbolL([td], [{ p: pozo, key: pozo.id }]), PT, 'piso'));
  else notas.push('Falta el pozo a tierra.');
  return { rutas: out, puntos, notas };
}

// ── Grafo de un circuito ────────────────────────────────────────────────────
export interface Nudo { x: number; y: number; aristas: number[]; puntos: Punto[] }
export interface Arista { a: number; b: number; ruta: Ruta; len: number }
export interface Grafo { nudos: Nudo[]; aristas: Arista[]; raiz: number[] }
export function grafoCircuito(cot: { puntos: Punto[]; rutas: Ruta[] }, circ: string): Grafo {
  const rutas = cot.rutas.filter(r => r.circuito === circ);
  const nudos: Nudo[] = [], aristas: Arista[] = [];
  const nudo = (p: Pt) => { const i = nudos.findIndex(n => dist(n, p) < 0.03); if (i >= 0) return i; nudos.push({ x: p.x, y: p.y, aristas: [], puntos: [] }); return nudos.length - 1; };
  // Extremos que caen sobre otra ruta del mismo circuito (unión en T): se parte esa ruta.
  const cortes = new Map<string, { i: number; t: number; p: Pt }[]>();
  rutas.forEach(r => [r.pts[0], r.pts[r.pts.length - 1]].forEach(e => rutas.forEach(o => {
    if (o.id === r.id) return;
    for (let i = 0; i < o.pts.length - 1; i++) { const pr = proyectar(e, o.pts[i], o.pts[i + 1]); if (pr.d < 0.03 && pr.t > 0.001 && pr.t < 0.999) cortes.set(o.id, [...(cortes.get(o.id) || []), { i, t: pr.t, p: pr.q }]); }
  })));
  rutas.forEach(r => {
    const pts: Pt[] = [];
    r.pts.forEach((p, i) => { pts.push(p); (cortes.get(r.id) || []).filter(c => c.i === i).sort((a, b) => a.t - b.t).forEach(c => pts.push(c.p)); });
    for (let i = 0; i < pts.length - 1; i++) {
      const a = nudo(pts[i]), b = nudo(pts[i + 1]); if (a === b) continue;
      aristas.push({ a, b, ruta: r, len: dist(pts[i], pts[i + 1]) }); nudos[a].aristas.push(aristas.length - 1); nudos[b].aristas.push(aristas.length - 1);
    }
  });
  const especial = circ === ALIM ? ['tablero', 'medidor'] : circ === PT ? ['tablero', 'pozo_tierra'] : ['tablero'];
  cot.puntos.forEach(p => {
    if (p.circuito !== circ && !especial.includes(p.tipo)) return;
    let bi = -1, bd = TOL_PUNTO; nudos.forEach((n, i) => { const d = dist(n, p); if (d < bd) { bd = d; bi = i; } });
    if (bi >= 0) nudos[bi].puntos.push(p);
  });
  const raizTipo = circ === ALIM ? 'medidor' : 'tablero';
  const raiz = nudos.map((n, i) => (n.puntos.some(p => p.tipo === raizTipo) ? i : -1)).filter(i => i >= 0);
  return { nudos, aristas, raiz };
}
/** Orden BFS desde la raíz con la arista padre de cada nudo (-1 = raíz o suelto). */
function recorrer(g: Grafo) {
  const padre = g.nudos.map(() => -2), orden: number[] = [];
  const cola = [...g.raiz]; g.raiz.forEach(r => { padre[r] = -1; });
  while (cola.length) { const n = cola.shift()!; orden.push(n); g.nudos[n].aristas.forEach(i => { const e = g.aristas[i], m = e.a === n ? e.b : e.a; if (padre[m] === -2) { padre[m] = i; cola.push(m); } }); }
  return { padre, orden };
}

// ── Información de cada ruta: verticales, curvas, cajas de paso, conductores ──
export type ColorCable = 'rojo' | 'negro' | 'verde' | 'amarillo';
export interface CableRuta { sec: number; color: ColorCable; m: number }
export interface InfoRuta {
  id: string; circuito: string; len: number; vert: number; curvas: number; paso: number; cond: number; diam: string;
  cables: CableRuta[]; coax: number; utp: number; extremos: { p?: Punto; v: number }[]; texto: string;
}
const HOLGURA = 0.3; // m de cable que se deja en cada caja, por conductor
export function infoRutas(cot: CotizacionEle, seccionAlim: number): Map<string, InfoRuta> {
  const out = new Map<string, InfoRuta>();
  const ids = [...cot.circuitos.map(c => c.id), ALIM, PT];
  ids.forEach(cid => {
    const c = cot.circuitos.find(k => k.id === cid);
    const g = grafoCircuito(cot, cid);
    // Comunicaciones: cuántas salidas de TV y de datos cuelgan de cada arista.
    const abajo = g.aristas.map(() => ({ tv: 0, datos: 0 }));
    if (c?.uso === 'debil') {
      const { padre, orden } = recorrer(g);
      const cnt = g.nudos.map(n => ({ tv: n.puntos.filter(p => p.tipo === 'tv').length, datos: n.puntos.filter(p => p.tipo === 'datos').length }));
      [...orden].reverse().forEach(n => { const i = padre[n]; if (i < 0) return; abajo[i] = { ...cnt[n] }; const e = g.aristas[i], pa = e.a === n ? e.b : e.a; cnt[pa].tv += cnt[n].tv; cnt[pa].datos += cnt[n].datos; });
    }
    cot.rutas.filter(r => r.circuito === cid).forEach(r => {
      const len = largoRuta(r);
      const hR = r.via === 'techo' ? H_TECHO : 0;
      const enPunto = (q: Pt) => {
        const cand = cot.puntos.filter(p => p.circuito === cid || p.tipo === 'tablero' || (cid === ALIM && p.tipo === 'medidor') || (cid === PT && p.tipo === 'pozo_tierra'));
        let b: Punto | undefined, bd = TOL_PUNTO; cand.forEach(p => { const d = dist(p, q); if (d < bd) { bd = d; b = p; } }); return b;
      };
      const extremos = [r.pts[0], r.pts[r.pts.length - 1]].map(q => {
        const p = enPunto(q); if (!p) return { p, v: 0 };
        const h = p.tipo === 'tablero' ? (r.via === 'techo' ? H_TABLERO + 0.25 : H_TABLERO - 0.25) : p.tipo === 'pozo_tierra' ? -0.3 : defPunto(p.tipo).h;
        return { p, v: Math.abs(hR - h) };
      });
      let curvas = 0;
      for (let i = 1; i < r.pts.length - 1; i++) {
        const a = r.pts[i - 1], b = r.pts[i], d = r.pts[i + 1];
        const u = { x: b.x - a.x, y: b.y - a.y }, w = { x: d.x - b.x, y: d.y - b.y };
        const cos = (u.x * w.x + u.y * w.y) / ((Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y)) || 1);
        if (cos < 0.87) curvas++;
      }
      extremos.forEach(e => { if (e.v > 0.05) curvas++; });
      const vert = extremos.reduce((s, e) => s + e.v, 0);
      const L = len + vert;
      const paso = Math.max(0, Math.ceil(L / 15) - 1, Math.ceil(curvas / 2) - 1);
      const sw = extremos.find(e => e.p && esInterruptor(e.p.tipo))?.p;
      let cond = 3, cables: CableRuta[] = [], coax = 0, utp = 0, diam = c?.tubo || '3/4';
      const largoCable = (n: number) => (L + 2 * HOLGURA) * n;
      if (cid === ALIM) {
        cables = [{ sec: seccionAlim, color: 'rojo', m: largoCable(1) }, { sec: seccionAlim, color: 'negro', m: largoCable(1) }, { sec: Math.min(16, seccionAlim), color: 'verde', m: largoCable(1) }];
        diam = seccionAlim >= 25 ? '1 1/4' : '1';
      } else if (cid === PT) {
        cond = 1; cables = [{ sec: Math.max(10, Math.min(16, seccionAlim)), color: 'verde', m: largoCable(1) }]; diam = '3/4';
      } else if (c?.uso === 'debil') {
        // Cable por cada salida que cuelga de este tramo (dato aproximado por ruta: el mayor de sus aristas).
        const ar = g.aristas.map((e, i) => ({ e, i })).filter(x => x.e.ruta.id === r.id);
        const tv = Math.max(0, ...ar.map(x => abajo[x.i].tv)), da = Math.max(0, ...ar.map(x => abajo[x.i].datos));
        cond = Math.max(1, tv + da); coax = (L + 0.6) * tv; utp = (L + 0.6) * da; diam = cond > 3 ? '1' : '3/4';
      } else if (sw) {
        const ret = defPunto(sw.tipo).retornos || 1;
        cond = 1 + ret; cables = [{ sec: c?.seccion || 2.5, color: 'rojo', m: largoCable(1) }, { sec: c?.seccion || 2.5, color: 'amarillo', m: largoCable(ret) }];
      } else if (c) {
        cables = [{ sec: c.seccion, color: 'rojo', m: largoCable(1) }, { sec: c.seccion, color: 'negro', m: largoCable(1) }, { sec: c.seccion, color: 'verde', m: largoCable(1) }];
      }
      if (cond > 5 && diam === '3/4') diam = '1';
      const texto = cid === PT ? '1 × tierra' : c?.uso === 'debil' ? `${cond} cable${cond > 1 ? 's' : ''}` : sw ? `${cond} cond. (fase + ${cond - 1} retorno${cond > 2 ? 's' : ''})` : `${cond} cond. (2 líneas + tierra)`;
      out.set(r.id, { id: r.id, circuito: cid, len, vert, curvas, paso, cond, diam, cables, coax, utp, extremos, texto });
    });
  });
  return out;
}

// ── Cuadro de cargas ────────────────────────────────────────────────────────
export interface FilaCuadro { c: Circuito; puntos: number; ci: number; md: number; I: number; breakerReq: number; seccionReq: number; ok: boolean }
export interface Cuadro {
  filas: FilaCuadro[]; ci: number; md: number; I: number; ig: number; seccionAlim: number; tuboAlim: string;
  diferenciales: { amp: number; circ: string[]; suma: number }[]; polos: number; tablero: number; monofasico: boolean;
}
export function cuadroCargas(cot: CotizacionEle): Cuadro {
  const filas: FilaCuadro[] = cot.circuitos.map(c => {
    const ps = puntosCircuito(cot, c.id), ci = ps.reduce((s, p) => s + potencia(p), 0), md = ci * c.fd;
    const req = dimensionar(c.uso, ci);
    const ok = c.uso === 'debil' || (c.breaker >= req.breaker && (BREAKER_MAX[c.seccion] || 0) >= c.breaker && c.seccion >= req.seccion);
    return { c, puntos: ps.length, ci, md, I: c.uso === 'debil' ? 0 : corriente(ci), breakerReq: req.breaker, seccionReq: req.seccion, ok };
  });
  const ci = filas.reduce((s, f) => s + f.ci, 0), md = filas.reduce((s, f) => s + f.md, 0);
  const I = md / (TENSION * COS_FI);
  const ig = [32, 40, 50, 63, 80, 100].find(b => b >= I * 1.1) || 100;
  const seccionAlim = [10, 16, 25].find(s => (BREAKER_MAX[s] || 0) >= Math.min(ig, 80)) || 25;
  // Diferenciales: uno por circuito exclusivo; los de tomacorrientes van de a dos (ID 2×40 A).
  const difs: { amp: number; circ: string[]; suma: number }[] = [];
  filas.filter(f => f.c.diferencial && f.c.uso !== 'debil' && f.puntos).forEach(f => {
    const g = f.c.uso !== 'fuerza' ? difs.find(d => d.circ.length < 2 && d.suma + f.c.breaker <= 40 && !d.circ.some(n => filas.find(x => x.c.nombre === n)?.c.uso === 'fuerza')) : undefined;
    if (g) { g.circ.push(f.c.nombre); g.suma += f.c.breaker; } else difs.push({ amp: 0, circ: [f.c.nombre], suma: f.c.breaker });
  });
  difs.forEach(d => { d.amp = d.suma <= 25 ? 25 : d.suma <= 40 ? 40 : 63; });
  const nTM = filas.filter(f => f.c.uso !== 'debil').length;
  const polos = 2 + nTM * 2 + difs.length * 2 + 2;
  const tablero = [12, 18, 24, 36].find(n => n >= polos) || 36;
  return { filas, ci, md, I, ig, seccionAlim, tuboAlim: seccionAlim >= 25 ? '1 1/4' : '1', diferenciales: difs, polos, tablero, monofasico: md <= 10000 };
}

// ── Avisos CNE ──────────────────────────────────────────────────────────────
export interface Aviso { nivel: 'error' | 'aviso'; texto: string; punto?: string }
export function avisosCNE(cot: CotizacionEle, duchas: Pt[] = []): Aviso[] {
  const out: Aviso[] = [];
  const reales = cot.puntos.filter(p => !esEspecial(p.tipo));
  if (!reales.length) return out;
  const td = cot.puntos.filter(p => p.tipo === 'tablero');
  if (!td.length) out.push({ nivel: 'error', texto: 'Falta el tablero de distribución (TD): de ahí salen todos los circuitos.' });
  if (!cot.puntos.some(p => p.tipo === 'pozo_tierra')) out.push({ nivel: 'error', texto: 'Falta el pozo a tierra: el CNE pide puesta a tierra y conductor de protección en todos los tomacorrientes.' });
  if (!cot.puntos.some(p => p.tipo === 'medidor')) out.push({ nivel: 'aviso', texto: 'No hay medidor: pon dónde llega la acometida para calcular el alimentador.' });
  const sin = reales.filter(p => !cot.circuitos.some(c => c.id === p.circuito));
  if (sin.length) out.push({ nivel: 'error', texto: `${sin.length} punto(s) sin circuito (${sin.slice(0, 3).map(p => nombrePunto(p, cot.puntos)).join(', ')}${sin.length > 3 ? '…' : ''}).`, punto: sin[0].id });
  cot.circuitos.forEach(c => {
    const ps = puntosCircuito(cot, c.id), w = ps.reduce((s, p) => s + potencia(p), 0);
    if (!ps.length) return;
    if (c.uso === 'alumbrado' && (ps.length > 12 || w > 1500)) out.push({ nivel: w > 2000 ? 'error' : 'aviso', texto: `${c.nombre} (alumbrado) tiene ${ps.length} puntos y ${Math.round(w)} W: lo recomendable es hasta 12 puntos o 1500 W por circuito.` });
    if ((c.uso === 'tomas' || c.uso === 'cocina') && ps.length > (c.uso === 'cocina' ? 8 : 12)) out.push({ nivel: 'aviso', texto: `${c.nombre} tiene ${ps.length} tomacorrientes: divídelo en dos circuitos.` });
    const exclusivos = ps.filter(p => defPunto(p.tipo).exclusivo);
    if (exclusivos.length && ps.length > 1) out.push({ nivel: 'error', texto: `${exclusivos.map(p => nombrePunto(p, cot.puntos)).join(', ')} debe ir en un circuito exclusivo (${c.nombre} tiene ${ps.length} puntos).`, punto: exclusivos[0].id });
    if (!c.diferencial && ps.some(p => defPunto(p.tipo).diferencial)) out.push({ nivel: 'error', texto: `${c.nombre} alimenta tomacorrientes o equipos con agua y no tiene interruptor diferencial de 30 mA.` });
    if (!c.diferencial && ps.some(p => p.tipo === 'reflector')) out.push({ nivel: 'aviso', texto: `${c.nombre} tiene luces exteriores: conviene protegerlo con diferencial de 30 mA.` });
    if (c.uso !== 'debil') {
      const cap = BREAKER_MAX[c.seccion] || 0;
      if (cap < c.breaker) out.push({ nivel: 'error', texto: `${c.nombre}: el cable de ${c.seccion} mm² no soporta el interruptor de 2 × ${c.breaker} A (máx. ${cap} A). Sube la sección o baja el interruptor.` });
      const I = corriente(w) * (c.uso === 'fuerza' ? 1.25 : 1);
      if (I > c.breaker) out.push({ nivel: 'error', texto: `${c.nombre}: ${Math.round(w)} W piden ${I.toFixed(1)} A y el interruptor es de ${c.breaker} A.` });
      if ((c.uso === 'tomas' || c.uso === 'cocina' || c.uso === 'fuerza') && c.seccion < 4) out.push({ nivel: 'error', texto: `${c.nombre}: los tomacorrientes y salidas de fuerza llevan cable de 4 mm² como mínimo.` });
      if (c.uso === 'alumbrado' && c.seccion < 2.5) out.push({ nivel: 'error', texto: `${c.nombre}: el alumbrado lleva cable de 2.5 mm² como mínimo.` });
    }
  });
  // Puntos sin ruta al tablero.
  if (td.length && cot.rutas.length) {
    const sueltos: Punto[] = [];
    cot.circuitos.forEach(c => {
      const g = grafoCircuito(cot, c.id); const { padre } = recorrer(g);
      puntosCircuito(cot, c.id).concat(cot.puntos.filter(p => p.circuito === c.id && esInterruptor(p.tipo))).forEach(p => {
        if (!g.nudos.some((n, i) => padre[i] !== -2 && n.puntos.some(q => q.id === p.id))) sueltos.push(p);
      });
    });
    if (sueltos.length) out.push({ nivel: 'aviso', texto: `${sueltos.length} punto(s) sin tubería hasta el tablero: ${sueltos.slice(0, 3).map(p => nombrePunto(p, cot.puntos)).join(', ')}${sueltos.length > 3 ? '…' : ''}. Toca "Trazar automáticamente" o dibuja la tubería.`, punto: sueltos[0].id });
  } else if (td.length && !cot.rutas.length) out.push({ nivel: 'aviso', texto: 'Aún no hay tuberías: toca "Trazar automáticamente".' });
  if (td.length && cot.rutas.length && cot.puntos.some(p => p.tipo === 'pozo_tierra') && !cot.rutas.some(r => r.circuito === PT)) out.push({ nivel: 'error', texto: 'El pozo a tierra no está unido al tablero (falta la línea a tierra).' });
  // Tomacorrientes cerca de la ducha (de Gasfitería o duchas eléctricas).
  const ds = [...duchas, ...cot.puntos.filter(p => p.tipo === 'ducha_electrica')];
  reales.filter(p => defPunto(p.tipo).clase === 'toma').forEach(p => {
    if (ds.some(d => dist(d, p) < 0.6)) out.push({ nivel: 'error', texto: `${nombrePunto(p, cot.puntos)} está a menos de 0.60 m de la ducha: aléjalo (zona húmeda).`, punto: p.id });
  });
  cot.puntos.filter(p => esInterruptor(p.tipo) && !(p.controla || []).length).slice(0, 1).forEach(p => out.push({ nivel: 'aviso', texto: `${nombrePunto(p, cot.puntos)} no controla ninguna luz: elígelas en el panel del interruptor (o se enlaza solo al trazar).`, punto: p.id }));
  return out;
}

// ── Metrado y precios ───────────────────────────────────────────────────────
export type GrupoLinea = 'Conductores' | 'Tuberías y accesorios' | 'Cajas' | 'Dispositivos' | 'Tablero y protecciones' | 'Pozo a tierra' | 'Consumibles' | 'Luminarias' | 'Mano de obra';
export const GRUPOS_LINEA: GrupoLinea[] = ['Conductores', 'Tuberías y accesorios', 'Cajas', 'Dispositivos', 'Tablero y protecciones', 'Pozo a tierra', 'Consumibles', 'Luminarias', 'Mano de obra'];
export interface LineaEle { grupo: GrupoLinea; clave: string; nombre: string; nota: string; cant: number; unidad: string; precio: number; subtotal: number }
export interface Conteo {
  curvas: number; octogonales: number; rectangulares: number; cuadradas: number; paso: number; conectores: number; uniones: number;
  tubo: Record<string, number>; cable: Record<string, number>; coax: number; utp: number; tuboTotal: number; cableTotal: number;
}
export interface MetradoEle {
  lineas: LineaEle[]; materiales: number; luminarias: number; manoObra: number; directo: number;
  conteo: Conteo; info: Map<string, InfoRuta>; cuadro: Cuadro; puntos: { luz: number; toma: number; fuerza: number; debil: number }; dias: number;
}
const NOMBRE_COLOR: Record<ColorCable, string> = { rojo: 'rojo (fase)', negro: 'negro (fase / neutro)', verde: 'verde (tierra)', amarillo: 'amarillo (retorno)' };
export function metradoEle(cot: CotizacionEle): MetradoEle {
  const lineas: LineaEle[] = [];
  const add = (grupo: GrupoLinea, clave: string, nombre: string, nota: string, cant: number, unidad?: string) => {
    if (cant <= 0) return;
    const pr = precio(clave);
    lineas.push({ grupo, clave, nombre, nota, cant: Math.round(cant * 100) / 100, unidad: unidad || itemCatalogo(clave)?.unidad || 'unidad', precio: pr, subtotal: Math.round(pr * cant * 100) / 100 });
  };
  const cuadro = cuadroCargas(cot);
  const info = infoRutas(cot, cuadro.seccionAlim);
  const k = 1 + cot.merma / 100;
  // Conductores por sección y color.
  const cab = new Map<string, { sec: number; color: ColorCable; m: number }>();
  let coax = 0, utp = 0;
  info.forEach(i => { coax += i.coax; utp += i.utp; i.cables.forEach(c => { const key = `${c.sec}|${c.color}`; const g = cab.get(key); if (g) g.m += c.m; else cab.set(key, { ...c }); }); });
  // Retornos entre luces que controla un mismo interruptor (aprox.: en línea recta en L).
  cot.puntos.filter(p => esInterruptor(p.tipo) && (p.controla || []).length > 1).forEach(p => {
    const ls = (p.controla || []).map(id => cot.puntos.find(x => x.id === id)).filter((x): x is Punto => !!x);
    const c = cot.circuitos.find(x => x.id === p.circuito); if (!c) return;
    let m = 0; for (let i = 1; i < ls.length; i++) m += man(ls[0], ls[i]) + 2 * HOLGURA;
    const key = `${c.seccion}|amarillo`; const g = cab.get(key); if (g) g.m += m; else cab.set(key, { sec: c.seccion, color: 'amarillo', m });
  });
  const cableSec: Record<string, number> = {};
  [...cab.values()].sort((a, b) => a.sec - b.sec || ['rojo', 'negro', 'verde', 'amarillo'].indexOf(a.color) - ['rojo', 'negro', 'verde', 'amarillo'].indexOf(b.color)).forEach(c => {
    const m = Math.ceil(c.m * k);
    cableSec[c.sec] = (cableSec[c.sec] || 0) + m;
    // Rollos de 100 m; el saldo se compra por metro (o un rollo más si pasa de 60 m).
    let rollos = Math.floor(m / 100), resto = m - rollos * 100;
    if (resto >= 60) { rollos++; resto = 0; }
    const nombre = `Cable ${NOMBRE_CABLE[cot.cable]} ${c.sec} mm² ${NOMBRE_COLOR[c.color]}`;
    if (rollos) add('Conductores', claveCable(cot.cable, c.sec, true), nombre, `${m} m (con ${cot.merma}% de desperdicio)${resto ? ` = ${rollos} rollo${rollos > 1 ? 's' : ''} + ${resto} m` : ''}`, rollos, 'rollo');
    if (resto) add('Conductores', claveCable(cot.cable, c.sec, false), rollos ? `${nombre} – saldo por metro` : nombre, rollos ? 'lo que no completa un rollo' : `${f2(c.m)} m + ${cot.merma}% de desperdicio`, resto, 'm');
  });
  if (coax) add('Conductores', 'ele:coaxial', itemCatalogo('ele:coaxial')!.nombre, 'uno por cada salida de TV, desde el tablero', Math.ceil(coax * k));
  if (utp) add('Conductores', 'ele:utp', itemCatalogo('ele:utp')!.nombre, 'uno por cada salida de datos', Math.ceil(utp * k));
  const nTimbre = cot.puntos.filter(p => p.tipo === 'timbre').length;
  // Tuberías: barras de 3 m por diámetro, curvas, uniones y conectores.
  const tubo: Record<string, number> = {}, curvasD: Record<string, number> = {}, unionesD: Record<string, number> = {}, conectD: Record<string, number> = {};
  let paso = 0;
  info.forEach(i => {
    const L = i.len + i.vert;
    tubo[i.diam] = (tubo[i.diam] || 0) + L;
    curvasD[i.diam] = (curvasD[i.diam] || 0) + i.curvas;
    unionesD[i.diam] = (unionesD[i.diam] || 0) + Math.max(0, Math.ceil(L / LARGO_BARRA_ELE) - 1);
    conectD[i.diam] = (conectD[i.diam] || 0) + 2 + i.paso * 2;
    paso += i.paso;
  });
  // Cajas de paso en derivaciones que no caen en una caja de punto.
  [...cot.circuitos.map(c => c.id)].forEach(cid => {
    const g = grafoCircuito(cot, cid);
    g.nudos.forEach(n => { if (n.aristas.length >= 3 && !n.puntos.length) paso++; });
  });
  const diams = Object.keys(tubo).sort((a, b) => parseFloat(a) - parseFloat(b) || a.length - b.length);
  diams.forEach(d => {
    const L = tubo[d];
    add('Tuberías y accesorios', claveTuboEle(cot.tubo, d), itemCatalogo(claveTuboEle(cot.tubo, d))?.nombre || `Tubo ${NOMBRE_TUBO[cot.tubo]} Ø ${d}"`, `${f2(L)} m (planta + bajadas) +${cot.merma}% ÷ 3 m`, Math.ceil((L * k) / LARGO_BARRA_ELE - 1e-9), 'barra');
  });
  diams.forEach(d => add('Tuberías y accesorios', claveCurva(cot.tubo, d), itemCatalogo(claveCurva(cot.tubo, d))?.nombre || 'Curva', 'cambios de dirección y bajadas a las cajas', curvasD[d]));
  diams.forEach(d => add('Tuberías y accesorios', claveUnion(cot.tubo, d), itemCatalogo(claveUnion(cot.tubo, d))?.nombre || 'Unión', 'empalme entre barras', unionesD[d]));
  diams.forEach(d => add('Tuberías y accesorios', claveConector(d), itemCatalogo(claveConector(d))?.nombre || 'Conector', 'dos por tramo (entrada a cada caja)', conectD[d]));
  // Cajas.
  const cuenta = (pred: (t: TipoPunto) => boolean) => cot.puntos.filter(p => pred(p.tipo)).length;
  const oct = cuenta(t => defPunto(t).caja === 'octogonal'), rect = cuenta(t => defPunto(t).caja === 'rectangular'), cuad = cuenta(t => defPunto(t).caja === 'cuadrada');
  add('Cajas', 'ele:caja:octogonal', itemCatalogo('ele:caja:octogonal')!.nombre, 'una por luminaria de techo o pared', oct);
  add('Cajas', 'ele:caja:rectangular', itemCatalogo('ele:caja:rectangular')!.nombre, 'interruptores, tomacorrientes, TV y datos', rect);
  add('Cajas', 'ele:caja:cuadrada', itemCatalogo('ele:caja:cuadrada')!.nombre, 'salidas de fuerza', cuad);
  add('Cajas', 'ele:caja:paso', itemCatalogo('ele:caja:paso')!.nombre, 'derivaciones, cada 15 m o tras 2 curvas', paso);
  // Dispositivos.
  const tipos = [...new Set(cot.puntos.map(p => p.tipo))];
  tipos.forEach(t => { const d = defPunto(t); if (d.disp) add('Dispositivos', d.disp, itemCatalogo(d.disp)?.nombre || d.nombre, 'según el plano', cuenta(x => x === t)); });
  if (nTimbre) add('Conductores', 'ele:timbre_cable', itemCatalogo('ele:timbre_cable')!.nombre, 'pulsador → timbre', 6 * nTimbre);
  // Tablero y protecciones.
  const nTD = cuenta(t => t === 'tablero');
  if (nTD && cot.circuitos.length) {
    add('Tablero y protecciones', `ele:tablero:${cuadro.tablero}`, itemCatalogo(`ele:tablero:${cuadro.tablero}`)!.nombre, `${cuadro.polos} polos necesarios (con reserva)`, nTD);
    add('Tablero y protecciones', claveTM(Math.min(63, cuadro.ig)), itemCatalogo(claveTM(Math.min(63, cuadro.ig)))?.nombre || `Termomagnético 2 × ${cuadro.ig} A`, 'interruptor general', nTD);
    const tm = new Map<number, string[]>();
    cot.circuitos.filter(c => c.uso !== 'debil' && puntosCircuito(cot, c.id).length).forEach(c => tm.set(c.breaker, [...(tm.get(c.breaker) || []), c.nombre]));
    [...tm.entries()].sort((a, b) => a[0] - b[0]).forEach(([a, cs]) => add('Tablero y protecciones', claveTM(a), itemCatalogo(claveTM(a))?.nombre || `Termomagnético 2 × ${a} A`, cs.join(', '), cs.length));
    const ids = new Map<number, string[]>();
    cuadro.diferenciales.forEach(d => ids.set(d.amp, [...(ids.get(d.amp) || []), ...d.circ]));
    const nId = new Map<number, number>(); cuadro.diferenciales.forEach(d => nId.set(d.amp, (nId.get(d.amp) || 0) + 1));
    [...ids.entries()].sort((a, b) => a[0] - b[0]).forEach(([a, cs]) => add('Tablero y protecciones', claveID(a), itemCatalogo(claveID(a))!.nombre, `protege ${cs.join(', ')}`, nId.get(a) || 1));
    add('Tablero y protecciones', 'ele:barra_tierra', itemCatalogo('ele:barra_tierra')!.nombre, 'une las tierras de los circuitos', nTD);
  }
  add('Tablero y protecciones', 'ele:caja_medidor', itemCatalogo('ele:caja_medidor')!.nombre, 'el medidor lo instala la concesionaria', cuenta(t => t === 'medidor'));
  const nPozo = cuenta(t => t === 'pozo_tierra');
  if (nPozo) {
    add('Pozo a tierra', 'ele:pt:varilla', itemCatalogo('ele:pt:varilla')!.nombre, 'una por pozo', nPozo);
    add('Pozo a tierra', 'ele:pt:conector', itemCatalogo('ele:pt:conector')!.nombre, 'unión varilla – conductor', nPozo);
    add('Pozo a tierra', 'ele:pt:bentonita', itemCatalogo('ele:pt:bentonita')!.nombre, 'pozo de 1.0 × 1.0 × 2.8 m', 2 * nPozo);
    add('Pozo a tierra', 'ele:pt:cemento', itemCatalogo('ele:pt:cemento')!.nombre, 'mejora la resistencia (< 25 Ω)', nPozo);
    add('Pozo a tierra', 'ele:cable_desnudo:16', itemCatalogo('ele:cable_desnudo:16')!.nombre, 'dentro del pozo, hasta la caja', 3 * nPozo);
    add('Pozo a tierra', 'ele:pt:caja', itemCatalogo('ele:pt:caja')!.nombre, 'para medir y dar mantenimiento', nPozo);
  }
  // Consumibles.
  const tuboTotal = Object.values(tubo).reduce((s, v) => s + v, 0);
  const cajas = oct + rect + cuad + paso;
  if (cajas) add('Consumibles', 'ele:cinta', itemCatalogo('ele:cinta')!.nombre, `${cajas} cajas ÷ 8`, Math.ceil(cajas / 8));
  if (tuboTotal) add('Consumibles', 'ele:abrazadera', itemCatalogo('ele:abrazadera')!.nombre, 'tramos adosados (≈ 25 %), una cada 1.5 m', Math.ceil((tuboTotal * 0.25) / 1.5));
  if (tuboTotal) add('Consumibles', 'ele:guia', itemCatalogo('ele:guia')!.nombre, `${f2(tuboTotal)} m de tubo ÷ 100 m`, Math.max(1, Math.ceil(tuboTotal / 100)));
  // Luminarias (opcional).
  const nLum = cot.puntos.filter(p => defPunto(p.tipo).lum).length;
  if (cot.incluirLuminarias) tipos.forEach(t => { const d = defPunto(t); if (d.lum) add('Luminarias', d.lum, itemCatalogo(d.lum)?.nombre || d.nombre, 'según el plano', cuenta(x => x === t)); });
  const materiales = lineas.filter(l => l.grupo !== 'Luminarias').reduce((s, l) => s + l.subtotal, 0);
  const luminarias = lineas.filter(l => l.grupo === 'Luminarias').reduce((s, l) => s + l.subtotal, 0);
  // Mano de obra.
  const puntos = {
    luz: cot.puntos.filter(p => defPunto(p.tipo).mo === 'luz').length,
    toma: cot.puntos.filter(p => defPunto(p.tipo).mo === 'toma').length,
    fuerza: cot.puntos.filter(p => defPunto(p.tipo).mo === 'fuerza').length,
    debil: cot.puntos.filter(p => defPunto(p.tipo).mo === 'debil').length,
  };
  const largoAlim = [...info.values()].filter(i => i.circuito === ALIM).reduce((s, i) => s + i.len + i.vert, 0);
  const dias = Math.max(cot.puntos.length ? 1 : 0, Math.ceil((puntos.luz * 0.2 + puntos.toma * 0.18 + puntos.fuerza * 0.4 + puntos.debil * 0.12 + nTD * 1 + nPozo * 0.8 + tuboTotal / 120) * 2) / 2);
  const antes = lineas.length;
  if (cot.modoMO === 'jornal') {
    add('Mano de obra', claveJornal('Electricista'), 'Electricista', `${puntos.luz + puntos.toma + puntos.fuerza + puntos.debil} puntos, tablero y pozo`, dias, 'día');
    add('Mano de obra', claveJornal('Ayudante'), 'Ayudante', 'acompaña al electricista', dias, 'día');
  } else {
    add('Mano de obra', 'ele:mo:punto_luz', 'Punto de luz (con su interruptor)', 'luminarias, timbre y sensores', puntos.luz, 'punto');
    add('Mano de obra', 'ele:mo:punto_toma', 'Punto de tomacorriente', 'tomacorrientes con tierra', puntos.toma, 'punto');
    add('Mano de obra', 'ele:mo:salida_fuerza', 'Salida de fuerza (circuito exclusivo)', 'terma, cocina, ducha, aire…', puntos.fuerza, 'punto');
    add('Mano de obra', 'ele:mo:punto_debil', 'Punto de TV / datos', 'tubería y cableado', puntos.debil, 'punto');
    if (nTD && cot.circuitos.length) add('Mano de obra', 'ele:mo:tablero', 'Tablero de distribución armado e instalado', `${cot.circuitos.filter(c => c.uso !== 'debil').length} circuitos`, nTD, 'unidad');
    add('Mano de obra', 'ele:mo:alimentador', 'Alimentador medidor – tablero', `${f2(largoAlim)} m`, Math.ceil(largoAlim), 'm');
    add('Mano de obra', 'ele:mo:pozo', 'Pozo a tierra', 'excavación, relleno tratado y medición', nPozo, 'unidad');
  }
  if (cot.incluirLuminarias) add('Mano de obra', 'ele:mo:luminaria', 'Instalación de luminarias', 'colgado y conexionado', nLum, 'unidad');
  if (cot.pruebas && cot.puntos.length) add('Mano de obra', 'ele:mo:prueba', 'Pruebas de aislamiento y continuidad', 'con megóhmetro y telurómetro', 1, 'global');
  const manoObra = lineas.slice(antes).reduce((s, l) => s + l.subtotal, 0);
  const cableTotal = Object.values(cableSec).reduce((s, v) => s + v, 0);
  const conteo: Conteo = {
    curvas: Object.values(curvasD).reduce((s, v) => s + v, 0), octogonales: oct, rectangulares: rect, cuadradas: cuad, paso,
    conectores: Object.values(conectD).reduce((s, v) => s + v, 0), uniones: Object.values(unionesD).reduce((s, v) => s + v, 0),
    tubo, cable: cableSec, coax, utp, tuboTotal, cableTotal,
  };
  return { lineas, materiales, luminarias, manoObra, directo: materiales + luminarias + manoObra, conteo, info, cuadro, puntos, dias };
}
export const totalCon = (r: MetradoEle, cot: CotizacionEle) => r.directo * (1 + (cot.gg + cot.util) / 100);
export { nombreCircuito, USOS };
