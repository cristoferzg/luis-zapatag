import { useEffect, useState } from 'react';
// =============================================================================
// MEMBRESÍA: deja claro que la licencia del sistema sigue activa para siempre
// (todo lo que ya usa no se cobra) e invita a sumar las funciones Premium
// (inteligentes) con un plan. Con un plan muestra el medidor de uso del mes,
// cuándo se renueva y las recargas, al estilo de los planes de suscripción.
// =============================================================================
import { Crown, Infinity as InfinityIcon, Coins, Sparkles, ScanLine, PenTool, FileText, RefreshCw, CalendarClock, Zap, Gift, Share2, GraduationCap, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { useSaldoIA } from '../lib/saldoIA';
import { COSTO_CREDITOS, CREDITOS_REFERIDO, getAICtx, getAIAccess, getConfigIA, primeraRecargaDobleActiva } from '../lib/aiAccess';
import { precioPEN } from '../lib/currency';
import { enlacePlaySeguro } from '../lib/appDescargas';
import { comprasIAPermitidas } from '../lib/plataforma';
import { usaGooglePlay } from '../lib/pagosPlay';
import { PlanesIAContenido } from './PlanesIAModal';

const fecha = (iso?: string) => iso ? new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const INCLUIDO = ['Proyectos y clientes', 'Techos metálicos 2D/3D', 'Obra civil y drywall', 'Carpintería metálica', 'Presupuestos y propuestas', 'Contratos, gastos y reportes'];
const PREMIUM = [
  { I: PenTool, t: 'Foto de tu plano a mano → techo armado', d: `Columnas, vigas, correas y cobertura en segundos · ${COSTO_CREDITOS.croquis} créditos`, a: 'Te ahorra ~2 horas de dibujo' },
  { I: ScanLine, t: 'Foto de boleta o voucher → gasto registrado', d: `Monto, RUC y detalle sin escribir · ${COSTO_CREDITOS.boleta} crédito (con QR, gratis)`, a: 'Te ahorra ~5 min por boleta' },
  { I: FileText, t: 'Redacción de propuestas y contratos', d: `Carta de presentación y condiciones listas · ${COSTO_CREDITOS.redaccion} créditos`, a: 'Te ahorra ~30 min por documento' },
];

const irA = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Ejemplo visual: el plano a mano (izquierda) y el techo que arma el sistema (derecha). */
function AntesDespues() {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="rounded-2xl p-2" style={{ background: '#fffdf5' }}>
        <svg viewBox="0 0 160 110" className="w-full h-auto" aria-label="Plano dibujado a mano">
          <g fill="none" stroke="#334155" strokeWidth="1.6" strokeLinecap="round">
            <path d="M22 88 L24 40 L80 18 L136 41 L138 89" /><path d="M23 41 L137 42" />
            <path d="M24 88 L138 89" strokeDasharray="3 3" /><path d="M52 30 L52 41 M80 19 L80 42 M108 30 L108 42" />
          </g>
          <g fill="#475569" fontSize="9" fontFamily="cursive"><text x="66" y="104">10 m</text><text x="4" y="68">4 m</text><text x="96" y="14">20%</text></g>
        </svg>
        <p className="text-[10px] font-bold text-slate-500 text-center">Tu plano a mano</p>
      </div>
      <ArrowRight className="w-6 h-6 text-amber-400" />
      <div className="rounded-2xl p-2" style={{ background: 'rgba(255,255,255,.06)' }}>
        <svg viewBox="0 0 160 110" className="w-full h-auto" aria-label="Techo armado">
          <g stroke="#f59e0b" strokeWidth="2.2"><path d="M20 90 L20 44 M140 90 L140 44 M60 96 L60 52 M100 96 L100 52" /></g>
          <g fill="none" stroke="#38bdf8" strokeWidth="1.6"><path d="M20 44 L80 20 L140 44 L20 44" /><path d="M35 44 L35 38 M50 44 L50 32 M65 44 L65 26 M95 44 L95 26 M110 44 L110 32 M125 44 L125 38" /><path d="M35 38 L50 44 M50 32 L65 44 M65 26 L80 44 L95 26 M95 44 L110 32 M110 44 L125 38" /></g>
          <g stroke="#94a3b8" strokeWidth="1"><path d="M60 52 L120 28 M100 52 L160 28" opacity=".6" /><path d="M80 20 L140 0" /></g>
        </svg>
        <p className="text-[10px] font-bold text-slate-300 text-center">Techo armado en 1 minuto</p>
      </div>
    </div>
  );
}

