// =============================================================================
// Gasfitería: modelo de datos (aparatos sanitarios, tuberías, fondo del plano) y la
// cotización guardada en el equipo (claves `gasfiteria_…`).
//
// Coordenadas en metros, en planta: x a la derecha, y hacia abajo (como el SVG).
// Cada aparato tiene su "espalda" hacia -y local (contra la pared) y gira con `rot`.
// =============================================================================
import { safeStorage } from '../../lib/storageManager';
import type { SistemaTubo } from '../../catalogo/gasfiteria';

export type Red = 'fria' | 'caliente' | 'desague' | 'ventilacion';
export interface Pt { x: number; y: number }

export const REDES: Record<Red, { nombre: string; corto: string; color: string; claro: string; sis: SistemaTubo; diams: string[]; defecto: string; material: string }> = {
  fria: { nombre: 'Agua fría', corto: 'Fría', color: '#2563eb', claro: '#dbeafe', sis: 'pvc', diams: ['1/2', '3/4', '1'], defecto: '1/2', material: 'PVC C-10' },
  caliente: { nombre: 'Agua caliente', corto: 'Caliente', color: '#dc2626', claro: '#fee2e2', sis: 'cpvc', diams: ['1/2', '3/4'], defecto: '1/2', material: 'CPVC' },
  desague: { nombre: 'Desagüe', corto: 'Desagüe', color: '#8b5e34', claro: '#f3e8dc', sis: 'sal', diams: ['2', '3', '4'], defecto: '2', material: 'PVC SAL' },
  ventilacion: { nombre: 'Ventilación', corto: 'Ventil.', color: '#16a34a', claro: '#dcfce7', sis: 'sal', diams: ['2'], defecto: '2', material: 'PVC SAL' },
};
export const ORDEN_REDES: Red[] = ['fria', 'caliente', 'desague', 'ventilacion'];
export const esAgua = (r: Red) => r === 'fria' || r === 'caliente';
/** Pendiente por defecto (%) del desagüe según el diámetro. */
export const pendienteDefecto = (d: string) => d === '4' ? 1 : d === '3' ? 1.5 : 2;
/** Pendiente mínima (%) según IS.010: 1 % para 4" o más; 1.5 % para menores. */
export const pendienteMinima = (d: string) => (parseFloat(d) >= 4 ? 1 : 1.5);
export const pulg = (d: string) => `${d.replace('1/2', '½').replace('3/4', '¾')}"`;

export type TipoAparato =
  | 'inodoro' | 'lavatorio' | 'ducha' | 'tina' | 'lavadero_cocina' | 'lavadero_ropa' | 'lavadora' | 'terma' | 'urinario'
  | 'sumidero' | 'registro' | 'caja_registro' | 'medidor' | 'tanque' | 'grifo_jardin';

