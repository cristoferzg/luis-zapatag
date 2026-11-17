// =============================================================================
// Pago en línea de planes y recargas de créditos (web y programa de PC) con
// Mercado Pago Checkout Pro: Yape, tarjeta, transferencia o pago en agente.
// La app de Android sigue pagando SOLO con Google Play (regla de Play Store).
//
//   crearPagoEnLinea({ tipo: 'pack' | 'plan', creditos?, planId?, periodo? })
//     → { url }  (la página de pago de Mercado Pago)
//   webhookMercadoPago  (Mercado Pago avisa aquí cada pago; NO se confía en lo que
//     manda: se consulta el pago con la clave y recién ahí se cargan los créditos)
//
// Interruptor sin recompilar: config_ia/planes.pagoEnLinea (Configuración → Planes
// y créditos). Clave secreta: firebase functions:secrets:set MP_ACCESS_TOKEN
// Cada pedido queda en pagos_en_linea/<id> (solo servidor) y se entrega UNA vez.
// =============================================================================
const API_MP = 'https://api.mercadopago.com';
const APP_URL = 'https://innovacontratistas-434d2.web.app';
// Precios por defecto (iguales a PLANES_IA_DEFAULT / PACKS_CREDITOS_DEFAULT del cliente).
const PRECIO_PLAN = { maestro: { mes: 19.9 }, taller: { mes: 49.9 }, empresa: { mes: 149.9, anual: 1499 } };
const PRECIO_PACK = { 20: 3.9, 50: 7.9, 150: 19.9, 500: 54.9 };

