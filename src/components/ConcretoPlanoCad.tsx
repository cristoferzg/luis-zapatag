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
import { MousePointer, Columns, Square, Minus, Trash2, Download, Hand, Grid3x3, Plus, Layers, Eye, Undo2, Redo2, Maximize, BrickWall } from 'lucide-react';
import { DRYWALL_DEFAULTS, DrywallItem } from '../catalogo/drywall';
import { LADRILLO_DEFAULTS, LadrilloItem } from '../catalogo/ladrillo';
import { KEY_CAT_DRYWALL, KEY_CAT_LADRILLO, calcMuro, muroDesdePlano, basesDeNiveles } from './concreto/obraPisos';
import { safeStorage } from '../lib/storageManager';
import ConcretoViewer3D from './ConcretoViewer3D';

export type PlanoTipo = 'columna' | 'zapata' | 'viga' | 'cimiento' | 'losa' | 'muro';
type Herramienta = 'select' | 'pan' | PlanoTipo;

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
  material?: 'ladrillo' | 'drywall';
  materialId?: string;
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
export const COLOR_MURO = { ladrillo: '#fb923c', drywall: '#94a3b8' } as const;

const DEFAULTS: Record<PlanoTipo, Omit<PlanoElem, 'uid' | 'tipo' | 'x1' | 'y1' | 'x2' | 'y2'>> = {
  columna:  { a: 0.25, b: 0.25, H: 3.0 },
  zapata:   { a: 1.0,  b: 1.0,  h: 0.5 },
  viga:     { a: 0.25, h: 0.40 },
  cimiento: { a: 0.50, h: 0.60 },
  losa:     { a: 0.20, h: 0.20 },
  muro:     { a: 0.15, H: 2.6 },
};

const PRECIOS_DEFAULT = { cementoBolsa: 28, arenaM3: 55, piedraM3: 60, aceroKg: 4.2, encofradoM2: 25 };
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