export interface DefAparato {
  id: TipoAparato; nombre: string; corto: string;
  w: number; d: number;             // tamaño en planta (m)
  fria?: string; caliente?: string; desague?: string; // diámetros de conexión (IS.010)
  trampa?: boolean;
  fuente?: 'fria' | 'caliente';     // de aquí sale el agua (medidor, tanque, terma)
  colector?: boolean;               // aquí llega el desagüe (caja de registro)
  muro?: boolean;                   // se conecta por la pared (espalda)
  ug: number; ud: number;           // unidades de gasto / de descarga (aprox.)
  hAgua: number; hDes: number;      // altura de la salida de agua y del desagüe (m)
  clave?: string;                   // aparato en el catálogo (opcional en el presupuesto)
  sanitario?: boolean;              // se cobra su instalación
  grupo: 'Aparatos' | 'Desagüe' | 'Agua';
}
export const APARATOS: DefAparato[] = [
  { id: 'inodoro', nombre: 'Inodoro', corto: 'Inodoro', w: 0.4, d: 0.7, fria: '1/2', desague: '4', ug: 3, ud: 4, hAgua: 0.2, hDes: 0, clave: 'gas:ap:inodoro', sanitario: true, grupo: 'Aparatos' },
  { id: 'lavatorio', nombre: 'Lavatorio', corto: 'Lavatorio', w: 0.55, d: 0.45, fria: '1/2', caliente: '1/2', desague: '2', trampa: true, muro: true, ug: 1, ud: 2, hAgua: 0.55, hDes: 0.5, clave: 'gas:ap:lavatorio', sanitario: true, grupo: 'Aparatos' },
  { id: 'ducha', nombre: 'Ducha', corto: 'Ducha', w: 0.8, d: 0.8, fria: '1/2', caliente: '1/2', desague: '2', trampa: true, ug: 2, ud: 3, hAgua: 1.1, hDes: 0, clave: 'gas:ap:ducha', sanitario: true, grupo: 'Aparatos' },
  { id: 'tina', nombre: 'Tina', corto: 'Tina', w: 1.5, d: 0.7, fria: '1/2', caliente: '1/2', desague: '2', trampa: true, ug: 2, ud: 3, hAgua: 0.6, hDes: 0, clave: 'gas:ap:tina', sanitario: true, grupo: 'Aparatos' },
  { id: 'lavadero_cocina', nombre: 'Lavadero de cocina', corto: 'Lav. cocina', w: 0.8, d: 0.5, fria: '1/2', caliente: '1/2', desague: '2', trampa: true, muro: true, ug: 3, ud: 3, hAgua: 0.6, hDes: 0.5, clave: 'gas:ap:lavadero_cocina', sanitario: true, grupo: 'Aparatos' },
  { id: 'lavadero_ropa', nombre: 'Lavadero de ropa', corto: 'Lav. ropa', w: 0.6, d: 0.55, fria: '1/2', caliente: '1/2', desague: '2', trampa: true, muro: true, ug: 3, ud: 3, hAgua: 0.7, hDes: 0.5, clave: 'gas:ap:lavadero_ropa', sanitario: true, grupo: 'Aparatos' },
  { id: 'lavadora', nombre: 'Lavadora', corto: 'Lavadora', w: 0.6, d: 0.6, fria: '1/2', desague: '2', trampa: true, muro: true, ug: 3, ud: 3, hAgua: 1.0, hDes: 0.9, clave: 'gas:ap:lavadora', sanitario: false, grupo: 'Aparatos' },
  { id: 'terma', nombre: 'Terma (calentador)', corto: 'Terma', w: 0.45, d: 0.45, fria: '1/2', fuente: 'caliente', muro: true, ug: 2, ud: 0, hAgua: 1.4, hDes: 0, clave: 'gas:ap:terma', sanitario: true, grupo: 'Aparatos' },
  { id: 'urinario', nombre: 'Urinario', corto: 'Urinario', w: 0.35, d: 0.35, fria: '1/2', desague: '2', trampa: true, muro: true, ug: 3, ud: 4, hAgua: 1.1, hDes: 0.55, clave: 'gas:ap:urinario', sanitario: true, grupo: 'Aparatos' },
  { id: 'sumidero', nombre: 'Sumidero', corto: 'Sumidero', w: 0.16, d: 0.16, desague: '2', trampa: true, ug: 0, ud: 2, hAgua: 0, hDes: 0, grupo: 'Desagüe' },
  { id: 'registro', nombre: 'Registro roscado', corto: 'Registro', w: 0.16, d: 0.16, desague: '4', ug: 0, ud: 0, hAgua: 0, hDes: 0, grupo: 'Desagüe' },
  { id: 'caja_registro', nombre: 'Caja de registro 12" × 24"', corto: 'Caja reg.', w: 0.3, d: 0.6, colector: true, ug: 0, ud: 0, hAgua: 0, hDes: 0, grupo: 'Desagüe' },
  { id: 'medidor', nombre: 'Medidor de agua', corto: 'Medidor', w: 0.3, d: 0.45, fuente: 'fria', ug: 0, ud: 0, hAgua: 0, hDes: 0, grupo: 'Agua' },
  { id: 'tanque', nombre: 'Tanque / cisterna', corto: 'Tanque', w: 1.1, d: 1.1, fuente: 'fria', ug: 0, ud: 0, hAgua: 0.1, hDes: 0, clave: 'gas:ap:tanque', grupo: 'Agua' },
  { id: 'grifo_jardin', nombre: 'Punto de jardín', corto: 'Jardín', w: 0.16, d: 0.16, fria: '1/2', muro: true, ug: 2, ud: 0, hAgua: 0.5, hDes: 0, clave: 'gas:ap:grifo_jardin', grupo: 'Agua' },
];
const MAPA = new Map(APARATOS.map(a => [a.id, a]));
export const defAparato = (t: TipoAparato) => MAPA.get(t) || APARATOS[0];

