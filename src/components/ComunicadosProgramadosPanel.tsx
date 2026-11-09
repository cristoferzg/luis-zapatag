// Configuración (admin) → Comunicados programados y automáticos.
// 1) Programados: título + mensaje + día y hora (Lima). Salen solos a esa hora.
// 2) Automáticos: una biblioteca de mensajes que se publica sola, rotando, cada semana /
//    quincena / mes, el día y la hora elegidos (por defecto martes 9:00 a. m.).
// Los publica la Cloud Function `comunicadosAutomaticos` (cada 15 min). Datos en
// `comunicados_programados` (solo admin). No hace falta tocar el sistema después de cargarlos.
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Repeat, Trash2, Plus, Check, X, Pencil } from 'lucide-react';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Prioridad = 'info' | 'important' | 'alert';
interface Programado { id: string; title: string; message: string; priority: Prioridad; durationHours: number; publicarEn: number; estado: 'pendiente' | 'publicando' | 'publicado' | 'cancelado'; publicadoEl?: number }
interface MensajeAuto { id: string; title: string; message: string }
interface ConfigAuto { activo: boolean; frecuencia: 'semanal' | 'quincenal' | 'mensual'; dia: number; hora: number; prioridad: Prioridad; duracionHoras: number; mensajes: MensajeAuto[]; indice?: number; ultimoEnvio?: string; ultimoMensaje?: string }

