// =============================================================================
// AYUDA Y SOPORTE: un solo chat que reemplaza a "Atención" (tickets) y "Asesorías".
// Usuario: el asistente responde al instante; "Hablar con Innova" pasa la conversación
// al administrador; "Agendar asesoría" y "Reportar un problema" se hacen dentro del chat
// (se guardan además como asesoría / ticket, así siguen sus avisos y su gestión).
// Administrador: bandeja inteligente (prioridad por motivo y tiempo de espera, fijar,
// posponer, resolver) y respuesta.
// Pensado primero para el celular: botones de 40 px o más y nada más ancho que la pantalla.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SystemUser } from '../types';
import { Ticket } from './TicketsView';
import { Asesoria } from './AsesoriasView';
import SoporteYAsesoriasView from './SoporteYAsesoriasView';
import {
  ChatSoporte, MensajeSoporte, wsDe, escucharChat, escucharBandeja, agregarMensaje, marcarLeido, ajustarChat,
  preguntarAsistente, respuestaLocal, comprimirFoto,
} from '../lib/soporte';
import { iaHabilitadaUsuarios, getAIAccess } from '../lib/aiAccess';

interface Props {
  currentUser: SystemUser | null;
  isAdmin: boolean;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  asesorias: Asesoria[];
  setAsesorias: React.Dispatch<React.SetStateAction<Asesoria[]>>;
  usuariosList: SystemUser[];
  onIr?: (vista: string) => void;
  gestionarAlEntrar?: boolean;
}

const NOMBRE_VISTA: Record<string, string> = {
  dashboard: 'Panel', projects: 'Proyectos', techos: 'Techos', concreto: 'Obra Civil', drywall: 'Drywall', melamina: 'Melamina', carpinteria: 'Carpintería',
  calculator: 'Calculadora', gastos: 'Gastos', materials: 'Gastos', precios: 'Precios', contracts: 'Contratos', reporte: 'Reporte',
  usabilidad: 'Academia', biblioteca: 'Recursos', membresia: 'Membresía', settings: 'Configuración',
};
const hora = (iso: string) => { try { const d = new Date(iso); const hoy = new Date().toDateString() === d.toDateString(); return hoy ? d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }); } catch { return ''; } };
const diaMas = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const BIENVENIDA: MensajeSoporte = { id: 'hola', de: 'asistente', fecha: new Date().toISOString(), texto: '¡Hola! Soy el asistente de Innova. Te respondo al instante cómo usar el sistema. Si prefieres, toca "Hablar con Innova" y te atiende una persona.' };

