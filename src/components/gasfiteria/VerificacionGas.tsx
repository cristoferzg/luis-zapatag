// =============================================================================
// Gasfitería · Verificación de la instalación: lista de chequeo IS.010 (✓ / ✗) que sale
// de los avisos del cálculo. Cada observación con aparato o tubería se puede ubicar
// en el plano (onUbicar). Se usa en el Plano y en el Presupuesto.
// =============================================================================
import { useState } from 'react';
import { CircleCheck, CircleX, CircleMinus, TriangleAlert, ShieldCheck, ShieldAlert, LocateFixed, ChevronDown } from 'lucide-react';
import type { Aviso, Chequeo } from './calculoGasfiteria';
import { instalacionVerificada } from './calculoGasfiteria';

const ICONO = { ok: CircleCheck, error: CircleX, aviso: TriangleAlert, na: CircleMinus };
const COLOR = { ok: 'text-emerald-600', error: 'text-rose-600', aviso: 'text-amber-500', na: 'text-slate-300' };

/** Sello general: verde solo si todo lo que aplica está bien. */
export function SelloVerificacion({ chequeos, hayAparatos }: { chequeos: Chequeo[]; hayAparatos: boolean }) {
  const ok = hayAparatos && instalacionVerificada(chequeos);
  const nErr = chequeos.filter(c => c.estado === 'error').length, nAv = chequeos.filter(c => c.estado === 'aviso').length;
  const Ic = ok ? ShieldCheck : ShieldAlert;
  return (
    <div className={`flex flex-nowrap items-center gap-2 rounded-xl px-3 py-2 ${ok ? 'bg-emerald-50 text-emerald-800' : nErr ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>
      <Ic className="w-5 h-5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-black leading-tight">{!hayAparatos ? 'Pon aparatos para verificar la instalación' : ok ? 'Instalación completa y verificada' : nErr ? 'Instalación con errores por corregir' : 'Instalación con observaciones'}</p>
        {hayAparatos && <p className="text-[10px] font-bold opacity-80 leading-tight">{ok ? 'Agua fría, agua caliente, desagüe y ventilación según IS.010.' : `${nErr ? `${nErr} punto${nErr > 1 ? 's' : ''} con error` : ''}${nErr && nAv ? ' · ' : ''}${nAv ? `${nAv} con observación` : ''}`}</p>}
      </div>
    </div>
  );
}

export default function VerificacionGas({ chequeos, hayAparatos, onUbicar, compacta = false }: { chequeos: Chequeo[]; hayAparatos: boolean; onUbicar?: (a: Aviso) => void; compacta?: boolean }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  return (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <p className="text-xs font-black text-slate-800 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-teal-600" /> Verificación de la instalación <span className="font-semibold text-slate-400">(IS.010)</span></p>
      <SelloVerificacion chequeos={chequeos} hayAparatos={hayAparatos} />
      {hayAparatos && (
        <ul className={compacta ? 'grid sm:grid-cols-2 gap-x-3 gap-y-0.5' : 'divide-y divide-slate-100'}>
          {chequeos.map(c => {
            const Ic = ICONO[c.estado], malo = c.estado === 'error' || c.estado === 'aviso';
            const ver = !compacta && malo && abierto === c.cat;
            return (
              <li key={c.cat} className={compacta ? '' : 'py-1'}>
                <button type="button" disabled={compacta || !malo} onClick={() => setAbierto(a => (a === c.cat ? null : c.cat))}
                  className={`w-full flex flex-nowrap items-start gap-2 text-left min-h-[32px] py-1 ${!compacta && malo ? 'cursor-pointer' : 'cursor-default'}`}>
                  <Ic className={`w-4 h-4 shrink-0 mt-0.5 ${COLOR[c.estado]}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[11px] font-black leading-snug ${c.estado === 'na' ? 'text-slate-400' : 'text-slate-800'}`}>{c.titulo}</span>
                    {!compacta && <span className={`block text-[10px] leading-snug ${c.estado === 'error' ? 'text-rose-700 font-bold' : c.estado === 'aviso' ? 'text-amber-700 font-bold' : 'text-slate-400'}`}>{c.detalle}{c.avisos.length > 1 ? ` (+${c.avisos.length - 1} más)` : ''}</span>}
                  </span>
                  {!compacta && malo && <ChevronDown className={`w-4 h-4 shrink-0 mt-0.5 text-slate-400 transition-transform ${ver ? 'rotate-180' : ''}`} />}
                </button>
                {ver && (
                  <div className="pl-6 pb-1 space-y-1">
                    {c.avisos.map((a, i) => (
                      <div key={i} className={`flex flex-nowrap items-start gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold ${a.nivel === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}>
                        <span className="flex-1 min-w-0">{a.texto}</span>
                        {onUbicar && (a.ap || a.tramo) && (
                          <button type="button" onClick={() => onUbicar(a)} title="Ver en el plano"
                            className="shrink-0 inline-flex items-center gap-1 min-h-[28px] px-2 rounded-md bg-white/80 text-[10px] font-black text-slate-700 cursor-pointer hover:bg-white">
                            <LocateFixed className="w-3.5 h-3.5" /> Ver
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
