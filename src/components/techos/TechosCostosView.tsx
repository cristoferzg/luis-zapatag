// Estructura de Costos de Techos Metálicos (editable).
// 1) Precios de materiales según el proveedor del usuario (perfiles,
//    coberturas y accesorios), 2) mano de obra por cuadrilla o %, 3) gastos
//    operativos (grúa, transporte…) por monto o %, 4) GG, utilidad e IGV.
// Todo alimenta el BOM y el Presupuesto Formal al instante.
import React from 'react';
import { DollarSign, Plus, Trash2, RotateCcw, Package, HardHat, Truck, Percent } from 'lucide-react';
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS, PLACA_BASE_ESTANDAR, PERNO_ANCLAJE_J, PERNO_EPDM_ESTANDAR, SOLDADURA_AWS_E6011 } from './techosCadCatalog';
import { useCostosTechos, guardarCostosTechos, totalCuadrilla, totalOperativos, CostosTechos, jornalDe } from './costosTechos';
import { useCatalogo, precio, fijarPrecio, quitarPrecio, tienePrecioPropio, clavePerfil, claveCobertura, claveJornal } from '../../lib/catalogoPrecios';

interface TechosCostosViewProps {
  design?: any;
  onUpdateDesign?: (updated: any) => void;
}

const S = (n: number) => `S/ ${(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v: string) => Math.max(0, parseFloat(v) || 0);
const inp = 'w-full px-2 py-1.5 rounded-lg bg-slate-100 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300';

function Seccion({ icono, titulo, total, children }: { icono: React.ReactNode; titulo: string; total?: number; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">{icono}{titulo}</h3>
        {total !== undefined && <span className="text-sm font-black font-mono text-slate-900">{S(total)}</span>}
      </div>
      {children}
    </section>
  );
}

function Modo({ valor, onChange }: { valor: 'porcentaje' | 'detalle'; onChange: (v: 'porcentaje' | 'detalle') => void }) {
  return (
    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-[11px] font-bold">
      {([['detalle', 'Detallado'], ['porcentaje', '% de materiales']] as const).map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} className={`px-2.5 py-1 rounded-md cursor-pointer ${valor === k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{l}</button>
      ))}
    </div>
  );
}

