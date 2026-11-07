// Panel de Herramientas de Dibujo y Selección CAD Vectorial para Techos Metálicos (CadToolbox)
// Cohesivo con el diseño amigable de la plataforma Innova Contratistas
import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  MousePointer, 
  PenTool, 
  Circle, 
  Move, 
  Trash2, 
  RotateCcw, 
  RotateCw,
  Columns,
  Grid,
  Ruler,
  Crosshair,
  Layers,
  Box,
  Spline,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UseTechosCadEngineReturn } from './useTechosCadEngineState';
import { ToolModoCad } from './techosCadEngineTypes';
import { PERFILES_TECHOS_AGRUPADOS } from './techosCadCatalog';

interface CadToolboxProps {
  engineState: UseTechosCadEngineReturn;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const CadToolbox: React.FC<CadToolboxProps> = ({
  engineState,
  isMobileDrawer = false,
  onCloseMobileDrawer
}) => {
  const activeTool = engineState.activeTool;
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState<boolean>(false);

  const handleToolSelect = (tool: ToolModoCad) => {
    engineState.setActiveTool(tool);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  const toolsList: { 
    id: ToolModoCad; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    desc: string;
    shortcut: string;
    activeClass: string;
    iconColor: string;
    bgHover: string;
  }[] = [
    { 
      id: 'select', 
      label: 'Seleccionar / Mover', 
      icon: MousePointer, 
      desc: 'Arrastrar nodos y barras',
      shortcut: 'S',
      activeClass: 'bg-slate-900 text-white border-slate-900 shadow-md',
      iconColor: 'text-slate-600',
      bgHover: 'hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900'
    },
    { 
      id: 'draw_line', 
      label: 'Viga / Tramo Recto', 
      icon: PenTool, 
      desc: 'Trazar tramo continuo',
      shortcut: 'V',
      activeClass: 'bg-rose-600 text-white border-rose-600 shadow-rose-200 shadow-md',
      iconColor: 'text-rose-600',
      bgHover: 'hover:bg-rose-50 hover:border-rose-300 hover:text-rose-900'
    },
    { 
      id: 'draw_arc', 
      label: 'Arco Parabólico', 
      icon: Spline, 
      desc: 'Curva por 2 puntos y flecha',
      shortcut: 'A',
      activeClass: 'bg-amber-500 text-slate-950 border-amber-500 shadow-amber-200 shadow-md',
      iconColor: 'text-amber-600',
      bgHover: 'hover:bg-amber-50 hover:border-amber-300 hover:text-amber-950'
    },
    { 
      id: 'draw_col', 
      label: 'Columna', 
      icon: Columns, 
      desc: 'Columna vertical H',
      shortcut: 'C',
      activeClass: 'bg-blue-600 text-white border-blue-600 shadow-blue-200 shadow-md',
      iconColor: 'text-blue-600',
      bgHover: 'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-900'
    },
    { 
      id: 'draw_tijeral', 
      label: 'Tijeral / Cercha', 
      icon: Layers, 
      desc: 'Cordón reticulado',
      shortcut: 'T',
      activeClass: 'bg-purple-600 text-white border-purple-600 shadow-purple-200 shadow-md',
      iconColor: 'text-purple-600',
      bgHover: 'hover:bg-purple-50 hover:border-purple-300 hover:text-purple-900'
    },
    { 
      id: 'draw_correa', 
      label: 'Correa C/Z', 
      icon: Grid, 
      desc: 'Hilera para planchas',
      shortcut: 'G',
      activeClass: 'bg-lime-600 text-white border-lime-600 shadow-lime-200 shadow-md',
      iconColor: 'text-lime-600',
      bgHover: 'hover:bg-lime-50 hover:border-lime-300 hover:text-lime-900'
    },
    { 
      id: 'draw_arriostre', 
      label: 'Arriostre / Cruz', 
      icon: Crosshair, 
      desc: 'Tensor contra viento',
      shortcut: 'X',
      activeClass: 'bg-pink-600 text-white border-pink-600 shadow-pink-200 shadow-md',
      iconColor: 'text-pink-600',
      bgHover: 'hover:bg-pink-50 hover:border-pink-300 hover:text-pink-900'
    },
    { 
      id: 'draw_node', 
      label: 'Punto Nodo', 
      icon: Circle, 
      desc: 'Insertar nodo de apoyo',
      shortcut: 'N',
      activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 shadow-md',
      iconColor: 'text-indigo-600',
      bgHover: 'hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-900'
    },
    { 
      id: 'measure', 
      label: 'Medir / Cota', 
      icon: Ruler, 
      desc: 'Verificar distancias',
      shortcut: 'M',
      activeClass: 'bg-sky-500 text-slate-950 border-sky-500 shadow-sky-200 shadow-md',
      iconColor: 'text-sky-600',
      bgHover: 'hover:bg-sky-50 hover:border-sky-300 hover:text-sky-950'
    },
    { 
      id: 'pan', 
      label: 'Encuadre Pan', 
      icon: Move, 
      desc: 'Arrastrar lienzo',
      shortcut: 'P',
      activeClass: 'bg-teal-600 text-white border-teal-600 shadow-teal-200 shadow-md',
      iconColor: 'text-teal-600',
      bgHover: 'hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900'
    },
  ];

  // Interceptar rueda del ratón para scroll vertical interno sin afectar el zoom del lienzo
  const handleScrollWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div 
      onWheel={handleScrollWheel}
      className={`
        bg-white text-slate-800 border-r border-slate-200 flex flex-col h-full select-none shadow-xs transition-all duration-200 relative z-10
        ${isMobileDrawer ? 'w-80 max-w-full' : isDesktopCollapsed ? 'w-16 shrink-0' : 'w-64 lg:w-72 shrink-0'}
      `}
    >
      {/* BOTÓN COLAPSAR / EXPANDIR BARRA DE HERRAMIENTAS DESKTOP */}
      {!isMobileDrawer && (
        <button
          onClick={() => setIsDesktopCollapsed(prev => !prev)}
          className="absolute -right-3.5 top-3.5 z-30 w-7 h-7 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-600 hover:text-amber-600 hover:border-amber-400 cursor-pointer transition-all hover:scale-105"
          title={isDesktopCollapsed ? "Expandir barra de herramientas" : "Colapsar barra de herramientas"}
        >
          {isDesktopCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* CABECERA TOOLBOX */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          {(!isDesktopCollapsed || isMobileDrawer) && (
            <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase truncate">
              HERRAMIENTAS CAD
            </h2>
          )}
        </div>
        {isMobileDrawer && onCloseMobileDrawer && (
          <button 
            onClick={onCloseMobileDrawer}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* CONTENIDO SCROLLABLE (MOUSE WHEEL PROTECTED) */}
      <div 
        onWheel={handleScrollWheel}
        className="flex-1 overflow-y-auto p-2.5 space-y-3.5 text-xs scrollbar-thin scrollbar-thumb-slate-200 overflow-x-hidden"
      >
        {/* SECCIÓN 1: HERRAMIENTAS DE TRAZADO VECTORIAL Y ESTRUCTURAL */}
        <div className="space-y-1.5">
          {(!isDesktopCollapsed || isMobileDrawer) && (
            <div className="flex items-center justify-between px-0.5">
              <span className="block font-black text-slate-500 text-[10px] uppercase tracking-wider">
                Trazado Estructural
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {activeTool}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1.5">
            {toolsList.map(t => {
              const IconComp = t.icon;
              const isSelected = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleToolSelect(t.id)}
                  title={`${t.label} — ${t.desc} (Teclado: ${t.shortcut})`}
                  className={`
                    rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer text-left active:scale-[0.98]
                    ${isDesktopCollapsed && !isMobileDrawer ? 'p-2.5 justify-center' : 'px-3 py-2'}
                    ${
                      isSelected 
                        ? t.activeClass 
                        : `bg-white border-slate-200 text-slate-700 ${t.bgHover}`
                    }
                  `}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-current' : t.iconColor}`} />
                  {(!isDesktopCollapsed || isMobileDrawer) && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="truncate leading-tight font-extrabold">{t.label}</div>
                        <div className={`text-[10px] truncate font-medium ${isSelected ? 'text-white/80 dark:text-slate-900/80' : 'text-slate-500'}`}>{t.desc}</div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black font-mono shadow-3xs transition-colors ${
                        isSelected 
                          ? 'bg-black/20 text-white' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {t.shortcut}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 2: PERFIL TUBULAR ACTIVO (SOLO EN MODO EXPANDIDO) */}
        {(!isDesktopCollapsed || isMobileDrawer) && (
          <div className="space-y-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
            <span className="block font-black text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-emerald-600" />
              Perfil Activo Para Trazar
            </span>

            <select
              value={engineState.activeProfileId}
              onChange={(e) => engineState.setActiveProfileId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-bold text-[11px] truncate outline-none cursor-pointer focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors shadow-2xs"
            >
              {PERFILES_TECHOS_AGRUPADOS.map(grp => (
                <optgroup key={grp.norma} label={grp.label} className="font-bold text-slate-800">
                  {grp.items.map(p => (
                    <option key={p.id} value={p.id} className="text-slate-900 font-medium">
                      {p.nombre} ({p.codigoComercial})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="text-[10px] text-slate-500 leading-snug">
              Los tramos computarán automáticamente en metrados y despiece 1D.
            </div>
          </div>
        )}

        {/* SECCIÓN 3: RETÍCULA SNAP & DESHACER / REHACER */}
        {(!isDesktopCollapsed || isMobileDrawer) ? (
          <div className="space-y-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
            <span className="block font-black text-slate-700 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-blue-600" />
              Atracción & Retícula Snap
            </span>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 text-[11px] font-medium">Paso Grid:</span>
              <select
                value={engineState.snapGridSizeM}
                onChange={(e) => engineState.setSnapGridSizeM(parseFloat(e.target.value) || 0.25)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-mono font-bold text-xs cursor-pointer focus:border-amber-500 outline-none shadow-2xs"
              >
                <option value={0.1}>0.10 m (10cm)</option>
                <option value={0.25}>0.25 m (25cm)</option>
                <option value={0.5}>0.50 m (50cm)</option>
                <option value={1.0}>1.00 m (1m)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => engineState.undo()}
                disabled={!engineState.canUndo}
                className="flex-1 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Deshacer (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Deshacer</span>
              </button>

              <button
                onClick={() => engineState.redo()}
                disabled={!engineState.canRedo}
                className="flex-1 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Rehacer (Ctrl+Y)"
              >
                <RotateCw className="w-3.5 h-3.5 text-slate-600" />
                <span>Rehacer</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 items-center pt-2">
            <button
              onClick={() => engineState.undo()}
              disabled={!engineState.canUndo}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer"
              title="Deshacer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => engineState.redo()}
              disabled={!engineState.canRedo}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 disabled:opacity-40 cursor-pointer"
              title="Rehacer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECCIÓN 4: ACCIONES RÁPIDAS SOBRE EL MODELO */}
        {(!isDesktopCollapsed || isMobileDrawer) && (
          <div className="space-y-2 pt-1">
            <span className="block font-black text-slate-500 text-[10px] uppercase tracking-wider px-0.5">
              Acciones del Modelo
            </span>

            {engineState.selectedElementIds.length > 0 && (
              <button
                onClick={() => engineState.deleteSelectedElements()}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-xl border border-rose-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors active:scale-95 text-xs"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Eliminar ({engineState.selectedElementIds.length})</span>
              </button>
            )}

            <button
              onClick={() => {
                engineState.clearScene();
              }}
              className="w-full py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Vaciar Lienzo (Nuevo)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadToolbox;
