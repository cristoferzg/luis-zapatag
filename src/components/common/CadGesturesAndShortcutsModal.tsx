import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Keyboard, 
  MousePointer, 
  Move, 
  ZoomIn, 
  Hand, 
  Sparkles, 
  Bluetooth, 
  Maximize2,
  CheckCircle2
} from 'lucide-react';

interface CadGesturesAndShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName?: 'herreria' | 'techos';
  modulo?: 'herreria' | 'techos';
}

export const CadGesturesAndShortcutsModal: React.FC<CadGesturesAndShortcutsModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  modulo
}) => {
  const currentModule = modulo || moduleName || 'herreria';
  const [activeTab, setActiveTab] = useState<'touch' | 'keyboard'>('touch');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                Gestos Táctiles y Atajos de Teclado
              </h3>
              <p className="text-[11px] text-slate-300">
                Optimizado para celulares, tablets y teclado Bluetooth / PC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('touch')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'touch'
                ? 'bg-white text-blue-600 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Gestos Táctiles (Móvil y Tablet)</span>
          </button>
          <button
            onClick={() => setActiveTab('keyboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'keyboard'
                ? 'bg-white text-blue-600 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <div className="flex items-center gap-1">
              <Keyboard className="w-4 h-4" />
              <Bluetooth className="w-3 h-3 text-blue-500" />
            </div>
            <span>Teclado Bluetooth / Físico</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm">
          {activeTab === 'touch' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pinch to Zoom */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <ZoomIn className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Pellizcar con 2 dedos</h4>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    Aumenta o reduce el zoom fluidamente enfocando el centro del gesto táctil.
                  </p>
                </div>
              </div>

              {/* 2-Finger Pan */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Move className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Arrastrar con 2 dedos</h4>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    Desplaza y navega libremente por el plano CAD sin interrumpir la herramienta de dibujo activa.
                  </p>
                </div>
              </div>

              {/* Long Press for Advanced Context Menu */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Hand className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Pulsación Prolongada (0.5s)</h4>
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-extrabold">Clic Derecho</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    Mantén presionado sobre una pieza o el lienzo para desplegar el <strong>Menú Contextual Avanzado</strong> con vibración háptica.
                  </p>
                </div>
              </div>

              {/* Double Tap to Fit */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Doble Toque Rápido</h4>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    Centra y ajusta automáticamente todas las piezas y geometrías en la pantalla.
                  </p>
                </div>
              </div>

              {/* Drag handles */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-start gap-3 sm:col-span-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <MousePointer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Arrastre y Modificación con 1 Dedo</h4>
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                    En modo selección, toca una pieza y arrastra sus puntos extremos o el centro para estirarla o reubicarla con anclaje SNAP automático.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2">
                <Bluetooth className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold">
                  Al conectar un teclado inalámbrico Bluetooth a tu celular o tablet, puedes utilizar todos los atajos profesionales de CAD al instante.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Atajos principales */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-[11px] text-slate-500">
                    Herramientas de Dibujo
                  </h5>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{currentModule === 'herreria' ? 'Dibujar Perfil / Línea' : 'Dibujar Polígono'}</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">L</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{currentModule === 'herreria' ? 'Marco Rectangular' : 'Columna'}</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">R</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{currentModule === 'herreria' ? 'Arco Curvo Rolado' : 'Viga'}</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">A</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Herramienta Selección</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">V o S</kbd>
                  </div>
                  {currentModule === 'herreria' && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Insertar Accesorio</span>
                      <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">K</kbd>
                    </div>
                  )}
                </div>

                {/* Edición y Navegación */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-[11px] text-slate-500">
                    Edición y Navegación
                  </h5>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Duplicar Seleccionado</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">Ctrl + D</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Eliminar Seleccionado</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">Supr / Backspace</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Rotar 90° Pieza</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">R (seleccionado)</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Alternar Rejilla SNAP</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">G</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Modo Ortogonal (90°)</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">O</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Centrar Vista / Fit</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">0</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Zoom In / Out</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">+ / -</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Cancelar / Deseleccionar</span>
                    <kbd className="px-2 py-0.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-800 font-bold shadow-2xs">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Presiona <strong className="text-slate-700">?</strong> en cualquier momento para abrir esta guía</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