const COL = 'comunicados_programados';
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const hhmm = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'a. m.' : 'p. m.'}`;
const MENSAJES_BASE: MensajeAuto[] = [
  ['🤖 Diseña con IA en segundos', 'Describe tu obra o súbele una foto y la IA arma tu techo metálico con medidas y materiales.'],
  ['⚡ Lo que te tomaba horas, ahora en 1 minuto', 'Escribe «techo de 8 × 12 m a dos aguas» y recibe el diseño listo para cotizar.'],
  ['📸 Toma una foto, recibe tu diseño', 'Sube un croquis a mano o un plano y conviértelo en tu techo metálico con sus perfiles.'],
  ['💰 Cotiza rápido y gana más', 'En Techos → Cotización rápida ves los materiales, el total al cliente y tu ganancia al instante.'],
  ['🧱 Drywall en 1 minuto', 'Arma tabiques y cielos rasos con sus materiales y precio, listo para enviar por WhatsApp.'],
  ['🚿 Gasfitería que se revisa sola', 'Traza agua y desagüe y comprueba que todo cumpla la IS.010 antes de ejecutar la obra.'],
  ['🔌 Instalaciones eléctricas seguras', 'Circuitos, llaves y cables calculados con el CNE, con su cuadro de cargas y su presupuesto.'],
  ['🪵 Muebles de melamina a medida', 'Diseña cocinas y closets, ábrelos en 3D y saca el corte de tableros en minutos.'],
  ['📊 Tu presupuesto de obra completo', 'Junta techos, obra civil, acabados e instalaciones en un solo presupuesto con cronograma.'],
  ['📷 Muestra el avance a tu cliente', 'Sube fotos del avance de obra desde el celular y compártelas con un link.'],
  ['🎓 Aprende algo nuevo esta semana', 'Revisa las clases de la Academia Técnica y los recursos que puedes descargar.'],
  ['🧾 Ordena tus gastos por obra', 'Registra boletas y gastos de cada proyecto y conoce cuánto ganas en cada uno.'],
].map(([title, message], i) => ({ id: 'base_' + (i + 1), title, message }));
// Mensajes para vender créditos (se suman a la biblioteca con un botón; no repiten los que ya están).
export const MENSAJES_VENTAS: MensajeAuto[] = [
  ['🎁 Tienes créditos de regalo', 'Cada cuenta nueva trae créditos para probar la IA: sube la foto de tu plano a mano y mira cómo se arma tu techo.'],
  ['💸 Tu primera recarga vale el DOBLE', 'Recarga créditos por primera vez y recibe el doble. Entra a Membresía → Recargar.'],
  ['🌬️ Techo con cortaviento en 1 minuto', 'Dibuja tu techo a mano, súbelo y la IA lo arma con su cortaviento, columnas y cobertura.'],
  ['🤝 Invita a un colega y gana 20 créditos', 'Comparte la app desde Membresía. Cuando tu colega tenga su acceso, se te suman 20 créditos.'],
  ['⏱️ Cotiza mientras el cliente espera', 'Con la IA armas el plano y el presupuesto en minutos: el cliente ve su obra antes de irse.'],
  ['🪙 Desde S/ 3.90 para probar', 'La recarga más pequeña te alcanza para 2 planos a mano. Los créditos que compras no vencen.'],
].map(([title, message], i) => ({ id: 'ventas_' + (i + 1), title, message }));
const CONFIG_BASE: ConfigAuto = { activo: false, frecuencia: 'semanal', dia: 2, hora: 9, prioridad: 'important', duracionHoras: 48, mensajes: MENSAJES_BASE };

/** Fecha y hora (Lima, UTC-5 todo el año) → milisegundos. */
const msLima = (fecha: string, hora: string) => new Date(`${fecha}T${hora || '09:00'}:00-05:00`).getTime();
const verLima = (ms: number) => new Date(ms).toLocaleString('es-PE', { timeZone: 'America/Lima', weekday: 'short', day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
/** Próximo envío de la biblioteca (aprox.): siguiente día/hora elegidos respetando la frecuencia. */
function proximoEnvio(c: ConfigAuto): number {
  const ahora = Date.now();
  const minDias = c.frecuencia === 'mensual' ? 27 : c.frecuencia === 'quincenal' ? 13 : 6;
  const desde = c.ultimoEnvio ? Math.max(ahora, msLima(c.ultimoEnvio, '00:00') + minDias * 864e5) : ahora;
  for (let i = 0; i < 40; i++) {
    const d = new Date(desde + i * 864e5);
    const f = d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const t = msLima(f, `${String(c.hora).padStart(2, '0')}:00`);
    const dia = new Date(t).toLocaleDateString('en-US', { timeZone: 'America/Lima', weekday: 'short' });
    if (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dia) === c.dia && t > ahora - 15 * 60e3) return t;
  }
  return 0;
}

const inp = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-slate-300';
const lab = 'block text-[10px] font-bold text-slate-400 uppercase mb-1';

export default function ComunicadosProgramadosPanel() {
  const sim = import.meta.env.DEV ? (window as any).__programadosSimulados : null;
  const [lista, setLista] = useState<Programado[]>(sim?.lista || []);
  const [cfg, setCfg] = useState<ConfigAuto>(sim?.cfg || CONFIG_BASE);
  const [borrador, setBorrador] = useState<ConfigAuto | null>(null);
  const [msg, setMsg] = useState('');
  const aviso = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 3500); };

  useEffect(() => {
    if (sim) return;
    return onSnapshot(collection(db, COL), s => {
      const progs: Programado[] = [];
      s.docs.forEach(d => { if (d.id === '_auto') setCfg({ ...CONFIG_BASE, ...(d.data() as ConfigAuto) }); else progs.push({ id: d.id, ...(d.data() as any) }); });
      setLista(progs);
    }, () => { /* sin permiso o sin red: se queda lo de por defecto */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Programar uno ----
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const [f, setF] = useState({ title: '', message: '', fecha: hoy, hora: '09:00', priority: 'important' as Prioridad, durationHours: 48 });
  const programar = async () => {
    if (!f.title.trim() || !f.message.trim()) { aviso('Escribe el título y el mensaje.'); return; }
    const publicarEn = msLima(f.fecha, f.hora);
    if (!Number.isFinite(publicarEn) || publicarEn < Date.now() - 60e3) { aviso('Elige una fecha y hora que todavía no pasó.'); return; }
    const p: Programado = { id: 'prog_' + Date.now(), title: f.title.trim(), message: f.message.trim(), priority: f.priority, durationHours: f.durationHours, publicarEn, estado: 'pendiente' };
    try { if (!sim) await setDoc(doc(db, COL, p.id), { ...p, creadoEl: Date.now() }); else setLista(l => [...l, p]); setF({ ...f, title: '', message: '' }); aviso(`Programado para ${verLima(publicarEn)}.`); }
    catch { aviso('No se pudo guardar. Revisa tu conexión.'); }
  };
  const quitar = async (p: Programado) => { try { if (!sim) await deleteDoc(doc(db, COL, p.id)); else setLista(l => l.filter(x => x.id !== p.id)); } catch { aviso('No se pudo quitar.'); } };

  const pendientes = useMemo(() => lista.filter(p => p.estado === 'pendiente' || p.estado === 'publicando').sort((a, b) => a.publicarEn - b.publicarEn), [lista]);
  const publicados = useMemo(() => lista.filter(p => p.estado === 'publicado').sort((a, b) => (b.publicadoEl || 0) - (a.publicadoEl || 0)).slice(0, 3), [lista]);

  // ---- Automáticos ----
  const c = borrador || cfg;
  const cambiar = (parte: Partial<ConfigAuto>) => setBorrador({ ...c, ...parte });
  const guardarAuto = async (forzar?: Partial<ConfigAuto>) => {
    const nuevo = { ...c, ...forzar };
    try { if (!sim) await setDoc(doc(db, COL, '_auto'), JSON.parse(JSON.stringify(nuevo)), { merge: true }); setCfg(nuevo); setBorrador(null); aviso(nuevo.activo ? 'Guardado: los mensajes saldrán solos.' : 'Guardado. Los automáticos están apagados.'); }
    catch { aviso('No se pudo guardar. Revisa tu conexión.'); }
  };
  const [editando, setEditando] = useState<string | null>(null);
  const siguiente = c.mensajes.length ? c.mensajes[(Number(c.indice) || 0) % c.mensajes.length] : null;
  const prox = c.activo ? proximoEnvio(c) : 0;

  return (
    <div className="bg-white p-4 xl:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-nowrap items-center gap-2 border-b border-slate-100 pb-3">
        <div className="p-2 bg-violet-50 text-violet-600 rounded-xl border border-violet-100 shrink-0"><CalendarClock className="w-4 h-4" /></div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Comunicados programados</h3>
          <p className="text-[11px] text-slate-400">Se publican solos el día y la hora que elijas (hora de Perú), con su notificación al celular y a la PC.</p>
        </div>
      </div>

      {/* Programar uno */}
      <div className="grid gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={lab}>Título *</label><input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} maxLength={80} placeholder="Ej. 🤖 Diseña con IA en segundos" className={inp} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lab}>Día</label><input type="date" value={f.fecha} min={hoy} onChange={e => setF({ ...f, fecha: e.target.value })} className={inp} /></div>
            <div><label className={lab}>Hora</label><input type="time" value={f.hora} onChange={e => setF({ ...f, hora: e.target.value })} className={inp} /></div>
          </div>
        </div>
        <div><label className={lab}>Mensaje *</label><textarea rows={2} value={f.message} maxLength={300} onChange={e => setF({ ...f, message: e.target.value })} placeholder="Corto y con un beneficio: lo que el usuario gana al tocarlo." className={inp + ' resize-none font-medium'} /></div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-36"><label className={lab}>Prioridad</label><select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value as Prioridad })} className={inp}><option value="info">📌 Informativo</option><option value="important">⚠️ Importante</option><option value="alert">🚨 Urgente</option></select></div>
          <div className="w-32"><label className={lab}>Duración</label><select value={f.durationHours} onChange={e => setF({ ...f, durationHours: Number(e.target.value) })} className={inp}>{[[24, '24 horas'], [48, '48 horas'], [72, '72 horas'], [168, '7 días']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
          <button type="button" onClick={programar} className="ml-auto px-4 h-9 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5" /> Programar</button>
        </div>
      </div>

      {pendientes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Por salir ({pendientes.length})</p>
          {pendientes.map(p => (
            <div key={p.id} className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/50 p-2.5">
              <span className="min-w-0 flex-1">
                <span className="inline-block text-[10px] font-black text-violet-700 bg-white border border-violet-200 rounded-lg px-2 py-0.5 mb-1 whitespace-nowrap">🕘 {verLima(p.publicarEn)}</span>
                <b className="block text-xs text-slate-800">{p.title}</b><span className="block text-[11px] text-slate-500 line-clamp-2">{p.message}</span>
              </span>
              <button type="button" onClick={() => quitar(p)} title="Cancelar" className="w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {publicados.length > 0 && <p className="text-[11px] text-slate-400">Últimos publicados: {publicados.map(p => `«${p.title}»`).join(' · ')}</p>}

      {/* Automáticos */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Repeat className="w-4 h-4 text-emerald-600 shrink-0" />
          <b className="text-xs font-bold uppercase tracking-wider text-slate-700 flex-1 min-w-[160px]">Mensajes automáticos</b>
          <button type="button" role="switch" aria-checked={c.activo} onClick={() => guardarAuto({ activo: !c.activo })}
            className={`shrink-0 min-h-[32px] px-3 rounded-full text-[11px] font-black cursor-pointer ${c.activo ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{c.activo ? 'Encendido' : 'Apagado'}</button>
        </div>
        <p className="text-[11px] text-slate-500">El sistema publica uno de estos mensajes, en orden, sin que tengas que entrar. Como máximo uno por día: si ese día ya salió un programado, el automático pasa al día siguiente.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="col-span-2 sm:col-span-1"><label className={lab}>Frecuencia</label><select value={c.frecuencia} onChange={e => cambiar({ frecuencia: e.target.value as ConfigAuto['frecuencia'] })} className={inp}><option value="semanal">Cada semana</option><option value="quincenal">Cada 15 días</option><option value="mensual">Cada mes</option></select></div>
          <div><label className={lab}>Día</label><select value={c.dia} onChange={e => cambiar({ dia: Number(e.target.value) })} className={inp}>{DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
          <div><label className={lab}>Hora</label><select value={c.hora} onChange={e => cambiar({ hora: Number(e.target.value) })} className={inp}>{Array.from({ length: 15 }, (_, i) => i + 7).map(h => <option key={h} value={h}>{hhmm(h)}</option>)}</select></div>
        </div>
        {c.activo && siguiente && prox > 0 && (
          <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">Próximo envío: {verLima(prox)} · «{siguiente.title}»</p>
        )}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Biblioteca ({c.mensajes.length} mensajes)</p>
            {MENSAJES_VENTAS.some(m => !c.mensajes.some(x => x.id === m.id)) && (
              <button type="button" onClick={() => cambiar({ mensajes: [...c.mensajes, ...MENSAJES_VENTAS.filter(m => !c.mensajes.some(x => x.id === m.id))] })}
                className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-black cursor-pointer hover:bg-amber-100">+ Mensajes para vender créditos ({MENSAJES_VENTAS.filter(m => !c.mensajes.some(x => x.id === m.id)).length})</button>
            )}
          </div>
          {c.mensajes.map((m, i) => (
            <div key={m.id} className={`rounded-xl border p-2.5 ${siguiente?.id === m.id && c.activo ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/60'}`}>
              {editando === m.id ? (
                <div className="grid gap-1.5">
                  <input value={m.title} maxLength={80} onChange={e => cambiar({ mensajes: c.mensajes.map(x => x.id === m.id ? { ...x, title: e.target.value } : x) })} className={inp} />
                  <textarea rows={2} value={m.message} maxLength={300} onChange={e => cambiar({ mensajes: c.mensajes.map(x => x.id === m.id ? { ...x, message: e.target.value } : x) })} className={inp + ' resize-none font-medium'} />
                  <button type="button" onClick={() => setEditando(null)} className="justify-self-end h-8 px-3 rounded-lg bg-slate-800 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Listo</button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="shrink-0 w-5 text-[10px] font-black text-slate-400 pt-0.5">{i + 1}.</span>
                  <span className="min-w-0 flex-1"><b className="block text-xs text-slate-800">{m.title}</b><span className="block text-[11px] text-slate-500">{m.message}</span></span>
                  <button type="button" onClick={() => setEditando(m.id)} title="Editar" className="w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer shrink-0"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => cambiar({ mensajes: c.mensajes.filter(x => x.id !== m.id) })} title="Quitar" className="w-8 h-8 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={() => { const id = 'm_' + Date.now(); cambiar({ mensajes: [...c.mensajes, { id, title: '✨ Nuevo mensaje', message: 'Escribe aquí el mensaje.' }] }); setEditando(id); }}
            className="w-full h-9 rounded-xl border border-dashed border-slate-300 text-slate-600 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-slate-50"><Plus className="w-3.5 h-3.5" /> Agregar mensaje</button>
        </div>
        <button type="button" onClick={() => guardarAuto()} disabled={!borrador} className="w-full min-h-[40px] rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer disabled:opacity-40">Guardar cambios de los automáticos</button>
      </div>
      {msg && <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1"><Check className="w-4 h-4" /> {msg}</p>}
    </div>
  );
}
