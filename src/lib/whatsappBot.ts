// Asistente de WhatsApp (solo admin): pedidos por aprobar, conversaciones y ajustes.
// El servidor (functions/whatsappBot.js) responde a los clientes y deja los pedidos;
// aquí el dueño dice "sí" o "no" y el servidor crea el acceso o carga los créditos.
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from './firebase';

export interface PedidoWA {
  id: string; telefono: string; nombre: string; nombrePerfil?: string;
  tipo: 'acceso' | 'creditos'; creditos: number; montoEsperado: number; montoLeido: number | null;
  montoOk: boolean; nroOperacion: string; repetido: string; destinatario: string; destinatarioOk: boolean | null;
  metodo: string; tieneCaptura: boolean; estado: 'por_aprobar' | 'procesando' | 'aprobado' | 'rechazado';
  creado: string; atendido?: string; userId?: string; motivo?: string; enviado?: string;
}
export interface MensajeWA { id: string; de: 'cliente' | 'asistente' | 'dueno'; texto: string; fecha: string }
export interface ConversacionWA {
  id: string; telefono: string; nombrePerfil?: string; mensajes: MensajeWA[]; actualizado: string;
  ultimo?: string; ultimoDe?: string; sinLeer?: boolean; necesitaDueno?: string; pausado?: boolean; userId?: string;
  pedido?: { tipo?: string; nombre?: string; creditos?: number };
}
export interface AjustesWA {
  activo: boolean; precioAcceso: number; nombreAsistente: string; modoTransmision: boolean;
  avisarDudas: boolean; topeDia: number; notas: string;
}
export const AJUSTES_WA_DEFAULT: AjustesWA = { activo: false, precioAcceso: 50, nombreAsistente: 'Asistente de InnovApp', modoTransmision: false, avisarDudas: true, topeDia: 300, notas: '' };

const sim = () => (import.meta.env.DEV ? (window as any).__waSimulado : null) as { pedidos?: PedidoWA[]; conversaciones?: ConversacionWA[]; ajustes?: Partial<AjustesWA>; uso?: number } | null;

export function escucharPedidos(cb: (p: PedidoWA[]) => void): () => void {
  const s = sim(); if (s) { cb(s.pedidos || []); return () => {}; }
  return onSnapshot(query(collection(db, 'wa_pedidos'), orderBy('creado', 'desc'), limit(60)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))), () => cb([]));
}
export function escucharConversaciones(cb: (c: ConversacionWA[]) => void): () => void {
  const s = sim(); if (s) { cb(s.conversaciones || []); return () => {}; }
  return onSnapshot(query(collection(db, 'wa_conversaciones'), orderBy('actualizado', 'desc'), limit(50)),
    snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))), () => cb([]));
}
export async function leerCapturaWA(id: string): Promise<string | null> {
  const s = sim(); if (s) return (s as any).captura || null;
  try { return ((await getDoc(doc(db, 'wa_capturas', id))).data() as any)?.img || null; } catch { return null; }
}
export async function leerAjustesWA(): Promise<AjustesWA> {
  const s = sim(); if (s) return { ...AJUSTES_WA_DEFAULT, ...(s.ajustes || {}) };
  try { const d = await getDoc(doc(db, 'wa_config', 'ajustes')); return { ...AJUSTES_WA_DEFAULT, ...(d.data() || {}) } as AjustesWA; } catch { return AJUSTES_WA_DEFAULT; }
}
export async function guardarAjustesWA(a: Partial<AjustesWA>): Promise<void> {
  if (sim()) return;
  await setDoc(doc(db, 'wa_config', 'ajustes'), a, { merge: true });
}
/** Respuestas automáticas de hoy (para cuidar el gasto). */
export async function usoHoyWA(): Promise<number> {
  const s = sim(); if (s) return s.uso || 0;
  try { return Number((await getDoc(doc(db, 'wa_uso', new Date().toISOString().slice(0, 10)))).data()?.n) || 0; } catch { return 0; }
}
export async function marcarConversacion(id: string, cambios: Partial<Pick<ConversacionWA, 'sinLeer' | 'pausado'>> & { necesitaDueno?: any }): Promise<void> {
  if (sim()) return;
  await updateDoc(doc(db, 'wa_conversaciones', id), cambios as any);
}

export interface ResultadoAprobar { ok: boolean; pin?: string; creditos?: number; enviado?: string; error?: string }
export async function responderPedidoWA(datos: { id: string; aprobar: boolean; motivo?: string; userId?: string; nombre?: string; creditos?: number }): Promise<ResultadoAprobar> {
  if (sim()) return { ok: true, pin: '482915', enviado: 'texto' };
  try {
    const fn = httpsCallable<typeof datos, ResultadoAprobar>(getFunctions(app, 'us-central1'), 'aprobarPedidoWA');
    return (await fn(datos)).data;
  } catch (e: any) {
    const m = String(e?.message || '');
    if (m.includes('ELEGIR_USUARIO')) return { ok: false, error: 'ELEGIR_USUARIO' };
    if (m.includes('ELEGIR_RECARGA')) return { ok: false, error: 'ELEGIR_RECARGA' };
    return { ok: false, error: m || 'No se pudo completar. Revisa tu conexión.' };
  }
}

/** +51 9•• ••• 214 */
export const telefonoOculto = (t: string) => { const d = String(t || '').replace(/\D/g, ''); return d.length < 7 ? d : `+${d.slice(0, 2)} ${d.slice(2, 3)}•• ••• ${d.slice(-3)}`; };
export function haceCuanto(iso?: string): string {
  if (!iso) return '';
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'ahora'; if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60); if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
}
