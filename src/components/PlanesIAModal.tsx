// =============================================================================
// Ventana de PLANES de las funciones inteligentes. Se abre cuando el usuario no
// tiene créditos suficientes (o desde "Mis créditos"). Muestra su saldo, los
// planes mensuales (Empresa también anual) y las recargas de créditos.
// Al solicitar se crea una compra pendiente (el admin la valida en "Validar
// Compras") y se abre WhatsApp para coordinar el pago.
// =============================================================================
import { useEffect, useState } from 'react';
import { Sparkles, X, Check, Coins, Zap } from 'lucide-react';
import {
  AIPlan, PackCreditos, COSTO_CREDITOS, getConfigIA, getAIAccess, saldoEfectivo,
  solicitarPlanIA, solicitarCreditos, getAICtx,
} from '../lib/aiAccess';
import { comprasPermitidas } from '../lib/plataforma';

const WA_ADMIN = '51966000500';
const S = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const abrirWhatsApp = (msg: string) => {
  const a = document.createElement('a');
  a.href = `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(msg)}`;
  a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

export default function PlanesIAModal({ onClose, motivo }: { onClose: () => void; motivo?: 'sin_plan' | 'agotado' }) {
  const [planes, setPlanes] = useState<AIPlan[]>([]);
  const [packs, setPacks] = useState<PackCreditos[]>([]);
  const [saldo, setSaldo] = useState<{ planId: string; mes: number; extra: number } | null>(null);
  const [anual, setAnual] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const ctx = getAICtx();

  useEffect(() => {
    getConfigIA().then(async c => {
      setPlanes(c.planes); setPacks(c.packs);
      if (ctx.userId) setSaldo(saldoEfectivo(await getAIAccess(ctx.userId), c.planes));
    });
  }, [ctx.userId]);

  const pedirPlan = async (plan: AIPlan) => {
    const periodo = anual && plan.precioAnualSoles ? 'anual' : 'mensual';
    try { if (ctx.userId) await solicitarPlanIA(ctx.userId, ctx.userName, plan, periodo); } catch { /* ignore */ }
    setEnviado(plan.id);
    const precio = periodo === 'anual' ? `S/ ${plan.precioAnualSoles!.toFixed(2)} al año` : `S/ ${plan.precioSoles.toFixed(2)} al mes`;
    abrirWhatsApp(`Hola Innova Contratistas, quiero activar el *Plan ${plan.nombre}* (${precio}, ${plan.creditosMes} créditos al mes).\n👤 Mi usuario: ${ctx.userName || ctx.userId}\nPor favor habilitarlo.`);
  };

  const pedirPack = async (p: PackCreditos) => {
    try { if (ctx.userId) await solicitarCreditos(ctx.userId, ctx.userName, p); } catch { /* ignore */ }
    setEnviado(p.id);
    abrirWhatsApp(`Hola Innova Contratistas, quiero una *recarga de ${p.creditos} créditos* (S/ ${p.precioSoles.toFixed(2)}).\n👤 Mi usuario: ${ctx.userName || ctx.userId}`);
  };

  const pagos = planes.filter(p => p.precioSoles > 0);
  const hayAnual = pagos.some(p => p.precioAnualSoles);
  const actual = planes.find(p => p.id === saldo?.planId);

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm sm:p-3" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-4xl max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950">
          <div className="flex items-start gap-2.5 min-w-0">
            <Sparkles className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black leading-tight">Trabaja más rápido con las funciones inteligentes</h3>
              <p className="text-xs font-semibold text-slate-900/80">Fotografía una boleta y se registra sola · Fotografía tu croquis y se dibuja el techo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 cursor-pointer shrink-0" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Saldo actual */}
          {saldo && (
            <div className={`rounded-2xl border p-3 flex flex-wrap items-center justify-between gap-3 ${motivo === 'agotado' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <Coins className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="text-sm font-black text-slate-800">{saldo.mes + saldo.extra} créditos disponibles</p>
                  <p className="text-[11px] text-slate-500">Plan {actual?.nombre || 'Gratis'} · {saldo.mes} del mes{saldo.extra ? ` + ${saldo.extra} de recargas` : ''}</p>
                </div>
              </div>
              {motivo === 'agotado' && <p className="text-xs font-bold text-amber-800">{comprasPermitidas() ? 'No te alcanzan para esta acción. Recarga o sube de plan 👇' : 'No te alcanzan para esta acción este mes.'}</p>}
            </div>
          )}

          {!comprasPermitidas() ? (
            <p className="text-sm text-slate-600 leading-relaxed">
              Boleta o captura sin QR: <b>{COSTO_CREDITOS.boleta} crédito</b> · Plano a mano: <b>{COSTO_CREDITOS.croquis} créditos</b> · Boletas con QR: <b>gratis</b>.<br />
              Los créditos de tu plan se renuevan cada mes.
            </p>
          ) : (<>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600"><b>¿Cuánto cuesta cada acción?</b> Boleta o captura sin QR: <b>{COSTO_CREDITOS.boleta} crédito</b> · Plano a mano: <b>{COSTO_CREDITOS.croquis} créditos</b> · Boletas con QR: <b>gratis</b></p>
            {hayAnual && (
              <div className="inline-flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
                <button onClick={() => setAnual(false)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${!anual ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Mensual</button>
                <button onClick={() => setAnual(true)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${anual ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Anual (empresas)</button>
              </div>
            )}
          </div>

          {/* Planes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pagos.map(p => {
              const esAnual = anual && !!p.precioAnualSoles;
              const deshabilitado = anual && !p.precioAnualSoles;
              return (
                <div key={p.id} className={`relative rounded-2xl border p-4 flex flex-col ${p.destacado ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200'} ${deshabilitado ? 'opacity-50' : ''}`}>
                  {p.destacado && <span className="absolute -top-2.5 left-4 text-[10px] font-black bg-amber-400 text-amber-950 rounded-full px-2.5 py-0.5">MÁS ELEGIDO</span>}
                  <h4 className="text-base font-black text-slate-900">{p.nombre}</h4>
                  <p className="mt-1">
                    <span className="text-3xl font-black text-slate-900">S/ {S(esAnual ? p.precioAnualSoles! : p.precioSoles)}</span>
                    <span className="text-xs text-slate-500 font-bold">{esAnual ? '/año' : '/mes'}</span>
                  </p>
                  {esAnual && <p className="text-[11px] font-bold text-emerald-700">Ahorras S/ {S(p.precioSoles * 12 - p.precioAnualSoles!)} al año</p>}
                  <p className="text-sm font-bold text-slate-700 mt-2 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" />{p.creditosMes.toLocaleString('es-PE')} créditos al mes</p>
                  <p className="text-[11px] text-slate-500">≈ {p.creditosMes.toLocaleString('es-PE')} boletas o {Math.floor(p.creditosMes / COSTO_CREDITOS.croquis)} planos</p>
                  <ul className="text-xs text-slate-600 mt-3 space-y-1.5 flex-1">
                    {(p.beneficios || []).map(b => <li key={b} className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />{b}</li>)}
                  </ul>
                  <button disabled={deshabilitado} onClick={() => pedirPlan(p)}
                    className={`mt-4 w-full py-2.5 rounded-xl text-sm font-black cursor-pointer active:scale-95 disabled:cursor-not-allowed ${enviado === p.id ? 'bg-emerald-500 text-white' : p.destacado ? 'bg-amber-400 hover:bg-amber-300 text-amber-950' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}>
                    {enviado === p.id ? '✓ Solicitud enviada' : saldo?.planId === p.id ? 'Renovar' : 'Elegir plan'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Recargas */}
          {packs.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-black text-slate-800 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500" />¿Se acabaron tus créditos? Recarga sin cambiar de plan</p>
              <p className="text-[11px] text-slate-500 mb-3">Las recargas no vencen: se usan cuando se acaban los créditos del mes.</p>
              <div className="grid grid-cols-3 gap-2">
                {packs.map(k => (
                  <button key={k.id} onClick={() => pedirPack(k)}
                    className={`rounded-xl border p-3 text-left cursor-pointer active:scale-95 ${enviado === k.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50'}`}>
                    <span className="block text-lg font-black text-slate-900">+{k.creditos}</span>
                    <span className="block text-[11px] text-slate-500">créditos</span>
                    <span className="block text-sm font-black text-slate-800 mt-1">{enviado === k.id ? '✓ Enviado' : `S/ ${k.precioSoles.toFixed(2)}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          </>)}

          {comprasPermitidas() && <p className="text-[11px] text-slate-400 leading-snug">
            Al elegir se envía tu pedido al administrador por WhatsApp. Cuando valide tu pago, los créditos se cargan solos. Los créditos del plan se renuevan cada mes mientras esté vigente.
          </p>}
        </div>
      </div>
    </div>
  );
}
