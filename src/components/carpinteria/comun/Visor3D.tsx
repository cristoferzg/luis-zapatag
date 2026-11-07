// =============================================================================
// Visor 3D común (Madera / Vidrios): escena, cámara orbital y partes que se abren.
// Cada parte móvil guarda en userData.movil cómo moverse entre 0 (cerrada) y 1
// (abierta), como en Melamina3D: tocarla la abre o la cierra y el botón abre todo.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { crearRenderer, liberarRenderer } from '../../../lib/webglSeguro';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Maximize2, DoorOpen, DoorClosed } from 'lucide-react';

export interface Movil { valor: number; objetivo: number; aplicar: (v: number) => void }
const movilDe = (o: THREE.Object3D | null): Movil | null => { while (o) { if (o.userData.movil) return o.userData.movil as Movil; o = o.parent; } return null; };
export const hacerMovil = (o: THREE.Object3D, aplicar: (v: number) => void) => { o.userData.movil = { valor: 0, objetivo: 0, aplicar } as Movil; return o; };

/** Caja con su esquina (x, y, z) mínima en la posición dada (m). */
export function caja(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, bordes?: THREE.LineBasicMaterial) {
  const g = new THREE.BoxGeometry(Math.max(0.001, w), Math.max(0.001, h), Math.max(0.001, d));
  const mesh = new THREE.Mesh(g, mat);
  mesh.position.set(x + w / 2, y + h / 2, z + d / 2);
  if (bordes) mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), bordes));
  return mesh;
}
/** Muro de ancho W × alto H (espesor e, cara frontal en z = 0) con un vano rectangular. */
export function muroConVano(W: number, H: number, e: number, vano: { x: number; y: number; w: number; h: number } | null, mat: THREE.Material) {
  const g = new THREE.Group();
  if (!vano) { g.add(caja(W, H, e, 0, 0, -e, mat)); return g; }
  const { x, y, w, h } = vano;
  if (x > 0) g.add(caja(x, H, e, 0, 0, -e, mat));
  if (x + w < W) g.add(caja(W - x - w, H, e, x + w, 0, -e, mat));
  if (y > 0) g.add(caja(w, y, e, x, 0, -e, mat));
  if (y + h < H) g.add(caja(w, H - y - h, e, x, y + h, -e, mat));
  return g;
}
export function liberar(obj: THREE.Object3D) {
  obj.traverse(o => {
    const x = o as THREE.Mesh;
    x.geometry?.dispose?.();
    const mt = x.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mt)) mt.forEach(mm => mm.dispose()); else mt?.dispose?.();
  });
}

export default function Visor3D({ construir, clave, acento = 'bg-amber-700', textoAyuda }: {
  construir: () => THREE.Object3D; clave: string; acento?: string; textoAyuda?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ grupo: THREE.Group; ajustar: () => void; animar: () => void; render: () => void } | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [hayMoviles, setHayMoviles] = useState(false);

  useEffect(() => {
    const el = host.current; if (!el) return;
    const renderer = crearRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor('#eef2f7');
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#b8b0a2', 1.5));
    const sol = new THREE.DirectionalLight('#ffffff', 1.5); sol.position.set(3, 6, 5); scene.add(sol);
    const contra = new THREE.DirectionalLight('#ffffff', 0.5); contra.position.set(-4, 3, -3); scene.add(contra);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false; controls.maxPolarAngle = Math.PI * 0.53;
    const grupo = new THREE.Group(); scene.add(grupo);
    const render = () => renderer.render(scene, camera);
    controls.addEventListener('change', render);
    const ajustar = () => {
      const box = new THREE.Box3().setFromObject(grupo);
      if (box.isEmpty()) return;
      const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
      // Encuadre: lo que manda es el ancho (según la proporción de la pantalla) o el alto.
      const t = Math.tan((camera.fov * Math.PI) / 360);
      const dist = Math.max(s.x / (2 * t * camera.aspect), s.y / (2 * t), 0.8) * 1.04 + s.z * 0.55;
      camera.position.copy(c).add(new THREE.Vector3(0.3, 0.3, 1).normalize().multiplyScalar(dist));
      camera.near = dist / 100; camera.far = dist * 20; camera.updateProjectionMatrix();
      controls.target.copy(c); controls.update(); render();
    };
    const tam = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); render();
    };
    const ro = new ResizeObserver(() => { tam(); }); ro.observe(el); tam();
    let raf = 0;
    const paso = () => {
      raf = 0; let sigue = false;
      grupo.traverse(o => {
        const mv = o.userData.movil as Movil | undefined; if (!mv || mv.valor === mv.objetivo) return;
        const d = mv.objetivo - mv.valor, st = 0.06;
        mv.valor = Math.abs(d) <= st ? mv.objetivo : mv.valor + Math.sign(d) * st;
        mv.aplicar(mv.valor); if (mv.valor !== mv.objetivo) sigue = true;
      });
      render(); if (sigue) raf = requestAnimationFrame(paso);
    };
    const animar = () => { if (!raf) raf = requestAnimationFrame(paso); };
    const ray = new THREE.Raycaster(); let ini: { x: number; y: number } | null = null;
    const abajo = (e: PointerEvent) => { ini = { x: e.clientX, y: e.clientY }; };
    const arriba = (e: PointerEvent) => {
      if (!ini || Math.hypot(e.clientX - ini.x, e.clientY - ini.y) > 6) { ini = null; return; }
      ini = null;
      const rc = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(grupo.children, true).find(h => movilDe(h.object));
      const mv = hit && movilDe(hit.object);
      if (mv) { mv.objetivo = mv.objetivo > 0.5 ? 0 : 1; animar(); }
    };
    renderer.domElement.addEventListener('pointerdown', abajo);
    renderer.domElement.addEventListener('pointerup', arriba);
    ctx.current = { grupo, ajustar, animar, render };
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
    c.grupo.add(construir());
    let n = 0; c.grupo.traverse(o => { if (o.userData.movil) n++; });
    setHayMoviles(n > 0); setAbierto(false);
    c.ajustar();
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {hayMoviles && (
        <button type="button" onClick={() => abrirTodo(!abierto)} title={abierto ? 'Cerrar todo' : 'Abrir puertas y ventanas'}
          className={`absolute top-2 left-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl shadow text-xs font-bold cursor-pointer ${abierto ? `${acento} text-white` : 'bg-white/95 text-slate-700 hover:bg-white'}`}>
          {abierto ? <DoorClosed className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />} {abierto ? 'Cerrar todo' : 'Abrir'}
        </button>
      )}
      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-slate-500 pointer-events-none">{textoAyuda || 'Arrastra para girar · dos dedos o rueda para acercar · toca una hoja para abrirla'}</p>
    </div>
  );
}
