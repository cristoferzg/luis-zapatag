// =============================================================================
// "Todo en 3D": el techo metálico (estructura y calamina) con su instalación eléctrica y
// su gasfitería en una sola vista, para mostrársela al cliente. Usa el techo abierto en
// Techos y las cotizaciones actuales de Electricidad y Gasfitería que tienen ese techo de
// fondo (botones ⚡ y 💧 de Techos): las tres comparten el mismo origen (esquina del techo).
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, X, Maximize2, Zap, Droplets, Eye, EyeOff } from 'lucide-react';
import { crearRenderer, liberarRenderer } from '../../lib/webglSeguro';
import { safeStorage } from '../../lib/storageManager';
import { dibujarElectricidad } from '../electricidad/Electricidad3D';
import { dibujarGasfiteria } from '../gasfiteria/Gasfiteria3D';
import { leerCotizacionActual as leerEle, esEspecial, KEY_ORIGEN, CotizacionEle } from '../electricidad/modeloElectricidad';
import { infoRutas, cuadroCargas, sugerirCircuitos, trazarAutomatico } from '../electricidad/calculoElectricidad';
import { leerCotizacionActual as leerGas, KEY_ORIGEN_GAS } from '../gasfiteria/modeloGasfiteria';
import { empalmes as calcEmpalmes } from '../gasfiteria/calculoGasfiteria';
import { perfilSuperior, VUELO_ALERO_M } from '../techos/canaletas';

interface Escena { nodes?: Record<string, { x: number; y: number; z: number }>; segments?: Record<string, { nodeAId: string; nodeBId: string; rolEstructural?: string }> }

function liberar(obj: THREE.Object3D) {
  obj.traverse(o => {
    const x = o as THREE.Mesh;
    x.geometry?.dispose?.();
    const mt = x.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mt)) mt.forEach(m => m.dispose()); else mt?.dispose?.();
  });
}
function tubo(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const L = a.distanceTo(b); if (L < 1e-4) return null;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 8), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

/** Lee el techo, la luz y el agua y los deja en el mismo sistema de coordenadas. */
function leerTodo() {
  const escena = safeStorage.getItem<Escena | null>('innova_techos_escena_actual', null);
  const N = escena?.nodes || {};
  const ns = Object.values(N).filter(n => isFinite(n.x) && isFinite(n.z));
  if (ns.length < 2) return null;
  const x0 = Math.min(...ns.map(n => n.x)), z0 = Math.min(...ns.map(n => n.z));
  const segs = Object.values(escena?.segments || {});
  const cols = segs.filter(s => s.rolEstructural === 'columna');
  const topes = cols.map(s => Math.max(N[s.nodeAId]?.y ?? 0, N[s.nodeBId]?.y ?? 0)).filter(y => y > 0.5);
  const hTecho = topes.length ? Math.min(...topes) : 2.8; // a la altura del alero (debajo del tijeral)
  // Electricidad: solo si su fondo es este techo. Sin tuberías: el trazado automático como vista previa.
  let ele: { cot: CotizacionEle; info: ReturnType<typeof infoRutas> } | null = null;
  const e = leerEle();
  if (e.fondo.tipo === 'techos' && e.puntos.some(p => !esEspecial(p.tipo))) {
    let c = e;
    if (!c.rutas.length && c.puntos.some(p => p.tipo === 'tablero')) {
      if (c.puntos.some(p => !esEspecial(p.tipo) && !c.circuitos.some(k => k.id === p.circuito))) c = { ...c, ...sugerirCircuitos(c) };
      const t = trazarAutomatico(c); if (t.rutas.length) c = { ...c, rutas: t.rutas, puntos: t.puntos };
    }
    ele = { cot: c, info: infoRutas(c, cuadroCargas(c).seccionAlim) };
  }
  const g = leerGas();
  const gas = g.fondo.tipo === 'techos' && (g.aparatos.length || g.tramos.length) ? { cot: g, empalmes: calcEmpalmes(g.tramos, g.aparatos) } : null;
  return { escena: escena!, x0, z0, hTecho, ele, gas };
}

