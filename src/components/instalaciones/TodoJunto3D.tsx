// =============================================================================
// "Todo en 3D": el techo metálico (estructura y calamina) con su instalación eléctrica y
// su gasfitería en una sola vista, para mostrársela al cliente. Usa el techo abierto en
// Techos y las cotizaciones actuales de Electricidad y Gasfitería que tienen ese techo de
// fondo (botones ⚡ y 💧 de Techos): las tres comparten el mismo origen (esquina del techo).
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, X, Maximize2, Zap, Droplets, Eye, EyeOff, Video, Square, Camera } from 'lucide-react';
import { grabarEnFases, fotoDe3D, GIRO_VIDEO_RAD_S } from '../../lib/captura3d';
import { crearRenderer, liberarRenderer } from '../../lib/webglSeguro';
import { safeStorage } from '../../lib/storageManager';
import { dibujarElectricidad } from '../electricidad/Electricidad3D';
import { dibujarGasfiteria } from '../gasfiteria/Gasfiteria3D';
import { leerCotizacionActual as leerEle, esEspecial, KEY_ORIGEN, CotizacionEle } from '../electricidad/modeloElectricidad';
import { infoRutas, cuadroCargas, sugerirCircuitos, trazarAutomatico } from '../electricidad/calculoElectricidad';
import { leerCotizacionActual as leerGas, KEY_ORIGEN_GAS, murosDeObra, pisosObra, MuroRef } from '../gasfiteria/modeloGasfiteria';
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

export type OrigenTodo = 'techos' | 'obra';
const H_MURO = 2.5;

/** Luz de la cotización actual si su fondo es el de este plano (sin tuberías: trazado automático de vista previa). */
function luzCon(tipo: 'techos' | 'obra') {
  const e = leerEle();
  if (e.fondo.tipo !== tipo || !e.puntos.some(p => !esEspecial(p.tipo))) return null;
  let c = e;
  if (!c.rutas.length && c.puntos.some(p => p.tipo === 'tablero')) {
    if (c.puntos.some(p => !esEspecial(p.tipo) && !c.circuitos.some(k => k.id === p.circuito))) c = { ...c, ...sugerirCircuitos(c) };
    const t = trazarAutomatico(c); if (t.rutas.length) c = { ...c, rutas: t.rutas, puntos: t.puntos };
  }
  return { cot: c, info: infoRutas(c, cuadroCargas(c).seccionAlim) };
}
function aguaCon(tipo: 'techos' | 'obra') {
  const g = leerGas();
  return g.fondo.tipo === tipo && (g.aparatos.length || g.tramos.length) ? { cot: g, empalmes: calcEmpalmes(g.tramos, g.aparatos) } : null;
}

/** Obra Civil / Drywall: los muros y tabiques del piso con su luz y su agua (mismas coordenadas del plano). */
function leerObra() {
  const ele = luzCon('obra'), gas = aguaCon('obra');
  const nivel = ele?.cot.fondo.nivel || gas?.cot.fondo.nivel || pisosObra()[0];
  const muros = murosDeObra(nivel);
  if (!muros.length && !ele && !gas) return null;
  return { tipo: 'obra' as const, nivel, muros, ele, gas, escena: null as Escena | null, x0: 0, z0: 0, hTecho: H_MURO };
}

/** Lee el techo, la luz y el agua y los deja en el mismo sistema de coordenadas. */
function leerTodo(origen: OrigenTodo = 'techos') {
  if (origen === 'obra') return leerObra();
  const escena = safeStorage.getItem<Escena | null>('innova_techos_escena_actual', null);
  const N = escena?.nodes || {};
  const ns = Object.values(N).filter(n => isFinite(n.x) && isFinite(n.z));
  if (ns.length < 2) return null;
  const x0 = Math.min(...ns.map(n => n.x)), z0 = Math.min(...ns.map(n => n.z));
  const segs = Object.values(escena?.segments || {});
  const cols = segs.filter(s => s.rolEstructural === 'columna');
  const topes = cols.map(s => Math.max(N[s.nodeAId]?.y ?? 0, N[s.nodeBId]?.y ?? 0)).filter(y => y > 0.5);
  const hTecho = topes.length ? Math.min(...topes) : 2.8; // a la altura del alero (debajo del tijeral)
  const ele: { cot: CotizacionEle; info: ReturnType<typeof infoRutas> } | null = luzCon('techos');
  const gas = aguaCon('techos');
  return { tipo: 'techos' as const, nivel: '', muros: [] as MuroRef[], escena: escena as Escena | null, x0, z0, hTecho, ele, gas };
}

