// Aviso PERSONAL al comprador cuando el admin valida o rechaza su compra (Yape/Plin, WhatsApp…):
// llega a la campana de ESE usuario y como notificación del equipo (web, PC o celular).
// Nunca se publica como comunicado general ni sale en el carrusel de los demás.
import { useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { safeStorage } from './storageManager';
import { agregarABandeja } from './bandejaAvisos';
import { notificar } from './notificaciones';

export function useAvisosCompras(userId: string | undefined, uidBandeja: string | undefined, activo: boolean) {
  useEffect(() => {
    if (!activo || !userId || !uidBandeja) return;
    const clave = 'innova_compras_estado_' + uidBandeja;
    let des: (() => void) | undefined;
    // No hace falta para el Inicio: se conecta 8 s después de entrar.
    const t = setTimeout(() => { try {
      des = onSnapshot(query(collection(db, 'purchases'), where('userId', '==', userId)), snap => {
        const vistos = safeStorage.getItem<Record<string, string> | null>(clave, null);
        const ahora: Record<string, string> = {};
        const avisos: { id: string; titulo: string; cuerpo: string; vista: string }[] = [];
        snap.docs.forEach(d => {
          const p = d.data() as { status?: string; itemName?: string };
          const st = p.status || ''; ahora[d.id] = st;
          if (!vistos || vistos[d.id] === st || !vistos[d.id]) return; // la primera vez solo se memoriza
          if (st === 'validada') avisos.push({ id: `compra_${d.id}_ok`, titulo: '✅ ¡Tu compra está lista!', cuerpo: `${p.itemName || 'Tu compra'}: ya puedes usarla.`, vista: 'membresia' });
          if (st === 'rechazada') avisos.push({ id: `compra_${d.id}_no`, titulo: 'Tu pago no se pudo validar', cuerpo: `${p.itemName || 'Tu compra'}: revisa el monto o escríbenos por Ayuda y soporte.`, vista: 'membresia' });
        });
        safeStorage.setItem(clave, { ...(vistos || {}), ...ahora });
        if (!avisos.length) return;
        agregarABandeja(uidBandeja, avisos);
        avisos.forEach(a => notificar(a.titulo, a.cuerpo));
      }, () => { /* sin permiso o sin conexión: no pasa nada */ });
    } catch { /* sin Firestore */ } }, 8000);
    return () => { clearTimeout(t); try { des?.(); } catch { /* nada */ } };
  }, [userId, uidBandeja, activo]);
}

/** Los avisos viejos "Actualización de Compra" se publicaban para todos y sin vencimiento: no se muestran. */
export const esAvisoCompraViejo = (n: { title?: string }) => (n.title || '').trim() === 'Actualización de Compra';
