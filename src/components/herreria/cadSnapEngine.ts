// Motor de detección de referencias geométricas (SNAP) para Centro CAD de Herrería
import { PiezaCad } from './herreriaTypes';
import { PERFILES_CATALOGO } from './herreriaCatalog';

export interface SnapResult {
  x: number;
  y: number;
  type: 'endpoint' | 'midpoint' | 'intersection' | 'perpendicular' | 'segment' | 'joint' | 'grid' | 'ortho' | 'adjacent' | 'face' | 'none';
  label: string;
  sourcePieceId?: string;
  normalAngleDeg?: number;
}

export interface SnapOptions {
  snapEndpoints?: boolean;
  snapMidpoints?: boolean;
  snapIntersections?: boolean;
  snapSegments?: boolean;
  snapGrid?: boolean;
  snapAdjacent?: boolean;
  snapOrthoLock?: boolean;
  startPoint?: { x: number; y: number };
  currentProfileId?: string;
  gridStepM?: number;
}

// Redondear a decimales para evitar problemas de coma flotante (3 decimales = 1 milímetro exacto)
export function roundToPrecision(val: number, decimals: number = 3): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// Distancia euclidiana 2D
export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Encontrar punto más cercano en rejilla
export function snapToGrid(x: number, y: number, stepM: number = 0.05): { x: number; y: number } {
  return {
    x: roundToPrecision(Math.round(x / stepM) * stepM),
    y: roundToPrecision(Math.round(y / stepM) * stepM)
  };
}

// Intersección de dos segmentos de línea
export function getLineIntersection(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): { x: number; y: number } | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-6) return null; // Paralelas o colineales

  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    return {
      x: roundToPrecision(p1.x + u * (p2.x - p1.x)),
      y: roundToPrecision(p1.y + u * (p2.y - p1.y))
    };
  }
  return null;
}

