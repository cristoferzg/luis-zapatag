// =============================================================================
// Vista 3D de Drywall: cada partida del cotizador (tabique, cielo, cenefa, forro,
// repisas…) con sus planchas, parantes y rieles, y sus puertas y ventanas.
// Las puertas giran sobre sus bisagras, las corredizas se deslizan y las ventanas
// se abren: toca una para abrirla o usa "Abrir puertas". Se dibuja solo cuando
// algo cambia (no gasta batería con la vista quieta).
// Ejes: el muro va a lo largo de +X, alto en +Y y la cara A mira hacia +Z.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { crearRenderer, liberarRenderer } from '../../lib/webglSeguro';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2, DoorOpen, DoorClosed } from 'lucide-react';
import { Partida, VanoPartida, sistemaDe, posicionVanos, posicionParantes, colorPintura, conPintura, PLANCHA_W, PLANCHA_H } from './calculoDrywall';

const ESP = 0.0125;   // espesor de la plancha
const ALTO_CIELO = 2.6; // altura a la que se dibujan cielos y cenefas

interface Movil { valor: number; objetivo: number; aplicar: (v: number) => void }
const movilDe = (o: THREE.Object3D | null): Movil | null => { while (o) { if (o.userData.movil) return o.userData.movil as Movil; o = o.parent; } return null; };

/** Caja con su esquina mínima en (x, y, z). */
function caja(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.001, w), Math.max(0.001, h), Math.max(0.001, d)), mat);
  m.position.set(x + w / 2, y + h / 2, z + d / 2);
  return m;
}

function liberar(obj: THREE.Object3D) {
  obj.traverse(o => {
    const x = o as THREE.Mesh;
    x.geometry?.dispose?.();
    const mt = x.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mt)) mt.forEach(mm => mm.dispose()); else mt?.dispose?.();
  });
}

// Color de la plancha (sin pintar) según el tipo de placa.
const colorPlaca = (id: string) => /humedad/.test(id) ? '#c7dcc0' : /fuego/.test(id) ? '#efcfd4' : /fibro/.test(id) ? '#bdb9b1' : '#ebe9e4';

type Hueco = { x: number; y: number; w: number; h: number };
/** Intervalos [a, b] de [0, total] que quedan al quitar los cortes. */
function restar(total: number, cortes: [number, number][]): [number, number][] {
  let seg: [number, number][] = [[0, total]];
  cortes.forEach(([c0, c1]) => {
    seg = seg.flatMap(([a, b]) => (c1 <= a || c0 >= b) ? [[a, b] as [number, number]] : [[a, Math.max(a, c0)], [Math.min(b, c1), b]].filter(([p, q]) => q - p > 0.002) as [number, number][]);
  });
  return seg;
}
/** Cara de planchas de L × H con huecos, armada en franjas verticales (robusto con huecos en el borde). */
function cara(L: number, H: number, huecos: Hueco[], z: number, mat: THREE.Material, g: THREE.Group) {
  const xs = [...new Set([0, L, ...huecos.flatMap(h => [Math.max(0, h.x), Math.min(L, h.x + h.w)])].map(x => Math.round(x * 1000) / 1000))].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1]; if (x1 - x0 < 0.002) continue;
    const cortes = huecos.filter(h => h.x <= x0 + 1e-4 && h.x + h.w >= x1 - 1e-4).map(h => [h.y, h.y + h.h] as [number, number]);
    restar(H, cortes).forEach(([a, b]) => g.add(caja(x1 - x0, b - a, ESP, x0, a, z, mat)));
  }
}
/** Juntas de las planchas (líneas) sobre una cara, cortadas en los huecos. */
function juntas(L: number, H: number, huecos: Hueco[], z: number, g: THREE.Group) {
  const pts: number[] = [];
  for (let x = PLANCHA_W; x < L - 0.01; x += PLANCHA_W) restar(H, huecos.filter(h => x > h.x && x < h.x + h.w).map(h => [h.y, h.y + h.h])).forEach(([a, b]) => pts.push(x, a, z, x, b, z));
  for (let y = PLANCHA_H; y < H - 0.01; y += PLANCHA_H) restar(L, huecos.filter(h => y > h.y && y < h.y + h.h).map(h => [h.x, h.x + h.w])).forEach(([a, b]) => pts.push(a, y, z, b, y, z));
  if (!pts.length) return;
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#a8a29e' })));
}

