// =============================================================================
// Drywall: tabiques y cielo raso.
//   • Plano: el mismo plano de Obra Civil (se comparte), con solo las
//     herramientas de drywall. Los tabiques llegan al techo de la estructura de
//     Techos Metálicos vinculada y el cielo raso sigue (o no) la pendiente.
//   • Metrado y presupuesto: placas, parantes, rieles, tornillos, masilla,
//     cinta, esquineros, omegas, colgadores e instalación, por piso, con los
//     precios del Catálogo de precios. Todo pasa a Obra Civil en cada piso.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanelsTopLeft, PenTool, ClipboardList, Tag } from 'lucide-react';
import ConcretoPlanoCad, { PlanoElem } from './ConcretoPlanoCad';
import { metradoDrywall } from './concreto/metradoDrywall';
import { KEY_OBRA_TECHOS_ID, EstructuraTechos } from './concreto/obraPisos';
import { KEY_CIELOS, CieloRaso } from './concreto/geometriaObra';
import { SavedTechosDesign, getCachedTechosDesigns, fetchAllTechosDesigns, setActiveTechosDesignToLoad } from '../lib/techosDesignsRepo';
import { useCatalogo } from '../lib/catalogoPrecios';
import { safeStorage } from '../lib/storageManager';
import { CabeceraEmpresa } from '../lib/empresa';
import BotonImprimir from './common/BotonImprimir';

const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const KEY_PCT = 'drywall_gg_utilidad';

