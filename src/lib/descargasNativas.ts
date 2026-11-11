// App de Android: el WebView no guarda descargas por sí solo. Aquí toda descarga de
// la web (videos grabados del 3D, DXF, respaldos, PDF y adjuntos de Recursos) se pasa
// al plugin nativo "Archivos", que la guarda en Descargas/InnovApp con su aviso.
import { Capacitor, registerPlugin } from '@capacitor/core';

interface ArchivosPlugin {
  guardar(o: { nombre: string; mime: string; datos: string }): Promise<{ ok: boolean }>;
  descargar(o: { url: string; nombre: string; mime?: string }): Promise<{ ok: boolean }>;
}
const Archivos = registerPlugin<ArchivosPlugin>('Archivos');

const ARCHIVO_REMOTO = /firebasestorage|storage\.googleapis\.com|\.(pdf|zip|rar|dwg|dxf|xlsx?|docx?|pptx?|mp4|mov|webm|jpe?g|png|skp|json|txt|csv)(\?|#|$)/i;

const nombreDe = (a: HTMLAnchorElement) => {
  if (a.download) return a.download;
  try { return decodeURIComponent(new URL(a.href).pathname.split('/').pop() || 'archivo').split('/').pop() || 'archivo'; } catch { return 'archivo'; }
};

const aBase64 = (b: Blob) => new Promise<string>((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || '');
  r.onerror = () => mal(r.error);
  r.readAsDataURL(b);
});

function manejar(a: HTMLAnchorElement): boolean {
  const href = a.href || '';
  if (!href) return false;
  if (href.startsWith('blob:') || href.startsWith('data:')) {
    if (!a.hasAttribute('download')) return false;
    const nombre = nombreDe(a);
    fetch(href).then(r => r.blob()).then(async b => {
      await Archivos.guardar({ nombre, mime: b.type || 'application/octet-stream', datos: await aBase64(b) });
    }).catch(() => alert('No se pudo guardar el archivo en el celular.'));
    return true;
  }
  if (/^https?:/.test(href) && new URL(href).origin !== location.origin && (a.hasAttribute('download') || ARCHIVO_REMOTO.test(href))) {
    Archivos.descargar({ url: href, nombre: nombreDe(a) }).catch(() => window.open(href, '_blank'));
    return true;
  }
  return false;
}

export function instalarDescargasNativas(): void {
  let nativo = false;
  try { nativo = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Archivos'); } catch { /* web */ }
  if (!nativo) return;
  // Descargas armadas por código: a.click() sobre un enlace creado al vuelo.
  const clickOriginal = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (manejar(this)) return;
    return clickOriginal.call(this);
  };
  // Enlaces que el usuario toca (adjuntos, "Descargar PDF"…).
  document.addEventListener('click', e => {
    const a = (e.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null;
    if (a && manejar(a)) { e.preventDefault(); e.stopPropagation(); }
  }, true);
}
