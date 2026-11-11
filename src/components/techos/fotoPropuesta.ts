// =============================================================================
// Imagen del techo para la propuesta al cliente. El visor 3D guarda una foto
// (y, si se usó "Foto real", la foto del lugar sola = el ANTES) en la sesión.
// =============================================================================
const K_DESPUES = 'innova_foto_propuesta';
const K_ANTES = 'innova_foto_propuesta_antes';

const leer = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const escribir = (k: string, v: string | null) => {
  try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch { /* sin espacio: se queda sin foto */ }
};

export const fotoPropuesta = () => ({ despues: leer(K_DESPUES), antes: leer(K_ANTES) });

/** Reduce una imagen (dataURL o URL) a JPEG de hasta `max` px de ancho. */
export function reducirImagen(src: string, max = 1400, calidad = 0.82): Promise<string> {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', calidad));
    };
    img.onerror = mal;
    img.src = src;
  });
}

/**
 * Guarda la vista actual del 3D. Si hay foto de fondo, la compone debajo del
 * techo (DESPUÉS) y guarda la foto sola como ANTES.
 */
export interface AjusteFoto { zoom: number; x: number; y: number } // x, y en % del lienzo

export async function guardarFotoPropuesta(canvas: HTMLCanvasElement, fondo?: string | null, ajuste: AjusteFoto = { zoom: 1, x: 0, y: 0 }, colorFondo = '#f8fafc') {
  const c = document.createElement('canvas');
  c.width = canvas.width; c.height = canvas.height;
  const g = c.getContext('2d')!;
  if (fondo) {
    const img = await new Promise<HTMLImageElement>((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = fondo; });
    // "cover" + el mismo acercamiento/desplazamiento que se ve en pantalla
    g.fillStyle = colorFondo; g.fillRect(0, 0, c.width, c.height);
    g.save();
    g.translate(c.width / 2 + (ajuste.x / 100) * c.width, c.height / 2 + (ajuste.y / 100) * c.height);
    g.scale(ajuste.zoom, ajuste.zoom);
    g.translate(-c.width / 2, -c.height / 2);
    const k = Math.max(c.width / img.width, c.height / img.height);
    const w = img.width * k, h = img.height * k;
    g.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
    g.restore();
    const antes = c.toDataURL('image/jpeg', 0.85);
    escribir(K_ANTES, await reducirImagen(antes, 1100, 0.78));
  } else {
    g.fillStyle = colorFondo; g.fillRect(0, 0, c.width, c.height);
    escribir(K_ANTES, null);
  }
  g.drawImage(canvas, 0, 0);
  escribir(K_DESPUES, await reducirImagen(c.toDataURL('image/jpeg', 0.9), 1100, 0.8));
}
