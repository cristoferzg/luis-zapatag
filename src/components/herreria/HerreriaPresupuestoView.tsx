// Vista de Presupuesto Formal e Integración de HERRERÍA
// Incluye: Descripción, Unidad, Cantidad, Metrado, Material, Mano de Obra, Precio, Subtotal, Observaciones
// Botón: [ ENVIAR AL PRESUPUESTO ] con selector de proyecto o creación de nuevo proyecto
import BotonImprimir from '../common/BotonImprimir';
import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Send, 
  CheckCircle, 
  Calendar, 
  ArrowRight
} from 'lucide-react';
import { HerreriaDesign, PresupuestoHerreriaResult } from './herreriaTypes';
import { generarDespiece, generarMaterialesAgrupados, calcularCostosDesglosados, generarPresupuesto } from './herreriaCalculations';

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

interface HerreriaPresupuestoViewProps {
  design: HerreriaDesign;
  projects?: ProjectOption[];
  clients?: ClientOption[];
  onSaveToProject?: (projectId: string, projectData: any) => void;
  onCreateProject?: (newProject: any) => void;
  onNavigateToProjects?: () => void;
  currentSettings?: any;
}

export const HerreriaPresupuestoView: React.FC<HerreriaPresupuestoViewProps> = ({
  design,
  projects = [],
  clients = [],
  onSaveToProject,
  onCreateProject,
  onNavigateToProjects,
  currentSettings
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('new');
  const [nuevoProyectoNombre, setNuevoProyectoNombre] = useState<string>(`Obra: ${design.nombre}`);
  const [clienteNombre, setClienteNombre] = useState<string>('Cliente Particular');
  const [incluirIgv, setIncluirIgv] = useState<boolean>(false);
  const [enviadoExito, setEnviadoExito] = useState<boolean>(false);
  const [modalConfirmacion, setModalConfirmacion] = useState<boolean>(false);
  const hojaRef = useRef<HTMLDivElement>(null);

  // Cálculos matemáticos y presupuesto
  const despiece = generarDespiece(design);
  const materialesAgrupados = generarMaterialesAgrupados(design, despiece);
  const costos = calcularCostosDesglosados(design, materialesAgrupados);
  const presupuesto: PresupuestoHerreriaResult = generarPresupuesto(design, costos, despiece);

  const totalFinal = incluirIgv ? presupuesto.totalPresupuestoPEN : presupuesto.subtotalSinIgv;

  // Acción [ ENVIAR AL PRESUPUESTO ]
  const handleEnviarAlPresupuesto = () => {
    // Convertir insumos calculados al formato de materiales del sistema
    const materialesSistema = materialesAgrupados.flatMap(cat => 
      cat.items.map(it => ({
        id: it.id || 'mat-' + Math.random().toString(36).substring(2, 9),
        name: it.nombre,
        quantity: it.cantidad,
        unit: it.unidad,
        price: it.subtotal,
        unitPrice: it.precioUnitario,
        category: cat.categoria
      }))
    );

    const especificacionesTexto = 
      `ESPECIFICACIÓN HERRERÍA: ${design.nombre}\n` +
      `Dimensiones: ${design.anchoM.toFixed(2)}m Ancho × ${design.altoM.toFixed(2)}m Alto (${(design.anchoM * design.altoM).toFixed(2)} m²)\n` +
      `Hojas: ${design.numHojas} | Apertura: ${design.tipoAperturaPorton || design.tipoAperturaPuerta || 'estándar'}\n` +
      `Marco: ${design.perfilMarcoId} | Bastidor: ${design.perfilBastidorId}\n` +
      `Acabado: ${design.acabado.tipoPintura} (${design.acabado.colorNombre})\n` +
      `Peso total acero: ~${despiece.pesoTotalAceroKg} kg`;

    if (selectedProjectId === 'new') {
      const nuevoProj = {
        id: 'proj-' + Date.now(),
        name: nuevoProyectoNombre.trim() || `Herrería: ${design.nombre}`,
        client: clienteNombre.trim() || 'Cliente Particular',
        status: 'Pendiente',
        presupuesto: totalFinal,
        date: new Date().toISOString().split('T')[0],
        materiales: materialesSistema,
        detallesContrato: especificacionesTexto
      };

      if (onCreateProject) {
        onCreateProject(nuevoProj);
      }
    } else {
      if (onSaveToProject) {
        onSaveToProject(selectedProjectId, {
          presupuesto: totalFinal,
          materiales: materialesSistema,
          detallesContrato: especificacionesTexto
        });
      }
    }

    setEnviadoExito(true);
    setModalConfirmacion(false);
  };

  return (
    <div ref={hojaRef} className="imprimir-claro w-full h-full flex flex-col bg-slate-950 p-4 sm:p-6 overflow-y-auto text-slate-200 select-none">
      {/* Cabecera Formal de Presupuesto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                PRESUPUESTO TÉCNICO DE FABRICACIÓN
              </h2>
              <p className="text-xs text-slate-400">
                {currentSettings?.appName || 'Innova Contratistas'} • Carpintería Metálica y Cerrajería Industrial
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 no-imprimir">
          {/* Botón [ ENVIAR AL PRESUPUESTO ] */}
          <button
            onClick={() => setModalConfirmacion(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>ENVIAR AL PRESUPUESTO</span>
          </button>

          <BotonImprimir objetivo={() => hojaRef.current} titulo="Presupuesto de herrería" etiqueta="Imprimir"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer" />
        </div>
      </div>

      {/* Alerta de Envío Exitoso */}
      {enviadoExito && (
        <div className="my-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">¡Presupuesto integrado con éxito!</p>
              <p className="text-emerald-300 text-[11px]">
                Se ha sincronizado con el gestor central de proyectos y presupuestos de Innova Contratistas.
              </p>
            </div>
          </div>
          {onNavigateToProjects && (
            <button
              onClick={onNavigateToProjects}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold ml-2 shrink-0"
            >
              <span>Ver Proyectos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Ficha de Proyecto y Datos del Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Estructura / Elemento</span>
          <span className="text-white font-bold text-sm block">{design.nombre}</span>
          <span className="text-slate-400 text-[11px] font-mono">
            {design.anchoM.toFixed(2)}m × {design.altoM.toFixed(2)}m (Área: {(design.anchoM * design.altoM).toFixed(2)} m²)
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Cliente / Destino</span>
          <input
            type="text"
            value={clienteNombre}
            onChange={e => setClienteNombre(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:border-blue-500"
            placeholder="Nombre del Cliente"
          />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Fecha de Emisión</span>
          <span className="text-white font-mono flex items-center gap-1.5 pt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Tabla Desglosada Requerida:
          Descripción | Unidad | Cantidad | Metrado | Material | Mano de obra | Precio | Subtotal | Observaciones */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl my-2 flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Item / Descripción</th>
                <th className="py-3 px-2 text-center">Unidad</th>
                <th className="py-3 px-2 text-center">Cant</th>
                <th className="py-3 px-2 text-center">Metrado</th>
                <th className="py-3 px-3 text-right">Material (S/.)</th>
                <th className="py-3 px-3 text-right">M.O. (S/.)</th>
                <th className="py-3 px-3 text-right">P. Unit (S/.)</th>
                <th className="py-3 px-3 text-right">Subtotal (S/.)</th>
                <th className="py-3 px-3">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {presupuesto.items.map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-sans font-medium text-white max-w-xs">
                    <span className="text-blue-400 font-bold mr-1.5">0{idx + 1}.</span>
                    {it.descripcion}
                  </td>
                  <td className="py-3 px-2 text-center font-sans text-slate-400">{it.unidad}</td>
                  <td className="py-3 px-2 text-center font-bold text-white bg-slate-800/30">{it.cantidad}</td>
                  <td className="py-3 px-2 text-center text-slate-300">{it.metrado.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-slate-300">S/. {it.material.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-blue-400">S/. {it.manoDeObra.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-100">S/. {it.precioUnitario.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">S/. {it.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-3 font-sans text-slate-400 text-[11px] max-w-xs">{it.observaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de Cierre Financiero */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 my-4 text-xs">
        <div className="space-y-1 text-slate-400">
          <p>• Validez de la cotización: 15 días calendario.</p>
          <p>• Forma de pago estándar: 60% adelanto a la firma, 40% contra entrega e instalación.</p>
          <p>• Garantía estructural: 2 años en cordones de soldadura y fijación.</p>
        </div>

        <div className="w-full sm:w-80 space-y-2 font-mono bg-slate-950 p-3.5 rounded-lg border border-slate-800">
          <div className="flex justify-between text-slate-300">
            <span>Costo Directo Base:</span>
            <span>S/. {presupuesto.costoDirecto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Gastos Generales (10%):</span>
            <span>S/. {presupuesto.gastosGeneralesMonto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Utilidad (20%):</span>
            <span className="text-blue-400">S/. {presupuesto.utilidadMonto.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-200 font-bold pt-1.5 border-t border-slate-800">
            <span>Subtotal sin IGV:</span>
            <span>S/. {presupuesto.subtotalSinIgv.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 py-1">
            <label className="flex items-center gap-1.5 cursor-pointer font-sans text-xs">
              <input
                type="checkbox"
                checked={incluirIgv}
                onChange={e => setIncluirIgv(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              <span>Incluir I.G.V. (18%):</span>
            </label>
            <span>{incluirIgv ? `S/. ${presupuesto.igvMonto.toFixed(2)}` : 'S/. 0.00'}</span>
          </div>

          <div className="flex justify-between text-emerald-400 font-bold text-sm pt-2 border-t border-slate-800">
            <span>TOTAL PRESUPUESTO:</span>
            <span className="text-base font-extrabold">S/. {totalFinal.toFixed(2)} PEN</span>
          </div>
        </div>
      </div>

      {/* MODAL DE INTEGRACIÓN: [ ENVIAR AL PRESUPUESTO ] */}
      {modalConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Send className="w-4 h-4 text-emerald-400" />
                <span>INTEGRAR CON INNOVA CONTRATISTAS</span>
              </div>
              <button onClick={() => setModalConfirmacion(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Selecciona si deseas vincular este presupuesto a un proyecto existente o registrar una nueva obra en el sistema:
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Destino del Presupuesto</label>
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-blue-500"
                >
                  <option value="new">+ CREAR NUEVO PROYECTO DE HERRERÍA</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client} - Actual: S/. {p.presupuesto?.toFixed(2) || '0.00'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProjectId === 'new' && (
                <>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Nombre del Nuevo Proyecto</label>
                    <input
                      type="text"
                      value={nuevoProyectoNombre}
                      onChange={e => setNuevoProyectoNombre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-blue-500 font-medium"
                      placeholder="Ej. Portón Residencial Los Álamos"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-semibold">Cliente</label>
                    <input
                      type="text"
                      list="herreria-clients-list"
                      value={clienteNombre}
                      onChange={e => setClienteNombre(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-blue-500"
                      placeholder="Nombre del Cliente o seleccionar de la lista"
                    />
                    <datalist id="herreria-clients-list">
                      {clients.map(c => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                </>
              )}

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div className="flex justify-between font-bold text-white">
                  <span>Monto Total a Asignar:</span>
                  <span className="font-mono text-emerald-400">S/. {totalFinal.toFixed(2)} PEN</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Se transferirá la lista completa de insumos, materiales y especificaciones de taller.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalConfirmacion(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviarAlPresupuesto}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar y Enviar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
