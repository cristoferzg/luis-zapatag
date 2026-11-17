// =============================================================================
// Dibujo 2D (corte/sección) de cada elemento de concreto, con textura de
// concreto, acero de refuerzo y cotas. Diseño sobrio (grises) y elegante.
// =============================================================================

import type { ReactNode } from 'react';

interface Props { tipoId: string; v: Record<string, number>; }

const INK = '#44403c';        // stone-700 (líneas)
const INK_SOFT = '#a8a29e';   // stone-400
const CONCRETE = '#e7e5e4';   // stone-200 (relleno concreto)
const REBAR = '#b91c1c';      // rojo acero
const DIM = '#78716c';        // stone-500 (cotas)

// Caja de dibujo
const BOX_W = 190;
const BOX_H = 150;
const PAD = 30;

// Ajusta un elemento de ancho/alto reales (m) a la caja, conservando proporción.
function fit(wM: number, hM: number) {
  const availW = BOX_W - PAD * 2;
  const availH = BOX_H - PAD * 2;
  const s = Math.min(availW / Math.max(wM, 0.01), availH / Math.max(hM, 0.01));
  const w = Math.max(10, wM * s);
  const h = Math.max(10, hM * s);
  return { w, h, x: (BOX_W - w) / 2, y: (BOX_H - h) / 2 };
}

// Cota horizontal (ancho) debajo de la figura
function CotaH({ x, y, w, label }: { x: number; y: number; w: number; label: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={DIM} strokeWidth="1" />
      <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke={DIM} strokeWidth="1" />
      <line x1={x + w} y1={y - 4} x2={x + w} y2={y + 4} stroke={DIM} strokeWidth="1" />
      <text x={x + w / 2} y={y + 13} fill={DIM} fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{label}</text>
    </g>
  );
}
// Cota vertical (alto) a la derecha
function CotaV({ x, y, h, label }: { x: number; y: number; h: number; label: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + h} stroke={DIM} strokeWidth="1" />
      <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke={DIM} strokeWidth="1" />
      <line x1={x - 4} y1={y + h} x2={x + 4} y2={y + h} stroke={DIM} strokeWidth="1" />
      <text x={x + 6} y={y + h / 2 + 3} fill={DIM} fontSize="10" fontWeight="bold" textAnchor="start" fontFamily="monospace">{label}</text>
    </g>
  );
}

