// =============================================================================
// Electricidad: instalaciones eléctricas interiores (domiciliarias y comerciales,
// 220 V monofásico, CNE – Utilización).
//   1. Plano: puntos, circuitos y tuberías en planta, trazado automático, avisos CNE.
//      El fondo puede venir de Obra Civil / Drywall, Gasfitería, Melamina o Techos.
//   2. 3D / Isométrico: tuberías por el techo y el piso, cajas y tablero.
//   3. Cuadro de cargas: potencia instalada, máxima demanda, protecciones y unifilar.
//   4. Materiales: conductores, tubos, cajas, dispositivos, tablero, pozo y mano de obra.
//   5. Presupuesto: formal, para imprimir o enviar por WhatsApp.
// =============================================================================
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Zap, Box, ListChecks, ClipboardList, Tag, Send, Map as MapIc, Eye, EyeOff, Sparkles, Gauge } from 'lucide-react';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { CabeceraEmpresa, useEmpresa, BandaMarca, CondicionesComerciales } from '../lib/empresa';
import BotonImprimir from './common/BotonImprimir';
import { simb } from '../lib/currency';
import { NOMBRE_CABLE, NOMBRE_TUBO } from '../catalogo/electricidad';
import {
  CotizacionEle, KEY_COT_ACTUAL, KEY_PESTANA, KEY_ORIGEN, ALIM, PT, COLOR_ALIM, COLOR_PT, leerCotizacionActual, cotizacionEjemplo, defPunto, esEspecial, Pt,
} from './electricidad/modeloElectricidad';
import { metradoEle, MetradoEle, totalCon, GRUPOS_LINEA, GrupoLinea, LineaEle, trazarAutomatico, sugerirCircuitos, avisosCNE, infoRutas, redimensionar, Cuadro } from './electricidad/calculoElectricidad';
import PlanoElectrico from './electricidad/PlanoElectrico';
import type { Visibles3D } from './electricidad/Electricidad3D';
import { IconoPunto } from './electricidad/SimboloElectrico';

const Electricidad3D = lazy(() => import('./electricidad/Electricidad3D'));

const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const n0 = (n: number) => Math.round(n).toLocaleString('es-PE');
type Pestana = 'plano' | '3d' | 'cargas' | 'materiales' | 'presupuesto';
const PESTANAS: Pestana[] = ['plano', '3d', 'cargas', 'materiales', 'presupuesto'];
type SetCot = (f: (c: CotizacionEle) => CotizacionEle) => void;
const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer';
const pulg = (d: string) => `${d.replace('1/2', '½').replace('3/4', '¾').replace('1 1/4', '1¼')}"`;
const COLOR_GRUPO: Record<GrupoLinea, string> = {
  Conductores: '#dc2626', 'Tuberías y accesorios': '#64748b', Cajas: '#0891b2', Dispositivos: '#d97706', 'Tablero y protecciones': '#334155',
  'Pozo a tierra': '#15803d', Consumibles: '#94a3b8', Luminarias: '#ca8a04', 'Mano de obra': '#7c3aed',
};

