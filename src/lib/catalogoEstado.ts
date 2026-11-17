// Estado de precios del usuario (sin los catálogos): el arranque de la app solo necesita esto.
// Antes App importaba catalogoPrecios.ts y con él los catálogos de Carpintería Metálica y Techos
// (≈ 200 KB) en el bloque inicial. catalogoPrecios.ts reexporta todo esto.
import { useSyncExternalStore } from 'react';
import { safeStorage } from './storageManager';
import type { ItemCatalogo } from './catalogoPrecios';

// planchas: coberturas que compras POR PLANCHA → largo de la plancha (m). Sin
// entrada, la cobertura se compra por m². El precio se guarda siempre por m².
// propios: materiales que agrega el usuario (clave 'propio:…').
export interface EstadoCatalogo { precios: Record<string, number>; fechas: Record<string, string>; actualizado: number; planchas?: Record<string, number>; propios?: ItemCatalogo[] }
const KEY = 'innova_catalogo_precios';
export const almacen: { estado: EstadoCatalogo } = {
  estado: safeStorage.getItem<EstadoCatalogo>(KEY, { precios: {}, fechas: {}, actualizado: 0 }) || { precios: {}, fechas: {}, actualizado: 0 },
};
const oyentes = new Set<() => void>();
export const emitir = () => { safeStorage.setItem(KEY, almacen.estado); oyentes.forEach(f => f()); };

export const leerCatalogo = () => almacen.estado;
export function useCatalogo() {
  return useSyncExternalStore(f => { oyentes.add(f); return () => oyentes.delete(f); }, () => almacen.estado);
}
// Llega desde la nube (configuración del usuario): gana el más reciente.
export function hidratarCatalogo(remoto?: EstadoCatalogo | null) {
  if (!remoto || !remoto.precios || (remoto.actualizado || 0) <= almacen.estado.actualizado) return;
  almacen.estado = { precios: { ...remoto.precios }, fechas: { ...(remoto.fechas || {}) }, actualizado: remoto.actualizado, planchas: { ...(remoto.planchas || {}) }, propios: [...(remoto.propios || [])] };
  emitir();
}
