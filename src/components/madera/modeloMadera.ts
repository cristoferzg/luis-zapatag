// =============================================================================
// Carpintería de madera: tipos de trabajo, ítem, cotización guardada (`madera_…`)
// y el ejemplo. Medidas en metros (espesor de tableros en mm).
// =============================================================================
import { DoorClosed, DoorOpen, Frame, Archive, LayoutGrid, Rows3, PanelTop, Footprints } from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import type { Madera, MaderaSolida } from '../../catalogo/madera';
import { uid, CotBase } from '../carpinteria/comun/comun';

export type TipoMadera = 'puerta_contraplacada' | 'puerta_apanelada' | 'marco' | 'closet' | 'mueble' | 'piso' | 'cielo' | 'escalera';
export type Acabado = 'laca' | 'tinte' | 'barniz' | 'duco' | 'ninguno';
export type Chapa = 'ninguna' | 'perilla' | 'dos_golpes' | 'manija' | 'closet';

export interface ItemMadera {
  id: string; tipo: TipoMadera; nombre: string;
  ancho: number; alto: number; prof: number; cantidad: number;
  madera: Madera; espesor: number;          // espesor del tablero (mm) si la madera es tablero
  acabado: Acabado;
  marco: boolean; maderaMarco: MaderaSolida; // marco y contramarco (puertas)
  hojas: number; paneles: number; repisas: number; filasCajones: number; colgador: boolean;
  bisagras: number; chapa: Chapa; tirador: boolean; lado: 'izq' | 'der';
}

export interface DefTipo {
  id: TipoMadera; nombre: string; corto: string; descripcion: string; icon: any;
  maderas: Madera[]; chapas: Chapa[]; etiquetas: { ancho: string; alto: string }; base: Partial<ItemMadera>;
}
export const ACABADOS: [Acabado, string][] = [['laca', 'Laca transparente'], ['tinte', 'Tinte y laca'], ['barniz', 'Barniz marino'], ['duco', 'Pintura al duco'], ['ninguno', 'Sin acabado']];
export const CHAPAS: Record<Chapa, string> = { ninguna: 'Sin cerradura', perilla: 'Perilla (pomo)', dos_golpes: 'Sobreponer 2 golpes', manija: 'Embutir con manija', closet: 'Chapa de mueble' };

export const TIPOS_MADERA: DefTipo[] = [
  { id: 'puerta_contraplacada', nombre: 'Puerta contraplacada', corto: 'Contraplacada', descripcion: 'MDF o triplay sobre bastidor de pino', icon: DoorClosed,
    maderas: ['mdf', 'triplay'], chapas: ['ninguna', 'perilla', 'manija'], etiquetas: { ancho: 'Ancho hoja', alto: 'Alto hoja' },
    base: { ancho: 0.8, alto: 2.1, madera: 'mdf', espesor: 5.5, acabado: 'duco', marco: true, maderaMarco: 'tornillo', bisagras: 3, chapa: 'perilla' } },
  { id: 'puerta_apanelada', nombre: 'Puerta apanelada', corto: 'Apanelada', descripcion: 'De tableros en cedro, tornillo o pino', icon: DoorOpen,
    maderas: ['cedro', 'tornillo', 'pino'], chapas: ['ninguna', 'perilla', 'dos_golpes', 'manija'], etiquetas: { ancho: 'Ancho hoja', alto: 'Alto hoja' },
    base: { ancho: 0.9, alto: 2.1, madera: 'cedro', acabado: 'tinte', marco: true, maderaMarco: 'cedro', paneles: 4, bisagras: 4, chapa: 'dos_golpes' } },
  { id: 'marco', nombre: 'Marco y contramarco', corto: 'Marco', descripcion: 'Jambas, cabezal y contramarcos', icon: Frame,
    maderas: ['tornillo', 'cedro', 'pino'], chapas: ['ninguna'], etiquetas: { ancho: 'Ancho vano', alto: 'Alto vano' },
    base: { ancho: 0.8, alto: 2.1, madera: 'tornillo', acabado: 'laca' } },
  { id: 'closet', nombre: 'Closet / ropero', corto: 'Closet', descripcion: 'Casco, puertas, repisas, cajones y barra', icon: Archive,
    maderas: ['triplay', 'mdf', 'osb', 'cedro', 'tornillo', 'pino'], chapas: ['ninguna', 'closet'], etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 2.4, alto: 2.4, prof: 0.6, madera: 'triplay', espesor: 18, acabado: 'laca', hojas: 4, repisas: 4, filasCajones: 1, colgador: true, bisagras: 4, tirador: true } },
  { id: 'mueble', nombre: 'Mueble a medida', corto: 'Mueble', descripcion: 'Repostero, mueble de TV, estante', icon: LayoutGrid,
    maderas: ['mdf', 'triplay', 'osb', 'cedro', 'tornillo', 'pino'], chapas: ['ninguna', 'closet'], etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 1.8, alto: 0.9, prof: 0.45, madera: 'mdf', espesor: 18, acabado: 'duco', hojas: 2, repisas: 1, filasCajones: 1, colgador: false, bisagras: 2, tirador: true } },
  { id: 'piso', nombre: 'Piso de madera', corto: 'Piso', descripcion: 'Machihembrado sobre durmientes', icon: Rows3,
    maderas: ['tornillo', 'cedro', 'pino', 'osb', 'triplay'], chapas: ['ninguna'], etiquetas: { ancho: 'Ancho', alto: 'Largo' },
    base: { ancho: 4, alto: 3.5, madera: 'tornillo', espesor: 18, acabado: 'barniz' } },
  { id: 'cielo', nombre: 'Cielo / revestimiento', corto: 'Cielo', descripcion: 'Machihembrado o tablero sobre listones', icon: PanelTop,
    maderas: ['pino', 'tornillo', 'cedro', 'triplay', 'mdf'], chapas: ['ninguna'], etiquetas: { ancho: 'Ancho', alto: 'Largo' },
    base: { ancho: 4, alto: 3, madera: 'pino', espesor: 6, acabado: 'laca' } },
  { id: 'escalera', nombre: 'Escalera de madera', corto: 'Escalera', descripcion: 'Zancas, pasos, contrapasos y baranda', icon: Footprints,
    maderas: ['tornillo', 'cedro', 'pino'], chapas: ['ninguna'], etiquetas: { ancho: 'Ancho de paso', alto: 'Altura a salvar' },
    base: { ancho: 0.9, alto: 2.7, madera: 'tornillo', acabado: 'barniz' } },
];
export const tipoMadera = (t: TipoMadera) => TIPOS_MADERA.find(x => x.id === t) || TIPOS_MADERA[0];

