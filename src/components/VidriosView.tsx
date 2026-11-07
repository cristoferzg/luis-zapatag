// =============================================================================
// Vidrios y aluminio: ventanas corredizas, proyectantes, fijas, mamparas, puertas
// de templado, duchas, barandas, espejos y celosías.
//   1. Trabajos: medidas, sistema, vidrio, color del aluminio y accesorios, con su elevación.
//   2. 3D: corredizas que deslizan, proyectantes, puertas y celosías que se abren.
//   3. Materiales y despiece: perfiles en barras de 6 m (cortes en mm), vidrios a pedir,
//      accesorios, consumibles y mano de obra.
//   4. Presupuesto: formal, para imprimir o enviar por WhatsApp.
// =============================================================================
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AppWindow, Box, ListChecks, ClipboardList, Trash2, Copy } from 'lucide-react';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { COLORES_ALU, colorAlu, vidrioDe, ColorAluminio, TipoVidrio } from '../catalogo/vidrios';
import {
  CotizacionVidrios, ItemVidrio, KEY_COT_ACTUAL, KEY_COT_LISTA, KEY_PESTANA, TIPOS_VIDRIO, TipoVid, SISTEMAS, Sistema,
  cotizacionVacia, cotizacionEjemplo, leerCotizacionActual, itemNuevo, tipoVid, nombreItem,
} from './vidrios/modeloVidrios';
import { metradoVidrios, MetradoVidrios, GRUPOS_VID, COLOR_GRUPO_VID, geometria } from './vidrios/calculoVidrios';
import DibujoVidrio from './vidrios/DibujoVidrio';
import { totalConGG, uid } from './carpinteria/comun/comun';
import {
  TEMA_VIDRIOS as T, S, f2, btn, Num, Elegir, Segmento, Check, Avisos, Encabezado, Vacio, DatosCotizacion, SelectorTipos, TarjetaItem,
  Chips3D, BarraTotal, ResumenPC, PanelMateriales, Dato, Presupuesto as PresupuestoFormal, TabDef, BarrasSvg,
} from './carpinteria/comun/ui';

const Vidrios3D = lazy(() => import('./vidrios/Vidrios3D'));
type Pestana = 'items' | '3d' | 'despiece' | 'presupuesto';
const PESTANAS: Pestana[] = ['items', '3d', 'despiece', 'presupuesto'];
type SetCot = (f: (c: CotizacionVidrios) => CotizacionVidrios) => void;

