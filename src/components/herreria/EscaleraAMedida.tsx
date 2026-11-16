// «Escalera a medida» de Carpintería Metálica: el usuario escribe las medidas reales (o la IA las
// lee de un plano, foto o texto con «Leer con IA») y se arman todas las piezas: zancos, peldaños,
// descanso con columnas, llegada y baranda. Antes de armar se ve un resumen con la contrahuella,
// el paso y avisos de comodidad (RNE A.010). La IA solo llena el formulario; el usuario revisa y arma.
import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, ImagePlus, Loader2, Footprints, Check, AlertTriangle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase';
import { COSTO_CREDITOS, checkAIAccess, iaVisibleParaUI, motivoErrorIA, pedirPinSiLimitada, AVISO_CONFIRMA_PIN, getAICtx } from '../../lib/aiAccess';
import { fileToBase64 } from '../../lib/roofPlanScan';
import PlanesIAModal from '../PlanesIAModal';
import type { HerreriaDesign } from './herreriaTypes';
import { EscaleraParams, FormaEscalera, generarEscalera, normalizarEscalera, PERFILES_COLUMNA, PERFILES_SOPORTE, PERFILES_ZANCO } from './escaleraAMedida';

const NOMBRE_PERFIL: Record<string, string> = {
  'rect-4x2-2.0': 'Tubo 4"×2"×2 mm', 'rect-3x1.5-2.0': 'Tubo 3"×1½"×2 mm', 'cuad-3x3-2.0': 'Tubo 3"×3"×2 mm', 'rect-2x1-2.0': 'Tubo 2"×1"×2 mm',
  'cuad-2x2-2.0': 'Tubo 2"×2"×2 mm', 'rect-2x1-1.5': 'Tubo 2"×1"×1.5 mm',
};
const EJEMPLOS = [
  'Escalera en U con descanso a 1.47 m, altura total 2.79 m, ancho 1.00 m, 7 peldaños de madera por tramo y llegada de 44 cm',
  'Escalera recta de 2.60 m de alto y 0.90 m de ancho con peldaños de plancha estriada y baranda',
  'Escalera en L que voltea a la derecha, sube 3.00 m, descanso a 1.50 m, ancho 1.00 m',
];

