// =============================================================================
// Melamina: muebles (closets, cocinas, reposteros, escritorios…), despiece de
// cortes, herrajes y metrado con el número de tableros del optimizador.
//
// Unidades: el mueble en METROS (lo que escribe el usuario); las piezas de corte
// en MILÍMETROS (lo que se lleva al local de corte). Funciones puras.
//
// Armado de referencia (tablero 18 mm, fondo HDF 3 mm clavado atrás):
//   · laterales a todo lo alto; techo y piso entre laterales; piso sobre el zócalo;
//   · divisiones verticales entre piso y techo; repisas 2 cm más cortas de fondo;
//   · puertas batientes "a sobreponer" (cubren el canto) con 3 mm de luz;
//   · corredizas: hojas que se traslapan 3 cm en un riel;
//   · cajones de 18 cm de frente: 2 costados, trasera y contrafrente, fondo HDF,
//     corredera telescópica (12.5 mm por lado) del largo que entre en el fondo.
// Tapacanto: grueso 2 mm en cantos de frente, puertas y frentes de cajón (4 lados);
// delgado 0.45 mm en los demás cantos que se ven. +10 % de desperdicio.
// Mano de obra: días = m² de melamina / 6 + 0.5 por mueble (instalación), redondeado
// hacia arriba a medio día.
// =============================================================================
import { precio, claveJornal, itemCatalogo } from '../../lib/catalogoPrecios';
import { claveTablero, colorMelamina } from '../../catalogo/melamina';
import { optimizar, PiezaCorte, ResultadoOptimizador } from './optimizador';

export const TABLERO_L = 2440, TABLERO_A = 2150, ESP = 18, SIERRA = 4, REFILE = 10;
export const UTIL_L = TABLERO_L - 2 * REFILE, UTIL_A = TABLERO_A - 2 * REFILE; // 2420 × 2130
export const ALTO_CAJON = 180;   // mm de frente por cajón
const LUZ = 3;                   // separación entre puertas y frentes (mm)
const TRASLAPE = 30;             // traslape de hojas corredizas (mm)
const HUELGO_CORREDERA = 13;     // por lado (corredera telescópica 12.5 mm)
const ALTO_CAJA = 120;           // alto de los costados del cajón (mm)
export const ALTO_MUEBLE_ALTO = 1.45; // altura desde el piso de un repostero

const mm = (m: number) => Math.round((m || 0) * 1000);
const entero = (n: number, a: number, b: number) => Math.max(a, Math.min(b, Math.round(n || 0)));
export const uid = () => Math.random().toString(36).slice(2, 9);

// ── Tipos de mueble ─────────────────────────────────────────────────────────
export type TipoMueble = 'closet' | 'closet_corredizo' | 'vestidor' | 'cocina_baja' | 'cocina_alta' | 'alacena' | 'isla' | 'escritorio' | 'archivador' | 'estante' | 'zapatera' | 'rack_tv' | 'velador' | 'comoda' | 'bano' | 'botiquin' | 'libre';
/** Estilo del frente: lisa, con vidrio (marco de aluminio) o ranurada (líneas decorativas). */
export type EstiloPuerta = 'lisa' | 'vidrio' | 'ranurada';
/** Tirador: barra, perilla, perfil de aluminio (gola/uñero) o push (abre al presionar). */
export type Tirador = 'barra' | 'boton' | 'gola' | 'push';
export type PuertaTipo = 'batiente' | 'corrediza' | 'ninguna';
export interface PosMueble { pared: number; x: number; y: number }
export interface Mueble {
  id: string; tipo: TipoMueble; nombre: string;
  ancho: number; alto: number; prof: number; // m
  cantidad: number; puertas: number; puertaTipo: PuertaTipo;
  cajones: number; repisas: number; divisiones: number;
  colgador: boolean; zocalo: number; // m (0 = sin zócalo)
  color: string; fondoHdf: boolean;
  pos?: PosMueble;
  estiloPuerta?: EstiloPuerta;   // por defecto 'lisa'
  tirador?: Tirador;             // por defecto 'barra'
  colorFrente?: string;          // puertas y frentes en otro color ('' = el mismo)
}
type Medidas = Omit<Mueble, 'id' | 'tipo' | 'nombre' | 'cantidad' | 'color' | 'pos' | 'estiloPuerta' | 'tirador' | 'colorFrente'>;
export interface TipoInfo { id: TipoMueble; nombre: string; corto: string; emoji: string; descripcion: string; base: Medidas; nota?: string }

