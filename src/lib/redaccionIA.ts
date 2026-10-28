// Redacción con IA (2 créditos): carta de presentación de la propuesta o las
// especificaciones y condiciones del contrato, a partir de los datos de la obra.
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import { motivoErrorIA, COSTO_CREDITOS } from './aiAccess';

export async function redactarConIA(tipo: 'propuesta' | 'contrato', datos: Record<string, unknown>): Promise<string> {
  const sim = import.meta.env.DEV ? (window as any).__redaccionSimulada as string | undefined : undefined;
  if (sim) return sim;
  try {
    const fn = httpsCallable<{ tipo: string; datos: Record<string, unknown> }, { texto: string }>(getFunctions(app, 'us-central1'), 'redactarDocumento', { timeout: 120000 });
    const { data } = await fn({ tipo, datos });
    return data?.texto || '';
  } catch (e: any) {
    const m = motivoErrorIA(e);
    if (m === 'agotado') throw new Error(`Te faltan créditos: redactar cuesta ${COSTO_CREDITOS.redaccion}. Recarga en "Mis créditos".`);
    if (m === 'sin_plan') throw new Error('Las funciones inteligentes requieren un plan.');
    throw new Error(e?.message || 'No se pudo redactar. Intenta de nuevo.');
  }
}
