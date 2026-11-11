import { useRef, useCallback } from 'react';

/**
 * Hook to enable smooth horizontal mouse-drag scrolling and horizontal wheel scrolling
 * on any container while maintaining natural touch gestures with `touch-pan-x`.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T | null>(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent<T>) => {
    // Only trigger drag scroll on left mouse button and not on interactive inputs
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

    const el = containerRef.current;
    if (!el) return;

    isDownRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    hasMovedRef.current = false;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!isDownRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5; // Scroll speed factor
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const onMouseUpOrLeave = useCallback(() => {
    isDownRef.current = false;
  }, []);

  // Convert vertical mouse wheel into horizontal scrolling when scrolling over a horizontal bar
  const onWheel = useCallback((e: React.WheelEvent<T>) => {
    const el = containerRef.current;
    if (!el) return;

    // If scrolling predominantly with deltaY (vertical wheel on wireless mouse) on a horizontal-only bar:
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 0.9;
      }
    } else if (Math.abs(e.deltaX) > 0) {
      // Direct horizontal wheel
      e.preventDefault();
      el.scrollLeft += e.deltaX * 0.9;
    }
  }, []);

  return {
    ref: containerRef,
    events: {
      onMouseDown,
      onMouseMove,
      onMouseUp: onMouseUpOrLeave,
      onMouseLeave: onMouseUpOrLeave,
      onWheel
    }
  };
}

