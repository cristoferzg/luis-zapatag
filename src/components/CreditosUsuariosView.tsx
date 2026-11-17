// Administración → Créditos (pedido del dueño, 17/11/2026): cómo recargan los usuarios (Yape, Plin, Google Play,
// Mercado Pago, WhatsApp, validadas a mano, regalos) y en qué gastan sus créditos (cada función de IA y los canjes).
// Recargas: de `purchases` (validadas). Gasto: de `ai_access/<ws>` (gastoMes, gastoPorAccion, movimientos), que anota
// el servidor en cada cobro desde el 17/11/2026. Solo admin. DEV: window.__creditosSimulados = { access: [...] }.
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Coins, RefreshCw, Wallet, TrendingDown, Users, X, Gift, Search } from 'lucide-react';
import { db } from '../lib/firebase';
import { useFirestoreArraySync } from '../lib/db';
import { regalarCreditos, type AIAccess } from '../lib/aiAccess';

interface Compra { id: string; userId: string; userName?: string; itemId: string; itemName: string; status: string; amount?: number; origen?: string; metodo?: string; createdAt: string }
interface Usuario { id: string; name: string; role?: string }

export const NOMBRE_ACCION: Record<string, string> = {
  boleta: 'Leer boletas', croquis: 'Plano a mano (Techos)', redaccion: 'Redactar documentos', melamina: 'Diseño de melamina',
  obra: 'Diseño de obra civil', drywall: 'Drywall con IA', gasfiteria: 'Gasfitería con IA', electricidad: 'Electricidad con IA',
  carpimetal: 'Escaleras con IA', curso: 'Canje de cursos', recurso: 'Canje de plantillas', paquete: 'Canje de paquetes',
};
const COLOR_ACCION = ['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-rose-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500', 'bg-lime-500', 'bg-fuchsia-500', 'bg-cyan-500', 'bg-slate-500'];

