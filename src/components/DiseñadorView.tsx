import React, { useState, useEffect } from 'react';
import { 
  StructuralGeometry, 
  StructureOptions, 
  CoberturaOptions, 
  ConexionesOptions,
  ColumnElement, 
  BeamElement, 
  PurlinElement,
  ActiveTab,
  ViewMode2D,
  CADTool,
  TipoTecho,
  TipoTijeral,
  DireccionCaida,
  Point2D,
  RoofSector,
  RoofVoid,
  ProjectMode,
  CreationMethod
} from './structural/structuralTypes';
import { generateParametricStructure, calcPolygonArea, getPolygonBounds } from './structural/structuralGenerator';
import { StructuralCanvas2D } from './structural/StructuralCanvas2D';
import { StructuralFloatingPanels, FloatingTab } from './structural/StructuralFloatingPanels';
import { StructuralCalculations } from './structural/StructuralCalculations';
import { StructuralMetrado } from './structural/StructuralMetrado';
import { StructuralPlanos } from './structural/StructuralPlanos';
import { Structural3DView } from './structural/Structural3DView';
import { StructuralPresupuesto } from './structural/StructuralPresupuesto';
import { StructuralWorkflowBar, StructuralStage } from './structural/StructuralWorkflowBar';
import { safeStorage } from '../lib/storageManager';
import { StructuralRevisionView } from './structural/StructuralRevisionView';
import { TranslucentAreaModal } from './structural/TranslucentAreaModal';
import { BasicTrussRoofModal, BasicTrussRoofConfig } from './structural/BasicTrussRoofModal';
import { TrussPatternSelectorModal } from './structural/TrussPatternSelectorModal';
import { StructuralCollapseSimulator } from './structural/StructuralCollapseSimulator';
import { 
  Building2, 
  MousePointer, 
  Grid, 
  Ruler, 
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Droplets,
  CheckCircle2,
  X,
  Undo2,
  Redo2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Move,
  Eye,
  EyeOff,
  ArrowDown,
  Compass,
  Box
} from 'lucide-react';

interface DiseñadorViewProps {
  onOpenCarpinteria?: () => void;
  onToggleMenu?: () => void;
  onGoBack?: () => void;
  currentSettings?: any;
}

