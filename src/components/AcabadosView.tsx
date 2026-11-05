// =============================================================================
// Acabados: pintura, pisos y enchapes por ambiente.
//   1. Ambientes: medidas (o el plano de Obra Civil), puertas y ventanas, pintura de
//      paredes y techo, enchape, piso y contrazócalo.
//   2. 3D: cada ambiente con sus colores y el patrón real del cerámico / porcelanato.
//   3. Materiales: galones, empaste, cajas, pegamento, fragua, crucetas y mano de obra.
//   4. Presupuesto: formal, para imprimir o enviar por WhatsApp.
// =============================================================================
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { PaintRoller, Box, ListChecks, ClipboardList, Tag, Send, LayoutList, Sparkles } from 'lucide-react';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { CabeceraEmpresa, useEmpresa, BandaMarca, CondicionesComerciales } from '../lib/empresa';
import BotonImprimir from './common/BotonImprimir';
import { simb } from '../lib/currency';
import { formato, nombreFormato, nombreColor, COLORES_PARED, COLORES_BALDOSA, PINTURAS } from '../catalogo/acabados';
import { CotizacionAcabados, KEY_COT_ACTUAL, KEY_PESTANA, leerCotizacionActual, cotizacionEjemplo, TIPOS_PISO, esBaldosa } from './acabados/modeloAcabados';
import { metradoAcabados, MetradoAcab, totalCon, GRUPOS_LINEA, GrupoLinea, LineaAcab, CalcAmbiente } from './acabados/calculoAcabados';
import AmbientesAcabados, { ICONO_AMB } from './acabados/AmbientesAcabados';

const Acabados3D = lazy(() => import('./acabados/Acabados3D'));

const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Pestana = 'ambientes' | '3d' | 'materiales' | 'presupuesto';
const PESTANAS: Pestana[] = ['ambientes', '3d', 'materiales', 'presupuesto'];
type SetCot = (f: (c: CotizacionAcabados) => CotizacionAcabados) => void;
const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer';
const COLOR_GRUPO: Record<GrupoLinea, string> = { 'Pintura y empaste': '#e11d48', 'Pisos y enchapes': '#b45309', 'Pegamento y fragua': '#64748b', Accesorios: '#0891b2', 'Mano de obra': '#7c3aed' };

