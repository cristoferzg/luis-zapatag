// =============================================================================
// CAD de Concreto — Plano de Cimentación 2D (motor paramétrico unificado)
//
// Un lienzo en PLANTA donde el usuario COLOCA elementos de concreto con el mouse
// (columnas y zapatas con un clic; vigas, cimientos y losas con dos clics) sobre
// una rejilla con snapping. El metrado (concreto m³, acero kg, encofrado,
// materiales y costo) se calcula AUTOMÁTICAMENTE de lo dibujado.
//
// MOTOR PARAMÉTRICO (como Techos Metálicos):
//   • NODOS COMPARTIDOS: los extremos que coinciden forman un mismo nodo. Al
//     arrastrar un nodo se mueven TODOS los elementos conectados a él (columnas,
//     zapatas y vigas que lo comparten), manteniendo la estructura unida.
//   • DESHACER / REHACER (Ctrl+Z / Ctrl+Y) con historial.
//   • SNAP A NODO: al dibujar, el cursor se imanta a los nodos existentes.
//   • ENCUADRAR: ajusta el zoom/paneo para ver todo el plano.
//
// Autónomo: no depende del motor de Techos. Persiste en localStorage en el mismo
// formato plano (interoperable con el visor 3D, el metrado y el puente de Techos).
// =============================================================================
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { MousePointer, Columns, Square, Minus, Trash2, Download, Hand, Grid3x3, Plus, Layers, Eye, Undo2, Redo2, Maximize, BrickWall, DoorOpen, Armchair, RotateCw, FlipHorizontal2 } from 'lucide-react';
import { DRYWALL_DEFAULTS, DrywallItem } from '../catalogo/drywall';
import { LADRILLO_DEFAULTS, LadrilloItem } from '../catalogo/ladrillo';
import { OsbItem } from '../catalogo/osb';
import { KEY_CAT_DRYWALL, KEY_CAT_LADRILLO, KEY_OBRA_TECHOS_ID, MaterialMuro, EstructuraTechos, calcMuro, muroDesdePlano, entrepisosDesdeTechos, leerCatalogoOsb, contextosObra, yTechoObra, drywallConCatalogo, ladrilloConCatalogo, osbConCatalogo, preciosConcretoCatalogo } from './concreto/obraPisos';
import { useCatalogo } from '../lib/catalogoPrecios';
import { leerDisenosCarpi, costoDisenoCarpi, tipoAberturaDe } from './concreto/carpiObra';
import { metradoDrywall } from './concreto/metradoDrywall';
import { Bloque, KEY_BLOQUES, MUEBLES, muebleDe, geometriaCarpi, plantaCarpi, dentroBloque, Prim2D, SUELTOS } from './concreto/bloques';
import { NOMBRE_TIPO_CARPI } from './concreto/carpiObra';
import {
  Abertura, TipoAbertura, PRESETS_ABERTURA, esPuerta, esVidrio, ajustarAbertura, largoMuro, perfilMuro, detectarAmbientes,
  regionesCielo, mallaCielo, mallaCieloTanque, tanquesEnEstructura, CieloRaso, cieloDefault, KEY_CIELOS, KEY_AMBIENTES,
  CAPAS, CapaEstructura, capaDeRol, esNodoTanque, poligonosTecho, KEY_SOBREPECHOS, Sobrepecho, sobrepechoDefault, perimetroSobrepecho,
} from './concreto/geometriaObra';
import { INVENTARIO_PERFILES_TUBULARES } from './techos/techosCadCatalog';
import { caidaDePoligono, nombreDireccion, NOMBRE_CAIDA } from './techos/coberturaAuto';
import { SavedTechosDesign, getCachedTechosDesigns, fetchAllTechosDesigns } from '../lib/techosDesignsRepo';
import { safeStorage } from '../lib/storageManager';
import ConcretoViewer3D from './ConcretoViewer3D';

export type PlanoTipo = 'columna' | 'zapata' | 'viga' | 'cimiento' | 'losa' | 'muro';
type Herramienta = 'select' | 'pan' | 'abertura' | 'bloque' | PlanoTipo;
export type { Abertura } from './concreto/geometriaObra';

export interface PlanoElem {
  uid: string;
  tipo: PlanoTipo;
  x1: number; y1: number;          // coordenadas en planta (m)
  x2?: number; y2?: number;        // segundo punto (vigas / cimientos / losas)
  a: number;                       // ancho sección (m)
  b?: number;                      // alto sección (columnas/zapatas) (m)
  h?: number;                      // peralte/altura (m)
  H?: number;                      // altura de columna / muro (m)
  nivel?: string;                  // muro: piso al que pertenece
  material?: MaterialMuro;
  materialId?: string;
  caras?: 1 | 2;
  losaMaterial?: 'concreto' | 'osb'; // losa / entrepiso: de concreto o placa OSB sobre vigas
  hastaTecho?: boolean;            // muro: sube hasta el techo siguiendo la pendiente
  aberturas?: Abertura[];          // muro: puertas, ventanas y vanos
}

// Peso lineal (kg/m) por diámetro de varilla de acero corrugado.
const DIAMETROS_KGM: Record<string, number> = { '1/4"': 0.25, '3/8"': 0.56, '1/2"': 0.99, '5/8"': 1.55, '3/4"': 2.24 };
const LARGO_VARILLA_M = 9;

export const META: Record<PlanoTipo, { nombre: string; emoji: string; color: string; esLinea: boolean; icon: any }> = {
  columna:  { nombre: 'Columna',          emoji: '🔲', color: '#2563eb', esLinea: false, icon: Columns },
  zapata:   { nombre: 'Zapata',           emoji: '🟫', color: '#b45309', esLinea: false, icon: Square },
  viga:     { nombre: 'Viga',             emoji: '📏', color: '#059669', esLinea: true,  icon: Minus },
  cimiento: { nombre: 'Cimiento corrido', emoji: '🟤', color: '#78716c', esLinea: true,  icon: Minus },
  losa:     { nombre: 'Losa / Entrepiso', emoji: '🟦', color: '#0ea5e9', esLinea: true,  icon: Layers },
  muro:     { nombre: 'Muro',             emoji: '🧱', color: '#f97316', esLinea: true,  icon: BrickWall },
};
export const COLOR_MURO: Record<MaterialMuro, string> = { ladrillo: '#fb923c', drywall: '#94a3b8', osb: '#d6a960' };

const DEFAULTS: Record<PlanoTipo, Omit<PlanoElem, 'uid' | 'tipo' | 'x1' | 'y1' | 'x2' | 'y2'>> = {
  columna:  { a: 0.25, b: 0.25, H: 3.0 },
  zapata:   { a: 1.0,  b: 1.0,  h: 0.5 },
  viga:     { a: 0.25, h: 0.40 },
  cimiento: { a: 0.50, h: 0.60 },
  losa:     { a: 0.20, h: 0.20 },
  muro:     { a: 0.15, H: 2.6 },
};

const GRID_M = 0.25;

// --- Motor de nodos compartidos --------------------------------------------
// Clave de nodo: coordenada redondeada al milímetro. Dos extremos con la misma
// clave son el MISMO nodo físico (están "soldados").
const NK = (x: number, y: number) => `${Math.round(x * 1000)}_${Math.round(y * 1000)}`;
const sameNode = (ax: number, ay: number, bx: number, by: number) => NK(ax, ay) === NK(bx, by);

interface NodoCad { id: string; x: number; y: number; refs: number; }
function derivarNodos(elems: PlanoElem[]): NodoCad[] {
  const map = new Map<string, NodoCad>();
  const add = (x: number, y: number) => {
    const k = NK(x, y);
    const n = map.get(k);
    if (n) n.refs++; else map.set(k, { id: k, x, y, refs: 1 });
  };
  elems.forEach(e => {
    add(e.x1, e.y1);
    if (e.x2 !== undefined && e.y2 !== undefined) add(e.x2, e.y2);
  });
  return [...map.values()];
}

interface Resultado { concretoM3: number; aceroKg: number; encofradoM2: number; dist?: Record<string, number>; }

// Metrado por elemento (mismas cuantías que el módulo de metrados).
function calcElem(e: PlanoElem): Resultado {
  const largo = (e.x2 !== undefined && e.y2 !== undefined) ? Math.hypot(e.x2 - e.x1, e.y2 - e.y1) : 0;
  if (e.tipo === 'columna') {
    const vol = e.a * (e.b || e.a) * (e.H || 3);
    return { concretoM3: vol, aceroKg: vol * 120, encofradoM2: 2 * (e.a + (e.b || e.a)) * (e.H || 3), dist: { '1/2"': 0.7, '3/8"': 0.3 } };
  }
  if (e.tipo === 'zapata') {
    const vol = e.a * (e.b || e.a) * (e.h || 0.5);
    return { concretoM3: vol, aceroKg: vol * 55, encofradoM2: 2 * (e.a + (e.b || e.a)) * (e.h || 0.5), dist: { '1/2"': 1 } };
  }
  if (e.tipo === 'viga') {
    const vol = e.a * (e.h || 0.4) * largo;
    return { concretoM3: vol, aceroKg: vol * 110, encofradoM2: (2 * (e.h || 0.4) + e.a) * largo, dist: { '5/8"': 0.45, '1/2"': 0.25, '3/8"': 0.3 } };
  }
  if (e.tipo === 'losa' && e.losaMaterial === 'osb') return { concretoM3: 0, aceroKg: 0, encofradoM2: 0 };
  if (e.tipo === 'losa') {
    // Losa de entrepiso/techo: rectángulo definido por 2 esquinas (x1,y1)-(x2,y2).
    const area = (e.x2 !== undefined && e.y2 !== undefined) ? Math.abs(e.x2 - e.x1) * Math.abs(e.y2 - e.y1) : 0;
    const esp = e.h || 0.20;
    const vol = area * esp;
    return { concretoM3: vol, aceroKg: vol * 80, encofradoM2: area, dist: { '3/8"': 0.6, '1/2"': 0.4 } };
  }
  if (e.tipo === 'muro') return { concretoM3: 0, aceroKg: 0, encofradoM2: 0 };
  // cimiento (ciclópeo, sin acero)
  const vol = e.a * (e.h || 0.6) * largo;
  return { concretoM3: vol, aceroKg: 0, encofradoM2: 0 };
}

