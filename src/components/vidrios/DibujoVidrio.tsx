// Elevación de cada trabajo de vidrio y aluminio (SVG en mm, y hacia abajo): marco,
// hojas y paños con su vidrio, flechas de apertura (corredizas ↔, proyectante ▲,
// batiente ◁), jaladores y cotas (total y por hoja). En miniatura, sin cotas.
import type { ReactElement } from 'react';
import { colorAlu, vidrioDe } from '../../catalogo/vidrios';
import { CotaH, CotaV, Flecha } from '../carpinteria/comun/ui';
import { ItemVidrio } from './modeloVidrios';
import { geometria } from './calculoVidrios';

export const colorVidrio = (v: string) => v.startsWith('espejo') ? '#cfd8e3' : v === 'catedral' ? '#e0f2fe' : v.startsWith('templado') ? '#bfe9e4' : '#cdeefa';

export default function DibujoVidrio({ it, mini = false, className = '' }: { it: ItemVidrio; mini?: boolean; className?: string }) {
  const W = Math.round(Math.max(0.1, it.ancho) * 1000), H = Math.round(Math.max(0.1, it.alto) * 1000);
  const g = geometria(it);
  const alu = colorAlu(it.color).hex, aluLinea = it.color === 'blanco' ? '#94a3b8' : '#1e293b';
  const fs = Math.max(W, H, 600) * 0.05, sw = Math.max(3, Math.max(W, H) / 280);
  const vid = colorVidrio(it.vidrio);
  const conAlu = !(it.tipo === 'puerta_templada' || (it.tipo === 'ducha') || (it.tipo === 'espejo' && !it.marcoEspejo) || it.tipo === 'baranda');
  const els: ReactElement[] = [];
  const brillo = (x: number, y: number, w: number, h: number, k: string) => (
    <g key={k} opacity={0.75}>
      <line x1={x + w * 0.15} y1={y + h * 0.35} x2={x + w * 0.4} y2={y + h * 0.1} stroke="#fff" strokeWidth={sw * 1.4} />
      <line x1={x + w * 0.22} y1={y + h * 0.48} x2={x + w * 0.55} y2={y + h * 0.15} stroke="#fff" strokeWidth={sw * 0.8} />
    </g>
  );
  const orden = [...g.hojas.map((h, i) => ({ h, i }))].sort((a, b) => a.h.plano - b.h.plano);
  if (conAlu && it.tipo !== 'espejo') els.push(<rect key="m" x={0} y={0} width={W} height={H} fill={alu} stroke={aluLinea} strokeWidth={sw} />);
  if (it.tipo === 'espejo' && it.marcoEspejo) els.push(<rect key="m" x={0} y={0} width={W} height={H} fill={alu} stroke={aluLinea} strokeWidth={sw} rx={sw} />);
  orden.forEach(({ h, i }) => {
    const perfil = it.tipo === 'corrediza' || it.tipo === 'mampara' ? (it.tipo === 'mampara' ? 45 : 32) : it.tipo === 'proyectante' ? 30 : it.tipo === 'fija' ? 8 : 0;
    const gx = h.x + perfil, gy = h.y + perfil, gw = h.w - 2 * perfil, gh = h.h - 2 * perfil;
    if (perfil) els.push(<rect key={`h${i}`} x={h.x} y={h.y} width={h.w} height={h.h} fill={alu} stroke={aluLinea} strokeWidth={sw} />);
    if (it.tipo === 'celosia') {
      const n = g.lamas || 2, paso = h.h / n;
      for (let k = 0; k < n; k++) els.push(<rect key={`l${k}`} x={h.x} y={h.y + k * paso + paso * 0.08} width={h.w} height={paso * 0.92} fill={vid} stroke="#64748b" strokeWidth={sw * 0.6} />);
      if (!mini) els.push(<Flecha key="fl" x1={h.x + h.w * 0.88} y1={h.y + h.h * 0.7} x2={h.x + h.w * 0.88} y2={h.y + h.h * 0.3} w={sw * 1.4} color="#0e7490" />);
      return;
    }
    els.push(<rect key={`v${i}`} x={gx} y={gy} width={Math.max(1, gw)} height={Math.max(1, gh)} fill={vid} fillOpacity={it.tipo === 'espejo' ? 1 : 0.85} stroke={perfil ? aluLinea : '#5e8f96'} strokeWidth={sw * (perfil ? 0.6 : 1.4)} />);
    if (it.tipo === 'espejo' && it.biselado) els.push(<rect key="bis" x={gx + 25} y={gy + 25} width={Math.max(1, gw - 50)} height={Math.max(1, gh - 50)} fill="none" stroke="#94a3b8" strokeWidth={sw * 0.7} />);
    els.push(brillo(gx, gy, gw, gh, `b${i}`));
    // Apertura
    const cx = h.x + h.w / 2, cy = h.y + h.h / 2, L = Math.min(h.w * 0.32, 260);
    if (h.dir) {
      els.push(<Flecha key={`a${i}`} x1={cx - (L / 2) * h.dir} y1={cy} x2={cx + (L / 2) * h.dir} y2={cy} w={sw * 1.5} color="#0e7490" />);
    } else if (h.movil && it.tipo === 'proyectante' && !mini) {
      els.push(<polyline key={`a${i}`} points={`${gx},${gy + gh} ${gx + gw / 2},${gy} ${gx + gw},${gy + gh}`} fill="none" stroke="#0e7490" strokeOpacity={0.7} strokeWidth={sw * 0.8} strokeDasharray={`${sw * 5} ${sw * 3}`} />);
    } else if (h.movil && h.bisagra && !mini) {
      const izq = h.bisagra === 'izq';
      els.push(<polyline key={`a${i}`} points={izq ? `${h.x + h.w},${h.y} ${h.x},${h.y + h.h / 2} ${h.x + h.w},${h.y + h.h}` : `${h.x},${h.y} ${h.x + h.w},${h.y + h.h / 2} ${h.x},${h.y + h.h}`}
        fill="none" stroke="#0e7490" strokeOpacity={0.7} strokeWidth={sw * 0.8} strokeDasharray={`${sw * 5} ${sw * 3}`} />);
    }
    if (it.tipo === 'mampara' && !h.movil && !mini) els.push(<text key={`f${i}`} x={cx} y={cy + fs * 1.2} fontSize={fs * 0.8} fontWeight={900} fill="#0e7490" textAnchor="middle">F</text>);
    // Jaladores
    if ((it.tipo === 'puerta_templada' || (it.tipo === 'ducha' && h.movil) || (it.tipo === 'mampara' && h.movil))) {
      const jx = h.bisagra === 'izq' ? h.x + h.w - 80 : h.bisagra === 'der' ? h.x + 80 : h.dir === -1 ? h.x + h.w - 70 : h.x + 70;
      const jl = it.tipo === 'puerta_templada' ? 600 : 300;
      els.push(<line key={`j${i}`} x1={jx} x2={jx} y1={h.y + h.h * 0.5 - jl / 2} y2={h.y + h.h * 0.5 + jl / 2} stroke="#475569" strokeWidth={sw * 2.6} strokeLinecap="round" />);
    }
    if (it.tipo === 'puerta_templada') {
      const bx = h.bisagra === 'izq' ? h.x + 40 : h.x + h.w - 40;
      els.push(<rect key={`p${i}`} x={bx - 40} y={h.y + h.h - 50} width={80} height={60} fill="#64748b" />, <rect key={`q${i}`} x={bx - 40} y={h.y - 10} width={80} height={50} fill="#64748b" />);
    }
  });
  if (it.tipo === 'ducha') {
    els.push(<rect key="piso" x={-60} y={H} width={W + 120} height={sw * 4} fill="#94a3b8" />);
    if (it.ducha === 'corrediza') els.push(<line key="tubo" x1={0} x2={W} y1={-30} y2={-30} stroke="#94a3b8" strokeWidth={sw * 3} strokeLinecap="round" />);
  }
  if (it.tipo === 'baranda') {
    const pinzas = it.baranda === 'pinzas';
    els.unshift(<rect key="losa" x={-80} y={H} width={W + 160} height={120} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={sw} />);
    els.push(<rect key="pas" x={-20} y={0} width={W + 40} height={45} rx={20} fill={alu} stroke={aluLinea} strokeWidth={sw} />);
    if (!pinzas) els.push(<rect key="base" x={-10} y={H - 90} width={W + 20} height={90} fill={alu} stroke={aluLinea} strokeWidth={sw} />);
    else g.hojas.concat([{ ...g.hojas[g.hojas.length - 1], x: W + 30 }]).forEach((h, k) => els.push(<rect key={`pt${k}`} x={h.x - 45} y={0} width={30} height={H} fill="#cbd5e1" stroke="#64748b" strokeWidth={sw * 0.6} />));
  }
  if (it.tipo === 'puerta_templada' || it.tipo === 'mampara') els.push(<rect key="suelo" x={-200} y={H} width={W + 400} height={sw * 3} fill="#94a3b8" />);

  const multi = g.hojas.length > 1 && !mini && it.tipo !== 'baranda';
  const cotas = !mini && (
    <g>
      {multi && g.hojas.slice().sort((a, b) => a.x - b.x).map((h, i) => <CotaH key={i} x1={h.x} x2={h.x + h.w} y={-fs * (i % 2 ? 1.0 : 2.1) - (it.tipo === 'ducha' ? 40 : 0)} texto={`${Math.round(h.w)}`} fs={fs * 0.7} />)}
      <CotaH x1={0} x2={W} y={H + fs * (it.tipo === 'baranda' ? 3.2 : 1.6)} texto={`${(W / 1000).toFixed(2)} m`} fs={fs} />
      <CotaV y1={0} y2={H} x={-fs * 1.0 - (it.tipo === 'baranda' ? 80 : 0)} texto={`${(H / 1000).toFixed(2)} m`} fs={fs} />
    </g>
  );
  const padL = mini ? sw * 4 : fs * 2.6 + (it.tipo === 'baranda' ? 80 : 0), padR = mini ? sw * 4 : fs * 0.8;
  const padT = mini ? sw * 6 : fs * (multi ? 3.2 : 1.2), padB = mini ? sw * 6 : fs * (it.tipo === 'baranda' ? 4.4 : 2.8);
  return (
    <svg viewBox={`${-padL} ${-padT} ${W + padL + padR} ${H + padT + padB}`} className={className} style={{ fontFamily: 'system-ui' }} role="img" aria-label={vidrioDe(it.vidrio).nombre}>
      {els}
      {cotas}
    </svg>
  );
}
