// "Proyecto": vincula la cotización de un apartado (Gasfitería, Electricidad, Drywall, Melamina…)
// con un proyecto ya creado en Proyectos & Clientes. Al elegirlo se llenan solos la obra y el
// cliente, y queda guardado el id del proyecto. "Sin proyecto" quita el vínculo (no borra nada).
import { useEffect, useRef, useState } from 'react';
import { Briefcase, Check, ChevronDown, Search, X } from 'lucide-react';
import { useProyectos } from '../../lib/proyectosActivos';
import type { Project } from '../../types';

interface Props {
  proyectoId?: string;
  onElegir: (p: Project | null) => void;
  className?: string;
}

export default function ElegirProyecto({ proyectoId, onElegir, className = '' }: Props) {
  const proyectos = useProyectos();
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState('');
  const caja = useRef<HTMLDivElement>(null);
  const actual = proyectos.find(p => p.id === proyectoId);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => { if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);
  const t = q.trim().toLowerCase();
  const visibles = proyectos
    .filter(p => !t || `${p.name} ${p.client}`.toLowerCase().includes(t))
    .sort((a, b) => Number(a.status === 'Completado') - Number(b.status === 'Completado') || (b.date || '').localeCompare(a.date || ''));

  return (
    <div ref={caja} className={`relative min-w-0 ${className}`}>
      <button type="button" onClick={() => setAbierto(v => !v)}
        className={`w-full min-h-[40px] inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold cursor-pointer border ${actual ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
        <Briefcase className="w-4 h-4 shrink-0" />
        <span className="truncate flex-1 text-left">{actual ? actual.name : 'Vincular a un proyecto'}</span>
        <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
      </button>
      {abierto && (
        <div className="absolute z-40 left-0 right-0 sm:right-auto sm:w-[340px] mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar proyecto o cliente…" className="flex-1 min-w-0 text-sm py-1.5 focus:outline-none" />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {!proyectos.length && <p className="p-3 text-xs text-slate-500">Aún no tienes proyectos. Créalos en <b>Proyectos & Clientes</b> y aquí aparecerán.</p>}
            {visibles.map(p => (
              <button key={p.id} type="button" onClick={() => { onElegir(p); setAbierto(false); setQ(''); }}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2 cursor-pointer hover:bg-slate-50 ${p.id === proyectoId ? 'bg-indigo-50/60' : ''}`}>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800 truncate">{p.name}</span>
                  <span className="block text-[11px] text-slate-500 truncate">{p.client || 'Sin cliente'} · {p.status}</span>
                </span>
                {p.id === proyectoId && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
              </button>
            ))}
          </div>
          {actual && (
            <button type="button" onClick={() => { onElegir(null); setAbierto(false); }} className="w-full px-3 py-2.5 border-t border-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" /> Quitar el vínculo (sin proyecto)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