export const TIPOS: TipoInfo[] = [
  { id: 'closet', nombre: 'Closet con puertas', corto: 'Closet', emoji: '🚪', descripcion: 'Puertas batientes, cajones, repisas y colgador.',
    base: { ancho: 1.8, alto: 2.4, prof: 0.6, puertas: 3, puertaTipo: 'batiente', cajones: 2, repisas: 3, divisiones: 1, colgador: true, zocalo: 0, fondoHdf: true } },
  { id: 'closet_corredizo', nombre: 'Closet corredizo', corto: 'Closet corredizo', emoji: '↔️', descripcion: 'Dos hojas corredizas en riel: ahorra espacio.',
    base: { ancho: 1.8, alto: 2.4, prof: 0.6, puertas: 2, puertaTipo: 'corrediza', cajones: 2, repisas: 3, divisiones: 1, colgador: true, zocalo: 0, fondoHdf: true } },
  { id: 'vestidor', nombre: 'Vestidor abierto', corto: 'Vestidor', emoji: '👔', descripcion: 'Sin puertas: colgador, repisas y cajones a la vista.',
    base: { ancho: 2.0, alto: 2.4, prof: 0.5, puertas: 0, puertaTipo: 'ninguna', cajones: 3, repisas: 6, divisiones: 2, colgador: true, zocalo: 0.05, fondoHdf: true } },
  { id: 'cocina_baja', nombre: 'Mueble bajo de cocina', corto: 'Cocina baja', emoji: '🍳', descripcion: 'Bajo tablero, con zócalo, puertas y cajón.',
    base: { ancho: 1.2, alto: 0.9, prof: 0.55, puertas: 2, puertaTipo: 'batiente', cajones: 1, repisas: 1, divisiones: 0, colgador: false, zocalo: 0.1, fondoHdf: true },
    nota: 'El tablero de encima (granito, cuarzo o postformado) no está incluido.' },
  { id: 'cocina_alta', nombre: 'Repostero / mueble alto', corto: 'Repostero', emoji: '🗄️', descripcion: 'Mueble alto de cocina, colgado en la pared.',
    base: { ancho: 1.2, alto: 0.7, prof: 0.33, puertas: 2, puertaTipo: 'batiente', cajones: 0, repisas: 1, divisiones: 0, colgador: false, zocalo: 0, fondoHdf: true } },
  { id: 'alacena', nombre: 'Alacena / despensa', corto: 'Alacena', emoji: '🥫', descripcion: 'Mueble alto de piso a techo con repisas para víveres.',
    base: { ancho: 0.6, alto: 2.1, prof: 0.55, puertas: 2, puertaTipo: 'batiente', cajones: 0, repisas: 5, divisiones: 0, colgador: false, zocalo: 0.1, fondoHdf: true } },
  { id: 'isla', nombre: 'Isla de cocina', corto: 'Isla', emoji: '🏝️', descripcion: 'Mueble bajo al centro de la cocina, con cajones y puertas.',
    base: { ancho: 1.6, alto: 0.9, prof: 0.9, puertas: 2, puertaTipo: 'batiente', cajones: 2, repisas: 1, divisiones: 1, colgador: false, zocalo: 0.1, fondoHdf: true },
    nota: 'El tablero de encima (granito, cuarzo o postformado) no está incluido.' },
  { id: 'escritorio', nombre: 'Escritorio con cajonera', corto: 'Escritorio', emoji: '🖥️', descripcion: 'Cajonera lateral de 3 cajones y espacio para las piernas.',
    base: { ancho: 1.2, alto: 0.75, prof: 0.6, puertas: 0, puertaTipo: 'ninguna', cajones: 3, repisas: 0, divisiones: 1, colgador: false, zocalo: 0, fondoHdf: false } },
  { id: 'archivador', nombre: 'Archivador de oficina', corto: 'Archivador', emoji: '🗃️', descripcion: 'Cajones para carpetas y una puerta abajo.',
    base: { ancho: 0.5, alto: 1.1, prof: 0.55, puertas: 1, puertaTipo: 'batiente', cajones: 3, repisas: 1, divisiones: 0, colgador: false, zocalo: 0.05, fondoHdf: true } },
  { id: 'estante', nombre: 'Estante / librero', corto: 'Librero', emoji: '📚', descripcion: 'Repisas abiertas, sin puertas.',
    base: { ancho: 0.8, alto: 1.8, prof: 0.3, puertas: 0, puertaTipo: 'ninguna', cajones: 0, repisas: 4, divisiones: 0, colgador: false, zocalo: 0.05, fondoHdf: true } },
  { id: 'zapatera', nombre: 'Zapatera', corto: 'Zapatera', emoji: '👟', descripcion: 'Dos puertas y cuatro repisas.',
    base: { ancho: 0.8, alto: 1.0, prof: 0.35, puertas: 2, puertaTipo: 'batiente', cajones: 0, repisas: 4, divisiones: 0, colgador: false, zocalo: 0.05, fondoHdf: true } },
  { id: 'rack_tv', nombre: 'Centro de TV / rack', corto: 'Rack de TV', emoji: '📺', descripcion: 'Mueble bajo con cajones y espacios abiertos.',
    base: { ancho: 1.6, alto: 0.5, prof: 0.4, puertas: 0, puertaTipo: 'ninguna', cajones: 2, repisas: 0, divisiones: 3, colgador: false, zocalo: 0.05, fondoHdf: true } },
  { id: 'velador', nombre: 'Velador / mesa de noche', corto: 'Velador', emoji: '🛏️', descripcion: 'Dos cajones y un espacio abierto.',
    base: { ancho: 0.45, alto: 0.55, prof: 0.4, puertas: 0, puertaTipo: 'ninguna', cajones: 2, repisas: 0, divisiones: 0, colgador: false, zocalo: 0.05, fondoHdf: true } },
  { id: 'comoda', nombre: 'Cómoda de cajones', corto: 'Cómoda', emoji: '🧺', descripcion: 'Cuatro cajones grandes para ropa.',
    base: { ancho: 1.0, alto: 0.85, prof: 0.45, puertas: 0, puertaTipo: 'ninguna', cajones: 4, repisas: 0, divisiones: 0, colgador: false, zocalo: 0.05, fondoHdf: true } },
  { id: 'bano', nombre: 'Mueble de baño (bajo lavatorio)', corto: 'Mueble de baño', emoji: '🚿', descripcion: 'Dos puertas bajo el lavatorio.',
    base: { ancho: 0.8, alto: 0.55, prof: 0.45, puertas: 2, puertaTipo: 'batiente', cajones: 0, repisas: 0, divisiones: 0, colgador: false, zocalo: 0.1, fondoHdf: true },
    nota: 'El lavatorio y la grifería no están incluidos. Usa melamina resistente a la humedad (RH).' },
  { id: 'botiquin', nombre: 'Botiquín / espejo de baño', corto: 'Botiquín', emoji: '🪞', descripcion: 'Mueble colgado con puerta y repisas.',
    base: { ancho: 0.6, alto: 0.7, prof: 0.15, puertas: 1, puertaTipo: 'batiente', cajones: 0, repisas: 2, divisiones: 0, colgador: false, zocalo: 0, fondoHdf: true } },
  { id: 'libre', nombre: 'Mueble libre (a medida)', corto: 'Mueble libre', emoji: '📐', descripcion: 'Tú pones todas las medidas y partes.',
    base: { ancho: 1.0, alto: 1.0, prof: 0.4, puertas: 2, puertaTipo: 'batiente', cajones: 0, repisas: 1, divisiones: 0, colgador: false, zocalo: 0, fondoHdf: true } },
];
/** Color de puertas y frentes si es distinto al del casco (bicolor); si no, undefined. */
export const colorFrente = (m: Mueble) => m.colorFrente && m.colorFrente.toLowerCase() !== (m.color || '').toLowerCase() ? m.colorFrente : undefined;
export const tipoDe = (id: TipoMueble) => TIPOS.find(t => t.id === id) || TIPOS[TIPOS.length - 1];
export const esAlto = (m: Mueble) => m.tipo === 'cocina_alta' || m.tipo === 'botiquin';
export function muebleNuevo(tipo: TipoMueble, color = 'Blanco'): Mueble {
  return { id: uid(), tipo, nombre: '', cantidad: 1, color, ...tipoDe(tipo).base };
}

