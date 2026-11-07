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

/** obligatoria (solo PC): quien tenga un programa más antiguo no puede usarlo hasta instalar este. */
export interface EnlaceApp { url: string; activo: boolean; nombre?: string; tamanoMb?: number; subidoEl?: string; version?: string; obligatoria?: boolean }
export interface ConfigDescargas {
  android?: EnlaceApp;
  pc?: EnlaceApp;
  /** Instalador para Windows 7 / 8 / 8.1 (32 bits, base antigua): el de Windows 10/11 no arranca ahí. */
  pcWin7?: EnlaceApp;
  iphone?: EnlaceApp;
  /** fecha = compilación de la web/PC; codigoAndroid = versionCode mínimo de la app de Android (si se incluyó). */
  ultima?: { fecha: string; version?: string; nota?: string; obligatoria?: boolean; publicadoEl?: string; codigoAndroid?: number };
  recordatorioDias?: number; // 0 = sin recordatorios
}
export type Plataforma = 'android' | 'ios' | 'pc' | 'web';

const REF = () => doc(db, 'config_ia', 'descargas');
export const BUILD_ACTUAL: string = __BUILD__;
/** versionCode de la app de Android con la que se compiló este código (en la web es el de la última compilación). */
export const CODIGO_ANDROID: number = typeof __CODIGO_ANDROID__ === 'number' ? __CODIGO_ANDROID__ : 0;

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
  // App de Android: se compara el número de versión de Google Play (versionCode). Solo se le pide
  // actualizar si el admin incluyó la app (ya aprobada en Play): así nunca queda bloqueada
  // esperando una versión que todavía no está en la tienda.
  if (plataforma() === 'android') {
    const min = Number(c.ultima?.codigoAndroid) || 0;
    return min > 0 && CODIGO_ANDROID > 0 && CODIGO_ANDROID < min;
  }
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

/** Google Play: en la app de Play solo se puede llevar a la ficha de Play (no a un APK ni a otros
 *  instaladores). Si el enlace guardado no es de Play, se usa la ficha oficial de la app. */
export const ID_APP_ANDROID = 'pe.innovacontratistas.app';
export const esEnlacePlay = (url?: string) => !!url && /^https:\/\/play\.google\.com\//.test(url);
export const enlacePlaySeguro = (url?: string) => esEnlacePlay(url) ? url! : `https://play.google.com/store/apps/details?id=${ID_APP_ANDROID}`;
/** La app ya está publicada en Google Play: el botón de Android se muestra siempre (con el
 *  enlace del admin si es de Play; si no, la ficha oficial). */
export const enlaceAndroid = (c?: ConfigDescargas | null) => enlacePlaySeguro(c?.android?.url);

// ---- ¿El usuario ya tiene la app de Android? ----
// 1) En su cuenta: la app anota `appAndroid` en la configuración del usuario al abrirse (App.tsx).
// 2) En este celular: Chrome en Android pregunta si la app "pariente" de la web está instalada
//    (related_applications del manifest + asset_statements en la app).
let _appEnCuenta = false;
export const fijarAppEnCuenta = (v: boolean) => {
  if (_appEnCuenta === v) return;
  _appEnCuenta = v;
  try { window.dispatchEvent(new CustomEvent('innova_app_en_cuenta')); } catch { /* sin ventana */ }
};
export const appEnCuenta = () => _appEnCuenta;
export async function appInstaladaEnEsteCelular(): Promise<boolean> {
  try {
    const f = (navigator as any).getInstalledRelatedApps;
    if (typeof f !== 'function') return false;
    const apps: { id?: string; platform?: string }[] = await f.call(navigator);
    return apps.some(a => a.platform === 'play' && (!a.id || a.id === ID_APP_ANDROID));
  } catch { return false; }
}

// ---- Programa de PC: versión del instalador ----
/** Versión del programa de PC que está corriendo (la manda en su marca: "InnovaContratistasPC/2.0.0"). */
export const versionProgramaPC = (): string | null => {
  const m = typeof navigator !== 'undefined' ? navigator.userAgent.match(/InnovaContratistasPC\/([\d.]+)/) : null;
  return m ? m[1] : null;
};
/** Versión que trae el nombre del instalador ("InnovApp-Setup-2.0.0.exe" → "2.0.0"). */
export const versionDeInstalador = (nombre: string): string | undefined => nombre.match(/(\d+\.\d+(?:\.\d+)?)/)?.[1];
/** -1 si a es anterior a b, 0 si son iguales, 1 si es posterior. */
export function compararVersiones(a: string, b: string): number {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
  return 0;
}
/** Windows 7, 8 u 8.1 (Windows NT 6.1 / 6.2 / 6.3): necesitan su propio instalador. */
export const esWindowsAntiguo = () => typeof navigator !== 'undefined' && /Windows NT 6\.[1-3]/.test(navigator.userAgent);
/** El instalador que le corresponde a ESTA computadora (Windows 7/8 → el suyo, si está subido).
 *  "Obligatorio" y "activo" se toman del de Windows 10/11 (el admin los marca una sola vez). */
export function pcPara(c?: ConfigDescargas | null): EnlaceApp | undefined {
  if (!c?.pc && !c?.pcWin7) return undefined;
  if (esWindowsAntiguo() && c.pcWin7?.url) return { ...c.pcWin7, activo: c.pc?.activo ?? true, obligatoria: c.pc?.obligatoria };
  return c.pc;
}
/** ¿Este programa de PC es más antiguo que el instalador publicado para su Windows? */
export function programaPCDesactualizado(c: ConfigDescargas): boolean {
  const p = pcPara(c);
  const mia = versionProgramaPC(), pub = p?.version;
  return !!(mia && pub && p?.activo && p.url && compararVersiones(mia, pub) < 0);
}
const K_PC_POSPUESTO = 'innova_programa_pc_pospuesto';
export const avisoPCPospuesto = (v: string) => { const p = safeStorage.getItem<{ v: string; hasta: number } | null>(K_PC_POSPUESTO, null); return !!p && p.v === v && p.hasta > Date.now(); };
export const posponerAvisoPC = (v: string) => safeStorage.setItem(K_PC_POSPUESTO, { v, hasta: Date.now() + 7 * 24 * 3600e3 });
