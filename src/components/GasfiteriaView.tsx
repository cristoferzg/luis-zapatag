// =============================================================================
// Gasfitería: instalaciones sanitarias (agua fría, agua caliente, desagüe y ventilación).
//   1. Plano: aparatos y tuberías en planta, trazado automático, empalmes y avisos IS.010.
//   2. 3D / Isométrico: las redes con su diámetro y altura, para mostrar al cliente.
//   3. Materiales: barras de tubo, conexiones, consumibles, aparatos y mano de obra.
//   4. Presupuesto: formal, para imprimir o enviar por WhatsApp.
// =============================================================================
import BotonTodoJunto3D from './instalaciones/BotonTodoJunto3D';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Droplets, Box, ListChecks, ClipboardList, Tag, Send, Map as MapIc, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { CabeceraEmpresa, useEmpresa, BandaMarca, CondicionesComerciales } from '../lib/empresa';
import BotonImprimir from './common/BotonImprimir';
import { simb } from '../lib/currency';
import { CotizacionGas, KEY_COT_ACTUAL, KEY_PESTANA, KEY_ORIGEN_GAS, REDES, ORDEN_REDES, Red, leerCotizacionActual, defAparato, cotizacionEjemplo } from './gasfiteria/modeloGasfiteria';
import { metradoGas, MetradoGas, totalCon, GRUPOS_LINEA, GrupoLinea, LineaGas, trazarAutomatico, avisosGas, verificarInstalacion, instalacionVerificada } from './gasfiteria/calculoGasfiteria';
import VerificacionGas from './gasfiteria/VerificacionGas';
import PlanoGas from './gasfiteria/PlanoGas';
import type { Visibles } from './gasfiteria/Gasfiteria3D';
import { IconoAparato } from './gasfiteria/SimboloAparato';
import BotonElectricidad from './electricidad/BotonElectricidad';
import InputNumero from './common/InputNumero';

const Gasfiteria3D = lazy(() => import('./gasfiteria/Gasfiteria3D'));

const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Pestana = 'plano' | '3d' | 'materiales' | 'presupuesto';
const PESTANAS: Pestana[] = ['plano', '3d', 'materiales', 'presupuesto'];
type SetCot = (f: (c: CotizacionGas) => CotizacionGas) => void;
const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer';
const COLOR_GRUPO: Record<GrupoLinea, string> = {
  'Agua fría': REDES.fria.color, 'Agua caliente': REDES.caliente.color, 'Desagüe': REDES.desague.color, 'Ventilación': REDES.ventilacion.color,
  'Consumibles': '#64748b', 'Aparatos sanitarios': '#0d9488', 'Mano de obra': '#7c3aed',
};

