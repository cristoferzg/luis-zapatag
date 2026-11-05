// =============================================================================
// Gasfitería: cálculo a partir de la geometría.
//   · grafoRed: une las tuberías de una red en nudos (vértices, uniones en T,
//     conexiones a los aparatos).
//   · empalmes: codos, tees / yees, reducciones, tapones, adaptadores, llaves, trampas…
//     salen solos de la forma de las tuberías (el usuario no los dibuja).
//   · avisos IS.010 (RNE): diámetros, pendientes, aparatos sin conectar…
//   · trazarAutomatico: tuberías en L desde el medidor / terma / caja de registro.
//   · metradoGas: materiales (barras, conexiones, consumibles), aparatos y mano de obra.
// =============================================================================
import { precio, claveJornal, itemCatalogo } from '../../lib/catalogoPrecios';
import { claveTubo, clavePieza, claveLlave, nombreTubo, nombrePieza, LARGO_BARRA, PiezaGas, SistemaTubo, MENOR } from '../../catalogo/gasfiteria';
import {
  Aparato, Tramo, Red, Pt, REDES, esAgua, defAparato, conexion, redesDe, nombreAparato, pendienteDefecto, pendienteMinima, pulg, uid, CotizacionGas,
} from './modeloGasfiteria';

const TOL = 0.03;
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const r3 = (n: number) => Math.round(n * 1000) / 1000;
export const largoTramo = (t: Tramo) => t.pts.slice(1).reduce((s, p, i) => s + dist(p, t.pts[i]), 0);
/** Proyección de p sobre el segmento ab: parámetro (0..1) y distancia. */
export function proyectar(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  const t = L2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
  const q = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, q, d: dist(p, q) };
}
const familia = (r: Red) => (r === 'ventilacion' ? 'desague' : r);

// ── Grafo de una red ─────────────────────────────────────────────────────────
export interface Nudo { id: number; x: number; y: number; aristas: number[]; aparatos: { ap: Aparato; red: Red }[] }
export interface Arista { id: number; a: number; b: number; tramo: Tramo; len: number }
export interface Grafo { nudos: Nudo[]; aristas: Arista[] }

export function grafoRed(tramos: Tramo[], aparatos: Aparato[], fam: 'fria' | 'caliente' | 'desague'): Grafo {
  const ts = tramos.filter(t => familia(t.red) === fam && t.pts.length >= 2);
  const nudos: Nudo[] = [];
  const nudo = (p: Pt) => {
    let n = nudos.find(k => Math.abs(k.x - p.x) < TOL && Math.abs(k.y - p.y) < TOL);
    if (!n) { n = { id: nudos.length, x: p.x, y: p.y, aristas: [], aparatos: [] }; nudos.push(n); }
    return n;
  };
  ts.forEach(t => t.pts.forEach(p => nudo(p)));
  // Conexiones a aparatos: cuentan como nudo aunque la tubería pase por encima.
  const redes: Red[] = fam === 'desague' ? ['desague'] : [fam];
  aparatos.forEach(ap => redesDe(ap.tipo).filter(r => redes.includes(r)).forEach(r => {
    const c = conexion(ap, r);
    let best: Nudo | null = null, bd = 0.09;
    nudos.forEach(n => { const d = dist(n, c); if (d < bd) { bd = d; best = n; } });
    if (best) (best as Nudo).aparatos.push({ ap, red: r });
  }));
  const aristas: Arista[] = [];
  ts.forEach(t => {
    for (let i = 0; i < t.pts.length - 1; i++) {
      const a = t.pts[i], b = t.pts[i + 1];
      if (dist(a, b) < 1e-6) continue;
      // Nudos que caen sobre este segmento (uniones en T de otras tuberías).
      const sobre = nudos.map(n => ({ n, pr: proyectar(n, a, b) })).filter(x => x.pr.d < TOL).sort((u, v) => u.pr.t - v.pr.t);
      for (let k = 0; k < sobre.length - 1; k++) {
        const n1 = sobre[k].n, n2 = sobre[k + 1].n;
        if (n1 === n2) continue;
        const e: Arista = { id: aristas.length, a: n1.id, b: n2.id, tramo: t, len: dist(n1, n2) };
        aristas.push(e); n1.aristas.push(e.id); n2.aristas.push(e.id);
      }
    }
  });
  return { nudos, aristas };
}
const otro = (e: Arista, n: number) => (e.a === n ? e.b : e.a);

// ── Empalmes ─────────────────────────────────────────────────────────────────
export type TipoEmpalme = PiezaGas | 'llave' | 'abasto' | 'sumidero' | 'registro' | 'sombrero';
export interface Empalme { tipo: TipoEmpalme; red: Red; diam: string; x: number; y: number; cant: number; nota: string; enAparato?: boolean }
export const NOMBRE_EMPALME: Record<TipoEmpalme, string> = {
  codo90: 'Codo 90°', codo45: 'Codo 45°', tee: 'Tee', yee: 'Yee', union: 'Unión universal', reduccion: 'Reducción', tapon: 'Tapón',
  adaptador: 'Adaptador', trampa: 'Trampa P', llave: 'Llave de paso', abasto: 'Abasto flexible', sumidero: 'Sumidero', registro: 'Registro roscado', sombrero: 'Sombrero',
};
const dmax = (ds: string[]) => ds.reduce((m, d) => (parseFloat(d) > parseFloat(m) ? d : m), ds[0]);
const red2 = (es: Arista[]) => (es.some(e => e.tramo.red === 'desague') ? 'desague' : es[0].tramo.red);

