// Pestañas compactas para el celular (hasta tablet): una barra blanca a lo ancho, botones de
// 40 px con una sola línea de texto. Mismo estilo que "Contratos / Documentos EPP".
// En PC cada apartado sigue mostrando sus pestañas de siempre (este componente se oculta).
import React from 'react';

export interface PestanaMovil<T extends string> { id: T; label: string; icon?: React.ComponentType<{ className?: string }> }

export default function PestanasMovil<T extends string>({ pestanas, activa, onCambio, className = '' }: {
  pestanas: PestanaMovil<T>[]; activa: T; onCambio: (id: T) => void; className?: string;
}) {
  return (
    <div className={`xl:hidden flex w-full p-1 gap-1 bg-white border border-slate-200 rounded-xl ${className}`}>
      {pestanas.map(p => {
        const Ic = p.icon;
        const on = p.id === activa;
        return (
          <button key={p.id} type="button" onClick={() => onCambio(p.id)}
            className={`flex-1 min-w-0 min-h-[40px] px-2 rounded-lg text-xs font-bold flex flex-row items-center justify-center gap-1.5 [white-space:nowrap] cursor-pointer transition-colors ${on ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>
            {Ic && <Ic className={`w-4 h-4 shrink-0 ${on ? 'text-white' : 'text-slate-500'}`} />}
            <span className="truncate">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
