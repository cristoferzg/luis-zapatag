// Área de Dibujo y Trabajo Principal CAD (CanvasArea)
// Dominio del espacio visible con barra flotante clara (Zoom, Grid) y pestañas superiores en línea horizontal
import React from 'react';
import { TechosCanvas2D, VistaTechoCAD } from './TechosCanvas2D';
import { UseTechosCadEngineReturn } from './useTechosCadEngineState';

interface CanvasAreaProps {
  engineState?: UseTechosCadEngineReturn;
  design?: any;
  onUpdateDesign?: (updated: any) => void;
  isMobile?: boolean;
  onOpenMobileToolbox?: () => void;
  onOpenMobileProperties?: () => void;
  onNuevoTecho?: () => void;
  onOpenTutorial?: () => void;
  onOpenInteractiveTutorial?: () => void;
  activeVista?: VistaTechoCAD;
  onChangeVista?: (v: VistaTechoCAD) => void;
  showInspector?: boolean;
  setShowInspector?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  engineState,
  design,
  onUpdateDesign,
  onOpenMobileToolbox,
  onOpenMobileProperties,
  onNuevoTecho,
  onOpenTutorial,
  onOpenInteractiveTutorial,
  activeVista,
  onChangeVista,
  showInspector,
  setShowInspector
}) => {
  return (
    <main className="flex-1 h-full flex flex-col bg-slate-100 relative overflow-hidden">
      {/* ÁREA DEL LIENZO CAD 2D/3D */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        <TechosCanvas2D 
          engineState={engineState}
          design={design} 
          onUpdateDesign={onUpdateDesign} 
          onOpenMobileToolbox={onOpenMobileToolbox}
          onOpenMobileProperties={onOpenMobileProperties}
          onNuevoTecho={onNuevoTecho}
          onOpenTutorial={onOpenTutorial}
          onOpenInteractiveTutorial={onOpenInteractiveTutorial}
          activeVista={activeVista}
          onChangeVista={onChangeVista}
          showInspector={showInspector}
          setShowInspector={setShowInspector}
        />
      </div>
    </main>
  );
};

export default CanvasArea;