/** Empalmes que salen de la geometría (por red). */
export function empalmes(tramos: Tramo[], aparatos: Aparato[]): Empalme[] {
  const out: Empalme[] = [];
  const pon = (e: Omit<Empalme, 'cant'> & { cant?: number }) => out.push({ cant: 1, ...e });
  (['fria', 'caliente', 'desague'] as const).forEach(fam => {
    const g = grafoRed(tramos, aparatos, fam);
    g.nudos.forEach(n => {
      const es = n.aristas.map(i => g.aristas[i]);
      if (!es.length) return;
      const grado = es.length + (n.aparatos.length && es.length >= 2 ? 1 : 0);
      const ds = es.map(e => e.tramo.diam), D = dmax(ds), red = red2(es) as Red;
      if (n.aparatos.length && es.length === 1) return; // lo pone el aparato
      if (grado === 1) {
        if (es[0].tramo.red === 'ventilacion') {
          pon({ tipo: 'codo90', red: 'ventilacion', diam: D, x: n.x, y: n.y, nota: 'sube por el muro hasta el techo' });
          pon({ tipo: 'sombrero', red: 'ventilacion', diam: D, x: n.x, y: n.y, nota: 'remate de la ventilación' });
        } else pon({ tipo: 'tapon', red, diam: D, x: n.x, y: n.y, nota: 'extremo libre' });
        return;
      }
      if (grado === 2) {
        const [e1, e2] = es;
        const v1 = vec(n, g.nudos[otro(e1, n.id)]), v2 = vec(n, g.nudos[otro(e2, n.id)]);
        const ang = (Math.acos(Math.max(-1, Math.min(1, v1.x * v2.x + v1.y * v2.y))) * 180) / Math.PI; // 180 = recto
        const desvio = 180 - ang;
        if (e1.tramo.diam !== e2.tramo.diam) pon({ tipo: 'reduccion', red, diam: D, x: n.x, y: n.y, nota: `${pulg(D)} a ${pulg(ds.find(d => d !== D) || D)}` });
        if (desvio < 8) return;
        if (desvio <= 60) pon({ tipo: 'codo45', red, diam: D, x: n.x, y: n.y, nota: 'cambio de dirección' });
        else if (red === 'desague') pon({ tipo: 'codo45', red, diam: D, x: n.x, y: n.y, cant: 2, nota: 'giro con 2 codos de 45° (mejor flujo)' });
        else pon({ tipo: 'codo90', red, diam: D, x: n.x, y: n.y, nota: 'cambio de dirección' });
        return;
      }
      // 3 o más: tee (agua) o yee (desagüe); con ventilación, tee sanitaria.
      const conVent = es.some(e => e.tramo.red === 'ventilacion');
      const tipo: PiezaGas = esAgua(red) ? 'tee' : conVent ? 'tee' : 'yee';
      const veces = Math.max(1, grado - 2);
      pon({ tipo, red, diam: D, x: n.x, y: n.y, cant: veces, nota: grado > 3 ? 'cruce: se arma con dos piezas' : conVent ? 'tee sanitaria para la ventilación' : 'derivación' });
      const menores = ds.filter(d => d !== D);
      if (menores.length) pon({ tipo: 'reduccion', red, diam: D, x: n.x, y: n.y, cant: menores.length, nota: `${pulg(D)} a ${pulg(menores[0])}` });
    });
    // Aparatos conectados.
    const ponA = (e: Omit<Empalme, 'cant'> & { cant?: number }) => pon({ ...e, enAparato: true });
    g.nudos.forEach(n => n.aparatos.forEach(({ ap, red }) => {
      const d = defAparato(ap.tipo), es = n.aristas.map(i => g.aristas[i]);
      if (!es.length) return;
      const D = dmax(es.map(e => e.tramo.diam));
      const nom = nombreAparato(ap, aparatos);
      if (esAgua(red)) {
        if (d.fuente === 'fria') { // medidor o tanque: llave general
          ponA({ tipo: 'llave', red, diam: D, x: n.x, y: n.y, nota: `llave general (${nom})` });
          ponA({ tipo: 'union', red, diam: D, x: n.x, y: n.y, nota: nom });
          ponA({ tipo: 'adaptador', red, diam: D, x: n.x, y: n.y, cant: 2, nota: nom });
          return;
        }
        if (ap.tipo === 'terma') {
          if (red === 'fria') ponA({ tipo: 'llave', red, diam: D, x: n.x, y: n.y, nota: 'llave de la terma' });
          ponA({ tipo: 'union', red, diam: D, x: n.x, y: n.y, nota: `terma (${red === 'fria' ? 'entrada' : 'salida'})` });
          ponA({ tipo: 'adaptador', red, diam: D, x: n.x, y: n.y, nota: 'terma' });
          ponA({ tipo: 'abasto', red, diam: '1/2', x: n.x, y: n.y, nota: 'terma' });
          return;
        }
        ponA({ tipo: 'codo90', red, diam: D, x: n.x, y: n.y, nota: `subida a ${nom}` });
        ponA({ tipo: 'adaptador', red, diam: D, x: n.x, y: n.y, nota: nom });
        if (['inodoro', 'lavatorio', 'lavadero_cocina'].includes(ap.tipo)) ponA({ tipo: 'abasto', red, diam: '1/2', x: n.x, y: n.y, nota: nom });
      } else {
        if (d.trampa) ponA({ tipo: 'trampa', red: 'desague', diam: '2', x: n.x, y: n.y, nota: nom });
        if (ap.tipo === 'sumidero' || ap.tipo === 'ducha') ponA({ tipo: 'sumidero', red: 'desague', diam: '2', x: n.x, y: n.y, nota: nom });
        if (ap.tipo === 'inodoro') ponA({ tipo: 'codo90', red: 'desague', diam: D, x: n.x, y: n.y, nota: 'curva al inodoro' });
        if (d.muro && ap.tipo !== 'inodoro') ponA({ tipo: 'codo90', red: 'desague', diam: '2', x: n.x, y: n.y, nota: `bajada de ${nom}` });
        if (ap.tipo === 'registro') ponA({ tipo: 'registro', red: 'desague', diam: parseFloat(D) >= 4 ? '4' : '2', x: n.x, y: n.y, nota: nom });
      }
    }));
  });
  // Llaves de paso al inicio de un ramal.
  tramos.filter(t => t.llave && esAgua(t.red) && t.pts.length >= 2).forEach(t => {
    const a = t.pts[0], b = t.pts[1], L = dist(a, b) || 1, k = Math.min(0.25, L / 2) / L;
    const p = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    pon({ tipo: 'llave', red: t.red, diam: t.diam, x: p.x, y: p.y, nota: 'llave del ramal' });
    pon({ tipo: 'adaptador', red: t.red, diam: t.diam, x: p.x, y: p.y, cant: 2, nota: 'llave del ramal' });
  });
  return out;
}
function vec(a: Pt, b: Pt) { const L = dist(a, b) || 1; return { x: (b.x - a.x) / L, y: (b.y - a.y) / L }; }

