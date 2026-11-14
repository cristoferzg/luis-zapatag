// =============================================================================
// Comportamiento sísmico (como lo muestran ETABS / SAP2000, en simple):
//  • Espectro de diseño E.030-2018 (Sa/g = Z·U·C·S/R) con el periodo de la estructura marcado.
//  • Periodo: aproximado de la norma (T = hn/CT) y dinámico de Rayleigh (T = 2π√(m/k)),
//    con la rigidez lateral que sale del desplazamiento calculado.
//  • Pórtico deformado ANIMADO (modo 1, dirección X) con la forma real de la columna:
//    voladizo (concreto con tijeral articulado) o nudo rígido (acero soldado), exagerado
//    para que se vea, y columnas coloreadas según su deriva.
//  • Fuerza sísmica, cortante y momento en la base de cada columna; deriva contra el límite.
// Usa los mismos números de la memoria de cálculo (no calcula nada distinto).
// =============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Pause, Play } from 'lucide-react';
import type { Node3D, Segment3D } from './techosCadEngineTypes';
import type { Memoria } from './memoriaCalculo';

const f0 = (v: number) => Math.round(v).toLocaleString('es-PE');
const f2 = (v: number) => v.toFixed(2);

export default function ComportamientoSismico({ memoria, nodes, segments }: { memoria: Memoria; nodes: Record<string, Node3D>; segments: Record<string, Segment3D> }) {
  const q = memoria.sismo;
  const [anim, setAnim] = useState(true);
  const [exag, setExag] = useState(0);              // 0 = automática
  const [fase, setFase] = useState(0);
  const raf = useRef(0);

  // Pórtico frontal: el plano z con más piezas (igual que el plano CM-02).
  const portico = useMemo(() => {
    const segs = Object.values(segments).filter(s => nodes[s.nodeAId] && nodes[s.nodeBId]);
    const cuenta: Record<string, number> = {};
    segs.forEach(s => { const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; if (Math.abs((a.z || 0) - (b.z || 0)) < 0.02) { const k = (a.z || 0).toFixed(2); cuenta[k] = (cuenta[k] || 0) + 1; } });
    const z = parseFloat(Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '0');
    const fr = segs.filter(s => Math.abs((nodes[s.nodeAId].z || 0) - z) < 0.02 && Math.abs((nodes[s.nodeBId].z || 0) - z) < 0.02);
    const xs = fr.flatMap(s => [nodes[s.nodeAId].x, nodes[s.nodeBId].x]), ys = fr.flatMap(s => [nodes[s.nodeAId].y, nodes[s.nodeBId].y]);
    const cols = fr.filter(s => /^columna/.test(s.rolEstructural || ''));
    const h = cols.length ? Math.max(...cols.map(s => Math.abs(nodes[s.nodeAId].y - nodes[s.nodeBId].y))) : Math.max(...ys);
    return { fr, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), h, nCols: cols.length };
  }, [nodes, segments]);

  useEffect(() => {
    if (!anim || !q) return;
    const Tvis = 1.4; // cámara lenta: el periodo real dura décimas de segundo
    const t0 = performance.now();
    const paso = (t: number) => { setFase(Math.sin(((t - t0) / 1000) * (2 * Math.PI / Tvis))); raf.current = requestAnimationFrame(paso); };
    raf.current = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf.current);
  }, [anim, q]);

  if (!q) return null;
  const voladizo = !!q.concreto;
  // Periodo dinámico (Rayleigh) con la rigidez lateral que da el cálculo de deriva.
  const deltaE = q.deltaCm / (0.75 * q.R);                                   // cm, elástico
  const kNm = deltaE > 0 ? (q.VKg * 9.81) / (deltaE / 100) : 0;              // N/m
  const Tdin = kNm > 0 ? 2 * Math.PI * Math.sqrt(q.PKg / kNm) : q.T;
  const Cde = (T: number) => Math.max(T < q.Tp ? 2.5 : T < q.TL ? 2.5 * q.Tp / T : 2.5 * q.Tp * q.TL / (T * T), 0.11 * q.R);
  const SaDe = (T: number) => (q.Z * q.U * Cde(T) * q.S) / q.R;
  const ratioDeriva = q.deriva / q.derivaLim;
  const colorDeriva = ratioDeriva <= 0.7 ? '#059669' : ratioDeriva <= 1 ? '#d97706' : '#dc2626';
  const Mbase = voladizo ? q.VColKg * portico.h : (q.VColKg * portico.h) / 2;

  // ----- Espectro -----
  const EW = 340, EH = 190, Tmax = 3;
  const SaMax = SaDe(0) * 1.15;
  const ex = (T: number) => 34 + (T / Tmax) * (EW - 44), ey = (sa: number) => EH - 26 - (sa / SaMax) * (EH - 44);
  const curva = Array.from({ length: 121 }, (_, i) => { const T = (i / 120) * Tmax; return `${i ? 'L' : 'M'}${ex(T).toFixed(1)},${ey(SaDe(T)).toFixed(1)}`; }).join(' ');

  // ----- Pórtico deformado -----
  const PW = 420, PH = 240, pad = 34;
  const ancho = portico.x1 - portico.x0 || 1, alto = portico.y1 - portico.y0 || 1;
  const k = Math.min((PW - 2 * pad) / ancho, (PH - 2 * pad - 10) / alto);
  const ox = (PW - ancho * k) / 2, oy = PH - pad;
  const dTop = q.deltaCm / 100;                                              // m, inelástico
  const amp = exag || Math.max(1, (ancho * 0.07) / Math.max(1e-4, dTop));    // exageración automática: tope ≈ 7 % de la luz
  const forma = (y: number) => {
    const r = Math.min(1, Math.max(0, (y - portico.y0) / Math.max(0.1, portico.h)));
    return voladizo ? (r * r * (3 - r)) / 2 : r * r * (3 - 2 * r);           // voladizo | nudo rígido
  };
  const P = (n: Node3D, def: boolean): [number, number] => {
    const u = def ? dTop * amp * fase * forma(n.y) : 0;
    return [ox + (n.x - portico.x0 + u) * k, oy - (n.y - portico.y0) * k];
  };
  // Cada pieza se dibuja con 16 puntos: así la columna se ve CURVADA como se deforma de verdad.
  const linea = (s: Segment3D, def: boolean) => {
    const A = nodes[s.nodeAId], B = nodes[s.nodeBId];
    const pts = Array.from({ length: 17 }, (_, i) => { const t = i / 16; return P({ ...A, x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t } as Node3D, def); });
    return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  };
  const yTecho = oy - portico.h * k;

  const tarjeta = (titulo: string, valor: string, nota: string, tono = 'text-slate-900') => (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{titulo}</p>
      <p className={`text-xl font-black leading-tight mt-0.5 ${tono}`}>{valor}</p>
      <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{nota}</p>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-600" />
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">Comportamiento sísmico (E.030-2018)</h3>
            <p className="text-[11px] text-slate-500">Cómo se mueve la estructura en un sismo de diseño: espectro, periodo, deformada y deriva.</p>
          </div>
        </div>
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${q.estado === 'CUMPLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{q.estado === 'CUMPLE' ? 'CUMPLE' : 'NO CUMPLE'} · {q.motivo}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {tarjeta('Periodo fundamental', `${f2(Tdin)} s`, `Dinámico (Rayleigh) · norma hn/35 = ${f2(q.T)} s`)}
        {tarjeta('Cortante basal V', `${f0(q.VKg)} kg`, `${((q.VKg / q.PKg) * 100).toFixed(1)} % del peso sísmico (${f0(q.PKg)} kg)`)}
        {tarjeta('Desplazamiento del techo', `${f2(q.deltaCm)} cm`, `Inelástico 0.75·R·Δe (R = ${q.R})`)}
        {tarjeta('Deriva máxima', q.deriva.toFixed(4), `Límite ${q.derivaLim} (${voladizo ? 'concreto' : 'acero'}) · ${Math.round(ratioDeriva * 100)} % del límite`, ratioDeriva <= 1 ? 'text-emerald-700' : 'text-rose-700')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deformada animada */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <p className="text-xs font-black text-slate-800">Deformada del pórtico · modo 1 (dirección X)</p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setAnim(a => !a)} className="px-2 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                {anim ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}{anim ? 'Pausar' : 'Simular sismo'}
              </button>
              <select value={exag} onChange={e => setExag(Number(e.target.value))} className="text-[11px] font-bold border border-slate-300 rounded-lg px-1.5 py-1 bg-white">
                <option value={0}>Escala auto (×{Math.round(amp)})</option>
                {[10, 25, 50, 100].map(v => <option key={v} value={v}>×{v}</option>)}
              </select>
            </div>
          </div>
          <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-auto">
            <line x1={ox - 20} y1={oy} x2={ox + ancho * k + 20} y2={oy} stroke="#94a3b8" strokeDasharray="5 4" />
            {/* Suelo moviéndose (dirección del sismo) */}
            {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={ox - 20 + i * (ancho * k + 40) / 5} y1={oy + 2} x2={ox - 28 + i * (ancho * k + 40) / 5} y2={oy + 10} stroke="#cbd5e1" />)}
            {portico.fr.map(s => <path key={`u${s.id}`} d={linea(s, false)} stroke="#cbd5e1" strokeWidth={1.2} strokeDasharray="4 3" fill="none" />)}
            {portico.fr.map(s => {
              const col = /^columna/.test(s.rolEstructural || '');
              return <path key={s.id} d={linea(s, true)} stroke={col ? colorDeriva : s.rolEstructural === 'cordon_superior' ? '#ef4444' : s.rolEstructural === 'cordon_inferior' ? '#22c55e' : '#64748b'} strokeWidth={col ? 4 : 1.6} strokeLinecap="round" fill="none" />;
            })}
            {/* Fuerza sísmica en el techo */}
            <g transform={`translate(${ox - 6 + dTop * amp * fase * k},${yTecho})`}>
              <line x1={-46} y1={0} x2={-8} y2={0} stroke="#e11d48" strokeWidth={2.5} />
              <path d="M-8,-5 L0,0 L-8,5 Z" fill="#e11d48" />
              <text x={-48} y={-7} fontSize={10} fontWeight={800} fill="#e11d48">V = {f0(q.VKg)} kg</text>
            </g>
            <text x={PW - 8} y={14} fontSize={10} textAnchor="end" fill="#475569">{voladizo ? 'Columnas en voladizo (tijeral articulado)' : 'Pórtico con nudos rígidos (soldado)'}</text>
            <text x={PW - 8} y={27} fontSize={10} textAnchor="end" fill="#475569">Δ techo = {f2(q.deltaCm)} cm · dibujado ×{Math.round(amp)}</text>
          </svg>
          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
            <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-emerald-600" /> deriva &lt; 70 %</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-amber-600" /> 70–100 %</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 rounded bg-red-600" /> excede</span>
            <span className="flex items-center gap-1"><span className="w-3 border-t border-dashed border-slate-400" /> sin sismo</span>
          </div>
        </div>

        {/* Espectro */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-black text-slate-800 mb-1">Espectro de diseño E.030 · Sa/g = Z·U·C·S / R</p>
          <svg viewBox={`0 0 ${EW} ${EH}`} className="w-full h-auto">
            <line x1={34} y1={EH - 26} x2={EW - 8} y2={EH - 26} stroke="#94a3b8" />
            <line x1={34} y1={10} x2={34} y2={EH - 26} stroke="#94a3b8" />
            {[0, 0.5, 1, 1.5, 2, 2.5, 3].map(T => <g key={T}><line x1={ex(T)} y1={EH - 26} x2={ex(T)} y2={EH - 22} stroke="#94a3b8" /><text x={ex(T)} y={EH - 12} fontSize={9} textAnchor="middle" fill="#64748b">{T}</text></g>)}
            {[0, 0.5, 1].map(f => <text key={f} x={30} y={ey(SaMax * f / 1.15) + 3} fontSize={9} textAnchor="end" fill="#64748b">{(SaMax * f / 1.15).toFixed(2)}</text>)}
            <line x1={ex(q.Tp)} y1={ey(SaDe(q.Tp))} x2={ex(q.Tp)} y2={EH - 26} stroke="#cbd5e1" strokeDasharray="3 3" />
            <text x={ex(q.Tp) + 3} y={EH - 30} fontSize={9} fill="#94a3b8">Tp</text>
            <line x1={ex(q.TL)} y1={ey(SaDe(q.TL))} x2={ex(q.TL)} y2={EH - 26} stroke="#cbd5e1" strokeDasharray="3 3" />
            <text x={ex(q.TL) + 3} y={EH - 30} fontSize={9} fill="#94a3b8">TL</text>
            <path d={curva} stroke="#4f46e5" strokeWidth={2} fill="none" />
            <line x1={ex(Math.min(Tdin, Tmax))} y1={ey(SaDe(Tdin))} x2={ex(Math.min(Tdin, Tmax))} y2={EH - 26} stroke="#e11d48" strokeDasharray="2 2" />
            <circle cx={ex(Math.min(Tdin, Tmax))} cy={ey(SaDe(Tdin))} r={4.5} fill="#e11d48" />
            <text x={ex(Math.min(Tdin, Tmax)) + 7} y={ey(SaDe(Tdin)) - 6} fontSize={10} fontWeight={800} fill="#e11d48">T = {f2(Tdin)} s · Sa = {SaDe(Tdin).toFixed(3)} g</text>
            <text x={EW - 8} y={EH - 2} fontSize={9} textAnchor="end" fill="#64748b">Periodo T (s)</text>
          </svg>
          <p className="text-[10px] text-slate-500">Z {q.Z} ({q.zona}) · U {q.U} (cat. {q.categoria}) · S {q.S} ({q.suelo}) · R {q.R} · Tp {q.Tp} s · TL {q.TL} s</p>
        </div>
      </div>

      {/* Fuerzas en la base y deriva */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 p-3 text-xs space-y-1.5">
          <p className="font-black text-slate-800">Fuerzas en la base de cada columna ({q.nCols})</p>
          <div className="flex justify-between"><span className="text-slate-500">Cortante por sismo</span><b>{f0(q.VColKg)} kg</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Momento en la base {voladizo ? '(V·h)' : '(V·h/2)'}</span><b>{f0(Mbase)} kg·m</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Carga vertical de servicio</span><b>{f0(memoria.reacciones.servicioKg)} kg</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Levantamiento por viento</span><b>{memoria.reacciones.levantamientoKg < 0 ? `${f0(-memoria.reacciones.levantamientoKg)} kg hacia arriba` : 'no hay'}</b></div>
          <p className="text-[10px] text-slate-500 pt-1">En la dirección Y (a lo largo) el sismo lo toman las cruces de arriostre entre pórticos: por eso deben ir en los paños extremos.</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-3 text-xs">
          <p className="font-black text-slate-800 mb-2">Deriva de entrepiso vs. límite de la norma</p>
          <div className="space-y-2">
            {[['Calculada', q.deriva, colorDeriva], ['Límite E.030', q.derivaLim, '#334155']].map(([t, v, c]) => (
              <div key={t as string}>
                <div className="flex justify-between text-[11px]"><span className="text-slate-500">{t as string}</span><b>{(v as number).toFixed(4)}</b></div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, ((v as number) / (q.derivaLim * 1.4)) * 100)}%`, background: c as string }} /></div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Deriva = desplazamiento del techo / altura de la columna. Si se pasa del límite, la columna es muy flexible: se agranda la sección o se arriostra.</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400">Análisis estático equivalente con un grado de libertad por dirección (prediseño). Un análisis modal espectral completo lo hace el ingeniero responsable con software especializado.</p>
    </div>
  );
}
