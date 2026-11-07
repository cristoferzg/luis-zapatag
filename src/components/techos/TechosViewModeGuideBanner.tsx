// Banner Informativo y Didáctico de Vistas CAD (Planta vs Elevación vs 3D)
// Orienta a usuarios novatos en la relación entre el suelo, las columnas y el techo
import React, { useState } from 'react';
import { 
  Layers, 
  Columns, 
  Eye, 
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Undo2,
  Redo2
} from 'lucide-react';
import AtajosTeclado, { GrupoAtajos } from '../common/AtajosTeclado';

// Comandos de teclado de Techos (los mismos que atiende TechosCanvas2D).
const ATAJOS_TECHOS: GrupoAtajos[] = [
  { titulo: 'Herramientas', atajos: [
    { teclas: ['S', '1'], accion: 'Seleccionar' },
    { teclas: ['V', '2'], accion: 'Viga' },
    { teclas: ['A', '3'], accion: 'Arco curvo' },
    { teclas: ['C', '4'], accion: 'Columna' },
    { teclas: ['T', '5'], accion: 'Tijeral' },
    { teclas: ['G', '6'], accion: 'Correa' },
    { teclas: ['X', '7'], accion: 'Cruz (arriostre)' },
    { teclas: ['N', '8'], accion: 'Nodo' },
    { teclas: ['M', '9'], accion: 'Medir' },
    { teclas: ['P', '0'], accion: 'Mover el plano' },
    { teclas: ['O'], accion: 'Trazo recto 90° (orto)' },
    { teclas: ['H'], accion: 'Ocultar lo seleccionado (sin borrar)' },
    { teclas: ['Shift', 'H'], accion: 'Mostrar todo lo oculto' },
  ] },
  { titulo: 'Edición', atajos: [
    { teclas: ['Ctrl', 'Z'], accion: 'Atrás (deshacer)' },
    { teclas: ['Ctrl', 'Y'], accion: 'Adelante (rehacer)' },
    { teclas: ['Supr'], accion: 'Borrar lo seleccionado' },
    { teclas: ['Esc'], accion: 'Cancelar el trazo' },
    { teclas: ['Ctrl', 'C'], accion: 'Copiar' },
    { teclas: ['Ctrl', 'V'], accion: 'Pegar' },
  ] },
  { titulo: 'Vista', atajos: [
    { teclas: ['Rueda'], accion: 'Acercar / alejar' },
    { teclas: ['Clic der.'], accion: 'Mover el plano (o Shift + arrastrar)' },
  ] },
];
import { VistaTechoCAD } from './techosCadEngineTypes';

interface TechosViewModeGuideBannerProps {
  vista: VistaTechoCAD;
  onOpenWizard?: () => void;
  onOpenControlsSumilla: () => void;
  colHeightSetting?: number;
  totalNodos?: number;
  totalSegmentos?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const TechosViewModeGuideBanner: React.FC<TechosViewModeGuideBannerProps> = ({
  vista,
  onOpenWizard: _onOpenWizard,
  onOpenControlsSumilla,
  colHeightSetting = 4.0,
  totalNodos = 0,
  totalSegmentos = 0,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) => {
  const [isCollapsedMobile, setIsCollapsedMobile] = useState<boolean>(false);

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs select-none transition-all">
      <div className="px-2.5 py-1 sm:py-1.5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        
        {/* EXPLICACIÓN DIDÁCTICA DE LA VISTA ACTIVA */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1 rounded-lg shrink-0 ${
            vista === 'planta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            vista === 'seccion' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            'bg-sky-500/20 text-sky-400 border border-sky-500/30'
          }`}>
            {vista === 'planta' && <Layers className="w-3.5 h-3.5" />}
            {vista === 'seccion' && <Columns className="w-3.5 h-3.5" />}
            {vista === '3d' && <Eye className="w-3.5 h-3.5" />}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white uppercase tracking-wider text-[10px] sm:text-xs truncate">
                {vista === 'planta' && 'Planta (X-Z / Suelo y Correas)'}
                {vista === 'seccion' && `Elevación (X-Y / H = ${colHeightSetting.toFixed(2)}m)`}
                {vista === '3d' && 'Visor 3D WebGL'}
              </span>
              <span className="hidden xl:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {totalNodos} nodos • {totalSegmentos} perfiles
              </span>
            </div>
            
            {!isCollapsedMobile && (
              <p className="text-[10px] text-slate-300 truncate hidden md:block">
                {vista === 'planta' && 'Mirando desde arriba: ubica el terreno, las zapatas de columnas y la separación de tijerales.'}
                {vista === 'seccion' && `Mirando de frente: el suelo está en Y=0.00m, las columnas suben hasta Y=${colHeightSetting.toFixed(2)}m y el arco apoya arriba.`}
                {vista === '3d' && 'Gira con el ratón o con gestos táctiles para inspeccionar todas las uniones en 360°.'}
              </p>
            )}
          </div>
        </div>

        {/* ACCIONES DIDÁCTICAS Y ASISTENTES RÁPIDOS */}
        <div className="flex items-center gap-1 shrink-0">
          
          {/* ATRÁS / ADELANTE a la vista en PC (también en 3D) */}
          {onUndo && (
            <button onClick={onUndo} disabled={!canUndo} title="Atrás: deshacer (Ctrl+Z)"
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold cursor-pointer disabled:opacity-35 disabled:cursor-default">
              <Undo2 className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Atrás</span>
            </button>
          )}
          {onRedo && (
            <button onClick={onRedo} disabled={!canRedo} title="Adelante: rehacer (Ctrl+Y)"
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold cursor-pointer disabled:opacity-35 disabled:cursor-default">
              <Redo2 className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Adelante</span>
            </button>
          )}

          {/* ATAJOS DE TECLADO (lista rápida) */}
          <AtajosTeclado grupos={ATAJOS_TECHOS} oscuro onGuiaCompleta={onOpenControlsSumilla} />

          {/* GUÍA COMPLETA (celular: no hay teclado) */}
          <button
            onClick={onOpenControlsSumilla}
            className="md:hidden p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Ver guía de gestos y controles"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* COLAPSAR DESCRIPCIÓN EN MÓVIL */}
          <button
            onClick={() => setIsCollapsedMobile(prev => !prev)}
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Alternar tamaño del banner"
          >
            {isCollapsedMobile ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>

        </div>

      </div>
    </div>
  );
};
