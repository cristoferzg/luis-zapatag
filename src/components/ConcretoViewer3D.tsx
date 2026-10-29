// =============================================================================
// Visor 3D de la obra (estilo SketchUp): colores planos y claros, contornos
// finos y texturas simples. Dibuja:
//   - la estructura guardada en Techos Metálicos (perfiles con su sección real
//     y coberturas con su material),
//   - el concreto del plano (zapatas, columnas, vigas, cimientos, losas),
//   - los muros de ladrillo / drywall / OSB de cada piso, a su altura, con
//     puertas y ventanas recortadas y, si van "hasta el techo", su pendiente,
//   - el piso de cada ambiente, el cielo raso y los tanques elevados.
// Órbita: arrastrar para girar, rueda o pellizco para acercar.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import { Video, Square as StopIcon } from 'lucide-react';
import * as THREE from 'three';
import type { PlanoElem } from './ConcretoPlanoCad';
import { EstructuraTechos, contextosObra } from './concreto/obraPisos';
import { CieloRaso, perfilMuro, largoMuro, esPuerta, esVidrio, detectarAmbientes, regionesCielo, mallaCielo, mallaCieloTanque, tanquesEnEstructura, MallaCielo, esNodoTanque,
  CapaEstructura, capaDeRol, CAPAS, Sobrepecho } from './concreto/geometriaObra';
import type { PerfilTubularItem } from './techos/techosCadEngineTypes';
import { coberturaDesdeCorreas, panoUnaAgua } from './techos/coberturaAuto';
import { INVENTARIO_COBERTURAS } from './techos/techosCadCatalog';
import { grabarCanvas, puedeGrabar } from '../lib/grabarVideo';
import { perfilTechos } from './techos/tensores';
import { Bloque, muebleDe, geometriaCarpi, GeomCarpi } from './concreto/bloques';
import { leerDisenosCarpi } from './concreto/carpiObra';
import { tipoLadrillo, texturaLadrillo, texturaOsb, texturaDrywall } from './concreto/texturasObra';
import { escalera } from './concreto/extrasObra';

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
    case 'fibrocemento_eternit': return ondulada(0xd9d6cf);
    default: return ondulada(0xb9c3cc); // Aluzinc TR-4 / TR-5
  }
}

// Sección real del perfil (en metros) como forma 2D: x = ancho, y = alto.
function seccionPerfil(p: PerfilTubularItem): THREE.Shape | null {
  const b = p.anchoMm / 1000, h = (p.altoMm || p.anchoMm) / 1000, e = Math.max(0.0015, (p.espesorMm || 2) / 1000);
  const rect = (w: number, hh: number) => { const s = new THREE.Shape(); s.moveTo(-w / 2, -hh / 2); s.lineTo(w / 2, -hh / 2); s.lineTo(w / 2, hh / 2); s.lineTo(-w / 2, hh / 2); s.closePath(); return s; };
  const poli = (pts: [number, number][]) => { const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(q => s.lineTo(q[0], q[1])); s.closePath(); return s; };
  switch (p.categoria) {
    case 'tubo_cuadrado': case 'tubo_rectangular': {
      const s = rect(b, h);
      if (b - 2 * e > 0.004 && h - 2 * e > 0.004) { const hole = new THREE.Path(); hole.moveTo(-b / 2 + e, -h / 2 + e); hole.lineTo(-b / 2 + e, h / 2 - e); hole.lineTo(b / 2 - e, h / 2 - e); hole.lineTo(b / 2 - e, -h / 2 + e); hole.closePath(); s.holes.push(hole); }
      return s;
    }
    case 'perfil_c': { // canal con labios
      const l = Math.min(b * 0.35, 0.02), t = Math.max(e, 0.002);
      return poli([[-b / 2, -h / 2], [b / 2, -h / 2], [b / 2, -h / 2 + l], [b / 2 - t, -h / 2 + l], [b / 2 - t, -h / 2 + t], [-b / 2 + t, -h / 2 + t], [-b / 2 + t, h / 2 - t], [b / 2 - t, h / 2 - t], [b / 2 - t, h / 2 - l], [b / 2, h / 2 - l], [b / 2, h / 2], [-b / 2, h / 2]]);
    }
    case 'perfil_z': {
      const t = Math.max(e, 0.002);
      return poli([[-b, -h / 2], [t / 2, -h / 2], [t / 2, h / 2 - t], [b, h / 2 - t], [b, h / 2], [-t / 2, h / 2], [-t / 2, -h / 2 + t], [-b, -h / 2 + t]].map(([x, y]) => [x / 2, y] as [number, number]));
    }
    case 'perfil_h_ipe': {
      const tf = Math.max(e * 1.4, h * 0.07), tw = Math.max(e, h * 0.045);
      return poli([[-b / 2, -h / 2], [b / 2, -h / 2], [b / 2, -h / 2 + tf], [tw / 2, -h / 2 + tf], [tw / 2, h / 2 - tf], [b / 2, h / 2 - tf], [b / 2, h / 2], [-b / 2, h / 2], [-b / 2, h / 2 - tf], [-tw / 2, h / 2 - tf], [-tw / 2, -h / 2 + tf], [-b / 2, -h / 2 + tf]]);
    }
    case 'angulo_estructural': {
      const t = Math.max(e, 0.003);
      return poli([[-b / 2, -h / 2], [b / 2, -h / 2], [b / 2, -h / 2 + t], [-b / 2 + t, -h / 2 + t], [-b / 2 + t, h / 2], [-b / 2, h / 2]]);
    }
    case 'tubo_redondo': case 'barra_redonda': return null;
    default: return rect(b, h);
  }
}