// ── Vista de frente (la usan el despiece, los dibujos y el 3D) ──────────────
// Coordenadas en mm: x desde el borde izquierdo exterior, y desde el piso.
export interface Compartimento { i: number; x0: number; x1: number; conPiso: boolean; cajones: number; repisas: number; colgador: boolean; cajonesArriba: boolean }
export interface FrenteMueble {
  W: number; H: number; D: number; z: number; t: number; yPiso: number; yTecho: number;
  comps: Compartimento[];
  divisiones: number[];                                        // x de la cara izquierda de cada división
  repisas: { x0: number; x1: number; y: number }[];
  colgadores: { x0: number; x1: number; y: number }[];
  puertas: { x: number; y: number; w: number; h: number; tipo: 'batiente' | 'corrediza'; bisagras: number; lado: 'izq' | 'der'; plano: number }[];
  cajones: { x: number; y: number; w: number; h: number; comp: number; interior: boolean }[];
  corredera: number;                                           // mm (300…450)
}

export const bisagrasPorPuerta = (hMm: number) => hMm <= 900 ? 2 : hMm <= 1600 ? 3 : 4;
export function largoCorredera(profMm: number, fondoHdf: boolean): number {
  const libre = profMm - (fondoHdf ? 3 : 0) - 10;
  return [450, 400, 350, 300].find(c => c <= libre) || 300;
}

