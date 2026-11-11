// =============================================================================
// Electricidad en 3D / isométrico: muros tenues, tuberías como tubos del color de su
// circuito (las del techo a la altura del techo, las del piso en el contrapiso) que
// bajan o suben por el muro hasta cada caja: tomas a 0.30 m, interruptores a 1.20 m,
// luces en el techo. Tablero en el muro, medidor y pozo a tierra. Render a pedido.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { crearRenderer, liberarRenderer } from '../../lib/webglSeguro';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2, Box as BoxIc } from 'lucide-react';
import { CotizacionEle, H_TECHO, H_TABLERO, ALIM, colorCircuito, defPunto, limites, esEspecial, Punto } from './modeloElectricidad';
import { InfoRuta, desplazar, offsetCircuito } from './calculoElectricidad';

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
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 12), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}
const R_TUBO = 0.022;
export type Visibles3D = Record<string, boolean>;

/** Dibuja la instalación eléctrica en un grupo de three.js. Con `conTecho` no pone piso ni
 * referencias (las da el techo de verdad) y `hTecho` sube luces y tuberías a esa altura. */
export function dibujarElectricidad(grupo: THREE.Group, cot: CotizacionEle, ver: Visibles3D, info: Map<string, InfoRuta>, opt: { hTecho?: number; conTecho?: boolean } = {}) {
  const b = limites(cot);
  const hT = opt.hTecho ?? H_TECHO;
  const conTecho = !!opt.conTecho;
  const pw = b.x1 - b.x0 + 1, pl = b.y1 - b.y0 + 1;
  if (!conTecho) {
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(pw, pl), new THREE.MeshStandardMaterial({ color: '#e7e2d9', roughness: 1, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
  piso.rotation.x = -Math.PI / 2; piso.position.set((b.x0 + b.x1) / 2, 0, (b.y0 + b.y1) / 2); piso.userData.sinAjuste = true; grupo.add(piso);
  const rejilla = new THREE.GridHelper(Math.ceil(Math.max(pw, pl)), Math.ceil(Math.max(pw, pl)), '#cbd5e1', '#dfe5ec');
  rejilla.position.set((b.x0 + b.x1) / 2, 0.001, (b.y0 + b.y1) / 2); rejilla.userData.sinAjuste = true; (rejilla.material as THREE.Material).transparent = true; (rejilla.material as THREE.Material).opacity = 0.5; grupo.add(rejilla);
  }
  if (ver.muros !== false) {
    const mm = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9, transparent: true, opacity: 0.14, depthWrite: false });
    const borde = new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.4 });
    cot.fondo.muros.forEach(m => {
      const L = Math.hypot(m.x2 - m.x1, m.y2 - m.y1); if (L < 0.01) return;
      const ux = (m.x2 - m.x1) / L, uy = (m.y2 - m.y1) / L, ang = Math.atan2(uy, ux);
      const piezas: [number, number, number, number][] = [];
      let t = 0;
      [...(m.vanos || [])].sort((p, q) => p.t - q.t).forEach(v => {
        const a = Math.max(t, v.t - v.w / 2), bb = Math.min(L, v.t + v.w / 2); if (bb <= a) return;
        if (a > t) piezas.push([t, a, 0, H_TECHO]);
        if (v.puerta) piezas.push([a, bb, 2.1, H_TECHO]); else piezas.push([a, bb, 0, 0.9], [a, bb, 2.1, H_TECHO]);
        t = bb;
      });
      if (t < L) piezas.push([t, L, 0, H_TECHO]);
      piezas.forEach(([a, bb, y0, y1]) => {
        const g = new THREE.BoxGeometry(bb - a, y1 - y0, m.a);
        const mesh = new THREE.Mesh(g, mm);
        mesh.position.set(m.x1 + ux * (a + bb) / 2, (y0 + y1) / 2, m.y1 + uy * (a + bb) / 2); mesh.rotation.y = -ang;
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), borde));
        grupo.add(mesh);
      });
    });
    // Referencias del fondo (aparatos, muebles, columnas, área de techo).
    const mr = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.9, transparent: true, opacity: 0.55 });
    if (!conTecho) cot.fondo.refs.forEach(rf => {
      if (rf.tipo === 'area') {
        const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(rf.w, 0.01, rf.d)), new THREE.LineBasicMaterial({ color: '#d97706' }));
        e.position.set(rf.x, H_TECHO + 0.3, rf.y); grupo.add(e); return;
      }
      const h = rf.tipo === 'columna' ? H_TECHO : rf.alto ? 0.7 : 0.85;
      const m = new THREE.Mesh(new THREE.BoxGeometry(rf.w, h, rf.d), rf.tipo === 'columna' ? new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.8 }) : mr);
      m.position.set(rf.x, rf.alto ? 1.5 + h / 2 : h / 2, rf.y); m.rotation.y = (-rf.rot * Math.PI) / 180; grupo.add(m);
    });
  }
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (col: string, emis = 0) => { const k = `${col}|${emis}`; let m = mats.get(k); if (!m) { m = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, emissive: emis ? col : '#000000', emissiveIntensity: emis }); mats.set(k, m); } return m; };
  const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const poner = (m: THREE.Object3D | null) => { if (m) grupo.add(m); };
  const visible = (id: string) => ver[id] !== false;
  // Tuberías con sus bajadas.
  cot.rutas.forEach(t => {
    if (!visible(t.circuito)) return;
    const col = colorCircuito(cot, t.circuito), m = mat(col);
    const y = t.via === 'techo' ? hT - 0.04 : 0.03;
    const pts = desplazar(t.pts, offsetCircuito(cot, t.circuito));
    const r = t.circuito === ALIM ? R_TUBO * 1.4 : R_TUBO;
    for (let i = 0; i < pts.length - 1; i++) poner(cilindro(V3(pts[i].x, y, pts[i].y), V3(pts[i + 1].x, y, pts[i + 1].y), r, m));
    pts.forEach((p, i) => { if (i > 0 && i < pts.length - 1) { const s = new THREE.Mesh(new THREE.SphereGeometry(r * 1.25, 10, 8), m); s.position.set(p.x, y, p.y); grupo.add(s); } });
    const inf = info.get(t.id);
    [0, pts.length - 1].forEach((idx, k) => {
      const ex = inf?.extremos[k]; if (!ex?.p) return;
      const p = ex.p, d = defPunto(p.tipo);
      const h = p.tipo === 'tablero' ? (t.via === 'techo' ? H_TABLERO + 0.25 : H_TABLERO - 0.25) : p.tipo === 'pozo_tierra' ? -0.3 : d.h === H_TECHO ? hT : d.h;
      if (Math.abs(h - y) > 0.05) poner(cilindro(V3(pts[idx].x, y, pts[idx].y), V3(pts[idx].x, h, pts[idx].y), r, m));
    });
  });
  // Puntos.
  if (ver.puntos !== false) cot.puntos.forEach((p: Punto) => {
    if (!esEspecial(p.tipo) && p.circuito && !visible(p.circuito)) return;
    const d = defPunto(p.tipo), col = esEspecial(p.tipo) ? '#334155' : colorCircuito(cot, p.circuito);
    const g = new THREE.Group(); g.position.set(p.x, 0, p.y); g.rotation.y = (-p.rot * Math.PI) / 180;
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
    switch (d.clase) {
      case 'luz':
        if (p.tipo === 'tira_led') add(new THREE.BoxGeometry(1.0, 0.03, 0.05), mat('#fde68a', 0.9), 0, d.h, 0);
        else if (p.tipo === 'timbre') add(new THREE.BoxGeometry(0.09, 0.09, 0.03), mat(col), 0, d.h, -0.02);
        else if (p.tipo === 'aplique' || p.tipo === 'reflector') { add(new THREE.BoxGeometry(0.2, 0.14, 0.12), mat('#fef3c7', 0.7), 0, d.h, 0.02); add(new THREE.BoxGeometry(0.06, 0.06, 0.04), mat(col), 0, d.h, -0.06); }
        else {
          // Luz de techo: caja octogonal pegada al techo y la luz COLGANDO hacia abajo (foco o panel),
          // con un cono de luz tenue hacia el piso para que se lea hacia dónde alumbra.
          const yT = d.h === H_TECHO ? hT : d.h;
          add(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 8), mat('#94a3b8'), 0, yT - 0.02, 0);   // caja octogonal
          add(new THREE.TorusGeometry(0.075, 0.01, 6, 8), mat(col), 0, yT - 0.04, 0).rotation.x = Math.PI / 2; // anillo del circuito
          let yLuz: number;
          if (p.tipo === 'empotrado') {
            add(new THREE.BoxGeometry(0.34, 0.025, 0.34), mat('#e2e8f0'), 0, yT - 0.055, 0);        // marco
            add(new THREE.BoxGeometry(0.3, 0.012, 0.3), mat('#fef9c3', 1.1), 0, yT - 0.073, 0);     // panel encendido (cara de abajo)
            yLuz = yT - 0.08;
          } else if (p.tipo === 'sensor') {
            add(new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#f8fafc'), 0, yT - 0.04, 0);
            yLuz = 0;
          } else {
            add(new THREE.CylinderGeometry(0.026, 0.03, 0.07, 12), mat('#f1f5f9'), 0, yT - 0.075, 0); // socket
            add(new THREE.SphereGeometry(0.075, 20, 14), mat('#fde68a', 1.2), 0, yT - 0.17, 0);       // foco encendido
            yLuz = yT - 0.17;
          }
          if (yLuz > 0) {
            const hc = Math.min(1.1, yLuz - 0.2), rc = hc * 0.55;
            const cono = new THREE.Mesh(new THREE.ConeGeometry(rc, hc, 28, 1, true), new THREE.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
            cono.position.set(0, yLuz - hc / 2, 0); cono.userData.sinAjuste = true; g.add(cono);
          }
        }
        break;
      case 'interruptor': add(new THREE.BoxGeometry(0.08, 0.12, 0.02), mat('#ffffff'), 0, d.h, -0.03); add(new THREE.BoxGeometry(0.03, 0.05, 0.025), mat(col), 0, d.h, -0.02); break;
      case 'toma': add(new THREE.BoxGeometry(0.12, 0.08, 0.02), mat('#ffffff'), 0, d.h, -0.03); add(new THREE.BoxGeometry(0.07, 0.03, 0.025), mat(col), 0, d.h, -0.02); break;
      case 'fuerza': add(new THREE.BoxGeometry(0.14, 0.14, 0.03), mat(col), 0, d.h, -0.03); if (p.tipo === 'aire') add(new THREE.BoxGeometry(0.8, 0.28, 0.2), mat('#f8fafc'), 0, d.h + 0.05, 0.05); if (p.tipo === 'terma') add(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 20), mat('#f8fafc'), 0.32, d.h - 0.2, 0.15); break;
      case 'debil': add(new THREE.BoxGeometry(0.08, 0.08, 0.02), mat('#e2e8f0'), 0, d.h, -0.03); add(new THREE.BoxGeometry(0.03, 0.03, 0.025), mat(col), 0, d.h, -0.02); break;
      case 'tablero': add(new THREE.BoxGeometry(0.42, 0.55, 0.1), mat('#64748b'), 0, d.h, -0.02); add(new THREE.BoxGeometry(0.32, 0.06, 0.02), mat('#f59e0b', 0.4), 0, d.h + 0.15, 0.04); break;
      case 'medidor': add(new THREE.BoxGeometry(0.3, 0.42, 0.14), mat('#1e293b'), 0, d.h, 0); add(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 20), mat('#e2e8f0'), 0, d.h + 0.05, 0.08).rotation.x = Math.PI / 2; break;
      case 'tierra': add(new THREE.BoxGeometry(0.45, 0.04, 0.45), mat('#78716c'), 0, 0.02, 0); add(new THREE.CylinderGeometry(0.014, 0.014, 0.8, 8), mat('#b45309'), 0, -0.4, 0); break;
    }
    grupo.add(g);
  });
}

