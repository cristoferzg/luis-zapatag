// Notificaciones del sistema (las que salen en la barra del teléfono o en la esquina
// de Windows): en la app de Android con el plugin nativo de Capacitor; en el programa
// de Windows y en el navegador con la API de notificaciones del sistema.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { safeStorage } from './storageManager';
import { pushActivo } from './pushNativo';

const esNativo = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };
const K_ACTIVAS = 'innova_notif_activas';

export function notificacionesDisponibles(): boolean {
  return esNativo() || (typeof window !== 'undefined' && 'Notification' in window);
}

/** ¿Ya dio permiso? */
export async function notificacionesPermitidas(): Promise<boolean> {
  try {
    if (esNativo()) return (await LocalNotifications.checkPermissions()).display === 'granted';
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  } catch { return false; }
}

/** Pide permiso (muestra el aviso del sistema). Devuelve si quedaron activas. */
export async function activarNotificaciones(): Promise<boolean> {
  try {
    let ok = false;
    if (esNativo()) ok = (await LocalNotifications.requestPermissions()).display === 'granted';
    else if (typeof Notification !== 'undefined') ok = (await Notification.requestPermission()) === 'granted';
    safeStorage.setItem(K_ACTIVAS, ok);
    if (ok) { try { window.dispatchEvent(new CustomEvent('innova_notif_activadas')); } catch { /* nada */ } }
    return ok;
  } catch { return false; }
}

let siguienteId = Math.floor(Date.now() / 1000) % 100000;

// Con avisos push activos, lo que llegó mientras la app estaba cerrada o en segundo plano
// ya lo mostró el sistema: al volver a abrirla no se repite (se espera a que lleve un rato
// visible antes de avisar por cuenta propia).
let visibleDesde = Date.now();
try { document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') visibleDesde = Date.now(); }); } catch { /* sin documento */ }
const repetiriaPush = () => esNativo() && pushActivo() && (document.visibilityState !== 'visible' || Date.now() - visibleDesde < 15000);

/** Muestra una notificación del sistema (si hay permiso). No hace nada si no lo hay. */
export async function notificar(titulo: string, cuerpo: string): Promise<void> {
  try {
    if (!(await notificacionesPermitidas())) return;
    if (repetiriaPush()) return;
    if (esNativo()) {
      await LocalNotifications.schedule({ notifications: [{ id: ++siguienteId, title: titulo, body: cuerpo, smallIcon: 'ic_stat_innova', largeIcon: 'ic_innova_grande', iconColor: '#f97316' }] });
      return;
    }
    const n = new Notification(titulo, { body: cuerpo, icon: '/pwa-192x192.png', badge: '/favicon-64.png', tag: `innova_${siguienteId++}` });
    // En el programa de PC la ventana puede estar oculta en la bandeja: se pide mostrarla.
    n.onclick = () => { try { (window as any).innovaPC?.mostrar?.(); window.focus(); n.close(); } catch { /* nada */ } };
  } catch { /* sin soporte: se ignora */ }
}

const K_PREGUNTADO = 'innova_notif_preguntado';
/** ¿Hay que mostrar la invitación de la primera vez? (una sola vez por equipo) */
export async function debeInvitar(): Promise<boolean> {
  if (!notificacionesDisponibles() || safeStorage.getItem<boolean>(K_PREGUNTADO, false)) return false;
  if (await notificacionesPermitidas()) { safeStorage.setItem(K_PREGUNTADO, true); return false; }
  return true;
}
export function marcarInvitado(): void { safeStorage.setItem(K_PREGUNTADO, true); }
