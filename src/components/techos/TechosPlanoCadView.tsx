// =============================================================================
// Lámina de Plano CAD Estructural (CM-02) para Techos Metálicos.
//
// A diferencia de la versión anterior (dibujos fijos), ESTA lámina se genera
// a partir de la GEOMETRÍA REAL del diseño (nodos y segmentos X/Y/Z del motor
// CAD). Proyecta 3 vistas ortográficas de verdad:
//   • ELEVACIÓN FRONTAL (pórtico transversal)  →  plano X-Y
//   • ELEVACIÓN LATERAL (longitudinal)         →  plano Z-Y
//   • PLANTA DE TECHO                          →  plano X-Z
// Con cotas automáticas, ejes, cuadro de perfiles reales y modo impresión
// que aísla la lámina (oculta toda la interfaz de la plataforma).
// =============================================================================
import React, { useMemo, useState } from 'react';
import { Compass, Printer, LayoutGrid } from 'lucide-react';
import type { Node3D, Segment3D } from './techosCadEngineTypes';
import type { UseTechosCadEngineReturn } from './useTechosCadEngineState';
import { INVENTARIO_PERFILES_TUBULARES } from './techosCadCatalog';

interface TechosPlanoCadViewProps {
  engineState?: UseTechosCadEngineReturn;
  nombreProyecto?: string;
  // Compatibilidad hacia atrás (ya no se usa para dibujar).
  design?: any;
}

type VistaTab = 'todas' | 'frontal' | 'lateral' | 'planta';

// Color de cada rol estructural en la lámina (legible en pantalla e impresión).
const ROL_COLOR: Record<string, string> = {
  columna: '#1e293b',
  columna_concreto: '#78716c',
  cordon_superior: '#d97706',
  cordon_inferior: '#059669',
  montante: '#7c3aed',
  diagonal: '#0891b2',
  correa: '#0284c7',
  viga_principal: '#d97706',
  viga_secundaria: '#059669',
  tensor_viento: '#10b981',
  arriostre: '#10b981',
  piso_deck: '#64748b',
  baranda: '#64748b',
  escalera: '#64748b',
  placa_base: '#f59e0b',
  cartela: '#94a3b8',
};
const ROL_WIDTH: Record<string, number> = {
  columna: 3.2, columna_concreto: 3.6, cordon_superior: 2.6, cordon_inferior: 2.6,
  viga_principal: 2.6, viga_secundaria: 2.2, montante: 1.4, diagonal: 1.4,
  correa: 1.3, tensor_viento: 1, arriostre: 1,
};
const ROL_LABEL: Record<string, string> = {
  columna: 'Columnas', columna_concreto: 'Columnas de concreto',
  cordon_superior: 'Cordón superior (tijeral)', cordon_inferior: 'Cordón inferior (tijeral)',
  montante: 'Montantes', diagonal: 'Diagonales / celosía', correa: 'Correas de techo',
  viga_principal: 'Vigas principales', viga_secundaria: 'Vigas secundarias',
  tensor_viento: 'Tensores de viento', arriostre: 'Arriostres / cruces',
  piso_deck: 'Piso / deck', baranda: 'Barandas', escalera: 'Escaleras',
  placa_base: 'Placas base', cartela: 'Cartelas',
};

const fmt = (m: number) => (Math.round(m * 100) / 100).toFixed(2);
const EPS = 0.02;

// Canvas de cada vista (coordenadas internas del SVG).
const VB_W = 760;
const VB_H = 360;
const PAD = 58;

interface ProjSeg { x1: number; y1: number; x2: number; y2: number; rol: string; }
interface Mapper { X: (h: number) => number; Y: (v: number) => number; scale: number; }

function makeMapper(hMin: number, hMax: number, vMin: number, vMax: number): Mapper {
  const spanH = Math.max(hMax - hMin, 0.001);
  const spanV = Math.max(vMax - vMin, 0.001);
  const availW = VB_W - 2 * PAD;
  const availH = VB_H - 2 * PAD;
  const scale = Math.min(availW / spanH, availH / spanV);
  const drawW = spanH * scale;
  const drawH = spanV * scale;
  const offX = PAD + (availW - drawW) / 2;
  const offY = PAD + (availH - drawH) / 2;
  return {
    scale,
    X: (h: number) => offX + (h - hMin) * scale,
    Y: (v: number) => offY + (vMax - v) * scale, // eje vertical invertido (arriba = +)
  };
}