export function itemNuevo(t: TipoMadera, extra: Partial<ItemMadera> = {}): ItemMadera {
  const d = tipoMadera(t);
  return {
    id: uid(), tipo: t, nombre: '', ancho: 1, alto: 2, prof: 0.6, cantidad: 1, madera: d.maderas[0], espesor: 18, acabado: 'laca',
    marco: false, maderaMarco: 'tornillo', hojas: 2, paneles: 4, repisas: 2, filasCajones: 0, colgador: false, bisagras: 3, chapa: 'ninguna', tirador: false, lado: 'der',
    ...d.base, ...extra,
  };
}
export const nombreItem = (it: ItemMadera, i: number) => it.nombre || `${tipoMadera(it.tipo).nombre} ${i + 1}`;

export interface CotizacionMadera extends CotBase { items: ItemMadera[] }
export const KEY_COT_ACTUAL = 'madera_cotizacion_actual';
export const KEY_COT_LISTA = 'madera_cotizaciones';
export const KEY_PESTANA = 'madera_pestana';
export const cotizacionVacia = (): CotizacionMadera => ({ id: uid(), nombre: '', cliente: '', items: [], gg: 10, util: 20, merma: 15, modoMO: 'unidad' });
export const leerCotizacionActual = (): CotizacionMadera => {
  const c = { ...cotizacionVacia(), ...(safeStorage.getItem<CotizacionMadera | null>(KEY_COT_ACTUAL, null) || {}) };
  return { ...c, items: Array.isArray(c.items) ? c.items.map(i => ({ ...itemNuevo(i.tipo), ...i })) : [] };
};

export function cotizacionEjemplo(): CotizacionMadera {
  return {
    ...cotizacionVacia(), nombre: 'Departamento – carpintería de madera', cliente: 'Sr. Jorge Paredes',
    items: [
      itemNuevo('puerta_contraplacada', { nombre: 'Puertas de dormitorio', cantidad: 2, ancho: 0.8, alto: 2.1, lado: 'der' }),
      itemNuevo('puerta_contraplacada', { nombre: 'Puerta de baño', ancho: 0.7, alto: 2.1, lado: 'izq' }),
      itemNuevo('puerta_apanelada', { nombre: 'Puerta principal', ancho: 0.95, alto: 2.2, madera: 'cedro', paneles: 6, acabado: 'tinte', maderaMarco: 'cedro', chapa: 'dos_golpes', lado: 'izq' }),
      itemNuevo('closet', { nombre: 'Closet dormitorio principal', ancho: 2.4, alto: 2.4, prof: 0.6, hojas: 4, repisas: 4, filasCajones: 1 }),
    ],
  };
}