// ── Burbuja de un mensaje ─────────────────────────────────────────────────────
function Burbuja({ m, propio, tickets, asesorias, onIr, onPersona, mostrarPersona }: {
  m: MensajeSoporte; propio: boolean; tickets: Ticket[]; asesorias: Asesoria[]; onIr?: (v: string) => void; onPersona?: () => void; mostrarPersona: boolean;
}) {
  if (m.de === 'sistema') return <div className="self-center max-w-[92%] text-center text-[11.5px] text-slate-600 bg-slate-200/80 px-3 py-1.5 rounded-full">{m.texto}</div>;
  if (m.tarjeta) {
    const t = m.tarjeta;
    const est = t.tipo === 'asesoria' ? asesorias.find(a => a.id === t.refId)?.status : tickets.find(k => k.id === t.refId)?.status;
    const ok = est === 'Programada' || est === 'Aceptada' || est === 'Completada' || est === 'Resuelto';
    const extra = t.tipo === 'asesoria' ? asesorias.find(a => a.id === t.refId) : null;
    return (
      <div className={`${propio ? 'self-end' : 'self-start'} w-[86%] min-w-0 bg-white border border-slate-200 rounded-2xl p-3 grid gap-1 text-[12.5px] [overflow-wrap:anywhere]`}>
        <b className="text-[13.5px] text-slate-900">{t.titulo}</b>
        <span className="text-slate-600">{t.detalle}</span>
        {extra?.scheduledDate && <span className="text-slate-700">📅 {extra.scheduledDate} {extra.scheduledTime || ''}</span>}
        {extra?.meetLink && <a href={extra.meetLink} target="_blank" rel="noreferrer" className="text-blue-700 font-bold underline">Entrar a la videollamada</a>}
        <span className={`justify-self-start text-[11px] font-black px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{est || 'Enviado'}</span>
      </div>
    );
  }
  const quien = m.de === 'admin' ? 'Innova Contratistas' : m.de === 'asistente' ? 'Asistente' : '';
  const color = propio ? 'bg-orange-500 text-white rounded-br-md' : m.de === 'admin' ? 'bg-sky-100 text-slate-900 rounded-bl-md' : 'bg-white text-slate-900 rounded-bl-md';
  return (
    <div className={`${propio ? 'self-end' : 'self-start'} max-w-[84%] min-w-0 px-3 py-2 rounded-2xl text-[13.5px] leading-snug shadow-[0_1px_1px_rgba(0,0,0,.05)] [overflow-wrap:anywhere] whitespace-pre-wrap ${color}`}>
      {!propio && quien && <span className={`block text-[10.5px] font-black mb-0.5 ${m.de === 'admin' ? 'text-sky-700' : 'text-slate-500'}`}>{quien}</span>}
      {m.foto && <img src={m.foto} alt="Foto enviada" className="rounded-xl max-h-60 w-auto max-w-full mb-1" />}
      {m.texto}
      {m.de === 'asistente' && (m.ir || mostrarPersona) && (
        <span className="flex flex-wrap gap-1.5 mt-2">
          {m.ir && onIr && <button type="button" onClick={() => onIr(m.ir!)} className="min-h-[38px] px-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-800 text-xs font-black cursor-pointer">Ir a {NOMBRE_VISTA[m.ir] || m.ir}</button>}
          {mostrarPersona && onPersona && <button type="button" onClick={onPersona} className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold cursor-pointer">Hablar con Innova</button>}
        </span>
      )}
      <span className={`block text-[10px] mt-1 text-right ${propio ? 'text-orange-100' : 'text-slate-400'}`}>{hora(m.fecha)}</span>
    </div>
  );
}

// ── Lista de mensajes + caja de escribir (sirve para usuario y admin) ────────
function Conversacion({ mensajes, propio, tickets, asesorias, onIr, onPersona, mostrarPersona, escribiendo, atajos, onEnviar, onFoto, placeholder }: {
  mensajes: MensajeSoporte[]; propio: (m: MensajeSoporte) => boolean; tickets: Ticket[]; asesorias: Asesoria[];
  onIr?: (v: string) => void; onPersona?: () => void; mostrarPersona: boolean; escribiendo: boolean;
  atajos: React.ReactNode; onEnviar: (t: string) => void; onFoto: (f: File) => void; placeholder: string;
}) {
  const [texto, setTexto] = useState('');
  const lista = useRef<HTMLDivElement>(null);
  const foto = useRef<HTMLInputElement>(null);
  useEffect(() => { const el = lista.current; if (el) el.scrollTop = el.scrollHeight; }, [mensajes.length, escribiendo]);
  const enviar = () => { const t = texto.trim(); if (!t) return; setTexto(''); onEnviar(t); };
  return (
    <>
      <div ref={lista} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-3 flex flex-col gap-2 [scrollbar-width:none]">
        {mensajes.map(m => <Burbuja key={m.id} m={m} propio={propio(m)} tickets={tickets} asesorias={asesorias} onIr={onIr} onPersona={onPersona} mostrarPersona={mostrarPersona} />)}
        {escribiendo && <div className="self-start bg-white rounded-2xl px-4 py-3 flex gap-1" aria-label="Escribiendo"><i className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" /><i className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:.15s]" /><i className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:.3s]" /></div>}
      </div>
      <div className="flex-none flex gap-1.5 overflow-x-auto px-2.5 py-1.5 [scrollbar-width:none]">{atajos}</div>
      <div className="flex-none flex items-center gap-1.5 px-2.5 pt-2 pb-2.5 bg-white border-t border-slate-200">
        <input ref={foto} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFoto(f); e.target.value = ''; }} />
        <button type="button" onClick={() => foto.current?.click()} aria-label="Adjuntar foto" className="w-11 h-11 shrink-0 rounded-xl bg-slate-100 text-lg cursor-pointer">📎</button>
        <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') enviar(); }} placeholder={placeholder} aria-label="Mensaje"
          className="flex-1 min-w-0 h-11 rounded-full border border-slate-200 px-4 text-[15px] text-slate-900 bg-white outline-none focus:border-orange-400" />
        <button type="button" onClick={enviar} aria-label="Enviar" className="w-11 h-11 shrink-0 rounded-full bg-orange-500 text-white text-lg cursor-pointer">➤</button>
      </div>
    </>
  );
}

const atajo = 'shrink-0 min-h-[40px] px-3 rounded-full border text-[12.5px] font-bold whitespace-nowrap cursor-pointer';

export default function AyudaSoporteView({ currentUser, isAdmin, tickets, setTickets, asesorias, setAsesorias, usuariosList, onIr, gestionarAlEntrar }: Props) {
  const [pestanaAdmin, setPestanaAdmin] = useState<'chats' | 'gestionar'>(gestionarAlEntrar ? 'gestionar' : 'chats');
  if (isAdmin) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 w-full sm:w-auto sm:inline-grid p-1 bg-white border border-slate-200 rounded-2xl gap-1">
          <button onClick={() => setPestanaAdmin('chats')} className={`min-h-[44px] px-3 rounded-xl text-[13px] font-black leading-tight cursor-pointer ${pestanaAdmin === 'chats' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>💬 Conversaciones</button>
          <button onClick={() => setPestanaAdmin('gestionar')} className={`min-h-[44px] px-3 rounded-xl text-[13px] font-black leading-tight cursor-pointer ${pestanaAdmin === 'gestionar' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>📅 Asesorías y reportes</button>
        </div>
        {pestanaAdmin === 'chats'
          ? <BandejaAdmin tickets={tickets} asesorias={asesorias} onGestionar={() => setPestanaAdmin('gestionar')} usuariosList={usuariosList} />
          : <SoporteYAsesoriasView tickets={tickets} setTickets={setTickets} asesorias={asesorias} setAsesorias={setAsesorias} currentUser={currentUser} isAdmin usuariosList={usuariosList} />}
      </div>
    );
  }
  return <ChatUsuario currentUser={currentUser} tickets={tickets} setTickets={setTickets} asesorias={asesorias} setAsesorias={setAsesorias} onIr={onIr} />;
}

// ── Vista del usuario ─────────────────────────────────────────────────────────
function ChatUsuario({ currentUser, tickets, setTickets, asesorias, setAsesorias, onIr }: {
  currentUser: SystemUser | null; tickets: Ticket[]; setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  asesorias: Asesoria[]; setAsesorias: React.Dispatch<React.SetStateAction<Asesoria[]>>; onIr?: (v: string) => void;
}) {
  const ws = wsDe(currentUser?.id);
  const nombre = currentUser?.name || 'Usuario';
  const [chat, setChat] = useState<ChatSoporte | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [hoja, setHoja] = useState<null | 'asesoria' | 'reporte'>(null);
  const [aviso, setAviso] = useState('');
  useEffect(() => (ws ? escucharChat(ws, setChat) : undefined), [ws]);
  useEffect(() => { if (ws && (chat?.sinLeerUsuario || 0) > 0) marcarLeido(ws, 'usuario'); }, [ws, chat?.sinLeerUsuario]);
  const mensajes = useMemo(() => [BIENVENIDA, ...(chat?.mensajes || [])], [chat?.mensajes]);
  const conPersona = !!chat?.conPersona;
  const mostrar = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 2600); };

  const pasarAPersona = async (motivo?: string) => {
    if (conPersona || !ws) return;
    await agregarMensaje(ws, { de: 'sistema', texto: motivo || 'Pasamos tu conversación a Innova Contratistas. Te avisaremos cuando responda.' }, { conPersona: true, resuelto: false, sinLeerAdmin: 1 } as any, nombre);
  };
  const enviar = async (texto: string) => {
    if (!ws) { mostrar('Confirma tu PIN para usar el chat.'); return; }
    try { await agregarMensaje(ws, { de: 'usuario', texto }, conPersona ? { resuelto: false } : {}, nombre); }
    catch { mostrar('No se pudo enviar. Revisa tu conexión.'); return; }
    if (conPersona) return;
    setEscribiendo(true);
    let r: 'ok' | 'no' | 'tope' = 'no';
    if (iaHabilitadaUsuarios()) r = await preguntarAsistente(texto);
    if (r !== 'ok') {
      const loc = respuestaLocal(texto);
      const txt = r === 'tope' ? 'Ya hiciste muchas preguntas hoy al asistente. Si es urgente, toca "Hablar con Innova".'
        : loc ? loc.texto : 'No encontré esa respuesta en el manual. ¿Quieres que te pase con una persona de Innova?';
      await agregarMensaje(ws, { de: 'asistente', texto: txt, ...(loc?.ir ? { ir: loc.ir } : {}) }).catch(() => {});
    }
    setEscribiendo(false);
  };
  const enviarFoto = async (f: File) => {
    if (!ws) return;
    try { const foto = await comprimirFoto(f); await agregarMensaje(ws, { de: 'usuario', foto }, { conPersona: true, resuelto: false }, nombre); }
    catch { mostrar('No se pudo enviar la foto.'); }
  };

  return (
    <div className="-mx-4 sm:mx-0 -mt-4 sm:mt-0 flex flex-col h-[calc(100dvh-150px)] xl:h-[calc(100vh-130px)] min-h-[440px] bg-slate-100 sm:rounded-3xl overflow-hidden sm:border sm:border-slate-200 relative">
      <div className="flex-none flex items-center gap-3 px-3.5 py-3 bg-white border-b border-slate-200">
        <span className="w-10 h-10 rounded-xl bg-orange-100 grid place-items-center text-xl shrink-0">{conPersona ? '👷' : '✨'}</span>
        <span className="min-w-0">
          <b className="block text-[15px] text-slate-900 truncate">{conPersona ? 'Innova Contratistas' : 'Ayuda y soporte'}</b>
          <span className="flex items-center gap-1.5 text-[11.5px] text-slate-500"><i className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{conPersona ? 'Te responde una persona' : 'Asistente · responde al instante'}</span>
        </span>
      </div>
      <Conversacion
        mensajes={mensajes} propio={m => m.de === 'usuario'} tickets={tickets} asesorias={asesorias}
        onIr={onIr} onPersona={() => pasarAPersona()} mostrarPersona={!conPersona} escribiendo={escribiendo}
        onEnviar={enviar} onFoto={enviarFoto} placeholder={conPersona ? 'Escribe a Innova…' : 'Escribe tu duda…'}
        atajos={<>
          {!conPersona && <button className={`${atajo} border-orange-300 bg-orange-50 text-orange-800`} onClick={() => pasarAPersona()}>👷 Hablar con Innova</button>}
          <button className={`${atajo} border-slate-200 bg-white text-slate-800`} onClick={() => setHoja('asesoria')}>📅 Agendar asesoría</button>
          <button className={`${atajo} border-slate-200 bg-white text-slate-800`} onClick={() => setHoja('reporte')}>⚠️ Reportar un problema</button>
          {!conPersona && <>
            <button className={`${atajo} border-slate-200 bg-white text-slate-800`} onClick={() => enviar('¿Cómo dibujo una losa?')}>¿Cómo dibujo una losa?</button>
            <button className={`${atajo} border-slate-200 bg-white text-slate-800`} onClick={() => enviar('No me sale el presupuesto')}>No me sale el presupuesto</button>
          </>}
        </>}
      />
      {aviso && <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-10 bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl">{aviso}</div>}
      {hoja === 'asesoria' && <HojaAsesoria onCerrar={() => setHoja(null)} onEnviar={async (tema, dia, horaSel, notas) => {
        const a: Asesoria = { id: Date.now().toString(), subject: `Asesoría · ${tema}`, requestedDate: dia, notes: notas || undefined, status: 'Pendiente',
          authorName: nombre, authorUserId: currentUser?.id, authorPhone: currentUser?.phone, scheduledTime: horaSel, createdAt: new Date().toISOString() };
        setAsesorias(prev => [a, ...prev]);
        await agregarMensaje(ws, { de: 'usuario', tarjeta: { tipo: 'asesoria', refId: a.id, titulo: `📅 Asesoría · ${tema}`, detalle: `${dia} · ${horaSel} · por videollamada${notas ? ` · ${notas}` : ''}` } }, { conPersona: true, resuelto: false }, nombre).catch(() => {});
        setHoja(null); mostrar('Asesoría solicitada. Te avisaremos al confirmarla.');
      }} />}
      {hoja === 'reporte' && <HojaReporte onCerrar={() => setHoja(null)} onEnviar={async (donde, texto, foto) => {
        const t: Ticket = { id: Date.now().toString(), title: `${donde}: ${texto.slice(0, 60)}`, description: texto, status: 'Abierto', createdAt: new Date().toISOString(),
          author: currentUser?.id || 'usuario', authorName: nombre, authorRole: currentUser?.role || 'Usuario' };
        setTickets(prev => [t, ...prev]);
        await agregarMensaje(ws, { de: 'usuario', tarjeta: { tipo: 'reporte', refId: t.id, titulo: `⚠️ Reporte · ${donde}`, detalle: texto } }, { conPersona: true, resuelto: false }, nombre).catch(() => {});
        if (foto) await agregarMensaje(ws, { de: 'usuario', foto }, {}, nombre).catch(() => {});
        setHoja(null); mostrar('Reporte enviado. Lo revisamos y te avisamos.');
      }} />}
    </div>
  );
}

// ── Hojas que suben desde abajo ───────────────────────────────────────────────
function Hoja({ titulo, sub, onCerrar, children }: { titulo: string; sub: string; onCerrar: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 bg-slate-900/40 flex items-end" onClick={onCerrar}>
      <div className="w-full max-h-[85%] overflow-y-auto bg-white rounded-t-3xl p-4 pb-5 grid gap-3" onClick={e => e.stopPropagation()}>
        <div><p className="text-base font-black text-slate-900">{titulo}</p><p className="text-xs text-slate-500">{sub}</p></div>
        {children}
      </div>
    </div>
  );
}
function Fichas({ opciones, valor, onCambio }: { opciones: string[]; valor: string; onCambio: (v: string) => void }) {
  return <div className="flex flex-wrap gap-1.5">{opciones.map(o => (
    <button key={o} type="button" aria-pressed={valor === o} onClick={() => onCambio(o)}
      className={`min-h-[40px] px-3 rounded-xl border text-[13px] font-bold cursor-pointer ${valor === o ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-200'}`}>{o}</button>
  ))}</div>;
}
const etq = 'text-[11px] font-black uppercase tracking-wider text-slate-500';
function HojaAsesoria({ onCerrar, onEnviar }: { onCerrar: () => void; onEnviar: (tema: string, dia: string, hora: string, notas: string) => void }) {
  const dias = [1, 2, 3, 4, 5].map(n => diaMas(n).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }));
  const [tema, setTema] = useState('Techos'); const [dia, setDia] = useState(dias[0]); const [h, setH] = useState('10:00'); const [notas, setNotas] = useState('');
  return (
    <Hoja titulo="Agendar asesoría" sub="Por videollamada. Al confirmarla te llega el enlace aquí mismo." onCerrar={onCerrar}>
      <span className={etq}>Tema</span><Fichas opciones={['Techos', 'Obra Civil', 'Drywall', 'Carpintería', 'Presupuestos']} valor={tema} onCambio={setTema} />
      <span className={etq}>Día</span><Fichas opciones={dias} valor={dia} onCambio={setDia} />
      <span className={etq}>Hora</span><Fichas opciones={['9:00', '10:00', '12:00', '16:00', '18:30']} valor={h} onCambio={setH} />
      <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="¿Qué necesitas revisar? (opcional)" className="w-full min-h-[70px] rounded-xl border border-slate-200 p-3 text-[15px] text-slate-900 resize-none" />
      <button type="button" onClick={() => onEnviar(tema, dia, h, notas.trim())} className="min-h-[48px] rounded-2xl bg-orange-500 text-white font-black cursor-pointer">Solicitar asesoría</button>
      <button type="button" onClick={onCerrar} className="min-h-[44px] rounded-2xl bg-slate-100 text-slate-700 font-bold cursor-pointer">Cancelar</button>
    </Hoja>
  );
}
function HojaReporte({ onCerrar, onEnviar }: { onCerrar: () => void; onEnviar: (donde: string, texto: string, foto?: string) => void }) {
  const [donde, setDonde] = useState('Techos'); const [texto, setTexto] = useState(''); const [foto, setFoto] = useState<string | undefined>();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Hoja titulo="Reportar un problema" sub="Cuéntanos qué pasó. Si puedes, adjunta una captura." onCerrar={onCerrar}>
      <span className={etq}>¿Dónde?</span><Fichas opciones={['Techos', 'Obra Civil', 'Drywall', 'Carpintería', 'Presupuesto', 'Otro']} valor={donde} onCambio={setDonde} />
      <span className={etq}>¿Qué pasó?</span>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ej.: guardo el diseño y al volver no aparece" className="w-full min-h-[80px] rounded-xl border border-slate-200 p-3 text-[15px] text-slate-900 resize-none" />
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setFoto(await comprimirFoto(f).catch(() => undefined)); e.target.value = ''; }} />
      <button type="button" onClick={() => ref.current?.click()} className="min-h-[44px] rounded-2xl bg-slate-100 text-slate-700 font-bold cursor-pointer">{foto ? '✓ Captura adjunta (cambiar)' : '📷 Adjuntar captura'}</button>
      <button type="button" disabled={!texto.trim()} onClick={() => onEnviar(donde, texto.trim(), foto)} className="min-h-[48px] rounded-2xl bg-orange-500 text-white font-black cursor-pointer disabled:opacity-50">Enviar reporte</button>
    </Hoja>
  );
}

