// =============================================================================
// Grabar video y sacar foto de cualquier visor 3D, igual en toda la app:
//  · Video MP4 (para WhatsApp) de 15 s, con una vuelta completa y por FASES
//    (p. ej. "Estructura" → "Con calamina"); el nombre de la fase sale escrito.
//  · Foto JPG lista para enviar.
// Cada cuadro se arma en un lienzo propio: fondo (color o la foto del terreno),
// el 3D encima y un rótulo. Así no sale negro ni transparente en ningún equipo.
// El visor debe crear su renderer con preserveDrawingBuffer: true.
// =============================================================================
import { grabarCanvas, puedeGrabar } from './grabarVideo';

export const DURACION_VIDEO_S = 15;
/** Una vuelta completa durante el video (radianes por segundo). */
export const GIRO_VIDEO_RAD_S = (2 * Math.PI) / DURACION_VIDEO_S;
const MAX_LADO_VIDEO = 1280;

export interface Fase { nombre: string; aplicar: () => void }
export interface FondoCaptura { color: string; imagen?: string | null; ajuste?: { zoom: number; x: number; y: number } }

const imagenes = new Map<string, Promise<HTMLImageElement>>();
const cargar = (src: string) => {
  let p = imagenes.get(src);
  if (!p) { p = new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; }); imagenes.set(src, p); }
  return p;
};

function dibujar(g: CanvasRenderingContext2D, gl: HTMLCanvasElement, w: number, h: number, fondo: FondoCaptura, img: HTMLImageElement | null, rotulo?: string) {
  g.fillStyle = fondo.color || '#f1f5f9'; g.fillRect(0, 0, w, h);
  if (img) {
    const a = fondo.ajuste || { zoom: 1, x: 0, y: 0 };
    g.save();
    g.translate(w / 2 + (a.x / 100) * w, h / 2 + (a.y / 100) * h); g.scale(a.zoom, a.zoom); g.translate(-w / 2, -h / 2);
    const k = Math.max(w / img.width, h / img.height);
    g.drawImage(img, (w - img.width * k) / 2, (h - img.height * k) / 2, img.width * k, img.height * k);
    g.restore();
  }
  try { g.drawImage(gl, 0, 0, w, h); } catch { /* lienzo no disponible */ }
  const fs = Math.max(14, Math.round(h * 0.034));
  g.font = `800 ${fs}px system-ui, sans-serif`; g.textBaseline = 'middle';
  if (rotulo) {
    const tw = g.measureText(rotulo).width, pad = fs * 0.7, bh = fs * 1.9;
    g.fillStyle = 'rgba(15, 23, 42, 0.82)';
    redondeado(g, fs * 0.8, h - bh - fs * 0.8, tw + pad * 2, bh, fs * 0.45); g.fill();
    g.fillStyle = '#ffffff'; g.fillText(rotulo, fs * 0.8 + pad, h - bh / 2 - fs * 0.8);
  }
  const marca = 'InnovApp';
  g.font = `800 ${Math.round(fs * 0.8)}px system-ui, sans-serif`;
  g.fillStyle = 'rgba(15, 23, 42, 0.55)';
  g.fillText(marca, w - g.measureText(marca).width - fs * 0.9, h - fs * 1.25);
}
function redondeado(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Foto JPG del visor (con su fondo) que se descarga (en la app de Android va a Descargas/InnovApp). */
export async function fotoDe3D(gl: HTMLCanvasElement, nombre: string, fondo: FondoCaptura, rotulo?: string): Promise<boolean> {
  const w = gl.width, h = gl.height;
  if (!w || !h) return false;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); if (!g) return false;
  const img = fondo.imagen ? await cargar(fondo.imagen).catch(() => null) : null;
  dibujar(g, gl, w, h, fondo, img, rotulo);
  const blob = await new Promise<Blob | null>(ok => c.toBlob(ok, 'image/jpeg', 0.92));
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${nombre}_${new Date().toISOString().slice(0, 10)}.jpg`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

export const puedeGrabar3D = () => puedeGrabar(document.createElement('canvas'));

/**
 * Graba 15 s del visor por fases (cada fase dura lo mismo). Llama a `alSegundo` con
 * los segundos que faltan y a `alCambiarFase` con la fase actual. Al terminar
 * descarga el MP4 y llama a `alTerminar`. Devuelve null si el equipo no puede grabar.
 */
/** `gl` puede ser una función: algunos visores rehacen el lienzo al cambiar de fase (Techos al poner la calamina). */
export function grabarEnFases(glIn: HTMLCanvasElement | (() => HTMLCanvasElement | null | undefined), nombre: string, o: {
  fondo: () => FondoCaptura; fases: Fase[];
  alCambiarFase?: (i: number, f: Fase) => void; alSegundo?: (faltan: number) => void; alTerminar?: (ext: string) => void;
}): { detener: () => void } | null {
  const lienzo = () => (typeof glIn === 'function' ? glIn() : glIn) || null;
  const gl = lienzo();
  if (!gl) return null;
  const k = Math.min(1, MAX_LADO_VIDEO / Math.max(gl.width || 1, gl.height || 1));
  const w = Math.max(2, Math.round((gl.width * k) / 2) * 2), h = Math.max(2, Math.round((gl.height * k) / 2) * 2);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (!g || !puedeGrabar(c)) return null;
  const fases = o.fases.length ? o.fases : [{ nombre: '', aplicar: () => {} }];
  const total = DURACION_VIDEO_S * 1000, porFase = total / fases.length;
  let img: HTMLImageElement | null = null;
  const f0 = o.fondo();
  if (f0.imagen) cargar(f0.imagen).then(i => { img = i; }).catch(() => {});
  let fase = -1, raf = 0, ultimoSeg = -1, activo = true;
  const t0 = performance.now();
  const paso = () => {
    if (!activo) return;
    const t = performance.now() - t0;
    const i = Math.min(fases.length - 1, Math.floor(t / porFase));
    if (i !== fase) { fase = i; fases[i].aplicar(); o.alCambiarFase?.(i, fases[i]); }
    const faltan = Math.max(0, Math.ceil((total - t) / 1000));
    if (faltan !== ultimoSeg) { ultimoSeg = faltan; o.alSegundo?.(faltan); }
    const actual = lienzo();
    if (actual && actual.width && actual.height) dibujar(g, actual, w, h, o.fondo(), img, fases[i].nombre || undefined);
    raf = requestAnimationFrame(paso);
  };
  paso();
  const r = grabarCanvas(c, nombre, { duracionMs: total, onFin: ext => { activo = false; cancelAnimationFrame(raf); o.alTerminar?.(ext); } });
  if (!r) { activo = false; cancelAnimationFrame(raf); return null; }
  return { detener: () => r.detener() };
}
