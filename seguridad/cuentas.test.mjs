// Cuentas creadas desde la app: registro, ingreso con celular + PIN, bloqueo hasta pagar,
// pago (Google Play simulado y Yape) y eliminación de la cuenta. Solo en emuladores.
// Uso: cd seguridad && npm run test:cuentas
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
if (!process.env.FIRESTORE_EMULATOR_HOST) { console.error('Solo con emuladores'); process.exit(1); }
const P = process.env.GCLOUD_PROJECT || 'innovacontratistas-434d2';
initializeApp({ projectId: P });
const db = getFirestore();

const SUF = '.prueba-0123456789';
const servidor = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  if (req.method === 'POST') return res.end('{}');
  if (decodeURIComponent(req.url).includes('membresia_unica/tokens/tokM' + SUF)) return res.end(JSON.stringify({ purchaseState: 0, acknowledgementState: 0, orderId: 'GPA.M1' }));
  res.writeHead(404); res.end('{}');
});
await new Promise(r => servidor.listen(9311, '127.0.0.1', r));

const llamar = async (fn, data, idToken) => {
  const r = await fetch(`http://127.0.0.1:5001/${P}/us-central1/${fn}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(idToken ? { authorization: `Bearer ${idToken}` } : {}) }, body: JSON.stringify({ data }) });
  const j = await r.json(); return j.error ? { error: j.error.status, msg: j.error.message } : j.result;
};
const aIdToken = async (custom) => {
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: custom, returnSecureToken: true }) });
  return (await r.json()).idToken;
};
const leerDoc = async (ruta, idToken) => (await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${P}/databases/(default)/documents/${ruta}`, { headers: { authorization: `Bearer ${idToken}` } })).status;
const limpiarIntentos = async () => { for (const c of ['login_intentos', 'registro_intentos']) { const s = await db.collection(c).get(); await Promise.all(s.docs.map(d => d.ref.delete())); } };

let ok = 0, mal = 0;
const caso = (n, c, x = '') => { if (c) { ok++; console.log('  ✔', n); } else { mal++; console.log('  ✘', n, x); } };

await limpiarIntentos();
await db.doc('usuarios/legado').set({ name: 'Usuario antiguo', pin: '482913', role: 'user', isActive: true, userId: 'admin' });
await db.doc('config_ia/membresia').set({ registroAbierto: false, precioSoles: 50 });
let r = await llamar('registrarCuenta', { nombre: 'Taller Prueba', celular: '987654321', pin: '482913' });
caso('Registro cerrado: no deja crear cuentas', /REGISTRO_CERRADO/.test(r?.msg || ''), JSON.stringify(r));
await db.doc('config_ia/membresia').set({ registroAbierto: true, precioSoles: 50 });
r = await llamar('registrarCuenta', { nombre: 'Taller Prueba', celular: '987654321', pin: '123456' });
caso('PIN fácil (123456): rechazado', /PIN_FACIL/.test(r?.msg || ''), JSON.stringify(r));
r = await llamar('registrarCuenta', { nombre: 'Taller Prueba', celular: '987654321', pin: '135790' });
caso('No deja usar el PIN del administrador', /PIN_FACIL/.test(r?.msg || ''), JSON.stringify(r));
r = await llamar('registrarCuenta', { nombre: 'Taller Prueba', celular: '987654321', pin: '482913' });
caso('Crea la cuenta (mismo PIN que un usuario antiguo)', r?.ok === true, JSON.stringify(r));
const nueva = (await db.collection('usuarios').where('celular', '==', '987654321').get()).docs[0];
const uid = nueva?.id;
caso('Queda pendiente de pago y entra con celular', nueva?.data().membresia?.estado === 'pendiente' && nueva?.data().accesoConCelular === true);
r = await llamar('registrarCuenta', { nombre: 'Otro', celular: '987654321', pin: '594826' });
caso('El mismo celular no se registra dos veces', /CELULAR_REGISTRADO/.test(r?.msg || ''), JSON.stringify(r));

r = await llamar('loginWithPin', { pin: '482913' });
caso('Solo con PIN entra el usuario antiguo (no la cuenta nueva)', r?.workspace === 'legado', JSON.stringify(r));
r = await llamar('loginWithPin', { pin: '594826', celular: '987654321' });
caso('Celular con PIN equivocado: rechazado', r?.error === 'PERMISSION_DENIED', JSON.stringify(r));
await limpiarIntentos();
r = await llamar('loginWithPin', { pin: '482913', celular: '987654321' });
caso('Celular + PIN sin pagar: sesión pendiente', r?.membresia === 'pendiente' && r.role === 'pendiente' && !r.workspace, JSON.stringify(r));
const tPend = await aIdToken(r.token);
await db.doc('projects/pNueva').set({ name: 'Obra', userId: uid });
caso('Sin pagar no puede leer sus datos', (await leerDoc('projects/pNueva', tPend)) === 403);
caso('Sin pagar sí lee el precio (config)', (await leerDoc('config_ia/membresia', tPend)) === 200);
r = await llamar('scanReceipt', { imageBase64: 'x', mimeType: 'image/png' }, tPend);
caso('Sin pagar no usa la IA', !!r?.error, JSON.stringify(r));

r = await llamar('solicitarMembresia', {}, tPend);
caso('Web: "Ya pagué" crea la compra pendiente', r?.ok === true);
r = await llamar('solicitarMembresia', {}, tPend);
caso('Web: no se duplica el aviso', r?.yaEnviada === true, JSON.stringify(r));

r = await llamar('validarCompraPlay', { productId: 'membresia_unica', purchaseToken: 'tokM' + SUF }, tPend);
caso('Google Play: activa la cuenta', r?.ok === true && (await db.doc(`usuarios/${uid}`).get()).data().membresia?.estado === 'activa', JSON.stringify(r));
r = await llamar('loginWithPin', { pin: '482913', celular: '987654321' });
caso('Después de pagar entra normal', r?.role === 'user' && r.workspace === uid, JSON.stringify(r));
const tUser = await aIdToken(r.token);
caso('Ya pagado lee sus datos', (await leerDoc('projects/pNueva', tUser)) === 200);

await db.doc('projects/pOtro').set({ name: 'Obra ajena', userId: 'legado' });
r = await llamar('eliminarMiCuenta', {}, tUser);
caso('Eliminar cuenta: borra la cuenta y sus datos', r?.ok === true && !(await db.doc(`usuarios/${uid}`).get()).exists && !(await db.doc('projects/pNueva').get()).exists, JSON.stringify(r));
caso('No toca datos de otros', (await db.doc('projects/pOtro').get()).exists && (await db.doc('usuarios/legado').get()).exists);
caso('Conserva el registro de compras', !(await db.collection('purchases').where('userId', '==', uid).get()).empty);
const tAdmin = await aIdToken(await getAuth().createCustomToken('admin', { role: 'admin', workspace: 'admin' }));
r = await llamar('eliminarMiCuenta', {}, tAdmin);
caso('La cuenta del admin no se puede borrar', r?.error === 'FAILED_PRECONDITION', JSON.stringify(r));

servidor.close();
console.log(`\nResultado: ${ok} correctas, ${mal} con problema.`);
process.exit(mal ? 1 : 0);
