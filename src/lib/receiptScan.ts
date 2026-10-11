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
}

export interface ScanResult {
  source: 'qr' | 'ia' | 'none';
  data: ReceiptData;
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

/** Llama a la Cloud Function de IA de visión (requiere despliegue). */
export async function scanReceiptWithAI(dataUrl: string, region = 'us-central1'): Promise<ReceiptData> {
  const base64 = dataUrl.split(',')[1] || '';
  const functions = getFunctions(app, region);
  const callable = httpsCallable<{ imageBase64: string; mimeType: string }, ReceiptData>(functions, 'scanReceipt');
  const { data } = await callable({ imageBase64: base64, mimeType: 'image/jpeg' });
  return data || {};
}

/**
 * Escanea un comprobante: primero QR (gratis), si no hay, IA de visión.
 * Lanza error solo si ninguna vía obtuvo datos.
 */
export async function scanReceipt(file: File): Promise<ScanResult> {
  const { imageData, dataUrl } = await fileToImageData(file);

  // 1) QR
  const qrText = await decodeQr(imageData);
  if (qrText) {
    const parsed = parseSunatQr(qrText);
    if (parsed && (parsed.total !== undefined || parsed.ruc)) {
      return { source: 'qr', data: parsed };
    }
  }

  // 2) IA de visión (fallback)
  const ai = await scanReceiptWithAI(dataUrl);
  if (ai && (ai.total !== undefined || ai.proveedor || ai.ruc)) {
    return { source: 'ia', data: ai };
  }

  return { source: 'none', data: {} };
}
