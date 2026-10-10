// Centro CAD Paramétrico 2D para Herrería y Carpintería Metálica
// Construcción pieza por pieza desde lienzo en blanco con referencias geométricas (SNAP) y medidas paramétricas
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Maximize2, 
  Lock,
  Compass,
  MousePointer,
  Hand,
  Minus as LineIcon,
  MoveRight,
  MoveUp,
  Square,
  Circle,
  Layers,
  Ruler,
  Trash2,
  Copy,
  RotateCw,
  FlipHorizontal,
  Eye,
  Grid,
  Magnet,
  FolderOpen,
  X,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { 
  HerreriaDesign, 
  VistaHerreria, 
  PiezaCad, 
  HerramientaCad,
  MaterialFamilia,
  TipoAccesorioCad,
  TipoCorteCad
} from './herreriaTypes';
import { PERFILES_CATALOGO, generarPiezasCadDesdeDiseno, getNormaAcabadoPerfil } from './herreriaCatalog';
import { HerreriaViewer3D } from './HerreriaViewer3D';
import { HerreriaSelectedType } from './HerreriaPropertiesPanel';
import { findBestSnapPoint, SnapResult, distance2D, roundToPrecision } from './cadSnapEngine';
import { HerreriaContextMenu, ContextMenuPosition } from './HerreriaContextMenu';
import { CadGesturesAndShortcutsModal } from '../common/CadGesturesAndShortcutsModal';

function distancePointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

interface HerreriaCanvas2DProps {
  design: HerreriaDesign;
  onUpdateDesign: (updated: HerreriaDesign) => void;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null, type: HerreriaSelectedType) => void;
  onOpenInspector?: () => void;
  isInspectorOpen?: boolean;
  onNuevo?: () => void;
  vistaActiva?: VistaHerreria;
  onChangeVista?: (v: VistaHerreria) => void;
  onOpenTemplates?: () => void;
}

