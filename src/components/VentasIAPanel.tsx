// =============================================================================
// Panel del ADMIN "Para vender créditos": lista de lo que hace falta para que los
// usuarios puedan comprar (IA activada, compras en la app, Google Play, pago en
// línea), los interruptores de las promociones y el embudo de los últimos 7 días
// (dónde se pierde la gente antes de comprar).
// =============================================================================
import { useEffect, useState } from 'react';
import { TrendingUp, Check, X, CreditCard, Gift, Smartphone, Upload, Save } from 'lucide-react';
import { primeraRecargaDobleActiva, setPrimeraRecargaDoble, CREDITOS_BIENVENIDA, CREDITOS_REFERIDO } from '../lib/aiAccess';
import { pagoEnLineaDisponible, setPagoEnLinea } from '../lib/pagoEnLinea';
import { leerEmbudo, PASOS_EMBUDO, type PasoEmbudo } from '../lib/embudoVentas';
import { leerPagoDirecto, guardarPagoDirecto, pagoDirectoListo, comprimirImagen, type ConfigPagoDirecto, type CuentaPago } from '../lib/pagoDirecto';

/** Número, titular y QR de Yape o de Plin. */
function CuentaEditor({ nombre, color, c, onChange }: { nombre: string; color: string; c?: CuentaPago; onChange: (c: CuentaPago) => void }) {
  const v = c || { numero: '', titular: '' };
  const campo = 'w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-slate-400';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <p className="text-xs font-black" style={{ color }}>{nombre}</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase">Número<input value={v.numero} onChange={e => onChange({ ...v, numero: e.target.value })} placeholder="966 000 500" className={campo} /></label>
        <label className="text-[10px] font-bold text-slate-500 uppercase">A nombre de<input value={v.titular} onChange={e => onChange({ ...v, titular: e.target.value })} placeholder="Tu nombre" className={campo} /></label>
      </div>
      <div className="flex items-center gap-2">
        {v.qr ? <img src={v.qr} alt="QR" className="w-14 h-14 object-contain rounded-lg border border-slate-200" /> : <div className="w-14 h-14 rounded-lg border border-dashed border-slate-300 text-[9px] text-slate-400 flex items-center justify-center text-center">Sin QR</div>}
        <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer">
          <Upload className="w-3.5 h-3.5" />{v.qr ? 'Cambiar QR' : 'Subir QR'}
          <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) onChange({ ...v, qr: await comprimirImagen(f, 500, 0.85) }); }} />
        </label>
        {v.qr && <button onClick={() => onChange({ ...v, qr: undefined })} className="text-[11px] font-bold text-rose-600 cursor-pointer">Quitar</button>}
      </div>
    </div>
  );
}