export const DiseñadorView: React.FC<DiseñadorViewProps> = ({ 
  onOpenCarpinteria,
  onToggleMenu,
  onGoBack,
  currentSettings
}) => {
  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('diseño');

  // New Workflow-Based Stage
  const [currentStage, setCurrentStage] = useState<StructuralStage>('geometria');

  // Project Info
  const [projectName, setProjectName] = useState<string>('Techo Metálico Estructural');

  // Modal [ NUEVO DISEÑO ] state
  const [showNewDesignModal, setShowNewDesignModal] = useState<boolean>(false);
  const [newDesignChoice, setNewDesignChoice] = useState<'options' | 'dimensions'>('options');

  // Form state for Dimension Survey (Modo Levantamiento)
  const [surveyDim, setSurveyDim] = useState({
    frente: 12.00,
    fondoDer: 8.00,
    posterior: 12.00,
    fondoIzq: 8.00,
    hAlto: 3.80,
    hBajo: 3.00,
    caida: 'calle' as DireccionCaida,
    nombre: 'Sector Principal'
  });

  // Active sector in selection
  const [activeSectorId, setActiveSectorId] = useState<string>('sec-1');

  // 1. GEOMETRÍA PARAMÉTRICA COMPLETA CON MULTI-SECTORES Y VACÍOS
  const [geometria, setGeometria] = useState<StructuralGeometry>({
    largo: 12.00,
    ancho: 8.00,
    altura: 3.20,
    pendiente: 15.0,
    separacionPorticos: 4.00,
    tipoTecho: 'una_caida',
    direccionCaida: 'calle',
    projectMode: 'diseño_libre',
    creationMethod: 'plantilla',
    // Initial Sector (12 x 8m)
    sectores: [
      {
        id: 'sec-1',
        nombre: 'Sector Principal (Cochera/Patio)',
        vertices: [
          { x: 0, y: 0, z: 3.00 },
          { x: 12, y: 0, z: 3.00 },
          { x: 12, y: 8, z: 3.80 },
          { x: 0, y: 8, z: 3.80 }
        ],
        alturaLadoBajo: 3.00,
        alturaLadoAlto: 3.80,
        pendientePct: 10.0,
        direccionCaida: 'calle',
        color: '#2563eb',
        materialCobertura: 'Aluzinc TR4',
        canaletaBordes: [0] // Borde frontal hacia la calle
      }
    ],
    vacios: [],
    sistemaCobertura: 'aluzinc',
    aluzinc: {
      tipo: 'Aluzinc TR4',
      calibre: '0.35 mm',
      color: 'Azul'
    },
    panelTermoacustico: {
      tipo: 'Panel Sandwich TR4',
      aislamiento: 'EPS',
      espesorAislamientoMm: 50,
      calibreExterior: '0.40 mm',
      calibreInterior: '0.35 mm',
      color: 'Blanco / Azul'
    },
    evacuacion: {
      tieneCanaleta: true,
      tipoCanaleta: 'aluzinc_desarrollo_330',
      posicionCanaleta: 'lado_bajo',
      bajantesDiametroPulg: '4',
      cantBajantes: 2
    },
    flechaArco: 1.20
  });

  // 2. ESTRUCTURA
  const [estructura, setEstructura] = useState<StructureOptions>({
    columnas: true,
    vigasPrincipales: true,
    tijerales: false,
    correas: true,
    arriostres: true,
    separacionCorreas: 1.00,
    tipoTijeral: 'dos_aguas',
    patronTijeral: 'warren'
  });

  // 3. COBERTURA LEGACY SUPPORT
  const [cobertura, setCobertura] = useState<CoberturaOptions>({
    tipo: 'Aluzinc TR4',
    calibre: '0.35 mm',
    orientacion: 'Vertical',
    color: 'Azul'
  });

  // 4. CONEXIONES
  const [conexiones, setConexiones] = useState<ConexionesOptions>({
    placasBase: true,
    espesorPlacaMm: 12,
    pernosAnclaje: true,
    diametroPernoPulg: '5/8',
    soldadura: true,
    tipoElectrodo: 'E7018'
  });

  // Structural Elements (Nodes, Beams, Purlins)
  const [columnas, setColumnas] = useState<ColumnElement[]>([]);
  const [vigas, setVigas] = useState<BeamElement[]>([]);
  const [correas, setCorreas] = useState<PurlinElement[]>([]);

  // Selected item for Properties Panel
  const [selectedItem, setSelectedItem] = useState<{
    type: 'column' | 'beam' | 'purlin' | 'sector' | 'edge' | 'vertex' | 'void';
    item: any;
  } | null>(null);

  // Floating Parameter Panels (Sectores, Geometría, Elementos, Propiedades)
  const [showFloatingPanels, setShowFloatingPanels] = useState<boolean>(false);
  const [floatingTab, setFloatingTab] = useState<FloatingTab>('geometria');

  // Auto-open floating properties panel whenever user selects any item
  useEffect(() => {
    if (selectedItem) {
      setShowFloatingPanels(true);
      setFloatingTab('propiedades');
    }
  }, [selectedItem]);

  // 2D CAD Navigation & Tools
  const [viewMode2D, setViewMode2D] = useState<ViewMode2D>('planta');
  const [activeCADTool, setActiveCADTool] = useState<CADTool>('select');
  const [showCotas, setShowCotas] = useState<boolean>(true);
  const [showDeletePlanModal, setShowDeletePlanModal] = useState<boolean>(false);
  const [showTranslucentModal, setShowTranslucentModal] = useState<boolean>(false);
  const [showCollapseSimulator, setShowCollapseSimulator] = useState<boolean>(false);
  const [showMoreTools, setShowMoreTools] = useState<boolean>(false);
  const [moreToolsAlignRight, setMoreToolsAlignRight] = useState<boolean>(false);
  const moreToolsRef = React.useRef<HTMLDivElement>(null);

  const handleToggleMoreTools = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMoreTools && moreToolsRef.current) {
      const rect = moreToolsRef.current.getBoundingClientRect();
      const hasRoomOnRight = (window.innerWidth - rect.left) >= 260;
      const hasRoomOnLeft = rect.right >= 260;
      setMoreToolsAlignRight(!hasRoomOnRight && hasRoomOnLeft);
    }
    setShowMoreTools(prev => !prev);
  };
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Immersive CAD sidebars & presentation states
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  // Responsive state for mobile/tablet screen sizes
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showBasicTrussModal, setShowBasicTrussModal] = useState<boolean>(false);
  const [showTrussSelector, setShowTrussSelector] = useState<boolean>(false);
  const [dimensionModal, setDimensionModal] = useState<{ dimension: 'largo' | 'ancho'; value: number } | null>(null);

  // Draggable Floating CAD Toolbar state for desktop & workspace
  const [floatingCadPos, setFloatingCadPos] = useState<{ x: number; y: number }>({ x: 16, y: 12 });
  const [isDraggingCadToolbar, setIsDraggingCadToolbar] = useState<boolean>(false);
  const [isCadToolbarMinimized, setIsCadToolbarMinimized] = useState<boolean>(false);
  const dragCadRef = React.useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handlePointerDownCadDrag = (e: React.PointerEvent) => {
    // Only trigger drag on handle or toolbar background, avoid buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;

    e.stopPropagation();
    setIsDraggingCadToolbar(true);
    dragCadRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: floatingCadPos.x,
      initialY: floatingCadPos.y
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMoveCadDrag = (e: React.PointerEvent) => {
    if (!isDraggingCadToolbar || !dragCadRef.current) return;
    const dx = e.clientX - dragCadRef.current.startX;
    const dy = e.clientY - dragCadRef.current.startY;
    setFloatingCadPos({
      x: Math.max(8, Math.min(window.innerWidth - 120, dragCadRef.current.initialX + dx)),
      y: Math.max(8, Math.min(window.innerHeight - 80, dragCadRef.current.initialY + dy))
    });
  };

  const handlePointerUpCadDrag = (e: React.PointerEvent) => {
    if (isDraggingCadToolbar) {
      setIsDraggingCadToolbar(false);
      dragCadRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save work automatically to safeStorage
  useEffect(() => {
    try {
      const dataToSave = {
        geometria,
        columnas,
        vigas,
        correas,
        estructura,
        cobertura,
        conexiones,
        projectName
      };
      safeStorage.setItem('innova_techos_metalicos_work', dataToSave);
    } catch (e) {
      console.warn('Could not save work to storage:', e);
    }
  }, [geometria, columnas, vigas, correas, estructura, cobertura, conexiones, projectName]);

  // Restore work on mount if available, or generate initial if first time
  const hasRestoredRef = React.useRef<boolean>(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const saved = safeStorage.getItem<any>('innova_techos_metalicos_work', null);
      if (saved) {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        if (parsed.geometria) setGeometria(parsed.geometria);
        if (parsed.columnas && parsed.columnas.length > 0) setColumnas(parsed.columnas);
        if (parsed.vigas) setVigas(parsed.vigas);
        if (parsed.correas) setCorreas(parsed.correas);
        if (parsed.estructura) setEstructura(parsed.estructura);
        if (parsed.cobertura) setCobertura(parsed.cobertura);
        if (parsed.conexiones) setConexiones(parsed.conexiones);
        if (parsed.projectName) setProjectName(parsed.projectName);

        if (parsed.columnas && parsed.columnas.length > 0) {
          pushHistory(parsed.geometria || geometria, parsed.columnas, parsed.vigas || [], parsed.correas || []);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not restore work from storage:', e);
    }

    // Default first-time generation only if no saved structure existed
    const generated = generateParametricStructure(geometria, estructura, cobertura, conexiones);
    setColumnas(generated.columnas);
    setVigas(generated.vigas);
    setCorreas(generated.correas);
    pushHistory(geometria, generated.columnas, generated.vigas, generated.correas);
  }, []);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<Array<{
    geometria: StructuralGeometry;
    columnas: ColumnElement[];
    vigas: BeamElement[];
    correas: PurlinElement[];
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const historyIndexRef = React.useRef<number>(-1);

  const pushHistory = (geo: StructuralGeometry, cols: ColumnElement[], vgs: BeamElement[], crs: PurlinElement[]) => {
    const snap = {
      geometria: JSON.parse(JSON.stringify(geo)),
      columnas: JSON.parse(JSON.stringify(cols)),
      vigas: JSON.parse(JSON.stringify(vgs)),
      correas: JSON.parse(JSON.stringify(crs))
    };

    setHistory(prev => {
      const curIdx = historyIndexRef.current;
      const trimmed = curIdx >= 0 ? prev.slice(0, curIdx + 1) : [];
      const updated = [...trimmed, snap].slice(-30);
      const newIdx = updated.length - 1;
      historyIndexRef.current = newIdx;
      setHistoryIndex(newIdx);
      return updated;
    });
  };

  const handleUndo = () => {
    const curIdx = historyIndexRef.current;
    if (curIdx > 0 && history[curIdx - 1]) {
      const nextIdx = curIdx - 1;
      const snap = history[nextIdx];
      setGeometria(JSON.parse(JSON.stringify(snap.geometria)));
      setColumnas(JSON.parse(JSON.stringify(snap.columnas)));
      setVigas(JSON.parse(JSON.stringify(snap.vigas)));
      setCorreas(JSON.parse(JSON.stringify(snap.correas)));
      historyIndexRef.current = nextIdx;
      setHistoryIndex(nextIdx);
      setGenerationNotice('↩ Deshacer aplicado');
      setTimeout(() => setGenerationNotice(null), 2000);
    }
  };

  const handleRedo = () => {
    const curIdx = historyIndexRef.current;
    if (curIdx < history.length - 1 && history[curIdx + 1]) {
      const nextIdx = curIdx + 1;
      const snap = history[nextIdx];
      setGeometria(JSON.parse(JSON.stringify(snap.geometria)));
      setColumnas(JSON.parse(JSON.stringify(snap.columnas)));
      setVigas(JSON.parse(JSON.stringify(snap.vigas)));
      setCorreas(JSON.parse(JSON.stringify(snap.correas)));
      historyIndexRef.current = nextIdx;
      setHistoryIndex(nextIdx);
      setGenerationNotice('↪ Rehacer aplicado');
      setTimeout(() => setGenerationNotice(null), 2000);
    }
  };

  // [ GENERAR ESTRUCTURA ] Trigger (preserves custom columns)
  const handleGenerarEstructura = () => {
    // Explicitly ask for truss pattern if trusses are enabled and we are generating automatically
    if (estructura.tijerales) {
      setShowTrussSelector(true);
      return;
    }
    
    executeStructuralGeneration();
  };

  const executeStructuralGeneration = () => {
    const generated = generateParametricStructure(geometria, estructura, cobertura, conexiones, columnas, vigas, correas);
    setColumnas(generated.columnas);
    setVigas(generated.vigas);
    setCorreas(generated.correas);
    pushHistory(geometria, generated.columnas, generated.vigas, generated.correas);

    setGenerationNotice('¡Estructura paramétrica generada exitosamente!');
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  // [ TECHO BÁSICO CON TIJERAL ] Quick Generator Handler
  const handleGenerateBasicTrussRoof = (config: BasicTrussRoofConfig) => {
    const { largo, ancho, alturaColumna, peralteTijeral, pendientePct, separacionTijerales, tipoTecho, patronTijeral } = config;

    let altBajo = alturaColumna;
    let altAlto = alturaColumna + (ancho * (pendientePct / 100));
    if (tipoTecho === 'dos_aguas') {
      altAlto = alturaColumna + ((ancho / 2) * (pendientePct / 100));
    }

    const newSectores: RoofSector[] = [];
    if (tipoTecho === 'dos_aguas') {
      newSectores.push({
        id: `sec-truss-left-${Date.now()}`,
        nombre: 'Agua Izquierda',
        tipoTecho: 'dos_aguas',
        color: '#3b82f6',
        vertices: [
          { x: 0, y: 0, z: altBajo },
          { x: largo, y: 0, z: altBajo },
          { x: largo, y: ancho / 2, z: altAlto },
          { x: 0, y: ancho / 2, z: altAlto }
        ],
        pendientePct,
        alturaLadoBajo: altBajo,
        alturaLadoAlto: altAlto,
        direccionCaida: 'izquierda',
        sistemaCobertura: config.tipoCobertura as any
      });
      newSectores.push({
        id: `sec-truss-right-${Date.now() + 1}`,
        nombre: 'Agua Derecha',
        tipoTecho: 'dos_aguas',
        color: '#60a5fa',
        vertices: [
          { x: 0, y: ancho / 2, z: altAlto },
          { x: largo, y: ancho / 2, z: altAlto },
          { x: largo, y: ancho, z: altBajo },
          { x: 0, y: ancho, z: altBajo }
        ],
        pendientePct,
        alturaLadoBajo: altBajo,
        alturaLadoAlto: altAlto,
        direccionCaida: 'derecha',
        sistemaCobertura: config.tipoCobertura as any
      });
    } else {
      newSectores.push({
        id: `sec-truss-main-${Date.now()}`,
        nombre: 'Sector Principal Tijeral',
        tipoTecho,
        color: '#3b82f6',
        vertices: [
          { x: 0, y: 0, z: altBajo },
          { x: largo, y: 0, z: altAlto },
          { x: largo, y: ancho, z: altAlto },
          { x: 0, y: ancho, z: altBajo }
        ],
        pendientePct,
        alturaLadoBajo: altBajo,
        alturaLadoAlto: altAlto,
        direccionCaida: 'calle',
        sistemaCobertura: config.tipoCobertura as any
      });
    }

    const updatedGeo: StructuralGeometry = {
      ...geometria,
      largo,
      ancho,
      altura: alturaColumna,
      alturaLadoAlto: altAlto,
      alturaLadoBajo: altBajo,
      pendiente: pendientePct,
      separacionPorticos: separacionTijerales,
      tipoTecho,
      flechaArco: peralteTijeral,
      sectores: newSectores,
      vacios: []
    };
    (updatedGeo as any).peralteTijeral = peralteTijeral;

    const updatedEstructura: StructureOptions = {
      ...estructura,
      columnas: config.generarColumnas,
      correas: config.generarCorreas,
      vigasPrincipales: true,
      tijerales: true,
      tipoTijeral: tipoTecho as unknown as TipoTijeral, // Use the roof type for the truss archetype
      patronTijeral: patronTijeral,
      separacionCorreas: 1.00
    };
    (updatedEstructura as any).perfilCuerda = config.perfilCuerda;
    (updatedEstructura as any).perfilWeb = config.perfilWeb;

    const generated = generateParametricStructure(updatedGeo, updatedEstructura, cobertura, conexiones);
    setGeometria(updatedGeo);
    setEstructura(updatedEstructura);
    setColumnas(generated.columnas);
    setVigas(generated.vigas);
    setCorreas(generated.correas);
    pushHistory(updatedGeo, generated.columnas, generated.vigas, generated.correas);

    setGenerationNotice(`✓ Techo con Tijerales (${largo}m × ${ancho}m) generado exitosamente`);
    setTimeout(() => setGenerationNotice(null), 4000);
  };

  // [ APLICAR MEDIDA MODAL ] Handler
  const handleApplyDimensionModal = () => {
    if (!dimensionModal || dimensionModal.value <= 0) return;
    const { dimension, value } = dimensionModal;
    const oldLargo = geometria.largo || 10;
    const oldAncho = geometria.ancho || 6;
    
    const newLargo = dimension === 'largo' ? value : oldLargo;
    const newAncho = dimension === 'ancho' ? value : oldAncho;

    const scaleX = dimension === 'largo' ? value / oldLargo : 1;
    const scaleY = dimension === 'ancho' ? value / oldAncho : 1;

    const newSectores = (geometria.sectores || []).map(sec => ({
      ...sec,
      vertices: sec.vertices.map(v => ({
        ...v,
        x: parseFloat((v.x * scaleX).toFixed(3)),
        y: parseFloat((v.y * scaleY).toFixed(3))
      }))
    }));

    const updatedGeo: StructuralGeometry = {
      ...geometria,
      largo: newLargo,
      ancho: newAncho,
      sectores: newSectores
    };

    const updatedCols = columnas.map(col => ({
      ...col,
      x: parseFloat((col.x * scaleX).toFixed(3)),
      y: parseFloat((col.y * scaleY).toFixed(3))
    }));

    const generated = generateParametricStructure(updatedGeo, estructura, cobertura, conexiones, updatedCols, vigas, correas);
    setGeometria(updatedGeo);
    setColumnas(generated.columnas);
    setVigas(generated.vigas);
    setCorreas(generated.correas);
    pushHistory(updatedGeo, generated.columnas, generated.vigas, generated.correas);
    
    setDimensionModal(null);
    setGenerationNotice(`✓ Medida ${dimension === 'largo' ? 'Largo' : 'Ancho'} guardada: ${value.toFixed(2)}m`);
    setTimeout(() => setGenerationNotice(null), 3500);
  };

  // [ ELIMINAR PLANO ] Handler
  const handleConfirmDeletePlan = () => {
    const emptyGeo: StructuralGeometry = {
      ...geometria,
      largo: 10,
      ancho: 6,
      altura: 3.5,
      alturaLadoAlto: 3.5,
      alturaLadoBajo: 3.0,
      pendiente: 5,
      tipoTecho: 'poligono_libre',
      projectMode: 'diseño_libre',
      creationMethod: 'dibujar_planta',
      sectores: [],
      vacios: []
    };
    setGeometria(emptyGeo);
    setColumnas([]);
    setVigas([]);
    setCorreas([]);
    setSelectedItem(null);
    setActiveCADTool('draw_polygon');
    pushHistory(emptyGeo, [], [], []);
    setShowDeletePlanModal(false);
    setGenerationNotice('🗑️ Plano eliminado. Modo dibujo de planta activo.');
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  // [ TOGGLE / CYCLE DRAINAGE DIRECTION ] Handler
  const handleCycleDrainage = () => {
    const directions: DireccionCaida[] = ['calle', 'izquierda', 'fondo', 'derecha'];
    const current = (geometria.sectores && geometria.sectores.length > 0 && activeSectorId)
      ? geometria.sectores.find(s => s.id === activeSectorId)?.direccionCaida || 'calle'
      : geometria.direccionCaida || 'calle';

    const currentIdx = directions.indexOf(current as DireccionCaida);
    const nextDir = directions[(currentIdx + 1) % directions.length];

    if (geometria.sectores && geometria.sectores.length > 0) {
      setGeometria(prev => {
        const updated = {
          ...prev,
          sectores: (prev.sectores || []).map(s => {
            if (!activeSectorId || s.id === activeSectorId) {
              return { ...s, direccionCaida: nextDir };
            }
            return s;
          })
        };
        const gen = generateParametricStructure(updated, estructura, cobertura, conexiones);
        setColumnas(gen.columnas);
        setVigas(gen.vigas);
        setCorreas(gen.correas);
        return updated;
      });
      const updatedSec = (geometria.sectores || []).find(s => !activeSectorId || s.id === activeSectorId);
      if (updatedSec) {
        setSelectedItem({ type: 'sector', item: { ...updatedSec, direccionCaida: nextDir } });
      }
    } else {
      setGeometria(prev => {
        const updated = { ...prev, direccionCaida: nextDir };
        const gen = generateParametricStructure(updated, estructura, cobertura, conexiones, columnas, vigas, correas);
        setColumnas(gen.columnas);
        setVigas(gen.vigas);
        setCorreas(gen.correas);
        return updated;
      });
      setSelectedItem({
        type: 'sector',
        item: {
          id: 'sector-principal',
          nombre: 'TECHO PRINCIPAL',
          alturaLadoAlto: geometria.alturaLadoAlto || 3.5,
          alturaLadoBajo: geometria.alturaLadoBajo || 3.0,
          pendientePct: geometria.pendiente || 5,
          direccionCaida: nextDir
        }
      });
    }

    setGenerationNotice(`💧 Dirección de caída cambiada a: ${nextDir.toUpperCase()}`);
    setTimeout(() => setGenerationNotice(null), 2500);
  };

  // -------------------------------------------------------------
  // CAD POLYGON & SECTOR CREATION HANDLERS
  // -------------------------------------------------------------

  // Called when user finishes drawing a polygon in CAD
  const handleCompletePolygon = (vertices: Point2D[], isVoid: boolean) => {
    if (vertices.length < 3) return;

    if (isVoid) {
      const newVoid: RoofVoid = {
        id: `void-${Date.now()}`,
        nombre: `Patio / Vacío ${((geometria.vacios || []).length + 1)}`,
        vertices: vertices
      };
      setGeometria(prev => {
        const updated = {
          ...prev,
          vacios: [...(prev.vacios || []), newVoid]
        };
        const gen = generateParametricStructure(updated, estructura, cobertura, conexiones, columnas, vigas, correas);
        setColumnas(gen.columnas);
        setVigas(gen.vigas);
        setCorreas(gen.correas);
        return updated;
      });
      setActiveCADTool('select');
      setGenerationNotice(`✓ Vacío agregado (${calcPolygonArea(vertices).toFixed(1)} m²)`);
      setTimeout(() => setGenerationNotice(null), 3000);
      return;
    }

    // New Sector
    const secCount = (geometria.sectores || []).length + 1;
    const isTranslucentDrawing = activeCADTool === 'draw_translucent';
    const refSector = (geometria.sectores && geometria.sectores.length > 0) ? geometria.sectores[0] : null;

    const baseHAlto = refSector ? refSector.alturaLadoAlto : ((geometria.altura || 3.5) + 0.30);
    const baseHBajo = refSector ? refSector.alturaLadoBajo : (geometria.altura || 3.5);
    const baseSlope = refSector ? refSector.pendientePct : (geometria.pendiente || 10.0);
    const baseDir = refSector ? refSector.direccionCaida : (geometria.direccionCaida === 'fondo' ? 'interior' : 'calle');

    const colors = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2'];
    const chosenColor = isTranslucentDrawing ? '#10b981' : colors[(secCount - 1) % colors.length];

    const newSector: RoofSector = {
      id: `sec-${Date.now()}`,
      nombre: isTranslucentDrawing ? `Translúcido ${secCount}` : `Sector ${secCount}`,
      vertices: vertices.map(v => ({ ...v, z: baseHAlto })),
      alturaLadoBajo: baseHBajo,
      alturaLadoAlto: baseHAlto,
      pendientePct: baseSlope,
      direccionCaida: baseDir,
      acopladoAlTecho: true,
      esTranslucido: isTranslucentDrawing,
      tipoTranslucido: isTranslucentDrawing ? 'policarbonato_alveolar' : undefined,
      colorTranslucido: isTranslucentDrawing ? 'Verde' : undefined,
      color: chosenColor,
      materialCobertura: isTranslucentDrawing ? 'Policarbonato' : (cobertura.tipo || 'Aluzinc TR4'),
      canaletaBordes: [0]
    };

    setGeometria(prev => {
      const newSectores = [...(prev.sectores || []), newSector];
      const allVerts = newSectores.flatMap(s => s.vertices);
      const overallBounds = getPolygonBounds(allVerts);

      const updated = {
        ...prev,
        largo: Math.max(prev.largo, overallBounds.length),
        ancho: Math.max(prev.ancho, overallBounds.width),
        sectores: newSectores
      };
      const gen = generateParametricStructure(updated, estructura, cobertura, conexiones, columnas, vigas, correas);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      return updated;
    });

    setActiveSectorId(newSector.id);
    setActiveCADTool('select');
    setGenerationNotice(`✓ ${newSector.nombre} acoplado correctamente (${calcPolygonArea(vertices).toFixed(1)} m²)`);
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  // Add a sector directly (e.g. from Translucent modal)
  const handleAddSector = (newSector: RoofSector) => {
    setGeometria(prev => {
      const newSectores = [...(prev.sectores || []), newSector];
      const allVerts = newSectores.flatMap(s => s.vertices);
      const overallBounds = getPolygonBounds(allVerts);

      const updated = {
        ...prev,
        largo: Math.max(prev.largo, overallBounds.length),
        ancho: Math.max(prev.ancho, overallBounds.width),
        sectores: newSectores
      };
      const gen = generateParametricStructure(updated, estructura, cobertura, conexiones, columnas, vigas, correas);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      return updated;
    });

    setActiveSectorId(newSector.id);
    setActiveCADTool('select');
    setGenerationNotice(`✓ ${newSector.nombre} agregado`);
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  // Update a sector directly from modal
  const handleUpdateSectorFromModal = (sectorId: string, updates: Partial<RoofSector>) => {
    setGeometria(prev => {
      const updatedSectores = (prev.sectores || []).map(sec => {
        if (sec.id !== sectorId) return sec;
        return { ...sec, ...updates };
      });
      const updated = { ...prev, sectores: updatedSectores };
      const gen = generateParametricStructure(updated, estructura, cobertura, conexiones, columnas, vigas, correas);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      return updated;
    });
    setGenerationNotice(`✓ Sector actualizado`);
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  // Update specific edge length
  const handleUpdateEdgeLength = (sectorId: string, edgeIndex: number, newLengthM: number) => {
    setGeometria(prev => {
      const sectores = (prev.sectores || []).map(sec => {
        if (sec.id !== sectorId) return sec;
        const pts = [...sec.vertices];
        const p1 = pts[edgeIndex];
        const nextIdx = (edgeIndex + 1) % pts.length;
        const p2 = pts[nextIdx];

        const currLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (currLen === 0) return sec;

        const ratio = newLengthM / currLen;
        const dx = (p2.x - p1.x) * ratio;
        const dy = (p2.y - p1.y) * ratio;

        pts[nextIdx] = { ...p2, x: p1.x + dx, y: p1.y + dy };
        return { ...sec, vertices: pts };
      });

      const updated = { ...prev, sectores };
      const gen = generateParametricStructure(updated, estructura, cobertura, conexiones, columnas, vigas, correas);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      return updated;
    });
  };

  // Toggle Gutter on Edge
  const handleToggleEdgeGutter = (sectorId: string, edgeIndex: number) => {
    setGeometria(prev => {
      const sectores = (prev.sectores || []).map(sec => {
        if (sec.id !== sectorId) return sec;
        const gutters = [...(sec.canaletaBordes || [])];
        const idx = gutters.indexOf(edgeIndex);
        if (idx >= 0) {
          gutters.splice(idx, 1);
        } else {
          gutters.push(edgeIndex);
        }
        return { ...sec, canaletaBordes: gutters };
      });
      return { ...prev, sectores };
    });
  };

  // Add Downspout to Edge
  const handleAddDownspout = (_sectorId: string, _edgeIndex: number) => {
    setGeometria(prev => ({
      ...prev,
      evacuacion: {
        ...(prev.evacuacion || { tieneCanaleta: true, bajantesDiametroPulg: '4' }),
        cantBajantes: (prev.evacuacion?.cantBajantes || 2) + 1
      }
    }));
    setGenerationNotice('✓ Bajante adicional agregado a la canaleta');
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  // Update Vertex Height Z
  const handleUpdateVertexZ = (sectorId: string, vertexIndex: number, newZ: number) => {
    setGeometria(prev => {
      const sectores = (prev.sectores || []).map(sec => {
        if (sec.id !== sectorId) return sec;
        const vertices = sec.vertices.map((v, idx) => idx === vertexIndex ? { ...v, z: newZ } : v);
        return { ...sec, vertices };
      });
      const updated = { ...prev, sectores };
      const gen = generateParametricStructure(updated, estructura, cobertura, conexiones, columnas, vigas, correas);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      return updated;
    });
  };

  // Apply Survey Dimensions (Modo Levantamiento en Sitio)
  const handleApplySurveyDimensions = () => {
    const { frente, fondoDer, posterior, fondoIzq, hAlto, hBajo, caida, nombre } = surveyDim;

    // Build 4-corner irregular polygon from field measurements
    const vertices: Point2D[] = [
      { x: 0, y: 0, z: hBajo },
      { x: frente, y: 0, z: hBajo },
      { x: posterior, y: fondoDer, z: hAlto },
      { x: 0, y: fondoIzq, z: hAlto }
    ];

    const newSector: RoofSector = {
      id: `sec-survey-${Date.now()}`,
      nombre: nombre || 'Sector Levantamiento',
      vertices,
      alturaLadoBajo: hBajo,
      alturaLadoAlto: hAlto,
      pendientePct: Math.round(((hAlto - hBajo) / Math.max(fondoDer, fondoIzq)) * 100 * 10) / 10,
      direccionCaida: caida,
      color: '#2563eb',
      materialCobertura: cobertura.tipo || 'Aluzinc TR4',
      canaletaBordes: [0]
    };

    setGeometria(prev => {
      const updated = {
        ...prev,
        projectMode: 'levantamiento' as ProjectMode,
        creationMethod: 'dimensiones' as CreationMethod,
        largo: Math.max(frente, posterior),
        ancho: Math.max(fondoDer, fondoIzq),
        sectores: [newSector],
        vacios: []
      };
      const gen = generateParametricStructure(updated, estructura, cobertura, conexiones);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      return updated;
    });

    setActiveSectorId(newSector.id);
    setShowNewDesignModal(false);
    setGenerationNotice('✓ Techo generado con dimensiones reales de campo');
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  // Apply Predefined Template
  const handleSelectTemplate = (templateType: string) => {
    let newSectores: RoofSector[] = [];
    let newVacios: RoofVoid[] = [];
    let newLargo = 12;
    let newAncho = 8;
    let newTipoTecho: TipoTecho = 'una_caida';

    if (templateType === 'rectangular') {
      newLargo = 12;
      newAncho = 8;
      newTipoTecho = 'una_caida';
      newSectores = [
        {
          id: 'sec-rect-1',
          nombre: 'Sector Principal',
          vertices: [
            { x: 0, y: 0, z: 3.00 },
            { x: 12, y: 0, z: 3.00 },
            { x: 12, y: 8, z: 3.80 },
            { x: 0, y: 8, z: 3.80 }
          ],
          alturaLadoBajo: 3.00,
          alturaLadoAlto: 3.80,
          pendientePct: 10.0,
          direccionCaida: 'calle',
          color: '#2563eb',
          canaletaBordes: [0]
        }
      ];
    } else if (templateType === 'forma_l') {
      // Forma en L: 14x10m con corte de 6x4m
      newLargo = 14;
      newAncho = 10;
      newTipoTecho = 'personalizado';
      newSectores = [
        {
          id: 'sec-l-1',
          nombre: 'Ala Principal (8x10m)',
          vertices: [
            { x: 0, y: 0, z: 3.00 },
            { x: 8, y: 0, z: 3.00 },
            { x: 8, y: 10, z: 3.80 },
            { x: 0, y: 10, z: 3.80 }
          ],
          alturaLadoBajo: 3.00,
          alturaLadoAlto: 3.80,
          pendientePct: 8.0,
          direccionCaida: 'calle',
          color: '#2563eb',
          canaletaBordes: [0]
        },
        {
          id: 'sec-l-2',
          nombre: 'Ala Lateral (6x6m)',
          vertices: [
            { x: 8, y: 0, z: 3.00 },
            { x: 14, y: 0, z: 3.00 },
            { x: 14, y: 6, z: 3.60 },
            { x: 8, y: 6, z: 3.60 }
          ],
          alturaLadoBajo: 3.00,
          alturaLadoAlto: 3.60,
          pendientePct: 10.0,
          direccionCaida: 'calle',
          color: '#16a34a',
          canaletaBordes: [0]
        }
      ];
    } else if (templateType === 'forma_u') {
      // Forma en U con patio frontal/interior
      newLargo = 16;
      newAncho = 12;
      newTipoTecho = 'personalizado';
      newSectores = [
        {
          id: 'sec-u-1',
          nombre: 'Pabellón Izquierdo',
          vertices: [
            { x: 0, y: 0, z: 3.00 },
            { x: 5, y: 0, z: 3.00 },
            { x: 5, y: 12, z: 3.80 },
            { x: 0, y: 12, z: 3.80 }
          ],
          alturaLadoBajo: 3.00,
          alturaLadoAlto: 3.80,
          pendientePct: 8.0,
          direccionCaida: 'calle',
          color: '#2563eb',
          canaletaBordes: [0]
        },
        {
          id: 'sec-u-2',
          nombre: 'Pabellón Central Posterior',
          vertices: [
            { x: 5, y: 6, z: 3.30 },
            { x: 11, y: 6, z: 3.30 },
            { x: 11, y: 12, z: 3.80 },
            { x: 5, y: 12, z: 3.80 }
          ],
          alturaLadoBajo: 3.30,
          alturaLadoAlto: 3.80,
          pendientePct: 8.3,
          direccionCaida: 'interior',
          color: '#d97706',
          canaletaBordes: [0]
        },
        {
          id: 'sec-u-3',
          nombre: 'Pabellón Derecho',
          vertices: [
            { x: 11, y: 0, z: 3.00 },
            { x: 16, y: 0, z: 3.00 },
            { x: 16, y: 12, z: 3.80 },
            { x: 11, y: 12, z: 3.80 }
          ],
          alturaLadoBajo: 3.00,
          alturaLadoAlto: 3.80,
          pendientePct: 8.0,
          direccionCaida: 'calle',
          color: '#9333ea',
          canaletaBordes: [0]
        }
      ];
    } else if (templateType === 'patio_central') {
      // Rectangular con patio interior abierto (vacío)
      newLargo = 15;
      newAncho = 10;
      newTipoTecho = 'una_caida';
      newSectores = [
        {
          id: 'sec-patio-ext',
          nombre: 'Cubierta General',
          vertices: [
            { x: 0, y: 0, z: 3.10 },
            { x: 15, y: 0, z: 3.10 },
            { x: 15, y: 10, z: 3.90 },
            { x: 0, y: 10, z: 3.90 }
          ],
          alturaLadoBajo: 3.10,
          alturaLadoAlto: 3.90,
          pendientePct: 8.0,
          direccionCaida: 'calle',
          color: '#2563eb',
          canaletaBordes: [0]
        }
      ];
      newVacios = [
        {
          id: 'void-patio-1',
          nombre: 'Patio Interior / Tragaluz',
          vertices: [
            { x: 5.5, y: 3.5 },
            { x: 9.5, y: 3.5 },
            { x: 9.5, y: 6.5 },
            { x: 5.5, y: 6.5 }
          ]
        }
      ];
    } else if (templateType === 'dos_aguas') {
      newLargo = 16;
      newAncho = 12;
      newTipoTecho = 'dos_aguas';
      newSectores = [
        {
          id: 'sec-da-1',
          nombre: 'Ala Izquierda (Caída Lateral)',
          vertices: [
            { x: 0, y: 0, z: 3.00 },
            { x: 16, y: 0, z: 3.00 },
            { x: 16, y: 6, z: 4.20 },
            { x: 0, y: 6, z: 4.20 }
          ],
          alturaLadoBajo: 3.00,
          alturaLadoAlto: 4.20,
          pendientePct: 20.0,
          direccionCaida: 'izquierda',
          color: '#2563eb',
          canaletaBordes: [0]
        },
        {
          id: 'sec-da-2',
          nombre: 'Ala Derecha (Caída Lateral)',
          vertices: [
            { x: 0, y: 6, z: 4.20 },
            { x: 16, y: 6, z: 4.20 },
            { x: 16, y: 12, z: 3.00 },
            { x: 0, y: 12, z: 3.00 }
          ],
          alturaLadoBajo: 3.00,
          alturaLadoAlto: 4.20,
          pendientePct: 20.0,
          direccionCaida: 'derecha',
          color: '#0284c7',
          canaletaBordes: [2]
        }
      ];
    } else if (templateType === 'adosado') {
      // Techo adosado a pared existente
      newLargo = 10;
      newAncho = 6;
      newTipoTecho = 'una_caida';
      newSectores = [
        {
          id: 'sec-adosado-1',
          nombre: 'Techo Adosado a Muro',
          vertices: [
            { x: 0, y: 0, z: 3.10 },
            { x: 10, y: 0, z: 3.10 },
            { x: 10, y: 6, z: 4.20 },
            { x: 0, y: 6, z: 4.20 }
          ],
          alturaLadoBajo: 3.10,
          alturaLadoAlto: 4.20,
          pendientePct: 18.3,
          direccionCaida: 'calle',
          color: '#0891b2',
          canaletaBordes: [0]
        }
      ];
    }

    setGeometria(prev => {
      const updated = {
        ...prev,
        largo: newLargo,
        ancho: newAncho,
        tipoTecho: newTipoTecho,
        creationMethod: 'plantilla' as CreationMethod,
        sectores: newSectores,
        vacios: newVacios
      };
      const gen = generateParametricStructure(updated, estructura, cobertura, conexiones);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      return updated;
    });

    if (newSectores.length > 0) {
      setActiveSectorId(newSectores[0].id);
    }
    setShowNewDesignModal(false);
    setGenerationNotice('✓ Plantilla cargada y estructura generada');
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  // Add Interactive Column
  const handleAddColumn = (newCol: ColumnElement) => {
    setColumnas(prev => [...prev, newCol]);
  };

  // Add Interactive Beam
  const handleAddBeam = (newBeam: BeamElement) => {
    setVigas(prev => [...prev, newBeam]);
  };

  // Add Interactive Purlin
  const handleAddPurlin = (newPurlin: PurlinElement) => {
    setCorreas(prev => [...prev, newPurlin]);
  };

  // Update Column Position (Dragging)
  const handleUpdateColumnPos = (id: string, x: number, y: number) => {
    setColumnas(prev => prev.map(col => col.id === id ? { ...col, x, y } : col));
  };

  // Update Column Properties (Base plate, anchor bolts, etc.)
  const handleUpdateColumnProps = (id: string, props: Partial<ColumnElement>) => {
    setColumnas(prev => {
      const updated = prev.map(col => col.id === id ? { ...col, ...props } : col);
      pushHistory(geometria, updated, vigas, correas);
      return updated;
    });
  };

  // Update Element from Properties Panel
  const handleUpdateItem = (
    updated: any, 
    type: string
  ) => {
    if (type === 'column') {
      const updatedCol: ColumnElement = { ...(updated as ColumnElement), isCustom: true };
      setColumnas(prev => {
        const updatedCols = prev.map(c => c.id === updated.id ? updatedCol : c);
        // Also update connected beams Z coordinate
        setVigas(prevVigas => {
          const newVigas = prevVigas.map(b => {
            let mod = false;
            let start = { ...b.startNode };
            let end = { ...b.endNode };
            if (b.startColId === updated.id || Math.hypot(start.x - updatedCol.x, start.y - updatedCol.y) < 0.25) {
              start.z = updatedCol.altura;
              mod = true;
            }
            if (b.endColId === updated.id || Math.hypot(end.x - updatedCol.x, end.y - updatedCol.y) < 0.25) {
              end.z = updatedCol.altura;
              mod = true;
            }
            return mod ? { ...b, startNode: start, endNode: end } : b;
          });
          pushHistory(geometria, updatedCols, newVigas, correas);
          return newVigas;
        });
        return updatedCols;
      });
    } else if (type === 'beam' || type === 'truss' || type === 'brace') {
      setVigas(prev => {
        const updatedVigas = prev.map(b => b.id === updated.id ? (updated as BeamElement) : b);
        pushHistory(geometria, columnas, updatedVigas, correas);
        return updatedVigas;
      });
    } else if (type === 'purlin') {
      setCorreas(prev => {
        const updatedCorreas = prev.map(p => p.id === updated.id ? (updated as PurlinElement) : p);
        pushHistory(geometria, columnas, vigas, updatedCorreas);
        return updatedCorreas;
      });
    } else if (type === 'sector') {
      setGeometria(prev => {
        let updatedSectores = prev.sectores || [];
        if (updatedSectores.some(s => s.id === updated.id)) {
          updatedSectores = updatedSectores.map(s => s.id === updated.id ? { ...s, ...updated } : s);
        }
        const updatedGeo = {
          ...prev,
          direccionCaida: updated.direccionCaida || prev.direccionCaida,
          pendiente: updated.pendientePct !== undefined ? updated.pendientePct : prev.pendiente,
          alturaLadoAlto: updated.alturaLadoAlto !== undefined ? updated.alturaLadoAlto : prev.alturaLadoAlto,
          alturaLadoBajo: updated.alturaLadoBajo !== undefined ? updated.alturaLadoBajo : prev.alturaLadoBajo,
          sectores: updatedSectores.length > 0 ? updatedSectores : prev.sectores
        };
        const gen = generateParametricStructure(updatedGeo, estructura, cobertura, conexiones, columnas, vigas, correas);
        setColumnas(gen.columnas);
        setVigas(gen.vigas);
        setCorreas(gen.correas);
        pushHistory(updatedGeo, gen.columnas, gen.vigas, gen.correas);
        return updatedGeo;
      });
    }
    setSelectedItem({ type: type as any, item: updated });
  };

  const handleUpdateGeometriaAndRegenerate = (newGeo: StructuralGeometry | ((prev: StructuralGeometry) => StructuralGeometry)) => {
    setGeometria(prev => {
      const updatedGeo = typeof newGeo === 'function' ? newGeo(prev) : newGeo;
      const gen = generateParametricStructure(updatedGeo, estructura, cobertura, conexiones, columnas, vigas, correas);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      pushHistory(updatedGeo, gen.columnas, gen.vigas, gen.correas);
      return updatedGeo;
    });
  };

  // Delete Element or Sector or Void
  const handleDeleteItem = (id: string, type: any) => {
    if (type === 'column') {
      setColumnas(prev => prev.filter(c => c.id !== id));
      setVigas(prev => prev.filter(b => b.startColId !== id && b.endColId !== id));
    } else if (type === 'beam') {
      setVigas(prev => prev.filter(b => b.id !== id));
    } else if (type === 'purlin') {
      setCorreas(prev => prev.filter(p => p.id !== id));
    } else if (type === 'sector') {
      setGeometria(prev => {
        const remaining = (prev.sectores || []).filter(s => s.id !== id);
        const updated = { ...prev, sectores: remaining };
        const gen = generateParametricStructure(updated, estructura, cobertura, conexiones);
        setColumnas(gen.columnas);
        setVigas(gen.vigas);
        setCorreas(gen.correas);
        return updated;
      });
    } else if (type === 'void') {
      setGeometria(prev => {
        const remaining = (prev.vacios || []).filter(v => v.id !== id);
        const updated = { ...prev, vacios: remaining };
        const gen = generateParametricStructure(updated, estructura, cobertura, conexiones);
        setColumnas(gen.columnas);
        setVigas(gen.vigas);
        setCorreas(gen.correas);
        return updated;
      });
    }
    setSelectedItem(null);
  };

  // Duplicate Sector
  const handleDuplicateSector = (secId: string) => {
    const sec = (geometria.sectores || []).find(s => s.id === secId);
    if (!sec) return;

    const bounds = getPolygonBounds(sec.vertices);
    const offsetX = bounds.length + 1.0;

    const newSec: RoofSector = {
      ...sec,
      id: `sec-dup-${Date.now()}`,
      nombre: `${sec.nombre} (Copia)`,
      vertices: sec.vertices.map(v => ({ ...v, x: v.x + offsetX })),
      color: '#0891b2'
    };

    setGeometria(prev => {
      const updated = {
        ...prev,
        sectores: [...(prev.sectores || []), newSec]
      };
      const gen = generateParametricStructure(updated, estructura, cobertura, conexiones);
      setColumnas(gen.columnas);
      setVigas(gen.vigas);
      setCorreas(gen.correas);
      return updated;
    });

    setActiveSectorId(newSec.id);
    setGenerationNotice(`✓ ${newSec.nombre} duplicado`);
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  const handleApplyToAll = (updated: any, type: string) => {
    if (type === 'column') {
      const sampleCol = updated as ColumnElement;
      setColumnas(prev => {
        const updatedCols = prev.map(c => ({
          ...c,
          profileId: sampleCol.profileId,
          material: sampleCol.material,
          altura: sampleCol.altura,
          basePlate: sampleCol.basePlate,
          anchorBoltsCount: sampleCol.anchorBoltsCount,
          isLocked: sampleCol.isLocked
        }));
        pushHistory(geometria, updatedCols, vigas, correas);
        return updatedCols;
      });
      setGenerationNotice('✓ Propiedades aplicadas a todas las columnas');
    } else if (type === 'purlin') {
      const samplePurlin = updated as PurlinElement;
      setCorreas(prev => {
        const updatedCorreas = prev.map(p => ({
          ...p,
          profileId: samplePurlin.profileId,
          material: samplePurlin.material,
          isLocked: samplePurlin.isLocked
        }));
        pushHistory(geometria, columnas, vigas, updatedCorreas);
        return updatedCorreas;
      });
      setGenerationNotice('✓ Propiedades aplicadas a todas las correas');
    }
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  const handleDuplicateItem = (item: any, type: string) => {
    if (type === 'sector') {
      handleDuplicateSector(item.id);
      return;
    }
    if (type === 'column') {
      const newCol: ColumnElement = {
        ...item,
        id: `col-dup-${Date.now()}`,
        tag: `C-${String(columnas.length + 1).padStart(2, '0')}`,
        x: item.x + 1.0,
        y: item.y + 1.0
      };
      setColumnas(prev => {
        const updated = [...prev, newCol];
        pushHistory(geometria, updated, vigas, correas);
        return updated;
      });
      setSelectedItem({ type: 'column', item: newCol });
    } else if (type === 'beam' || type === 'truss' || type === 'brace') {
      const newBeam: BeamElement = {
        ...item,
        id: `beam-dup-${Date.now()}`,
        tag: `${item.tag || 'V'}-DUP`,
        startNode: { x: item.startNode.x, y: item.startNode.y + 1, z: item.startNode.z },
        endNode: { x: item.endNode.x, y: item.endNode.y + 1, z: item.endNode.z }
      };
      setVigas(prev => {
        const updated = [...prev, newBeam];
        pushHistory(geometria, columnas, updated, correas);
        return updated;
      });
      setSelectedItem({ type: type as any, item: newBeam });
    } else if (type === 'purlin') {
      const newPurlin: PurlinElement = {
        ...item,
        id: `purlin-dup-${Date.now()}`,
        tag: `COR-DUP`,
        startNode: { x: item.startNode.x, y: item.startNode.y + 0.5, z: item.startNode.z },
        endNode: { x: item.endNode.x, y: item.endNode.y + 0.5, z: item.endNode.z }
      };
      setCorreas(prev => {
        const updated = [...prev, newPurlin];
        pushHistory(geometria, columnas, vigas, updated);
        return updated;
      });
      setSelectedItem({ type: 'purlin', item: newPurlin });
    }
  };

  const handleApplyRecommendedProfile = (type: 'correas' | 'vigas' | 'columnas' | 'tijerales', profileId: string) => {
    if (type === 'columnas') {
      setColumnas(prev => {
        const updated = prev.map(c => ({ ...c, profileId }));
        pushHistory(geometria, updated, vigas, correas);
        return updated;
      });
      setGenerationNotice(`✓ Perfil ${profileId} aplicado a todas las columnas`);
    } else if (type === 'correas') {
      setCorreas(prev => {
        const updated = prev.map(p => ({ ...p, profileId }));
        pushHistory(geometria, columnas, vigas, updated);
        return updated;
      });
      setGenerationNotice(`✓ Perfil ${profileId} aplicado a todas las correas`);
    } else if (type === 'vigas' || type === 'tijerales') {
      setVigas(prev => {
        const updated = prev.map(v => {
          // If tijerales, only update those that are part of a truss
          if (type === 'tijerales' && !v.tipoTijeral && v.type !== 'tijeral_cuerda' && v.type !== 'tijeral_montante' && v.type !== 'tijeral_diagonal') {
            return v;
          }
          return { ...v, profileId };
        });
        pushHistory(geometria, columnas, updated, correas);
        return updated;
      });
      setGenerationNotice(`✓ Perfil ${profileId} aplicado a ${type === 'vigas' ? 'todas las vigas' : 'todos los tijerales'}`);
    }
    setTimeout(() => setGenerationNotice(null), 3000);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white select-none overflow-hidden font-sans relative z-30">
      {/* 1. WORKFLOW NAVIGATOR */}
      {!isPresentationMode && (
        <StructuralWorkflowBar
          currentStage={currentStage}
          onSelectStage={(stage) => {
            setCurrentStage(stage);
            if (stage === 'metrado') {
              setActiveTab('metrado');
            } else if (stage === '3d') {
              setActiveTab('3d');
            } else if (stage === 'planos') {
              setActiveTab('planos');
            } else if (stage === 'presupuesto') {
              setActiveTab('presupuesto');
            } else {
              setActiveTab('diseño');
            }
          }}
          onOpenNewRoofModal={() => {
            setNewDesignChoice('options');
            setShowNewDesignModal(true);
          }}
          projectName={projectName}
          onOpenCarpinteria={onOpenCarpinteria}
          onUpdateProjectName={setProjectName}
          onToggleMenu={onToggleMenu}
          onGoBack={onGoBack}
        />
      )}

      {/* 2. BODY WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* TAB 1: 📐 DISEÑO */}
        {activeTab === 'diseño' && currentStage !== 'revision' && (
          <div className="flex-1 flex w-full h-full overflow-hidden relative bg-slate-50">

            {/* MAIN 2D/3D CAD CANVAS AREA */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
              {/* CANVAS TOP HEADER: Selector de Vistas y Acciones Globales */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-2 md:px-3 py-1.5 flex flex-col gap-1.5 z-20 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  {/* Selector de Vistas: [ PLANTA ] [ SECCIÓN ] [ ELEVACIÓN ] [ 3D ] */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 md:p-1 rounded-xl border border-slate-200/80">
                    <button
                      onClick={() => setViewMode2D('planta')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode2D === 'planta' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Vista superior en planta"
                    >
                      📐 Planta
                    </button>
                    <button
                      onClick={() => setViewMode2D('seccion')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode2D === 'seccion' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Corte o sección transversal"
                    >
                      ✂️ Sección
                    </button>
                    {!isMobile && (
                      <button
                        onClick={() => setViewMode2D('elevacion_frontal')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          viewMode2D === 'elevacion_frontal' || viewMode2D === 'elevacion' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Elevación estructural"
                      >
                        🏢 Elevación
                      </button>
                    )}
                    <button
                      onClick={() => setViewMode2D('3d')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewMode2D === '3d' ? 'bg-indigo-600 text-white shadow-xs' : 'text-indigo-700 hover:bg-indigo-50'
                      }`}
                      title="Modelo tridimensional interactivo"
                    >
                      🧊 3D
                    </button>
                  </div>

                  {/* Botón Parámetros para móvil */}
                  {isMobile && (
                    <button
                      onClick={() => {
                        setShowFloatingPanels(true);
                        setFloatingTab(selectedItem ? 'propiedades' : 'sectores');
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs flex items-center space-x-1 cursor-pointer"
                      title="Abrir panel de parámetros y propiedades"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Panel</span>
                    </button>
                  )}

                  {/* VISTA AMPLIA / MAXIMIZAR ÁREA CAD */}
                  <button
                    onClick={() => {
                      const newMode = !isPresentationMode;
                      setIsPresentationMode(newMode);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center space-x-1 cursor-pointer transition-all ${
                      isPresentationMode 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                    title="Alternar Vista Amplia de Dibujo (Oculta barras exteriores para mayor comodidad)"
                  >
                    {isPresentationMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{isPresentationMode ? 'Panel Completo' : 'Vista Amplia'}</span>
                  </button>

                  {/* Botones de acción complementaria */}
                  {!isMobile && (
                    <div className="flex items-center space-x-1 ml-auto">
                      <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Deshacer (Ctrl+Z)"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Rehacer (Ctrl+Y)"
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

                      <button
                        onClick={() => setShowCotas(!showCotas)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          showCotas ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                        title="Mostrar u ocultar cotas automáticas"
                      >
                        Cotas {showCotas ? '✓' : ''}
                      </button>

                      <button
                        onClick={() => {
                          setShowFloatingPanels(!showFloatingPanels);
                          if (!showFloatingPanels) setFloatingTab('sectores');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                          showFloatingPanels ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200'
                        }`}
                        title="Abrir panel flotante de Parámetros, Sectores y Geometría"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>Parámetros {showFloatingPanels ? '✓' : ''}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('3d')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer ${
                          (activeTab as string) === '3d' ? 'bg-indigo-700 text-white shadow-xs' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                        title="Ver el modelo 3D de la estructura actual diseñada"
                      >
                        <Box className="w-3 h-3" />
                        <span className="hidden md:inline">Vista 3D</span>
                      </button>

                      <button
                        onClick={() => setShowDeletePlanModal(true)}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center space-x-1 transition-all cursor-pointer"
                        title="Eliminar plano actual y limpiar elementos"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span className="hidden sm:inline">Eliminar Plano</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* VIEWPORT CANVAS (Prioridad máxima de espacio en pantalla) */}
              <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-900/5">

                {/* BARRA DE HERRAMIENTAS CAD FLOTANTE Y MÓVIL (DRAGGABLE OVER CANVAS) */}
                {!isPresentationMode && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${floatingCadPos.x}px`,
                      top: `${floatingCadPos.y}px`,
                      zIndex: 45
                    }}
                    className="select-none transition-shadow duration-200 pointer-events-auto"
                  >
                    {isCadToolbarMinimized ? (
                      /* BARRA MINIMIZADA: PILL FLOTANTE MÓVIL */
                      <div 
                        onPointerDown={handlePointerDownCadDrag}
                        onPointerMove={handlePointerMoveCadDrag}
                        onPointerUp={handlePointerUpCadDrag}
                        style={{ touchAction: 'none' }}
                        className="bg-slate-900/90 hover:bg-slate-900 text-white px-2.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md border border-slate-700/80 flex items-center space-x-2 cursor-grab active:cursor-grabbing text-xs"
                        title="Arrastrar para mover panel. Clic en '▾' para expandir."
                      >
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold tracking-wide">🛠️ CAD</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCadToolbarMinimized(false);
                          }}
                          className="p-0.5 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Expandir barra de herramientas CAD"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* BARRA EXPANDIDA: TOOLBAR COMPACTA, DESPLAZABLE Y MÓVIL */
                      <div 
                        className="bg-white/95 backdrop-blur-md shadow-xl rounded-xl border border-slate-200/90 p-1 flex items-center gap-1 max-w-[calc(100vw-24px)] overflow-x-auto touch-pan-x scrollbar-none"
                      >
                        {/* TIRADOR DE ARRASTRE (GRIP HANDLE) */}
                        <div 
                          onPointerDown={handlePointerDownCadDrag}
                          onPointerMove={handlePointerMoveCadDrag}
                          onPointerUp={handlePointerUpCadDrag}
                          style={{ touchAction: 'none' }}
                          className="flex items-center space-x-1 cursor-grab active:cursor-grabbing px-1.5 py-1 hover:bg-slate-100 rounded-lg transition-colors shrink-0 group"
                          title="Mantén presionado y arrastra para mover las herramientas CAD"
                        >
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 hidden sm:inline">CAD</span>
                        </div>

                        <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                        {/* CATEGORÍA 1: NAVEGACIÓN Y SELECCIÓN CAD */}
                        <div className="flex items-center space-x-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 shrink-0">
                          <button
                            onClick={() => setActiveCADTool('select')}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'select' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Seleccionar elemento o mover vértice"
                          >
                            <MousePointer className="w-3 h-3" />
                            <span>Sel</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveCADTool('draw_polygon');
                              if (viewMode2D !== 'planta') setViewMode2D('planta');
                            }}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'draw_polygon' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Hacer clic en el plano para dibujar el polígono de planta"
                          >
                            <span>✏️</span>
                            <span className="hidden sm:inline">Planta</span>
                          </button>

                          <button
                            onClick={handleCycleDrainage}
                            className="px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-0.5 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 cursor-pointer transition-colors"
                            title="Cambiar dirección de caída de agua (↑ / ↓ / ← / →)"
                          >
                            <Droplets className="w-3 h-3 text-sky-600" />
                            <span>{geometria.direccionCaida === 'fondo' ? '↑' : geometria.direccionCaida === 'izquierda' ? '←' : geometria.direccionCaida === 'derecha' ? '→' : '↓'}</span>
                          </button>

                          <button
                            onClick={() => setActiveCADTool('cota')}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'cota' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Medir y acotar distancias"
                          >
                            <Ruler className="w-3 h-3" />
                            <span className="hidden sm:inline">Cota</span>
                          </button>

                          <button
                            onClick={() => setActiveCADTool('pan')}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'pan' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Arrastrar y desplazar vista"
                          >
                            <Move className="w-3 h-3" />
                            <span className="hidden sm:inline">Mover</span>
                          </button>
                        </div>

                        <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                        {/* CATEGORÍA 2: DIBUJO DE ELEMENTOS ESTRUCTURALES */}
                        <div className="flex items-center space-x-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60 shrink-0">
                          <button
                            onClick={() => {
                              setActiveCADTool('column');
                              if (viewMode2D !== 'planta') setViewMode2D('planta');
                            }}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'column' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Clic en planta para colocar columna"
                          >
                            <Building2 className="w-3 h-3" />
                            <span>Col</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveCADTool('beam');
                              if (viewMode2D !== 'planta') setViewMode2D('planta');
                            }}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'beam' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Clic en dos puntos para trazar viga"
                          >
                            <Compass className="w-3 h-3" />
                            <span>Viga</span>
                          </button>

                          <button
                            onClick={() => setActiveCADTool('purlin')}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'purlin' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-900 hover:bg-amber-100'
                            }`}
                            title="Añadir correa metálica de techo"
                          >
                            <Grid className="w-3 h-3" />
                            <span>Correa</span>
                          </button>

                          <button
                            onClick={() => {
                              setShowTrussSelector(true);
                              setActiveCADTool('truss');
                              if (viewMode2D !== 'planta') setViewMode2D('planta');
                            }}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'truss' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-900 hover:bg-emerald-100'
                            }`}
                            title="Trazar tijeral o cercha reticulada entre dos puntos. Al hacer clic podrás elegir el patrón."
                          >
                            <span>📐</span>
                            <span className="hidden sm:inline">Tijeral</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveCADTool('brace');
                              if (viewMode2D !== 'planta') setViewMode2D('planta');
                            }}
                            className={`px-1.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                              activeCADTool === 'brace' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-900 hover:bg-purple-100'
                            }`}
                            title="Trazar arriostre o tensor contra viento"
                          >
                            <span>✕</span>
                            <span className="hidden sm:inline">Arriostre</span>
                          </button>
                        </div>

                        {/* CATEGORÍA 3: COMPLEMENTOS Y ACCIONES [+ MÁS] */}
                        <div className="relative shrink-0" ref={moreToolsRef}>
                          <button
                            onClick={handleToggleMoreTools}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 border transition-all cursor-pointer ${
                              showMoreTools 
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : [
                                    'draw_void', 
                                    'axis', 
                                    'add_gutter', 
                                    'add_downspout', 
                                    'base_plate', 
                                    'bolt', 
                                    'custom_element', 
                                    'delete'
                                  ].includes(activeCADTool)
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                            }`}
                            title="Ver más complementos CAD"
                          >
                            <span>+ Más</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showMoreTools ? 'rotate-180' : ''}`} />
                          </button>

                          {/* DESPLEGABLE DE COMPLEMENTOS */}
                          {showMoreTools && (
                            <>
                              <div 
                                className="absolute inset-0 z-40 cursor-default" 
                                onClick={() => setShowMoreTools(false)} 
                              />
                              <div 
                                className={`absolute ${moreToolsAlignRight ? 'right-0' : 'left-0'} top-full mt-1.5 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                                  Complementos CAD
                                </div>

                                <button
                                  onClick={() => {
                                    setActiveCADTool('draw_void');
                                    setShowMoreTools(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                                    activeCADTool === 'draw_void' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="w-5 text-center">🔲</span>
                                  <span>Vacío / Patio Interior</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setShowTranslucentModal(true);
                                    setShowMoreTools(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4 text-emerald-600" />
                                  <span>Área Translúcida</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveCADTool('add_gutter');
                                    setShowMoreTools(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                                    activeCADTool === 'add_gutter' ? 'bg-cyan-50 text-cyan-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="w-5 text-center">💧</span>
                                  <span>Canaleta Pluvial</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveCADTool('add_downspout');
                                    setShowMoreTools(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                                    activeCADTool === 'add_downspout' ? 'bg-cyan-50 text-cyan-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <ArrowDown className="w-4 h-4 text-cyan-600" />
                                  <span>Bajante de Agua</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveCADTool('base_plate');
                                    setShowMoreTools(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                                    activeCADTool === 'base_plate' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="w-5 text-center">⏹</span>
                                  <span>Placa Base</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveCADTool('bolt');
                                    setShowMoreTools(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                                    activeCADTool === 'bolt' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="w-5 text-center">🔩</span>
                                  <span>Pernos de Anclaje</span>
                                </button>

                                <div className="h-px bg-slate-100 my-1" />

                                <button
                                  onClick={() => {
                                    setActiveCADTool(activeCADTool === 'delete' ? 'select' : 'delete');
                                    setShowMoreTools(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer ${
                                    activeCADTool === 'delete' ? 'bg-rose-500 text-white font-bold' : 'text-rose-600 hover:bg-rose-50'
                                  }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Borrar Elemento</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* BOTÓN PARA MINIMIZAR LA BARRA */}
                        <button
                          onClick={() => setIsCadToolbarMinimized(true)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors ml-auto cursor-pointer shrink-0"
                          title="Minimizar barra flotante"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {viewMode2D === '3d' ? (
                  <div className="w-full h-full p-2 md:p-4 flex flex-col">
                    <div className="flex-1 w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-800">
                      <Structural3DView
                        geometria={geometria}
                        columnas={columnas}
                        vigas={vigas}
                        correas={correas}
                        cobertura={cobertura}
                        selectedId={selectedItem?.item?.id}
                        onSelectElement={(id, type) => {
                          let found: any = null;
                          if (type === 'column') found = columnas.find(c => c.id === id);
                          if (type === 'beam') found = vigas.find(b => b.id === id);
                          if (type === 'purlin') found = correas.find(p => p.id === id);
                          if (found) setSelectedItem({ type, item: found });
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <StructuralCanvas2D
                    viewMode={viewMode2D}
                    activeTool={activeCADTool}
                    geometria={geometria}
                    columnas={columnas}
                    vigas={vigas}
                    correas={correas}
                    evacuacion={geometria.evacuacion}
                    selectedItem={selectedItem}
                    onSelectItem={setSelectedItem}
                    onAddColumn={handleAddColumn}
                    onAddBeam={handleAddBeam}
                    onAddPurlin={handleAddPurlin}
                    onDeleteItem={handleDeleteItem}
                    onUpdateColumnPos={handleUpdateColumnPos}
                    onUpdateColumnProps={handleUpdateColumnProps}
                    showCotas={showCotas}
                    showCorreas={estructura.correas}
                    showArriostres={estructura.arriostres}
                    onCompletePolygon={handleCompletePolygon}
                    onUpdateEdgeLength={handleUpdateEdgeLength}
                    onToggleEdgeGutter={handleToggleEdgeGutter}
                    onAddDownspout={handleAddDownspout}
                    onUpdateVertexZ={handleUpdateVertexZ}
                    activeSectorId={activeSectorId}
                    onSelectSectorId={setActiveSectorId}
                    onEditDimension={(dim) => setDimensionModal({ dimension: dim, value: dim === 'largo' ? (geometria.largo || 10) : (geometria.ancho || 6) })}
                  />
                )}

                {/* FLOATING TOAST NOTIFICATION */}
                {generationNotice && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-slate-700/50 flex items-center space-x-2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{generationNotice}</span>
                  </div>
                )}

                {/* PANELES FLOTANTES (SECTORES, GEOMETRÍA, ELEMENTOS, PROPIEDADES) - SOLO MÓVIL BOTTOM SHEET */}
                {isMobile && (
                  <div className="z-40">
                    <StructuralFloatingPanels
                      isOpen={!!selectedItem || showFloatingPanels}
                      onClose={() => {
                        setSelectedItem(null);
                        setShowFloatingPanels(false);
                      }}
                      currentStage={currentStage}
                      activeTab={floatingTab}
                      onTabChange={setFloatingTab}
                      geometria={geometria}
                      onUpdateGeometria={handleUpdateGeometriaAndRegenerate}
                      estructura={estructura}
                      onUpdateEstructura={setEstructura}
                      cobertura={cobertura}
                      onUpdateCobertura={setCobertura}
                      conexiones={conexiones}
                      onUpdateConexiones={setConexiones}
                      columnas={columnas}
                      vigas={vigas}
                      correas={correas}
                      selectedItem={selectedItem}
                      onSelectItem={setSelectedItem}
                      onUpdateItem={handleUpdateItem}
                      onDeleteItem={handleDeleteItem}
                      onApplyToAll={handleApplyToAll}
                      onDuplicateItem={handleDuplicateItem}
                      onAddSector={() => setActiveCADTool('draw_polygon')}
                      onOpenTranslucentModal={() => setShowTranslucentModal(true)}
                      onGenerarEstructura={handleGenerarEstructura}
                      onOpenCollapseSimulator={() => setShowCollapseSimulator(true)}
                    />
                  </div>
                )}


              </div>
            </main>

            {/* RIGHT SIDEBAR: PROPERTIES / PARAMETERS PANEL - Collapsible & Hideable */}
            {!isMobile && !isPresentationMode && (showFloatingPanels || !!selectedItem) && (
              <div 
                className="w-80 flex flex-col bg-white border-l border-slate-200 relative shrink-0 h-full animate-in slide-in-from-right-4 duration-200 z-20"
              >
                <div className="bg-slate-100 p-2.5 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-700 flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span>PARÁMETROS Y PROPIEDADES</span>
                  </span>
                  <button
                    onClick={() => {
                      setShowFloatingPanels(false);
                      setSelectedItem(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Ocultar panel (Área máxima de visualización)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <StructuralFloatingPanels
                    isOpen={true}
                    onClose={() => {
                      setShowFloatingPanels(false);
                      setSelectedItem(null);
                    }}
                    isDocked={true}
                    currentStage={currentStage}
                    activeTab={floatingTab}
                    onTabChange={setFloatingTab}
                    geometria={geometria}
                    onUpdateGeometria={handleUpdateGeometriaAndRegenerate}
                    estructura={estructura}
                    onUpdateEstructura={setEstructura}
                    cobertura={cobertura}
                    onUpdateCobertura={setCobertura}
                    conexiones={conexiones}
                    onUpdateConexiones={setConexiones}
                    columnas={columnas}
                    vigas={vigas}
                    correas={correas}
                    selectedItem={selectedItem}
                    onSelectItem={setSelectedItem}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    onApplyToAll={handleApplyToAll}
                    onDuplicateItem={handleDuplicateItem}
                    onAddSector={() => setActiveCADTool('draw_polygon')}
                    onOpenTranslucentModal={() => setShowTranslucentModal(true)}
                    onGenerarEstructura={handleGenerarEstructura}
                    onOpenCollapseSimulator={() => setShowCollapseSimulator(true)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1.5: REVISIÓN */}
        {activeTab === 'diseño' && currentStage === 'revision' && (
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <StructuralRevisionView
              geometria={geometria}
              columnas={columnas}
              vigas={vigas}
              correas={correas}
              estructura={estructura}
              cobertura={cobertura}
              onOpenCollapseSimulator={() => setShowCollapseSimulator(true)}
              onGoTo3D={() => {
                setCurrentStage('3d');
                setActiveTab('3d');
                setViewMode2D('3d');
              }}
              onGoToMetrado={() => {
                setCurrentStage('metrado');
                setActiveTab('metrado');
              }}
            />
          </div>
        )}

        {/* TAB 2: 🧮 CÁLCULO */}
        {activeTab === 'calculo' && (
          <div className="w-full h-full overflow-hidden">
            <StructuralCalculations
              geometria={geometria}
              estructura={estructura}
              cobertura={cobertura}
              conexiones={conexiones}
              columnas={columnas}
              vigas={vigas}
              correas={correas}
            />
          </div>
        )}

        {/* TAB 3: 📋 METRADO */}
        {activeTab === 'metrado' && (
          <div className="w-full h-full overflow-hidden">
            <StructuralMetrado
              geometria={geometria}
              estructura={estructura}
              cobertura={cobertura}
              conexiones={conexiones}
              columnas={columnas}
              vigas={vigas}
              correas={correas}
            />
          </div>
        )}

        {/* TAB 4: 💰 PRESUPUESTO */}
        {activeTab === 'presupuesto' && (
          <div className="w-full h-full overflow-hidden">
            <StructuralPresupuesto
              geometria={geometria}
              estructura={estructura}
              cobertura={cobertura}
              conexiones={conexiones}
              columnas={columnas}
              vigas={vigas}
              correas={correas}
              projectName={projectName}
              onGoToProjects={() => setActiveTab('diseño')}
              currentSettings={currentSettings}
            />
          </div>
        )}

        {/* TAB 5: 📄 PLANOS */}
        {activeTab === 'planos' && (
          <div className="w-full h-full overflow-hidden">
            <StructuralPlanos
              geometria={geometria}
              estructura={estructura}
              cobertura={cobertura}
              conexiones={conexiones}
              columnas={columnas}
              vigas={vigas}
              correas={correas}
              projectName={projectName}
            />
          </div>
        )}

        {/* TAB 5: 🧊 3D */}
        {activeTab === '3d' && (
          <div className="w-full h-full p-3 md:p-5 flex flex-col overflow-hidden">
            <div className="flex-1 w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-800">
              <Structural3DView
                geometria={geometria}
                columnas={columnas}
                vigas={vigas}
                correas={correas}
                cobertura={cobertura}
                selectedId={selectedItem?.item?.id}
                onSelectElement={(id, type) => {
                  let found: any = null;
                  if (type === 'column') found = columnas.find(c => c.id === id);
                  if (type === 'beam') found = vigas.find(b => b.id === id);
                  if (type === 'purlin') found = correas.find(p => p.id === id);
                  if (found) setSelectedItem({ type, item: found });
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: [ NUEVO DISEÑO ] (DIBUJAR PLANTA / INGRESAR DIMENSIONES / USAR PLANTILLA) */}
      {/* ============================================================== */}
      {showNewDesignModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl shadow-sm">
                  🏗️
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">NUEVO DISEÑO DE TECHO METÁLICO</h3>
                  <p className="text-xs text-slate-300">
                    Elige cómo deseas comenzar tu proyecto estructural
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewDesignModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {newDesignChoice === 'options' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* OPTION A: DIBUJAR PLANTA */}
                    <div 
                      onClick={() => {
                        setShowNewDesignModal(false);
                        setActiveCADTool('draw_polygon');
                        setViewMode2D('planta');
                        setGenerationNotice('✏️ Haz clic en el plano para definir cada esquina del techo y cierra el polígono');
                        setTimeout(() => setGenerationNotice(null), 6000);
                      }}
                      className="p-5 border-2 border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center text-center group shadow-xs hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center text-2xl mb-3 transition-colors">
                        ✏️
                      </div>
                      <h4 className="font-bold text-slate-800 group-hover:text-blue-700 text-sm mb-1">
                        A) DIBUJAR PLANTA
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Dibuja directamente en el plano haciendo clic punto por punto. Ideal para formas irregulares o polígonos libres.
                      </p>
                    </div>

                    {/* OPTION B: INGRESAR DIMENSIONES */}
                    <div 
                      onClick={() => setNewDesignChoice('dimensions')}
                      className="p-5 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 transition-all cursor-pointer flex flex-col items-center text-center group shadow-xs hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center text-2xl mb-3 transition-colors">
                        📐
                      </div>
                      <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 text-sm mb-1">
                        B) INGRESAR MEDIDAS
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Ingresa los lados reales tomados en campo (frente, fondos, alturas) con cálculo automático de descuadre.
                      </p>
                    </div>

                    {/* OPTION C: USAR PLANTILLA */}
                    <div 
                      onClick={() => handleSelectTemplate('rectangular')}
                      className="p-5 border-2 border-indigo-200 hover:border-indigo-500 rounded-2xl bg-indigo-50/50 hover:bg-indigo-100/60 transition-all cursor-pointer flex flex-col items-center text-center group shadow-xs hover:shadow-md"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center text-2xl mb-3 transition-colors">
                        📋
                      </div>
                      <h4 className="font-bold text-slate-800 group-hover:text-indigo-700 text-sm mb-1">
                        C) USAR PLANTILLA
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Carga una plantilla paramétrica de techo metálico estructurada y edítala en el lienzo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORMULARIO: B) INGRESAR MEDIDAS REALES (MODO LEVANTAMIENTO EN SITIO) */
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center">
                      <span>📐</span>
                      <span className="ml-2">Levantamiento en Sitio: Medidas Reales de Campo</span>
                    </h4>
                    <button
                      onClick={() => setNewDesignChoice('options')}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      ← Volver a opciones
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Lado 1 - Frente (m):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={surveyDim.frente}
                        onFocus={e => e.target.select()}
                        onChange={e => setSurveyDim({ ...surveyDim, frente: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Lado 2 - Fondo Der (m):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={surveyDim.fondoDer}
                        onFocus={e => e.target.select()}
                        onChange={e => setSurveyDim({ ...surveyDim, fondoDer: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Lado 3 - Posterior (m):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={surveyDim.posterior}
                        onFocus={e => e.target.select()}
                        onChange={e => setSurveyDim({ ...surveyDim, posterior: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Lado 4 - Fondo Izq (m):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={surveyDim.fondoIzq}
                        onFocus={e => e.target.select()}
                        onChange={e => setSurveyDim({ ...surveyDim, fondoIzq: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Altura Punto Bajo (m):</label>
                      <input
                        type="number"
                        step="0.05"
                        value={surveyDim.hBajo}
                        onFocus={e => e.target.select()}
                        onChange={e => setSurveyDim({ ...surveyDim, hBajo: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Altura Punto Alto (m):</label>
                      <input
                        type="number"
                        step="0.05"
                        value={surveyDim.hAlto}
                        onFocus={e => e.target.select()}
                        onChange={e => setSurveyDim({ ...surveyDim, hAlto: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Dirección de Caída:</label>
                      <select
                        value={surveyDim.caida}
                        onChange={e => setSurveyDim({ ...surveyDim, caida: e.target.value as DireccionCaida })}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                      >
                        <option value="calle">Hacia el Frente (Calle)</option>
                        <option value="fondo">Hacia el Fondo</option>
                        <option value="izquierda">Hacia la Izquierda</option>
                        <option value="derecha">Hacia la Derecha</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={handleApplySurveyDimensions}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CREAR TECHO CON MEDIDAS DE CAMPO</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR Y ACOPLAR ÁREAS TRANSLÚCIDAS */}
      <TranslucentAreaModal
        isOpen={showTranslucentModal}
        onClose={() => setShowTranslucentModal(false)}
        geometria={geometria}
        cobertura={cobertura}
        onAddSector={handleAddSector}
        onUpdateSector={handleUpdateSectorFromModal}
        onStartDrawingTranslucent={() => {
          setShowTranslucentModal(false);
          setActiveCADTool('draw_translucent');
          if (viewMode2D !== 'planta') setViewMode2D('planta');
          setGenerationNotice('✏️ Dibuja el área translúcida: los puntos se acoplarán magnéticamente al techo');
          setTimeout(() => setGenerationNotice(null), 5000);
        }}
      />

      {/* MODAL: GENERADOR DE TECHO BÁSICO CON TIJERAL */}
      <BasicTrussRoofModal
        isOpen={showBasicTrussModal}
        onClose={() => setShowBasicTrussModal(false)}
        onGenerate={handleGenerateBasicTrussRoof}
        initialDimensions={{
          largo: geometria.largo || 10,
          ancho: geometria.ancho || 6,
          altura: geometria.altura || 3.5,
          tipoTecho: geometria.tipoTecho === 'dos_aguas' ? 'dos_aguas' : 'un_agua'
        }}
      />

      <TrussPatternSelectorModal
        isOpen={showTrussSelector}
        onClose={() => setShowTrussSelector(false)}
        currentPattern={estructura.patronTijeral}
        currentTipo={estructura.tipoTijeral}
        onSelectPattern={(pattern) => {
          setEstructura({ ...estructura, patronTijeral: pattern });
        }}
        onSelectTipo={(tipo) => {
          setEstructura({ ...estructura, tipoTijeral: tipo });
        }}
        onConfirm={executeStructuralGeneration}
      />

      {/* MODAL: EDITAR MEDIDA DEL PLANO (LARGO / ANCHO) */}
      {dimensionModal && (
        <div className="absolute inset-0 z-[80] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
                <Ruler className="w-4 h-4 text-blue-600" />
                <span>Cambiar Medida: {dimensionModal.dimension === 'largo' ? 'Largo Total (L)' : 'Ancho Total (A)'}</span>
              </h3>
              <button 
                onClick={() => setDimensionModal(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">
                Nueva medida en metros (m):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.10"
                  min="1.0"
                  max="100.0"
                  autoFocus
                  value={dimensionModal.value}
                  onChange={(e) => setDimensionModal({ ...dimensionModal, value: parseFloat(e.target.value) || 0 })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyDimensionModal();
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-base text-right focus:bg-white focus:border-blue-600 outline-none"
                />
                <span className="font-bold text-slate-600 text-sm">m</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Esta medida se guardará automáticamente en el proyecto y mantendrá la estructura ajustada.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDimensionModal(null)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyDimensionModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
              >
                Guardar y Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN: ELIMINAR PLANO COMPLETO */}
      {showDeletePlanModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-rose-600 p-4 text-white flex items-center space-x-3">
              <div className="p-2 bg-rose-700/80 rounded-xl">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">¿Eliminar plano completo?</h3>
                <p className="text-xs text-rose-100">Esta acción limpiará todos los elementos estructurales y sectores</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-600">
              <p>
                Al confirmar, se eliminarán todas las <strong>columnas, vigas, correas, tijerales y sectores</strong> actuales.
              </p>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                ✏️ El lienzo quedará completamente en blanco listo para <strong>dibujar una planta libre</strong> con la herramienta de polígono o cargar una nueva plantilla.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeletePlanModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeletePlan}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, Eliminar Plano</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIMULADOR DE RESISTENCIA Y RIESGO DE COLAPSO MODAL */}
      {showCollapseSimulator && (
        <StructuralCollapseSimulator
          geometria={geometria}
          columnas={columnas}
          vigas={vigas}
          correas={correas}
          estructura={estructura}
          cobertura={cobertura}
          onClose={() => setShowCollapseSimulator(false)}
          onApplyRecommendedProfile={handleApplyRecommendedProfile}
        />
      )}
    </div>
  );
};

export default DiseñadorView;
