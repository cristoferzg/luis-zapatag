// Mini visor 3D de una plantilla (Techos o Carpintería Metálica): se gira y se mira, sin editar ni
// descargar (pedido del dueño, 17/11/2026). Sirve también como muestra antes de comprar.
// Dibuja las mismas piezas que van a AutoCAD/Revit (lib/solidosCad + adaptadores) y muestra la ficha:
// medidas, piezas y metros calculados, más los «detalles» que carga el MCP de la Academia.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { X, Box, Ruler, Layers, Lock, RotateCw } from 'lucide-react';
import { crearRenderer, liberarRenderer } from '../../lib/webglSeguro';
import { ejesLocales, ejesSuperficie, type SolidoCad, type SuperficieCad } from '../../lib/solidosCad';
import type { BibliotecaItem } from '../BibliotecaPremiumView';

const COLOR: Record<string, number> = { columna: 0x2563eb, viga: 0x475569, miembro: 0xf59e0b, baranda: 0x16a34a, placa: 0x8b5a2b, losa: 0x94a3b8, muro: 0xfb923c, zapata: 0x78716c };
const NOMBRE: Record<string, string> = { columna: 'Columnas', viga: 'Vigas, cordones y correas', miembro: 'Diagonales, montantes y zancos', baranda: 'Barandas', placa: 'Planchas y peldaños', losa: 'Losas', muro: 'Muros', zapata: 'Zapatas' };
const MODULO: Record<string, string> = { techos: 'Techos Metálicos', carpimetal: 'Carpintería Metálica', drywall: 'Drywall' };

/** El diseño de la plantilla, venga como venga: dentro del recurso, en un archivo .json, con la escena
 *  envuelta o sin piezas armadas (Carpintería Metálica las rearma). */
async function disenoDe(item: BibliotecaItem): Promise<{ modulo: string; datos: any } | null> {
  let datos: any = item.plantilla?.datos;
  if (typeof datos === 'string') { try { datos = JSON.parse(datos); } catch { datos = null; } }
  if (!datos && /\.json$/i.test(item.fileName || '') && item.enlaceDescargaUrl) {
    try { datos = await (await fetch(item.enlaceDescargaUrl)).json(); } catch { datos = null; }
  }
  if (!datos || typeof datos !== 'object') return null;
  if (datos.escena && !datos.nodes) datos = datos.escena;
  if (datos.design && !datos.piezas) datos = datos.design;
  const { detectarPlantilla } = await import('../../lib/plantillas');
  const pl = await detectarPlantilla(datos, item.fileName || item.titulo || 'diseno.json').catch(() => null);
  if (pl) return pl;
  return item.plantilla ? { modulo: item.plantilla.modulo, datos } : null;
}

async function piezasDe(item: BibliotecaItem): Promise<{ solidos: SolidoCad[]; superficies: SuperficieCad[] } | null> {
  const p = await disenoDe(item);
  if (!p?.datos) return null;
  if (p.modulo === 'techos') {
    const { solidosDeTecho } = await import('../techos/exportarCadTechos');
    return solidosDeTecho(p.datos.nodes || {}, p.datos.segments || {}, p.datos.coverageZones || {});
  }
  if (p.modulo === 'carpimetal') {
    const [{ solidosDeHerreria }, { asegurarCad }] = await Promise.all([import('../herreria/exportarCad'), import('../herreria/herreriaCatalog')]);
    return { solidos: solidosDeHerreria(asegurarCad(p.datos)), superficies: [] };
  }
  return null;
}

