// =============================================================================
// Vista 3D de la carpintería de madera: cada trabajo uno al lado del otro.
//   · Puertas en su muro con marco y contramarco: la hoja gira sobre sus bisagras.
//   · Closets y muebles contra la pared: puertas que giran y cajones que salen.
//   · Pisos, cielos y escaleras como se instalan.
// Tocar una hoja o un cajón lo abre; el botón "Abrir" abre todo.
// =============================================================================
import * as THREE from 'three';
import Visor3D, { caja, hacerMovil, muroConVano } from '../carpinteria/comun/Visor3D';
import { COLOR_MADERA, esSolida } from '../../catalogo/madera';
import { ItemMadera } from './modeloMadera';
import { colorAcabado } from './DibujoMadera';
import { datosEscalera } from './calculoMadera';

const mat = (hex: string, rough = 0.62) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 });
const matMetal = () => new THREE.MeshStandardMaterial({ color: '#c9b27c', roughness: 0.3, metalness: 0.8 });
const oscurecer = (hex: string, d: number) => '#' + new THREE.Color(hex).offsetHSL(0, 0, d).getHexString();

function hojaPuerta(it: ItemMadera, W: number, H: number, e: number, m: THREE.Material) {
  // Hoja en coordenadas locales: x 0..W (bisagra en x=0), y 0..H, cara trasera en z = 0.
  const g = new THREE.Group();
  g.add(caja(W, H, e, 0, 0, 0, m));
  if (it.tipo === 'puerta_apanelada') {
    const P = [2, 4, 6].includes(it.paneles) ? it.paneles : 4, cols = P >= 4 ? 2 : 1, rows = P / cols;
    const st = 0.127, top = 0.127, bot = 0.203, mid = 0.152;
    const pw = (W - 2 * st - (cols - 1) * st) / cols, ph = (H - top - bot - (rows - 1) * mid) / rows;
    const mp = mat(oscurecer(colorAcabado(it), 0.04));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = st + c * (pw + st), y = bot + r * (ph + mid);
      g.add(caja(pw - 0.06, ph - 0.06, 0.012, x + 0.03, y + 0.03, e, mp), caja(pw - 0.06, ph - 0.06, 0.012, x + 0.03, y + 0.03, -0.012, mp));
    }
  }
  return g;
}

function puerta(it: ItemMadera): THREE.Group {
  const g = new THREE.Group();
  const W = it.ancho, H = it.alto, conMarco = it.tipo === 'marco' || it.marco;
  const m = conMarco ? 0.04 : 0.005, c = 0.065, muroE = 0.15, lado = 0.6;
  const sw = W + 2 * lado;
  const matMuro = new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: 0.95 });
  g.add(muroConVano(sw, Math.max(2.6, H + 0.4), muroE, { x: lado - m, y: 0, w: W + 2 * m, h: H + m }, matMuro));
  if (conMarco) {
    const mm = mat(it.tipo === 'marco' ? colorAcabado(it) : colorAcabado({ acabado: it.acabado === 'duco' ? 'laca' : it.acabado, madera: it.maderaMarco }));
    g.add(caja(m, H + m, muroE + 0.01, lado - m, 0, -muroE - 0.005, mm), caja(m, H + m, muroE + 0.01, lado + W, 0, -muroE - 0.005, mm), caja(W, m, muroE + 0.01, lado, H, -muroE - 0.005, mm));
    [0.006, -muroE - 0.018].forEach(z => {
      g.add(caja(c, H + m + c, 0.012, lado - m - c, 0, z, mm), caja(c, H + m + c, 0.012, lado + W + m, 0, z, mm), caja(W + 2 * m, c, 0.012, lado - m, H + m, z, mm));
    });
  }
  if (it.tipo !== 'marco') {
    const e = 0.045, izq = it.lado === 'izq';
    const piv = new THREE.Group(); piv.position.set(izq ? lado : lado + W, 0, -0.02);
    const cuerpo = hojaPuerta(it, W - 0.006, H - 0.008, e, mat(colorAcabado(it), it.acabado === 'duco' ? 0.45 : 0.6));
    cuerpo.position.set(izq ? 0.003 : -(W - 0.003), 0.004, -e / 2);
    piv.add(cuerpo);
    if (it.chapa !== 'ninguna') {
      const hx = izq ? W - 0.07 : -W + 0.07;
      [e / 2 + 0.002, -e / 2 - 0.03].forEach(z => {
        const k = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), matMetal());
        k.position.set(hx, 1.0, z + 0.014); piv.add(k);
      });
    }
    hacerMovil(piv, v => { piv.rotation.y = (izq ? -1 : 1) * v * 1.45; });
    g.add(piv);
  }
  return g;
}

