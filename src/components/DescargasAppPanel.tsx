// Configuración → "Descargar la app": el admin pone los enlaces (Google Play, programa de
// PC, iPhone), los activa o desactiva, elige cada cuánto recordar y avisa de versión nueva.
// Los usuarios ven solo los botones de descarga activos.
import { useEffect, useRef, useState } from 'react';
import { Smartphone, Monitor, Download, RefreshCw, Check, Bell, Upload } from 'lucide-react';
import { ConfigDescargas, EnlaceApp, escucharDescargas, guardarDescargas, BUILD_ACTUAL, abrirEnlace, plataforma, esEnlacePlay, versionDeInstalador, enlaceAndroid } from '../lib/appDescargas';
import { uploadFileToFirebaseStorage } from '../lib/storage';
import { versionApp } from '../lib/version';

const fechaBonita = (iso?: string) => { try { return iso ? new Date(iso).toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '') : ''; } catch { return ''; } };
const FILAS: { id: 'android' | 'pc' | 'iphone'; nombre: string; ayuda: string; ph: string; Ic: any }[] = [
  { id: 'android', nombre: 'Android (Google Play)', ayuda: 'Enlace de la ficha en Google Play (no un APK: Play no lo permite dentro de su app).', ph: 'https://play.google.com/store/apps/details?id=…', Ic: Smartphone },
  { id: 'pc', nombre: 'Computadora (Windows)', ayuda: 'Sube el instalador .exe aquí (o pega un enlace de Drive, OneDrive, GitHub…).', ph: 'https://…/InnovApp-Setup.exe', Ic: Monitor },
  { id: 'iphone', nombre: 'iPhone (App Store)', ayuda: 'Déjalo desactivado hasta que la app esté publicada.', ph: 'https://apps.apple.com/…', Ic: Smartphone },
];

