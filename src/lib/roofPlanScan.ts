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
import type { Node3D, Segment3D, RolEstructuralSegmento, CoverageZone3D } from '../components/techos/techosCadEngineTypes';

export interface RoofPlanColumna { x: number; z: number; }
export interface RoofPlanViga { x1: number; z1: number; x2: number; z2: number; tipo: 'viga' | 'tijeral'; }
/** Hacia dónde escurre el agua, visto en el dibujo (arriba = parte superior de la hoja). */
export type CaidaDibujo = 'arriba' | 'abajo' | 'izquierda' | 'derecha' | 'ninguna';
export interface RoofPlanData {
  anchoM: number;
  largoM: number;
  alturaColM: number;
  columnas: RoofPlanColumna[];
  vigas: RoofPlanViga[];
  confianza: 'alta' | 'media' | 'baja';
  notas: string;
  perimetro?: { x: number; z: number }[]; // contorno del área a techar, en orden
  caida?: CaidaDibujo;
  alturaAltaM?: number | null;
  alturaBajaM?: number | null;
}

/** Lo que el usuario indica antes de leer el plano (lo que no esté, se lee del dibujo). */
export interface OpcionesPlano {
  caida: 'leer' | CaidaDibujo;
  alturaBajaM: number | null;
  alturaAltaM: number | null;
  pendientePct: number;     // si no hay altura alta
  columnasCadaM: number;    // 0 = solo las dibujadas
  correasCadaM: number;
  coberturaId: string;
}

export const OPCIONES_PLANO_DEFECTO: OpcionesPlano = {
  caida: 'leer', alturaBajaM: null, alturaAltaM: null, pendientePct: 10, columnasCadaM: 5, correasCadaM: 1, coberturaId: '',
};

/**
 * Convierte la foto del plano a base64 (sin el prefijo data:). Las fotos del
 * celular pesan varios MB: se reducen a 2000 px de lado mayor en JPEG, que basta
 * para leer el dibujo y queda muy por debajo del límite de la API (5 MB).
 */
export function fileToBase64(file: File, maxLado = 2000): Promise<{ base64: string; mimeType: string }> {
  if (file.type === 'application/pdf') {
    if (file.size > 7 * 1024 * 1024) return Promise.reject(new Error('El PDF pesa más de 7 MB. Expórtalo solo con la página de la planta o envía una foto.'));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { const r = String(reader.result || ''); resolve({ base64: r.slice(r.indexOf(',') + 1), mimeType: 'application/pdf' }); };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxLado / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const ctx = c.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); return; }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const d = c.toDataURL('image/jpeg', 0.85);
      resolve({ base64: d.slice(d.indexOf(',') + 1), mimeType: 'image/jpeg' });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    img.src = url;
  });
}

/** Llama a la IA de visión para leer el plano. Lanza error si no está configurada. */
export async function analyzeRoofPlanWithAI(
  base64: string,
  mimeType: string,
  region = 'us-central1'
): Promise<RoofPlanData> {
  // Solo en desarrollo: probar el armado con una respuesta ya escrita (sin gastar créditos).
  if (import.meta.env.DEV && (window as any).__planSimulado) return (window as any).__planSimulado as RoofPlanData;
  const functions = getFunctions(app, region);
  const callable = httpsCallable<{ imageBase64: string; mimeType: string }, RoofPlanData>(functions, 'analyzeRoofPlan', { timeout: 300000 });
  const res = await callable({ imageBase64: base64, mimeType });
  return res.data;
}

/**
 * Convierte el plano leído por la IA (más las opciones del usuario) en un techo
 * listo para ajustar: columnas, vigas perimetrales, vigas entre columnas
 * enfrentadas en el sentido de la caída, correas y la zona de cobertura.
 * La altura de cada punto sigue la pendiente: lado alto opuesto a la caída.
 */
