// Pantallas de las cuentas creadas desde la app:
//  - RegistroCuenta: crear cuenta (nombre, celular y PIN).
//  - PantallaMembresia: activar la cuenta. En la web/PC: pagar y avisar por WhatsApp (un botón).
//    En la app de Google Play no se menciona el pago (política de Google): solo "pendiente".
import { useEffect, useState } from 'react';
import { UserPlus, Check, Smartphone, LogOut, Trash2, RefreshCw } from 'lucide-react';
import { ConfigMembresia, leerConfigMembresia, registrarCuenta, mensajeRegistro, solicitarMembresiaYape, eliminarMiCuenta } from '../lib/cuentas';
import { esAppAndroid } from '../lib/plataforma';
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

const WA_ACTIVACION = '51966000500'; // WhatsApp de Innova Contratistas

export function PantallaMembresia({ nombre, celular, onActivar, onSalir }: { uid: string; nombre: string; celular: string; onActivar: () => Promise<boolean>; onSalir: () => void }) {
  const [cfg, setCfg] = useState<ConfigMembresia>({});
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [borrar, setBorrar] = useState(false);
  useEffect(() => { leerConfigMembresia().then(setCfg); }, []);
  // App de Google Play: no se habla de pagos ni se manda a pagar fuera (política de Google).
  const enAndroid = esAppAndroid();
  const precio = cfg.precioSoles ? precioPEN(cfg.precioSoles) : '';

  // Un solo botón: registra el aviso (Validar Compras) y abre WhatsApp con el mensaje listo.
  const pedirActivacion = async () => {
    setOcupado(true); setMsg(null);
    const texto = `Hola Innova Contratistas, ya pagué mi cuenta de InnovApp${precio ? ` (${precio})` : ''} y necesito la activación.\n👤 ${nombre}\n📱 ${celular}`;
    const a = document.createElement('a');
    a.href = `https://wa.me/${WA_ACTIVACION}?text=${encodeURIComponent(texto)}`; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
    try { const r = await solicitarMembresiaYape(); if (r.yaActiva) { await onActivar(); return; } } catch { /* el WhatsApp ya salió */ }
    setMsg({ ok: true, t: 'Listo. Cuando confirmemos tu pago activaremos tu cuenta; luego toca "Ya me activaron".' });
    setOcupado(false);
  };
  const reintentar = async () => { setOcupado(true); const ok = await onActivar(); if (!ok) setMsg({ ok: false, t: 'Tu cuenta aún no está activada. Inténtalo más tarde.' }); setOcupado(false); };
  const confirmarBorrado = async () => { setOcupado(true); try { await eliminarMiCuenta(); onSalir(); } catch { setMsg({ ok: false, t: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.' }); setOcupado(false); } };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-lg max-w-[360px] w-full grid gap-3">
        <div className="flex items-center gap-3">
          <img src="/pwa-192x192.png" alt="InnovApp" className="w-11 h-11 rounded-xl border border-slate-200 p-1.5 shrink-0" />
          <div className="min-w-0"><b className="block text-[15px] text-slate-900">Hola, {nombre}</b><span className="block text-xs text-slate-500">{enAndroid ? 'Tu cuenta está pendiente de activación' : 'Activa tu cuenta para empezar'}</span></div>
        </div>
        {enAndroid ? (
          <p className="text-[13px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">Tu cuenta aún no está activa. Cuando lo esté, toca <b>"Ya me activaron: entrar"</b>.</p>
        ) : (<>
          <ul className="grid gap-1.5">{BENEFICIOS.map(b => <li key={b} className="flex items-start gap-2 text-[13px] text-slate-700"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{b}</li>)}</ul>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 grid gap-1">
            <b className="text-[13px] text-amber-900">Para activar tu cuenta</b>
            <p className="text-[13px] text-amber-900">1. Paga {precio ? <b>{precio}</b> : 'la membresía'}{cfg.yapeNumero ? <> por Yape al <b className="font-mono">{cfg.yapeNumero}</b>{cfg.yapeNombre ? ` (${cfg.yapeNombre})` : ''}</> : null}.</p>
            <p className="text-[13px] text-amber-900">2. Toca el botón y envíanos el mensaje por WhatsApp.</p>
            <span className="text-[11px] text-amber-800">Las funciones inteligentes (IA) se compran aparte.</span>
          </div>
          <button onClick={pedirActivacion} disabled={ocupado} className="min-h-[50px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"><Smartphone className="w-5 h-5 shrink-0" /> Ya pagué: activar por WhatsApp</button>
        </>)}
        {msg && <p className={`text-xs font-bold rounded-xl p-3 ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{msg.t}</p>}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <button onClick={onSalir} className="text-[11px] font-bold text-slate-500 flex items-center gap-1 py-2 cursor-pointer"><LogOut className="w-3.5 h-3.5" /> Salir</button>
          <button onClick={reintentar} disabled={ocupado} className="text-[11px] font-bold text-blue-600 flex items-center gap-1 py-2 cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> Ya me activaron: entrar</button>
          <button onClick={() => setBorrar(true)} className="text-[11px] font-bold text-rose-500 flex items-center gap-1 py-2 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
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