// ── Vista del administrador ───────────────────────────────────────────────────
const RAPIDAS = ['¡Hola! Ya lo reviso y te escribo en unos minutos 🙌', 'Listo, ya quedó. Vuelve a intentarlo y me cuentas.', 'Te agendo una asesoría para verlo juntos. ¿Te parece mañana a las 10:00?'];
// Bandeja inteligente: cada conversación recibe una prioridad según lo que el usuario
// espera (pago o error > pidió una persona > asesoría > duda) y cuánto lleva esperando.
type Prioridad = 'urg' | 'per' | 'ase' | 'nor' | 'listo';
type Motivo = 'pago' | 'error' | 'asesoria' | 'duda' | null;
const RX_PAGO = /pag(u|o|ar|é)|yape|plin|transfer|cr[eé]dit|plan |no se activ|membres/i;
const RX_ERROR = /no funciona|no puedo|no me deja|error|se borr|no carga|no aparece|no abre|se cierra|falla|bug/i;
const PESO: Record<Prioridad, number> = { urg: 0, per: 1, ase: 2, nor: 3, listo: 4 };
function analizar(c: ChatSoporte, asesorias: Asesoria[]) {
  const ms = c.mensajes || [];
  // Mensajes del usuario después de la última respuesta del admin: lo que falta atender.
  let k = ms.length - 1; while (k >= 0 && ms[k].de !== 'admin') k--;
  const pend = ms.slice(k + 1).filter(m => m.de === 'usuario');
  const espera = !c.resuelto && (c.sinLeerAdmin || 0) > 0 && pend.length > 0;
  const desde = espera ? pend[0].fecha : undefined;
  const texto = pend.map(m => `${m.texto || ''} ${m.tarjeta?.titulo || ''} ${m.tarjeta?.detalle || ''}`).join(' ');
  const asePend = ms.some(m => m.tarjeta?.tipo === 'asesoria' && !['Programada', 'Aceptada', 'Completada', 'Cancelada', 'Rechazada'].includes(String(asesorias.find(a => a.id === m.tarjeta!.refId)?.status || '')));
  let motivo: Motivo = null;
  if (espera && RX_PAGO.test(texto)) motivo = 'pago';
  else if (espera && (pend.some(m => m.tarjeta?.tipo === 'reporte') || RX_ERROR.test(texto))) motivo = 'error';
  else if (asePend && !c.resuelto) motivo = 'asesoria';
  else if (espera) motivo = 'duda';
  const prio: Prioridad = c.resuelto ? 'listo'
    : motivo === 'pago' || motivo === 'error' ? 'urg'
    : c.conPersona && espera ? 'per'
    : motivo === 'asesoria' ? 'ase'
    : espera ? 'nor' : 'listo';
  const horas = desde ? (Date.now() - new Date(desde).getTime()) / 3600e3 : 0;
  return { prio, motivo, desde, horas, espera };
}
const esperaTxt = (h: number) => h < 1 / 60 ? 'ahora' : h < 1 ? `${Math.round(h * 60)} min` : h < 24 ? `${Math.floor(h)} h` : `${Math.floor(h / 24)} d`;
const MOTIVO: Record<Exclude<Motivo, null>, [string, string]> = {
  pago: ['💳', 'Pago o créditos'], error: ['⚠️', 'Error'], asesoria: ['📅', 'Asesoría'], duda: ['❓', 'Duda'],
};
const BORDE: Record<Prioridad, string> = { urg: 'border-l-red-500', per: 'border-l-orange-400', ase: 'border-l-sky-500', nor: 'border-l-slate-300', listo: 'border-l-emerald-300' };
type Filtro = 'pend' | 'urg' | 'per' | 'ase' | 'pago' | 'error' | 'duda' | 'todas';
const planCache = new Map<string, boolean>();