export default function EscaleraAMedida({ onAplicar, onCerrar }: { onAplicar: (d: HerreriaDesign) => void; onCerrar: () => void }) {
  const [p, setP] = useState<EscaleraParams>(() => normalizarEscalera({ forma: 'U', alturaTotal: 2.8, ancho: 1.0, alturaDescanso: 1.4, llegada: 0 }));
  const n = useMemo(() => normalizarEscalera(p), [p]);
  const cambiar = (k: keyof EscaleraParams, v: any) => setP(x => ({ ...x, [k]: v }));
  const num = (k: keyof EscaleraParams) => (e: React.ChangeEvent<HTMLInputElement>) => cambiar(k, e.target.value === '' ? undefined : Number(e.target.value));
  // IA
  const [texto, setTexto] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [planes, setPlanes] = useState<'agotado' | 'sin_plan' | null>(null);
  const refArchivo = useRef<HTMLInputElement>(null);
  const conIA = iaVisibleParaUI();

  const leerConIA = async () => {
    if (texto.trim().length < 5 && !archivo) { setMsg({ ok: false, t: 'Describe la escalera o adjunta el plano (PDF o foto).' }); return; }
    // Solo en el servidor local de pruebas: window.__iaSimulada = { disenarCarpimetal: { escalera, notas } }.
    const sim = import.meta.env.DEV ? (window as any).__iaSimulada?.disenarCarpimetal : undefined;
    if (sim) { setP(normalizarEscalera(sim.escalera)); setMsg({ ok: true, t: `✓ Medidas leídas. ${sim.notas || ''} Revísalas abajo y toca «Armar escalera».` }); return; }
    if (pedirPinSiLimitada()) { setMsg({ ok: false, t: AVISO_CONFIRMA_PIN }); return; }
    setMsg(null);
    const acceso = await checkAIAccess('carpimetal');
    if (!acceso.ok) { if (acceso.motivo === 'agotado' || acceso.motivo === 'sin_plan') setPlanes(acceso.motivo); else setMsg({ ok: false, t: 'El diseño con IA no está disponible en este momento.' }); return; }
    setLeyendo(true);
    try {
      const img = archivo ? await fileToBase64(archivo) : null;
      const fn = httpsCallable<any, { escalera: Partial<EscaleraParams>; notas: string }>(getFunctions(app, 'us-central1'), 'disenarCarpimetal', { timeout: 180000 });
      const r = (await fn({ texto: texto.trim(), ...(img ? { imageBase64: img.base64, mimeType: img.mimeType } : {}) })).data;
      setP(normalizarEscalera(r.escalera));
      setMsg({ ok: true, t: `✓ Medidas leídas. ${r.notas || ''} Revísalas abajo y toca «Armar escalera».` });
    } catch (err: any) {
      const motivo = motivoErrorIA(err);
      if (pedirPinSiLimitada(err)) setMsg({ ok: false, t: AVISO_CONFIRMA_PIN });
      else if (motivo) setPlanes(motivo);
      else if (String(err?.code || '').includes('failed-precondition')) setMsg({ ok: false, t: getAICtx().isAdmin ? `IA: ${err.message}` : 'El diseño con IA no está disponible en este momento.' });
      else setMsg({ ok: false, t: err?.message && !/internal/i.test(err.message) ? err.message : 'No se pudo leer ahora. Inténtalo de nuevo.' });
    } finally { setLeyendo(false); }
  };

  // Resumen y avisos de comodidad por tramo.
  const tramos = n.forma === 'recta'
    ? [{ t: 'Tramo', h: n.alturaTotal, peld: n.peldanos1!, largo: n.largo1! }]
    : [{ t: 'Tramo 1', h: n.alturaDescanso!, peld: n.peldanos1!, largo: n.largo1! }, { t: 'Tramo 2', h: n.alturaTotal - n.alturaDescanso!, peld: n.peldanos2!, largo: n.largo2! }];
  const filas = tramos.map(x => { const c = x.h / (x.peld + 1), paso = x.largo / (x.peld + 1); return { ...x, c, paso, regla: 2 * c + paso }; });
  const avisos: string[] = [];
  filas.forEach(f => {
    if (f.c > 0.185) avisos.push(`${f.t}: cada escalón sube ${Math.round(f.c * 100)} cm (cómodo: 15 a 18 cm). Agrega peldaños.`);
    if (f.c < 0.14) avisos.push(`${f.t}: cada escalón sube solo ${Math.round(f.c * 100)} cm. Quita peldaños.`);
    if (f.paso < 0.22) avisos.push(`${f.t}: el paso es de ${Math.round(f.paso * 100)} cm (mínimo 25 cm). Alarga el tramo.`);
    if (f.regla < 0.58 || f.regla > 0.66) avisos.push(`${f.t}: 2 contrahuellas + paso = ${Math.round(f.regla * 100)} cm (cómodo: 60 a 64 cm).`);
  });

  const campo = (k: keyof EscaleraParams, t: string, paso = 0.01, ayuda?: string) => (
    <label className="block text-[10px] font-bold text-slate-500 uppercase min-w-0">{t}
      <div className="mt-0.5 flex items-center min-h-[40px] rounded-lg bg-slate-100">
        <input type="number" inputMode="decimal" step={paso} value={(p as any)[k] ?? ''} onChange={num(k)} className="w-full min-w-0 bg-transparent px-2 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none" />
        {ayuda && <span className="pr-2 text-[11px] font-bold text-slate-400">{ayuda}</span>}
      </div>
    </label>
  );
  const selector = (k: keyof EscaleraParams, t: string, lista: string[]) => (
    <label className="block text-[10px] font-bold text-slate-500 uppercase min-w-0">{t}
      <select value={(n as any)[k]} onChange={e => cambiar(k, e.target.value)} className="mt-0.5 w-full min-h-[40px] px-2 rounded-lg bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer">
        {lista.map(id => <option key={id} value={id}>{NOMBRE_PERFIL[id] || id}</option>)}
      </select>
    </label>
  );

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-slate-900/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onCerrar}>
      <div className="bg-white w-full sm:max-w-3xl max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2"><Footprints className="w-5 h-5 text-blue-600" /> Escalera a medida</h3>
            <p className="text-xs text-slate-500">Recta, en L o en U con descanso. Escribe las medidas reales{conIA ? ' o deja que la IA las lea de tu plano' : ''} y se arman todas las piezas.</p>
          </div>
          <button onClick={onCerrar} className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {conIA && (
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-sky-50 border border-violet-100 p-3 space-y-2">
              <p className="text-sm font-black text-slate-900 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-violet-600" /> Leer con IA <span className="text-[11px] font-bold text-violet-700">· {COSTO_CREDITOS.carpimetal} créditos</span></p>
              <textarea value={texto} onChange={e => setTexto(e.target.value)} maxLength={1500} disabled={leyendo}
                placeholder="Ej. Escalera en U, altura 2.80 m, descanso a 1.40 m, ancho 1 m, peldaños de madera" className="w-full min-h-[64px] rounded-xl border border-violet-200 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <div className="flex flex-wrap gap-1.5">{EJEMPLOS.map(e => <button key={e} onClick={() => setTexto(e)} className="text-[11px] font-bold text-violet-700 bg-white border border-violet-100 rounded-full px-2.5 py-1 cursor-pointer text-left">{e.length > 46 ? `${e.slice(0, 44)}…` : e}</button>)}</div>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={refArchivo} type="file" accept="image/*,application/pdf" className="hidden" onChange={e => { setArchivo(e.target.files?.[0] || null); e.target.value = ''; }} />
                {archivo ? <span className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 max-w-full"><ImagePlus className="w-4 h-4 shrink-0" /><span className="truncate">{archivo.name}</span><button onClick={() => setArchivo(null)} aria-label="Quitar" className="cursor-pointer"><X className="w-4 h-4" /></button></span>
                  : <button onClick={() => refArchivo.current?.click()} disabled={leyendo} className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"><ImagePlus className="w-4 h-4" /> Plano en PDF, foto o croquis</button>}
                <div className="flex-1" />
                <button onClick={leerConIA} disabled={leyendo} className="inline-flex items-center gap-1.5 min-h-[42px] px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black cursor-pointer disabled:opacity-60">
                  {leyendo ? <><Loader2 className="w-4 h-4 animate-spin" /> Leyendo…</> : <><Sparkles className="w-4 h-4" /> Leer medidas</>}
                </button>
              </div>
              {msg && <p className={`text-xs font-bold rounded-xl px-3 py-2 ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{msg.t}</p>}
            </div>
          )}

          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
            {([['recta', 'Recta'], ['L', 'En L'], ['U', 'En U']] as [FormaEscalera, string][]).map(([f, t]) => (
              <button key={f} onClick={() => cambiar('forma', f)} className={`min-h-[40px] rounded-lg text-sm font-black cursor-pointer ${n.forma === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{t}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {campo('alturaTotal', 'Altura total', 0.01, 'm')}
            {campo('ancho', 'Ancho del tramo', 0.01, 'm')}
            {n.forma !== 'recta' && campo('alturaDescanso', 'Altura del descanso', 0.01, 'm')}
            {n.forma === 'U' && campo('largoDescanso', 'Largo del descanso', 0.01, 'm')}
            {n.forma === 'U' && campo('separacion', 'Separación entre tramos', 0.01, 'm')}
            {campo('peldanos1', n.forma === 'recta' ? 'Peldaños' : 'Peldaños tramo 1', 1)}
            {campo('largo1', n.forma === 'recta' ? 'Largo en planta' : 'Largo tramo 1', 0.01, 'm')}
            {n.forma !== 'recta' && campo('peldanos2', 'Peldaños tramo 2', 1)}
            {n.forma !== 'recta' && campo('largo2', 'Largo tramo 2', 0.01, 'm')}
            {campo('huella', 'Fondo del peldaño', 0.01, 'm')}
            {campo('llegada', 'Llegada arriba (0 = losa)', 0.01, 'm')}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Peldaños de
              <select value={n.peldano} onChange={e => cambiar('peldano', e.target.value)} className="mt-0.5 w-full min-h-[40px] px-2 rounded-lg bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer">
                <option value="madera">Madera</option><option value="estriada">Plancha estriada</option>
              </select>
            </label>
            {selector('perfilZanco', 'Zancos y vigas', PERFILES_ZANCO)}
            {selector('perfilColumna', 'Columnas', PERFILES_COLUMNA)}
            {selector('perfilSoporte', 'Soporte de peldaño', PERFILES_SOPORTE)}
          </div>
          <div className="flex flex-wrap gap-4">
            {n.forma === 'L' && (
              <div className="inline-flex p-0.5 bg-slate-100 rounded-lg">{(['izquierda', 'derecha'] as const).map(g => <button key={g} onClick={() => cambiar('giro', g)} className={`min-h-[34px] px-3 rounded-md text-xs font-bold cursor-pointer ${n.giro === g ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}>Voltea a la {g}</button>)}</div>
            )}
            <label className="inline-flex items-center gap-2 min-h-[34px] text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={!!n.baranda} onChange={e => cambiar('baranda', e.target.checked)} /> Con baranda (0.90 m)</label>
            {n.forma !== 'recta' && <label className="inline-flex items-center gap-2 min-h-[34px] text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-blue-600" checked={n.columnas !== false} onChange={e => cambiar('columnas', e.target.checked)} /> Columnas bajo el descanso</label>}
          </div>

          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
            {filas.map(f => (
              <div key={f.t} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
                <b className="text-slate-800 w-16">{f.t}</b>
                <span className="text-slate-600">{f.peld} peldaños</span>
                <span className="text-slate-600">sube <b>{Math.round(f.c * 1000) / 10} cm</b> por escalón</span>
                <span className="text-slate-600">paso <b>{Math.round(f.paso * 1000) / 10} cm</b></span>
              </div>
            ))}
          </div>
          {avisos.length ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1">{avisos.map(a => <p key={a} className="text-xs font-bold text-amber-800 flex gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" />{a}</p>)}</div>
          ) : <p className="text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 flex items-center gap-1.5"><Check className="w-4 h-4" /> Escalones cómodos (RNE A.010).</p>}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
          <button onClick={onCerrar} className="min-h-[42px] px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold cursor-pointer">Cancelar</button>
          <button onClick={() => onAplicar(generarEscalera(n))} className="min-h-[42px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black cursor-pointer inline-flex items-center gap-1.5"><Footprints className="w-4 h-4" /> Armar escalera</button>
        </div>
      </div>
      {planes && <PlanesIAModal motivo={planes} onClose={() => setPlanes(null)} />}
    </div>,
    document.body,
  );
}
