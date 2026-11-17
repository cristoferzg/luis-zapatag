// =============================================================================
// Botón "Atajos": muestra de un vistazo los comandos de teclado del apartado.
// También se abre con la tecla "?" y se cierra con Esc o clic afuera.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Keyboard, X } from 'lucide-react';

export interface Atajo { teclas: string[]; accion: string }
export interface GrupoAtajos { titulo: string; atajos: Atajo[] }

export default function AtajosTeclado({ grupos, oscuro = false, onGuiaCompleta, alinear = 'derecha' }: {
  grupos: GrupoAtajos[]; oscuro?: boolean; onGuiaCompleta?: () => void; alinear?: 'izquierda' | 'derecha';
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  // Capa flotante (fuera de barras con scroll): se ubica bajo el botón sin salirse de la pantalla.
  const [pos, setPos] = useState({ left: 8, top: 60 });
  useEffect(() => {
    if (!abierto || !caja.current) return;
    const r = caja.current.getBoundingClientRect(), W = 340;
    const left = alinear === 'derecha' ? r.right - W : r.left;
    setPos({ left: Math.max(8, Math.min(window.innerWidth - W - 8, left)), top: r.bottom + 8 });
  }, [abierto, alinear]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.key === '?') { e.preventDefault(); setAbierto(v => !v); }
      else if (e.key === 'Escape') setAbierto(false);
    };
    const onClic = (e: MouseEvent) => { const t = e.target as Node; if (caja.current?.contains(t) || lista.current?.contains(t)) return; setAbierto(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClic);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClic); };
  }, []);

  return (
    <div ref={caja} className="relative inline-flex">
      <button type="button" onClick={() => setAbierto(v => !v)} title="Atajos de teclado (tecla ?)"
        className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer border transition-colors ${oscuro
          ? (abierto ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700')
          : (abierto ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100')}`}>
        <Keyboard className="w-3.5 h-3.5" /> Atajos
      </button>
      {abierto && createPortal(
        <div ref={lista} style={{ left: pos.left, top: pos.top }} className="fixed z-[80] w-[340px] max-h-[70vh] overflow-y-auto bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-slate-500" />
            <p className="flex-1 text-sm font-black">Atajos de teclado</p>
            <button onClick={() => setAbierto(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          {grupos.map(g => (
            <div key={g.titulo} className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{g.titulo}</p>
              {g.atajos.map(a => (
                <div key={a.accion} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600">{a.accion}</span>
                  <span className="flex gap-1 shrink-0">
                    {a.teclas.map(t => <kbd key={t} className="min-w-[22px] px-1.5 py-0.5 rounded-md border border-slate-300 border-b-2 bg-slate-50 font-mono text-[11px] font-bold text-slate-700 text-center">{t}</kbd>)}
                  </span>
                </div>
              ))}
            </div>
          ))}
          <p className="text-[10px] text-slate-400">Pulsa <kbd className="px-1 rounded border border-slate-300 font-mono">?</kbd> para abrir o cerrar esta lista.</p>
          {onGuiaCompleta && (
            <button onClick={() => { setAbierto(false); onGuiaCompleta(); }} className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer">Ver guía completa de gestos y controles</button>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
