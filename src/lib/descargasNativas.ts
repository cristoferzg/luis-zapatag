// App de Android: el WebView no guarda descargas por sí solo. Aquí toda descarga de
// la web (videos grabados del 3D, DXF, respaldos, PDF y adjuntos de Recursos) se pasa
// al plugin nativo "Archivos", que la guarda en Descargas/InnovApp con su aviso.
import { Capacitor, registerPlugin } from '@capacitor/core';

interface ArchivosPlugin {
  guardar(o: { nombre: string; mime: string; datos: string }): Promise<{ ok: boolean; uri?: string; mime?: string }>;
  abrir(o: { uri: string; mime?: string }): Promise<void>;
  descargar(o: { url: string; nombre: string; mime?: string }): Promise<{ ok: boolean }>;
}
const nativoReal = registerPlugin<ArchivosPlugin>('Archivos');
// DEV: window.__descargaNativaSimulada = true → se comporta como la app de Android (solo pruebas).
const simulado = () => import.meta.env.DEV && !!(window as unknown as { __descargaNativaSimulada?: boolean }).__descargaNativaSimulada;
const Archivos: ArchivosPlugin = {
  guardar: o => simulado() ? new Promise(ok => setTimeout(() => ok({ ok: true, uri: 'content://simulado/' + o.nombre, mime: o.mime }), 800)) : nativoReal.guardar(o),
  abrir: o => simulado() ? Promise.resolve() : nativoReal.abrir(o),
  descargar: o => simulado() ? Promise.resolve({ ok: true }) : nativoReal.descargar(o),
};

const ARCHIVO_REMOTO = /firebasestorage|storage\.googleapis\.com|\.(pdf|zip|rar|dwg|dxf|xlsx?|docx?|pptx?|mp4|mov|webm|jpe?g|png|skp|json|txt|csv)(\?|#|$)/i;

const nombreDe = (a: HTMLAnchorElement) => {
  if (a.download) return a.download;
  try { return decodeURIComponent(new URL(a.href).pathname.split('/').pop() || 'archivo').split('/').pop() || 'archivo'; } catch { return 'archivo'; }
};

// Aviso visible dentro de la app (el mensajito de Android dura 3 s y muchos no lo ven):
// "Guardando…" mientras se prepara y "Guardado en Descargas/InnovApp" con botón «Abrir».
let cajaAviso: HTMLDivElement | null = null, timerAviso = 0;
function avisoDescarga(texto: string, o: { tono?: 'ok' | 'error' | 'info'; abrir?: () => void; segundos?: number } = {}) {
  try {
    window.clearTimeout(timerAviso);
    if (!cajaAviso) {
      cajaAviso = document.createElement('div');
      cajaAviso.setAttribute('role', 'status');
      cajaAviso.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:10000;display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:16px;color:#fff;font:600 13px/1.35 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3);max-width:520px;margin:0 auto;box-sizing:border-box';
      document.body.appendChild(cajaAviso);
    }
    const c = cajaAviso;
    c.style.background = o.tono === 'error' ? '#b91c1c' : o.tono === 'ok' ? '#15803d' : '#0f2a4a';
    c.textContent = '';
    const t = document.createElement('span'); t.style.cssText = 'flex:1;min-width:0;overflow-wrap:anywhere'; t.textContent = texto; c.appendChild(t);
    if (o.abrir) {
      const b = document.createElement('button');
      b.textContent = 'Abrir';
      b.style.cssText = 'flex-shrink:0;background:#fff;color:#15803d;font:800 13px system-ui,sans-serif;border:0;border-radius:10px;padding:8px 14px';
      b.onclick = () => o.abrir?.();
      c.appendChild(b);
    }
    const x = document.createElement('button');
    x.textContent = '✕'; x.setAttribute('aria-label', 'Cerrar');
    x.style.cssText = 'flex-shrink:0;background:transparent;color:#fff;border:0;font-size:16px;padding:4px 6px';
    x.onclick = () => { c.remove(); cajaAviso = null; };
    c.appendChild(x);
    if (o.segundos) timerAviso = window.setTimeout(() => { c.remove(); cajaAviso = null; }, o.segundos * 1000);
  } catch { /* nada */ }
}

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
    avisoDescarga(`Guardando ${nombre}…`);
    fetch(href).then(r => r.blob()).then(async b => {
      const mime = b.type || 'application/octet-stream';
      const r = await Archivos.guardar({ nombre, mime, datos: await aBase64(b) });
      const uri = r?.uri;
      avisoDescarga(`✅ Guardado en Descargas › InnovApp: ${nombre}`, {
        tono: 'ok', segundos: 12,
        abrir: uri ? () => { Archivos.abrir({ uri, mime }).catch(() => {}); } : undefined,
      });
    }).catch(() => avisoDescarga(`No se pudo guardar ${nombre} en el celular. Revisa que haya espacio y vuelve a intentarlo.`, { tono: 'error', segundos: 10 }));
    return true;
  }
  if (/^https?:/.test(href) && new URL(href).origin !== location.origin && (a.hasAttribute('download') || ARCHIVO_REMOTO.test(href))) {
    const nombre = nombreDe(a);
    Archivos.descargar({ url: href, nombre })
      .then(() => avisoDescarga(`⬇️ Descargando ${nombre}… verás el aviso en la barra de notificaciones (Descargas › InnovApp).`, { segundos: 8 }))
      .catch(() => window.open(href, '_blank'));
    return true;
  }
  return false;
}

export function instalarDescargasNativas(): void {
  let nativo = false;
  try { nativo = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Archivos'); } catch { /* web */ }
  if (simulado()) nativo = true;
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
