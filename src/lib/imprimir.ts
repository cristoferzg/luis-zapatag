// Impresión de un área concreta de la página (lámina, presupuesto, informe).
// Se copia el elemento a un iframe propio con los estilos de la app, así no
// salen el menú, los botones ni nada fuera del área, y se puede elegir el
// tamaño de papel y la orientación.
import { safeStorage } from './storageManager';

export const TAMANOS_PAPEL = ['A4', 'A3', 'A2', 'A1', 'A0', 'Carta', 'Oficio'] as const;
export type TamanoPapel = typeof TAMANOS_PAPEL[number];
export type Orientacion = 'portrait' | 'landscape';
export interface OpcionesImpresion { tamano: TamanoPapel; orientacion: Orientacion; titulo?: string; unaHoja?: boolean }

// Medidas del papel en mm (vertical).
const PAPEL_MM: Record<TamanoPapel, [number, number]> = { A4: [210, 297], A3: [297, 420], A2: [420, 594], A1: [594, 841], A0: [841, 1189], Carta: [216, 279], Oficio: [216, 356] };
const MARGEN_MM = 8;

const KEY = 'innova_ultima_impresion';
export const leerUltimaImpresion = (def: Omit<OpcionesImpresion, 'titulo'>) => safeStorage.getItem(KEY, def) || def;

const tamanoCss = (t: TamanoPapel) => (t === 'Carta' ? 'letter' : t === 'Oficio' ? 'legal' : t);

export function imprimirElemento(el: HTMLElement, opts: OpcionesImpresion) {
  safeStorage.setItem(KEY, { tamano: opts.tamano, orientacion: opts.orientacion });
  // El marco mide lo mismo que el área imprimible del papel (fuera de la
  // pantalla) para que el contenido se arme con el ancho real de la hoja.
  const [pa, pb] = PAPEL_MM[opts.tamano];
  const [wMm, hMm] = opts.orientacion === 'portrait' ? [pa, pb] : [pb, pa];
  const pxMm = 96 / 25.4;
  const anchoPx = (wMm - 2 * MARGEN_MM) * pxMm, altoPx = (hMm - 2 * MARGEN_MM) * pxMm;
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, { position: 'fixed', left: '-20000px', top: '0', width: `${Math.round(anchoPx)}px`, height: `${Math.round(altoPx)}px`, border: '0' });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) { iframe.remove(); return; }

  const estilos = [...document.querySelectorAll('link[rel="stylesheet"], style')].map(n => n.outerHTML).join('\n');
  const clon = el.cloneNode(true) as HTMLElement;
  // Los <canvas> (3D, gráficos) no se copian: se pasan como imagen.
  const canvOrig = el.querySelectorAll('canvas'), canvClon = clon.querySelectorAll('canvas');
  canvOrig.forEach((c, i) => {
    try { const img = document.createElement('img'); img.src = c.toDataURL('image/png'); img.style.maxWidth = '100%'; canvClon[i]?.replaceWith(img); } catch { /* lienzo protegido */ }
  });
  // Los valores escritos en inputs/selects no viajan con cloneNode.
  const inOrig = el.querySelectorAll('input, textarea, select'), inClon = clon.querySelectorAll('input, textarea, select');
  inOrig.forEach((n, i) => {
    const c = inClon[i] as HTMLInputElement | undefined; if (!c) return;
    if (n instanceof HTMLSelectElement) { const s = c as unknown as HTMLSelectElement; s.value = n.value; [...s.options].forEach(o => o.toggleAttribute('selected', o.value === n.value)); }
    else if (n instanceof HTMLInputElement && (n.type === 'checkbox' || n.type === 'radio')) c.toggleAttribute('checked', n.checked);
    else { c.setAttribute('value', (n as HTMLInputElement).value); if (n instanceof HTMLTextAreaElement) c.textContent = n.value; }
  });
  clon.classList.add('zona-impresion');

  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${(opts.titulo || document.title).replace(/</g, '')}</title>${estilos}
<style>
  @page { size: ${tamanoCss(opts.tamano)} ${opts.orientacion}; margin: 8mm; }
  html, body { background: #fff !important; margin: 0; padding: 0; height: auto !important; overflow: visible !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .print\\:hidden, .no-imprimir { display: none !important; }
  .zona-impresion input, .zona-impresion select { border: none !important; background: transparent !important; }
  .zona-impresion input::placeholder { color: transparent !important; }
  .zona-impresion { max-width: none !important; width: 100% !important; margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; overflow: visible !important; height: auto !important; max-height: none !important; }
  .zona-impresion svg { max-width: 100%; height: auto; }
  .imprimir-claro, .imprimir-claro * { background: #fff !important; color: #0f172a !important; border-color: #cbd5e1 !important; box-shadow: none !important; }
  .zona-impresion table { page-break-inside: auto; } .zona-impresion tr { page-break-inside: avoid; }
</style></head><body></body></html>`);
  doc.close();
  const nodo = doc.importNode(clon, true) as HTMLElement;
  doc.body.appendChild(nodo);
  // Planos: se escala para que la lámina entera entre en una sola hoja.
  const ajustar = () => {
    if (!opts.unaHoja) return;
    nodo.style.setProperty('width', `${anchoPx}px`, 'important');
    const alto = nodo.scrollHeight;
    if (alto <= altoPx) return;
    // La lámina se reduce entera (transform) y se centra dentro de un marco del
    // tamaño exacto de la hoja, así no se parte en varias páginas.
    const k = Math.max(0.1, (altoPx / alto) * 0.98);
    const marco = doc.createElement('div');
    marco.style.cssText = `width:${anchoPx}px;height:${Math.floor(altoPx)}px;overflow:hidden;break-inside:avoid`;
    nodo.parentNode!.insertBefore(marco, nodo);
    marco.appendChild(nodo);
    nodo.style.transformOrigin = 'top left';
    nodo.style.transform = `translateX(${((anchoPx - anchoPx * k) / 2).toFixed(1)}px) scale(${k.toFixed(4)})`;
  };



  const limpiar = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener('afterprint', limpiar);
  // Esperar a que carguen estilos y fuentes antes de abrir el diálogo.
  const lanzar = () => { try { win.focus(); win.print(); } finally { setTimeout(() => { if (document.body.contains(iframe)) iframe.remove(); }, 60000); } };
  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')] as HTMLLinkElement[];
  Promise.all(links.map(l => new Promise(r => { if (l.sheet) r(null); else { l.onload = l.onerror = () => r(null); } })))
    .then(() => (doc.fonts?.ready || Promise.resolve()))
    .then(() => { ajustar(); setTimeout(lanzar, 150); });
}
