// Compras con Google Play (solo en la app de Android): recargas de créditos y planes de IA.
// Google exige su propio sistema de cobro para lo digital dentro de la app de Play.
//
//   Productos en Play Console (los mismos que en Configuración → Planes y créditos):
//     creditos_<n>  → producto integrado (consumible) que suma <n> créditos
//     plan_<id>     → suscripción con planes base "mensual" y, si aplica, "anual"
//
// El pago lo hace Google; la Cloud Function `validarCompraPlay` lo confirma con Google y
// entrega los créditos o el plan (el celular nunca suma créditos por su cuenta).
// En la web y la PC no existe `CdvPurchase` y todo esto no hace nada.
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import { esAppAndroid, pagosPlayActivos } from './plataforma';

export const idProductoPack = (creditos: number) => `creditos_${creditos}`;
export const idProductoPlan = (planId: string) => `plan_${planId}`;
export type ResultadoPlay = { ok: boolean; cancelado?: boolean; pendiente?: boolean; mensaje: string };

const cdv = (): any => (window as any).CdvPurchase;
/** ¿Se compra con Google Play en este equipo? (app de Android + interruptor del admin). */
export const usaGooglePlay = () => esAppAndroid() && pagosPlayActivos() && !!cdv();

let _ws = '';
let _iniciando: Promise<boolean> | null = null;
let _esperando: ((r: ResultadoPlay) => void) | null = null;
const avisar = (r: ResultadoPlay) => { const cb = _esperando; _esperando = null; if (cb) cb(r); else window.dispatchEvent(new CustomEvent('innova_compra_play', { detail: r })); };

async function entregar(tx: any, silencioso = false) {
  const productId: string = tx?.products?.[0]?.id || '';
  const purchaseToken: string = tx?.nativePurchase?.purchaseToken || tx?.purchaseId || '';
  if (!productId || !purchaseToken) return;
  try {
    const fn = httpsCallable<{ productId: string; purchaseToken: string }, any>(getFunctions(app, 'us-central1'), 'validarCompraPlay');
    const r = (await fn({ productId, purchaseToken })).data || {};
    if (r.pendiente) { if (!silencioso) avisar({ ok: false, pendiente: true, mensaje: 'Tu pago está pendiente. Se cargará solo cuando Google lo confirme.' }); return; }
    try { await tx.finish(); } catch { /* el servidor ya la consumió o reconoció */ }
    window.dispatchEvent(new CustomEvent('innova_saldo_ia'));
    if (!silencioso || !r.yaEntregada) avisar({ ok: true, mensaje: r.tipo === 'creditos' ? `¡Listo! Se sumaron ${r.creditos} créditos.` : '¡Listo! Tu plan ya está activo.' });
  } catch {
    if (!silencioso) avisar({ ok: false, mensaje: 'No se pudo confirmar la compra. Si se cobró, se confirmará sola al volver a abrir la app.' });
  }
}

/** Prepara Google Play con los productos a la venta. Se puede llamar varias veces. */
export function iniciarPagosPlay(ws: string, creditos: number[], planes: string[]): Promise<boolean> {
  if (!usaGooglePlay() || !ws) return Promise.resolve(false);
  _ws = ws.replace(/^user_/, ''); // igual que el workspace del servidor
  if (_iniciando) return _iniciando;
  const { store, ProductType, Platform } = cdv();
  store.obfuscator = 'disabled';
  store.applicationUsername = () => _ws; // Google guarda de quién es la compra
  store.register([
    ...creditos.map(n => ({ id: idProductoPack(n), type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY })),
    ...planes.map(id => ({ id: idProductoPlan(id), type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY })),
  ]);
  store.when().approved((tx: any) => { entregar(tx); });
  const inicio: Promise<boolean> = store.initialize([Platform.GOOGLE_PLAY]).then(() => {
    // Suscripciones ya pagadas: al abrir la app se confirma la renovación (alarga la vigencia).
    for (const rc of store.localReceipts || []) for (const tx of rc.transactions || []) {
      if (String(tx?.products?.[0]?.id || '').startsWith('plan_') && tx.state === 'finished') entregar(tx, true);
    }
    return true;
  }).catch(() => { _iniciando = null; return false; });
  _iniciando = inicio;
  return inicio;
}

function oferta(productId: string, planBase?: string): any {
  const { store, Platform } = cdv() || {};
  const p = store?.get(productId, Platform?.GOOGLE_PLAY);
  if (!p) return undefined;
  return planBase ? (p.getOffer(`${productId}@${planBase}`) || p.offers?.find((o: any) => String(o.id).startsWith(`${productId}@${planBase}`))) : p.offers?.[0];
}

/** Precio que muestra Google (en la moneda del usuario), si ya cargó. */
export function precioPlay(productId: string, planBase?: string): string | undefined {
  return oferta(productId, planBase)?.pricingPhases?.[0]?.price;
}

/** Abre la ventana de pago de Google y espera a que el servidor confirme la compra. */
export async function comprarEnPlay(productId: string, planBase?: string): Promise<ResultadoPlay> {
  const o = oferta(productId, planBase);
  if (!o) return { ok: false, mensaje: 'Este producto aún no está disponible en Google Play.' };
  return new Promise<ResultadoPlay>(async resolve => {
    _esperando = resolve;
    const err = await o.order();
    if (err) {
      _esperando = null;
      const cancelado = err.code === cdv()?.ErrorCode?.PAYMENT_CANCELLED;
      resolve({ ok: false, cancelado, mensaje: cancelado ? 'Compra cancelada.' : 'Google Play no pudo iniciar la compra. Intenta de nuevo.' });
    }
  });
}
