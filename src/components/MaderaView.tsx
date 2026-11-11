// =============================================================================
// Carpintería de madera: puertas contraplacadas y apaneladas, marcos, closets,
// muebles a medida, pisos, cielos y escaleras.
//   1. Trabajos: medidas, madera, acabado y herrajes, con el dibujo de cada uno.
//   2. 3D: las puertas y cajones se abren (tocar o "Abrir").
//   3. Materiales y despiece: pies tablares, planchas con plano de cortes, herrajes,
//      acabado, consumibles y mano de obra; lista de cortes en cm.
//   4. Presupuesto: formal, para imprimir o enviar por WhatsApp.
// =============================================================================
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Hammer, Box, ListChecks, ClipboardList, Trash2, Copy, Ruler } from 'lucide-react';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { ESPESORES, NOMBRE_MADERA, esSolida, Madera, MaderaTablero, COLOR_MADERA } from '../catalogo/madera';
import {
  CotizacionMadera, ItemMadera, KEY_COT_ACTUAL, KEY_COT_LISTA, KEY_PESTANA, TIPOS_MADERA, TipoMadera, ACABADOS, CHAPAS,
  cotizacionVacia, cotizacionEjemplo, leerCotizacionActual, itemNuevo, tipoMadera, nombreItem,
} from './madera/modeloMadera';
import { metradoMadera, MetradoMadera, GRUPOS_MADERA, COLOR_GRUPO_MADERA, datosEscalera, NOMBRE_ACABADO, PlanchasMat } from './madera/calculoMadera';
import DibujoMadera from './madera/DibujoMadera';
import { totalConGG, uid } from './carpinteria/comun/comun';
import {
  TEMA_MADERA as T, S, f2, btn, Num, Elegir, Segmento, Check, Avisos, Encabezado, Vacio, DatosCotizacion, SelectorTipos, TarjetaItem,
  Chips3D, BarraTotal, ResumenPC, PanelMateriales, Dato, Presupuesto as PresupuestoFormal, TabDef,
} from './carpinteria/comun/ui';

const Madera3D = lazy(() => import('./madera/Madera3D'));
type Pestana = 'items' | '3d' | 'despiece' | 'presupuesto';
const PESTANAS: Pestana[] = ['items', '3d', 'despiece', 'presupuesto'];
type SetCot = (f: (c: CotizacionMadera) => CotizacionMadera) => void;

