// =============================================================================
// Electricidad: modelo de datos (puntos eléctricos, circuitos, rutas de tubería,
// fondo del plano) y la cotización guardada en el equipo (claves `electricidad_…`).
//
// Coordenadas en metros, en planta: x a la derecha, y hacia abajo (como el SVG).
// Instalaciones interiores en baja tensión, 220 V monofásico (CNE – Utilización).
// =============================================================================
import { safeStorage } from '../../lib/storageManager';
import type { TipoCable, TipoTubo } from '../../catalogo/electricidad';
import { murosDeObra, pisosObra, murosAmbiente, rotar, defAparato, type MuroRef, type Pt, type TipoAparato } from '../gasfiteria/modeloGasfiteria';

export type { MuroRef, Pt };
export { murosDeObra, pisosObra, murosAmbiente };

export const H_TECHO = 2.5;       // altura de piso a techo (m)
export const H_TABLERO = 1.6;     // centro del tablero
export const TENSION = 220;       // V, monofásico
export const COS_FI = 0.9;

export type ClasePunto = 'luz' | 'interruptor' | 'toma' | 'fuerza' | 'debil' | 'tablero' | 'medidor' | 'tierra';
export type UsoCircuito = 'alumbrado' | 'tomas' | 'cocina' | 'fuerza' | 'debil';
export type CatPunto = 'Luces' | 'Interruptores' | 'Tomacorrientes' | 'Fuerza' | 'Comunicaciones' | 'Tablero y tierra';
export const CATS: CatPunto[] = ['Luces', 'Interruptores', 'Tomacorrientes', 'Fuerza', 'Comunicaciones', 'Tablero y tierra'];

export type TipoPunto =
  | 'luz_techo' | 'aplique' | 'empotrado' | 'tira_led' | 'reflector' | 'sensor'
  | 'int_simple' | 'int_doble' | 'int_triple' | 'int_conmutador' | 'timbre'
  | 'toma_doble' | 'toma_cocina' | 'toma_lavadora'
  | 'terma' | 'ducha_electrica' | 'cocina_electrica' | 'aire' | 'cerco'
  | 'tv' | 'datos'
  | 'tablero' | 'medidor' | 'pozo_tierra';

export interface DefPunto {
  id: TipoPunto; nombre: string; corto: string; cat: CatPunto; clase: ClasePunto;
  w: number;                  // potencia típica (W)
  h: number;                  // altura de montaje (m)
  via: 'techo' | 'piso';      // por dónde le llega la tubería
  caja: 'octogonal' | 'rectangular' | 'cuadrada' | null;
  disp?: string;              // dispositivo con placa (catálogo)
  lum?: string;               // luminaria (opcional en el presupuesto)
  mo?: 'luz' | 'toma' | 'fuerza' | 'debil';
  uso?: UsoCircuito;          // circuito al que va normalmente
  exclusivo?: boolean;        // pide circuito exclusivo (CNE)
  diferencial?: boolean;      // pide interruptor diferencial 30 mA
  retornos?: number;          // interruptores: conductores de retorno
}

