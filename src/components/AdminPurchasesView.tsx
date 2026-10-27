import { useState } from 'react';
import { updateRecord, useFirestoreArraySync } from '../lib/db';
import { Check, X, Eye, Search, Sparkles, Coins, GraduationCap, ScanLine } from 'lucide-react';
import LectorComprobante from './common/LectorComprobante';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CourseCategory, TutorialVideo } from './UsabilidadVideosView';
import { grantAIPlan, grantCreditos } from '../lib/aiAccess';

interface Purchase {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  status: 'pendiente' | 'validada' | 'rechazada';
  voucherUrl: string;
  createdAt: string;
  userName?: string;
  amount?: number;
  nroOperacion?: string;   // leído del comprobante por el admin
  montoPagado?: number;
}

export default function AdminPurchasesView() {
  const [purchases] = useFirestoreArraySync<Purchase>('purchases', 'admin', true);
  const [cursos] = useFirestoreArraySync<CourseCategory>('cursos', 'admin', true);
  const [tutoriales] = useFirestoreArraySync<TutorialVideo>('tutoriales', 'admin', true);
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Purchase['status']>('pendiente');
  const [busca, setBusca] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null); // compra con el lector abierto
  const [ocupado, setOcupado] = useState<string | null>(null);

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
      const [planId, periodo] = purchase.itemId.replace('ai_plan_', '').split('__');
      await grantAIPlan(uid, planId, periodo === 'anual' ? 'anual' : 'mensual');
      return;
    }
    // 0b) ¿Es una RECARGA de créditos? (itemId = 'ai_creditos_<n>')
    if (purchase.itemId?.startsWith('ai_creditos_')) {
      const n = parseInt(purchase.itemId.replace('ai_creditos_', ''), 10);
      if (n > 0) await grantCreditos(uid, n);
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
    const quien = purchase.userName || purchase.userId;
    if (!confirm(status === 'validada'
      ? `¿Validar "${purchase.itemName}" de ${quien}? Se habilita al instante.`
      : `¿Rechazar "${purchase.itemName}" de ${quien}?`)) return;
    setOcupado(purchase.id);
    try { await updateRecord('purchases', purchase.id, { ...purchase, status }); } finally { setOcupado(null); }
    if (status === 'validada') {
      await grantAccess(purchase);
    }
    const message = status === 'validada'
      ? `¡Tu compra de "${purchase.itemName}" fue validada! Tu acceso ya está habilitado.`
      : `Tu compra de ${purchase.itemName} ha sido rechazada.`;
    await sendNotification('Actualización de Compra', message);
  };

  const ESTADOS: { k: Purchase['status']; l: string }[] = [{ k: 'pendiente', l: 'Pendientes' }, { k: 'validada', l: 'Validadas' }, { k: 'rechazada', l: 'Rechazadas' }];
  const q = busca.trim().toLowerCase();
  const lista = purchases
    .filter(p => p.status === filtro)
    .filter(p => !q || [p.itemName, p.userName, p.userId, p.nroOperacion].some(v => (v || '').toLowerCase().includes(q)))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const S = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tipoDe = (p: Purchase) => p.itemId?.startsWith('ai_plan_') ? { l: 'Plan IA', Ic: Sparkles, c: 'bg-amber-100 text-amber-700' }
    : p.itemId?.startsWith('ai_creditos_') ? { l: 'Créditos', Ic: Coins, c: 'bg-violet-100 text-violet-700' }
    : { l: 'Curso / clase', Ic: GraduationCap, c: 'bg-sky-100 text-sky-700' };
  const fecha = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? '' : `${d.toLocaleDateString('es-PE')} · ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`; };
  const BADGE: Record<Purchase['status'], string> = { pendiente: 'bg-amber-50 text-amber-700 border-amber-200', validada: 'bg-emerald-50 text-emerald-700 border-emerald-200', rechazada: 'bg-rose-50 text-rose-700 border-rose-200' };

  return (
    <div className="space-y-4 min-w-0">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs">
        <h2 className="text-lg sm:text-xl font-black text-slate-900">Validar compras</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Lee el comprobante, revisa el código y el monto, y valida: el plan, los créditos o el curso se habilitan solos.</p>
        <div className="mt-3 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
          {ESTADOS.map(e => {
            const n = purchases.filter(p => p.status === e.k).length;
            return (
              <button key={e.k} onClick={() => setFiltro(e.k)}
                className={`px-1 py-2 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap cursor-pointer ${filtro === e.k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}>
                {e.l} <span className={`ml-0.5 inline-block min-w-[18px] px-1 rounded-full text-[10px] font-black ${filtro === e.k && e.k === 'pendiente' && n ? 'bg-amber-400 text-amber-950' : 'text-slate-400'}`}>{n}</span>
              </button>
            );
          })}
        </div>
        <label className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por usuario, producto o N° de operación"
            className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400" />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 min-w-0">
        {lista.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 shadow-xs">
            <p className="font-bold text-slate-600">{q ? 'Sin resultados' : filtro === 'pendiente' ? 'No hay compras por validar' : 'Sin registros'}</p>
            <p className="text-xs mt-1">{q ? 'Prueba con otra búsqueda.' : filtro === 'pendiente' ? 'Cuando un usuario pida un plan, créditos o un curso aparecerá aquí.' : 'Aún no hay compras en este estado.'}</p>
          </div>
        )}
        {lista.map(purchase => {
          const t = tipoDe(purchase);
          const usados = purchases.filter(p => p.id !== purchase.id && p.nroOperacion).map(p => ({ codigo: p.nroOperacion!, quien: `${p.userName || p.userId} · ${p.itemName}` }));
          return (
          <div key={purchase.id} className="min-w-0 bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.c}`}><t.Ic className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-slate-900 text-sm leading-tight break-words">{purchase.itemName}</h3>
                  {purchase.amount ? <span className="shrink-0 text-sm font-black text-slate-900">S/ {S(purchase.amount)}</span> : null}
                </div>
                <p className="text-xs font-bold text-slate-600 mt-0.5 truncate">{purchase.userName || 'Usuario'} <span className="font-mono font-medium text-slate-400 text-[10px]">{purchase.userId}</span></p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.c}`}>{t.l}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${BADGE[purchase.status]}`}>{purchase.status}</span>
                  {purchase.createdAt && <span className="text-[10px] text-slate-400">{fecha(purchase.createdAt)}</span>}
                  {purchase.nroOperacion && <span className="text-[10px] font-mono font-bold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">Op. {purchase.nroOperacion}{purchase.montoPagado !== undefined ? ` · S/ ${S(purchase.montoPagado)}` : ''}</span>}
                </div>
              </div>
            </div>
            {abierto === purchase.id && (
              <div className="px-4 pb-3">
                <LectorComprobante montoEsperado={purchase.amount || undefined} usados={usados}
                  onLeido={d => { if (d.nroOperacion || d.monto !== undefined) updateRecord('purchases', purchase.id, { ...purchase, ...(d.nroOperacion ? { nroOperacion: d.nroOperacion } : {}), ...(d.monto !== undefined ? { montoPagado: d.monto } : {}) }); }} />
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setAbierto(a => a === purchase.id ? null : purchase.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border ${abierto === purchase.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50'}`}>
                <ScanLine className="w-4 h-4" /> <span className="hidden min-[380px]:inline">Comprobante</span>
              </button>
              {purchase.voucherUrl && (
                <button onClick={() => setSelectedVoucher(purchase.voucherUrl)} title="Ver voucher" className="p-2 rounded-xl text-blue-600 bg-white border border-slate-200 hover:bg-blue-50 cursor-pointer"><Eye className="w-4 h-4" /></button>
              )}
              {purchase.status === 'pendiente' && (<>
                <button disabled={ocupado === purchase.id} onClick={() => handleUpdateStatus(purchase, 'rechazada')} title="Rechazar"
                  className="ml-auto inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 cursor-pointer disabled:opacity-50"><X className="w-4 h-4" /> Rechazar</button>
                <button disabled={ocupado === purchase.id} onClick={() => handleUpdateStatus(purchase, 'validada')} title="Validar"
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs disabled:opacity-50"><Check className="w-4 h-4" /> Validar</button>
              </>)}
            </div>
          </div>
          );
        })}
      </div>
      {selectedVoucher && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedVoucher(null)}>
          <img src={selectedVoucher} alt="Voucher" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
