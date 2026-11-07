// Inicio: a quien entra desde el NAVEGADOR de un celular Android se le invita a descargar la app
// (ya está en Google Play). En el navegador de la PC, en el programa de PC y dentro de la app no
// aparece. Misma forma que las tarjetas del Inicio; se puede ocultar por 30 días.
import { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { abrirEnlace, enlaceAndroid, plataforma, appEnCuenta, appInstaladaEnEsteCelular } from '../lib/appDescargas';
import { safeStorage } from '../lib/storageManager';

const K = 'innova_tarjeta_play_oculta';
const androidEnNavegador = () => plataforma() === 'web' && typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

export default function TarjetaGooglePlay() {
  const [oculta, setOculta] = useState(() => Number(safeStorage.getItem(K, 0)) > Date.now());
  // Si ya tiene la app (en su cuenta o en este celular), no se le pide descargarla.
  const [yaLaTiene, setYaLaTiene] = useState(appEnCuenta);
  useEffect(() => {
    const f = () => setYaLaTiene(v => v || appEnCuenta());
    window.addEventListener('innova_app_en_cuenta', f);
    appInstaladaEnEsteCelular().then(si => { if (si) setYaLaTiene(true); });
    return () => window.removeEventListener('innova_app_en_cuenta', f);
  }, []);
  if (oculta || yaLaTiene || !androidEnNavegador()) return null;
  const cerrar = () => { safeStorage.setItem(K, Date.now() + 30 * 864e5); setOculta(true); };
  return (
    <div className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0"><Smartphone className="w-6 h-6" /></div>
      <div className="min-w-0 flex-1 pr-6">
        <p className="text-sm font-black text-slate-900">Descarga la app InnovApp</p>
        <p className="text-xs text-slate-500">Ya está disponible en Google Play. Instálala para entrar más rápido y recibir avisos.</p>
        <button type="button" onClick={() => abrirEnlace(enlaceAndroid(null))}
          className="mt-2 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-orange-500 text-white text-sm font-bold cursor-pointer active:bg-orange-600">
          <Download className="w-4 h-4" /> Descargar app
        </button>
      </div>
      <button type="button" onClick={cerrar} aria-label="Ocultar" title="Ocultar"
        className="absolute top-2 right-2 w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
    </div>
  );
}