function mueble(it: ItemMadera): THREE.Group {
  const g = new THREE.Group();
  const W = it.ancho, H = it.alto, D = it.prof, t = esSolida(it.madera) ? 0.019 : it.espesor / 1000, z = 0.08, hc = 0.18;
  const lado = 0.3;
  const matMuro = new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: 0.95 });
  g.add(muroConVano(W + 2 * lado, Math.max(2.6, H + 0.2), 0.12, null, matMuro));
  const base = colorAcabado(it);
  const mc = mat(base), mi = mat(oscurecer(base, -0.08)), mf = mat(oscurecer(base, -0.2));
  const x0 = lado;
  g.add(caja(t, H, D, x0, 0, 0, mc), caja(t, H, D, x0 + W - t, 0, 0, mc), caja(W - 2 * t, t, D, x0 + t, H - t, 0, mc), caja(W - 2 * t, t, D, x0 + t, z, 0, mc));
  g.add(caja(W - 2 * t, z, t, x0 + t, 0, D - 0.04 - t, mf), caja(W, H - z, 0.004, x0, z, 0.001, mf));
  const hojas = Math.max(1, Math.round(it.hojas)), comps = hojas >= 2 ? Math.ceil(hojas / 2) : 1;
  const cw = (W - 2 * t - (comps - 1) * t) / comps;
  const filas = Math.max(0, Math.round(it.filasCajones));
  const hp = H - z - filas * hc - 0.006;
  const yTecho = H - t;
  for (let ci = 0; ci < comps; ci++) {
    const cx = x0 + t + ci * (cw + t);
    if (ci > 0) g.add(caja(t, yTecho - z - t, D - 0.02, cx - t, z + t, 0, mc));
    // Repisas repartidas en la parte alta (el closet deja la parte media para colgar).
    const nRep = Math.round(it.repisas / comps) + (ci < it.repisas % comps ? 1 : 0);
    const yBase = z + t + filas * hc;
    const colgar = it.colgador && it.tipo === 'closet' && ci % 2 === 0;
    for (let r = 0; r < nRep; r++) {
      const y = colgar ? yTecho - 0.32 - r * 0.0 : yBase + ((yTecho - yBase) * (r + 1)) / (nRep + 1);
      if (colgar && r > 0) break;
      g.add(caja(cw, t, D - 0.03, cx, y, 0, mi));
    }
    if (colgar) {
      const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, cw, 12), matMetal());
      barra.rotation.z = Math.PI / 2; barra.position.set(cx + cw / 2, yTecho - 0.4, D / 2); g.add(barra);
    }
    const enEste = ci === comps - 1 ? hojas - 2 * (comps - 1) : 2;
    const w = (cw - 0.003 * (enEste - 1)) / Math.max(1, enEste);
    if (hp > 0.1) for (let k = 0; k < enEste; k++) {
      const izq = enEste === 1 || k === 0;
      const px = cx + k * (w + 0.003);
      const piv = new THREE.Group(); piv.position.set(izq ? px : px + w, z + filas * hc + 0.003, D + 0.002);
      const cuerpo = new THREE.Group(); cuerpo.add(caja(w, hp, t, izq ? 0 : -w, 0, 0, mc));
      if (it.tirador) cuerpo.add(caja(0.012, 0.13, 0.025, izq ? w - 0.05 : -w + 0.04, it.tipo === 'closet' ? hp / 2 - 0.06 : hp - 0.2, t, matMetal()));
      piv.add(cuerpo);
      hacerMovil(piv, v => { piv.rotation.y = (izq ? -1 : 1) * v * 1.55; });
      g.add(piv);
    }
    for (let f = 0; f < filas; f++) {
      const y = z + f * hc + 0.002;
      const cj = new THREE.Group(); cj.position.set(0, 0, D + 0.002);
      cj.add(caja(cw - 0.004, hc - 0.004, t, cx + 0.002, y, 0, mc));
      cj.add(caja(cw - 0.06, 0.15, D - 0.1, cx + 0.03, y + 0.01, -(D - 0.1), mi));
      if (it.tirador) cj.add(caja(0.13, 0.012, 0.025, cx + cw / 2 - 0.065, y + hc / 2, t, matMetal()));
      hacerMovil(cj, v => { cj.position.z = D + 0.002 + v * (D - 0.15); });
      g.add(cj);
    }
  }
  return g;
}

