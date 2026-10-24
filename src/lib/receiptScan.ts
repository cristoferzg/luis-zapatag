// ============================================================================
// Escaneo de comprobantes (boletas / facturas) para Materiales & Gastos.
//
// 1) QR (GRATIS, en el teléfono): la mayoría de comprobantes electrónicos SUNAT
//    traen un QR con los datos (RUC, serie-número, IGV, total, fecha). Se lee
//    con jsQR, sin servidor ni costo.
// 2) IA de visión (fallback): si no hay QR legible, se envía la foto a la
//    Cloud Function `scanReceipt`, que usa un modelo de visión para extraer los
//    campos. Requiere desplegar la función (plan Blaze) con la clave de API.
//
// Siempre con revisión humana: los datos se cargan al formulario y el usuario
// confirma antes de guardar.
// ============================================================================
import { motivoErrorIA } from './aiAccess';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import jsQR from 'jsqr';

export interface ReceiptData {
  proveedor?: string;   // Razón social / nombre del emisor
  ruc?: string;         // RUC del emisor
  fecha?: string;       // YYYY-MM-DD
  total?: number;       // Monto total pagado
  igv?: number;         // IGV
  moneda?: string;      // PEN / USD
  serie?: string;       // Serie-número del comprobante (F001-123)
  tipo?: string;        // Factura / Boleta / ...
  categoriaSugerida?: string; // Material / Transporte / ...
  descripcion?: string; // Texto sugerido para el campo "Descripción"
  detalle?: string;     // Qué se compró (resumen de los ítems del comprobante)
  metodoPago?: string;  // Efectivo / Yape / Plin / Transferencia BCP / Tarjeta ...
  nroOperacion?: string; // N° de operación (en pagos por billetera/transferencia)
}

export interface ScanResult {
  source: 'qr' | 'ia' | 'qr_ia' | 'none' | 'sin_ia';
  motivo?: 'agotado' | 'sin_plan'; // por qué no se usó la lectura inteligente (sin_ia)
  data: ReceiptData;
}

/**
 * Combina los datos del QR (montos 100% exactos de SUNAT) con los de la IA
 * (detalle de lo comprado, método de pago, proveedor legible). El QR manda en
 * los importes; la IA aporta todo lo que el QR no trae.
 */
function mergeQrAndAI(qr: ReceiptData, ai: ReceiptData): ReceiptData {
  const pick = <T,>(a: T | undefined, b: T | undefined) => (a !== undefined && a !== null && a !== '' ? a : b);
  return {
    ...ai,
    // El QR es la fuente exacta para los importes y la identidad del comprobante.
    ruc: pick(qr.ruc, ai.ruc),
    serie: pick(qr.serie, ai.serie),
    tipo: pick(qr.tipo, ai.tipo),
    igv: pick(qr.igv, ai.igv),
    total: pick(qr.total, ai.total),
    fecha: pick(qr.fecha, ai.fecha),
    moneda: pick(qr.moneda, ai.moneda)
  };
}

const TIPO_COMPROBANTE: Record<string, string> = {
  '01': 'Factura',
  '03': 'Boleta',
  '07': 'Nota de Crédito',
  '08': 'Nota de Débito'
};

/** Normaliza una fecha (YYYY-MM-DD o DD/MM/YYYY) a YYYY-MM-DD. */
function normalizarFecha(raw: string): string | undefined {
  const s = (raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    return `${m[3]}-${mo}-${d}`;
  }
  return undefined;
}

/**
 * Interpreta el contenido de un QR de comprobante electrónico SUNAT.
 * Formato (separado por "|"): RUC | tipo | serie | número | IGV | total |
 * fecha | tipoDocReceptor | numDocReceptor | [hash]
 */
export function parseSunatQr(text: string): ReceiptData | null {
  if (!text || text.indexOf('|') < 0) return null;
  const parts = text.split('|').map(p => p.trim());
  const ruc = parts[0];
  // El primer campo debe ser un RUC (11 dígitos) para considerarlo SUNAT.
  if (!/^\d{11}$/.test(ruc || '')) return null;

  const tipoCod = parts[1] || '';
  const serie = parts[2] || '';
  const numero = parts[3] || '';
  const igv = parseFloat(parts[4] || '');
  const total = parseFloat(parts[5] || '');
  const fecha = normalizarFecha(parts[6] || '');

  const tipo = TIPO_COMPROBANTE[tipoCod] || 'Comprobante';
  const serieNum = serie && numero ? `${serie}-${numero}` : (serie || numero || undefined);

  return {
    ruc,
    tipo,
    serie: serieNum,
    igv: Number.isFinite(igv) ? igv : undefined,
    total: Number.isFinite(total) ? total : undefined,
    fecha,
    moneda: 'PEN',
    descripcion: `${tipo} ${serieNum || ''} — RUC ${ruc}`.trim()
  };
}

