// =============================================================================
// Vidrios y aluminio: tipos de trabajo, ítem, cotización guardada (`vidrios_…`)
// y el ejemplo. Medidas en metros (vano terminado).
// =============================================================================
import { Columns2, PanelTop, Square, Columns3, DoorOpen, ShowerHead, Fence, RectangleVertical, Blinds } from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import type { ColorAluminio, TipoVidrio } from '../../catalogo/vidrios';
import { uid, CotBase } from '../carpinteria/comun/comun';

export type TipoVid = 'corrediza' | 'proyectante' | 'fija' | 'mampara' | 'puerta_templada' | 'ducha' | 'baranda' | 'espejo' | 'celosia';
export type Sistema = 's20' | 's25' | 's3825' | 's3831';
export const SISTEMAS: Record<Sistema, string> = { s20: 'Sistema 20', s25: 'Sistema 25', s3825: 'Sistema 3825', s3831: 'Sistema 3831' };

export interface ItemVidrio {
  id: string; tipo: TipoVid; nombre: string;
  ancho: number; alto: number; cantidad: number;
  sistema: Sistema; hojas: number; vidrio: TipoVidrio; color: ColorAluminio;
  chapa: boolean; sujecion: 'piso' | 'pivote'; baranda: 'perfil' | 'pinzas'; ducha: 'corrediza' | 'batiente';
  biselado: boolean; marcoEspejo: boolean; lado: 'izq' | 'der';
}

export interface DefTipoVid {
  id: TipoVid; nombre: string; corto: string; descripcion: string; icon: any;
  vidrios: TipoVidrio[]; sistemas: Sistema[]; hojas: number[]; aluminio: boolean; etiquetas: { ancho: string; alto: string }; base: Partial<ItemVidrio>;
}
const TODOS_CRUDOS: TipoVidrio[] = ['crudo4', 'crudo6', 'laminado6', 'laminado8', 'catedral', 'templado6', 'templado8'];
export const TIPOS_VIDRIO: DefTipoVid[] = [
  { id: 'corrediza', nombre: 'Ventana corrediza', corto: 'Corrediza', descripcion: 'Sistema 20 o 25, de 2 a 4 hojas', icon: Columns2,
    vidrios: TODOS_CRUDOS, sistemas: ['s20', 's25'], hojas: [2, 3, 4], aluminio: true, etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 1.5, alto: 1.2, sistema: 's20', hojas: 2, vidrio: 'crudo6' } },
  { id: 'proyectante', nombre: 'Ventana proyectante', corto: 'Proyectante', descripcion: 'Abre hacia afuera con brazos', icon: PanelTop,
    vidrios: TODOS_CRUDOS, sistemas: [], hojas: [1, 2], aluminio: true, etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 0.6, alto: 0.5, hojas: 1, vidrio: 'catedral' } },
  { id: 'fija', nombre: 'Ventana fija', corto: 'Fija', descripcion: 'Paño fijo con marco y junquillo', icon: Square,
    vidrios: TODOS_CRUDOS, sistemas: [], hojas: [1, 2, 3], aluminio: true, etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 1, alto: 1, hojas: 1, vidrio: 'crudo6' } },
  { id: 'mampara', nombre: 'Mampara corrediza', corto: 'Mampara', descripcion: 'Sistema 3825 / 3831 con chapa', icon: Columns3,
    vidrios: ['templado6', 'templado8', 'laminado6', 'laminado8', 'crudo6'], sistemas: ['s3825', 's3831'], hojas: [2, 3, 4], aluminio: true, etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 2.4, alto: 2.2, sistema: 's3825', hojas: 2, vidrio: 'templado6', chapa: true } },
  { id: 'puerta_templada', nombre: 'Puerta de vidrio templado', corto: 'Puerta templada', descripcion: 'Bisagra de piso o pivotes, jalador', icon: DoorOpen,
    vidrios: ['templado10', 'templado8'], sistemas: [], hojas: [1, 2], aluminio: false, etiquetas: { ancho: 'Ancho vano', alto: 'Alto' },
    base: { ancho: 0.9, alto: 2.1, hojas: 1, vidrio: 'templado10', sujecion: 'piso', chapa: true } },
  { id: 'ducha', nombre: 'Ducha / división de baño', corto: 'Ducha', descripcion: 'Templado 8 mm corredizo o batiente', icon: ShowerHead,
    vidrios: ['templado8', 'templado10', 'templado6'], sistemas: [], hojas: [2, 3], aluminio: true, etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 1.2, alto: 1.9, hojas: 2, vidrio: 'templado8', ducha: 'corrediza' } },
  { id: 'baranda', nombre: 'Baranda de vidrio', corto: 'Baranda', descripcion: 'Perfil base o pinzas con parantes', icon: Fence,
    vidrios: ['templado10', 'laminado8', 'templado8'], sistemas: [], hojas: [], aluminio: true, etiquetas: { ancho: 'Largo', alto: 'Alto' },
    base: { ancho: 3, alto: 1, vidrio: 'templado10', baranda: 'perfil' } },
  { id: 'espejo', nombre: 'Espejo', corto: 'Espejo', descripcion: 'Biselado o pulido, con o sin marco', icon: RectangleVertical,
    vidrios: ['espejo4', 'espejo6'], sistemas: [], hojas: [], aluminio: true, etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 0.8, alto: 0.6, vidrio: 'espejo4', biselado: true, marcoEspejo: false } },
  { id: 'celosia', nombre: 'Celosía de vidrio', corto: 'Celosía', descripcion: 'Lamas que giran (ventilación)', icon: Blinds,
    vidrios: ['catedral', 'crudo4', 'crudo6'], sistemas: [], hojas: [], aluminio: true, etiquetas: { ancho: 'Ancho', alto: 'Alto' },
    base: { ancho: 0.6, alto: 0.6, vidrio: 'catedral' } },
];
export const tipoVid = (t: TipoVid) => TIPOS_VIDRIO.find(x => x.id === t) || TIPOS_VIDRIO[0];