function entablado(it: ItemMadera): THREE.Group {
  const g = new THREE.Group();
  const W = it.ancho, L = it.alto, piso = it.tipo === 'piso';
  const base = colorAcabado(it);
  const solida = esSolida(it.madera);
  const paso = solida ? Math.max(0.1, W / 50) : 1.22;
  const mats = [mat(base, 0.5), mat(oscurecer(base, -0.05), 0.5), mat(oscurecer(base, 0.04), 0.5)];
  const y = piso ? 0.0 : 2.5;
  for (let x = 0, k = 0; x < W - 1e-6; x += paso, k++) g.add(caja(Math.min(paso, W - x) - 0.003, 0.018, L, x, y, 0, mats[k % 3]));
  if (piso) {
    const cz = mat(oscurecer(base, -0.1));
    g.add(caja(W, 0.075, 0.018, 0, 0.018, -0.018, cz), caja(0.018, 0.075, L, -0.018, 0.018, 0, cz));
  } else {
    const ml = mat(COLOR_MADERA.pino);
    for (let x = 0; x <= W + 1e-6; x += 0.5) g.add(caja(0.05, 0.05, L, Math.min(x, W - 0.05), y + 0.018, 0, ml));
    const matMuro = new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: 0.95 });
    g.add(caja(W + 0.3, 2.6, 0.12, -0.15, 0, -0.12, matMuro));
  }
  return g;
}

function escalera(it: ItemMadera): THREE.Group {
  const g = new THREE.Group();
  const e = datosEscalera(it), B = it.ancho, ch = it.alto / e.n, hu = 0.25;
  const m = mat(colorAcabado(it)), mz = mat(oscurecer(colorAcabado(it), -0.1));
  // La escalera sube hacia atrás (-z): el primer paso adelante.
  for (let i = 0; i < e.n; i++) {
    const zf = -i * hu;
    g.add(caja(B, ch - 0.038, 0.019, 0.05, i * ch, zf - 0.019, mz));
    if (i < e.n - 1) g.add(caja(B + 0.02, 0.038, hu + 0.03, 0.04, (i + 1) * ch - 0.038, zf - hu, m));
  }
  const run = e.pasos * hu, L = Math.hypot(it.alto, run), ang = Math.atan2(it.alto, run);
  [0, B + 0.05].forEach(x => {
    const z = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.25, L), mz);
    z.position.set(x + 0.025, it.alto / 2 - 0.05, -run / 2); z.rotation.x = ang; g.add(z);
  });
  const mano = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, L), m);
  mano.position.set(B + 0.075, it.alto / 2 + 0.9, -run / 2); mano.rotation.x = ang; g.add(mano);
  for (let i = 0; i < e.pasos; i++) g.add(caja(0.038, 0.9, 0.038, B + 0.056, (i + 1) * ch, -i * hu - hu / 2 - 0.019, m));
  return g;
}

export function construirMadera(items: ItemMadera[]): THREE.Object3D {
  const raiz = new THREE.Group();
  let x = 0;
  let maxZ = 0, minZ = 0;
  items.forEach(it => {
    let o: THREE.Group; let ancho: number;
    if (it.tipo === 'closet' || it.tipo === 'mueble') { o = mueble(it); ancho = it.ancho + 0.6; maxZ = Math.max(maxZ, it.prof); }
    else if (it.tipo === 'piso' || it.tipo === 'cielo') { o = entablado(it); ancho = it.ancho + 0.3; o.position.z = 0.02; maxZ = Math.max(maxZ, it.alto); }
    else if (it.tipo === 'escalera') { o = escalera(it); ancho = it.ancho + 0.4; minZ = Math.min(minZ, -datosEscalera(it).pasos * 0.25); }
    else { o = puerta(it); ancho = it.ancho + 1.2; }
    o.position.x = x + (it.tipo === 'piso' || it.tipo === 'cielo' || it.tipo === 'escalera' ? 0.15 : 0);
    raiz.add(o);
    x += ancho + 0.25;
  });
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2, x + 1), Math.max(2, maxZ - minZ + 1.6)), new THREE.MeshStandardMaterial({ color: '#d9d4cc', roughness: 1 }));
  piso.rotation.x = -Math.PI / 2; piso.position.set(x / 2 - 0.25, -0.004, (maxZ + minZ) / 2 + 0.4);
  raiz.add(piso);
  return raiz;
}

export default function Madera3D({ items }: { items: ItemMadera[] }) {
  return <Visor3D construir={() => construirMadera(items)} clave={JSON.stringify(items)} acento="bg-amber-700"
    textoAyuda="Arrastra para girar · dos dedos o rueda para acercar · toca una puerta o un cajón para abrirlo" />;
}