// ── Recorrido desde la fuente (para avisos y el 3D) ─────────────────────────
/** Distancia (por la tubería) desde las raíces a cada nudo; Infinity si no llega. */
export function recorrer(g: Grafo, raices: number[]) {
  const d = g.nudos.map(() => Infinity), padre = g.nudos.map(() => -1), sinLlave = g.nudos.map(() => 0);
  const cola = [...raices]; raices.forEach(r => { d[r] = 0; });
  while (cola.length) {
    const n = cola.shift()!;
    g.nudos[n].aristas.forEach(i => {
      const e = g.aristas[i], m = otro(e, n);
      if (d[m] !== Infinity) return;
      d[m] = d[n] + e.len; padre[m] = i;
      const inicioConLlave = e.tramo.llave && dist(g.nudos[n], e.tramo.pts[0]) < TOL;
      sinLlave[m] = (inicioConLlave ? 0 : sinLlave[n]) + e.len;
      cola.push(m);
    });
  }
  return { d, padre, sinLlave };
}
export const raicesDe = (g: Grafo, fam: 'fria' | 'caliente' | 'desague') =>
  g.nudos.filter(n => n.aparatos.some(({ ap }) => fam === 'desague' ? defAparato(ap.tipo).colector : defAparato(ap.tipo).fuente === fam)).map(n => n.id);

