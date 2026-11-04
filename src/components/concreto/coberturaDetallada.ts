// Coberturas con relieve real para el 3D de Obra Civil y Drywall (mismo concepto que
// Techos Metálicos): cada paño se arma como una plancha con sus ondas a lo largo de la
// pendiente (TR-4, TR-5, calamina, Eternit, tejas, paneles) o como tela lisa (malla, lona).
import * as THREE from 'three';

type Perfil = { tipo: 'trapecio' | 'seno' | 'teja' | 'liso'; paso: number; alto: number; color: number; metal: number; rugoso: number; opacidad?: number };

export function perfilDeCobertura(id: string): Perfil {
  const s = (id || '').toLowerCase();
  if (s.includes('teja')) return { tipo: 'teja', paso: 0.22, alto: 0.04, color: 0xb4532a, metal: 0, rugoso: 0.8 };
  if (s.includes('malla')) return { tipo: 'liso', paso: 1, alto: 0, color: 0x166534, metal: 0, rugoso: 0.95, opacidad: 0.6 };
  if (s.includes('lona')) return { tipo: 'liso', paso: 1, alto: 0, color: 0xf1f5f9, metal: 0, rugoso: 0.9 };
  if (s.includes('compacto')) return { tipo: 'liso', paso: 1, alto: 0, color: 0xbae6fd, metal: 0.05, rugoso: 0.2, opacidad: 0.45 };
  if (s.includes('policarbonato')) return { tipo: 'trapecio', paso: 0.25, alto: 0.035, color: 0x7dd3fc, metal: 0.05, rugoso: 0.2, opacidad: 0.55 };
  if (s.includes('eternit')) return { tipo: 'seno', paso: 0.177, alto: 0.05, color: 0xd9d6cf, metal: 0, rugoso: 0.85 };
  if (s.includes('calamina')) return { tipo: 'seno', paso: 0.12, alto: 0.02, color: 0xc3cad1, metal: 0.5, rugoso: 0.45 };
  if (s.includes('sandwich') || s.includes('termo') || s.includes('upvc')) return { tipo: 'trapecio', paso: 0.333, alto: 0.03, color: 0xf1f1ee, metal: 0.1, rugoso: 0.6 };
  if (s.includes('tr5')) return { tipo: 'trapecio', paso: 0.19, alto: 0.045, color: 0x9aa5b1, metal: 0.55, rugoso: 0.4 };
  return { tipo: 'trapecio', paso: 0.25, alto: 0.035, color: 0xb9c3cc, metal: 0.55, rugoso: 0.4 }; // Aluzinc TR-4
}

/** Altura de la plancha en la coordenada u (a lo ancho) y v (bajando la pendiente). */
function relieve(p: Perfil, u: number, v: number): number {
  if (p.tipo === 'liso') return 0;
  const t = ((u % p.paso) + p.paso) % p.paso / p.paso; // 0..1 dentro de una onda
  if (p.tipo === 'trapecio') {
    // Cresta de 12 % del paso, flancos de 12 %: forma de TR-4 / TR-5.
    if (t < 0.12) return p.alto;
    if (t < 0.24) return p.alto * (1 - (t - 0.12) / 0.12);
    if (t > 0.88) return p.alto * ((t - 0.88) / 0.12);
    return 0;
  }
  const onda = p.alto * (0.5 + 0.5 * Math.cos(t * Math.PI * 2));
  if (p.tipo === 'seno') return onda;
  // Teja: onda + escalón de cada hilera (cada 35 cm bajando la pendiente).
  const fila = ((v % 0.35) + 0.35) % 0.35 / 0.35;
  return onda + p.alto * 0.6 * (1 - fila);
}

function dentro(pu: number, pv: number, poly: [number, number][]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ui, vi] = poly[i], [uj, vj] = poly[j];
    if ((vi > pv) !== (vj > pv) && pu < (uj - ui) * (pv - vi) / (vj - vi) + ui) c = !c;
  }
  return c;
}

/** Plancha con relieve sobre un paño (contorno en 3D). null si el paño no sirve. */
export function planchaDetallada(pts: THREE.Vector3[], materialId: string): THREE.Mesh | null {
  if (pts.length < 3) return null;
  const perfil = perfilDeCobertura(materialId);
  // Normal del paño (Newell) apuntando hacia arriba.
  const n = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    n.x += (a.y - b.y) * (a.z + b.z); n.y += (a.z - b.z) * (a.x + b.x); n.z += (a.x - b.x) * (a.y + b.y);
  }
  if (n.lengthSq() < 1e-9) return null;
  n.normalize(); if (n.y < 0) n.negate();
  // d: hacia donde baja el agua (dentro del plano); a: a lo ancho (paralelo a la cumbrera).
  const d = new THREE.Vector3(0, -1, 0).sub(n.clone().multiplyScalar(-n.y));
  if (d.lengthSq() < 1e-6) d.set(1, 0, 0).sub(n.clone().multiplyScalar(n.x));
  d.normalize();
  const a = new THREE.Vector3().crossVectors(n, d).normalize();
  const O = pts[0];
  const poly = pts.map(p => { const r = p.clone().sub(O); return [r.dot(a), r.dot(d)] as [number, number]; });
  const us = poly.map(q => q[0]), vs = poly.map(q => q[1]);
  const u0 = Math.min(...us), u1 = Math.max(...us), v0 = Math.min(...vs), v1 = Math.max(...vs);
  const du = perfil.tipo === 'liso' ? Math.max(0.25, (u1 - u0) / 40) : perfil.paso / 8;
  const dv = perfil.tipo === 'teja' ? 0.0875 : perfil.tipo === 'liso' ? Math.max(0.25, (v1 - v0) / 20) : Math.max(0.2, (v1 - v0) / 12);
  const nu = Math.max(1, Math.ceil((u1 - u0) / du)), nv = Math.max(1, Math.ceil((v1 - v0) / dv));
  if (nu * nv > 400000) return null; // demasiado grande: que se use la plancha simple
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const pto = (u: number, v: number) => O.clone().addScaledVector(a, u).addScaledVector(d, v).addScaledVector(n, relieve(perfil, u - u0, v - v0));
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = Math.min(u1, u0 + i * du), v = Math.min(v1, v0 + j * dv), q = pto(u, v), k = (j * (nu + 1) + i) * 3;
    pos[k] = q.x; pos[k + 1] = q.y; pos[k + 2] = q.z;
  }
  const idx: number[] = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const cu = u0 + (i + 0.5) * du, cv = v0 + (j + 0.5) * dv;
    if (!dentro(cu, cv, poly)) continue;
    const p0 = j * (nu + 1) + i, p1 = p0 + 1, p2 = p0 + nu + 1, p3 = p2 + 1;
    idx.push(p0, p2, p1, p1, p2, p3);
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({
    color: perfil.color, metalness: perfil.metal, roughness: perfil.rugoso, side: THREE.DoubleSide,
    transparent: perfil.opacidad !== undefined, opacity: perfil.opacidad ?? 1, depthWrite: perfil.opacidad === undefined,
  });
  return new THREE.Mesh(g, m);
}
