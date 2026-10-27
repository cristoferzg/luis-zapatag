/**
 * Innova Contratistas — server-side PIN authentication (Option B).
 *
 * Goal: keep the familiar 6-digit PIN login UX, but make it trustworthy.
 * Instead of the browser reading the `usuarios` collection and comparing PINs
 * (which forces that collection to be world-readable and leaks every PIN),
 * the PIN is verified HERE, on the server, with the Admin SDK (which bypasses
 * security rules). The function returns a Firebase custom token carrying
 * verified claims (role + workspace). The client signs in with that token, so
 * `request.auth.uid` and `request.auth.token.role` become trustworthy and the
 * Firestore rules can enforce real per-workspace isolation.
 *
 * With this in place:
 *   - The `usuarios` collection no longer needs to be readable by normal
 *     clients — only admins (and this function) can read it.
 *   - A short PIN is no longer brute-forceable offline from the bundle, because
 *     nothing about the PIN ships in the client, and verification is rate-limit
 *     -able on the server.
 *
 * DEPLOY (requires the Firebase Blaze plan, which Cloud Functions need):
 *   1. cd functions && npm install
 *   2. Set the master admin PIN as a secret (do NOT hardcode it):
 *        firebase functions:secrets:set ADMIN_PIN
 *   3. firebase deploy --only functions
 *   4. Wire the client to call loginWithPin (see src/lib/pinAuth.ts) and only
 *      then deploy the claims-based rules in firestore.rules.phase3.
 *
 * This file is NOT wired into the running app yet; adding it changes nothing
 * until you deploy it and switch the client over.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash, timingSafeEqual } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';

initializeApp();
const db = getFirestore();

const sha256Buf = (s) => createHash('sha256').update(String(s).trim()).digest();
// Constant-time comparison of two secrets (compared via their fixed-length
// SHA-256 digests so timingSafeEqual always gets equal-length buffers).
const secretsEqual = (a, b) => {
  try {
    return timingSafeEqual(sha256Buf(a), sha256Buf(b));
  } catch (_) {
    return false;
  }
};

/**
 * loginWithPin({ pin }) -> { token, role, workspace, name }
 * The client then calls signInWithCustomToken(token).
 */