export function frenteDe(m: Mueble): FrenteMueble {
  const W = mm(m.ancho), H = mm(m.alto), D = mm(m.prof), z = Math.max(0, mm(m.zocalo)), t = ESP;
  const nDiv = entero(m.divisiones, 0, 20), nComp = nDiv + 1;
  const Wi = Math.max(0, W - 2 * t);
  const libreAncho = Math.max(0, Wi - nDiv * t);
  const yPiso = z + t, yTecho = H - t;
  const nCaj = entero(m.cajones, 0, 12), nRep = entero(m.repisas, 0, 40);
  const cajonesArriba = ['cocina_baja', 'isla', 'escritorio', 'velador'].includes(m.tipo);
  const corrediza = m.puertaTipo === 'corrediza';

  // Cajones: en el último compartimento; en el rack, uno por compartimento desde el centro.
  const cajPorComp = new Array(nComp).fill(0);
  if (m.tipo === 'rack_tv' && nComp > 1) {
    const orden = [...Array(nComp).keys()].sort((a, b) => Math.abs(a - (nComp - 1) / 2) - Math.abs(b - (nComp - 1) / 2) || a - b);
    for (let k = 0; k < nCaj; k++) cajPorComp[orden[k % nComp]]++;
  } else cajPorComp[nComp - 1] = nCaj;
  // Colgador: en el primer compartimento sin cajones (o el primero).
  const conColg = m.colgador ? Math.max(0, cajPorComp.findIndex(c => c === 0)) : -1;
  // Repisas: primero en los compartimentos sin colgador.
  const repPorComp = new Array(nComp).fill(0);
  const sinColg = [...Array(nComp).keys()].filter(i => i !== conColg);
  const destino = sinColg.length ? sinColg : [...Array(nComp).keys()];
  for (let k = 0; k < nRep; k++) repPorComp[destino[k % destino.length]]++;

  // Puertas batientes por compartimento (donde la zona sin cajones lo permite). El ancho de
  // cada compartimento va según sus puertas: la división cae donde se juntan dos puertas.
  const nBatiente = m.puertaTipo === 'batiente' ? entero(m.puertas, 0, 20) : 0;
  const conZonaPuerta = [...Array(nComp).keys()].filter(i => H - z - cajPorComp[i] * ALTO_CAJON > 100);
  const puertasPorComp = new Array(nComp).fill(0);
  if (conZonaPuerta.length) for (let k = 0; k < nBatiente; k++) puertasPorComp[conZonaPuerta[k % conZonaPuerta.length]]++;
  const peso = puertasPorComp.map(n => (nBatiente > 0 ? Math.max(1, n) : 1));
  const sumaPeso = peso.reduce((a, b) => a + b, 0);
  let xAcum = t;
  const comps: Compartimento[] = [...Array(nComp).keys()].map(i => {
    const ancho = (libreAncho * peso[i]) / sumaPeso;
    const x0 = xAcum; xAcum += ancho + t;
    return { i, x0, x1: x0 + ancho, conPiso: !(m.tipo === 'escritorio' && nComp > 1 && cajPorComp[i] === 0), cajones: cajPorComp[i], repisas: repPorComp[i], colgador: i === conColg, cajonesArriba };
  });
  const divisiones = comps.slice(1).map(c => c.x0 - t);

  const repisas: FrenteMueble['repisas'] = [], colgadores: FrenteMueble['colgadores'] = [];
  const cajones: FrenteMueble['cajones'] = [], puertas: FrenteMueble['puertas'] = [];
  const zonasPuerta: { comp: Compartimento; rx0: number; rx1: number; y0: number; y1: number }[] = [];

  for (const c of comps) {
    const banda = c.cajones * ALTO_CAJON;
    // Zona interior libre (sin cajones) para repisas y colgador.
    const iy0 = c.cajonesArriba ? yPiso : yPiso + banda;
    const iy1 = c.cajonesArriba ? yTecho - banda : yTecho;
    if (c.colgador) {
      const tope = c.repisas ? yTecho - 450 : yTecho;
      for (let k = 0; k < c.repisas; k++) repisas.push({ x0: c.x0, x1: c.x1, y: yTecho - 450 + (k * 450) / c.repisas });
      colgadores.push({ x0: c.x0, x1: c.x1, y: Math.max(iy0 + 100, tope - 70) });
    } else {
      for (let k = 0; k < c.repisas; k++) repisas.push({ x0: c.x0, x1: c.x1, y: iy0 + ((k + 1) * (iy1 - iy0)) / (c.repisas + 1) });
    }
    // Región de frente: a sobreponer, cubre la mitad de la división vecina.
    const rx0 = c.i === 0 ? 0 : c.x0 - t / 2, rx1 = c.i === nComp - 1 ? W : c.x1 + t / 2;
    for (let k = 0; k < c.cajones; k++) {
      const y = c.cajonesArriba ? H - (k + 1) * ALTO_CAJON : z + k * ALTO_CAJON;
      if (corrediza) cajones.push({ x: c.x0 + 2, y: Math.max(yPiso, y) + LUZ / 2, w: c.x1 - c.x0 - 4, h: ALTO_CAJON - LUZ, comp: c.i, interior: true });
      else cajones.push({ x: rx0 + LUZ / 2, y: y + LUZ / 2, w: rx1 - rx0 - LUZ, h: ALTO_CAJON - LUZ, comp: c.i, interior: false });
    }
    const zy0 = c.cajonesArriba ? z : z + banda, zy1 = c.cajonesArriba ? H - banda : H;
    if (zy1 - zy0 > 100) zonasPuerta.push({ comp: c, rx0, rx1, y0: zy0, y1: zy1 });
  }
  // Puertas batientes: las que le tocan a cada compartimento, en su zona sin cajones.
  zonasPuerta.forEach(zp => {
    const n = puertasPorComp[zp.comp.i]; if (!n) return;
    const ancho = (zp.rx1 - zp.rx0) / n;
    for (let j = 0; j < n; j++) {
      const h = zp.y1 - zp.y0 - LUZ;
      const lado: 'izq' | 'der' = n === 1 ? (zp.comp.i % 2 === 0 ? 'izq' : 'der') : j < n / 2 ? 'izq' : 'der';
      puertas.push({ x: zp.rx0 + j * ancho + LUZ / 2, y: zp.y0 + LUZ / 2, w: ancho - LUZ, h, tipo: 'batiente', bisagras: bisagrasPorPuerta(h), lado, plano: 0 });
    }
  });
  if (corrediza) {
    const n = Math.max(2, entero(m.puertas, 2, 6));
    const w = (W + (n - 1) * TRASLAPE) / n;
    for (let j = 0; j < n; j++) puertas.push({ x: j * (w - TRASLAPE), y: z + 20, w, h: H - z - 40, tipo: 'corrediza', bisagras: 0, lado: 'izq', plano: j % 2 });
  }
  return { W, H, D, z, t, yPiso, yTecho: Math.max(yPiso, yTecho), comps, divisiones, repisas, colgadores, puertas, cajones, corredera: largoCorredera(D, m.fondoHdf) };
}

