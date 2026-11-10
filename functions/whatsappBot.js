// =============================================================================
// Asistente de WhatsApp (mismo número del dueño, en "coexistencia" con la app
// WhatsApp Business). Responde a los clientes, recibe la captura del Yape/Plin,
// la revisa (monto, N° de operación repetido, a nombre de quién) y deja el pedido
// "por aprobar". NADA se entrega sin el "sí" del dueño: al aprobar en
// Administración → WhatsApp se crea el acceso (PIN único) o se cargan los créditos
// y el PIN le llega al cliente por WhatsApp.
//
//   whatsappWebhook  (Meta llama aquí; se verifica la firma X-Hub-Signature-256)
//   aprobarPedidoWA({ id, aprobar, motivo?, userId? })  (solo admin)
//
// Secretos: WA_TOKEN (token permanente del usuario del sistema), WA_APP_SECRET
// (clave secreta de la app de Meta) y WA_VERIFY_TOKEN (palabra que se inventa el
// dueño y pega en Meta). Interruptor sin recompilar: wa_config/ajustes.activo (solo admin).
// Datos (solo servidor escribe, solo admin lee): wa_conversaciones/<telefono>,
// wa_pedidos/<id>, wa_capturas/<id>; wa_eventos/<id de mensaje> evita repetir.
// El asistente se presenta como "Asistente de InnovApp": nunca dice qué IA es,
// y si le preguntan si es un robot dice que es el asistente automático.
// =============================================================================
import { createHmac, timingSafeEqual } from 'node:crypto';

const GRAPH = 'https://graph.facebook.com/v21.0';
const APP_URL = 'https://innovacontratistas-434d2.web.app';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=pe.innovacontratistas.app';
export const PRECIO_ACCESO_DEFAULT = 50;
const MAX_HISTORIAL = 40;
const SILENCIO_DUENO_MS = 60 * 60 * 1000; // si el dueño escribe a mano, el asistente calla 1 h en ese chat
const TOPE_DIA_DEFAULT = 300;              // respuestas automáticas por día (todas las conversaciones)
const PACKS_DEFAULT = [{ creditos: 20, precioSoles: 3.9 }, { creditos: 50, precioSoles: 7.9 }, { creditos: 150, precioSoles: 19.9 }, { creditos: 500, precioSoles: 54.9 }];

export const normalizarOp = (c) => String(c || '').replace(/[^0-9a-z]/gi, '').toUpperCase();
const soloDigitos = (t) => String(t || '').replace(/\D/g, '');
const ahoraISO = () => new Date().toISOString();

/** Firma de Meta: sha256=<hmac del cuerpo crudo con la clave secreta de la app>. */
export function firmaValida(cuerpoCrudo, cabecera, secreto) {
  if (!secreto || !cuerpoCrudo || !/^sha256=[0-9a-f]{64}$/.test(String(cabecera || ''))) return false;
  const esperado = Buffer.from('sha256=' + createHmac('sha256', secreto).update(cuerpoCrudo).digest('hex'));
  const recibido = Buffer.from(String(cabecera));
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}

/** ¿El nombre de la captura coincide con el titular configurado? (primer nombre y un apellido). */
export function titularCoincide(leido, titular) {
  const pal = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/).filter((w) => w.length > 2);
  const a = pal(leido), b = pal(titular);
  if (!a.length || !b.length) return null; // no se puede saber
  return b.filter((w) => a.includes(w)).length >= Math.min(2, b.length);
}

