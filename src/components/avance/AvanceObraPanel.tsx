// Avance de obra de un proyecto: partidas con %, partes diarios con fotos, línea de tiempo
// e informe para el cliente (imprimir/PDF y WhatsApp). Se guarda en `project.avance`.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Image as ImageIcon, Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight, FileText, ClipboardList, TrendingUp, Copy, Check, CloudOff, Download, Users, CalendarDays, Pencil } from 'lucide-react';
import type { Project, AvanceObra, PartidaAvance, ParteDiario, FotoAvance } from '../../types';
import BotonImprimir from '../common/BotonImprimir';
import { CabeceraEmpresa, BandaMarca, useEmpresa } from '../../lib/empresa';
import { dinero } from '../../lib/currency';
import {
  PARTIDAS_RAPIDAS, CLIMAS, nuevoId, hoyISO, avanceDe, avanceGlobal, tiempoObra, cobroSugerido, totalCobrado,
  partidasDesdeProyecto, fechaLarga, fechaCortaAv, fmtPct, textoWhatsApp, limitarPct,
  useFotosLocales, agregarFotoLocal, reintentarFoto, reintentarPendientes, quitarFotoLocal, asignarParte,
  suscribirFotosLocales, tomarFotosListas, avanceSimuladoDev, FotoLocal,
} from '../../lib/avanceObra';

type SetProjects = React.Dispatch<React.SetStateAction<Project[]>>;
interface FotoVista { src: string; caption?: string }

const card = 'bg-white rounded-2xl border border-slate-200 shadow-sm';
const inp = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500';

export function BarraAvance({ pct, alto = 'h-2', claro = false }: { pct: number; alto?: string; claro?: boolean }) {
  const v = limitarPct(pct);
  return (
    <div className={`w-full ${alto} rounded-full overflow-hidden ${claro ? 'bg-white/25' : 'bg-slate-100'}`}>
      <div className={`h-full rounded-full ${v >= 100 ? 'bg-emerald-600' : 'bg-emerald-500'}`} style={{ width: `${v}%` }} />
    </div>
  );
}

/** Pega a su parte las fotos que terminaron de subir (aunque el panel esté cerrado). */
export function SincronizadorFotosAvance({ setProjects }: { setProjects: SetProjects }) {
  useEffect(() => {
    const revisar = () => {
      const listas = tomarFotosListas();
      if (!listas.length) return;
      setProjects(prev => prev.map(p => {
        const fs = listas.filter(f => f.projectId === p.id);
        if (!fs.length || !p.avance) return p;
        const a = avanceDe(p);
        return { ...p, avance: { ...a, partes: a.partes.map(pt => {
          const add = fs.filter(f => f.parteId === pt.id && !pt.fotos.some(x => x.id === f.id)).map(f => f.foto!);
          return add.length ? { ...pt, fotos: [...pt.fotos, ...add] } : pt;
        }) } };
      }));
    };
    revisar();
    return suscribirFotosLocales(() => setTimeout(revisar, 0));
  }, [setProjects]);
  return null;
}

function Lightbox({ fotos, inicio, onClose }: { fotos: FotoVista[]; inicio: number; onClose: () => void }) {
  const [i, setI] = useState(inicio);
  const toque = useRef<number | null>(null);
  const n = fotos.length;
  const ir = (d: number) => setI(v => (v + d + n) % n);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') ir(1); if (e.key === 'ArrowLeft') ir(-1); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  const f = fotos[i];
  if (!f) return null;
  return (
    <div className="fixed inset-0 z-[140] bg-slate-950 flex flex-col select-none" onClick={e => { e.stopPropagation(); onClose(); }}
      onTouchStart={e => { toque.current = e.touches[0].clientX; }}
      onTouchEnd={e => { const x0 = toque.current; toque.current = null; if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 45) { e.preventDefault(); ir(dx < 0 ? 1 : -1); } }}>
      <div className="flex items-center justify-between px-4 py-3 text-white/90 text-sm font-bold" onClick={e => e.stopPropagation()}>
        <span>{i + 1} / {n}</span>
        <div className="flex items-center gap-1">
          <a href={f.src} target="_blank" rel="noreferrer" download className="p-2 rounded-xl hover:bg-white/10" title="Abrir original"><Download className="w-5 h-5" /></a>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" title="Cerrar"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-2 relative">
        <img src={f.src} alt={f.caption || ''} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        {n > 1 && <>
          <button onClick={e => { e.stopPropagation(); ir(-1); }} className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center cursor-pointer"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={e => { e.stopPropagation(); ir(1); }} className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center cursor-pointer"><ChevronRight className="w-6 h-6" /></button>
        </>}
      </div>
      <p className="px-4 py-3 text-center text-white/80 text-xs font-semibold min-h-[44px]" onClick={e => e.stopPropagation()}>
        {f.caption}{n > 1 && <span className="sm:hidden block text-white/40 font-normal mt-0.5">Desliza para ver más</span>}
      </p>
    </div>
  );
}

