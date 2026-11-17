// Datos de prueba en los EMULADORES (nunca en la base real): dos usuarios con PIN y
// datos de cada uno, para comprobar que nadie ve lo de otro.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
if (!process.env.FIRESTORE_EMULATOR_HOST) { console.error('Solo con emuladores'); process.exit(1); }
initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'innovacontratistas-434d2' });
const db = getFirestore();
const hoy = new Date().toISOString().slice(0, 10);
const set = (p, d) => db.doc(p).set(d);
await Promise.all([
  set('usuarios/A', { name: 'Usuario A', pin: '111111', role: 'user', isActive: true, userId: 'admin' }),
  set('usuarios/B', { name: 'Usuario B', pin: '222222', role: 'user', isActive: true, userId: 'admin' }),
  set('projects/pA', { name: 'Obra de A', client: 'Cliente A', status: 'En Progreso', presupuesto: 1000, date: hoy, userId: 'user_A', cobros: [], materiales: [], personal: [] }),
  set('projects/pB', { name: 'Obra de B', client: 'Cliente B', status: 'En Progreso', presupuesto: 2000, date: hoy, userId: 'user_B', cobros: [], materiales: [], personal: [] }),
  set('projects/pAdm', { name: 'Obra del Admin', client: 'Cliente Admin', status: 'Pendiente', presupuesto: 3000, date: hoy, userId: 'admin', cobros: [], materiales: [], personal: [] }),
  set('clients/cA', { name: 'Cliente A', userId: 'user_A', createdAt: hoy }),
  set('clients/cB', { name: 'Cliente B', userId: 'user_B', createdAt: hoy }),
  set('tickets/tB', { title: 'Ticket de B', userId: 'user_B', status: 'Abierto' }),
  set('planos_techos/dA', { name: 'Techo de A', nombre: 'Techo de A', authorUid: 'A', savedAt: new Date().toISOString() }),
  set('planos_techos/dB', { name: 'Techo de B', nombre: 'Techo de B', authorUid: 'B', savedAt: new Date().toISOString() }),
  set('notificaciones/n1', { title: 'Comunicado de prueba', message: 'Hola a todos', createdAtTimestamp: Date.now(), priority: 'info', author: 'Admin', durationHours: 48, expiresAtTimestamp: Date.now() + 48 * 3600e3 }),
  set('config_flags/global', { disabledSections: [] }),
]);
console.log('semilla lista');
