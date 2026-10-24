// Carrusel de destacados (Academia y Recursos): cambia solo cada 5 s, se puede
// deslizar con el dedo y cada lámina tiene su botón de acción.
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface LaminaSlider {
  id: string;
  titulo: string;
  descripcion?: string;
  imagen?: string;
  etiqueta?: string;
  precio?: number;        // undefined o 0 con gratis = "Gratis"
  precioAntes?: number;
  gratis?: boolean;
  sinPrecio?: boolean;     // app Android: no se muestran precios ni ofertas
  descuentoPct?: number;
  descuentoHasta?: string;
  textoBoton: string;
  onAccion: () => void;
}

const restante = (hasta?: string) => {
  if (!hasta) return null;
  const ms = new Date(hasta).getTime() - Date.now();
  if (!(ms > 0)) return null;
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
};

export default function SliderDestacados({ laminas }: { laminas: LaminaSlider[] }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [, setTic] = useState(0);
  const toque = useRef<number | null>(null);
  const total = laminas.length;

  useEffect(() => { if (i >= total) setI(0); }, [total, i]);
  useEffect(() => {
    if (total < 2 || pausa) return;
    const t = setInterval(() => setI(x => (x + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total, pausa]);
  // Reloj de la cuenta regresiva.
  useEffect(() => {
    if (!laminas.some(l => l.descuentoHasta)) return;
    const t = setInterval(() => setTic(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [laminas]);

  if (!total) return null;
  const ir = (d: number) => setI(x => (x + d + total) % total);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-lg select-none"
      onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}
      onTouchStart={e => { toque.current = e.touches[0].clientX; setPausa(true); }}
      onTouchEnd={e => {
        const x0 = toque.current; toque.current = null; setPausa(false);
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
      }}>
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {laminas.map(l => {
          const cuenta = l.descuentoPct && !l.sinPrecio ? restante(l.descuentoHasta) : null;
          const conDescuento = !l.sinPrecio && !l.gratis && !!l.descuentoPct && (!l.descuentoHasta || !!cuenta);
          const final = l.gratis ? 0 : conDescuento ? +((l.precio || 0) * (1 - (l.descuentoPct || 0) / 100)).toFixed(2) : (l.precio || 0);
          const antes = l.gratis ? 0 : conDescuento ? (l.precio || 0) : (l.precioAntes || 0) > final ? l.precioAntes! : 0;
          return (
            <div key={l.id} className="relative w-full shrink-0 min-h-[200px] sm:min-h-[240px]">
              {l.imagen
                ? <img src={l.imagen} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                : <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-slate-800 to-slate-900" />}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/10" />
              <div className="relative p-5 sm:p-8 max-w-xl space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-md"><Sparkles className="w-3 h-3" />{l.etiqueta || 'Destacado'}</span>
                  {conDescuento && <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">-{l.descuentoPct}%</span>}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight line-clamp-2">{l.titulo}</h3>
                {l.descripcion && <p className="text-xs sm:text-sm text-slate-200 line-clamp-2">{l.descripcion}</p>}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {!l.sinPrecio && <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white">{l.gratis ? 'Gratis' : `S/ ${final.toFixed(2)}`}</span>
                    {antes > 0 && <span className="text-sm text-slate-300 line-through">S/ {antes.toFixed(2)}</span>}
                  </div>}
                  <button type="button" onClick={l.onAccion} className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-sm font-black shadow cursor-pointer">{l.textoBoton}</button>
                </div>
                {cuenta && <p className="text-[11px] font-mono font-bold text-amber-200">⏳ La oferta termina en {cuenta}</p>}
              </div>
            </div>
          );
        })}
      </div>
      {total > 1 && (
        <>
          <button type="button" onClick={() => ir(-1)} aria-label="Anterior" className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white items-center justify-center cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
          <button type="button" onClick={() => ir(1)} aria-label="Siguiente" className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white items-center justify-center cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
          <div className="absolute bottom-2.5 right-4 flex gap-1.5">
            {laminas.map((l, k) => (
              <button key={l.id} type="button" onClick={() => setI(k)} aria-label={`Ir a ${k + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${k === i ? 'w-6 bg-amber-400' : 'w-2 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