export function buildSceneFromPlan(
  plan: RoofPlanData,
  profileId: string,
  opciones: Partial<OpcionesPlano> = {},
  correaProfileId = profileId,
): { nodes: Record<string, Node3D>; segments: Record<string, Segment3D>; zones: Record<string, CoverageZone3D>; resumen: string } {
  const o0 = { ...OPCIONES_PLANO_DEFECTO, ...opciones };
  // La IA mide con Z hacia arriba de la hoja; en la planta de Techos Z crece hacia
  // abajo. Se refleja para que el diseño se vea igual que el dibujo en papel.
  const zs = [...(plan.perimetro || []).map(p => p.z), ...plan.columnas.map(c => c.z), ...plan.vigas.flatMap(v => [v.z1, v.z2])].filter(Number.isFinite);
  const zTop = zs.length ? Math.max(...zs) : plan.largoM || 0;
  const fz = (z: number) => Math.round((zTop - z) * 1000) / 1000;
  const voltear = (c?: CaidaDibujo | 'leer') => (c === 'arriba' ? 'abajo' : c === 'abajo' ? 'arriba' : c);
  plan = {
    ...plan,
    perimetro: (plan.perimetro || []).map(p => ({ x: p.x, z: fz(p.z) })),
    columnas: plan.columnas.map(c => ({ x: c.x, z: fz(c.z) })),
    vigas: plan.vigas.map(v => ({ ...v, z1: fz(v.z1), z2: fz(v.z2) })),
    caida: voltear(plan.caida) as CaidaDibujo | undefined,
  };
  const o = { ...o0, caida: voltear(o0.caida) as OpcionesPlano['caida'] };
  const nodes: Record<string, Node3D> = {};
  const segments: Record<string, Segment3D> = {};
  const stamp = Date.now();
  let nCount = 0, sCount = 0;
  const r2 = (v: number) => Math.round(v * 100) / 100;

  // 1) Contorno del área a techar.
  let poli = (plan.perimetro || []).filter(p => Number.isFinite(p.x) && Number.isFinite(p.z));
  if (poli.length < 3 && plan.columnas.length >= 3) poli = cascoConvexo(plan.columnas);
  if (poli.length < 3 && plan.anchoM > 0 && plan.largoM > 0) poli = [{ x: 0, z: 0 }, { x: plan.anchoM, z: 0 }, { x: plan.anchoM, z: plan.largoM }, { x: 0, z: plan.largoM }];
  if (poli.length < 3 && plan.vigas.length) poli = cascoConvexo(plan.vigas.flatMap(v => [{ x: v.x1, z: v.z1 }, { x: v.x2, z: v.z2 }]));
  poli = sinRepetidos(poli);
  const hayContorno = poli.length >= 3;

  // 2) Pendiente: dirección de la caída y alturas.
  const caida: CaidaDibujo = o.caida === 'leer' ? (plan.caida || 'ninguna') : o.caida;
  const dir = { arriba: [0, 1], abajo: [0, -1], izquierda: [-1, 0], derecha: [1, 0], ninguna: [0, 1] }[caida];
  const sDe = (x: number, z: number) => x * dir[0] + z * dir[1];
  const ss = (hayContorno ? poli : plan.columnas).map(p => sDe(p.x, p.z));
  const sMin = ss.length ? Math.min(...ss) : 0, sMax = ss.length ? Math.max(...ss) : 1, run = Math.max(0.01, sMax - sMin);
  const hBaja = o.alturaBajaM ?? plan.alturaBajaM ?? (plan.alturaColM > 0 ? plan.alturaColM : 3);
  const hAlta = caida === 'ninguna' ? hBaja : (o.alturaAltaM ?? plan.alturaAltaM ?? hBaja + (o.pendientePct / 100) * run);
  const yTop = (x: number, z: number) => r2(hAlta - (hAlta - hBaja) * ((sDe(x, z) - sMin) / run));

  const nodo = (x: number, y: number, z: number, fijo: boolean): string => {
    const ex = Object.values(nodes).find(n => Math.abs(n.x - x) < 0.12 && Math.abs(n.z - z) < 0.12 && Math.abs(n.y - y) < 0.12);
    if (ex) { if (fijo) ex.isFixedSupport = true; return ex.id; }
    const id = `ia_n_${stamp}_${nCount++}`;
    nodes[id] = { id, x: r2(x), y: r2(y), z: r2(z), isFixedSupport: fijo, nodeLabel: `N-${nCount}` };
    return id;
  };
  const arriba = (x: number, z: number) => nodo(x, yTop(x, z), z, false);
  const barra = (a: string, b: string, rol: RolEstructuralSegmento, perfil = profileId) => {
    if (!a || !b || a === b) return;
    if (Object.values(segments).some(s => (s.nodeAId === a && s.nodeBId === b) || (s.nodeAId === b && s.nodeBId === a))) return;
    const id = `ia_s_${stamp}_${sCount++}`;
    segments[id] = { id, nodeAId: a, nodeBId: b, profileId: perfil, rolEstructural: rol };
  };

  // 3) Columnas: las dibujadas + (si se pide) esquinas y relleno cada X m en el contorno.
  const cols = plan.columnas.map(c => ({ x: c.x, z: c.z }));
  const cerca = (a: { x: number; z: number }, b: { x: number; z: number }, t: number) => Math.hypot(a.x - b.x, a.z - b.z) < t;
  const aristas = hayContorno ? poli.map((a, i) => [a, poli[(i + 1) % poli.length]] as const) : [];
  // Columnas dibujadas cerca del contorno se ajustan sobre él (el dibujo a mano no es exacto).
  cols.forEach(c => {
    let mejor: { x: number; z: number } | null = null, dm = 0.6;
    aristas.forEach(([a, b]) => { const q = proyectar(c, a, b); const d = Math.hypot(q.x - c.x, q.z - c.z); if (d < dm) { dm = d; mejor = q; } });
    if (mejor) { c.x = (mejor as any).x; c.z = (mejor as any).z; }
  });
  let agregadas = 0;
  if (o.columnasCadaM > 0 && hayContorno) {
    poli.forEach(p => { if (!cols.some(c => cerca(c, p, 0.6))) { cols.push({ ...p }); agregadas++; } });
    aristas.forEach(([a, b]) => {
      const L = Math.hypot(b.x - a.x, b.z - a.z);
      const ts = [0, 1, ...cols.map(c => paramEn(c, a, b)).filter((t): t is number => t !== null)].sort((u, v) => u - v);
      for (let i = 0; i < ts.length - 1; i++) {
        const gap = (ts[i + 1] - ts[i]) * L;
        if (gap <= o.columnasCadaM * 1.15) continue;
        const n = Math.ceil(gap / o.columnasCadaM);
        for (let k = 1; k < n; k++) {
          const t = ts[i] + ((ts[i + 1] - ts[i]) * k) / n;
          cols.push({ x: r2(a.x + (b.x - a.x) * t), z: r2(a.z + (b.z - a.z) * t) }); agregadas++;
        }
      }
    });
  }
  cols.forEach(c => barra(nodo(c.x, 0, c.z, true), arriba(c.x, c.z), 'columna'));

  // 4) Vigas del contorno, partidas en cada columna que cae sobre ellas.
  aristas.forEach(([a, b]) => {
    const ts = [0, 1, ...cols.map(c => paramEn(c, a, b)).filter((t): t is number => t !== null)].sort((u, v) => u - v);
    for (let i = 0; i < ts.length - 1; i++) {
      if (ts[i + 1] - ts[i] < 1e-3) continue;
      const p = (t: number) => ({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
      const A = p(ts[i]), B = p(ts[i + 1]);
      barra(arriba(A.x, A.z), arriba(B.x, B.z), 'viga_principal');
    }
  });
  // Vigas o tijerales que la IA vio dibujados.
  plan.vigas.forEach(v => barra(arriba(v.x1, v.z1), arriba(v.x2, v.z2), v.tipo === 'tijeral' ? 'cordon_superior' : 'viga_principal'));

  // 5) Vigas entre columnas enfrentadas, en el sentido de la caída (cargan las correas).
  if (hayContorno) {
    const ux = dir[0], uz = dir[1];
    cols.forEach(c => {
      let mejor: { x: number; z: number } | null = null, dm = Infinity;
      cols.forEach(d => {
        if (d === c) return;
        const along = (d.x - c.x) * ux + (d.z - c.z) * uz, lat = Math.abs(-(d.x - c.x) * uz + (d.z - c.z) * ux);
        if (along <= 0.5 || lat > 0.6 || along >= dm) return;
        const m = { x: (c.x + d.x) / 2, z: (c.z + d.z) / 2 };
        if (!dentro(m, poli) || distBorde(m, poli) < 0.3) return;
        dm = along; mejor = d;
      });
      if (mejor) barra(arriba(c.x, c.z), arriba((mejor as any).x, (mejor as any).z), 'viga_principal');
    });
  }

  // 6) Correas perpendiculares a la caída, recortadas al contorno; y la cobertura.
  const zones: Record<string, CoverageZone3D> = {};
  let nCorreas = 0;
  if (hayContorno && o.correasCadaM > 0) {
    const n = Math.max(1, Math.ceil(run / o.correasCadaM));
    const px = -dir[1], pz = dir[0]; // eje de la correa
    for (let k = 0; k <= n; k++) {
      const s = sMin + Math.min(Math.max(0.05, (run * k) / n), run - 0.05);
      const ts: number[] = [];
      aristas.forEach(([a, b]) => {
        const sa = sDe(a.x, a.z) - s, sb = sDe(b.x, b.z) - s;
        if ((sa > 0) === (sb > 0) || sa === sb) return;
        const t = sa / (sa - sb);
        const q = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
        ts.push(q.x * px + q.z * pz);
      });
      ts.sort((u, v) => u - v);
      for (let i = 0; i + 1 < ts.length; i += 2) {
        const P = (t: number) => ({ x: dir[0] * s + px * t, z: dir[1] * s + pz * t });
        const A = P(ts[i]), B = P(ts[i + 1]);
        if (Math.hypot(B.x - A.x, B.z - A.z) < 0.2) continue;
        barra(arriba(A.x, A.z), arriba(B.x, B.z), 'correa', correaProfileId); nCorreas++;
      }
    }
    if (o.coberturaId) {
      const id = `zone_ia_${stamp}`;
      zones[id] = { id, nombre: 'Cobertura', nodeIdsBoundary: poli.map(p => arriba(p.x, p.z)), coberturaMaterialId: o.coberturaId,
        pendientePorcentaje: Math.round(((hAlta - hBaja) / run) * 100), orientacionInclinacionDeg: 0 };
    }
  }

  const nombreCaida = { abajo: 'hacia arriba del dibujo', arriba: 'hacia abajo del dibujo', izquierda: 'hacia la izquierda', derecha: 'hacia la derecha', ninguna: 'sin caída (plano)' }[caida];
  const resumen = `${cols.length} columnas${agregadas ? ` (${agregadas} agregadas)` : ''}, ${nCorreas} correas, caída ${nombreCaida}, altura ${hBaja.toFixed(2)}–${hAlta.toFixed(2)} m (${Math.round(((hAlta - hBaja) / run) * 100)}%).`;
  return { nodes, segments, zones, resumen };
}

type P2 = { x: number; z: number };
function proyectar(p: P2, a: P2, b: P2): P2 {
  const L2 = (b.x - a.x) ** 2 + (b.z - a.z) ** 2 || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / L2));
  return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
}
// Posición (0..1) de p sobre la arista a-b, o null si no está sobre ella.
function paramEn(p: P2, a: P2, b: P2): number | null {
  const q = proyectar(p, a, b);
  if (Math.hypot(q.x - p.x, q.z - p.z) > 0.35) return null;
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  const t = Math.hypot(q.x - a.x, q.z - a.z) / L;
  return t < 1e-3 || t > 1 - 1e-3 ? null : t;
}
function dentro(p: P2, poli: P2[]): boolean {
  let c = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const a = poli[i], b = poli[j];
    if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) c = !c;
  }
  return c;
}
function distBorde(p: P2, poli: P2[]): number {
  return Math.min(...poli.map((a, i) => { const q = proyectar(p, a, poli[(i + 1) % poli.length]); return Math.hypot(q.x - p.x, q.z - p.z); }));
}
function sinRepetidos(poli: P2[]): P2[] {
  const out = poli.filter((p, i) => { const q = poli[(i + 1) % poli.length]; return Math.hypot(p.x - q.x, p.z - q.z) > 0.05; });
  return out.length >= 3 ? out : poli;
}
function cascoConvexo(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.z - b.z);
  if (p.length < 3) return p;
  const cr = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lo: P2[] = [], up: P2[] = [];
  p.forEach(q => { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-6) lo.pop(); lo.push(q); });
  [...p].reverse().forEach(q => { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 1e-6) up.pop(); up.push(q); });
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
