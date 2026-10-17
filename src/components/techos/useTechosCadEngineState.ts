// Hook de Gestión de Estado Vectorial CAD y Trazado Libre (Node-to-Node / Line-to-Line)
// Manejo de lienzo interactivo 2D/3D con enlace a Inteligencia de Materiales y Análisis Estructural Paramétrico

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  Node3D, 
  Segment3D, 
  CoverageZone3D, 
  ToolModoCad, 
  RolEstructuralSegmento,
  FullTechosBomReport,
  StructuralAnalysisReport,
  StructuralAnalysisInput
} from './techosCadEngineTypes';

import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS } from './techosCadCatalog';
import { generarReportePresupuestoBom } from './techosCadCalculations';
import { TipoTijeral } from './techosCadColors';
import { generateDxfContent } from '../../lib/dxfParser';

// Portapapeles global para copiar y pegar elementos entre operaciones CAD
let cadClipboard: {
  nodes: Node3D[];
  segments: Segment3D[];
  coverageZones: CoverageZone3D[];
} | null = null;

export type OrientacionTijeral = 
  | 'vertical' 
  | 'horizontal' 
  | 'ambos' 
  | 'transversal' 
  | 'longitudinal' 
  | 'perimetral' 
  | 'completo';

export interface UseTechosCadEngineReturn {
  // Estado Vectorial
  nodes: Record<string, Node3D>;
  segments: Record<string, Segment3D>;
  coverageZones: Record<string, CoverageZone3D>;
  
  // Portapapeles CAD
  copySelectedElements: () => void;
  pasteElements: () => void;
  canPaste: boolean;
  
  // Estado de Herramienta y Selección
  activeTool: ToolModoCad;
  setActiveTool: (tool: ToolModoCad) => void;
  selectedElementIds: string[];
  setSelectedElementIds: React.Dispatch<React.SetStateAction<string[]>>;
  
  // Perfil y Cobertura Activos para nuevos trazos
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  activeCoverageId: string;
  setActiveCoverageId: (id: string) => void;

  // Snapping y Ajustes de Rejilla
  snapGridSizeM: number;
  setSnapGridSizeM: (sz: number) => void;
  snapEnabled: boolean;
  setSnapEnabled: (en: boolean) => void;

  // Carga de Proyecto Guardado y Carga de Escena Completa
  loadScene: (loadedNodes: Record<string, Node3D>, loadedSegments: Record<string, Segment3D>, loadedZones?: Record<string, CoverageZone3D>) => void;

  // Operaciones Vectoriales de Trazado Libre
  addNode: (x: number, y: number, z?: number, isFixed?: boolean, exact?: boolean) => string;
  splitSegmentAtPoint: (segmentId: string, x: number, y: number, z?: number, isFixed?: boolean) => string;
  addSegment: (nodeAId: string, nodeBId: string, rolEstructural?: RolEstructuralSegmento, profileId?: string) => string;
  addCoverageZone: (nodeIdsBoundary: string[], coberturaId?: string, pendientePct?: number) => string;
  addRectangle: (x1: number, y1: number, x2: number, y2: number, rolEstructural?: RolEstructuralSegmento) => void;
  addArcBetweenPoints: (
    p1: { x: number; y: number; z?: number; nodeId?: string },
    p2: { x: number; y: number; z?: number; nodeId?: string },
    sagittaHeightM: number,
    numDivisions?: number,
    rolEstructural?: RolEstructuralSegmento,
    profileId?: string
  ) => string[];
  
  updateNodeCoords: (nodeId: string, x: number, y: number, z?: number, saveHistory?: boolean) => void;
  moveNodeWithColumn: (nodeId: string, x: number, y: number, z: number, vista: 'planta' | 'seccion', saveHistory?: boolean) => void;
  deleteSegmentsByIds: (segIds: string[]) => void;
  saveHistorySnapshot: () => void;
  updateSegmentProfile: (segmentId: string, profileId: string, rolEstructural?: RolEstructuralSegmento) => void;
  updateMultipleSegmentsProfile: (segmentIds: string[], profileId: string, rolEstructural?: RolEstructuralSegmento) => void;
  
  deleteSelectedElements: () => void;
  clearScene: () => void;
  assignProfileToSelectedSegments: (profileId: string) => void;
  assignCoverageToSelectedZones: (coverageId: string) => void;

  // Generadores Paramétricos Automáticos que generan Nodos y Segmentos reales en PROJECT_MODEL
  generateTrussFreehand: (startNodeId: string, endNodeId: string, heightM?: number, type?: TipoTijeral, numDivisions?: number, customSpacingM?: number) => void;
  generateRoofGable: (luzM: number, largoM?: number, alturaColM?: number, pendientePct?: number, tipoTijeral?: TipoTijeral, orientacionTijeral?: OrientacionTijeral, numTijerales?: number, posicionesTijeralesCustom?: number[], numDivisionsOrPanels?: number, customSpacingM?: number, peralteM?: number, perimetralBracingEnabled?: boolean, tipoTijeralPerimetral?: TipoTijeral) => void;
  generateRoofMonoslope: (luzM: number, largoM?: number, alturaCol1M?: number, alturaCol2M?: number, tipoTijeral?: TipoTijeral, numTijerales?: number, peralteTijeralM?: number, orientacionTijeral?: OrientacionTijeral, posicionesTijeralesCustom?: number[], customSpacingM?: number, perimetralBracingEnabled?: boolean, tipoTijeralPerimetral?: TipoTijeral) => void;
  generateRoofParabolic: (luzM: number, largoM?: number, alturaColM?: number, flechaM?: number, tipoTijeral?: TipoTijeral, peralteArcoM?: number, orientacionTijeral?: OrientacionTijeral, numTijerales?: number, posicionesTijeralesCustom?: number[], customSpacingM?: number, perimetralBracingEnabled?: boolean, tipoTijeralPerimetral?: TipoTijeral) => void;
  generateRoofSawtooth: (luzM: number, largoM?: number, alturaColM?: number, numDientes?: number, alturaDienteM?: number, tipoTijeral?: TipoTijeral, numTijerales?: number, numDivisionsPerTooth?: number, customSpacingM?: number, peralteM?: number, orientacionTijeral?: OrientacionTijeral) => void;
  generateRoofHip: (luzM: number, largoM?: number, alturaColM?: number, alturaCumbreraM?: number, tipoTijeral?: TipoTijeral, numTijerales?: number, customSpacingM?: number, orientacionTijeral?: OrientacionTijeral) => void;
  generateRoof6Aguas: (luzM: number, largoM?: number, alturaColM?: number, alturaCuspideM?: number, tipoTijeral?: TipoTijeral, numAnillosCorreas?: number, customSpacingM?: number, orientacionTijeral?: OrientacionTijeral) => void;
  generateRoofMansarda: (luzM: number, largoM?: number, alturaColM?: number, alturaQuiebreM?: number, alturaCumbreraM?: number, tipoTijeral?: TipoTijeral, numTijerales?: number, customSpacingM?: number, orientacionTijeral?: OrientacionTijeral) => void;
  generateRoofDome: (diametroM: number, alturaColM?: number, flechaCúpulaM?: number, numCostillasRadiales?: number, tipoTijeral?: TipoTijeral, customSpacingM?: number, orientacionTijeral?: OrientacionTijeral) => void;
  generateRoofLShaped: (luzPrincipalM: number, largoPrincipalM: number, luzAlaM: number, largoAlaM: number, alturaColM?: number, tipoTijeral?: TipoTijeral, orientacionTijeral?: OrientacionTijeral) => void;
  generateRoofButterfly: (luzM: number, largoM?: number, alturaColM?: number, desnivelAlasM?: number, tipoTijeral?: TipoTijeral, numTijerales?: number, orientacionTijeral?: OrientacionTijeral) => void;
  generateRoofCurvoAutoportante: (luzM: number, largoM?: number, alturaMuroM?: number, flechaM?: number, numEjes?: number, tipoTijeral?: TipoTijeral, orientacionTijeral?: OrientacionTijeral) => void;
  generateRoofMarquesina: (luzM: number, largoM?: number, alturaColM?: number, flechaM?: number, numEjes?: number) => void;
  generateRoofTijeralCurvo: (luzM?: number, largoM?: number, alturaColM?: number, cumbreraM?: number, flechaInfM?: number, numEjes?: number) => void;
  generateMultinivel: (luzM?: number, largoM?: number, numPisos?: number, alturaPisoM?: number, numVanosX?: number, numVanosZ?: number) => void;
  generateRoofMonitor: (luzM: number, largoM?: number, alturaColM?: number, pendientePct?: number, anchoMonitorM?: number, alturaMonitorM?: number, tipoTijeral?: TipoTijeral, numTijerales?: number, orientacionTijeral?: OrientacionTijeral) => void;
  addInternalTruss: (zPos: number, tipoTijeral?: TipoTijeral, peralteM?: number) => void;
  generateMezzanine: (largoM: number, anchoM: number, alturaM: number, numSubseccionesX: number, numSubseccionesY: number, esHueco?: boolean, conTijeralesPerimetro?: boolean, conTijeralesInternos?: boolean, tipoTijeral?: TipoTijeral) => void;
  
  // Despiece, Metrados, Presupuesto y Análisis Estructural en Tiempo Real
  bomReport: FullTechosBomReport;
  structuralReport: StructuralAnalysisReport;
  structuralInputs: StructuralAnalysisInput;
  setStructuralInputs: React.Dispatch<React.SetStateAction<StructuralAnalysisInput>>;

  // Pintura y Anclajes
  globalPaintColor: string;
  setGlobalPaintColor: (colorId: string) => void;
  updateNodeAnchorBolts: (nodeId: string, numPernos: number, boltDiameter: string) => void;

  // Importar / Exportar AutoCAD DXF
  importDxfModel: (dxfModel: any, scale?: number) => void;
  exportDxf: (projectName?: string) => string;

