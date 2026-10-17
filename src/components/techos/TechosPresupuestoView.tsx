// Presupuesto Comercial Formal Exclusivo para Techos Metálicos y Coberturas
import React, { useState } from 'react';
import { FileText, Printer, Send, CheckCircle, ArrowRight } from 'lucide-react';

interface ProjectOption {
  id: string;
  name: string;
  client: string;
  presupuesto: number;
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
}

export const TechosPresupuestoView: React.FC<TechosPresupuestoViewProps> = ({
  design,
  nombreProyecto = 'Techo Metálico Estructural',
  projects = [],
  clients: _clients = [],
  onSaveToProject,
  onCreateProject,
  onNavigateToProjects,
  currentSettings
}) => {
  const [clienteNombre, setClienteNombre] = useState<string>('CLIENTE INDUSTRIAL S.A.C.');
  const [ubicacion, setUbicacion] = useState<string>('LIMA - PERÚ');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');
  const [nuevoProyectoNombre, setNuevoProyectoNombre] = useState<string>(`Obra: ${nombreProyecto}`);
  const [enviadoExito, setEnviadoExito] = useState<boolean>(false);

  const companyName = currentSettings?.appName ? currentSettings.appName.toUpperCase() : 'INNOVA CONTRATISTAS';
  const companyRuc = currentSettings?.contratistaDni ? `RUC: ${currentSettings.contratistaDni}` : 'RUC: 20601234567';
  const companyCel = currentSettings?.contratistaPhone ? `Cel: ${currentSettings.contratistaPhone}` : 'Cel: 987-654-321';
  const companyDir = currentSettings?.contratistaDir || 'Lima, Perú';

  const isBom = design && typeof design.precioVentaFinalSoles === 'number';

  const subtotal = isBom ? design.costoDirectoTotalSoles + design.gastosGeneralesYUtilidadSoles : 12000;
  const igv = 0;
  const totalConIgv = subtotal;

  const handleImprimir = () => {
    window.print();
  };

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
      if (onSaveToProject) {
        onSaveToProject(selectedProjectId, {
          presupuesto: totalConIgv,
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
          <button
            onClick={handleImprimir}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>IMPRIMIR (PDF)</span>
          </button>
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

      {/* HOJA IMPRESA DE COTIZACIÓN */}
      <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-4xl mx-auto shadow-xl border border-slate-200 font-sans print:shadow-none print:p-0 print:border-none">
        
        {/* CABECERA */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start gap-4">
            {currentSettings?.logoBase64 && (
              <img src={currentSettings.logoBase64} alt="Logo" className="h-14 max-w-[120px] object-contain rounded-md" />
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{companyName}</h1>
              <p className="text-xs text-slate-600 font-bold">Ingeniería, Fabricación y Montaje de Techos y Estructuras Metálicas</p>
              <p className="text-[11px] text-slate-500">{companyRuc} | {companyCel} | {companyDir}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase font-extrabold text-amber-600 block">Cotización Formal #TM-{Date.now().toString().slice(-4)}</span>
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
            <tr>
              <td className="p-2.5 font-bold">01.01</td>
              <td className="p-2.5">Suministro y habilitado de perfilería tubular estructural A36 / Tubos / Perfiles C/Z</td>
              <td className="p-2.5 text-right font-mono font-bold">S/. {(subtotal * 0.50).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold">01.02</td>
              <td className="p-2.5">Fabricación de tijerales, columnas, vigas y arriostramientos con soldadura homologada AWS</td>
              <td className="p-2.5 text-right font-mono font-bold">S/. {(subtotal * 0.25).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold">01.03</td>
              <td className="p-2.5">Montaje en obra con maniobra de grúa, andamios normados y fijación con pernos EPDM herméticos</td>
              <td className="p-2.5 text-right font-mono font-bold">S/. {(subtotal * 0.25).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* TOTALES */}
        <div className="flex justify-end border-t-2 border-slate-900 pt-4 text-xs font-mono">
          <div className="w-64 space-y-1.5 text-right">
            <div className="flex justify-between">
              <span className="text-slate-600">SUBTOTAL DIRECTO:</span>
              <span className="font-bold">S/. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">I.G.V. (18%):</span>
              <span className="font-bold">S/. {igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-amber-600 border-t border-slate-300 pt-1.5">
              <span>TOTAL (S/.):</span>
              <span>S/. {totalConIgv.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechosPresupuestoView;

