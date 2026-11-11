// =============================================================================
// Gasfitería en 3D / isométrico: tuberías como cilindros con su diámetro real
// (agrandado para que se vean), agua fría a 0.30 m y caliente a 0.40 m subiendo por
// el muro hasta cada salida, desagüe bajo el piso con su pendiente hacia la caja de
// registro, ventilación subiendo al techo, empalmes como esferas, aparatos sencillos
// y muros tenues. Se dibuja solo cuando algo cambia (render a pedido).
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { crearRenderer, liberarRenderer } from '../../lib/webglSeguro';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2, Box as BoxIc } from 'lucide-react';
import { Aparato, CotizacionGas, Red, REDES, defAparato, limites, esAgua } from './modeloGasfiteria';
import { grafoRed, raicesDe, profundidades, ALTURA_FRIA, ALTURA_CALIENTE, Empalme } from './calculoGasfiteria';

// Diámetro exterior (m) de cada tubo; se agranda ×1.6 para que se lea en pantalla.
const DE: Record<string, number> = { '1/2': 0.021, '3/4': 0.027, '1': 0.033, '2': 0.055, '3': 0.08, '4': 0.106 };
const radio = (d: string) => ((DE[d] || 0.03) / 2) * 1.6;

function liberar(obj: THREE.Object3D) {
  obj.traverse(o => {
    const x = o as THREE.Mesh;
    x.geometry?.dispose?.();
    const mt = x.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mt)) mt.forEach(m => m.dispose()); else mt?.dispose?.();
  });
}
function cilindro(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const L = a.distanceTo(b); if (L < 1e-4) return null;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 14), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}
const caja = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); return m;
};
const cil = (r: number, h: number, x: number, y: number, z: number, mat: THREE.Material, seg = 20) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y + h / 2, z); return m;
};

/** Aparato en coordenadas locales: x a lo ancho, z = y local (espalda en -d/2), y hacia arriba. */
function aparatoObj(a: Aparato, mats: Record<string, THREE.Material>): THREE.Group {
  const d = defAparato(a.tipo), g = new THREE.Group(), w = d.w, p = d.d;
  const { loza, metal, oscuro, concreto, agua, granito, naranja, tapa } = mats as Record<string, THREE.Material>;
  switch (a.tipo) {
    case 'inodoro':
      g.add(caja(0.3, 0.38, 0.42, 0, 0, 0.06, loza), caja(0.38, 0.36, 0.17, 0, 0.38, -p / 2 + 0.09, loza), caja(0.36, 0.03, 0.44, 0, 0.38, 0.07, loza));
      break;
    case 'lavatorio':
      g.add(cil(0.08, 0.7, 0, 0, -0.05, loza), caja(w, 0.14, p, 0, 0.7, 0, loza), caja(w * 0.62, 0.02, p * 0.55, 0, 0.83, 0.03, agua), cil(0.012, 0.12, 0, 0.84, -p / 2 + 0.06, metal, 8));
      break;
    case 'ducha':
      g.add(caja(w, 0.05, p, 0, 0, 0, loza), cil(0.05, 0.006, 0, 0.05, 0, metal), cil(0.012, 2.0, 0, 0, -p / 2 + 0.05, metal, 8));
      { const brazo = cilindro(new THREE.Vector3(0, 1.98, -p / 2 + 0.05), new THREE.Vector3(0, 1.98, -p / 2 + 0.3), 0.012, metal); if (brazo) g.add(brazo); }
      g.add(cil(0.09, 0.025, 0, 1.94, -p / 2 + 0.3, metal));
      break;
    case 'tina':
      g.add(caja(w, 0.5, p, 0, 0, 0, loza), caja(w - 0.14, 0.02, p - 0.14, 0, 0.49, 0, agua));
      break;
    case 'lavadero_cocina':
      g.add(caja(w + 0.6, 0.86, p + 0.05, 0.3, 0, 0, mats.mueble), caja(w + 0.6, 0.03, p + 0.08, 0.3, 0.86, 0.01, granito), caja(0.42, 0.02, p - 0.15, -w / 2 + 0.26, 0.88, 0.02, metal), cil(0.012, 0.25, -w / 2 + 0.26, 0.88, -p / 2 + 0.05, metal, 8));
      break;
    case 'lavadero_ropa':
      g.add(caja(0.12, 0.75, p - 0.1, -w / 2 + 0.06, 0, 0, concreto), caja(0.12, 0.75, p - 0.1, w / 2 - 0.06, 0, 0, concreto), caja(w, 0.22, p, 0, 0.75, 0, granito), caja(w - 0.1, 0.02, p * 0.42, 0, 0.96, -p / 2 + 0.05 + p * 0.21, agua));
      break;
    case 'lavadora':
      g.add(caja(w, 0.85, p, 0, 0, 0, loza));
      { const ojo = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 24), oscuro); ojo.rotation.x = Math.PI / 2; ojo.position.set(0, 0.45, p / 2 + 0.005); g.add(ojo); }
      break;
    case 'terma': {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.75, 24), loza); t.position.set(0, 1.55, -p / 2 + 0.22); g.add(t);
      g.add(caja(0.12, 0.08, 0.02, 0, 1.45, -p / 2 + 0.44, naranja));
      break;
    }
    case 'urinario': g.add(caja(w, 0.6, p, 0, 0.4, -p / 2 + p / 2, loza)); break;
    case 'sumidero': g.add(cil(0.08, 0.008, 0, 0.001, 0, metal)); break;
    case 'registro': g.add(cil(0.08, 0.01, 0, 0.001, 0, mats.bronce)); break;
    case 'caja_registro':
      g.add(caja(w + 0.08, 0.6, p + 0.08, 0, -0.6, 0, mats.concretoT), caja(w + 0.08, 0.025, p + 0.08, 0, 0, 0, tapa));
      break;
    case 'medidor':
      g.add(caja(w + 0.06, 0.35, p + 0.06, 0, -0.33, 0, mats.concretoT), caja(w + 0.06, 0.02, p + 0.06, 0, 0.02, 0, mats.azul));
      break;
    case 'tanque': g.add(cil(0.55, 1.25, 0, 0, 0, oscuro, 28), cil(0.25, 0.08, 0, 1.25, 0, oscuro)); break;
    case 'grifo_jardin': g.add(cil(0.012, 0.5, 0, 0, -p / 2 + 0.03, metal, 8), caja(0.04, 0.04, 0.08, 0, 0.48, -p / 2 + 0.07, mats.bronce)); break;
  }
  return g;
}

