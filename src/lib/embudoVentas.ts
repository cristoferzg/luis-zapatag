// Embudo de ventas de la IA: cuenta por día cuántas veces los usuarios usan una función
// inteligente, se quedan sin créditos, abren la tienda, eligen una compra o van a pagar
// en línea. Solo números (sin nombres ni datos personales). El admin no se cuenta.
// Datos: embudo_ventas/<AAAA-MM-DD> { usaIA, sinCreditos, abreTienda, eligeCompra, pagoEnLinea }.
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from './firebase';
import { getAICtx } from './aiAccess';

export type PasoEmbudo = 'usaIA' | 'sinCreditos' | 'abreTienda' | 'eligeCompra' | 'pagoEnLinea';
export const PASOS_EMBUDO: { k: PasoEmbudo; t: string }[] = [
  { k: 'usaIA', t: 'Intentan usar la IA' },
  { k: 'sinCreditos', t: 'Se quedan sin créditos' },
  { k: 'abreTienda', t: 'Abren la tienda' },
  { k: 'eligeCompra', t: 'Eligen un plan o recarga' },
  { k: 'pagoEnLinea', t: 'Van a pagar en línea' },
];
const dia = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export function registrarEmbudo(paso: PasoEmbudo) {
  const ctx = getAICtx();
  if (ctx.isAdmin || !ctx.userId) return;
  setDoc(doc(db, 'embudo_ventas', dia()), { [paso]: increment(1) }, { merge: true }).catch(() => { /* sin conexión: no importa */ });
}

/** Últimos N días (el más nuevo primero). Solo admin. */
export async function leerEmbudo(dias = 7): Promise<{ dia: string; datos: Partial<Record<PasoEmbudo, number>> }[]> {
  const sim = import.meta.env.DEV ? (window as any).__embudoSimulado : undefined;
  const out: { dia: string; datos: Partial<Record<PasoEmbudo, number>> }[] = [];
  for (let i = 0; i < dias; i++) {
    const d = dia(new Date(Date.now() - i * 86400000));
    if (sim) { out.push({ dia: d, datos: sim[i] || {} }); continue; }
    try { const s = await getDoc(doc(db, 'embudo_ventas', d)); out.push({ dia: d, datos: (s.data() as any) || {} }); }
    catch { out.push({ dia: d, datos: {} }); }
  }
  return out;
}
