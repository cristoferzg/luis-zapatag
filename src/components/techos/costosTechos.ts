// Costos editables de Techos Metálicos: precios de materiales según el
// proveedor del usuario, mano de obra (cuadrilla) y gastos operativos (grúa,
// transporte…). Lo usan el BOM, la Estructura de Costos y el Presupuesto
// Formal, así que un cambio aquí se refleja en todos a la vez.
import { useSyncExternalStore } from 'react';
import { safeStorage } from '../../lib/storageManager';
import { precio, claveJornal, tienePrecioPropio } from '../../lib/catalogoPrecios';

export interface FilaCuadrilla { id: string; cargo: string; cantidad: number; jornal: number; dias: number }
export interface FilaOperativo { id: string; concepto: string; monto: number }

export interface CostosTechos {
  precioPerfil: Record<string, number>;     // S/ por metro, por id de perfil
  precioCobertura: Record<string, number>;  // S/ por m², por id de cobertura
  placaBase?: number;                       // S/ por unidad
  pernoAnclajeCaja?: number;                // S/ por caja de 100
  pernoEpdmCaja?: number;                   // S/ por caja de 100
  soldaduraKg?: number;                     // S/ por kg
  manoObraModo: 'porcentaje' | 'detalle';
  manoObraPct: number;
  cuadrilla: FilaCuadrilla[];
  operativosModo: 'porcentaje' | 'detalle';
  operativosPct: number;
  operativos: FilaOperativo[];
  gastosGeneralesPct: number;
  utilidadPct: number;
  igv: boolean;
}

export const COSTOS_DEFAULT: CostosTechos = {
  precioPerfil: {}, precioCobertura: {},
  manoObraModo: 'porcentaje', manoObraPct: 35,
  cuadrilla: [
    { id: 'c1', cargo: 'Ingeniero residente', cantidad: 1, jornal: 0, dias: 0 },
    { id: 'c2', cargo: 'Maestro de obra', cantidad: 1, jornal: 0, dias: 0 },
    { id: 'c3', cargo: 'Soldador homologado', cantidad: 2, jornal: 0, dias: 0 },
    { id: 'c4', cargo: 'Armador / montajista', cantidad: 1, jornal: 0, dias: 0 },
    { id: 'c5', cargo: 'Ayudante', cantidad: 2, jornal: 0, dias: 0 },
  ],
  operativosModo: 'porcentaje', operativosPct: 12,
  operativos: [
    { id: 'o1', concepto: 'Grúa / maniobra', monto: 0 },
    { id: 'o2', concepto: 'Transporte de material', monto: 0 },
    { id: 'o3', concepto: 'Andamios', monto: 0 },
    { id: 'o4', concepto: 'EPP y seguridad', monto: 0 },
  ],
  gastosGeneralesPct: 15, utilidadPct: 10, igv: false,
};

const KEY = 'techos_costos_usuario';
let actual: CostosTechos = { ...COSTOS_DEFAULT, ...(safeStorage.getItem<Partial<CostosTechos>>(KEY, {}) || {}) };
const oyentes = new Set<() => void>();

export const leerCostosTechos = () => actual;
export function guardarCostosTechos(cambio: Partial<CostosTechos> | ((c: CostosTechos) => Partial<CostosTechos>)) {
  const parcial = typeof cambio === 'function' ? cambio(actual) : cambio;
  actual = { ...actual, ...parcial };
  safeStorage.setItem(KEY, actual);
  oyentes.forEach(f => f());
}
export function useCostosTechos() {
  return useSyncExternalStore(f => { oyentes.add(f); return () => oyentes.delete(f); }, () => actual);
}

// Jornal: el del catálogo único para ese cargo (Catálogo de precios → Mano de obra).
export const jornalDe = (f: FilaCuadrilla) => (tienePrecioPropio(claveJornal(f.cargo)) ? precio(claveJornal(f.cargo)) : f.jornal);
export const totalCuadrilla = (c: CostosTechos) => c.cuadrilla.reduce((s, f) => s + f.cantidad * jornalDe(f) * f.dias, 0);
export const totalOperativos = (c: CostosTechos) => c.operativos.reduce((s, f) => s + f.monto, 0);
