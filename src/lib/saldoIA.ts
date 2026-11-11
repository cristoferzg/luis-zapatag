// =============================================================================
// Saldo de créditos del usuario para mostrarlo en la cabecera y en Membresía
// (como el medidor de uso de un plan: cuánto se usó del mes y cuándo se renueva).
// Se vuelve a leer al volver a la app y cada vez que la IA avisa que se usó
// (evento 'innova_saldo_ia').
// =============================================================================
import { useCallback, useEffect, useState } from 'react';
import { getAICtx, getAIAccess, getConfigIA, saldoEfectivo, AIAccess } from './aiAccess';

export interface SaldoIA {
  planId: string;
  planNombre: string;
  mes: number;          // créditos del mes que quedan
  delMes: number;       // créditos que trae el plan cada mes
  extra: number;        // recargas y regalos (no vencen)
  total: number;
  usosTotales: number;
  periodo?: 'mensual' | 'anual';
  venceEl?: string;     // fin del plan pagado
  renuevaEl: string;    // próxima recarga mensual (1.º del mes siguiente)
  ilimitado: boolean;   // administrador
}

/** Avisar a la cabecera y a Membresía que el saldo cambió (después de usar la IA). */
export const avisarSaldoIA = () => { try { window.dispatchEvent(new CustomEvent('innova_saldo_ia')); } catch { /* sin ventana */ } };

const proximoMes = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString(); };

export function useSaldoIA(activo = true): { saldo: SaldoIA | null; recargar: () => void } {
  const [saldo, setSaldo] = useState<SaldoIA | null>(null);
  const recargar = useCallback(() => {
    const ctx = getAICtx();
    if (!activo || !ctx.userId) { setSaldo(null); return; }
    if (ctx.isAdmin) {
      setSaldo({ planId: 'admin', planNombre: 'Administrador', mes: 0, delMes: 0, extra: 0, total: Infinity, usosTotales: 0, renuevaEl: proximoMes(), ilimitado: true });
      return;
    }
    getConfigIA().then(async ({ planes }) => {
      const a: AIAccess | null = await getAIAccess(ctx.userId!);
      const s = saldoEfectivo(a, planes);
      const plan = planes.find(p => p.id === s.planId);
      setSaldo({
        planId: s.planId, planNombre: plan?.nombre || 'Gratis',
        mes: s.mes, delMes: plan?.creditosMes ?? a?.creditosMesPlan ?? 0, extra: s.extra, total: s.mes + s.extra,
        usosTotales: a?.usosTotales || 0, periodo: a?.periodo, venceEl: s.planId !== 'gratis' ? a?.venceEl : undefined,
        renuevaEl: proximoMes(), ilimitado: false,
      });
    }).catch(() => { /* sin conexión: se deja lo último */ });
  }, [activo]);

  useEffect(() => {
    recargar();
    const h = () => recargar();
    window.addEventListener('innova_saldo_ia', h);
    window.addEventListener('focus', h);
    return () => { window.removeEventListener('innova_saldo_ia', h); window.removeEventListener('focus', h); };
  }, [recargar]);
  return { saldo, recargar };
}
