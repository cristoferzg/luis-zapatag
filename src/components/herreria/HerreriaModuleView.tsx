// Módulo Principal e Independiente de HERRERÍA para Innova Contratistas Manager
// Cumple estrictamente todos los lineamientos solicitados para el módulo de Herrería
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DoorClosed, 
  Plus, 
  Save, 
  FolderOpen, 
  Download, 
  HelpCircle, 
  Layers, 
  Scissors, 
  Package, 
  DollarSign, 
  FileText,
  Check,
  UploadCloud,
  Undo2,
  Redo2
} from 'lucide-react';
import { HerreriaDesign } from './herreriaTypes';
import { DISENOS_PREDETERMINADOS, crearDisenoVacio, asegurarCad } from './herreriaCatalog';
import { safeStorage } from '../../lib/storageManager';
import { HerreriaCanvas2D } from './HerreriaCanvas2D';
import { HerreriaPropertiesPanel, HerreriaSelectedType } from './HerreriaPropertiesPanel';
import { HerreriaDespieceView } from './HerreriaDespieceView';
import { HerreriaMaterialesView } from './HerreriaMaterialesView';
import { HerreriaCostosView } from './HerreriaCostosView';
import { HerreriaPresupuestoView } from './HerreriaPresupuestoView';
import { HerreriaPlanoCadView } from './HerreriaPlanoCadView';
import { CadFileUploadModal, CadImportResult } from '../common/CadFileUploadModal';
import { dxfModelToHerreriaPiezas, generateHerreriaDxf } from '../../lib/dxfParser';

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

interface HerreriaModuleViewProps {
  projects?: ProjectOption[];
  clients?: ClientOption[];
  onSaveToProject?: (projectId: string, projectData: any) => void;
  onCreateProject?: (newProject: any) => void;
  onNavigateToProjects?: () => void;
  currentSettings?: any;
}

export type HerreriaTab = 'cad' | 'despiece' | 'materiales' | 'costos' | 'presupuesto' | 'plano';