export default function DescargasAppPanel({ isAdmin, onAvisar }: { isAdmin: boolean; onAvisar?: (titulo: string, mensaje: string) => void }) {
  const [cfg, setCfg] = useState<ConfigDescargas>({});
  const [borrador, setBorrador] = useState<ConfigDescargas | null>(null);
  const [nota, setNota] = useState('');
  const [obligatoria, setObligatoria] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => escucharDescargas(setCfg), []);
  const d = borrador || cfg;
  const enlace = (id: 'android' | 'pc' | 'iphone'): EnlaceApp => d[id] || { url: '', activo: false };
  const cambiar = (id: 'android' | 'pc' | 'iphone', parte: Partial<EnlaceApp>) => setBorrador({ ...d, [id]: { ...enlace(id), ...parte } });
  const aviso = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };
  const guardar = async () => { try { await guardarDescargas(d); setBorrador(null); aviso('Guardado. Ya lo ven todos los usuarios.'); } catch { aviso('No se pudo guardar. Revisa tu conexión.'); } };
  const publicar = async () => {
    const ultima = { fecha: BUILD_ACTUAL, version: versionApp, nota: nota.trim(), obligatoria, publicadoEl: new Date().toISOString() };
    try {
      await guardarDescargas({ ...d, ultima });
      setBorrador(null);
      onAvisar?.('Nueva versión de InnovApp', `${obligatoria ? 'Actualización obligatoria' : 'Hay una versión nueva'}: ábrela y actualiza para recibir las mejoras.${nota.trim() ? `\n${nota.trim()}` : ''}`);
      setNota(''); aviso('Listo: los equipos con una versión anterior verán el aviso al entrar.');
    } catch { aviso('No se pudo publicar. Revisa tu conexión.'); }
  };
  // En la app de Android (Google Play) no se ofrecen descargas de otros instaladores: Play solo
  // permite llevar a su propia ficha. Ahí este panel solo lo ve el admin, y sin botones de descarga.
  const enAndroid = plataforma() === 'android';
  // Android: siempre (la app ya está en Google Play); PC e iPhone: solo si el admin los activó.
  const urlDe = (id: 'android' | 'pc' | 'iphone') => id === 'android' ? enlaceAndroid(d) : enlace(id).url;
  const activos = enAndroid ? [] : FILAS.filter(f => f.id === 'android' || (enlace(f.id).activo && enlace(f.id).url));
  // Subir el instalador de PC directo a la nube (solo admin, desde la web o la PC).
  const refExe = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const subirExe = async (file: File) => {
    if (!/\.(exe|msi)$/i.test(file.name)) { aviso('Elige el instalador de Windows (.exe o .msi).'); return; }
    setSubiendo(0);
    try {
      const url = await uploadFileToFirebaseStorage(file, 'descargas/pc', pct => setSubiendo(pct));
      const nuevo: ConfigDescargas = { ...d, pc: { url, activo: true, nombre: file.name, version: versionDeInstalador(file.name) || '', tamanoMb: Math.round(file.size / 1048576 * 10) / 10, subidoEl: new Date().toISOString() } };
      await guardarDescargas(nuevo); setBorrador(null);
      aviso(versionDeInstalador(file.name) ? 'Instalador subido. Quien tenga un programa más antiguo verá el aviso para actualizarlo.' : 'Instalador subido y activado. Ya lo pueden descargar.');
    } catch { aviso('No se pudo subir. Revisa tu conexión e inténtalo otra vez.'); }
    finally { setSubiendo(null); }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-nowrap items-center gap-3">
        <span className="p-2 bg-orange-50 text-orange-600 rounded-xl shrink-0"><Download className="w-5 h-5" /></span>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-800">Descargar la app</h2>
          <p className="text-xs text-slate-500">{isAdmin ? 'Enlaces de descarga, aviso de versión nueva y recordatorios.' : 'Instala InnovApp en tu celular o computadora.'}</p>
        </div>
      </div>

      {/* Botones de descarga (lo que ven los usuarios) */}
      {activos.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {activos.map(f => (
            <button key={f.id} onClick={() => abrirEnlace(urlDe(f.id))} className="min-h-[44px] rounded-xl bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"><f.Ic className="w-4 h-4" /> {f.nombre}</button>
          ))}
        </div>
      ) : !isAdmin && <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">Muy pronto podrás descargar la app desde aquí.</p>}

      {isAdmin && (<>
        <div className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Enlaces (solo administrador)</span>
          {FILAS.map(f => {
            const e = enlace(f.id);
            return (
              <div key={f.id} className="border border-slate-200 rounded-xl p-3 grid gap-2">
                <div className="flex items-center gap-2">
                  <f.Ic className="w-4 h-4 text-slate-500 shrink-0" />
                  <b className="text-sm text-slate-800 flex-1 min-w-0">{f.nombre}</b>
                  {f.id === 'android'
                    ? <span className="shrink-0 min-h-[32px] px-3 rounded-full text-[11px] font-black bg-emerald-600 text-white inline-flex items-center">Siempre visible</span>
                    : <button type="button" role="switch" aria-checked={e.activo} onClick={() => cambiar(f.id, { activo: !e.activo })}
                    className={`shrink-0 min-h-[32px] px-3 rounded-full text-[11px] font-black cursor-pointer ${e.activo ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{e.activo ? 'Activo' : 'Desactivado'}</button>}
                </div>
                <input type="url" value={e.url} onChange={ev => cambiar(f.id, { url: ev.target.value.trim() })} placeholder={f.ph}
                  className="w-full min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400" />
                <span className="text-[11px] text-slate-500">{f.id === 'android' ? 'La app ya está en Google Play: todos ven el botón. Si dejas el enlace vacío se usa la ficha oficial.' : f.ayuda}{f.id !== 'android' && e.activo && !e.url ? ' · Falta el enlace: no se mostrará.' : ''}</span>
                {f.id === 'android' && e.url && !esEnlacePlay(e.url) && <span className="text-[11px] font-bold text-amber-700">Este enlace no es de Google Play: en la app de Android se usará la ficha de Play.</span>}
                {f.id === 'pc' && !enAndroid && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input ref={refExe} type="file" accept=".exe,.msi" className="hidden" onChange={ev => { const fl = ev.target.files?.[0]; if (fl) subirExe(fl); ev.target.value = ''; }} />
                    <button type="button" disabled={subiendo !== null} onClick={() => refExe.current?.click()} className="min-h-[40px] px-3 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"><Upload className="w-4 h-4" /> {subiendo !== null ? `Subiendo… ${subiendo}%` : 'Subir instalador (.exe)'}</button>
                    {e.nombre && <span className="text-[11px] text-slate-500 min-w-0 truncate">{e.nombre}{e.version ? ` · v${e.version}` : ''}{e.tamanoMb ? ` · ${e.tamanoMb} MB` : ''}{e.subidoEl ? ` · ${fechaBonita(e.subidoEl)}` : ''}</span>}
                  </div>
                )}
                {f.id === 'pc' && subiendo !== null && <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${subiendo}%` }} /></div>}
              </div>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <Bell className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="flex-1 min-w-0">Recordar a los usuarios cada</span>
          <select value={d.recordatorioDias ?? 7} onChange={e => setBorrador({ ...d, recordatorioDias: Number(e.target.value) })} className="shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold">
            {[3, 7, 15, 30].map(n => <option key={n} value={n}>{n} días</option>)}
            <option value={0}>Nunca</option>
          </select>
        </label>
        <p className="text-[11px] text-slate-500 -mt-2">En el navegador invita a instalar la app. En la app de Android llega una notificación si pasan esos días sin abrirla.</p>

        <button onClick={guardar} disabled={!borrador} className="w-full min-h-[44px] rounded-xl bg-slate-900 text-white text-sm font-bold cursor-pointer disabled:opacity-40">Guardar enlaces</button>

        <div className="border-t border-slate-100 pt-4 grid gap-2">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500"><RefreshCw className="w-4 h-4" /> Avisar de versión nueva</span>
          <p className="text-xs text-slate-600">Primero publica la web y sube la app nueva a Google Play. Luego pulsa el botón: quien tenga una versión anterior verá un aviso al entrar y se le enviará una notificación.</p>
          <p className="text-[11px] text-slate-500">Versión de esta compilación: <b className="font-mono">v{versionApp}</b>{cfg.ultima?.fecha ? <> · última avisada: <b className="font-mono">{cfg.ultima.version ? `v${cfg.ultima.version}` : fechaBonita(cfg.ultima.fecha)}</b>{cfg.ultima.obligatoria ? ' (obligatoria)' : ''}</> : ''}</p>
          <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="¿Qué trae de nuevo? (opcional, lo verán en el aviso)" className="w-full min-h-[64px] rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 resize-none" />
          <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={obligatoria} onChange={e => setObligatoria(e.target.checked)} className="w-4 h-4" /> Obligatoria (no podrán seguir sin actualizar)</label>
          <button onClick={publicar} className="w-full min-h-[44px] rounded-xl bg-orange-500 text-white text-sm font-black cursor-pointer">Avisar a todos que actualicen</button>
        </div>
        {msg && <p className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Check className="w-4 h-4" /> {msg}</p>}
      </>)}
    </div>
  );
}