export function itemNuevo(t: TipoVid, extra: Partial<ItemVidrio> = {}): ItemVidrio {
  return {
    id: uid(), tipo: t, nombre: '', ancho: 1, alto: 1, cantidad: 1, sistema: 's20', hojas: 2, vidrio: 'crudo6', color: 'natural',
    chapa: false, sujecion: 'piso', baranda: 'perfil', ducha: 'corrediza', biselado: true, marcoEspejo: false, lado: 'der',
    ...tipoVid(t).base, ...extra,
  };
}
export const nombreItem = (it: ItemVidrio, i: number) => it.nombre || `${tipoVid(it.tipo).nombre} ${i + 1}`;

export interface CotizacionVidrios extends CotBase { items: ItemVidrio[] }
export const KEY_COT_ACTUAL = 'vidrios_cotizacion_actual';
export const KEY_COT_LISTA = 'vidrios_cotizaciones';
export const KEY_PESTANA = 'vidrios_pestana';
export const cotizacionVacia = (): CotizacionVidrios => ({ id: uid(), nombre: '', cliente: '', items: [], gg: 10, util: 20, merma: 10, modoMO: 'unidad' });
export const leerCotizacionActual = (): CotizacionVidrios => {
  const c = { ...cotizacionVacia(), ...(safeStorage.getItem<CotizacionVidrios | null>(KEY_COT_ACTUAL, null) || {}) };
  return { ...c, items: Array.isArray(c.items) ? c.items.map(i => ({ ...itemNuevo(i.tipo), ...i })) : [] };
};

export function cotizacionEjemplo(): CotizacionVidrios {
  return {
    ...cotizacionVacia(), nombre: 'Casa Surco – ventanas y baño', cliente: 'Sra. Carmen Ríos',
    items: [
      itemNuevo('corrediza', { nombre: 'Ventana de sala', ancho: 1.8, alto: 1.4, sistema: 's25', hojas: 4, vidrio: 'crudo6', color: 'negro' }),
      itemNuevo('corrediza', { nombre: 'Ventana de dormitorio', ancho: 1.2, alto: 1.1, sistema: 's20', hojas: 2, vidrio: 'crudo4' }),
      itemNuevo('mampara', { nombre: 'Mampara a la terraza', ancho: 2.4, alto: 2.2, hojas: 2, vidrio: 'templado6', color: 'negro', chapa: true }),
      itemNuevo('ducha', { nombre: 'Ducha del baño principal', ancho: 1.2, alto: 1.9, vidrio: 'templado8', ducha: 'corrediza' }),
      itemNuevo('espejo', { nombre: 'Espejo de baño', ancho: 0.8, alto: 0.7, vidrio: 'espejo4', biselado: true }),
    ],
  };
}
