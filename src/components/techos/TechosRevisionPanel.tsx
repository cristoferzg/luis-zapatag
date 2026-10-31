// =============================================================================
// Panel "Revisar diseño": lista lo que puede descuadrar el techo (nodos
// repetidos, perfiles duplicados, extremos que no conectan, columnas en el
// aire…). "Ver" resalta los elementos en el lienzo; "Arreglar" lo corrige y se
// puede deshacer. Es un panel flotante para seguir viendo el dibujo.
// =============================================================================
import { useMemo } from 'react';
import { ShieldCheck, X, Eye, Wrench, CheckCircle2 } from 'lucide-react';
import type { UseTechosCadEngineReturn } from './useTechosCadEngineState';
import { revisar, arreglar, arreglarTodo, conPlacaCabeza, NOMBRE_TIPO, Problema, TipoProblema } from './revisionDiseno';

export function useRevisionDiseno(engineState: UseTechosCadEngineReturn | null | undefined) {
  return useMemo(() => engineState ? revisar({ nodes: engineState.nodes, segments: engineState.segments, coverageZones: engineState.coverageZones }) : [],
    [engineState?.nodes, engineState?.segments, engineState?.coverageZones]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function TechosRevisionPanel({ engineState, onClose }: { engineState: UseTechosCadEngineReturn; onClose: () => void }) {
  const problemas = useRevisionDiseno(engineState);
  const grupos = useMemo(() => {
    const g = new Map<TipoProblema, Problema[]>();
    problemas.forEach(p => g.set(p.tipo, [...(g.get(p.tipo) || []), p]));
    return [...g.entries()];
  }, [problemas]);

  const aplicar = (lista: Problema[] | 'todo') => {
    const esc = { nodes: engineState.nodes, segments: engineState.segments, coverageZones: engineState.coverageZones };
    const e = lista === 'todo' ? arreglarTodo(esc) : arreglar(esc, lista);
    engineState.replaceScene(e.nodes, e.segments, e.coverageZones);
  };

  return (
    <div className="fixed z-[60] right-3 bottom-3 sm:right-4 sm:bottom-4 w-[calc(100vw-24px)] sm:w-[400px] max-h-[70vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-slate-900">Revisar diseño</h3>
          <p className="text-[11px] text-slate-500 leading-tight">Elementos sueltos, repetidos o que no conectan.</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer" title="Cerrar"><X className="w-4 h-4" /></button>
      </div>

      {problemas.length === 0 ? (
        <div className="p-6 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Todo conectado</p>
          <p className="text-xs text-slate-500">No hay nodos repetidos, perfiles duplicados ni extremos sueltos.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-amber-700">{problemas.length} detalle{problemas.length > 1 ? 's' : ''} por revisar</span>
            <button onClick={() => aplicar('todo')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer">
              <Wrench className="w-3.5 h-3.5" /> Arreglar todo
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {grupos.map(([tipo, lista]) => (
              <div key={tipo} className="space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{NOMBRE_TIPO[tipo]} · {lista.length}</p>
                {lista.map(p => (
                  <div key={p.id} className="rounded-xl border border-slate-200 p-2.5 space-y-1.5">
                    <p className="text-xs font-bold text-slate-800 first-letter:uppercase">{p.titulo}</p>
                    <p className="text-[11px] text-slate-500 leading-snug">{p.detalle}</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => engineState.setSelectedElementIds(p.ids)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                      {p.tipo === 'viga_ancha' && (
                        <button onClick={() => { const e = conPlacaCabeza({ nodes: engineState.nodes, segments: engineState.segments, coverageZones: engineState.coverageZones }, p); engineState.replaceScene(e.nodes, e.segments, e.coverageZones); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold cursor-pointer" title="Se suma una placa de cabeza al presupuesto">
                          Placa de cabeza
                        </button>
                      )}
                      {(p.tipo !== 'viga_ancha' || p.perfilNuevo) && <button onClick={() => aplicar([p])} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold cursor-pointer" title={p.tipo === 'viga_ancha' ? `Cambiar la columna a ${p.perfilNuevoNombre}` : undefined}>
                        <Wrench className="w-3.5 h-3.5" /> {p.tipo === 'viga_ancha' ? 'Subir columna' : 'Arreglar'}
                      </button>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="px-4 py-2 text-[10px] text-slate-400 border-t border-slate-100">"Ver" marca los elementos en el plano. Cada arreglo se puede deshacer.</p>
        </>
      )}
    </div>
  );
}
