// En qué se está ejecutando la app.
// En la app de Play Store (Android) no se venden contenidos digitales: Google
// exige su propio sistema de cobro. Ahí solo se muestra lo que el usuario ya
// tiene habilitado, sin precios ni botones de compra. La web cobra como siempre.
import { Capacitor } from '@capacitor/core';

export const esAppAndroid = (): boolean => Capacitor.isNativePlatform();
// Interruptor del admin (config_ia/planes.comprasEnApp): la app que se reparte como APK
// (fuera de Play Store) SÍ puede vender por WhatsApp/Yape. Si algún día la app se publica
// en Play Store, se apaga desde Configuración → Planes y créditos, sin recompilar.
let _comprasEnApp = true;
export const fijarComprasEnApp = (v: boolean) => { _comprasEnApp = v; };
export const comprasEnAppActivas = () => _comprasEnApp;
export const comprasPermitidas = (): boolean => !esAppAndroid() || _comprasEnApp;