// modo 'drywall': el mismo plano (compartido con Obra Civil) pero solo con
// tabiques de drywall/OSB, aberturas y cielo raso, y su metrado detallado.
export default function ConcretoPlanoCad({ onEditarEnTechos, modo = 'obra' }: { onEditarEnTechos?: (d: SavedTechosDesign) => void; modo?: 'obra' | 'drywall' } = {}) {
  const esDrywall = modo === 'drywall';
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [tool, setTool] = useState<Herramienta>(esDrywall ? 'muro' : 'columna');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0, onNode: false });
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [selUid, setSelUid] = useState<string | null>(null);
  const [selNode, setSelNode] = useState<string | null>(null);
  const [vista3d, setVista3d] = useState(false);
  const [verTecho, setVerTecho] = useState(true);
  const [hastaPiso, setHastaPiso] = useState('');
  const [resaltar, setResaltar] = useState(false);
  const [verCimentacion, setVerCimentacion] = useState(false);

  const [elems, setElems] = useState<PlanoElem[]>(() => safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || []);
  // Precios y materiales con el Catálogo de precios único.
  const catalogo = useCatalogo();
  const precios = useMemo(() => preciosConcretoCatalogo(), [catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  // Pisos (los mismos de la vista Lista) y material de muro a dibujar.
  const [niveles] = useState<string[]>(() => safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Cimentación', 'Piso 1']);
  const pisos = niveles.filter(n => !/cimentaci/i.test(n));
  const [nivelMuro, setNivelMuro] = useState<string>(() => pisos[0] || 'Piso 1');
  const [catDrywallBase] = useState<DrywallItem[]>(() => safeStorage.getItem<DrywallItem[]>(KEY_CAT_DRYWALL, DRYWALL_DEFAULTS) || DRYWALL_DEFAULTS);
  const [catLadrilloBase] = useState<LadrilloItem[]>(() => safeStorage.getItem<LadrilloItem[]>(KEY_CAT_LADRILLO, LADRILLO_DEFAULTS) || LADRILLO_DEFAULTS);
  const [catOsbBase] = useState<OsbItem[]>(leerCatalogoOsb);
  const catDrywall = useMemo(() => drywallConCatalogo(catDrywallBase), [catDrywallBase, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const catLadrillo = useMemo(() => ladrilloConCatalogo(catLadrilloBase), [catLadrilloBase, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const catOsb = useMemo(() => osbConCatalogo(catOsbBase), [catOsbBase, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const [materialMuro, setMaterialMuro] = useState<{ material: MaterialMuro; materialId: string }>(esDrywall ? { material: 'drywall', materialId: DRYWALL_DEFAULTS[0].id } : { material: 'ladrillo', materialId: LADRILLO_DEFAULTS[0].id });
  const [tipoAbertura, setTipoAbertura] = useState<TipoAbertura>('puerta');
  const [selAb, setSelAb] = useState<{ uid: string; id: string } | null>(null);
  // Diseños guardados en CarpiMetal (se releen al seleccionar una abertura).
  const disenosCarpi = useMemo(() => leerDisenosCarpi(), [selAb, tool]); // eslint-disable-line react-hooks/exhaustive-deps
  // Bloques a escala (diseños de CarpiMetal sueltos y muebles de referencia).
  const [bloques, setBloques] = useState<Bloque[]>(() => safeStorage.getItem<Bloque[]>(KEY_BLOQUES, []) || []);
  useEffect(() => { safeStorage.setItem(KEY_BLOQUES, bloques); }, [bloques]);
  const [selBloque, setSelBloque] = useState<string | null>(null);
  const [aColocar, setAColocar] = useState<{ origen: 'carpi' | 'mueble'; refId: string } | null>(null);
  const geomCarpi = useMemo(() => new Map(disenosCarpi.map(d => [d.id, geometriaCarpi(d)])), [disenosCarpi]);
  const updBloque = (uid: string, patch: Partial<Bloque>) => setBloques(prev => prev.map(b => b.uid === uid ? { ...b, ...patch } : b));
  const [aviso, setAviso] = useState('');
  // Cielo raso por piso (y bajo el sobretecho de cada tanque) y nombres de ambientes.
  const [cielos, setCielos] = useState<Record<string, CieloRaso>>(() => safeStorage.getItem<Record<string, CieloRaso>>(KEY_CIELOS, {}) || {});
  useEffect(() => { safeStorage.setItem(KEY_CIELOS, cielos); }, [cielos]);
  const [nombresAmb, setNombresAmb] = useState<Record<string, string>>(() => safeStorage.getItem<Record<string, string>>(KEY_AMBIENTES, {}) || {});
  useEffect(() => { safeStorage.setItem(KEY_AMBIENTES, nombresAmb); }, [nombresAmb]);

  // Estructura de Techos Metálicos vinculada a esta obra (diseño guardado).
  const [disenos, setDisenos] = useState<SavedTechosDesign[]>(getCachedTechosDesigns);
  const [techosId, setTechosId] = useState<string>(() => safeStorage.getItem<string>(KEY_OBRA_TECHOS_ID, '') || '');
  useEffect(() => { fetchAllTechosDesigns().then(setDisenos).catch(() => {}); }, []);
  useEffect(() => { safeStorage.setItem(KEY_OBRA_TECHOS_ID, techosId); }, [techosId]);
  const disenoVinculado = disenos.find(d => d.id === techosId) || null;
  const estructura = disenoVinculado as unknown as (EstructuraTechos & { updatedAt?: string }) | null;
  // Planta de la estructura: tramos proyectados (x, z) con el ancho real del
  // perfil y su capa (columnas, tijerales, correas…), y nodos para imantar.
  type LineaPlanta = { x1: number; z1: number; x2: number; z2: number; col: boolean; capa: CapaEstructura; ancho: number; alto: number };
  const [capasOcultas, setCapasOcultas] = useState<CapaEstructura[]>([]);
  const plantaTechos = useMemo(() => {
    if (!estructura) return { lineas: [] as LineaPlanta[], puntos: [] as { x: number; y: number }[], conteo: {} as Partial<Record<CapaEstructura, number>> };
    const N = estructura.nodes || {};
    const lineas: LineaPlanta[] = [];
    const conteo: Partial<Record<CapaEstructura, number>> = {};
    const vistos = new Set<string>();
    Object.values(estructura.segments || {}).forEach(sg => {
      const a = N[sg.nodeAId], b = N[sg.nodeBId];
      if (!a || !b || esNodoTanque(a) || esNodoTanque(b)) return;
      const capa = capaDeRol(sg.rolEstructural);
      conteo[capa] = (conteo[capa] || 0) + 1;
      const p = INVENTARIO_PERFILES_TUBULARES.find(x => x.id === sg.profileId);
      const concreto = sg.rolEstructural === 'columna_concreto';
      const ancho = concreto ? 0.25 : (p?.anchoMm || 50) / 1000, alto = concreto ? 0.25 : (p?.altoMm || p?.anchoMm || 50) / 1000;
      const col = Math.hypot(a.x - b.x, a.z - b.z) < 0.01;
      if (col) { const k = NK(a.x, a.z); if (vistos.has(k)) return; vistos.add(k); }
      lineas.push({ x1: a.x, z1: a.z, x2: b.x, z2: b.z, col, capa, ancho, alto });
    });
    const puntos = [...vistos].map(k => { const [x, y] = k.split('_').map(v => Number(v) / 1000); return { x, y }; });
    return { lineas, puntos, conteo };
  }, [estructura]);
  // Flechas de caída de cada agua del techo (en planta).
  const caidas = useMemo(() => {
    if (!estructura) return [];
    return poligonosTecho(estructura, true).map(p => {
      const c = caidaDePoligono(p);
      const cx = p.reduce((s2, q) => s2 + q.x, 0) / p.length, cz = p.reduce((s2, q) => s2 + q.z, 0) / p.length;
      return c && c.pendientePct > 0 ? { cx, cz, ...c } : null;
    }).filter((c): c is NonNullable<typeof c> => !!c);
  }, [estructura]);

  // Alto de cada piso según la estructura (hasta el entrepiso siguiente o el techo).
  const alturaPiso = useMemo(() => {
    const out: Record<string, number> = {};
    if (!estructura) return out;
    const ent = entrepisosDesdeTechos(estructura);
    const yTecho = yTechoObra(estructura);
    const lista = pisos.length ? pisos : ['Piso 1'];
    lista.forEach((n, k) => {
      const base = k === 0 ? 0 : (ent[k - 1] ?? 0);
      const tope = ent[k] ?? yTecho;
      if (tope - base > 0.5) out[n] = Math.round((tope - base) * 100) / 100;
    });
    return out;
  }, [estructura, pisos.join('|')]);

  const elemsRef = useRef(elems);
  elemsRef.current = elems;

  useEffect(() => { safeStorage.setItem('concreto_plano_elems', elems); }, [elems]);

  // ---- Historial: deshacer / rehacer ----
  const undoRef = useRef<PlanoElem[][]>([]);
  const redoRef = useRef<PlanoElem[][]>([]);
  const [histVer, setHistVer] = useState(0);
  const coalesce = useRef<{ key: string; t: number }>({ key: '', t: 0 });

  const pushHist = useCallback(() => {
    undoRef.current.push(elemsRef.current);
    if (undoRef.current.length > 120) undoRef.current.shift();
    redoRef.current = [];
    setHistVer(v => v + 1);
  }, []);

  // commit = registra en historial y actualiza. coalesceKey agrupa cambios
  // rápidos del mismo campo (ediciones numéricas) en un solo paso deshacible.
  const commit = useCallback((next: PlanoElem[] | ((p: PlanoElem[]) => PlanoElem[]), coalesceKey?: string) => {
    const now = Date.now();
    const same = coalesceKey && coalesce.current.key === coalesceKey && (now - coalesce.current.t) < 650;
    if (!same) pushHist();
    coalesce.current = { key: coalesceKey || '', t: now };
    setElems(next);
    setHistVer(v => v + 1);
  }, [pushHist]);

  const undo = useCallback(() => {
    if (!undoRef.current.length) return;
    redoRef.current.push(elemsRef.current);
    const prev = undoRef.current.pop()!;
    setElems(prev);
    setSelUid(null); setSelNode(null);
    coalesce.current = { key: '', t: 0 };
    setHistVer(v => v + 1);
  }, []);
  const redo = useCallback(() => {
    if (!redoRef.current.length) return;
    undoRef.current.push(elemsRef.current);
    const nx = redoRef.current.pop()!;
    setElems(nx);
    setSelUid(null); setSelNode(null);
    coalesce.current = { key: '', t: 0 };
    setHistVer(v => v + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const upd = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = 48 * zoom; // px por metro
  const cx = dims.w / 2 + pan.x;
  const cy = dims.h / 2 + pan.y;
  const toScreen = (x: number, y: number) => ({ sx: cx + x * scale, sy: cy + y * scale });
  const snap = (v: number) => Math.round(v / GRID_M) * GRID_M;

  const nodos = useMemo(() => derivarNodos(elems), [elems]);

  // Coordenada de mundo cruda (sin snap) desde coords de pantalla.
  const rawWorld = (clientX: number, clientY: number) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (clientX - r.left - cx) / scale, y: (clientY - r.top - cy) / scale };
  };

  // Snap combinado: primero imanta a un NODO cercano; si no, a la rejilla.
  const snapWorld = (clientX: number, clientY: number, excludeKey?: string) => {
    const raw = rawWorld(clientX, clientY);
    let best: NodoCad | null = null;
    let bestD = 14 / scale; // umbral en metros ≈ 14 px
    for (const n of nodos) {
      if (excludeKey && n.id === excludeKey) continue;
      const d = Math.hypot(n.x - raw.x, n.y - raw.y);
      if (d < bestD) { bestD = d; best = n; }
    }
    for (const p of plantaTechos.puntos) {
      const d = Math.hypot(p.x - raw.x, p.y - raw.y);
      if (d < bestD) { bestD = d; best = { id: NK(p.x, p.y), x: p.x, y: p.y, refs: 1 }; }
    }
    if (best) return { x: best.x, y: best.y, onNode: true };
    return { x: snap(raw.x), y: snap(raw.y), onNode: false };
  };

  const hitNode = (clientX: number, clientY: number): NodoCad | null => {
    const raw = rawWorld(clientX, clientY);
    let best: NodoCad | null = null;
    let bestD = 14 / scale;
    for (const n of nodos) {
      const d = Math.hypot(n.x - raw.x, n.y - raw.y);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  };

  const addPoint = (tipo: PlanoTipo, x: number, y: number) => {
    const d = DEFAULTS[tipo];
    commit(prev => [...prev, { uid: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, tipo, x1: x, y1: y, ...d }]);
  };
  const addLine = (tipo: PlanoTipo, x1: number, y1: number, x2: number, y2: number) => {
    const d = DEFAULTS[tipo];
    const extra = tipo === 'losa' ? { nivel: nivelMuro, losaMaterial: 'concreto' as const } : tipo === 'muro' ? { nivel: nivelMuro, ...materialMuro, caras: (materialMuro.material === 'osb' ? 1 : 2) as 1 | 2, hastaTecho: !!estructura, ...(alturaPiso[nivelMuro] ? { H: alturaPiso[nivelMuro] } : {}) } : {};
    commit(prev => [...prev, { uid: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, tipo, x1, y1, x2, y2, ...d, ...extra }]);
  };

  // Mueve un nodo (y TODOS los extremos coincidentes) de una coord a otra.
  const moverNodo = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    setElems(prev => prev.map(e => {
      let ne = e;
      if (sameNode(e.x1, e.y1, from.x, from.y)) ne = { ...ne, x1: to.x, y1: to.y };
      if (e.x2 !== undefined && e.y2 !== undefined && sameNode(e.x2, e.y2, from.x, from.y)) ne = { ...ne, x2: to.x, y2: to.y };
      return ne;
    }));
  };

  // --- Aberturas: proyección del cursor sobre los muros del piso activo ---
  const murosActivos = elems.filter(e => e.tipo === 'muro' && (e.nivel || pisos[0]) === nivelMuro && e.x2 !== undefined && e.y2 !== undefined);
  const proyectar = (e: PlanoElem, x: number, y: number) => {
    const L = largoMuro(e), ux = (e.x2! - e.x1) / L, uy = (e.y2! - e.y1) / L;
    return { L, t: (x - e.x1) * ux + (y - e.y1) * uy, d: Math.abs(-(x - e.x1) * uy + (y - e.y1) * ux) };
  };
  const muroBajo = (clientX: number, clientY: number) => {
    const w = rawWorld(clientX, clientY);
    let best: { e: PlanoElem; t: number; L: number } | null = null, bestD = Infinity;
    murosActivos.forEach(e => {
      const p = proyectar(e, w.x, w.y);
      if (p.t < -0.05 || p.t > p.L + 0.05) return;
      if (p.d <= Math.max(e.a / 2 + 0.2, 12 / scale) && p.d < bestD) { bestD = p.d; best = { e, t: p.t, L: p.L }; }
    });
    return best as { e: PlanoElem; t: number; L: number } | null;
  };
  const hitAbertura = (clientX: number, clientY: number) => {
    const m = muroBajo(clientX, clientY);
    const ab = m?.e.aberturas?.find(a => Math.abs(m.t - a.t) <= a.w / 2);
    return m && ab ? { uid: m.e.uid, id: ab.id } : null;
  };
  const updateAbertura = (uid: string, id: string, patch: Partial<Abertura>, campo?: string) =>
    commit(prev => prev.map(e => e.uid !== uid ? e : { ...e, aberturas: (e.aberturas || []).map(a => a.id === id ? ajustarAbertura({ ...a, ...patch }, largoMuro(e)) : a) }), campo ? `ab_${id}_${campo}` : undefined);
  const removeAbertura = (uid: string, id: string) => {
    commit(prev => prev.map(e => e.uid !== uid ? e : { ...e, aberturas: (e.aberturas || []).filter(a => a.id !== id) }));
    setSelAb(null);
  };

  // --- Interacción puntero ---
  const dragNode = useRef<{ x: number; y: number; key: string } | null>(null);
  const dragAb = useRef<{ uid: string; id: string; moved: boolean } | null>(null);
  const dragBloque = useRef<{ uid: string; dx: number; dy: number; moved: boolean } | null>(null);
  // Imanta un bloque al muro más cercano del piso activo: lo gira con el muro y
  // apoya su lado de atrás en la cara del muro.
  const imantarAMuro = (b: Bloque, x: number, y: number): Partial<Bloque> => {
    let mejor: { d: number; px: number; py: number; nx: number; ny: number; a: number } | null = null;
    murosActivos.forEach(m => {
      const p = proyectar(m, x, y);
      if (p.t < 0 || p.t > p.L) return;
      const ux = (m.x2! - m.x1) / p.L, uy = (m.y2! - m.y1) / p.L;
      const lado = -(x - m.x1) * uy + (y - m.y1) * ux >= 0 ? 1 : -1;
      const nx = -uy * lado, ny = ux * lado;
      const libre = p.d - (m.a || 0.15) / 2;
      if (libre < b.fondo / 2 + 0.35 && (!mejor || libre < mejor.d)) mejor = { d: libre, px: m.x1 + ux * p.t, py: m.y1 + uy * p.t, nx, ny, a: m.a || 0.15 };
    });
    if (!mejor) return { x: snap(x), y: snap(y) };
    const mm = mejor as { d: number; px: number; py: number; nx: number; ny: number; a: number };
    const off = mm.a / 2 + b.fondo / 2 + 0.01;
    return { x: mm.px + mm.nx * off, y: mm.py + mm.ny * off, rot: Math.round((Math.atan2(-mm.nx, mm.ny) * 180) / Math.PI) };
  };
  const didDrag = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1 || e.button === 2) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (tool === 'select' && e.button === 0) {
      const w0 = rawWorld(e.clientX, e.clientY);
      const hb = [...bloques].reverse().find(b => (b.nivel || pisos[0]) === nivelMuro && dentroBloque(b, w0.x, w0.y));
      if (hb) {
        dragBloque.current = { uid: hb.uid, dx: w0.x - hb.x, dy: w0.y - hb.y, moved: false };
        setSelBloque(hb.uid); setSelUid(null); setSelNode(null); setSelAb(null);
        didDrag.current = true; // el clic que sigue no debe deseleccionar
        return;
      }
      const hab = hitAbertura(e.clientX, e.clientY);
      if (hab) {
        pushHist();
        dragAb.current = { ...hab, moved: false };
        setSelAb(hab); setSelUid(null); setSelNode(null);
        return;
      }
      const n = hitNode(e.clientX, e.clientY);
      if (n) {
        pushHist();                 // un paso deshacible por arrastre
        dragNode.current = { x: n.x, y: n.y, key: n.id };
        didDrag.current = false;
        setSelNode(n.id); setSelUid(null);
      } else {
        // Arrastrar en vacío mueve el plano (un clic sin mover sigue deseleccionando).
        setIsPanning(true);
        didDrag.current = false;
        panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      }
    }
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.current.x, dy = e.clientY - panStart.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) didDrag.current = true;
      setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
      return;
    }
    if (dragBloque.current) {
      const d = dragBloque.current;
      const w = rawWorld(e.clientX, e.clientY);
      updBloque(d.uid, { x: snap(w.x - d.dx), y: snap(w.y - d.dy) });
      d.moved = true;
      return;
    }
    if (dragAb.current) {
      const d = dragAb.current;
      const w = rawWorld(e.clientX, e.clientY);
      setElems(prev => prev.map(m => {
        if (m.uid !== d.uid) return m;
        const p = proyectar(m, w.x, w.y);
        return { ...m, aberturas: (m.aberturas || []).map(a => a.id === d.id ? ajustarAbertura({ ...a, t: Math.round(p.t / 0.05) * 0.05 }, p.L) : a) };
      }));
      d.moved = true;
      return;
    }
    if (dragNode.current) {
      const t = snapWorld(e.clientX, e.clientY, dragNode.current.key);
      if (!sameNode(t.x, t.y, dragNode.current.x, dragNode.current.y)) {
        moverNodo(dragNode.current, { x: t.x, y: t.y });
        dragNode.current = { x: t.x, y: t.y, key: NK(t.x, t.y) };
        didDrag.current = true;
      }
      setCursor({ x: t.x, y: t.y, onNode: true });
      return;
    }
    const s = snapWorld(e.clientX, e.clientY);
    setCursor(s);
  };
  const onMouseUp = () => {
    setIsPanning(false);
    if (dragBloque.current) {
      const d = dragBloque.current; dragBloque.current = null;
      if (d.moved) {
        didDrag.current = true;
        const b = bloques.find(x => x.uid === d.uid);
        if (b) updBloque(b.uid, imantarAMuro(b, b.x, b.y));
      }
    }
    if (dragAb.current) {
      if (!dragAb.current.moved) undoRef.current.pop();
      dragAb.current = null;
      didDrag.current = true; // el clic que sigue no deselecciona
      setHistVer(v => v + 1);
    }
    if (dragNode.current) {
      if (!didDrag.current) undoRef.current.pop(); // no hubo movimiento → descarta el paso
      dragNode.current = null;
      setHistVer(v => v + 1);
    }
  };

  // Táctil: un dedo mueve el plano (con Seleccionar o Mover lienzo), dos dedos hacen zoom.
  const toque = useRef<{ x: number; y: number; px: number; py: number; d: number; z: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches;
    const c = t.length === 2 ? { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 } : { x: t[0].clientX, y: t[0].clientY };
    toque.current = { ...c, px: pan.x, py: pan.y, d: t.length === 2 ? Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) : 0, z: zoom };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches, s0 = toque.current;
    if (!s0) return;
    if (t.length === 2) {
      const d = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const c = { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 };
      if (s0.d) setZoom(Math.max(0.3, Math.min(4, s0.z * d / s0.d)));
      setPan({ x: s0.px + c.x - s0.x, y: s0.py + c.y - s0.y });
      didDrag.current = true;
    } else if (t.length === 1 && (tool === 'select' || tool === 'pan') && !dragNode.current && !dragAb.current) {
      const dx = t[0].clientX - s0.x, dy = t[0].clientY - s0.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) { didDrag.current = true; setPan({ x: s0.px + dx, y: s0.py + dy }); }
    }
  };
  const onTouchEnd = () => { toque.current = null; };

  const onClick = (e: React.MouseEvent) => {
    if (tool === 'pan') return;
    if (didDrag.current) { didDrag.current = false; return; } // acabamos de arrastrar un nodo
    const w = snapWorld(e.clientX, e.clientY);
    if (tool === 'select') { setSelUid(null); setSelNode(null); setSelAb(null); setSelBloque(null); return; }
    if (tool === 'bloque') {
      if (!aColocar) { setAviso('Elige a la derecha qué bloque colocar'); setTimeout(() => setAviso(''), 1800); return; }
      const raw = rawWorld(e.clientX, e.clientY);
      let nuevo: Bloque;
      if (aColocar.origen === 'mueble') {
        const m = muebleDe(aColocar.refId)!;
        nuevo = { uid: `bl_${Date.now().toString(36)}`, nivel: nivelMuro, origen: 'mueble', refId: m.id, nombre: m.nombre, x: raw.x, y: raw.y, rot: 0, ancho: m.ancho, fondo: m.fondo, alto: m.alto, incluir: false, obs: 'Mobiliario referencial, no incluido.' };
      } else {
        const d = disenosCarpi.find(x => x.id === aColocar.refId);
        const g = geomCarpi.get(aColocar.refId);
        if (!d || !g) return;
        nuevo = { uid: `bl_${Date.now().toString(36)}`, nivel: nivelMuro, origen: 'carpi', refId: d.id, nombre: d.nombre, x: raw.x, y: raw.y, rot: 0, ancho: g.ancho, fondo: g.fondo, alto: g.alto, incluir: true, obs: '' };
      }
      nuevo = { ...nuevo, ...imantarAMuro(nuevo, raw.x, raw.y) };
      setBloques(prev => [...prev, nuevo]);
      setSelBloque(nuevo.uid);
      return;
    }
    if (tool === 'abertura') {
      const m = muroBajo(e.clientX, e.clientY);
      if (!m) { setAviso('Haz clic sobre un muro del piso activo'); setTimeout(() => setAviso(''), 1800); return; }
      const pr = PRESETS_ABERTURA[tipoAbertura];
      const ab = ajustarAbertura({ id: `ab_${Date.now().toString(36)}`, tipo: tipoAbertura, t: Math.round(m.t / 0.05) * 0.05, w: pr.w, h: pr.h, sill: pr.sill }, m.L);
      commit(prev => prev.map(x => x.uid === m.e.uid ? { ...x, aberturas: [...(x.aberturas || []), ab] } : x));
      setSelAb({ uid: m.e.uid, id: ab.id }); setSelUid(null);
      return;
    }
    if (tool === 'columna' || tool === 'zapata') { addPoint(tool, w.x, w.y); return; }
    // línea (viga / cimiento / losa)
    if (!pending) { setPending({ x: w.x, y: w.y }); }
    else {
      if (Math.hypot(w.x - pending.x, w.y - pending.y) > 0.05) addLine(tool, pending.x, pending.y, w.x, w.y);
      setPending(null);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(4, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const removeSel = () => { if (selUid) { commit(prev => prev.filter(e => e.uid !== selUid)); setSelUid(null); } };
  const updateElem = (uid: string, patch: Partial<PlanoElem>, campo?: string) =>
    commit(prev => prev.map(e => e.uid === uid ? { ...e, ...patch } : e), campo ? `edit_${uid}_${campo}` : undefined);

  // Cimentación automática: zapata bajo cada columna de Techos que llega al
  // suelo y cimiento corrido entre columnas vecinas alineadas (no en tanques).
  const cimentacionAutomatica = () => {
    if (!estructura) return;
    const N = estructura.nodes || {};
    const bases = new Map<string, { x: number; y: number; tanque: boolean }>();
    Object.values(estructura.segments || {}).forEach(sg => {
      if (!sg.rolEstructural.startsWith('columna')) return;
      [N[sg.nodeAId], N[sg.nodeBId]].forEach(n => { if (n && n.y < 0.05) bases.set(NK(n.x, n.z), { x: n.x, y: n.z, tanque: esNodoTanque(n) }); });
    });
    const pts = [...bases.values()];
    if (!pts.length) { setAviso('La estructura no tiene columnas apoyadas en el suelo'); setTimeout(() => setAviso(''), 2200); return; }
    const nuevos: PlanoElem[] = [];
    const uid = () => `pc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const hayZapata = (x: number, y: number) => elems.some(e => e.tipo === 'zapata' && sameNode(e.x1, e.y1, x, y));
    pts.forEach(p => { if (!hayZapata(p.x, p.y)) nuevos.push({ uid: uid(), tipo: 'zapata', x1: p.x, y1: p.y, ...DEFAULTS.zapata, ...(p.tanque ? { a: 0.8, b: 0.8, h: 0.4 } : {}) }); });
    const obra = pts.filter(p => !p.tanque);
    const hayCimiento = (a: { x: number; y: number }, b: { x: number; y: number }) => elems.some(e => e.tipo === 'cimiento' && e.x2 !== undefined && e.y2 !== undefined &&
      ((sameNode(e.x1, e.y1, a.x, a.y) && sameNode(e.x2, e.y2, b.x, b.y)) || (sameNode(e.x1, e.y1, b.x, b.y) && sameNode(e.x2, e.y2, a.x, a.y))));
    obra.forEach((a, i) => obra.forEach((b, j) => {
      if (j <= i) return;
      const enX = Math.abs(a.y - b.y) < 0.01, enZ = Math.abs(a.x - b.x) < 0.01;
      if (!enX && !enZ) return;
      const L = Math.hypot(b.x - a.x, b.y - a.y);
      if (L > 8.5) return;
      // Solo vecinos inmediatos: ninguna otra columna entre ambas.
      const entre = obra.some(c => c !== a && c !== b && (enX ? Math.abs(c.y - a.y) < 0.01 && c.x > Math.min(a.x, b.x) + 0.01 && c.x < Math.max(a.x, b.x) - 0.01 : Math.abs(c.x - a.x) < 0.01 && c.y > Math.min(a.y, b.y) + 0.01 && c.y < Math.max(a.y, b.y) - 0.01));
      if (!entre && !hayCimiento(a, b)) nuevos.push({ uid: uid(), tipo: 'cimiento', x1: a.x, y1: a.y, x2: b.x, y2: b.y, ...DEFAULTS.cimiento });
    }));
    if (!nuevos.length) { setAviso('La cimentación ya está colocada'); setTimeout(() => setAviso(''), 2200); return; }
    commit(prev => [...prev, ...nuevos]);
    setAviso(`✓ ${nuevos.filter(e => e.tipo === 'zapata').length} zapatas y ${nuevos.filter(e => e.tipo === 'cimiento').length} cimientos corridos (editables)`);
    setTimeout(() => setAviso(''), 3500);
  };

  // Encuadrar: ajusta zoom + paneo para que todo el plano quepa en el lienzo.
  const encuadrar = () => {
    if ((!elems.length && !plantaTechos.lineas.length) || !dims.w) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const acc = (x: number, y: number) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
    elems.forEach(e => { acc(e.x1, e.y1); if (e.x2 !== undefined && e.y2 !== undefined) acc(e.x2, e.y2); });
    plantaTechos.lineas.forEach(l => { acc(l.x1, l.z1); acc(l.x2, l.z2); });
    const wM = Math.max(1, maxX - minX), hM = Math.max(1, maxY - minY);
    const pad = 1.35;
    const z = Math.max(0.3, Math.min(4, Math.min(dims.w / (wM * pad * 48), dims.h / (hM * pad * 48))));
    const sc = 48 * z;
    const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
    setZoom(z);
    setPan({ x: -midX * sc, y: -midY * sc });
  };

  // Al vincular (o cambiar) la estructura de Techos, encuadrarla automáticamente.
  useEffect(() => { if (estructura && dims.w) encuadrar(); }, [techosId, dims.w > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const selElem = elems.find(e => e.uid === selUid) || null;
  // Elementos conectados al nodo seleccionado (para resaltarlos).
  const uidsConectados = useMemo(() => {
    if (!selNode) return new Set<string>();
    const set = new Set<string>();
    elems.forEach(e => {
      if (NK(e.x1, e.y1) === selNode) set.add(e.uid);
      else if (e.x2 !== undefined && e.y2 !== undefined && NK(e.x2, e.y2) === selNode) set.add(e.uid);
    });
    return set;
  }, [selNode, elems]);

  // Campos editables por tipo de elemento.
  const CAMPOS: Record<PlanoTipo, { key: keyof PlanoElem; label: string }[]> = {
    columna:  [{ key: 'a', label: 'Ancho sección (m)' }, { key: 'b', label: 'Alto sección (m)' }, { key: 'H', label: 'Altura (m)' }],
    zapata:   [{ key: 'a', label: 'Ancho (m)' }, { key: 'b', label: 'Largo (m)' }, { key: 'h', label: 'Altura (m)' }],
    viga:     [{ key: 'a', label: 'Ancho (m)' }, { key: 'h', label: 'Peralte (m)' }],
    cimiento: [{ key: 'a', label: 'Ancho (m)' }, { key: 'h', label: 'Altura (m)' }],
    losa:     [{ key: 'h', label: 'Espesor (m)' }],
    muro:     [{ key: 'a', label: 'Espesor (m)' }, { key: 'H', label: 'Alto (m)' }],
  };

  // Firma de la escena → se usa como key para remontar el visor 3D al cambiar algo.
  const sig3d = useMemo(() => elems.map(e => `${e.uid}:${e.a},${e.b},${e.h},${e.H},${e.x1},${e.y1},${e.x2},${e.y2},${e.nivel},${e.material},${e.hastaTecho},${JSON.stringify(e.aberturas || [])}`).join('|') + JSON.stringify(cielos), [elems, cielos]);
  const obra = useMemo(() => contextosObra(niveles, estructura), [niveles, estructura]);

  // Ambientes del piso activo (recintos cerrados por muros) con su nombre.
  const ambientes = useMemo(() => detectarAmbientes(murosActivos).map((a, i) => ({ ...a, nombre: nombresAmb[`${nivelMuro}#${a.key}`] || `Ambiente ${i + 1}` })), [elems, nivelMuro, nombresAmb]); // eslint-disable-line react-hooks/exhaustive-deps
  const tanques = useMemo(() => tanquesEnEstructura(estructura), [estructura]);
  const metradoDw = useMemo(() => esDrywall ? metradoDrywall(niveles, estructura, elems, cielos).find(m => m.nivel === nivelMuro) || null : null,
    [esDrywall, niveles, estructura, elems, cielos, nivelMuro, catalogo]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sobrepechos, setSobrepechos] = useState<Record<string, Sobrepecho>>(() => safeStorage.getItem<Record<string, Sobrepecho>>(KEY_SOBREPECHOS, {}) || {});
  useEffect(() => { safeStorage.setItem(KEY_SOBREPECHOS, sobrepechos); }, [sobrepechos]);
  const setSobrepecho = (id: string, patch: Partial<Sobrepecho>) => setSobrepechos(prev => ({ ...prev, [id]: { ...(prev[id] || sobrepechoDefault()), ...patch } }));
  // Cielo raso del piso activo: malla y metrado.
  const cieloPiso = useMemo(() => {
    const cfg = cielos[nivelMuro];
    if (!cfg?.activo) return null;
    const ctx = obra.ctx(nivelMuro);
    const malla = mallaCielo(regionesCielo(murosActivos, estructura, ctx.base), cfg, ctx);
    const d = catDrywall.find(x => x.id === cfg.materialId);
    return { cfg, malla, nombre: d?.tipo || 'Drywall', costo: malla.area * (d?.precioM2 || 0) };
  }, [cielos, nivelMuro, elems, obra, catDrywall]); // eslint-disable-line react-hooks/exhaustive-deps
  const setCielo = (k: string, patch: Partial<CieloRaso>) => setCielos(prev => ({ ...prev, [k]: { ...(prev[k] || cieloDefault(alturaPiso[k])), ...patch } }));

  // Muros del piso activo: metrado y costo con los precios del usuario.
  const murosPiso = useMemo(() => {
    const lista = elems.filter(e => e.tipo === 'muro' && (e.nivel || pisos[0]) === nivelMuro)
      .map(e => { const m = muroDesdePlano(e, obra.ctx(e.nivel)); return { e, m, r: calcMuro(m, catDrywall, catLadrillo, catOsb) }; });
    return {
      lista,
      areaLadrillo: lista.filter(x => x.m.tipo === 'ladrillo').reduce((s, x) => s + x.m.areaM2, 0),
      ladrillos: lista.filter(x => x.m.tipo === 'ladrillo').reduce((s, x) => s + x.r.unidades, 0),
      areaDrywall: lista.filter(x => x.m.tipo === 'drywall').reduce((s, x) => s + x.m.areaM2, 0),
      placaM2: lista.filter(x => x.m.tipo === 'drywall').reduce((s, x) => s + x.r.unidades, 0),
      areaOsb: lista.filter(x => x.m.tipo === 'osb').reduce((s, x) => s + x.m.areaM2, 0),
      osbM2: lista.filter(x => x.m.tipo === 'osb').reduce((s, x) => s + x.r.unidades, 0),
      costo: lista.reduce((s, x) => s + x.r.costo, 0),
      puertas: lista.reduce((s, x) => s + (x.e.aberturas || []).filter(a => esPuerta(a.tipo)).length, 0),
      ventanas: lista.reduce((s, x) => s + (x.e.aberturas || []).filter(a => esVidrio(a.tipo)).length, 0),
      vanos: lista.reduce((s, x) => s + (x.e.aberturas || []).filter(a => a.tipo === 'vano').length, 0),
    };
  }, [elems, nivelMuro, catDrywall, catLadrillo, catOsb, obra]);

  // ---- Metrado total ----
  const totales = useMemo(() => {
    let concretoM3 = 0, aceroKg = 0, encofradoM2 = 0;
    const metrosDiam: Record<string, number> = {};
    const porTipo: Record<string, { n: number; concreto: number; acero: number }> = {};
    elems.forEach(e => {
      if (e.tipo === 'muro') return;
      const r = calcElem(e);
      concretoM3 += r.concretoM3; aceroKg += r.aceroKg; encofradoM2 += r.encofradoM2;
      if (r.dist) for (const [d, frac] of Object.entries(r.dist)) {
        const kg = r.aceroKg * frac;
        metrosDiam[d] = (metrosDiam[d] || 0) + kg / (DIAMETROS_KGM[d] || 1);
      }
      const k = e.tipo;
      if (!porTipo[k]) porTipo[k] = { n: 0, concreto: 0, acero: 0 };
      porTipo[k].n++; porTipo[k].concreto += r.concretoM3; porTipo[k].acero += r.aceroKg;
    });
    const varillas = Object.entries(metrosDiam).map(([d, m]) => ({ d, varillas: Math.ceil(m / LARGO_VARILLA_M) }))
      .sort((a, b) => (DIAMETROS_KGM[b.d] || 0) - (DIAMETROS_KGM[a.d] || 0));
    const cementoBolsas = concretoM3 * 9.5, arenaM3 = concretoM3 * 0.54, piedraM3 = concretoM3 * 0.55, aguaL = concretoM3 * 180;
    const costo = Math.ceil(cementoBolsas) * precios.cementoBolsa + arenaM3 * precios.arenaM3 + piedraM3 * precios.piedraM3 + aceroKg * precios.aceroKg + encofradoM2 * precios.encofradoM2;
    return { concretoM3, aceroKg, encofradoM2, cementoBolsas, arenaM3, piedraM3, aguaL, costo, varillas, porTipo };
  }, [elems, precios]);

  const exportar = () => {
    let txt = `INNOVA CONTRATISTAS — OBRA CIVIL (PLANO CAD)\nFecha: ${new Date().toLocaleDateString('es-PE')}\n`;
    txt += `============================================================\n`;
    Object.entries(totales.porTipo).forEach(([t, v]) => {
      txt += `${META[t as PlanoTipo].nombre}: ${v.n} u. · ${v.concreto.toFixed(2)} m³ · ${v.acero.toFixed(0)} kg acero\n`;
    });
    txt += `\n--- TOTALES ---\nConcreto: ${totales.concretoM3.toFixed(2)} m³ | Acero: ${totales.aceroKg.toFixed(0)} kg | Encofrado: ${totales.encofradoM2.toFixed(1)} m²\n`;
    txt += `Cemento: ${Math.ceil(totales.cementoBolsas)} bolsas | Arena: ${totales.arenaM3.toFixed(2)} m³ | Piedra: ${totales.piedraM3.toFixed(2)} m³ | Agua: ${Math.round(totales.aguaL)} L\n`;
    txt += `COSTO REFERENCIAL: S/ ${totales.costo.toFixed(2)}\n`;
    const muros = elems.filter(e => e.tipo === 'muro');
    if (muros.length) {
      txt += `\n--- MUROS POR PISO ---\n`;
      [...new Set(muros.map(e => e.nivel || pisos[0] || 'Piso 1'))].forEach(n => {
        txt += `${n}:\n`;
        muros.filter(e => (e.nivel || pisos[0] || 'Piso 1') === n).forEach(e => {
          const m = muroDesdePlano(e, obra.ctx(e.nivel)); const r = calcMuro(m, catDrywall, catLadrillo, catOsb);
          txt += `  ${r.nombre} · ${m.areaM2.toFixed(2)} m² (sin vanos) · ${m.tipo === 'ladrillo' ? `${r.unidades} ladrillos` : `${r.unidades.toFixed(1)} m² placa`} · S/ ${r.costo.toFixed(2)}\n`;
          (e.aberturas || []).forEach(a => { txt += `    - ${PRESETS_ABERTURA[a.tipo].nombre} ${a.w.toFixed(2)} × ${a.h.toFixed(2)} m\n`; });
        });
        const ctx = obra.ctx(n);
        const ms = muros.filter(e => (e.nivel || pisos[0] || 'Piso 1') === n);
        detectarAmbientes(ms).forEach((a, i) => { txt += `  Ambiente: ${nombresAmb[`${n}#${a.key}`] || `Ambiente ${i + 1}`} · ${a.area.toFixed(2)} m²\n`; });
        const cfg = cielos[n];
        if (cfg?.activo) {
          const mc = mallaCielo(regionesCielo(ms, estructura, ctx.base), cfg, ctx);
          const d = catDrywall.find(x => x.id === cfg.materialId);
          txt += `  Cielo raso ${d?.tipo || 'drywall'} (${cfg.modo}) · ${mc.area.toFixed(2)} m² · perímetro ${mc.perimetro.toFixed(1)} m · S/ ${(mc.area * (d?.precioM2 || 0)).toFixed(2)}\n`;
        }
      });
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = `plano_cimentacion_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const HERRAMIENTAS: { id: Herramienta; label: string; icon: any }[] = [
    { id: 'select', label: 'Seleccionar', icon: MousePointer },
    { id: 'columna', label: 'Columna', icon: Columns },
    { id: 'zapata', label: 'Zapata', icon: Square },
    { id: 'viga', label: 'Viga', icon: Minus },
    { id: 'cimiento', label: 'Cimiento', icon: Minus },
    { id: 'losa', label: 'Losa / Entrepiso', icon: Layers },
    { id: 'muro', label: 'Muro', icon: BrickWall },
    { id: 'abertura', label: 'Abertura', icon: DoorOpen },
    { id: 'bloque', label: 'Bloques', icon: Armchair },
    { id: 'pan', label: 'Mover lienzo', icon: Hand },
  ].filter(t => !esDrywall || ['select', 'muro', 'abertura', 'bloque', 'pan'].includes(t.id)) as { id: Herramienta; label: string; icon: any }[];

  const canUndo = undoRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;
  void histVer; // re-render al cambiar el historial

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      {/* Estructura de Techos vinculada */}
      <div className="flex items-center gap-2 px-2 py-2 bg-white border-b border-slate-100 flex-wrap">
        <span className="text-[11px] font-bold text-slate-500">Estructura (Techos Metálicos)</span>
        <select value={techosId} onChange={e => setTechosId(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none max-w-[260px]">
          <option value="">— Sin estructura —</option>
          {disenos.map(d => <option key={d.id} value={d.id}>{d.nombre}{d.updatedAt ? ` · ${d.updatedAt}` : ''}</option>)}
        </select>
        {estructura && onEditarEnTechos && (
          <button onClick={() => disenoVinculado && onEditarEnTechos(disenoVinculado)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100">
            Editar en Techos
          </button>
        )}
        {estructura && !esDrywall && (
          <button onClick={cimentacionAutomatica} title="Zapata bajo cada columna y cimiento corrido entre columnas vecinas"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 cursor-pointer hover:bg-amber-100">
            <Square className="w-3.5 h-3.5" /> Cimentación bajo columnas
          </button>
        )}
        {estructura && (
          <span className="text-[11px] text-slate-400">{Object.keys(estructura.segments || {}).length} perfiles · {Object.keys(estructura.coverageZones || {}).length} coberturas{tanques.length ? ` · ${tanques.length} tanque${tanques.length > 1 ? 's' : ''}` : ''}{caidas.length ? ` · caída: ${[...new Set(caidas.map(c => NOMBRE_CAIDA[nombreDireccion(c.dx, c.dz)]))].join(' y ')}` : ''}</span>
        )}
        {estructura && (
          <div className="flex items-center gap-1 flex-wrap">
            {(Object.keys(CAPAS) as CapaEstructura[]).filter(k => plantaTechos.conteo[k]).map(k => {
              const oculta = capasOcultas.includes(k);
              return (
                <button key={k} onClick={() => setCapasOcultas(prev => oculta ? prev.filter(x => x !== k) : [...prev, k])} title={oculta ? 'Mostrar' : 'Ocultar'}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${oculta ? 'bg-slate-50 text-slate-300 line-through' : 'bg-slate-100 text-slate-600'}`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: oculta ? '#cbd5e1' : CAPAS[k].color }} />
                  {CAPAS[k].nombre} {plantaTechos.conteo[k]}
                </button>
              );
            })}
          </div>
        )}
        {!estructura && disenos.length === 0 && <span className="text-[11px] text-slate-400">Guarda un diseño en Techos Metálicos para verlo aquí.</span>}
      </div>
      {/* Barra de herramientas */}
      <div className="flex items-center gap-1.5 p-2 bg-white border-b border-slate-200 flex-wrap">
        {HERRAMIENTAS.map(t => {
          const Ic = t.icon;
          const act = tool === t.id;
          const col = (t.id in META) ? META[t.id as PlanoTipo].color : t.id === 'abertura' ? '#0284c7' : '#334155';
          return (
            <button key={t.id} onClick={() => { setTool(t.id); setPending(null); }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                act ? 'text-white border-transparent shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              style={act ? { backgroundColor: col } : undefined}>
              <Ic className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
        <div className="h-5 w-px bg-slate-200 mx-1" />
        {/* Piso activo para muros + material del próximo muro */}
        <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          Piso
          <select value={nivelMuro} onChange={e => setNivelMuro(e.target.value)}
            className="px-2 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none">
            {(pisos.length ? pisos : ['Piso 1']).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {tool === 'abertura' && (
          <select value={tipoAbertura} onChange={e => setTipoAbertura(e.target.value as TipoAbertura)}
            className="px-2 py-1.5 rounded-xl bg-sky-50 text-xs font-bold text-sky-800 cursor-pointer focus:outline-none">
            {(Object.keys(PRESETS_ABERTURA) as TipoAbertura[]).map(k => <option key={k} value={k}>{PRESETS_ABERTURA[k].nombre} · {PRESETS_ABERTURA[k].w}×{PRESETS_ABERTURA[k].h}</option>)}
          </select>
        )}
        {tool === 'muro' && (
          <select
            value={`${materialMuro.material}:${materialMuro.materialId}`}
            onChange={e => { const [material, materialId] = e.target.value.split(':') as [MaterialMuro, string]; setMaterialMuro({ material, materialId }); }}
            className="px-2 py-1.5 rounded-xl bg-orange-50 text-xs font-bold text-orange-800 cursor-pointer focus:outline-none max-w-[200px]">
            {!esDrywall && <optgroup label="Ladrillo">{catLadrillo.map(l => <option key={l.id} value={`ladrillo:${l.id}`}>{l.tipo}</option>)}</optgroup>}
            <optgroup label="Drywall">{catDrywall.map(d => <option key={d.id} value={`drywall:${d.id}`}>{d.tipo}</option>)}</optgroup>
            <optgroup label="OSB">{catOsb.map(d => <option key={d.id} value={`osb:${d.id}`}>{d.tipo}</option>)}</optgroup>
          </select>
        )}
        <div className="h-5 w-px bg-slate-200 mx-1" />
        {/* Deshacer / Rehacer */}
        <button onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 disabled:opacity-35 disabled:cursor-default">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 disabled:opacity-35 disabled:cursor-default">
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={encuadrar} disabled={elems.length === 0 && !plantaTechos.lineas.length} title="Encuadrar (ver todo)"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 disabled:opacity-35 disabled:cursor-default">
          <Maximize className="w-3.5 h-3.5" />
        </button>
        <div className="h-5 w-px bg-slate-200 mx-1" />
        {(selUid || selAb || selBloque) && (
          <button onClick={() => selBloque ? (setBloques(prev => prev.filter(x => x.uid !== selBloque)), setSelBloque(null)) : selAb ? removeAbertura(selAb.uid, selAb.id) : removeSel()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        )}
        <button onClick={() => { if (confirm('¿Vaciar el plano?')) { commit([]); setSelUid(null); setSelNode(null); } }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-500 border border-slate-200 cursor-pointer hover:bg-slate-100">
          <Trash2 className="w-3.5 h-3.5" /> Vaciar
        </button>
        <button onClick={exportar} disabled={elems.length === 0}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black bg-stone-700 text-white cursor-pointer hover:bg-stone-800 disabled:opacity-40">
          <Download className="w-3.5 h-3.5" /> Exportar
        </button>
        {!vista3d && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded-lg">
            <Grid3x3 className="w-3.5 h-3.5" /> {cursor.x.toFixed(2)}, {cursor.y.toFixed(2)} m
          </span>
        )}
        {/* Toggle 2D / 3D */}
        <div className="ml-auto inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
          <button onClick={() => setVista3d(false)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${!vista3d ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
            <Layers className="w-3.5 h-3.5" /> 2D
          </button>
          <button onClick={() => setVista3d(true)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${vista3d ? 'bg-stone-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
            <Eye className="w-3.5 h-3.5" /> 3D
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* VISTA 3D */}
        {vista3d ? (
          <div className="relative flex-1 min-h-[320px] overflow-hidden bg-slate-100">
            <ConcretoViewer3D key={`${sig3d}|${JSON.stringify(bloques)}|${techosId}|${estructura?.updatedAt || ''}|${verTecho}|${hastaPiso}|${capasOcultas.join(',')}|${JSON.stringify(sobrepechos)}|${resaltar}|${verCimentacion}`} resaltarPerfiles={resaltar} verCimentacion={verCimentacion} claveCamara={techosId || 'obra'} bloques={bloques} elems={elems} niveles={niveles} estructura={estructura} cielos={cielos} verTecho={verTecho} hastaPiso={hastaPiso} capasOcultas={capasOcultas} sobrepechos={sobrepechos} />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setVerTecho(v => !v)} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-xs ${verTecho ? 'bg-slate-100 text-slate-700' : 'bg-stone-700 text-white'}`}>
                {verTecho ? 'Ocultar techo' : 'Mostrar techo'}
              </button>
              <select value={hastaPiso} onChange={e => setHastaPiso(e.target.value)} className="px-2 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 shadow-xs cursor-pointer focus:outline-none">
                <option value="">Todos los pisos</option>
                {pisos.map(n => <option key={n} value={n}>Hasta {n}</option>)}
              </select>
              <button onClick={() => setVerCimentacion(v => !v)} title="Suelo transparente: mira zapatas y cimientos desde abajo"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-xs ${verCimentacion ? 'bg-stone-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {verCimentacion ? 'Ocultar cimentación' : 'Ver cimentación'}
              </button>
              {estructura && (
                <button onClick={() => setResaltar(v => !v)} title="Las secciones se dibujan a su medida real; resaltado las multiplica ×3 solo para verlas mejor"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow-xs ${resaltar ? 'bg-stone-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  Perfiles: {resaltar ? 'resaltado ×3' : 'tamaño real'}
                </button>
              )}
            </div>
            {elems.length === 0 && !estructura && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-bold">Dibuja en 2D para ver el 3D</div>
            )}
            <div className="absolute bottom-3 left-3 text-[10px] font-bold text-slate-500 bg-white/90 rounded-lg px-2 py-1 border border-slate-200 pointer-events-none">
              Arrastra: girar · clic derecho, Shift o 2 dedos: mover · rueda o pellizco: zoom
            </div>
          </div>
        ) : (
        /* LIENZO 2D */
        <div
          ref={containerRef}
          className={`relative flex-1 min-h-[320px] overflow-hidden bg-slate-50 select-none ${tool === 'pan' || isPanning ? 'cursor-grab' : (dragNode.current ? 'cursor-grabbing' : 'cursor-crosshair')}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClick={onClick}
          onWheel={onWheel}
          onContextMenu={e => e.preventDefault()}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <pattern id="pc-grid" width={scale * (1 / 4)} height={scale * (1 / 4)} patternUnits="userSpaceOnUse" patternTransform={`translate(${cx % (scale / 4)}, ${cy % (scale / 4)})`}>
                <path d={`M ${scale / 4} 0 L 0 0 0 ${scale / 4}`} fill="none" stroke="#e2e8f0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pc-grid)" />
            {/* ejes */}
            <line x1={0} y1={cy} x2={dims.w} y2={cy} stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1={cx} y1={0} x2={cx} y2={dims.h} stroke="#cbd5e1" strokeWidth="1.5" />

            {/* estructura de Techos (referencia, no editable aquí): ancho real del perfil y color por capa */}
            {plantaTechos.lineas.filter(l => !capasOcultas.includes(l.capa)).sort((p, q) => Number(p.col) - Number(q.col)).map((l, i) => {
              const a = toScreen(l.x1, l.z1), b = toScreen(l.x2, l.z2);
              const color = CAPAS[l.capa].color;
              if (l.col) {
                const w = Math.max(8, l.ancho * scale), h = Math.max(8, l.alto * scale);
                return <rect key={`tl${i}`} x={a.sx - w / 2} y={a.sy - h / 2} width={w} height={h} fill={l.capa === 'columnas' ? '#475569' : color} opacity={0.8} style={{ pointerEvents: 'none' }} />;
              }
              return <line key={`tl${i}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={color} strokeWidth={Math.max(1.2, l.ancho * scale)} strokeLinecap="square" opacity={0.32} style={{ pointerEvents: 'none' }} />;
            })}

            {/* caída del agua en cada paño del techo */}
            {caidas.map((c, i) => {
              const o = toScreen(c.cx, c.cz), L = 46;
              const fx = o.sx + c.dx * L, fy = o.sy + c.dz * L;
              const ang = Math.atan2(c.dz, c.dx);
              const ala = (s2: number) => `${fx - 9 * Math.cos(ang + s2)},${fy - 9 * Math.sin(ang + s2)}`;
              return (
                <g key={`cd${i}`} style={{ pointerEvents: 'none' }} opacity={0.85}>
                  <line x1={o.sx - c.dx * L} y1={o.sy - c.dz * L} x2={fx} y2={fy} stroke="#0284c7" strokeWidth={3.5} />
                  <polygon points={`${fx + c.dx * 6},${fy + c.dz * 6} ${ala(0.5)} ${ala(-0.5)}`} fill="#0284c7" />
                  <rect x={o.sx - 34 - c.dz * 30} y={o.sy - 9} width={68} height={18} rx={9} fill="#e0f2fe" opacity={0.95} />
                  <text x={o.sx - c.dz * 30} y={o.sy + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#0369a1">caída {c.pendientePct}%</text>
                </g>
              );
            })}

            {/* tanques elevados de la estructura */}
            {tanques.map(t => { const c = toScreen(t.x, t.z); return (
              <g key={t.id} style={{ pointerEvents: 'none' }}>
                <rect x={c.sx - (t.lado / 2) * scale} y={c.sy - (t.lado / 2) * scale} width={t.lado * scale} height={t.lado * scale} fill="none" stroke="#64748b" strokeWidth={1} strokeDasharray="4 3" />
                <circle cx={c.sx} cy={c.sy} r={(t.diametro / 2) * scale} fill="#e2e8f0" stroke="#475569" strokeWidth={1.2} />
                <text x={c.sx} y={c.sy - 2} textAnchor="middle" fontSize={11} fontWeight={900} fill="#0f172a">T{t.numero}</text>
                <text x={c.sx} y={c.sy + 10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#334155">{t.litros} L</text>
              </g>
            ); })}

            {/* ambientes del piso activo */}
            {ambientes.map((a, i) => {
              const c = toScreen(a.cx, a.cy);
              const tonos = ['#fef3c7', '#dcfce7', '#e0f2fe', '#fce7f3', '#ede9fe', '#ffedd5'];
              return (
                <g key={a.key} style={{ pointerEvents: 'none' }}>
                  <polygon points={a.poly.map(p => { const q = toScreen(p.x, p.y); return `${q.sx},${q.sy}`; }).join(' ')} fill={tonos[i % tonos.length]} opacity={0.75} />
                  <text x={c.sx} y={c.sy - 3} textAnchor="middle" fontSize={11} fontWeight={800} fill="#334155">{a.nombre}</text>
                  <text x={c.sx} y={c.sy + 10} textAnchor="middle" fontSize={10} fontWeight={600} fill="#64748b">{a.area.toFixed(2)} m²</text>
                </g>
              );
            })}

            {/* elementos */}
            {elems.map(e => {
              const m = META[e.tipo];
              const p1 = toScreen(e.x1, e.y1);
              const sel = e.uid === selUid;
              const con = uidsConectados.has(e.uid);
              // LOSA: rectángulo relleno entre esquinas (x1,y1)-(x2,y2)
              if (e.tipo === 'losa' && e.x2 !== undefined && e.y2 !== undefined) {
                const p2 = toScreen(e.x2, e.y2);
                const rx = Math.min(p1.sx, p2.sx), ry = Math.min(p1.sy, p2.sy);
                const rw = Math.abs(p2.sx - p1.sx), rh = Math.abs(p2.sy - p1.sy);
                return (
                  <g key={e.uid} onClick={ev => { if (tool !== 'select') return; ev.stopPropagation(); if (!didDrag.current) { setSelUid(e.uid); setSelNode(null); } }} className="cursor-pointer">
                    <rect x={rx} y={ry} width={rw} height={rh} fill={m.color} opacity={0.18} stroke={m.color} strokeWidth={sel ? 3 : 1.5} strokeDasharray="6 4" />
                    {(sel || con) && <rect x={rx - 3} y={ry - 3} width={rw + 6} height={rh + 6} fill="none" stroke="#0ea5e9" strokeWidth="2" />}
                  </g>
                );
              }
              if (e.tipo === 'muro' && e.x2 !== undefined && e.y2 !== undefined) {
                const p2 = toScreen(e.x2, e.y2);
                const wPx = Math.max(5, e.a * scale);
                const otroPiso = (e.nivel || pisos[0]) !== nivelMuro;
                const col = COLOR_MURO[e.material || 'ladrillo'];
                const L = largoMuro(e), ux = (e.x2 - e.x1) / (L || 1), uy = (e.y2 - e.y1) / (L || 1);
                // Punto a t m del inicio y n m hacia un costado (en px de pantalla).
                const P = (t: number, n = 0) => ({ x: p1.sx + (ux * t - uy * n) * scale, y: p1.sy + (uy * t + ux * n) * scale });
                // Tramos llenos entre aberturas (en metros a lo largo del muro).
                const abs = [...(e.aberturas || [])].sort((a, b) => a.t - b.t);
                const tramos: [number, number][] = [];
                let t0 = 0;
                abs.forEach(a => { const ini = Math.max(t0, a.t - a.w / 2); if (ini > t0 + 0.005) tramos.push([t0, ini]); t0 = Math.max(t0, a.t + a.w / 2); });
                if (L > t0 + 0.005) tramos.push([t0, L]);
                return (
                  <g key={e.uid} opacity={otroPiso ? 0.22 : 1} onClick={ev => { if (tool !== 'select') return; ev.stopPropagation(); if (!didDrag.current) { setSelUid(e.uid); setSelNode(null); setSelAb(null); if (otroPiso && e.nivel) setNivelMuro(e.nivel); } }} className="cursor-pointer">
                    {tramos.map(([a, b], i) => { const A = P(a), B = P(b); return (
                      <g key={i}>
                        <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col} strokeWidth={wPx} strokeLinecap="butt" />
                        {e.material !== 'drywall' && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#fff7ed" strokeWidth={Math.max(1, wPx * 0.18)} strokeDasharray="7 5" />}
                      </g>
                    ); })}
                    {!otroPiso && abs.map(a => {
                      const iz = a.t - a.w / 2, de = a.t + a.w / 2, r = a.w * scale;
                      const marcada = selAb?.uid === e.uid && selAb.id === a.id;
                      const A = P(iz), B = P(de), C = P(a.t);
                      const ext = (t: number, n: number) => P(t, n);
                      return (
                        <g key={a.id} style={{ pointerEvents: 'none' }}>
                          {/* jambas */}
                          {[A, B].map((q, k) => <line key={k} x1={q.x - uy * wPx / 2} y1={q.y + ux * wPx / 2} x2={q.x + uy * wPx / 2} y2={q.y - ux * wPx / 2} stroke="#475569" strokeWidth={1.2} />)}
                          {a.tipo === 'puerta' && (() => { const H = ext(iz, a.w); return (<>
                            <line x1={A.x} y1={A.y} x2={H.x} y2={H.y} stroke="#334155" strokeWidth={2} />
                            <path d={`M ${H.x} ${H.y} A ${r} ${r} 0 0 0 ${B.x} ${B.y}`} fill="none" stroke="#64748b" strokeWidth={1} strokeDasharray="4 3" />
                          </>); })()}
                          {a.tipo === 'puerta_doble' && (() => { const H1 = ext(iz, a.w / 2), H2 = ext(de, a.w / 2); return (<>
                            <line x1={A.x} y1={A.y} x2={H1.x} y2={H1.y} stroke="#334155" strokeWidth={2} />
                            <line x1={B.x} y1={B.y} x2={H2.x} y2={H2.y} stroke="#334155" strokeWidth={2} />
                            <path d={`M ${H1.x} ${H1.y} A ${r / 2} ${r / 2} 0 0 0 ${C.x} ${C.y}`} fill="none" stroke="#64748b" strokeWidth={1} strokeDasharray="4 3" />
                            <path d={`M ${H2.x} ${H2.y} A ${r / 2} ${r / 2} 0 0 1 ${C.x} ${C.y}`} fill="none" stroke="#64748b" strokeWidth={1} strokeDasharray="4 3" />
                          </>); })()}
                          {esVidrio(a.tipo) && (<>
                            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={a.tipo === 'mampara' ? '#7dd3fc' : '#e0f2fe'} strokeWidth={wPx * 0.8} />
                            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#0284c7" strokeWidth={1.4} />
                          </>)}
                          {a.tipo === 'vano' && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />}
                          {marcada && <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#0ea5e9" strokeWidth={wPx + 8} opacity={0.3} />}
                          {a.carpiId && <text x={C.x - uy * (wPx + 10)} y={C.y + ux * (wPx + 10) + 3} textAnchor="middle" fontSize={9} fontWeight={800} fill="#0369a1">{a.carpiNombre || 'CarpiMetal'}</text>}
                        </g>
                      );
                    })}
                    {(sel || con) && <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#0ea5e9" strokeWidth={wPx + 4} opacity={0.35} />}
                  </g>
                );
              }
              if (m.esLinea && e.x2 !== undefined && e.y2 !== undefined) {
                const p2 = toScreen(e.x2, e.y2);
                const wPx = Math.max(4, (e.a) * scale);
                return (
                  <g key={e.uid} onClick={ev => { if (tool !== 'select') return; ev.stopPropagation(); if (!didDrag.current) { setSelUid(e.uid); setSelNode(null); } }} className="cursor-pointer">
                    <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke={m.color} strokeWidth={wPx} strokeLinecap="round" opacity={0.85} />
                    {(sel || con) && <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#0ea5e9" strokeWidth={wPx + 4} strokeLinecap="round" opacity={0.35} />}
                  </g>
                );
              }
              // punto (columna / zapata)
              const sPx = Math.max(10, (e.a) * scale);
              return (
                <g key={e.uid} onClick={ev => { if (tool !== 'select') return; ev.stopPropagation(); if (!didDrag.current) { setSelUid(e.uid); setSelNode(null); } }} className="cursor-pointer">
                  {(sel || con) && <rect x={p1.sx - sPx / 2 - 3} y={p1.sy - sPx / 2 - 3} width={sPx + 6} height={sPx + 6} rx="3" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />}
                  <rect x={p1.sx - sPx / 2} y={p1.sy - sPx / 2} width={sPx} height={sPx} rx="2" fill={m.color} opacity={e.tipo === 'zapata' ? 0.35 : 0.9} stroke={m.color} strokeWidth="1.5" />
                  {e.tipo === 'zapata' && <rect x={p1.sx - 5} y={p1.sy - 5} width={10} height={10} rx="1" fill={META.columna.color} />}
                </g>
              );
            })}

            {/* preview de línea / rectángulo pendiente */}
            {pending && META[tool as PlanoTipo]?.esLinea && (() => {
              const a = toScreen(pending.x, pending.y);
              const b = toScreen(cursor.x, cursor.y);
              const col = META[tool as PlanoTipo].color;
              if (tool === 'losa') {
                const rx = Math.min(a.sx, b.sx), ry = Math.min(a.sy, b.sy);
                return <rect x={rx} y={ry} width={Math.abs(b.sx - a.sx)} height={Math.abs(b.sy - a.sy)} fill={col} opacity={0.15} stroke={col} strokeWidth="2" strokeDasharray="6 4" />;
              }
              return <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} stroke={col} strokeWidth="2" strokeDasharray="5 4" opacity={0.7} />;
            })()}

            {/* bloques a escala: diseños de CarpiMetal y muebles */}
            {bloques.map(b => {
              const otroPiso = (b.nivel || pisos[0]) !== nivelMuro;
              const c = toScreen(b.x, b.y);
              const sel = b.uid === selBloque;
              const prims: Prim2D[] = b.origen === 'mueble' ? (muebleDe(b.refId)?.planta || []) : plantaCarpi(geomCarpi.get(b.refId) || { ancho: b.ancho, alto: b.alto, fondo: b.fondo, barras: [], paneles: [] });
              const col = b.origen === 'carpi' ? '#0369a1' : '#475569';
              const ns = { vectorEffect: 'non-scaling-stroke' as const };
              return (
                <g key={b.uid} opacity={otroPiso ? 0.18 : 1} style={{ pointerEvents: 'none' }}>
                  <g transform={`translate(${c.sx} ${c.sy}) rotate(${b.rot}) scale(${scale}) translate(${-b.ancho / 2} ${-b.fondo / 2})${b.espejo ? ` translate(${b.ancho} 0) scale(-1 1)` : ''}`}>
                    <rect x={0} y={0} width={b.ancho} height={b.fondo} fill={b.origen === 'carpi' ? '#e0f2fe' : '#ffffff'} fillOpacity={b.origen === 'carpi' ? 0.45 : 0.9}
                      stroke={sel ? '#e11d48' : col} strokeWidth={sel ? 2.2 : 1} strokeDasharray={b.origen === 'carpi' ? '4 3' : undefined} {...ns} />
                    {prims.map((q, i) => q.t === 'rect' ? <rect key={i} x={q.u} y={q.v} width={q.w} height={q.h} rx={q.r || 0} fill={q.relleno ? col : 'none'} stroke={col} strokeWidth={1.1} {...ns} />
                      : q.t === 'circ' ? <circle key={i} cx={q.u} cy={q.v} r={q.r} fill="none" stroke={col} strokeWidth={1.1} {...ns} />
                      : q.t === 'elip' ? <ellipse key={i} cx={q.u} cy={q.v} rx={q.rx} ry={q.ry} fill="none" stroke={col} strokeWidth={1.1} {...ns} />
                      : q.grosor ? <line key={i} x1={q.u1} y1={q.v1} x2={q.u2} y2={q.v2} stroke={col} strokeWidth={Math.max(q.grosor, 1.6 / scale)} strokeLinecap="square" />
                      : <line key={i} x1={q.u1} y1={q.v1} x2={q.u2} y2={q.v2} stroke={col} strokeWidth={1} {...ns} />)}
                  </g>
                  {!otroPiso && Math.min(b.ancho, b.fondo) * scale > 22 && Math.max(b.ancho, b.fondo) * scale > 60 && (
                    <text x={c.sx} y={c.sy + 3} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={sel ? '#e11d48' : col} stroke="#fff" strokeWidth={3} paintOrder="stroke">
                      {b.nombre}{b.origen === 'carpi' && !b.incluir ? ' (no incluido)' : ''}
                    </text>
                  )}
                </g>
              );
            })}

            {/* NODOS compartidos (manijas). Visibles al seleccionar o dibujar. */}
            {(tool === 'select' || tool !== 'pan') && nodos.map(n => {
              const s = toScreen(n.x, n.y);
              const isSel = n.id === selNode;
              const shared = n.refs > 1;              // nodo que une 2+ elementos
              if (!shared && tool !== 'select' && !isSel) return null;
              return (
                <circle key={n.id} cx={s.sx} cy={s.sy} r={isSel ? 6 : (shared ? 4.5 : 3.5)}
                  fill={isSel ? '#0ea5e9' : (shared ? '#ffffff' : '#ffffff')}
                  stroke={isSel ? '#0369a1' : (shared ? '#0ea5e9' : '#94a3b8')}
                  strokeWidth={isSel ? 2.5 : 1.8}
                  opacity={tool === 'select' ? 1 : 0.55}
                  style={{ pointerEvents: 'none' }} />
              );
            })}

            {/* cursor fantasma (resalta cuando se imanta a un nodo) */}
            {tool !== 'select' && tool !== 'pan' && (() => {
              const c = toScreen(cursor.x, cursor.y);
              const col = META[tool as PlanoTipo]?.color || '#334155';
              return (
                <g style={{ pointerEvents: 'none' }}>
                  {cursor.onNode && <circle cx={c.sx} cy={c.sy} r="9" fill="none" stroke="#0ea5e9" strokeWidth="2" />}
                  {tool === 'bloque' && aColocar && (() => { const m = aColocar.origen === 'mueble' ? muebleDe(aColocar.refId) : geomCarpi.get(aColocar.refId); return m ? <rect x={c.sx - (m.ancho * scale) / 2} y={c.sy - (m.fondo * scale) / 2} width={m.ancho * scale} height={m.fondo * scale} fill="#0ea5e9" fillOpacity={0.08} stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray="5 4" /> : null; })()}
                  <circle cx={c.sx} cy={c.sy} r="4" fill={cursor.onNode ? '#0ea5e9' : col} opacity={0.75} />
                </g>
              );
            })()}
          </svg>

          {elems.length === 0 && !estructura && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-400 max-w-xs px-4">
                <p className="font-bold text-sm">Dibuja tu plano de cimentación</p>
                <p className="text-xs mt-1">Elige <b>Columna</b> o <b>Zapata</b> y haz clic para colocarlas. Para <b>Viga</b>, <b>Cimiento</b>, <b>Losa</b> o <b>Muro</b>, haz clic en el inicio y luego en el fin.</p>
                <p className="text-[11px] mt-2 text-slate-400">Con <b>Seleccionar</b> puedes arrastrar los <b>nodos</b> (puntos) y todo lo conectado se mueve junto.</p>
              </div>
            </div>
          )}

          {/* zoom */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button onClick={() => setZoom(z => Math.min(4, z * 1.15))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-xs text-slate-700 cursor-pointer hover:bg-slate-100 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            <button onClick={() => setZoom(z => Math.max(0.3, z * 0.87))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-xs text-slate-700 cursor-pointer hover:bg-slate-100 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
          </div>

          {(tool === 'abertura' || tool === 'bloque' || aviso) && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-sky-800 bg-sky-50/95 rounded-lg px-2.5 py-1 pointer-events-none">
              {aviso || (tool === 'bloque' ? (aColocar ? `Clic en ${nivelMuro} para colocar: ${aColocar.origen === 'mueble' ? muebleDe(aColocar.refId)?.nombre : disenosCarpi.find(d => d.id === aColocar.refId)?.nombre}` : 'Elige un bloque en el panel de la derecha') : `Clic sobre un muro de ${nivelMuro} para colocar: ${PRESETS_ABERTURA[tipoAbertura].nombre}`)}
            </div>
          )}
          {/* pista de nodos */}
          {tool === 'select' && nodos.length > 0 && (
            <div className="absolute top-3 left-3 text-[10px] font-bold text-slate-500 bg-white/90 rounded-lg px-2 py-1 border border-slate-200 pointer-events-none">
              Arrastra un nodo para mover todo lo conectado
            </div>
          )}
        </div>
        )}

        {/* PANEL DE METRADO + PROPIEDADES */}
        <div className="lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white p-3 space-y-3 overflow-y-auto">
          {/* Biblioteca de bloques (herramienta Bloques) */}
          {tool === 'bloque' && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3 space-y-2.5">
              <p className="text-xs font-black text-sky-800 uppercase tracking-wide">Bloques a escala</p>
              <p className="text-[10px] text-slate-500">Elige uno y haz clic en el plano. Cerca de un muro se pega y se gira solo.</p>
              <p className="text-[10px] font-black text-slate-400 uppercase">Mis diseños de CarpiMetal</p>
              {disenosCarpi.length === 0 && <p className="text-[10px] text-slate-400">Guarda una mesa, reja, baranda, portón o puerta en CarpiMetal para colocarla aquí.</p>}
              <div className="grid grid-cols-1 gap-1">
                {disenosCarpi.map(d => { const g = geomCarpi.get(d.id); const act = aColocar?.origen === 'carpi' && aColocar.refId === d.id; return (
                  <button key={d.id} onClick={() => setAColocar({ origen: 'carpi', refId: d.id })}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border ${act ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-200 hover:border-sky-400'}`}>
                    {d.nombre}<span className={`block text-[10px] font-semibold ${act ? 'text-sky-100' : 'text-slate-400'}`}>{NOMBRE_TIPO_CARPI[d.tipoElemento] || d.tipoElemento}{g ? ` · ${g.ancho.toFixed(2)} × ${g.fondo.toFixed(2)} m` : ''}{SUELTOS.has(d.tipoElemento) ? '' : ' · mejor en un vano'}</span>
                  </button>
                ); })}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase pt-1">Muebles de referencia (no suman costo)</p>
              <div className="grid grid-cols-2 gap-1">
                {MUEBLES.map(m => { const act = aColocar?.origen === 'mueble' && aColocar.refId === m.id; return (
                  <button key={m.id} onClick={() => setAColocar({ origen: 'mueble', refId: m.id })}
                    className={`text-left px-2 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border ${act ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'}`}>
                    {m.emoji} {m.nombre}<span className={`block text-[9px] font-semibold ${act ? 'text-slate-300' : 'text-slate-400'}`}>{m.ancho} × {m.fondo} m</span>
                  </button>
                ); })}
              </div>
            </div>
          )}

          {/* Bloque seleccionado */}
          {selBloque && (() => { const b = bloques.find(x => x.uid === selBloque); if (!b) return null; const d = b.origen === 'carpi' ? disenosCarpi.find(x => x.id === b.refId) : null; return (
            <div className="rounded-2xl border border-sky-200 bg-white p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-sky-800 uppercase tracking-wide truncate">{b.origen === 'carpi' ? 'CarpiMetal' : 'Mueble'} · {b.nombre}</span>
                <button onClick={() => { setBloques(prev => prev.filter(x => x.uid !== b.uid)); setSelBloque(null); }} className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Quitar bloque"><Trash2 className="w-4 h-4" /></button>
              </div>
              <p className="text-[11px] font-bold text-slate-500">{b.ancho.toFixed(2)} × {b.fondo.toFixed(2)} m en planta · {b.alto.toFixed(2)} m de alto</p>
              <div className="flex gap-1.5">
                <button onClick={() => updBloque(b.uid, { rot: (b.rot + 90) % 360 })} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200"><RotateCw className="w-3.5 h-3.5" /> Girar 90°</button>
                <button onClick={() => updBloque(b.uid, { espejo: !b.espejo })} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-200"><FlipHorizontal2 className="w-3.5 h-3.5" /> Espejo</button>
              </div>
              <label className="block text-[10px] font-bold text-slate-600">Piso
                <select value={b.nivel || pisos[0]} onChange={e => updBloque(b.uid, { nivel: e.target.value })} className="mt-0.5 w-full px-2 py-1 rounded-lg bg-slate-50 text-xs focus:outline-none">
                  {(pisos.length ? pisos : ['Piso 1']).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              {b.origen === 'carpi' && (
                <label className="flex items-start gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={b.incluir} onChange={e => updBloque(b.uid, { incluir: e.target.checked })} />
                  <span>Incluir en la cotización{d ? ` · S/ ${costoDisenoCarpi(d).toFixed(2)}` : ''}<span className="block text-[10px] font-semibold text-slate-400">Si no lo fabricas tú, desmárcalo y explica por qué en la observación.</span></span>
                </label>
              )}
              <label className="block text-[10px] font-bold text-slate-600">Observación (sale en la cotización)
                <textarea value={b.obs} onChange={e => updBloque(b.uid, { obs: e.target.value })} rows={2} placeholder={b.origen === 'carpi' ? 'Ej. Incluye pintura epóxica / Lo provee el cliente' : 'Ej. Mobiliario referencial'}
                  className="mt-0.5 w-full px-2 py-1 rounded-lg bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <p className="text-[10px] text-slate-400">Arrástralo con Seleccionar. Cerca de un muro se pega solo.</p>
            </div>
          ); })()}

          {/* Propiedades del elemento seleccionado (editar medidas reales) */}
          {selElem && (
            <div className="rounded-2xl border p-3 space-y-2.5" style={{ borderColor: META[selElem.tipo].color + '55', backgroundColor: META[selElem.tipo].color + '0d' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wide" style={{ color: META[selElem.tipo].color }}>
                  {META[selElem.tipo].emoji} {META[selElem.tipo].nombre}
                </span>
                <button onClick={removeSel} className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Eliminar elemento">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CAMPOS[selElem.tipo].filter(c => !(selElem.tipo === 'muro' && selElem.hastaTecho && c.key === 'H')).map(c => (
                  <label key={String(c.key)} className="text-[10px] font-bold text-slate-600">
                    {c.label}
                    <input type="number" step="0.05" value={(selElem[c.key] as number) ?? 0}
                      onChange={e => updateElem(selElem.uid, { [c.key]: Math.max(0, parseFloat(e.target.value) || 0) } as Partial<PlanoElem>, String(c.key))}
                      className="mt-0.5 w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2"
                      style={{ boxShadow: 'none' }} />
                  </label>
                ))}
              </div>
              {selElem.tipo === 'muro' && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-2 text-[10px] font-bold text-slate-600">Material
                    <select value={`${selElem.material || 'ladrillo'}:${selElem.materialId || ''}`}
                      onChange={e => { const [material, materialId] = e.target.value.split(':') as [MaterialMuro, string]; updateElem(selElem.uid, { material, materialId, caras: material === 'osb' ? 1 : 2 }); }}
                      className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                      {!esDrywall && <optgroup label="Ladrillo">{catLadrillo.map(l => <option key={l.id} value={`ladrillo:${l.id}`}>{l.tipo}</option>)}</optgroup>}
                      <optgroup label="Drywall">{catDrywall.map(d => <option key={d.id} value={`drywall:${d.id}`}>{d.tipo}</option>)}</optgroup>
                      <optgroup label="OSB">{catOsb.map(d => <option key={d.id} value={`osb:${d.id}`}>{d.tipo}</option>)}</optgroup>
                    </select>
                  </label>
                  {selElem.material && selElem.material !== 'ladrillo' && (
                    <label className="col-span-2 text-[10px] font-bold text-slate-600">Placas
                      <select value={selElem.caras || (selElem.material === 'osb' ? 1 : 2)} onChange={e => updateElem(selElem.uid, { caras: Number(e.target.value) as 1 | 2 })}
                        className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                        <option value={1}>1 cara</option><option value={2}>2 caras</option>
                      </select>
                    </label>
                  )}
                  <label className="col-span-2 flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={!!selElem.hastaTecho} onChange={e => updateElem(selElem.uid, { hastaTecho: e.target.checked })} />
                    Hasta el techo (sigue la pendiente)
                  </label>
                  {selElem.hastaTecho && (() => { const pf = perfilMuro(selElem, obra.ctx(selElem.nivel)); const hs = pf.map(p => p.h); return (
                    <p className="col-span-2 text-[10px] font-bold text-slate-500">Alto: {Math.min(...hs).toFixed(2)}{Math.max(...hs) - Math.min(...hs) > 0.02 ? ` a ${Math.max(...hs).toFixed(2)}` : ''} m{!estructura ? ' (sin estructura: hasta el piso de arriba)' : ''}</p>
                  ); })()}
                  <label className="col-span-2 text-[10px] font-bold text-slate-600">Piso
                    <select value={selElem.nivel || pisos[0]} onChange={e => { updateElem(selElem.uid, { nivel: e.target.value }); setNivelMuro(e.target.value); }}
                      className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                      {(pisos.length ? pisos : ['Piso 1']).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {selElem.tipo === 'losa' && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-bold text-slate-600">Material
                    <select value={selElem.losaMaterial || 'concreto'} onChange={e => updateElem(selElem.uid, { losaMaterial: e.target.value as 'concreto' | 'osb', h: e.target.value === 'osb' ? 0.018 : 0.2 })}
                      className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                      <option value="concreto">Concreto</option><option value="osb">OSB (entrepiso liviano)</option>
                    </select>
                  </label>
                  <label className="text-[10px] font-bold text-slate-600">Techo del piso
                    <select value={selElem.nivel || pisos[0]} onChange={e => updateElem(selElem.uid, { nivel: e.target.value })}
                      className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                      {(pisos.length ? pisos : ['Piso 1']).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  {selElem.x2 !== undefined && selElem.y2 !== undefined && (() => { const area = Math.abs(selElem.x2 - selElem.x1) * Math.abs(selElem.y2 - selElem.y1); const o = catOsb.find(x => x.id === 'osb_18') || catOsb[0]; return (
                    <p className="col-span-2 text-[10px] font-bold text-slate-500">{area.toFixed(2)} m²{selElem.losaMaterial === 'osb' ? ` de ${o?.tipo || 'OSB'}${o?.precioM2 ? ` · S/ ${(area * o.precioM2).toFixed(2)}` : ''}` : ''} · a {((obra.ctx(selElem.nivel).tope ?? (obra.ctx(selElem.nivel).base + (alturaPiso[selElem.nivel || pisos[0]] || 3)))).toFixed(2)} m</p>
                  ); })()}
                </div>
              )}
              {META[selElem.tipo].esLinea && selElem.x2 !== undefined && selElem.y2 !== undefined && (
                <p className="text-[10px] font-bold text-slate-500">
                  Longitud: <span className="font-mono text-slate-800">{Math.hypot(selElem.x2 - selElem.x1, selElem.y2 - selElem.y1).toFixed(2)} m</span>
                </p>
              )}
              {selElem.tipo === 'muro' ? (() => { const m = muroDesdePlano(selElem); const r = calcMuro(m, catDrywall, catLadrillo, catOsb); return (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-bold text-slate-600 pt-1.5">
                  <span>{m.areaM2.toFixed(2)} m² de muro{(selElem.aberturas || []).length ? ` (sin ${(selElem.aberturas || []).length} vano${(selElem.aberturas || []).length > 1 ? 's' : ''})` : ''}</span>
                  <span>{m.tipo === 'ladrillo' ? `${r.unidades} ladrillos` : `${r.unidades.toFixed(1)} m² de placa`}</span>
                  <span>{r.costo > 0 ? `S/ ${r.costo.toFixed(2)}` : 'Sin precio (botón Precios)'}</span>
                </div>
              ); })() : (() => { const r = calcElem(selElem); return (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-bold text-slate-600 border-t border-slate-200/70 pt-1.5">
                  <span>🧱 {r.concretoM3.toFixed(3)} m³</span>
                  <span>🔩 {r.aceroKg.toFixed(1)} kg</span>
                  <span>🪵 {r.encofradoM2.toFixed(2)} m²</span>
                </div>
              ); })()}
            </div>
          )}

          {/* Nodo seleccionado */}
          {selNode && !selElem && (() => {
            const n = nodos.find(nn => nn.id === selNode);
            if (!n) return null;
            return (
              <div className="rounded-2xl border border-sky-300 bg-sky-50 p-3 space-y-1.5">
                <span className="text-xs font-black uppercase tracking-wide text-sky-700">● Nodo compartido</span>
                <p className="text-[11px] font-bold text-slate-600">Posición: <span className="font-mono text-slate-800">{n.x.toFixed(2)}, {n.y.toFixed(2)} m</span></p>
                <p className="text-[11px] font-bold text-slate-600">Conecta <span className="font-mono text-slate-800">{uidsConectados.size}</span> elemento(s).</p>
                <p className="text-[10px] text-slate-500 leading-snug">Arrástralo en el lienzo: todo lo conectado se mueve junto (motor paramétrico).</p>
              </div>
            );
          })()}

          {/* Abertura seleccionada */}
          {selAb && (() => {
            const muro = elems.find(e => e.uid === selAb.uid);
            const a = muro?.aberturas?.find(x => x.id === selAb.id);
            if (!muro || !a) return null;
            const L = largoMuro(muro);
            const num = (label: string, val: number, on: (v: number) => void, campo: string, dis = false) => (
              <label className="text-[10px] font-bold text-slate-600">{label}
                <input type="number" step="0.05" value={Math.round(val * 100) / 100} disabled={dis}
                  onChange={e => on(Math.max(0, parseFloat(e.target.value) || 0))} data-campo={campo}
                  className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs font-mono focus:outline-none disabled:opacity-50" />
              </label>
            );
            return (
              <div className="rounded-2xl bg-sky-50/70 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-sky-700">{PRESETS_ABERTURA[a.tipo].nombre}</span>
                  <button onClick={() => removeAbertura(muro.uid, a.id)} className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Quitar abertura"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <label className="block text-[10px] font-bold text-slate-600">Tipo
                  <select value={a.tipo} onChange={e => { const t = e.target.value as TipoAbertura; const pr = PRESETS_ABERTURA[t]; updateAbertura(muro.uid, a.id, { tipo: t, w: pr.w, h: pr.h, sill: pr.sill }); }}
                    className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                    {(Object.keys(PRESETS_ABERTURA) as TipoAbertura[]).map(k => <option key={k} value={k}>{PRESETS_ABERTURA[k].nombre}</option>)}
                  </select>
                </label>
                <label className="block text-[10px] font-bold text-slate-600">Diseño de CarpiMetal
                  <select value={a.carpiId || ''} onChange={e => {
                    const d = disenosCarpi.find(x => x.id === e.target.value);
                    if (!d) { updateAbertura(muro.uid, a.id, { carpiId: undefined, carpiNombre: undefined }); return; }
                    const t = tipoAberturaDe(d);
                    updateAbertura(muro.uid, a.id, { carpiId: d.id, carpiNombre: d.nombre, tipo: t, w: d.anchoM, h: d.altoM, sill: t === 'ventana' ? (a.sill || 0.9) : 0 });
                  }} className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                    <option value="">— Sin diseño (solo el vano) —</option>
                    {disenosCarpi.map(d => <option key={d.id} value={d.id}>{d.nombre} · {d.anchoM.toFixed(2)}×{d.altoM.toFixed(2)} m · S/ {costoDisenoCarpi(d).toFixed(0)}</option>)}
                  </select>
                </label>
                {disenosCarpi.length === 0 && <p className="text-[10px] text-slate-400">Guarda una puerta, ventana o reja en CarpiMetal para colocarla aquí.</p>}
                {a.carpiId && (() => { const d = disenosCarpi.find(x => x.id === a.carpiId); return d ? (<>
                  <label className="flex items-start gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={a.incluir !== false} onChange={e => updateAbertura(muro.uid, a.id, { incluir: e.target.checked })} />
                    <span>Incluir en la cotización · S/ {costoDisenoCarpi(d).toFixed(2)}</span>
                  </label>
                  <label className="block text-[10px] font-bold text-slate-600">Observación (sale en la cotización)
                    <textarea value={a.obs || ''} onChange={e => updateAbertura(muro.uid, a.id, { obs: e.target.value }, 'obs')} rows={2} placeholder="Ej. Con chapa de seguridad / la provee el cliente"
                      className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none" />
                  </label>
                </>) : <p className="text-[10px] font-bold text-amber-700">El diseño "{a.carpiNombre}" ya no está guardado en CarpiMetal.</p>; })()}
                <div className="grid grid-cols-2 gap-2">
                  {num('Ancho (m)', a.w, v => updateAbertura(muro.uid, a.id, { w: v }, 'w'), 'w')}
                  {num('Alto (m)', a.h, v => updateAbertura(muro.uid, a.id, { h: v }, 'h'), 'h')}
                  {num('Antepecho (m)', a.sill, v => updateAbertura(muro.uid, a.id, { sill: v }, 'sill'), 'sill', esPuerta(a.tipo) || a.tipo === 'vano')}
                  {num('Desde el inicio (m)', a.t - a.w / 2, v => updateAbertura(muro.uid, a.id, { t: v + a.w / 2 }, 't'), 't')}
                </div>
                <p className="text-[10px] font-bold text-slate-500">Muro de {L.toFixed(2)} m · vano {(a.w * a.h).toFixed(2)} m² (se descuenta del muro). Arrástrala sobre el muro para moverla.</p>
              </div>
            );
          })()}

          {/* Ambientes del piso activo */}
          {ambientes.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-2.5 space-y-1.5">
              <p className="text-[10px] font-black text-slate-500 uppercase">Ambientes · {nivelMuro}</p>
              {ambientes.map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  <input value={a.nombre} onChange={e => setNombresAmb(prev => ({ ...prev, [`${nivelMuro}#${a.key}`]: e.target.value }))}
                    className="flex-1 min-w-0 px-2 py-1 rounded-lg bg-white text-[11px] font-bold text-slate-700 focus:outline-none" />
                  <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0">{a.area.toFixed(2)} m²</span>
                </div>
              ))}
              <p className="text-[10px] font-bold text-slate-400">Total: {ambientes.reduce((x, a) => x + a.area, 0).toFixed(2)} m² (área libre entre ejes de muros)</p>
            </div>
          )}

          {/* Cielo raso (falso techo) */}
          <div className="rounded-xl bg-slate-50 p-2.5 space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-black text-slate-700 cursor-pointer">
              <input type="checkbox" checked={!!cielos[nivelMuro]?.activo} onChange={e => setCielo(nivelMuro, { activo: e.target.checked })} />
              Cielo raso · {nivelMuro}
            </label>
            {cieloPiso && (<>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-bold text-slate-600">Forma
                  <select value={cieloPiso.cfg.modo} onChange={e => setCielo(nivelMuro, { modo: e.target.value as CieloRaso['modo'] })}
                    className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                    <option value="plano">Plano (horizontal)</option>
                    <option value="inclinado">Siguiendo el techo</option>
                  </select>
                </label>
                <label className="text-[10px] font-bold text-slate-600">Altura (m)
                  <input type="number" step="0.05" value={cieloPiso.cfg.altura} disabled={cieloPiso.cfg.modo === 'inclinado'}
                    onChange={e => setCielo(nivelMuro, { altura: Math.max(1.8, parseFloat(e.target.value) || 0) })}
                    className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs font-mono focus:outline-none disabled:opacity-50" />
                </label>
                <label className="col-span-2 text-[10px] font-bold text-slate-600">Placa
                  <select value={cieloPiso.cfg.materialId} onChange={e => setCielo(nivelMuro, { materialId: e.target.value })}
                    className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                    {catDrywall.map(d => <option key={d.id} value={d.id}>{d.tipo}</option>)}
                  </select>
                </label>
              </div>
              {cieloPiso.malla.area > 0 ? (
                <p className="text-[11px] font-bold text-slate-700">{cieloPiso.malla.area.toFixed(2)} m² · perímetro {cieloPiso.malla.perimetro.toFixed(1)} m · {cieloPiso.costo > 0 ? `S/ ${cieloPiso.costo.toFixed(2)}` : 'sin precio'}</p>
              ) : <p className="text-[10px] font-bold text-amber-700">Dibuja muros cerrados (ambientes) o vincula una estructura para calcular el área.</p>}
              {cieloPiso.malla.recortado && <p className="text-[10px] font-bold text-amber-700">El techo baja hasta {cieloPiso.malla.alturaMin.toFixed(2)} m: el cielo se ajusta bajo la pendiente en esa zona.</p>}
              {cieloPiso.cfg.modo === 'inclinado' && cieloPiso.malla.area > 0 && <p className="text-[10px] font-bold text-slate-500">Sigue el techo de {cieloPiso.malla.alturaMin.toFixed(2)} a {cieloPiso.malla.alturaMax.toFixed(2)} m.</p>}
            </>)}
          </div>

          {/* Tanques elevados: vienen de Techos (torre + sobretecho); aquí se agrega el sobrepecho */}
          {tanques.length > 0 && (
            <div className="rounded-xl bg-sky-50/60 p-2.5 space-y-2">
              <p className="text-[10px] font-black text-sky-700 uppercase">Tanques elevados ({tanques.length}) · desde Techos</p>
              {tanques.map(t => {
                const sp = sobrepechos[t.id];
                const kc = `tanque:${t.id}`;
                const lad = catLadrillo.find(l => l.id === (sp?.ladrilloId || 'ladrillo_pandereta'));
                const areaSp = sp?.activo ? perimetroSobrepecho(t, sp) * sp.alto : 0;
                return (
                  <div key={t.id} className="rounded-lg bg-white p-2 space-y-1.5">
                    <p className="text-[11px] font-black text-slate-800">T{t.numero} · Rotoplas {t.litros} L <span className="font-semibold text-slate-500">· torre {(t.y - t.cotaBase).toFixed(2)} m sobre cota {t.cotaBase.toFixed(2)} m</span></p>
                    <p className="text-[10px] font-bold text-slate-500">Sobretecho (techito, se edita en Techos): {t.ySobretecho !== null ? `${t.sobretechoCobertura || 'sí'} · ${t.sobretechoM2.toFixed(2)} m²` : 'no tiene'}</p>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={!!sp?.activo} onChange={e => setSobrepecho(t.id, { activo: e.target.checked })} />
                      Murete / parapeto de ladrillo (sobrepecho)
                    </label>
                    {sp?.activo && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <select value={sp.ladrilloId} onChange={e => setSobrepecho(t.id, { ladrilloId: e.target.value })} className="col-span-2 px-2 py-1 rounded-lg bg-slate-50 text-[11px] focus:outline-none">
                          {catLadrillo.map(l => <option key={l.id} value={l.id}>{l.tipo}</option>)}
                        </select>
                        <label className="text-[10px] font-bold text-slate-600">Alto (m)
                          <input type="number" step="0.1" value={sp.alto} onChange={e => setSobrepecho(t.id, { alto: Math.max(0.2, parseFloat(e.target.value) || 0) })} className="mt-0.5 w-full px-2 py-1 rounded-lg bg-slate-50 text-xs font-mono focus:outline-none" />
                        </label>
                        <label className="text-[10px] font-bold text-slate-600">Separación (m)
                          <input type="number" step="0.05" value={sp.holgura} onChange={e => setSobrepecho(t.id, { holgura: Math.max(0, parseFloat(e.target.value) || 0) })} className="mt-0.5 w-full px-2 py-1 rounded-lg bg-slate-50 text-xs font-mono focus:outline-none" />
                        </label>
                        <p className="col-span-2 text-[10px] font-bold text-slate-500">{areaSp.toFixed(2)} m² · {Math.ceil(areaSp * (lad?.unidadesM2 || 0))} ladrillos</p>
                      </div>
                    )}
                    {t.ySobretecho !== null && (
                      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={!!cielos[kc]?.activo} onChange={e => setCielo(kc, { activo: e.target.checked })} />
                        Cielo raso bajo el sobretecho · {mallaCieloTanque(t).area.toFixed(2)} m²
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {esDrywall && metradoDw && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">Metrado drywall · {nivelMuro}</h3>
              <div className="grid grid-cols-3 gap-2">
                {[['Tabiques', `${metradoDw.tabiquesM2.toFixed(1)} m²`], ['Placa', `${metradoDw.placaTabiquesM2.toFixed(1)} m²`], ['Cielo raso', `${metradoDw.cieloM2.toFixed(1)} m²`]].map(([l, v]) => (
                  <div key={l} className="bg-violet-50 rounded-xl p-2 text-center">
                    <p className="text-sm font-black text-slate-800">{v}</p>
                    <p className="text-[9px] font-bold text-violet-500 uppercase">{l}</p>
                  </div>
                ))}
              </div>
              {metradoDw.lineas.length === 0 && <p className="text-[11px] text-slate-500">Dibuja tabiques con la herramienta Muro o activa el cielo raso del piso.</p>}
              {metradoDw.lineas.map(l => (
                <div key={l.clave + (l.nota || '')} className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 rounded-lg px-2 py-1">
                  <span className="font-bold text-slate-700 truncate" title={l.nota}>{l.nombre}</span>
                  <span className="font-mono font-bold text-violet-700 shrink-0">{l.cantidad} {l.unidad}</span>
                </div>
              ))}
              <div className="bg-violet-600 text-white rounded-xl p-2.5 text-center">
                <p className="text-lg font-black">S/ {metradoDw.total.toFixed(0)}</p>
                <p className="text-[10px] font-bold uppercase">Materiales + {metradoDw.dias} días de instalador</p>
              </div>
              <p className="text-[9px] text-slate-400 leading-snug">Detalle completo en la pestaña “Presupuesto” (marca “Incluir lo dibujado en Plano con Techos”). Precios del Catálogo de precios.</p>
            </div>
          )}
          {!esDrywall && <>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">Metrado automático</h3>
          <div className="grid grid-cols-2 gap-2">
            {[['Concreto', `${totales.concretoM3.toFixed(2)} m³`], ['Acero', `${totales.aceroKg.toFixed(0)} kg`], ['Encofrado', `${totales.encofradoM2.toFixed(1)} m²`], ['Cemento', `${Math.ceil(totales.cementoBolsas)} bls`]].map(([l, v]) => (
              <div key={l} className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                <p className="text-sm font-black text-slate-800">{v}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{l}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-500 text-slate-950 rounded-xl p-2.5 text-center">
            <p className="text-lg font-black">S/ {totales.costo.toFixed(0)}</p>
            <p className="text-[10px] font-bold uppercase">Costo referencial</p>
          </div>

          {murosPiso.lista.length > 0 && (
            <div className="rounded-xl bg-orange-50/60 p-2.5 space-y-1">
              <p className="text-[10px] font-black text-orange-700 uppercase">Muros · {nivelMuro}</p>
              {murosPiso.areaLadrillo > 0 && <p className="text-[11px] font-bold text-slate-700">Ladrillo: {murosPiso.areaLadrillo.toFixed(1)} m² · {murosPiso.ladrillos.toLocaleString('es-PE')} und.</p>}
              {murosPiso.areaDrywall > 0 && <p className="text-[11px] font-bold text-slate-700">Drywall: {murosPiso.areaDrywall.toFixed(1)} m² · {murosPiso.placaM2.toFixed(1)} m² placa</p>}
              {murosPiso.areaOsb > 0 && <p className="text-[11px] font-bold text-slate-700">OSB: {murosPiso.areaOsb.toFixed(1)} m² · {murosPiso.osbM2.toFixed(1)} m² placa</p>}
              {(murosPiso.puertas + murosPiso.ventanas + murosPiso.vanos) > 0 && <p className="text-[11px] font-bold text-slate-700">{murosPiso.puertas} puertas · {murosPiso.ventanas} ventanas{murosPiso.vanos ? ` · ${murosPiso.vanos} vanos` : ''}</p>}
              <p className="text-[11px] font-black text-slate-800">{murosPiso.costo > 0 ? `S/ ${murosPiso.costo.toFixed(2)}` : 'Ingresa precios en la vista Lista → Precios'}</p>
            </div>
          )}

          {Object.keys(totales.porTipo).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase">Por elemento</p>
              {Object.entries(totales.porTipo).map(([t, v]) => (
                <div key={t} className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                  <span className="font-bold text-slate-700">{META[t as PlanoTipo].emoji} {META[t as PlanoTipo].nombre} ({v.n})</span>
                  <span className="font-mono font-bold text-stone-600">{v.concreto.toFixed(2)} m³</span>
                </div>
              ))}
            </div>
          )}

          {totales.varillas.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase">Acero (varillas 9m)</p>
              <div className="flex flex-wrap gap-1">
                {totales.varillas.map(v => (
                  <span key={v.d} className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-lg">Ø{v.d}: {v.varillas}</span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[9px] text-slate-400 leading-snug">Estimados referenciales (f'c=210, 1:2:3). No reemplaza el cálculo de un ingeniero.</p>
          </>}
        </div>
      </div>
    </div>
  );
}