export const loginWithPin = onCall(
  { secrets: ['ADMIN_PIN'], region: 'us-central1', cors: true },
  async (request) => {
    const pin = String(request.data?.pin || '').trim();

    if (!/^\d{6}$/.test(pin)) {
      throw new HttpsError('invalid-argument', 'El PIN debe tener 6 dígitos.');
    }

    // 1) Master administrator PIN (stored as a server secret, never in the bundle).
    const adminPin = process.env.ADMIN_PIN || '';
    if (adminPin && secretsEqual(pin, adminPin)) {
      const claims = { role: 'admin', workspace: 'admin' };
      const token = await getAuth().createCustomToken('admin', claims);
      return { token, role: 'admin', workspace: 'admin', name: 'Innova Contratistas' };
    }

    // 2) Registered users. Admin SDK bypasses rules, so the client never needs
    //    read access to this collection.
    const snap = await db.collection('usuarios').where('pin', '==', pin).limit(1).get();
    if (snap.empty) {
      // Generic message — do not reveal whether a PIN exists.
      throw new HttpsError('permission-denied', 'PIN no válido.');
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data() || {};
    if (data.isActive === false) {
      throw new HttpsError('permission-denied', 'Usuario desactivado.');
    }

    const uid = docSnap.id;
    const role = data.role === 'admin' ? 'admin' : 'user';
    // workspace MUST equal the `userId` the client stores on each record so the
    // Phase-3 rule `resource.data.userId == token.workspace` matches. The client
    // derives its id from `workspace` by stripping any `user_` prefix, and writes
    // records with that stripped value — and legacy records already use the bare
    // `usuarios` doc id. So the workspace claim must be the bare doc id (no prefix),
    // otherwise users get locked out of their own (and existing) data.
    const workspace = role === 'admin' ? 'admin' : uid;

    // Best-effort last-login stamp.
    try {
      await docSnap.ref.set(
        { lastLogin: new Date().toISOString(), lastLoginTimestamp: Date.now() },
        { merge: true }
      );
    } catch (_) { /* ignore */ }

    const token = await getAuth().createCustomToken(uid, { role, workspace });
    return { token, role, workspace, name: data.name || 'Usuario' };
  }
);


// =============================================================================
// COBRO DE CRÉDITOS DE IA (server-side, a prueba de trampas).
//
// Cada función de IA cuesta créditos. El admin es ilimitado. Cada usuario tiene
// un doc ai_access/<workspace> con su plan (mensual o anual) y su saldo:
//   creditosMes  → se recargan cada mes mientras el plan esté vigente
//   creditosExtra → recargas compradas; no vencen
// Sin documento = plan Gratis (unos pocos créditos al mes para probar).
// Las reglas de Firestore impiden que el cliente escriba ai_access, por eso el
// descuento se hace AQUÍ, dentro de una transacción.
// =============================================================================
const COSTO_CREDITOS = { boleta: 1, croquis: 10 };
const CREDITOS_GRATIS_DEFAULT = 0; // la IA es de pago: el plan Gratis no trae créditos
// Igual que PLANES_IA_DEFAULT del cliente (src/lib/aiAccess.ts).
const PLANES_DEFAULT = [
  { id: 'gratis', creditosMes: 0 },
  { id: 'maestro', creditosMes: 200 },
  { id: 'taller', creditosMes: 600 },
  { id: 'empresa', creditosMes: 2000 },
];
const mesActual = () => new Date().toISOString().slice(0, 7);

async function cobrarUsoIA(request, accion) {
  const token = request.auth?.token || {};
  if (token.role === 'admin') return async () => {};
  const ws = String(token.workspace || '').replace(/^user_/, '');
  if (!ws) throw new HttpsError('permission-denied', 'SIN_PLAN');
  const costo = COSTO_CREDITOS[accion] || 1;
  const ref = db.collection('ai_access').doc(ws);
  const cfgSnap = await db.collection('config_ia').doc('planes').get();
  const cfg = cfgSnap.exists ? cfgSnap.data() : {};
  const guardados = Array.isArray(cfg?.planes) ? cfg.planes : [];
  const planes = guardados.length && guardados.every((p) => Number.isFinite(p?.creditosMes)) ? guardados : PLANES_DEFAULT;
  const gratis = planes.find((p) => p.id === 'gratis');
  const creditosGratis = Number.isFinite(gratis?.creditosMes) ? gratis.creditosMes : CREDITOS_GRATIS_DEFAULT;

  let descontado = { mes: 0, extra: 0 };
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const a = snap.exists ? snap.data() : { userId: ws, planId: 'gratis', creditosRestantes: creditosGratis, creditosExtra: 0, mes: mesActual() };
    const vencido = a.venceEl && new Date(a.venceEl).getTime() < Date.now();
    const planId = vencido ? 'gratis' : (a.planId || 'gratis');
    const plan = planes.find((p) => p.id === planId);
    const recargaMes = planId === 'gratis' ? creditosGratis : (plan?.creditosMes ?? a.creditosMesPlan ?? 0);
    let restantes = Number(a.creditosRestantes) || 0;
    let extra = Number(a.creditosExtra) || 0;
    if (a.mes !== mesActual() || vencido) restantes = recargaMes; // recarga mensual
    if (restantes + extra < costo) {
      tx.set(ref, { ...a, planId, creditosRestantes: restantes, mes: mesActual() }, { merge: true });
      throw new HttpsError('resource-exhausted', 'SIN_CREDITOS');
    }
    const deMes = Math.min(restantes, costo);
    descontado = { mes: deMes, extra: costo - deMes };
    tx.set(ref, {
      ...a, userId: ws, planId,
      creditosRestantes: restantes - deMes,
      creditosExtra: extra - descontado.extra,
      mes: mesActual(),
      usosTotales: (Number(a.usosTotales) || 0) + 1,
      ultimoUso: new Date().toISOString(),
    }, { merge: true });
  });

  // Devuelve los créditos si la IA falla (el usuario no paga por un error).
  return async () => {
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return;
        const a = snap.data();
        tx.set(ref, {
          creditosRestantes: (Number(a.creditosRestantes) || 0) + descontado.mes,
          creditosExtra: (Number(a.creditosExtra) || 0) + descontado.extra,
          usosTotales: Math.max(0, (Number(a.usosTotales) || 0) - 1),
        }, { merge: true });
      });
    } catch (_) { /* ignore */ }
  };
}