export interface Visibles { fria: boolean; caliente: boolean; desague: boolean; ventilacion: boolean; aparatos: boolean; muros: boolean }

/** Muebles de Melamina como cajas (bajos de 0.9 m; altos colgados de 1.5 a 2.2 m). */
export function dibujarMuebles(grupo: THREE.Group, muebles: { x: number; y: number; w: number; d: number; rot: number; alto?: boolean }[]) {
  const mat = new THREE.MeshStandardMaterial({ color: '#e7e1d8', roughness: 0.8 });
  const borde = new THREE.LineBasicMaterial({ color: '#0f766e', transparent: true, opacity: 0.6 });
  muebles.forEach(m => {
    const h = m.alto ? 0.7 : 0.9, y0 = m.alto ? 1.5 : 0;
    const g = new THREE.BoxGeometry(m.w, h, m.d);
    const o = new THREE.Mesh(g, mat); o.position.set(m.x, y0 + h / 2, m.y); o.rotation.y = (-m.rot * Math.PI) / 180;
    o.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), borde)); grupo.add(o);
  });
}

/** Dibuja la gasfitería en un grupo de three.js. Con `conTecho` no pone piso ni muros (los da el techo). */
export function dibujarGasfiteria(grupo: THREE.Group, cot: CotizacionGas, ver: Visibles, empalmes: Empalme[], opt: { conTecho?: boolean } = {}) {
  const mats = {
    loza: new THREE.MeshStandardMaterial({ color: '#fbfbfa', roughness: 0.35 }),
    metal: new THREE.MeshStandardMaterial({ color: '#a8b3bf', roughness: 0.3, metalness: 0.8 }),
    bronce: new THREE.MeshStandardMaterial({ color: '#c08a3e', roughness: 0.35, metalness: 0.7 }),
    oscuro: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 }),
    concreto: new THREE.MeshStandardMaterial({ color: '#b9b4ab', roughness: 0.95 }),
    concretoT: new THREE.MeshStandardMaterial({ color: '#a8a29e', roughness: 0.95, transparent: true, opacity: 0.45, depthWrite: false }),
    granito: new THREE.MeshStandardMaterial({ color: '#8f8a85', roughness: 0.6 }),
    agua: new THREE.MeshStandardMaterial({ color: '#bae6fd', roughness: 0.1 }),
    naranja: new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.5 }),
    tapa: new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.8 }),
    azul: new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.6 }),
    mueble: new THREE.MeshStandardMaterial({ color: '#e7e1d8', roughness: 0.8 }),
  } as Record<string, THREE.Material>;
  const b = limites(cot);
  // Piso semitransparente (se ve el desagüe debajo) y muros tenues.
  const pw = b.x1 - b.x0 + 1, pl = b.y1 - b.y0 + 1;
  const conTecho = !!opt.conTecho;
  if (!conTecho) {
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(pw, pl), new THREE.MeshStandardMaterial({ color: '#e7e2d9', roughness: 1, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
  piso.rotation.x = -Math.PI / 2; piso.position.set((b.x0 + b.x1) / 2, 0, (b.y0 + b.y1) / 2); piso.userData.sinAjuste = true; grupo.add(piso);
  const rejilla = new THREE.GridHelper(Math.ceil(Math.max(pw, pl)), Math.ceil(Math.max(pw, pl)), '#cbd5e1', '#dfe5ec');
  rejilla.position.set((b.x0 + b.x1) / 2, 0.001, (b.y0 + b.y1) / 2); rejilla.userData.sinAjuste = true; (rejilla.material as THREE.Material).transparent = true; (rejilla.material as THREE.Material).opacity = 0.5; grupo.add(rejilla);
  }
  // Fondo de Techos: las columnas del techo (el techo de verdad lo pone la vista "todo junto").
  if (!conTecho && ver.muros && cot.fondo.tipo === 'techos') {
    const mc = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.8 });
    (cot.fondo.columnas || []).forEach(k => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 0.15), mc); m.position.set(k.x, 1.4, k.y); grupo.add(m); });
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(cot.fondo.ancho, 0.01, cot.fondo.largo)), new THREE.LineBasicMaterial({ color: '#d97706' }));
    e.position.set(cot.fondo.ancho / 2, 2.85, cot.fondo.largo / 2); grupo.add(e);
  }
  // Muebles de Melamina (fondo desde Melamina): cajas tenues para ubicarse.
  if (ver.muros && (cot.fondo.muebles || []).length) dibujarMuebles(grupo, cot.fondo.muebles || []);
  if (!conTecho && ver.muros) {
    const mm = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9, transparent: true, opacity: 0.16, depthWrite: false });
    const borde = new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.45 });
    const H = 2.5;
    cot.fondo.muros.forEach(m => {
      const L = Math.hypot(m.x2 - m.x1, m.y2 - m.y1); if (L < 0.01) return;
      const ux = (m.x2 - m.x1) / L, uy = (m.y2 - m.y1) / L, ang = Math.atan2(uy, ux);
      const piezas: [number, number, number, number][] = []; // desde, hasta, y0, y1
      let t = 0;
      [...(m.vanos || [])].sort((p, q) => p.t - q.t).forEach(v => {
        const a = Math.max(t, v.t - v.w / 2), bb = Math.min(L, v.t + v.w / 2); if (bb <= a) return;
        if (a > t) piezas.push([t, a, 0, H]);
        if (v.puerta) piezas.push([a, bb, 2.1, H]); else { piezas.push([a, bb, 0, 0.9], [a, bb, 2.1, H]); }
        t = bb;
      });
      if (t < L) piezas.push([t, L, 0, H]);
      piezas.forEach(([a, bb, y0, y1]) => {
        const g = new THREE.BoxGeometry(bb - a, y1 - y0, m.a);
        const mesh = new THREE.Mesh(g, mm);
        const cx = m.x1 + ux * (a + bb) / 2, cz = m.y1 + uy * (a + bb) / 2;
        mesh.position.set(cx, (y0 + y1) / 2, cz); mesh.rotation.y = -ang;
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), borde));
        grupo.add(mesh);
      });
    });
  }
  // Tuberías.
  const matRed: Record<Red, THREE.MeshStandardMaterial> = {
    fria: new THREE.MeshStandardMaterial({ color: REDES.fria.color, roughness: 0.45 }),
    caliente: new THREE.MeshStandardMaterial({ color: REDES.caliente.color, roughness: 0.45 }),
    desague: new THREE.MeshStandardMaterial({ color: '#a26a3a', roughness: 0.55 }),
    ventilacion: new THREE.MeshStandardMaterial({ color: REDES.ventilacion.color, roughness: 0.5 }),
  };
  const matNudo: Record<Red, THREE.MeshStandardMaterial> = {
    fria: new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.4 }), caliente: new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.4 }),
    desague: new THREE.MeshStandardMaterial({ color: '#5b3a1e', roughness: 0.5 }), ventilacion: new THREE.MeshStandardMaterial({ color: '#14532d', roughness: 0.5 }),
  };
  const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const poner = (m: THREE.Object3D | null) => { if (m) grupo.add(m); };
  (['fria', 'caliente', 'desague'] as const).forEach(fam => {
    const g = grafoRed(cot.tramos, cot.aparatos, fam);
    const alt = fam === 'desague' ? profundidades(g, raicesDe(g, 'desague')) : g.nudos.map(() => (fam === 'fria' ? ALTURA_FRIA : ALTURA_CALIENTE));
    g.aristas.forEach(e => {
      if (!ver[e.tramo.red]) return;
      const A = g.nudos[e.a], B = g.nudos[e.b];
      poner(cilindro(V3(A.x, alt[e.a], A.y), V3(B.x, alt[e.b], B.y), radio(e.tramo.diam), matRed[e.tramo.red]));
    });
    g.nudos.forEach((n, i) => {
      const es = n.aristas.map(k => g.aristas[k]).filter(e => ver[e.tramo.red]);
      if (!es.length) return;
      const r = Math.max(...es.map(e => radio(e.tramo.diam)));
      const red = es[0].tramo.red;
      if (es.length >= 2 || n.aparatos.length) { const s = new THREE.Mesh(new THREE.SphereGeometry(r * 1.35, 14, 10), matNudo[red]); s.position.set(n.x, alt[i], n.y); grupo.add(s); }
      // Subida / bajada al aparato.
      n.aparatos.forEach(({ ap, red: rr }) => {
        const d = defAparato(ap.tipo);
        if (esAgua(rr)) { const h = d.fuente === 'fria' ? -0.1 : d.hAgua; poner(cilindro(V3(n.x, alt[i], n.y), V3(n.x, h, n.y), r, matRed[rr])); }
        else if (!d.colector) poner(cilindro(V3(n.x, alt[i], n.y), V3(n.x, d.hDes + 0.02, n.y), r, matRed.desague));
        else poner(cilindro(V3(n.x, alt[i], n.y), V3(n.x, alt[i] - 0.15, n.y), r, matRed.desague));
      });
      // Ventilación libre: sube por el muro hasta el techo con su sombrero.
      if (es.length === 1 && !n.aparatos.length && es[0].tramo.red === 'ventilacion') {
        poner(cilindro(V3(n.x, alt[i], n.y), V3(n.x, 2.75, n.y), r, matRed.ventilacion));
        const som = new THREE.Mesh(new THREE.ConeGeometry(r * 2.4, r * 2.2, 14), matNudo.ventilacion); som.position.set(n.x, 2.8, n.y); grupo.add(som);
      }
    });
  });
  // Llaves de paso (cubos negros) del agua.
  empalmes.filter(e => e.tipo === 'llave' && ver[e.red]).forEach(e => {
    const y = e.red === 'fria' ? ALTURA_FRIA : ALTURA_CALIENTE;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), matNudo.ventilacion.clone()); (m.material as THREE.MeshStandardMaterial).color.set('#111827');
    m.position.set(e.x, y, e.y); grupo.add(m);
    const man = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.03), mats.naranja); man.position.set(e.x, y + 0.05, e.y); grupo.add(man);
  });
  // Aparatos.
  if (ver.aparatos) cot.aparatos.forEach(a => {
    const o = aparatoObj(a, mats); o.position.set(a.x, 0, a.y); o.rotation.y = (-a.rot * Math.PI) / 180; grupo.add(o);
  });
}

