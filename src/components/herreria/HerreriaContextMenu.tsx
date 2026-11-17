import React from 'react';
import { 
  Trash2, 
  Copy, 
  RotateCw, 
  FlipHorizontal, 
  Maximize2, 
  Minus as LineIcon,
  Square,
  Circle,
  Lock,
  Grid,
  MoveRight,
  HelpCircle,
  Ruler,
  Scissors
} from 'lucide-react';
import { PiezaCad, AccesorioCad, TipoCorteCad } from './herreriaTypes';
import { PERFILES_CATALOGO, getNormaAcabadoPerfil } from './herreriaCatalog';

export interface ContextMenuPosition {
  x: number;
  y: number;
  targetId?: string | null;
  targetType?: 'pieza' | 'accesorio' | 'canvas';
}

interface HerreriaContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  pieza?: PiezaCad | null;
  accesorio?: AccesorioCad | null;
  onDuplicatePiece?: (piezaId: string) => void;
  onRotatePiece?: (piezaId: string) => void;
  onMirrorPiece?: (piezaId: string, axis: 'H' | 'V') => void;
  onDeletePiece?: (piezaId: string) => void;
  onDeleteAccesorio?: (accId: string) => void;
  onChangeCortes?: (piezaId: string, corteInicio: TipoCorteCad, corteFin: TipoCorteCad) => void;
  onChangePerfil?: (piezaId: string, perfilId: string) => void;
  onChangeLongitud?: (piezaId: string, newLengthM: number) => void;
  onAddPlatinaTope?: (piezaId: string) => void;
  onSelectTool?: (tool: any) => void;
  onCenterView?: () => void;
  onToggleGrid?: () => void;
  onToggleOrtho?: () => void;
  onOpenHelp?: () => void;
  isGridActive?: boolean;
  isOrthoActive?: boolean;
}