export function crearPagosEnLinea({ onCall, onRequest, HttpsError, db, PLANES_DEFAULT, CREDITOS_BIENVENIDA, mesActual, fetchMP = fetch }) {
  const llamarMP = async (ruta, metodo = 'GET', cuerpo) => {
    const clave = process.env.MP_ACCESS_TOKEN || '';
    if (!clave) throw new Error('Falta MP_ACCESS_TOKEN');
    const r = await fetchMP(`${API_MP}${ruta}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
      ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${datos?.message || ''}`);
    return datos;
  };
  const leerConfig = async () => {
    const s = await db.collection('config_ia').doc('planes').get();
    return s.exists ? s.data() : {};
  };

  const crearPagoEnLinea = onCall({ secrets: ['MP_ACCESS_TOKEN'], region: 'us-central1', cors: true, invoker: 'public' }, async (request) => {
    const token = request.auth?.token || {};
    const ws = String(token.workspace || '').replace(/^user_/, '');
    if (!ws) throw new HttpsError('unauthenticated', 'CONFIRMA_PIN');
    if (token.role === 'admin') throw new HttpsError('failed-precondition', 'El administrador no necesita comprar.');
    const cfg = await leerConfig();
    if (cfg?.pagoEnLinea !== true) throw new HttpsError('failed-precondition', 'El pago en línea no está activo.');
    const tipo = request.data?.tipo === 'plan' ? 'plan' : 'pack';
    let titulo, monto, itemId, creditos = 0, planId = '', periodo = 'mensual';
    if (tipo === 'pack') {
      creditos = parseInt(request.data?.creditos, 10);
      const packs = Array.isArray(cfg?.packs) && cfg.packs.length ? cfg.packs : Object.keys(PRECIO_PACK).map(c => ({ creditos: Number(c), precioSoles: PRECIO_PACK[c] }));
      const p = packs.find(k => Number(k?.creditos) === creditos);
      if (!p || !(Number(p.precioSoles) > 0)) throw new HttpsError('failed-precondition', 'Esa recarga no está a la venta.');
      monto = Number(p.precioSoles); titulo = `Recarga de ${creditos} créditos · InnovApp`; itemId = `ai_creditos_${creditos}`;
    } else {
      planId = String(request.data?.planId || '');
      periodo = request.data?.periodo === 'anual' ? 'anual' : 'mensual';
      const guardados = Array.isArray(cfg?.planes) ? cfg.planes : [];
      const plan = (guardados.length ? guardados : PLANES_DEFAULT.map(p => ({ ...p, precioSoles: PRECIO_PLAN[p.id]?.mes, precioAnualSoles: PRECIO_PLAN[p.id]?.anual }))).find(p => p.id === planId);
      const precio = periodo === 'anual' ? Number(plan?.precioAnualSoles) : Number(plan?.precioSoles);
      if (!plan || planId === 'gratis' || !(precio > 0)) throw new HttpsError('failed-precondition', 'Ese plan no está a la venta.');
      monto = precio; titulo = `Plan ${plan.nombre || planId} (${periodo}) · InnovApp`; itemId = `ai_plan_${planId}${periodo === 'anual' ? '__anual' : ''}`;
    }
    const ref = db.collection('pagos_en_linea').doc();
    await ref.set({ ws, tipo, itemId, creditos, planId, periodo, monto, titulo, estado: 'pendiente', entregado: false, creado: new Date().toISOString() });
    const proyecto = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || '';
    let pref;
    try {
      pref = await llamarMP('/checkout/preferences', 'POST', {
        items: [{ id: itemId, title: titulo, quantity: 1, unit_price: monto, currency_id: 'PEN' }],
        external_reference: ref.id,
        notification_url: `https://us-central1-${proyecto}.cloudfunctions.net/webhookMercadoPago`,
        back_urls: { success: `${APP_URL}/?pago=ok`, pending: `${APP_URL}/?pago=pendiente`, failure: `${APP_URL}/?pago=error` },
        auto_return: 'approved',
        statement_descriptor: 'INNOVAPP',
      });
    } catch (e) {
      await ref.set({ estado: 'error', error: String(e?.message || e).slice(0, 300) }, { merge: true });
      throw new HttpsError('unavailable', 'No se pudo abrir el pago en línea. Intenta de nuevo en un momento.');
    }
    await ref.set({ preferencia: pref.id || '' }, { merge: true });
    return { url: pref.init_point, id: ref.id };
  });

  /** Entrega lo pagado (una sola vez). Exportada para las pruebas. */
  async function entregarPago(pago) {
    const refId = String(pago?.external_reference || '');
    if (!refId || !/^[A-Za-z0-9]{10,40}$/.test(refId)) return { ok: false, motivo: 'sin_referencia' };
    const ref = db.collection('pagos_en_linea').doc(refId);
    let resultado = { ok: false, motivo: 'no_aprobado' };
    await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists) { resultado = { ok: false, motivo: 'pedido_desconocido' }; return; }
      const p = s.data();
      if (p.entregado) { resultado = { ok: true, yaEntregado: true }; return; }
      if (pago.status !== 'approved') { tx.set(ref, { estado: String(pago.status || ''), pagoId: String(pago.id || '') }, { merge: true }); return; }
      if (pago.currency_id !== 'PEN' || Number(pago.transaction_amount) + 0.001 < Number(p.monto)) {
        tx.set(ref, { estado: 'monto_no_coincide', pagoId: String(pago.id || '') }, { merge: true });
        resultado = { ok: false, motivo: 'monto' }; return;
      }
      const cfgSnap = await tx.get(db.collection('config_ia').doc('planes'));
      const cfg = cfgSnap.exists ? cfgSnap.data() : {};
      const refAcceso = db.collection('ai_access').doc(p.ws);
      const a = await tx.get(refAcceso);
      const actual = a.exists ? a.data() : null;
      let detalle = '';
      if (p.tipo === 'pack') {
        const base = actual || { userId: p.ws, planId: 'gratis', creditosRestantes: 0, mes: '', creditosExtra: CREDITOS_BIENVENIDA };
        const suma = !base.primeraRecarga && cfg?.primeraRecargaDoble !== false ? p.creditos * 2 : p.creditos;
        tx.set(refAcceso, { ...base, userId: p.ws, creditosExtra: (Number(base.creditosExtra) || 0) + suma, primeraRecarga: true }, { merge: true });
        detalle = `Recarga de ${p.creditos} créditos (Mercado Pago)${suma > p.creditos ? ` · primera recarga: ${suma}` : ''}`;
      } else {
        const guardados = Array.isArray(cfg?.planes) ? cfg.planes : [];
        const plan = (guardados.length ? guardados : PLANES_DEFAULT).find(x => x.id === p.planId) || { creditosMes: 0 };
        const vence = new Date(); vence.setMonth(vence.getMonth() + (p.periodo === 'anual' ? 12 : 1));
        tx.set(refAcceso, {
          ...(actual || {}), userId: p.ws, planId: p.planId, periodo: p.periodo, venceEl: vence.toISOString(),
          creditosRestantes: Number(plan.creditosMes) || 0, creditosMesPlan: Number(plan.creditosMes) || 0,
          creditosExtra: actual ? (Number(actual.creditosExtra) || 0) : CREDITOS_BIENVENIDA,
          mes: mesActual(), usosTotales: Number(actual?.usosTotales) || 0,
        });
        detalle = `Plan ${plan.nombre || p.planId} (${p.periodo}, Mercado Pago)`;
      }
      tx.set(ref, { estado: 'aprobado', entregado: true, pagoId: String(pago.id || ''), entregadoEl: new Date().toISOString() }, { merge: true });
      tx.set(db.collection('purchases').doc(), { userId: p.ws, userName: '', itemId: p.itemId, itemName: detalle, amount: p.monto, status: 'validada', origen: 'mercado_pago', orderId: String(pago.id || ''), voucherUrl: '', createdAt: new Date().toISOString() });
      resultado = { ok: true };
    });
    return resultado;
  }

  const webhookMercadoPago = onRequest({ secrets: ['MP_ACCESS_TOKEN'], region: 'us-central1', invoker: 'public' }, async (req, res) => {
    try {
      // Mercado Pago avisa con ?type=payment&data.id=… o con el cuerpo { type, data: { id } }.
      const tipo = String(req.body?.type || req.query?.type || req.query?.topic || '');
      const id = String(req.body?.data?.id || req.query?.['data.id'] || req.query?.id || '');
      if (tipo !== 'payment' || !/^\d{3,30}$/.test(id)) { res.status(200).send('ignorado'); return; }
      const pago = await llamarMP(`/v1/payments/${id}`);
      const r = await entregarPago(pago);
      res.status(200).json(r);
    } catch (e) {
      console.error('[MercadoPago] webhook', e?.message || e);
      res.status(500).send('error'); // Mercado Pago reintenta
    }
  });

  return { crearPagoEnLinea, webhookMercadoPago, entregarPago };
}
