// Motor Matemático de Snapping Avanzado y Detección Geométrica para CAD 2D de Techos Metálicos
// Soporta O-Snaps: Vértices/Extremos, Puntos Medios, Intersecciones Exactas, Proyección Perpendicular y Cierre de Perímetros

import { Node3D, Segment3D, VistaTechoCAD } from './techosCadEngineTypes';

export type TipoSnapCad = 
  | 'endpoint'
  | 'midpoint'
  | 'intersection'
  | 'perpendicular'
  | 'nearest_edge'
  | 'close_loop'
  | 'grid';

export interface CadSnapResult {
  x: number;
  y: number;
  z: number;
  projX: number;
  projY: number;
  tipo: TipoSnapCad;
  nodeId?: string;
  segmentId?: string;
  segmentIdB?: string;
  isClosingPerimeter?: boolean;
  label: string;
  distanceWorld: number;
  distancePx: number;
}

export interface SnapOptions {
  snapEnabled?: boolean;
  snapGridSizeM?: number;
  magneticRadiusPx?: number;
  toleranceM?: number;
  enableEndpoints?: boolean;
  enableMidpoints?: boolean;
  enableIntersections?: boolean;
  enablePerpendicular?: boolean;
  enableGrid?: boolean;
}

/**
 * Convierte coordenadas 3D a coordenadas 2D según la vista activa
 */
export function nodeTo2D(node: Node3D, vista: VistaTechoCAD): { x: number; y: number } {
  return {
    x: node.x,
    y: vista === 'planta' ? (node.z || 0) : node.y
  };
}

/**
 * Convierte coordenadas 2D proyectadas de vuelta a 3D según la vista y una elevación/profundidad de referencia
 */
export function point2DTo3D(
  p2d: { x: number; y: number }, 
  vista: VistaTechoCAD, 
  referenceZ: number = 0, 
  referenceY: number = 4.0
): { x: number; y: number; z: number } {
  if (vista === 'planta') {
    return {
      x: Number(p2d.x.toFixed(3)),
      y: Number(referenceY.toFixed(3)),
      z: Number(p2d.y.toFixed(3))
    };
  } else {
    return {
      x: Number(p2d.x.toFixed(3)),
      y: Number(p2d.y.toFixed(3)),
      z: Number(referenceZ.toFixed(3))
    };
  }
}

/**
 * Calcula la proyección ortogonal de un punto sobre un segmento de línea en 2D
 */
export function getPointProjectedOnSegment2D(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number
): { t: number; projX: number; projY: number; distance: number; isInside: boolean } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-9) {
    const dist = Math.hypot(px - x1, py - y1);
    return { t: 0, projX: x1, projY: y1, distance: dist, isInside: true };
  }

  // Parámetro de proyección t = ((P - A) · (B - A)) / |B - A|²
  const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = x1 + clampedT * dx;
  const projY = y1 + clampedT * dy;
  const distance = Math.hypot(px - projX, py - projY);

  return {
    t: clampedT,
    projX: Number(projX.toFixed(3)),
    projY: Number(projY.toFixed(3)),
    distance,
    isInside: t >= 0.05 && t <= 0.95 // Dentro del cuerpo del segmento (no en los extremos)
  };
}

/**
 * Calcula la intersección matemática exacta entre dos segmentos de línea 2D
 */
export function getLineIntersection2D(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): { x: number; y: number; t: number; u: number } | null {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-9) {
    return null; // Líneas paralelas o colineales
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  // Intersección válida dentro de ambos segmentos (con pequeña tolerancia)
  if (ua >= -0.001 && ua <= 1.001 && ub >= -0.001 && ub <= 1.001) {
    const ix = x1 + ua * (x2 - x1);
    const iy = y1 + ua * (y2 - y1);
    return {
      x: Number(ix.toFixed(3)),
      y: Number(iy.toFixed(3)),
      t: ua,
      u: ub
    };
  }

  return null;
}

/**
 * Evalúa todos los candidatos de Snap en la escena CAD y devuelve el punto de anclaje más preciso y prioritario
 */
