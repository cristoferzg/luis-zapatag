// Creación y liberación SEGURA de los lienzos 3D (WebGL) de todos los visores.
//
// Problema que resuelve ("THREE.WebGLRenderer: Error creating WebGL context"):
// 1) El navegador permite ~16 lienzos 3D vivos. renderer.dispose() NO devuelve el contexto
//    de inmediato: si un visor se vuelve a armar (cambiar iluminación, abrir/cerrar pestañas)
//    se acumulan contextos hasta que ya no se puede crear otro. Al liberar se fuerza la
//    pérdida del contexto (forceContextLoss) y se quita el lienzo.
// 2) En PCs con tarjeta de video antigua o drivers viejos, pedir antialias / alta potencia /
//    preserveDrawingBuffer puede fallar: se reintenta con opciones más livianas.
import * as THREE from 'three';

type Opciones = ConstructorParameters<typeof THREE.WebGLRenderer>[0];

export function crearRenderer(opciones: Opciones = {}): THREE.WebGLRenderer {
  const intentos: Opciones[] = [
    { ...opciones },
    { ...opciones, antialias: false, powerPreference: 'default' },
    { ...opciones, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false },
  ];
  let ultimoError: unknown;
  for (const o of intentos) {
    try { return new THREE.WebGLRenderer(o); } catch (e) { ultimoError = e; }
  }
  throw ultimoError instanceof Error ? ultimoError : new Error('No se pudo crear el 3D en este equipo.');
}

export function liberarRenderer(renderer: THREE.WebGLRenderer | null | undefined) {
  if (!renderer) return;
  try { renderer.dispose(); } catch { /* nada */ }
  try { renderer.forceContextLoss(); } catch { /* nada */ }
  try { renderer.domElement?.remove(); } catch { /* nada */ }
}

/** ¿Este equipo puede mostrar 3D? (para mostrar un aviso claro en vez de un error técnico) */
export function webglDisponible(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const ok = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch { return false; }
}
