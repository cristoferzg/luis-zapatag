// Recarga la app una sola vez cuando falla la carga de un apartado porque se
// desplegó una versión nueva (los archivos de la versión anterior ya no existen).
const CLAVE = 'innova_recarga_version';

export const esErrorDeVersion = (e: unknown) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported|ChunkLoadError|Unable to preload CSS/i
    .test(String((e as Error)?.message || e || ''));

export function recargarPorVersionNueva(): boolean {
  try {
    const ultima = Number(sessionStorage.getItem(CLAVE) || 0);
    if (Date.now() - ultima < 30_000) return false; // ya se intentó hace poco: no entrar en bucle
    sessionStorage.setItem(CLAVE, String(Date.now()));
    const vista = sessionStorage.getItem('innova_vista_actual'); // apartado que se estaba abriendo
    if (vista) sessionStorage.setItem('innova_vista_tras_recarga', vista);
  } catch { /* sin almacenamiento: se recarga igual */ }
  window.location.reload();
  return true;
}

/** Botón "Actualizar ahora": borra la caché de la app y el service worker y recarga
 *  desde el servidor (no toca los datos guardados: proyectos, diseños, sesión). */
export async function forzarActualizacion(): Promise<void> {
  try {
    if ('caches' in window) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); }
    if ('serviceWorker' in navigator) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); }
  } catch { /* se recarga igual */ }
  const u = new URL(window.location.href); u.searchParams.set('v', String(Date.now()));
  window.location.replace(u.toString());
}
