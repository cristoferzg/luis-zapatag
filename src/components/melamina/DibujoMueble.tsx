// Dibujo de frente de un mueble de melamina (SVG, en mm, y hacia abajo).
// Lo usan la tarjeta de cada mueble (vista previa) y el Diseñador (sobre la pared).
import { frenteDe, Mueble, colorFrente } from './calculoMelamina';
import { colorMelamina } from '../../catalogo/melamina';

// Color un poco más oscuro u claro para puertas y frentes.
export function tono(hex: string, delta: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + delta * 255)));
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
const oscuro = (hex: string) => { const n = parseInt(hex.replace('#', ''), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11 < 110; };

/** Grupo SVG del frente: origen arriba a la izquierda del mueble, unidades mm. */
export function FrenteSvg({ m, resaltado = false }: { m: Mueble; resaltado?: boolean }) {
  const f = frenteDe(m);
  const { W, H, z, t } = f;
  const Y = (y: number) => H - y;
  const base = colorMelamina(m.color).hex;
  const linea = oscuro(base) ? '#e2e8f0' : '#334155';
  const sw = Math.max(4, Math.min(W, H) / 120);
  // Frentes: en su propio color si es bicolor; con vidrio, celeste translúcido con marco.
  const cf = colorFrente(m);
  const baseFrente = cf ? colorMelamina(cf).hex : base;
  const puertaFill = cf ? baseFrente : tono(base, oscuro(base) ? 0.08 : -0.06);
  const lineaFrente = oscuro(baseFrente) ? '#e2e8f0' : '#334155';
  const vidrio = m.estiloPuerta === 'vidrio', ranurada = m.estiloPuerta === 'ranurada';
  const tir = m.tirador || 'barra';
  // Tirador de un frente (puerta o cajón) según el diseño elegido.
  const Tirador = ({ x, y, w, h, vertical }: { x: number; y: number; w: number; h: number; vertical: boolean }) => {
    if (tir === 'push') return null;
    if (tir === 'boton') return <circle cx={x} cy={y} r={Math.max(sw * 2, 14)} fill="#475569" />;
    if (tir === 'gola') return null; // va como perfil en el borde (abajo)
    return vertical
      ? <line x1={x} x2={x} y1={y - Math.min(80, h / 6)} y2={y + Math.min(80, h / 6)} stroke="#475569" strokeWidth={sw * 2} strokeLinecap="round" />
      : <line x1={x - Math.min(60, w / 4)} x2={x + Math.min(60, w / 4)} y1={y} y2={y} stroke="#475569" strokeWidth={sw * 2} strokeLinecap="round" />;
  };
  return (
    <g>
      {/* Casco e interior */}
      <rect x={0} y={0} width={W} height={H} fill={tono(base, oscuro(base) ? 0.04 : -0.12)} stroke={linea} strokeWidth={sw} />
      <rect x={t} y={Y(f.yTecho)} width={Math.max(0, W - 2 * t)} height={Math.max(0, f.yTecho - f.yPiso)} fill={tono(base, oscuro(base) ? -0.04 : -0.2)} />
      {z > 0 && <rect x={t} y={Y(z)} width={W - 2 * t} height={z} fill={tono(base, -0.25)} />}
      {f.divisiones.map((x, i) => <rect key={`d${i}`} x={x} y={Y(f.yTecho)} width={t} height={f.yTecho - f.yPiso} fill={base} stroke={linea} strokeWidth={sw / 2} />)}
      {f.repisas.map((r, i) => <rect key={`r${i}`} x={r.x0} y={Y(r.y + t)} width={r.x1 - r.x0} height={t} fill={base} stroke={linea} strokeWidth={sw / 2} />)}
      {f.colgadores.map((c, i) => <line key={`c${i}`} x1={c.x0 + 10} x2={c.x1 - 10} y1={Y(c.y)} y2={Y(c.y)} stroke="#94a3b8" strokeWidth={sw * 2.5} strokeLinecap="round" />)}
      {f.comps.filter(c => c.conPiso).map(c => <rect key={`p${c.i}`} x={c.x0} y={Y(f.yPiso)} width={c.x1 - c.x0} height={t} fill={base} />)}
      <rect x={t} y={Y(H)} width={W - 2 * t} height={t} fill={base} />
      {/* Cajones */}
      {f.cajones.map((c, i) => (
        <g key={`k${i}`}>
          <rect x={c.x} y={Y(c.y + c.h)} width={c.w} height={c.h} fill={c.interior ? tono(base, -0.06) : puertaFill} fillOpacity={c.interior ? 0.6 : 1} stroke={lineaFrente} strokeWidth={sw} />
          {tir === 'gola' && !c.interior && <line x1={c.x + 10} x2={c.x + c.w - 10} y1={Y(c.y + c.h) + sw * 1.5} y2={Y(c.y + c.h) + sw * 1.5} stroke="#64748b" strokeWidth={sw * 2.2} />}
          <Tirador x={c.x + c.w / 2} y={Y(c.y + c.h / 2)} w={c.w} h={c.h} vertical={false} />
        </g>
      ))}
      {/* Puertas (semitransparentes para ver el interior) */}
      {f.puertas.map((p, i) => {
        const yTop = Y(p.y + p.h), hx = p.lado === 'izq' ? p.x + p.w - 40 : p.x + 40;
        const hy = m.tipo === 'cocina_alta' ? p.y + 120 : m.tipo === 'cocina_baja' ? p.y + p.h - 120 : p.y + p.h / 2;
        return (
          <g key={`p${i}`}>
            {vidrio ? (<>
              <rect x={p.x} y={yTop} width={p.w} height={p.h} fill="#bfdbfe" fillOpacity={0.45} stroke="#94a3b8" strokeWidth={sw * 2.5} />
              <line x1={p.x + p.w * 0.2} x2={p.x + p.w * 0.45} y1={yTop + p.h * 0.15} y2={yTop + p.h * 0.05} stroke="#ffffff" strokeOpacity={0.8} strokeWidth={sw} />
            </>) : (
              <rect x={p.x} y={yTop} width={p.w} height={p.h} fill={puertaFill} fillOpacity={p.tipo === 'corrediza' ? (p.plano ? 0.75 : 0.6) : cf ? 0.85 : 0.55} stroke={lineaFrente} strokeWidth={sw} />
            )}
            {ranurada && [1, 2, 3, 4, 5].map(k => <line key={k} x1={p.x + (p.w * k) / 6} x2={p.x + (p.w * k) / 6} y1={yTop + 15} y2={yTop + p.h - 15} stroke={lineaFrente} strokeOpacity={0.35} strokeWidth={sw * 0.8} />)}
            {tir === 'gola' && <line x1={p.lado === 'izq' ? p.x + p.w - sw * 1.5 : p.x + sw * 1.5} x2={p.lado === 'izq' ? p.x + p.w - sw * 1.5 : p.x + sw * 1.5} y1={yTop + 10} y2={yTop + p.h - 10} stroke="#64748b" strokeWidth={sw * 2.2} />}
            {p.tipo === 'batiente' && (
              <polyline points={p.lado === 'izq' ? `${p.x + p.w},${yTop} ${p.x},${yTop + p.h / 2} ${p.x + p.w},${yTop + p.h}` : `${p.x},${yTop} ${p.x + p.w},${yTop + p.h / 2} ${p.x},${yTop + p.h}`}
                fill="none" stroke={linea} strokeOpacity={0.35} strokeWidth={sw / 2} strokeDasharray={`${sw * 4} ${sw * 3}`} />
            )}
            <Tirador x={hx} y={Y(hy)} w={p.w} h={p.h} vertical />
          </g>
        );
      })}
      {resaltado && <rect x={-sw * 3} y={-sw * 3} width={W + sw * 6} height={H + sw * 6} fill="none" stroke="#0d9488" strokeWidth={sw * 3} strokeDasharray={`${sw * 6} ${sw * 3}`} />}
    </g>
  );
}

/** Vista previa del mueble con sus medidas. */
export default function DibujoMueble({ m, className = '' }: { m: Mueble; className?: string }) {
  const W = Math.max(1, Math.round(m.ancho * 1000)), H = Math.max(1, Math.round(m.alto * 1000));
  const pad = Math.max(W, H) * 0.12;
  const fs = Math.max(W, H) * 0.055;
  return (
    <svg viewBox={`${-pad} ${-pad * 0.5} ${W + pad * 1.5} ${H + pad * 1.6}`} className={className} style={{ fontFamily: 'system-ui' }} role="img" aria-label="Dibujo del mueble">
      <FrenteSvg m={m} />
      <line x1={0} x2={W} y1={H + pad * 0.5} y2={H + pad * 0.5} stroke="#64748b" strokeWidth={fs / 10} />
      <text x={W / 2} y={H + pad * 0.5 + fs * 1.1} fontSize={fs} fontWeight={800} fill="#334155" textAnchor="middle">{m.ancho.toFixed(2)} m</text>
      <line x1={-pad * 0.45} x2={-pad * 0.45} y1={0} y2={H} stroke="#64748b" strokeWidth={fs / 10} />
      <text x={-pad * 0.6} y={H / 2} fontSize={fs} fontWeight={800} fill="#334155" textAnchor="middle" transform={`rotate(-90 ${-pad * 0.6} ${H / 2})`}>{m.alto.toFixed(2)} m</text>
    </svg>
  );
}
