// Pantallas de las cuentas creadas desde la app:
//  - RegistroCuenta: crear cuenta (nombre, celular y PIN).
//  - PantallaMembresia: activar la cuenta con el pago único (Google Play en Android, Yape en web/PC).
import { useEffect, useState } from 'react';
import { UserPlus, Check, ShieldCheck, Smartphone, LogOut, Trash2, RefreshCw } from 'lucide-react';
import { ConfigMembresia, leerConfigMembresia, registrarCuenta, mensajeRegistro, solicitarMembresiaYape, eliminarMiCuenta, PRODUCTO_MEMBRESIA } from '../lib/cuentas';
import { cargarEstadoIA } from '../lib/aiAccess';
import { esAppAndroid, comprasPermitidas } from '../lib/plataforma';
import { usaGooglePlay, iniciarPagosPlay, comprarEnPlay, precioPlay } from '../lib/pagosPlay';
import { precioPEN } from '../lib/currency';

const campo = 'w-full py-2.5 px-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl outline-none text-sm text-slate-900';
const BENEFICIOS = ['Techos metálicos, Obra Civil, Drywall, Carpintería metálica y Melamina', 'Presupuestos, contratos y control de tus obras', 'Tus datos guardados en la nube, en el celular y la PC', 'Un solo pago: sin mensualidades'];

export function RegistroCuenta({ onCreada, onVolver }: { onCreada: (celular: string, pin: string) => void; onVolver: () => void }) {
  const [cfg, setCfg] = useState<ConfigMembresia | null>(null);
  const [f, setF] = useState({ nombre: '', celular: '', pin: '', pin2: '', acepto: false });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  useEffect(() => { leerConfigMembresia().then(setCfg); }, []);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (f.nombre.trim().length < 3) return setError('Escribe tu nombre.');
    if (!/^9\d{8}$/.test(f.celular)) return setError('El celular debe tener 9 dígitos y empezar con 9.');
    if (!/^\d{6}$/.test(f.pin)) return setError('El PIN debe tener 6 dígitos.');
    if (f.pin !== f.pin2) return setError('Los dos PIN no coinciden.');
    if (!f.acepto) return setError('Acepta la política de privacidad para continuar.');
    setEnviando(true);
    try { await registrarCuenta(f.nombre.trim(), f.celular, f.pin); onCreada(f.celular, f.pin); }
    catch (err) { setError(mensajeRegistro(err)); }
    finally { setEnviando(false); }
  };
  const precio = cfg?.precioSoles ? precioPEN(cfg.precioSoles) : '';
  return (
    <form onSubmit={enviar} className="space-y-2.5 text-left">
      <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl">
        <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 grid place-items-center shrink-0"><UserPlus className="w-3.5 h-3.5 text-blue-600" /></span>
        <div className="min-w-0"><p className="text-[11px] font-bold text-slate-800 leading-tight">Crear mi cuenta</p><p className="text-[9px] text-slate-500">{precio && !esAppAndroid() ? `Se activa con un pago único de ${precio}` : 'Se activa con un pago único'}</p></div>
      </div>
      {cfg && cfg.registroAbierto !== true ? <p className="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">Por ahora no se están creando cuentas nuevas.</p> : (<>
        <input className={campo} placeholder="Tu nombre o el de tu taller" value={f.nombre} maxLength={60} onChange={e => setF({ ...f, nombre: e.target.value })} disabled={enviando} />
        <input className={campo} placeholder="Celular (9 dígitos)" inputMode="numeric" maxLength={9} value={f.celular} onChange={e => setF({ ...f, celular: e.target.value.replace(/\D/g, '') })} disabled={enviando} />
        <div className="grid grid-cols-2 gap-2">
          <input className={`${campo} font-mono tracking-widest`} placeholder="PIN (6)" inputMode="numeric" maxLength={6} value={f.pin} onChange={e => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} disabled={enviando} />
          <input className={`${campo} font-mono tracking-widest`} placeholder="Repite PIN" inputMode="numeric" maxLength={6} value={f.pin2} onChange={e => setF({ ...f, pin2: e.target.value.replace(/\D/g, '') })} disabled={enviando} />
        </div>
        <p className="text-[10px] text-slate-500">Entrarás con tu celular y este PIN. Guárdalo: no lo compartas.</p>
        <label className="flex items-start gap-2 text-[11px] text-slate-600"><input type="checkbox" className="mt-0.5" checked={f.acepto} onChange={e => setF({ ...f, acepto: e.target.checked })} /> <span>Acepto la <a href="/privacidad.html" target="_blank" rel="noopener noreferrer" className="underline">política de privacidad</a>.</span></label>
        {error && <p className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-[11px] font-medium">⚠️ {error}</p>}
        <button type="submit" disabled={enviando} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50">{enviando ? 'Creando…' : 'Crear cuenta'}</button>
      </>)}
      <button type="button" onClick={onVolver} className="w-full text-[11px] font-bold text-slate-500 py-1 cursor-pointer">Ya tengo cuenta: entrar</button>
    </form>
  );
}

