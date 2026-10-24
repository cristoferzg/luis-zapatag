// =============================================================================
// Panel de ADMIN para configurar los PLANES DE IA (precio y usos por mes).
// Los cambios se guardan en la nube y los ven todos los usuarios al instante.
// =============================================================================
import { useEffect, useState } from 'react';
import { Sparkles, Save, Check } from 'lucide-react';
import { AIPlan, getPlanesIA, setPlanesIA, PLANES_IA_DEFAULT } from '../lib/aiAccess';

export default function PlanesIAAdminPanel() {
  const [planes, setPlanes] = useState<AIPlan[]>(PLANES_IA_DEFAULT);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { getPlanesIA().then(setPlanes); }, []);

  const upd = (i: number, campo: keyof AIPlan, valor: string) => {
    setPlanes(prev => prev.map((p, idx) => {
      if (idx !== i) return p;
      if (campo === 'nombre') return { ...p, nombre: valor };
      if (campo === 'precioSoles') return { ...p, precioSoles: parseFloat(valor) || 0 };
      if (campo === 'usosMes') return { ...p, usosMes: Math.max(0, Math.round(parseFloat(valor) || 0)) };
      return p;
    }));
    setGuardado(false);
  };

  const guardar = async () => {
    setGuardando(true);
    try { await setPlanesIA(planes); setGuardado(true); } catch { /* ignore */ }
    finally { setGuardando(false); }
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-fadeIn">
      <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Planes de IA (precios y usos)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define el precio y cuántas lecturas con IA (planos y boletas) incluye cada plan al mes. Usos = 0 significa ilimitado.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
          Solo Administrador
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planes.map((p, i) => (
          <div key={p.id} className="p-4 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nombre</label>
              <input
                value={p.nombre}
                onChange={e => upd(i, 'nombre', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Precio (S/ por mes)</label>
              <input
                type="number" step="0.10" min="0"
                value={p.precioSoles}
                onChange={e => upd(i, 'precioSoles', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-400 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Usos al mes (0 = ilimitado)</label>
              <input
                type="number" step="1" min="0"
                value={p.usosMes}
                onChange={e => upd(i, 'usosMes', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">{p.usosMes === 0 ? 'Ilimitado' : `${p.usosMes} lecturas con IA al mes`}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={guardando}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-2xs ${guardado ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-900 text-white'} disabled:opacity-60`}
        >
          {guardado ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {guardando ? 'Guardando…' : guardado ? 'Guardado' : 'Guardar planes'}
        </button>
        <p className="text-xs text-slate-500">Tú (admin) tienes IA ilimitada para probar. Los usuarios activan un plan y lo validas en “Validar Compras”.</p>
      </div>
    </div>
  );
}