function Escena3D({ datos, ver, girando = false, onCanvas }: { datos: NonNullable<ReturnType<typeof leerTodo>>; ver: Record<string, boolean>; girando?: boolean; onCanvas?: (c: HTMLCanvasElement | null) => void }) {
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
    onCanvas?.(renderer.domElement);
    return () => { onCanvas?.(null); ro.disconnect(); controls.dispose(); liberar(scene); liberarRenderer(renderer); ctx.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mientras se graba: una vuelta completa alrededor del modelo (15 s).
  useEffect(() => {
    if (!girando) return;
    let raf = 0, t = performance.now();
    const paso = () => {
      const c = ctx.current; if (!c) return;
      const ahora = performance.now(), dt = Math.min(0.1, (ahora - t) / 1000); t = ahora;
      const off = c.cam.position.clone().sub(c.controls.target);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), GIRO_VIDEO_RAD_S * dt);
      c.cam.position.copy(c.controls.target).add(off); c.cam.lookAt(c.controls.target);
      c.render(); raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [girando]);

  useEffect(() => {
    const c = ctx.current; if (!c) return;
    const primera = c.grupo.children.length === 0;
    liberar(c.grupo); c.grupo.clear();
    const { escena, x0, z0, hTecho, ele, gas } = datos;
    if (datos.tipo === 'obra') {
      // Piso que encierra muros, luz y agua; muros con sus vanos (puertas y ventanas).
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      const add = (x: number, y: number) => { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); };
      datos.muros.forEach(m => { add(m.x1, m.y1); add(m.x2, m.y2); });
      ele?.cot.puntos.forEach(p => add(p.x, p.y)); gas?.cot.aparatos.forEach(a => add(a.x, a.y));
      if (!isFinite(bx0)) { bx0 = 0; by0 = 0; bx1 = 4; by1 = 3; }
      const piso = new THREE.Mesh(new THREE.PlaneGeometry(bx1 - bx0 + 2, by1 - by0 + 2), new THREE.MeshStandardMaterial({ color: '#e7e2d9', roughness: 1, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
      piso.rotation.x = -Math.PI / 2; piso.position.set((bx0 + bx1) / 2, 0, (by0 + by1) / 2); piso.userData.sinAjuste = true; c.grupo.add(piso);
      if (ver.estructura) {
        const mm = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9, transparent: true, opacity: ver.calamina ? 0.55 : 0.18, depthWrite: false });
        const borde = new THREE.LineBasicMaterial({ color: '#94a3b8', transparent: true, opacity: 0.6 });
        datos.muros.forEach(m => {
          const Lm = Math.hypot(m.x2 - m.x1, m.y2 - m.y1); if (Lm < 0.01) return;
          const ux = (m.x2 - m.x1) / Lm, uy = (m.y2 - m.y1) / Lm, ang = Math.atan2(uy, ux);
          const piezas: [number, number, number, number][] = []; let t = 0;
          [...(m.vanos || [])].sort((p, q) => p.t - q.t).forEach(v => {
            const a = Math.max(t, v.t - v.w / 2), bb = Math.min(Lm, v.t + v.w / 2); if (bb <= a) return;
            if (a > t) piezas.push([t, a, 0, H_MURO]);
            if (v.puerta) piezas.push([a, bb, 2.1, H_MURO]); else piezas.push([a, bb, 0, 0.9], [a, bb, 2.1, H_MURO]);
            t = bb;
          });
          if (t < Lm) piezas.push([t, Lm, 0, H_MURO]);
          piezas.forEach(([a, bb, y0, y1]) => {
            const g = new THREE.BoxGeometry(bb - a, y1 - y0, m.a);
            const mesh = new THREE.Mesh(g, mm);
            mesh.position.set(m.x1 + ux * (a + bb) / 2, (y0 + y1) / 2, m.y1 + uy * (a + bb) / 2); mesh.rotation.y = -ang;
            mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), borde));
            c.grupo.add(mesh);
          });
        });
      }
      if (ele && ver.luz) dibujarElectricidad(c.grupo, ele.cot, {}, ele.info, { conTecho: true, hTecho: H_MURO });
      if (gas && ver.agua) dibujarGasfiteria(c.grupo, gas.cot, { fria: true, caliente: true, desague: true, ventilacion: true, aparatos: true, muros: false }, gas.empalmes, { conTecho: true });
      if (primera) c.ajustar(); else c.render();
      return;
    }
    if (!escena) return;
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

export default function VentanaTodoJunto3D({ onClose, origen = 'techos' }: { onClose: () => void; origen?: OrigenTodo }) {
  const datos = useMemo(() => leerTodo(origen), [origen]);
  const esObra = datos?.tipo === 'obra' || (!datos && origen === 'obra');
  const [ver, setVer] = useState({ estructura: true, calamina: true, luz: true, agua: true });
  // Video MP4 de 15 s en 3 fases y foto JPG (lib/captura3d.ts).
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const grab = useRef<{ detener: () => void } | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [seg, setSeg] = useState(0);
  const [fase, setFase] = useState('');
  const [aviso, setAviso] = useState('');
  const avisar = (t: string) => { setAviso(t); window.setTimeout(() => setAviso(a => (a === t ? '' : a)), 4000); };
  const grabar = () => {
    if (grab.current) { grab.current.detener(); return; }
    if (!canvas.current || !datos) return;
    const antes = ver;
    grab.current = grabarEnFases(() => canvas.current, esObra ? 'obra_luz_agua_3d' : 'techo_luz_agua_3d', {
      fondo: () => ({ color: '#eef2f7' }),
      fases: [
        { nombre: esObra ? '1. Muros' : '1. Estructura', aplicar: () => setVer({ estructura: true, calamina: false, luz: false, agua: false }) },
        { nombre: '2. Luz y agua', aplicar: () => setVer({ estructura: true, calamina: false, luz: true, agua: true }) },
        { nombre: '3. Terminado', aplicar: () => setVer({ estructura: true, calamina: true, luz: true, agua: true }) },
      ],
      alCambiarFase: (_i, f) => setFase(f.nombre), alSegundo: setSeg,
      alTerminar: ext => { grab.current = null; setGrabando(false); setFase(''); setVer(antes); avisar(`✓ Video ${ext.toUpperCase()} descargado`); },
    });
    if (grab.current) setGrabando(true); else avisar('La grabación de video no está disponible en este navegador.');
  };
  const foto = async () => { if (canvas.current) avisar((await fotoDe3D(canvas.current, esObra ? 'obra_luz_agua_3d' : 'techo_luz_agua_3d', { color: '#eef2f7' })) ? '✓ Foto JPG descargada' : 'No se pudo sacar la foto'); };
  const ir = (vista: 'electricidad' | 'gasfiteria') => {
    safeStorage.setItem(vista === 'electricidad' ? KEY_ORIGEN : KEY_ORIGEN_GAS, esObra ? 'obra' : 'techos');
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
            <p className="text-[11px] text-slate-500 truncate">{esObra ? 'Los muros con su instalación eléctrica y de agua' : 'El techo con su instalación eléctrica y de agua'}, para mostrar al cliente</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        {!datos ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-slate-500">{esObra ? 'Primero dibuja los muros en el plano de Obra Civil o Drywall.' : 'Primero arma el techo en Techos Metálicos.'}</div>
        ) : (<>
          <div className="px-3 py-2 flex flex-wrap items-center gap-1.5 bg-slate-50 border-b border-slate-200">
            {chip('estructura', esObra ? 'Muros' : 'Estructura', <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />)}
            {chip('calamina', esObra ? 'Muros sólidos' : 'Calamina', <span className="w-2.5 h-2.5 rounded-full bg-sky-700" />)}
            {chip('luz', 'Luz', <Zap className="w-3.5 h-3.5 text-amber-500" />, !!datos.ele)}
            {chip('agua', 'Agua y desagüe', <Droplets className="w-3.5 h-3.5 text-sky-500" />, !!datos.gas)}
            <span className="ml-auto flex items-center gap-1.5">
              <button type="button" onClick={foto} title="Foto JPG de esta vista" className="min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"><Camera className="w-3.5 h-3.5" />Foto</button>
              <button type="button" onClick={grabar} title={grabando ? 'Detener y descargar' : 'Video MP4 de 15 s: estructura → luz y agua → terminado'}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-black cursor-pointer border ${grabando ? 'bg-rose-600 text-white border-rose-600 animate-pulse' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}>
                {grabando ? <Square className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}{grabando ? `Detener · ${seg}s` : 'Grabar'}
              </button>
            </span>
          </div>
          {(grabando || aviso) && <div className="px-3 py-1.5 text-[11px] font-black text-center bg-rose-50 text-rose-700 border-b border-rose-200">{grabando ? `Grabando · ${fase} · ${seg}s` : aviso}</div>}
          {(!datos.ele || !datos.gas) && (
            <div className="px-3 py-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-amber-50 border-b border-amber-200">
              {!datos.ele && <span className="inline-flex items-center gap-1.5">Falta la luz de {esObra ? 'esta obra' : 'este techo'}: <button type="button" onClick={() => ir('electricidad')} className="px-2 py-1 rounded-lg bg-amber-400 text-slate-950 font-black cursor-pointer">⚡ Poner la luz</button></span>}
              {!datos.gas && <span className="inline-flex items-center gap-1.5">Falta el agua de {esObra ? 'esta obra' : 'este techo'}: <button type="button" onClick={() => ir('gasfiteria')} className="px-2 py-1 rounded-lg bg-sky-600 text-white font-black cursor-pointer">💧 Poner el agua</button></span>}
            </div>
          )}
          <div className="flex-1 min-h-[300px] bg-slate-100"><Escena3D datos={datos} ver={ver} girando={grabando} onCanvas={c => { canvas.current = c; }} /></div>
        </>)}
      </div>
    </div>
  );
}
