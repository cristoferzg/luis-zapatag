// =============================================================================
// Memoria de cálculo imprimible de Techos (prediseño RNE E.020 / E.090):
// datos de la obra, cargas y combinaciones, método, resultados POR GRUPO (no por
// pieza), reacciones en la base, peso del acero y conclusión. En el celular los
// grupos van en tarjetas; el detalle pieza por pieza queda plegado.
// =============================================================================
import { useRef } from 'react';
import { FileText, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';
import BotonImprimir from '../common/BotonImprimir';
import { useEmpresa } from '../../lib/empresa';
import type { Memoria, EstadoMemoria, GrupoMemoria } from './memoriaCalculo';

const f1 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f2 = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const f0 = (n: number) => Math.round(n).toLocaleString('es-PE');

export const ESTILO_ESTADO: Record<EstadoMemoria, { texto: string; clase: string }> = {
  CUMPLE: { texto: 'CUMPLE', clase: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  OBSERVACION: { texto: 'CON OBSERVACIONES', clase: 'bg-amber-50 text-amber-800 border-amber-300' },
  NO_CUMPLE: { texto: 'NO CUMPLE', clase: 'bg-rose-50 text-rose-800 border-rose-300' },
};
const Icono = ({ e, className = 'w-4 h-4' }: { e: EstadoMemoria; className?: string }) =>
  e === 'CUMPLE' ? <CheckCircle2 className={`${className} text-emerald-600`} /> : e === 'OBSERVACION' ? <AlertTriangle className={`${className} text-amber-600`} /> : <XCircle className={`${className} text-rose-600`} />;

const verifTexto = (g: GrupoMemoria) => !g.verif ? 'Solo esbeltez'
  : g.verif.tipo === 'axial' ? `${f1(g.verif.demanda)} / ${f1(g.verif.capacidad)} kN`
  : `${f0(g.verif.demanda)} / ${f0(g.verif.capacidad)} mm`;

export default function MemoriaCalculoTechos({ memoria, nombreProyecto, onAplicarRecomendados }: { memoria: Memoria; nombreProyecto?: string; onAplicarRecomendados?: () => void }) {
  const hoja = useRef<HTMLDivElement>(null);
  const { datos: emp } = useEmpresa();
  const { datos: d, cargas: c, grupos, reacciones: r } = memoria;
  const est = ESTILO_ESTADO[memoria.estado];
  const cambios = grupos.filter(g => g.estado !== 'CUMPLE');
  const sec = 'text-[11px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2 [break-after:avoid]';
  const dato = (k: string, v: string) => (
    <div className="flex justify-between gap-2 py-1 border-b border-dashed border-slate-100 text-xs"><span className="text-slate-500">{k}</span><span className="font-bold text-slate-800 text-right">{v}</span></div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-slate-100 no-imprimir">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-black text-slate-900">MEMORIA DE CÁLCULO</h3>
        </div>
        <div className="flex items-center gap-2">
          {cambios.length > 0 && onAplicarRecomendados && (
            <button onClick={onAplicarRecomendados} className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
              <Zap className="w-4 h-4" /> Aplicar recomendados
            </button>
          )}
          <BotonImprimir objetivo={() => hoja.current} titulo={`Memoria de cálculo - ${nombreProyecto || 'Techo'}`} etiqueta="Imprimir / PDF"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer" />
        </div>
      </div>

      <div ref={hoja} className="p-4 sm:p-6 space-y-5 text-slate-800 select-text">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-slate-800 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            {emp.logo && <img src={emp.logo} alt="" className="w-12 h-12 object-contain rounded-lg" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">{emp.nombre || 'Memoria de cálculo'}</p>
              <p className="text-[10px] text-slate-500">{[emp.ruc && `RUC/DNI ${emp.ruc}`, emp.telefono, emp.email].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-500">{new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">MEMORIA DE CÁLCULO ESTRUCTURAL — PREDISEÑO</h2>
          <p className="text-xs text-slate-600">Proyecto: <b>{nombreProyecto || 'Techo metálico'}</b> · RNE E.020 (cargas), E.030 (sismo) y E.090 (estructuras metálicas)</p>
          <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black ${est.clase}`}>
            <Icono e={memoria.estado} /> RESULTADO: {est.texto}
            <span className="font-semibold">· {grupos.filter(g => g.estado === 'CUMPLE').length} de {grupos.length} grupos cumplen</span>
          </div>
        </div>

        {/* 1. Datos */}
        <section>
          <p className={sec}>1. Descripción de la estructura</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {dato('Tipo de techo', d.tipo)}
            {dato('Cobertura', d.cobertura)}
            {dato('Luz (ancho)', `${f2(d.luz)} m`)}
            {dato('Largo', `${f2(d.largo)} m`)}
            {dato('Área en planta', `${f1(d.area)} m²`)}
            {dato('Altura de columnas', `${f2(d.alturaCol)} m`)}
            {dato('Altura máxima', `${f2(d.alturaMax)} m`)}
            {dato('Pendiente', d.pendientePct !== null ? `${d.pendientePct} %` : 'Variable (curvo)')}
            {dato('Columnas', String(d.nCols))}
            {dato('Piezas verificadas', String(d.nPiezas))}
          </div>
        </section>

        {/* 2. Materiales y cargas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className={sec}>2. Materiales</p>
            {dato('Acero', 'ASTM A500 / A36 (tubos LAC)')}
            {dato('Fluencia Fy', '250 MPa (2 530 kg/cm²)')}
            {dato('Módulo E', '200 000 MPa')}
            {dato('Esbeltez máx. (KL/r)', '200 · correas y arriostres 300')}
          </div>
          <div>
            <p className={sec}>3. Cargas (E.020 / E.030)</p>
            {dato('Muerta D (cobertura + acero)', `${f1(c.D)} kg/m²`)}
            {dato('Viva de techo L', `${f1(c.L)} kg/m²`)}
            {dato(`Viento V = ${f0(c.V)} km/h → q = 0.005·V²`, `${f1(c.qViento)} kg/m²`)}
            {dato('Succión en techo (Cp −0.7)', `${f1(c.succion)} kg/m²`)}
            {dato(`Sismo ${c.zona}`, `Z = ${c.Z}`)}
          </div>
        </section>

        <section className="[break-inside:avoid]">
          <p className={sec}>4. Combinaciones de carga</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[['U1 = 1.4 D', c.U1, 'Solo peso propio'], ['U2 = 1.2 D + 1.6 L', c.U2, 'Gravedad (gobierna)'], ['U3 = 0.9 D − 1.0 W', c.U3, c.U3 < 0 ? 'Levantamiento por viento' : 'Viento']].map(([k, v, n]) => (
              <div key={k as string} className="rounded-xl border border-slate-200 p-2.5">
                <p className="text-[11px] font-bold text-slate-600">{k}</p>
                <p className={`text-base font-black ${(v as number) < 0 ? 'text-rose-700' : 'text-slate-900'}`}>{f1(v as number)} kg/m²</p>
                <p className="text-[10px] text-slate-500">{n}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Método */}
        <section>
          <p className={sec}>5. Método de verificación</p>
          <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 leading-snug">
            <li><b>Columnas:</b> carga axial P = área × (D + L) / n.º columnas × 1.5 (viento, sismo y reparto desigual). Se verifica P ≤ Pcr / 3, con Pcr = π²EI / (KL)² y K = 1.0, y P ≤ 0.6·Fy·A.</li>
            {memoria.tijeral && <li><b>Tijerales:</b> las correas se apoyan en los nudos, así que las barras trabajan a fuerza axial. Con w = {f0(memoria.tijeral.w)} N/m por tijeral, luz {f2(memoria.tijeral.luz)} m y peralte d = {f2(memoria.tijeral.d)} m: M = w·L²/8 = {f1(memoria.tijeral.M / 1000)} kN·m, cordones N = M/d = <b>{f1(memoria.tijeral.Ncordon)} kN</b>, diagonales 1.4·V y montantes V = w·L/2 = {f1(memoria.tijeral.V)} kN. Se verifica pandeo (K = 0.8, FS 3) y fluencia.</li>}
            <li><b>Vigas y correas:</b> flecha 5qL⁴ / 384EI ≤ L/240 (correas L/180), con la carga del área tributaria.</li>
            <li><b>Mínimos de obra</b> para soldar bien: columnas 2.0 mm y 50 mm por lado; vigas y tijerales 1.5 mm.</li>
            <li>Manda el tramo más largo de cada grupo. Método simplificado y conservador de prediseño.</li>
          </ul>
        </section>

        {/* 6. Resultados por grupo */}
        <section>
          <p className={sec}>6. Resultados por grupo de piezas</p>
          {/* Celular: tarjetas */}
          <div className="sm:hidden space-y-2">
            {grupos.map((g, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-slate-900">{g.nombreRol} <span className="text-slate-400 font-bold">× {g.cant}</span></p>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black ${ESTILO_ESTADO[g.estado].clase}`}><Icono e={g.estado} className="w-3 h-3" />{ESTILO_ESTADO[g.estado].texto}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{g.perfil}</p>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-lg bg-slate-50 p-1.5"><p className="text-[9px] text-slate-500 uppercase font-bold">L máx</p><p className="text-xs font-black">{f2(g.Lmax)} m</p></div>
                  <div className="rounded-lg bg-slate-50 p-1.5"><p className="text-[9px] text-slate-500 uppercase font-bold">λ / máx</p><p className={`text-xs font-black ${g.lambdaMax > g.lambdaLim ? 'text-rose-700' : ''}`}>{f0(g.lambdaMax)} / {g.lambdaLim}</p></div>
                  <div className="rounded-lg bg-slate-50 p-1.5"><p className="text-[9px] text-slate-500 uppercase font-bold">{g.verif?.tipo === 'flecha' ? 'Flecha / adm' : g.verif ? 'Carga / adm' : 'Verifica'}</p><p className={`text-xs font-black ${g.verif && g.verif.ratio > 1 ? 'text-rose-700' : ''}`}>{verifTexto(g)}</p></div>
                </div>
                <p className="text-[11px] text-slate-500">{g.motivo}</p>
                {g.recomendado && <p className="text-[11px] font-bold text-indigo-700">→ Usar: {g.recomendado}</p>}
              </div>
            ))}
          </div>
          {/* PC e impresión: tabla */}
          <div className="hidden sm:block">
            <table className="w-full text-[11px] border-collapse table-fixed">
              <colgroup><col className="w-[27%]" /><col className="w-[7%]" /><col className="w-[10%]" /><col className="w-[11%]" /><col className="w-[16%]" /><col className="w-[29%]" /></colgroup>
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase text-left">
                  <th className="p-2">Elemento / perfil</th><th className="p-2 text-right">Cant.</th><th className="p-2 text-right">L máx</th>
                  <th className="p-2 text-right">λ / máx</th><th className="p-2 text-right">Demanda / admisible</th><th className="p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g, i) => (
                  <tr key={i} className="border-b border-slate-100 align-top">
                    <td className="p-2"><b className="text-slate-900">{g.nombreRol}</b><span className="block text-[10px] text-slate-500 leading-snug">{g.perfil}</span></td>
                    <td className="p-2 text-right font-mono">{g.cant}</td>
                    <td className="p-2 text-right font-mono">{f2(g.Lmax)} m</td>
                    <td className={`p-2 text-right font-mono font-bold ${g.lambdaMax > g.lambdaLim ? 'text-rose-700' : ''}`}>{f0(g.lambdaMax)} / {g.lambdaLim}</td>
                    <td className={`p-2 text-right font-mono font-bold ${g.verif && g.verif.ratio > 1 ? 'text-rose-700' : ''}`}>{verifTexto(g)}{g.verif && <span className="block text-[10px] font-semibold text-slate-400">{f0(g.verif.ratio * 100)} % usado</span>}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-black ${ESTILO_ESTADO[g.estado].clase}`}><Icono e={g.estado} className="w-3 h-3" />{ESTILO_ESTADO[g.estado].texto}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">{g.motivo}</span>
                      {g.recomendado && <span className="block text-[10px] font-bold text-indigo-700 mt-0.5 leading-snug">→ Usar: {g.recomendado}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Reacciones y peso */}
        <section className="[break-inside:avoid] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <p className={sec}>7. Reacciones en la base (promedio por columna)</p>
            {dato('Servicio (D + L)', `${f0(r.servicioKg)} kg`)}
            {dato('Última U2 (1.2 D + 1.6 L)', `${f0(r.ultimaKg)} kg`)}
            {dato('Viento U3 (0.9 D − 1.0 W)', r.levantamientoKg < 0 ? `${f0(-r.levantamientoKg)} kg hacia arriba` : `${f0(r.levantamientoKg)} kg`)}
            <p className="text-[10px] text-slate-500 mt-1">Para diseñar la zapata se usa la reacción última.{r.levantamientoKg < 0 ? ' El viento levanta el techo: la placa base y los pernos de anclaje deben resistir ese tiro.' : ''}</p>
          </div>
          <div>
            <p className={sec}>8. Peso de la estructura</p>
            {dato('Acero total', `${f0(memoria.pesoTotalKg)} kg`)}
            {dato('Ratio', `${f1(memoria.kgM2)} kg/m²`)}
            {dato('Piezas sin riesgo / medio / alto', `${memoria.cuenta.BAJO} / ${memoria.cuenta.MEDIO} / ${memoria.cuenta.ALTO}`)}
          </div>
        </section>

        {/* 9. Conclusión (con las firmas, sin partirse entre hojas) */}
        <section className="[break-inside:avoid]">
          <p className={sec}>9. Conclusión</p>
          {memoria.estado === 'CUMPLE' ? (
            <p className="text-xs text-slate-700">Con las cargas indicadas, todos los grupos de piezas cumplen la esbeltez de la E.090 y las verificaciones de carga y flecha del prediseño.</p>
          ) : (
            <div className="text-xs text-slate-700 space-y-1">
              <p>{memoria.estado === 'NO_CUMPLE' ? 'La estructura NO cumple con los perfiles actuales.' : 'La estructura cumple, con observaciones.'} Cambios recomendados:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {cambios.map((g, i) => <li key={i}><b>{g.nombreRol}</b> ({g.cant}): {g.perfil} → <b className="text-indigo-700">{g.recomendado || 'revisar'}</b> <span className="text-slate-500">({g.motivo.toLowerCase()})</span></li>)}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-slate-500 mt-2 leading-snug">Prediseño elaborado con un método simplificado. Antes de construir, el cálculo definitivo, las conexiones, la cimentación y los planos deben ser revisados y firmados por un ingeniero civil colegiado (CIP).</p>
          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="border-t border-slate-400 pt-1 text-center text-[10px] text-slate-500">Elaborado por: {emp.nombre || '________________'}</div>
            <div className="border-t border-slate-400 pt-1 text-center text-[10px] text-slate-500">Revisado: Ing. ____________ · CIP ______</div>
          </div>
        </section>

        {/* Detalle por pieza (plegado) */}
        <details className="no-imprimir rounded-xl border border-slate-200">
          <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-600">Ver el detalle pieza por pieza ({memoria.piezas.length})</summary>
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {memoria.piezas.map(p => (
              <div key={p.id} className="px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]">
                <span className="font-bold text-slate-800 min-w-[180px]">{p.nombre}</span>
                <span className="text-slate-500 flex-1 min-w-[140px]">{p.perfil} · {f2(p.L)} m</span>
                <span className={`font-mono ${p.lambda > p.limite ? 'text-rose-700 font-bold' : 'text-slate-600'}`}>λ {f0(p.lambda)}/{p.limite}</span>
                <span className="font-mono text-slate-600">Pcr {f1(p.PcrkN)} kN</span>
                <span className={`px-1.5 rounded text-[10px] font-black ${p.riesgo === 'ALTO' ? 'bg-rose-50 text-rose-700' : p.riesgo === 'MEDIO' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{p.riesgo === 'ALTO' ? 'Riesgo alto' : p.riesgo === 'MEDIO' ? 'Riesgo medio' : 'Sin riesgo'}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
