// =============================================================================
// Pantalla de MANTENIMIENTO / "Próximamente" para apartados en desarrollo.
// Se muestra a los usuarios cuando el administrador tiene una sección desactivada
// (en desarrollo), en lugar de ocultarla sin explicación o rebotar al inicio.
// Diseño sobrio y profesional, en línea con la identidad de la app.
// =============================================================================
import { Wrench, Sparkles, ArrowLeft, Clock } from 'lucide-react';

interface MantenimientoViewProps {
  seccion?: string;        // Nombre de la sección (ej. "Inversiones")
  onVolver?: () => void;   // Volver al panel principal
  appName?: string;
}

export default function MantenimientoView({ seccion, onVolver, appName }: MantenimientoViewProps) {
  return (
    <div className="w-full h-full min-h-[70vh] flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-amber-50/40">
      <div className="relative w-full max-w-lg">
        {/* Halo decorativo */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-amber-200/30 via-transparent to-emerald-200/30 blur-2xl rounded-[2rem] pointer-events-none" />

        <div className="relative bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Cabecera con franja de obra */}
          <div className="relative h-28 bg-slate-900 overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 18px, #0f172a 18px, #0f172a 36px)' }}
            />
            <div className="relative w-16 h-16 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg ring-4 ring-white/20">
              <Wrench className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          {/* Cuerpo */}
          <div className="px-6 sm:px-8 py-7 text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-3 py-1">
              <Sparkles className="w-3.5 h-3.5" /> Muy pronto
            </span>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {seccion ? <>Estamos mejorando <span className="text-amber-600">{seccion}</span></> : 'Sección en mantenimiento'}
            </h1>

            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              Esta sección está en desarrollo para ofrecerte una mejor experiencia.
              Estamos afinando los últimos detalles y estará disponible muy pronto.
              ¡Gracias por tu paciencia!
            </p>

            <div className="flex items-center justify-center gap-2 pt-1 text-[12px] font-bold text-slate-400">
              <Clock className="w-4 h-4" />
              <span>Trabajo en progreso</span>
            </div>

            {onVolver && (
              <div className="pt-3">
                <button
                  onClick={onVolver}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold cursor-pointer hover:bg-slate-800 active:scale-[0.98] transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver al panel principal
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-300 pt-2 font-semibold">{appName || 'Innova Contratistas'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
