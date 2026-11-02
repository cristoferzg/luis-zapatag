// =============================================================================
// Pandeo y flecha EN EL DISEÑO REAL: la estructura en 3D con cada pieza pintada
// según su riesgo (verde bajo, ámbar medio, rojo alto) y, en las que tienen
// riesgo, su deformada exagerada: las columnas se arquean de costado (pandeo) y
// las vigas y correas se flechan hacia abajo. Arrastrar gira, la rueda acerca.
// =============================================================================
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Node3D, Segment3D } from './techosCadEngineTypes';

export type Riesgo = 'BAJO' | 'MEDIO' | 'ALTO';
const COLOR: Record<Riesgo, number> = { BAJO: 0x22c55e, MEDIO: 0xf59e0b, ALTO: 0xef4444 };

export default function PandeoEstructura3D({ nodes, segments, riesgos, escala = 1.5, animar = true, alSeleccionar }: {
  nodes: Record<string, Node3D>;
  segments: Record<string, Segment3D>;
  riesgos: Record<string, Riesgo>;        // por id de perfil (los que no están se ven en gris)
  escala?: number;                        // exageración de la deformada
  animar?: boolean;
  alSeleccionar?: (id: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const datos = useRef({ escala, animar, alSeleccionar });
  datos.current = { escala, animar, alSeleccionar };

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'none' });
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sol = new THREE.DirectionalLight(0xffffff, 1.2); sol.position.set(8, 14, 6); scene.add(sol);

    const ns = Object.values(nodes);
    if (!ns.length) return;
    const caja = new THREE.Box3(); ns.forEach(n => caja.expandByPoint(new THREE.Vector3(n.x, n.y, n.z || 0)));
    const centro = caja.getCenter(new THREE.Vector3()), tam = caja.getSize(new THREE.Vector3());
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(tam.x + 4, tam.z + 4), new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }));
    piso.rotation.x = -Math.PI / 2; piso.position.set(centro.x, 0, centro.z); scene.add(piso);

    // Cada pieza: tubo por una curva; las de riesgo se deforman (pandeo o flecha).
    type Pieza = { id: string; A: THREE.Vector3; B: THREE.Vector3; flex: THREE.Vector3 | null; mesh: THREE.Mesh; riesgo?: Riesgo };
    const piezas: Pieza[] = [];
    const radio = Math.max(0.03, Math.max(tam.x, tam.z) / 220);
    Object.values(segments).forEach(s => {
      const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
      if (!a || !b) return;
      const A = new THREE.Vector3(a.x, a.y, a.z || 0), B = new THREE.Vector3(b.x, b.y, b.z || 0);
      const L = A.distanceTo(B); if (L < 0.02) return;
      const r = riesgos[s.id];
      const dir = new THREE.Vector3().subVectors(B, A).normalize();
      let flex: THREE.Vector3 | null = null;
      if (r && r !== 'BAJO') {
        const vertical = Math.abs(dir.y) > 0.7;
        // Columna: se arquea de costado. Viga/correa: baja en el centro.
        flex = vertical ? new THREE.Vector3(1, 0, 0.4).normalize() : new THREE.Vector3(0, -1, 0);
        flex.multiplyScalar(L * (r === 'ALTO' ? 0.06 : 0.035));
      }
      const mat = new THREE.MeshStandardMaterial({ color: r ? COLOR[r] : 0x94a3b8, metalness: 0.3, roughness: 0.55, emissive: r === 'ALTO' ? 0x7f1d1d : 0x000000, emissiveIntensity: 0.25 });
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
      mesh.userData.id = s.id;
      scene.add(mesh);
      piezas.push({ id: s.id, A, B, flex, mesh, riesgo: r });
    });
    const curva = (p: Pieza, k: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, q = p.A.clone().lerp(p.B, t);
        if (p.flex) q.addScaledVector(p.flex, Math.sin(Math.PI * t) * k);
        pts.push(q);
      }
      return new THREE.CatmullRomCurve3(pts);
    };
    const rehacer = (k: number) => piezas.forEach(p => {
      if (!p.flex && p.mesh.geometry.getAttribute('position')) return;
      p.mesh.geometry.dispose();
      p.mesh.geometry = new THREE.TubeGeometry(curva(p, k), p.flex ? 16 : 1, p.riesgo && p.riesgo !== 'BAJO' ? radio * 1.4 : radio, 8, false);
    });
    rehacer(1);

    // Cámara orbital simple, encuadrada a la esfera que envuelve la estructura
    // (según el ancho y alto del cuadro, para que nunca quede cortada).
    const esfera = caja.getBoundingSphere(new THREE.Sphere());
    const obj = esfera.center.clone();
    const distanciaAjuste = () => {
      const vfov = (camera.fov * Math.PI) / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      return Math.max(4, (esfera.radius * 1.15) / Math.sin(Math.min(vfov, hfov) / 2));
    };
    let az = -0.8, pol = 1.05, rad = distanciaAjuste();
    const actualizar = () => {
      pol = Math.max(0.15, Math.min(Math.PI / 2 - 0.02, pol));
      camera.position.set(obj.x + rad * Math.sin(pol) * Math.cos(az), obj.y + rad * Math.cos(pol), obj.z + rad * Math.sin(pol) * Math.sin(az));
      camera.lookAt(obj);
    };
    actualizar();
    let prev: { x: number; y: number } | null = null, inicio: { x: number; y: number } | null = null;
    const el = renderer.domElement;
    const down = (e: PointerEvent) => { prev = inicio = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing'; };
    const move = (e: PointerEvent) => { if (!prev) return; az += (e.clientX - prev.x) * 0.008; pol -= (e.clientY - prev.y) * 0.008; prev = { x: e.clientX, y: e.clientY }; actualizar(); };
    const rayo = new THREE.Raycaster();
    const up = (e: PointerEvent) => {
      el.style.cursor = 'grab';
      if (inicio && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) < 5 && datos.current.alSeleccionar) {
        const r = el.getBoundingClientRect();
        rayo.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
        const hit = rayo.intersectObjects(piezas.map(p => p.mesh))[0];
        datos.current.alSeleccionar(hit ? hit.object.userData.id : null);
      }
      prev = inicio = null;
    };
    const wheel = (e: WheelEvent) => { e.preventDefault(); rad = Math.max(2, Math.min(200, rad * (e.deltaY < 0 ? 0.9 : 1.1))); actualizar(); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    el.addEventListener('wheel', wheel, { passive: false });
    let ajustado = false;
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      if (!ajustado) { rad = distanciaAjuste(); ajustado = true; actualizar(); } // primer tamaño real: encuadrar
    };
    const ro = new ResizeObserver(resize); ro.observe(mount); resize();

    let raf = 0, t0 = performance.now();
    const loop = (t: number) => {
      const { escala: esc, animar: an } = datos.current;
      const k = esc * (an ? 0.55 + 0.45 * Math.sin((t - t0) / 450) : 1);
      rehacer(k);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('wheel', wheel);
      scene.traverse(o => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, [nodes, segments, JSON.stringify(riesgos)]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} className="w-full h-full" />;
}
