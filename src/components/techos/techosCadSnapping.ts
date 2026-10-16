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
  | 'origin'
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
  enableOrigin?: boolean;
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
    enableGrid = true,
    enableOrigin = true
  } = options;

  // Tolerancia de imán PRECISA (estilo Herrería): el radio se expresa en píxeles
  // y se convierte a mundo dividiendo por la escala, por lo que SE ENCOGE al hacer
  // zoom-in (más precisión) y es más tolerante al alejar. Con TOPE pequeño para que
  // el nodo caiga donde está el dedo/cursor y nunca "salte" a un elemento lejano.
  //  - hardRadiusM  → snaps "duros" (nodo/extremo, origen, cierre de perímetro):
  //                   son puntos de conexión intencionales; tope 0.18 m, piso 0.06 m.
  //  - softRadiusM  → snaps "suaves" (punto medio, intersección, cuerpo de barra):
  //                   más chico (65%) para que no se peguen cuando solo pasas cerca.
  const hardRadiusM = Math.min(0.18, Math.max(0.06, magneticRadiusPx / Math.max(scale, 1)));
  const softRadiusM = hardRadiusM * 0.65;
  const candidateSnaps: CadSnapResult[] = [];

  const allNodes = Object.values(nodes);
  const allSegments = Object.values(segments);

  // 0. SNAP AL ORIGEN (0,0) — punto de referencia del plano, siempre disponible
  //    para empezar a dibujar exactamente en el punto cero.
  if (enableOrigin) {
    const distOrigin = Math.hypot(worldCursor.x - 0, worldCursor.y - 0);
    if (distOrigin <= hardRadiusM) {
      const origin3D = point2DTo3D({ x: 0, y: 0 }, vista);
      candidateSnaps.push({
        x: origin3D.x,
        y: origin3D.y,
        z: origin3D.z,
        projX: 0,
        projY: 0,
        tipo: 'origin',
        label: '⊙ ORIGEN (0, 0)',
        distanceWorld: distOrigin,
        distancePx: distOrigin * scale
      });
    }
  }

  // 1. EVALUAR SNAPS A NODO / EXTREMO (ENDPOINTS & CLOSING PERIMETER)
  if (enableEndpoints) {
    for (const node of allNodes) {
      const p2d = nodeTo2D(node, vista);
      const dist = Math.hypot(worldCursor.x - p2d.x, worldCursor.y - p2d.y);

      if (dist <= hardRadiusM) {
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
          if (dist <= softRadiusM) {
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

      if (dist <= softRadiusM) {
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

      if (proj.isInside && proj.distance <= softRadiusM) {
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

  // SELECCIÓN ESTILO HERRERÍA: el punto debe caer DONDE ESTÁ EL CURSOR.
  // Por eso NO se prioriza por tipo sobre la cercanía (eso hacía que el nodo
  // "saltara" a un punto medio/barra lejana). En su lugar:
  //   - Los snaps "duros" (cerrar perímetro, nodo/extremo, origen) son puntos de
  //     conexión intencionales: si hay alguno en rango, gana el MÁS CERCANO de ellos
  //     (y 'close_loop' siempre por encima para poder cerrar polígonos).
  //   - Si no hay ninguno duro, gana el snap suave MÁS CERCANO (punto medio /
  //     intersección / cuerpo de barra).
  if (candidateSnaps.length > 0) {
    const DUROS = new Set<TipoSnapCad>(['close_loop', 'endpoint', 'origin']);
    const duros = candidateSnaps.filter(c => DUROS.has(c.tipo));
    const pool = duros.length > 0 ? duros : candidateSnaps;

    pool.sort((a, b) => {
      // 'close_loop' (cerrar perímetro) siempre primero dentro de los duros.
      const closeDiff = (a.tipo === 'close_loop' ? 0 : 1) - (b.tipo === 'close_loop' ? 0 : 1);
      if (closeDiff !== 0) return closeDiff;
      // Lo demás: el más cercano al cursor.
      return a.distanceWorld - b.distanceWorld;
    });

    return pool[0];
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
