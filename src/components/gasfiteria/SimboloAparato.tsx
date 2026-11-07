// Símbolos en planta de los aparatos sanitarios (coordenadas locales en metros,
// centrados; la espalda del aparato hacia -y). Se usan en el plano y en la paleta.
import type { TipoAparato } from './modeloGasfiteria';
import { defAparato } from './modeloGasfiteria';

const T = '#334155', F = '#ffffff', A = '#e0f2fe';

export function SimboloAparato({ tipo, sw = 0.014 }: { tipo: TipoAparato; sw?: number }) {
  const d = defAparato(tipo), w = d.w, h = d.d;
  const p = { stroke: T, strokeWidth: sw, fill: F } as const;
  const txt = (s: string, size = 0.14, y = 0.05) => <text x={0} y={y} fontSize={size} fontWeight={900} textAnchor="middle" fill={T} stroke="none">{s}</text>;
  switch (tipo) {
    case 'inodoro': return <g>
      <rect x={-0.2} y={-0.35} width={0.4} height={0.17} rx={0.03} {...p} />
      <ellipse cx={0} cy={0.07} rx={0.17} ry={0.24} {...p} />
      <ellipse cx={0} cy={0.09} rx={0.11} ry={0.16} {...p} fill={A} />
    </g>;
    case 'lavatorio': return <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.06} {...p} />
      <ellipse cx={0} cy={0.02} rx={0.19} ry={0.14} {...p} fill={A} />
      <circle cx={0} cy={-h / 2 + 0.06} r={0.02} {...p} fill={T} />
    </g>;
    case 'ducha': return <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} {...p} fill="#f8fafc" />
      <line x1={-w / 2} y1={-h / 2} x2={w / 2} y2={h / 2} stroke={T} strokeWidth={sw * 0.7} />
      <line x1={w / 2} y1={-h / 2} x2={-w / 2} y2={h / 2} stroke={T} strokeWidth={sw * 0.7} />
      <circle cx={0} cy={0} r={0.05} {...p} />
      <circle cx={0} cy={-h / 2 + 0.07} r={0.04} {...p} fill={A} />
    </g>;
    case 'tina': return <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.05} {...p} />
      <rect x={-w / 2 + 0.07} y={-h / 2 + 0.07} width={w - 0.14} height={h - 0.14} rx={0.18} {...p} fill={A} />
      <circle cx={-w / 2 + 0.15} cy={0} r={0.03} {...p} />
    </g>;
    case 'lavadero_cocina': return <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.02} {...p} />
      <rect x={-w / 2 + 0.05} y={-h / 2 + 0.07} width={0.42} height={h - 0.13} rx={0.04} {...p} fill={A} />
      {[0, 1, 2, 3].map(i => <line key={i} x1={0.07 + i * 0.07} x2={0.07 + i * 0.07} y1={-h / 2 + 0.09} y2={h / 2 - 0.07} stroke={T} strokeWidth={sw * 0.6} />)}
      <circle cx={-w / 2 + 0.26} cy={0.03} r={0.025} {...p} />
    </g>;
    case 'lavadero_ropa': return <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.02} {...p} />
      <rect x={-w / 2 + 0.05} y={-h / 2 + 0.05} width={w - 0.1} height={h * 0.45} rx={0.03} {...p} fill={A} />
      {[0, 1, 2, 3, 4].map(i => <line key={i} x1={-w / 2 + 0.08 + i * 0.1} x2={-w / 2 + 0.08 + i * 0.1} y1={0.05} y2={h / 2 - 0.05} stroke={T} strokeWidth={sw * 0.6} />)}
    </g>;
    case 'lavadora': return <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.04} {...p} />
      <circle cx={0} cy={0.02} r={0.2} {...p} fill={A} />
      <circle cx={0} cy={0.02} r={0.12} {...p} />
    </g>;
    case 'terma': return <g>
      <circle cx={0} cy={0} r={0.21} {...p} fill="#fff7ed" />
      <path d="M -0.07 0.07 Q 0 -0.12 0.07 0.07 Q 0 0.02 -0.07 0.07 Z" fill="#f97316" stroke="none" />
      {txt('TE', 0.09, -0.07)}
    </g>;
    case 'urinario': return <g>
      <path d={`M ${-w / 2} ${-h / 2} L ${w / 2} ${-h / 2} L ${w / 2 - 0.04} ${h / 2 - 0.08} Q 0 ${h / 2 + 0.03} ${-w / 2 + 0.04} ${h / 2 - 0.08} Z`} {...p} />
      <ellipse cx={0} cy={0.02} rx={0.1} ry={0.08} {...p} fill={A} />
    </g>;
    case 'sumidero': return <g>
      <circle cx={0} cy={0} r={0.08} {...p} fill="#e2e8f0" />
      <line x1={-0.055} x2={0.055} y1={0} y2={0} stroke={T} strokeWidth={sw * 0.8} />
      <line y1={-0.055} y2={0.055} x1={0} x2={0} stroke={T} strokeWidth={sw * 0.8} />
    </g>;
    case 'registro': return <g>
      <circle cx={0} cy={0} r={0.08} {...p} fill="#fde68a" />
      {txt('R', 0.1, 0.035)}
    </g>;
    case 'caja_registro': return <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} {...p} fill="#e7e5e4" />
      <rect x={-w / 2 + 0.04} y={-h / 2 + 0.04} width={w - 0.08} height={h - 0.08} {...p} fill="#f5f5f4" />
      <line x1={-w / 2 + 0.04} y1={-h / 2 + 0.04} x2={w / 2 - 0.04} y2={h / 2 - 0.04} stroke={T} strokeWidth={sw * 0.6} />
      <line x1={w / 2 - 0.04} y1={-h / 2 + 0.04} x2={-w / 2 + 0.04} y2={h / 2 - 0.04} stroke={T} strokeWidth={sw * 0.6} />
    </g>;
    case 'medidor': return <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.02} {...p} fill="#e2e8f0" />
      <circle cx={0} cy={0} r={0.1} {...p} fill={A} />
      {txt('M', 0.1, 0.035)}
    </g>;
    case 'tanque': return <g>
      <circle cx={0} cy={0} r={0.55} {...p} fill="#f1f5f9" />
      <circle cx={0} cy={0} r={0.42} {...p} fill="none" strokeDasharray="0.05 0.04" />
      {txt('TANQUE', 0.12, 0.04)}
    </g>;
    case 'grifo_jardin': return <g>
      <circle cx={0} cy={0} r={0.08} {...p} fill="#dcfce7" />
      <path d="M -0.05 -0.02 L 0.05 -0.02 L 0.05 0.03 L 0.02 0.03 L 0.02 0.06" fill="none" stroke={T} strokeWidth={sw} />
    </g>;
  }
}

/** Ícono de la paleta: el símbolo encuadrado en un cuadro de 1 × 1. */
export function IconoAparato({ tipo, className = 'w-8 h-8' }: { tipo: TipoAparato; className?: string }) {
  const d = defAparato(tipo), s = Math.max(d.w, d.d, 0.3) * 1.15;
  return (
    <svg viewBox={`${-s / 2} ${-s / 2} ${s} ${s}`} className={className} aria-hidden>
      <SimboloAparato tipo={tipo} sw={s / 28} />
    </svg>
  );
}
