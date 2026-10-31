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
