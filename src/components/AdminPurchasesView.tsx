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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestión de Compras y Vouchers</h2>
      <div className="grid gap-4">
        {purchases.filter(p => p.status === 'pendiente').map(purchase => (
          <div key={purchase.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{purchase.itemName}</h3>
              <p className="text-sm text-gray-500">Usuario ID: {purchase.userId}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedVoucher(purchase.voucherUrl)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Eye size={20} />
              </button>
              <button 
                onClick={() => handleUpdateStatus(purchase, 'validada')}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
              >
                <Check size={20} />
              </button>
              <button 
                onClick={() => handleUpdateStatus(purchase, 'rechazada')}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={() => setSelectedVoucher(null)}>
          <img src={selectedVoucher} alt="Voucher" className="max-w-full max-h-full" />
        </div>
      )}
    </div>
  );
}
