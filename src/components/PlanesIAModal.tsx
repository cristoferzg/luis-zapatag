// =============================================================================
// Modal de PLANES DE IA. Se muestra al usuario cuando intenta usar una función
// de IA sin plan activo (o agotado). Lista los 3 planes y permite solicitarlos.
// Al solicitar, se crea una compra pendiente (que el admin valida) y se abre
// WhatsApp para coordinar el pago.
// =============================================================================
import { useEffect, useState } from 'react';
import { Sparkles, X, Check, Zap } from 'lucide-react';
import { AIPlan, getPlanesIA, solicitarPlanIA, getAICtx } from '../lib/aiAccess';

const WA_ADMIN = '51966000500';

export default function PlanesIAModal({ onClose, motivo }: { onClose: () => void; motivo?: 'sin_plan' | 'agotado' }) {
  const [planes, setPlanes] = useState<AIPlan[]>([]);
  const [enviado, setEnviado] = useState<string | null>(null);

  useEffect(() => { getPlanesIA().then(setPlanes); }, []);

  const solicitar = async (plan: AIPlan) => {
    const ctx = getAICtx();
    try { if (ctx.userId) await solicitarPlanIA(ctx.userId, ctx.userName, plan); } catch { /* ignore */ }
    setEnviado(plan.id);
    const msg = `Hola Innova Contratistas, quiero activar el *Plan IA ${plan.nombre}* (S/ ${plan.precioSoles.toFixed(2)}/mes).\n👤 Mi usuario: ${ctx.userName || ctx.userId}\nPor favor habilitar mi acceso a la IA.`;
    const a = document.createElement('a');
    a.href = `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(msg)}`;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const colores = ['border-slate-200', 'border-amber-300 ring-1 ring-amber-200', 'border-stone-300'];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="flex items-center gap-2 text-slate-950">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-black leading-tight">Activa la IA de la plataforma</h3>
              <p className="text-[11px] font-semibold text-slate-900/80">Leer planos y escanear boletas automáticamente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {motivo === 'agotado' && (
            <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 font-semibold">
              Se te acabaron los usos de IA de este mes. Renueva o sube de plan para seguir usándola.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {planes.map((p, i) => (
              <div key={p.id} className={`rounded-2xl border ${colores[i] || 'border-slate-200'} bg-white p-3.5 flex flex-col`}>
                {i === 1 && <span className="self-start text-[9px] font-black bg-amber-500 text-slate-950 rounded-full px-2 py-0.5 mb-1">RECOMENDADO</span>}
                <h4 className="text-sm font-black text-slate-900">{p.nombre}</h4>
                <p className="mt-0.5"><span className="text-2xl font-black text-slate-900">S/ {p.precioSoles.toFixed(2)}</span><span className="text-[11px] text-slate-500 font-bold">/mes</span></p>
                <p className="text-[11px] text-slate-600 font-semibold mt-1 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {p.usosMes === 0 ? 'Usos ilimitados' : `${p.usosMes} usos al mes`}
                </p>
                <ul className="text-[10px] text-slate-500 mt-2 space-y-1 flex-1">
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Leer planos a mano</li>
                  <li className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Escanear boletas</li>
                </ul>
                <button
                  onClick={() => solicitar(p)}
                  className={`mt-3 w-full py-2 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 ${enviado === p.id ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {enviado === p.id ? '✓ Solicitud enviada' : 'Solicitar'}
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Al solicitar se envía tu pedido al administrador por WhatsApp. En cuanto valide tu pago, tu acceso a la IA se activa automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
