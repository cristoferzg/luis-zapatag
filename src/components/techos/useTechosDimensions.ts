// Hook para detectar responsividad y dimensiones (isMobile vs isDesktop)
import { useState, useEffect } from 'react';

export interface TechosDimensions {
  width: number;
  height: number;
  isMobile: boolean;
  isDesktop: boolean;
}

export function useTechosDimensions(): TechosDimensions {
  const [dimensions, setDimensions] = useState<TechosDimensions>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      width: w,
      height: h,
      isMobile: w < 1024,
      isDesktop: w >= 1024,
    };
  });

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({
        width: w,
        height: h,
        isMobile: w < 1024,
        isDesktop: w >= 1024,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}

export default useTechosDimensions;