/**
 * scanReceipt({ imageBase64, mimeType }) -> ReceiptData
 *
 * Lee una foto de boleta/factura con Claude (modelo de visión de Anthropic) y
 * devuelve los campos estructurados para autocompletar un gasto. Es el respaldo
 * para comprobantes SIN QR (los que tienen QR se leen gratis en el teléfono).
 *
 * Usa claude-haiku-5-5: el modelo de visión económico y rápido, ideal para
 * lectura masiva de comprobantes. Para más precisión en fotos difíciles puedes
 * cambiar RECEIPT_MODEL a 'claude-sonnet-5-5'.
 *
 * DESPLIEGUE (requiere Blaze):
 *   1. Consigue una clave de API de Anthropic en https://console.anthropic.com/ (API Keys)
 *   2. cd functions && npm install && cd ..
 *   3. firebase functions:secrets:set ANTHROPIC_API_KEY
 *   4. firebase deploy --only functions
 *
 * Mientras no se despliegue, el cliente simplemente no obtiene datos por IA y
 * el usuario registra el gasto a mano (nada se rompe).
 */
const RECEIPT_MODEL = 'claude-haiku-5-5';

export const scanReceipt = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], region: 'us-central1', cors: true, memory: '512MiB', timeoutSeconds: 60 },
  async (request) => {
    // Solo sesiones autenticadas (anónimo o por PIN) pueden usarlo.
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Inicia sesión para escanear comprobantes.');
    }
    const imageBase64 = String(request.data?.imageBase64 || '');
    const mimeType = String(request.data?.mimeType || 'image/jpeg');
    if (!imageBase64 || imageBase64.length < 100) {
      throw new HttpsError('invalid-argument', 'Imagen no válida.');
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'La lectura por IA no está configurada todavía.');
    }

    const prompt = [
      'Eres un asistente contable para una empresa de construcción en Perú.',
      'La imagen puede ser: (a) una boleta o factura electrónica SUNAT, o',
      '(b) una captura de pago por billetera digital (Yape, Plin, BCP, Interbank, BBVA, etc.).',
      'Extrae los datos y responde SOLO con un JSON válido, sin texto adicional ni explicaciones,',
      'con estas claves exactas:',
      '{"proveedor": string, "ruc": string, "fecha": "YYYY-MM-DD", "total": number,',
      '"igv": number, "moneda": "PEN"|"USD", "serie": string, "tipo": string,',
      '"categoriaSugerida": "Material"|"Transporte"|"Personal"|"Otro",',
      '"detalle": string, "metodoPago": string, "nroOperacion": string,',
      '"descripcion": string}.',
      'Reglas:',
      '- "total" es el importe final pagado (número, sin símbolo de moneda).',
      '- "detalle" es un resumen CORTO de lo que se compró (los productos o servicios del comprobante),',
      '  por ejemplo "2 planchas galvanizadas + 1 kg soldadura". Si no hay lista de ítems, usa null.',
      '- "metodoPago": si es una captura de billetera, indica cuál ("Yape", "Plin", "BCP", "Interbank", etc.);',
      '  si es boleta/factura normal, usa "Efectivo" u "Otro" solo si se ve, sino null.',
      '- "nroOperacion": número de operación/constancia del pago (billeteras/transferencias). Si no hay, null.',
      '- En capturas de billetera, "proveedor" es el destinatario del pago y "total" el monto enviado.',
      '- "descripcion" debe ser breve (proveedor y concepto principal).',
      'Si un dato no aparece, usa null.'
    ].join(' ');

    const devolver = await cobrarUsoIA(request, 'boleta');
    const anthropic = new Anthropic({ apiKey });

    // PDF va como bloque 'document'; una imagen como bloque 'image'.
    const fileBlock = mimeType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: imageBase64 } }
      : { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } };

    let text = '';
    try {
      const msg = await anthropic.messages.create({
        model: RECEIPT_MODEL,
        max_tokens: 2048,
        output_config: { effort: 'low' },
        messages: [{
          role: 'user',
          content: [
            fileBlock,
            { type: 'text', text: prompt }
          ]
        }]
      });
      const block = (msg.content || []).find((b) => b.type === 'text');
      text = block ? block.text : '';
    } catch (e) {
      await devolver();
      const status = e?.status || e?.statusCode;
      if (status === 401) throw new HttpsError('failed-precondition', 'La clave de IA no es válida.');
      if (status === 429) throw new HttpsError('resource-exhausted', 'Servicio de IA ocupado, intenta de nuevo.');
      throw new HttpsError('unavailable', 'No se pudo contactar el servicio de IA.');
    }

    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      // A veces el modelo envuelve el JSON en ```json ... ```
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch (_) { /* vacío */ } }
    }

    const num = (v) => {
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.]/g, ''));
      return Number.isFinite(n) ? n : undefined;
    };
    const str = (v) => (v === null || v === undefined || v === 'null') ? undefined : String(v);

    // Si no se pudo leer nada, no se cobra.
    if (!num(parsed.total) && !str(parsed.proveedor) && !str(parsed.ruc)) await devolver();

    return {
      proveedor: str(parsed.proveedor),
      ruc: str(parsed.ruc),
      fecha: str(parsed.fecha),
      total: num(parsed.total),
      igv: num(parsed.igv),
      moneda: str(parsed.moneda) || 'PEN',
      serie: str(parsed.serie),
      tipo: str(parsed.tipo),
      categoriaSugerida: str(parsed.categoriaSugerida),
      detalle: str(parsed.detalle),
      metodoPago: str(parsed.metodoPago),
      nroOperacion: str(parsed.nroOperacion),
      descripcion: str(parsed.descripcion)
    };
  }
);

