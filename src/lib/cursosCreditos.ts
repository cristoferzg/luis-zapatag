// Cursos, recursos y paquetes de la Academia que se pagan con créditos (del plan mensual o de recarga).
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { app } from './firebase';
import { getConfigIA } from './aiAccess';

// Precio en créditos = precio en soles × créditos por sol de la recarga MÁS conveniente (la de más
// créditos por sol, hoy 500 por S/ 54.90 ≈ 9.1). Así canjear cuesta lo mismo que pagar en soles.
// El servidor (canjearCurso) hace la misma cuenta con la misma config (config_ia/planes.packs).
const FACTOR_DEFAULT = 500 / 54.9;
let _factor = FACTOR_DEFAULT;
let _cargado: Promise<void> | null = null;
export function factorDePacks(packs: { creditos?: number; precioSoles?: number }[]): number {
  const r = packs.map(k => Number(k.creditos) / Number(k.precioSoles)).filter(x => Number.isFinite(x) && x > 0);
  return r.length ? Math.max(...r) : FACTOR_DEFAULT;
}
/** Lee la config de recargas una vez y avisa para que las pantallas recalculen. */
export function useFactorCreditos(): number {
  const [f, setF] = useState(_factor);
  useEffect(() => {
    if (!_cargado) _cargado = getConfigIA().then(({ packs }) => { _factor = factorDePacks(packs); }).catch(() => { _cargado = null; });
    _cargado?.then(() => setF(_factor));
  }, []);
  return f;
}
const aCreditos = (soles: number) => Math.max(1, Math.round((soles || 0) * _factor));
const vigente = (iso?: string) => !iso || new Date(iso).getTime() > Date.now();

/** Créditos de un curso: el precio puesto por el admin o su precio en soles (con descuento vigente) en créditos. */
export function creditosDeCurso(c: { precioCreditos?: number; priceSoles?: number; discountPercentage?: number; discountExpiryDate?: string }): number {
  if (c.precioCreditos && c.precioCreditos > 0) return Math.round(c.precioCreditos);
  const d = c.discountPercentage && vigente(c.discountExpiryDate) ? Math.min(100, Math.max(0, c.discountPercentage)) : 0;
  return aCreditos((c.priceSoles || 0) * (1 - d / 100));
}

/** Créditos de un recurso técnico de pago (con su descuento). */
export function creditosDeRecurso(r: { precioCreditos?: number; precioSoles?: number; discountPercentage?: number }): number {
  if (r.precioCreditos && r.precioCreditos > 0) return Math.round(r.precioCreditos);
  const d = Math.min(100, Math.max(0, r.discountPercentage || 0));
  return aCreditos((r.precioSoles || 0) * (1 - d / 100));
}

/** Créditos de un paquete de la Academia. */
export function creditosDePaquete(p: { precioCreditos?: number; precioSoles?: number }): number {
  if (p.precioCreditos && p.precioCreditos > 0) return Math.round(p.precioCreditos);
  return aCreditos(p.precioSoles || 0);
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
export const canjearPaqueteConCreditos = (paqueteId: string) => canjear({ tipo: 'paquete', paqueteId }, 'el paquete');
export const canjearRecursoConCreditos = (itemId: string) => canjear({ tipo: 'recurso', itemId }, 'el recurso');
