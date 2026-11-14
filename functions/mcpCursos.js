// MCP de Academia (cursos y clases) para Innova Contratistas.
//
// Servidor MCP (Model Context Protocol, transporte "Streamable HTTP" sin sesión) que deja a un
// asistente de IA cargar contenido en la Academia igual que el panel del administrador:
//   - `cursos/<id>`     → CourseCategory  (mismos campos que UsabilidadVideosView)
//   - `tutoriales/<id>` → TutorialVideo   (la clase pertenece al curso por `category` = nombre del curso)
//   - Storage `academia/mcp/...` → videos, portadas y materiales (enlace con token, como la app).
// Escribe con el Admin SDK, así que las reglas no cambian. Los avisos push (avisoClaseNueva, etc.)
// se disparan solos como cuando el admin sube una clase.
//
// Seguridad: TODA llamada exige la clave secreta MCP_CLAVE (encabezado `Authorization: Bearer <clave>`
// o `?clave=<clave>` en la URL del conector). Sin clave → 401. No hay herramientas para borrar.
//
// Despliegue:  firebase functions:secrets:set MCP_CLAVE   (una clave larga, p. ej. 40 caracteres)
//              firebase deploy --only functions:mcpCursos
// Conector en Claude: URL https://us-central1-<proyecto>.cloudfunctions.net/mcpCursos?clave=<MCP_CLAVE>

import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

const VERSIONES = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_BYTES = 300 * 1024 * 1024; // mismo tope que las reglas de Storage para la Academia
const hoy = () => new Date().toISOString().split('T')[0];
const igualSeguro = (a, b) => {
  const h = (s) => createHash('sha256').update(String(s)).digest();
  try { return timingSafeEqual(h(a), h(b)); } catch { return false; }
};
const mismoNombre = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const num = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));
const sinIndefinidos = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const ADJUNTOS = {
  type: 'array',
  description: 'Material descargable (PDF, imágenes, planos). Cada uno: {nombre, url, tipo (MIME), tamano en bytes}. Usa subir_archivo para obtener la url.',
  items: {
    type: 'object',
    properties: { nombre: { type: 'string' }, url: { type: 'string' }, tipo: { type: 'string' }, tamano: { type: 'number' } },
    required: ['nombre', 'url'],
  },
};

