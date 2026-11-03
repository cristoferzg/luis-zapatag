// =============================================================================
// Opción A · que los botones se sientan como una app del propio celular.
//  - Android: onda (Material 3) que nace donde se toca.
//  - iPhone: el botón se encoge y se aclara un instante (estilo Apple), sin onda.
//  - En la app instalada: vibración corta en los botones importantes.
// Solo con dedo (no con mouse) y solo en el estilo de celular/tablet (html.app-marca),
// así la versión de computadora queda igual. No toca el estilo de cada botón: la
// onda se dibuja en una capa aparte encima.
// =============================================================================
import { Capacitor } from '@capacitor/core';

const TOCABLE = 'button, [role="button"], [role="tab"], a[href], summary, label[for]';
// Botones "importantes": vibran al tocarlos (en la app).
const IMPORTANTE = '.nav-app button, .fab-app, .item-menu, [role="tab"], button[type="submit"], [class*="bg-orange-5"], [class*="bg-orange-6"], [class*="bg-amber-5"], [class*="bg-amber-6"], [class*="bg-emerald-6"], [class*="bg-indigo-6"], [class*="bg-blue-6"]';

let vibrar: (fuerte: boolean) => void = () => {};

function onda(el: HTMLElement, x: number, y: number, r: DOMRect) {
  const cs = getComputedStyle(el);
  const capa = document.createElement('div');
  capa.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${cs.borderRadius};overflow:hidden;pointer-events:none;z-index:2147483000`;
  const d = Math.max(r.width, r.height) * 2.3;
  const c = document.createElement('span');
  c.className = 'onda-material';
  c.style.cssText = `left:${x - r.left - d / 2}px;top:${y - r.top - d / 2}px;width:${d}px;height:${d}px;background:${cs.color}`;
  capa.appendChild(c);
  document.body.appendChild(capa);
  setTimeout(() => capa.remove(), 560);
}

export function instalarSensacionNativa(): void {
  if (typeof document === 'undefined') return;
  const raiz = document.documentElement;
  if (Capacitor.isNativePlatform()) {
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      vibrar = fuerte => { Haptics.impact({ style: fuerte ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {}); };
    }).catch(() => { /* sin plugin: sin vibración */ });
  }
  let apretado: HTMLElement | null = null;
  const soltar = () => { if (apretado) { const a = apretado; apretado = null; setTimeout(() => a.classList.remove('toque-ios'), 90); } };

  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || !raiz.classList.contains('app-marca')) return;
    const el = (e.target as Element | null)?.closest?.(TOCABLE) as HTMLElement | null;
    if (!el || el.matches(':disabled, [aria-disabled="true"]') || el.closest('[data-sin-toque]')) return;
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6 || r.height > 260) return; // contenedores grandes: nada
    if (el.matches(IMPORTANTE)) vibrar(el.matches('.fab-app, button[type="submit"]'));
    if (raiz.classList.contains('plat-ios')) { el.classList.add('toque-ios'); apretado = el; }
    else onda(el, e.clientX, e.clientY, r);
  }, { capture: true, passive: true });
  ['pointerup', 'pointercancel', 'pointerleave', 'scroll'].forEach(ev => document.addEventListener(ev, soltar, { capture: true, passive: true }));
}