// ── Avisos IS.010 ───────────────────────────────────────────────────────────
export interface Aviso { nivel: 'error' | 'aviso'; texto: string }
export function avisosGas(tramos: Tramo[], aparatos: Aparato[]): Aviso[] {
  const out: Aviso[] = [];
  const err = (texto: string) => out.push({ nivel: 'error', texto }), av = (texto: string) => out.push({ nivel: 'aviso', texto });
  if (!aparatos.length) return out;
  const nom = (a: Aparato) => nombreAparato(a, aparatos);
  const hay = (t: string) => aparatos.some(a => a.tipo === t);
  const pidenFria = aparatos.filter(a => defAparato(a.tipo).fria), pidenCal = aparatos.filter(a => defAparato(a.tipo).caliente);
  const pidenDes = aparatos.filter(a => defAparato(a.tipo).desague && a.tipo !== 'registro');
  if (pidenFria.length && !hay('medidor') && !hay('tanque')) err('Falta el medidor (o el tanque): el agua no tiene de dónde salir.');
  if (pidenCal.length && !hay('terma')) av('Hay aparatos con agua caliente pero falta la terma.');
  if (pidenDes.length && !hay('caja_registro')) err('Falta la caja de registro: el desagüe no tiene a dónde llegar.');

  (['fria', 'caliente', 'desague'] as const).forEach(fam => {
    const g = grafoRed(tramos, aparatos, fam);
    const rec = recorrer(g, raicesDe(g, fam));
    const lista = fam === 'fria' ? pidenFria : fam === 'caliente' ? pidenCal : pidenDes;
    const nombreRed = fam === 'fria' ? 'agua fría' : fam === 'caliente' ? 'agua caliente' : 'desagüe';
    const destino = fam === 'desague' ? 'la caja de registro' : fam === 'fria' ? 'el medidor' : 'la terma';
    lista.forEach(a => {
      const n = g.nudos.find(k => k.aparatos.some(x => x.ap === a && familia(x.red) === fam));
      if (!n) { err(`${nom(a)}: no tiene conexión de ${nombreRed}${fam !== 'desague' ? ` (${pulg(defAparato(a.tipo)[fam === 'fria' ? 'fria' : 'caliente'] || '1/2')})` : ` (${pulg(defAparato(a.tipo).desague || '2')})`}.`); return; }
      if (rec.d[n.id] === Infinity && raicesDe(g, fam).length) av(`${nom(a)}: su tubería de ${nombreRed} no llega hasta ${destino}.`);
      if (fam === 'fria' && rec.sinLlave[n.id] > 8 && rec.d[n.id] !== Infinity) av(`${nom(a)}: ramal de agua de ${rec.sinLlave[n.id].toFixed(1)} m sin llave de paso. Pon una llave al inicio del ramal.`);
    });
    if (fam === 'caliente' && hay('terma')) aparatos.filter(a => a.tipo === 'terma').forEach(a => {
      const sale = g.nudos.some(k => k.aparatos.some(x => x.ap === a) && k.aristas.length);
      if (!sale && pidenCal.length) err(`${nom(a)}: no tiene agua caliente conectada (salida ½" CPVC).`);
    });
    if (fam === 'fria') aparatos.filter(a => a.tipo === 'terma').forEach(a => {
      const n = g.nudos.find(k => k.aparatos.some(x => x.ap === a));
      if (!n || !n.aristas.length) err(`${nom(a)}: le falta la entrada de agua fría.`);
    });
    if (fam === 'desague') {
      // Inodoro: desagüe de 4" en todo su recorrido hasta la caja.
      aparatos.filter(a => a.tipo === 'inodoro').forEach(a => {
        const n = g.nudos.find(k => k.aparatos.some(x => x.ap === a)); if (!n) return;
        let k = n.id, chico = '', vueltas = 0;
        if (n.aristas.some(i => parseFloat(g.aristas[i].tramo.diam) < 4)) chico = g.aristas[n.aristas[0]].tramo.diam;
        while (rec.padre[k] >= 0 && vueltas++ < 500) { const e = g.aristas[rec.padre[k]]; if (parseFloat(e.tramo.diam) < 4 && e.tramo.red === 'desague') chico = e.tramo.diam; k = otro(e, k); }
        if (chico) err(`${nom(a)}: está conectado a un desagüe de ${pulg(chico)}; el inodoro necesita 4" hasta la caja de registro.`);
      });
      const libres = g.nudos.filter(n => n.aristas.length === 1 && !n.aparatos.length && g.aristas[n.aristas[0]].tramo.red === 'desague');
      if (libres.length) av(`Hay ${libres.length} desagüe${libres.length > 1 ? 's' : ''} que termina${libres.length > 1 ? 'n' : ''} suelto${libres.length > 1 ? 's' : ''} (lleva tapón): conéctalo a un aparato o a la red.`);
      if (hay('inodoro') && !tramos.some(t => t.red === 'ventilacion')) av('Falta la ventilación de 2" del desagüe (sube por el muro hasta el techo).');
    }
  });
  tramos.filter(t => t.red === 'desague').forEach(t => {
    const p = t.pendiente ?? 0, min = pendienteMinima(t.diam), L = largoTramo(t);
    if (L < 0.3) return;
    if (p <= 0) err(`Desagüe de ${pulg(t.diam)} (${L.toFixed(1)} m) sin pendiente: ponle al menos ${min} %.`);
    else if (p < min) av(`Desagüe de ${pulg(t.diam)} con pendiente de ${p} %: el mínimo es ${min} % (IS.010).`);
  });
  return out;
}

// ── Trazado automático ───────────────────────────────────────────────────────
interface Destino { p: Pt; peso: number; inodoro?: boolean; terma?: boolean; key: string }
interface Arbol { nodos: Pt[]; aristas: [number, number][]; raices: number[]; destinoNodo: Map<string, number> }