// Búsqueda del mejor punto de Snap según proximidad, contacto milimétrico adyacente y estabilidad de agarre
export function findBestSnapPoint(
  rawWorldPt: { x: number; y: number },
  pieces: PiezaCad[],
  thresholdM: number = 0.06,
  options: SnapOptions = {
    snapEndpoints: true,
    snapMidpoints: true,
    snapIntersections: true,
    snapSegments: true,
    snapGrid: true,
    snapAdjacent: true,
    currentProfileId: 'rect-2x1-1.5',
    gridStepM: 0.05
  }
): SnapResult {
  let closestDist = thresholdM;
  let bestResult: SnapResult = {
    x: rawWorldPt.x,
    y: rawWorldPt.y,
    type: 'none',
    label: ''
  };

  // 1. Detección de Extremos (Endpoints / Vértices) - Máxima prioridad y anclaje firme
  if (options.snapEndpoints !== false && pieces.length > 0) {
    for (const p of pieces) {
      const d1 = distance2D(rawWorldPt.x, rawWorldPt.y, p.x1, p.y1);
      if (d1 < closestDist) {
        closestDist = d1;
        bestResult = {
          x: p.x1,
          y: p.y1,
          type: 'endpoint',
          label: 'Extremo / Vértice',
          sourcePieceId: p.id
        };
      }

      const d2 = distance2D(rawWorldPt.x, rawWorldPt.y, p.x2, p.y2);
      if (d2 < closestDist) {
        closestDist = d2;
        bestResult = {
          x: p.x2,
          y: p.y2,
          type: 'endpoint',
          label: 'Extremo / Vértice',
          sourcePieceId: p.id
        };
      }
    }
  }

  // 2. MONTAJE DE TUBO ADYACENTE MILIMÉTRICO (Contacto exacto cara con cara sin traslape)
  if (options.snapAdjacent !== false && pieces.length > 0) {
    const activeProfile = options.currentProfileId 
      ? PERFILES_CATALOGO.find(item => item.id === options.currentProfileId)
      : null;
    const wActive = (activeProfile ? (activeProfile.anchoMm || 50) : 50) / 1000;

    for (const p of pieces) {
      const dx = p.x2 - p.x1;
      const dy = p.y2 - p.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 1e-6) continue;

      const len = Math.sqrt(lenSq);
      const tx = dx / len;
      const ty = dy / len;
      const nx = -ty; // Normal unitaria perpendicular
      const ny = tx;

      const existingProfile = PERFILES_CATALOGO.find(item => item.id === p.perfilId);
      const wExisting = (existingProfile ? (existingProfile.anchoMm || 50) : 50) / 1000;

      // Distancia exacta entre centros baricéntricos para que las caras exteriores queden 100% en contacto al ras
      const dContact = roundToPrecision((wExisting + wActive) / 2, 4);

      // Evaluar ambos laterales (Normal positiva y Normal negativa)
      const sides = [1, -1];
      for (const sign of sides) {
        const offX = sign * dContact * nx;
        const offY = sign * dContact * ny;

        const adjP1 = { x: p.x1 + offX, y: p.y1 + offY };
        const adjP2 = { x: p.x2 + offX, y: p.y2 + offY };

        // Proyección longitudinal sobre la línea de contacto adyacente
        const vX = rawWorldPt.x - adjP1.x;
        const vY = rawWorldPt.y - adjP1.y;
        const t = (vX * tx + vY * ty) / len;

        // Si está en el rango longitudinal del tubo adyacente
        if (t >= -0.05 && t <= 1.05) {
          const clampedT = Math.max(0, Math.min(1, t));
          const projX = adjP1.x + clampedT * dx;
          const projY = adjP1.y + clampedT * dy;
          const dContactDist = distance2D(rawWorldPt.x, rawWorldPt.y, projX, projY);

          // Si el cursor está cerca del inicio o fin de la línea adyacente, anclar al extremo del tubo contiguo
          if (t <= 0.08) {
            const dStart = distance2D(rawWorldPt.x, rawWorldPt.y, adjP1.x, adjP1.y);
            if (dStart < closestDist * 1.1) {
              closestDist = dStart;
              bestResult = {
                x: roundToPrecision(adjP1.x, 3),
                y: roundToPrecision(adjP1.y, 3),
                type: 'adjacent',
                label: `Tubo Adyacente Extremo (${Math.round(dContact * 1000)}mm Cara con Cara)`,
                sourcePieceId: p.id
              };
              continue;
            }
          } else if (t >= 0.92) {
            const dEnd = distance2D(rawWorldPt.x, rawWorldPt.y, adjP2.x, adjP2.y);
            if (dEnd < closestDist * 1.1) {
              closestDist = dEnd;
              bestResult = {
                x: roundToPrecision(adjP2.x, 3),
                y: roundToPrecision(adjP2.y, 3),
                type: 'adjacent',
                label: `Tubo Adyacente Extremo (${Math.round(dContact * 1000)}mm Cara con Cara)`,
                sourcePieceId: p.id
              };
              continue;
            }
          }

          // Montaje adyacente deslizante a lo largo de la cara
          if (dContactDist < closestDist) {
            closestDist = dContactDist;
            bestResult = {
              x: roundToPrecision(projX, 3),
              y: roundToPrecision(projY, 3),
              type: 'adjacent',
              label: `Tubo Adyacente Milimétrico (${Math.round(dContact * 1000)}mm Cara a Cara)`,
              sourcePieceId: p.id
            };
          }
        }
      }
    }
  }

  // 3. Detección de Intersecciones entre piezas
  if (options.snapIntersections !== false && pieces.length > 1) {
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const inter = getLineIntersection(
          { x: pieces[i].x1, y: pieces[i].y1 },
          { x: pieces[i].x2, y: pieces[i].y2 },
          { x: pieces[j].x1, y: pieces[j].y1 },
          { x: pieces[j].x2, y: pieces[j].y2 }
        );
        if (inter) {
          const d = distance2D(rawWorldPt.x, rawWorldPt.y, inter.x, inter.y);
          if (d < closestDist) {
            closestDist = d;
            bestResult = {
              x: inter.x,
              y: inter.y,
              type: 'intersection',
              label: 'Intersección de Perfiles'
            };
          }
        }
      }
    }
  }

  // 4. Detección de Puntos Medios (Midpoints)
  if (options.snapMidpoints !== false && pieces.length > 0) {
    for (const p of pieces) {
      const mx = (p.x1 + p.x2) / 2;
      const my = (p.y1 + p.y2) / 2;
      const dm = distance2D(rawWorldPt.x, rawWorldPt.y, mx, my);
      if (dm < closestDist) {
        closestDist = dm;
        bestResult = {
          x: roundToPrecision(mx),
          y: roundToPrecision(my),
          type: 'midpoint',
          label: 'Punto Medio (Centro)',
          sourcePieceId: p.id
        };
      }
    }
  }

  // 5. Detección de Eje / Sobre Perfil (Nearest on Segment / Unión en T precisa)
  if (options.snapSegments !== false && pieces.length > 0) {
    for (const p of pieces) {
      const dx = p.x2 - p.x1;
      const dy = p.y2 - p.y1;
      const lenSq = dx * dx + dy * dy;
      if (lenSq > 1e-6) {
        let t = ((rawWorldPt.x - p.x1) * dx + (rawWorldPt.y - p.y1) * dy) / lenSq;
        // Sólo entre el 4% y 96% para no solapar con endpoints
        if (t >= 0.04 && t <= 0.96) {
          const projX = p.x1 + t * dx;
          const projY = p.y1 + t * dy;
          const dProj = distance2D(rawWorldPt.x, rawWorldPt.y, projX, projY);
          if (dProj < closestDist * 0.9) {
            closestDist = dProj;
            const angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
            bestResult = {
              x: roundToPrecision(projX),
              y: roundToPrecision(projY),
              type: 'segment',
              label: 'Unión Metálica (Eje de Perfil)',
              sourcePieceId: p.id,
              normalAngleDeg: angle + 90
            };
          }
        }
      }
    }
  }

  // 6. Si no encontró ningún objeto geométrico cercano, evaluar Rejilla
  if (bestResult.type === 'none' && options.snapGrid !== false) {
    const step = options.gridStepM || 0.05;
    const gridPt = snapToGrid(rawWorldPt.x, rawWorldPt.y, step);
    const dg = distance2D(rawWorldPt.x, rawWorldPt.y, gridPt.x, gridPt.y);
    if (dg < closestDist * 1.5) {
      bestResult = {
        x: gridPt.x,
        y: gridPt.y,
        type: 'grid',
        label: `Rejilla ${(step * 100).toFixed(0)}cm`
      };
    }
  }

  // 7. Corrección Ortogonal Activa (Auto-Ortho Alignment para prevenir tubos "chuecos")
  if (options.startPoint) {
    const sp = options.startPoint;
    const dx = Math.abs(bestResult.x - sp.x);
    const dy = Math.abs(bestResult.y - sp.y);

    if (options.snapOrthoLock || dx < 0.038) {
      bestResult.x = sp.x;
      if (bestResult.type === 'none' || bestResult.type === 'grid') {
        bestResult.type = 'ortho';
        bestResult.label = 'Alineación Vertical Recta (90.0°)';
      }
    }
    if (options.snapOrthoLock || dy < 0.038) {
      bestResult.y = sp.y;
      if (bestResult.type === 'none' || bestResult.type === 'grid') {
        bestResult.type = 'ortho';
        bestResult.label = 'Alineación Horizontal Recta (0.0°)';
      }
    }
  }

  return bestResult;
}