function useMetrado(cot: CotizacionMadera) {
  const catalogo = useCatalogo();
  return useMemo(() => metradoMadera(cot.items, cot), [cot.items, cot.merma, cot.modoMO, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
}
const resumenItem = (it: ItemMadera) => {
  const t = tipoMadera(it.tipo);
  const med = it.tipo === 'escalera' ? `${f2(it.ancho)} m de ancho · ${f2(it.alto)} m de alto` : it.tipo === 'piso' || it.tipo === 'cielo' ? `${f2(it.ancho)} × ${f2(it.alto)} m (${f2(it.ancho * it.alto)} m²)`
    : it.tipo === 'closet' || it.tipo === 'mueble' ? `${f2(it.ancho)} × ${f2(it.alto)} × ${f2(it.prof)} m` : `${f2(it.ancho)} × ${f2(it.alto)} m`;
  return `${med}${it.cantidad > 1 ? ` × ${it.cantidad}` : ''} · ${t.id === 'puerta_contraplacada' ? `${NOMBRE_MADERA[it.madera]} / pino` : NOMBRE_MADERA[it.madera]} · ${NOMBRE_ACABADO[it.acabado]}`;
};

export default function MaderaView({ onIrAPrecios }: { onIrAPrecios?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>(() => {
    const p = safeStorage.getItem<string>(KEY_PESTANA, 'items');
    return (PESTANAS.includes(p as Pestana) ? p : 'items') as Pestana;
  });
  useEffect(() => { safeStorage.setItem(KEY_PESTANA, pestana); }, [pestana]);
  const [cot, setCotRaw] = useState<CotizacionMadera>(leerCotizacionActual);
  const setCot: SetCot = f => setCotRaw(c => f(c));
  const r = useMetrado(cot);
  const total = totalConGG(r.directo, cot);
  // La cotización actual se guarda con su total (otros apartados lo leen).
  useEffect(() => { safeStorage.setItem(KEY_COT_ACTUAL, { ...cot, total }); }, [cot, total]);
  const [sel, setSel] = useState<string | null>(cot.items[cot.items.length - 1]?.id || null);
  const cargarEjemplo = () => { const ej = cotizacionEjemplo(); setCot(() => ej); setSel(ej.items[0].id); };

  const tabs: TabDef<Pestana>[] = [
    { id: 'items', label: 'Trabajos', corto: 'Trabajos', icon: Hammer },
    { id: '3d', label: 'Vista 3D', corto: '3D', icon: Box },
    { id: 'despiece', label: 'Materiales y despiece', corto: 'Materiales', icon: ListChecks },
    { id: 'presupuesto', label: 'Presupuesto', corto: 'Presup.', icon: ClipboardList },
  ];
  const desglose: [string, number][] = [['Materiales', r.materiales], ['Mano de obra', r.manoObra]];
  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <Encabezado tema={T} Icono={Hammer} titulo="Carpintería de madera" descripcion="Puertas, marcos, closets, muebles, pisos y cielos: pies tablares, cortes y presupuesto."
        tabs={tabs} pestana={pestana} setPestana={setPestana} />
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {pestana === 'items' && <Trabajos cot={cot} setCot={setCot} r={r} total={total} sel={sel} setSel={setSel} onEjemplo={cargarEjemplo} onPresupuesto={() => setPestana('presupuesto')} desglose={desglose} />}
        {pestana === '3d' && (cot.items.length
          ? <Vista3D items={cot.items} />
          : <Vacio tema={T} Icono={Hammer} texto="Agrega puertas, closets o muebles en Trabajos para verlos en 3D." onIr={() => setPestana('items')} etiquetaIr="Ir a Trabajos" onEjemplo={cargarEjemplo} />)}
        {pestana === 'despiece' && (cot.items.length
          ? <Materiales cot={cot} setCot={setCot} r={r} total={total} desglose={desglose} onIrAPrecios={onIrAPrecios} onPresupuesto={() => setPestana('presupuesto')} />
          : <Vacio tema={T} Icono={Hammer} texto="Los materiales y el despiece salen de los trabajos que agregues." onIr={() => setPestana('items')} etiquetaIr="Ir a Trabajos" onEjemplo={cargarEjemplo} />)}
        {pestana === 'presupuesto' && <Presupuesto cot={cot} setCot={setCot} r={r} desglose={desglose} onIrAPrecios={onIrAPrecios} />}
      </div>
    </div>
  );
}

// ── 2. Vista 3D (todo o un trabajo; en el celular empieza con uno) ───────────
function Vista3D({ items }: { items: ItemMadera[] }) {
  const [ver, setVer] = useState<string | null>(() => typeof window !== 'undefined' && window.innerWidth < 768 && items.length > 1 ? items[0].id : null);
  const lista = items.filter(i => i.id === ver);
  return (
    <div className="h-full min-h-[480px] p-2 sm:p-4 flex flex-col gap-2">
      {items.length > 1 && <Chips3D items={items.map((it, i) => ({ id: it.id, titulo: nombreItem(it, i) }))} ver={lista.length ? ver : null} setVer={setVer} tema={T} />}
      <div className="flex-1 min-h-[420px]">
        <Suspense fallback={<div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Cargando 3D…</div>}>
          <Madera3D items={lista.length ? lista : items} />
        </Suspense>
      </div>
    </div>
  );
}

// ── 1. Trabajos ─────────────────────────────────────────────────────────────
function Trabajos({ cot, setCot, r, total, sel, setSel, onEjemplo, onPresupuesto, desglose }: {
  cot: CotizacionMadera; setCot: SetCot; r: MetradoMadera; total: number; sel: string | null; setSel: (id: string | null) => void; onEjemplo: () => void; onPresupuesto: () => void; desglose: [string, number][];
}) {
  const catalogo = useCatalogo();
  const sub = useMemo(() => new Map(cot.items.map(it => [it.id, totalConGG(metradoMadera([it], cot).directo, cot)])),
    [cot.items, cot.merma, cot.modoMO, cot.gg, cot.util, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const upd = (id: string, p: Partial<ItemMadera>) => setCot(c => ({ ...c, items: c.items.map(i => i.id === id ? { ...i, ...p } : i) }));
  const agregar = (t: TipoMadera) => { const n = itemNuevo(t); setCot(c => ({ ...c, items: [...c.items, n] })); setSel(n.id); };
  const nUnid = cot.items.reduce((s, i) => s + Math.max(1, i.cantidad), 0);
  const p2Total = Object.values(r.p2).reduce((s, x) => s + (x?.compra || 0), 0);
  return (
    <div className="p-3 sm:p-5 max-w-[1600px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5 xl:items-start">
      <div className="space-y-4 min-w-0">
        <DatosCotizacion cot={cot} setCot={setCot} keyLista={KEY_COT_LISTA} vacia={cotizacionVacia} tema={T} onEjemplo={onEjemplo} placeholder="Ej. Puertas y closet – Sra. Rosa" />
        <SelectorTipos titulo="¿Qué vas a hacer en madera?" tipos={TIPOS_MADERA} onElegir={agregar} tema={T} />
        {cot.items.length === 0 && <p className="text-center text-sm text-slate-400 py-6">Agrega tu primer trabajo con los botones de arriba o toca “Cargar ejemplo”.</p>}
        <div className="space-y-2.5">
          {cot.items.map((it, i) => (
            <TarjetaItem key={it.id} tema={T} abierta={sel === it.id} onToggle={() => setSel(sel === it.id ? null : it.id)}
              miniatura={<DibujoMadera it={it} mini className="w-full h-full" />} titulo={nombreItem(it, i)} subtitulo={resumenItem(it)}
              precio={`≈ ${S(sub.get(it.id) || 0)}`} aviso={!!r.avisos.get(it.id)?.length}>
              <Editor it={it} upd={p => upd(it.id, p)} avisos={r.avisos.get(it.id) || []}
                onDuplicar={() => { const n = { ...it, id: uid() }; setCot(c => ({ ...c, items: [...c.items.slice(0, i + 1), n, ...c.items.slice(i + 1)] })); setSel(n.id); }}
                onQuitar={() => { if (confirm('¿Quitar este trabajo?')) { setCot(c => ({ ...c, items: c.items.filter(x => x.id !== it.id) })); setSel(null); } }} />
            </TarjetaItem>
          ))}
        </div>
        {cot.items.length > 0 && <BarraTotal tema={T} detalle={`${nUnid} unidad${nUnid > 1 ? 'es' : ''} · ${p2Total} p2 · ${r.nPlanchas} planchas`} total={total} onPresupuesto={onPresupuesto} />}
      </div>
      <ResumenPC tema={T} total={total} detalle={`${nUnid} unidades · ${p2Total} pies tablares · ${r.nPlanchas} planchas · incluye GG ${cot.gg}% y utilidad ${cot.util}%`}
        desglose={desglose} onPresupuesto={onPresupuesto}
        filas={cot.items.map((it, i) => ({ id: it.id, titulo: `${it.cantidad > 1 ? `${it.cantidad} × ` : ''}${nombreItem(it, i)}`, sub: `${f2(it.ancho)}×${f2(it.alto)}`, onClick: () => setSel(it.id) }))} />
    </div>
  );
}

function Editor({ it, upd, avisos, onDuplicar, onQuitar }: { it: ItemMadera; upd: (p: Partial<ItemMadera>) => void; avisos: string[]; onDuplicar: () => void; onQuitar: () => void }) {
  const t = tipoMadera(it.tipo);
  const puerta = it.tipo === 'puerta_contraplacada' || it.tipo === 'puerta_apanelada';
  const mueble = it.tipo === 'closet' || it.tipo === 'mueble';
  const tablero = !esSolida(it.madera) && it.tipo !== 'puerta_contraplacada';
  const cambiarMadera = (m: Madera) => {
    const p: Partial<ItemMadera> = { madera: m };
    if (!esSolida(m) && !ESPESORES[m as MaderaTablero].includes(it.espesor)) p.espesor = it.tipo === 'cielo' ? ESPESORES[m as MaderaTablero][1] : 18;
    if (it.tipo === 'puerta_contraplacada') p.espesor = m === 'mdf' ? 5.5 : 4;
    upd(p);
  };
  const esc = it.tipo === 'escalera' ? datosEscalera(it) : null;
  return (
    <div className="px-3 pb-3 sm:px-4 sm:pb-4 border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px] 2xl:grid-cols-[minmax(0,1fr)_300px] gap-4">
      <div className="space-y-3 min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <label className="col-span-2 block text-[10px] font-bold text-slate-500 uppercase">Nombre
            <input value={it.nombre} onChange={e => upd({ nombre: e.target.value })} placeholder={t.nombre} className="mt-0.5 w-full min-h-[40px] px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </label>
          <Num label="Cantidad" value={it.cantidad} onChange={v => upd({ cantidad: v })} min={1} max={200} entero sufijo="und" step={1} />
          <Num label={t.etiquetas.ancho} value={it.ancho} onChange={v => upd({ ancho: v })} min={0.2} max={it.tipo === 'piso' || it.tipo === 'cielo' ? 30 : 8} />
          <Num label={t.etiquetas.alto} value={it.alto} onChange={v => upd({ alto: v })} min={0.2} max={it.tipo === 'piso' || it.tipo === 'cielo' ? 30 : 6} />
          {mueble && <Num label="Fondo" value={it.prof} onChange={v => upd({ prof: v })} min={0.2} max={1.2} />}
          <Elegir label={it.tipo === 'puerta_contraplacada' ? 'Caras (sobre pino)' : 'Madera'} value={it.madera} onChange={cambiarMadera}
            opciones={t.maderas.map(m => [m, it.tipo === 'puerta_contraplacada' ? (m === 'mdf' ? 'MDF 5.5 mm' : 'Triplay 4 mm') : NOMBRE_MADERA[m]] as [Madera, string])} />
          {tablero && <Elegir label="Espesor" value={String(it.espesor)} onChange={v => upd({ espesor: parseFloat(v) })} opciones={ESPESORES[it.madera as MaderaTablero].map(e => [String(e), `${e} mm`] as [string, string])} />}
          <Elegir label="Acabado" value={it.acabado} onChange={v => upd({ acabado: v })} opciones={ACABADOS} />
        </div>
        {puerta && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
            <Segmento label="Bisagras al" value={it.lado} onChange={v => upd({ lado: v })} opciones={[['izq', 'Izquierda'], ['der', 'Derecha']]} />
            <Num label="Bisagras capuchinas" value={it.bisagras} onChange={v => upd({ bisagras: v })} min={2} max={6} entero sufijo="und" step={1} />
            <Elegir label="Cerradura" value={it.chapa} onChange={v => upd({ chapa: v })} opciones={t.chapas.map(c => [c, CHAPAS[c]] as [typeof c, string])} />
            {it.tipo === 'puerta_apanelada' && <Segmento label="Paneles" value={it.paneles} onChange={v => upd({ paneles: v })} opciones={[[2, '2'], [4, '4'], [6, '6']]} />}
            <div className="col-span-2 sm:col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Check tema={T} label="Con marco y contramarco" value={it.marco} onChange={v => upd({ marco: v })} />
              {it.marco && <div className="w-40"><Elegir label="Madera del marco" value={it.maderaMarco} onChange={v => upd({ maderaMarco: v })} opciones={[['tornillo', 'Tornillo'], ['cedro', 'Cedro'], ['pino', 'Pino']]} /></div>}
            </div>
          </div>
        )}
        {mueble && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
            <Num label="Puertas (hojas)" value={it.hojas} onChange={v => upd({ hojas: v })} min={1} max={12} entero sufijo="und" step={1} />
            <Num label="Repisas" value={it.repisas} onChange={v => upd({ repisas: v })} min={0} max={20} entero sufijo="und" step={1} />
            <Num label="Filas de cajones" value={it.filasCajones} onChange={v => upd({ filasCajones: v })} min={0} max={4} entero sufijo="filas" step={1} />
            <Num label="Bisagras por puerta" value={it.bisagras} onChange={v => upd({ bisagras: v })} min={2} max={6} entero sufijo="und" step={1} />
            <Elegir label="Chapa" value={it.chapa} onChange={v => upd({ chapa: v })} opciones={t.chapas.map(c => [c, CHAPAS[c]] as [typeof c, string])} />
            <div className="col-span-2 sm:col-span-1 flex flex-wrap gap-x-4">
              <Check tema={T} label="Tiradores" value={it.tirador} onChange={v => upd({ tirador: v })} />
              {it.tipo === 'closet' && <Check tema={T} label="Barra para colgar" value={it.colgador} onChange={v => upd({ colgador: v })} />}
            </div>
          </div>
        )}
        {esc && <p className="text-[11px] font-bold text-slate-600 bg-slate-50 rounded-xl px-3 py-2 inline-flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> {esc.n} contrapasos de {(esc.contrapaso * 100).toFixed(1)} cm · {esc.pasos} pasos de 25 cm · recorrido {f2(esc.pasos * 0.25)} m</p>}
        <Avisos lista={avisos} />
        <div className="flex flex-wrap gap-2">
          <button onClick={onDuplicar} className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}><Copy className="w-4 h-4" /> Duplicar</button>
          <button onClick={onQuitar} className={`${btn} bg-rose-50 text-rose-700 hover:bg-rose-100`}><Trash2 className="w-4 h-4" /> Quitar</button>
        </div>
      </div>
      <div className="order-first md:order-none rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center md:min-h-[260px]">
        <DibujoMadera it={it} className="w-full h-[220px] md:h-full md:max-h-[340px]" />
      </div>
    </div>
  );
}

// ── 3. Materiales y despiece ──────────────────────────────────────────────────
function PlanchaSvg({ p, t }: { p: PlanchasMat; t: PlanchasMat['tableros'][number] }) {
  const L = p.L * 1000, A = p.A * 1000;
  const colores = ['#fde68a', '#fcd34d', '#fbbf24', '#fed7aa', '#fdba74', '#e7e5e4'];
  return (
    <svg viewBox={`-10 -10 ${L + 20} ${A + 20}`} className="w-full" style={{ fontFamily: 'system-ui' }} role="img" aria-label="Plano de cortes">
      <rect x={0} y={0} width={L} height={A} fill="#f5f5f4" stroke="#78716c" strokeWidth={6} />
      {t.piezas.map((pz, i) => (
        <g key={i}>
          <rect x={pz.x} y={pz.y} width={pz.w} height={pz.h} fill={colores[i % colores.length]} stroke="#92400e" strokeWidth={4} />
          {pz.w > 260 && pz.h > 120 && <text x={pz.x + pz.w / 2} y={pz.y + pz.h / 2} fontSize={Math.min(70, pz.h / 3, pz.w / 7)} fontWeight={800} fill="#451a03" textAnchor="middle" dominantBaseline="middle">{Math.round(pz.w / 10)} × {Math.round(pz.h / 10)}</text>}
        </g>
      ))}
    </svg>
  );
}

function Materiales({ cot, setCot, r, total, desglose, onIrAPrecios, onPresupuesto }: {
  cot: CotizacionMadera; setCot: SetCot; r: MetradoMadera; total: number; desglose: [string, number][]; onIrAPrecios?: () => void; onPresupuesto: () => void;
}) {
  const porItem = useMemo(() => {
    const m = new Map<string, typeof r.despiece>();
    r.despiece.forEach(f => m.set(f.item, [...(m.get(f.item) || []), f]));
    return [...m.entries()];
  }, [r.despiece]);
  const maderas = (Object.keys(r.p2) as (keyof typeof r.p2)[]);
  const tarjetas = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {maderas.map(m => <Dato key={m} titulo={NOMBRE_MADERA[m]} valor={`${r.p2[m]!.compra} p2`} sub={`${f2(r.p2[m]!.neto)} p2 netos + ${cot.merma}%`} color={COLOR_MADERA[m]} />)}
      <Dato titulo="Planchas" valor={`${r.nPlanchas}`} sub={r.planchas.map(p => p.nombre).join(' · ') || '—'} color="#c9a77c" />
      <Dato titulo="Área de acabado" valor={`${f2(r.area)} m²`} sub="caras, cantos y marcos" color="#d97706" />
      <Dato titulo="Días de carpintero" valor={`${f2(r.dias)}`} sub="fabricación e instalación" color="#7c3aed" />
    </div>
  );
  const despiece = (
    <>
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3 break-inside-avoid">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-amber-700" />
          <h3 className="text-sm font-black text-slate-900 flex-1">Despiece (lista de cortes)</h3>
          <span className="text-[10px] font-bold text-slate-400">medidas en cm · p2 = pies tablares</span>
        </div>
        {porItem.map(([item, filas]) => (
          <div key={item} className="space-y-1">
            <p className="text-xs font-black text-amber-800">{item}</p>
            <div className="hidden md:block">
              <table className="w-full text-xs table-fixed">
                <thead><tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
                  <th className="w-[27%] text-left py-1 font-black">Pieza</th><th className="w-[25%] text-left py-1 font-black">Material</th><th className="w-[14%] text-left py-1 font-black">Sección</th>
                  <th className="w-[9%] text-right py-1 font-black">Largo</th><th className="w-[9%] text-right py-1 font-black">Ancho</th><th className="w-[7%] text-right py-1 font-black">Cant.</th><th className="w-[9%] text-right py-1 font-black">p2</th>
                </tr></thead>
                <tbody>{filas.map((f, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-1 pr-2 font-bold text-slate-700">{f.nombre}</td><td className="py-1 pr-2 text-slate-500">{f.material}</td><td className="py-1 pr-2 text-slate-500 font-mono">{f.seccion}</td>
                    <td className="py-1 text-right font-mono font-bold">{(f.largo * 100).toFixed(1)}</td><td className="py-1 text-right font-mono">{f.ancho ? (f.ancho * 100).toFixed(1) : '—'}</td>
                    <td className="py-1 text-right font-mono font-bold">{f.n}</td><td className="py-1 text-right font-mono text-slate-600">{f.p2 !== undefined ? f2(f.p2) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-slate-100">
              {filas.map((f, i) => (
                <div key={i} className="py-1.5 flex flex-nowrap items-start gap-2">
                  <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-700 leading-snug">{f.nombre}</p><p className="text-[10px] text-slate-400">{f.material} · {f.seccion}</p></div>
                  <div className="text-right shrink-0"><p className="text-xs font-mono font-black text-slate-800">{f.n} × {(f.largo * 100).toFixed(1)}{f.ancho ? ` × ${(f.ancho * 100).toFixed(1)}` : ''}</p>{f.p2 !== undefined && <p className="text-[10px] font-mono text-slate-400">{f2(f.p2)} p2</p>}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {r.planchas.some(p => p.tableros.length) && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3 break-inside-avoid">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#c9a77c' }} />
            <h3 className="text-sm font-black text-slate-900 flex-1">Planchas: plano de cortes</h3>
            <span className="text-[10px] font-bold text-slate-400">sierra 4 mm · refile 5 mm</span>
          </div>
          {r.planchas.filter(p => p.tableros.length).map(p => (
            <div key={p.clave} className="space-y-1.5">
              <p className="text-xs font-black text-slate-700">{p.nombre} · {p.A.toFixed(2)} × {p.L.toFixed(2)} m · {p.tableros.length} plancha{p.tableros.length > 1 ? 's' : ''}{p.porArea ? ` + ${p.porArea} por área` : ''}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {p.tableros.slice(0, 8).map((t, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 p-1.5">
                    <PlanchaSvg p={p} t={t} />
                    <p className="text-[10px] font-bold text-slate-500 text-center">Plancha {i + 1} · uso {t.usoPct}%</p>
                  </div>
                ))}
              </div>
              {p.tableros.length > 8 && <p className="text-[10px] text-slate-400">… y {p.tableros.length - 8} planchas más.</p>}
            </div>
          ))}
        </div>
      )}
    </>
  );
  return (
    <PanelMateriales tema={T} cot={cot} setCot={setCot} lineas={r.lineas} grupos={[...GRUPOS_MADERA]} colorGrupo={COLOR_GRUPO_MADERA} tarjetas={tarjetas} despiece={despiece}
      onPresupuesto={onPresupuesto} onIrAPrecios={onIrAPrecios} titulo="Materiales de carpintería de madera" desglose={desglose} total={total}
      ajustes={<p className="text-[10px] text-slate-400 leading-snug">Madera sólida en pies tablares: espesor (pulg) × ancho (pulg) × largo (pies) ÷ 12, con secciones comerciales y el desperdicio indicado. Tableros por plancha con plano de cortes (MDF 1.83 × 2.44, triplay y OSB 1.22 × 2.44 m).</p>} />
  );
}

// ── 4. Presupuesto ──────────────────────────────────────────────────────────
function Presupuesto({ cot, setCot, r, desglose, onIrAPrecios }: { cot: CotizacionMadera; setCot: SetCot; r: MetradoMadera; desglose: [string, number][]; onIrAPrecios?: () => void }) {
  const detalle = (it: ItemMadera) => {
    const x: string[] = [];
    if (it.tipo === 'puerta_contraplacada') x.push(`caras de ${it.madera === 'mdf' ? 'MDF 5.5 mm' : 'triplay 4 mm'} sobre bastidor de pino`);
    else x.push(`${NOMBRE_MADERA[it.madera]}${!esSolida(it.madera) ? ` ${it.espesor} mm` : ''}`);
    x.push(NOMBRE_ACABADO[it.acabado]);
    if ((it.tipo === 'puerta_contraplacada' || it.tipo === 'puerta_apanelada') && it.marco) x.push(`marco y contramarco de ${NOMBRE_MADERA[it.maderaMarco].toLowerCase()}`);
    if (it.tipo === 'puerta_apanelada') x.push(`${it.paneles} paneles`);
    if (it.tipo === 'closet' || it.tipo === 'mueble') x.push(`${it.hojas} puertas, ${it.repisas} repisas${it.filasCajones ? `, ${it.filasCajones * Math.max(1, Math.ceil(it.hojas / 2))} cajones` : ''}${it.colgador && it.tipo === 'closet' ? ', barra para colgar' : ''}`);
    if (it.chapa !== 'ninguna') x.push(CHAPAS[it.chapa].toLowerCase());
    return x.join(' · ');
  };
  const alcance = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {cot.items.map((it, i) => (
        <div key={it.id} className="rounded-xl bg-slate-50 p-2 flex flex-nowrap gap-2 break-inside-avoid">
          <div className="w-20 h-24 shrink-0 bg-white rounded-lg p-1"><DibujoMadera it={it} mini className="w-full h-full" /></div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-800">{it.cantidad > 1 ? `${it.cantidad} × ` : ''}{nombreItem(it, i)}</p>
            <p className="text-[11px] font-mono font-bold text-slate-600">{it.tipo === 'piso' || it.tipo === 'cielo' ? `${f2(it.ancho)} × ${f2(it.alto)} m` : it.tipo === 'closet' || it.tipo === 'mueble' ? `${f2(it.ancho)} × ${f2(it.alto)} × ${f2(it.prof)} m` : `${f2(it.ancho)} × ${f2(it.alto)} m`}</p>
            <p className="text-[10px] text-slate-500 leading-snug">{detalle(it)}</p>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <PresupuestoFormal tema={T} cot={cot} setCot={setCot} lineas={r.lineas} grupos={[...GRUPOS_MADERA]} colorGrupo={COLOR_GRUPO_MADERA}
      titulo="Presupuesto de carpintería de madera" subtitulo="Presupuesto de carpintería de madera" alcance={alcance} desglose={desglose} onIrAPrecios={onIrAPrecios}
      textoVacio="Agrega los trabajos en la pestaña Trabajos para ver el presupuesto."
      whatsapp={() => cot.items.map((it, i) => `• ${it.cantidad > 1 ? `${it.cantidad} × ` : ''}${nombreItem(it, i)} ${f2(it.ancho)} × ${f2(it.alto)} m (${detalle(it)})`)}
      notas={<>
        <p>Madera seca y cepillada. Cubicación en pies tablares (p2 = espesor″ × ancho″ × largo′ ÷ 12) con {cot.merma}% de desperdicio; tableros por plancha según el plano de cortes.</p>
        <p>Incluye fabricación, instalación{r.area > 0 ? ' y acabado' : ''} de lo indicado, con sus herrajes. No incluye trabajos de albañilería, picado ni resanes de muros, salvo que se indique.</p>
      </>} />
  );
}
