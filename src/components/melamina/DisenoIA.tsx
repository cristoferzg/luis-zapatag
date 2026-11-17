// "Diseñar con IA" en Melamina: el usuario escribe lo que pidió el cliente (y puede
// adjuntar una foto del ambiente o un croquis); la IA propone los muebles con sus
// medidas, partes y ubicación en las paredes. Cuesta créditos (COSTO_CREDITOS.melamina).
import { useRef, useState } from 'react';
import { Sparkles, ImagePlus, X, Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase';
import { COSTO_CREDITOS, checkAIAccess, iaVisibleParaUI, motivoErrorIA, pedirPinSiLimitada, AVISO_CONFIRMA_PIN, getAICtx } from '../../lib/aiAccess';
import { fileToBase64 } from '../../lib/roofPlanScan';
import PlanesIAModal from '../PlanesIAModal';
import { Mueble, uid } from './calculoMelamina';
import type { ParedMelamina } from './cotizacionMelamina';

export interface PropuestaIA { muebles: Omit<Mueble, 'id'>[]; paredes: ParedMelamina[]; notas: string }

const EJEMPLOS = [
  'Cocina en L: pared de 3 m y pared de 2 m, con reposteros y alacena, color blanco con frentes roble',
  'Closet de 2.40 m de ancho para dormitorio de pareja, con cajones y espacio para ropa larga',
  'Centro de TV de 1.80 m y un librero al costado, color nogal',
];

export default function DisenoIA({ onAplicar }: { onAplicar: (p: PropuestaIA, reemplazar: boolean) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [planes, setPlanes] = useState<'agotado' | 'sin_plan' | null>(null);
  const [reemplazar, setReemplazar] = useState(false);
  const refFoto = useRef<HTMLInputElement>(null);
  if (!iaVisibleParaUI()) return null;

  const disenar = async () => {
    if (texto.trim().length < 5 && !foto) { setMsg({ ok: false, t: 'Escribe qué mueble necesitas o adjunta una foto.' }); return; }
    if (pedirPinSiLimitada()) { setMsg({ ok: false, t: AVISO_CONFIRMA_PIN }); return; }
    setMsg(null);
    const acceso = await checkAIAccess('melamina');
    if (!acceso.ok) { if (acceso.motivo === 'agotado' || acceso.motivo === 'sin_plan') setPlanes(acceso.motivo); else setMsg({ ok: false, t: 'El diseño con IA no está disponible en este momento.' }); return; }
    setCargando(true);
    try {
      const img = foto ? await fileToBase64(foto) : null;
      const fn = httpsCallable<any, PropuestaIA>(getFunctions(app, 'us-central1'), 'disenarMelamina', { timeout: 180000 });
      const r = (await fn({ texto: texto.trim(), ...(img ? { imageBase64: img.base64, mimeType: img.mimeType } : {}) })).data;
      onAplicar(r, reemplazar);
      setMsg({ ok: true, t: `✓ ${r.muebles.length} mueble${r.muebles.length > 1 ? 's' : ''} agregado${r.muebles.length > 1 ? 's' : ''}. ${r.notas || ''} Revisa las medidas antes de cotizar.` });
      setTexto(''); setFoto(null);
    } catch (err: any) {
      const motivo = motivoErrorIA(err);
      if (pedirPinSiLimitada(err)) setMsg({ ok: false, t: AVISO_CONFIRMA_PIN });
      else if (motivo) setPlanes(motivo);
      else if (String(err?.code || '').includes('failed-precondition')) setMsg({ ok: false, t: getAICtx().isAdmin ? `IA: ${err.message}` : 'El diseño con IA no está disponible en este momento.' });
      else setMsg({ ok: false, t: err?.message && !/internal/i.test(err.message) ? err.message : 'No se pudo diseñar ahora. Inténtalo de nuevo.' });
    } finally { setCargando(false); }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-teal-50 border border-violet-100 p-3 sm:p-4 space-y-2.5">
      <button onClick={() => setAbierto(a => !a)} className="w-full flex flex-nowrap items-center gap-2.5 text-left cursor-pointer">
        <span className="w-9 h-9 rounded-xl bg-violet-600 text-white grid place-items-center shrink-0"><Sparkles className="w-4 h-4" /></span>
        <span className="min-w-0 flex-1"><b className="block text-sm text-slate-900">Diseñar con IA</b><span className="block text-[11px] text-slate-500">Escribe lo que pidió tu cliente (o sube una foto del ambiente) y se arman los muebles · {COSTO_CREDITOS.melamina} créditos</span></span>
        <span className="text-xs font-bold text-violet-700 shrink-0">{abierto ? 'Cerrar' : 'Abrir'}</span>
      </button>
      {abierto && (<>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} maxLength={1500} disabled={cargando}
          placeholder="Ej. Cocina de 3.20 m con reposteros arriba, alacena al costado y cajonera; color blanco con puertas roble"
          className="w-full min-h-[84px] rounded-xl border border-violet-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
        <div className="flex flex-wrap gap-1.5">
          {EJEMPLOS.map(e => <button key={e} onClick={() => setTexto(e)} className="text-[11px] font-bold text-violet-700 bg-white border border-violet-100 rounded-full px-2.5 py-1 cursor-pointer hover:bg-violet-50 text-left">{e.length > 48 ? `${e.slice(0, 46)}…` : e}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={refFoto} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => { setFoto(e.target.files?.[0] || null); e.target.value = ''; }} />
          {foto ? (
            <span className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 max-w-full"><ImagePlus className="w-4 h-4 shrink-0" /><span className="truncate">{foto.name}</span><button onClick={() => setFoto(null)} aria-label="Quitar foto" className="cursor-pointer"><X className="w-4 h-4" /></button></span>
          ) : (
            <button onClick={() => refFoto.current?.click()} disabled={cargando} className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"><ImagePlus className="w-4 h-4" /> Foto o croquis (opcional)</button>
          )}
          <label className="inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-violet-600" checked={reemplazar} onChange={e => setReemplazar(e.target.checked)} /> Reemplazar lo que hay</label>
          <div className="flex-1" />
          <button onClick={disenar} disabled={cargando} className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black cursor-pointer disabled:opacity-60">
            {cargando ? <><Loader2 className="w-4 h-4 animate-spin" /> Diseñando…</> : <><Sparkles className="w-4 h-4" /> Diseñar</>}
          </button>
        </div>
      </>)}
      {msg && <p className={`text-xs font-bold rounded-xl px-3 py-2 ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{msg.t}</p>}
      {planes && <PlanesIAModal motivo={planes} onClose={() => setPlanes(null)} />}
    </div>
  );
}

/** Convierte la propuesta de la IA en muebles con id (y paredes, si vienen). */
export const mueblesDePropuesta = (p: PropuestaIA): Mueble[] => p.muebles.map(m => ({ ...m, id: uid() } as Mueble));
