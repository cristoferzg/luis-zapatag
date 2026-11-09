// En qué se está ejecutando la app.
// En la app de Play Store (Android) no se venden contenidos digitales: Google
// exige su propio sistema de cobro. Ahí solo se muestra lo que el usuario ya
// tiene habilitado, sin precios ni botones de compra. La web cobra como siempre.
import { Capacitor } from '@capacitor/core';

export const esAppAndroid = (): boolean => Capacitor.isNativePlatform();
// CANDADO GOOGLE PLAY: en la app de Android NUNCA se vende por fuera de Google (ni WhatsApp,
// ni Yape/Plin, ni Mercado Pago, ni precios de cursos o recursos). El antiguo interruptor
// config_ia/planes.comprasEnApp ya no tiene efecto (queda solo para leerlo). En la web y en el
// programa de PC se vende como siempre.
let _comprasEnApp = false;
export const fijarComprasEnApp = (v: boolean) => { _comprasEnApp = v; };
export const comprasEnAppActivas = () => _comprasEnApp;
export const comprasPermitidas = (): boolean => !esAppAndroid();
// Interruptor del admin (config_ia/planes.pagosGooglePlay): en la app de Android los planes y
// recargas de IA se compran con Google Play. Se enciende cuando los productos ya existen en Play Console.
let _pagosPlay = false;
export const fijarPagosPlay = (v: boolean) => { _pagosPlay = v; };
export const pagosPlayActivos = () => _pagosPlay;
/** ¿Se pueden comprar planes y recargas de IA aquí? En Android SOLO con Google Play (si está
 *  activo y el cobro de Google cargó); si no, en Android solo se ve el saldo. Web y PC: siempre. */
export const comprasIAPermitidas = (): boolean => esAppAndroid() ? (_pagosPlay && !!(window as any).CdvPurchase) : true;
