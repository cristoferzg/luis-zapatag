// =============================================================================
// CAD de Concreto — Plano de Cimentación 2D (Opción A)
//
// Un lienzo en PLANTA donde el usuario COLOCA elementos de concreto con el mouse
// (columnas y zapatas con un clic; vigas y cimientos con dos clics) sobre una
// rejilla con snapping. El metrado (concreto m³, acero kg, encofrado, materiales
// y costo) se calcula AUTOMÁTICAMENTE de lo dibujado. Diseño sobrio stone/slate.
//
// Autónomo: no depende del motor de Techos. Persiste en localStorage.
// =============================================================================
import { useRef, useState, useMemo, useEffect } from 'react';
import { MousePointer, Columns, Square, Minus, Trash2, Download, Hand, Grid3x3, Plus, Layers, Eye } from 'lucide-react';
import { safeStorage } from '../lib/storageManager';
import ConcretoViewer3D from './ConcretoViewer3D';

export type PlanoTipo = 'columna' | 'zapata' | 'viga' | 'cimiento' | 'losa';
type Herramienta = 'select' | 'pan' | PlanoTipo;

export interface PlanoElem {
  uid: string;
  tipo: PlanoTipo;
  x1: number; y1: number;          // coordenadas en planta (m)
  x2?: number; y2?: number;        // segundo punto (vigas / cimientos)
  a: number;                       // ancho sección (m)
  b?: number;                      // alto sección (columnas/zapatas) (m)
  h?: number;                      // peralte/altura (m)
  H?: number;                      // altura de columna (m)
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
};

const DEFAULTS: Record<PlanoTipo, Omit<PlanoElem, 'uid' | 'tipo' | 'x1' | 'y1' | 'x2' | 'y2'>> = {
  columna:  { a: 0.25, b: 0.25, H: 3.0 },
  zapata:   { a: 1.0,  b: 1.0,  h: 0.5 },
  viga:     { a: 0.25, h: 0.40 },
  cimiento: { a: 0.50, h: 0.60 },
  losa:     { a: 0.20, h: 0.20 },
};