export const PUNTOS: DefPunto[] = [
  { id: 'luz_techo', nombre: 'Luminaria de techo (centro de luz)', corto: 'Luz techo', cat: 'Luces', clase: 'luz', w: 50, h: H_TECHO, via: 'techo', caja: 'octogonal', lum: 'ele:lum:luz_techo', mo: 'luz', uso: 'alumbrado' },
  { id: 'aplique', nombre: 'Aplique / braquete de pared', corto: 'Aplique', cat: 'Luces', clase: 'luz', w: 30, h: 2.0, via: 'techo', caja: 'octogonal', lum: 'ele:lum:aplique', mo: 'luz', uso: 'alumbrado' },
  { id: 'empotrado', nombre: 'Panel LED empotrado', corto: 'Panel LED', cat: 'Luces', clase: 'luz', w: 18, h: H_TECHO, via: 'techo', caja: 'octogonal', lum: 'ele:lum:empotrado', mo: 'luz', uso: 'alumbrado' },
  { id: 'tira_led', nombre: 'Tira LED (luz lineal)', corto: 'Tira LED', cat: 'Luces', clase: 'luz', w: 40, h: 1.5, via: 'techo', caja: 'rectangular', lum: 'ele:lum:tira_led', mo: 'luz', uso: 'alumbrado' },
  { id: 'reflector', nombre: 'Reflector exterior', corto: 'Reflector', cat: 'Luces', clase: 'luz', w: 50, h: 2.4, via: 'techo', caja: 'octogonal', lum: 'ele:lum:reflector', mo: 'luz', uso: 'alumbrado' },
  { id: 'sensor', nombre: 'Sensor de movimiento', corto: 'Sensor', cat: 'Luces', clase: 'luz', w: 5, h: H_TECHO, via: 'techo', caja: 'octogonal', disp: 'ele:disp:sensor', mo: 'luz', uso: 'alumbrado' },
  { id: 'int_simple', nombre: 'Interruptor simple', corto: 'Int. simple', cat: 'Interruptores', clase: 'interruptor', w: 0, h: 1.2, via: 'techo', caja: 'rectangular', disp: 'ele:disp:int_simple', uso: 'alumbrado', retornos: 1 },
  { id: 'int_doble', nombre: 'Interruptor doble', corto: 'Int. doble', cat: 'Interruptores', clase: 'interruptor', w: 0, h: 1.2, via: 'techo', caja: 'rectangular', disp: 'ele:disp:int_doble', uso: 'alumbrado', retornos: 2 },
  { id: 'int_triple', nombre: 'Interruptor triple', corto: 'Int. triple', cat: 'Interruptores', clase: 'interruptor', w: 0, h: 1.2, via: 'techo', caja: 'rectangular', disp: 'ele:disp:int_triple', uso: 'alumbrado', retornos: 3 },
  { id: 'int_conmutador', nombre: 'Interruptor de conmutación (3 vías)', corto: 'Conmutación', cat: 'Interruptores', clase: 'interruptor', w: 0, h: 1.2, via: 'techo', caja: 'rectangular', disp: 'ele:disp:int_conmutador', uso: 'alumbrado', retornos: 2 },
  { id: 'timbre', nombre: 'Timbre / pulsador', corto: 'Timbre', cat: 'Interruptores', clase: 'luz', w: 15, h: 1.4, via: 'techo', caja: 'rectangular', disp: 'ele:disp:timbre', mo: 'luz', uso: 'alumbrado' },
  { id: 'toma_doble', nombre: 'Tomacorriente doble con tierra', corto: 'Toma doble', cat: 'Tomacorrientes', clase: 'toma', w: 180, h: 0.3, via: 'piso', caja: 'rectangular', disp: 'ele:disp:toma_doble', mo: 'toma', uso: 'tomas', diferencial: true },
  { id: 'toma_cocina', nombre: 'Tomacorriente de cocina / mesada', corto: 'Toma mesada', cat: 'Tomacorrientes', clase: 'toma', w: 600, h: 1.1, via: 'piso', caja: 'rectangular', disp: 'ele:disp:toma_cocina', mo: 'toma', uso: 'cocina', diferencial: true },
  { id: 'toma_lavadora', nombre: 'Tomacorriente lavadora / refrigeradora', corto: 'Lavadora/Refri', cat: 'Tomacorrientes', clase: 'toma', w: 500, h: 1.1, via: 'piso', caja: 'rectangular', disp: 'ele:disp:toma_lavadora', mo: 'toma', uso: 'cocina', diferencial: true },
  { id: 'terma', nombre: 'Salida de fuerza para terma', corto: 'Terma', cat: 'Fuerza', clase: 'fuerza', w: 1500, h: 1.8, via: 'techo', caja: 'cuadrada', disp: 'ele:disp:fuerza_terma', mo: 'fuerza', uso: 'fuerza', exclusivo: true, diferencial: true },
  { id: 'ducha_electrica', nombre: 'Ducha eléctrica', corto: 'Ducha eléc.', cat: 'Fuerza', clase: 'fuerza', w: 5000, h: 2.1, via: 'techo', caja: 'cuadrada', disp: 'ele:disp:fuerza_ducha', mo: 'fuerza', uso: 'fuerza', exclusivo: true, diferencial: true },
  { id: 'cocina_electrica', nombre: 'Cocina eléctrica / horno', corto: 'Cocina eléc.', cat: 'Fuerza', clase: 'fuerza', w: 6000, h: 0.6, via: 'piso', caja: 'cuadrada', disp: 'ele:disp:fuerza_cocina', mo: 'fuerza', uso: 'fuerza', exclusivo: true, diferencial: true },
  { id: 'aire', nombre: 'Aire acondicionado', corto: 'Aire acond.', cat: 'Fuerza', clase: 'fuerza', w: 1500, h: 2.2, via: 'techo', caja: 'cuadrada', disp: 'ele:disp:fuerza_aire', mo: 'fuerza', uso: 'fuerza', exclusivo: true },
  { id: 'cerco', nombre: 'Cerco eléctrico (energizador)', corto: 'Cerco eléc.', cat: 'Fuerza', clase: 'fuerza', w: 50, h: 1.8, via: 'techo', caja: 'rectangular', disp: 'ele:disp:cerco', mo: 'fuerza', uso: 'fuerza', exclusivo: true },
  { id: 'tv', nombre: 'Salida de TV / cable', corto: 'TV / cable', cat: 'Comunicaciones', clase: 'debil', w: 0, h: 0.4, via: 'piso', caja: 'rectangular', disp: 'ele:disp:tv', mo: 'debil', uso: 'debil' },
  { id: 'datos', nombre: 'Datos / internet (RJ45)', corto: 'Datos RJ45', cat: 'Comunicaciones', clase: 'debil', w: 0, h: 0.4, via: 'piso', caja: 'rectangular', disp: 'ele:disp:datos', mo: 'debil', uso: 'debil' },
  { id: 'tablero', nombre: 'Tablero de distribución (TD)', corto: 'Tablero TD', cat: 'Tablero y tierra', clase: 'tablero', w: 0, h: H_TABLERO, via: 'piso', caja: null },
  { id: 'medidor', nombre: 'Medidor de energía', corto: 'Medidor', cat: 'Tablero y tierra', clase: 'medidor', w: 0, h: 1.5, via: 'piso', caja: null },
  { id: 'pozo_tierra', nombre: 'Pozo a tierra', corto: 'Pozo tierra', cat: 'Tablero y tierra', clase: 'tierra', w: 0, h: 0, via: 'piso', caja: null },
];
const MAPA = new Map(PUNTOS.map(p => [p.id, p]));
export const defPunto = (t: TipoPunto) => MAPA.get(t) || PUNTOS[0];
export const esLuz = (t: TipoPunto) => defPunto(t).clase === 'luz' && t !== 'timbre';
export const esInterruptor = (t: TipoPunto) => defPunto(t).clase === 'interruptor';
export const esEspecial = (t: TipoPunto) => ['tablero', 'medidor', 'tierra'].includes(defPunto(t).clase);