function BandejaAdmin({ tickets, asesorias, onGestionar, usuariosList }: { tickets: Ticket[]; asesorias: Asesoria[]; onGestionar: () => void; usuariosList: SystemUser[] }) {
  const [chats, setChats] = useState<ChatSoporte[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('pend');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [conPlan, setConPlan] = useState<Record<string, boolean>>({});
  const [, setTic] = useState(0);
  useEffect(() => escucharBandeja(setChats), []);
  useEffect(() => { const t = setInterval(() => setTic(x => x + 1), 60000); return () => clearInterval(t); }, []); // tiempos de espera al día
  // 👑 Usuarios con plan de pago (se consulta una vez por usuario).
  useEffect(() => {
    let vivo = true;
    chats.forEach(c => {
      if (planCache.has(c.ws)) { if (conPlan[c.ws] === undefined) setConPlan(p => ({ ...p, [c.ws]: planCache.get(c.ws)! })); return; }
      planCache.set(c.ws, false);
      getAIAccess(c.ws).then(a => {
        const ok = !!a && !!a.planId && a.planId !== 'gratis' && !(a.venceEl && new Date(a.venceEl).getTime() < Date.now());
        planCache.set(c.ws, ok); if (vivo) setConPlan(p => ({ ...p, [c.ws]: ok }));
      });
    });
    return () => { vivo = false; };
  }, [chats]); // eslint-disable-line react-hooks/exhaustive-deps
  // Cierre automático: solo con el asistente, sin nada pendiente y más de 24 h quieta.
  useEffect(() => {
    chats.forEach(c => {
      if (!c.resuelto && !c.conPersona && c.ultimoDe === 'asistente' && !(c.sinLeerAdmin || 0) && c.actualizado && Date.now() - new Date(c.actualizado).getTime() > 24 * 3600e3) ajustarChat(c.ws, { resuelto: true });
    });
  }, [chats]);
  const chat = chats.find(c => c.ws === abierta) || null;
  useEffect(() => { if (abierta && (chat?.sinLeerAdmin || 0) > 0) marcarLeido(abierta, 'admin'); }, [abierta, chat?.sinLeerAdmin]);
  const nombreDe = (c: ChatSoporte) => c.nombre || usuariosList.find(u => wsDe(u.id) === c.ws)?.name || c.ws;
  const ahora = Date.now();
  const pospuesta = (c: ChatSoporte) => !!c.pospuestaHasta && new Date(c.pospuestaHasta).getTime() > ahora;
  const datos = useMemo(() => chats.map(c => ({ c, ...analizar(c, asesorias) })), [chats, asesorias]);
  const activos = datos.filter(d => d.prio !== 'listo' && !pospuesta(d.c));
  const cuenta = (f: Filtro) => f === 'todas' ? datos.length : f === 'pend' ? activos.length
    : ['urg', 'per', 'ase'].includes(f) ? activos.filter(d => d.prio === f).length : activos.filter(d => d.motivo === f).length;
  const lista = (filtro === 'todas' ? datos : filtro === 'pend' ? activos
    : ['urg', 'per', 'ase'].includes(filtro) ? activos.filter(d => d.prio === filtro) : activos.filter(d => d.motivo === filtro))
    .slice().sort((x, y) => (Number(!!y.c.fijada) - Number(!!x.c.fijada)) || (PESO[x.prio] - PESO[y.prio])
      || (Number(!!conPlan[y.c.ws]) - Number(!!conPlan[x.c.ws])) || (y.horas - x.horas)
      || String(y.c.actualizado || '').localeCompare(String(x.c.actualizado || '')));
  const posponiendo = datos.filter(d => d.prio !== 'listo' && pospuesta(d.c)).length;
  const filtroBtn = (id: Filtro, txt: string, color = 'bg-slate-900 border-slate-900') => {
    const n = cuenta(id);
    if (n === 0 && !['pend', 'todas'].includes(id) && filtro !== id) return null;
    return <button key={id} onClick={() => setFiltro(id)} className={`shrink-0 min-h-[40px] px-3.5 rounded-full border text-[12.5px] font-bold whitespace-nowrap cursor-pointer ${filtro === id ? `${color} text-white` : 'bg-white text-slate-700 border-slate-200'}`}>{txt} <span className="opacity-80">{n}</span></button>;
  };
  const accion = 'min-w-0 inline-flex items-center justify-center gap-1 min-h-[40px] px-3 rounded-xl border text-[12px] font-bold cursor-pointer [white-space:nowrap]';
  const manana = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString(); };

  if (chat) {
    return (
      <div className="-mx-4 sm:mx-0 flex flex-col h-[calc(100dvh-210px)] xl:h-[calc(100vh-190px)] min-h-[440px] bg-slate-100 sm:rounded-3xl overflow-hidden sm:border sm:border-slate-200">
        <div className="flex-none flex items-center gap-3 px-3 py-2.5 bg-white border-b border-slate-200">
          <button onClick={() => setAbierta(null)} className="min-h-[40px] px-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-black cursor-pointer shrink-0">‹ Bandeja</button>
          <span className="min-w-0"><b className="block text-[15px] text-slate-900 truncate">{nombreDe(chat)}</b><span className="block text-[11.5px] text-slate-500 truncate">{chat.conPersona ? 'Pidió hablar con Innova' : 'Solo con el asistente'}</span></span>
        </div>
        <Conversacion
          mensajes={chat.mensajes || []} propio={m => m.de === 'admin'} tickets={tickets} asesorias={asesorias}
          mostrarPersona={false} escribiendo={false} placeholder={`Responder a ${nombreDe(chat).split(' ')[0]}…`}
          onEnviar={t => agregarMensaje(chat.ws, { de: 'admin', texto: t }, { conPersona: true, resuelto: false })}
          onFoto={async f => { const foto = await comprimirFoto(f).catch(() => ''); if (foto) agregarMensaje(chat.ws, { de: 'admin', foto }, { conPersona: true }); }}
          atajos={<>
            {RAPIDAS.map((r, i) => <button key={i} className={`${atajo} border-slate-200 bg-white text-slate-800 max-w-[260px] overflow-hidden text-ellipsis`} onClick={() => agregarMensaje(chat.ws, { de: 'admin', texto: r }, { conPersona: true, resuelto: false })}>{r}</button>)}
            <button className={`${atajo} border-emerald-300 bg-emerald-50 text-emerald-800`} onClick={async () => { await agregarMensaje(chat.ws, { de: 'sistema', texto: 'Conversación marcada como resuelta. Si necesitas algo más, escríbenos.' }, { resuelto: true, sinLeerAdmin: 0 } as any); setAbierta(null); }}>✓ Marcar resuelto</button>
            <button className={`${atajo} border-slate-200 bg-white text-slate-800`} onClick={onGestionar}>📅 Gestionar asesorías</button>
          </>}
        />
      </div>
    );
  }
  return (
    <div className="grid gap-3 min-w-0">
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] -mx-1 px-1">
        {filtroBtn('pend', 'Pendientes')}
        {filtroBtn('urg', '🔴 Urgentes', 'bg-red-600 border-red-600')}
        {filtroBtn('per', '🟠 Esperan persona', 'bg-orange-500 border-orange-500')}
        {filtroBtn('ase', '📅 Asesorías', 'bg-sky-600 border-sky-600')}
        {filtroBtn('pago', '💳 Pagos')}
        {filtroBtn('error', '⚠️ Errores')}
        {filtroBtn('duda', '❓ Dudas')}
        {filtroBtn('todas', 'Todas')}
      </div>
      {filtro === 'pend' && posponiendo > 0 && <p className="text-[11.5px] text-slate-500 -mt-1">⏰ {posponiendo} pospuesta{posponiendo > 1 ? 's' : ''} hasta mañana (en "Todas").</p>}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        {lista.length === 0 && <p className="text-center text-sm text-slate-500 bg-white rounded-2xl p-6">{filtro === 'todas' ? 'Todavía no hay conversaciones.' : 'Nada pendiente 🎉'}</p>}
        {lista.map(({ c, prio, motivo, horas, espera }) => {
          const colorEspera = horas >= 24 ? 'bg-red-100 text-red-800' : horas >= 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';
          return (
            <div key={c.ws} className={`w-full min-w-0 bg-white rounded-2xl border border-slate-100 border-l-4 ${BORDE[prio]} ${c.fijada ? 'ring-1 ring-orange-200' : ''}`}>
              <button onClick={() => setAbierta(c.ws)} className="w-full min-w-0 flex items-start gap-3 p-3 pb-2 text-left cursor-pointer">
                <span className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 grid place-items-center font-black shrink-0">{nombreDe(c).split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()}</span>
                <span className="min-w-0 flex-1 grid gap-0.5">
                  <span className="flex items-center gap-1 min-w-0">
                    {c.fijada && <span className="shrink-0" title="Fijada">📌</span>}
                    <b className="text-[14px] text-slate-900 truncate">{nombreDe(c)}</b>
                    {conPlan[c.ws] && <span className="shrink-0 text-[12px]" title="Tiene plan de pago">👑</span>}
                  </span>
                  <span className="block text-[12px] text-slate-500 truncate">{c.ultimoDe === 'admin' ? 'Tú: ' : ''}{c.ultimo || ''}</span>
                  <span className="flex flex-wrap gap-1 mt-0.5">
                    {motivo && <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">{MOTIVO[motivo][0]} {MOTIVO[motivo][1]}</span>}
                    {c.conPersona && !c.resuelto && <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800">Pidió persona</span>}
                    {c.resuelto && <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">Resuelto</span>}
                    {pospuesta(c) && <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-800">⏰ Mañana</span>}
                  </span>
                </span>
                <span className="shrink-0 grid justify-items-end gap-1 text-[10.5px] text-slate-400">
                  {espera ? <span className={`text-[10.5px] font-black px-1.5 py-0.5 rounded-md ${colorEspera}`}>⏱ {esperaTxt(horas)}</span> : (c.actualizado ? hora(c.actualizado) : '')}
                  {(c.sinLeerAdmin || 0) > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[11px] font-black grid place-items-center">{c.sinLeerAdmin}</span>}
                </span>
              </button>
              <div className="grid grid-cols-3 gap-1.5 px-3 pb-2.5 sm:flex sm:pl-[64px]">
                <button onClick={() => ajustarChat(c.ws, { fijada: !c.fijada })} className={`${accion} ${c.fijada ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white text-slate-700'}`}>📌 {c.fijada ? 'Soltar' : 'Fijar'}</button>
                {!c.resuelto && <button onClick={() => ajustarChat(c.ws, { pospuestaHasta: pospuesta(c) ? null : manana() })} className={`${accion} border-slate-200 bg-white text-slate-700`}>⏰ {pospuesta(c) ? 'Quitar' : 'Mañana'}</button>}
                {c.resuelto
                  ? <button onClick={() => ajustarChat(c.ws, { resuelto: false })} className={`${accion} border-slate-200 bg-white text-slate-700`}>↺ Reabrir</button>
                  : <button onClick={() => agregarMensaje(c.ws, { de: 'sistema', texto: 'Conversación marcada como resuelta. Si necesitas algo más, escríbenos.' }, { resuelto: true, sinLeerAdmin: 0, fijada: false } as any)} className={`${accion} border-emerald-300 bg-emerald-50 text-emerald-800`}>✓ Resolver</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
