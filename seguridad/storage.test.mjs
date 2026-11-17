// Pruebas de las reglas de Storage con el emulador (no tocan la nube real).
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { ref, uploadString, getBytes } from 'firebase/storage';

const env = await initializeTestEnvironment({ projectId: 'demo-innova', storage: { rules: readFileSync(new URL('../storage.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9199 } });
await env.withSecurityRulesDisabled(async c => {
  const st = c.storage();
  await uploadString(ref(st, 'backups/admin/x/backup.json'), '{}');
  await uploadString(ref(st, 'descargas/pc/app.exe'), 'exe');
  await uploadString(ref(st, 'uploads/foto.png'), 'png');
});
const admin = env.authenticatedContext('admin', { role: 'admin', workspace: 'admin' }).storage();
const A = env.authenticatedContext('A', { role: 'user', workspace: 'A' }).storage();
const nadie = env.unauthenticatedContext().storage();
let ok = 0, mal = 0;
const caso = async (n, esp, fn) => { try { await (esp ? assertSucceeds(fn()) : assertFails(fn())); ok++; console.log('  ✔', n); } catch (e) { mal++; console.log('  ✘', n, e?.message?.split('\n')[0]); } };
await caso('Visitante descarga el instalador', true, () => getBytes(ref(nadie, 'descargas/pc/app.exe')));
await caso('Usuario NO sube instalador', false, () => uploadString(ref(A, 'descargas/pc/malo.exe'), 'x'));
await caso('Admin sube instalador', true, () => uploadString(ref(admin, 'descargas/pc/nuevo.exe'), 'x'));
await caso('Usuario NO lee respaldos', false, () => getBytes(ref(A, 'backups/admin/x/backup.json')));
await caso('Usuario NO escribe respaldos', false, () => uploadString(ref(A, 'backups/admin/y.json'), '{}'));
await caso('Admin lee respaldos', true, () => getBytes(ref(admin, 'backups/admin/x/backup.json')));
await caso('Usuario sube una foto', true, () => uploadString(ref(A, 'uploads/mia.png'), 'p'));
await caso('Usuario ve fotos', true, () => getBytes(ref(A, 'uploads/foto.png')));
await caso('Visitante NO ve fotos', false, () => getBytes(ref(nadie, 'uploads/foto.png')));
await env.cleanup();
console.log(`\nResultado: ${ok} correctas, ${mal} con problema.`); process.exit(mal ? 1 : 0);
