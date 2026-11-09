// Pago en línea (web y programa de PC) con Mercado Pago: Yape, tarjeta o transferencia.
// La app de Android NO lo usa (allí se paga con Google Play). Se enciende sin recompilar
// con config_ia/planes.pagoEnLinea; la función crearPagoEnLinea devuelve la página de pago
// y el webhook del servidor carga los créditos apenas Mercado Pago confirma.
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';
import { esAppAndroid } from './plataforma';

let _activo = false;
export const fijarPagoEnLinea = (v: boolean) => { _activo = v; };
/** ¿Se ofrece el pago en línea aquí? (nunca dentro de la app de Android). */
export function pagoEnLineaDisponible(): boolean {
  if (import.meta.env.DEV && (window as any).__pagoEnLineaSimulado) return !esAppAndroid();
  return _activo && !esAppAndroid();
}
export async function setPagoEnLinea(v: boolean): Promise<void> {
  await setDoc(doc(db, 'config_ia', 'planes'), { pagoEnLinea: v }, { merge: true });
  _activo = v;
}

export type PedidoPago = { tipo: 'pack'; creditos: number } | { tipo: 'plan'; planId: string; periodo: 'mensual' | 'anual' };
/** Crea el pedido y abre la página de pago (en la misma ventana: al terminar vuelve a la app). */
export async function pagarEnLinea(p: PedidoPago): Promise<void> {
  const fn = httpsCallable<PedidoPago, { url: string }>(getFunctions(app, 'us-central1'), 'crearPagoEnLinea');
  const r = await fn(p);
  if (!r.data?.url) throw new Error('No se pudo abrir el pago.');
  window.location.href = r.data.url;
}