// ── Despiece ────────────────────────────────────────────────────────────────
export type MaterialPieza = 'melamina' | 'hdf';
export interface Pieza {
  id: string; mueble: string; nombre: string; material: MaterialPieza;
  largo: number; ancho: number; cant: number;              // mm (largo ≥ ancho)
  canto: { gruesoMm: number; delgadoMm: number };          // metros lineales de canto por pieza, en mm
  nota?: string;
  color?: string;                                          // si no es el color del mueble (frentes bicolor)
}

export function piezasDe(m: Mueble): Pieza[] {
  const f = frenteDe(m);
  const { W, H, D, t, yPiso, yTecho, z } = f;
  const k = Math.max(1, Math.round(m.cantidad || 1));
  const lista: Pieza[] = [];
  const add = (nombre: string, material: MaterialPieza, a: number, b: number, cant: number, grueso = 0, delgado = 0, nota?: string, color?: string) => {
    a = Math.round(a); b = Math.round(b);
    if (a <= 0 || b <= 0 || cant <= 0) return;
    const largo = Math.max(a, b), ancho = Math.min(a, b);
    const igual = lista.find(p => p.nombre === nombre && p.material === material && p.largo === largo && p.ancho === ancho && p.canto.gruesoMm === Math.round(grueso) && p.canto.delgadoMm === Math.round(delgado) && p.color === color);
    if (igual) { igual.cant += cant * k; return; }
    lista.push({ id: `${m.id}-${lista.length + 1}`, mueble: m.id, nombre, material, largo, ancho, cant: cant * k, canto: { gruesoMm: Math.round(grueso), delgadoMm: Math.round(delgado) }, nota: color ? [nota, `color ${color}`].filter(Boolean).join(' · ') : nota, ...(color ? { color } : {}) });
  };
  // Frentes en otro color (bicolor) y puertas de vidrio (no llevan melamina: van en herrajes).
  const cf = colorFrente(m);
  const vidrio = m.estiloPuerta === 'vidrio';
  const Wi = W - 2 * t;
  const hInt = yTecho - yPiso;
  // Casco
  add('Lateral', 'melamina', H, D, 2, H, D);
  add('Techo', 'melamina', Wi, D, 1, Wi);
  if (f.comps.every(c => c.conPiso)) add('Piso', 'melamina', Wi, D, 1, Wi);
  else f.comps.filter(c => c.conPiso).forEach(c => add('Piso', 'melamina', c.x1 - c.x0, D, 1, c.x1 - c.x0));
  if (z > 0) add('Zócalo', 'melamina', Wi, z, 1, 0, Wi);
  f.divisiones.forEach(() => add('División', 'melamina', hInt, D, 1, hInt));
  const profRep = D - 20 - (m.fondoHdf ? 3 : 0);
  f.repisas.forEach(r => add('Repisa', 'melamina', r.x1 - r.x0 - 2, profRep, 1, r.x1 - r.x0 - 2));
  // Puertas y cajones
  if (!vidrio) f.puertas.forEach(p => add('Puerta', 'melamina', p.h, p.w, 1, 2 * (p.w + p.h), 0, p.tipo === 'corrediza' ? 'corrediza' : m.estiloPuerta === 'ranurada' ? 'ranurada (CNC)' : undefined, cf));
  f.cajones.forEach(c => {
    add('Frente de cajón', 'melamina', c.w, c.h, 1, 2 * (c.w + c.h), 0, undefined, c.interior ? undefined : cf);
    const comp = f.comps[c.comp];
    const bw = comp.x1 - comp.x0 - 2 * HUELGO_CORREDERA;
    const L = f.corredera;
    add('Costado de cajón', 'melamina', L, ALTO_CAJA, 2, 0, L);
    add('Trasera de cajón', 'melamina', bw - 2 * t, ALTO_CAJA - 15, 2, 0, bw - 2 * t, 'trasera y contrafrente');
    add('Fondo de cajón', 'hdf', bw, L, 1);
  });
  // Fondo HDF (si no entra en una plancha, va en partes)
  if (m.fondoHdf) {
    const fw = W - 4, fh = H - z - 4;
    const largo = Math.max(fw, fh), ancho = Math.min(fw, fh);
    const partes = Math.max(Math.ceil(largo / UTIL_L), ancho > UTIL_A ? Math.ceil(ancho / UTIL_A) : 1);
    if (largo > UTIL_L) add('Fondo', 'hdf', largo / partes, ancho, partes, 0, 0, `en ${partes} partes`);
    else if (ancho > UTIL_A) add('Fondo', 'hdf', largo, ancho / partes, partes, 0, 0, `en ${partes} partes`);
    else add('Fondo', 'hdf', largo, ancho, 1);
  }
  return lista;
}

