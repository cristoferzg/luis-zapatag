// Lienzo CAD Vectorial 2D/3D con Soporte Táctil, Panning, Snapping, Acoplamiento, Arrastre de Nodos, Trazo de Arcos y Sumilla de Controles
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Grid, 
  Move, 
  Maximize2, 
  RotateCcw, 
  RotateCw,
  X, 
  Eye, 
  Trash2, 
  GripHorizontal,
  Crosshair,
  MousePointer,
  PenTool,
  Layers,
  Columns,
  Ruler,
  GraduationCap,
  CheckCircle2,
  Spline,
  HelpCircle,
  Sparkles,
  Wrench,
  AlertTriangle,
  Info,
  Sliders,
  Copy,
  Clipboard,
  ChevronDown
} from 'lucide-react';

import { UseTechosCadEngineReturn } from './useTechosCadEngineState';
import { ToolModoCad, RolEstructuralSegmento, VistaTechoCAD, CadSnapResult } from './techosCadEngineTypes';
import { calculateBestCadSnap } from './techosCadSnapping';
import { TechosViewer3D } from './TechosViewer3D';
import { TechosErrorBoundary } from './TechosErrorBoundary';
import { TechosNovatosWizardModal } from './TechosNovatosWizardModal';
import TechosColumnasExactasModal from './TechosColumnasExactasModal';
import { TechosViewModeGuideBanner } from './TechosViewModeGuideBanner';
import useTechosDimensions from './useTechosDimensions';
import { INVENTARIO_PERFILES_TUBULARES, PERFILES_TECHOS_AGRUPADOS } from './techosCadCatalog';
import { 
  getSegmentColorHex, 
  TipoTijeral, 
  CATALOGO_TIJERALES_INFO
} from './techosCadColors';

export type { VistaTechoCAD };

