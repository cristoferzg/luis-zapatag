// =============================================================================
// Drywall por niveles:
//   1. Cotizar: el usuario elige el sistema (tabique, cielo raso, cenefa, muro
//      de TV…), pone medidas y obtiene metrado y presupuesto al instante.
//   2. Muro en elevación: cada tabique se ve de frente con sus parantes, vanos
//      y las planchas numeradas (despiece y cortes).
//   3. Plano con Techos (opcional): el plano compartido con Obra Civil sobre la
//      estructura de Techos Metálicos; los tabiques llegan al techo.
//   4. Presupuesto: todo junto, para imprimir o enviar por WhatsApp.
// Las partidas con piso asignado y lo dibujado en el plano se suman a Obra Civil.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanelsTopLeft, PenTool, ClipboardList, Tag, Calculator, Ruler, Plus, Trash2, Copy, ChevronDown, ChevronUp, FilePlus2, FolderOpen, Save, Send, DoorOpen, AppWindow } from 'lucide-react';
import ConcretoPlanoCad, { PlanoElem } from './ConcretoPlanoCad';
import { metradoDrywall } from './concreto/metradoDrywall';
import { KEY_OBRA_TECHOS_ID, EstructuraTechos } from './concreto/obraPisos';
import { KEY_CIELOS, CieloRaso } from './concreto/geometriaObra';
import { SavedTechosDesign, getCachedTechosDesigns, fetchAllTechosDesigns, setActiveTechosDesignToLoad } from '../lib/techosDesignsRepo';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { CabeceraEmpresa, useEmpresa, BandaMarca, CondicionesComerciales } from '../lib/empresa';
import BotonImprimir from './common/BotonImprimir';
import {
  SISTEMAS, Sistema, SistemaId, Partida, PRESET_VANO, TipoVano, partidaNueva, sistemaDe, medidaPartida, metradoPartidas,
  despiecePartida, posicionParantes, uid, PLANCHA_W, PLANCHA_H, LineaDrywall,
} from './drywall/calculoDrywall';
import { CotizacionDrywall, KEY_COT_ACTUAL, KEY_COT_LISTA, cotizacionVacia, leerCotizacionActual, leerCotizaciones } from './drywall/cotizacionDrywall';

const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toLocaleString('es-PE', { maximumFractionDigits: 2 });
type Pestana = 'cotizar' | 'elevacion' | 'plano' | 'presupuesto';

