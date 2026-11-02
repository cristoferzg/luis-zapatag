import React, { useState } from 'react';
import { 
  X, 
  GraduationCap, 
  Layers, 
  Box, 
  Eye, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  Building,
  Zap,
  Info
} from 'lucide-react';
import { UseTechosCadEngineReturn } from './useTechosCadEngineState';

interface TechosTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineState: UseTechosCadEngineReturn;
  onSwitchView?: (vista: 'planta' | 'seccion' | '3d') => void;
  onStartInteractiveTutorial?: () => void;
}

export const TechosTutorialModal: React.FC<TechosTutorialModalProps> = ({
  isOpen,
  onClose,
  engineState,
  onSwitchView,
  onStartInteractiveTutorial
}) => {
  const [activeTab, setActiveTab] = useState<'inicio' | 'parabolico' | 'dos_aguas' | 'un_agua' | 'mezzanine' | 'atajos'>('inicio');
  const [templateLoadedMsg, setTemplateLoadedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadTemplate = (tipo: 'parabolico' | 'dos_aguas' | 'un_agua' | 'mezzanine') => {
    try {
      if (tipo === 'parabolico') {
        engineState.generateRoofParabolic(15, 20, 4.5, 2.5);
        setTemplateLoadedMsg('¡Techo Parabólico (15m x 20m) cargado exitosamente!');
      } else if (tipo === 'dos_aguas') {
        engineState.generateRoofGable(12, 20, 4.5, 20);
        setTemplateLoadedMsg('¡Techo a Dos Aguas (12m x 20m) cargado exitosamente!');
      } else if (tipo === 'un_agua') {
        engineState.generateRoofMonoslope(8, 16, 3.5, 5.0);
        setTemplateLoadedMsg('¡Techo a Un Agua (8m x 16m) cargado exitosamente!');
      } else if (tipo === 'mezzanine') {
        engineState.generateMezzanine(10, 8, 3.2, 3, 2);
        setTemplateLoadedMsg('¡Mezzanine / Entrepiso (10m x 8m) cargado exitosamente!');
      }
      setTimeout(() => {
        setTemplateLoadedMsg(null);
        onClose();
        if (onSwitchView) onSwitchView('3d');
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* CABECERA DEL TUTORIAL */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                  TUTORIAL DE DISEÑO: TECHOS METÁLICOS
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                  Paso a Paso
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5 font-medium">
                Aprende a diseñar estructuras metálicas, tijerales y coberturas Aluzinc TR-4 como un profesional
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Cerrar Guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MENSAJE DE CONFIRMACIÓN AL CARGAR PLANTILLA */}
        {templateLoadedMsg && (
          <div className="bg-emerald-500 text-slate-950 font-black px-4 py-2 text-center text-xs flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{templateLoadedMsg} Abriendo vista 3D...</span>
          </div>
        )}

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 bg-slate-100/80 border-b border-slate-200 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('inicio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'inicio'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1. Conceptos CAD</span>
          </button>

          <button
            onClick={() => setActiveTab('parabolico')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'parabolico'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Techo Parabólico</span>
          </button>

          <button
            onClick={() => setActiveTab('dos_aguas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'dos_aguas'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>3. Dos Aguas (Gable)</span>
          </button>

          <button
            onClick={() => setActiveTab('un_agua')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'un_agua'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Un Agua</span>
          </button>

          <button
            onClick={() => setActiveTab('mezzanine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'mezzanine'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>5. Mezzanine</span>
          </button>

          <button
            onClick={() => setActiveTab('atajos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'atajos'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Atajos & Tips</span>
          </button>
        </div>

        {/* CONTENIDO SCROLLABLE DE CADA PESTAÑA */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-700 text-xs sm:text-sm">
          
          {/* 1. CONCEPTOS BÁSICOS DEL MOTOR CAD */}
          {activeTab === 'inicio' && (
            <div className="space-y-5">
              {onStartInteractiveTutorial && (
                <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-2xl p-4 text-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-amber-300">
                  <div className="space-y-1">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full">
                      Recomendado para principiantes
                    </span>
                    <h4 className="font-black text-sm text-slate-950">
                      Tutorial Interactivo Guiado en el Lienzo
                    </h4>
                    <p className="text-xs text-slate-900 font-medium">
                      Aprende haciendo paso a paso: te guiamos en vivo en el lienzo para colocar columnas, usar snaps magnéticos, cerrar perímetros y asignar perfiles.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onStartInteractiveTutorial();
                    }}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
                  >
                    <span>Iniciar Guía en Lienzo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-amber-950 text-sm">
                    ¿Cómo funciona este motor de diseño estructural?
                  </h4>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    A diferencia de programas genéricos de dibujo, este software calcula en tiempo real un 
                    <strong> modelo tridimensional con perfiles tubulares normalizados (ASTM A500)</strong>. 
                    Todo elemento dibujado alimenta directamente el metrado de peso, el despiece 1D de barras de 6.00m y el análisis según la Norma Técnica Peruana (RNE).
                  </p>
                </div>
              </div>

              {/* LAS 3 VISTAS CLAVE */}
              <div>
                <h4 className="font-black text-slate-900 text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  Las 3 Vistas de Trabajo:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded-lg">
                        1. Vista Planta (X - Z)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      Vista aérea superior. Es ideal para definir el terreno, colocar columnas perimetrales en sus coordenadas de base y trazar la distribución longitudinal de correas.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded-lg">
                        2. Vista Elevación (X - Y)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      Vista frontal. Es la vista principal para dibujar las alturas reales de columnas, cordones superiores e inferiores de tijerales, arcos parabólicos y montantes.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded-lg">
                        3. Vista 3D Espacial
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      Modelo interactivo tridimensional con extrusión real de perfiles, placas base con pernos de anclaje y cobertura ondulada Aluzinc TR-4 paramétrica.
                    </p>
                  </div>
                </div>
              </div>

              {/* REGLAS PARA DIBUJAR COLUMNAS Y VIGAS */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  📐 Reglas Básicas de Trazado:
                </h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-[10px]">
                      A
                    </span>
                    <div>
                      <strong>Columnas con altura deseada:</strong> Selecciona la herramienta <code>Col</code>. En la barra aparecerá el selector de altura (ej. 4.0m o 5.0m). Al hacer clic en el lienzo, la columna se coloca inmediatamente con esa altura exacta.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center shrink-0 text-[10px]">
                      B
                    </span>
                    <div>
                      <strong>Vigas y Tijerales continuos:</strong> Haz clic en el primer punto/nodo y luego en el segundo punto. El trazo continuará encadenado para que puedas formar triángulos o vigas continuas sin pausas. Para terminar el tramo, pulsa <code>Esc</code> o el botón "Cancelar / Terminar".
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-black flex items-center justify-center shrink-0 text-[10px]">
                      C
                    </span>
                    <div>
                      <strong>Atracción Magnética (Snap):</strong> Al acercar el cursor a un nodo existente, verás un anillo resaltado. Al hacer clic se acopla con tolerancia milimétrica automática.
                    </div>
                  </li>
                </ul>
              </div>

              {/* ACCIÓN RÁPIDA */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('parabolico')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <span>Siguiente: Cómo Crear Techos Parabólicos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 2. TECHO PARABÓLICO */}
          {activeTab === 'parabolico' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Techo Parabólico Reticulado (Arco Autoportante)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Ideal para losas deportivas, coliseos, naves de almacenaje y hangares de gran luz (12m a 35m).
                  </p>
                </div>
                <button
                  onClick={() => handleLoadTemplate('parabolico')}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Cargar Ejemplo Parabólico (1 Clic)</span>
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Pasos para Diseñarlo Manualmente desde Cero:
                </h4>
                <ol className="space-y-3 text-xs text-slate-600 list-decimal pl-5">
                  <li className="leading-relaxed">
                    <strong>Establecer los apoyos en Elevación (X - Y):</strong> Coloca una columna izquierda en X=0 con altura de 4.5m y una columna derecha en X=15m con altura de 4.5m.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Definir la flecha del arco:</strong> La flecha estándar para techos parabólicos en Perú es entre 1/6 y 1/8 de la luz libre (para 15m de luz, una flecha de 2.0m a 2.5m es óptima para evitar empozamiento de agua).
                  </li>
                  <li className="leading-relaxed">
                    <strong>Trazo de arco o plantilla:</strong> Puedes trazar los tramos de la curva conectando nodos o usar el generador paramétrico en <em>Ayudas CAD</em>.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Cobertura TR-4 Curva:</strong> En la vista 3D el software genera automáticamente la lámina de Aluzinc curvada continua que abraza los arcos con las crestas trapezoidales orientadas según la caída.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* 3. TECHO A DOS AGUAS */}
          {activeTab === 'dos_aguas' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Techo a Dos Aguas (Gable Truss con Cumbrera)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    La estructura industrial más clásica y robusta para almacenes, talleres y naves fabriles.
                  </p>
                </div>
                <button
                  onClick={() => handleLoadTemplate('dos_aguas')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  <Building className="w-4 h-4" />
                  <span>Cargar Ejemplo 2 Aguas (1 Clic)</span>
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Cálculo Geométrico Recomendado:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Pendiente Mínima:</span>
                    <p className="text-slate-600 leading-snug">
                      Para calaminas metálicas continuas se recomienda 12% a 20%. Para una nave de 12m de luz, la cumbrera central se elevará aproximadamente 1.20m a 1.50m sobre el nivel de las columnas.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">Separación de Correas:</span>
                    <p className="text-slate-600 leading-snug">
                      Las correas tipo C o Z deben colocarse cada 0.90m a 1.20m para brindar apoyo rígido a las planchas de Aluzinc calibre 0.40mm o 0.50mm.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. TECHO A UN AGUA */}
          {activeTab === 'un_agua' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Techo a Un Agua (Monopendiente / Tinglado)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Excelente para cocheras, ampliaciones adosadas a muros existentes y tinglados de menor luz.
                  </p>
                </div>
                <button
                  onClick={() => handleLoadTemplate('un_agua')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  <Layers className="w-4 h-4" />
                  <span>Cargar Ejemplo 1 Agua (1 Clic)</span>
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Configuración de Desnivel:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para asegurar el drenaje pluvial hacia una sola canaleta posterior, define la columna delantera más alta (ej. 4.5m o 5.0m) y la columna trasera más baja (ej. 3.5m). La viga inclinada soportará directamente las correas perpendiculares.
                </p>
              </div>
            </div>
          )}

          {/* 5. MEZZANINE */}
          {activeTab === 'mezzanine' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-2xl">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Mezzanine / Entrepiso Estructural (Metal Deck)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Estructura reticular de piso para oficinas industriales, almacenes en segundo nivel y altillos.
                  </p>
                </div>
                <button
                  onClick={() => handleLoadTemplate('mezzanine')}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  <Box className="w-4 h-4" />
                  <span>Cargar Ejemplo Mezzanine (1 Clic)</span>
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Estructuración:
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Consiste en una cuadrícula de columnas tubulares de alta sección (ej. 150x150x4.5mm), vigas maestras principales y viguetas secundarias cada 1.00m para soportar placa colaborante de acero y losa de concreto.
                </p>
              </div>
            </div>
          )}

          {/* ATAJOS Y CONSEJOS */}
          {activeTab === 'atajos' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Atajos de Teclado y Gestos Rápidos:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Cancelar trazo o deseleccionar:</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">Esc</kbd>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Eliminar nodo o tramo seleccionado:</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">Supr / Delete</kbd>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Deshacer última acción:</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">Ctrl + Z</kbd>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Rehacer acción:</span>
                  <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold shadow-2xs">Ctrl + Y</kbd>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Panorámica en pantalla táctil:</span>
                  <span className="font-bold text-slate-900">Arrastrar con herramienta Mover</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Mover Dock de herramientas si estorba:</span>
                  <span className="font-bold text-amber-700">Arrastrar desde "Mover Dock"</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            💡 Puedes abrir esta guía en cualquier momento desde el botón <strong>[ TUTORIAL ]</strong>.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            Entendido / Empezar a Diseñar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechosTutorialModal;