export const HerreriaContextMenu: React.FC<HerreriaContextMenuProps> = ({
  position,
  onClose,
  pieza,
  accesorio,
  onDuplicatePiece = () => {},
  onRotatePiece = () => {},
  onMirrorPiece = () => {},
  onDeletePiece = () => {},
  onDeleteAccesorio = () => {},
  onChangeCortes = () => {},
  onChangePerfil = () => {},
  onChangeLongitud = () => {},
  onAddPlatinaTope,
  onSelectTool = () => {},
  onCenterView = () => {},
  onToggleGrid = () => {},
  onToggleOrtho = () => {},
  onOpenHelp = () => {},
  isGridActive = true,
  isOrthoActive = false
}) => {
  if (!position) return null;

  // Ajustar posición para que no se salga de los bordes de pantalla
  const menuWidth = 240;
  const menuHeight = 320;
  const posX = Math.min(window.innerWidth - menuWidth - 10, Math.max(10, position.x));
  const posY = Math.min(window.innerHeight - menuHeight - 10, Math.max(10, position.y));

  const perfilActual = pieza ? PERFILES_CATALOGO.find(p => p.id === pieza.perfilId) : null;

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
        {/* Caso 1: Pieza CAD Seleccionada */}
        {pieza ? (
          <>
            <div className="px-3 py-2 bg-slate-50/80">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-700 uppercase">{pieza.marca}</span>
                <span className="font-mono text-[11px] text-slate-500 font-bold">{pieza.longitudM.toFixed(2)}m</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {perfilActual ? `${perfilActual.nombre} (${perfilActual.dimensiones})` : pieza.nombre}
              </p>
            </div>

            {/* Acciones principales de pieza */}
            <div className="p-1 space-y-0.5">
              <button
                onClick={() => {
                  const val = prompt('Ingresa nueva longitud en metros:', pieza.longitudM.toString());
                  if (val) {
                    const num = parseFloat(val);
                    if (!isNaN(num) && num > 0) onChangeLongitud(pieza.id, num);
                  }
                  onClose();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-left transition-colors"
              >
                <Ruler className="w-3.5 h-3.5 text-blue-600" />
                <span>Establecer Longitud Exacta</span>
              </button>

              <button
                onClick={() => { onDuplicatePiece(pieza.id); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Duplicar Pieza</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">Ctrl+D</kbd>
              </button>

              <button
                onClick={() => { onRotatePiece(pieza.id); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Rotar 90°</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">R</kbd>
              </button>

              <button
                onClick={() => { onMirrorPiece(pieza.id, 'V'); onClose(); }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <FlipHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Espejo Vertical</span>
              </button>

              {onAddPlatinaTope && (
                <button
                  onClick={() => { onAddPlatinaTope(pieza.id); onClose(); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-amber-900 font-bold transition-colors border border-amber-200/80 my-0.5"
                >
                  <Square className="w-3.5 h-3.5 text-amber-600" />
                  <span>🚪 Añadir Pestaña Batiente / Tope</span>
                </button>
              )}
            </div>

            {/* Cortes de Extremo Rápidos */}
            <div className="p-1 space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Scissors className="w-3 h-3" />
                <span>Cortes de Extremo</span>
              </div>
              <div className="grid grid-cols-2 gap-1 px-1">
                <button
                  onClick={() => { onChangeCortes(pieza.id, '90°', '90°'); onClose(); }}
                  className={`px-2 py-1 rounded text-[11px] font-bold text-center border ${
                    pieza.corteInicio === '90°' && pieza.corteFin === '90°'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  90° Recto
                </button>
                <button
                  onClick={() => { onChangeCortes(pieza.id, '45°', '45°'); onClose(); }}
                  className={`px-2 py-1 rounded text-[11px] font-bold text-center border ${
                    pieza.corteInicio === '45°' && pieza.corteFin === '45°'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  45° Inglete
                </button>
              </div>
            </div>

            {/* Cambiar Perfil Rápido */}
            <div className="p-2 space-y-1 bg-slate-50/50">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Cambiar Sección Tubular:</label>
              <select
                value={pieza.perfilId}
                onChange={(e) => {
                  onChangePerfil(pieza.id, e.target.value);
                  onClose();
                }}
                className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 font-medium"
              >
                <optgroup label="📦 PERFILES LAC (ASTM A500 Negro Estructural)">
                  {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'LAC').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.dimensiones})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🛡️ PERFILES GALVANIZADOS (ASTM A500 Galv)">
                  {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'GALVANIZADO').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.dimensiones})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="❄️ PERFILES LAF / LAB (Laminado en Frío / Cerrajería Ligera)">
                  {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'LAF').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.dimensiones})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="📐 PERFILES ESTRUCTURALES ASTM (A36 / Vigas / Ángulos / Platinas)">
                  {PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'ASTM').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.dimensiones})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Eliminar Pieza */}
            <div className="p-1">
              <button
                onClick={() => { onDeletePiece(pieza.id); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 text-left transition-colors font-bold"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Eliminar Pieza</span>
                </div>
                <kbd className="text-[10px] font-mono text-red-400">Supr</kbd>
              </button>
            </div>
          </>
        ) : accesorio ? (
          /* Caso 2: Accesorio Seleccionado */
          <>
            <div className="px-3 py-2 bg-slate-50/80">
              <span className="font-extrabold text-emerald-700 block">{accesorio.nombre}</span>
              <span className="text-[10px] text-slate-500">X: {accesorio.x.toFixed(2)}m, Y: {accesorio.y.toFixed(2)}m</span>
            </div>
            <div className="p-1">
              <button
                onClick={() => { onDeleteAccesorio(accesorio.id); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 text-left transition-colors font-bold"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Eliminar Accesorio</span>
                </div>
                <kbd className="text-[10px] font-mono text-red-400">Supr</kbd>
              </button>
            </div>
          </>
        ) : (
          /* Caso 3: Lienzo CAD Libre */
          <>
            <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Acciones Rápidas CAD
            </div>

            <div className="p-1 space-y-0.5">
              <button
                onClick={() => { onSelectTool('linea'); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LineIcon className="w-3.5 h-3.5 rotate-45 text-blue-600" />
                  <span>Dibujar Línea / Perfil</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">L</kbd>
              </button>

              <button
                onClick={() => { onSelectTool('rectangulo'); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Square className="w-3.5 h-3.5 text-blue-600" />
                  <span>Marco Rectangular</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">R</kbd>
              </button>

              <button
                onClick={() => { onSelectTool('arco'); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Circle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Arco Curvo Rolado</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">A</kbd>
              </button>

              <button
                onClick={() => { onSelectTool('accesorio'); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Añadir Accesorio</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">K</kbd>
              </button>
            </div>

            <div className="p-1 space-y-0.5">
              <button
                onClick={() => { onToggleGrid(); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Grid className={`w-3.5 h-3.5 ${isGridActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Rejilla SNAP {isGridActive ? '(Activa)' : '(Inactiva)'}</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">G</kbd>
              </button>

              <button
                onClick={() => { onToggleOrtho(); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MoveRight className={`w-3.5 h-3.5 ${isOrthoActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>Modo Ortogonal {isOrthoActive ? '(Activo)' : '(Inactivo)'}</span>
                </div>
                <kbd className="text-[10px] font-mono text-slate-400">O</kbd>
              </button>

              <button
                onClick={() => { onCenterView(); onClose(); }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-left transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Centrar Vista</span>
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