export const HerreriaCanvas2D: React.FC<HerreriaCanvas2DProps> = ({
  design,
  onUpdateDesign,
  selectedElementId = null,
  onSelectElement = () => {},
  onOpenInspector,
  isInspectorOpen = false,
  vistaActiva,
  onChangeVista,
  onOpenTemplates
}) => {
  const [internalVista, setInternalVista] = useState<VistaHerreria>('frontal');
  const currentVista = vistaActiva ?? internalVista;
  const handleVistaChange = (v: VistaHerreria) => {
    onSelectElement(null, null);
    setHerramienta('select');
    setDrawStep(0);
    setStartPoint(null);
    if (onChangeVista) onChangeVista(v);
    else setInternalVista(v);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Navegación (Zoom y Paneo)
  const [zoom, setZoom] = useState(1.45);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  // Herramientas CAD
  const [herramienta, setHerramienta] = useState<HerramientaCad>('select');
  const [perfilActivoId, setPerfilActivoId] = useState<string>('rect-2x1-1.5');
  const [filtroNormaHerreria, setFiltroNormaHerreria] = useState<'TODOS' | 'LAC' | 'GALVANIZADO' | 'LAF' | 'ASTM'>('TODOS');
  const materialActivo: MaterialFamilia = 'acero';
  
  // Opciones de SNAP
  const [snapEndpoints, setSnapEndpoints] = useState(true);
  const [snapMidpoints, setSnapMidpoints] = useState(true);
  const [snapSegments, setSnapSegments] = useState(true);
  const snapIntersections = true;
  const [snapGrid, setSnapGrid] = useState(true);
  const gridStepM = 0.05; // 5cm
  const [orthoLock, setOrthoLock] = useState(false);

  // Estado de Dibujo en progreso
  const [drawStep, setDrawStep] = useState<0 | 1 | 2>(0);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [arcEndPoint, setArcEndPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentWorldPointer, setCurrentWorldPointer] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeSnap, setActiveSnap] = useState<SnapResult | null>(null);

  // Estados de Colapso y Menús Desplegables Compactos para Móvil / Tablet / PC
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [showConfigDropdown, setShowConfigDropdown] = useState(false);
  const [isSnapCollapsed, setIsSnapCollapsed] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  // Helper para scroll horizontal con rueda del mouse en barras de herramientas
  const handleHorizontalWheel = (e: React.WheelEvent<HTMLElement>) => {
    if (e.deltaY !== 0) {
      e.stopPropagation();
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // Diálogo para accesorio rápido
  const [showAccPicker, setShowAccPicker] = useState(false);
  const [accDropPos, setAccDropPos] = useState<{ x: number; y: number } | null>(null);

  // Menú contextual avanzado y modal de atajos
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Referencias para arrastre y paneo con mouse
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);

  // Referencias para gestos táctiles móviles
  const touchDistanceRef = useRef<number | null>(null);
  const touchMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const draggingElementRef = useRef<{ 
    id: string; 
    type?: 'pieza' | 'accesorio' | 'plancha';
    handle: 'start' | 'end' | 'body' | 'acc'; 
    initialP1: { x: number; y: number }; 
    initialP2: { x: number; y: number };
    dragStartWorldPt: { x: number; y: number };
    initialAccPos?: { x: number; y: number };
  } | null>(null);

  const scalePxPerM = 220; // 1 metro = 220px base

  const centerOriginX = (containerRef.current?.clientWidth || 800) / 2 - 50 + pan.x;
  const centerOriginY = (containerRef.current?.clientHeight || 500) * 0.75 + pan.y;

  // Convertir pantalla -> Mundo CAD (metros)
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const xRel = screenX - rect.left;
    const yRel = screenY - rect.top;

    const wx = (xRel - centerOriginX) / (scalePxPerM * zoom);
    const wy = (centerOriginY - yRel) / (scalePxPerM * zoom); // Eje Y hacia arriba
    return { x: roundToPrecision(wx, 3), y: roundToPrecision(wy, 3) };
  }, [centerOriginX, centerOriginY, zoom]);

  // Convertir Mundo CAD (metros) -> pantalla (px)
  const worldToScreen = useCallback((wx: number, wy: number) => {
    const sx = centerOriginX + wx * scalePxPerM * zoom;
    const sy = centerOriginY - wy * scalePxPerM * zoom;
    return { x: sx, y: sy };
  }, [centerOriginX, centerOriginY, zoom]);

  const handleZoom = (factor: number) => {
    const newZoom = Math.min(4, Math.max(0.2, zoom * factor));
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const scaleChange = newZoom / zoom;
      
      setPan(p => ({
        x: centerX - (centerX - p.x) * scaleChange,
        y: centerY - (centerY - p.y) * scaleChange
      }));
      setZoom(newZoom);
    }
  };

  // Resetear vista
  const centerView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Auto-sincronizar piezas CAD SOLO si es una plantilla precargada del catálogo sin piezas generadas
  useEffect(() => {
    // Si es un lienzo en blanco o diseño personalizado vacío, NO auto-generar piezas
    if (design.isLienzoBlanco || design.tipoElemento === 'personalizado') {
      return;
    }
    if (!design.piezas || design.piezas.length === 0) {
      const generated = generarPiezasCadDesdeDiseno(design);
      if (generated.piezas.length > 0) {
        onUpdateDesign({
          ...design,
          piezas: generated.piezas,
          accesoriosCad: (design.accesoriosCad && design.accesoriosCad.length > 0) ? design.accesoriosCad : generated.accesoriosCad,
          cotasCad: (design.cotasCad && design.cotasCad.length > 0) ? design.cotasCad : generated.cotasCad
        });
      }
    }
  }, [design.id]);

  // Si se crea un lienzo en blanco nuevo, resetear zoom y centrar
  useEffect(() => {
    if (!design.piezas || design.piezas.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [design.id]);

  // Piezas existentes
  const piezas = design.piezas || [];
  const accesorios = design.accesoriosCad || [];
  const cotas = design.cotasCad || [];

  // Puntero y SNAP en tiempo real
  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerDownPosRef.current) {
      const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
      if (dist > 5) {
        hasDraggedRef.current = true;
      }
    }

    if (isPanning || isPanningRef.current) {
      hasDraggedRef.current = true;
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y
      });
      return;
    }

    const rawPt = screenToWorld(e.clientX, e.clientY);
    
    // Aplicar ortogonal si está activo
    let targetPt = { ...rawPt };
    if ((orthoLock || herramienta === 'horizontal' || herramienta === 'vertical') && startPoint) {
      if (herramienta === 'horizontal' || (orthoLock && Math.abs(targetPt.x - startPoint.x) >= Math.abs(targetPt.y - startPoint.y))) {
        targetPt.y = startPoint.y;
      } else if (herramienta === 'vertical' || orthoLock) {
        targetPt.x = startPoint.x;
      }
    }

    // Buscar SNAP (con detección milimétrica de contacto adyacente cara con cara y alineación ortogonal recta)
    const snap = findBestSnapPoint(targetPt, piezas, 0.08 / zoom, {
      snapEndpoints,
      snapMidpoints,
      snapIntersections,
      snapSegments,
      snapGrid,
      snapAdjacent: true,
      snapOrthoLock: orthoLock,
      startPoint: startPoint || undefined,
      currentProfileId: perfilActivoId,
      gridStepM
    });

    const finalPt = snap.type !== 'none' ? { x: snap.x, y: snap.y } : targetPt;
    setCurrentWorldPointer(finalPt);
    setActiveSnap(snap.type !== 'none' ? snap : null);

    // Si se está arrastrando una pieza o accesorio existente en modo 'select' (NUNCA panear el lienzo)
    if (draggingElementRef.current && herramienta === 'select') {
      hasDraggedRef.current = true;
      const dragInfo = draggingElementRef.current;
      const refStartX = dragInfo.dragStartWorldPt ? dragInfo.dragStartWorldPt.x : dragInfo.initialP1.x;
      const refStartY = dragInfo.dragStartWorldPt ? dragInfo.dragStartWorldPt.y : dragInfo.initialP1.y;
      const deltaX = finalPt.x - refStartX;
      const deltaY = finalPt.y - refStartY;

      if (dragInfo.type === 'accesorio') {
        const targetAcc = accesorios.find(a => a.id === dragInfo.id);
        if (targetAcc && dragInfo.initialAccPos) {
          const updatedAcc = {
            ...targetAcc,
            x: roundToPrecision(dragInfo.initialAccPos.x + deltaX),
            y: roundToPrecision(dragInfo.initialAccPos.y + deltaY)
          };
          onUpdateDesign({
            ...design,
            accesoriosCad: accesorios.map(a => a.id === targetAcc.id ? updatedAcc : a)
          });
        }
      } else {
        const targetPieza = piezas.find(p => p.id === dragInfo.id);
        if (targetPieza) {
          let updated = { ...targetPieza };
          if (dragInfo.handle === 'start') {
            updated.x1 = finalPt.x;
            updated.y1 = finalPt.y;
            updated.longitudM = roundToPrecision(distance2D(updated.x1, updated.y1, updated.x2, updated.y2));
          } else if (dragInfo.handle === 'end') {
            updated.x2 = finalPt.x;
            updated.y2 = finalPt.y;
            updated.longitudM = roundToPrecision(distance2D(updated.x1, updated.y1, updated.x2, updated.y2));
          } else if (dragInfo.handle === 'body') {
            updated.x1 = roundToPrecision(dragInfo.initialP1.x + deltaX);
            updated.y1 = roundToPrecision(dragInfo.initialP1.y + deltaY);
            updated.x2 = roundToPrecision(dragInfo.initialP2.x + deltaX);
            updated.y2 = roundToPrecision(dragInfo.initialP2.y + deltaY);
          }
          onUpdateDesign({
            ...design,
            piezas: piezas.map(p => p.id === targetPieza.id ? updated : p)
          });
        }
      }
      return;
    }

    if (isPanning || isPanningRef.current) {
      hasDraggedRef.current = true;
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y
      });
      return;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;

    // Si fue clic derecho o botón medio o clic con Alt -> Pan
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      isPanningRef.current = true;
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    if (e.button !== 0) return; // Sólo clic izquierdo

    // Si estamos en la herramienta 'mover' -> Pan del lienzo
    if ((herramienta as string) === 'mover') {
      setIsPanning(true);
      isPanningRef.current = true;
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      return;
    }

    const clickedTarget = e.target as Element;
    const isBgClick = clickedTarget.id === 'cad-background-grid-rect' || 
                      clickedTarget.id === 'cad-grid-bg' || 
                      clickedTarget.tagName.toLowerCase() === 'svg';

    // Si estamos en modo SELECT
    if (herramienta === 'select') {
      if (isBgClick) {
        onSelectElement(null, null);
      }
      return;
    }

    // Calcular coordenadas exactas para trazado con snap directo
    const rawPt = screenToWorld(e.clientX, e.clientY);
    let targetPt = { ...rawPt };
    if ((orthoLock || herramienta === 'horizontal' || herramienta === 'vertical') && startPoint) {
      if (herramienta === 'horizontal' || (orthoLock && Math.abs(targetPt.x - startPoint.x) >= Math.abs(targetPt.y - startPoint.y))) {
        targetPt.y = startPoint.y;
      } else if (herramienta === 'vertical' || orthoLock) {
        targetPt.x = startPoint.x;
      }
    }

    const snap = findBestSnapPoint(targetPt, piezas, 0.08 / zoom, {
      snapEndpoints,
      snapMidpoints,
      snapIntersections,
      snapSegments,
      snapGrid,
      snapAdjacent: true,
      snapOrthoLock: orthoLock,
      startPoint: startPoint || undefined,
      currentProfileId: perfilActivoId,
      gridStepM
    });

    const clickPt = snap.type !== 'none' ? { x: snap.x, y: snap.y } : targetPt;
    setCurrentWorldPointer(clickPt);
    if (snap.type !== 'none') {
      setActiveSnap(snap);
    }

    // Herramienta ACCESORIO
    if (herramienta === 'accesorio') {
      setAccDropPos(clickPt);
      setShowAccPicker(true);
      setHerramienta('select');
      return;
    }

    // Herramientas de dibujo que requieren 2 o 3 puntos
    const isDrawingTool = [
      'linea', 
      'horizontal', 
      'vertical', 
      'diagonal', 
      'rectangulo', 
      'arco', 
      'plancha', 
      'platina_tope', 
      'cota'
    ].includes(herramienta);

    if (!isDrawingTool) {
      return;
    }

    if (drawStep === 0) {
      // Elegir punto de inicio con máxima precisión
      setStartPoint(clickPt);
      setArcEndPoint(null);
      setDrawStep(1);
    } else if (drawStep === 1 && startPoint) {
      const clickDist = distance2D(startPoint.x, startPoint.y, clickPt.x, clickPt.y);
      if (clickDist < 0.05) {
        // Si el segundo clic es prácticamente en el mismo punto (< 5cm), reubicar origen de trazo
        setStartPoint(clickPt);
        return;
      }
      if (herramienta === 'arco') {
        // En herramienta ARCO: el segundo clic fija el punto final y pasa a modo arqueo interactivo
        setArcEndPoint(clickPt);
        setDrawStep(2);
      } else {
        finalizarDibujo(startPoint, clickPt);
      }
    } else if (drawStep === 2 && startPoint && arcEndPoint && herramienta === 'arco') {
      // Tercer clic en herramienta ARCO: fija la curvatura exacta en vivo
      finalizarArco3Puntos(startPoint, arcEndPoint, clickPt);
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    isPanningRef.current = false;
    draggingElementRef.current = null;
    setTimeout(() => {
      hasDraggedRef.current = false;
      pointerDownPosRef.current = null;
    }, 120);
  };

  // Finalizar creación de pieza según la herramienta activa
  const finalizarDibujo = (p1: { x: number; y: number }, p2: { x: number; y: number }, forcedLengthM?: number) => {
    let finalP2 = { ...p2 };

    // Si se especificó una medida exacta manual
    if (forcedLengthM !== undefined && forcedLengthM > 0) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const curDist = Math.hypot(dx, dy);
      if (curDist > 0.001) {
        finalP2 = {
          x: roundToPrecision(p1.x + (dx / curDist) * forcedLengthM),
          y: roundToPrecision(p1.y + (dy / curDist) * forcedLengthM)
        };
      } else {
        finalP2 = {
          x: roundToPrecision(p1.x + forcedLengthM),
          y: p1.y
        };
      }
    }

    const distM = roundToPrecision(distance2D(p1.x, p1.y, finalP2.x, finalP2.y));
    if (distM < 0.05 && herramienta !== 'rectangulo') {
      setDrawStep(0);
      setStartPoint(null);
      return;
    }

    const perfil = PERFILES_CATALOGO.find(p => p.id === perfilActivoId) || PERFILES_CATALOGO[0];
    const newPiezas = [...piezas];
    const timestamp = Date.now();

    if (herramienta === 'rectangulo') {
      // Crea 4 piezas formando un marco perimétrico cerrado
      const minX = Math.min(p1.x, finalP2.x);
      const maxX = Math.max(p1.x, finalP2.x);
      const minY = Math.min(p1.y, finalP2.y);
      const maxY = Math.max(p1.y, finalP2.y);
      const ancho = roundToPrecision(maxX - minX);
      const alto = roundToPrecision(maxY - minY);

      if (ancho >= 0.05 && alto >= 0.05) {
        const nextIdx = newPiezas.length + 1;
        // 1. Travesaño Inferior
        newPiezas.push({
          id: `p-${timestamp}-inf`,
          marca: `P-${String(nextIdx).padStart(2, '0')}`,
          nombre: `Travesaño Inferior (${ancho.toFixed(2)}m)`,
          tipo: 'perfil',
          material: materialActivo,
          perfilId: perfilActivoId,
          x1: minX, y1: minY, z1: 0,
          x2: maxX, y2: minY, z2: 0,
          longitudM: ancho,
          rotacionDeg: 0,
          corteInicio: '45°',
          corteFin: '45°',
          cantidad: 1,
          grupo: 'marco'
        });
        // 2. Parante Izquierdo
        newPiezas.push({
          id: `p-${timestamp}-izq`,
          marca: `P-${String(nextIdx + 1).padStart(2, '0')}`,
          nombre: `Parante Izquierdo (${alto.toFixed(2)}m)`,
          tipo: 'perfil',
          material: materialActivo,
          perfilId: perfilActivoId,
          x1: minX, y1: minY, z1: 0,
          x2: minX, y2: maxY, z2: 0,
          longitudM: alto,
          rotacionDeg: 0,
          corteInicio: '45°',
          corteFin: '45°',
          cantidad: 1,
          grupo: 'marco'
        });
        // 3. Parante Derecho
        newPiezas.push({
          id: `p-${timestamp}-der`,
          marca: `P-${String(nextIdx + 2).padStart(2, '0')}`,
          nombre: `Parante Derecho (${alto.toFixed(2)}m)`,
          tipo: 'perfil',
          material: materialActivo,
          perfilId: perfilActivoId,
          x1: maxX, y1: minY, z1: 0,
          x2: maxX, y2: maxY, z2: 0,
          longitudM: alto,
          rotacionDeg: 0,
          corteInicio: '45°',
          corteFin: '45°',
          cantidad: 1,
          grupo: 'marco'
        });
        // 4. Cabezal Superior
        newPiezas.push({
          id: `p-${timestamp}-sup`,
          marca: `P-${String(nextIdx + 3).padStart(2, '0')}`,
          nombre: `Cabezal Superior (${ancho.toFixed(2)}m)`,
          tipo: 'perfil',
          material: materialActivo,
          perfilId: perfilActivoId,
          x1: minX, y1: maxY, z1: 0,
          x2: maxX, y2: maxY, z2: 0,
          longitudM: ancho,
          rotacionDeg: 0,
          corteInicio: '45°',
          corteFin: '45°',
          cantidad: 1,
          grupo: 'marco'
        });
      }
    } else if (herramienta === 'plancha') {
      const minX = Math.min(p1.x, finalP2.x);
      const maxX = Math.max(p1.x, finalP2.x);
      const minY = Math.min(p1.y, finalP2.y);
      const maxY = Math.max(p1.y, finalP2.y);
      const ancho = roundToPrecision(maxX - minX);
      const alto = roundToPrecision(maxY - minY);
      const nextIdx = newPiezas.length + 1;
      newPiezas.push({
        id: `p-${timestamp}-pl`,
        marca: `PL-${String(nextIdx).padStart(2, '0')}`,
        nombre: `Plancha Metálica (${ancho.toFixed(2)}m x ${alto.toFixed(2)}m)`,
        tipo: 'plancha',
        material: materialActivo,
        perfilId: perfilActivoId,
        x1: minX, y1: minY, z1: 0,
        x2: maxX, y2: maxY, z2: 0,
        longitudM: ancho,
        rotacionDeg: 0,
        corteInicio: '90°',
        corteFin: '90°',
        esPlancha: true,
        anchoPlanchaM: ancho,
        altoPlanchaM: alto,
        espesorPlanchaMm: 1.5,
        tipoRelleno: 'plancha',
        cantidad: 1,
        grupo: 'relleno'
      });
    } else if (herramienta === 'cota') {
      const newCotas = [...cotas];
      newCotas.push({
        id: `cota-${timestamp}`,
        x1: p1.x,
        y1: p1.y,
        x2: finalP2.x,
        y2: finalP2.y,
        valorM: distM,
        eje: Math.abs(finalP2.y - p1.y) < 0.02 ? 'X' : (Math.abs(finalP2.x - p1.x) < 0.02 ? 'Y' : 'alineada'),
        offsetVisual: 0.15
      });
      onUpdateDesign({ ...design, cotasCad: newCotas });
      setDrawStep(0);
      setStartPoint(null);
      return;
    } else {
      // Línea / Horizontal / Vertical / Diagonal
      // Auto-enderezar si está dentro de 0.035m (3.5cm) o 3° para que NUNCA quede un tubo milimétricamente chueco
      let correctedP2 = { ...finalP2 };
      const rawDx = correctedP2.x - p1.x;
      const rawDy = correctedP2.y - p1.y;
      const rawDeg = Math.abs(Math.atan2(rawDy, rawDx) * (180 / Math.PI));

      if (herramienta === 'horizontal' || Math.abs(rawDy) < 0.035 || rawDeg <= 3 || Math.abs(rawDeg - 180) <= 3) {
        correctedP2.y = p1.y;
      } else if (herramienta === 'vertical' || Math.abs(rawDx) < 0.035 || Math.abs(rawDeg - 90) <= 3 || Math.abs(rawDeg - 270) <= 3) {
        correctedP2.x = p1.x;
      }

      const correctedDistM = roundToPrecision(distance2D(p1.x, p1.y, correctedP2.x, correctedP2.y));
      const nextIdx = newPiezas.length + 1;
      const orient = Math.abs(correctedP2.y - p1.y) < 0.005 ? 'Horizontal' : (Math.abs(correctedP2.x - p1.x) < 0.005 ? 'Vertical' : 'Diagonal');

      newPiezas.push({
        id: `p-${timestamp}`,
        marca: `P-${String(nextIdx).padStart(2, '0')}`,
        nombre: `Pieza ${orient} ${perfil.dimensiones}`,
        tipo: 'perfil',
        material: materialActivo,
        perfilId: perfilActivoId,
        x1: p1.x, y1: p1.y, z1: 0,
        x2: correctedP2.x, y2: correctedP2.y, z2: 0,
        longitudM: correctedDistM,
        rotacionDeg: 0,
        corteInicio: '90°',
        corteFin: '90°',
        cantidad: 1,
        grupo: 'estructura'
      });
    }

    onUpdateDesign({
      ...design,
      piezas: newPiezas
    });

    setHerramienta('select');
    setDrawStep(0);
    setStartPoint(null);
  };

  // Finalizar creación de arco curvo interactivo en 3 clics
  const finalizarArco3Puntos = (p1: { x: number; y: number }, p2: { x: number; y: number }, pCtrl: { x: number; y: number }) => {
    const nextIdx = piezas.length + 1;
    const chordDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (chordDist < 0.005) {
      setDrawStep(0);
      setStartPoint(null);
      setArcEndPoint(null);
      return;
    }
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const nx = -(p2.y - p1.y) / chordDist;
    const ny = (p2.x - p1.x) / chordDist;
    const flecha = (pCtrl.x - midX) * nx + (pCtrl.y - midY) * ny;
    const flechaAbs = Math.max(0.02, Math.abs(flecha));
    
    // Longitud aproximada de arco cuadrático
    const arcLength = chordDist + (8 * flechaAbs * flechaAbs) / (3 * Math.max(0.01, chordDist));

    const nuevaPieza: PiezaCad = {
      id: `p-${Date.now()}-arc`,
      marca: `ARC-${String(nextIdx).padStart(2, '0')}`,
      nombre: `Tubo Rolado Curvo (Flecha ${(flechaAbs * 100).toFixed(0)}cm)`,
      tipo: 'tubo_curvo',
      material: materialActivo,
      perfilId: perfilActivoId,
      x1: roundToPrecision(p1.x),
      y1: roundToPrecision(p1.y),
      z1: 0,
      x2: roundToPrecision(p2.x),
      y2: roundToPrecision(p2.y),
      z2: 0,
      longitudM: roundToPrecision(arcLength),
      rotacionDeg: 0,
      corteInicio: '90°',
      corteFin: '90°',
      esCurvo: true,
      controlX: roundToPrecision(pCtrl.x),
      controlY: roundToPrecision(pCtrl.y),
      flechaM: roundToPrecision(flechaAbs),
      tipoArco: 'medio_punto',
      cantidad: 1,
      grupo: 'arco'
    };

    onUpdateDesign({
      ...design,
      piezas: [...piezas, nuevaPieza]
    });

    setDrawStep(0);
    setStartPoint(null);
    setArcEndPoint(null);
    onSelectElement(nuevaPieza.id, 'tubo_personalizado');
  };

  // Crear accesorio seleccionado
  const handleCrearAccesorio = (tipo: TipoAccesorioCad, nombre: string, especificacion: string, precio: number) => {
    if (!accDropPos) return;
    const newAccId = `acc-${Date.now()}`;
    const newAccs = [...accesorios];
    newAccs.push({
      id: newAccId,
      tipo,
      nombre,
      especificacion,
      precioUnitario: precio,
      cantidad: 1,
      x: accDropPos.x,
      y: accDropPos.y,
      z: 0,
      lado: accDropPos.x < 0.5 ? 'izquierda' : 'derecha'
    });
    onUpdateDesign({
      ...design,
      accesoriosCad: newAccs
    });
    setShowAccPicker(false);
    setAccDropPos(null);
    setHerramienta('select');
    setDrawStep(0);
    setStartPoint(null);
    onSelectElement(newAccId, tipo.includes('chapa') ? 'chapa' : (tipo.includes('bisagra') ? 'bisagras' : 'cerrojo'));
  };

  // Auto-Alinear y Enderezar Tubos "Chuecos" Ortogonalmente (0.0° y 90.0°)
  const handleStraightenCrookedTubes = () => {
    let fixedCount = 0;
    const updatedPiezas = piezas.map(p => {
      let { x1, y1, x2, y2 } = p;
      let changed = false;

      // Si es casi vertical (diferencia en X menor a 3.8cm), forzar x2 = x1
      if (Math.abs(x2 - x1) > 0.0001 && Math.abs(x2 - x1) < 0.038) {
        x2 = x1;
        changed = true;
      }
      // Si es casi horizontal (diferencia en Y menor a 3.5cm), forzar y2 = y1
      if (Math.abs(y2 - y1) > 0.0001 && Math.abs(y2 - y1) < 0.038) {
        y2 = y1;
        changed = true;
      }

      if (changed) fixedCount++;
      return {
        ...p,
        x1: roundToPrecision(x1),
        y1: roundToPrecision(y1),
        x2: roundToPrecision(x2),
        y2: roundToPrecision(y2),
        longitudM: roundToPrecision(Math.hypot(x2 - x1, y2 - y1))
      };
    });

    if (fixedCount > 0) {
      onUpdateDesign({ ...design, piezas: updatedPiezas });
      alert(`⚡ ¡Se alinearon y enderezaron ${fixedCount} tubo(s) ortogonalmente a 0.0° y 90.0°!`);
    } else {
      alert("🟢 Todos los tubos del diseño están perfectamente rectos y alineados.");
    }
  };

  // Añadir Platina Pestaña Batiente / Tope de Hoja adosada al ras del perfil padre
  const handleAddPlatinaTope = (targetPieceId: string, side: 'inner' | 'outer' = 'inner') => {
    const targetPiece = piezas.find(p => p.id === targetPieceId);
    if (!targetPiece) return;

    const parentProfile = PERFILES_CATALOGO.find(item => item.id === targetPiece.perfilId);
    const parentWidthM = (parentProfile ? (parentProfile.anchoMm || 50) : 50) / 1000;
    const platinaWidthM = 0.019; // Platina 3/4" (19mm)

    const dx = targetPiece.x2 - targetPiece.x1;
    const dy = targetPiece.y2 - targetPiece.y1;
    const len = Math.hypot(dx, dy);
    if (len < 0.01) return;

    const tx = dx / len;
    const ty = dy / len;
    const nx = -ty; // Normal perpendicular
    const ny = tx;

    const offsetM = (parentWidthM + platinaWidthM) / 2 * (side === 'inner' ? 1 : -1);

    const timestamp = Date.now();
    const nextIdx = piezas.length + 1;
    const newPlatinaTope: PiezaCad = {
      id: `plat-tope-${timestamp}`,
      marca: `TOP-${String(nextIdx).padStart(2, '0')}`,
      nombre: `Platina Batiente / Pestaña Tope (${targetPiece.marca || 'Marco'})`,
      tipo: 'perfil',
      material: materialActivo,
      perfilId: 'plat-tope-3/4',
      x1: roundToPrecision(targetPiece.x1 + offsetM * nx),
      y1: roundToPrecision(targetPiece.y1 + offsetM * ny),
      z1: targetPiece.z1 || 0,
      x2: roundToPrecision(targetPiece.x2 + offsetM * nx),
      y2: roundToPrecision(targetPiece.y2 + offsetM * ny),
      z2: targetPiece.z2 || 0,
      longitudM: roundToPrecision(len),
      rotacionDeg: targetPiece.rotacionDeg || 0,
      corteInicio: '90°',
      corteFin: '90°',
      cantidad: 1,
      grupo: 'marco',
      isPlatinaTope: true,
      parentFrameId: targetPiece.id,
      sideTope: side
    };

    onUpdateDesign({
      ...design,
      piezas: [...design.piezas, newPlatinaTope]
    });
  };

  // Acciones rápidas de CAD sobre pieza seleccionada
  const piezaSeleccionada = piezas.find(p => p.id === selectedElementId);

  const handleBorrarSeleccion = () => {
    if (selectedElementId) {
      onUpdateDesign({
        ...design,
        piezas: piezas.filter(p => p.id !== selectedElementId),
        accesoriosCad: accesorios.filter(a => a.id !== selectedElementId),
        cotasCad: cotas.filter(c => c.id !== selectedElementId)
      });
      onSelectElement(null, null);
    }
  };

  const handleDuplicarSeleccion = () => {
    if (piezaSeleccionada) {
      const clone: PiezaCad = {
        ...piezaSeleccionada,
        id: `p-${Date.now()}`,
        marca: `P-${String(piezas.length + 1).padStart(2, '0')}`,
        x1: roundToPrecision(piezaSeleccionada.x1 + 0.15),
        y1: roundToPrecision(piezaSeleccionada.y1 + 0.15),
        x2: roundToPrecision(piezaSeleccionada.x2 + 0.15),
        y2: roundToPrecision(piezaSeleccionada.y2 + 0.15)
      };
      onUpdateDesign({ ...design, piezas: [...piezas, clone] });
      onSelectElement(clone.id, 'tubo_personalizado');
    }
  };

  const handleRotar90 = () => {
    if (piezaSeleccionada) {
      const cx = (piezaSeleccionada.x1 + piezaSeleccionada.x2) / 2;
      const cy = (piezaSeleccionada.y1 + piezaSeleccionada.y2) / 2;
      const dx = piezaSeleccionada.x2 - piezaSeleccionada.x1;
      const dy = piezaSeleccionada.y2 - piezaSeleccionada.y1;
      // Rotar 90 grados alrededor del centro: (x, y) -> (-y, x)
      const newDx = -dy;
      const newDy = dx;
      const updated: PiezaCad = {
        ...piezaSeleccionada,
        x1: roundToPrecision(cx - newDx / 2),
        y1: roundToPrecision(cy - newDy / 2),
        x2: roundToPrecision(cx + newDx / 2),
        y2: roundToPrecision(cy + newDy / 2)
      };
      onUpdateDesign({
        ...design,
        piezas: piezas.map(p => p.id === piezaSeleccionada.id ? updated : p)
      });
    }
  };

  // Girar orientación de la sección transversal (0° vs 90°: Cara 2" ↔ Canto 1")
  const handleToggleRotacionSeccion = (targetId?: string) => {
    const id = targetId || selectedElementId;
    const target = piezas.find(p => p.id === id) || piezaSeleccionada;
    if (target) {
      const curRot = target.rotacionDeg || 0;
      const nextRot = (curRot + 90) % 360;
      onUpdateDesign({
        ...design,
        piezas: piezas.map(p => p.id === target.id ? { ...p, rotacionDeg: nextRot } : p)
      });
    }
  };

  const handleEspejo = (piezaIdOrEje: string, axis?: 'H' | 'V') => {
    const targetId = axis ? piezaIdOrEje : (selectedElementId || piezaSeleccionada?.id);
    const eje = axis || (piezaIdOrEje as 'H' | 'V');
    const target = piezas.find(p => p.id === targetId) || piezaSeleccionada;
    if (target) {
      const cx = (target.x1 + target.x2) / 2;
      const cy = (target.y1 + target.y2) / 2;
      const updated: PiezaCad = {
        ...target,
        x1: eje === 'V' ? roundToPrecision(2 * cx - target.x1) : target.x1,
        y1: eje === 'H' ? roundToPrecision(2 * cy - target.y1) : target.y1,
        x2: eje === 'V' ? roundToPrecision(2 * cx - target.x2) : target.x2,
        y2: eje === 'H' ? roundToPrecision(2 * cy - target.y2) : target.y2
      };
      onUpdateDesign({
        ...design,
        piezas: piezas.map(p => p.id === target.id ? updated : p)
      });
    }
  };

  // Handlers para Menú Contextual Avanzado
  const handleChangeCortes = (piezaId: string, corteInicio: TipoCorteCad, corteFin: TipoCorteCad) => {
    onUpdateDesign({
      ...design,
      piezas: piezas.map(p => p.id === piezaId ? { ...p, corteInicio, corteFin } : p)
    });
  };

  const handleChangePerfil = (piezaId: string, perfilId: string) => {
    const nuevoPerfil = PERFILES_CATALOGO.find(p => p.id === perfilId);
    if (!nuevoPerfil) return;
    onUpdateDesign({
      ...design,
      piezas: piezas.map(p => {
        if (p.id !== piezaId) return p;
        const pesoKg = roundToPrecision((nuevoPerfil.pesoKgPorMetro || nuevoPerfil.pesoKgM || 0) * p.longitudM, 2);
        return {
          ...p,
          perfilId,
          nombre: `${nuevoPerfil.nombre} (${nuevoPerfil.dimensiones})`,
          pesoKg
        };
      })
    });
  };

  const handleChangeLongitud = (piezaId: string, newLengthM: number) => {
    onUpdateDesign({
      ...design,
      piezas: piezas.map(p => {
        if (p.id !== piezaId) return p;
        const dx = p.x2 - p.x1;
        const dy = p.y2 - p.y1;
        const curLen = Math.hypot(dx, dy);
        let newX2 = p.x2;
        let newY2 = p.y2;
        if (curLen > 0.001) {
          newX2 = roundToPrecision(p.x1 + (dx / curLen) * newLengthM);
          newY2 = roundToPrecision(p.y1 + (dy / curLen) * newLengthM);
        } else {
          newX2 = roundToPrecision(p.x1 + newLengthM);
        }
        const perfil = PERFILES_CATALOGO.find(pf => pf.id === p.perfilId) || PERFILES_CATALOGO[0];
        const unitWeight = perfil ? (perfil.pesoKgPorMetro || perfil.pesoKgM || 0) : 0;
        return {
          ...p,
          x2: newX2,
          y2: newY2,
          longitudM: roundToPrecision(newLengthM),
          pesoKg: roundToPrecision(unitWeight * newLengthM, 2)
        };
      })
    });
  };

  const handleDeletePiece = (piezaId: string) => {
    onUpdateDesign({
      ...design,
      piezas: piezas.filter(p => p.id !== piezaId)
    });
    if (selectedElementId === piezaId) onSelectElement(null, null);
  };

  const handleDeleteAccesorio = (accId: string) => {
    onUpdateDesign({
      ...design,
      accesoriosCad: accesorios.filter(a => a.id !== accId)
    });
    if (selectedElementId === accId) onSelectElement(null, null);
  };

  // Touch Gestures: Pinch Zoom, 2-Finger Pan, Long-press (Right Click Context Menu), Double Tap
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistanceRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchMidpointRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStartPosRef.current = { x: t.clientX, y: t.clientY };
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        centerView();
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      // Long press para menú contextual (~550ms) sólo en modo select
      if (herramienta === 'select') {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(40); } catch (_) {}
          }
          const world = screenToWorld(t.clientX, t.clientY);
          const nearPieza = piezas.find(p => {
            const d = distancePointToSegment(world.x, world.y, p.x1, p.y1, p.x2, p.y2);
            return d < 0.15 / zoom;
          });
          if (nearPieza) {
            onSelectElement(nearPieza.id, 'tubo_personalizado');
            setContextMenuPos({
              x: t.clientX,
              y: t.clientY,
              targetId: nearPieza.id,
              targetType: 'pieza'
            });
          }
        }, 550);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimerRef.current && touchStartPosRef.current && e.touches.length === 1) {
      const t = e.touches[0];
      const dist = Math.hypot(t.clientX - touchStartPosRef.current.x, t.clientY - touchStartPosRef.current.y);
      if (dist > 8) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (e.touches.length === 2 && touchDistanceRef.current !== null && touchMidpointRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const newMidpoint = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };

      const zoomFactor = newDist / touchDistanceRef.current;
      const targetZoom = Math.min(Math.max(0.2, zoom * zoomFactor), 4.0);

      const deltaPanX = newMidpoint.x - touchMidpointRef.current.x;
      const deltaPanY = newMidpoint.y - touchMidpointRef.current.y;

      setZoom(targetZoom);
      setPan(p => ({ x: p.x + deltaPanX, y: p.y + deltaPanY }));

      touchDistanceRef.current = newDist;
      touchMidpointRef.current = newMidpoint;
    } else if (e.touches.length === 1 && touchStartPosRef.current && (isPanning || isPanningRef.current || (herramienta as string) === 'mover') && !draggingElementRef.current) {
      const t = e.touches[0];
      const deltaX = t.clientX - touchStartPosRef.current.x;
      const deltaY = t.clientY - touchStartPosRef.current.y;
      setPan(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
      touchStartPosRef.current = { x: t.clientX, y: t.clientY };
      hasDraggedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchDistanceRef.current = null;
    touchMidpointRef.current = null;
    touchStartPosRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    // 1. Gesto de desplazamiento horizontal (Mouse inalámbrico con scroll horizontal, Shift + rueda, o tilt de rueda)
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const delta = e.shiftKey ? (e.deltaY || e.deltaX) : e.deltaX;
      if (Math.abs(delta) > 0.5) {
        setPan(p => ({
          ...p,
          x: p.x - delta * 0.9
        }));
      }
      return;
    }

    // 2. Zoom suave centrado en la posición del puntero del mouse
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY;
    const zoomRatio = delta < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(4, Math.max(0.2, zoom * zoomRatio));

    if (newZoom !== zoom) {
      const scaleChange = newZoom / zoom;
      setPan(p => ({
        x: mouseX - (mouseX - p.x) * scaleChange,
        y: mouseY - (mouseY - p.y) * scaleChange
      }));
      setZoom(newZoom);
    }
  };

  // Atajos de teclado físicos y teclados Bluetooth
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'Escape') {
        setContextMenuPos(null);
        setShowHelpModal(false);
        setDrawStep(0);
        setStartPoint(null);
        setArcEndPoint(null);
        onSelectElement(null, null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          handleBorrarSeleccion();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handleDuplicarSeleccion();
      } else if (e.key === 'l' || e.key === 'L') {
        setHerramienta('linea');
        setDrawStep(0);
      } else if (e.key === 'r' || e.key === 'R') {
        if (selectedElementId && piezaSeleccionada) {
          handleRotar90();
        } else {
          setHerramienta('rectangulo');
          setDrawStep(0);
        }
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'c' || e.key === 'C') {
        setHerramienta('arco');
        setDrawStep(0);
      } else if (e.key === 'v' || e.key === 'V' || e.key === 's' || e.key === 'S') {
        setHerramienta('select');
        setDrawStep(0);
      } else if (e.key === 'h' || e.key === 'H') {
        setHerramienta('horizontal');
        setDrawStep(0);
      } else if (e.key === 'k' || e.key === 'K') {
        setHerramienta('accesorio');
        setDrawStep(0);
      } else if (e.key === 'p' || e.key === 'P') {
        setHerramienta('plancha');
        setDrawStep(0);
      } else if (e.key === 'd' || e.key === 'D') {
        setHerramienta('cota');
        setDrawStep(0);
      } else if (e.key === 'g' || e.key === 'G') {
        setSnapGrid(g => !g);
      } else if (e.key === 'o' || e.key === 'O') {
        setOrthoLock(o => !o);
      } else if (e.key === '+' || e.key === '=') {
        setZoom(z => Math.min(4, z * 1.25));
      } else if (e.key === '-' || e.key === '_') {
        setZoom(z => Math.max(0.2, z / 1.25));
      } else if (e.key === '0') {
        centerView();
      } else if (e.key === '?') {
        setShowHelpModal(m => !m);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, piezaSeleccionada, piezas, accesorios, cotas, design]);

  // Si la vista activa es 3D, renderizar el visor 3D paramétrico con su barra unificada limpia
  if (currentVista === '3d') {
    return (
      <div className="w-full h-full relative">
        <HerreriaViewer3D 
          design={design} 
          onVolver2D={(v) => handleVistaChange(v || 'frontal')}
          onOpenInspector={onOpenInspector}
          isInspectorOpen={isInspectorOpen}
          onUpdateDesign={onUpdateDesign}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative bg-slate-50 overflow-hidden select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onContextMenu={(e) => {
        e.preventDefault();
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        // Evitar abrir menú contextual si el usuario estaba arrastrando/paneando
        if (hasDraggedRef.current || isPanning || isPanningRef.current) {
          hasDraggedRef.current = false;
          return;
        }
        if (pointerDownPosRef.current) {
          const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
          if (dist > 6) return;
        }
        const world = screenToWorld(e.clientX, e.clientY);
        const nearPieza = piezas.find(p => {
          const d = distancePointToSegment(world.x, world.y, p.x1, p.y1, p.x2, p.y2);
          return d < 0.15 / zoom;
        });
        if (nearPieza) {
          onSelectElement(nearPieza.id, 'tubo_personalizado');
          setContextMenuPos({
            x: e.clientX,
            y: e.clientY,
            targetId: nearPieza.id,
            targetType: 'pieza'
          });
        } else {
          const nearAcc = accesorios.find(a => Math.hypot(a.x - world.x, a.y - world.y) < 0.15 / zoom);
          if (nearAcc) {
            onSelectElement(nearAcc.id, 'accesorio_cad');
            setContextMenuPos({
              x: e.clientX,
              y: e.clientY,
              targetId: nearAcc.id,
              targetType: 'accesorio'
            });
          } else {
            setContextMenuPos({
              x: e.clientX,
              y: e.clientY,
              targetType: 'canvas'
            });
          }
        }
      }}
    >
      {/* ========================================================
          BARRA COMPACTA ERGONÓMICA DE 2 BOTONES (PILLS) PARA MÓVIL, TABLET Y PC
      ======================================================== */}
      {(() => {
        const getToolInfo = (t: HerramientaCad) => {
          switch (t) {
            case 'select':
              return { label: 'Seleccionar', shortLabel: 'Seleccionar', icon: MousePointer, badge: 'bg-slate-800 text-white' };
            case 'mover':
              return { label: 'Mover (Pan)', shortLabel: 'Mover', icon: Hand, badge: 'bg-blue-600 text-white' };
            case 'linea':
              return { label: 'Línea Libre', shortLabel: 'Línea', icon: LineIcon, badge: 'bg-blue-600 text-white' };
            case 'horizontal':
              return { label: 'Horizontal (0°)', shortLabel: '0° Horiz', icon: MoveRight, badge: 'bg-blue-600 text-white' };
            case 'vertical':
              return { label: 'Vertical (90°)', shortLabel: '90° Vert', icon: MoveUp, badge: 'bg-blue-600 text-white' };
            case 'rectangulo':
              return { label: 'Marco Cerrado 45°', shortLabel: 'Marco', icon: Square, badge: 'bg-blue-600 text-white' };
            case 'arco':
              return { label: 'Arco Curvo 3 Pts', shortLabel: 'Arco', icon: Circle, badge: 'bg-amber-600 text-white' };
            case 'platina_tope':
              return { label: 'Pestaña Batiente', shortLabel: 'Batiente', icon: SlidersHorizontal, badge: 'bg-amber-600 text-white' };
            case 'plancha':
              return { label: 'Plancha / Malla', shortLabel: 'Plancha', icon: Layers, badge: 'bg-blue-600 text-white' };
            case 'accesorio':
              return { label: '+ Accesorio', shortLabel: 'Accesorio', icon: Lock, badge: 'bg-emerald-600 text-white' };
            case 'cota':
              return { label: 'Cota de Medida', shortLabel: 'Cota', icon: Ruler, badge: 'bg-blue-600 text-white' };
            default:
              return { label: 'Herramienta', shortLabel: 'Herramienta', icon: MousePointer, badge: 'bg-slate-800 text-white' };
          }
        };

        const activeToolInfo = getToolInfo(herramienta);
        const ActiveToolIcon = activeToolInfo.icon;
        const perfilActivo = PERFILES_CATALOGO.find(p => p.id === perfilActivoId) || PERFILES_CATALOGO[0];

        return (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-30 flex items-center gap-1.5 sm:gap-2 pointer-events-auto max-w-[calc(100vw-16px)] select-none">
            {/* BOTÓN 1: HERRAMIENTA ACTIVA (DROPDOWN TÁCTIL) */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowToolDropdown(prev => !prev);
                  setShowConfigDropdown(false);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  showToolDropdown 
                    ? 'border-blue-500 ring-2 ring-blue-400/40 text-blue-700 bg-blue-50' 
                    : 'border-slate-200/90 text-slate-800 hover:bg-slate-50'
                }`}
                title="Seleccionar Herramienta de Dibujo CAD"
              >
                <span className={`p-1 rounded-lg flex items-center justify-center shrink-0 ${activeToolInfo.badge}`}>
                  <ActiveToolIcon className="w-3.5 h-3.5" />
                </span>
                <span className="font-black text-slate-900">{activeToolInfo.shortLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showToolDropdown ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {/* Menú Desplegable de Herramientas de Dibujo */}
              {showToolDropdown && (
                <>
                  {/* Backdrop invisible para cerrar al hacer clic fuera */}
                  <div 
                    className="fixed inset-0 z-30 bg-slate-900/10 backdrop-blur-[1px]" 
                    onClick={(e) => { e.stopPropagation(); setShowToolDropdown(false); }} 
                  />
                  
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="fixed left-2 right-2 top-12 sm:absolute sm:top-full sm:left-0 sm:right-auto mt-1.5 z-40 max-w-[calc(100vw-16px)] sm:max-w-none sm:w-[340px] max-h-[80vh] overflow-y-auto bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-2.5 flex flex-col gap-2 animate-fadeIn mx-auto sm:mx-0"
                  >
                    {/* Categoría 1: Navegación */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1.5 mb-1 block">
                        Navegación Táctil
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setHerramienta('select');
                            setDrawStep(0);
                            setStartPoint(null);
                            setShowToolDropdown(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                            herramienta === 'select'
                              ? 'bg-slate-800 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <MousePointer className="w-4 h-4 text-blue-400 shrink-0" />
                          <div>
                            <div className="leading-tight">Seleccionar</div>
                            <div className="text-[9px] opacity-70 font-normal">Editar piezas</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setHerramienta('mover');
                            setDrawStep(0);
                            setStartPoint(null);
                            setShowToolDropdown(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                            herramienta === 'mover'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Hand className="w-4 h-4 text-amber-300 shrink-0" />
                          <div>
                            <div className="leading-tight">Mover (Pan)</div>
                            <div className="text-[9px] opacity-70 font-normal">Desplazar lienzo</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Categoría 2: Trazado de Perfiles */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1.5 mb-1 block">
                        Trazado de Perfiles y Tubos
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setHerramienta('linea');
                            setDrawStep(0);
                            setStartPoint(null);
                            setShowToolDropdown(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                            herramienta === 'linea'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <LineIcon className="w-4 h-4 rotate-45 text-blue-500 shrink-0" />
                          <div>
                            <div className="leading-tight">Línea Libre</div>
                            <div className="text-[9px] opacity-70 font-normal">Cualquier ángulo</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setHerramienta('horizontal');
                            setDrawStep(0);
                            setStartPoint(null);
                            setShowToolDropdown(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                            herramienta === 'horizontal'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <MoveRight className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <div className="leading-tight">Horizontal (0°)</div>
                            <div className="text-[9px] opacity-70 font-normal">Eje X recto</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setHerramienta('vertical');
                            setDrawStep(0);
                            setStartPoint(null);
                            setShowToolDropdown(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                            herramienta === 'vertical'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <MoveUp className="w-4 h-4 text-blue-500 shrink-0" />
                          <div>
                            <div className="leading-tight">Vertical (90°)</div>
                            <div className="text-[9px] opacity-70 font-normal">Eje Y recto</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setHerramienta('rectangulo');
                            setDrawStep(0);
                            setStartPoint(null);
                            setShowToolDropdown(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                            herramienta === 'rectangulo'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Square className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div>
                            <div className="leading-tight">Marco Cerrado</div>
                            <div className="text-[9px] opacity-70 font-normal">4 tubos a 45°</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setHerramienta('arco');
                            setDrawStep(0);
                            setStartPoint(null);
                            setShowToolDropdown(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                            herramienta === 'arco'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Circle className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <div className="leading-tight">Arco Curvo</div>
                            <div className="text-[9px] opacity-70 font-normal">3 puntos elástico</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            if (selectedElementId) {
                              handleAddPlatinaTope(selectedElementId, 'inner');
                            } else {
                              setHerramienta('platina_tope');
                              setDrawStep(0);
                            }
                            setShowToolDropdown(false);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left ${
                            herramienta === 'platina_tope'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60'
                          }`}
                        >
                          <SlidersHorizontal className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <div className="leading-tight">Pestaña Batiente</div>
                            <div className="text-[9px] opacity-70 font-normal">Tope para hoja</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Categoría 3: Planchas, Accesorios y Medidas */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1.5 mb-1 block">
                        Elementos CAD y Cotas
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => {
                            setHerramienta('plancha');
                            setDrawStep(0);
                            setShowToolDropdown(false);
                          }}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all text-center ${
                            herramienta === 'plancha'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Layers className="w-4 h-4 text-blue-500 mb-1" />
                          <span className="text-[11px] leading-tight">Plancha</span>
                        </button>

                        <button
                          onClick={() => {
                            setHerramienta('accesorio');
                            setDrawStep(0);
                            setShowToolDropdown(false);
                          }}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all text-center ${
                            herramienta === 'accesorio'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                          }`}
                        >
                          <Lock className="w-4 h-4 text-emerald-600 mb-1" />
                          <span className="text-[11px] leading-tight">+ Accesorio</span>
                        </button>

                        <button
                          onClick={() => {
                            setHerramienta('cota');
                            setDrawStep(0);
                            setShowToolDropdown(false);
                          }}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all text-center ${
                            herramienta === 'cota'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Ruler className="w-4 h-4 text-blue-500 mb-1" />
                          <span className="text-[11px] leading-tight">Cota</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* BOTÓN 2: PERFIL COMERCIAL Y VISTAS CAD (DROPDOWN TÁCTIL) */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfigDropdown(prev => !prev);
                  setShowToolDropdown(false);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  showConfigDropdown 
                    ? 'border-indigo-500 ring-2 ring-indigo-400/40 text-indigo-700 bg-indigo-50' 
                    : 'border-slate-200/90 text-slate-800 hover:bg-slate-50'
                }`}
                title="Perfil comercial de acero y Vistas CAD"
              >
                <span className="p-1 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </span>
                <div className="flex items-center gap-1 max-w-[85px] sm:max-w-[200px] truncate text-left">
                  <span className="font-black text-slate-900 truncate text-[11px] sm:text-xs">{perfilActivo.dimensiones}</span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-extrabold uppercase shrink-0">
                    {currentVista === 'superior' ? 'Planta' : currentVista}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${showConfigDropdown ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>

              {/* Menú Desplegable de Perfil, Vistas e Inspector */}
              {showConfigDropdown && (
                <>
                  {/* Backdrop invisible para cerrar al hacer clic fuera */}
                  <div 
                    className="fixed inset-0 z-30 bg-slate-900/10 backdrop-blur-[1px]" 
                    onClick={(e) => { e.stopPropagation(); setShowConfigDropdown(false); }} 
                  />
                  
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="fixed left-2 right-2 top-12 sm:absolute sm:top-full sm:left-auto sm:right-0 mt-1.5 z-40 max-w-[calc(100vw-16px)] sm:max-w-none sm:w-[350px] max-h-[80vh] overflow-y-auto bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-3 flex flex-col gap-3 animate-fadeIn mx-auto sm:mx-0"
                  >
                    {/* 1. Selector de Perfil Comercial */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Perfil Metálico Activo
                        </label>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {filtroNormaHerreria === 'TODOS' ? 'Todos los grupos' : filtroNormaHerreria}
                        </span>
                      </div>

                      {/* Filtros Rápidos por Norma / Acabado */}
                      <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { id: 'TODOS', label: 'Todos' },
                          { id: 'LAC', label: '📦 LAC' },
                          { id: 'GALVANIZADO', label: '🛡️ Galv' },
                          { id: 'LAF', label: '❄️ LAF / LAB' },
                          { id: 'ASTM', label: '📐 ASTM' },
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFiltroNormaHerreria(f.id as any); }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                              filtroNormaHerreria === f.id
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <select
                        value={perfilActivoId}
                        onChange={(e) => {
                          setPerfilActivoId(e.target.value);
                          setShowConfigDropdown(false);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {(filtroNormaHerreria === 'TODOS' || filtroNormaHerreria === 'LAC') && (
                          <optgroup label="📦 PERFILES LAC (ASTM A500 Negro Estructural)">
                            {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'LAC').map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} ({p.dimensiones})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {(filtroNormaHerreria === 'TODOS' || filtroNormaHerreria === 'GALVANIZADO') && (
                          <optgroup label="🛡️ PERFILES GALVANIZADOS (ASTM A500 Galv)">
                            {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'GALVANIZADO').map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} ({p.dimensiones})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {(filtroNormaHerreria === 'TODOS' || filtroNormaHerreria === 'LAF') && (
                          <optgroup label="❄️ PERFILES LAF / LAB (Laminado en Frío / Cerrajería Ligera)">
                            {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'LAF').map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} ({p.dimensiones})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {(filtroNormaHerreria === 'TODOS' || filtroNormaHerreria === 'ASTM') && (
                          <optgroup label="📐 PERFILES ESTRUCTURALES ASTM (A36 / Vigas / Ángulos / Platinas)">
                            {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'ASTM').map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombre} ({p.dimensiones})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* 2. Vistas CAD */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 block">
                        Vista del Modelo
                      </span>
                      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => {
                            handleVistaChange('frontal');
                            setShowConfigDropdown(false);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentVista === 'frontal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Frontal
                        </button>
                        <button
                          onClick={() => {
                            handleVistaChange('superior');
                            setShowConfigDropdown(false);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentVista === 'superior' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Planta
                        </button>
                        <button
                          onClick={() => {
                            handleVistaChange('lateral');
                            setShowConfigDropdown(false);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentVista === 'lateral' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Lateral
                        </button>
                        <button
                          onClick={() => {
                            handleVistaChange('3d');
                            setShowConfigDropdown(false);
                          }}
                          className="py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-1 shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>3D</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. Acciones Rápidas (Inspector CAD y Catálogo de Plantillas) */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {onOpenInspector && (
                        <button
                          onClick={() => {
                            onOpenInspector();
                            setShowConfigDropdown(false);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                            isInspectorOpen
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Inspector CAD</span>
                        </button>
                      )}

                      {onOpenTemplates && (
                        <button
                          onClick={() => {
                            onOpenTemplates();
                            setShowConfigDropdown(false);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                          <span>Plantillas</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================
          BANNER FLOTANTE GUÍA CUANDO SE ESTÁ TRAZANDO UNA PIEZA
      ======================================================== */}
      {drawStep >= 1 && (
        <div className="absolute top-20 sm:top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/95 text-white backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-blue-500/40 select-none animate-fadeIn pointer-events-none max-w-[92vw]">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
          <span className="text-xs font-bold truncate">
            {herramienta === 'arco'
              ? (drawStep === 1 ? '🏹 Arco Paso 1: Toca el punto final de la cuerda' : '🏹 Arco Paso 2: Mueve para arquear y toca para fijar')
              : `📏 Trazando ${herramienta.toUpperCase()}: Toca el punto final`}
          </span>
          <button
            onClick={() => {
              setDrawStep(0);
              setStartPoint(null);
              setArcEndPoint(null);
              setHerramienta('select');
            }}
            className="ml-2 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 pointer-events-auto"
            title="Cancelar trazo activo (Escape)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </button>
        </div>
      )}

      {/* ========================================================
          DOCK FLOTANTE INFERIOR DERECHO: ZOOM Y AJUSTES SNAP (TOUCH FRIENDLY)
      ======================================================== */}
      <div className="absolute bottom-4 right-3 z-30 flex flex-col gap-1.5 pointer-events-auto select-none items-end">
        {/* SNAP Magnético y Ortho */}
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 flex flex-col gap-1">
          <button
            onClick={() => setIsSnapCollapsed(!isSnapCollapsed)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center"
            title={isSnapCollapsed ? "Mostrar controles de Imán Snap" : "Ocultar botones de Snap"}
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          </button>

          {!isSnapCollapsed && (
            <>
              <button
                onClick={() => setSnapEndpoints(!snapEndpoints)}
                title="Snap a Vértices / Extremos"
                className={`p-2 rounded-xl text-xs transition-colors flex items-center justify-center ${
                  snapEndpoints ? 'bg-emerald-100 text-emerald-700 font-bold shadow-2xs' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSnapMidpoints(!snapMidpoints)}
                title="Snap a Puntos Medios"
                className={`p-2 rounded-xl text-xs transition-colors flex items-center justify-center ${
                  snapMidpoints ? 'bg-cyan-100 text-cyan-700 font-bold shadow-2xs' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Circle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSnapSegments(!snapSegments)}
                title="Snap a Ejes y Unión entre Perfiles"
                className={`p-2 rounded-xl text-xs transition-colors flex items-center justify-center ${
                  snapSegments ? 'bg-indigo-100 text-indigo-700 font-bold shadow-2xs' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Magnet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSnapGrid(!snapGrid)}
                title="Snap a Rejilla Métrica"
                className={`p-2 rounded-xl text-xs transition-colors flex items-center justify-center ${
                  snapGrid ? 'bg-blue-100 text-blue-700 font-bold shadow-2xs' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOrthoLock(!orthoLock)}
                title="Bloqueo Ortogonal 90° (Horiz / Vert)"
                className={`p-2 rounded-xl text-xs transition-colors flex items-center justify-center ${
                  orthoLock ? 'bg-amber-100 text-amber-700 font-bold shadow-2xs' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <MoveRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleStraightenCrookedTubes}
                title="Enderezar tubos ortogonales inclinados (0° y 90°)"
                className="p-2 rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs transition-colors flex items-center justify-center"
              >
                <Compass className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Botones de Zoom Físico Táctil */}
        <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200 flex flex-col gap-1">
          <button
            onClick={() => handleZoom(1.25)}
            className="p-2.5 rounded-xl text-slate-800 hover:bg-slate-100 active:bg-blue-50 transition-colors flex items-center justify-center"
            title="Acercar Zoom (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-2.5 rounded-xl text-slate-800 hover:bg-slate-100 active:bg-blue-50 transition-colors flex items-center justify-center"
            title="Alejar Zoom (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={centerView}
            className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center"
            title="Centrar y reajustar lienzo (Zoom Fit)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          BARRA DE ACCIONES DE PIEZA / ELEMENTO SELECCIONADO (FLOTANTE DESTACADA)
      ======================================================== */}
      {selectedElementId && (
        <div 
          onWheel={handleHorizontalWheel}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 pointer-events-auto max-w-[94vw] overflow-x-auto touch-pan-x scrollbar-none select-none"
        >
          {piezaSeleccionada && (() => {
            const dx = piezaSeleccionada.x2 - piezaSeleccionada.x1;
            const dy = piezaSeleccionada.y2 - piezaSeleccionada.y1;
            const angleDeg = Math.round(Math.abs(Math.atan2(dy, dx) * (180 / Math.PI)));
            const isHoriz = Math.abs(dy) < 0.005 || angleDeg === 0 || angleDeg === 180;
            const isVert = Math.abs(dx) < 0.005 || angleDeg === 90;
            const isCrooked = !isHoriz && !isVert && (angleDeg < 6 || angleDeg > 84 || (angleDeg > 174 && angleDeg < 186));

            return (
              <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700 text-xs shrink-0">
                <span className="font-extrabold text-blue-400 uppercase">{piezaSeleccionada.marca}</span>
                <span className="text-slate-300 font-mono">{(piezaSeleccionada.longitudM).toFixed(2)}m</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isHoriz || isVert 
                    ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600/60' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {isHoriz ? '🟢 0° Horiz' : (isVert ? '🟢 90° Vert' : `📐 ${angleDeg}°`)}
                </span>
                {isCrooked && (
                  <button
                    onClick={() => handleStraightenCrookedTubes()}
                    className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    title="Este tubo está ligeramente inclinado. Haz clic para enderezarlo a 0° o 90° exactos"
                  >
                    <span>⚠️ Enderezar</span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Selector Rápido de Perfil para la Pieza Seleccionada */}
          {piezaSeleccionada && (
            <div className="flex items-center gap-1 shrink-0">
              <select
                value={piezaSeleccionada.perfilId}
                onChange={(e) => handleChangePerfil(piezaSeleccionada.id, e.target.value)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-blue-300 rounded-xl px-2 py-1.5 text-xs font-bold outline-none cursor-pointer max-w-[170px] sm:max-w-[220px] truncate transition-colors"
                title="Cambiar perfil asignado a esta pieza"
              >
                <optgroup label="📦 LAC (ASTM A500)">
                  {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'LAC').map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white font-medium">
                      {p.dimensiones} - {p.nombre}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🛡️ GALVANIZADOS (ASTM A500)">
                  {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'GALVANIZADO').map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white font-medium">
                      {p.dimensiones} - {p.nombre}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="❄️ LAF / LAB (Laminado en Frío)">
                  {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'LAF').map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white font-medium">
                      {p.dimensiones} - {p.nombre}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📐 ESTRUCTURAL ASTM">
                  {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'ASTM').map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white font-medium">
                      {p.dimensiones} - {p.nombre}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Botón de Giro de Sección Transversal */}
          {piezaSeleccionada && (
            <button
              onClick={() => handleToggleRotacionSeccion()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold transition-all border border-slate-600 shrink-0 cursor-pointer active:scale-95"
              title="Girar Orientación del Perfil 90° (Invertir Cara/Canto)"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Giro {(piezaSeleccionada.rotacionDeg || 0) % 180 === 90 ? 'Canto' : 'Cara'}</span>
            </button>
          )}

          {/* Botón Duplicar */}
          <button
            onClick={handleDuplicarSeleccion}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-600 shrink-0 cursor-pointer active:scale-95"
            title="Duplicar Elemento"
          >
            <Copy className="w-3.5 h-3.5 text-slate-300" />
            <span>Duplicar</span>
          </button>

          {/* Botón Rotar 90° */}
          <button
            onClick={handleRotar90}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-600 shrink-0 cursor-pointer active:scale-95"
            title="Rotar 90 Grados"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-300" />
            <span>Rotar 90°</span>
          </button>

          {/* Botón Espejo */}
          <button
            onClick={() => handleEspejo('V')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-600 shrink-0 cursor-pointer active:scale-95"
            title="Reflejar Simétricamente"
          >
            <FlipHorizontal className="w-3.5 h-3.5 text-slate-300" />
            <span>Espejo</span>
          </button>

          {/* Botón ELIMINAR (ROJO DESTACADO) */}
          <button
            onClick={handleBorrarSeleccion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
            title="Eliminar Pieza Seleccionada (Supr/Del)"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>

          {/* Botón Deseleccionar */}
          <button
            onClick={() => onSelectElement(null, null)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Deseleccionar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          INDICADOR FLOTANTE DE COORDENADAS Y SNAP
      ======================================================== */}
      <div className="absolute bottom-4 left-3 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 shadow-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <span>X: <strong className="text-slate-900">{currentWorldPointer.x.toFixed(2)}m</strong></span>
          <span className="text-slate-300">|</span>
          <span>Y: <strong className="text-slate-900">{currentWorldPointer.y.toFixed(2)}m</strong></span>
        </div>
        {activeSnap && activeSnap.type !== 'none' && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            <Magnet className="w-3 h-3" />
            <span>{activeSnap.label}</span>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL RÁPIDO PARA INSERTAR ACCESORIOS
      ======================================================== */}
      {showAccPicker && accDropPos && (
        <div className="absolute inset-0 z-40 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 w-full max-w-md">
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">AGREGAR ACCESORIO O HERRAJE</h3>
            <p className="text-xs text-slate-500 mb-4">
              Posición: X: {accDropPos.x.toFixed(2)}m, Y: {accDropPos.y.toFixed(2)}m
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
              <button
                onClick={() => handleCrearAccesorio('bisagra_soldable', 'Bisagra Tubular 5/8" x 3"', 'Bisagra tubular con pin de acero soldable', 10.50)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded-xl border border-slate-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block">Bisagra Tubular 3"</span>
                <span className="text-[10px] text-slate-500">Soldable con rodaje • S/. 10.50</span>
              </button>
              <button
                onClick={() => handleCrearAccesorio('bisagra_reforzada', 'Bisagra Capuchina 3 1/2"', 'Bisagra reforzada 4 perforaciones', 14.00)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded-xl border border-slate-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block">Bisagra Capuchina</span>
                <span className="text-[10px] text-slate-500">Reforzada 3 1/2" • S/. 14.00</span>
              </button>
              <button
                onClick={() => handleCrearAccesorio('chapa_sobreponer', 'Cerradura de Sobreponer Forte 3G', 'Cerradura con cerrojo de tres golpes', 85.00)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded-xl border border-slate-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block">Cerradura Forte 3G</span>
                <span className="text-[10px] text-slate-500">Sobreponer de seguridad • S/. 85.00</span>
              </button>
              <button
                onClick={() => handleCrearAccesorio('cerradura_embutir', 'Cerradura de Embutir Travex', 'Cerradura embutida para perfil angosto', 75.00)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded-xl border border-slate-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block">Cerradura Embutir</span>
                <span className="text-[10px] text-slate-500">Perfil angosto Travex • S/. 75.00</span>
              </button>
              <button
                onClick={() => handleCrearAccesorio('cerrojo_pasador', 'Pasador de Piso y Techo 50cm', 'Cerrojo vertical de anclaje para hoja pasiva', 24.00)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded-xl border border-slate-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block">Cerrojo Pasador 50cm</span>
                <span className="text-[10px] text-slate-500">Piso o techo portón • S/. 24.00</span>
              </button>
              <button
                onClick={() => handleCrearAccesorio('manija_tirador', 'Tirador Tubular de Acero Inox 40cm', 'Manija tirador recto para puerta metálica', 45.00)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded-xl border border-slate-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block">Tirador Inox 40cm</span>
                <span className="text-[10px] text-slate-500">Tirador moderno inox • S/. 45.00</span>
              </button>
              <button
                onClick={() => handleCrearAccesorio('rueda_porton', 'Rueda de Acero 3" Canal U con Rodaje', 'Rueda inferior para portón corredizo al piso', 32.00)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded-xl border border-slate-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block">Rueda Portón Canal U</span>
                <span className="text-[10px] text-slate-500">Rueda 3" con rodaje • S/. 32.00</span>
              </button>
              <button
                onClick={() => handleCrearAccesorio('placa_base', 'Placa Base de Anclaje 150x150x6mm', 'Placa de acero con 4 perforaciones para perno', 28.00)}
                className="p-3 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-300 rounded-xl border border-slate-200 transition-colors"
              >
                <span className="text-xs font-bold text-slate-800 block">Placa Base 150x150</span>
                <span className="text-[10px] text-slate-500">Base anclaje 4 pernos • S/. 28.00</span>
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => { setShowAccPicker(false); setAccDropPos(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          LIENZO SVG VECTORIAL INTERACTIVO
      ======================================================== */}
      <svg
        ref={svgRef}
        id="cad-grid-bg"
        className="w-full h-full cursor-crosshair"
      >
        <defs>
          {/* Patrón de rejilla menor (10cm) */}
          <pattern
            id="cad-grid-minor"
            width={0.10 * scalePxPerM * zoom}
            height={0.10 * scalePxPerM * zoom}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${0.10 * scalePxPerM * zoom} 0 L 0 0 0 ${0.10 * scalePxPerM * zoom}`}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="0.75"
            />
          </pattern>
          {/* Patrón de rejilla mayor (50cm) */}
          <pattern
            id="cad-grid-major"
            width={0.50 * scalePxPerM * zoom}
            height={0.50 * scalePxPerM * zoom}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={0.50 * scalePxPerM * zoom}
              height={0.50 * scalePxPerM * zoom}
              fill="url(#cad-grid-minor)"
            />
            <path
              d={`M ${0.50 * scalePxPerM * zoom} 0 L 0 0 0 ${0.50 * scalePxPerM * zoom}`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1.25"
            />
          </pattern>
          {/* Marcadores de flechas para cotas */}
          <marker
            id="cota-arrow-start"
            viewBox="0 0 10 10"
            refX="0"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 10 0 L 0 5 L 10 10 z" fill="#2563eb" />
          </marker>
          <marker
            id="cota-arrow-end"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
        </defs>

        {/* Fondo con rejilla */}
        <rect id="cad-background-grid-rect" width="100%" height="100%" fill="url(#cad-grid-major)" />

        {/* Ejes X / Y y Origen (0.00, 0.00) */}
        <g>
          {/* Eje X */}
          <line
            x1={0}
            y1={centerOriginY}
            x2="100%"
            y2={centerOriginY}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
          {/* Eje Y */}
          <line
            x1={centerOriginX}
            y1={0}
            x2={centerOriginX}
            y2="100%"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
          {/* Círculo origen (0,0) */}
          <circle
            cx={centerOriginX}
            cy={centerOriginY}
            r="4"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          <text
            x={centerOriginX + 8}
            y={centerOriginY - 8}
            fontSize="10"
            fontWeight="bold"
            fill="#64748b"
            fontFamily="monospace"
          >
            (0.00, 0.00)
          </text>
        </g>

        {/* ========================================================
            RENDERIZADO DE PIEZAS (ÚNICA FUENTE DE VERDAD)
        ======================================================== */}
        <g id="piezas-group">
          {piezas.map((pz) => {
            const perfil = PERFILES_CATALOGO.find(p => p.id === pz.perfilId) || PERFILES_CATALOGO[0];
            
            // Proyección 2D según la vista activa (Frontal X-Y, Lateral Z-Y, Planta X-Z)
            let coordX1 = pz.x1;
            let coordY1 = pz.y1;
            let coordX2 = pz.x2;
            let coordY2 = pz.y2;

            if (currentVista === 'lateral') {
              coordX1 = pz.z1 || 0;
              coordY1 = pz.y1;
              coordX2 = pz.z2 || 0;
              coordY2 = pz.y2;
            } else if (currentVista === 'superior') {
              coordX1 = pz.x1;
              coordY1 = pz.z1 || 0;
              coordX2 = pz.x2;
              coordY2 = pz.z2 || 0;
            }

            const p1Screen = worldToScreen(coordX1, coordY1);
            const p2Screen = worldToScreen(coordX2, coordY2);
            const isSelected = selectedElementId === pz.id;
            
            // Cálculo de espesor visual 2D considerando rotación de sección (Cara 2" vs Canto 1")
            const is90Rotated = (Math.round((pz.rotacionDeg || 0) / 90) % 2) !== 0;
            const visibleWidthMm = (currentVista === 'lateral')
              ? (is90Rotated ? perfil.anchoMm : perfil.altoMm)
              : (is90Rotated ? perfil.altoMm : perfil.anchoMm);
            const strokeWidthPx = Math.max(3, (visibleWidthMm / 1000) * scalePxPerM * zoom);

            // Si es plancha
            if (pz.esPlancha && (pz.anchoPlanchaM || pz.esPlancha)) {
              const rawDx = Math.abs(p2Screen.x - p1Screen.x);
              const rawDy = Math.abs(p2Screen.y - p1Screen.y);
              const isEdgeOnH = rawDy < 6;
              const isEdgeOnV = rawDx < 6;
              const isMachihembrada = pz.subtipoPlancha === 'machihembrada';
              const isEstriada = pz.subtipoPlancha === 'estriada' || pz.tipoRelleno === 'plancha_estriada';
              const isPerforada = pz.subtipoPlancha === 'perforada' || pz.tipoRelleno === 'plancha_perforada';
              const isAcanalada = pz.subtipoPlancha === 'acanalada' || pz.subtipoPlancha === 'corrugada' || (pz.tipoRelleno as string) === 'plancha_acanalada';
              const isMalla = pz.tipoRelleno === 'malla';
              const isVidrio = pz.tipoRelleno === 'vidrio';
              const espMm = pz.espesorPlanchaMm || 2.5;
              const espStr = `${espMm}mm`;

              // Si se ve de canto (e.g. huella de escalera o cubierta de mesa en elevación frontal)
              if (isEdgeOnH || isEdgeOnV) {
                const plateStrokePx = Math.max(3, (espMm / 1000) * scalePxPerM * zoom * 2);
                return (
                  <g 
                    key={pz.id} 
                    onClick={(e) => {
                      if (herramienta === 'select') {
                        e.stopPropagation();
                        onSelectElement(pz.id, 'tubo_personalizado');
                      }
                    }} 
                    onPointerDown={(e) => {
                      if (herramienta !== 'select' || e.button !== 0) return;
                      e.stopPropagation();
                      onSelectElement(pz.id, 'tubo_personalizado');
                      const clickWorld = screenToWorld(e.clientX, e.clientY);
                      draggingElementRef.current = {
                        id: pz.id,
                        type: 'plancha',
                        handle: 'body',
                        initialP1: { x: pz.x1, y: pz.y1 },
                        initialP2: { x: pz.x2, y: pz.y2 },
                        dragStartWorldPt: clickWorld
                      };
                      setIsPanning(false);
                      isPanningRef.current = false;
                    }}
                    className={herramienta === 'select' ? "cursor-pointer group" : ""}
                  >
                    {isSelected && (
                      <line
                        x1={p1Screen.x}
                        y1={p1Screen.y}
                        x2={p2Screen.x}
                        y2={p2Screen.y}
                        stroke="#3b82f6"
                        strokeWidth={plateStrokePx + 6}
                        strokeOpacity="0.4"
                        strokeLinecap="square"
                      />
                    )}
                    <line
                      x1={p1Screen.x}
                      y1={p1Screen.y}
                      x2={p2Screen.x}
                      y2={p2Screen.y}
                      stroke={isSelected ? '#1d4ed8' : (isVidrio ? '#0284c7' : '#334155')}
                      strokeWidth={plateStrokePx}
                      strokeLinecap="square"
                      className={herramienta === 'select' ? "group-hover:stroke-blue-600 transition-colors" : ""}
                    />
                  </g>
                );
              }

              const rectX = Math.min(p1Screen.x, p2Screen.x);
              const rectY = Math.min(p1Screen.y, p2Screen.y);
              const rectW = Math.max(10, rawDx);
              const rectH = Math.max(10, rawDy);

              let fillVal = '#e2e8f0';
              if (isSelected) fillVal = '#dbeafe';
              else if (isMachihembrada) fillVal = `url(#machihembrada-${pz.id})`;
              else if (isAcanalada) fillVal = `url(#corrugated-${pz.id})`;
              else if (isEstriada) fillVal = `url(#diamond-${pz.id})`;
              else if (isPerforada) fillVal = `url(#dots-${pz.id})`;
              else if (isMalla) fillVal = `url(#mesh-${pz.id})`;
              else if (isVidrio) fillVal = '#e0f2fe';

              const showBigLabel = rectW >= 80 && rectH >= 40;

              return (
                <g 
                  key={pz.id} 
                  onClick={(e) => {
                    if (herramienta === 'select') {
                      e.stopPropagation();
                      onSelectElement(pz.id, 'tubo_personalizado');
                    }
                  }} 
                  onPointerDown={(e) => {
                    if (herramienta !== 'select' || e.button !== 0) return;
                    e.stopPropagation();
                    onSelectElement(pz.id, 'tubo_personalizado');
                    const clickWorld = screenToWorld(e.clientX, e.clientY);
                    draggingElementRef.current = {
                      id: pz.id,
                      type: 'plancha',
                      handle: 'body',
                      initialP1: { x: pz.x1, y: pz.y1 },
                      initialP2: { x: pz.x2, y: pz.y2 },
                      dragStartWorldPt: clickWorld
                    };
                    setIsPanning(false);
                    isPanningRef.current = false;
                  }}
                  className={herramienta === 'select' ? "cursor-pointer" : ""}
                >
                  <defs>
                    {/* Textura Machihembrada Duelas con Bisel */}
                    <pattern id={`machihembrada-${pz.id}`} width="28" height="20" patternUnits="userSpaceOnUse">
                      <rect x="0" y="0" width="26" height="20" fill="#cbd5e1" fillOpacity="0.85" />
                      <rect x="26" y="0" width="2" height="20" fill="#334155" />
                      <line x1="1" y1="0" x2="1" y2="20" stroke="#f8fafc" strokeWidth="1" strokeOpacity="0.9" />
                      <line x1="13" y1="0" x2="13" y2="20" stroke="#64748b" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="3,3" />
                    </pattern>
                    {/* Textura Acanalada Corrugada Vertical */}
                    <pattern id={`corrugated-${pz.id}`} width="14" height="20" patternUnits="userSpaceOnUse">
                      <rect x="0" y="0" width="7" height="20" fill="#cbd5e1" fillOpacity="0.8" />
                      <rect x="7" y="0" width="7" height="20" fill="#94a3b8" fillOpacity="0.9" />
                      <line x1="0" y1="0" x2="0" y2="20" stroke="#475569" strokeWidth="1" />
                      <line x1="7" y1="0" x2="7" y2="20" stroke="#f8fafc" strokeWidth="1" strokeOpacity="0.8" />
                      <line x1="14" y1="0" x2="14" y2="20" stroke="#334155" strokeWidth="1" />
                    </pattern>
                    {/* Textura Estriada Diamond Tread */}
                    <pattern id={`diamond-${pz.id}`} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="20" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.5" />
                      <line x1="0" y1="0" x2="20" y2="0" stroke="#64748b" strokeWidth="1.5" strokeOpacity="0.5" />
                      <line x1="5" y1="5" x2="15" y2="15" stroke="#475569" strokeWidth="2" strokeOpacity="0.7" />
                    </pattern>
                    {/* Textura Perforada */}
                    <pattern id={`dots-${pz.id}`} width="12" height="12" patternUnits="userSpaceOnUse">
                      <circle cx="6" cy="6" r="2" fill="#64748b" fillOpacity="0.6" />
                    </pattern>
                    {/* Textura Malla */}
                    <pattern id={`mesh-${pz.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#475569" strokeWidth="1" strokeOpacity="0.5" />
                    </pattern>
                  </defs>
                  <rect
                    x={rectX}
                    y={rectY}
                    width={rectW}
                    height={rectH}
                    fill={fillVal}
                    fillOpacity={isVidrio ? 0.7 : 1}
                    stroke={isSelected ? '#2563eb' : (isVidrio ? '#0284c7' : '#475569')}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    rx="2"
                    ry="2"
                  />
                  {/* Destellos de reflejo para Vidrio */}
                  {isVidrio && (
                    <g opacity="0.4">
                      <line x1={rectX + 10} y1={rectY + rectH - 10} x2={rectX + rectW - 10} y2={rectY + 10} stroke="#ffffff" strokeWidth="2" />
                      <line x1={rectX + 25} y1={rectY + rectH - 10} x2={rectX + rectW - 10} y2={rectY + 25} stroke="#ffffff" strokeWidth="1" />
                    </g>
                  )}
                  {/* Pernos / tornillos en esquinas ÚNICAMENTE SI conPernos === true */}
                  {pz.conPernos === true && rectW > 30 && rectH > 30 && (
                    <>
                      <circle cx={rectX + 10} cy={rectY + 10} r="3.5" fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
                      <circle cx={rectX + rectW - 10} cy={rectY + 10} r="3.5" fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
                      <circle cx={rectX + 10} cy={rectY + rectH - 10} r="3.5" fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
                      <circle cx={rectX + rectW - 10} cy={rectY + rectH - 10} r="3.5" fill="#1e293b" stroke="#ffffff" strokeWidth="1" />
                    </>
                  )}
                  {showBigLabel && (
                    <>
                      <rect
                        x={rectX + rectW / 2 - 70}
                        y={rectY + rectH / 2 - 14}
                        width="140"
                        height="28"
                        rx="6"
                        fill="#ffffff"
                        fillOpacity="0.9"
                        stroke={isSelected ? '#2563eb' : '#cbd5e1'}
                        strokeWidth="1"
                      />
                      <text
                        x={rectX + rectW / 2}
                        y={rectY + rectH / 2 - 3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fontWeight="extrabold"
                        fill="#1e293b"
                      >
                        {pz.marca}: {isMachihembrada ? 'Plancha Machihembrada' : (isAcanalada ? 'Plancha Acanalada Corrugada' : (isEstriada ? 'Plancha Estriada / Estrellada' : (isPerforada ? 'Plancha Perforada' : (isMalla ? 'Malla Metálica' : (isVidrio ? 'Vidrio Templado' : 'Plancha Lisa')))))}
                      </text>
                      <text
                        x={rectX + rectW / 2}
                        y={rectY + rectH / 2 + 9}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#2563eb"
                      >
                        Esp: {espStr} | {(pz.anchoPlanchaM || (rectW / (scalePxPerM * zoom))).toFixed(2)}m × {(pz.altoPlanchaM || (rectH / (scalePxPerM * zoom))).toFixed(2)}m
                      </text>
                    </>
                  )}
                </g>
              );
            }

            // Si es arco curvo
            if (pz.esCurvo) {
              const cX = pz.controlX !== undefined ? pz.controlX : (pz.x1 + pz.x2) / 2;
              const cY = pz.controlY !== undefined ? pz.controlY : Math.max(pz.y1, pz.y2) + (pz.flechaM || 0.35);
              const midScreen = worldToScreen(cX, cY);
              const pathD = `M ${p1Screen.x} ${p1Screen.y} Q ${midScreen.x} ${midScreen.y} ${p2Screen.x} ${p2Screen.y}`;
              return (
                <g 
                  key={pz.id} 
                  onClick={(e) => {
                    if (herramienta === 'select') {
                      e.stopPropagation();
                      onSelectElement(pz.id, 'tubo_personalizado');
                    }
                  }}
                  onPointerDown={(e) => {
                    if (herramienta !== 'select' || e.button !== 0) return;
                    e.stopPropagation();
                    onSelectElement(pz.id, 'tubo_personalizado');
                    const clickWorld = screenToWorld(e.clientX, e.clientY);
                    draggingElementRef.current = {
                      id: pz.id,
                      type: 'pieza',
                      handle: 'body',
                      initialP1: { x: pz.x1, y: pz.y1 },
                      initialP2: { x: pz.x2, y: pz.y2 },
                      dragStartWorldPt: clickWorld
                    };
                    setIsPanning(false);
                    isPanningRef.current = false;
                  }}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSelected ? '#2563eb' : '#1e293b'}
                    strokeWidth={strokeWidthPx}
                    strokeLinecap="round"
                    className={herramienta === 'select' ? "cursor-pointer hover:stroke-blue-500 transition-colors" : ""}
                  />
                  {isSelected && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth={strokeWidthPx + 6}
                      strokeOpacity="0.4"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            }

            // Pieza recta estándar
            const midX = (p1Screen.x + p2Screen.x) / 2;
            const midY = (p1Screen.y + p2Screen.y) / 2;
            const angleDeg = Math.atan2(pz.y2 - pz.y1, pz.x2 - pz.x1) * (180 / Math.PI);

            const isPlatina = perfil.categoria === 'platina';

            return (
              <g 
                key={pz.id}
                onClick={(e) => {
                  if (herramienta === 'select') {
                    e.stopPropagation();
                    onSelectElement(pz.id, 'tubo_personalizado');
                  }
                }}
                className={herramienta === 'select' ? "cursor-pointer group" : ""}
              >
                {/* Resaltado de selección */}
                {isSelected && (
                  <line
                    x1={p1Screen.x}
                    y1={p1Screen.y}
                    x2={p2Screen.x}
                    y2={p2Screen.y}
                    stroke="#3b82f6"
                    strokeWidth={strokeWidthPx + 8}
                    strokeOpacity="0.3"
                    strokeLinecap={isPlatina ? "round" : "square"}
                  />
                )}

                {/* Área invisible amplia para arrastrar el cuerpo de la pieza con total fluidez */}
                <line
                  x1={p1Screen.x}
                  y1={p1Screen.y}
                  x2={p2Screen.x}
                  y2={p2Screen.y}
                  stroke="transparent"
                  strokeWidth={Math.max(22, strokeWidthPx + 16)}
                  strokeLinecap="round"
                  className={herramienta === 'select' ? 'cursor-move' : ''}
                  onPointerDown={(e) => {
                    if (herramienta !== 'select' || e.button !== 0) return;
                    e.stopPropagation();
                    onSelectElement(pz.id, 'tubo_personalizado');
                    const clickWorld = screenToWorld(e.clientX, e.clientY);
                    draggingElementRef.current = {
                      id: pz.id,
                      type: 'pieza',
                      handle: 'body',
                      initialP1: { x: pz.x1, y: pz.y1 },
                      initialP2: { x: pz.x2, y: pz.y2 },
                      dragStartWorldPt: clickWorld
                    };
                    setIsPanning(false);
                    isPanningRef.current = false;
                  }}
                />

                {/* RENDERIZADO DE PERFIL METÁLICO (ESTÁNDAR LIMPIO) */}
                <line
                  x1={p1Screen.x}
                  y1={p1Screen.y}
                  x2={p2Screen.x}
                  y2={p2Screen.y}
                  stroke={isSelected ? '#1d4ed8' : '#1e293b'}
                  strokeWidth={strokeWidthPx}
                  strokeLinecap="square"
                  className={herramienta === 'select' ? "group-hover:stroke-blue-600 transition-colors" : ""}
                />
                <line
                  x1={p1Screen.x}
                  y1={p1Screen.y}
                  x2={p2Screen.x}
                  y2={p2Screen.y}
                  stroke={isSelected ? '#93c5fd' : '#cbd5e1'}
                  strokeWidth={Math.max(1, strokeWidthPx - 4)}
                  strokeLinecap="square"
                />

                {/* Etiqueta de medida centrada con indicador de Cara/Canto */}
                {(() => {
                  const mayorMm = Math.max(perfil.anchoMm, perfil.altoMm);
                  const menorMm = Math.min(perfil.anchoMm, perfil.altoMm);
                  const isRectangular = mayorMm !== menorMm && perfil.categoria !== 'tubo_redondo' && perfil.categoria !== 'platina';
                  const orientText = isRectangular ? (is90Rotated ? ` • Canto ${menorMm}` : ` • Cara ${mayorMm}`) : '';
                  const boxW = isRectangular ? 116 : 64;
                  const boxHalf = boxW / 2;

                  return (
                    <g transform={`translate(${midX}, ${midY}) rotate(${-angleDeg > 90 || -angleDeg < -90 ? -angleDeg + 180 : -angleDeg})`}>
                      <rect
                        x={-boxHalf}
                        y="-11"
                        width={boxW}
                        height="22"
                        rx="6"
                        fill="#ffffff"
                        stroke={isSelected ? '#2563eb' : '#94a3b8'}
                        strokeWidth="1.5"
                        className="shadow-xs"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="900"
                        fontFamily="monospace"
                        fill={isSelected ? '#1d4ed8' : '#0f172a'}
                      >
                        {(pz.longitudM).toFixed(2)}m{orientText}
                      </text>
                    </g>
                  );
                })()}

                {/* Tiradores de extremos si está seleccionada */}
                {isSelected && (
                  <>
                    <circle
                      cx={p1Screen.x}
                      cy={p1Screen.y}
                      r="6"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-move shadow-md"
                      onPointerDown={(e) => {
                        if (herramienta !== 'select' || e.button !== 0) return;
                        e.stopPropagation();
                        const clickWorld = screenToWorld(e.clientX, e.clientY);
                        draggingElementRef.current = {
                          id: pz.id,
                          type: 'pieza',
                          handle: 'start',
                          initialP1: { x: pz.x1, y: pz.y1 },
                          initialP2: { x: pz.x2, y: pz.y2 },
                          dragStartWorldPt: clickWorld
                        };
                        setIsPanning(false);
                        isPanningRef.current = false;
                      }}
                    />
                    <circle
                      cx={p2Screen.x}
                      cy={p2Screen.y}
                      r="6"
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="cursor-move shadow-md"
                      onPointerDown={(e) => {
                        if (herramienta !== 'select' || e.button !== 0) return;
                        e.stopPropagation();
                        const clickWorld = screenToWorld(e.clientX, e.clientY);
                        draggingElementRef.current = {
                          id: pz.id,
                          type: 'pieza',
                          handle: 'end',
                          initialP1: { x: pz.x1, y: pz.y1 },
                          initialP2: { x: pz.x2, y: pz.y2 },
                          dragStartWorldPt: clickWorld
                        };
                        setIsPanning(false);
                        isPanningRef.current = false;
                      }}
                    />
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* ========================================================
            RENDERIZADO DE ACCESORIOS (BISAGRAS, CHAPAS, RUEDAS)
        ======================================================== */}
        <g id="accesorios-group">
          {accesorios.map((acc) => {
            const accScreen = worldToScreen(acc.x, acc.y);
            const isSelected = selectedElementId === acc.id;

            return (
              <g
                key={acc.id}
                transform={`translate(${accScreen.x}, ${accScreen.y})`}
                onClick={(e) => {
                  if (herramienta === 'select') {
                    e.stopPropagation();
                    onSelectElement(acc.id, acc.tipo.includes('chapa') ? 'chapa' : (acc.tipo.includes('bisagra') ? 'bisagras' : 'cerrojo'));
                  }
                }}
                onPointerDown={(e) => {
                  if (herramienta !== 'select' || e.button !== 0) return;
                  e.stopPropagation();
                  onSelectElement(acc.id, acc.tipo.includes('chapa') ? 'chapa' : (acc.tipo.includes('bisagra') ? 'bisagras' : 'cerrojo'));
                  const clickWorld = screenToWorld(e.clientX, e.clientY);
                  draggingElementRef.current = {
                    id: acc.id,
                    type: 'accesorio',
                    handle: 'acc',
                    initialP1: { x: acc.x, y: acc.y },
                    initialP2: { x: acc.x, y: acc.y },
                    initialAccPos: { x: acc.x, y: acc.y },
                    dragStartWorldPt: clickWorld
                  };
                  setIsPanning(false);
                  isPanningRef.current = false;
                }}
                className={herramienta === 'select' ? "cursor-move" : ""}
              >
                {/* Resaltado */}
                {isSelected && (
                  <circle r="16" fill="#3b82f6" fillOpacity="0.2" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2,2" />
                )}

                {/* Símbolo de Bisagra */}
                {acc.tipo.includes('bisagra') && (
                  <g>
                    <rect x="-4" y="-12" width="8" height="24" rx="2" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
                    <line x1="-8" y1="-6" x2="-4" y2="-6" stroke="#0f172a" strokeWidth="2" />
                    <line x1="4" y1="6" x2="8" y2="6" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="0" cy="0" r="1.5" fill="#f8fafc" />
                  </g>
                )}

                {/* Símbolo de Chapa / Cerradura */}
                {(acc.tipo.includes('chapa') || acc.tipo.includes('cerradura')) && (
                  <g>
                    <rect x="-10" y="-14" width="20" height="28" rx="3" fill="#334155" stroke="#0f172a" strokeWidth="1.5" />
                    <circle cx="0" cy="-4" r="3" fill="#d97706" />
                    <rect x="-2" y="-1" width="4" height="7" rx="1" fill="#d97706" />
                    <rect x={acc.lado === 'izquierda' ? '-18' : '6'} y="4" width="12" height="4" rx="1" fill="#94a3b8" />
                  </g>
                )}

                {/* Símbolo de Rueda */}
                {acc.tipo.includes('rueda') && (
                  <g>
                    <circle cx="0" cy="0" r="10" fill="#64748b" stroke="#0f172a" strokeWidth="2" />
                    <circle cx="0" cy="0" r="3" fill="#f8fafc" />
                    <rect x="-6" y="-14" width="12" height="6" fill="#334155" />
                  </g>
                )}

                {/* Símbolo de Placa Base */}
                {acc.tipo.includes('placa_base') && (
                  <g>
                    <rect x="-12" y="-12" width="24" height="24" rx="2" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
                    <circle cx="-7" cy="-7" r="1.5" fill="#0f172a" />
                    <circle cx="7" cy="-7" r="1.5" fill="#0f172a" />
                    <circle cx="-7" cy="7" r="1.5" fill="#0f172a" />
                    <circle cx="7" cy="7" r="1.5" fill="#0f172a" />
                  </g>
                )}

                {/* Etiqueta del accesorio */}
                <text
                  x="14"
                  y="4"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#1e293b"
                  className="bg-white/80"
                >
                  {acc.nombre}
                </text>
              </g>
            );
          })}
        </g>

        {/* ========================================================
            RENDERIZADO DE COTAS PARAMÉTRICAS
        ======================================================== */}
        <g id="cotas-group">
          {cotas.map((c) => {
            const p1 = worldToScreen(c.x1, c.y1);
            const p2 = worldToScreen(c.x2, c.y2);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - 12;

            return (
              <g key={c.id}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#2563eb"
                  strokeWidth="1.25"
                  markerStart="url(#cota-arrow-start)"
                  markerEnd="url(#cota-arrow-end)"
                />
                <rect
                  x={midX - 30}
                  y={midY - 11}
                  width="60"
                  height="22"
                  rx="6"
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  className="shadow-xs"
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="900"
                  fontFamily="monospace"
                  fill="#1d4ed8"
                >
                  {c.valorM.toFixed(2)}m
                </text>
              </g>
            );
          })}
        </g>

        {/* ========================================================
            PREVISUALIZACIÓN DE DIBUJO ACTIVO (FANTASMA)
        ======================================================== */}
        {drawStep === 1 && startPoint && (
          <g>
            {/* Si es rectángulo */}
            {herramienta === 'rectangulo' ? (
              <rect
                x={Math.min(worldToScreen(startPoint.x, startPoint.y).x, worldToScreen(currentWorldPointer.x, currentWorldPointer.y).x)}
                y={Math.min(worldToScreen(startPoint.x, startPoint.y).y, worldToScreen(currentWorldPointer.x, currentWorldPointer.y).y)}
                width={Math.abs(worldToScreen(currentWorldPointer.x, currentWorldPointer.y).x - worldToScreen(startPoint.x, startPoint.y).x)}
                height={Math.abs(worldToScreen(currentWorldPointer.x, currentWorldPointer.y).y - worldToScreen(startPoint.x, startPoint.y).y)}
                fill="#dbeafe"
                fillOpacity="0.3"
                stroke="#2563eb"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            ) : herramienta === 'arco' ? (
              /* En Arco Paso 1: Cuerda guía ámbar hacia el cursor */
              <g>
                <line
                  x1={worldToScreen(startPoint.x, startPoint.y).x}
                  y1={worldToScreen(startPoint.x, startPoint.y).y}
                  x2={worldToScreen(currentWorldPointer.x, currentWorldPointer.y).x}
                  y2={worldToScreen(currentWorldPointer.x, currentWorldPointer.y).y}
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeDasharray="4,4"
                />
                <circle
                  cx={worldToScreen(currentWorldPointer.x, currentWorldPointer.y).x}
                  cy={worldToScreen(currentWorldPointer.x, currentWorldPointer.y).y}
                  r="5"
                  fill="#ffffff"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
              </g>
            ) : (
              /* Línea estándar con Detección Ortogonal Inteligente (Polar Tracking) y HUD en tiempo real */
              (() => {
                const p1S = worldToScreen(startPoint.x, startPoint.y);
                const p2S = worldToScreen(currentWorldPointer.x, currentWorldPointer.y);
                const dx = currentWorldPointer.x - startPoint.x;
                const dy = currentWorldPointer.y - startPoint.y;
                const lengthM = Math.hypot(dx, dy);
                const angleRad = Math.atan2(dy, dx);
                let angleDeg = Math.round(angleRad * (180 / Math.PI));
                if (angleDeg < 0) angleDeg += 360;

                const isHorizontalStraight = Math.abs(dy) < 0.035 || Math.abs(angleDeg - 0) <= 3 || Math.abs(angleDeg - 180) <= 3 || Math.abs(angleDeg - 360) <= 3 || herramienta === 'horizontal';
                const isVerticalStraight = Math.abs(dx) < 0.035 || Math.abs(angleDeg - 90) <= 3 || Math.abs(angleDeg - 270) <= 3 || herramienta === 'vertical';
                const isStraight = isHorizontalStraight || isVerticalStraight;

                return (
                  <g>
                    {/* Guía de Eje Infinito Polar Tracking (AutoCAD style) */}
                    {isHorizontalStraight && (
                      <line
                        x1="-10000"
                        y1={p1S.y}
                        x2="10000"
                        y2={p1S.y}
                        stroke="#10b981"
                        strokeWidth="1.25"
                        strokeDasharray="6,4"
                        strokeOpacity="0.75"
                      />
                    )}
                    {isVerticalStraight && (
                      <line
                        x1={p1S.x}
                        y1="-10000"
                        x2={p1S.x}
                        y2="10000"
                        stroke="#10b981"
                        strokeWidth="1.25"
                        strokeDasharray="6,4"
                        strokeOpacity="0.75"
                      />
                    )}

                    {/* Halo de confirmación cuando está recto */}
                    {isStraight && (
                      <line
                        x1={p1S.x}
                        y1={p1S.y}
                        x2={p2S.x}
                        y2={p2S.y}
                        stroke="#a7f3d0"
                        strokeWidth="8"
                        strokeOpacity="0.5"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Trazo elástico de la línea */}
                    <line
                      x1={p1S.x}
                      y1={p1S.y}
                      x2={p2S.x}
                      y2={p2S.y}
                      stroke={isStraight ? "#10b981" : "#2563eb"}
                      strokeWidth={isStraight ? "3.5" : "2.5"}
                      strokeDasharray={isStraight ? "6,3" : "5,5"}
                    />

                    {/* Nodo de cursor activo */}
                    <circle
                      cx={p2S.x}
                      cy={p2S.y}
                      r="5"
                      fill={isStraight ? "#10b981" : "#2563eb"}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* HUD Flotante con Medida y Ángulo en Tiempo Real */}
                    <g transform={`translate(${p2S.x + 14}, ${p2S.y - 36})`} className="pointer-events-none select-none">
                      <rect
                        x="0"
                        y="0"
                        width={isStraight ? 180 : 150}
                        height="32"
                        rx="8"
                        fill={isStraight ? "#064e3b" : "#0f172a"}
                        fillOpacity="0.94"
                        stroke={isStraight ? "#10b981" : "#3b82f6"}
                        strokeWidth="1.5"
                      />
                      <text x="10" y="14" fill="#ffffff" fontSize="10" fontWeight="bold">
                        {isStraight 
                          ? (isHorizontalStraight ? '🟢 RECTO 0.0° (Horizontal)' : '🟢 RECTO 90.0° (Vertical)')
                          : `📐 Ángulo: ${angleDeg}°`}
                      </text>
                      <text x="10" y="26" fill={isStraight ? "#6ee7b7" : "#93c5fd"} fontSize="10" fontFamily="monospace" fontWeight="bold">
                        Longitud: {lengthM.toFixed(2)}m
                      </text>
                    </g>
                  </g>
                );
              })()
            )}

            {/* Marcador de inicio */}
            <circle
              cx={worldToScreen(startPoint.x, startPoint.y).x}
              cy={worldToScreen(startPoint.x, startPoint.y).y}
              r="5"
              fill={herramienta === 'arco' ? '#f59e0b' : '#2563eb'}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* Previsualización interactiva de ARCO (Paso 2: Arqueo elástico en vivo) */}
        {drawStep === 2 && startPoint && arcEndPoint && herramienta === 'arco' && (() => {
          const p1S = worldToScreen(startPoint.x, startPoint.y);
          const p2S = worldToScreen(arcEndPoint.x, arcEndPoint.y);
          const pCtrlS = worldToScreen(currentWorldPointer.x, currentWorldPointer.y);
          const midWorld = { x: (startPoint.x + arcEndPoint.x) / 2, y: (startPoint.y + arcEndPoint.y) / 2 };
          const midS = worldToScreen(midWorld.x, midWorld.y);
          const chordDist = Math.hypot(arcEndPoint.x - startPoint.x, arcEndPoint.y - startPoint.y);
          const nx = chordDist > 0.001 ? -(arcEndPoint.y - startPoint.y) / chordDist : 0;
          const ny = chordDist > 0.001 ? (arcEndPoint.x - startPoint.x) / chordDist : 1;
          const flecha = (currentWorldPointer.x - midWorld.x) * nx + (currentWorldPointer.y - midWorld.y) * ny;
          const flechaCm = Math.round(Math.abs(flecha) * 100);
          const radioCm = flechaCm > 0 ? Math.round(((chordDist * 100) ** 2) / (8 * flechaCm) + flechaCm / 2) : 0;
          const pathD = `M ${p1S.x} ${p1S.y} Q ${pCtrlS.x} ${pCtrlS.y} ${p2S.x} ${p2S.y}`;

          return (
            <g>
              {/* Cuerda de referencia recta */}
              <line x1={p1S.x} y1={p1S.y} x2={p2S.x} y2={p2S.y} stroke="#94a3b8" strokeDasharray="3,3" strokeWidth="1.5" />
              
              {/* Guía perpendicular desde el punto medio hacia el cursor */}
              <line x1={midS.x} y1={midS.y} x2={pCtrlS.x} y2={pCtrlS.y} stroke="#f59e0b" strokeDasharray="2,2" strokeWidth="1.5" strokeOpacity="0.8" />

              {/* Halo brillante de la curva en vivo */}
              <path d={pathD} fill="none" stroke="#fef3c7" strokeWidth="12" strokeOpacity="0.45" strokeLinecap="round" />
              
              {/* Trazo curvo elástico en vivo */}
              <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

              {/* Nodos de extremos fijados */}
              <circle cx={p1S.x} cy={p1S.y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx={p2S.x} cy={p2S.y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

              {/* Nodo central de control que sigue el cursor */}
              <circle cx={pCtrlS.x} cy={pCtrlS.y} r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />

              {/* HUD flotante con medidas en tiempo real */}
              <g transform={`translate(${pCtrlS.x + 16}, ${pCtrlS.y - 48})`}>
                <rect x="0" y="0" width="185" height="46" rx="10" fill="#0f172a" fillOpacity="0.94" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="10" y="18" fill="#fbbf24" fontSize="11" fontWeight="bold">🏹 Clic para fijar curva</text>
                <text x="10" y="34" fill="#f1f5f9" fontSize="10" fontFamily="monospace">
                  Flecha: <tspan fill="#38bdf8" fontWeight="bold">{flechaCm}cm</tspan> {radioCm > 0 ? `• R: ${radioCm}cm` : ''}
                </text>
              </g>
            </g>
          );
        })()}

        {/* ========================================================
            GLIFO VISUAL DE SNAP ACTIVO
        ======================================================== */}
        {activeSnap && activeSnap.type !== 'none' && (
          <g transform={`translate(${worldToScreen(activeSnap.x, activeSnap.y).x}, ${worldToScreen(activeSnap.x, activeSnap.y).y})`}>
            {activeSnap.type === 'endpoint' && (
              <rect x="-6" y="-6" width="12" height="12" fill="none" stroke="#10b981" strokeWidth="2" />
            )}
            {activeSnap.type === 'adjacent' && (
              <g stroke="#3b82f6" strokeWidth="2">
                <line x1="-7" y1="-7" x2="-7" y2="7" />
                <line x1="7" y1="-7" x2="7" y2="7" />
                <circle r="3" fill="#3b82f6" />
              </g>
            )}
            {activeSnap.type === 'midpoint' && (
              <polygon points="0,-7 6,5 -6,5" fill="none" stroke="#06b6d4" strokeWidth="2" />
            )}
            {activeSnap.type === 'intersection' && (
              <g stroke="#eab308" strokeWidth="2">
                <line x1="-5" y1="-5" x2="5" y2="5" />
                <line x1="-5" y1="5" x2="5" y2="-5" />
              </g>
            )}
            {activeSnap.type === 'segment' && (
              <g stroke="#8b5cf6" strokeWidth="2">
                <line x1="-5" y1="0" x2="5" y2="0" />
                <line x1="0" y1="-5" x2="0" y2="5" />
              </g>
            )}
            {activeSnap.type === 'grid' && (
              <circle r="3" fill="#3b82f6" />
            )}
          </g>
        )}
      </svg>

      {/* Indicador flotante interactivo de ayuda paso a paso para Arco */}
      {herramienta === 'arco' && (
        <div className="absolute top-16 sm:top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none max-w-[92vw]">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900/90 text-white shadow-xl border border-amber-500/60 backdrop-blur-md text-[11px] sm:text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>
              {drawStep === 0 && 'Paso 1: Haz clic en el punto de inicio del arco'}
              {drawStep === 1 && 'Paso 2: Mueve el cursor y haz clic en el punto final del arco'}
              {drawStep === 2 && 'Paso 3: Mueve el cursor para arquear la curva en vivo y haz clic para fijarla (Esc = Cancelar)'}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          MENÚ CONTEXTUAL AVANZADO (CLIC DERECHO / LONG-PRESS)
      ======================================================== */}
      {contextMenuPos && (
        <HerreriaContextMenu
          position={contextMenuPos}
          pieza={piezas.find(p => p.id === contextMenuPos.targetId)}
          accesorio={accesorios.find(a => a.id === contextMenuPos.targetId)}
          onClose={() => setContextMenuPos(null)}
          onChangeCortes={handleChangeCortes}
          onChangePerfil={handleChangePerfil}
          onChangeLongitud={handleChangeLongitud}
          onAddPlatinaTope={handleAddPlatinaTope}
          onDuplicatePiece={handleDuplicarSeleccion}
          onRotatePiece={handleRotar90}
          onMirrorPiece={handleEspejo}
          onDeletePiece={handleDeletePiece}
          onDeleteAccesorio={handleDeleteAccesorio}
          onSelectTool={(tool) => {
            setHerramienta(tool);
            setDrawStep(0);
          }}
        />
      )}

      {/* ========================================================
          MODAL DE GESTOS TÁCTILES Y ATAJOS DE TECLADO
      ======================================================== */}
      <CadGesturesAndShortcutsModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        modulo="herreria"
      />
    </div>
  );
};
