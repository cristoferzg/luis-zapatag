// =============================================================================
// Melamina: muebles a medida (closets, cocinas, reposteros, escritorios…).
//   1. Muebles: elige el tipo, pon medidas y partes; ves el dibujo y el precio.
//   2. Diseñador: las paredes del ambiente de frente; arrastra cada mueble.
//   3. 3D: el ambiente completo (paredes en L / U) para mostrar al cliente.
//   4. Despiece: lista de cortes en mm y plano de cortes por tablero (para el local).
//   5. Presupuesto: formal, para imprimir o enviar por WhatsApp.
// =============================================================================
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Armchair, LayoutTemplate, Box, Scissors, ClipboardList, Tag, Plus, Trash2, Copy, ChevronDown, ChevronUp, FilePlus2, FolderOpen, Save, Send, AlignHorizontalJustifyStart, X, AlertTriangle } from 'lucide-react';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { CabeceraEmpresa, useEmpresa, BandaMarca, CondicionesComerciales } from '../lib/empresa';
import BotonImprimir from './common/BotonImprimir';
import { simb } from '../lib/currency';
import { COLORES_MELAMINA, colorMelamina } from '../catalogo/melamina';
import {
  TIPOS, TipoMueble, Mueble, PuertaTipo, EstiloPuerta, Tirador, tipoDe, muebleNuevo, metradoMelamina, avisosMueble, nombreMueble, esAlto, uid,
  ALTO_MUEBLE_ALTO, TABLERO_L, TABLERO_A, REFILE, MetradoMelamina, Pieza,
} from './melamina/calculoMelamina';
import { CotizacionMelamina, KEY_COT_ACTUAL, KEY_COT_LISTA, KEY_PESTANA, cotizacionVacia, leerCotizacionActual, leerCotizaciones, paredNueva } from './melamina/cotizacionMelamina';
import DibujoMueble, { FrenteSvg } from './melamina/DibujoMueble';
import DisenoIA, { mueblesDePropuesta } from './melamina/DisenoIA';

const Melamina3D = lazy(() => import('./melamina/Melamina3D'));

const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Pestana = 'muebles' | 'disenador' | '3d' | 'despiece' | 'presupuesto';
const PESTANAS: Pestana[] = ['muebles', 'disenador', '3d', 'despiece', 'presupuesto'];
type SetCot = (f: (c: CotizacionMelamina) => CotizacionMelamina) => void;