function useMetrado(cot: CotizacionVidrios) {
  const catalogo = useCatalogo();
  return useMemo(() => metradoVidrios(cot.items, cot), [cot.items, cot.merma, cot.modoMO, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
}
const detalleItem = (it: ItemVidrio) => {
  const t = tipoVid(it.tipo), x: string[] = [];
  if (t.sistemas.length) x.push(SISTEMAS[it.sistema]);
  if (t.hojas.length && it.tipo !== 'puerta_templada') x.push(`${geometria(it).hojas.length} ${it.tipo === 'fija' ? 'paño(s)' : 'hojas'}`);
  if (it.tipo === 'puerta_templada') x.push(`${it.hojas} hoja${it.hojas > 1 ? 's' : ''}, ${it.sujecion === 'piso' ? 'bisagra de piso' : 'pivotes'}`);
  if (it.tipo === 'ducha') x.push(it.ducha === 'corrediza' ? 'corrediza con kit inox' : 'batiente con bisagras');
  if (it.tipo === 'baranda') x.push(it.baranda === 'perfil' ? 'perfil base U' : 'pinzas y parantes inox');
  if (it.tipo === 'espejo') x.push(it.biselado ? 'biselado' : 'canto pulido', ...(it.marcoEspejo ? ['con marco'] : []));
  x.push(vidrioDe(it.vidrio).corto);
  if (t.aluminio && (it.tipo !== 'espejo' || it.marcoEspejo)) x.push(`aluminio ${colorAlu(it.color).nombre.toLowerCase()}`);
  if (it.chapa && (it.tipo === 'mampara' || it.tipo === 'puerta_templada')) x.push('con chapa');
  return x.join(' · ');
};

export default function VidriosView({ onIrAPrecios }: { onIrAPrecios?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>(() => {
    const p = safeStorage.getItem<string>(KEY_PESTANA, 'items');
    return (PESTANAS.includes(p as Pestana) ? p : 'items') as Pestana;
  });
  useEffect(() => { safeStorage.setItem(KEY_PESTANA, pestana); }, [pestana]);
  const [cot, setCotRaw] = useState<CotizacionVidrios>(leerCotizacionActual);
  const setCot: SetCot = f => setCotRaw(c => f(c));
  const r = useMetrado(cot);
  const total = totalConGG(r.directo, cot);
  // La cotización actual se guarda con su total (otros apartados lo leen).
  useEffect(() => { safeStorage.setItem(KEY_COT_ACTUAL, { ...cot, total }); }, [cot, total]);
  const [sel, setSel] = useState<string | null>(cot.items[cot.items.length - 1]?.id || null);
  const cargarEjemplo = () => { const ej = cotizacionEjemplo(); setCot(() => ej); setSel(ej.items[0].id); };
  const tabs: TabDef<Pestana>[] = [
    { id: 'items', label: 'Trabajos', corto: 'Trabajos', icon: AppWindow },
    { id: '3d', label: 'Vista 3D', corto: '3D', icon: Box },
    { id: 'despiece', label: 'Materiales y despiece', corto: 'Materiales', icon: ListChecks },
    { id: 'presupuesto', label: 'Presupuesto', corto: 'Presup.', icon: ClipboardList },
  ];
  const desglose: [string, number][] = [['Materiales', r.materiales], ['Mano de obra', r.manoObra]];
  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <Encabezado tema={T} Icono={AppWindow} titulo="Vidrios y aluminio" descripcion="Ventanas, mamparas, templados, duchas, barandas y espejos: cortes en barras de 6 m y presupuesto."
        tabs={tabs} pestana={pestana} setPestana={setPestana} />
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {pestana === 'items' && <Trabajos cot={cot} setCot={setCot} r={r} total={total} sel={sel} setSel={setSel} onEjemplo={cargarEjemplo} onPresupuesto={() => setPestana('presupuesto')} desglose={desglose} />}
        {pestana === '3d' && (cot.items.length
          ? <Vista3D items={cot.items} />
          : <Vacio tema={T} Icono={AppWindow} texto="Agrega ventanas, mamparas o duchas en Trabajos para verlas en 3D." onIr={() => setPestana('items')} etiquetaIr="Ir a Trabajos" onEjemplo={cargarEjemplo} />)}
        {pestana === 'despiece' && (cot.items.length
          ? <Materiales cot={cot} setCot={setCot} r={r} total={total} desglose={desglose} onIrAPrecios={onIrAPrecios} onPresupuesto={() => setPestana('presupuesto')} />
          : <Vacio tema={T} Icono={AppWindow} texto="Los perfiles, vidrios y accesorios salen de los trabajos que agregues." onIr={() => setPestana('items')} etiquetaIr="Ir a Trabajos" onEjemplo={cargarEjemplo} />)}
        {pestana === 'presupuesto' && <Presupuesto cot={cot} setCot={setCot} r={r} desglose={desglose} onIrAPrecios={onIrAPrecios} />}
      </div>
    </div>
  );
}

// ── 2. Vista 3D (todo o un trabajo; en el celular empieza con uno) ───────────
function Vista3D({ items }: { items: ItemVidrio[] }) {
  const [ver, setVer] = useState<string | null>(() => typeof window !== 'undefined' && window.innerWidth < 768 && items.length > 1 ? items[0].id : null);
  const lista = items.filter(i => i.id === ver);
  return (
    <div className="h-full min-h-[480px] p-2 sm:p-4 flex flex-col gap-2">
      {items.length > 1 && <Chips3D items={items.map((it, i) => ({ id: it.id, titulo: nombreItem(it, i) }))} ver={lista.length ? ver : null} setVer={setVer} tema={T} />}
      <div className="flex-1 min-h-[420px]">
        <Suspense fallback={<div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Cargando 3D…</div>}>
          <Vidrios3D items={lista.length ? lista : items} />
        </Suspense>
      </div>
    </div>
  );
}

// ── 1. Trabajos ─────────────────────────────────────────────────────────────
function Trabajos({ cot, setCot, r, total, sel, setSel, onEjemplo, onPresupuesto, desglose }: {
  cot: CotizacionVidrios; setCot: SetCot; r: MetradoVidrios; total: number; sel: string | null; setSel: (id: string | null) => void; onEjemplo: () => void; onPresupuesto: () => void; desglose: [string, number][];
}) {
  const catalogo = useCatalogo();
  const sub = useMemo(() => new Map(cot.items.map(it => [it.id, totalConGG(metradoVidrios([it], cot).directo, cot)])),
    [cot.items, cot.merma, cot.modoMO, cot.gg, cot.util, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const upd = (id: string, p: Partial<ItemVidrio>) => setCot(c => ({ ...c, items: c.items.map(i => i.id === id ? { ...i, ...p } : i) }));
  const agregar = (t: TipoVid) => {
    const ultimo = [...cot.items].reverse().find(i => tipoVid(i.tipo).aluminio);
    const n = itemNuevo(t, ultimo ? { color: ultimo.color } : {});
    setCot(c => ({ ...c, items: [...c.items, n] })); setSel(n.id);
  };
  const nUnid = cot.items.reduce((s, i) => s + Math.max(1, i.cantidad), 0);
  return (
    <div className="p-3 sm:p-5 max-w-[1600px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5 xl:items-start">
      <div className="space-y-4 min-w-0">
        <DatosCotizacion cot={cot} setCot={setCot} keyLista={KEY_COT_LISTA} vacia={cotizacionVacia} tema={T} onEjemplo={onEjemplo} placeholder="Ej. Ventanas y mampara – Sr. Luis" />
        <SelectorTipos titulo="¿Qué vas a hacer en vidrio y aluminio?" tipos={TIPOS_VIDRIO} onElegir={agregar} tema={T} />
        {cot.items.length === 0 && <p className="text-center text-sm text-slate-400 py-6">Agrega tu primer trabajo con los botones de arriba o toca “Cargar ejemplo”.</p>}
        <div className="space-y-2.5">
          {cot.items.map((it, i) => (
            <TarjetaItem key={it.id} tema={T} abierta={sel === it.id} onToggle={() => setSel(sel === it.id ? null : it.id)}
              miniatura={<DibujoVidrio it={it} mini className="w-full h-full" />} titulo={nombreItem(it, i)}
              subtitulo={`${f2(it.ancho)} × ${f2(it.alto)} m${it.cantidad > 1 ? ` × ${it.cantidad}` : ''} · ${detalleItem(it)}`}
              precio={`≈ ${S(sub.get(it.id) || 0)}`} aviso={!!r.avisos.get(it.id)?.length}>
              <Editor it={it} upd={p => upd(it.id, p)} avisos={r.avisos.get(it.id) || []}
                onDuplicar={() => { const n = { ...it, id: uid() }; setCot(c => ({ ...c, items: [...c.items.slice(0, i + 1), n, ...c.items.slice(i + 1)] })); setSel(n.id); }}
                onQuitar={() => { if (confirm('¿Quitar este trabajo?')) { setCot(c => ({ ...c, items: c.items.filter(x => x.id !== it.id) })); setSel(null); } }} />
            </TarjetaItem>
          ))}
        </div>
        {cot.items.length > 0 && <BarraTotal tema={T} detalle={`${nUnid} unidad${nUnid > 1 ? 'es' : ''} · ${r.nBarras} barras · ${f2(r.m2Total)} m² de vidrio`} total={total} onPresupuesto={onPresupuesto} />}
      </div>
      <ResumenPC tema={T} total={total} detalle={`${nUnid} unidades · ${r.nBarras} barras de 6 m · ${f2(r.m2Total)} m² de vidrio · incluye GG ${cot.gg}% y utilidad ${cot.util}%`}
        desglose={desglose} onPresupuesto={onPresupuesto}
        filas={cot.items.map((it, i) => ({ id: it.id, titulo: `${it.cantidad > 1 ? `${it.cantidad} × ` : ''}${nombreItem(it, i)}`, sub: `${f2(it.ancho)}×${f2(it.alto)}`, onClick: () => setSel(it.id) }))} />
    </div>
  );
}

function Editor({ it, upd, avisos, onDuplicar, onQuitar }: { it: ItemVidrio; upd: (p: Partial<ItemVidrio>) => void; avisos: string[]; onDuplicar: () => void; onQuitar: () => void }) {
  const t = tipoVid(it.tipo);
  const conColor = t.aluminio && (it.tipo !== 'espejo' || it.marcoEspejo);
  return (
    <div className="px-3 pb-3 sm:px-4 sm:pb-4 border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px] 2xl:grid-cols-[minmax(0,1fr)_300px] gap-4">
      <div className="space-y-3 min-w-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <label className="col-span-2 block text-[10px] font-bold text-slate-500 uppercase">Nombre
            <input value={it.nombre} onChange={e => upd({ nombre: e.target.value })} placeholder={t.nombre} className="mt-0.5 w-full min-h-[40px] px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </label>
          <Num label="Cantidad" value={it.cantidad} onChange={v => upd({ cantidad: v })} min={1} max={200} entero sufijo="und" step={1} />
          <Num label={t.etiquetas.ancho} value={it.ancho} onChange={v => upd({ ancho: v })} min={0.2} max={it.tipo === 'baranda' ? 30 : 8} />
          <Num label={t.etiquetas.alto} value={it.alto} onChange={v => upd({ alto: v })} min={0.2} max={3.2} />
          {t.sistemas.length > 0 && <Elegir label="Sistema" value={it.sistema} onChange={v => upd({ sistema: v })} opciones={t.sistemas.map(s => [s, SISTEMAS[s]] as [Sistema, string])} />}
          <Elegir label="Vidrio" value={it.vidrio} onChange={v => upd({ vidrio: v })} opciones={t.vidrios.map(v => [v, vidrioDe(v).corto] as [TipoVidrio, string])} />
          {t.hojas.length > 1 && <Segmento label={it.tipo === 'fija' ? 'Paños' : 'Hojas'} value={it.hojas} onChange={v => upd({ hojas: v })} opciones={t.hojas.map(h => [h, String(h)] as [number, string])} />}
          {it.tipo === 'puerta_templada' && <Segmento label="Sujeción" value={it.sujecion} onChange={v => upd({ sujecion: v })} opciones={[['piso', 'Bisagra de piso'], ['pivote', 'Pivotes']]} />}
          {it.tipo === 'puerta_templada' && it.hojas === 1 && <Segmento label="Gira en" value={it.lado} onChange={v => upd({ lado: v })} opciones={[['izq', 'Izquierda'], ['der', 'Derecha']]} />}
          {it.tipo === 'ducha' && <Segmento label="Puerta" value={it.ducha} onChange={v => upd({ ducha: v })} opciones={[['corrediza', 'Corrediza'], ['batiente', 'Batiente']]} />}
          {it.tipo === 'baranda' && <Segmento label="Sujeción" value={it.baranda} onChange={v => upd({ baranda: v })} opciones={[['perfil', 'Perfil base'], ['pinzas', 'Pinzas']]} />}
        </div>
        {conColor && (
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Color del aluminio</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {COLORES_ALU.map(c => (
                <button key={c.id} onClick={() => upd({ color: c.id as ColorAluminio })}
                  className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer border ${it.color === c.id ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                  <span className="w-4 h-4 rounded-full border border-slate-300" style={{ background: c.hex }} />{c.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-x-4">
          {(it.tipo === 'mampara' || it.tipo === 'puerta_templada') && <Check tema={T} label="Con chapa (cerradura)" value={it.chapa} onChange={v => upd({ chapa: v })} />}
          {it.tipo === 'espejo' && <Check tema={T} label="Biselado" value={it.biselado} onChange={v => upd({ biselado: v })} />}
          {it.tipo === 'espejo' && <Check tema={T} label="Con marco de aluminio" value={it.marcoEspejo} onChange={v => upd({ marcoEspejo: v })} />}
        </div>
        <Avisos lista={avisos} />
        <div className="flex flex-wrap gap-2">
          <button onClick={onDuplicar} className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}><Copy className="w-4 h-4" /> Duplicar</button>
          <button onClick={onQuitar} className={`${btn} bg-rose-50 text-rose-700 hover:bg-rose-100`}><Trash2 className="w-4 h-4" /> Quitar</button>
        </div>
      </div>
      <div className="order-first md:order-none rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center md:min-h-[260px]">
        <DibujoVidrio it={it} className="w-full h-[220px] md:h-full md:max-h-[340px]" />
      </div>
    </div>
  );
}

// ── 3. Materiales y despiece ──────────────────────────────────────────────────
function Materiales({ cot, setCot, r, total, desglose, onIrAPrecios, onPresupuesto }: {
  cot: CotizacionVidrios; setCot: SetCot; r: MetradoVidrios; total: number; desglose: [string, number][]; onIrAPrecios?: () => void; onPresupuesto: () => void;
}) {
  const nAcc = r.lineas.filter(l => l.grupo === 'Accesorios').reduce((s, l) => s + l.cant, 0);
  const tarjetas = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Dato titulo="Perfiles" valor={`${r.nBarras} barras`} sub={`${r.barras.length} perfiles de 6 m`} color="#64748b" />
      <Dato titulo="Vidrio" valor={`${f2(r.m2Total)} m²`} sub={Object.keys(r.m2).map(k => vidrioDe(k as TipoVidrio).corto).join(' · ')} color="#0891b2" />
      <Dato titulo="Accesorios" valor={`${Math.round(nAcc)}`} sub="rodamientos, felpa, cierres…" color="#0f766e" />
      <Dato titulo="Días de vidriero" valor={`${f2(r.dias)}`} sub="fabricación e instalación" color="#7c3aed" />
    </div>
  );
  const despiece = (
    <>
      {r.barras.length > 0 && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-3 break-inside-avoid">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-slate-500" />
            <h3 className="text-sm font-black text-slate-900 flex-1">Cortes de perfiles (barras de 6 m)</h3>
            <span className="text-[10px] font-bold text-slate-400">mm · sierra 4 mm</span>
          </div>
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-x-6 gap-y-4">
          {r.barras.map(b => {
            const cortes = new Map<string, number>();
            b.barras.forEach(br => br.cortes.forEach(c => { const k = `${c.largo}|${c.etiqueta.split(': ').pop()}`; cortes.set(k, (cortes.get(k) || 0) + 1); }));
            return (
              <div key={`${b.perfil}|${b.color}`} className="space-y-1.5 break-inside-avoid">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="w-3 h-3 rounded-full border border-slate-300 self-center" style={{ background: colorAlu(b.color).hex }} />
                  <p className="text-xs font-black text-slate-800">{b.nombre}</p>
                  <p className="text-[11px] font-bold text-slate-500">{colorAlu(b.color).nombre} · {b.barras.length} barra{b.barras.length > 1 ? 's' : ''} · {b.cortes} corte{b.cortes > 1 ? 's' : ''}</p>
                </div>
                <BarrasSvg barras={b.barras} color="#0e7490" />
                <div className="flex flex-wrap gap-1">
                  {[...cortes.entries()].sort((a, c) => parseInt(c[0]) - parseInt(a[0])).map(([k, n]) => {
                    const [largo, et] = k.split('|');
                    return <span key={k} className="text-[10px] font-bold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5"><span className="font-mono">{n} × {largo}</span> {et}</span>;
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xs space-y-2 break-inside-avoid">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-cyan-600" />
          <h3 className="text-sm font-black text-slate-900 flex-1">Vidrios a pedir</h3>
          <span className="text-[10px] font-bold text-slate-400">medidas en mm</span>
        </div>
        <div className="hidden md:block">
          <table className="w-full text-xs">
            <thead><tr className="text-[10px] uppercase text-slate-400 border-b border-slate-200">
              <th className="text-left py-1 font-black">Trabajo</th><th className="text-left py-1 font-black">Pieza</th><th className="text-left py-1 font-black">Vidrio</th>
              <th className="text-right py-1 font-black">Ancho</th><th className="text-right py-1 font-black">Alto</th><th className="text-right py-1 font-black">Cant.</th><th className="text-right py-1 font-black">m²</th>
            </tr></thead>
            <tbody>{r.panos.map((p, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-1 pr-2 font-bold text-slate-700">{p.item}</td><td className="py-1 pr-2 text-slate-500">{p.nombre}</td><td className="py-1 pr-2 text-slate-500">{p.vidrio}</td>
                <td className="py-1 text-right font-mono font-bold">{p.w}</td><td className="py-1 text-right font-mono font-bold">{p.h}</td><td className="py-1 text-right font-mono">{p.n}</td><td className="py-1 text-right font-mono text-slate-600">{f2(p.m2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-slate-100">
          {r.panos.map((p, i) => (
            <div key={i} className="py-1.5 flex flex-nowrap items-start gap-2">
              <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-700 leading-snug">{p.item}</p><p className="text-[10px] text-slate-400">{p.nombre} · {p.vidrio}</p></div>
              <div className="text-right shrink-0"><p className="text-xs font-mono font-black text-slate-800">{p.n} × {p.w} × {p.h}</p><p className="text-[10px] font-mono text-slate-400">{f2(p.m2)} m²</p></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
  return (
    <PanelMateriales tema={T} cot={cot} setCot={setCot} lineas={r.lineas} grupos={[...GRUPOS_VID]} colorGrupo={COLOR_GRUPO_VID} tarjetas={tarjetas} despiece={despiece}
      onPresupuesto={onPresupuesto} onIrAPrecios={onIrAPrecios} titulo="Materiales de vidrios y aluminio" desglose={desglose} total={total}
      ajustes={<p className="text-[10px] text-slate-400 leading-snug">Perfiles en barras de 6 m con el mejor acomodo de cortes. El desperdicio se aplica al vidrio crudo, laminado, catedral y espejo; el templado se pide a medida. Color del aluminio: recargo % editable en Precios.</p>} />
  );
}

// ── 4. Presupuesto ──────────────────────────────────────────────────────────
function Presupuesto({ cot, setCot, r, desglose, onIrAPrecios }: { cot: CotizacionVidrios; setCot: SetCot; r: MetradoVidrios; desglose: [string, number][]; onIrAPrecios?: () => void }) {
  const alcance = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {cot.items.map((it, i) => (
        <div key={it.id} className="rounded-xl bg-slate-50 p-2 flex flex-nowrap gap-2 break-inside-avoid">
          <div className="w-24 h-20 shrink-0 bg-white rounded-lg p-1"><DibujoVidrio it={it} mini className="w-full h-full" /></div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-800">{it.cantidad > 1 ? `${it.cantidad} × ` : ''}{nombreItem(it, i)}</p>
            <p className="text-[11px] font-mono font-bold text-slate-600">{f2(it.ancho)} × {f2(it.alto)} m</p>
            <p className="text-[10px] text-slate-500 leading-snug">{detalleItem(it)}</p>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <PresupuestoFormal tema={T} cot={cot} setCot={setCot} lineas={r.lineas} grupos={[...GRUPOS_VID]} colorGrupo={COLOR_GRUPO_VID}
      titulo="Presupuesto de vidrios y aluminio" subtitulo="Presupuesto de vidrios y carpintería de aluminio" alcance={alcance} desglose={desglose} onIrAPrecios={onIrAPrecios}
      textoVacio="Agrega los trabajos en la pestaña Trabajos para ver el presupuesto."
      whatsapp={() => cot.items.map((it, i) => `• ${it.cantidad > 1 ? `${it.cantidad} × ` : ''}${nombreItem(it, i)} ${f2(it.ancho)} × ${f2(it.alto)} m (${detalleItem(it)})`)}
      notas={<>
        <p>Medidas del vano terminado; se verifican en obra antes de fabricar. Vidrios de seguridad (templado o laminado) en mamparas, puertas, duchas y barandas según la Norma E.040 del RNE.</p>
        <p>Incluye fabricación, instalación, sellado con silicona y accesorios indicados. No incluye resanes de albañilería ni pintura, salvo que se indique.</p>
      </>} />
  );
}
