// Inicio (solo en la web): la app ya está en Google Play. Se puede ocultar por 30 días.
// En la app de Android y en el programa de PC no aparece.
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
    <div className="mx-3 sm:mx-4 xl:mx-6 mt-3 rounded-2xl bg-slate-900 text-white p-3 sm:p-4 flex items-center gap-3 shadow">
      <span className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-300 grid place-items-center shrink-0"><Smartphone className="w-5 h-5" /></span>
      <div className="min-w-0 flex-1">
        <b className="block text-sm">InnovApp ya está en Google Play</b>
        <span className="block text-xs text-slate-300">Instálala en tu celular: entra más rápido y recibe avisos de clases, recursos y tus obras.</span>
      </div>
      <button type="button" onClick={() => abrirEnlace(enlaceAndroid(null))} className="shrink-0 min-h-[40px] px-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer whitespace-nowrap">Descargar</button>
      <button type="button" onClick={cerrar} aria-label="Ocultar" className="shrink-0 w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
    </div>
  );
}
