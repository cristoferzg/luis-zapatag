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
    <div className="relative overflow-hidden w-full h-full min-h-[70vh] flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-slate-50 via-white to-amber-50/40">
      <ConstruccionAnim />
      <div className="relative z-10 w-full max-w-lg">
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

// -----------------------------------------------------------------------------
// Escena animada de construcción (grúa torre + estructura metálica + ingenieros)
// Va en el FONDO, detrás de la tarjeta, en el cuadrante blanco. Solo CSS/SVG.
// -----------------------------------------------------------------------------
function ConstruccionAnim() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-0 pointer-events-none select-none opacity-[0.55]" aria-hidden="true">
      <style>{`
        @keyframes mv-sway { 0%,100%{transform:rotate(-1.4deg)} 50%{transform:rotate(1.4deg)} }
        @keyframes mv-lift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-22px)} }
        @keyframes mv-bob  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes mv-arm  { 0%,100%{transform:rotate(-14deg)} 50%{transform:rotate(8deg)} }
        @keyframes mv-spark{ 0%,55%,100%{opacity:0;transform:scale(.5)} 8%{opacity:1;transform:scale(1.15)} 20%{opacity:.25} 35%{opacity:.9} }
        @keyframes mv-beam { 0%{opacity:0;transform:translateY(-34px)} 35%{opacity:1;transform:translateY(0)} 85%{opacity:1} 100%{opacity:0} }
        @keyframes mv-dust { 0%{opacity:0;transform:translateY(0)} 45%{opacity:.5} 100%{opacity:0;transform:translateY(-16px)} }
        @media (prefers-reduced-motion: reduce){
          .mv-anim *{animation:none !important}
        }
      `}</style>
      <svg viewBox="0 0 820 280" className="mv-anim w-full h-[42vh] max-h-[320px]" preserveAspectRatio="xMidYMax slice">
        {/* Suelo / obra */}
        <rect x="0" y="252" width="820" height="28" fill="#e2e8f0" />
        <rect x="0" y="250" width="820" height="3" fill="#cbd5e1" />

        {/* ===== GRÚA TORRE (izquierda) ===== */}
        <g stroke="#94a3b8" strokeWidth="3" fill="none">
          {/* Mástil con celosía */}
          <rect x="96" y="70" width="22" height="182" fill="#f1f5f9" stroke="#94a3b8" />
          <path d="M96 100 L118 118 M118 100 L96 118 M96 140 L118 158 M118 140 L96 158 M96 180 L118 198 M118 180 L96 198 M96 215 L118 233 M118 215 L96 233" strokeWidth="2" stroke="#cbd5e1" />
        </g>
        {/* Brazo (jib) que oscila suavemente desde la punta del mástil */}
        <g style={{ transformOrigin: '107px 70px', transformBox: 'fill-box', animation: 'mv-sway 7s ease-in-out infinite' }}>
          {/* Contrabrazo + contrapeso */}
          <line x1="107" y1="70" x2="40" y2="70" stroke="#94a3b8" strokeWidth="4" />
          <rect x="30" y="64" width="18" height="18" rx="2" fill="#64748b" />
          {/* Brazo principal con celosía */}
          <line x1="107" y1="70" x2="300" y2="70" stroke="#f59e0b" strokeWidth="4" />
          <line x1="107" y1="78" x2="296" y2="78" stroke="#94a3b8" strokeWidth="2" />
          <path d="M120 70 L140 78 M160 70 L180 78 M200 70 L220 78 M240 70 L260 78 M280 70 L296 78" stroke="#cbd5e1" strokeWidth="2" />
          {/* Cable + carga (viga I) que sube y baja */}
          <line x1="262" y1="78" x2="262" y2="150" stroke="#64748b" strokeWidth="1.5" />
          <g style={{ transformOrigin: 'center', animation: 'mv-lift 4.5s ease-in-out infinite' }}>
            <g transform="translate(262,158)">
              <rect x="-20" y="-4" width="40" height="5" fill="#f59e0b" />
              <rect x="-20" y="9" width="40" height="5" fill="#f59e0b" />
              <rect x="-3" y="-4" width="6" height="18" fill="#d97706" />
            </g>
          </g>
          <circle cx="107" cy="70" r="4" fill="#64748b" />
        </g>

        {/* ===== ESTRUCTURA METÁLICA EN CONSTRUCCIÓN (centro-derecha) ===== */}
        <g stroke="#94a3b8" strokeWidth="6" strokeLinecap="round">
          {/* Columnas */}
          <line x1="470" y1="252" x2="470" y2="130" stroke="#64748b" />
          <line x1="640" y1="252" x2="640" y2="130" stroke="#64748b" />
          {/* Viga superior ya colocada */}
          <line x1="466" y1="133" x2="644" y2="133" stroke="#64748b" />
          {/* Viga intermedia */}
          <line x1="470" y1="192" x2="640" y2="192" stroke="#94a3b8" strokeWidth="5" />
          {/* Diagonales de arriostre */}
          <line x1="470" y1="192" x2="640" y2="133" stroke="#cbd5e1" strokeWidth="4" />
          <line x1="470" y1="252" x2="640" y2="192" stroke="#cbd5e1" strokeWidth="4" />
          {/* Pedestales de concreto */}
          <rect x="460" y="238" width="20" height="16" fill="#9a938c" stroke="none" />
          <rect x="630" y="238" width="20" height="16" fill="#9a938c" stroke="none" />
        </g>
        {/* Viga que "se coloca" en bucle (montaje) */}
        <g style={{ transformBox: 'fill-box', animation: 'mv-beam 5s ease-in-out infinite' }}>
          <rect x="470" y="100" width="170" height="8" rx="2" fill="#f59e0b" />
        </g>

        {/* ===== INGENIEROS / OBREROS ===== */}
        {/* Obrero soldando junto a la estructura (lado derecho, visible).
            NOTA: la posición va en el <g> EXTERIOR (atributo transform) y la
            animación en el INTERIOR (CSS transform), porque el CSS transform
            sobrescribe el atributo transform del SVG. */}
        <g transform="translate(585,196) scale(1.35)">
          <g style={{ animation: 'mv-bob 3.4s ease-in-out infinite' }}>
            <rect x="-7" y="-2" width="14" height="22" rx="4" fill="#475569" />
            <rect x="-7" y="18" width="5" height="14" rx="2" fill="#334155" />
            <rect x="2" y="18" width="5" height="14" rx="2" fill="#334155" />
            <circle cx="0" cy="-11" r="7" fill="#fcd34d" />
            <path d="M-9 -12 a9 9 0 0 1 18 0 z" fill="#f59e0b" />
            {/* Brazo con soplete que se mueve */}
            <g style={{ transformOrigin: '-5px 0px', transformBox: 'fill-box', animation: 'mv-arm 2.2s ease-in-out infinite' }}>
              <line x1="-4" y1="2" x2="14" y2="8" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            </g>
            {/* Chispas de soldadura */}
            <g style={{ transformOrigin: 'center', transformBox: 'fill-box', animation: 'mv-spark 1.1s linear infinite' }}>
              <circle cx="18" cy="9" r="3" fill="#fbbf24" />
              <path d="M18 2 L19 8 L25 9 L19 10 L18 16 L17 10 L11 9 L17 8 Z" fill="#fde68a" />
            </g>
          </g>
        </g>

        {/* Ingeniero con plano/tablet, supervisando (junto a la grúa, lado izq.) */}
        <g transform="translate(245,200) scale(1.35)">
          <g style={{ animation: 'mv-bob 3.9s ease-in-out infinite' }}>
            <rect x="-7" y="-2" width="14" height="22" rx="4" fill="#1e293b" />
            <rect x="-7" y="18" width="5" height="14" rx="2" fill="#0f172a" />
            <rect x="2" y="18" width="5" height="14" rx="2" fill="#0f172a" />
            <circle cx="0" cy="-11" r="7" fill="#fcd34d" />
            <path d="M-9 -12 a9 9 0 0 1 18 0 z" fill="#f59e0b" />
            {/* Tablet/plano */}
            <rect x="6" y="2" width="12" height="9" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          </g>
        </g>

        {/* Partículas de obra (polvo) */}
        <g fill="#cbd5e1">
          <circle cx="600" cy="236" r="2.5" style={{ animation: 'mv-dust 2.6s ease-out infinite' }} />
          <circle cx="578" cy="240" r="2" style={{ animation: 'mv-dust 3.2s ease-out .6s infinite' }} />
          <circle cx="620" cy="238" r="2" style={{ animation: 'mv-dust 2.9s ease-out 1.1s infinite' }} />
        </g>
      </svg>
    </div>
  );
}
