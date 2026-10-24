// Modal para Enviar al Presupuesto de Innova Contratistas Manager
import React, { useState } from 'react';
import { 
  Briefcase, 
  FolderPlus, 
  CheckCircle, 
  ArrowRight, 
  X 
} from 'lucide-react';
import { PuertaVentanaDesign, PresupuestoCarpinteriaResult } from './carpinteriaTypes';

interface CarpinteriaProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  design: PuertaVentanaDesign;
  presupuesto: PresupuestoCarpinteriaResult;
  projects: any[];
  setProjects: React.Dispatch<React.SetStateAction<any[]>>;
  onSuccessNavigate?: (projectId: string) => void;
}

export const CarpinteriaProjectModal: React.FC<CarpinteriaProjectModalProps> = ({
  isOpen,
  onClose,
  design,
  presupuesto,
  projects,
  setProjects,
  onSuccessNavigate
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects.length > 0 ? projects[0].id : 'new');
  const [newProjectName, setNewProjectName] = useState<string>(`Carpintería: ${design.nombre}`);
  const [newClientName, setNewClientName] = useState<string>('Cliente Particular');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnviar = () => {
    // Generar la lista de materiales convertida al formato de Project
    const nuevosMateriales = presupuesto.items
      .filter(item => item.categoria === 'perfiles' || item.categoria === 'planchas' || item.categoria === 'vidrios' || item.categoria === 'accesorios')
      .map(item => ({
        id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: item.descripcion,
        quantity: item.cantidad,
        unit: item.unidad,
        unitPrice: item.precioUnitario,
        price: item.subtotal,
        category: 'Carpintería Metálica'
      }));

    const detalleTecnico = `[DISEÑO DE CARPINTERÍA: ${design.nombre}]
- Tipo: ${design.tipoElemento.toUpperCase()} (${design.anchoM.toFixed(2)}m x ${design.altoM.toFixed(2)}m = ${(design.anchoM * design.altoM).toFixed(2)} m²)
- Apertura: ${design.sentidoApertura}
- Acabado: ${design.acabado.colorNombre} (${design.acabado.tipoPintura.replace(/_/g, ' ')})
- Costo Directo: S/. ${presupuesto.costoDirecto.toFixed(2)} PEN
- Presupuesto Final (Inc. IGV): S/. ${presupuesto.totalPresupuestoPEN.toFixed(2)} PEN`;

    if (selectedProjectId === 'new') {
      const newProj = {
        id: `proj-${Date.now()}`,
        name: newProjectName || `Carpintería: ${design.nombre}`,
        client: newClientName || 'Cliente Particular',
        status: 'Pendiente' as const,
        presupuesto: presupuesto.totalPresupuestoPEN,
        date: new Date().toISOString().split('T')[0],
        materiales: nuevosMateriales,
        detallesContrato: detalleTecnico
      };

      setProjects(prev => [newProj, ...prev]);
      setSuccessMessage(`¡Se ha creado el proyecto "${newProj.name}" con el presupuesto asignado de S/. ${presupuesto.totalPresupuestoPEN.toFixed(2)}!`);
      setTimeout(() => {
        if (onSuccessNavigate) onSuccessNavigate(newProj.id);
        onClose();
      }, 1500);
    } else {
      setProjects(prev => prev.map(p => {
        if (p.id === selectedProjectId) {
          const matExistentes = p.materiales || [];
          return {
            ...p,
            presupuesto: (p.presupuesto || 0) + presupuesto.totalPresupuestoPEN,
            materiales: [...matExistentes, ...nuevosMateriales],
            detallesContrato: p.detallesContrato 
              ? `${p.detallesContrato}\n\n${detalleTecnico}`
              : detalleTecnico
          };
        }
        return p;
      }));

      const projTarget = projects.find(p => p.id === selectedProjectId);
      setSuccessMessage(`¡Se han añadido las partidas de carpintería y materiales al proyecto "${projTarget?.name || ''}"!`);
      setTimeout(() => {
        if (onSuccessNavigate) onSuccessNavigate(selectedProjectId);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Enviar al Presupuesto de Obra
              </h3>
              <p className="text-xs text-slate-400">
                Integración con Proyectos y Control de Costos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4 text-xs">
          {successMessage ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 animate-bounce" />
              <h4 className="text-base font-bold text-emerald-900">¡Presupuesto Integrado con Éxito!</h4>
              <p className="text-xs text-emerald-700">{successMessage}</p>
            </div>
          ) : (
            <>
              {/* Tarjeta de Resumen Económico */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">Elemento en Fabricación</span>
                  <strong className="text-slate-900 text-sm">{design.nombre}</strong>
                  <p className="text-slate-500 text-[11px]">
                    {design.anchoM.toFixed(2)}m × {design.altoM.toFixed(2)}m ({(design.anchoM * design.altoM).toFixed(2)} m²)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Monto a Asignar</span>
                  <strong className="text-indigo-900 font-mono text-base font-black">
                    S/. {presupuesto.totalPresupuestoPEN.toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Selector de Proyecto */}
              <div className="space-y-3">
                <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  Seleccionar Destino del Presupuesto
                </label>

                <div className="space-y-2">
                  <label className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                    selectedProjectId === 'new' ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="projectChoice"
                      value="new"
                      checked={selectedProjectId === 'new'}
                      onChange={() => setSelectedProjectId('new')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <strong className="text-slate-900 block font-bold flex items-center space-x-1.5">
                        <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Crear como Nuevo Proyecto</span>
                      </strong>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Registrar una nueva obra independiente para este cliente.
                      </p>
                    </div>
                  </label>

                  {projects.length > 0 && (
                    <label className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                      selectedProjectId !== 'new' ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <input
                        type="radio"
                        name="projectChoice"
                        value="existing"
                        checked={selectedProjectId !== 'new'}
                        onChange={() => setSelectedProjectId(projects[0].id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <strong className="text-slate-900 block font-bold flex items-center space-x-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                          <span>Añadir a Proyecto Existente</span>
                        </strong>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Sumar este presupuesto y materiales a una obra activa.
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Si es nuevo proyecto */}
                {selectedProjectId === 'new' ? (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Nombre del Proyecto</label>
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                        placeholder="Ej. Fabricación e Instalación de Puertas y Portón"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Cliente</label>
                      <input
                        type="text"
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                        placeholder="Nombre o empresa del cliente"
                      />
                    </div>
                  </div>
                ) : (
                  /* Selector de Proyecto Existente */
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-slate-600 font-medium mb-1">Elegir Proyecto de la Lista</label>
                    <select
                      value={selectedProjectId}
                      onChange={e => setSelectedProjectId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Cliente: {p.client} (Actual: S/. {p.presupuesto?.toFixed(2) || '0.00'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pie de Modal */}
        {!successMessage && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-md hover:shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <span>Confirmar e Integrar al Presupuesto</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarpinteriaProjectModal;
