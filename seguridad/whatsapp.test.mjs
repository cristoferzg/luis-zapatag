// Prueba del asistente de WhatsApp contra el emulador de Firestore: Meta y la IA van
// simuladas (no se envía nada de verdad). Revisa el flujo completo: conversación,
// captura, N° de operación repetido, aprobación con PIN único (una sola vez),
// recarga con primera doble, rechazo, silencio cuando el dueño escribe e interruptor.
// Correr: cd seguridad && npm run test:whatsapp
import { initializeApp } from '../functions/node_modules/firebase-admin/lib/app/index.js';
import { getFirestore } from '../functions/node_modules/firebase-admin/lib/firestore/index.js';
import { crearWhatsappBot, firmaValida, titularCoincide } from '../functions/whatsappBot.js';
import { createHmac } from 'node:crypto';

initializeApp({ projectId: 'demo-innova' });
const db = getFirestore();
const nada = () => () => {};
let fallos = 0;
const ok = (c, t) => { console.log(`${c ? '✓' : '✗'} ${t}`); if (!c) fallos++; };

// Meta simulada: guarda lo que se envía.
const enviados = [];
const fetchWA = async (url, op = {}) => {
  const json = (d, status = 200) => ({ ok: status < 300, status, json: async () => d, arrayBuffer: async () => new TextEncoder().encode('IMAGEN').buffer });
  if (/\/messages$/.test(url)) { const b = JSON.parse(op.body); enviados.push(b); return json({ messages: [{ id: 'wamid.' + enviados.length }] }); }
  if (/\/media\d+$/.test(url)) return json({ url: 'https://lookaside.example/img', mime_type: 'image/jpeg' });
  if (url === 'https://lookaside.example/img') return json({});
  return json({ error: { message: 'ruta' } }, 404);
};
// IA simulada.
let lectura = {};
const iaSimulada = {
  responder: (conv) => {
    const t = (conv.mensajes || []).filter(m => m.de === 'cliente').pop()?.texto || '';
    if (/acceso/i.test(t)) return { mensaje: 'El acceso cuesta S/ 50. Yapea al 999 y mándame la captura y tu nombre.', accion: 'quiere_acceso', nombre: /Juan/.test(t) ? 'Juan Pérez' : undefined };
    if (/50 créditos/i.test(t)) return { mensaje: 'Son S/ 7.90, mándame la captura.', accion: 'quiere_creditos', creditos: 50 };
    if (/factura/i.test(t)) return { mensaje: 'El equipo te responde pronto.', accion: 'avisar_dueno', motivo: 'Pide factura' };
    return { mensaje: 'Hola, soy el asistente de InnovApp.', accion: 'ninguna' };
  },
  leerCaptura: () => lectura,
};
const pushes = [];
const enviarPush = async (d, t, c) => { pushes.push({ d, t, c }); };
class HttpsError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const bot = crearWhatsappBot({ onRequest: nada, onCall: nada, HttpsError, db, Anthropic: null, enviarPush, modelo: 'x', guia: 'guía', CREDITOS_BIENVENIDA: 20, fetchWA, iaSimulada });

let n = 0;
const msj = (tel, cuerpo) => ({ entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: 'NUM1' }, contacts: [{ wa_id: tel, profile: { name: 'Perfil ' + tel } }], messages: [{ id: 'm' + (++n), from: tel, ...cuerpo }] } }] }] });
const texto = (tel, t) => bot.procesarCuerpo(msj(tel, { type: 'text', text: { body: t } }));
const imagen = (tel) => bot.procesarCuerpo(msj(tel, { type: 'image', image: { id: 'media' + n } }));
const ultimo = () => JSON.stringify(enviados[enviados.length - 1] || {});
const pedidosDe = async (tel) => (await db.collection('wa_pedidos').where('telefono', '==', tel).get()).docs.map(d => ({ id: d.id, ...d.data() }));