const PRECIOS_DEFAULT = { cementoBolsa: 28, arenaM3: 55, piedraM3: 60, aceroKg: 4.2, encofradoM2: 25 };
const GRID_M = 0.25;

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
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [selUid, setSelUid] = useState<string | null>(null);
  const [vista3d, setVista3d] = useState(false);

  const [elems, setElems] = useState<PlanoElem[]>(() => safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || []);
  const [precios] = useState(() => safeStorage.getItem<typeof PRECIOS_DEFAULT>('concreto_metrados_precios', PRECIOS_DEFAULT) || PRECIOS_DEFAULT);

  useEffect(() => { safeStorage.setItem('concreto_plano_elems', elems); }, [elems]);

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

  const screenToWorld = (clientX: number, clientY: number) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: snap((clientX - r.left - cx) / scale), y: snap((clientY - r.top - cy) / scale) };
  };

  const addPoint = (tipo: PlanoTipo, x: number, y: number) => {
    const d = DEFAULTS[tipo];
    setElems(prev => [...prev, { uid: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, tipo, x1: x, y1: y, ...d }]);
  };
  const addLine = (tipo: PlanoTipo, x1: number, y1: number, x2: number, y2: number) => {
    const d = DEFAULTS[tipo];
    setElems(prev => [...prev, { uid: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, tipo, x1, y1, x2, y2, ...d }]);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (tool === 'pan' || e.button === 1 || e.button === 2) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    }
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: panStart.current.px + (e.clientX - panStart.current.x), y: panStart.current.py + (e.clientY - panStart.current.y) });
      return;
    }
    setCursor(screenToWorld(e.clientX, e.clientY));
  };
  const onMouseUp = () => setIsPanning(false);

  const onClick = (e: React.MouseEvent) => {
    if (isPanning || tool === 'pan') return;
    const w = screenToWorld(e.clientX, e.clientY);
    if (tool === 'select') { setSelUid(null); return; }
    if (tool === 'columna' || tool === 'zapata') { addPoint(tool, w.x, w.y); return; }
    // línea (viga / cimiento)
    if (!pending) { setPending(w); }
    else {
      if (Math.hypot(w.x - pending.x, w.y - pending.y) > 0.05) addLine(tool, pending.x, pending.y, w.x, w.y);
      setPending(null);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(4, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const removeSel = () => { if (selUid) { setElems(prev => prev.filter(e => e.uid !== selUid)); setSelUid(null); } };
  const updateElem = (uid: string, patch: Partial<PlanoElem>) =>
    setElems(prev => prev.map(e => e.uid === uid ? { ...e, ...patch } : e));

  const selElem = elems.find(e => e.uid === selUid) || null;
  // Campos editables por tipo de elemento.
  const CAMPOS: Record<PlanoTipo, { key: keyof PlanoElem; label: string }[]> = {
    columna:  [{ key: 'a', label: 'Ancho sección (m)' }, { key: 'b', label: 'Alto sección (m)' }, { key: 'H', label: 'Altura (m)' }],
    zapata:   [{ key: 'a', label: 'Ancho (m)' }, { key: 'b', label: 'Largo (m)' }, { key: 'h', label: 'Altura (m)' }],
    viga:     [{ key: 'a', label: 'Ancho (m)' }, { key: 'h', label: 'Peralte (m)' }],
    cimiento: [{ key: 'a', label: 'Ancho (m)' }, { key: 'h', label: 'Altura (m)' }],
    losa:     [{ key: 'h', label: 'Espesor (m)' }],
  };

  // Firma de la escena → se usa como key para remontar el visor 3D al cambiar algo.
  const sig3d = useMemo(() => elems.map(e => `${e.uid}:${e.a},${e.b},${e.h},${e.H},${e.x1},${e.y1},${e.x2},${e.y2}`).join('|'), [elems]);

  // ---- Metrado total ----
  const totales = useMemo(() => {
    let concretoM3 = 0, aceroKg = 0, encofradoM2 = 0;
    const metrosDiam: Record<string, number> = {};
    const porTipo: Record<string, { n: number; concreto: number; acero: number }> = {};
    elems.forEach(e => {
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
    { id: 'pan', label: 'Mover lienzo', icon: Hand },
  ];

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
        {selUid && (
          <button onClick={removeSel} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:bg-rose-100">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        )}
        <button onClick={() => { if (confirm('¿Vaciar el plano?')) { setElems([]); setSelUid(null); } }}
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
            <ConcretoViewer3D key={sig3d} elems={elems} />
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
          className={`relative flex-1 min-h-[320px] overflow-hidden bg-slate-50 select-none ${tool === 'pan' || isPanning ? 'cursor-grab' : 'cursor-crosshair'}`}
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
              // LOSA: rectángulo relleno entre esquinas (x1,y1)-(x2,y2)
              if (e.tipo === 'losa' && e.x2 !== undefined && e.y2 !== undefined) {
                const p2 = toScreen(e.x2, e.y2);
                const rx = Math.min(p1.sx, p2.sx), ry = Math.min(p1.sy, p2.sy);
                const rw = Math.abs(p2.sx - p1.sx), rh = Math.abs(p2.sy - p1.sy);
                return (
                  <g key={e.uid} onClick={ev => { ev.stopPropagation(); setSelUid(e.uid); }} className="cursor-pointer">
                    <rect x={rx} y={ry} width={rw} height={rh} fill={m.color} opacity={0.18} stroke={m.color} strokeWidth={sel ? 3 : 1.5} strokeDasharray="6 4" />
                    {sel && <rect x={rx - 3} y={ry - 3} width={rw + 6} height={rh + 6} fill="none" stroke="#0ea5e9" strokeWidth="2" />}
                  </g>
                );
              }
              if (m.esLinea && e.x2 !== undefined && e.y2 !== undefined) {
                const p2 = toScreen(e.x2, e.y2);
                const wPx = Math.max(4, (e.a) * scale);
                return (
                  <g key={e.uid} onClick={ev => { ev.stopPropagation(); setSelUid(e.uid); }} className="cursor-pointer">
                    <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke={m.color} strokeWidth={wPx} strokeLinecap="round" opacity={0.85} />
                    {sel && <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#0ea5e9" strokeWidth={wPx + 4} strokeLinecap="round" opacity={0.35} />}
                  </g>
                );
              }
              // punto (columna / zapata)
              const sPx = Math.max(10, (e.a) * scale);
              return (
                <g key={e.uid} onClick={ev => { ev.stopPropagation(); setSelUid(e.uid); }} className="cursor-pointer">
                  {sel && <rect x={p1.sx - sPx / 2 - 3} y={p1.sy - sPx / 2 - 3} width={sPx + 6} height={sPx + 6} rx="3" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />}
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

            {/* cursor fantasma */}
            {tool !== 'select' && tool !== 'pan' && (() => {
              const c = toScreen(cursor.x, cursor.y);
              return <circle cx={c.sx} cy={c.sy} r="4" fill={META[tool as PlanoTipo]?.color || '#334155'} opacity={0.6} />;
            })()}
          </svg>

          {elems.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-slate-400 max-w-xs px-4">
                <p className="font-bold text-sm">Dibuja tu plano de cimentación</p>
                <p className="text-xs mt-1">Elige <b>Columna</b> o <b>Zapata</b> y haz clic para colocarlas. Para <b>Viga</b> o <b>Cimiento</b>, haz clic en el inicio y luego en el fin.</p>
              </div>
            </div>
          )}

          {/* zoom */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button onClick={() => setZoom(z => Math.min(4, z * 1.15))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-xs text-slate-700 cursor-pointer hover:bg-slate-100 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            <button onClick={() => setZoom(z => Math.max(0.3, z * 0.87))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-xs text-slate-700 cursor-pointer hover:bg-slate-100 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
          </div>
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
                      onChange={e => updateElem(selElem.uid, { [c.key]: Math.max(0, parseFloat(e.target.value) || 0) } as Partial<PlanoElem>)}
                      className="mt-0.5 w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2"
                      style={{ boxShadow: 'none' }} />
                  </label>
                ))}
              </div>
              {META[selElem.tipo].esLinea && selElem.x2 !== undefined && selElem.y2 !== undefined && (
                <p className="text-[10px] font-bold text-slate-500">
                  Longitud: <span className="font-mono text-slate-800">{Math.hypot(selElem.x2 - selElem.x1, selElem.y2 - selElem.y1).toFixed(2)} m</span>
                </p>
              )}
              {(() => { const r = calcElem(selElem); return (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-bold text-slate-600 border-t border-slate-200/70 pt-1.5">
                  <span>🧱 {r.concretoM3.toFixed(3)} m³</span>
                  <span>🔩 {r.aceroKg.toFixed(1)} kg</span>
                  <span>🪵 {r.encofradoM2.toFixed(2)} m²</span>
                </div>
              ); })()}
            </div>
          )}

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