const MEDIOS: Record<string, string> = { yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia', google_play: 'Google Play', mercado_pago: 'Mercado Pago', whatsapp: 'WhatsApp', manual: 'Validada a mano' };
function medioDe(c: Compra): string {
  if (c.origen === 'google_play') return 'google_play';
  if (c.origen === 'mercado_pago') return 'mercado_pago';
  if (c.origen === 'whatsapp') return 'whatsapp';
  const m = (c.metodo || '').toLowerCase();
  if (m.includes('plin')) return 'plin';
  if (m.includes('transf')) return 'transferencia';
  if (m.includes('yape') || c.origen === 'pago_directo') return 'yape';
  return 'manual';
}
const creditosDe = (c: Compra) => Number((c.itemId.match(/^ai_creditos_(\d+)/) || [])[1]) || 0;
const esRecarga = (c: Compra) => c.status === 'validada' && /^ai_(creditos|plan)_/.test(c.itemId || '');
const mesDe = (iso?: string) => (iso || '').slice(0, 7);
const soles = (n: number) => `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (iso?: string) => { if (!iso) return '—'; const d = new Date(iso); return `${d.getDate()} ${d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const mesTexto = (m: string) => new Date(m + '-15').toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

export default function CreditosUsuariosView({ usuarios = [] }: { usuarios?: Usuario[] }) {
  const [compras] = useFirestoreArraySync<Compra>('purchases', 'admin', true);
  const [accesos, setAccesos] = useState<(AIAccess & { id: string })[]>([]);
  const [cargando, setCargando] = useState(true);
  const hoy = new Date().toISOString().slice(0, 7);
  const pasado = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })();
  const [periodo, setPeriodo] = useState<string>(hoy);   // 'AAAA-MM' o 'todo'
  const [busca, setBusca] = useState('');
  const [verUsuario, setVerUsuario] = useState<string | null>(null);
  const [regalo, setRegalo] = useState({ n: 20, motivo: '' });
  const [aviso, setAviso] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const sim = import.meta.env.DEV ? (window as any).__creditosSimulados : null;
      if (sim) setAccesos(sim.access);
      else setAccesos((await getDocs(collection(db, 'ai_access'))).docs.map(d => ({ id: d.id, ...(d.data() as AIAccess) })));
    } catch { setAviso('No se pudieron leer los créditos. Revisa tu conexión.'); }
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const comprasLista: Compra[] = (import.meta.env.DEV && (window as any).__creditosSimulados?.compras) || compras;
  const nombre = (id: string) => {
    const base = id.replace(/^user_/, '');
    return usuarios.find(u => u.id === base || u.id === id)?.name || comprasLista.find(c => c.userId === id || c.userId === base)?.userName || `Usuario ${base.slice(0, 6)}`;
  };
  const enPeriodo = (iso?: string) => periodo === 'todo' || mesDe(iso) === periodo;
  const recargas = useMemo(() => comprasLista.filter(c => esRecarga(c) && enPeriodo(c.createdAt)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [comprasLista, periodo]); // eslint-disable-line react-hooks/exhaustive-deps

  const gastoDe = (a: AIAccess): Record<string, number> => periodo === 'todo' ? (a.gastoPorAccion || {}) : (a.gastoMes?.[periodo] || {});
  const sumar = (o: Record<string, number>) => Object.values(o).reduce((s, v) => s + (Number(v) || 0), 0);
  const regalosDe = (a: AIAccess) => (a.movimientos || []).filter(m => m.tipo === 'regalo' && enPeriodo(m.fecha));

  // Totales
  const porMedio = new Map<string, { n: number; creditos: number; soles: number }>();
  recargas.forEach(c => { const k = medioDe(c); const v = porMedio.get(k) || { n: 0, creditos: 0, soles: 0 }; porMedio.set(k, { n: v.n + 1, creditos: v.creditos + creditosDe(c), soles: v.soles + (Number(c.amount) || 0) }); });
  const regalos = accesos.flatMap(regalosDe);
  const porAccion = new Map<string, number>();
  accesos.forEach(a => Object.entries(gastoDe(a)).forEach(([k, v]) => porAccion.set(k, (porAccion.get(k) || 0) + (Number(v) || 0))));
  const totalGasto = [...porAccion.values()].reduce((s, v) => s + v, 0);
  const totalRecargado = recargas.reduce((s, c) => s + creditosDe(c), 0);
  const totalSoles = recargas.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const accionesOrden = [...porAccion.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxAccion = Math.max(1, ...accionesOrden.map(([, v]) => v));

  // Por usuario
  const ids = new Set<string>([...accesos.map(a => a.id), ...recargas.map(c => c.userId.replace(/^user_/, ''))]);
  const filas = [...ids].map(id => {
    const a = accesos.find(x => x.id === id);
    const rec = recargas.filter(c => c.userId.replace(/^user_/, '') === id);
    return {
      id, nombre: nombre(id), a,
      saldo: a ? (Number(a.creditosRestantes) || 0) + (Number(a.creditosExtra) || 0) : 0,
      recargado: rec.reduce((s, c) => s + creditosDe(c), 0), pagado: rec.reduce((s, c) => s + (Number(c.amount) || 0), 0),
      gastado: a ? sumar(gastoDe(a)) : 0,
      ultimo: [a?.ultimoUso, rec[0]?.createdAt].filter(Boolean).sort().pop(),
    };
  }).filter(f => (f.recargado || f.gastado || f.saldo) && (!busca.trim() || f.nombre.toLowerCase().includes(busca.toLowerCase())))
    .sort((x, y) => (y.gastado + y.recargado) - (x.gastado + x.recargado));

  const meses = [hoy, pasado];
  const Tarjeta = ({ icon: Ic, t, v, s, c }: { icon: any; t: string; v: string; s?: string; c: string }) => (
    <div className="bg-white rounded-2xl p-4 shadow-xs">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c}`}><Ic className="w-5 h-5" /></div>
      <p className="mt-2 text-xl font-black text-slate-900">{v}</p>
      <p className="text-xs font-bold text-slate-500">{t}</p>
      {s && <p className="text-[11px] text-slate-400">{s}</p>}
    </div>
  );

  const sel = verUsuario ? filas.find(f => f.id === verUsuario) || null : null;
  const regalar = async () => {
    if (!sel || !(regalo.n > 0)) return;
    try {
      await regalarCreditos(sel.id, Math.round(regalo.n), regalo.motivo.trim() || 'Regalo del administrador');
      setAviso(`Listo: ${Math.round(regalo.n)} créditos para ${sel.nombre}.`); setRegalo({ n: 20, motivo: '' }); cargar();
    } catch { setAviso('No se pudieron regalar los créditos.'); }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="titulo-pagina">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2"><Coins className="w-7 h-7 text-amber-500" />Créditos de usuarios</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Cómo recargan y en qué gastan sus créditos.</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[...meses.map(m => [m, m === hoy ? 'Este mes' : 'Mes pasado']), ['todo', 'Todo']].map(([v, t]) => (
            <button key={v} onClick={() => setPeriodo(v)} className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${periodo === v ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>{t}</button>
          ))}
          <button onClick={cargar} title="Actualizar" aria-label="Actualizar" className="p-2 rounded-xl bg-white shadow-xs cursor-pointer"><RefreshCw className={`w-4 h-4 text-slate-500 ${cargando ? 'animate-spin' : ''}`} /></button>
        </div>
      </header>
      {aviso && <p className="text-xs font-bold text-indigo-800 bg-indigo-50 rounded-xl px-3 py-2 flex justify-between gap-2">{aviso}<button onClick={() => setAviso('')} className="cursor-pointer" aria-label="Cerrar"><X className="w-4 h-4" /></button></p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tarjeta icon={Wallet} t="Créditos recargados" v={totalRecargado.toLocaleString('es-PE')} s={`${recargas.length} recarga${recargas.length === 1 ? '' : 's'}`} c="bg-emerald-50 text-emerald-600" />
        <Tarjeta icon={Coins} t="Ingresos por recargas" v={soles(totalSoles)} s={porMedio.get('google_play') ? 'Google Play figura en su consola' : undefined} c="bg-amber-50 text-amber-600" />
        <Tarjeta icon={TrendingDown} t="Créditos gastados" v={totalGasto.toLocaleString('es-PE')} s={periodo === 'todo' ? 'desde que se registra' : mesTexto(periodo)} c="bg-indigo-50 text-indigo-600" />
        <Tarjeta icon={Gift} t="Créditos regalados" v={regalos.reduce((s, m) => s + m.creditos, 0).toLocaleString('es-PE')} s={`${regalos.length} regalo${regalos.length === 1 ? '' : 's'}`} c="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <section className="bg-white rounded-2xl p-4 shadow-xs">
          <h2 className="text-sm font-black text-slate-800">¿Cómo recargan?</h2>
          <p className="text-[11px] text-slate-400 mb-2">Recargas y planes validados en el periodo.</p>
          {porMedio.size === 0 ? <p className="py-6 text-center text-xs text-slate-400">Sin recargas en este periodo.</p> : (
            <div className="divide-y divide-slate-100">
              {[...porMedio.entries()].sort((a, b) => b[1].creditos - a[1].creditos).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 py-2 text-sm">
                  <span className="font-bold text-slate-800 flex-1">{MEDIOS[k] || k}</span>
                  <span className="text-xs text-slate-500">{v.n} {v.n === 1 ? 'vez' : 'veces'}</span>
                  <span className="w-24 text-right font-black text-emerald-700">{v.creditos ? `${v.creditos} cr.` : 'plan'}</span>
                  <span className="w-24 text-right font-bold text-slate-700">{v.soles ? soles(v.soles) : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="bg-white rounded-2xl p-4 shadow-xs">
          <h2 className="text-sm font-black text-slate-800">¿En qué gastan?</h2>
          <p className="text-[11px] text-slate-400 mb-2">Créditos usados en cada función (se anota desde el 17/11/2026).</p>
          {accionesOrden.length === 0 ? <p className="py-6 text-center text-xs text-slate-400">Aún no hay gasto registrado en este periodo.</p> : (
            <div className="space-y-2">
              {accionesOrden.map(([k, v], i) => (
                <div key={k}>
                  <div className="flex justify-between text-xs"><span className="font-bold text-slate-700">{NOMBRE_ACCION[k] || k}</span><span className="font-black text-slate-800">{v} cr. · {Math.round(v * 100 / Math.max(1, totalGasto))}%</span></div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full rounded-full ${COLOR_ACCION[i % COLOR_ACCION.length]}`} style={{ width: `${(v / maxAccion) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="bg-white rounded-2xl shadow-xs">
        <div className="p-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-500" />Por usuario</h2>
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar usuario…" className="w-full pl-8 pr-2 py-2 text-xs bg-slate-50 rounded-xl outline-none" />
          </div>
        </div>
        {filas.length === 0 ? <p className="py-8 text-center text-xs text-slate-400">{cargando ? 'Cargando…' : 'Sin movimientos en este periodo.'}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="px-4 py-2">Usuario</th><th className="px-2 py-2 text-right">Saldo</th><th className="px-2 py-2 text-right">Recargó</th><th className="px-2 py-2 text-right">Gastó</th><th className="px-4 py-2 text-right hidden sm:table-cell">Último movimiento</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filas.map(f => (
                  <tr key={f.id} onClick={() => setVerUsuario(f.id)} className="hover:bg-slate-50 cursor-pointer">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{f.nombre}<span className="block text-[10px] font-normal text-slate-400">{f.a?.planId && f.a.planId !== 'gratis' ? `Plan ${f.a.planId}` : 'Plan gratis'}</span></td>
                    <td className="px-2 py-2.5 text-right font-black text-slate-900">{f.saldo}</td>
                    <td className="px-2 py-2.5 text-right font-bold text-emerald-700">{f.recargado || '—'}{f.pagado ? <span className="block text-[10px] font-normal text-slate-400">{soles(f.pagado)}</span> : null}</td>
                    <td className="px-2 py-2.5 text-right font-bold text-indigo-700">{f.gastado || '—'}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 hidden sm:table-cell">{fecha(f.ultimo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {sel && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setVerUsuario(null)}>
          <div className="bg-white w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div><h3 className="text-lg font-black text-slate-900">{sel.nombre}</h3>
                <p className="text-xs text-slate-500">Saldo: <b className="text-slate-800">{sel.saldo} créditos</b>{sel.a ? ` (${sel.a.creditosRestantes || 0} del mes + ${sel.a.creditosExtra || 0} de recargas)` : ''}</p></div>
              <button onClick={() => setVerUsuario(null)} aria-label="Cerrar" className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1">Recargas</p>
              {(() => { const rs = comprasLista.filter(c => esRecarga(c) && c.userId.replace(/^user_/, '') === sel.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                return rs.length ? <div className="divide-y divide-slate-100">{rs.map(c => (
                  <div key={c.id} className="flex items-center gap-2 py-2 text-xs"><span className="flex-1 font-bold text-slate-700">{c.itemName}</span>
                    <span className="text-slate-500">{MEDIOS[medioDe(c)]}</span><span className="w-20 text-right font-bold">{c.amount ? soles(Number(c.amount)) : '—'}</span><span className="w-24 text-right text-slate-400 whitespace-nowrap">{fecha(c.createdAt)}</span></div>
                ))}</div> : <p className="text-xs text-slate-400">Aún no recarga.</p>; })()}
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide mb-1">Últimos movimientos</p>
              {(sel.a?.movimientos || []).length ? <div className="divide-y divide-slate-100">{sel.a!.movimientos!.map(m => (
                <div key={m.id} className="flex items-center gap-2 py-2 text-xs">
                  <span className="flex-1 text-slate-700">{m.tipo === 'regalo' ? <><Gift className="w-3.5 h-3.5 inline text-rose-500 mr-1" />{m.detalle || 'Regalo'}</> : <>{NOMBRE_ACCION[m.accion || ''] || m.accion}{m.detalle ? <span className="text-slate-400"> · {m.detalle}</span> : null}</>}</span>
                  <span className={`w-14 text-right font-black ${m.tipo === 'regalo' ? 'text-emerald-700' : 'text-indigo-700'}`}>{m.tipo === 'regalo' ? '+' : '−'}{m.creditos}</span>
                  <span className="w-24 text-right text-slate-400 whitespace-nowrap">{fecha(m.fecha)}</span>
                </div>
              ))}</div> : <p className="text-xs text-slate-400">Sin movimientos anotados todavía.</p>}
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 space-y-2">
              <p className="text-xs font-black text-rose-800 flex items-center gap-1"><Gift className="w-4 h-4" />Regalar créditos</p>
              <div className="flex gap-2">
                <input type="number" min={1} value={regalo.n} onChange={e => setRegalo({ ...regalo, n: Number(e.target.value) })} className="w-20 px-2 py-2 rounded-xl text-sm font-bold bg-white outline-none" aria-label="Créditos" />
                <input value={regalo.motivo} onChange={e => setRegalo({ ...regalo, motivo: e.target.value })} placeholder="Motivo (opcional)" className="flex-1 min-w-0 px-3 py-2 rounded-xl text-sm bg-white outline-none" />
                <button onClick={regalar} className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer">Regalar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