export default function ConcretoPlanoCad() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [tool, setTool] = useState<Herramienta>('columna');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [cursor, setCursor] = useState({ x: 0, y: 0, onNode: false });
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [selUid, setSelUid] = useState<string | null>(null);
  const [selNode, setSelNode] = useState<string | null>(null);
  const [vista3d, setVista3d] = useState(false);

  const [elems, setElems] = useState<PlanoElem[]>(() => safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || []);
  const [precios] = useState(() => safeStorage.getItem<typeof PRECIOS_DEFAULT>('concreto_metrados_precios', PRECIOS_DEFAULT) || PRECIOS_DEFAULT);
  // Pisos (los mismos de la vista Lista) y material de muro a dibujar.
  const [niveles] = useState<string[]>(() => safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Cimentación', 'Piso 1']);
  const pisos = niveles.filter(n => !/cimentaci/i.test(n));
  const [nivelMuro, setNivelMuro] = useState<string>(() => pisos[0] || 'Piso 1');
  const [catDrywall] = useState<DrywallItem[]>(() => safeStorage.getItem<DrywallItem[]>(KEY_CAT_DRYWALL, DRYWALL_DEFAULTS) || DRYWALL_DEFAULTS);
  const [catLadrillo] = useState<LadrilloItem[]>(() => safeStorage.getItem<LadrilloItem[]>(KEY_CAT_LADRILLO, LADRILLO_DEFAULTS) || LADRILLO_DEFAULTS);
  const [materialMuro, setMaterialMuro] = useState<{ material: 'ladrillo' | 'drywall'; materialId: string }>({ material: 'ladrillo', materialId: LADRILLO_DEFAULTS[0].id });

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
    const extra = tipo === 'muro' ? { nivel: nivelMuro, ...materialMuro } : {};
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

  // --- Interacción puntero ---
  const dragNode = useRef<{ x: number; y: number; key: string } | null>(null);
  const didDrag = useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1 || e.button === 2) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      return;
    }
    if (tool === 'select' && e.button === 0) {
      const n = hitNode(e.clientX, e.clientY);
      if (n) {
        pushHist();                 // un paso deshacible por arrastre
        dragNode.current = { x: n.x, y: n.y, key: n.id };
        didDrag.current = false;
        setSelNode(n.id); setSelUid(null);
      }
    }
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: panStart.current.px + (e.clientX - panStart.current.x), y: panStart.current.py + (e.clientY - panStart.current.y) });
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
    if (dragNode.current) {
      if (!didDrag.current) undoRef.current.pop(); // no hubo movimiento → descarta el paso
      dragNode.current = null;
      setHistVer(v => v + 1);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    if (isPanning || tool === 'pan') return;
    if (didDrag.current) { didDrag.current = false; return; } // acabamos de arrastrar un nodo
    const w = snapWorld(e.clientX, e.clientY);
    if (tool === 'select') { setSelUid(null); setSelNode(null); return; }
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

  // Encuadrar: ajusta zoom + paneo para que todo el plano quepa en el lienzo.
  const encuadrar = () => {
    if (!elems.length || !dims.w) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const acc = (x: number, y: number) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
    elems.forEach(e => { acc(e.x1, e.y1); if (e.x2 !== undefined && e.y2 !== undefined) acc(e.x2, e.y2); });
    const wM = Math.max(1, maxX - minX), hM = Math.max(1, maxY - minY);
    const pad = 1.35;
    const z = Math.max(0.3, Math.min(4, Math.min(dims.w / (wM * pad * 48), dims.h / (hM * pad * 48))));
    const sc = 48 * z;
    const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2;
    setZoom(z);
    setPan({ x: -midX * sc, y: -midY * sc });
  };

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
  const sig3d = useMemo(() => elems.map(e => `${e.uid}:${e.a},${e.b},${e.h},${e.H},${e.x1},${e.y1},${e.x2},${e.y2},${e.nivel},${e.material}`).join('|'), [elems]);
  const bases3d = useMemo(() => basesDeNiveles(niveles), [niveles]);

  // Muros del piso activo: metrado y costo con los precios del usuario.
  const murosPiso = useMemo(() => {
    const lista = elems.filter(e => e.tipo === 'muro' && (e.nivel || pisos[0]) === nivelMuro)
      .map(e => { const m = muroDesdePlano(e); return { e, m, r: calcMuro(m, catDrywall, catLadrillo) }; });
    return {
      lista,
      areaLadrillo: lista.filter(x => x.m.tipo === 'ladrillo').reduce((s, x) => s + x.m.areaM2, 0),
      ladrillos: lista.filter(x => x.m.tipo === 'ladrillo').reduce((s, x) => s + x.r.unidades, 0),
      areaDrywall: lista.filter(x => x.m.tipo === 'drywall').reduce((s, x) => s + x.m.areaM2, 0),
      placaM2: lista.filter(x => x.m.tipo === 'drywall').reduce((s, x) => s + x.r.unidades, 0),
      costo: lista.reduce((s, x) => s + x.r.costo, 0),
    };
  }, [elems, nivelMuro, catDrywall, catLadrillo]);

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
    let txt = `INNOVA CONTRATISTAS — PLANO DE CIMENTACIÓN (CAD CONCRETO)\nFecha: ${new Date().toLocaleDateString('es-PE')}\n`;
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
          const m = muroDesdePlano(e); const r = calcMuro(m, catDrywall, catLadrillo);
          txt += `  ${r.nombre} · ${m.areaM2.toFixed(2)} m² · ${m.tipo === 'ladrillo' ? `${r.unidades} ladrillos` : `${r.unidades.toFixed(1)} m² placa`} · S/ ${r.costo.toFixed(2)}\n`;
        });
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
    { id: 'pan', label: 'Mover lienzo', icon: Hand },
  ];

  const canUndo = undoRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;
  void histVer; // re-render al cambiar el historial

  return (
    <div className="w-full h-full flex flex-col bg-slate-50">
      {/* Barra de herramientas */}
      <div className="flex items-center gap-1.5 p-2 bg-white border-b border-slate-200 flex-wrap">
        {HERRAMIENTAS.map(t => {
          const Ic = t.icon;
          const act = tool === t.id;
          const col = (t.id in META) ? META[t.id as PlanoTipo].color : '#334155';
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
        {tool === 'muro' && (
          <select
            value={`${materialMuro.material}:${materialMuro.materialId}`}
            onChange={e => { const [material, materialId] = e.target.value.split(':') as ['ladrillo' | 'drywall', string]; setMaterialMuro({ material, materialId }); }}
            className="px-2 py-1.5 rounded-xl bg-orange-50 text-xs font-bold text-orange-800 cursor-pointer focus:outline-none max-w-[200px]">
            <optgroup label="Ladrillo">{catLadrillo.map(l => <option key={l.id} value={`ladrillo:${l.id}`}>{l.tipo}</option>)}</optgroup>
            <optgroup label="Drywall">{catDrywall.map(d => <option key={d.id} value={`drywall:${d.id}`}>{d.tipo}</option>)}</optgroup>
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
        <button onClick={encuadrar} disabled={elems.length === 0} title="Encuadrar (ver todo)"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 disabled:opacity-35 disabled:cursor-default">
          <Maximize className="w-3.5 h-3.5" />
        </button>
        <div className="h-5 w-px bg-slate-200 mx-1" />
        {selUid && (
          <button onClick={removeSel} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100">
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
            <ConcretoViewer3D key={sig3d} elems={elems} bases={bases3d} />
            {elems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-bold">Dibuja en 2D para ver el 3D</div>
            )}
            <div className="absolute bottom-3 left-3 text-[10px] font-bold text-slate-500 bg-white/90 rounded-lg px-2 py-1 border border-slate-200 pointer-events-none">
              Arrastra para girar · rueda para acercar
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
                return (
                  <g key={e.uid} opacity={otroPiso ? 0.22 : 1} onClick={ev => { if (tool !== 'select') return; ev.stopPropagation(); if (!didDrag.current) { setSelUid(e.uid); setSelNode(null); if (otroPiso && e.nivel) setNivelMuro(e.nivel); } }} className="cursor-pointer">
                    <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke={col} strokeWidth={wPx} strokeLinecap="butt" />
                    {e.material !== 'drywall' && <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#fff7ed" strokeWidth={Math.max(1, wPx * 0.18)} strokeDasharray="7 5" />}
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
                  <circle cx={c.sx} cy={c.sy} r="4" fill={cursor.onNode ? '#0ea5e9' : col} opacity={0.75} />
                </g>
              );
            })()}
          </svg>

          {elems.length === 0 && (
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
                {CAMPOS[selElem.tipo].map(c => (
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
                      onChange={e => { const [material, materialId] = e.target.value.split(':') as ['ladrillo' | 'drywall', string]; updateElem(selElem.uid, { material, materialId }); }}
                      className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                      <optgroup label="Ladrillo">{catLadrillo.map(l => <option key={l.id} value={`ladrillo:${l.id}`}>{l.tipo}</option>)}</optgroup>
                      <optgroup label="Drywall">{catDrywall.map(d => <option key={d.id} value={`drywall:${d.id}`}>{d.tipo}</option>)}</optgroup>
                    </select>
                  </label>
                  <label className="col-span-2 text-[10px] font-bold text-slate-600">Piso
                    <select value={selElem.nivel || pisos[0]} onChange={e => { updateElem(selElem.uid, { nivel: e.target.value }); setNivelMuro(e.target.value); }}
                      className="mt-0.5 w-full px-2 py-1 rounded-lg bg-white text-xs focus:outline-none">
                      {(pisos.length ? pisos : ['Piso 1']).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {META[selElem.tipo].esLinea && selElem.x2 !== undefined && selElem.y2 !== undefined && (
                <p className="text-[10px] font-bold text-slate-500">
                  Longitud: <span className="font-mono text-slate-800">{Math.hypot(selElem.x2 - selElem.x1, selElem.y2 - selElem.y1).toFixed(2)} m</span>
                </p>
              )}
              {selElem.tipo === 'muro' ? (() => { const m = muroDesdePlano(selElem); const r = calcMuro(m, catDrywall, catLadrillo); return (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-bold text-slate-600 pt-1.5">
                  <span>{m.areaM2.toFixed(2)} m² de muro</span>
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
        </div>
      </div>
    </div>
  );
}
