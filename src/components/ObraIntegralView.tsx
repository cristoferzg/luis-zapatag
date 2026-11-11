// =============================================================================
// Presupuesto de obra: junta lo cotizado en cada apartado (Obra Civil, Techos,
// Drywall, Melamina, Gasfitería, Electricidad, CarpiMetal…) en UN presupuesto
// para el cliente, con su cronograma (Gantt) y forma de pago.
//   1. Resumen: datos de la obra, un recuadro por apartado (incluir / abrir), totales y pagos.
//   2. Cronograma: barras por apartado con días hábiles, orden y dependencias.
//   3. Presupuesto: documento formal para imprimir o enviar por WhatsApp.
// Solo LEE lo de cada apartado (ver obraIntegral/fuentes.ts); guarda aparte en "obra_integral_*".
// =============================================================================
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ClipboardList, LayoutGrid, CalendarRange, FileText, Save, FolderOpen, FilePlus2, Copy, Trash2, Send, ExternalLink, ChevronDown, ChevronUp,
  RefreshCw, Plus, GripVertical, ArrowUp, ArrowDown, AlertTriangle, CalendarDays, Lock, X, RotateCcw,
} from 'lucide-react';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { CabeceraEmpresa, useEmpresa, BandaMarca, CondicionesComerciales, condicionesDe } from '../lib/empresa';
import BotonImprimir from './common/BotonImprimir';
import { simb } from '../lib/currency';
import { FUENTES, fuenteDe, leerFuentes, Lectura } from './obraIntegral/fuentes';
import {
  PresupuestoObra, PagoObra, TareaCrono, KEY_ACTUAL, KEY_LISTA, KEY_PESTANA, leerActual, leerLista, normalizar, presupuestoVacio, uidObra,
  calcular, cronograma, fechaPago, fechaCorta, fechaLarga, fechaHabil,
} from './obraIntegral/modelo';
import Gantt from './obraIntegral/Gantt';
import InputNumero from './common/InputNumero';

const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fn = (n: number) => n.toLocaleString('es-PE', { maximumFractionDigits: 2 });
type Pestana = 'resumen' | 'cronograma' | 'presupuesto';
const PESTANAS: Pestana[] = ['resumen', 'cronograma', 'presupuesto'];
type SetP = (f: (p: PresupuestoObra) => PresupuestoObra) => void;
const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-default';
const inputTxt = 'mt-1 w-full min-h-[40px] px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 normal-case focus:outline-none focus:ring-2 focus:ring-indigo-200';
const inputNum = 'min-h-[36px] w-16 px-2 rounded-lg border border-slate-200 bg-white text-right font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200';
const abrir = (vista?: string) => { if (vista) window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: vista })); };

