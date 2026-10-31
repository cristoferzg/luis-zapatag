// Botón de impresión con elección de papel (A4…A0, Carta, Oficio) y
// orientación. Imprime solo el elemento indicado, sin la interfaz de la app.
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { TAMANOS_PAPEL, TamanoPapel, Orientacion, imprimirElemento, leerUltimaImpresion } from '../../lib/imprimir';

interface Props {
  objetivo: () => HTMLElement | null;
  titulo?: string;
  etiqueta?: string;
  className?: string;
  orientacion?: Orientacion;
  tamano?: TamanoPapel;
  unaHoja?: boolean; // escala el contenido para que entre en una sola hoja (planos)
}

export default function BotonImprimir({ objetivo, titulo, etiqueta = 'Imprimir', className, orientacion = 'portrait', tamano = 'A4', unaHoja = false }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<React.CSSProperties>({ top: 0, left: 0 });
  const [op, setOp] = useState(() => leerUltimaImpresion({ tamano, orientacion }));

  const imprimir = () => {
    const el = objetivo();
    setAbierto(false);
    if (el) imprimirElemento(el, { ...op, titulo, unaHoja });
  };

  return (
    <>
      <button
        onClick={e => {
          const r = e.currentTarget.getBoundingClientRect();
          // En el celular la ventana sale abajo a lo ancho; en PC junto al botón,
          // sin salirse de la pantalla por ningún lado.
          if (window.innerWidth < 640) setPos({ left: 8, right: 8, bottom: 8 });
          else {
            const w = 288, left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
            const top = r.bottom + 6 + 360 > window.innerHeight ? Math.max(8, r.top - 366) : r.bottom + 6;
            setPos({ left, top });
          }
          setAbierto(v => !v);
        }}
        className={className || 'px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer'}>
        <Printer className="w-4 h-4" /><span>{etiqueta}</span>
      </button>
      {abierto && createPortal(
        <>
          <div className="fixed inset-0 z-[120] bg-slate-900/30 sm:bg-transparent" onClick={() => setAbierto(false)} />
          <div style={pos} className="fixed z-[130] sm:w-72 bg-white rounded-2xl shadow-2xl p-3 space-y-2.5 text-slate-700 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-500">Imprimir / PDF</span>
              <button onClick={() => setAbierto(false)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div>
              <p className="text-[11px] font-bold mb-1">Tamaño de papel</p>
              <div className="grid grid-cols-4 gap-1">
                {TAMANOS_PAPEL.map(t => (
                  <button key={t} onClick={() => setOp(o => ({ ...o, tamano: t }))}
                    className={`px-1.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${op.tamano === t ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 hover:bg-slate-200'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold mb-1">Orientación</p>
              <div className="grid grid-cols-2 gap-1">
                {([['portrait', 'Vertical'], ['landscape', 'Horizontal']] as [Orientacion, string][]).map(([k, l]) => (
                  <button key={k} onClick={() => setOp(o => ({ ...o, orientacion: k }))}
                    className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${op.orientacion === k ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    <span className={`inline-block border-2 border-current rounded-sm ${k === 'portrait' ? 'w-2.5 h-3.5' : 'w-3.5 h-2.5'}`} />{l}
                  </button>
                ))}
              </div>
            </div>
            {['A2', 'A1', 'A0'].includes(op.tamano) && <p className="text-[10px] font-bold text-amber-700 bg-amber-50 rounded-lg px-2 py-1">{op.tamano} es para plotter: elige "Guardar como PDF" y lleva el PDF a imprimir.</p>}
            <p className="text-[10px] text-slate-400 leading-snug">{unaHoja ? 'El plano se ajusta a una sola hoja del tamaño elegido. ' : ''}Solo se imprime el documento, sin menús ni botones. Para PDF elige "Guardar como PDF" en el diálogo.</p>
            <button onClick={imprimir} className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-black cursor-pointer hover:bg-slate-800 flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Imprimir {op.tamano} {op.orientacion === 'portrait' ? 'vertical' : 'horizontal'}
            </button>
          </div>
        </>, document.body)}
    </>
  );
}