export interface Punto { id: string; tipo: TipoPunto; x: number; y: number; rot: number; circuito?: string; w?: number; nombre?: string; controla?: string[] }
export const potencia = (p: Punto) => p.w ?? defPunto(p.tipo).w;

export interface Circuito {
  id: string; nombre: string; desc: string; uso: UsoCircuito;
  seccion: number; breaker: number; diferencial: boolean; tubo: string; color: string; fd: number;
  manual?: boolean;           // el usuario fijó sección / interruptor (no se recalcula)
}
export const ALIM = '__alim', PT = '__pt';
export const COLOR_ALIM = '#334155', COLOR_PT = '#15803d';
export interface Ruta { id: string; circuito: string; via: 'techo' | 'piso'; pts: Pt[]; auto?: boolean }

export const USOS: Record<UsoCircuito, { nombre: string; corto: string; seccion: number; breaker: number; diferencial: boolean; fd: number }> = {
  alumbrado: { nombre: 'Alumbrado', corto: 'Alumbrado', seccion: 2.5, breaker: 16, diferencial: false, fd: 1 },
  tomas: { nombre: 'Tomacorrientes', corto: 'Tomas', seccion: 4, breaker: 20, diferencial: true, fd: 0.6 },
  cocina: { nombre: 'Tomacorrientes de cocina y lavandería', corto: 'Tomas cocina', seccion: 4, breaker: 20, diferencial: true, fd: 0.7 },
  fuerza: { nombre: 'Circuito exclusivo (fuerza)', corto: 'Exclusivo', seccion: 4, breaker: 20, diferencial: true, fd: 1 },
  debil: { nombre: 'Comunicaciones (TV y datos)', corto: 'TV / datos', seccion: 0, breaker: 0, diferencial: false, fd: 0 },
};
export const PALETA_CIRCUITOS = ['#f59e0b', '#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#65a30d', '#4f46e5', '#b45309', '#0d9488'];

export interface RefFondo { tipo: 'aparato' | 'mueble' | 'columna' | 'area'; x: number; y: number; w: number; d: number; rot: number; etiqueta?: string; gas?: TipoAparato; alto?: boolean }
export type TipoFondo = 'blanco' | 'obra' | 'gasfiteria' | 'melamina' | 'techos';
export interface FondoEle { tipo: TipoFondo; ancho: number; largo: number; nivel?: string; muros: MuroRef[]; refs: RefFondo[] }

export interface CotizacionEle {
  id: string; nombre: string; cliente: string;
  puntos: Punto[]; circuitos: Circuito[]; rutas: Ruta[]; fondo: FondoEle;
  gg: number; util: number; merma: number;
  cable: TipoCable; tubo: TipoTubo;
  incluirLuminarias: boolean; pruebas: boolean; modoMO: 'puntos' | 'jornal';
  actualizado?: string;
}
export const KEY_COT_ACTUAL = 'electricidad_cotizacion_actual';
export const KEY_COT_LISTA = 'electricidad_cotizaciones';
export const KEY_PESTANA = 'electricidad_pestana';
export const KEY_ORIGEN = 'electricidad_origen';