export default function DrywallView({ onIrATechos, onIrAPrecios }: { onIrATechos?: () => void; onIrAPrecios?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>(() => {
    const p = safeStorage.getItem<string>('drywall_pestana', 'cotizar');
    return (['cotizar', 'elevacion', 'plano', 'presupuesto'].includes(p || '') ? p : 'cotizar') as Pestana;
  });
  useEffect(() => { safeStorage.setItem('drywall_pestana', pestana); }, [pestana]);
  const [cot, setCot] = useState<CotizacionDrywall>(leerCotizacionActual);
  useEffect(() => { safeStorage.setItem(KEY_COT_ACTUAL, cot); }, [cot]);
  const [muroSel, setMuroSel] = useState<string | null>(null);
  const catalogo = useCatalogo();
  const resultado = useMemo(() => metradoPartidas(cot.partidas), [cot.partidas, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: { id: Pestana; label: string; corto: string; icon: any }[] = [
    { id: 'cotizar', label: 'Cotizar', corto: 'Cotizar', icon: Calculator },
    { id: 'elevacion', label: 'Muro en elevación', corto: 'Elevación', icon: Ruler },
    { id: 'plano', label: 'Plano con Techos', corto: 'Plano', icon: PenTool },
    { id: 'presupuesto', label: 'Presupuesto', corto: 'Presupuesto', icon: ClipboardList },
  ];
  const Cabecera = (
    <div className="flex flex-row items-center justify-between gap-2 lg:gap-3 px-2 sm:px-4 py-1.5 lg:py-3 bg-white border-b border-slate-200">
      <div className="flex items-center gap-2 lg:gap-2.5 min-w-0">
        <div className="p-1.5 lg:p-2 rounded-xl bg-violet-500/10 text-violet-600"><PanelsTopLeft className="w-4 h-4 lg:w-5 lg:h-5" /></div>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">Drywall</h2>
          <p className="hidden lg:block text-[11px] text-slate-500">Cotiza tabiques, cielos rasos y cenefas en minutos; mira cada muro de frente con sus planchas.</p>
        </div>
      </div>
      <div className="inline-flex p-0.5 lg:p-1 bg-slate-100 rounded-xl gap-0.5 shrink-0">
        {tabs.map(t => {
          const Ic = t.icon;
          return (
            <button key={t.id} onClick={() => setPestana(t.id)}
              title={t.label}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer ${pestana === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <Ic className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-violet-500" /> <span className="hidden lg:inline">{t.label}</span>{pestana === t.id && <span className="lg:hidden">{t.corto}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      {Cabecera}
      {pestana === 'plano' ? (
        <div className="flex-1 min-h-0">
          <ConcretoPlanoCad modo="drywall" onEditarEnTechos={d => { setActiveTechosDesignToLoad(d); onIrATechos?.(); }} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {pestana === 'cotizar' && <Cotizar cot={cot} setCot={setCot} total={resultado.total * (1 + (cot.gg + cot.util) / 100)}
            onVerMuro={id => { setMuroSel(id); setPestana('elevacion'); }} onPresupuesto={() => setPestana('presupuesto')} />}
          {pestana === 'elevacion' && <Elevacion cot={cot} setCot={setCot} sel={muroSel} setSel={setMuroSel} onCotizar={() => setPestana('cotizar')} />}
          {pestana === 'presupuesto' && <Presupuesto cot={cot} setCot={setCot} onIrAPrecios={onIrAPrecios} />}
        </div>
      )}
    </div>
  );
}

// ── Campo numérico compacto ─────────────────────────────────────────────────
function Num({ label, value, onChange, step = 0.05, min = 0, sufijo = 'm' }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; sufijo?: string }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { if (parseFloat(txt) !== value) setTxt(String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className="block text-[10px] font-bold text-slate-500 uppercase">{label}
      <div className="mt-0.5 flex items-center rounded-lg bg-slate-100 focus-within:ring-2 focus-within:ring-violet-300">
        <input type="number" inputMode="decimal" step={step} min={min} value={txt}
          onChange={e => { setTxt(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.max(min, v)); }}
          className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm font-mono font-bold text-slate-800 focus:outline-none" />
        {sufijo && <span className="pr-2 text-[11px] font-bold text-slate-400 normal-case">{sufijo}</span>}
      </div>
    </label>
  );
}

const FAMILIAS: { id: Sistema['familia'] | 'deco'; titulo: string; ids: SistemaId[] }[] = [
  { id: 'tabique', titulo: 'Tabiques y muros', ids: ['tabique_2c', 'tabique_1c', 'tabique_rh', 'tabique_rf', 'tabique_acustico', 'muro_exterior'] },
  { id: 'cielo', titulo: 'Cielos rasos', ids: ['cielo_plano', 'cielo_desnivel', 'cielo_modular'] },
  { id: 'deco', titulo: 'Decorativo', ids: ['muro_tv', 'cenefa'] },
];

// ── 1. Cotizar ──────────────────────────────────────────────────────────────
function Cotizar({ cot, setCot, total, onVerMuro, onPresupuesto }: {
  cot: CotizacionDrywall; setCot: (f: (c: CotizacionDrywall) => CotizacionDrywall) => void; total: number;
  onVerMuro: (id: string) => void; onPresupuesto: () => void;
}) {
  const [abierta, setAbierta] = useState<string | null>(cot.partidas[cot.partidas.length - 1]?.id || null);
  const [lista, setLista] = useState<CotizacionDrywall[]>(leerCotizaciones);
  const [verLista, setVerLista] = useState(false);
  const [aviso, setAviso] = useState('');
  const niveles = (safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || []).filter(n => !/cimentaci/i.test(n));
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 3000); };

  const upd = (id: string, patch: Partial<Partida>) => setCot(c => ({ ...c, partidas: c.partidas.map(p => p.id === id ? { ...p, ...patch } : p) }));
  const agregar = (s: SistemaId) => { const p = partidaNueva(s); setCot(c => ({ ...c, partidas: [...c.partidas, p] })); setAbierta(p.id); };
  const guardar = () => {
    const nueva = { ...cot, actualizado: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) };
    const l = [nueva, ...lista.filter(x => x.id !== cot.id)];
    safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); setCot(() => nueva);
    avisar('✓ Cotización guardada en Mis cotizaciones');
  };
  const medidaTotal = cot.partidas.reduce((x, p) => { const m = medidaPartida(p); return m.unidad === 'm²' ? x + m.valor : x; }, 0);

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-5xl mx-auto pb-28">
      {/* Datos de la cotización */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre de la obra
            <input value={cot.nombre} onChange={e => setCot(c => ({ ...c, nombre: e.target.value }))} placeholder="Ej. Dormitorio y baño 2.º piso"
              className="mt-0.5 w-full px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </label>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Cliente
            <input value={cot.cliente} onChange={e => setCot(c => ({ ...c, cliente: e.target.value }))} placeholder="Nombre del cliente"
              className="mt-0.5 w-full px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={guardar} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer hover:bg-violet-700"><Save className="w-4 h-4" /> Guardar</button>
          <button onClick={() => setVerLista(v => !v)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200"><FolderOpen className="w-4 h-4" /> Mis cotizaciones ({lista.length})</button>
          <button onClick={() => { if (!cot.partidas.length || confirm('¿Empezar una cotización nueva? La actual sigue en Mis cotizaciones si la guardaste.')) { setCot(() => cotizacionVacia()); setAbierta(null); } }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-200"><FilePlus2 className="w-4 h-4" /> Nueva</button>
          {aviso && <span className="text-xs font-bold text-emerald-700">{aviso}</span>}
        </div>
        {verLista && (
          <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
            {lista.length === 0 && <p className="p-3 text-xs text-slate-400">Aún no guardaste cotizaciones.</p>}
            {lista.map(c => (
              <div key={c.id} className="flex items-center gap-2 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{c.nombre || 'Sin nombre'}{c.cliente ? ` · ${c.cliente}` : ''}</p>
                  <p className="text-[11px] text-slate-400">{c.partidas.length} partidas · {c.actualizado || ''}</p>
                </div>
                <button onClick={() => { setCot(() => c); setVerLista(false); setAbierta(null); }} className="px-2.5 py-1.5 rounded-lg bg-white text-xs font-bold text-violet-700 cursor-pointer hover:bg-violet-50">Abrir</button>
                <button onClick={() => { if (confirm('¿Borrar esta cotización?')) { const l = lista.filter(x => x.id !== c.id); safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); } }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agregar partida */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <p className="text-xs font-black text-slate-800">¿Qué vas a construir? <span className="font-semibold text-slate-400">Toca para agregar</span></p>
        {FAMILIAS.map(f => (
          <div key={f.id}>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1.5">{f.titulo}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {f.ids.map(id => { const s = sistemaDe(id); return (
                <button key={id} onClick={() => agregar(id)} title={s.descripcion}
                  className="text-left rounded-xl border border-slate-200 bg-white px-2.5 py-2 cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
                  <span className="text-lg leading-none">{s.emoji}</span>
                  <p className="text-xs font-bold text-slate-800 leading-tight mt-1">{s.corto}</p>
                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{s.descripcion}</p>
                </button>
              ); })}
            </div>
          </div>
        ))}
      </div>

      {/* Partidas */}
      {cot.partidas.length === 0 && <p className="text-center text-sm text-slate-400 py-6">Agrega tu primer tabique o cielo raso con los botones de arriba.</p>}
      <div className="space-y-2.5">
        {cot.partidas.map((p, i) => {
          const s = sistemaDe(p.sistema);
          const m = medidaPartida(p);
          const r = metradoPartidas([p]);
          const open = abierta === p.id;
          return (
            <div key={p.id} className={`bg-white rounded-2xl shadow-xs border ${open ? 'border-violet-300' : 'border-transparent'}`}>
              <button onClick={() => setAbierta(open ? null : p.id)} className="w-full flex items-center gap-3 p-3 text-left cursor-pointer">
                <span className="w-9 h-9 shrink-0 rounded-xl bg-violet-50 flex items-center justify-center text-lg">{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-800 truncate">{i + 1}. {p.nombre || s.corto}</p>
                  <p className="text-[11px] text-slate-500 truncate">{s.corto} · {f2(p.largo)} × {f2(p.alto)} m{p.cantidad > 1 ? ` × ${p.cantidad}` : ''}{p.vanos.length ? ` · ${p.vanos.length} vano${p.vanos.length > 1 ? 's' : ''}` : ''}{p.nivel ? ` · ${p.nivel}` : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-800">{f2(m.valor)} {m.unidad}</p>
                  <p className="text-[11px] font-bold text-violet-600">{r.total > 0 ? S(r.total) : 'sin precio'}</p>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              {open && (
                <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className="col-span-2 block text-[10px] font-bold text-slate-500 uppercase">Ambiente o referencia
                      <input value={p.nombre} onChange={e => upd(p.id, { nombre: e.target.value })} placeholder={`Ej. ${s.familia === 'cielo' ? 'Sala' : 'Muro baño'}`}
                        className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    </label>
                    <label className="col-span-2 block text-[10px] font-bold text-slate-500 uppercase">Sistema
                      <select value={p.sistema} onChange={e => { const n = partidaNueva(e.target.value as SistemaId); upd(p.id, { sistema: n.sistema, nicho: n.nicho, cajon: n.cajon }); }}
                        className="mt-0.5 w-full px-2 py-1.5 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none cursor-pointer">
                        {SISTEMAS.map(x => <option key={x.id} value={x.id}>{x.emoji} {x.nombre}</option>)}
                      </select>
                    </label>
                    <Num label={s.familia === 'cenefa' ? 'Largo' : 'Largo'} value={p.largo} onChange={v => upd(p.id, { largo: v })} />
                    {s.familia !== 'cenefa' && <Num label={s.familia === 'cielo' ? 'Ancho' : 'Alto'} value={p.alto} onChange={v => upd(p.id, { alto: v })} />}
                    {s.familia === 'cenefa' && p.cajon && <>
                      <Num label="Ancho del cajón" value={p.cajon.ancho} onChange={v => upd(p.id, { cajon: { ...p.cajon!, ancho: v } })} />
                      <Num label="Alto del cajón" value={p.cajon.alto} onChange={v => upd(p.id, { cajon: { ...p.cajon!, alto: v } })} />
                    </>}
                    <Num label="Cantidad" value={p.cantidad} step={1} min={1} sufijo="×" onChange={v => upd(p.id, { cantidad: Math.max(1, Math.round(v)) })} />
                  </div>

                  {s.desnivel && p.cajon && (
                    <div className="rounded-xl bg-violet-50/60 p-2.5 grid grid-cols-2 gap-2">
                      <p className="col-span-2 text-[11px] font-bold text-violet-800">Cajón perimetral (desnivel) con luz LED</p>
                      <Num label="Ancho" value={p.cajon.ancho} onChange={v => upd(p.id, { cajon: { ...p.cajon!, ancho: v } })} />
                      <Num label="Bajada" value={p.cajon.alto} onChange={v => upd(p.id, { cajon: { ...p.cajon!, alto: v } })} />
                    </div>
                  )}
                  {s.nicho && p.nicho && (
                    <div className="rounded-xl bg-violet-50/60 p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <p className="col-span-2 sm:col-span-4 text-[11px] font-bold text-violet-800">Nicho para el TV (centrado)</p>
                      <Num label="Ancho" value={p.nicho.w} onChange={v => upd(p.id, { nicho: { ...p.nicho!, w: v } })} />
                      <Num label="Alto" value={p.nicho.h} onChange={v => upd(p.id, { nicho: { ...p.nicho!, h: v } })} />
                      <Num label="Fondo" value={p.nicho.prof} onChange={v => upd(p.id, { nicho: { ...p.nicho!, prof: v } })} />
                      <Num label="Desde el piso" value={p.nicho.sill} onChange={v => upd(p.id, { nicho: { ...p.nicho!, sill: v } })} />
                    </div>
                  )}

                  {s.familia === 'tabique' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Puertas y ventanas</p>
                        {(['puerta', 'ventana'] as TipoVano[]).map(t => (
                          <button key={t} onClick={() => upd(p.id, { vanos: [...p.vanos, { id: uid(), tipo: t, w: PRESET_VANO[t].w, h: PRESET_VANO[t].h, sill: PRESET_VANO[t].sill }] })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-800 text-[11px] font-bold cursor-pointer hover:bg-sky-100">
                            {t === 'puerta' ? <DoorOpen className="w-3.5 h-3.5" /> : <AppWindow className="w-3.5 h-3.5" />} + {PRESET_VANO[t].nombre}
                          </button>
                        ))}
                      </div>
                      {p.vanos.map(v => (
                        <div key={v.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-end rounded-xl bg-sky-50/50 p-2">
                          <span className="text-[11px] font-bold text-sky-800 pb-2">{PRESET_VANO[v.tipo].nombre}</span>
                          <Num label="Ancho" value={v.w} onChange={x => upd(p.id, { vanos: p.vanos.map(o => o.id === v.id ? { ...o, w: x } : o) })} />
                          <Num label="Alto" value={v.h} onChange={x => upd(p.id, { vanos: p.vanos.map(o => o.id === v.id ? { ...o, h: x } : o) })} />
                          <Num label="Del piso" value={v.sill} onChange={x => upd(p.id, { vanos: p.vanos.map(o => o.id === v.id ? { ...o, sill: x } : o) })} />
                          <button onClick={() => upd(p.id, { vanos: p.vanos.filter(o => o.id !== v.id) })} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {niveles.length > 0 && (
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">Sumar a Obra Civil
                        <select value={p.nivel || ''} onChange={e => upd(p.id, { nivel: e.target.value || undefined })} className="px-2 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none">
                          <option value="">— No —</option>
                          {niveles.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                    )}
                    <div className="flex-1" />
                    {s.familia === 'tabique' && (
                      <button onClick={() => onVerMuro(p.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold cursor-pointer hover:bg-violet-100"><Ruler className="w-3.5 h-3.5" /> Ver muro y planchas</button>
                    )}
                    <button onClick={() => setCot(c => ({ ...c, partidas: [...c.partidas.slice(0, i + 1), { ...p, id: uid(), vanos: p.vanos.map(v => ({ ...v, id: uid() })) }, ...c.partidas.slice(i + 1)] }))} title="Duplicar"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-200"><Copy className="w-3.5 h-3.5" /> Duplicar</button>
                    <button onClick={() => setCot(c => ({ ...c, partidas: c.partidas.filter(x => x.id !== p.id) }))} title="Quitar"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /> Quitar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de total */}
      {cot.partidas.length > 0 && (
        <div className="fixed bottom-3 left-3 right-3 lg:left-auto lg:right-8 lg:w-[420px] z-30 bg-slate-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{cot.partidas.length} partidas · {f2(medidaTotal)} m²</p>
            <p className="text-lg font-black font-mono">{S(total)}</p>
          </div>
          <button onClick={onPresupuesto} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500 text-white text-xs font-black cursor-pointer hover:bg-violet-400"><ClipboardList className="w-4 h-4" /> Ver presupuesto</button>
        </div>
      )}
    </div>
  );
}

// ── 2. Muro en elevación ────────────────────────────────────────────────────
const COLORES_PLANCHA = ['#ede9fe', '#e0f2fe', '#dcfce7', '#fef3c7', '#fce7f3', '#e2e8f0', '#ffedd5', '#ccfbf1'];

function Elevacion({ cot, setCot, sel, setSel, onCotizar }: {
  cot: CotizacionDrywall; setCot: (f: (c: CotizacionDrywall) => CotizacionDrywall) => void;
  sel: string | null; setSel: (id: string) => void; onCotizar: () => void;
}) {
  const muros = cot.partidas.filter(p => sistemaDe(p.sistema).familia === 'tabique');
  const p = muros.find(m => m.id === sel) || muros[0];
  const [cara, setCara] = useState(0);
  const [ver, setVer] = useState<{ planchas: boolean; parantes: boolean }>({ planchas: true, parantes: true });
  if (!p) return (
    <div className="p-6 max-w-xl mx-auto text-center space-y-3">
      <p className="text-sm text-slate-500">Primero agrega un tabique o muro en <b>Cotizar</b>. Aquí lo verás de frente con sus parantes y planchas.</p>
      <button onClick={onCotizar} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold cursor-pointer">Ir a Cotizar</button>
    </div>
  );
  const s = sistemaDe(p.sistema);
  const { caras, vanos } = despiecePartida(p);
  const c = caras[Math.min(cara, caras.length - 1)];
  const nicho = p.nicho && cara === 0 ? { x: (p.largo - p.nicho.w) / 2, ...p.nicho } : null;
  const parantes = posicionParantes(p.largo, vanos);
  const L = p.largo, H = p.alto, pad = 0.45;
  const Y = (y: number) => H - y;
  const fs = Math.max(0.09, Math.min(0.16, L / 40));
  const cortes = c.piezas.filter(x => x.corte).length;
  const moverVano = (id: string, x: number) => setCot(cc => ({ ...cc, partidas: cc.partidas.map(q => q.id === p.id ? { ...q, vanos: q.vanos.map(v => v.id === id ? { ...v, x: Math.max(0, Math.min(q.largo - v.w, x)) } : v) } : q) }));

  return (
    <div className="p-3 sm:p-5 space-y-3 max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl p-3 shadow-xs flex flex-wrap items-center gap-2">
        <select value={p.id} onChange={e => { setSel(e.target.value); setCara(0); }} className="px-2.5 py-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-800 cursor-pointer focus:outline-none max-w-full">
          {muros.map(m => <option key={m.id} value={m.id}>{cot.partidas.indexOf(m) + 1}. {m.nombre || sistemaDe(m.sistema).corto} · {f2(m.largo)} × {f2(m.alto)} m</option>)}
        </select>
        {caras.length > 1 && (
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            {caras.map((_, i) => <button key={i} onClick={() => setCara(i)} className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${cara === i ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}>Cara {i === 0 ? 'A' : 'B'}</button>)}
          </div>
        )}
        <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={ver.planchas} onChange={e => setVer(v => ({ ...v, planchas: e.target.checked }))} /> Planchas</label>
        <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer"><input type="checkbox" checked={ver.parantes} onChange={e => setVer(v => ({ ...v, parantes: e.target.checked }))} /> Parantes</label>
        <div className="flex-1" />
        <BotonImprimir objetivo={() => document.getElementById('dw-elevacion')} titulo={`Muro ${p.nombre || s.corto}`} orientacion="landscape" unaHoja etiqueta="Imprimir muro" />
      </div>

      <div id="dw-elevacion" className="zona-impresion imprimir-claro bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-black text-slate-900">{s.emoji} {p.nombre || s.corto} · {s.nombre} · Cara {cara === 0 ? 'A' : 'B'}</h3>
          <p className="text-[11px] font-bold text-slate-500">{f2(L)} × {f2(H)} m · {parantes.length} parantes · <span className="text-violet-700">{c.planchas} planchas</span> ({cortes} trozos con corte)</p>
        </div>
        <svg viewBox={`${-pad} ${-pad} ${L + pad * 2} ${H + pad * 2 + 0.2}`} className="w-full h-auto max-h-[60vh] bg-slate-50 rounded-xl" style={{ fontFamily: 'system-ui' }}>
          <defs>
            <pattern id="dw-corte" width="0.08" height="0.08" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.08" stroke="#a78bfa" strokeWidth="0.015" /></pattern>
          </defs>
          {/* Planchas */}
          {ver.planchas && c.piezas.map((pz, i) => (
            <g key={i}>
              <rect x={pz.x} y={Y(pz.y + pz.h)} width={pz.w} height={pz.h} fill={COLORES_PLANCHA[(pz.plancha - 1) % COLORES_PLANCHA.length]} stroke="#7c3aed" strokeWidth={0.012} />
              {pz.corte && <rect x={pz.x} y={Y(pz.y + pz.h)} width={pz.w} height={pz.h} fill="url(#dw-corte)" />}
              {pz.w > 0.3 && pz.h > 0.3 && <text x={pz.x + pz.w / 2} y={Y(pz.y + pz.h / 2)} fontSize={fs * 1.4} fontWeight={900} fill="#5b21b6" textAnchor="middle" dominantBaseline="middle">P{pz.plancha}</text>}
              {pz.w > 0.3 && pz.h > 0.5 && <text x={pz.x + pz.w / 2} y={Y(pz.y + pz.h / 2) + fs * 1.3} fontSize={fs * 0.8} fill="#6d28d9" textAnchor="middle">{f2(pz.w)}×{f2(pz.h)}</text>}
            </g>
          ))}
          {/* Parantes y rieles */}
          {ver.parantes && <>
            {parantes.map((x, i) => {
              const v = vanos.find(o => x > o.x + 0.001 && x < o.x + o.w - 0.001);
              const segs = v ? [[0, v.sill], [v.sill + v.h, H]] : [[0, H]];
              return segs.filter(([a, b]) => b - a > 0.01).map(([a, b], j) => <rect key={`${i}-${j}`} x={x - 0.02} y={Y(b)} width={0.04} height={b - a} fill="#475569" opacity={0.85} />);
            })}
            <rect x={0} y={Y(0.04)} width={L} height={0.04} fill="#334155" />
            <rect x={0} y={Y(H)} width={L} height={0.04} fill="#334155" />
          </>}
          {/* Vanos y nicho */}
          {vanos.map(v => (
            <g key={v.id}>
              <rect x={v.x} y={Y(v.sill + v.h)} width={v.w} height={v.h} fill="#fff" stroke="#0284c7" strokeWidth={0.025} />
              <text x={v.x + v.w / 2} y={Y(v.sill + v.h / 2)} fontSize={fs} fontWeight={800} fill="#0369a1" textAnchor="middle" dominantBaseline="middle">{PRESET_VANO[v.tipo].nombre} {f2(v.w)}×{f2(v.h)}</text>
            </g>
          ))}
          {nicho && (
            <g>
              <rect x={nicho.x} y={Y(nicho.sill + nicho.h)} width={nicho.w} height={nicho.h} fill="#1e1b4b" opacity={0.85} stroke="#f59e0b" strokeWidth={0.03} />
              <text x={nicho.x + nicho.w / 2} y={Y(nicho.sill + nicho.h / 2)} fontSize={fs} fontWeight={800} fill="#fde68a" textAnchor="middle" dominantBaseline="middle">Nicho TV {f2(nicho.w)}×{f2(nicho.h)}</text>
            </g>
          )}
          <rect x={0} y={0} width={L} height={H} fill="none" stroke="#0f172a" strokeWidth={0.03} />
          {/* Cotas */}
          <line x1={0} y1={H + 0.22} x2={L} y2={H + 0.22} stroke="#64748b" strokeWidth={0.01} />
          <text x={L / 2} y={H + 0.38} fontSize={fs * 1.1} fontWeight={800} fill="#334155" textAnchor="middle">{f2(L)} m</text>
          <line x1={-0.22} y1={0} x2={-0.22} y2={H} stroke="#64748b" strokeWidth={0.01} />
          <text x={-0.3} y={H / 2} fontSize={fs * 1.1} fontWeight={800} fill="#334155" textAnchor="middle" transform={`rotate(-90 ${-0.3} ${H / 2})`}>{f2(H)} m</text>
        </svg>
        <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="w-4 h-3 rounded-sm bg-violet-100 border border-violet-500" /> Plancha {PLANCHA_W} × {PLANCHA_H} m (P1, P2…)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-4 h-3 rounded-sm border border-violet-500" style={{ background: 'repeating-linear-gradient(45deg,#ede9fe,#ede9fe 2px,#a78bfa 2px,#a78bfa 3px)' }} /> Trozo con corte (los retazos con el mismo número salen de la misma plancha)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-4 bg-slate-600" /> Parante cada 0.61 m y jambas</span>
        </div>
        {vanos.length > 0 && (
          <div className="no-imprimir rounded-xl bg-sky-50/60 p-2.5 space-y-2">
            <p className="text-[11px] font-bold text-sky-800">Ubica las puertas y ventanas (distancia desde el borde izquierdo)</p>
            {vanos.map(v => (
              <label key={v.id} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <span className="w-24 shrink-0">{PRESET_VANO[v.tipo].nombre} {f2(v.w)} m</span>
                <input type="range" min={0} max={Math.max(0, L - v.w)} step={0.01} value={v.x} onChange={e => moverVano(v.id, parseFloat(e.target.value))} className="flex-1 accent-sky-600" />
                <span className="w-14 text-right font-mono">{f2(v.x)} m</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 4. Presupuesto ──────────────────────────────────────────────────────────
function TablaLineas({ lineas, dias, manoObra }: { lineas: LineaDrywall[]; dias: number; manoObra: number }) {
  return (
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
          {lineas.map((l, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1.5 font-bold text-slate-700">{l.nombre}</td>
              <td className="py-1.5 text-slate-400">{l.nota}</td>
              <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.cantidad}</td>
              <td className="py-1.5 pl-2 text-slate-500">{l.unidad}</td>
              <td className={`py-1.5 text-right font-mono ${l.precio ? 'text-slate-600' : 'text-amber-600'}`}>{l.precio.toFixed(2)}</td>
              <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.subtotal.toFixed(2)}</td>
            </tr>
          ))}
          <tr className="border-b border-slate-100">
            <td className="py-1.5 font-bold text-slate-700">Instalación (instalador de drywall)</td>
            <td className="py-1.5 text-slate-400">tabique 12 · cielo 15 · modular 25 m²/día</td>
            <td className="py-1.5 text-right font-mono font-bold text-slate-800">{dias}</td>
            <td className="py-1.5 pl-2 text-slate-500">día</td>
            <td className={`py-1.5 text-right font-mono ${manoObra ? 'text-slate-600' : 'text-amber-600'}`}>{dias ? (manoObra / dias).toFixed(2) : '0.00'}</td>
            <td className="py-1.5 text-right font-mono font-bold text-slate-800">{manoObra.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Presupuesto({ cot, setCot, onIrAPrecios }: { cot: CotizacionDrywall; setCot: (f: (c: CotizacionDrywall) => CotizacionDrywall) => void; onIrAPrecios?: () => void }) {
  const catalogo = useCatalogo();
  const { datos } = useEmpresa();
  const hojaRef = useRef<HTMLDivElement>(null);
  const [disenos, setDisenos] = useState<SavedTechosDesign[]>(getCachedTechosDesigns);
  useEffect(() => { fetchAllTechosDesigns().then(setDisenos).catch(() => {}); }, []);
  const techosId = safeStorage.getItem<string>(KEY_OBRA_TECHOS_ID, '') || '';
  const diseno = disenos.find(d => d.id === techosId) || null;

  const cotRes = useMemo(() => metradoPartidas(cot.partidas), [cot.partidas, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const plano = useMemo(() => {
    const niveles = safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Cimentación', 'Piso 1'];
    const elems = safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || [];
    const cielos = safeStorage.getItem<Record<string, CieloRaso>>(KEY_CIELOS, {}) || {};
    return metradoDrywall(niveles, diseno as unknown as EstructuraTechos | null, elems, cielos).filter(p => p.lineas.length > 0);
  }, [diseno, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const conPlano = cot.incluirPlano ? plano : [];

  const materiales = cotRes.materiales + conPlano.reduce((x, p) => x + p.materiales, 0);
  const manoObra = cotRes.manoObra + conPlano.reduce((x, p) => x + p.manoObra, 0);
  const dias = cotRes.dias + conPlano.reduce((x, p) => x + p.dias, 0);
  const directo = materiales + manoObra;
  const gg = directo * cot.gg / 100, util = directo * cot.util / 100, total = directo + gg + util;
  const sinPrecio = [...cotRes.lineas, ...conPlano.flatMap(p => p.lineas)].some(l => l.precio === 0) || (dias > 0 && manoObra === 0);
  const vacio = cot.partidas.length === 0 && conPlano.length === 0;

  const whatsapp = () => {
    const lineas = [
      `*Presupuesto de drywall*${cot.nombre ? ` – ${cot.nombre}` : ''}`,
      cot.cliente ? `Cliente: ${cot.cliente}` : '',
      datos.nombre ? `De: ${datos.nombre}${datos.telefono ? ` (${datos.telefono})` : ''}` : '',
      '',
      ...cot.partidas.map((p, i) => { const m = medidaPartida(p); return `${i + 1}. ${p.nombre || sistemaDe(p.sistema).corto}: ${sistemaDe(p.sistema).nombre} – ${f2(m.valor)} ${m.unidad}`; }),
      ...conPlano.map(p => `• ${p.nivel} (plano): tabiques ${f2(p.tabiquesM2)} m², cielo ${f2(p.cieloM2)} m²`),
      '',
      `Materiales: ${S(materiales)}`,
      `Mano de obra (${f2(dias)} días): ${S(manoObra)}`,
      `*Total: ${S(total)}*`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
    window.open(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank');
  };

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 no-imprimir">
        {plano.length > 0 && (
          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer bg-white rounded-xl px-3 py-2 shadow-xs">
            <input type="checkbox" checked={cot.incluirPlano} onChange={e => setCot(c => ({ ...c, incluirPlano: e.target.checked }))} /> Incluir lo dibujado en “Plano con Techos”
          </label>
        )}
        <div className="flex-1" />
        {onIrAPrecios && (
          <button onClick={onIrAPrecios} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold cursor-pointer hover:bg-amber-100"><Tag className="w-4 h-4" /> Editar precios</button>
        )}
        <button onClick={whatsapp} disabled={vacio} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700 disabled:opacity-40"><Send className="w-4 h-4" /> WhatsApp</button>
        <BotonImprimir objetivo={() => hojaRef.current} titulo="Presupuesto de drywall" etiqueta="Imprimir / PDF" />
      </div>
      {sinPrecio && !vacio && (
        <p className="no-imprimir text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
          Hay productos sin precio (en naranja). Escríbelos en Precios → “Drywall y OSB”, “Accesorios de drywall” y el jornal “Instalador de drywall”.
        </p>
      )}

      <div ref={hojaRef} className="zona-impresion imprimir-claro bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <BandaMarca />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <CabeceraEmpresa subtitulo="Presupuesto de tabiques, cielo raso y acabados en drywall" />
          <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
            <p className="font-bold text-slate-700">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            {cot.nombre && <p>Obra: {cot.nombre}</p>}
            {cot.cliente && <p>Cliente: {cot.cliente}</p>}
          </div>
        </div>

        {vacio && <p className="py-10 text-center text-sm text-slate-400">Agrega partidas en “Cotizar” (o dibuja en “Plano con Techos”) para ver el presupuesto.</p>}

        {cot.partidas.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Partidas</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {cot.partidas.map((p, i) => { const s = sistemaDe(p.sistema); const m = medidaPartida(p); return (
                <div key={p.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-base">{s.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{i + 1}. {p.nombre || s.corto}</p>
                    <p className="text-[10px] text-slate-500 truncate">{s.nombre} · {f2(p.largo)} × {f2(p.alto)} m{p.cantidad > 1 ? ` × ${p.cantidad}` : ''}{p.vanos.length ? ` · ${p.vanos.length} vano(s)` : ''}</p>
                  </div>
                  <span className="text-xs font-black text-slate-700 shrink-0">{f2(m.valor)} {m.unidad}</span>
                </div>
              ); })}
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase pt-1">Materiales e instalación</h3>
            <TablaLineas lineas={cotRes.lineas} dias={cotRes.dias} manoObra={cotRes.manoObra} />
          </div>
        )}

        {conPlano.map(p => (
          <div key={p.nivel} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">{p.nivel} · plano con Techos{diseno ? ` (${diseno.nombre})` : ''}</h3>
              <p className="text-[11px] font-bold text-slate-500">Tabiques {f2(p.tabiquesM2)} m² · cielo raso {f2(p.cieloM2)} m²</p>
            </div>
            <TablaLineas lineas={p.lineas} dias={p.dias} manoObra={p.manoObra} />
          </div>
        ))}

        {!vacio && (
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Materiales</span><span className="font-mono font-bold">{S(materiales)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Mano de obra ({f2(dias)} días)</span><span className="font-mono font-bold">{S(manoObra)}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Gastos generales
                <input type="number" min={0} value={cot.gg} onChange={e => setCot(c => ({ ...c, gg: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-12 px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(gg)}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Utilidad
                <input type="number" min={0} value={cot.util} onChange={e => setCot(c => ({ ...c, util: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-12 px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(util)}</span></div>
              <div className="flex justify-between bg-violet-600 text-white rounded-xl px-3 py-2 mt-1"><span className="font-black uppercase">Total</span><span className="font-mono font-black">{S(total)}</span></div>
            </div>
          </div>
        )}
        {!vacio && <CondicionesComerciales total={total} />}
        <p className="text-[10px] text-slate-400">Planchas de tabiques contadas por despiece (aprovechando retazos); cielos y cajones por m² + 5%. Parantes cada 0.61 m. Cuantías referenciales.</p>
      </div>
      <p className="no-imprimir text-[11px] text-slate-400 flex items-center gap-1"><Plus className="w-3 h-3" /> Las partidas con “Sumar a Obra Civil” y lo dibujado en el plano también aparecen en Obra Civil → Lista, en su piso.</p>
    </div>
  );
}
