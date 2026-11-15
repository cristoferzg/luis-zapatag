// Pestañas compactas para el celular (hasta tablet), integradas en la página: sin cuadro blanco,
// solo el texto con una raya de color debajo de la activa (pedido del dueño, 15/11/2026: que no
// vayan "como un cuadrado"). Mismo estilo que "Contratos / Documentos EPP" y la Academia.
// En PC cada apartado sigue mostrando sus pestañas de siempre (este componente se oculta).
import React from 'react';

export interface PestanaMovil<T extends string> { id: T; label: string; icon?: React.ComponentType<{ className?: string }> }

export default function PestanasMovil<T extends string>({ pestanas, activa, onCambio, className = '' }: {
  pestanas: PestanaMovil<T>[]; activa: T; onCambio: (id: T) => void; className?: string;
}) {
  return (
    <div className={`xl:hidden flex w-full gap-1 border-b border-slate-200 ${className}`}>
      {pestanas.map(p => {
        const Ic = p.icon;
        const on = p.id === activa;
        return (
          <button key={p.id} type="button" onClick={() => onCambio(p.id)}
            className={`flex-1 min-w-0 min-h-[42px] px-2 -mb-px border-b-[3px] text-[13px] font-black flex flex-row items-center justify-center gap-1.5 [white-space:nowrap] cursor-pointer transition-colors ${on ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>
            {Ic && <Ic className={`w-4 h-4 shrink-0 ${on ? 'text-indigo-600' : 'text-slate-400'}`} />}
            <span className="truncate">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
