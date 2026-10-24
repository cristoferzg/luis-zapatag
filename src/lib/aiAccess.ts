// =============================================================================
// Acceso a las funciones inteligentes por CRÉDITOS (monetización).
//
//  - Cada acción cuesta créditos (boleta = 1, plano a mano = 10).
//  - Cada plan trae créditos que se recargan cada mes (pago mensual, o anual
//    para Empresa). Si se acaban, el usuario compra una RECARGA de créditos
//    (no vence) o sube de plan.
//  - Todos empiezan con el plan Gratis (unos créditos al mes para probar).
//  - El ADMIN siempre es ilimitado.
//
// El DESCUENTO lo hace la Cloud Function (servidor) dentro de una transacción;
// las reglas de Firestore no dejan que el cliente escriba 'ai_access'. Aquí
// solo se LEE el saldo para mostrarlo y ofrecer planes antes de intentar.
// Nunca se muestra en la interfaz qué proveedor o modelo hay detrás.
// =============================================================================
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export const COSTO_CREDITOS = { boleta: 1, croquis: 10 } as const;
export type AccionIA = keyof typeof COSTO_CREDITOS;

export interface AIPlan {
  id: string;
  nombre: string;
  precioSoles: number;        // por mes
  precioAnualSoles?: number;  // pago anual (si el plan lo permite)
  creditosMes: number;
  usuarios?: number;          // cuentas incluidas (Empresa)
  destacado?: boolean;
  beneficios?: string[];
}

export interface PackCreditos { id: string; creditos: number; precioSoles: number }

export const PLANES_IA_DEFAULT: AIPlan[] = [
  { id: 'gratis', nombre: 'Gratis', precioSoles: 0, creditosMes: 15,
    beneficios: ['Prueba la lectura de boletas', '1 plano a mano al mes'] },
  { id: 'maestro', nombre: 'Maestro', precioSoles: 19.90, creditosMes: 200,
    beneficios: ['Registra tus gastos con una foto', 'Hasta 20 planos a mano al mes', 'Recargas cuando las necesites'] },
  { id: 'taller', nombre: 'Taller Pro', precioSoles: 49.90, creditosMes: 600, destacado: true,
    beneficios: ['Para el taller que cotiza todos los días', 'Hasta 60 planos a mano al mes', 'Atención prioritaria por WhatsApp'] },
  { id: 'empresa', nombre: 'Empresa', precioSoles: 149.90, precioAnualSoles: 1499, creditosMes: 2000, usuarios: 3,
    beneficios: ['Hasta 3 usuarios del equipo', 'Hasta 200 planos a mano al mes', 'Pago anual: 2 meses gratis'] },
];

export const PACKS_CREDITOS_DEFAULT: PackCreditos[] = [
  { id: 'p50', creditos: 50, precioSoles: 7.90 },
  { id: 'p150', creditos: 150, precioSoles: 19.90 },
  { id: 'p500', creditos: 500, precioSoles: 54.90 },
];

// Interruptor maestro (sin recompilar): campo `habilitadaUsuarios` del doc
// config_ia/planes, que el admin cambia en Configuración → Planes y créditos.
// Mientras esté apagado, la IA es SOLO para el admin y los usuarios no ven
// planes ni créditos. Encenderlo solo después de desplegar funciones y reglas
// con la clave de la API cargada.
let _habilitadaUsuarios = false;
export function iaHabilitadaUsuarios(): boolean { return _habilitadaUsuarios; }

/** Lee el interruptor de la nube. App lo llama al iniciar sesión. */
export async function cargarEstadoIA(): Promise<boolean> {
  // Solo en el servidor local de pruebas (capturas del manual); no existe en producción.
  if (import.meta.env.DEV && import.meta.env.VITE_IA_DEMO === '1') return (_habilitadaUsuarios = true);
  try {
    const s = await getDoc(doc(db, 'config_ia', 'planes'));
    _habilitadaUsuarios = s.exists() && (s.data() as any)?.habilitadaUsuarios === true;
  } catch { _habilitadaUsuarios = false; }
  return _habilitadaUsuarios;
}

