// Al entrar: si este equipo tiene una versión anterior a la última publicada, avisa y lleva a
// actualizar (obligatorio si el admin lo marcó). En la web, cada N días invita a instalar la
// app de Android / el programa de PC. En la app de Android deja programado un recordatorio.
import { useEffect, useState } from 'react';
import { Download, RefreshCw, Smartphone, Monitor, X } from 'lucide-react';
import {
  ConfigDescargas, escucharDescargas, desactualizado, plataforma, abrirEnlace, recargarUltimaVersion,
  avisoPospuesto, posponerAviso, enlacePlaySeguro, toca, marcarRecordado, programarRecordatorioNativo, esCelularWeb,
  programaPCDesactualizado, avisoPCPospuesto, posponerAvisoPC, versionProgramaPC,
} from '../lib/appDescargas';
import { versionApp } from '../lib/version';

export default function AvisoVersionApp({ sinRecordatorio = false }: { sinRecordatorio?: boolean }) {
  const [cfg, setCfg] = useState<ConfigDescargas | null>(null);
  const [cerrado, setCerrado] = useState(false);
  const [recordOculto, setRecordOculto] = useState(false);
  useEffect(() => escucharDescargas(setCfg), []);
  const plat = plataforma();
  const viejo = !!cfg && desactualizado(cfg);
  useEffect(() => { if (cfg) programarRecordatorioNativo(cfg.recordatorioDias ?? 7, viejo); }, [cfg, viejo]);
  if (!cfg) return null;

  const fecha = cfg.ultima?.fecha || '';
  const obligatoria = !!cfg.ultima?.obligatoria;
  if (viejo && !cerrado && (obligatoria || !avisoPospuesto(fecha))) {
    const enlaceAndroid = enlacePlaySeguro(cfg.android?.url); // en la app de Play: solo la ficha de Play
    const necesitaDescarga = plat === 'android';
    return (
      <div className="fixed inset-0 z-[90] bg-slate-950/60 flex items-end sm:items-center justify-center p-3" role="dialog" aria-modal="true">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 grid gap-3">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-orange-100 text-orange-600 grid place-items-center shrink-0"><RefreshCw className="w-5 h-5" /></span>
            <div className="min-w-0">
              <b className="block text-[15px] text-slate-900">Hay una versión nueva{cfg.ultima?.version ? ` (v${cfg.ultima.version})` : ''}</b>
              <span className="block text-[11px] text-slate-400">Tienes la v{versionApp}</span>
              <span className="block text-xs text-slate-500">{obligatoria ? 'Debes actualizar para seguir usando la app.' : 'Actualiza para recibir las mejoras.'}</span>
            </div>
          </div>
          {cfg.ultima?.nota && <p className="text-[13px] text-slate-700 bg-slate-50 rounded-xl p-3 whitespace-pre-line">{cfg.ultima.nota}</p>}
          {necesitaDescarga ? (
            enlaceAndroid
              ? <button onClick={() => abrirEnlace(enlaceAndroid)} className="min-h-[48px] rounded-xl bg-orange-500 text-white font-black flex items-center justify-center gap-2 cursor-pointer"><Download className="w-4 h-4" /> Descargar la actualización</button>
              : <p className="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">El enlace de descarga aún no está publicado. Escríbenos en Ayuda y soporte.</p>
          ) : (
            <button onClick={() => recargarUltimaVersion()} className="min-h-[48px] rounded-xl bg-orange-500 text-white font-black flex items-center justify-center gap-2 cursor-pointer"><RefreshCw className="w-4 h-4" /> Actualizar ahora</button>
          )}
          {!obligatoria && <button onClick={() => { posponerAviso(fecha); setCerrado(true); }} className="min-h-[44px] rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer">Más tarde</button>}
        </div>
      </div>
    );
  }

  // Programa de PC antiguo: invita a descargar el instalador nuevo (se instala encima, sin perder nada).
  if (plat === 'pc' && !recordOculto && programaPCDesactualizado(cfg) && !avisoPCPospuesto(cfg.pc!.version!)) {
    const cerrarPC = () => { posponerAvisoPC(cfg.pc!.version!); setRecordOculto(true); };
    return (
      <div className="fixed right-6 bottom-6 w-[360px] z-[70] bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 grid gap-2">
        <div className="flex items-start gap-2">
          <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 grid place-items-center shrink-0"><Monitor className="w-4 h-4" /></span>
          <div className="min-w-0 flex-1"><b className="block text-sm text-slate-900">Programa de PC nuevo (v{cfg.pc!.version})</b><span className="block text-xs text-slate-500">Tienes la v{versionProgramaPC()}. Descárgalo e instálalo encima: tus datos se mantienen.</span></div>
          <button onClick={cerrarPC} aria-label="Cerrar" className="w-9 h-9 grid place-items-center rounded-lg text-slate-400 cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { abrirEnlace(cfg.pc!.url); cerrarPC(); }} className="flex-1 min-h-[40px] rounded-xl bg-orange-500 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"><Download className="w-4 h-4" /> Descargar</button>
          <button onClick={cerrarPC} className="flex-1 min-h-[40px] rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer">Más tarde</button>
        </div>
      </div>
    );
  }

  // Recordatorio en el navegador: instalar la app (solo con enlaces activos).
  if (plat !== 'web' || recordOculto || sinRecordatorio) return null;
  const opciones = [
    cfg.android?.activo && cfg.android.url ? { id: 'android', txt: 'Android', url: cfg.android.url, Ic: Smartphone } : null,
    cfg.iphone?.activo && cfg.iphone.url ? { id: 'iphone', txt: 'iPhone', url: cfg.iphone.url, Ic: Smartphone } : null,
    cfg.pc?.activo && cfg.pc.url ? { id: 'pc', txt: 'Computadora', url: cfg.pc.url, Ic: Monitor } : null,
  ].filter(Boolean) as { id: string; txt: string; url: string; Ic: any }[];
  if (!opciones.length || !toca(cfg.recordatorioDias ?? 7)) return null;
  // En el celular primero la app del celular; en la PC, el programa.
  opciones.sort((a, b) => (esCelularWeb() ? Number(a.id === 'pc') - Number(b.id === 'pc') : Number(b.id === 'pc') - Number(a.id === 'pc')));
  const cerrar = () => { marcarRecordado(); setRecordOculto(true); };
  return (
    <div className="fixed left-3 right-3 bottom-[calc(84px+env(safe-area-inset-bottom))] xl:left-auto xl:right-6 xl:bottom-6 xl:w-[360px] z-[70] bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 grid gap-2">
      <div className="flex items-start gap-2">
        <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 grid place-items-center shrink-0"><Download className="w-4 h-4" /></span>
        <div className="min-w-0 flex-1"><b className="block text-sm text-slate-900">Instala InnovApp</b><span className="block text-xs text-slate-500">Ábrela con un toque y recibe avisos de tus obras.</span></div>
        <button onClick={cerrar} aria-label="Cerrar" className="w-9 h-9 grid place-items-center rounded-lg text-slate-400 cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-2">
        {opciones.map(o => (
          <button key={o.id} onClick={() => { abrirEnlace(o.url); cerrar(); }} className="flex-1 min-w-0 min-h-[40px] rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer [white-space:nowrap]"><o.Ic className="w-4 h-4 shrink-0" /> {o.txt}</button>
        ))}
      </div>
    </div>
  );
}
