// Pago DIRECTO con Yape o Plin al número del dueño (web y programa de PC; nunca en la app de
// Android, que cobra solo con Google Play). El usuario ve el QR, el número y el monto exacto,
// paga desde su celular y sube la captura: queda una compra "pendiente" con su comprobante.
// El admin la lee gratis con el lector de comprobantes (N° de operación repetido = alerta) y
// la valida con un toque en Compras; los créditos se cargan solos y al comprador le llega su aviso.
// Configuración en config_ia/pago_directo (solo admin escribe; la leen los usuarios con sesión).
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
// La captura va en comprobantes/<idCompra> (NO dentro de la compra): la lista de compras se
// guarda en el equipo y con imágenes adentro se volvía pesada y lenta.
import { db } from './firebase';

export interface CuentaPago { numero: string; titular: string; qr?: string }
export interface ConfigPagoDirecto { activo: boolean; yape?: CuentaPago; plin?: CuentaPago }

const REF = () => doc(db, 'config_ia', 'pago_directo');
export async function leerPagoDirecto(): Promise<ConfigPagoDirecto | null> {
  if (import.meta.env.DEV && (window as any).__pagoDirectoSimulado) return (window as any).__pagoDirectoSimulado;
  try { const s = await getDoc(REF()); return s.exists() ? (s.data() as ConfigPagoDirecto) : null; } catch { return null; }
}
export async function guardarPagoDirecto(c: ConfigPagoDirecto): Promise<void> {
  await setDoc(REF(), JSON.parse(JSON.stringify(c)));
}
/** ¿Hay al menos una cuenta lista (número) y está activo? */
export const pagoDirectoListo = (c: ConfigPagoDirecto | null | undefined) => !!c?.activo && !!(c.yape?.numero || c.plin?.numero);

/** Reduce una imagen (captura o QR) para guardarla dentro del documento (máx. ~150 KB). */
export function comprimirImagen(file: File, lado = 1000, calidad = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const ctx = c.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); return; }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', calidad));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen.')); };
    img.src = url;
  });
}

export interface PedidoDirecto { itemId: string; itemName: string; amount: number }
/** Crea la compra pendiente con la captura del pago (la valida el admin). */
export async function enviarComprobante(userId: string, userName: string, p: PedidoDirecto, metodo: 'yape' | 'plin', captura: string): Promise<void> {
  if (import.meta.env.DEV && (window as any).__pagoDirectoSimulado) return;
  const ref = await addDoc(collection(db, 'purchases'), {
    userId, userName: userName || '', itemId: p.itemId, itemName: p.itemName, amount: p.amount,
    status: 'pendiente', voucherUrl: '', tieneComprobante: true, metodo, origen: 'pago_directo', createdAt: new Date().toISOString(),
  });
  await setDoc(doc(db, 'comprobantes', ref.id), { userId, img: captura, createdAt: new Date().toISOString() });
}

/** Captura de una compra (solo se descarga al pedirla). */
export async function leerComprobante(idCompra: string): Promise<string | null> {
  try { const s = await getDoc(doc(db, 'comprobantes', idCompra)); return (s.data() as any)?.img || null; } catch { return null; }
}