function useMetrado(cot: CotizacionEle) {
  const catalogo = useCatalogo();
  return useMemo(() => metradoEle(cot), [cot.puntos, cot.rutas, cot.circuitos, cot.merma, cot.cable, cot.tubo, cot.incluirLuminarias, cot.pruebas, cot.modoMO, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function ElectricidadView({ onIrAPrecios }: { onIrAPrecios?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>(() => {
    if (safeStorage.getItem<string>(KEY_ORIGEN, '')) return 'plano';
    const p = safeStorage.getItem<string>(KEY_PESTANA, 'plano');
    return (PESTANAS.includes(p as Pestana) ? p : 'plano') as Pestana;
  });
  useEffect(() => { safeStorage.setItem(KEY_PESTANA, pestana); }, [pestana]);
  const [cot, setCotRaw] = useState<CotizacionEle>(leerCotizacionActual);
  useEffect(() => { safeStorage.setItem(KEY_COT_ACTUAL, cot); }, [cot]);
  // Cada cambio recalcula interruptor, sección y tubo de los circuitos que no se fijaron a mano.
  const setCot: SetCot = f => setCotRaw(c => redimensionar(f(c)));
  const r = useMetrado(cot);
  const duchas = useMemo<Pt[]>(() => cot.fondo.refs.filter(x => x.gas === 'ducha').map(x => ({ x: x.x, y: x.y })), [cot.fondo.refs]);
  const cargarEjemplo = () => { const ej = cotizacionEjemplo(); const b = { ...ej, ...sugerirCircuitos(ej) }; const t = trazarAutomatico(b); setCot(() => ({ ...b, rutas: t.rutas, puntos: t.puntos })); };

  const tabs: { id: Pestana; label: string; corto: string; icon: any }[] = [
    { id: 'plano', label: 'Plano', corto: 'Plano', icon: MapIc },
    { id: '3d', label: '3D / Isométrico', corto: '3D', icon: Box },
    { id: 'cargas', label: 'Cuadro de cargas', corto: 'Cargas', icon: Gauge },
    { id: 'materiales', label: 'Materiales', corto: 'Material', icon: ListChecks },
    { id: 'presupuesto', label: 'Presupuesto', corto: 'Presup.', icon: ClipboardList },
  ];
  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <div className="oculto-en-dibujo flex flex-row flex-nowrap items-center justify-center lg:justify-between gap-2 lg:gap-3 px-2 sm:px-4 py-1.5 lg:py-3 bg-white border-b border-slate-200">
        <div className="hidden lg:flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-400/15 text-amber-600"><Zap className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">Electricidad</h2>
            <p className="text-[11px] text-slate-500 truncate">Luces, tomacorrientes y fuerza: plano, circuitos, cuadro de cargas, materiales y presupuesto (CNE).</p>
          </div>
        </div>
        <div className="flex flex-nowrap w-full lg:w-auto lg:inline-flex p-0.5 lg:p-1 bg-slate-100 rounded-xl gap-0.5 lg:shrink-0">
          {tabs.map(t => {
            const Ic = t.icon;
            return (
              <button key={t.id} onClick={() => setPestana(t.id)} title={t.label}
                className={`flex-1 lg:flex-none min-w-0 min-h-[40px] flex flex-col lg:flex-row items-center justify-center gap-0.5 lg:gap-1.5 px-1 lg:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer ${pestana === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                <Ic className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" /><span className="hidden lg:inline">{t.label}</span><span className="lg:hidden truncate max-w-full">{t.corto}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {pestana === 'plano' && <PlanoElectrico cot={cot} setCot={setCot} r={r} duchas={duchas} onPresupuesto={() => setPestana('presupuesto')} onMateriales={() => setPestana('materiales')} onCuadro={() => setPestana('cargas')} />}
        {pestana === '3d' && <Vista3D cot={cot} setCot={setCot} r={r} onPlano={() => setPestana('plano')} onEjemplo={cargarEjemplo} />}
        {pestana === 'cargas' && <CuadroCargas cot={cot} setCot={setCot} r={r} onPlano={() => setPestana('plano')} onEjemplo={cargarEjemplo} />}
        {pestana === 'materiales' && <Materiales cot={cot} setCot={setCot} r={r} onIrAPrecios={onIrAPrecios} onPresupuesto={() => setPestana('presupuesto')} onPlano={() => setPestana('plano')} />}
        {pestana === 'presupuesto' && <Presupuesto cot={cot} setCot={setCot} r={r} duchas={duchas} onIrAPrecios={onIrAPrecios} />}
      </div>
    </div>
  );
}

function Vacio({ texto, onPlano, onEjemplo }: { texto: string; onPlano: () => void; onEjemplo?: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center"><Zap className="w-6 h-6" /></div>
      <p className="text-sm text-slate-500 max-w-sm">{texto}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={onPlano} className={`${btn} bg-amber-400 text-slate-950`}><MapIc className="w-4 h-4" /> Ir al plano</button>
        {onEjemplo && <button onClick={onEjemplo} className={`${btn} bg-slate-100 text-slate-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>}
      </div>
    </div>
  );
}

// ── 2. 3D ───────────────────────────────────────────────────────────────────
function Vista3D({ cot, setCot, r, onPlano, onEjemplo }: { cot: CotizacionEle; setCot: SetCot; r: MetradoEle; onPlano: () => void; onEjemplo: () => void }) {
  const [ver, setVer] = useState<Visibles3D>({});
  // Sin tuberías trazadas: se muestra el trazado automático como vista previa (no se guarda hasta "Usar").
  const previa = useMemo(() => {
    if (cot.rutas.length || !cot.puntos.some(p => !esEspecial(p.tipo))) return null;
    if (!cot.puntos.some(p => p.tipo === 'tablero')) return { sinTablero: true as const };
    let b = cot;
    if (b.puntos.some(p => !esEspecial(p.tipo) && !b.circuitos.some(c => c.id === p.circuito))) b = { ...b, ...sugerirCircuitos(b) };
    const t = trazarAutomatico(b);
    if (!t.rutas.length) return null;
    const c2 = { ...b, rutas: t.rutas, puntos: t.puntos };
    return { sinTablero: false as const, cot: c2, info: infoRutas(c2, r.cuadro.seccionAlim) };
  }, [cot, r.cuadro.seccionAlim]);
  const vista = previa && !previa.sinTablero ? previa.cot : cot;
  if (!cot.puntos.length) return <Vacio texto="Pon los puntos y traza las tuberías en el Plano para verlas en 3D." onPlano={onPlano} onEjemplo={onEjemplo} />;
  const on = (k: string) => ver[k] !== false;
  const chip = (k: string, label: string, color?: string, extra?: string) => (
    <button key={k} onClick={() => setVer(v => ({ ...v, [k]: !on(k) }))}
      className={`min-h-[34px] inline-flex items-center gap-1.5 px-2 rounded-lg text-[11px] font-bold cursor-pointer border ${on(k) ? 'bg-white shadow-xs text-slate-800 border-slate-200' : 'bg-slate-100 text-slate-400 border-transparent'}`}>
      {color ? <span className="w-2.5 h-2.5 rounded-full" style={{ background: on(k) ? color : '#cbd5e1' }} /> : on(k) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}{label}
      {extra && <span className="hidden sm:inline font-semibold text-slate-400 truncate max-w-[120px]">{extra}</span>}
    </button>
  );
  return (
    <div className="h-full min-h-[480px] flex flex-col gap-2 sm:gap-3 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xs flex flex-wrap items-center gap-1.5 shrink-0">
        {vista.circuitos.map(c => chip(c.id, c.nombre, c.color, c.desc))}
        {vista.rutas.some(t => t.circuito === ALIM) && chip(ALIM, 'Alimentador', COLOR_ALIM)}
        {vista.rutas.some(t => t.circuito === PT) && chip(PT, 'Tierra', COLOR_PT)}
        <span className="hidden sm:block w-px h-6 bg-slate-200 mx-0.5" />
        {chip('puntos', 'Puntos')}
        {chip('muros', 'Muros')}
      </div>
      {previa && (previa.sinTablero
        ? <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 flex flex-wrap items-center gap-2 shrink-0">Pon el tablero (TD) en el Plano para ver las tuberías en 3D.<button type="button" onClick={onPlano} className="ml-auto min-h-[36px] px-3 rounded-lg bg-amber-400 text-slate-950 cursor-pointer">Ir al Plano</button></div>
        : <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 flex flex-wrap items-center gap-2 shrink-0">
            <span className="flex-1 min-w-[180px]">Vista previa: tuberías trazadas automáticamente. Aún no están en tu plano ni en el presupuesto.</span>
            <button type="button" onClick={() => { const c2 = previa.cot; setCot(() => c2); }} className="min-h-[36px] px-3 rounded-lg bg-amber-400 text-slate-950 cursor-pointer">Usar este trazado</button>
          </div>)}
      <div className="flex-1 min-h-[360px]">
        <Suspense fallback={<div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Cargando 3D…</div>}>
          <Electricidad3D cot={vista} ver={ver} info={previa && !previa.sinTablero ? previa.info : r.info} />
        </Suspense>
      </div>
    </div>
  );
}

// ── 3. Cuadro de cargas ─────────────────────────────────────────────────────
function Unifilar({ cot, q }: { cot: CotizacionEle; q: Cuadro }) {
  const fil = q.filas.filter(f => f.puntos > 0);
  const col = 112, x0 = 200, W = x0 + Math.max(1, fil.length) * col + 20, H = 330;
  const yBus = 128;
  const tm = (x: number, y: number, c: string) => <g><line x1={x} y1={y} x2={x} y2={y + 10} stroke="#334155" strokeWidth={2} /><path d={`M${x} ${y + 10} L${x + 9} ${y + 26}`} stroke={c} strokeWidth={2.5} /><circle cx={x} cy={y + 10} r={2.5} fill="#334155" /><line x1={x} y1={y + 30} x2={x} y2={y + 40} stroke="#334155" strokeWidth={2} /><rect x={x - 6} y={y + 14} width={4} height={6} fill="none" stroke="#334155" strokeWidth={1} /></g>;
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: Math.min(W, 260 + fil.length * 92), width: '100%' }} className="h-auto" fontFamily="system-ui">
        {/* Acometida y medidor */}
        <rect x={20} y={40} width={56} height={42} rx={6} fill="#fff" stroke="#334155" strokeWidth={1.6} />
        <text x={48} y={66} fontSize={12} fontWeight={900} textAnchor="middle" fill="#334155">kWh</text>
        <text x={48} y={30} fontSize={10} fontWeight={800} textAnchor="middle" fill="#64748b">Medidor</text>
        <line x1={76} y1={61} x2={120} y2={61} stroke={COLOR_ALIM} strokeWidth={3} />
        <text x={98} y={100} fontSize={9} fontWeight={700} textAnchor="middle" fill="#475569">2-1×{q.seccionAlim} mm²</text>
        <text x={98} y={112} fontSize={9} fontWeight={700} textAnchor="middle" fill="#475569">+1×{Math.min(16, q.seccionAlim)} (T) Ø{pulg(q.tuboAlim)}</text>
        {/* Interruptor general */}
        <g transform="rotate(-90 140 61)">{tm(120, 41, '#334155')}</g>
        <text x={150} y={36} fontSize={10} fontWeight={900} textAnchor="middle" fill="#0f172a">IG 2×{q.ig} A</text>
        <line x1={160} y1={61} x2={180} y2={61} stroke="#334155" strokeWidth={2} />
        <line x1={180} y1={61} x2={180} y2={yBus} stroke="#334155" strokeWidth={2} />
        {/* Barra */}
        <line x1={180} y1={yBus} x2={W - 30} y2={yBus} stroke="#0f172a" strokeWidth={5} strokeLinecap="round" />
        <text x={186} y={yBus - 8} fontSize={10} fontWeight={900} fill="#0f172a">TD · 220 V · {(q.md / 1000).toFixed(2)} kW</text>
        {fil.map((f, i) => {
          const x = x0 + i * col + col / 2, c = f.c, dif = c.diferencial && c.uso !== 'debil';
          if (c.uso === 'debil') return (
            <g key={c.id}>
              <line x1={x} y1={yBus} x2={x} y2={yBus + 14} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 3" />
              <rect x={x - 40} y={yBus + 16} width={80} height={44} rx={8} fill="#f8fafc" stroke={c.color} strokeWidth={1.5} />
              <text x={x} y={yBus + 34} fontSize={11} fontWeight={900} textAnchor="middle" fill={c.color}>{c.nombre}</text>
              <text x={x} y={yBus + 50} fontSize={9} fontWeight={700} textAnchor="middle" fill="#64748b">TV y datos</text>
            </g>
          );
          const grupo = q.diferenciales.find(d => d.circ.includes(c.nombre));
          const cols = grupo ? grupo.circ.map(n => fil.findIndex(k => k.c.nombre === n)).filter(k => k >= 0) : [];
          const primero = grupo && cols[0] === i;
          const xa = x0 + Math.min(...(cols.length ? cols : [i])) * col + col / 2, xb = x0 + Math.max(...(cols.length ? cols : [i])) * col + col / 2;
          return (
            <g key={c.id}>
              {dif && grupo ? <>
                {primero && <><line x1={(xa + xb) / 2} y1={yBus} x2={(xa + xb) / 2} y2={yBus + 10} stroke="#334155" strokeWidth={2} />
                  <rect x={Math.min(xa - 16, (xa + xb) / 2 - 32)} y={yBus + 10} width={Math.max(xb - xa + 32, 64)} height={30} rx={5} fill="#ecfeff" stroke="#0891b2" strokeWidth={1.6} />
                  <text x={(xa + xb) / 2} y={yBus + 23} fontSize={9} fontWeight={900} textAnchor="middle" fill="#0891b2">ID 2×{grupo.amp} A</text>
                  <text x={(xa + xb) / 2} y={yBus + 35} fontSize={8} fontWeight={700} textAnchor="middle" fill="#0891b2">30 mA</text></>}
                <line x1={x} y1={yBus + 40} x2={x} y2={yBus + 50} stroke="#334155" strokeWidth={2} />
              </> : <line x1={x} y1={yBus} x2={x} y2={yBus + 50} stroke="#334155" strokeWidth={2} />}
              {tm(x, yBus + 50, c.color)}
              <line x1={x} y1={yBus + 90} x2={x} y2={yBus + 120} stroke={c.color} strokeWidth={3} />
              <path d={`M${x - 6} ${yBus + 114} L${x} ${yBus + 124} L${x + 6} ${yBus + 114}`} fill="none" stroke={c.color} strokeWidth={2.5} />
              <text x={x + 14} y={yBus + 75} fontSize={10} fontWeight={900} fill="#0f172a">2×{c.breaker} A</text>
              <text x={x} y={yBus + 142} fontSize={12} fontWeight={900} textAnchor="middle" fill={c.color}>{c.nombre}</text>
              <text x={x} y={yBus + 156} fontSize={9} fontWeight={700} textAnchor="middle" fill="#475569">{c.desc.length > 18 ? c.desc.slice(0, 17) + '…' : c.desc}</text>
              <text x={x} y={yBus + 170} fontSize={9} fontWeight={700} textAnchor="middle" fill="#64748b">2-1×{c.seccion}+1×{c.seccion}(T)</text>
              <text x={x} y={yBus + 182} fontSize={9} fontWeight={700} textAnchor="middle" fill="#64748b">{NOMBRE_CABLE[cot.cable].split(' ')[0]} · Ø{pulg(c.tubo)}</text>
              <text x={x} y={yBus + 196} fontSize={9} fontWeight={800} textAnchor="middle" fill="#0f172a">{n0(f.ci)} W</text>
            </g>
          );
        })}
        {/* Tierra */}
        <line x1={120} y1={yBus + 60} x2={170} y2={yBus + 60} stroke={COLOR_PT} strokeWidth={2.5} strokeDasharray="8 3 2 3" />
        <line x1={120} y1={yBus + 60} x2={120} y2={yBus + 90} stroke={COLOR_PT} strokeWidth={2.5} />
        <path d={`M104 ${yBus + 90} L136 ${yBus + 90} M110 ${yBus + 97} L130 ${yBus + 97} M116 ${yBus + 104} L124 ${yBus + 104}`} stroke={COLOR_PT} strokeWidth={2.5} strokeLinecap="round" />
        <text x={120} y={yBus + 122} fontSize={9} fontWeight={800} textAnchor="middle" fill={COLOR_PT}>Pozo a tierra</text>
        <text x={120} y={yBus + 134} fontSize={9} fontWeight={700} textAnchor="middle" fill="#64748b">R ≤ 25 Ω</text>
        <rect x={170} y={yBus + 54} width={22} height={12} rx={2} fill={COLOR_PT} /><text x={181} y={yBus + 80} fontSize={8} fontWeight={800} textAnchor="middle" fill={COLOR_PT}>Barra T</text>
      </svg>
    </div>
  );
}

function CuadroCargas({ cot, setCot, r, onPlano, onEjemplo }: { cot: CotizacionEle; setCot: SetCot; r: MetradoEle; onPlano: () => void; onEjemplo: () => void }) {
  const hojaRef = useRef<HTMLDivElement>(null);
  const q = r.cuadro;
  if (!cot.circuitos.length) return <Vacio texto="El cuadro de cargas sale de los circuitos: pon los puntos en el Plano y toca “Sugerir circuitos”." onPlano={onPlano} onEjemplo={onEjemplo} />;
  const fd = (id: string, v: number) => setCot(c => ({ ...c, circuitos: c.circuitos.map(k => k.id === id ? { ...k, fd: Math.max(0, Math.min(1, v)) } : k) }));
  const kpi = (l: string, v: string, s?: string, color = 'text-slate-900') => (
    <div className="bg-white rounded-2xl p-3 shadow-xs min-w-0">
      <p className="text-[10px] font-black uppercase text-slate-400 truncate">{l}</p>
      <p className={`text-lg sm:text-xl font-black font-mono leading-tight truncate ${color}`}>{v}</p>
      {s && <p className="text-[10px] text-slate-500 truncate">{s}</p>}
    </div>
  );
  return (
    <div className="p-2 sm:p-4 max-w-[1500px] mx-auto pb-6 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {kpi('Potencia instalada', `${(q.ci / 1000).toFixed(2)} kW`, `${n0(q.ci)} W en ${q.filas.filter(f => f.puntos).length} circuitos`)}
        {kpi('Máxima demanda', `${(q.md / 1000).toFixed(2)} kW`, 'con factores de demanda', 'text-amber-600')}
        {kpi('Corriente', `${q.I.toFixed(1)} A`, `220 V · cos φ ${0.9}`)}
        {kpi('Interruptor general', `2 × ${q.ig} A`, 'termomagnético')}
        {kpi('Alimentador', `${q.seccionAlim} mm²`, `2-1×${q.seccionAlim} + 1×${Math.min(16, q.seccionAlim)} (T) · Ø ${pulg(q.tuboAlim)}`)}
        {kpi('Suministro', q.monofasico ? 'Monofásico' : 'Trifásico', q.monofasico ? 'hasta 10 kW en 220 V' : 'la demanda pasa de 10 kW', q.monofasico ? 'text-emerald-700' : 'text-rose-600')}
      </div>
      <div ref={hojaRef} className="zona-impresion imprimir-claro space-y-3">
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 pb-2 mb-1 border-b border-slate-100">
            <Gauge className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-slate-900 flex-1 min-w-0">Cuadro de cargas{cot.nombre ? ` · ${cot.nombre}` : ''}</h3>
            <span className="no-imprimir"><BotonImprimir objetivo={() => hojaRef.current} titulo={`Cuadro de cargas ${cot.nombre || ''}`} etiqueta="Imprimir" orientacion="landscape" /></span>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
                  {['Circuito', 'Descripción', 'Puntos', 'P. instalada', 'F. demanda', 'Máx. demanda', 'Corriente', 'Conductor', 'Interruptor', 'Diferencial', 'Tubería'].map((h, i) => <th key={h} className={`py-1.5 font-black ${i >= 2 ? 'text-right' : 'text-left'} ${i >= 7 ? 'pl-3' : ''}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {q.filas.map(f => (
                  <tr key={f.c.id} className="border-b border-slate-100">
                    <td className="py-1.5 font-black" style={{ color: f.c.color }}><span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: f.c.color }} />{f.c.nombre}</td>
                    <td className="py-1.5 font-bold text-slate-700">{f.c.desc}</td>
                    <td className="py-1.5 text-right font-mono">{f.puntos}</td>
                    <td className="py-1.5 text-right font-mono">{f.c.uso === 'debil' ? '—' : `${n0(f.ci)} W`}</td>
                    <td className="py-1.5 text-right">{f.c.uso === 'debil' ? '—' : <input type="number" min={0} max={1} step={0.05} value={f.c.fd} onChange={e => fd(f.c.id, parseFloat(e.target.value) || 0)} className="w-14 min-h-[28px] px-1 rounded bg-slate-100 text-right font-mono no-imprimir-borde" />}</td>
                    <td className="py-1.5 text-right font-mono font-bold">{f.c.uso === 'debil' ? '—' : `${n0(f.md)} W`}</td>
                    <td className="py-1.5 text-right font-mono">{f.c.uso === 'debil' ? '—' : `${f.I.toFixed(1)} A`}</td>
                    <td className="py-1.5 pl-3 text-right font-mono">{f.c.uso === 'debil' ? 'Coax / UTP' : `2-1×${f.c.seccion} + 1×${f.c.seccion} (T)`}</td>
                    <td className={`py-1.5 pl-3 text-right font-mono font-bold ${f.ok ? 'text-slate-800' : 'text-rose-600'}`}>{f.c.uso === 'debil' ? '—' : `2 × ${f.c.breaker} A`}{!f.ok && <span className="block text-[9px] font-bold">pide 2×{f.breakerReq} A · {f.seccionReq} mm²</span>}</td>
                    <td className="py-1.5 pl-3 text-right">{f.c.diferencial && f.c.uso !== 'debil' ? <span className="text-cyan-700 font-bold">30 mA</span> : '—'}</td>
                    <td className="py-1.5 pl-3 text-right font-mono">{NOMBRE_TUBO[cot.tubo]} Ø {pulg(f.c.tubo)}</td>
                  </tr>
                ))}
                <tr className="bg-amber-50 font-black">
                  <td className="py-2 pl-1" colSpan={2}>Total</td>
                  <td className="py-2 text-right font-mono">{q.filas.reduce((s, f) => s + f.puntos, 0)}</td>
                  <td className="py-2 text-right font-mono">{n0(q.ci)} W</td>
                  <td />
                  <td className="py-2 text-right font-mono text-amber-700">{n0(q.md)} W</td>
                  <td className="py-2 text-right font-mono">{q.I.toFixed(1)} A</td>
                  <td className="py-2 pl-3 text-right font-mono">2-1×{q.seccionAlim} + 1×{Math.min(16, q.seccionAlim)} (T)</td>
                  <td className="py-2 pl-3 text-right font-mono">IG 2 × {q.ig} A</td>
                  <td />
                  <td className="py-2 pl-3 pr-1 text-right font-mono">Ø {pulg(q.tuboAlim)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-slate-100">
            {q.filas.map(f => (
              <div key={f.c.id} className="py-2 flex flex-nowrap items-start gap-2">
                <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: f.c.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-800 truncate"><span style={{ color: f.c.color }}>{f.c.nombre}</span> {f.c.desc}</p>
                  <p className="text-[10px] text-slate-500 leading-snug">{f.puntos} pts{f.c.uso !== 'debil' ? ` · ${f.c.seccion} mm² · ${f.c.diferencial ? 'ID 30 mA · ' : ''}Ø ${pulg(f.c.tubo)} · f.d. ${f.c.fd}` : ' · coaxial y UTP'}</p>
                </div>
                {f.c.uso !== 'debil' && <div className="text-right shrink-0">
                  <p className={`text-xs font-mono font-black ${f.ok ? 'text-slate-800' : 'text-rose-600'}`}>2×{f.c.breaker} A</p>
                  <p className="text-[10px] font-mono text-slate-400">{n0(f.ci)} W · {f.I.toFixed(1)} A</p>
                </div>}
              </div>
            ))}
            <div className="py-2 flex justify-between text-xs font-black"><span>Total · IG 2×{q.ig} A</span><span className="font-mono text-amber-700">{n0(q.md)} W · {q.I.toFixed(1)} A</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
            <Zap className="w-4 h-4 text-amber-500" /><h3 className="text-sm font-black text-slate-900 flex-1">Diagrama unifilar del tablero</h3>
            <span className="text-[10px] font-bold text-slate-400">Tablero de {q.tablero} polos · {q.diferenciales.length} diferencial{q.diferenciales.length === 1 ? '' : 'es'}</span>
          </div>
          <Unifilar cot={cot} q={q} />
        </div>
      </div>
      <p className="text-[10px] text-slate-400 leading-snug px-1">Corriente = máxima demanda ÷ (220 V × 0.9). Factores de demanda típicos (puedes cambiarlos): alumbrado 1.0, tomacorrientes 0.6, cocina 0.7, exclusivos 1.0. Conductores {NOMBRE_CABLE[cot.cable]}; el interruptor nunca supera la capacidad del cable (2.5 mm² → 16 A, 4 mm² → 25 A, 6 mm² → 32 A, 10 mm² → 50 A). Las cargas mayores a 10 kW suelen pedir suministro trifásico a la concesionaria.</p>
    </div>
  );
}

// ── Tabla de líneas ─────────────────────────────────────────────────────────
function Lineas({ lineas }: { lineas: LineaEle[] }) {
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

// ── 4. Materiales ───────────────────────────────────────────────────────────
function Materiales({ cot, setCot, r, onIrAPrecios, onPresupuesto, onPlano }: { cot: CotizacionEle; setCot: SetCot; r: MetradoEle; onIrAPrecios?: () => void; onPresupuesto: () => void; onPlano: () => void }) {
  const hojaRef = useRef<HTMLDivElement>(null);
  if (!cot.puntos.length) return <Vacio texto="Los materiales salen del plano: pon los puntos y traza las tuberías." onPlano={onPlano} />;
  const total = totalCon(r, cot);
  const sinPrecio = r.lineas.some(l => l.precio === 0);
  const grupos = GRUPOS_LINEA.map(g => ({ g, ls: r.lineas.filter(l => l.grupo === g) })).filter(x => x.ls.length);
  const cn = r.conteo;
  const tarjetas: [string, string, string, string][] = [
    ['Cable', `${n0(cn.cableTotal)} m`, Object.entries(cn.cable).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([s, m]) => `${s} mm² ${m} m`).join(' · ') || '—', '#dc2626'],
    ['Tubería', `${f2(cn.tuboTotal)} m`, `${NOMBRE_TUBO[cot.tubo]} · ${cn.curvas} curvas · ${cn.uniones} uniones`, '#64748b'],
    ['Cajas', `${cn.octogonales + cn.rectangulares + cn.cuadradas + cn.paso}`, `${cn.octogonales} oct. · ${cn.rectangulares} rect. · ${cn.cuadradas} cuad. · ${cn.paso} paso`, '#0891b2'],
    ['Puntos', `${r.puntos.luz + r.puntos.toma + r.puntos.fuerza + r.puntos.debil}`, `${r.puntos.luz} luz · ${r.puntos.toma} tomas · ${r.puntos.fuerza} fuerza · ${r.puntos.debil} TV/datos`, '#d97706'],
  ];
  return (
    <div className="p-2 sm:p-4 max-w-[1600px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-4 xl:items-start">
      <div className="space-y-3 min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {tarjetas.map(([t, v, s, c]) => (
            <div key={t} className="bg-white rounded-2xl p-3 shadow-xs min-w-0 border-l-4" style={{ borderLeftColor: c }}>
              <p className="text-[10px] font-black uppercase text-slate-400 truncate">{t}</p>
              <p className="text-lg font-black font-mono text-slate-900 leading-tight">{v}</p>
              <p className="text-[10px] text-slate-500 truncate">{s}</p>
            </div>
          ))}
        </div>
        {sinPrecio && <p className="text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">Hay productos sin precio (en naranja). Escríbelos en Precios → “Electricidad” o en “Mano de obra”.</p>}
        <div ref={hojaRef} className="zona-impresion imprimir-claro space-y-3">
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
            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">Materiales {S(r.materiales + r.luminarias)} · M. de obra {S(r.manoObra)}</p>
            <p className="text-lg font-black font-mono truncate">{S(total)}</p>
          </div>
          <button onClick={onPresupuesto} className={`${btn} bg-amber-400 text-slate-950 hover:bg-amber-300 shrink-0`}><ClipboardList className="w-4 h-4" /> Presupuesto</button>
        </div>
        <div className="xl:hidden"><Ajustes cot={cot} setCot={setCot} onIrAPrecios={onIrAPrecios} hoja={() => hojaRef.current} /></div>
      </div>
      <aside className="hidden xl:block sticky top-4 space-y-3">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total con GG {cot.gg}% y utilidad {cot.util}%</p>
          <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-2"><span className="text-slate-400">Materiales</span><span className="font-mono font-bold">{S(r.materiales)}</span></div>
            {cot.incluirLuminarias && <div className="flex justify-between gap-2"><span className="text-slate-400">Luminarias</span><span className="font-mono font-bold">{S(r.luminarias)}</span></div>}
            <div className="flex justify-between gap-2"><span className="text-slate-400">Mano de obra</span><span className="font-mono font-bold">{S(r.manoObra)}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Plazo estimado</span><span className="font-mono font-bold">{r.dias} días</span></div>
          </div>
          <button onClick={onPresupuesto} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-sm font-black cursor-pointer hover:bg-amber-300"><ClipboardList className="w-4 h-4" /> Ver presupuesto</button>
        </div>
        <Ajustes cot={cot} setCot={setCot} onIrAPrecios={onIrAPrecios} hoja={() => hojaRef.current} />
      </aside>
    </div>
  );
}

function Ajustes({ cot, setCot, onIrAPrecios, hoja }: { cot: CotizacionEle; setCot: SetCot; onIrAPrecios?: () => void; hoja: () => HTMLElement | null }) {
  const chk = 'flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-700 cursor-pointer';
  const seg = <T extends string>(val: T, ops: [T, string][], on: (v: T) => void) => (
    <div className={`grid gap-1 p-1 bg-slate-100 rounded-xl`} style={{ gridTemplateColumns: `repeat(${ops.length}, minmax(0, 1fr))` }}>
      {ops.map(([v, l]) => <button key={v} onClick={() => on(v)} className={`min-h-[34px] rounded-lg text-[11px] font-bold cursor-pointer truncate px-1 ${val === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{l}</button>)}
    </div>
  );
  return (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <p className="text-xs font-black text-slate-800">Cómo se calcula</p>
      <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Conductor</p>{seg(cot.cable, [['thw', 'THW-90'], ['nh80', 'NH-80 (sin halógenos)']], v => setCot(c => ({ ...c, cable: v })))}</div>
      <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tubería</p>{seg(cot.tubo, [['sap', 'PVC-SAP (pesado)'], ['l', 'PVC-L (liviano)']], v => setCot(c => ({ ...c, tubo: v })))}</div>
      <div><p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mano de obra</p>{seg(cot.modoMO, [['puntos', 'Por punto'], ['jornal', 'Por jornal']], v => setCot(c => ({ ...c, modoMO: v })))}</div>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-700">Desperdicio
        <input type="number" min={0} max={40} value={cot.merma} onChange={e => setCot(c => ({ ...c, merma: Math.max(0, Math.min(40, parseFloat(e.target.value) || 0)) }))} className="ml-auto w-16 min-h-[36px] px-2 rounded-lg bg-slate-100 font-mono text-right" /> %
      </label>
      <label className={chk}><input type="checkbox" className="w-4 h-4 accent-amber-500" checked={cot.incluirLuminarias} onChange={e => setCot(c => ({ ...c, incluirLuminarias: e.target.checked }))} /> Incluir luminarias (y su instalación)</label>
      <label className={chk}><input type="checkbox" className="w-4 h-4 accent-amber-500" checked={cot.pruebas} onChange={e => setCot(c => ({ ...c, pruebas: e.target.checked }))} /> Pruebas de aislamiento y protocolo</label>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <BotonImprimir objetivo={hoja} titulo={`Materiales eléctricos ${cot.nombre || ''}`} etiqueta="Imprimir" />
      </div>
      <p className="text-[10px] text-slate-400 leading-snug">Cable por color (fase, neutro, tierra y retornos) con 0.30 m de holgura en cada caja; rollos de 100 m desde 60 m. Tubo en barras de 3 m con las bajadas: tomas a 0.30 m, interruptores a 1.20 m, luces en el techo (2.50 m).</p>
    </div>
  );
}

// ── 5. Presupuesto ──────────────────────────────────────────────────────────
function Presupuesto({ cot, setCot, r, duchas, onIrAPrecios }: { cot: CotizacionEle; setCot: SetCot; r: MetradoEle; duchas: Pt[]; onIrAPrecios?: () => void }) {
  const { datos } = useEmpresa();
  const hojaRef = useRef<HTMLDivElement>(null);
  const directo = r.directo;
  const gg = directo * cot.gg / 100, util = directo * cot.util / 100, total = directo + gg + util;
  const sinPrecio = r.lineas.some(l => l.precio === 0);
  const vacio = !cot.puntos.some(p => !esEspecial(p.tipo));
  const avisos = useMemo(() => avisosCNE(cot, duchas), [cot, duchas]);
  const q = r.cuadro;
  const resumenP = useMemo(() => { const m = new Map<string, number>(); cot.puntos.forEach(p => m.set(p.tipo, (m.get(p.tipo) || 0) + 1)); return [...m.entries()]; }, [cot.puntos]);
  const whatsapp = () => {
    const lineas = [
      `*Presupuesto de instalaciones eléctricas*${cot.nombre ? ` – ${cot.nombre}` : ''}`,
      cot.cliente ? `Cliente: ${cot.cliente}` : '',
      datos.nombre ? `De: ${datos.nombre}${datos.telefono ? ` (${datos.telefono})` : ''}` : '',
      '',
      `Puntos de luz: ${r.puntos.luz} · tomacorrientes: ${r.puntos.toma} · salidas de fuerza: ${r.puntos.fuerza}${r.puntos.debil ? ` · TV/datos: ${r.puntos.debil}` : ''}`,
      `Tablero con ${cot.circuitos.filter(c => c.uso !== 'debil').length} circuitos, interruptor general 2×${q.ig} A, pozo a tierra`,
      `Máxima demanda: ${(q.md / 1000).toFixed(2)} kW`,
      '',
      `Materiales: ${S(r.materiales + r.luminarias)}`,
      `Mano de obra: ${S(r.manoObra)}`,
      `*Total: ${S(total)}*`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '');
    window.open(`https://wa.me/?text=${encodeURIComponent(lineas.join('\n'))}`, '_blank');
  };
  const grupos = GRUPOS_LINEA.map(g => ({ g, ls: r.lineas.filter(l => l.grupo === g) })).filter(x => x.ls.length);
  const chk = 'inline-flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-600 cursor-pointer bg-white rounded-xl px-3 shadow-xs';
  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 no-imprimir">
        <label className={chk}><input type="checkbox" className="w-4 h-4 accent-amber-500" checked={cot.incluirLuminarias} onChange={e => setCot(c => ({ ...c, incluirLuminarias: e.target.checked }))} /> Incluir luminarias</label>
        <label className={chk}><input type="checkbox" className="w-4 h-4 accent-amber-500" checked={cot.pruebas} onChange={e => setCot(c => ({ ...c, pruebas: e.target.checked }))} /> Pruebas y protocolo</label>
        <div className="flex-1" />
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <button onClick={whatsapp} disabled={vacio} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40`}><Send className="w-4 h-4" /> WhatsApp</button>
        <BotonImprimir objetivo={() => hojaRef.current} titulo="Presupuesto de instalaciones eléctricas" etiqueta="Imprimir / PDF" />
      </div>
      {sinPrecio && !vacio && <p className="no-imprimir text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">Hay productos sin precio (en naranja). Escríbelos en Precios → “Electricidad”.</p>}
      {avisos.some(a => a.nivel === 'error') && !vacio && <p className="no-imprimir text-[11px] font-bold text-rose-800 bg-rose-50 rounded-xl px-3 py-2">El plano tiene {avisos.filter(a => a.nivel === 'error').length} observación(es) del CNE por corregir: revisa el panel de avisos del Plano antes de enviar.</p>}
      <div ref={hojaRef} className="zona-impresion imprimir-claro bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <BandaMarca />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <CabeceraEmpresa subtitulo="Presupuesto de instalaciones eléctricas interiores" />
          <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
            <p className="font-bold text-slate-700">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            {cot.nombre && <p>Obra: {cot.nombre}</p>}
            {cot.cliente && <p>Cliente: {cot.cliente}</p>}
          </div>
        </div>
        {vacio && <p className="py-10 text-center text-sm text-slate-400">Pon los puntos en el Plano para ver el presupuesto.</p>}
        {!vacio && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Alcance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([['Puntos de luz', r.puntos.luz, '#f59e0b'], ['Tomacorrientes', r.puntos.toma, '#2563eb'], ['Salidas de fuerza', r.puntos.fuerza, '#dc2626'], ['TV y datos', r.puntos.debil, '#0891b2']] as [string, number, string][]).map(([l, n, c]) => (
                <div key={l} className="rounded-xl bg-slate-50 px-3 py-2 border-l-4 break-inside-avoid" style={{ borderLeftColor: c }}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{l}</p>
                  <p className="text-base font-black text-slate-900">{n}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resumenP.map(([t, n]) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 pl-1 pr-2.5 py-1 text-[11px] font-bold text-slate-700">
                  <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"><IconoPunto tipo={t as any} className="w-6 h-6" color="#b45309" /></span>{defPunto(t as any).corto}{n > 1 ? ` ×${n}` : ''}
                </span>
              ))}
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase pt-1">Cuadro de cargas (resumen)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[540px]">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
                    <th className="text-left py-1.5 font-black">Circuito</th><th className="text-left py-1.5 font-black">Descripción</th>
                    <th className="text-right py-1.5 font-black">P. inst.</th><th className="text-right py-1.5 font-black">Máx. dem.</th>
                    <th className="text-right py-1.5 font-black">Protección</th><th className="text-right py-1.5 font-black">Conductor</th>
                  </tr>
                </thead>
                <tbody>
                  {q.filas.filter(f => f.puntos).map(f => (
                    <tr key={f.c.id} className="border-b border-slate-100">
                      <td className="py-1.5 font-black" style={{ color: f.c.color }}>{f.c.nombre}</td>
                      <td className="py-1.5 font-bold text-slate-700">{f.c.desc}</td>
                      <td className="py-1.5 text-right font-mono">{f.c.uso === 'debil' ? '—' : `${n0(f.ci)} W`}</td>
                      <td className="py-1.5 text-right font-mono">{f.c.uso === 'debil' ? '—' : `${n0(f.md)} W`}</td>
                      <td className="py-1.5 text-right font-mono">{f.c.uso === 'debil' ? '—' : `2×${f.c.breaker} A${f.c.diferencial ? ' + ID' : ''}`}</td>
                      <td className="py-1.5 text-right font-mono">{f.c.uso === 'debil' ? 'Coax / UTP' : `${f.c.seccion} mm²`}</td>
                    </tr>
                  ))}
                  <tr className="font-black bg-amber-50"><td className="py-1.5 pl-1" colSpan={2}>Total · interruptor general 2×{q.ig} A · alimentador {q.seccionAlim} mm²</td><td className="py-1.5 text-right font-mono">{n0(q.ci)} W</td><td className="py-1.5 text-right font-mono">{n0(q.md)} W</td><td className="py-1.5 text-right font-mono" colSpan={2}>{q.I.toFixed(1)} A</td></tr>
                </tbody>
              </table>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase pt-1">Materiales y mano de obra</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[540px]">
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
              <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Materiales</span><span className="font-mono font-bold">{S(r.materiales)}</span></div>
              {cot.incluirLuminarias && <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Luminarias</span><span className="font-mono font-bold">{S(r.luminarias)}</span></div>}
              <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Mano de obra</span><span className="font-mono font-bold">{S(r.manoObra)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Gastos generales
                <input type="number" min={0} value={cot.gg} onChange={e => setCot(c => ({ ...c, gg: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(gg)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Utilidad
                <input type="number" min={0} value={cot.util} onChange={e => setCot(c => ({ ...c, util: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(util)}</span></div>
              <div className="flex flex-nowrap justify-between gap-2 bg-amber-400 text-slate-950 rounded-xl px-3 py-2 mt-1"><span className="font-black uppercase">Total</span><span className="font-mono font-black">{S(total)}</span></div>
            </div>
          </div>
        )}
        {!vacio && <CondicionesComerciales total={total} />}
        {!vacio && (
          <div className="text-[10px] text-slate-400 space-y-0.5">
            <p>Diseño según el Código Nacional de Electricidad – Utilización: 220 V monofásico; alumbrado con {NOMBRE_CABLE[cot.cable]} de 2.5 mm² y 2×16 A; tomacorrientes con línea a tierra, 4 mm², 2×20 A e interruptor diferencial de 30 mA; circuitos exclusivos para terma, cocina, ducha y aire acondicionado; tubería {NOMBRE_TUBO[cot.tubo]} de ¾" empotrada; pozo a tierra con resistencia de 25 Ω o menos.</p>
            <p>Incluye tablero de {q.tablero} polos armado, pruebas de aislamiento y continuidad{cot.pruebas ? '' : ' (no cotizadas)'}. {cot.incluirLuminarias ? 'Incluye las luminarias indicadas.' : 'Las luminarias y artefactos (terma, cocina, aire) los compra el cliente.'} No incluye picado de losas ni acabados, ni trámites ante la concesionaria, salvo que se indique.</p>
          </div>
        )}
      </div>
    </div>
  );
}
function GrupoFilas({ g, ls }: { g: GrupoLinea; ls: LineaEle[] }) {
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