export interface Aparato { id: string; tipo: TipoAparato; x: number; y: number; rot: number; nombre?: string }
export interface Tramo { id: string; red: Red; diam: string; pts: Pt[]; pendiente?: number; llave?: boolean; auto?: boolean }
export interface VanoRef { t: number; w: number; puerta: boolean }
export interface MuroRef { x1: number; y1: number; x2: number; y2: number; a: number; vanos?: VanoRef[] }
export interface FondoGas { tipo: 'ninguno' | 'ambiente' | 'obra'; ancho: number; largo: number; nivel?: string; muros: MuroRef[] }

export interface CotizacionGas {
  id: string; nombre: string; cliente: string;
  aparatos: Aparato[]; tramos: Tramo[]; fondo: FondoGas;
  gg: number; util: number; merma: number;       // %
  incluirAparatos: boolean;                       // suma los aparatos sanitarios al presupuesto
  instalarAparatos: boolean;                      // cobra la instalación de cada aparato
  pruebaHidraulica: boolean;
  modoMO: 'puntos' | 'jornal';
  actualizado?: string;
}
export const KEY_COT_ACTUAL = 'gasfiteria_cotizacion_actual';
export const KEY_COT_LISTA = 'gasfiteria_cotizaciones';
export const KEY_PESTANA = 'gasfiteria_pestana';

export const uid = () => Math.random().toString(36).slice(2, 10);
export const murosAmbiente = (w: number, l: number): MuroRef[] => [
  { x1: 0, y1: 0, x2: w, y2: 0, a: 0.15 }, { x1: w, y1: 0, x2: w, y2: l, a: 0.15 },
  { x1: w, y1: l, x2: 0, y2: l, a: 0.15 }, { x1: 0, y1: l, x2: 0, y2: 0, a: 0.15 },
];
export const cotizacionVacia = (): CotizacionGas => ({
  id: uid(), nombre: '', cliente: '', aparatos: [], tramos: [],
  fondo: { tipo: 'ambiente', ancho: 4, largo: 3, muros: murosAmbiente(4, 3) },
  gg: 10, util: 20, merma: 10, incluirAparatos: false, instalarAparatos: true, pruebaHidraulica: true, modoMO: 'puntos',
});
export const leerCotizacionActual = (): CotizacionGas => {
  const c = { ...cotizacionVacia(), ...(safeStorage.getItem<CotizacionGas | null>(KEY_COT_ACTUAL, null) || {}) };
  return { ...c, aparatos: Array.isArray(c.aparatos) ? c.aparatos : [], tramos: Array.isArray(c.tramos) ? c.tramos : [], fondo: c.fondo?.muros ? c.fondo : cotizacionVacia().fondo };
};
export const leerCotizaciones = (): CotizacionGas[] => safeStorage.getItem<CotizacionGas[]>(KEY_COT_LISTA, []) || [];

