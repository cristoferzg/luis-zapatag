import React, { useState, useEffect, useRef } from 'react';
import { 
  StructuralGeometry, 
  StructureOptions, 
  CoberturaOptions, 
  ConexionesOptions,
  ColumnElement, 
  BeamElement, 
  PurlinElement,
  DireccionCaida,
  TipoTijeral,
  PatronTijeral
} from './structuralTypes';
import { calculateRoofGeometry } from './structuralGenerator';
import { 
  StructuralPropertiesPanel, 
  PropertyItemType 
} from './StructuralPropertiesPanel';
import { 
  SlidersHorizontal, 
  Layers, 
  Hammer, 
  Settings2, 
  X, 
  Minus, 
  Maximize2, 
  Move, 
  ChevronDown,
  Droplets,
  Building2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Search,
  Sparkles,
  Compass
} from 'lucide-react';

export type FloatingTab = 'propiedades' | 'geometria' | 'sectores' | 'elementos' | 'asistente';

interface FloatingPanelsProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage?: string;
  activeTab: FloatingTab;
  onTabChange: (tab: FloatingTab) => void;
  geometria: StructuralGeometry;
  onUpdateGeometria: (geo: StructuralGeometry) => void;
  estructura: StructureOptions;
  onUpdateEstructura: (est: StructureOptions) => void;
  cobertura: CoberturaOptions;
  onUpdateCobertura: (cob: CoberturaOptions) => void;
  conexiones: ConexionesOptions;
  onUpdateConexiones: (con: ConexionesOptions) => void;
  columnas: ColumnElement[];
  vigas: BeamElement[];
  correas: PurlinElement[];
  selectedItem: {
    type: PropertyItemType | string;
    item: any;
  } | null;
  onSelectItem: (item: any) => void;
  onUpdateItem: (updatedItem: any, type: string) => void;
  onDeleteItem: (id: string, type: string) => void;
  onApplyToAll?: (updatedItem: any, type: string) => void;
  onDuplicateItem?: (item: any, type: string) => void;
  onAddSector?: () => void;
  onOpenTranslucentModal?: () => void;
  onGenerarEstructura?: () => void;
  onOpenCollapseSimulator?: () => void;
  isDocked?: boolean;
}

