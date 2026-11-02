// Aviso antes de desbloquear un curso o un recurso técnico con créditos: muestra el
// saldo antes y después, y recuerda que son los MISMOS créditos que usan las
// funciones inteligentes del sistema (si se acaban, hay que recargar).
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSaldoIA, avisarSaldoIA } from '../lib/saldoIA';

interface Props {
  tipo: 'curso' | 'recurso';
  nombre: string;
  creditos: number;
  onCanjear: () => Promise<{ ok: boolean; error?: string }>;
  onCerrar: () => void;
}

const fecha = (iso?: string) => { try { return iso ? new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' }) : ''; } catch { return ''; } };

export default function ConfirmarCanjeCreditos({ tipo, nombre, creditos, onCanjear, onCerrar }: Props) {
  const { saldo } = useSaldoIA(true);
  const [estado, setEstado] = useState<'pregunta' | 'canjeando' | 'listo' | 'error'>('pregunta');
  const [error, setError] = useState('');
  const total = saldo?.total ?? null;
  const alcanza = total === null || total >= creditos;
  const despues = total === null ? null : Math.max(0, total - creditos);
  const delMes = saldo ? Math.min(saldo.mes, creditos) : 0;
  const deRecarga = creditos - delMes;
  const cosa = tipo === 'curso' ? 'el curso' : 'el recurso';

  const canjear = async () => {
    setEstado('canjeando');
    const r = await onCanjear();
    if (r.ok) { avisarSaldoIA(); setEstado('listo'); } else { setError(r.error || 'No se pudo desbloquear.'); setEstado('error'); }
  };
  const irARecargar = () => { onCerrar(); try { window.dispatchEvent(new CustomEvent('innova_navigate_tab', { detail: 'membresia' })); } catch { /* nada */ } };

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={estado === 'canjeando' ? undefined : onCerrar}>
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {estado === 'listo' ? (
          <div className="text-center py-3">
            <div className="text-5xl mb-2">✅</div>
            <h3 className="text-lg font-black text-slate-900">¡Desbloqueado!</h3>
            <p className="text-sm text-slate-600 mt-1">{tipo === 'curso' ? 'Ya puedes ver todas las clases de' : 'Ya puedes abrir y descargar'} <b>{nombre}</b>.</p>
            {despues !== null && <p className="text-xs text-slate-500 mt-2">Te quedan <b>{despues}</b> créditos.</p>}
            <button type="button" onClick={onCerrar} className="mt-4 w-full py-3 rounded-2xl bg-orange-500 text-white font-black cursor-pointer">Listo</button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl shrink-0">🪙</div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-900 leading-tight">Desbloquear {cosa} con créditos</h3>
                <p className="text-sm text-slate-600 mt-0.5 break-words">{nombre}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 divide-y divide-slate-100 text-sm">
              <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Costo</span><b className="text-slate-900">{creditos} créditos</b></div>
              <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Tu saldo ahora</span><b className="text-slate-900">{total === null ? '…' : `${total} créditos`}</b></div>
              <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Te quedarán</span><b className={alcanza ? 'text-emerald-700' : 'text-red-600'}>{despues === null ? '…' : alcanza ? `${despues} créditos` : 'No te alcanza'}</b></div>
              {saldo && alcanza && (
                <div className="px-4 py-2.5 text-xs text-slate-500">
                  Se descuentan {delMes > 0 && <><b>{delMes}</b> de tu plan mensual ({saldo.planNombre})</>}{delMes > 0 && deRecarga > 0 && ' y '}{deRecarga > 0 && <><b>{deRecarga}</b> de tus recargas</>}.
                </div>
              )}
            </div>

            <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-[13px] text-amber-900 leading-relaxed">
              <b>⚠️ Importante:</b> estos son los <b>mismos créditos</b> que usas para las <b>funciones de inteligencia artificial</b> del sistema (leer boletas sin QR, leer planos a mano).
              Si los gastas y se te acaban, para seguir usando esas funciones tendrás que <b>recargar</b>{saldo?.renuevaEl ? <> o esperar la recarga de tu plan el <b>{fecha(saldo.renuevaEl)}</b></> : null}.
            </div>

            {estado === 'error' && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

            <div className="mt-4 flex flex-col gap-2">
              {alcanza ? (
                <button type="button" disabled={estado === 'canjeando' || total === null} onClick={canjear}
                  className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black cursor-pointer disabled:opacity-60">
                  {estado === 'canjeando' ? 'Desbloqueando…' : `Sí, usar ${creditos} créditos`}
                </button>
              ) : (
                <button type="button" onClick={irARecargar} className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black cursor-pointer">
                  Recargar créditos
                </button>
              )}
              <button type="button" disabled={estado === 'canjeando'} onClick={onCerrar} className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold cursor-pointer">Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
