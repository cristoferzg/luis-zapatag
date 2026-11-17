// Datos de VOLUMEN en los emuladores (nunca en la base real) para medir la carga: 300 obras con
// materiales, 800 gastos y 200 clientes del Usuario A, y 40 cursos. Uso: dentro de emulators:exec.
import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
if (!process.env.FIRESTORE_EMULATOR_HOST) { console.error('Solo con emuladores'); process.exit(1); }
initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'innovacontratistas-434d2' });
const db = getFirestore();
const hoy = new Date().toISOString().slice(0, 10);
const lote = async (docs) => { for (let i = 0; i < docs.length; i += 400) { const b = db.batch(); docs.slice(i, i + 400).forEach(([p, d]) => b.set(db.doc(p), d)); await b.commit(); } };
const mat = (i) => Array.from({ length: 25 }, (_, k) => ({ id: `m${i}_${k}`, nombre: `Material ${k} de la obra ${i}`, cantidad: k + 1, precio: 12.5 * k, unidad: 'und' }));
await lote(Array.from({ length: 300 }, (_, i) => [`projects/vol${i}`, { name: `Obra volumen ${i}`, client: `Cliente ${i % 200}`, status: 'En Progreso', presupuesto: 1000 + i, date: hoy, userId: 'user_A', cobros: [{ id: `c${i}`, monto: 500, fecha: hoy }], materiales: mat(i), personal: [] }]));
await lote(Array.from({ length: 800 }, (_, i) => [`finances/vol${i}`, { type: i % 3 ? 'gasto' : 'ingreso', amount: 10 + i, description: `Movimiento ${i} de prueba con descripción larga`, category: 'Materiales', date: hoy, userId: 'user_A', projectId: `vol${i % 300}` }]));
await lote(Array.from({ length: 200 }, (_, i) => [`clients/vol${i}`, { name: `Cliente ${i}`, phone: '999000' + i, email: `cliente${i}@ejemplo.pe`, userId: 'user_A', createdAt: hoy }]));
await lote(Array.from({ length: 40 }, (_, i) => [`cursos/vol${i}`, { nombre: `Curso ${i}`, descripcion: 'Descripción del curso '.repeat(20), precio: 49, gratis: false }]));
console.log('semilla de volumen lista');