// ── Geometría de conexiones ──────────────────────────────────────────────────
export const rotar = (lx: number, ly: number, rot: number): Pt => {
  const r = (rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return { x: lx * c - ly * s, y: lx * s + ly * c };
};
/** Redes que pide el aparato (las que deben llegarle o salir de él). */
export function redesDe(t: TipoAparato): Red[] {
  const d = defAparato(t), out: Red[] = [];
  if (d.fria || d.fuente === 'fria') out.push('fria');
  if (d.caliente || d.fuente === 'caliente') out.push('caliente');
  if (d.desague || d.colector) out.push('desague');
  return out;
}
/** Punto (en planta) donde se conecta la red al aparato. */
export function conexion(a: Aparato, red: Red): Pt {
  const d = defAparato(a.tipo);
  let lx = 0, ly = 0;
  if (esAgua(red)) {
    const dos = !!d.caliente || a.tipo === 'terma';
    lx = dos ? (red === 'fria' ? -0.07 : 0.07) : 0;
    ly = d.fuente === 'fria' ? 0 : -d.d / 2 + (dos && red === 'caliente' ? 0.13 : 0.05);
  } else if (a.tipo === 'inodoro') ly = -d.d / 2 + 0.27;
  else if (a.tipo === 'tina') lx = -d.w / 2 + 0.15;
  else if (d.muro) ly = -d.d / 2 + 0.06;
  const p = rotar(lx, ly, a.rot);
  return { x: Math.round((a.x + p.x) * 1000) / 1000, y: Math.round((a.y + p.y) * 1000) / 1000 };
}
export const nombreAparato = (a: Aparato, lista: Aparato[]) => {
  if (a.nombre) return a.nombre;
  const mismos = lista.filter(x => x.tipo === a.tipo);
  const d = defAparato(a.tipo);
  return mismos.length > 1 ? `${d.corto} ${mismos.indexOf(a) + 1}` : d.corto;
};

// ── Fondo desde el plano de Obra Civil ───────────────────────────────────────
interface ElemObra { tipo: string; x1: number; y1: number; x2?: number; y2?: number; a: number; nivel?: string; aberturas?: { t: number; w: number; tipo: string; sill?: number }[] }
export function pisosObra(): string[] {
  const niv = safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Piso 1'];
  return niv.filter(n => !/cimentaci/i.test(n));
}
export function murosDeObra(nivel?: string): MuroRef[] {
  const elems = safeStorage.getItem<ElemObra[]>('concreto_plano_elems', []) || [];
  const pisos = pisosObra();
  const n = nivel || pisos[0];
  return elems.filter(e => e.tipo === 'muro' && e.x2 !== undefined && e.y2 !== undefined && (e.nivel || pisos[0]) === n)
    .map(e => ({ x1: e.x1, y1: e.y1, x2: e.x2!, y2: e.y2!, a: e.a || 0.15, vanos: (e.aberturas || []).map(v => ({ t: v.t, w: v.w, puerta: !(v.sill && v.sill > 0.05) && !/ventana/i.test(v.tipo) })) }));
}
/** Caja que encierra muros y aparatos (para encuadrar el plano y el 3D). */
export function limites(cot: { aparatos: Aparato[]; tramos: Tramo[]; fondo: FondoGas }) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  cot.fondo.muros.forEach(m => { add(m.x1, m.y1); add(m.x2, m.y2); });
  cot.aparatos.forEach(a => { const d = defAparato(a.tipo); const r = Math.max(d.w, d.d) / 2; add(a.x - r, a.y - r); add(a.x + r, a.y + r); });
  cot.tramos.forEach(t => t.pts.forEach(p => add(p.x, p.y)));
  if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 4; y1 = 3; }
  return { x0, y0, x1, y1 };
}

// ── Ejemplo: baño completo + cocina + lavandería ──────────────────────────────
export function cotizacionEjemplo(): CotizacionGas {
  const c = cotizacionVacia();
  const W = 7.5, L = 5;
  const muros: MuroRef[] = [
    ...murosAmbiente(W, L),
    { x1: 2.6, y1: 0, x2: 2.6, y2: L, a: 0.15, vanos: [{ t: 1.75, w: 0.8, puerta: true }, { t: 3.8, w: 0.8, puerta: true }] },
    { x1: 0, y1: 2.4, x2: 2.6, y2: 2.4, a: 0.15 },
  ];
  muros[0].vanos = [{ t: 5.0, w: 1.2, puerta: false }];
  muros[1].vanos = [{ t: 3.9, w: 0.9, puerta: true }];
  const ap = (tipo: TipoAparato, x: number, y: number, rot = 0, nombre?: string): Aparato => ({ id: uid(), tipo, x, y, rot, nombre });
  return {
    ...c,
    nombre: 'Casa – baño, cocina y lavandería', cliente: 'Sra. Rosa Quispe',
    fondo: { tipo: 'ambiente', ancho: W, largo: L, muros },
    aparatos: [
      ap('inodoro', 0.45, 0.43, 0), ap('lavatorio', 1.25, 0.3, 0), ap('ducha', 2.1, 0.55, 0),
      ap('sumidero', 1.3, 1.55, 0, 'Sumidero baño'),
      ap('lavadero_cocina', 5.0, 0.32, 0),
      ap('lavadero_ropa', 0.45, 4.62, 180), ap('lavadora', 1.2, 4.62, 180), ap('terma', 2.2, 4.7, 180),
      ap('sumidero', 1.55, 3.55, 0, 'Sumidero lavandería'),
      ap('caja_registro', 0.45, 3.25, 0),
      ap('medidor', 8.1, 4.3, 90),
    ],
  };
}