/**
 * analyzeRoofPlan({ imageBase64, mimeType }) -> RoofPlanData
 *
 * Lee la FOTO de un plano de techo dibujado a mano (papel cuadriculado) y
 * devuelve la estructura detectada: columnas (puntos) y vigas/tijerales (líneas)
 * con coordenadas en metros, para dibujar el techo automáticamente en el CAD.
 * El usuario luego AJUSTA el resultado (la IA propone, no reemplaza al usuario).
 *
 * Usa claude-sonnet-5-5: buen razonamiento espacial a costo moderado. Para fotos
 * difíciles se puede subir a 'claude-opus-5-5'; para abaratar, 'claude-haiku-5-5'.
 *
 * Reutiliza el MISMO secreto ANTHROPIC_API_KEY de scanReceipt. Despliegue:
 *   1. firebase functions:secrets:set ANTHROPIC_API_KEY   (si aún no está)
 *   2. firebase deploy --only functions
 * Mientras no se despliegue, el cliente avisa y el usuario dibuja a mano (nada se rompe).
 */
// Modo económico por defecto (Haiku) para abaratar el costo por plano ~10x.
// Para más precisión en planos difíciles, cambia a 'claude-sonnet-5-5'.
const ROOFPLAN_MODEL = 'claude-haiku-5-5';