export const TechosCostosView: React.FC<TechosCostosViewProps> = ({ design }) => {
  const c = useCostosTechos();
  useCatalogo(); // se redibuja al cambiar un precio del catálogo único
  const set = (p: Partial<CostosTechos>) => guardarCostosTechos(p);
  const bom = design && typeof design.precioVentaFinalSoles === 'number' ? design : null;
  const perfiles: any[] = bom?.despiecePerfiles || [];
  const coberturas: any[] = bom?.resumenCoberturas || [];

  // Precios del catálogo único: perfiles por barra, cobertura por m².
  const clavePf = (id: string) => { const p = INVENTARIO_PERFILES_TUBULARES.find(x => x.id === id); return p ? clavePerfil(p.categoria, p.anchoMm, p.altoMm, p.espesorMm) : `perfil:${id}`; };
  const largoPf = (id: string) => INVENTARIO_PERFILES_TUBULARES.find(x => x.id === id)?.longitudComercialM || 6;
  const precioBarra = (id: string) => precio(clavePf(id), (INVENTARIO_PERFILES_TUBULARES.find(p => p.id === id)?.costoMetroSol || 0) * largoPf(id));
  const precioCob = (id: string) => precio(claveCobertura(id), INVENTARIO_COBERTURAS.find(p => p.id === id)?.costoM2Sol ?? 0);

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-3 sm:p-6 overflow-y-auto space-y-4 font-sans">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600"><DollarSign className="w-6 h-6" /></div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">ESTRUCTURA DE COSTOS (EDITABLE)</h2>
            <p className="text-xs text-slate-500">Pon los precios de tu proveedor, tu cuadrilla y tus gastos. El Presupuesto Formal se actualiza solo.</p>
          </div>
        </div>
        <div className="bg-amber-500 text-slate-950 px-5 py-2.5 rounded-2xl font-black text-right">
          <span className="text-[10px] uppercase block tracking-wider opacity-85">Precio de venta final</span>
          <span className="text-2xl font-mono">{S(bom?.precioVentaFinalSoles || 0)}</span>
        </div>
      </div>

      {/* 1. MATERIALES */}
      <Seccion icono={<Package className="w-4 h-4 text-amber-600" />} titulo="1. Materiales (precios de tu proveedor)" total={bom?.costoDirectoMaterialesSoles}>
        <p className="text-[11px] text-slate-500">Estos precios son los del <b>Catálogo de precios</b> (menú Precios): si los cambias aquí, cambian también en CarpiMetal y Obra Civil.</p>
        {perfiles.length === 0 && coberturas.length === 0 && <p className="text-xs text-slate-400">Diseña o carga un techo en "1. Diseño CAD" para ver sus materiales.</p>}
        {perfiles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead><tr className="text-[10px] uppercase text-slate-400 text-left"><th className="py-1.5">Perfil</th><th className="text-right">Barras a comprar</th><th className="text-right w-32">Precio S/ por barra</th><th className="text-right">Subtotal</th><th /></tr></thead>
              <tbody>
                {perfiles.map(p => {
                  const editado = tienePrecioPropio(clavePf(p.profileId));
                  return (
                    <tr key={p.profileId} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 font-bold text-slate-700">{p.nombrePerfil}</td>
                      <td className="text-right font-mono text-slate-500">{p.totalBarrasComerciales6m} barras de {largoPf(p.profileId)} m</td>
                      <td className="pl-2"><input type="number" step="0.5" value={precioBarra(p.profileId)} onChange={e => fijarPrecio(clavePf(p.profileId), num(e.target.value), 'Techos')} className={`${inp} text-right ${editado ? 'ring-1 ring-amber-400' : ''}`} /></td>
                      <td className="text-right font-mono font-bold">{S(p.totalCostoSoles)}</td>
                      <td className="text-right">{editado && <button title="Volver al precio de referencia" onClick={() => quitarPrecio(clavePf(p.profileId))} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {coberturas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead><tr className="text-[10px] uppercase text-slate-400 text-left"><th className="py-1.5">Cobertura</th><th className="text-right">m² a comprar</th><th className="text-right w-32">Precio S/ por m²</th><th className="text-right">Subtotal</th><th /></tr></thead>
              <tbody>
                {[...new Map(coberturas.map(z => [z.coberturaMaterialId, z])).values()].map(z => {
                  const filas = coberturas.filter(x => x.coberturaMaterialId === z.coberturaMaterialId);
                  const editado = tienePrecioPropio(claveCobertura(z.coberturaMaterialId));
                  return (
                    <tr key={z.coberturaMaterialId} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 font-bold text-slate-700">{z.nombreCobertura}</td>
                      <td className="text-right font-mono text-slate-500">{filas.reduce((s, x) => s + x.areaEfectivaCalculadaM2, 0).toFixed(2)} m²</td>
                      <td className="pl-2"><input type="number" step="0.1" value={precioCob(z.coberturaMaterialId)} onChange={e => fijarPrecio(claveCobertura(z.coberturaMaterialId), num(e.target.value), 'Techos')} className={`${inp} text-right ${editado ? 'ring-1 ring-amber-400' : ''}`} /></td>
                      <td className="text-right font-mono font-bold">{S(filas.reduce((s, x) => s + x.costoTotalCoberturaSoles, 0))}</td>
                      <td className="text-right">{editado && <button title="Volver al precio de catálogo" onClick={() => quitarPrecio(claveCobertura(z.coberturaMaterialId))} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            ['techos:placa_base', `Placa base (S/ c/u) · ${bom?.placasBaseTotalesUnids ?? 0} u`, PLACA_BASE_ESTANDAR.costoUnidadSol],
            ['techos:perno_anclaje', 'Pernos de anclaje (S/ caja ×100)', PERNO_ANCLAJE_J.costoCaja100Sol],
            ['techos:perno_epdm', `Pernos EPDM (S/ caja ×100) · ${bom?.cajasPernosEpdmTotales ?? 0} cj`, PERNO_EPDM_ESTANDAR.costoCaja100Sol],
            ['soldadura:kg', `Soldadura (S/ kg) · ${bom?.kgSoldaduraAwsEstimados ?? 0} kg`, SOLDADURA_AWS_E6011.costoKgSol],
          ] as [string, string, number][]).map(([k, l, def]) => (
            <label key={k} className="text-[10px] font-bold text-slate-500">{l}
              <input type="number" step="0.1" value={precio(k, def)} onChange={e => fijarPrecio(k, num(e.target.value), 'Techos')} className={`${inp} mt-0.5`} />
            </label>
          ))}
        </div>
      </Seccion>

      {/* 2. MANO DE OBRA */}
      <Seccion icono={<HardHat className="w-4 h-4 text-amber-600" />} titulo="2. Mano de obra" total={bom?.costoManoObraMontajeSoles}>
        <Modo valor={c.manoObraModo} onChange={v => set({ manoObraModo: v })} />
        {c.manoObraModo === 'porcentaje' ? (
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">% sobre materiales
            <input type="number" value={c.manoObraPct} onChange={e => set({ manoObraPct: num(e.target.value) })} className={`${inp} w-24`} />
          </label>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead><tr className="text-[10px] uppercase text-slate-400 text-left"><th className="py-1.5">Cargo</th><th className="w-20">Cantidad</th><th className="w-28">Jornal S/ día</th><th className="w-20">Días</th><th className="text-right">Subtotal</th><th /></tr></thead>
              <tbody>
                {c.cuadrilla.map(f => {
                  const up = (p: Partial<typeof f>) => set({ cuadrilla: c.cuadrilla.map(x => x.id === f.id ? { ...x, ...p } : x) });
                  return (
                    <tr key={f.id} className="border-t border-slate-100">
                      <td className="py-1 pr-2"><input value={f.cargo} onChange={e => up({ cargo: e.target.value })} className={`${inp} font-sans font-bold`} /></td>
                      <td className="pr-1"><input type="number" value={f.cantidad} onChange={e => up({ cantidad: num(e.target.value) })} className={inp} /></td>
                      <td className="pr-1"><input type="number" value={jornalDe(f)} onChange={e => { up({ jornal: num(e.target.value) }); fijarPrecio(claveJornal(f.cargo), num(e.target.value), 'Techos'); }} className={inp} title="Se guarda en el Catálogo de precios para este cargo" /></td>
                      <td className="pr-1"><input type="number" value={f.dias} onChange={e => up({ dias: num(e.target.value) })} className={inp} /></td>
                      <td className="text-right font-mono font-bold">{S(f.cantidad * jornalDe(f) * f.dias)}</td>
                      <td className="text-right"><button onClick={() => set({ cuadrilla: c.cuadrilla.filter(x => x.id !== f.id) })} className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => set({ cuadrilla: [...c.cuadrilla, { id: `c${Date.now()}`, cargo: 'Nuevo cargo', cantidad: 1, jornal: 0, dias: 0 }] })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-200"><Plus className="w-3.5 h-3.5" /> Agregar cargo</button>
              <span className="text-xs font-bold text-slate-500">Total cuadrilla: {S(totalCuadrilla(c))}</span>
            </div>
          </div>
        )}
      </Seccion>

      {/* 3. GASTOS OPERATIVOS */}
      <Seccion icono={<Truck className="w-4 h-4 text-amber-600" />} titulo="3. Gastos operativos (grúa, transporte…)" total={bom?.costoEquiposGruaSoles}>
        <Modo valor={c.operativosModo} onChange={v => set({ operativosModo: v })} />
        {c.operativosModo === 'porcentaje' ? (
          <label className="flex items-center gap-2 text-xs font-bold text-slate-600">% sobre materiales
            <input type="number" value={c.operativosPct} onChange={e => set({ operativosPct: num(e.target.value) })} className={`${inp} w-24`} />
          </label>
        ) : (
          <div className="space-y-1.5">
            {c.operativos.map(f => {
              const up = (p: Partial<typeof f>) => set({ operativos: c.operativos.map(x => x.id === f.id ? { ...x, ...p } : x) });
              return (
                <div key={f.id} className="flex items-center gap-2">
                  <input value={f.concepto} onChange={e => up({ concepto: e.target.value })} className={`${inp} font-sans font-bold flex-1`} />
                  <input type="number" value={f.monto} onChange={e => up({ monto: num(e.target.value) })} className={`${inp} w-32 text-right`} />
                  <button onClick={() => set({ operativos: c.operativos.filter(x => x.id !== f.id) })} className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-1">
              <button onClick={() => set({ operativos: [...c.operativos, { id: `o${Date.now()}`, concepto: 'Nuevo gasto', monto: 0 }] })} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-200"><Plus className="w-3.5 h-3.5" /> Agregar gasto</button>
              <span className="text-xs font-bold text-slate-500">Total: {S(totalOperativos(c))}</span>
            </div>
          </div>
        )}
      </Seccion>

      {/* 4. GG, UTILIDAD, IGV */}
      <Seccion icono={<Percent className="w-4 h-4 text-amber-600" />} titulo="4. Gastos generales, utilidad e IGV">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <label className="text-[10px] font-bold text-slate-500">Gastos generales %
            <input type="number" value={c.gastosGeneralesPct} onChange={e => set({ gastosGeneralesPct: num(e.target.value) })} className={`${inp} mt-0.5`} />
          </label>
          <label className="text-[10px] font-bold text-slate-500">Utilidad %
            <input type="number" value={c.utilidadPct} onChange={e => set({ utilidadPct: num(e.target.value) })} className={`${inp} mt-0.5`} />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pb-2">
            <input type="checkbox" checked={c.igv} onChange={e => set({ igv: e.target.checked })} /> Sumar IGV 18 %
          </label>
        </div>
        {bom && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            {[['Costo directo', bom.costoDirectoTotalSoles], ['Gastos generales', bom.gastosGeneralesSoles], ['Utilidad', bom.utilidadSoles], ['IGV', bom.igvSoles], ['Precio final', bom.precioVentaFinalSoles]].map(([l, v]) => (
              <div key={l as string} className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-[10px] uppercase font-bold font-sans">{l}</span>
                <span className="text-slate-900 font-bold">{S(v as number)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-400">Estos precios y costos se guardan en este dispositivo y se aplican a todos tus diseños de Techos.</p>
      </Seccion>
    </div>
  );
};

export default TechosCostosView;
