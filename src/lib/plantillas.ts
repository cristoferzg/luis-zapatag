// =============================================================================
// Plantillas prediseñadas: el admin publica su diseño actual de Techos,
// CarpiMetal o Drywall como un recurso; el usuario la abre con "Usar plantilla"
// y se carga una COPIA en su módulo (su diseño anterior queda en "Recuperar").
// =============================================================================
import { safeStorage } from './storageManager';

export type ModuloPlantilla = 'techos' | 'carpimetal' | 'drywall';

export interface Plantilla { modulo: ModuloPlantilla; datos: any }

const CLAVE: Record<ModuloPlantilla, string> = {
  techos: 'innova_techos_escena_actual',
  carpimetal: 'innova_herreria_current_design',
  drywall: 'drywall_cotizacion_actual',
};

const VISTA: Record<ModuloPlantilla, string> = { techos: 'techos', carpimetal: 'herreria', drywall: 'drywall' };

export const NOMBRE_MODULO: Record<ModuloPlantilla, string> = { techos: 'Techos Metálicos', carpimetal: 'CarpiMetal', drywall: 'Drywall' };

/** Diseño que hoy está abierto en el módulo (null si está vacío). */
export function capturarDiseno(modulo: ModuloPlantilla): any | null {
  const d = safeStorage.getItem<any>(CLAVE[modulo], null);
  if (!d) return null;
  const datos = typeof d === 'string' ? JSON.parse(d) : d;
  if (modulo === 'techos' && !Object.keys(datos.nodes || {}).length) return null;
  return datos;
}

/** Tamaño aproximado en KB (Firestore admite hasta ~1 MB por documento). */
export const pesoKB = (datos: any) => Math.round(JSON.stringify(datos ?? null).length / 1024);

/** Carga una copia de la plantilla en el módulo y lo abre. */
export function usarPlantilla(p: Plantilla, nombre: string) {
  const clave = CLAVE[p.modulo];
  // Respaldo del diseño que el usuario tenía abierto.
  const previo = safeStorage.getItem<any>(clave, null);
  if (previo) safeStorage.setItem(`${clave}__antes_de_plantilla`, previo);
  const copia = JSON.parse(JSON.stringify(p.datos));
  const id = `${p.modulo}_${Date.now()}`;
  if (p.modulo === 'carpimetal') { copia.id = id; copia.nombre = nombre; }
  if (p.modulo === 'drywall') { copia.id = id; copia.nombre = nombre; }
  safeStorage.setItem(clave, copia);
  window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: VISTA[p.modulo] }));
}