export default function VisorPlantilla3D({ item, onClose, bloqueada }: { item: BibliotecaItem; onClose: () => void; bloqueada?: boolean }) {
  const caja = useRef<HTMLDivElement>(null);
  const [ficha, setFicha] = useState<{ medidas: string; grupos: [string, number, number][]; total: number; metros: number } | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'sin3d'>('cargando');
  const giro = useRef(true);

  useEffect(() => {
    let vivo = true, raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    const obs = new ResizeObserver(() => ajustar());
    let ajustar = () => {};
    piezasDe(item).then(res => {
      if (!vivo) return;
      if (!res || (!res.solidos.length && !res.superficies.length) || !caja.current) { setEstado('sin3d'); return; }
      const el = caja.current;
      const escena = new THREE.Scene();
      escena.background = new THREE.Color(0xeef2f7);
      escena.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.6));
      const sol = new THREE.DirectionalLight(0xffffff, 1.4); sol.position.set(8, 14, 6); escena.add(sol);
      const grupo = new THREE.Group(); escena.add(grupo);
      const mats = new Map<string, THREE.Material>();
      const mat = (t: string) => { if (!mats.has(t)) mats.set(t, new THREE.MeshStandardMaterial({ color: COLOR[t] ?? 0x64748b, roughness: .55, metalness: .25 })); return mats.get(t)!; };
      const cuenta = new Map<string, [number, number]>();
      let metros = 0;
      res.solidos.forEach(s => {
        const { x, y, z, largo } = ejesLocales(s);
        if (largo < 0.002) return;
        const sec = s.seccion;
        const geo = /circ/.test(sec.forma)
          ? new THREE.CylinderGeometry(sec.ancho / 2, sec.ancho / 2, largo, 12).rotateX(Math.PI / 2)
          : new THREE.BoxGeometry(Math.max(0.004, sec.ancho), Math.max(0.004, sec.alto), largo);
        const m = new THREE.Mesh(geo, mat(s.tipo));
        m.matrixAutoUpdate = false;
        m.matrix.makeBasis(new THREE.Vector3(...x), new THREE.Vector3(...y), new THREE.Vector3(...z));
        m.matrix.setPosition((s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2, (s.a[2] + s.b[2]) / 2);
        grupo.add(m);
        const c = cuenta.get(s.tipo) || [0, 0]; cuenta.set(s.tipo, [c[0] + 1, c[1] + largo]);
        if (s.tipo !== 'placa' && s.tipo !== 'losa') metros += largo;
      });
      res.superficies.forEach(f => {
        const ej = ejesSuperficie(f);
        if (!ej) return;
        const forma = new THREE.Shape(ej.pts2d.map(([u, v]) => new THREE.Vector2(u, v)));
        const geo = new THREE.ShapeGeometry(forma);
        const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: .45, side: THREE.DoubleSide, roughness: .7 }));
        m.matrixAutoUpdate = false;
        m.matrix.makeBasis(new THREE.Vector3(...ej.x), new THREE.Vector3(...ej.y), new THREE.Vector3(...ej.z));
        m.matrix.setPosition(ej.o[0] + ej.z[0] * 0.03, ej.o[1] + ej.z[1] * 0.03, ej.o[2] + ej.z[2] * 0.03);
        grupo.add(m);
      });
      grupo.updateMatrixWorld(true);   // las piezas usan matriz propia: sin esto la caja (y la cámara) sale mal
      const b = new THREE.Box3().setFromObject(grupo);
      const tam = b.getSize(new THREE.Vector3()), centro = b.getCenter(new THREE.Vector3());
      const r = Math.max(tam.x, tam.y, tam.z, 0.5);
      const piso = new THREE.GridHelper(Math.ceil(r * 1.6), Math.ceil(r * 1.6), 0xb6c2d1, 0xd5dde7); piso.position.set(centro.x, b.min.y, centro.z); escena.add(piso);
      const cam = new THREE.PerspectiveCamera(40, 1, 0.01, r * 50);
      cam.position.set(centro.x + r * 1.1, centro.y + r * 0.7, centro.z + r * 1.3);
      renderer = crearRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      el.appendChild(renderer.domElement);
      controls = new OrbitControls(cam, renderer.domElement);
      controls.target.copy(centro); controls.enableDamping = true;
      controls.addEventListener('start', () => { giro.current = false; });
      ajustar = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h || !renderer) return; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      ajustar(); obs.observe(el);
      const ciclo = () => {
        raf = requestAnimationFrame(ciclo);
        if (giro.current) { const v = cam.position.clone().sub(centro); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.004); cam.position.copy(centro).add(v); }
        controls!.update(); renderer!.render(escena, cam);
      };
      ciclo();
      const f = (n: number) => (Math.round(n * 100) / 100).toLocaleString('es-PE');
      setFicha({
        medidas: `${f(tam.x)} × ${f(tam.z)} m · alto ${f(tam.y)} m`,
        grupos: [...cuenta.entries()].map(([t, [n, m]]) => [NOMBRE[t] || t, n, m] as [string, number, number]).sort((p, q) => q[1] - p[1]),
        total: res.solidos.length, metros,
      });
      setEstado('listo');
    }).catch(() => vivo && setEstado('sin3d'));
    return () => {
      vivo = false; cancelAnimationFrame(raf); obs.disconnect();
      try { controls?.dispose(); } catch { /* nada */ }
      if (renderer) { renderer.domElement.remove(); liberarRenderer(renderer); }
    };
  }, [item]);

  const detalles = item.detalles || [];
  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/70 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-5xl h-[92vh] sm:h-[80vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Box className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">{item.titulo}</h3>
            <p className="text-[11px] text-slate-500">Vista 3D · solo para mirar{item.plantilla ? ` · se abre en ${MODULO[item.plantilla.modulo]}` : ''}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          <div className="relative flex-1 min-h-[45vh] md:min-h-0 bg-slate-100">
            <div ref={caja} className="absolute inset-0" />
            {estado === 'cargando' && <p className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-500">Preparando la vista 3D…</p>}
            {estado === 'sin3d' && <p className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-500 px-6 text-center">Esta plantilla no tiene vista 3D (por ejemplo, las de Drywall son partidas de cotización).</p>}
            {estado === 'listo' && <p className="absolute bottom-2 left-2 text-[11px] font-bold text-slate-600 bg-white/90 rounded-lg px-2 py-1 flex items-center gap-1"><RotateCw className="w-3.5 h-3.5" />Arrastra para girar · pellizca o rueda para acercar</p>}
          </div>
          <aside className="md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 p-4 overflow-y-auto space-y-3 text-sm">
            {ficha && <>
              <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />Medidas</p><p className="font-bold text-slate-800">{ficha.medidas}</p></div>
              <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{ficha.total} piezas · {Math.round(ficha.metros)} m de tubo</p>
                <div className="mt-1 divide-y divide-slate-100">{ficha.grupos.map(([n, c, m]) => (
                  <div key={n} className="flex justify-between gap-2 py-1.5 text-xs"><span className="text-slate-600">{n}</span><span className="font-bold text-slate-800 whitespace-nowrap">{c} · {Math.round(m)} m</span></div>
                ))}</div></div>
            </>}
            {detalles.length > 0 && (
              <div><p className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Detalles</p>
                <div className="mt-1 divide-y divide-slate-100">{detalles.map((d, i) => (
                  <div key={i} className="py-1.5 text-xs"><span className="text-slate-500">{d.etiqueta}</span><p className="font-bold text-slate-800">{d.valor}</p></div>
                ))}</div></div>
            )}
            {item.descripcion && <p className="text-xs text-slate-500 leading-relaxed">{item.descripcion}</p>}
            {bloqueada && <p className="text-xs font-bold text-amber-700 bg-amber-50 rounded-xl p-2.5 flex gap-1.5"><Lock className="w-4 h-4 shrink-0" />Para abrirla y cambiar sus medidas en tu programa, adquiérela.</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}