export const StructuralFloatingPanels: React.FC<FloatingPanelsProps> = ({
  isOpen,
  onClose,
  currentStage,
  activeTab,
  onTabChange,
  geometria,
  onUpdateGeometria,
  estructura: _estructura,
  onUpdateEstructura: _onUpdateEstructura,
  cobertura: _cobertura,
  onUpdateCobertura: _onUpdateCobertura,
  conexiones: _conexiones,
  onUpdateConexiones: _onUpdateConexiones,
  columnas,
  vigas,
  correas,
  selectedItem,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onApplyToAll,
  onDuplicateItem,
  onAddSector,
  onOpenTranslucentModal,
  onGenerarEstructura,
  onOpenCollapseSimulator,
  isDocked = false
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [elementFilter, setElementFilter] = useState<'all' | 'column' | 'beam' | 'purlin'>('all');

  // Floating draggable state (desktop)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; posX: number; posY: number }>({
    clientX: 0,
    clientY: 0,
    posX: 0,
    posY: 0
  });

  const calc = calculateRoofGeometry(geometria);

  // Tab visibility based on active workflow stage
  const isTabVisible = (tab: FloatingTab) => {
    if (tab === 'asistente') return true;
    if (!currentStage) return true;
    switch (currentStage) {
      case 'crear_techo':
      case 'geometria':
        // Only allow 'geometria' and 'sectores'
        return tab === 'geometria' || tab === 'sectores' || (tab === 'propiedades' && !!selectedItem);
      case 'estructura':
        // Allow 'propiedades', 'elementos', and 'sectores'
        return tab === 'propiedades' || tab === 'elementos' || tab === 'sectores';
      case 'cobertura':
        // Allow 'propiedades' and 'geometria' (contains material details)
        return tab === 'propiedades' || tab === 'geometria';
      default:
        return true;
    }
  };

  // Sync activeTab with visible tabs when currentStage changes
  useEffect(() => {
    if (!isTabVisible(activeTab)) {
      const allTabs: FloatingTab[] = ['propiedades', 'geometria', 'sectores', 'elementos'];
      const firstVisible = allTabs.find(t => isTabVisible(t));
      if (firstVisible) {
        onTabChange(firstVisible);
      }
    }
  }, [currentStage, selectedItem]);

  // Auto switch to 'propiedades' when an item is selected if user was on 'elementos'
  useEffect(() => {
    if (selectedItem && activeTab === 'elementos') {
      onTabChange('propiedades');
    }
  }, [selectedItem]);

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    if (e.touches.length > 0) {
      setIsDragging(true);
      dragStartRef.current = {
        clientX: e.touches[0].clientX,
        clientY: e.touches[0].clientY,
        posX: position.x,
        posY: position.y
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      const newX = Math.max(0, Math.min(window.innerWidth - 380, dragStartRef.current.posX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 150, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - dragStartRef.current.clientX;
      const dy = e.touches[0].clientY - dragStartRef.current.clientY;
      const newX = Math.max(0, Math.min(window.innerWidth - 320, dragStartRef.current.posX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 150, dragStartRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  // Filtered elements list
  const filteredColumns = columnas.filter(c => 
    (elementFilter === 'all' || elementFilter === 'column') &&
    (c.tag.toLowerCase().includes(searchTerm.toLowerCase()) || c.profileId.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredBeams = vigas.filter(b => 
    (elementFilter === 'all' || elementFilter === 'beam') &&
    (b.tag.toLowerCase().includes(searchTerm.toLowerCase()) || b.profileId.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const filteredPurlins = correas.filter(p => 
    (elementFilter === 'all' || elementFilter === 'purlin') &&
    (p.tag.toLowerCase().includes(searchTerm.toLowerCase()) || p.profileId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      {/* DESKTOP / TABLET FLOATING WINDOW / DOCKED SIDEBAR */}
      <div 
        className={isDocked 
          ? "hidden md:flex flex-col w-full h-full bg-white overflow-hidden"
          : `hidden md:flex flex-col absolute z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 transition-all duration-150 overflow-hidden ${
              isMaximized 
                ? 'top-4 left-4 right-4 bottom-4 w-auto h-auto' 
                : isMinimized 
                  ? 'w-80 h-12 shadow-lg' 
                  : 'w-96 max-h-[82vh]'
            }`
        }
        style={(!isMaximized && !isDocked) ? { top: `${position.y}px`, left: `${position.x}px` } : undefined}
      >
        {/* DRAGGABLE HEADER / DOCKED TITLE */}
        <div 
          onMouseDown={isDocked ? undefined : handleMouseDown}
          onTouchStart={isDocked ? undefined : handleTouchStart}
          className={`bg-slate-900 text-white px-3 py-2 flex items-center justify-between select-none shrink-0 ${isDocked ? '' : 'cursor-move'}`}
        >
          <div className="flex items-center space-x-2">
            {!isDocked && <Move className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              {activeTab === 'propiedades' ? (selectedItem ? `Propiedades: ${selectedItem.item.tag || selectedItem.item.nombre || selectedItem.type}` : 'Propiedades') :
               activeTab === 'geometria' ? 'Geometría y Caída' :
               activeTab === 'sectores' ? 'Sectores de Techo' : 'Lista de Elementos'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {!isDocked && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  title={isMinimized ? 'Expandir' : 'Minimizar'}
                >
                  {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMaximized(!isMaximized);
                    setIsMinimized(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  title={isMaximized ? 'Restaurar tamaño' : 'Maximizar'}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Ocultar Panel (Área CAD completa)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TABS BAR */}
        {(!isMinimized || isDocked) && (
          <div className="flex items-center bg-slate-100 p-1 border-b border-slate-200 shrink-0 text-[11px] font-bold">
            {isTabVisible('propiedades') && (
              <button
                type="button"
                onClick={() => onTabChange('propiedades')}
                className={`flex-1 py-1 px-1.5 rounded-lg flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                  activeTab === 'propiedades' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings2 className="w-3 h-3 text-blue-600" />
                <span>Propiedades</span>
                {selectedItem && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-0.5"></span>}
              </button>
            )}

            {isTabVisible('geometria') && (
              <button
                type="button"
                onClick={() => onTabChange('geometria')}
                className={`flex-1 py-1 px-1.5 rounded-lg flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                  activeTab === 'geometria' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Droplets className="w-3 h-3 text-sky-600" />
                <span>Geometría</span>
              </button>
            )}

            {isTabVisible('sectores') && (
              <button
                type="button"
                onClick={() => onTabChange('sectores')}
                className={`flex-1 py-1 px-1.5 rounded-lg flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                  activeTab === 'sectores' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3 text-emerald-600" />
                <span>Sectores ({(geometria.sectores || []).length})</span>
              </button>
            )}

            {isTabVisible('elementos') && (
              <button
                type="button"
                onClick={() => onTabChange('elementos')}
                className={`flex-1 py-1 px-1.5 rounded-lg flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                  activeTab === 'elementos' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hammer className="w-3 h-3 text-indigo-600" />
                <span>Lista ({columnas.length + vigas.length + correas.length})</span>
              </button>
            )}
          </div>
        )}

        {/* BODY CONTENT SCROLLABLE */}
        {(!isMinimized || isDocked) && (
          <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
            {/* TAB 1: PROPIEDADES DE ELEMENTO SELECCIONADO */}
            {activeTab === 'propiedades' && (
              <div>
                {selectedItem ? (
                  <StructuralPropertiesPanel
                    selectedItem={selectedItem}
                    onUpdateItem={onUpdateItem}
                    onDeleteItem={onDeleteItem}
                    onClose={() => onSelectItem(null)}
                    onApplyToAll={onApplyToAll}
                    onDuplicateItem={onDuplicateItem}
                    onOpenCollapseSimulator={onOpenCollapseSimulator}
                  />
                ) : (
                  <div className="py-8 text-center space-y-2 text-slate-500">
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Settings2 className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-slate-700">Ningún elemento seleccionado</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Haz clic en cualquier columna, viga, correa o sector en el plano CAD o selecciónalo desde la pestaña <strong>Lista</strong> para editar sus propiedades.
                    </p>
                    <button
                      type="button"
                      onClick={() => onTabChange('elementos')}
                      className="mt-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Ver Lista de Elementos
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GEOMETRÍA Y CAÍDA DE AGUA */}
            {activeTab === 'geometria' && (
              <div className="space-y-3 text-slate-700">
                {/* 1. Dimensiones Principales */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                    Dimensiones de Estructura
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Largo (m):</label>
                      <input
                        type="number"
                        step="0.5"
                        min="2"
                        value={geometria.largo}
                        onChange={e => onUpdateGeometria({ ...geometria, largo: parseFloat(e.target.value) || 2 })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Ancho (m):</label>
                      <input
                        type="number"
                        step="0.5"
                        min="2"
                        value={geometria.ancho}
                        onChange={e => onUpdateGeometria({ ...geometria, ancho: parseFloat(e.target.value) || 2 })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Lado Alto (m):</label>
                      <input
                        type="number"
                        step="0.05"
                        min="1"
                        value={geometria.alturaLadoAlto || 3.5}
                        onChange={e => onUpdateGeometria({ ...geometria, alturaLadoAlto: parseFloat(e.target.value) || 3.5 })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Lado Bajo (m):</label>
                      <input
                        type="number"
                        step="0.05"
                        min="1"
                        value={geometria.alturaLadoBajo || 3.0}
                        onChange={e => onUpdateGeometria({ ...geometria, alturaLadoBajo: parseFloat(e.target.value) || 3.0 })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-blue-50 p-2 rounded-lg text-blue-900 font-semibold">
                    <span>Pendiente Calculada:</span>
                    <strong className="font-mono text-xs text-blue-700">{calc.pendientePct}% ({calc.pendienteGrados}°)</strong>
                  </div>
                </div>

                {/* 2. Dirección de Caída de Agua */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center">
                      <Droplets className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                      Dirección de Caída
                    </span>
                    <span className="text-[10px] text-sky-700 font-bold uppercase">{geometria.direccionCaida || 'calle'}</span>
                  </h4>
                  <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, direccionCaida: 'fondo' })}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        geometria.direccionCaida === 'fondo' || geometria.direccionCaida === 'interior' ? 'bg-sky-600 text-white border-sky-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowUp className="w-4 h-4 mb-0.5" />
                      <span>Fondo ↑</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, direccionCaida: 'calle' })}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        geometria.direccionCaida === 'calle' || !geometria.direccionCaida ? 'bg-sky-600 text-white border-sky-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowDown className="w-4 h-4 mb-0.5" />
                      <span>Calle ↓</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, direccionCaida: 'izquierda' })}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        geometria.direccionCaida === 'izquierda' ? 'bg-sky-600 text-white border-sky-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4 mb-0.5" />
                      <span>Izq. ←</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, direccionCaida: 'derecha' })}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        geometria.direccionCaida === 'derecha' ? 'bg-sky-600 text-white border-sky-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4 mb-0.5" />
                      <span>Der. →</span>
                    </button>
                  </div>
                </div>

                {/* 3. Cobertura: Aluzinc vs Termoacústico */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider flex items-center">
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                    Material de Cobertura
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 font-bold text-xs">
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, sistemaCobertura: 'aluzinc' })}
                      className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        geometria.sistemaCobertura === 'aluzinc' || !geometria.sistemaCobertura ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Aluzinc TR4
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, sistemaCobertura: 'panel_termoacustico' })}
                      className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        geometria.sistemaCobertura === 'panel_termoacustico' || geometria.sistemaCobertura === 'termoacustico' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Panel Sandwich
                    </button>
                  </div>

                  {geometria.sistemaCobertura === 'panel_termoacustico' ? (
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Núcleo Aislante:</label>
                        <select
                          value={geometria.panelTermoacustico?.aislamiento || 'EPS'}
                          onChange={e => onUpdateGeometria({
                            ...geometria,
                            panelTermoacustico: { ...(geometria.panelTermoacustico || {}), aislamiento: e.target.value }
                          })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                        >
                          <option value="EPS">Poliestireno Expandido (EPS)</option>
                          <option value="PUR">Poliuretano Inyectado (PUR)</option>
                          <option value="PIR">Poliisocianurato Ignífugo (PIR)</option>
                          <option value="Lana de Roca">Lana de Roca Mineral (Acústico)</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500">Espesor Núcleo:</label>
                        <select
                          value={geometria.panelTermoacustico?.espesorAislamientoMm || 50}
                          onChange={e => onUpdateGeometria({
                            ...geometria,
                            panelTermoacustico: { ...(geometria.panelTermoacustico || {}), espesorAislamientoMm: parseInt(e.target.value) || 50 }
                          })}
                          className="p-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                        >
                          <option value={30}>30 mm</option>
                          <option value={40}>40 mm</option>
                          <option value={50}>50 mm</option>
                          <option value={60}>60 mm</option>
                          <option value={80}>80 mm</option>
                          <option value={100}>100 mm</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Calibre:</label>
                        <select
                          value={geometria.aluzinc?.calibre || '0.40 mm'}
                          onChange={e => onUpdateGeometria({
                            ...geometria,
                            aluzinc: { ...(geometria.aluzinc || {}), calibre: e.target.value }
                          })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                        >
                          <option value="0.30 mm">0.30 mm</option>
                          <option value="0.35 mm">0.35 mm</option>
                          <option value="0.40 mm">0.40 mm (Estándar)</option>
                          <option value="0.45 mm">0.45 mm</option>
                          <option value="0.50 mm">0.50 mm</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">Perfil:</label>
                        <select
                          value={geometria.aluzinc?.perfil || 'TR4'}
                          onChange={e => onUpdateGeometria({
                            ...geometria,
                            aluzinc: { ...(geometria.aluzinc || {}), perfil: e.target.value }
                          })}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                        >
                          <option value="TR4">Trapezoidal TR4 (Estándar)</option>
                          <option value="TR4 Translúcido">TR4 Translúcido (Transparente)</option>
                          <option value="TR5">Trapezoidal TR5 (Alta Resistencia)</option>
                          <option value="Ondulado">Ondulado (Calamina)</option>
                          <option value="Estructural">Estructural TR6</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={geometria.esTranslucido || geometria.aluzinc?.perfil?.toLowerCase().includes('translúcido')}
                        onChange={e => onUpdateGeometria({
                          ...geometria,
                          esTranslucido: e.target.checked,
                          aluzinc: { ...(geometria.aluzinc || {}), perfil: e.target.checked ? 'TR4 Translúcido' : 'TR4' }
                        })}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Cobertura Translúcida / Transparente</span>
                    </label>
                  </div>
                </div>

                {/* 4. Configuración de Tijerales Global */}
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 space-y-2">
                  <h4 className="font-bold text-[11px] text-amber-800 uppercase tracking-wider flex items-center">
                    <Compass className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                    Arquetipo de Tijeral (Forma)
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'dos_aguas', label: 'A Dos Aguas' },
                      { id: 'una_agua', label: 'Una Agua' },
                      { id: 'parabolico', label: 'Parabólico' },
                      { id: 'plano', label: 'Plano' },
                      { id: 'asimetrico', label: 'Asimétrico' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => _onUpdateEstructura({ ..._estructura, tipoTijeral: t.id as TipoTijeral })}
                        className={`py-1.5 px-1 rounded-lg border text-[10px] font-bold text-center transition-all ${
                          _estructura.tipoTijeral === t.id ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-amber-800 block mb-0.5">Patrón Celosía:</label>
                      <select
                        value={_estructura.patronTijeral || 'warren'}
                        onChange={e => _onUpdateEstructura({ ..._estructura, patronTijeral: e.target.value as PatronTijeral })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-[11px]"
                      >
                        <option value="warren">Warren</option>
                        <option value="pratt">Pratt</option>
                        <option value="howe">Howe</option>
                        <option value="fink">Fink</option>
                        <option value="king_post">King Post</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-800 block mb-0.5">Peralte (m):</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.3"
                        value={geometria.peralteTijeral || 0.8}
                        onChange={e => onUpdateGeometria({ ...geometria, peralteTijeral: parseFloat(e.target.value) || 0.8 })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-center text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Colocación de Correas en Altura (Sobre cuerda superior vs bajo cuerda inferior) */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center">
                      <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      Nivel de Correas (Z)
                    </span>
                    <span className="text-[10px] text-blue-700 font-bold uppercase">
                      {geometria.posicionCorreas === 'bajo_cuerda_inferior' ? 'Inferior' : geometria.posicionCorreas === 'ambas' ? 'Ambas' : 'Superior (Aluzinc)'}
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, posicionCorreas: 'sobre_cuerda_superior' })}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        geometria.posicionCorreas === 'sobre_cuerda_superior' || !geometria.posicionCorreas ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Las correas se ubican sobre la cuerda superior soportando el aluzinc (líneas rojas)"
                    >
                      ▲ Sobre Cuerda Sup. (Aluzinc)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, posicionCorreas: 'bajo_cuerda_inferior' })}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        geometria.posicionCorreas === 'bajo_cuerda_inferior' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Las correas se ubican bajo la cuerda inferior para sostener cielo raso"
                    >
                      ▼ Bajo Cuerda Inf. (Cielo Raso)
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, posicionCorreas: 'ambas' })}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        geometria.posicionCorreas === 'ambas' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Correas tanto arriba como abajo del tijeral"
                    >
                      ↕ Ambas Alturas
                    </button>
                  </div>
                </div>

                {/* 5. Canaleta Pluvial / Evacuación Toggle */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[11px] text-slate-800 uppercase tracking-wider flex items-center">
                      <Droplets className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                      Canaleta Pluvial
                    </h4>
                    <button
                      type="button"
                      onClick={() => onUpdateGeometria({
                        ...geometria,
                        evacuacion: {
                          ...(geometria.evacuacion || { anchoCanaletaMm: 150, diametroBajantePulg: 3, tipo: 'canaleta_exterior', pendienteMinimaPct: 1 }),
                          tieneCanaleta: geometria.evacuacion?.tieneCanaleta === false ? true : false
                        }
                      })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                        geometria.evacuacion?.tieneCanaleta !== false
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-sky-600 text-white hover:bg-sky-500 border border-sky-600'
                      }`}
                      title="Quitar o activar la canaleta pluvial si estorba al diseñar"
                    >
                      {geometria.evacuacion?.tieneCanaleta !== false ? (
                        <>
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Eliminar Canaleta</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 text-white" />
                          <span>Activar Canaleta</span>
                        </>
                      )}
                    </button>
                  </div>
                  {geometria.evacuacion?.tieneCanaleta === false && (
                    <p className="text-[10px] text-slate-500 italic bg-amber-50/70 p-1.5 rounded-lg border border-amber-200">
                      🚫 Canaleta oculta / desactivada para mayor visibilidad al diseñar.
                    </p>
                  )}
                </div>

                {/* Botón Generar 3D */}
                {onGenerarEstructura && (
                  <button
                    type="button"
                    onClick={onGenerarEstructura}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Regenerar Estructura 3D</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB 3: SECTORES */}
            {activeTab === 'sectores' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 uppercase">Sectores Definidos</span>
                  <div className="flex items-center space-x-1.5">
                    {onOpenTranslucentModal && (
                      <button
                        type="button"
                        onClick={onOpenTranslucentModal}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Añadir sector de policarbonato translúcido"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>+ Translúcido</span>
                      </button>
                    )}
                    {onAddSector && (
                      <button
                        type="button"
                        onClick={onAddSector}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nuevo Sector</span>
                      </button>
                    )}
                  </div>
                </div>

                {(!geometria.sectores || geometria.sectores.length === 0) ? (
                  <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-xs text-slate-700">Techo Único / Sin multi-sectores</p>
                    <p className="text-[11px] text-slate-400 mt-1">El techo opera con parámetros globales de geometría.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {geometria.sectores.map(sec => {
                      const isSelected = selectedItem?.type === 'sector' && selectedItem.item.id === sec.id;
                      return (
                        <div
                          key={`sec-card-${sec.id}`}
                          onClick={() => onSelectItem({ type: 'sector', item: sec })}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sec.color || '#2563eb' }}></span>
                              <strong className="text-xs text-slate-800">{sec.nombre}</strong>
                              {sec.esTranslucido && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>Translúcido</span>
                                </span>
                              )}
                              {sec.acopladoAlTecho !== false && (
                                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Acoplado al plano del techo">
                                  🔗 Acoplado
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {sec.pendientePct}% Caída {sec.direccionCaida}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 mb-2">
                            <div>Alto: <strong>{sec.alturaLadoAlto}m</strong></div>
                            <div>Bajo: <strong>{sec.alturaLadoBajo}m</strong></div>
                          </div>

                          <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectItem({ type: 'sector', item: sec });
                                onTabChange('propiedades');
                              }}
                              className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] hover:bg-blue-200"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(sec.id, 'sector');
                              }}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50"
                              title="Eliminar sector"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: LISTA DE ELEMENTOS ESTRUCTURALES */}
            {activeTab === 'elementos' && (
              <div className="space-y-2">
                {/* Search & Filter */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por tag o perfil (ej. C-01, Tubo)..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setElementFilter('all')}
                      className={`px-2 py-1 rounded-md ${elementFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementFilter('column')}
                      className={`px-2 py-1 rounded-md ${elementFilter === 'column' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Columnas ({columnas.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementFilter('beam')}
                      className={`px-2 py-1 rounded-md ${elementFilter === 'beam' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Vigas ({vigas.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementFilter('purlin')}
                      className={`px-2 py-1 rounded-md ${elementFilter === 'purlin' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Correas ({correas.length})
                    </button>
                  </div>
                </div>

                {/* List Items */}
                <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                  {filteredColumns.map(c => {
                    const isSelected = selectedItem?.type === 'column' && selectedItem.item.id === c.id;
                    return (
                      <div
                        key={`elem-list-c-${c.id}`}
                        onClick={() => onSelectItem({ type: 'column', item: c })}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? 'bg-indigo-50 border-indigo-500 font-bold ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                          <span className="font-bold">{c.tag}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({c.profileId})</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-600">h: {c.altura}m</span>
                      </div>
                    );
                  })}

                  {filteredBeams.map(b => {
                    const isSelected = selectedItem?.type === 'beam' && selectedItem.item.id === b.id;
                    const label = b.type === 'tijeral_cuerda' ? 'Tijeral' : b.type === 'arriostre' ? 'Arriostre' : 'Viga';
                    return (
                      <div
                        key={`elem-list-b-${b.id}`}
                        onClick={() => onSelectItem({ type: 'beam', item: b })}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? 'bg-blue-50 border-blue-500 font-bold ring-2 ring-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                          <span className="font-bold">{b.tag}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({label})</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-600">{b.profileId}</span>
                      </div>
                    );
                  })}

                  {filteredPurlins.map(p => {
                    const isSelected = selectedItem?.type === 'purlin' && selectedItem.item.id === p.id;
                    return (
                      <div
                        key={`elem-list-p-${p.id}`}
                        onClick={() => onSelectItem({ type: 'purlin', item: p })}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? 'bg-emerald-50 border-emerald-500 font-bold ring-2 ring-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          <span className="font-bold">{p.tag}</span>
                          <span className="text-[10px] text-slate-500 font-normal">(Correa)</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-600">{p.profileId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM SHEET (< 768px) */}
      <div className="md:hidden absolute inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Drag Handle Bar */}
        <div 
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-full py-2.5 flex flex-col items-center justify-center cursor-pointer select-none bg-slate-50 rounded-t-3xl border-b border-slate-200"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-1"></div>
          <div className="flex items-center justify-between w-full px-4 text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {activeTab === 'propiedades' ? (selectedItem ? `Propiedades: ${selectedItem.item.tag || selectedItem.item.nombre || selectedItem.type}` : 'Propiedades') :
                 activeTab === 'geometria' ? 'Geometría' :
                 activeTab === 'sectores' ? 'Sectores' : 'Lista'}
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex items-center bg-slate-100 p-1 border-b border-slate-200 text-[11px] font-bold shrink-0">
          {isTabVisible('propiedades') && (
            <button
              type="button"
              onClick={() => onTabChange('propiedades')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 ${
                activeTab === 'propiedades' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <span>Propiedades</span>
            </button>
          )}
          {isTabVisible('geometria') && (
            <button
              type="button"
              onClick={() => onTabChange('geometria')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 ${
                activeTab === 'geometria' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <span>Geometría</span>
            </button>
          )}
          {isTabVisible('sectores') && (
            <button
              type="button"
              onClick={() => onTabChange('sectores')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 ${
                activeTab === 'sectores' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <span>Sectores</span>
            </button>
          )}
          {isTabVisible('elementos') && (
            <button
              type="button"
              onClick={() => onTabChange('elementos')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center space-x-1 ${
                activeTab === 'elementos' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <span>Lista</span>
            </button>
          )}
        </div>

        {/* Mobile Body Content */}
        <div className="flex-1 overflow-y-auto p-4 text-xs space-y-3 pb-8">
          {activeTab === 'propiedades' && (
            selectedItem ? (
              <StructuralPropertiesPanel
                selectedItem={selectedItem}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onClose={() => onSelectItem(null)}
                isMobileSheet={true}
                onApplyToAll={onApplyToAll}
                onDuplicateItem={onDuplicateItem}
              />
            ) : (
              <div className="py-6 text-center text-slate-500">
                <p className="font-bold text-slate-700">Toca cualquier elemento en el CAD</p>
                <p className="text-[11px] text-slate-400 mt-1">O selecciona una columna o viga de la pestaña Lista.</p>
              </div>
            )
          )}

          {activeTab === 'geometria' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-500 block text-[10px]">Largo (m):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={geometria.largo}
                    onChange={e => onUpdateGeometria({ ...geometria, largo: parseFloat(e.target.value) || 2 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-center"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block text-[10px]">Ancho (m):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={geometria.ancho}
                    onChange={e => onUpdateGeometria({ ...geometria, ancho: parseFloat(e.target.value) || 2 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block text-[10px] mb-1">Dirección de Caída:</label>
                <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                  {(['fondo', 'calle', 'izquierda', 'derecha'] as DireccionCaida[]).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onUpdateGeometria({ ...geometria, direccionCaida: d })}
                      className={`py-2 rounded-lg border text-center ${
                        geometria.direccionCaida === d ? 'bg-sky-600 text-white font-bold' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {d === 'fondo' ? '↑ Fondo' : d === 'calle' ? '↓ Calle' : d === 'izquierda' ? '← Izq' : '→ Der'}
                    </button>
                  ))}
                </div>
              </div>

              {onGenerarEstructura && (
                <button
                  type="button"
                  onClick={onGenerarEstructura}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Regenerar Estructura</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'sectores' && (
            <div className="space-y-2">
              {(geometria.sectores || []).map(sec => (
                <div 
                  key={`mob-sec-${sec.id}`}
                  onClick={() => {
                    onSelectItem({ type: 'sector', item: sec });
                    onTabChange('propiedades');
                  }}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <span className="font-bold text-slate-800">{sec.nombre}</span>
                  <span className="text-[10px] font-mono text-blue-600 font-bold">{sec.pendientePct}% Caída</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'elementos' && (
            <div className="space-y-1.5">
              {columnas.map(c => (
                <div 
                  key={`mob-col-${c.id}`}
                  onClick={() => {
                    onSelectItem({ type: 'column', item: c });
                    onTabChange('propiedades');
                  }}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <span className="font-bold text-indigo-700">{c.tag} (Columna)</span>
                  <span className="text-[10px] font-mono text-slate-500">h: {c.altura}m</span>
                </div>
              ))}
              {vigas.map(b => (
                <div 
                  key={`mob-viga-${b.id}`}
                  onClick={() => {
                    onSelectItem({ type: 'beam', item: b });
                    onTabChange('propiedades');
                  }}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <span className="font-bold text-blue-700">{b.tag} (Viga)</span>
                  <span className="text-[10px] font-mono text-slate-500">{b.profileId}</span>
                </div>
              ))}
              {correas.map(p => (
                <div 
                  key={`mob-cor-${p.id}`}
                  onClick={() => {
                    onSelectItem({ type: 'purlin', item: p });
                    onTabChange('propiedades');
                  }}
                  className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <span className="font-bold text-emerald-700">{p.tag} (Correa)</span>
                  <span className="text-[10px] font-mono text-slate-500">{p.profileId}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
