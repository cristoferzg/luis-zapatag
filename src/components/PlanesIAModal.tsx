// =============================================================================
// Ventana de PLANES de las funciones inteligentes. Se abre cuando el usuario no
// tiene créditos suficientes (o desde "Mis créditos"). Muestra su saldo, los
// planes mensuales (Empresa también anual) y las recargas de créditos.
// Al solicitar se crea una compra pendiente (el admin la valida en "Validar
// Compras") y se abre WhatsApp para coordinar el pago.
// =============================================================================
import { useEffect, useState } from 'react';
import { Sparkles, X, Check, Coins, Zap, Gift } from 'lucide-react';
import {
  AIPlan, PackCreditos, COSTO_CREDITOS, getConfigIA, getAIAccess, saldoEfectivo,
  solicitarPlanIA, solicitarCreditos, getAICtx, primeraRecargaDobleActiva,
} from '../lib/aiAccess';
import { comprasIAPermitidas } from '../lib/plataforma';
import { usaGooglePlay, iniciarPagosPlay, comprarEnPlay, precioPlay, idProductoPack, idProductoPlan } from '../lib/pagosPlay';
import { safeStorage } from '../lib/storageManager';
import { pagoEnLineaDisponible, pagarEnLinea } from '../lib/pagoEnLinea';
import { registrarEmbudo } from '../lib/embudoVentas';
import { leerPagoDirecto, pagoDirectoListo, type ConfigPagoDirecto, type PedidoDirecto } from '../lib/pagoDirecto';
import VentanaPagoDirecto from './VentanaPagoDirecto';
import { precioPEN, precioConSoles } from '../lib/currency';

const WA_ADMIN = '51966000500';

const abrirWhatsApp = (msg: string) => {
  const a = document.createElement('a');
  a.href = `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(msg)}`;
  a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
};