// --- utilidades
const secreto = 'abc';
const cuerpo = Buffer.from('{"x":1}');
ok(firmaValida(cuerpo, 'sha256=' + createHmac('sha256', secreto).update(cuerpo).digest('hex'), secreto), 'firma de Meta válida se acepta');
ok(!firmaValida(cuerpo, 'sha256=' + '0'.repeat(64), secreto) && !firmaValida(cuerpo, '', secreto), 'firma falsa o vacía se rechaza');
ok(titularCoincide('Luis Zapata G.', 'Luis Alberto Zapata Gómez') === true && titularCoincide('Maria Lopez', 'Luis Zapata') === false, 'compara el nombre del destinatario');

await db.collection('config_ia').doc('pago_directo').set({ activo: true, yape: { numero: '999 111 222', titular: 'Luis Zapata' } });

// --- apagado: solo se anota
await db.collection('wa_config').doc('ajustes').set({ activo: false, precioAcceso: 50 });
await texto('51911000001', 'hola');
ok(enviados.length === 0, 'con el asistente apagado no responde (el dueño atiende)');
ok(((await db.collection('wa_conversaciones').doc('51911000001').get()).data()?.mensajes || []).length === 1, '…pero el mensaje queda anotado');

// --- acceso nuevo
await db.collection('wa_config').doc('ajustes').set({ activo: true, precioAcceso: 50 });
await texto('51911000001', 'quiero el acceso, soy Juan');
ok(/S\/ 50/.test(ultimo()) && /51911000001/.test(ultimo()), 'responde con el precio al mismo número');
const repetirId = 'm' + n;
await bot.procesarCuerpo({ entry: [{ changes: [{ field: 'messages', value: { metadata: { phone_number_id: 'NUM1' }, messages: [{ id: repetirId, from: '51911000001', type: 'text', text: { body: 'quiero el acceso, soy Juan' } }] } }] }] });
ok(enviados.length === 1, 'si Meta repite el mismo mensaje no se responde dos veces');
lectura = { esPago: true, monto: 50, moneda: 'PEN', nroOperacion: '12345678', destinatario: 'Luis Zapata', metodo: 'Yape', fecha: '2026-11-10' };
await imagen('51911000001');
let [p1] = await pedidosDe('51911000001');
ok(p1?.estado === 'por_aprobar' && p1.tipo === 'acceso' && p1.montoOk && !p1.repetido && p1.destinatarioOk === true && p1.nombre === 'Juan Pérez', 'la captura deja un pedido por aprobar (monto ok, op nueva, a tu nombre)');
ok(pushes.some(x => x.d.aAdmin && /Pago por aprobar/.test(x.t)), 'te llega el aviso de pago por aprobar');
ok(/revisa/.test(ultimo()) && !/\b\d{6}\b/.test(ultimo().replace(/\d{7,}/g, '')), 'al cliente se le dice que se revisa (sin PIN todavía)');

// --- misma operación desde otro número
await texto('51922000002', 'quiero acceso');
await imagen('51922000002');
const [p2] = await pedidosDe('51922000002');
ok(!!p2?.repetido, 'el mismo N° de operación en otro pedido se marca REPETIDO');
ok(pushes.some(x => /REPETIDO/.test(x.t)), 'el aviso dice que está repetido');

// --- aprobar
const r = await bot.aprobar({ id: p1.id, aprobar: true });
const u = (await db.collection('usuarios').doc(r.uid).get()).data();
ok(/^\d{6}$/.test(r.pin) && u?.pin === r.pin && u.isActive && u.name === 'Juan Pérez' && u.pago?.nroOperacion === '12345678', 'el "sí" crea el acceso con PIN de 6 dígitos y el pago');
ok(ultimo().includes(r.pin) && /51911000001/.test(ultimo()), 'el PIN le llega al cliente por WhatsApp');
const conv1 = (await db.collection('wa_conversaciones').doc('51911000001').get()).data();
ok(!JSON.stringify(conv1.mensajes).includes(r.pin), 'el PIN no queda escrito en la conversación guardada');
let dos = false; try { await bot.aprobar({ id: p1.id, aprobar: true }); } catch { dos = true; }
ok(dos && (await db.collection('usuarios').where('telefono', '==', '51911000001').get()).size === 1, 'aprobar dos veces no crea dos accesos');
ok((await db.collection('purchases').where('origen', '==', 'whatsapp').get()).size === 1, 'la venta queda en Compras');

