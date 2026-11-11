// Administración → WhatsApp: lo que el asistente dejó por aprobar (con tu "sí" se crea el
// acceso o se cargan los créditos y el cliente recibe su PIN por WhatsApp), las
// conversaciones y los ajustes. Ver functions/whatsappBot.js y src/lib/whatsappBot.ts.
import { useEffect, useMemo, useState } from 'react';
import { Check, X, AlertTriangle, MessageCircle, Settings2, Inbox, Loader2, Image as ImageIcon, Radio, Copy, PauseCircle, PlayCircle, BellRing } from 'lucide-react';
import {
  escucharPedidos, escucharConversaciones, leerCapturaWA, leerAjustesWA, guardarAjustesWA, usoHoyWA, marcarConversacion,
  responderPedidoWA, telefonoOculto, haceCuanto, AJUSTES_WA_DEFAULT, type PedidoWA, type ConversacionWA, type AjustesWA,
} from '../lib/whatsappBot';
import type { SystemUser } from '../types';

const S = (n?: number | null) => (Number(n) || 0).toFixed(2);
const chip = (bien: boolean | null, si: string, no: string, duda?: string) => bien === null
  ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">{duda}</span>
  : bien
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><Check className="w-3 h-3" />{si}</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><AlertTriangle className="w-3 h-3" />{no}</span>;

