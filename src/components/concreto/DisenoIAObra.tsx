// Obra Civil → "Diseñar con IA": desde lo que pide el cliente (o un plano a mano / PDF)
// se arma la planta del piso activo: muros con puertas y ventanas, y columnas.
// Cuesta créditos (COSTO_CREDITOS.obra). Se puede deshacer como cualquier cambio.
import { useRef, useState } from 'react';
import { Sparkles, ImagePlus, X, Loader2 } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase';
import { COSTO_CREDITOS, checkAIAccess, iaVisibleParaUI, motivoErrorIA, pedirPinSiLimitada, AVISO_CONFIRMA_PIN, getAICtx } from '../../lib/aiAccess';
import { fileToBase64 } from '../../lib/roofPlanScan';
import PlanesIAModal from '../PlanesIAModal';
import type { TipoAbertura } from './geometriaObra';

export interface PlantaIA {
  muros: { x1: number; y1: number; x2: number; y2: number; espesor: number; alto: number; aberturas: { tipo: TipoAbertura; t: number; w: number; h: number; sill: number }[] }[];
  columnas: { x: number; y: number; a: number; b: number }[];
  notas: string;
}

const EJEMPLOS = [
  'Casa de 8 × 15 m: sala-comedor, cocina, 3 dormitorios y 2 baños',
  'Local comercial de 5 × 10 m con baño al fondo y portón a la calle',
  'Departamento de 2 dormitorios, 1 baño, cocina y sala en 7 × 9 m',
];

export default function DisenoIAObra({ piso, onAplicar }: { piso: string; onAplicar: (p: PlantaIA, reemplazar: boolean) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [planes, setPlanes] = useState<'agotado' | 'sin_plan' | null>(null);
  const [reemplazar, setReemplazar] = useState(true);
  const refFoto = useRef<HTMLInputElement>(null);
  if (!iaVisibleParaUI()) return null;

  const disenar = async () => {
    if (texto.trim().length < 5 && !foto) { setMsg({ ok: false, t: 'Describe la obra o adjunta un plano.' }); return; }
    if (pedirPinSiLimitada()) { setMsg({ ok: false, t: AVISO_CONFIRMA_PIN }); return; }
    setMsg(null);
    const acceso = await checkAIAccess('obra');
    if (!acceso.ok) { if (acceso.motivo === 'agotado' || acceso.motivo === 'sin_plan') setPlanes(acceso.motivo); else setMsg({ ok: false, t: 'El diseño con IA no está disponible en este momento.' }); return; }
    setCargando(true);
    try {
      const img = foto ? await fileToBase64(foto) : null;
      const fn = httpsCallable<any, PlantaIA>(getFunctions(app, 'us-central1'), 'disenarObra', { timeout: 240000 });
      const r = (await fn({ texto: texto.trim(), ...(img ? { imageBase64: img.base64, mimeType: img.mimeType } : {}) })).data;
      onAplicar(r, reemplazar);
      setMsg({ ok: true, t: `✓ ${r.muros.length} muros y ${r.columnas.length} columnas en ${piso}. ${r.notas || ''} Revisa las medidas (puedes deshacer).` });
      setTexto(''); setFoto(null);
    } catch (err: any) {
      const motivo = motivoErrorIA(err);
      if (pedirPinSiLimitada(err)) setMsg({ ok: false, t: AVISO_CONFIRMA_PIN });
      else if (motivo) setPlanes(motivo);
      else if (String(err?.code || '').includes('failed-precondition')) setMsg({ ok: false, t: getAICtx().isAdmin ? `IA: ${err.message}` : 'El diseño con IA no está disponible en este momento.' });
      else setMsg({ ok: false, t: err?.message && !/internal/i.test(err.message) ? err.message : 'No se pudo diseñar ahora. Inténtalo de nuevo.' });
    } finally { setCargando(false); }
  };

  return (<>
    <button type="button" onClick={() => setAbierto(true)} title="Arma la planta desde una descripción o un plano a mano"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black cursor-pointer">
      <Sparkles className="w-3.5 h-3.5" /> Diseñar con IA
    </button>
    {abierto && (
      <div className="fixed inset-0 z-[85] bg-slate-950/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !cargando && setAbierto(false)}>
        <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-4 space-y-3 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-start gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-violet-600 text-white grid place-items-center shrink-0"><Sparkles className="w-4 h-4" /></span>
            <div className="min-w-0 flex-1"><b className="block text-sm text-slate-900">Diseñar la planta con IA · {piso}</b><span className="block text-[11px] text-slate-500">Muros, puertas, ventanas y columnas desde tu descripción o un plano a mano · {COSTO_CREDITOS.obra} créditos</span></div>
            <button onClick={() => setAbierto(false)} disabled={cargando} aria-label="Cerrar" className="w-9 h-9 grid place-items-center rounded-lg text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} maxLength={1500} disabled={cargando}
            placeholder="Ej. Casa de 8 × 15 m con sala-comedor adelante, cocina, 3 dormitorios y 2 baños; cochera a la calle"
            className="w-full min-h-[96px] rounded-xl border border-violet-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
          <div className="flex flex-wrap gap-1.5">
            {EJEMPLOS.map(e => <button key={e} onClick={() => setTexto(e)} className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1 cursor-pointer text-left">{e}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={refFoto} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => { setFoto(e.target.files?.[0] || null); e.target.value = ''; }} />
            {foto ? (
              <span className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 max-w-full"><ImagePlus className="w-4 h-4 shrink-0" /><span className="truncate">{foto.name}</span><button onClick={() => setFoto(null)} aria-label="Quitar" className="cursor-pointer"><X className="w-4 h-4" /></button></span>
            ) : (
              <button onClick={() => refFoto.current?.click()} disabled={cargando} className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"><ImagePlus className="w-4 h-4" /> Plano o foto (opcional)</button>
            )}
            <label className="inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-violet-600" checked={reemplazar} onChange={e => setReemplazar(e.target.checked)} /> Reemplazar muros de {piso}</label>
          </div>
          {msg && <p className={`text-xs font-bold rounded-xl px-3 py-2 ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{msg.t}</p>}
          <button onClick={disenar} disabled={cargando} className="w-full inline-flex items-center justify-center gap-1.5 min-h-[46px] rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black cursor-pointer disabled:opacity-60">
            {cargando ? <><Loader2 className="w-4 h-4 animate-spin" /> Diseñando la planta…</> : <><Sparkles className="w-4 h-4" /> Diseñar</>}
          </button>
        </div>
      </div>
    )}
    {planes && <PlanesIAModal motivo={planes} onClose={() => setPlanes(null)} />}
  </>);
}