// Textura de piso según el acabado (las coordenadas del piso están en metros).
const cacheTexPiso = new Map<string, THREE.CanvasTexture>();
function texturaPiso(tipo: string): THREE.CanvasTexture | null {
  if (cacheTexPiso.has(tipo)) return cacheTexPiso.get(tipo)!;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); if (!g) return null;
  let metros = 0.6; // tamaño que cubre la textura
  if (tipo === 'ceramico' || tipo === 'porcelanato') {
    g.fillStyle = tipo === 'ceramico' ? '#e9dcc4' : '#e5e7eb'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = tipo === 'ceramico' ? '#b9a786' : '#c3c7cf'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 125, 125);
    metros = tipo === 'ceramico' ? 0.45 : 0.6;
  } else if (tipo === 'laminado' || tipo === 'vinilico') {
    g.fillStyle = tipo === 'laminado' ? '#b98552' : '#c9a57e'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = tipo === 'laminado' ? '#8b5e34' : '#a7825b'; g.lineWidth = 2;
    for (let k = 0; k < 4; k++) { const y = k * 32 + 1; g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); const x = (k % 2) * 64 + 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); }
    metros = 1.2;
  } else {
    g.fillStyle = '#b8b8b4'; g.fillRect(0, 0, 128, 128);
    for (let k = 0; k < 300; k++) { g.fillStyle = `rgba(90,90,90,${Math.random() * 0.08})`; g.fillRect(Math.random() * 128, Math.random() * 128, 3, 3); }
    metros = 2;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / metros, 1 / metros);
  cacheTexPiso.set(tipo, t);
  return t;
}

const TONOS_AMBIENTE = [0xfdf0c4, 0xd9f2df, 0xd8ecf8, 0xf8dfea, 0xe6e0f7, 0xfde4cc];

interface Props {
  elems: PlanoElem[];
  niveles?: string[];
  estructura?: EstructuraTechos | null;
  cielos?: Record<string, CieloRaso>;
  verTecho?: boolean;   // false: oculta coberturas para ver el interior
  hastaPiso?: string;   // corta la obra por encima de este piso
  capasOcultas?: CapaEstructura[];
  sobrepechos?: Record<string, Sobrepecho>;
  resaltarPerfiles?: boolean; // dibuja las secciones ×3 para verlas mejor de lejos
  verCimentacion?: boolean;   // suelo transparente y vista desde abajo (zapatas, cimientos)
  claveCamara?: string;       // misma obra → se conserva la cámara al remontar
  bloques?: Bloque[];         // diseños de CarpiMetal sueltos y muebles a escala
  acabados?: Record<string, { piso: string; pintura: boolean; zocalo: boolean }>; // por `${piso}#${ambiente}`
  seleccion?: string[];       // elementos del plano resaltados (uid)
  onPick?: (uid: string | null, sumar: boolean) => void; // clic en un elemento (Ctrl: sumar al grupo)
}

// Cámara de la última vista (por obra), para no perderla al cambiar opciones.
const camaras = new Map<string, { az: number; pol: number; rad: number; obj: [number, number, number] }>();

