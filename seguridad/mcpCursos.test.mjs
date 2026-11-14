// Prueba del MCP de Academia (functions/mcpCursos.js) con base y Storage simulados (sin emuladores).
// Uso: node seguridad/mcpCursos.test.mjs
import assert from 'node:assert/strict';
import { crearAcademia, crearManejador, atenderMensaje } from '../functions/mcpCursos.js';

// --- Firestore simulado (solo lo que usa el MCP) ---
function baseSimulada() {
  const datos = { cursos: new Map(), tutoriales: new Map() };
  const doc = (col, id) => ({
    async get() { return { exists: datos[col].has(id), data: () => datos[col].get(id) }; },
    async set(v, op) { datos[col].set(id, op?.merge ? { ...(datos[col].get(id) || {}), ...v } : { ...v }); },
  });
  return {
    datos,
    collection: (col) => ({
      doc: (id) => doc(col, id),
      async get() { return { docs: [...datos[col]].map(([id, v]) => ({ id, data: () => v })) }; },
    }),
  };
}
const subidos = [];
const bucket = { name: 'demo.firebasestorage.app', file: (ruta) => ({ async save(buf, op) { subidos.push({ ruta, buf, op }); } }) };
const fetchFn = async (url) => ({
  ok: url.includes('ok'), status: url.includes('ok') ? 200 : 404,
  headers: { get: (h) => (h === 'content-length' ? '4' : 'application/pdf') },
  async arrayBuffer() { return new Uint8Array([1, 2, 3, 4]).buffer; },
});
const db = baseSimulada();
let t = 1000;
const academia = crearAcademia({ db, bucket, fetchFn, ahora: () => t++ });

// 1) Crear curso de pago y validar precio
await assert.rejects(academia.guardar_curso({ nombre: 'Soldadura', gratis: false }), /precioSoles/);
const c = await academia.guardar_curso({ nombre: 'Soldadura Estructural', descripcion: 'SMAW y MIG', gratis: false, precioSoles: 89, precioAntesSoles: 129, destacado: true });
assert.equal(c.accion, 'creado');
const guardado = db.datos.cursos.get(c.id);
assert.equal(guardado.isFree, false); assert.equal(guardado.priceSoles, 89); assert.equal(guardado.precioAntesSoles, 129);
assert.deepEqual(guardado.allowedUserIds, []); assert.equal(guardado.isFeatured, true);

// 2) Mismo nombre (otra mayúscula) = actualizar, conserva alumnos
db.datos.cursos.get(c.id).allowedUserIds = ['u1'];
const c2 = await academia.guardar_curso({ nombre: 'soldadura estructural', precioSoles: 99 });
assert.equal(c2.accion, 'actualizado'); assert.equal(c2.id, c.id);
assert.deepEqual(db.datos.cursos.get(c.id).allowedUserIds, ['u1']); assert.equal(db.datos.cursos.get(c.id).priceSoles, 99);
assert.equal(db.datos.cursos.get(c.id).isFree, false);

// 3) Clase: sin video no se crea; con video hereda "de pago"; curso inexistente da error
await assert.rejects(academia.guardar_clase({ curso: 'Soldadura Estructural', titulo: 'Clase 1' }), /videoUrl/);
await assert.rejects(academia.guardar_clase({ curso: 'Nada', titulo: 'X', videoUrl: 'https://x' }), /No existe el curso/);
const k = await academia.guardar_clase({ curso: 'SOLDADURA ESTRUCTURAL', titulo: 'Clase 1', videoUrl: 'https://v.mp4' });
const clase = db.datos.tutoriales.get(k.id);
assert.equal(clase.category, 'Soldadura Estructural');
assert.equal(clase.isFree, false); assert.deepEqual(clase.allowedUserIds, []);
const muestra = await academia.guardar_clase({ curso: 'Soldadura Estructural', titulo: 'Muestra', videoUrl: 'https://m.mp4', gratis: true });
assert.equal(db.datos.tutoriales.get(muestra.id).isFree, true);

// 4) Renombrar curso arrastra sus clases
await academia.guardar_curso({ id: c.id, nombre: 'Soldadura Estructural Pro' });
assert.equal(db.datos.tutoriales.get(k.id).category, 'Soldadura Estructural Pro');
await academia.guardar_curso({ nombre: 'Naves', gratis: false, precioSoles: 120 });
await assert.rejects(academia.guardar_curso({ id: c.id, nombre: 'naves' }), /Ya hay otro curso/);