export const uid = () => Math.random().toString(36).slice(2, 10);
export const cotizacionVacia = (): CotizacionEle => ({
  id: uid(), nombre: '', cliente: '', puntos: [], circuitos: [], rutas: [],
  fondo: { tipo: 'blanco', ancho: 6, largo: 5, muros: murosAmbiente(6, 5), refs: [] },
  gg: 10, util: 20, merma: 10, cable: 'thw', tubo: 'sap', incluirLuminarias: false, pruebas: true, modoMO: 'puntos',
});
export const normalizar = (c: Partial<CotizacionEle>): CotizacionEle => {
  const v = cotizacionVacia(), n = { ...v, ...c };
  return {
    ...n, puntos: Array.isArray(n.puntos) ? n.puntos : [], circuitos: Array.isArray(n.circuitos) ? n.circuitos : [], rutas: Array.isArray(n.rutas) ? n.rutas : [],
    fondo: n.fondo?.muros ? { ...v.fondo, ...n.fondo, refs: Array.isArray(n.fondo.refs) ? n.fondo.refs : [] } : v.fondo,
  };
};
export const leerCotizacionActual = (): CotizacionEle => normalizar(safeStorage.getItem<CotizacionEle | null>(KEY_COT_ACTUAL, null) || {});
export const leerCotizaciones = (): CotizacionEle[] => safeStorage.getItem<CotizacionEle[]>(KEY_COT_LISTA, []) || [];

export const nombrePunto = (p: Punto, lista: Punto[]) => {
  if (p.nombre) return p.nombre;
  const mismos = lista.filter(x => x.tipo === p.tipo);
  const d = defPunto(p.tipo);
  return mismos.length > 1 ? `${d.corto} ${mismos.indexOf(p) + 1}` : d.corto;
};
export const circuitoDe = (cot: { circuitos: Circuito[] }, id?: string) => cot.circuitos.find(c => c.id === id);
export const colorCircuito = (cot: { circuitos: Circuito[] }, id?: string) => id === ALIM ? COLOR_ALIM : id === PT ? COLOR_PT : circuitoDe(cot, id)?.color || '#94a3b8';
export const nombreCircuito = (cot: { circuitos: Circuito[] }, id?: string) => id === ALIM ? 'Alimentador' : id === PT ? 'Línea a tierra' : circuitoDe(cot, id)?.nombre || 'Sin circuito';

/** Caja que encierra muros, referencias, puntos y rutas (para encuadrar el plano y el 3D). */
export function limites(cot: { puntos: Punto[]; rutas: Ruta[]; fondo: FondoEle }) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  cot.fondo.muros.forEach(m => { add(m.x1, m.y1); add(m.x2, m.y2); });
  cot.fondo.refs.forEach(r => { const k = Math.max(r.w, r.d) / 2; add(r.x - k, r.y - k); add(r.x + k, r.y + k); });
  cot.puntos.forEach(p => { add(p.x - 0.2, p.y - 0.2); add(p.x + 0.2, p.y + 0.2); });
  cot.rutas.forEach(t => t.pts.forEach(p => add(p.x, p.y)));
  if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 5; y1 = 4; }
  return { x0, y0, x1, y1 };
}

// ── Circuitos: nuevos y dimensionamiento ────────────────────────────────────
/** Capacidad (A) del termomagnético que admite cada sección (THW-90 en tubo, 3 conductores). */
export const BREAKER_MAX: Record<number, number> = { 2.5: 16, 4: 25, 6: 32, 10: 50, 16: 63, 25: 80 };
const BRK = [16, 20, 25, 32, 40, 50, 63];
const SECS = [2.5, 4, 6, 10, 16, 25];
export const corriente = (w: number) => w / (TENSION * COS_FI);
/** Termomagnético, sección y tubo para un circuito con su carga instalada. */
export function dimensionar(uso: UsoCircuito, w: number) {
  if (uso === 'debil') return { breaker: 0, seccion: 0, tubo: '3/4' };
  const I = corriente(w) * (uso === 'fuerza' ? 1.25 : 1);
  const minB = USOS[uso].breaker;
  const breaker = BRK.find(b => b >= Math.max(minB, I)) || 63;
  const seccion = SECS.find(s => s >= USOS[uso].seccion && BREAKER_MAX[s] >= breaker) || 25;
  return { breaker, seccion, tubo: seccion >= 10 ? '1' : '3/4' };
}
export function nuevoCircuito(circuitos: Circuito[], uso: UsoCircuito, desc?: string): Circuito {
  const usados = new Set(circuitos.map(c => c.color));
  const n = circuitos.length + 1;
  const u = USOS[uso];
  return {
    id: uid(), nombre: uso === 'debil' ? 'TV-D' : `C${n}`, desc: desc || u.nombre, uso, seccion: u.seccion, breaker: u.breaker, diferencial: u.diferencial, tubo: '3/4',
    color: PALETA_CIRCUITOS.find(c => !usados.has(c)) || PALETA_CIRCUITOS[n % PALETA_CIRCUITOS.length], fd: u.fd,
  };
}
/** Renumera C1, C2… respetando nombres que el usuario cambió. */
export const renumerar = (cs: Circuito[]) => { let k = 0; return cs.map(c => (c.uso === 'debil' || !/^C\d+$/.test(c.nombre) ? c : { ...c, nombre: `C${++k}` })); };

