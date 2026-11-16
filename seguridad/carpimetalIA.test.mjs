// Prueba de disenarCarpimetal con la IA SIMULADA (no gasta saldo). Uso: cd seguridad && npm run test:carpimetal
import { crearDisenarCarpimetal, limpiarEscalera, HERRAMIENTA_ESCALERA } from '../functions/carpimetalIA.js';

class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
let respuesta = null, ultimoPedido = null, cobros = 0, devoluciones = 0;
class Anthropic { constructor() { this.messages = { create: async (p) => { ultimoPedido = p; if (respuesta instanceof Error) throw respuesta; return respuesta; } }; } }
const cobrarUsoIA = async (_req, accion) => { if (accion !== 'carpimetal') throw new Error('acción equivocada'); cobros++; return async () => { devoluciones++; }; };
const errorDeIA = (e) => new HttpsError('unavailable', 'IA: ' + e.message);
const fn = crearDisenarCarpimetal({ onCall: (_o, h) => h, HttpsError, Anthropic, cobrarUsoIA, errorDeIA, modelo: 'modelo-de-prueba' });
process.env.ANTHROPIC_API_KEY = 'clave-de-prueba';
const req = (data) => ({ auth: { uid: 'u1', token: { workspace: 'u1' } }, data });
let ok = 0, mal = 0;
const caso = (n, c, extra = '') => { if (c) { ok++; console.log('  ✔', n); } else { mal++; console.log('  ✘', n, extra); } };
const esperaError = async (p) => { try { await p; return null; } catch (e) { return e; } };

// 1. El plano de la escalera en U (2345): la IA devuelve lo que leyó.
respuesta = { content: [{ type: 'tool_use', name: 'proponer_escalera', input: { forma: 'U', alturaTotal: 2.7922, ancho: 1, alturaDescanso: 1.47, largoDescanso: 1.25, peldanos1: 7, peldanos2: 7, largo1: 1.85, largo2: 1.6, huella: 0.28, llegada: 0.4407, peldano: 'madera', columnas: true, notas: 'Separación entre tramos supuesta en 0.' } }] };
let r = await fn(req({ texto: 'escalera del plano', imageBase64: 'x'.repeat(200), mimeType: 'application/pdf' }));
caso('lee la escalera en U con sus medidas', r.escalera.forma === 'U' && r.escalera.alturaTotal === 2.792 && r.escalera.alturaDescanso === 1.47 && r.escalera.peldanos1 === 7 && r.escalera.llegada === 0.441, JSON.stringify(r.escalera));
caso('el PDF va como documento', ultimoPedido.messages[0].content[0].type === 'document' && ultimoPedido.messages[0].content[0].source.media_type === 'application/pdf');
caso('fuerza la herramienta de la escalera', ultimoPedido.tool_choice?.name === HERRAMIENTA_ESCALERA.name);
caso('cobra una vez y no devuelve', cobros === 1 && devoluciones === 0, `${cobros}/${devoluciones}`);
caso('devuelve las notas', /Separación/.test(r.notas));
// 2. Valores imposibles: se limitan
const l = limpiarEscalera({ forma: 'L', alturaTotal: 50, ancho: 0.1, alturaDescanso: 99, peldanos1: 500, huella: 3, perfilZanco: 'inventado', giro: 'derecha' });
caso('limita altura, ancho, descanso y huella', l.alturaTotal === 8 && l.ancho === 0.6 && l.alturaDescanso === 7.7 && l.huella === 0.4, JSON.stringify(l));
caso('descarta peldaños y perfiles imposibles', l.peldanos1 === undefined && l.perfilZanco === undefined && l.giro === 'derecha');
caso('forma desconocida → recta, sin descanso', (() => { const x = limpiarEscalera({ forma: 'caracol', alturaTotal: 2.5, ancho: 0.9 }); return x.forma === 'recta' && x.alturaDescanso === undefined; })());
// 3. La IA falla → se devuelven los créditos
respuesta = new Error('sin conexión');
let e = await esperaError(fn(req({ texto: 'escalera recta de 2.6 m' })));
caso('si la IA falla, devuelve los créditos', e && devoluciones === 1, String(e));
// 4. La IA no devuelve medidas → se devuelven los créditos
respuesta = { content: [{ type: 'text', text: 'no sé' }] };
e = await esperaError(fn(req({ texto: 'escalera recta de 2.6 m' })));
caso('sin medidas: error claro y devuelve', e?.code === 'not-found' && devoluciones === 2, String(e));
// 5. Sin texto ni archivo: no cobra
const antes = cobros;
e = await esperaError(fn(req({ texto: 'hi' })));
caso('pedido vacío: no cobra', e?.code === 'invalid-argument' && cobros === antes);
e = await esperaError(fn({ data: { texto: 'escalera' } }));
caso('sin sesión: rechazado', e?.code === 'unauthenticated');
console.log(`\n${ok} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
