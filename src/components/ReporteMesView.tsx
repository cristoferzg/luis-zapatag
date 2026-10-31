// =============================================================================
// Reporte del mes: cuánto cotizaste, cuánto ganaste (obras aprobadas), cuánto
// cobraste, cuánto gastaste y tu utilidad real. Sale de Proyectos (presupuesto,
// estado y cobros) y de Finanzas (ingresos y gastos). Se imprime en PDF.
// =============================================================================
import { useMemo, useRef, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, FileText, Trophy } from 'lucide-react';
import type { Project, FinanceRecord } from '../types';
import BotonImprimir from './common/BotonImprimir';
import { CabeceraEmpresa, BandaMarca } from '../lib/empresa';

const S = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mesDe = (fecha?: string) => (fecha || '').slice(0, 7); // 'YYYY-MM' (fechas ISO o 'YYYY-MM-DD')
const nombreMes = (m: string) => { const [y, mm] = m.split('-').map(Number); return new Date(y, mm - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }); };
const mover = (m: string, d: number) => { const [y, mm] = m.split('-').map(Number); const f = new Date(y, mm - 1 + d, 1); return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`; };
const esGasto = (f: FinanceRecord) => f.type === 'gasto' || f.type === 'gastos';

export default function ReporteMesView({ projects, finances }: { projects: Project[]; finances: FinanceRecord[] }) {
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const hoja = useRef<HTMLDivElement>(null);

  const r = useMemo(() => {
    const cotizados = projects.filter(p => mesDe(p.date) === mes);
    const ganados = cotizados.filter(p => p.status === 'En Progreso' || p.status === 'Completado');
    const cobros = projects.flatMap(p => (p.cobros || []).filter(c => mesDe(c.date) === mes).map(c => ({ ...c, obra: p.name })));
    const ingresosFin = finances.filter(f => f.type === 'ingreso' && mesDe(f.date) === mes);
    const gastos = finances.filter(f => esGasto(f) && mesDe(f.date) === mes);
    const cotizado = cotizados.reduce((s, p) => s + (p.presupuesto || 0), 0);
    const ganado = ganados.reduce((s, p) => s + (p.presupuesto || 0), 0);
    const cobrado = cobros.reduce((s, c) => s + (c.amount || 0), 0) + ingresosFin.reduce((s, f) => s + (f.amount || 0), 0);
    const gastado = gastos.reduce((s, f) => s + (f.amount || 0), 0);
    const porCategoria = new Map<string, number>();
    gastos.forEach(g => porCategoria.set(g.category || 'Otros', (porCategoria.get(g.category || 'Otros') || 0) + (g.amount || 0)));
    // Por cobrar: saldo de obras ganadas (de cualquier mes) que aún no se termina de cobrar.
    const porCobrar = projects.filter(p => p.status !== 'Pendiente').reduce((s, p) => s + Math.max(0, (p.presupuesto || 0) - (p.cobros || []).reduce((x, c) => x + (c.amount || 0), 0)), 0);
    // Últimos 6 meses (cobrado vs gastado)
    const serie = Array.from({ length: 6 }, (_, i) => mover(mes, i - 5)).map(m => ({
      m,
      cobrado: projects.flatMap(p => p.cobros || []).filter(c => mesDe(c.date) === m).reduce((s, c) => s + c.amount, 0) + finances.filter(f => f.type === 'ingreso' && mesDe(f.date) === m).reduce((s, f) => s + f.amount, 0),
      gastado: finances.filter(f => esGasto(f) && mesDe(f.date) === m).reduce((s, f) => s + f.amount, 0),
    }));
    return { cotizados, ganados, cobros, cotizado, ganado, cobrado, gastado, utilidad: cobrado - gastado, cierre: cotizados.length ? (ganados.length / cotizados.length) * 100 : 0, porCategoria: [...porCategoria.entries()].sort((a, b) => b[1] - a[1]), porCobrar, serie };
  }, [projects, finances, mes]);

  const maxSerie = Math.max(1, ...r.serie.flatMap(x => [x.cobrado, x.gastado]));
  const tarjeta = (titulo: string, valor: string, sub: string, Ic: any, color: string) => (
    <div className="rounded-2xl border border-slate-200 p-3 bg-white">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase" style={{ color }}><Ic className="w-4 h-4" />{titulo}</div>
      <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{valor}</p>
      <p className="text-[11px] text-slate-500">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-3 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <BarChart3 className="w-6 h-6 text-indigo-600" />
        <div className="mr-auto">
          <h2 className="text-lg font-black text-slate-900">Reporte del mes</h2>
          <p className="text-xs text-slate-500">Cotizado, ganado, cobrado, gastado y tu utilidad real.</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMes(m => mover(m, -1))} className="p-2 rounded-xl bg-slate-100 cursor-pointer" aria-label="Mes anterior"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-3 text-sm font-black capitalize min-w-[150px] text-center">{nombreMes(mes)}</span>
          <button onClick={() => setMes(m => mover(m, 1))} className="p-2 rounded-xl bg-slate-100 cursor-pointer" aria-label="Mes siguiente"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <BotonImprimir objetivo={() => hoja.current} titulo={`Reporte ${nombreMes(mes)}`} etiqueta="PDF" />
      </div>

      <div ref={hoja} className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs space-y-4 imprimir-claro">
        <BandaMarca />
        <div className="flex flex-wrap justify-between gap-2">
          <CabeceraEmpresa subtitulo={`Reporte de ${nombreMes(mes)}`} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {tarjeta('Cotizado', S(r.cotizado), `${r.cotizados.length} cotización${r.cotizados.length === 1 ? '' : 'es'}`, FileText, '#64748b')}
          {tarjeta('Ganado', S(r.ganado), `${r.ganados.length} obra${r.ganados.length === 1 ? '' : 's'} · cierre ${r.cierre.toFixed(0)} %`, Trophy, '#ca8a04')}
          {tarjeta('Cobrado', S(r.cobrado), `${r.cobros.length} cobro${r.cobros.length === 1 ? '' : 's'} de obras`, TrendingUp, '#16a34a')}
          {tarjeta('Gastado', S(r.gastado), 'materiales, personal y gastos', TrendingDown, '#dc2626')}
          <div className={`rounded-2xl p-3 text-white col-span-2 lg:col-span-1 ${r.utilidad >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase"><Wallet className="w-4 h-4" />Utilidad real</div>
            <p className="text-xl sm:text-2xl font-black mt-1">{S(r.utilidad)}</p>
            <p className="text-[11px] opacity-90">cobrado − gastado{r.cobrado > 0 ? ` · margen ${((r.utilidad / r.cobrado) * 100).toFixed(0)} %` : ''}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-black text-slate-700 uppercase mb-2">Últimos 6 meses</p>
            <div className="flex items-end gap-2 h-36 border-b border-slate-200">
              {r.serie.map(x => (
                <div key={x.m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-28">
                    <div className="flex-1 rounded-t bg-emerald-500" style={{ height: `${(x.cobrado / maxSerie) * 100}%` }} title={`Cobrado ${S(x.cobrado)}`} />
                    <div className="flex-1 rounded-t bg-rose-400" style={{ height: `${(x.gastado / maxSerie) * 100}%` }} title={`Gastado ${S(x.gastado)}`} />
                  </div>
                  <span className={`text-[10px] font-bold capitalize ${x.m === mes ? 'text-slate-900' : 'text-slate-400'}`}>{nombreMes(x.m).slice(0, 3)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-1 text-[10px] font-bold text-slate-500"><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" />Cobrado</span><span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-400" />Gastado</span></div>
            <p className="text-xs text-slate-600 mt-3">Por cobrar de obras en curso: <b>{S(r.porCobrar)}</b></p>
          </div>
          <div>
            <p className="text-xs font-black text-slate-700 uppercase mb-2">¿En qué se gastó?</p>
            {r.porCategoria.length === 0 ? <p className="text-xs text-slate-400">Sin gastos registrados este mes (Materiales y gastos / Finanzas).</p> : (
              <div className="space-y-1.5">
                {r.porCategoria.map(([c, v]) => (
                  <div key={c}>
                    <div className="flex justify-between text-[11px] font-bold text-slate-700"><span>{c}</span><span>{S(v)}</span></div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-rose-400" style={{ width: `${(v / Math.max(1, r.gastado)) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-black text-slate-700 uppercase mb-1.5">Cotizaciones del mes</p>
          {r.cotizados.length === 0 ? <p className="text-xs text-slate-400">No hay obras registradas con fecha de este mes.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[420px]">
                <thead><tr className="text-[10px] uppercase text-slate-400 text-left"><th className="py-1">Obra</th><th>Cliente</th><th>Estado</th><th className="text-right">Monto</th><th className="text-right">Cobrado</th></tr></thead>
                <tbody>
                  {r.cotizados.map(p => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="py-1.5 font-bold text-slate-800">{p.name}</td><td className="text-slate-600">{p.client}</td>
                      <td><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'Pendiente' ? 'bg-amber-50 text-amber-700' : p.status === 'Completado' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>{p.status}</span></td>
                      <td className="text-right font-mono">{S(p.presupuesto || 0)}</td>
                      <td className="text-right font-mono">{S((p.cobros || []).reduce((s, c) => s + c.amount, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400">Ganado = obras del mes en curso o terminadas. Cobrado = cobros de obras + ingresos de Finanzas del mes. Gastado = gastos de Finanzas y de Materiales y gastos del mes.</p>
      </div>
    </div>
  );
}