function MiniFotoLocal({ f, onVer }: { f: FotoLocal; onVer: () => void }) {
  return (
    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-200">
      <button onClick={onVer} className="absolute inset-0 cursor-pointer"><img src={f.dataUrl} alt="" className="w-full h-full object-cover" /></button>
      {f.estado === 'subiendo' && (
        <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 px-1.5 py-1">
          <div className="h-1 rounded-full bg-white/30 overflow-hidden"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.max(4, f.progreso)}%` }} /></div>
          <p className="text-[9px] font-bold text-white mt-0.5">Subiendo {f.progreso}%</p>
        </div>
      )}
      {f.estado === 'error' && (
        <div className="absolute inset-x-0 bottom-0 bg-amber-500/95 px-1.5 py-1 flex items-center justify-between gap-1">
          <span className="text-[9px] font-black text-slate-950 leading-tight flex items-center gap-0.5 min-w-0"><CloudOff className="w-3 h-3 shrink-0" /><span className="truncate" title="Pendiente de subir">Pendiente</span></span>
          <button onClick={() => reintentarFoto(f.id)} className="p-0.5 rounded bg-white/70 cursor-pointer shrink-0" title="Reintentar"><RefreshCw className="w-3 h-3 text-slate-900" /></button>
        </div>
      )}
      {f.estado === 'lista' && <span className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5"><Check className="w-3 h-3" /></span>}
    </div>
  );
}

interface Props { project: Project; setProjects: SetProjects; onClose: () => void; ws: string; autor?: string; inicial?: 'avance' | 'parte' | 'informe' }

export default function AvanceObraPanel({ project, setProjects, onClose, ws, autor, inicial = 'avance' }: Props) {
  const [tab, setTab] = useState<'avance' | 'parte' | 'informe'>(inicial);
  const [lb, setLb] = useState<{ fotos: FotoVista[]; i: number } | null>(null);
  const a = avanceDe(project);
  const pct = avanceGlobal(a.partidas);
  const t = tiempoObra(project);
  const locales = useFotosLocales(project.id);
  const pendientes = locales.filter(f => f.parteId && f.estado === 'error').length;

  const guardar = (fn: (a: AvanceObra) => AvanceObra) => setProjects(prev => prev.map(x => x.id === project.id
    ? { ...x, avance: { ...fn(avanceDe(x)), actualizado: new Date().toISOString() } } : x));

  // DEV: avance de ejemplo con fotos generadas (window.__avanceSimulado).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const sim = avanceSimuladoDev(project);
    if (sim && !project.avance?.partes?.length) guardar(() => sim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lb) onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [lb, onClose]);

  const tabs = [
    { id: 'avance' as const, label: 'Avance', icon: TrendingUp },
    { id: 'parte' as const, label: 'Parte diario', icon: ClipboardList },
    { id: 'informe' as const, label: 'Informe', icon: FileText },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/50 flex justify-center sm:p-4" onClick={onClose}>
      <div className="bg-slate-50 w-full max-w-6xl h-full sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="bg-slate-900 text-white px-4 sm:px-5 pt-3 pb-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Avance de obra</p>
              <h2 className="text-base sm:text-lg font-black truncate leading-tight">{project.name}</h2>
              <p className="text-xs text-slate-400 truncate">{project.client}{t ? ` · ${t.plazo ? `Día ${t.dias} de ${t.plazo}` : `Día ${t.dias}`}` : ''}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 leading-none">{fmtPct(pct)}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">avance total</p>
            </div>
            <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl hover:bg-white/10 cursor-pointer shrink-0" title="Cerrar"><X className="w-5 h-5" /></button>
          </div>
          <div className="mt-2.5"><BarraAvance pct={pct} claro /></div>
          <div className="mt-3 flex gap-1 bg-white/5 p-1 rounded-xl">
            {tabs.map(x => { const Ic = x.icon, on = tab === x.id; return (
              <button key={x.id} onClick={() => setTab(x.id)} className={`flex-1 min-w-0 min-h-[36px] px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${on ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-white/10'}`}>
                <Ic className="w-4 h-4 shrink-0" /><span className="truncate">{x.label}</span>
              </button>
            ); })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5">
          {pendientes > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
              <CloudOff className="w-4 h-4 shrink-0" />
              <span className="flex-1 min-w-0"><b>{pendientes} foto{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de subir.</b> Se guardan en este equipo mientras la app esté abierta.</span>
              <button onClick={() => reintentarPendientes(project.id)} className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black cursor-pointer flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" />Reintentar</button>
            </div>
          )}
          {tab === 'avance' && <TabAvance project={project} a={a} pct={pct} guardar={guardar} setProjects={setProjects} locales={locales} onVer={(fotos, i) => setLb({ fotos, i })} onNuevoParte={() => setTab('parte')} />}
          {tab === 'parte' && <TabParte project={project} a={a} guardar={guardar} ws={ws} autor={autor} locales={locales} onVer={(fotos, i) => setLb({ fotos, i })} onGuardado={() => setTab('avance')} />}
          {tab === 'informe' && <TabInforme project={project} a={a} pct={pct} />}
        </div>
      </div>
      {lb && <Lightbox fotos={lb.fotos} inicio={lb.i} onClose={() => setLb(null)} />}
    </div>,
    document.body
  );
}

