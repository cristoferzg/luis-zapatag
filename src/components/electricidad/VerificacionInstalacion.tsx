// Electricidad · Verificación de la instalación: lista de chequeo (✓ / ✗) con el motivo
// de cada resultado. Si el chequeo señala un punto o una tubería, se puede tocar para
// ubicarlo en el plano.
import { useEffect, useState } from 'react';
import { CircleCheck, CircleX, AlertTriangle, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Crosshair } from 'lucide-react';
import type { CheckEle, Verificacion } from './calculoElectricidad';

export default function VerificacionInstalacion({ v, onIr, plegable = false, titulo = 'Verificación de la instalación' }: {
  v: Verificacion; onIr?: (k: CheckEle) => void; plegable?: boolean; titulo?: string;
}) {
  const [abierto, setAbierto] = useState(!plegable || !v.completa);
  // Si aparece algo por corregir, se abre la lista para mostrarlo.
  useEffect(() => { if (!v.completa) setAbierto(true); }, [v.completa]);
  if (!v.checks.length) return null;
  const ok = v.completa;
  return (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2" data-verificacion={ok ? 'completa' : 'pendiente'}>
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-1 min-w-0">
          {ok ? <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />}
          <span className="truncate">{titulo}</span>
        </p>
        {plegable && (
          <button onClick={() => setAbierto(a => !a)} title={abierto ? 'Ocultar' : 'Ver detalle'} className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
            {abierto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      <div className={`rounded-xl px-3 py-2 flex items-center gap-2 ${ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
        {ok ? <CircleCheck className="w-5 h-5 shrink-0" /> : <CircleX className="w-5 h-5 shrink-0" />}
        <div className="min-w-0">
          <p className="text-[13px] font-black leading-tight">{ok ? 'Instalación completa y verificada' : `${v.errores} ${v.errores === 1 ? 'punto' : 'puntos'} por corregir`}</p>
          <p className="text-[10px] font-bold opacity-80 leading-snug">
            {ok ? `${v.checks.length} revisiones del CNE en orden${v.avisos ? ` · ${v.avisos} recomendación${v.avisos === 1 ? '' : 'es'}` : ''}.` : 'Corrige lo marcado con ✗ antes de ejecutar la obra.'}
          </p>
        </div>
      </div>
      {abierto && (
        <ul className="space-y-1">
          {v.checks.map(k => {
            const ir = !!onIr && (!!k.punto || !!k.ruta);
            const color = k.estado === 'ok' ? 'text-emerald-700' : k.estado === 'aviso' ? 'text-amber-700' : 'text-rose-700';
            const fondo = k.estado === 'ok' ? 'bg-slate-50/70' : k.estado === 'aviso' ? 'bg-amber-50' : 'bg-rose-50';
            const Ic = k.estado === 'ok' ? CircleCheck : k.estado === 'aviso' ? AlertTriangle : CircleX;
            const cuerpo = (
              <>
                <Ic className={`w-4 h-4 shrink-0 mt-px ${color}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[11px] font-black leading-snug ${k.estado === 'ok' ? 'text-slate-800' : color}`}>{k.titulo}</span>
                  <span className="block text-[10px] font-semibold text-slate-500 leading-snug">{k.detalle}</span>
                </span>
                {ir && <Crosshair className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />}
              </>
            );
            return (
              <li key={k.id}>
                {ir
                  ? <button type="button" onClick={() => onIr!(k)} className={`w-full text-left flex gap-2 rounded-lg px-2 py-1.5 cursor-pointer hover:brightness-95 ${fondo}`}>{cuerpo}</button>
                  : <div className={`flex gap-2 rounded-lg px-2 py-1.5 ${fondo}`}>{cuerpo}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
