// ============================================================================
// Lectura de un plano de techo dibujado A MANO con IA de visión (Opción 3).
//
// El usuario sube la foto de su plano (papel cuadriculado) y la Cloud Function
// `analyzeRoofPlan` (modelo de visión de Claude) detecta columnas y vigas/tijerales
// con coordenadas en metros. Aquí se convierte ese resultado en nodos/segmentos
// para dibujarlo automáticamente en el CAD de Techos. La IA PROPONE; el usuario
// luego ajusta/mueve/elimina con las herramientas normales.
//
// Requiere desplegar la función (plan Blaze) con la clave ANTHROPIC_API_KEY.
// Mientras no esté desplegada, la llamada falla con 'failed-precondition' y el
// cliente muestra un aviso (nada se rompe; el usuario dibuja a mano).
// ============================================================================
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import type { Node3D, Segment3D, RolEstructuralSegmento } from '../components/techos/techosCadEngineTypes';

export interface RoofPlanColumna { x: number; z: number; }
export interface RoofPlanViga { x1: number; z1: number; x2: number; z2: number; tipo: 'viga' | 'tijeral'; }
export interface RoofPlanData {
  anchoM: number;
  largoM: number;
  alturaColM: number;
  columnas: RoofPlanColumna[];
  vigas: RoofPlanViga[];
  confianza: 'alta' | 'media' | 'baja';
  notas: string;
}

/** Convierte un File de imagen a base64 (sin el prefijo data:). */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve({ base64: comma >= 0 ? result.slice(comma + 1) : result, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

/** Llama a la IA de visión para leer el plano. Lanza error si no está configurada. */
export async function analyzeRoofPlanWithAI(
  base64: string,
  mimeType: string,
  region = 'us-central1'
): Promise<RoofPlanData> {
  const functions = getFunctions(app, region);
  const callable = httpsCallable<{ imageBase64: string; mimeType: string }, RoofPlanData>(functions, 'analyzeRoofPlan');
  const res = await callable({ imageBase64: base64, mimeType });
  return res.data;
}

/**
 * Convierte el plano detectado por la IA en nodos y segmentos para `loadScene`.
 * - Cada columna → nodo base (apoyo, y=0) + nodo superior (y=altura) + segmento 'columna'.
 * - Cada viga/tijeral → segmento a la altura de columnas entre sus dos extremos.
 * Reutiliza nodos cercanos (tolerancia 0.10 m) para que las barras se conecten.
 */
export function buildSceneFromPlan(
  plan: RoofPlanData,
  profileId: string
): { nodes: Record<string, Node3D>; segments: Record<string, Segment3D> } {
  const nodes: Record<string, Node3D> = {};
  const segments: Record<string, Segment3D> = {};
  const h = plan.alturaColM > 0 ? plan.alturaColM : 3.0;
  const stamp = Date.now();
  let nCount = 0;
  let sCount = 0;

  // Reutiliza nodos cercanos (misma posición ~0.10 m) para unir barras.
  const findOrCreate = (x: number, y: number, z: number, fixed: boolean): string => {
    const existing = Object.values(nodes).find(n =>
      Math.abs(n.x - x) < 0.10 && Math.abs(n.y - y) < 0.10 && Math.abs(n.z - z) < 0.10
    );
    if (existing) {
      if (fixed && !existing.isFixedSupport) existing.isFixedSupport = true;
      return existing.id;
    }
    const id = `ia_n_${stamp}_${nCount++}`;
    nodes[id] = {
      id,
      x: Number(x.toFixed(3)), y: Number(y.toFixed(3)), z: Number(z.toFixed(3)),
      isFixedSupport: fixed, nodeLabel: `N-${nCount}`
    };
    return id;
  };
  const addSeg = (aId: string, bId: string, rol: RolEstructuralSegmento) => {
    if (!aId || !bId || aId === bId) return;
    const dup = Object.values(segments).some(s =>
      (s.nodeAId === aId && s.nodeBId === bId) || (s.nodeAId === bId && s.nodeBId === aId)
    );
    if (dup) return;
    const id = `ia_s_${stamp}_${sCount++}`;
    segments[id] = { id, nodeAId: aId, nodeBId: bId, profileId, rolEstructural: rol };
  };

  (plan.columnas || []).forEach(c => {
    const base = findOrCreate(c.x, 0, c.z, true);
    const top = findOrCreate(c.x, h, c.z, false);
    addSeg(base, top, 'columna');
  });

  (plan.vigas || []).forEach(v => {
    const a = findOrCreate(v.x1, h, v.z1, false);
    const b = findOrCreate(v.x2, h, v.z2, false);
    addSeg(a, b, v.tipo === 'tijeral' ? 'cordon_superior' : 'viga_principal');
  });

  return { nodes, segments };
}