// ── Herrajes ────────────────────────────────────────────────────────────────
export interface LineaHerraje { clave: string; cant: number; nota?: string }

export function herrajesDe(m: Mueble): LineaHerraje[] {
  const f = frenteDe(m);
  const k = Math.max(1, Math.round(m.cantidad || 1));
  const out: LineaHerraje[] = [];
  const add = (clave: string, cant: number, nota?: string) => { if (cant > 0) out.push({ clave, cant: cant * k, nota }); };
  const batientes = f.puertas.filter(p => p.tipo === 'batiente');
  add('mel:bisagra', batientes.reduce((x, p) => x + p.bisagras, 0), '2 hasta 0.90 m · 3 hasta 1.60 m · 4 más alto');
  add(`mel:corredera_${f.corredera / 10}`, f.cajones.length, 'un par por cajón');
  // Tirador según el diseño (los cajones interiores de un corredizo llevan perilla).
  const frentes = f.puertas.length + f.cajones.filter(c => !c.interior).length;
  const tir = m.tirador || 'barra';
  if (tir === 'gola') add('mel:perfil_gola', Math.round([...f.puertas, ...f.cajones.filter(c => !c.interior)].reduce((x, p) => x + p.w, 0)) / 1000, 'perfil a lo ancho de cada frente');
  else add(tir === 'boton' ? 'mel:boton' : tir === 'push' ? 'mel:push' : 'mel:jalador', frentes, 'uno por puerta y cajón');
  add('mel:boton', f.cajones.filter(c => c.interior).length, 'cajones interiores');
  if (m.estiloPuerta === 'vidrio') add('mel:puerta_vidrio', Math.round(f.puertas.reduce((x, p) => x + p.w * p.h, 0) / 1e4) / 100, 'marco de aluminio y vidrio, m²');
  const colg = f.colgadores.reduce((x, c) => x + (c.x1 - c.x0), 0);
  if (colg > 0) { add('mel:tubo_colgador', colg / 1000, 'metros de tubo'); add('mel:soporte_tubo', f.colgadores.length * 2, '2 por tubo'); }
  if (m.tipo === 'cocina_baja' || m.tipo === 'isla' || m.tipo === 'bano') add('mel:pata', m.tipo === 'isla' ? 6 : 4, 'patas niveladoras');
  if (m.puertaTipo === 'corrediza') add('mel:riel_corredizo', 1, `riel de ${(f.W / 1000).toFixed(2)} m`);
  // Uniones: 2 minifix por extremo de techo, piso y divisiones; el zócalo 2.
  const nPisos = f.comps.every(c => c.conPiso) ? 1 : f.comps.filter(c => c.conPiso).length;
  const horizontales = 1 + nPisos; // techo + piso(s)
  add('mel:minifix', 4 * horizontales + 4 * f.divisiones.length + (f.z > 0 ? 2 : 0), 'uniones del casco');
  const fondoPer = m.fondoHdf ? 2 * (f.W + f.H - f.z) : 0;
  add('mel:tornillo', 8 * (2 + horizontales + f.divisiones.length) + 16 * f.cajones.length + Math.ceil(fondoPer / 150), 'casco, cajones y fondo');
  add('mel:soporte_repisa', 4 * f.repisas.length, '4 por repisa');
  return out;
}