/** Invita a un colega: comparte la app por WhatsApp (o lo que tenga el celular). */
function InvitarColega({ isAdmin }: { isAdmin: boolean }) {
  const nombre = getAICtx().userName;
  const texto = `Hola 👋 Te recomiendo InnovApp (Innova Contratistas): cotizo techos, obra civil, drywall y melamina, y con una foto de mi plano a mano me arma el techo. Descárgala aquí: ${enlacePlaySeguro()} · También funciona en la computadora: https://innovacontratistas-434d2.web.app\nCuando pidas tu acceso, di que te recomendó ${nombre || 'un colega'}.`;
  const compartir = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'InnovApp', text: texto }); return; } } catch { /* canceló: se ofrece WhatsApp */ }
    const a = document.createElement('a'); a.href = `https://wa.me/?text=${encodeURIComponent(texto)}`; a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  return (
    <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0"><Gift className="w-7 h-7" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-black text-emerald-950">Invita a un colega y gana {CREDITOS_REFERIDO} créditos</p>
        <p className="text-xs text-emerald-900/80">Compártele la app. Cuando el administrador le dé su acceso y diga que tú lo recomendaste, se te suman {CREDITOS_REFERIDO} créditos de regalo (≈ {Math.floor(CREDITOS_REFERIDO / COSTO_CREDITOS.croquis)} planos a mano). Sin límite de invitados.</p>
      </div>
      <button onClick={compartir} disabled={isAdmin} title={isAdmin ? 'Vista previa: así lo ven tus usuarios' : 'Compartir por WhatsApp'}
        className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black cursor-pointer disabled:opacity-60 disabled:cursor-default">
        <Share2 className="w-4 h-4" /> Invitar por WhatsApp
      </button>
    </div>
  );
}