// ── Materiales compartidos de una escena ────────────────────────────────────
function materiales() {
  return {
    metal: new THREE.MeshStandardMaterial({ color: '#aab2bb', roughness: 0.4, metalness: 0.6 }),
    madera: new THREE.MeshStandardMaterial({ color: '#c9a27a', roughness: 0.6 }),
    marco: new THREE.MeshStandardMaterial({ color: '#8b6b4a', roughness: 0.6 }),
    alu: new THREE.MeshStandardMaterial({ color: '#b8bec6', roughness: 0.3, metalness: 0.7 }),
    vidrio: new THREE.MeshStandardMaterial({ color: '#bfdbfe', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false }),
    perilla: new THREE.MeshStandardMaterial({ color: '#d4af37', roughness: 0.3, metalness: 0.8 }),
    concreto: new THREE.MeshStandardMaterial({ color: '#9ca3af', roughness: 0.95 }),
    led: new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#ffe9a3', emissiveIntensity: 1.2 }),
    oscuro: new THREE.MeshStandardMaterial({ color: '#2a2f45', roughness: 0.8 }),
  };
}
type Mats = ReturnType<typeof materiales>;

function matPlaca(p: Partida, placaId: string, porDentro: boolean) {
  const hex = conPintura(p) ? colorPintura(p.acabado?.color).hex : colorPlaca(placaId);
  return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9, ...(porDentro ? { transparent: true, opacity: 0.18, depthWrite: false } : {}) });
}