export default function ObraIntegralView() {
  const [pestana, setPestana] = useState<Pestana>(() => {
    const v = safeStorage.getItem<string>(KEY_PESTANA, 'resumen');
    return (PESTANAS.includes(v as Pestana) ? v : 'resumen') as Pestana;
  });
  useEffect(() => { safeStorage.setItem(KEY_PESTANA, pestana); }, [pestana]);
  const { datos: empresa } = useEmpresa();
  const [p, setPRaw] = useState<PresupuestoObra>(() => {
    const raw = safeStorage.getItem<PresupuestoObra | null>(KEY_ACTUAL, null);
    return raw ? leerActual() : presupuestoVacio(condicionesDe(empresa).adelantoPct);
  });
  useEffect(() => { safeStorage.setItem(KEY_ACTUAL, p); }, [p]);
  const setP: SetP = f => setPRaw(x => f(x));

  // Lo de cada apartado (en vivo). Se relee al volver a la app y al cambiar precios.
  const catalogo = useCatalogo();
  const [vivo, setVivo] = useState<Record<string, Lectura> | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const releer = useCallback(() => { setLeyendo(true); leerFuentes().then(setVivo).finally(() => setLeyendo(false)); }, []);
  useEffect(() => { releer(); }, [releer, catalogo]);
  useEffect(() => {
    const vis = () => { if (document.visibilityState === 'visible') releer(); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [releer]);
  const lecturas = p.foto || vivo || {};
  const calc = useMemo(() => calcular(p, lecturas), [p, lecturas]);
  const crono = useMemo(() => cronograma(p, lecturas, new Set(calc.incl.map(s => s.id))), [p, lecturas, calc.incl]);

  const tabs: { id: Pestana; label: string; corto: string; icon: any }[] = [
    { id: 'resumen', label: 'Resumen', corto: 'Resumen', icon: LayoutGrid },
    { id: 'cronograma', label: 'Cronograma', corto: 'Cronograma', icon: CalendarRange },
    { id: 'presupuesto', label: 'Presupuesto', corto: 'Presup.', icon: FileText },
  ];
  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-row flex-nowrap items-center justify-center lg:justify-between gap-2 lg:gap-3 mb-3 sm:mb-4">
        <div className="hidden lg:flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600"><ClipboardList className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">Presupuesto de obra</h2>
            <p className="text-[11px] text-slate-500">Junta lo cotizado en cada apartado en un solo presupuesto, con cronograma y forma de pago.</p>
          </div>
        </div>
        <div className="flex flex-nowrap w-full lg:w-auto lg:inline-flex p-0.5 lg:p-1 bg-slate-100 rounded-xl gap-0.5 lg:shrink-0">
          {tabs.map(t => {
            const Ic = t.icon;
            return (
              <button key={t.id} onClick={() => setPestana(t.id)} title={t.label}
                className={`flex-1 lg:flex-none min-w-0 min-h-[40px] flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 px-1 lg:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer ${pestana === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                <Ic className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-600 shrink-0" /><span className="hidden lg:inline">{t.label}</span><span className="lg:hidden truncate max-w-full">{t.corto}</span>
              </button>
            );
          })}
        </div>
      </div>
      {p.foto && (
        <div className="mb-3 rounded-2xl bg-amber-50 border border-amber-200 px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="flex-1 min-w-[180px] font-bold text-amber-900">Montos guardados el {p.fotoFecha || '—'}. Si cambiaste algo en los apartados, actualízalo.</span>
          <button onClick={() => { setP(x => ({ ...x, foto: undefined, fotoFecha: undefined })); releer(); }} className={`${btn} bg-white text-amber-800 border border-amber-200`}><RefreshCw className="w-4 h-4" /> Usar lo actual</button>
        </div>
      )}
      {pestana === 'resumen' && <Resumen p={p} setP={setP} calc={calc} crono={crono} cargando={!vivo && !p.foto} leyendo={leyendo} onReleer={releer} vivo={vivo} onCronograma={() => setPestana('cronograma')} onPresupuesto={() => setPestana('presupuesto')} />}
      {pestana === 'cronograma' && <Cronograma p={p} setP={setP} crono={crono} hayApartados={calc.incl.length > 0} onResumen={() => setPestana('resumen')} />}
      {pestana === 'presupuesto' && <Documento p={p} setP={setP} calc={calc} crono={crono} />}
    </div>
  );
}

type Calc = ReturnType<typeof calcular>;
type Crono = ReturnType<typeof cronograma>;

// ── Mis presupuestos (guardar, abrir, nueva, duplicar) ─────────────────────
function BarraGuardar({ p, setP, vivo }: { p: PresupuestoObra; setP: SetP; vivo: Record<string, Lectura> | null }) {
  const { datos } = useEmpresa();
  const [lista, setLista] = useState<PresupuestoObra[]>(leerLista);
  const [verLista, setVerLista] = useState(false);
  const [aviso, setAviso] = useState('');
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 2500); };
  const guardar = () => {
    const ahora = new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
    const nueva: PresupuestoObra = { ...p, actualizado: ahora, foto: p.foto || vivo || undefined, fotoFecha: p.foto ? p.fotoFecha : ahora };
    const l = [nueva, ...lista.filter(x => x.id !== p.id)];
    safeStorage.setItem(KEY_LISTA, l); setLista(l); setP(() => nueva);
    avisar('✓ Guardado en Mis presupuestos');
  };
  const duplicar = () => { setP(x => ({ ...x, id: uidObra(), nombre: `${x.nombre || 'Presupuesto'} (copia)`, actualizado: undefined })); avisar('✓ Copia creada: guárdala para tenerla en la lista'); };
  const nueva = () => { if (confirm('¿Empezar un presupuesto de obra nuevo? El actual sigue en Mis presupuestos si lo guardaste.')) setP(() => presupuestoVacio(condicionesDe(datos).adelantoPct)); };
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={guardar} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}><Save className="w-4 h-4" /> Guardar</button>
        <button onClick={() => setVerLista(v => !v)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Mis presupuestos</span><span className="sm:hidden">Mis presup.</span> ({lista.length})</button>
        <button onClick={nueva} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FilePlus2 className="w-4 h-4" /> Nueva</button>
        <button onClick={duplicar} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Copy className="w-4 h-4" /> Duplicar</button>
        {aviso && <span className="text-xs font-bold text-emerald-700">{aviso}</span>}
      </div>
      {verLista && (
        <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
          {lista.length === 0 && <p className="p-3 text-xs text-slate-400">Aún no guardaste presupuestos de obra.</p>}
          {lista.map(c => (
            <div key={c.id} className="flex flex-nowrap items-center gap-2 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{c.nombre || 'Sin nombre'}{c.cliente ? ` · ${c.cliente}` : ''}</p>
                <p className="text-[11px] text-slate-400 truncate">{Object.values(c.foto || {}).filter(l => !l.vacio).length} apartados · {c.actualizado || ''}</p>
              </div>
              <button onClick={() => { setP(() => normalizar(c)); setVerLista(false); }} className={`${btn} bg-white text-indigo-700 hover:bg-indigo-50 shrink-0`}>Abrir</button>
              <button onClick={() => { if (confirm('¿Borrar este presupuesto?')) { const l = lista.filter(x => x.id !== c.id); safeStorage.setItem(KEY_LISTA, l); setLista(l); } }} title="Borrar"
                className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── 1. Resumen ─────────────────────────────────────────────────────────────
function Resumen({ p, setP, calc, crono, cargando, leyendo, onReleer, vivo, onCronograma, onPresupuesto }: {
  p: PresupuestoObra; setP: SetP; calc: Calc; crono: Crono; cargando: boolean; leyendo: boolean; onReleer: () => void; vivo: Record<string, Lectura> | null;
  onCronograma: () => void; onPresupuesto: () => void;
}) {
  const conDatos = new Set(calc.secciones.map(s => s.id));
  const sinDatos = FUENTES.filter(f => !conDatos.has(f.id));
  const campo = (k: 'nombre' | 'cliente' | 'direccion', label: string, ph: string) => (
    <label className="block text-[10px] font-bold text-slate-500 uppercase min-w-0">{label}
      <input value={p[k]} onChange={e => setP(x => ({ ...x, [k]: e.target.value }))} placeholder={ph} className={inputTxt} />
    </label>
  );
  // Sugerencia: el cliente y el nombre que ya se escribieron en algún apartado.
  const sugerido = calc.secciones.map(s => s.lectura).find(l => l.cliente || l.trabajo);
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-5 xl:items-start space-y-4 xl:space-y-0">
      <div className="space-y-4 min-w-0">
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {campo('nombre', 'Nombre de la obra', 'Ej. Casa de 2 pisos – Los Olivos')}
            {campo('cliente', 'Cliente', 'Nombre del cliente')}
            {campo('direccion', 'Dirección de la obra', 'Av. / Calle, distrito')}
          </div>
          {!p.nombre && !p.cliente && sugerido && (
            <button onClick={() => setP(x => ({ ...x, nombre: x.nombre || sugerido.trabajo || '', cliente: x.cliente || sugerido.cliente || '' }))}
              className="text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-lg px-2.5 py-1.5 cursor-pointer">Usar “{[sugerido.trabajo, sugerido.cliente].filter(Boolean).join(' · ')}”</button>
          )}
          <BarraGuardar p={p} setP={setP} vivo={vivo} />
        </div>

        <div className="flex items-center gap-2 px-1">
          <h3 className="text-xs font-black uppercase text-slate-500 flex-1">Apartados de la obra</h3>
          {!p.foto && <button onClick={onReleer} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 cursor-pointer min-h-[32px]"><RefreshCw className={`w-3.5 h-3.5 ${leyendo ? 'animate-spin' : ''}`} /> Actualizar</button>}
        </div>
        {cargando && <div className="bg-white rounded-2xl p-6 shadow-xs text-center text-xs text-slate-400">Leyendo los apartados…</div>}
        {!cargando && calc.secciones.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-xs text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><ClipboardList className="w-6 h-6" /></div>
            <p className="text-sm font-bold text-slate-700">Aún no hay nada cotizado en los apartados.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">Diseña en Obra Civil, Techos, Drywall, Melamina, Gasfitería o Electricidad: lo que tengas abierto allá aparece aquí solo.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {calc.secciones.map(s => <TarjetaSeccion key={s.id} s={s} p={p} setP={setP} factor={p.base === 'directo' ? calc.factorVenta : 1} />)}
        </div>
        {!cargando && sinDatos.length > 0 && (
          <div className="bg-white/70 rounded-2xl p-3 shadow-xs">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Sin cotizar todavía</p>
            <div className="flex flex-wrap gap-1.5">
              {sinDatos.map(f => {
                const Ic = f.icono;
                return (
                  <button key={f.id} onClick={() => abrir(f.vista)} className="inline-flex items-center gap-1.5 min-h-[34px] px-2.5 rounded-lg bg-slate-50 text-[11px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer">
                    <Ic className="w-3.5 h-3.5" style={{ color: f.color }} />{f.nombre}<Plus className="w-3 h-3 text-slate-300" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 xl:sticky xl:top-4">
        <Totales p={p} setP={setP} calc={calc} />
        <FormaPago p={p} setP={setP} total={calc.total} crono={crono} />
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><CalendarDays className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase text-slate-400">Plazo de ejecución</p>
              <p className="text-sm font-black text-slate-800">{crono.totalDias ? `${crono.totalDias} días hábiles` : '—'}{crono.totalDias > 0 && <span className="text-[11px] font-bold text-rose-600"> · entrega {fechaCorta(crono.entrega)}</span>}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onCronograma} className={`${btn} bg-slate-100 text-slate-700`}><CalendarRange className="w-4 h-4" /> Cronograma</button>
            <button onClick={onPresupuesto} disabled={!calc.incl.length} className={`${btn} bg-indigo-600 text-white`}><FileText className="w-4 h-4" /> Ver presupuesto</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Interruptor({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="inline-flex items-center gap-1.5 min-h-[36px] cursor-pointer shrink-0">
      <span className={`relative w-9 h-5 rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
      <span className={`text-[11px] font-bold ${on ? 'text-indigo-700' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
}

function TarjetaSeccion({ s, p, setP, factor }: { s: Calc['secciones'][number]; p: PresupuestoObra; setP: SetP; factor: number }) {
  const f = fuenteDe(s.id)!;
  const Ic = f.icono;
  const [ver, setVer] = useState(false);
  const l = s.lectura;
  const omitidas = s.partidas.filter(x => x.omitida);
  return (
    <div className={`bg-white rounded-2xl shadow-xs border-l-4 p-3 sm:p-4 flex flex-col gap-2 min-w-0 transition-opacity ${s.incluida ? '' : 'opacity-60'}`} style={{ borderLeftColor: f.color }}>
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}1a`, color: f.color }}><Ic className="w-5 h-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900 leading-tight">{f.nombre}</p>
          {l.trabajo && <p className="text-[11px] font-bold text-slate-500 truncate">{l.trabajo}</p>}
        </div>
        <Interruptor on={s.incluida} onChange={v => setP(x => ({ ...x, incluir: { ...x.incluir, [s.id]: v } }))} label="Incluir" />
      </div>
      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{l.resumen}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-400">{p.base === 'directo' ? 'Costo directo' : 'Precio del apartado'}</p>
          <p className="text-lg font-black text-slate-900 font-mono leading-tight">{S(s.monto)}</p>
          {p.base === 'directo' && s.incluida && factor > 1 && <p className="text-[10px] text-slate-400">al cliente ≈ {S(s.monto * factor)}</p>}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-slate-400">Plazo</p>
          <p className="text-sm font-black text-slate-700">{fn(l.dias)} d{l.diasEstimados ? <span className="text-[10px] font-bold text-slate-400"> (est.)</span> : ''}</p>
        </div>
      </div>
      {s.monto === 0 && <p className="text-[10px] font-bold text-amber-800 bg-amber-50 rounded-lg px-2 py-1">Este apartado tiene productos sin precio: ábrelo y completa sus precios (Precios).</p>}
      {omitidas.length > 0 && s.incluida && (
        <p className="text-[10px] font-bold text-amber-800 bg-amber-50 rounded-lg px-2 py-1">No se repite: {omitidas.length} línea(s) ya cotizada(s) en {[...new Set(omitidas.map(o => o.omitida))].join(' y ')}.</p>
      )}
      {(l.avisos || []).map((a, i) => <p key={i} className="text-[10px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1">{a}</p>)}
      <div className="flex items-center gap-2 pt-1 mt-auto">
        <button onClick={() => setVer(v => !v)} className="inline-flex items-center gap-1 min-h-[36px] text-[11px] font-bold text-slate-500 cursor-pointer">
          {ver ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {s.partidas.length} partida(s)
        </button>
        <div className="flex-1" />
        <button onClick={() => abrir(f.vista)} className="inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-lg bg-slate-50 text-[11px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"><ExternalLink className="w-3.5 h-3.5" /> Abrir apartado</button>
      </div>
      {ver && (
        <div className="rounded-xl bg-slate-50 divide-y divide-slate-100 text-[11px]">
          {s.partidas.map((x, i) => (
            <div key={i} className={`flex items-start gap-2 px-2.5 py-1.5 ${x.omitida ? 'text-slate-400' : 'text-slate-700'}`}>
              <span className={`flex-1 min-w-0 ${x.omitida ? 'line-through' : ''}`}>{x.descripcion}{x.cantidad !== undefined && <span className="text-slate-400"> · {fn(x.cantidad)} {x.unidad || ''}</span>}</span>
              <span className="font-mono font-bold shrink-0">{x.omitida ? `en ${x.omitida}` : f2(x.subtotal)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Totales({ p, setP, calc }: { p: PresupuestoObra; setP: SetP; calc: Calc }) {
  const fila = (l: ReactNode, v: number, cls = '') => (
    <div className={`flex flex-nowrap items-center justify-between gap-2 min-h-[32px] ${cls}`}><span className="text-slate-500 font-bold min-w-0">{l}</span><span className="font-mono font-bold text-slate-800 shrink-0">{S(v)}</span></div>
  );
  const pct = (k: 'gg' | 'util') => (
    <InputNumero type="number" min={0} inputMode="decimal" value={p[k]} onChange={e => setP(x => ({ ...x, [k]: Math.max(0, parseFloat(e.target.value) || 0) }))} className={`${inputNum} ml-1.5 w-14`} />
  );
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase text-slate-900">Totales</h3>
        <span className="text-[10px] font-bold text-slate-400">{calc.incl.length} apartado(s)</span>
      </div>
      <div className="grid grid-cols-2 p-0.5 bg-slate-100 rounded-xl gap-0.5">
        {([['directo', 'Costo directo + GG y utilidad'], ['venta', 'Precio de cada apartado']] as const).map(([k, t]) => (
          <button key={k} onClick={() => setP(x => ({ ...x, base: k }))} className={`min-h-[36px] px-2 rounded-lg text-[11px] font-bold leading-tight cursor-pointer ${p.base === k ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'}`}>{t}</button>
        ))}
      </div>
      <div className="text-xs divide-y divide-slate-100">
        {calc.incl.map(s => fila(<span className="inline-flex items-center gap-1.5 truncate"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: fuenteDe(s.id)!.color }} />{fuenteDe(s.id)!.nombre}</span>, s.monto, 'text-[11px]'))}
      </div>
      <div className="text-xs space-y-0.5 border-t border-slate-200 pt-2">
        {fila(p.base === 'directo' ? 'Costo directo' : 'Suma de apartados', calc.directo)}
        {p.base === 'directo' ? (
          <>
            {fila(<span className="inline-flex items-center">Gastos generales {pct('gg')} %</span>, calc.gg)}
            {fila(<span className="inline-flex items-center">Utilidad {pct('util')} %</span>, calc.util)}
          </>
        ) : <p className="text-[10px] text-slate-400 pb-1">Cada apartado ya trae sus gastos generales y utilidad.</p>}
        {fila('Subtotal', calc.subtotal)}
        <div className="flex flex-nowrap items-center justify-between gap-2 min-h-[36px]">
          <Interruptor on={p.igv} onChange={v => setP(x => ({ ...x, igv: v }))} label="IGV 18 %" />
          <span className="font-mono font-bold text-slate-800">{S(calc.igv)}</span>
        </div>
        <div className="flex flex-nowrap justify-between items-center gap-2 bg-indigo-600 text-white rounded-xl px-3 py-2.5 mt-1">
          <span className="font-black uppercase text-xs">Total{p.igv ? '' : ' (sin IGV)'}</span><span className="font-mono font-black text-base">{S(calc.total)}</span>
        </div>
      </div>
    </div>
  );
}

const HITOS: { id: PagoObra['hito']; nombre: string }[] = [{ id: 'inicio', nombre: 'Al iniciar' }, { id: 'mitad', nombre: 'A mitad de obra' }, { id: 'fin', nombre: 'A la entrega' }];
function FormaPago({ p, setP, total, crono }: { p: PresupuestoObra; setP: SetP; total: number; crono: Crono }) {
  const sumaPct = p.pagos.reduce((s, x) => s + (x.pct || 0), 0);
  const upd = (id: string, c: Partial<PagoObra>) => setP(x => ({ ...x, pagos: x.pagos.map(g => g.id === id ? { ...g, ...c } : g) }));
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-black uppercase text-slate-900">Forma de pago</h3>
        {Math.abs(sumaPct - 100) > 0.01 && <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600"><AlertTriangle className="w-3 h-3" /> suma {fn(sumaPct)} %</span>}
      </div>
      {p.pagos.map(g => (
        <div key={g.id} className="rounded-xl bg-slate-50 p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <input value={g.concepto} onChange={e => upd(g.id, { concepto: e.target.value })} className="flex-1 min-w-0 min-h-[36px] px-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800" />
            <InputNumero type="number" min={0} max={100} inputMode="decimal" value={g.pct} onChange={e => upd(g.id, { pct: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })} className={`${inputNum} w-14`} />
            <span className="text-[11px] font-bold text-slate-400">%</span>
            <button onClick={() => setP(x => ({ ...x, pagos: x.pagos.filter(y => y.id !== g.id) }))} disabled={p.pagos.length <= 1} title="Quitar"
              className="w-8 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer disabled:opacity-30"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <select value={g.hito} onChange={e => upd(g.id, { hito: e.target.value as PagoObra['hito'] })} className="min-h-[32px] px-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600">
              {HITOS.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
            </select>
            <span className="text-slate-400 truncate flex-1">{crono.totalDias ? fechaCorta(fechaPago(g, p, crono.totalDias)) : ''}</span>
            <span className="font-mono font-black text-slate-800">{S(total * (g.pct || 0) / 100)}</span>
          </div>
        </div>
      ))}
      <button onClick={() => setP(x => ({ ...x, pagos: [...x.pagos, { id: uidObra(), concepto: 'Otro pago', pct: Math.max(0, 100 - sumaPct), hito: 'fin' }] }))}
        className="inline-flex items-center gap-1 min-h-[36px] text-[11px] font-bold text-indigo-700 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Agregar pago</button>
    </div>
  );
}

// ── 2. Cronograma ──────────────────────────────────────────────────────────
function Cronograma({ p, setP, crono, hayApartados, onResumen }: { p: PresupuestoObra; setP: SetP; crono: Crono; hayApartados: boolean; onResumen: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const [arrastra, setArrastra] = useState<string | null>(null);
  const ids = crono.barras.map(b => b.id);
  const updT = (id: string, c: Partial<TareaCrono>) => setP(x => ({ ...x, tareas: { ...x.tareas, [id]: { ...(x.tareas[id] || { id }), ...c } } }));
  const mover = (id: string, destino: string | number) => setP(x => {
    const visibles = x.orden.filter(o => ids.includes(o));
    const de = visibles.indexOf(id);
    const a = typeof destino === 'number' ? de + destino : visibles.indexOf(destino);
    if (de < 0 || a < 0 || a >= visibles.length || de === a) return x;
    const nv = [...visibles]; nv.splice(de, 1); nv.splice(a, 0, id);
    // Reubica solo las visibles; las ocultas (no incluidas) quedan donde estaban.
    let k = 0;
    return { ...x, orden: x.orden.map(o => ids.includes(o) ? nv[k++] : o) };
  });
  const agregar = () => {
    const id = `x_${uidObra()}`;
    setP(x => ({ ...x, orden: [...x.orden, id], tareas: { ...x.tareas, [id]: { id, nombre: 'Limpieza y entrega', dias: 1 } } }));
    setSel(id);
  };
  const quitar = (id: string) => setP(x => { const { [id]: _o, ...resto } = x.tareas; return { ...x, orden: x.orden.filter(o => o !== id), tareas: resto }; });
  const valorEmpieza = (b: Crono['barras'][number]) => b.despuesDe === 'anterior' ? 'anterior' : !b.despuesDe ? '' : `${b.rel}:${b.despuesDe}`;
  const cambiarEmpieza = (id: string, v: string) => {
    if (v === 'anterior' || v === '') updT(id, { despuesDe: v, rel: 'fin' });
    else { const [rel, ref] = v.split(':'); updT(id, { despuesDe: ref, rel: rel as 'fin' | 'inicio' }); }
  };
  if (!hayApartados && !crono.barras.length) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xs text-center space-y-3">
        <CalendarRange className="w-10 h-10 mx-auto text-indigo-500" />
        <p className="text-sm text-slate-500">Incluye al menos un apartado en el Resumen para armar el cronograma.</p>
        <button onClick={onResumen} className={`${btn} bg-indigo-600 text-white`}>Ir al resumen</button>
      </div>
    );
  }
  const dato = (l: string, v: ReactNode, cls = 'text-slate-800') => (
    <div className="min-w-0"><p className="text-[10px] font-black uppercase text-slate-400">{l}</p><p className={`text-sm font-black truncate ${cls}`}>{v}</p></div>
  );
  return (
    <div className="space-y-4 min-w-0">
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs grid grid-cols-2 lg:grid-cols-[auto_auto_1fr_1fr_1fr_1fr] gap-3 items-end">
        <label className="block text-[10px] font-black uppercase text-slate-400 col-span-1">Fecha de inicio
          <input type="date" value={p.inicio} onChange={e => e.target.value && setP(x => ({ ...x, inicio: e.target.value }))} className={`${inputTxt} !mt-0.5`} />
        </label>
        <div className="flex items-end"><Interruptor on={p.sabado} onChange={v => setP(x => ({ ...x, sabado: v }))} label="Trabaja sábados" /></div>
        {dato('Inicio', fechaLarga(crono.inicio))}
        {dato('Entrega', fechaLarga(crono.entrega), 'text-rose-600')}
        {dato('Plazo', `${crono.totalDias} días hábiles`)}
        {dato('Calendario', `${crono.calendario} días`)}
      </div>

      <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-xs min-w-0">
        <Gantt barras={crono.barras} inicio={p.inicio} sabado={p.sabado} seleccion={sel} onSeleccionar={setSel} />
        <p className="text-[10px] text-slate-400 px-1 pt-1">Días no laborables sombreados ({p.sabado ? 'domingos' : 'sábados y domingos'}). Toca una barra para editarla.</p>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase text-slate-900 flex-1">Orden y duración</h3>
          <button onClick={agregar} className={`${btn} bg-indigo-50 text-indigo-700`}><Plus className="w-4 h-4" /> Tarea</button>
        </div>
        <p className="text-[10px] text-slate-400 hidden md:block">Arrastra de la manija para cambiar el orden. “Después de…” encadena las partidas; usa “Junto con…” para trabajar en paralelo y los días de espera (+) o traslape (−).</p>
        <div className="divide-y divide-slate-100">
          {crono.barras.map((b, i) => (
            <div key={b.id} draggable onDragStart={() => setArrastra(b.id)} onDragEnd={() => setArrastra(null)}
              onDragOver={e => { e.preventDefault(); }} onDrop={e => { e.preventDefault(); if (arrastra && arrastra !== b.id) mover(arrastra, b.id); setArrastra(null); }}
              onClick={() => setSel(b.id)}
              className={`py-2 flex flex-wrap md:flex-nowrap items-center gap-x-2 gap-y-1.5 rounded-lg px-1 ${sel === b.id ? 'bg-indigo-50/70' : ''} ${arrastra === b.id ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-1 min-w-0 flex-1 md:flex-none md:w-56">
                <GripVertical className="w-4 h-4 text-slate-300 cursor-grab shrink-0 hidden md:block" />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color }} />
                {b.libre
                  ? <input value={p.tareas[b.id]?.nombre || ''} onChange={e => updT(b.id, { nombre: e.target.value })} className="flex-1 min-w-0 min-h-[34px] px-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-800" />
                  : <span className="text-xs font-black text-slate-800 truncate">{b.nombre}</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => mover(b.id, -1)} disabled={i === 0} title="Subir" className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 cursor-pointer disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => mover(b.id, 1)} disabled={i === crono.barras.length - 1} title="Bajar" className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 cursor-pointer disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 shrink-0">
                <InputNumero type="number" min={1} inputMode="numeric" value={b.dias} onChange={e => updT(b.id, { dias: Math.max(1, parseInt(e.target.value) || 1) })} className={`${inputNum} w-14`} /> días
                {!b.libre && p.tareas[b.id]?.dias !== undefined && b.dias !== b.diasApartado && (
                  <button onClick={() => updT(b.id, { dias: undefined })} title={`Volver a ${b.diasApartado} días del apartado`} className="w-7 h-7 inline-flex items-center justify-center text-slate-400 hover:text-indigo-600 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>
                )}
              </label>
              <select value={valorEmpieza(b)} onChange={e => cambiarEmpieza(b.id, e.target.value)}
                className="min-h-[34px] flex-1 md:flex-none md:w-52 min-w-[150px] px-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600">
                <option value="">Al inicio de la obra</option>
                {i > 0 && <option value="anterior">Después de la anterior</option>}
                {crono.barras.slice(0, i).map(o => <option key={'f' + o.id} value={`fin:${o.id}`}>Después de {o.nombre}</option>)}
                {crono.barras.slice(0, i).map(o => <option key={'i' + o.id} value={`inicio:${o.id}`}>Junto con {o.nombre}</option>)}
              </select>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 shrink-0" title="Días de espera (+) o de traslape (−)">
                <InputNumero type="number" inputMode="numeric" value={b.desfase} onChange={e => updT(b.id, { desfase: parseInt(e.target.value) || 0 })} className={`${inputNum} w-14`} /> <span className="hidden sm:inline">d. espera</span><span className="sm:hidden">espera</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400 shrink-0 md:w-28 md:text-right ml-auto">{fechaCorta(fechaHab(p, b.ini))} → {fechaCorta(fechaHab(p, b.fin - 1))}</span>
              {b.libre && <button onClick={() => quitar(b.id)} title="Quitar" className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>
        {crono.barras.some(b => b.estimado) && <p className="text-[10px] text-slate-400">Los apartados marcados “(est.)” en el Resumen no traen días: se estiman y puedes corregirlos aquí.</p>}
      </div>
    </div>
  );
}
const fechaHab = (p: PresupuestoObra, n: number) => fechaHabil(p.inicio, Math.max(0, n), p.sabado);

// ── 3. Presupuesto (documento) ─────────────────────────────────────────────
function Documento({ p, setP, calc, crono }: { p: PresupuestoObra; setP: SetP; calc: Calc; crono: Crono }) {
  const { datos } = useEmpresa();
  const hojaRef = useRef<HTMLDivElement>(null);
  const vacio = calc.incl.length === 0;
  const factorLinea = p.base === 'venta' ? (s: Calc['secciones'][number]) => (s.directo > 0 ? s.monto / s.directo : 1) : () => 1;
  const numero = `PO-${p.id.slice(0, 6).toUpperCase()}`;
  const whatsapp = () => {
    const lineas = [
      `*Presupuesto de obra*${p.nombre ? ` – ${p.nombre}` : ''}`,
      p.cliente ? `Cliente: ${p.cliente}` : '', p.direccion ? `Obra: ${p.direccion}` : '',
      datos.nombre ? `De: ${datos.nombre}${datos.telefono ? ` (${datos.telefono})` : ''}` : '',
      '',
      ...calc.incl.map(s => `• ${fuenteDe(s.id)!.nombre}: ${S(s.monto * calc.factorVenta)}`),
      '',
      calc.igv ? `Subtotal: ${S(calc.subtotal)}\nIGV 18 %: ${S(calc.igv)}` : '',
      `*Total: ${S(calc.total)}*${p.igv ? '' : ' (sin IGV)'}`,
      '',
      crono.totalDias ? `Plazo: ${crono.totalDias} días hábiles (del ${fechaCorta(crono.inicio)} al ${fechaCorta(crono.entrega)})` : '',
      `Forma de pago: ${p.pagos.map(g => `${g.pct}% ${g.concepto.toLowerCase()} (${S(calc.total * g.pct / 100)})`).join(' · ')}`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
    window.open(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank');
  };
  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">
      <div className="flex flex-wrap items-center gap-2 no-imprimir">
        <p className="text-[11px] text-slate-500 flex-1 min-w-[200px]">Documento para el cliente: {calc.incl.length} apartado(s), cronograma y forma de pago.</p>
        <button onClick={whatsapp} disabled={vacio} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}><Send className="w-4 h-4" /> WhatsApp</button>
        <BotonImprimir objetivo={() => hojaRef.current} titulo={`Presupuesto de obra ${p.nombre || ''}`} etiqueta="Imprimir / PDF" />
      </div>
      <div ref={hojaRef} className="zona-impresion imprimir-claro bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <BandaMarca />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <CabeceraEmpresa subtitulo="Presupuesto de obra" />
          <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0 space-y-0.5">
            <p className="font-black text-slate-800">N.° {numero}</p>
            <p className="font-bold text-slate-700">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            {p.nombre && <p>Obra: <b className="text-slate-700">{p.nombre}</b></p>}
            {p.cliente && <p>Cliente: <b className="text-slate-700">{p.cliente}</b></p>}
            {p.direccion && <p>Dirección: {p.direccion}</p>}
          </div>
        </div>
        {vacio && <p className="py-10 text-center text-sm text-slate-400">Incluye al menos un apartado en el Resumen para ver el presupuesto.</p>}
        {!vacio && (
          <>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase mb-2">Resumen por especialidad {p.base === 'directo' && <span className="text-[10px] font-bold text-slate-400 normal-case">(incluye gastos generales y utilidad)</span>}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {calc.incl.map(s => {
                  const f = fuenteDe(s.id)!;
                  return (
                    <div key={s.id} className="rounded-xl bg-slate-50 px-3 py-2 border-l-4 break-inside-avoid min-w-0" style={{ borderLeftColor: f.color }}>
                      <p className="text-[10px] font-black text-slate-500 uppercase truncate">{f.nombre}</p>
                      <p className="text-sm font-black text-slate-900 font-mono">{S(s.monto * calc.factorVenta)}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug">{s.lectura.resumen}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase mb-1">Detalle de partidas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[520px]">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
                      <th className="text-left py-1.5 font-black w-10">Ítem</th>
                      <th className="text-left py-1.5 font-black">Descripción</th>
                      <th className="text-right py-1.5 font-black">Cant.</th>
                      <th className="text-left py-1.5 pl-2 font-black">Und.</th>
                      <th className="text-right py-1.5 font-black">Parcial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.incl.map((s, k) => {
                      const f = fuenteDe(s.id)!;
                      const fl = factorLinea(s);
                      const ps = s.partidas.filter(x => !x.omitida);
                      return (
                        <GrupoDoc key={s.id} n={k + 1} nombre={f.nombre} color={f.color} subtotal={s.monto}>
                          {ps.map((x, i) => (
                            <tr key={i} className="border-b border-slate-100 break-inside-avoid">
                              <td className="py-1.5 pr-2 font-mono text-slate-400">{k + 1}.{String(i + 1).padStart(2, '0')}</td>
                              <td className="py-1.5 pr-2 font-bold text-slate-700">{x.descripcion}</td>
                              <td className="py-1.5 text-right font-mono text-slate-700">{x.cantidad !== undefined ? fn(x.cantidad) : '1'}</td>
                              <td className="py-1.5 pl-2 text-slate-500">{x.cantidad !== undefined ? x.unidad || '' : 'glb'}</td>
                              <td className="py-1.5 text-right font-mono font-bold text-slate-800">{f2(x.subtotal * fl)}</td>
                            </tr>
                          ))}
                        </GrupoDoc>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
              <div className="flex-1 min-w-0 break-inside-avoid">
                <h3 className="text-sm font-black text-slate-900 uppercase mb-1">Forma de pago</h3>
                <table className="w-full text-xs">
                  <tbody>
                    {p.pagos.map(g => (
                      <tr key={g.id} className="border-b border-slate-100">
                        <td className="py-1.5 font-bold text-slate-700">{g.concepto}</td>
                        <td className="py-1.5 text-right font-mono text-slate-500">{fn(g.pct)} %</td>
                        <td className="py-1.5 pl-3 text-slate-500 whitespace-nowrap">{crono.totalDias ? fechaCorta(fechaPago(g, p, crono.totalDias)) : ''}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-slate-800">{S(calc.total * g.pct / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="w-full sm:w-80 space-y-1 text-xs shrink-0 break-inside-avoid">
                <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">{p.base === 'directo' ? 'Costo directo' : 'Suma de especialidades'}</span><span className="font-mono font-bold">{S(calc.directo)}</span></div>
                {p.base === 'directo' && <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Gastos generales ({fn(p.gg)} %)</span><span className="font-mono font-bold">{S(calc.gg)}</span></div>}
                {p.base === 'directo' && <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Utilidad ({fn(p.util)} %)</span><span className="font-mono font-bold">{S(calc.util)}</span></div>}
                <div className="flex flex-nowrap justify-between gap-2 border-t border-slate-200 pt-1"><span className="text-slate-500 font-bold">Subtotal</span><span className="font-mono font-bold">{S(calc.subtotal)}</span></div>
                {p.igv && <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">IGV (18 %)</span><span className="font-mono font-bold">{S(calc.igv)}</span></div>}
                <div className="flex flex-nowrap justify-between gap-2 bg-indigo-600 text-white rounded-xl px-3 py-2 mt-1"><span className="font-black uppercase">Total{p.igv ? '' : ' (sin IGV)'}</span><span className="font-mono font-black">{S(calc.total)}</span></div>
              </div>
            </div>
            {crono.barras.length > 0 && (
              <div className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 mb-1.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Cronograma de ejecución</h3>
                  <p className="text-[11px] text-slate-500">Inicio <b className="text-slate-700">{fechaLarga(crono.inicio)}</b> · Entrega <b className="text-rose-600">{fechaLarga(crono.entrega)}</b> · <b className="text-slate-700">{crono.totalDias} días hábiles</b> ({p.sabado ? 'lunes a sábado' : 'lunes a viernes'})</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-1.5 overflow-hidden">
                  <Gantt barras={crono.barras} inicio={p.inicio} sabado={p.sabado} compacto />
                </div>
              </div>
            )}
            {p.notas.trim() && <p className="text-[11px] text-slate-600 whitespace-pre-line">{p.notas}</p>}
            <CondicionesComerciales total={calc.total} ocultarPagos />
            <p className="text-[10px] text-slate-400">Montos calculados con los precios vigentes de cada especialidad. Los plazos se cuentan en días hábiles desde la fecha de inicio y pueden variar por cambios del cliente, clima o abastecimiento.</p>
          </>
        )}
      </div>
      <label className="no-imprimir block bg-white rounded-2xl p-3 shadow-xs text-[10px] font-black uppercase text-slate-400">Notas para el cliente (salen en el documento)
        <textarea rows={2} value={p.notas} onChange={e => setP(x => ({ ...x, notas: e.target.value }))} placeholder="Ej. El cliente entrega el terreno nivelado. No incluye licencia municipal."
          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 normal-case focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      </label>
    </div>
  );
}
function GrupoDoc({ n, nombre, color, subtotal, children }: { n: number; nombre: string; color: string; subtotal: number; children: ReactNode }) {
  return (
    <>
      <tr className="break-inside-avoid"><td colSpan={5} className="pt-3 pb-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase" style={{ color }}><span className="w-2 h-2 rounded-full" style={{ background: color }} />{n}. {nombre}</span>
        <span className="float-right font-mono font-black text-slate-600">{f2(subtotal)}</span>
      </td></tr>
      {children}
    </>
  );
}
