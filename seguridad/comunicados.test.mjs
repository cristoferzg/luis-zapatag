// Prueba de comunicadosAutomaticos en el emulador de Firestore (sin tocar producción).
import assert from 'node:assert/strict';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'demo-innova';
const mod = await import('../functions/index.js');
import { createRequire } from 'node:module';
const req = createRequire(new URL('../functions/package.json', import.meta.url));
const { getFirestore } = req('firebase-admin/firestore');
const db = getFirestore();
const correr = () => mod.comunicadosAutomaticos.run({ scheduleTime: new Date().toISOString() });
const col = db.collection('comunicados_programados');
const notis = async () => (await db.collection('notificaciones').get()).docs.map(d => d.data());
const lima = (() => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', weekday: 'short', hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value])); return { fecha: `${p.year}-${p.month}-${p.day}`, hora: Number(p.hour) % 24, dia: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday) }; })();
let ok = 0; const t = (n, f) => f().then(() => { ok++; console.log('✓', n); });

await t('programado vencido se publica una vez; el futuro espera', async () => {
  await col.doc('p1').set({ title: 'Ya', message: 'm1', priority: 'info', durationHours: 24, publicarEn: Date.now() - 60e3, estado: 'pendiente' });
  await col.doc('p2').set({ title: 'Luego', message: 'm2', priority: 'info', durationHours: 24, publicarEn: Date.now() + 3600e3, estado: 'pendiente' });
  await correr(); await correr();
  const n = await notis();
  assert.equal(n.filter(x => x.title === 'Ya').length, 1);
  assert.equal(n.filter(x => x.title === 'Luego').length, 0);
  assert.equal((await col.doc('p1').get()).data().estado, 'publicado');
  assert.equal((await col.doc('p2').get()).data().estado, 'pendiente');
  assert.ok(n[0].expiresAtTimestamp > Date.now());
});
await t('biblioteca: si hoy ya salió un programado, se pospone (tope 1 por día)', async () => {
  await col.doc('_auto').set({ activo: true, frecuencia: 'semanal', dia: lima.dia, hora: lima.hora, mensajes: [{ id: 'a', title: 'Auto 1', message: 'x' }, { id: 'b', title: 'Auto 2', message: 'y' }], indice: 0 }, { merge: true });
  await correr();
  assert.equal((await notis()).filter(x => x.title === 'Auto 1').length, 0);
  assert.equal((await col.doc('_auto').get()).data().pospuesto, true);
});
await t('biblioteca: publica el siguiente mensaje una sola vez', async () => {
  await col.doc('_auto').set({ ultimoAutoFecha: '2000-01-01' }, { merge: true });
  await correr(); await correr();
  const n = await notis();
  assert.equal(n.filter(x => x.title === 'Auto 1').length, 1);
  assert.equal(n.filter(x => x.title === 'Auto 2').length, 0);
  const c = (await col.doc('_auto').get()).data();
  assert.equal(c.indice, 1); assert.equal(c.ultimoEnvio, lima.fecha); assert.equal(c.pospuesto, false);
});
await t('biblioteca: respeta la frecuencia (no repite antes de 6 días)', async () => {
  await col.doc('_auto').set({ ultimoEnvio: '2000-01-01', ultimoAutoFecha: '2000-01-01' }, { merge: true });
  await correr();
  assert.equal((await notis()).filter(x => x.title === 'Auto 2').length, 0);
});
await t('biblioteca apagada: no publica', async () => {
  await col.doc('_auto').set({ activo: false, ultimoEnvioTs: 0, ultimoEnvio: '2000-01-01', ultimoAutoFecha: '2000-01-01' }, { merge: true });
  await correr();
  assert.equal((await notis()).filter(x => x.title === 'Auto 2').length, 0);
});
console.log(`\n${ok}/5 pruebas OK`);
process.exit(ok === 5 ? 0 : 1);