// ── Puertas y ventanas ──────────────────────────────────────────────────────
function vanoObj(v: VanoPartida & { x: number }, zA: number, zB: number, M: Mats): THREE.Group {
  const g = new THREE.Group();
  const prof = zA - zB + 0.01, z0 = zB - 0.005, a = 0.035;
  const puerta = v.tipo === 'puerta';
  const mMarco = puerta ? M.marco : M.alu;
  // Marco: jambas, dintel (y alféizar en ventanas).
  g.add(caja(a, v.h, prof, v.x - a, v.sill, z0, mMarco), caja(a, v.h, prof, v.x + v.w, v.sill, z0, mMarco));
  g.add(caja(v.w + 2 * a, a, prof, v.x - a, v.sill + v.h, z0, mMarco));
  if (!puerta) g.add(caja(v.w + 2 * a, a, prof + 0.04, v.x - a, v.sill - a, z0, mMarco));
  const izq = (v.abre || 'izq') === 'izq';
  const zc = (zA + zB) / 2;

  if (puerta) {
    const estilo = v.estilo || 'lisa';
    const t = 0.035;
    // Hoja en coordenadas locales: x de 0 a w, y de 0 a h, z centrada.
    const hoja = (grupo: THREE.Group, w: number, h: number, x0: number, conVidrio: boolean) => {
      if (conVidrio) {
        const b = 0.09;
        grupo.add(caja(w, b, t, x0, 0, -t / 2, M.madera), caja(w, b * 1.6, t, x0, h - b * 1.6, -t / 2, M.madera), caja(w, 0.8, t, x0, 0, -t / 2, M.madera));
        grupo.add(caja(b, h, t, x0, 0, -t / 2, M.madera), caja(b, h, t, x0 + w - b, 0, -t / 2, M.madera));
        grupo.add(caja(w - 2 * b, h - 0.8 - b * 1.6, 0.006, x0 + b, 0.8, -0.003, M.vidrio));
      } else grupo.add(caja(w, h, t, x0, 0, -t / 2, M.madera));
    };
    if (estilo === 'corrediza') {
      // Hoja por delante del muro, sobre un riel; se desliza hacia el lado que abre.
      const w = v.w + 0.08, h = v.h + 0.03;
      const grupo = new THREE.Group(); grupo.position.set(v.x - 0.04, v.sill, zA + 0.03);
      hoja(grupo, w, h, 0, false);
      grupo.add(caja(0.025, 0.25, 0.025, izq ? w - 0.07 : 0.045, 0.9, t / 2, M.alu));
      g.add(caja(v.w * 2 + 0.2, 0.04, 0.05, izq ? v.x - v.w - 0.1 : v.x - 0.1, v.sill + h + 0.01, zA + 0.005, M.alu));
      const dx = (izq ? -1 : 1) * (v.w * 0.95);
      grupo.userData.movil = { valor: 0, objetivo: 0, aplicar: (k: number) => { grupo.position.x = v.x - 0.04 + dx * k; } } as Movil;
      g.add(grupo);
      return g;
    }
    // Batiente: gira sobre las bisagras (izquierda o derecha) hacia la cara A.
    const w = v.w - 0.006, h = v.h - 0.006;
    const piv = new THREE.Group(); piv.position.set(izq ? v.x + 0.003 : v.x + v.w - 0.003, v.sill, zc);
    const x0 = izq ? 0 : -w;
    hoja(piv, w, h, x0, estilo === 'vidrio');
    const xp = izq ? x0 + w - 0.08 : x0 + 0.06;
    piv.add(caja(0.03, 0.03, 0.06, xp, 1.0, t / 2, M.perilla), caja(0.03, 0.03, 0.06, xp, 1.0, -t / 2 - 0.06, M.perilla));
    piv.userData.movil = { valor: 0, objetivo: 0, aplicar: (k: number) => { piv.rotation.y = (izq ? -1 : 1) * k * (Math.PI * 0.47); } } as Movil;
    g.add(piv);
    return g;
  }

  // Ventanas
  const tipo = v.ventana || 'corrediza';
  const panel = (grupo: THREE.Group, w: number, h: number, x0: number, z: number) => {
    const b = 0.035;
    grupo.add(caja(w, b, 0.03, x0, 0, z, M.alu), caja(w, b, 0.03, x0, h - b, z, M.alu), caja(b, h, 0.03, x0, 0, z, M.alu), caja(b, h, 0.03, x0 + w - b, 0, z, M.alu));
    grupo.add(caja(w - 2 * b, h - 2 * b, 0.006, x0 + b, b, z + 0.012, M.vidrio));
  };
  if (tipo === 'fija') { const gr = new THREE.Group(); gr.position.set(v.x, v.sill, zc - 0.015); panel(gr, v.w, v.h, 0, 0); g.add(gr); return g; }
  if (tipo === 'batiente') {
    const piv = new THREE.Group(); piv.position.set(izq ? v.x : v.x + v.w, v.sill, zA - 0.03);
    panel(piv, v.w, v.h, izq ? 0 : -v.w, 0);
    piv.userData.movil = { valor: 0, objetivo: 0, aplicar: (k: number) => { piv.rotation.y = (izq ? -1 : 1) * k * (Math.PI * 0.4); } } as Movil;
    g.add(piv); return g;
  }
  // Corrediza: dos hojas en rieles distintos; una corre sobre la otra.
  const hw = v.w / 2 + 0.02;
  const fija = new THREE.Group(); fija.position.set(izq ? v.x + v.w - hw : v.x, v.sill, zc - 0.035); panel(fija, hw, v.h, 0, 0); g.add(fija);
  const movil = new THREE.Group(); const x0 = izq ? v.x : v.x + v.w - hw;
  movil.position.set(x0, v.sill, zc + 0.005); panel(movil, hw, v.h, 0, 0);
  const dx = (izq ? 1 : -1) * (v.w - hw);
  movil.userData.movil = { valor: 0, objetivo: 0, aplicar: (k: number) => { movil.position.x = x0 + dx * k; } } as Movil;
  g.add(movil);
  return g;
}