function Escena3D({ datos, ver }: { datos: NonNullable<ReturnType<typeof leerTodo>>; ver: Record<string, boolean> }) {
  const host = useRef<HTMLDivElement>(null);
  const ctx = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; cam: THREE.PerspectiveCamera; controls: OrbitControls; grupo: THREE.Group; render: () => void; ajustar: () => void } | null>(null);

  useEffect(() => {
    const el = host.current; if (!el) return;
    const renderer = crearRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor('#eef2f7');
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block', touchAction: 'none' });
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#b8b0a2', 1.6));
    const sol = new THREE.DirectionalLight('#ffffff', 1.2); sol.position.set(6, 12, 8); scene.add(sol);
    const cam = new THREE.PerspectiveCamera(42, 1, 0.05, 500);
    const grupo = new THREE.Group(); scene.add(grupo);
    const controls = new OrbitControls(cam, renderer.domElement);
    const c = { renderer, scene, cam, controls, grupo, render: () => renderer.render(scene, cam), ajustar: () => {} };
    controls.addEventListener('change', c.render);
    c.ajustar = () => {
      const box = new THREE.Box3();
      grupo.children.forEach(o => { if (!o.userData.sinAjuste) box.expandByObject(o); });
      if (box.isEmpty()) { c.render(); return; }
      const centro = box.getCenter(new THREE.Vector3());
      const esfera = box.getBoundingSphere(new THREE.Sphere());
      const w = el.clientWidth || 300, h = el.clientHeight || 300, asp = w / h;
      const fovV = (cam.fov * Math.PI) / 180, fovH = 2 * Math.atan(Math.tan(fovV / 2) * asp);
      const dist = (esfera.radius / Math.sin(Math.min(fovV, fovH) / 2)) * 0.85;
      cam.aspect = asp; cam.position.copy(centro).add(new THREE.Vector3(-0.55, 0.55, 1).normalize().multiplyScalar(dist));
      cam.near = dist / 100; cam.far = dist * 30; cam.updateProjectionMatrix();
      controls.target.copy(centro); controls.update(); c.render();
    };
    const tam = () => { const w = el.clientWidth || 300, h = el.clientHeight || 300; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); c.render(); };
    const ro = new ResizeObserver(tam); ro.observe(el); tam();
    ctx.current = c;
    return () => { ro.disconnect(); controls.dispose(); liberar(scene); liberarRenderer(renderer); ctx.current = null; };
  }, []);

  useEffect(() => {
    const c = ctx.current; if (!c) return;
    const primera = c.grupo.children.length === 0;
    liberar(c.grupo); c.grupo.clear();
    const { escena, x0, z0, hTecho, ele, gas } = datos;
    const N = escena.nodes || {};
    const P = (n: { x: number; y: number; z: number }) => new THREE.Vector3(n.x - x0, n.y, n.z - z0);
    const ns = Object.values(N);
    const W = Math.max(...ns.map(n => n.x)) - x0, L = Math.max(...ns.map(n => n.z)) - z0;
    // Piso.
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(W + 3, L + 3), new THREE.MeshStandardMaterial({ color: '#e7e2d9', roughness: 1, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
    piso.rotation.x = -Math.PI / 2; piso.position.set(W / 2, 0, L / 2); piso.userData.sinAjuste = true; c.grupo.add(piso);
    // Estructura (columnas más gruesas).
    if (ver.estructura) {
      const mCol = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5, metalness: 0.4 });
      const mPieza = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.5, metalness: 0.4 });
      Object.values(escena.segments || {}).forEach(s => {
        const a = N[s.nodeAId], b = N[s.nodeBId]; if (!a || !b) return;
        const m = tubo(P(a), P(b), s.rolEstructural === 'columna' ? 0.05 : s.rolEstructural === 'correa' ? 0.018 : 0.025, s.rolEstructural === 'columna' ? mCol : mPieza);
        if (m) c.grupo.add(m);
      });
    }
    // Calamina: el perfil de arriba del techo a lo largo de todo el fondo (con su volado).
    if (ver.calamina) {
      const perfil = perfilSuperior(N as never);
      if (perfil.length >= 2) {
        const V = VUELO_ALERO_M, za = -V, zb = L + V, pos: number[] = [];
        for (let i = 0; i + 1 < perfil.length; i++) {
          const a = perfil[i], b = perfil[i + 1];
          const ax = a.x - x0, bx = b.x - x0, ay = a.y + 0.06, by = b.y + 0.06;
          pos.push(ax, ay, za, bx, by, za, bx, by, zb, ax, ay, za, bx, by, zb, ax, ay, zb);
        }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
        const hoja = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#1d6fb8', roughness: 0.4, metalness: 0.5, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
        c.grupo.add(hoja);
      }
    }
    if (ele && ver.luz) dibujarElectricidad(c.grupo, ele.cot, {}, ele.info, { conTecho: true, hTecho });
    if (gas && ver.agua) dibujarGasfiteria(c.grupo, gas.cot, { fria: true, caliente: true, desague: true, ventilacion: true, aparatos: true, muros: false }, gas.empalmes, { conTecho: true });
    if (primera) c.ajustar(); else c.render();
  }, [datos, ver]);

  return (
    <div className="relative w-full h-full">
      <div ref={host} className="absolute inset-0" />
      <button type="button" onClick={() => ctx.current?.ajustar()} title="Ver todo"
        className="absolute top-2 right-2 inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white/95 shadow text-xs font-bold text-slate-700 cursor-pointer hover:bg-white">
        <Maximize2 className="w-4 h-4" /> Ver todo
      </button>
      <p className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-slate-500 pointer-events-none">Arrastra para girar · dos dedos o rueda para acercar</p>
    </div>
  );
}

