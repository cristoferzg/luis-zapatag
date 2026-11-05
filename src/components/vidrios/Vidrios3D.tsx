// =============================================================================
// Vista 3D de vidrios y aluminio: ventanas y mamparas en su muro, puertas de
// templado, ducha en su baño, baranda sobre la losa y espejo en la pared.
// Las corredizas deslizan, la proyectante se proyecta, las celosías giran sus
// lamas y las puertas giran: tocar una hoja o el botón "Abrir".
// =============================================================================
import * as THREE from 'three';
import Visor3D, { caja, hacerMovil, muroConVano } from '../carpinteria/comun/Visor3D';
import { colorAlu } from '../../catalogo/vidrios';
import { ItemVidrio } from './modeloVidrios';
import { geometria } from './calculoVidrios';

const matAlu = (it: ItemVidrio) => new THREE.MeshStandardMaterial({ color: colorAlu(it.color).hex, metalness: 0.55, roughness: 0.38 });
function matVidrio(v: string) {
  if (v.startsWith('espejo')) return new THREE.MeshStandardMaterial({ color: '#d5e1ec', metalness: 0.35, roughness: 0.08 });
  const cat = v === 'catedral';
  return new THREE.MeshStandardMaterial({ color: cat ? '#e0f2fe' : v.startsWith('templado') ? '#8fd3c9' : '#9fd8e8', transparent: true, opacity: cat ? 0.62 : 0.3, roughness: cat ? 0.6 : 0.05, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
}
const matMuro = () => new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: 0.95 });
const matInox = () => new THREE.MeshStandardMaterial({ color: '#d4d9de', metalness: 0.85, roughness: 0.22 });

/** Marco rectangular (4 barras) de ancho a (m) y fondo f, esquina inferior izquierda en (x, y, z). */
function marco(g: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, a: number, f: number, m: THREE.Material) {
  g.add(caja(w, a, f, x, y, z, m), caja(w, a, f, x, y + h - a, z, m), caja(a, h - 2 * a, f, x, y + a, z, m), caja(a, h - 2 * a, f, x + w - a, y + a, z, m));
}
function tubo(r: number, L: number, m: THREE.Material, eje: 'x' | 'y') {
  const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 14), m);
  if (eje === 'x') t.rotation.z = Math.PI / 2;
  return t;
}

/** Alto del alféizar (m) según el tipo. */
const alfeizar = (it: ItemVidrio) => it.tipo === 'mampara' || it.tipo === 'puerta_templada' ? 0 : it.tipo === 'espejo' ? 1.15
  : (it.tipo === 'proyectante' || it.tipo === 'celosia') && it.alto <= 0.8 ? 1.5 : Math.max(0.1, Math.min(1.0, 2.2 - it.alto));