// ── Una partida en 3D: devuelve el grupo y lo que ocupa a lo largo de X ────────
function partidaObj(p: Partida, porDentro: boolean, M: Mats): { g: THREE.Group; ancho: number } {
  const s = sistemaDe(p.sistema);
  const g = new THREE.Group();
  const L = Math.max(0.1, p.largo), H = Math.max(0.1, p.alto);

  if (s.familia === 'tabique' && s.forro) {
    // Columna de concreto con su forro de drywall por los 4 lados.
    const a = p.seccion?.a ?? 0.3, b = p.seccion?.b ?? 0.3, o = 0.025;
    g.add(caja(a, H, b, o + ESP, 0, o + ESP, M.concreto));
    const mp = matPlaca(p, s.placas[0], porDentro);
    const W = a + 2 * (o + ESP), D = b + 2 * (o + ESP);
    g.add(caja(W, H, ESP, 0, 0, 0, mp), caja(W, H, ESP, 0, 0, D - ESP, mp), caja(ESP, H, D - 2 * ESP, 0, 0, ESP, mp), caja(ESP, H, D - 2 * ESP, W - ESP, 0, ESP, mp));
    [[ESP, ESP], [W - ESP - 0.03, ESP], [ESP, D - ESP - 0.03], [W - ESP - 0.03, D - ESP - 0.03]].forEach(([x, z]) => g.add(caja(0.03, H, 0.03, x, 0, z, M.metal)));
    g.position.z = -D / 2;
    const w = new THREE.Group(); w.add(g); return { g: w, ancho: W };
  }

  if (s.familia === 'tabique') {
    const c = s.parante === '89' ? 0.089 : 0.064;
    const zA = c / 2 + ESP, zB = s.placas.length > 1 ? -c / 2 - ESP : -c / 2;
    const vanos = posicionVanos(p);
    const huecos: Hueco[] = vanos.map(v => ({ x: v.x, y: v.sill, w: v.w, h: v.h }));
    const nicho = p.nicho ? { x: (L - p.nicho.w) / 2, y: p.nicho.sill, w: p.nicho.w, h: p.nicho.h } : null;
    // Estructura: parantes (cortados en los vanos), rieles abajo y arriba, dinteles.
    posicionParantes(L, vanos).forEach(x => {
      const v = vanos.find(o => x > o.x + 0.001 && x < o.x + o.w - 0.001);
      const segs = v ? restar(H, [[v.sill, v.sill + v.h]]) : [[0, H] as [number, number]];
      segs.forEach(([a, b]) => g.add(caja(0.04, b - a, c - 0.004, Math.min(L - 0.04, Math.max(0, x - 0.02)), a, -c / 2 + 0.002, M.metal)));
    });
    g.add(caja(L, 0.03, c, 0, 0, -c / 2, M.metal), caja(L, 0.03, c, 0, H - 0.03, -c / 2, M.metal));
    vanos.forEach(v => { g.add(caja(v.w, 0.03, c, v.x, v.sill + v.h, -c / 2, M.metal)); if (v.sill > 0) g.add(caja(v.w, 0.03, c, v.x, v.sill - 0.03, -c / 2, M.metal)); });
    // Planchas: cara A (con el nicho) y cara B.
    const matA = matPlaca(p, s.placas[0], porDentro);
    cara(L, H, nicho ? [...huecos, nicho] : huecos, c / 2, matA, g);
    if (s.placas.length > 1) cara(L, H, huecos, -c / 2 - ESP, matPlaca(p, s.placas[1], false), g);
    if (!conPintura(p) && !porDentro) {
      juntas(L, H, nicho ? [...huecos, nicho] : huecos, zA + 0.001, g);
      if (s.placas.length > 1) juntas(L, H, huecos, zB - 0.001, g);
    }
    if (nicho && p.nicho) {
      // Fondo y costados del nicho; luz LED arriba en el muro de TV.
      const pr = p.nicho.prof, mi = matPlaca(p, s.placas[0], false);
      g.add(caja(nicho.w, nicho.h, ESP, nicho.x, nicho.y, zA - pr, M.oscuro));
      g.add(caja(nicho.w, ESP, pr, nicho.x, nicho.y, zA - pr, mi), caja(nicho.w, ESP, pr, nicho.x, nicho.y + nicho.h - ESP, zA - pr, mi));
      g.add(caja(ESP, nicho.h, pr, nicho.x, nicho.y, zA - pr, mi), caja(ESP, nicho.h, pr, nicho.x + nicho.w - ESP, nicho.y, zA - pr, mi));
      if (!s.sinLed) g.add(caja(nicho.w - 0.04, 0.012, 0.012, nicho.x + 0.02, nicho.y + nicho.h - 0.03, zA - 0.03, M.led));
    }
    if (s.remate) {
      const mr = matPlaca(p, s.placas[0], false);
      g.add(caja(L + 0.004, ESP, zA - zB, -0.002, H, zB, mr), caja(ESP, H, zA - zB, -ESP, 0, zB, mr), caja(ESP, H, zA - zB, L, 0, zB, mr));
    }
    if (s.led) g.add(caja(L - 0.06, 0.012, 0.012, 0.03, H + ESP, zA - 0.02, M.led));
    vanos.forEach(v => g.add(vanoObj(v, zA, zB, M)));
    return { g, ancho: L };
  }

  if (s.familia === 'cielo') {
    // Cielo visto desde arriba: placa con su estructura (omegas y primarios) encima.
    const A = Math.max(0.3, p.alto), y0 = ALTO_CIELO;
    const mp = conPintura(p) ? matPlaca(p, s.placas[0] || '', false) : new THREE.MeshStandardMaterial({ color: s.modular ? '#f8fafc' : colorPlaca(s.placas[0] || ''), roughness: 0.9 });
    if (s.curvo) {
      const f = Math.max(0.05, Math.min(A / 2, p.flecha ?? 0.5));
      const r = (A * A / 4 + f * f) / (2 * f), ang = 2 * Math.asin(Math.min(1, A / (2 * r)));
      const geo = new THREE.CylinderGeometry(r, r, L, 32, 1, true, -ang / 2, ang);
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: (mp as THREE.MeshStandardMaterial).color, roughness: 0.9, side: THREE.DoubleSide }));
      // El arco del cilindro mira a +Z con su eje en Y: se gira para que el eje quede en X y el arco hacia arriba.
      m.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
      m.position.set(L / 2, y0 + f - r, A / 2);
      g.add(m);
      for (let x = 0; x <= L + 1e-3; x += Math.max(0.4, L / Math.ceil(L / 0.6))) {
        const arc = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.012, 4, 24, ang), M.metal);
        arc.rotation.set(0, Math.PI / 2, Math.PI / 2 - ang / 2); // arco en el plano YZ, centrado hacia arriba
        arc.position.set(Math.min(L, x), y0 + f - r, A / 2);
        g.add(arc);
      }
    } else {
      g.add(caja(L, ESP, A, 0, y0, 0, mp));
      if (s.modular) {
        for (let x = 0; x <= L + 1e-3; x += 0.61) g.add(caja(0.024, 0.03, A, Math.min(L - 0.024, x), y0 - 0.01, 0, M.alu));
        for (let z = 0; z <= A + 1e-3; z += 0.61) g.add(caja(L, 0.03, 0.024, 0, y0 - 0.01, Math.min(A - 0.024, z), M.alu));
      } else {
        for (let z = 0.3; z < A; z += 0.61) g.add(caja(L, 0.035, 0.04, 0, y0 + ESP, z, M.metal));
        for (let x = 0.3; x < L; x += 1.22) g.add(caja(0.035, 0.064, A, x, y0 + ESP + 0.035, 0, M.metal));
      }
      if (s.desnivel && p.cajon) {
        const cw = p.cajon.ancho, ch = p.cajon.alto, mc = matPlaca(p, s.placas[0], false);
        g.add(caja(L, ch, ESP, 0, y0 - ch, cw, mc), caja(L, ch, ESP, 0, y0 - ch, A - cw - ESP, mc), caja(ESP, ch, A, cw, y0 - ch, 0, mc), caja(ESP, ch, A, L - cw - ESP, y0 - ch, 0, mc));
        g.add(caja(L, ESP, cw, 0, y0 - ch, 0, mc), caja(L, ESP, cw, 0, y0 - ch, A - cw, mc), caja(cw, ESP, A, 0, y0 - ch, 0, mc), caja(cw, ESP, A, L - cw, y0 - ch, 0, mc));
        g.add(caja(L - 2 * cw, 0.012, 0.012, cw, y0 - 0.02, cw + 0.02, M.led), caja(L - 2 * cw, 0.012, 0.012, cw, y0 - 0.02, A - cw - 0.03, M.led));
      }
    }
    g.add(caja(L, 0.03, 0.03, 0, y0, -0.03, M.alu), caja(L, 0.03, 0.03, 0, y0, A, M.alu));
    g.position.z = -A / 2;
    const w = new THREE.Group(); w.add(g); return { g: w, ancho: L };
  }

  // Cenefas, forros de viga y repisas: sección a lo largo de X.
  const cw = p.cajon?.ancho ?? 0.3, ch = p.cajon?.alto ?? 0.25;
  const mp = matPlaca(p, s.placas[0], porDentro);
  if (s.repisa) {
    const n = Math.min(6, Math.max(1, Math.round(p.cantidad || 1)));
    g.add(caja(L + 0.4, Math.max(1.2, n * 0.4 + 0.6), 0.02, -0.2, 0.6, -0.02, new THREE.MeshStandardMaterial({ color: '#f1ede6', roughness: 0.95 })));
    for (let i = 0; i < n; i++) {
      const y = 0.9 + i * 0.4;
      g.add(caja(L, ch, cw, 0, y, 0, mp));
      g.add(caja(L, 0.02, cw - 0.04, 0, y + ch / 2 - 0.01, 0.01, M.metal));
    }
    g.position.z = -cw / 2;
    const w = new THREE.Group(); w.add(g); return { g: w, ancho: L };
  }
  const y0 = ALTO_CIELO - ch;
  g.add(caja(L + 0.4, 0.02, cw + 0.6, -0.2, ALTO_CIELO, -0.3, new THREE.MeshStandardMaterial({ color: '#e5e1da', roughness: 0.95, transparent: true, opacity: 0.6 })));
  if (s.id === 'forro_viga') g.add(caja(L, ch - 0.05, cw - 0.06, 0, y0 + 0.05, 0.03, M.concreto));
  g.add(caja(L, ESP, cw, 0, y0, 0, mp), caja(L, ch, ESP, 0, y0, cw - ESP, mp));
  if (s.id === 'forro_viga') g.add(caja(L, ch, ESP, 0, y0, 0, mp));
  else g.add(caja(L, 0.012, 0.012, 0, y0 + ch - 0.03, 0.02, M.led)); // luz LED dentro del cajón
  g.position.z = -cw / 2;
  const w = new THREE.Group(); w.add(g); return { g: w, ancho: L };
}

