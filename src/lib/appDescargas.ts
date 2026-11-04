// Enlaces de descarga de la app (Android / PC / iPhone), aviso de versión nueva y
// recordatorios. Todo vive en `config_ia/descargas` (lo lee cualquiera con sesión, solo el
// admin lo cambia: misma regla que config_ia, no hace falta regla nueva).
//
// Cómo se sabe si un equipo está desactualizado: cada compilación lleva su fecha (__BUILD__).
// Cuando el admin pulsa "Avisar a todos que actualicen", se guarda la fecha de la compilación
// que él tiene abierta (la última publicada). Un equipo con una compilación anterior ve el aviso.
// La web y el programa de PC cargan la web publicada (se ponen al día recargando); la app de
// Android trae su código dentro, por eso necesita descargar la versión nueva.
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { db } from './firebase';
import { safeStorage } from './storageManager';

export interface EnlaceApp { url: string; activo: boolean }
export interface ConfigDescargas {
  android?: EnlaceApp;
  pc?: EnlaceApp;
  iphone?: EnlaceApp;
  ultima?: { fecha: string; nota?: string; obligatoria?: boolean; publicadoEl?: string };
  recordatorioDias?: number; // 0 = sin recordatorios
}
export type Plataforma = 'android' | 'ios' | 'pc' | 'web';

const REF = () => doc(db, 'config_ia', 'descargas');
export const BUILD_ACTUAL: string = __BUILD__;

export function escucharDescargas(cb: (c: ConfigDescargas) => void): () => void {
  if (import.meta.env.DEV && (window as any).__descargasSimuladas) { cb((window as any).__descargasSimuladas); return () => {}; }
  return onSnapshot(REF(), s => cb((s.exists() ? s.data() : {}) as ConfigDescargas), () => cb({}));
}
export const guardarDescargas = (c: ConfigDescargas) => setDoc(REF(), JSON.parse(JSON.stringify(c)), { merge: true });

export function plataforma(): Plataforma {
  try {
    if (Capacitor.isNativePlatform()) return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  } catch { /* web */ }
  if (typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)) return 'pc';
  return 'web';
}
export const esCelularWeb = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

/** ¿Este equipo tiene una compilación anterior a la última publicada? (margen de 2 min) */
export function desactualizado(c: ConfigDescargas): boolean {
  const f = c.ultima?.fecha;
  if (!f) return false;
  const pub = new Date(f).getTime(), mia = new Date(BUILD_ACTUAL).getTime();
  return Number.isFinite(pub) && Number.isFinite(mia) && mia < pub - 2 * 60 * 1000;
}

/** Abre un enlace fuera de la app (Play Store, navegador). */
export function abrirEnlace(url: string) {
  try { window.open(url, '_system') || window.open(url, '_blank'); } catch { window.location.href = url; }
}

/** Web y PC: trae la última versión publicada (actualiza el service worker y recarga). */
export async function recargarUltimaVersion() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs || []).map(r => r.update().catch(() => {})));
    const claves = await (window as any).caches?.keys?.();
    await Promise.all((claves || []).map((k: string) => (window as any).caches.delete(k)));
  } catch { /* sin service worker */ }
  window.location.reload();
}

// "Más tarde" en un aviso no obligatorio: no se repite hasta el día siguiente.
const K_POSPUESTO = 'innova_actualizar_pospuesto';
export const avisoPospuesto = (fecha: string) => {
  const p = safeStorage.getItem<{ f: string; hasta: number } | null>(K_POSPUESTO, null);
  return !!p && p.f === fecha && p.hasta > Date.now();
};
export const posponerAviso = (fecha: string) => safeStorage.setItem(K_POSPUESTO, { f: fecha, hasta: Date.now() + 24 * 3600e3 });

// Recordatorio en la web: invita a instalar la app cada N días.
const K_RECORDATORIO = 'innova_recordatorio_app';
export const toca = (dias: number) => dias > 0 && Date.now() - Number(safeStorage.getItem(K_RECORDATORIO, 0)) > dias * 24 * 3600e3;
export const marcarRecordado = () => safeStorage.setItem(K_RECORDATORIO, Date.now());

/** App de Android: deja programada una notificación para dentro de N días (se reprograma
 *  cada vez que se abre la app, así solo llega a quien deja de usarla). */
const ID_RECORDATORIO = 990101;
export async function programarRecordatorioNativo(dias: number, pendienteActualizar: boolean) {
  if (plataforma() !== 'android') return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: ID_RECORDATORIO }] });
    if (!dias || (await LocalNotifications.checkPermissions()).display !== 'granted') return;
    await LocalNotifications.schedule({ notifications: [{
      id: ID_RECORDATORIO,
      title: pendienteActualizar ? 'Hay una versión nueva de InnovApp' : 'InnovApp está en tu celular',
      body: pendienteActualizar ? 'Ábrela y actualiza para recibir las mejoras.' : 'Tus obras, presupuestos y diseños te esperan. Toca para abrir.',
      schedule: { at: new Date(Date.now() + dias * 24 * 3600e3), allowWhileIdle: true },
      smallIcon: 'ic_stat_innova', largeIcon: 'ic_innova_grande', iconColor: '#f97316',
    }] });
  } catch { /* sin permiso o sin plugin */ }
}
