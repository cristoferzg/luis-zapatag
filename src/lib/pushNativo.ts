// Avisos push en la app de Android (Firebase Cloud Messaging): llegan aunque la app
// esté cerrada. El celular guarda su token en `push_tokens/<token>` con su espacio de
// trabajo; el servidor (Cloud Functions) envía los avisos. Con la app abierta, el
// sistema no muestra el push y la app avisa por su cuenta (notificaciones locales).
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { onIdTokenChanged } from 'firebase/auth';
import { auth, db } from './firebase';

const esNativo = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };

let tokenActual: string | null = null;
let wsActual = '';
let roleActual = '';
let oyentes = false;

/** ¿Este celular ya recibe avisos push? (la app evita repetirlos con avisos locales) */
export const pushActivo = () => !!tokenActual;
/** Estado para el botón de prueba de Configuración. */
export const estadoPush = () => (import.meta.env.DEV && (window as any).__pushSimulado) ? { nativo: true, token: true, error: '' } : ({ nativo: esNativo(), token: !!tokenActual, error: errorRegistro });
let errorRegistro = '';

// Con la app ABIERTA Android no muestra el push del servidor: App lo pasa a la campana y a una
// notificación local (antes se perdían, por ejemplo los pagos por validar y el chat de soporte).
type AlRecibir = (titulo: string, cuerpo: string, vista?: string) => void;
let alRecibir: AlRecibir | null = null;
export function alRecibirPush(fn: AlRecibir | null) { alRecibir = fn; }

function guardarToken() {
  if (!tokenActual || !wsActual) return;
  setDoc(doc(db, 'push_tokens', tokenActual), {
    ws: wsActual, role: roleActual === 'admin' ? 'admin' : 'usuario',
    plataforma: Capacitor.getPlatform(), actualizado: new Date().toISOString(),
  }).catch(() => { /* sesión limitada o sin red: se reintenta al volver a entrar */ });
}

/** Registra el celular para avisos push (solo si ya dio permiso de notificaciones). */
export async function registrarPush(ws: string, role: string): Promise<void> {
  if (!esNativo() || !ws) return;
  wsActual = ws.replace(/^user_/, ''); roleActual = role;
  try {
    if ((await PushNotifications.checkPermissions()).receive !== 'granted') return;
    await PushNotifications.createChannel({ id: 'avisos', name: 'Avisos de Innova', description: 'Comunicados, tickets, asesorías y contenido nuevo', importance: 4, visibility: 1 }).catch(() => {});
    if (!oyentes) {
      oyentes = true;
      // Si la sesión con PIN se confirma después, volver a guardar el token con permisos.
      try { onIdTokenChanged(auth, u => { if (u) guardarToken(); }); } catch { /* nada */ }
      await PushNotifications.addListener('registration', t => { tokenActual = t.value; guardarToken(); });
      await PushNotifications.addListener('registrationError', e => { tokenActual = null; errorRegistro = String((e as any)?.error || 'no se pudo registrar'); });
      await PushNotifications.addListener('pushNotificationReceived', n => {
        try { alRecibir?.(n.title || 'Innova', n.body || '', (n.data as any)?.vista); } catch { /* nada */ }
      });
      // Al tocar el aviso: abrir la pantalla que corresponde.
      await PushNotifications.addListener('pushNotificationActionPerformed', a => {
        const vista = (a.notification?.data as any)?.vista;
        if (vista) setTimeout(() => { try { window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: vista })); } catch { /* nada */ } }, 600);
      });
    }
    if (tokenActual) guardarToken(); else await PushNotifications.register();
  } catch (e) { errorRegistro = String((e as any)?.message || e || 'sin servicios de Google'); /* quedan solo los avisos con la app abierta */ }
}

/** Al cerrar sesión: este celular deja de recibir los avisos de esa cuenta. */
export async function quitarPush(): Promise<void> {
  if (!esNativo() || !tokenActual) return;
  const t = tokenActual;
  wsActual = '';
  await deleteDoc(doc(db, 'push_tokens', t)).catch(() => {});
}