// ── Avisos (medidas que no funcionan) ──────────────────────────────────────
export function avisosMueble(m: Mueble): string[] {
  const a: string[] = [];
  const f = frenteDe(m);
  if (m.ancho < 0.2) a.push('El ancho mínimo es 0.20 m.');
  if (m.alto < 0.2) a.push('El alto mínimo es 0.20 m.');
  if (m.prof < 0.15) a.push('La profundidad mínima es 0.15 m.');
  if (f.H > UTIL_L) a.push(`Muy alto: el tablero da ${(UTIL_L / 1000).toFixed(2)} m de largo útil. Divide el mueble en dos cuerpos (uno encima del otro).`);
  if (f.W - 2 * ESP > UTIL_L) a.push(`Muy ancho: el techo y el piso no salen de un tablero (máx. ${((UTIL_L + 2 * ESP) / 1000).toFixed(2)} m). Divide el mueble en dos cuerpos.`);
  if (f.D > UTIL_A) a.push('Demasiado profundo para el tablero.');
  if (m.zocalo > 0 && m.zocalo >= m.alto / 2) a.push('El zócalo es muy alto para este mueble.');
  const cw = f.comps.length ? Math.min(...f.comps.map(c => c.x1 - c.x0)) : 0;
  if (cw < 150 && m.ancho >= 0.2) a.push('Hay demasiadas divisiones: cada espacio queda muy angosto.');
  f.comps.forEach(c => {
    if (c.cajones && c.cajones * ALTO_CAJON > f.yTecho - f.yPiso + 2 * ESP) a.push(`No entran ${c.cajones} cajones de 18 cm en ${m.alto.toFixed(2)} m de alto: quita cajones o sube el alto.`);
    if (c.cajones && c.x1 - c.x0 < 200) a.push('El espacio de los cajones es muy angosto (mínimo 20 cm).');
  });
  if (f.cajones.length && f.D - (m.fondoHdf ? 3 : 0) - 10 < 300) a.push('Con menos de 0.32 m de profundidad no entra una corredera de 30 cm.');
  if (m.puertaTipo === 'batiente' && m.puertas > 0) {
    if (f.puertas.length < Math.round(m.puertas)) a.push('No hay espacio para todas las puertas (los cajones ocupan el frente).');
    if (f.puertas.some(p => p.w > 650)) a.push('Hay puertas de más de 65 cm de ancho: se pueden colgar. Mejor pon una puerta más.');
  }
  if (m.puertaTipo === 'corrediza' && m.ancho < 0.9) a.push('Las puertas corredizas necesitan al menos 0.90 m de ancho.');
  if (m.colgador && f.colgadores.some(c => c.y - f.yPiso < 900) && m.alto >= 1.2) a.push('El colgador queda bajo: para ropa larga deja 1.50 m libres o quita cajones.');
  return a;
}

// ── Metrado y precios ───────────────────────────────────────────────────────
export interface LineaMelamina { clave: string; nombre: string; unidad: string; cant: number; precio: number; subtotal: number; nota?: string }
export interface GrupoTableros { material: MaterialPieza; color: string; clave: string; resultado: ResultadoOptimizador }
export interface OpcionesMetrado { incluirCorte?: boolean; incluirEnchape?: boolean; respetarVeta?: boolean }
export interface MetradoMelamina {
  lineas: LineaMelamina[]; materiales: number; manoObra: number; dias: number; total: number;
  piezas: Pieza[]; tableros: GrupoTableros[];
  m2Melamina: number; cantoGruesoM: number; cantoDelgadoM: number; nTableros: number; sobredimensionadas: number;
}

export const nombreMueble = (m: Mueble, i?: number) => `${i !== undefined ? `${i + 1}. ` : ''}${m.nombre || tipoDe(m.tipo).corto}`;
/** Expande piezas por cantidad para el optimizador. */
export function expandir(piezas: Pieza[], etiqueta: (muebleId: string) => string): PiezaCorte[] {
  const out: PiezaCorte[] = [];
  piezas.forEach(p => { for (let i = 0; i < p.cant; i++) out.push({ id: `${p.id}#${i + 1}`, nombre: p.nombre, mueble: etiqueta(p.mueble), largo: p.largo, ancho: p.ancho }); });
  return out;
}
const UNIDAD_CIENTO = new Set(['mel:minifix', 'mel:tornillo', 'mel:soporte_repisa']);
export const redondearMedioDia = (d: number) => Math.ceil(d * 2 - 1e-9) / 2;

