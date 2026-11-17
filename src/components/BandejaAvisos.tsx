// Campana de avisos (barra de arriba): lista de comunicados, clases, recursos y novedades de
// tickets y asesorías. Siguen aquí aunque se borren de la barra de notificaciones del celular.
import { useEffect, useState } from 'react';
import { Bell, X, Trash2, CheckCheck } from 'lucide-react';
import { useBandeja, marcarLeido, marcarTodoLeido, borrarAviso, vaciarBandeja } from '../lib/bandejaAvisos';

const hace = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d < 30 ? `hace ${d} día${d > 1 ? 's' : ''}` : new Date(t).toLocaleDateString('es-PE');
};

export default function BandejaAvisos({ uid, onIr, oscuro = false }: { uid?: string; onIr: (vista: string) => void; oscuro?: boolean }) {
  const lista = useBandeja(uid);
  const [abierta, setAbierta] = useState(false);
  const sinLeer = lista.filter(a => !a.leido).length;
  useEffect(() => {
    if (!abierta) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(false); };
    window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc);
  }, [abierta]);
  if (!uid) return null;

  return (
    <>
      <button type="button" onClick={() => setAbierta(true)} title="Avisos" aria-label={`Avisos${sinLeer ? `: ${sinLeer} sin leer` : ''}`}
        className={`campana-avisos relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer ${oscuro ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 active:bg-slate-100 hover:bg-slate-100'}`}>
        <Bell className="w-5 h-5" />
        {sinLeer > 0 && <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">{sinLeer > 9 ? '9+' : sinLeer}</span>}
      </button>
      {abierta && (
        <div className="fixed inset-0 z-[300] bg-slate-950/40 flex items-start justify-center sm:justify-end px-2 sm:p-4 pt-[calc(60px+env(safe-area-inset-top))] sm:pt-4" onClick={() => setAbierta(false)} role="dialog" aria-modal="true" aria-label="Avisos">
          <div className="w-full sm:w-[380px] max-h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Bell className="w-4 h-4 text-orange-500" />
              <b className="flex-1 text-sm text-slate-900">Avisos{sinLeer ? ` · ${sinLeer} sin leer` : ''}</b>
              {sinLeer > 0 && <button type="button" onClick={() => marcarTodoLeido(uid)} title="Marcar todo como leído" className="w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"><CheckCheck className="w-4 h-4" /></button>}
              {lista.length > 0 && <button type="button" onClick={() => vaciarBandeja(uid)} title="Borrar todos" className="w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
              <button type="button" onClick={() => setAbierta(false)} aria-label="Cerrar" className="w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {lista.length === 0 ? (
                <p className="text-xs text-slate-500 p-6 text-center">No tienes avisos. Aquí quedan los comunicados, clases y recursos nuevos, aunque borres la notificación del celular.</p>
              ) : lista.map(a => (
                <div key={a.id} className={`flex items-start gap-2 px-4 py-3 border-b border-slate-50 ${a.leido ? '' : 'bg-orange-50/60'}`}>
                  <button type="button" onClick={() => { marcarLeido(uid, a.id); setAbierta(false); if (a.vista) onIr(a.vista); }} className="flex-1 min-w-0 text-left cursor-pointer">
                    <span className={`block text-[13px] ${a.leido ? 'font-semibold text-slate-700' : 'font-black text-slate-900'}`}>{a.titulo}</span>
                    {a.cuerpo && <span className="block text-xs text-slate-500 line-clamp-2">{a.cuerpo}</span>}
                    <span className="block text-[10px] text-slate-400 mt-0.5">{hace(a.fecha)}</span>
                  </button>
                  <button type="button" onClick={() => borrarAviso(uid, a.id)} aria-label="Borrar aviso" className="w-8 h-8 grid place-items-center rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