export function calculateBestCadSnap(
  worldCursor: { x: number; y: number },
  nodes: Record<string, Node3D>,
  segments: Record<string, Segment3D>,
  vista: VistaTechoCAD,
  scale: number,
  drawingStartNodeId: string | null = null,
  chainFirstNodeId: string | null = null,
  options: SnapOptions = {}
): CadSnapResult {
  const {
    snapEnabled = true,
    snapGridSizeM = 0.25,
    magneticRadiusPx = 28,
    enableEndpoints = true,
    enableMidpoints = true,
    enableIntersections = true,
    enablePerpendicular = true,
    enableGrid = true
  } = options;

  const magneticRadiusM = Math.max(0.35, magneticRadiusPx / Math.max(scale, 1));
  const candidateSnaps: CadSnapResult[] = [];

  const allNodes = Object.values(nodes);
  const allSegments = Object.values(segments);

  // 1. EVALUAR SNAPS A NODO / EXTREMO (ENDPOINTS & CLOSING PERIMETER)
  if (enableEndpoints) {
    for (const node of allNodes) {
      const p2d = nodeTo2D(node, vista);
      const dist = Math.hypot(worldCursor.x - p2d.x, worldCursor.y - p2d.y);

      if (dist <= magneticRadiusM) {
        // ¿Es el nodo que cierra el perímetro del polígono o cercha?
        const isClosing = Boolean(
          drawingStartNodeId &&
          chainFirstNodeId &&
          node.id === chainFirstNodeId &&
          drawingStartNodeId !== node.id
        );

        candidateSnaps.push({
          x: node.x,
          y: node.y,
          z: node.z || 0,
          projX: p2d.x,
          projY: p2d.y,
          tipo: isClosing ? 'close_loop' : 'endpoint',
          nodeId: node.id,
          isClosingPerimeter: isClosing,
          label: isClosing 
            ? `🟢 CERRAR PERÍMETRO (${node.nodeLabel || node.id})`
            : `SNAP NODO (${node.nodeLabel || node.id})`,
          distanceWorld: dist,
          distancePx: dist * scale
        });
      }
    }
  }

  // 2. EVALUAR SNAPS A INTERSECCIÓN ENTRE SEGMENTOS (INTERSECTIONS)
  if (enableIntersections && allSegments.length >= 2) {
    for (let i = 0; i < allSegments.length; i++) {
      const segA = allSegments[i];
      const nA1 = nodes[segA.nodeAId];
      const nA2 = nodes[segA.nodeBId];
      if (!nA1 || !nA2) continue;

      const pA1 = nodeTo2D(nA1, vista);
      const pA2 = nodeTo2D(nA2, vista);

      for (let j = i + 1; j < allSegments.length; j++) {
        const segB = allSegments[j];
        const nB1 = nodes[segB.nodeAId];
        const nB2 = nodes[segB.nodeBId];
        if (!nB1 || !nB2) continue;

        // Saltar segmentos que ya comparten nodo en el extremo
        if (segA.nodeAId === segB.nodeAId || segA.nodeAId === segB.nodeBId ||
            segA.nodeBId === segB.nodeAId || segA.nodeBId === segB.nodeBId) {
          continue;
        }

        const pB1 = nodeTo2D(nB1, vista);
        const pB2 = nodeTo2D(nB2, vista);

        const inter = getLineIntersection2D(
          pA1.x, pA1.y, pA2.x, pA2.y,
          pB1.x, pB1.y, pB2.x, pB2.y
        );

        if (inter) {
          const dist = Math.hypot(worldCursor.x - inter.x, worldCursor.y - inter.y);
          if (dist <= magneticRadiusM) {
            // Interpolar coordenada 3D
            const zInter = vista === 'planta' ? inter.y : ((nA1.z || 0) + (nA2.z || 0)) / 2;
            const yInter = vista === 'seccion' ? inter.y : ((nA1.y) + (nA2.y)) / 2;

            candidateSnaps.push({
              x: inter.x,
              y: yInter,
              z: zInter,
              projX: inter.x,
              projY: inter.y,
              tipo: 'intersection',
              segmentId: segA.id,
              segmentIdB: segB.id,
              label: `✕ INTERSECCIÓN BARRAS`,
              distanceWorld: dist,
              distancePx: dist * scale
            });
          }
        }
      }
    }
  }

  // 3. EVALUAR SNAPS A PUNTO MEDIO DE BARRAS (MIDPOINTS)
  if (enableMidpoints) {
    for (const seg of allSegments) {
      const n1 = nodes[seg.nodeAId];
      const n2 = nodes[seg.nodeBId];
      if (!n1 || !n2) continue;

      const p1 = nodeTo2D(n1, vista);
      const p2 = nodeTo2D(n2, vista);

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const dist = Math.hypot(worldCursor.x - midX, worldCursor.y - midY);

      if (dist <= magneticRadiusM) {
        const mid3D = {
          x: (n1.x + n2.x) / 2,
          y: (n1.y + n2.y) / 2,
          z: ((n1.z || 0) + (n2.z || 0)) / 2
        };

        candidateSnaps.push({
          x: Number(mid3D.x.toFixed(3)),
          y: Number(mid3D.y.toFixed(3)),
          z: Number(mid3D.z.toFixed(3)),
          projX: Number(midX.toFixed(3)),
          projY: Number(midY.toFixed(3)),
          tipo: 'midpoint',
          segmentId: seg.id,
          label: `▲ PUNTO MEDIO (${seg.rolEstructural.replace('_', ' ')})`,
          distanceWorld: dist,
          distancePx: dist * scale
        });
      }
    }
  }

  // 4. EVALUAR SNAPS A CUERPO DE SEGMENTO / PERPENDICULAR (NEAREST EDGE)
  if (enablePerpendicular) {
    for (const seg of allSegments) {
      const n1 = nodes[seg.nodeAId];
      const n2 = nodes[seg.nodeBId];
      if (!n1 || !n2) continue;

      const p1 = nodeTo2D(n1, vista);
      const p2 = nodeTo2D(n2, vista);

      const proj = getPointProjectedOnSegment2D(worldCursor.x, worldCursor.y, p1.x, p1.y, p2.x, p2.y);

      if (proj.isInside && proj.distance <= magneticRadiusM * 0.85) {
        // Interpolar en 3D con el factor t
        const x3D = n1.x + proj.t * (n2.x - n1.x);
        const y3D = n1.y + proj.t * (n2.y - n1.y);
        const z3D = (n1.z || 0) + proj.t * ((n2.z || 0) - (n1.z || 0));

        candidateSnaps.push({
          x: Number(x3D.toFixed(3)),
          y: Number(y3D.toFixed(3)),
          z: Number(z3D.toFixed(3)),
          projX: proj.projX,
          projY: proj.projY,
          tipo: 'nearest_edge',
          segmentId: seg.id,
          label: `⟂ ANCLAJE A BARRA (${seg.rolEstructural.replace('_', ' ')})`,
          distanceWorld: proj.distance,
          distancePx: proj.distance * scale
        });
      }
    }
  }

  // JERARQUÍA DE PRIORIDAD CAD:
  // 1. Cierre de Perímetro (close_loop)
  // 2. Intersección (intersection)
  // 3. Vértice / Extremo (endpoint)
  // 4. Punto Medio (midpoint)
  // 5. Anclaje a Barra (nearest_edge)
  if (candidateSnaps.length > 0) {
    const priorityWeight: Record<TipoSnapCad, number> = {
      close_loop: 0,
      intersection: 1,
      endpoint: 2,
      midpoint: 3,
      perpendicular: 4,
      nearest_edge: 5,
      grid: 6
    };

    candidateSnaps.sort((a, b) => {
      const weightDiff = priorityWeight[a.tipo] - priorityWeight[b.tipo];
      if (weightDiff !== 0) return weightDiff;
      return a.distanceWorld - b.distanceWorld;
    });

    return candidateSnaps[0];
  }

  // 5. SNAP A RETÍCULA (GRID SNAP POR DEFECTO SI NO HAY NADA CERCA)
  let gridX = worldCursor.x;
  let gridY = worldCursor.y;

  if (snapEnabled && enableGrid && snapGridSizeM > 0) {
    gridX = Math.round(worldCursor.x / snapGridSizeM) * snapGridSizeM;
    gridY = Math.round(worldCursor.y / snapGridSizeM) * snapGridSizeM;
  }

  gridX = Number(gridX.toFixed(3));
  gridY = Number(gridY.toFixed(3));

  const def3D = point2DTo3D({ x: gridX, y: gridY }, vista);

  return {
    x: def3D.x,
    y: def3D.y,
    z: def3D.z,
    projX: gridX,
    projY: gridY,
    tipo: 'grid',
    label: `COORD (${gridX.toFixed(2)}, ${gridY.toFixed(2)})`,
    distanceWorld: 0,
    distancePx: 0
  };
}
