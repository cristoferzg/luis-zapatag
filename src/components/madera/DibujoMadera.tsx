// Dibujo de cada trabajo de madera (SVG en mm, y hacia abajo): elevación de puertas,
// marcos, closets y muebles (con el sentido de apertura), planta de pisos y cielos,
// y corte lateral de escaleras. Con cotas; en miniatura, sin cotas.
import type { ReactElement } from 'react';
import { COLOR_MADERA } from '../../catalogo/madera';
import { tono } from '../melamina/DibujoMueble';
import { CotaH, CotaV } from '../carpinteria/comun/ui';
import { ItemMadera } from './modeloMadera';
import { datosEscalera } from './calculoMadera';

export const colorAcabado = (it: { acabado: string; madera: keyof typeof COLOR_MADERA }) =>
  it.acabado === 'duco' ? '#f1ece2' : it.acabado === 'tinte' ? tono(COLOR_MADERA[it.madera], -0.12) : COLOR_MADERA[it.madera];

export default function DibujoMadera({ it, mini = false, className = '' }: { it: ItemMadera; mini?: boolean; className?: string }) {
  const W = Math.round(Math.max(0.1, it.ancho) * 1000), H = Math.round(Math.max(0.1, it.alto) * 1000);
  const fill = colorAcabado(it);
  const marcoC = it.tipo === 'marco' ? colorAcabado(it) : colorAcabado({ acabado: it.acabado === 'duco' ? 'laca' : it.acabado, madera: it.maderaMarco });
  const linea = '#3f2a1a';
  let caja = { x0: 0, y0: 0, x1: W, y1: H };
  let cuerpo: ReactElement;
  let cotas: ReactElement | null = null;
  const fs = Math.max(W, H, 600) * 0.05;
  const sw = Math.max(3, Math.max(W, H) / 260);

  const hoja = (x: number, y: number, w: number, h: number, hinge: 'izq' | 'der', key: string | number, opts: { paneles?: number; manija?: boolean; tirador?: boolean; alturaManija?: number } = {}) => {
    const cols = (opts.paneles || 0) >= 4 ? 2 : 1, rows = opts.paneles ? opts.paneles / cols : 0;
    const st = 127, top = 127, bot = 203, mid = 152;
    const pw = (w - 2 * st - (cols - 1) * st) / cols, ph = rows ? (h - top - bot - (rows - 1) * mid) / rows : 0;
    const mx = hinge === 'izq' ? x + w - Math.min(70, w * 0.12) : x + Math.min(70, w * 0.12);
    const my = opts.alturaManija !== undefined ? y + h - opts.alturaManija : y + h / 2;
    return (
      <g key={key}>
        <rect x={x} y={y} width={w} height={h} fill={fill} stroke={linea} strokeWidth={sw} />
        {it.acabado !== 'duco' && !opts.paneles && [0.22, 0.47, 0.71].map(f => <path key={f} d={`M ${x + w * f} ${y + 20} q ${w * 0.04} ${h * 0.25} 0 ${h * 0.5} t 0 ${h * 0.45}`} fill="none" stroke={tono(fill, -0.12)} strokeWidth={sw * 0.6} />)}
        {rows > 0 && Array.from({ length: rows }).map((_, r) => Array.from({ length: cols }).map((__, c) => {
          const px = x + st + c * (pw + st), py = y + top + r * (ph + mid);
          return (
            <g key={`${r}-${c}`}>
              <rect x={px} y={py} width={pw} height={ph} fill={tono(fill, -0.05)} stroke={linea} strokeWidth={sw * 0.8} />
              <rect x={px + Math.min(45, pw * 0.15)} y={py + Math.min(45, ph * 0.1)} width={Math.max(0, pw - 2 * Math.min(45, pw * 0.15))} height={Math.max(0, ph - 2 * Math.min(45, ph * 0.1))} fill={tono(fill, 0.05)} stroke={linea} strokeOpacity={0.5} strokeWidth={sw * 0.6} />
            </g>
          );
        }))}
        {!mini && <polyline points={hinge === 'izq' ? `${x + w},${y} ${x},${y + h / 2} ${x + w},${y + h}` : `${x},${y} ${x + w},${y + h / 2} ${x},${y + h}`}
          fill="none" stroke={linea} strokeOpacity={0.45} strokeWidth={sw * 0.7} strokeDasharray={`${sw * 5} ${sw * 3}`} />}
        {opts.manija && <><circle cx={mx} cy={my} r={Math.max(sw * 3, 22)} fill="#b8a07a" stroke="#6b5a3e" strokeWidth={sw * 0.6} /><circle cx={mx} cy={my + 60} r={sw * 1.4} fill="#475569" /></>}
        {opts.tirador && <line x1={mx} x2={mx} y1={my - Math.min(64, h / 6)} y2={my + Math.min(64, h / 6)} stroke="#475569" strokeWidth={sw * 2.2} strokeLinecap="round" />}
        {!mini && !opts.tirador && [0.12, 0.5, 0.88].slice(0, h > 1500 ? 3 : 2).map((f, i) => <rect key={i} x={hinge === 'izq' ? x - sw * 1.5 : x + w - sw * 1.5} y={y + h * (h > 1500 ? f : i ? 0.85 : 0.1)} width={sw * 3} height={70} fill="#6b7280" />)}
      </g>
    );
  };

  switch (it.tipo) {
    case 'puerta_contraplacada': case 'puerta_apanelada': case 'marco': {
      const conMarco = it.tipo === 'marco' || it.marco;
      const m = conMarco ? 40 : 0, c = conMarco ? 65 : 0;
      caja = { x0: -m - c, y0: -m - c, x1: W + m + c, y1: H };
      cuerpo = (
        <g>
          <rect x={-m - c - fs * 2.2} y={H} width={W + 2 * (m + c) + fs * 2.8} height={sw * 3} fill="#94a3b8" />
          {conMarco && <rect x={-m - c} y={-m - c} width={W + 2 * (m + c)} height={H + m + c} fill={tono(marcoC, 0.06)} stroke={linea} strokeWidth={sw} />}
          {conMarco && <rect x={-m} y={-m} width={W + 2 * m} height={H + m} fill={marcoC} stroke={linea} strokeWidth={sw} />}
          {it.tipo === 'marco'
            ? <rect x={0} y={0} width={W} height={H} fill="#f8fafc" stroke={linea} strokeWidth={sw} strokeDasharray={`${sw * 4} ${sw * 3}`} />
            : hoja(0, 0, W, H, it.lado, 'h', { paneles: it.tipo === 'puerta_apanelada' ? it.paneles : 0, manija: it.chapa !== 'ninguna', alturaManija: 1000 })}
        </g>
      );
      if (!mini) cotas = (
        <g>
          <CotaH x1={0} x2={W} y={H + fs * 1.6} texto={`${(W / 1000).toFixed(2)} m`} fs={fs} />
          <CotaV y1={0} y2={H} x={caja.x0 - fs * 0.9} texto={`${(H / 1000).toFixed(2)} m`} fs={fs} />
        </g>
      );
      break;
    }
    case 'closet': case 'mueble': {
      const t = 18, z = 80, hc = 180;
      const hojas = Math.max(1, Math.round(it.hojas)), comps = hojas >= 2 ? Math.ceil(hojas / 2) : 1;
      const cw = (W - 2 * t - (comps - 1) * t) / comps;
      const filas = Math.max(0, Math.round(it.filasCajones));
      const hp = H - z - filas * hc - t;
      const els: ReactElement[] = [];
      for (let ci = 0; ci < comps; ci++) {
        const x0 = t + ci * (cw + t);
        const enEste = ci === comps - 1 ? hojas - 2 * (comps - 1) : 2;
        const w = (cw - 3 * (enEste - 1)) / Math.max(1, enEste);
        if (hp > 100) for (let k = 0; k < enEste; k++) els.push(hoja(x0 + k * (w + 3), t, w, hp, enEste === 2 ? (k === 0 ? 'izq' : 'der') : 'izq', `p${ci}-${k}`, { tirador: it.tirador, alturaManija: it.tipo === 'closet' ? hp / 2 : hp - 120 }));
        for (let f = 0; f < filas; f++) {
          const y = t + Math.max(0, hp) + 3 + f * hc;
          els.push(<g key={`c${ci}-${f}`}><rect x={x0} y={y} width={cw} height={hc - 4} fill={tono(fill, -0.04)} stroke={linea} strokeWidth={sw} />
            {it.tirador && <line x1={x0 + cw / 2 - 60} x2={x0 + cw / 2 + 60} y1={y + hc / 2} y2={y + hc / 2} stroke="#475569" strokeWidth={sw * 2.2} strokeLinecap="round" />}</g>);
        }
      }
      cuerpo = (
        <g>
          <rect x={0} y={0} width={W} height={H} fill={tono(fill, -0.18)} stroke={linea} strokeWidth={sw} />
          <rect x={t} y={H - z} width={W - 2 * t} height={z} fill={tono(fill, -0.3)} />
          {els}
        </g>
      );
      if (!mini) cotas = (
        <g>
          <CotaH x1={0} x2={W} y={H + fs * 1.6} texto={`${(W / 1000).toFixed(2)} m`} fs={fs} />
          <CotaV y1={0} y2={H} x={-fs * 0.9} texto={`${(H / 1000).toFixed(2)} m`} fs={fs} />
          <text x={W} y={-fs * 0.5} fontSize={fs * 0.75} fontWeight={700} fill="#64748b" textAnchor="end">fondo {(it.prof).toFixed(2)} m</text>
        </g>
      );
      break;
    }
    case 'piso': case 'cielo': {
      const piso = it.tipo === 'piso';
      const solida = ['cedro', 'tornillo', 'pino'].includes(it.madera);
      const paso = solida ? Math.max(89, W / 60) : 1220;
      const lineas: ReactElement[] = [];
      for (let x = paso; x < W; x += paso) lineas.push(<line key={`l${x}`} x1={x} x2={x} y1={0} y2={H} stroke={tono(fill, -0.22)} strokeWidth={sw * 0.6} />);
      if (solida) for (let x = 0, k = 0; x < W; x += paso, k++) lineas.push(<line key={`j${x}`} x1={x} x2={x + paso} y1={(k % 3 + 1) * H / 4} y2={(k % 3 + 1) * H / 4} stroke={tono(fill, -0.22)} strokeWidth={sw * 0.5} />);
      const sep = piso ? 400 : 500;
      const durm: ReactElement[] = [];
      if (!mini) for (let x = 0; x <= W + 1; x += sep) durm.push(<line key={`d${x}`} x1={Math.min(x, W)} x2={Math.min(x, W)} y1={0} y2={H} stroke="#7c2d12" strokeOpacity={0.3} strokeWidth={sw * 1.2} strokeDasharray={`${sw * 6} ${sw * 4}`} />);
      cuerpo = (
        <g>
          <rect x={0} y={0} width={W} height={H} fill={fill} stroke={linea} strokeWidth={sw} />
          {lineas}
          {durm}
          {!mini && <text x={W / 2} y={H / 2} fontSize={fs * 0.8} fontWeight={800} fill="#3f2a1a" fillOpacity={0.6} textAnchor="middle">{piso ? 'Planta del piso' : 'Planta del cielo'} · {(it.ancho * it.alto).toFixed(2)} m²</text>}
        </g>
      );
      if (!mini) cotas = (
        <g>
          <CotaH x1={0} x2={W} y={H + fs * 1.6} texto={`${(W / 1000).toFixed(2)} m`} fs={fs} />
          <CotaV y1={0} y2={H} x={-fs * 0.9} texto={`${(H / 1000).toFixed(2)} m`} fs={fs} />
        </g>
      );
      break;
    }
    case 'escalera': default: {
      const e = datosEscalera(it);
      const ch = H / e.n, hu = 250, run = e.pasos * hu;
      let pts = `0,${H}`;
      for (let i = 0; i < e.n; i++) { const x = i * hu, y = H - (i + 1) * ch; pts += ` ${x},${H - i * ch} ${x},${y}`; if (i < e.n - 1) pts += ` ${x + hu},${y}`; }
      const zancaPts = `0,${H} ${run},${0} ${run},${ch * 1.4} ${hu * 0.6},${H}`;
      const bal: ReactElement[] = [];
      for (let i = 0; i < e.pasos; i++) { const x = i * hu + hu / 2, y = H - (i + 1) * ch; bal.push(<line key={i} x1={x} x2={x} y1={y} y2={y - 900} stroke={tono(fill, -0.2)} strokeWidth={sw * 1.5} />); }
      cuerpo = (
        <g>
          <rect x={-200} y={H} width={run + 600} height={sw * 3} fill="#94a3b8" />
          <polygon points={zancaPts} fill={tono(fill, -0.15)} stroke={linea} strokeWidth={sw} />
          <polyline points={pts} fill="none" stroke={linea} strokeWidth={sw * 2} />
          {bal}
          <line x1={hu / 2} y1={H - ch - 900} x2={run - hu / 2} y2={ch - 900 + ch * 0} stroke={tono(fill, -0.25)} strokeWidth={sw * 4} strokeLinecap="round" />
        </g>
      );
      caja = { x0: 0, y0: -900, x1: Math.max(run, 400), y1: H };
      if (!mini) cotas = (
        <g>
          <CotaH x1={0} x2={run} y={H + fs * 1.6} texto={`recorrido ${(run / 1000).toFixed(2)} m`} fs={fs} />
          <CotaV y1={0} y2={H} x={-fs * 0.9} texto={`${(H / 1000).toFixed(2)} m`} fs={fs} />
          <text x={run} y={-900 - fs * 0.4} fontSize={fs * 0.75} fontWeight={700} fill="#64748b" textAnchor="end">{e.pasos} pasos · contrapaso {(e.contrapaso * 100).toFixed(1)} cm</text>
        </g>
      );
    }
  }
  const padL = mini ? sw * 4 : fs * 2.4, padB = mini ? sw * 4 : fs * 2.6, padT = mini ? sw * 4 : fs * 1.6, padR = mini ? sw * 4 : fs * 0.8;
  const vb = `${caja.x0 - padL} ${caja.y0 - padT} ${caja.x1 - caja.x0 + padL + padR} ${caja.y1 - caja.y0 + padT + padB}`;
  return (
    <svg viewBox={vb} className={className} style={{ fontFamily: 'system-ui' }} role="img" aria-label="Dibujo" preserveAspectRatio="xMidYMid meet">
      {cuerpo}
      {cotas}
    </svg>
  );
}
