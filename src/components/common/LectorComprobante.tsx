// =============================================================================
// Lector de comprobantes de pago (Yape, Plin, BCP, Interbank, BBVA…). El admin
// sube la captura que le mandó el cliente y la app extrae el N° de operación,
// el monto, la fecha y quién pagó, para copiarlos o guardarlos con un clic.
// Avisa si ese N° de operación ya se usó antes (evita validar dos veces el
// mismo pago). La lectura del admin no gasta créditos.
// =============================================================================
import { useRef, useState } from 'react';
import { ScanLine, Loader2, Copy, Check, AlertTriangle, X } from 'lucide-react';
import { scanReceipt, ReceiptData } from '../../lib/receiptScan';

export interface DatosPago {
  nroOperacion?: string;
  monto?: number;
  moneda?: string;
  fecha?: string;
  metodo?: string;
  titular?: string;
}

export interface CodigoUsado { codigo: string; quien: string }

const limpiar = (c?: string) => (c || '').replace(/[^0-9a-z]/gi, '').toUpperCase();

export function datosDePago(r: ReceiptData): DatosPago {
  return {
    nroOperacion: r.nroOperacion || undefined,
    monto: r.total,
    moneda: r.moneda || 'PEN',
    fecha: r.fecha || undefined,
    metodo: r.metodoPago || undefined,
    titular: r.proveedor || undefined,
  };
}

/** ¿Este N° de operación ya está registrado? Devuelve quién lo usó. */
export function codigoRepetido(codigo: string | undefined, usados: CodigoUsado[]): CodigoUsado | undefined {
  const c = limpiar(codigo);
  return c ? usados.find(u => limpiar(u.codigo) === c) : undefined;
}

export default function LectorComprobante({
  onLeido, usados = [], montoEsperado, etiqueta = 'Leer comprobante de pago', className = '',
}: {
  onLeido?: (d: DatosPago) => void;
  usados?: CodigoUsado[];
  montoEsperado?: number;
  etiqueta?: string;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [datos, setDatos] = useState<DatosPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const leer = async (file: File) => {
    setLeyendo(true); setError(null); setDatos(null); setCopiado(false);
    try {
      const sim = import.meta.env.DEV ? (window as any).__voucherSimulado as ReceiptData | undefined : undefined;
      const r = sim ? { source: 'ia' as const, data: sim } : await scanReceipt(file, true, true);
      const d = datosDePago(r.data || {});
      if (r.source === 'sin_ia') setError('La lectura inteligente no está disponible ahora. Escribe el código a mano.');
      else if (!d.nroOperacion && d.monto === undefined) setError('No se encontró un N° de operación en la imagen. Prueba con una captura más nítida y completa.');
      else { setDatos(d); onLeido?.(d); }
    } catch (e: any) {
      setError(e?.message ? `No se pudo leer: ${e.message}` : 'No se pudo leer el comprobante.');
    } finally {
      setLeyendo(false);
    }
  };

  const copiar = async () => {
    if (!datos?.nroOperacion) return;
    try { await navigator.clipboard.writeText(datos.nroOperacion); } catch { /* sin portapapeles */ }
    setCopiado(true); setTimeout(() => setCopiado(false), 1800);
  };

  const repetido = codigoRepetido(datos?.nroOperacion, usados);
  const difiere = montoEsperado !== undefined && datos?.monto !== undefined && Math.abs(datos.monto - montoEsperado) > 0.009;
  const S = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={className}>
      <input ref={input} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) leer(f); }} />
      <button type="button" onClick={() => input.current?.click()} disabled={leyendo}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black bg-violet-600 hover:bg-violet-700 text-white cursor-pointer disabled:opacity-60 shadow-xs">
        {leyendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
        {leyendo ? 'Leyendo comprobante…' : etiqueta}
      </button>

      {error && (
        <p className="mt-2 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">{error}</p>
      )}

      {datos && (
        <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50/60 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-violet-700">N° de operación</p>
              <p className="font-mono text-lg font-black text-slate-900 tracking-wider break-all">{datos.nroOperacion || '—'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {datos.nroOperacion && (
                <button type="button" onClick={copiar} title="Copiar código"
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${copiado ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                  {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copiado ? 'Copiado' : 'Copiar'}
                </button>
              )}
              <button type="button" onClick={() => setDatos(null)} title="Cerrar" className="p-1.5 rounded-lg text-slate-400 hover:bg-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <span className="text-slate-500">Monto</span><span className="font-black text-slate-800 text-right">{datos.monto !== undefined ? `${datos.moneda === 'USD' ? 'US$' : 'S/'} ${S(datos.monto)}` : '—'}</span>
            <span className="text-slate-500">Fecha</span><span className="font-bold text-slate-800 text-right">{datos.fecha || '—'}</span>
            <span className="text-slate-500">Medio</span><span className="font-bold text-slate-800 text-right truncate">{datos.metodo || '—'}</span>
            <span className="text-slate-500">Destinatario</span><span className="font-bold text-slate-800 text-right truncate">{datos.titular || '—'}</span>
          </div>
          {repetido && (
            <p className="flex items-start gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Este N° de operación ya se registró ({repetido.quien}). Revisa antes de validar.
            </p>
          )}
          {difiere && (
            <p className="flex items-start gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> El monto pagado no coincide con el precio (S/ {S(montoEsperado!)}).
            </p>
          )}
          {!repetido && !difiere && datos.nroOperacion && (
            <p className="text-[11px] font-bold text-emerald-700">✓ Código nuevo{montoEsperado !== undefined && datos.monto !== undefined ? ' · el monto coincide' : ''}</p>
          )}
        </div>
      )}
    </div>
  );
}
