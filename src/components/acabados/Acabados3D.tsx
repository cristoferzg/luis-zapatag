// =============================================================================
// Acabados en 3D: cada ambiente como una "casa de muñecas" (paredes de una sola
// cara, así las paredes que miran a la cámara no tapan): piso con la textura del
// cerámico / porcelanato / laminado (formato, color y junta reales), paredes con su
// color de pintura y la franja de enchape, puertas y ventanas. Render a pedido.
// =============================================================================
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { crearRenderer, liberarRenderer } from '../../lib/webglSeguro';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2 } from 'lucide-react';
import { formato } from '../../catalogo/acabados';
import { Ambiente, Pt, plantaDe, esBaldosa } from './modeloAcabados';

function liberar(obj: THREE.Object3D) {
  obj.traverse(o => {
    const x = o as THREE.Mesh;
    x.geometry?.dispose?.();
    const mt = x.material as THREE.Material | THREE.Material[] | undefined;
    const fuera = (m: THREE.Material) => { (m as THREE.MeshStandardMaterial).map?.dispose?.(); m.dispose(); };
    if (Array.isArray(mt)) mt.forEach(fuera); else if (mt) fuera(mt);
  });
}

// ── Texturas (canvas) ────────────────────────────────────────────────────────
interface Tex { tex: THREE.Texture; sx: number; sy: number }
const sombra = (hex: string, f: number) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, f); return `#${c.getHexString()}`; };
function lienzo(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function aTextura(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/** Baldosas: patrón de 4 × 4 piezas (a × b cm) con su junta y un leve cambio de tono. */
function texBaldosa(a: number, b: number, color: string, fragua: string, junta: number): Tex {
  const n = 4, sx = (n * b) / 100, sy = (n * a) / 100;
  const W = 512, H = Math.max(64, Math.min(1024, Math.round((W * sy) / sx)));
  const c = lienzo(W, H), g = c.getContext('2d')!;
  g.fillStyle = fragua; g.fillRect(0, 0, W, H);
  const pw = W / n, ph = H / n;
  const j = Math.max(1.2, ((junta / 10) / b) * pw);
  let s = 7;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
    g.fillStyle = sombra(color, (rnd() - 0.5) * 0.05);
    g.fillRect(i * pw + j / 2, k * ph + j / 2, pw - j, ph - j);
    // Brillo suave en una esquina.
    const gr = g.createLinearGradient(i * pw, k * ph, (i + 1) * pw, (k + 1) * ph);
    gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.04)');
    g.fillStyle = gr; g.fillRect(i * pw + j / 2, k * ph + j / 2, pw - j, ph - j);
  }
  return { tex: aTextura(c), sx, sy };
}
/** Tablas (laminado / vinílico): 0.20 × 1.20 m, trabadas, con veta. */
function texTabla(color: string): Tex {
  const sx = 2.4, sy = 0.8, W = 1024, H = Math.round((W * sy) / sx);
  const c = lienzo(W, H), g = c.getContext('2d')!;
  const filas = 4, fh = H / filas, tl = W / 2;
  let s = 3;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let f = 0; f < filas; f++) {
    const off = ((f * 0.37) % 1) * tl;
    for (let k = -1; k < 3; k++) {
      const x0 = k * tl + off;
      g.fillStyle = sombra(color, (rnd() - 0.5) * 0.09); g.fillRect(x0, f * fh, tl, fh);
      g.strokeStyle = 'rgba(60,35,15,0.16)'; g.lineWidth = 1;
      for (let v = 0; v < 6; v++) { const y = f * fh + fh * (0.15 + 0.7 * rnd()); g.beginPath(); g.moveTo(x0, y); g.bezierCurveTo(x0 + tl * 0.3, y + 3, x0 + tl * 0.6, y - 3, x0 + tl, y + 1); g.stroke(); }
      g.fillStyle = 'rgba(40,25,10,0.35)'; g.fillRect(x0, f * fh, 1.5, fh);
    }
    g.fillStyle = 'rgba(40,25,10,0.3)'; g.fillRect(0, f * fh, W, 1.5);
  }
  return { tex: aTextura(c), sx, sy };
}
/** Cemento pulido con bruñas cada 1 m. */
function texPulido(color: string): Tex {
  const W = 256, c = lienzo(W, W), g = c.getContext('2d')!;
  g.fillStyle = color; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect(Math.random() * W, Math.random() * W, 3, 3); }
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, W, 2); g.fillRect(0, 0, 2, W);
  return { tex: aTextura(c), sx: 1, sy: 1 };
}
/** Escala las UV de una geometría (en metros) al tamaño del patrón. */
function uvs(geo: THREE.BufferGeometry, fx: number, fy: number, ox = 0, oy = 0) {
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + ox) * fx, (uv.getY(i) + oy) * fy);
  uv.needsUpdate = true;
}
function etiqueta(texto: string) {
  const c = lienzo(512, 96), g = c.getContext('2d')!;
  g.font = 'bold 44px system-ui, sans-serif';
  const w = Math.min(500, g.measureText(texto).width + 40);
  g.fillStyle = 'rgba(15,23,42,0.82)'; g.beginPath(); (g as any).roundRect?.((512 - w) / 2, 14, w, 68, 22); if (!(g as any).roundRect) g.rect((512 - w) / 2, 14, w, 68); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, 256, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
  sp.scale.set(2.4, 0.45, 1); sp.renderOrder = 10;
  return sp;
}