// Metrado de la cotización: no depende de dónde está cada mueble en la pared.
function useMetrado(cot: CotizacionMelamina) {
  const catalogo = useCatalogo();
  const clave = JSON.stringify(cot.muebles.map(({ pos: _p, ...m }) => m));
  return useMemo(() => metradoMelamina(cot.muebles, { incluirCorte: cot.incluirCorte, incluirEnchape: cot.incluirEnchape, respetarVeta: cot.respetarVeta }),
    [clave, cot.incluirCorte, cot.incluirEnchape, cot.respetarVeta, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
}
const totalCon = (r: MetradoMelamina, cot: CotizacionMelamina) => (r.materiales + r.manoObra) * (1 + (cot.gg + cot.util) / 100);

export default function MelaminaView({ onIrAPrecios }: { onIrAPrecios?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>(() => {
    const p = safeStorage.getItem<string>(KEY_PESTANA, 'muebles');
    return (PESTANAS.includes(p as Pestana) ? p : 'muebles') as Pestana;
  });
  useEffect(() => { safeStorage.setItem(KEY_PESTANA, pestana); }, [pestana]);
  const [cot, setCotRaw] = useState<CotizacionMelamina>(leerCotizacionActual);
  useEffect(() => { safeStorage.setItem(KEY_COT_ACTUAL, cot); }, [cot]);
  const setCot: SetCot = f => setCotRaw(c => f(c));
  const [sel, setSel] = useState<string | null>(cot.muebles[cot.muebles.length - 1]?.id || null);
  const r = useMetrado(cot);

  const tabs: { id: Pestana; label: string; corto: string; icon: any }[] = [
    { id: 'muebles', label: 'Muebles', corto: 'Muebles', icon: Armchair },
    { id: 'disenador', label: 'Diseñador', corto: 'Diseño', icon: LayoutTemplate },
    { id: '3d', label: 'Vista 3D', corto: '3D', icon: Box },
    { id: 'despiece', label: 'Despiece y cortes', corto: 'Cortes', icon: Scissors },
    { id: 'presupuesto', label: 'Presupuesto', corto: 'Presup.', icon: ClipboardList },
  ];
  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <div className="oculto-en-dibujo flex flex-row flex-nowrap items-center justify-center lg:justify-between gap-2 lg:gap-3 px-2 sm:px-4 py-1.5 lg:py-3 bg-white border-b border-slate-200">
        {/* En el celular el título ya está en la barra superior: solo en PC. */}
        <div className="hidden lg:flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600"><Armchair className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">Melamina</h2>
            <p className="text-[11px] text-slate-500">Closets, cocinas, reposteros y más: medidas, diseño, cortes y presupuesto.</p>
          </div>
        </div>
        <div className="flex flex-nowrap w-full lg:w-auto lg:inline-flex p-0.5 lg:p-1 bg-slate-100 rounded-xl gap-0.5 lg:shrink-0">
          {tabs.map(t => {
            const Ic = t.icon;
            return (
              <button key={t.id} onClick={() => setPestana(t.id)} title={t.label}
                className={`flex-1 lg:flex-none min-w-0 min-h-[40px] flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 px-1 lg:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer ${pestana === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                <Ic className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-teal-600 shrink-0" /><span className="hidden lg:inline">{t.label}</span><span className="lg:hidden truncate max-w-full">{t.corto}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {pestana === 'muebles' && <Muebles cot={cot} setCot={setCot} r={r} sel={sel} setSel={setSel} onPresupuesto={() => setPestana('presupuesto')} onDisenar={() => setPestana('disenador')} />}
        {pestana === 'disenador' && <Disenador cot={cot} setCot={setCot} sel={sel} setSel={setSel} onMuebles={() => setPestana('muebles')} />}
        {pestana === '3d' && <Vista3D cot={cot} sel={sel} setSel={setSel} onDisenar={() => setPestana('disenador')} />}
        {pestana === 'despiece' && <Despiece cot={cot} setCot={setCot} r={r} onMuebles={() => setPestana('muebles')} />}
        {pestana === 'presupuesto' && <Presupuesto cot={cot} setCot={setCot} r={r} onIrAPrecios={onIrAPrecios} />}
      </div>
    </div>
  );
}

// ── Campos ──────────────────────────────────────────────────────────────────
function Num({ label, value, onChange, step = 0.01, min = 0, max, sufijo = 'm', entero = false }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; sufijo?: string; entero?: boolean }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { if (parseFloat(txt) !== value) setTxt(String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const fijar = (v: number) => { let x = Math.max(min, max !== undefined ? Math.min(max, v) : v); x = entero ? Math.round(x) : Math.round(x * 100) / 100; onChange(x); };
  return (
    <label className="block min-w-0 text-[10px] font-bold text-slate-500 uppercase">{label}
      <div className="mt-0.5 flex items-center min-h-[40px] rounded-lg bg-slate-100 focus-within:ring-2 focus-within:ring-teal-300">
        <input type="number" inputMode={entero ? 'numeric' : 'decimal'} step={step} min={min} max={max} value={txt}
          onChange={e => { setTxt(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) fijar(v); }}
          onBlur={() => setTxt(String(value))}
          className="w-full min-w-0 bg-transparent px-2 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none" />
        {sufijo && <span className="pr-2 text-[11px] font-bold text-slate-400 normal-case">{sufijo}</span>}
      </div>
    </label>
  );
}
const inputTxt = 'mt-0.5 w-full min-h-[40px] px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300';
const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer';

function Avisos({ lista }: { lista: string[] }) {
  if (!lista.length) return null;
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 space-y-0.5">
      {lista.map((a, i) => <p key={i} className="text-[11px] font-bold text-amber-800 flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />{a}</p>)}
    </div>
  );
}

// ── 1. Muebles ──────────────────────────────────────────────────────────────
function Muebles({ cot, setCot, r, sel, setSel, onPresupuesto, onDisenar }: {
  cot: CotizacionMelamina; setCot: SetCot; r: MetradoMelamina; sel: string | null; setSel: (id: string | null) => void; onPresupuesto: () => void; onDisenar: () => void;
}) {
  const [lista, setLista] = useState<CotizacionMelamina[]>(leerCotizaciones);
  const [verLista, setVerLista] = useState(false);
  const [aviso, setAviso] = useState('');
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 3000); };
  const catalogo = useCatalogo();
  const total = totalCon(r, cot);
  // Precio aproximado de cada mueble por separado (sus tableros redondeados aparte).
  const sub = useMemo(() => new Map(cot.muebles.map(m => [m.id, metradoMelamina([m], { incluirCorte: cot.incluirCorte, incluirEnchape: cot.incluirEnchape, respetarVeta: cot.respetarVeta })])),
    [JSON.stringify(cot.muebles.map(({ pos: _p, ...m }) => m)), cot.incluirCorte, cot.incluirEnchape, cot.respetarVeta, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps

  const upd = (id: string, patch: Partial<Mueble>) => setCot(c => ({ ...c, muebles: c.muebles.map(m => m.id === id ? { ...m, ...patch } : m) }));
  const agregar = (t: TipoMueble) => {
    const ultimo = cot.muebles[cot.muebles.length - 1];
    const m = muebleNuevo(t, ultimo?.color || 'Blanco');
    setCot(c => ({ ...c, muebles: [...c.muebles, m] })); setSel(m.id);
  };
  const guardar = () => {
    const nueva = { ...cot, actualizado: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) };
    const l = [nueva, ...lista.filter(x => x.id !== cot.id)];
    safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); setCot(() => nueva);
    avisar('✓ Guardada en Mis cotizaciones');
  };
  const duplicarCot = () => {
    const copia: CotizacionMelamina = { ...cot, id: Math.random().toString(36).slice(2, 10), nombre: `${cot.nombre || 'Cotización'} (copia)`, muebles: cot.muebles.map(m => ({ ...m, id: uid() })), actualizado: undefined };
    setCot(() => copia); setSel(null); avisar('✓ Copia creada: guárdala para tenerla en la lista');
  };
  const nPiezas = cot.muebles.reduce((x, m) => x + Math.max(1, m.cantidad), 0);

  return (
    <div className="p-3 sm:p-5 max-w-[1600px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5 xl:items-start">
      <div className="space-y-4 min-w-0">
        {/* Datos de la cotización */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre de la obra
              <input value={cot.nombre} onChange={e => setCot(c => ({ ...c, nombre: e.target.value }))} placeholder="Ej. Closet y cocina – Sra. Rosa" className={inputTxt} />
            </label>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Cliente
              <input value={cot.cliente} onChange={e => setCot(c => ({ ...c, cliente: e.target.value }))} placeholder="Nombre del cliente" className={inputTxt} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={guardar} className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}><Save className="w-4 h-4" /> Guardar</button>
            <button onClick={() => setVerLista(v => !v)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FolderOpen className="w-4 h-4" /> Mis cotizaciones ({lista.length})</button>
            <button onClick={() => { if (!cot.muebles.length || confirm('¿Empezar una cotización nueva? La actual sigue en Mis cotizaciones si la guardaste.')) { setCot(() => cotizacionVacia()); setSel(null); } }}
              className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FilePlus2 className="w-4 h-4" /> Nueva</button>
            {cot.muebles.length > 0 && <button onClick={duplicarCot} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Copy className="w-4 h-4" /> Duplicar</button>}
            {aviso && <span className="text-xs font-bold text-emerald-700">{aviso}</span>}
          </div>
          {verLista && (
            <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
              {lista.length === 0 && <p className="p-3 text-xs text-slate-400">Aún no guardaste cotizaciones.</p>}
              {lista.map(c => (
                <div key={c.id} className="flex flex-nowrap items-center gap-2 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.nombre || 'Sin nombre'}{c.cliente ? ` · ${c.cliente}` : ''}</p>
                    <p className="text-[11px] text-slate-400 truncate">{(c.muebles || []).length} muebles · {c.actualizado || ''}</p>
                  </div>
                  <button onClick={() => { setCot(() => ({ ...cotizacionVacia(), ...c })); setVerLista(false); setSel(null); }} className={`${btn} bg-white text-teal-700 hover:bg-teal-50 shrink-0`}>Abrir</button>
                  <button onClick={() => { if (confirm('¿Borrar esta cotización?')) { const l = lista.filter(x => x.id !== c.id); safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); } }} title="Borrar"
                    className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diseñar con IA */}
        <DisenoIA onAplicar={(p, reemplazar) => {
          const nuevos = mueblesDePropuesta(p);
          setCot(c => {
            const base = reemplazar ? [] : c.muebles;
            // Si la IA trae paredes y no hay muebles ubicados (o se reemplaza), se usan sus paredes.
            const usarParedes = p.paredes.length > 0 && (reemplazar || !c.muebles.some(m => m.pos));
            const ubicar = nuevos.map(m => m.pos ? (usarParedes ? m : { ...m, pos: undefined }) : m);
            return { ...c, muebles: [...base, ...ubicar], paredes: usarParedes ? p.paredes : c.paredes };
          });
          if (nuevos.length) setSel(nuevos[0].id);
        }} />

        {/* Agregar mueble */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-2">
          <p className="text-xs font-black text-slate-800">¿Qué mueble vas a hacer? <span className="font-semibold text-slate-400">Toca para agregar</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => agregar(t.id)} title={t.descripcion}
                className="text-left min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors">
                <span className="text-lg leading-none">{t.emoji}</span>
                <p className="text-xs font-bold text-slate-800 leading-tight mt-1">{t.corto}</p>
                <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{t.descripcion}</p>
              </button>
            ))}
          </div>
        </div>

        {cot.muebles.length === 0 && <p className="text-center text-sm text-slate-400 py-6">Agrega tu primer mueble con los botones de arriba.</p>}
        <div className="space-y-2.5">
          {cot.muebles.map((m, i) => {
            const t = tipoDe(m.tipo);
            const open = sel === m.id;
            const avisos = avisosMueble(m);
            const rm = sub.get(m.id);
            return (
              <div key={m.id} className={`bg-white rounded-2xl shadow-xs border ${open ? 'border-teal-300' : avisos.length ? 'border-amber-200' : 'border-transparent'}`}>
                <button onClick={() => setSel(open ? null : m.id)} className="w-full flex flex-nowrap items-center gap-3 p-3 text-left cursor-pointer">
                  <span className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-lg border border-slate-200" style={{ background: colorMelamina(m.color).hex }}>{t.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-800 truncate">{nombreMueble(m, i)}</p>
                    <p className="text-[11px] text-slate-500 truncate">{f2(m.ancho)} × {f2(m.alto)} × {f2(m.prof)} m{m.cantidad > 1 ? ` × ${m.cantidad}` : ''} · {m.color}{avisos.length ? ' · ⚠ revisar' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold text-teal-700">{rm ? `≈ ${S(totalCon(rm, cot))}` : ''}</p>
                    <p className="text-[10px] text-slate-400">{rm ? `${rm.nTableros} tab.` : ''}</p>
                  </div>
                  {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {open && <EditorMueble m={m} i={i} upd={patch => upd(m.id, patch)} avisos={avisos}
                  onDuplicar={() => { const n = { ...m, id: uid(), pos: undefined }; setCot(c => ({ ...c, muebles: [...c.muebles.slice(0, i + 1), n, ...c.muebles.slice(i + 1)] })); setSel(n.id); }}
                  onQuitar={() => { if (confirm('¿Quitar este mueble?')) { setCot(c => ({ ...c, muebles: c.muebles.filter(x => x.id !== m.id) })); setSel(null); } }}
                  onDisenar={onDisenar} />}
              </div>
            );
          })}
        </div>

        {cot.muebles.length > 0 && (
          <div className="xl:hidden sticky bottom-3 z-20 ml-auto w-full lg:w-[420px] bg-slate-900/95 backdrop-blur text-white rounded-2xl shadow-xl px-4 py-2.5 flex flex-nowrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{nPiezas} mueble{nPiezas > 1 ? 's' : ''} · {r.nTableros} tableros</p>
              <p className="text-lg font-black font-mono truncate">{S(total)}</p>
            </div>
            <button onClick={onPresupuesto} className={`${btn} bg-teal-500 text-white hover:bg-teal-400 shrink-0`}><ClipboardList className="w-4 h-4" /> Presupuesto</button>
          </div>
        )}
      </div>

      {/* Resumen fijo (solo PC ancho) */}
      <aside className="hidden xl:block sticky top-4 space-y-3">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resumen</p>
          <div>
            <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{nPiezas} muebles · {r.nTableros} tableros · {r.dias} días · incluye GG {cot.gg}% y utilidad {cot.util}%</p>
          </div>
          {cot.muebles.length > 0 && (
            <div className="max-h-[40vh] overflow-y-auto divide-y divide-white/10 rounded-xl bg-white/5">
              {cot.muebles.map((m, i) => (
                <button key={m.id} onClick={() => setSel(m.id)} className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-white/10">
                  <span>{tipoDe(m.tipo).emoji}</span>
                  <span className="flex-1 min-w-0 text-xs font-bold truncate">{nombreMueble(m, i)}</span>
                  <span className="text-xs font-mono text-slate-300 shrink-0">{f2(m.ancho)}×{f2(m.alto)}</span>
                </button>
              ))}
            </div>
          )}
          <button onClick={onPresupuesto} disabled={!cot.muebles.length} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-black cursor-pointer hover:bg-teal-400 disabled:opacity-40"><ClipboardList className="w-4 h-4" /> Ver presupuesto</button>
        </div>
      </aside>
    </div>
  );
}

function EditorMueble({ m, upd, avisos, onDuplicar, onQuitar, onDisenar }: {
  m: Mueble; i: number; upd: (p: Partial<Mueble>) => void; avisos: string[]; onDuplicar: () => void; onQuitar: () => void; onDisenar: () => void;
}) {
  const t = tipoDe(m.tipo);
  const enLista = COLORES_MELAMINA.some(c => c.nombre === m.color);
  return (
    <div className="px-3 pb-3 pt-3 border-t border-slate-100 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
      <div className="space-y-3 min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <label className="col-span-2 block text-[10px] font-bold text-slate-500 uppercase">Nombre o ambiente
            <input value={m.nombre} onChange={e => upd({ nombre: e.target.value })} placeholder={`Ej. ${t.corto} dormitorio principal`} className={inputTxt} />
          </label>
          <label className="col-span-2 block text-[10px] font-bold text-slate-500 uppercase">Color de la melamina
            <select value={enLista ? m.color : '__otro'} onChange={e => upd({ color: e.target.value === '__otro' ? (enLista ? 'Otro color' : m.color) : e.target.value })}
              className={`${inputTxt} cursor-pointer`}>
              {COLORES_MELAMINA.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              <option value="__otro">Otro color…</option>
            </select>
          </label>
          {!enLista && (
            <label className="col-span-2 sm:col-span-4 block text-[10px] font-bold text-slate-500 uppercase">Nombre del color
              <input value={m.color} onChange={e => upd({ color: e.target.value })} placeholder="Ej. Cedro, Lino" className={inputTxt} />
            </label>
          )}
          <Num label="Ancho" value={m.ancho} min={0.2} max={4} onChange={v => upd({ ancho: v })} />
          <Num label="Alto" value={m.alto} min={0.2} max={2.42} onChange={v => upd({ alto: v })} />
          <Num label="Profundidad" value={m.prof} min={0.15} max={1.2} onChange={v => upd({ prof: v })} />
          <Num label="Cantidad" value={m.cantidad} min={1} max={50} step={1} entero sufijo="×" onChange={v => upd({ cantidad: v })} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de puerta</p>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
            {([['batiente', 'Batiente'], ['corrediza', 'Corrediza'], ['ninguna', 'Sin puertas']] as [PuertaTipo, string][]).map(([v, l]) => (
              <button key={v} onClick={() => upd({ puertaTipo: v, puertas: v === 'ninguna' ? 0 : v === 'corrediza' ? Math.max(2, m.puertas) : Math.max(1, m.puertas) })}
                className={`min-h-[40px] min-w-0 rounded-lg text-xs font-bold cursor-pointer truncate px-1 ${m.puertaTipo === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {m.puertaTipo !== 'ninguna' && <Num label={m.puertaTipo === 'corrediza' ? 'Hojas' : 'Puertas'} value={m.puertas} min={m.puertaTipo === 'corrediza' ? 2 : 1} max={m.puertaTipo === 'corrediza' ? 6 : 20} step={1} entero sufijo="und" onChange={v => upd({ puertas: v })} />}
          <Num label="Cajones" value={m.cajones} max={12} step={1} entero sufijo="und" onChange={v => upd({ cajones: v })} />
          <Num label="Repisas" value={m.repisas} max={40} step={1} entero sufijo="und" onChange={v => upd({ repisas: v })} />
          <Num label="Divisiones" value={m.divisiones} max={20} step={1} entero sufijo="und" onChange={v => upd({ divisiones: v })} />
          <Num label="Zócalo" value={m.zocalo} max={0.3} onChange={v => upd({ zocalo: v })} />
        </div>
        {/* Diseño de puertas y frentes */}
        {(m.puertas > 0 || m.cajones > 0) && (
          <div className="rounded-xl border border-slate-200 p-2.5 space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase">Diseño de puertas y frentes</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {m.puertaTipo !== 'ninguna' && m.puertas > 0 && (
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Puerta
                  <select value={m.estiloPuerta || 'lisa'} onChange={e => upd({ estiloPuerta: e.target.value as EstiloPuerta })} className={`${inputTxt} cursor-pointer`}>
                    <option value="lisa">Lisa</option>
                    <option value="ranurada">Ranurada (líneas)</option>
                    <option value="vidrio">Vidrio con marco de aluminio</option>
                  </select>
                </label>
              )}
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Tirador
                <select value={m.tirador || 'barra'} onChange={e => upd({ tirador: e.target.value as Tirador })} className={`${inputTxt} cursor-pointer`}>
                  <option value="barra">Barra</option>
                  <option value="boton">Perilla</option>
                  <option value="gola">Perfil de aluminio (sin tirador)</option>
                  <option value="push">Push (abre al presionar)</option>
                </select>
              </label>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Color de los frentes
                <select value={m.colorFrente || ''} onChange={e => upd({ colorFrente: e.target.value })} className={`${inputTxt} cursor-pointer`}>
                  <option value="">Igual al mueble</option>
                  {COLORES_MELAMINA.filter(c => c.nombre !== m.color).map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                </select>
              </label>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <label className="inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={m.colgador} onChange={e => upd({ colgador: e.target.checked })} /> Tubo colgador (ropa)</label>
          <label className="inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={m.fondoHdf} onChange={e => upd({ fondoHdf: e.target.checked })} /> Fondo de HDF 3 mm</label>
        </div>
        {t.nota && <p className="text-[11px] font-bold text-sky-800 bg-sky-50 rounded-xl px-3 py-2">ℹ️ {t.nota}</p>}
        <Avisos lista={avisos} />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button onClick={onDisenar} className={`${btn} bg-teal-50 text-teal-700 hover:bg-teal-100`}><LayoutTemplate className="w-4 h-4" /> Ubicar en la pared</button>
          <div className="flex-1" />
          <button onClick={onDuplicar} className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}><Copy className="w-4 h-4" /> Duplicar</button>
          <button onClick={onQuitar} className={`${btn} bg-rose-50 text-rose-700 hover:bg-rose-100`}><Trash2 className="w-4 h-4" /> Quitar</button>
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 p-2 flex items-center justify-center order-first md:order-none">
        <DibujoMueble m={m} className="w-full h-auto max-h-[240px]" />
      </div>
    </div>
  );
}

// ── 2. Diseñador (paredes en elevación) ─────────────────────────────────────
function Disenador({ cot, setCot, sel, setSel, onMuebles }: { cot: CotizacionMelamina; setCot: SetCot; sel: string | null; setSel: (id: string | null) => void; onMuebles: () => void }) {
  const [pi, setPi] = useState(() => Math.min(cot.paredes.length - 1, Math.max(0, cot.muebles.find(m => m.id === sel)?.pos?.pared ?? 0)));
  const pared = cot.paredes[Math.min(pi, cot.paredes.length - 1)] || cot.paredes[0];
  const idx = cot.paredes.indexOf(pared);
  const [arrastre, setArrastre] = useState<{ id: string; dx: number; dy: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // En el celular (Android) el dedo sobre un mueble movía la página y cancelaba el arrastre:
  // se bloquea el desplazamiento solo cuando el toque empieza sobre un mueble.
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const sobreMueble = (e: TouchEvent) => !!(e.target as Element | null)?.closest?.('[data-mueble]');
    const bloquear = (e: TouchEvent) => { if (sobreMueble(e)) e.preventDefault(); };
    svg.addEventListener('touchstart', bloquear, { passive: false });
    svg.addEventListener('touchmove', bloquear, { passive: false });
    return () => { svg.removeEventListener('touchstart', bloquear); svg.removeEventListener('touchmove', bloquear); };
  }, []);
  const L = pared.largo, A = pared.alto;
  const enPared = cot.muebles.filter(m => m.pos?.pared === idx);
  const sinUbicar = cot.muebles.filter(m => !m.pos || m.pos.pared >= cot.paredes.length);
  const anchoOcupa = (m: Mueble) => m.ancho * Math.max(1, Math.round(m.cantidad || 1));
  const posDe = (m: Mueble) => arrastre?.id === m.id ? { x: arrastre.x, y: arrastre.y } : { x: m.pos!.x, y: m.pos!.y };
  const fijarPos = (id: string, pos: Mueble['pos']) => setCot(c => ({ ...c, muebles: c.muebles.map(m => m.id === id ? { ...m, pos } : m) }));
  const limitar = (m: Mueble, x: number, y: number) => ({
    x: Math.round(Math.max(0, Math.min(Math.max(0, L - anchoOcupa(m)), x)) * 100) / 100,
    y: Math.round(Math.max(0, Math.min(Math.max(0, A - m.alto), y)) * 100) / 100,
  });
  // Primer hueco libre a la derecha en la fila del mueble (abajo o arriba).
  const ubicar = (m: Mueble) => {
    const y = esAlto(m) ? Math.min(ALTO_MUEBLE_ALTO, Math.max(0, A - m.alto)) : 0;
    const fila = enPared.filter(o => o.id !== m.id && o.pos && (o.pos.y < y + m.alto && y < o.pos.y + o.alto));
    const x = fila.reduce((mx, o) => Math.max(mx, o.pos!.x + anchoOcupa(o)), 0);
    fijarPos(m.id, { pared: idx, ...limitar(m, x, y) }); setSel(m.id);
  };
  // Acomodar: primero los muebles de piso de izquierda a derecha; luego los altos, cada uno
  // después de lo que ya ocupa su misma altura (un repostero no se monta sobre un closet).
  const acomodar = () => setCot(c => {
    const enEsta = c.muebles.filter(m => m.pos?.pared === idx);
    const orden = [...enEsta.filter(m => !esAlto(m)), ...enEsta.filter(m => esAlto(m))];
    const puestos: { x: number; y: number; w: number; h: number }[] = [];
    const nuevas = new Map<string, { pared: number; x: number; y: number }>();
    for (const m of orden) {
      const y = esAlto(m) ? Math.min(ALTO_MUEBLE_ALTO, Math.max(0, A - m.alto)) : 0;
      const x = puestos.filter(o => o.y < y + m.alto - 0.001 && y < o.y + o.h - 0.001).reduce((mx, o) => Math.max(mx, o.x + o.w), 0);
      puestos.push({ x, y, w: anchoOcupa(m), h: m.alto });
      nuevas.set(m.id, { pared: idx, x: Math.round(x * 100) / 100, y });
    }
    return { ...c, muebles: c.muebles.map(m => nuevas.has(m.id) ? { ...m, pos: nuevas.get(m.id) } : m) };
  });
  // Avisos: muebles que se salen de la pared o que se cruzan entre sí.
  const nombreDe = (m: Mueble) => nombreMueble(m, cot.muebles.indexOf(m));
  const fueraDePared = enPared.filter(m => m.pos && (m.pos.x + anchoOcupa(m) > L + 0.005 || m.pos.y + m.alto > A + 0.005));
  const cruces: [Mueble, Mueble][] = [];
  enPared.forEach((a1, i) => enPared.slice(i + 1).forEach(b1 => {
    if (!a1.pos || !b1.pos) return;
    const sx = Math.min(a1.pos.x + anchoOcupa(a1), b1.pos.x + anchoOcupa(b1)) - Math.max(a1.pos.x, b1.pos.x);
    const sy = Math.min(a1.pos.y + a1.alto, b1.pos.y + b1.alto) - Math.max(a1.pos.y, b1.pos.y);
    if (sx > 0.005 && sy > 0.005) cruces.push([a1, b1]);
  }));
  const ocupaPiso = enPared.filter(m => !esAlto(m)).reduce((t, m) => t + anchoOcupa(m), 0);
  const punto = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current; if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM(); if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: A - p.y }; // y desde el piso
  };
  const quitarPared = () => {
    if (cot.paredes.length <= 1) return;
    if (!confirm(`¿Quitar "${pared.nombre}"? Sus muebles quedan sin ubicar.`)) return;
    setCot(c => ({ ...c, paredes: c.paredes.filter((_, i) => i !== idx),
      muebles: c.muebles.map(m => !m.pos ? m : m.pos.pared === idx ? { ...m, pos: undefined } : m.pos.pared > idx ? { ...m, pos: { ...m.pos, pared: m.pos.pared - 1 } } : m) }));
    setPi(Math.max(0, idx - 1));
  };
  const updPared = (patch: Partial<typeof pared>) => setCot(c => ({ ...c, paredes: c.paredes.map((p, i) => i === idx ? { ...p, ...patch } : p) }));
  const selM = enPared.find(m => m.id === sel);
  const pad = Math.max(0.35, L * 0.06), fs = Math.max(0.06, Math.min(0.14, Math.max(L, A) / 32));
  // Cotas encadenadas: muebles de piso abajo, muebles altos arriba.
  const cadena = (lista: Mueble[]) => {
    const ord = [...lista].sort((a, b) => posDe(a).x - posDe(b).x);
    const seg: { a: number; b: number; hueco: boolean }[] = [];
    let x = 0;
    ord.forEach(m => { const p = posDe(m); if (p.x - x > 0.005) seg.push({ a: x, b: p.x, hueco: true }); seg.push({ a: p.x, b: p.x + anchoOcupa(m), hueco: false }); x = Math.max(x, p.x + anchoOcupa(m)); });
    if (ord.length && L - x > 0.005) seg.push({ a: x, b: L, hueco: true });
    return seg;
  };
  const bajos = enPared.filter(m => posDe(m).y < 0.3), altos = enPared.filter(m => posDe(m).y >= 0.3);
  const Cota = ({ s, y, arriba }: { s: { a: number; b: number; hueco: boolean }; y: number; arriba?: boolean }) => (
    <g>
      <line x1={s.a} x2={s.b} y1={y} y2={y} stroke={s.hueco ? '#f59e0b' : '#64748b'} strokeWidth={fs / 8} />
      <line x1={s.a} x2={s.a} y1={y - fs / 2} y2={y + fs / 2} stroke="#64748b" strokeWidth={fs / 10} />
      <line x1={s.b} x2={s.b} y1={y - fs / 2} y2={y + fs / 2} stroke="#64748b" strokeWidth={fs / 10} />
      {s.b - s.a > fs * 2.2 && <text x={(s.a + s.b) / 2} y={arriba ? y - fs * 0.4 : y + fs * 1.1} fontSize={fs * 0.85} fontWeight={800} fill={s.hueco ? '#b45309' : '#334155'} textAnchor="middle">{f2(s.b - s.a)}</text>}
    </g>
  );

  return (
    <div className="p-3 sm:p-5 space-y-3 max-w-6xl mx-auto">
      {/* Paredes */}
      <div className="bg-white rounded-2xl p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {cot.paredes.map((p, i) => (
            <button key={i} onClick={() => setPi(i)} className={`${btn} ${i === idx ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{p.nombre || `Pared ${i + 1}`}</button>
          ))}
          {cot.paredes.length < 4 && <button onClick={() => { setCot(c => ({ ...c, paredes: [...c.paredes, paredNueva(c.paredes.length)] })); setPi(cot.paredes.length); }}
            className={`${btn} bg-slate-50 border border-dashed border-slate-300 text-slate-600 hover:bg-slate-100`}><Plus className="w-4 h-4" /> Pared</button>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] gap-2 items-end">
          <label className="col-span-2 sm:col-span-1 block text-[10px] font-bold text-slate-500 uppercase">Nombre de la pared
            <input value={pared.nombre} onChange={e => updPared({ nombre: e.target.value })} className={inputTxt} />
          </label>
          <Num label="Largo" value={pared.largo} min={0.5} max={15} onChange={v => updPared({ largo: v })} />
          <Num label="Alto" value={pared.alto} min={1} max={5} onChange={v => updPared({ alto: v })} />
          {cot.paredes.length > 1 && <button onClick={quitarPared} className={`${btn} col-span-2 sm:col-span-1 bg-rose-50 text-rose-700 hover:bg-rose-100`}><Trash2 className="w-4 h-4" /> Quitar pared</button>}
        </div>
        <p className="text-[11px] text-slate-500">Las paredes se unen en esquina: la 2.ª gira a la derecha al final de la 1.ª (en L), la 3.ª vuelve a girar (en U).</p>
      </div>

      {/* Sin ubicar */}
      <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-black text-slate-800 flex-1 min-w-[160px]">{sinUbicar.length ? 'Muebles sin ubicar: toca para ponerlo en esta pared' : cot.muebles.length ? 'Todos los muebles están ubicados.' : 'Aún no tienes muebles.'}</p>
          <select value="" onChange={e => { if (!e.target.value) return; const m = muebleNuevo(e.target.value as TipoMueble, cot.muebles[cot.muebles.length - 1]?.color || 'Blanco'); setCot(c => ({ ...c, muebles: [...c.muebles, m] })); ubicar(m); }}
            className="min-h-[40px] px-2 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold cursor-pointer focus:outline-none max-w-full">
            <option value="">+ Agregar mueble aquí</option>
            {TIPOS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.corto}</option>)}
          </select>
          {enPared.length > 1 && <button onClick={acomodar} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><AlignHorizontalJustifyStart className="w-4 h-4" /> Acomodar en fila</button>}
        </div>
        {(fueraDePared.length > 0 || cruces.length > 0) && (
          <div className="rounded-xl bg-red-50 text-red-800 text-[12px] font-bold px-3 py-2 space-y-0.5">
            {ocupaPiso > L + 0.005 && <p>Los muebles de piso suman {ocupaPiso.toFixed(2)} m y la pared mide {L.toFixed(2)} m: faltan {(ocupaPiso - L).toFixed(2)} m. Agranda la pared, achica algún mueble o pásalo a otra pared.</p>}
            {fueraDePared.map(m => <p key={m.id}>• {nombreDe(m)} se sale de la pared.</p>)}
            {cruces.map(([a1, b1]) => <p key={a1.id + b1.id}>• {nombreDe(a1)} y {nombreDe(b1)} se cruzan: muévelos.</p>)}
          </div>
        )}
        {sinUbicar.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sinUbicar.map(m => (
              <button key={m.id} onClick={() => ubicar(m)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-teal-50 max-w-full`}>
                <span>{tipoDe(m.tipo).emoji}</span><span className="truncate">{nombreMueble(m, cot.muebles.indexOf(m))}</span><Plus className="w-3.5 h-3.5 shrink-0" />
              </button>
            ))}
          </div>
        )}
        {!cot.muebles.length && <button onClick={onMuebles} className={`${btn} bg-teal-600 text-white`}>Ir a Muebles</button>}
      </div>

      {/* Elevación */}
      <div id="mel-pared" className="zona-impresion imprimir-claro bg-white rounded-2xl p-2 sm:p-4 shadow-xs space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
          <h3 className="text-sm font-black text-slate-900">{pared.nombre} · {f2(L)} × {f2(A)} m</h3>
          <div className="no-imprimir"><BotonImprimir objetivo={() => document.getElementById('mel-pared')} titulo={`Pared ${pared.nombre}`} orientacion="landscape" unaHoja etiqueta="Imprimir" /></div>
        </div>
        <svg ref={svgRef} viewBox={`${-pad} ${-pad} ${L + pad * 2} ${A + pad * 2}`} className="w-full h-auto max-h-[65vh] bg-slate-50 rounded-xl select-none" style={{ fontFamily: 'system-ui' }}
          onPointerMove={e => {
            if (!arrastre) return;
            const m = cot.muebles.find(x => x.id === arrastre.id); if (!m) return;
            const p = punto(e);
            setArrastre(a => a && { ...a, ...limitar(m, p.x - a.dx, p.y - a.dy) });
          }}
          onPointerUp={() => { if (arrastre) { fijarPos(arrastre.id, { pared: idx, x: arrastre.x, y: arrastre.y }); setArrastre(null); } }}
          onPointerCancel={() => setArrastre(null)}>
          {/* Cuadrícula cada 10 cm (más marcada cada 50 cm) */}
          {Array.from({ length: Math.floor(L * 10) + 1 }, (_, i) => <line key={`gx${i}`} x1={i / 10} x2={i / 10} y1={0} y2={A} stroke={i % 5 ? '#e2e8f0' : '#cbd5e1'} strokeWidth={i % 5 ? 0.003 : 0.006} />)}
          {Array.from({ length: Math.floor(A * 10) + 1 }, (_, i) => <line key={`gy${i}`} x1={0} x2={L} y1={A - i / 10} y2={A - i / 10} stroke={i % 5 ? '#e2e8f0' : '#cbd5e1'} strokeWidth={i % 5 ? 0.003 : 0.006} />)}
          <rect x={0} y={0} width={L} height={A} fill="none" stroke="#0f172a" strokeWidth={0.02} />
          <line x1={-pad * 0.6} x2={L + pad * 0.6} y1={A} y2={A} stroke="#78716c" strokeWidth={0.035} />
          {/* Muebles */}
          {enPared.map(m => {
            const p = posDe(m), n = Math.max(1, Math.round(m.cantidad || 1));
            return (
              <g key={m.id} data-mueble={m.id} style={{ cursor: arrastre?.id === m.id ? 'grabbing' : 'grab', touchAction: 'none' }}
                onPointerDown={e => { e.preventDefault(); const q = punto(e); try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* sin captura */ } setSel(m.id); setArrastre({ id: m.id, dx: q.x - p.x, dy: q.y - p.y, x: p.x, y: p.y }); }}>
                {Array.from({ length: n }, (_, k) => (
                  <g key={k} transform={`translate(${p.x + k * m.ancho} ${A - p.y - m.alto}) scale(0.001)`}><FrenteSvg m={m} resaltado={sel === m.id && k === 0} /></g>
                ))}
                <text x={p.x + anchoOcupa(m) / 2} y={A - p.y - m.alto - fs * 0.35} fontSize={fs * 0.8} fontWeight={900} fill="#0f766e" textAnchor="middle">{nombreMueble(m, cot.muebles.indexOf(m))}{n > 1 ? ` ×${n}` : ''}</text>
                {p.y > 0.005 && <text x={p.x + anchoOcupa(m) + fs * 0.25} y={A - p.y + fs * 0.1} fontSize={fs * 0.7} fontWeight={800} fill="#475569">↑{f2(p.y)}</text>}
              </g>
            );
          })}
          {cadena(bajos).map((s, i) => <Cota key={`b${i}`} s={s} y={A + pad * 0.5} />)}
          {cadena(altos).map((s, i) => <Cota key={`a${i}`} s={s} y={-pad * 0.45} arriba />)}
          <text x={L / 2} y={A + pad * 0.92} fontSize={fs * 0.8} fontWeight={800} fill="#64748b" textAnchor="middle">{f2(L)} m</text>
        </svg>
        <p className="no-imprimir text-[11px] text-slate-500 px-1">Arrastra cada mueble con el dedo o el mouse (se ajusta cada 1 cm). Abajo: medidas desde la esquina izquierda; en naranja, los espacios libres.</p>
      </div>

      {/* Mueble elegido */}
      {selM && (
        <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2 no-imprimir">
          <p className="text-xs font-black text-slate-800 truncate">{tipoDe(selM.tipo).emoji} {nombreMueble(selM, cot.muebles.indexOf(selM))} · {f2(selM.ancho)} × {f2(selM.alto)} m</p>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_minmax(0,1.4fr)_auto] gap-2 items-end">
            <Num label="Desde la izquierda" value={selM.pos!.x} onChange={v => fijarPos(selM.id, { pared: idx, ...limitar(selM, v, selM.pos!.y) })} />
            <Num label="Altura desde el piso" value={selM.pos!.y} onChange={v => fijarPos(selM.id, { pared: idx, ...limitar(selM, selM.pos!.x, v) })} />
            {cot.paredes.length > 1 ? (
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Pasar a
                <select value={idx} onChange={e => { const j = Number(e.target.value); fijarPos(selM.id, { pared: j, x: 0, y: selM.pos!.y }); setPi(j); }} className={`${inputTxt} cursor-pointer`}>
                  {cot.paredes.map((p, i) => <option key={i} value={i}>{p.nombre || `Pared ${i + 1}`}</option>)}
                </select>
              </label>
            ) : <span className="hidden sm:block" />}
            <button onClick={() => fijarPos(selM.id, undefined)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><X className="w-4 h-4" /> Sacar de la pared</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3. Vista 3D ─────────────────────────────────────────────────────────────
function Vista3D({ cot, sel, setSel, onDisenar }: { cot: CotizacionMelamina; sel: string | null; setSel: (id: string) => void; onDisenar: () => void }) {
  const ubicados = cot.muebles.filter(m => m.pos && m.pos.pared < cot.paredes.length);
  const sinUbicar = cot.muebles.length - ubicados.length;
  if (!cot.muebles.length) return <p className="p-8 text-center text-sm text-slate-400">Agrega muebles en “Muebles” para verlos en 3D.</p>;
  return (
    <div className="h-full min-h-[480px] flex flex-col gap-2 sm:gap-3 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center gap-2 shrink-0">
        {ubicados.length === 0 ? (
          <>
            <label className="text-[11px] font-bold text-slate-500">Mueble
              <select value={sel || cot.muebles[0].id} onChange={e => setSel(e.target.value)} className="ml-2 min-h-[40px] px-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-800 cursor-pointer focus:outline-none max-w-[60vw]">
                {cot.muebles.map((m, i) => <option key={m.id} value={m.id}>{nombreMueble(m, i)}</option>)}
              </select>
            </label>
            <p className="flex-1 min-w-[180px] text-[11px] text-slate-500">Ubica los muebles en las paredes (Diseñador) para ver el ambiente completo.</p>
          </>
        ) : (
          <p className="flex-1 min-w-[180px] text-[11px] font-bold text-slate-600">{cot.paredes.length} pared{cot.paredes.length > 1 ? 'es' : ''} · {ubicados.length} mueble{ubicados.length > 1 ? 's' : ''}{sinUbicar ? ` · ${sinUbicar} sin ubicar (no se ven)` : ''}</p>
        )}
        <button onClick={onDisenar} className={`${btn} bg-teal-50 text-teal-700 hover:bg-teal-100`}><LayoutTemplate className="w-4 h-4" /> Diseñador</button>
      </div>
      <div className="flex-1 min-h-[360px]">
        <Suspense fallback={<div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Cargando 3D…</div>}>
          <Melamina3D muebles={cot.muebles} paredes={cot.paredes} selId={sel} />
        </Suspense>
      </div>
    </div>
  );
}

// ── 4. Despiece y plano de cortes ───────────────────────────────────────────
const COLORES_PIEZA = ['#ccfbf1', '#e0f2fe', '#fef3c7', '#fce7f3', '#ede9fe', '#dcfce7', '#ffedd5', '#e2e8f0'];
const metros = (mmV: number) => mmV ? `${(mmV / 1000).toFixed(2)} m` : '—';

function Despiece({ cot, setCot, r, onMuebles }: { cot: CotizacionMelamina; setCot: SetCot; r: MetradoMelamina; onMuebles: () => void }) {
  const hojaRef = useRef<HTMLDivElement>(null);
  if (!cot.muebles.length) return (
    <div className="p-8 text-center space-y-3"><p className="text-sm text-slate-400">Agrega muebles para ver la lista de cortes.</p>
      <button onClick={onMuebles} className={`${btn} bg-teal-600 text-white`}>Ir a Muebles</button></div>
  );
  const colorDeMueble = new Map(cot.muebles.map((m, i) => [nombreMueble(m, i), COLORES_PIEZA[i % COLORES_PIEZA.length]]));
  const porMueble = cot.muebles.map((m, i) => ({ m, i, piezas: r.piezas.filter(p => p.mueble === m.id) }));
  const Tabla = ({ piezas }: { piezas: Pieza[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[460px]">
        <thead>
          <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
            <th className="text-left py-1.5 font-black">Pieza</th>
            <th className="text-right py-1.5 font-black">Largo</th>
            <th className="text-right py-1.5 font-black">Ancho</th>
            <th className="text-right py-1.5 font-black">Cant.</th>
            <th className="text-left py-1.5 pl-3 font-black">Tapacanto (por pieza)</th>
          </tr>
        </thead>
        <tbody>
          {piezas.map(p => (
            <tr key={p.id} className="border-b border-slate-100">
              <td className="py-1.5 font-bold text-slate-700">{p.nombre}{p.nota ? <span className="font-normal text-slate-400"> · {p.nota}</span> : ''}</td>
              <td className="py-1.5 text-right font-mono font-bold text-slate-800">{p.largo}</td>
              <td className="py-1.5 text-right font-mono font-bold text-slate-800">{p.ancho}</td>
              <td className="py-1.5 text-right font-mono font-bold text-slate-800">{p.cant}</td>
              <td className="py-1.5 pl-3 text-slate-500">{p.canto.gruesoMm ? `grueso ${metros(p.canto.gruesoMm)}` : ''}{p.canto.gruesoMm && p.canto.delgadoMm ? ' · ' : ''}{p.canto.delgadoMm ? `delgado ${metros(p.canto.delgadoMm)}` : ''}{!p.canto.gruesoMm && !p.canto.delgadoMm ? '—' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="p-3 sm:p-5 space-y-3 max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl p-3 shadow-xs flex flex-wrap items-center gap-2 no-imprimir">
        <label className="inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-700 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-teal-600" checked={cot.respetarVeta} onChange={e => setCot(c => ({ ...c, respetarVeta: e.target.checked }))} /> Respetar la veta (no girar piezas)
        </label>
        <div className="flex-1" />
        <BotonImprimir objetivo={() => hojaRef.current} titulo={`Despiece ${cot.nombre || 'melamina'}`} etiqueta="Imprimir / PDF" />
      </div>
      {r.sobredimensionadas > 0 && (
        <p className="text-[11px] font-bold text-rose-800 bg-rose-50 rounded-xl px-3 py-2">⚠ {r.sobredimensionadas} pieza(s) son más grandes que el tablero y no están en el plano de cortes. Revisa los avisos del mueble (divídelo en dos cuerpos).</p>
      )}
      <div ref={hojaRef} className="zona-impresion imprimir-claro bg-white rounded-2xl p-3 sm:p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-900">Lista de cortes{cot.nombre ? ` · ${cot.nombre}` : ''}</h3>
            <p className="text-[11px] text-slate-500">Medidas en milímetros (mm). Tablero {TABLERO_L} × {TABLERO_A} mm, melamina 18 mm · fondo HDF 3 mm · disco 4 mm · refile {REFILE} mm por borde.</p>
          </div>
          <p className="text-xs font-black text-teal-700">{r.nTableros} tableros · tapacanto {r.cantoGruesoM} m grueso + {r.cantoDelgadoM} m delgado</p>
        </div>
        {porMueble.map(({ m, i, piezas }) => (
          <div key={m.id} className="space-y-1.5 break-inside-avoid">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2"><span className="w-3 h-3 rounded-sm border border-slate-300 shrink-0" style={{ background: COLORES_PIEZA[i % COLORES_PIEZA.length] }} />{nombreMueble(m, i)} <span className="font-semibold text-slate-500 text-xs truncate">· {f2(m.ancho)} × {f2(m.alto)} × {f2(m.prof)} m · {m.color}{m.cantidad > 1 ? ` · ×${m.cantidad}` : ''}</span></h4>
            {(['melamina', 'hdf'] as const).map(mat => { const ps = piezas.filter(p => p.material === mat); return ps.length ? (
              <div key={mat}>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-1">{mat === 'melamina' ? `Melamina 18 mm ${m.color}` : 'HDF 3 mm'}</p>
                <Tabla piezas={ps} />
              </div>
            ) : null; })}
          </div>
        ))}

        <h3 className="text-base font-black text-slate-900 pt-2 border-t border-slate-200">Plano de cortes</h3>
        {r.tableros.map(g => g.resultado.tableros.map((t, ti) => (
          <div key={`${g.clave}-${g.color}-${ti}`} className="space-y-1 break-inside-avoid">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-black text-slate-800">{g.material === 'melamina' ? `Melamina ${g.color}` : 'HDF 3 mm'} · tablero {ti + 1} de {g.resultado.tableros.length}</p>
              <p className={`text-[11px] font-bold ${t.usoPct >= 70 ? 'text-emerald-700' : t.usoPct >= 40 ? 'text-amber-700' : 'text-slate-500'}`}>uso {t.usoPct}% · {t.piezas.length} piezas</p>
            </div>
            <svg viewBox={`-20 -20 ${TABLERO_L + 40} ${TABLERO_A + 40}`} className="w-full h-auto bg-white" style={{ fontFamily: 'system-ui' }}>
              <rect x={0} y={0} width={TABLERO_L} height={TABLERO_A} fill={g.material === 'hdf' ? '#d6c4a8' : colorMelamina(g.color).hex} fillOpacity={0.35} stroke="#0f172a" strokeWidth={6} />
              <rect x={REFILE} y={REFILE} width={TABLERO_L - 2 * REFILE} height={TABLERO_A - 2 * REFILE} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="12 8" />
              {t.piezas.map(p => {
                const fsz = Math.max(26, Math.min(70, Math.min(p.w, p.h) * 0.2));
                const vertical = p.h > p.w * 1.6 && p.w < 260;
                const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
                const largo = p.rotada ? p.h : p.w, ancho = p.rotada ? p.w : p.h;
                return (
                  <g key={p.id}>
                    <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={colorDeMueble.get(p.mueble) || '#e2e8f0'} stroke="#334155" strokeWidth={3} />
                    {Math.min(p.w, p.h) > 60 && (
                      <g transform={vertical ? `rotate(-90 ${cx} ${cy})` : undefined}>
                        <text x={cx} y={cy - fsz * 0.25} fontSize={fsz} fontWeight={800} fill="#0f172a" textAnchor="middle">{p.nombre}{p.rotada ? ' ↻' : ''}</text>
                        <text x={cx} y={cy + fsz * 0.95} fontSize={fsz * 0.85} fill="#334155" textAnchor="middle">{largo} × {ancho}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )))}
        <p className="text-[10px] text-slate-400">↻ = pieza girada en el tablero. Los colores indican a qué mueble pertenece cada pieza. Las medidas no incluyen el tapacanto: pide al local que lo descuente si usa canto grueso.</p>
      </div>
    </div>
  );
}

// ── 5. Presupuesto ──────────────────────────────────────────────────────────
function Presupuesto({ cot, setCot, r, onIrAPrecios }: { cot: CotizacionMelamina; setCot: SetCot; r: MetradoMelamina; onIrAPrecios?: () => void }) {
  const { datos } = useEmpresa();
  const hojaRef = useRef<HTMLDivElement>(null);
  const directo = r.materiales + r.manoObra;
  const gg = directo * cot.gg / 100, util = directo * cot.util / 100, total = directo + gg + util;
  const sinPrecio = r.lineas.some(l => l.precio === 0) || (r.dias > 0 && r.manoObra === 0);
  const vacio = cot.muebles.length === 0;
  const notas = [...new Set(cot.muebles.map(m => tipoDe(m.tipo).nota).filter(Boolean))] as string[];
  const whatsapp = () => {
    const lineas = [
      `*Presupuesto de muebles de melamina*${cot.nombre ? ` – ${cot.nombre}` : ''}`,
      cot.cliente ? `Cliente: ${cot.cliente}` : '',
      datos.nombre ? `De: ${datos.nombre}${datos.telefono ? ` (${datos.telefono})` : ''}` : '',
      '',
      ...cot.muebles.map((m, i) => `${nombreMueble(m, i)}: ${f2(m.ancho)} × ${f2(m.alto)} × ${f2(m.prof)} m, ${m.color}${m.cantidad > 1 ? ` (×${m.cantidad})` : ''}`),
      '',
      `Materiales y herrajes: ${S(r.materiales)}`,
      `Fabricación e instalación (${f2(r.dias)} días): ${S(r.manoObra)}`,
      `*Total: ${S(total)}*`,
      ...notas.map(n => `Nota: ${n}`),
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
    window.open(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank');
  };
  const chk = 'inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-600 cursor-pointer bg-white rounded-xl px-3 shadow-xs';

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 no-imprimir">
        <label className={chk}><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={cot.incluirCorte} onChange={e => setCot(c => ({ ...c, incluirCorte: e.target.checked }))} /> Servicio de corte</label>
        <label className={chk}><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={cot.incluirEnchape} onChange={e => setCot(c => ({ ...c, incluirEnchape: e.target.checked }))} /> Servicio de enchape</label>
        <div className="flex-1" />
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <button onClick={whatsapp} disabled={vacio} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40`}><Send className="w-4 h-4" /> WhatsApp</button>
        <BotonImprimir objetivo={() => hojaRef.current} titulo="Presupuesto de melamina" etiqueta="Imprimir / PDF" />
      </div>
      {sinPrecio && !vacio && (
        <p className="no-imprimir text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
          Hay productos sin precio (en naranja). Escríbelos en Precios → “Melamina y herrajes” y el jornal “Carpintero de melamina”.
        </p>
      )}
      <div ref={hojaRef} className="zona-impresion imprimir-claro bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <BandaMarca />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <CabeceraEmpresa subtitulo="Presupuesto de muebles de melamina a medida" />
          <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
            <p className="font-bold text-slate-700">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            {cot.nombre && <p>Obra: {cot.nombre}</p>}
            {cot.cliente && <p>Cliente: {cot.cliente}</p>}
          </div>
        </div>
        {vacio && <p className="py-10 text-center text-sm text-slate-400">Agrega muebles en “Muebles” para ver el presupuesto.</p>}
        {!vacio && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Muebles</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {cot.muebles.map((m, i) => (
                <div key={m.id} className="flex flex-nowrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 break-inside-avoid">
                  <div className="w-12 h-12 shrink-0"><DibujoMueble m={m} className="w-full h-full" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{nombreMueble(m, i)}{m.cantidad > 1 ? ` (×${m.cantidad})` : ''}</p>
                    <p className="text-[10px] text-slate-500">{f2(m.ancho)} × {f2(m.alto)} × {f2(m.prof)} m · {m.color}</p>
                    <p className="text-[10px] text-slate-500">{[m.puertas && m.puertaTipo !== 'ninguna' ? `${m.puertas} ${m.puertaTipo === 'corrediza' ? 'hojas corredizas' : 'puertas'}` : '', m.cajones ? `${m.cajones} cajones` : '', m.repisas ? `${m.repisas} repisas` : '', m.colgador ? 'colgador' : ''].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase pt-1">Materiales, herrajes y mano de obra</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
                    <th className="text-left py-1.5 font-black">Descripción</th>
                    <th className="text-left py-1.5 font-black">Cálculo</th>
                    <th className="text-right py-1.5 font-black">Cant.</th>
                    <th className="text-left py-1.5 pl-2 font-black">Und.</th>
                    <th className="text-right py-1.5 font-black">P. unit.</th>
                    <th className="text-right py-1.5 font-black">Parcial</th>
                  </tr>
                </thead>
                <tbody>
                  {r.lineas.map((l, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1.5 font-bold text-slate-700">{l.nombre}</td>
                      <td className="py-1.5 text-slate-400">{l.nota}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.cant}</td>
                      <td className="py-1.5 pl-2 text-slate-500">{l.unidad}</td>
                      <td className={`py-1.5 text-right font-mono ${l.precio ? 'text-slate-600' : 'text-amber-600'}`}>{l.precio.toFixed(2)}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 font-bold text-slate-700">Fabricación e instalación (carpintero de melamina)</td>
                    <td className="py-1.5 text-slate-400">{f2(r.m2Melamina)} m² ÷ 6 + ½ día por mueble</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{r.dias}</td>
                    <td className="py-1.5 pl-2 text-slate-500">día</td>
                    <td className={`py-1.5 text-right font-mono ${r.manoObra ? 'text-slate-600' : 'text-amber-600'}`}>{r.dias ? (r.manoObra / r.dias).toFixed(2) : '0.00'}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{r.manoObra.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!vacio && (
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-1 text-xs">
              <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Materiales y herrajes</span><span className="font-mono font-bold">{S(r.materiales)}</span></div>
              <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Mano de obra ({f2(r.dias)} días)</span><span className="font-mono font-bold">{S(r.manoObra)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Gastos generales
                <input type="number" min={0} value={cot.gg} onChange={e => setCot(c => ({ ...c, gg: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(gg)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Utilidad
                <input type="number" min={0} value={cot.util} onChange={e => setCot(c => ({ ...c, util: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(util)}</span></div>
              <div className="flex flex-nowrap justify-between gap-2 bg-teal-600 text-white rounded-xl px-3 py-2 mt-1"><span className="font-black uppercase">Total</span><span className="font-mono font-black">{S(total)}</span></div>
            </div>
          </div>
        )}
        {!vacio && <CondicionesComerciales total={total} />}
        {!vacio && (
          <div className="text-[10px] text-slate-400 space-y-0.5">
            <p>Tableros de melamina 18 mm de 2.44 × 2.15 m contados con el plano de cortes ({r.nTableros} en total). Tapacanto +10 %. Herrajes estándar (bisagras de cazoleta, correderas telescópicas).</p>
            {notas.map(n => <p key={n}>• {n}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