export default function VentanaTodoJunto3D({ onClose }: { onClose: () => void }) {
  const datos = useMemo(() => leerTodo(), []);
  const [ver, setVer] = useState({ estructura: true, calamina: true, luz: true, agua: true });
  const ir = (vista: 'electricidad' | 'gasfiteria') => {
    safeStorage.setItem(vista === 'electricidad' ? KEY_ORIGEN : KEY_ORIGEN_GAS, 'techos');
    onClose(); window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: vista }));
  };
  const chip = (k: keyof typeof ver, label: string, icono: React.ReactNode, hay = true) => (
    <button key={k} type="button" disabled={!hay} onClick={() => setVer(v => ({ ...v, [k]: !v[k] }))}
      className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${ver[k] && hay ? 'bg-white shadow-xs text-slate-800 border-slate-200' : 'bg-slate-100 text-slate-400 border-transparent'}`}>
      {icono}{label}{hay ? (ver[k] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />) : null}
    </button>
  );
  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/70 flex items-stretch sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-5xl h-full sm:h-[88vh] sm:rounded-3xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2"><Box className="w-5 h-5 text-amber-600" />Todo en 3D</p>
            <p className="text-[11px] text-slate-500 truncate">El techo con su instalación eléctrica y de agua, para mostrar al cliente</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        {!datos ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-slate-500">Primero arma el techo en Techos Metálicos.</div>
        ) : (<>
          <div className="px-3 py-2 flex flex-wrap items-center gap-1.5 bg-slate-50 border-b border-slate-200">
            {chip('estructura', 'Estructura', <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />)}
            {chip('calamina', 'Calamina', <span className="w-2.5 h-2.5 rounded-full bg-sky-700" />)}
            {chip('luz', 'Luz', <Zap className="w-3.5 h-3.5 text-amber-500" />, !!datos.ele)}
            {chip('agua', 'Agua y desagüe', <Droplets className="w-3.5 h-3.5 text-sky-500" />, !!datos.gas)}
          </div>
          {(!datos.ele || !datos.gas) && (
            <div className="px-3 py-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-amber-50 border-b border-amber-200">
              {!datos.ele && <span className="inline-flex items-center gap-1.5">Falta la luz de este techo: <button type="button" onClick={() => ir('electricidad')} className="px-2 py-1 rounded-lg bg-amber-400 text-slate-950 font-black cursor-pointer">⚡ Poner la luz</button></span>}
              {!datos.gas && <span className="inline-flex items-center gap-1.5">Falta el agua de este techo: <button type="button" onClick={() => ir('gasfiteria')} className="px-2 py-1 rounded-lg bg-sky-600 text-white font-black cursor-pointer">💧 Poner el agua</button></span>}
            </div>
          )}
          <div className="flex-1 min-h-[300px] bg-slate-100"><Escena3D datos={datos} ver={ver} /></div>
        </>)}
      </div>
    </div>
  );
}
