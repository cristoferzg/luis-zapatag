// =============================================================================
// Muestra una hoja A4 (794 px de ancho) ajustada al ancho de la pantalla.
// En el celular la hoja se ve completa sin desplazarse de lado; con + / − se
// acerca y entonces se recorre con el dedo. La hoja real no cambia de tamaño
// (solo se escala la vista), así el PDF sale igual que antes.
// =============================================================================
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ANCHO_A4 = 794; // 210 mm a 96 ppp

export default function HojaA4Ajustable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const marcoRef = useRef<HTMLDivElement>(null);
  const hojaRef = useRef<HTMLDivElement>(null);
  const [anchoMarco, setAnchoMarco] = useState(ANCHO_A4);
  const [altoHoja, setAltoHoja] = useState(1123);
  const [zoom, setZoom] = useState<number | null>(null); // null = ajustar al ancho

  useLayoutEffect(() => {
    const marco = marcoRef.current, hoja = hojaRef.current;
    if (!marco || !hoja) return;
    // Solo cambios reales de tamaño: si la barra de desplazamiento aparece o
    // desaparece (unos px), no se reajusta; así la hoja no "tiembla".
    const medir = () => {
      setAnchoMarco(w => (Math.abs(marco.clientWidth - w) > 24 ? marco.clientWidth : w));
      setAltoHoja(hoja.offsetHeight);
    };
    setAnchoMarco(marco.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(marco); ro.observe(hoja);
    return () => ro.disconnect();
  }, []);

  const ajuste = Math.min(1, (anchoMarco - 24) / ANCHO_A4);
  const escala = zoom ?? ajuste;
  const chica = ajuste < 0.95; // casi cabe: sin barra de zoom (si aparece y desaparece, la hoja tiembla)
  useEffect(() => { if (zoom !== null && zoom <= ajuste + 0.001) setZoom(null); }, [zoom, ajuste]);

  return (
    <div className={`w-full ${className}`}>
      {chica && (
        <div className="flex items-center justify-end gap-1.5 mb-2">
          <span className="text-[10px] font-bold text-slate-500 mr-auto">Vista {Math.round(escala * 100)}%</span>
          <button type="button" onClick={() => setZoom(z => Math.max(ajuste, (z ?? ajuste) - 0.25))} disabled={zoom === null}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer" title="Alejar"><ZoomOut className="w-4 h-4" /></button>
          <button type="button" onClick={() => setZoom(z => Math.min(1.5, (z ?? ajuste) + 0.25))}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 cursor-pointer" title="Acercar"><ZoomIn className="w-4 h-4" /></button>
          <button type="button" onClick={() => setZoom(null)} disabled={zoom === null}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 disabled:opacity-40 cursor-pointer" title="Ver la hoja completa"><Maximize2 className="w-3.5 h-3.5" /> Ajustar</button>
        </div>
      )}
      <div ref={marcoRef} className={`w-full ${zoom === null ? 'overflow-x-hidden overflow-y-visible' : 'overflow-auto'}`} style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <div style={{ width: ANCHO_A4 * escala, height: altoHoja * escala, margin: escala < ajuste + 0.001 ? '0 auto' : undefined }}>
          <div ref={hojaRef} style={{ width: ANCHO_A4, transform: `scale(${escala})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