// Cota horizontal (con marcas de arquitecto en los extremos y etiqueta).
const CotaH: React.FC<{ xa: number; xb: number; y: number; label: string; color?: string }> = ({ xa, xb, y, label, color = '#1d4ed8' }) => (
  <g>
    <line x1={xa} y1={y} x2={xb} y2={y} stroke={color} strokeWidth={0.8} />
    <line x1={xa} y1={y - 5} x2={xa} y2={y + 5} stroke={color} strokeWidth={0.8} />
    <line x1={xb} y1={y - 5} x2={xb} y2={y + 5} stroke={color} strokeWidth={0.8} />
    <line x1={xa - 3} y1={y + 3} x2={xa + 3} y2={y - 3} stroke={color} strokeWidth={1} />
    <line x1={xb - 3} y1={y + 3} x2={xb + 3} y2={y - 3} stroke={color} strokeWidth={1} />
    <rect x={(xa + xb) / 2 - 26} y={y - 10} width={52} height={11} fill="#ffffff" />
    <text x={(xa + xb) / 2} y={y - 1.5} fill={color} fontSize={8.5} fontWeight="bold" textAnchor="middle">{label}</text>
  </g>
);

// Cota vertical.
const CotaV: React.FC<{ ya: number; yb: number; x: number; label: string; color?: string }> = ({ ya, yb, x, label, color = '#1d4ed8' }) => (
  <g>
    <line x1={x} y1={ya} x2={x} y2={yb} stroke={color} strokeWidth={0.8} />
    <line x1={x - 5} y1={ya} x2={x + 5} y2={ya} stroke={color} strokeWidth={0.8} />
    <line x1={x - 5} y1={yb} x2={x + 5} y2={yb} stroke={color} strokeWidth={0.8} />
    <line x1={x - 3} y1={ya + 3} x2={x + 3} y2={ya - 3} stroke={color} strokeWidth={1} />
    <line x1={x - 3} y1={yb + 3} x2={x + 3} y2={yb - 3} stroke={color} strokeWidth={1} />
    <g transform={`rotate(-90 ${x - 8} ${(ya + yb) / 2})`}>
      <rect x={x - 8 - 26} y={(ya + yb) / 2 - 6} width={52} height={11} fill="#ffffff" />
      <text x={x - 8} y={(ya + yb) / 2 + 3} fill={color} fontSize={8.5} fontWeight="bold" textAnchor="middle">{label}</text>
    </g>
  </g>
);

const EjeBubble: React.FC<{ cx: number; cy: number; label: string }> = ({ cx, cy, label }) => (
  <g>
    <circle cx={cx} cy={cy} r={8} fill="#ffffff" stroke="#0f172a" strokeWidth={1} />
    <text x={cx} y={cy + 3} fill="#0f172a" fontSize={8} fontWeight="bold" textAnchor="middle">{label}</text>
  </g>
);

