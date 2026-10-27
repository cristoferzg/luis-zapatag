// =============================================================================
// Guía para dibujar en papel un plano de techo que la lectura inteligente
// entienda bien: un ejemplo dibujado y las reglas. Se puede imprimir como hoja
// modelo para entregar al cliente o al maestro de obra.
// =============================================================================
import { useRef } from 'react';
import { X, Printer, Check, XCircle } from 'lucide-react';
import { imprimirElemento } from '../../lib/imprimir';

const BIEN = [
  'Una sola vista: la PLANTA (el techo visto desde arriba). Los cortes o vistas de costado van en otra hoja.',
  'Usa hoja cuadriculada y dibuja con líneas rectas (regla si puedes).',
  'Marca cada COLUMNA con un cuadradito relleno ■ en su lugar.',
  'Escribe la medida de CADA lado en metros (ej. 12.30) y la separación entre columnas.',
  'Dibuja una flecha → con la palabra CAÍDA hacia donde escurre el agua, y escribe dónde está la CALLE.',
  'Escribe la altura: "Altura 3.00" o "Lado alto 4.00 / lado bajo 3.20".',
  'Si una parte no se techa, rállala y escribe "NO SE TECHA".',
  'Foto de frente, con buena luz, sin sombras y con toda la hoja dentro de la foto.',
];
const MAL = [
  'Mezclar en la misma hoja planta, cortes y detalles (la lectura se confunde).',
  'Medidas que no cuadran entre sí (ej. un lado dice 13 y el opuesto 16 sin que el dibujo lo muestre).',
  'Fotos inclinadas, borrosas o con la mano tapando el dibujo.',
  'Arcos, tijerales o piezas de herrería: esos se dibujan en CarpiMetal.',
];

export function EjemploBoceto({ className = '' }: { className?: string }) {
  // Cuadrícula de 10 px ≈ 0.5 m; techo de 10 × 20 m con columnas cada 5 m.
  const cols = [0, 5, 10, 15, 20].flatMap(z => [{ x: 0, z }, { x: 10, z }]);
  const X = (x: number) => 60 + x * 20, Z = (z: number) => 40 + z * 13;
  return (
    <svg viewBox="0 0 360 340" className={className} role="img" aria-label="Ejemplo de plano de techo dibujado a mano">
      <defs>
        <pattern id="cuadri" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#bfdbfe" strokeWidth="0.6" /></pattern>
        <marker id="flecha" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#dc2626" /></marker>
      </defs>
      <rect width="360" height="340" fill="#fff" /><rect width="360" height="340" fill="url(#cuadri)" />
      <rect x={X(0)} y={Z(0)} width={X(10) - X(0)} height={Z(20) - Z(0)} fill="none" stroke="#1e3a8a" strokeWidth="2.2" />
      {cols.map((c, i) => <rect key={i} x={X(c.x) - 5} y={Z(c.z) - 5} width="10" height="10" fill="#1e3a8a" />)}
      <text x={(X(0) + X(10)) / 2} y={Z(0) - 10} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e3a8a" fontFamily="cursive">10.00 m</text>
      <text x={X(10) + 12} y={(Z(0) + Z(20)) / 2} fontSize="13" fontWeight="700" fill="#1e3a8a" fontFamily="cursive">20.00 m</text>
      <text x={X(0) - 8} y={(Z(0) + Z(5)) / 2 + 4} textAnchor="end" fontSize="10" fill="#1e3a8a" fontFamily="cursive">5.00</text>
      <line x1={X(5)} y1={Z(12)} x2={X(5)} y2={Z(17)} stroke="#dc2626" strokeWidth="2.2" markerEnd="url(#flecha)" />
      <text x={X(5) + 8} y={Z(14)} fontSize="12" fontWeight="700" fill="#dc2626" fontFamily="cursive">CAÍDA</text>
      <text x={(X(0) + X(10)) / 2} y={Z(20) + 22} textAnchor="middle" fontSize="12" fontWeight="700" fill="#334155" fontFamily="cursive">— CALLE —</text>
      <text x={(X(0) + X(10)) / 2} y={Z(5) + 4} textAnchor="middle" fontSize="11" fill="#334155" fontFamily="cursive">Altura: lado alto 4.00</text>
      <text x={(X(0) + X(10)) / 2} y={Z(6.5) + 4} textAnchor="middle" fontSize="11" fill="#334155" fontFamily="cursive">lado bajo 3.20</text>
      <text x="300" y="330" textAnchor="end" fontSize="9" fill="#64748b">■ = columna · medidas en metros</text>
    </svg>
  );
}

export default function GuiaBocetoPlano({ onClose }: { onClose: () => void }) {
  const hoja = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0 z-[95] bg-slate-900/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">Cómo dibujar tu plano para leerlo en la app</h3>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => hoja.current && imprimirElemento(hoja.current, { tamano: 'A4', orientacion: 'portrait', titulo: 'Hoja modelo - plano de techo' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"><Printer className="w-3.5 h-3.5" /> Imprimir hoja modelo</button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Cerrar"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          <div ref={hoja} className="space-y-3 text-slate-700">
            <p className="text-xs">Así se ve un boceto que se lee bien (techo de 10 × 20 m, columnas cada 5 m, caída hacia la calle):</p>
            <EjemploBoceto className="w-full max-w-sm mx-auto border border-slate-200 rounded-xl" />
            <div className="grid sm:grid-cols-2 gap-3 text-[12px] leading-snug">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                <p className="font-black text-emerald-800 mb-1.5">Hazlo así</p>
                <ul className="space-y-1.5">{BIEN.map(t => <li key={t} className="flex gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />{t}</li>)}</ul>
              </div>
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3">
                <p className="font-black text-rose-800 mb-1.5">Evita</p>
                <ul className="space-y-1.5">{MAL.map(t => <li key={t} className="flex gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />{t}</li>)}</ul>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Lo que no esté en el dibujo (altura, caída, columnas cada cuántos metros, cobertura) lo puedes poner en la ventana antes de elegir la foto. Después revisa y ajusta el techo con las herramientas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
