// =============================================================================
// Interfaz común de "Carpintería de madera" y "Vidrios y aluminio": campos,
// encabezado con pestañas, Mis cotizaciones, tarjetas de ítem, barra de total,
// Materiales (con despiece) y Presupuesto formal (imprimir / PDF / WhatsApp).
// =============================================================================
import { ReactNode, useEffect, useRef, useState } from 'react';
import { ClipboardList, Tag, Send, Save, FolderOpen, FilePlus2, Copy, Trash2, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { CabeceraEmpresa, useEmpresa, BandaMarca, CondicionesComerciales } from '../../../lib/empresa';
import BotonImprimir from '../../common/BotonImprimir';
import { simb } from '../../../lib/currency';
import type { Linea, CotBase, Barra } from './comun';
import { leerLista, guardarLista, uid } from './comun';

export const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const f2 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer';
export const inputTxt = 'mt-0.5 w-full min-h-[40px] px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300';

export interface Tema {
  primario: string; botonOscuro: string; suave: string; texto: string; borde: string; icono: string; iconoBg: string; acento: string; hex: string; check: string; hover: string;
}
export const TEMA_MADERA: Tema = {
  primario: 'bg-amber-700 text-white hover:bg-amber-800', botonOscuro: 'bg-amber-600 hover:bg-amber-500', suave: 'bg-amber-50 text-amber-800', texto: 'text-amber-800',
  borde: 'border-amber-300', icono: 'text-amber-700', iconoBg: 'bg-amber-500/10 text-amber-700', acento: 'bg-amber-700', hex: '#b45309', check: 'accent-amber-700', hover: 'hover:border-amber-400 hover:bg-amber-50',
};
export const TEMA_VIDRIOS: Tema = {
  primario: 'bg-cyan-600 text-white hover:bg-cyan-700', botonOscuro: 'bg-cyan-500 hover:bg-cyan-400', suave: 'bg-cyan-50 text-cyan-800', texto: 'text-cyan-700',
  borde: 'border-cyan-300', icono: 'text-cyan-600', iconoBg: 'bg-cyan-500/10 text-cyan-600', acento: 'bg-cyan-600', hex: '#0891b2', check: 'accent-cyan-600', hover: 'hover:border-cyan-400 hover:bg-cyan-50',
};

// ── Campos ──────────────────────────────────────────────────────────────────
export function Num({ label, value, onChange, step = 0.01, min = 0, max, sufijo = 'm', entero = false }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; sufijo?: string; entero?: boolean }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { if (parseFloat(txt) !== value) setTxt(String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const fijar = (v: number) => { let x = Math.max(min, max !== undefined ? Math.min(max, v) : v); x = entero ? Math.round(x) : Math.round(x * 1000) / 1000; onChange(x); };
  return (
    <label className="block min-w-0 text-[10px] font-bold text-slate-500 uppercase">{label}
      <div className="mt-0.5 flex items-center min-h-[40px] rounded-lg bg-slate-100 focus-within:ring-2 focus-within:ring-slate-300">
        <input type="number" inputMode={entero ? 'numeric' : 'decimal'} step={step} min={min} max={max} value={txt}
          onChange={e => { setTxt(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) fijar(v); }}
          onBlur={() => setTxt(String(value))}
          className="w-full min-w-0 bg-transparent px-2 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none" />
        {sufijo && <span className="pr-2 text-[11px] font-bold text-slate-400 normal-case">{sufijo}</span>}
      </div>
    </label>
  );
}
export function Elegir<T extends string>({ label, value, opciones, onChange }: { label: string; value: T; opciones: [T, string][]; onChange: (v: T) => void }) {
  return (
    <label className="block min-w-0 text-[10px] font-bold text-slate-500 uppercase">{label}
      <select value={value} onChange={e => onChange(e.target.value as T)} className={`${inputTxt} cursor-pointer truncate`}>
        {opciones.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
export function Segmento<T extends string | number>({ label, value, opciones, onChange }: { label: string; value: T; opciones: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-500 uppercase">{label}</p>
      <div className="mt-0.5 flex flex-nowrap gap-0.5 p-0.5 bg-slate-100 rounded-lg">
        {opciones.map(([v, l]) => (
          <button key={String(v)} type="button" onClick={() => onChange(v)}
            className={`flex-1 min-w-0 min-h-[36px] px-1 rounded-md text-[11px] font-bold cursor-pointer truncate ${value === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}
export function Check({ label, value, onChange, tema }: { label: string; value: boolean; onChange: (v: boolean) => void; tema: Tema }) {
  return (
    <label className="flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-700 cursor-pointer">
      <input type="checkbox" className={`w-4 h-4 ${tema.check}`} checked={value} onChange={e => onChange(e.target.checked)} /> {label}
    </label>
  );
}
export function Avisos({ lista }: { lista: string[] }) {
  if (!lista.length) return null;
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 space-y-0.5">
      {lista.map((a, i) => <p key={i} className="text-[11px] font-bold text-amber-800 flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />{a}</p>)}
    </div>
  );
}

// ── Encabezado con pestañas ──────────────────────────────────────────────────
export interface TabDef<P extends string> { id: P; label: string; corto: string; icon: any }
export function Encabezado<P extends string>({ tema, Icono, titulo, descripcion, tabs, pestana, setPestana }: { tema: Tema; Icono: any; titulo: string; descripcion: string; tabs: TabDef<P>[]; pestana: P; setPestana: (p: P) => void }) {
  return (
    <div className="oculto-en-dibujo flex flex-row flex-nowrap items-center justify-center lg:justify-between gap-2 lg:gap-3 px-2 sm:px-4 py-1.5 lg:py-3 bg-white border-b border-slate-200">
      <div className="hidden lg:flex items-center gap-2.5 min-w-0">
        <div className={`p-2 rounded-xl ${tema.iconoBg}`}><Icono className="w-5 h-5" /></div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">{titulo}</h2>
          <p className="text-[11px] text-slate-500 truncate">{descripcion}</p>
        </div>
      </div>
      <div className="flex flex-nowrap w-full lg:w-auto lg:inline-flex p-0.5 lg:p-1 bg-slate-100 rounded-xl gap-0.5 lg:shrink-0">
        {tabs.map(t => {
          const Ic = t.icon;
          return (
            <button key={t.id} onClick={() => setPestana(t.id)} title={t.label}
              className={`flex-1 lg:flex-none min-w-0 min-h-[40px] flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 px-1 lg:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer ${pestana === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <Ic className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${tema.icono} shrink-0`} /><span className="hidden lg:inline">{t.label}</span><span className="lg:hidden truncate max-w-full">{t.corto}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Vacio({ tema, Icono, texto, onIr, etiquetaIr, onEjemplo }: { tema: Tema; Icono: any; texto: string; onIr: () => void; etiquetaIr: string; onEjemplo?: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center text-center gap-3">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tema.iconoBg}`}><Icono className="w-6 h-6" /></div>
      <p className="text-sm text-slate-500 max-w-sm">{texto}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={onIr} className={`${btn} ${tema.primario}`}>{etiquetaIr}</button>
        {onEjemplo && <button onClick={onEjemplo} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>}
      </div>
    </div>
  );
}

// ── Datos de la cotización + Mis cotizaciones ────────────────────────────────
export function DatosCotizacion<T extends CotBase & { items: { id: string }[] }>({ cot, setCot, keyLista, vacia, tema, onEjemplo, placeholder }: {
  cot: T; setCot: (f: (c: T) => T) => void; keyLista: string; vacia: () => T; tema: Tema; onEjemplo: () => void; placeholder: string;
}) {
  const [lista, setLista] = useState<T[]>(() => leerLista<T>(keyLista));
  const [verLista, setVerLista] = useState(false);
  const [aviso, setAviso] = useState('');
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 3000); };
  const guardar = () => {
    const nueva = { ...cot, actualizado: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) };
    const l = [nueva, ...lista.filter(x => x.id !== cot.id)];
    guardarLista(keyLista, l); setLista(l); setCot(() => nueva);
    avisar('✓ Guardada en Mis cotizaciones');
  };
  const duplicar = () => {
    setCot(c => ({ ...c, id: uid(), nombre: `${c.nombre || 'Cotización'} (copia)`, items: c.items.map(i => ({ ...i, id: uid() })), actualizado: undefined }));
    avisar('✓ Copia creada: guárdala para tenerla en la lista');
  };
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre de la obra
          <input value={cot.nombre} onChange={e => setCot(c => ({ ...c, nombre: e.target.value }))} placeholder={placeholder} className={inputTxt} />
        </label>
        <label className="block text-[10px] font-bold text-slate-500 uppercase">Cliente
          <input value={cot.cliente} onChange={e => setCot(c => ({ ...c, cliente: e.target.value }))} placeholder="Nombre del cliente" className={inputTxt} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={guardar} className={`${btn} ${tema.primario}`}><Save className="w-4 h-4" /> Guardar</button>
        <button onClick={() => setVerLista(v => !v)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FolderOpen className="w-4 h-4" /> Mis cotizaciones ({lista.length})</button>
        <button onClick={() => { if (!cot.items.length || confirm('¿Empezar una cotización nueva? La actual sigue en Mis cotizaciones si la guardaste.')) setCot(() => vacia()); }}
          className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FilePlus2 className="w-4 h-4" /> Nueva</button>
        {cot.items.length > 0 && <button onClick={duplicar} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Copy className="w-4 h-4" /> Duplicar</button>}
        <button onClick={() => { if (!cot.items.length || confirm('¿Reemplazar la cotización actual por el ejemplo?')) onEjemplo(); }} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>
        {aviso && <span className="text-xs font-bold text-emerald-700">{aviso}</span>}
      </div>
      {verLista && (
        <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
          {lista.length === 0 && <p className="p-3 text-xs text-slate-400">Aún no guardaste cotizaciones.</p>}
          {lista.map(c => (
            <div key={c.id} className="flex flex-nowrap items-center gap-2 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{c.nombre || 'Sin nombre'}{c.cliente ? ` · ${c.cliente}` : ''}</p>
                <p className="text-[11px] text-slate-400 truncate">{(c.items || []).length} ítems{typeof c.total === 'number' ? ` · ${S(c.total)}` : ''} · {c.actualizado || ''}</p>
              </div>
              <button onClick={() => { setCot(() => ({ ...vacia(), ...c })); setVerLista(false); }} className={`${btn} bg-white ${tema.texto} hover:bg-slate-100 shrink-0`}>Abrir</button>
              <button onClick={() => { if (confirm('¿Borrar esta cotización?')) { const l = lista.filter(x => x.id !== c.id); guardarLista(keyLista, l); setLista(l); } }} title="Borrar"
                className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Selector de tipos ────────────────────────────────────────────────────────
export function SelectorTipos<T extends string>({ titulo, tipos, onElegir, tema }: { titulo: string; tipos: { id: T; corto: string; descripcion: string; icon: any }[]; onElegir: (t: T) => void; tema: Tema }) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-2">
      <p className="text-xs font-black text-slate-800">{titulo} <span className="font-semibold text-slate-400">Toca para agregar</span></p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8 gap-2">
        {tipos.map(t => {
          const Ic = t.icon;
          return (
            <button key={t.id} onClick={() => onElegir(t.id)} title={t.descripcion}
              className={`text-left min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2 cursor-pointer transition-colors ${tema.hover}`}>
              <Ic className={`w-5 h-5 ${tema.icono}`} />
              <p className="text-xs font-bold text-slate-800 leading-tight mt-1">{t.corto}</p>
              <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{t.descripcion}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Tarjeta de un ítem (cerrada: resumen; abierta: editor + dibujo) ──────────
export function TarjetaItem({ abierta, onToggle, miniatura, titulo, subtitulo, precio, aviso, tema, children }: {
  abierta: boolean; onToggle: () => void; miniatura: ReactNode; titulo: string; subtitulo: string; precio: string; aviso?: boolean; tema: Tema; children?: ReactNode;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-xs border ${abierta ? tema.borde : aviso ? 'border-amber-200' : 'border-transparent'}`}>
      <button onClick={onToggle} className="w-full flex flex-nowrap items-center gap-3 p-3 text-left cursor-pointer">
        <span className="w-11 h-11 shrink-0 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden p-0.5">{miniatura}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-800 truncate">{titulo}</p>
          <p className="text-[11px] text-slate-500 truncate">{subtitulo}{aviso ? ' · ⚠ revisar' : ''}</p>
        </div>
        <p className={`text-[11px] font-bold ${tema.texto} shrink-0 text-right`}>{precio}</p>
        {abierta ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {abierta && children}
    </div>
  );
}

export function BarraTotal({ tema, detalle, total, onPresupuesto }: { tema: Tema; detalle: string; total: number; onPresupuesto: () => void }) {
  return (
    <div className="xl:hidden sticky bottom-3 z-20 ml-auto w-full lg:w-[420px] bg-slate-900/95 backdrop-blur text-white rounded-2xl shadow-xl px-4 py-2.5 flex flex-nowrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{detalle}</p>
        <p className="text-lg font-black font-mono truncate">{S(total)}</p>
      </div>
      <button onClick={onPresupuesto} className={`${btn} ${tema.botonOscuro} text-white shrink-0`}><ClipboardList className="w-4 h-4" /> Presupuesto</button>
    </div>
  );
}

export function ResumenPC({ tema, total, detalle, filas, onPresupuesto, desglose }: {
  tema: Tema; total: number; detalle: string; filas: { id: string; titulo: string; sub: string; onClick: () => void }[]; onPresupuesto: () => void; desglose: [string, number][];
}) {
  return (
    <aside className="hidden xl:block sticky top-4 space-y-3">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resumen</p>
        <div>
          <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{detalle}</p>
        </div>
        <div className="space-y-1 text-xs">
          {desglose.map(([l, v]) => <div key={l} className="flex justify-between gap-2"><span className="text-slate-400">{l}</span><span className="font-mono font-bold">{S(v)}</span></div>)}
        </div>
        {filas.length > 0 && (
          <div className="max-h-[40vh] overflow-y-auto divide-y divide-white/10 rounded-xl bg-white/5">
            {filas.map(f => (
              <button key={f.id} onClick={f.onClick} className="w-full flex items-center gap-2 px-3 py-2 text-left cursor-pointer hover:bg-white/10">
                <span className="flex-1 min-w-0 text-xs font-bold truncate">{f.titulo}</span>
                <span className="text-[11px] font-mono text-slate-300 shrink-0">{f.sub}</span>
              </button>
            ))}
          </div>
        )}
        <button onClick={onPresupuesto} disabled={!filas.length} className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-sm font-black cursor-pointer disabled:opacity-40 ${tema.botonOscuro}`}><ClipboardList className="w-4 h-4" /> Ver presupuesto</button>
      </div>
    </aside>
  );
}

// ── Tabla de líneas (tabla en PC, lista en el celular) ───────────────────────
export function TablaLineas({ lineas }: { lineas: Linea[] }) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
              <th className="text-left py-1.5 font-black">Descripción</th>
              <th className="text-left py-1.5 font-black">Cálculo / nota</th>
              <th className="text-right py-1.5 font-black">Cant.</th>
              <th className="text-left py-1.5 pl-2 font-black">Und.</th>
              <th className="text-right py-1.5 font-black whitespace-nowrap">P. unit.</th>
              <th className="text-right py-1.5 pl-2 font-black">Parcial</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1.5 pr-2 font-bold text-slate-700">{l.nombre}</td>
                <td className="py-1.5 pr-2 text-slate-400 max-w-[300px]">{l.nota}</td>
                <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.cant}</td>
                <td className="py-1.5 pl-2 text-slate-500 whitespace-nowrap">{l.unidad}</td>
                <td className={`py-1.5 pl-2 text-right font-mono ${l.precio ? 'text-slate-600' : 'text-amber-600'}`}>{l.precio.toFixed(2)}</td>
                <td className="py-1.5 pl-2 text-right font-mono font-bold text-slate-800">{l.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-slate-100">
        {lineas.map((l, i) => (
          <div key={i} className="py-2 flex flex-nowrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-700 leading-snug">{l.nombre}</p>
              <p className="text-[10px] text-slate-400 leading-snug">{l.nota}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-mono font-black text-slate-800">{l.subtotal.toFixed(2)}</p>
              <p className={`text-[10px] font-mono ${l.precio ? 'text-slate-400' : 'text-amber-600'}`}>{l.cant} {l.unidad} × {l.precio.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Materiales (resumen, despiece y líneas con precio) ───────────────────────
export function PanelMateriales({ tema, cot, setCot, lineas, grupos, colorGrupo, tarjetas, despiece, ajustes, onPresupuesto, onIrAPrecios, titulo, desglose, total }: {
  tema: Tema; cot: CotBase; setCot: (f: (c: any) => any) => void; lineas: Linea[]; grupos: string[]; colorGrupo: Record<string, string>;
  tarjetas: ReactNode; despiece: ReactNode; ajustes?: ReactNode; onPresupuesto: () => void; onIrAPrecios?: () => void; titulo: string; desglose: [string, number][]; total: number;
}) {
  const hojaRef = useRef<HTMLDivElement>(null);
  const sinPrecio = lineas.some(l => l.precio === 0);
  const gs = grupos.map(g => ({ g, ls: lineas.filter(l => l.grupo === g) })).filter(x => x.ls.length);
  const panelAjustes = (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <p className="text-xs font-black text-slate-800">Cómo se calcula</p>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-700">Desperdicio
        <input type="number" min={0} max={40} value={cot.merma} onChange={e => setCot((c: CotBase) => ({ ...c, merma: Math.max(0, Math.min(40, parseFloat(e.target.value) || 0)) }))} className="ml-auto w-16 min-h-[36px] px-2 rounded-lg bg-slate-100 font-mono text-right" /> %
      </label>
      <Segmento label="Mano de obra" value={cot.modoMO} opciones={[['unidad', 'Por unidad / m²'], ['jornal', 'Por jornal']]} onChange={v => setCot((c: CotBase) => ({ ...c, modoMO: v }))} />
      {ajustes}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <BotonImprimir objetivo={() => hojaRef.current} titulo={`${titulo} ${cot.nombre || ''}`} etiqueta="Imprimir" />
      </div>
    </div>
  );
  return (
    <div className="p-2 sm:p-4 max-w-[1600px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-4 xl:items-start">
      <div className="space-y-3 min-w-0">
        {tarjetas}
        {sinPrecio && <p className="text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">Hay productos sin precio (en naranja). Escríbelos en Precios.</p>}
        <div ref={hojaRef} className="zona-impresion imprimir-claro space-y-3">
          {despiece}
          {gs.map(({ g, ls }) => (
            <div key={g} className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs break-inside-avoid">
              <div className="flex flex-nowrap items-center gap-2 pb-2 mb-1 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorGrupo[g] || '#64748b' }} />
                <h3 className="text-sm font-black text-slate-900 flex-1 min-w-0 truncate">{g}</h3>
                <span className="text-xs font-mono font-black text-slate-700">{S(ls.reduce((s, l) => s + l.subtotal, 0))}</span>
              </div>
              <TablaLineas lineas={ls} />
            </div>
          ))}
        </div>
        <BarraTotal tema={tema} detalle={desglose.map(([l, v]) => `${l} ${S(v)}`).join(' · ')} total={total} onPresupuesto={onPresupuesto} />
        <div className="xl:hidden">{panelAjustes}</div>
      </div>
      <aside className="hidden xl:block sticky top-4 space-y-3">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total con GG {cot.gg}% y utilidad {cot.util}%</p>
          <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
          <div className="space-y-1 text-xs">
            {desglose.map(([l, v]) => <div key={l} className="flex justify-between gap-2"><span className="text-slate-400">{l}</span><span className="font-mono font-bold">{S(v)}</span></div>)}
          </div>
          <button onClick={onPresupuesto} className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-sm font-black cursor-pointer ${tema.botonOscuro}`}><ClipboardList className="w-4 h-4" /> Ver presupuesto</button>
        </div>
        {panelAjustes}
      </aside>
    </div>
  );
}

/** Tarjeta de resumen (número grande). */
export function Dato({ titulo, valor, sub, color }: { titulo: string; valor: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-xs min-w-0 border-l-4" style={{ borderLeftColor: color }}>
      <p className="text-[10px] font-black uppercase text-slate-400 truncate">{titulo}</p>
      <p className="text-lg font-black font-mono text-slate-900 leading-tight truncate">{valor}</p>
      {sub && <p className="text-[10px] text-slate-500 truncate">{sub}</p>}
    </div>
  );
}

// ── Presupuesto formal ───────────────────────────────────────────────────────
export function Presupuesto({ tema, cot, setCot, lineas, grupos, colorGrupo, subtitulo, titulo, alcance, notas, whatsapp, onIrAPrecios, desglose, textoVacio }: {
  tema: Tema; cot: CotBase & { items: unknown[] }; setCot: (f: (c: any) => any) => void; lineas: Linea[]; grupos: string[]; colorGrupo: Record<string, string>;
  subtitulo: string; titulo: string; alcance: ReactNode; notas: ReactNode; whatsapp: (total: number) => string[]; onIrAPrecios?: () => void; desglose: [string, number][]; textoVacio: string;
}) {
  const { datos } = useEmpresa();
  const hojaRef = useRef<HTMLDivElement>(null);
  const directo = lineas.reduce((s, l) => s + l.subtotal, 0);
  const gg = directo * cot.gg / 100, util = directo * cot.util / 100, total = directo + gg + util;
  const vacio = cot.items.length === 0;
  const sinPrecio = lineas.some(l => l.precio === 0);
  const gs = grupos.map(g => ({ g, ls: lineas.filter(l => l.grupo === g) })).filter(x => x.ls.length);
  const enviar = () => {
    const ls = [
      `*${titulo}*${cot.nombre ? ` – ${cot.nombre}` : ''}`,
      cot.cliente ? `Cliente: ${cot.cliente}` : '',
      datos.nombre ? `De: ${datos.nombre}${datos.telefono ? ` (${datos.telefono})` : ''}` : '',
      '',
      ...whatsapp(total),
      '',
      ...desglose.map(([l, v]) => `${l}: ${S(v)}`),
      `*Total: ${S(total)}*`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
    window.open(`https://wa.me/?text=${encodeURIComponent(ls.join('\n'))}`, '_blank');
  };
  const inpPct = 'ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono';
  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 no-imprimir">
        <div className="flex-1" />
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <button onClick={enviar} disabled={vacio} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40`}><Send className="w-4 h-4" /> WhatsApp</button>
        <BotonImprimir objetivo={() => hojaRef.current} titulo={titulo} etiqueta="Imprimir / PDF" />
      </div>
      {sinPrecio && !vacio && <p className="no-imprimir text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">Hay productos sin precio (en naranja). Escríbelos en Precios.</p>}
      <div ref={hojaRef} className="zona-impresion imprimir-claro bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <BandaMarca />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <CabeceraEmpresa subtitulo={subtitulo} />
          <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
            <p className="font-bold text-slate-700">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            {cot.nombre && <p>Obra: {cot.nombre}</p>}
            {cot.cliente && <p>Cliente: {cot.cliente}</p>}
          </div>
        </div>
        {vacio && <p className="py-10 text-center text-sm text-slate-400">{textoVacio}</p>}
        {!vacio && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Alcance</h3>
            {alcance}
            <h3 className="text-sm font-black text-slate-900 uppercase pt-1">Materiales, accesorios y mano de obra</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
                    <th className="text-left py-1.5 font-black">Descripción</th>
                    <th className="text-right py-1.5 font-black">Cant.</th>
                    <th className="hidden sm:table-cell text-left py-1.5 pl-2 font-black">Und.</th>
                    <th className="text-right py-1.5 font-black">P. unit.</th>
                    <th className="text-right py-1.5 font-black">Parcial</th>
                  </tr>
                </thead>
                <tbody>
                  {gs.map(({ g, ls }) => (
                    <GrupoFilas key={g} g={g} ls={ls} color={colorGrupo[g] || '#64748b'} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!vacio && (
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-1 text-xs">
              {desglose.map(([l, v]) => <div key={l} className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">{l}</span><span className="font-mono font-bold">{S(v)}</span></div>)}
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Gastos generales
                <input type="number" min={0} value={cot.gg} onChange={e => setCot((c: CotBase) => ({ ...c, gg: Math.max(0, parseFloat(e.target.value) || 0) }))} className={inpPct} /> %</span><span className="font-mono font-bold">{S(gg)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Utilidad
                <input type="number" min={0} value={cot.util} onChange={e => setCot((c: CotBase) => ({ ...c, util: Math.max(0, parseFloat(e.target.value) || 0) }))} className={inpPct} /> %</span><span className="font-mono font-bold">{S(util)}</span></div>
              <div className={`flex flex-nowrap justify-between gap-2 text-white rounded-xl px-3 py-2 mt-1 ${tema.acento}`}><span className="font-black uppercase">Total</span><span className="font-mono font-black">{S(total)}</span></div>
            </div>
          </div>
        )}
        {!vacio && <CondicionesComerciales total={total} />}
        {!vacio && <div className="text-[10px] text-slate-400 space-y-0.5">{notas}</div>}
      </div>
    </div>
  );
}
function GrupoFilas({ g, ls, color }: { g: string; ls: Linea[]; color: string }) {
  return (
    <>
      <tr className="break-inside-avoid"><td colSpan={5} className="pt-3 pb-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase" style={{ color }}><span className="w-2 h-2 rounded-full" style={{ background: color }} />{g}</span>
        <span className="float-right font-mono font-black text-slate-500">{ls.reduce((s, l) => s + l.subtotal, 0).toFixed(2)}</span>
      </td></tr>
      {ls.map((l, i) => (
        <tr key={i} className="border-b border-slate-100">
          <td className="py-1.5 pr-2 font-bold text-slate-700">{l.nombre}</td>
          <td className="py-1.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">{l.cant}<span className="sm:hidden font-sans font-normal text-slate-500"> {l.unidad}</span></td>
          <td className="hidden sm:table-cell py-1.5 pl-2 text-slate-500 whitespace-nowrap">{l.unidad}</td>
          <td className={`py-1.5 text-right font-mono ${l.precio ? 'text-slate-600' : 'text-amber-600'}`}>{l.precio.toFixed(2)}</td>
          <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.subtotal.toFixed(2)}</td>
        </tr>
      ))}
    </>
  );
}

/** Elegir qué se ve en el 3D: todo o un trabajo (en el celular empieza con uno). */
export function Chips3D({ items, ver, setVer, tema }: { items: { id: string; titulo: string }[]; ver: string | null; setVer: (id: string | null) => void; tema: Tema }) {
  const chip = (id: string | null, t: string) => (
    <button key={id || 'todos'} onClick={() => setVer(id)}
      className={`shrink-0 min-h-[36px] px-3 rounded-lg text-[11px] font-bold cursor-pointer border whitespace-nowrap ${ver === id ? `${tema.acento} text-white border-transparent` : 'bg-white text-slate-600 border-slate-200'}`}>{t}</button>
  );
  return (
    <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
      {chip(null, 'Todos')}
      {items.map(i => chip(i.id, i.titulo))}
    </div>
  );
}

// ── Dibujos: cotas y barras ─────────────────────────────────────────────────
/** Cota horizontal (mm) debajo/encima de un tramo. */
export function CotaH({ x1, x2, y, texto, fs }: { x1: number; x2: number; y: number; texto: string; fs: number }) {
  const t = fs / 2.2;
  return (
    <g>
      <line x1={x1} x2={x2} y1={y} y2={y} stroke="#64748b" strokeWidth={fs / 12} />
      <line x1={x1} x2={x1} y1={y - t} y2={y + t} stroke="#64748b" strokeWidth={fs / 12} />
      <line x1={x2} x2={x2} y1={y - t} y2={y + t} stroke="#64748b" strokeWidth={fs / 12} />
      <text x={(x1 + x2) / 2} y={y - fs * 0.35} fontSize={fs} fontWeight={800} fill="#334155" textAnchor="middle">{texto}</text>
    </g>
  );
}
export function CotaV({ y1, y2, x, texto, fs }: { y1: number; y2: number; x: number; texto: string; fs: number }) {
  const t = fs / 2.2;
  return (
    <g>
      <line x1={x} x2={x} y1={y1} y2={y2} stroke="#64748b" strokeWidth={fs / 12} />
      <line x1={x - t} x2={x + t} y1={y1} y2={y1} stroke="#64748b" strokeWidth={fs / 12} />
      <line x1={x - t} x2={x + t} y1={y2} y2={y2} stroke="#64748b" strokeWidth={fs / 12} />
      <text x={x - fs * 0.4} y={(y1 + y2) / 2} fontSize={fs} fontWeight={800} fill="#334155" textAnchor="middle" transform={`rotate(-90 ${x - fs * 0.4} ${(y1 + y2) / 2})`}>{texto}</text>
    </g>
  );
}
/** Flecha (punta en x2,y2). */
export function Flecha({ x1, y1, x2, y2, w, color = '#0f172a' }: { x1: number; y1: number; x2: number; y2: number; w: number; color?: string }) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = w * 4;
  const p1 = `${x2 - L * Math.cos(a - 0.45)},${y2 - L * Math.sin(a - 0.45)}`, p2 = `${x2 - L * Math.cos(a + 0.45)},${y2 - L * Math.sin(a + 0.45)}`;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2 - L * 0.6 * Math.cos(a)} y2={y2 - L * 0.6 * Math.sin(a)} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${p1} ${p2}`} fill={color} />
    </g>
  );
}

/** Barras de 6 m con sus cortes (para la carpintería / el taller). */
export function BarrasSvg({ barras, largo = 6000, color }: { barras: Barra[]; largo?: number; color: string }) {
  const alto = 28, gap = 8, W = 600;
  const k = W / largo;
  return (
    <svg viewBox={`0 0 ${W + 84} ${barras.length * (alto + gap)}`} className="w-full max-w-[560px]" style={{ fontFamily: 'system-ui' }} role="img" aria-label="Cortes en barras">
      {barras.map((b, i) => {
        const y = i * (alto + gap);
        return (
          <g key={i}>
            <rect x={0} y={y} width={W} height={alto} rx={3} fill="#f1f5f9" stroke="#cbd5e1" />
            {b.cortes.map((c, j) => (
              <g key={j}>
                <rect x={c.x * k} y={y + 2} width={Math.max(1, c.largo * k)} height={alto - 4} rx={2} fill={color} fillOpacity={j % 2 ? 0.75 : 0.95} />
                {c.largo * k > 30 && <text x={c.x * k + (c.largo * k) / 2} y={y + alto / 2 + 4.5} fontSize={12} fontWeight={800} fill="#fff" textAnchor="middle">{Math.round(c.largo)}</text>}
              </g>
            ))}
            <text x={W + 6} y={y + alto / 2 + 4.5} fontSize={12} fontWeight={700} fill="#64748b">{b.sobrante > 0 ? `sobra ${Math.round(b.sobrante)}` : ''}</text>
          </g>
        );
      })}
    </svg>
  );
}