export default function Drywall3D({ partidas, selId, todas, porDentro }: { partidas: Partida[]; selId?: string | null; todas: boolean; porDentro: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera; controls: OrbitControls; grupo: THREE.Group; render: () => void; ajustar: () => void; animar: () => void } | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const el = host.current; if (!el) return;
    const renderer = crearRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor('#eef2f7');
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#b8b0a2', 1.6));
    const sol = new THREE.DirectionalLight('#ffffff', 1.3); sol.position.set(3, 6, 5); scene.add(sol);
    const contra = new THREE.DirectionalLight('#ffffff', 0.5); contra.position.set(-3, 4, -5); scene.add(contra);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    const grupo = new THREE.Group(); scene.add(grupo);
    const render = () => renderer.render(scene, camera);
    controls.addEventListener('change', render);
    const ajustar = () => {
      // El piso no cuenta para el encuadre (es más grande que lo que se quiere ver).
      const box = new THREE.Box3();
      grupo.children.forEach(o => { if (!o.userData.sinAjuste) box.expandByObject(o); });
      if (box.isEmpty()) return;
      const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
      const r = Math.max(s.x, s.y, s.z * 0.6, 0.5);
      const dist = (r / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.3 / Math.min(1, camera.aspect);
      camera.position.copy(c).add(new THREE.Vector3(-0.35, 0.4, 1).normalize().multiplyScalar(dist));
      camera.near = dist / 100; camera.far = dist * 20; camera.updateProjectionMatrix();
      controls.target.copy(c); controls.update(); render();
    };
    const tam = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); render();
    };
    const ro = new ResizeObserver(tam); ro.observe(el); tam();
    // Animación de puertas y ventanas: solo corre mientras algo se mueve.
    let raf = 0;
    const paso = () => {
      raf = 0; let sigue = false;
      grupo.traverse(o => {
        const mv = o.userData.movil as Movil | undefined; if (!mv || mv.valor === mv.objetivo) return;
        const d = mv.objetivo - mv.valor, st = 0.07;
        mv.valor = Math.abs(d) <= st ? mv.objetivo : mv.valor + Math.sign(d) * st;
        mv.aplicar(mv.valor); if (mv.valor !== mv.objetivo) sigue = true;
      });
      render(); if (sigue) raf = requestAnimationFrame(paso);
    };
    const animar = () => { if (!raf) raf = requestAnimationFrame(paso); };
    // Tocar una puerta o ventana la abre o la cierra (sin arrastrar).
    const ray = new THREE.Raycaster(); let ini: { x: number; y: number } | null = null;
    const abajo = (e: PointerEvent) => { ini = { x: e.clientX, y: e.clientY }; };
    const arriba = (e: PointerEvent) => {
      if (!ini || Math.hypot(e.clientX - ini.x, e.clientY - ini.y) > 6) { ini = null; return; }
      ini = null;
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(grupo.children, true).find(h => movilDe(h.object));
      const mv = hit && movilDe(hit.object);
      if (mv) { mv.objetivo = mv.objetivo > 0.5 ? 0 : 1; animar(); }
    };
    renderer.domElement.addEventListener('pointerdown', abajo);
    renderer.domElement.addEventListener('pointerup', arriba);
    ctx.current = { renderer, camera, controls, grupo, render, ajustar, animar };
    return () => {
      if (raf) cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener('pointerdown', abajo); renderer.domElement.removeEventListener('pointerup', arriba);
      ro.disconnect(); controls.removeEventListener('change', render); controls.dispose();
      liberar(scene); liberarRenderer(renderer); ctx.current = null;
    };
  }, []);

  useEffect(() => {
    const c = ctx.current; if (!c) return;
    liberar(c.grupo); c.grupo.clear();
    const M = materiales();
    const lista = todas ? partidas : partidas.filter(p => p.id === selId).slice(0, 1);
    const ver = lista.length ? lista : partidas.slice(0, 1);
    // Lado a lado; si son muchas, en filas de hasta ~9 m (una detrás de otra).
    let x = 0, z = 0, profFila = 1, largo = 1, zMin = 0;
    ver.forEach(p => {
      const { g, ancho } = partidaObj(p, porDentro, M);
      const prof = sistemaDe(p.sistema).familia === 'cielo' ? p.alto : 1;
      if (x > 0 && x + ancho > 9) { z -= profFila / 2 + 2.2; x = 0; profFila = 1; }
      profFila = Math.max(profFila, prof);
      g.position.set(x, 0, z); c.grupo.add(g);
      x += ancho + 0.8; largo = Math.max(largo, x - 0.8); zMin = Math.min(zMin, z - profFila / 2);
    });
    const profTotal = -zMin + 1;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(largo + 1.6, profTotal + 1.6), new THREE.MeshStandardMaterial({ color: '#d9cdb8', roughness: 1 }));
    piso.rotation.x = -Math.PI / 2; piso.position.set(largo / 2, -0.001, (zMin + 0.5) / 2);
    piso.userData.sinAjuste = true;
    c.grupo.add(piso);
    c.ajustar();
    setAbierto(false);
  }, [partidas, selId, todas, porDentro]);

  const abrirTodo = (v: boolean) => {
    const c = ctx.current; if (!c) return;
    c.grupo.traverse(o => { const mv = o.userData.movil as Movil | undefined; if (mv) mv.objetivo = v ? 1 : 0; });
    setAbierto(v); c.animar();
  };

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden bg-slate-100">
      <div ref={host} className="absolute inset-0" />
      <button type="button" onClick={() => ctx.current?.ajustar()} title="Ver todo"
        className="absolute top-2 right-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white/95 shadow text-xs font-bold text-slate-700 cursor-pointer hover:bg-white">
        <Maximize2 className="w-4 h-4" /> Ver todo
      </button>
      <button type="button" onClick={() => abrirTodo(!abierto)} title={abierto ? 'Cerrar puertas y ventanas' : 'Abrir puertas y ventanas'}
        className={`absolute top-2 left-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl shadow text-xs font-bold cursor-pointer ${abierto ? 'bg-violet-600 text-white' : 'bg-white/95 text-slate-700 hover:bg-white'}`}>
        {abierto ? <DoorClosed className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />} {abierto ? 'Cerrar todo' : 'Abrir puertas'}
      </button>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-slate-500 pointer-events-none">Arrastra para girar · dos dedos o rueda para acercar · toca una puerta o ventana para abrirla</p>
    </div>
  );
}
