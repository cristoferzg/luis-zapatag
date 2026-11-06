// =============================================================================
// Gasfitería · Plano: editor en planta (metros, cuadrícula, zoom / desplazamiento,
// deshacer / rehacer). Aparatos con su símbolo, tuberías por red (polilíneas que
// se ajustan a la cuadrícula de 5 cm, a los aparatos y a otras tuberías), trazado
// automático y empalmes calculados de la geometría.
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MousePointer2, Hand, Plus, Spline, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, WandSparkles, RotateCw, Trash2, Copy, Check, X,
  Layers, Save, FolderOpen, FilePlus2, ClipboardList, Droplets, Ruler, Sparkles,
} from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';
import { simb } from '../../lib/currency';
import {
  APARATOS, Aparato, CotizacionGas, KEY_COT_LISTA, Pt, Red, REDES, ORDEN_REDES, TipoAparato, Tramo, conexion, cotizacionEjemplo, cotizacionVacia,
  defAparato, esAgua, leerCotizaciones, limites, murosAmbiente, murosDeObra, nombreAparato, pendienteDefecto, pisosObra, pulg, redesDe, uid, MuroRef, FondoGas,
} from './modeloGasfiteria';
import { MetradoGas, NOMBRE_EMPALME, avisosGas, largoTramo, proyectar, totalCon, trazarAutomatico, Empalme, verificarInstalacion, desaguesInvertidos, grafoRed, Aviso } from './calculoGasfiteria';
import VerificacionGas from './VerificacionGas';
import { IconoAparato, SimboloAparato } from './SimboloAparato';
import DisenoIAInstalacion, { EtiquetasAmbientes, type PlantaIABase, type OpcionesIA } from './DisenoIAInstalacion';

/** Respuesta de disenarGasfiteria (ya revisada en el servidor). */
export interface PropuestaGasIA extends PlantaIABase { aparatos: { tipo: TipoAparato; x: number; y: number; rot: number; nombre?: string }[] }
const EJEMPLOS_IA = [
  'Casa: baño completo con terma, cocina y lavandería con lavadora',
  'Baño de 1.60 × 2.20 m con ducha, inodoro y lavatorio; agua caliente con terma',
  'Departamento: 2 baños, cocina y lavandería; medidor en la fachada',
];
/** Si faltan, agrega el medidor (afuera, en la fachada) y la caja de registro para poder trazar. */
export function completarAparatosGas(aparatos: Aparato[], fondo: FondoGas): Aparato[] {
  const b = limites({ aparatos: [], tramos: [], fondo: fondo.muros.length ? fondo : { ...fondo, muros: [] } });
  const out = [...aparatos];
  if (out.some(a => defAparato(a.tipo).fria) && !out.some(a => a.tipo === 'medidor' || a.tipo === 'tanque')) out.push({ id: uid(), tipo: 'medidor', x: r3(b.x0 + 0.5), y: r3(b.y0 - 0.6), rot: 0 });
  if (out.some(a => defAparato(a.tipo).desague) && !out.some(a => a.tipo === 'caja_registro')) out.push({ id: uid(), tipo: 'caja_registro', x: r3(b.x1 - 0.45), y: r3(b.y1 - 0.5), rot: 0 });
  return out;
}

type SetCot = (f: (c: CotizacionGas) => CotizacionGas) => void;
type Herr = 'mover' | 'mano' | 'aparato' | 'tubo';
type Sel = { tipo: 'ap'; id: string } | { tipo: 'tramo'; id: string } | null;
interface Snap { p: Pt; tipo: 'conexion' | 'vertice' | 'tubo' | 'grid' }