/** Posición de cada ambiente: los de Obra Civil en su lugar real; los manuales en filas. */
export function disposicion(ambs: Ambiente[]): { amb: Ambiente; poly: Pt[] }[] {
  const reales = ambs.filter(a => a.poly && a.poly.length >= 3);
  let x0 = 0, yMax = 0;
  if (reales.length) {
    const xs = reales.flatMap(a => a.poly!.map(p => p.x)), ys = reales.flatMap(a => a.poly!.map(p => p.y));
    x0 = Math.max(...xs) + 1; yMax = Math.min(...ys);
  }
  const manuales = ambs.filter(a => !(a.poly && a.poly.length >= 3));
  const areaT = manuales.reduce((s, a) => s + a.largo * a.ancho, 0);
  const tope = Math.max(8, Math.sqrt(areaT) * 1.7);
  let x = 0, y = yMax, fila = 0;
  const pos = new Map<string, Pt>();
  manuales.forEach(a => {
    if (x > 0 && x + a.largo > tope) { x = 0; y += fila + 0.8; fila = 0; }
    pos.set(a.id, { x: x0 + x, y }); x += a.largo + 0.8; fila = Math.max(fila, a.ancho);
  });
  return ambs.map(a => {
    const p = pos.get(a.id);
    return { amb: a, poly: p ? plantaDe(a).map(q => ({ x: q.x + p.x, y: q.y + p.y })) : plantaDe(a) };
  });
}

