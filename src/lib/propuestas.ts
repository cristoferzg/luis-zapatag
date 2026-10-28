// =============================================================================
// Propuestas publicadas para el cliente (link público). Se guarda una copia de
// la propuesta (opciones, imagen, escena 3D) en `propuestas/<id>`; el cliente
// la abre sin PIN con ?propuesta=<id>, la ve en 3D y la acepta. Solo puede
// cambiar los campos de aceptación (ver firestore.rules).
// =============================================================================
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth, authReady } from './firebase';
import { safeStorage } from './storageManager';

export interface PropuestaPublica {
  empresa: { nombre: string; telefono: string; ruc: string; logo: string; color: string };
  proyecto: string; cliente: string; ubicacion: string;
  opciones: { nombre: string; cobertura: string; nota: string; total: number; recomendada: boolean }[];
  imagen: string; antes: string;
  carta?: string;
  escena: { nodes: any; segments: any; coverageZones: any };
  incluye: string[];
  estado?: 'enviada' | 'aceptada';
  aceptadaOpcion?: number; aceptadaNombre?: string; aceptadaEn?: string;
  creadaEn?: string; autor?: string;
}

const K_MIAS = 'innova_propuestas_enviadas';
export const propuestasEnviadas = () => safeStorage.getItem<{ id: string; proyecto: string; cliente: string; fecha: string }[]>(K_MIAS, []) || [];

export async function publicarPropuesta(p: PropuestaPublica): Promise<string> {
  if (import.meta.env.DEV && (window as any).__publicarSimulado) { (window as any).__propuestaPublicada = p; return 'demo'; }
  await authReady;
  const datos = { ...p, estado: 'enviada', creadaEn: new Date().toISOString(), autor: auth.currentUser?.uid || '' };
  const tam = new Blob([JSON.stringify(datos)]).size;
  if (tam > 950_000) {
    // Firestore admite ~1 MB por documento: se quita la foto "antes" y, si aún no entra, la escena.
    datos.antes = '';
    if (new Blob([JSON.stringify(datos)]).size > 950_000) datos.escena = { nodes: {}, segments: {}, coverageZones: {} };
    if (new Blob([JSON.stringify(datos)]).size > 950_000) throw new Error('La propuesta es demasiado grande para el link (quita la foto real o usa una imagen más pequeña).');
  }
  const ref = await addDoc(collection(db, 'propuestas'), JSON.parse(JSON.stringify(datos)));
  safeStorage.setItem(K_MIAS, [{ id: ref.id, proyecto: p.proyecto, cliente: p.cliente, fecha: datos.creadaEn }, ...propuestasEnviadas()].slice(0, 30));
  return ref.id;
}

// En desarrollo (capturas de prueba) se puede simular sin tocar la base de datos.
const simulada = () => (import.meta.env.DEV ? (window as any).__propuestaSimulada as PropuestaPublica | undefined : undefined);

export async function leerPropuesta(id: string): Promise<PropuestaPublica | null> {
  if (simulada()) return simulada()!;
  await authReady;
  const s = await getDoc(doc(db, 'propuestas', id));
  return s.exists() ? (s.data() as PropuestaPublica) : null;
}

export async function aceptarPropuesta(id: string, opcion: number, nombre: string) {
  if (simulada()) return;
  await authReady;
  await updateDoc(doc(db, 'propuestas', id), { estado: 'aceptada', aceptadaOpcion: opcion, aceptadaNombre: nombre.slice(0, 120), aceptadaEn: new Date().toISOString() });
}
