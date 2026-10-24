// =============================================================================
// Visor 3D de la obra (estilo SketchUp): colores planos y claros, contornos
// finos y texturas simples. Dibuja:
//   - la estructura guardada en Techos Metálicos (perfiles con su sección real
//     y coberturas con su material),
//   - el concreto del plano (zapatas, columnas, vigas, cimientos, losas),
//   - los muros de ladrillo / drywall / OSB de cada piso, a su altura.
// Órbita: arrastrar para girar, rueda o pellizco para acercar.
// =============================================================================
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { PlanoElem } from './ConcretoPlanoCad';
import type { EstructuraTechos } from './concreto/obraPisos';
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS } from './techos/techosCadCatalog';

const C = {
  concreto: 0xcfcfca, zapata: 0xc8c4bc, cimiento: 0xbdb8ae, losa: 0xdcdcd7, acero: 0x5f6f82,
  ladrillo: 0xc98463, osb: 0xd8b57a, drywall: 0xf1f1ee, suelo: 0xeef0ea, borde: 0x1f2328,
};

function texturaCanvas(draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

const TEX = {
  ladrillo: () => texturaCanvas(g => {
    g.fillStyle = hex(C.ladrillo); g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3;
    for (let r = 0; r < 8; r++) {
      const y = r * 32; g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke();
      for (let k = 0; k < 4; k++) { const x = k * 64 + (r % 2 ? 32 : 0); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
    }
  }),
  osb: () => texturaCanvas(g => {
    g.fillStyle = hex(C.osb); g.fillRect(0, 0, 256, 256);
    // Semilla fija: el mismo patrón en cada render.
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${120 + rnd() * 60},${80 + rnd() * 40},${30 + rnd() * 30},${0.18 + rnd() * 0.2})`;
      g.save(); g.translate(rnd() * 256, rnd() * 256); g.rotate(rnd() * 3.14); g.fillRect(-14, -3, 28, 6); g.restore();
    }
    g.strokeStyle = 'rgba(90,60,25,.6)'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256);
  }),
  ondulada: (base: number) => texturaCanvas(g => {
    g.fillStyle = hex(base); g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 16) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, 0, 5, 256); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x + 8, 0, 4, 256); }
  }),
};

// Material de cobertura según su categoría en el catálogo de Techos.
function materialCobertura(materialId: string): THREE.Material {
  const cat = INVENTARIO_COBERTURAS.find(c => c.id === materialId)?.categoria || 'aluzinc_tr4';
  const ondulada = (color: number) => { const t = TEX.ondulada(color); t.repeat.set(1.2, 1.2); return new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }); };
  switch (cat) {
    case 'policarbonato_alveolar': return new THREE.MeshLambertMaterial({ color: 0xbfe3f2, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    case 'upvc_termoacustica': return ondulada(0xe7ebef);
    case 'panel_sandwich_pur': return new THREE.MeshLambertMaterial({ color: 0xf1f1ee, side: THREE.DoubleSide });
    case 'plancha_acero_deck': return ondulada(0xc4c9cf);
    case 'calamina_galvanizada': return ondulada(0xc3cad1);
    default: return ondulada(0xb9c3cc); // Aluzinc TR-4 / TR-5
  }
}

export default function ConcretoViewer3D({ elems, bases = {}, estructura = null }: { elems: PlanoElem[]; bases?: Record<string, number>; estructura?: EstructuraTechos | null }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const datos = useRef({ elems, bases, estructura });
  datos.current = { elems, bases, estructura };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' });

    scene.add(new THREE.AmbientLight(0xffffff, 1.9));
    const sol = new THREE.DirectionalLight(0xffffff, 1.1); sol.position.set(9, 15, 6); scene.add(sol);
    const relleno = new THREE.DirectionalLight(0xffffff, 0.45); relleno.position.set(-8, 6, -6); scene.add(relleno);

    const modelo = new THREE.Group();
    scene.add(modelo);
    const bordes = new THREE.LineBasicMaterial({ color: C.borde, transparent: true, opacity: 0.85 });
    const bordesFinos = new THREE.LineBasicMaterial({ color: C.borde, transparent: true, opacity: 0.35 });
    const plano = (color: number) => new THREE.MeshLambertMaterial({ color });
    const M = { concreto: plano(C.concreto), zapata: plano(C.zapata), cimiento: plano(C.cimiento), losa: plano(C.losa), acero: plano(C.acero), drywall: plano(C.drywall) };

    const conBordes = (mesh: THREE.Mesh, fino = false) => {
      modelo.add(mesh);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), fino ? bordesFinos : bordes);
      e.position.copy(mesh.position); e.quaternion.copy(mesh.quaternion);
      modelo.add(e);
    };
    const caja = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, rotY = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.02, w), Math.max(0.02, h), Math.max(0.02, d)), mat);
      m.position.set(x, y, z); m.rotation.y = rotY; conBordes(m);
    };
    // Barra entre dos puntos 3D con sección (ancho × alto).
    const barra = (a: THREE.Vector3, b: THREE.Vector3, ancho: number, alto: number, mat: THREE.Material) => {
      const dir = new THREE.Vector3().subVectors(b, a); const L = dir.length();
      if (L < 0.005) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(L, alto, ancho), mat);
      m.position.copy(a).addScaledVector(dir, 0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
      conBordes(m, true);
    };

    const construir = () => {
      const { elems: list, bases: bs, estructura: est } = datos.current;

      // ---- Estructura de Techos ----
      if (est) {
        const N = est.nodes || {};
        Object.values(est.segments || {}).forEach(sg => {
          const na = N[sg.nodeAId], nb = N[sg.nodeBId];
          if (!na || !nb) return;
          const p = INVENTARIO_PERFILES_TUBULARES.find(x => x.id === sg.profileId);
          const ancho = Math.max(0.03, (p?.anchoMm || 50) / 1000), alto = Math.max(0.03, (p?.altoMm || 50) / 1000);
          const a = new THREE.Vector3(na.x, na.y, na.z), b = new THREE.Vector3(nb.x, nb.y, nb.z);
          if (sg.rolEstructural === 'columna_concreto') { barra(a, b, Math.max(0.25, ancho), Math.max(0.25, alto), M.concreto); return; }
          const hc = sg.concretoBaseM || 0;
          if (hc > 0 && sg.rolEstructural.startsWith('columna')) {
            const bajo = a.y <= b.y ? a : b, altoP = a.y <= b.y ? b : a;
            const corte = bajo.clone().add(new THREE.Vector3().subVectors(altoP, bajo).setLength(Math.min(hc, bajo.distanceTo(altoP))));
            barra(bajo, corte, Math.max(0.25, ancho + 0.1), Math.max(0.25, alto + 0.1), M.concreto);
            barra(corte, altoP, ancho, alto, M.acero);
            return;
          }
          barra(a, b, ancho, alto, M.acero);
        });
        Object.values(est.coverageZones || {}).forEach(z => {
          const pts = (z.nodeIdsBoundary || []).map(id => N[id]).filter(Boolean).map(n => new THREE.Vector3(n.x, n.y + 0.06, n.z));
          if (pts.length < 3) return;
          const pos: number[] = [], uv: number[] = [];
          for (let i = 1; i < pts.length - 1; i++) [pts[0], pts[i], pts[i + 1]].forEach(v => { pos.push(v.x, v.y, v.z); uv.push(v.x / 1.1, v.z / 1.1); });
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
          g.computeVertexNormals();
          const m = new THREE.Mesh(g, materialCobertura(z.coberturaMaterialId));
          modelo.add(m);
          const contorno = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), bordes);
          modelo.add(contorno);
        });
      }

      // ---- Concreto y muros del plano ----
      const colHs = list.filter(e => e.tipo === 'columna').map(e => e.H || 3);
      const vigaElev = colHs.length ? Math.max(...colHs) : 3;
      list.forEach(e => {
        const a = e.a, b = e.b || e.a, h = e.h || 0.5, H = e.H || 3;
        if (e.tipo === 'columna') caja(a, H, b, e.x1, H / 2, e.y1, M.concreto);
        else if (e.tipo === 'zapata') caja(a, h, b, e.x1, h / 2 - h, e.y1, M.zapata);
        else if (e.tipo === 'losa' && e.x2 !== undefined && e.y2 !== undefined) {
          const esp = e.h || 0.2;
          caja(Math.abs(e.x2 - e.x1), esp, Math.abs(e.y2 - e.y1), (e.x1 + e.x2) / 2, vigaElev + esp / 2, (e.y1 + e.y2) / 2, M.losa);
        } else if (e.x2 !== undefined && e.y2 !== undefined) {
          const dx = e.x2 - e.x1, dz = e.y2 - e.y1, L = Math.hypot(dx, dz);
          const cx = (e.x1 + e.x2) / 2, cz = (e.y1 + e.y2) / 2, rotY = -Math.atan2(dz, dx);
          if (e.tipo === 'muro') {
            const Hm = e.H || 2.6, base = bs[e.nivel || ''] || 0, mat = e.material || 'ladrillo';
            let material: THREE.Material = M.drywall;
            if (mat === 'ladrillo') { const t = TEX.ladrillo(); t.repeat.set(L / 1.2, Hm / 0.6); material = new THREE.MeshLambertMaterial({ map: t }); }
            if (mat === 'osb') { const t = TEX.osb(); t.repeat.set(L / 1.22, Hm / 2.44); material = new THREE.MeshLambertMaterial({ map: t }); }
            caja(L, Hm, a, cx, base + Hm / 2, cz, material, rotY);
          } else if (e.tipo === 'viga') caja(L, h, a, cx, vigaElev - h / 2, cz, M.concreto, rotY);
          else caja(L, h, a, cx, -h / 2, cz, M.cimiento, rotY);
        }
      });
    };

    construir();

    // Suelo y rejilla (mismo lenguaje que Techos)
    const box = new THREE.Box3().setFromObject(modelo);
    const centro = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const tam = box.isEmpty() ? new THREE.Vector3(10, 3, 10) : box.getSize(new THREE.Vector3());
    const ext = Math.max(20, Math.ceil(Math.max(tam.x, tam.z) * 2.5));
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ext, ext), plano(C.suelo));
    suelo.rotation.x = -Math.PI / 2; suelo.position.set(centro.x, -0.012, centro.z); scene.add(suelo);
    const rejilla = new THREE.GridHelper(ext, ext, 0xd5dbe3, 0xe8ecf1); rejilla.position.set(centro.x, -0.005, centro.z); scene.add(rejilla);

    // Órbita manual alrededor del modelo
    let az = -0.72, pol = 0.98, rad = Math.max(8, Math.max(tam.x, tam.z, tam.y) * 2.1);
    const objetivo = new THREE.Vector3(centro.x, Math.max(1, tam.y * 0.4), centro.z);
    const actualizar = () => {
      pol = Math.max(0.15, Math.min(Math.PI / 2 - 0.03, pol));
      camera.position.set(objetivo.x + rad * Math.sin(pol) * Math.cos(az), objetivo.y + rad * Math.cos(pol), objetivo.z + rad * Math.sin(pol) * Math.sin(az));
      camera.lookAt(objetivo);
    };
    actualizar();

    const punteros = new Map<number, { x: number; y: number }>();
    let distPinza = 0;
    const onDown = (e: PointerEvent) => { punteros.set(e.pointerId, { x: e.clientX, y: e.clientY }); renderer.domElement.setPointerCapture(e.pointerId); renderer.domElement.style.cursor = 'grabbing'; };
    const onMove = (e: PointerEvent) => {
      const prev = punteros.get(e.pointerId);
      if (!prev) return;
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (punteros.size === 2) {
        const [p1, p2] = [...punteros.values()];
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (distPinza) rad = Math.max(3, Math.min(150, rad * distPinza / d));
        distPinza = d;
      } else {
        az += (e.clientX - prev.x) * 0.008;
        pol -= (e.clientY - prev.y) * 0.008;
      }
      actualizar();
    };
    const onUp = (e: PointerEvent) => { punteros.delete(e.pointerId); distPinza = 0; renderer.domElement.style.cursor = 'grab'; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); rad = Math.max(3, Math.min(150, rad * (e.deltaY < 0 ? 0.9 : 1.1))); actualizar(); };
    const el = renderer.domElement;
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(mount); resize();

    let raf = 0;
    const loop = () => { renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      scene.traverse(o => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, []);

  // El padre remonta el visor (key) cuando cambia la escena.
  return <div ref={mountRef} className="w-full h-full" />;
}