export default function Electricidad3D({ cot, ver, info }: { cot: CotizacionEle; ver: Visibles3D; info: Map<string, InfoRuta> }) {
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
    const sol = new THREE.DirectionalLight('#ffffff', 1.2); sol.position.set(4, 9, 6); scene.add(sol);
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
        orto.position.copy(centro).add(new THREE.Vector3(1, 1.05, 1.15).normalize().multiplyScalar(r * 3));
        orto.lookAt(centro); orto.updateMatrixWorld();
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        esquinas.forEach(v => { const q = v.clone().applyMatrix4(orto.matrixWorldInverse); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
        let hw = ((x1 - x0) / 2) * 1.05, hh = ((y1 - y0) / 2) * 1.08;
        if (hw / hh < asp) hw = hh * asp; else hh = hw / asp;
        const off = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, 0).applyQuaternion(orto.quaternion);
        orto.position.add(off); centro.add(off);
        orto.left = -hw; orto.right = hw; orto.top = hh; orto.bottom = -hh; orto.zoom = 1;
        orto.near = -r * 10; orto.far = r * 20; orto.updateProjectionMatrix();
      } else {
        const dir = new THREE.Vector3(-0.45, 0.8, 1).normalize();
        const esfera = box.getBoundingSphere(new THREE.Sphere());
        const fovV = (persp.fov * Math.PI) / 180, fovH = 2 * Math.atan(Math.tan(fovV / 2) * asp);
        const dist = (esfera.radius / Math.sin(Math.min(fovV, fovH) / 2)) * 0.8;
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
    dibujarElectricidad(c.grupo, cot, ver, info);
    if (primera) c.ajustar(iso); else c.render();
  }, [cot.puntos, cot.rutas, cot.fondo, cot.circuitos, ver, info]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden bg-slate-100">
      <div ref={host} className="absolute inset-0" />
      <div className="absolute top-2 right-2 flex gap-1.5">
        <div className="inline-flex p-0.5 rounded-xl bg-white/95 shadow">
          {([[true, 'Isométrico'], [false, 'Perspectiva']] as const).map(([v, l]) => (
            <button key={l} type="button" onClick={() => { setIso(v); ctx.current?.ajustar(v); }} title={l}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-2.5 rounded-lg text-xs font-bold cursor-pointer ${iso === v ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:bg-slate-100'}`}>
              {v && <BoxIc className="w-4 h-4" />}{l}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => ctx.current?.ajustar()} title="Ver todo"
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white/95 shadow text-xs font-bold text-slate-700 cursor-pointer hover:bg-white">
          <Maximize2 className="w-4 h-4" /><span className="hidden sm:inline"> Ver todo</span>
        </button>
      </div>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-slate-500 pointer-events-none">Arrastra para girar · dos dedos o rueda para acercar · luces por el techo, tomas por el piso</p>
    </div>
  );
}