export function crearWhatsappBot({ onRequest, onCall, HttpsError, db, Anthropic, enviarPush, modelo, guia, CREDITOS_BIENVENIDA, fetchWA = fetch, iaSimulada = null }) {
  const SECRETOS = ['WA_TOKEN', 'WA_APP_SECRET', 'WA_VERIFY_TOKEN', 'ANTHROPIC_API_KEY'];

  // ---------------------------------------------------------------- Meta (Graph API)
  const graph = async (ruta, { metodo = 'GET', cuerpo, crudo = false, url } = {}) => {
    const r = await fetchWA(url || `${GRAPH}${ruta}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${process.env.WA_TOKEN || ''}`, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
      ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
    });
    if (crudo) { if (!r.ok) throw new Error(`Meta ${r.status}`); return Buffer.from(await r.arrayBuffer()); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(`Meta ${r.status}: ${d?.error?.message || ''}`); e.codigo = d?.error?.code; throw e; }
    return d;
  };
  const enviarTexto = (numeroId, a, texto) => graph(`/${numeroId}/messages`, { metodo: 'POST', cuerpo: { messaging_product: 'whatsapp', to: a, type: 'text', text: { preview_url: true, body: String(texto).slice(0, 4000) } } });
  const enviarPlantilla = (numeroId, a, nombre, params) => graph(`/${numeroId}/messages`, { metodo: 'POST', cuerpo: {
    messaging_product: 'whatsapp', to: a, type: 'template',
    template: { name: nombre, language: { code: 'es' }, components: [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: String(t) })) }] },
  } });
  /** Texto libre si la ventana de 24 h está abierta; si no, la plantilla aprobada en Meta. */
  async function enviarConRespaldo(conv, texto, plantilla) {
    const abierta = conv.ultimoClienteEn && Date.now() - new Date(conv.ultimoClienteEn).getTime() < 23.5 * 3600 * 1000;
    if (abierta || !plantilla) { await enviarTexto(conv.numeroId, conv.telefono, texto); return 'texto'; }
    await enviarPlantilla(conv.numeroId, conv.telefono, plantilla.nombre, plantilla.params);
    return 'plantilla';
  }
  async function bajarImagen(mediaId) {
    const info = await graph(`/${mediaId}`);
    const bytes = await graph('', { url: info.url, crudo: true });
    return { base64: bytes.toString('base64'), mime: String(info.mime_type || 'image/jpeg').split(';')[0], bytes: bytes.length };
  }

  // ---------------------------------------------------------------- Datos
  const refConv = (tel) => db.collection('wa_conversaciones').doc(tel);
  async function leerAjustes() {
    const [w, p, d, pl] = await Promise.all([db.collection('wa_config').doc('ajustes').get(), ...['pago_directo', 'descargas', 'planes'].map((id) => db.collection('config_ia').doc(id).get())]);
    const wa = w.exists ? w.data() : {};
    const pago = p.exists ? p.data() : {};
    const planes = pl.exists ? pl.data() : {};
    const desc = d.exists ? d.data() : {};
    const packs = (Array.isArray(planes.packs) && planes.packs.length ? planes.packs : PACKS_DEFAULT).filter((k) => Number(k?.creditos) > 0 && Number(k?.precioSoles) > 0);
    return {
      activo: wa.activo === true,
      precioAcceso: Number(wa.precioAcceso) > 0 ? Number(wa.precioAcceso) : PRECIO_ACCESO_DEFAULT,
      nombre: String(wa.nombreAsistente || 'Asistente de InnovApp').slice(0, 60),
      transmision: wa.modoTransmision === true,
      avisarDudas: wa.avisarDudas !== false,
      topeDia: Number(wa.topeDia) > 0 ? Number(wa.topeDia) : TOPE_DIA_DEFAULT,
      notas: String(wa.notas || '').slice(0, 1500),
      plantillaAcceso: String(wa.plantillaAcceso || 'innovapp_acceso'),
      plantillaCreditos: String(wa.plantillaCreditos || 'innovapp_creditos'),
      yape: pago?.yape?.numero ? pago.yape : null,
      plin: pago?.plin?.numero ? pago.plin : null,
      packs,
      primeraDoble: planes.primeraRecargaDoble !== false,
      play: /^https:\/\/play\.google\.com\//.test(String(desc?.android?.url || '')) ? desc.android.url : PLAY_URL,
      web: APP_URL,
    };
  }
  async function guardarMensaje(tel, m, extra = {}) {
    const ref = refConv(tel);
    await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      const c = s.exists ? s.data() : {};
      const mensajes = [...(Array.isArray(c.mensajes) ? c.mensajes : []), m].slice(-MAX_HISTORIAL);
      tx.set(ref, { telefono: tel, mensajes, actualizado: m.fecha, ultimo: String(m.texto || '').slice(0, 120), ultimoDe: m.de, ...extra }, { merge: true });
    });
  }
  /** Tope diario de respuestas automáticas (protege el gasto). Devuelve false si se pasó. */
  async function contarUso(tope) {
    const ref = db.collection('wa_uso').doc(new Date().toISOString().slice(0, 10));
    let ok = true, avisar = false;
    await db.runTransaction(async (tx) => {
      const n = Number((await tx.get(ref)).data()?.n) || 0;
      ok = n < tope; avisar = n === tope;
      tx.set(ref, { n: n + 1 }, { merge: true });
    });
    if (avisar) await enviarPush({ aAdmin: true }, '⚠️ WhatsApp: tope del día', 'El asistente llegó a su tope de respuestas de hoy; los demás mensajes los ves tú.', 'whatsapp').catch(() => {});
    return ok;
  }

  // ---------------------------------------------------------------- IA
  const HERRAMIENTA = {
    name: 'responder',
    description: 'Respuesta para el cliente y qué pasa con la conversación.',
    input_schema: {
      type: 'object',
      properties: {
        mensaje: { type: 'string', description: 'Lo que se le escribe al cliente por WhatsApp (corto, cálido, español de Perú).' },
        accion: { type: 'string', enum: ['ninguna', 'quiere_acceso', 'quiere_creditos', 'avisar_dueno'], description: 'quiere_acceso/quiere_creditos: el cliente decidió comprar. avisar_dueno: algo que solo el dueño puede resolver.' },
        nombre: { type: 'string', description: 'Nombre completo del cliente si lo dio.' },
        creditos: { type: 'integer', description: 'Recarga elegida (cantidad de créditos), si quiere créditos.' },
        motivo: { type: 'string', description: 'Si avisar_dueno: qué necesita, en una frase.' },
      },
      required: ['mensaje', 'accion'],
    },
  };
  function sistema(aj) {
    const cuentas = [aj.yape && `Yape ${aj.yape.numero} a nombre de ${aj.yape.titular}`, aj.plin && `Plin ${aj.plin.numero} a nombre de ${aj.plin.titular}`].filter(Boolean).join(' o ');
    return [
      `Eres "${aj.nombre}", quien atiende el WhatsApp de InnovApp (Innova Contratistas). Español de Perú, cálido y corto (máximo 70 palabras), sin tecnicismos.`,
      'Nunca digas qué empresa, modelo o tecnología de IA eres. Si te preguntan si eres un robot o una persona, di con naturalidad que eres el asistente automático de InnovApp y que el equipo revisa los pagos y lo que haga falta. Nunca digas que eres humano.',
      `VENTAS. Acceso al sistema InnovApp: S/ ${aj.precioAcceso.toFixed(2)}. Incluye su PIN personal para entrar desde Android, la web o la PC. Si es pago único, mensual o anual, dilo SOLO si está en las notas del dueño; si no está y lo preguntan, di que el equipo se lo confirma y usa avisar_dueno.`,
      `Recargas de créditos de IA (no vencen): ${aj.packs.map((p) => `${p.creditos} créditos S/ ${Number(p.precioSoles).toFixed(2)}`).join('; ')}.${aj.primeraDoble ? ' La primera recarga vale el doble.' : ''}`,
      cuentas ? `Se paga por ${cuentas}. Pide el monto EXACTO.` : 'Aún no hay número de Yape configurado: si quiere pagar, usa avisar_dueno.',
      'PASOS para comprar: 1) confirma qué quiere (acceso o recarga), 2) da el monto y el número de Yape/Plin, 3) pide la CAPTURA del pago y su NOMBRE COMPLETO (para el acceso). Cuando el cliente decide comprar usa accion quiere_acceso o quiere_creditos.',
      'Tú NO entregas PIN ni créditos y no confirmas pagos: eso lo hace el equipo tras revisar la captura (normalmente en minutos). Nunca inventes un PIN, descuentos ni funciones.',
      'Si el cliente ya tiene acceso y olvidó su PIN, tiene un problema con su cuenta, pide factura, reclamo, devolución, precio especial, o algo que no sabes: dile que el equipo le responde pronto y usa avisar_dueno.',
      `Enlaces: Android ${aj.play} · Web y PC ${aj.web}`,
      aj.notas ? `NOTAS DEL DUEÑO (síguelas): ${aj.notas}` : '',
      '', 'GUÍA DE LA APP (para dudas de uso):', guia,
    ].filter(Boolean).join('\n');
  }
  async function pensarRespuesta(aj, conv) {
    if (iaSimulada) return iaSimulada.responder(conv);
    const hist = (conv.mensajes || []).filter((m) => m.texto && (m.de === 'cliente' || m.de === 'asistente' || m.de === 'dueno'))
      .slice(-14).map((m) => ({ role: m.de === 'cliente' ? 'user' : 'assistant', content: String(m.texto).slice(0, 1200) }));
    const unidos = [];
    hist.forEach((m) => { const u = unidos[unidos.length - 1]; if (u && u.role === m.role) u.content += '\n' + m.content; else unidos.push({ ...m }); });
    while (unidos.length && unidos[0].role !== 'user') unidos.shift();
    if (!unidos.length || unidos[unidos.length - 1].role !== 'user') return null;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
    const msg = await anthropic.messages.create({
      model: modelo, max_tokens: 700, system: sistema(aj), messages: unidos,
      tools: [HERRAMIENTA], tool_choice: { type: 'tool', name: 'responder' },
    });
    const b = (msg.content || []).find((x) => x.type === 'tool_use');
    return b?.input || null;
  }
  async function leerCaptura(img) {
    if (iaSimulada) return iaSimulada.leerCaptura(img);
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
    const msg = await anthropic.messages.create({
      model: modelo, max_tokens: 3000, output_config: { effort: 'low' },
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: img.mime, data: img.base64 } },
        { type: 'text', text: 'Si la imagen es una captura de un pago por billetera o transferencia (Yape, Plin, BCP, Interbank, BBVA…), responde SOLO un JSON {"esPago": true, "monto": number, "moneda": "PEN"|"USD", "nroOperacion": string|null, "destinatario": string|null, "fecha": "YYYY-MM-DD"|null, "metodo": string|null}. "destinatario" es a quién se le pagó. Si no es una captura de pago, responde {"esPago": false}.' },
      ] }],
    });
    const t = (msg.content || []).find((x) => x.type === 'text')?.text || '';
    const m = t.match(/\{[\s\S]*\}/);
    try { return m ? JSON.parse(m[0]) : { esPago: false }; } catch { return { esPago: false }; }
  }

  // ---------------------------------------------------------------- Revisión del pago
  async function opRepetida(op) {
    if (!op) return null;
    const crudo = String(op).trim();
    const norm = normalizarOp(op);
    const q = [
      db.collection('wa_pedidos').where('nroOperacionNorm', '==', norm).limit(1).get(),
      db.collection('purchases').where('nroOperacion', '==', crudo).limit(1).get(),
      db.collection('usuarios').where('pago.nroOperacion', '==', crudo).limit(1).get(),
    ];
    if (norm !== crudo) {
      q.push(db.collection('purchases').where('nroOperacion', '==', norm).limit(1).get());
      q.push(db.collection('usuarios').where('pago.nroOperacion', '==', norm).limit(1).get());
    }
    const r = await Promise.all(q);
    const hit = r.findIndex((s) => !s.empty);
    if (hit < 0) return null;
    const d = r[hit].docs[0].data() || {};
    return hit === 0 ? `pedido de WhatsApp de ${d.nombre || d.telefono || '—'}` : hit === 2 || hit === 4 ? `acceso de ${d.name || '—'}` : `compra de ${d.userName || d.userId || '—'}`;
  }

  async function recibirCaptura(aj, conv, mediaId, numeroId) {
    const tel = conv.telefono;
    let img;
    try { img = await bajarImagen(mediaId); } catch (e) { console.error('[WA] media', e?.message); }
    const lectura = img ? await leerCaptura(img).catch(() => ({ esPago: false })) : { esPago: false };
    if (!lectura?.esPago) return { texto: 'Recibí tu imagen 🙌 pero no logro ver un pago en ella. ¿Me envías la captura completa del Yape o Plin (donde se vea el monto y el N° de operación)?' };
    const quiere = conv.pedido || {};
    const tipo = quiere.tipo === 'creditos' ? 'creditos' : 'acceso';
    const pack = tipo === 'creditos' ? aj.packs.find((p) => Number(p.creditos) === Number(quiere.creditos)) || aj.packs.find((p) => Math.abs(Number(p.precioSoles) - Number(lectura.monto)) < 0.01) : null;
    const esperado = tipo === 'acceso' ? aj.precioAcceso : Number(pack?.precioSoles) || 0;
    const monto = Number(lectura.monto);
    const nro = lectura.nroOperacion ? String(lectura.nroOperacion).slice(0, 40) : '';
    const repetido = await opRepetida(nro);
    const titular = (lectura.metodo || '').toLowerCase().includes('plin') ? aj.plin?.titular || aj.yape?.titular : aj.yape?.titular || aj.plin?.titular;
    const ref = db.collection('wa_pedidos').doc();
    const pedido = {
      telefono: tel, numeroId, nombre: String(quiere.nombre || conv.nombrePerfil || '').slice(0, 80), nombrePerfil: conv.nombrePerfil || '',
      tipo, creditos: pack ? Number(pack.creditos) : 0, montoEsperado: esperado,
      montoLeido: Number.isFinite(monto) ? monto : null, moneda: lectura.moneda || 'PEN',
      montoOk: Number.isFinite(monto) && esperado > 0 && monto + 0.001 >= esperado && (lectura.moneda || 'PEN') === 'PEN',
      nroOperacion: nro, nroOperacionNorm: normalizarOp(nro), repetido: repetido || '',
      destinatario: String(lectura.destinatario || '').slice(0, 80), destinatarioOk: titularCoincide(lectura.destinatario, titular),
      metodo: String(lectura.metodo || '').slice(0, 30), fechaPago: lectura.fecha || '',
      tieneCaptura: false, estado: 'por_aprobar', creado: ahoraISO(),
    };
    await ref.set(pedido);
    if (img && img.bytes < 700 * 1024) {
      await db.collection('wa_capturas').doc(ref.id).set({ img: `data:${img.mime};base64,${img.base64}`, creado: ahoraISO() });
      await ref.set({ tieneCaptura: true }, { merge: true });
    }
    const alerta = repetido ? ' ⚠️ N° de operación REPETIDO' : !pedido.montoOk ? ' ⚠️ monto no coincide' : '';
    await enviarPush({ aAdmin: true }, '💰 Pago por aprobar (WhatsApp)' + alerta,
      `${pedido.nombre || tel}: ${tipo === 'acceso' ? 'acceso al sistema' : `${pedido.creditos} créditos`} · S/ ${Number.isFinite(monto) ? monto.toFixed(2) : '?'}${nro ? ` · Op. ${nro}` : ''}`, 'whatsapp').catch(() => {});
    const falta = tipo === 'acceso' && !quiere.nombre ? ' Mientras tanto, ¿me confirmas tu nombre completo para registrarte?' : '';
    return { texto: `¡Gracias! Recibí tu captura ✅ El equipo la revisa y en unos minutos te envío ${tipo === 'acceso' ? 'tu PIN de acceso' : 'la confirmación de tus créditos'} por aquí.${falta}`, pedidoId: ref.id };
  }

  // ---------------------------------------------------------------- Mensaje entrante
  async function procesarMensaje(aj, valor, m) {
    const tel = soloDigitos(m.from);
    if (!tel || !m.id) return;
    // Meta reintenta: cada mensaje se atiende una sola vez.
    try { await db.collection('wa_eventos').doc(String(m.id).slice(0, 200)).create({ creado: ahoraISO() }); } catch { return; }
    const numeroId = String(valor?.metadata?.phone_number_id || '');
    const perfil = (valor?.contacts || []).find((c) => soloDigitos(c.wa_id) === tel)?.profile?.name || '';
    const texto = m.type === 'text' ? String(m.text?.body || '') : m.type === 'image' ? `[imagen]${m.image?.caption ? ' ' + m.image.caption : ''}` : m.type === 'document' ? '[documento]' : m.type === 'audio' ? '[audio]' : `[${m.type}]`;
    const fecha = ahoraISO();
    await guardarMensaje(tel, { id: m.id, de: 'cliente', texto: texto.slice(0, 2000), fecha }, { numeroId, nombrePerfil: perfil, ultimoClienteEn: fecha, sinLeer: true });
    const conv = { ...((await refConv(tel).get()).data() || {}), telefono: tel, numeroId };
    if (!aj.activo) return; // apagado: el dueño atiende desde su celular como siempre
    if (conv.duenoHasta && new Date(conv.duenoHasta).getTime() > Date.now()) return; // el dueño está atendiendo este chat
    if (conv.pausado === true) return;
    if (!(await contarUso(aj.topeDia))) return;

    let salida = null, accion = 'ninguna', motivo = '';
    try {
      if (m.type === 'image' || (m.type === 'document' && /^image\//.test(m.document?.mime_type || ''))) {
        salida = await recibirCaptura(aj, conv, m.image?.id || m.document?.id, numeroId);
      } else if (m.type === 'audio') {
        salida = { texto: 'Disculpa, por ahora no puedo escuchar audios 🙏 ¿Me lo escribes en un mensaje?' };
      } else {
        const r = await pensarRespuesta(aj, conv);
        if (r?.mensaje) {
          salida = { texto: String(r.mensaje) };
          accion = r.accion || 'ninguna'; motivo = String(r.motivo || '');
          const pedido = { ...(conv.pedido || {}) };
          if (r.nombre) pedido.nombre = String(r.nombre).slice(0, 80);
          if (accion === 'quiere_acceso') pedido.tipo = 'acceso';
          if (accion === 'quiere_creditos') { pedido.tipo = 'creditos'; if (r.creditos) pedido.creditos = Number(r.creditos); }
          if (Object.keys(pedido).length) await refConv(tel).set({ pedido }, { merge: true });
          // El nombre llegó después de la captura: se completa el pedido que espera aprobación.
          if (r.nombre) {
            const pend = await db.collection('wa_pedidos').where('telefono', '==', tel).where('estado', '==', 'por_aprobar').get();
            await Promise.all(pend.docs.map((d) => d.ref.set({ nombre: String(r.nombre).slice(0, 80) }, { merge: true })));
          }
        }
      }
    } catch (e) {
      console.error('[WA] respuesta', e?.status || '', e?.message || e);
      accion = 'avisar_dueno'; motivo = 'El asistente no pudo responder (revisa el saldo de la IA).';
    }
    if (salida?.texto) {
      try {
        const env = await enviarTexto(numeroId, tel, salida.texto);
        await guardarMensaje(tel, { id: env?.messages?.[0]?.id || `a${Date.now()}`, de: 'asistente', texto: salida.texto.slice(0, 2000), fecha: ahoraISO() });
      } catch (e) { console.error('[WA] envío', e?.message); }
    }
    if (accion === 'avisar_dueno') {
      await refConv(tel).set({ necesitaDueno: motivo || 'Consulta', necesitaDuenoEn: ahoraISO() }, { merge: true });
      if (aj.avisarDudas && !aj.transmision) await enviarPush({ aAdmin: true }, '💬 WhatsApp: te necesitan', `${conv.pedido?.nombre || conv.nombrePerfil || tel}: ${motivo || 'consulta'}`, 'whatsapp').catch(() => {});
    }
  }

  /** Mensajes que el dueño escribió desde su celular (coexistencia): el asistente se calla en ese chat. */
  async function procesarEco(e) {
    const tel = soloDigitos(e.to);
    if (!tel || !e.id) return;
    try { await db.collection('wa_eventos').doc(String(e.id).slice(0, 200)).create({ creado: ahoraISO() }); } catch { return; }
    const texto = e.type === 'text' ? String(e.text?.body || '') : `[${e.type || 'mensaje'}]`;
    await guardarMensaje(tel, { id: e.id, de: 'dueno', texto: texto.slice(0, 2000), fecha: ahoraISO() }, { duenoHasta: new Date(Date.now() + SILENCIO_DUENO_MS).toISOString() });
  }

  async function procesarCuerpo(cuerpo) {
    const aj = await leerAjustes();
    for (const entry of cuerpo?.entry || []) {
      for (const ch of entry?.changes || []) {
        const v = ch?.value || {};
        if (ch.field === 'messages') for (const m of v.messages || []) await procesarMensaje(aj, v, m);
        if (ch.field === 'smb_message_echoes') for (const e of v.message_echoes || []) await procesarEco(e);
      }
    }
  }

  const whatsappWebhook = onRequest({ secrets: SECRETOS, region: 'us-central1', invoker: 'public', memory: '512MiB', timeoutSeconds: 120 }, async (req, res) => {
    if (req.method === 'GET') {
      const ok = req.query?.['hub.mode'] === 'subscribe' && process.env.WA_VERIFY_TOKEN && req.query?.['hub.verify_token'] === process.env.WA_VERIFY_TOKEN;
      if (ok) res.status(200).send(String(req.query['hub.challenge'] || '')); else res.status(403).send('no');
      return;
    }
    if (req.method !== 'POST') { res.status(405).send('no'); return; }
    if (!firmaValida(req.rawBody, req.get?.('x-hub-signature-256') || req.headers?.['x-hub-signature-256'], process.env.WA_APP_SECRET)) { res.status(401).send('firma'); return; }
    try { await procesarCuerpo(req.body); } catch (e) { console.error('[WA] webhook', e?.message || e); }
    res.status(200).send('ok'); // siempre 200: cada mensaje ya quedó anotado y no se repite
  });

  // ---------------------------------------------------------------- Aprobación del dueño
  async function pinUnico() {
    for (let i = 0; i < 30; i++) {
      const pin = String(100000 + Math.floor(Math.random() * 900000));
      if (pin === '123456' || (process.env.ADMIN_PIN && pin === String(process.env.ADMIN_PIN).trim())) continue;
      if ((await db.collection('usuarios').where('pin', '==', pin).limit(1).get()).empty) return pin;
    }
    throw new HttpsError('internal', 'No se pudo generar un PIN. Intenta de nuevo.');
  }
  async function sumarCreditos(ws, creditos, primeraDoble) {
    const ref = db.collection('ai_access').doc(ws);
    let suma = creditos;
    await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      const base = s.exists ? s.data() : { userId: ws, planId: 'gratis', creditosRestantes: 0, mes: '', creditosExtra: CREDITOS_BIENVENIDA };
      suma = !base.primeraRecarga && primeraDoble ? creditos * 2 : creditos;
      tx.set(ref, { ...base, userId: ws, creditosExtra: (Number(base.creditosExtra) || 0) + suma, primeraRecarga: true }, { merge: true });
    });
    return suma;
  }

  /** Lo que hace el "sí" del dueño. Exportada para las pruebas. */
  async function aprobar({ id, aprobar: si, motivo = '', userId = '', nombre = '', creditos = 0 }) {
    const ref = db.collection('wa_pedidos').doc(String(id || ''));
    let p;
    // Se marca "en proceso" en una transacción: dos toques seguidos no crean dos accesos.
    await db.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      if (!s.exists) throw new HttpsError('not-found', 'Ese pedido ya no existe.');
      p = s.data();
      if (p.estado !== 'por_aprobar') throw new HttpsError('failed-precondition', 'Ese pedido ya fue atendido.');
      tx.set(ref, { estado: 'procesando' }, { merge: true });
    });
    const aj = await leerAjustes();
    const conv = { ...((await refConv(p.telefono).get()).data() || {}), telefono: p.telefono, numeroId: p.numeroId };
    const quien = String(nombre || p.nombre || p.nombrePerfil || 'Cliente WhatsApp').trim().slice(0, 80);
    try {
      if (!si) {
        const texto = `Hola${quien ? ' ' + quien.split(' ')[0] : ''}, no pudimos validar tu pago${motivo ? `: ${motivo}` : '.'} Si crees que es un error, respóndeme por aquí y lo revisamos 🙏`;
        await ref.set({ estado: 'rechazado', motivo: String(motivo).slice(0, 200), atendido: ahoraISO() }, { merge: true });
        const via = await enviarConRespaldo(conv, texto, null).catch((e) => { console.error('[WA] rechazo', e?.message); return 'no_enviado'; });
        if (via !== 'no_enviado') await guardarMensaje(p.telefono, { id: `r${Date.now()}`, de: 'asistente', texto, fecha: ahoraISO() });
        return { ok: true, enviado: via };
      }
      let resultado, texto, plantilla;
      const pago = { ...(p.nroOperacion ? { nroOperacion: p.nroOperacion } : {}), ...(p.montoLeido != null ? { monto: p.montoLeido } : {}), ...(p.fechaPago ? { fecha: p.fechaPago } : {}), metodo: p.metodo || 'Yape' };
      if (p.tipo === 'acceso') {
        const pin = await pinUnico();
        const uid = 'usr_' + Date.now();
        await db.collection('usuarios').doc(uid).set({
          id: uid, userId: 'admin', name: quien, role: 'Colaborador', pin, isActive: true, lastLogin: '', lastLoginTimestamp: Date.now(),
          pago, origen: 'whatsapp', telefono: p.telefono, creadoEl: ahoraISO(),
        });
        await db.collection('purchases').add({ userId: uid, userName: quien, itemId: 'acceso_sistema', itemName: 'Acceso al sistema (WhatsApp)', amount: p.montoLeido ?? p.montoEsperado, status: 'validada', origen: 'whatsapp', metodo: (p.metodo || '').toLowerCase().includes('plin') ? 'plin' : 'yape', nroOperacion: p.nroOperacion || '', voucherUrl: '', createdAt: ahoraISO() });
        resultado = { uid, pin };
        texto = `¡Listo, ${quien.split(' ')[0]}! ✅ Tu acceso a InnovApp ya está activo.\n\n🔑 Tu PIN: *${pin}*\n\n📱 Android: ${aj.play}\n💻 Web y PC: ${aj.web}\n\nAbre la app y escribe tu PIN. Es personal, no lo compartas. Cualquier duda, escríbeme por aquí.`;
        plantilla = { nombre: aj.plantillaAcceso, params: [quien.split(' ')[0], pin] };
        await refConv(p.telefono).set({ userId: uid, pedido: {} }, { merge: true });
      } else {
        if (Number(creditos) > 0) p.creditos = Math.round(Number(creditos));
        if (!(Number(p.creditos) > 0)) throw new HttpsError('failed-precondition', 'ELEGIR_RECARGA');
        const ws = String(userId || conv.userId || '').replace(/^user_/, '');
        if (!ws) throw new HttpsError('failed-precondition', 'ELEGIR_USUARIO');
        const u = await db.collection('usuarios').doc(ws).get();
        if (!u.exists) throw new HttpsError('failed-precondition', 'ELEGIR_USUARIO');
        const suma = await sumarCreditos(ws, Number(p.creditos) || 0, aj.primeraDoble);
        await db.collection('purchases').add({ userId: ws, userName: u.data()?.name || quien, itemId: `ai_creditos_${p.creditos}`, itemName: `Recarga de ${p.creditos} créditos (WhatsApp)${suma > p.creditos ? ` · primera recarga: ${suma}` : ''}`, amount: p.montoLeido ?? p.montoEsperado, status: 'validada', origen: 'whatsapp', nroOperacion: p.nroOperacion || '', voucherUrl: '', createdAt: ahoraISO() });
        resultado = { uid: ws, creditos: suma };
        texto = `¡Listo! ✅ Ya cargamos *${suma} créditos* a tu cuenta de InnovApp${suma > p.creditos ? ' (tu primera recarga vale el doble 🎁)' : ''}. Ya puedes usarlos.`;
        plantilla = { nombre: aj.plantillaCreditos, params: [String(suma)] };
        await refConv(p.telefono).set({ userId: ws, pedido: {} }, { merge: true });
      }
      await ref.set({ estado: 'aprobado', atendido: ahoraISO(), userId: resultado.uid, nombre: quien }, { merge: true });
      let via = 'no_enviado';
      try { via = await enviarConRespaldo(conv, texto, plantilla); } catch (e) { console.error('[WA] envío PIN', e?.message); }
      await ref.set({ enviado: via }, { merge: true });
      if (via !== 'no_enviado') await guardarMensaje(p.telefono, { id: `p${Date.now()}`, de: 'asistente', texto: texto.replace(/\*\d{6}\*/, '*••••••*'), fecha: ahoraISO() });
      return { ok: true, ...resultado, enviado: via };
    } catch (e) {
      // Algo falló antes de terminar: el pedido vuelve a "por aprobar" (si no se llegó a crear nada).
      const s = (await ref.get()).data() || {};
      if (s.estado === 'procesando') await ref.set({ estado: 'por_aprobar' }, { merge: true });
      throw e;
    }
  }

  const aprobarPedidoWA = onCall({ secrets: ['WA_TOKEN', 'ADMIN_PIN'], region: 'us-central1', cors: true, invoker: 'public' }, async (request) => {
    if (request.auth?.token?.role !== 'admin') throw new HttpsError('permission-denied', 'Solo el administrador.');
    const d = request.data || {};
    return aprobar({ id: d.id, aprobar: d.aprobar === true, motivo: String(d.motivo || '').slice(0, 200), userId: String(d.userId || ''), nombre: String(d.nombre || ''), creditos: Number(d.creditos) || 0 });
  });

  return { whatsappWebhook, aprobarPedidoWA, procesarCuerpo, aprobar };
}
