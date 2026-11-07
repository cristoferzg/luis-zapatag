// Compras con Google Play (validarCompraPlay) contra una API de Google SIMULADA, en emuladores.
// Uso: cd seguridad && npm run test:play
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
if (!process.env.FIRESTORE_EMULATOR_HOST) { console.error('Solo con emuladores'); process.exit(1); }
const PROYECTO = process.env.GCLOUD_PROJECT || 'innovacontratistas-434d2';
initializeApp({ projectId: PROYECTO });
const db = getFirestore();

// ---- Google Play simulado ----
const dia = 24 * 3600e3;
let vence = new Date(Date.now() + 30 * dia).toISOString();
const llamadas = [];
const SUF = '.prueba-0123456789'; // los comprobantes reales son largos
const productos = {
  tokA: { purchaseState: 0, consumptionState: 0, orderId: 'GPA.1', obfuscatedExternalAccountId: 'A' },
  tokB: { purchaseState: 0, consumptionState: 0, orderId: 'GPA.3', obfuscatedExternalAccountId: 'A' },
  tokPend: { purchaseState: 2, consumptionState: 0, obfuscatedExternalAccountId: 'A' },
  tokCancel: { purchaseState: 1, consumptionState: 0, obfuscatedExternalAccountId: 'A' },
};
const servidor = http.createServer((req, res) => {
  llamadas.push(`${req.method} ${req.url}`);
  const m = req.url.match(/purchases\/(?:products\/([^/]+)|subscriptionsv2|subscriptions\/([^/]+))\/tokens\/([^/:]+)(:\w+)?$/);
  const enviar = (c, o) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (!m) return enviar(404, {});
  const [, , , tokLargo, accion] = m;
  const tok = decodeURIComponent(tokLargo).replace(SUF, '');
  if (accion) return enviar(200, {});
  if (req.url.includes('/subscriptionsv2/')) {
    if (tok !== 'tokS') return enviar(404, {});
    return enviar(200, { subscriptionState: 'SUBSCRIPTION_STATE_ACTIVE', acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING', latestOrderId: 'GPA.2',
      lineItems: [{ productId: 'plan_maestro', expiryTime: vence, offerDetails: { basePlanId: 'mensual' } }], externalAccountIdentifiers: { obfuscatedExternalAccountId: 'A' } });
  }
  return productos[tok] ? enviar(200, productos[tok]) : enviar(404, {});
});
await new Promise(r => servidor.listen(9311, '127.0.0.1', r));

// ---- Sesiones con PIN (tokens del emulador) ----
async function idToken(uid, claims) {
  const ct = await getAuth().createCustomToken(uid, claims);
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: ct, returnSecureToken: true }) });
  return (await r.json()).idToken;
}
const tA = await idToken('uidA', { role: 'usuario', workspace: 'A' });
const tB = await idToken('uidB', { role: 'usuario', workspace: 'B' });
async function validar(tok, productId, purchaseToken) {
  const r = await fetch(`http://127.0.0.1:5001/${PROYECTO}/us-central1/validarCompraPlay`, { method: 'POST', headers: { 'content-type': 'application/json', ...(tok ? { authorization: `Bearer ${tok}` } : {}) }, body: JSON.stringify({ data: { productId, purchaseToken: purchaseToken + SUF } }) });
  const j = await r.json();
  return j.error ? { error: j.error.status, msg: j.error.message } : j.result;
}
const acceso = async ws => (await db.doc(`ai_access/${ws}`).get()).data() || {};

let ok = 0, mal = 0;
const caso = (nombre, cond, extra = '') => { if (cond) { ok++; console.log('  ✔', nombre); } else { mal++; console.log('  ✘', nombre, extra); } };

await db.doc('ai_access/A').delete(); await db.doc('ai_access/B').delete();
let r = await validar(tA, 'creditos_50', 'tokA');
caso('Recarga válida: entrega 50 créditos', r?.ok && r.creditos === 50, JSON.stringify(r));
caso('Suma 50 créditos a A (5 de bienvenida + 50)', (await acceso('A')).creditosExtra === 55, JSON.stringify(await acceso('A')));
caso('Consume la compra en Google', llamadas.some(l => l.startsWith('POST') && l.includes('creditos_50/tokens/tokA' + SUF + ':consume')));
r = await validar(tA, 'creditos_50', 'tokA');
caso('Repetir el mismo comprobante no suma de nuevo', r?.yaEntregada && (await acceso('A')).creditosExtra === 55, JSON.stringify(r));
r = await validar(tB, 'creditos_50', 'tokA');
caso('Otro usuario no puede usar el comprobante de A', r?.error === 'PERMISSION_DENIED', JSON.stringify(r));
r = await validar(tB, 'creditos_50', 'tokB');
caso('Compra hecha por la cuenta A no se carga a B', r?.error === 'PERMISSION_DENIED' && !(await acceso('B')).creditosExtra, JSON.stringify(r));
r = await validar(tA, 'creditos_50', 'tokPend');
caso('Pago pendiente: no carga nada todavía', r?.pendiente === true && (await acceso('A')).creditosExtra === 55, JSON.stringify(r));
r = await validar(tA, 'creditos_50', 'tokCancel');
caso('Compra cancelada: rechazada', r?.error === 'FAILED_PRECONDITION', JSON.stringify(r));
r = await validar(tA, 'creditos_500', 'tokA');
caso('Comprobante usado con otro producto: rechazado', r?.error === 'INVALID_ARGUMENT' && (await acceso('A')).creditosExtra === 55, JSON.stringify(r));
r = await validar(tA, 'creditos_999', 'tokN');
caso('Recarga que no está a la venta: rechazada', r?.error === 'FAILED_PRECONDITION', JSON.stringify(r));
r = await validar(null, 'creditos_50', 'tokA');
caso('Sin sesión: rechazada', !!r?.error, JSON.stringify(r));
r = await validar(tA, 'plan_maestro', 'tokS');
let a = await acceso('A');
caso('Suscripción activa el plan Maestro con sus créditos', r?.ok && a.planId === 'maestro' && a.creditosRestantes === 200 && a.venceEl === vence && a.creditosExtra === 55, JSON.stringify(a));
caso('Reconoce la suscripción en Google', llamadas.some(l => l.includes('subscriptions/plan_maestro/tokens/tokS' + SUF + ':acknowledge')));
await db.doc('ai_access/A').update({ creditosRestantes: 150 });
r = await validar(tA, 'plan_maestro', 'tokS');
caso('Repetir la suscripción no recarga créditos', (await acceso('A')).creditosRestantes === 150);
vence = new Date(Date.now() + 60 * dia).toISOString();
r = await validar(tA, 'plan_maestro', 'tokS');
a = await acceso('A');
caso('Renovación: alarga la vigencia sin tocar el saldo', a.venceEl === vence && a.creditosRestantes === 150, JSON.stringify(a));
r = await validar(tB, 'plan_maestro', 'tokS');
caso('Otro usuario no puede usar la suscripción de A', r?.error === 'PERMISSION_DENIED', JSON.stringify(r));
const compras = await db.collection('purchases').where('origen', '==', 'google_play').get();
caso('Quedan registradas en Validar Compras (2)', compras.size === 2, String(compras.size));

servidor.close();
console.log(`\nResultado: ${ok} correctas, ${mal} con problema.`);
process.exit(mal ? 1 : 0);