// --- rechazo
await bot.aprobar({ id: p2.id, aprobar: false, motivo: 'la operación ya se usó' });
ok((await pedidosDe('51922000002'))[0].estado === 'rechazado' && /no pudimos validar/.test(ultimo()), 'rechazar avisa al cliente con el motivo');

// --- recarga del mismo cliente (ya tiene acceso)
await texto('51911000001', 'quiero 50 créditos');
lectura = { esPago: true, monto: 7.9, moneda: 'PEN', nroOperacion: '999000111', destinatario: 'Luis Zapata', metodo: 'Yape' };
await imagen('51911000001');
const p3 = (await pedidosDe('51911000001')).find(p => p.estado === 'por_aprobar');
ok(p3?.tipo === 'creditos' && p3.creditos === 50 && p3.montoOk, 'pedido de recarga de 50 créditos (S/ 7.90)');
const r3 = await bot.aprobar({ id: p3.id, aprobar: true });
ok(r3.creditos === 100 && (await db.collection('ai_access').doc(r.uid).get()).data()?.creditosExtra === 120, 'primera recarga doble: 20 de bienvenida + 100');
ok(/100 créditos/.test(ultimo()), 'el cliente recibe la confirmación de sus créditos');

// --- monto incorrecto
await texto('51933000003', 'quiero acceso');
lectura = { esPago: true, monto: 5, moneda: 'PEN', nroOperacion: '55555555', destinatario: 'Otra Persona', metodo: 'Yape' };
await imagen('51933000003');
const [p4] = await pedidosDe('51933000003');
ok(p4 && !p4.montoOk && p4.destinatarioOk === false, 'monto menor o a otro nombre queda marcado');
ok(pushes.some(x => /monto no coincide/.test(x.t)), 'el aviso dice que el monto no coincide');

// --- imagen que no es pago
lectura = { esPago: false };
const antes = (await pedidosDe('51933000003')).length;
await imagen('51933000003');
ok((await pedidosDe('51933000003')).length === antes && /no logro ver un pago/.test(ultimo()), 'una foto que no es pago no crea pedido');

// --- duda que necesita al dueño
pushes.length = 0;
await texto('51944000004', 'necesito factura');
ok((await db.collection('wa_conversaciones').doc('51944000004').get()).data()?.necesitaDueno === 'Pide factura' && pushes.some(x => /te necesitan/.test(x.t)), 'lo que solo tú resuelves te llega como aviso');
await db.collection('wa_config').doc('ajustes').set({ modoTransmision: true }, { merge: true });
pushes.length = 0;
await texto('51944000004', 'necesito factura otra vez');
ok(!pushes.length, 'en modo transmisión no te avisa de dudas (solo pagos)');

// --- el dueño escribe a mano → el asistente calla
const total = enviados.length;
await bot.procesarCuerpo({ entry: [{ changes: [{ field: 'smb_message_echoes', value: { message_echoes: [{ id: 'eco1', from: 'NEG', to: '51955000005', type: 'text', text: { body: 'Hola, soy Luis' } }] } }] }] });
await texto('51955000005', 'hola Luis');
ok(enviados.length === total, 'si tú escribes desde tu celular, el asistente no se mete en ese chat');

console.log(fallos ? `\n${fallos} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
process.exit(fallos ? 1 : 0);
