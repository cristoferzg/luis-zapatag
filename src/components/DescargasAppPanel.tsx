// Configuración → "Descargar la app": el admin pone los enlaces (Google Play, programa de
// PC, iPhone), los activa o desactiva, elige cada cuánto recordar y avisa de versión nueva.
// Los usuarios ven solo los botones de descarga activos.
import { useEffect, useRef, useState } from 'react';
import { Smartphone, Monitor, Download, RefreshCw, Check, Bell, Upload } from 'lucide-react';
import { ConfigDescargas, EnlaceApp, escucharDescargas, guardarDescargas, BUILD_ACTUAL, abrirEnlace, plataforma, esEnlacePlay, versionDeInstalador, enlaceAndroid, CODIGO_ANDROID, pcPara } from '../lib/appDescargas';
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
  const [incluirWeb, setIncluirWeb] = useState(true);
  const [incluirAndroid, setIncluirAndroid] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => escucharDescargas(setCfg), []);
  const d = borrador || cfg;
  const enlace = (id: 'android' | 'pc' | 'iphone'): EnlaceApp => d[id] || { url: '', activo: false };
  const cambiar = (id: 'android' | 'pc' | 'iphone', parte: Partial<EnlaceApp>) => setBorrador({ ...d, [id]: { ...enlace(id), ...parte } });
  const aviso = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 3000); };
  const guardar = async () => { try { await guardarDescargas(d); setBorrador(null); aviso('Guardado. Ya lo ven todos los usuarios.'); } catch { aviso('No se pudo guardar. Revisa tu conexión.'); } };
  const publicar = async () => {
    if (!incluirWeb && !incluirAndroid) { aviso('Elige a quién avisar: web y PC, la app de Android o ambos.'); return; }
    const prev = cfg.ultima;
    const ultima = {
      fecha: incluirWeb ? BUILD_ACTUAL : (prev?.fecha || ''),
      version: versionApp, nota: nota.trim(), obligatoria, publicadoEl: new Date().toISOString(),
      codigoAndroid: incluirAndroid ? CODIGO_ANDROID : (prev?.codigoAndroid || 0),
    };
    try {
      await guardarDescargas({ ...d, ultima });
      setBorrador(null);
      onAvisar?.('Nueva versión de InnovApp', `${obligatoria ? 'Actualización obligatoria' : 'Hay una versión nueva'}: ábrela y actualiza para recibir las mejoras.${nota.trim() ? `\n${nota.trim()}` : ''}`);
      setNota(''); aviso('Listo: los equipos con una versión anterior verán el aviso al entrar.');
    } catch { aviso('No se pudo publicar. Revisa tu conexión.'); }
  };
  // Quitar la obligación (por si se marcó antes de tiempo): el aviso queda como opcional.
  const quitarObligacion = async () => {
    if (!cfg.ultima) return;
    try { await guardarDescargas({ ...cfg, ultima: { ...cfg.ultima, obligatoria: false } }); aviso('Listo: la actualización ya no es obligatoria.'); }
    catch { aviso('No se pudo guardar. Revisa tu conexión.'); }
  };
  // En la app de Android (Google Play) no se ofrecen descargas de otros instaladores: Play solo
  // permite llevar a su propia ficha. Ahí este panel solo lo ve el admin, y sin botones de descarga.
  const enAndroid = plataforma() === 'android';
  // Android: siempre (la app ya está en Google Play); PC e iPhone: solo si el admin los activó.
  const urlDe = (id: 'android' | 'pc' | 'iphone') => id === 'android' ? enlaceAndroid(d) : id === 'pc' ? (pcPara(d)?.url || enlace('pc').url) : enlace(id).url;
  const activos = enAndroid ? [] : FILAS.filter(f => f.id === 'android' || (enlace(f.id).activo && enlace(f.id).url));
  // Subir el instalador de PC directo a la nube (solo admin, desde la web o la PC).
  const refExe = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<number | null>(null);
  const subirExe = async (file: File) => {
    if (!/\.(exe|msi)$/i.test(file.name)) { aviso('Elige el instalador de Windows (.exe o .msi).'); return; }
    setSubiendo(0);
    try {
      const url = await uploadFileToFirebaseStorage(file, 'descargas/pc', pct => setSubiendo(pct));
      // "InnovApp-Setup-2.1.1-win7-8.exe" → instalador para Windows 7/8; los demás, para Windows 10/11.
      const deWin7 = /win\s*7|win7-8|windows\s*7/i.test(file.name);
      const datos = { url, activo: true, nombre: file.name, version: versionDeInstalador(file.name.replace(/-?win7-8/i, '')) || '', tamanoMb: Math.round(file.size / 1048576 * 10) / 10, subidoEl: new Date().toISOString() };
      const nuevo: ConfigDescargas = deWin7 ? { ...d, pcWin7: datos } : { ...d, pc: { ...datos, obligatoria: d.pc?.obligatoria } };
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
                    {e.nombre && <span className="text-[11px] text-slate-500 min-w-0 truncate">Windows 10/11: {e.nombre}{e.version ? ` · v${e.version}` : ''}{e.tamanoMb ? ` · ${e.tamanoMb} MB` : ''}{e.subidoEl ? ` · ${fechaBonita(e.subidoEl)}` : ''}</span>}
                    <span className={`basis-full text-[11px] ${d.pcWin7?.url ? 'text-slate-500' : 'text-amber-700 font-semibold'}`}>{d.pcWin7?.url
                      ? `Windows 7/8: ${d.pcWin7.nombre || 'instalador'}${d.pcWin7.version ? ` · v${d.pcWin7.version}` : ''}${d.pcWin7.subidoEl ? ` · ${fechaBonita(d.pcWin7.subidoEl)}` : ''} (a esas PCs se les da este automáticamente)`
                      : 'Windows 7/8: aún no subido. Sube también «InnovApp-Setup-…-win7-8.exe» (con el mismo botón): el de Windows 10/11 no arranca en Windows 7 u 8.'}</span>
                  </div>
                )}
                {f.id === 'pc' && subiendo !== null && <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${subiendo}%` }} /></div>}
                {f.id === 'pc' && e.url && (
                  e.version
                    ? <label className="flex items-start gap-2 text-xs font-bold text-rose-700"><input type="checkbox" checked={!!e.obligatoria} onChange={ev => cambiar('pc', { obligatoria: ev.target.checked })} className="w-4 h-4 mt-0.5 shrink-0" /> <span>Obligatorio: quien tenga un programa anterior a la v{e.version} no podrá usarlo hasta instalar este. <span className="font-semibold text-slate-500">(Luego pulsa «Guardar enlaces».)</span></span></label>
                    : <span className="text-[11px] text-amber-700">Para poder hacerlo obligatorio, sube el instalador con su versión en el nombre (InnovApp-Setup-2.1.0.exe).</span>
                )}
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
          <p className="text-xs text-slate-600">Primero publica la web y sube la app nueva a Google Play. Luego pulsa el botón: quien tenga una versión anterior verá un aviso al entrar y se le enviará una notificación. Si es obligatoria, no podrá seguir usando la app hasta actualizar.</p>
          {cfg.ultima?.obligatoria && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex flex-wrap items-center gap-2">
              <span className="flex-1 min-w-[180px] text-xs font-bold text-rose-800">Actualización obligatoria activa{cfg.ultima.version ? ` (v${cfg.ultima.version})` : ''}{cfg.ultima.codigoAndroid ? ` · Android: versión ${cfg.ultima.codigoAndroid} o mayor` : ' · solo web y PC'}</span>
              <button type="button" onClick={quitarObligacion} className="min-h-[36px] px-3 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-bold cursor-pointer">Quitar obligación</button>
            </div>
          )}
          <p className="text-[11px] text-slate-500">Versión de esta compilación: <b className="font-mono">v{versionApp}</b>{cfg.ultima?.fecha ? <> · última avisada: <b className="font-mono">{cfg.ultima.version ? `v${cfg.ultima.version}` : fechaBonita(cfg.ultima.fecha)}</b>{cfg.ultima.obligatoria ? ' (obligatoria)' : ''}</> : ''}</p>
          <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="¿Qué trae de nuevo? (opcional, lo verán en el aviso)" className="w-full min-h-[64px] rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 resize-none" />
          <span className="text-[11px] font-bold text-slate-500">¿A quién avisar?</span>
          <label className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" checked={incluirWeb} onChange={e => setIncluirWeb(e.target.checked)} className="w-4 h-4 mt-0.5 shrink-0" /> <span>Web y programa de PC <span className="text-slate-400">(se actualizan al tocar «Actualizar ahora»)</span></span></label>
          <label className="flex items-start gap-2 text-xs text-slate-700"><input type="checkbox" checked={incluirAndroid} onChange={e => setIncluirAndroid(e.target.checked)} className="w-4 h-4 mt-0.5 shrink-0" /> <span>App de Android: versión <b className="font-mono">{CODIGO_ANDROID || '—'}</b> <span className="text-amber-700 font-semibold">(márcalo solo cuando Google Play ya la aprobó y está disponible; si no, el usuario no tendrá qué descargar)</span></span></label>
          <label className="flex items-center gap-2 text-xs font-bold text-rose-700"><input type="checkbox" checked={obligatoria} onChange={e => setObligatoria(e.target.checked)} className="w-4 h-4" /> Obligatoria: no podrán seguir usando la app sin actualizar</label>
          <button onClick={publicar} className="w-full min-h-[44px] rounded-xl bg-orange-500 text-white text-sm font-black cursor-pointer">Avisar a todos que actualicen</button>
        </div>
        {msg && <p className="text-xs font-bold text-emerald-700 flex items-center gap-1"><Check className="w-4 h-4" /> {msg}</p>}
      </>)}
    </div>
  );
}
