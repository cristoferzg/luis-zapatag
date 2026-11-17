// Estadísticas de contenido (solo las ve el admin): cuántas veces se ve cada clase de
// Academia y cuántas veces se abre o descarga cada recurso, y qué usuarios lo hicieron.
// Las visitas del admin no se cuentan.
import { db } from './firebase';
import { collection, doc, getDocs, increment, setDoc } from 'firebase/firestore';

export type TipoContenido = 'video' | 'recurso';
export type AccionContenido = 'vista' | 'apertura' | 'descarga';

export interface EstadisticaContenido {
  id: string; tipo: TipoContenido; itemId: string; nombre: string; grupo?: string;
  vista?: number; apertura?: number; descarga?: number;
  usuarios?: Record<string, { nombre: string; veces: number; ultima: string }>;
  ultima?: string;
}

const yaContado = new Set<string>(); // no contar dos veces lo mismo en la misma sesión

export function registrarContenido(tipo: TipoContenido, itemId: string, accion: AccionContenido,
  usuario: { id?: string; name?: string } | null | undefined, nombre: string, grupo?: string) {
  if (!usuario?.id || !itemId) return;
  const clave = `${tipo}_${itemId}_${accion}_${usuario.id}`;
  if (accion !== 'descarga' && yaContado.has(clave)) return;
  yaContado.add(clave);
  const ahora = new Date().toISOString();
  setDoc(doc(db, 'estadisticas_contenido', `${tipo}_${itemId}`), {
    tipo, itemId, nombre: nombre || itemId, ...(grupo ? { grupo } : {}), ultima: ahora,
    [accion]: increment(1),
    usuarios: { [usuario.id]: { nombre: usuario.name || usuario.id, veces: increment(1), ultima: ahora } },
  }, { merge: true }).catch(() => { /* sin red: no es crítico */ });
}

export async function leerEstadisticas(): Promise<EstadisticaContenido[]> {
  const snap = await getDocs(collection(db, 'estadisticas_contenido'));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}