export const HerreriaModuleView: React.FC<HerreriaModuleViewProps> = ({
  projects = [],
  clients = [],
  onSaveToProject,
  onCreateProject,
  onNavigateToProjects,
  currentSettings
}) => {
  // Estado del diseño actual (inicia con un lienzo CAD vacío para diseñar desde cero)
  const [design, setDesign] = useState<HerreriaDesign>(() => {
    const saved = safeStorage.getItem<any>('innova_herreria_current_design', null);
    if (saved) {
      try {
        return asegurarCad(typeof saved === 'string' ? JSON.parse(saved) : saved);
      } catch (e) {
        console.error('Error loading saved herreria design', e);
      }
    }
    return crearDisenoVacio('Nuevo Diseño CAD');
  });

  const [activeTab, setActiveTab] = useState<HerreriaTab>('cad');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<HerreriaSelectedType>(null);

  // ---- Historial de DESHACER / REHACER ------------------------------------
  // Se registra en un solo punto (commitDesign) en vez de en cada edición.
  const designRef = useRef<HerreriaDesign>(design);
  designRef.current = design;
  const undoStackRef = useRef<HerreriaDesign[]>([]);
  const redoStackRef = useRef<HerreriaDesign[]>([]);
  const lastPushRef = useRef<number>(0);
  const [histVer, setHistVer] = useState(0); // refresca el estado activo/inactivo de los botones

  const commitDesign = useCallback((updated: HerreriaDesign) => {
    const prev = designRef.current;
    const now = Date.now();
    const sameLen = (updated.piezas?.length ?? 0) === (prev.piezas?.length ?? 0);
    // Coalesce: durante un arrastre (misma cantidad de piezas y <500ms) no se
    // registra cada frame; sí se registra al agregar/quitar piezas o tras una pausa.
    if (!sameLen || now - lastPushRef.current > 500) {
      undoStackRef.current.push(prev);
      if (undoStackRef.current.length > 60) undoStackRef.current.shift();
      redoStackRef.current = [];
      lastPushRef.current = now;
      setHistVer(v => v + 1);
    }
    setDesign(updated);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push(designRef.current);
    lastPushRef.current = 0;
    setDesign(prev);
    setHistVer(v => v + 1);
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(designRef.current);
    lastPushRef.current = 0;
    setDesign(next);
    setHistVer(v => v + 1);
  }, []);

  // Atajos de teclado Ctrl/Cmd+Z (deshacer) y Ctrl+Y / Ctrl+Shift+Z (rehacer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); handleUndo(); }
      else if ((e.ctrlKey || e.metaKey) && ((e.key === 'y' || e.key === 'Y') || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;
  void histVer; // canUndo/canRedo dependen de histVer vía re-render

  // Estados de Modales y Mensajes
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [savedDesignsList, setSavedDesignsList] = useState<HerreriaDesign[]>([]);

  // Mobile Bottom Sheet
  const [isOpenMobileSheet, setIsOpenMobileSheet] = useState<boolean>(false);

  // Guardar de forma segura con debounce para máxima fluidez al arrastrar piezas
  useEffect(() => {
    const timer = setTimeout(() => {
      safeStorage.setItem('innova_herreria_current_design', design);
    }, 600);
    return () => clearTimeout(timer);
  }, [design]);

  // Cargar lista de guardados al abrir modal
  const loadSavedList = () => {
    const savedArr = safeStorage.getItem<HerreriaDesign[]>('innova_herreria_saved_designs', []);
    setSavedDesignsList(Array.isArray(savedArr) ? savedArr : []);
  };

  // Botón [ GUARDAR ]
  const handleGuardar = () => {
    const savedArr = safeStorage.getItem<HerreriaDesign[]>('innova_herreria_saved_designs', []);
    let lista: HerreriaDesign[] = Array.isArray(savedArr) ? [...savedArr] : [];
    const idx = lista.findIndex(d => d.id === design.id);
    if (idx >= 0) {
      lista[idx] = design;
    } else {
      lista.push(design);
    }
    safeStorage.setItem('innova_herreria_saved_designs', lista);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 2000);
  };

  // Botón [ + NUEVO ] - Lienzo CAD 100% en Blanco
  const handleNuevo = () => {
    const nuevo = crearDisenoVacio('Nuevo Diseño CAD');
    setDesign(nuevo);
    safeStorage.setItem('innova_herreria_current_design', nuevo);
    setSelectedElementId(null);
    setSelectedType(null);
    setIsOpenMobileSheet(false);
    setActiveTab('cad');
  };

  // Importar archivo AutoCAD DXF
  const handleImportDxf = (result: CadImportResult) => {
    if (result.dxfModel) {
      const { piezas, width, height } = dxfModelToHerreriaPiezas(result.dxfModel, result.customScale);
      setDesign(prev => {
        const base = asegurarCad(prev);
        return {
          ...base,
          nombre: result.fileName.replace(/\.dxf$/i, ''),
          anchoM: width,
          altoM: height,
          piezas: piezas.length > 0 ? piezas : base.piezas,
          tipoElemento: 'personalizado'
        };
      });
      setSelectedElementId(null);
      setSelectedType(null);
      setActiveTab('cad');
      setShowSavedNotification(true);
      setTimeout(() => setShowSavedNotification(false), 2500);
    }
  };

  // Importar archivo JSON
  const handleImportJson = (jsonData: any, fileName: string) => {
    try {
      const loaded = asegurarCad(jsonData);
      if (!loaded.nombre) {
        loaded.nombre = fileName.replace(/\.json$/i, '');
      }
      setDesign(loaded);
      setSelectedElementId(null);
      setSelectedType(null);
      setActiveTab('cad');
      setShowSavedNotification(true);
      setTimeout(() => setShowSavedNotification(false), 2500);
    } catch (e) {
      console.error('Error importando JSON en Herrería:', e);
    }
  };

  // Exportar archivo AutoCAD DXF
  const handleExportDxf = () => {
    const dxfString = generateHerreriaDxf(design);
    const dataStr = "data:application/dxf;charset=utf-8," + encodeURIComponent(dxfString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${design.nombre.toLowerCase().replace(/\s+/g, '_')}.dxf`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Botón [ EXPORTAR ]
  const handleExportar = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(design, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${design.nombre.toLowerCase().replace(/\s+/g, '_')}_innova.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 text-slate-800 overflow-hidden font-sans select-none">
      {/* ==================================================
          2. CABECERA
          Mostrar:
          🚪 HERRERÍA
          Proyecto: [Nombre del proyecto]
          Botones: [ + NUEVO ] [ GUARDAR ] [ CARGAR ] [ EXPORTAR ] [ AYUDA ]
      ================================================== */}
      <header className="w-full bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
            <DoorClosed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide">
                HERRERÍA Y CERRAJERÍA
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono font-bold border border-blue-200">
                CAD 2D / 3D
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Proyecto:</span>
              <input
                type="text"
                value={design.nombre}
                onChange={e => setDesign({ ...design, nombre: e.target.value })}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded px-2 py-0.5 text-slate-800 font-medium text-xs focus:border-blue-500 focus:bg-white focus:outline-none transition-colors w-40 sm:w-64"
                title="Editar nombre del diseño"
              />
            </div>
          </div>
        </div>

        {/* Botones de Cabecera Solicitados */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          {/* [ DESHACER / REHACER ] */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5 shrink-0">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center justify-center w-8 h-7 rounded-md text-slate-600 hover:bg-white disabled:opacity-35 disabled:cursor-default active:scale-95 transition-all cursor-pointer"
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex items-center justify-center w-8 h-7 rounded-md text-slate-600 hover:bg-white disabled:opacity-35 disabled:cursor-default active:scale-95 transition-all cursor-pointer"
              title="Rehacer (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* [ SUBIR CAD / AUTOCAD ] */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Subir archivo .DXF (AutoCAD) o .JSON de proyecto"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline font-bold">SUBIR CAD</span>
          </button>

          {/* [ + NUEVO ] */}
          <button
            onClick={handleNuevo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs active:scale-95 transition-all cursor-pointer"
            title="Crear nuevo diseño de herrería"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">+ NUEVO</span>
          </button>

          {/* [ GUARDAR ] */}
          <button
            onClick={handleGuardar}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
            title="Guardar diseño actual"
          >
            {showSavedNotification ? <Check className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
            <span>{showSavedNotification ? 'GUARDADO' : 'GUARDAR'}</span>
          </button>

          {/* [ CARGAR ] */}
          <button
            onClick={() => {
              loadSavedList();
              setShowLoadModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs active:scale-95 transition-all"
            title="Cargar diseño guardado"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">CARGAR</span>
          </button>

          {/* [ EXPORTAR ] */}
          <button
            onClick={handleExportar}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs active:scale-95 transition-all"
            title="Exportar archivo JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">EXPORTAR</span>
          </button>

          {/* [ AYUDA ] */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs active:scale-95 transition-all"
            title="Guía de uso y atajos"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden lg:inline">AYUDA</span>
          </button>
        </div>
      </header>

      {/* Barra de Pestañas Principales del Módulo:
          DISEÑAR → DIMENSIONAR → MATERIALES → DESPIECE → METRADO/COSTOS → PRESUPUESTO */}
      <nav 
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.stopPropagation();
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 flex items-center justify-between overflow-x-auto shrink-0 z-10 select-none scrollbar-none"
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('cad')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'cad'
                ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. DISEÑO CAD (2D / 3D)</span>
          </button>

          <button
            onClick={() => setActiveTab('despiece')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'despiece'
                ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>2. DESPIECE Y CORTES</span>
          </button>

          <button
            onClick={() => setActiveTab('materiales')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'materiales'
                ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>3. MATERIALES AGRUPADOS</span>
          </button>

          <button
            onClick={() => setActiveTab('costos')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'costos'
                ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>4. ESTRUCTURA DE COSTOS</span>
          </button>

          <button
            onClick={() => setActiveTab('presupuesto')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'presupuesto'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>5. PRESUPUESTO FORMAL</span>
          </button>

          <button
            onClick={() => setActiveTab('plano')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'plano'
                ? 'border-purple-600 text-purple-600 bg-purple-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>6. PLANO CAD ARQUITECTÓNICO (PDF / IMPRIMIR)</span>
          </button>
        </div>
      </nav>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full h-full overflow-hidden relative flex">
        {/* PESTAÑA 1: CAD 2D/3D CON PANEL DE PROPIEDADES */}
        {activeTab === 'cad' && (
          <div className="flex-1 w-full h-full flex flex-row overflow-hidden relative">
            {/* Canvas CAD 2D interactivo y visor 3D */}
            <div className="flex-1 w-full h-full overflow-hidden relative">
              <HerreriaCanvas2D
                design={design}
                onUpdateDesign={commitDesign}
                selectedElementId={selectedElementId}
                onSelectElement={(id, type) => {
                  setSelectedElementId(id);
                  setSelectedType(type);
                }}
                onOpenInspector={() => setIsOpenMobileSheet(prev => !prev)}
                isInspectorOpen={isOpenMobileSheet}
                onNuevo={handleNuevo}
              />
            </div>

            {/* Panel de Propiedades: Lateral en PC / Bottom Sheet en Celular */}
            <HerreriaPropertiesPanel
              design={design}
              onUpdateDesign={commitDesign}
              selectedElementId={selectedElementId}
              selectedType={selectedType}
              onClose={() => {
                setSelectedElementId(null);
                setSelectedType(null);
                setIsOpenMobileSheet(false);
              }}
              isOpenMobile={isOpenMobileSheet}
              onToggleMobile={() => setIsOpenMobileSheet(!isOpenMobileSheet)}
            />
          </div>
        )}

        {/* PESTAÑA 2: DESPIECE Y OPTIMIZADOR 1D DE BARRAS */}
        {activeTab === 'despiece' && (
          <HerreriaDespieceView design={design} />
        )}

        {/* PESTAÑA 3: MATERIALES AGRUPADOS */}
        {activeTab === 'materiales' && (
          <HerreriaMaterialesView design={design} />
        )}

        {/* PESTAÑA 4: ESTRUCTURA DE COSTOS (9 RUBROS) */}
        {activeTab === 'costos' && (
          <HerreriaCostosView design={design} onUpdateDesign={setDesign} />
        )}

        {/* PESTAÑA 5: PRESUPUESTO E INTEGRACIÓN */}
        {activeTab === 'presupuesto' && (
          <HerreriaPresupuestoView
            design={design}
            projects={projects}
            clients={clients}
            onSaveToProject={onSaveToProject}
            onCreateProject={onCreateProject}
            onNavigateToProjects={onNavigateToProjects}
            currentSettings={currentSettings}
          />
        )}

        {/* PESTAÑA 6: PLANO CAD ARQUITECTÓNICO IMPRIMIBLE */}
        {activeTab === 'plano' && (
          <div className="flex-1 w-full h-full overflow-y-auto">
            <HerreriaPlanoCadView design={design} currentSettings={currentSettings} />
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL: CARGAR DISEÑOS GUARDADOS O PRESETS
      ========================================== */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <span>CARGAR PROYECTO O PLANTILLA DE HERRERÍA</span>
              </h3>
              <button onClick={() => setShowLoadModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {/* Presets de Fábrica */}
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                  Modelos Prediseñados de Taller
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DISENOS_PREDETERMINADOS.map((preset, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => {
                        setDesign(asegurarCad({ ...preset, id: 'herreria-' + Date.now() }));
                        setSelectedElementId(null);
                        setSelectedType(null);
                        setShowLoadModal(false);
                      }}
                      className="p-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-500 rounded-xl cursor-pointer transition-all flex flex-col justify-between group shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">{preset.nombre}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {preset.tipoElemento}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono mt-2">
                        {preset.anchoM.toFixed(2)}m Ancho × {preset.altoM.toFixed(2)}m Alto ({preset.numHojas} hojas)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guardados Locales */}
              {savedDesignsList.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                    Tus Diseños Guardados Localmente
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedDesignsList.map((guardado, gIdx) => (
                      <div
                        key={gIdx}
                        onClick={() => {
                          setDesign(asegurarCad(guardado));
                          setSelectedElementId(null);
                          setSelectedType(null);
                          setShowLoadModal(false);
                        }}
                        className="p-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-emerald-500 rounded-xl cursor-pointer transition-all flex flex-col justify-between group shadow-2xs hover:shadow-xs"
                      >
                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">{guardado.nombre}</span>
                        <span className="text-[11px] text-slate-500 font-mono mt-1">
                          {guardado.anchoM.toFixed(2)}m × {guardado.altoM.toFixed(2)}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: AYUDA Y GUÍA RÁPIDA DE HERRERÍA
      ========================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                    Guía de Dibujo y Métodos CAD de Herrería
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Técnicas para trazos rectos, diagonales, tubos rolados y control táctil
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3.5 leading-relaxed overflow-y-auto pr-1">
              {/* Sección 1: Perfiles Rectos */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 font-black text-blue-900 text-xs mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span>1. Perfiles 100% Rectos (Columnas, Travesaños y Marcos)</span>
                </div>
                <p className="text-slate-700 text-[11px] mb-1.5">
                  • <b>Herramientas directas recomendadas:</b> Usa <b>Horizontal (0°)</b> o <b>Vertical (90°)</b> en el menú superior para garantizar columnas a plomo y travesaños a nivel sin margen de error táctil.
                </p>
                <p className="text-slate-700 text-[11px]">
                  • <b>Guía Polar Inteligente (AutoCAD):</b> Si usas <i>Línea Libre</i>, al acercarte a 0° o 90° se proyecta un eje verde infinito con el cartel <b>🟢 RECTO 0.0°</b> o <b>🟢 RECTO 90.0°</b>, auto-nivelando el tubo si tu dedo se desvía levemente.
                </p>
              </div>

              {/* Sección 2: Diagonales e Inclinados */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 font-black text-amber-900 text-xs mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                  <span>2. Tubos Inclinados y Diagonales (Arriostres en "Z" o "X")</span>
                </div>
                <p className="text-slate-700 text-[11px] mb-1.5">
                  • <b>Herramienta:</b> Usa <b>Línea Libre</b>. No se alterará ni forzará a recto si la inclinación es intencional (mayor a 3°).
                </p>
                <p className="text-slate-700 text-[11px]">
                  • <b>Unión a Vértices con SNAP:</b> Toca la esquina interior de un marco y luego la esquina opuesta; el imán magnético lo engancha al ras y calcula el ángulo de corte en inglete para la tronzadora en el <i>Despiece</i>.
                </p>
              </div>

              {/* Sección 3: Piezas Roladas */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 font-black text-emerald-900 text-xs mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span>3. Piezas Roladas y Copetes Curvos (Arco 3 Puntos)</span>
                </div>
                <p className="text-slate-700 text-[11px] mb-1.5">
                  • <b>Herramienta:</b> Usa <b>Arco Curvo</b> en 3 toques: <i>(1) Extremo izquierdo, (2) Extremo derecho, y (3) Bombeo hacia arriba</i>.
                </p>
                <p className="text-slate-700 text-[11px]">
                  • <b>Datos para el taller:</b> Muestra en vivo la <b>Flecha (cm)</b> y el <b>Radio (R)</b> para calibrar los rodillos de la roladora, calculando en el Despiece la longitud desarrollada que debes cortar recto antes de rolar.
                </p>
              </div>

              {/* Sección 4: Controles Móviles */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 font-black text-slate-800 text-xs mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                  <span>4. Ergonomía en Pantallas Táctiles (Celulares y Tablets)</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  • Botones flotantes compactos en la parte superior que se adaptan al ancho de tu pantalla sin recortarse.
                  <br />
                  • Al tocar cualquier tubo, en la barra inferior aparece su ángulo y el botón <b>⚠️ Enderezar</b> para corregir cualquier imperfección en 1 toque.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: SUBIR / IMPORTAR CAD (AUTOCAD DXF / JSON)
      ========================================== */}
      <CadFileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        moduleName="herreria"
        onImportDxf={handleImportDxf}
        onImportJson={handleImportJson}
        onExportDxf={handleExportDxf}
      />
    </div>
  );
};

export default HerreriaModuleView;