/** Árbol de tuberías en L: cada destino se une al punto más cercano de lo ya trazado. */
function arbolL(raices: Pt[], destinos: Destino[]): Arbol {
  const nodos: Pt[] = [], aristas: [number, number][] = [];
  const nodoEn = (p: Pt) => { const i = nodos.findIndex(n => dist(n, p) < 0.005); if (i >= 0) return i; nodos.push({ x: r3(p.x), y: r3(p.y) }); return nodos.length - 1; };
  const rs = raices.map(nodoEn);
  const destinoNodo = new Map<string, number>();
  const pend = [...destinos];
  const man = (a: Pt, b: Pt) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  while (pend.length) {
    let best = { i: 0, d: Infinity, p: nodos[rs[0]], arista: -1, nodo: rs[0] };
    pend.forEach((de, i) => {
      rs.forEach(r => { const d = man(nodos[r], de.p); if (d < best.d - 1e-6) best = { i, d, p: nodos[r], arista: -1, nodo: r }; });
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
      const A = nodos[a], B = nodos[b], horiz = Math.abs(A.y - B.y) < 1e-6;
      desde = nodoEn(best.p);
      if (desde !== a && desde !== b) { aristas.splice(best.arista, 1, [a, desde], [desde, b]); }
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

/** Convierte el árbol en tramos (polilíneas entre derivaciones) con su diámetro. */
function tramosDeArbol(ar: Arbol, destinos: Destino[], red: Red, diamDe: (peso: number, inodoro: boolean) => string, llaves: boolean): Tramo[] {
  const ady = ar.nodos.map(() => [] as number[]);
  ar.aristas.forEach(([a, b], i) => { ady[a].push(i); ady[b].push(i); });
  const pesoNodo = new Map<number, Destino>();
  destinos.forEach(d => { const n = ar.destinoNodo.get(d.key); if (n !== undefined) pesoNodo.set(n, d); });
  // Peso aguas abajo de cada arista (desde la raíz).
  const padreArista = ar.nodos.map(() => -1), orden: number[] = [], visto = ar.nodos.map(() => false);
  const cola = [...ar.raices]; ar.raices.forEach(r => { visto[r] = true; });
  while (cola.length) { const n = cola.shift()!; orden.push(n); ady[n].forEach(i => { const [a, b] = ar.aristas[i]; const m = a === n ? b : a; if (!visto[m]) { visto[m] = true; padreArista[m] = i; cola.push(m); } }); }
  const peso = ar.nodos.map((_, n) => pesoNodo.get(n)?.peso || 0), ino = ar.nodos.map((_, n) => !!pesoNodo.get(n)?.inodoro);
  const cuenta = ar.nodos.map((_, n) => (pesoNodo.has(n) ? 1 : 0)), terma = ar.nodos.map((_, n) => !!pesoNodo.get(n)?.terma);
  [...orden].reverse().forEach(n => { const i = padreArista[n]; if (i < 0) return; const [a, b] = ar.aristas[i]; const p = a === n ? b : a; peso[p] += peso[n]; ino[p] = ino[p] || ino[n]; cuenta[p] += cuenta[n]; });
  const hijoDe = (i: number) => { const [a, b] = ar.aristas[i]; return padreArista[a] === i ? a : b; };
  const diamArista = ar.aristas.map((_, i) => { const h = hijoDe(i); return diamDe(peso[h], ino[h]); });
  // Cadenas: se corta en raíces, destinos, derivaciones y cambios de diámetro.
  const corte = (n: number) => ar.raices.includes(n) || pesoNodo.has(n) || ady[n].length !== 2 || diamArista[ady[n][0]] !== diamArista[ady[n][1]];
  const usada = ar.aristas.map(() => false), out: Tramo[] = [];
  orden.forEach(n => {
    if (!corte(n)) return;
    ady[n].forEach(i0 => {
      if (usada[i0] || padreArista[n] === i0) return;
      const pts: Pt[] = [ar.nodos[n]]; let i = i0, cur = n;
      for (;;) {
        usada[i] = true; const [a, b] = ar.aristas[i]; cur = a === cur ? b : a; pts.push(ar.nodos[cur]);
        if (corte(cur)) break;
        const sig = ady[cur].find(k => !usada[k]); if (sig === undefined) break; i = sig;
      }
      // Quita vértices alineados.
      const lim = pts.filter((p, k) => k === 0 || k === pts.length - 1 || Math.abs((pts[k - 1].x - p.x) * (pts[k + 1].y - p.y) - (pts[k - 1].y - p.y) * (pts[k + 1].x - p.x)) > 1e-6);
      const h = hijoDe(i0), diam = diamArista[i0];
      const t: Tramo = { id: uid(), red, diam, pts: lim, auto: true };
      if (red === 'desague') t.pendiente = pendienteDefecto(diam);
      if (llaves && ady[n].length >= 3 && (cuenta[h] >= 2 || terma[h]) && !ar.raices.includes(n)) t.llave = true;
      out.push(t);
    });
  });
  return out;
}

/** Traza agua fría, agua caliente, desagüe y ventilación desde los aparatos puestos. */
export function trazarAutomatico(aparatos: Aparato[]): { tramos: Tramo[]; notas: string[] } {
  const notas: string[] = [];
  const out: Tramo[] = [];
  // Agua fría: desde el medidor (o el tanque).
  const fuenteF = aparatos.find(a => a.tipo === 'medidor') || aparatos.find(a => a.tipo === 'tanque');
  const consF = aparatos.filter(a => defAparato(a.tipo).fria);
  if (fuenteF && consF.length) {
    const des = consF.map(a => ({ p: conexion(a, 'fria'), peso: defAparato(a.tipo).ug, terma: a.tipo === 'terma', key: a.id }));
    out.push(...tramosDeArbol(arbolL([conexion(fuenteF, 'fria')], des), des, 'fria', p => (p <= 6 ? '1/2' : p <= 25 ? '3/4' : '1'), true));
  } else if (consF.length) notas.push('Pon el medidor (o un tanque) para trazar el agua fría.');
  // Agua caliente: desde la terma.
  const terma = aparatos.find(a => a.tipo === 'terma');
  const consC = aparatos.filter(a => defAparato(a.tipo).caliente);
  if (terma && consC.length) {
    const des = consC.map(a => ({ p: conexion(a, 'caliente'), peso: defAparato(a.tipo).ug, key: a.id }));
    out.push(...tramosDeArbol(arbolL([conexion(terma, 'caliente')], des), des, 'caliente', p => (p <= 6 ? '1/2' : '3/4'), false));
  } else if (consC.length) notas.push('Pon la terma para trazar el agua caliente.');
  // Desagüe: a la caja de registro más cercana (4" si recibe un inodoro).
  const cajas = aparatos.filter(a => a.tipo === 'caja_registro');
  const consD = aparatos.filter(a => defAparato(a.tipo).desague);
  if (cajas.length && consD.length) {
    const des = consD.map(a => ({ p: conexion(a, 'desague'), peso: defAparato(a.tipo).ud, inodoro: a.tipo === 'inodoro' || a.tipo === 'registro', key: a.id }));
    const ar = arbolL(cajas.map(c => conexion(c, 'desague')), des);
    const ds = tramosDeArbol(ar, des, 'desague', (p, ino) => (ino ? '4' : p <= 6 ? '2' : '3'), false);
    out.push(...ds);
    // Ventilación 2": sale del desagüe de cada inodoro y sube por el muro de atrás.
    aparatos.filter(a => a.tipo === 'inodoro').forEach(a => {
      const c = conexion(a, 'desague');
      const t = ds.find(x => dist(x.pts[x.pts.length - 1], c) < 0.01 || dist(x.pts[0], c) < 0.01);
      if (!t) return;
      const pts = dist(t.pts[0], c) < 0.01 ? t.pts : [...t.pts].reverse();
      const A = pts[0], B = pts[1], L = dist(A, B);
      if (L < 0.5) return;
      const k = 0.3 / L, P = { x: r3(A.x + (B.x - A.x) * k), y: r3(A.y + (B.y - A.y) * k) };
      const dir = { x: Math.round(Math.sin((a.rot * Math.PI) / 180) * 1000) / 1000, y: -Math.round(Math.cos((a.rot * Math.PI) / 180) * 1000) / 1000 };
      const Q = { x: r3(P.x + dir.x * 0.3), y: r3(P.y + dir.y * 0.3) };
      out.push({ id: uid(), red: 'ventilacion', diam: '2', pts: [P, Q], auto: true });
    });
  } else if (consD.length) notas.push('Pon la caja de registro para trazar el desagüe.');
  return { tramos: out, notas };
}

// ── Alturas para el 3D ───────────────────────────────────────────────────────
export const ALTURA_FRIA = 0.3, ALTURA_CALIENTE = 0.4;
/** Profundidad (m, negativa) de cada nudo del desagüe: baja con la pendiente hacia la caja. */
export function profundidades(g: Grafo, raices: number[]) {
  const sube = g.nudos.map(() => NaN);
  const cola = [...raices]; raices.forEach(r => { sube[r] = 0; });
  while (cola.length) {
    const n = cola.shift()!;
    g.nudos[n].aristas.forEach(i => { const e = g.aristas[i], m = otro(e, n); if (!isNaN(sube[m])) return;
      const p = e.tramo.red === 'ventilacion' ? 0 : (e.tramo.pendiente ?? pendienteDefecto(e.tramo.diam)) / 100;
      sube[m] = sube[n] + e.len * p; cola.push(m); });
  }
  const max = Math.max(0, ...sube.filter(v => !isNaN(v)));
  return sube.map(v => (isNaN(v) ? -0.25 : -0.15 - (max - v)));
}

// ── Metrado y precios ────────────────────────────────────────────────────────
export type GrupoLinea = 'Agua fría' | 'Agua caliente' | 'Desagüe' | 'Ventilación' | 'Consumibles' | 'Aparatos sanitarios' | 'Mano de obra';
export const GRUPOS_LINEA: GrupoLinea[] = ['Agua fría', 'Agua caliente', 'Desagüe', 'Ventilación', 'Consumibles', 'Aparatos sanitarios', 'Mano de obra'];
export interface LineaGas { grupo: GrupoLinea; clave: string; nombre: string; nota: string; cant: number; unidad: string; precio: number; subtotal: number }
export interface MetradoGas {
  lineas: LineaGas[]; materiales: number; aparatos: number; manoObra: number; directo: number;
  largo: Record<Red, number>; puntos: { fria: number; caliente: number; desague: number; ventilacion: number };
  empalmes: Empalme[]; nEmpalmes: number; dias: number;
}
const GRUPO_RED: Record<Red, GrupoLinea> = { fria: 'Agua fría', caliente: 'Agua caliente', desague: 'Desagüe', ventilacion: 'Ventilación' };
const EXTREMOS: Partial<Record<PiezaGas, number>> = { codo90: 2, codo45: 2, tee: 3, yee: 3, union: 2, reduccion: 2, tapon: 1, adaptador: 1, trampa: 2 };
// Pegamento: un frasco de 1/4 gal alcanza para ~250 uniones de ½"; los diámetros grandes gastan más.
const peso = (d: string) => ({ '2': 1.5, '3': 2, '4': 2.5 } as Record<string, number>)[d] || 1;
const f2 = (n: number) => n.toFixed(2);

export function metradoGas(cot: CotizacionGas): MetradoGas {
  const { tramos, aparatos } = cot;
  const lineas: LineaGas[] = [];
  const add = (grupo: GrupoLinea, clave: string, nombre: string, nota: string, cant: number, unidad?: string) => {
    if (cant <= 0) return;
    const pr = precio(clave);
    lineas.push({ grupo, clave, nombre, nota, cant, unidad: unidad || itemCatalogo(clave)?.unidad || 'unidad', precio: pr, subtotal: Math.round(pr * cant * 100) / 100 });
  };
  const emp = empalmes(tramos, aparatos);
  // Subidas y bajadas a los aparatos (no se ven en planta pero se compran).
  const vertical: Record<string, number> = {};
  const sumV = (red: Red, d: string, m: number) => { const k = `${red}|${d}`; vertical[k] = (vertical[k] || 0) + m; };
  (['fria', 'caliente', 'desague'] as const).forEach(fam => {
    const g = grafoRed(tramos, aparatos, fam);
    g.nudos.forEach(n => n.aparatos.forEach(({ ap }) => {
      const d = defAparato(ap.tipo), es = n.aristas.map(i => g.aristas[i]); if (!es.length) return;
      const D = dmax(es.map(e => e.tramo.diam));
      if (fam === 'desague') { if (!d.colector) sumV('desague', D, 0.3 + d.hDes); }
      else sumV(fam, D, Math.max(0.2, Math.abs(d.hAgua - (fam === 'fria' ? ALTURA_FRIA : ALTURA_CALIENTE)) + (d.fuente === 'fria' ? 0.3 : 0)));
    }));
  });
  emp.filter(e => e.tipo === 'sombrero').forEach(e => sumV('ventilacion', e.diam, 2.5 * e.cant));
  const largo: Record<Red, number> = { fria: 0, caliente: 0, desague: 0, ventilacion: 0 };
  // Tubos por red y diámetro (barras).
  (['fria', 'caliente', 'desague', 'ventilacion'] as Red[]).forEach(red => {
    const sis = REDES[red].sis;
    const ds = [...new Set([...tramos.filter(t => t.red === red).map(t => t.diam), ...Object.keys(vertical).filter(k => k.startsWith(red + '|')).map(k => k.split('|')[1])])]
      .sort((a, b) => parseFloat(a) - parseFloat(b));
    ds.forEach(d => {
      const h = tramos.filter(t => t.red === red && t.diam === d).reduce((s, t) => s + largoTramo(t), 0);
      const v = vertical[`${red}|${d}`] || 0, L = h + v;
      largo[red] += L;
      const barra = LARGO_BARRA[sis];
      const barras = Math.ceil((L * (1 + cot.merma / 100)) / barra - 1e-9);
      add(GRUPO_RED[red], claveTubo(sis, d), nombreTubo(sis, d), `${f2(h)} m en planta + ${f2(v)} m de subidas · +${cot.merma}% ÷ ${barra} m`, barras, 'barra');
    });
  });
  // Conexiones agrupadas.
  const grupos = new Map<string, { e: Empalme; cant: number }>();
  emp.forEach(e => {
    const sis: SistemaTubo = REDES[e.red].sis;
    const k = `${e.red}|${e.tipo}|${e.diam}|${sis}`;
    const g = grupos.get(k); if (g) g.cant += e.cant; else grupos.set(k, { e, cant: e.cant });
  });
  const orden: TipoEmpalme[] = ['codo90', 'codo45', 'tee', 'yee', 'reduccion', 'union', 'adaptador', 'tapon', 'llave', 'abasto', 'trampa', 'sumidero', 'registro', 'sombrero'];
  [...grupos.values()].sort((a, b) => orden.indexOf(a.e.tipo) - orden.indexOf(b.e.tipo) || parseFloat(a.e.diam) - parseFloat(b.e.diam)).forEach(({ e, cant }) => {
    const sis = REDES[e.red].sis, grupo = GRUPO_RED[e.red];
    const nota = NOTA_EMPALME[e.tipo] || 'según el plano';
    if (e.tipo === 'llave') add(grupo, claveLlave(e.diam), itemCatalogo(claveLlave(e.diam))?.nombre || `Llave de paso ${pulg(e.diam)}`, 'general, terma y ramales', cant);
    else if (e.tipo === 'abasto') add(grupo, 'gas:abasto', itemCatalogo('gas:abasto')!.nombre, 'inodoro, lavatorio, lavadero y terma', cant);
    else if (e.tipo === 'sumidero') add('Desagüe', 'gas:sumidero', itemCatalogo('gas:sumidero')!.nombre, 'sumideros y ducha', cant);
    else if (e.tipo === 'registro') add('Desagüe', `gas:registro:${e.diam}`, itemCatalogo(`gas:registro:${e.diam}`)?.nombre || 'Registro roscado', 'en el plano', cant);
    else if (e.tipo === 'sombrero') add('Ventilación', 'gas:sombrero', itemCatalogo('gas:sombrero')!.nombre, 'remate en el techo', cant);
    else {
      const d = e.tipo === 'reduccion' && !MENOR[e.diam] ? (REDES[e.red].diams.find(x => MENOR[x]) || e.diam) : e.diam;
      const clave = clavePieza(e.tipo as PiezaGas, sis, d);
      add(grupo, clave, itemCatalogo(clave)?.nombre || nombrePieza(e.tipo as PiezaGas, sis, d), nota, cant);
    }
  });
  const nAp = (t: string) => aparatos.filter(a => a.tipo === t).length;
  if (nAp('caja_registro')) add('Desagüe', 'gas:caja_registro', itemCatalogo('gas:caja_registro')!.nombre, 'en el plano', nAp('caja_registro'));
  if (nAp('medidor')) add('Agua fría', 'gas:caja_medidor', itemCatalogo('gas:caja_medidor')!.nombre, 'el medidor lo instala la empresa de agua', nAp('medidor'));
  // Consumibles.
  let jPvc = 0, jCpvc = 0, rosca = 0;
  emp.forEach(e => {
    const ext = EXTREMOS[e.tipo as PiezaGas] || 0, w = ext * e.cant * peso(e.diam);
    if (REDES[e.red].sis === 'cpvc') jCpvc += w; else jPvc += w;
    if (e.tipo === 'adaptador') rosca += e.cant; if (e.tipo === 'llave' || e.tipo === 'abasto') rosca += 2 * e.cant;
  });
  if (jPvc) add('Consumibles', 'gas:pegamento_pvc', itemCatalogo('gas:pegamento_pvc')!.nombre, `${Math.round(jPvc)} uniones equivalentes ÷ 250`, Math.ceil(jPvc / 250));
  if (jCpvc) add('Consumibles', 'gas:pegamento_cpvc', itemCatalogo('gas:pegamento_cpvc')!.nombre, `${Math.round(jCpvc)} uniones ÷ 250`, Math.ceil(jCpvc / 250));
  if (jPvc || jCpvc) add('Consumibles', 'gas:imprimante', itemCatalogo('gas:imprimante')!.nombre, '1 por cada 2 de pegamento', Math.max(1, Math.ceil((Math.ceil(jPvc / 250) + Math.ceil(jCpvc / 250)) / 2)));
  if (rosca) add('Consumibles', 'gas:teflon', itemCatalogo('gas:teflon')!.nombre, `${rosca} roscas ÷ 10`, Math.ceil(rosca / 10));
  const lAgua = largo.fria + largo.caliente, lDes = largo.desague + largo.ventilacion;
  if (lAgua) add('Consumibles', 'gas:abrazadera_agua', itemCatalogo('gas:abrazadera_agua')!.nombre, `${f2(lAgua)} m ÷ 1.5 m`, Math.ceil(lAgua / 1.5));
  if (lDes) add('Consumibles', 'gas:abrazadera_desague', itemCatalogo('gas:abrazadera_desague')!.nombre, `${f2(lDes)} m ÷ 1.5 m`, Math.ceil(lDes / 1.5));
  // Aparatos sanitarios (opcional).
  if (cot.incluirAparatos) {
    const tipos = [...new Set(aparatos.map(a => a.tipo))];
    tipos.forEach(t => { const d = defAparato(t); if (d.clave) add('Aparatos sanitarios', d.clave, itemCatalogo(d.clave)?.nombre || d.nombre, 'según el plano', nAp(t)); });
  }
  const materiales = lineas.filter(l => l.grupo !== 'Aparatos sanitarios').reduce((s, l) => s + l.subtotal, 0);
  const totalAparatos = lineas.filter(l => l.grupo === 'Aparatos sanitarios').reduce((s, l) => s + l.subtotal, 0);
  // Mano de obra: por punto (lo usual) o por jornal.
  const puntos = {
    fria: aparatos.filter(a => defAparato(a.tipo).fria).length,
    caliente: aparatos.filter(a => defAparato(a.tipo).caliente).length,
    desague: aparatos.filter(a => defAparato(a.tipo).desague && a.tipo !== 'registro').length,
    ventilacion: emp.filter(e => e.tipo === 'sombrero').reduce((s, e) => s + e.cant, 0),
  };
  const nInst = cot.instalarAparatos ? aparatos.filter(a => defAparato(a.tipo).sanitario).length : 0;
  const totPuntos = puntos.fria + puntos.caliente + puntos.desague + puntos.ventilacion;
  const dias = Math.max(totPuntos ? 1 : 0, Math.ceil((totPuntos * 0.4 + nInst * 0.3 + (largo.fria + largo.caliente + largo.desague) / 30) * 2) / 2);
  const antes = lineas.length;
  if (cot.modoMO === 'jornal') {
    add('Mano de obra', claveJornal('Gasfitero'), 'Gasfitero', `${totPuntos} puntos × 0.4 día + ${nInst} aparatos × 0.3 día`, dias, 'día');
    add('Mano de obra', claveJornal('Ayudante'), 'Ayudante', 'acompaña al gasfitero', dias, 'día');
  } else {
    add('Mano de obra', 'gas:mo:punto_agua', 'Punto de agua fría', 'uno por aparato con agua fría', puntos.fria, 'punto');
    add('Mano de obra', 'gas:mo:punto_caliente', 'Punto de agua caliente', 'uno por aparato con agua caliente', puntos.caliente, 'punto');
    add('Mano de obra', 'gas:mo:punto_desague', 'Punto de desagüe', 'aparatos y sumideros', puntos.desague, 'punto');
    add('Mano de obra', 'gas:mo:punto_ventilacion', 'Punto de ventilación', 'tubo de ventilación al techo', puntos.ventilacion, 'punto');
  }
  add('Mano de obra', 'gas:mo:aparato', 'Instalación de aparatos sanitarios', 'inodoro, lavatorio, ducha, terma…', nInst, 'unidad');
  if (cot.pruebaHidraulica && aparatos.length) add('Mano de obra', 'gas:mo:prueba', 'Prueba hidráulica y de desagüe', 'con bomba y a tubo lleno', 1, 'global');
  const manoObra = lineas.slice(antes).reduce((s, l) => s + l.subtotal, 0);
  const directo = materiales + totalAparatos + manoObra;
  return { lineas, materiales, aparatos: totalAparatos, manoObra, directo, largo, puntos, empalmes: emp, nEmpalmes: emp.filter(e => !['abasto', 'sumidero', 'registro', 'sombrero'].includes(e.tipo)).reduce((s, e) => s + e.cant, 0), dias };
}
const NOTA_EMPALME: Partial<Record<TipoEmpalme, string>> = {
  codo90: 'cambios de dirección y subidas', codo45: 'giros del desagüe', tee: 'derivaciones', yee: 'derivaciones del desagüe', reduccion: 'cambios de diámetro',
  union: 'medidor y terma (para desmontar)', adaptador: 'salidas roscadas', tapon: 'extremos libres', trampa: 'lavatorio, lavaderos, ducha, sumideros',
};
export const totalCon = (r: MetradoGas, cot: CotizacionGas) => r.directo * (1 + (cot.gg + cot.util) / 100);