function Interruptor({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${on ? 'bg-emerald-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

function TarjetaPedido({ p, usuarios, onVerChat }: { p: PedidoWA; usuarios: SystemUser[]; onVerChat: () => void }) {
  const [captura, setCaptura] = useState<string | null>(null);
  const [verCaptura, setVerCaptura] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [nombre, setNombre] = useState(p.nombre || p.nombrePerfil || '');
  const [userId, setUserId] = useState(p.userId || '');
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState(p.repetido ? 'ese N° de operación ya se usó' : !p.montoOk ? 'el monto no coincide' : '');
  const [copiado, setCopiado] = useState(false);
  const alerta = !!p.repetido || !p.montoOk;
  const pendiente = p.estado === 'por_aprobar';
  const usuariosActivos = useMemo(() => usuarios.filter(u => u.isActive !== false && !/admin/i.test(u.role || '')).sort((a, b) => (a.name || '').localeCompare(b.name || '')), [usuarios]);

  const abrirCaptura = async () => { setVerCaptura(v => !v); if (!captura && p.tieneCaptura) setCaptura(await leerCapturaWA(p.id)); };
  const responder = async (aprobar: boolean) => {
    if (aprobar && alerta && !confirm(`Este pago tiene una alerta (${p.repetido ? 'N° de operación repetido' : 'el monto no coincide'}). ¿Aprobarlo de todos modos?`)) return;
    if (aprobar && p.tipo === 'acceso' && !nombre.trim()) { setError('Escribe el nombre del cliente para crear su acceso.'); return; }
    if (aprobar && p.tipo === 'creditos' && !userId && !p.userId) { setError('Elige a qué usuario se le cargan los créditos.'); return; }
    setTrabajando(true); setError(null);
    const r = await responderPedidoWA({ id: p.id, aprobar, motivo: aprobar ? undefined : motivo, nombre: nombre.trim(), userId });
    setTrabajando(false);
    if (!r.ok) { setError(r.error === 'ELEGIR_USUARIO' ? 'Elige a qué usuario se le cargan los créditos.' : r.error === 'ELEGIR_RECARGA' ? 'No se sabe qué recarga compró: revisa la conversación.' : r.error || 'No se pudo.'); return; }
    const aviso = r.enviado === 'no_enviado' ? ' ⚠️ No se pudo enviar el WhatsApp: mándaselo tú.' : r.enviado === 'plantilla' ? ' (enviado con la plantilla, porque pasaron más de 24 h)' : ' y ya le llegó por WhatsApp.';
    setResultado(!aprobar ? `Rechazado. Se le avisó al cliente${r.enviado === 'no_enviado' ? ' (no se pudo enviar el WhatsApp)' : ''}.` : r.pin ? `Acceso creado · PIN ${r.pin}${aviso}` : `Se cargaron ${r.creditos} créditos${aviso}`);
    if (r.pin) setCopiado(false);
  };

  return (
    <div className={`rounded-2xl border bg-white p-3 sm:p-4 flex gap-3 sm:gap-4 ${pendiente ? (alerta ? 'border-rose-200' : 'border-slate-200') : 'border-slate-100 opacity-80'}`}>
      <button type="button" onClick={abrirCaptura} className="hidden sm:flex w-28 shrink-0 rounded-xl bg-gradient-to-b from-[#742284] to-[#4b1556] text-white flex-col items-center justify-center text-center p-2 cursor-pointer" title="Ver la captura">
        <span className="text-[11px] font-bold text-white/80">{p.metodo || 'Pago'}</span>
        <span className="text-lg font-black leading-tight">S/ {p.montoLeido != null ? S(p.montoLeido) : '?'}</span>
        {p.nroOperacion && <span className="text-[10px] font-mono text-white/80 break-all">Op. {p.nroOperacion}</span>}
        <span className="mt-1 text-[10px] underline text-white/80">{p.tieneCaptura ? 'Ver captura' : 'Sin imagen'}</span>
      </button>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-sm sm:text-base font-black text-slate-900">{p.nombre || p.nombrePerfil || 'Cliente'} · {p.tipo === 'acceso' ? 'Acceso nuevo' : `Recarga de ${p.creditos || '?'} créditos`}</p>
          <p className="text-xs text-slate-500">WhatsApp {telefonoOculto(p.telefono)} · {haceCuanto(p.creado)} · espera S/ {S(p.montoEsperado)}
            <span className="sm:hidden"> · pagó S/ {p.montoLeido != null ? S(p.montoLeido) : '?'}{p.nroOperacion ? ` · Op. ${p.nroOperacion}` : ''}</span></p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chip(p.montoOk, 'Monto correcto', `Monto no coincide (S/ ${p.montoLeido != null ? S(p.montoLeido) : '?'})`)}
          {p.nroOperacion ? chip(!p.repetido, 'N° de operación nuevo', `N° de operación REPETIDO: ${p.repetido}`) : chip(null, '', '', 'Sin N° de operación')}
          {chip(p.destinatarioOk, 'Pagado a tu nombre', `Pagado a: ${p.destinatario || '?'}`, 'Revisa en tu Yape que llegó')}
        </div>

        {pendiente && !resultado && (<>
          {p.tipo === 'acceso' ? (
            <label className="block text-[11px] font-bold text-slate-500">Nombre para el acceso
              <input value={nombre} onChange={e => setNombre(e.target.value)} className="mt-0.5 w-full sm:max-w-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-slate-400" />
            </label>
          ) : !p.userId && (
            <label className="block text-[11px] font-bold text-slate-500">¿A qué usuario se le cargan?
              <select value={userId} onChange={e => setUserId(e.target.value)} className="mt-0.5 w-full sm:max-w-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-800">
                <option value="">Elegir…</option>
                {usuariosActivos.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
          )}
          <p className="text-xs text-slate-600">Al aprobar: {p.tipo === 'acceso' ? <>se crea el acceso de <b>{nombre || '…'}</b> con un PIN nuevo y se le envía por WhatsApp.</> : <>se cargan los créditos (la primera recarga vale el doble) y se le avisa por WhatsApp.</>}</p>
          {rechazando && (
            <label className="block text-[11px] font-bold text-slate-500">Motivo (se le dice al cliente)
              <input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="el pago no llegó" className="mt-0.5 w-full sm:max-w-md px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-800 outline-none focus:border-slate-400" />
            </label>
          )}
          {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 rounded-lg p-2">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {!rechazando ? (<>
              <button type="button" disabled={trabajando} onClick={() => responder(true)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-black cursor-pointer disabled:opacity-50 ${alerta ? 'bg-emerald-600/60' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {trabajando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{p.tipo === 'acceso' ? 'Aprobar y enviar PIN' : 'Aprobar y cargar'}
              </button>
              <button type="button" disabled={trabajando} onClick={() => setRechazando(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-sm font-black cursor-pointer hover:bg-rose-50"><X className="w-4 h-4" />Rechazar</button>
            </>) : (<>
              <button type="button" disabled={trabajando} onClick={() => responder(false)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-black cursor-pointer disabled:opacity-50">{trabajando ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}Rechazar y avisar</button>
              <button type="button" onClick={() => setRechazando(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold cursor-pointer">Cancelar</button>
            </>)}
            <button type="button" onClick={onVerChat} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold cursor-pointer hover:bg-slate-50"><MessageCircle className="w-4 h-4" />Ver conversación</button>
            <button type="button" onClick={abrirCaptura} className="sm:hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold cursor-pointer"><ImageIcon className="w-4 h-4" />Captura</button>
          </div>
        </>)}
        {resultado && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" /><span className="flex-1">{resultado}</span>
            {/PIN (\d{6})/.test(resultado) && <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(resultado.match(/PIN (\d{6})/)![1]); setCopiado(true); } catch { /* */ } }} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-emerald-200 cursor-pointer"><Copy className="w-3.5 h-3.5" />{copiado ? 'Copiado' : 'Copiar PIN'}</button>}
          </div>
        )}
        {!pendiente && !resultado && (
          <p className="text-xs font-bold text-slate-500">{p.estado === 'aprobado' ? '✅ Aprobado' : p.estado === 'rechazado' ? `✖ Rechazado${p.motivo ? `: ${p.motivo}` : ''}` : '⏳ Procesando…'} {haceCuanto(p.atendido)}{p.enviado === 'no_enviado' ? ' · ⚠️ el WhatsApp no se pudo enviar' : ''}</p>
        )}
        {verCaptura && (p.tieneCaptura ? (captura ? <img src={captura} alt="Captura del pago" className="max-h-96 rounded-xl border border-slate-200" /> : <Loader2 className="w-5 h-5 animate-spin text-slate-400" />) : <p className="text-xs text-slate-500">La imagen era muy pesada para guardarla: revísala en el chat de tu celular.</p>)}
      </div>
    </div>
  );
}

function Conversacion({ c }: { c: ConversacionWA }) {
  const color = { cliente: 'bg-white border border-slate-200 self-start', asistente: 'bg-emerald-50 border border-emerald-200 self-end', dueno: 'bg-sky-50 border border-sky-200 self-end' } as const;
  return (
    <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto p-3 bg-[#efeae2] rounded-xl">
      {(c.mensajes || []).map(m => (
        <div key={m.id + m.fecha} className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-[13px] text-slate-800 whitespace-pre-wrap ${color[m.de] || color.cliente}`}>
          <p className="text-[10px] font-bold text-slate-400">{m.de === 'cliente' ? 'Cliente' : m.de === 'dueno' ? 'Tú (celular)' : 'Asistente'} · {haceCuanto(m.fecha)}</p>
          {m.texto}
        </div>
      ))}
    </div>
  );
}

export default function WhatsAppAdminView({ usuarios = [] }: { usuarios?: SystemUser[] }) {
  const [pestana, setPestana] = useState<'pedidos' | 'chats' | 'ajustes'>('pedidos');
  const [pedidos, setPedidos] = useState<PedidoWA[] | null>(null);
  const [chats, setChats] = useState<ConversacionWA[] | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [aj, setAj] = useState<AjustesWA>(AJUSTES_WA_DEFAULT);
  const [uso, setUso] = useState(0);
  const [guardado, setGuardado] = useState<string | null>(null);

  useEffect(() => escucharPedidos(setPedidos), []);
  useEffect(() => escucharConversaciones(setChats), []);
  useEffect(() => { leerAjustesWA().then(setAj); usoHoyWA().then(setUso); }, []);

  const porAprobar = (pedidos || []).filter(p => p.estado === 'por_aprobar' || p.estado === 'procesando');
  const atendidos = (pedidos || []).filter(p => p.estado === 'aprobado' || p.estado === 'rechazado').slice(0, 10);
  const teNecesitan = (chats || []).filter(c => c.necesitaDueno).length;
  const cambiar = async (c: Partial<AjustesWA>) => {
    setAj(a => ({ ...a, ...c }));
    try { await guardarAjustesWA(c); setGuardado('Guardado ✓'); } catch { setGuardado('No se pudo guardar. Revisa tu conexión.'); }
    setTimeout(() => setGuardado(null), 2000);
  };
  const verChat = (tel: string) => { setPestana('chats'); setAbierto(tel); };
  const fila = 'rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3';
  const campo = 'px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-800 outline-none focus:border-slate-400 text-right';

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2"><MessageCircle className="w-7 h-7 text-emerald-600" />WhatsApp</h1>
          <p className="text-sm text-slate-500">El asistente atiende tu número; tú solo apruebas los pagos.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${aj.activo ? (aj.modoTransmision ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700') : 'bg-slate-100 text-slate-500'}`}>
          {aj.activo ? (aj.modoTransmision ? <><Radio className="w-3.5 h-3.5" />Modo transmisión</> : <><span className="w-2 h-2 rounded-full bg-emerald-500" />Asistente atendiendo</>) : 'Asistente apagado'}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {([['pedidos', 'Por aprobar', 'Pagos', porAprobar.length, Inbox], ['chats', 'Conversaciones', 'Chats', teNecesitan, MessageCircle], ['ajustes', 'Ajustes', 'Ajustes', 0, Settings2]] as const).map(([id, t, corto, n, I]) => (
          <button key={id} type="button" onClick={() => setPestana(id)} className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-sm font-black cursor-pointer ${pestana === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <I className="w-4 h-4" /><span className="hidden sm:inline">{t}</span><span className="sm:hidden">{corto}</span>
            {n > 0 && <span className={`min-w-5 h-5 px-1 rounded-full text-[11px] flex items-center justify-center ${id === 'chats' ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500 text-white'}`}>{n}</span>}
          </button>
        ))}
      </div>

      {pestana === 'pedidos' && (
        <div className="space-y-3">
          {pedidos === null ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : !porAprobar.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />No hay pagos por aprobar. Cuando un cliente mande su captura de Yape o Plin, aparece aquí y te llega un aviso.
            </div>
          )}
          {porAprobar.map(p => <TarjetaPedido key={p.id} p={p} usuarios={usuarios} onVerChat={() => verChat(p.telefono)} />)}
          {!!atendidos.length && <p className="pt-2 text-xs font-black text-slate-400 uppercase tracking-wider">Atendidos hace poco</p>}
          {atendidos.map(p => <TarjetaPedido key={p.id} p={p} usuarios={usuarios} onVerChat={() => verChat(p.telefono)} />)}
        </div>
      )}

      {pestana === 'chats' && (
        <div className="space-y-2">
          {chats === null ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : !chats.length && <p className="text-sm text-slate-500">Todavía no hay conversaciones.</p>}
          {(chats || []).map(c => (
            <div key={c.id} className={`rounded-2xl border bg-white ${c.necesitaDueno ? 'border-amber-300' : 'border-slate-200'}`}>
              <button type="button" onClick={() => { setAbierto(abierto === c.id ? null : c.id); if (c.sinLeer) marcarConversacion(c.id, { sinLeer: false }).catch(() => {}); }} className="w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer">
                <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center shrink-0">{(c.pedido?.nombre || c.nombrePerfil || '?').charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-slate-800 truncate">{c.pedido?.nombre || c.nombrePerfil || 'Cliente'} <span className="font-normal text-slate-400">{telefonoOculto(c.telefono)}</span></span>
                  <span className="block text-xs text-slate-500 truncate">{c.necesitaDueno ? <b className="text-amber-700">🙋 {c.necesitaDueno} · </b> : null}{c.ultimo}</span>
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">{haceCuanto(c.actualizado)}</span>
                {c.sinLeer && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />}
              </button>
              {abierto === c.id && (
                <div className="px-3 pb-3 space-y-2">
                  <Conversacion c={c} />
                  <div className="flex flex-wrap gap-2">
                    <a href={`https://wa.me/${c.telefono}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black"><MessageCircle className="w-4 h-4" />Responder yo en WhatsApp</a>
                    <button type="button" onClick={() => marcarConversacion(c.id, { pausado: !c.pausado }).catch(() => {})} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer">{c.pausado ? <><PlayCircle className="w-4 h-4" />Que el asistente vuelva a responder</> : <><PauseCircle className="w-4 h-4" />Que el asistente no responda aquí</>}</button>
                    {c.necesitaDueno && <button type="button" onClick={() => marcarConversacion(c.id, { necesitaDueno: '' }).catch(() => {})} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"><Check className="w-4 h-4" />Ya lo atendí</button>}
                  </div>
                  <p className="text-[11px] text-slate-500">Si escribes tú desde tu celular, el asistente se queda callado en ese chat por 1 hora.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pestana === 'ajustes' && (
        <div className="space-y-2.5">
          <div className={fila}><span className="text-sm"><b>Asistente de WhatsApp</b> · responde solo y te avisa lo importante</span><Interruptor label="Asistente" on={aj.activo} onChange={v => cambiar({ activo: v })} /></div>
          <div className={fila}><span className="text-sm">Precio del acceso al sistema</span>
            <span className="flex items-center gap-1 text-sm font-black text-slate-800">S/ <input type="number" min={1} step="0.1" defaultValue={aj.precioAcceso} key={'p' + aj.precioAcceso} onBlur={e => { const v = Number(e.target.value); if (v > 0 && v !== aj.precioAcceso) cambiar({ precioAcceso: v }); }} className={`${campo} w-24`} /></span></div>
          <div className={fila}><span className="text-sm">Validar pagos</span><span className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm font-black text-slate-800">Siempre con tu "sí"</span></div>
          <div className={fila}><span className="text-sm flex items-center gap-1.5"><BellRing className="w-4 h-4 text-slate-400" />Avisarme también cuando el asistente no sabe o piden hablar conmigo<span className="hidden sm:inline text-slate-400"> (los pagos siempre se avisan)</span></span><Interruptor label="Avisar dudas" on={aj.avisarDudas} onChange={v => cambiar({ avisarDudas: v })} /></div>
          <div className={fila}><span className="text-sm">Modo transmisión 🔴 <span className="text-slate-500">(solo te avisa los pagos)</span></span><Interruptor label="Modo transmisión" on={aj.modoTransmision} onChange={v => cambiar({ modoTransmision: v })} /></div>
          <div className={fila}><span className="text-sm">Nombre del asistente</span>
            <input defaultValue={aj.nombreAsistente} key={'n' + aj.nombreAsistente} maxLength={60} onBlur={e => { const v = e.target.value.trim(); if (v && v !== aj.nombreAsistente) cambiar({ nombreAsistente: v }); }} className={`${campo} w-48 sm:w-60`} /></div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 space-y-1.5">
            <span className="text-sm">Indicaciones para el asistente <span className="text-slate-400">(promociones, horarios, qué incluye el acceso…)</span></span>
            <textarea defaultValue={aj.notas} key={'t' + aj.notas.length} maxLength={1500} rows={3} onBlur={e => { if (e.target.value !== aj.notas) cambiar({ notas: e.target.value }); }} placeholder="Ej.: El acceso es de por vida. Atiendo de lunes a sábado de 8 a 6." className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </div>
          <div className={fila}><span className="text-sm">Respuestas del asistente hoy <span className="text-slate-400">(tope {aj.topeDia} por día, para cuidar el gasto)</span></span><span className="px-3 py-1.5 rounded-xl bg-slate-100 text-sm font-black text-slate-800">{uso}</span></div>
          {guardado && <p className="text-xs font-bold text-emerald-700">{guardado}</p>}
          <p className="text-[11px] text-slate-500 leading-relaxed">El asistente se presenta como "{aj.nombreAsistente}". Si le preguntan, dice que es el asistente automático de InnovApp. Usa el número y el QR de Yape/Plin de Configuración → Para vender créditos. Para conectarlo a tu número, sigue la guía de WhatsApp que te pasaron.</p>
        </div>
      )}
    </div>
  );
}
