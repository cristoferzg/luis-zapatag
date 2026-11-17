// Texturas del 3D de Melamina, dibujadas en el momento (sin descargar imágenes):
// veta de madera para los colores madera, grano fino para los lisos, porcelanato
// para el piso y granito para el tablero de cocina. Se guardan para no repetirlas.
import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();
const COLORES_MADERA = new Set(['roble', 'nogal', 'cerezo', 'haya', 'wengue', 'cenizo']);
export const esMadera = (id: string) => COLORES_MADERA.has(id);

/** Número pseudoaleatorio estable (la misma veta cada vez). */
function azar(semilla: number) { let s = semilla >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function lienzo(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!] as const; }

function textura(c: HTMLCanvasElement, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/** Veta de madera vertical (la del tablero corre a lo largo, como en la plancha real). */
export function texturaMadera(id: string, hex: string): THREE.CanvasTexture {
  const k = `madera:${id}:${hex}`;
  const hit = cache.get(k); if (hit) return hit;
  const [c, g] = lienzo(512, 1024);
  const base = new THREE.Color(hex);
  g.fillStyle = `#${base.getHexString()}`; g.fillRect(0, 0, 512, 1024);
  const r = azar(id.length * 977 + hex.charCodeAt(1));
  // Vetas: líneas finas que ondulan suave, más oscuras y algunas más claras.
  for (let i = 0; i < 140; i++) {
    const x0 = r() * 512, amp = 2 + r() * 10, frec = 0.002 + r() * 0.006, fase = r() * 6.28;
    const osc = r() < 0.75;
    const col = base.clone().offsetHSL(0, osc ? 0.02 : -0.02, osc ? -(0.04 + r() * 0.12) : 0.03 + r() * 0.06);
    g.strokeStyle = `rgba(${Math.round(col.r * 255)}, ${Math.round(col.g * 255)}, ${Math.round(col.b * 255)}, ${0.25 + r() * 0.45})`;
    g.lineWidth = 0.6 + r() * (osc ? 2.4 : 1.2);
    g.beginPath();
    for (let y = 0; y <= 1024; y += 16) { const x = x0 + Math.sin(y * frec + fase) * amp + Math.sin(y * frec * 3.1) * amp * 0.25; y ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  // Nudos/catedrales suaves.
  for (let i = 0; i < 3; i++) {
    const cx = r() * 512, cy = r() * 1024;
    for (let a = 0; a < 7; a++) {
      g.strokeStyle = `rgba(${Math.round(base.r * 150)}, ${Math.round(base.g * 120)}, ${Math.round(base.b * 100)}, 0.18)`;
      g.lineWidth = 1.2; g.beginPath(); g.ellipse(cx, cy, 8 + a * 9, 40 + a * 26, 0, 0, Math.PI * 2); g.stroke();
    }
  }
  const t = textura(c); cache.set(k, t); return t;
}

/** Grano muy fino para melamina lisa (que no se vea como plástico plano). */
export function texturaLisa(hex: string): THREE.CanvasTexture {
  const k = `lisa:${hex}`;
  const hit = cache.get(k); if (hit) return hit;
  const [c, g] = lienzo(256, 256);
  g.fillStyle = hex; g.fillRect(0, 0, 256, 256);
  const r = azar(hex.charCodeAt(2) * 31);
  const img = g.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) { const d = (r() - 0.5) * 10; img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d; }
  g.putImageData(img, 0, 0);
  const t = textura(c, 2, 2); cache.set(k, t); return t;
}

/** Porcelanato 60 × 60 cm con su fragua (1 repetición = 1.2 m). */
export function texturaPiso(): THREE.CanvasTexture {
  const hit = cache.get('piso'); if (hit) return hit;
  const [c, g] = lienzo(512, 512);
  const r = azar(7);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const tono = 214 + Math.round(r() * 10);
    g.fillStyle = `rgb(${tono}, ${tono - 6}, ${tono - 14})`; g.fillRect(i * 256, j * 256, 256, 256);
    for (let n = 0; n < 60; n++) { g.fillStyle = `rgba(150, 140, 125, ${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(i * 256 + r() * 256, j * 256 + r() * 256, 4 + r() * 30, 2 + r() * 10, r() * 3, 0, 6.3); g.fill(); }
  }
  g.strokeStyle = '#b8b0a3'; g.lineWidth = 4;
  [0, 256, 512].forEach(p => { g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 512); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(512, p); g.stroke(); });
  const t = textura(c); cache.set('piso', t); return t;
}

/** Granito oscuro (tablero de cocina). */
export function texturaGranito(): THREE.CanvasTexture {
  const hit = cache.get('granito'); if (hit) return hit;
  const [c, g] = lienzo(512, 512);
  g.fillStyle = '#2f2c2b'; g.fillRect(0, 0, 512, 512);
  const r = azar(11);
  for (let n = 0; n < 9000; n++) {
    const v = r();
    g.fillStyle = v < 0.5 ? `rgba(20, 18, 18, ${0.5 + r() * 0.5})` : v < 0.85 ? `rgba(110, 104, 100, ${0.4 + r() * 0.4})` : `rgba(210, 205, 198, ${0.4 + r() * 0.5})`;
    const s = 1 + r() * 3.5; g.fillRect(r() * 512, r() * 512, s, s);
  }
  const t = textura(c, 2, 1); cache.set('granito', t); return t;
}
