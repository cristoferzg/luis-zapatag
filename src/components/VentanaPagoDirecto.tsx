// Ventana "Paga con Yape o Plin": QR y número del dueño, monto exacto y subir la captura.
// Al enviar queda una compra pendiente con el comprobante; el admin la valida y los
// créditos (o el plan) se cargan solos. Ver src/lib/pagoDirecto.ts.
import { useRef, useState } from 'react';
import { X, Copy, Check, Upload, Loader2, Smartphone, ShieldCheck } from 'lucide-react';
import { ConfigPagoDirecto, PedidoDirecto, comprimirImagen, enviarComprobante } from '../lib/pagoDirecto';
import { precioPEN } from '../lib/currency';
import { getAICtx } from '../lib/aiAccess';

export default function VentanaPagoDirecto({ cfg, pedido, onClose, onEnviado }: { cfg: ConfigPagoDirecto; pedido: PedidoDirecto; onClose: () => void; onEnviado: () => void }) {
  const metodos = (['yape', 'plin'] as const).filter(m => cfg[m]?.numero);
  const [metodo, setMetodo] = useState<'yape' | 'plin'>(metodos[0] || 'yape');
  const cuenta = cfg[metodo];
  const [copiado, setCopiado] = useState(false);
  const [captura, setCaptura] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const color = metodo === 'yape' ? { bg: 'bg-[#742284]', txt: 'text-[#742284]', borde: 'border-[#742284]' } : { bg: 'bg-[#00b2a9]', txt: 'text-[#008c85]', borde: 'border-[#00b2a9]' };

  const copiar = async () => { try { await navigator.clipboard.writeText((cuenta?.numero || '').replace(/\s/g, '')); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* sin portapapeles */ } };
  const elegir = async (f?: File) => {
    if (!f) return; setError(null);
    try { setCaptura(await comprimirImagen(f)); } catch { setError('No se pudo leer la imagen. Prueba con otra captura.'); }
  };
  const enviar = async () => {
    if (!captura) return; setEnviando(true); setError(null);
    const ctx = getAICtx();
    try { await enviarComprobante(ctx.userId || '', ctx.userName, pedido, metodo, captura); setListo(true); onEnviado(); }
    catch { setError('No se pudo enviar. Revisa tu conexión e intenta de nuevo.'); }
    finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm sm:p-3" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`px-5 py-4 text-white flex items-start justify-between gap-3 ${color.bg}`}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">Pagar {pedido.itemName}</p>
            <p className="text-3xl font-black leading-tight">{precioPEN(pedido.amount)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>

        {listo ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-9 h-9" /></div>
            <p className="text-lg font-black text-slate-900">¡Recibimos tu comprobante!</p>
            <p className="text-sm text-slate-600">Lo revisamos y tus créditos se cargan solos. Te llega un aviso apenas estén listos (normalmente en pocos minutos).</p>
            <button onClick={onClose} className="mt-2 w-full py-3 rounded-2xl bg-slate-900 text-white font-black cursor-pointer">Entendido</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {metodos.length > 1 && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
                {metodos.map(m => (
                  <button key={m} onClick={() => setMetodo(m)} className={`py-2 rounded-xl text-sm font-black cursor-pointer ${metodo === m ? (m === 'yape' ? 'bg-[#742284] text-white' : 'bg-[#00b2a9] text-white') : 'text-slate-500'}`}>{m === 'yape' ? 'Yape' : 'Plin'}</button>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-start"><span className={`w-6 h-6 rounded-full ${color.bg} text-white text-xs font-black flex items-center justify-center shrink-0`}>1</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-800">Yapea o plinea el monto exacto</p>
                {cuenta?.qr && <img src={cuenta.qr} alt={`QR de ${metodo}`} className={`mt-2 w-44 h-44 mx-auto object-contain rounded-2xl border-4 ${color.borde} bg-white`} />}
                <div className="mt-2 rounded-2xl border border-slate-200 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" />Número de {metodo === 'yape' ? 'Yape' : 'Plin'}</p>
                    <p className={`text-xl font-black ${color.txt}`}>{cuenta?.numero}</p>
                    <p className="text-[11px] text-slate-600 truncate">A nombre de <b>{cuenta?.titular}</b></p>
                  </div>
                  <button onClick={copiar} className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer">{copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}{copiado ? 'Copiado' : 'Copiar'}</button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-start"><span className={`w-6 h-6 rounded-full ${color.bg} text-white text-xs font-black flex items-center justify-center shrink-0`}>2</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-800">Sube la captura de tu pago</p>
                <input ref={input} data-captura type="file" accept="image/*" className="hidden" onChange={e => elegir(e.target.files?.[0])} />
                {captura ? (
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-2">
                    <img src={captura} alt="Tu captura" className="w-14 h-20 object-cover rounded-lg border border-emerald-200" />
                    <div className="min-w-0 flex-1"><p className="text-xs font-black text-emerald-800">Captura lista</p><button onClick={() => input.current?.click()} className="text-[11px] font-bold text-emerald-700 underline cursor-pointer">Cambiar</button></div>
                  </div>
                ) : (
                  <button onClick={() => input.current?.click()} className="mt-2 w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 text-sm font-bold text-slate-600 flex items-center justify-center gap-2 cursor-pointer"><Upload className="w-5 h-5" />Elegir captura</button>
                )}
              </div>
            </div>

            {error && <p className="text-xs font-bold text-rose-700 bg-rose-50 rounded-xl p-2.5">{error}</p>}
            <button onClick={enviar} disabled={!captura || enviando}
              className={`w-full py-3.5 rounded-2xl text-white text-base font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${color.bg}`}>
              {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Enviar comprobante
            </button>
            <p className="text-[11px] text-slate-500 flex items-start gap-1.5"><ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />Revisamos cada pago (monto y N° de operación) antes de cargar los créditos. Una captura que ya se usó no se acepta.</p>
          </div>
        )}
      </div>
    </div>
  );
}
