import React, { useState } from 'react';
import { 
  Square, 
  Building2, 
  Layers, 
  CheckCircle2, 
  Box, 
  Calculator, 
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Menu,
  Plus,
  FileText,
  DollarSign
} from 'lucide-react';

export type StructuralStage = 'geometria' | 'estructura' | 'cobertura' | 'revision' | '3d' | 'metrado' | 'planos' | 'presupuesto';

interface StructuralWorkflowBarProps {
  currentStage: StructuralStage;
  onSelectStage: (stage: StructuralStage) => void;
  onOpenNewRoofModal: () => void;
  projectName: string;
  onOpenCarpinteria?: () => void;
  onUpdateProjectName?: (name: string) => void;
  onToggleMenu?: () => void;
  onGoBack?: () => void;
}

interface StageDefinition {
  id: StructuralStage;
  label: string;
  stepNumber: number;
  icon: React.ReactNode;
  hint: string;
}

export const STAGES: StageDefinition[] = [
  { id: 'geometria', label: '1. GEOMETRÍA', stepNumber: 1, icon: <Square className="w-3.5 h-3.5" />, hint: 'Medidas, sectores y caídas' },
  { id: 'estructura', label: '2. ESTRUCTURA', stepNumber: 2, icon: <Building2 className="w-3.5 h-3.5" />, hint: 'Columnas, vigas y tijerales' },
  { id: 'cobertura', label: '3. COBERTURA', stepNumber: 3, icon: <Layers className="w-3.5 h-3.5" />, hint: 'Planchas, canaletas y bajantes' },
  { id: 'revision', label: '4. REVISIÓN', stepNumber: 4, icon: <CheckCircle2 className="w-3.5 h-3.5" />, hint: 'Verificación técnica y cargas' },
  { id: '3d', label: '5. MODELO 3D', stepNumber: 5, icon: <Box className="w-3.5 h-3.5" />, hint: 'Visualizador tridimensional' },
  { id: 'metrado', label: '6. METRADO', stepNumber: 6, icon: <Calculator className="w-3.5 h-3.5" />, hint: 'Materiales, kg de acero y costos' },
  { id: 'planos', label: '7. PLANOS CAD', stepNumber: 7, icon: <FileText className="w-3.5 h-3.5" />, hint: 'Planos y láminas técnicas de ingeniería' },
  { id: 'presupuesto', label: '8. PRESUPUESTO', stepNumber: 8, icon: <DollarSign className="w-3.5 h-3.5" />, hint: 'Análisis de costos y presupuesto del proyecto' },
];

export const StructuralWorkflowBar: React.FC<StructuralWorkflowBarProps> = ({
  currentStage,
  onSelectStage,
  onOpenNewRoofModal,
  projectName,
  onUpdateProjectName,
  onToggleMenu,
  onGoBack
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const currentIndex = STAGES.findIndex(s => s.id === currentStage);
  const currentStageObj = STAGES[currentIndex] || STAGES[0];

  // Short label mapping for compact mobile view
  const shortLabels: Record<string, string> = {
    'geometria': 'GEOM',
    'estructura': 'ESTR',
    'cobertura': 'COBE',
    'revision': 'REV',
    '3d': '3D',
    'metrado': 'METR',
    'planos': 'PLANOS',
    'presupuesto': 'PRESUP'
  };

  if (isCollapsed) {
    return (
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 px-3 py-1 flex items-center justify-between overflow-x-auto no-scrollbar select-none w-full shadow-2xs z-30 transition-all">
        <div className="flex items-center space-x-2 shrink-0">
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
              title="Volver"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenNewRoofModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
            title="Crear nuevo techo"
          >
            <Plus className="w-3 h-3" />
            <span>NUEVO</span>
          </button>

          <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
            {projectName || 'Techo Metálico'}
          </span>
        </div>

        {/* Current Active Step Pill */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center space-x-1">
            <span className="text-blue-600">{currentStageObj.icon}</span>
            <span>{currentStageObj.label}</span>
          </div>

          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center space-x-0.5 text-xs font-semibold border border-slate-200"
            title="Expandir barra de flujo de etapas"
          >
            <span className="text-[10px] hidden sm:inline">ETAPAS</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 px-3 sm:px-4 py-1.5 flex flex-nowrap items-center justify-between overflow-x-auto no-scrollbar touch-pan-x select-none w-full shadow-2xs z-30 transition-all">
      
      {/* Left: Project title & [NUEVO TECHO] */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 mr-3">
        {onGoBack && (
          <button
            type="button"
            onClick={onGoBack}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-300/80 active:scale-95 shrink-0"
            title="Volver al Panel Principal de Innova"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {onToggleMenu && (
          <button
            type="button"
            onClick={onToggleMenu}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-all cursor-pointer lg:hidden flex items-center justify-center border border-slate-300/80 active:scale-95 shrink-0"
            title="Abrir Menú Principal"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onOpenNewRoofModal}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer border border-blue-700/30 active:scale-95 shrink-0"
          title="Crear nuevo techo o elegir plantilla"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">NUEVO TECHO</span>
          <span className="sm:hidden">NUEVO</span>
        </button>

        <div className="hidden md:block border-l border-slate-200 pl-2.5 shrink-0">
          <span className="text-[9px] text-slate-400 font-extrabold block leading-none tracking-wider uppercase">PROYECTO</span>
          <input
            type="text"
            value={projectName}
            onChange={e => onUpdateProjectName?.(e.target.value)}
            className="text-xs font-bold text-slate-800 bg-slate-50 border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none rounded-md px-1.5 py-0.5 max-w-[150px] transition-all"
            placeholder="Nombre del Techo"
          />
        </div>
      </div>

      {/* Center: Stage steps */}
      <div className="flex flex-nowrap items-center space-x-1 sm:space-x-1.5 shrink-0 overflow-x-auto no-scrollbar touch-pan-x py-0.5">
        {STAGES.map((stage, idx) => {
          const isActive = stage.id === currentStage;
          const isPassed = idx < currentIndex;

          return (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => onSelectStage(stage.id)}
                className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs border border-blue-600 ring-2 ring-blue-500/20'
                    : isPassed
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/90 font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 font-medium'
                }`}
                title={stage.hint}
              >
                <span className={isActive ? 'text-white' : isPassed ? 'text-emerald-600' : 'text-slate-500'}>
                  {stage.icon}
                </span>
                <span className="hidden md:inline">{stage.label}</span>
                <span className="hidden sm:inline md:hidden">{stage.label.replace(/^\d+\.\s*/, '')}</span>
                <span className="sm:hidden">{shortLabels[stage.id] || stage.label.replace(/^\d+\.\s*/, '')}</span>
                {isPassed && <span className="text-emerald-600 text-[10px] font-bold ml-0.5">✓</span>}
              </button>

              {idx < STAGES.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: Stage count indicator & Collapse button */}
      <div className="shrink-0 ml-3 flex items-center space-x-2">
        <div className="hidden xl:block text-[10px] text-slate-400 font-mono font-bold tracking-wider">
          <span>{currentIndex + 1} / {STAGES.length}</span>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          title="Colapsar barra de etapas para maximizar área de trabajo"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