export function PantallaMembresia({ uid, nombre, onActivar, onSalir }: { uid: string; nombre: string; onActivar: () => Promise<boolean>; onSalir: () => void }) {
  const [cfg, setCfg] = useState<ConfigMembresia>({});
  const [play, setPlay] = useState(false);
  const [listoPlay, setListoPlay] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [borrar, setBorrar] = useState(false);
  useEffect(() => {
    leerConfigMembresia().then(setCfg);
    cargarEstadoIA().finally(() => {
      const p = usaGooglePlay(); setPlay(p);
      if (p) iniciarPagosPlay(uid, [], []).then(setListoPlay);
    });
    const activa = () => { onActivar(); };
    window.addEventListener('innova_membresia_activa', activa);
    return () => window.removeEventListener('innova_membresia_activa', activa);
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const enAndroidSinPago = !play && esAppAndroid() && !comprasPermitidas();
  const precio = (play && listoPlay && precioPlay(PRODUCTO_MEMBRESIA)) || (cfg.precioSoles ? precioPEN(cfg.precioSoles) : '');

  const pagarPlay = async () => {
    setOcupado(true); setMsg(null);
    const r = await comprarEnPlay(PRODUCTO_MEMBRESIA);
    if (!r.cancelado) setMsg({ ok: r.ok, t: r.mensaje });
    if (r.ok) await onActivar();
    setOcupado(false);
  };
  const avisarYape = async () => {
    setOcupado(true); setMsg(null);
    try { const r = await solicitarMembresiaYape(); if (r.yaActiva) { await onActivar(); return; } setMsg({ ok: true, t: 'Recibimos tu aviso. Cuando validemos tu pago, tu cuenta se activará y podrás entrar.' }); }
    catch { setMsg({ ok: false, t: 'No se pudo enviar. Revisa tu conexión.' }); }
    finally { setOcupado(false); }
  };
  const reintentar = async () => { setOcupado(true); const ok = await onActivar(); if (!ok) setMsg({ ok: false, t: 'Tu pago aún no está validado. Inténtalo más tarde.' }); setOcupado(false); };
  const confirmarBorrado = async () => { setOcupado(true); try { await eliminarMiCuenta(); onSalir(); } catch { setMsg({ ok: false, t: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.' }); setOcupado(false); } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg max-w-[360px] w-full grid gap-3">
        <div className="flex items-center gap-3">
          <img src="/pwa-192x192.png" alt="InnovApp" className="w-11 h-11 rounded-xl border border-slate-200 p-1.5 shrink-0" />
          <div className="min-w-0"><b className="block text-[15px] text-slate-900">Hola, {nombre}</b><span className="block text-xs text-slate-500">Activa tu cuenta para empezar</span></div>
        </div>
        <ul className="grid gap-1.5">{BENEFICIOS.map(b => <li key={b} className="flex items-start gap-2 text-[13px] text-slate-700"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{b}</li>)}</ul>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Pago único</span>
          <span className="block text-3xl font-black text-slate-900">{precio || '—'}</span>
          <span className="block text-[11px] text-slate-500">Las funciones inteligentes (IA) se compran aparte.</span>
        </div>
        {play ? (
          <button onClick={pagarPlay} disabled={ocupado || !listoPlay} className="min-h-[48px] rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"><ShieldCheck className="w-4 h-4" /> {ocupado ? 'Abriendo Google Play…' : listoPlay ? 'Pagar con Google Play' : 'Cargando…'}</button>
        ) : enAndroidSinPago ? (
          <p className="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">La activación desde la app estará disponible muy pronto.</p>
        ) : (
          <div className="grid gap-2">
            <p className="text-[13px] text-slate-700 bg-violet-50 border border-violet-100 rounded-xl p-3"><Smartphone className="inline w-4 h-4 text-violet-600 mr-1" />Yapea <b>{precio}</b>{cfg.yapeNumero ? <> al <b className="font-mono">{cfg.yapeNumero}</b></> : null}{cfg.yapeNombre ? <> ({cfg.yapeNombre})</> : null} y luego toca <b>"Ya pagué"</b>.</p>
            <button onClick={avisarYape} disabled={ocupado} className="min-h-[46px] rounded-xl bg-violet-600 text-white font-black cursor-pointer disabled:opacity-50">Ya pagué</button>
            <button onClick={reintentar} disabled={ocupado} className="min-h-[42px] rounded-xl bg-slate-100 text-slate-700 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"><RefreshCw className="w-4 h-4" /> Ya me activaron: entrar</button>
          </div>
        )}
        {msg && <p className={`text-xs font-bold rounded-xl p-3 ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{msg.t}</p>}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <button onClick={onSalir} className="text-[11px] font-bold text-slate-500 flex items-center gap-1 py-2 cursor-pointer"><LogOut className="w-3.5 h-3.5" /> Salir</button>
          <button onClick={() => setBorrar(true)} className="text-[11px] font-bold text-rose-500 flex items-center gap-1 py-2 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Eliminar mi cuenta</button>
        </div>
        {borrar && <ConfirmarBorrado ocupado={ocupado} onSi={confirmarBorrado} onNo={() => setBorrar(false)} />}
      </div>
    </div>
  );
}

export function ConfirmarBorrado({ ocupado, onSi, onNo }: { ocupado: boolean; onSi: () => void; onNo: () => void }) {
  const [texto, setTexto] = useState('');
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 grid gap-2">
      <p className="text-xs text-rose-800"><b>Se borrará tu cuenta y todos tus datos</b> (obras, presupuestos, diseños, gastos). No se puede deshacer. Los pagos ya hechos no se devuelven. Escribe <b>ELIMINAR</b> para confirmar.</p>
      <input value={texto} onChange={e => setTexto(e.target.value.toUpperCase())} className={campo} placeholder="ELIMINAR" />
      <div className="flex gap-2">
        <button onClick={onNo} className="flex-1 min-h-[40px] rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer">Cancelar</button>
        <button onClick={onSi} disabled={texto !== 'ELIMINAR' || ocupado} className="flex-1 min-h-[40px] rounded-xl bg-rose-600 text-white text-xs font-black cursor-pointer disabled:opacity-40">{ocupado ? 'Eliminando…' : 'Eliminar'}</button>
      </div>
    </div>
  );
}
