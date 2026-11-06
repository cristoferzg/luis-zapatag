// Bandeja de avisos DENTRO de la app (la campana de arriba). Guarda los comunicados, clases y
// recursos nuevos y los cambios de tickets y asesorías aunque el usuario borre la notificación
// de la barra del celular o de Windows: se quedan aquí hasta que los borre él mismo.
// Se guarda por cuenta en el equipo (máx. 60, los más nuevos primero).
import { useEffect, useState } from 'react';
import { safeStorage } from './storageManager';

export interface AvisoBandeja { id: string; titulo: string; cuerpo: string; vista?: string; fecha: number; leido?: boolean }

const MAX = 60;
const EVENTO = 'innova_bandeja_cambio';
const clave = (uid: string) => 'innova_bandeja_' + uid;

export function leerBandeja(uid?: string): AvisoBandeja[] {
  if (!uid) return [];
  const l = safeStorage.getItem<AvisoBandeja[]>(clave(uid), []);
  return Array.isArray(l) ? l : [];
}
function guardar(uid: string, lista: AvisoBandeja[]) {
  safeStorage.setItem(clave(uid), lista.slice(0, MAX));
  try { window.dispatchEvent(new CustomEvent(EVENTO, { detail: uid })); } catch { /* sin ventana */ }
}

/** Agrega avisos nuevos (si ya existe uno con el mismo id, lo vuelve a poner arriba sin leer). */
export function agregarABandeja(uid: string | undefined, nuevos: Omit<AvisoBandeja, 'fecha' | 'leido'>[]) {
  if (!uid || !nuevos.length) return;
  const ahora = Date.now();
  const ids = new Set(nuevos.map(n => n.id));
  const resto = leerBandeja(uid).filter(a => !ids.has(a.id));
  guardar(uid, [...nuevos.map((n, i) => ({ ...n, fecha: ahora - i, leido: false })), ...resto]);
}
export const marcarLeido = (uid: string, id: string) => guardar(uid, leerBandeja(uid).map(a => a.id === id ? { ...a, leido: true } : a));
export const marcarTodoLeido = (uid: string) => guardar(uid, leerBandeja(uid).map(a => ({ ...a, leido: true })));
export const borrarAviso = (uid: string, id: string) => guardar(uid, leerBandeja(uid).filter(a => a.id !== id));
export const vaciarBandeja = (uid: string) => guardar(uid, []);

export function useBandeja(uid?: string): AvisoBandeja[] {
  const [lista, setLista] = useState<AvisoBandeja[]>(() => leerBandeja(uid));
  useEffect(() => {
    setLista(leerBandeja(uid));
    const f = () => setLista(leerBandeja(uid));
    window.addEventListener(EVENTO, f);
    window.addEventListener('storage', f);
    return () => { window.removeEventListener(EVENTO, f); window.removeEventListener('storage', f); };
  }, [uid]);
  return lista;
}
