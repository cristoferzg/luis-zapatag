import React from 'react';
import { 
  Trash2, 
  Copy, 
  RotateCw,
  Maximize2, 
  Layers, 
  Grid, 
  Magnet, 
  HelpCircle,
  Columns,
  Minus,
  Plus
} from 'lucide-react';
import { ColumnElement, BeamElement, PurlinElement } from './structuralTypes';

export interface StructuralContextMenuPos {
  x: number;
  y: number;
  targetId?: string;
  targetType?: 'column' | 'beam' | 'purlin' | 'sector' | 'canvas';
  targetItem?: any;
}

export type StructuralContextMenuPosition = StructuralContextMenuPos;

export interface StructuralContextMenuProps {
  position: StructuralContextMenuPos | null;
  column?: ColumnElement | null;
  beam?: BeamElement | null;
  purlin?: PurlinElement | null;
  onClose: () => void;
  onRotateColumn?: (id: string) => void;
  onChangeColumnHeight?: (id: string, newHeight: number) => void;
  onChangeColumnProfile?: (id: string, profileId: string) => void;
  onChangeBeamProfile?: (id: string, profileId: string) => void;
  onDeleteElement?: (id: string, type: 'column' | 'beam' | 'purlin' | 'sector') => void;
  onDeleteItem?: (id: string, type: 'column' | 'beam' | 'purlin' | 'sector') => void;
  onDuplicateElement?: (id: string, type: 'column' | 'beam' | 'purlin') => void;
  onDuplicateItem?: (item: any, type: 'column' | 'beam' | 'purlin') => void;
  onAddColumnAt?: (clientX: number, clientY: number) => void;
  onSelectTool?: (tool: any) => void;
  onCenterView?: () => void;
  onToggleGrid?: () => void;
  onToggleSnap?: () => void;
  onOpenHelp?: () => void;
  isGridActive?: boolean;
  isSnapActive?: boolean;
}

