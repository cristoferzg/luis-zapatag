// Cursos de Academia que se pagan con créditos (del plan mensual o de recarga).
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

/** Créditos de un curso: el precio puesto por el admin o 10 créditos por cada sol. */
export function creditosDeCurso(c: { precioCreditos?: number; priceSoles?: number }): number {
  if (c.precioCreditos && c.precioCreditos > 0) return Math.round(c.precioCreditos);
  return Math.max(1, Math.round((c.priceSoles || 0) * 10));
}

/** Créditos de un recurso técnico de pago: 10 créditos por cada sol (con su descuento). */
export function creditosDeRecurso(r: { precioCreditos?: number; precioSoles?: number; discountPercentage?: number }): number {
  if (r.precioCreditos && r.precioCreditos > 0) return Math.round(r.precioCreditos);
  const d = Math.min(100, Math.max(0, r.discountPercentage || 0));
  return Math.max(1, Math.round((r.precioSoles || 0) * (1 - d / 100) * 10));
}

async function canjear(data: Record<string, string>, que: string): Promise<{ ok: boolean; creditos: number; error?: string }> {
  try {
    const fn = httpsCallable<Record<string, string>, { ok: boolean; creditos: number }>(getFunctions(app, 'us-central1'), 'canjearCurso');
    const r = await fn(data);
    return r.data;
  } catch (e: any) {
    const m = String(e?.message || '');
    if (m.includes('SIN_CREDITOS')) return { ok: false, creditos: 0, error: 'No te alcanzan los créditos. Recarga en Membresía Premium y vuelve a intentarlo.' };
    if (m.includes('CONFIRMA_PIN')) return { ok: false, creditos: 0, error: 'Confirma tu PIN y vuelve a intentarlo.' };
    return { ok: false, creditos: 0, error: m || `No se pudo desbloquear ${que}.` };
  }
}

export const canjearCursoConCreditos = (cursoId: string) => canjear({ cursoId }, 'el curso');
export const canjearRecursoConCreditos = (itemId: string) => canjear({ tipo: 'recurso', itemId }, 'el recurso');