export default function ConcretoViewer3D({ elems, niveles = ['Cimentación', 'Piso 1'], estructura = null, cielos = {}, verTecho = true, hastaPiso = '', capasOcultas = [], sobrepechos = {}, resaltarPerfiles = false, verCimentacion = false, claveCamara = '', bloques = [], seleccion = [], onPick, acabados = {} }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const girar = useRef(false); // giro lento automático mientras se graba
  const grabacion = useRef<{ detener: () => void } | null>(null);
  const [grabando, setGrabando] = useState(false);
  // Vista de corte: un plano vertical que recorta el modelo para ver por dentro.
  const [corte, setCorte] = useState(100); // % del ancho visible (100 = sin corte)
  const [ejeCorte, setEjeCorte] = useState<'x' | 'z'>('x');
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const limitesRef = useRef<THREE.Box3 | null>(null);
  const datos = useRef({ elems, niveles, estructura, cielos, verTecho, hastaPiso, capasOcultas, sobrepechos, resaltarPerfiles, bloques, onPick, acabados });
  datos.current = { elems, niveles, estructura, cielos, verTecho, hastaPiso, capasOcultas, sobrepechos, resaltarPerfiles, bloques, onPick, acabados };
  const modeloRef = useRef<THREE.Group | null>(null);
  const [verModelo, setVerModelo] = useState(0); // sube al (re)armar la escena

  // Resalta en 3D los elementos seleccionados (material propio con brillo ámbar).
  useEffect(() => {
    const modelo = modeloRef.current;
    if (!modelo) return;
    const sel = new Set(seleccion);
    modelo.traverse(o => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.userData.uid) return;
      if (sel.has(m.userData.uid)) {
        if (!m.userData.matOrig) {
          m.userData.matOrig = m.material;
          const cl = (Array.isArray(m.material) ? m.material[0] : m.material).clone() as THREE.MeshLambertMaterial;
          if ('emissive' in cl) { cl.emissive = new THREE.Color(0xf59e0b); cl.emissiveIntensity = 0.55; }
          m.material = cl;
        }
      } else if (m.userData.matOrig) {
        (m.material as THREE.Material).dispose();
        m.material = m.userData.matOrig; delete m.userData.matOrig;
      }
    });
  }, [seleccion.join('|'), verModelo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' });

    scene.add(new THREE.AmbientLight(0xffffff, 1.9));
    const sol = new THREE.DirectionalLight(0xffffff, 1.1); sol.position.set(9, 15, 6); scene.add(sol);
    const relleno = new THREE.DirectionalLight(0xffffff, 0.45); relleno.position.set(-8, 6, -6); scene.add(relleno);

    const modelo = new THREE.Group();
    scene.add(modelo);
    modeloRef.current = modelo;
    const bordes = new THREE.LineBasicMaterial({ color: C.borde, transparent: true, opacity: 0.85 });
    const bordesFinos = new THREE.LineBasicMaterial({ color: C.borde, transparent: true, opacity: 0.35 });
    const plano = (color: number) => new THREE.MeshLambertMaterial({ color });
    const M = { concreto: plano(C.concreto), zapata: plano(C.zapata), cimiento: plano(C.cimiento), losa: plano(C.losa), acero: plano(C.acero), drywall: plano(C.drywall) };

    const conBordes = (mesh: THREE.Mesh, fino = false, padre: THREE.Object3D = modelo) => {
      padre.add(mesh);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), fino ? bordesFinos : bordes);
      e.position.copy(mesh.position); e.quaternion.copy(mesh.quaternion);
      padre.add(e);
    };
    const M2 = {
      puerta: new THREE.MeshLambertMaterial({ color: 0xcaa47c }),
      vidrio: new THREE.MeshLambertMaterial({ color: 0xa9d8ee, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }),
      cielo: new THREE.MeshLambertMaterial({ color: 0xf6f6f2, side: THREE.DoubleSide, transparent: true, opacity: 0.92, polygonOffset: true, polygonOffsetFactor: 1 }),
      tanque: new THREE.MeshLambertMaterial({ color: 0x4f555c }),
      metal: new THREE.MeshLambertMaterial({ color: 0x3f4a56 }),
      plancha: new THREE.MeshLambertMaterial({ color: 0x475569, side: THREE.DoubleSide }),
    };
    // Diseño de CarpiMetal con sus piezas reales dentro de un grupo (coords del diseño).
    const disenosCarpi = new Map(leerDisenosCarpi().map(d => [d.id, d]));
    const cacheGeom = new Map<string, GeomCarpi | null>();
    const geomDe = (id: string) => { if (!cacheGeom.has(id)) { const d = disenosCarpi.get(id); cacheGeom.set(id, d ? geometriaCarpi(d) : null); } return cacheGeom.get(id) || null; };
    const carpi3d = (g: GeomCarpi, padre: THREE.Object3D) => {
      g.barras.forEach(b => {
        const a = new THREE.Vector3(...b.a), c = new THREE.Vector3(...b.b);
        const dir = new THREE.Vector3().subVectors(c, a), L = dir.length();
        if (L < 0.004) return;
        const m = new THREE.Mesh(new THREE.BoxGeometry(L, b.s2, b.s1), M2.metal);
        m.position.copy(a).addScaledVector(dir, 0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
        conBordes(m, true, padre);
      });
      g.paneles.forEach(p => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.003, p.w), Math.max(0.003, p.h), Math.max(0.003, p.d)), p.vidrio ? M2.vidrio : M2.plancha);
        m.position.set(p.x + p.w / 2, p.y + p.h / 2, p.z + p.d / 2);
        conBordes(m, true, padre);
      });
    };
    const superficie = (m: MallaCielo) => {
      if (!m.tris.length) return;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(m.tris, 3));
      g.computeVertexNormals();
      modelo.add(new THREE.Mesh(g, M2.cielo));
      m.contornos.forEach(c => { if (c.length >= 9) modelo.add(new THREE.LineLoop(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(c, 3)), bordes)); });
    };
    // Muro extruido: perfil superior (pendiente), puertas como muescas desde el
    // piso y ventanas como huecos. Coordenadas locales: x a lo largo, y arriba.
    const muro3d = (e: PlanoElem, base: number, material: THREE.Material, ctx: Parameters<typeof perfilMuro>[1]) => {
      const L = largoMuro(e), esp = Math.max(0.05, e.a);
      const pf = perfilMuro(e, ctx);
      const hEn = (t: number) => { for (let i = 1; i < pf.length; i++) if (t <= pf[i].t + 1e-6) { const a = pf[i - 1], b = pf[i]; return a.h + (b.h - a.h) * ((t - a.t) / Math.max(1e-6, b.t - a.t)); } return pf[pf.length - 1].h; };
      const abs = [...(e.aberturas || [])].sort((a, b) => a.t - b.t);
      const forma = new THREE.Shape();
      forma.moveTo(0, 0);
      let cursor = 0;
      const grupo = new THREE.Group();
      grupo.position.set(e.x1, base, e.y1);
      grupo.rotation.y = -Math.atan2(e.y2! - e.y1, e.x2! - e.x1);
      modelo.add(grupo);
      abs.forEach(a => {
        const i = Math.max(cursor + 0.02, a.t - a.w / 2), d = Math.min(L - 0.02, a.t + a.w / 2);
        if (d - i < 0.1) return;
        const techo = Math.min(hEn(i), hEn(d), hEn(a.t)) - 0.05;
        const pie = a.sill < 0.01 ? 0 : Math.min(a.sill, techo - 0.2);
        const top = Math.max(pie + 0.15, Math.min(pie + a.h, techo));
        if (pie === 0) { forma.lineTo(i, 0); forma.lineTo(i, top); forma.lineTo(d, top); forma.lineTo(d, 0); cursor = d; }
        else {
          const h = new THREE.Path(); h.moveTo(i, pie); h.lineTo(d, pie); h.lineTo(d, top); h.lineTo(i, top); h.lineTo(i, pie);
          forma.holes.push(h);
        }
        // Diseño de CarpiMetal en el vano: sus piezas reales, ajustadas al vano.
        const gv = a.carpiId ? geomDe(a.carpiId) : null;
        if (gv) {
          const gr = new THREE.Group();
          gr.position.set(i, pie, -gv.fondo / 2);
          gr.scale.set((d - i) / gv.ancho, (top - pie) / gv.alto, 1);
          grupo.add(gr);
          carpi3d(gv, gr);
          return;
        }
        // Hoja de puerta entreabierta / vidrio
        const matHoja = a.carpiId ? M2.metal : M2.puerta; // diseño de CarpiMetal: hoja metálica
        if (esPuerta(a.tipo)) {
          // Corrediza: dos hojas cerradas, una delante de la otra. Doble / portón: dos hojas abiertas.
          const corre = a.tipo === 'puerta_corrediza';
          const hojas = corre ? [[i, (d - i) * 0.55, 0, 0.02], [d - (d - i) * 0.55, (d - i) * 0.55, 0, -0.04]]
            : a.tipo === 'puerta_doble' || a.tipo === 'porton' ? [[i, (d - i) / 2, -0.55, 0], [d, -(d - i) / 2, 0.55, 0]] : [[i, d - i, -0.55, 0]];
          hojas.forEach(([x0, ancho, giro, dz]) => {
            const piv = new THREE.Group(); piv.position.set(x0, 0, (corre ? 0 : esp / 2) + dz); piv.rotation.y = giro; grupo.add(piv);
            const hoja = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(ancho), top - 0.01, 0.04), matHoja);
            hoja.position.set(ancho / 2, (top - 0.01) / 2, 0.02);
            conBordes(hoja, false, piv);
          });
        } else if (esVidrio(a.tipo)) {
          const v = new THREE.Mesh(new THREE.BoxGeometry(d - i, top - pie, 0.02), M2.vidrio);
          v.position.set((i + d) / 2, (pie + top) / 2, 0);
          conBordes(v, true, grupo);
          // Reja / ventana de CarpiMetal: marco y barrotes metálicos.
          if (a.carpiId) {
            const n = Math.max(2, Math.round((d - i) / 0.12));
            for (let k = 1; k < n; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, top - pie, 0.02), M2.metal); b.position.set(i + ((d - i) * k) / n, (pie + top) / 2, 0.03); grupo.add(b); }
            [[ (i + d) / 2, pie, d - i, 0.04 ], [ (i + d) / 2, top, d - i, 0.04 ]].forEach(([x, y, w, h]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04), M2.metal); r.position.set(x, y, 0.03); grupo.add(r); });
          }
        }
      });
      forma.lineTo(L, 0);
      for (let k = pf.length - 1; k >= 0; k--) forma.lineTo(pf[k].t, pf[k].h);
      const g = new THREE.ExtrudeGeometry(forma, { depth: esp, bevelEnabled: false });
      g.translate(0, 0, -esp / 2);
      conBordes(new THREE.Mesh(g, material), false, grupo);
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

    // Perfil metálico con su sección real (tubo hueco, redondo, C, Z, I, ángulo)
    // orientado con su alto en el plano vertical del elemento.
    const matsCapa = new Map<CapaEstructura, THREE.Material>();
    const matAcero = (c: CapaEstructura) => { let m = matsCapa.get(c); if (!m) { m = new THREE.MeshLambertMaterial({ color: CAPAS[c].hex }); matsCapa.set(c, m); } return m; };
    const cacheSeccion = new Map<string, THREE.Shape | null>();
    const perfil3d = (a: THREE.Vector3, b: THREE.Vector3, p: PerfilTubularItem | undefined, mat: THREE.Material, giroGrados?: number) => {
      const dir = new THREE.Vector3().subVectors(b, a); const L = dir.length();
      if (L < 0.005) return;
      const z = dir.clone().normalize();
      const arriba = new THREE.Vector3(0, 1, 0);
      let x = new THREE.Vector3().crossVectors(arriba, z);
      if (x.lengthSq() < 1e-6) x = new THREE.Vector3(1, 0, 0); else x.normalize();
      const y = new THREE.Vector3().crossVectors(z, x).normalize();
      let geo: THREE.BufferGeometry;
      if (!p) geo = new THREE.BoxGeometry(0.05, 0.05, L).translate(0, 0, L / 2);
      else {
        if (!cacheSeccion.has(p.id)) cacheSeccion.set(p.id, seccionPerfil(p));
        const sec = cacheSeccion.get(p.id);
        geo = sec ? new THREE.ExtrudeGeometry(sec, { depth: L, bevelEnabled: false, curveSegments: 4 })
          : new THREE.CylinderGeometry(p.anchoMm / 2000, p.anchoMm / 2000, L, 14).rotateX(Math.PI / 2).translate(0, 0, L / 2);
      }
      if (giroGrados) geo.rotateZ((giroGrados * Math.PI) / 180);
      if (datos.current.resaltarPerfiles) geo.scale(3, 3, 1);
      const m = new THREE.Mesh(geo, mat);
      m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
      m.position.copy(a);
      conBordes(m, true);
    };

    const construir = () => {
      const { elems: todos, niveles: nivs, estructura: est, cielos: cls, verTecho: conTecho, hastaPiso: corte, capasOcultas: ocultas, sobrepechos: sps } = datos.current;
      const obra = contextosObra(nivs, est || null);
      // Corte por piso: se dibuja hasta el piso elegido (sin lo que está encima).
      const kCorte = corte ? obra.pisos.indexOf(corte) : -1;
      const pisoVisible = (n?: string) => kCorte < 0 || obra.pisos.indexOf(n || obra.pisos[0]) <= kCorte;
      const yCorte = kCorte >= 0 && obra.pisos[kCorte + 1] ? obra.ctx(obra.pisos[kCorte + 1]).base : Infinity;
      const list = todos.filter(e => (e.tipo !== 'muro' && e.tipo !== 'placa') || pisoVisible(e.nivel));

      // ---- Estructura de Techos ----
      if (est) {
        const N = est.nodes || {};
        Object.values(est.segments || {}).forEach(sg => {
          const na = N[sg.nodeAId], nb = N[sg.nodeBId];
          if (!na || !nb) return;
          if (Math.min(na.y, nb.y) > yCorte - 0.06 && !(Math.abs(na.y - nb.y) < 0.01 && Math.abs(na.y - yCorte) < 0.06)) return;
          const deSobretecho = /^TQS/.test(na.nodeLabel || '') && /^TQS/.test(nb.nodeLabel || '');
          if (!conTecho && deSobretecho) return; // "Ocultar techo" quita las planchas; las correas se siguen viendo
          const capa = capaDeRol(sg.rolEstructural);
          if (ocultas.includes(capa)) return;
          const p = perfilTechos(sg.profileId) as PerfilTubularItem | undefined;
          const ancho = Math.max(0.03, (p?.anchoMm || 50) / 1000), alto = Math.max(0.03, (p?.altoMm || 50) / 1000);
          const a = new THREE.Vector3(na.x, na.y, na.z), b = new THREE.Vector3(nb.x, nb.y, nb.z);
          if (sg.rolEstructural === 'columna_concreto') { barra(a, b, Math.max(0.25, ancho), Math.max(0.25, alto), M.concreto); return; }
          const hc = sg.concretoBaseM || 0;
          const acero = matAcero(capa);
          if (hc > 0 && sg.rolEstructural.startsWith('columna')) {
            const bajo = a.y <= b.y ? a : b, altoP = a.y <= b.y ? b : a;
            const corte = bajo.clone().add(new THREE.Vector3().subVectors(altoP, bajo).setLength(Math.min(hc, bajo.distanceTo(altoP))));
            barra(bajo, corte, Math.max(0.25, ancho + 0.1), Math.max(0.25, alto + 0.1), M.concreto);
            perfil3d(corte, altoP, p, acero, sg.anguloRotacionGrados);
            return;
          }
          perfil3d(a, b, p, acero, sg.anguloRotacionGrados);
        });
        // Coberturas guardadas; si el diseño no tiene, se deducen de las correas.
        const zonas: { ids: string[]; mat: string; pts?: { x: number; y: number; z: number }[] }[] = Object.values(est.coverageZones || {}).map(z => ({ ids: z.nodeIdsBoundary || [], mat: z.coberturaMaterialId }));
        // Techo de una agua (un solo plano): un solo paño apoyado encima de vigas y correas,
        // aunque el diseño tenga sus coberturas en franjas entre correas.
        const pl = panoUnaAgua(N, est.segments || {});
        const propias = zonas.filter(z => !z.ids.some(id => esNodoTanque(N[id])));
        if (pl) {
          const mat = propias[0]?.mat || 'cob_aluzinc_030';
          zonas.splice(0, zonas.length, ...zonas.filter(z => !propias.includes(z)), { ids: [], pts: pl.pts, mat });
        } else if (!propias.length) coberturaDesdeCorreas(N, est.segments || {}).forEach(p => zonas.push({ ids: p.ids, mat: 'cob_aluzinc_030' }));
        zonas.forEach(z => {
          const nodos = z.pts || z.ids.map(id => N[id]).filter(Boolean);
          if (!conTecho || nodos.some(n => (n?.y ?? 0) > yCorte + 0.06)) return;
          const pts = nodos.map(n => new THREE.Vector3(n.x, n.y + 0.06, n.z));
          if (pts.length < 3) return;
          const pos: number[] = [], uv: number[] = [];
          for (let i = 1; i < pts.length - 1; i++) [pts[0], pts[i], pts[i + 1]].forEach(v => { pos.push(v.x, v.y, v.z); uv.push(v.x / 1.1, v.z / 1.1); });
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
          g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
          g.computeVertexNormals();
          const m = new THREE.Mesh(g, materialCobertura(z.mat));
          modelo.add(m);
          const contorno = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), bordes);
          modelo.add(contorno);
        });
      }

      // ---- Concreto y muros del plano ----
      const colHs = list.filter(e => e.tipo === 'columna').map(e => e.H || 3);
      const vigaElev = colHs.length ? Math.max(...colHs) : 3;
      list.forEach(e => {
        const nAntes = modelo.children.length;
        (() => {
        const a = e.a, b = e.b || e.a, h = e.h || 0.5, H = e.H || 3;
        if (e.tipo === 'columna') caja(a, H, b, e.x1, H / 2, e.y1, M.concreto);
        else if (e.tipo === 'zapata') caja(a, h, b, e.x1, h / 2 - h, e.y1, M.zapata);
        else if (e.tipo === 'losa' && e.x2 !== undefined && e.y2 !== undefined) {
          // Losa / entrepiso: techo del piso elegido (= piso del de arriba).
          const esOsb = e.losaMaterial === 'osb', esp = e.h || (esOsb ? 0.018 : 0.2);
          const ctx = obra.ctx(e.nivel);
          const tope = e.nivel ? (ctx.tope ?? ctx.base + 3) : vigaElev + esp;
          let mat: THREE.Material = M.losa;
          if (esOsb) { const t = texturaOsb(false, Math.abs(e.x2 - e.x1), Math.abs(e.y2 - e.y1)); mat = new THREE.MeshLambertMaterial({ map: t }); }
          if (pisoVisible(e.nivel) || !e.nivel) caja(Math.abs(e.x2 - e.x1), Math.max(esp, 0.03), Math.abs(e.y2 - e.y1), (e.x1 + e.x2) / 2, tope - esp / 2, (e.y1 + e.y2) / 2, mat);
        } else if (e.x2 !== undefined && e.y2 !== undefined) {
          const dx = e.x2 - e.x1, dz = e.y2 - e.y1, L = Math.hypot(dx, dz);
          const cx = (e.x1 + e.x2) / 2, cz = (e.y1 + e.y2) / 2, rotY = -Math.atan2(dz, dx);
          if (e.tipo === 'muro') {
            const ctx = obra.ctx(e.nivel), mat = e.material || 'ladrillo';
            let material: THREE.Material = new THREE.MeshLambertMaterial({ map: texturaDrywall() });
            if (mat === 'ladrillo') material = new THREE.MeshLambertMaterial({ map: texturaLadrillo(tipoLadrillo(e.materialId)) });
            if (mat === 'osb') material = new THREE.MeshLambertMaterial({ map: texturaOsb() });
            if (L > 0.02) muro3d(e, ctx.base, material, ctx);
          } else if (e.tipo === 'escalera') {
            // Escalera de concreto: un bloque por paso, del piso a su altura.
            const r = escalera(L, e.H || 2.6, e.a || 1);
            const base = obra.ctx(e.nivel).base;
            const ux = dx / L, uz = dz / L;
            for (let i = 0; i < r.n; i++) {
              const t = r.paso * (i + 0.5), hh = r.cp * (i + 1);
              caja(r.paso, hh, e.a || 1, e.x1 + ux * t, base + hh / 2, e.y1 + uz * t, M.concreto, rotY);
            }
          } else if (e.tipo === 'placa') {
            // Placa de concreto: muro de concreto armado desde el piso de su nivel.
            const altoP = e.H || 2.6;
            caja(L, altoP, a, cx, obra.ctx(e.nivel).base + altoP / 2, cz, M.concreto, rotY);
          } else if (e.tipo === 'viga') caja(L, h, a, cx, vigaElev - h / 2, cz, M.concreto, rotY);
          else caja(L, h, a, cx, -h / 2, cz, M.cimiento, rotY);
        }
        })();
        // Cada pieza lleva el uid de su elemento: clic en 3D lo selecciona.
        modelo.children.slice(nAntes).forEach(o => o.traverse(c => { c.userData.uid = e.uid; }));
      });

      // ---- Bloques a escala (CarpiMetal suelto y muebles) ----
      (datos.current.bloques || []).forEach(b => {
        const nivel = b.nivel || obra.pisos[0];
        if (!pisoVisible(nivel)) return;
        const g = new THREE.Group();
        g.position.set(b.x, obra.ctx(nivel).base + 0.02, b.y);
        g.rotation.y = -(b.rot * Math.PI) / 180;
        modelo.add(g);
        const interior = new THREE.Group();
        interior.position.set(-b.ancho / 2, 0, -b.fondo / 2);
        if (b.espejo) { interior.scale.x = -1; interior.position.x = b.ancho / 2; }
        g.add(interior);
        if (b.origen === 'carpi') { const gc = geomDe(b.refId); if (gc) carpi3d(gc, interior); return; }
        const m = muebleDe(b.refId);
        m?.cajas.forEach(c => {
          const mat = new THREE.MeshLambertMaterial({ color: c.color });
          const geo = c.cil ? new THREE.CylinderGeometry(0.5, 0.5, c.h, 20).scale(c.w, 1, c.d) : new THREE.BoxGeometry(c.w, c.h, c.d);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(c.u + c.w / 2, c.y + c.h / 2, c.v + c.d / 2);
          conBordes(mesh, true, interior);
        });
      });

      // ---- Acabados de muros de un ambiente: pintura (cara interior) y zócalo, sin tapar puertas ni ventanas ----
      const matPintura = new THREE.MeshLambertMaterial({ color: 0xf3eee4, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
      const matZocalo = new THREE.MeshLambertMaterial({ color: 0x8b7d6b, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3 });
      const acabadoMuros = (poly: { x: number; y: number }[], muros: PlanoElem[], base: number, pintura: boolean, zocalo: boolean) => {
        let area2 = 0; poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; area2 += p.x * q.y - q.x * p.y; });
        const sentido = area2 > 0 ? 1 : -1;
        poly.forEach((p, i) => {
          const q = poly[(i + 1) % poly.length];
          const L = Math.hypot(q.x - p.x, q.y - p.y); if (L < 0.05) return;
          const ux = (q.x - p.x) / L, uy = (q.y - p.y) / L;
          // Normal hacia adentro del ambiente (según el sentido del polígono).
          const nx = -uy * sentido, ny = ux * sentido;
          // Muro sobre el que está este borde: su espesor, alto y vanos.
          const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
          const muro = muros.find(w => { const wl = Math.hypot(w.x2! - w.x1, w.y2! - w.y1) || 1; const d = Math.abs(-(mx - w.x1) * (w.y2! - w.y1) / wl + (my - w.y1) * (w.x2! - w.x1) / wl); return d < 0.05; });
          const esp = muro ? muro.a : 0.15, alto = muro?.H || 2.6;
          const wl = muro ? Math.hypot(muro.x2! - muro.x1, muro.y2! - muro.y1) || 1 : 1;
          const tMuro = (x: number, y: number) => muro ? ((x - muro.x1) * (muro.x2! - muro.x1) + (y - muro.y1) * (muro.y2! - muro.y1)) / wl : 0;
          const t0 = tMuro(p.x, p.y), dirT = tMuro(q.x, q.y) >= t0 ? 1 : -1;
          const vanos = (muro?.aberturas || []).map(ab => { const u = (ab.t - t0) * dirT; return { u0: u - ab.w / 2, u1: u + ab.w / 2, v0: ab.sill, v1: ab.sill + ab.h }; }).filter(v => v.u1 > 0 && v.u0 < L);
          const lamina = (h: number, off: number, mat: THREE.Material, conVanos: boolean) => {
            const sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(L, 0), new THREE.Vector2(L, h), new THREE.Vector2(0, h)]);
            if (conVanos) vanos.forEach(v => {
              const u0 = Math.max(0.01, v.u0), u1 = Math.min(L - 0.01, v.u1), v0 = Math.max(0.01, v.v0), v1 = Math.min(h - 0.01, v.v1);
              if (u1 - u0 > 0.05 && v1 - v0 > 0.05) sh.holes.push(new THREE.Path([new THREE.Vector2(u0, v0), new THREE.Vector2(u1, v0), new THREE.Vector2(u1, v1), new THREE.Vector2(u0, v1)]));
            });
            const mesh = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat);
            const X = new THREE.Vector3(ux, 0, uy), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3().crossVectors(X, Y);
            mesh.matrixAutoUpdate = false;
            mesh.matrix.makeBasis(X, Y, Z).setPosition(p.x + nx * (esp / 2 + off), base, p.y + ny * (esp / 2 + off));
            modelo.add(mesh);
          };
          if (pintura) lamina(alto, 0.004, matPintura, true);
          if (zocalo) lamina(0.10, 0.008, matZocalo, true);
        });
      };

      // ---- Ambientes (piso coloreado) y cielo raso por piso ----
      obra.pisos.forEach(n => {
        if (!pisoVisible(n)) return;
        const ctx = obra.ctx(n);
        const muros = list.filter(e => e.tipo === 'muro' && (e.nivel || obra.pisos[0]) === n && e.x2 !== undefined && e.y2 !== undefined);
        detectarAmbientes(muros).forEach((a, i) => {
          const ac = (datos.current.acabados || {})[`${n}#${a.key}`];
          const f = new THREE.Shape(a.poly.map(p => new THREE.Vector2(p.x, p.y)));
          // Piso: con acabado, su textura (cerámico, porcelanato, laminado…); si no, el tono del ambiente.
          const tex = ac?.piso && ac.piso !== 'ninguno' ? texturaPiso(ac.piso) : null;
          const matPiso = tex ? new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 })
            : new THREE.MeshLambertMaterial({ color: TONOS_AMBIENTE[i % TONOS_AMBIENTE.length], side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
          const m = new THREE.Mesh(new THREE.ShapeGeometry(f), matPiso);
          m.rotation.x = Math.PI / 2; m.position.y = ctx.base + (tex ? 0.02 : 0.015);
          modelo.add(m);
          if (ac?.pintura || ac?.zocalo) acabadoMuros(a.poly, muros, ctx.base, !!ac.pintura, !!ac.zocalo);
        });
        const cfg = cls[n];
        if (cfg?.activo) superficie(mallaCielo(regionesCielo(muros, est || null, ctx.base), cfg, ctx));
      });

      // ---- Tanques elevados (Rotoplas) y su cielo raso ----
      tanquesEnEstructura(est || null).filter(t => t.y < yCorte).forEach(t => {
        const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(t.diametro / 2, t.diametro / 2 * 0.96, t.alto, 28), M2.tanque);
        cuerpo.position.set(t.x, t.y + t.alto / 2 + 0.03, t.z);
        modelo.add(cuerpo);
        const contorno = new THREE.LineSegments(new THREE.EdgesGeometry(cuerpo.geometry, 30), bordes);
        contorno.position.copy(cuerpo.position); modelo.add(contorno);
        const tapa = new THREE.Mesh(new THREE.CylinderGeometry(t.diametro * 0.22, t.diametro * 0.22, 0.08, 20), M2.tanque);
        tapa.position.set(t.x, t.y + t.alto + 0.07, t.z); conBordes(tapa, true);
        if (cls[`tanque:${t.id}`]?.activo && t.ySobretecho !== null) superficie(mallaCieloTanque(t));
        // Sobrepecho: murete de ladrillo alrededor de la plataforma.
        const sp = sps[t.id];
        if (sp?.activo) {
          const l = t.lado + 2 * sp.holgura, e = 0.13;
          const tex = texturaLadrillo('kingkong', false, l, sp.alto);
          const mat = new THREE.MeshLambertMaterial({ map: tex });
          [[0, -l / 2, 0], [0, l / 2, 0], [-l / 2, 0, Math.PI / 2], [l / 2, 0, Math.PI / 2]].forEach(([dx, dz, rot]) =>
            caja(l + e, sp.alto, e, t.x + dx, t.y + sp.alto / 2, t.z + dz, mat, rot));
        }
        // Etiqueta T1, T2… sobre el tanque.
        const c = document.createElement('canvas'); c.width = 128; c.height = 64;
        const g = c.getContext('2d')!;
        g.fillStyle = 'rgba(15,23,42,.88)'; g.beginPath(); if (g.roundRect) g.roundRect(4, 8, 120, 48, 14); else g.rect(4, 8, 120, 48); g.fill();
        g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`T${t.numero}`, 64, 33);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
        sprite.scale.set(0.9, 0.45, 1); sprite.position.set(t.x, (t.ySobretecho ?? t.y + t.alto) + 0.7, t.z);
        modelo.add(sprite);
      });
    };

    construir();

    // Suelo y rejilla (mismo lenguaje que Techos)
    const box = new THREE.Box3().setFromObject(modelo);
    limitesRef.current = box.clone();
    const centro = box.isEmpty() ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
    const tam = box.isEmpty() ? new THREE.Vector3(10, 3, 10) : box.getSize(new THREE.Vector3());
    const ext = Math.max(20, Math.ceil(Math.max(tam.x, tam.z) * 2.5));
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ext, ext), verCimentacion
      ? new THREE.MeshLambertMaterial({ color: C.suelo, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
      : plano(C.suelo));
    suelo.rotation.x = -Math.PI / 2; suelo.position.set(centro.x, -0.012, centro.z); scene.add(suelo);
    const rejilla = new THREE.GridHelper(ext, ext, 0xd5dbe3, 0xe8ecf1); rejilla.position.set(centro.x, -0.005, centro.z); scene.add(rejilla);

    // Órbita como en Techos: arrastrar = girar; clic derecho, botón central,
    // Shift + arrastre o dos dedos = mover el modelo; rueda o pellizco = zoom.
    const guardada = claveCamara ? camaras.get(claveCamara) : undefined;
    let az = guardada?.az ?? -0.72, pol = guardada?.pol ?? 0.98, rad = guardada?.rad ?? Math.max(8, Math.max(tam.x, tam.z, tam.y) * 2.1);
    // Pantalla vertical (celular): alejar la cámara para que entre todo a lo ancho.
    const aspecto = mount.clientWidth / Math.max(1, mount.clientHeight);
    if (!guardada && aspecto < 1) rad = rad / Math.max(0.5, aspecto);
    const objetivo = guardada ? new THREE.Vector3(...guardada.obj) : new THREE.Vector3(centro.x, Math.max(1, tam.y * 0.4), centro.z);
    const polMax = verCimentacion ? Math.PI - 0.25 : Math.PI / 2 - 0.03; // con cimentación se puede mirar desde abajo
    const actualizar = () => {
      pol = Math.max(0.15, Math.min(polMax, pol));
      camera.position.set(objetivo.x + rad * Math.sin(pol) * Math.cos(az), objetivo.y + rad * Math.cos(pol), objetivo.z + rad * Math.sin(pol) * Math.sin(az));
      camera.lookAt(objetivo);
      if (claveCamara) camaras.set(claveCamara, { az, pol, rad, obj: [objetivo.x, objetivo.y, objetivo.z] });
    };
    actualizar();
    // Desplaza el objetivo en el plano de la pantalla (px → metros según la distancia).
    const mover = (dx: number, dy: number) => {
      const k = (2 * rad * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(1, mount.clientHeight);
      const der = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0), arr = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
      objetivo.addScaledVector(der, -dx * k).addScaledVector(arr, dy * k);
    };

    const punteros = new Map<number, { x: number; y: number }>();
    let distPinza = 0, centroPinza: { x: number; y: number } | null = null, moviendo = false;
    let inicioClic: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      inicioClic = punteros.size === 0 && e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      renderer.domElement.setPointerCapture(e.pointerId);
      moviendo = e.button === 1 || e.button === 2 || e.shiftKey;
      renderer.domElement.style.cursor = moviendo ? 'move' : 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      const prev = punteros.get(e.pointerId);
      if (!prev) return;
      punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (punteros.size === 2) {
        const [p1, p2] = [...punteros.values()];
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const c = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        if (distPinza) rad = Math.max(2, Math.min(150, rad * distPinza / d));
        if (centroPinza) mover(c.x - centroPinza.x, c.y - centroPinza.y);
        distPinza = d; centroPinza = c;
      } else if (moviendo) mover(e.clientX - prev.x, e.clientY - prev.y);
      else {
        az += (e.clientX - prev.x) * 0.008;
        pol -= (e.clientY - prev.y) * 0.008;
      }
      actualizar();
    };
    // Clic sin arrastrar: selecciona el elemento del plano que está debajo.
    const rayo = new THREE.Raycaster();
    const elegir = (e: PointerEvent) => {
      const pick = datos.current.onPick;
      if (!pick) return;
      const r = renderer.domElement.getBoundingClientRect();
      rayo.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = rayo.intersectObject(modelo, true).find(h => (h.object as THREE.Mesh).isMesh && h.object.userData.uid);
      pick(hit?.object.userData.uid ?? null, e.ctrlKey || e.metaKey);
    };
    const onUp = (e: PointerEvent) => {
      if (inicioClic && punteros.size === 1 && !moviendo && Math.hypot(e.clientX - inicioClic.x, e.clientY - inicioClic.y) < 6) elegir(e);
      inicioClic = null;
      punteros.delete(e.pointerId); distPinza = 0; centroPinza = null; if (!punteros.size) moviendo = false; renderer.domElement.style.cursor = 'grab'; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); rad = Math.max(2, Math.min(150, rad * (e.deltaY < 0 ? 0.9 : 1.1))); actualizar(); };
    const sinMenu = (e: Event) => e.preventDefault();
    const el = renderer.domElement;
    el.addEventListener('pointerdown', onDown); el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', sinMenu);

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(mount); resize();

    setVerModelo(v => v + 1);
    let raf = 0;
    const loop = () => { if (girar.current) { az += (2 * Math.PI) / (14 * 60); actualizar(); } renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    return () => {
      grabacion.current?.detener();
      cancelAnimationFrame(raf); ro.disconnect();
      el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', sinMenu);
      scene.traverse(o => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, []);

  useEffect(() => {
    const r = rendererRef.current, b = limitesRef.current;
    if (!r || !b || b.isEmpty()) return;
    if (corte >= 100) { r.clippingPlanes = []; return; }
    const min = ejeCorte === 'x' ? b.min.x : b.min.z, max = ejeCorte === 'x' ? b.max.x : b.max.z;
    const pos = min + ((max - min) * corte) / 100;
    r.clippingPlanes = [new THREE.Plane(ejeCorte === 'x' ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(0, 0, -1), pos)];
  }, [corte, ejeCorte]);

  // Segundos que faltan de la grabación y aviso al terminar.
  const [seg, setSeg] = useState(0);
  const [listo, setListo] = useState<string | null>(null);
  useEffect(() => {
    if (!grabando) return;
    const t = window.setInterval(() => setSeg(s => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(t);
  }, [grabando]);
  const grabar = () => {
    if (grabacion.current) { grabacion.current.detener(); return; }
    const c = canvasRef.current;
    if (!c || !puedeGrabar(c)) { alert('La grabación de video no está disponible en este navegador. Prueba con Chrome o Edge actualizados.'); return; }
    girar.current = true;
    setListo(null); setSeg(14);
    grabacion.current = grabarCanvas(c, 'obra_3d', { duracionMs: 14000, onFin: ext => {
      girar.current = false; grabacion.current = null; setGrabando(false);
      setListo(`Video ${ext.toUpperCase()} descargado · búscalo en Descargas`);
      window.setTimeout(() => setListo(null), 5000);
    } });
    if (grabacion.current) setGrabando(true); else girar.current = false;
  };

  // El padre remonta el visor (key) cuando cambia la escena.
  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      <button onClick={grabar} title={grabando ? 'Detener y descargar el video' : 'Grabar un video MP4 girando el modelo'}
        className={`absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer border ${grabando ? 'bg-rose-600 text-white border-rose-600 animate-pulse' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}>
        {grabando ? <StopIcon className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
        {grabando ? `Detener · ${seg}s` : 'Grabar video'}
      </button>
      {/* Vista de corte */}
      <div className="absolute left-3 bottom-12 sm:bottom-14 z-10 flex items-center gap-1.5 bg-white/95 border border-slate-200 rounded-xl px-2 py-1.5 shadow text-[10px] font-bold text-slate-600">
        <span>Corte</span>
        <button onClick={() => setEjeCorte(e => e === 'x' ? 'z' : 'x')} className="px-1.5 py-0.5 rounded bg-slate-100 cursor-pointer" title="Cambiar dirección del corte">{ejeCorte === 'x' ? '↔' : '↕'}</button>
        <input type="range" min={0} max={100} value={corte} onChange={e => setCorte(Number(e.target.value))} className="w-24 sm:w-32 accent-stone-700" aria-label="Posición del corte" />
        {corte < 100 && <button onClick={() => setCorte(100)} className="px-1.5 py-0.5 rounded bg-slate-100 cursor-pointer">Quitar</button>}
      </div>
      {listo && (
        <div className="absolute bottom-14 right-3 z-10 max-w-[240px] text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 shadow">{listo}</div>
      )}
    </div>
  );
}
