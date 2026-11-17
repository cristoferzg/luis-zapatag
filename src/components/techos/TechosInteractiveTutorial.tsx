import React, { useState } from 'react';
import { 
  GraduationCap, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Layers, 
  Columns, 
  Grid, 
  Box, 
  Eye, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Play
} from 'lucide-react';
import { UseTechosCadEngineReturn } from './useTechosCadEngineState';
import { ToolModoCad, VistaTechoCAD } from './techosCadEngineTypes';
import { INVENTARIO_PERFILES_TUBULARES } from './techosCadCatalog';

interface TechosInteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  engineState: UseTechosCadEngineReturn;
  activeVista: VistaTechoCAD;
  onChangeVista: (v: VistaTechoCAD) => void;
  activeTool?: ToolModoCad;
  onChangeTool?: (tool: ToolModoCad) => void;
  onChangeColHeight?: (h: number) => void;
}

export const TechosInteractiveTutorial: React.FC<TechosInteractiveTutorialProps> = ({
  isOpen,
  onClose,
  engineState,
  activeVista,
  onChangeVista,
  onChangeTool,
  onChangeColHeight
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Acciones interactivas para cada paso
  const handleActionStep1 = () => {
    onChangeVista('seccion');
    showFeedback('✓ Vista cambiada a Elevación / Sección (X - Y) para diseñar la cercha');
  };

  const handleActionStep2 = () => {
    if (onChangeTool) onChangeTool('draw_col');
    if (onChangeColHeight) onChangeColHeight(4.5);
    // Insertar dos columnas de muestra en X=0 y X=10 a 4.5m si el lienzo está vacío
    if (Object.keys(engineState.nodes).length <= 2) {
      const n1Base = engineState.addNode(0, 0, 0, true);
      const n1Top = engineState.addNode(0, 4.5, 0, false);
      engineState.addSegment(n1Base, n1Top, 'columna');

      const n2Base = engineState.addNode(10, 0, 0, true);
      const n2Top = engineState.addNode(10, 4.5, 0, false);
      engineState.addSegment(n2Base, n2Top, 'columna');
      showFeedback('✓ Columnas automáticas generadas en X=0m y X=10m (Altura 4.50m)');
    } else {
      showFeedback('✓ Herramienta Columna (4.50m) activada. Haz clic en el lienzo');
    }
  };

  const handleActionStep3 = () => {
    engineState.setSnapEnabled(true);
    engineState.setSnapGridSizeM(0.25);
    showFeedback('✓ O-Snap Magnético y Retícula fijados en 0.25 m (Precisión milimétrica)');
  };

  const handleActionStep4 = () => {
    // Generar un tijeral a dos aguas cerrado entre columnas
    let leftTopId = '';
    let rightTopId = '';
    
    // Buscar nodos de tope de columna o crearlos
    const allNodes = Object.values(engineState.nodes);
    const nLeft = allNodes.find(n => Math.abs(n.x - 0) < 0.2 && n.y > 3);
    const nRight = allNodes.find(n => Math.abs(n.x - 10) < 0.2 && n.y > 3);

    if (nLeft) leftTopId = nLeft.id;
    else {
      const b = engineState.addNode(0, 0, 0, true);
      leftTopId = engineState.addNode(0, 4.5, 0, false);
      engineState.addSegment(b, leftTopId, 'columna');
    }

    if (nRight) rightTopId = nRight.id;
    else {
      const b = engineState.addNode(10, 0, 0, true);
      rightTopId = engineState.addNode(10, 4.5, 0, false);
      engineState.addSegment(b, rightTopId, 'columna');
    }

    // Cumbrera en X=5, Y=6.0m
    const cumbreraId = engineState.addNode(5.0, 6.0, 0, false);

    // Trazar perímetro cerrado:
    // 1. Cordón superior izquierdo (Left -> Cumbrera)
    engineState.addSegment(leftTopId, cumbreraId, 'cordon_superior');
    // 2. Cordón superior derecho (Cumbrera -> Right)
    engineState.addSegment(cumbreraId, rightTopId, 'cordon_superior');
    // 3. Cordón inferior tirante (Right -> Left) -> Cierra el triángulo
    engineState.addSegment(rightTopId, leftTopId, 'cordon_inferior');

    // Montante central de cumbrera (Cumbrera -> Centro del tirante en Y=4.5)
    const centroTiranteId = engineState.addNode(5.0, 4.5, 0, false);
    engineState.addSegment(cumbreraId, centroTiranteId, 'montante');

    showFeedback('✓ ¡Perímetro cerrado con éxito! Tijeral triangular conectado sin nodos duplicados');
  };

  const handleActionStep5 = () => {
    // Asignar perfiles estructurales comerciales recomendados
    const profCol = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === 'prof_sq_100x100_30') || INVENTARIO_PERFILES_TUBULARES[0];
    const profCordon = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === 'prof_rect_100x50_25') || INVENTARIO_PERFILES_TUBULARES[1];

    if (profCol && profCordon) {
      engineState.setActiveProfileId(profCordon.id);
      // Actualizar perfiles existentes
      Object.values(engineState.segments).forEach(seg => {
        if (seg.rolEstructural === 'columna') {
          engineState.updateSegmentProfile(seg.id, profCol.id);
        } else {
          engineState.updateSegmentProfile(seg.id, profCordon.id);
        }
      });
      showFeedback('✓ Perfiles asignados: Columnas (100x100x3.0mm) y Cercha (100x50x2.5mm)');
    }
  };

  const handleActionStep6 = () => {
    onChangeVista('3d');
    showFeedback('✓ Cambiado a Visor 3D: Inspecciona la cobertura TR-4 y estructura espacial');
  };

  const steps = [
    {
      title: 'Paso 1: Entorno CAD y Vistas de Trabajo',
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      tag: 'Fundamento',
      content: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            Para diseñar techos metálicos profesionales, el lienzo cuenta con 3 vistas clave:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-200">
            <li><strong className="text-amber-300">Elevación / Sección (X - Y):</strong> La vista ideal para trazar alturas de columna, flechas parabólicas y tijerales a dos aguas.</li>
            <li><strong className="text-blue-300">Planta (X - Z):</strong> Vista superior del terreno para distribuir columnas y espaciado de correas.</li>
            <li><strong className="text-emerald-300">Visor 3D:</strong> Modelo tridimensional con espesor real de acero y coberturas TR-4.</li>
          </ul>
        </div>
      ),
      actionButton: {
        text: 'Cambiar a Vista Elevación (X-Y)',
        action: handleActionStep1
      }
    },
    {
      title: 'Paso 2: Dibujar Columnas con Altura Exacta',
      icon: <Columns className="w-5 h-5 text-amber-400" />,
      tag: 'Trazado Base',
      content: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            Las columnas nacen con <strong className="text-white">apoyo fijo empotrado</strong> (placa base en suelo Y=0) y suben verticalmente hasta la altura de hombro requerida:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-200">
            <li>Selecciona la herramienta <span className="text-amber-300 font-bold">Columna</span> en la barra de herramientas.</li>
            <li>Usa la barra inferior para definir la altura antes de hacer clic (ej. 4.0m, 4.5m o 5.0m).</li>
            <li>Un solo clic en el lienzo genera la columna vertical completa con su placa base.</li>
          </ul>
        </div>
      ),
      actionButton: {
        text: 'Activar Columna y Colocar Muestra (4.50m)',
        action: handleActionStep2
      }
    },
    {
      title: 'Paso 3: Snap Magnético (O-Snap) & Retícula',
      icon: <Grid className="w-5 h-5 text-emerald-400" />,
      tag: 'Precisión',
      content: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            Para evitar errores milimétricos y discrepancias de coordenadas, el sistema cuenta con dos niveles de Snap:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-200">
            <li><strong className="text-emerald-400">O-Snap Magnético a Nodos:</strong> Al pasar el cursor o dedo cerca de un nodo existente, se imanta automáticamente mostrando un diamante verde <span className="font-mono text-emerald-300">◇ SNAP</span>.</li>
            <li><strong className="text-blue-300">Snap a Retícula:</strong> Fuerza coordenadas a intervalos exactos de 0.25 m o 0.50 m.</li>
            <li>Al hacer clic sobre un nodo imantado, se reutiliza exactamente el mismo nodo, evitando duplicados.</li>
          </ul>
        </div>
      ),
      actionButton: {
        text: 'Ajustar O-Snap a 0.25m',
        action: handleActionStep3
      }
    },
    {
      title: 'Paso 4: Trazar y Cerrar Perímetros sin Error',
      icon: <Sparkles className="w-5 h-5 text-sky-400" />,
      tag: 'Tijeral / Cercha',
      content: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            Para construir una cercha o tijeral cerrado sin dejar vértices sueltos:
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-slate-200">
            <li>Activa <strong className="text-amber-300">Viga</strong> o <strong className="text-amber-300">Tijeral</strong> y haz clic en el nodo superior de la columna izquierda.</li>
            <li>Haz clic en el vértice superior de cumbrera (ej. X=5.0m, Y=6.0m).</li>
            <li>Haz clic en el tope de la columna derecha.</li>
            <li>Regresa y haz clic en el nodo inicial izquierdo. El sistema mostrará <strong className="text-emerald-300">¡Perímetro cerrado con éxito!</strong> y terminará la figura automáticamente.</li>
          </ol>
        </div>
      ),
      actionButton: {
        text: 'Trazar Tijeral Triangular de Ejemplo',
        action: handleActionStep4
      }
    },
    {
      title: 'Paso 5: Asignar y Cambiar Perfiles (ASTM A500)',
      icon: <Box className="w-5 h-5 text-purple-400" />,
      tag: 'Estructural',
      content: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            Personaliza el calibre y sección de cada barra de acero en el panel derecho de <strong className="text-white">Propiedades CAD</strong>:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-200">
            <li><strong className="text-amber-300">Columnas:</strong> Tubo cuadrado 100x100x3.0mm o 150x150x4.5mm.</li>
            <li><strong className="text-sky-300">Cordones de Tijeral:</strong> Tubo rectangular 100x50x2.5mm o perfil C.</li>
            <li><strong className="text-emerald-300">Correas de Techo:</strong> Tubo 50x50x2.0mm espaciadas cada 0.90m - 1.20m.</li>
            <li>El peso por metro lineal y los metrados se actualizan de forma instantánea.</li>
          </ul>
        </div>
      ),
      actionButton: {
        text: 'Asignar Perfiles Comerciales Óptimos',
        action: handleActionStep5
      }
    },
    {
      title: 'Paso 6: Visualización 3D y Coberturas Aluzinc TR-4',
      icon: <Eye className="w-5 h-5 text-rose-400" />,
      tag: 'Metrado y 3D',
      content: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            ¡Felicitaciones! Has completado el flujo de diseño estructural:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-200">
            <li>Pasa al <strong className="text-white">Visor 3D</strong> para ver la estructura extruida con placas base, anclajes y cobertura TR-4.</li>
            <li>Usa la pestaña <strong className="text-emerald-300">Despiece 1D</strong> para obtener el plan de corte de barras de 6.00m con merma mínima.</li>
            <li>Revisa el análisis de cargas de viento y sismo bajo norma peruana RNE (E.020 / E.030 / E.090).</li>
          </ul>
        </div>
      ),
      actionButton: {
        text: 'Ir a Vista 3D y Finalizar',
        action: handleActionStep6
      }
    }
  ];

  const current = steps[currentStep];

  // MODO MINIMIZADO (BADGE FLOTANTE DISCRETO)
  if (isMinimized) {
    return (
      <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/95 text-amber-400 rounded-2xl shadow-2xl border border-amber-500/60 backdrop-blur-md text-xs font-black hover:bg-slate-800 transition-all cursor-pointer group"
        >
          <GraduationCap className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>Guía CAD: {currentStep + 1}/6</span>
          <span className="text-slate-400 font-normal truncate max-w-[130px] hidden sm:inline">{current.tag}</span>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[420px] max-w-[440px] bg-slate-950/95 text-white rounded-2xl shadow-2xl border border-amber-500/50 backdrop-blur-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col font-sans">
      
      {/* HEADER DEL TUTORIAL */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-amber-500 text-slate-950 shrink-0">
            <GraduationCap className="w-4 h-4 font-black" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-amber-300">TUTORIAL INTERACTIVO</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                Paso {currentStep + 1} de {steps.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium truncate">
              {current.tag} • Vista: <span className="font-mono text-amber-300 font-bold uppercase">{activeVista}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Minimizar tutorial a un icono flotante"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="w-full bg-slate-900 h-1 flex">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={`h-full flex-1 transition-all duration-300 ${
              idx <= currentStep ? 'bg-amber-400' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* CUERPO DEL PASO */}
      <div className="p-4 space-y-3.5 max-h-[360px] overflow-y-auto">
        <div className="flex items-center gap-2">
          {current.icon}
          <h4 className="font-extrabold text-sm text-white">
            {current.title}
          </h4>
        </div>

        {current.content}

        {/* FEEDBACK TEMPORAL DE ACCIÓN */}
        {feedbackMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* BOTÓN DE ACCIÓN INTERACTIVA (PROBAR EN VIVO) */}
        {current.actionButton && (
          <button
            onClick={current.actionButton.action}
            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>{current.actionButton.text}</span>
          </button>
        )}
      </div>

      {/* FOOTER DE NAVEGACIÓN */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>

        <div className="flex items-center gap-1">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? 'w-4 bg-amber-400' : 'bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Ir al paso ${i + 1}`}
            />
          ))}
        </div>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalizar</span>
          </button>
        )}
      </div>
    </div>
  );
};