// ── Fondos desde los otros apartados ────────────────────────────────────────
export interface Sugerencia { tipo: TipoPunto; x: number; y: number; rot?: number; nombre?: string; w?: number }
export interface FondoImportado { muros: MuroRef[]; refs: RefFondo[]; sugerencias: Sugerencia[]; texto: string; vacio: boolean }
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Obra Civil / Drywall: muros del piso elegido y sus puntos de luz, tomas e interruptores. */
export function desdeObra(nivel?: string): FondoImportado {
  const pisos = pisosObra(), n = nivel || pisos[0];
  const muros = murosDeObra(n);
  const inst = (safeStorage.getItem<{ uid: string; tipo: string; x: number; y: number; nivel?: string }[]>('concreto_instalaciones', []) || [])
    .filter(p => (p.nivel || pisos[0]) === n && ['luz', 'tomacorriente', 'interruptor'].includes(p.tipo));
  const mapa: Record<string, TipoPunto> = { luz: 'luz_techo', tomacorriente: 'toma_doble', interruptor: 'int_simple' };
  return {
    muros, refs: [], vacio: !muros.length && !inst.length,
    sugerencias: inst.map(p => ({ tipo: mapa[p.tipo], x: r3(p.x), y: r3(p.y) })),
    texto: muros.length ? `${muros.length} muros del ${n}${inst.length ? ` y ${inst.length} puntos eléctricos marcados en Obra Civil` : ''}.` : 'No hay muros dibujados en Obra Civil para este piso.',
  };
}

/** Gasfitería: muros (si los tiene) y aparatos como referencia; terma, lavadora… piden su punto. */
export function desdeGasfiteria(): FondoImportado {
  const g = safeStorage.getItem<{ aparatos?: { id: string; tipo: TipoAparato; x: number; y: number; rot: number; nombre?: string }[]; fondo?: { muros?: MuroRef[] } } | null>('gasfiteria_cotizacion_actual', null);
  const aparatos = (g?.aparatos || []).filter(a => !['caja_registro', 'registro', 'sumidero', 'medidor'].includes(a.tipo));
  const muros = g?.fondo?.muros || [];
  const refs: RefFondo[] = aparatos.map(a => { const d = defAparato(a.tipo); return { tipo: 'aparato', gas: a.tipo, x: a.x, y: a.y, w: d.w, d: d.d, rot: a.rot, etiqueta: a.nombre || d.corto }; });
  const hayTerma = aparatos.some(a => a.tipo === 'terma');
  const sug: Sugerencia[] = [];
  const en = (a: { x: number; y: number; rot: number }, lx: number, ly: number) => { const p = rotar(lx, ly, a.rot); return { x: r3(a.x + p.x), y: r3(a.y + p.y) }; };
  aparatos.forEach(a => {
    const d = defAparato(a.tipo);
    if (a.tipo === 'terma') sug.push({ tipo: 'terma', ...en(a, 0.35, -d.d / 2 + 0.06), rot: a.rot });
    if (a.tipo === 'lavadora') sug.push({ tipo: 'toma_lavadora', ...en(a, 0.4, -d.d / 2 + 0.06), rot: a.rot, nombre: 'Lavadora' });
    if (a.tipo === 'lavadero_cocina') { sug.push({ tipo: 'toma_cocina', ...en(a, -0.75, -d.d / 2 + 0.06), rot: a.rot }, { tipo: 'toma_cocina', ...en(a, 0.75, -d.d / 2 + 0.06), rot: a.rot }); }
    if (a.tipo === 'ducha' && !hayTerma) sug.push({ tipo: 'ducha_electrica', ...en(a, 0, -d.d / 2 + 0.06), rot: a.rot });
    if (a.tipo === 'lavatorio') sug.push({ tipo: 'toma_doble', ...en(a, 0.5, -d.d / 2 + 0.06), rot: a.rot, nombre: 'Toma baño' });
  });
  return {
    muros, refs, sugerencias: sug, vacio: !aparatos.length && !muros.length,
    texto: aparatos.length ? `${aparatos.length} aparatos sanitarios${muros.length ? ` y ${muros.length} muros` : ''} de Gasfitería como referencia.` : 'Gasfitería aún no tiene aparatos en su plano.',
  };
}