export const StructuralContextMenu: React.FC<StructuralContextMenuProps> = ({
  position,
  column,
  beam,
  purlin,
  onClose,
  onRotateColumn,
  onChangeColumnHeight,
  onDeleteElement,
  onDeleteItem,
  onDuplicateElement,
  onDuplicateItem,
  onAddColumnAt,
  onSelectTool = () => {},
  onCenterView = () => {},
  onToggleGrid = () => {},
  onToggleSnap = () => {},
  onOpenHelp = () => {},
  isGridActive = true,
  isSnapActive = true
}) => {
  if (!position) return null;

  const menuWidth = 240;
  const menuHeight = 320;
  const posX = Math.min(window.innerWidth - menuWidth - 10, Math.max(10, position.x));
  const posY = Math.min(window.innerHeight - menuHeight - 10, Math.max(10, position.y));

  const targetType = position.targetType || (column ? 'column' : beam ? 'beam' : purlin ? 'purlin' : 'canvas');
  const targetCol = column || (targetType === 'column' ? position.targetItem : null);
  const targetBeam = beam || (targetType === 'beam' ? position.targetItem : null);
  const targetPurlin = purlin || (targetType === 'purlin' ? position.targetItem : null);

  const handleDelete = (id: string, type: 'column' | 'beam' | 'purlin' | 'sector') => {
    if (onDeleteElement) onDeleteElement(id, type);
    else if (onDeleteItem) onDeleteItem(id, type);
    onClose();
  };

  const handleDuplicate = (id: string, item: any, type: 'column' | 'beam' | 'purlin') => {
    if (onDuplicateElement) onDuplicateElement(id, type);
    else if (onDuplicateItem) onDuplicateItem(item, type);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-auto bg-black/10 backdrop-blur-[1px]"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); onClose(); }}
    >
      <div
        className="absolute bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 w-60 py-2 text-slate-700 text-xs overflow-hidden animate-scaleUp pointer-events-auto select-none divide-y divide-slate-100"
        style={{ left: `${posX}px`, top: `${posY}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Caso 1: Columna */}
        {targetType === 'column' && targetCol && (
          <>
            <div className="px-3 py-2 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Columns className="w-4 h-4 text-blue-600" />
                <span className="font-extrabold text-slate-900">{targetCol.tag || `Columna ${targetCol.id}`}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Pos: X:{targetCol.x.toFixed(2)}m, Y:{targetCol.y.toFixed(2)}m • H: {targetCol.altura || targetCol.alturaM || 3.5}m
              </p>
            </div>

            <div className="p-1 space-y-0.5">
              {onRotateColumn && (
                <button
                  onClick={() => { onRotateColumn(targetCol.id); onClose(); }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Rotar 90° Columna</span>
                  </div>
                  <kbd className="text-[10px] font-mono text-slate-400">R</kbd>
                </button>
              )}

              {onChangeColumnHeight && (
                <div className="flex items-center justify-between px-2.5 py-1.5 text-slate-600 bg-slate-50/50 rounded-lg">
                  <span className="text-[11px] font-medium">Ajustar Altura:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const curH = targetCol.altura || targetCol.alturaM || 3.5;
                        onChangeColumnHeight(targetCol.id, Math.max(1.5, curH - 0.5));
                        onClose();
                      }}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-[10px] font-bold"
                    >
                      -0.5m
                    </button>
                    <button
                      onClick={() => {
                        const curH = targetCol.altura || targetCol.alturaM || 3.5;
                        onChangeColumnHeight(targetCol.id, curH + 0.5);
                        onClose();
                      }}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-[10px] font-bold"
                    >
                      +0.5m
                    </button>
                  </div>
                </div>
              )}

              {(onDuplicateElement || onDuplicateItem) && (
                <button
                  onClick={() => handleDuplicate(targetCol.id, targetCol, 'column')}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Duplicar Columna</span>
                  </div>
                  <kbd className="text-[10px] font-mono text-slate-400">Ctrl+D</kbd>
                </button>
              )}
            </div>

            <div className="p-1">
              <button
                onClick={() => handleDelete(targetCol.id, 'column')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 text-left transition-colors font-bold"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Eliminar Columna</span>
                </div>
                <kbd className="text-[10px] font-mono text-red-400">Supr</kbd>
              </button>
            </div>
          </>
        )}

        {/* Caso 2: Viga / Tijeral */}
        {targetType === 'beam' && targetBeam && (
          <>
            <div className="px-3 py-2 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-indigo-600 rotate-45" />
                <span className="font-extrabold text-slate-900">{targetBeam.tag || `Viga ${targetBeam.id}`}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Tipo: {targetBeam.type || 'principal'} • Perfil: {targetBeam.profileId || 'IPE-160'}
              </p>
            </div>

            <div className="p-1">
              <button
                onClick={() => handleDelete(targetBeam.id, 'beam')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 text-left transition-colors font-bold"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Eliminar Viga</span>
                </div>
                <kbd className="text-[10px] font-mono text-red-400">Supr</kbd>
              </button>
            </div>
          </>
        )}

        {/* Caso 3: Correa / Purlin */}
        {targetType === 'purlin' && targetPurlin && (
          <>
            <div className="px-3 py-2 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-slate-900">{targetPurlin.tag || `Correa ${targetPurlin.id}`}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Perfil: {targetPurlin.profileId || 'Costanera C'}
              </p>
            </div>

            <div className="p-1">
              <button
                onClick={() => handleDelete(targetPurlin.id, 'purlin')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 text-left transition-colors font-bold"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Eliminar Correa</span>
                </div>
                <kbd className="text-[10px] font-mono text-red-400">Supr</kbd>
              </button>
            </div>
          </>
        )}

        {/* Caso 4: Lienzo Global */}
        {targetType === 'canvas' && (
          <>
            <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Acciones Estructurales
            </div>

            <div className="p-1 space-y-0.5">
              {onAddColumnAt && (
                <button
                  onClick={() => { onAddColumnAt(position.x, position.y); onClose(); }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Insertar Columna Aquí</span>
                  </div>
                  <kbd className="text-[10px] font-mono text-slate-400">C</kbd>
                </button>
              )}

              <button
                onClick={() => { onSelectTool('draw_polygon'); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dibujar Polígono Techo</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">L</kbd>
              </button>
            </div>

            <div className="p-1 space-y-0.5">
              <button
                onClick={() => { onToggleGrid(); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Grid className={`w-3.5 h-3.5 ${isGridActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Rejilla de Guía</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">G</kbd>
              </button>

              <button
                onClick={() => { onToggleSnap(); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Magnet className={`w-3.5 h-3.5 ${isSnapActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>SNAP Magnético</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">M</kbd>
              </button>

              <button
                onClick={() => { onCenterView(); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ajustar Vista (Fit)</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">0</kbd>
              </button>
            </div>

            <div className="p-1">
              <button
                onClick={() => { onOpenHelp(); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-left transition-colors font-bold"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Guía de Gestos y Atajos</span>
                </div>
                <kbd className="text-[10px] font-mono text-blue-500">?</kbd>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
