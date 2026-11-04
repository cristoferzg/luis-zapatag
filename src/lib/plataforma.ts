// En qué se está ejecutando la app.
// En la app de Play Store (Android) no se venden contenidos digitales: Google
// exige su propio sistema de cobro. Ahí solo se muestra lo que el usuario ya
// tiene habilitado, sin precios ni botones de compra. La web cobra como siempre.
import { Capacitor } from '@capacitor/core';

export const esAppAndroid = (): boolean => Capacitor.isNativePlatform();
// Interruptor del admin (config_ia/planes.comprasEnApp): la app que se reparte como APK
// (fuera de Play Store) SÍ puede vender por WhatsApp/Yape. Si algún día la app se publica
// en Play Store, se apaga desde Configuración → Planes y créditos, sin recompilar.
// Por seguridad con Google Play: apagado salvo que el admin lo encienda explícitamente.
let _comprasEnApp = false;
export const fijarComprasEnApp = (v: boolean) => { _comprasEnApp = v; };
export const comprasEnAppActivas = () => _comprasEnApp;
export const comprasPermitidas = (): boolean => !esAppAndroid() || _comprasEnApp;
// Interruptor del admin (config_ia/planes.pagosGooglePlay): en la app de Android los planes y
// recargas de IA se compran con Google Play. Se enciende cuando los productos ya existen en Play Console.
let _pagosPlay = false;
export const fijarPagosPlay = (v: boolean) => { _pagosPlay = v; };
export const pagosPlayActivos = () => _pagosPlay;
/** ¿Se pueden comprar planes y recargas de IA aquí? Con Google Play activo, en Android solo
 *  se compra con Google (nunca por WhatsApp/Yape); en la web y la PC, como siempre. */
export const comprasIAPermitidas = (): boolean => esAppAndroid() && _pagosPlay ? !!(window as any).CdvPurchase : comprasPermitidas();