/** Melamina: las paredes se tienden en planta (en L / U) con sus muebles; cocina → tomas de mesada y LED. */
export function desdeMelamina(): FondoImportado {
  const m = safeStorage.getItem<{ paredes?: { nombre: string; largo: number }[]; muebles?: { tipo: string; nombre: string; ancho: number; prof: number; cantidad?: number; pos?: { pared: number; x: number; y: number } }[] } | null>('melamina_cotizacion_actual', null);
  const paredes = (m?.paredes || []).filter(p => p.largo > 0);
  const muebles = m?.muebles || [];
  if (!paredes.length || !muebles.length) return { muros: [], refs: [], sugerencias: [], vacio: true, texto: 'Melamina aún no tiene muebles diseñados.' };
  // Recorrido en sentido horario: arriba → derecha → abajo → izquierda.
  const dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
  const tramos: { o: Pt; u: Pt; n: Pt; L: number }[] = [];
  let o = { x: 0, y: 0 };
  paredes.slice(0, 4).forEach((p, i) => { const u = dirs[i]; tramos.push({ o, u, n: { x: -u.y, y: u.x }, L: p.largo }); o = { x: o.x + u.x * p.largo, y: o.y + u.y * p.largo }; });
  let muros: MuroRef[] = tramos.map(t => ({ x1: r3(t.o.x), y1: r3(t.o.y), x2: r3(t.o.x + t.u.x * t.L), y2: r3(t.o.y + t.u.y * t.L), a: 0.15 }));
  if (tramos.length === 1) muros = murosAmbiente(tramos[0].L, 3);
  const refs: RefFondo[] = [], sug: Sugerencia[] = [];
  let libre = 0.4;
  muebles.forEach(mb => {
    const ti = Math.min(tramos.length - 1, Math.max(0, mb.pos?.pared ?? 0)), t = tramos[ti];
    const x0 = mb.pos ? mb.pos.x : libre;
    if (!mb.pos) libre += mb.ancho + 0.1;
    const alto = mb.tipo === 'cocina_alta' || mb.tipo === 'alacena' || mb.tipo === 'botiquin';
    const isla = mb.tipo === 'isla';
    const prof = alto ? Math.min(mb.prof, 0.35) : mb.prof;
    const c = isla ? { x: (tramos[0].L) / 2, y: 1.6 } : { x: t.o.x + t.u.x * (x0 + mb.ancho / 2) + t.n.x * (prof / 2 + 0.075), y: t.o.y + t.u.y * (x0 + mb.ancho / 2) + t.n.y * (prof / 2 + 0.075) };
    const rot = (ti * 90) % 360;
    refs.push({ tipo: 'mueble', x: r3(c.x), y: r3(c.y), w: mb.ancho, d: prof, rot, etiqueta: mb.nombre, alto });
    const enPared = (k: number) => ({ x: r3(t.o.x + t.u.x * (x0 + k) + t.n.x * 0.1), y: r3(t.o.y + t.u.y * (x0 + k) + t.n.y * 0.1) });
    if (mb.tipo === 'cocina_baja' || isla) {
      const n = Math.max(1, Math.floor(mb.ancho / 1.2));
      for (let k = 0; k < n; k++) sug.push(isla ? { tipo: 'toma_cocina', x: r3(c.x - mb.ancho / 2 + (k + 0.5) * mb.ancho / n), y: r3(c.y), rot } : { tipo: 'toma_cocina', ...enPared((k + 0.5) * mb.ancho / n), rot });
    }
    if (mb.tipo === 'cocina_alta') sug.push({ tipo: 'tira_led', ...enPared(mb.ancho / 2), rot, nombre: 'LED bajo repostero', w: Math.max(10, Math.round(10 * mb.ancho)) });
    if (mb.tipo === 'closet' || mb.tipo === 'closet_corredizo' || mb.tipo === 'vestidor') sug.push({ tipo: 'tira_led', x: r3(c.x), y: r3(c.y), rot, nombre: `LED ${mb.nombre}`.slice(0, 28), w: Math.max(8, Math.round(8 * mb.ancho)) });
    if (mb.tipo === 'rack_tv') sug.push({ tipo: 'toma_doble', ...enPared(mb.ancho / 2 - 0.3), rot }, { tipo: 'tv', ...enPared(mb.ancho / 2 + 0.3), rot });
    if (mb.tipo === 'escritorio') sug.push({ tipo: 'toma_doble', ...enPared(mb.ancho / 2 - 0.25), rot }, { tipo: 'datos', ...enPared(mb.ancho / 2 + 0.25), rot });
  });
  return { muros, refs, sugerencias: sug, vacio: false, texto: `${paredes.length} pared${paredes.length > 1 ? 'es' : ''} y ${muebles.length} muebles de Melamina tendidos en planta.` };
}