export default function Acabados3D({ ambientes, sel }: { ambientes: Ambiente[]; sel: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; cam: THREE.PerspectiveCamera; controls: OrbitControls; grupo: THREE.Group; render: () => void; ajustar: () => void } | null>(null);

  useEffect(() => {
    const el = host.current; if (!el) return;
    const renderer = crearRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor('#dfe4eb');
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#c9c2b6', 1.9));
    const sol = new THREE.DirectionalLight('#ffffff', 1.1); sol.position.set(-5, 10, 7); scene.add(sol);
    const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 400);
    const grupo = new THREE.Group(); scene.add(grupo);
    const controls = new OrbitControls(cam, renderer.domElement);
    controls.enableDamping = false; controls.maxPolarAngle = Math.PI * 0.49;
    const c = { renderer, scene, cam, controls, grupo, render: () => renderer.render(scene, cam), ajustar: () => {} };
    controls.addEventListener('change', c.render);
    c.ajustar = () => {
      const box = new THREE.Box3();
      grupo.children.forEach(o => { if (!o.userData.sinAjuste) box.expandByObject(o); });
      if (box.isEmpty()) { c.render(); return; }
      const centro = box.getCenter(new THREE.Vector3());
      const w = el.clientWidth || 300, h = el.clientHeight || 300, asp = w / h;
      const dir = new THREE.Vector3(-0.35, 1.05, 1).normalize();
      const esfera = box.getBoundingSphere(new THREE.Sphere());
      const fovV = (cam.fov * Math.PI) / 180, fovH = 2 * Math.atan(Math.tan(fovV / 2) * asp);
      const dist = (esfera.radius / Math.sin(Math.min(fovV, fovH) / 2)) * (asp < 1 ? 1.02 : 0.95);
      cam.aspect = asp; cam.position.copy(centro).add(dir.multiplyScalar(dist));
      cam.near = dist / 100; cam.far = dist * 30; cam.updateProjectionMatrix();
      controls.target.copy(centro); controls.update(); c.render();
    };
    const tam = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); c.render();
    };
    const ro = new ResizeObserver(tam); ro.observe(el); tam();
    ctx.current = c;
    return () => { ro.disconnect(); controls.dispose(); liberar(scene); liberarRenderer(renderer); ctx.current = null; };
  }, []);

  const firma = JSON.stringify(ambientes) + '|' + sel;
  useEffect(() => {
    const c = ctx.current; if (!c) return;
    liberar(c.grupo); c.grupo.clear();
    const cache = new Map<string, Tex>();
    const textura = (k: string, f: () => Tex) => { let t = cache.get(k); if (!t) { t = f(); cache.set(k, t); } return t; };
    const lista = disposicion(ambientes).filter(x => !sel || x.amb.id === sel);
    const yeso = new THREE.MeshStandardMaterial({ color: '#e7e3dc', roughness: 0.95 });
    const madera = new THREE.MeshStandardMaterial({ color: '#8b5a3c', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 });
    const vidrio = new THREE.MeshStandardMaterial({ color: '#a9d2ec', roughness: 0.15, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2 });
    const marco = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -1 });
    const borde = new THREE.LineBasicMaterial({ color: '#64748b', transparent: true, opacity: 0.35 });
    const base = new THREE.MeshStandardMaterial({ color: '#c3cad4', roughness: 1 });
    // Cara de atrás de cada pared: vidrio tenue (las paredes del frente se ven como fantasma).
    const fantasma = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false });

    lista.forEach(({ amb: a, poly }) => {
      const H = a.alto;
      // Piso.
      const shape = new THREE.Shape(poly.map(p => new THREE.Vector2(p.x, p.y)));
      const geoP = new THREE.ShapeGeometry(shape);
      let matPiso: THREE.Material;
      const pz = a.piso;
      if (esBaldosa(pz.tipo)) {
        const f = formato(pz.formato);
        const t = textura(`b|${f.id}|${pz.color}|${pz.fragua}|${pz.junta}`, () => texBaldosa(f.a, f.b, pz.color, pz.fragua, pz.junta));
        uvs(geoP, 1 / t.sx, 1 / t.sy); matPiso = new THREE.MeshStandardMaterial({ map: t.tex, roughness: pz.tipo === 'porcelanato' ? 0.35 : 0.55, side: THREE.DoubleSide });
      } else if (pz.tipo === 'laminado' || pz.tipo === 'vinilico') {
        const t = textura(`t|${pz.color}`, () => texTabla(pz.color));
        uvs(geoP, 1 / t.sx, 1 / t.sy); matPiso = new THREE.MeshStandardMaterial({ map: t.tex, roughness: 0.6, side: THREE.DoubleSide });
      } else if (pz.tipo === 'pulido') {
        const t = textura(`p|${pz.color}`, () => texPulido(pz.color));
        uvs(geoP, 1, 1); matPiso = new THREE.MeshStandardMaterial({ map: t.tex, roughness: 0.4, side: THREE.DoubleSide });
      } else matPiso = new THREE.MeshStandardMaterial({ color: '#b9b4ab', roughness: 1, side: THREE.DoubleSide });
      const piso = new THREE.Mesh(geoP, matPiso); piso.rotation.x = Math.PI / 2; c.grupo.add(piso);
      // Losa bajo el piso (da cuerpo al modelo).
      const geoB = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
      const losa = new THREE.Mesh(geoB, base); losa.rotation.x = Math.PI / 2; losa.position.y = -0.002; c.grupo.add(losa);

      // Paredes (una cara, mirando hacia adentro).
      let s2 = 0; poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; s2 += p.x * q.y - q.x * p.y; });
      const matPint = a.pintura.activo ? new THREE.MeshStandardMaterial({ color: a.pintura.color, roughness: a.pintura.tipo === 'satinado' ? 0.5 : 0.9 }) : yeso;
      const en = a.enchape, f = formato(en.formato);
      const tE = en.activo ? textura(`b|${f.id}|${en.color}|${en.fragua}|${en.junta}`, () => texBaldosa(f.a, f.b, en.color, en.fragua, en.junta)) : null;
      const matE = tE ? new THREE.MeshStandardMaterial({ map: tE.tex, roughness: 0.35 }) : null;
      const per = poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + Math.hypot(q.x - p.x, q.y - p.y); }, 0);
      let quedaE = en.activo ? (en.largo > 0 ? Math.min(en.largo, per) : per) : 0;
      const y0E = en.desde, y1E = Math.min(H, en.desde + en.alto);
      // Vanos repartidos en los muros más largos.
      const lados = poly.map((p, i) => ({ i, L: Math.hypot(poly[(i + 1) % poly.length].x - p.x, poly[(i + 1) % poly.length].y - p.y) }));
      const orden = [...lados].sort((p, q) => q.L - p.L);
      const porLado = new Map<number, typeof a.vanos>();
      a.vanos.forEach((v, k) => { const l = orden[k % orden.length]; porLado.set(l.i, [...(porLado.get(l.i) || []), v]); });
      poly.forEach((p, i) => {
        const q = poly[(i + 1) % poly.length];
        const L = Math.hypot(q.x - p.x, q.y - p.y); if (L < 0.02) return;
        const ux = (q.x - p.x) / L, uy = (q.y - p.y) / L;
        const nx = s2 > 0 ? -uy : uy, ny = s2 > 0 ? ux : -ux; // normal hacia adentro (planta)
        const rotY = Math.atan2(nx, ny);
        // Plano: su +x local apunta a (cos, -sin) → sentido del muro o el contrario.
        const sentido = Math.cos(rotY) * ux - Math.sin(rotY) * uy >= 0 ? 1 : -1;
        const tramo = (t0: number, t1: number, y0: number, y1: number, mat: THREE.Material, tex?: Tex | null, d = 0) => {
          const w = t1 - t0, h = y1 - y0; if (w < 0.005 || h < 0.005) return;
          const g = new THREE.PlaneGeometry(w, h);
          if (tex) uvs(g, w / tex.sx, h / tex.sy, sentido > 0 ? t0 / w : (L - t1) / w, 0);
          const m = new THREE.Mesh(g, mat);
          const tc = (t0 + t1) / 2;
          m.position.set(p.x + ux * tc + nx * d, (y0 + y1) / 2, p.y + uy * tc + ny * d); m.rotation.y = rotY;
          c.grupo.add(m);
        };
        { const g = new THREE.PlaneGeometry(L, H); const m = new THREE.Mesh(g, fantasma); m.position.set((p.x + q.x) / 2, H / 2, (p.y + q.y) / 2); m.rotation.y = rotY; m.renderOrder = 5; c.grupo.add(m); }
        const le = Math.min(L, quedaE); quedaE -= le;
        if (le > 0 && matE) {
          tramo(0, le, 0, y0E, matPint); tramo(0, le, y0E, y1E, matE, tE); tramo(0, le, y1E, H, matPint);
          tramo(le, L, 0, H, matPint);
        } else tramo(0, L, 0, H, matPint);
        // Contrazócalo.
        if (a.contrazocalo.activo && a.piso.tipo !== 'ninguno' && !(le > 0 && y0E < 0.01)) {
          const mz = esBaldosa(a.piso.tipo) ? matPiso : new THREE.MeshStandardMaterial({ color: sombra(a.piso.color, -0.08), roughness: 0.6 });
          tramo(0, L, 0, a.contrazocalo.alto, mz, null, 0.012);
        }
        // Puertas y ventanas del lado.
        const vs = porLado.get(i) || [];
        vs.forEach((v, k) => {
          const tc = (L * (k + 1)) / (vs.length + 1), w = Math.min(v.w, L - 0.1);
          const y0 = v.tipo === 'puerta' ? 0 : v.sill, y1 = Math.min(H - 0.02, y0 + v.h);
          tramo(tc - w / 2 - 0.04, tc + w / 2 + 0.04, Math.max(0, y0 - 0.04), Math.min(H, y1 + 0.04), marco, null, 0.014);
          tramo(tc - w / 2, tc + w / 2, y0, y1, v.tipo === 'puerta' ? madera : vidrio, null, 0.02);
        });
      });
      // Borde superior de los muros (se ve también el de los muros ocultos).
      const pts = [...poly, poly[0]].map(p => new THREE.Vector3(p.x, H, p.y));
      c.grupo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), borde));
      const pts0 = [...poly, poly[0]].map(p => new THREE.Vector3(p.x, 0.003, p.y));
      c.grupo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts0), borde));
      // Nombre.
      let cx = 0, cy = 0; poly.forEach(p => { cx += p.x; cy += p.y; });
      if (!sel) {
        const sp = etiqueta(a.nombre); sp.position.set(cx / poly.length, H + 0.45, cy / poly.length); sp.userData.sinAjuste = true;
        sp.scale.multiplyScalar(Math.max(1, Math.sqrt(lista.length) * 0.55));
        c.grupo.add(sp);
      }
    });
    c.ajustar();
  }, [firma]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full min-h-[340px] rounded-2xl overflow-hidden bg-slate-100">
      <div ref={host} className="absolute inset-0" />
      <button type="button" onClick={() => ctx.current?.ajustar()} title="Ver todo"
        className="absolute top-2 right-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white/95 shadow text-xs font-bold text-slate-700 cursor-pointer hover:bg-white">
        <Maximize2 className="w-4 h-4" /> Ver todo
      </button>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-slate-500 pointer-events-none">Arrastra para girar · dos dedos o rueda para acercar · las paredes del frente se ocultan para ver adentro</p>
    </div>
  );
}
