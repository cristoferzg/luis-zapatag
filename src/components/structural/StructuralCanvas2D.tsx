import React, { useState, useRef, useEffect } from 'react';
import { 
  ColumnElement, 
  BeamElement, 
  PurlinElement, 
  ViewMode2D, 
  CADTool, 
  StructuralGeometry,
  EvacuacionOptions,
  Point2D
} from './structuralTypes';
import { calculateRoofGeometry, calcPolygonArea, getPolygonBounds } from './structuralGenerator';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Check, 
  X, 
  Droplets, 
  Undo2, 
  Ruler,
  Maximize,
  Crosshair,
  Grid as GridIcon,
  Magnet,
  Hash,
  GripVertical,
  Keyboard
} from 'lucide-react';
import { StructuralContextMenu, StructuralContextMenuPos } from './StructuralContextMenu';
import { CadGesturesAndShortcutsModal } from '../common/CadGesturesAndShortcutsModal';

interface Canvas2DProps {
  viewMode: ViewMode2D;
  activeTool: CADTool;
  geometria: StructuralGeometry;
  columnas: ColumnElement[];
  vigas: BeamElement[];
  correas: PurlinElement[];
  evacuacion?: EvacuacionOptions;
  selectedItem: {
    type: 'column' | 'beam' | 'purlin' | 'sector' | 'edge' | 'vertex' | 'void';
    item: any;
  } | null;
  onSelectItem: (selection: any) => void;
  onAddColumn: (col: ColumnElement) => void;
  onAddBeam: (beam: BeamElement) => void;
  onAddPurlin?: (purlin: PurlinElement) => void;
  onDeleteItem?: (id: string, type: 'column' | 'beam' | 'purlin' | 'sector' | 'void') => void;
  onUpdateColumnPos: (id: string, x: number, y: number) => void;
  onUpdateColumnProps?: (id: string, props: Partial<ColumnElement>) => void;
  showCotas: boolean;
  showCorreas: boolean;
  showArriostres: boolean;
  onEditDimension?: (dim: 'largo' | 'ancho') => void;
  // Free CAD callbacks
  onCompletePolygon?: (vertices: Point2D[], isVoid: boolean) => void;
  onUpdateEdgeLength?: (sectorId: string, edgeIndex: number, newLengthM: number) => void;
  onToggleEdgeGutter?: (sectorId: string, edgeIndex: number) => void;
  onAddDownspout?: (sectorId: string, edgeIndex: number) => void;
  onUpdateVertexZ?: (sectorId: string, vertexIndex: number, newZ: number) => void;
  activeSectorId?: string;
  onSelectSectorId?: (sectorId: string) => void;
}