function useMetrado(cot: CotizacionGas) {
  const catalogo = useCatalogo();
  return useMemo(() => metradoGas(cot), [cot.aparatos, cot.tramos, cot.merma, cot.incluirAparatos, cot.instalarAparatos, cot.pruebaHidraulica, cot.modoMO, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function GasfiteriaView({ onIrAPrecios }: { onIrAPrecios?: () => void }) {
  const [pestana, setPestana] = useState<Pestana>(() => {
    if (safeStorage.getItem<string>(KEY_ORIGEN_GAS, '')) return 'plano'; // abierto desde Techos: al plano
    const p = safeStorage.getItem<string>(KEY_PESTANA, 'plano');
    return (PESTANAS.includes(p as Pestana) ? p : 'plano') as Pestana;
  });
  useEffect(() => { safeStorage.setItem(KEY_PESTANA, pestana); }, [pestana]);
  const [cot, setCotRaw] = useState<CotizacionGas>(leerCotizacionActual);
  useEffect(() => { safeStorage.setItem(KEY_COT_ACTUAL, cot); }, [cot]);
  const setCot: SetCot = f => setCotRaw(c => f(c));
  const r = useMetrado(cot);
  const cargarEjemplo = () => { const ej = cotizacionEjemplo(); setCot(() => ({ ...ej, tramos: trazarAutomatico(ej.aparatos).tramos })); };

  const tabs: { id: Pestana; label: string; corto: string; icon: any }[] = [
    { id: 'plano', label: 'Plano', corto: 'Plano', icon: MapIc },
    { id: '3d', label: '3D / Isométrico', corto: '3D', icon: Box },
    { id: 'materiales', label: 'Materiales', corto: 'Materiales', icon: ListChecks },
    { id: 'presupuesto', label: 'Presupuesto', corto: 'Presup.', icon: ClipboardList },
  ];
  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      <div className="oculto-en-dibujo flex flex-row flex-nowrap items-center justify-center lg:justify-between gap-2 lg:gap-3 px-2 sm:px-4 py-1.5 lg:py-3 bg-white border-b border-slate-200">
        <div className="hidden lg:flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600"><Droplets className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">Gasfitería</h2>
            <p className="text-[11px] text-slate-500">Agua fría, agua caliente, desagüe y ventilación: plano, 3D, materiales y presupuesto.</p>
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
        <BotonElectricidad origen="gasfiteria" />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {pestana === 'plano' && <PlanoGas cot={cot} setCot={setCot} r={r} onPresupuesto={() => setPestana('presupuesto')} onMateriales={() => setPestana('materiales')} />}
        {pestana === '3d' && <Vista3D cot={cot} r={r} onPlano={() => setPestana('plano')} onEjemplo={cargarEjemplo} />}
        {pestana === 'materiales' && <Materiales cot={cot} setCot={setCot} r={r} onIrAPrecios={onIrAPrecios} onPresupuesto={() => setPestana('presupuesto')} onPlano={() => setPestana('plano')} />}
        {pestana === 'presupuesto' && <Presupuesto cot={cot} setCot={setCot} r={r} onIrAPrecios={onIrAPrecios} onPlano={() => setPestana('plano')} />}
      </div>
    </div>
  );
}

function Vacio({ texto, onPlano, onEjemplo }: { texto: string; onPlano: () => void; onEjemplo?: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center"><Droplets className="w-6 h-6" /></div>
      <p className="text-sm text-slate-500 max-w-sm">{texto}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={onPlano} className={`${btn} bg-teal-600 text-white`}><MapIc className="w-4 h-4" /> Ir al plano</button>
        {onEjemplo && <button onClick={onEjemplo} className={`${btn} bg-slate-100 text-slate-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>}
      </div>
    </div>
  );
}

// ── 2. 3D / Isométrico ─────────────────────────────────────────────────────
function Vista3D({ cot, r, onPlano, onEjemplo }: { cot: CotizacionGas; r: MetradoGas; onPlano: () => void; onEjemplo: () => void }) {
  const [ver, setVer] = useState<Visibles>({ fria: true, caliente: true, desague: true, ventilacion: true, aparatos: true, muros: true });
  if (!cot.aparatos.length && !cot.tramos.length) return <Vacio texto="Pon los aparatos y traza las tuberías en el Plano para verlas en 3D." onPlano={onPlano} onEjemplo={onEjemplo} />;
  const chip = (k: keyof Visibles, label: string, color?: string) => (
    <button key={k} onClick={() => setVer(v => ({ ...v, [k]: !v[k] }))}
      className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer border ${ver[k] ? 'bg-white shadow-xs text-slate-800 border-slate-200' : 'bg-slate-100 text-slate-400 border-transparent'}`}>
      {color ? <span className="w-2.5 h-2.5 rounded-full" style={{ background: ver[k] ? color : '#cbd5e1' }} /> : ver[k] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}{label}
      {color && <span className="font-mono text-slate-400">{f2(r.largo[k as Red])} m</span>}
    </button>
  );
  return (
    <div className="h-full min-h-[480px] flex flex-col gap-2 sm:gap-3 p-2 sm:p-4">
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xs flex flex-wrap items-center gap-1.5 shrink-0">
        {ORDEN_REDES.map(rd => chip(rd, REDES[rd].nombre, REDES[rd].color))}
        <span className="hidden sm:block w-px h-6 bg-slate-200 mx-0.5" />
        {chip('aparatos', 'Aparatos')}
        {chip('muros', cot.fondo.tipo === 'techos' ? 'Columnas' : 'Muros')}
        {(cot.fondo.tipo === 'techos' || cot.fondo.tipo === 'obra') && <BotonTodoJunto3D conTexto className="ml-auto" origen={cot.fondo.tipo === 'obra' ? 'obra' : 'techos'} />}
      </div>
      <div className="flex-1 min-h-[360px]">
        <Suspense fallback={<div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Cargando 3D…</div>}>
          <Gasfiteria3D cot={cot} ver={ver} empalmes={r.empalmes} />
        </Suspense>
      </div>
    </div>
  );
}

// ── Tabla de líneas (tabla en PC, lista en el celular) ───────────────────────
function Lineas({ lineas, compacta = false }: { lineas: LineaGas[]; compacta?: boolean }) {
  return (
    <>
      <div className={`${compacta ? 'hidden' : 'hidden md:block'} overflow-x-auto`}>
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
                <td className="py-1.5 pr-2 text-slate-400 max-w-[280px]">{l.nota}</td>
                <td className="py-1.5 text-right font-mono font-bold text-slate-800">{l.cant}</td>
                <td className="py-1.5 pl-2 text-slate-500">{l.unidad}</td>
                <td className={`py-1.5 pl-2 text-right font-mono ${l.precio ? 'text-slate-600' : 'text-amber-600'}`}>{l.precio.toFixed(2)}</td>
                <td className="py-1.5 pl-2 text-right font-mono font-bold text-slate-800">{l.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={`${compacta ? '' : 'md:hidden'} divide-y divide-slate-100`}>
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

// ── 3. Materiales ──────────────────────────────────────────────────────────
function Materiales({ cot, setCot, r, onIrAPrecios, onPresupuesto, onPlano }: { cot: CotizacionGas; setCot: SetCot; r: MetradoGas; onIrAPrecios?: () => void; onPresupuesto: () => void; onPlano: () => void }) {
  const hojaRef = useRef<HTMLDivElement>(null);
  if (!cot.aparatos.length && !cot.tramos.length) return <Vacio texto="Los materiales salen del plano: pon los aparatos y traza las tuberías." onPlano={onPlano} />;
  const total = totalCon(r, cot);
  const sinPrecio = r.lineas.some(l => l.precio === 0);
  const chk = 'flex items-center gap-2 min-h-[40px] text-xs font-bold text-slate-700 cursor-pointer';
  const grupos = GRUPOS_LINEA.map(g => ({ g, ls: r.lineas.filter(l => l.grupo === g) })).filter(x => x.ls.length);
  return (
    <div className="p-2 sm:p-4 max-w-[1600px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-4 xl:items-start">
      <div className="space-y-3 min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ORDEN_REDES.map(rd => (
            <div key={rd} className="bg-white rounded-2xl p-3 shadow-xs min-w-0 border-l-4" style={{ borderLeftColor: REDES[rd].color }}>
              <p className="text-[10px] font-black uppercase text-slate-400 truncate">{REDES[rd].nombre}</p>
              <p className="text-lg font-black font-mono text-slate-900 leading-tight">{f2(r.largo[rd])} m</p>
              <p className="text-[10px] text-slate-500 truncate">{REDES[rd].material} · {rd === 'ventilacion' ? `${r.puntos.ventilacion} salida${r.puntos.ventilacion === 1 ? '' : 's'}` : `${r.puntos[rd]} punto${r.puntos[rd] === 1 ? '' : 's'}`}</p>
            </div>
          ))}
        </div>
        {sinPrecio && <p className="text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">Hay productos sin precio (en naranja). Escríbelos en Precios → “Gasfitería” o en “Mano de obra”.</p>}
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
            <p className="text-[10px] font-bold text-slate-400 uppercase truncate">Materiales {S(r.materiales)} · M. de obra {S(r.manoObra)}</p>
            <p className="text-lg font-black font-mono truncate">{S(total)}</p>
          </div>
          <button onClick={onPresupuesto} className={`${btn} bg-teal-500 text-white hover:bg-teal-400 shrink-0`}><ClipboardList className="w-4 h-4" /> Presupuesto</button>
        </div>
        <div className="xl:hidden"><Ajustes cot={cot} setCot={setCot} onIrAPrecios={onIrAPrecios} hoja={() => hojaRef.current} chk={chk} /></div>
      </div>
      <aside className="hidden xl:block sticky top-4 space-y-3">
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total con GG {cot.gg}% y utilidad {cot.util}%</p>
          <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-2"><span className="text-slate-400">Materiales</span><span className="font-mono font-bold">{S(r.materiales)}</span></div>
            {cot.incluirAparatos && <div className="flex justify-between gap-2"><span className="text-slate-400">Aparatos sanitarios</span><span className="font-mono font-bold">{S(r.aparatos)}</span></div>}
            <div className="flex justify-between gap-2"><span className="text-slate-400">Mano de obra</span><span className="font-mono font-bold">{S(r.manoObra)}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-400">Empalmes</span><span className="font-mono font-bold">{r.nEmpalmes} piezas</span></div>
          </div>
          <button onClick={onPresupuesto} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-black cursor-pointer hover:bg-teal-400"><ClipboardList className="w-4 h-4" /> Ver presupuesto</button>
        </div>
        <Ajustes cot={cot} setCot={setCot} onIrAPrecios={onIrAPrecios} hoja={() => hojaRef.current} chk={chk} />
      </aside>
    </div>
  );
}

function Ajustes({ cot, setCot, onIrAPrecios, hoja, chk }: { cot: CotizacionGas; setCot: SetCot; onIrAPrecios?: () => void; hoja: () => HTMLElement | null; chk: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <p className="text-xs font-black text-slate-800">Cómo se calcula</p>
      <label className="flex items-center gap-2 text-xs font-bold text-slate-700">Desperdicio de tubo
        <InputNumero type="number" min={0} max={40} value={cot.merma} onChange={e => setCot(c => ({ ...c, merma: Math.max(0, Math.min(40, parseFloat(e.target.value) || 0)) }))} className="ml-auto w-16 min-h-[36px] px-2 rounded-lg bg-slate-100 font-mono text-right" /> %
      </label>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Mano de obra</p>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
          {([['puntos', 'Por punto'], ['jornal', 'Por jornal']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setCot(c => ({ ...c, modoMO: v }))} className={`min-h-[36px] rounded-lg text-xs font-bold cursor-pointer ${cot.modoMO === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{l}</button>
          ))}
        </div>
      </div>
      <label className={chk}><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={cot.incluirAparatos} onChange={e => setCot(c => ({ ...c, incluirAparatos: e.target.checked }))} /> Incluir los aparatos sanitarios</label>
      <label className={chk}><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={cot.instalarAparatos} onChange={e => setCot(c => ({ ...c, instalarAparatos: e.target.checked }))} /> Cobrar la instalación de aparatos</label>
      <label className={chk}><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={cot.pruebaHidraulica} onChange={e => setCot(c => ({ ...c, pruebaHidraulica: e.target.checked }))} /> Prueba hidráulica y de desagüe</label>
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <BotonImprimir objetivo={hoja} titulo={`Materiales de gasfitería ${cot.nombre || ''}`} etiqueta="Imprimir" />
      </div>
      <p className="text-[10px] text-slate-400 leading-snug">Tubo de agua PVC C-10 y CPVC en barras de 5 m; desagüe y ventilación PVC SAL en barras de 3 m. Incluye las subidas a cada aparato y la ventilación hasta el techo (2.5 m).</p>
    </div>
  );
}

// ── 4. Presupuesto ──────────────────────────────────────────────────────────
function Presupuesto({ cot, setCot, r, onIrAPrecios, onPlano }: { cot: CotizacionGas; setCot: SetCot; r: MetradoGas; onIrAPrecios?: () => void; onPlano: () => void }) {
  const { datos } = useEmpresa();
  const hojaRef = useRef<HTMLDivElement>(null);
  const directo = r.directo;
  const gg = directo * cot.gg / 100, util = directo * cot.util / 100, total = directo + gg + util;
  const sinPrecio = r.lineas.some(l => l.precio === 0);
  const vacio = cot.aparatos.length === 0;
  const avisos = useMemo(() => avisosGas(cot.tramos, cot.aparatos), [cot.tramos, cot.aparatos]);
  const chequeos = useMemo(() => verificarInstalacion(cot.tramos, cot.aparatos, avisos), [cot.tramos, cot.aparatos, avisos]);
  const verificada = !vacio && instalacionVerificada(chequeos);
  const resumenAp = useMemo(() => { const m = new Map<string, number>(); cot.aparatos.forEach(a => m.set(a.tipo, (m.get(a.tipo) || 0) + 1)); return [...m.entries()]; }, [cot.aparatos]);
  const whatsapp = () => {
    const lineas = [
      `*Presupuesto de instalaciones sanitarias*${cot.nombre ? ` – ${cot.nombre}` : ''}`,
      cot.cliente ? `Cliente: ${cot.cliente}` : '',
      datos.nombre ? `De: ${datos.nombre}${datos.telefono ? ` (${datos.telefono})` : ''}` : '',
      '',
      `Puntos de agua fría: ${r.puntos.fria} · agua caliente: ${r.puntos.caliente} · desagüe: ${r.puntos.desague}${r.puntos.ventilacion ? ` · ventilación: ${r.puntos.ventilacion}` : ''}`,
      `Aparatos: ${resumenAp.map(([t, n]) => `${defAparato(t as any).corto}${n > 1 ? ` ×${n}` : ''}`).join(', ')}`,
      '',
      `Materiales: ${S(r.materiales)}`,
      cot.incluirAparatos ? `Aparatos sanitarios: ${S(r.aparatos)}` : '',
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
        <label className={chk}><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={cot.incluirAparatos} onChange={e => setCot(c => ({ ...c, incluirAparatos: e.target.checked }))} /> Incluir aparatos</label>
        <label className={chk}><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={cot.pruebaHidraulica} onChange={e => setCot(c => ({ ...c, pruebaHidraulica: e.target.checked }))} /> Prueba hidráulica</label>
        <div className="flex-1" />
        {onIrAPrecios && <button onClick={onIrAPrecios} className={`${btn} bg-amber-50 text-amber-800 hover:bg-amber-100`}><Tag className="w-4 h-4" /> Editar precios</button>}
        <button onClick={whatsapp} disabled={vacio} className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40`}><Send className="w-4 h-4" /> WhatsApp</button>
        <BotonImprimir objetivo={() => hojaRef.current} titulo="Presupuesto de gasfitería" etiqueta="Imprimir / PDF" />
      </div>
      {sinPrecio && !vacio && <p className="no-imprimir text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">Hay productos sin precio (en naranja). Escríbelos en Precios → “Gasfitería”.</p>}
      {!vacio && (
        <div className="no-imprimir space-y-1.5">
          <VerificacionGas chequeos={chequeos} hayAparatos compacta />
          {!verificada && <button onClick={onPlano} className={`${btn} w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800`}><MapIc className="w-4 h-4" /> Corregir en el Plano ({avisos.length} observación{avisos.length === 1 ? '' : 'es'})</button>}
        </div>
      )}
      <div ref={hojaRef} className="zona-impresion imprimir-claro bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <BandaMarca />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <CabeceraEmpresa subtitulo="Presupuesto de instalaciones sanitarias (agua y desagüe)" />
          <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
            <p className="font-bold text-slate-700">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            {cot.nombre && <p>Obra: {cot.nombre}</p>}
            {cot.cliente && <p>Cliente: {cot.cliente}</p>}
          </div>
        </div>
        {vacio && <p className="py-10 text-center text-sm text-slate-400">Pon los aparatos en el Plano para ver el presupuesto.</p>}
        {!vacio && (
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase">Alcance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([['fria', 'Puntos de agua fría'], ['caliente', 'Puntos de agua caliente'], ['desague', 'Puntos de desagüe'], ['ventilacion', 'Ventilación al techo']] as [Red, string][]).map(([rd, l]) => (
                <div key={rd} className="rounded-xl bg-slate-50 px-3 py-2 border-l-4 break-inside-avoid" style={{ borderLeftColor: REDES[rd].color }}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{l}</p>
                  <p className="text-base font-black text-slate-900">{r.puntos[rd]} <span className="text-[11px] font-bold text-slate-400">· {f2(r.largo[rd])} m {REDES[rd].material}</span></p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resumenAp.map(([t, n]) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 pl-1 pr-2.5 py-1 text-[11px] font-bold text-slate-700">
                  <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center"><IconoAparato tipo={t as any} className="w-6 h-6" /></span>{defAparato(t as any).nombre}{n > 1 ? ` ×${n}` : ''}
                </span>
              ))}
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase pt-1">Materiales, conexiones y mano de obra</h3>
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
                <tbody>
                  {grupos.map(({ g, ls }) => (
                    <GrupoFilas key={g} g={g} ls={ls} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!vacio && (
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-1 text-xs">
              <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Materiales y conexiones</span><span className="font-mono font-bold">{S(r.materiales)}</span></div>
              {cot.incluirAparatos && <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Aparatos sanitarios</span><span className="font-mono font-bold">{S(r.aparatos)}</span></div>}
              <div className="flex flex-nowrap justify-between gap-2"><span className="text-slate-500 font-bold">Mano de obra</span><span className="font-mono font-bold">{S(r.manoObra)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Gastos generales
                <InputNumero type="number" min={0} value={cot.gg} onChange={e => setCot(c => ({ ...c, gg: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(gg)}</span></div>
              <div className="flex justify-between items-center gap-2"><span className="text-slate-500 font-bold">Utilidad
                <InputNumero type="number" min={0} value={cot.util} onChange={e => setCot(c => ({ ...c, util: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-14 min-h-[32px] px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(util)}</span></div>
              <div className="flex flex-nowrap justify-between gap-2 bg-teal-600 text-white rounded-xl px-3 py-2 mt-1"><span className="font-black uppercase">Total</span><span className="font-mono font-black">{S(total)}</span></div>
            </div>
          </div>
        )}
        {!vacio && <CondicionesComerciales total={total} />}
        {!vacio && (
          <div className="text-[10px] text-slate-400 space-y-0.5">
            {verificada && <p className="font-bold text-emerald-700">✓ Instalación verificada: cada aparato con agua fría (y caliente desde la terma), desagüe hasta la caja de registro con pendiente y ventilación, y diámetros según las unidades de gasto (IS.010).</p>}
            <p>Diseño según la Norma IS.010 del RNE: agua fría PVC C-10 y agua caliente CPVC (½" a cada aparato), desagüe PVC SAL de 2" (4" para inodoros) con pendiente mínima de 1 % a 1.5 %, ventilación de 2" hasta el techo.</p>
            <p>Incluye prueba de presión de las redes de agua y prueba a tubo lleno del desagüe{cot.pruebaHidraulica ? '' : ' (no cotizada)'}. {cot.incluirAparatos ? 'Incluye los aparatos sanitarios indicados.' : 'Los aparatos sanitarios los compra el cliente; se cotiza su instalación.'} No incluye picado de losas ni acabados, salvo que se indique.</p>
          </div>
        )}
      </div>
    </div>
  );
}
function GrupoFilas({ g, ls }: { g: GrupoLinea; ls: LineaGas[] }) {
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

