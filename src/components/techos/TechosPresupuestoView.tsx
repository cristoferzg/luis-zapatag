// Presupuesto Comercial Formal Exclusivo para Techos Metálicos y Coberturas
import React, { useEffect, useRef, useState } from 'react';
import type { TechosDelProyecto } from '../../types';
import { sincronizarAceptadas, fechaCorta } from '../../lib/acuerdoTechos';
import { FileText, Send, CheckCircle, ArrowRight } from 'lucide-react';
import BotonImprimir from '../common/BotonImprimir';
import { CabeceraEmpresa, BandaMarca, CondicionesComerciales } from '../../lib/empresa';
import { useCostosTechos, totalCuadrilla, jornalDe } from './costosTechos';
import { useCatalogo } from '../../lib/catalogoPrecios';
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';
import PropuestaClienteView from './PropuestaClienteView';
import { Presentation } from 'lucide-react';

interface ProjectOption {
  id: string;
  name: string;
  client: string;
  presupuesto: number;
  techos?: TechosDelProyecto;
}

interface ClientOption {
  id: string;
  name: string;
}

interface TechosPresupuestoViewProps {
  design?: any;
  nombreProyecto?: string;
  onSaveToProject?: (projectId: string, data: any) => void;
  onCreateProject?: (newProject: any) => void;
  projects?: ProjectOption[];
  clients?: ClientOption[];
  onNavigateToProjects?: () => void;
  currentSettings?: any;
  escena?: { nodes: Record<string, Node3D>; segments: Record<string, Segment3D>; coverageZones: Record<string, CoverageZone3D> };
  onTechosProyecto?: (projectId: string, t: TechosDelProyecto) => void;
  disenoId?: string | null;
  proyectoDelDiseno?: string;
}

