// =============================================================================
// Visor 3D del plano de cimentación de concreto (Opción B).
// Renderiza los elementos dibujados en el CAD 2D como volúmenes de concreto:
//   - Columna → prisma que sube de 0 a su altura H.
//   - Zapata  → bloque bajo (pedestal) a nivel de piso.
//   - Viga    → viga de amarre a la altura de columnas, a lo largo de la línea.
//   - Cimiento→ bloque ciclópeo a ras de piso, a lo largo de la línea.
// Órbita manual (arrastrar para girar, rueda para acercar). Sin dependencias extra.
// =============================================================================
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { PlanoElem } from './ConcretoPlanoCad';

export default function ConcretoViewer3D({ elems }: { elems: PlanoElem[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const elemsRef = useRef(elems);
  elemsRef.current = elems;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.style.cursor = 'grab';

    // Luces
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(8, 14, 6);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-6, 8, -5);
    scene.add(dir2);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Materiales por tipo (tono concreto, color de acento por tipo)
    const mats: Record<string, THREE.MeshStandardMaterial> = {
      columna: new THREE.MeshStandardMaterial({ color: 0x9aa7bd, roughness: 0.85, metalness: 0.05 }),
      zapata: new THREE.MeshStandardMaterial({ color: 0xbfa38a, roughness: 0.95, metalness: 0.02 }),
      viga: new THREE.MeshStandardMaterial({ color: 0x86b8a3, roughness: 0.85, metalness: 0.03 }),
      cimiento: new THREE.MeshStandardMaterial({ color: 0xada49a, roughness: 0.98, metalness: 0.0 }),
      losa: new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.9, metalness: 0.02, transparent: true, opacity: 0.75 }),
    };
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.35 });

    // Construye los volúmenes a partir de los elementos del plano.
    // Eje: X = x del plano, Z = y del plano (profundidad), Y = altura.
    const rebuild = () => {
      while (modelGroup.children.length) modelGroup.remove(modelGroup.children[0]);
      const list = elemsRef.current;
      if (!list.length) return;

      // Altura de referencia para vigas de amarre = altura máx. de columnas (o 3 m).
      const colHs = list.filter(e => e.tipo === 'columna').map(e => e.H || 3);
      const vigaElev = colHs.length ? Math.max(...colHs) : 3;

      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      const acc = (x: number, z: number) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); };

      const addBox = (w: number, h: number, d: number, cx: number, cy: number, cz: number, mat: THREE.Material, rotY = 0) => {
        const geo = new THREE.BoxGeometry(Math.max(0.02, w), Math.max(0.02, h), Math.max(0.02, d));
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx, cy, cz);
        mesh.rotation.y = rotY;
        modelGroup.add(mesh);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
        edges.position.copy(mesh.position);
        edges.rotation.y = rotY;
        modelGroup.add(edges);
      };

      list.forEach(e => {
        const a = e.a, b = e.b || e.a, h = e.h || 0.5, H = e.H || 3;
        if (e.tipo === 'columna') {
          addBox(a, H, b, e.x1, H / 2, e.y1, mats.columna);
          acc(e.x1, e.y1);
        } else if (e.tipo === 'zapata') {
          addBox(a, h, b, e.x1, h / 2, e.y1, mats.zapata);
          acc(e.x1, e.y1);
        } else if (e.tipo === 'losa' && e.x2 !== undefined && e.y2 !== undefined) {
          // Losa / entrepiso: placa plana sobre las vigas (rectángulo por esquinas)
          const w = Math.abs(e.x2 - e.x1), d = Math.abs(e.y2 - e.y1);
          const cx = (e.x1 + e.x2) / 2, cz = (e.y1 + e.y2) / 2;
          const esp = e.h || 0.20;
          addBox(Math.max(0.1, w), esp, Math.max(0.1, d), cx, vigaElev + esp / 2, cz, mats.losa);
          acc(e.x1, e.y1); acc(e.x2, e.y2);
        } else if (e.x2 !== undefined && e.y2 !== undefined) {
          const dx = e.x2 - e.x1, dz = e.y2 - e.y1;
          const L = Math.hypot(dx, dz);
          const cx = (e.x1 + e.x2) / 2, cz = (e.y1 + e.y2) / 2;
          const rotY = -Math.atan2(dz, dx);
          if (e.tipo === 'viga') {
            addBox(L, h, a, cx, vigaElev - h / 2, cz, mats.viga, rotY);
          } else { // cimiento (ras de piso)
            addBox(L, h, a, cx, h / 2, cz, mats.cimiento, rotY);
          }
          acc(e.x1, e.y1); acc(e.x2, e.y2);
        }
      });

      // Piso / losa de terreno
      if (minX !== Infinity) {
        const padX = Math.max(1, (maxX - minX) * 0.25), padZ = Math.max(1, (maxZ - minZ) * 0.25);
        const gw = (maxX - minX) + padX * 2, gd = (maxZ - minZ) + padZ * 2;
        const ground = new THREE.Mesh(new THREE.BoxGeometry(Math.max(1, gw), 0.05, Math.max(1, gd)),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 1 }));
        ground.position.set((minX + maxX) / 2, -0.025, (minZ + maxZ) / 2);
        modelGroup.add(ground);
      }
    };

    // Órbita manual (coordenadas esféricas alrededor del centro del modelo)
    let az = Math.PI * 0.75, pol = Math.PI * 0.32, rad = 14;
    const target = new THREE.Vector3(0, 1, 0);

    const fitCamera = () => {
      const box = new THREE.Box3().setFromObject(modelGroup);
      if (box.isEmpty()) { target.set(0, 1, 0); rad = 14; return; }
      const c = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      target.copy(c);
      rad = Math.max(6, Math.max(size.x, size.z, size.y) * 1.9);
    };

    const updateCamera = () => {
      pol = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, pol));
      camera.position.set(
        target.x + rad * Math.sin(pol) * Math.cos(az),
        target.y + rad * Math.cos(pol),
        target.z + rad * Math.sin(pol) * Math.sin(az)
      );
      camera.lookAt(target);
    };

    rebuild();
    fitCamera();
    updateCamera();

    // Interacción
    let dragging = false, lx = 0, ly = 0;
    const onDown = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; renderer.domElement.style.cursor = 'grabbing'; renderer.domElement.setPointerCapture(e.pointerId); };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      az -= (e.clientX - lx) * 0.01;
      pol -= (e.clientY - ly) * 0.01;
      lx = e.clientX; ly = e.clientY;
      updateCamera();
    };
    const onUp = (e: PointerEvent) => { dragging = false; renderer.domElement.style.cursor = 'grab'; try { renderer.domElement.releasePointerCapture(e.pointerId); } catch {} };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); rad = Math.max(3, Math.min(80, rad * (e.deltaY < 0 ? 0.9 : 1.1))); updateCamera(); };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Resize
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0;
    const loop = () => { renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  // Reconstruir la escena cuando cambian los elementos (sin recrear el renderer).
  // Se logra con un re-montaje ligero: el efecto de arriba lee elemsRef, así que
  // forzamos un rebuild disparando un evento personalizado.
  useEffect(() => {
    // El efecto principal lee elemsRef.current en cada rebuild; para reflejar
    // cambios, remonta el visor cambiando una key desde el padre. Como fallback,
    // aquí no hacemos nada: el padre usa key={elems.length + hash} para remontar.
  }, [elems]);

  return <div ref={mountRef} className="w-full h-full" />;
}