const S = (n: number) => `${simb()} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const f2 = (n: number) => n.toFixed(2);
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const g05 = (n: number) => Math.round(n / 0.05) * 0.05;
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const btn = 'inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl text-xs font-bold cursor-pointer select-none';
const inputTxt = 'mt-0.5 w-full min-h-[40px] px-3 py-2 rounded-lg bg-slate-100 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-300';
const fam = (r: Red) => (r === 'ventilacion' ? 'desague' : r);
const ANCHO_TUBO: Record<string, number> = { '1/2': 0.035, '3/4': 0.045, '1': 0.055, '2': 0.06, '3': 0.075, '4': 0.09 };
const LETRA: Partial<Record<Empalme['tipo'], string>> = { codo90: 'C', codo45: '45', tee: 'T', yee: 'Y', reduccion: 'R', tapon: '•', trampa: 'P' };

export default function PlanoGas({ cot, setCot, r, onPresupuesto, onMateriales }: { cot: CotizacionGas; setCot: SetCot; r: MetradoGas; onPresupuesto: () => void; onMateriales: () => void }) {
  const [herr, setHerr] = useState<Herr>('mover');
  const [tipoAp, setTipoAp] = useState<TipoAparato>('inodoro');
  const [redT, setRedT] = useState<Red>('fria');
  const [diamT, setDiamT] = useState('1/2');
  const [orto, setOrto] = useState(true);
  const [verEmp, setVerEmp] = useState(true);
  const [sel, setSel] = useState<Sel>(null);
  const [dibujo, setDibujo] = useState<Pt[]>([]);
  const [hover, setHover] = useState<Snap | null>(null);
  const [aviso, setAviso] = useState('');
  const avisar = (t: string, ms = 3200) => { setAviso(t); window.setTimeout(() => setAviso(a => (a === t ? '' : a)), ms); };
  // Deshacer / rehacer (aparatos, tuberías y fondo).
  const pasado = useRef<CotizacionGas[]>([]), futuro = useRef<CotizacionGas[]>([]);
  const [, setVer] = useState(0);
  const commit: SetCot = f => { pasado.current.push(cot); if (pasado.current.length > 80) pasado.current.shift(); futuro.current = []; setVer(v => v + 1); setCot(f); };
  const deshacer = () => { const p = pasado.current.pop(); if (!p) return; futuro.current.push(cot); setVer(v => v + 1); setCot(c => ({ ...c, aparatos: p.aparatos, tramos: p.tramos, fondo: p.fondo })); };
  const rehacer = () => { const p = futuro.current.pop(); if (!p) return; pasado.current.push(cot); setVer(v => v + 1); setCot(c => ({ ...c, aparatos: p.aparatos, tramos: p.tramos, fondo: p.fondo })); };

  // ── Vista (viewBox con la proporción del contenedor) ──
  const host = useRef<HTMLDivElement>(null), svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 800, h: 520 });
  const [vb, setVb] = useState<{ x: number; y: number; w: number } | null>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    const ro = new ResizeObserver(() => setTam({ w: Math.max(200, el.clientWidth), h: Math.max(200, el.clientHeight) }));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const encuadrar = (c: CotizacionGas = cot) => {
    const b = limites(c), pad = 0.85;
    const bw = b.x1 - b.x0 + pad * 2, bh = b.y1 - b.y0 + pad * 2;
    const w = Math.max(bw, (bh * tam.w) / tam.h);
    setVb({ x: (b.x0 + b.x1) / 2 - w / 2, y: (b.y0 + b.y1) / 2 - (w * tam.h) / tam.w / 2, w });
  };
  useEffect(() => { encuadrar(); }, [tam.w, tam.h]); // eslint-disable-line react-hooks/exhaustive-deps
  // En el celular el alto del plano sigue la forma del dibujo (sin franjas vacías arriba y abajo).
  const altoMovil = useMemo(() => {
    const b = limites(cot), bw = b.x1 - b.x0 + 1.7, bh = b.y1 - b.y0 + 1.7;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return Math.round(Math.max(320, Math.min(vh * 0.62, (tam.w * bh) / bw + 40)));
  }, [cot.aparatos.length, cot.fondo, tam.w]); // eslint-disable-line react-hooks/exhaustive-deps
  const V = vb || { x: -0.5, y: -0.5, w: 5 };
  const VH = (V.w * tam.h) / tam.w;
  const px = V.w / tam.w; // metros por píxel
  const zoom = (k: number, cx = V.x + V.w / 2, cy = V.y + VH / 2) => setVb(v => { const b = v || V; const w = Math.max(0.8, Math.min(80, b.w * k)); const f = w / b.w; return { x: cx - (cx - b.x) * f, y: cy - (cy - b.y) * f, w }; });
  // Rueda: zoom alrededor del cursor (listener nativo para poder cancelar el scroll).
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const rueda = (e: WheelEvent) => { e.preventDefault(); const p = punto(e); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, p.x, p.y); };
    svg.addEventListener('wheel', rueda, { passive: false });
    return () => svg.removeEventListener('wheel', rueda);
  });
  // Android: el dedo sobre algo que se arrastra (aparato, vértice o con la mano) no mueve la página.
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

  // ── Ajuste (snap) ──
  const ajustar = (p: Pt, red: Red | null, excluir?: { tramo: string; idx: number }): Snap => {
    const tol = Math.max(0.08, px * 16);
    let best: Snap | null = null, bd = tol;
    cot.aparatos.forEach(a => redesDe(a.tipo).filter(x => !red || fam(x) === fam(red)).forEach(x => {
      const c = conexion(a, x), d = dist(c, p); if (d < bd) { bd = d; best = { p: c, tipo: 'conexion' }; }
    }));
    if (best) return best;
    bd = tol * 0.8;
    cot.tramos.forEach(t => { if (red && fam(t.red) !== fam(red)) return; t.pts.forEach((q, i) => { if (excluir && excluir.tramo === t.id && excluir.idx === i) return; const d = dist(q, p); if (d < bd) { bd = d; best = { p: q, tipo: 'vertice' }; } }); });
    if (best) return best;
    bd = tol * 0.6;
    cot.tramos.forEach(t => { if (red && fam(t.red) !== fam(red)) return; if (excluir && excluir.tramo === t.id) return; for (let i = 0; i < t.pts.length - 1; i++) { const pr = proyectar(p, t.pts[i], t.pts[i + 1]); if (pr.d < bd) { bd = pr.d; best = { p: { x: r3(pr.q.x), y: r3(pr.q.y) }, tipo: 'tubo' }; } } });
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

  // ── Interacción ──
  type Arr =
    | { tipo: 'pan'; x0: number; y0: number; vb: { x: number; y: number; w: number } }
    | { tipo: 'ap'; id: string; dx: number; dy: number; pegados: { tramo: string; idx: number; red: Red }[]; movio: boolean }
    | { tipo: 'vert'; tramo: string; idx: number; movio: boolean }
    | { tipo: 'tap'; x0: number; y0: number };
  const arr = useRef<Arr | null>(null);
  const inicioTap = useRef<{ x: number; y: number } | null>(null);

  const terminar = (pts = dibujo) => {
    const limpio = pts.filter((p, i) => i === 0 || dist(p, pts[i - 1]) > 0.005);
    if (limpio.length >= 2) {
      const t: Tramo = { id: uid(), red: redT, diam: diamT, pts: limpio };
      if (redT === 'desague') t.pendiente = pendienteDefecto(diamT);
      commit(c => ({ ...c, tramos: [...c.tramos, t] }));
      setSel({ tipo: 'tramo', id: t.id });
    }
    setDibujo([]);
  };
  const agregarPunto = (s: Snap) => {
    const prev = dibujo[dibujo.length - 1];
    if (prev && dist(prev, s.p) < 0.01) { terminar(); return; } // tocar el último punto = terminar
    const nuevos = [...dibujo, ...conOrto(s, prev)];
    // Llegó a un aparato o a otra tubería: se termina solo.
    if (prev && s.tipo !== 'grid') { terminar(nuevos); return; }
    setDibujo(nuevos);
  };
  const ponerAparato = (p: Pt) => {
    const rot = cot.aparatos.filter(a => a.tipo === tipoAp).slice(-1)[0]?.rot || 0;
    const a: Aparato = { id: uid(), tipo: tipoAp, x: r3(g05(p.x)), y: r3(g05(p.y)), rot };
    commit(c => ({ ...c, aparatos: [...c.aparatos, a] }));
    setSel({ tipo: 'ap', id: a.id });
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.button === 2) return;
    const t = e.target as Element;
    const p = punto(e);
    inicioTap.current = { x: e.clientX, y: e.clientY };
    const capturar = () => { try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* sin captura */ } };
    if (herr === 'mano') { arr.current = { tipo: 'pan', x0: e.clientX, y0: e.clientY, vb: V }; capturar(); return; }
    if (herr === 'mover') {
      const v = t.closest('[data-vert]');
      if (v) {
        const [tid, idx] = (v.getAttribute('data-vert') || '').split(':');
        pasado.current.push(cot); futuro.current = [];
        arr.current = { tipo: 'vert', tramo: tid, idx: Number(idx), movio: false }; capturar(); e.preventDefault(); return;
      }
      const g = t.closest('[data-ap]');
      if (g) {
        const id = g.getAttribute('data-ap')!; const a = cot.aparatos.find(x => x.id === id); if (!a) return;
        const pegados: { tramo: string; idx: number; red: Red }[] = [];
        redesDe(a.tipo).forEach(red => { const c = conexion(a, red); cot.tramos.forEach(tr => { if (fam(tr.red) !== fam(red)) return; [0, tr.pts.length - 1].forEach(idx => { if (dist(tr.pts[idx], c) < 0.03) pegados.push({ tramo: tr.id, idx, red }); }); }); });
        pasado.current.push(cot); futuro.current = [];
        arr.current = { tipo: 'ap', id, dx: p.x - a.x, dy: p.y - a.y, pegados, movio: false };
        setSel({ tipo: 'ap', id }); capturar(); e.preventDefault(); return;
      }
      const tr = t.closest('[data-tramo]');
      if (tr) { setSel({ tipo: 'tramo', id: tr.getAttribute('data-tramo')! }); arr.current = null; return; }
      if (e.pointerType === 'mouse') { arr.current = { tipo: 'pan', x0: e.clientX, y0: e.clientY, vb: V }; capturar(); }
      else arr.current = { tipo: 'tap', x0: e.clientX, y0: e.clientY };
      return;
    }
    arr.current = { tipo: 'tap', x0: e.clientX, y0: e.clientY };
  };
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = arr.current, p = punto(e);
    if (!a || a.tipo === 'tap') {
      if (herr === 'tubo' && e.pointerType === 'mouse') setHover(ajustar(p, redT));
      else if (herr === 'aparato' && e.pointerType === 'mouse') setHover({ p: { x: r3(g05(p.x)), y: r3(g05(p.y)) }, tipo: 'grid' });
      return;
    }
    if (a.tipo === 'pan') {
      const dx = (e.clientX - a.x0) * px, dy = (e.clientY - a.y0) * px;
      setVb({ ...a.vb, x: a.vb.x - dx, y: a.vb.y - dy });
      return;
    }
    if (a.tipo === 'ap') {
      a.movio = true;
      const x = r3(g05(p.x - a.dx)), y = r3(g05(p.y - a.dy));
      setCot(c => {
        const ap = c.aparatos.find(k => k.id === a.id); if (!ap) return c;
        if (ap.x === x && ap.y === y) return c;
        const nuevo = { ...ap, x, y };
        const tramos = c.tramos.map(tr => {
          const mios = a.pegados.filter(pg => pg.tramo === tr.id); if (!mios.length) return tr;
          const pts = tr.pts.map(q => ({ ...q }));
          mios.forEach(pg => {
            const viejo = pts[pg.idx], nu = conexion(nuevo, pg.red);
            const vecino = pg.idx === 0 ? 1 : pts.length - 2;
            // Mantiene el último tramo recto (horizontal o vertical) si la tubería tiene codos.
            if (pts.length >= 3) { const v = pts[vecino]; if (Math.abs(v.x - viejo.x) < 0.005) v.x = nu.x; else if (Math.abs(v.y - viejo.y) < 0.005) v.y = nu.y; }
            pts[pg.idx] = nu;
          });
          return { ...tr, pts, auto: false };
        });
        return { ...c, aparatos: c.aparatos.map(k => k.id === a.id ? nuevo : k), tramos };
      });
      return;
    }
    if (a.tipo === 'vert') {
      a.movio = true;
      const tr = cot.tramos.find(k => k.id === a.tramo); if (!tr) return;
      const extremo = a.idx === 0 || a.idx === tr.pts.length - 1;
      const s = extremo ? ajustar(p, tr.red, { tramo: tr.id, idx: a.idx }) : { p: { x: r3(g05(p.x)), y: r3(g05(p.y)) }, tipo: 'grid' as const };
      setCot(c => ({ ...c, tramos: c.tramos.map(k => k.id === a.tramo ? { ...k, auto: false, pts: k.pts.map((q, i) => i === a.idx ? s.p : q) } : k) }));
    }
  };
  const onUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = arr.current; arr.current = null;
    const ini = inicioTap.current; inicioTap.current = null;
    if (a?.tipo === 'ap' && !a.movio) pasado.current.pop();
    if (a?.tipo === 'vert' && !a.movio) pasado.current.pop();
    if (a?.tipo === 'ap' || a?.tipo === 'vert') { setVer(v => v + 1); return; }
    const tap = ini && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < 8;
    if (!tap) return;
    const p = punto(e);
    if (herr === 'aparato') { ponerAparato(p); return; }
    if (herr === 'tubo') { agregarPunto(ajustar(p, redT)); return; }
    if (herr === 'mover' && a?.tipo !== undefined) setSel(null);
  };

  // Teclado: Supr borra, Ctrl+Z / Ctrl+Y, Esc termina, R gira.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement; if (el && /input|select|textarea/i.test(el.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) rehacer(); else deshacer(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); rehacer(); return; }
      if (e.key === 'Escape') { if (dibujo.length >= 2) terminar(); else setDibujo([]); return; }
      if (e.key === 'Enter' && dibujo.length >= 2) { terminar(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); borrarSel(); return; }
      if (e.key.toLowerCase() === 'r' && sel?.tipo === 'ap') girar(sel.id);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  const borrarSel = () => {
    if (!sel) return;
    if (sel.tipo === 'ap') commit(c => ({ ...c, aparatos: c.aparatos.filter(a => a.id !== sel.id) }));
    else commit(c => ({ ...c, tramos: c.tramos.filter(t => t.id !== sel.id) }));
    setSel(null);
  };
  const girar = (id: string) => commit(c => ({ ...c, aparatos: c.aparatos.map(a => a.id === id ? { ...a, rot: (a.rot + 90) % 360 } : a) }));
  const trazar = () => {
    if (!cot.aparatos.length) { avisar('Primero pon los aparatos.'); return; }
    const manuales = cot.tramos.filter(t => !t.auto).length;
    if (manuales && !confirm(`Se reemplazan las ${cot.tramos.length} tuberías actuales por un trazado nuevo. ¿Seguir? (Puedes deshacer)`)) return;
    const { tramos, notas } = trazarAutomatico(cot.aparatos);
    commit(c => ({ ...c, tramos }));
    setSel(null); setHerr('mover');
    avisar(notas.length ? notas.join(' ') : `✓ ${tramos.length} tuberías trazadas: revísalas y muévelas si hace falta.`);
  };
  const cargarEjemplo = () => {
    const ej = cotizacionEjemplo();
    const lleno = { ...ej, tramos: trazarAutomatico(ej.aparatos).tramos };
    commit(() => lleno); setSel(null); setHerr('mover'); encuadrar(lleno);
  };
  // "Diseñar con IA": distribución nueva (o el fondo actual) + aparatos; luego el trazado automático.
  const aplicarIA = (p: PropuestaGasIA, o: OpcionesIA) => {
    const nuevos: Aparato[] = (p.aparatos || []).filter(a => APARATOS.some(d => d.id === a.tipo))
      .map(a => ({ id: uid(), tipo: a.tipo, x: r3(a.x), y: r3(a.y), rot: a.rot || 0, ...(a.nombre ? { nombre: a.nombre } : {}) }));
    const fondo: FondoGas = p.usaFondo || !p.muros?.length ? cot.fondo : { tipo: 'ambiente', ancho: p.ancho, largo: p.largo, muros: p.muros, ambientes: p.ambientes };
    const aparatos = completarAparatosGas(o.reemplazar ? nuevos : [...cot.aparatos, ...nuevos], fondo);
    const t = trazarAutomatico(aparatos);
    const lleno = { ...cot, fondo, aparatos, tramos: t.tramos };
    commit(() => lleno); setSel(null); setHerr('mover'); setDibujo([]); encuadrar(lleno);
    avisar(`✓ ${nuevos.length} aparatos${p.usaFondo ? '' : ` en ${p.ambientes.length} ambientes`} y ${t.tramos.length} tuberías trazadas. ${t.notas.join(' ')} ${p.notas || ''}`.trim(), 9000);
  };
  const datosFondoIA = () => ({
    muros: cot.fondo.muros, ambientes: (cot.fondo.ambientes || []).map(a => ({ nombre: a.nombre, x: r3(a.x + a.ancho / 2), y: r3(a.y + a.largo / 2) })),
    items: cot.aparatos.map(a => ({ tipo: a.tipo, x: a.x, y: a.y, nombre: a.nombre })),
  });

  const avisos = useMemo(() => avisosGas(cot.tramos, cot.aparatos), [cot.tramos, cot.aparatos]);
  const chequeos = useMemo(() => verificarInstalacion(cot.tramos, cot.aparatos, avisos), [cot.tramos, cot.aparatos, avisos]);
  const invertidos = useMemo(() => desaguesInvertidos(cot.tramos, cot.aparatos), [cot.tramos, cot.aparatos]);
  // "Ver en el plano": elige el aparato o la tubería del aviso y centra la vista en él.
  const ubicar = (a: Aviso) => {
    const ap = a.ap ? cot.aparatos.find(x => x.id === a.ap) : undefined, tr = a.tramo ? cot.tramos.find(x => x.id === a.tramo) : undefined;
    const pts = ap ? [{ x: ap.x, y: ap.y }] : tr ? tr.pts.filter(p => isFinite(p.x) && isFinite(p.y)) : [];
    if (!pts.length) return;
    setHerr('mover'); setDibujo([]);
    setSel(ap ? { tipo: 'ap', id: ap.id } : { tipo: 'tramo', id: tr!.id });
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const w = Math.max(2.5, Math.min(V.w, (Math.max(...xs) - Math.min(...xs)) * 1.6 + 1.5));
    setVb({ x: cx - w / 2, y: cy - (w * tam.h) / tam.w / 2, w });
    host.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const selAp = sel?.tipo === 'ap' ? cot.aparatos.find(a => a.id === sel.id) : undefined;
  const selTr = sel?.tipo === 'tramo' ? cot.tramos.find(t => t.id === sel.id) : undefined;
  const total = totalCon(r, cot);
  const vacio = !cot.aparatos.length && !cot.tramos.length;
  const obraMuros = useMemo(() => murosDeObra().length, []);

  // ── Dibujo ──
  const fs = Math.max(0.07, Math.min(0.2, px * 11));
  const grid = useMemo(() => {
    const out: React.ReactElement[] = [];
    const paso = V.w > 30 ? 1 : V.w > 12 ? 0.5 : 0.25;
    const x0 = Math.floor(V.x / paso) * paso, y0 = Math.floor(V.y / paso) * paso;
    for (let x = x0; x <= V.x + V.w; x += paso) { const fuerte = Math.abs(x - Math.round(x)) < 1e-6; out.push(<line key={`x${x.toFixed(2)}`} x1={x} x2={x} y1={V.y} y2={V.y + VH} stroke={fuerte ? '#cbd5e1' : '#e2e8f0'} strokeWidth={px * (fuerte ? 1 : 0.6)} />); }
    for (let y = y0; y <= V.y + VH; y += paso) { const fuerte = Math.abs(y - Math.round(y)) < 1e-6; out.push(<line key={`y${y.toFixed(2)}`} y1={y} y2={y} x1={V.x} x2={V.x + V.w} stroke={fuerte ? '#cbd5e1' : '#e2e8f0'} strokeWidth={px * (fuerte ? 1 : 0.6)} />); }
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
          if (c.tipo === 'muro') return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a8a29e" strokeWidth={m.a} strokeLinecap="square" opacity={0.55} />;
          if (c.tipo === 'ventana') return <g key={k}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a8a29e" strokeWidth={m.a} opacity={0.22} /><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#38bdf8" strokeWidth={px * 1.5} /></g>;
          return null;
        })}
      </g>
    );
  };

  const tubo = (t: Tramo) => {
    const c = REDES[t.red].color, w = ANCHO_TUBO[t.diam] || 0.04;
    const s = sel?.tipo === 'tramo' && sel.id === t.id;
    const d = t.pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
    // Etiqueta en el tramo más largo.
    let li = 0, lm = 0; for (let i = 0; i < t.pts.length - 1; i++) { const L = dist(t.pts[i], t.pts[i + 1]); if (L > lm) { lm = L; li = i; } }
    const A = t.pts[li], B = t.pts[li + 1];
    const vert = Math.abs(A.x - B.x) < Math.abs(A.y - B.y);
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const etiqueta = `${pulg(t.diam)}${t.red === 'desague' && t.pendiente ? ` · ${t.pendiente}%` : ''}`;
    const off = fs * 0.9;
    return (
      <g key={t.id} data-tramo={t.id} style={{ cursor: herr === 'mover' ? 'pointer' : undefined }}>
        <path d={d} fill="none" stroke="transparent" strokeWidth={Math.max(w * 3, px * 18)} strokeLinejoin="round" />
        {s && <path d={d} fill="none" stroke="#5eead4" strokeWidth={w + px * 8} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />}
        <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={t.red === 'ventilacion' ? `${w * 2} ${w * 1.4}` : undefined} />
        {lm > fs * 4 && (
          <g transform={`translate(${vert ? mx + off : mx} ${vert ? my : my - off * 0.75})${vert ? ' rotate(-90)' : ''}`} pointerEvents="none">
            <rect x={-etiqueta.length * fs * 0.3} y={-fs * 0.78} width={etiqueta.length * fs * 0.6} height={fs * 1.05} rx={fs * 0.25} fill="white" opacity={0.85} />
            <text x={0} y={0} fontSize={fs * 0.85} fontWeight={800} fill={c} textAnchor="middle">{etiqueta}</text>
          </g>
        )}
        {t.red === 'desague' && lm > fs * 3 && (() => { // flecha del sentido del flujo (hacia la caja, según la red)
          const sg = invertidos.has(t.id) ? -1 : 1, ux = sg * (A.x - B.x) / lm, uy = sg * (A.y - B.y) / lm, k = fs * 0.5, cx = mx + ux * fs * 2.2, cy = my + uy * fs * 2.2;
          return <path d={`M${cx + ux * k} ${cy + uy * k} L${cx - ux * k - uy * k * 0.7} ${cy - uy * k + ux * k * 0.7} L${cx - ux * k + uy * k * 0.7} ${cy - uy * k - ux * k * 0.7}Z`} fill={c} pointerEvents="none" />;
        })()}
        {t.llave && (() => {
          const a = t.pts[0], b = t.pts[1], L = dist(a, b) || 1, k = Math.min(0.25, L / 2) / L;
          const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k, z = fs * 0.55, h = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
          return <path d={h ? `M${x - z} ${y - z} L${x + z} ${y + z} L${x + z} ${y - z} L${x - z} ${y + z}Z` : `M${x - z} ${y - z} L${x + z} ${y + z} L${x - z} ${y + z} L${x + z} ${y - z}Z`} fill="#0f172a" stroke="white" strokeWidth={px} pointerEvents="none" />;
        })()}
      </g>
    );
  };

  const empalmesVis = verEmp ? r.empalmes.filter(e => LETRA[e.tipo] && (!e.enAparato || e.tipo === 'trampa')) : [];
  const clusterEmp = useMemo(() => {
    const m = new Map<string, Empalme[]>();
    empalmesVis.forEach(e => { const k = `${e.x.toFixed(2)},${e.y.toFixed(2)}`; m.set(k, [...(m.get(k) || []), e]); });
    return [...m.values()];
  }, [empalmesVis]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabsHerr: { id: Herr; label: string; icon: any }[] = [
    { id: 'mover', label: 'Mover', icon: MousePointer2 }, { id: 'mano', label: 'Mano', icon: Hand },
    { id: 'aparato', label: 'Aparato', icon: Plus }, { id: 'tubo', label: 'Tubería', icon: Spline },
  ];
  const elegirRed = (rd: Red) => { setRedT(rd); setDiamT(REDES[rd].defecto); };

  const panelSel = (
    <>
      {selAp && (() => {
        const d = defAparato(selAp.tipo);
        const conectado = (red: Red) => grafoRed(cot.tramos, cot.aparatos, fam(red) as 'fria' | 'caliente' | 'desague').nudos.some(n => n.aristas.length && n.aparatos.some(x => x.ap.id === selAp.id && x.red === red));
        return (
          <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2.5 border border-teal-200">
            <div className="flex flex-nowrap items-center gap-2">
              <span className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center"><IconoAparato tipo={selAp.tipo} className="w-8 h-8" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-800 truncate">{nombreAparato(selAp, cot.aparatos)}</p>
                <p className="text-[11px] text-slate-500 truncate">{d.nombre} · ({f2(selAp.x)}, {f2(selAp.y)}) m</p>
              </div>
              <button onClick={() => setSel(null)} title="Cerrar" className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Nombre (opcional)
              <input value={selAp.nombre || ''} onChange={e => setCot(c => ({ ...c, aparatos: c.aparatos.map(a => a.id === selAp.id ? { ...a, nombre: e.target.value || undefined } : a) }))} placeholder={d.corto} className={inputTxt} />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {redesDe(selAp.tipo).map(red => {
                const ok = conectado(red), dm = red === 'desague' ? d.desague : red === 'fria' ? d.fria : d.caliente;
                return <span key={red} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: REDES[red].color }} />{REDES[red].nombre}{dm ? ` ${pulg(dm)}` : d.fuente === red ? ' (sale)' : d.colector ? ' (llega)' : ''}{ok ? <Check className="w-3 h-3" /> : ' · falta'}</span>;
              })}
              {d.trampa && <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600">con trampa P</span>}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => girar(selAp.id)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><RotateCw className="w-4 h-4" /> Girar</button>
              <button onClick={() => { const n = { ...selAp, id: uid(), x: r3(selAp.x + 0.6), nombre: undefined }; commit(c => ({ ...c, aparatos: [...c.aparatos, n] })); setSel({ tipo: 'ap', id: n.id }); }} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Copy className="w-4 h-4" /> Copiar</button>
              <button onClick={borrarSel} className={`${btn} bg-rose-50 text-rose-700 hover:bg-rose-100`}><Trash2 className="w-4 h-4" /> Quitar</button>
            </div>
          </div>
        );
      })()}
      {selTr && (
        <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2.5 border border-teal-200">
          <div className="flex flex-nowrap items-center gap-2">
            <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: REDES[selTr.red].claro }}><Spline className="w-5 h-5" style={{ color: REDES[selTr.red].color }} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-800 truncate">{REDES[selTr.red].nombre} {pulg(selTr.diam)}</p>
              <p className="text-[11px] text-slate-500 truncate">{REDES[selTr.red].material} · {f2(largoTramo(selTr))} m · {selTr.pts.length} puntos</p>
            </div>
            <button onClick={() => setSel(null)} title="Cerrar" className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
            {ORDEN_REDES.map(rd => (
              <button key={rd} onClick={() => commit(c => ({ ...c, tramos: c.tramos.map(t => t.id === selTr.id ? { ...t, red: rd, diam: REDES[rd].diams.includes(t.diam) ? t.diam : REDES[rd].defecto, pendiente: rd === 'desague' ? (t.pendiente || pendienteDefecto(REDES[rd].defecto)) : undefined, llave: esAgua(rd) ? t.llave : undefined } : t) }))}
                className={`min-h-[36px] min-w-0 rounded-lg text-[11px] font-bold cursor-pointer truncate px-1 ${selTr.red === rd ? 'bg-white shadow-xs' : 'text-slate-500'}`} style={selTr.red === rd ? { color: REDES[rd].color } : undefined}>{REDES[rd].corto}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Diámetro</span>
            {REDES[selTr.red].diams.map(dm => (
              <button key={dm} onClick={() => commit(c => ({ ...c, tramos: c.tramos.map(t => t.id === selTr.id ? { ...t, diam: dm, pendiente: t.red === 'desague' ? pendienteDefecto(dm) : t.pendiente } : t) }))}
                className={`min-h-[36px] min-w-[44px] px-2 rounded-lg text-xs font-black cursor-pointer ${selTr.diam === dm ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{pulg(dm)}</button>
            ))}
          </div>
          {selTr.red === 'desague' && (
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600">Pendiente
              <input type="number" min={0} max={15} step={0.5} value={selTr.pendiente ?? 0} onChange={e => { const v = Math.max(0, parseFloat(e.target.value) || 0); setCot(c => ({ ...c, tramos: c.tramos.map(t => t.id === selTr.id ? { ...t, pendiente: v } : t) })); }}
                className="w-20 min-h-[36px] px-2 rounded-lg bg-slate-100 font-mono text-sm text-right" /> %
              <span className="text-slate-400 font-semibold">mín. {selTr.diam === '4' ? '1' : '1.5'} %</span>
            </label>
          )}
          {esAgua(selTr.red) && (
            <label className="inline-flex items-center gap-2 min-h-[36px] text-xs font-bold text-slate-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-teal-600" checked={!!selTr.llave} onChange={e => commit(c => ({ ...c, tramos: c.tramos.map(t => t.id === selTr.id ? { ...t, llave: e.target.checked } : t) }))} /> Llave de paso al inicio
            </label>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => commit(c => ({ ...c, tramos: c.tramos.map(t => t.id === selTr.id ? { ...t, pts: [...t.pts].reverse() } : t) }))} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><RotateCw className="w-4 h-4" /> Invertir sentido</button>
            <button onClick={borrarSel} className={`${btn} bg-rose-50 text-rose-700 hover:bg-rose-100`}><Trash2 className="w-4 h-4" /> Quitar</button>
          </div>
          <p className="text-[10px] text-slate-400">Arrastra los puntos blancos para mover la tubería. Los extremos se pegan a los aparatos y a otras tuberías.</p>
        </div>
      )}
    </>
  );

  const paleta = (cols: string) => (
    <div className={`grid ${cols} gap-1.5`}>
      {APARATOS.map(a => (
        <button key={a.id} onClick={() => { setTipoAp(a.id); setHerr('aparato'); setDibujo([]); }} title={a.nombre}
          className={`min-w-0 flex flex-col items-center gap-0.5 rounded-xl border px-1 py-1.5 cursor-pointer transition-colors ${herr === 'aparato' && tipoAp === a.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
          <IconoAparato tipo={a.id} className="w-8 h-8" />
          <span className="text-[10px] font-bold text-slate-700 leading-tight truncate max-w-full">{a.corto}</span>
        </button>
      ))}
    </div>
  );

  const panelAvisos = <VerificacionGas chequeos={chequeos} hayAparatos={cot.aparatos.length > 0} onUbicar={ubicar} />;

  const resumenEmp = useMemo(() => {
    const m = new Map<string, { e: Empalme; n: number }>();
    r.empalmes.forEach(e => { const k = `${e.tipo}|${e.diam}|${REDES[e.red].sis}`; const g = m.get(k); if (g) g.n += e.cant; else m.set(k, { e, n: e.cant }); });
    return [...m.values()].sort((a, b) => ORDEN_REDES.indexOf(a.e.red) - ORDEN_REDES.indexOf(b.e.red) || b.n - a.n);
  }, [r.empalmes]);
  const panelEmp = (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-black text-slate-800 flex-1">Empalmes automáticos <span className="font-semibold text-slate-400">({r.nEmpalmes})</span></p>
        <button onClick={() => setVerEmp(v => !v)} className={`text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer ${verEmp ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>{verEmp ? 'Se ven en el plano' : 'Ocultos'}</button>
      </div>
      {!resumenEmp.length ? <p className="text-[11px] text-slate-400">Salen solos al dibujar las tuberías: codos, tees, yees, reducciones, trampas y llaves.</p> : (
        <div className="flex flex-wrap gap-1">
          {resumenEmp.map(({ e, n }) => (
            <span key={`${e.tipo}${e.diam}${e.red}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-[11px] font-bold text-slate-700">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: REDES[e.red].color }} />{NOMBRE_EMPALME[e.tipo]} {pulg(e.diam)} <span className="text-slate-400">×{n}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const pisos = useMemo(() => pisosObra(), []);
  const panelFondo = (
    <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
      <p className="text-xs font-black text-slate-800 flex items-center gap-1.5"><Layers className="w-4 h-4 text-slate-400" /> Fondo del plano</p>
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
        {([['ambiente', 'Ambiente'], ['obra', 'Obra Civil'], ['ninguno', 'Sin fondo']] as const).map(([v, l]) => (
          <button key={v} onClick={() => commit(c => ({ ...c, fondo: v === 'ambiente' ? { ...c.fondo, tipo: v, muros: murosAmbiente(c.fondo.ancho, c.fondo.largo), ambientes: undefined } : v === 'obra' ? { ...c.fondo, tipo: v, nivel: c.fondo.nivel || pisos[0], muros: murosDeObra(c.fondo.nivel || pisos[0]), ambientes: undefined } : { ...c.fondo, tipo: v, muros: [], ambientes: undefined } }))}
            className={`min-h-[36px] min-w-0 rounded-lg text-[11px] font-bold cursor-pointer truncate px-1 ${cot.fondo.tipo === v ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>
      {cot.fondo.tipo === 'ambiente' && (
        <div className="grid grid-cols-2 gap-2">
          {(['ancho', 'largo'] as const).map(k => (
            <label key={k} className="block text-[10px] font-bold text-slate-500 uppercase">{k === 'ancho' ? 'Ancho' : 'Largo'}
              <div className="mt-0.5 flex items-center min-h-[40px] rounded-lg bg-slate-100">
                <input type="number" min={1} max={40} step={0.05} value={cot.fondo[k]} onChange={e => { const v = Math.max(0.5, Math.min(40, parseFloat(e.target.value) || 0)); setCot(c => { const f = { ...c.fondo, [k]: v }; return { ...c, fondo: { ...f, muros: murosAmbiente(f.ancho, f.largo), ambientes: undefined } }; }); }}
                  className="w-full min-w-0 bg-transparent px-2 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none" />
                <span className="pr-2 text-[11px] font-bold text-slate-400">m</span>
              </div>
            </label>
          ))}
        </div>
      )}
      {cot.fondo.tipo === 'obra' && (
        <div className="space-y-1.5">
          {pisos.length > 1 && (
            <select value={cot.fondo.nivel || pisos[0]} onChange={e => { const n = e.target.value; commit(c => ({ ...c, fondo: { ...c.fondo, nivel: n, muros: murosDeObra(n) } })); }} className={`${inputTxt} cursor-pointer`}>
              {pisos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          <p className="text-[11px] text-slate-500">{cot.fondo.muros.length ? `${cot.fondo.muros.length} muros de Obra Civil como referencia (solo lectura).` : 'No hay muros dibujados en Obra Civil para este piso.'}</p>
          <button onClick={() => { commit(c => ({ ...c, fondo: { ...c.fondo, muros: murosDeObra(c.fondo.nivel) } })); avisar('✓ Muros actualizados desde Obra Civil'); }} className={`${btn} w-full bg-slate-100 text-slate-700 hover:bg-slate-200`}>Actualizar desde Obra Civil</button>
        </div>
      )}
    </div>
  );

  const nPuntos = r.puntos.fria + r.puntos.caliente + r.puntos.desague + r.puntos.ventilacion;
  const resumen = (
    <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl space-y-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resumen</p>
      <div>
        <p className="text-3xl font-black font-mono leading-none">{S(total)}</p>
        <p className="text-[11px] text-slate-400 mt-1">{cot.aparatos.length} aparatos · {nPuntos} puntos · {r.nEmpalmes} empalmes · incluye GG {cot.gg}% y utilidad {cot.util}%</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {ORDEN_REDES.map(rd => (
          <div key={rd} className="rounded-xl bg-white/5 px-2.5 py-2 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 truncate"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: REDES[rd].color }} />{REDES[rd].nombre}</p>
            <p className="text-sm font-black font-mono">{f2(r.largo[rd])} m</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={onMateriales} disabled={vacio} className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 text-white text-xs font-black cursor-pointer hover:bg-white/20 disabled:opacity-40"><Ruler className="w-4 h-4" /> Materiales</button>
        <button onClick={onPresupuesto} disabled={vacio} className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-500 text-white text-xs font-black cursor-pointer hover:bg-teal-400 disabled:opacity-40"><ClipboardList className="w-4 h-4" /> Presupuesto</button>
      </div>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 max-w-[1700px] mx-auto pb-6 xl:grid xl:grid-cols-[minmax(0,1fr)_350px] xl:gap-4 xl:items-start">
      <div className="space-y-3 min-w-0">
        <DatosObra cot={cot} setCot={setCot} onCargar={c => { pasado.current = []; futuro.current = []; setVer(v => v + 1); setSel(null); encuadrar(c); }} onEjemplo={cargarEjemplo} />

        {/* Plano */}
        <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 border-b border-slate-100">
            <div className="flex p-0.5 bg-slate-100 rounded-xl gap-0.5">
              {tabsHerr.map(t => { const Ic = t.icon; return (
                <button key={t.id} onClick={() => { setHerr(t.id); if (t.id !== 'tubo') setDibujo([]); setHover(null); }} title={t.label}
                  className={`min-h-[40px] min-w-[46px] inline-flex flex-col sm:flex-row items-center justify-center gap-0 sm:gap-1 px-1 sm:px-2.5 rounded-lg text-[9px] sm:text-xs font-bold cursor-pointer ${herr === t.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                  <Ic className="w-4 h-4 text-teal-600" /><span className="leading-tight">{t.label}</span>
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
            <DisenoIAInstalacion<PropuestaGasIA> accion="gasfiteria" funcion="disenarGasfiteria" titulo="Diseñar la instalación con IA"
              subtitulo="Ambientes y aparatos sanitarios desde tu descripción, un croquis o un plano; luego se trazan las tuberías"
              placeholder="Ej. Casa de 8 × 10 m: baño completo con ducha y terma, baño de visita, cocina y lavandería; medidor en la fachada"
              ejemplos={EJEMPLOS_IA} onAplicar={aplicarIA}
              fondo={cot.fondo.muros.length && cot.fondo.tipo !== 'ninguno' ? { etiqueta: cot.fondo.tipo === 'obra' ? 'Usar el plano de Obra Civil' : 'Usar el plano actual', porDefecto: cot.fondo.tipo === 'obra' || !!cot.fondo.ambientes?.length, datos: datosFondoIA } : null} />
            <button onClick={trazar} title="Trazar automáticamente" className={`${btn} px-2.5 sm:px-3 bg-teal-600 text-white hover:bg-teal-700 shadow-xs`}><WandSparkles className="w-4 h-4" /> <span className="hidden sm:inline">Trazar automáticamente</span><span className="sm:hidden">Trazar</span></button>
          </div>

          {herr === 'tubo' && (
            <div className="flex flex-wrap items-center gap-1.5 px-2 py-2 border-b border-slate-100 bg-slate-50/70">
              {ORDEN_REDES.map(rd => (
                <button key={rd} onClick={() => elegirRed(rd)} className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-bold cursor-pointer border ${redT === rd ? 'bg-white shadow-xs' : 'border-transparent text-slate-500'}`} style={redT === rd ? { borderColor: REDES[rd].color, color: REDES[rd].color } : undefined}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: REDES[rd].color }} />{REDES[rd].corto}
                </button>
              ))}
              <span className="w-px h-6 bg-slate-200 mx-0.5" />
              {REDES[redT].diams.map(dm => (
                <button key={dm} onClick={() => setDiamT(dm)} className={`min-h-[36px] min-w-[40px] px-2 rounded-lg text-xs font-black cursor-pointer ${diamT === dm ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{pulg(dm)}</button>
              ))}
              <label className="inline-flex items-center gap-1.5 min-h-[36px] px-1 text-[11px] font-bold text-slate-600 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-teal-600" checked={orto} onChange={e => setOrto(e.target.checked)} /> En L</label>
              {dibujo.length > 0 && <>
                <button onClick={() => terminar()} disabled={dibujo.length < 2} className={`${btn} bg-teal-600 text-white disabled:opacity-40`}><Check className="w-4 h-4" /> Terminar</button>
                <button onClick={() => setDibujo([])} className={`${btn} bg-white text-slate-600 border border-slate-200`}><X className="w-4 h-4" /> Cancelar</button>
              </>}
            </div>
          )}
          {herr === 'aparato' && <div className="xl:hidden p-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto"><div className="w-max">{paleta('grid-flow-col auto-cols-[64px]')}</div></div>}

          <div ref={host} className="relative xl:!h-[calc(100vh-250px)] xl:min-h-[480px] bg-slate-50" style={{ height: altoMovil }}>
            <svg ref={svgRef} viewBox={`${V.x} ${V.y} ${V.w} ${VH}`} className="absolute inset-0 w-full h-full select-none" style={{ fontFamily: 'system-ui', cursor: herr === 'mano' ? 'grab' : herr === 'mover' ? 'default' : 'crosshair' }}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { arr.current = null; inicioTap.current = null; }} onPointerLeave={() => setHover(null)} onContextMenu={e => e.preventDefault()}>
              {herr === 'mano' && <rect data-arrastre="1" x={V.x} y={V.y} width={V.w} height={VH} fill="transparent" />}
              {grid}
              {cot.fondo.muros.map(muro)}
              <EtiquetasAmbientes ambientes={cot.fondo.ambientes} fs={fs} />
              {cot.fondo.tipo === 'ambiente' && cot.fondo.muros.length > 0 && (() => {
                const b = limites({ aparatos: [], tramos: [], fondo: cot.fondo }), y = b.y0 - fs * 2.2, x = b.x0 - fs * 2.2;
                return <g pointerEvents="none" fill="#64748b" fontSize={fs * 0.9} fontWeight={800}>
                  <line x1={b.x0} x2={b.x1} y1={y} y2={y} stroke="#94a3b8" strokeWidth={px} /><line x1={b.x0} x2={b.x0} y1={y - fs * 0.4} y2={y + fs * 0.4} stroke="#94a3b8" strokeWidth={px} /><line x1={b.x1} x2={b.x1} y1={y - fs * 0.4} y2={y + fs * 0.4} stroke="#94a3b8" strokeWidth={px} />
                  <text x={(b.x0 + b.x1) / 2} y={y - fs * 0.35} textAnchor="middle">{f2(b.x1 - b.x0)} m</text>
                  <line y1={b.y0} y2={b.y1} x1={x} x2={x} stroke="#94a3b8" strokeWidth={px} /><line y1={b.y0} y2={b.y0} x1={x - fs * 0.4} x2={x + fs * 0.4} stroke="#94a3b8" strokeWidth={px} /><line y1={b.y1} y2={b.y1} x1={x - fs * 0.4} x2={x + fs * 0.4} stroke="#94a3b8" strokeWidth={px} />
                  <text x={x - fs * 0.35} y={(b.y0 + b.y1) / 2} textAnchor="middle" transform={`rotate(-90 ${x - fs * 0.35} ${(b.y0 + b.y1) / 2})`}>{f2(b.y1 - b.y0)} m</text>
                </g>;
              })()}
              {/* Tuberías: desagüe abajo, agua encima */}
              {[...cot.tramos].sort((a, b) => ORDEN_REDES.indexOf(b.red) - ORDEN_REDES.indexOf(a.red)).map(tubo)}
              {/* Aparatos */}
              {cot.aparatos.map(a => {
                const s = sel?.tipo === 'ap' && sel.id === a.id, d = defAparato(a.tipo);
                return (
                  <g key={a.id} data-ap={a.id} data-arrastre={herr === 'mover' ? '1' : undefined} style={{ cursor: herr === 'mover' ? 'grab' : undefined, touchAction: herr === 'mover' ? 'none' : undefined }}>
                    {s && <rect x={a.x - Math.max(d.w, d.d) / 2 - 0.06} y={a.y - Math.max(d.w, d.d) / 2 - 0.06} width={Math.max(d.w, d.d) + 0.12} height={Math.max(d.w, d.d) + 0.12} rx={0.06} fill="#ccfbf1" stroke="#14b8a6" strokeWidth={px * 1.5} strokeDasharray={`${px * 4} ${px * 3}`} />}
                    <g transform={`translate(${a.x} ${a.y}) rotate(${a.rot})`}><SimboloAparato tipo={a.tipo} sw={Math.max(0.01, px * 1.2)} /></g>
                    <text x={a.x} y={a.y + Math.max(d.w, d.d) / 2 + fs * 1.05} fontSize={fs * 0.8} fontWeight={800} fill="#0f766e" textAnchor="middle" pointerEvents="none" stroke="white" strokeWidth={fs * 0.25} paintOrder="stroke">{nombreAparato(a, cot.aparatos)}</text>
                    {(herr === 'tubo' || s) && redesDe(a.tipo).map(red => { const c = conexion(a, red); return <circle key={red} cx={c.x} cy={c.y} r={Math.max(0.025, px * 4)} fill={REDES[red].color} stroke="white" strokeWidth={px * 1.2} pointerEvents="none" />; })}
                  </g>
                );
              })}
              {/* Empalmes */}
              {clusterEmp.map((grupo, i) => {
                const e = grupo[0], z = Math.max(0.03, px * (tam.w < 640 ? 5 : 6.5));
                const txt = grupo.map(g => LETRA[g.tipo]).filter((v, k, a) => a.indexOf(v) === k).join('');
                return (
                  <g key={`e${i}`} pointerEvents="none">
                    <circle cx={e.x} cy={e.y} r={z} fill="white" stroke={REDES[e.red].color} strokeWidth={px * 1.4} />
                    <text x={e.x} y={e.y + z * 0.36} fontSize={z * (txt.length > 2 ? 0.75 : 1.05)} fontWeight={900} fill={REDES[e.red].color} textAnchor="middle">{txt}</text>
                  </g>
                );
              })}
              {/* Vértices del tubo elegido */}
              {selTr && herr === 'mover' && selTr.pts.map((p, i) => (
                <circle key={i} data-vert={`${selTr.id}:${i}`} data-arrastre="1" cx={p.x} cy={p.y} r={Math.max(0.05, px * 8)} fill="white" stroke="#0d9488" strokeWidth={px * 2.5} style={{ cursor: 'move', touchAction: 'none' }} />
              ))}
              {/* Dibujo en curso */}
              {dibujo.length > 0 && (
                <g pointerEvents="none">
                  <polyline points={[...dibujo, ...(hover ? conOrto(hover, dibujo[dibujo.length - 1]) : [])].map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={REDES[redT].color} strokeWidth={ANCHO_TUBO[diamT] || 0.04} strokeDasharray={`${px * 6} ${px * 4}`} strokeLinecap="round" />
                  {dibujo.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={px * 5} fill="white" stroke={REDES[redT].color} strokeWidth={px * 2} />)}
                </g>
              )}
              {hover && (herr === 'tubo' || herr === 'aparato') && (
                herr === 'aparato'
                  ? <g transform={`translate(${hover.p.x} ${hover.p.y})`} opacity={0.45} pointerEvents="none"><SimboloAparato tipo={tipoAp} sw={px * 1.2} /></g>
                  : <circle cx={hover.p.x} cy={hover.p.y} r={px * (hover.tipo === 'grid' ? 4 : 8)} fill={hover.tipo === 'grid' ? REDES[redT].color : 'none'} stroke={REDES[redT].color} strokeWidth={px * 2} pointerEvents="none" />
              )}
            </svg>

            {/* Controles flotantes */}
            <div className="absolute top-2 right-2 flex flex-col gap-1.5">
              <button onClick={() => encuadrar()} title="Ver todo" className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/95 shadow text-slate-700 cursor-pointer hover:bg-white"><Maximize2 className="w-4 h-4" /></button>
              <button onClick={() => zoom(1 / 1.3)} title="Acercar" className="sm:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/95 shadow text-slate-700 cursor-pointer"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => zoom(1.3)} title="Alejar" className="sm:hidden w-10 h-10 inline-flex items-center justify-center rounded-xl bg-white/95 shadow text-slate-700 cursor-pointer"><ZoomOut className="w-4 h-4" /></button>
            </div>
            <div className="absolute left-2 bottom-2 right-14 flex flex-wrap gap-1 pointer-events-none">
              {ORDEN_REDES.map(rd => (
                <span key={rd} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 text-[10px] font-bold text-slate-600 shadow-xs">
                  <span className="w-3 h-1 rounded-full" style={{ background: REDES[rd].color }} />{REDES[rd].corto}
                </span>
              ))}
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 text-[10px] font-bold text-slate-500 shadow-xs">
                {herr === 'tubo' ? 'Toca punto por punto · toca el último para terminar' : herr === 'aparato' ? 'Toca el plano para poner el aparato' : herr === 'mano' ? 'Arrastra para mover el plano' : 'Arrastra los aparatos · toca una tubería para editarla'}
              </span>
            </div>
            {aviso && <div className="absolute top-2 left-2 right-14 sm:right-auto max-w-md px-3 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-lg">{aviso}</div>}

            {vacio && (
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="pointer-events-auto max-w-md w-full bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-100 p-5 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center"><Droplets className="w-6 h-6" /></div>
                  <div>
                    <p className="text-base font-black text-slate-900">Instalaciones sanitarias</p>
                    <p className="text-xs text-slate-500 mt-1">Pon los aparatos (inodoro, lavatorio, ducha, terma…), el medidor y la caja de registro. Luego toca <b>Trazar automáticamente</b>: salen las tuberías, los empalmes, los materiales y el presupuesto.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={cargarEjemplo} className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button>
                    {obraMuros > 0 && <button onClick={() => commit(c => ({ ...c, fondo: { ...c.fondo, tipo: 'obra', nivel: pisos[0], muros: murosDeObra(pisos[0]), ambientes: undefined } }))} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Layers className="w-4 h-4" /> Usar plano de Obra Civil</button>}
                    <button onClick={() => { setHerr('aparato'); setTipoAp('inodoro'); }} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><Plus className="w-4 h-4" /> Empezar en blanco</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {!vacio && (
          <div className="xl:hidden sticky bottom-3 z-20 ml-auto w-full lg:w-[420px] bg-slate-900/95 backdrop-blur text-white rounded-2xl shadow-xl px-4 py-2.5 flex flex-nowrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{cot.aparatos.length} aparatos · {nPuntos} puntos · {avisos.length ? `${avisos.length} aviso${avisos.length > 1 ? 's' : ''}` : 'sin avisos'}</p>
              <p className="text-lg font-black font-mono truncate">{S(total)}</p>
            </div>
            <button onClick={onPresupuesto} className={`${btn} bg-teal-500 text-white hover:bg-teal-400 shrink-0`}><ClipboardList className="w-4 h-4" /> Presupuesto</button>
          </div>
        )}

        <div className="xl:hidden space-y-3">
          {panelSel}
          {panelAvisos}
          <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
            <p className="text-xs font-black text-slate-800">Aparatos <span className="font-semibold text-slate-400">toca uno y luego el plano</span></p>
            {paleta('grid-cols-4 sm:grid-cols-6 lg:grid-cols-8')}
          </div>
          {panelEmp}
          {panelFondo}
        </div>
      </div>

      {/* Columna derecha (PC) */}
      <aside className="hidden xl:block sticky top-4 space-y-3 max-h-[calc(100vh-110px)] overflow-y-auto pr-0.5">
        {resumen}
        {panelSel}
        <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2">
          <p className="text-xs font-black text-slate-800">Aparatos <span className="font-semibold text-slate-400">toca uno y luego el plano</span></p>
          {paleta('grid-cols-5')}
        </div>
        {panelAvisos}
        {panelEmp}
        {panelFondo}
      </aside>
    </div>
  );
}

// ── Datos de la obra y Mis cotizaciones ─────────────────────────────────────
function DatosObra({ cot, setCot, onCargar, onEjemplo }: { cot: CotizacionGas; setCot: SetCot; onCargar: (c: CotizacionGas) => void; onEjemplo: () => void }) {
  const [lista, setLista] = useState<CotizacionGas[]>(leerCotizaciones);
  const [verLista, setVerLista] = useState(false);
  const [aviso, setAviso] = useState('');
  const avisar = (t: string) => { setAviso(t); window.setTimeout(() => setAviso(''), 3000); };
  const guardar = () => {
    const nueva = { ...cot, actualizado: new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) };
    const l = [nueva, ...lista.filter(x => x.id !== cot.id)];
    safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); setCot(() => nueva);
    avisar('✓ Guardada en Mis cotizaciones');
  };
  const abrir = (c: CotizacionGas) => { const n = { ...cotizacionVacia(), ...c }; setCot(() => n); setVerLista(false); onCargar(n); };
  return (
    <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-end">
        <label className="block min-w-0 text-[10px] font-bold text-slate-500 uppercase">Obra
          <input value={cot.nombre} onChange={e => setCot(c => ({ ...c, nombre: e.target.value }))} placeholder="Ej. Baño y cocina – Sr. Luis" className={inputTxt} />
        </label>
        <label className="block min-w-0 text-[10px] font-bold text-slate-500 uppercase">Cliente
          <input value={cot.cliente} onChange={e => setCot(c => ({ ...c, cliente: e.target.value }))} placeholder="Nombre del cliente" className={inputTxt} />
        </label>
        <div className="col-span-2 lg:col-span-1 flex flex-wrap items-center gap-1.5">
          <button onClick={guardar} className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}><Save className="w-4 h-4" /> Guardar</button>
          <button onClick={() => setVerLista(v => !v)} className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FolderOpen className="w-4 h-4" /> <span className="hidden sm:inline">Mis cotizaciones</span><span className="sm:hidden">Mías</span> ({lista.length})</button>
          <button onClick={() => { if (!cot.aparatos.length || confirm('¿Empezar una cotización nueva? La actual sigue en Mis cotizaciones si la guardaste.')) { const n = cotizacionVacia(); setCot(() => n); onCargar(n); } }} title="Nueva" className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}><FilePlus2 className="w-4 h-4" /> Nueva</button>
          {cot.aparatos.length > 0 && <button onClick={() => { setCot(c => ({ ...c, id: uid(), nombre: `${c.nombre || 'Cotización'} (copia)`, actualizado: undefined })); avisar('✓ Copia creada: guárdala para tenerla en la lista'); }} title="Duplicar" className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5`}><Copy className="w-4 h-4" /></button>}
        </div>
      </div>
      {aviso && <p className="text-xs font-bold text-emerald-700">{aviso}</p>}
      {verLista && (
        <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
          {lista.length === 0 && <div className="p-3 flex flex-wrap items-center gap-2"><p className="text-xs text-slate-400 flex-1">Aún no guardaste cotizaciones.</p><button onClick={() => { setVerLista(false); onEjemplo(); }} className={`${btn} bg-white text-teal-700`}><Sparkles className="w-4 h-4" /> Cargar ejemplo</button></div>}
          {lista.map(c => (
            <div key={c.id} className="flex flex-nowrap items-center gap-2 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{c.nombre || 'Sin nombre'}{c.cliente ? ` · ${c.cliente}` : ''}</p>
                <p className="text-[11px] text-slate-400 truncate">{(c.aparatos || []).length} aparatos · {(c.tramos || []).length} tuberías · {c.actualizado || ''}</p>
              </div>
              <button onClick={() => abrir(c)} className={`${btn} bg-white text-teal-700 hover:bg-teal-50 shrink-0`}>Abrir</button>
              <button onClick={() => { if (confirm('¿Borrar esta cotización?')) { const l = lista.filter(x => x.id !== c.id); safeStorage.setItem(KEY_COT_LISTA, l); setLista(l); } }} title="Borrar"
                className="w-10 h-10 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
