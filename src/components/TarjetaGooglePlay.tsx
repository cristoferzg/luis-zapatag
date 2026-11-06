// Inicio (solo en la web): la app ya está en Google Play. Misma forma que las tarjetas del
// Inicio (blanca, borde suave). Se puede ocultar por 30 días. No aparece en la app de Android
// ni en el programa de PC.
import { useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { abrirEnlace, enlaceAndroid, plataforma } from '../lib/appDescargas';
import { safeStorage } from '../lib/storageManager';

const K = 'innova_tarjeta_play_oculta';

export default function TarjetaGooglePlay() {
  const [oculta, setOculta] = useState(() => Number(safeStorage.getItem(K, 0)) > Date.now());
  if (oculta || plataforma() !== 'web') return null;
  const cerrar = () => { safeStorage.setItem(K, Date.now() + 30 * 864e5); setOculta(true); };
  return (
    <div className="relative bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0"><Smartphone className="w-6 h-6" /></div>
      <div className="min-w-0 flex-1 pr-6 sm:pr-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">App para tu celular</p>
        <p className="text-sm font-black text-slate-900">InnovApp en Google Play</p>
        <button type="button" onClick={() => abrirEnlace(enlaceAndroid(null))}
          className="sm:hidden mt-2 inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-slate-900 text-white cursor-pointer">
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true"><path fill="#34d399" d="M4 2.5v19l10-9.5z" /><path fill="#fbbf24" d="M14 12l3.2-3 3.3 1.9c1 .6 1 1.6 0 2.2L17.2 15z" /></svg>
          <span className="text-xs font-bold">Descargar gratis</span>
        </button>
      </div>
      <button type="button" onClick={() => abrirEnlace(enlaceAndroid(null))}
        className="hidden sm:inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-900 text-white cursor-pointer hover:bg-slate-800 shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true"><path fill="#34d399" d="M4 2.5v19l10-9.5z" /><path fill="#fbbf24" d="M14 12l3.2-3 3.3 1.9c1 .6 1 1.6 0 2.2L17.2 15z" /></svg>
        <span className="text-sm font-bold">Descargar gratis</span>
      </button>
      <button type="button" onClick={cerrar} aria-label="Ocultar" title="Ocultar"
        className="absolute top-2 right-2 sm:static w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
    </div>
  );
}
