// =============================================================================
// Accesorios bajo el techo (solo de referencia, para mostrar al cliente):
// horno de barro/ladrillo, parrilla con campana, mesa con sillas, silla y banca.
// Se guardan en la zona de cobertura principal (campo opcional `accesorios`),
// igual que las canaletas y el techo movible: viajan con el diseño sin cambiar
// la base de datos. No suman al presupuesto del techo.
// =============================================================================
import * as THREE from 'three';
import type { AccesorioTecho, TipoAccesorioTecho } from './techosCadEngineTypes';

export const CATALOGO_ACCESORIOS: { tipo: TipoAccesorioTecho; nombre: string; emoji: string; medida: string }[] = [
  { tipo: 'horno', nombre: 'Horno de barro', emoji: '🔥', medida: '1.40 × 1.40 m' },
  { tipo: 'parrilla', nombre: 'Parrilla con campana', emoji: '🍖', medida: '1.80 × 0.80 m' },
  { tipo: 'mesa', nombre: 'Mesa con 6 sillas', emoji: '🍽️', medida: '1.80 × 0.90 m' },
  { tipo: 'silla', nombre: 'Silla', emoji: '🪑', medida: '0.45 × 0.45 m' },
  { tipo: 'banca', nombre: 'Banca', emoji: '🪵', medida: '1.60 × 0.40 m' },
];
export const nombreAccesorio = (t: TipoAccesorioTecho) => CATALOGO_ACCESORIOS.find(c => c.tipo === t)?.nombre || t;

const mat = (color: number, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const LADRILLO = 0xa4472b, BARRO = 0xc2703d, OSCURO = 0x1f2937, MADERA = 0x8b5a2b, METAL = 0x9ca3af, CEMENTO = 0xb8b3a8;

function caja(g: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y + h / 2, z); b.castShadow = true; b.receiveShadow = true; g.add(b);
  return b;
}

function silla(g: THREE.Group, x: number, z: number, rot: number) {
  const s = new THREE.Group();
  const m = mat(MADERA, 0.7);
  caja(s, 0.44, 0.04, 0.44, 0, 0.44, 0, m);
  [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([a, b]) => caja(s, 0.04, 0.44, 0.04, a, 0, b, m));
  caja(s, 0.44, 0.45, 0.04, 0, 0.48, -0.2, m);
  s.position.set(x, 0, z); s.rotation.y = rot; g.add(s);
}

/** Arma el accesorio (origen en el piso, al centro; mira hacia +Z). */
export function crearAccesorio3D(a: AccesorioTecho): THREE.Group {
  const g = new THREE.Group();
  g.name = 'accesorio_techo';
  if (a.tipo === 'horno') {
    // Base de ladrillo, bóveda de barro con boca en arco y chimenea.
    caja(g, 1.4, 0.9, 1.4, 0, 0, 0, mat(LADRILLO));
    caja(g, 1.5, 0.06, 1.5, 0, 0.9, 0, mat(CEMENTO));
    const domo = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(BARRO, 0.95));
    domo.position.set(0, 0.96, 0); domo.castShadow = true; g.add(domo);
    // Boca en arco (media luna parada) al frente.
    const arco = new THREE.Shape();
    arco.moveTo(-0.22, 0); arco.lineTo(0.22, 0); arco.absarc(0, 0, 0.22, 0, Math.PI, false);
    const boca = new THREE.Mesh(new THREE.ExtrudeGeometry(arco, { depth: 0.14, bevelEnabled: false }), mat(OSCURO, 1));
    boca.position.set(0, 0.96, 0.5); g.add(boca);
    caja(g, 0.4, 0.04, 0.12, 0, 0.94, 0.62, mat(OSCURO, 1));
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 14), mat(METAL, 0.4, 0.6));
    chim.position.set(0, 1.75, 0.25); g.add(chim);
    // Leña bajo el horno
    for (let i = 0; i < 3; i++) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), mat(0x6b4423, 1));
      l.rotation.z = Math.PI / 2; l.position.set(0, 0.12 + i * 0.1, 0.72); g.add(l);
    }
  } else if (a.tipo === 'parrilla') {
    // Muro en U de ladrillo, mesada, parrilla, campana y chimenea.
    const lad = mat(LADRILLO);
    caja(g, 1.8, 0.9, 0.12, 0, 0, -0.34, lad);
    caja(g, 0.12, 0.9, 0.8, -0.84, 0, 0, lad);
    caja(g, 0.12, 0.9, 0.8, 0.84, 0, 0, lad);
    caja(g, 1.9, 0.06, 0.86, 0, 0.9, 0, mat(CEMENTO));
    caja(g, 1.4, 0.03, 0.6, 0, 0.98, 0.04, mat(OSCURO, 0.5, 0.5));
    for (let i = -6; i <= 6; i++) caja(g, 0.015, 0.02, 0.58, i * 0.1, 1.01, 0.04, mat(METAL, 0.3, 0.8));
    // Carbón encendido
    const brasa = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.5), new THREE.MeshStandardMaterial({ color: 0xff6a1a, emissive: 0xc2410c, emissiveIntensity: 0.6 }));
    brasa.position.set(0, 0.95, 0.04); g.add(brasa);
    // Pilares que sostienen la campana
    caja(g, 0.12, 0.9, 0.12, -0.84, 0.96, 0.34, lad);
    caja(g, 0.12, 0.9, 0.12, 0.84, 0.96, 0.34, lad);
    caja(g, 1.8, 0.9, 0.12, 0, 0.96, -0.34, lad);
    const campana = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 1.05, 0.65, 4, 1), mat(METAL, 0.35, 0.7));
    campana.rotation.y = Math.PI / 4; campana.scale.set(1, 1, 0.48); campana.position.set(0, 2.18, 0); g.add(campana);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.9, 0.26), mat(METAL, 0.35, 0.7));
    chim.position.set(0, 2.95, 0); g.add(chim);
  } else if (a.tipo === 'mesa') {
    const m = mat(MADERA, 0.65);
    caja(g, 1.8, 0.05, 0.9, 0, 0.72, 0, m);
    [[-0.82, -0.38], [0.82, -0.38], [-0.82, 0.38], [0.82, 0.38]].forEach(([x, z]) => caja(g, 0.06, 0.72, 0.06, x, 0, z, m));
    [-0.55, 0, 0.55].forEach(x => { silla(g, x, -0.68, 0); silla(g, x, 0.68, Math.PI); });
  } else if (a.tipo === 'silla') {
    silla(g, 0, 0, 0);
  } else if (a.tipo === 'banca') {
    const m = mat(MADERA, 0.65);
    caja(g, 1.6, 0.05, 0.4, 0, 0.43, 0, m);
    [-0.7, 0.7].forEach(x => caja(g, 0.06, 0.43, 0.36, x, 0, 0, m));
  }
  g.position.set(a.x, 0, a.z);
  g.rotation.y = ((a.rot || 0) * Math.PI) / 180;
  return g;
}
