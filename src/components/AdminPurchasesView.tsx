import { useState } from 'react';
import { updateRecord, useFirestoreArraySync } from '../lib/db';
import { Check, X, Eye } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CourseCategory, TutorialVideo } from './UsabilidadVideosView';
import { grantAIPlan } from '../lib/aiAccess';

interface Purchase {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  status: 'pendiente' | 'validada' | 'rechazada';
  voucherUrl: string;
  createdAt: string;
}

export default function AdminPurchasesView() {
  const [purchases] = useFirestoreArraySync<Purchase>('purchases', 'admin', true);
  const [cursos] = useFirestoreArraySync<CourseCategory>('cursos', 'admin', true);
  const [tutoriales] = useFirestoreArraySync<TutorialVideo>('tutoriales', 'admin', true);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Purchase['status']>('pendiente');

  const sendNotification = async (title: string, message: string) => {
    await addDoc(collection(db, 'notificaciones'), {
      title,
      message,
      createdAtTimestamp: Date.now(),
      priority: 'info',
      author: 'Administración',
    });
  };

  // Al validar una compra, HABILITA automáticamente el acceso: si el ítem es un
  // curso, se habilita el curso completo (todas sus clases); si es una clase
  // suelta, solo esa clase. Así "validar compra" realmente desbloquea el contenido.
  const grantAccess = async (purchase: Purchase) => {
    const uid = purchase.userId;
    if (!uid) return;
    // 0) ¿Es un PLAN DE IA? (itemId = 'ai_plan_<planId>') → activa el plan.
    if (purchase.itemId?.startsWith('ai_plan_')) {
      const planId = purchase.itemId.replace('ai_plan_', '');
      await grantAIPlan(uid, planId);
      return;
    }
    // 1) ¿El ítem es un CURSO? (por id o por nombre)
    const curso = cursos.find(c => c.id === purchase.itemId || c.name === purchase.itemName);
    if (curso) {
      const allowed = Array.from(new Set([...(curso.allowedUserIds || []), uid]));
      await updateRecord('cursos', curso.id, { ...curso, allowedUserIds: allowed });
      return;
    }
    // 2) ¿Es una CLASE suelta? (por id o por título)
    const video = tutoriales.find(v => v.id === purchase.itemId || v.title === purchase.itemName);
    if (video) {
      const allowed = Array.from(new Set([...(video.allowedUserIds || []), uid]));
      await updateRecord('tutoriales', video.id, { ...video, allowedUserIds: allowed });
    }
  };

  const handleUpdateStatus = async (purchase: Purchase, status: 'validada' | 'rechazada') => {
    await updateRecord('purchases', purchase.id, { ...purchase, status });
    if (status === 'validada') {
      await grantAccess(purchase);
    }
    const message = status === 'validada'
      ? `¡Tu compra de "${purchase.itemName}" fue validada! Tu acceso ya está habilitado.`
      : `Tu compra de ${purchase.itemName} ha sido rechazada.`;
    await sendNotification('Actualización de Compra', message);
  };

  const ESTADOS: { k: Purchase['status']; l: string }[] = [{ k: 'pendiente', l: 'Pendientes' }, { k: 'validada', l: 'Validadas' }, { k: 'rechazada', l: 'Rechazadas' }];
  const lista = purchases.filter(p => p.status === filtro).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-xs">
        <h2 className="text-xl font-black text-slate-900">Gestión de Compras y Vouchers</h2>
        <p className="text-sm text-slate-500 mt-0.5">Revisa el voucher de cada compra y valídala: el curso, la clase o el plan se habilitan solos al usuario.</p>
        <div className="mt-3 inline-flex p-1 bg-slate-100 rounded-xl">
          {ESTADOS.map(e => {
            const n = purchases.filter(p => p.status === e.k).length;
            return (
              <button key={e.k} onClick={() => setFiltro(e.k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${filtro === e.k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                {e.l} <span className="ml-1 text-[10px] font-black text-slate-400">{n}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-3">
        {lista.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 shadow-xs">
            <p className="font-bold text-slate-600">{filtro === 'pendiente' ? 'No hay compras por validar' : 'Sin registros'}</p>
            <p className="text-xs mt-1">{filtro === 'pendiente' ? 'Cuando un usuario suba un voucher aparecerá aquí.' : 'Aún no hay compras en este estado.'}</p>
          </div>
        )}
        {lista.map(purchase => (
          <div key={purchase.id} className="p-4 bg-white rounded-2xl shadow-xs flex justify-between items-center gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 truncate">{purchase.itemName}</h3>
              <p className="text-xs text-slate-500 truncate">Usuario: {purchase.userId}{purchase.createdAt ? ` · ${new Date(purchase.createdAt).toLocaleDateString('es-PE')}` : ''}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => setSelectedVoucher(purchase.voucherUrl)} title="Ver voucher" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"><Eye size={20} /></button>
              {purchase.status === 'pendiente' && (<>
                <button onClick={() => handleUpdateStatus(purchase, 'validada')} title="Validar" className="p-2 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer"><Check size={20} /></button>
                <button onClick={() => handleUpdateStatus(purchase, 'rechazada')} title="Rechazar" className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"><X size={20} /></button>
              </>)}
            </div>
          </div>
        ))}
      </div>
      {selectedVoucher && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedVoucher(null)}>
          <img src={selectedVoucher} alt="Voucher" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
