// Prueba del pago en línea (Mercado Pago) contra el emulador de Firestore: no usa dinero
// ni la API real. Revisa que se entregue UNA sola vez, la primera recarga doble, el
// monto y los planes. Correr: cd seguridad && npm run test:pago
import { initializeApp } from '../functions/node_modules/firebase-admin/lib/app/index.js';
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/firestore/index.js';
import { crearPagosEnLinea } from '../functions/pagoEnLinea.js';

initializeApp({ projectId: 'demo-innova' });
const db = getFirestore();
const nada = () => () => {};
const { entregarPago } = crearPagosEnLinea({ onCall: nada, onRequest: nada, HttpsError: Error, db, PLANES_DEFAULT: [{ id: 'maestro', creditosMes: 200 }], CREDITOS_BIENVENIDA: 20, mesActual: () => '2026-11' });
let fallos = 0;
const ok = (c, t) => { console.log(`${c ? '✓' : '✗'} ${t}`); if (!c) fallos++; };
const pedido = async (id, d) => db.collection('pagos_en_linea').doc(id).set({ entregado: false, estado: 'pendiente', ...d });
const saldo = async ws => (await db.collection('ai_access').doc(ws).get()).data() || {};

await pedido('pedidoAAAAAAAA01', { ws: 'juan', tipo: 'pack', itemId: 'ai_creditos_50', creditos: 50, monto: 7.9 });
let r = await entregarPago({ id: 111, status: 'approved', currency_id: 'PEN', transaction_amount: 7.9, external_reference: 'pedidoAAAAAAAA01' });
ok(r.ok, 'pago aprobado se entrega');
ok((await saldo('juan')).creditosExtra === 20 + 100, 'primera recarga: 20 de bienvenida + 50×2 = 120');
r = await entregarPago({ id: 111, status: 'approved', currency_id: 'PEN', transaction_amount: 7.9, external_reference: 'pedidoAAAAAAAA01' });
ok(r.yaEntregado && (await saldo('juan')).creditosExtra === 120, 'el mismo aviso repetido no vuelve a sumar');
await pedido('pedidoAAAAAAAA02', { ws: 'juan', tipo: 'pack', itemId: 'ai_creditos_50', creditos: 50, monto: 7.9 });
await entregarPago({ id: 112, status: 'approved', currency_id: 'PEN', transaction_amount: 7.9, external_reference: 'pedidoAAAAAAAA02' });
ok((await saldo('juan')).creditosExtra === 170, 'segunda recarga ya no es doble (120 + 50)');
await pedido('pedidoAAAAAAAA03', { ws: 'ana', tipo: 'pack', itemId: 'ai_creditos_150', creditos: 150, monto: 19.9 });
r = await entregarPago({ id: 113, status: 'approved', currency_id: 'PEN', transaction_amount: 1, external_reference: 'pedidoAAAAAAAA03' });
ok(!r.ok && !(await saldo('ana')).creditosExtra, 'monto menor al precio: no se entrega');
r = await entregarPago({ id: 114, status: 'pending', currency_id: 'PEN', transaction_amount: 19.9, external_reference: 'pedidoAAAAAAAA03' });
ok(!r.ok && !(await saldo('ana')).creditosExtra, 'pago pendiente: no se entrega');
r = await entregarPago({ id: 115, status: 'approved', currency_id: 'PEN', transaction_amount: 19.9, external_reference: 'noexisteAAAAAA99' });
ok(!r.ok, 'pedido desconocido: no se entrega');
await pedido('pedidoAAAAAAAA04', { ws: 'luis', tipo: 'plan', itemId: 'ai_plan_maestro', planId: 'maestro', periodo: 'mensual', monto: 19.9 });
await entregarPago({ id: 116, status: 'approved', currency_id: 'PEN', transaction_amount: 19.9, external_reference: 'pedidoAAAAAAAA04' });
const l = await saldo('luis');
ok(l.planId === 'maestro' && l.creditosRestantes === 200 && l.creditosExtra === 20 && !!l.venceEl, 'plan Maestro activado con 200 créditos del mes');
const compras = await db.collection('purchases').where('origen', '==', 'mercado_pago').get();
ok(compras.size === 3, 'cada pago entregado queda en Compras (3)');
console.log(fallos ? `\n${fallos} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
process.exit(fallos ? 1 : 0);
