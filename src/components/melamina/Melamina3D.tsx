// =============================================================================
// Vista 3D del ambiente de melamina: paredes en L / U (pared 1 a lo largo de +X,
// cada pared siguiente gira 90° al final de la anterior), piso y cada mueble con
// su casco, repisas, puertas y frentes de cajón en el color de la melamina.
// Si no hay muebles ubicados en las paredes se ve solo el mueble elegido.
// =============================================================================
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2 } from 'lucide-react';
import { frenteDe, Mueble } from './calculoMelamina';
import type { ParedMelamina } from './cotizacionMelamina';
import { colorMelamina } from '../../catalogo/melamina';

const DIRS: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // dirección de cada pared en (x, z)

/** Origen (x, z) de cada pared: empieza donde termina la anterior. */
export function origenesParedes(paredes: ParedMelamina[]): [number, number][] {
  const out: [number, number][] = [];
  let x = 0, z = 0;
  paredes.forEach((p, i) => { out.push([x, z]); const d = DIRS[i % 4]; x += d[0] * p.largo; z += d[1] * p.largo; });
  return out;
}

function caja(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, bordes?: THREE.LineBasicMaterial) {
  const g = new THREE.BoxGeometry(Math.max(0.001, w), Math.max(0.001, h), Math.max(0.001, d));
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
  if (bordes) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), bordes));
  return mesh;
}

/** Mueble en coordenadas locales (m): x a lo ancho, y hacia arriba, z hacia el frente (atrás = 0). */
function muebleObj(m: Mueble): THREE.Group {
  const f = frenteDe(m);
  const k = 0.001, W = f.W * k, H = f.H * k, D = f.D * k, t = f.t * k, z = f.z * k;
  const g = new THREE.Group();
  const hex = colorMelamina(m.color).hex;
  const mat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.7, metalness: 0 });
  const matFrente = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).offsetHSL(0, 0, -0.04), roughness: 0.55 });
  const matFondo = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex).offsetHSL(0, 0, -0.18), roughness: 0.9 });
  const matMetal = new THREE.MeshStandardMaterial({ color: '#9aa3ad', roughness: 0.35, metalness: 0.7 });
  const bordes = new THREE.LineBasicMaterial({ color: '#1e293b', transparent: true, opacity: 0.25 });
  g.add(caja(t, H, D, 0, 0, 0, mat, bordes), caja(t, H, D, W - t, 0, 0, mat, bordes));
  g.add(caja(W - 2 * t, t, D, t, H - t, 0, mat, bordes));
  f.comps.filter(c => c.conPiso).forEach(c => g.add(caja((c.x1 - c.x0) * k, t, D, c.x0 * k, z, 0, mat, bordes)));
  if (z > 0) g.add(caja(W - 2 * t, z, t, t, 0, D - 0.04 - t, matFondo));
  f.divisiones.forEach(x => g.add(caja(t, (f.yTecho - f.yPiso) * k, D, x * k, f.yPiso * k, 0, mat, bordes)));
  f.repisas.forEach(r => g.add(caja((r.x1 - r.x0) * k, t, D - 0.02, r.x0 * k, r.y * k, 0, mat, bordes)));
  f.colgadores.forEach(c => g.add(caja((c.x1 - c.x0) * k, 0.015, 0.025, c.x0 * k, c.y * k, D / 2, matMetal)));
  if (m.fondoHdf) g.add(caja(W, H - z, 0.003, 0, z, -0.003, matFondo));
  f.puertas.forEach(p => {
    const zz = p.tipo === 'corrediza' ? D + 0.01 + p.plano * 0.025 : D + 0.002;
    g.add(caja(p.w * k, p.h * k, t, p.x * k, p.y * k, zz, matFrente, bordes));
    const hx = p.lado === 'izq' ? (p.x + p.w - 45) * k : (p.x + 35) * k;
    const hy = (m.tipo === 'cocina_alta' ? p.y + 80 : m.tipo === 'cocina_baja' ? p.y + p.h - 200 : p.y + p.h / 2 - 60) * k;
    g.add(caja(0.012, 0.12, 0.02, hx, hy, zz + t, matMetal));
  });
  f.cajones.forEach(c => {
    const zz = c.interior ? D - t - 0.03 : D + 0.002;
    g.add(caja(c.w * k, c.h * k, t, c.x * k, c.y * k, zz, matFrente, bordes));
    g.add(caja(Math.min(0.14, c.w * k * 0.4), 0.012, 0.02, (c.x + c.w / 2) * k - Math.min(0.07, c.w * k * 0.2), (c.y + c.h / 2) * k, zz + t, matMetal));
  });
  return g;
}

function liberar(obj: THREE.Object3D) {
  obj.traverse(o => {
    const x = o as THREE.Mesh;
    x.geometry?.dispose?.();
    const mt = x.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mt)) mt.forEach(mm => mm.dispose()); else mt?.dispose?.();
  });
}

