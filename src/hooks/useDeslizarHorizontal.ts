// Barras con desplazamiento horizontal (pestañas, herramientas): en PC se
// pueden recorrer con la rueda del ratón o arrastrando con el ratón, como en
// el celular con el dedo. Un arrastre no dispara el clic del botón de abajo.
import { useEffect, useRef } from 'react';

export function useDeslizarHorizontal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rueda = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    let x0 = 0, s0 = 0, abajo = false, movido = false;
    const down = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; abajo = true; movido = false; x0 = e.clientX; s0 = el.scrollLeft; };
    const move = (e: PointerEvent) => {
      if (!abajo) return;
      const dx = e.clientX - x0;
      if (!movido && Math.abs(dx) > 6) movido = true;
      if (movido) el.scrollLeft = s0 - dx;
    };
    const up = () => { abajo = false; };
    const clic = (e: MouseEvent) => { if (movido) { e.stopPropagation(); e.preventDefault(); movido = false; } };
    el.addEventListener('wheel', rueda, { passive: false });
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('click', clic, true);
    return () => {
      el.removeEventListener('wheel', rueda);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('click', clic, true);
    };
  }, []);
  return ref;
}
