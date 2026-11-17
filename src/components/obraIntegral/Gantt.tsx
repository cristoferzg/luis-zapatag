// Diagrama de Gantt del Presupuesto de obra: una barra por apartado o tarea, sobre
// los días del calendario (domingos y, si no se trabaja, sábados sombreados).
// Se desplaza a lo ancho solo dentro del gráfico; en "compacto" (documento
// impreso) se ajusta al ancho de la hoja.
import { useEffect, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import { BarraCrono, fechaHabil, habil, fechaCorta } from './modelo';

const DIA = 86400000;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

export default function Gantt({ barras, inicio, sabado, compacto = false, seleccion, onSeleccionar }: {
  barras: BarraCrono[]; inicio: string; sabado: boolean; compacto?: boolean;
  seleccion?: string | null; onSeleccionar?: (id: string) => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = caja.current;
    if (!el || compacto) return;
    const ro = new ResizeObserver(() => setAncho(el.clientWidth));
    ro.observe(el); setAncho(el.clientWidth);
    return () => ro.disconnect();
  }, [compacto]);
  if (!barras.length) return null;
  const d0 = fechaHabil(inicio, 0, sabado);
  const totalHab = barras.reduce((m, b) => Math.max(m, b.fin), 0);
  const dN = fechaHabil(inicio, Math.max(0, totalHab - 1), sabado);
  const cal = Math.round((dN.getTime() - d0.getTime()) / DIA) + 1;
  const dias = Array.from({ length: cal }, (_, i) => new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i));
  const pos = (n: number) => Math.round((fechaHabil(inicio, n, sabado).getTime() - d0.getTime()) / DIA);
  // Meses visibles (para la fila de arriba).
  const meses: { etiqueta: string; desde: number; n: number }[] = [];
  dias.forEach((d, i) => {
    const et = `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    const u = meses[meses.length - 1];
    if (u && u.etiqueta === et) u.n++; else meses.push({ etiqueta: et, desde: i, n: 1 });
  });
  // Ancho por día: llena el gráfico; si no entra, un mínimo y se desplaza a lo ancho.
  const minimo = ancho && ancho < 400 ? 11 : 14;
  const pxDia = compacto ? 0 : Math.max(minimo, ancho / cal || 0);
  const verNumeros = compacto ? cal <= 45 : pxDia >= 19;
  const alto = compacto ? 'h-6' : 'h-10';
  const pct = (n: number) => `${(n / cal) * 100}%`;
  // Si hay muchos días, una marca cada semana (lunes) en vez de cada día.
  const marca = (d: Date, i: number) => verNumeros || d.getDay() === 1 || i === 0;

  return (
    <div className={`flex ${compacto ? 'text-[9px]' : 'text-[11px]'} select-none`}>
      {/* Nombres */}
      <div className={`${compacto ? 'w-36' : 'w-[118px] sm:w-48'} shrink-0 border-r border-slate-200`}>
        <div className={`${compacto ? 'h-8' : 'h-11'} border-b border-slate-200 flex items-end pb-1 px-2 font-black uppercase text-[9px] text-slate-400`}>Partida</div>
        {barras.map(b => (
          <button key={b.id} type="button" onClick={() => onSeleccionar?.(b.id)} disabled={!onSeleccionar}
            className={`${alto} w-full flex items-center gap-1.5 px-2 border-b border-slate-100 text-left ${seleccion === b.id ? 'bg-indigo-50' : ''} ${onSeleccionar ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'}`}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color }} />
            <span className="font-bold text-slate-700 truncate leading-tight">{b.nombre}</span>
          </button>
        ))}
      </div>
      {/* Días */}
      <div ref={caja} className={`flex-1 min-w-0 ${compacto ? '' : 'overflow-x-auto overscroll-x-contain'}`}>
        <div className="relative" style={{ minWidth: pxDia ? Math.floor(cal * pxDia) : undefined }}>
          <div className={`${compacto ? 'h-8' : 'h-11'} border-b border-slate-200 relative`}>
            {meses.map(m => (
              <div key={m.etiqueta + m.desde} className="absolute top-0 h-1/2 border-l border-slate-200 px-1 font-black uppercase text-[9px] text-slate-500 truncate" style={{ left: pct(m.desde), width: pct(m.n) }}>{m.etiqueta}</div>
            ))}
            {dias.map((d, i) => marca(d, i) && (
              <div key={i} className={`absolute bottom-0 h-1/2 flex items-center justify-center font-mono ${habil(d, sabado) ? 'text-slate-500' : 'text-rose-400'}`} style={{ left: pct(i), width: verNumeros ? pct(1) : undefined }}>{d.getDate()}</div>
            ))}
          </div>
          <div className="relative">
            {/* Fondo: días no laborables */}
            {dias.map((d, i) => !habil(d, sabado) && <div key={i} className="absolute inset-y-0 bg-slate-100" style={{ left: pct(i), width: pct(1) }} />)}
            {barras.map(b => {
              const a = pos(b.ini), z = pos(b.fin - 1) + 1;
              return (
                <div key={b.id} className={`${alto} relative border-b border-slate-100 ${seleccion === b.id ? 'bg-indigo-50/60' : ''}`} onClick={() => onSeleccionar?.(b.id)}>
                  <div className={`absolute ${compacto ? 'top-1 bottom-1' : 'top-2 bottom-2'} rounded-md shadow-xs flex items-center overflow-hidden ${onSeleccionar ? 'cursor-pointer' : ''}`}
                    style={{ left: pct(a), width: pct(z - a), background: b.color }} title={`${b.nombre}: ${b.dias} días`}>
                    <span className="px-1.5 text-white font-black whitespace-nowrap drop-shadow-sm">{b.dias} d</span>
                  </div>
                </div>
              );
            })}
            {/* Entrega */}
            <div className="absolute inset-y-0 border-r-2 border-dashed border-rose-500" style={{ left: pct(cal) , transform: 'translateX(-2px)' }} />
          </div>
          {!compacto && (
            <div className="flex justify-end pt-1.5 pr-1 text-[10px] font-black text-rose-600">
              <span className="inline-flex items-center gap-1"><Flag className="w-3 h-3" /> Entrega {fechaCorta(dN)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
