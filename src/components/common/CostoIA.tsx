// Pastilla con el costo en créditos de una acción de IA, para ponerla en el botón que la abre
// (así el usuario sabe cuánto cuesta antes de entrar). El admin no paga: no se muestra.
import { Coins } from 'lucide-react';
import { COSTO_CREDITOS, getAICtx, type AccionIA } from '../../lib/aiAccess';

export default function CostoIA({ accion, oculto, className = '' }: { accion: AccionIA; oculto?: boolean; className?: string }) {
  if (oculto || getAICtx().isAdmin) return null;
  const n = COSTO_CREDITOS[accion];
  return (
    <span title={`Cuesta ${n} crédito${n === 1 ? '' : 's'}`}
      className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded-full bg-white/25 text-[10px] font-black leading-none ${className}`}>
      <Coins className="w-3 h-3" />{n}
    </span>
  );
}