export default function AcabadosView({ onIrAPrecios }: { onIrAPrecios?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>(() => {
    const p = safeStorage.getItem<string>(KEY_PESTANA, 'ambientes');
    return (PESTANAS.includes(p as Pestana) ? p : 'ambientes') as Pestana;
  });
  useEffect(() => { safeStorage.setItem(KEY_PESTANA, pestana); }, [pestana]);
  const [cot, setCotRaw] = useState<CotizacionAcabados>(leerCotizacionActual);
  const setCot: SetCot = f => setCotRaw(c => f(c));
  const catalogo = useCatalogo();
  const r = useMemo(() => metradoAcabados(cot), [cot.ambientes, cot.rendPintura, cot.modoMO, cot.soloMO, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = totalCon(r, cot);
  // La cotización abierta se guarda con su total (lo lee "Presupuesto de obra").
  useEffect(() => { safeStorage.setItem(KEY_COT_ACTUAL, { ...cot, total: Math.round(total * 100) / 100 }); }, [cot, total]);
  const [sel, setSel] = useState<string | null>(null);
  const cargarEjemplo = () => { const ej = cotizacionEjemplo(); setCot(() => ej); setSel(ej.ambientes[0].id); };

  const tabs: { id: Pestana; label: string; corto: string; icon: any }[] = [
    { id: 'ambientes', label: 'Ambientes', corto: 'Ambientes', icon: LayoutList },
    { id: '3d', label: 'Vista 3D', corto: '3D', icon: Box },
    { id: 'materiales', label: 'Materiales', corto: 'Materiales', icon: ListChecks },
    { id: 'presupuesto', label: 'Presupuesto', corto: 'Presup.', icon: ClipboardList },
  ];
  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <div className="flex flex-row flex-nowrap items-center justify-center lg:justify-between gap-2 lg:gap-3 px-2 sm:px-4 py-1.5 lg:py-3 bg-white border-b border-slate-200">
        <div className="hidden lg:flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600"><PaintRoller className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">Acabados</h2>
            <p className="text-[11px] text-slate-500">Pintura, pisos y enchapes por ambiente: colores, formatos, 3D, materiales y presupuesto.</p>
          </div>
        </div>
        <div className="flex flex-nowrap w-full lg:w-auto lg:inline-flex p-0.5 lg:p-1 bg-slate-100 rounded-xl gap-0.5 lg:shrink-0">
          {tabs.map(t => {
            const Ic = t.icon;
            return (
              <button key={t.id} onClick={() => setPestana(t.id)} title={t.label}
                className={`flex-1 lg:flex-none min-w-0 min-h-[40px] flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 px-1 lg:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer ${pestana === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                <Ic className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-600 shrink-0" /><span className="hidden lg:inline">{t.label}</span><span className="lg:hidden truncate max-w-full">{t.corto}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {pestana === 'ambientes' && <AmbientesAcabados cot={cot} setCot={setCot} r={r} total={total} sel={sel} setSel={setSel} onEjemplo={cargarEjemplo}
          onMateriales={() => setPestana('materiales')} onPresupuesto={() => setPestana('presupuesto')} on3D={() => setPestana('3d')} />}
        {pestana === '3d' && <Vista3D cot={cot} sel={sel} setSel={setSel} onAmbientes={() => setPestana('ambientes')} onEjemplo={cargarEjemplo} />}
        {pestana === 'materiales' && <Materiales cot={cot} setCot={setCot} r={r} total={total} onIrAPrecios={onIrAPrecios} onPresupuesto={() => setPestana('presupuesto')} onAmbientes={() => setPestana('ambientes')} onEjemplo={cargarEjemplo} />}
        {pestana === 'presupuesto' && <Presupuesto cot={cot} setCot={setCot} r={r} onIrAPrecios={onIrAPrecios} />}
      </div>
    </div>
  );
}

function Vacio({ texto, onAmbientes, onEjemplo }: { texto: string; onAmbientes: () => void; onEjemplo?: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center"><PaintRoller className="w-6 h-6" /></div>
      <p className="text-sm text-slate-500 max-w-sm">{texto}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={onAmbientes} className={`${btn} bg-rose-600 text-white`}><LayoutList className="w-4 h-4" /> Ir a Ambientes</button>
        {onEjemplo && <button onClick={onEjemplo} className={`${btn} bg-slate-100 text-slate-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>}
      </div>
    </div>
  );
}

// ── 2. 3D ────────────────────────────────────────────────────────────────────
function Vista3D({ cot, sel, setSel, onAmbientes, onEjemplo }: { cot: CotizacionAcabados; sel: string | null; setSel: (id: string | null) => void; onAmbientes: () => void; onEjemplo: () => void }) {
  const [solo, setSolo] = useState<string | null>(() => (sel && cot.ambientes.some(a => a.id === sel) ? sel : null));
  if (!cot.ambientes.length) return <Vacio texto="Agrega los ambientes para verlos en 3D con sus colores y pisos." onAmbientes={onAmbientes} onEjemplo={onEjemplo} />;
  const elegir = (id: string | null) => { setSolo(id); if (id) setSel(id); };
  const a = cot.ambientes.find(x => x.id === solo);
  const chip = (id: string | null, label: string, color?: string, piso?: string) => (
    <button key={id || 'todos'} onClick={() => elegir(id)}
      className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer border shrink-0 ${solo === id ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}>
      {color && <span className="relative w-3.5 h-3.5 rounded overflow-hidden border border-black/10" style={{ background: color }}><span className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: piso }} /></span>}{label}
    </button>
  );
  return (
    <div className="h-full min-h-[460px] flex flex-col gap-2 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-1.5 sm:p-2 shadow-xs flex flex-nowrap sm:flex-wrap items-center gap-1.5 shrink-0 overflow-x-auto">
        {chip(null, 'Todos')}
        {cot.ambientes.map(x => chip(x.id, x.nombre, x.pintura.activo ? x.pintura.color : '#e7e3dc', x.piso.tipo === 'ninguno' ? '#b9b4ab' : x.piso.color))}
      </div>
      <div className="flex-1 min-h-[340px] relative">
        <Suspense fallback={<div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Cargando 3D…</div>}>
          <Acabados3D ambientes={cot.ambientes} sel={solo} />
        </Suspense>
        {a && (
          <div className="absolute top-2 left-2 max-w-[calc(100%-120px)] bg-white/95 rounded-xl shadow px-2.5 py-1.5 text-[10px] text-slate-600 space-y-0.5 pointer-events-none">
            <p className="text-xs font-black text-slate-900 truncate">{a.nombre}</p>
            {a.pintura.activo && <p className="truncate">Paredes: {nombreColor(COLORES_PARED, a.pintura.color)} · {PINTURAS.find(p => p.id === a.pintura.tipo)?.corto}</p>}
            {a.enchape.activo && <p className="truncate">Enchape: {nombreFormato(formato(a.enchape.formato))} {nombreColor(COLORES_BALDOSA, a.enchape.color)} · {f2(a.enchape.alto)} m</p>}
            <p className="truncate">Piso: {descPiso(a)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
const descPiso = (a: CotizacionAcabados['ambientes'][number]) => a.piso.tipo === 'ninguno' ? 'sin piso'
  : esBaldosa(a.piso.tipo) ? `${nombreFormato(formato(a.piso.formato))} ${nombreColor(COLORES_BALDOSA, a.piso.color)}`
  : `${TIPOS_PISO.find(t => t.id === a.piso.tipo)?.nombre} ${a.piso.tipo === 'pulido' ? '' : nombreColor(COLORES_BALDOSA, a.piso.color)}`.trim();

// ── Tabla de líneas (tabla en PC, lista en el celular) ───────────────────────
function Lineas({ lineas }: { lineas: LineaAcab[] }) {
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
                <td className="py-1.5 pr-2 text-slate-400 max-w-[320px]">{l.nota}</td>
                <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.cant}</td>
                <td className="py-1.5 pl-2 text-slate-500">{l.unidad}</td>
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
              <p className="text-[10px] text-slate-400 leading-snug break-words">{l.nota}</p>
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

// ── Metrado por ambiente ─────────────────────────────────────────────────────
function TablaAmbientes({ cs, r }: { cs: CalcAmbiente[]; r: MetradoAcab }) {
  const cols: [string, (c: CalcAmbiente) => string, string][] = [
    ['Piso', c => f2(c.piso), `${f2(r.tot.piso)}`], ['Pintura muros', c => f2(c.pintura), f2(r.tot.pintura)], ['Enchape', c => f2(c.enchape), f2(r.tot.enchape)],
    ['Techo', c => f2(c.techo), f2(r.tot.techo)], ['Contrazócalo', c => f2(c.contrazocalo), f2(r.tot.contrazocalo)],
  ];
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs break-inside-avoid">
      <h3 className="text-sm font-black text-slate-900 pb-2 mb-1 border-b border-slate-100">Metrado por ambiente <span className="text-[11px] font-bold text-slate-400">(m² · contrazócalo en ml)</span></h3>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
            <th className="text-left py-1.5 font-black">Ambiente</th><th className="text-left py-1.5 font-black">Acabado de piso</th>
            {cols.map(([k]) => <th key={k} className="text-right py-1.5 pl-2 font-black whitespace-nowrap">{k}</th>)}
          </tr></thead>
          <tbody>
            {cs.map(c => (
              <tr key={c.amb.id} className="border-b border-slate-100">
                <td className="py-1.5 pr-2 font-bold text-slate-700"><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle border border-black/10" style={{ background: c.amb.pintura.activo ? c.amb.pintura.color : '#e7e3dc' }} />{c.amb.nombre}</td>
                <td className="py-1.5 pr-2 text-slate-500">{descPiso(c.amb)}</td>
                {cols.map(([k, f]) => <td key={k} className="py-1.5 pl-2 text-right font-mono text-slate-700">{f(c)}</td>)}
              </tr>
            ))}
            <tr className="font-black text-slate-900"><td className="py-1.5" colSpan={2}>Total</td>{cols.map(([k, , t]) => <td key={k} className="py-1.5 pl-2 text-right font-mono">{t}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-slate-100">
        {cs.map(c => (
          <div key={c.amb.id} className="py-2">
            <p className="text-xs font-black text-slate-800"><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle border border-black/10" style={{ background: c.amb.pintura.activo ? c.amb.pintura.color : '#e7e3dc' }} />{c.amb.nombre} <span className="font-bold text-slate-400">· {descPiso(c.amb)}</span></p>
            <p className="text-[11px] font-mono text-slate-600">Piso {f2(c.piso)} · Muros {f2(c.pintura)} · Enchape {f2(c.enchape)} · Techo {f2(c.techo)} · Cz {f2(c.contrazocalo)} ml</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. Materiales ────────────────────────────────────────────────────────────
function Materiales({ cot, setCot, r, total, onIrAPrecios, onPresupuesto, onAmbientes, onEjemplo }: { cot: CotizacionAcabados; setCot: SetCot; r: MetradoAcab; total: number; onIrAPrecios?: () => void; onPresupuesto: () => void; onAmbientes: () => void; onEjemplo: () => void }) {
  const hojaRef = useRef<HTMLDivElement>(null);
  if (!cot.ambientes.length) return <Vacio texto="Los materiales salen de los ambientes: agrega sus medidas y acabados." onAmbientes={onAmbientes} onEjemplo={onEjemplo} />;
  const sinPrecio = r.lineas.some(l => l.precio === 0);
  const grupos = GRUPOS_LINEA.map(g => ({ g, ls: r.lineas.filter(l => l.grupo === g) })).filter(x => x.ls.length);
  const kpi: [string, string, string][] = [['Pintura', `${r.tot.galones} gal`, `${f2(r.tot.pintura + r.tot.techo)} m² muros y techos`], ['Cajas de piso y enchape', `${r.tot.cajas}`, `${f2(r.tot.piso)} m² piso · ${f2(r.tot.enchape)} m² enchape`], ['Materiales', S(r.materiales), cot.soloMO ? 'los compra el cliente' : `${r.lineas.filter(l => l.grupo !== 'Mano de obra').length} productos`], ['Mano de obra', S(r.manoObra), cot.modoMO === 'jornal' ? 'por jornal' : 'por m² y ml']];
  return (
    <div className="p-2 sm:p-4 max-w-[1600px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_330px] xl:gap-4 xl:items-start">
      <div className="space-y-3 min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {kpi.map(([k, v, n], i) => (
            <div key={k} className="bg-white rounded-2xl p-3 shadow-xs min-w-0 border-l-4" style={{ borderLeftColor: ['#e11d48', '#b45309', '#0891b2', '#7c3aed'][i] }}>
              <p className="text-[10px] font-black uppercase text-slate-400 truncate">{k}</p>
              <p className="text-lg font-black font-mono text-slate-900 leading-tight truncate">{v}</p>
              <p className="text-[10px] text-slate-500 truncate">{n}</p>
            </div>
          ))}
        </div>
        {sinPrecio && <p className="text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">Hay productos sin precio (en naranja). Escríbelos en Precios → “Acabados” o en “Mano de obra”.</p>}
        <div ref={hojaRef} className="zona-impresion imprimir-claro space-y-3">
          <TablaAmbientes cs={r.ambientes} r={r} />
          {grupos.map(({ g, ls }) => (
            <div key={g} className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs break-inside-avoid">
              <div className="flex flex-nowrap items-center gap-2 pb-2 mb-1 border-b border-slate-100">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLOR_GRUPO[g] }} />
                <h3 className="text-sm font-black text-slate-900 flex-1 min-w-0 truncate">{g}</h3>
                <span className="text-xs font-mono font-black text-slate-700">{S(ls.reduce((s, l) => s + l.subtotal, 0))}</span>
              </div>
              <Lineas lineas={ls} />
            </div>
          ))}
        </div>
        <div className="xl:hidden sticky bottom-3 z-20 ml-auto w-full lg:w-[420px] bg-slate-900/95 backdrop-blur text-white rounded-2xl shadow-xl px-4 py-2.5 flex flex-nowrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">Materiales {S(r.materiales)} · M. de obra {S(r.manoObra)}</p>
            <p className="text-lg font-black font-mono truncate">{S(total)}</p>
          </div>
          <button onClick={onPresupuesto} className={`${btn} bg-rose-500 text-white hover:bg-rose-400 shrink-0`}><ClipboardList className="w-4 h-4" /> Presupuesto</button>
        </div>
        <div className="xl:hidden"><Ajustes cot={cot} setCot={setCot} onIrAPrecios={onIrAPrecios} hoja={() => hojaRef.current} /></div>
      </div>
      <aside className="hidden xl:block sticky top-4 space-y-3">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total con GG {cot.gg}% y utilidad {cot.util}%</p>
          <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-2"><span className="text-slate-400">Materiales</span><span className={`font-mono font-bold ${cot.soloMO ? 'line-through text-slate-500' : ''}`}>{S(r.materiales)}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Mano de obra</span><span className="font-mono font-bold">{S(r.manoObra)}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Pintura</span><span className="font-mono font-bold">{r.tot.galones} galones</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Cerámico y pisos</span><span className="font-mono font-bold">{r.tot.cajas} cajas</span></div>
          </div>
          <button onClick={onPresupuesto} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-black cursor-pointer hover:bg-rose-400"><ClipboardList className="w-4 h-4" /> Ver presupuesto</button>
        </div>
        <Ajustes cot={cot} setCot={setCot} onIrAPrecios={onIrAPrecios} hoja={() => hojaRef.current} />
      </aside>
    </div>
  );
}

function Ajustes({ cot, setCot, onIrAPrecios, hoja }: { cot: CotizacionAcabados; setCot: SetCot; onIrAPrecios?: () => void; hoja: () => HTMLElement | null }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <p className="text-xs font-black text-slate-800">Cómo se calcula</p>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-700">Rendimiento de la pintura
        <input type="number" min={15} max={60} value={cot.rendPintura} onChange={e => setCot(c => ({ ...c, rendPintura: Math.max(15, Math.min(60, parseFloat(e.target.value) || 35)) }))} className="ml-auto w-16 min-h-[36px] px-2 rounded-lg bg-slate-100 font-mono text-right" /> m²/gal
      </label>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mano de obra</p>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
          {([['m2', 'Por m²'], ['jornal', 'Por jornal']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setCot(c => ({ ...c, modoMO: v }))} className={`min-h-[36px] rounded-lg text-xs font-bold cursor-pointer ${cot.modoMO === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-700 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-rose-600" checked={cot.soloMO} onChange={e => setCot(c => ({ ...c, soloMO: e.target.checked }))} /> Solo mano de obra (el cliente compra los materiales)</label>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <BotonImprimir objetivo={hoja} titulo={`Materiales de acabados ${cot.nombre || ''}`} etiqueta="Imprimir" />
      </div>
      <p className="text-[10px] text-slate-400 leading-snug">Pintura: m² × manos ÷ rendimiento (35–40 m²/gal). Empaste 18 m² por bolsa (2 pasadas), imprimante 30 m²/gal. Pegamento 4.5 m² por bolsa (3.5 en porcelanato); fragua por la fórmula de junta × espesor; niveladores en formatos de 60 cm o más.</p>
    </div>
  );
}

// ── 4. Presupuesto ───────────────────────────────────────────────────────────
function Presupuesto({ cot, setCot, r, onIrAPrecios }: { cot: CotizacionAcabados; setCot: SetCot; r: MetradoAcab; onIrAPrecios?: () => void }) {
  const { datos } = useEmpresa();
  const hojaRef = useRef<HTMLDivElement>(null);
  const directo = r.directo;
  const gg = directo * cot.gg / 100, util = directo * cot.util / 100, total = directo + gg + util;
  const sinPrecio = r.lineas.some(l => l.precio === 0);
  const vacio = cot.ambientes.length === 0;
  const lineasVer = cot.soloMO ? r.lineas.filter(l => l.grupo === 'Mano de obra') : r.lineas;
  const grupos = GRUPOS_LINEA.map(g => ({ g, ls: lineasVer.filter(l => l.grupo === g) })).filter(x => x.ls.length);
  const whatsapp = () => {
    const lineas = [
      `*Presupuesto de acabados*${cot.nombre ? ` – ${cot.nombre}` : ''}`,
      cot.cliente ? `Cliente: ${cot.cliente}` : '',
      datos.nombre ? `De: ${datos.nombre}${datos.telefono ? ` (${datos.telefono})` : ''}` : '',
      '',
      ...r.ambientes.map(c => `• ${c.amb.nombre}: piso ${descPiso(c.amb)} ${f2(c.piso)} m²${c.pintura ? ` · paredes ${nombreColor(COLORES_PARED, c.amb.pintura.color)} ${f2(c.pintura)} m²` : ''}${c.enchape ? ` · enchape ${f2(c.enchape)} m²` : ''}`),
      '',
      cot.soloMO ? 'Materiales: los compra el cliente' : `Materiales: ${S(r.materiales)}`,
      `Mano de obra: ${S(r.manoObra)}`,
      `*Total: ${S(total)}*`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
    window.open(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank');
  };
  const chk = 'inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-600 cursor-pointer bg-white rounded-xl px-3 shadow-xs';
  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 no-imprimir">
        <label className={chk}><input type="checkbox" className="w-4 h-4 accent-rose-600" checked={cot.soloMO} onChange={e => setCot(c => ({ ...c, soloMO: e.target.checked }))} /> Solo mano de obra</label>
        <div className="flex-1" />
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <button onClick={whatsapp} disabled={vacio} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40`}><Send className="w-4 h-4" /> WhatsApp</button>
        <BotonImprimir objetivo={() => hojaRef.current} titulo="Presupuesto de acabados" etiqueta="Imprimir / PDF" />
      </div>
      {sinPrecio && !vacio && <p className="no-imprimir text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">Hay productos sin precio (en naranja). Escríbelos en Precios → “Acabados”.</p>}
      <div ref={hojaRef} className="zona-impresion imprimir-claro bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <BandaMarca />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <CabeceraEmpresa subtitulo="Presupuesto de acabados: pintura, pisos y enchapes" />
          <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
            <p className="font-bold text-slate-700">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            {cot.nombre && <p>Obra: {cot.nombre}</p>}
            {cot.cliente && <p>Cliente: {cot.cliente}</p>}
          </div>
        </div>
        {vacio && <p className="py-10 text-center text-sm text-slate-400">Agrega los ambientes para ver el presupuesto.</p>}
        {!vacio && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Alcance por ambiente</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {r.ambientes.map(c => {
                const a = c.amb, Ic = ICONO_AMB[a.tipo];
                return (
                  <div key={a.id} className="rounded-xl bg-slate-50 p-2.5 break-inside-avoid min-w-0">
                    <div className="flex flex-nowrap items-center gap-2 mb-1">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-black/10" style={{ background: a.pintura.activo ? a.pintura.color : '#e7e3dc' }}><Ic className="w-4 h-4 text-slate-700/80" /></span>
                      <p className="text-xs font-black text-slate-900 flex-1 min-w-0 truncate">{a.nombre}</p>
                      <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">{f2(c.area)} m² · h {f2(a.alto)} m</span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-0.5 leading-snug">
                      {c.piso > 0 && <li><Punto c={a.piso.color} /> Piso: {descPiso(a)} – {f2(c.piso)} m²{c.contrazocalo ? ` + contrazócalo ${f2(c.contrazocalo)} ml` : ''}</li>}
                      {c.pintura > 0 && <li><Punto c={a.pintura.color} /> Paredes: {a.pintura.empaste ? 'empaste, ' : ''}{PINTURAS.find(p => p.id === a.pintura.tipo)?.corto.toLowerCase()} {nombreColor(COLORES_PARED, a.pintura.color)}, {a.pintura.manos} mano{a.pintura.manos === 1 ? '' : 's'} – {f2(c.pintura)} m²</li>}
                      {c.enchape > 0 && <li><Punto c={a.enchape.color} /> Enchape: {nombreFormato(formato(a.enchape.formato))} {nombreColor(COLORES_BALDOSA, a.enchape.color)}, {a.enchape.desde > 0 ? `desde ${f2(a.enchape.desde)} m, ` : ''}alto {f2(c.enchapeAlto)} m – {f2(c.enchape)} m²</li>}
                      {c.techo > 0 && <li><Punto c={a.techo.color} /> Techo: {a.techo.empaste ? 'empaste y ' : ''}pintura {nombreColor(COLORES_PARED, a.techo.color)} – {f2(c.techo)} m²</li>}
                    </ul>
                  </div>
                );
              })}
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase pt-1">{cot.soloMO ? 'Mano de obra' : 'Materiales y mano de obra'}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
                    <th className="text-left py-1.5 font-black">Descripción</th>
                    <th className="text-right py-1.5 font-black">Cant.</th>
                    <th className="text-left py-1.5 pl-2 font-black">Und.</th>
                    <th className="text-right py-1.5 font-black">P. unit.</th>
                    <th className="text-right py-1.5 font-black">Parcial</th>
                  </tr>
                </thead>
                <tbody>{grupos.map(({ g, ls }) => <GrupoFilas key={g} g={g} ls={ls} />)}</tbody>
              </table>
            </div>
          </div>
        )}
        {!vacio && (
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-1 text-xs">
              {!cot.soloMO && <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Materiales</span><span className="font-mono font-bold">{S(r.materiales)}</span></div>}
              <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Mano de obra</span><span className="font-mono font-bold">{S(r.manoObra)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Gastos generales
                <input type="number" min={0} value={cot.gg} onChange={e => setCot(c => ({ ...c, gg: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(gg)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Utilidad
                <input type="number" min={0} value={cot.util} onChange={e => setCot(c => ({ ...c, util: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(util)}</span></div>
              <div className="flex flex-nowrap justify-between gap-2 bg-rose-600 text-white rounded-xl px-3 py-2 mt-1"><span className="font-black uppercase">Total</span><span className="font-mono font-black">{S(total)}</span></div>
            </div>
          </div>
        )}
        {!vacio && <CondicionesComerciales total={total} />}
        {!vacio && (
          <div className="text-[10px] text-slate-400 space-y-0.5">
            <p>Áreas de pared descontando puertas y ventanas; pintura con {cot.rendPintura} m² por galón y mano. Cerámicos y porcelanatos en cajas completas con su desperdicio por cortes; el contrazócalo de cerámico se corta del mismo piso.</p>
            <p>{cot.soloMO ? 'Los materiales los compra el cliente según la lista entregada. ' : ''}No incluye tarrajeo, contrapiso, picado ni retiro de acabados existentes, salvo que se indique. Los tonos pueden variar según el lote del fabricante.</p>
          </div>
        )}
      </div>
    </div>
  );
}
const Punto = ({ c }: { c: string }) => <span className="inline-block w-2 h-2 rounded-full align-middle mr-0.5 border border-black/10" style={{ background: c }} />;
function GrupoFilas({ g, ls }: { g: GrupoLinea; ls: LineaAcab[] }) {
  return (
    <>
      <tr className="break-inside-avoid"><td colSpan={5} className="pt-3 pb-1">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase" style={{ color: COLOR_GRUPO[g] }}><span className="w-2 h-2 rounded-full" style={{ background: COLOR_GRUPO[g] }} />{g}</span>
        <span className="float-right font-mono font-black text-slate-500">{ls.reduce((s, l) => s + l.subtotal, 0).toFixed(2)}</span>
      </td></tr>
      {ls.map((l, i) => (
        <tr key={i} className="border-b border-slate-100">
          <td className="py-1.5 pr-2 font-bold text-slate-700">{l.nombre}</td>
          <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.cant}</td>
          <td className="py-1.5 pl-2 text-slate-500">{l.unidad}</td>
          <td className={`py-1.5 text-right font-mono ${l.precio ? 'text-slate-600' : 'text-amber-600'}`}>{l.precio.toFixed(2)}</td>
          <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.subtotal.toFixed(2)}</td>
        </tr>
      ))}
    </>
  );
}