/** Enciende o apaga la IA para los usuarios (solo admin). */
export async function setIAHabilitadaUsuarios(v: boolean): Promise<void> {
  await setDoc(doc(db, 'config_ia', 'planes'), { habilitadaUsuarios: v }, { merge: true });
  _habilitadaUsuarios = v;
}

/** ¿Se debe mostrar la opción en la interfaz para el usuario actual? */
export function iaVisibleParaUI(): boolean {
  return _ctx.isAdmin || _habilitadaUsuarios;
}

export interface AIAccess {
  userId: string;
  planId: string;
  periodo?: 'mensual' | 'anual';
  venceEl?: string;          // ISO; al vencer vuelve a Gratis
  creditosRestantes: number; // del mes
  creditosMesPlan?: number;  // créditos mensuales del plan al activarlo (respaldo)
  creditosExtra?: number;    // recargas compradas (no vencen)
  mes: string;               // 'YYYY-MM' del saldo vigente
  usosTotales?: number;
}

// Contexto del usuario actual (lo setea App en cada render para no pasar props).
let _ctx: { userId: string | undefined; userName: string; isAdmin: boolean } = { userId: undefined, userName: '', isAdmin: false };
export function setAICtx(userId: string | undefined, isAdmin: boolean, userName = '') { _ctx = { userId, userName, isAdmin }; }
export function getAICtx() { return _ctx; }

const mesActual = () => new Date().toISOString().slice(0, 7);

/** Config global de planes y recargas (o los de por defecto). */
export async function getConfigIA(): Promise<{ planes: AIPlan[]; packs: PackCreditos[] }> {
  try {
    const s = await getDoc(doc(db, 'config_ia', 'planes'));
    const data = s.exists() ? (s.data() as any) : null;
    const planes = Array.isArray(data?.planes) && data.planes.length && data.planes.every((p: any) => typeof p.creditosMes === 'number')
      ? data.planes as AIPlan[] : PLANES_IA_DEFAULT;
    const packs = Array.isArray(data?.packs) && data.packs.length ? data.packs as PackCreditos[] : PACKS_CREDITOS_DEFAULT;
    return { planes, packs };
  } catch { /* usar defaults */ }
  return { planes: PLANES_IA_DEFAULT, packs: PACKS_CREDITOS_DEFAULT };
}
export async function getPlanesIA(): Promise<AIPlan[]> { return (await getConfigIA()).planes; }

/** Guarda la config (solo admin; las reglas lo exigen). */
export async function setConfigIA(planes: AIPlan[], packs: PackCreditos[]): Promise<void> {
  await setDoc(doc(db, 'config_ia', 'planes'), JSON.parse(JSON.stringify({ planes, packs })), { merge: true });
}

/** Estado de créditos de un usuario (null = nunca usó: plan Gratis). */
export async function getAIAccess(userId: string): Promise<AIAccess | null> {
  try {
    const s = await getDoc(doc(db, 'ai_access', userId));
    return s.exists() ? (s.data() as AIAccess) : null;
  } catch { return null; }
}

export interface AICheck {
  ok: boolean;
  ilimitado?: boolean;
  restantes?: number;        // créditos disponibles (mes + extra)
  planId?: string;
  planNombre?: string;
  motivo?: 'sin_plan' | 'agotado' | 'no_disponible';
}

/** Saldo efectivo como lo calcula el servidor (recarga mensual / vencimiento). */
export function saldoEfectivo(a: AIAccess | null, planes: AIPlan[]): { planId: string; mes: number; extra: number } {
  const gratis = planes.find(p => p.id === 'gratis')?.creditosMes ?? 15;
  if (!a) return { planId: 'gratis', mes: gratis, extra: 0 };
  const vencido = !!a.venceEl && new Date(a.venceEl).getTime() < Date.now();
  const planId = vencido ? 'gratis' : (a.planId || 'gratis');
  const recarga = planId === 'gratis' ? gratis : (planes.find(p => p.id === planId)?.creditosMes ?? 0);
  const mes = a.mes !== mesActual() || vencido ? recarga : (a.creditosRestantes || 0);
  return { planId, mes, extra: a.creditosExtra || 0 };
}

