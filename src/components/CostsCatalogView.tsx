// =============================================================================
// "Catálogos de costos" (Configuración, solo admin). Antes era una lista suelta
// guardada solo en el navegador que ningún cálculo usaba y que repetía lo que ya
// hacen el Catálogo de precios y Personal. Ahora explica dónde va cada costo y
// lleva al lugar correcto. Si quedaron ítems antiguos, se muestran para pasarlos.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { DollarSign, Users, Truck, ArrowRight, Trash2 } from 'lucide-react';

interface CostItem { id: string; name: string; unitCost: number; provider?: string; category: 'material' | 'labor' | 'operational' }

const ir = (vista: string) => window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: vista }));

const DESTINOS = [
  { vista: 'precios', Ic: DollarSign, c: 'bg-blue-50 text-blue-700 border-blue-200', titulo: 'Materiales y jornales → Catálogo de precios', texto: 'Un solo precio por material (plancha, perfil, bolsa, millar…) y el jornal por día de cada cargo. Lo usan Techos, CarpiMetal, Obra Civil y Drywall al cotizar.' },
  { vista: 'personal', Ic: Users, c: 'bg-emerald-50 text-emerald-700 border-emerald-200', titulo: 'Tus trabajadores → Personal', texto: 'Cada persona con su cargo, su jornal, adelantos y asistencia. El jornal promedio de cada cargo pasa solo al Catálogo de precios.' },
  { vista: 'gastos', Ic: Truck, c: 'bg-amber-50 text-amber-700 border-amber-200', titulo: 'Gastos del día a día → Materiales y gastos', texto: 'Transporte, alquiler de equipos, combustible y boletas de compra de cada proyecto.' },
];

export const CostsCatalogView: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [antiguos, setAntiguos] = useState<CostItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('innova_costs_catalog') || '[]') || []; } catch { return []; }
  });
  const porTipo = useMemo(() => ({ material: 'Material', labor: 'Mano de obra', operational: 'Gasto operativo' }), []);
  if (!isAdmin) return null;

  const borrarAntiguos = () => {
    if (!confirm('¿Borrar la lista antigua de costos? (Solo estaba en este navegador y no la usa ningún cálculo)')) return;
    try { localStorage.removeItem('innova_costs_catalog'); } catch { /* ignore */ }
    setAntiguos([]);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">¿Dónde registro cada costo?</h3>
        <p className="text-xs text-slate-500 mt-0.5">Cada costo tiene un solo lugar, así no se repite ni se contradice en las cotizaciones.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {DESTINOS.map(d => (
          <button key={d.vista} type="button" onClick={() => ir(d.vista)}
            className={`text-left rounded-xl border p-3 cursor-pointer hover:shadow-sm transition-shadow ${d.c}`}>
            <span className="flex items-center gap-2 text-sm font-black"><d.Ic className="w-4 h-4 shrink-0" />{d.titulo}</span>
            <span className="block text-[11px] text-slate-600 mt-1 leading-snug">{d.texto}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold mt-2">Abrir <ArrowRight className="w-3.5 h-3.5" /></span>
          </button>
        ))}
      </div>
      {antiguos.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black text-slate-700">Lista antigua ({antiguos.length}) · pásala al Catálogo de precios</p>
            <button type="button" onClick={borrarAntiguos} className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Borrar</button>
          </div>
          <ul className="mt-2 space-y-1">
            {antiguos.map(c => (
              <li key={c.id} className="flex justify-between gap-2 text-xs text-slate-600">
                <span className="truncate">{c.name} <span className="text-slate-400">· {porTipo[c.category] || ''}{c.provider ? ` · ${c.provider}` : ''}</span></span>
                <span className="font-bold shrink-0">S/ {Number(c.unitCost || 0).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
