// =============================================================================
// Electricidad · Plano: editor en planta (metros, cuadrícula, zoom / desplazamiento,
// deshacer / rehacer). Puntos con su símbolo y su circuito, tuberías por circuito
// (por el techo o por el piso), trazado automático desde el tablero, conteo de
// curvas, cajas y conductores, y avisos del CNE. El fondo puede venir de Obra Civil,
// Gasfitería, Melamina o Techos.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MousePointer2, Hand, Plus, Spline, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, WandSparkles, RotateCw, Trash2, Copy, Check, X,
  AlertTriangle, CircleCheck, Layers, Save, FolderOpen, FilePlus2, ClipboardList, Zap, Ruler, Sparkles, ListTree, ChevronDown, ChevronUp, Download,
} from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import { simb } from '../../lib/currency';
import {
  CATS, PUNTOS, ALIM, PT, COLOR_ALIM, COLOR_PT, CotizacionEle, Circuito, KEY_COT_LISTA, KEY_ORIGEN, Pt, Punto, Ruta, TipoFondo, TipoPunto, UsoCircuito, USOS, MuroRef, RefFondo,
  circuitoDe, colorCircuito, cotizacionEjemplo, cotizacionVacia, defPunto, esEspecial, esInterruptor, esLuz, importarFondo, leerCotizaciones, limites, murosAmbiente,
  nombreCircuito, nombrePunto, normalizar, nuevoCircuito, pisosObra, potencia, renumerar, uid, PALETA_CIRCUITOS,
} from './modeloElectricidad';
import { desplazar, offsetCircuito, MetradoEle, avisosCNE, circuitoParaPunto, cargaCircuito, largoRuta, proyectar, puntosCircuito, sugerirCircuitos, totalCon, trazarAutomatico, TOL_PUNTO } from './calculoElectricidad';
import { SimboloElectrico, IconoPunto } from './SimboloElectrico';
import { SimboloAparato } from '../gasfiteria/SimboloAparato';

type SetCot = (f: (c: CotizacionEle) => CotizacionEle) => void;
type Herr = 'mover' | 'mano' | 'punto' | 'ruta';
type Sel = { tipo: 'p'; id: string } | { tipo: 'ruta'; id: string } | null;
interface Snap { p: Pt; tipo: 'punto' | 'vertice' | 'ruta' | 'grid' }

const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toFixed(2);
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const g05 = (n: number) => Math.round(n / 0.05) * 0.05;
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer select-none';
const inputTxt = 'mt-0.5 w-full min-h-[40px] px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300';
const sel1 = 'min-h-[36px] px-2 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300';
export const FONDOS: { id: TipoFondo; label: string; corto: string }[] = [
  { id: 'blanco', label: 'En blanco', corto: 'Blanco' }, { id: 'obra', label: 'Obra Civil', corto: 'Obra' }, { id: 'gasfiteria', label: 'Gasfitería', corto: 'Gasfit.' },
  { id: 'melamina', label: 'Melamina', corto: 'Melam.' }, { id: 'techos', label: 'Techos', corto: 'Techos' },
];