  // Deshacer / Rehacer
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

// Generador de estructura por defecto inicial para evitar plano 2D o 3D en blanco
function buildDefaultInitialRoof(): { nodes: Record<string, Node3D>; segments: Record<string, Segment3D> } {
  const newNodes: Record<string, Node3D> = {};
  const newSegs: Record<string, Segment3D> = {};
  const luzM = 12;
  const largoM = 20;
  const alturaColM = 4.5;
  const hCumbrera = (12 / 2) * 0.20; // 1.2m
  const framesCount = 5;
  const dz = largoM / (framesCount - 1);
  const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || 'prof_sq_4x4_3mm';
  const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || 'prof_sq_2x2_2mm';
  const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || 'prof_c_4x2_2mm';

  let prevLeftTopNodes: string[] = [];
  let prevRightTopNodes: string[] = [];

  for (let f = 0; f < framesCount; f++) {
    const z = f * dz;
    const c1 = `n_col1_${f}`;
    const c2 = `n_col1_top_${f}`;
    const c3 = `n_cumbrera_${f}`;
    const c4 = `n_col2_top_${f}`;
    const c5 = `n_col2_${f}`;

    newNodes[c1] = { id: c1, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `COL-IZQ-BASE-${f+1}` };
    newNodes[c2] = { id: c2, x: 0, y: alturaColM, z, nodeLabel: `COL-IZQ-TOP-${f+1}` };
    newNodes[c3] = { id: c3, x: luzM / 2, y: alturaColM + hCumbrera, z, nodeLabel: `CUMBRERA-${f+1}` };
    newNodes[c4] = { id: c4, x: luzM, y: alturaColM, z, nodeLabel: `COL-DER-TOP-${f+1}` };
    newNodes[c5] = { id: c5, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `COL-DER-BASE-${f+1}` };

    newSegs[`s_col1_${f}`] = { id: `s_col1_${f}`, nodeAId: c1, nodeBId: c2, profileId: colProf, rolEstructural: 'columna' };
    newSegs[`s_col2_${f}`] = { id: `s_col2_${f}`, nodeAId: c5, nodeBId: c4, profileId: colProf, rolEstructural: 'columna' };

    const numSub = 4;
    const leftTopNodes: string[] = [c2];
    const rightTopNodes: string[] = [c3];
    const bottomNodes: string[] = [c2];

    for (let i = 1; i < numSub * 2; i++) {
      const xVal = (luzM / (numSub * 2)) * i;
      const bId = `n_bot_${f}_${i}`;
      newNodes[bId] = { id: bId, x: xVal, y: alturaColM, z, nodeLabel: `TIR-${f+1}-${i}` };
      bottomNodes.push(bId);
    }
    bottomNodes.push(c4);

    for (let i = 1; i < numSub; i++) {
      const xVal = (luzM / 2 / numSub) * i;
      const yVal = alturaColM + (hCumbrera / numSub) * i;
      const tId = `n_top_l_${f}_${i}`;
      newNodes[tId] = { id: tId, x: xVal, y: yVal, z, nodeLabel: `CS-IZQ-${f+1}-${i}` };
      leftTopNodes.push(tId);
    }
    leftTopNodes.push(c3);

    for (let i = 1; i < numSub; i++) {
      const xVal = luzM / 2 + (luzM / 2 / numSub) * i;
      const yVal = alturaColM + hCumbrera - (hCumbrera / numSub) * i;
      const tId = `n_top_r_${f}_${i}`;
      newNodes[tId] = { id: tId, x: xVal, y: yVal, z, nodeLabel: `CS-DER-${f+1}-${i}` };
      rightTopNodes.push(tId);
    }
    rightTopNodes.push(c4);

    for (let i = 0; i < bottomNodes.length - 1; i++) {
      newSegs[`s_bot_${f}_${i}`] = { id: `s_bot_${f}_${i}`, nodeAId: bottomNodes[i], nodeBId: bottomNodes[i + 1], profileId: vigaProf, rolEstructural: 'cordon_inferior' };
    }
    for (let i = 0; i < leftTopNodes.length - 1; i++) {
      newSegs[`s_top_l_${f}_${i}`] = { id: `s_top_l_${f}_${i}`, nodeAId: leftTopNodes[i], nodeBId: leftTopNodes[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
    }
    for (let i = 0; i < rightTopNodes.length - 1; i++) {
      newSegs[`s_top_r_${f}_${i}`] = { id: `s_top_r_${f}_${i}`, nodeAId: rightTopNodes[i], nodeBId: rightTopNodes[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
    }

    newSegs[`s_mon_center_${f}`] = { id: `s_mon_center_${f}`, nodeAId: bottomNodes[numSub], nodeBId: c3, profileId: vigaProf, rolEstructural: 'montante' };
    for (let i = 1; i < numSub; i++) {
      newSegs[`s_mon_l_${f}_${i}`] = { id: `s_mon_l_${f}_${i}`, nodeAId: bottomNodes[i], nodeBId: leftTopNodes[i], profileId: vigaProf, rolEstructural: 'montante' };
      newSegs[`s_mon_r_${f}_${i}`] = { id: `s_mon_r_${f}_${i}`, nodeAId: bottomNodes[numSub + i], nodeBId: rightTopNodes[i], profileId: vigaProf, rolEstructural: 'montante' };
    }

    if (f > 0 && prevLeftTopNodes.length > 0) {
      for (let i = 0; i < leftTopNodes.length; i++) {
        newSegs[`s_correa_l_${f}_${i}`] = { id: `s_correa_l_${f}_${i}`, nodeAId: prevLeftTopNodes[i], nodeBId: leftTopNodes[i], profileId: correaProf, rolEstructural: 'correa' };
      }
      for (let i = 1; i < rightTopNodes.length; i++) {
        newSegs[`s_correa_r_${f}_${i}`] = { id: `s_correa_r_${f}_${i}`, nodeAId: prevRightTopNodes[i], nodeBId: rightTopNodes[i], profileId: correaProf, rolEstructural: 'correa' };
      }
    }

    prevLeftTopNodes = [...leftTopNodes];
    prevRightTopNodes = [...rightTopNodes];
  }

  return { nodes: newNodes, segments: newSegs };
}

export function useTechosCadEngineState(initialNodes?: Record<string, Node3D>, initialSegments?: Record<string, Segment3D>): UseTechosCadEngineReturn {
  
  // Si no se envían nodos explícitos, inicializar con estructura predeterminada lista para visualización 2D/3D
  const initData = (!initialNodes || Object.keys(initialNodes).length === 0) 
    ? buildDefaultInitialRoof() 
    : { nodes: initialNodes, segments: initialSegments || {} };

  const defaultNodes: Record<string, Node3D> = initData.nodes;
  const defaultSegments: Record<string, Segment3D> = initData.segments;
  const defaultCoverageZones: Record<string, CoverageZone3D> = {};

  const [nodes, setNodes] = useState<Record<string, Node3D>>(defaultNodes);
  // Espejo síncrono de `nodes`: permite que operaciones que crean un nodo y
  // acto seguido lo usan (p. ej. el Tijeral a mano) vean el nodo recién creado
  // en el mismo tick, antes de que React confirme el re-render.
  const nodesRef = useRef<Record<string, Node3D>>(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  const [segments, setSegments] = useState<Record<string, Segment3D>>(defaultSegments);
  const [coverageZones, setCoverageZones] = useState<Record<string, CoverageZone3D>>(defaultCoverageZones);

  const [activeTool, setActiveTool] = useState<ToolModoCad>('select');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  
  const [activeProfileId, setActiveProfileId] = useState<string>(INVENTARIO_PERFILES_TUBULARES[0]?.id || 'prof_sq_2x2_2mm');
  const [activeCoverageId, setActiveCoverageId] = useState<string>(INVENTARIO_COBERTURAS[0]?.id || 'cov_aluzinc_tr4_040');

  const [snapGridSizeM, setSnapGridSizeM] = useState<number>(0.25);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [globalPaintColor, setGlobalPaintColor] = useState<string>('blanco');

  // Entradas para Análisis Estructural segun RNE E.020, E.030, E.090
  const [structuralInputs, setStructuralInputs] = useState<StructuralAnalysisInput>({
    cargaMuertaKgM2: 15,
    cargaVivaKgM2: 30,
    velocidadVientoKmH: 75,
    zonaSismica: 'Z4',
    tipoSuelo: 'S2'
  });

  // Historial de Undo / Redo
  const [history, setHistory] = useState<{
    nodes: Record<string, Node3D>;
    segments: Record<string, Segment3D>;
    coverageZones: Record<string, CoverageZone3D>;
  }[]>([{ nodes: defaultNodes, segments: defaultSegments, coverageZones: defaultCoverageZones }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushHistory = useCallback((newNodes: Record<string, Node3D>, newSegs: Record<string, Segment3D>, newZones: Record<string, CoverageZone3D>) => {
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push({ nodes: newNodes, segments: newSegs, coverageZones: newZones });
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  }, [history, historyIndex]);

  const updateNodeAnchorBolts = useCallback((nodeId: string, numPernos: number, boltDiameter: string) => {
    setNodes(prev => {
      const node = prev[nodeId];
      if (!node) return prev;
      const updated = { ...node, numPernos, boltDiameter, isFixedSupport: true };
      const newNodes = { ...prev, [nodeId]: updated };
      pushHistory(newNodes, segments, coverageZones);
      return newNodes;
    });
  }, [segments, coverageZones, pushHistory]);

  // Operación: Agregar Nodo con Snap y Prevención de Duplicados
  const addNode = useCallback((x: number, y: number, z: number = 0, isFixed: boolean = false, exact: boolean = false): string => {
    let finalX = x;
    let finalY = y;
    let finalZ = z;

    // `exact` = el punto ya viene con snap/O-snap aplicado desde el lienzo (cae donde
    // está el cursor). En ese caso NO se re-redondea a la grilla, porque eso hacía que
    // el nodo "saltara" a la intersección de grilla más cercana al confirmar el clic.
    if (!exact && snapEnabled && snapGridSizeM > 0) {
      finalX = Math.round(x / snapGridSizeM) * snapGridSizeM;
      finalY = Math.round(y / snapGridSizeM) * snapGridSizeM;
      finalZ = Math.round(z / snapGridSizeM) * snapGridSizeM;
    }

    // Normalización de precisión decimal para evitar discrepancias de punto flotante
    finalX = Number(finalX.toFixed(3));
    finalY = Number(finalY.toFixed(3));
    finalZ = Number(finalZ.toFixed(3));

    // REVISAR SI YA EXISTE UN NODO EN ESTA POSICIÓN (tolerancia CAD de 0.08m)
    // Esto garantiza que cerrar perímetros reutilice el nodo inicial en lugar de crear nodos huérfanos
    const existingNode = Object.values(nodes).find(n => {
      const dx = n.x - finalX;
      const dy = n.y - finalY;
      const dz = (n.z || 0) - finalZ;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.08;
    });

    if (existingNode) {
      if (isFixed && !existingNode.isFixedSupport) {
        setNodes(prev => ({
          ...prev,
          [existingNode.id]: { ...existingNode, isFixedSupport: true }
        }));
      }
      return existingNode.id;
    }

    const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newNodes = {
      ...nodes,
      [id]: { id, x: finalX, y: finalY, z: finalZ, isFixedSupport: isFixed, nodeLabel: `N-${Object.keys(nodes).length + 1}` }
    };

    nodesRef.current = newNodes; // disponible de inmediato para la misma operación
    setNodes(newNodes);
    pushHistory(newNodes, segments, coverageZones);
    return id;
  }, [nodes, segments, coverageZones, snapEnabled, snapGridSizeM, pushHistory]);

  // Operación: Dividir un Segmento existente insertando un Nodo de anclaje (Split Segment at Snap Point)
  const splitSegmentAtPoint = useCallback((segmentId: string, x: number, y: number, z: number = 0, isFixed: boolean = false): string => {
    const seg = segments[segmentId];
    if (!seg) {
      return addNode(x, y, z, isFixed);
    }

    const nA = nodes[seg.nodeAId];
    const nB = nodes[seg.nodeBId];

    // Si el punto está muy próximo a los extremos (< 0.05m), devolver el nodo existente
    if (nA) {
      const distA = Math.hypot(nA.x - x, nA.y - y, (nA.z || 0) - z);
      if (distA < 0.05) return nA.id;
    }
    if (nB) {
      const distB = Math.hypot(nB.x - x, nB.y - y, (nB.z || 0) - z);
      if (distB < 0.05) return nB.id;
    }

    // Crear el nuevo nodo de unión
    const newNodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const finalX = Number(x.toFixed(3));
    const finalY = Number(y.toFixed(3));
    const finalZ = Number(z.toFixed(3));

    const updatedNodes = {
      ...nodes,
      [newNodeId]: {
        id: newNodeId,
        x: finalX,
        y: finalY,
        z: finalZ,
        isFixedSupport: isFixed,
        nodeLabel: `N-${Object.keys(nodes).length + 1}`
      }
    };

    // Reemplazar el segmento original por dos sub-segmentos que comparten el nodo
    const seg1Id = `seg_${Date.now()}_${Math.floor(Math.random() * 1000)}_a`;
    const seg2Id = `seg_${Date.now()}_${Math.floor(Math.random() * 1000)}_b`;

    const { [segmentId]: removedSeg, ...remainingSegs } = segments;

    const updatedSegs = {
      ...remainingSegs,
      [seg1Id]: {
        id: seg1Id,
        nodeAId: seg.nodeAId,
        nodeBId: newNodeId,
        profileId: seg.profileId,
        rolEstructural: seg.rolEstructural
      },
      [seg2Id]: {
        id: seg2Id,
        nodeAId: newNodeId,
        nodeBId: seg.nodeBId,
        profileId: seg.profileId,
        rolEstructural: seg.rolEstructural
      }
    };

    setNodes(updatedNodes);
    setSegments(updatedSegs);
    pushHistory(updatedNodes, updatedSegs, coverageZones);
    return newNodeId;
  }, [nodes, segments, coverageZones, addNode, pushHistory]);

  // Operación: Agregar Segmento Lineal con Prevención de Duplicados
  const addSegment = useCallback((nodeAId: string, nodeBId: string, rolEstructural: RolEstructuralSegmento = 'viga_principal', profileId?: string): string => {
    if (!nodeAId || !nodeBId || nodeAId === nodeBId) return '';

    // Evitar segmentos duplicados entre los mismos dos nodos
    const existingSeg = Object.values(segments).find(s => 
      (s.nodeAId === nodeAId && s.nodeBId === nodeBId) ||
      (s.nodeAId === nodeBId && s.nodeBId === nodeAId)
    );
    if (existingSeg) {
      return existingSeg.id;
    }

    const id = `seg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const profId = profileId || activeProfileId;

    const newSegs = {
      ...segments,
      [id]: {
        id,
        nodeAId,
        nodeBId,
        profileId: profId,
        rolEstructural
      }
    };

    setSegments(newSegs);
    pushHistory(nodes, newSegs, coverageZones);
    return id;
  }, [nodes, segments, coverageZones, activeProfileId, pushHistory]);

  // Carga de Proyecto y Restauración de Escena Completa
  const loadScene = useCallback((loadedNodes: Record<string, Node3D>, loadedSegments: Record<string, Segment3D>, loadedZones?: Record<string, CoverageZone3D>) => {
    const n = loadedNodes || {};
    const s = loadedSegments || {};
    const z = loadedZones || {};
    setNodes(n);
    setSegments(s);
    setCoverageZones(z);
    setSelectedElementIds([]);
    setHistory([{ nodes: n, segments: s, coverageZones: z }]);
    setHistoryIndex(0);
  }, []);

  // Operación: Agregar Rectángulo de Cuatro Nodos
  const addRectangle = useCallback((x1: number, y1: number, x2: number, y2: number, rolEstructural: RolEstructuralSegmento = 'viga_principal') => {
    const n1Id = `node_${Date.now()}_1`;
    const n2Id = `node_${Date.now()}_2`;
    const n3Id = `node_${Date.now()}_3`;
    const n4Id = `node_${Date.now()}_4`;

    const newNodes: Record<string, Node3D> = {
      ...nodes,
      [n1Id]: { id: n1Id, x: x1, y: y1, z: 0, nodeLabel: 'N-R1' },
      [n2Id]: { id: n2Id, x: x2, y: y1, z: 0, nodeLabel: 'N-R2' },
      [n3Id]: { id: n3Id, x: x2, y: y2, z: 0, nodeLabel: 'N-R3' },
      [n4Id]: { id: n4Id, x: x1, y: y2, z: 0, nodeLabel: 'N-R4' },
    };

    const s1Id = `seg_${Date.now()}_1`;
    const s2Id = `seg_${Date.now()}_2`;
    const s3Id = `seg_${Date.now()}_3`;
    const s4Id = `seg_${Date.now()}_4`;

    const profId = activeProfileId;
    const newSegs: Record<string, Segment3D> = {
      ...segments,
      [s1Id]: { id: s1Id, nodeAId: n1Id, nodeBId: n2Id, profileId: profId, rolEstructural },
      [s2Id]: { id: s2Id, nodeAId: n2Id, nodeBId: n3Id, profileId: profId, rolEstructural },
      [s3Id]: { id: s3Id, nodeAId: n3Id, nodeBId: n4Id, profileId: profId, rolEstructural },
      [s4Id]: { id: s4Id, nodeAId: n4Id, nodeBId: n1Id, profileId: profId, rolEstructural },
    };

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [nodes, segments, coverageZones, activeProfileId, pushHistory]);

  // Actualizar Coordenadas de Nodo (con soporte para arrastre libre y fluidéz)
  const updateNodeCoords = useCallback((nodeId: string, x: number, y: number, z: number = 0, saveHistory: boolean = true) => {
    if (!nodes[nodeId]) return;
    const finalX = Number(x.toFixed(3));
    const finalY = Number(y.toFixed(3));
    const finalZ = Number(z.toFixed(3));
    const newNodes = {
      ...nodes,
      [nodeId]: { ...nodes[nodeId], x: finalX, y: finalY, z: finalZ }
    };
    setNodes(newNodes);
    if (saveHistory) {
      pushHistory(newNodes, segments, coverageZones);
    }
  }, [nodes, segments, coverageZones, pushHistory]);

  // Mueve un nodo y, si forma parte de una COLUMNA vertical (segmento 'columna' o
  // 'columna_concreto'), arrastra también el otro extremo para que la columna se
  // mueva como UNA sola pieza y no se "despiece" (base y tope separados).
  //  - En PLANTA (X-Z): base y tope comparten posición en planta → se mueven ambos
  //    en X y Z; la altura (Y) propia de cada uno se conserva.
  //  - En SECCIÓN (X-Y): se iguala solo la X del otro extremo para mantener la
  //    columna vertical; la altura la cambia únicamente el nodo que arrastras.
  const moveNodeWithColumn = useCallback((
    nodeId: string, x: number, y: number, z: number,
    vista: 'planta' | 'seccion', saveHistory: boolean = false
  ) => {
    const node = nodes[nodeId];
    if (!node) return;
    const fx = Number(x.toFixed(3));
    const fy = Number(y.toFixed(3));
    const fz = Number(z.toFixed(3));
    const newNodes: Record<string, Node3D> = { ...nodes, [nodeId]: { ...node, x: fx, y: fy, z: fz } };

    const colSegs = Object.values(segments).filter(s =>
      (s.rolEstructural === 'columna' || s.rolEstructural === 'columna_concreto') &&
      (s.nodeAId === nodeId || s.nodeBId === nodeId)
    );
    for (const s of colSegs) {
      const partnerId = s.nodeAId === nodeId ? s.nodeBId : s.nodeAId;
      const partner = newNodes[partnerId];
      if (!partner) continue;
      newNodes[partnerId] = vista === 'planta'
        ? { ...partner, x: fx, z: fz }
        : { ...partner, x: fx };
    }

    setNodes(newNodes);
    if (saveHistory) pushHistory(newNodes, segments, coverageZones);
  }, [nodes, segments, coverageZones, pushHistory]);

  const saveHistorySnapshot = useCallback(() => {
    pushHistory(nodes, segments, coverageZones);
  }, [nodes, segments, coverageZones, pushHistory]);

  // Operación: Trazar Arco Curvo / Parabólico entre dos puntos con flecha de elevación
  const addArcBetweenPoints = useCallback((
    p1: { x: number; y: number; z?: number; nodeId?: string },
    p2: { x: number; y: number; z?: number; nodeId?: string },
    sagittaHeightM: number,
    numDivisions: number = 8,
    rolEstructural: RolEstructuralSegmento = 'cordon_superior',
    profileId?: string
  ): string[] => {
    const profId = profileId || activeProfileId;
    const divisions = Math.max(3, Math.min(24, Math.round(numDivisions)));
    
    let startNodeId = p1.nodeId;
    let endNodeId = p2.nodeId;

    const z1 = p1.z || 0;
    const z2 = p2.z || 0;

    let currentNodes = { ...nodes };
    let currentSegs = { ...segments };

    if (!startNodeId) {
      startNodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}_s`;
      currentNodes[startNodeId] = {
        id: startNodeId,
        x: Number(p1.x.toFixed(3)),
        y: Number(p1.y.toFixed(3)),
        z: Number(z1.toFixed(3)),
        nodeLabel: `N-${Object.keys(currentNodes).length + 1}`
      };
    }

    if (!endNodeId) {
      endNodeId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}_e`;
      currentNodes[endNodeId] = {
        id: endNodeId,
        x: Number(p2.x.toFixed(3)),
        y: Number(p2.y.toFixed(3)),
        z: Number(z2.toFixed(3)),
        nodeLabel: `N-${Object.keys(currentNodes).length + 1}`
      };
    }

    const nStart = currentNodes[startNodeId] || { x: p1.x, y: p1.y, z: z1 };
    const nEnd = currentNodes[endNodeId] || { x: p2.x, y: p2.y, z: z2 };

    const dx = nEnd.x - nStart.x;
    const dy = nEnd.y - nStart.y;
    const dz = (nEnd.z || 0) - (nStart.z || 0);

    const chordLength = Math.hypot(dx, dy);
    if (chordLength < 0.05) return [];

    // Vector unitario perpendicular en plano XY
    let nx = -dy / chordLength;
    let ny = dx / chordLength;

    // Orientar perpendicular hacia arriba en elevación
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }

    const arcNodeIds: string[] = [startNodeId];
    const createdSegmentIds: string[] = [];

    for (let i = 1; i < divisions; i++) {
      const t = i / divisions;
      // Perfil Parabólico: y_offset = 4 * h * t * (1 - t)
      const parabolaOffset = 4 * sagittaHeightM * t * (1 - t);

      const ptX = nStart.x + t * dx + parabolaOffset * nx;
      const ptY = nStart.y + t * dy + parabolaOffset * ny;
      const ptZ = (nStart.z || 0) + t * dz;

      const arcNodeId = `node_arc_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;
      currentNodes[arcNodeId] = {
        id: arcNodeId,
        x: Number(ptX.toFixed(3)),
        y: Number(ptY.toFixed(3)),
        z: Number(ptZ.toFixed(3)),
        nodeLabel: `ARC-${i}`
      };
      arcNodeIds.push(arcNodeId);
    }
    arcNodeIds.push(endNodeId);

    // Conectar nodos del arco con segmentos
    for (let i = 0; i < arcNodeIds.length - 1; i++) {
      const segId = `seg_arc_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;
      currentSegs[segId] = {
        id: segId,
        nodeAId: arcNodeIds[i],
        nodeBId: arcNodeIds[i + 1],
        profileId: profId,
        rolEstructural
      };
      createdSegmentIds.push(segId);
    }

    setNodes(currentNodes);
    setSegments(currentSegs);
    pushHistory(currentNodes, currentSegs, coverageZones);
    return createdSegmentIds;
  }, [nodes, segments, coverageZones, activeProfileId, pushHistory]);

  // Actualizar Perfil o Rol de Segmento
  const updateSegmentProfile = useCallback((segmentId: string, profileId: string, rolEstructural?: RolEstructuralSegmento) => {
    if (!segments[segmentId]) return;
    const newSegs = {
      ...segments,
      [segmentId]: {
        ...segments[segmentId],
        profileId,
        ...(rolEstructural ? { rolEstructural } : {})
      }
    };
    setSegments(newSegs);
    pushHistory(nodes, newSegs, coverageZones);
  }, [nodes, segments, coverageZones, pushHistory]);

  // Actualizar Múltiples Segmentos en Lote (por categoría o selección masiva)
  const updateMultipleSegmentsProfile = useCallback((segmentIds: string[], profileId: string, rolEstructural?: RolEstructuralSegmento) => {
    if (!segmentIds || segmentIds.length === 0) return;
    const newSegs = { ...segments };
    let changed = false;
    segmentIds.forEach(id => {
      if (newSegs[id]) {
        newSegs[id] = {
          ...newSegs[id],
          profileId,
          ...(rolEstructural ? { rolEstructural } : {})
        };
        changed = true;
      }
    });
    if (changed) {
      setSegments(newSegs);
      pushHistory(nodes, newSegs, coverageZones);
    }
  }, [nodes, segments, coverageZones, pushHistory]);

  // Operación: Agregar Polígono de Cobertura
  const addCoverageZone = useCallback((nodeIdsBoundary: string[], coberturaId?: string, pendientePct: number = 20): string => {
    if (nodeIdsBoundary.length < 2) return '';
    const id = `zone_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const covId = coberturaId || activeCoverageId;

    const newZones = {
      ...coverageZones,
      [id]: {
        id,
        nombre: `Zona Cobertura #${Object.keys(coverageZones).length + 1}`,
        nodeIdsBoundary,
        coberturaMaterialId: covId,
        pendientePorcentaje: pendientePct,
        orientacionInclinacionDeg: 0
      }
    };

    setCoverageZones(newZones);
    pushHistory(nodes, segments, newZones);
    return id;
  }, [nodes, segments, coverageZones, activeCoverageId, pushHistory]);

  // Asignar perfil físico a trazos seleccionados
  const assignProfileToSelectedSegments = useCallback((profileId: string) => {
    if (selectedElementIds.length === 0) return;

    const newSegs = { ...segments };
    selectedElementIds.forEach(id => {
      if (newSegs[id]) {
        newSegs[id] = { ...newSegs[id], profileId };
      }
    });

    setSegments(newSegs);
    pushHistory(nodes, newSegs, coverageZones);
  }, [nodes, segments, coverageZones, selectedElementIds, pushHistory]);

  // Asignar cobertura a áreas seleccionadas
  const assignCoverageToSelectedZones = useCallback((coverageId: string) => {
    if (selectedElementIds.length === 0) return;

    const newZones = { ...coverageZones };
    selectedElementIds.forEach(id => {
      if (newZones[id]) {
        newZones[id] = { ...newZones[id], coberturaMaterialId: coverageId };
      }
    });

    setCoverageZones(newZones);
    pushHistory(nodes, segments, newZones);
  }, [nodes, segments, coverageZones, selectedElementIds, pushHistory]);

  // Eliminar Elementos Seleccionados
  const deleteSelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const newNodes = { ...nodes };
    const newSegs = { ...segments };
    const newZones = { ...coverageZones };

    selectedElementIds.forEach(id => {
      delete newNodes[id];
      delete newSegs[id];
      delete newZones[id];
    });

    // Limpiar segmentos que hacían referencia a nodos eliminados
    Object.keys(newSegs).forEach(sId => {
      const seg = newSegs[sId];
      if (!newNodes[seg.nodeAId] || !newNodes[seg.nodeBId]) {
        delete newSegs[sId];
      }
    });

    setNodes(newNodes);
    setSegments(newSegs);
    setCoverageZones(newZones);
    setSelectedElementIds([]);
    pushHistory(newNodes, newSegs, newZones);
  }, [nodes, segments, coverageZones, selectedElementIds, pushHistory]);

  // Eliminar un grupo de segmentos por sus IDs (p. ej. "todas las columnas" desde
  // el Inspector). Borra los segmentos y, además, los NODOS que queden huérfanos
  // (sin ningún otro segmento que los use). Los nodos compartidos con otros
  // elementos se conservan para no romper el resto de la estructura.
  const deleteSegmentsByIds = useCallback((segIds: string[]) => {
    if (!segIds || segIds.length === 0) return;
    const borrar = new Set(segIds);
    const newSegs: Record<string, Segment3D> = {};
    Object.values(segments).forEach(s => { if (!borrar.has(s.id)) newSegs[s.id] = s; });

    // Nodos que siguen en uso por algún segmento sobreviviente.
    const nodosEnUso = new Set<string>();
    Object.values(newSegs).forEach(s => { nodosEnUso.add(s.nodeAId); nodosEnUso.add(s.nodeBId); });

    // Nodos tocados por los segmentos borrados que ya no usa nadie → se eliminan.
    const newNodes: Record<string, Node3D> = { ...nodes };
    segIds.forEach(id => {
      const s = segments[id];
      if (!s) return;
      if (!nodosEnUso.has(s.nodeAId)) delete newNodes[s.nodeAId];
      if (!nodosEnUso.has(s.nodeBId)) delete newNodes[s.nodeBId];
    });

    setNodes(newNodes);
    setSegments(newSegs);
    setSelectedElementIds([]);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [nodes, segments, coverageZones, pushHistory]);

  // Limpiar escena (Pantalla completamente vacía)
  const clearScene = useCallback(() => {
    setNodes({});
    setSegments({});
    setCoverageZones({});
    setSelectedElementIds([]);
    pushHistory({}, {}, {});
  }, [pushHistory]);

  // Copiar elementos seleccionados (nodos, vigas, coberturas)
  const copySelectedElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    
    const copiedNodes: Node3D[] = [];
    const copiedSegs: Segment3D[] = [];
    const copiedZones: CoverageZone3D[] = [];

    selectedElementIds.forEach(id => {
      if (nodes[id]) {
        copiedNodes.push(nodes[id]);
      }
      if (segments[id]) {
        copiedSegs.push(segments[id]);
      }
      if (coverageZones[id]) {
        copiedZones.push(coverageZones[id]);
      }
    });

    // Asegurar que copiamos los nodos que sostienen los segmentos seleccionados
    copiedSegs.forEach(seg => {
      if (!copiedNodes.find(n => n.id === seg.nodeAId) && nodes[seg.nodeAId]) {
        copiedNodes.push(nodes[seg.nodeAId]);
      }
      if (!copiedNodes.find(n => n.id === seg.nodeBId) && nodes[seg.nodeBId]) {
        copiedNodes.push(nodes[seg.nodeBId]);
      }
    });

    if (copiedNodes.length > 0 || copiedSegs.length > 0 || copiedZones.length > 0) {
      cadClipboard = {
        nodes: copiedNodes,
        segments: copiedSegs,
        coverageZones: copiedZones
      };
    }
  }, [selectedElementIds, nodes, segments, coverageZones]);

  // Pegar elementos copiados con un desplazamiento para evitar superposición perfecta
  const pasteElements = useCallback(() => {
    if (!cadClipboard) return;

    const newNodes = { ...nodes };
    const newSegs = { ...segments };
    const newZones = { ...coverageZones };
    const nodeIdMap: Record<string, string> = {};

    // Desplazamiento comercial típico: 1 metro a la derecha y 1 metro atrás
    const offset = 1.0; 

    cadClipboard.nodes.forEach(node => {
      const newId = `node_pasted_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      nodeIdMap[node.id] = newId;

      newNodes[newId] = {
        ...node,
        id: newId,
        x: Number((node.x + offset).toFixed(3)),
        y: Number(node.y.toFixed(3)),
        z: Number(((node.z || 0) + offset).toFixed(3)),
        nodeLabel: `${node.nodeLabel || 'N'}_pasted`
      };
    });

    const pastedIds: string[] = [];
    cadClipboard.segments.forEach(seg => {
      const newA = nodeIdMap[seg.nodeAId];
      const newB = nodeIdMap[seg.nodeBId];

      if (newA && newB) {
        const newId = `seg_pasted_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        newSegs[newId] = {
          ...seg,
          id: newId,
          nodeAId: newA,
          nodeBId: newB
        };
        pastedIds.push(newId);
      }
    });

    cadClipboard.coverageZones.forEach(zone => {
      const newBoundary = zone.nodeIdsBoundary.map(id => nodeIdMap[id]).filter(Boolean);
      if (newBoundary.length >= 2) {
        const newId = `zone_pasted_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        newZones[newId] = {
          ...zone,
          id: newId,
          nodeIdsBoundary: newBoundary
        };
        pastedIds.push(newId);
      }
    });

    setNodes(newNodes);
    setSegments(newSegs);
    setCoverageZones(newZones);
    
    // Auto-seleccionar los nuevos elementos pegados
    const allPastedIds = [...Object.values(nodeIdMap), ...pastedIds];
    setSelectedElementIds(allPastedIds);

    pushHistory(newNodes, newSegs, newZones);
  }, [nodes, segments, coverageZones, pushHistory]);

  // Generador de Tijeral Paramétrico (Escalera Vierendeel, Howe, Pratt, Warren, Fink, Plano Joist)
  const generateTrussFreehand = useCallback((
    startNodeId: string, 
    endNodeId: string, 
    heightM: number = 0.50, 
    type: TipoTijeral = 'escalera_vierendeel',
    numDivisions?: number,
    customSpacingM?: number
  ) => {
    // Usar el espejo síncrono para ver un nodo recién creado en este mismo tick.
    const liveNodes = nodesRef.current;
    const nA = liveNodes[startNodeId];
    const nB = liveNodes[endNodeId];
    if (!nA || !nB) return;

    const totalLength = Math.hypot(nB.x - nA.x, (nB.z || 0) - (nA.z || 0), nB.y - nA.y);
    let numPanels = 6;
    if (numDivisions && numDivisions >= 1) {
      numPanels = Math.max(1, Math.round(numDivisions));
    } else if (customSpacingM && customSpacingM > 0.05) {
      numPanels = Math.max(1, Math.round(totalLength / customSpacingM));
    }

    const dx = (nB.x - nA.x) / numPanels;
    const dy = (nB.y - nA.y) / numPanels;
    const dz = ((nB.z || 0) - (nA.z || 0)) / numPanels;

    const newNodes = { ...liveNodes };
    const newSegs = { ...segments };

    const bottomNodeIds: string[] = [startNodeId];
    const topNodeIds: string[] = [];

    for (let i = 1; i < numPanels; i++) {
      const id = `node_truss_b_${i}_${Date.now()}`;
      newNodes[id] = { 
        id, 
        x: nA.x + dx * i, 
        y: nA.y + dy * i, 
        z: (nA.z || 0) + dz * i, 
        nodeLabel: `N-TB${i}` 
      };
      bottomNodeIds.push(id);
    }
    bottomNodeIds.push(endNodeId);

    // Cordón superior
    for (let i = 0; i <= numPanels; i++) {
      const bNode = newNodes[bottomNodeIds[i]] || liveNodes[bottomNodeIds[i]];
      const id = `node_truss_t_${i}_${Date.now()}`;
      newNodes[id] = { 
        id, 
        x: bNode.x, 
        y: bNode.y + heightM, 
        z: bNode.z, 
        nodeLabel: `N-TT${i}` 
      };
      topNodeIds.push(id);
    }

    // Trazar cordones
    for (let i = 0; i < numPanels; i++) {
      const idBot = `seg_tb_${i}_${Date.now()}`;
      newSegs[idBot] = { id: idBot, nodeAId: bottomNodeIds[i], nodeBId: bottomNodeIds[i + 1], profileId: activeProfileId, rolEstructural: 'cordon_inferior' };

      const idTop = `seg_tt_${i}_${Date.now()}`;
      newSegs[idTop] = { id: idTop, nodeAId: topNodeIds[i], nodeBId: topNodeIds[i + 1], profileId: activeProfileId, rolEstructural: 'cordon_superior' };
    }

    // Montantes verticales (en escalera_vierendeel, pratt, howe, fink, plano_viga, parabolico_pratt)
    const isLadderOrVertical = 
      type === 'escalera_vierendeel' || 
      type === 'pratt' || 
      type === 'howe' || 
      type === 'fink' || 
      type === 'plano_viga' || 
      type === 'parabolico_pratt';

    if (isLadderOrVertical) {
      for (let i = 0; i <= numPanels; i++) {
        const idMon = `seg_mon_${i}_${Date.now()}`;
        newSegs[idMon] = { id: idMon, nodeAId: bottomNodeIds[i], nodeBId: topNodeIds[i], profileId: activeProfileId, rolEstructural: 'montante' };
      }
    }

    // Diagonales según tipología (en escalera_vierendeel NO se generan diagonales para dejar vanos limpios tipo escalera)
    if (type !== 'escalera_vierendeel') {
      for (let i = 0; i < numPanels; i++) {
        const idDiag = `seg_diag_${i}_${Date.now()}`;
        if (type === 'howe') {
          // Howe: Diagonales hacia los apoyos
          const fromNode = i < numPanels / 2 ? bottomNodeIds[i] : bottomNodeIds[i + 1];
          const toNode = i < numPanels / 2 ? topNodeIds[i + 1] : topNodeIds[i];
          newSegs[idDiag] = { id: idDiag, nodeAId: fromNode, nodeBId: toNode, profileId: activeProfileId, rolEstructural: 'diagonal' };
        } else if (type === 'pratt' || type === 'parabolico_pratt') {
          // Pratt: Diagonales hacia el centro
          const fromNode = i < numPanels / 2 ? bottomNodeIds[i + 1] : bottomNodeIds[i];
          const toNode = i < numPanels / 2 ? topNodeIds[i] : topNodeIds[i + 1];
          newSegs[idDiag] = { id: idDiag, nodeAId: fromNode, nodeBId: toNode, profileId: activeProfileId, rolEstructural: 'diagonal' };
        } else {
          // Warren: Alternada en zig-zag continuo
          const fromNode = i % 2 === 0 ? bottomNodeIds[i] : bottomNodeIds[i + 1];
          const toNode = i % 2 === 0 ? topNodeIds[i + 1] : topNodeIds[i];
          newSegs[idDiag] = { id: idDiag, nodeAId: fromNode, nodeBId: toNode, profileId: activeProfileId, rolEstructural: 'diagonal' };
        }
      }
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [nodes, segments, coverageZones, activeProfileId, pushHistory]);

  // Generador de Techo Dos Aguas en Nodos / Segmentos Reales 3D con Tijerales Fink, Pratt o Warren
  const generateRoofGable = useCallback((
    luzM: number, 
    largoM: number = 20, 
    alturaColM: number = 4.5, 
    pendientePct: number = 20,
    tipoTijeral: TipoTijeral = 'fink',
    orientacionTijeral: OrientacionTijeral = 'vertical',
    numTijerales?: number,
    posicionesTijeralesCustom?: number[],
    numDivisionsOrPanels?: number,
    customSpacingM?: number,
    _peralteM?: number,
    perimetralBracingEnabled?: boolean,
    tipoTijeralPerimetral?: TipoTijeral
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasLongitudinal = orientacionTijeral === 'horizontal' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'completo';
    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    const hCumbrera = (luzM / 2) * (pendientePct / 100);

    // Determinación de posiciones de tijerales (distribución equitativa o custom)
    let framePositions: number[] = [];
    if (posicionesTijeralesCustom && posicionesTijeralesCustom.length >= 2) {
      framePositions = [...posicionesTijeralesCustom].sort((a, b) => a - b);
    } else {
      const framesCount = numTijerales && numTijerales >= 2 ? numTijerales : Math.max(2, Math.round(largoM / 5.0) + 1);
      const dz = framesCount > 1 ? largoM / (framesCount - 1) : 0;
      for (let f = 0; f < framesCount; f++) {
        framePositions.push(f * dz);
      }
    }
    const numFrames = framePositions.length;

    let numSub = 4; // 4 paneles por lado por defecto
    if (numDivisionsOrPanels && numDivisionsOrPanels >= 2) {
      numSub = Math.max(2, Math.round(numDivisionsOrPanels / 2));
    } else if (customSpacingM && customSpacingM > 0.1) {
      numSub = Math.max(2, Math.round((luzM / 2) / customSpacingM));
    }

    let prevLeftTopNodes: string[] = [];
    let prevRightTopNodes: string[] = [];
    let prevBottomNodes: string[] = [];

    for (let f = 0; f < numFrames; f++) {
      const z = framePositions[f];
      const c1 = `n_col1_${f}`;
      const c2 = `n_col1_top_${f}`;
      const c3 = `n_cumbrera_${f}`;
      const c4 = `n_col2_top_${f}`;
      const c5 = `n_col2_${f}`;

      newNodes[c1] = { id: c1, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `COL-IZQ-BASE-${f+1}` };
      newNodes[c2] = { id: c2, x: 0, y: alturaColM, z, nodeLabel: `COL-IZQ-TOP-${f+1}` };
      newNodes[c3] = { id: c3, x: luzM / 2, y: alturaColM + hCumbrera, z, nodeLabel: `CUMBRERA-${f+1}` };
      newNodes[c4] = { id: c4, x: luzM, y: alturaColM, z, nodeLabel: `COL-DER-TOP-${f+1}` };
      newNodes[c5] = { id: c5, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `COL-DER-BASE-${f+1}` };

      // Columnas
      newSegs[`s_col1_${f}`] = { id: `s_col1_${f}`, nodeAId: c1, nodeBId: c2, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_col2_${f}`] = { id: `s_col2_${f}`, nodeAId: c5, nodeBId: c4, profileId: colProf, rolEstructural: 'columna' };

      // Nodos intermedios para la celosía del tijeral a dos aguas
      const leftTopNodes: string[] = [c2];
      const rightTopNodes: string[] = [c3];
      const bottomNodes: string[] = [c2];

      // Puntos en cordón inferior
      for (let i = 1; i < numSub * 2; i++) {
        const xVal = (luzM / (numSub * 2)) * i;
        const bId = `n_bot_${f}_${i}`;
        newNodes[bId] = { id: bId, x: xVal, y: alturaColM, z, nodeLabel: `TIR-${f+1}-${i}` };
        bottomNodes.push(bId);
      }
      bottomNodes.push(c4);

      // Puntos en ala izquierda superior
      for (let i = 1; i < numSub; i++) {
        const xVal = (luzM / 2 / numSub) * i;
        const yVal = alturaColM + (hCumbrera / numSub) * i;
        const tId = `n_top_l_${f}_${i}`;
        newNodes[tId] = { id: tId, x: xVal, y: yVal, z, nodeLabel: `CS-IZQ-${f+1}-${i}` };
        leftTopNodes.push(tId);
      }
      leftTopNodes.push(c3);

      // Puntos en ala derecha superior
      for (let i = 1; i < numSub; i++) {
        const xVal = luzM / 2 + (luzM / 2 / numSub) * i;
        const yVal = alturaColM + hCumbrera - (hCumbrera / numSub) * i;
        const tId = `n_top_r_${f}_${i}`;
        newNodes[tId] = { id: tId, x: xVal, y: yVal, z, nodeLabel: `CS-DER-${f+1}-${i}` };
        rightTopNodes.push(tId);
      }
      rightTopNodes.push(c4);

      // Conectar Cordón Inferior
      for (let i = 0; i < bottomNodes.length - 1; i++) {
        const sBotId = `s_bot_${f}_${i}`;
        newSegs[sBotId] = { id: sBotId, nodeAId: bottomNodes[i], nodeBId: bottomNodes[i + 1], profileId: vigaProf, rolEstructural: 'cordon_inferior' };
      }

      // Conectar Cordón Superior Izquierdo y Derecho
      for (let i = 0; i < leftTopNodes.length - 1; i++) {
        const sTopL = `s_top_l_${f}_${i}`;
        newSegs[sTopL] = { id: sTopL, nodeAId: leftTopNodes[i], nodeBId: leftTopNodes[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
      }
      for (let i = 0; i < rightTopNodes.length - 1; i++) {
        const sTopR = `s_top_r_${f}_${i}`;
        newSegs[sTopR] = { id: sTopR, nodeAId: rightTopNodes[i], nodeBId: rightTopNodes[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
      }

      // Montantes Verticales y Diagonales según tipología (Fink / Pratt / Howe / Warren)
      const midBotIdx = numSub;
      // Montante Central (Péndulo de cumbrera)
      newSegs[`s_mon_center_${f}`] = { id: `s_mon_center_${f}`, nodeAId: bottomNodes[midBotIdx], nodeBId: c3, profileId: vigaProf, rolEstructural: 'montante' };

      // Celosía interna: Montantes
      for (let i = 1; i < numSub; i++) {
        const monL = `s_mon_l_${f}_${i}`;
        newSegs[monL] = { id: monL, nodeAId: bottomNodes[i], nodeBId: leftTopNodes[i], profileId: vigaProf, rolEstructural: 'montante' };

        const monR = `s_mon_r_${f}_${i}`;
        newSegs[monR] = { id: monR, nodeAId: bottomNodes[numSub + i], nodeBId: rightTopNodes[i], profileId: vigaProf, rolEstructural: 'montante' };
      }

      // Celosía interna: Diagonales completas
      // Si es tipo Vierendeel, solo añadimos diagonales si el arriostramiento perimetral está activo
      const isPerimeter = f === 0 || f === numFrames - 1;
      const useDiagonals = tipoTijeral !== 'escalera_vierendeel' || (isPerimeter && perimetralBracingEnabled);
      const effectiveTipoTijeral = (isPerimeter && perimetralBracingEnabled && tipoTijeralPerimetral) ? tipoTijeralPerimetral : tipoTijeral;

      if (useDiagonals) {
        for (let i = 1; i <= numSub; i++) {
          const idDiagL = `s_diag_l_${f}_${i}`;
          const idDiagR = `s_diag_r_${f}_${i}`;

          if (effectiveTipoTijeral === 'howe') {
            // Howe: diagonales hacia los apoyos
            newSegs[idDiagL] = { id: idDiagL, nodeAId: bottomNodes[i], nodeBId: leftTopNodes[i - 1], profileId: vigaProf, rolEstructural: 'diagonal' };
            newSegs[idDiagR] = { id: idDiagR, nodeAId: bottomNodes[numSub + i - 1], nodeBId: rightTopNodes[i], profileId: vigaProf, rolEstructural: 'diagonal' };
          } else if (effectiveTipoTijeral === 'warren') {
            // Warren: zig-zag continuo
            newSegs[idDiagL] = { id: idDiagL, nodeAId: i % 2 === 1 ? bottomNodes[i - 1] : bottomNodes[i], nodeBId: i % 2 === 1 ? leftTopNodes[i] : leftTopNodes[i - 1], profileId: vigaProf, rolEstructural: 'diagonal' };
            newSegs[idDiagR] = { id: idDiagR, nodeAId: i % 2 === 1 ? bottomNodes[numSub + i - 1] : bottomNodes[numSub + i], nodeBId: i % 2 === 1 ? rightTopNodes[i] : rightTopNodes[i - 1], profileId: vigaProf, rolEstructural: 'diagonal' };
          } else {
            // Fink / Pratt por defecto: diagonales hacia la cumbrera
            newSegs[idDiagL] = { id: idDiagL, nodeAId: bottomNodes[i - 1], nodeBId: leftTopNodes[i], profileId: vigaProf, rolEstructural: 'diagonal' };
            newSegs[idDiagR] = { id: idDiagR, nodeAId: bottomNodes[numSub + i], nodeBId: rightTopNodes[i - 1], profileId: vigaProf, rolEstructural: 'diagonal' };
          }
        }
      }

      // Correas longitudinales completas y tubos de tejido entre pórticos
      if (f > 0 && prevLeftTopNodes.length > 0) {
        // Correas en toda la caída izquierda (sin dejar huecos para que el aluzinc descanse firme)
        for (let i = 0; i < leftTopNodes.length; i++) {
          const sCorreaL = `s_correa_l_${f}_${i}`;
          newSegs[sCorreaL] = { id: sCorreaL, nodeAId: prevLeftTopNodes[i], nodeBId: leftTopNodes[i], profileId: correaProf, rolEstructural: 'correa' };
        }

        // Correas en toda la caída derecha (evitando duplicar la cumbrera que ya está en leftTopNodes[last])
        for (let i = 1; i < rightTopNodes.length; i++) {
          const sCorreaR = `s_correa_r_${f}_${i}`;
          newSegs[sCorreaR] = { id: sCorreaR, nodeAId: prevRightTopNodes[i], nodeBId: rightTopNodes[i], profileId: correaProf, rolEstructural: 'correa' };
        }

        // Vigas de amarre longitudinal en cordón inferior
        if (hasLongitudinal || f > 0) {
          for (let i = 0; i < bottomNodes.length; i += 2) {
            const sTieId = `s_tie_bot_${f}_${i}`;
            newSegs[sTieId] = { id: sTieId, nodeAId: prevBottomNodes[i], nodeBId: bottomNodes[i], profileId: correaProf, rolEstructural: 'arriostre' };
          }
        }

        // TIJERALES LONGITUDINALES (Vigas celosía Warren o Pratt en aleros y cumbrera)
        if (hasLongitudinal) {
          // 1. Tijeral longitudinal en alero izquierdo (X=0)
          if (prevLeftTopNodes[0] && leftTopNodes[0] && prevBottomNodes[0] && bottomNodes[0]) {
            const sLv1 = `s_long_truss_v_l_${f}`;
            newSegs[sLv1] = { id: sLv1, nodeAId: bottomNodes[0], nodeBId: leftTopNodes[0], profileId: vigaProf, rolEstructural: 'montante' };
            if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
              const sLd1 = `s_long_truss_d_l_${f}`;
              const nA = tipoTijeral === 'warren' 
                ? (f % 2 === 1 ? prevBottomNodes[0] : prevLeftTopNodes[0]) 
                : (f <= numFrames / 2 ? prevBottomNodes[0] : bottomNodes[0]);
              const nB = tipoTijeral === 'warren'
                ? (f % 2 === 1 ? leftTopNodes[0] : bottomNodes[0])
                : (f <= numFrames / 2 ? leftTopNodes[0] : prevLeftTopNodes[0]);
              newSegs[sLd1] = { id: sLd1, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
            }
          }

          // 2. Tijeral longitudinal en cumbrera central (X=Luz/2)
          const ridgeTopPrev = prevLeftTopNodes[prevLeftTopNodes.length - 1];
          const ridgeTopCurr = leftTopNodes[leftTopNodes.length - 1];
          const midBotIdxPrev = Math.floor(prevBottomNodes.length / 2);
          const midBotIdxCurr = Math.floor(bottomNodes.length / 2);
          const midBotPrev = prevBottomNodes[midBotIdxPrev];
          const midBotCurr = bottomNodes[midBotIdxCurr];
          if (ridgeTopPrev && ridgeTopCurr && midBotPrev && midBotCurr) {
            const sLv2 = `s_long_truss_v_c_${f}`;
            newSegs[sLv2] = { id: sLv2, nodeAId: midBotCurr, nodeBId: ridgeTopCurr, profileId: vigaProf, rolEstructural: 'montante' };
            if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
              const sLd2 = `s_long_truss_d_c_${f}`;
              const nA = tipoTijeral === 'warren' 
                ? (f % 2 === 1 ? midBotPrev : ridgeTopPrev) 
                : (f <= numFrames / 2 ? midBotPrev : midBotCurr);
              const nB = tipoTijeral === 'warren'
                ? (f % 2 === 1 ? ridgeTopCurr : midBotCurr)
                : (f <= numFrames / 2 ? ridgeTopCurr : ridgeTopPrev);
              newSegs[sLd2] = { id: sLd2, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
            }
          }

          // 3. Tijeral longitudinal en alero derecho (X=Luz)
          const rTopPrev = prevRightTopNodes[prevRightTopNodes.length - 1];
          const rTopCurr = rightTopNodes[rightTopNodes.length - 1];
          const rBotPrev = prevBottomNodes[prevBottomNodes.length - 1];
          const rBotCurr = bottomNodes[bottomNodes.length - 1];
          if (rTopPrev && rTopCurr && rBotPrev && rBotCurr) {
            const sLv3 = `s_long_truss_v_r_${f}`;
            newSegs[sLv3] = { id: sLv3, nodeAId: rBotCurr, nodeBId: rTopCurr, profileId: vigaProf, rolEstructural: 'montante' };
            if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
              const sLd3 = `s_long_truss_d_r_${f}`;
              const nA = tipoTijeral === 'warren' 
                ? (f % 2 === 1 ? rBotPrev : rTopPrev) 
                : (f <= numFrames / 2 ? rBotPrev : rBotCurr);
              const nB = tipoTijeral === 'warren'
                ? (f % 2 === 1 ? rTopCurr : rBotCurr)
                : (f <= numFrames / 2 ? rTopCurr : rTopPrev);
              newSegs[sLd3] = { id: sLd3, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
            }
          }
        }

        // Tubos de tejido de arriostramiento en cruz (San Andrés) para soporte lateral y antivuelco
        if (f === 1 || f === numFrames - 1 || f % 3 === 0) {
          for (let i = 0; i < leftTopNodes.length - 1; i += 2) {
            const idX1 = `s_tejido_x1_l_${f}_${i}`;
            const idX2 = `s_tejido_x2_l_${f}_${i}`;
            newSegs[idX1] = { id: idX1, nodeAId: prevLeftTopNodes[i], nodeBId: leftTopNodes[i + 1], profileId: correaProf, rolEstructural: 'arriostre' };
            newSegs[idX2] = { id: idX2, nodeAId: prevLeftTopNodes[i + 1], nodeBId: leftTopNodes[i], profileId: correaProf, rolEstructural: 'arriostre' };
          }
          for (let i = 0; i < rightTopNodes.length - 1; i += 2) {
            const idX1 = `s_tejido_x1_r_${f}_${i}`;
            const idX2 = `s_tejido_x2_r_${f}_${i}`;
            newSegs[idX1] = { id: idX1, nodeAId: prevRightTopNodes[i], nodeBId: rightTopNodes[i + 1], profileId: correaProf, rolEstructural: 'arriostre' };
            newSegs[idX2] = { id: idX2, nodeAId: prevRightTopNodes[i + 1], nodeBId: rightTopNodes[i], profileId: correaProf, rolEstructural: 'arriostre' };
          }
        }
      }

      // Tímpano perimetral de fachada en pórticos frontales y posteriores
      if (hasPerimetral && (f === 0 || f === numFrames - 1)) {
        for (let i = 1; i < bottomNodes.length - 1; i += 2) {
          const bNode = newNodes[bottomNodes[i]];
          if (bNode) {
            const baseNodeId = `n_perim_gable_base_${f}_${i}`;
            newNodes[baseNodeId] = { id: baseNodeId, x: bNode.x, y: 0, z: bNode.z, isFixedSupport: true, nodeLabel: `TIMPANO-COL-BASE-${f+1}-${i}` };
            const segId = `s_perim_gable_col_${f}_${i}`;
            newSegs[segId] = { id: segId, nodeAId: baseNodeId, nodeBId: bottomNodes[i], profileId: colProf, rolEstructural: 'columna' };
          }
        }
      }

      prevLeftTopNodes = [...leftTopNodes];
      prevRightTopNodes = [...rightTopNodes];
      prevBottomNodes = [...bottomNodes];
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo Un Agua 3D con Tijeral Paramétrico (Warren, Pratt, Howe, Fink)
  const generateRoofMonoslope = useCallback((
    luzM: number, 
    largoM: number = 18, 
    alturaCol1M: number = 3.5, 
    alturaCol2M: number = 5.0,
    tipoTijeral: TipoTijeral = 'pratt',
    numTijerales?: number,
    peralteTijeralM: number = 0.60,
    orientacionTijeral: OrientacionTijeral = 'vertical',
    posicionesTijeralesCustom?: number[],
    customSpacingM?: number,
    _perimetralBracingEnabled?: boolean,
    _tipoTijeralPerimetral?: TipoTijeral
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasLongitudinal = orientacionTijeral === 'horizontal' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'completo';
    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    let framePositions: number[] = [];
    if (posicionesTijeralesCustom && posicionesTijeralesCustom.length >= 2) {
      framePositions = [...posicionesTijeralesCustom].sort((a, b) => a - b);
    } else {
      const framesCount = numTijerales && numTijerales >= 2 ? numTijerales : Math.max(2, Math.round(largoM / 5.0) + 1);
      const dz = framesCount > 1 ? largoM / (framesCount - 1) : 0;
      for (let f = 0; f < framesCount; f++) {
        framePositions.push(f * dz);
      }
    }
    const numFrames = framePositions.length;
    // Usar espaciado personalizado si está definido
    const numSub = customSpacingM && customSpacingM > 0.1 
        ? Math.max(3, Math.round(luzM / customSpacingM)) 
        : Math.max(3, Math.min(10, Math.round(luzM / 2.0))); // Paneles del tijeral
    
    // El arriostramiento perimetral podría afectar futuras optimizaciones

    let prevTopNodes: string[] = [];
    let prevBotNodes: string[] = [];

    for (let f = 0; f < numFrames; f++) {
      const z = framePositions[f];
      const c1 = `n_col1_b_${f}`;
      const c2 = `n_col1_t_${f}`;
      const c3 = `n_col2_t_${f}`;
      const c4 = `n_col2_b_${f}`;

      newNodes[c1] = { id: c1, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `COL-BAJA-BASE-${f+1}` };
      newNodes[c2] = { id: c2, x: 0, y: alturaCol1M, z, nodeLabel: `COL-BAJA-TOP-${f+1}` };
      newNodes[c3] = { id: c3, x: luzM, y: alturaCol2M, z, nodeLabel: `COL-ALTA-TOP-${f+1}` };
      newNodes[c4] = { id: c4, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `COL-ALTA-BASE-${f+1}` };

      // Columnas
      newSegs[`s_col1_${f}`] = { id: `s_col1_${f}`, nodeAId: c1, nodeBId: c2, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_col2_${f}`] = { id: `s_col2_${f}`, nodeAId: c4, nodeBId: c3, profileId: colProf, rolEstructural: 'columna' };

      // Puntos del cordón superior (inclinado) y cordón inferior (horizontal o paralelo)
      const topNodes: string[] = [c2];
      const botNodes: string[] = [c2];

      const slope = (alturaCol2M - alturaCol1M) / luzM;

      for (let i = 1; i < numSub; i++) {
        const xVal = (luzM / numSub) * i;
        const yTop = alturaCol1M + slope * xVal;
        const yBot = alturaCol1M + Math.max(0, slope * xVal - peralteTijeralM); // Cordón inferior

        const tId = `n_top_mono_${f}_${i}`;
        const bId = `n_bot_mono_${f}_${i}`;

        newNodes[tId] = { id: tId, x: xVal, y: yTop, z, nodeLabel: `CS-MONO-${f+1}-${i}` };
        newNodes[bId] = { id: bId, x: xVal, y: yBot, z, nodeLabel: `CI-MONO-${f+1}-${i}` };

        topNodes.push(tId);
        botNodes.push(bId);
      }
      topNodes.push(c3);
      botNodes.push(c3);

      // Conectar Cordón Superior
      for (let i = 0; i < topNodes.length - 1; i++) {
        const sTopId = `s_top_mono_${f}_${i}`;
        newSegs[sTopId] = { id: sTopId, nodeAId: topNodes[i], nodeBId: topNodes[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
      }

      // Conectar Cordón Inferior
      for (let i = 0; i < botNodes.length - 1; i++) {
        const sBotId = `s_bot_mono_${f}_${i}`;
        newSegs[sBotId] = { id: sBotId, nodeAId: botNodes[i], nodeBId: botNodes[i + 1], profileId: vigaProf, rolEstructural: 'cordon_inferior' };
      }

      // Montantes y Diagonales según tipología
      for (let i = 1; i < numSub; i++) {
        // Montantes
        const sMonId = `s_mon_mono_${f}_${i}`;
        newSegs[sMonId] = { id: sMonId, nodeAId: botNodes[i], nodeBId: topNodes[i], profileId: vigaProf, rolEstructural: 'montante' };

        // Diagonales (en escalera_vierendeel se omiten para dejar vanos tipo escalera)
        if (tipoTijeral !== 'escalera_vierendeel') {
          if (tipoTijeral === 'howe') {
            // Howe: diagonales hacia el lado bajo (compresión)
            const sDiagId = `s_diag_mono_${f}_${i}`;
            newSegs[sDiagId] = { id: sDiagId, nodeAId: topNodes[i], nodeBId: botNodes[i - 1], profileId: vigaProf, rolEstructural: 'diagonal' };
          } else if (tipoTijeral === 'warren') {
            // Warren: zig-zag alternado
            const sDiagId = `s_diag_mono_${f}_${i}`;
            newSegs[sDiagId] = { id: sDiagId, nodeAId: i % 2 === 1 ? botNodes[i - 1] : botNodes[i], nodeBId: i % 2 === 1 ? topNodes[i] : topNodes[i - 1], profileId: vigaProf, rolEstructural: 'diagonal' };
          } else {
            // Pratt / Fink: diagonales hacia el lado alto (tracción)
            const sDiagId = `s_diag_mono_${f}_${i}`;
            newSegs[sDiagId] = { id: sDiagId, nodeAId: botNodes[i - 1], nodeBId: topNodes[i], profileId: vigaProf, rolEstructural: 'diagonal' };
          }
        }
      }

      // Correas longitudinales y tubos de tejido entre pórticos
      if (f > 0 && prevTopNodes.length > 0) {
        for (let i = 0; i < topNodes.length; i++) {
          const prevTopNode = prevTopNodes[i];
          const currTopNode = topNodes[i];
          const sCorreaId = `s_correa_mono_${f}_${i}`;
          newSegs[sCorreaId] = { id: sCorreaId, nodeAId: prevTopNode, nodeBId: currTopNode, profileId: correaProf, rolEstructural: 'correa' };
        }

        // Vigas de amarre longitudinal en cordón inferior
        for (let i = 0; i < botNodes.length; i += 2) {
          const sTieId = `s_tie_mono_bot_${f}_${i}`;
          newSegs[sTieId] = { id: sTieId, nodeAId: prevBotNodes[i], nodeBId: botNodes[i], profileId: correaProf, rolEstructural: 'arriostre' };
        }

        // Tubos de tejido de arriostramiento en cruz (San Andrés) para soporte lateral y antivuelco
        if (f === 1 || f === numFrames - 1 || f % 3 === 0) {
          for (let i = 0; i < topNodes.length - 1; i += 2) {
            const idX1 = `s_tejido_mono_x1_${f}_${i}`;
            const idX2 = `s_tejido_mono_x2_${f}_${i}`;
            newSegs[idX1] = { id: idX1, nodeAId: prevTopNodes[i], nodeBId: topNodes[i + 1], profileId: correaProf, rolEstructural: 'arriostre' };
            newSegs[idX2] = { id: idX2, nodeAId: prevTopNodes[i + 1], nodeBId: topNodes[i], profileId: correaProf, rolEstructural: 'arriostre' };
          }
        }

        // Si la orientación es Longitudinal o Completa, añadir arriostres y vigas longitudinales en el cordón inferior.
        // (Acepta tanto los valores nuevos 'longitudinal'/'completo' como los legados 'horizontal'/'ambos'.)
        if (orientacionTijeral === 'horizontal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'completo') {
          for (let i = 0; i < botNodes.length; i++) {
            const prevBotNode = prevBotNodes[i];
            const currBotNode = botNodes[i];
            const sHorizId = `s_horiz_mono_${f}_${i}`;
            newSegs[sHorizId] = { id: sHorizId, nodeAId: prevBotNode, nodeBId: currBotNode, profileId: vigaProf, rolEstructural: 'cordon_inferior' };
          }
        }

        // TIJERALES LONGITUDINALES (Vigas celosía Warren o Pratt en borde bajo y alto)
        if (hasLongitudinal) {
          // Celosía longitudinal en borde bajo (X=0)
          if (prevBotNodes[0] && botNodes[0] && prevTopNodes[0] && topNodes[0]) {
            const sMonoLv1 = `s_long_mono_v_0_${f}`;
            newSegs[sMonoLv1] = { id: sMonoLv1, nodeAId: botNodes[0], nodeBId: topNodes[0], profileId: vigaProf, rolEstructural: 'montante' };
            if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
              const sMonoLd1 = `s_long_mono_d_0_${f}`;
              const nA = tipoTijeral === 'warren' 
                ? (f % 2 === 1 ? prevBotNodes[0] : prevTopNodes[0]) 
                : (f <= numFrames / 2 ? prevBotNodes[0] : botNodes[0]);
              const nB = tipoTijeral === 'warren'
                ? (f % 2 === 1 ? topNodes[0] : botNodes[0])
                : (f <= numFrames / 2 ? topNodes[0] : prevTopNodes[0]);
              newSegs[sMonoLd1] = { id: sMonoLd1, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
            }
          }
          // Celosía longitudinal en borde alto (X=Luz)
          const lastIdx = topNodes.length - 1;
          const lastBotIdx = botNodes.length - 1;
          if (prevBotNodes[lastBotIdx] && botNodes[lastBotIdx] && prevTopNodes[lastIdx] && topNodes[lastIdx]) {
            const sMonoLv2 = `s_long_mono_v_end_${f}`;
            newSegs[sMonoLv2] = { id: sMonoLv2, nodeAId: botNodes[lastBotIdx], nodeBId: topNodes[lastIdx], profileId: vigaProf, rolEstructural: 'montante' };
            if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
              const sMonoLd2 = `s_long_mono_d_end_${f}`;
              const nA = tipoTijeral === 'warren' 
                ? (f % 2 === 1 ? prevBotNodes[lastBotIdx] : prevTopNodes[lastIdx]) 
                : (f <= numFrames / 2 ? prevBotNodes[lastBotIdx] : botNodes[lastBotIdx]);
              const nB = tipoTijeral === 'warren'
                ? (f % 2 === 1 ? topNodes[lastIdx] : botNodes[lastBotIdx])
                : (f <= numFrames / 2 ? topNodes[lastIdx] : prevTopNodes[lastIdx]);
              newSegs[sMonoLd2] = { id: sMonoLd2, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
            }
          }
        }
      }

      // Tímpano perimetral en testeros frontal y posterior
      if (hasPerimetral && (f === 0 || f === numFrames - 1)) {
        for (let i = 1; i < botNodes.length - 1; i += 2) {
          const bNode = newNodes[botNodes[i]];
          if (bNode) {
            const baseNodeId = `n_perim_mono_base_${f}_${i}`;
            newNodes[baseNodeId] = { id: baseNodeId, x: bNode.x, y: 0, z: bNode.z, isFixedSupport: true, nodeLabel: `TIMPANO-MONO-BASE-${f+1}-${i}` };
            const segId = `s_perim_mono_col_${f}_${i}`;
            newSegs[segId] = { id: segId, nodeAId: baseNodeId, nodeBId: botNodes[i], profileId: colProf, rolEstructural: 'columna' };
          }
        }
      }

      prevTopNodes = [...topNodes];
      prevBotNodes = [...botNodes];
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo Parabólico / Curvo 3D con Tijeral Warren, Pratt, Bowstring o Simple Arco
  const generateRoofParabolic = useCallback((
    luzM: number, 
    largoM: number = 25, 
    alturaColM: number = 4.5, 
    flechaM: number = 2.5,
    tipoTijeral: TipoTijeral = 'parabolico_warren',
    peralteArcoM: number = 0.80,
    orientacionTijeral: OrientacionTijeral = 'vertical',
    numTijerales?: number,
    posicionesTijeralesCustom?: number[],
    _customSpacingM?: number,
    _perimetralBracingEnabled?: boolean,
    _tipoTijeralPerimetral?: TipoTijeral
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasLongitudinal = orientacionTijeral === 'horizontal' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'completo';
    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    let framePositions: number[] = [];
    if (posicionesTijeralesCustom && posicionesTijeralesCustom.length >= 2) {
      framePositions = [...posicionesTijeralesCustom].sort((a, b) => a - b);
    } else {
      const framesCount = numTijerales && numTijerales >= 2 ? numTijerales : Math.max(2, Math.round(largoM / 5.0) + 1);
      const dz = framesCount > 1 ? largoM / (framesCount - 1) : 0;
      for (let f = 0; f < framesCount; f++) {
        framePositions.push(f * dz);
      }
    }
    const numFrames = framePositions.length;

    // Subdivisión del arco proporcional a la luz para espaciamiento óptimo de correas (1.2m a 1.6m)
    const numPuntos = luzM <= 12 ? 8 : (luzM <= 18 ? 10 : (luzM <= 26 ? 12 : 14));
    const hp = Math.max(0.45, Math.min(1.20, peralteArcoM || Number((luzM / 18).toFixed(2))));

    let prevTopArcNodeIds: string[] = [];
    let prevBotArcNodeIds: string[] = [];

    for (let f = 0; f < numFrames; f++) {
      const z = framePositions[f];
      const c1 = `n_col1_b_${f}`;
      const c2 = `n_col1_t_${f}`;
      const c3 = `n_col2_t_${f}`;
      const c4 = `n_col2_b_${f}`;

      newNodes[c1] = { id: c1, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `COL-IZQ-BASE-${f+1}` };
      newNodes[c2] = { id: c2, x: 0, y: alturaColM, z, nodeLabel: `COL-IZQ-TOP-${f+1}` };
      newNodes[c3] = { id: c3, x: luzM, y: alturaColM, z, nodeLabel: `COL-DER-TOP-${f+1}` };
      newNodes[c4] = { id: c4, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `COL-DER-BASE-${f+1}` };

      // Columnas Portantes
      newSegs[`s_col1_${f}`] = { id: `s_col1_${f}`, nodeAId: c1, nodeBId: c2, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_col2_${f}`] = { id: `s_col2_${f}`, nodeAId: c4, nodeBId: c3, profileId: colProf, rolEstructural: 'columna' };

      const topArcNodeIds: string[] = [];
      const botArcNodeIds: string[] = [];

      const isBowstring = tipoTijeral === 'parabolico_bowstring' || tipoTijeral === 'howe';
      const isSimpleArco = tipoTijeral === 'simple_arco';

      // 1. GENERAR NODOS DEL ARCO SUPERIOR E INFERIOR
      for (let i = 0; i <= numPuntos; i++) {
        const xNorm = i / numPuntos;
        const x = xNorm * luzM;
        const yParab = 4 * flechaM * xNorm * (1 - xNorm);

        // Cordón Superior (CS)
        const tId = `n_arc_t_${f}_${i}`;
        let yTop = alturaColM + yParab;
        if (!isBowstring && !isSimpleArco) {
          yTop = alturaColM + hp + yParab;
        }

        const actualTId = (isSimpleArco && i === 0) ? c2 : ((isSimpleArco && i === numPuntos) ? c3 : tId);
        if (actualTId !== c2 && actualTId !== c3) {
          newNodes[actualTId] = { id: actualTId, x, y: yTop, z, nodeLabel: `CS-ARC-${f+1}-${i}` };
        }
        topArcNodeIds.push(actualTId);

        // Cordón Inferior (CI)
        if (!isSimpleArco) {
          const bId = `n_arc_b_${f}_${i}`;
          const yBot = isBowstring
            ? alturaColM
            : (i === 0 || i === numPuntos ? alturaColM : alturaColM + yParab);

          const actualBId = (i === 0) ? c2 : (i === numPuntos ? c3 : bId);
          if (actualBId !== c2 && actualBId !== c3) {
            newNodes[actualBId] = { id: actualBId, x, y: yBot, z, nodeLabel: `CI-ARC-${f+1}-${i}` };
          }
          botArcNodeIds.push(actualBId);
        }
      }

      // 2. CONECTAR CORDÓN SUPERIOR (ARCO EXTERNO)
      for (let i = 0; i < topArcNodeIds.length - 1; i++) {
        const sId = `s_arc_top_${f}_${i}`;
        newSegs[sId] = { id: sId, nodeAId: topArcNodeIds[i], nodeBId: topArcNodeIds[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };

        // Correas longitudinales entre pórticos
        if (f > 0 && prevTopArcNodeIds.length > 0) {
          const prevArcNodeId = prevTopArcNodeIds[i];
          const sCorreaId = `s_correa_arc_${f}_${i}`;
          newSegs[sCorreaId] = { id: sCorreaId, nodeAId: prevArcNodeId, nodeBId: topArcNodeIds[i], profileId: correaProf, rolEstructural: 'correa' };
        }
      }
      // Correa en el último nodo del arco superior
      if (f > 0 && prevTopArcNodeIds.length > 0) {
        const lastIdx = topArcNodeIds.length - 1;
        const prevArcNodeId = prevTopArcNodeIds[lastIdx];
        const sCorreaId = `s_correa_arc_${f}_${lastIdx}`;
        newSegs[sCorreaId] = { id: sCorreaId, nodeAId: prevArcNodeId, nodeBId: topArcNodeIds[lastIdx], profileId: correaProf, rolEstructural: 'correa' };
      }

      // Tubos de tejido de arriostramiento en cruz (San Andrés) sobre la superficie curva
      if (f > 0 && prevTopArcNodeIds.length > 0 && (f === 1 || f === numFrames - 1 || f % 3 === 0)) {
        for (let i = 0; i < topArcNodeIds.length - 1; i += 2) {
          const idX1 = `s_tejido_arc_x1_${f}_${i}`;
          const idX2 = `s_tejido_arc_x2_${f}_${i}`;
          newSegs[idX1] = { id: idX1, nodeAId: prevTopArcNodeIds[i], nodeBId: topArcNodeIds[i + 1], profileId: correaProf, rolEstructural: 'arriostre' };
          newSegs[idX2] = { id: idX2, nodeAId: prevTopArcNodeIds[i + 1], nodeBId: topArcNodeIds[i], profileId: correaProf, rolEstructural: 'arriostre' };
        }
      }

      // 3. CONECTAR CORDÓN INFERIOR, MONTANTES Y DIAGONALES
      if (!isSimpleArco && botArcNodeIds.length > 2) {
        // Conectar segmentos del cordón inferior
        for (let i = 0; i < botArcNodeIds.length - 1; i++) {
          const sId = `s_arc_bot_${f}_${i}`;
          newSegs[sId] = { id: sId, nodeAId: botArcNodeIds[i], nodeBId: botArcNodeIds[i + 1], profileId: vigaProf, rolEstructural: 'cordon_inferior' };
        }

        // Montantes en los extremos de apoyo sobre columnas (en arco concéntrico de peralte hp)
        if (!isBowstring) {
          const sMonLeft = `s_arc_mon_apoyo_l_${f}`;
          newSegs[sMonLeft] = { id: sMonLeft, nodeAId: botArcNodeIds[0], nodeBId: topArcNodeIds[0], profileId: vigaProf, rolEstructural: 'montante' };

          const sMonRight = `s_arc_mon_apoyo_r_${f}`;
          newSegs[sMonRight] = { id: sMonRight, nodeAId: botArcNodeIds[botArcNodeIds.length - 1], nodeBId: topArcNodeIds[topArcNodeIds.length - 1], profileId: vigaProf, rolEstructural: 'montante' };
        }

        // Montantes radiales / verticales intermedios (Pratt, Bowstring o Escalera Vierendeel)
        if (tipoTijeral === 'parabolico_pratt' || tipoTijeral === 'pratt' || tipoTijeral === 'escalera_vierendeel' || isBowstring) {
          for (let i = 1; i < numPuntos; i++) {
            const sMonId = `s_arc_mon_${f}_${i}`;
            newSegs[sMonId] = { id: sMonId, nodeAId: botArcNodeIds[i], nodeBId: topArcNodeIds[i], profileId: vigaProf, rolEstructural: 'montante' };
          }
        }

        // Diagonales trianguladas (en escalera_vierendeel se omiten para dejar vanos tipo escalera)
        if (tipoTijeral !== 'escalera_vierendeel') {
          for (let p = 0; p < numPuntos; p++) {
            const sDiagId = `s_arc_diag_${f}_${p}`;
            if (tipoTijeral === 'parabolico_pratt' || tipoTijeral === 'pratt' || isBowstring) {
              const fromId = p < numPuntos / 2 ? botArcNodeIds[p] : botArcNodeIds[p + 1];
              const toId = p < numPuntos / 2 ? topArcNodeIds[p + 1] : topArcNodeIds[p];
              newSegs[sDiagId] = { id: sDiagId, nodeAId: fromId, nodeBId: toId, profileId: vigaProf, rolEstructural: 'diagonal' };
            } else {
              const fromId = p % 2 === 0 ? botArcNodeIds[p] : topArcNodeIds[p];
              const toId = p % 2 === 0 ? topArcNodeIds[p + 1] : botArcNodeIds[p + 1];
              newSegs[sDiagId] = { id: sDiagId, nodeAId: fromId, nodeBId: toId, profileId: vigaProf, rolEstructural: 'diagonal' };
            }
          }
        }
      }

      // Si la orientación es Longitudinal o Completa, añadir correas longitudinales de refuerzo horizontal en arco inferior.
      // (Acepta tanto los valores nuevos 'longitudinal'/'completo' como los legados 'horizontal'/'ambos'.)
      if ((orientacionTijeral === 'horizontal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'completo') && f > 0 && prevBotArcNodeIds.length > 0) {
        for (let i = 0; i < numPuntos + 1; i++) {
          const prevBotNodeId = prevBotArcNodeIds[i];
          const currBotNodeId = botArcNodeIds[i];
          if (currBotNodeId && prevBotNodeId) {
            const sHorizId = `s_horiz_arc_${f}_${i}`;
            newSegs[sHorizId] = { id: sHorizId, nodeAId: prevBotNodeId, nodeBId: currBotNodeId, profileId: vigaProf, rolEstructural: 'cordon_inferior' };
          }
        }
      }

      // TIJERALES LONGITUDINALES (Vigas celosía Warren o Pratt en arranques y cumbrera del arco)
      if (hasLongitudinal && f > 0 && prevTopArcNodeIds.length > 0 && prevBotArcNodeIds.length > 0) {
        // 1. Celosía longitudinal en arranque izquierdo (i=0)
        if (prevBotArcNodeIds[0] && botArcNodeIds[0] && prevTopArcNodeIds[0] && topArcNodeIds[0]) {
          const sParaLv1 = `s_long_para_v_l_${f}`;
          newSegs[sParaLv1] = { id: sParaLv1, nodeAId: botArcNodeIds[0], nodeBId: topArcNodeIds[0], profileId: vigaProf, rolEstructural: 'montante' };
          if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
            const sParaLd1 = `s_long_para_d_l_${f}`;
            const nA = (tipoTijeral === 'parabolico_warren' || tipoTijeral === 'warren')
              ? (f % 2 === 1 ? prevBotArcNodeIds[0] : prevTopArcNodeIds[0])
              : (f <= numFrames / 2 ? prevBotArcNodeIds[0] : botArcNodeIds[0]);
            const nB = (tipoTijeral === 'parabolico_warren' || tipoTijeral === 'warren')
              ? (f % 2 === 1 ? topArcNodeIds[0] : botArcNodeIds[0])
              : (f <= numFrames / 2 ? topArcNodeIds[0] : prevTopArcNodeIds[0]);
            newSegs[sParaLd1] = { id: sParaLd1, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
          }
        }
        // 2. Celosía longitudinal en cumbrera central
        const midIdx = Math.floor(numPuntos / 2);
        if (prevBotArcNodeIds[midIdx] && botArcNodeIds[midIdx] && prevTopArcNodeIds[midIdx] && topArcNodeIds[midIdx]) {
          const sParaLv2 = `s_long_para_v_c_${f}`;
          newSegs[sParaLv2] = { id: sParaLv2, nodeAId: botArcNodeIds[midIdx], nodeBId: topArcNodeIds[midIdx], profileId: vigaProf, rolEstructural: 'montante' };
          if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
            const sParaLd2 = `s_long_para_d_c_${f}`;
            const nA = (tipoTijeral === 'parabolico_warren' || tipoTijeral === 'warren')
              ? (f % 2 === 1 ? prevBotArcNodeIds[midIdx] : prevTopArcNodeIds[midIdx])
              : (f <= numFrames / 2 ? prevBotArcNodeIds[midIdx] : botArcNodeIds[midIdx]);
            const nB = (tipoTijeral === 'parabolico_warren' || tipoTijeral === 'warren')
              ? (f % 2 === 1 ? topArcNodeIds[midIdx] : botArcNodeIds[midIdx])
              : (f <= numFrames / 2 ? topArcNodeIds[midIdx] : prevTopArcNodeIds[midIdx]);
            newSegs[sParaLd2] = { id: sParaLd2, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
          }
        }
        // 3. Celosía longitudinal en arranque derecho (i=numPuntos)
        const endIdx = numPuntos;
        if (prevBotArcNodeIds[endIdx] && botArcNodeIds[endIdx] && prevTopArcNodeIds[endIdx] && topArcNodeIds[endIdx]) {
          const sParaLv3 = `s_long_para_v_r_${f}`;
          newSegs[sParaLv3] = { id: sParaLv3, nodeAId: botArcNodeIds[endIdx], nodeBId: topArcNodeIds[endIdx], profileId: vigaProf, rolEstructural: 'montante' };
          if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
            const sParaLd3 = `s_long_para_d_r_${f}`;
            const nA = (tipoTijeral === 'parabolico_warren' || tipoTijeral === 'warren')
              ? (f % 2 === 1 ? prevBotArcNodeIds[endIdx] : prevTopArcNodeIds[endIdx])
              : (f <= numFrames / 2 ? prevBotArcNodeIds[endIdx] : botArcNodeIds[endIdx]);
            const nB = (tipoTijeral === 'parabolico_warren' || tipoTijeral === 'warren')
              ? (f % 2 === 1 ? topArcNodeIds[endIdx] : botArcNodeIds[endIdx])
              : (f <= numFrames / 2 ? topArcNodeIds[endIdx] : prevTopArcNodeIds[endIdx]);
            newSegs[sParaLd3] = { id: sParaLd3, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
          }
        }
      }

      // Tímpano perimetral en testeros frontal y posterior
      if (hasPerimetral && (f === 0 || f === numFrames - 1) && botArcNodeIds.length > 2) {
        for (let i = 2; i < botArcNodeIds.length - 1; i += 2) {
          const bNode = newNodes[botArcNodeIds[i]];
          if (bNode) {
            const baseNodeId = `n_perim_para_base_${f}_${i}`;
            newNodes[baseNodeId] = { id: baseNodeId, x: bNode.x, y: 0, z: bNode.z, isFixedSupport: true, nodeLabel: `TIMPANO-PARA-BASE-${f+1}-${i}` };
            const segId = `s_perim_para_col_${f}_${i}`;
            newSegs[segId] = { id: segId, nodeAId: baseNodeId, nodeBId: botArcNodeIds[i], profileId: colProf, rolEstructural: 'columna' };
          }
        }
      }

      prevTopArcNodeIds = [...topArcNodeIds];
      prevBotArcNodeIds = [...botArcNodeIds];
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Insertar Tijeral por Dentro en Posición Z arbitraria (para cualquier diseño de techo)
  const addInternalTruss = useCallback((
    zPos: number,
    tipoTijeralParam?: TipoTijeral,
    peralteMParam?: number
  ) => {
    const existingNodeList = Object.values(nodes);
    let minX = 0;
    let maxX = 12;
    let baseH = 4.5;
    let peakH = 6.0;
    let isParabolic = false;

    if (existingNodeList.length > 0) {
      const xs = existingNodeList.map(n => n.x);
      minX = Math.min(...xs);
      maxX = Math.max(...xs);
      const cols = existingNodeList.filter(n => n.nodeLabel?.includes('COL') && n.y > 0);
      if (cols.length > 0) {
        baseH = Math.min(...cols.map(n => n.y));
      }
      const topNodes = existingNodeList.filter(n => n.y >= baseH);
      if (topNodes.length > 0) {
        peakH = Math.max(...topNodes.map(n => n.y));
      }
      isParabolic = existingNodeList.some(n => n.nodeLabel?.includes('ARC'));
    }

    const luzM = Math.max(4, maxX - minX);
    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const newNodes = { ...nodes };
    const newSegs = { ...segments };
    const stamp = Math.round(zPos * 100);

    const c1 = `n_col1_int_${stamp}`;
    const c2 = `n_col1_top_int_${stamp}`;
    const c4 = `n_col2_top_int_${stamp}`;
    const c5 = `n_col2_int_${stamp}`;

    newNodes[c1] = { id: c1, x: minX, y: 0, z: zPos, isFixedSupport: true, nodeLabel: `COL-IZQ-BASE-INT-${stamp}` };
    newNodes[c2] = { id: c2, x: minX, y: baseH, z: zPos, nodeLabel: `COL-IZQ-TOP-INT-${stamp}` };
    newNodes[c4] = { id: c4, x: maxX, y: baseH, z: zPos, nodeLabel: `COL-DER-TOP-INT-${stamp}` };
    newNodes[c5] = { id: c5, x: maxX, y: 0, z: zPos, isFixedSupport: true, nodeLabel: `COL-DER-BASE-INT-${stamp}` };

    newSegs[`s_col1_int_${stamp}`] = { id: `s_col1_int_${stamp}`, nodeAId: c1, nodeBId: c2, profileId: colProf, rolEstructural: 'columna' };
    newSegs[`s_col2_int_${stamp}`] = { id: `s_col2_int_${stamp}`, nodeAId: c5, nodeBId: c4, profileId: colProf, rolEstructural: 'columna' };

    const tipo = tipoTijeralParam || (isParabolic ? 'parabolico_warren' : 'fink');
    const createdTopNodeIds: string[] = [];

    if (isParabolic || tipo.includes('parabolico')) {
      const numPuntos = luzM <= 12 ? 8 : (luzM <= 18 ? 10 : 12);
      const flecha = Math.max(1.0, peakH - baseH - 0.8);
      const hp = peralteMParam || 0.80;
      const topArc: string[] = [];
      const botArc: string[] = [];

      for (let i = 0; i <= numPuntos; i++) {
        const xNorm = i / numPuntos;
        const x = minX + xNorm * luzM;
        const yParab = 4 * flecha * xNorm * (1 - xNorm);
        const yTop = baseH + hp + yParab;
        const yBot = baseH + yParab;

        const tId = `n_arc_t_int_${stamp}_${i}`;
        const bId = `n_arc_b_int_${stamp}_${i}`;
        newNodes[tId] = { id: tId, x, y: yTop, z: zPos, nodeLabel: `CS-ARC-INT-${stamp}-${i}` };
        newNodes[bId] = { id: bId, x, y: yBot, z: zPos, nodeLabel: `CI-ARC-INT-${stamp}-${i}` };
        topArc.push(tId);
        botArc.push(bId);
        createdTopNodeIds.push(tId);
      }

      for (let i = 0; i < numPuntos; i++) {
        newSegs[`s_arc_top_int_${stamp}_${i}`] = { id: `s_arc_top_int_${stamp}_${i}`, nodeAId: topArc[i], nodeBId: topArc[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
        newSegs[`s_arc_bot_int_${stamp}_${i}`] = { id: `s_arc_bot_int_${stamp}_${i}`, nodeAId: botArc[i], nodeBId: botArc[i + 1], profileId: vigaProf, rolEstructural: 'cordon_inferior' };
        newSegs[`s_arc_mon_int_${stamp}_${i}`] = { id: `s_arc_mon_int_${stamp}_${i}`, nodeAId: botArc[i], nodeBId: topArc[i], profileId: vigaProf, rolEstructural: 'montante' };
        const fromDiag = i % 2 === 0 ? botArc[i] : topArc[i];
        const toDiag = i % 2 === 0 ? topArc[i + 1] : botArc[i + 1];
        newSegs[`s_arc_diag_int_${stamp}_${i}`] = { id: `s_arc_diag_int_${stamp}_${i}`, nodeAId: fromDiag, nodeBId: toDiag, profileId: vigaProf, rolEstructural: 'diagonal' };
      }
      newSegs[`s_arc_mon_int_${stamp}_end`] = { id: `s_arc_mon_int_${stamp}_end`, nodeAId: botArc[numPuntos], nodeBId: topArc[numPuntos], profileId: vigaProf, rolEstructural: 'montante' };
    } else {
      const hCumbrera = Math.max(0.8, peakH - baseH);
      const c3 = `n_cumbrera_int_${stamp}`;
      newNodes[c3] = { id: c3, x: minX + luzM / 2, y: baseH + hCumbrera, z: zPos, nodeLabel: `CUMBRERA-INT-${stamp}` };

      const numSub = 4;
      const leftTop: string[] = [c2];
      const rightTop: string[] = [c3];
      const bottom: string[] = [c2];

      for (let i = 1; i < numSub * 2; i++) {
        const xVal = minX + (luzM / (numSub * 2)) * i;
        const bId = `n_bot_int_${stamp}_${i}`;
        newNodes[bId] = { id: bId, x: xVal, y: baseH, z: zPos, nodeLabel: `TIR-INT-${stamp}-${i}` };
        bottom.push(bId);
      }
      bottom.push(c4);

      for (let i = 1; i < numSub; i++) {
        const xVal = minX + (luzM / 2 / numSub) * i;
        const yVal = baseH + (hCumbrera / numSub) * i;
        const tId = `n_top_l_int_${stamp}_${i}`;
        newNodes[tId] = { id: tId, x: xVal, y: yVal, z: zPos, nodeLabel: `CS-IZQ-INT-${stamp}-${i}` };
        leftTop.push(tId);
      }
      leftTop.push(c3);

      for (let i = 1; i < numSub; i++) {
        const xVal = minX + luzM / 2 + (luzM / 2 / numSub) * i;
        const yVal = baseH + hCumbrera - (hCumbrera / numSub) * i;
        const tId = `n_top_r_int_${stamp}_${i}`;
        newNodes[tId] = { id: tId, x: xVal, y: yVal, z: zPos, nodeLabel: `CS-DER-INT-${stamp}-${i}` };
        rightTop.push(tId);
      }
      rightTop.push(c4);

      createdTopNodeIds.push(...leftTop, ...rightTop.slice(1));

      for (let i = 0; i < bottom.length - 1; i++) {
        newSegs[`s_bot_int_${stamp}_${i}`] = { id: `s_bot_int_${stamp}_${i}`, nodeAId: bottom[i], nodeBId: bottom[i + 1], profileId: vigaProf, rolEstructural: 'cordon_inferior' };
      }
      for (let i = 0; i < leftTop.length - 1; i++) {
        newSegs[`s_top_l_int_${stamp}_${i}`] = { id: `s_top_l_int_${stamp}_${i}`, nodeAId: leftTop[i], nodeBId: leftTop[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
      }
      for (let i = 0; i < rightTop.length - 1; i++) {
        newSegs[`s_top_r_int_${stamp}_${i}`] = { id: `s_top_r_int_${stamp}_${i}`, nodeAId: rightTop[i], nodeBId: rightTop[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
      }

      newSegs[`s_mon_center_int_${stamp}`] = { id: `s_mon_center_int_${stamp}`, nodeAId: bottom[numSub], nodeBId: c3, profileId: vigaProf, rolEstructural: 'montante' };
      for (let i = 1; i < numSub; i++) {
        newSegs[`s_mon_l_int_${stamp}_${i}`] = { id: `s_mon_l_int_${stamp}_${i}`, nodeAId: bottom[i], nodeBId: leftTop[i], profileId: vigaProf, rolEstructural: 'montante' };
        newSegs[`s_mon_r_int_${stamp}_${i}`] = { id: `s_mon_r_int_${stamp}_${i}`, nodeAId: bottom[numSub + i], nodeBId: rightTop[i], profileId: vigaProf, rolEstructural: 'montante' };
      }
      if (tipo !== 'escalera_vierendeel' && tipo !== 'simple_arco') {
        for (let i = 1; i <= numSub; i++) {
          newSegs[`s_diag_l_int_${stamp}_${i}`] = { id: `s_diag_l_int_${stamp}_${i}`, nodeAId: bottom[i - 1], nodeBId: leftTop[i], profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[`s_diag_r_int_${stamp}_${i}`] = { id: `s_diag_r_int_${stamp}_${i}`, nodeAId: bottom[numSub + i], nodeBId: rightTop[i - 1], profileId: vigaProf, rolEstructural: 'diagonal' };
        }
      }
    }

    // Conectar automáticamente con los nodos de cubierta anteriores y posteriores más cercanos
    const otherNodes = existingNodeList.filter(n => n.y >= baseH - 0.2);
    const nodesBefore = otherNodes.filter(n => (n.z || 0) < zPos - 0.1);
    const nodesAfter = otherNodes.filter(n => (n.z || 0) > zPos + 0.1);

    if (nodesBefore.length > 0) {
      createdTopNodeIds.forEach((tId, idx) => {
        const tNode = newNodes[tId];
        let closestBefore: Node3D | null = null;
        let minD = Infinity;
        nodesBefore.forEach(nb => {
          const d = Math.hypot(nb.x - tNode.x, nb.y - tNode.y);
          if (d < minD && d < 2.0) {
            minD = d;
            closestBefore = nb;
          }
        });
        if (closestBefore) {
          const sCId = `s_correa_link_b_${stamp}_${idx}`;
          newSegs[sCId] = { id: sCId, nodeAId: (closestBefore as Node3D).id, nodeBId: tId, profileId: correaProf, rolEstructural: 'correa' };
        }
      });
    }

    if (nodesAfter.length > 0) {
      createdTopNodeIds.forEach((tId, idx) => {
        const tNode = newNodes[tId];
        let closestAfter: Node3D | null = null;
        let minD = Infinity;
        nodesAfter.forEach(na => {
          const d = Math.hypot(na.x - tNode.x, na.y - tNode.y);
          if (d < minD && d < 2.0) {
            minD = d;
            closestAfter = na;
          }
        });
        if (closestAfter) {
          const sCId = `s_correa_link_a_${stamp}_${idx}`;
          newSegs[sCId] = { id: sCId, nodeAId: tId, nodeBId: (closestAfter as Node3D).id, profileId: correaProf, rolEstructural: 'correa' };
        }
      });
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [nodes, segments, coverageZones, activeProfileId, pushHistory]);

  // Generador de Mezzanine / Entrepiso Metálico Paramétrico
  const generateMezzanine = useCallback((
    largoM: number,
    anchoM: number,
    alturaM: number,
    numSubseccionesX: number = 3,
    numSubseccionesY: number = 2,
    esHueco: boolean = false,
    conTijeralesPerimetro: boolean = false,
    conTijeralesInternos: boolean = false,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId; // Tubo 100x100
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[1]?.id || activeProfileId; // Tubo 150x50
    const trussProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId; // Tubo 2x2 para celosía del tijeral

    const dx = largoM / numSubseccionesX;
    const dy = anchoM / numSubseccionesY;

    // 1. Crear todos los nodos necesarios (columnas y topes)
    for (let ix = 0; ix <= numSubseccionesX; ix++) {
      for (let iy = 0; iy <= numSubseccionesY; iy++) {
        const x = ix * dx;
        const z = iy * dy;

        const isPerimeter = ix === 0 || ix === numSubseccionesX || iy === 0 || iy === numSubseccionesY;

        // Si es hueco, omitir nodos interiores
        if (esHueco && !isPerimeter) {
          continue;
        }

        const idBase = `n_mez_b_${ix}_${iy}`;
        const idTop = `n_mez_t_${ix}_${iy}`;

        newNodes[idBase] = { id: idBase, x, y: 0, z, isFixedSupport: true, nodeLabel: `COL-B-${ix}${iy}` };
        newNodes[idTop] = { id: idTop, x, y: alturaM, z, nodeLabel: `COL-T-${ix}${iy}` };

        // Columna vertical
        const sColId = `s_mez_col_${ix}_${iy}`;
        newSegs[sColId] = { id: sColId, nodeAId: idBase, nodeBId: idTop, profileId: colProf, rolEstructural: 'columna' };

        // Nodo para el cordón inferior del tijeral (si se requiere)
        const conTijeralAqui = (isPerimeter && conTijeralesPerimetro) || (!isPerimeter && conTijeralesInternos);
        if (conTijeralAqui && alturaM > 1.2) {
          const idTrussBot = `n_mez_tb_${ix}_${iy}`;
          newNodes[idTrussBot] = { id: idTrussBot, x, y: alturaM - 0.60, z, nodeLabel: `TIJ-B-${ix}${iy}` };

          // Montante de conexión vertical
          const sTrussVertId = `s_mez_tvert_${ix}_${iy}`;
          newSegs[sTrussVertId] = { id: sTrussVertId, nodeAId: idTop, nodeBId: idTrussBot, profileId: trussProf, rolEstructural: 'montante' };
        }
      }
    }

    // 2. Conectar vigas y tijerales en dirección X
    for (let ix = 1; ix <= numSubseccionesX; ix++) {
      for (let iy = 0; iy <= numSubseccionesY; iy++) {
        const isSegmentPerimeter = iy === 0 || iy === numSubseccionesY;

        // Si es hueco, omitir vigas interiores
        if (esHueco && !isSegmentPerimeter) {
          continue;
        }

        const idTopA = `n_mez_t_${ix - 1}_${iy}`;
        const idTopB = `n_mez_t_${ix}_${iy}`;

        // Asegurarse de que los nodos existan
        if (newNodes[idTopA] && newNodes[idTopB]) {
          const sVigaXId = `s_mez_vx_${ix}_${iy}`;
          newSegs[sVigaXId] = { id: sVigaXId, nodeAId: idTopA, nodeBId: idTopB, profileId: vigaProf, rolEstructural: 'viga_principal' };

          // Agregar tijeral en X
          const conTijeralAqui = (isSegmentPerimeter && conTijeralesPerimetro) || (!isSegmentPerimeter && conTijeralesInternos);
          const idTrussBotA = `n_mez_tb_${ix - 1}_${iy}`;
          const idTrussBotB = `n_mez_tb_${ix}_${iy}`;

          if (conTijeralAqui && newNodes[idTrussBotA] && newNodes[idTrussBotB]) {
            // Cordón inferior del tijeral
            const sTrussBotId = `s_mez_tx_bot_${ix}_${iy}`;
            newSegs[sTrussBotId] = { id: sTrussBotId, nodeAId: idTrussBotA, nodeBId: idTrussBotB, profileId: trussProf, rolEstructural: 'cordon_inferior' };

            // Diagonales (solo si el tipo de tijeral NO es escalera o simple arco)
            if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
              const sTrussDiag1Id = `s_mez_tx_diag_${ix}_${iy}`;
              newSegs[sTrussDiag1Id] = { id: sTrussDiag1Id, nodeAId: idTrussBotA, nodeBId: idTopB, profileId: trussProf, rolEstructural: 'diagonal' };
            }
          }
        }
      }
    }

    // 3. Conectar vigas y tijerales en dirección Y
    for (let ix = 0; ix <= numSubseccionesX; ix++) {
      for (let iy = 1; iy <= numSubseccionesY; iy++) {
        const isSegmentPerimeter = ix === 0 || ix === numSubseccionesX;

        // Si es hueco, omitir vigas interiores
        if (esHueco && !isSegmentPerimeter) {
          continue;
        }

        const idTopA = `n_mez_t_${ix}_${iy - 1}`;
        const idTopB = `n_mez_t_${ix}_${iy}`;

        if (newNodes[idTopA] && newNodes[idTopB]) {
          const sVigaYId = `s_mez_vy_${ix}_${iy}`;
          newSegs[sVigaYId] = { id: sVigaYId, nodeAId: idTopA, nodeBId: idTopB, profileId: vigaProf, rolEstructural: 'viga_secundaria' };

          // Agregar tijeral en Y
          const conTijeralAqui = (isSegmentPerimeter && conTijeralesPerimetro) || (!isSegmentPerimeter && conTijeralesInternos);
          const idTrussBotA = `n_mez_tb_${ix}_${iy - 1}`;
          const idTrussBotB = `n_mez_tb_${ix}_${iy}`;

          if (conTijeralAqui && newNodes[idTrussBotA] && newNodes[idTrussBotB]) {
            // Cordón inferior del tijeral
            const sTrussBotId = `s_mez_ty_bot_${ix}_${iy}`;
            newSegs[sTrussBotId] = { id: sTrussBotId, nodeAId: idTrussBotA, nodeBId: idTrussBotB, profileId: trussProf, rolEstructural: 'cordon_inferior' };

            // Diagonal (solo si el tipo de tijeral NO es escalera o simple arco)
            if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
              const sTrussDiag1Id = `s_mez_ty_diag_${ix}_${iy}`;
              newSegs[sTrussDiag1Id] = { id: sTrussDiag1Id, nodeAId: idTrussBotA, nodeBId: idTopB, profileId: trussProf, rolEstructural: 'diagonal' };
            }
          }
        }
      }
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo Dientes de Sierra (Shed Industrial) Paramétrico
  const generateRoofSawtooth = useCallback((
    luzM: number,
    largoM: number = 24,
    alturaColM: number = 4.5,
    numDientes: number = 3,
    alturaDienteM: number = 1.8,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel',
    numTijerales: number = 5,
    numDivisionsPerTooth: number = 4,
    customSpacingM?: number,
    _peralteM?: number,
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasLongitudinal = orientacionTijeral === 'horizontal' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'completo';
    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    const numFrames = Math.max(2, numTijerales || 5);
    const dz = largoM / (numFrames - 1);
    const teethCount = Math.max(1, Math.min(8, numDientes || 3));
    const toothWidth = luzM / teethCount;

    let prevToothTopNodes: string[][] = [];

    for (let f = 0; f < numFrames; f++) {
      const z = f * dz;
      const currentToothTopNodes: string[][] = [];

      // Columnas principales en extremos
      const c1 = `n_saw_col1_${f}`;
      const c2 = `n_saw_col1_t_${f}`;
      const c3 = `n_saw_col2_${f}`;
      const c4 = `n_saw_col2_t_${f}`;

      newNodes[c1] = { id: c1, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `COL-SAW-IZQ-${f+1}` };
      newNodes[c2] = { id: c2, x: 0, y: alturaColM, z, nodeLabel: `COL-SAW-IZQ-TOP-${f+1}` };
      newNodes[c3] = { id: c3, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `COL-SAW-DER-${f+1}` };
      newNodes[c4] = { id: c4, x: luzM, y: alturaColM, z, nodeLabel: `COL-SAW-DER-TOP-${f+1}` };

      newSegs[`s_saw_col1_${f}`] = { id: `s_saw_col1_${f}`, nodeAId: c1, nodeBId: c2, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_saw_col2_${f}`] = { id: `s_saw_col2_${f}`, nodeAId: c3, nodeBId: c4, profileId: colProf, rolEstructural: 'columna' };

      // Si la luz es grande (>=14m) y hay varios dientes, colocar columnas intermedias en los valles
      if (luzM >= 14 && teethCount > 1) {
        for (let t = 1; t < teethCount; t++) {
          const xVal = t * toothWidth;
          const ciB = `n_saw_coli_${f}_${t}`;
          const ciT = `n_saw_colit_${f}_${t}`;
          newNodes[ciB] = { id: ciB, x: xVal, y: 0, z, isFixedSupport: true, nodeLabel: `COL-SAW-INT-B-${f+1}-${t}` };
          newNodes[ciT] = { id: ciT, x: xVal, y: alturaColM, z, nodeLabel: `COL-SAW-INT-T-${f+1}-${t}` };
          newSegs[`s_saw_coli_${f}_${t}`] = { id: `s_saw_coli_${f}_${t}`, nodeAId: ciB, nodeBId: ciT, profileId: colProf, rolEstructural: 'columna' };
        }
      }

      // Generar cada diente de sierra
      for (let t = 0; t < teethCount; t++) {
        const xStart = t * toothWidth;
        const toothNodesTop: string[] = [];
        const toothNodesBot: string[] = [];

        // Calcular número de subdivisiones del diente
        let subPerTooth = numDivisionsPerTooth || 4;
        if (customSpacingM && customSpacingM > 0.1) {
          subPerTooth = Math.max(2, Math.round(toothWidth / customSpacingM));
        }

        // Nodos del cordón inferior (viga horizontal) y cordón superior (faldón inclinado)
        for (let i = 0; i <= subPerTooth; i++) {
          const u = i / subPerTooth;
          const x = xStart + u * toothWidth;
          const yBot = alturaColM;
          const yTop = alturaColM + u * alturaDienteM;

          const nBotId = `n_saw_bot_${f}_${t}_${i}`;
          const nTopId = `n_saw_top_${f}_${t}_${i}`;

          newNodes[nBotId] = { id: nBotId, x, y: yBot, z, nodeLabel: `SAW-B-${f+1}-${t+1}-${i}` };
          newNodes[nTopId] = { id: nTopId, x, y: yTop, z, nodeLabel: `SAW-T-${f+1}-${t+1}-${i}` };

          toothNodesBot.push(nBotId);
          toothNodesTop.push(nTopId);
        }

        // Cordón superior inclinado
        for (let i = 0; i < subPerTooth; i++) {
          const sTopId = `s_saw_top_${f}_${t}_${i}`;
          newSegs[sTopId] = { id: sTopId, nodeAId: toothNodesTop[i], nodeBId: toothNodesTop[i + 1], profileId: vigaProf, rolEstructural: 'cordon_superior' };
        }

        // Cordón inferior horizontal
        for (let i = 0; i < subPerTooth; i++) {
          const sBotId = `s_saw_bot_${f}_${t}_${i}`;
          newSegs[sBotId] = { id: sBotId, nodeAId: toothNodesBot[i], nodeBId: toothNodesBot[i + 1], profileId: vigaProf, rolEstructural: 'cordon_inferior' };
        }

        // Montante vertical frontal de captación de luz (ventana shed) al final del diente
        const sFrontId = `s_saw_front_${f}_${t}`;
        newSegs[sFrontId] = { id: sFrontId, nodeAId: toothNodesBot[subPerTooth], nodeBId: toothNodesTop[subPerTooth], profileId: vigaProf, rolEstructural: 'montante' };

        // Celosía interna: Montantes a 90°
        for (let i = 1; i < subPerTooth; i++) {
          const sMonId = `s_saw_mon_${f}_${t}_${i}`;
          newSegs[sMonId] = { id: sMonId, nodeAId: toothNodesBot[i], nodeBId: toothNodesTop[i], profileId: vigaProf, rolEstructural: 'montante' };
        }

        // Diagonales (si no es tipo escalera pura)
        if (tipoTijeral !== 'escalera_vierendeel') {
          for (let i = 0; i < subPerTooth; i++) {
            const sDiagId = `s_saw_diag_${f}_${t}_${i}`;
            if (tipoTijeral === 'howe') {
              newSegs[sDiagId] = { id: sDiagId, nodeAId: toothNodesTop[i + 1], nodeBId: toothNodesBot[i], profileId: vigaProf, rolEstructural: 'diagonal' };
            } else if (tipoTijeral === 'warren') {
              newSegs[sDiagId] = { id: sDiagId, nodeAId: i % 2 === 0 ? toothNodesBot[i] : toothNodesTop[i], nodeBId: i % 2 === 0 ? toothNodesTop[i + 1] : toothNodesBot[i + 1], profileId: vigaProf, rolEstructural: 'diagonal' };
            } else {
              // Pratt por defecto (a tracción)
              newSegs[sDiagId] = { id: sDiagId, nodeAId: toothNodesBot[i], nodeBId: toothNodesTop[i + 1], profileId: vigaProf, rolEstructural: 'diagonal' };
            }
          }
        }

        currentToothTopNodes.push(toothNodesTop);
      }

      // Conectar correas longitudinales entre pórticos
      if (f > 0 && prevToothTopNodes.length === teethCount) {
        for (let t = 0; t < teethCount; t++) {
          const prevNodes = prevToothTopNodes[t];
          const currNodes = currentToothTopNodes[t];
          for (let i = 0; i < currNodes.length; i++) {
            const sCorreaId = `s_saw_correa_${f}_${t}_${i}`;
            newSegs[sCorreaId] = { id: sCorreaId, nodeAId: prevNodes[i], nodeBId: currNodes[i], profileId: correaProf, rolEstructural: 'correa' };
          }
          // Celosía longitudinal en dientes de sierra si hasLongitudinal
          if (hasLongitudinal && prevNodes.length > 0 && currNodes.length > 0) {
            if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
              const topIdx = currNodes.length - 1;
              const sSawLd = `s_saw_long_diag_${f}_${t}`;
              newSegs[sSawLd] = {
                id: sSawLd,
                nodeAId: f % 2 === 1 ? prevNodes[0] : prevNodes[topIdx],
                nodeBId: f % 2 === 1 ? currNodes[topIdx] : currNodes[0],
                profileId: vigaProf,
                rolEstructural: 'diagonal'
              };
            }
          }
        }
      }

      // Tímpanos perimetrales de fachada
      if (hasPerimetral && (f === 0 || f === numFrames - 1)) {
        for (let t = 0; t < teethCount; t++) {
          const midT = Math.floor((numDivisionsPerTooth || 4) / 2);
          const nBot = newNodes[`n_saw_bot_${f}_${t}_${midT}`];
          if (nBot) {
            const bId = `n_saw_perim_b_${f}_${t}`;
            newNodes[bId] = { id: bId, x: nBot.x, y: 0, z: nBot.z, isFixedSupport: true, nodeLabel: `SAW-PERIM-B-${f+1}-${t+1}` };
            const sId = `s_saw_perim_col_${f}_${t}`;
            newSegs[sId] = { id: sId, nodeAId: bId, nodeBId: nBot.id, profileId: colProf, rolEstructural: 'columna' };
          }
        }
      }

      prevToothTopNodes = currentToothTopNodes;
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo a Cuatro Aguas / Piramidal (Hip Roof) Paramétrico Completo
  const generateRoofHip = useCallback((
    luzM: number,
    largoM: number = 20,
    alturaColM: number = 4.5,
    alturaCumbreraM: number = 2.0,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel',
    numTijerales: number = 5,
    _customSpacingM?: number,
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasLongitudinal = orientacionTijeral === 'horizontal' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'completo';
    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    const xMid = luzM / 2;
    const yRidge = alturaColM + alturaCumbreraM;
    const setback = Math.min(luzM / 2, largoM / 3);
    const zRidge1 = setback;
    const zRidge2 = Math.max(setback, largoM - setback);

    // 1. Columnas Perimetrales (4 Esquinas + Intermedias en Muros)
    const corners = [
      { id: 'c1', x: 0, z: 0, label: 'C1' },
      { id: 'c2', x: luzM, z: 0, label: 'C2' },
      { id: 'c3', x: luzM, z: largoM, label: 'C3' },
      { id: 'c4', x: 0, z: largoM, label: 'C4' }
    ];

    corners.forEach(c => {
      const bId = `n_hip_4ag_b_${c.id}`;
      const tId = `n_hip_4ag_t_${c.id}`;
      newNodes[bId] = { id: bId, x: c.x, y: 0, z: c.z, isFixedSupport: true, nodeLabel: `HIP-4AG-COL-B-${c.label}` };
      newNodes[tId] = { id: tId, x: c.x, y: alturaColM, z: c.z, nodeLabel: `HIP-4AG-COL-T-${c.label}` };
      newSegs[`s_hip_col_${c.id}`] = { id: `s_hip_col_${c.id}`, nodeAId: bId, nodeBId: tId, profileId: colProf, rolEstructural: 'columna' };
    });

    // Columnas intermedias en fachadas si las dimensiones lo ameritan
    const numColsZ = Math.max(1, Math.round(largoM / 6.0));
    for (let i = 1; i < numColsZ; i++) {
      const zVal = (largoM / numColsZ) * i;
      // Lado izquierdo (X=0)
      const bL = `n_hip_col_l_b_${i}`;
      const tL = `n_hip_col_l_t_${i}`;
      newNodes[bL] = { id: bL, x: 0, y: 0, z: zVal, isFixedSupport: true, nodeLabel: `HIP-4AG-COL-L-B-${i}` };
      newNodes[tL] = { id: tL, x: 0, y: alturaColM, z: zVal, nodeLabel: `HIP-4AG-COL-L-T-${i}` };
      newSegs[`s_hip_col_l_${i}`] = { id: `s_hip_col_l_${i}`, nodeAId: bL, nodeBId: tL, profileId: colProf, rolEstructural: 'columna' };

      // Lado derecho (X=luzM)
      const bR = `n_hip_col_r_b_${i}`;
      const tR = `n_hip_col_r_t_${i}`;
      newNodes[bR] = { id: bR, x: luzM, y: 0, z: zVal, isFixedSupport: true, nodeLabel: `HIP-4AG-COL-R-B-${i}` };
      newNodes[tR] = { id: tR, x: luzM, y: alturaColM, z: zVal, nodeLabel: `HIP-4AG-COL-R-T-${i}` };
      newSegs[`s_hip_col_r_${i}`] = { id: `s_hip_col_r_${i}`, nodeAId: bR, nodeBId: tR, profileId: colProf, rolEstructural: 'columna' };
    }

    // Puntos medios en testeros frontal y posterior para apoyo de limatesas intermedias
    const nFrontMid = 'n_hip_front_mid';
    const nBackMid = 'n_hip_back_mid';
    newNodes[nFrontMid] = { id: nFrontMid, x: xMid, y: alturaColM, z: 0, nodeLabel: 'HIP-4AG-FRONT-MID' };
    newNodes[nBackMid] = { id: nBackMid, x: xMid, y: alturaColM, z: largoM, nodeLabel: 'HIP-4AG-BACK-MID' };

    // 2. Anillo Perimetral Continuo de Vigas Soleras (Perimeter Ring Beams) - Conecta todas las columnas
    // Testero frontal (Z = 0)
    newSegs['s_ring_front_1'] = { id: 's_ring_front_1', nodeAId: 'n_hip_4ag_t_c1', nodeBId: nFrontMid, profileId: vigaProf, rolEstructural: 'viga_principal' };
    newSegs['s_ring_front_2'] = { id: 's_ring_front_2', nodeAId: nFrontMid, nodeBId: 'n_hip_4ag_t_c2', profileId: vigaProf, rolEstructural: 'viga_principal' };

    // Lateral derecho (X = luzM)
    let prevColR = 'n_hip_4ag_t_c2';
    for (let i = 1; i < numColsZ; i++) {
      const currColR = `n_hip_col_r_t_${i}`;
      newSegs[`s_ring_right_${i}`] = { id: `s_ring_right_${i}`, nodeAId: prevColR, nodeBId: currColR, profileId: vigaProf, rolEstructural: 'viga_principal' };
      prevColR = currColR;
    }
    newSegs['s_ring_right_end'] = { id: 's_ring_right_end', nodeAId: prevColR, nodeBId: 'n_hip_4ag_t_c3', profileId: vigaProf, rolEstructural: 'viga_principal' };

    // Testero posterior (Z = largoM)
    newSegs['s_ring_back_1'] = { id: 's_ring_back_1', nodeAId: 'n_hip_4ag_t_c3', nodeBId: nBackMid, profileId: vigaProf, rolEstructural: 'viga_principal' };
    newSegs['s_ring_back_2'] = { id: 's_ring_back_2', nodeAId: nBackMid, nodeBId: 'n_hip_4ag_t_c4', profileId: vigaProf, rolEstructural: 'viga_principal' };

    // Lateral izquierdo (X = 0)
    let prevColL = 'n_hip_4ag_t_c1';
    for (let i = 1; i < numColsZ; i++) {
      const currColL = `n_hip_col_l_t_${i}`;
      newSegs[`s_ring_left_${i}`] = { id: `s_ring_left_${i}`, nodeAId: prevColL, nodeBId: currColL, profileId: vigaProf, rolEstructural: 'viga_principal' };
      prevColL = currColL;
    }
    newSegs['s_ring_left_end'] = { id: 's_ring_left_end', nodeAId: prevColL, nodeBId: 'n_hip_4ag_t_c4', profileId: vigaProf, rolEstructural: 'viga_principal' };

    // 3. Cumbrera Central (Central Ridge)
    const nRidge1 = 'n_hip_4ag_ridge_1';
    const nRidge2 = 'n_hip_4ag_ridge_2';
    newNodes[nRidge1] = { id: nRidge1, x: xMid, y: yRidge, z: zRidge1, nodeLabel: 'HIP-4AG-CUMBRERA-1' };
    newNodes[nRidge2] = { id: nRidge2, x: xMid, y: yRidge, z: zRidge2, nodeLabel: 'HIP-4AG-CUMBRERA-2' };

    if (zRidge2 > zRidge1) {
      newSegs['s_hip_4ag_ridge'] = { id: 's_hip_4ag_ridge', nodeAId: nRidge1, nodeBId: nRidge2, profileId: vigaProf, rolEstructural: 'cordon_superior' };
    }

    // 4. Cuatro Limatesas Principales (Hip Rafters)
    newSegs['s_hip_4ag_raf_1'] = { id: 's_hip_4ag_raf_1', nodeAId: 'n_hip_4ag_t_c1', nodeBId: nRidge1, profileId: vigaProf, rolEstructural: 'cordon_superior' };
    newSegs['s_hip_4ag_raf_2'] = { id: 's_hip_4ag_raf_2', nodeAId: 'n_hip_4ag_t_c2', nodeBId: nRidge1, profileId: vigaProf, rolEstructural: 'cordon_superior' };
    newSegs['s_hip_4ag_raf_3'] = { id: 's_hip_4ag_raf_3', nodeAId: 'n_hip_4ag_t_c3', nodeBId: nRidge2, profileId: vigaProf, rolEstructural: 'cordon_superior' };
    newSegs['s_hip_4ag_raf_4'] = { id: 's_hip_4ag_raf_4', nodeAId: 'n_hip_4ag_t_c4', nodeBId: nRidge2, profileId: vigaProf, rolEstructural: 'cordon_superior' };

    // Péndulos / Montantes de Cumbrera y Tirantes Inferiores
    const nBotR1 = 'n_hip_4ag_bot_r1';
    const nBotR2 = 'n_hip_4ag_bot_r2';
    newNodes[nBotR1] = { id: nBotR1, x: xMid, y: alturaColM, z: zRidge1, nodeLabel: 'HIP-4AG-TIE-1' };
    newNodes[nBotR2] = { id: nBotR2, x: xMid, y: alturaColM, z: zRidge2, nodeLabel: 'HIP-4AG-TIE-2' };
    newSegs['s_hip_4ag_mon_r1'] = { id: 's_hip_4ag_mon_r1', nodeAId: nBotR1, nodeBId: nRidge1, profileId: vigaProf, rolEstructural: 'montante' };
    newSegs['s_hip_4ag_mon_r2'] = { id: 's_hip_4ag_mon_r2', nodeAId: nBotR2, nodeBId: nRidge2, profileId: vigaProf, rolEstructural: 'montante' };
    newSegs['s_hip_4ag_tie_r'] = { id: 's_hip_4ag_tie_r', nodeAId: nBotR1, nodeBId: nBotR2, profileId: vigaProf, rolEstructural: 'cordon_inferior' };

    // 5. Faldones Frontal y Posterior: Pares de caída (Jack Rafters)
    newSegs['s_hip_front_rafter'] = { id: 's_hip_front_rafter', nodeAId: nFrontMid, nodeBId: nRidge1, profileId: vigaProf, rolEstructural: 'cordon_superior' };
    newSegs['s_hip_back_rafter'] = { id: 's_hip_back_rafter', nodeAId: nBackMid, nodeBId: nRidge2, profileId: vigaProf, rolEstructural: 'cordon_superior' };
    newSegs['s_hip_front_tie'] = { id: 's_hip_front_tie', nodeAId: nFrontMid, nodeBId: nBotR1, profileId: vigaProf, rolEstructural: 'cordon_inferior' };
    newSegs['s_hip_back_tie'] = { id: 's_hip_back_tie', nodeAId: nBackMid, nodeBId: nBotR2, profileId: vigaProf, rolEstructural: 'cordon_inferior' };

    // 6. Pórticos Intermedios en el Tramo de Cumbrera con Tijerales Warren / Pratt Completos
    const numFrames = Math.max(1, (numTijerales || 5) - 2);
    let prevFrameTopNodes: string[] = [];
    let prevFrameBotNodes: string[] = [];
    const numSubPanels = Math.max(2, Math.min(6, Math.round((luzM / 2) / (_customSpacingM || 1.8))));

    for (let f = 1; f <= numFrames; f++) {
      const u = f / (numFrames + 1);
      const zFrame = zRidge1 + u * (zRidge2 - zRidge1);
      if (zRidge2 - zRidge1 > 0.8) {
        const frameTopNodes: string[] = [];
        const frameBotNodes: string[] = [];

        // Nodos cuerda inferior (Y = alturaColM)
        for (let i = 0; i <= numSubPanels * 2; i++) {
          const xVal = (luzM / (numSubPanels * 2)) * i;
          const bId = `n_hip_truss_b_${f}_${i}`;
          newNodes[bId] = { id: bId, x: xVal, y: alturaColM, z: zFrame, nodeLabel: `HIP-TIE-${f}-${i}` };
          frameBotNodes.push(bId);
        }

        // Nodos cuerda superior izquierda (X=0 a xMid)
        for (let i = 0; i <= numSubPanels; i++) {
          const frac = i / numSubPanels;
          const xVal = frac * xMid;
          const yVal = alturaColM + frac * alturaCumbreraM;
          const tId = `n_hip_truss_tl_${f}_${i}`;
          newNodes[tId] = { id: tId, x: xVal, y: yVal, z: zFrame, nodeLabel: `HIP-CSL-${f}-${i}` };
          frameTopNodes.push(tId);
        }

        // Nodos cuerda superior derecha (xMid a luzM)
        for (let i = 1; i <= numSubPanels; i++) {
          const frac = i / numSubPanels;
          const xVal = xMid + frac * (luzM - xMid);
          const yVal = yRidge - frac * alturaCumbreraM;
          const tId = `n_hip_truss_tr_${f}_${i}`;
          newNodes[tId] = { id: tId, x: xVal, y: yVal, z: zFrame, nodeLabel: `HIP-CSR-${f}-${i}` };
          frameTopNodes.push(tId);
        }

        // Conectar Cuerda Inferior continua
        for (let i = 0; i < frameBotNodes.length - 1; i++) {
          newSegs[`s_hip_bot_${f}_${i}`] = {
            id: `s_hip_bot_${f}_${i}`,
            nodeAId: frameBotNodes[i],
            nodeBId: frameBotNodes[i + 1],
            profileId: vigaProf,
            rolEstructural: 'cordon_inferior'
          };
        }

        // Conectar Cuerda Superior continua
        for (let i = 0; i < frameTopNodes.length - 1; i++) {
          newSegs[`s_hip_top_${f}_${i}`] = {
            id: `s_hip_top_${f}_${i}`,
            nodeAId: frameTopNodes[i],
            nodeBId: frameTopNodes[i + 1],
            profileId: vigaProf,
            rolEstructural: 'cordon_superior'
          };
        }

        // Montantes Verticales en cada nudo
        for (let i = 1; i < frameBotNodes.length - 1; i++) {
          const topNode = frameTopNodes[i];
          const botNode = frameBotNodes[i];
          newSegs[`s_hip_mon_${f}_${i}`] = {
            id: `s_hip_mon_${f}_${i}`,
            nodeAId: botNode,
            nodeBId: topNode,
            profileId: vigaProf,
            rolEstructural: 'montante'
          };
        }

        // Diagonales según tipología (Warren / Pratt / Howe)
        if (tipoTijeral !== 'escalera_vierendeel') {
          for (let i = 1; i <= numSubPanels * 2; i++) {
            const diagId = `s_hip_diag_${f}_${i}`;
            if (tipoTijeral === 'warren') {
              const nA = i % 2 === 1 ? frameBotNodes[i - 1] : frameBotNodes[i];
              const nB = i % 2 === 1 ? frameTopNodes[i] : frameTopNodes[i - 1];
              newSegs[diagId] = { id: diagId, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
            } else if (tipoTijeral === 'howe') {
              const isLeft = i <= numSubPanels;
              const nA = isLeft ? frameBotNodes[i] : frameBotNodes[i - 1];
              const nB = isLeft ? frameTopNodes[i - 1] : frameTopNodes[i];
              newSegs[diagId] = { id: diagId, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
            } else {
              // Pratt / Fink por defecto
              const isLeft = i <= numSubPanels;
              const nA = isLeft ? frameBotNodes[i - 1] : frameBotNodes[i];
              const nB = isLeft ? frameTopNodes[i] : frameTopNodes[i - 1];
              newSegs[diagId] = { id: diagId, nodeAId: nA, nodeBId: nB, profileId: vigaProf, rolEstructural: 'diagonal' };
            }
          }
        }

        // Correas longitudinales y arriostres entre tijerales transversales
        if (prevFrameTopNodes.length === frameTopNodes.length) {
          for (let i = 0; i < frameTopNodes.length; i++) {
            newSegs[`s_hip_correa_long_${f}_${i}`] = {
              id: `s_hip_correa_long_${f}_${i}`,
              nodeAId: prevFrameTopNodes[i],
              nodeBId: frameTopNodes[i],
              profileId: correaProf,
              rolEstructural: 'correa'
            };
          }
          for (let i = 0; i < frameBotNodes.length; i += 2) {
            newSegs[`s_hip_tie_long_${f}_${i}`] = {
              id: `s_hip_tie_long_${f}_${i}`,
              nodeAId: prevFrameBotNodes[i],
              nodeBId: frameBotNodes[i],
              profileId: vigaProf,
              rolEstructural: 'arriostre'
            };
          }

          // Celosía longitudinal en cumbrera si hasLongitudinal
          if (hasLongitudinal) {
            const midTopIdx = numSubPanels;
            const sLd = `s_hip_long_truss_diag_${f}`;
            newSegs[sLd] = {
              id: sLd,
              nodeAId: f % 2 === 1 ? prevFrameBotNodes[midTopIdx] : prevFrameTopNodes[midTopIdx],
              nodeBId: f % 2 === 1 ? frameTopNodes[midTopIdx] : frameBotNodes[midTopIdx],
              profileId: vigaProf,
              rolEstructural: 'diagonal'
            };
          }
        }

        // Diagonales perimetrales si hasPerimetral
        if (hasPerimetral) {
          const sPerimL = `s_hip_perim_diag_l_${f}`;
          const sPerimR = `s_hip_perim_diag_r_${f}`;
          newSegs[sPerimL] = { id: sPerimL, nodeAId: frameBotNodes[0], nodeBId: frameTopNodes[1], profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[sPerimR] = { id: sPerimR, nodeAId: frameBotNodes[frameBotNodes.length - 1], nodeBId: frameTopNodes[frameTopNodes.length - 2], profileId: vigaProf, rolEstructural: 'diagonal' };
        }

        prevFrameTopNodes = frameTopNodes;
        prevFrameBotNodes = frameBotNodes;
      }
    }

    // 7. Correas Concéntricas en Faldones Testeros (Frontal y Posterior)
    const numPurlinRings = 3;
    for (let r = 1; r <= numPurlinRings; r++) {
      const frac = r / (numPurlinRings + 1);
      const yPurlin = alturaColM + frac * alturaCumbreraM;

      // Anillo frontal
      const zPf = (1 - frac) * 0 + frac * zRidge1;
      const xPfL = (1 - frac) * 0 + frac * xMid;
      const xPfR = (1 - frac) * luzM + frac * xMid;
      const idPfL = `n_hip_pf_l_${r}`;
      const idPfM = `n_hip_pf_m_${r}`;
      const idPfR = `n_hip_pf_r_${r}`;
      newNodes[idPfL] = { id: idPfL, x: xPfL, y: yPurlin, z: zPf, nodeLabel: `HIP-4AG-PF-L-${r}` };
      newNodes[idPfM] = { id: idPfM, x: xMid, y: yPurlin, z: zPf, nodeLabel: `HIP-4AG-PF-M-${r}` };
      newNodes[idPfR] = { id: idPfR, x: xPfR, y: yPurlin, z: zPf, nodeLabel: `HIP-4AG-PF-R-${r}` };
      newSegs[`s_hip_pf_1_${r}`] = { id: `s_hip_pf_1_${r}`, nodeAId: idPfL, nodeBId: idPfM, profileId: correaProf, rolEstructural: 'correa' };
      newSegs[`s_hip_pf_2_${r}`] = { id: `s_hip_pf_2_${r}`, nodeAId: idPfM, nodeBId: idPfR, profileId: correaProf, rolEstructural: 'correa' };

      // Anillo posterior
      const zPb = (1 - frac) * largoM + frac * zRidge2;
      const idPbL = `n_hip_pb_l_${r}`;
      const idPbM = `n_hip_pb_m_${r}`;
      const idPbR = `n_hip_pb_r_${r}`;
      newNodes[idPbL] = { id: idPbL, x: xPfL, y: yPurlin, z: zPb, nodeLabel: `HIP-4AG-PB-L-${r}` };
      newNodes[idPbM] = { id: idPbM, x: xMid, y: yPurlin, z: zPb, nodeLabel: `HIP-4AG-PB-M-${r}` };
      newNodes[idPbR] = { id: idPbR, x: xPfR, y: yPurlin, z: zPb, nodeLabel: `HIP-4AG-PB-R-${r}` };
      newSegs[`s_hip_pb_1_${r}`] = { id: `s_hip_pb_1_${r}`, nodeAId: idPbL, nodeBId: idPbM, profileId: correaProf, rolEstructural: 'correa' };
      newSegs[`s_hip_pb_2_${r}`] = { id: `s_hip_pb_2_${r}`, nodeAId: idPbM, nodeBId: idPbR, profileId: correaProf, rolEstructural: 'correa' };
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo a Seis Aguas (6 Aguas / Hexagonal o Pabellón de 6 Caídas)
  const generateRoof6Aguas = useCallback((
    luzM: number,
    largoM: number = 18,
    alturaColM: number = 4.5,
    alturaCuspideM: number = 2.2,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel',
    numAnillosCorreas: number = 4,
    _customSpacingM?: number,
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    const cX = luzM / 2;
    const cZ = largoM / 2;
    const rX = luzM / 2;
    const rZ = largoM / 2;
    const yPeak = alturaColM + alturaCuspideM;

    // 1. Crear 6 Columnas Perimetrales y Vigas en Anillo Hexagonal
    const hexVertices: { x: number; z: number }[] = [];
    for (let k = 0; k < 6; k++) {
      const angle = (k * Math.PI) / 3;
      const x = cX + rX * Math.cos(angle);
      const z = cZ + rZ * Math.sin(angle);
      hexVertices.push({ x, z });

      const bId = `n_hex_6ag_b_${k}`;
      const tId = `n_hex_6ag_t_${k}`;
      newNodes[bId] = { id: bId, x, y: 0, z, isFixedSupport: true, nodeLabel: `HEX-6AG-COL-B-${k+1}` };
      newNodes[tId] = { id: tId, x, y: alturaColM, z, nodeLabel: `HEX-6AG-COL-T-${k+1}` };
      newSegs[`s_hex_col_${k}`] = { id: `s_hex_col_${k}`, nodeAId: bId, nodeBId: tId, profileId: colProf, rolEstructural: 'columna' };
    }

    // Vigas perimetrales de amarre (Anillo cerrado de 6 lados)
    for (let k = 0; k < 6; k++) {
      const nextK = (k + 1) % 6;
      newSegs[`s_hex_ring_${k}`] = {
        id: `s_hex_ring_${k}`,
        nodeAId: `n_hex_6ag_t_${k}`,
        nodeBId: `n_hex_6ag_t_${nextK}`,
        profileId: vigaProf,
        rolEstructural: 'viga_principal'
      };

      // Si es perimetral, añadir tirante inferior de anillo y diagonales perimetrales
      if (hasPerimetral) {
        const dPerimId = `s_hex_perim_diag_${k}`;
        newSegs[dPerimId] = {
          id: dPerimId,
          nodeAId: `n_hex_6ag_t_${k}`,
          nodeBId: `n_hex_web_b_${k}`,
          profileId: vigaProf,
          rolEstructural: 'diagonal'
        };
      }
    }

    // 2. Vértice Central (Cúspide de las 6 Aguas)
    const nApex = 'n_hex_6ag_apex';
    const nCenterTie = 'n_hex_6ag_tie_c';
    newNodes[nApex] = { id: nApex, x: cX, y: yPeak, z: cZ, nodeLabel: 'HEX-6AG-APEX' };
    newNodes[nCenterTie] = { id: nCenterTie, x: cX, y: alturaColM, z: cZ, nodeLabel: 'HEX-6AG-TIE-C' };

    // Montante Vertical Central (King Post)
    newSegs['s_hex_kingpost'] = { id: 's_hex_kingpost', nodeAId: nCenterTie, nodeBId: nApex, profileId: vigaProf, rolEstructural: 'montante' };

    // 3. Seis Limatesas Radiales Principales (Hip Rafters) y Seis Tirantes Radiales con Celosía Warren / Pratt
    for (let k = 0; k < 6; k++) {
      const tId = `n_hex_6ag_t_${k}`;
      // Limatesa
      newSegs[`s_hex_rafter_${k}`] = { id: `s_hex_rafter_${k}`, nodeAId: tId, nodeBId: nApex, profileId: vigaProf, rolEstructural: 'cordon_superior' };
      // Tirante radial inferior
      newSegs[`s_hex_tie_${k}`] = { id: `s_hex_tie_${k}`, nodeAId: tId, nodeBId: nCenterTie, profileId: vigaProf, rolEstructural: 'cordon_inferior' };

      // Montantes intermedios en celosía a 90°
      const midX = (hexVertices[k].x + cX) / 2;
      const midZ = (hexVertices[k].z + cZ) / 2;
      const midY = (alturaColM + yPeak) / 2;
      const idWebTop = `n_hex_web_t_${k}`;
      const idWebBot = `n_hex_web_b_${k}`;
      newNodes[idWebTop] = { id: idWebTop, x: midX, y: midY, z: midZ, nodeLabel: `HEX-6AG-WT-${k}` };
      newNodes[idWebBot] = { id: idWebBot, x: midX, y: alturaColM, z: midZ, nodeLabel: `HEX-6AG-WB-${k}` };
      newSegs[`s_hex_web_mon_${k}`] = { id: `s_hex_web_mon_${k}`, nodeAId: idWebBot, nodeBId: idWebTop, profileId: vigaProf, rolEstructural: 'montante' };

      // Diagonales según tipología (Warren / Pratt / Howe)
      if (tipoTijeral !== 'escalera_vierendeel') {
        const diag1Id = `s_hex_diag1_${k}`;
        const diag2Id = `s_hex_diag2_${k}`;

        if (tipoTijeral === 'warren') {
          // Warren: zig-zag
          newSegs[diag1Id] = { id: diag1Id, nodeAId: tId, nodeBId: idWebBot, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[diag2Id] = { id: diag2Id, nodeAId: idWebBot, nodeBId: nApex, profileId: vigaProf, rolEstructural: 'diagonal' };
        } else {
          // Pratt / Fink por defecto: diagonales a tracción hacia el centro
          newSegs[diag1Id] = { id: diag1Id, nodeAId: tId, nodeBId: idWebTop, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[diag2Id] = { id: diag2Id, nodeAId: idWebBot, nodeBId: nApex, profileId: vigaProf, rolEstructural: 'diagonal' };
        }
      }
    }

    // 4. Anillos Concéntricos de Correas en las 6 Caídas
    const rings = Math.max(2, Math.min(8, numAnillosCorreas || 4));
    for (let r = 1; r <= rings; r++) {
      const u = r / (rings + 1);
      const ringY = alturaColM + u * alturaCuspideM;
      const ringNodeIds: string[] = [];

      for (let k = 0; k < 6; k++) {
        const x = (1 - u) * hexVertices[k].x + u * cX;
        const z = (1 - u) * hexVertices[k].z + u * cZ;
        const id = `n_hex_purlin_${r}_${k}`;
        newNodes[id] = { id, x, y: ringY, z, nodeLabel: `HEX-6AG-PURLIN-${r}-${k}` };
        ringNodeIds.push(id);
      }

      // Conectar correa cerrada de 6 lados en este nivel
      for (let k = 0; k < 6; k++) {
        const nextK = (k + 1) % 6;
        newSegs[`s_hex_correa_${r}_${k}`] = {
          id: `s_hex_correa_${r}_${k}`,
          nodeAId: ringNodeIds[k],
          nodeBId: ringNodeIds[nextK],
          profileId: correaProf,
          rolEstructural: 'correa'
        };
      }
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo Mansarda / Quebrado Poligonal (Gambrel)
  const generateRoofMansarda = useCallback((
    luzM: number,
    largoM: number = 20,
    alturaColM: number = 4.0,
    alturaQuiebreM: number = 2.0,
    alturaCumbreraM: number = 1.2,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel',
    numTijerales: number = 5,
    _customSpacingM?: number,
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasLongitudinal = orientacionTijeral === 'horizontal' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'completo';
    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    const framesCount = Math.max(2, numTijerales || 5);
    const dz = largoM / (framesCount - 1);
    const xMid = luzM / 2;
    const xBreak1 = luzM * 0.20;
    const xBreak2 = luzM * 0.80;
    const yBreak = alturaColM + alturaQuiebreM;
    const yPeak = yBreak + alturaCumbreraM;

    let prevTopNodes: string[] = [];

    for (let f = 0; f < framesCount; f++) {
      const z = f * dz;

      // Columnas en los extremos
      const c1B = `n_man_b_l_${f}`;
      const c1T = `n_man_t_l_${f}`;
      const c2B = `n_man_b_r_${f}`;
      const c2T = `n_man_t_r_${f}`;

      newNodes[c1B] = { id: c1B, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `MANSARDA-COL-BL-${f+1}` };
      newNodes[c1T] = { id: c1T, x: 0, y: alturaColM, z, nodeLabel: `MANSARDA-COL-TL-${f+1}` };
      newNodes[c2B] = { id: c2B, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `MANSARDA-COL-BR-${f+1}` };
      newNodes[c2T] = { id: c2T, x: luzM, y: alturaColM, z, nodeLabel: `MANSARDA-COL-TR-${f+1}` };

      newSegs[`s_man_col_l_${f}`] = { id: `s_man_col_l_${f}`, nodeAId: c1B, nodeBId: c1T, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_man_col_r_${f}`] = { id: `s_man_col_r_${f}`, nodeAId: c2B, nodeBId: c2T, profileId: colProf, rolEstructural: 'columna' };

      // Nudos superiores del perfil quebrado (Mansarda)
      const nK1 = `n_man_k1_${f}`;
      const nPeak = `n_man_peak_${f}`;
      const nK2 = `n_man_k2_${f}`;

      newNodes[nK1] = { id: nK1, x: xBreak1, y: yBreak, z, nodeLabel: `MANSARDA-K1-${f+1}` };
      newNodes[nPeak] = { id: nPeak, x: xMid, y: yPeak, z, nodeLabel: `MANSARDA-PEAK-${f+1}` };
      newNodes[nK2] = { id: nK2, x: xBreak2, y: yBreak, z, nodeLabel: `MANSARDA-K2-${f+1}` };

      // Faldones de cordón superior
      newSegs[`s_man_cs1_${f}`] = { id: `s_man_cs1_${f}`, nodeAId: c1T, nodeBId: nK1, profileId: vigaProf, rolEstructural: 'cordon_superior' };
      newSegs[`s_man_cs2_${f}`] = { id: `s_man_cs2_${f}`, nodeAId: nK1, nodeBId: nPeak, profileId: vigaProf, rolEstructural: 'cordon_superior' };
      newSegs[`s_man_cs3_${f}`] = { id: `s_man_cs3_${f}`, nodeAId: nPeak, nodeBId: nK2, profileId: vigaProf, rolEstructural: 'cordon_superior' };
      newSegs[`s_man_cs4_${f}`] = { id: `s_man_cs4_${f}`, nodeAId: nK2, nodeBId: c2T, profileId: vigaProf, rolEstructural: 'cordon_superior' };

      // Cordón inferior horizontal
      newSegs[`s_man_ci_${f}`] = { id: `s_man_ci_${f}`, nodeAId: c1T, nodeBId: c2T, profileId: vigaProf, rolEstructural: 'cordon_inferior' };

      // Montantes a 90°
      const nTieK1 = `n_man_tiek1_${f}`;
      const nTieMid = `n_man_tiemid_${f}`;
      const nTieK2 = `n_man_tiek2_${f}`;

      newNodes[nTieK1] = { id: nTieK1, x: xBreak1, y: alturaColM, z, nodeLabel: `MANSARDA-TIEK1-${f+1}` };
      newNodes[nTieMid] = { id: nTieMid, x: xMid, y: alturaColM, z, nodeLabel: `MANSARDA-TIEMID-${f+1}` };
      newNodes[nTieK2] = { id: nTieK2, x: xBreak2, y: alturaColM, z, nodeLabel: `MANSARDA-TIEK2-${f+1}` };

      newSegs[`s_man_mon1_${f}`] = { id: `s_man_mon1_${f}`, nodeAId: nTieK1, nodeBId: nK1, profileId: vigaProf, rolEstructural: 'montante' };
      newSegs[`s_man_mon2_${f}`] = { id: `s_man_mon2_${f}`, nodeAId: nTieMid, nodeBId: nPeak, profileId: vigaProf, rolEstructural: 'montante' };
      newSegs[`s_man_mon3_${f}`] = { id: `s_man_mon3_${f}`, nodeAId: nTieK2, nodeBId: nK2, profileId: vigaProf, rolEstructural: 'montante' };

      // Diagonales (si no es tipo escalera)
      if (tipoTijeral !== 'escalera_vierendeel') {
        if (tipoTijeral === 'warren') {
          newSegs[`s_man_diag1_${f}`] = { id: `s_man_diag1_${f}`, nodeAId: c1T, nodeBId: nTieK1, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[`s_man_diag2_${f}`] = { id: `s_man_diag2_${f}`, nodeAId: nTieK1, nodeBId: nPeak, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[`s_man_diag3_${f}`] = { id: `s_man_diag3_${f}`, nodeAId: nPeak, nodeBId: nTieK2, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[`s_man_diag4_${f}`] = { id: `s_man_diag4_${f}`, nodeAId: nTieK2, nodeBId: c2T, profileId: vigaProf, rolEstructural: 'diagonal' };
        } else {
          // Pratt por defecto (a tracción hacia el centro)
          newSegs[`s_man_diag1_${f}`] = { id: `s_man_diag1_${f}`, nodeAId: c1T, nodeBId: nTieK1, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[`s_man_diag2_${f}`] = { id: `s_man_diag2_${f}`, nodeAId: nTieK1, nodeBId: nPeak, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[`s_man_diag3_${f}`] = { id: `s_man_diag3_${f}`, nodeAId: nTieK2, nodeBId: nPeak, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[`s_man_diag4_${f}`] = { id: `s_man_diag4_${f}`, nodeAId: c2T, nodeBId: nTieK2, profileId: vigaProf, rolEstructural: 'diagonal' };
        }
      }

      // Tímpanos perimetrales de testero
      if (hasPerimetral && (f === 0 || f === framesCount - 1)) {
        const posts = [nTieK1, nTieMid, nTieK2];
        posts.forEach((pNodeId, pIdx) => {
          const pNode = newNodes[pNodeId];
          if (pNode) {
            const bId = `n_man_perim_b_${f}_${pIdx}`;
            newNodes[bId] = { id: bId, x: pNode.x, y: 0, z: pNode.z, isFixedSupport: true, nodeLabel: `MAN-PERIM-B-${f+1}-${pIdx+1}` };
            const sId = `s_man_perim_col_${f}_${pIdx}`;
            newSegs[sId] = { id: sId, nodeAId: bId, nodeBId: pNodeId, profileId: colProf, rolEstructural: 'columna' };
          }
        });
      }

      const currTopNodes = [c1T, nK1, nPeak, nK2, c2T];

      // Correas longitudinales entre pórticos
      if (f > 0 && prevTopNodes.length === 5) {
        for (let i = 0; i < 5; i++) {
          newSegs[`s_man_correa_${f}_${i}`] = {
            id: `s_man_correa_${f}_${i}`,
            nodeAId: prevTopNodes[i],
            nodeBId: currTopNodes[i],
            profileId: correaProf,
            rolEstructural: 'correa'
          };
        }

        // Tijerales longitudinales en quiebres y cumbrera
        if (hasLongitudinal) {
          if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
            const sLd1 = `s_man_long_diag1_${f}`;
            const sLd2 = `s_man_long_diag2_${f}`;
            newSegs[sLd1] = { id: sLd1, nodeAId: prevTopNodes[1], nodeBId: currTopNodes[2], profileId: vigaProf, rolEstructural: 'diagonal' };
            newSegs[sLd2] = { id: sLd2, nodeAId: prevTopNodes[3], nodeBId: currTopNodes[2], profileId: vigaProf, rolEstructural: 'diagonal' };
          }
        }
      }

      prevTopNodes = currTopNodes;
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Cúpula / Domo Circular (Radial Dome Roof)
  const generateRoofDome = useCallback((
    diametroM: number,
    alturaColM: number = 4.0,
    flechaCúpulaM: number = 2.5,
    numCostillasRadiales: number = 8,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel',
    _customSpacingM?: number,
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    const R = diametroM / 2;
    const ribs = Math.max(6, Math.min(16, numCostillasRadiales || 8));
    const yPeak = alturaColM + flechaCúpulaM;

    // Vértice central de cúpula
    const nApex = 'n_dome_apex';
    const nCenterTie = 'n_dome_tie_c';
    newNodes[nApex] = { id: nApex, x: 0, y: yPeak, z: 0, nodeLabel: 'DOME-APEX' };
    newNodes[nCenterTie] = { id: nCenterTie, x: 0, y: alturaColM, z: 0, nodeLabel: 'DOME-TIE-C' };

    // Columnas perimetrales y anillo circular
    const perimeterTopNodes: string[] = [];
    for (let k = 0; k < ribs; k++) {
      const angle = (k * 2 * Math.PI) / ribs;
      const x = R * Math.cos(angle);
      const z = R * Math.sin(angle);

      const bId = `n_dome_b_${k}`;
      const tId = `n_dome_t_${k}`;
      newNodes[bId] = { id: bId, x, y: 0, z, isFixedSupport: true, nodeLabel: `DOME-COL-B-${k+1}` };
      newNodes[tId] = { id: tId, x, y: alturaColM, z, nodeLabel: `DOME-COL-T-${k+1}` };
      perimeterTopNodes.push(tId);

      newSegs[`s_dome_col_${k}`] = { id: `s_dome_col_${k}`, nodeAId: bId, nodeBId: tId, profileId: colProf, rolEstructural: 'columna' };
    }

    // Viga perimetral circular cerrada (Tension Ring)
    for (let k = 0; k < ribs; k++) {
      const nextK = (k + 1) % ribs;
      newSegs[`s_dome_ring_${k}`] = {
        id: `s_dome_ring_${k}`,
        nodeAId: perimeterTopNodes[k],
        nodeBId: perimeterTopNodes[nextK],
        profileId: vigaProf,
        rolEstructural: 'viga_principal'
      };
    }

    // Costillas radiales arqueadas hacia la cúspide con Celosía Warren / Pratt
    for (let k = 0; k < ribs; k++) {
      const angle = (k * 2 * Math.PI) / ribs;
      const tId = perimeterTopNodes[k];

      // Punto intermedio arqueado
      const midR = R * 0.55;
      const midY = alturaColM + flechaCúpulaM * 0.70;
      const midX = midR * Math.cos(angle);
      const midZ = midR * Math.sin(angle);
      const mId = `n_dome_mid_${k}`;
      const mTieId = `n_dome_tie_${k}`;

      newNodes[mId] = { id: mId, x: midX, y: midY, z: midZ, nodeLabel: `DOME-RIB-${k+1}` };
      newNodes[mTieId] = { id: mTieId, x: midX, y: alturaColM, z: midZ, nodeLabel: `DOME-TIE-${k+1}` };

      // Cordón superior
      newSegs[`s_dome_rib1_${k}`] = { id: `s_dome_rib1_${k}`, nodeAId: tId, nodeBId: mId, profileId: vigaProf, rolEstructural: 'cordon_superior' };
      newSegs[`s_dome_rib2_${k}`] = { id: `s_dome_rib2_${k}`, nodeAId: mId, nodeBId: nApex, profileId: vigaProf, rolEstructural: 'cordon_superior' };

      // Tirante radial inferior
      newSegs[`s_dome_tie1_${k}`] = { id: `s_dome_tie1_${k}`, nodeAId: tId, nodeBId: mTieId, profileId: vigaProf, rolEstructural: 'cordon_inferior' };
      newSegs[`s_dome_tie2_${k}`] = { id: `s_dome_tie2_${k}`, nodeAId: mTieId, nodeBId: nCenterTie, profileId: vigaProf, rolEstructural: 'cordon_inferior' };

      // Montante vertical
      newSegs[`s_dome_mon_${k}`] = { id: `s_dome_mon_${k}`, nodeAId: mTieId, nodeBId: mId, profileId: vigaProf, rolEstructural: 'montante' };

      // Diagonales (Warren o Pratt)
      if (tipoTijeral !== 'escalera_vierendeel') {
        const diag1Id = `s_dome_diag1_${k}`;
        const diag2Id = `s_dome_diag2_${k}`;
        if (tipoTijeral === 'warren') {
          newSegs[diag1Id] = { id: diag1Id, nodeAId: tId, nodeBId: mId, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[diag2Id] = { id: diag2Id, nodeAId: mTieId, nodeBId: nApex, profileId: vigaProf, rolEstructural: 'diagonal' };
        } else {
          // Pratt / Fink por defecto
          newSegs[diag1Id] = { id: diag1Id, nodeAId: tId, nodeBId: mId, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[diag2Id] = { id: diag2Id, nodeAId: mTieId, nodeBId: nApex, profileId: vigaProf, rolEstructural: 'diagonal' };
        }
      }
    }

    // Anillo de correas concéntrico
    for (let k = 0; k < ribs; k++) {
      const nextK = (k + 1) % ribs;
      newSegs[`s_dome_purlin_mid_${k}`] = {
        id: `s_dome_purlin_mid_${k}`,
        nodeAId: `n_dome_mid_${k}`,
        nodeBId: `n_dome_mid_${nextK}`,
        profileId: correaProf,
        rolEstructural: 'correa'
      };

      // Si es perimetral, añadir celosía en anillo de base
      if (hasPerimetral) {
        newSegs[`s_dome_perim_diag_${k}`] = {
          id: `s_dome_perim_diag_${k}`,
          nodeAId: perimeterTopNodes[k],
          nodeBId: `n_dome_mid_${nextK}`,
          profileId: vigaProf,
          rolEstructural: 'diagonal'
        };
      }
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo en Forma de L con Limahoya (L-Shaped Intersecting Roof)
  const generateRoofLShaped = useCallback((
    luzPrincipalM: number,
    largoPrincipalM: number,
    luzAlaM: number,
    largoAlaM: number,
    alturaColM: number = 4.5,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel',
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;

    const hCumbrera = 1.8;
    const yPeak = alturaColM + hCumbrera;

    const polyL = [
      { x: 0, z: 0 },
      { x: luzPrincipalM, z: 0 },
      { x: luzPrincipalM, z: largoPrincipalM },
      { x: luzPrincipalM + largoAlaM, z: largoPrincipalM },
      { x: luzPrincipalM + largoAlaM, z: largoPrincipalM + luzAlaM },
      { x: 0, z: largoPrincipalM + luzAlaM }
    ];

    polyL.forEach((pt, idx) => {
      const bId = `n_l_b_${idx}`;
      const tId = `n_l_t_${idx}`;
      newNodes[bId] = { id: bId, x: pt.x, y: 0, z: pt.z, isFixedSupport: true, nodeLabel: `SHAPE-L-COL-B-${idx+1}` };
      newNodes[tId] = { id: tId, x: pt.x, y: alturaColM, z: pt.z, nodeLabel: `SHAPE-L-COL-T-${idx+1}` };
      newSegs[`s_l_col_${idx}`] = { id: `s_l_col_${idx}`, nodeAId: bId, nodeBId: tId, profileId: colProf, rolEstructural: 'columna' };
    });

    // Vigas perimetrales
    for (let i = 0; i < polyL.length; i++) {
      const next = (i + 1) % polyL.length;
      newSegs[`s_l_ring_${i}`] = {
        id: `s_l_ring_${i}`,
        nodeAId: `n_l_t_${i}`,
        nodeBId: `n_l_t_${next}`,
        profileId: vigaProf,
        rolEstructural: 'viga_principal'
      };
    }

    // Cumbreras de las dos alas y Limahoya
    const nR1 = 'n_l_ridge_main_1';
    const nR2 = 'n_l_ridge_main_2';
    const nR3 = 'n_l_ridge_wing_end';

    const xMainMid = luzPrincipalM / 2;
    newNodes[nR1] = { id: nR1, x: xMainMid, y: yPeak, z: 0, nodeLabel: 'SHAPE-L-RIDGE-1' };
    newNodes[nR2] = { id: nR2, x: xMainMid, y: yPeak, z: largoPrincipalM + luzAlaM / 2, nodeLabel: 'SHAPE-L-INTERSECTION' };
    newNodes[nR3] = { id: nR3, x: luzPrincipalM + largoAlaM, y: yPeak, z: largoPrincipalM + luzAlaM / 2, nodeLabel: 'SHAPE-L-RIDGE-WING' };

    newSegs['s_l_ridge_main'] = { id: 's_l_ridge_main', nodeAId: nR1, nodeBId: nR2, profileId: vigaProf, rolEstructural: 'cordon_superior' };
    newSegs['s_l_ridge_wing'] = { id: 's_l_ridge_wing', nodeAId: nR2, nodeBId: nR3, profileId: vigaProf, rolEstructural: 'cordon_superior' };

    // Limahoya en la esquina interior (P3: luzPrincipalM, largoPrincipalM)
    newSegs['s_l_limahoya'] = { id: 's_l_limahoya', nodeAId: 'n_l_t_2', nodeBId: nR2, profileId: vigaProf, rolEstructural: 'cordon_superior' };

    // Tijerales transversales en ala principal y ala secundaria
    const nTieMain1 = 'n_l_tie_main_1';
    newNodes[nTieMain1] = { id: nTieMain1, x: xMainMid, y: alturaColM, z: 0, nodeLabel: 'SHAPE-L-TIE-1' };
    newSegs['s_l_mon_main_1'] = { id: 's_l_mon_main_1', nodeAId: nTieMain1, nodeBId: nR1, profileId: vigaProf, rolEstructural: 'montante' };
    newSegs['s_l_tie_main_l'] = { id: 's_l_tie_main_l', nodeAId: 'n_l_t_0', nodeBId: nTieMain1, profileId: vigaProf, rolEstructural: 'cordon_inferior' };
    newSegs['s_l_tie_main_r'] = { id: 's_l_tie_main_r', nodeAId: nTieMain1, nodeBId: 'n_l_t_1', profileId: vigaProf, rolEstructural: 'cordon_inferior' };

    if (tipoTijeral !== 'escalera_vierendeel') {
      newSegs['s_l_diag_main_l'] = { id: 's_l_diag_main_l', nodeAId: 'n_l_t_0', nodeBId: nR1, profileId: vigaProf, rolEstructural: 'diagonal' };
      newSegs['s_l_diag_main_r'] = { id: 's_l_diag_main_r', nodeAId: 'n_l_t_1', nodeBId: nR1, profileId: vigaProf, rolEstructural: 'diagonal' };
    }

    // Refuerzos perimetrales o longitudinales en alas
    if ((orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo') && tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
      newSegs['s_l_perim_brace_1'] = { id: 's_l_perim_brace_1', nodeAId: 'n_l_b_0', nodeBId: 'n_l_t_1', profileId: colProf, rolEstructural: 'diagonal' };
      newSegs['s_l_perim_brace_2'] = { id: 's_l_perim_brace_2', nodeAId: 'n_l_b_3', nodeBId: 'n_l_t_4', profileId: colProf, rolEstructural: 'diagonal' };
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo Mariposa / V Invertida (Butterfly Roof) con Viga Canaleta Central
  const generateRoofButterfly = useCallback((
    luzM: number,
    largoM: number = 20,
    alturaColM: number = 4.5,
    desnivelAlasM: number = 1.5,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel',
    numTijerales: number = 5,
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasLongitudinal = orientacionTijeral === 'horizontal' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'completo';

    const framesCount = Math.max(2, numTijerales || 5);
    const dz = largoM / (framesCount - 1);
    const xMid = luzM / 2;
    const yValley = alturaColM;
    const yWing = alturaColM + desnivelAlasM;

    let prevTopNodes: string[] = [];

    for (let f = 0; f < framesCount; f++) {
      const z = f * dz;

      // 3 Columnas por pórtico: Izquierda, Central (Canaleta), Derecha
      const cLB = `n_bf_b_l_${f}`;
      const cLT = `n_bf_t_l_${f}`;
      const cMB = `n_bf_b_m_${f}`;
      const cMT = `n_bf_t_m_${f}`;
      const cRB = `n_bf_b_r_${f}`;
      const cRT = `n_bf_t_r_${f}`;

      newNodes[cLB] = { id: cLB, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `BF-COL-BL-${f+1}` };
      newNodes[cLT] = { id: cLT, x: 0, y: yWing, z, nodeLabel: `BF-COL-TL-${f+1}` };
      newNodes[cMB] = { id: cMB, x: xMid, y: 0, z, isFixedSupport: true, nodeLabel: `BF-COL-BM-${f+1}` };
      newNodes[cMT] = { id: cMT, x: xMid, y: yValley, z, nodeLabel: `BF-COL-TM-${f+1}` };
      newNodes[cRB] = { id: cRB, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `BF-COL-BR-${f+1}` };
      newNodes[cRT] = { id: cRT, x: luzM, y: yWing, z, nodeLabel: `BF-COL-TR-${f+1}` };

      newSegs[`s_bf_col_l_${f}`] = { id: `s_bf_col_l_${f}`, nodeAId: cLB, nodeBId: cLT, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_bf_col_m_${f}`] = { id: `s_bf_col_m_${f}`, nodeAId: cMB, nodeBId: cMT, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_bf_col_r_${f}`] = { id: `s_bf_col_r_${f}`, nodeAId: cRB, nodeBId: cRT, profileId: colProf, rolEstructural: 'columna' };

      // Vigas superiores inclinadas hacia la canaleta central
      newSegs[`s_bf_cs_l_${f}`] = { id: `s_bf_cs_l_${f}`, nodeAId: cLT, nodeBId: cMT, profileId: vigaProf, rolEstructural: 'cordon_superior' };
      newSegs[`s_bf_cs_r_${f}`] = { id: `s_bf_cs_r_${f}`, nodeAId: cRT, nodeBId: cMT, profileId: vigaProf, rolEstructural: 'cordon_superior' };

      // Cordón inferior horizontal de amarre
      const nTieL = `n_bf_tiel_${f}`;
      const nTieR = `n_bf_tier_${f}`;
      newNodes[nTieL] = { id: nTieL, x: 0, y: yValley, z, nodeLabel: `BF-TIEL-${f+1}` };
      newNodes[nTieR] = { id: nTieR, x: luzM, y: yValley, z, nodeLabel: `BF-TIER-${f+1}` };
      newSegs[`s_bf_tie_l_${f}`] = { id: `s_bf_tie_l_${f}`, nodeAId: nTieL, nodeBId: cMT, profileId: vigaProf, rolEstructural: 'cordon_inferior' };
      newSegs[`s_bf_tie_r_${f}`] = { id: `s_bf_tie_r_${f}`, nodeAId: cMT, nodeBId: nTieR, profileId: vigaProf, rolEstructural: 'cordon_inferior' };

      // Montantes verticales
      newSegs[`s_bf_mon_l_${f}`] = { id: `s_bf_mon_l_${f}`, nodeAId: nTieL, nodeBId: cLT, profileId: vigaProf, rolEstructural: 'montante' };
      newSegs[`s_bf_mon_r_${f}`] = { id: `s_bf_mon_r_${f}`, nodeAId: nTieR, nodeBId: cRT, profileId: vigaProf, rolEstructural: 'montante' };

      // Diagonales (Warren o Pratt)
      if (tipoTijeral !== 'escalera_vierendeel') {
        const dL = `s_bf_diag_l_${f}`;
        const dR = `s_bf_diag_r_${f}`;
        if (tipoTijeral === 'warren') {
          newSegs[dL] = { id: dL, nodeAId: nTieL, nodeBId: cMT, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[dR] = { id: dR, nodeAId: cMT, nodeBId: cRT, profileId: vigaProf, rolEstructural: 'diagonal' };
        } else {
          // Pratt (a tracción hacia alas altas)
          newSegs[dL] = { id: dL, nodeAId: cMT, nodeBId: cLT, profileId: vigaProf, rolEstructural: 'diagonal' };
          newSegs[dR] = { id: dR, nodeAId: cMT, nodeBId: cRT, profileId: vigaProf, rolEstructural: 'diagonal' };
        }
      }

      // Correas longitudinales
      const currTopNodes = [cLT, cMT, cRT];
      if (f > 0 && prevTopNodes.length === 3) {
        for (let i = 0; i < 3; i++) {
          newSegs[`s_bf_correa_${f}_${i}`] = {
            id: `s_bf_correa_${f}_${i}`,
            nodeAId: prevTopNodes[i],
            nodeBId: currTopNodes[i],
            profileId: correaProf,
            rolEstructural: 'correa'
          };
        }

        if (hasLongitudinal) {
          if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
            const sLd1 = `s_bf_long_diag_l_${f}`;
            const sLd2 = `s_bf_long_diag_r_${f}`;
            newSegs[sLd1] = { id: sLd1, nodeAId: prevTopNodes[0], nodeBId: currTopNodes[1], profileId: vigaProf, rolEstructural: 'diagonal' };
            newSegs[sLd2] = { id: sLd2, nodeAId: prevTopNodes[2], nodeBId: currTopNodes[1], profileId: vigaProf, rolEstructural: 'diagonal' };
          }
        }
      }
      prevTopNodes = currTopNodes;
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo Curvo Autoportante / Arcotecho (Continuous Curved Arch Roof)
  const generateRoofCurvoAutoportante = useCallback((
    luzM: number,
    largoM: number = 24,
    alturaMuroM: number = 3.5,
    flechaM: number = 2.4,
    numEjes: number = 9,
    tipoTijeral: TipoTijeral = 'parabolico_curvo',
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const archProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasPerimetral = orientacionTijeral === 'perimetral' || orientacionTijeral === 'completo';

    const frames = Math.max(2, numEjes || 9);
    const zStep = largoM / (frames - 1);
    const segsPerArch = 12;

    let prevArchTopNodes: string[] = [];

    for (let f = 0; f < frames; f++) {
      const z = f * zStep;

      // Apoyos en muro / pedestales en X=0 y X=luzM
      const cLB = `n_auto_col_lb_${f}`;
      const cLT = `n_auto_col_lt_${f}`;
      const cRB = `n_auto_col_rb_${f}`;
      const cRT = `n_auto_col_rt_${f}`;

      newNodes[cLB] = { id: cLB, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `AUTO-PED-L-B-${f+1}` };
      newNodes[cLT] = { id: cLT, x: 0, y: alturaMuroM, z, nodeLabel: `AUTO-PED-L-T-${f+1}` };
      newNodes[cRB] = { id: cRB, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `AUTO-PED-R-B-${f+1}` };
      newNodes[cRT] = { id: cRT, x: luzM, y: alturaMuroM, z, nodeLabel: `AUTO-PED-R-T-${f+1}` };

      newSegs[`s_auto_col_l_${f}`] = { id: `s_auto_col_l_${f}`, nodeAId: cLB, nodeBId: cLT, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_auto_col_r_${f}`] = { id: `s_auto_col_r_${f}`, nodeAId: cRB, nodeBId: cRT, profileId: colProf, rolEstructural: 'columna' };

      // Arco segmental continuo autoportante
      const currentArchNodes: string[] = [cLT];
      let prevNode = cLT;

      for (let s = 1; s < segsPerArch; s++) {
        const u = s / segsPerArch;
        const x = u * luzM;
        // Parábola de catenaria autoportante
        const yParab = alturaMuroM + 4 * flechaM * u * (1 - u);
        const nId = `n_auto_arc_${f}_${s}`;
        newNodes[nId] = { id: nId, x, y: yParab, z, nodeLabel: `AUTO-ARC-${f+1}-${s}` };
        newSegs[`s_auto_arc_${f}_${s}`] = { id: `s_auto_arc_${f}_${s}`, nodeAId: prevNode, nodeBId: nId, profileId: archProf, rolEstructural: 'cordon_superior' };
        prevNode = nId;
        currentArchNodes.push(nId);
      }

      newSegs[`s_auto_arc_${f}_end`] = { id: `s_auto_arc_${f}_end`, nodeAId: prevNode, nodeBId: cRT, profileId: archProf, rolEstructural: 'cordon_superior' };
      currentArchNodes.push(cRT);

      // Tirante horizontal inferior en arranque de arco para absorber empuje lateral
      newSegs[`s_auto_tie_${f}`] = { id: `s_auto_tie_${f}`, nodeAId: cLT, nodeBId: cRT, profileId: archProf, rolEstructural: 'cordon_inferior' };

      // Entramado de celosía interna si se elige tipología triangulada
      if (tipoTijeral === 'warren' || tipoTijeral === 'pratt' || tipoTijeral === 'howe' || tipoTijeral === 'parabolico_warren' || tipoTijeral === 'parabolico_pratt') {
        for (let s = 1; s < segsPerArch; s++) {
          const topNode = currentArchNodes[s];
          const botNodeX = (s / segsPerArch) * luzM;
          const bTieNodeId = `n_auto_truss_b_${f}_${s}`;
          newNodes[bTieNodeId] = { id: bTieNodeId, x: botNodeX, y: alturaMuroM, z, nodeLabel: `AUTO-TRUSS-B-${f+1}-${s}` };
          newSegs[`s_auto_web_mon_${f}_${s}`] = { id: `s_auto_web_mon_${f}_${s}`, nodeAId: bTieNodeId, nodeBId: topNode, profileId: archProf, rolEstructural: 'montante' };

          if (s > 1) {
            const prevTop = currentArchNodes[s - 1];
            const sDiagId = `s_auto_web_diag_${f}_${s}`;
            newSegs[sDiagId] = {
              id: sDiagId,
              nodeAId: tipoTijeral.includes('warren') ? (s % 2 === 0 ? bTieNodeId : prevTop) : bTieNodeId,
              nodeBId: tipoTijeral.includes('warren') ? (s % 2 === 0 ? prevTop : topNode) : prevTop,
              profileId: archProf,
              rolEstructural: 'diagonal'
            };
          }
        }
      }

      // Tímpano reticulado de testero frontal y posterior
      if (hasPerimetral && (f === 0 || f === frames - 1)) {
        for (let s = 2; s < segsPerArch - 1; s += 2) {
          const topNode = currentArchNodes[s];
          const botNodeX = (s / segsPerArch) * luzM;
          const bGableId = `n_auto_timp_b_${f}_${s}`;
          newNodes[bGableId] = { id: bGableId, x: botNodeX, y: alturaMuroM, z, nodeLabel: `AUTO-TIMP-B-${f+1}-${s}` };
          newSegs[`s_auto_timp_mon_${f}_${s}`] = { id: `s_auto_timp_mon_${f}_${s}`, nodeAId: bGableId, nodeBId: topNode, profileId: archProf, rolEstructural: 'montante' };
        }
      }

      // Correas / rigidizadores longitudinales conectando los arcos
      if (f > 0 && prevArchTopNodes.length === currentArchNodes.length) {
        for (let i = 0; i < currentArchNodes.length; i++) {
          newSegs[`s_auto_long_${f}_${i}`] = {
            id: `s_auto_long_${f}_${i}`,
            nodeAId: prevArchTopNodes[i],
            nodeBId: currentArchNodes[i],
            profileId: correaProf,
            rolEstructural: 'correa'
          };
        }
      }
      prevArchTopNodes = currentArchNodes;
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // MARQUESINA / NAVE CURVA EN VOLADIZO (tipo "ala de gaviota"): cada eje es una
  // CERCHA CURVA real (cordón superior curvo + cordón inferior ahusado + celosía
  // de montantes y diagonales). Una fila central de columnas llega al cordón
  // inferior y dos puntales inclinados triangulan el voladizo. Se amarra con
  // correas superiores, tensores inferiores y cruces de arriostre en los vanos
  // extremos. Ideal para cocheras, ingresos, patios techados y marquesinas curvas.
  const generateRoofMarquesina = useCallback((
    luzM: number,
    largoM: number = 20,
    alturaColM: number = 3.5,
    flechaM: number = 1.2,
    numEjes: number = 5
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const chordProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const webProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const frames = Math.max(2, Math.round(numEjes || 5));
    const zStep = frames > 1 ? largoM / (frames - 1) : 0;
    const pts = luzM <= 8 ? 8 : (luzM <= 14 ? 10 : 12);
    const cx = luzM / 2;
    const midI = Math.round(pts / 2);
    const peralte = Math.max(0.5, luzM * 0.07); // canto de la cercha en el centro

    // Perfil "ala de gaviota": centro alto (convexo) con las puntas levantadas.
    const yTop = (xn: number) => {
      const t = 2 * xn - 1; // -1..1
      return alturaColM + flechaM * (1 - t * t) + 0.35 * flechaM * Math.pow(t, 4);
    };
    // Canto de la cercha: máximo sobre la columna, se afina hacia las puntas.
    const canto = (xn: number) => peralte * Math.sin(Math.PI * xn);

    const topRows: string[][] = Array.from({ length: pts + 1 }, () => []);
    const botRows: (string | null)[][] = Array.from({ length: pts + 1 }, () => []);

    for (let f = 0; f < frames; f++) {
      const z = f * zStep;
      const top: string[] = [];
      const bot: (string | null)[] = [];
      for (let i = 0; i <= pts; i++) {
        const xn = i / pts;
        const x = xn * luzM;
        const yt = yTop(xn);
        const tid = `n_mq_t_${f}_${i}`;
        newNodes[tid] = { id: tid, x, y: yt, z, nodeLabel: `SUP-${f + 1}-${i}` };
        top.push(tid); topRows[i].push(tid);
        const d = canto(xn);
        if (d > 0.08) {
          const bid = `n_mq_b_${f}_${i}`;
          newNodes[bid] = { id: bid, x, y: yt - d, z, nodeLabel: `INF-${f + 1}-${i}` };
          bot.push(bid); botRows[i].push(bid);
        } else { bot.push(null); botRows[i].push(null); }
      }
      // Cordón superior (curvo)
      for (let i = 0; i < pts; i++) {
        newSegs[`s_mq_ts_${f}_${i}`] = { id: `s_mq_ts_${f}_${i}`, nodeAId: top[i], nodeBId: top[i + 1], profileId: chordProf, rolEstructural: 'cordon_superior' };
      }
      // Cordón inferior (donde hay canto)
      for (let i = 0; i < pts; i++) {
        if (bot[i] && bot[i + 1]) newSegs[`s_mq_bs_${f}_${i}`] = { id: `s_mq_bs_${f}_${i}`, nodeAId: bot[i]!, nodeBId: bot[i + 1]!, profileId: chordProf, rolEstructural: 'cordon_inferior' };
      }
      // Celosía: montantes (verticales) + diagonales en zig-zag
      for (let i = 0; i <= pts; i++) {
        if (bot[i]) newSegs[`s_mq_m_${f}_${i}`] = { id: `s_mq_m_${f}_${i}`, nodeAId: top[i], nodeBId: bot[i]!, profileId: webProf, rolEstructural: 'montante' };
      }
      for (let i = 0; i < pts; i++) {
        // diagonal que "apunta" hacia el centro (apoyo), formando triángulos
        const a = i < midI ? bot[i] : bot[i + 1];
        const b = i < midI ? top[i + 1] : top[i];
        if (a && b) newSegs[`s_mq_d_${f}_${i}`] = { id: `s_mq_d_${f}_${i}`, nodeAId: a, nodeBId: b, profileId: webProf, rolEstructural: 'diagonal' };
      }
      // Columna central portante (del suelo al cordón inferior en el centro)
      const baseId = `n_mq_cb_${f}`;
      newNodes[baseId] = { id: baseId, x: cx, y: 0, z, isFixedSupport: true, nodeLabel: `COL-${f + 1}` };
      const apex = bot[midI] || top[midI];
      newSegs[`s_mq_col_${f}`] = { id: `s_mq_col_${f}`, nodeAId: baseId, nodeBId: apex, profileId: colProf, rolEstructural: 'columna' };
      // Puntales inclinados que triangulan el voladizo a ambos lados
      const offs = Math.max(1, Math.round(pts * 0.28));
      const li = Math.max(0, midI - offs);
      const ri = Math.min(pts, midI + offs);
      if (bot[li]) newSegs[`s_mq_pl_${f}`] = { id: `s_mq_pl_${f}`, nodeAId: baseId, nodeBId: bot[li]!, profileId: webProf, rolEstructural: 'diagonal' };
      if (bot[ri]) newSegs[`s_mq_pr_${f}`] = { id: `s_mq_pr_${f}`, nodeAId: baseId, nodeBId: bot[ri]!, profileId: webProf, rolEstructural: 'diagonal' };
    }

    // Correas superiores (amarre longitudinal del cordón superior)
    for (let i = 0; i <= pts; i++) {
      const row = topRows[i];
      for (let f = 0; f < row.length - 1; f++) {
        newSegs[`s_mq_cor_${i}_${f}`] = { id: `s_mq_cor_${i}_${f}`, nodeAId: row[f], nodeBId: row[f + 1], profileId: correaProf, rolEstructural: 'correa' };
      }
    }
    // Tensores inferiores (amarre longitudinal del cordón inferior)
    for (let i = 0; i <= pts; i++) {
      const row = botRows[i];
      for (let f = 0; f < row.length - 1; f++) {
        if (row[f] && row[f + 1]) newSegs[`s_mq_ten_${i}_${f}`] = { id: `s_mq_ten_${i}_${f}`, nodeAId: row[f]!, nodeBId: row[f + 1]!, profileId: webProf, rolEstructural: 'tensor_viento' };
      }
    }
    // Arriostre (cruz de San Andrés) en el panel central del techo, en el primer
    // y último vano, para estabilidad lateral del conjunto.
    const la = Math.max(0, midI - 1), lb = Math.min(pts, midI + 1);
    const bays = frames >= 3 ? [0, frames - 2] : (frames === 2 ? [0] : []);
    bays.forEach((f, k) => {
      const A = topRows[la][f], B = topRows[lb][f], C = topRows[la][f + 1], D = topRows[lb][f + 1];
      if (A && B && C && D) {
        newSegs[`s_mq_br1_${k}`] = { id: `s_mq_br1_${k}`, nodeAId: A, nodeBId: D, profileId: webProf, rolEstructural: 'arriostre' };
        newSegs[`s_mq_br2_${k}`] = { id: `s_mq_br2_${k}`, nodeAId: B, nodeBId: C, profileId: webProf, rolEstructural: 'arriostre' };
      }
    });

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // TIJERAL A DOS AGUAS CON CORDÓN INFERIOR CURVO ("arco-tijera"): el cordón
  // SUPERIOR son dos aguas RECTAS (dos planos inclinados) — por eso el aluzinc
  // se adapta perfecto — y el cordón INFERIOR es un arco que baja hacia el centro,
  // dándole el aspecto de "techo curvo" por debajo. Entre ambos va la celosía
  // (montantes + diagonales). Genera además la COBERTURA de aluzinc sobre los dos
  // planos rectos para visualizarla puesta. Columnas en los aleros.
  const generateRoofTijeralCurvo = useCallback((
    luzM: number = 10,
    largoM: number = 20,
    alturaColM: number = 4,
    cumbreraM?: number,       // altura de la cumbrera sobre el alero (flecha superior)
    flechaInfM?: number,      // cuánto baja el cordón inferior en el centro
    numEjes: number = 5
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const chordProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const webProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const frames = Math.max(2, Math.round(numEjes || 5));
    const zStep = frames > 1 ? largoM / (frames - 1) : 0;
    // Peralte moderado: cumbrera + flecha ≈ 1.2–1.5 m (antes daba ~2.8 m, demasiado).
    const cumbrera = cumbreraM ?? Math.max(0.8, luzM * 0.09);
    const flechaInf = flechaInfM ?? Math.max(0.35, luzM * 0.045);
    const nSub = luzM <= 8 ? 4 : (luzM <= 16 ? 5 : 6); // paneles por agua
    const pts = nSub * 2;                              // nodos a lo ancho (0..pts)
    const mid = nSub;

    // Cordón superior: dos aguas rectas. Cordón inferior: arco que baja al centro.
    const yTop = (i: number) => alturaColM + cumbrera * (1 - Math.abs(i - mid) / mid);
    const yBot = (i: number) => { const t = (i - mid) / mid; return alturaColM - flechaInf * (1 - t * t); };

    // Guardamos los nodos del cordón superior por marco para correas y cobertura.
    const topIds: string[][] = Array.from({ length: frames }, () => []);

    for (let f = 0; f < frames; f++) {
      const z = f * zStep;
      const top: string[] = [];
      const bot: string[] = [];
      for (let i = 0; i <= pts; i++) {
        const x = (i / pts) * luzM;
        const tid = `n_tc_t_${f}_${i}`;
        newNodes[tid] = { id: tid, x, y: yTop(i), z, isFixedSupport: false, nodeLabel: `SUP-${f + 1}-${i}` };
        top.push(tid);
        if (i === 0 || i === pts) {
          bot.push(tid); // en los aleros el cordón inferior coincide con el superior
        } else {
          const bid = `n_tc_b_${f}_${i}`;
          newNodes[bid] = { id: bid, x, y: yBot(i), z, nodeLabel: `INF-${f + 1}-${i}` };
          bot.push(bid);
        }
      }
      topIds[f] = top;

      // Cordón superior (dos aguas rectas)
      for (let i = 0; i < pts; i++) {
        newSegs[`s_tc_ts_${f}_${i}`] = { id: `s_tc_ts_${f}_${i}`, nodeAId: top[i], nodeBId: top[i + 1], profileId: chordProf, rolEstructural: 'cordon_superior' };
      }
      // Cordón inferior (curvo)
      for (let i = 0; i < pts; i++) {
        newSegs[`s_tc_bs_${f}_${i}`] = { id: `s_tc_bs_${f}_${i}`, nodeAId: bot[i], nodeBId: bot[i + 1], profileId: chordProf, rolEstructural: 'cordon_inferior' };
      }
      // Celosía: montantes (verticales) en los nudos interiores
      for (let i = 1; i < pts; i++) {
        newSegs[`s_tc_m_${f}_${i}`] = { id: `s_tc_m_${f}_${i}`, nodeAId: top[i], nodeBId: bot[i], profileId: webProf, rolEstructural: 'montante' };
      }
      // Diagonales apuntando hacia el centro (apoyo en cumbrera)
      for (let i = 0; i < pts; i++) {
        const a = i < mid ? bot[i] : bot[i + 1];
        const b = i < mid ? top[i + 1] : top[i];
        newSegs[`s_tc_d_${f}_${i}`] = { id: `s_tc_d_${f}_${i}`, nodeAId: a, nodeBId: b, profileId: webProf, rolEstructural: 'diagonal' };
      }
      // Columnas en los aleros
      const baseL = `n_tc_cbL_${f}`, baseR = `n_tc_cbR_${f}`;
      newNodes[baseL] = { id: baseL, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `COL-IZQ-${f + 1}` };
      newNodes[baseR] = { id: baseR, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `COL-DER-${f + 1}` };
      newSegs[`s_tc_colL_${f}`] = { id: `s_tc_colL_${f}`, nodeAId: baseL, nodeBId: top[0], profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_tc_colR_${f}`] = { id: `s_tc_colR_${f}`, nodeAId: baseR, nodeBId: top[pts], profileId: colProf, rolEstructural: 'columna' };
    }

    // Correas longitudinales sobre el cordón superior (todas las líneas)
    for (let i = 0; i <= pts; i++) {
      for (let f = 0; f < frames - 1; f++) {
        newSegs[`s_tc_cor_${i}_${f}`] = { id: `s_tc_cor_${i}_${f}`, nodeAId: topIds[f][i], nodeBId: topIds[f + 1][i], profileId: correaProf, rolEstructural: 'correa' };
      }
    }
    // Tensores longitudinales del cordón inferior (nudos interiores)
    for (let i = 1; i < pts; i++) {
      for (let f = 0; f < frames - 1; f++) {
        newSegs[`s_tc_ten_${i}_${f}`] = { id: `s_tc_ten_${i}_${f}`, nodeAId: `n_tc_b_${f}_${i}`, nodeBId: `n_tc_b_${f + 1}_${i}`, profileId: webProf, rolEstructural: 'tensor_viento' };
      }
    }

    // COBERTURA DE ALUZINC sobre las dos aguas rectas (una zona por agua, de
    // alero a cumbrera, a lo largo de toda la nave).
    const fL = 0, fR = frames - 1;
    const pend = Math.round((cumbrera / (luzM / 2)) * 100);
    const zonaIzq: CoverageZone3D = {
      id: `zone_tc_izq`, nombre: 'Aluzinc — Agua Izquierda',
      nodeIdsBoundary: [topIds[fL][0], topIds[fL][mid], topIds[fR][mid], topIds[fR][0]],
      coberturaMaterialId: 'cob_aluzinc_030', pendientePorcentaje: pend, orientacionInclinacionDeg: 0,
    };
    const zonaDer: CoverageZone3D = {
      id: `zone_tc_der`, nombre: 'Aluzinc — Agua Derecha',
      nodeIdsBoundary: [topIds[fL][mid], topIds[fL][pts], topIds[fR][pts], topIds[fR][mid]],
      coberturaMaterialId: 'cob_aluzinc_030', pendientePorcentaje: pend, orientacionInclinacionDeg: 180,
    };
    const newZones = { [zonaIzq.id]: zonaIzq, [zonaDer.id]: zonaDer };

    setNodes(newNodes);
    setSegments(newSegs);
    setCoverageZones(newZones);
    pushHistory(newNodes, newSegs, newZones);
  }, [activeProfileId, pushHistory]);

  // EDIFICACIÓN MULTINIVEL (2–3 pisos) con estructura metálica: grilla de columnas
  // continuas, vigas de entrepiso en cada nivel y vigas/correas de techo arriba.
  // Base para naves/pabellones de varios niveles (acercándose a una casa metálica).
  const generateMultinivel = useCallback((
    luzM: number = 8,
    largoM: number = 10,
    numPisos: number = 2,
    alturaPisoM: number = 3.0,
    numVanosX: number = 2,
    numVanosZ: number = 2
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[1]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const nx = Math.max(1, Math.round(numVanosX));
    const nz = Math.max(1, Math.round(numVanosZ));
    const pisos = Math.max(1, Math.round(numPisos));
    const dx = luzM / nx;
    const dz = largoM / nz;
    const nid = (ix: number, iz: number, k: number) => `n_ml_${ix}_${iz}_${k}`;

    // Nodos: grilla por nivel 0..pisos
    for (let ix = 0; ix <= nx; ix++) {
      for (let iz = 0; iz <= nz; iz++) {
        for (let k = 0; k <= pisos; k++) {
          const id = nid(ix, iz, k);
          newNodes[id] = { id, x: ix * dx, y: k * alturaPisoM, z: iz * dz, isFixedSupport: k === 0, nodeLabel: `N-${ix}${iz}-P${k}` };
        }
      }
    }
    // Columnas (un segmento por piso, para que se distingan los niveles)
    for (let ix = 0; ix <= nx; ix++) {
      for (let iz = 0; iz <= nz; iz++) {
        for (let k = 1; k <= pisos; k++) {
          const id = `s_ml_col_${ix}_${iz}_${k}`;
          newSegs[id] = { id, nodeAId: nid(ix, iz, k - 1), nodeBId: nid(ix, iz, k), profileId: colProf, rolEstructural: 'columna' };
        }
      }
    }
    // Vigas por nivel (entrepisos y techo)
    for (let k = 1; k <= pisos; k++) {
      const esTecho = k === pisos;
      // Vigas en X (principales)
      for (let ix = 1; ix <= nx; ix++) {
        for (let iz = 0; iz <= nz; iz++) {
          const id = `s_ml_vx_${ix}_${iz}_${k}`;
          newSegs[id] = { id, nodeAId: nid(ix - 1, iz, k), nodeBId: nid(ix, iz, k), profileId: vigaProf, rolEstructural: 'viga_principal' };
        }
      }
      // Vigas en Z (entrepiso = viga_secundaria; techo = correas para la cobertura)
      for (let iz = 1; iz <= nz; iz++) {
        for (let ix = 0; ix <= nx; ix++) {
          const id = `s_ml_vz_${ix}_${iz}_${k}`;
          newSegs[id] = { id, nodeAId: nid(ix, iz - 1, k), nodeBId: nid(ix, iz, k), profileId: esTecho ? correaProf : vigaProf, rolEstructural: esTecho ? 'correa' : 'viga_secundaria' };
        }
      }
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Generador de Techo Industrial con Linterna Cenital / Monitor de Ventilación
  const generateRoofMonitor = useCallback((
    luzM: number,
    largoM: number = 24,
    alturaColM: number = 5.0,
    pendientePct: number = 20,
    anchoMonitorM: number = 3.0,
    alturaMonitorM: number = 1.2,
    tipoTijeral: TipoTijeral = 'escalera_vierendeel',
    numTijerales: number = 5,
    orientacionTijeral: OrientacionTijeral = 'vertical'
  ) => {
    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};

    const colProf = INVENTARIO_PERFILES_TUBULARES[4]?.id || activeProfileId;
    const vigaProf = INVENTARIO_PERFILES_TUBULARES[0]?.id || activeProfileId;
    const correaProf = INVENTARIO_PERFILES_TUBULARES[2]?.id || activeProfileId;

    const hasLongitudinal = orientacionTijeral === 'horizontal' || orientacionTijeral === 'longitudinal' || orientacionTijeral === 'ambos' || orientacionTijeral === 'completo';

    const frames = Math.max(2, numTijerales || 5);
    const zStep = largoM / (frames - 1);
    const xMid = luzM / 2;
    const wMon = Math.min(anchoMonitorM || 3.0, luzM * 0.40);
    const xMonL = xMid - wMon / 2;
    const xMonR = xMid + wMon / 2;

    const tanA = (pendientePct || 20) / 100;
    const yEave = alturaColM;
    const yRoofAtMonL = yEave + xMonL * tanA;
    const yRoofAtMonR = yRoofAtMonL;
    const yMonPeak = yRoofAtMonL + (alturaMonitorM || 1.2);

    let prevMonitorTopNodes: string[] = [];

    for (let f = 0; f < frames; f++) {
      const z = f * zStep;

      // 1. Columnas exteriores
      const cLB = `n_mon_col_lb_${f}`;
      const cLT = `n_mon_col_lt_${f}`;
      const cRB = `n_mon_col_rb_${f}`;
      const cRT = `n_mon_col_rt_${f}`;

      newNodes[cLB] = { id: cLB, x: 0, y: 0, z, isFixedSupport: true, nodeLabel: `MON-COL-L-B-${f+1}` };
      newNodes[cLT] = { id: cLT, x: 0, y: yEave, z, nodeLabel: `MON-COL-L-T-${f+1}` };
      newNodes[cRB] = { id: cRB, x: luzM, y: 0, z, isFixedSupport: true, nodeLabel: `MON-COL-R-B-${f+1}` };
      newNodes[cRT] = { id: cRT, x: luzM, y: yEave, z, nodeLabel: `MON-COL-R-T-${f+1}` };

      newSegs[`s_mon_col_l_${f}`] = { id: `s_mon_col_l_${f}`, nodeAId: cLB, nodeBId: cLT, profileId: colProf, rolEstructural: 'columna' };
      newSegs[`s_mon_col_r_${f}`] = { id: `s_mon_col_r_${f}`, nodeAId: cRB, nodeBId: cRT, profileId: colProf, rolEstructural: 'columna' };

      // 2. Faldones principales hasta la abertura del monitor
      const nMonL = `n_mon_base_l_${f}`;
      const nMonR = `n_mon_base_r_${f}`;
      newNodes[nMonL] = { id: nMonL, x: xMonL, y: yRoofAtMonL, z, nodeLabel: `MON-BASE-L-${f+1}` };
      newNodes[nMonR] = { id: nMonR, x: xMonR, y: yRoofAtMonR, z, nodeLabel: `MON-BASE-R-${f+1}` };

      newSegs[`s_mon_cs_l_${f}`] = { id: `s_mon_cs_l_${f}`, nodeAId: cLT, nodeBId: nMonL, profileId: vigaProf, rolEstructural: 'cordon_superior' };
      newSegs[`s_mon_cs_r_${f}`] = { id: `s_mon_cs_r_${f}`, nodeAId: cRT, nodeBId: nMonR, profileId: vigaProf, rolEstructural: 'cordon_superior' };

      // Tirante inferior de pórtico principal
      newSegs[`s_mon_tie_${f}`] = { id: `s_mon_tie_${f}`, nodeAId: cLT, nodeBId: cRT, profileId: vigaProf, rolEstructural: 'cordon_inferior' };

      // Montantes y diagonales en vanos laterales
      const nTieMonL = `n_mon_tiel_${f}`;
      const nTieMonR = `n_mon_tier_${f}`;
      newNodes[nTieMonL] = { id: nTieMonL, x: xMonL, y: yEave, z, nodeLabel: `MON-TIE-L-${f+1}` };
      newNodes[nTieMonR] = { id: nTieMonR, x: xMonR, y: yEave, z, nodeLabel: `MON-TIE-R-${f+1}` };

      newSegs[`s_mon_web_mon_l_${f}`] = { id: `s_mon_web_mon_l_${f}`, nodeAId: nTieMonL, nodeBId: nMonL, profileId: vigaProf, rolEstructural: 'montante' };
      newSegs[`s_mon_web_mon_r_${f}`] = { id: `s_mon_web_mon_r_${f}`, nodeAId: nTieMonR, nodeBId: nMonR, profileId: vigaProf, rolEstructural: 'montante' };

      if (tipoTijeral !== 'escalera_vierendeel') {
        newSegs[`s_mon_diag_l_${f}`] = { id: `s_mon_diag_l_${f}`, nodeAId: cLT, nodeBId: nMonL, profileId: vigaProf, rolEstructural: 'diagonal' };
        newSegs[`s_mon_diag_r_${f}`] = { id: `s_mon_diag_r_${f}`, nodeAId: cRT, nodeBId: nMonR, profileId: vigaProf, rolEstructural: 'diagonal' };
      }

      // 3. Monitor / Linterna Elevada de Ventilación
      const nMonTopL = `n_mon_top_l_${f}`;
      const nMonTopR = `n_mon_top_r_${f}`;
      const nMonApex = `n_mon_apex_${f}`;

      newNodes[nMonTopL] = { id: nMonTopL, x: xMonL - 0.25, y: yMonPeak - 0.20, z, nodeLabel: `MON-TL-${f+1}` };
      newNodes[nMonTopR] = { id: nMonTopR, x: xMonR + 0.25, y: yMonPeak - 0.20, z, nodeLabel: `MON-TR-${f+1}` };
      newNodes[nMonApex] = { id: nMonApex, x: xMid, y: yMonPeak + 0.15, z, nodeLabel: `MON-APEX-${f+1}` };

      // Postes verticales del monitor
      newSegs[`s_mon_post_l_${f}`] = { id: `s_mon_post_l_${f}`, nodeAId: nMonL, nodeBId: nMonTopL, profileId: vigaProf, rolEstructural: 'montante' };
      newSegs[`s_mon_post_r_${f}`] = { id: `s_mon_post_r_${f}`, nodeAId: nMonR, nodeBId: nMonTopR, profileId: vigaProf, rolEstructural: 'montante' };

      // Sobre-techo a dos aguas de la linterna
      newSegs[`s_mon_roof_l_${f}`] = { id: `s_mon_roof_l_${f}`, nodeAId: nMonTopL, nodeBId: nMonApex, profileId: vigaProf, rolEstructural: 'cordon_superior' };
      newSegs[`s_mon_roof_r_${f}`] = { id: `s_mon_roof_r_${f}`, nodeAId: nMonTopR, nodeBId: nMonApex, profileId: vigaProf, rolEstructural: 'cordon_superior' };

      // Correas longitudinales
      const currMonNodes = [cLT, nMonL, nMonTopL, nMonApex, nMonTopR, nMonR, cRT];
      if (f > 0 && prevMonitorTopNodes.length === currMonNodes.length) {
        for (let i = 0; i < currMonNodes.length; i++) {
          newSegs[`s_mon_correa_${f}_${i}`] = {
            id: `s_mon_correa_${f}_${i}`,
            nodeAId: prevMonitorTopNodes[i],
            nodeBId: currMonNodes[i],
            profileId: correaProf,
            rolEstructural: 'correa'
          };
        }

        if (hasLongitudinal) {
          if (tipoTijeral !== 'escalera_vierendeel' && tipoTijeral !== 'simple_arco') {
            const sLd1 = `s_mon_long_diag_l_${f}`;
            const sLd2 = `s_mon_long_diag_r_${f}`;
            newSegs[sLd1] = { id: sLd1, nodeAId: prevMonitorTopNodes[1], nodeBId: currMonNodes[3], profileId: vigaProf, rolEstructural: 'diagonal' };
            newSegs[sLd2] = { id: sLd2, nodeAId: prevMonitorTopNodes[5], nodeBId: currMonNodes[3], profileId: vigaProf, rolEstructural: 'diagonal' };
          }
        }
      }
      prevMonitorTopNodes = currMonNodes;
    }

    setNodes(newNodes);
    setSegments(newSegs);
    pushHistory(newNodes, newSegs, coverageZones);
  }, [activeProfileId, pushHistory, coverageZones]);

  // Deshacer / Rehacer
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const snapshot = history[prevIdx];
      setNodes(snapshot.nodes);
      setSegments(snapshot.segments);
      setCoverageZones(snapshot.coverageZones);
      setHistoryIndex(prevIdx);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const snapshot = history[nextIdx];
      setNodes(snapshot.nodes);
      setSegments(snapshot.segments);
      setCoverageZones(snapshot.coverageZones);
      setHistoryIndex(nextIdx);
    }
  }, [history, historyIndex]);

  // Importar Geometría desde Modelo Parseado de AutoCAD DXF
  const importDxfModel = useCallback((dxfModel: any, scale: number = 1.0) => {
    if (!dxfModel || !Array.isArray(dxfModel.entities)) return;

    const newNodes: Record<string, Node3D> = {};
    const newSegs: Record<string, Segment3D> = {};
    const defaultProfile = activeProfileId || INVENTARIO_PERFILES_TUBULARES[0]?.id || 'prof_sq_2x2_2mm';

    const getOrAddDxfNode = (rawX: number, rawY: number, rawZ: number = 0, isFixed: boolean = false): string => {
      const scaledX = Number((rawX * scale).toFixed(3));
      const scaledY = Number((rawY * scale).toFixed(3));
      const scaledZ = Number((rawZ * scale).toFixed(3));

      const existing = Object.values(newNodes).find(n => {
        const dx = n.x - scaledX;
        const dy = n.y - scaledY;
        const dz = (n.z || 0) - scaledZ;
        return Math.hypot(dx, dy, dz) < 0.05;
      });

      if (existing) {
        if (isFixed) existing.isFixedSupport = true;
        return existing.id;
      }

      const id = `node_dxf_${Date.now()}_${Math.floor(Math.random() * 1000)}_${Object.keys(newNodes).length + 1}`;
      newNodes[id] = {
        id,
        x: scaledX,
        y: scaledY,
        z: scaledZ,
        isFixedSupport: isFixed || scaledY === 0,
        nodeLabel: `DXF-${Object.keys(newNodes).length + 1}`
      };
      return id;
    };

    const getRolFromLayer = (layerName: string): RolEstructuralSegmento => {
      const l = (layerName || '').toUpperCase();
      if (l.includes('COL') || l.includes('PILAR') || l.includes('POSTE')) return 'columna';
      if (l.includes('COR') || l.includes('PURLIN') || l.includes('LATH')) return 'correa';
      if (l.includes('SUP') || l.includes('TOP') || l.includes('ARCO') || l.includes('TECHO')) return 'cordon_superior';
      if (l.includes('INF') || l.includes('BOT') || l.includes('TIR') || l.includes('TIE')) return 'cordon_inferior';
      if (l.includes('MON') || l.includes('VERT') || l.includes('STRUT')) return 'montante';
      if (l.includes('DIAG') || l.includes('BRACE') || l.includes('CEL')) return 'diagonal';
      if (l.includes('ARR') || l.includes('SAN') || l.includes('CRUZ')) return 'arriostre';
      if (l.includes('DECK') || l.includes('PISO') || l.includes('SLAB')) return 'piso_deck';
      return 'viga_principal';
    };

    dxfModel.entities.forEach((entity: any, idx: number) => {
      const rol = getRolFromLayer(entity.layer || '');

      if (entity.type === 'LINE') {
        const nAId = getOrAddDxfNode(entity.start.x, entity.start.y, entity.start.z || 0);
        const nBId = getOrAddDxfNode(entity.end.x, entity.end.y, entity.end.z || 0);
        if (nAId !== nBId) {
          const segId = `seg_dxf_${Date.now()}_${idx}`;
          newSegs[segId] = {
            id: segId,
            nodeAId: nAId,
            nodeBId: nBId,
            profileId: defaultProfile,
            rolEstructural: rol
          };
        }
      } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
        const verts = entity.vertices || [];
        for (let v = 0; v < verts.length - 1; v++) {
          const nAId = getOrAddDxfNode(verts[v].x, verts[v].y, verts[v].z || 0);
          const nBId = getOrAddDxfNode(verts[v + 1].x, verts[v + 1].y, verts[v + 1].z || 0);
          if (nAId !== nBId) {
            const segId = `seg_dxf_${Date.now()}_${idx}_${v}`;
            newSegs[segId] = {
              id: segId,
              nodeAId: nAId,
              nodeBId: nBId,
              profileId: defaultProfile,
              rolEstructural: rol
            };
          }
        }
        if (entity.isClosed && verts.length > 2) {
          const nAId = getOrAddDxfNode(verts[verts.length - 1].x, verts[verts.length - 1].y, verts[verts.length - 1].z || 0);
          const nBId = getOrAddDxfNode(verts[0].x, verts[0].y, verts[0].z || 0);
          if (nAId !== nBId) {
            const segId = `seg_dxf_${Date.now()}_${idx}_close`;
            newSegs[segId] = {
              id: segId,
              nodeAId: nAId,
              nodeBId: nBId,
              profileId: defaultProfile,
              rolEstructural: rol
            };
          }
        }
      } else if (entity.type === 'ARC') {
        const numDivs = 8;
        const rad = entity.radius || 1.0;
        const startRad = ((entity.startAngleDeg || 0) * Math.PI) / 180;
        let endRad = ((entity.endAngleDeg || 360) * Math.PI) / 180;
        if (endRad < startRad) endRad += 2 * Math.PI;

        const arcNodeIds: string[] = [];
        for (let a = 0; a <= numDivs; a++) {
          const theta = startRad + (a / numDivs) * (endRad - startRad);
          const ax = entity.center.x + rad * Math.cos(theta);
          const ay = entity.center.y + rad * Math.sin(theta);
          const az = entity.center.z || 0;
          arcNodeIds.push(getOrAddDxfNode(ax, ay, az));
        }

        for (let a = 0; a < arcNodeIds.length - 1; a++) {
          if (arcNodeIds[a] !== arcNodeIds[a + 1]) {
            const segId = `seg_dxf_arc_${Date.now()}_${idx}_${a}`;
            newSegs[segId] = {
              id: segId,
              nodeAId: arcNodeIds[a],
              nodeBId: arcNodeIds[a + 1],
              profileId: defaultProfile,
              rolEstructural: 'cordon_superior'
            };
          }
        }
      }
    });

    setNodes(newNodes);
    setSegments(newSegs);
    setCoverageZones({});
    setSelectedElementIds([]);
    pushHistory(newNodes, newSegs, {});
  }, [activeProfileId, pushHistory]);

  // Exportar Escena a Formato AutoCAD DXF (.dxf)
  const exportDxf = useCallback((projectName: string = 'Techo_Innova'): string => {
    const linesToExport: { x1: number; y1: number; z1?: number; x2: number; y2: number; z2?: number; layer?: string }[] = [];
    Object.values(segments).forEach(seg => {
      const nA = nodes[seg.nodeAId];
      const nB = nodes[seg.nodeBId];
      if (nA && nB) {
        linesToExport.push({
          x1: nA.x,
          y1: nA.y,
          z1: nA.z || 0,
          x2: nB.x,
          y2: nB.y,
          z2: nB.z || 0,
          layer: seg.rolEstructural
        });
      }
    });
    return generateDxfContent(linesToExport, projectName);
  }, [nodes, segments]);

  // Cálculo en tiempo real de Reporte BOM Presupuestario
  const bomReport = useMemo(() => {
    // Las columnas de concreto existentes NO se cuentan como acero (ya están
    // construidas). Se excluyen del despiece/costo de acero, pero siguen
    // dibujándose y conservan su placa base + pernos (que sí se cotizan, pues
    // dependen de los nodos, no del tramo).
    const segmentosAcero = Object.fromEntries(
      Object.entries(segments).filter(([, s]) => s.rolEstructural !== 'columna_concreto')
    ) as typeof segments;
    return generarReportePresupuestoBom(nodes, segmentosAcero, coverageZones);
  }, [nodes, segments, coverageZones]);

  // Cálculo de Análisis Estructural segun RNE E.020, E.030, E.090
  const structuralReport: StructuralAnalysisReport = useMemo(() => {
    const totalWeightKg = bomReport.despiecePerfiles.reduce((acc, p) => acc + p.totalPesoAceroKg, 0);

    const qTotalKgM2 = structuralInputs.cargaMuertaKgM2 + structuralInputs.cargaVivaKgM2;
    const reaccionBasekN = (totalWeightKg * 9.81 / 1000) + (qTotalKgM2 * 0.05);

    const miembrosResult = Object.values(segments).map(seg => {
      const nA = nodes[seg.nodeAId];
      const nB = nodes[seg.nodeBId];
      let lengthM = 3.0;
      if (nA && nB) {
        const dz = (nB.z || 0) - (nA.z || 0);
        lengthM = Math.sqrt(Math.pow(nB.x - nA.x, 2) + Math.pow(nB.y - nA.y, 2) + Math.pow(dz, 2)) || 3.0;
      }

      // Estimación de esfuerzo flector y deflexión segun tipo
      const qLineaN_m = (qTotalKgM2 * 2.0) * 9.81; // 2m tributario
      const MmaxkNm = (qLineaN_m * Math.pow(lengthM, 2)) / (8 * 1000);
      const VmaxkN = (qLineaN_m * lengthM) / (2 * 1000);

      // Deflexión L/240
      const deflexionMm = Math.min((5 * qLineaN_m * Math.pow(lengthM * 1000, 4)) / (384 * 200000 * 500000), 25);
      const deflexionAdmisibleMm = (lengthM * 1000) / 240;

      const FyMpa = 250; // ASTM A36
      const esfuerzoMaxMPa = (MmaxkNm * 1000) / 40.0; // Z = 40cm3
      const esfuerzoAdmisibleMPa = 0.6 * FyMpa; // 150 MPa

      const ratioDC = Math.min(esfuerzoMaxMPa / esfuerzoAdmisibleMPa, 1.2);

      return {
        segmentId: seg.id,
        rolEstructural: seg.rolEstructural,
        longitudM: Number(lengthM.toFixed(2)),
        fuerzaAxialkN: Number((VmaxkN * 0.8).toFixed(2)),
        momentoFlectorMaxkNm: Number(MmaxkNm.toFixed(2)),
        fuerzaCortantekN: Number(VmaxkN.toFixed(2)),
        deflexionMaxMm: Number(deflexionMm.toFixed(1)),
        deflexionAdmisibleMm: Number(deflexionAdmisibleMm.toFixed(1)),
        esfuerzoMaxMPa: Number(esfuerzoMaxMPa.toFixed(1)),
        esfuerzoAdmisibleMPa,
        ratioDemandaCapacidad: Number(ratioDC.toFixed(2)),
        estadoCumplimiento: ratioDC <= 1.0 ? ('CUMPLE' as const) : ('SOBRECARGADO' as const)
      };
    });

    const maxRatio = miembrosResult.reduce((max, m) => Math.max(max, m.ratioDemandaCapacidad), 0.2);

    return {
      normativaReferencia: 'RNE E.020 Cargas / E.030 Sismo / E.090 Estructuras Metálicas (Perú)',
      pesoPropioTotalKg: Math.round(totalWeightKg),
      reaccionTotalBasekN: Number(reaccionBasekN.toFixed(2)),
      deflexionMaximaGlobalMm: Number((maxRatio * 12).toFixed(1)),
      ratioDemandaCapacidadMax: Number(maxRatio.toFixed(2)),
      resultadoGlobal: maxRatio <= 1.0 ? 'CUMPLE' : 'REQUIERE_REFUERZO',
      miembros: miembrosResult
    };
  }, [nodes, segments, bomReport, structuralInputs]);

  return {
    nodes,
    segments,
    coverageZones,
    copySelectedElements,
    pasteElements,
    canPaste: !!cadClipboard,
    activeTool,
    setActiveTool,
    selectedElementIds,
    setSelectedElementIds,
    activeProfileId,
    setActiveProfileId,
    activeCoverageId,
    setActiveCoverageId,
    snapGridSizeM,
    setSnapGridSizeM,
    snapEnabled,
    setSnapEnabled,
    addNode,
    splitSegmentAtPoint,
    addSegment,
    addCoverageZone,
    addRectangle,
    addArcBetweenPoints,
    updateNodeCoords,
    moveNodeWithColumn,
    deleteSegmentsByIds,
    saveHistorySnapshot,
    updateSegmentProfile,
    updateMultipleSegmentsProfile,
    deleteSelectedElements,
    clearScene,
    loadScene,
    assignProfileToSelectedSegments,
    assignCoverageToSelectedZones,
    generateTrussFreehand,
    generateRoofGable,
    generateRoofMonoslope,
    generateRoofParabolic,
    generateRoofSawtooth,
    generateRoofHip,
    generateRoof6Aguas,
    generateRoofMansarda,
    generateRoofDome,
    generateRoofLShaped,
    generateRoofButterfly,
    generateRoofCurvoAutoportante,
    generateRoofMarquesina,
    generateRoofTijeralCurvo,
    generateMultinivel,
    generateRoofMonitor,
    addInternalTruss,
    generateMezzanine,
    bomReport,
    structuralReport,
    structuralInputs,
    setStructuralInputs,
    globalPaintColor,
    setGlobalPaintColor,
    updateNodeAnchorBolts,
    importDxfModel,
    exportDxf,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo
  };
}