interface TechosCanvas2DProps {
  engineState?: UseTechosCadEngineReturn;
  design?: any;
  onUpdateDesign?: (updated: any) => void;
  onOpenMobileToolbox?: () => void;
  onOpenMobileProperties?: () => void;
  onNuevoTecho?: () => void;
  onOpenTutorial?: () => void;
  onOpenInteractiveTutorial?: () => void;
  activeVista?: VistaTechoCAD;
  onChangeVista?: (v: VistaTechoCAD) => void;
  showInspector?: boolean;
  setShowInspector?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TechosCanvas2D: React.FC<TechosCanvas2DProps> = ({
  engineState,
  onOpenMobileProperties,
  onOpenTutorial,
  onOpenInteractiveTutorial,
  activeVista,
  onChangeVista,
  showInspector,
  setShowInspector
}) => {
  const { isDesktop } = useTechosDimensions();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Configuración de Altura y Nivel para nuevas Columnas y Vigas
  const [colHeightSetting] = useState<number>(4.0);
  const [beamElevationSetting] = useState<number>(4.0);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const updateSize = () => {
      if (el) {
        setCanvasDimensions({
          width: el.clientWidth,
          height: el.clientHeight
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Estados de Vista
  const [vista, setVista] = useState<VistaTechoCAD>(activeVista || 'planta');
  const [vistaAmplia, setVistaAmplia] = useState<boolean>(false);

  useEffect(() => {
    if (activeVista && activeVista !== vista) {
      setVista(activeVista);
    }
  }, [activeVista]);

  const handleSetVista = (v: VistaTechoCAD) => {
    setVista(v);
    if (onChangeVista) onChangeVista(v);
  };

  // Transformaciones de Lienzo (Pan y Zoom)
  const [zoom, setZoom] = useState<number>(1.60);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Panning & Pinch Gesture Refs
  const touchPinchDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1.60);
  const touchPanStartRef = useRef<{ x: number; y: number } | null>(null);

  // Ajustes de Malla / Snapping / Cotas
  const [showGrid] = useState<boolean>(true);
  const [snapGrid] = useState<boolean>(true);
  const [showDimensions] = useState<boolean>(true);

  // Sumilla de Controles (Widget Flotante Desplegable)
  const [showControlsSumilla, setShowControlsSumilla] = useState<boolean>(false);

  // Cota Numérica Exacta Modal
  const [showDimensionModal, setShowDimensionModal] = useState<boolean>(false);
  const [inputLengthMm, setInputLengthMm] = useState<string>('4000');
  const [inputAngleDeg, setInputAngleDeg] = useState<string>('15');

  // Coordenadas del cursor en metros
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ARRASTRE LIBRE DE NODOS
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [hasMovedNode, setHasMovedNode] = useState<boolean>(false);

  // TRAZADO DE ARCOS Y TECHOS CURVOS
  const [arcStartPoint, setArcStartPoint] = useState<{ x: number; y: number; z?: number; nodeId?: string } | null>(null);
  const [arcEndPoint, setArcEndPoint] = useState<{ x: number; y: number; z?: number; nodeId?: string } | null>(null);
  const [arcSagittaM, setArcSagittaM] = useState<number>(2.20);
  const [arcDivisions, setArcDivisions] = useState<number>(8);
  const [arcNotice, setArcNotice] = useState<string | null>(null);

  // Nodo de inicio de trazado continuo (para encadenar / acoplar tramos)
  const [drawingStartNodeId, setDrawingStartNodeId] = useState<string | null>(null);
  // Nodo donde comenzó la cadena de trazado (para detectar cierre de perímetro)
  const [chainFirstNodeId, setChainFirstNodeId] = useState<string | null>(null);
  // Modo de trazo: true = cadena continua (une tramo tras tramo);
  // false = "viga suelta" (cada par de clics crea un tramo independiente).
  const [chainMode, setChainMode] = useState<boolean>(true);

  // Modo Ortogonal (Orto 90°): cuando está activo, mientras dibujas desde un
  // punto de inicio la viga se fuerza a quedar perfectamente horizontal o
  // vertical (ángulo recto exacto). Es el equivalente al "ORTO/F8" de AutoCAD.
  const [orthoMode, setOrthoMode] = useState<boolean>(true);
  // Ángulo en grados del tramo que se está dibujando (para el indicador de 90°).
  const [drawAngleDeg, setDrawAngleDeg] = useState<number | null>(null);

  // Resultado de detección O-Snap activa (Vértices, Medios, Intersecciones, Anclajes, Cierre de Perímetro)
  const [activeSnap, setActiveSnap] = useState<CadSnapResult | null>(null);

  // Notificación de cierre exitoso de perímetro
  const [closedPerimeterNotice, setClosedPerimeterNotice] = useState<string | null>(null);

  // Medición puntual (herramienta 'measure')
  const [measureStartPoint, setMeasureStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [measureDistanceM, setMeasureDistanceM] = useState<number | null>(null);

  // Asistente 1-Clic de Techos para Principiantes
  const [showNovatosWizard, setShowNovatosWizard] = useState<boolean>(false);
  const [showColumnasExactas, setShowColumnasExactas] = useState<boolean>(false);



  // Dropdown de herramienta en la barra superior (estilo Herrería: acceso
  // rápido arriba sin tapar el lienzo con el panel central). El menú se
  // posiciona con `fixed` (medido del botón) para no recortarse dentro de la
  // barra, que tiene overflow-x-auto.
  const [showTopToolDropdown, setShowTopToolDropdown] = useState<boolean>(false);
  const [toolMenuPos, setToolMenuPos] = useState<{ top: number; left: number } | null>(null);
  const topToolBtnRef = useRef<HTMLButtonElement>(null);
  const toggleTopToolDropdown = useCallback(() => {
    setShowTopToolDropdown(prev => {
      const next = !prev;
      if (next && topToolBtnRef.current) {
        const r = topToolBtnRef.current.getBoundingClientRect();
        setToolMenuPos({ top: r.bottom + 4, left: r.left });
      }
      return next;
    });
  }, []);

  // PANEL FLOTANTE Y ARRASTRABLE DE HERRAMIENTAS CAD DETALLADAS
  const [showFloatingToolsPanel, setShowFloatingToolsPanel] = useState<boolean>(true);
  // El panel arranca colapsado en todos los tamaños (estilo Herrería: lienzo
  // limpio y herramientas en el dropdown superior). Se reabre con la llave.
  const [isToolsPanelCollapsed, setIsToolsPanelCollapsed] = useState<boolean>(true);
  const [floatingToolsPanelPos, setFloatingToolsPanelPos] = useState<{ x: number; y: number }>({ x: 20, y: 110 });
  const isDraggingToolsPanelRef = useRef(false);
  const toolsPanelDragOffsetRef = useRef({ x: 0, y: 0 });

  const isRightClickRef = useRef<boolean>(false);
  const rightClickStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleToolsPanelPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle-tools')) return;
    e.stopPropagation();
    isDraggingToolsPanelRef.current = true;
    
    const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const clientXInContainer = e.clientX - rect.left;
    const clientYInContainer = e.clientY - rect.top;
    
    toolsPanelDragOffsetRef.current = {
      x: clientXInContainer - floatingToolsPanelPos.x,
      y: clientYInContainer - floatingToolsPanelPos.y
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleToolsPanelPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingToolsPanelRef.current) return;
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 800, height: 600 };
    const clientXInContainer = e.clientX - rect.left;
    const clientYInContainer = e.clientY - rect.top;
    
    const xInContainer = clientXInContainer - toolsPanelDragOffsetRef.current.x;
    const yInContainer = clientYInContainer - toolsPanelDragOffsetRef.current.y;
    
    const panelWidth = isToolsPanelCollapsed ? 48 : 288;
    const panelHeight = isToolsPanelCollapsed ? 48 : 380;
    
    const newX = Math.max(10, Math.min(rect.width - panelWidth - 10, xInContainer));
    const newY = Math.max(10, Math.min(rect.height - panelHeight - 10, yInContainer));
    setFloatingToolsPanelPos({ x: newX, y: newY });
  };

  const handleToolsPanelPointerUp = (e: React.PointerEvent) => {
    if (isDraggingToolsPanelRef.current) {
      isDraggingToolsPanelRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Sincronizar re-enmarcado y auto-centrado del diseño al cambiar de vista para que no vuele fuera del área visible
  useEffect(() => {
    if (vista === 'planta' || vista === 'seccion') {
      const timer = setTimeout(() => {
        handleFitView();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [vista]);

  // Selector y Tipología de Tijeral Activa (Escalera/Vierendeel, Warren, Pratt, Howe, Fink, Curvo, Plano)
  const [selectedTrussType, setSelectedTrussType] = useState<TipoTijeral>('escalera_vierendeel');
  const [trussHeightSetting, setTrussHeightSetting] = useState<number>(0.50);
  const [trussDivisionsSetting, setTrussDivisionsSetting] = useState<number>(6);
  const [trussSpacingSettingM, setTrussSpacingSettingM] = useState<number>(0.60);
  const [trussSpacingMode, setTrussSpacingMode] = useState<'divisiones' | 'espaciado'>('divisiones');

  const nodes = engineState?.nodes || {};
  const segments = engineState?.segments || {};
  const selectedElementIds = engineState?.selectedElementIds || [];
  const activeTool: ToolModoCad = engineState?.activeTool || 'select';

  // Herramientas que dibujan sobre el lienzo (no selección/paneo).
  const DRAWING_TOOLS: ToolModoCad[] = ['draw_line', 'draw_arc', 'draw_col', 'draw_tijeral', 'draw_correa', 'draw_arriostre', 'draw_node', 'measure'];
  const isDrawingTool = DRAWING_TOOLS.includes(activeTool);
  const TOOL_LABELS: Record<string, string> = {
    draw_line: 'Viga', draw_arc: 'Arco', draw_col: 'Columna', draw_tijeral: 'Tijeral',
    draw_correa: 'Correa', draw_arriostre: 'Cruz', draw_node: 'Nodo', measure: 'Medir', select: 'Seleccionar', pan: 'Mover',
  };

  // Al elegir una herramienta de dibujo, colapsa el panel flotante para que no
  // tape el lienzo ni se "coma" los clics destinados a dibujar (móvil, tablet
  // y escritorio). El usuario puede reabrirlo con el botón de la llave.
  useEffect(() => {
    if (isDrawingTool) {
      setIsToolsPanelCollapsed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  useEffect(() => {
    if (activeTool === 'draw_tijeral') {
      setDrawingStartNodeId(null);
      setChainFirstNodeId(null);
    }
  }, [activeTool]);

  // Función de Auto-Alineación y Unión de Nodos Cercanos (Reparador de Empalmes para Novatos)
  const handleAutoRepairCloseNodes = useCallback(() => {
    if (!engineState) return;
    const nodeArr = Object.values(nodes);
    let repairedCount = 0;
    
    // Buscar pares de nodos muy cercanos (< 18cm) y fusionar coordenadas
    for (let i = 0; i < nodeArr.length; i++) {
      for (let j = i + 1; j < nodeArr.length; j++) {
        const n1 = nodeArr[i];
        const n2 = nodeArr[j];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y, (n1.z || 0) - (n2.z || 0));
        if (dist > 0.001 && dist <= 0.20) {
          engineState.updateNodeCoords(n2.id, n1.x, n1.y, n1.z, false);
          repairedCount++;
        }
      }
    }

    if (repairedCount > 0) {
      engineState.saveHistorySnapshot();
      setArcNotice(`✅ ¡Se alinearon y unieron ${repairedCount} empalmes de nodos automáticamente!`);
      setTimeout(() => setArcNotice(null), 4000);
    } else {
      setArcNotice("✅ Todos los nodos y empalmes están alineados a la perfección.");
      setTimeout(() => setArcNotice(null), 3000);
    }
  }, [engineState, nodes]);

  // Sincronizar herramienta con el motor CAD
  const setTool = useCallback((tool: ToolModoCad) => {
    if (engineState) {
      engineState.setActiveTool(tool);
    }
  }, [engineState]);

  // Cancelar trazado encadenado con Escape o click secundario
  const handleCancelChain = useCallback(() => {
    setDrawingStartNodeId(null);
    setChainFirstNodeId(null);
    setActiveSnap(null);
    setMeasureStartPoint(null);
    setMeasureDistanceM(null);
    setArcStartPoint(null);
    setArcEndPoint(null);
    if (draggingNodeId) {
      setDraggingNodeId(null);
      setHasMovedNode(false);
    }
    setTool('select');
  }, [draggingNodeId, setTool]);

  // LISTENER TECLADO: DELETE / BACKSPACE / ESCAPE / ATAJOS HERRAMIENTAS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );
      if (isInput) return;

      if (e.key === 'Escape') {
        handleCancelChain();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (engineState && engineState.selectedElementIds.length > 0) {
          e.preventDefault();
          engineState.deleteSelectedElements();
        }
        return;
      }

      // Deshacer / Rehacer con CTRL
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (engineState?.canUndo) engineState.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (engineState?.canRedo) engineState.redo();
        return;
      }

      // Atajos de Herramientas
      const key = e.key.toLowerCase();
      if (key === 's' || e.key === '1') {
        e.preventDefault();
        setTool('select');
      } else if (key === 'v' || e.key === '2') {
        e.preventDefault();
        setTool('draw_line');
      } else if (key === 'a' || e.key === '3') {
        e.preventDefault();
        setTool('draw_arc');
      } else if (key === 'c' || e.key === '4') {
        e.preventDefault();
        setTool('draw_col');
      } else if (key === 't' || e.key === '5') {
        e.preventDefault();
        setTool('draw_tijeral');
      } else if (key === 'g' || e.key === '6') {
        e.preventDefault();
        setTool('draw_correa');
      } else if (key === 'x' || e.key === '7') {
        e.preventDefault();
        setTool('draw_arriostre');
      } else if (key === 'n' || e.key === '8') {
        e.preventDefault();
        setTool('draw_node');
      } else if (key === 'm' || e.key === '9') {
        e.preventDefault();
        setTool('measure');
      } else if (key === 'p' || e.key === '0') {
        e.preventDefault();
        setTool('pan');
      } else if (key === 'o') {
        // Alternar modo Orto 90° (trazo recto horizontal/vertical)
        e.preventDefault();
        setOrthoMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engineState, handleCancelChain, setTool]);

  // Escalado de píxeles por metro
  const scale = 32 * zoom;

  // Conversión de coordenadas de ratón a coordenadas métricas con O-Snap avanzado
  const screenToWorld = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 + pan.x;
    const centerY = rect.top + rect.height / 2 + pan.y;

    const screenDx = clientX - centerX;
    const screenDy = clientY - centerY;

    let worldX = screenDx / scale;
    let worldY = vista === 'planta' ? (screenDy / scale) : (-screenDy / scale);

    // Posición 2D del punto de inicio del trazo (si lo hay), según la vista.
    const startNode = drawingStartNodeId ? nodes[drawingStartNodeId] : null;
    const startX2D = startNode ? startNode.x : null;
    const startY2D = startNode ? (vista === 'planta' ? (startNode.z || 0) : startNode.y) : null;

    // MODO ORTO 90°: fuerza el trazo a quedar perfectamente horizontal o
    // vertical respecto al punto de inicio (ángulo recto exacto).
    if (orthoMode && startX2D !== null && startY2D !== null) {
      const dx = worldX - startX2D;
      const dy = worldY - startY2D;
      if (Math.abs(dx) >= Math.abs(dy)) {
        worldY = startY2D; // traza horizontal
      } else {
        worldX = startX2D; // traza vertical
      }
    }

    // Motor O-Snap Vectorial Avanzado: evalúa extremos, medios, intersecciones, anclajes y cierre
    const bestSnap = calculateBestCadSnap(
      { x: worldX, y: worldY },
      nodes,
      segments,
      vista,
      scale,
      drawingStartNodeId,
      chainFirstNodeId,
      {
        snapEnabled: snapGrid,
        snapGridSizeM: engineState?.snapGridSizeM || 0.25,
        // Radio magnético más generoso para conectar mejor con nodos/columnas;
        // mayor en móvil/tablet, donde el dedo es menos preciso que el ratón.
        magneticRadiusPx: isDesktop ? 42 : 64,
        enableIntersections: true,
        enableMidpoints: true,
        enablePerpendicular: true
      }
    );

    const finalPoint = bestSnap
      ? { x: bestSnap.projX, y: bestSnap.projY }
      : { x: Math.round(worldX * 100) / 100, y: Math.round(worldY * 100) / 100 };

    // Ángulo del tramo en curso (para el indicador de 90°). 0°/90°/180°/270° = recto.
    if (startX2D !== null && startY2D !== null) {
      const adx = finalPoint.x - startX2D;
      const ady = finalPoint.y - startY2D;
      if (Math.abs(adx) > 1e-6 || Math.abs(ady) > 1e-6) {
        let deg = Math.atan2(ady, adx) * 180 / Math.PI;
        if (deg < 0) deg += 360;
        setDrawAngleDeg(deg);
      } else {
        setDrawAngleDeg(null);
      }
    } else {
      setDrawAngleDeg(null);
    }

    setActiveSnap(bestSnap || null);
    return finalPoint;
  }, [pan, scale, snapGrid, engineState?.snapGridSizeM, vista, nodes, segments, drawingStartNodeId, chainFirstNodeId, orthoMode]);

  // CONTROLADORES DE PAN, ARRASTRE DE NODOS Y MOUSE
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isBackground = target.tagName === 'svg' || target.classList.contains('canvas-background');

    if (e.button === 2) {
      // Right click drag/pan
      isRightClickRef.current = true;
      rightClickStartPosRef.current = { x: e.clientX, y: e.clientY };
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    if ((activeTool as string) === 'pan' || e.button === 1 || e.shiftKey || (isBackground && ((activeTool as string) === 'select' || (activeTool as string) === 'pan'))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    const coords = screenToWorld(e.clientX, e.clientY);
    setCursorCoords(coords);

    // ARRASTRE DE NODO EN TIEMPO REAL
    if (draggingNodeId && engineState) {
      setHasMovedNode(true);
      const originalNode = nodes[draggingNodeId];
      if (originalNode) {
        if (vista === 'planta') {
          engineState.updateNodeCoords(draggingNodeId, coords.x, originalNode.y, coords.y, false);
        } else {
          engineState.updateNodeCoords(draggingNodeId, coords.x, Math.max(0, coords.y), originalNode.z || 0, false);
        }
      }
      return;
    }

    if (activeTool === 'measure' && measureStartPoint) {
      const dx = coords.x - measureStartPoint.x;
      const dy = coords.y - measureStartPoint.y;
      setMeasureDistanceM(Number(Math.hypot(dx, dy).toFixed(2)));
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    setIsPanning(false);
    
    if (isRightClickRef.current && e) {
      isRightClickRef.current = false;
      const dist = Math.hypot(e.clientX - rightClickStartPosRef.current.x, e.clientY - rightClickStartPosRef.current.y);
      if (dist < 5) {
        handleCancelChain();
      }
    }

    if (draggingNodeId) {
      if (hasMovedNode && engineState) {
        engineState.saveHistorySnapshot();
      }
      setDraggingNodeId(null);
      setHasMovedNode(false);
    }
  };

  // TOUCH GESTURES MÓVILES (PINCH-TO-ZOOM, PAN Y ARRASTRE DE NODO)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchPinchDistRef.current = dist;
      touchStartZoomRef.current = zoom;
      touchPanStartRef.current = {
        x: (t1.clientX + t2.clientX) / 2 - pan.x,
        y: (t1.clientY + t2.clientY) / 2 - pan.y
      };
      setIsPanning(true);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchPanStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
      if (!draggingNodeId) {
        setIsPanning(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const scaleFactor = currentDist / touchPinchDistRef.current;
      const newZoom = Math.min(Math.max(touchStartZoomRef.current * scaleFactor, 0.4), 12.0);
      setZoom(newZoom);

      if (touchPanStartRef.current) {
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        setPan({
          x: midX - touchPanStartRef.current.x,
          y: midY - touchPanStartRef.current.y
        });
      }
    } else if (e.touches.length === 1 && touchPanStartRef.current) {
      const touch = e.touches[0];
      if (draggingNodeId && engineState) {
        const coords = screenToWorld(touch.clientX, touch.clientY);
        setCursorCoords(coords);
        setHasMovedNode(true);
        const originalNode = nodes[draggingNodeId];
        if (originalNode) {
          if (vista === 'planta') {
            engineState.updateNodeCoords(draggingNodeId, coords.x, originalNode.y, coords.y, false);
          } else {
            engineState.updateNodeCoords(draggingNodeId, coords.x, Math.max(0, coords.y), originalNode.z || 0, false);
          }
        }
      } else if (isPanning || activeTool === 'pan' || activeTool === 'select') {
        setPan({
          x: touch.clientX - touchPanStartRef.current.x,
          y: touch.clientY - touchPanStartRef.current.y
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchPinchDistRef.current = null;
    }
    if (e.touches.length === 0) {
      touchPanStartRef.current = null;
      setIsPanning(false);
      if (draggingNodeId) {
        if (hasMovedNode && engineState) {
          engineState.saveHistorySnapshot();
        }
        setDraggingNodeId(null);
        setHasMovedNode(false);
      }
    }
  };

  // INICIO DE ARRASTRE DE NODO DIRECTO (MOUSE & TOUCH)
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (activeTool === 'select') {
      e.stopPropagation();
      setDraggingNodeId(nodeId);
      setHasMovedNode(false);
      engineState?.setSelectedElementIds([nodeId]);
    }
  };

  const handleNodeTouchStart = (nodeId: string, e: React.TouchEvent) => {
    if (activeTool === 'select' && e.touches.length === 1) {
      e.stopPropagation();
      setDraggingNodeId(nodeId);
      setHasMovedNode(false);
      engineState?.setSelectedElementIds([nodeId]);
    }
  };

  // RUEDA DE RATÓN PARA ZOOM EN LIENZO CON TECLA O NAVEGACIÓN
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom(prevZoom => Math.min(Math.max(prevZoom * zoomFactor, 0.35), 12.0));
  };

  // NAVEGACIÓN HORIZONTAL CON RUEDA DE RATÓN EN BARRAS FLOTANTES
  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.currentTarget) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // ENMARCAR VISTA COMPLETA (FIT TO VIEW)
  const handleFitView = useCallback(() => {
    const nodeArray = Object.values(nodes);
    if (nodeArray.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1.12);
      return;
    }

    const xs = nodeArray.map(n => n.x);
    const ys = nodeArray.map(n => vista === 'planta' ? (n.z || 0) : n.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = Math.max(maxX - minX, 4);
    const spanY = Math.max(maxY - minY, 3);

    const containerW = canvasDimensions.width || 800;
    const containerH = canvasDimensions.height || 600;

    const zoomX = (containerW * 0.75) / (spanX * 32);
    const zoomY = (containerH * 0.75) / (spanY * 32);
    const newZoom = Math.min(Math.max(Math.min(zoomX, zoomY), 0.45), 2.5);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const newPanX = -midX * 32 * newZoom;
    const newPanY = vista === 'planta' ? -midY * 32 * newZoom : midY * 32 * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [nodes, vista, canvasDimensions]);

  const prevNodeCountRef = useRef<number>(0);
  useEffect(() => {
    const count = Object.keys(nodes).length;
    if (count > 0 && prevNodeCountRef.current === 0) {
      setTimeout(() => {
        handleFitView();
      }, 150);
    }
    prevNodeCountRef.current = count;
  }, [nodes, handleFitView]);

  // MAPEADOR DE ROL ESTRUCTURAL SEGÚN HERRAMIENTA ACTIVA
  const getRolFromActiveTool = (): RolEstructuralSegmento => {
    switch (activeTool) {
      case 'draw_col': return 'columna';
      case 'draw_tijeral': return 'cordon_superior';
      case 'draw_correa': return 'correa';
      case 'draw_arriostre': return 'arriostre';
      case 'draw_arc': return 'cordon_superior';
      default: return 'viga_principal';
    }
  };

  // CREAR ARCO PARABÓLICO ENTRE PUNTOS CON FLECHA
  const handleExecuteArcCreation = (sagitta: number) => {
    if (!arcStartPoint || !arcEndPoint || !engineState) return;
    engineState.addArcBetweenPoints(
      arcStartPoint,
      arcEndPoint,
      sagitta,
      arcDivisions,
      'cordon_superior'
    );
    setArcNotice(`¡Arco parabólico generado exitosamente (${sagitta.toFixed(2)}m flecha, ${arcDivisions} divisiones)!`);
    setTimeout(() => setArcNotice(null), 4000);
    setArcStartPoint(null);
    setArcEndPoint(null);
  };

  // CLIC EN EL LIENZO SVG (TRAZADO LIBRE Y ACOPLE DE ELEMENTOS)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!engineState || activeTool === 'pan' || activeTool === 'select' || isPanning || hasMovedNode) {
      return;
    }

    const clickCoords = screenToWorld(e.clientX, e.clientY);

    // HERRAMIENTA DE ARCO PARABÓLICO (draw_arc)
    if (activeTool === 'draw_arc') {
      const zVal = vista === 'planta' ? clickCoords.y : 0;
      const yVal = vista === 'seccion' ? clickCoords.y : beamElevationSetting;

      if (!arcStartPoint) {
        // PASO 1: FIJAR PUNTO INICIAL DEL ARCO
        const pt = {
          x: activeSnap?.x ?? clickCoords.x,
          y: activeSnap?.y ?? yVal,
          z: activeSnap?.z ?? zVal,
          nodeId: activeSnap?.nodeId
        };
        setArcStartPoint(pt);
      } else if (arcStartPoint && !arcEndPoint) {
        // PASO 2: FIJAR PUNTO FINAL DEL ARCO (LUZ LIBRE)
        const pt = {
          x: activeSnap?.x ?? clickCoords.x,
          y: activeSnap?.y ?? yVal,
          z: activeSnap?.z ?? zVal,
          nodeId: activeSnap?.nodeId
        };
        const chordL = Math.hypot(pt.x - arcStartPoint.x, pt.y - arcStartPoint.y);
        if (chordL > 0.3) {
          setArcEndPoint(pt);
          const autoSagitta = Number((chordL / 6.5).toFixed(2));
          setArcSagittaM(Math.max(1.0, autoSagitta));
        }
      } else if (arcStartPoint && arcEndPoint) {
        // PASO 3: FIJAR FLECHA CON CLIC EN LA CÚSPIDE
        const midY = (arcStartPoint.y + arcEndPoint.y) / 2;
        const clickedSagitta = Math.max(0.4, Math.abs(clickCoords.y - midY));
        handleExecuteArcCreation(clickedSagitta);
      }
      return;
    }

    // HERRAMIENTA MEDICIÓN DE DISTANCIAS (measure)
    if (activeTool === 'measure') {
      if (!measureStartPoint) {
        setMeasureStartPoint({ x: clickCoords.x, y: clickCoords.y });
      } else {
        const dist = Math.hypot(clickCoords.x - measureStartPoint.x, clickCoords.y - measureStartPoint.y);
        setMeasureDistanceM(Number(dist.toFixed(2)));
        setMeasureStartPoint(null);
      }
      return;
    }

    // HERRAMIENTA NODO PUNTUAL (draw_node)
    if (activeTool === 'draw_node') {
      const x = clickCoords.x;
      const zVal = vista === 'planta' ? clickCoords.y : 0;
      const yVal = vista === 'seccion' ? clickCoords.y : 0;
      const id = engineState.addNode(x, yVal, zVal);
      engineState.setSelectedElementIds([id]);
      return;
    }

    // HERRAMIENTA COLUMNA VERTICAL (draw_col)
    if (activeTool === 'draw_col') {
      const x = clickCoords.x;
      const z = vista === 'planta' ? clickCoords.y : 0;
      const h = colHeightSetting;

      const baseNodeId = engineState.addNode(x, 0, z, true);
      const topNodeId = engineState.addNode(x, h, z, false);
      engineState.addSegment(baseNodeId, topNodeId, 'columna');
      engineState.setSelectedElementIds([topNodeId]);
      return;
    }

    // HERRAMIENTA TIJERAL PARAMÉTRICO (draw_tijeral)
    if (activeTool === 'draw_tijeral') {
      const x = clickCoords.x;
      const zVal = vista === 'planta' ? clickCoords.y : 0;
      const yVal = vista === 'seccion' ? clickCoords.y : beamElevationSetting;

      let targetNodeId = (activeSnap && activeSnap.tipo !== 'grid') ? activeSnap.nodeId : null;
      if (!targetNodeId && activeSnap && activeSnap.segmentId) {
        targetNodeId = engineState.splitSegmentAtPoint(activeSnap.segmentId, activeSnap.x, activeSnap.y, activeSnap.z);
      }
      if (!targetNodeId) {
        targetNodeId = engineState.addNode(x, yVal, zVal);
      }

      if (!drawingStartNodeId) {
        setDrawingStartNodeId(targetNodeId);
        setChainFirstNodeId(targetNodeId);
        engineState.setSelectedElementIds([targetNodeId]);
      } else if (drawingStartNodeId !== targetNodeId) {
        engineState.generateTrussFreehand(drawingStartNodeId, targetNodeId, trussHeightSetting, selectedTrussType);
        setDrawingStartNodeId(null);
        setChainFirstNodeId(null);
        setClosedPerimeterNotice(`¡Tijeral ${CATALOGO_TIJERALES_INFO[selectedTrussType]?.nombre || ''} generado con éxito!`);
        setTimeout(() => setClosedPerimeterNotice(null), 4000);
        engineState.setSelectedElementIds([targetNodeId]);
      }
      return;
    }

    // HERRAMIENTAS DE TRAZADO DE TRAMOS (Viga, Correa, Arriostre, Línea)
    const isDrawingSegment = 
      activeTool === 'draw_line' || 
      activeTool === 'draw_correa' || 
      activeTool === 'draw_arriostre';

    if (isDrawingSegment) {
      const rol = getRolFromActiveTool();

      // CASO 1: SNAP MAGNÉTICO ACTIVO (O-SNAP)
      if (activeSnap && activeSnap.tipo !== 'grid') {
        let targetNodeId = activeSnap.nodeId;

        if (!targetNodeId && activeSnap.segmentId) {
          targetNodeId = engineState.splitSegmentAtPoint(
            activeSnap.segmentId,
            activeSnap.x,
            activeSnap.y,
            activeSnap.z
          );
        } else if (!targetNodeId) {
          targetNodeId = engineState.addNode(activeSnap.x, activeSnap.y, activeSnap.z);
        }

        if (!targetNodeId) return;

        if (!drawingStartNodeId) {
          setDrawingStartNodeId(targetNodeId);
          setChainFirstNodeId(targetNodeId);
          engineState.setSelectedElementIds([targetNodeId]);
          return;
        }

        if (drawingStartNodeId === targetNodeId) {
          return;
        }

        // ¿CIERRE DE PERÍMETRO AL TOCAR EL NODO DONDE COMENZÓ LA CADENA?
        if (activeSnap.tipo === 'close_loop' || (chainFirstNodeId && targetNodeId === chainFirstNodeId)) {
          engineState.addSegment(drawingStartNodeId, targetNodeId, rol);
          const initialLabel = nodes[targetNodeId]?.nodeLabel || 'Nodo Inicial';
          setClosedPerimeterNotice(`¡Perímetro cerrado con éxito! (Conectado a ${initialLabel})`);
          setTimeout(() => setClosedPerimeterNotice(null), 4000);
          setDrawingStartNodeId(null);
          setChainFirstNodeId(null);
          engineState.setSelectedElementIds([targetNodeId]);
          return;
        }

        // Conectar al nodo existente. En modo cadena continuamos desde este
        // nodo; en modo "viga suelta" cerramos el tramo y empezamos de cero.
        engineState.addSegment(drawingStartNodeId, targetNodeId, rol);
        if (chainMode) {
          setDrawingStartNodeId(targetNodeId);
        } else {
          setDrawingStartNodeId(null);
          setChainFirstNodeId(null);
        }
        engineState.setSelectedElementIds([targetNodeId]);
        return;
      }

      // CASO 2: Clic en coordenadas de retícula / espacio libre
      const x = clickCoords.x;
      const zVal = vista === 'planta' ? clickCoords.y : 0;
      const yVal = vista === 'seccion' ? clickCoords.y : beamElevationSetting;

      const hadStart = !!drawingStartNodeId;
      const newNodeId = engineState.addNode(x, yVal, zVal);

      if (drawingStartNodeId) {
        engineState.addSegment(drawingStartNodeId, newNodeId, rol);
      } else {
        setChainFirstNodeId(newNodeId);
      }

      if (!chainMode && hadStart) {
        // "Viga suelta": ya cerramos este tramo; el siguiente clic empieza otro.
        setDrawingStartNodeId(null);
        setChainFirstNodeId(null);
      } else {
        // Cadena continua (o primer clic): seguir desde este nodo.
        setDrawingStartNodeId(newNodeId);
      }
      engineState.setSelectedElementIds([newNodeId]);
    }
  };

  // CLIC EN NODO EXISTENTE
  const handleNodeClick = (nodeId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!engineState || hasMovedNode) return;

    if (activeTool === 'measure') {
      const n = nodes[nodeId];
      if (n) {
        const nY = vista === 'planta' ? (n.z || 0) : n.y;
        if (!measureStartPoint) {
          setMeasureStartPoint({ x: n.x, y: nY });
        } else {
          const dist = Math.hypot(n.x - measureStartPoint.x, nY - measureStartPoint.y);
          setMeasureDistanceM(Number(dist.toFixed(2)));
          setMeasureStartPoint(null);
        }
      }
      return;
    }

    if (activeTool === 'draw_arc') {
      const n = nodes[nodeId];
      if (n) {
        const pt = { x: n.x, y: n.y, z: n.z || 0, nodeId };
        if (!arcStartPoint) {
          setArcStartPoint(pt);
        } else if (arcStartPoint && !arcEndPoint) {
          if (arcStartPoint.nodeId !== nodeId) {
            setArcEndPoint(pt);
            const chordL = Math.hypot(n.x - arcStartPoint.x, n.y - arcStartPoint.y);
            setArcSagittaM(Math.max(1.0, Number((chordL / 6.5).toFixed(2))));
          }
        }
      }
      return;
    }

    if (activeTool === 'draw_tijeral') {
      if (!drawingStartNodeId) {
        setDrawingStartNodeId(nodeId);
        setChainFirstNodeId(nodeId);
        engineState.setSelectedElementIds([nodeId]);
      } else if (drawingStartNodeId === nodeId) {
        return;
      } else {
        engineState.generateTrussFreehand(
          drawingStartNodeId, 
          nodeId, 
          trussHeightSetting, 
          selectedTrussType,
          trussSpacingMode === 'divisiones' ? trussDivisionsSetting : undefined,
          trussSpacingMode === 'espaciado' ? trussSpacingSettingM : undefined
        );
        setDrawingStartNodeId(null);
        setChainFirstNodeId(null);
        setClosedPerimeterNotice(`¡Tijeral ${CATALOGO_TIJERALES_INFO[selectedTrussType]?.nombre || ''} generado con éxito!`);
        setTimeout(() => setClosedPerimeterNotice(null), 4000);
        engineState.setSelectedElementIds([nodeId]);
      }
      return;
    }

    const isDrawingSegment = 
      activeTool === 'draw_line' || 
      activeTool === 'draw_correa' || 
      activeTool === 'draw_arriostre';

    if (isDrawingSegment) {
      const rol = getRolFromActiveTool();

      if (!drawingStartNodeId) {
        setDrawingStartNodeId(nodeId);
        setChainFirstNodeId(nodeId);
        engineState.setSelectedElementIds([nodeId]);
      } else if (drawingStartNodeId === nodeId) {
        return;
      } else if (chainFirstNodeId && nodeId === chainFirstNodeId) {
        engineState.addSegment(drawingStartNodeId, nodeId, rol);
        const label = nodes[nodeId]?.nodeLabel || 'Nodo Inicial';
        setClosedPerimeterNotice(`¡Perímetro cerrado con éxito! (Conectado a ${label})`);
        setTimeout(() => setClosedPerimeterNotice(null), 4000);
        setDrawingStartNodeId(null);
        setChainFirstNodeId(null);
        engineState.setSelectedElementIds([nodeId]);
      } else {
        engineState.addSegment(drawingStartNodeId, nodeId, rol);
        setDrawingStartNodeId(nodeId);
        engineState.setSelectedElementIds([nodeId]);
      }
      return;
    }

    engineState.setSelectedElementIds([nodeId]);
  };

  // CLIC EN SEGMENTO / BARRA
  const handleSegmentClick = (segmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!engineState) return;

    const isDrawingSegment = 
      activeTool === 'draw_line' || 
      activeTool === 'draw_tijeral' || 
      activeTool === 'draw_correa' || 
      activeTool === 'draw_arriostre';

    if (isDrawingSegment) {
      const coords = screenToWorld(e.clientX, e.clientY);
      const zVal = vista === 'planta' ? coords.y : 0;
      const yVal = vista === 'seccion' ? coords.y : beamElevationSetting;
      const anchorNodeId = engineState.splitSegmentAtPoint(segmentId, coords.x, yVal, zVal);
      const rol = getRolFromActiveTool();

      if (!drawingStartNodeId) {
        setDrawingStartNodeId(anchorNodeId);
        setChainFirstNodeId(anchorNodeId);
        engineState.setSelectedElementIds([anchorNodeId]);
      } else if (drawingStartNodeId !== anchorNodeId) {
        engineState.addSegment(drawingStartNodeId, anchorNodeId, rol);
        setDrawingStartNodeId(anchorNodeId);
        engineState.setSelectedElementIds([anchorNodeId]);
      }
      return;
    }

    engineState.setSelectedElementIds([segmentId]);
  };

  // INSERCIÓN DE TRAMO NUMÉRICO EXACTO
  const handleAddNumericLine = () => {
    if (!engineState) return;
    const lenM = (parseFloat(inputLengthMm) || 4000) / 1000;
    const angDeg = parseFloat(inputAngleDeg) || 0;
    const angRad = (angDeg * Math.PI) / 180;

    let startX = 0;
    let startY = 3.5;
    let startZ = 0;

    if (drawingStartNodeId && nodes[drawingStartNodeId]) {
      const n = nodes[drawingStartNodeId];
      startX = n.x;
      startY = n.y;
      startZ = n.z || 0;
    }

    const startId = drawingStartNodeId || engineState.addNode(startX, startY, startZ);

    const deltaX = lenM * Math.cos(angRad);
    const deltaY = lenM * Math.sin(angRad);

    const endX = startX + deltaX;
    const endY = vista === 'planta' ? startY : startY + deltaY;
    const endZ = vista === 'planta' ? startZ + deltaY : startZ;

    const endId = engineState.addNode(endX, endY, endZ);
    const rol = getRolFromActiveTool();
    engineState.addSegment(startId, endId, rol);
    setDrawingStartNodeId(endId);
    setShowDimensionModal(false);
  };

  // Centro de pantalla en SVG estable sin saltos de renderizado
  const containerW = canvasDimensions.width || containerRef.current?.clientWidth || 800;
  const containerH = canvasDimensions.height || containerRef.current?.clientHeight || 600;
  const centerTranslateX = containerW / 2 + pan.x;
  const centerTranslateY = containerH / 2 + pan.y;

  // Coordenadas para previsualización rubberband
  let rubberbandX1 = 0;
  let rubberbandY1 = 0;
  let rubberbandX2 = cursorCoords.x * scale;
  let rubberbandY2 = vista === 'planta' ? cursorCoords.y * scale : -cursorCoords.y * scale;

  if (drawingStartNodeId && nodes[drawingStartNodeId]) {
    const sNode = nodes[drawingStartNodeId];
    rubberbandX1 = sNode.x * scale;
    rubberbandY1 = vista === 'planta' ? (sNode.z || 0) * scale : -sNode.y * scale;
  }

  // Previsualización de curva parabólica para herramienta draw_arc
  const arcPreviewPoints: { x: number; y: number }[] = [];
  if (activeTool === 'draw_arc' && arcStartPoint) {
    const p1 = arcStartPoint;
    const p2 = arcEndPoint || { x: cursorCoords.x, y: cursorCoords.y, z: 0 };

    const dx = p2.x - p1.x;
    const dy = (vista === 'planta' ? (p2.z || p2.y) : p2.y) - (vista === 'planta' ? (p1.z || p1.y) : p1.y);
    const chordL = Math.hypot(dx, dy);

    if (chordL > 0.1) {
      let nx = -dy / chordL;
      let ny = dx / chordL;
      if (ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      const h = arcEndPoint ? arcSagittaM : Math.max(1.0, chordL / 6.5);

      for (let i = 0; i <= arcDivisions; i++) {
        const t = i / arcDivisions;
        const offset = 4 * h * t * (1 - t);
        const ptX = p1.x + t * dx + offset * nx;
        const ptY = (vista === 'planta' ? (p1.z || p1.y) : p1.y) + t * dy + offset * ny;
        arcPreviewPoints.push({
          x: ptX * scale,
          y: vista === 'planta' ? ptY * scale : -ptY * scale
        });
      }
    }
  }

  const cursorClass = isPanning 
    ? 'cursor-grabbing' 
    : activeTool === 'pan' 
      ? 'cursor-grab' 
      : draggingNodeId 
        ? 'cursor-grabbing' 
        : activeTool === 'select' 
          ? 'cursor-default' 
          : 'cursor-crosshair';

  return (
    <div ref={containerRef} className={`w-full h-full flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden select-none font-sans ${vistaAmplia ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* 1. SUB-BARRA DE VISTA: PLANTA / SECCIÓN / 3D WEBGL (CON SOPORTE DE SCROLL POR RUEDA DE RATÓN) */}
      <div 
        onWheel={handleHorizontalWheel}
        className="h-9 sm:h-10 bg-white border-b border-slate-200 px-2 sm:px-3 flex items-center justify-between shrink-0 z-20 shadow-2xs gap-1 sm:gap-2 overflow-x-auto scrollbar-none"
      >
        {/* Izquierda: Vistas + Herramienta (acceso rápido estilo Herrería) */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
        {/* Segmented Control de Vistas */}
        <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200/90 shadow-2xs shrink-0">
          <button
            onClick={() => handleSetVista('planta')}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              vista === 'planta' 
                ? 'bg-white text-slate-950 font-black shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Vista en Planta Superior (X-Z)"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Planta</span>
            <span className="hidden md:inline text-[10px] text-slate-400 font-normal ml-0.5">(X-Z)</span>
          </button>

          <button
            onClick={() => handleSetVista('seccion')}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              vista === 'seccion' 
                ? 'bg-white text-slate-950 font-black shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Vista de Elevación / Sección (X-Y)"
          >
            <Columns className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="sm:hidden">Elev.</span>
            <span className="hidden sm:inline">Elevación</span>
            <span className="hidden md:inline text-[10px] text-slate-400 font-normal ml-0.5">(X-Y)</span>
          </button>

          <button
            onClick={() => handleSetVista('3d')}
            className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              vista === '3d' 
                ? 'bg-sky-600 text-white font-black shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visor 3D WebGL con Coberturas Aluzinc TR-4"
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>3D</span>
            <span className="hidden sm:inline text-[10px] ml-0.5 font-bold">Aluzinc</span>
          </button>
        </div>

        {/* Dropdown de HERRAMIENTA en la barra superior (estilo Herrería):
            selecciona la herramienta activa sin abrir el panel central. Solo
            en vistas 2D (en 3D no aplica). */}
        {vista !== '3d' && (
          <div className="relative shrink-0">
            <button
              ref={topToolBtnRef}
              onClick={toggleTopToolDropdown}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                isDrawingTool
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
              title="Herramienta de dibujo activa"
            >
              <PenTool className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{TOOL_LABELS[activeTool] || 'Herramienta'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showTopToolDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showTopToolDropdown && toolMenuPos && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTopToolDropdown(false)} />
                <div
                  className="fixed z-50 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 grid grid-cols-2 gap-1"
                  style={{ top: toolMenuPos.top, left: toolMenuPos.left }}
                >
                  {([
                    { t: 'select', ic: <MousePointer className="w-3.5 h-3.5" /> },
                    { t: 'draw_line', ic: <PenTool className="w-3.5 h-3.5" /> },
                    { t: 'draw_arc', ic: <Spline className="w-3.5 h-3.5" /> },
                    { t: 'draw_col', ic: <Columns className="w-3.5 h-3.5" /> },
                    { t: 'draw_tijeral', ic: <Wrench className="w-3.5 h-3.5" /> },
                    { t: 'draw_correa', ic: <Grid className="w-3.5 h-3.5" /> },
                    { t: 'draw_arriostre', ic: <X className="w-3.5 h-3.5" /> },
                    { t: 'draw_node', ic: <Crosshair className="w-3.5 h-3.5" /> },
                    { t: 'measure', ic: <Ruler className="w-3.5 h-3.5" /> },
                  ] as { t: ToolModoCad; ic: React.ReactNode }[]).map(({ t, ic }) => (
                    <button
                      key={t}
                      onClick={() => { setTool(t); setShowTopToolDropdown(false); }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                        activeTool === t ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {ic}
                      <span className="truncate">{TOOL_LABELS[t]}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* BOTÓN ORTO 90°: fuerza el trazo a horizontal/vertical exacto */}
        {vista !== '3d' && (
          <button
            onClick={() => setOrthoMode(prev => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-2xs shrink-0 ${
              orthoMode
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
            title="Orto 90°: obliga a que la viga quede perfectamente recta (horizontal o vertical). Átajo: tecla O"
          >
            <span className="text-sm leading-none">⊾</span>
            <span>90°</span>
          </button>
        )}
        </div>

        {/* Acciones auxiliares compactas a la derecha */}
        <div className="flex items-center gap-1 shrink-0">
          {/* BOTÓN COLUMNAS POR MEDIDAS EXACTAS */}
          {vista !== '3d' && (
            <button
              onClick={() => setShowColumnasExactas(true)}
              className="p-1 sm:px-2.5 sm:py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all shrink-0"
              title="Generar columnas con posición y altura exactas (ideal para columnas de concreto existentes)"
            >
              <Columns className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">Columnas</span>
            </button>
          )}

          {/* BOTÓN ASISTENTE 1-CLIC */}
          <button
            onClick={() => setShowNovatosWizard(true)}
            className="p-1 sm:px-2.5 sm:py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all shrink-0"
            title="Abrir Asistente para generar techos completos en 1 clic"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
            <span className="text-xs font-black">Asistente</span>
          </button>

          {/* BOTÓN MÓVIL PROPIEDADES (Inspector de Sección, Materiales y Perfiles) */}
          {onOpenMobileProperties && (
            <button
              onClick={onOpenMobileProperties}
              className="lg:hidden p-1 sm:px-2 sm:py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 active:scale-95"
              title="Abrir Propiedades de Elemento (Sección, Espesor, Cargas)"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="text-xs font-bold hidden sm:inline">Propied.</span>
            </button>
          )}

          {/* BOTÓN GENERAL MOSTRAR/OCULTAR PANEL CAD FLOTANTE */}
          <button
            onClick={() => setShowFloatingToolsPanel(prev => !prev)}
            className={`p-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs border shrink-0 ${
              showFloatingToolsPanel 
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black' 
                : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-amber-700 border-slate-200'
            }`}
            title="Mostrar / Ocultar Panel de Control CAD Flotante"
          >
            <PenTool className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Panel CAD</span>
          </button>

          {/* BOTÓN SUMILLA DE CONTROLES CAD */}
          <button
            onClick={() => setShowControlsSumilla(prev => !prev)}
            className={`p-1 sm:px-2 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs border shrink-0 ${
              showControlsSumilla 
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-purple-700 border-slate-200'
            }`}
            title="Ver sumilla resumida de controles y atajos"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Controles</span>
          </button>

          {/* BOTÓN PROPIEDADES ESCRITORIO (No invasivo, en la barra de herramientas) */}
          {isDesktop && setShowInspector && (
            <button
              onClick={() => setShowInspector(prev => !prev)}
              className={`p-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs border shrink-0 ${
                showInspector 
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-amber-700 border-slate-200'
              }`}
              title="Mostrar / Ocultar Panel de Propiedades Lateral"
            >
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Propiedades</span>
            </button>
          )}

          {/* BOTÓN TUTORIAL INTERACTIVO O GENERAL */}
          {onOpenInteractiveTutorial ? (
            <button
              onClick={onOpenInteractiveTutorial}
              className="p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-2xs shrink-0 active:scale-95"
              title="Iniciar Tutorial Guiado"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden md:inline">Guía</span>
            </button>
          ) : onOpenTutorial ? (
            <button
              onClick={onOpenTutorial}
              className="p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-2xs shrink-0 active:scale-95"
              title="Ver Guía de Techos Metálicos"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden md:inline">Tutorial</span>
            </button>
          ) : null}

          {/* BOTÓN PANTALLA COMPLETA */}
          <button
            onClick={() => setVistaAmplia(!vistaAmplia)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
            title={vistaAmplia ? "Salir de vista amplia" : "Vista completa de lienzo"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* BANNER DIDÁCTICO ORIENTADOR DE VISTAS (PLANTA VS ELEVACIÓN) */}
      <TechosViewModeGuideBanner
        vista={vista}
        onOpenWizard={() => setShowNovatosWizard(true)}
        onOpenControlsSumilla={() => setShowControlsSumilla(true)}
        colHeightSetting={colHeightSetting}
        totalNodos={Object.keys(nodes).length}
        totalSegmentos={Object.keys(segments).length}
      />

      {/* 2. ÁREA DE LIENZO PRINCIPAL (CAD 2D O VISOR 3D WEBGL) */}
      <div 
        ref={containerRef}
        className={`flex-1 min-h-0 relative overflow-hidden bg-slate-50 touch-none notranslate ${cursorClass}`}
        translate="no"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          handleCancelChain();
        }}
      >
        {vista === '3d' ? (
          <div className="w-full h-full relative">
            <TechosErrorBoundary fallbackTitle="Visualizador 3D CAD">
              <TechosViewer3D engineState={engineState} />
            </TechosErrorBoundary>
          </div>
        ) : (
          <div className="w-full h-full relative" onClick={handleCanvasClick}>
            <svg 
              className="w-full h-full absolute inset-0 select-none pointer-events-auto notranslate"
              style={{ width: '100%', height: '100%' }}
            >
              <defs>
                {/* Patrón de Retícula Cuadriculada CAD */}
                <pattern id="cad-grid-pattern-techos" width={scale} height={scale} patternUnits="userSpaceOnUse">
                  <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
                <pattern id="cad-grid-major-techos" width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse">
                  <path d={`M ${scale * 5} 0 L 0 0 0 ${scale * 5}`} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                </pattern>
              </defs>

              <g transform={`translate(${centerTranslateX}, ${centerTranslateY})`}>
                {/* RETÍCULA CAD */}
                {showGrid && (
                  <rect 
                    x={-5000} 
                    y={-5000} 
                    width={10000} 
                    height={10000} 
                    fill="url(#cad-grid-pattern-techos)" 
                    className="pointer-events-none opacity-80"
                  />
                )}
                {showGrid && (
                  <rect 
                    x={-5000} 
                    y={-5000} 
                    width={10000} 
                    height={10000} 
                    fill="url(#cad-grid-major-techos)" 
                    className="pointer-events-none opacity-40"
                  />
                )}

                {/* EJES DE ORIGEN (X en Rojo, Y/Z en Verde) */}
                <line x1={-3000} y1={0} x2={3000} y2={0} stroke="#cbd5e1" strokeWidth="1.5" className="pointer-events-none" />
                <line x1={0} y1={-3000} x2={0} y2={3000} stroke="#cbd5e1" strokeWidth="1.5" className="pointer-events-none" />
                <line x1={0} y1={0} x2={60} y2={0} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
                <line x1={0} y1={0} x2={0} y2={vista === 'planta' ? 60 : -60} stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
                <circle cx={0} cy={0} r={4} fill="#0f172a" className="pointer-events-none" />

                {/* REFERENCIAS VISUALES Y GUÍAS DE ELEVACIÓN PARA PRINCIPIANTES */}
                {vista === 'seccion' && (
                  <g className="pointer-events-none select-none">
                    {/* Suelo / Plano de Cimentación Y=0 */}
                    <line x1={-4000} y1={0} x2={4000} y2={0} stroke="#475569" strokeWidth="3" />
                    <rect x={-4000} y={0} width={8000} height={500} fill="#f8fafc" opacity="0.8" />
                    <g transform="translate(-160, 16)">
                      <rect x="0" y="-12" width="170" height="20" rx="6" fill="#0f172a" opacity="0.85" />
                      <text x="85" y="2" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                        🌱 Nivel Suelo / Base (0.00m)
                      </text>
                    </g>

                    {/* Guía Nivel Cima de Columnas (Y = colHeightSetting) */}
                    <line 
                      x1={-4000} 
                      y1={-colHeightSetting * scale} 
                      x2={4000} 
                      y2={-colHeightSetting * scale} 
                      stroke="#2563eb" 
                      strokeWidth="1.5" 
                      strokeDasharray="6 4" 
                      opacity="0.8" 
                    />
                    <g transform={`translate(-200, ${-colHeightSetting * scale - 12})`}>
                      <rect x="0" y="-10" width="225" height="20" rx="6" fill="#1d4ed8" opacity="0.9" />
                      <text x="112" y="3" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                        📏 Cima de Columna / Apoyo ({colHeightSetting.toFixed(2)}m)
                      </text>
                    </g>
                  </g>
                )}

                {/* SEGMENTOS Y BARRAS ESTRUCTURALES */}
                {Object.values(segments).map(seg => {
                  const nA = nodes[seg.nodeAId];
                  const nB = nodes[seg.nodeBId];
                  if (!nA || !nB) return null;

                  const x1 = nA.x * scale;
                  const y1 = vista === 'planta' ? (nA.z || 0) * scale : -nA.y * scale;
                  const x2 = nB.x * scale;
                  const y2 = vista === 'planta' ? (nB.z || 0) * scale : -nB.y * scale;

                  const isSelected = selectedElementIds.includes(seg.id);
                  const strokeColor = getSegmentColorHex(seg.rolEstructural, isSelected);

                  const profile = INVENTARIO_PERFILES_TUBULARES.find((p: any) => p.id === seg.profileId);
                  const isRound = profile?.categoria === 'tubo_redondo' || 
                                  profile?.categoria === 'barra_redonda' || 
                                  (profile?.nombre && /redond|circular/i.test(profile.nombre)) ||
                                  (seg.profileId && /redond|round/i.test(seg.profileId));

                  const dx = nB.x - nA.x;
                  const dy = nB.y - nA.y;
                  const dz = (nB.z || 0) - (nA.z || 0);
                  const lengthM = Math.sqrt(dx * dx + dy * dy + dz * dz);

                  if (vista === 'planta' && seg.rolEstructural === 'columna') {
                    if (isRound) {
                      return (
                        <g key={seg.id} onClick={(e) => handleSegmentClick(seg.id, e)} className="group cursor-pointer">
                          <circle 
                            cx={x1} 
                            cy={y1} 
                            r="14" 
                            fill="rgba(37, 99, 235, 0.22)" 
                            stroke="#38bdf8"
                            strokeWidth="1"
                            className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          />
                          <circle 
                            cx={x1} 
                            cy={y1} 
                            r="9" 
                            fill={isSelected ? '#0f172a' : '#2563eb'} 
                            stroke={isSelected ? '#f59e0b' : '#ffffff'} 
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            className="group-hover:fill-amber-500 transition-colors"
                          />
                          <circle cx={x1} cy={y1} r="3" fill="#ffffff" opacity="0.9" />
                          <line x1={x1 - 6} y1={y1} x2={x1 + 6} y2={y1} stroke="#ffffff" strokeWidth="1.2" opacity="0.85" />
                          <line x1={x1} y1={y1 - 6} x2={x1} y2={y1 + 6} stroke="#ffffff" strokeWidth="1.2" opacity="0.85" />

                          {showDimensions && (
                            <g transform={`translate(${x1}, ${y1 + 16})`} className="pointer-events-none">
                              <rect x="-26" y="-7" width="52" height="14" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                              <text x="0" y="3" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                Ø COL {lengthM.toFixed(1)}m
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    }

                    return (
                      <g key={seg.id} onClick={(e) => handleSegmentClick(seg.id, e)} className="group cursor-pointer">
                        <rect 
                          x={x1 - 14} 
                          y={y1 - 14} 
                          width="28" 
                          height="28" 
                          rx="4" 
                          fill="rgba(37, 99, 235, 0.22)" 
                          stroke="#38bdf8"
                          strokeWidth="1"
                          className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        />
                        <rect 
                          x={x1 - 9} 
                          y={y1 - 9} 
                          width="18" 
                          height="18" 
                          rx="3" 
                          fill={isSelected ? '#0f172a' : '#2563eb'} 
                          stroke={isSelected ? '#f59e0b' : '#ffffff'} 
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          className="group-hover:fill-amber-500 transition-colors"
                        />
                        <line x1={x1 - 6} y1={y1 - 6} x2={x1 + 6} y2={y1 + 6} stroke="#ffffff" strokeWidth="1.2" opacity="0.85" />
                        <line x1={x1 - 6} y1={y1 + 6} x2={x1 + 6} y2={y1 - 6} stroke="#ffffff" strokeWidth="1.2" opacity="0.85" />

                        {showDimensions && (
                          <g transform={`translate(${x1}, ${y1 + 16})`} className="pointer-events-none">
                            <rect x="-24" y="-7" width="48" height="14" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                            <text x="0" y="3" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              COL {lengthM.toFixed(1)}m
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  }

                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;

                  return (
                    <g key={seg.id} onClick={(e) => handleSegmentClick(seg.id, e)} className="group cursor-pointer">
                      <line 
                        x1={x1} y1={y1} x2={x2} y2={y2} 
                        stroke="transparent" 
                        strokeWidth="18"
                      />
                      <line 
                        x1={x1} y1={y1} x2={x2} y2={y2} 
                        stroke={strokeColor} 
                        strokeWidth={isSelected ? 5 : 3.5}
                        strokeLinecap="round"
                        className="group-hover:stroke-amber-500 transition-colors"
                      />

                      {showDimensions && lengthM > 0.4 && (
                        <g transform={`translate(${midX}, ${midY})`} className="pointer-events-none">
                          <rect x="-30" y="-12" width="60" height="22" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" className="shadow-xs" />
                          <text x="0" y="4" fill="#0f172a" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                            {lengthM.toFixed(2)}m
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* NODOS CON SOPORTE DE ARRASTRE FLUIDO Y ÁREA TÁCTIL */}
                {Object.values(nodes).map(n => {
                  const cx = n.x * scale;
                  const cy = vista === 'planta' ? (n.z || 0) * scale : -n.y * scale;
                  const isSelected = selectedElementIds.includes(n.id);
                  const isStartChain = drawingStartNodeId === n.id;
                  const isBeingDragged = draggingNodeId === n.id;

                  return (
                    <g 
                      key={n.id} 
                      onMouseDown={(e) => handleNodeMouseDown(n.id, e)}
                      onTouchStart={(e) => handleNodeTouchStart(n.id, e)}
                      onClick={(e) => handleNodeClick(n.id, e)}
                      className={`group ${activeTool === 'select' ? (isBeingDragged ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'}`}
                    >
                      <circle cx={cx} cy={cy} r="22" fill="transparent" />

                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={isSelected || isStartChain || isBeingDragged ? 14 : 11} 
                        fill={isBeingDragged ? 'rgba(239, 68, 68, 0.3)' : isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(37, 99, 235, 0.22)'} 
                        stroke={isBeingDragged ? '#ef4444' : isSelected ? '#f59e0b' : '#38bdf8'}
                        strokeWidth="1.5"
                        strokeDasharray={isSelected || isBeingDragged ? '3 2' : 'none'}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                      />

                      {isStartChain && (
                        <circle cx={cx} cy={cy} r="13" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3">
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from={`0 ${cx} ${cy}`}
                            to={`360 ${cx} ${cy}`}
                            dur="4s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      <circle 
                        cx={cx} cy={cy} r={isBeingDragged ? 9.5 : isSelected || isStartChain ? 8.5 : 6.5} 
                        fill={isBeingDragged ? '#ef4444' : isStartChain ? '#f59e0b' : isSelected ? '#0f172a' : n.isFixedSupport ? '#dc2626' : '#2563eb'} 
                        stroke="#ffffff" 
                        strokeWidth={isSelected || isBeingDragged ? 2.5 : 2}
                        className="group-hover:stroke-amber-400 group-hover:brightness-110 transition-colors shadow-sm"
                      />

                      {n.nodeLabel && (
                        <text x={cx + 10} y={cy + 3} fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace" className="pointer-events-none">
                          {n.nodeLabel}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* PREVISUALIZACIÓN RUBBERBAND DE TRAMO LINEAL */}
                {drawingStartNodeId && nodes[drawingStartNodeId] && (
                  <line 
                    x1={rubberbandX1} 
                    y1={rubberbandY1} 
                    x2={rubberbandX2} 
                    y2={rubberbandY2} 
                    stroke="#f59e0b" 
                    strokeWidth="2.5" 
                    strokeDasharray="5 4" 
                  />
                )}

                {/* PREVISUALIZACIÓN DE ARCO PARABÓLICO EN TIEMPO REAL */}
                {activeTool === 'draw_arc' && arcPreviewPoints.length > 1 && (
                  <g className="pointer-events-none">
                    <polyline
                      points={arcPreviewPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="3"
                      strokeDasharray="4 3"
                    />
                    {arcPreviewPoints.map((p, idx) => (
                      <circle key={idx} cx={p.x} cy={p.y} r={idx === 0 || idx === arcPreviewPoints.length - 1 ? 5 : 3.5} fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
                    ))}
                  </g>
                )}

                {/* HERRAMIENTA MEDIR: LÍNEA DE COTA DINÁMICA */}
                {activeTool === 'measure' && measureStartPoint && (
                  <g>
                    <line 
                      x1={measureStartPoint.x * scale} 
                      y1={vista === 'planta' ? measureStartPoint.y * scale : -measureStartPoint.y * scale} 
                      x2={rubberbandX2} 
                      y2={rubberbandY2} 
                      stroke="#38bdf8" 
                      strokeWidth="2" 
                      strokeDasharray="3 3" 
                    />
                    <circle cx={measureStartPoint.x * scale} cy={vista === 'planta' ? measureStartPoint.y * scale : -measureStartPoint.y * scale} r="5" fill="#38bdf8" />
                    {measureDistanceM !== null && (
                      <g transform={`translate(${(measureStartPoint.x * scale + rubberbandX2) / 2}, ${(vista === 'planta' ? measureStartPoint.y * scale : -measureStartPoint.y * scale + rubberbandY2) / 2 - 12})`}>
                        <rect x="-30" y="-10" width="60" height="20" rx="5" fill="#0284c7" />
                        <text x="0" y="4" fill="#ffffff" fontSize="10" fontWeight="black" textAnchor="middle">
                          {measureDistanceM.toFixed(2)} m
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* VISUALIZADOR DE O-SNAP ACTIVO CON SÍMBOLOS GEOMÉTRICOS */}
                {activeSnap && (
                  <g 
                    transform={`translate(${activeSnap.x * scale}, ${vista === 'planta' ? activeSnap.y * scale : -activeSnap.y * scale})`}
                    className="pointer-events-none select-none"
                  >
                    <circle 
                      r="16" 
                      fill="none" 
                      stroke={
                        activeSnap.tipo === 'close_loop' ? '#f59e0b' :
                        activeSnap.tipo === 'intersection' ? '#a855f7' :
                        activeSnap.tipo === 'midpoint' ? '#06b6d4' :
                        activeSnap.tipo === 'nearest_edge' ? '#3b82f6' :
                        '#10b981'
                      } 
                      strokeWidth="1.5" 
                      strokeDasharray="3 3"
                    />

                    {activeSnap.tipo === 'close_loop' && (
                      <g>
                        <circle r="9" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                        <circle r="4" fill="#ffffff" />
                      </g>
                    )}

                    {activeSnap.tipo === 'endpoint' && (
                      <rect 
                        x="-7.5" 
                        y="-7.5" 
                        width="15" 
                        height="15" 
                        transform="rotate(45)"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    )}

                    {activeSnap.tipo === 'midpoint' && (
                      <polygon 
                        points="0,-8 8,7 -8,7" 
                        fill="#06b6d4" 
                        stroke="#ffffff" 
                        strokeWidth="2" 
                      />
                    )}

                    {activeSnap.tipo === 'intersection' && (
                      <g>
                        <circle r="8" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#ffffff" strokeWidth="2" />
                        <line x1="-5" y1="5" x2="5" y2="-5" stroke="#ffffff" strokeWidth="2" />
                      </g>
                    )}

                    {activeSnap.tipo === 'nearest_edge' && (
                      <g>
                        <rect x="-6" y="-6" width="12" height="12" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" rx="2" />
                        <line x1="-3" y1="3" x2="3" y2="3" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="0" y1="-3" x2="0" y2="3" stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    )}

                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#ffffff" strokeWidth="1.2" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#ffffff" strokeWidth="1.2" />

                    <g transform="translate(0, -22)">
                      <rect 
                        x="-90" 
                        y="-11" 
                        width="180" 
                        height="20" 
                        rx="5" 
                        fill="#0f172a" 
                        stroke={
                          activeSnap.tipo === 'close_loop' ? '#f59e0b' :
                          activeSnap.tipo === 'intersection' ? '#a855f7' :
                          activeSnap.tipo === 'midpoint' ? '#06b6d4' :
                          activeSnap.tipo === 'nearest_edge' ? '#3b82f6' :
                          '#10b981'
                        }
                        strokeWidth="1.2"
                      />
                      <text 
                        x="0" 
                        y="3" 
                        fill={
                          activeSnap.tipo === 'close_loop' ? '#fde047' :
                          activeSnap.tipo === 'intersection' ? '#e9d5ff' :
                          activeSnap.tipo === 'midpoint' ? '#a5f3fc' :
                          activeSnap.tipo === 'nearest_edge' ? '#bfdbfe' :
                          '#6ee7b7'
                        }
                        fontSize="9.5" 
                        fontWeight="bold" 
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {activeSnap.label}
                      </text>
                    </g>
                  </g>
                )}

                {/* MENSAJE DE LIENZO EN BLANCO */}
                {Object.keys(nodes).length === 0 && (
                  <g transform="translate(0, 0)" className="pointer-events-none select-none">
                    <text x="0" y="-20" fill="#64748b" fontSize="14" fontWeight="extrabold" textAnchor="middle">
                      LIENZO CAD EN BLANCO
                    </text>
                    <text x="0" y="5" fill="#475569" fontSize="11" textAnchor="middle">
                      Selecciona una herramienta (Viga, Arco, Columna, Tijeral) para comenzar a diseñar.
                    </text>
                  </g>
                )}
              </g>
            </svg>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* INDICADOR HUD DE ARRASTRE DE NODO EN TIEMPO REAL */}
        {/* ------------------------------------------------------------- */}
        {draggingNodeId && nodes[draggingNodeId] && (
          <div className="absolute top-2 inset-x-3 max-w-sm sm:max-w-md mx-auto z-40 bg-slate-900/95 text-white px-3.5 py-2 rounded-2xl shadow-2xl border border-amber-500/80 backdrop-blur-md text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div>
                <div className="font-extrabold text-amber-300 text-xs">
                  Moviendo {nodes[draggingNodeId].nodeLabel || 'Nodo'}
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  X: {cursorCoords.x.toFixed(2)}m | {vista === 'planta' ? `Z: ${cursorCoords.y.toFixed(2)}m` : `Y: ${cursorCoords.y.toFixed(2)}m`}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">Suelta para fijar</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* INDICADOR DE ÁNGULO Y 90° RECTO AL DIBUJAR UNA VIGA/LÍNEA */}
        {/* ------------------------------------------------------------- */}
        {drawingStartNodeId && nodes[drawingStartNodeId] && drawAngleDeg !== null &&
         activeTool !== 'draw_arc' && activeTool !== 'select' && activeTool !== 'pan' && !draggingNodeId && (() => {
          const sNode = nodes[drawingStartNodeId];
          const sx = sNode.x;
          const sy = vista === 'planta' ? (sNode.z || 0) : sNode.y;
          const len = Math.hypot(cursorCoords.x - sx, cursorCoords.y - sy);
          const modAng = ((drawAngleDeg % 90) + 90) % 90;
          const diff90 = Math.min(modAng, 90 - modAng);
          const isRightAngle = diff90 <= 1.2;
          return (
            <div className="absolute bottom-16 sm:bottom-6 inset-x-3 max-w-xs mx-auto z-40 flex items-center justify-center gap-2 pointer-events-none">
              <div className={`px-3 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono flex items-center gap-2.5 border ${
                isRightAngle
                  ? 'bg-emerald-600/95 text-white border-emerald-300'
                  : 'bg-slate-900/95 text-slate-100 border-slate-600'
              }`}>
                <span className="font-black tabular-nums">{len.toFixed(2)} m</span>
                <span className="opacity-50">•</span>
                <span className="tabular-nums">{Math.round(drawAngleDeg)}°</span>
                {isRightAngle && (
                  <span className="flex items-center gap-1 font-black text-[11px]">
                    <span className="text-sm leading-none">⊾</span> 90° RECTO
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* ------------------------------------------------------------- */}
        {/* BANNER DE PASOS Y EVALUACIÓN DE ARCO PARABÓLICO EN TIEMPO REAL */}
        {/* ------------------------------------------------------------- */}
        {activeTool === 'draw_arc' && !draggingNodeId && (() => {
          const arcChordLength = (arcStartPoint && arcEndPoint) 
            ? Math.hypot(arcEndPoint.x - arcStartPoint.x, arcEndPoint.y - arcStartPoint.y) 
            : 0;
          const optimalSagittaVal = Number((arcChordLength * 0.14).toFixed(2));
          const currentSagittaRatio = arcChordLength > 0 ? (arcSagittaM / arcChordLength) : 0;
          const isSagittaGood = currentSagittaRatio >= 0.10 && currentSagittaRatio <= 0.20;
          const isSagittaFlat = currentSagittaRatio < 0.08;
          const isSagittaHigh = currentSagittaRatio > 0.22;

          return (
            <div className="absolute top-2 inset-x-3 max-w-xl mx-auto z-40 bg-purple-950/95 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-purple-400 backdrop-blur-md text-xs flex flex-col gap-2 animate-in fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-purple-800/80 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-purple-600 text-white shrink-0">
                    <Spline className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-purple-200 block truncate">
                      {!arcStartPoint ? 'Paso 1/3: Haz clic en el Apoyo Izquierdo (Cima de Columna)' :
                       !arcEndPoint ? 'Paso 2/3: Haz clic en el Apoyo Derecho (Cima de Columna)' :
                       `Paso 3/3: Flecha de Altura (Luz: ${arcChordLength.toFixed(2)}m)`}
                    </span>
                    <span className="text-[10px] text-purple-300 block truncate">
                      {!arcStartPoint ? (activeSnap ? `✅ ${activeSnap.label} detectado` : 'Acércate al nodo superior de la columna para auto-acople') :
                       !arcEndPoint ? (activeSnap ? `✅ ${activeSnap.label} detectado` : 'Elige el nodo del extremo opuesto de la nave') :
                       'Ajusta la altura de la cúspide según el porcentaje de luz recomendado'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCancelChain}
                  className="px-2.5 py-1 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-200 text-[10px] font-bold cursor-pointer shrink-0"
                >
                  Cancelar
                </button>
              </div>

              {/* EVALUACIÓN DE INGENIERÍA EN TIEMPO REAL AL DIBUJAR ARCO */}
              {arcStartPoint && arcEndPoint && (
                <div className="space-y-2 pt-0.5">
                  {/* DIAGNÓSTICO EN VIVO */}
                  <div className={`p-2 rounded-xl text-[11px] font-medium border flex items-start gap-2 ${
                    isSagittaGood ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' :
                    isSagittaFlat ? 'bg-amber-950/80 border-amber-500 text-amber-200' :
                    'bg-sky-950/80 border-sky-500 text-sky-200'
                  }`}>
                    {isSagittaGood && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                    {isSagittaFlat && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                    {isSagittaHigh && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
                    <div>
                      {isSagittaGood && (
                        <span><strong>¡Excelente Proporción!</strong> Flecha de {arcSagittaM.toFixed(2)}m ({Math.round(currentSagittaRatio * 100)}% de luz {arcChordLength.toFixed(1)}m). Drenaje y resistencia óptimos.</span>
                      )}
                      {isSagittaFlat && (
                        <span><strong>Flecha Baja:</strong> ({arcSagittaM.toFixed(2)}m / {Math.round(currentSagittaRatio * 100)}%). Riesgo de empozar agua de lluvia. Recomendado: mínimo {optimalSagittaVal}m.</span>
                      )}
                      {isSagittaHigh && (
                        <span><strong>Flecha Pronunciada:</strong> ({arcSagittaM.toFixed(2)}m / {Math.round(currentSagittaRatio * 100)}%). Aumenta la altura total y la exposición al viento.</span>
                      )}
                    </div>
                  </div>

                  {/* SELECTORES DE FLECHA Y BOTÓN DE CONFIRMACIÓN */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                      <button
                        onClick={() => handleExecuteArcCreation(optimalSagittaVal)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Flecha Óptima ({optimalSagittaVal}m)</span>
                      </button>
                      
                      {[1.5, 2.0, 2.5, 3.0].map(f => (
                        <button
                          key={f}
                          onClick={() => handleExecuteArcCreation(f)}
                          className="px-2 py-1 rounded-lg bg-purple-800 hover:bg-purple-700 text-white font-bold text-[10px] cursor-pointer shadow-2xs shrink-0"
                        >
                          {f}m
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] text-purple-300">
                      <span className="font-bold">Segmentos:</span>
                      {[6, 8, 10, 12].map(div => (
                        <button
                          key={div}
                          onClick={() => setArcDivisions(div)}
                          className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            arcDivisions === div 
                              ? 'bg-amber-400 text-slate-950 font-black' 
                              : 'bg-purple-900/80 text-purple-200 hover:bg-purple-800'
                          }`}
                        >
                          {div}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleExecuteArcCreation(arcSagittaM)}
                      className="ml-auto px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-md shrink-0 active:scale-95 transition-all"
                    >
                      Confirmar Arco
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ------------------------------------------------------------- */}
        {/* BARRA FLOTANTE DE DIBUJO DE TIJERAL (CATÁLOGO CENTRALIZADO EN ASISTENTE) */}
        {/* ------------------------------------------------------------- */}
        {activeTool === 'draw_tijeral' && !draggingNodeId && (
          <div className="absolute top-2 inset-x-3 max-w-2xl mx-auto z-40 bg-slate-950/95 text-white px-3.5 py-2 rounded-2xl shadow-2xl border-2 border-emerald-500 backdrop-blur-md text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedTrussType}
                    onChange={(e) => setSelectedTrussType(e.target.value as TipoTijeral)}
                    className="bg-slate-900 border border-emerald-400/50 rounded-lg px-2 py-0.5 text-[11px] font-black text-emerald-300 outline-none cursor-pointer"
                  >
                    <option value="escalera_vierendeel">🪜 Tijeral Escalera (Vierendeel)</option>
                    <option value="fink">🏠 Fink (2 Aguas)</option>
                    <option value="pratt">📐 Pratt (Tracción)</option>
                    <option value="howe">🏛️ Howe (Compresión)</option>
                    <option value="warren">⚡ Warren (Zig-zag)</option>
                    <option value="parabolico_warren">🏟️ Parabólico Warren</option>
                  </select>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-black text-[9px] shrink-0">
                    2 Clics
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono mt-0.5">
                  <span>H:</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0.20"
                    max="2.50"
                    value={trussHeightSetting}
                    onChange={(e) => setTrussHeightSetting(Math.max(0.20, parseFloat(e.target.value) || 0.5))}
                    className="w-12 bg-slate-900 border border-slate-700 rounded px-1 py-0.2 text-emerald-300 font-bold text-center"
                  />
                  <span>m • {trussSpacingMode === 'divisiones' ? `${trussDivisionsSetting} espacios` : `c/${trussSpacingSettingM.toFixed(2)}m`}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Selector Rápido de Espacios o Distancia */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
                {trussSpacingMode === 'divisiones' ? (
                  <>
                    <button
                      onClick={() => setTrussSpacingMode('espaciado')}
                      className="text-[9.5px] text-emerald-400 font-bold hover:underline cursor-pointer mr-1"
                      title="Cambiar a espaciado en metros"
                    >
                      Espacios:
                    </button>
                    {[4, 6, 8, 10].map(d => (
                      <button
                        key={d}
                        onClick={() => setTrussDivisionsSetting(d)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                          trussDivisionsSetting === d
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setTrussSpacingMode('divisiones')}
                      className="text-[9.5px] text-emerald-400 font-bold hover:underline cursor-pointer mr-1"
                      title="Cambiar a número de espacios"
                    >
                      Distancia:
                    </button>
                    {[0.40, 0.50, 0.60, 0.80].map(sp => (
                      <button
                        key={sp}
                        onClick={() => setTrussSpacingSettingM(sp)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                          trussSpacingSettingM === sp
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {sp.toFixed(2)}m
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Botón Abrir Asistente Completo */}
              <button
                onClick={() => setShowNovatosWizard(true)}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10.5px] cursor-pointer shadow-xs transition-all flex items-center gap-1"
                title="Abrir Asistente Paramétrico de Techos"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Asistente</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* NOTIFICACIONES DE ARCO O PERÍMETRO */}
        {/* ------------------------------------------------------------- */}
        {(arcNotice || closedPerimeterNotice) && (
          <div className="absolute top-14 inset-x-3 max-w-sm sm:max-w-md mx-auto z-40 flex items-center justify-between gap-2.5 bg-emerald-950/95 text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border-2 border-emerald-400 backdrop-blur-md text-xs animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-full bg-emerald-500 text-slate-950 shrink-0">
                <CheckCircle2 className="w-4 h-4 font-black" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-emerald-300 text-xs block truncate">
                  {arcNotice ? 'Arco Creado' : 'Perímetro Cerrado'}
                </span>
                <span className="text-[11px] text-emerald-100 block truncate">
                  {arcNotice || closedPerimeterNotice}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setArcNotice(null); setClosedPerimeterNotice(null); }}
              className="p-1 text-emerald-300 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* BANNER FLOTANTE DE ENCADENAMIENTO DE TRAZO */}
        {/* ------------------------------------------------------------- */}
        {drawingStartNodeId && activeTool !== 'draw_arc' && !draggingNodeId && (
          <div className="absolute top-2 inset-x-3 max-w-sm sm:max-w-md mx-auto z-30 flex items-center justify-between gap-2 bg-slate-900/95 text-white px-3.5 py-2 rounded-2xl shadow-2xl border border-amber-400/60 backdrop-blur-md text-xs animate-in fade-in pointer-events-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-extrabold text-amber-300 text-[11px] block truncate">
                  Trazando tramo continuo (acople activo)
                </span>
                <span className="text-[10px] text-slate-300 block truncate">
                  Haz clic en el siguiente punto o nodo
                </span>
              </div>
            </div>
            <button
              onClick={handleCancelChain}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 text-xs font-black cursor-pointer shadow-md active:scale-95 transition-all flex items-center gap-1.5 pointer-events-auto"
              title="Terminar el trazo actual (o tecla Esc)"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Terminar trazo</span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUMILLA FLOTANTE DE CONTROLES CAD Y ATAJOS (DESPLEGABLE) */}
        {/* ------------------------------------------------------------- */}
        {showControlsSumilla && (
          <div 
            onWheel={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 z-40 w-80 max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3.5 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-100 text-purple-700">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                  Sumilla de Controles CAD
                </h3>
              </div>
              <button
                onClick={() => setShowControlsSumilla(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-[11px] text-slate-700 max-h-72 overflow-y-auto pr-1">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-amber-600" />
                  Mover Nodos Libremente
                </div>
                <div className="text-slate-600">
                  En modo <strong>Seleccionar</strong>, haz clic sostenido sobre cualquier nodo y arrástralo a donde necesites. Se actualizará en vivo.
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Spline className="w-3.5 h-3.5 text-purple-600" />
                  Trazar Arco Parabólico
                </div>
                <div className="text-slate-600">
                  1) Clic punto inicio $\rightarrow$ 2) Clic punto final $\rightarrow$ 3) Clic para definir la flecha o usa los botones rápidos.
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                  Trazar Vigas y Barras
                </div>
                <div className="text-slate-600">
                  Clic inicial $\rightarrow$ Clic final. Conecta nodos existentes o crea nuevos de forma encadenada continua.
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                  Snaps Inteligentes (O-Snap)
                </div>
                <div className="text-slate-600 text-[10px] space-y-0.5">
                  <div>• 🟩 <strong>Extremos:</strong> Imantación a nodos existentes.</div>
                  <div>• ▲ <strong>Puntos Medios:</strong> Centro exacto de barras.</div>
                  <div>• ✕ <strong>Intersecciones:</strong> Cruces exactos entre perfiles.</div>
                  <div>• 🟢 <strong>Cierre de Perímetro:</strong> Clic en el nodo origen.</div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-sky-600" />
                  Navegación y Zoom
                </div>
                <div className="text-slate-600">
                  • <strong>Rueda de ratón:</strong> Aumentar o disminuir Zoom.<br/>
                  • <strong>Clic rueda / Shift + Arrastre:</strong> Mover lienzo (Pan).<br/>
                  • <strong>Clic secundario / Esc:</strong> Cancelar trazo activo.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ASISTENTE PARAMÉTRICO DE TECHOS 1-CLIC PARA PRINCIPIANTES */}
        {/* ------------------------------------------------------------- */}
        {engineState && (
          <TechosNovatosWizardModal
            isOpen={showNovatosWizard}
            onClose={() => setShowNovatosWizard(false)}
            engineState={engineState}
            onChangeVista={handleSetVista}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL: COLUMNAS POR MEDIDAS EXACTAS */}
        {/* ------------------------------------------------------------- */}
        {showColumnasExactas && (
          <TechosColumnasExactasModal
            engineState={engineState}
            onClose={() => setShowColumnasExactas(false)}
            onDone={() => { try { handleSetVista('planta'); } catch (_) { /* no-op */ } }}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL PARA INSERTAR TRAMO POR COTA NUMÉRICA */}
        {/* ------------------------------------------------------------- */}
        {showDimensionModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm uppercase">Tramo Numérico</h3>
                    <p className="text-[11px] text-slate-500">Longitud y ángulo de inclinación</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDimensionModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitud del tramo (mm):</label>
                  <input
                    type="number"
                    step="100"
                    value={inputLengthMm}
                    onChange={(e) => setInputLengthMm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-sm focus:border-amber-500 outline-none"
                    placeholder="4000"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Equivale a {((parseFloat(inputLengthMm) || 0) / 1000).toFixed(2)} metros
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ángulo de inclinación (° grados):</label>
                  <input
                    type="number"
                    step="1"
                    value={inputAngleDeg}
                    onChange={(e) => setInputAngleDeg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold text-sm focus:border-amber-500 outline-none"
                    placeholder="0"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[0, 10, 15, 20, 90].map(deg => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setInputAngleDeg(deg.toString())}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 font-mono text-[10px] font-bold cursor-pointer"
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDimensionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddNumericLine}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer active:scale-95 transition-transform"
                >
                  Insertar Tramo
                </button>
              </div>
            </div>
          </div>
        )}
        {/* GUÍA DE LIENZO VACÍO: invita a usar el Asistente paramétrico.
            Se oculta si ya eligieron una herramienta de dibujo, para no tapar
            los toques/clics destinados a dibujar (sobre todo en móvil). */}
        {Object.keys(nodes).length === 0 && vista !== '3d' && !isDrawingTool && (
          <div className="absolute inset-0 z-30 flex items-center justify-center lg:justify-end lg:pr-12 p-4 pointer-events-none">
            <div className="pointer-events-auto max-w-xs w-full bg-white/95 backdrop-blur-md border border-amber-200 rounded-3xl shadow-2xl p-5 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Empieza tu techo en 1 paso</h3>
              <p className="text-[12px] text-slate-500 leading-relaxed">
                La forma más fácil: elige el tipo de techo e ingresa tus medidas
                (luz, largo, altura). El sistema lo dibuja y ensambla por ti.
              </p>
              <button
                onClick={() => setShowNovatosWizard(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Crear techo con medidas</span>
              </button>
              <p className="text-[11px] text-slate-400">
                O usa las herramientas 🔧 para dibujarlo a mano.
              </p>
            </div>
          </div>
        )}

        {/* PANEL FLOTANTE DE HERRAMIENTAS CAD COMPLETO / COLAPSADO */}
        {/* CHIP DE RETÍCULA / SNAP (dock derecho, estilo Herrería): mantiene el
            ajuste de snap más usado accesible sin abrir el panel central. */}
        {engineState && vista !== '3d' && (
          <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl shadow-xl border border-slate-200 pointer-events-auto">
            <Grid className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">Rejilla</span>
            <select
              value={engineState.snapGridSizeM}
              onChange={(e) => engineState.setSnapGridSizeM(parseFloat(e.target.value) || 0.25)}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-1.5 py-0.5 text-slate-800 font-mono font-bold text-[11px] cursor-pointer focus:border-amber-500 outline-none"
              title="Paso de la retícula magnética (snap)"
            >
              <option value={0.1}>0.10m</option>
              <option value={0.25}>0.25m</option>
              <option value={0.5}>0.50m</option>
              <option value={1.0}>1.00m</option>
            </select>
          </div>
        )}

        {showFloatingToolsPanel && vista !== '3d' && (
          isToolsPanelCollapsed ? (
            /* VERSIÓN COLAPSADA / MINIMIZADA (Súper compacta, arrastrable) */
            <button
              onPointerDown={handleToolsPanelPointerDown}
              onPointerMove={handleToolsPanelPointerMove}
              onPointerUp={handleToolsPanelPointerUp}
              onClick={() => setIsToolsPanelCollapsed(false)}
              className={`absolute z-40 h-12 rounded-2xl border flex items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing shadow-2xl hover:scale-105 active:scale-95 transition-all drag-handle-tools group ${
                isDrawingTool
                  ? 'px-3 bg-amber-500 border-amber-400 text-slate-950'
                  : 'w-12 bg-slate-900 border-amber-500/80 hover:border-amber-400'
              }`}
              style={{
                left: `${floatingToolsPanelPos.x}px`,
                top: `${floatingToolsPanelPos.y}px`,
              }}
              title={isDrawingTool ? `Dibujando: ${TOOL_LABELS[activeTool] || activeTool}. Toca para ver herramientas.` : 'Expandir Herramientas CAD (Arrastrable)'}
            >
              <Wrench className={`w-5 h-5 shrink-0 group-hover:rotate-12 transition-transform duration-300 ${isDrawingTool ? 'text-slate-950' : 'text-amber-500'}`} />
              {isDrawingTool && (
                <span className="text-[11px] font-black whitespace-nowrap pr-0.5">{TOOL_LABELS[activeTool] || 'Dibujar'}</span>
              )}
            </button>
          ) : (
            /* VERSIÓN COMPLETA: arrastrable en escritorio, hoja inferior en móvil */
            <div
              style={
                isDesktop
                  ? {
                      position: 'absolute',
                      left: `${floatingToolsPanelPos.x}px`,
                      top: `${floatingToolsPanelPos.y}px`,
                    }
                  : {
                      position: 'absolute',
                      left: 8,
                      right: 8,
                      bottom: 8,
                      maxHeight: '48vh',
                      overflowY: 'auto',
                    }
              }
              onPointerDown={isDesktop ? handleToolsPanelPointerDown : undefined}
              onPointerMove={isDesktop ? handleToolsPanelPointerMove : undefined}
              onPointerUp={isDesktop ? handleToolsPanelPointerUp : undefined}
              className={`z-40 ${isDesktop ? 'w-72' : 'w-auto'} bg-slate-900/95 text-white border border-slate-700/60 rounded-3xl shadow-2xl p-3.5 space-y-3.5 backdrop-blur-md select-none`}
            >
              {/* Cabecera del Panel con drag handle */}
              <div className="drag-handle-tools flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <GripHorizontal className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-black text-[11px] uppercase tracking-wider text-amber-400">Panel de Control CAD</span>
                </div>
                <button
                  onClick={() => setIsToolsPanelCollapsed(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  title="Colapsar panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Listado de herramientas precisas (sin duplicidades) */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5 scrollbar-none">
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'select', label: 'Seleccionar', icon: MousePointer, color: 'text-slate-300', bg: 'bg-white/10' },
                    { id: 'draw_line', label: 'Viga', icon: PenTool, color: 'text-rose-400', bg: 'bg-rose-500/20' },
                    { id: 'draw_arc', label: 'Arco Curvo', icon: Spline, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                    { id: 'draw_col', label: 'Columna', icon: Columns, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                    { id: 'draw_tijeral', label: 'Tijeral', icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                    { id: 'draw_correa', label: 'Correa', icon: Grid, color: 'text-lime-400', bg: 'bg-lime-500/20' },
                    { id: 'draw_arriostre', label: 'Cruz', icon: Crosshair, color: 'text-pink-400', bg: 'bg-pink-500/20' },
                    { id: 'measure', label: 'Medir', icon: Ruler, color: 'text-sky-400', bg: 'bg-sky-500/20' },
                  ].map(tool => {
                    const Icon = tool.icon;
                    const isSelected = activeTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setTool(tool.id as ToolModoCad)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : tool.color}`} />
                        <span>{tool.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MODO DE TRAZO: cadena continua vs. viga suelta */}
              <div className="border-t border-slate-800 pt-3">
                <span className="block font-black text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">Modo de trazo</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setChainMode(true)}
                    className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      chainMode ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm' : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                    }`}
                    title="Cada clic continúa la línea anterior (ideal para tijerales y perímetros)"
                  >
                    <Spline className="w-3.5 h-3.5 shrink-0" />
                    <span>Encadenado</span>
                  </button>
                  <button
                    onClick={() => { setChainMode(false); handleCancelChain(); }}
                    className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      !chainMode ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm' : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                    }`}
                    title="Cada par de clics crea una viga independiente (no se enlazan)"
                  >
                    <PenTool className="w-3.5 h-3.5 shrink-0" />
                    <span>Viga suelta</span>
                  </button>
                </div>
              </div>

              {/* SECCIÓN EDICIÓN: COPIAR, PEGAR, ELIMINAR */}
              <div className="border-t border-slate-800 pt-3 space-y-2">
                <span className="block font-black text-[9px] uppercase tracking-wider text-slate-400">Edición Rápida</span>
                <div className="flex items-center gap-1.5">
                  {/* Copiar */}
                  <button
                    onClick={() => {
                      engineState?.copySelectedElements();
                      setArcNotice('📋 ¡Elemento copiado al portapapeles!');
                      setTimeout(() => setArcNotice(null), 2500);
                    }}
                    disabled={selectedElementIds.length === 0}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 text-[10px] font-black flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Copiar elementos seleccionados (CTRL+C)"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-400" />
                    <span>Copiar</span>
                  </button>

                  {/* Pegar */}
                  <button
                    onClick={() => {
                      engineState?.pasteElements();
                      setArcNotice('📋 ¡Elemento pegado con éxito!');
                      setTimeout(() => setArcNotice(null), 2500);
                    }}
                    disabled={!engineState?.canPaste}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 text-[10px] font-black flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Pegar elementos copiados (CTRL+V)"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pegar</span>
                  </button>
                </div>

                {/* Eliminar exacto */}
                {selectedElementIds.length > 0 && (
                  <button
                    onClick={() => engineState?.deleteSelectedElements()}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                    title="Eliminar elemento seleccionado (Supr / Backspace)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-950" />
                    <span>Eliminar seleccionado ({selectedElementIds.length})</span>
                  </button>
                )}
              </div>

              {/* Selector de Perfil Activo */}
              <div className="border-t border-slate-800 pt-3 space-y-1.5">
                <span className="block font-black text-[9px] uppercase tracking-wider text-slate-400">Perfil de Acero Activo</span>
                <select
                  value={engineState?.activeProfileId}
                  onChange={(e) => engineState?.setActiveProfileId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-1.5 text-white font-bold text-[10px] truncate outline-none cursor-pointer focus:border-amber-500"
                >
                  {PERFILES_TECHOS_AGRUPADOS.map(grp => (
                    <optgroup key={grp.norma} label={grp.label} className="bg-slate-900 text-amber-300 font-bold">
                      {grp.items.map((p: any) => (
                        <option key={p.id} value={p.id} className="bg-slate-800 text-white font-medium">
                          {p.nombre} ({p.codigoComercial})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Ajuste de Snap Grid & Deshacer/Rehacer */}
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                  <button
                    onClick={() => engineState?.undo()}
                    disabled={!engineState?.canUndo}
                    className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                    title="Deshacer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => engineState?.redo()}
                    disabled={!engineState?.canRedo}
                    className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                    title="Rehacer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Botón Guardar / Restaurar */}
                <button
                  onClick={handleAutoRepairCloseNodes}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-extrabold text-[10px] flex items-center gap-1 cursor-pointer"
                  title="Alinear y empalmar nodos automáticamente"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Empalmar</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TechosCanvas2D;
