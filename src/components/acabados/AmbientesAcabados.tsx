// =============================================================================
// Acabados · pestaña Ambientes: lista de ambientes (manuales o traídos del plano de
// Obra Civil) y el editor del ambiente elegido: medidas, puertas y ventanas,
// paredes (pintura y enchape), piso, contrazócalo y techo.
// =============================================================================
import { useMemo, useState, type ReactNode } from 'react';
import {
  Plus, Trash2, Copy, Save, FolderOpen, FilePlus2, Sparkles, Import, DoorOpen, AppWindow, Ruler, PaintRoller, LayoutGrid, Home as Techo, ClipboardList, ListChecks, Box, Sofa, BedDouble, CookingPot, Bath, WashingMachine, Footprints, Square, X,
} from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import { simb } from '../../lib/currency';
import { FORMATOS, formato, nombreFormato, COLORES_PARED, COLORES_BALDOSA, COLORES_FRAGUA, PINTURAS, nombreColor, TipoPintura } from '../../catalogo/acabados';
import {
  Ambiente, CotizacionAcabados, TipoAmbiente, TIPOS_AMBIENTE, TIPOS_PISO, esBaldosa, ambienteNuevo, cotizacionVacia, uid, KEY_COT_LISTA, leerCotizaciones,
  pisosObra, ambientesDeObra, AcabadoPintura, Revestimiento, Vano, normalizar,
} from './modeloAcabados';
import { MetradoAcab, calcularAmbiente } from './calculoAcabados';

type SetCot = (f: (c: CotizacionAcabados) => CotizacionAcabados) => void;
const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer';
const inputTxt = 'mt-1 w-full min-h-[40px] px-3 rounded-xl bg-slate-100 text-sm font-semibold text-slate-800 normal-case outline-none focus:ring-2 focus:ring-rose-300';
const lbl = 'block min-w-0 text-[10px] font-bold text-slate-500 uppercase';
export const ICONO_AMB: Record<TipoAmbiente, any> = { sala: Sofa, dormitorio: BedDouble, cocina: CookingPot, bano: Bath, lavanderia: WashingMachine, pasadizo: Footprints, otro: Square };

