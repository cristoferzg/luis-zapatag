// Diseños de CarpiMetal (puertas, ventanas, rejas, portones…) usados en Obra
// Civil: una abertura del muro puede enlazarse a un diseño guardado; toma su
// ancho/alto y su costo (calculado con el Catálogo de precios).
import { safeStorage } from '../../lib/storageManager';
import type { HerreriaDesign } from '../herreria/herreriaTypes';
import { generarDespiece, generarMaterialesAgrupados, calcularCostosDesglosados } from '../herreria/herreriaCalculations';
import type { TipoAbertura } from './geometriaObra';

export function leerDisenosCarpi(): HerreriaDesign[] {
  const guardados = safeStorage.getItem<HerreriaDesign[]>('innova_herreria_saved_designs', []) || [];
  const actual = safeStorage.getItem<HerreriaDesign | null>('innova_herreria_current_design', null);
  const lista = [...guardados];
  if (actual && actual.id && !lista.some(d => d.id === actual.id)) lista.push(actual);
  return lista.filter(d => d && d.anchoM > 0 && d.altoM > 0);
}

// Precio de venta del diseño (materiales con el catálogo + mano de obra, GG y utilidad de CarpiMetal).
export function costoDisenoCarpi(d: HerreriaDesign): number {
  try {
    const despiece = generarDespiece(d);
    const mat = generarMaterialesAgrupados(d, despiece);
    return calcularCostosDesglosados(d, mat).precioTotalVenta || 0;
  } catch {
    return 0;
  }
}

export function tipoAberturaDe(d: HerreriaDesign): TipoAbertura {
  switch (d.tipoElemento) {
    case 'puerta': return (d.numHojas || 1) > 1 ? 'puerta_doble' : 'puerta';
    case 'porton': return 'porton';
    case 'ventana': case 'reja': return 'ventana';
    case 'mampara': return 'mampara';
    default: return 'vano';
  }
}

export const NOMBRE_TIPO_CARPI: Partial<Record<string, string>> = {
  puerta: 'Puerta', porton: 'Portón', reja: 'Reja', ventana: 'Ventana', mampara: 'Mampara', cerco: 'Cerco', baranda: 'Baranda', cerramiento: 'Cerramiento',
};