// ── Pestaña Avance: resumen, partidas y línea de tiempo ─────────────────────

function TabAvance({ project, a, pct, guardar, setProjects, locales, onVer, onNuevoParte }: {
  project: Project; a: AvanceObra; pct: number; guardar: (fn: (a: AvanceObra) => AvanceObra) => void; setProjects: SetProjects;
  locales: FotoLocal[]; onVer: (f: FotoVista[], i: number) => void; onNuevoParte: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [plazoEdit, setPlazoEdit] = useState(false);
  const [cobroAbierto, setCobroAbierto] = useState(false);
  const t = tiempoObra(project);
  const sugerido = cobroSugerido(project, pct);
  const [montoCobro, setMontoCobro] = useState('');
  const [metodo, setMetodo] = useState('Transferencia');
  const importables = useMemo(() => partidasDesdeProyecto(project).filter(x => !a.partidas.some(y => y.nombre.toLowerCase() === x.nombre.toLowerCase())), [project, a.partidas]);
  const rapidas = PARTIDAS_RAPIDAS.filter(n => !a.partidas.some(x => x.nombre.toLowerCase() === n.toLowerCase()));
  const conPeso = a.partidas.some(x => (Number(x.peso) || 0) > 0);

  const agregar = (n: string) => { const v = n.trim(); if (!v) return; guardar(x => ({ ...x, partidas: [...x.partidas, { id: nuevoId(), nombre: v, avance: 0, origen: 'manual' }] })); setNombre(''); };
  const cambiarPartida = (id: string, p: Partial<PartidaAvance>) => guardar(x => ({ ...x, partidas: x.partidas.map(y => y.id === id ? { ...y, ...p } : y) }));
  const quitarPartida = (id: string) => { if (window.confirm('¿Quitar esta partida del avance?')) guardar(x => ({ ...x, partidas: x.partidas.filter(y => y.id !== id) })); setEditId(null); };
  const borrarParte = (pt: ParteDiario) => {
    if (!window.confirm(`¿Borrar el parte del ${fechaCortaAv(pt.fecha)}? Las partidas vuelven al % anterior si no se cambiaron después.`)) return;
    guardar(x => ({ ...x, partes: x.partes.filter(y => y.id !== pt.id), partidas: x.partidas.map(y => { const c = pt.avances.find(v => v.partidaId === y.id); return c && limitarPct(y.avance) === c.a ? { ...y, avance: c.de } : y; }) }));
    locales.filter(f => f.parteId === pt.id).forEach(f => quitarFotoLocal(f.id));
  };
  const registrarCobro = () => {
    const m = Number(montoCobro || sugerido); if (!(m > 0)) return;
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, cobros: [...(p.cobros || []), { id: Date.now().toString(), amount: m, date: hoyISO(), method: metodo, reference: `Avance ${fmtPct(pct)}` }] } : p));
    setCobroAbierto(false); setMontoCobro('');
  };

  const dias = useMemo(() => {
    const g = new Map<string, ParteDiario[]>();
    [...a.partes].sort((x, y) => (y.fecha + y.creadoEn).localeCompare(x.fecha + x.creadoEn)).forEach(p => g.set(p.fecha, [...(g.get(p.fecha) || []), p]));
    return [...g.entries()];
  }, [a.partes]);
  const nombreDe = (id: string) => a.partidas.find(x => x.id === id)?.nombre || 'Partida';
  const ritmo = t?.esperado != null ? pct - t.esperado : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-3 sm:gap-4 items-start">
      <div className="space-y-3 sm:space-y-4 min-w-0">
        {/* Tiempo y cobro */}
        <div className={`${card} p-4 space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />Plazo</p>
            <button onClick={() => setPlazoEdit(v => !v)} className="text-[11px] font-bold text-emerald-700 cursor-pointer flex items-center gap-1"><Pencil className="w-3 h-3" />{plazoEdit ? 'Listo' : 'Editar'}</button>
          </div>
          {plazoEdit && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-bold text-slate-500">Inicio
                <input type="date" value={t?.inicio || ''} onChange={e => guardar(x => ({ ...x, fechaInicio: e.target.value || undefined }))} className={`${inp} mt-0.5`} /></label>
              <label className="text-[11px] font-bold text-slate-500">Plazo (días)
                <input type="number" min="1" value={a.plazoDias || t?.plazo || ''} onChange={e => guardar(x => ({ ...x, plazoDias: Number(e.target.value) || undefined }))} className={`${inp} mt-0.5`} placeholder="30" /></label>
            </div>
          )}
          {t ? (
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-bold text-slate-800">{t.plazo ? <>Día <b className="text-lg">{t.dias}</b> de {t.plazo}</> : <>Día <b className="text-lg">{t.dias}</b> de obra</>}</p>
                {t.restantes != null && <p className={`text-xs font-bold ${t.restantes < 0 ? 'text-rose-600' : 'text-slate-500'}`}>{t.restantes < 0 ? `${-t.restantes} días de atraso` : `quedan ${t.restantes} días`}</p>}
              </div>
              {t.esperado != null && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500"><span className="w-14 shrink-0">Tiempo</span><div className="flex-1"><div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-slate-400 rounded-full" style={{ width: `${t.esperado}%` }} /></div></div><span className="w-10 text-right font-bold">{t.esperado}%</span></div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500"><span className="w-14 shrink-0">Obra</span><div className="flex-1"><BarraAvance pct={pct} alto="h-1.5" /></div><span className="w-10 text-right font-bold text-emerald-700">{Math.round(pct)}%</span></div>
                  {ritmo != null && <p className={`text-[11px] font-bold ${ritmo >= -5 ? 'text-emerald-700' : 'text-amber-700'}`}>{ritmo >= 5 ? 'Vas adelantado respecto al plazo.' : ritmo >= -5 ? 'Vas al ritmo del plazo.' : `Vas ${Math.round(-ritmo)} puntos detrás del plazo.`}</p>}
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Inicio: {fechaCortaAv(t.inicio)}{!t.plazo && ' · Pon el plazo para comparar.'}</p>
            </div>
          ) : <p className="text-xs text-slate-500">Pon la fecha de inicio y el plazo para ver los días transcurridos.</p>}

          {(Number(project.presupuesto) || 0) > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-500">Cobrar por avance</p>
                  <p className="text-[11px] text-slate-400 truncate">{fmtPct(pct)} de {dinero(project.presupuesto)} − cobrado {dinero(totalCobrado(project))}</p>
                </div>
                <p className={`text-base font-black shrink-0 ${sugerido > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{dinero(Math.max(0, sugerido))}</p>
              </div>
              {sugerido > 0 && !cobroAbierto && <button onClick={() => { setCobroAbierto(true); setMontoCobro(String(sugerido)); }} className="mt-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer">Registrar este cobro</button>}
              {sugerido <= 0 && <p className="text-[11px] text-slate-400 mt-1">Lo cobrado ya cubre el avance actual.</p>}
              {cobroAbierto && (
                <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-1.5">
                  <input type="number" min="0" step="0.01" value={montoCobro} onChange={e => setMontoCobro(e.target.value)} className={inp} />
                  <select value={metodo} onChange={e => setMetodo(e.target.value)} className={inp}>{['Transferencia', 'Efectivo', 'Yape/Plin', 'Cheque', 'Otro'].map(m => <option key={m}>{m}</option>)}</select>
                  <button onClick={registrarCobro} className="px-3 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer">Guardar</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Partidas */}
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Partidas ({a.partidas.length})</p>
            <span className="text-[10px] text-slate-400">{conPeso ? 'Ponderado por costo' : 'Todas pesan igual'}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {a.partidas.map(x => (
              <div key={x.id} className="py-2">
                <button onClick={() => setEditId(editId === x.id ? null : x.id)} className="w-full text-left cursor-pointer">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-800 truncate">{x.nombre}{x.origen && x.origen !== 'manual' && <span className="ml-1.5 text-[9px] font-black uppercase text-slate-400">{x.origen}</span>}</span>
                    <span className={`text-sm font-black shrink-0 ${limitarPct(x.avance) >= 100 ? 'text-emerald-600' : 'text-slate-700'}`}>{limitarPct(x.avance)}%</span>
                  </div>
                  <BarraAvance pct={x.avance} />
                </button>
                {editId === x.id && (
                  <div className="mt-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="range" min="0" max="100" step="5" value={limitarPct(x.avance)} onChange={e => cambiarPartida(x.id, { avance: Number(e.target.value) })} className="flex-1 accent-emerald-600" />
                      <input type="number" min="0" max="100" value={limitarPct(x.avance)} onChange={e => cambiarPartida(x.id, { avance: limitarPct(Number(e.target.value)) })} className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-right" />
                    </div>
                    <div className="grid grid-cols-[1fr_7.5rem_auto] gap-1.5 items-end">
                      <label className="text-[10px] font-bold text-slate-500 min-w-0">Nombre<input value={x.nombre} onChange={e => cambiarPartida(x.id, { nombre: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm" /></label>
                      <label className="text-[10px] font-bold text-slate-500">Peso / costo<input type="number" min="0" value={x.peso ?? ''} onChange={e => cambiarPartida(x.id, { peso: Number(e.target.value) || undefined })} placeholder="opcional" className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm" /></label>
                      <button onClick={() => quitarPartida(x.id)} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer" title="Quitar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!a.partidas.length && <p className="py-3 text-xs text-slate-500">Agrega las partidas de la obra para medir el avance. Toca una partida para cambiar su %.</p>}
          </div>
          <form onSubmit={e => { e.preventDefault(); agregar(nombre); }} className="mt-2 flex gap-1.5">
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nueva partida (ej. Tarrajeo)" className={`${inp} flex-1 min-w-0`} />
            <button type="submit" className="px-3 rounded-xl bg-slate-900 text-white cursor-pointer shrink-0" title="Agregar"><Plus className="w-4 h-4" /></button>
          </form>
          {(rapidas.length > 0 || importables.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {importables.length > 0 && <button onClick={() => guardar(x => ({ ...x, partidas: [...x.partidas, ...importables] }))} className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold cursor-pointer">Importar del proyecto ({importables.length})</button>}
              {rapidas.map(n => <button key={n} onClick={() => agregar(n)} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer">+ {n}</button>)}
            </div>
          )}
        </div>
      </div>

      {/* Línea de tiempo */}
      <div className="space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Partes diarios ({a.partes.length})</p>
          <button onClick={onNuevoParte} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"><Plus className="w-4 h-4" />Nuevo parte</button>
        </div>
        {!dias.length && (
          <div className={`${card} p-8 text-center`}>
            <Camera className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700 mt-2">Aún no hay partes diarios</p>
            <p className="text-xs text-slate-500 mt-1">Registra lo avanzado cada día con fotos: así el cliente ve el progreso y tú cobras por avance.</p>
          </div>
        )}
        {dias.map(([fecha, partes]) => {
          const fotos: FotoVista[] = partes.flatMap(pt => [
            ...pt.fotos.map(f => ({ src: f.url, caption: `${fechaCortaAv(fecha)}${pt.nota ? ` · ${pt.nota}` : ''}` })),
          ]);
          return (
            <div key={fecha} className={`${card} overflow-hidden`}>
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-800 truncate first-letter:uppercase">{fechaLarga(fecha)}</p>
                <span className="text-[11px] text-slate-400 shrink-0">{diasDesde(fecha)}</span>
              </div>
              {partes.map(pt => {
                const clima = CLIMAS.find(c => c.id === pt.clima);
                const loc = locales.filter(f => f.parteId === pt.id);
                const base = partes.slice(0, partes.indexOf(pt)).reduce((n, q) => n + q.fotos.length, 0);
                return (
                  <div key={pt.id} className="p-3 sm:p-4 space-y-2 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5 min-w-0">
                        {pt.avances.map(v => (
                          <span key={v.partidaId} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            {nombreDe(v.partidaId)} <span className="text-emerald-500 font-semibold">{v.de} →</span> {v.a}%
                          </span>
                        ))}
                        {clima && <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{clima.emoji} {clima.label}</span>}
                        {!!pt.personal && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600"><Users className="w-3 h-3" />{pt.personal}</span>}
                      </div>
                      <button onClick={() => borrarParte(pt)} className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0" title="Borrar parte"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    {pt.nota && <p className="text-sm text-slate-700 leading-snug">{pt.nota}</p>}
                    {(pt.fotos.length > 0 || loc.length > 0) && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                        {pt.fotos.map((f, i) => (
                          <button key={f.id} onClick={() => onVer(fotos, base + i)} className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-200 cursor-pointer">
                            <img src={f.url} alt="" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                          </button>
                        ))}
                        {loc.map(f => <MiniFotoLocal key={f.id} f={f} onVer={() => onVer([{ src: f.dataUrl, caption: 'Pendiente de subir' }], 0)} />)}
                      </div>
                    )}
                    {pt.autor && <p className="text-[10px] text-slate-400">Registró: {pt.autor}</p>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const diasDesde = (fecha: string) => {
  const d = Math.round((new Date(hoyISO()).getTime() - new Date(fecha).getTime()) / 86400000);
  return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`;
};

// ── Pestaña Parte diario ─────────────────────────────────────────────────────

function TabParte({ project, a, guardar, ws, autor, locales, onVer, onGuardado }: {
  project: Project; a: AvanceObra; guardar: (fn: (a: AvanceObra) => AvanceObra) => void; ws: string; autor?: string;
  locales: FotoLocal[]; onVer: (f: FotoVista[], i: number) => void; onGuardado: () => void;
}) {
  const [fecha, setFecha] = useState(hoyISO());
  const [clima, setClima] = useState<ParteDiario['clima']>();
  const [personal, setPersonal] = useState('');
  const [nota, setNota] = useState('');
  const [cambios, setCambios] = useState<Record<string, number>>({});
  const [procesando, setProcesando] = useState(0);
  const [nuevaPartida, setNuevaPartida] = useState('');
  const camRef = useRef<HTMLInputElement>(null), galRef = useRef<HTMLInputElement>(null);
  const fotos = locales.filter(f => !f.parteId);
  const subiendo = fotos.filter(f => f.estado === 'subiendo').length;
  const personalSugerido = (project.personal || []).length;

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files || [])].filter(f => f.type.startsWith('image/'));
    e.target.value = '';
    setProcesando(n => n + files.length);
    for (const f of files) {
      try { await agregarFotoLocal(f, project.id, ws); } catch { /* imagen ilegible */ }
      setProcesando(n => n - 1);
    }
  };

  const avances = a.partidas.filter(x => cambios[x.id] !== undefined && cambios[x.id] !== limitarPct(x.avance)).map(x => ({ partidaId: x.id, de: limitarPct(x.avance), a: cambios[x.id] }));
  const puede = avances.length > 0 || nota.trim() !== '' || fotos.length > 0;

  const guardarParte = () => {
    if (!puede) return;
    const id = nuevoId();
    const listas = fotos.filter(f => f.estado === 'lista' && f.foto);
    const resto = fotos.filter(f => !(f.estado === 'lista' && f.foto));
    const parte: ParteDiario = {
      id, fecha, avances, fotos: listas.map(f => f.foto as FotoAvance), creadoEn: new Date().toISOString(),
      ...(nota.trim() ? { nota: nota.trim() } : {}), ...(Number(personal) > 0 ? { personal: Number(personal) } : {}), ...(clima ? { clima } : {}), ...(autor ? { autor } : {}),
    };
    guardar(x => ({ ...x, partes: [...x.partes, parte], partidas: x.partidas.map(y => { const c = avances.find(v => v.partidaId === y.id); return c ? { ...y, avance: c.a } : y; }) }));
    listas.forEach(f => quitarFotoLocal(f.id));
    asignarParte(resto.map(f => f.id), id);
    setCambios({}); setNota(''); setPersonal(''); setClima(undefined);
    onGuardado();
  };

  const agregarPartida = (n: string) => { const v = n.trim(); if (v) guardar(x => ({ ...x, partidas: [...x.partidas, { id: nuevoId(), nombre: v, avance: 0, origen: 'manual' }] })); setNuevaPartida(''); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[auto_1fr] gap-3 sm:gap-4 items-start">
      <div className={`${card} p-4 space-y-3 min-w-0 lg:row-span-2`}>
        <div className="grid grid-cols-[1fr_6.5rem] gap-2">
          <label className="text-[11px] font-bold text-slate-500 min-w-0">Fecha<input type="date" value={fecha} max={hoyISO()} onChange={e => setFecha(e.target.value || hoyISO())} className={`${inp} mt-0.5`} /></label>
          <label className="text-[11px] font-bold text-slate-500">Personal<input type="number" min="0" inputMode="numeric" value={personal} onChange={e => setPersonal(e.target.value)} placeholder={personalSugerido ? String(personalSugerido) : '0'} className={`${inp} mt-0.5`} /></label>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 mb-1">Clima</p>
          <div className="flex flex-wrap gap-1.5">
            {CLIMAS.map(c => (
              <button key={c.id} type="button" onClick={() => setClima(clima === c.id ? undefined : c.id)} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${clima === c.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{c.emoji} {c.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-500 mb-1">¿Hasta qué % avanzó cada partida hoy?</p>
          <div className="space-y-1.5">
            {a.partidas.map(x => {
              const v = cambios[x.id] ?? limitarPct(x.avance), cambio = v !== limitarPct(x.avance);
              return (
                <div key={x.id} className={`rounded-xl border pl-3 pr-2 py-1.5 grid grid-cols-[minmax(0,6.5rem)_1fr_4.6rem] items-center gap-2 ${cambio ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
                  <span className="text-[13px] font-bold text-slate-800 truncate">{x.nombre}</span>
                  <input type="range" min="0" max="100" step="5" value={v} onChange={e => setCambios(c => ({ ...c, [x.id]: Number(e.target.value) }))} className="w-full min-w-0 accent-emerald-600" />
                  <span className="text-xs font-black text-right leading-tight">{cambio && <span className="block text-[10px] text-slate-400 font-bold">desde {limitarPct(x.avance)}%</span>}<span className={cambio ? 'text-emerald-700' : 'text-slate-600'}>{v}%</span></span>
                </div>
              );
            })}
            {!a.partidas.length && <p className="text-xs text-slate-500">Aún no hay partidas. Agrega una:</p>}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {PARTIDAS_RAPIDAS.filter(n => !a.partidas.some(x => x.nombre.toLowerCase() === n.toLowerCase())).slice(0, 5).map(n => (
                <button key={n} type="button" onClick={() => agregarPartida(n)} className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer">+ {n}</button>
              ))}
              <form onSubmit={e => { e.preventDefault(); agregarPartida(nuevaPartida); }} className="flex gap-1 flex-1 min-w-[10rem]">
                <input value={nuevaPartida} onChange={e => setNuevaPartida(e.target.value)} placeholder="Otra partida" className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-xs outline-none" />
              </form>
            </div>
          </div>
        </div>
        <label className="block text-[11px] font-bold text-slate-500">Nota del día
          <textarea value={nota} onChange={e => setNota(e.target.value)} rows={3} placeholder="Qué se hizo, materiales que llegaron, incidencias…" className={`${inp} mt-0.5 resize-y`} /></label>
      </div>

      <div className="min-w-0 order-first lg:order-none">
        <div className={`${card} p-4`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Fotos ({fotos.length})</p>
            {(subiendo > 0 || procesando > 0) && <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />{procesando > 0 ? 'Preparando…' : `Subiendo ${subiendo}…`}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => camRef.current?.click()} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer"><Camera className="w-5 h-5" />Cámara</button>
            <button type="button" onClick={() => galRef.current?.click()} className="py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-black flex items-center justify-center gap-2 cursor-pointer"><ImageIcon className="w-5 h-5" />Galería</button>
          </div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={elegir} />
          <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={elegir} />
          {fotos.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {fotos.map((f, i) => (
                <div key={f.id} className="relative">
                  <MiniFotoLocal f={f} onVer={() => onVer(fotos.map(x => ({ src: x.dataUrl })), i)} />
                  <button onClick={() => quitarFotoLocal(f.id)} className="absolute top-1 left-1 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center cursor-pointer" title="Quitar"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          ) : <p className="mt-2 text-[11px] text-slate-400">Se reducen a 1600 px antes de subir (ahorra datos). Si no hay señal, quedan pendientes y se reintentan.</p>}
        </div>
      </div>
      <div className="space-y-2 min-w-0">
        <button onClick={guardarParte} disabled={!puede} className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
          Guardar parte del {fechaCortaAv(fecha)}{avances.length ? ` · ${avances.length} partida${avances.length > 1 ? 's' : ''}` : ''}{fotos.length ? ` · ${fotos.length} foto${fotos.length > 1 ? 's' : ''}` : ''}
        </button>
        {subiendo > 0 && <p className="text-[11px] text-slate-500 text-center">Puedes guardar ya: las fotos que sigan subiendo se agregan al parte al terminar.</p>}
      </div>
    </div>
  );
}

// ── Pestaña Informe para el cliente ──────────────────────────────────────────

function TabInforme({ project, a, pct }: { project: Project; a: AvanceObra; pct: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { datos } = useEmpresa();
  const [montos, setMontos] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const t = tiempoObra(project);
  const texto = textoWhatsApp(project, datos.nombre);
  const dias = useMemo(() => {
    const g = new Map<string, ParteDiario[]>();
    [...a.partes].sort((x, y) => (y.fecha + y.creadoEn).localeCompare(x.fecha + x.creadoEn)).forEach(p => g.set(p.fecha, [...(g.get(p.fecha) || []), p]));
    return [...g.entries()].filter(([, ps]) => ps.some(p => p.fotos.length || p.nota)).slice(0, 4);
  }, [a.partes]);
  const copiar = async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* sin portapapeles */ } };
  const valorizado = (pct / 100) * (Number(project.presupuesto) || 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between max-w-3xl mx-auto">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={montos} onChange={e => setMontos(e.target.checked)} className="accent-emerald-600" />Incluir montos</label>
        <div className="flex flex-wrap gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white text-xs font-black flex items-center gap-1.5">WhatsApp</a>
          <button onClick={copiar} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black flex items-center gap-1.5 cursor-pointer">{copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}{copiado ? 'Copiado' : 'Copiar texto'}</button>
          <BotonImprimir objetivo={() => ref.current} titulo={`Avance de obra - ${project.name}`} etiqueta="Imprimir / PDF" />
        </div>
      </div>

      <div ref={ref} className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto p-4 sm:p-7 text-slate-800">
        <BandaMarca />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><CabeceraEmpresa subtitulo="Informe de avance de obra" /></div>
          <p className="text-[11px] text-slate-500 text-right">Fecha: <b>{fechaCortaAv(hoyISO())}</b></p>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="rounded-xl bg-slate-50 p-2.5 min-w-0 col-span-2"><p className="text-slate-400 font-bold uppercase">Obra</p><p className="font-black text-sm truncate">{project.name}</p><p className="text-slate-500 truncate">Cliente: {project.client}</p></div>
          <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-slate-400 font-bold uppercase">Inicio</p><p className="font-black text-sm">{t ? fechaCortaAv(t.inicio) : '—'}</p></div>
          <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-slate-400 font-bold uppercase">Plazo</p><p className="font-black text-sm">{t ? (t.plazo ? `Día ${t.dias} de ${t.plazo}` : `Día ${t.dias}`) : '—'}</p></div>
        </div>

        <div className="mt-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-4">
          <div className="shrink-0 text-center">
            <p className="text-4xl font-black text-emerald-700 leading-none">{Math.round(pct)}<span className="text-xl">%</span></p>
            <p className="text-[10px] font-bold text-emerald-800 uppercase mt-1">Avance total</p>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <BarraAvance pct={pct} alto="h-3" />
            {t?.esperado != null && <p className="text-[11px] text-slate-600">Tiempo transcurrido: {t.esperado}% del plazo.</p>}
            {montos && <p className="text-[11px] text-slate-600">Valorizado: <b>{dinero(valorizado)}</b> de {dinero(project.presupuesto)} · Cobrado: {dinero(totalCobrado(project))}</p>}
          </div>
        </div>

        {a.partidas.length > 0 && (
          <table className="w-full mt-4 text-xs">
            <thead><tr className="text-left text-[10px] uppercase text-slate-400 border-b border-slate-200"><th className="py-1.5 font-bold">Partida</th><th className="py-1.5 font-bold w-[40%]">Avance</th><th className="py-1.5 font-bold text-right w-12">%</th></tr></thead>
            <tbody>
              {a.partidas.map(x => (
                <tr key={x.id} className="border-b border-slate-100">
                  <td className="py-1.5 pr-2 font-semibold">{x.nombre}</td>
                  <td className="py-1.5"><BarraAvance pct={x.avance} /></td>
                  <td className={`py-1.5 text-right font-black ${limitarPct(x.avance) >= 100 ? 'text-emerald-700' : ''}`}>{limitarPct(x.avance)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {dias.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Registro fotográfico</p>
            <div className="space-y-3">
              {dias.map(([fecha, ps]) => {
                const fs = ps.flatMap(p => p.fotos).slice(0, 3);
                const notas = ps.map(p => p.nota).filter(Boolean).join(' ');
                const av = ps.flatMap(p => p.avances);
                return (
                  <div key={fecha} style={{ breakInside: 'avoid' }}>
                    <p className="text-[11px] font-black text-slate-700 first-letter:uppercase">{fechaLarga(fecha)}
                      {av.length > 0 && <span className="font-semibold text-emerald-700 normal-case"> · {av.map(v => `${a.partidas.find(x => x.id === v.partidaId)?.nombre || 'Partida'} ${v.a}%`).join(', ')}</span>}</p>
                    {notas && <p className="text-[11px] text-slate-600 mb-1">{notas}</p>}
                    {fs.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {fs.map(f => <img key={f.id} src={f.url} alt="" className="w-full aspect-[4/3] object-cover rounded-lg bg-slate-100" />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {!a.partidas.length && !a.partes.length && <p className="mt-4 text-xs text-slate-500 no-imprimir">Agrega partidas y partes diarios para armar el informe.</p>}
        <p className="mt-5 pt-3 border-t border-slate-100 text-[10px] text-slate-400">Informe generado el {fechaCortaAv(hoyISO())}. Porcentajes estimados por el contratista según lo ejecutado en obra.</p>
      </div>
    </div>
  );
}