function Num({ label, value, onChange, step = 0.05, min = 0, max = 99, suf }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number; suf?: string }) {
  return (
    <label className={lbl}>{label}
      <span className="mt-1 flex flex-nowrap items-center rounded-xl bg-slate-100 focus-within:ring-2 focus-within:ring-rose-300">
        <input type="number" inputMode="decimal" step={step} min={min} max={max} value={Number.isFinite(value) ? value : 0}
          onChange={e => { const n = parseFloat(e.target.value); onChange(Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0); }}
          className="w-full min-w-0 min-h-[40px] pl-3 pr-1 bg-transparent text-sm font-mono font-bold text-slate-800 outline-none" />
        {suf && <span className="pr-2.5 text-[11px] font-bold text-slate-400 normal-case">{suf}</span>}
      </span>
    </label>
  );
}
function Seg<T extends string | number>({ value, opciones, onChange }: { value: T; opciones: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-nowrap p-0.5 bg-slate-100 rounded-xl gap-0.5">
      {opciones.map(([v, l]) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`flex-1 min-w-0 min-h-[36px] px-1.5 rounded-lg text-[11px] font-bold cursor-pointer truncate ${value === v ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
      ))}
    </div>
  );
}
function Paleta({ colores, value, onChange, libre = true }: { colores: { hex: string; nombre: string }[]; value: string; onChange: (hex: string) => void; libre?: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {colores.map(c => (
          <button key={c.hex} type="button" title={c.nombre} onClick={() => onChange(c.hex)}
            className={`w-8 h-8 rounded-lg border cursor-pointer shrink-0 ${value.toLowerCase() === c.hex.toLowerCase() ? 'ring-2 ring-rose-500 ring-offset-1 border-white' : 'border-slate-300'}`} style={{ background: c.hex }} />
        ))}
        {libre && (
          <label title="Otro color" className="relative w-8 h-8 rounded-lg border border-dashed border-slate-400 cursor-pointer flex items-center justify-center text-slate-500 shrink-0 overflow-hidden">
            <Plus className="w-4 h-4" />
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        )}
      </div>
      <p className="mt-1 text-[11px] font-bold text-slate-600 truncate">{nombreColor(colores, value)}</p>
    </div>
  );
}
function Interruptor({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="inline-flex items-center gap-2 min-h-[36px] cursor-pointer text-xs font-bold text-slate-700">
      <span className={`relative w-9 h-5 rounded-full transition-colors ${on ? 'bg-rose-500' : 'bg-slate-300'}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} /></span>{label}
    </button>
  );
}
function Tarjeta({ icon: Ic, titulo, extra, children }: { icon: any; titulo: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3 break-inside-avoid mb-3 min-w-0">
      <div className="flex flex-nowrap items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><Ic className="w-4 h-4" /></span>
        <h3 className="text-sm font-black text-slate-900 flex-1 min-w-0 truncate">{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

// ── Pestaña ─────────────────────────────────────────────────────────────────
export default function AmbientesAcabados({ cot, setCot, r, total, sel, setSel, onEjemplo, onMateriales, onPresupuesto, on3D }: {
  cot: CotizacionAcabados; setCot: SetCot; r: MetradoAcab; total: number; sel: string | null; setSel: (id: string | null) => void;
  onEjemplo: () => void; onMateriales: () => void; onPresupuesto: () => void; on3D: () => void;
}) {
  const amb = cot.ambientes.find(a => a.id === sel) || cot.ambientes[0] || null;
  const setAmb = (id: string, f: (a: Ambiente) => Ambiente) => setCot(c => ({ ...c, ambientes: c.ambientes.map(a => (a.id === id ? f(a) : a)) }));
  const [agregando, setAgregando] = useState(false);
  const agregar = (t: TipoAmbiente) => {
    const n = ambienteNuevo(t);
    const iguales = cot.ambientes.filter(a => a.tipo === t).length;
    if (iguales) n.nombre = `${n.nombre} ${iguales + 1}`;
    setCot(c => ({ ...c, ambientes: [...c.ambientes, n] })); setSel(n.id); setAgregando(false);
  };
  return (
    <div className="p-2 sm:p-4 max-w-[1680px] mx-auto pb-6 grid gap-3 lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px] items-start">
      <div className="space-y-3 min-w-0 lg:sticky lg:top-3">
        <DatosObra cot={cot} setCot={setCot} onEjemplo={onEjemplo} total={total} />
        <div className="bg-white rounded-2xl p-2.5 shadow-xs space-y-2">
          <div className="flex flex-nowrap items-center gap-2 px-0.5">
            <p className="text-xs font-black text-slate-800 flex-1">Ambientes ({cot.ambientes.length})</p>
            <button onClick={() => setAgregando(v => !v)} className={`${btn} min-h-[34px] px-2.5 bg-rose-600 text-white hover:bg-rose-700`}>{agregando ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} Agregar</button>
          </div>
          {agregando && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-rose-50">
              {TIPOS_AMBIENTE.map(t => { const Ic = ICONO_AMB[t.id]; return (
                <button key={t.id} onClick={() => agregar(t.id)} className="inline-flex items-center gap-1.5 min-h-[38px] px-2 rounded-lg bg-white text-[11px] font-bold text-slate-700 cursor-pointer hover:text-rose-700 min-w-0">
                  <Ic className="w-4 h-4 text-rose-500 shrink-0" /><span className="truncate">{t.nombre}</span>
                </button>
              ); })}
            </div>
          )}
          {cot.ambientes.length === 0 && !agregando && (
            <div className="p-3 text-center space-y-2">
              <p className="text-xs text-slate-500">Agrega los ambientes con sus medidas o tráelos del plano de Obra Civil.</p>
              <button onClick={onEjemplo} className={`${btn} bg-slate-100 text-slate-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
            {r.ambientes.map(c => {
              const a = c.amb, Ic = ICONO_AMB[a.tipo] || Square, act = amb?.id === a.id;
              return (
                <button key={a.id} onClick={() => setSel(a.id)}
                  className={`text-left flex flex-nowrap items-center gap-2 p-1.5 sm:p-2 rounded-xl border cursor-pointer min-w-0 ${act ? 'border-rose-400 bg-rose-50/60 ring-1 ring-rose-300' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                  <span className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200" style={{ background: a.pintura.activo ? a.pintura.color : '#e7e3dc' }}>
                    <span className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: a.piso.tipo === 'ninguno' ? '#b9b4ab' : a.piso.color }} />
                    <Ic className="absolute top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-slate-700/70" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-slate-800 truncate">{a.nombre}</span>
                    <span className="block text-[10px] text-slate-500 truncate">{f2(c.area)} m²{a.enchape.activo ? ' · enchape' : ''}<span className="hidden sm:inline"> · {TIPOS_PISO.find(t => t.id === a.piso.tipo)?.corto}</span></span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <ImportarObra cot={cot} setCot={setCot} setSel={setSel} />
      </div>

      <div className="min-w-0">
        {amb ? <EditorAmbiente key={amb.id} a={amb} set={f => setAmb(amb.id, f)} onBorrar={() => { setCot(c => ({ ...c, ambientes: c.ambientes.filter(x => x.id !== amb.id) })); setSel(null); }}
          onDuplicar={() => { const n = { ...JSON.parse(JSON.stringify(amb)), id: uid(), nombre: `${amb.nombre} (copia)` } as Ambiente; delete n.poly; setCot(c => ({ ...c, ambientes: [...c.ambientes, n] })); setSel(n.id); }} />
          : <div className="bg-white rounded-2xl p-8 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center"><PaintRoller className="w-6 h-6" /></div>
              <p className="text-sm text-slate-500 max-w-md mx-auto">Pintura, pisos y enchapes por ambiente: agrega la sala, los dormitorios, la cocina y el baño, elige colores y formatos, y salen los galones, las cajas, el pegamento, la fragua y el presupuesto.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={() => agregar('sala')} className={`${btn} bg-rose-600 text-white`}><Plus className="w-4 h-4" /> Agregar ambiente</button>
                <button onClick={onEjemplo} className={`${btn} bg-slate-100 text-slate-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>
              </div>
            </div>}
        <div className="xl:hidden sticky bottom-3 z-20 mt-1 ml-auto w-full lg:w-[440px] bg-slate-900/95 backdrop-blur text-white rounded-2xl shadow-xl px-3 sm:px-4 py-2.5 flex flex-nowrap items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{f2(r.tot.piso)} m² piso · {r.tot.galones} gal · {r.tot.cajas} cajas</p>
            <p className="text-lg font-black font-mono truncate">{S(total)}</p>
          </div>
          <button onClick={onPresupuesto} className={`${btn} bg-rose-500 text-white hover:bg-rose-400 shrink-0`}><ClipboardList className="w-4 h-4" /> Presupuesto</button>
        </div>
      </div>

      <aside className="hidden xl:block sticky top-3 space-y-3">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total con GG {cot.gg}% y utilidad {cot.util}%</p>
          <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-2"><span className="text-slate-400">Materiales{cot.soloMO ? ' (los compra el cliente)' : ''}</span><span className={`font-mono font-bold ${cot.soloMO ? 'line-through text-slate-500' : ''}`}>{S(r.materiales)}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Mano de obra</span><span className="font-mono font-bold">{S(r.manoObra)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={onMateriales} className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-white/10 text-white text-xs font-bold cursor-pointer hover:bg-white/20"><ListChecks className="w-4 h-4" /> Materiales</button>
            <button onClick={onPresupuesto} className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-rose-500 text-white text-xs font-black cursor-pointer hover:bg-rose-400"><ClipboardList className="w-4 h-4" /> Presupuesto</button>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-xs">
          <p className="text-xs font-black text-slate-800 mb-2">Resumen de la obra</p>
          <div className="grid grid-cols-2 gap-1.5">
            {([['Piso', `${f2(r.tot.piso)} m²`], ['Pintura de muros', `${f2(r.tot.pintura)} m²`], ['Techos', `${f2(r.tot.techo)} m²`], ['Enchape', `${f2(r.tot.enchape)} m²`], ['Contrazócalo', `${f2(r.tot.contrazocalo)} ml`], ['Pintura', `${r.tot.galones} galones`], ['Cerámico / piso', `${r.tot.cajas} cajas`], ['Ambientes', String(cot.ambientes.length)]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-slate-50 px-2.5 py-1.5 min-w-0"><p className="text-[10px] font-bold text-slate-400 uppercase truncate">{k}</p><p className="text-sm font-black font-mono text-slate-800 truncate">{v}</p></div>
            ))}
          </div>
          <button onClick={on3D} className={`${btn} w-full mt-2 bg-rose-50 text-rose-700 hover:bg-rose-100`}><Box className="w-4 h-4" /> Ver en 3D</button>
        </div>
      </aside>
    </div>
  );
}

// ── Editor de un ambiente ───────────────────────────────────────────────────
function EditorAmbiente({ a, set, onBorrar, onDuplicar }: { a: Ambiente; set: (f: (a: Ambiente) => Ambiente) => void; onBorrar: () => void; onDuplicar: () => void }) {
  const c = useMemo(() => calcularAmbiente(a), [a]);
  const p = (patch: Partial<Ambiente>) => set(x => ({ ...x, ...patch }));
  const setVano = (id: string, patch: Partial<Vano>) => set(x => ({ ...x, vanos: x.vanos.map(v => (v.id === id ? { ...v, ...patch } : v)) }));
  const pint = (k: 'pintura' | 'techo', patch: Partial<AcabadoPintura>) => set(x => ({ ...x, [k]: { ...x[k], ...patch } }));
  const ench = (patch: Partial<Ambiente['enchape']>) => set(x => ({ ...x, enchape: { ...x.enchape, ...patch } }));
  const piso = (patch: Partial<Ambiente['piso']>) => set(x => ({ ...x, piso: { ...x.piso, ...patch } }));
  const Ic = ICONO_AMB[a.tipo] || Square;
  return (
    <div className="min-w-0">
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs mb-3 space-y-3">
        <div className="flex flex-wrap sm:flex-nowrap items-end gap-2">
          <span className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0"><Ic className="w-5 h-5" /></span>
          <label className={`${lbl} flex-1`}>Ambiente<input value={a.nombre} onChange={e => p({ nombre: e.target.value })} className={inputTxt} /></label>
          <label className={`${lbl} order-last basis-full sm:order-none sm:basis-auto sm:w-44 shrink-0`}>Tipo
            <select value={a.tipo} onChange={e => p({ tipo: e.target.value as TipoAmbiente })} className={inputTxt}>
              {TIPOS_AMBIENTE.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </label>
          <button onClick={onDuplicar} title="Duplicar" className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200"><Copy className="w-4 h-4" /></button>
          <button onClick={() => { if (confirm(`¿Quitar "${a.nombre}"?`)) onBorrar(); }} title="Quitar" className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 cursor-pointer hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {a.poly ? (
            <div className="col-span-2 rounded-xl bg-sky-50 px-3 py-1.5 text-[11px] text-sky-900 min-w-0">
              <p className="font-black truncate">Del plano de Obra Civil{a.origen ? ` · ${a.origen}` : ''}</p>
              <p className="truncate">{a.poly.length} lados · {f2(a.largo)} × {f2(a.ancho)} m <button onClick={() => set(x => { const n = { ...x }; delete n.poly; return n; })} className="underline font-bold cursor-pointer">usar rectángulo</button></p>
            </div>
          ) : (<>
            <Num label="Largo" value={a.largo} onChange={v => p({ largo: v })} suf="m" />
            <Num label="Ancho" value={a.ancho} onChange={v => p({ ancho: v })} suf="m" />
          </>)}
          <Num label="Alto" value={a.alto} onChange={v => p({ alto: Math.max(1.8, v) })} suf="m" max={8} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {([['Piso', `${f2(c.area)} m²`], ['Perímetro', `${f2(c.per)} m`], ['Pintura muros', `${f2(c.pintura)} m²`], ['Enchape', `${f2(c.enchape)} m²`]] as [string, string][]).map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 px-2.5 py-1.5 min-w-0"><p className="text-[10px] font-bold text-slate-400 uppercase truncate">{k}</p><p className="text-sm font-black font-mono text-slate-800 truncate">{v}</p></div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase flex-1 min-w-[140px]">Puertas y ventanas (se descuentan: {f2(c.vanos)} m²)</p>
            <button onClick={() => set(x => ({ ...x, vanos: [...x.vanos, { id: uid(), tipo: 'puerta', w: 0.9, h: 2.1, sill: 0 }] }))} className={`${btn} min-h-[34px] px-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200`}><DoorOpen className="w-4 h-4" /> Puerta</button>
            <button onClick={() => set(x => ({ ...x, vanos: [...x.vanos, { id: uid(), tipo: 'ventana', w: 1.2, h: 1.2, sill: 0.9 }] }))} className={`${btn} min-h-[34px] px-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200`}><AppWindow className="w-4 h-4" /> Ventana</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-1.5">
            {a.vanos.map(v => (
              <div key={v.id} className="flex flex-nowrap items-center gap-1.5 rounded-xl bg-slate-50 pl-2 pr-1 py-1 min-w-0">
                {v.tipo === 'puerta' ? <DoorOpen className="w-4 h-4 text-amber-700 shrink-0" /> : <AppWindow className="w-4 h-4 text-sky-600 shrink-0" />}
                <span className="text-[11px] font-bold text-slate-600 w-12 shrink-0 hidden sm:block">{v.tipo === 'puerta' ? 'Puerta' : 'Ventana'}</span>
                <MiniNum v={v.w} on={n => setVano(v.id, { w: n })} t="ancho" />
                <span className="text-slate-400 text-xs">×</span>
                <MiniNum v={v.h} on={n => setVano(v.id, { h: n })} t="alto" />
                {v.tipo === 'ventana' && <><span className="text-[10px] text-slate-400 shrink-0">alf.</span><MiniNum v={v.sill} on={n => setVano(v.id, { sill: n })} t="alféizar" /></>}
                <button onClick={() => set(x => ({ ...x, vanos: x.vanos.filter(y => y.id !== v.id) }))} title="Quitar" className="ml-auto w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:columns-2 md:gap-3">
        <Tarjeta icon={PaintRoller} titulo="Paredes: pintura" extra={<Interruptor on={a.pintura.activo} onChange={v => pint('pintura', { activo: v })} label="" />}>
          {a.pintura.activo ? <PinturaEditor v={a.pintura} on={patch => pint('pintura', patch)} colores={COLORES_PARED} conTipo /> : <p className="text-xs text-slate-400">Sin pintura en las paredes.</p>}
        </Tarjeta>
        <Tarjeta icon={LayoutGrid} titulo="Paredes: enchape" extra={<Interruptor on={a.enchape.activo} onChange={v => ench({ activo: v })} label="" />}>
          {a.enchape.activo ? (<>
            <div className="flex flex-wrap gap-1.5">
              {([['Baño 1.80 m', { desde: 0, alto: 1.8, largo: 0 }], ['Cocina 0.60 sobre tablero', { desde: 0.9, alto: 0.6, largo: 3 }], ['Hasta el techo', { desde: 0, alto: a.alto, largo: 0 }], ['Lavadero 1.20', { desde: 0, alto: 1.2, largo: 2 }]] as [string, Partial<Ambiente['enchape']>][]).map(([l, v]) => (
                <button key={l} onClick={() => ench(v)} className="min-h-[32px] px-2.5 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold cursor-pointer hover:bg-rose-100">{l}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Num label="Desde" value={a.enchape.desde} onChange={v => ench({ desde: v })} suf="m" max={a.alto} />
              <Num label="Alto" value={a.enchape.alto} onChange={v => ench({ alto: v })} suf="m" max={a.alto} />
              <Num label="Largo (0 = todo)" value={a.enchape.largo} onChange={v => ench({ largo: v })} suf="m" step={0.1} />
            </div>
            <RevEditor v={a.enchape} on={ench} formatos={FORMATOS.filter(f => f.uso !== 'piso')} />
          </>) : <p className="text-xs text-slate-400">Sin enchape. En baños y cocinas actívalo (p. ej. 1.80 m de alto o 0.60 m sobre el tablero).</p>}
        </Tarjeta>
        <Tarjeta icon={Footprints} titulo="Piso y contrazócalo">
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-xl">
            {TIPOS_PISO.map(t => (
              <button key={t.id} type="button" onClick={() => piso({ tipo: t.id, ...(esBaldosa(t.id) && formato(a.piso.formato).tipo !== t.id ? { formato: t.id === 'porcelanato' ? 'por_60x60' : 'cer_45x45' } : {}), ...(t.id === 'pulido' ? { color: '#a9a7a2' } : {}), ...((t.id === 'laminado' || t.id === 'vinilico') && !/^#(c7a27a|8a6446)$/i.test(a.piso.color) ? { color: '#c7a27a' } : {}) })}
                className={`min-h-[36px] px-1 rounded-lg text-[11px] font-bold cursor-pointer truncate ${a.piso.tipo === t.id ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'}`}>{t.corto}</button>
            ))}
          </div>
          {esBaldosa(a.piso.tipo) && <RevEditor v={a.piso} on={piso} formatos={FORMATOS.filter(f => f.tipo === a.piso.tipo && f.uso !== 'pared')} />}
          {(a.piso.tipo === 'laminado' || a.piso.tipo === 'vinilico') && (<>
            <Paleta colores={COLORES_BALDOSA.filter(x => /madera|gris|hueso|beige/i.test(x.nombre))} value={a.piso.color} onChange={hex => piso({ color: hex })} />
            <div className="grid grid-cols-2 gap-2"><Num label="Desperdicio" value={a.piso.merma} onChange={v => piso({ merma: v })} step={1} max={40} suf="%" /></div>
          </>)}
          {a.piso.tipo === 'pulido' && <Paleta colores={[{ hex: '#a9a7a2', nombre: 'Gris cemento' }, { hex: '#c9c4ba', nombre: 'Gris claro' }, { hex: '#9b6b4f', nombre: 'Con ocre rojo' }, { hex: '#6b6a67', nombre: 'Grafito' }]} value={a.piso.color} onChange={hex => piso({ color: hex })} libre={false} />}
          {a.piso.tipo !== 'ninguno' && (
            <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-slate-100">
              <Interruptor on={a.contrazocalo.activo} onChange={v => p({ contrazocalo: { ...a.contrazocalo, activo: v } })} label={`Contrazócalo (${f2(c.contrazocalo)} ml)`} />
              {a.contrazocalo.activo && esBaldosa(a.piso.tipo) && <div className="w-28"><Num label="Alto" value={Math.round(a.contrazocalo.alto * 100)} onChange={v => p({ contrazocalo: { ...a.contrazocalo, alto: v / 100 } })} step={1} max={30} suf="cm" /></div>}
              <p className="text-[10px] text-slate-400 basis-full">{esBaldosa(a.piso.tipo) ? 'Se corta del mismo piso (suma a las cajas).' : a.piso.tipo === 'pulido' ? 'Contrazócalo de cemento (solo mano de obra).' : 'Zócalo MDF / PVC de 7 cm en piezas de 2.40 m.'}</p>
            </div>
          )}
        </Tarjeta>
        <Tarjeta icon={Techo} titulo="Techo: pintura" extra={<Interruptor on={a.techo.activo} onChange={v => pint('techo', { activo: v })} label="" />}>
          {a.techo.activo ? <PinturaEditor v={a.techo} on={patch => pint('techo', patch)} colores={COLORES_PARED.slice(0, 6)} /> : <p className="text-xs text-slate-400">Sin pintura en el techo.</p>}
        </Tarjeta>
      </div>
    </div>
  );
}
function MiniNum({ v, on, t }: { v: number; on: (n: number) => void; t: string }) {
  return <input type="number" inputMode="decimal" step={0.05} min={0} value={v} title={t} onChange={e => on(Math.max(0, parseFloat(e.target.value) || 0))} className="w-16 shrink-0 min-h-[32px] px-1.5 rounded-lg bg-white text-xs font-mono font-bold text-slate-800 text-right outline-none focus:ring-2 focus:ring-rose-300" />;
}
function PinturaEditor({ v, on, colores, conTipo = false }: { v: AcabadoPintura; on: (p: Partial<AcabadoPintura>) => void; colores: { hex: string; nombre: string }[]; conTipo?: boolean }) {
  return (
    <div className="space-y-2.5">
      <Paleta colores={colores} value={v.color} onChange={hex => on({ color: hex })} />
      {conTipo && <Seg<TipoPintura> value={v.tipo} opciones={PINTURAS.map(p => [p.id, p.corto] as [TipoPintura, string])} onChange={t => on({ tipo: t })} />}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Manos</span>
        <div className="w-32"><Seg<number> value={v.manos} opciones={[[1, '1'], [2, '2'], [3, '3']]} onChange={n => on({ manos: n })} /></div>
        <label className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-rose-600" checked={v.empaste} onChange={e => on({ empaste: e.target.checked })} /> Empaste</label>
        <label className="inline-flex items-center gap-1.5 min-h-[36px] text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-rose-600" checked={v.imprimante} onChange={e => on({ imprimante: e.target.checked })} /> Imprimante</label>
      </div>
    </div>
  );
}
function RevEditor<T extends Revestimiento>({ v, on, formatos }: { v: T; on: (p: Partial<T>) => void; formatos: typeof FORMATOS }) {
  const f = formato(v.formato);
  return (
    <div className="space-y-2.5">
      <label className={lbl}>Formato
        <select value={v.formato} onChange={e => on({ formato: e.target.value } as Partial<T>)} className={inputTxt}>
          {(formatos.some(x => x.id === v.formato) ? formatos : [f, ...formatos]).map(x => <option key={x.id} value={x.id}>{nombreFormato(x)} · caja {x.m2Caja} m²</option>)}
        </select>
      </label>
      <Paleta colores={COLORES_BALDOSA} value={v.color} onChange={hex => on({ color: hex } as Partial<T>)} />
      <div className="grid grid-cols-2 gap-2">
        <Num label="Junta" value={v.junta} onChange={n => on({ junta: n } as Partial<T>)} step={0.5} max={10} suf="mm" />
        <Num label="Desperdicio" value={v.merma} onChange={n => on({ merma: n } as Partial<T>)} step={1} max={40} suf="%" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Fragua</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {COLORES_FRAGUA.map(x => (
            <button key={x.hex} type="button" title={x.nombre} onClick={() => on({ fragua: x.hex } as Partial<T>)}
              className={`w-7 h-7 rounded-full border cursor-pointer ${v.fragua === x.hex ? 'ring-2 ring-rose-500 ring-offset-1 border-white' : 'border-slate-300'}`} style={{ background: x.hex }} />
          ))}
          <span className="text-[11px] font-bold text-slate-600 ml-1">{nombreColor(COLORES_FRAGUA, v.fragua)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Traer del plano de Obra Civil ───────────────────────────────────────────
function ImportarObra({ cot, setCot, setSel }: { cot: CotizacionAcabados; setCot: SetCot; setSel: (id: string | null) => void }) {
  const [abierto, setAbierto] = useState(false);
  const pisos = useMemo(() => (abierto ? pisosObra() : []), [abierto]);
  const [nivel, setNivel] = useState('');
  const niv = nivel || pisos[0] || 'Piso 1';
  const encontrados = useMemo(() => (abierto ? ambientesDeObra(niv) : []), [abierto, niv]);
  const traer = () => {
    if (!encontrados.length) return;
    const reemplazar = cot.ambientes.length > 0 && confirm(`¿Reemplazar los ${cot.ambientes.length} ambientes actuales por los ${encontrados.length} del plano? (Cancelar = agregarlos)`);
    setCot(c => ({ ...c, ambientes: reemplazar ? encontrados : [...c.ambientes, ...encontrados] }));
    setSel(encontrados[0].id); setAbierto(false);
  };
  return (
    <div className="bg-white rounded-2xl p-2.5 shadow-xs space-y-2">
      <button onClick={() => setAbierto(v => !v)} className={`${btn} w-full bg-sky-50 text-sky-800 hover:bg-sky-100`}><Import className="w-4 h-4" /> Traer del plano de Obra Civil</button>
      {abierto && (
        <div className="space-y-2">
          {pisos.length > 1 && (
            <div className="flex flex-wrap gap-1">{pisos.map(n => <button key={n} onClick={() => setNivel(n)} className={`min-h-[32px] px-2.5 rounded-lg text-[11px] font-bold cursor-pointer ${n === niv ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{n}</button>)}</div>
          )}
          {encontrados.length ? (<>
            <ul className="text-[11px] text-slate-600 space-y-0.5 max-h-40 overflow-y-auto">
              {encontrados.map(a => <li key={a.id} className="flex justify-between gap-2"><span className="truncate font-bold">{a.nombre}</span><span className="font-mono shrink-0">{f2(calcularAmbiente(a).area)} m² · {a.vanos.length} vanos</span></li>)}
            </ul>
            <button onClick={traer} className={`${btn} w-full bg-sky-600 text-white hover:bg-sky-700`}><Ruler className="w-4 h-4" /> Traer {encontrados.length} ambiente{encontrados.length === 1 ? '' : 's'}</button>
          </>) : <p className="text-[11px] text-slate-500 leading-snug">No hay ambientes cerrados en {niv}. En Obra Civil dibuja los muros de modo que cierren cada ambiente (y ponles nombre); aquí salen con sus puertas, ventanas y alto.</p>}
        </div>
      )}
    </div>
  );
}

// ── Obra, cliente y Mis cotizaciones ────────────────────────────────────────
function DatosObra({ cot, setCot, onEjemplo, total }: { cot: CotizacionAcabados; setCot: SetCot; onEjemplo: () => void; total: number }) {
  const [lista, setLista] = useState<CotizacionAcabados[]>(leerCotizaciones);
  const [verLista, setVerLista] = useState(false);
  const [aviso, setAviso] = useState('');
  const avisar = (t: string) => { setAviso(t); window.setTimeout(() => setAviso(''), 3000); };
  const guardar = () => {
    const nueva = { ...cot, total: Math.round(total * 100) / 100, actualizado: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) };
    const l = [nueva, ...lista.filter(x => x.id !== cot.id)];
    safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); setCot(() => nueva);
    avisar('✓ Guardada en Mis cotizaciones');
  };
  const abrir = (c: CotizacionAcabados) => { setCot(() => ({ ...cotizacionVacia(), ...c, ambientes: (c.ambientes || []).map(normalizar) })); setVerLista(false); };
  return (
    <div className="bg-white rounded-2xl p-2.5 shadow-xs space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        <label className={lbl}>Obra<input value={cot.nombre} onChange={e => setCot(c => ({ ...c, nombre: e.target.value }))} placeholder="Ej. Depa – Sr. Luis" className={inputTxt} /></label>
        <label className={lbl}>Cliente<input value={cot.cliente} onChange={e => setCot(c => ({ ...c, cliente: e.target.value }))} placeholder="Nombre del cliente" className={inputTxt} /></label>
      </div>
      <div className="flex flex-nowrap items-center gap-1.5">
        <button onClick={guardar} className={`${btn} flex-1 px-2 bg-rose-600 text-white hover:bg-rose-700`}><Save className="w-4 h-4" /> Guardar</button>
        <button onClick={() => setVerLista(v => !v)} title="Mis cotizaciones" className={`${btn} flex-1 px-2 bg-slate-100 text-slate-700 hover:bg-slate-200`}><FolderOpen className="w-4 h-4" /> <span className="whitespace-nowrap">Mías ({lista.length})</span></button>
        <button onClick={() => { if (!cot.ambientes.length || confirm('¿Empezar una cotización nueva? La actual sigue en Mis cotizaciones si la guardaste.')) setCot(() => cotizacionVacia()); }} title="Nueva" className={`${btn} px-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200`}><FilePlus2 className="w-4 h-4" /></button>
        {cot.ambientes.length > 0 && <button onClick={() => { setCot(c => ({ ...c, id: uid(), nombre: `${c.nombre || 'Cotización'} (copia)`, actualizado: undefined })); avisar('✓ Copia creada: guárdala para tenerla en la lista'); }} title="Duplicar" className={`${btn} px-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 lg:hidden`}><Copy className="w-4 h-4" /></button>}
      </div>
      {aviso && <p className="text-xs font-bold text-emerald-700">{aviso}</p>}
      {verLista && (
        <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
          {lista.length === 0 && <div className="p-3 flex flex-wrap items-center gap-2"><p className="text-xs text-slate-400 flex-1">Aún no guardaste cotizaciones.</p><button onClick={() => { setVerLista(false); onEjemplo(); }} className={`${btn} bg-white text-rose-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button></div>}
          {lista.map(c => (
            <div key={c.id} className="flex flex-nowrap items-center gap-2 p-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{c.nombre || 'Sin nombre'}{c.cliente ? ` · ${c.cliente}` : ''}</p>
                <p className="text-[10px] text-slate-400 truncate">{(c.ambientes || []).length} ambientes{c.total ? ` · ${S(c.total)}` : ''} · {c.actualizado || ''}</p>
              </div>
              <button onClick={() => abrir(c)} className={`${btn} min-h-[34px] px-2.5 bg-white text-rose-700 hover:bg-rose-50 shrink-0`}>Abrir</button>
              <button onClick={() => { if (confirm('¿Borrar esta cotización?')) { const l = lista.filter(x => x.id !== c.id); safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); } }} title="Borrar"
                className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