export function metradoMelamina(muebles: Mueble[], op: OpcionesMetrado = {}): MetradoMelamina {
  const etiqueta = new Map(muebles.map((m, i) => [m.id, nombreMueble(m, i)]));
  const piezas = muebles.flatMap(piezasDe);
  const linea = (clave: string, cant: number, nota?: string): LineaMelamina => {
    const it = itemCatalogo(clave);
    const p = precio(clave);
    return { clave, nombre: it?.nombre || clave, unidad: it?.unidad || 'unidad', cant, precio: p, subtotal: Math.round(cant * p * 100) / 100, nota };
  };
  const lineas: LineaMelamina[] = [];
  // Tableros: una corrida del optimizador por color de melamina y otra para el HDF.
  const tableros: GrupoTableros[] = [];
  const colorDe = new Map(muebles.map(m => [m.id, colorMelamina(m.color).nombre]));
  const colorPieza = (p: Pieza) => p.color ? colorMelamina(p.color).nombre : colorDe.get(p.mueble) || '';
  const colores = [...new Set(piezas.filter(p => p.material === 'melamina').map(colorPieza))];
  colores.forEach(color => {
    const ps = piezas.filter(p => p.material === 'melamina' && colorPieza(p) === color);
    if (!ps.length) return;
    const resultado = optimizar(expandir(ps, id => etiqueta.get(id) || ''), { largo: TABLERO_L, ancho: TABLERO_A, sierra: SIERRA, refile: REFILE, respetarVeta: op.respetarVeta });
    tableros.push({ material: 'melamina', color, clave: claveTablero(color), resultado });
  });
  const hdf = piezas.filter(p => p.material === 'hdf');
  if (hdf.length) tableros.push({ material: 'hdf', color: 'HDF 3 mm', clave: 'mel:hdf', resultado: optimizar(expandir(hdf, id => etiqueta.get(id) || ''), { largo: TABLERO_L, ancho: TABLERO_A, sierra: SIERRA, refile: REFILE }) });
  // Tableros del mismo color comparten clave de precio ("otro color").
  const porClave = new Map<string, { n: number; nota: string[] }>();
  tableros.forEach(t => { const x = porClave.get(t.clave) || { n: 0, nota: [] }; x.n += t.resultado.tableros.length; x.nota.push(t.material === 'hdf' ? 'fondos y cajones' : `color ${t.color}`); porClave.set(t.clave, x); });
  porClave.forEach((v, clave) => { if (v.n) lineas.push(linea(clave, v.n, `${v.nota.join(', ')} · según plano de cortes`)); });
  const nTableros = tableros.reduce((x, t) => x + t.resultado.tableros.length, 0);
  // Tapacanto (+10 %)
  const gruesoM = piezas.reduce((x, p) => x + p.canto.gruesoMm * p.cant, 0) / 1000;
  const delgadoM = piezas.reduce((x, p) => x + p.canto.delgadoMm * p.cant, 0) / 1000;
  const cantoGruesoM = Math.ceil(gruesoM * 1.1), cantoDelgadoM = Math.ceil(delgadoM * 1.1);
  if (cantoGruesoM) lineas.push(linea('mel:canto_grueso', cantoGruesoM, `${gruesoM.toFixed(1)} m + 10 %`));
  if (cantoDelgadoM) lineas.push(linea('mel:canto_delgado', cantoDelgadoM, `${delgadoM.toFixed(1)} m + 10 %`));
  // Herrajes
  const her = new Map<string, { cant: number; nota?: string }>();
  muebles.forEach(m => herrajesDe(m).forEach(h => { const x = her.get(h.clave) || { cant: 0, nota: h.nota }; x.cant += h.cant; her.set(h.clave, x); }));
  her.forEach((v, clave) => {
    if (clave === 'mel:tubo_colgador') lineas.push(linea(clave, Math.ceil(v.cant / 3 - 1e-9), `${v.cant.toFixed(2)} m de tubo`));
    else if (UNIDAD_CIENTO.has(clave)) lineas.push(linea(clave, Math.ceil(v.cant / 100), `${Math.round(v.cant)} und · ${v.nota || ''}`));
    else if (clave === 'mel:perfil_gola' || clave === 'mel:puerta_vidrio') lineas.push(linea(clave, Math.round(v.cant * 100) / 100, v.nota));
    else lineas.push(linea(clave, Math.round(v.cant), v.nota));
  });
  // Servicios del local
  if (op.incluirCorte && nTableros) lineas.push(linea('mel:corte', nTableros, 'corte en el local'));
  if (op.incluirEnchape && cantoGruesoM + cantoDelgadoM) lineas.push(linea('mel:enchape', cantoGruesoM + cantoDelgadoM, 'pegado de tapacanto en el local'));

  const materiales = Math.round(lineas.reduce((x, l) => x + l.subtotal, 0) * 100) / 100;
  const m2Melamina = piezas.filter(p => p.material === 'melamina').reduce((x, p) => x + (p.largo * p.ancho * p.cant) / 1e6, 0);
  const nMuebles = muebles.reduce((x, m) => x + Math.max(1, Math.round(m.cantidad || 1)), 0);
  const dias = muebles.length ? redondearMedioDia(m2Melamina / 6 + 0.5 * nMuebles) : 0;
  const manoObra = Math.round(dias * precio(claveJornal('Carpintero de melamina')) * 100) / 100;
  const sobredimensionadas = tableros.reduce((x, t) => x + t.resultado.sobredimensionadas.length, 0);
  return { lineas, materiales, manoObra, dias, total: materiales + manoObra, piezas, tableros, m2Melamina, cantoGruesoM, cantoDelgadoM, nTableros, sobredimensionadas };
}