export default function VentasIAPanel({ iaActiva, comprasEnApp, googlePlay, onError }: { iaActiva: boolean; comprasEnApp: boolean; googlePlay: boolean; onError: (e: unknown, accion: string) => void }) {
  const [enLinea, setEnLinea] = useState(pagoEnLineaDisponible());
  const [doble, setDoble] = useState(true);
  const [embudo, setEmbudo] = useState<{ dia: string; datos: Partial<Record<PasoEmbudo, number>> }[]>([]);
  const [directo, setDirecto] = useState<ConfigPagoDirecto>({ activo: false });
  const [dirGuardado, setDirGuardado] = useState(true);
  useEffect(() => { leerPagoDirecto().then(c => { if (c) setDirecto(c); }); }, []);
  const cambiarDirecto = (c: Partial<ConfigPagoDirecto>) => { setDirecto(d => ({ ...d, ...c })); setDirGuardado(false); };
  const guardarDirecto = async (c = directo) => { try { await guardarPagoDirecto(c); setDirecto(c); setDirGuardado(true); } catch (e) { onError(e, 'guardar el cobro con Yape/Plin'); } };
  useEffect(() => { primeraRecargaDobleActiva().then(setDoble); leerEmbudo(7).then(setEmbudo); setEnLinea(pagoEnLineaDisponible()); }, []);

  const checks: { ok: boolean; t: string; d: string }[] = [
    { ok: iaActiva, t: 'Funciones inteligentes activadas para usuarios', d: 'Sin esto los usuarios no ven créditos ni planes: nadie puede comprar.' },
    { ok: googlePlay, t: 'Cobro con Google Play en la app de Android', d: 'Con los productos creados y activos en Play Console (incluida la recarga creditos_20).' },
    { ok: comprasEnApp || googlePlay, t: 'Compras visibles en la app de Android', d: 'Con Google Play activo se muestran solas.' },
    { ok: pagoDirectoListo(directo) || enLinea, t: 'Cobro en la web y la PC (Yape / Plin)', d: 'El usuario paga a tu Yape o Plin y sube la captura en la app; tú validas con un toque en Compras. Sin esto, la compra va por WhatsApp.' },
  ];
  const listos = checks.filter(c => c.ok).length;
  const total = (k: PasoEmbudo) => embudo.reduce((s, d) => s + (d.datos[k] || 0), 0);
  const base = Math.max(1, total('usaIA'));

  const boton = (activo: boolean) => `shrink-0 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer ${activo ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`;
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-indigo-950 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" />Para vender créditos</p>
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${listos === checks.length ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{listos} de {checks.length} listos</span>
      </div>

      <div className="grid gap-1.5">
        {checks.map(c => (
          <div key={c.t} className="flex items-start gap-2 rounded-xl bg-white border border-slate-200 p-2.5">
            <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? 'bg-emerald-500 text-white' : 'bg-rose-100 text-rose-600'}`}>{c.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}</span>
            <div className="min-w-0"><p className="text-xs font-black text-slate-800">{c.t}</p><p className="text-[11px] text-slate-500">{c.d}</p></div>
          </div>
        ))}
      </div>

      {/* Cobro directo con Yape / Plin */}
      <div className={`rounded-2xl border p-3 space-y-2.5 ${directo.activo ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-800 flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-violet-600" />Cobro directo con Yape / Plin: {directo.activo ? <span className="text-emerald-700">ACTIVO</span> : <span className="text-slate-500">APAGADO</span>}</p>
            <p className="text-[11px] text-slate-500">Web y PC. El dinero llega directo a tu número, sin comisión. Te llega un aviso por cada captura y validas en Administración → Compras.</p>
          </div>
          <button className={boton(directo.activo)} disabled={!directo.activo && !(directo.yape?.numero || directo.plin?.numero)}
            title={!(directo.yape?.numero || directo.plin?.numero) ? 'Primero pon tu número de Yape o Plin' : ''}
            onClick={() => guardarDirecto({ ...directo, activo: !directo.activo })}>{directo.activo ? 'Apagar' : 'Activar'}</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          <CuentaEditor nombre="Yape" color="#742284" c={directo.yape} onChange={c => cambiarDirecto({ yape: c })} />
          <CuentaEditor nombre="Plin" color="#00a19a" c={directo.plin} onChange={c => cambiarDirecto({ plin: c })} />
        </div>
        {!dirGuardado && <button onClick={() => guardarDirecto()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black cursor-pointer"><Save className="w-4 h-4" />Guardar Yape / Plin</button>}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <div className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-between gap-2">
          <div className="min-w-0"><p className="text-xs font-black text-slate-800 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-sky-600" />Mercado Pago (opcional): {enLinea ? <span className="text-emerald-700">ACTIVO</span> : <span className="text-slate-500">APAGADO</span>}</p>
            <p className="text-[11px] text-slate-500">Antes: cuenta de Mercado Pago, su clave en <span className="font-mono">MP_ACCESS_TOKEN</span> y desplegar las funciones.</p></div>
          <button className={boton(enLinea)} onClick={async () => { try { await setPagoEnLinea(!enLinea); setEnLinea(!enLinea); } catch (e) { onError(e, 'cambiar el pago en línea'); } }}>{enLinea ? 'Apagar' : 'Activar'}</button>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-between gap-2">
          <div className="min-w-0"><p className="text-xs font-black text-slate-800 flex items-center gap-1.5"><Gift className="w-4 h-4 text-emerald-600" />Primera recarga doble: {doble ? <span className="text-emerald-700">ACTIVA</span> : <span className="text-slate-500">APAGADA</span>}</p>
            <p className="text-[11px] text-slate-500">La primera recarga de cada usuario le da el doble de créditos.</p></div>
          <button className={boton(doble)} onClick={async () => { try { await setPrimeraRecargaDoble(!doble); setDoble(!doble); } catch (e) { onError(e, 'cambiar la promoción'); } }}>{doble ? 'Apagar' : 'Activar'}</button>
        </div>
      </div>
      <p className="text-[11px] text-slate-600">🎁 Regalos fijos: <b>{CREDITOS_BIENVENIDA} créditos</b> de bienvenida a cada usuario nuevo y <b>{CREDITOS_REFERIDO} créditos</b> al que recomienda a un colega (lo eliges en "¿Quién lo recomendó?" al crear su acceso).</p>

      <div className="rounded-xl bg-white border border-slate-200 p-3">
        <p className="text-xs font-black text-slate-800 mb-2">Embudo de los últimos 7 días</p>
        <div className="space-y-1.5">
          {PASOS_EMBUDO.map(p => { const n = total(p.k); return (
            <div key={p.k} className="flex items-center gap-2">
              <span className="w-44 shrink-0 text-[11px] text-slate-600">{p.t}</span>
              <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (n / base) * 100)}%` }} /></div>
              <span className="w-10 text-right text-xs font-black text-slate-800">{n}</span>
            </div>
          ); })}
        </div>
        <p className="text-[10px] text-slate-500 mt-2">Si muchos "se quedan sin créditos" pero pocos "eligen una compra", el problema es el precio o la forma de pago; si pocos "intentan usar la IA", hay que mostrarla más (comunicados).</p>
      </div>
    </div>
  );
}
