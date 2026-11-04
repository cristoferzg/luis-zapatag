// =============================================================================
// MEMBRESÍA: deja claro que la licencia del sistema sigue activa para siempre
// (todo lo que ya usa no se cobra) e invita a sumar las funciones Premium
// (inteligentes) con un plan. Con un plan muestra el medidor de uso del mes,
// cuándo se renueva y las recargas, al estilo de los planes de suscripción.
// =============================================================================
import { Crown, Infinity as InfinityIcon, Coins, CheckCircle2, Sparkles, ScanLine, PenTool, FileText, RefreshCw, CalendarClock, Zap } from 'lucide-react';
import { useSaldoIA } from '../lib/saldoIA';
import { COSTO_CREDITOS } from '../lib/aiAccess';
import { comprasIAPermitidas } from '../lib/plataforma';
import { PlanesIAContenido } from './PlanesIAModal';

const fecha = (iso?: string) => iso ? new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const INCLUIDO = ['Proyectos y clientes', 'Techos metálicos 2D/3D', 'Obra civil y drywall', 'Carpintería metálica', 'Presupuestos y propuestas', 'Contratos, gastos y reportes'];
const PREMIUM = [
  { I: PenTool, t: 'Foto de tu plano a mano → techo armado', d: `Columnas, vigas, correas y cobertura en segundos · ${COSTO_CREDITOS.croquis} créditos` },
  { I: ScanLine, t: 'Foto de boleta o voucher → gasto registrado', d: `Monto, RUC y detalle sin escribir · ${COSTO_CREDITOS.boleta} crédito (con QR, gratis)` },
  { I: FileText, t: 'Redacción de propuestas y contratos', d: `Carta de presentación y condiciones listas · ${COSTO_CREDITOS.redaccion} créditos` },
];

export default function MembresiaView({ isAdmin }: { isAdmin: boolean }) {
  const { saldo, recargar } = useSaldoIA(true);
  const conPlan = !!saldo && !saldo.ilimitado && saldo.planId !== 'gratis';
  const usados = saldo && saldo.delMes > 0 ? Math.max(0, saldo.delMes - saldo.mes) : 0;
  const pct = saldo && saldo.delMes > 0 ? Math.min(100, Math.round((usados / saldo.delMes) * 100)) : 0;
  const color = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">
      {/* Licencia permanente */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-7 shadow-xl overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-amber-400/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0"><InfinityIcon className="w-8 h-8 text-emerald-300" /></div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-300">Tu licencia está activa · para siempre</p>
            <h1 className="text-xl sm:text-2xl font-black leading-tight">Todo el sistema sigue siendo tuyo, sin pagos mensuales</h1>
            <p className="text-sm text-slate-300 mt-1">Lo que ya usas no se cobra ni se apaga. La membresía <b className="text-amber-300">Premium</b> es opcional: suma las funciones inteligentes que te ahorran horas de trabajo.</p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {INCLUIDO.map(t => <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />{t}</span>)}
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
          {PREMIUM.map(({ I, t, d }) => (
            <div key={t} className="rounded-2xl bg-white border border-amber-100 p-3.5 space-y-1">
              <I className="w-6 h-6 text-orange-500" />
              <p className="text-sm font-black text-slate-900 leading-snug">{t}</p>
              <p className="text-[11px] text-slate-600">{d}</p>
            </div>
          ))}
        </div>
        {!comprasIAPermitidas() && <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5"><Zap className="w-4 h-4" />Para comprar un plan o una recarga entra desde la web (navegador). En la app ves tu saldo y lo usas igual.</p>}
      </div>

      {/* Planes y recargas */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 pt-5">
          <p className="text-base font-black text-slate-900">{conPlan ? 'Renueva, sube de plan o recarga' : 'Elige tu plan Premium'}</p>
          <p className="text-xs text-slate-500">Eliges aquí y coordinas el pago con el administrador por WhatsApp; al validarlo, tus créditos se cargan solos.{isAdmin ? ' (Vista previa: como admin no se crea ninguna compra si no eliges.)' : ''}</p>
        </div>
        <PlanesIAContenido sinSaldo className="p-5 sm:p-6 space-y-4" />
      </div>
    </div>
  );
}
