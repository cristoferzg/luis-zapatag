// Inicio, SOLO en el NAVEGADOR de un celular Android (Chrome):
//  • Sin la app: invita a descargarla de Google Play y recuerda que aquí (navegador) puede recargar
//    con Yape o Plin, con los mismos créditos.
//  • Con la app: tarjeta corta "Recarga con Yape o Plin aquí": en la app de Play no se puede pagar
//    por fuera de Google, pero en el navegador sí.
// En la PC, en el programa de PC y dentro de la app no aparece. Se puede ocultar por 30 días.
import { useEffect, useState } from 'react';
import { Download, Smartphone, X, Coins } from 'lucide-react';
import { abrirEnlace, enlaceAndroid, plataforma, appEnCuenta, appInstaladaEnEsteCelular } from '../lib/appDescargas';
import { safeStorage } from '../lib/storageManager';
import { iaVisibleParaUI } from '../lib/aiAccess';
import { leerPagoDirecto, pagoDirectoListo } from '../lib/pagoDirecto';

const K_RECARGA = 'innova_tarjeta_recarga_web_oculta';
const irARecargas = () => {
  window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'membresia' }));
  setTimeout(() => document.getElementById('recargas-ia')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 600);
};

const K = 'innova_tarjeta_play_oculta';
const androidEnNavegador = () => plataforma() === 'web' && typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

export default function TarjetaGooglePlay() {
  const [oculta, setOculta] = useState(() => Number(safeStorage.getItem(K, 0)) > Date.now());
  // Si ya tiene la app (en su cuenta o en este celular), no se le pide descargarla.
  const [yaLaTiene, setYaLaTiene] = useState(() => appEnCuenta() || !!(import.meta.env.DEV && (window as any).__appEnCuentaSimulada));
  // ¿Se puede recargar aquí con Yape/Plin? (IA activa para usuarios y cobro directo listo)
  const [yapeListo, setYapeListo] = useState(false);
  const [recargaOculta, setRecargaOculta] = useState(() => Number(safeStorage.getItem(K_RECARGA, 0)) > Date.now());
  useEffect(() => { leerPagoDirecto().then(c => setYapeListo(pagoDirectoListo(c))); }, []);
  useEffect(() => {
    const f = () => setYaLaTiene(v => v || appEnCuenta());
    window.addEventListener('innova_app_en_cuenta', f);
    appInstaladaEnEsteCelular().then(si => { if (si) setYaLaTiene(true); });
    return () => window.removeEventListener('innova_app_en_cuenta', f);
  }, []);
  if (!androidEnNavegador()) return null;
  const conYape = yapeListo && iaVisibleParaUI(); // la IA debe estar activa para los usuarios
  const cerrar = () => { safeStorage.setItem(K, Date.now() + 30 * 864e5); setOculta(true); };
  const btnYape = (
    <button type="button" onClick={irARecargas}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#742284] text-white text-sm font-bold cursor-pointer active:opacity-90">
      <Coins className="w-4 h-4" /> Recargar con Yape o Plin
    </button>
  );
  // Ya tiene la app: solo el recordatorio de recargar aquí (si el cobro directo está listo).
  if (yaLaTiene || oculta) {
    if (!conYape || recargaOculta) return null;
    return (
      <div className="relative p-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-teal-50 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-[#742284] text-white rounded-xl shrink-0"><Coins className="w-6 h-6" /></div>
        <div className="min-w-0 flex-1 pr-6">
          <p className="text-sm font-black text-slate-900">Recarga créditos con Yape o Plin aquí</p>
          <p className="text-xs text-slate-600">Desde el navegador pagas con Yape o Plin en segundos. Tus créditos son los mismos: los usas en la app y en la computadora.</p>
          <div className="mt-2">{btnYape}</div>
        </div>
        <button type="button" onClick={() => { safeStorage.setItem(K_RECARGA, Date.now() + 30 * 864e5); setRecargaOculta(true); }} aria-label="Ocultar" title="Ocultar"
          className="absolute top-2 right-2 w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
    );
  }
  return (
    <div className="relative bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0"><Smartphone className="w-6 h-6" /></div>
      <div className="min-w-0 flex-1 pr-6">
        <p className="text-sm font-black text-slate-900">Descarga la app InnovApp</p>
        <p className="text-xs text-slate-500">Ya está disponible en Google Play. Instálala para entrar más rápido y recibir avisos.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => abrirEnlace(enlaceAndroid(null))}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-orange-500 text-white text-sm font-bold cursor-pointer active:bg-orange-600">
            <Download className="w-4 h-4" /> Descargar app
          </button>
          {conYape && btnYape}
        </div>
        {conYape && <p className="mt-2 text-[11px] text-slate-500">💡 Para recargar créditos con <b>Yape o Plin</b>, hazlo desde aquí (el navegador). Son los mismos créditos en la app y en la computadora.</p>}
      </div>
      <button type="button" onClick={cerrar} aria-label="Ocultar" title="Ocultar"
        className="absolute top-2 right-2 w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
    </div>
  );
}