/** Techos: el área cubierta y sus columnas; se sugieren luminarias y reflectores debajo. */
export function desdeTechos(): FondoImportado {
  const e = safeStorage.getItem<{ nodes?: Record<string, { x: number; y: number; z: number }>; segments?: Record<string, { nodeAId: string; nodeBId: string }> } | null>('innova_techos_escena_actual', null);
  const N = e?.nodes || {};
  const ns = Object.values(N).filter(n => isFinite(n.x) && isFinite(n.z));
  if (ns.length < 2) return { muros: [], refs: [], sugerencias: [], vacio: true, texto: 'Techos no tiene un diseño abierto.' };
  const xs = ns.map(n => n.x), zs = ns.map(n => n.z);
  const x0 = Math.min(...xs), z0 = Math.min(...zs), W = Math.max(...xs) - x0, L = Math.max(...zs) - z0;
  if (W < 0.5 || L < 0.5) return { muros: [], refs: [], sugerencias: [], vacio: true, texto: 'El techo abierto no tiene área en planta.' };
  const refs: RefFondo[] = [{ tipo: 'area', x: r3(W / 2), y: r3(L / 2), w: r3(W), d: r3(L), rot: 0, etiqueta: 'Área techada' }];
  const vistos = new Set<string>();
  Object.values(e?.segments || {}).forEach(s => {
    const a = N[s.nodeAId], b = N[s.nodeBId]; if (!a || !b) return;
    if (Math.hypot(a.x - b.x, a.z - b.z) > 0.01 || Math.abs(a.y - b.y) < 0.3) return;
    const k = `${a.x.toFixed(2)}_${a.z.toFixed(2)}`; if (vistos.has(k)) return; vistos.add(k);
    refs.push({ tipo: 'columna', x: r3(a.x - x0), y: r3(a.z - z0), w: 0.15, d: 0.15, rot: 0 });
  });
  const nx = Math.max(1, Math.round(W / 3.5)), nz = Math.max(1, Math.round(L / 3.5));
  const sug: Sugerencia[] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) sug.push({ tipo: 'luz_techo', x: r3((i + 0.5) * W / nx), y: r3((j + 0.5) * L / nz), nombre: 'Bajo techo' });
  const cols = refs.filter(r => r.tipo === 'columna');
  const esquinas = [[0, 0], [W, 0], [0, L], [W, L]].map(([x, y]) => cols.reduce<RefFondo | null>((b, c) => (!b || Math.hypot(c.x - x, c.y - y) < Math.hypot(b.x - x, b.y - y) ? c : b), null)).filter((c, i, a): c is RefFondo => !!c && a.indexOf(c) === i);
  esquinas.slice(0, 4).forEach(c => sug.push({ tipo: 'reflector', x: c.x, y: c.y, nombre: 'Reflector' }));
  sug.push({ tipo: 'int_doble', x: r3(Math.min(W, 0.3)), y: r3(L / 2), nombre: 'Luces techo' });
  return { muros: [], refs, sugerencias: sug, vacio: false, texto: `Área techada de ${W.toFixed(2)} × ${L.toFixed(2)} m${cols.length ? ` con ${cols.length} columnas` : ''}.` };
}

export function importarFondo(tipo: TipoFondo, nivel?: string): FondoImportado {
  if (tipo === 'obra') return desdeObra(nivel);
  if (tipo === 'gasfiteria') return desdeGasfiteria();
  if (tipo === 'melamina') return desdeMelamina();
  if (tipo === 'techos') return desdeTechos();
  return { muros: [], refs: [], sugerencias: [], vacio: false, texto: '' };
}

