// =============================================================================
// Control de acceso a las funciones de IA por PLANES (monetización).
//
//  - El ADMIN siempre tiene acceso ilimitado (para probar y atender).
//  - Los usuarios activan un plan (Básico / Pro / Ilimitado) para usar la IA.
//  - Al validar la compra en "Validar Compras", se habilita el plan y se cargan
//    los usos del mes. Cada uso de IA descuenta del saldo (protege el gasto).
//
// Config de planes (precios y límites) editable por el admin en Configuración.
// Estado por usuario en la colección global 'ai_access' (doc id = userId).
// =============================================================================
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export interface AIPlan {
  id: string;
  nombre: string;
  precioSoles: number;
  usosMes: number; // 0 = ilimitado
}

export const PLANES_IA_DEFAULT: AIPlan[] = [
  { id: 'basico', nombre: 'Básico', precioSoles: 9.90, usosMes: 15 },
  { id: 'pro', nombre: 'Pro', precioSoles: 19.90, usosMes: 50 },
  { id: 'ilimitado', nombre: 'Ilimitado', precioSoles: 29.90, usosMes: 0 },
];

export interface AIAccess {
  userId: string;
  planId: string;
  usosRestantes: number; // si el plan es ilimitado, se ignora
  ilimitado?: boolean;
  mes: string; // 'YYYY-MM' del período vigente
}

// Contexto del usuario actual (lo setea App en cada render para no pasar props).
let _ctx: { userId: string | undefined; userName: string; isAdmin: boolean } = { userId: undefined, userName: '', isAdmin: false };
export function setAICtx(userId: string | undefined, isAdmin: boolean, userName = '') { _ctx = { userId, userName, isAdmin }; }
export function getAICtx() { return _ctx; }

const mesActual = () => new Date().toISOString().slice(0, 7);

/** Lee la config global de planes (o devuelve los de por defecto). */
export async function getPlanesIA(): Promise<AIPlan[]> {
  try {
    const s = await getDoc(doc(db, 'config_ia', 'planes'));
    const data = s.exists() ? (s.data() as any) : null;
    if (data?.planes && Array.isArray(data.planes) && data.planes.length) return data.planes as AIPlan[];
  } catch { /* usar defaults */ }
  return PLANES_IA_DEFAULT;
}

/** Guarda la config de planes (solo admin). */
export async function setPlanesIA(planes: AIPlan[]): Promise<void> {
  await setDoc(doc(db, 'config_ia', 'planes'), { planes });
}

/** Estado de acceso a IA de un usuario. */
export async function getAIAccess(userId: string): Promise<AIAccess | null> {
  try {
    const s = await getDoc(doc(db, 'ai_access', userId));
    return s.exists() ? (s.data() as AIAccess) : null;
  } catch { return null; }
}

export interface AICheck { ok: boolean; ilimitado?: boolean; restantes?: number; planNombre?: string; motivo?: 'sin_plan' | 'agotado'; }

/**
 * Verifica si el usuario actual puede usar la IA. Admin → ilimitado.
 * Hace reset mensual automático de los usos.
 */
export async function checkAIAccess(): Promise<AICheck> {
  if (_ctx.isAdmin) return { ok: true, ilimitado: true, planNombre: 'Administrador' };
  if (!_ctx.userId) return { ok: false, motivo: 'sin_plan' };
  const a = await getAIAccess(_ctx.userId);
  if (!a || !a.planId) return { ok: false, motivo: 'sin_plan' };
  if (a.ilimitado) return { ok: true, ilimitado: true, planNombre: a.planId };
  // Reset mensual: si cambió el mes, se recarga el límite del plan.
  if (a.mes !== mesActual()) {
    const planes = await getPlanesIA();
    const plan = planes.find(p => p.id === a.planId);
    const recarga = plan ? plan.usosMes : 0;
    const reset: AIAccess = { ...a, usosRestantes: recarga, mes: mesActual() };
    try { await setDoc(doc(db, 'ai_access', _ctx.userId), reset); } catch { /* ignore */ }
    return recarga > 0 ? { ok: true, restantes: recarga, planNombre: a.planId } : { ok: false, motivo: 'agotado' };
  }
  if (a.usosRestantes > 0) return { ok: true, restantes: a.usosRestantes, planNombre: a.planId };
  return { ok: false, motivo: 'agotado', planNombre: a.planId };
}

/** Descuenta un uso de IA tras una operación exitosa (no aplica a admin ni ilimitado). */
export async function consumeAIUse(): Promise<void> {
  if (_ctx.isAdmin || !_ctx.userId) return;
  const a = await getAIAccess(_ctx.userId);
  if (!a || a.ilimitado) return;
  const next: AIAccess = {
    ...a,
    usosRestantes: Math.max(0, (a.mes === mesActual() ? a.usosRestantes : a.usosRestantes) - 1),
    mes: mesActual(),
  };
  try { await setDoc(doc(db, 'ai_access', _ctx.userId), next); } catch { /* ignore */ }
}

/** Activa (o renueva) el plan de un usuario. Lo usa el admin al validar la compra. */
export async function grantAIPlan(userId: string, planId: string, planes?: AIPlan[]): Promise<void> {
  const list = planes || await getPlanesIA();
  const plan = list.find(p => p.id === planId);
  if (!plan) return;
  const access: AIAccess = {
    userId,
    planId: plan.id,
    ilimitado: plan.usosMes === 0,
    usosRestantes: plan.usosMes,
    mes: mesActual(),
  };
  await setDoc(doc(db, 'ai_access', userId), access);
}

/** Crea una solicitud de compra de plan (queda pendiente para que el admin valide). */
export async function solicitarPlanIA(userId: string, userName: string, plan: AIPlan): Promise<void> {
  await addDoc(collection(db, 'purchases'), {
    userId,
    userName: userName || '',
    itemId: `ai_plan_${plan.id}`,
    itemName: `Plan IA ${plan.nombre}`,
    status: 'pendiente',
    voucherUrl: '',
    createdAt: new Date().toISOString(),
  });
}