function enMuro(it: ItemVidrio): THREE.Group {
  const g = new THREE.Group();
  const W = it.ancho, H = it.alto, lado = 0.6, y0 = alfeizar(it), e = 0.15;
  const muroH = Math.max(2.6, y0 + H + 0.3);
  const conVano = it.tipo !== 'espejo';
  g.add(muroConVano(W + 2 * lado, muroH, e, conVano ? { x: lado, y: y0, w: W, h: H } : null, matMuro()));
  const geo = geometria(it), ma = matAlu(it), mv = matVidrio(it.vidrio);
  const X = (mm: number) => lado + mm / 1000;
  const Yb = (yTopMm: number, hMm: number) => y0 + (H * 1000 - yTopMm - hMm) / 1000; // base de un elemento
  const zf = -0.09, fondo = 0.06;
  switch (it.tipo) {
    case 'corrediza': case 'mampara': {
      marco(g, lado, y0, zf, W, H, geo.marco / 1000, fondo, ma);
      const p = it.tipo === 'mampara' ? 0.045 : 0.032;
      geo.hojas.forEach(h => {
        const hoja = new THREE.Group();
        const z = h.plano ? -0.05 : -0.078;
        const x = X(h.x), y = Yb(h.y, h.h), w = h.w / 1000, hh = h.h / 1000;
        marco(hoja, x, y, z, w, hh, p, 0.022, ma);
        hoja.add(caja(w - 2 * p, hh - 2 * p, 0.006, x + p, y + p, z + 0.008, mv));
        if (it.tipo === 'mampara' && h.movil) hoja.add(caja(0.02, 0.3, 0.02, h.dir === -1 ? x + w - p - 0.03 : x + p + 0.01, y + hh / 2 - 0.15, z + 0.022, matInox()));
        if (h.plano === 1 && h.dir) { const desde = 0, rec = (h.w - (it.tipo === 'mampara' ? 50 : 40) - 20) / 1000; hacerMovil(hoja, v => { hoja.position.x = desde + h.dir * rec * v; }); }
        g.add(hoja);
      });
      break;
    }
    case 'proyectante': case 'fija': {
      marco(g, lado, y0, zf, W, H, geo.marco / 1000, fondo, ma);
      if (geo.hojas.length > 1) geo.hojas.slice(1).forEach(h => g.add(caja(geo.marco / 1000, H - 0.05, fondo, X(h.x) - geo.marco / 1000, y0 + 0.025, zf, ma)));
      geo.hojas.forEach(h => {
        const x = X(h.x), y = Yb(h.y, h.h), w = h.w / 1000, hh = h.h / 1000;
        if (it.tipo === 'fija') { g.add(caja(w, hh, 0.006, x, y, zf + 0.027, mv)); return; }
        const piv = new THREE.Group(); piv.position.set(0, y + hh, -0.035);
        const cuerpo = new THREE.Group();
        marco(cuerpo, x, -hh, -0.02, w, hh, 0.03, 0.03, ma);
        cuerpo.add(caja(w - 0.06, hh - 0.06, 0.006, x + 0.03, -hh + 0.03, -0.008, mv));
        piv.add(cuerpo);
        hacerMovil(piv, v => { piv.rotation.x = -v * 0.6; });
        g.add(piv);
      });
      break;
    }
    case 'celosia': {
      marco(g, lado, y0, zf, W, H, geo.marco / 1000, fondo, ma);
      const h = geo.hojas[0], n = geo.lamas || 2, paso = h.h / 1000 / n;
      const lamas = new THREE.Group();
      for (let k = 0; k < n; k++) {
        const l = new THREE.Group();
        l.position.set(X(h.x) + h.w / 2000, Yb(h.y, h.h) + (k + 0.5) * paso, zf + fondo / 2);
        l.add(caja(h.w / 1000, paso * 0.95, 0.005, -h.w / 2000, -paso * 0.475, -0.0025, mv));
        lamas.add(l);
      }
      hacerMovil(lamas, v => lamas.children.forEach(l => { l.rotation.x = -v * 1.1; }));
      g.add(lamas);
      break;
    }
    case 'puerta_templada': {
      geo.hojas.forEach(h => {
        const w = h.w / 1000, hh = h.h / 1000, izq = h.bisagra === 'izq';
        const piv = new THREE.Group(); piv.position.set(X(izq ? h.x : h.x + h.w), 0.008, -0.075);
        const cuerpo = new THREE.Group();
        cuerpo.add(caja(w, hh, 0.01, izq ? 0 : -w, 0, -0.005, mv));
        const jx = izq ? w - 0.08 : -w + 0.08;
        [0.03, -0.03].forEach(z => { const t = tubo(0.014, 0.6, matInox(), 'y'); t.position.set(jx, 1.0, z); cuerpo.add(t); });
        cuerpo.add(caja(0.09, 0.05, 0.03, izq ? 0 : -0.09, 0, -0.015, matInox()), caja(0.09, 0.05, 0.03, izq ? 0 : -0.09, hh - 0.05, -0.015, matInox()));
        piv.add(cuerpo);
        hacerMovil(piv, v => { piv.rotation.y = (izq ? -1 : 1) * v * 1.4; });
        g.add(piv);
      });
      break;
    }
    case 'espejo': {
      const h = geo.hojas[0];
      if (it.marcoEspejo) marco(g, lado, y0, 0, W, H, 0.02, 0.025, ma);
      g.add(caja(h.w / 1000, h.h / 1000, 0.006, X(h.x), Yb(h.y, h.h), 0.004, mv));
      if (it.biselado) g.add(caja(h.w / 1000 - 0.05, h.h / 1000 - 0.05, 0.002, X(h.x) + 0.025, Yb(h.y, h.h) + 0.025, 0.01, new THREE.MeshStandardMaterial({ color: '#e8eef4', metalness: 0.3, roughness: 0.05 })));
      // Lavatorio de referencia
      const lav = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
      g.add(caja(0.55, 0.15, 0.45, lado + W / 2 - 0.275, 0.8, 0, lav), caja(0.18, 0.8, 0.18, lado + W / 2 - 0.09, 0, 0.1, lav));
      break;
    }
  }
  return g;
}

