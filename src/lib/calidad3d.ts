// =============================================================================
// Calidad del 3D (se elige con el botón "Calidad" en el celular):
//  • alta: más píxeles (nítido como en la PC) y bordes más marcados;
//  • ahorro: menos píxeles, más fluido y gasta menos batería.
// Se guarda en este equipo y avisa a los visores abiertos.
// =============================================================================
export type Calidad3D = 'alta' | 'ahorro';
const K = 'innova_calidad_3d';
const EVT = 'innova_calidad_3d';

export function calidad3d(): Calidad3D {
  try { const v = localStorage.getItem(K); if (v === 'alta' || v === 'ahorro') return v; } catch { /* nada */ }
  return 'alta';
}
export function setCalidad3d(c: Calidad3D) {
  try { localStorage.setItem(K, c); } catch { /* nada */ }
  window.dispatchEvent(new CustomEvent(EVT, { detail: c }));
}
export function onCalidad3d(fn: (c: Calidad3D) => void) {
  const h = (e: Event) => fn((e as CustomEvent).detail);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
/** Píxeles por punto de pantalla para el renderer. */
export const pixelRatio3d = (c: Calidad3D = calidad3d()) => c === 'ahorro' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
/** En pantallas táctiles finas los bordes de 1 px casi no se ven: en Alta se marcan más. */
export const refuerzoBordes = (c: Calidad3D = calidad3d()) => c === 'alta' && (window.devicePixelRatio || 1) > 1.5 && matchMedia('(pointer: coarse)').matches;