export const TechosPlanoCadView: React.FC<TechosPlanoCadViewProps> = ({ engineState, nombreProyecto, design }) => {
  const [tab, setTab] = useState<VistaTab>('todas');

  const nodes = engineState?.nodes || {};
  const segments = engineState?.segments || {};

  // ---- Análisis geométrico del diseño real -------------------------------
  const info = useMemo(() => {
    const nArr = Object.values(nodes) as Node3D[];
    const sArr = Object.values(segments) as Segment3D[];
    const getN = (id: string) => nodes[id];

    if (sArr.length === 0 || nArr.length === 0) {
      return { vacio: true } as any;
    }

    const xs = nArr.map(n => n.x), ys = nArr.map(n => n.y), zs = nArr.map(n => n.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const luz = maxX - minX;
    const altura = maxY - minY;
    const largo = maxZ - minZ;

    // Pórticos (ejes transversales): z únicos de nodos de columna.
    const colZ = new Set<number>();
    sArr.forEach(s => {
      if (s.rolEstructural === 'columna' || s.rolEstructural === 'columna_concreto') {
        const a = getN(s.nodeAId), b = getN(s.nodeBId);
        if (a) colZ.add(Math.round(a.z * 100) / 100);
        if (b) colZ.add(Math.round(b.z * 100) / 100);
      }
    });
    const framesZ = Array.from(colZ).sort((a, b) => a - b);
    const nPorticos = framesZ.length || 1;
    const separacion = nPorticos > 1 ? largo / (nPorticos - 1) : 0;

    // Frame transversal con más miembros (el tijeral típico) para la elevación.
    const zCount: Record<string, number> = {};
    sArr.forEach(s => {
      const a = getN(s.nodeAId), b = getN(s.nodeBId);
      if (!a || !b) return;
      if (Math.abs(a.z - b.z) < EPS) {
        const k = (Math.round(a.z * 100) / 100).toFixed(2);
        zCount[k] = (zCount[k] || 0) + 1;
      }
    });
    let frontZ = framesZ[0] ?? 0;
    let best = -1;
    Object.entries(zCount).forEach(([k, c]) => { if (c > best) { best = c; frontZ = parseFloat(k); } });

    // Altura de columna y de cumbrera (para cotas de la elevación).
    const alturaCol = (() => {
      const tops = nArr.filter(n => Math.abs(n.x - minX) < EPS || Math.abs(n.x - maxX) < EPS);
      // el "alero" = y de los nodos superiores de columnas
      const colTops = sArr.filter(s => s.rolEstructural === 'columna' || s.rolEstructural === 'columna_concreto')
        .map(s => { const a = getN(s.nodeAId), b = getN(s.nodeBId); return Math.max(a?.y ?? 0, b?.y ?? 0); });
      return colTops.length ? Math.min(...colTops) : (tops.length ? Math.max(...tops.map(n => n.y)) : altura);
    })();

    // Perfiles realmente usados, agrupados por rol.
    const perfMap = new Map<string, Set<string>>();
    const rolCount: Record<string, number> = {};
    sArr.forEach(s => {
      rolCount[s.rolEstructural] = (rolCount[s.rolEstructural] || 0) + 1;
      if (!perfMap.has(s.rolEstructural)) perfMap.set(s.rolEstructural, new Set());
      const p = INVENTARIO_PERFILES_TUBULARES.find(pp => pp.id === s.profileId);
      if (p) perfMap.get(s.rolEstructural)!.add(p.nombre);
    });
    const cuadro = Array.from(perfMap.entries()).map(([rol, set]) => ({
      rol,
      label: ROL_LABEL[rol] || rol,
      perfiles: Array.from(set).join(' · ') || '—',
      cantidad: rolCount[rol] || 0,
    })).sort((a, b) => (ROL_WIDTH[b.rol] || 0) - (ROL_WIDTH[a.rol] || 0));

    return {
      vacio: false, nArr, sArr, getN, minX, maxX, minY, maxY, minZ, maxZ,
      luz, altura, largo, framesZ, nPorticos, separacion, frontZ, alturaCol, cuadro,
    };
  }, [nodes, segments]);

  const handleImprimir = () => window.print();
  const nombreProy = nombreProyecto || design?.nombre || 'ESTRUCTURA DE TECHO Y COBERTURA METÁLICA';

  // --------- Constructores de cada vista (proyección real) ----------------
  const buildFrontal = () => {
    const { getN, frontZ, minX, maxX, minY, maxY } = info;
    const segs: ProjSeg[] = [];
    info.sArr.forEach((s: Segment3D) => {
      const a = getN(s.nodeAId), b = getN(s.nodeBId);
      if (!a || !b) return;
      // Solo miembros del pórtico transversal elegido (ambos nodos en ese z).
      if (Math.abs(a.z - frontZ) < EPS && Math.abs(b.z - frontZ) < EPS) {
        segs.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, rol: s.rolEstructural });
      }
    });
    const m = makeMapper(minX, maxX, Math.min(0, minY), maxY);
    return { segs, m };
  };

  const buildLateral = () => {
    const { getN, minZ, maxZ, minY, maxY } = info;
    const segs: ProjSeg[] = [];
    info.sArr.forEach((s: Segment3D) => {
      const a = getN(s.nodeAId), b = getN(s.nodeBId);
      if (!a || !b) return;
      segs.push({ x1: a.z, y1: a.y, x2: b.z, y2: b.y, rol: s.rolEstructural });
    });
    const m = makeMapper(minZ, maxZ, Math.min(0, minY), maxY);
    return { segs, m };
  };

  const buildPlanta = () => {
    const { getN, minX, maxX, minZ, maxZ } = info;
    const segs: ProjSeg[] = [];
    info.sArr.forEach((s: Segment3D) => {
      const a = getN(s.nodeAId), b = getN(s.nodeBId);
      if (!a || !b) return;
      // Orientación convencional: largo (z) horizontal, luz (x) vertical.
      segs.push({ x1: a.z, y1: a.x, x2: b.z, y2: b.x, rol: s.rolEstructural });
    });
    const m = makeMapper(minZ, maxZ, minX, maxX);
    return { segs, m };
  };

  const renderSegs = (segs: ProjSeg[], m: Mapper) =>
    segs.map((s, i) => (
      <line key={i}
        x1={m.X(s.x1)} y1={m.Y(s.y1)} x2={m.X(s.x2)} y2={m.Y(s.y2)}
        stroke={ROL_COLOR[s.rol] || '#334155'} strokeWidth={ROL_WIDTH[s.rol] || 1.4}
        strokeLinecap="round"
      />
    ));

  // --------- SVG de cada vista -------------------------------------------
  const SvgFrontal = () => {
    const { segs, m } = buildFrontal();
    const { minX, maxX, alturaCol, maxY } = info;
    const yBase = m.Y(0);
    return (
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full bg-white border border-slate-200 rounded-lg" style={{ height: 'auto' }}>
        {/* Línea de suelo N.P.T. */}
        <line x1={PAD - 10} y1={yBase} x2={VB_W - PAD + 10} y2={yBase} stroke="#64748b" strokeWidth={1.2} strokeDasharray="7 4" />
        <text x={PAD - 8} y={yBase + 13} fill="#64748b" fontSize={8} fontFamily="sans-serif">N.P.T. ±0.00</text>
        {renderSegs(segs, m)}
        {/* Cota de luz total (abajo) */}
        <CotaH xa={m.X(minX)} xb={m.X(maxX)} y={yBase + 30} label={`LUZ = ${fmt(info.luz)} m`} />
        {/* Cota de altura de columna (izquierda) */}
        <CotaV ya={m.Y(alturaCol)} yb={m.Y(0)} x={m.X(minX) - 24} label={`H col = ${fmt(alturaCol)} m`} />
        {/* Cota de altura total a cumbrera (derecha) */}
        <CotaV ya={m.Y(maxY)} yb={m.Y(0)} x={m.X(maxX) + 30} label={`H total = ${fmt(info.altura)} m`} />
        {/* Ejes A / B */}
        <EjeBubble cx={m.X(minX)} cy={yBase + 50} label="A" />
        <EjeBubble cx={m.X(maxX)} cy={yBase + 50} label="B" />
      </svg>
    );
  };

  const SvgLateral = () => {
    const { segs, m } = buildLateral();
    const { minZ, maxZ, framesZ, alturaCol } = info;
    const yBase = m.Y(0);
    return (
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full bg-white border border-slate-200 rounded-lg" style={{ height: 'auto' }}>
        <line x1={PAD - 10} y1={yBase} x2={VB_W - PAD + 10} y2={yBase} stroke="#64748b" strokeWidth={1.2} strokeDasharray="7 4" />
        <text x={PAD - 8} y={yBase + 13} fill="#64748b" fontSize={8} fontFamily="sans-serif">N.P.T. ±0.00</text>
        {renderSegs(segs, m)}
        {/* Cota de largo total (abajo) */}
        <CotaH xa={m.X(minZ)} xb={m.X(maxZ)} y={yBase + 30}
          label={`LARGO = ${fmt(info.largo)} m${info.nPorticos > 1 ? ` (${info.nPorticos - 1} tramos @ ${fmt(info.separacion)} m)` : ''}`} />
        {/* Cota de altura (izquierda) */}
        <CotaV ya={m.Y(alturaCol)} yb={m.Y(0)} x={m.X(minZ) - 24} label={`H = ${fmt(alturaCol)} m`} />
        {/* Ejes de pórtico 1..n */}
        {framesZ.map((z: number, i: number) => <EjeBubble key={i} cx={m.X(z)} cy={yBase + 50} label={`${i + 1}`} />)}
      </svg>
    );
  };

  const SvgPlanta = () => {
    const { segs, m } = buildPlanta();
    const { minX, maxX, minZ, maxZ, framesZ } = info;
    // Columnas como cuadritos (proyectadas a z-horizontal, x-vertical).
    const colPts: { x: number; z: number }[] = [];
    info.sArr.forEach((s: Segment3D) => {
      if (s.rolEstructural === 'columna' || s.rolEstructural === 'columna_concreto') {
        const a = info.getN(s.nodeAId);
        if (a) colPts.push({ x: a.x, z: a.z });
      }
    });
    return (
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full bg-white border border-slate-200 rounded-lg" style={{ height: 'auto' }}>
        {renderSegs(segs, m)}
        {/* Columnas (h=z, v=x) */}
        {colPts.map((p, i) => (
          <rect key={i} x={m.X(p.z) - 4} y={m.Y(p.x) - 4} width={8} height={8} fill="#1e293b" stroke="#000" strokeWidth={0.5} />
        ))}
        {/* Cotas: largo (abajo, horizontal) y luz (izquierda, vertical) */}
        <CotaH xa={m.X(minZ)} xb={m.X(maxZ)} y={m.Y(minX) + 26} label={`LARGO = ${fmt(info.largo)} m`} />
        <CotaV ya={m.Y(maxX)} yb={m.Y(minX)} x={m.X(minZ) - 24} label={`LUZ = ${fmt(info.luz)} m`} />
        {/* Ejes: números (pórticos, z) abajo; letras A/B (x) a la izquierda */}
        {framesZ.map((z: number, i: number) => <EjeBubble key={i} cx={m.X(z)} cy={m.Y(minX) + 46} label={`${i + 1}`} />)}
        <EjeBubble cx={m.X(minZ) - 44} cy={m.Y(minX)} label="A" />
        <EjeBubble cx={m.X(minZ) - 44} cy={m.Y(maxX)} label="B" />
      </svg>
    );
  };

  const Leyenda = () => {
    const roles = info.vacio ? [] : (info.cuadro as any[]).map(c => c.rol);
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] font-sans">
        {roles.map((r: string) => (
          <div key={r} className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-[3px] rounded" style={{ background: ROL_COLOR[r] || '#334155' }} />
            <span className="text-slate-600 font-semibold">{ROL_LABEL[r] || r}</span>
          </div>
        ))}
      </div>
    );
  };

  const Vista: React.FC<{ titulo: string; sub: string; children: React.ReactNode; wide?: boolean }> = ({ titulo, sub, children, wide }) => (
    <div className={`border border-slate-300 p-3 rounded-xl bg-slate-50/70 ${wide ? 'lg:col-span-2' : ''}`}>
      <div className="text-[10px] font-black uppercase text-slate-800 mb-2 border-b border-slate-300 pb-1 flex items-center justify-between gap-2">
        <span>{titulo}</span>
        <span className="text-amber-700 text-[9px] font-bold whitespace-nowrap">{sub}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      {/* CSS de impresión: oculta TODA la plataforma y deja solo la lámina. */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #techos-plano-lamina, #techos-plano-lamina * { visibility: visible !important; }
          #techos-plano-lamina {
            position: absolute; left: 0; top: 0;
            width: 100% !important; max-width: 100% !important;
            margin: 0 !important; padding: 0 !important;
            box-shadow: none !important; border: none !important;
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
          #techos-plano-lamina * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4 landscape; margin: 8mm; }
        }
      `}</style>

      {/* BARRA DE CONTROLES (no se imprime) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600"><Compass className="w-5 h-5" /></div>
          <div>
            <h2 className="text-base font-black text-slate-900">LÁMINA CAD ESTRUCTURAL (CM-02)</h2>
            <p className="text-xs text-slate-500">Vistas reales de tu diseño: elevación frontal, lateral y planta, acotadas automáticamente.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {([['todas', 'Todas'], ['frontal', 'Frontal'], ['lateral', 'Lateral'], ['planta', 'Planta']] as [VistaTab, string][]).map(([k, lbl]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${tab === k ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <button onClick={handleImprimir}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer">
            <Printer className="w-4 h-4" /><span>IMPRIMIR PLANO</span>
          </button>
        </div>
      </div>

      {/* LÁMINA (lo único que se imprime) */}
      <div id="techos-plano-lamina" className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 max-w-6xl mx-auto shadow-sm border border-slate-300 font-mono text-xs space-y-6">

        {/* Cartela superior */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-base font-black uppercase text-slate-900">PROYECTO: {nombreProy}</h1>
            <p className="text-[10px] text-slate-600 font-bold mt-0.5">SISTEMA DE TIJERALES, CORREAS Y COBERTURA — PLANO GENERADO DEL MODELO 3D</p>
          </div>
          <div className="text-left sm:text-right border-l-2 border-slate-900 pl-4">
            <span className="text-xs font-black text-amber-700 block">LÁMINA: CM-02</span>
            <span className="text-[10px] text-slate-500 block">ESCALA GRÁFICA S/C</span>
          </div>
        </div>

        {info.vacio ? (
          <div className="py-16 text-center text-slate-500 font-sans">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">Aún no hay diseño que dibujar.</p>
            <p className="text-sm">Crea o genera tu techo en el apartado de Diseño CAD y vuelve aquí: el plano se arma solo con tus medidas reales.</p>
          </div>
        ) : (
          <>
            {/* Ficha de dimensiones reales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              {[
                ['LUZ', `${fmt(info.luz)} m`],
                ['LARGO', `${fmt(info.largo)} m`],
                ['ALTURA TOTAL', `${fmt(info.altura)} m`],
                ['PÓRTICOS', `${info.nPorticos}${info.separacion ? ` @ ${fmt(info.separacion)} m` : ''}`],
              ].map(([k, v]) => (
                <div key={k} className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50">
                  <div className="text-[8.5px] font-bold text-slate-500 uppercase">{k}</div>
                  <div className="text-[12px] font-black text-slate-900">{v}</div>
                </div>
              ))}
            </div>

            {/* Leyenda de elementos */}
            <div className="border border-slate-200 rounded-lg px-3 py-2 bg-white"><Leyenda /></div>

            {/* VISTAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 border-b-2 border-slate-900 pb-6">
              {(tab === 'todas' || tab === 'frontal') && (
                <Vista titulo="ELEVACIÓN FRONTAL (PÓRTICO TRANSVERSAL)" sub={`LUZ ${fmt(info.luz)} m`} wide={tab === 'frontal'}>
                  <SvgFrontal />
                </Vista>
              )}
              {(tab === 'todas' || tab === 'lateral') && (
                <Vista titulo="ELEVACIÓN LATERAL (LONGITUDINAL)" sub={`LARGO ${fmt(info.largo)} m`} wide={tab === 'lateral'}>
                  <SvgLateral />
                </Vista>
              )}
              {(tab === 'todas' || tab === 'planta') && (
                <Vista titulo="PLANTA DE TECHO Y CORREAS" sub={`${fmt(info.luz)} × ${fmt(info.largo)} m`} wide={tab === 'planta' || tab === 'todas'}>
                  <SvgPlanta />
                </Vista>
              )}
            </div>

            {/* Cuadro de perfiles reales + notas RNE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/70 space-y-2 text-[10px]">
                <div className="font-black uppercase text-slate-800 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>CUADRO DE ELEMENTOS Y PERFILES (DEL DISEÑO)</span>
                  <span className="text-amber-700 font-bold">RNE E.090</span>
                </div>
                <div className="space-y-1 font-mono text-[9.5px]">
                  {(info.cuadro as any[]).map((c) => (
                    <div key={c.rol} className="flex justify-between gap-2 border-b border-slate-200 pb-0.5">
                      <span className="font-bold flex items-center gap-1.5 whitespace-nowrap">
                        <span className="inline-block w-3 h-[3px] rounded" style={{ background: ROL_COLOR[c.rol] || '#334155' }} />
                        {c.label} <span className="text-slate-400">({c.cantidad})</span>:
                      </span>
                      <span className="text-slate-800 text-right">{c.perfiles}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/70 space-y-1.5 text-[10px]">
                <div className="font-black uppercase text-slate-800 border-b border-slate-300 pb-1 flex items-center justify-between">
                  <span>NOTAS TÉCNICAS GENERALES</span>
                  <span className="text-emerald-700 font-bold">NORMA RNE PERÚ</span>
                </div>
                <p>• <strong>ACERO:</strong> Perfiles tubulares ASTM A500 Gr. B (Fy = 3200 kg/cm²) y perfiles C ASTM A36.</p>
                <p>• <strong>SOLDADURA:</strong> Electrodos AWS E-6011 (raíz) y AWS E-7018 (acabado), garganta mínima 4 mm continua.</p>
                <p>• <strong>ANCLAJE:</strong> Placas base con pernos de anclaje tipo J, según detalle, empotrados 35 cm.</p>
                <p>• <strong>COBERTURA:</strong> Aluzinc fijado con pernos autoperforantes 12-14×2" y arandelas de neopreno EPDM.</p>
                <p>• <strong>PINTURA:</strong> 2 manos anticorrosivo epóxico + 2 manos esmalte poliuretano.</p>
              </div>
            </div>

            {/* Pie de lámina */}
            <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-bold gap-2 pt-2 border-t border-slate-200">
              <div>INNOVA CONTRATISTAS | INGENIERÍA ESTRUCTURAL & METÁLICA</div>
              <div className="text-amber-700 font-black">PLANO GENERADO AUTOMÁTICAMENTE DEL MODELO 3D</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TechosPlanoCadView;
