// =============================================================================
// Paquetes de la Academia técnica: varios cursos (y plantillas / recursos) por un único
// precio. Se guardan en config_academia/paquetes { lista } (lo edita solo el admin; lo leen
// los usuarios con sesión, misma regla que config_academia). Al comprar se crea una compra
// pendiente con itemId "paq_<id>"; al validarla, el admin habilita TODO lo que incluye.
// =============================================================================
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface PaqueteAcademia {
  id: string;
  nombre: string;
  descripcion: string;
  cursos: string[];          // ids de cursos
  recursos: string[];        // ids de la biblioteca (plantillas, planos, libros)
  precioSoles: number;
  destacado?: boolean;       // "Más vendido"
  activo: boolean;
  color?: 'ambar' | 'indigo' | 'esmeralda' | 'rosa';
  creado?: string;
}

const REF = () => doc(db, 'config_academia', 'paquetes');
export const ID_COMPRA_PAQUETE = (id: string) => `paq_${id}`;
export const esCompraPaquete = (itemId?: string) => !!itemId?.startsWith('paq_');

export async function leerPaquetes(): Promise<PaqueteAcademia[]> {
  if (import.meta.env.DEV && (window as any).__paquetesSimulados) return (window as any).__paquetesSimulados;
  try { const s = await getDoc(REF()); return ((s.data() as any)?.lista || []) as PaqueteAcademia[]; } catch { return []; }
}
export function escucharPaquetes(cb: (l: PaqueteAcademia[]) => void): () => void {
  if (import.meta.env.DEV && (window as any).__paquetesSimulados) { cb((window as any).__paquetesSimulados); return () => {}; }
  try { return onSnapshot(REF(), s => cb(((s.data() as any)?.lista || []) as PaqueteAcademia[]), () => cb([])); } catch { cb([]); return () => {}; }
}
export async function guardarPaquetes(lista: PaqueteAcademia[]): Promise<void> {
  if (import.meta.env.DEV && (window as any).__paquetesSimulados) { (window as any).__paquetesSimulados = lista; return; }
  await setDoc(REF(), { lista: JSON.parse(JSON.stringify(lista)) });
}
