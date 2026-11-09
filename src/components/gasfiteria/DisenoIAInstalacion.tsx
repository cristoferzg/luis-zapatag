// "Diseñar con IA" de Gasfitería y Electricidad (mismo modal para los dos apartados).
// El usuario describe lo que pidió el cliente (y puede adjuntar un croquis, foto o PDF);
// el servidor devuelve la distribución (ambientes → muros) y los aparatos o puntos ya
// revisados. Luego el apartado corre su trazado automático (tuberías o circuitos).
// Con "Usar el plano actual" se manda un resumen del fondo para ubicar todo dentro de él.
// Cuesta COSTO_CREDITOS[accion]. Se puede deshacer como cualquier cambio del plano.
//
// Solo en el servidor local de pruebas: window.__iaSimulada = { disenarGasfiteria: datos | (pedido) => datos, … }
// devuelve una respuesta fija sin llamar al servidor (capturas del manual).
import { useRef, useState } from 'react';
import { Sparkles, ImagePlus, X, Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase';
import { COSTO_CREDITOS, checkAIAccess, iaVisibleParaUI, motivoErrorIA, pedirPinSiLimitada, AVISO_CONFIRMA_PIN, getAICtx } from '../../lib/aiAccess';
import CostoIA from '../common/CostoIA';
import { fileToBase64 } from '../../lib/roofPlanScan';
import PlanesIAModal from '../PlanesIAModal';
import type { MuroRef, AmbientePlano } from './modeloGasfiteria';

/** Ambiente rectangular devuelto por el servidor (m; y hacia abajo). */
export type AmbienteIA = AmbientePlano;
export interface PlantaIABase { usaFondo: boolean; ancho: number; largo: number; ambientes: AmbienteIA[]; muros: MuroRef[]; notas: string }
export interface OpcionesIA { reemplazar: boolean; usarFondo: boolean }

interface Props<T extends PlantaIABase> {
  accion: 'gasfiteria' | 'electricidad';
  funcion: 'disenarGasfiteria' | 'disenarElectricidad';
  titulo: string;
  subtitulo: string;
  placeholder: string;
  ejemplos: string[];
  /** Plano actual que se puede usar de fondo (null = no hay). */
  fondo: { etiqueta: string; porDefecto: boolean; datos: () => unknown } | null;
  /** Clases del botón que abre el modal. */
  claseBoton?: string;
  /** Aplica la propuesta (y avisa en el plano). Al terminar se cierra el modal. */
  onAplicar: (r: T, o: OpcionesIA) => void;
}

export default function DisenoIAInstalacion<T extends PlantaIABase>({ accion, funcion, titulo, subtitulo, placeholder, ejemplos, fondo, claseBoton, onAplicar }: Props<T>) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [planes, setPlanes] = useState<'agotado' | 'sin_plan' | null>(null);
  const [reemplazar, setReemplazar] = useState(true);
  const [usarFondo, setUsarFondo] = useState<boolean | null>(null);
  const refFoto = useRef<HTMLInputElement>(null);
  if (!iaVisibleParaUI()) return null;
  const conFondo = !!fondo && (usarFondo ?? fondo.porDefecto);

  const disenar = async () => {
    if (texto.trim().length < 5 && !foto) { setMsg({ ok: false, t: 'Describe la instalación o adjunta un croquis o plano.' }); return; }
    if (pedirPinSiLimitada()) { setMsg({ ok: false, t: AVISO_CONFIRMA_PIN }); return; }
    setMsg(null);
    const acceso = await checkAIAccess(accion);
    if (!acceso.ok) { if (acceso.motivo === 'agotado' || acceso.motivo === 'sin_plan') setPlanes(acceso.motivo); else setMsg({ ok: false, t: 'El diseño con IA no está disponible en este momento.' }); return; }
    setCargando(true);
    try {
      const img = foto ? await fileToBase64(foto) : null;
      const pedido = { texto: texto.trim(), ...(img ? { imageBase64: img.base64, mimeType: img.mimeType } : {}), ...(conFondo && fondo ? { usarFondo: true, fondo: fondo.datos() } : {}) };
      const sim = import.meta.env.DEV ? (window as any).__iaSimulada?.[funcion] : undefined;
      let r: T;
      if (sim) { await new Promise(ok => setTimeout(ok, 600)); r = (typeof sim === 'function' ? await sim(pedido) : sim) as T; }
      else {
        const fn = httpsCallable<any, T>(getFunctions(app, 'us-central1'), funcion, { timeout: 180000 });
        r = (await fn(pedido)).data;
      }
      onAplicar(r, { reemplazar, usarFondo: conFondo });
      setTexto(''); setFoto(null); setAbierto(false);
    } catch (err: any) {
      const motivo = motivoErrorIA(err);
      if (pedirPinSiLimitada(err)) setMsg({ ok: false, t: AVISO_CONFIRMA_PIN });
      else if (motivo) setPlanes(motivo);
      else if (String(err?.code || '').includes('failed-precondition')) setMsg({ ok: false, t: getAICtx().isAdmin ? `IA: ${err.message}` : 'El diseño con IA no está disponible en este momento.' });
      else setMsg({ ok: false, t: err?.message && !/internal/i.test(err.message) ? err.message : 'No se pudo diseñar ahora. Inténtalo de nuevo.' });
    } finally { setCargando(false); }
  };

  return (<>
    <button type="button" onClick={() => { setAbierto(true); setMsg(null); }} title="Arma el plano desde una descripción, un croquis o un plano"
      className={claseBoton || 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2.5 sm:px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black cursor-pointer'}>
      <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Diseñar con IA</span><span className="sm:hidden">IA</span> <CostoIA accion={accion} />
    </button>
    {abierto && (
      <div className="fixed inset-0 z-[85] bg-slate-950/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !cargando && setAbierto(false)}>
        <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 space-y-3 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-start gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-violet-600 text-white grid place-items-center shrink-0"><Sparkles className="w-4 h-4" /></span>
            <div className="min-w-0 flex-1"><b className="block text-sm text-slate-900">{titulo}</b><span className="block text-[11px] text-slate-500">{subtitulo} · {COSTO_CREDITOS[accion]} créditos</span></div>
            <button onClick={() => setAbierto(false)} disabled={cargando} aria-label="Cerrar" className="w-9 h-9 grid place-items-center rounded-lg text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} maxLength={1500} disabled={cargando} placeholder={placeholder}
            className="w-full min-h-[96px] rounded-xl border border-violet-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
          <div className="flex flex-wrap gap-1.5">
            {ejemplos.map(e => <button key={e} onClick={() => setTexto(e)} className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1 cursor-pointer text-left">{e}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <input ref={refFoto} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => { setFoto(e.target.files?.[0] || null); e.target.value = ''; }} />
            {foto ? (
              <span className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 max-w-full"><ImagePlus className="w-4 h-4 shrink-0" /><span className="truncate">{foto.name}</span><button onClick={() => setFoto(null)} aria-label="Quitar" className="cursor-pointer"><X className="w-4 h-4" /></button></span>
            ) : (
              <button onClick={() => refFoto.current?.click()} disabled={cargando} className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"><ImagePlus className="w-4 h-4" /> Croquis, foto o plano (opcional)</button>
            )}
            {fondo && <label className="inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-violet-600" checked={conFondo} onChange={e => setUsarFondo(e.target.checked)} /> {fondo.etiqueta}</label>}
            <label className="inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-violet-600" checked={reemplazar} onChange={e => setReemplazar(e.target.checked)} /> Reemplazar lo que hay</label>
          </div>
          <p className="text-[11px] text-slate-500">{conFondo ? 'Se ubica todo dentro del plano actual.' : 'Se arma una distribución nueva con sus ambientes, puertas y ventanas.'} {accion === 'gasfiteria' ? 'Luego se trazan solas las tuberías.' : 'Luego se arman solos los circuitos y las tuberías.'}</p>
          {msg && <p className={`text-xs font-bold rounded-xl px-3 py-2 ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{msg.t}</p>}
          <button onClick={disenar} disabled={cargando} className="w-full inline-flex items-center justify-center gap-1.5 min-h-[46px] rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black cursor-pointer disabled:opacity-60">
            {cargando ? <><Loader2 className="w-4 h-4 animate-spin" /> Diseñando…</> : <><Sparkles className="w-4 h-4" /> Diseñar</>}
          </button>
        </div>
      </div>
    )}
    {planes && <PlanesIAModal motivo={planes} onClose={() => setPlanes(null)} />}
  </>);
}

/** Etiquetas de los ambientes en el plano (al centro, un poco abajo para no tapar la luz de techo). */
export function EtiquetasAmbientes({ ambientes, fs }: { ambientes?: AmbienteIA[]; fs: number }) {
  if (!ambientes?.length) return null;
  return <g pointerEvents="none" fill="#94a3b8" fontSize={fs * 1.05} fontWeight={800} textAnchor="middle" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
    {ambientes.map((a, i) => <text key={i} x={a.x + a.ancho / 2} y={a.y + a.largo / 2 + Math.min(0.45, a.largo / 4)}>{a.nombre}</text>)}
  </g>;
}