export const analyzeRoofPlan = onCall(
  { secrets: ['ANTHROPIC_API_KEY'], region: 'us-central1', cors: true, memory: '512MiB', timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Inicia sesión para leer planos con IA.');
    }
    const imageBase64 = String(request.data?.imageBase64 || '');
    const mimeType = String(request.data?.mimeType || 'image/jpeg');
    if (!imageBase64 || imageBase64.length < 100) {
      throw new HttpsError('invalid-argument', 'Imagen no válida.');
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'La lectura de planos por IA no está configurada todavía.');
    }

    const prompt = [
      'Eres un ingeniero estructural que interpreta planos de techos metálicos dibujados A MANO',
      'sobre papel cuadriculado (vista en PLANTA, mirando desde arriba).',
      'En el dibujo: los CUADRADOS/MANCHAS rellenas en las esquinas e intersecciones son COLUMNAS;',
      'las LÍNEAS rectas que unen columnas son VIGAS o TIJERALES; los números escritos son MEDIDAS en metros.',
      'Define un sistema de coordenadas con ORIGEN en la esquina inferior-izquierda del plano,',
      'eje X hacia la derecha (ancho) y eje Z hacia arriba (largo/profundidad), en METROS.',
      'Usa las medidas escritas para fijar la escala; si no hay medidas claras, estima con la cuadrícula',
      'y márcalo en "confianza":"baja".',
      'Responde SOLO con un JSON válido, sin texto adicional ni explicaciones, con estas claves exactas:',
      '{"anchoM": number, "largoM": number, "alturaColM": number,',
      '"perimetro": [{"x": number, "z": number}],',
      '"caida": "arriba"|"abajo"|"izquierda"|"derecha"|"ninguna",',
      '"alturaAltaM": number|null, "alturaBajaM": number|null,',
      '"columnas": [{"x": number, "z": number}],',
      '"vigas": [{"x1": number, "z1": number, "x2": number, "z2": number, "tipo": "viga"|"tijeral"}],',
      '"confianza": "alta"|"media"|"baja", "notas": string}.',
      'Reglas:',
      '- "columnas": una por cada apoyo detectado, con su posición (x,z) en metros.',
      '- "vigas": cada línea estructural entre dos puntos; "tipo":"tijeral" si parece una cercha/celosía',
      '  (líneas con montantes o escalera entre dos cordones), si no "viga".',
      '- Si la hoja tiene varios dibujos (cortes, elevaciones, detalles), usa SOLO la vista en planta del área a techar.',
      '- "perimetro": vértices del contorno del área a techar, en orden (horario o antihorario), aunque no tenga columnas;',
      '  respeta formas en L o trapecios y las medidas escritas en cada lado. Las zonas marcadas como "vacío" o ya techadas no van.',
      '- "caida": hacia dónde escurre el agua VISTO EN EL DIBUJO (arriba = parte superior de la hoja), según flechas o textos',
      '  como "caída", "caída para la calle" o "caída hacia adelante" (y dónde está la calle). Si no se indica, "ninguna".',
      '- "alturaAltaM"/"alturaBajaM": alturas del lado alto y bajo del techo si están escritas; si solo hay una altura, ponla en',
      '  "alturaColM" y deja las otras en null.',
      '- "alturaColM": altura de columnas si el plano lo indica; si no, usa 3.0.',
      '- Coordenadas redondeadas a 0.05 m. No inventes columnas que no estén dibujadas.',
      '- "notas": una frase corta en español con lo que asumiste (p. ej. escala o medidas usadas).'
    ].join(' ');

    const devolver = await cobrarUsoIA(request, 'croquis');
    const anthropic = new Anthropic({ apiKey });
    const fileBlock = mimeType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: imageBase64 } }
      : { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } };

    let text = '';
    try {
      const msg = await anthropic.messages.create({
        model: ROOFPLAN_MODEL,
        max_tokens: 4096,
        output_config: { effort: 'medium' },
        messages: [{ role: 'user', content: [fileBlock, { type: 'text', text: prompt }] }]
      });
      const block = (msg.content || []).find((b) => b.type === 'text');
      text = block ? block.text : '';
    } catch (e) {
      await devolver();
      const status = e?.status || e?.statusCode;
      if (status === 401) throw new HttpsError('failed-precondition', 'La clave de IA no es válida.');
      if (status === 429) throw new HttpsError('resource-exhausted', 'Servicio de IA ocupado, intenta de nuevo.');
      throw new HttpsError('unavailable', 'No se pudo contactar el servicio de IA.');
    }

    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch (_) { /* vacío */ } }
    }

    const num = (v, def) => {
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
      return Number.isFinite(n) ? n : def;
    };
    const columnas = Array.isArray(parsed.columnas) ? parsed.columnas
      .map((c) => ({ x: num(c?.x, null), z: num(c?.z, null) }))
      .filter((c) => c.x !== null && c.z !== null) : [];
    const vigas = Array.isArray(parsed.vigas) ? parsed.vigas
      .map((v) => ({
        x1: num(v?.x1, null), z1: num(v?.z1, null),
        x2: num(v?.x2, null), z2: num(v?.z2, null),
        tipo: (v?.tipo === 'tijeral' ? 'tijeral' : 'viga')
      }))
      .filter((v) => v.x1 !== null && v.z1 !== null && v.x2 !== null && v.z2 !== null) : [];

    const perimetro = Array.isArray(parsed.perimetro) ? parsed.perimetro
      .map((p) => ({ x: num(p?.x, null), z: num(p?.z, null) }))
      .filter((p) => p.x !== null && p.z !== null) : [];
    const caida = ['arriba', 'abajo', 'izquierda', 'derecha', 'ninguna'].includes(parsed.caida) ? parsed.caida : 'ninguna';
    const altura = (v) => { const n = num(v, null); return n !== null && n > 0 ? n : null; };

    if (!columnas.length && !vigas.length && perimetro.length < 3) await devolver();

    return {
      anchoM: num(parsed.anchoM, 0),
      largoM: num(parsed.largoM, 0),
      alturaColM: num(parsed.alturaColM, 3.0),
      columnas,
      vigas,
      perimetro,
      caida,
      alturaAltaM: altura(parsed.alturaAltaM),
      alturaBajaM: altura(parsed.alturaBajaM),
      confianza: ['alta', 'media', 'baja'].includes(parsed.confianza) ? parsed.confianza : 'media',
      notas: typeof parsed.notas === 'string' ? parsed.notas : ''
    };
  }
);
