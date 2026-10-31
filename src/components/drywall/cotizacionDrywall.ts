// Cotización de Drywall (partidas del cotizador) guardada en el navegador,
// igual que el plano de Obra Civil. La actual se suma a Obra Civil en los pisos
// que el usuario elija en cada partida.
import { safeStorage } from '../../lib/storageManager';
import type { Partida } from './calculoDrywall';

export interface CotizacionDrywall {
  id: string;
  nombre: string;
  cliente: string;
  partidas: Partida[];
  gg: number;             // % gastos generales
  util: number;           // % utilidad
  incluirPlano: boolean;  // sumar lo dibujado en "Plano con Techos"
  actualizado?: string;
}
export const KEY_COT_ACTUAL = 'drywall_cotizacion_actual';
export const KEY_COT_LISTA = 'drywall_cotizaciones';

export const cotizacionVacia = (): CotizacionDrywall => ({ id: Math.random().toString(36).slice(2, 10), nombre: '', cliente: '', partidas: [], gg: 10, util: 15, incluirPlano: false });
export const leerCotizacionActual = (): CotizacionDrywall => ({ ...cotizacionVacia(), ...(safeStorage.getItem<CotizacionDrywall | null>(KEY_COT_ACTUAL, null) || {}) });
export const leerCotizaciones = (): CotizacionDrywall[] => safeStorage.getItem<CotizacionDrywall[]>(KEY_COT_LISTA, []) || [];
