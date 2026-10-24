// En qué se está ejecutando la app.
// En la app de Play Store (Android) no se venden contenidos digitales: Google
// exige su propio sistema de cobro. Ahí solo se muestra lo que el usuario ya
// tiene habilitado, sin precios ni botones de compra. La web cobra como siempre.
import { Capacitor } from '@capacitor/core';

export const esAppAndroid = (): boolean => Capacitor.isNativePlatform();
export const comprasPermitidas = (): boolean => !esAppAndroid();