export const TechosPresupuestoView: React.FC<TechosPresupuestoViewProps> = ({
  design,
  nombreProyecto = 'Techo Metálico Estructural',
  projects = [],
  clients: _clients = [],
  onSaveToProject,
  onCreateProject,
  onNavigateToProjects,
  currentSettings,
  escena,
  onTechosProyecto,
  disenoId,
  proyectoDelDiseno
}) => {
  const [verPropuesta, setVerPropuesta] = useState(false);
  const [clienteNombre, setClienteNombre] = useState<string>('CLIENTE INDUSTRIAL S.A.C.');
  const [ubicacion, setUbicacion] = useState<string>('LIMA - PERÚ');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => (proyectoDelDiseno && projects.some(p => p.id === proyectoDelDiseno) ? proyectoDelDiseno
    : projects.find(p => disenoId && p.techos?.disenoId === disenoId)?.id) || 'new');
  const proyectoSel = projects.find(p => p.id === selectedProjectId);
  const acordado = proyectoSel?.techos?.acordado;
  // Si el cliente aceptó por el link, se fija solo como lo acordado.
  useEffect(() => {
    if (!proyectoSel?.techos?.propuestaId || !onTechosProyecto) return;
    sincronizarAceptadas([proyectoSel as any]).then(r => { const t = r?.[0]?.techos; if (t?.acordado) onTechosProyecto(proyectoSel.id, t); }).catch(() => {});
  }, [selectedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [nuevoProyectoNombre, setNuevoProyectoNombre] = useState<string>(`Obra: ${nombreProyecto}`);
  const [enviadoExito, setEnviadoExito] = useState<boolean>(false);


  const isBom = design && typeof design.precioVentaFinalSoles === 'number';

  // Montos tomados del BOM, que ya usa los precios, la cuadrilla y los gastos
  // operativos editados en "4. Estructura de costos".
  const costos = useCostosTechos();
  useCatalogo();
  const subtotal = isBom ? (design.subtotalSoles ?? design.costoDirectoTotalSoles + design.gastosGeneralesYUtilidadSoles) : 0;
  const igv = isBom ? design.igvSoles || 0 : 0;
  const totalConIgv = isBom ? design.precioVentaFinalSoles : 0;
  const [numeroCotizacion] = useState(() => Date.now().toString().slice(-5));
  const hojaRef = useRef<HTMLDivElement>(null);
  const partidas: { item: string; desc: string; monto: number; sub?: string[] }[] = isBom ? [
    { item: '01', desc: 'Materiales e insumos', monto: design.costoDirectoMaterialesSoles, sub: [
      `Perfilería estructural (${(design.despiecePerfiles || []).reduce((n: number, p: any) => n + p.totalBarrasComerciales6m, 0)} barras de 6 m): S/. ${(design.costoPerfilesSoles ?? 0).toFixed(2)}`,
      `Cobertura (${(design.resumenCoberturas || []).reduce((n: number, c: any) => n + c.areaEfectivaCalculadaM2, 0).toFixed(1)} m²): S/. ${(design.costoCoberturasSoles ?? 0).toFixed(2)}`,
      `Placas base, pernos y soldadura: S/. ${(design.costoAccesoriosSoles ?? 0).toFixed(2)}`,
      ...((design.canaletas || []).length ? [`Canaletas y bajadas de agua: S/. ${(design.costoCanaletasSoles ?? 0).toFixed(2)}`] : []),
      ...((design.iluminacionLed || []).length ? [`Iluminación LED en vigas (cinta, perfil difusor, fuentes): S/. ${(design.costoLedSoles ?? 0).toFixed(2)}`] : []),
      ...((design.mecanismoMovil || []).length ? [`Mecanismo de techo movible (rieles, ruedas, accionamiento): S/. ${(design.costoMovilSoles ?? 0).toFixed(2)}`] : []),
    ] },
    { item: '02', desc: 'Mano de obra: fabricación y montaje', monto: design.costoManoObraMontajeSoles,
      sub: costos.manoObraModo === 'detalle' && totalCuadrilla(costos) > 0 ? costos.cuadrilla.filter(f => f.cantidad * jornalDe(f) * f.dias > 0).map(f => `${f.cargo}: ${f.cantidad} × ${f.dias} días × S/. ${jornalDe(f).toFixed(2)}`) : undefined },
    { item: '03', desc: 'Gastos operativos (grúa, transporte, andamios, EPP)', monto: design.costoEquiposGruaSoles,
      sub: costos.operativosModo === 'detalle' ? costos.operativos.filter(f => f.monto > 0).map(f => `${f.concepto}: S/. ${f.monto.toFixed(2)}`) : undefined },
    { item: '04', desc: `Gastos generales (${costos.gastosGeneralesPct}%)`, monto: design.gastosGeneralesSoles ?? 0 },
    { item: '05', desc: `Utilidad (${costos.utilidadPct}%)`, monto: design.utilidadSoles ?? 0 },
  ] : [];

  const handleEnviarAlPresupuesto = () => {
    const especificacionesTexto = 
      `PRESUPUESTO ESTRUCTURA METALICA: ${nombreProyecto}\n` +
      `Ubicación: ${ubicacion}\n` +
      `Subtotal: S/. ${subtotal.toFixed(2)} | IGV: S/. ${igv.toFixed(2)} | Total: S/. ${totalConIgv.toFixed(2)}\n` +
      `Partidas: Perfilería A36, Tijerales, Coberturas y Montaje con grúa.`;

    if (selectedProjectId === 'new') {
      const nuevoProj = {
        id: 'proj-' + Date.now(),
        name: nuevoProyectoNombre.trim() || `Techo Metálico: ${nombreProyecto}`,
        client: clienteNombre.trim() || 'Cliente Industrial',
        status: 'Pendiente',
        presupuesto: totalConIgv,
        date: new Date().toISOString().split('T')[0],
        materiales: [],
        detallesContrato: especificacionesTexto
      };

      if (onCreateProject) {
        onCreateProject(nuevoProj);
      }
    } else {
      // Si ya hay un monto acordado con el cliente, no se pisa sin preguntar.
      const reemplazar = !acordado || Math.abs(acordado.total - totalConIgv) < 0.5 || window.confirm(`Este proyecto tiene acordado S/ ${acordado.total.toFixed(2)} con el cliente. ¿Reemplazarlo por el presupuesto actual S/ ${totalConIgv.toFixed(2)}? (Cancelar: se guardan los datos y se mantiene lo acordado)`);
      if (onTechosProyecto && disenoId) onTechosProyecto(selectedProjectId, { disenoId, disenoNombre: nombreProyecto });
      if (onSaveToProject) {
        onSaveToProject(selectedProjectId, {
          presupuesto: reemplazar ? totalConIgv : acordado!.total,
          materiales: [],
          detallesContrato: especificacionesTexto
        });
      }
    }

    setEnviadoExito(true);
    setTimeout(() => {
      setEnviadoExito(false);
      if (onNavigateToProjects) {
        onNavigateToProjects();
      }
    }, 1500);
  };

  return (
    <div className="w-full h-full bg-slate-100 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      
      {/* BARRA DE ACCIÓN Y INTEGRACIÓN DE PROYECTO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">PRESUPUESTO COMERCIAL DE ESTRUCTURAS METÁLICAS</h2>
            <p className="text-xs text-slate-500 font-medium">Cotización formal de montaje y fabricación según RNE E.090</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BotonImprimir objetivo={() => hojaRef.current} titulo={`Cotización TM-${numeroCotizacion} ${nombreProyecto}`} etiqueta="IMPRIMIR (PDF)" />
        </div>
      </div>

      {/* CARD: ASIGNACIÓN DIRECTA A PROYECTOS DEL SISTEMA */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-xs print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-amber-600" />
              Integrar este Presupuesto al Módulo de Proyectos
            </h3>
            <p className="text-xs text-slate-600">
              Guarda el monto de <span className="font-bold text-slate-900">S/. {totalConIgv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span> directamente en el portafolio principal de obras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="new">+ Crear Nuevo Proyecto</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.client})
                </option>
              ))}
            </select>

            {selectedProjectId === 'new' && (
              <input
                type="text"
                value={nuevoProyectoNombre}
                onChange={(e) => setNuevoProyectoNombre(e.target.value)}
                placeholder="Nombre de la Obra"
                className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none w-48"
              />
            )}

            <button
              onClick={handleEnviarAlPresupuesto}
              disabled={enviadoExito}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {enviadoExito ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>¡ENVIADO A PROYECTOS!</span>
                </>
              ) : (
                <>
                  <span>ENVIAR A PROYECTOS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* LO ACORDADO CON EL CLIENTE vs EL PRESUPUESTO ACTUAL DEL DISEÑO */}
      {isBom && proyectoSel && (
        <div className="max-w-4xl mx-auto mb-4 rounded-2xl border border-slate-200 bg-white p-4 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm font-black text-slate-900">Acordado vs presupuesto actual · {proyectoSel.name}</p>
            {proyectoSel.techos?.propuestaId && !acordado && <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 rounded-full px-2 py-0.5">Propuesta enviada{proyectoSel.techos.propuestaFecha ? ` el ${fechaCorta(proyectoSel.techos.propuestaFecha)}` : ''} · esperando al cliente</span>}
          </div>
          {acordado ? (() => {
            // Lo pactado es el precio del proyecto; lo que importa es cuánto te cuesta el diseño.
            const pactado = Number(proyectoSel.presupuesto) || acordado.total;
            const costo = Number(design.costoDirectoTotalSoles) || 0, margen = pactado - costo;
            const fmt = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return (
              <div className="grid sm:grid-cols-3 gap-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-[10px] font-black uppercase text-emerald-700">Precio pactado con el cliente</p>
                  <p className="text-xl font-black text-emerald-900">S/ {fmt(pactado)}</p>
                  <p className="text-[11px] text-emerald-800">Opción {acordado.opcion}{acordado.cobertura ? ` · ${acordado.cobertura}` : ''}</p>
                  <p className="text-[10px] text-emerald-700">{acordado.fuente === 'link' ? 'Aceptada por el cliente en el link' : 'Acordado'} · {fechaCorta(acordado.fecha)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-500">Costo del diseño actual</p>
                  <p className="text-xl font-black text-slate-900">S/ {fmt(costo)}</p>
                  <p className="text-[11px] text-slate-500">Materiales + mano de obra + equipos (sin gastos generales ni utilidad)</p>
                </div>
                <div className={`rounded-xl border p-3 ${margen >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <p className="text-[10px] font-black uppercase text-slate-500">Te queda de margen</p>
                  <p className={`text-xl font-black ${margen >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>S/ {fmt(margen)}</p>
                  <p className="text-[11px] text-slate-600">{margen >= 0 ? `${pactado > 0 ? Math.round((margen / pactado) * 100) : 0}% del precio. Si cotizaras hoy con tus % saldría S/ ${fmt(totalConIgv)}.` : 'El diseño cuesta más de lo pactado: revisa perfiles o conversa un adicional.'}</p>
                </div>
              </div>
            );
          })() : (
            <p className="text-xs text-slate-500">Aún no hay un monto acordado. Se fija solo cuando el cliente acepta la propuesta por el link, o con <b>“Marcar como acordada”</b> en la propuesta.</p>
          )}
        </div>
      )}

      {/* PROPUESTA VISUAL PARA EL CLIENTE */}
      {isBom && escena && (
        <div className="max-w-4xl mx-auto mb-4 rounded-2xl p-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex flex-wrap items-center gap-3">
          <Presentation className="w-8 h-8 shrink-0" />
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-black">Propuesta visual para el cliente</p>
            <p className="text-[11px] opacity-90">Portada con tu techo en 3D (antes y después), opciones A/B/C con precio, condiciones y un link para que el cliente lo vea en 3D y acepte.</p>
          </div>
          <button onClick={() => setVerPropuesta(true)} className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-black cursor-pointer">Armar propuesta</button>
        </div>
      )}
      {verPropuesta && escena && (
        <PropuestaClienteView nodes={escena.nodes} segments={escena.segments} coverageZones={escena.coverageZones}
          nombreProyecto={nombreProyecto} cliente={proyectoSel?.client || clienteNombre} ubicacion={ubicacion} onClose={() => setVerPropuesta(false)}
          proyectos={projects} proyectoId={proyectoSel?.id} onTechosProyecto={onTechosProyecto} disenoId={disenoId || undefined} />
      )}

      {/* HOJA IMPRESA DE COTIZACIÓN */}
      <div ref={hojaRef} className="bg-white text-slate-900 rounded-2xl p-8 max-w-4xl mx-auto shadow-xl border border-slate-200 font-sans print:shadow-none print:p-0 print:border-none">
        
        <BandaMarca />
        {/* CABECERA */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start gap-4">
            {currentSettings?.logoBase64 && (
              <img src={currentSettings.logoBase64} alt="Logo" className="h-14 max-w-[120px] object-contain rounded-md" />
            )}
            <CabeceraEmpresa subtitulo="Ingeniería, Fabricación y Montaje de Techos y Estructuras Metálicas" />
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-extrabold text-amber-600 block">Cotización Formal #TM-{numeroCotizacion}</span>
            <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleDateString('es-PE')}</span>
          </div>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
          <div>
            <span className="font-bold text-slate-500 block uppercase text-[10px]">Cliente / Empresa:</span>
            <input 
              type="text" 
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="font-bold text-slate-900 bg-transparent border-b border-slate-300 w-full focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <span className="font-bold text-slate-500 block uppercase text-[10px]">Ubicación del Proyecto:</span>
            <input 
              type="text" 
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              className="font-bold text-slate-900 bg-transparent border-b border-slate-300 w-full focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* DETALLE COMERCIAL DE PARTIDAS */}
        <table className="w-full text-left text-xs mb-6 border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white uppercase text-[10px]">
              <th className="p-2.5">Item</th>
              <th className="p-2.5">Descripción de la Partida</th>
              <th className="p-2.5 text-right">Monto (S/.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {partidas.map(p => (
              <tr key={p.item} className="align-top">
                <td className="p-2.5 font-bold">{p.item}</td>
                <td className="p-2.5">
                  <span className="font-bold">{p.desc}</span>
                  {p.sub && p.sub.length > 0 && <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500">{p.sub.map((t, i) => <li key={i}>· {t}</li>)}</ul>}
                </td>
                <td className="p-2.5 text-right font-mono font-bold">S/. {(p.monto || 0).toFixed(2)}</td>
              </tr>
            ))}
            {!isBom && <tr><td colSpan={3} className="p-4 text-center text-slate-400">Diseña tu techo en "1. Diseño CAD" para generar la cotización.</td></tr>}
          </tbody>
        </table>

        {/* TOTALES */}
        <div className="flex justify-end border-t-2 border-slate-900 pt-4 text-xs font-mono">
          <div className="w-64 space-y-1.5 text-right">
            <div className="flex justify-between">
              <span className="text-slate-600">SUBTOTAL:</span>
              <span className="font-bold">S/. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">I.G.V. (18%){costos.igv ? '' : ' — no aplicado'}:</span>
              <span className="font-bold">S/. {igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-amber-600 border-t border-slate-300 pt-1.5">
              <span>TOTAL (S/.):</span>
              <span>S/. {totalConIgv.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {isBom && <CondicionesComerciales total={totalConIgv} />}
      </div>
    </div>
  );
};

export default TechosPresupuestoView;