export default function Melamina3D({ muebles, paredes, selId }: { muebles: Mueble[]; paredes: ParedMelamina[]; selId?: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; grupo: THREE.Group; render: () => void; ajustar: () => void } | null>(null);

  useEffect(() => {
    const el = host.current; if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor('#eef2f7');
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#b8b0a2', 1.6));
    const sol = new THREE.DirectionalLight('#ffffff', 1.4); sol.position.set(3, 6, 5); scene.add(sol);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false; controls.maxPolarAngle = Math.PI * 0.495;
    const grupo = new THREE.Group(); scene.add(grupo);
    const render = () => renderer.render(scene, camera);
    controls.addEventListener('change', render);
    const ajustar = () => {
      const box = new THREE.Box3().setFromObject(grupo);
      if (box.isEmpty()) return;
      const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
      const r = Math.max(s.x, s.y, s.z, 0.5);
      const dist = (r / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.35 / Math.min(1, camera.aspect);
      camera.position.copy(c).add(new THREE.Vector3(-0.35, 0.45, 1).normalize().multiplyScalar(dist));
      camera.near = dist / 100; camera.far = dist * 20; camera.updateProjectionMatrix();
      controls.target.copy(c); controls.update(); render();
    };
    const tam = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); render();
    };
    const ro = new ResizeObserver(tam); ro.observe(el); tam();
    ctx.current = { renderer, scene, camera, controls, grupo, render, ajustar };
    return () => {
      ro.disconnect(); controls.removeEventListener('change', render); controls.dispose();
      liberar(scene); renderer.dispose(); renderer.domElement.remove(); ctx.current = null;
    };
  }, []);

  useEffect(() => {
    const c = ctx.current; if (!c) return;
    liberar(c.grupo); c.grupo.clear();
    const ubicados = muebles.filter(m => m.pos && m.pos.pared < paredes.length);
    if (ubicados.length && paredes.length) {
      const org = origenesParedes(paredes);
      const matPared = new THREE.MeshStandardMaterial({ color: '#f1ede6', roughness: 0.95 });
      const matParedVidrio = new THREE.MeshStandardMaterial({ color: '#f1ede6', roughness: 0.95, transparent: true, opacity: 0.25, depthWrite: false });
      let minX = 0, maxX = 0, minZ = 0, maxZ = 0;
      paredes.forEach((p, i) => {
        const [ox, oz] = org[i], d = DIRS[i % 4], n = DIRS[(i + 1) % 4];
        const pared = new THREE.Mesh(new THREE.BoxGeometry(p.largo, p.alto, 0.1), i >= 2 ? matParedVidrio : matPared);
        pared.position.set(ox + d[0] * p.largo / 2 - n[0] * 0.05, p.alto / 2, oz + d[1] * p.largo / 2 - n[1] * 0.05);
        pared.rotation.y = -i * Math.PI / 2;
        c.grupo.add(pared);
        [[ox, oz], [ox + d[0] * p.largo, oz + d[1] * p.largo]].forEach(([x, z]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); });
      });
      if (maxZ - minZ < 1.5) maxZ = minZ + Math.max(2, (maxX - minX) * 0.6);
      if (maxX - minX < 1.5) maxX = minX + 2;
      const piso = new THREE.Mesh(new THREE.PlaneGeometry(maxX - minX + 0.2, maxZ - minZ + 0.2), new THREE.MeshStandardMaterial({ color: '#d9cdb8', roughness: 1 }));
      piso.rotation.x = -Math.PI / 2; piso.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
      c.grupo.add(piso);
      ubicados.forEach(m => {
        const i = m.pos!.pared, [ox, oz] = org[i], d = DIRS[i % 4];
        for (let k = 0; k < Math.max(1, Math.round(m.cantidad || 1)); k++) {
          const o = muebleObj(m);
          const x = m.pos!.x + k * m.ancho;
          o.position.set(ox + d[0] * x, m.pos!.y, oz + d[1] * x);
          o.rotation.y = -i * Math.PI / 2;
          c.grupo.add(o);
        }
      });
    } else {
      const m = muebles.find(x => x.id === selId) || muebles[0];
      if (m) {
        const o = muebleObj(m); o.position.set(-m.ancho / 2, 0, -m.prof / 2); c.grupo.add(o);
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(m.ancho + 1.5, m.prof + 1.5), new THREE.MeshStandardMaterial({ color: '#d9cdb8', roughness: 1 }));
        piso.rotation.x = -Math.PI / 2; c.grupo.add(piso);
      }
    }
    c.ajustar();
  }, [muebles, paredes, selId]);

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden bg-slate-100">
      <div ref={host} className="absolute inset-0" />
      <button type="button" onClick={() => ctx.current?.ajustar()} title="Ver todo"
        className="absolute top-2 right-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white/95 shadow text-xs font-bold text-slate-700 cursor-pointer hover:bg-white">
        <Maximize2 className="w-4 h-4" /> Ver todo
      </button>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-slate-500 pointer-events-none">Arrastra para girar · dos dedos o rueda para acercar</p>
    </div>
  );
}