export default function Gasfiteria3D({ cot, ver, empalmes }: { cot: CotizacionGas; ver: Visibles; empalmes: Empalme[] }) {
  const host = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; persp: THREE.PerspectiveCamera; orto: THREE.OrthographicCamera; cam: THREE.Camera; controls: OrbitControls; grupo: THREE.Group; render: () => void; ajustar: (iso?: boolean) => void } | null>(null);
  const [iso, setIso] = useState(true);

  useEffect(() => {
    const el = host.current; if (!el) return;
    const renderer = crearRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor('#eef2f7');
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#b8b0a2', 1.7));
    const sol = new THREE.DirectionalLight('#ffffff', 1.3); sol.position.set(4, 8, 6); scene.add(sol);
    const persp = new THREE.PerspectiveCamera(42, 1, 0.05, 300);
    const orto = new THREE.OrthographicCamera(-5, 5, 5, -5, -100, 300);
    const grupo = new THREE.Group(); scene.add(grupo);
    const c = { renderer, scene, persp, orto, cam: orto as THREE.Camera, controls: null as unknown as OrbitControls, grupo, render: () => {}, ajustar: (_?: boolean) => {} };
    c.render = () => renderer.render(scene, c.cam);
    const nuevoControl = () => {
      c.controls?.dispose();
      const k = new OrbitControls(c.cam, renderer.domElement);
      k.enableDamping = false; k.addEventListener('change', c.render); c.controls = k;
    };
    nuevoControl();
    c.ajustar = (modoIso?: boolean) => {
      const box = new THREE.Box3();
      grupo.children.forEach(o => { if (!o.userData.sinAjuste) box.expandByObject(o); });
      if (box.isEmpty()) { c.render(); return; }
      const centro = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
      const w = el.clientWidth || 300, h = el.clientHeight || 300, asp = w / h;
      const usarIso = modoIso ?? c.cam === orto;
      c.cam = usarIso ? orto : persp;
      nuevoControl();
      const r = Math.max(s.x, s.y, s.z, 1);
      const esquinas = [0, 1].flatMap(i => [0, 1].flatMap(j => [0, 1].map(k => new THREE.Vector3(i ? box.max.x : box.min.x, j ? box.max.y : box.min.y, k ? box.max.z : box.min.z))));
      if (usarIso) {
        // Isométrico: cámara ortográfica a 45° y encuadre exacto de la caja.
        orto.position.copy(centro).add(new THREE.Vector3(1, 0.85, 1).normalize().multiplyScalar(r * 3));
        orto.lookAt(centro); orto.updateMatrixWorld();
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        esquinas.forEach(v => { const q = v.clone().applyMatrix4(orto.matrixWorldInverse); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
        let hw = ((x1 - x0) / 2) * 1.06, hh = ((y1 - y0) / 2) * 1.1;
        if (hw / hh < asp) hw = hh * asp; else hh = hw / asp;
        const off = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, 0).applyQuaternion(orto.quaternion);
        orto.position.add(off); centro.add(off);
        orto.left = -hw; orto.right = hw; orto.top = hh; orto.bottom = -hh; orto.zoom = 1;
        orto.near = -r * 10; orto.far = r * 20; orto.updateProjectionMatrix();
      } else {
        const dir = new THREE.Vector3(-0.45, 0.75, 1).normalize();
        const esfera = box.getBoundingSphere(new THREE.Sphere());
        const fovV = (persp.fov * Math.PI) / 180, fovH = 2 * Math.atan(Math.tan(fovV / 2) * asp);
        const dist = (esfera.radius / Math.sin(Math.min(fovV, fovH) / 2)) * 0.82;
        persp.aspect = asp; persp.position.copy(centro).add(dir.multiplyScalar(dist));
        persp.near = dist / 100; persp.far = dist * 30; persp.updateProjectionMatrix();
      }
      c.controls.target.copy(centro); c.controls.update(); c.render();
    };
    const tam = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300, asp = w / h;
      renderer.setSize(w, h, false); persp.aspect = asp; persp.updateProjectionMatrix();
      const alto = (orto.top - orto.bottom) / 2; orto.left = -alto * asp; orto.right = alto * asp; orto.updateProjectionMatrix();
      c.render();
    };
    const ro = new ResizeObserver(tam); ro.observe(el); tam();
    ctx.current = c;
    return () => { ro.disconnect(); c.controls.dispose(); liberar(scene); liberarRenderer(renderer); ctx.current = null; };
  }, []);

  useEffect(() => {
    const c = ctx.current; if (!c) return;
    const primera = c.grupo.children.length === 0;
    liberar(c.grupo); c.grupo.clear();
    dibujarGasfiteria(c.grupo, cot, ver, empalmes);
    if (primera) c.ajustar(iso); else c.render();
  }, [cot.aparatos, cot.tramos, cot.fondo, ver, empalmes]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden bg-slate-100">
      <div ref={host} className="absolute inset-0" />
      <div className="absolute top-2 right-2 flex gap-1.5">
        <div className="inline-flex p-0.5 rounded-xl bg-white/95 shadow">
          {([[true, 'Isométrico'], [false, 'Perspectiva']] as const).map(([v, l]) => (
            <button key={l} type="button" onClick={() => { setIso(v); ctx.current?.ajustar(v); }} title={l}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-2.5 rounded-lg text-xs font-bold cursor-pointer ${iso === v ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {v && <BoxIc className="w-4 h-4" />}{l}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => ctx.current?.ajustar()} title="Ver todo"
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white/95 shadow text-xs font-bold text-slate-700 cursor-pointer hover:bg-white">
          <Maximize2 className="w-4 h-4" /> Ver todo
        </button>
      </div>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-slate-500 pointer-events-none">Arrastra para girar · dos dedos o rueda para acercar · el desagüe va bajo el piso con su pendiente</p>
    </div>
  );
}