function ducha(it: ItemVidrio): THREE.Group {
  const g = new THREE.Group();
  const W = it.ancho, H = it.alto, P = 0.9;
  const mw = matMuro(), mv = matVidrio(it.vidrio), ma = matAlu(it);
  g.add(caja(W + 0.15, 2.5, 0.1, -0.15, 0, -P - 0.1, mw), caja(0.1, 2.5, P + 0.1, -0.15, 0, -P - 0.1, mw));
  g.add(caja(W, 0.05, P, 0, 0, -P, new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 })));
  const geo = geometria(it);
  geo.hojas.forEach(h => {
    const x = h.x / 1000, w = h.w / 1000, hh = h.h / 1000, y = 0.05;
    if (!h.movil) {
      g.add(caja(w, hh, 0.008, x, y, -0.02, mv));
      g.add(caja(w, 0.02, 0.025, x, y, -0.03, ma));
      return;
    }
    if (it.ducha === 'batiente') {
      const piv = new THREE.Group(); piv.position.set(x, y, -0.016);
      const c = new THREE.Group(); c.add(caja(w, hh, 0.008, 0, 0, -0.004, mv));
      const t = tubo(0.012, 0.3, matInox(), 'y'); t.position.set(w - 0.07, 1.0, 0.03); c.add(t);
      piv.add(c); hacerMovil(piv, v => { piv.rotation.y = -v * 1.3; }); g.add(piv);
      return;
    }
    const hoja = new THREE.Group();
    hoja.add(caja(w, hh, 0.008, x, y, 0.004, mv));
    const t = tubo(0.012, 0.3, matInox(), 'y'); t.position.set(h.dir === -1 ? x + w - 0.07 : x + 0.07, 1.0, 0.035); hoja.add(t);
    const rec = (h.w - 50 - 30) / 1000;
    hacerMovil(hoja, v => { hoja.position.x = h.dir * rec * v; });
    g.add(hoja);
  });
  g.add(caja(0.025, H, 0.025, -0.05, 0.05, -0.03, ma));
  if (it.ducha === 'corrediza') { const t = tubo(0.013, W + 0.05, matInox(), 'x'); t.position.set(W / 2, H + 0.08, 0.02); g.add(t); }
  return g;
}

function baranda(it: ItemVidrio): THREE.Group {
  const g = new THREE.Group();
  const W = it.ancho, H = it.alto, pinzas = it.baranda === 'pinzas';
  const ma = matAlu(it), mv = matVidrio(it.vidrio), inox = matInox();
  g.add(caja(W + 0.4, 0.2, 1.2, -0.2, -0.2, -1.0, new THREE.MeshStandardMaterial({ color: '#d6d3d1', roughness: 0.9 })));
  const geo = geometria(it);
  if (!pinzas) g.add(caja(W, 0.09, 0.06, 0, 0, -0.03, ma));
  geo.hojas.forEach(h => g.add(caja(h.w / 1000, (pinzas ? H - 0.1 : H - 0.04) - 0.02, 0.012, h.x / 1000, pinzas ? 0.06 : 0.02, -0.006, mv)));
  if (pinzas) {
    const xs = geo.hojas.map(h => h.x / 1000 - 0.03).concat([W - 0.0]);
    xs.forEach(x => { const t = tubo(0.022, H, inox, 'y'); t.position.set(Math.max(0.02, Math.min(W - 0.02, x)), H / 2, -0.04); g.add(t); });
  }
  g.add(caja(W + 0.04, 0.045, 0.06, -0.02, H - 0.02, -0.03, ma));
  return g;
}

export function construirVidrios(items: ItemVidrio[]): THREE.Object3D {
  const raiz = new THREE.Group();
  let x = 0;
  items.forEach(it => {
    let o: THREE.Group, ancho: number;
    if (it.tipo === 'ducha') { o = ducha(it); o.position.x = x + 0.2; ancho = it.ancho + 0.4; }
    else if (it.tipo === 'baranda') { o = baranda(it); o.position.x = x + 0.2; ancho = it.ancho + 0.4; }
    else { o = enMuro(it); o.position.x = x; ancho = it.ancho + 1.2; }
    raiz.add(o);
    x += ancho + 0.3;
  });
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2, x + 1), 4), new THREE.MeshStandardMaterial({ color: '#d9d4cc', roughness: 1 }));
  piso.rotation.x = -Math.PI / 2; piso.position.set(x / 2 - 0.3, -0.004, 0.6);
  raiz.add(piso);
  return raiz;
}

export default function Vidrios3D({ items }: { items: ItemVidrio[] }) {
  return <Visor3D construir={() => construirVidrios(items)} clave={JSON.stringify(items)} acento="bg-cyan-600"
    textoAyuda="Arrastra para girar · dos dedos o rueda para acercar · toca una hoja para abrirla o correrla" />;
}