/** Aviso al volver de pagar en línea (Mercado Pago). */
function AvisoPagoRetorno({ recargar }: { recargar: () => void }) {
  const [estado, setEstado] = useState<string | null>(() => { try { return sessionStorage.getItem('innova_pago_retorno'); } catch { return null; } });
  useEffect(() => {
    if (!estado) return;
    try { sessionStorage.removeItem('innova_pago_retorno'); } catch { /* nada */ }
    // El aviso de Mercado Pago llega en segundos: se vuelve a leer el saldo un par de veces.
    const t1 = setTimeout(recargar, 4000), t2 = setTimeout(recargar, 12000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!estado) return null;
  const txt = estado === 'ok' ? { c: 'bg-emerald-50 border-emerald-300 text-emerald-900', t: '✓ ¡Pago recibido! Tus créditos se cargan en unos segundos.' }
    : estado === 'pendiente' ? { c: 'bg-amber-50 border-amber-300 text-amber-900', t: '⏳ Tu pago está en proceso. Apenas se confirme, los créditos se cargan solos.' }
    : { c: 'bg-rose-50 border-rose-300 text-rose-900', t: 'No se completó el pago. Puedes intentarlo de nuevo con otro medio.' };
  return <div className={`rounded-2xl border p-4 text-sm font-bold flex items-center justify-between gap-3 ${txt.c}`}><span>{txt.t}</span><button onClick={() => setEstado(null)} className="text-xs underline cursor-pointer">Cerrar</button></div>;
}

export default function MembresiaView({ isAdmin }: { isAdmin: boolean }) {
  const { saldo, recargar } = useSaldoIA(true);
  const conPlan = !!saldo && !saldo.ilimitado && saldo.planId !== 'gratis';
  const usados = saldo && saldo.delMes > 0 ? Math.max(0, saldo.delMes - saldo.mes) : 0;
  const pct = saldo && saldo.delMes > 0 ? Math.min(100, Math.round((usados / saldo.delMes) * 100)) : 0;
  const color = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  // Oferta de entrada: la recarga más barata y si la primera vale el doble.
  const [oferta, setOferta] = useState<{ precio: number; creditos: number; doble: boolean } | null>(null);
  useEffect(() => {
    if (!comprasIAPermitidas()) return;
    const ctx = getAICtx();
    getConfigIA().then(async ({ packs }) => {
      const k = [...packs].sort((a, b) => a.precioSoles - b.precioSoles)[0];
      if (!k) return;
      const a = ctx.userId && !ctx.isAdmin ? await getAIAccess(ctx.userId) : null;
      setOferta({ precio: k.precioSoles, creditos: k.creditos, doble: !a?.primeraRecarga && await primeraRecargaDobleActiva() });
    });
  }, []);
  // Botón fijo abajo (celular) mientras las recargas no están en pantalla.
  const [verBarra, setVerBarra] = useState(true);
  useEffect(() => {
    const el = document.getElementById('recargas-ia') || document.getElementById('planes-ia');
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVerBarra(!e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [oferta]);
  const irAcademia = () => { try { localStorage.setItem('academia_pestana', 'tienda'); } catch { /* nada */ } window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'usabilidad' })); };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-28 xl:pb-10">
      <AvisoPagoRetorno recargar={recargar} />
      {/* Oferta: lo primero que se ve */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 15% 15%, #6366f1 0, transparent 40%), radial-gradient(circle at 90% 80%, #f59e0b 0, transparent 35%)' }} />
        <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-5 items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5"><Sparkles className="w-4 h-4" />Funciones inteligentes</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black leading-tight" style={{ color: '#fff' }}>Saca la foto de tu plano y el techo se arma solo</h1>
            <p className="mt-2 text-sm" style={{ color: '#cbd5e1' }}>Columnas, tijerales, correas, materiales y presupuesto en un minuto. También registra tus boletas con una foto y te redacta propuestas y contratos.</p>
            {comprasIAPermitidas() && oferta && (
              <div className="mt-4 rounded-2xl p-3.5 ring-1 ring-amber-300/40" style={{ background: 'rgba(251,191,36,.12)' }}>
                {oferta.doble
                  ? <p className="text-sm font-black" style={{ color: '#fde68a' }}><Gift className="inline w-4 h-4 mr-1 -mt-0.5" />Tu primera recarga vale el DOBLE: <span style={{ color: '#fff' }}>{oferta.creditos * 2} créditos por {precioPEN(oferta.precio)}</span></p>
                  : <p className="text-sm font-black" style={{ color: '#fde68a' }}>Pruébalo desde <span style={{ color: '#fff' }}>{precioPEN(oferta.precio)}</span> · {oferta.creditos} créditos</p>}
                <p className="text-[11px] mt-0.5" style={{ color: '#cbd5e1' }}>Pago único, sin suscripción. Los créditos no vencen.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => irA('recargas-ia')} className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black cursor-pointer">Recargar ahora</button>
                  <button onClick={() => irA('planes-ia')} className="px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer ring-1 ring-white/25" style={{ color: '#fff', background: 'rgba(255,255,255,.08)' }}>Ver planes</button>
                </div>
              </div>
            )}
          </div>
          <AntesDespues />
        </div>
      </div>

      {/* Medidor de uso (tipo plan de suscripción) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${conPlan || saldo?.ilimitado ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}><Crown className="w-6 h-6" /></div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Tu membresía</p>
              <p className="text-lg font-black text-slate-900 leading-tight">{saldo ? (saldo.ilimitado ? 'Administrador · ilimitado' : conPlan ? `Premium ${saldo.planNombre}` : 'Plan Gratis') : 'Cargando…'}</p>
              {conPlan && saldo?.venceEl && <p className="text-[11px] text-slate-500">{saldo.periodo === 'anual' ? 'Pago anual' : 'Pago mensual'} · vigente hasta el {fecha(saldo.venceEl)}</p>}
            </div>
          </div>
          <button onClick={recargar} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /> Actualizar</button>
        </div>

        {saldo && !saldo.ilimitado && (<>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-500">Créditos disponibles</p>
                  <p className="text-4xl font-black text-slate-900 leading-none flex items-center gap-2"><Coins className="w-8 h-8 text-amber-500" />{saldo.total.toLocaleString('es-PE')}</p>
                </div>
                {saldo.delMes > 0 && <p className="text-xs font-bold text-slate-500 text-right">{usados.toLocaleString('es-PE')} de {saldo.delMes.toLocaleString('es-PE')} usados este mes</p>}
              </div>
              {saldo.delMes > 0 ? (<>
                <div className="h-3 rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" />{pct}% del mes usado · se renueva a {saldo.delMes.toLocaleString('es-PE')} el {fecha(saldo.renuevaEl)}</p>
              </>) : (
                <p className="text-[11px] text-slate-500">El plan Gratis no trae créditos cada mes{saldo.extra ? ': tienes créditos extra que no vencen.' : '.'} Con Premium recibes créditos nuevos cada mes.</p>
              )}
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-[11px] font-black uppercase text-amber-700">Extra (no vencen)</p>
              <p className="text-3xl font-black text-amber-900 leading-tight">{saldo.extra.toLocaleString('es-PE')}</p>
              <p className="text-[11px] text-amber-800">Recargas y regalos. Se usan cuando se acaban los del mes.</p>
              <p className="text-[11px] text-slate-500 mt-2">Usos totales de la IA: <b>{saldo.usosTotales}</b></p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['planos', Math.floor(saldo.total / COSTO_CREDITOS.croquis)], ['boletas', Math.floor(saldo.total / COSTO_CREDITOS.boleta)], ['redacciones', Math.floor(saldo.total / COSTO_CREDITOS.redaccion)]].map(([k, v]) => (
              <div key={k as string} className="rounded-xl border border-slate-200 p-2.5"><p className="text-xl font-black text-slate-900">{(v as number).toLocaleString('es-PE')}</p><p className="text-[10px] font-bold text-slate-500 uppercase">{k} que te alcanzan</p></div>
            ))}
          </div>
        </>)}
        {saldo?.ilimitado && <p className="text-xs text-slate-600">Como administrador usas las funciones inteligentes sin límite. Abajo ves la página tal como la ven tus usuarios para comprar.</p>}
      </div>

      {/* Qué trae Premium */}
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 sm:p-6 space-y-3">
        <p className="text-sm font-black text-amber-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" />Premium: deja que el sistema trabaje por ti</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PREMIUM.map(({ I, t, d, a }) => (
            <div key={t} className="rounded-2xl bg-white border border-amber-100 p-3.5 space-y-1">
              <I className="w-6 h-6 text-orange-500" />
              <p className="text-sm font-black text-slate-900 leading-snug">{t}</p>
              <p className="text-[11px] text-slate-600">{d}</p>
              <p className="text-[11px] font-black text-emerald-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a}</p>
            </div>
          ))}
        </div>
        {/* En la app de Google Play no se puede mandar a pagar fuera de Play (ni mencionarlo). */}
        {!comprasIAPermitidas() && <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5"><Zap className="w-4 h-4" />Tu saldo se ve y se usa igual en el celular y en la computadora.</p>}
      </div>

      {/* Planes y recargas */}
      <div id="planes-ia" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 pt-5">
          <p className="text-base font-black text-slate-900">{!comprasIAPermitidas() ? 'Cuánto cuesta cada función' : conPlan ? 'Renueva, sube de plan o recarga' : 'Recargas y planes'}</p>
          {comprasIAPermitidas() && <p className="text-xs text-slate-500">{usaGooglePlay() ? 'Pagas con Google Play y tus créditos se cargan solos.' : 'Eliges y pagas aquí mismo; al validarse el pago, tus créditos se cargan solos y te llega un aviso.'}{isAdmin ? ' (Vista previa: como administrador no compras; tu IA es ilimitada.)' : ''}</p>}
        </div>
        <PlanesIAContenido sinSaldo className="p-5 sm:p-6 space-y-4" />
      </div>

      {/* Academia técnica: cursos y paquetes */}
      <button onClick={irAcademia} className="w-full text-left rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:brightness-110">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,.15)' }}><GraduationCap className="w-7 h-7" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-black" style={{ color: '#fff' }}>Aprende el oficio en la Academia técnica</p>
          <p className="text-xs" style={{ color: '#e0e7ff' }}>Cursos en video de estructuras, techos y carpintería, con plantillas listas. Paquetes con descuento y acceso para siempre.</p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-indigo-700 text-sm font-black">Ver cursos <ArrowRight className="w-4 h-4" /></span>
      </button>

      {/* Referidos */}
      <InvitarColega isAdmin={isAdmin} />

      {/* Licencia permanente (tranquilidad, al final) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><InfinityIcon className="w-6 h-6" /></div>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" />Tu licencia del sistema es para siempre</p>
          <p className="text-xs text-slate-500">{INCLUIDO.join(' · ')}: siguen funcionando sin pagos mensuales. Los créditos solo se usan en las funciones inteligentes.</p>
        </div>
      </div>

      {/* Celular: botón fijo para recargar mientras baja por la página */}
      {comprasIAPermitidas() && oferta && verBarra && (
        <div className="xl:hidden fixed left-3 right-3 z-30" style={{ bottom: 'calc(76px + env(safe-area-inset-bottom))' }}>
          <button onClick={() => irA('recargas-ia')} className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-400 text-slate-950 shadow-xl cursor-pointer">
            <span className="text-sm font-black text-left leading-tight">{oferta.doble ? `${oferta.creditos * 2} créditos por ${precioPEN(oferta.precio)}` : `Recarga desde ${precioPEN(oferta.precio)}`}<span className="block text-[11px] font-bold opacity-80">{oferta.doble ? 'Tu primera recarga vale el doble' : 'Pago único · no vencen'}</span></span>
            <span className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-black">Recargar</span>
          </button>
        </div>
      )}
    </div>
  );
}