export default function ConcretoElementoSVG({ tipoId, v }: Props) {
  const patId = `pat_concreto_${tipoId}`;
  const stoneId = `pat_piedra_${tipoId}`;

  // Figura y acero según el tipo.
  let figura: ReactNode = null;

  const concretoRect = (x: number, y: number, w: number, h: number, ciclopeo = false) => (
    <rect x={x} y={y} width={w} height={h} fill={`url(#${ciclopeo ? stoneId : patId})`} stroke={INK} strokeWidth="1.6" />
  );
  const estribo = (x: number, y: number, w: number, h: number) => (
    <rect x={x} y={y} width={w} height={h} fill="none" stroke={REBAR} strokeWidth="1" rx="2" opacity="0.8" />
  );
  const varilla = (cx: number, cy: number) => <circle cx={cx} cy={cy} r="2.6" fill={REBAR} />;

  if (tipoId === 'columna') {
    const { w, h, x, y } = fit(v.a || 0.25, v.b || 0.25); // sección cuadrada
    figura = (
      <g>
        {concretoRect(x, y, w, h)}
        {estribo(x + 5, y + 5, w - 10, h - 10)}
        {varilla(x + 9, y + 9)}{varilla(x + w - 9, y + 9)}{varilla(x + 9, y + h - 9)}{varilla(x + w - 9, y + h - 9)}
        <CotaH x={x} y={y + h + 12} w={w} label={`${(v.a || 0).toFixed(2)} m`} />
        <CotaV x={x + w + 10} y={y} h={h} label={`${(v.b || 0).toFixed(2)}`} />
        <text x={BOX_W / 2} y={16} fill={INK_SOFT} fontSize="9" fontWeight="bold" textAnchor="middle">SECCIÓN · H={(v.H || 0).toFixed(2)} m</text>
      </g>
    );
  } else if (tipoId === 'viga') {
    const { w, h, x, y } = fit(v.a || 0.25, v.h || 0.4);
    figura = (
      <g>
        {concretoRect(x, y, w, h)}
        {estribo(x + 5, y + 5, w - 10, h - 10)}
        {varilla(x + 9, y + 9)}{varilla(x + w - 9, y + 9)}
        {varilla(x + 9, y + h - 9)}{varilla(x + w - 9, y + h - 9)}
        <CotaH x={x} y={y + h + 12} w={w} label={`${(v.a || 0).toFixed(2)} m`} />
        <CotaV x={x + w + 10} y={y} h={h} label={`${(v.h || 0).toFixed(2)}`} />
        <text x={BOX_W / 2} y={16} fill={INK_SOFT} fontSize="9" fontWeight="bold" textAnchor="middle">SECCIÓN · L={(v.L || 0).toFixed(2)} m</text>
      </g>
    );
  } else if (tipoId === 'zapata') {
    // Elevación: zapata con arranque de columna encima
    const { w, h, x, y } = fit(v.a || 1, (v.h || 0.5) * 1.6);
    const zh = h * 0.6, zy = y + h - zh;
    const colW = Math.max(12, w * 0.22), colX = x + (w - colW) / 2;
    figura = (
      <g>
        {/* columna arranque */}
        <rect x={colX} y={y} width={colW} height={h - zh + 4} fill={`url(#${patId})`} stroke={INK} strokeWidth="1.4" />
        {/* zapata */}
        {concretoRect(x, zy, w, zh)}
        {/* parrilla inferior */}
        {Array.from({ length: 6 }).map((_, i) => <circle key={i} cx={x + 10 + i * ((w - 20) / 5)} cy={zy + zh - 7} r="2.2" fill={REBAR} />)}
        <CotaH x={x} y={zy + zh + 12} w={w} label={`${(v.a || 0).toFixed(2)} m`} />
        <CotaV x={x + w + 10} y={zy} h={zh} label={`${(v.h || 0).toFixed(2)}`} />
        <text x={BOX_W / 2} y={16} fill={INK_SOFT} fontSize="9" fontWeight="bold" textAnchor="middle">ELEVACIÓN · {(v.a || 0).toFixed(2)}×{(v.b || 0).toFixed(2)} m</text>
      </g>
    );
  } else if (tipoId === 'losa') {
    // Corte de losa aligerada: viguetas + ladrillos
    const { w, h, x, y } = fit(v.largo || 4, (v.e || 0.2) * 6);
    const nBloques = 4;
    const bw = (w - 10 * (nBloques + 1)) / nBloques;
    figura = (
      <g>
        {/* losa superior (concreto) */}
        <rect x={x} y={y} width={w} height={h * 0.28} fill={`url(#${patId})`} stroke={INK} strokeWidth="1.4" />
        {/* viguetas + ladrillos */}
        {Array.from({ length: nBloques }).map((_, i) => {
          const bx = x + 10 + i * (bw + 10);
          return <rect key={i} x={bx} y={y + h * 0.28} width={bw} height={h * 0.62} fill="#fff" stroke={INK_SOFT} strokeWidth="1.2" />;
        })}
        {/* contorno inferior (viguetas de concreto entre ladrillos) */}
        <rect x={x} y={y} width={w} height={h * 0.9} fill="none" stroke={INK} strokeWidth="1.6" />
        <CotaV x={x + w + 10} y={y} h={h * 0.9} label={`${(v.e || 0).toFixed(2)}`} />
        <text x={BOX_W / 2} y={16} fill={INK_SOFT} fontSize="9" fontWeight="bold" textAnchor="middle">ALIGERADA · {(v.largo || 0).toFixed(1)}×{(v.ancho || 0).toFixed(1)} m</text>
      </g>
    );
  } else if (tipoId === 'muro') {
    // Elevación de muro con malla
    const { w, h, x, y } = fit(v.L || 3, v.H || 2.5);
    figura = (
      <g>
        {concretoRect(x, y, w, h)}
        {/* malla */}
        {Array.from({ length: 3 }).map((_, i) => <line key={'v' + i} x1={x + (w / 4) * (i + 1)} y1={y + 4} x2={x + (w / 4) * (i + 1)} y2={y + h - 4} stroke={REBAR} strokeWidth="0.8" opacity="0.7" />)}
        {Array.from({ length: 3 }).map((_, i) => <line key={'h' + i} x1={x + 4} y1={y + (h / 4) * (i + 1)} x2={x + w - 4} y2={y + (h / 4) * (i + 1)} stroke={REBAR} strokeWidth="0.8" opacity="0.7" />)}
        <CotaH x={x} y={y + h + 12} w={w} label={`${(v.L || 0).toFixed(2)} m`} />
        <CotaV x={x + w + 10} y={y} h={h} label={`${(v.H || 0).toFixed(2)}`} />
        <text x={BOX_W / 2} y={16} fill={INK_SOFT} fontSize="9" fontWeight="bold" textAnchor="middle">ELEVACIÓN · e={(v.e || 0).toFixed(2)} m</text>
      </g>
    );
  } else if (tipoId === 'cimiento' || tipoId === 'sobrecimiento') {
    const { w, h, x, y } = fit(v.a || 0.5, (v.h || 0.6) * 1.2);
    figura = (
      <g>
        {concretoRect(x, y, w, h, true)}
        <CotaH x={x} y={y + h + 12} w={w} label={`${(v.a || 0).toFixed(2)} m`} />
        <CotaV x={x + w + 10} y={y} h={h} label={`${(v.h || 0).toFixed(2)}`} />
        <text x={BOX_W / 2} y={16} fill={INK_SOFT} fontSize="9" fontWeight="bold" textAnchor="middle">CORTE · L={(v.L || 0).toFixed(1)} m (ciclópeo)</text>
      </g>
    );
  } else {
    return null;
  }

  return (
    <svg viewBox={`0 0 ${BOX_W} ${BOX_H}`} className="w-full max-w-[200px] h-auto">
      <defs>
        {/* Textura de concreto: puntitos + triangulitos */}
        <pattern id={patId} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill={CONCRETE} />
          <circle cx="3" cy="3" r="0.9" fill={INK_SOFT} />
          <circle cx="9" cy="8" r="0.8" fill={INK_SOFT} />
          <path d="M7 3 l1.6 2.4 h-3.2 z" fill="none" stroke={INK_SOFT} strokeWidth="0.5" />
        </pattern>
        {/* Textura ciclópea: piedras */}
        <pattern id={stoneId} width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill={CONCRETE} />
          <circle cx="5" cy="5" r="2.4" fill="none" stroke={INK_SOFT} strokeWidth="0.7" />
          <circle cx="12" cy="11" r="3" fill="none" stroke={INK_SOFT} strokeWidth="0.7" />
          <circle cx="12" cy="3" r="1.6" fill="none" stroke={INK_SOFT} strokeWidth="0.7" />
        </pattern>
      </defs>
      {figura}
    </svg>
  );
}
