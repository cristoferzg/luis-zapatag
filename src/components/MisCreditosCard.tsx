// Tarjeta "Mis créditos" (usuario): saldo de las funciones inteligentes y
// acceso a planes y recargas.
import { useEffect, useState } from 'react';
import { Coins, Sparkles } from 'lucide-react';
import { getAICtx, getAIAccess, getConfigIA, saldoEfectivo, iaVisibleParaUI } from '../lib/aiAccess';
import PlanesIAModal from './PlanesIAModal';

export default function MisCreditosCard() {
  const [info, setInfo] = useState<{ plan: string; mes: number; extra: number } | null>(null);
  const [abierto, setAbierto] = useState(false);
  const ctx = getAICtx();

  useEffect(() => {
    if (!ctx.userId || ctx.isAdmin) return;
    getConfigIA().then(async c => {
      const s = saldoEfectivo(await getAIAccess(ctx.userId!), c.planes);
      setInfo({ plan: c.planes.find(p => p.id === s.planId)?.nombre || 'Gratis', mes: s.mes, extra: s.extra });
    });
  }, [ctx.userId, ctx.isAdmin, abierto]);

  if (ctx.isAdmin || !iaVisibleParaUI()) return null;
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl"><Coins className="w-6 h-6" /></div>
        <div>
          <h2 className="text-base font-black text-slate-800">Mis créditos</h2>
          <p className="text-sm text-slate-600">
            {info ? <><b className="text-slate-900">{info.mes + info.extra}</b> disponibles · Plan {info.plan}</> : 'Cargando…'}
          </p>
          <p className="text-[11px] text-slate-500">Se usan para leer boletas sin QR y planos dibujados a mano.</p>
        </div>
      </div>
      <button onClick={() => setAbierto(true)} className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-sm font-black flex items-center gap-1.5 cursor-pointer">
        <Sparkles className="w-4 h-4" />Ver planes y recargas
      </button>
      {abierto && <PlanesIAModal onClose={() => setAbierto(false)} />}
    </div>
  );
}