// 5) Listar
const lista = await academia.listar_cursos();
const sold = lista.find((x) => x.id === c.id);
assert.equal(sold.clases.length, 2); assert.equal(sold.alumnos, 1);

// 6) Subir archivo (base64 y url)
const s1 = await academia.subir_archivo({ nombre: 'Portada Soldadura.png', base64: Buffer.from('hola').toString('base64'), carpeta: 'Soldadura' });
assert.match(s1.url, /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/demo\.firebasestorage\.app\/o\/academia%2Fmcp%2FSoldadura%2F\d+_Portada-Soldadura\.png\?alt=media&token=/);
assert.equal(s1.tipo, 'image/png');
assert.ok(subidos[0].op.metadata.metadata.firebaseStorageDownloadTokens);
const s2 = await academia.subir_archivo({ nombre: 'guia.pdf', url: 'https://ok.example/guia.pdf' });
assert.equal(s2.tamano, 4);
await assert.rejects(academia.subir_archivo({ nombre: 'x.pdf', url: 'http://ok' }), /https/);
await assert.rejects(academia.subir_archivo({ nombre: 'x.pdf', url: 'https://falla' }), /404/);

// 7) Protocolo MCP
const init = await atenderMensaje({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } }, academia);
assert.equal(init.result.protocolVersion, '2025-03-26');
assert.equal(await atenderMensaje({ jsonrpc: '2.0', method: 'notifications/initialized' }, academia), null);
const tl = await atenderMensaje({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, academia);
assert.deepEqual(tl.result.tools.map((x) => x.name), ['listar_cursos', 'guardar_curso', 'guardar_clase', 'subir_archivo']);
const err = await atenderMensaje({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'guardar_clase', arguments: { curso: 'Nada', titulo: 'x', videoUrl: 'https://x' } } }, academia);
assert.equal(err.result.isError, true);
const desconocida = await atenderMensaje({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'borrar_todo' } }, academia);
assert.equal(desconocida.error.code, -32602);

// 8) HTTP: clave obligatoria
const res = () => { const r = { code: 0, body: null, headers: {} }; r.status = (c) => { r.code = c; return r; }; r.set = (k, v) => { r.headers[k] = v; return r; }; r.json = (b) => { r.body = b; return r; }; r.send = (b) => { r.body = b; return r; }; return r; };
const manejar = crearManejador({ obtenerClave: () => 'clave-secreta-larga', obtenerAcademia: () => academia });
let r = res(); await manejar({ method: 'POST', headers: {}, query: {}, body: { jsonrpc: '2.0', id: 1, method: 'ping' } }, r); assert.equal(r.code, 401);
r = res(); await manejar({ method: 'POST', headers: {}, query: { clave: 'otra' }, body: { jsonrpc: '2.0', id: 1, method: 'ping' } }, r); assert.equal(r.code, 401);
r = res(); await manejar({ method: 'POST', headers: { authorization: 'Bearer clave-secreta-larga' }, query: {}, body: { jsonrpc: '2.0', id: 1, method: 'ping' } }, r); assert.equal(r.code, 200); assert.deepEqual(r.body.result, {});
r = res(); await manejar({ method: 'POST', headers: {}, query: { clave: 'clave-secreta-larga' }, body: [{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', method: 'notifications/initialized' }] }, r); assert.equal(r.body.length, 1);
r = res(); await manejar({ method: 'GET', headers: {}, query: { clave: 'clave-secreta-larga' } }, r); assert.equal(r.code, 405);
r = res(); await manejar({ method: 'POST', headers: {}, query: { clave: 'clave-secreta-larga' }, body: { jsonrpc: '2.0', method: 'notifications/initialized' } }, r); assert.equal(r.code, 202);
const sinClave = crearManejador({ obtenerClave: () => undefined, obtenerAcademia: () => academia });
r = res(); await sinClave({ method: 'POST', headers: {}, query: { clave: '' }, body: {} }, r); assert.equal(r.code, 401);

console.log('MCP de Academia: todas las pruebas pasaron ✔');