/** Carga el archivo en un <img>, lo dibuja en canvas y devuelve ImageData. */
function fileToImageData(file: File, maxSide = 1600): Promise<{ imageData: ImageData; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxSide / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('no-canvas')); }
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        URL.revokeObjectURL(url);
        resolve({ imageData, dataUrl });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img-load')); };
    img.src = url;
  });
}

/** Intenta leer un QR de la imagen (BarcodeDetector nativo o jsQR). */
async function decodeQr(imageData: ImageData): Promise<string | null> {
  // 1) BarcodeDetector nativo (Android Chrome) si existe.
  try {
    const BD = (window as any).BarcodeDetector;
    if (BD) {
      const detector = new BD({ formats: ['qr_code'] });
      const bitmap = await createImageBitmap(
        new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height)
      );
      const codes = await detector.detect(bitmap);
      if (codes && codes.length && codes[0].rawValue) return codes[0].rawValue as string;
    }
  } catch (_) { /* seguimos con jsQR */ }

  // 2) jsQR (universal).
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
    return code?.data || null;
  } catch (_) {
    return null;
  }
}

/** Lee un archivo como base64 (sin el prefijo data:). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('read-error'));
    reader.readAsDataURL(file);
  });
}

/** Llama a la Cloud Function de IA de visión (requiere despliegue). */
export async function scanReceiptWithAI(base64: string, mimeType: string, region = 'us-central1'): Promise<ReceiptData> {
  const functions = getFunctions(app, region);
  const callable = httpsCallable<{ imageBase64: string; mimeType: string }, ReceiptData>(functions, 'scanReceipt');
  const { data } = await callable({ imageBase64: base64, mimeType });
  return data || {};
}

const isPdf = (file: File) =>
  file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');

/**
 * Escanea un comprobante (imagen o PDF): primero QR (gratis, solo imágenes),
 * si no hay, IA de visión. Lanza error solo si ninguna vía obtuvo datos.
 *
 * `allowAI` controla si se permite la lectura por IA (que tiene costo y se
 * limita por plan). El QR sigue siendo gratis para todos. Si allowAI es false
 * y no hay QR, se devuelve { source: 'sin_ia' } para que la vista ofrezca un
 * plan.
 */
export async function scanReceipt(file: File, allowAI = true, iaAunqueHayaQr = true): Promise<ScanResult> {
  // PDF: no tiene QR legible por cámara → va directo a IA (Claude lee el PDF).
  if (isPdf(file)) {
    if (!allowAI) return { source: 'sin_ia', data: {} };
    const base64 = await fileToBase64(file);
    let ai: ReceiptData;
    try { ai = await scanReceiptWithAI(base64, 'application/pdf'); }
    catch (e) { const m = motivoErrorIA(e); if (m) return { source: 'sin_ia', data: {}, motivo: m }; throw e; }
    if (ai && (ai.total !== undefined || ai.proveedor || ai.ruc)) {
      return { source: 'ia', data: ai };
    }
    return { source: 'none', data: {} };
  }

  const { imageData, dataUrl } = await fileToImageData(file);
  const base64 = dataUrl.split(',')[1] || '';

  // 1) QR SUNAT (gratis, en el teléfono): da montos exactos pero no el detalle.
  let qrData: ReceiptData | null = null;
  const qrText = await decodeQr(imageData);
  if (qrText) {
    const parsed = parseSunatQr(qrText);
    if (parsed && (parsed.total !== undefined || parsed.ruc)) {
      qrData = parsed;
    }
  }

  // 2) IA de visión: lee el DETALLE de lo comprado y, en billeteras
  //    (Yape/BCP/Plin), el método de pago y N° de operación. Si la función de
  //    IA no está desplegada o falla, seguimos con lo que dé el QR.
  //    Solo se intenta si el usuario tiene plan (allowAI). Si no, con el QR
  //    (gratis) basta; sin QR se avisa que se requiere plan.
  //    Con QR, la lectura inteligente (que gasta créditos) es opcional.
  let aiData: ReceiptData | null = null;
  let motivo: ScanResult['motivo'];
  if (allowAI && (!qrData || iaAunqueHayaQr)) {
    try {
      const ai = await scanReceiptWithAI(base64, 'image/jpeg');
      if (ai && (ai.total !== undefined || ai.proveedor || ai.ruc || ai.detalle || ai.metodoPago)) {
        aiData = ai;
      }
    } catch (e) {
      // Sin créditos o IA no disponible: no rompemos el flujo; usamos el QR si existe.
      motivo = motivoErrorIA(e) || undefined;
    }
  }

  // 3) Combinar según lo que se obtuvo.
  if (qrData && aiData) {
    return { source: 'qr_ia', data: mergeQrAndAI(qrData, aiData) };
  }
  if (qrData) {
    return { source: 'qr', data: qrData };
  }
  if (aiData) {
    return { source: 'ia', data: aiData };
  }

  // Sin QR y sin IA permitida (o sin créditos) → avisar que se necesita plan.
  if (!allowAI || motivo) return { source: 'sin_ia', data: {}, motivo };

  return { source: 'none', data: {} };
}
