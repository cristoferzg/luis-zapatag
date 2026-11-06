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
export const largoTramo = (t: Tramo) => t.pts.slice(1).reduce((s, p, i) => { const L = dist(p, t.pts[i]); return s + (isFinite(L) ? L : 0); }, 0);
/** Proyección de p sobre el segmento ab: parámetro (0..1) y distancia. */
export function proyectar(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  const t = L2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
  const q = { x: a.x + dx * t, y: a.y + dy * t };
  return { t, q, d: dist(p, q) };
}
const familia = (r: Red) => (r === 'ventilacion' ? 'desague' : r);
/** Diámetro en pulgadas como número ('1/2' → 0.5, '3/4' → 0.75, '4' → 4). parseFloat('3/4') daría 3. */
export const pulgadas = (d: string) => {
  const s = String(d || '').trim(), m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  const n = parseFloat(s); return isFinite(n) ? n : 0;
};

// ── Diámetros según IS.010 (los usan el trazado automático y la revisión) ───
/** Agua: diámetro mínimo según las unidades de gasto (Hunter) que pasan por el tubo.
 *  ½" hasta 6 UG, ¾" hasta 25 UG, 1" en adelante (velocidades máx. IS.010: 1.90 / 2.20 / 2.48 m/s). */
export const diamAgua = (ug: number, red: 'fria' | 'caliente' = 'fria') => (ug <= 6 ? '1/2' : ug <= 25 || red === 'caliente' ? '3/4' : '1');
/** Desagüe: diámetro mínimo según las unidades de descarga (IS.010, Anexo 8) y si recibe un inodoro (4"). */
export const diamDesague = (ud: number, inodoro: boolean) => (inodoro || ud > 20 ? '4' : ud > 6 ? '3' : '2');
/** Distancia máxima (m, por la tubería) del sello de agua a la ventilación (IS.010, Anexo 9). */
export const distMaxVentilacion = (d: string) => (pulgadas(d) >= 4 ? 3 : pulgadas(d) >= 3 ? 1.8 : 1.5);
/** Diámetro con que se conecta el aparato a la red (su subida / bajada). */
export function diamConexion(ap: Aparato, red: Red): string | undefined {
  const d = defAparato(ap.tipo);
  if (red === 'fria') return d.fria;
  if (red === 'caliente') return d.caliente || (ap.tipo === 'terma' ? '1/2' : undefined);
  if (red === 'desague') return d.desague;
  return undefined;
}

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
  ts.forEach(t => t.pts.forEach(p => { if (isFinite(p.x) && isFinite(p.y)) nudo(p); }));
  // Conexiones a aparatos: cuentan como nudo aunque la tubería pase por encima.
  const redes: Red[] = fam === 'desague' ? ['desague'] : [fam];
  const conexiones: { ap: Aparato; red: Red; c: Pt }[] = [];
  aparatos.forEach(ap => redesDe(ap.tipo).filter(r => redes.includes(r)).forEach(r => conexiones.push({ ap, red: r, c: conexion(ap, r) })));
  // Tubería que pasa por encima de la conexión (sin vértice ahí): se crea el nudo.
  conexiones.forEach(({ c }) => {
    if (nudos.some(n => dist(n, c) < 0.09)) return;
    const pasa = ts.some(t => t.pts.slice(1).some((p, i) => proyectar(c, t.pts[i], p).d < TOL));
    if (pasa) nudo(c);
  });
  // Cada conexión se pega a su nudo más cercano (≤ 9 cm). Un nudo ya tomado por otro aparato más cercano
  // no se comparte (así un aparato suelto al lado de otro no aparece como conectado).
  const pares: { k: number; n: Nudo; d: number }[] = [];
  conexiones.forEach(({ c }, k) => nudos.forEach(n => { const d = dist(n, c); if (d < 0.09) pares.push({ k, n, d }); }));
  pares.sort((a, b) => a.d - b.d);
  const hecho = new Set<number>(), dueno = new Map<number, number>();
  pares.forEach(({ k, n, d }) => {
    if (hecho.has(k)) return;
    const prev = dueno.get(n.id);
    if (prev !== undefined && d > prev + 0.01) return;
    hecho.add(k); if (prev === undefined) dueno.set(n.id, d);
    n.aparatos.push({ ap: conexiones[k].ap, red: conexiones[k].red });
  });
  const aristas: Arista[] = [];
  ts.forEach(t => {
    for (let i = 0; i < t.pts.length - 1; i++) {
      const a = t.pts[i], b = t.pts[i + 1];
      if (!(dist(a, b) >= 1e-6)) continue; // también descarta puntos sin número (NaN)
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
const dmax = (ds: string[]) => ds.reduce((m, d) => (pulgadas(d) > pulgadas(m) ? d : m), ds[0]);
const red2 = (es: Arista[]) => (es.some(e => e.tramo.red === 'desague') ? 'desague' : es[0].tramo.red);
const ESCALA_AGUA = ['1/2', '3/4', '1'];

/** Empalmes que salen de la geometría (por red). */
export function empalmes(tramos: Tramo[], aparatos: Aparato[]): Empalme[] {
  const out: Empalme[] = [];
  const pon = (e: Omit<Empalme, 'cant'> & { cant?: number }) => out.push({ cant: 1, ...e });
  /** Reducción de D a d. En agua, de 1" a ½" van dos piezas (1" a ¾" y ¾" a ½"). */
  const reducir = (red: Red, D: string, d: string, x: number, y: number, extra: Partial<Empalme> = {}) => {
    if (pulgadas(d) >= pulgadas(D)) return;
    const i = ESCALA_AGUA.indexOf(D), j = ESCALA_AGUA.indexOf(d);
    if (esAgua(red) && i > 0 && j >= 0 && i - j > 1) {
      for (let k = i; k > j; k--) pon({ tipo: 'reduccion', red, diam: ESCALA_AGUA[k], x, y, nota: `${pulg(ESCALA_AGUA[k])} a ${pulg(ESCALA_AGUA[k - 1])}`, ...extra });
    } else pon({ tipo: 'reduccion', red, diam: D, x, y, nota: `${pulg(D)} a ${pulg(d)}`, ...extra });
  };
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
        if (e1.tramo.diam !== e2.tramo.diam) reducir(red, D, ds.find(d => d !== D) || D, n.x, n.y);
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
      // Salidas más chicas: las otras tuberías y la conexión del aparato que está en el nudo.
      const salidasAp = n.aparatos.filter(x => !defAparato(x.ap.tipo).fuente).map(x => diamConexion(x.ap, x.red)).filter((d): d is string => !!d);
      const menores = [...ds, ...salidasAp].filter(d => pulgadas(d) < pulgadas(D));
      menores.forEach(d => reducir(red, D, d, n.x, n.y));
    });
    // Aparatos conectados.
    const ponA = (e: Omit<Empalme, 'cant'> & { cant?: number }) => pon({ ...e, enAparato: true });
    g.nudos.forEach(n => n.aparatos.forEach(({ ap, red }) => {
      const d = defAparato(ap.tipo), es = n.aristas.map(i => g.aristas[i]);
      if (!es.length) return;
      const D = dmax(es.map(e => e.tramo.diam));
      const nom = nombreAparato(ap, aparatos);
      // La subida al aparato va en su diámetro de conexión; si llega un tubo más grueso y es el único, reducción.
      const dc = d.fuente ? D : (diamConexion(ap, red) || D);
      if (es.length === 1 && pulgadas(dc) < pulgadas(D)) reducir(red, D, dc, n.x, n.y, { enAparato: true, nota: `${pulg(D)} a ${pulg(dc)} (${nom})` });
      if (esAgua(red)) {
        if (d.fuente === 'fria') { // medidor o tanque: llave general
          ponA({ tipo: 'llave', red, diam: D, x: n.x, y: n.y, nota: `llave general (${nom})` });
          ponA({ tipo: 'union', red, diam: D, x: n.x, y: n.y, nota: nom });
          ponA({ tipo: 'adaptador', red, diam: D, x: n.x, y: n.y, cant: 2, nota: nom });
          return;
        }
        if (ap.tipo === 'terma') {
          if (red === 'fria') ponA({ tipo: 'llave', red, diam: dc, x: n.x, y: n.y, nota: 'llave de la terma' });
          ponA({ tipo: 'union', red, diam: dc, x: n.x, y: n.y, nota: `terma (${red === 'fria' ? 'entrada' : 'salida'})` });
          ponA({ tipo: 'adaptador', red, diam: dc, x: n.x, y: n.y, nota: 'terma' });
          ponA({ tipo: 'abasto', red, diam: '1/2', x: n.x, y: n.y, nota: 'terma' });
          return;
        }
        ponA({ tipo: 'codo90', red, diam: dc, x: n.x, y: n.y, nota: `subida a ${nom}` });
        ponA({ tipo: 'adaptador', red, diam: dc, x: n.x, y: n.y, nota: nom });
        if (['inodoro', 'lavatorio', 'lavadero_cocina'].includes(ap.tipo)) ponA({ tipo: 'abasto', red, diam: '1/2', x: n.x, y: n.y, nota: nom });
      } else {
        if (d.trampa) ponA({ tipo: 'trampa', red: 'desague', diam: '2', x: n.x, y: n.y, nota: nom });
        if (ap.tipo === 'sumidero' || ap.tipo === 'ducha') ponA({ tipo: 'sumidero', red: 'desague', diam: '2', x: n.x, y: n.y, nota: nom });
        if (ap.tipo === 'inodoro') ponA({ tipo: 'codo90', red: 'desague', diam: '4', x: n.x, y: n.y, nota: 'curva al inodoro' });
        if (d.muro && ap.tipo !== 'inodoro') ponA({ tipo: 'codo90', red: 'desague', diam: dc, x: n.x, y: n.y, nota: `bajada de ${nom}` });
        if (ap.tipo === 'registro') ponA({ tipo: 'registro', red: 'desague', diam: pulgadas(D) >= 4 ? '4' : '2', x: n.x, y: n.y, nota: nom });
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
/** Tema de cada aviso: agrupa los avisos en la "Verificación de la instalación". */
export type CatAviso = 'fuentes' | 'fria' | 'caliente' | 'desague' | 'pendiente' | 'diametro' | 'ventilacion' | 'llaves' | 'sueltas';
/** `ap` / `tramo`: el aparato o la tubería con el problema (para ubicarlo en el plano). */
export interface Aviso { nivel: 'error' | 'aviso'; texto: string; cat: CatAviso; ap?: string; tramo?: string }

/** Árbol de recorrido (Dijkstra) desde las raíces: distancia y arista padre de cada nudo. */
function arbolDesde(g: Grafo, raices: number[], filtro: (e: Arista) => boolean) {
  const d = g.nudos.map(() => Infinity), padre = g.nudos.map(() => -1), hecho = g.nudos.map(() => false);
  raices.forEach(r => { d[r] = 0; });
  for (;;) {
    let n = -1; d.forEach((v, i) => { if (!hecho[i] && v < Infinity && (n < 0 || v < d[n])) n = i; });
    if (n < 0) break;
    hecho[n] = true;
    g.nudos[n].aristas.forEach(i => { const e = g.aristas[i]; if (!filtro(e)) return; const m = otro(e, n); if (d[n] + e.len < d[m] - 1e-9) { d[m] = d[n] + e.len; padre[m] = i; } });
  }
  return { d, padre };
}
const sinVent = (e: Arista) => e.tramo.red !== 'ventilacion';

export function avisosGas(tramos: Tramo[], aparatos: Aparato[]): Aviso[] {
  const out: Aviso[] = [];
  type Foco = { ap?: string; tramo?: string };
  const err = (cat: CatAviso, texto: string, f: Foco = {}) => out.push({ nivel: 'error', texto, cat, ...f });
  const av = (cat: CatAviso, texto: string, f: Foco = {}) => out.push({ nivel: 'aviso', texto, cat, ...f });
  if (!aparatos.length) {
    if (tramos.length) av('sueltas', `Hay ${tramos.length} tubería${tramos.length > 1 ? 's' : ''} pero ningún aparato: pon los aparatos o quítalas.`, { tramo: tramos[0].id });
    return out;
  }
  const nom = (a: Aparato) => nombreAparato(a, aparatos);
  const hay = (t: string) => aparatos.some(a => a.tipo === t);
  const pidenFria = aparatos.filter(a => defAparato(a.tipo).fria), pidenCal = aparatos.filter(a => defAparato(a.tipo).caliente);
  const pidenDes = aparatos.filter(a => defAparato(a.tipo).desague && a.tipo !== 'registro');
  const nombreRedT = (r: Red) => REDES[r].nombre.toLowerCase();
  // Tuberías dañadas o con un diámetro que no corresponde a su red.
  const malas = new Set<string>();
  tramos.forEach(t => {
    const L = largoTramo(t);
    if (t.pts.length < 2 || t.pts.some(p => !isFinite(p.x) || !isFinite(p.y)) || L < 0.02) { malas.add(t.id); err('sueltas', `Tubería de ${nombreRedT(t.red)} sin largo (o dañada): quítala y dibújala de nuevo.`, { tramo: t.id }); return; }
    if (!REDES[t.red].diams.includes(t.diam)) err('diametro', `Tubería de ${nombreRedT(t.red)} con diámetro ${pulg(t.diam)}, que no corresponde a esa red (${REDES[t.red].diams.map(pulg).join(', ')}).`, { tramo: t.id });
  });
  const ok = tramos.filter(t => !malas.has(t.id));
  if (pidenFria.length && !hay('medidor') && !hay('tanque')) err('fuentes', 'Falta el medidor (o el tanque): el agua no tiene de dónde salir.');
  const hayCaliente = ok.some(t => t.red === 'caliente');
  const sinAguaCaliente = pidenCal.length > 0 && !hay('terma') && !hayCaliente;
  if (sinAguaCaliente) av('caliente', `No hay terma: ${pidenCal.length === 1 ? nom(pidenCal[0]) + ' queda' : `${pidenCal.length} aparatos (${pidenCal.map(nom).join(', ')}) quedan`} solo con agua fría. Si llevan agua caliente, pon la terma y vuelve a trazar.`, { ap: pidenCal[0].id });
  else if (pidenCal.length && !hay('terma')) err('caliente', 'Hay tuberías de agua caliente pero falta la terma: el agua caliente no tiene de dónde salir.');
  if (pidenDes.length && !hay('caja_registro')) err('fuentes', 'Falta la caja de registro: el desagüe no tiene a dónde llegar.');

  const ugTerma = new Map<string, number>();
  (['caliente', 'fria', 'desague'] as const).forEach(fam => {
    if (fam === 'caliente' && sinAguaCaliente) return;
    const g = grafoRed(ok, aparatos, fam);
    const raices = raicesDe(g, fam);
    const T = arbolDesde(g, raices, fam === 'desague' ? sinVent : () => true);
    const rec = recorrer(g, raices);
    const lista = fam === 'fria' ? pidenFria : fam === 'caliente' ? pidenCal : pidenDes;
    const nombreRed = fam === 'fria' ? 'agua fría' : fam === 'caliente' ? 'agua caliente' : 'desagüe';
    const destino = fam === 'desague' ? 'la caja de registro' : fam === 'fria' ? (hay('medidor') ? 'el medidor' : 'el tanque') : 'la terma';
    const nudoDe = (a: Aparato) => g.nudos.find(k => k.aparatos.some(x => x.ap === a && familia(x.red) === fam));
    // Conexión de cada aparato y que llegue a la fuente (o a la caja).
    lista.forEach(a => {
      const n = nudoDe(a);
      const dm = fam === 'desague' ? defAparato(a.tipo).desague || '2' : defAparato(a.tipo)[fam] || '1/2';
      if (!n || !n.aristas.length) { err(fam, `${nom(a)}: no tiene conexión de ${nombreRed} (${pulg(dm)}).`, { ap: a.id }); return; }
      if (T.d[n.id] === Infinity && raices.length) err(fam, `${nom(a)}: su tubería de ${nombreRed} no llega hasta ${destino}.`, { ap: a.id });
      if (fam === 'fria' && rec.sinLlave[n.id] > 8 && T.d[n.id] !== Infinity) av('llaves', `${nom(a)}: ramal de agua de ${rec.sinLlave[n.id].toFixed(1)} m sin llave de paso. Pon una llave al inicio del ramal.`, { ap: a.id });
    });
    if (fam === 'caliente') aparatos.filter(a => a.tipo === 'terma').forEach(a => {
      const n = g.nudos.find(k => k.aparatos.some(x => x.ap === a));
      if (!n || !n.aristas.length) {
        if (pidenCal.length && aparatos.filter(x => x.tipo === 'terma').length === 1) err('caliente', `${nom(a)}: no tiene agua caliente conectada (salida ½" CPVC).`, { ap: a.id });
        else if (pidenCal.length) av('caliente', `${nom(a)}: no da agua caliente a ningún aparato.`, { ap: a.id });
        return;
      }
      const d = distanciasDesde(g, [n.id]);
      ugTerma.set(a.id, g.nudos.reduce((s, k, i) => s + (d[i] < Infinity ? k.aparatos.filter(x => x.ap.tipo !== 'terma').reduce((u, x) => u + defAparato(x.ap.tipo).ug, 0) : 0), 0));
    });
    if (fam === 'fria') aparatos.filter(a => a.tipo === 'terma').forEach(a => {
      const n = nudoDe(a);
      if (!n || !n.aristas.length) err('fria', `${nom(a)}: le falta la entrada de agua fría.`, { ap: a.id });
    });
    // Diámetro de cada tubería según lo que lleva (UG en agua, UD e inodoros en el desagüe).
    const carga = g.aristas.map(() => 0), conInodoro = g.aristas.map(() => false);
    lista.forEach(a => {
      const n = nudoDe(a); if (!n || T.d[n.id] === Infinity) return;
      const w = fam === 'desague' ? defAparato(a.tipo).ud : a.tipo === 'terma' ? Math.max(defAparato(a.tipo).ug, ugTerma.get(a.id) || 0) : defAparato(a.tipo).ug;
      const ino = a.tipo === 'inodoro';
      let k = n.id, vueltas = 0;
      while (T.padre[k] >= 0 && vueltas++ < 5000) { const i = T.padre[k]; carga[i] += w; if (ino) conInodoro[i] = true; k = otro(g.aristas[i], k); }
    });
    const peor = new Map<string, { req: string; carga: number; ino: boolean }>();
    g.aristas.forEach((e, i) => {
      if (e.tramo.red === 'ventilacion' || !carga[i]) return;
      const req = fam === 'desague' ? diamDesague(carga[i], conInodoro[i]) : diamAgua(carga[i], fam);
      if (pulgadas(e.tramo.diam) >= pulgadas(req)) return;
      const p = peor.get(e.tramo.id);
      if (!p || pulgadas(req) > pulgadas(p.req) || carga[i] > p.carga) peor.set(e.tramo.id, { req: p && pulgadas(p.req) > pulgadas(req) ? p.req : req, carga: Math.max(carga[i], p?.carga || 0), ino: conInodoro[i] || !!p?.ino });
    });
    peor.forEach((p, id) => {
      const t = ok.find(x => x.id === id)!;
      if (fam === 'desague' && p.ino && pulgadas(t.diam) < 4) err('diametro', `Desagüe de ${pulg(t.diam)} que recibe un inodoro: necesita 4" hasta la caja de registro.`, { tramo: id });
      else err('diametro', `Tubería de ${nombreRed} de ${pulg(t.diam)} que lleva ${Math.round(p.carga * 10) / 10} ${fam === 'desague' ? 'UD' : 'UG'}: necesita ${pulg(p.req)} (IS.010).`, { tramo: id });
    });
    // Tuberías sueltas: no llegan a la fuente / caja.
    if (raices.length) {
      const fuera = new Set<string>(), dentro = new Set<string>();
      g.aristas.forEach(e => { if (e.tramo.red === 'ventilacion') return; (T.d[e.a] === Infinity && T.d[e.b] === Infinity ? fuera : dentro).add(e.tramo.id); });
      fuera.forEach(id => { if (dentro.has(id)) return; const t = ok.find(x => x.id === id)!; err('sueltas', `Tubería de ${nombreRedT(t.red)} de ${largoTramo(t).toFixed(2)} m suelta: no está unida a la red que llega a ${destino}.`, { tramo: id }); });
    }
    if (esAgua(fam)) {
      const libres = g.nudos.filter(n => n.aristas.length === 1 && !n.aparatos.length && T.d[n.id] !== Infinity);
      if (libres.length) av('sueltas', `Hay ${libres.length} tubería${libres.length > 1 ? 's' : ''} de ${nombreRed} que termina${libres.length > 1 ? 'n' : ''} sin aparato (lleva tapón).`, { tramo: g.aristas[libres[0].aristas[0]].tramo.id });
    }
    if (fam === 'desague') {
      const libres = g.nudos.filter(n => n.aristas.length === 1 && !n.aparatos.length && g.aristas[n.aristas[0]].tramo.red === 'desague');
      if (libres.length) av('sueltas', `Hay ${libres.length} desagüe${libres.length > 1 ? 's' : ''} que termina${libres.length > 1 ? 'n' : ''} suelto${libres.length > 1 ? 's' : ''} (lleva tapón): conéctalo a un aparato o a la red.`, { tramo: g.aristas[libres[0].aristas[0]].tramo.id });
      // Anillos: con un desagüe en anillo el agua no tiene un solo sentido ni una pendiente posible.
      const usadas = new Set(T.padre.filter(i => i >= 0));
      const anillo = g.aristas.find((e, i) => e.tramo.red === 'desague' && !usadas.has(i) && T.d[e.a] < Infinity && T.d[e.b] < Infinity);
      if (anillo) err('sueltas', 'El desagüe forma un anillo (dos caminos a la caja): quita una de las tuberías para que corra en un solo sentido.', { tramo: anillo.tramo.id });
      // Ventilación: unida al desagüe; inodoros (≤ 3 m) y demás trampas cerca de una (IS.010, Anexo 9).
      const conDes = g.nudos.filter(n => n.aristas.some(i => g.aristas[i].tramo.red === 'desague')).map(n => n.id);
      const alcanza = distanciasDesde(g, conDes);
      ok.filter(t => t.red === 'ventilacion').forEach(t => {
        const ids = g.aristas.filter(e => e.tramo === t);
        if (ids.length && ids.every(e => alcanza[e.a] === Infinity && alcanza[e.b] === Infinity)) err('ventilacion', `Ventilación de ${largoTramo(t).toFixed(2)} m suelta: debe salir de un desagüe.`, { tramo: t.id });
      });
      const dv = distanciasDesde(g, nudosVentilacion(g), soloDesague);
      aparatos.filter(a => defAparato(a.tipo).trampa && a.tipo !== 'sumidero' || a.tipo === 'inodoro').forEach(a => {
        const n = nudoDe(a); if (!n || !n.aristas.length) return;
        const max = distMaxVentilacion(defAparato(a.tipo).desague || '2');
        if (dv[n.id] <= max + 0.01) return;
        const txt = dv[n.id] === Infinity ? 'no tiene ventilación' : `su ventilación está a ${dv[n.id].toFixed(1)} m`;
        if (a.tipo === 'inodoro') err('ventilacion', `${nom(a)}: ${txt}; el inodoro necesita una ventilación de 2" a menos de ${max} m (IS.010).`, { ap: a.id });
        else av('ventilacion', `${nom(a)}: ${txt}; con trampa de ${pulg(defAparato(a.tipo).desague || '2')} debe quedar a menos de ${max} m (IS.010). Pon una ventilación cerca o vuelve a trazar.`, { ap: a.id });
      });
      // Caja de registro: profundidad y distancia máxima sin registro.
      if (raices.length) {
        const caida = g.nudos.map(() => 0);
        const orden = g.nudos.map((_, i) => i).filter(i => T.d[i] < Infinity).sort((a, b) => T.d[a] - T.d[b]);
        orden.forEach(i => { const pi = T.padre[i]; if (pi < 0) return; const e = g.aristas[pi]; caida[i] = caida[otro(e, i)] + e.len * Math.max(0, e.tramo.pendiente ?? pendienteDefecto(e.tramo.diam)) / 100; });
        const fondo = 0.15 + Math.max(0, ...orden.map(i => caida[i]));
        if (fondo > 0.6) av('desague', `El desagüe llega a la caja de registro a ${fondo.toFixed(2)} m de profundidad: con más de 0.60 m la caja debe ser de 18" × 24" o mayor (IS.010).`, { ap: aparatos.find(a => a.tipo === 'caja_registro')?.id });
        const regs = new Set(g.nudos.filter(n => n.aparatos.some(x => x.ap.tipo === 'registro')).map(n => n.id));
        const lejos = pidenDes.find(a => {
          const n = nudoDe(a); if (!n || T.d[n.id] === Infinity) return false;
          let k = n.id, tramo = 0, vueltas = 0;
          while (T.padre[k] >= 0 && vueltas++ < 5000) { const e = g.aristas[T.padre[k]]; tramo += e.len; k = otro(e, k); if (regs.has(k)) { if (tramo > 15) return true; tramo = 0; } }
          return tramo > 15;
        });
        if (lejos) av('desague', `${nom(lejos)}: su desagüe recorre más de 15 m sin registro ni caja. Pon un registro o una caja intermedia (IS.010).`, { ap: lejos.id });
      }
    }
  });
  ok.filter(t => t.red === 'desague').forEach(t => {
    const p = t.pendiente ?? 0, min = pendienteMinima(t.diam), L = largoTramo(t);
    if (L < 0.3) return;
    if (p <= 0) err('pendiente', `Desagüe de ${pulg(t.diam)} (${L.toFixed(1)} m) sin pendiente: ponle al menos ${min} %.`, { tramo: t.id });
    else if (p < min) err('pendiente', `Desagüe de ${pulg(t.diam)} con pendiente de ${p} %: el mínimo es ${min} % (IS.010).`, { tramo: t.id });
  });
  return out;
}

/** Desagües dibujados con su primer punto aguas arriba (la flecha del plano debe ir al revés). */
export function desaguesInvertidos(tramos: Tramo[], aparatos: Aparato[]): Set<string> {
  const g = grafoRed(tramos, aparatos, 'desague');
  const T = arbolDesde(g, raicesDe(g, 'desague'), sinVent);
  const nd = (p: Pt) => g.nudos.find(n => dist(n, p) < TOL);
  const out = new Set<string>();
  tramos.forEach(t => {
    if (t.red !== 'desague' || t.pts.length < 2) return;
    const a = nd(t.pts[0]), b = nd(t.pts[t.pts.length - 1]);
    if (a && b && T.d[a.id] < Infinity && T.d[b.id] < Infinity && T.d[a.id] > T.d[b.id] + 1e-6) out.add(t.id);
  });
  return out;
}

// ── Verificación de la instalación (lista de chequeo para el usuario) ───────
export interface Chequeo { cat: CatAviso; titulo: string; estado: 'ok' | 'error' | 'aviso' | 'na'; detalle: string; avisos: Aviso[] }
const TITULOS: Record<CatAviso, [string, string]> = {
  fuentes: ['Medidor y caja de registro', 'El agua tiene de dónde salir y el desagüe a dónde llegar.'],
  fria: ['Todos los aparatos tienen agua fría', 'Cada aparato está unido por tubería al medidor.'],
  caliente: ['El agua caliente sale de la terma', 'Cada aparato con agua caliente está unido a la terma.'],
  desague: ['Todos los desagües llegan a la caja de registro', 'Cada aparato y sumidero desagua hasta la caja.'],
  pendiente: ['Pendientes ≥ mínimo IS.010', '1 % en 4" y 1.5 % en 2" y 3", bajando hacia la caja.'],
  diametro: ['Diámetros según unidades de gasto', 'Agua según UG (Hunter) y desagüe según UD; 4" para inodoros.'],
  ventilacion: ['Ventilación en inodoros y trampas', 'Ventilación de 2" cerca de cada inodoro y trampa.'],
  llaves: ['Llaves de paso', 'Llave general y llaves en los ramales largos.'],
  sueltas: ['Sin tuberías sueltas', 'Toda tubería unida a la red, sin anillos en el desagüe.'],
};
export function verificarInstalacion(tramos: Tramo[], aparatos: Aparato[], avisos: Aviso[] = avisosGas(tramos, aparatos)): Chequeo[] {
  const pideCal = aparatos.some(a => defAparato(a.tipo).caliente), pideDes = aparatos.some(a => defAparato(a.tipo).desague);
  const pideFria = aparatos.some(a => defAparato(a.tipo).fria);
  const aplica: Record<CatAviso, boolean> = {
    fuentes: pideFria || pideDes, fria: pideFria, caliente: pideCal, desague: pideDes, pendiente: tramos.some(t => t.red === 'desague'),
    diametro: tramos.length > 0, ventilacion: aparatos.some(a => a.tipo === 'inodoro' || (defAparato(a.tipo).trampa && a.tipo !== 'sumidero')),
    llaves: pideFria, sueltas: tramos.length > 0,
  };
  return (['fuentes', 'fria', 'caliente', 'desague', 'pendiente', 'diametro', 'ventilacion', 'llaves', 'sueltas'] as CatAviso[]).map(cat => {
    const lista = avisos.filter(a => a.cat === cat);
    const estado: Chequeo['estado'] = lista.some(a => a.nivel === 'error') ? 'error' : lista.length ? 'aviso' : aplica[cat] ? 'ok' : 'na';
    return { cat, titulo: TITULOS[cat][0], estado, detalle: estado === 'na' ? 'No aplica en esta instalación.' : estado === 'ok' ? TITULOS[cat][1] : lista[0].texto, avisos: lista };
  });
}
/** true solo si todo lo que aplica está bien (sin errores ni observaciones). */
export const instalacionVerificada = (ch: Chequeo[]) => ch.some(c => c.estado === 'ok') && ch.every(c => c.estado === 'ok' || c.estado === 'na');

// ── Trazado automático ───────────────────────────────────────────────────────
interface Destino { p: Pt; peso: number; inodoro?: boolean; terma?: boolean; key: string }
interface Arbol { nodos: Pt[]; aristas: [number, number][]; raices: number[]; destinoNodo: Map<string, number> }

/** Árbol de tuberías en L: cada destino se une al punto de lo ya trazado que menos cuesta, sumando
 *  al tubo nuevo una parte del recorrido hasta la fuente (así un baño lejano no da la vuelta por toda
 *  la casa: va directo a la caja o al medidor si el camino por el árbol es mucho más largo). */
const PESO_RECORRIDO = 0.7;
function arbolL(raices: Pt[], destinos: Destino[]): Arbol {
  const nodos: Pt[] = [], aristas: [number, number][] = [], dr: number[] = []; // dr: recorrido desde la raíz (m)
  // A menos de 2 cm es el mismo punto (así no salen tubitos de milímetros).
  const nodoEn = (p: Pt, d = Infinity) => { const i = nodos.findIndex(n => dist(n, p) < 0.02); if (i >= 0) { dr[i] = Math.min(dr[i], d); return i; } nodos.push({ x: r3(p.x), y: r3(p.y) }); dr.push(d); return nodos.length - 1; };
  const rs = raices.map(p => nodoEn(p, 0));
  const destinoNodo = new Map<string, number>();
  const pend = [...destinos];
  const man = (a: Pt, b: Pt) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  while (pend.length) {
    let best = { i: 0, d: Infinity, p: nodos[rs[0]], arista: -1, nodo: rs[0] };
    pend.forEach((de, i) => {
      rs.forEach(r => { const d = man(nodos[r], de.p); if (d < best.d - 1e-6) best = { i, d, p: nodos[r], arista: -1, nodo: r }; });
      aristas.forEach(([a, b], k) => {
        const A = nodos[a], B = nodos[b];
        const pr = proyectar(de.p, A, B).q, q = { x: r3(pr.x), y: r3(pr.y) }; // punto del tubo más cercano (también si va inclinado)
        const d = man(q, de.p) + 0.0001 + PESO_RECORRIDO * (dr[a] + dist(A, q));
        if (d < best.d - 1e-6) best = { i, d, p: q, arista: k, nodo: -1 };
      });
    });
    const de = pend.splice(best.i, 1)[0];
    let desde: number, horizontalPrimero: boolean;
    if (best.arista >= 0) {
      const [a, b] = aristas[best.arista];
      const A = nodos[a], B = nodos[b], horiz = Math.abs(A.y - B.y) < 1e-6;
      desde = nodoEn(best.p, dr[a] + dist(A, best.p));
      if (desde !== a && desde !== b) { aristas.splice(best.arista, 1, [a, desde], [desde, b]); }
      horizontalPrimero = !horiz;
    } else { desde = best.nodo; horizontalPrimero = Math.abs(de.p.x - nodos[desde].x) >= Math.abs(de.p.y - nodos[desde].y); }
    const P = nodos[desde];
    const esq = horizontalPrimero ? { x: de.p.x, y: P.y } : { x: P.x, y: de.p.y };
    const fin = nodoEn(de.p, dr[desde] + man(P, de.p));
    if (fin === desde) { destinoNodo.set(de.key, fin); continue; }
    // Un desvío de pocos centímetros no se arma con dos codos (no caben): el tubo va recto, apenas inclinado.
    if (dist(esq, P) > 0.08 && dist(esq, de.p) > 0.08) { const k = nodoEn(esq, dr[desde] + dist(P, esq)); aristas.push([desde, k], [k, fin]); }
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

/** Distancia por la tubería (Dijkstra) desde varios nudos; solo por las aristas que pasan el filtro. */
export function distanciasDesde(g: Grafo, fuentes: number[], filtro: (e: Arista) => boolean = () => true): number[] {
  const d = g.nudos.map(() => Infinity), hecho = g.nudos.map(() => false);
  fuentes.forEach(f => { d[f] = 0; });
  for (;;) {
    let n = -1; d.forEach((v, i) => { if (!hecho[i] && v < Infinity && (n < 0 || v < d[n])) n = i; });
    if (n < 0) break;
    hecho[n] = true;
    g.nudos[n].aristas.forEach(i => { const e = g.aristas[i]; if (!filtro(e)) return; const m = otro(e, n); if (d[n] + e.len < d[m]) d[m] = d[n] + e.len; });
  }
  return d;
}
/** Nudos del desagüe donde entra una ventilación. */
const nudosVentilacion = (g: Grafo) => g.nudos.filter(n => n.aristas.some(i => g.aristas[i].tramo.red === 'ventilacion') && n.aristas.some(i => g.aristas[i].tramo.red === 'desague')).map(n => n.id);
const soloDesague = (e: Arista) => e.tramo.red === 'desague';

/** Traza agua fría, agua caliente, desagüe y ventilación desde los aparatos puestos. */
export function trazarAutomatico(aparatos: Aparato[]): { tramos: Tramo[]; notas: string[] } {
  const notas: string[] = [];
  const out: Tramo[] = [];
  // Agua caliente primero (así se sabe cuánta agua pide cada terma): desde las termas.
  const termas = aparatos.filter(a => a.tipo === 'terma');
  const consC = aparatos.filter(a => defAparato(a.tipo).caliente);
  const ugTerma = new Map<string, number>();
  if (termas.length && consC.length) {
    const des = consC.map(a => ({ p: conexion(a, 'caliente'), peso: defAparato(a.tipo).ug, key: a.id }));
    const cal = tramosDeArbol(arbolL(termas.map(t => conexion(t, 'caliente')), des), des, 'caliente', p => diamAgua(p, 'caliente'), false);
    out.push(...cal);
    // UG que sale de cada terma = la que entra por su agua fría.
    const g = grafoRed(cal, aparatos, 'caliente');
    termas.forEach(t => {
      const n = g.nudos.find(k => k.aparatos.some(x => x.ap === t)); if (!n) return;
      const d = distanciasDesde(g, [n.id]);
      const ug = g.nudos.reduce((s, k, i) => s + (d[i] < Infinity ? k.aparatos.filter(x => x.ap.tipo !== 'terma').reduce((u, x) => u + defAparato(x.ap.tipo).ug, 0) : 0), 0);
      ugTerma.set(t.id, ug);
    });
  } else if (consC.length) notas.push('Pon la terma para trazar el agua caliente.');
  // Agua fría: desde el medidor; si también hay tanque, el medidor llena el tanque y el tanque reparte.
  const medidor = aparatos.find(a => a.tipo === 'medidor'), tanque = aparatos.find(a => a.tipo === 'tanque');
  const fuenteF = tanque || medidor;
  const consF = aparatos.filter(a => defAparato(a.tipo).fria);
  if (fuenteF && consF.length) {
    const des = consF.map(a => ({ p: conexion(a, 'fria'), peso: a.tipo === 'terma' ? Math.max(defAparato(a.tipo).ug, ugTerma.get(a.id) || 0) : defAparato(a.tipo).ug, terma: a.tipo === 'terma', key: a.id }));
    const fr = tramosDeArbol(arbolL([conexion(fuenteF, 'fria')], des), des, 'fria', p => diamAgua(p, 'fria'), true);
    // Ningún aparato a más de 8 m de una llave: se pone la llave del ramal (o del sector) más arriba que lo cubra.
    const probados = new Set<number>();
    for (let vuelta = 0; vuelta < 40; vuelta++) {
      const g = grafoRed(fr, aparatos, 'fria'), rec = recorrer(g, raicesDe(g, 'fria'));
      const n = g.nudos.filter(k => !probados.has(k.id) && k.aparatos.some(x => !defAparato(x.ap.tipo).fuente) && rec.d[k.id] < Infinity && rec.sinLlave[k.id] > 8)
        .sort((a, b) => rec.sinLlave[b.id] - rec.sinLlave[a.id])[0];
      if (!n) break;
      probados.add(n.id);
      let k = n.id, acum = 0, elegido: Tramo | null = null, vueltas = 0;
      while (rec.padre[k] >= 0 && vueltas++ < 5000) {
        const e = g.aristas[rec.padre[k]], m = otro(e, k);
        acum += e.len; if (acum > 7.7) break;
        if (dist(g.nudos[m], e.tramo.pts[0]) < TOL && !e.tramo.llave && !raicesDe(g, 'fria').includes(m)) elegido = e.tramo;
        k = m;
      }
      if (elegido) elegido.llave = true;
    }
    out.push(...fr);
    if (medidor && tanque) {
      const total = des.reduce((s, d) => s + d.peso, 0);
      const ll = [{ p: conexion(tanque, 'fria'), peso: total, key: tanque.id }];
      out.push(...tramosDeArbol(arbolL([conexion(medidor, 'fria')], ll), ll, 'fria', p => diamAgua(p, 'fria'), false));
    }
  } else if (consF.length) notas.push('Pon el medidor (o un tanque) para trazar el agua fría.');
  // Desagüe: a la caja de registro más cercana (4" si recibe un inodoro).
  const cajas = aparatos.filter(a => a.tipo === 'caja_registro');
  const consD = aparatos.filter(a => defAparato(a.tipo).desague);
  if (cajas.length && consD.length) {
    const des = consD.map(a => ({ p: conexion(a, 'desague'), peso: defAparato(a.tipo).ud, inodoro: a.tipo === 'inodoro' || a.tipo === 'registro', key: a.id }));
    const ar = arbolL(cajas.map(c => conexion(c, 'desague')), des);
    const ds = tramosDeArbol(ar, des, 'desague', (p, ino) => diamDesague(p, ino), false);
    out.push(...ds);
    // Ventilación 2": sale del desagüe del aparato (a 30 cm o menos) y sube por el muro de atrás hasta el techo.
    const vents: Tramo[] = [];
    const libre = (q: Pt) => ![...ds, ...vents].some(t => t.pts.slice(1).some((p, i) => proyectar(q, t.pts[i], p).d < TOL * 2));
    const ventilar = (a: Aparato) => {
      const c = conexion(a, 'desague');
      // El tramo que llega desde la caja (termina en el aparato); si no, cualquiera que lo toque.
      const t = ds.find(x => dist(x.pts[x.pts.length - 1], c) < 0.01) || ds.find(x => dist(x.pts[0], c) < 0.01);
      if (!t) return false;
      const pts = dist(t.pts[0], c) < 0.01 ? t.pts : [...t.pts].reverse();
      const A = pts[0], B = pts[1], L = dist(A, B);
      if (!(L > 0)) return false;
      const k = L < 0.1 ? 1 : Math.min(0.3, L / 2) / L;
      const P = { x: r3(A.x + (B.x - A.x) * k), y: r3(A.y + (B.y - A.y) * k) };
      const dir = { x: Math.round(Math.sin((a.rot * Math.PI) / 180) * 1000) / 1000, y: -Math.round(Math.cos((a.rot * Math.PI) / 180) * 1000) / 1000 };
      // Hasta el muro de atrás del aparato (su espalda) y un poco más: ahí sube la ventilación.
      const da = defAparato(a.tipo), espalda = { x: a.x + dir.x * da.d / 2, y: a.y + dir.y * da.d / 2 };
      const s0 = Math.max(0.15, (espalda.x - P.x) * dir.x + (espalda.y - P.y) * dir.y + 0.08);
      // Si el desagüe sale por detrás (va en la misma dirección que la espalda), la ventilación sale de costado.
      const u = { x: (B.x - A.x) / L, y: (B.y - A.y) / L }, paralelo = Math.abs(u.x * dir.x + u.y * dir.y) > 0.7;
      const dirs = paralelo ? [{ x: -u.y, y: u.x }, { x: u.y, y: -u.x }] : [dir];
      for (const v of dirs) for (const s of paralelo ? [0.15, 0.25, 0.4] : [s0, s0 + 0.1, Math.max(0.12, s0 - 0.1), s0 + 0.25]) {
        const Q = { x: r3(P.x + v.x * s), y: r3(P.y + v.y * s) };
        if (!libre(Q)) continue;
        vents.push({ id: uid(), red: 'ventilacion', diam: '2', pts: [P, Q], auto: true });
        return true;
      }
      return false;
    };
    aparatos.filter(a => a.tipo === 'inodoro').forEach(ventilar);
    // Demás trampas (lavatorio, ducha, lavaderos…): ventilación si el sello queda lejos de una (IS.010, Anexo 9).
    const conTrampa = aparatos.filter(a => defAparato(a.tipo).trampa && a.tipo !== 'sumidero');
    const intentadas = new Set<string>();
    for (let vuelta = 0; vuelta < conTrampa.length; vuelta++) {
      const g = grafoRed([...ds, ...vents], aparatos, 'desague');
      const dv = distanciasDesde(g, nudosVentilacion(g), soloDesague);
      let peor: Aparato | null = null, exceso = 0;
      conTrampa.forEach(a => {
        if (intentadas.has(a.id)) return;
        const n = g.nudos.find(k => k.aparatos.some(x => x.ap === a)); if (!n) return;
        const e = dv[n.id] - distMaxVentilacion(diamConexion(a, 'desague') || '2');
        if (e > exceso) { exceso = e; peor = a; }
      });
      if (!peor) break;
      intentadas.add((peor as Aparato).id);
      ventilar(peor);
    }
    out.push(...vents);
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
    if (!(cant > 0) || !isFinite(cant)) return;
    const pr = precio(clave);
    lineas.push({ grupo, clave, nombre, nota, cant, unidad: unidad || itemCatalogo(clave)?.unidad || 'unidad', precio: pr, subtotal: Math.round(pr * cant * 100) / 100 });
  };
  const emp = empalmes(tramos, aparatos);
  // Subidas y bajadas a los aparatos (no se ven en planta pero se compran).
  const vertical: Record<string, number> = {};
  const sumV = (red: Red, d: string, m: number) => { const k = `${red}|${d}`; vertical[k] = (vertical[k] || 0) + m; };
  (['fria', 'caliente', 'desague'] as const).forEach(fam => {
    const g = grafoRed(tramos, aparatos, fam);
    g.nudos.forEach(n => n.aparatos.forEach(({ ap, red: rr }) => {
      const d = defAparato(ap.tipo), es = n.aristas.map(i => g.aristas[i]); if (!es.length) return;
      // La subida / bajada va en el diámetro de conexión del aparato (½" a cada aparato, 2" o 4" al desagüe).
      const D = d.fuente || d.colector ? dmax(es.map(e => e.tramo.diam)) : (diamConexion(ap, rr) || dmax(es.map(e => e.tramo.diam)));
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
      .sort((a, b) => pulgadas(a) - pulgadas(b));
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
  [...grupos.values()].sort((a, b) => orden.indexOf(a.e.tipo) - orden.indexOf(b.e.tipo) || pulgadas(a.e.diam) - pulgadas(b.e.diam)).forEach(({ e, cant }) => {
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