// ── Ejemplo: casa de una planta (sala-comedor, cocina, lavandería, 2 dormitorios, baño) ──
export function cotizacionEjemplo(): CotizacionEle {
  const c = cotizacionVacia();
  const W = 8.5, L = 9;
  const muros: MuroRef[] = murosAmbiente(W, L);
  muros[0].vanos = [{ t: 2.5, w: 0.9, puerta: true }, { t: 1.1, w: 1.2, puerta: false }, { t: 6.85, w: 1.2, puerta: false }];
  muros[1].vanos = [{ t: 4.1, w: 0.8, puerta: false }];
  muros[2].vanos = [{ t: 1.65, w: 1.2, puerta: false }, { t: 6.85, w: 1.2, puerta: false }];
  muros.push(
    { x1: 5.2, y1: 0, x2: 5.2, y2: 5, a: 0.15, vanos: [{ t: 1.8, w: 0.9, puerta: true }] },
    { x1: 5.2, y1: 3.2, x2: W, y2: 3.2, a: 0.15, vanos: [{ t: 1.0, w: 0.8, puerta: true }] },
    { x1: 0, y1: 5, x2: 3.3, y2: 5, a: 0.15 },
    { x1: 5.2, y1: 5, x2: W, y2: 5, a: 0.15 },
    { x1: 3.3, y1: 5, x2: 3.3, y2: L, a: 0.15, vanos: [{ t: 0.85, w: 0.8, puerta: true }] },
    { x1: 5.2, y1: 5, x2: 5.2, y2: L, a: 0.15, vanos: [{ t: 0.85, w: 0.8, puerta: true }] },
    { x1: 3.3, y1: 6.6, x2: 5.2, y2: 6.6, a: 0.15, vanos: [{ t: 0.95, w: 0.7, puerta: true }] },
  );
  const P = (tipo: TipoPunto, x: number, y: number, rot = 0, nombre?: string, extra: Partial<Punto> = {}): Punto => ({ id: uid(), tipo, x, y, rot, nombre, ...extra });
  const sala1 = P('luz_techo', 1.5, 2.5, 0, 'Sala'), sala2 = P('luz_techo', 3.8, 2.5, 0, 'Comedor');
  const cocina = P('luz_techo', 6.85, 1.6, 0, 'Cocina'), led = P('tira_led', 6.85, 0.35, 0, 'LED repostero');
  const lav = P('luz_techo', 6.85, 4.1, 0, 'Lavandería'), hall = P('luz_techo', 4.25, 5.8, 0, 'Pasadizo');
  const bano = P('luz_techo', 4.25, 7.8, 0, 'Baño'), d1 = P('luz_techo', 1.65, 7.0, 0, 'Dormitorio 1'), d2 = P('luz_techo', 6.85, 7.0, 0, 'Dormitorio 2');
  const apl = P('aplique', 1.6, -0.12, 180, 'Aplique ingreso'), refl = P('reflector', 3.4, -0.12, 180, 'Reflector fachada');
  const patio = P('aplique', 8.62, 4.1, 90, 'Aplique patio');
  const puntos: Punto[] = [
    P('tablero', 0.55, 0.12, 0, 'TD'), P('medidor', 0.55, -0.7, 180, 'Medidor'), P('pozo_tierra', -0.75, 1.3, 0, 'Pozo a tierra'),
    sala1, sala2, cocina, led, lav, hall, bano, d1, d2, apl, refl, patio,
    P('int_doble', 3.15, 0.12, 0, 'Int. sala', { controla: [sala1.id, sala2.id] }),
    P('int_doble', 1.95, 0.12, 0, 'Int. fachada', { controla: [apl.id, refl.id] }),
    P('int_doble', 5.35, 2.45, 90, 'Int. cocina', { controla: [cocina.id, led.id] }),
    P('int_doble', 6.85, 3.33, 0, 'Int. lavandería', { controla: [lav.id, patio.id] }),
    P('int_simple', 3.45, 5.12, 0, 'Int. pasadizo', { controla: [hall.id] }),
    P('int_simple', 3.65, 6.47, 180, 'Int. baño', { controla: [bano.id] }),
    P('int_simple', 3.17, 6.3, 270, 'Int. dorm. 1', { controla: [d1.id] }),
    P('int_simple', 5.33, 6.3, 90, 'Int. dorm. 2', { controla: [d2.id] }),
    P('timbre', 2.95, -0.12, 180, 'Timbre'),
    // Tomacorrientes
    P('toma_doble', 0.12, 2.6, 270), P('toma_doble', 2.4, 4.88, 180), P('toma_doble', 5.08, 1.0, 90), P('toma_doble', 0.12, 4.2, 270),
    P('toma_cocina', 5.8, 0.12, 0), P('toma_cocina', 7.6, 0.12, 0), P('toma_cocina', 8.38, 1.7, 90),
    P('toma_lavadora', 8.38, 2.8, 90, 'Refrigeradora'), P('toma_lavadora', 7.7, 4.88, 180, 'Lavadora'),
    P('toma_doble', 3.45, 7.3, 270, 'Toma baño'),
    P('toma_doble', 0.12, 7.2, 270), P('toma_doble', 3.15, 8.2, 90), P('toma_doble', 1.65, 8.88, 180),
    P('toma_doble', 8.38, 7.2, 90), P('toma_doble', 5.35, 8.2, 270), P('toma_doble', 6.85, 8.88, 180),
    // Fuerza
    P('terma', 8.38, 3.9, 90, 'Terma 80 L'), P('toma_cocina', 6.6, 0.12, 0, 'Horno / microondas', { w: 1200 }), P('aire', 1.65, 5.12, 0, 'Aire dorm. 1'),
    // Comunicaciones
    P('tv', 0.12, 3.4, 270, 'TV sala'), P('datos', 0.12, 1.4, 270, 'Internet'), P('tv', 0.12, 6.3, 270, 'TV dorm. 1'),
  ];
  return { ...c, nombre: 'Casa – instalaciones eléctricas', cliente: 'Sr. Jorge Mamani', fondo: { tipo: 'blanco', ancho: W, largo: L, muros, refs: [] }, puntos };
}
