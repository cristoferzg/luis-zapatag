// Cotización de Melamina (muebles + ambiente) guardada en el navegador, como Drywall.
import { safeStorage } from '../../lib/storageManager';
import type { Mueble } from './calculoMelamina';

export interface ParedMelamina { nombre: string; largo: number; alto: number } // m
export interface CotizacionMelamina {
  id: string;
  nombre: string;
  cliente: string;
  muebles: Mueble[];
  gg: number;               // % gastos generales
  util: number;             // % utilidad
  incluirCorte: boolean;    // servicio de corte del local (por tablero)
  incluirEnchape: boolean;  // servicio de enchape del local (por metro)
  respetarVeta: boolean;    // no girar piezas en el plano de cortes
  paredes: ParedMelamina[];
  actualizado?: string;
}
export const KEY_COT_ACTUAL = 'melamina_cotizacion_actual';
export const KEY_COT_LISTA = 'melamina_cotizaciones';
export const KEY_PESTANA = 'melamina_pestana';

export const paredNueva = (i: number): ParedMelamina => ({ nombre: `Pared ${i + 1}`, largo: 3, alto: 2.5 });
export const cotizacionVacia = (): CotizacionMelamina => ({
  id: Math.random().toString(36).slice(2, 10), nombre: '', cliente: '', muebles: [], gg: 10, util: 20,
  incluirCorte: true, incluirEnchape: true, respetarVeta: false, paredes: [paredNueva(0)],
});
export const leerCotizacionActual = (): CotizacionMelamina => {
  const c = { ...cotizacionVacia(), ...(safeStorage.getItem<CotizacionMelamina | null>(KEY_COT_ACTUAL, null) || {}) };
  return { ...c, muebles: Array.isArray(c.muebles) ? c.muebles : [], paredes: Array.isArray(c.paredes) && c.paredes.length ? c.paredes : [paredNueva(0)] };
};
export const leerCotizaciones = (): CotizacionMelamina[] => safeStorage.getItem<CotizacionMelamina[]>(KEY_COT_LISTA, []) || [];