/**
 * ¿Alcanzan los créditos para esta acción? Solo LEE: el cobro lo hace el
 * servidor. Sirve para mostrar los planes antes de subir la foto.
 */
export async function checkAIAccess(accion: AccionIA = 'boleta'): Promise<AICheck> {
  if (_ctx.isAdmin) return { ok: true, ilimitado: true, planNombre: 'Administrador' };
  if (!_habilitadaUsuarios) return { ok: false, motivo: 'no_disponible' };
  if (!_ctx.userId) return { ok: false, motivo: 'sin_plan' };
  const [a, { planes }] = await Promise.all([getAIAccess(_ctx.userId), getConfigIA()]);
  const s = saldoEfectivo(a, planes);
  const total = s.mes + s.extra;
  const planNombre = planes.find(p => p.id === s.planId)?.nombre;
  if (total >= COSTO_CREDITOS[accion]) return { ok: true, restantes: total, planId: s.planId, planNombre };
  return { ok: false, motivo: 'agotado', restantes: total, planId: s.planId, planNombre };
}

/** ¿El error que devolvió el servidor es por falta de créditos/plan? */
export function motivoErrorIA(err: any): 'agotado' | 'sin_plan' | null {
  const t = `${err?.message || ''} ${err?.details || ''}`;
  if (t.includes('SIN_CREDITOS')) return 'agotado';
  if (t.includes('SIN_PLAN')) return 'sin_plan';
  return null;
}

/** Activa (o renueva) el plan de un usuario. Lo usa el admin al validar la compra. */
export async function grantAIPlan(userId: string, planId: string, periodo: 'mensual' | 'anual' = 'mensual'): Promise<void> {
  const { planes } = await getConfigIA();
  const plan = planes.find(p => p.id === planId);
  if (!plan) return;
  const previo = await getAIAccess(userId);
  const vence = new Date();
  vence.setMonth(vence.getMonth() + (periodo === 'anual' ? 12 : 1));
  const access: AIAccess = {
    userId,
    planId: plan.id,
    periodo,
    venceEl: vence.toISOString(),
    creditosRestantes: plan.creditosMes,
    creditosMesPlan: plan.creditosMes,
    creditosExtra: previo?.creditosExtra || 0,
    mes: mesActual(),
    usosTotales: previo?.usosTotales || 0,
  };
  await setDoc(doc(db, 'ai_access', userId), access);
}

/** Suma una recarga de créditos (no vence). Lo usa el admin al validar la compra. */
export async function grantCreditos(userId: string, creditos: number): Promise<void> {
  const previo = await getAIAccess(userId);
  const base: AIAccess = previo || { userId, planId: 'gratis', creditosRestantes: 0, mes: '', creditosExtra: 0 };
  await setDoc(doc(db, 'ai_access', userId), { ...base, creditosExtra: (base.creditosExtra || 0) + creditos });
}

/** Solicitud de compra de un plan (queda pendiente para que el admin valide). */
export async function solicitarPlanIA(userId: string, userName: string, plan: AIPlan, periodo: 'mensual' | 'anual' = 'mensual'): Promise<void> {
  const precio = periodo === 'anual' ? plan.precioAnualSoles : plan.precioSoles;
  await addDoc(collection(db, 'purchases'), {
    userId,
    userName: userName || '',
    itemId: `ai_plan_${plan.id}${periodo === 'anual' ? '__anual' : ''}`,
    itemName: `Plan ${plan.nombre} (${periodo})`,
    amount: precio || 0,
    status: 'pendiente',
    voucherUrl: '',
    createdAt: new Date().toISOString(),
  });
}

/** Solicitud de compra de una recarga de créditos. */
export async function solicitarCreditos(userId: string, userName: string, pack: PackCreditos): Promise<void> {
  await addDoc(collection(db, 'purchases'), {
    userId,
    userName: userName || '',
    itemId: `ai_creditos_${pack.creditos}`,
    itemName: `Recarga de ${pack.creditos} créditos`,
    amount: pack.precioSoles,
    status: 'pendiente',
    voucherUrl: '',
    createdAt: new Date().toISOString(),
  });
}