export const StructuralCanvas2D: React.FC<Canvas2DProps> = ({
  viewMode,
  activeTool,
  geometria,
  columnas,
  vigas,
  correas,
  evacuacion: _evacuacion,
  selectedItem,
  onSelectItem,
  onAddColumn,
  onAddBeam,
  onAddPurlin,
  onDeleteItem,
  onUpdateColumnPos,
  onUpdateColumnProps,
  showCotas,
  showCorreas,
  showArriostres,
  onEditDimension,
  onCompletePolygon,
  onUpdateEdgeLength,
  onToggleEdgeGutter,
  onAddDownspout,
  onUpdateVertexZ,
  activeSectorId,
  onSelectSectorId
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Zoom and Pan
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 90, y: 80 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Viewport HUD toggles
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);

  // Mouse drag tracking refs
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);

  // Touch gestures refs
  const touchDistanceRef = useRef<number | null>(null);
  const touchMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Menú contextual avanzado y modal de atajos
  const [contextMenuPos, setContextMenuPos] = useState<StructuralContextMenuPos | null>(null);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Interactive CAD Polygon drawing state
  const [drawingPoints, setDrawingPoints] = useState<Point2D[]>([]);
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number; z?: number }>({ x: 0, y: 0, z: 0 });
  const cursorWorldRef = useRef<{ x: number; y: number; z?: number }>({ x: 0, y: 0, z: 0 });
  const rafIdRef = useRef<number | null>(null);

  // Collapsible & Movable HUD State
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [hudPos, setHudPos] = useState<{ x?: number; y?: number }>({});
  const [isDraggingHud, setIsDraggingHud] = useState<boolean>(false);
  const hudDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handlePointerDownHud = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;
    e.stopPropagation();
    setIsDraggingHud(true);

    const el = e.currentTarget as HTMLElement;
    const parent = el.parentElement;
    const rect = el.getBoundingClientRect();
    const parentRect = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };

    const curX = hudPos.x !== undefined ? hudPos.x : (rect.left - parentRect.left);
    const curY = hudPos.y !== undefined ? hudPos.y : (rect.top - parentRect.top);

    hudDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: curX,
      initialY: curY
    };

    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMoveHud = (e: React.PointerEvent) => {
    if (!isDraggingHud || !hudDragRef.current) return;
    const dx = e.clientX - hudDragRef.current.startX;
    const dy = e.clientY - hudDragRef.current.startY;

    const maxW = window.innerWidth - 80;
    const maxH = window.innerHeight - 60;

    setHudPos({
      x: Math.max(8, Math.min(maxW, hudDragRef.current.initialX + dx)),
      y: Math.max(8, Math.min(maxH, hudDragRef.current.initialY + dy))
    });
  };

  const handlePointerUpHud = (e: React.PointerEvent) => {
    if (isDraggingHud) {
      setIsDraggingHud(false);
      hudDragRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Node Dragging
  const [draggingColId, setDraggingColId] = useState<string | null>(null);

  // Edge & Vertex inline editing states
  const [selectedEdge, setSelectedEdge] = useState<{ sectorId: string; edgeIndex: number; length: number; p1: Point2D; p2: Point2D } | null>(null);
  const [edgeInputVal, setEdgeInputVal] = useState<string>('');
  const [selectedVertex, setSelectedVertex] = useState<{ sectorId: string; vertexIndex: number; p: Point2D } | null>(null);
  const [vertexZInputVal, setVertexZInputVal] = useState<string>('');

  // Interactive beam drawing
  const [beamStartNode, setBeamStartNode] = useState<{ x: number; y: number; z: number; colId?: string } | null>(null);

  const calc = calculateRoofGeometry(geometria);

  // Reset drawing when activeTool changes away from drawing tools
  useEffect(() => {
    if (activeTool !== 'draw_polygon' && activeTool !== 'draw_void' && activeTool !== 'draw_translucent') {
      setDrawingPoints([]);
    }
  }, [activeTool]);

  // KEYBOARD SHORTCUTS: Esc, Delete, Zoom, Grid, Magnet, Reset View, Help Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'Escape') {
        setContextMenuPos(null);
        setShowHelpModal(false);
        if (drawingPoints.length > 0) {
          setDrawingPoints([]);
        }
        if (selectedEdge) setSelectedEdge(null);
        if (selectedVertex) setSelectedVertex(null);
        if (beamStartNode) setBeamStartNode(null);
        onSelectItem(null);
      } else if (e.key === 'Enter') {
        if (drawingPoints.length >= 3 && onCompletePolygon) {
          onCompletePolygon(drawingPoints, activeTool === 'draw_void');
          setDrawingPoints([]);
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItem && onDeleteItem) {
        e.preventDefault();
        onDeleteItem(selectedItem.item.id, selectedItem.type as any);
        onSelectItem(null);
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGrid(g => !g);
      } else if (e.key === 'm' || e.key === 'M') {
        setSnapEnabled(s => !s);
      } else if (e.key === 'a' || e.key === 'A') {
        setShowAxes(a => !a);
      } else if (e.key === '+' || e.key === '=') {
        setZoom(z => Math.min(4, z * 1.25));
      } else if (e.key === '-' || e.key === '_') {
        setZoom(z => Math.max(0.3, z / 1.25));
      } else if (e.key === '0') {
        fitToArea();
      } else if (e.key === '?') {
        setShowHelpModal(m => !m);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingPoints, selectedItem, selectedEdge, selectedVertex, beamStartNode, activeTool, onDeleteItem, onCompletePolygon, onSelectItem]);

  // Scaling factor: 1 meter = 35 pixels on screen
  const SCALE = 35;
  const maxZ = (calc.alturaLadoAlto || 3.50) + 1.5;

  const worldToScreen = (wx: number, wy: number, wz: number = 0) => {
    if (viewMode === 'planta') {
      return {
        sx: wx * SCALE,
        sy: wy * SCALE
      };
    } else if (viewMode === 'elevacion_frontal' || viewMode === 'seccion') {
      return {
        sx: wy * SCALE,
        sy: (maxZ - wz) * SCALE
      };
    } else {
      // elevacion_lateral or elevacion
      return {
        sx: wx * SCALE,
        sy: (maxZ - wz) * SCALE
      };
    }
  };

  const screenToWorld = (screenX: number, screenY: number) => {
    const unPanX = (screenX - pan.x) / zoom;
    const unPanY = (screenY - pan.y) / zoom;

    // Snap to 0.25m if snap is enabled
    const snap = (v: number) => snapEnabled ? Math.max(0, Math.round((v / SCALE) * 4) / 4) : Math.max(0, parseFloat((v / SCALE).toFixed(2)));

    if (viewMode === 'planta') {
      return {
        wx: snap(unPanX),
        wy: snap(unPanY),
        wz: 0
      };
    } else if (viewMode === 'elevacion_frontal' || viewMode === 'seccion') {
      return {
        wx: 0,
        wy: snap(unPanX),
        wz: snapEnabled ? Math.max(0, Math.round((maxZ - (unPanY / SCALE)) * 4) / 4) : Math.max(0, parseFloat((maxZ - (unPanY / SCALE)).toFixed(2)))
      };
    } else {
      return {
        wx: snap(unPanX),
        wy: 0,
        wz: snapEnabled ? Math.max(0, Math.round((maxZ - (unPanY / SCALE)) * 4) / 4) : Math.max(0, parseFloat((maxZ - (unPanY / SCALE)).toFixed(2)))
      };
    }
  };

  // Intelligent CAD Snapping to Sector Vertices, Roof Perimeter, and Ortho Angles
  const getSmartSnapPoint = (rawWx: number, rawWy: number) => {
    if (!snapEnabled) return { wx: rawWx, wy: rawWy, snapType: null };

    let bestX = rawWx;
    let bestY = rawWy;
    let minDistance = 0.40; // Magnet snap radius in meters
    let snapType: 'vertex' | 'edge' | 'ortho' | null = null;

    // 1. Magnetic snap to existing sector vertices
    if (geometria.sectores && geometria.sectores.length > 0) {
      for (const s of geometria.sectores) {
        for (const v of s.vertices) {
          const d = Math.hypot(rawWx - v.x, rawWy - v.y);
          if (d < minDistance) {
            minDistance = d;
            bestX = v.x;
            bestY = v.y;
            snapType = 'vertex';
          }
        }
      }
    }

    // 2. Magnetic snap to roof boundary corners
    const boundaryCorners = [
      { x: 0, y: 0 },
      { x: geometria.largo, y: 0 },
      { x: geometria.largo, y: geometria.ancho },
      { x: 0, y: geometria.ancho }
    ];
    for (const c of boundaryCorners) {
      const d = Math.hypot(rawWx - c.x, rawWy - c.y);
      if (d < minDistance) {
        minDistance = d;
        bestX = c.x;
        bestY = c.y;
        snapType = 'vertex';
      }
    }

    // 3. Orthogonal lock to previous point
    if (!snapType && drawingPoints.length > 0) {
      const lastPt = drawingPoints[drawingPoints.length - 1];
      if (Math.abs(rawWx - lastPt.x) < 0.25) {
        bestX = lastPt.x;
        snapType = 'ortho';
      }
      if (Math.abs(rawWy - lastPt.y) < 0.25) {
        bestY = lastPt.y;
        snapType = 'ortho';
      }
    }

    // 4. Perimeter edge lock
    if (!snapType) {
      if (Math.abs(rawWx - 0) < 0.20) { bestX = 0; snapType = 'edge'; }
      else if (Math.abs(rawWx - geometria.largo) < 0.20) { bestX = geometria.largo; snapType = 'edge'; }
      if (Math.abs(rawWy - 0) < 0.20) { bestY = 0; snapType = 'edge'; }
      else if (Math.abs(rawWy - geometria.ancho) < 0.20) { bestY = geometria.ancho; snapType = 'edge'; }
    }

    return { wx: bestX, wy: bestY, snapType };
  };

  // Viewport Fit to Area
  const fitToArea = () => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const bounds = geometria.sectores && geometria.sectores.length > 0
      ? getPolygonBounds(geometria.sectores.flatMap(s => s.vertices))
      : { minX: 0, maxX: geometria.largo, minY: 0, maxY: geometria.ancho, length: geometria.largo, width: geometria.ancho };

    const widthPx = Math.max(1, bounds.length * SCALE);
    const heightPx = Math.max(1, bounds.width * SCALE);

    const padding = 100;
    const availW = Math.max(100, rect.width - padding);
    const availH = Math.max(100, rect.height - padding);
    const zoomX = availW / widthPx;
    const zoomY = availH / heightPx;
    const newZoom = Math.min(Math.max(0.4, Math.min(zoomX, zoomY)), 3.0);

    const centerScreenX = rect.width / 2;
    const centerScreenY = rect.height / 2;
    const centerWorldX = (bounds.minX + bounds.maxX) / 2;
    const centerWorldY = (bounds.minY + bounds.maxY) / 2;

    const newPanX = centerScreenX - (centerWorldX * SCALE * newZoom);
    const newPanY = centerScreenY - (centerWorldY * SCALE * newZoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Viewport Center
  const centerDrawing = () => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const bounds = geometria.sectores && geometria.sectores.length > 0
      ? getPolygonBounds(geometria.sectores.flatMap(s => s.vertices))
      : { minX: 0, maxX: geometria.largo, minY: 0, maxY: geometria.ancho, length: geometria.largo, width: geometria.ancho };

    const centerScreenX = rect.width / 2;
    const centerScreenY = rect.height / 2;
    const centerWorldX = (bounds.minX + bounds.maxX) / 2;
    const centerWorldY = (bounds.minY + bounds.maxY) / 2;

    const newPanX = centerScreenX - (centerWorldX * SCALE * zoom);
    const newPanY = centerScreenY - (centerWorldY * SCALE * zoom);

    setPan({ x: newPanX, y: newPanY });
  };

  const openContextMenuAt = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);

    // 1. Columnas
    const nearCol = columnas.find(c => Math.hypot(c.x - world.wx, c.y - world.wy) < 0.6);
    if (nearCol) {
      onSelectItem({ type: 'column', item: nearCol });
      setContextMenuPos({
        x: clientX,
        y: clientY,
        targetId: nearCol.id,
        targetType: 'column'
      });
      return;
    }

    // 2. Vigas
    const nearBeam = vigas.find(b => {
      const p1x = b.startNode?.x ?? 0;
      const p1y = b.startNode?.y ?? 0;
      const p2x = b.endNode?.x ?? 0;
      const p2y = b.endNode?.y ?? 0;
      const l2 = (p2x - p1x) ** 2 + (p2y - p1y) ** 2;
      if (l2 === 0) return Math.hypot(world.wx - p1x, world.wy - p1y) < 0.5;
      let t = ((world.wx - p1x) * (p2x - p1x) + (world.wy - p1y) * (p2y - p1y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const dist = Math.hypot(world.wx - (p1x + t * (p2x - p1x)), world.wy - (p1y + t * (p2y - p1y)));
      return dist < 0.5;
    });
    if (nearBeam) {
      onSelectItem({ type: 'beam', item: nearBeam });
      setContextMenuPos({
        x: clientX,
        y: clientY,
        targetId: nearBeam.id,
        targetType: 'beam',
        targetItem: nearBeam
      });
      return;
    }

    // 3. Correas / Costaneras
    const nearPurlin = correas.find(p => {
      const p1x = p.startNode?.x ?? 0;
      const p1y = p.startNode?.y ?? 0;
      const p2x = p.endNode?.x ?? 0;
      const p2y = p.endNode?.y ?? 0;
      const l2 = (p2x - p1x) ** 2 + (p2y - p1y) ** 2;
      if (l2 === 0) return Math.hypot(world.wx - p1x, world.wy - p1y) < 0.4;
      let t = ((world.wx - p1x) * (p2x - p1x) + (world.wy - p1y) * (p2y - p1y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const dist = Math.hypot(world.wx - (p1x + t * (p2x - p1x)), world.wy - (p1y + t * (p2y - p1y)));
      return dist < 0.4;
    });
    if (nearPurlin) {
      onSelectItem({ type: 'purlin', item: nearPurlin });
      setContextMenuPos({
        x: clientX,
        y: clientY,
        targetId: nearPurlin.id,
        targetType: 'purlin',
        targetItem: nearPurlin
      });
      return;
    }

    // 4. Lienzo / Canvas
    setContextMenuPos({
      x: clientX,
      y: clientY,
      targetType: 'canvas'
    });
  };

  // Touch event handlers: Pinch zoom, 2-finger pan, 1-finger long-press / double tap
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchDistanceRef.current = dist;
      touchMidpointRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      const now = Date.now();

      if (now - lastTapTimeRef.current < 300) {
        fitToArea();
        lastTapTimeRef.current = 0;
        return;
      }
      lastTapTimeRef.current = now;

      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(40); } catch (_) {}
        }
        openContextMenuAt(touch.clientX, touch.clientY);
      }, 450);

      if (activeTool === 'pan') {
        setIsPanning(true);
        setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (longPressTimerRef.current && touchStartPosRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const dist = Math.hypot(touch.clientX - touchStartPosRef.current.x, touch.clientY - touchStartPosRef.current.y);
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
      const targetZoom = Math.min(Math.max(0.3, zoom * zoomFactor), 4.0);

      const deltaPanX = newMidpoint.x - touchMidpointRef.current.x;
      const deltaPanY = newMidpoint.y - touchMidpointRef.current.y;

      setZoom(targetZoom);
      setPan(p => ({ x: p.x + deltaPanX, y: p.y + deltaPanY }));

      touchDistanceRef.current = newDist;
      touchMidpointRef.current = newMidpoint;
    } else if (e.touches.length === 1 && isPanning) {
      const touch = e.touches[0];
      setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
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
    setIsPanning(false);
  };

  // SVG Mouse Handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;

    if (e.button === 1 || e.button === 2 || activeTool === 'pan') {
      setIsPanning(true);
      isPanningRef.current = true;
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);

    // 1. DRAW POLYGON / DRAW VOID / DRAW TRANSLUCENT TOOL
    if ((activeTool === 'draw_polygon' || activeTool === 'draw_void' || activeTool === 'draw_translucent') && viewMode === 'planta') {
      const snapResult = getSmartSnapPoint(world.wx, world.wy);
      const targetWx = snapResult.wx;
      const targetWy = snapResult.wy;

      // If clicking near first point and have >= 3 points, close polygon
      if (drawingPoints.length >= 3) {
        const p0 = drawingPoints[0];
        const distToStart = Math.hypot(targetWx - p0.x, targetWy - p0.y);
        if (distToStart < 0.55) {
          if (onCompletePolygon) {
            onCompletePolygon(drawingPoints, activeTool === 'draw_void');
          }
          setDrawingPoints([]);
          return;
        }
      }

      setDrawingPoints(prev => [...prev, { x: targetWx, y: targetWy }]);
      return;
    }

    // 2. COLUMN TOOL
    if (activeTool === 'column' && viewMode === 'planta') {
      const newCol: ColumnElement = {
        id: `col-manual-${Date.now()}`,
        tag: `C-${String(columnas.length + 1).padStart(2, '0')}`,
        x: world.wx,
        y: world.wy,
        altura: calc.alturaLadoAlto,
        baseZ: 0,
        profileId: 'tub-cuad-100x100x3',
        material: 'A500 Gr. B',
        basePlate: true,
        anchorBoltsCount: 4
      };
      onAddColumn(newCol);
      onSelectItem({ type: 'column', item: newCol });
      return;
    }

    // 3. PURLIN TOOL
    if (activeTool === 'purlin' && viewMode === 'planta' && onAddPurlin) {
      const newPurlin: PurlinElement = {
        id: `purlin-manual-${Date.now()}`,
        tag: `COR-${String(correas.length + 1).padStart(2, '0')}`,
        bayIndex: 0,
        slopePos: world.wy,
        startNode: { x: 0, y: world.wy, z: calc.alturaLadoAlto },
        endNode: { x: geometria.largo, y: world.wy, z: calc.alturaLadoAlto },
        profileId: 'perfil-c-100x50x2',
        material: 'A36'
      };
      onAddPurlin(newPurlin);
      onSelectItem({ type: 'purlin', item: newPurlin });
      return;
    }

    // 4. BEAM TOOL
    if (activeTool === 'beam' && viewMode === 'planta' && onAddBeam) {
      if (!beamStartNode) {
        setBeamStartNode({ x: world.wx, y: world.wy, z: calc.alturaLadoAlto });
      } else {
        const newBeam: BeamElement = {
          id: `beam-manual-${Date.now()}`,
          tag: `V-${String(vigas.length + 1).padStart(2, '0')}`,
          startNode: beamStartNode,
          endNode: { x: world.wx, y: world.wy, z: calc.alturaLadoAlto },
          profileId: 'tub-rect-150x100x3',
          material: 'A500 Gr. B',
          type: 'principal'
        };
        onAddBeam(newBeam);
        onSelectItem({ type: 'beam', item: newBeam });
        setBeamStartNode(null);
      }
      return;
    }

    // 5. TRUSS (TIJERAL) TOOL
    if (activeTool === 'truss' && viewMode === 'planta' && onAddBeam) {
      if (!beamStartNode) {
        setBeamStartNode({ x: world.wx, y: world.wy, z: calc.alturaLadoAlto });
      } else {
        const pStart = beamStartNode;
        const pEnd = { x: world.wx, y: world.wy, z: calc.alturaLadoAlto };
        const span = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);
        const panels = Math.max(3, Math.round(span / 1.5));
        const hTijeral = 0.80;

        // Top Chord
        const topChord: BeamElement = {
          id: `truss-top-${Date.now()}`,
          tag: `TIJ-${String(vigas.length + 1).padStart(2, '0')}-CS`,
          startNode: { x: pStart.x, y: pStart.y, z: pStart.z + hTijeral },
          endNode: { x: pEnd.x, y: pEnd.y, z: pEnd.z + hTijeral },
          profileId: 'tub-cuad-75x75x3',
          material: 'A500 Gr. B',
          type: 'tijeral_cuerda'
        };
        onAddBeam(topChord);

        // Bottom Chord
        const botChord: BeamElement = {
          id: `truss-bot-${Date.now() + 1}`,
          tag: `TIJ-${String(vigas.length + 1).padStart(2, '0')}-CI`,
          startNode: pStart,
          endNode: pEnd,
          profileId: 'tub-cuad-75x75x3',
          material: 'A500 Gr. B',
          type: 'tijeral_cuerda'
        };
        onAddBeam(botChord);

        // Verticals & Diagonals
        for (let i = 0; i <= panels; i++) {
          const t = i / panels;
          const vx = pStart.x + t * (pEnd.x - pStart.x);
          const vy = pStart.y + t * (pEnd.y - pStart.y);
          onAddBeam({
            id: `truss-m-${Date.now() + 10 + i}`,
            tag: `TIJ-M-${i + 1}`,
            startNode: { x: vx, y: vy, z: pStart.z },
            endNode: { x: vx, y: vy, z: pStart.z + hTijeral },
            profileId: 'tub-cuad-50x50x2',
            material: 'A500 Gr. B',
            type: 'tijeral_montante'
          });
          if (i < panels) {
            const nextT = (i + 1) / panels;
            const nvx = pStart.x + nextT * (pEnd.x - pStart.x);
            const nvy = pStart.y + nextT * (pEnd.y - pStart.y);
            onAddBeam({
              id: `truss-d-${Date.now() + 50 + i}`,
              tag: `TIJ-D-${i + 1}`,
              startNode: { x: vx, y: vy, z: pStart.z },
              endNode: { x: nvx, y: nvy, z: pStart.z + hTijeral },
              profileId: 'tub-cuad-40x40x2',
              material: 'A500 Gr. B',
              type: 'tijeral_diagonal'
            });
          }
        }
        onSelectItem({ type: 'beam', item: topChord });
        setBeamStartNode(null);
      }
      return;
    }

    // 6. BRACE (ARRIOSTRE) TOOL
    if (activeTool === 'brace' && viewMode === 'planta' && onAddBeam) {
      if (!beamStartNode) {
        setBeamStartNode({ x: world.wx, y: world.wy, z: calc.alturaLadoAlto });
      } else {
        const newBrace: BeamElement = {
          id: `brace-manual-${Date.now()}`,
          tag: `ARR-${String(vigas.length + 1).padStart(2, '0')}`,
          startNode: beamStartNode,
          endNode: { x: world.wx, y: world.wy, z: calc.alturaLadoAlto },
          profileId: 'tub-cuad-50x50x2',
          material: 'A36',
          type: 'arriostre'
        };
        onAddBeam(newBrace);
        onSelectItem({ type: 'beam', item: newBrace });
        setBeamStartNode(null);
      }
      return;
    }

    // 7. CUSTOM ELEMENT TOOL
    if (activeTool === 'custom_element' && viewMode === 'planta' && onAddBeam) {
      if (!beamStartNode) {
        setBeamStartNode({ x: world.wx, y: world.wy, z: calc.alturaLadoAlto });
      } else {
        const customElem: BeamElement = {
          id: `custom-elem-${Date.now()}`,
          tag: `ELEM-${String(vigas.length + 1).padStart(2, '0')}`,
          startNode: beamStartNode,
          endNode: { x: world.wx, y: world.wy, z: calc.alturaLadoAlto },
          profileId: 'tub-rect-150x100x3',
          material: 'A500 Gr. B',
          type: 'principal'
        };
        onAddBeam(customElem);
        onSelectItem({ type: 'beam', item: customElem });
        setBeamStartNode(null);
      }
      return;
    }

    // Clear edge/vertex selection if clicking background in select mode
    if (activeTool === 'select') {
      setSelectedEdge(null);
      setSelectedVertex(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (pointerDownPosRef.current) {
      const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
      if (dist > 5) {
        hasDraggedRef.current = true;
      }
    }

    if (isPanning || isPanningRef.current) {
      hasDraggedRef.current = true;
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);

    cursorWorldRef.current = { x: world.wx, y: world.wy, z: world.wz };
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        setCursorWorld(cursorWorldRef.current);
        rafIdRef.current = null;
      });
    }

    if (draggingColId && viewMode === 'planta') {
      hasDraggedRef.current = true;
      onUpdateColumnPos(draggingColId, world.wx, world.wy);
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    isPanningRef.current = false;
    setDraggingColId(null);
    setTimeout(() => {
      hasDraggedRef.current = false;
      pointerDownPosRef.current = null;
    }, 120);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
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
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY;
    const zoomRatio = delta < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(4, Math.max(0.3, zoom * zoomRatio));

    if (newZoom !== zoom) {
      const scaleChange = newZoom / zoom;
      setPan(p => ({
        x: mouseX - (mouseX - p.x) * scaleChange,
        y: mouseY - (mouseY - p.y) * scaleChange
      }));
      setZoom(newZoom);
    }
  };

  const resetView = () => {
    setZoom(1.2);
    setPan({ x: 90, y: 80 });
  };

  // Handlers para Menú Contextual Avanzado
  const handleRotateColumn = (id: string) => {
    const col = columnas.find(c => c.id === id);
    if (!col || !onUpdateColumnProps) return;
    const nextRot = ((col.rotacion || 0) + 90) % 360;
    onUpdateColumnProps(id, { rotacion: nextRot });
  };

  const handleChangeColumnHeight = (id: string, newH: number) => {
    if (onUpdateColumnProps) {
      onUpdateColumnProps(id, { altura: newH });
    }
  };

  const handleChangeColumnProfile = (id: string, newProfile: string) => {
    if (onUpdateColumnProps) {
      onUpdateColumnProps(id, { profileId: newProfile });
    }
  };

  const handleDuplicateElement = (id: string, type: string) => {
    if (type === 'column') {
      const col = columnas.find(c => c.id === id);
      if (col && onAddColumn) {
        const newCol: ColumnElement = {
          ...col,
          id: `col-dup-${Date.now()}`,
          tag: `C-${String(columnas.length + 1).padStart(2, '0')}`,
          x: col.x + 1.0,
          y: col.y + 1.0
        };
        onAddColumn(newCol);
        onSelectItem({ type: 'column', item: newCol });
      }
    }
  };

  const handleAddColumnAtContextMenu = (clientX: number, clientY: number) => {
    if (!svgRef.current || !onAddColumn) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);
    const snapResult = getSmartSnapPoint(world.wx, world.wy);
    const newCol: ColumnElement = {
      id: `col-${Date.now()}`,
      tag: `C-${String(columnas.length + 1).padStart(2, '0')}`,
      x: snapResult.wx,
      y: snapResult.wy,
      altura: calc.alturaLadoAlto || 3.5,
      profileId: 'tub-cuad-100x100x3',
      material: 'A500 Gr. B',
      rotacion: 0
    };
    onAddColumn(newCol);
    onSelectItem({ type: 'column', item: newCol });
  };

  // Close polygon helper
  const handleCloseDrawing = () => {
    if (drawingPoints.length >= 3 && onCompletePolygon) {
      onCompletePolygon(drawingPoints, activeTool === 'draw_void');
      setDrawingPoints([]);
    }
  };

  // Undo last point
  const handleUndoPoint = () => {
    setDrawingPoints(prev => prev.slice(0, -1));
  };

  // Apply new edge length
  const handleApplyEdgeLength = () => {
    if (!selectedEdge || !onUpdateEdgeLength) return;
    const val = parseFloat(edgeInputVal);
    if (!isNaN(val) && val > 0.2) {
      onUpdateEdgeLength(selectedEdge.sectorId, selectedEdge.edgeIndex, val);
      setSelectedEdge(null);
    }
  };

  // Apply new vertex Z
  const handleApplyVertexZ = () => {
    if (!selectedVertex || !onUpdateVertexZ) return;
    const val = parseFloat(vertexZInputVal);
    if (!isNaN(val) && val >= 0) {
      onUpdateVertexZ(selectedVertex.sectorId, selectedVertex.vertexIndex, val);
      setSelectedVertex(null);
    }
  };

  // Render Grid & Structural Axes (Ejes 1, 2, 3... and A, B, C...)
  const renderGridAndAxes = () => {
    const lines = [];
    const bubbles = [];

    const bounds = geometria.sectores && geometria.sectores.length > 0
      ? getPolygonBounds(geometria.sectores.flatMap(s => s.vertices))
      : { minX: 0, maxX: geometria.largo, minY: 0, maxY: geometria.ancho, length: geometria.largo, width: geometria.ancho };

    const gridCols = Math.max(8, Math.ceil(bounds.maxX) + 2);
    const gridRows = Math.max(6, Math.ceil(bounds.maxY) + 2);

    // Subtle background mesh
    if (showGrid) {
      for (let x = 0; x <= gridCols; x++) {
        const p1 = worldToScreen(x, 0, 0);
        const p2 = worldToScreen(x, gridRows, 0);
        lines.push(
          <line
            key={`gx-${x}`}
            x1={p1.sx}
            y1={p1.sy}
            x2={p2.sx}
            y2={p2.sy}
            stroke={x % 2 === 0 ? '#e2e8f0' : '#f8fafc'}
            strokeWidth="1"
          />
        );
      }
      for (let y = 0; y <= gridRows; y++) {
        const p1 = worldToScreen(0, y, 0);
        const p2 = worldToScreen(gridCols, y, 0);
        lines.push(
          <line
            key={`gy-${y}`}
            x1={p1.sx}
            y1={p1.sy}
            x2={p2.sx}
            y2={p2.sy}
            stroke={y % 2 === 0 ? '#e2e8f0' : '#f8fafc'}
            strokeWidth="1"
          />
        );
      }
    }

    // Structural Axes Bubbles in Planta
    if (showAxes && viewMode === 'planta') {
      // Numerical axes along X (Top)
      const stepX = geometria.separacionPorticos || 4.0;
      const numXAxes = Math.max(2, Math.round(bounds.length / stepX) + 1);
      for (let i = 0; i < numXAxes; i++) {
        const xVal = bounds.minX + i * (bounds.length / (numXAxes - 1 || 1));
        const pTop = worldToScreen(xVal, bounds.minY);
        const pBot = worldToScreen(xVal, bounds.maxY);

        lines.push(
          <line
            key={`axis-line-x-${i}`}
            x1={pTop.sx}
            y1={pTop.sy - 30}
            x2={pBot.sx}
            y2={pBot.sy + 15}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="6 3"
          />
        );

        bubbles.push(
          <g key={`axis-bubble-x-${i}`}>
            <circle cx={pTop.sx} cy={pTop.sy - 42} r="12" fill="#ffffff" stroke="#2563eb" strokeWidth="1.8" />
            <text x={pTop.sx} y={pTop.sy - 38} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e40af">
              {i + 1}
            </text>
          </g>
        );
      }

      // Alphabetical axes along Y (Left)
      const numYAxes = Math.max(2, Math.round(bounds.width / 4.0) + 1);
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      for (let j = 0; j < numYAxes; j++) {
        const yVal = bounds.minY + j * (bounds.width / (numYAxes - 1 || 1));
        const pLeft = worldToScreen(bounds.minX, yVal);
        const pRight = worldToScreen(bounds.maxX, yVal);

        lines.push(
          <line
            key={`axis-line-y-${j}`}
            x1={pLeft.sx - 30}
            y1={pLeft.sy}
            x2={pRight.sx + 15}
            y2={pRight.sy}
            stroke="#94a3b8"
            strokeWidth="1"
            strokeDasharray="6 3"
          />
        );

        bubbles.push(
          <g key={`axis-bubble-y-${j}`}>
            <circle cx={pLeft.sx - 42} cy={pLeft.sy} r="12" fill="#ffffff" stroke="#2563eb" strokeWidth="1.8" />
            <text x={pLeft.sx - 42} y={pLeft.sy + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e40af">
              {letters[j % letters.length]}
            </text>
          </g>
        );
      }
    }

    return (
      <g id="grid-and-axes">
        {lines}
        {bubbles}
      </g>
    );
  };

  // Helper for dynamic fall arrow vector and label
  const getFallArrowSpecs = (dir?: string, angulo?: number) => {
    const d = dir?.toLowerCase() || 'calle';
    if (d === 'fondo' || d === 'interior' || d === '↑') {
      return { x1: 0, y1: 10, x2: 0, y2: -25, label: '↑ FONDO', badgeX: 0, badgeY: -35 };
    } else if (d === 'calle' || d === 'frontal' || d === '↓') {
      return { x1: 0, y1: 0, x2: 0, y2: 35, label: '↓ CALLE', badgeX: 0, badgeY: 42 };
    } else if (d === 'izquierda' || d === '←') {
      return { x1: 15, y1: 15, x2: -25, y2: 15, label: '← IZQ.', badgeX: -35, badgeY: 15 };
    } else if (d === 'derecha' || d === '→') {
      return { x1: -15, y1: 15, x2: 25, y2: 15, label: '→ DER.', badgeX: 35, badgeY: 15 };
    } else if (d === 'personalizada' && typeof angulo === 'number') {
      const rad = (angulo * Math.PI) / 180;
      const len = 30;
      return {
        x1: 0,
        y1: 10,
        x2: len * Math.cos(rad),
        y2: 10 + len * Math.sin(rad),
        label: `↗ (${angulo}°)`,
        badgeX: 0,
        badgeY: 42
      };
    }
    return { x1: 0, y1: 0, x2: 0, y2: 35, label: '↓ CALLE', badgeX: 0, badgeY: 42 };
  };

  // Render Smart Architectural Cotas (Dimensions with extension lines and ticks)
  const renderArchitecturalCotas = () => {
    if (!showCotas || viewMode !== 'planta') return null;

    const bounds = geometria.sectores && geometria.sectores.length > 0
      ? getPolygonBounds(geometria.sectores.flatMap(s => s.vertices))
      : { minX: 0, maxX: geometria.largo, minY: 0, maxY: geometria.ancho, length: geometria.largo, width: geometria.ancho };

    const pMin = worldToScreen(bounds.minX, bounds.minY);
    const pMax = worldToScreen(bounds.maxX, bounds.maxY);

    const cotaElements = [];

    // LEVEL 2 EXTERIOR COTAS: Total Length (Top) & Total Width (Right)
    const topOffsetY = pMin.sy - 55;
    const rightOffsetX = pMax.sx + 55;

    // 1. Total Length Cota (Top)
    cotaElements.push(
      <g 
        key="cota-total-length" 
        className="select-none cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          onEditDimension?.('largo');
        }}
      >
        {/* Left extension line */}
        <line x1={pMin.sx} y1={pMin.sy - 8} x2={pMin.sx} y2={topOffsetY - 8} stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
        {/* Right extension line */}
        <line x1={pMax.sx} y1={pMin.sy - 8} x2={pMax.sx} y2={topOffsetY - 8} stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
        {/* Main dimension line */}
        <line x1={pMin.sx} y1={topOffsetY} x2={pMax.sx} y2={topOffsetY} stroke="#334155" strokeWidth="1.5" className="group-hover:stroke-blue-600 transition-colors" />
        {/* 45° Architectural Slash Ticks */}
        <line x1={pMin.sx - 5} y1={topOffsetY + 5} x2={pMin.sx + 5} y2={topOffsetY - 5} stroke="#0f172a" strokeWidth="2.2" />
        <line x1={pMax.sx - 5} y1={topOffsetY + 5} x2={pMax.sx + 5} y2={topOffsetY - 5} stroke="#0f172a" strokeWidth="2.2" />
        {/* Text Pill Badge */}
        <rect
          x={(pMin.sx + pMax.sx) / 2 - 46}
          y={topOffsetY - 12}
          width="92"
          height="22"
          rx="6"
          fill="#ffffff"
          stroke="#334155"
          strokeWidth="1.4"
          className="shadow-xs group-hover:fill-blue-50 group-hover:stroke-blue-600 transition-all"
        />
        <text
          x={(pMin.sx + pMax.sx) / 2}
          y={topOffsetY + 3}
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="#0f172a"
          className="group-hover:fill-blue-700 transition-colors"
        >
          L = {bounds.length.toFixed(2)} m ✎
        </text>
      </g>
    );

    // 2. Total Width Cota (Right)
    cotaElements.push(
      <g 
        key="cota-total-width" 
        className="select-none cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          onEditDimension?.('ancho');
        }}
      >
        {/* Top extension line */}
        <line x1={pMax.sx + 8} y1={pMin.sy} x2={rightOffsetX + 8} y2={pMin.sy} stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
        {/* Bottom extension line */}
        <line x1={pMax.sx + 8} y1={pMax.sy} x2={rightOffsetX + 8} y2={pMax.sy} stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
        {/* Main dimension line */}
        <line x1={rightOffsetX} y1={pMin.sy} x2={rightOffsetX} y2={pMax.sy} stroke="#334155" strokeWidth="1.5" className="group-hover:stroke-blue-600 transition-colors" />
        {/* 45° Architectural Slash Ticks */}
        <line x1={rightOffsetX - 5} y1={pMin.sy + 5} x2={rightOffsetX + 5} y2={pMin.sy - 5} stroke="#0f172a" strokeWidth="2.2" />
        <line x1={rightOffsetX - 5} y1={pMax.sy + 5} x2={rightOffsetX + 5} y2={pMax.sy - 5} stroke="#0f172a" strokeWidth="2.2" />
        {/* Text Pill Badge */}
        <rect
          x={rightOffsetX - 46}
          y={(pMin.sy + pMax.sy) / 2 - 11}
          width="92"
          height="22"
          rx="6"
          fill="#ffffff"
          stroke="#334155"
          strokeWidth="1.4"
          className="shadow-xs group-hover:fill-blue-50 group-hover:stroke-blue-600 transition-all"
        />
        <text
          x={rightOffsetX}
          y={(pMin.sy + pMax.sy) / 2 + 4}
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="#0f172a"
          className="group-hover:fill-blue-700 transition-colors"
        >
          A = {bounds.width.toFixed(2)} m ✎
        </text>
      </g>
    );

    // LEVEL 1: Bay Spans between columns (if multiple bays along X)
    const stepX = geometria.separacionPorticos || 4.0;
    const numXAxes = Math.max(2, Math.round(bounds.length / stepX) + 1);
    if (numXAxes > 2) {
      const bayOffsetY = pMin.sy - 28;
      for (let i = 0; i < numXAxes - 1; i++) {
        const x1 = bounds.minX + i * (bounds.length / (numXAxes - 1));
        const x2 = bounds.minX + (i + 1) * (bounds.length / (numXAxes - 1));
        const sp1 = worldToScreen(x1, bounds.minY);
        const sp2 = worldToScreen(x2, bounds.minY);
        const bayDist = x2 - x1;

        cotaElements.push(
          <g key={`cota-bay-x-${i}`} className="select-none pointer-events-none">
            <line x1={sp1.sx} y1={sp1.sy - 4} x2={sp1.sx} y2={bayOffsetY - 4} stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="2 2" />
            <line x1={sp2.sx} y1={sp2.sy - 4} x2={sp2.sx} y2={bayOffsetY - 4} stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="2 2" />
            <line x1={sp1.sx} y1={bayOffsetY} x2={sp2.sx} y2={bayOffsetY} stroke="#64748b" strokeWidth="1.2" />
            <line x1={sp1.sx - 3} y1={bayOffsetY + 3} x2={sp1.sx + 3} y2={bayOffsetY - 3} stroke="#475569" strokeWidth="1.8" />
            <line x1={sp2.sx - 3} y1={bayOffsetY + 3} x2={sp2.sx + 3} y2={bayOffsetY - 3} stroke="#475569" strokeWidth="1.8" />
            <rect
              x={(sp1.sx + sp2.sx) / 2 - 24}
              y={bayOffsetY - 9}
              width="48"
              height="18"
              rx="4"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="1"
            />
            <text
              x={(sp1.sx + sp2.sx) / 2}
              y={bayOffsetY + 3}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="bold"
              fill="#334155"
            >
              {bayDist.toFixed(2)}m
            </text>
          </g>
        );
      }
    }

    return <g id="architectural-cotas-layer">{cotaElements}</g>;
  };

  // Render Multi-Sectors with dynamic edge dimensions and fall arrows
  const renderSectors = () => {
    if (viewMode !== 'planta') return null;
    const sectores = geometria.sectores || [];

    // If no multi-sectors, render single main roof boundary and fall arrow
    if (sectores.length === 0) {
      const w = geometria.ancho || 6;
      const l = geometria.largo || 10;
      const pTopLeft = worldToScreen(0, 0);
      const pTopRight = worldToScreen(l, 0);
      const pBottomRight = worldToScreen(l, w);
      const pBottomLeft = worldToScreen(0, w);
      const pCenter = worldToScreen(l / 2, w / 2);
      const pointsStr = `${pTopLeft.sx},${pTopLeft.sy} ${pTopRight.sx},${pTopRight.sy} ${pBottomRight.sx},${pBottomRight.sy} ${pBottomLeft.sx},${pBottomLeft.sy}`;
      const arrow = getFallArrowSpecs(geometria.direccionCaida, geometria.anguloCaidaGrados);

      return (
        <g id="roof-single-group">
          {/* Main roof area fill */}
          <polygon
            points={pointsStr}
            fill="#3b82f6"
            fillOpacity={0.08}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelectItem({
                type: 'sector',
                item: {
                  id: 'sector-principal',
                  nombre: 'TECHO PRINCIPAL',
                  alturaLadoAlto: geometria.alturaLadoAlto || geometria.altura || 3.5,
                  alturaLadoBajo: geometria.alturaLadoBajo || 3.0,
                  pendientePct: geometria.pendiente || 5,
                  direccionCaida: geometria.direccionCaida || 'calle'
                }
              });
            }}
          />

          {/* Central Fall Direction Arrow & Badge - Only visible when CAD slope tool is active */}
          {activeTool === 'slope' && (
            <g transform={`translate(${pCenter.sx}, ${pCenter.sy})`} className="pointer-events-none select-none">
              <rect
                x="-80"
                y="-24"
                width="160"
                height="24"
                rx="6"
                fill="#ffffff"
                stroke="#0284c7"
                strokeWidth="1.6"
                className="shadow-xs"
              />
              <text x="0" y="-8" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0f172a">
                💧 CAÍDA {geometria.pendiente || 5}% · {arrow.label}
              </text>
              <line
                x1={arrow.x1}
                y1={arrow.y1}
                x2={arrow.x2}
                y2={arrow.y2}
                stroke="#0284c7"
                strokeWidth="3.5"
                markerEnd="url(#arrow-water-2d)"
              />
              <rect x={arrow.badgeX - 40} y={arrow.badgeY - 8} width="80" height="16" rx="4" fill="#0284c7" />
              <text x={arrow.badgeX} y={arrow.badgeY + 4} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ffffff">
                {arrow.label} ({geometria.pendiente || 5}%)
              </text>
            </g>
          )}
        </g>
      );
    }

    return (
      <g id="roof-sectors-group">
        {sectores.map((sec) => {
          const isSelected = activeSectorId === sec.id || (selectedItem?.type === 'sector' && selectedItem.item?.id === sec.id);
          const pointsStr = sec.vertices.map(v => {
            const p = worldToScreen(v.x, v.y);
            return `${p.sx},${p.sy}`;
          }).join(' ');

          const secBounds = getPolygonBounds(sec.vertices);
          const midX = (secBounds.minX + secBounds.maxX) / 2;
          const midY = (secBounds.minY + secBounds.maxY) / 2;
          const pCenter = worldToScreen(midX, midY);
          const arrow = getFallArrowSpecs(sec.direccionCaida, sec.anguloCaidaGrados);

          // Edge lines with cota badges
          const edgeElements = [];
          for (let i = 0; i < sec.vertices.length; i++) {
            const p1 = sec.vertices[i];
            const p2 = sec.vertices[(i + 1) % sec.vertices.length];
            const sp1 = worldToScreen(p1.x, p1.y);
            const sp2 = worldToScreen(p2.x, p2.y);
            const edgeLen = parseFloat(Math.hypot(p2.x - p1.x, p2.y - p1.y).toFixed(2));
            const isEdgeSelected = selectedEdge?.sectorId === sec.id && selectedEdge?.edgeIndex === i;
            const hasGutter = sec.canaletaBordes?.includes(i);

            const midSx = (sp1.sx + sp2.sx) / 2;
            const midSy = (sp1.sy + sp2.sy) / 2;

            edgeElements.push(
              <g key={`edge-${sec.id}-${i}`}>
                {/* Clickable transparent hit area */}
                <line
                  x1={sp1.sx}
                  y1={sp1.sy}
                  x2={sp2.sx}
                  y2={sp2.sy}
                  stroke="transparent"
                  strokeWidth="18"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'add_gutter' && onToggleEdgeGutter) {
                      onToggleEdgeGutter(sec.id, i);
                      return;
                    }
                    if (activeTool === 'add_downspout' && onAddDownspout) {
                      onAddDownspout(sec.id, i);
                      return;
                    }
                    setSelectedEdge({ sectorId: sec.id, edgeIndex: i, length: edgeLen, p1, p2 });
                    setEdgeInputVal(String(edgeLen));
                    if (onSelectSectorId) onSelectSectorId(sec.id);
                  }}
                />

                {/* Visible Edge Line */}
                <line
                  x1={sp1.sx}
                  y1={sp1.sy}
                  x2={sp2.sx}
                  y2={sp2.sy}
                  stroke={isEdgeSelected ? '#ef4444' : hasGutter ? '#06b6d4' : isSelected ? '#2563eb' : '#64748b'}
                  strokeWidth={hasGutter ? 4.5 : isEdgeSelected ? 3.5 : 2}
                  strokeDasharray={hasGutter ? 'none' : 'none'}
                />

                {/* Dimension Badge (Cota del lado) */}
                {showCotas && (
                  <g 
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdge({ sectorId: sec.id, edgeIndex: i, length: edgeLen, p1, p2 });
                      setEdgeInputVal(String(edgeLen));
                      if (onSelectSectorId) onSelectSectorId(sec.id);
                    }}
                  >
                    <rect
                      x={midSx - 24}
                      y={midSy - 10}
                      width="48"
                      height="20"
                      rx="5"
                      fill={isEdgeSelected ? '#fef2f2' : '#ffffff'}
                      stroke={isEdgeSelected ? '#ef4444' : '#94a3b8'}
                      strokeWidth="1.2"
                      className="shadow-xs transition-colors"
                    />
                    <text
                      x={midSx}
                      y={midSy + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill={isEdgeSelected ? '#dc2626' : '#1e293b'}
                    >
                      {edgeLen.toFixed(2)}m
                    </text>
                  </g>
                )}

                {/* Gutter Badge if active on this edge */}
                {hasGutter && (
                  <g transform={`translate(${midSx}, ${midSy - 18})`}>
                    <rect x="-35" y="-8" width="70" height="16" rx="4" fill="#0891b2" />
                    <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                      💧 CANALETA
                    </text>
                  </g>
                )}
              </g>
            );
          }

          // Vertex handles with Z elevation
          const vertexElements = sec.vertices.map((v, vIdx) => {
            const sp = worldToScreen(v.x, v.y);
            const isVertexSelected = selectedVertex?.sectorId === sec.id && selectedVertex?.vertexIndex === vIdx;
            const vZ = v.z !== undefined ? v.z : sec.alturaLadoAlto;

            return (
              <g 
                key={`vertex-${sec.id}-${vIdx}`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVertex({ sectorId: sec.id, vertexIndex: vIdx, p: v });
                  setVertexZInputVal(String(vZ));
                }}
              >
                <circle
                  cx={sp.sx}
                  cy={sp.sy}
                  r={isVertexSelected ? 8 : 6}
                  fill={isVertexSelected ? '#ef4444' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all"
                />
                {(!columnas.some(c => Math.hypot(c.x - v.x, c.y - v.y) < 0.35) || isVertexSelected) && (
                  <>
                    <rect
                      x={sp.sx + 8}
                      y={sp.sy - 8}
                      width="55"
                      height="16"
                      rx="3"
                      fill="#1e293b"
                      fillOpacity="0.85"
                    />
                    <text
                      x={sp.sx + 35}
                      y={sp.sy + 3}
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      Z={vZ.toFixed(2)}m
                    </text>
                  </>
                )}
              </g>
            );
          });

          return (
            <g key={`sec-${sec.id}`}>
              {/* Sector Fill Area */}
              <polygon
                points={pointsStr}
                fill={sec.esTranslucido ? (sec.colorTranslucido === 'Azul' ? '#38bdf8' : sec.colorTranslucido === 'Blanco' ? '#e2e8f0' : sec.colorTranslucido === 'Cristal' ? '#cffafe' : '#10b981') : (sec.color || '#3b82f6')}
                fillOpacity={sec.esTranslucido ? 0.35 : (isSelected ? 0.28 : 0.14)}
                stroke={sec.esTranslucido ? '#059669' : 'transparent'}
                strokeWidth={sec.esTranslucido ? 2 : 0}
                strokeDasharray={sec.esTranslucido ? '6 3' : 'none'}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectSectorId) onSelectSectorId(sec.id);
                  onSelectItem({ type: 'sector', item: sec });
                }}
              />

              {/* Edge lines & Cotas */}
              {edgeElements}

              {/* Vertex Handles */}
              {vertexElements}

              {/* Central Fall Direction Arrow & Sector Badge - Only visible when CAD slope tool is active */}
              {activeTool === 'slope' ? (
                <g transform={`translate(${pCenter.sx}, ${pCenter.sy})`} className="pointer-events-none select-none">
                  {/* Sector Title Box */}
                  <rect
                    x="-85"
                    y="-26"
                    width="170"
                    height="26"
                    rx="6"
                    fill="#ffffff"
                    stroke={sec.esTranslucido ? '#10b981' : (sec.color || '#2563eb')}
                    strokeWidth="1.8"
                    className="shadow-sm"
                  />
                  <text x="0" y="-10" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0f172a">
                    {sec.nombre} · {sec.pendientePct}% {sec.esTranslucido ? '✨ Translúcido' : ''}
                  </text>
                  {/* Fall Arrow */}
                  <line
                    x1={arrow.x1}
                    y1={arrow.y1}
                    x2={arrow.x2}
                    y2={arrow.y2}
                    stroke="#0284c7"
                    strokeWidth="3.5"
                    markerEnd="url(#arrow-water-2d)"
                  />
                  <rect x={arrow.badgeX - 42} y={arrow.badgeY - 8} width="84" height="16" rx="4" fill="#0284c7" />
                  <text x={arrow.badgeX} y={arrow.badgeY + 4} textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ffffff">
                    {arrow.label} ({sec.pendientePct}%)
                  </text>
                </g>
              ) : (
                /* Subtle, unobtrusive sector label when not in slope tool */
                <g transform={`translate(${pCenter.sx}, ${pCenter.sy})`} className="pointer-events-none select-none">
                  <text 
                    x="0" 
                    y="0" 
                    textAnchor="middle" 
                    fontSize="11" 
                    fontWeight="bold" 
                    fill={sec.esTranslucido ? '#059669' : (sec.color || '#475569')}
                    opacity="0.65"
                  >
                    {sec.nombre} {sec.esTranslucido ? '(Translúcido)' : ''}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // Render Voids (Vacíos / Patios)
  const renderVoids = () => {
    if (viewMode !== 'planta') return null;
    const vacios = geometria.vacios || [];

    return (
      <g id="roof-voids-group">
        {vacios.map((v) => {
          const pointsStr = v.vertices.map(pt => {
            const p = worldToScreen(pt.x, pt.y);
            return `${p.sx},${p.sy}`;
          }).join(' ');

          const vBounds = getPolygonBounds(v.vertices);
          const pCenter = worldToScreen((vBounds.minX + vBounds.maxX) / 2, (vBounds.minY + vBounds.maxY) / 2);
          const area = calcPolygonArea(v.vertices);

          return (
            <g key={`void-${v.id}`}>
              {/* Hatch patterned void polygon */}
              <polygon
                points={pointsStr}
                fill="url(#void-hatch)"
                stroke="#dc2626"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectItem({ type: 'void', item: v });
                }}
              />
              {/* Void Label */}
              <g transform={`translate(${pCenter.sx}, ${pCenter.sy})`} className="pointer-events-none select-none">
                <rect x="-55" y="-12" width="110" height="24" rx="5" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.2" />
                <text x="0" y="4" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#b91c1c">
                  🔲 VACÍO ({area.toFixed(1)} m²)
                </text>
              </g>
            </g>
          );
        })}
      </g>
    );
  };

  // Render Active In-Progress Polygon Drawing
  const renderActiveDrawing = () => {
    if (drawingPoints.length === 0 || viewMode !== 'planta') return null;

    const placedScreenPoints = drawingPoints.map(p => worldToScreen(p.x, p.y));
    const lastP = placedScreenPoints[placedScreenPoints.length - 1];
    const liveP = worldToScreen(cursorWorld.x, cursorWorld.y);
    const liveDist = Math.hypot(cursorWorld.x - drawingPoints[drawingPoints.length - 1].x, cursorWorld.y - drawingPoints[drawingPoints.length - 1].y);

    const polyStr = [...placedScreenPoints.map(p => `${p.sx},${p.sy}`), `${liveP.sx},${liveP.sy}`].join(' ');

    return (
      <g id="active-drawing-layer" className="pointer-events-none select-none">
        {/* Fill preview */}
        <polygon
          points={polyStr}
          fill={activeTool === 'draw_void' ? '#fecaca' : '#bfdbfe'}
          fillOpacity="0.25"
          stroke="none"
        />

        {/* Lines between completed points */}
        {placedScreenPoints.map((sp, idx) => {
          if (idx === 0) return null;
          const prev = placedScreenPoints[idx - 1];
          const dist = Math.hypot(drawingPoints[idx].x - drawingPoints[idx - 1].x, drawingPoints[idx].y - drawingPoints[idx - 1].y);
          return (
            <g key={`draw-seg-${idx}`}>
              <line
                x1={prev.sx}
                y1={prev.sy}
                x2={sp.sx}
                y2={sp.sy}
                stroke="#2563eb"
                strokeWidth="2.5"
              />
              <rect
                x={(prev.sx + sp.sx) / 2 - 20}
                y={(prev.sy + sp.sy) / 2 - 9}
                width="40"
                height="18"
                rx="4"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="1"
              />
              <text
                x={(prev.sx + sp.sx) / 2}
                y={(prev.sy + sp.sy) / 2 + 3}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="bold"
                fill="#1e40af"
              >
                {dist.toFixed(2)}m
              </text>
            </g>
          );
        })}

        {/* Rubber-band line to cursor */}
        <line
          x1={lastP.sx}
          y1={lastP.sy}
          x2={liveP.sx}
          y2={liveP.sy}
          stroke="#f59e0b"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Live distance badge */}
        <rect
          x={(lastP.sx + liveP.sx) / 2 - 25}
          y={(lastP.sy + liveP.sy) / 2 - 10}
          width="50"
          height="20"
          rx="5"
          fill="#1e293b"
        />
        <text
          x={(lastP.sx + liveP.sx) / 2}
          y={(lastP.sy + liveP.sy) / 2 + 4}
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#fbbf24"
        >
          {liveDist.toFixed(2)} m
        </text>

        {/* Placed point handles */}
        {placedScreenPoints.map((sp, idx) => (
          <g key={`pt-handle-${idx}`}>
            <circle
              cx={sp.sx}
              cy={sp.sy}
              r={idx === 0 ? 8 : 6}
              fill={idx === 0 ? '#10b981' : '#2563eb'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <text
              x={sp.sx}
              y={sp.sy - 10}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#1e293b"
            >
              P{idx + 1}
            </text>
          </g>
        ))}
      </g>
    );
  };

  // Render Architectural Section View (SECCIÓN)
  const renderSectionView = () => {
    if (viewMode !== 'seccion') return null;

    const span = geometria.ancho || 8.0;
    const hColLow = calc.alturaLadoBajo || 3.00;
    const hColHigh = calc.alturaLadoAlto || 3.80;

    const pLeftBase = worldToScreen(0, 0, 0);
    const pLeftTop = worldToScreen(0, 0, hColHigh);
    const pRightBase = worldToScreen(0, span, 0);
    const pRightTop = worldToScreen(0, span, hColLow);

    // Rafter / beam nodes with 0.50m overhang (alero)
    const pRafterLeft = worldToScreen(0, -0.5, hColHigh + 0.15);
    const pRafterRight = worldToScreen(0, span + 0.5, hColLow - 0.05);

    return (
      <g id="section-view-layer">
        {/* Ground Level N.P.T. ±0.00 */}
        <line x1={pLeftBase.sx - 60} y1={pLeftBase.sy} x2={pRightBase.sx + 60} y2={pRightBase.sy} stroke="#334155" strokeWidth="3" />
        <text x={pLeftBase.sx - 55} y={pLeftBase.sy + 18} fontSize="10" fontWeight="bold" fill="#475569">
          N.P.T. ±0.00
        </text>

        {/* Left Column with Base Plate */}
        <rect x={pLeftBase.sx - 12} y={pLeftBase.sy - 4} width="24" height="6" fill="#64748b" stroke="#334155" strokeWidth="1" />
        <line x1={pLeftBase.sx} y1={pLeftBase.sy} x2={pLeftTop.sx} y2={pLeftTop.sy} stroke="#1e293b" strokeWidth="10" strokeLinecap="square" />
        <text x={pLeftBase.sx - 16} y={(pLeftBase.sy + pLeftTop.sy) / 2} fontSize="10" fontWeight="bold" fill="#1e293b" textAnchor="end">
          C-01 (H={hColHigh.toFixed(2)}m)
        </text>

        {/* Right Column with Base Plate */}
        <rect x={pRightBase.sx - 12} y={pRightBase.sy - 4} width="24" height="6" fill="#64748b" stroke="#334155" strokeWidth="1" />
        <line x1={pRightBase.sx} y1={pRightBase.sy} x2={pRightTop.sx} y2={pRightTop.sy} stroke="#1e293b" strokeWidth="10" strokeLinecap="square" />
        <text x={pRightBase.sx + 16} y={(pRightBase.sy + pRightTop.sy) / 2} fontSize="10" fontWeight="bold" fill="#1e293b">
          C-02 (H={hColLow.toFixed(2)}m)
        </text>

        {/* Main Rafter Beam (Viga Principal Inclinada) */}
        <line
          x1={pRafterLeft.sx}
          y1={pRafterLeft.sy}
          x2={pRafterRight.sx}
          y2={pRafterRight.sy}
          stroke="#2563eb"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Roof Cladding Sheet (Cobertura) */}
        <line
          x1={pRafterLeft.sx}
          y1={pRafterLeft.sy - 12}
          x2={pRafterRight.sx}
          y2={pRafterRight.sy - 12}
          stroke="#0284c7"
          strokeWidth="4"
        />

        {/* Gutter (Canaleta) at low edge */}
        <rect
          x={pRafterRight.sx - 4}
          y={pRafterRight.sy - 8}
          width="18"
          height="22"
          fill="#0891b2"
          stroke="#164e63"
          strokeWidth="1.5"
          rx="2"
        />
        <text x={pRafterRight.sx + 20} y={pRafterRight.sy + 8} fontSize="9" fontWeight="bold" fill="#0891b2">
          Canaleta Pluvial
        </text>

        {/* Purlins (Correas) sitting on rafter */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
          const px = pRafterLeft.sx + frac * (pRafterRight.sx - pRafterLeft.sx);
          const py = pRafterLeft.sy + frac * (pRafterRight.sy - pRafterLeft.sy);
          return (
            <rect
              key={`sec-pur-${idx}`}
              x={px - 4}
              y={py - 10}
              width="8"
              height="10"
              fill="#10b981"
              stroke="#065f46"
              strokeWidth="1"
              rx="1"
            />
          );
        })}

        {/* Section Elevation Dimensions */}
        <line x1={pLeftBase.sx - 35} y1={pLeftBase.sy} x2={pLeftBase.sx - 35} y2={pLeftTop.sy} stroke="#6366f1" strokeWidth="1.5" />
        <text x={pLeftBase.sx - 42} y={(pLeftBase.sy + pLeftTop.sy) / 2} fontSize="10" fontWeight="bold" fill="#4338ca" textAnchor="end">
          H. Alto = {hColHigh.toFixed(2)}m
        </text>

        <line x1={pRightBase.sx + 35} y1={pRightBase.sy} x2={pRightBase.sx + 35} y2={pRightTop.sy} stroke="#0ea5e9" strokeWidth="1.5" />
        <text x={pRightBase.sx + 42} y={(pRightBase.sy + pRightTop.sy) / 2} fontSize="10" fontWeight="bold" fill="#0284c7">
          H. Bajo = {hColLow.toFixed(2)}m (Pendiente: {calc.pendientePct}%)
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full bg-slate-50 flex flex-col select-none overflow-hidden font-sans">
      {/* Top CAD Bar Info */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="capitalize">
          {viewMode === 'planta' ? '📐 Vista en Planta CAD (X-Y)' : viewMode === 'seccion' ? '✂️ Sección Transversal Estructural' : '🏢 Elevación (Pórtico Y-Z)'}
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500 text-[11px]">
          Modo: <strong className="text-blue-600">{geometria.projectMode === 'levantamiento' ? 'Levantamiento' : 'Geometría Libre'}</strong>
        </span>
      </div>

      {/* Floating Active Polygon Drawing Banner */}
      {drawingPoints.length > 0 && (
        <div className="absolute top-12 left-3 z-30 flex items-center space-x-2 bg-amber-500 text-white px-3 py-1.5 rounded-xl shadow-md text-xs font-bold animate-in fade-in">
          <span>✏️ {activeTool === 'draw_void' ? 'Creando Vacío' : 'Dibujando Polígono'}: {drawingPoints.length} puntos</span>
          <button
            onClick={handleCloseDrawing}
            disabled={drawingPoints.length < 3}
            className="flex items-center space-x-1 px-2.5 py-1 bg-white text-amber-700 rounded-lg font-bold hover:bg-amber-50 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Cerrar Polígono</span>
          </button>
          <button
            onClick={handleUndoPoint}
            className="p-1 hover:bg-amber-600 rounded-lg cursor-pointer"
            title="Deshacer punto"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDrawingPoints([])}
            className="p-1 hover:bg-amber-600 rounded-lg cursor-pointer"
            title="Cancelar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Edge Quick Modifier Floating Card */}
      {selectedEdge && (
        <div className="absolute bottom-4 left-4 z-30 bg-white/95 backdrop-blur border border-blue-200 rounded-2xl shadow-xl p-3 flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-slate-700">
            <Ruler className="w-4 h-4 text-blue-600" />
            <span>Lado {selectedEdge.edgeIndex + 1}:</span>
          </div>
          <div className="flex items-center space-x-1">
            <input
              type="number"
              step="0.1"
              value={edgeInputVal}
              onChange={(e) => setEdgeInputVal(e.target.value)}
              className="w-16 px-2 py-1 border border-slate-300 rounded-lg font-bold text-center text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="font-bold text-slate-500">m</span>
          </div>
          <button
            onClick={handleApplyEdgeLength}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Ajustar
          </button>
          {onToggleEdgeGutter && (
            <button
              onClick={() => onToggleEdgeGutter(selectedEdge.sectorId, selectedEdge.edgeIndex)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-300 font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Canaleta</span>
            </button>
          )}
          <button
            onClick={() => setSelectedEdge(null)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Vertex Z Elevation Floating Card */}
      {selectedVertex && (
        <div className="absolute bottom-4 right-4 z-30 bg-white/95 backdrop-blur border border-purple-200 rounded-2xl shadow-xl p-3 flex items-center space-x-3 text-xs">
          <div className="font-bold text-slate-700">
            Vértice {selectedVertex.vertexIndex + 1} (X:{selectedVertex.p.x}m, Y:{selectedVertex.p.y}m)
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-bold text-purple-700">Cota Z:</span>
            <input
              type="number"
              step="0.05"
              value={vertexZInputVal}
              onChange={(e) => setVertexZInputVal(e.target.value)}
              className="w-16 px-2 py-1 border border-slate-300 rounded-lg font-bold text-center text-purple-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <span className="font-bold text-slate-500">m</span>
          </div>
          <button
            onClick={handleApplyVertexZ}
            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Guardar Cota
          </button>
          <button
            onClick={() => setSelectedVertex(null)}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Enhanced CAD Viewport HUD Controls - Movable / Draggable on PC and Mobile */}
      <div 
        onPointerDown={handlePointerDownHud}
        onPointerMove={handlePointerMoveHud}
        onPointerUp={handlePointerUpHud}
        style={{
          ...(hudPos.x !== undefined && hudPos.y !== undefined ? {
            left: `${hudPos.x}px`,
            top: `${hudPos.y}px`,
            right: 'auto'
          } : {}),
          touchAction: 'none'
        }}
        className={`absolute top-3 right-3 z-30 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-xl max-w-[95vw] transition-shadow select-none ${
          isDraggingHud ? 'cursor-grabbing ring-2 ring-blue-500/50' : 'cursor-grab'
        }`}
      >
        {/* DRAG HANDLE */}
        <div 
          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors shrink-0 flex items-center space-x-1 cursor-grab active:cursor-grabbing shadow-2xs"
          title="Mantén presionado y arrastra para mover la barra por la pantalla"
        >
          <GripVertical className="w-4 h-4 text-slate-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden sm:inline">Mover</span>
        </div>

        {isHudCollapsed ? (
          <button 
            onClick={() => setIsHudCollapsed(false)}
            className="flex items-center space-x-1 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
            title="Expandir Herramientas de Vista"
          >
            <span>Controles</span>
            <span className="text-[10px] text-slate-500">({Math.round(zoom * 100)}%)</span>
          </button>
        ) : (
          <>
            <button 
              onClick={fitToArea}
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Ajustar al área"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={centerDrawing}
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Centrar dibujo"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${showGrid ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              title="Alternar Cuadrícula"
            >
              <GridIcon className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${snapEnabled ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              title="Alternar Snap a Nodos (0.25m)"
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setShowAxes(!showAxes)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${showAxes ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              title="Alternar Ejes Estructurales"
            >
              <Hash className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button 
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} 
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(z => Math.min(4, z + 0.2))} 
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={resetView} 
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Restablecer vista"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
              title="Guía de Gestos Táctiles y Atajos de Teclado / Bluetooth"
            >
              <Keyboard className="w-3.5 h-3.5 text-blue-600" />
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            <button
              onClick={() => setIsHudCollapsed(true)}
              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Minimizar barra"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Dynamic Coordinates HUD Overlay at Bottom Left */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center bg-slate-900/95 backdrop-blur border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[10px] font-mono select-none space-x-2.5 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        <span>X: <strong className="text-white">{(cursorWorld.x || 0).toFixed(2)}m</strong></span>
        <span className="text-slate-600">|</span>
        <span>Y: <strong className="text-white">{(cursorWorld.y || 0).toFixed(2)}m</strong></span>
        <span className="text-slate-600">|</span>
        <span>Z: <strong className="text-white">{(viewMode === 'planta' ? 0.00 : (cursorWorld.z || 0)).toFixed(2)}m</strong></span>
      </div>

      {/* SVG CAD Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
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
          if (hasDraggedRef.current || isPanning || isPanningRef.current) {
            hasDraggedRef.current = false;
            return;
          }
          if (pointerDownPosRef.current) {
            const dist = Math.hypot(e.clientX - pointerDownPosRef.current.x, e.clientY - pointerDownPosRef.current.y);
            if (dist > 6) return;
          }
          openContextMenuAt(e.clientX, e.clientY);
        }}
      >
        <defs>
          <marker id="arrow-water-2d" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
          </marker>
          {/* Diagonal hatch pattern for voids */}
          <pattern id="void-hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#f87171" strokeWidth="1.5" />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {renderGridAndAxes()}

          {/* Render Multi-Sectors and Voids */}
          {renderSectors()}
          {renderVoids()}

          {/* Section View */}
          {renderSectionView()}

          {/* 1. BEAMS / VIGAS / TIJERALES */}
          {vigas.map((beam, bIdx) => {
            const isArriostre = beam.type === 'arriostre';
            if (isArriostre && !showArriostres) return null;

            const p1 = worldToScreen(beam.startNode.x, beam.startNode.y, beam.startNode.z);
            const p2 = worldToScreen(beam.endNode.x, beam.endNode.y, beam.endNode.z);
            const isSelected = selectedItem?.type === 'beam' && selectedItem.item.id === beam.id;

            let strokeColor = '#3b82f6';
            let strokeWidth = 3.5;
            let strokeDash = 'none';

            if (beam.type === 'tijeral_cuerda') {
              strokeColor = '#2563eb';
              strokeWidth = 3;
            } else if (beam.type === 'tijeral_montante' || beam.type === 'tijeral_diagonal') {
              strokeColor = '#64748b';
              strokeWidth = 1.8;
            } else if (isArriostre) {
              strokeColor = '#ea580c';
              strokeWidth = 2;
              strokeDash = '4 3';
            }

            if (isSelected) {
              strokeColor = '#ef4444';
              strokeWidth = 4.5;
            }

            return (
              <g 
                key={`beam-${beam.id}-${bIdx}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'delete' && onDeleteItem) {
                    onDeleteItem(beam.id, 'beam');
                    return;
                  }
                  onSelectItem({ type: 'beam', item: beam });
                }}
                className="cursor-pointer group"
              >
                <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="transparent" strokeWidth="16" />
                <line 
                  x1={p1.sx} 
                  y1={p1.sy} 
                  x2={p2.sx} 
                  y2={p2.sy} 
                  stroke={strokeColor} 
                  strokeWidth={strokeWidth} 
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* 2. PURLINS / CORREAS */}
          {showCorreas && correas.map((purlin, purIdx) => {
            const p1 = worldToScreen(purlin.startNode.x, purlin.startNode.y, purlin.startNode.z);
            const p2 = worldToScreen(purlin.endNode.x, purlin.endNode.y, purlin.endNode.z);
            const isSelected = selectedItem?.type === 'purlin' && selectedItem.item.id === purlin.id;

            return (
              <g 
                key={`purlin-${purlin.id}-${purIdx}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'delete' && onDeleteItem) {
                    onDeleteItem(purlin.id, 'purlin');
                    return;
                  }
                  onSelectItem({ type: 'purlin', item: purlin });
                }}
                className="cursor-pointer"
              >
                <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="transparent" strokeWidth="12" />
                <line 
                  x1={p1.sx} 
                  y1={p1.sy} 
                  x2={p2.sx} 
                  y2={p2.sy} 
                  stroke={isSelected ? '#ef4444' : '#10b981'} 
                  strokeWidth={isSelected ? 3 : 1.8}
                  strokeDasharray="2 2"
                />
              </g>
            );
          })}

          {/* 3. COLUMNS / COLUMNAS */}
          {columnas.map((col, cIdx) => {
            const isSelected = selectedItem?.type === 'column' && selectedItem.item.id === col.id;

            if (viewMode === 'planta') {
              const p = worldToScreen(col.x, col.y, 0);
              return (
                <g 
                  key={`col-${col.id}-${cIdx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'delete' && onDeleteItem) {
                      onDeleteItem(col.id, 'column');
                      return;
                    }
                    if (activeTool === 'base_plate' && onUpdateColumnProps) {
                      onUpdateColumnProps(col.id, { basePlate: !col.basePlate });
                      onSelectItem({ type: 'column', item: { ...col, basePlate: !col.basePlate } });
                      return;
                    }
                    if (activeTool === 'bolt' && onUpdateColumnProps) {
                      const nextBolts = col.anchorBoltsCount === 4 ? 6 : col.anchorBoltsCount === 6 ? 8 : 4;
                      onUpdateColumnProps(col.id, { anchorBoltsCount: nextBolts });
                      onSelectItem({ type: 'column', item: { ...col, anchorBoltsCount: nextBolts } });
                      return;
                    }
                    onSelectItem({ type: 'column', item: col });
                    if (activeTool === 'select') {
                      setDraggingColId(col.id);
                    }
                  }}
                  className="cursor-pointer group"
                >
                  {col.basePlate && (
                    <rect 
                      x={p.sx - 10} 
                      y={p.sy - 10} 
                      width="20" 
                      height="20" 
                      fill="#e2e8f0" 
                      stroke="#94a3b8" 
                      strokeWidth="1.5" 
                      rx="2"
                    />
                  )}
                  <rect 
                    x={p.sx - 6} 
                    y={p.sy - 6} 
                    width="12" 
                    height="12" 
                    fill={isSelected ? '#ef4444' : '#1e293b'} 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                    rx="1"
                  />
                  <text 
                    x={p.sx + 10} 
                    y={p.sy + 4} 
                    fontSize="9" 
                    fill={isSelected ? '#ef4444' : '#475569'} 
                    fontWeight="bold"
                    className="select-none"
                  >
                    {col.tag} (h:{col.altura}m)
                  </text>
                </g>
              );
            } else {
              const pBase = worldToScreen(col.x, col.y, 0);
              const pTop = worldToScreen(col.x, col.y, col.altura);

              return (
                <g 
                  key={`col-elev-${col.id}-${cIdx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeTool === 'delete' && onDeleteItem) {
                      onDeleteItem(col.id, 'column');
                      return;
                    }
                    onSelectItem({ type: 'column', item: col });
                  }}
                  className="cursor-pointer"
                >
                  <line x1={pBase.sx - 8} y1={pBase.sy} x2={pBase.sx + 8} y2={pBase.sy} stroke="#64748b" strokeWidth="4" />
                  <line 
                    x1={pBase.sx} 
                    y1={pBase.sy} 
                    x2={pTop.sx} 
                    y2={pTop.sy} 
                    stroke={isSelected ? '#ef4444' : '#1e293b'} 
                    strokeWidth="7" 
                    strokeLinecap="square"
                  />
                  <text 
                    x={pBase.sx} 
                    y={pBase.sy + 12} 
                    fontSize="8" 
                    fill="#64748b" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {col.tag}
                  </text>
                </g>
              );
            }
          })}

          {/* Smart Architectural Cotas */}
          {renderArchitecturalCotas()}

          {/* Active drawing rubber-band */}
          {renderActiveDrawing()}
        </g>
      </svg>

      {/* ========================================================
          MENÚ CONTEXTUAL AVANZADO (CLIC DERECHO / LONG-PRESS)
      ======================================================== */}
      {contextMenuPos && (
        <StructuralContextMenu
          position={contextMenuPos}
          column={columnas.find(c => c.id === contextMenuPos.targetId)}
          beam={vigas.find(b => b.id === contextMenuPos.targetId)}
          purlin={correas.find(p => p.id === contextMenuPos.targetId)}
          onClose={() => setContextMenuPos(null)}
          onRotateColumn={handleRotateColumn}
          onChangeColumnHeight={handleChangeColumnHeight}
          onChangeColumnProfile={handleChangeColumnProfile}
          onDeleteElement={(id, type) => {
            if (onDeleteItem) {
              onDeleteItem(id, type);
            }
          }}
          onDuplicateElement={handleDuplicateElement}
          onAddColumnAt={(clientX, clientY) => handleAddColumnAtContextMenu(clientX, clientY)}
        />
      )}

      {/* ========================================================
          MODAL DE GESTOS TÁCTILES Y ATAJOS DE TECLADO / BLUETOOTH
      ======================================================== */}
      <CadGesturesAndShortcutsModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        modulo="techos"
      />
    </div>
  );
};