export default function PlanoElectrico({ cot, setCot, r, duchas, onPresupuesto, onMateriales, onCuadro }: { cot: CotizacionEle; setCot: SetCot; r: MetradoEle; duchas: Pt[]; onPresupuesto: () => void; onMateriales: () => void; onCuadro: () => void }) {
  const [herr, setHerr] = useState<Herr>('mover');
  const [tipoP, setTipoP] = useState<TipoPunto>('luz_techo');
  const [circP, setCircP] = useState<string>('auto');
  const [rutaCirc, setRutaCirc] = useState<string>('');
  const [rutaVia, setRutaVia] = useState<'techo' | 'piso'>('techo');
  const [orto, setOrto] = useState(true);
  const [verCond, setVerCond] = useState(true);
  const [foco, setFoco] = useState<string | null>(null);
  const [sel, setSel] = useState<Sel>(null);
  const [dibujo, setDibujo] = useState<Pt[]>([]);
  const [hover, setHover] = useState<Snap | null>(null);
  const [aviso, setAviso] = useState('');
  const avisar = (t: string) => { setAviso(t); window.setTimeout(() => setAviso(''), 3600); };
  // Deshacer / rehacer.
  const pasado = useRef<CotizacionEle[]>([]), futuro = useRef<CotizacionEle[]>([]);
  const [, setVer] = useState(0);
  const commit: SetCot = f => { pasado.current.push(cot); if (pasado.current.length > 80) pasado.current.shift(); futuro.current = []; setVer(v => v + 1); setCot(f); };
  const restaurar = (p: CotizacionEle) => setCot(c => ({ ...c, puntos: p.puntos, rutas: p.rutas, circuitos: p.circuitos, fondo: p.fondo }));
  const deshacer = () => { const p = pasado.current.pop(); if (!p) return; futuro.current.push(cot); setVer(v => v + 1); restaurar(p); };
  const rehacer = () => { const p = futuro.current.pop(); if (!p) return; pasado.current.push(cot); setVer(v => v + 1); restaurar(p); };

  // ── Vista ──
  const host = useRef<HTMLDivElement>(null), svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 800, h: 520 });
  const [vb, setVb] = useState<{ x: number; y: number; w: number } | null>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const ro = new ResizeObserver(() => setTam({ w: Math.max(200, el.clientWidth), h: Math.max(200, el.clientHeight) }));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const encuadrar = (c: CotizacionEle = cot) => {
    const b = limites(c), pad = 0.7;
    const bw = b.x1 - b.x0 + pad * 2, bh = b.y1 - b.y0 + pad * 2;
    const w = Math.max(bw, (bh * tam.w) / tam.h);
    setVb({ x: (b.x0 + b.x1) / 2 - w / 2, y: (b.y0 + b.y1) / 2 - (w * tam.h) / tam.w / 2, w });
  };
  useEffect(() => { encuadrar(); }, [tam.w, tam.h]); // eslint-disable-line react-hooks/exhaustive-deps
  const altoMovil = useMemo(() => {
    const b = limites(cot), bw = b.x1 - b.x0 + 1.4, bh = b.y1 - b.y0 + 1.4;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return Math.round(Math.max(320, Math.min(vh * 0.64, (tam.w * bh) / bw + 30)));
  }, [cot.puntos.length, cot.fondo, tam.w]); // eslint-disable-line react-hooks/exhaustive-deps
  const V = vb || { x: -0.5, y: -0.5, w: 6 };
  const VH = (V.w * tam.h) / tam.w;
  const px = V.w / tam.w;
  const zoom = (k: number, cx = V.x + V.w / 2, cy = V.y + VH / 2) => setVb(v => { const b = v || V; const w = Math.max(0.8, Math.min(90, b.w * k)); const f = w / b.w; return { x: cx - (cx - b.x) * f, y: cy - (cy - b.y) * f, w }; });
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const rueda = (e: WheelEvent) => { e.preventDefault(); const p = punto(e); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, p.x, p.y); };
    svg.addEventListener('wheel', rueda, { passive: false });
    return () => svg.removeEventListener('wheel', rueda);
  });
  // Android: el dedo sobre algo que se arrastra (punto, vértice o con la mano) no mueve la página.
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const sobre = (e: TouchEvent) => !!(e.target as Element | null)?.closest?.('[data-arrastre]');
    const bloquear = (e: TouchEvent) => { if (sobre(e)) e.preventDefault(); };
    svg.addEventListener('touchstart', bloquear, { passive: false });
    svg.addEventListener('touchmove', bloquear, { passive: false });
    return () => { svg.removeEventListener('touchstart', bloquear); svg.removeEventListener('touchmove', bloquear); };
  }, []);
  const punto = (e: { clientX: number; clientY: number }): Pt => {
    const svg = svgRef.current; const ctm = svg?.getScreenCTM(); if (!ctm) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  // ── Fondo desde otros apartados ──
  const pisos = useMemo(() => pisosObra(), []);
  const [imp, setImp] = useState(() => importarFondo(cot.fondo.tipo, cot.fondo.nivel));
  const elegirFondo = (tipo: TipoFondo, nivel?: string, silencioso = false) => {
    const f = importarFondo(tipo, nivel);
    setImp(f);
    commit(c => ({ ...c, fondo: tipo === 'blanco' ? { ...c.fondo, tipo, muros: murosAmbiente(c.fondo.ancho, c.fondo.largo), refs: [] } : { ...c.fondo, tipo, nivel: tipo === 'obra' ? (nivel || c.fondo.nivel || pisos[0]) : undefined, muros: f.muros, refs: f.refs } }));
    if (!silencioso && tipo !== 'blanco') avisar(f.vacio ? f.texto : `✓ ${f.texto}${f.sugerencias.length ? ` Toca "Agregar puntos sugeridos".` : ''}`);
    window.setTimeout(() => setVb(null), 0);
  };
  useEffect(() => { if (!vb) encuadrar(); }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const o = safeStorage.getItem<string>(KEY_ORIGEN, '');
    if (!o) return;
    safeStorage.removeItem?.(KEY_ORIGEN);
    const t: TipoFondo = o === 'drywall' || o === 'obra' ? 'obra' : (['gasfiteria', 'melamina', 'techos'].includes(o) ? o as TipoFondo : 'blanco');
    if (t !== cot.fondo.tipo || t !== 'blanco') elegirFondo(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const sugeridos = useMemo(() => imp.sugerencias.filter(s => !cot.puntos.some(p => p.tipo === s.tipo && dist(p, s) < 0.25)), [imp, cot.puntos]);
  const agregarSugeridos = () => {
    if (!sugeridos.length) return;
    commit(c => {
      let cc = c;
      sugeridos.forEach(s => {
        const r0 = circuitoParaPunto(cc, s.tipo, s.w);
        const p: Punto = { id: uid(), tipo: s.tipo, x: s.x, y: s.y, rot: s.rot || 0, nombre: s.nombre, w: s.w, circuito: r0.id };
        cc = { ...cc, circuitos: r0.circuitos, puntos: [...cc.puntos, p] };
      });
      // Sin tablero: se pone uno junto a la primera esquina, con su pozo a tierra afuera.
      if (!cc.puntos.some(p => p.tipo === 'tablero')) {
        const b = limites({ puntos: [], rutas: [], fondo: cc.fondo });
        cc = { ...cc, puntos: [...cc.puntos, { id: uid(), tipo: 'tablero', x: r3(b.x0 + 0.5), y: r3(b.y0 + 0.12), rot: 0, nombre: 'TD' }, ...(cc.puntos.some(p => p.tipo === 'pozo_tierra') ? [] : [{ id: uid(), tipo: 'pozo_tierra' as TipoPunto, x: r3(b.x0 - 0.8), y: r3(b.y0 + 0.8), rot: 0 }])] };
      }
      return cc;
    });
    window.setTimeout(() => setVb(null), 0);
    avisar(`✓ ${sugeridos.length} puntos agregados (y el tablero si faltaba). Muévelos si hace falta y toca "Trazar automáticamente".`);
  };

  // ── Ajuste (snap) ──
  const ajustar = (p: Pt, circ: string | null, excluir?: { ruta: string; idx: number }): Snap => {
    const tol = Math.max(0.1, px * 16);
    let best: Snap | null = null, bd = tol;
    cot.puntos.forEach(q => { if (circ && q.circuito !== circ && !esEspecial(q.tipo)) return; const d = dist(q, p); if (d < bd) { bd = d; best = { p: { x: q.x, y: q.y }, tipo: 'punto' }; } });
    if (best) return best;
    bd = tol * 0.8;
    cot.rutas.forEach(t => { if (circ && t.circuito !== circ) return; t.pts.forEach((q, i) => { if (excluir && excluir.ruta === t.id && excluir.idx === i) return; const d = dist(q, p); if (d < bd) { bd = d; best = { p: q, tipo: 'vertice' }; } }); });
    if (best) return best;
    bd = tol * 0.6;
    cot.rutas.forEach(t => { if (circ && t.circuito !== circ) return; if (excluir && excluir.ruta === t.id) return; for (let i = 0; i < t.pts.length - 1; i++) { const pr = proyectar(p, t.pts[i], t.pts[i + 1]); if (pr.d < bd) { bd = pr.d; best = { p: { x: r3(pr.q.x), y: r3(pr.q.y) }, tipo: 'ruta' }; } } });
    if (best) return best;
    return { p: { x: r3(g05(p.x)), y: r3(g05(p.y)) }, tipo: 'grid' };
  };
  const conOrto = (s: Snap, prev?: Pt): Pt[] => {
    if (!prev || !orto) return [s.p];
    const dx = s.p.x - prev.x, dy = s.p.y - prev.y;
    if (s.tipo === 'grid') return [Math.abs(dx) >= Math.abs(dy) ? { x: s.p.x, y: prev.y } : { x: prev.x, y: s.p.y }];
    if (Math.abs(dx) < 0.005 || Math.abs(dy) < 0.005) return [s.p];
    return [Math.abs(dx) >= Math.abs(dy) ? { x: s.p.x, y: prev.y } : { x: prev.x, y: s.p.y }, s.p];
  };
  const circRutaActual = rutaCirc && (cot.circuitos.some(c => c.id === rutaCirc) || rutaCirc === ALIM || rutaCirc === PT) ? rutaCirc : cot.circuitos[0]?.id || '';

  // ── Interacción ──
  type Arr =
    | { tipo: 'pan'; x0: number; y0: number; vb: { x: number; y: number; w: number } }
    | { tipo: 'p'; id: string; dx: number; dy: number; pegados: { ruta: string; idx: number }[]; movio: boolean }
    | { tipo: 'vert'; ruta: string; idx: number; movio: boolean }
    | { tipo: 'tap'; x0: number; y0: number };
  const arr = useRef<Arr | null>(null);
  const inicioTap = useRef<{ x: number; y: number } | null>(null);

  const terminar = (pts = dibujo) => {
    const limpio = pts.filter((p, i) => i === 0 || dist(p, pts[i - 1]) > 0.005);
    if (limpio.length >= 2 && circRutaActual) {
      const t: Ruta = { id: uid(), circuito: circRutaActual, via: rutaVia, pts: limpio };
      commit(c => ({ ...c, rutas: [...c.rutas, t] }));
      setSel({ tipo: 'ruta', id: t.id });
    } else if (!circRutaActual) avisar('Primero crea un circuito (o toca "Sugerir circuitos").');
    setDibujo([]);
  };
  const agregarVertice = (s: Snap) => {
    const prev = dibujo[dibujo.length - 1];
    if (prev && dist(prev, s.p) < 0.01) { terminar(); return; }
    const nuevos = [...dibujo, ...conOrto(s, prev)];
    if (prev && s.tipo !== 'grid') { terminar(nuevos); return; }
    setDibujo(nuevos);
  };
  const ponerPunto = (p: Pt) => {
    const rot = cot.puntos.filter(a => a.tipo === tipoP).slice(-1)[0]?.rot || 0;
    const nuevo: Punto = { id: uid(), tipo: tipoP, x: r3(g05(p.x)), y: r3(g05(p.y)), rot };
    commit(c => {
      if (esEspecial(tipoP)) return { ...c, puntos: [...c.puntos, nuevo] };
      if (circP !== 'auto' && c.circuitos.some(k => k.id === circP)) return { ...c, puntos: [...c.puntos, { ...nuevo, circuito: circP }] };
      // Interruptor: al circuito de la luz más cercana.
      if (esInterruptor(tipoP)) { const l = [...c.puntos].filter(x => esLuz(x.tipo) && x.circuito).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (l) return { ...c, puntos: [...c.puntos, { ...nuevo, circuito: l.circuito }] }; }
      const r0 = circuitoParaPunto(c, tipoP);
      return { ...c, circuitos: r0.circuitos, puntos: [...c.puntos, { ...nuevo, circuito: r0.id }] };
    });
    setSel({ tipo: 'p', id: nuevo.id });
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.button === 2) return;
    const t = e.target as Element, p = punto(e);
    inicioTap.current = { x: e.clientX, y: e.clientY };
    const capturar = () => { try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* sin captura */ } };
    if (herr === 'mano') { arr.current = { tipo: 'pan', x0: e.clientX, y0: e.clientY, vb: V }; capturar(); return; }
    if (herr === 'mover') {
      const v = t.closest('[data-vert]');
      if (v) {
        const [rid, idx] = (v.getAttribute('data-vert') || '').split(':');
        pasado.current.push(cot); futuro.current = [];
        arr.current = { tipo: 'vert', ruta: rid, idx: Number(idx), movio: false }; capturar(); e.preventDefault(); return;
      }
      const g = t.closest('[data-punto]');
      if (g) {
        const id = g.getAttribute('data-punto')!; const a = cot.puntos.find(x => x.id === id); if (!a) return;
        const pegados: { ruta: string; idx: number }[] = [];
        cot.rutas.forEach(tr => [0, tr.pts.length - 1].forEach(idx => { if (dist(tr.pts[idx], a) < TOL_PUNTO) pegados.push({ ruta: tr.id, idx }); }));
        pasado.current.push(cot); futuro.current = [];
        arr.current = { tipo: 'p', id, dx: p.x - a.x, dy: p.y - a.y, pegados, movio: false };
        setSel({ tipo: 'p', id }); capturar(); e.preventDefault(); return;
      }
      const tr = t.closest('[data-ruta]');
      if (tr) { setSel({ tipo: 'ruta', id: tr.getAttribute('data-ruta')! }); arr.current = null; return; }
      if (e.pointerType === 'mouse') { arr.current = { tipo: 'pan', x0: e.clientX, y0: e.clientY, vb: V }; capturar(); }
      else arr.current = { tipo: 'tap', x0: e.clientX, y0: e.clientY };
      return;
    }
    arr.current = { tipo: 'tap', x0: e.clientX, y0: e.clientY };
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = arr.current, p = punto(e);
    if (!a || a.tipo === 'tap') {
      if (herr === 'ruta' && e.pointerType === 'mouse') setHover(ajustar(p, circRutaActual || null));
      else if (herr === 'punto' && e.pointerType === 'mouse') setHover({ p: { x: r3(g05(p.x)), y: r3(g05(p.y)) }, tipo: 'grid' });
      return;
    }
    if (a.tipo === 'pan') { setVb({ ...a.vb, x: a.vb.x - (e.clientX - a.x0) * px, y: a.vb.y - (e.clientY - a.y0) * px }); return; }
    if (a.tipo === 'p') {
      a.movio = true;
      const x = r3(g05(p.x - a.dx)), y = r3(g05(p.y - a.dy));
      setCot(c => {
        const pt = c.puntos.find(k => k.id === a.id); if (!pt || (pt.x === x && pt.y === y)) return c;
        const rutas = c.rutas.map(tr => {
          const mios = a.pegados.filter(pg => pg.ruta === tr.id); if (!mios.length) return tr;
          const pts = tr.pts.map(q => ({ ...q }));
          mios.forEach(pg => {
            const viejo = pts[pg.idx], vecino = pg.idx === 0 ? 1 : pts.length - 2;
            if (pts.length >= 3) { const v = pts[vecino]; if (Math.abs(v.x - viejo.x) < 0.005) v.x = x; else if (Math.abs(v.y - viejo.y) < 0.005) v.y = y; }
            pts[pg.idx] = { x, y };
          });
          return { ...tr, pts, auto: false };
        });
        return { ...c, puntos: c.puntos.map(k => k.id === a.id ? { ...k, x, y } : k), rutas };
      });
      return;
    }
    if (a.tipo === 'vert') {
      a.movio = true;
      const tr = cot.rutas.find(k => k.id === a.ruta); if (!tr) return;
      const extremo = a.idx === 0 || a.idx === tr.pts.length - 1;
      const s = extremo ? ajustar(p, tr.circuito, { ruta: tr.id, idx: a.idx }) : { p: { x: r3(g05(p.x)), y: r3(g05(p.y)) }, tipo: 'grid' as const };
      setCot(c => ({ ...c, rutas: c.rutas.map(k => k.id === a.ruta ? { ...k, auto: false, pts: k.pts.map((q, i) => i === a.idx ? s.p : q) } : k) }));
    }
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = arr.current; arr.current = null;
    const ini = inicioTap.current; inicioTap.current = null;
    if ((a?.tipo === 'p' || a?.tipo === 'vert') && !a.movio) pasado.current.pop();
    if (a?.tipo === 'p' || a?.tipo === 'vert') { setVer(v => v + 1); return; }
    const tap = ini && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < 8;
    if (!tap) return;
    const p = punto(e);
    if (herr === 'punto') { ponerPunto(p); return; }
    if (herr === 'ruta') { agregarVertice(ajustar(p, circRutaActual || null)); return; }
    if (herr === 'mover' && a?.tipo !== undefined) setSel(null);
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement; if (el && /input|select|textarea/i.test(el.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) rehacer(); else deshacer(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); rehacer(); return; }
      if (e.key === 'Escape') { if (dibujo.length >= 2) terminar(); else setDibujo([]); return; }
      if (e.key === 'Enter' && dibujo.length >= 2) { terminar(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); borrarSel(); return; }
      if (e.key.toLowerCase() === 'r' && sel?.tipo === 'p') girar(sel.id);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  const borrarSel = () => {
    if (!sel) return;
    if (sel.tipo === 'p') commit(c => ({ ...c, puntos: c.puntos.filter(a => a.id !== sel.id).map(a => a.controla?.includes(sel.id) ? { ...a, controla: a.controla.filter(x => x !== sel.id) } : a) }));
    else commit(c => ({ ...c, rutas: c.rutas.filter(t => t.id !== sel.id) }));
    setSel(null);
  };
  const girar = (id: string) => commit(c => ({ ...c, puntos: c.puntos.map(a => a.id === id ? { ...a, rot: (a.rot + 90) % 360 } : a) }));
  const trazar = (base: CotizacionEle = cot, confirmar = true) => {
    if (!base.puntos.length) { avisar('Primero pon los puntos.'); return; }
    if (confirmar && base.rutas.some(t => !t.auto) && !confirm(`Se reemplazan las ${base.rutas.length} tuberías actuales por un trazado nuevo. ¿Seguir? (Puedes deshacer)`)) return;
    let b = base;
    if (b.puntos.some(p => !esEspecial(p.tipo) && !b.circuitos.some(c => c.id === p.circuito))) { const s = sugerirCircuitos(b); b = { ...b, ...s }; }
    const { rutas, puntos, notas } = trazarAutomatico(b);
    commit(() => ({ ...b, rutas, puntos }));
    setSel(null); setHerr('mover');
    avisar(notas.length ? notas.join(' ') : `✓ ${rutas.length} tuberías trazadas desde el tablero: revísalas y muévelas si hace falta.`);
  };
  const sugerir = () => {
    if (!cot.puntos.some(p => !esEspecial(p.tipo))) { avisar('Primero pon luces, interruptores y tomacorrientes.'); return; }
    if (cot.circuitos.some(c => c.manual) && !confirm('Se rehacen los circuitos (los que ajustaste a mano también). ¿Seguir? (Puedes deshacer)')) return;
    const s = sugerirCircuitos(cot);
    const b = { ...cot, ...s };
    const t = b.puntos.some(p => p.tipo === 'tablero') ? trazarAutomatico(b) : null;
    commit(() => (t ? { ...b, rutas: t.rutas, puntos: t.puntos } : { ...b, rutas: [] }));
    setSel(null); setFoco(null);
    avisar(`✓ ${s.circuitos.length} circuitos: ${s.circuitos.map(c => `${c.nombre} ${c.desc.toLowerCase()}`).join(' · ')}${t ? ' — tuberías trazadas.' : ' — pon el tablero para trazar.'}`);
  };
  const cargarEjemplo = () => {
    const ej = cotizacionEjemplo();
    const b = { ...ej, ...sugerirCircuitos(ej) };
    const t = trazarAutomatico(b);
    const lleno = { ...b, rutas: t.rutas, puntos: t.puntos };
    setImp(importarFondo('blanco'));
    commit(() => lleno); setSel(null); setHerr('mover'); setFoco(null); encuadrar(lleno);
  };

  const avisos = useMemo(() => avisosCNE(cot, duchas), [cot, duchas]);
  const selP = sel?.tipo === 'p' ? cot.puntos.find(a => a.id === sel.id) : undefined;
  const selR = sel?.tipo === 'ruta' ? cot.rutas.find(t => t.id === sel.id) : undefined;
  const total = totalCon(r, cot);
  const vacio = !cot.puntos.length && !cot.rutas.length;

  // ── Dibujo ──
  const fs = Math.max(0.07, Math.min(0.2, px * 11));
  const sz = Math.max(0.24, Math.min(0.5, px * 24));
  const grid = useMemo(() => {
    const out: React.ReactElement[] = [];
    const paso = V.w > 30 ? 1 : V.w > 12 ? 0.5 : 0.25;
    const x0 = Math.floor(V.x / paso) * paso, y0 = Math.floor(V.y / paso) * paso;
    for (let x = x0; x <= V.x + V.w; x += paso) { const fuerte = Math.abs(x - Math.round(x)) < 1e-6; out.push(<line key={`x${x.toFixed(2)}`} x1={x} x2={x} y1={V.y} y2={V.y + VH} stroke={fuerte ? '#e2e8f0' : '#eef2f6'} strokeWidth={px * (fuerte ? 1 : 0.6)} />); }
    for (let y = y0; y <= V.y + VH; y += paso) { const fuerte = Math.abs(y - Math.round(y)) < 1e-6; out.push(<line key={`y${y.toFixed(2)}`} y1={y} y2={y} x1={V.x} x2={V.x + V.w} stroke={fuerte ? '#e2e8f0' : '#eef2f6'} strokeWidth={px * (fuerte ? 1 : 0.6)} />); }
    return out;
  }, [V.x, V.y, V.w, VH, px]);

  const muro = (m: MuroRef, i: number) => {
    const L = Math.hypot(m.x2 - m.x1, m.y2 - m.y1); if (L < 0.01) return null;
    const ux = (m.x2 - m.x1) / L, uy = (m.y2 - m.y1) / L;
    const cortes: { a: number; b: number; tipo: 'muro' | 'puerta' | 'ventana' }[] = [];
    let t = 0;
    [...(m.vanos || [])].sort((p, q) => p.t - q.t).forEach(v => {
      const a = Math.max(t, v.t - v.w / 2), b = Math.min(L, v.t + v.w / 2); if (b <= a) return;
      if (a > t) cortes.push({ a: t, b: a, tipo: 'muro' });
      cortes.push({ a, b, tipo: v.puerta ? 'puerta' : 'ventana' }); t = b;
    });
    if (t < L) cortes.push({ a: t, b: L, tipo: 'muro' });
    return (
      <g key={`m${i}`} pointerEvents="none">
        {cortes.map((c, k) => {
          const x1 = m.x1 + ux * c.a, y1 = m.y1 + uy * c.a, x2 = m.x1 + ux * c.b, y2 = m.y1 + uy * c.b;
          if (c.tipo === 'muro') return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a8a29e" strokeWidth={m.a} strokeLinecap="square" opacity={0.5} />;
          if (c.tipo === 'ventana') return <g key={k}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a8a29e" strokeWidth={m.a} opacity={0.2} /><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth={px * 1.5} /></g>;
          // Puerta: arco de giro tenue.
          const w = c.b - c.a, nx = -uy, ny = ux;
          return <path key={k} d={`M${x1} ${y1} L${x1 + nx * w} ${y1 + ny * w} A${w} ${w} 0 0 0 ${x2} ${y2}`} fill="none" stroke="#cbd5e1" strokeWidth={px} />;
        })}
      </g>
    );
  };
  const refFondo = (rf: RefFondo, i: number) => {
    if (rf.tipo === 'aparato' && rf.gas) return <g key={`r${i}`} transform={`translate(${rf.x} ${rf.y}) rotate(${rf.rot})`} opacity={0.35} pointerEvents="none"><SimboloAparato tipo={rf.gas} sw={Math.max(0.01, px * 1.1)} /></g>;
    if (rf.tipo === 'columna') return <rect key={`r${i}`} x={rf.x - rf.w / 2} y={rf.y - rf.d / 2} width={rf.w} height={rf.d} fill="#94a3b8" opacity={0.6} pointerEvents="none" />;
    if (rf.tipo === 'area') return <g key={`r${i}`} pointerEvents="none"><rect x={rf.x - rf.w / 2} y={rf.y - rf.d / 2} width={rf.w} height={rf.d} fill="#fef3c7" fillOpacity={0.35} stroke="#d97706" strokeWidth={px * 1.4} strokeDasharray={`${px * 8} ${px * 5}`} /><text x={rf.x - rf.w / 2 + fs * 0.4} y={rf.y - rf.d / 2 + fs * 1.2} fontSize={fs * 0.9} fontWeight={800} fill="#b45309">{rf.etiqueta}</text></g>;
    return <g key={`r${i}`} transform={`translate(${rf.x} ${rf.y}) rotate(${rf.rot})`} pointerEvents="none">
      <rect x={-rf.w / 2} y={-rf.d / 2} width={rf.w} height={rf.d} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={px} strokeDasharray={rf.alto ? `${px * 5} ${px * 3}` : undefined} opacity={0.9} />
      <text x={0} y={fs * 0.3} fontSize={fs * 0.7} fontWeight={700} fill="#64748b" textAnchor="middle">{(rf.etiqueta || '').slice(0, 22)}</text>
    </g>;
  };

  const offRuta = (t: Ruta) => offsetCircuito(cot, t.circuito);
  const ruta = (t: Ruta) => {
    const c = colorCircuito(cot, t.circuito);
    const s = sel?.tipo === 'ruta' && sel.id === t.id;
    const pts = desplazar(t.pts, offRuta(t));
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
    const w = t.circuito === ALIM ? Math.max(0.035, px * 3.2) : Math.max(0.022, px * 2.2);
    const op = foco && foco !== t.circuito ? 0.15 : 1;
    let li = 0, lm = 0; for (let i = 0; i < pts.length - 1; i++) { const L = dist(pts[i], pts[i + 1]); if (L > lm) { lm = L; li = i; } }
    const A = pts[li], B = pts[li + 1];
    const info = r.info.get(t.id);
    const ux = lm ? (B.x - A.x) / lm : 1, uy = lm ? (B.y - A.y) / lm : 0;
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const n = info && verCond && circuitoDe(cot, t.circuito)?.uso !== 'debil' ? Math.min(6, info.cond) : 0;
    return (
      <g key={t.id} data-ruta={t.id} style={{ cursor: herr === 'mover' ? 'pointer' : undefined }} opacity={op}>
        <path d={d} fill="none" stroke="transparent" strokeWidth={Math.max(w * 4, px * 18)} strokeLinejoin="round" />
        {s && <path d={d} fill="none" stroke="#fcd34d" strokeWidth={w + px * 8} strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />}
        <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round"
          strokeDasharray={t.via === 'piso' && t.circuito !== ALIM ? `${px * 9} ${px * 5}` : t.circuito === PT ? `${px * 10} ${px * 4} ${px * 2} ${px * 4}` : undefined} />
        {/* Rayitas = número de conductores (como en los planos) */}
        {n > 0 && lm > sz * 2 && Array.from({ length: n }).map((_, k) => {
          const o = (k - (n - 1) / 2) * px * 5, cx = mx + ux * o, cy = my + uy * o, h = px * 5;
          return <line key={k} x1={cx - (ux + uy) * h * 0.6} y1={cy - (uy - ux) * h * 0.6} x2={cx + (ux + uy) * h * 0.6} y2={cy + (uy - ux) * h * 0.6} stroke={c} strokeWidth={px * 1.3} pointerEvents="none" />;
        })}
      </g>
    );
  };

  const tabsHerr: { id: Herr; label: string; icon: any }[] = [
    { id: 'mover', label: 'Mover', icon: MousePointer2 }, { id: 'mano', label: 'Mano', icon: Hand },
    { id: 'punto', label: 'Punto', icon: Plus }, { id: 'ruta', label: 'Tubería', icon: Spline },
  ];

  const editarCirc = (id: string, cambio: Partial<Circuito>, manual = false) => commit(c => ({ ...c, circuitos: c.circuitos.map(k => k.id === id ? { ...k, ...cambio, ...(manual ? { manual: true } : {}) } : k) }));

  const panelSel = (
    <>
      {selP && (() => {
        const d = defPunto(selP.tipo), col = colorCircuito(cot, selP.circuito);
        const luces = cot.puntos.filter(x => esLuz(x.tipo)).sort((a, b) => dist(a, selP) - dist(b, selP)).slice(0, 10);
        return (
          <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2.5 border border-amber-200">
            <div className="flex flex-nowrap items-center gap-2">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center"><IconoPunto tipo={selP.tipo} className="w-8 h-8" color={col} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-800 truncate">{nombrePunto(selP, cot.puntos)}</p>
                <p className="text-[11px] text-slate-500 truncate">{d.nombre} · h {f2(d.h)} m</p>
              </div>
              <button onClick={() => setSel(null)} title="Cerrar" className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2">
              <label className="block min-w-0 text-[10px] font-bold text-slate-500 uppercase">Nombre
                <input value={selP.nombre || ''} onChange={e => setCot(c => ({ ...c, puntos: c.puntos.map(a => a.id === selP.id ? { ...a, nombre: e.target.value || undefined } : a) }))} placeholder={d.corto} className={inputTxt} />
              </label>
              {(d.w > 0 || selP.w) ? (
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Potencia
                  <div className="mt-0.5 flex items-center min-h-[40px] rounded-lg bg-slate-100">
                    <input type="number" min={0} step={10} value={potencia(selP)} onChange={e => { const v = Math.max(0, parseFloat(e.target.value) || 0); setCot(c => ({ ...c, puntos: c.puntos.map(a => a.id === selP.id ? { ...a, w: v } : a) })); }}
                      className="w-full min-w-0 bg-transparent px-2 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none" />
                    <span className="pr-2 text-[11px] font-bold text-slate-400">W</span>
                  </div>
                </label>
              ) : <div />}
            </div>
            {!esEspecial(selP.tipo) && (
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Circuito
                <select value={selP.circuito || ''} onChange={e => {
                  const v = e.target.value;
                  if (v === '__nuevo') { commit(c => { const n = nuevoCircuito(c.circuitos, d.uso || 'tomas', d.exclusivo ? nombrePunto(selP, c.puntos) : undefined); return { ...c, circuitos: renumerar([...c.circuitos, n]), puntos: c.puntos.map(a => a.id === selP.id ? { ...a, circuito: n.id } : a) }; }); return; }
                  commit(c => ({ ...c, puntos: c.puntos.map(a => a.id === selP.id ? { ...a, circuito: v || undefined } : a) }));
                }} className={`${inputTxt} cursor-pointer`} style={{ color: col }}>
                  <option value="">Sin circuito</option>
                  {cot.circuitos.map(c => <option key={c.id} value={c.id}>{c.nombre} · {c.desc}</option>)}
                  <option value="__nuevo">+ Circuito nuevo</option>
                </select>
              </label>
            )}
            {esInterruptor(selP.tipo) && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Controla <span className="normal-case font-semibold text-slate-400">({defPunto(selP.tipo).retornos} retorno{(defPunto(selP.tipo).retornos || 1) > 1 ? 's' : ''})</span></p>
                <div className="flex flex-wrap gap-1">
                  {luces.map(l => { const on = selP.controla?.includes(l.id); return (
                    <button key={l.id} onClick={() => commit(c => ({ ...c, puntos: c.puntos.map(a => a.id === selP.id ? { ...a, controla: on ? (a.controla || []).filter(x => x !== l.id) : [...(a.controla || []), l.id] } : a) }))}
                      className={`min-h-[32px] px-2 rounded-lg text-[11px] font-bold cursor-pointer border ${on ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-slate-200 text-slate-500'}`}>{on && <Check className="w-3 h-3 inline mr-0.5" />}{nombrePunto(l, cot.puntos)}</button>
                  ); })}
                  {!luces.length && <p className="text-[11px] text-slate-400">Pon luminarias para enlazarlas.</p>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => girar(selP.id)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><RotateCw className="w-4 h-4" /> Girar</button>
              <button onClick={() => { const n = { ...selP, id: uid(), x: r3(selP.x + 0.5), nombre: undefined, controla: undefined }; commit(c => ({ ...c, puntos: [...c.puntos, n] })); setSel({ tipo: 'p', id: n.id }); }} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Copy className="w-4 h-4" /> Copiar</button>
              <button onClick={borrarSel} className={`${btn} bg-rose-50 text-rose-700 hover:bg-rose-100`}><Trash2 className="w-4 h-4" /> Quitar</button>
            </div>
          </div>
        );
      })()}
      {selR && (() => {
        const info = r.info.get(selR.id), col = colorCircuito(cot, selR.circuito);
        return (
          <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2.5 border border-amber-200">
            <div className="flex flex-nowrap items-center gap-2">
              <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${col}1f` }}><Spline className="w-5 h-5" style={{ color: col }} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-800 truncate">{nombreCircuito(cot, selR.circuito)} · tubo Ø {info?.diam || '3/4'}"</p>
                <p className="text-[11px] text-slate-500 truncate">{f2(largoRuta(selR))} m en planta + {f2(info?.vert || 0)} m de bajadas · {info?.texto}</p>
              </div>
              <button onClick={() => setSel(null)} title="Cerrar" className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={selR.circuito} onChange={e => { const v = e.target.value; commit(c => ({ ...c, rutas: c.rutas.map(t => t.id === selR.id ? { ...t, circuito: v } : t) })); }} className={`${sel1} w-full`} style={{ color: col }}>
                {cot.circuitos.map(c => <option key={c.id} value={c.id}>{c.nombre} · {c.desc}</option>)}
                <option value={ALIM}>Alimentador</option><option value={PT}>Línea a tierra</option>
              </select>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                {(['techo', 'piso'] as const).map(v => <button key={v} onClick={() => commit(c => ({ ...c, rutas: c.rutas.map(t => t.id === selR.id ? { ...t, via: v } : t) }))} className={`min-h-[30px] rounded-lg text-[11px] font-bold cursor-pointer ${selR.via === v ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}>{v === 'techo' ? 'Por techo' : 'Por piso'}</button>)}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 text-[11px] font-bold">
              <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-700">{info?.curvas || 0} curvas</span>
              <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-700">{info?.paso || 0} cajas de paso</span>
              <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-700">{Math.ceil(((info?.len || 0) + (info?.vert || 0)) / 3)} barras</span>
            </div>
            <button onClick={borrarSel} className={`${btn} w-full bg-rose-50 text-rose-700 hover:bg-rose-100`}><Trash2 className="w-4 h-4" /> Quitar tubería</button>
            <p className="text-[10px] text-slate-400">Arrastra los puntos blancos para mover la tubería. Las rayitas indican cuántos conductores pasan.</p>
          </div>
        );
      })()}
    </>
  );

  const paleta = (modo: 'fila' | 'grilla') => (
    <div className={modo === 'fila' ? 'flex gap-3 w-max' : 'space-y-2'}>
      {CATS.map(cat => (
        <div key={cat} className={modo === 'fila' ? 'shrink-0' : ''}>
          <p className="text-[9px] font-black uppercase text-slate-400 mb-1">{cat}</p>
          <div className={modo === 'fila' ? 'flex gap-1' : 'grid grid-cols-5 gap-1'}>
            {PUNTOS.filter(p => p.cat === cat).map(a => (
              <button key={a.id} onClick={() => { setTipoP(a.id); setHerr('punto'); setDibujo([]); }} title={a.nombre}
                className={`${modo === 'fila' ? 'w-[60px]' : ''} min-w-0 flex flex-col items-center gap-0.5 rounded-xl border px-0.5 py-1 cursor-pointer transition-colors ${herr === 'punto' && tipoP === a.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                <IconoPunto tipo={a.id} className="w-7 h-7" color={a.cat === 'Tablero y tierra' ? '#334155' : '#b45309'} />
                <span className="text-[9px] font-bold text-slate-700 leading-tight truncate max-w-full">{a.corto}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const [abierto, setAbierto] = useState<string | null>(null);
  const panelCircuitos = (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-1"><ListTree className="w-4 h-4 text-amber-500" /> Circuitos <span className="font-semibold text-slate-400">({cot.circuitos.length})</span></p>
        <button onClick={sugerir} className="min-h-[32px] px-2 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 cursor-pointer inline-flex items-center gap-1"><WandSparkles className="w-3.5 h-3.5" /> Sugerir</button>
        <select value="" onChange={e => { const u = e.target.value as UsoCircuito; if (!u) return; commit(c => ({ ...c, circuitos: renumerar([...c.circuitos, nuevoCircuito(c.circuitos, u)]) })); }} className="min-h-[32px] w-[34px] px-1 rounded-lg bg-slate-100 text-[11px] font-black text-slate-700 cursor-pointer" title="Agregar circuito">
          <option value="">＋</option>
          {(Object.keys(USOS) as UsoCircuito[]).map(u => <option key={u} value={u}>{USOS[u].nombre}</option>)}
        </select>
      </div>
      {!cot.circuitos.length ? <p className="text-[11px] text-slate-400">Pon los puntos: cada uno entra solo a su circuito (alumbrado, tomas, cocina, exclusivos). O toca "Sugerir".</p> : (
        <div className="space-y-1">
          {cot.circuitos.map(c => {
            const n = puntosCircuito(cot, c.id).length, w = cargaCircuito(cot, c.id), ab = abierto === c.id;
            return (
              <div key={c.id} className={`rounded-xl border ${foco === c.id ? 'border-amber-400 bg-amber-50/40' : 'border-slate-100 bg-slate-50/60'}`}>
                <div className="flex flex-nowrap items-center gap-1.5 px-2 py-1.5">
                  <button onClick={() => setFoco(f => f === c.id ? null : c.id)} title="Resaltar en el plano" className="w-3.5 h-3.5 rounded-full shrink-0 cursor-pointer ring-2 ring-white" style={{ background: c.color }} />
                  <button onClick={() => setFoco(f => f === c.id ? null : c.id)} className="min-w-0 flex-1 text-left cursor-pointer">
                    <p className="text-[12px] font-black text-slate-800 truncate">{c.nombre} <span className="font-semibold text-slate-500">{c.desc}</span></p>
                    <p className="text-[10px] text-slate-400 truncate">{n} pts · {Math.round(w)} W{c.uso !== 'debil' ? ` · 2×${c.breaker} A · ${c.seccion} mm²${c.diferencial ? ' · ID 30 mA' : ''}` : ' · coaxial / UTP'}</p>
                  </button>
                  <button onClick={() => setAbierto(a => a === c.id ? null : c.id)} title="Editar" className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-white cursor-pointer">{ab ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                </div>
                {ab && (
                  <div className="px-2 pb-2 space-y-1.5">
                    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-1.5">
                      <input value={c.nombre} onChange={e => editarCirc(c.id, { nombre: e.target.value })} className={`${sel1} w-full cursor-text`} />
                      <input value={c.desc} onChange={e => editarCirc(c.id, { desc: e.target.value })} className={`${sel1} w-full cursor-text`} />
                    </div>
                    {c.uso !== 'debil' && (
                      <div className="grid grid-cols-3 gap-1.5">
                        <select value={c.seccion} onChange={e => editarCirc(c.id, { seccion: parseFloat(e.target.value) }, true)} className={sel1} title="Sección del conductor">{[2.5, 4, 6, 10, 16].map(s => <option key={s} value={s}>{s} mm²</option>)}</select>
                        <select value={c.breaker} onChange={e => editarCirc(c.id, { breaker: parseInt(e.target.value) }, true)} className={sel1} title="Termomagnético">{[16, 20, 25, 32, 40, 50, 63].map(s => <option key={s} value={s}>2×{s} A</option>)}</select>
                        <select value={c.tubo} onChange={e => editarCirc(c.id, { tubo: e.target.value }, true)} className={sel1} title="Tubo">{['3/4', '1'].map(s => <option key={s} value={s}>Ø {s}"</option>)}</select>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {c.uso !== 'debil' && <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-amber-500" checked={c.diferencial} onChange={e => editarCirc(c.id, { diferencial: e.target.checked })} /> Diferencial 30 mA</label>}
                      <div className="flex gap-0.5">{PALETA_CIRCUITOS.slice(0, 8).map(k => <button key={k} onClick={() => editarCirc(c.id, { color: k })} className={`w-4 h-4 rounded-full cursor-pointer ${c.color === k ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`} style={{ background: k }} />)}</div>
                      <span className="flex-1" />
                      {c.manual && <button onClick={() => editarCirc(c.id, { manual: false })} className="text-[10px] font-bold text-amber-700 underline cursor-pointer">Calcular solo</button>}
                      <button onClick={() => { if (n && !confirm(`${c.nombre} tiene ${n} puntos: quedarán sin circuito. ¿Quitar?`)) return; commit(k => ({ ...k, circuitos: renumerar(k.circuitos.filter(x => x.id !== c.id)), rutas: k.rutas.filter(t => t.circuito !== c.id), puntos: k.puntos.map(p => p.circuito === c.id ? { ...p, circuito: undefined } : p) })); }} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer" title="Quitar circuito"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const panelAvisos = (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <p className="text-xs font-black text-slate-800 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Revisión CNE <span className="font-semibold text-slate-400">(Utilización)</span></p>
      {!cot.puntos.some(p => !esEspecial(p.tipo)) ? <p className="text-[11px] text-slate-400">Pon puntos para revisar la instalación.</p>
        : !avisos.length ? <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5"><CircleCheck className="w-4 h-4" /> Sin observaciones: circuitos, protecciones y tierra en orden.</p>
          : <div className="space-y-1 max-h-64 overflow-y-auto pr-1">{avisos.map((a, i) => (
            <button key={i} onClick={() => { if (a.punto) { setSel({ tipo: 'p', id: a.punto }); setHerr('mover'); } }} className={`w-full text-left text-[11px] font-bold flex gap-1.5 rounded-lg px-2 py-1.5 ${a.punto ? 'cursor-pointer' : 'cursor-default'} ${a.nivel === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'}`}><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />{a.texto}</button>
          ))}</div>}
    </div>
  );

  const cn = r.conteo;
  const panelConteo = (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-black text-slate-800 flex-1">Conteo automático</p>
        <button onClick={() => setVerCond(v => !v)} className={`text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer ${verCond ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>{verCond ? 'Conductores visibles' : 'Conductores ocultos'}</button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {([['Tubo', `${f2(cn.tuboTotal)} m`], ['Cable', `${Math.round(cn.cableTotal)} m`], ['Curvas', cn.curvas], ['Cajas octog.', cn.octogonales], ['Cajas rect.', cn.rectangulares + cn.cuadradas], ['Cajas paso', cn.paso], ['Conectores', cn.conectores], ['Uniones', cn.uniones], ['Coax / UTP', `${Math.round(cn.coax)} / ${Math.round(cn.utp)} m`]] as [string, string | number][]).map(([l, v]) => (
          <div key={l} className="rounded-xl bg-slate-50 px-1.5 py-1.5 min-w-0"><p className="text-[9px] font-bold text-slate-400 uppercase truncate">{l}</p><p className="text-[12px] font-black font-mono text-slate-800 truncate">{v}</p></div>
        ))}
      </div>
      {Object.keys(cn.cable).length > 0 && <p className="text-[10px] text-slate-500">{Object.entries(cn.cable).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([s, m]) => `${s} mm²: ${m} m`).join(' · ')}</p>}
    </div>
  );

  const resumen = (
    <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center gap-2"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex-1">Resumen</p><span className="text-[10px] font-bold text-amber-300">{(r.cuadro.md / 1000).toFixed(2)} kW de máx. demanda</span></div>
      <div>
        <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
        <p className="text-[11px] text-slate-400 mt-1">{r.puntos.luz} pts de luz · {r.puntos.toma} tomas · {r.puntos.fuerza} fuerza · {r.puntos.debil} TV/datos · incluye GG {cot.gg}% y utilidad {cot.util}%</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {([['Circuitos', `${cot.circuitos.length}`], ['Interr. general', `2×${r.cuadro.ig} A`], ['Alimentador', `${r.cuadro.seccionAlim} mm²`]] as [string, string][]).map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white/5 px-2 py-2 min-w-0"><p className="text-[9px] font-bold text-slate-400 truncate uppercase">{l}</p><p className="text-sm font-black font-mono truncate">{v}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button onClick={onCuadro} disabled={vacio} className="inline-flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl bg-white/10 text-white text-[11px] font-black cursor-pointer hover:bg-white/20 disabled:opacity-40"><Zap className="w-4 h-4" /> Cargas</button>
        <button onClick={onMateriales} disabled={vacio} className="inline-flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl bg-white/10 text-white text-[11px] font-black cursor-pointer hover:bg-white/20 disabled:opacity-40"><Ruler className="w-4 h-4" /> Material</button>
        <button onClick={onPresupuesto} disabled={vacio} className="inline-flex items-center justify-center gap-1 px-2 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-[11px] font-black cursor-pointer hover:bg-amber-300 disabled:opacity-40"><ClipboardList className="w-4 h-4" /> Presup.</button>
      </div>
    </div>
  );

  // Fondo: selector y acciones.
  const panelFondo = (
    <div className="flex flex-col lg:flex-row lg:items-center gap-2 pt-2 border-t border-slate-100">
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-[10px] font-black uppercase text-slate-500 shrink-0 flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Fondo</p>
        <div className="flex-1 lg:flex-none grid grid-cols-5 gap-0.5 p-0.5 bg-slate-100 rounded-xl min-w-0">
          {FONDOS.map(f => (
            <button key={f.id} onClick={() => elegirFondo(f.id, cot.fondo.nivel)} className={`min-h-[34px] min-w-0 px-1 lg:px-2.5 rounded-lg text-[11px] font-bold cursor-pointer truncate ${cot.fondo.tipo === f.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
              <span className="hidden sm:inline">{f.label}</span><span className="sm:hidden">{f.corto}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
        {cot.fondo.tipo === 'blanco' && (['ancho', 'largo'] as const).map(k => (
          <label key={k} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">{k === 'ancho' ? 'Ancho' : 'Largo'}
            <input type="number" min={1} max={60} step={0.05} value={cot.fondo[k]} onChange={e => { const v = Math.max(0.5, Math.min(60, parseFloat(e.target.value) || 0)); setCot(c => { const f = { ...c.fondo, [k]: v }; return { ...c, fondo: { ...f, muros: murosAmbiente(f.ancho, f.largo) } }; }); }}
              className="w-16 min-h-[34px] px-2 rounded-lg bg-slate-100 font-mono text-xs text-right" /> m
          </label>
        ))}
        {cot.fondo.tipo === 'obra' && pisos.length > 1 && (
          <select value={cot.fondo.nivel || pisos[0]} onChange={e => elegirFondo('obra', e.target.value)} className={sel1}>{pisos.map(p => <option key={p} value={p}>{p}</option>)}</select>
        )}
        {cot.fondo.tipo !== 'blanco' && <p className="text-[11px] text-slate-500 min-w-0 truncate flex-1">{imp.texto}</p>}
        {cot.fondo.tipo !== 'blanco' && <button onClick={() => elegirFondo(cot.fondo.tipo, cot.fondo.nivel)} title="Volver a leer" className="min-h-[34px] px-2 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 cursor-pointer hover:bg-slate-200 inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Actualizar</button>}
        {sugeridos.length > 0 && <button onClick={agregarSugeridos} className="min-h-[34px] px-2.5 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-black cursor-pointer hover:bg-amber-300 inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> {cot.fondo.tipo === 'obra' ? `Importar ${sugeridos.length} puntos de Obra Civil` : `Agregar ${sugeridos.length} puntos sugeridos`}</button>}
      </div>
    </div>
  );

  const nPuntos = r.puntos.luz + r.puntos.toma + r.puntos.fuerza + r.puntos.debil;
  const visibles = [...cot.circuitos.map(c => ({ id: c.id, nombre: c.nombre, color: c.color })), ...(cot.rutas.some(t => t.circuito === ALIM) ? [{ id: ALIM, nombre: 'Alim.', color: COLOR_ALIM }] : []), ...(cot.rutas.some(t => t.circuito === PT) ? [{ id: PT, nombre: 'Tierra', color: COLOR_PT }] : [])];
  return (
    <div className="p-2 sm:p-4 max-w-[1700px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-4 xl:items-start">
      <div className="space-y-3 min-w-0">
        <DatosObra cot={cot} setCot={setCot} onCargar={c => { pasado.current = []; futuro.current = []; setVer(v => v + 1); setSel(null); setImp(importarFondo(c.fondo.tipo, c.fondo.nivel)); encuadrar(c); }} onEjemplo={cargarEjemplo} fondo={panelFondo} />

        <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 border-b border-slate-100">
            <div className="flex p-0.5 bg-slate-100 rounded-xl gap-0.5">
              {tabsHerr.map(t => { const Ic = t.icon; return (
                <button key={t.id} onClick={() => { setHerr(t.id); if (t.id !== 'ruta') setDibujo([]); setHover(null); }} title={t.label}
                  className={`min-h-[40px] min-w-[46px] inline-flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-1 px-1 sm:px-2.5 rounded-lg text-[9px] sm:text-xs font-bold cursor-pointer ${herr === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                  <Ic className="w-4 h-4 text-amber-600" /><span className="leading-tight">{t.label}</span>
                </button>
              ); })}
            </div>
            <div className="flex gap-0.5">
              <button onClick={deshacer} disabled={!pasado.current.length} title="Deshacer" className="w-8 sm:w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"><Undo2 className="w-4 h-4" /></button>
              <button onClick={rehacer} disabled={!futuro.current.length} title="Rehacer" className="w-8 sm:w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"><Redo2 className="w-4 h-4" /></button>
            </div>
            <div className="hidden sm:flex gap-0.5">
              <button onClick={() => zoom(1 / 1.3)} title="Acercar" className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => zoom(1.3)} title="Alejar" className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
            </div>
            <div className="flex-1" />
            <button onClick={sugerir} title="Sugerir circuitos" className={`${btn} hidden md:inline-flex bg-amber-50 text-amber-800 hover:bg-amber-100`}><ListTree className="w-4 h-4" /> Sugerir<span className="hidden 2xl:inline"> circuitos</span></button>
            <button onClick={() => trazar()} title="Trazar automáticamente" className={`${btn} px-2.5 sm:px-3 bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs`}><WandSparkles className="w-4 h-4" /> <span className="hidden sm:inline xl:hidden 2xl:inline">Trazar automáticamente</span><span className="sm:hidden xl:inline 2xl:hidden">Trazar</span></button>
          </div>

          {herr === 'ruta' && (
            <div className="flex flex-wrap items-center gap-1.5 px-2 py-2 border-b border-slate-100 bg-slate-50/70">
              <select value={circRutaActual} onChange={e => setRutaCirc(e.target.value)} className={sel1} style={{ color: colorCircuito(cot, circRutaActual) }}>
                {cot.circuitos.map(c => <option key={c.id} value={c.id}>{c.nombre} · {c.desc}</option>)}
                <option value={ALIM}>Alimentador</option><option value={PT}>Línea a tierra</option>
              </select>
              <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-white border border-slate-200 rounded-lg">
                {(['techo', 'piso'] as const).map(v => <button key={v} onClick={() => setRutaVia(v)} className={`min-h-[32px] px-2 rounded-md text-[11px] font-bold cursor-pointer ${rutaVia === v ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>{v === 'techo' ? 'Techo' : 'Piso'}</button>)}
              </div>
              <label className="inline-flex items-center gap-1.5 min-h-[36px] px-1 text-[11px] font-bold text-slate-600 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-amber-500" checked={orto} onChange={e => setOrto(e.target.checked)} /> En L</label>
              {dibujo.length > 0 && <>
                <button onClick={() => terminar()} disabled={dibujo.length < 2} className={`${btn} bg-amber-400 text-slate-950 disabled:opacity-40`}><Check className="w-4 h-4" /> Terminar</button>
                <button onClick={() => setDibujo([])} className={`${btn} bg-white text-slate-600 border border-slate-200`}><X className="w-4 h-4" /> Cancelar</button>
              </>}
            </div>
          )}
          {herr === 'punto' && (
            <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50/70">
              <span className="text-[11px] font-bold text-slate-600 truncate"><IconoPunto tipo={tipoP} className="w-5 h-5 inline -mt-0.5 mr-1" color="#b45309" />{defPunto(tipoP).nombre}</span>
              {!esEspecial(tipoP) && (
                <select value={circP} onChange={e => setCircP(e.target.value)} className={sel1}>
                  <option value="auto">Circuito automático</option>
                  {cot.circuitos.map(c => <option key={c.id} value={c.id}>{c.nombre} · {c.desc}</option>)}
                </select>
              )}
            </div>
          )}
          {herr === 'punto' && <div className="xl:hidden p-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto">{paleta('fila')}</div>}

          <div ref={host} className="relative xl:!h-[calc(100vh-318px)] xl:min-h-[440px] bg-slate-50" style={{ height: altoMovil }}>
            <svg ref={svgRef} viewBox={`${V.x} ${V.y} ${V.w} ${VH}`} className="absolute inset-0 w-full h-full select-none" style={{ fontFamily: 'system-ui', cursor: herr === 'mano' ? 'grab' : herr === 'mover' ? 'default' : 'crosshair' }}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { arr.current = null; inicioTap.current = null; }} onPointerLeave={() => setHover(null)} onContextMenu={e => e.preventDefault()}>
              {herr === 'mano' && <rect data-arrastre="1" x={V.x} y={V.y} width={V.w} height={VH} fill="transparent" />}
              {grid}
              {cot.fondo.refs.filter(x => x.tipo === 'area').map(refFondo)}
              {cot.fondo.muros.map(muro)}
              {cot.fondo.refs.filter(x => x.tipo !== 'area').map(refFondo)}
              {cot.fondo.tipo === 'blanco' && cot.fondo.muros.length === 4 && (() => {
                const b = limites({ puntos: [], rutas: [], fondo: cot.fondo }), y = b.y0 - fs * 2.2, x = b.x0 - fs * 2.2;
                return <g pointerEvents="none" fill="#64748b" fontSize={fs * 0.9} fontWeight={800}>
                  <line x1={b.x0} x2={b.x1} y1={y} y2={y} stroke="#94a3b8" strokeWidth={px} />
                  <text x={(b.x0 + b.x1) / 2} y={y - fs * 0.35} textAnchor="middle">{f2(b.x1 - b.x0)} m</text>
                  <line y1={b.y0} y2={b.y1} x1={x} x2={x} stroke="#94a3b8" strokeWidth={px} />
                  <text x={x - fs * 0.35} y={(b.y0 + b.y1) / 2} textAnchor="middle" transform={`rotate(-90 ${x - fs * 0.35} ${(b.y0 + b.y1) / 2})`}>{f2(b.y1 - b.y0)} m</text>
                </g>;
              })()}
              {/* Tuberías: por el piso abajo, por el techo encima */}
              {[...cot.rutas].sort((a, b) => (a.via === b.via ? 0 : a.via === 'piso' ? -1 : 1)).map(ruta)}
              {/* Interruptor elegido → luces que controla */}
              {selP && esInterruptor(selP.tipo) && (selP.controla || []).map(id => { const l = cot.puntos.find(x => x.id === id); return l ? <line key={id} x1={selP.x} y1={selP.y} x2={l.x} y2={l.y} stroke="#f59e0b" strokeWidth={px * 2} strokeDasharray={`${px * 4} ${px * 3}`} pointerEvents="none" /> : null; })}
              {/* Puntos */}
              {cot.puntos.map(a => {
                const s = sel?.tipo === 'p' && sel.id === a.id, col = esEspecial(a.tipo) ? (a.tipo === 'pozo_tierra' ? COLOR_PT : '#1e293b') : colorCircuito(cot, a.circuito);
                const k = a.tipo === 'tablero' ? sz * 1.15 : sz;
                const op = foco && a.circuito !== foco && !esEspecial(a.tipo) ? 0.25 : 1;
                return (
                  <g key={a.id} data-punto={a.id} data-arrastre={herr === 'mover' ? '1' : undefined} opacity={op} style={{ cursor: herr === 'mover' ? 'grab' : undefined, touchAction: herr === 'mover' ? 'none' : undefined }}>
                    <circle cx={a.x} cy={a.y} r={k * 0.75} fill={s ? '#fef3c7' : 'transparent'} stroke={s ? '#f59e0b' : 'none'} strokeWidth={px * 1.5} strokeDasharray={`${px * 4} ${px * 3}`} />
                    <g transform={`translate(${a.x} ${a.y}) rotate(${a.rot})`}><SimboloElectrico tipo={a.tipo} s={k} color={col} sw={Math.max(0.008, px * 1.3)} rot={a.rot} /></g>
                    {(esEspecial(a.tipo) || fs < 0.11 || s) && <text x={a.x} y={a.y + k * 0.62 + fs * 0.95} fontSize={fs * 0.78} fontWeight={800} fill="#475569" textAnchor="middle" pointerEvents="none" stroke="white" strokeWidth={fs * 0.25} paintOrder="stroke">{nombrePunto(a, cot.puntos)}</text>}
                  </g>
                );
              })}
              {/* Vértices de la tubería elegida */}
              {selR && herr === 'mover' && selR.pts.map((p, i) => (
                <circle key={i} data-vert={`${selR.id}:${i}`} data-arrastre="1" cx={p.x} cy={p.y} r={Math.max(0.05, px * 8)} fill="white" stroke="#d97706" strokeWidth={px * 2.5} style={{ cursor: 'move', touchAction: 'none' }} />
              ))}
              {dibujo.length > 0 && (
                <g pointerEvents="none">
                  <polyline points={[...dibujo, ...(hover ? conOrto(hover, dibujo[dibujo.length - 1]) : [])].map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={colorCircuito(cot, circRutaActual)} strokeWidth={Math.max(0.025, px * 2.5)} strokeDasharray={`${px * 6} ${px * 4}`} strokeLinecap="round" />
                  {dibujo.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={px * 5} fill="white" stroke={colorCircuito(cot, circRutaActual)} strokeWidth={px * 2} />)}
                </g>
              )}
              {hover && (herr === 'ruta' || herr === 'punto') && (
                herr === 'punto'
                  ? <g transform={`translate(${hover.p.x} ${hover.p.y})`} opacity={0.45} pointerEvents="none"><SimboloElectrico tipo={tipoP} s={sz} color="#b45309" sw={px * 1.2} /></g>
                  : <circle cx={hover.p.x} cy={hover.p.y} r={px * (hover.tipo === 'grid' ? 4 : 8)} fill={hover.tipo === 'grid' ? colorCircuito(cot, circRutaActual) : 'none'} stroke={colorCircuito(cot, circRutaActual)} strokeWidth={px * 2} pointerEvents="none" />
              )}
            </svg>

            <div className="absolute top-2 right-2 flex flex-col gap-1.5">
              <button onClick={() => encuadrar()} title="Ver todo" className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/95 shadow text-slate-700 cursor-pointer hover:bg-white"><Maximize2 className="w-4 h-4" /></button>
              <button onClick={() => zoom(1 / 1.3)} title="Acercar" className="sm:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/95 shadow text-slate-700 cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => zoom(1.3)} title="Alejar" className="sm:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/95 shadow text-slate-700 cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
            </div>
            {!vacio && (
              <div className="absolute left-2 bottom-2 right-14 flex flex-wrap gap-1">
                {visibles.map(v => (
                  <button key={v.id} onClick={() => setFoco(f => f === v.id ? null : v.id)} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-xs cursor-pointer ${foco === v.id ? 'bg-slate-900 text-white' : 'bg-white/90 text-slate-600'}`}>
                    <span className="w-3 h-1 rounded-full" style={{ background: v.color }} />{v.nombre}
                  </button>
                ))}
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 text-[10px] font-bold text-slate-500 shadow-xs pointer-events-none">— techo · - - piso</span>
              </div>
            )}
            {aviso && <div className="absolute top-2 left-2 right-14 sm:right-auto max-w-lg px-3 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-lg">{aviso}</div>}

            {vacio && cot.fondo.tipo === 'blanco' && (
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto max-w-md w-full bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-100 p-5 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center"><Zap className="w-6 h-6" /></div>
                  <div>
                    <p className="text-base font-black text-slate-900">Instalaciones eléctricas</p>
                    <p className="text-xs text-slate-500 mt-1">Pon las luces, interruptores, tomacorrientes, el tablero (TD), el medidor y el pozo a tierra. Luego toca <b>Trazar automáticamente</b>: salen los circuitos, las tuberías, el cuadro de cargas, los materiales y el presupuesto.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={cargarEjemplo} className={`${btn} bg-amber-400 text-slate-950 hover:bg-amber-300`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>
                    <button onClick={() => { setHerr('punto'); setTipoP('tablero'); }} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Plus className="w-4 h-4" /> Empezar en blanco</button>
                  </div>
                  <p className="text-[11px] text-slate-400">¿Ya tienes el plano en Obra Civil, Gasfitería, Melamina o Techos? Elígelo arriba en <b>Fondo</b>.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {!vacio && (
          <div className="xl:hidden sticky bottom-3 z-20 ml-auto w-full lg:w-[420px] bg-slate-900/95 backdrop-blur text-white rounded-2xl shadow-xl px-4 py-2.5 flex flex-nowrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{nPuntos} puntos · {cot.circuitos.length} circuitos · {avisos.length ? `${avisos.length} aviso${avisos.length > 1 ? 's' : ''}` : 'sin avisos'}</p>
              <p className="text-lg font-black font-mono truncate">{S(total)}</p>
            </div>
            <button onClick={onPresupuesto} className={`${btn} bg-amber-400 text-slate-950 hover:bg-amber-300 shrink-0`}><ClipboardList className="w-4 h-4" /> Presupuesto</button>
          </div>
        )}

        <div className="xl:hidden space-y-3">
          {panelSel}
          {panelAvisos}
          {panelCircuitos}
          <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
            <p className="text-xs font-black text-slate-800">Puntos <span className="font-semibold text-slate-400">toca uno y luego el plano</span></p>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">{paleta('fila')}</div>
          </div>
          {panelConteo}
        </div>
      </div>

      <aside className="hidden xl:block sticky top-4 space-y-3 max-h-[calc(100vh-110px)] overflow-y-auto pr-0.5">
        {resumen}
        {panelSel}
        <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
          <p className="text-xs font-black text-slate-800">Puntos <span className="font-semibold text-slate-400">toca uno y luego el plano</span></p>
          {paleta('grilla')}
        </div>
        {panelCircuitos}
        {panelAvisos}
        {panelConteo}
      </aside>
    </div>
  );
}

// ── Datos de la obra, Mis cotizaciones y fondo ──────────────────────────────
function DatosObra({ cot, setCot, onCargar, onEjemplo, fondo }: { cot: CotizacionEle; setCot: SetCot; onCargar: (c: CotizacionEle) => void; onEjemplo: () => void; fondo: React.ReactNode }) {
  const [lista, setLista] = useState<CotizacionEle[]>(leerCotizaciones);
  const [verLista, setVerLista] = useState(false);
  const [aviso, setAviso] = useState('');
  const avisar = (t: string) => { setAviso(t); window.setTimeout(() => setAviso(''), 3000); };
  const guardar = () => {
    const nueva = { ...cot, actualizado: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) };
    const l = [nueva, ...lista.filter(x => x.id !== cot.id)];
    safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); setCot(() => nueva);
    avisar('✓ Guardada en Mis cotizaciones');
  };
  const abrir = (c: CotizacionEle) => { const n = normalizar(c); setCot(() => n); setVerLista(false); onCargar(n); };
  return (
    <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-end">
        <label className="block min-w-0 text-[10px] font-bold text-slate-500 uppercase">Obra
          <input value={cot.nombre} onChange={e => setCot(c => ({ ...c, nombre: e.target.value }))} placeholder="Ej. Casa 2 pisos – Sr. Luis" className={inputTxt} />
        </label>
        <label className="block min-w-0 text-[10px] font-bold text-slate-500 uppercase">Cliente
          <input value={cot.cliente} onChange={e => setCot(c => ({ ...c, cliente: e.target.value }))} placeholder="Nombre del cliente" className={inputTxt} />
        </label>
        <div className="col-span-2 lg:col-span-1 flex flex-wrap items-center gap-1.5">
          <button onClick={guardar} className={`${btn} bg-amber-400 text-slate-950 hover:bg-amber-300`}><Save className="w-4 h-4" /> Guardar</button>
          <button onClick={() => setVerLista(v => !v)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Mis cotizaciones</span><span className="sm:hidden">Mías</span> ({lista.length})</button>
          <button onClick={() => { if (!cot.puntos.length || confirm('¿Empezar una cotización nueva? La actual sigue en Mis cotizaciones si la guardaste.')) { const n = cotizacionVacia(); setCot(() => n); onCargar(n); } }} title="Nueva" className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FilePlus2 className="w-4 h-4" /> Nueva</button>
          {cot.puntos.length > 0 && <button onClick={() => { setCot(c => ({ ...c, id: uid(), nombre: `${c.nombre || 'Cotización'} (copia)`, actualizado: undefined })); avisar('✓ Copia creada: guárdala para tenerla en la lista'); }} title="Duplicar" className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5`}><Copy className="w-4 h-4" /></button>}
        </div>
      </div>
      {aviso && <p className="text-xs font-bold text-emerald-700">{aviso}</p>}
      {verLista && (
        <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
          {lista.length === 0 && <div className="p-3 flex flex-wrap items-center gap-2"><p className="text-xs text-slate-400 flex-1">Aún no guardaste cotizaciones.</p><button onClick={() => { setVerLista(false); onEjemplo(); }} className={`${btn} bg-white text-amber-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button></div>}
          {lista.map(c => (
            <div key={c.id} className="flex flex-nowrap items-center gap-2 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{c.nombre || 'Sin nombre'}{c.cliente ? ` · ${c.cliente}` : ''}</p>
                <p className="text-[11px] text-slate-400 truncate">{(c.puntos || []).length} puntos · {(c.circuitos || []).length} circuitos · {c.actualizado || ''}</p>
              </div>
              <button onClick={() => abrir(c)} className={`${btn} bg-white text-amber-700 hover:bg-amber-50 shrink-0`}>Abrir</button>
              <button onClick={() => { if (confirm('¿Borrar esta cotización?')) { const l = lista.filter(x => x.id !== c.id); safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); } }} title="Borrar"
                className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      {fondo}
    </div>
  );
}
