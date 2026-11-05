// =============================================================================
// Ayudas comunes para "Diseñar con IA" de Gasfitería y Electricidad
// (functions/gasfiteriaIA.js y functions/electricidadIA.js).
//
//  - Ambientes (rectángulos con nombre y medidas en metros) → muros del plano
//    (MuroRef de src/components/gasfiteria/modeloGasfiteria.ts) con sus puertas y ventanas.
//  - Pegar un aparato o punto a la pared que se indicó (y su giro `rot`).
//  - Revisar y resumir el plano actual que manda el cliente ("usar el plano de fondo").
//
// Coordenadas en metros, en planta: x a la derecha, y hacia ABAJO (como el SVG del plano).
// Todo lo que viene de la IA o del cliente se limita aquí (nunca se confía en ello).
// =============================================================================

export const numEntre = (v, a, b, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
export const r2 = (n) => Math.round(n * 100) / 100;
export const r3 = (n) => Math.round(n * 1000) / 1000;
const g05 = (n) => Math.round(n / 0.05) * 0.05;
export const textoSeguro = (v, max) => String(v || '').replace(/[<>{}`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export const LADOS = ['arriba', 'derecha', 'abajo', 'izquierda', 'ninguna'];
/** Giro del aparato/punto según el lado donde está su pared (espalda hacia -y local). */
export const ROT_LADO = { arriba: 0, derecha: 90, abajo: 180, izquierda: 270, ninguna: 0 };
const ESPESOR = 0.15;

/** Parte del esquema de la herramienta: ambientes rectangulares con puertas y ventanas. */
export const ESQUEMA_AMBIENTES = {
  type: 'array',
  description: 'Ambientes rectangulares de la planta (solo si NO hay plano actual). Máximo 16. Los ambientes vecinos comparten el borde exacto.',
  items: {
    type: 'object',
    properties: {
      nombre: { type: 'string', description: 'Ej. "Baño", "Cocina", "Dormitorio 1"' },
      x: { type: 'number', description: 'm, borde izquierdo del ambiente' },
      y: { type: 'number', description: 'm, borde de arriba del ambiente (y crece hacia abajo)' },
      ancho: { type: 'number', description: 'm, a lo largo de x' },
      largo: { type: 'number', description: 'm, a lo largo de y' },
      vanos: {
        type: 'array',
        description: 'Puertas y ventanas en los lados del ambiente.',
        items: {
          type: 'object',
          properties: {
            tipo: { type: 'string', enum: ['puerta', 'ventana'] },
            lado: { type: 'string', enum: ['arriba', 'derecha', 'abajo', 'izquierda'] },
            desde: { type: 'number', description: 'm desde la esquina izquierda (lados arriba/abajo) o de arriba (lados izquierda/derecha) del ambiente hasta el CENTRO del vano' },
            ancho: { type: 'number', description: 'm (puerta 0.90, baño 0.70; ventana 1.20)' },
          },
          required: ['tipo', 'lado', 'desde'],
        },
      },
    },
    required: ['nombre', 'x', 'y', 'ancho', 'largo'],
  },
};

/** Revisa los ambientes de la IA, los lleva al origen (0,0) y arma los muros sin repetir los compartidos. */
export function plantaDeAmbientes(lista) {
  let amb = (Array.isArray(lista) ? lista : []).slice(0, 16).map((a, i) => ({
    nombre: textoSeguro(a?.nombre, 24) || `Ambiente ${i + 1}`,
    x: g05(numEntre(a?.x, -5, 60, 0)), y: g05(numEntre(a?.y, -5, 60, 0)),
    ancho: g05(numEntre(a?.ancho, 0.8, 30, 3)), largo: g05(numEntre(a?.largo, 0.8, 30, 3)),
    vanos: (Array.isArray(a?.vanos) ? a.vanos : []).slice(0, 8),
  }));
  if (!amb.length) return { ambientes: [], muros: [], ancho: 0, largo: 0 };
  const x0 = Math.min(...amb.map((a) => a.x)), y0 = Math.min(...amb.map((a) => a.y));
  amb = amb.map((a) => ({ ...a, x: r2(a.x - x0), y: r2(a.y - y0) }));
  const ancho = r2(Math.max(...amb.map((a) => a.x + a.ancho)));
  const largo = r2(Math.max(...amb.map((a) => a.y + a.largo)));

  // Bordes de cada ambiente agrupados por línea (horizontal = y fija; vertical = x fija).
  const lineas = { h: [], v: [] };
  const linea = (o, c) => {
    let l = lineas[o].find((k) => Math.abs(k.c - c) <= 0.12);
    if (!l) { l = { c, tramos: [] }; lineas[o].push(l); }
    return l;
  };
  amb.forEach((a) => {
    linea('h', a.y).tramos.push([a.x, a.x + a.ancho]);
    linea('h', a.y + a.largo).tramos.push([a.x, a.x + a.ancho]);
    linea('v', a.x).tramos.push([a.y, a.y + a.largo]);
    linea('v', a.x + a.ancho).tramos.push([a.y, a.y + a.largo]);
  });
  const muros = [];
  ['h', 'v'].forEach((o) => lineas[o].forEach((l) => {
    const t = l.tramos.sort((p, q) => p[0] - q[0]);
    const unidos = [];
    t.forEach(([a, b]) => { const u = unidos[unidos.length - 1]; if (u && a <= u[1] + 0.12) u[1] = Math.max(u[1], b); else unidos.push([a, b]); });
    unidos.forEach(([a, b]) => {
      if (b - a < 0.3) return;
      muros.push(o === 'h' ? { x1: r2(a), y1: r2(l.c), x2: r2(b), y2: r2(l.c), a: ESPESOR, vanos: [] } : { x1: r2(l.c), y1: r2(a), x2: r2(l.c), y2: r2(b), a: ESPESOR, vanos: [] });
    });
  }));

  // Puertas y ventanas: se ubican en el muro que pasa por ese lado del ambiente.
  amb.forEach((a) => a.vanos.forEach((v) => {
    const lado = ['arriba', 'derecha', 'abajo', 'izquierda'].includes(v?.lado) ? v.lado : 'abajo';
    const puerta = v?.tipo !== 'ventana';
    const horiz = lado === 'arriba' || lado === 'abajo';
    const L = horiz ? a.ancho : a.largo;
    const w = r2(numEntre(v?.ancho, 0.5, Math.max(0.5, Math.min(3, L - 0.2)), puerta ? 0.9 : 1.2));
    const d = numEntre(v?.desde, w / 2, Math.max(w / 2, L - w / 2), L / 2);
    const p = lado === 'arriba' ? { x: a.x + d, y: a.y } : lado === 'abajo' ? { x: a.x + d, y: a.y + a.largo } : lado === 'izquierda' ? { x: a.x, y: a.y + d } : { x: a.x + a.ancho, y: a.y + d };
    const m = muros.find((k) => (horiz ? k.y1 === k.y2 && Math.abs(k.y1 - p.y) <= 0.13 && p.x >= k.x1 - 0.01 && p.x <= k.x2 + 0.01
      : k.x1 === k.x2 && Math.abs(k.x1 - p.x) <= 0.13 && p.y >= k.y1 - 0.01 && p.y <= k.y2 + 0.01));
    if (!m) return;
    const largoM = Math.hypot(m.x2 - m.x1, m.y2 - m.y1);
    const t = r2(numEntre(horiz ? p.x - m.x1 : p.y - m.y1, w / 2, Math.max(w / 2, largoM - w / 2), largoM / 2));
    if (m.vanos.some((k) => Math.abs(k.t - t) < (k.w + w) / 2)) return; // la misma puerta vista desde los dos ambientes
    if (m.vanos.length < 8) m.vanos.push({ t, w, puerta });
  }));
  muros.forEach((m) => { if (!m.vanos.length) delete m.vanos; });
  return { ambientes: amb.map(({ nombre, x, y, ancho: w, largo: l }) => ({ nombre, x, y, ancho: w, largo: l })), muros, ancho, largo };
}

/** Plano actual que manda el cliente (resumen): muros y referencias, todo limitado. */
export function fondoDelCliente(f) {
  const c = (v) => r2(numEntre(v, -20, 120, 0));
  const muros = (Array.isArray(f?.muros) ? f.muros : []).slice(0, 200).map((m) => ({
    x1: c(m?.x1), y1: c(m?.y1), x2: c(m?.x2), y2: c(m?.y2), a: r2(numEntre(m?.a, 0.05, 0.5, ESPESOR)),
    ...(Array.isArray(m?.vanos) && m.vanos.length ? { vanos: m.vanos.slice(0, 8).map((v) => ({ t: r2(numEntre(v?.t, 0, 120, 0)), w: r2(numEntre(v?.w, 0.2, 6, 0.9)), puerta: v?.puerta !== false })) } : {}),
  })).filter((m) => Math.hypot(m.x2 - m.x1, m.y2 - m.y1) >= 0.2);
  const items = (Array.isArray(f?.items) ? f.items : []).slice(0, 150).map((i) => ({ tipo: textoSeguro(i?.tipo, 24), x: c(i?.x), y: c(i?.y), ...(i?.nombre ? { nombre: textoSeguro(i.nombre, 28) } : {}) }));
  const refs = (Array.isArray(f?.refs) ? f.refs : []).slice(0, 80).map((i) => ({ etiqueta: textoSeguro(i?.etiqueta, 28), x: c(i?.x), y: c(i?.y), w: r2(numEntre(i?.w, 0, 40, 0.5)), d: r2(numEntre(i?.d, 0, 40, 0.5)) }));
  const ambientes = (Array.isArray(f?.ambientes) ? f.ambientes : []).slice(0, 24).map((a) => ({ nombre: textoSeguro(a?.nombre, 24), x: c(a?.x), y: c(a?.y) }));
  return { muros, items, refs, ambientes };
}

/** Caja que encierra los muros y las referencias (o un ambiente por defecto). */
export function cajaMuros(muros, refs = []) {
  if (!muros.length && !refs.length) return { x0: 0, y0: 0, x1: 6, y1: 5 };
  const xs = [...muros.flatMap((m) => [m.x1, m.x2]), ...refs.flatMap((r) => [r.x - r.w / 2, r.x + r.w / 2])];
  const ys = [...muros.flatMap((m) => [m.y1, m.y2]), ...refs.flatMap((r) => [r.y - r.d / 2, r.y + r.d / 2])];
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/**
 * Pega el objeto a la pared del lado indicado (la más cercana en esa dirección, a menos de `maxDist`).
 * `off` = distancia del eje del muro al centro del objeto. Devuelve { x, y } (sin cambios si no hay pared cerca).
 */
export function pegarAPared(p, lado, muros, off, maxDist = 0.9) {
  if (!lado || lado === 'ninguna') return p;
  const horiz = lado === 'arriba' || lado === 'abajo';
  let mejor = null;
  muros.forEach((m) => {
    if (horiz ? Math.abs(m.y1 - m.y2) > 0.01 : Math.abs(m.x1 - m.x2) > 0.01) return;
    const [a, b] = horiz ? [Math.min(m.x1, m.x2), Math.max(m.x1, m.x2)] : [Math.min(m.y1, m.y2), Math.max(m.y1, m.y2)];
    const s = horiz ? p.x : p.y;
    if (s < a - 0.05 || s > b + 0.05) return;
    const c = horiz ? m.y1 : m.x1;
    const d = lado === 'arriba' ? p.y - c : lado === 'abajo' ? c - p.y : lado === 'izquierda' ? p.x - c : c - p.x;
    if (d < -0.1 || d > maxDist) return;
    if (!mejor || d < mejor.d) mejor = { d, c, a: m.a || ESPESOR };
  });
  if (!mejor) return p;
  const o = off(mejor.a);
  if (lado === 'arriba') return { x: p.x, y: r3(mejor.c + o) };
  if (lado === 'abajo') return { x: p.x, y: r3(mejor.c - o) };
  if (lado === 'izquierda') return { x: r3(mejor.c + o), y: p.y };
  return { x: r3(mejor.c - o), y: p.y };
}

/** Bloque de la imagen o PDF adjunto (mismo formato que disenarObra). */
export function bloqueArchivo(imageBase64, mimeType) {
  if (imageBase64.length < 100) return null;
  return mimeType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: imageBase64 } }
    : { type: 'image', source: { type: 'base64', media_type: /^image\/(png|jpeg|webp|gif)$/.test(mimeType) ? mimeType : 'image/jpeg', data: imageBase64 } };
}

/** Entrada común: texto (limpio), archivo y plano actual. Lanza HttpsError si falta algo. */
export function leerPedido(request, HttpsError, queFalta) {
  const texto = textoSeguro(request.data?.texto, 1500);
  const imageBase64 = String(request.data?.imageBase64 || '');
  const mimeType = String(request.data?.mimeType || 'image/jpeg');
  if (texto.length < 5 && imageBase64.length < 100) throw new HttpsError('invalid-argument', queFalta);
  if (imageBase64.length > 9_000_000) throw new HttpsError('invalid-argument', 'El archivo pesa demasiado.');
  const fondo = request.data?.usarFondo === true ? fondoDelCliente(request.data?.fondo) : null;
  return { texto, imageBase64, mimeType, fondo: fondo && (fondo.muros.length || fondo.refs.length) ? fondo : null };
}