export const HERRAMIENTAS = [
  {
    name: 'listar_cursos',
    description: 'Lista los cursos de la Academia con precio, estado y sus clases (id, título, si es gratis). Úsalo antes de crear para no duplicar.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'guardar_curso',
    description: 'Crea o actualiza un curso (carpeta de clases). Si no das id, busca por nombre; si no existe, lo crea. Conserva los alumnos que ya compraron.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'id del curso a editar (opcional)' },
        nombre: { type: 'string' },
        descripcion: { type: 'string' },
        gratis: { type: 'boolean', description: 'false = curso de pago' },
        precioSoles: { type: 'number', description: 'Precio general del curso en soles' },
        precioAntesSoles: { type: 'number', description: 'Precio tachado (mayor que precioSoles)' },
        descuentoPct: { type: 'number' },
        descuentoHasta: { type: 'string', description: 'Fecha ISO en que termina el descuento' },
        precioCreditos: { type: 'number', description: 'Precio en créditos (si falta: 10 créditos por sol)' },
        destacado: { type: 'boolean' },
        enSlider: { type: 'boolean', description: 'Aparece en el carrusel de arriba' },
        portadaUrl: { type: 'string' },
        adjuntos: ADJUNTOS,
      },
      required: ['nombre'],
    },
  },
  {
    name: 'guardar_clase',
    description: 'Crea o actualiza una clase (video) dentro de un curso existente. Sin id crea una clase nueva (avisa por push a quien tenga acceso).',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'id de la clase a editar (opcional)' },
        curso: { type: 'string', description: 'Nombre exacto del curso (ver listar_cursos)' },
        titulo: { type: 'string' },
        descripcion: { type: 'string' },
        videoUrl: { type: 'string', description: 'MP4 subido con subir_archivo, o enlace de YouTube / Drive' },
        portadaUrl: { type: 'string' },
        gratis: { type: 'boolean', description: 'true = clase de muestra gratis dentro de un curso de pago' },
        precioSoles: { type: 'number', description: 'Precio de la clase suelta (opcional)' },
        destacado: { type: 'boolean' },
        enSlider: { type: 'boolean' },
        adjuntos: ADJUNTOS,
      },
      required: ['curso', 'titulo'],
    },
  },
  {
    name: 'subir_archivo',
    description: 'Sube un archivo (video, portada, PDF) a Storage y devuelve su url pública con token. Da una url https de origen o el contenido en base64 (solo archivos pequeños).',
    inputSchema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre del archivo con extensión, p. ej. portada-soldadura.png' },
        url: { type: 'string', description: 'https de donde descargarlo' },
        base64: { type: 'string' },
        tipo: { type: 'string', description: 'MIME (opcional; se deduce de la extensión)' },
        carpeta: { type: 'string', description: 'Subcarpeta, p. ej. soldadura (opcional)' },
      },
      required: ['nombre'],
    },
  },
];

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf', mp4: 'video/mp4', dwg: 'application/acad', dxf: 'application/dxf', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip: 'application/zip' };
const limpiarNombre = (s) => String(s || 'archivo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'archivo';

/** Lógica de las herramientas, separada de HTTP para poder probarla con una base simulada. */
export function crearAcademia({ db, bucket, fetchFn = fetch, ahora = () => Date.now() }) {
  const cursos = () => db.collection('cursos');
  const clases = () => db.collection('tutoriales');
  const todos = async (col) => (await col.get()).docs.map((d) => ({ id: d.id, ...d.data() }));
  const nuevoId = (prefijo) => `${prefijo}-${ahora()}-${randomUUID().slice(0, 6)}`;

  async function listar_cursos() {
    const [cs, vs] = await Promise.all([todos(cursos()), todos(clases())]);
    return cs.map((c) => ({
      id: c.id, nombre: c.name, descripcion: c.description || '', gratis: c.isFree !== false,
      precioSoles: c.priceSoles || 0, precioAntesSoles: c.precioAntesSoles, descuentoPct: c.discountPercentage || 0,
      destacado: !!c.isFeatured, enSlider: !!c.enSlider, portadaUrl: c.portadaUrl || '',
      adjuntos: (c.adjuntos || []).map((a) => a.nombre), alumnos: (c.allowedUserIds || []).length,
      clases: vs.filter((v) => mismoNombre(v.category, c.name)).map((v) => ({ id: v.id, titulo: v.title, gratis: v.isFree !== false, tieneVideo: !!v.videoUrl })),
    }));
  }

  async function guardar_curso(a) {
    const pedido = String(a.nombre || '').trim();
    if (!pedido) throw new Error('Falta el nombre del curso.');
    const lista = await todos(cursos());
    const existente = a.id ? lista.find((c) => c.id === a.id) : lista.find((c) => mismoNombre(c.name, pedido));
    if (a.id && !existente) throw new Error(`No existe un curso con id ${a.id}.`);
    // Solo se renombra con id; si se encontró por nombre se conserva cómo está escrito.
    const nombre = a.id ? pedido : existente?.name || pedido;
    if (lista.some((c) => c.id !== existente?.id && mismoNombre(c.name, nombre))) throw new Error(`Ya hay otro curso llamado "${nombre}".`);
    const gratis = a.gratis ?? (existente ? existente.isFree !== false : false);
    const precio = gratis ? 0 : num(a.precioSoles) ?? existente?.priceSoles ?? 0;
    if (!gratis && !(precio > 0)) throw new Error('Un curso de pago necesita precioSoles mayor que 0.');
    const antes = num(a.precioAntesSoles);
    const datos = sinIndefinidos({
      name: nombre,
      description: a.descripcion !== undefined ? String(a.descripcion) : undefined,
      isFree: gratis,
      priceSoles: precio,
      precioAntesSoles: gratis ? undefined : antes !== undefined ? (antes > precio ? antes : undefined) : undefined,
      discountPercentage: gratis ? 0 : num(a.descuentoPct),
      discountExpiryDate: a.descuentoHasta !== undefined ? (a.descuentoHasta ? new Date(a.descuentoHasta).toISOString() : '') : undefined,
      precioCreditos: num(a.precioCreditos),
      isFeatured: a.destacado,
      enSlider: a.enSlider,
      portadaUrl: a.portadaUrl,
      adjuntos: a.adjuntos,
    });
    if (existente) {
      await cursos().doc(existente.id).set(datos, { merge: true });
      // Renombrar el curso arrastra sus clases (la clase se une al curso por el nombre).
      if (!mismoNombre(existente.name, nombre)) {
        const suyas = (await todos(clases())).filter((v) => mismoNombre(v.category, existente.name));
        await Promise.all(suyas.map((v) => clases().doc(v.id).set({ category: nombre }, { merge: true })));
      }
      return { ok: true, accion: 'actualizado', id: existente.id, nombre };
    }
    const id = nuevoId('course');
    await cursos().doc(id).set({ ...datos, allowedUserIds: [], createdAt: hoy() });
    return { ok: true, accion: 'creado', id, nombre };
  }

  async function guardar_clase(a) {
    const titulo = String(a.titulo || '').trim();
    if (!titulo) throw new Error('Falta el título de la clase.');
    const curso = (await todos(cursos())).find((c) => mismoNombre(c.name, a.curso));
    if (!curso) throw new Error(`No existe el curso "${a.curso}". Créalo antes con guardar_curso.`);
    const base = sinIndefinidos({
      title: titulo,
      description: a.descripcion !== undefined ? String(a.descripcion) : undefined,
      category: curso.name,
      videoUrl: a.videoUrl,
      thumbnailUrl: a.portadaUrl,
      isFree: a.gratis,
      priceSoles: num(a.precioSoles),
      isFeatured: a.destacado,
      enSlider: a.enSlider,
      adjuntos: a.adjuntos,
    });
    if (a.id) {
      const ref = clases().doc(a.id);
      if (!(await ref.get()).exists) throw new Error(`No existe una clase con id ${a.id}.`);
      await ref.set(base, { merge: true });
      return { ok: true, accion: 'actualizada', id: a.id, curso: curso.name };
    }
    if (!base.videoUrl) throw new Error('Una clase nueva necesita videoUrl (sube el MP4 con subir_archivo).');
    // Por defecto la clase sigue al curso: si el curso es de pago, la clase también.
    const isFree = a.gratis ?? (curso.isFree !== false);
    const id = nuevoId('tut');
    await clases().doc(id).set({ ...base, isFree, isEmbed: false, allowedUserIds: [], createdAt: hoy() });
    return { ok: true, accion: 'creada', id, curso: curso.name };
  }

  async function subir_archivo(a) {
    const nombre = limpiarNombre(a.nombre);
    const ext = (nombre.split('.').pop() || '').toLowerCase();
    let datos; let tipo = a.tipo || MIME[ext] || 'application/octet-stream';
    if (a.base64) {
      datos = Buffer.from(String(a.base64).replace(/^data:[^,]*,/, ''), 'base64');
    } else if (a.url) {
      if (!/^https:\/\//i.test(a.url)) throw new Error('La url debe empezar con https://');
      const r = await fetchFn(a.url, { redirect: 'follow' });
      if (!r.ok) throw new Error(`No se pudo descargar (${r.status}).`);
      const largo = Number(r.headers.get('content-length') || 0);
      if (largo > MAX_BYTES) throw new Error('El archivo pasa de 300 MB.');
      datos = Buffer.from(await r.arrayBuffer());
      if (!a.tipo && !MIME[ext]) tipo = r.headers.get('content-type') || tipo;
    } else {
      throw new Error('Da una url https o el contenido en base64.');
    }
    if (!datos.length) throw new Error('El archivo está vacío.');
    if (datos.length > MAX_BYTES) throw new Error('El archivo pasa de 300 MB.');
    const carpeta = a.carpeta ? limpiarNombre(a.carpeta) : 'general';
    const ruta = `academia/mcp/${carpeta}/${ahora()}_${nombre}`;
    const token = randomUUID();
    await bucket.file(ruta).save(datos, { resumable: datos.length > 8 * 1024 * 1024, contentType: tipo, metadata: { metadata: { firebaseStorageDownloadTokens: token } } });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(ruta)}?alt=media&token=${token}`;
    return { ok: true, url, nombre, tipo, tamano: datos.length, ruta };
  }

  return { listar_cursos, guardar_curso, guardar_clase, subir_archivo };
}

/** Procesa un mensaje JSON-RPC del protocolo MCP. Devuelve la respuesta o null (notificaciones). */
export async function atenderMensaje(msg, academia) {
  const { id, method, params = {} } = msg || {};
  const esNotificacion = id === undefined || id === null;
  const ok = (result) => ({ jsonrpc: '2.0', id, result });
  const error = (code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
  if (!msg || msg.jsonrpc !== '2.0' || typeof method !== 'string') return error(-32600, 'Solicitud inválida');
  if (esNotificacion) return null;
  switch (method) {
    case 'initialize': {
      const pedida = params.protocolVersion;
      return ok({
        protocolVersion: VERSIONES.includes(pedida) ? pedida : VERSIONES[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'innova-academia', title: 'Academia Innova Contratistas', version: '1.0.0' },
        instructions: 'Carga cursos y clases en la Academia de InnovApp. Primero listar_cursos; sube archivos con subir_archivo y usa la url que devuelve. Los precios van en soles.',
      });
    }
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: HERRAMIENTAS });
    case 'tools/call': {
      const fn = academia[params.name];
      if (!HERRAMIENTAS.some((h) => h.name === params.name) || !fn) return error(-32602, `Herramienta desconocida: ${params.name}`);
      try {
        const r = await fn(params.arguments || {});
        return ok({ content: [{ type: 'text', text: JSON.stringify(r, null, 2) }], structuredContent: Array.isArray(r) ? { cursos: r } : r, isError: false });
      } catch (e) {
        return ok({ content: [{ type: 'text', text: `Error: ${e?.message || e}` }], isError: true });
      }
    }
    default: return error(-32601, `Método no soportado: ${method}`);
  }
}

/** Manejador HTTP (Express-like: req.method, req.headers, req.query, req.body; res.status().json()/send()). */
export function crearManejador({ obtenerClave, obtenerAcademia }) {
  return async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'authorization, content-type, mcp-protocol-version, mcp-session-id');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).send('');
    const clave = obtenerClave();
    const bearer = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    const dada = bearer || String(req.query?.clave || '');
    if (!clave || !dada || !igualSeguro(dada, clave)) return res.status(401).json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'No autorizado' } });
    if (req.method !== 'POST') return res.status(405).set('Allow', 'POST').send('Usa POST (MCP Streamable HTTP sin sesión).');
    let cuerpo = req.body;
    if (typeof cuerpo === 'string' || Buffer.isBuffer(cuerpo)) {
      try { cuerpo = JSON.parse(String(cuerpo)); } catch { return res.status(400).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } }); }
    }
    const academia = obtenerAcademia();
    const lote = Array.isArray(cuerpo);
    const respuestas = (await Promise.all((lote ? cuerpo : [cuerpo]).map((m) => atenderMensaje(m, academia)))).filter(Boolean);
    if (!respuestas.length) return res.status(202).send('');
    return res.status(200).json(lote ? respuestas : respuestas[0]);
  };
}

/** Fábrica de la Cloud Function (se exporta en index.js). */
export function crearMcpCursos({ onRequest, db, getStorage }) {
  let academia = null;
  const manejar = crearManejador({
    obtenerClave: () => process.env.MCP_CLAVE,
    obtenerAcademia: () => (academia ||= crearAcademia({ db, bucket: getStorage().bucket(process.env.MCP_BUCKET || 'innovacontratistas-434d2.firebasestorage.app') })),
  });
  return onRequest({ secrets: ['MCP_CLAVE'], region: 'us-central1', cors: false, memory: '1GiB', timeoutSeconds: 540, invoker: 'public' }, manejar);
}