export default function DrywallView({ onIrATechos, onIrAPrecios }: { onIrATechos?: () => void; onIrAPrecios?: () => void }) {
  const [pestana, setPestana] = useState<'plano' | 'metrado'>(() => safeStorage.getItem<'plano' | 'metrado'>('drywall_pestana', 'plano') || 'plano');
  useEffect(() => { safeStorage.setItem('drywall_pestana', pestana); }, [pestana]);

  const Toggle = (
    <div className="inline-flex p-1 bg-slate-100 rounded-xl shrink-0">
      <button onClick={() => setPestana('plano')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${pestana === 'plano' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
        <PenTool className="w-3.5 h-3.5 text-violet-500" /> Plano
      </button>
      <button onClick={() => setPestana('metrado')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${pestana === 'metrado' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
        <ClipboardList className="w-3.5 h-3.5 text-violet-500" /> Metrado y presupuesto
      </button>
    </div>
  );
  const Cabecera = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600"><PanelsTopLeft className="w-5 h-5" /></div>
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase leading-tight">Drywall</h2>
          <p className="text-[11px] text-slate-500">Tabiques y cielo raso sobre tu estructura de Techos. El plano es el mismo de Obra Civil.</p>
        </div>
      </div>
      {Toggle}
    </div>
  );

  if (pestana === 'plano') {
    return (
      <div className="w-full h-full flex flex-col bg-slate-50">
        {Cabecera}
        <div className="flex-1 min-h-0">
          <ConcretoPlanoCad modo="drywall" onEditarEnTechos={d => { setActiveTechosDesignToLoad(d); onIrATechos?.(); }} />
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      {Cabecera}
      <div className="flex-1 min-h-0 overflow-y-auto"><MetradoDrywallTab onIrAPrecios={onIrAPrecios} /></div>
    </div>
  );
}

function MetradoDrywallTab({ onIrAPrecios }: { onIrAPrecios?: () => void }) {
  const catalogo = useCatalogo();
  const hojaRef = useRef<HTMLDivElement>(null);
  const [disenos, setDisenos] = useState<SavedTechosDesign[]>(getCachedTechosDesigns);
  useEffect(() => { fetchAllTechosDesigns().then(setDisenos).catch(() => {}); }, []);
  const techosId = safeStorage.getItem<string>(KEY_OBRA_TECHOS_ID, '') || '';
  const diseno = disenos.find(d => d.id === techosId) || null;
  const est = diseno as unknown as EstructuraTechos | null;
  const niveles = safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Cimentación', 'Piso 1'];
  const elems = safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || [];
  const cielos = safeStorage.getItem<Record<string, CieloRaso>>(KEY_CIELOS, {}) || {};
  const [pct, setPct] = useState<{ gg: number; util: number }>(() => safeStorage.getItem(KEY_PCT, { gg: 10, util: 15 }) || { gg: 10, util: 15 });
  useEffect(() => { safeStorage.setItem(KEY_PCT, pct); }, [pct]);

  const pisos = useMemo(() => metradoDrywall(niveles, est, elems, cielos), [disenos, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const conDatos = pisos.filter(p => p.lineas.length > 0);
  const materiales = conDatos.reduce((x, p) => x + p.materiales, 0);
  const manoObra = conDatos.reduce((x, p) => x + p.manoObra, 0);
  const dias = conDatos.reduce((x, p) => x + p.dias, 0);
  const directo = materiales + manoObra;
  const gg = directo * pct.gg / 100;
  const util = directo * pct.util / 100;
  const total = directo + gg + util;
  const sinPrecio = conDatos.some(p => p.lineas.some(l => l.precio === 0)) || (dias > 0 && manoObra === 0);

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 no-imprimir">
        <span className="text-[11px] font-bold text-slate-500">Estructura: <span className="text-slate-800">{diseno?.nombre || 'sin estructura de Techos (muros de altura fija)'}</span></span>
        <div className="flex-1" />
        {onIrAPrecios && (
          <button onClick={onIrAPrecios} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold cursor-pointer hover:bg-amber-100">
            <Tag className="w-4 h-4" /> Editar precios (Catálogo)
          </button>
        )}
        <BotonImprimir objetivo={() => hojaRef.current} titulo="Presupuesto de drywall" etiqueta="Imprimir presupuesto" />
      </div>
      {sinPrecio && (
        <p className="no-imprimir text-[11px] font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
          Hay productos sin precio (S/ 0.00). Escríbelos en el Catálogo de precios → grupo “Drywall y OSB”, “Accesorios de drywall” y el jornal “Instalador de drywall”.
        </p>
      )}

      <div ref={hojaRef} className="zona-impresion bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <CabeceraEmpresa subtitulo="Presupuesto de tabiques y cielo raso de drywall" />
          <div className="text-left sm:text-right text-[11px] text-slate-500 shrink-0">
            <p className="font-bold text-slate-700">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            {diseno && <p>Estructura: {diseno.nombre}</p>}
          </div>
        </div>

        {conDatos.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">Aún no hay tabiques ni cielo raso. Ve a la pestaña “Plano” y dibuja con la herramienta Muro (drywall u OSB) o activa el cielo raso del piso.</p>
        )}

        {conDatos.map(p => (
          <div key={p.nivel} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase">{p.nivel}</h3>
              <p className="text-[11px] font-bold text-slate-500">Tabiques {p.tabiquesM2.toFixed(2)} m² · placa {p.placaTabiquesM2.toFixed(2)} m² · cielo raso {p.cieloM2.toFixed(2)} m²</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
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
                  {p.lineas.map((l, i) => (
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
                    <td className="py-1.5 text-slate-400">tabique 12 m²/día · cielo 15 m²/día</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{p.dias}</td>
                    <td className="py-1.5 pl-2 text-slate-500">día</td>
                    <td className={`py-1.5 text-right font-mono ${p.manoObra ? 'text-slate-600' : 'text-amber-600'}`}>{p.dias ? (p.manoObra / p.dias).toFixed(2) : '0.00'}</td>
                    <td className="py-1.5 text-right font-mono font-bold text-slate-800">{p.manoObra.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="py-1.5 text-right font-black text-slate-500 uppercase text-[10px]">Subtotal {p.nivel}</td>
                    <td className="py-1.5 text-right font-mono font-black text-violet-700">{p.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {conDatos.length > 0 && (
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Materiales</span><span className="font-mono font-bold">{S(materiales)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Mano de obra ({dias.toFixed(1)} días)</span><span className="font-mono font-bold">{S(manoObra)}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Gastos generales
                <input type="number" min={0} value={pct.gg} onChange={e => setPct(x => ({ ...x, gg: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-12 px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(gg)}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-500 font-bold">Utilidad
                <input type="number" min={0} value={pct.util} onChange={e => setPct(x => ({ ...x, util: Math.max(0, parseFloat(e.target.value) || 0) }))} className="ml-1 w-12 px-1 py-0.5 rounded bg-slate-100 text-right font-mono" /> %</span><span className="font-mono font-bold">{S(util)}</span></div>
              <div className="flex justify-between bg-violet-600 text-white rounded-xl px-3 py-2 mt-1"><span className="font-black uppercase">Total</span><span className="font-mono font-black">{S(total)}</span></div>
            </div>
          </div>
        )}
        <p className="text-[10px] text-slate-400">Cuantías referenciales (parantes cada 0.61 m, 5% de desperdicio en placas). Los materiales y la instalación de cada piso también se suman en Obra Civil → Metrados.</p>
      </div>
    </div>
  );
}