/** Lo que cuesta cada función inteligente (en créditos). */
const COSTOS: [string, number | 'gratis'][] = [
  ['Boleta con QR', 'gratis'], ['Boleta o voucher sin QR', COSTO_CREDITOS.boleta], ['Redactar propuesta o contrato', COSTO_CREDITOS.redaccion],
  ['Diseño de melamina', COSTO_CREDITOS.melamina], ['Diseño de drywall', COSTO_CREDITOS.drywall], ['Gasfitería o electricidad', COSTO_CREDITOS.gasfiteria],
  ['Planta de obra civil', COSTO_CREDITOS.obra], ['Plano a mano de techo', COSTO_CREDITOS.croquis],
];
function TablaCostos() {
  return (
    <div>
      <p className="text-xs font-black text-slate-700 mb-1.5">¿Cuánto cuesta cada función?</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {COSTOS.map(([t, n]) => (
          <div key={t} className="rounded-xl bg-slate-50 border border-slate-200 px-2.5 py-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 leading-tight">{t}</span>
            <span className={`shrink-0 text-xs font-black ${n === 'gratis' ? 'text-emerald-600' : 'text-slate-900'}`}>{n === 'gratis' ? 'Gratis' : <span className="inline-flex items-center gap-0.5"><Coins className="w-3 h-3 text-amber-500" />{n}</span>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Saldo, planes, recargas y condiciones (se usa en la ventana y en la página Membresía). */
export function PlanesIAContenido({ motivo, sinSaldo = false, className = 'p-4 sm:p-6 space-y-4 overflow-y-auto' }: { motivo?: 'sin_plan' | 'agotado'; sinSaldo?: boolean; className?: string }) {
  const [planes, setPlanes] = useState<AIPlan[]>([]);
  const [packs, setPacks] = useState<PackCreditos[]>([]);
  const [saldo, setSaldo] = useState<{ planId: string; mes: number; extra: number } | null>(null);
  const [anual, setAnual] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const ctx = getAICtx();
  // App de Android con Google Play: se paga con Google (sin WhatsApp ni Yape).
  const play = usaGooglePlay();
  const [listoPlay, setListoPlay] = useState(false);
  const [comprando, setComprando] = useState<string | null>(null);
  const [msgPlay, setMsgPlay] = useState<{ ok: boolean; t: string } | null>(null);
  // Promoción: la primera recarga de la cuenta vale el doble.
  const [bono, setBono] = useState(false);
  const recargarSaldo = async (pl: AIPlan[]) => {
    if (!ctx.userId) return;
    const a = await getAIAccess(ctx.userId);
    setSaldo(saldoEfectivo(a, pl));
    setBono(!a?.primeraRecarga && await primeraRecargaDobleActiva());
  };
  // Condiciones de uso: se aceptan una vez antes de pedir un plan o recarga.
  const [acepto, setAcepto] = useState(() => !!safeStorage.getItem<boolean>('innova_ia_condiciones_ok', false));
  const aceptar = (v: boolean) => { setAcepto(v); safeStorage.setItem('innova_ia_condiciones_ok', v); };

  useEffect(() => { if (comprasIAPermitidas()) registrarEmbudo('abreTienda'); }, []);
  useEffect(() => {
    getConfigIA().then(async c => {
      setPlanes(c.planes); setPacks(c.packs);
      await recargarSaldo(c.planes);
      if (play && ctx.userId) setListoPlay(await iniciarPagosPlay(ctx.userId, c.packs.map(k => k.creditos), c.planes.filter(p => p.precioSoles > 0).map(p => p.id)));
    });
  }, [ctx.userId]);

  const comprarPlay = async (clave: string, productId: string, planBase?: string) => {
    setComprando(clave); setMsgPlay(null);
    const r = await comprarEnPlay(productId, planBase);
    setComprando(null);
    if (!r.cancelado) setMsgPlay({ ok: r.ok, t: r.mensaje });
    if (r.ok) { setEnviado(clave); await recargarSaldo(planes); }
  };
  // Precio: en Google Play, el que muestra Google; si no, el de la configuración.
  const precio = (soles: number, productId: string, planBase?: string) => (play && listoPlay && precioPlay(productId, planBase)) || precioPEN(soles);

  // El administrador tiene la IA ilimitada: aquí solo ve cómo lo ven los usuarios (no compra).
  const soloVista = () => { if (!ctx.isAdmin) return false; setMsgPlay({ ok: false, t: 'Vista previa: como administrador tienes la IA ilimitada, no se crea ninguna compra.' }); return true; };
  // Web y PC: pago directo con Yape/Plin (captura → el admin valida). Tiene prioridad.
  const [cfgDirecto, setCfgDirecto] = useState<ConfigPagoDirecto | null>(null);
  const [pedidoDirecto, setPedidoDirecto] = useState<(PedidoDirecto & { clave: string }) | null>(null);
  useEffect(() => { if (!play) leerPagoDirecto().then(setCfgDirecto); }, [play]);
  const directo = !play && pagoDirectoListo(cfgDirecto);
  // Web y PC con pago en línea activo: Mercado Pago (Yape, tarjeta…) y los créditos se cargan solos.
  const enLinea = !play && !directo && pagoEnLineaDisponible();
  const pagarOnline = async (clave: string, pedido: Parameters<typeof pagarEnLinea>[0]) => {
    setComprando(clave); setMsgPlay(null); registrarEmbudo('pagoEnLinea');
    try { await pagarEnLinea(pedido); }
    catch { setComprando(null); setMsgPlay({ ok: false, t: 'No se pudo abrir el pago en línea. Intenta de nuevo o pide tu recarga por WhatsApp.' }); }
  };
  const pedirPlan = async (plan: AIPlan) => {
    if (!acepto || soloVista()) return;
    const periodo = anual && plan.precioAnualSoles ? 'anual' : 'mensual';
    registrarEmbudo('eligeCompra');
    if (play) return comprarPlay(plan.id, idProductoPlan(plan.id), periodo);
    if (directo) return setPedidoDirecto({ clave: plan.id, itemId: `ai_plan_${plan.id}${periodo === 'anual' ? '__anual' : ''}`, itemName: `Plan ${plan.nombre} (${periodo})`, amount: (periodo === 'anual' ? plan.precioAnualSoles : plan.precioSoles) || 0 });
    if (enLinea) return pagarOnline(plan.id, { tipo: 'plan', planId: plan.id, periodo });
    try { if (ctx.userId) await solicitarPlanIA(ctx.userId, ctx.userName, plan, periodo); } catch { /* ignore */ }
    setEnviado(plan.id);
    const precio = periodo === 'anual' ? `${precioConSoles(plan.precioAnualSoles!)} al año` : `${precioConSoles(plan.precioSoles)} al mes`;
    abrirWhatsApp(`Hola Innova Contratistas, quiero activar el *Plan ${plan.nombre}* (${precio}, ${plan.creditosMes} créditos al mes).\n👤 Mi usuario: ${ctx.userName || ctx.userId}\nPor favor habilitarlo.`);
  };

  const pedirPack = async (p: PackCreditos) => {
    if (!acepto || soloVista()) return;
    registrarEmbudo('eligeCompra');
    if (play) return comprarPlay(p.id, idProductoPack(p.creditos));
    if (directo) return setPedidoDirecto({ clave: p.id, itemId: `ai_creditos_${p.creditos}`, itemName: `Recarga de ${p.creditos} créditos`, amount: p.precioSoles });
    if (enLinea) return pagarOnline(p.id, { tipo: 'pack', creditos: p.creditos });
    try { if (ctx.userId) await solicitarCreditos(ctx.userId, ctx.userName, p); } catch { /* ignore */ }
    setEnviado(p.id);
    abrirWhatsApp(`Hola Innova Contratistas, quiero una *recarga de ${p.creditos} créditos* (${precioConSoles(p.precioSoles)}).\n👤 Mi usuario: ${ctx.userName || ctx.userId}`);
  };

  const pagos = planes.filter(p => p.precioSoles > 0);
  const hayAnual = pagos.some(p => p.precioAnualSoles);
  const actual = planes.find(p => p.id === saldo?.planId);

  return (
        <div className={className}>
          {/* Saldo actual */}
          {saldo && !sinSaldo && (
            <div className={`rounded-2xl border p-3 flex flex-wrap items-center justify-between gap-3 ${motivo === 'agotado' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2.5">
                <Coins className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="text-sm font-black text-slate-800">{saldo.mes + saldo.extra} créditos disponibles</p>
                  <p className="text-[11px] text-slate-500">Plan {actual?.nombre || 'Gratis'} · {saldo.mes} del mes{saldo.extra ? ` + ${saldo.extra} extra (no vencen)` : ''}</p>
                </div>
              </div>
              {motivo === 'agotado' && <p className="text-xs font-bold text-amber-800">{comprasIAPermitidas() ? 'No te alcanzan para esta acción. Recarga o sube de plan 👇' : 'No te alcanzan para esta acción este mes.'}</p>}
            </div>
          )}

          {!comprasIAPermitidas() ? (
            <div className="space-y-2"><TablaCostos /><p className="text-sm text-slate-600">Los créditos de tu plan se renuevan cada mes.</p></div>
          ) : (<>
          <TablaCostos />
          <div className="flex flex-wrap items-center justify-end gap-3">
            {hayAnual && (
              <div className="inline-flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
                <button onClick={() => setAnual(false)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${!anual ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Mensual</button>
                <button onClick={() => setAnual(true)} className={`px-3 py-1.5 rounded-lg cursor-pointer ${anual ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Anual (empresas)</button>
              </div>
            )}
          </div>

          {directo && (
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-teal-50 px-3 py-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-800">
              <span>📲 Paga al instante con</span>
              {cfgDirecto?.yape?.numero && <span className="px-2.5 py-0.5 rounded-full bg-[#742284] text-white font-black">Yape</span>}
              {cfgDirecto?.plin?.numero && <span className="px-2.5 py-0.5 rounded-full bg-[#00b2a9] text-white font-black">Plin</span>}
              <span className="text-slate-600 font-semibold">· eliges, pagas y subes la captura aquí mismo</span>
            </div>
          )}
          {enLinea && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-sky-900">
              <span>💳 Paga al instante:</span>
              {['Yape', 'Tarjeta de débito o crédito', 'Transferencia', 'Pago en agente'].map(t => <span key={t} className="px-2 py-0.5 rounded-full bg-white border border-sky-200">{t}</span>)}
              <span className="text-sky-700 font-semibold">· tus créditos se cargan solos</span>
            </div>
          )}

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
                    <span className="text-3xl font-black text-slate-900">{precio(esAnual ? p.precioAnualSoles! : p.precioSoles, idProductoPlan(p.id), esAnual ? 'anual' : 'mensual')}</span>
                    <span className="text-xs text-slate-500 font-bold">{esAnual ? '/año' : '/mes'}</span>
                  </p>
                  {esAnual && <p className="text-[11px] font-bold text-emerald-700">Ahorras {precioPEN(p.precioSoles * 12 - p.precioAnualSoles!)} al año</p>}
                  <p className="text-sm font-bold text-slate-700 mt-2 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" />{p.creditosMes.toLocaleString('es-PE')} créditos al mes</p>
                  <p className="text-[11px] text-slate-500">≈ {p.creditosMes.toLocaleString('es-PE')} boletas o {Math.floor(p.creditosMes / COSTO_CREDITOS.croquis)} planos</p>
                  <ul className="text-xs text-slate-600 mt-3 space-y-1.5 flex-1">
                    {(p.beneficios || []).map(b => <li key={b} className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />{b}</li>)}
                  </ul>
                  <button disabled={deshabilitado || !acepto || comprando !== null} onClick={() => pedirPlan(p)}
                    className={`mt-4 w-full py-2.5 rounded-xl text-sm font-black cursor-pointer active:scale-95 disabled:cursor-not-allowed ${enviado === p.id ? 'bg-emerald-500 text-white' : p.destacado ? 'bg-amber-400 hover:bg-amber-300 text-amber-950' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}>
                    {comprando === p.id ? (play ? 'Abriendo Google Play…' : 'Abriendo el pago…') : enviado === p.id ? (play ? '✓ Plan activo' : directo ? '✓ En revisión' : '✓ Solicitud enviada') : saldo?.planId === p.id ? 'Renovar' : 'Elegir plan'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Recargas */}
          {packs.length > 0 && (
            <div id="recargas-ia" className="scroll-mt-24 rounded-2xl border border-slate-200 p-4">
              {bono && (
                <div className="mb-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3 flex items-center gap-2.5">
                  <Gift className="w-6 h-6 shrink-0" />
                  <div><p className="text-sm font-black leading-tight">Tu primera recarga vale el DOBLE</p><p className="text-[11px] font-semibold text-white/90">Compra cualquier recarga y recibes el doble de créditos. Solo la primera vez.</p></div>
                </div>
              )}
              <p className="text-sm font-black text-slate-800 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500" />¿Se acabaron tus créditos? Recarga sin cambiar de plan</p>
              <p className="text-[11px] text-slate-500 mb-3">Las recargas no vencen: se usan cuando se acaban los créditos del mes.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {packs.filter(k => !(play && listoPlay && !precioPlay(idProductoPack(k.creditos)))).map((k, i) => (
                  <button key={k.id} disabled={!acepto || comprando !== null} onClick={() => pedirPack(k)}
                    className={`rounded-xl border p-3 text-left cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-default ${enviado === k.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50'}`}>
                    {i === 0 && <span className="block text-[9px] font-black uppercase text-amber-700">Para probar</span>}
                    <span className="block text-lg font-black text-slate-900">{bono ? <><s className="text-slate-400 text-sm mr-1">+{k.creditos}</s><span className="text-emerald-600">+{k.creditos * 2}</span></> : `+${k.creditos}`}</span>
                    <span className="block text-[11px] text-slate-500">créditos · ≈ {Math.max(1, Math.floor((bono ? k.creditos * 2 : k.creditos) / COSTO_CREDITOS.croquis))} plano{Math.floor((bono ? k.creditos * 2 : k.creditos) / COSTO_CREDITOS.croquis) === 1 ? '' : 's'}</span>
                    <span className="block text-sm font-black text-slate-800 mt-1">{comprando === k.id ? '…' : enviado === k.id ? (play ? '✓ Sumados' : directo ? '✓ En revisión' : '✓ Enviado') : precio(k.precioSoles, idProductoPack(k.creditos))}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          </>)}

          {msgPlay && <p className={`text-xs font-bold rounded-xl p-3 ${msgPlay.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{msgPlay.t}</p>}

          {comprasIAPermitidas() && (
            <details className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 leading-snug" open={!acepto}>
              <summary className="font-black text-slate-800 cursor-pointer">Condiciones de uso de las funciones inteligentes</summary>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Las funciones inteligentes (leer boletas sin QR y planos a mano) se usan con un plan pagado o una recarga de créditos. La lectura de boletas con código QR sigue siendo gratis.</li>
                <li>Cada uso descuenta créditos según la tabla de arriba (por ejemplo boleta sin QR = {COSTO_CREDITOS.boleta}, plano a mano = {COSTO_CREDITOS.croquis}). Si la lectura falla o no detecta nada, los créditos se devuelven.</li>
                <li>Los créditos del plan se renuevan cada mes mientras el plan esté vigente y no se acumulan; las recargas no vencen.</li>
                <li>El resultado es una propuesta: revisa y corrige medidas, cantidades y montos antes de usarlos en una cotización o en obra. No reemplaza el criterio de un profesional.</li>
                <li>Sube solo fotos tuyas o de tus clientes con su permiso. Las imágenes se usan solo para leerlas y no se publican.</li>
                <li>{play ? 'El pago lo hace Google Play con tu cuenta de Google; las suscripciones se renuevan solas y las cancelas en Google Play → Pagos y suscripciones.' : directo ? 'Los pagos con Yape o Plin se revisan (monto y N° de operación) antes de cargar los créditos; una captura ya usada no se acepta. Los planes no se renuevan solos.' : enLinea ? 'El pago en línea lo procesa Mercado Pago; los planes pagados en línea no se renuevan solos.' : 'Los pagos se validan por el administrador.'} No hay devoluciones de créditos ya usados.</li>
              </ul>
              <label className="mt-2 flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" checked={acepto} onChange={e => aceptar(e.target.checked)} /> Leí y acepto las condiciones de uso
              </label>
            </details>
          )}
          {comprasIAPermitidas() && !acepto && <p className="text-[11px] font-bold text-amber-700">Acepta las condiciones de uso para pedir un plan o una recarga.</p>}

          {pedidoDirecto && cfgDirecto && (
            <VentanaPagoDirecto cfg={cfgDirecto} pedido={pedidoDirecto} onClose={() => setPedidoDirecto(null)} onEnviado={() => { setEnviado(pedidoDirecto.clave); registrarEmbudo('pagoEnLinea'); }} />
          )}
          {comprasIAPermitidas() && <p className="text-[11px] text-slate-400 leading-snug">
            {play ? 'El pago se hace con Google Play. Apenas Google lo confirma, los créditos se cargan solos.' : directo ? 'Pagas con Yape o Plin y subes la captura aquí. Apenas revisamos el pago, tus créditos se cargan solos y te llega un aviso.' : enLinea ? 'Pagas en línea con Yape, tarjeta o transferencia (Mercado Pago). Apenas se confirma el pago, los créditos se cargan solos.' : 'Al elegir se envía tu pedido al administrador por WhatsApp. Cuando valide tu pago, los créditos se cargan solos.'} Los créditos del plan se renuevan cada mes mientras esté vigente.
          </p>}
        </div>
  );
}

export default function PlanesIAModal({ onClose, motivo }: { onClose: () => void; motivo?: 'sin_plan' | 'agotado' }) {
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

        <PlanesIAContenido motivo={motivo} />
      </div>
    </div>
  );
}
