// Canje con créditos (canjearCurso): curso, recurso y PAQUETE de la Academia, en emuladores.
// Uso: cd seguridad && npm run test:canje
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
if (!process.env.FIRESTORE_EMULATOR_HOST) { console.error('Solo con emuladores'); process.exit(1); }
const PROYECTO = process.env.GCLOUD_PROJECT || 'innovacontratistas-434d2';
initializeApp({ projectId: PROYECTO });
const db = getFirestore();

async function idToken(uid, claims) {
  const ct = await getAuth().createCustomToken(uid, claims);
  const r = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: ct, returnSecureToken: true }) });
  return (await r.json()).idToken;
}
const tA = await idToken('uidA', { role: 'usuario', workspace: 'A' });
async function canjear(tok, data) {
  const r = await fetch(`http://127.0.0.1:5001/${PROYECTO}/us-central1/canjearCurso`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${tok}` }, body: JSON.stringify({ data }) });
  const j = await r.json();
  return j.error ? { error: j.error.status, msg: j.error.message } : j.result;
}
const saldo = async () => { const a = (await db.doc('ai_access/A').get()).data() || {}; return (a.creditosRestantes || 0) + (a.creditosExtra || 0); };
const tiene = async (col, id) => ((await db.doc(`${col}/${id}`).get()).data()?.allowedUserIds || []).includes('A');

let ok = 0, mal = 0;
const caso = (nombre, cond, extra = '') => { if (cond) { ok++; console.log('  ✔', nombre); } else { mal++; console.log('  ✘', nombre, extra); } };
const mes = new Date().toISOString().slice(0, 7);
// el servidor calcula el mes en Lima; se ponen ambos datos para no depender de la hora
await db.doc('ai_access/A').set({ userId: 'A', planId: 'gratis', creditosRestantes: 0, creditosExtra: 300, mes: 'x' });
// La mejor recarga da 10 créditos por sol (100 por S/ 10); la otra rinde menos y no cuenta.
await db.doc('config_ia/planes').set({ packs: [{ id: 'a', creditos: 20, precioSoles: 4 }, { id: 'b', creditos: 100, precioSoles: 10 }] }, { merge: true });
await db.doc('cursos/c1').set({ name: 'Curso 1', isFree: false, priceSoles: 10, allowedUserIds: [] });
await db.doc('cursos/c2').set({ name: 'Curso 2', isFree: false, priceSoles: 20, allowedUserIds: [] });
await db.doc('biblioteca/r1').set({ titulo: 'Plantilla', isFree: false, precioSoles: 5, allowedUserIds: [] });
await db.doc('config_academia/paquetes').set({ lista: [
  { id: 'p1', nombre: 'Pack', cursos: ['c1', 'c2'], recursos: ['r1'], precioSoles: 25, activo: true },
  { id: 'oculto', nombre: 'Oculto', cursos: ['c1'], recursos: [], precioSoles: 1, activo: false },
  { id: 'caro', nombre: 'Caro', cursos: ['c2'], recursos: [], precioSoles: 999, activo: true },
] });

let r = await canjear(tA, { tipo: 'paquete', paqueteId: 'oculto' });
caso('paquete oculto → no existe', r.error === 'NOT_FOUND', JSON.stringify(r));
const antes = await saldo();
r = await canjear(tA, { tipo: 'paquete', paqueteId: 'caro' });
caso('sin créditos suficientes → SIN_CREDITOS', r.error === 'RESOURCE_EXHAUSTED' && /SIN_CREDITOS/.test(r.msg), JSON.stringify(r));
caso('…y no habilita nada', !(await tiene('cursos', 'c2')));
r = await canjear(tA, { tipo: 'paquete', paqueteId: 'paq_p1' });
const despues = await saldo();
caso('canje del paquete: 250 créditos', r.ok && r.creditos === 250, JSON.stringify(r));
caso('descuenta exactamente 250 créditos', antes - despues === 250, `${antes} → ${despues}`);
caso('habilita sus 2 cursos y la plantilla', (await tiene('cursos', 'c1')) && (await tiene('cursos', 'c2')) && (await tiene('biblioteca', 'r1')));
caso('registra paquetesCanjeados', ((await db.doc('ai_access/A').get()).data()?.paquetesCanjeados || []).some(x => x.paqueteId === 'p1'));
{ const ac = (await db.doc('ai_access/A').get()).data() || {}; const mes = new Date().toISOString().slice(0, 7);
  caso('anota el gasto por función (paquete: 250)', ac.gastoPorAccion?.paquete === 250, JSON.stringify(ac.gastoPorAccion));
  caso('anota el gasto del mes', ac.gastoMes?.[mes]?.paquete === 250, JSON.stringify(ac.gastoMes));
  caso('anota el movimiento con el nombre del paquete', ac.movimientos?.[0]?.tipo === 'uso' && ac.movimientos[0].accion === 'paquete' && ac.movimientos[0].creditos === 250 && !!ac.movimientos[0].detalle, JSON.stringify(ac.movimientos?.[0])); }
r = await canjear(tA, { tipo: 'paquete', paqueteId: 'p1' });
caso('volver a canjear no cobra (ya lo tiene)', r.ok && r.yaTenia && r.creditos === 0, JSON.stringify(r));
await db.doc('cursos/c3').set({ name: 'Curso 3', isFree: false, priceSoles: 3, allowedUserIds: [] });
r = await canjear(tA, { cursoId: 'c3' });
caso('canje de un curso suelto sigue igual (30 créditos)', r.ok && r.creditos === 30 && (await tiene('cursos', 'c3')), JSON.stringify(r));
await db.doc('ai_access/A').set({ creditosExtra: 1000 }, { merge: true });
await db.doc('cursos/c4').set({ name: 'Curso 4', isFree: false, priceSoles: 10, discountPercentage: 50, discountExpiryDate: new Date(Date.now() + 864e5).toISOString(), allowedUserIds: [] });
r = await canjear(tA, { cursoId: 'c4' });
caso('curso con 50% de descuento vigente → 50 créditos', r.ok && r.creditos === 50, JSON.stringify(r));
await db.doc('config_ia/planes').set({ packs: [] }, { merge: true });
await db.doc('cursos/c5').set({ name: 'Curso 5', isFree: false, priceSoles: 54.9, allowedUserIds: [] });
r = await canjear(tA, { cursoId: 'c5' });
caso('sin recargas configuradas: S/ 54.90 = 500 créditos (la recarga grande por defecto)', r.ok && r.creditos === 500, JSON.stringify(r));
const tAdm = await idToken('adm', { role: 'admin', workspace: 'admin' });
r = await canjear(tAdm, { tipo: 'paquete', paqueteId: 'p1' });
caso('el admin no canjea', r.error === 'FAILED_PRECONDITION', JSON.stringify(r));

console.log(`\n${ok} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
