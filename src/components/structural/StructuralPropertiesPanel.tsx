import React, { useState, useEffect, useRef } from 'react';
import { 
  ColumnElement, 
  PurlinElement, 
  SteelMaterial, 
  ProfileDefinition, 
  RoofSector, 
  TipoTijeral, 
  PatronTijeral, 
  DireccionCaida 
} from './structuralTypes';
import { STEEL_PROFILES, getProfileById, ALUZINC_CATALOG, TERMOACUSTICO_CATALOG, CANALETA_OPTIONS, BAJANTE_OPTIONS } from './structuralCatalog';
import { 
  Check, 
  Trash2, 
  X, 
  Move, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  Lock, 
  Unlock, 
  Copy, 
  Droplets, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Compass, 
  ShieldAlert, 
  SlidersHorizontal 
} from 'lucide-react';

export type PropertyItemType = 'column' | 'beam' | 'purlin' | 'truss' | 'brace' | 'sector' | 'edge' | 'void' | 'gutter' | 'downspout';

interface PropertiesPanelProps {
  selectedItem: {
    type: PropertyItemType | string;
    item: any;
  } | null;
  onUpdateItem: (updatedItem: any, type: string) => void;
  onDeleteItem: (id: string, type: string) => void;
  onClose: () => void;
  isMobileSheet?: boolean;
  onApplyToAll?: (updatedItem: any, type: string) => void;
  onDuplicateItem?: (item: any, type: string) => void;
  onOpenCollapseSimulator?: () => void;
}

export const StructuralPropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedItem,
  onUpdateItem,
  onDeleteItem,
  onClose,
  isMobileSheet = false,
  onApplyToAll,
  onDuplicateItem,
  onOpenCollapseSimulator
}) => {
  if (!selectedItem) return null;

  const { type, item } = selectedItem;

  // Local editing states
  const [profileId, setProfileId] = useState<string>(item.profileId || 'tub-cuad-100x100x3');
  const [material, setMaterial] = useState<SteelMaterial>(item.material || 'A500 Gr. B');
  const [altura, setAltura] = useState<number>(type === 'column' ? (item as ColumnElement).altura : 3.0);
  const [customLength, setCustomLength] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLocked, setIsLocked] = useState<boolean>(item.isLocked || false);
  const [appliedMsg, setAppliedMsg] = useState(false);
  const [appliedAllMsg, setAppliedAllMsg] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Direction state for purlins & beams
  const [direccionElemento, setDireccionElemento] = useState<'horizontal' | 'vertical' | 'diagonal'>(
    item.direccion || 'horizontal'
  );

  // Truss-specific states
  const [tipoTijeral, setTipoTijeral] = useState<TipoTijeral>(item.tipoTijeral || 'dos_aguas');
  const [patronTijeral, setPatronTijeral] = useState<PatronTijeral>(item.patronTijeral || 'warren');
  const [trussHeight, setTrussHeight] = useState<number>(item.trussHeight || 0.80);
  const [trussSpan, setTrussSpan] = useState<number>(item.trussSpan || 8.00);
  const [trussSlope, setTrussSlope] = useState<number>(item.trussSlope || 15.0);

  // Column Base plate & bolts
  const [hasBasePlate, setHasBasePlate] = useState<boolean>(item.basePlate ?? true);
  const [anchorBoltsCount, setAnchorBoltsCount] = useState<number>(item.anchorBoltsCount || 4);

  // Sector & Coverage states
  const [sectorName, setSectorName] = useState<string>(item.nombre || 'Sector');
  const [sectorSlope, setSectorSlope] = useState<number>(item.pendientePct ?? 5.0);
  const [sectorDireccion, setSectorDireccion] = useState<DireccionCaida>(item.direccionCaida || 'calle');
  const [sectorCoverageType, setSectorCoverageType] = useState<'aluzinc' | 'panel_termoacustico' | 'policarbonato'>('aluzinc');
  
  // Aluzinc specific
  const [aluzincCalibre, setAluzincCalibre] = useState<string>(item.aluzincCalibre || '0.40 mm');
  const [aluzincPerfil, setAluzincPerfil] = useState<string>(item.aluzincPerfil || 'TR4');

  // Termoacústico specific
  const [termoEspesor, setTermoEspesor] = useState<number>(item.termoEspesor || 50);
  const [termoNucleo, setTermoNucleo] = useState<'EPS' | 'PUR' | 'PIR' | 'Lana de Roca'>(item.termoNucleo || 'EPS');

  // Gutters & Downspouts
  const [hasGutter, setHasGutter] = useState<boolean>(item.hasGutter ?? true);
  const [gutterProfile, setGutterProfile] = useState<string>(item.gutterProfile || 'can-aluzinc-150');
  const [downspoutDiam, setDownspoutDiam] = useState<string>(item.downspoutDiam || '4"');
  const [downspoutMaterial, setDownspoutMaterial] = useState<string>(item.downspoutMaterial || 'PVC Pluvial (Estándar)');
  const [downspoutHeight, setDownspoutHeight] = useState<number>(item.downspoutHeight || 3.5);
  const [downspoutCount, setDownspoutCount] = useState<number>(item.downspoutCount || 2);

  // Floating draggable state for PC
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; posX: number; posY: number }>({
    clientX: 0,
    clientY: 0,
    posX: 0,
    posY: 0
  });

  // Calculate length for beams/purlins/edges
  useEffect(() => {
    if (item.profileId) setProfileId(item.profileId);
    if (item.material) setMaterial(item.material);
    if (item.isLocked !== undefined) setIsLocked(item.isLocked);
    if (item.direccion) setDireccionElemento(item.direccion);

    if (type === 'column') {
      setAltura((item as ColumnElement).altura || 3.0);
      setHasBasePlate(item.basePlate ?? true);
      setAnchorBoltsCount(item.anchorBoltsCount || 4);
    } else if (type === 'truss' || type === 'beam') {
      if (item.tipoTijeral) setTipoTijeral(item.tipoTijeral);
      if (item.patronTijeral) setPatronTijeral(item.patronTijeral);
      if (item.trussHeight) setTrussHeight(item.trussHeight);
      if (item.trussSpan) setTrussSpan(item.trussSpan);
      if (item.trussSlope) setTrussSlope(item.trussSlope);
    } else if (type === 'sector') {
      setSectorName(item.nombre || 'Sector');
      setSectorSlope(item.pendientePct ?? 5.0);
      setSectorDireccion(item.direccionCaida || 'calle');
      if (item.sistemaCobertura === 'panel_termoacustico' || item.sistemaCobertura === 'termoacustico') {
        setSectorCoverageType('panel_termoacustico');
      } else {
        setSectorCoverageType('aluzinc');
      }
    } else if (type === 'gutter' || type === 'edge') {
      setHasGutter(item.hasGutter ?? true);
      setGutterProfile(item.gutterProfile || 'can-aluzinc-150');
      setDownspoutCount(item.downspoutCount || 2);
    } else if (type === 'downspout') {
      setDownspoutDiam(item.diametro || '4"');
      setDownspoutMaterial(item.material || 'PVC Pluvial (Estándar)');
      setDownspoutHeight(item.altura || 3.5);
    }

    if (item.startNode && item.endNode) {
      const start = item.startNode;
      const end = item.endNode;
      const len = Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
      setCustomLength(parseFloat(len.toFixed(2)));
    } else if (item.length) {
      setCustomLength(item.length);
    }
  }, [selectedItem]);

  // Dragging handlers (Mouse + Touch)
  const handleStartDrag = (clientX: number, clientY: number) => {
    if (isMobileSheet) return;
    setIsDragging(true);
    dragStartRef.current = {
      clientX,
      clientY,
      posX: position.x,
      posY: position.y
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStartDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    if (isMobileSheet) return;
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const dx = clientX - dragStartRef.current.clientX;
      const dy = clientY - dragStartRef.current.clientY;
      const newX = Math.min(Math.max(dragStartRef.current.posX + dx, -window.innerWidth + 320), 40);
      const newY = Math.min(Math.max(dragStartRef.current.posY + dy, -20), window.innerHeight - 150);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
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
  }, [isDragging, isMobileSheet]);

  const currentProfile: ProfileDefinition = getProfileById(profileId);
  const effectiveLength = type === 'column' ? altura : customLength;
  const weightPerMeter = currentProfile.weightKgM;
  const totalWeight = weightPerMeter * effectiveLength * quantity;

  const handleSelectDirection = (newDir: DireccionCaida) => {
    setSectorDireccion(newDir);
    if (type === 'sector') {
      const updatedSector: RoofSector = {
        ...(item as RoofSector),
        nombre: sectorName,
        pendientePct: sectorSlope,
        direccionCaida: newDir,
        sistemaCobertura: sectorCoverageType as any,
        isLocked
      };
      onUpdateItem(updatedSector, 'sector');
    }
  };

  const handleSelectSlope = (newSlope: number) => {
    setSectorSlope(newSlope);
    if (type === 'sector') {
      const updatedSector: RoofSector = {
        ...(item as RoofSector),
        nombre: sectorName,
        pendientePct: newSlope,
        direccionCaida: sectorDireccion,
        sistemaCobertura: sectorCoverageType as any,
        isLocked
      };
      onUpdateItem(updatedSector, 'sector');
    }
  };

  const handleApply = () => {
    if (type === 'column') {
      const updatedCol: ColumnElement = {
        ...(item as ColumnElement),
        profileId,
        material,
        altura,
        basePlate: hasBasePlate,
        anchorBoltsCount,
        isLocked,
        isCustom: true
      };
      onUpdateItem(updatedCol, 'column');
    } else if (type === 'beam' || type === 'truss' || type === 'brace') {
      const updatedBeam: any = {
        ...item,
        profileId,
        material,
        isLocked,
        direccion: direccionElemento,
        tipoTijeral,
        patronTijeral,
        trussHeight,
        trussSpan,
        trussSlope
      };
      onUpdateItem(updatedBeam, type);
    } else if (type === 'purlin') {
      const updatedPurlin: any = {
        ...(item as PurlinElement),
        profileId,
        material,
        direccion: direccionElemento,
        isLocked
      };
      onUpdateItem(updatedPurlin, 'purlin');
    } else if (type === 'sector') {
      const updatedSector: RoofSector = {
        ...(item as RoofSector),
        nombre: sectorName,
        pendientePct: sectorSlope,
        direccionCaida: sectorDireccion,
        sistemaCobertura: sectorCoverageType as any,
        isLocked
      };
      onUpdateItem(updatedSector, 'sector');
    } else if (type === 'edge' || type === 'gutter') {
      const updatedGutter = {
        ...item,
        hasGutter,
        gutterProfile,
        downspoutCount
      };
      onUpdateItem(updatedGutter, 'gutter');
    } else if (type === 'downspout') {
      const updatedDownspout = {
        ...item,
        diametro: downspoutDiam,
        material: downspoutMaterial,
        altura: downspoutHeight
      };
      onUpdateItem(updatedDownspout, 'downspout');
    }
    setAppliedMsg(true);
    setTimeout(() => setAppliedMsg(false), 2000);
  };

  const handleApplyToAll = () => {
    if (!onApplyToAll) return;
    if (type === 'column') {
      const updatedCol: ColumnElement = {
        ...(item as ColumnElement),
        profileId,
        material,
        altura,
        basePlate: hasBasePlate,
        anchorBoltsCount,
        isLocked
      };
      onApplyToAll(updatedCol, 'column');
    } else if (type === 'purlin') {
      const updatedPurlin: any = {
        ...(item as PurlinElement),
        profileId,
        material,
        direccion: direccionElemento,
        isLocked
      };
      onApplyToAll(updatedPurlin, 'purlin');
    } else if (type === 'truss' || type === 'beam') {
      onApplyToAll({
        profileId,
        material,
        direccion: direccionElemento,
        tipoTijeral,
        patronTijeral,
        trussHeight,
        trussSlope,
        isLocked
      }, 'truss');
    }
    setAppliedAllMsg(true);
    setTimeout(() => setAppliedAllMsg(false), 2000);
  };

  const getElementLabel = () => {
    if (type === 'column') return `Columna ${item.tag || 'C-01'}`;
    if (type === 'beam') return `Viga ${item.tag || 'V-01'}`;
    if (type === 'truss') return `Tijeral ${item.tag || 'TJ-01'}`;
    if (type === 'brace') return `Arriostre ${item.tag || 'ARR-01'}`;
    if (type === 'purlin') return `Correa ${item.tag || 'COR-01'}`;
    if (type === 'sector') return `${item.nombre || 'Sector de Techo'}`;
    if (type === 'edge' || type === 'gutter') return `Canaleta Pluvial (${customLength > 0 ? customLength.toFixed(2) + ' m' : 'Borde'})`;
    if (type === 'downspout') return `Bajante Pluvial Ø${downspoutDiam}`;
    if (type === 'void') return `Vacío / Tragaluz`;
    return `Elemento ${item.tag || item.id || ''}`;
  };

  // Filter profiles based on element type
  const availableProfiles = STEEL_PROFILES.filter(p => {
    if (type === 'column') return p.type === 'Tubo Cuadrado' || p.type === 'W' || p.type === 'IPE' || p.type === 'Tubo Rectangular';
    if (type === 'beam' || type === 'truss') return p.type === 'Tubo Rectangular' || p.type === 'W' || p.type === 'IPE' || p.type === 'Tubo Cuadrado' || p.type === 'Ángulo L';
    if (type === 'brace') return p.type === 'Tubo Cuadrado' || p.type === 'Tubo Rectangular' || p.type === 'Ángulo L';
    return p.type === 'Perfil C (Costanera)' || p.type === 'Tubo Rectangular' || p.type === 'Tubo Cuadrado';
  });

  const isTruss = type === 'truss' || (type === 'beam' && (item.type?.includes('tijeral') || item.tag?.startsWith('TJ')));

  // Render for Mobile Bottom Sheet vs PC Lateral Panel with Light, Simple Styling
  const panelContainerClasses = isMobileSheet
    ? "absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
    : "bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn transition-shadow w-88 max-w-[calc(100vw-32px)]";

  return (
    <div 
      style={!isMobileSheet ? { transform: `translate(${position.x}px, ${position.y}px)` } : undefined}
      className={panelContainerClasses}
    >
      {/* MOBILE DRAG HANDLE */}
      {isMobileSheet && (
        <div className="w-full pt-2.5 pb-1 flex justify-center bg-slate-50 cursor-grab">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>
      )}

      {/* HEADER - Light, clean design consistent with CAD tool modal */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="bg-slate-50 border-b border-slate-200 text-slate-800 px-3.5 py-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing select-none hover:bg-slate-100/80 transition-colors touch-none"
      >
        <div className="flex items-center space-x-2">
          {!isMobileSheet && <Move className="w-3.5 h-3.5 text-slate-400" />}
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
            Propiedades CAD
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          {!isMobileSheet && (
            <>
              <button 
                type="button"
                onClick={() => setPosition({ x: 0, y: 0 })}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                title="Centrar panel"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BODY */}
      {!isMinimized && (
        <div className="p-3.5 space-y-3 text-xs text-slate-700 max-h-[calc(100vh-220px)] overflow-y-auto">
          {/* Item Tag Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                {isTruss ? 'TIJERAL ESTRUCTURAL' : type.toUpperCase()}
              </span>
              <h4 className="text-sm font-black text-slate-900">
                {getElementLabel()}
              </h4>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 font-mono font-semibold text-slate-600 border border-slate-200">
              {item.id ? `ID: ${String(item.id).slice(-6)}` : 'ACTIVO'}
            </span>
          </div>

          {/* ========================================================= */}
          {/* 1. TIJERAL CONFIGURATION (IF APPLICABLE) */}
          {/* ========================================================= */}
          {isTruss && (
            <div className="p-3 bg-amber-50/95 border-2 border-amber-300 rounded-xl space-y-3 shadow-sm ring-1 ring-amber-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                  <Compass className="w-3.5 h-3.5 text-amber-600" />
                  ¿Qué tipo de tijeral deseas para este elemento?
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'dos_aguas', label: 'A Dos Aguas' },
                  { id: 'una_agua', label: 'Una Agua' },
                  { id: 'plano', label: 'Plano (Paralelo)' },
                  { id: 'asimetrico', label: 'Asimétrico' },
                  { id: 'parabolico', label: 'Arco / Parab.' },
                  { id: 'personalizado', label: 'Custom' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipoTijeral(t.id as TipoTijeral)}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center min-h-[36px] ${
                      tipoTijeral === t.id
                        ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400 scale-[1.02]'
                        : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300 shadow-xs'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Reticulation Pattern */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60">
                <div>
                  <label className="block font-semibold text-amber-900 text-[11px] mb-1">Patrón celosía:</label>
                  <select
                    value={patronTijeral}
                    onChange={e => setPatronTijeral(e.target.value as PatronTijeral)}
                    className="w-full p-1.5 bg-white border border-amber-300 rounded-lg font-bold text-slate-800"
                  >
                    <option value="warren">Warren</option>
                    <option value="pratt">Pratt</option>
                    <option value="howe">Howe</option>
                    <option value="fink">Fink</option>
                    <option value="king_post">King Post</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-amber-900 text-[11px] mb-1">Peralte / Altura (m):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.30"
                    max="4.00"
                    value={trussHeight}
                    onChange={e => setTrussHeight(parseFloat(e.target.value) || 0.8)}
                    className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-right font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Span and Slope */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-amber-900 text-[11px] mb-1">Luz / Span (m):</label>
                  <input
                    type="number"
                    step="0.10"
                    min="2.00"
                    max="40.00"
                    value={trussSpan}
                    onChange={e => setTrussSpan(parseFloat(e.target.value) || 8.0)}
                    className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-right font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-amber-900 text-[11px] mb-1">Pendiente (%):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={trussSlope}
                    onChange={e => setTrussSlope(parseFloat(e.target.value) || 15.0)}
                    className="w-full p-1.5 bg-white border border-amber-300 rounded-lg text-right font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. GENERAL STRUCTURAL PROFILES (COLUMN, BEAM, PURLIN, BRACE) */}
          {/* ========================================================= */}
          {(type === 'column' || type === 'beam' || type === 'purlin' || type === 'truss' || type === 'brace') && (
            <>
              {/* Profile */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-600">Perfil estructural:</label>
                  <span className="text-[10px] text-blue-600 font-bold font-mono">
                    {currentProfile.type}
                  </span>
                </div>
                <select
                  value={profileId}
                  onChange={e => setProfileId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                >
                  {availableProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.weightKgM.toFixed(1)} kg/m)
                    </option>
                  ))}
                </select>
              </div>

              {/* DIRECCIÓN DE CORREAS O VIGAS (Horizontal / Vertical / Diagonal) */}
              {(type === 'purlin' || type === 'beam') && (
                <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      Orientación / Dirección:
                    </span>
                    <span className="font-mono uppercase text-blue-700">{direccionElemento}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setDireccionElemento('horizontal')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        direccionElemento === 'horizontal'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/60'
                      }`}
                    >
                      Horizontal (X)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDireccionElemento('vertical')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        direccionElemento === 'vertical'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/60'
                      }`}
                    >
                      Vertical (Y)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDireccionElemento('diagonal')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        direccionElemento === 'diagonal'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-blue-200 text-blue-900 hover:bg-blue-100/60'
                      }`}
                    >
                      Diagonal (45°)
                    </button>
                  </div>
                </div>
              )}

              {/* Steel Grade */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-600">Calidad de Acero:</label>
                <select
                  value={material}
                  onChange={e => setMaterial(e.target.value as SteelMaterial)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                >
                  <option value="A500 Gr. B">ASTM A500 Gr. B (fy=3200 kg/cm² - Tubos)</option>
                  <option value="A36">ASTM A36 (fy=2530 kg/cm² - Perfiles C/L)</option>
                  <option value="A572 Gr. 50">ASTM A572 Gr. 50 (fy=3515 kg/cm² - Vigas W)</option>
                </select>
              </div>

              {/* Dimensions (Height or Length) & Quantity */}
              <div className="grid grid-cols-2 gap-2.5">
                {type === 'column' ? (
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-600">Altura Individual:</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        step="0.05"
                        min="1.0"
                        max="15.0"
                        value={altura}
                        onChange={e => setAltura(parseFloat(e.target.value) || 0)}
                        onBlur={handleApply}
                        onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
                        className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-right font-bold text-slate-800"
                      />
                      <span className="text-slate-500 font-medium">m</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-600">Longitud:</label>
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        readOnly
                        value={customLength}
                        className="w-full p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-right font-bold text-slate-600"
                      />
                      <span className="text-slate-500 font-medium">m</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-600">Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-right font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Column Base Plate & Bolts */}
              {type === 'column' && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Placa Base de anclaje:</span>
                    <input
                      type="checkbox"
                      checked={hasBasePlate}
                      onChange={e => setHasBasePlate(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </div>
                  {hasBasePlate && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-600">Pernos de Anclaje:</span>
                      <select
                        value={anchorBoltsCount}
                        onChange={e => setAnchorBoltsCount(parseInt(e.target.value) || 4)}
                        className="p-1 bg-white border border-slate-300 rounded font-bold"
                      >
                        <option value={4}>4 pernos Ø5/8"</option>
                        <option value={6}>6 pernos Ø3/4"</option>
                        <option value={8}>8 pernos Ø1"</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* SIMULADOR DE RESISTENCIA Y COLAPSO SHORTCUT */}
              {onOpenCollapseSimulator && (
                <button
                  type="button"
                  onClick={onOpenCollapseSimulator}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-amber-900 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>⚡ Simular si Resiste o Colapsa</span>
                </button>
              )}

              {/* Weight & Specs Summary */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Peso lineal:</span>
                  <span className="font-mono font-bold text-slate-700">{weightPerMeter.toFixed(2)} kg/m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peso total est.:</span>
                  <span className="font-mono font-bold text-blue-700">{totalWeight.toFixed(1)} kg</span>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* 3. SECTOR, PENDIENTE & DIRECCIÓN DE CAÍDA DE AGUA */}
          {/* ========================================================= */}
          {type === 'sector' && (
            <div className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nombre del Sector:</label>
                <input
                  type="text"
                  value={sectorName}
                  onChange={e => setSectorName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              {/* 💧 DIRECCIÓN DE CAÍDA */}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-950 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    💧 Dirección de Caída:
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-sky-200/60 text-sky-900 px-1.5 py-0.5 rounded font-bold">
                    {sectorDireccion.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelectDirection('fondo')}
                    className={`p-2 rounded-lg font-bold flex flex-col items-center justify-center transition-all ${
                      sectorDireccion === 'fondo' || sectorDireccion === 'interior'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'
                    }`}
                    title="Hacia el Fondo / Posterior"
                  >
                    <ArrowUp className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px]">Fondo ↑</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDirection('calle')}
                    className={`p-2 rounded-lg font-bold flex flex-col items-center justify-center transition-all ${
                      sectorDireccion === 'calle'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'
                    }`}
                    title="Hacia la Calle / Frente"
                  >
                    <ArrowDown className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px]">Calle ↓</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDirection('izquierda')}
                    className={`p-2 rounded-lg font-bold flex flex-col items-center justify-center transition-all ${
                      sectorDireccion === 'izquierda'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'
                    }`}
                    title="Hacia la Izquierda"
                  >
                    <ArrowLeft className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px]">Izq. ←</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDirection('derecha')}
                    className={`p-2 rounded-lg font-bold flex flex-col items-center justify-center transition-all ${
                      sectorDireccion === 'derecha'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'
                    }`}
                    title="Hacia la Derecha"
                  >
                    <ArrowRight className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px]">Der. →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDirection('personalizada')}
                    className={`p-2 rounded-lg font-bold flex flex-col items-center justify-center transition-all ${
                      sectorDireccion === 'personalizada'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-100'
                    }`}
                    title="Personalizada"
                  >
                    <Compass className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px]">Pers.</span>
                  </button>
                </div>
              </div>

              {/* PENDIENTE */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">📐 Pendiente de Caída:</span>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {sectorSlope}% ({(sectorSlope * 0.57).toFixed(1)}°)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 5, 10, 15].map(slp => (
                    <button
                      key={`slope-preset-${slp}`}
                      type="button"
                      onClick={() => handleSelectSlope(slp)}
                      className={`py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        sectorSlope === slp 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {slp}%
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <input
                    type="range"
                    min="1"
                    max="45"
                    step="1"
                    value={sectorSlope}
                    onChange={e => handleSelectSlope(parseFloat(e.target.value) || 5)}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* SISTEMA DE COBERTURA */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Sistema de Cobertura:
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSectorCoverageType('aluzinc');
                      if (type === 'sector') {
                        onUpdateItem({ ...item, sistemaCobertura: 'aluzinc' }, 'sector');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                      sectorCoverageType === 'aluzinc'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Aluzinc TR4
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSectorCoverageType('panel_termoacustico');
                      if (type === 'sector') {
                        onUpdateItem({ ...item, sistemaCobertura: 'panel_termoacustico' }, 'sector');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                      sectorCoverageType === 'panel_termoacustico'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Panel Termoac.
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSectorCoverageType('policarbonato');
                      if (type === 'sector') {
                        onUpdateItem({ ...item, sistemaCobertura: 'policarbonato' }, 'sector');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all text-center ${
                      sectorCoverageType === 'policarbonato'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Policarbonato
                  </button>
                </div>

                {/* Sub-selector for Aluzinc / Eternit / Fibrocemento */}
                {sectorCoverageType === 'aluzinc' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo y Espesor de Cobertura:</label>
                      <select
                        value={aluzincCalibre}
                        onChange={e => setAluzincCalibre(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        {ALUZINC_CATALOG.map(al => (
                          <option key={al.id} value={al.espesorMm + ' mm'}>
                            {al.perfil} ({al.calibre} - S/. {al.precioSolesM2}/m²)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Perfil / Material:</label>
                      <select
                        value={aluzincPerfil}
                        onChange={e => setAluzincPerfil(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        <option value="TR4">Aluzinc TR4 Trapezoidal</option>
                        <option value="TR4 Translúcido">TR4 Translúcido (Policarbonato)</option>
                        <option value="TR5">Aluzinc TR5 Trapezoidal</option>
                        <option value="Ondulado">Aluzinc Ondulado</option>
                        <option value="Eternit Gran Onda">Eternit Gran Onda Fibrocemento</option>
                        <option value="Eternit Perfil 4">Eternit Perfil 4</option>
                        <option value="Teja Andina">Teja Andina Fibrocemento</option>
                        <option value="Policarbonato Alveolar">Policarbonato Alveolar 6mm</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Sub-selector for Termoacústico */}
                {sectorCoverageType === 'panel_termoacustico' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Núcleo Aislante:</label>
                      <select
                        value={termoNucleo}
                        onChange={e => setTermoNucleo(e.target.value as any)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        <option value="EPS">Poliestireno (EPS)</option>
                        <option value="PUR">Poliuretano (PUR)</option>
                        <option value="PIR">Poliisocianurato (PIR)</option>
                        <option value="Lana de Roca">Lana de Roca</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Espesor Núcleo:</label>
                      <select
                        value={termoEspesor}
                        onChange={e => setTermoEspesor(parseInt(e.target.value) || 50)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        {TERMOACUSTICO_CATALOG.map(t => (
                          <option key={t.id} value={t.espesorTotalMm}>
                            {t.espesorTotalMm} mm ({t.nombre})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. CANALETA Y EVACUACIÓN */}
          {/* ========================================================= */}
          {(type === 'gutter' || type === 'edge') && (
            <div className="space-y-3">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-950 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    Canaleta Pluvial en este Borde
                  </span>
                  <input
                    type="checkbox"
                    checked={hasGutter}
                    onChange={e => setHasGutter(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </div>

                {hasGutter && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Modelo de Canaleta:</label>
                      <select
                        value={gutterProfile}
                        onChange={e => setGutterProfile(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      >
                        {CANALETA_OPTIONS.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} (S/. {c.precioSolesM}/m)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Bajantes:</label>
                        <select
                          value={downspoutDiam}
                          onChange={e => setDownspoutDiam(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                        >
                          {BAJANTE_OPTIONS.map(b => (
                            <option key={b.id} value={b.diametroPulg}>
                              Ø {b.diametroPulg} ({b.material}) - S/. {b.precioSolesM}/m
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Cantidad bajantes:</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={downspoutCount}
                          onChange={e => setDownspoutCount(parseInt(e.target.value) || 0)}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-right font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ACTION BUTTONS (APLICAR, DUPLICAR, BLOQUEAR, ELIMINAR) */}
          {/* ========================================================= */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleApply}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{appliedMsg ? '¡Aplicado con Éxito!' : 'Aplicar Cambios (Solo este)'}</span>
            </button>

            {onApplyToAll && (type === 'column' || type === 'purlin' || isTruss) && (
              <button
                type="button"
                onClick={handleApplyToAll}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {appliedAllMsg 
                    ? '¡Aplicado a Todos!' 
                    : `Aplicar a Todos (${type === 'column' ? 'Columnas' : isTruss ? 'Tijerales' : 'Correas'})`}
                </span>
              </button>
            )}

            {onDuplicateItem && type !== 'sector' && type !== 'edge' && (
              <button
                type="button"
                onClick={() => onDuplicateItem(item, type)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar Elemento</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                isLocked ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{isLocked ? 'Elemento Bloqueado (Seguro)' : 'Bloquear Elemento'}</span>
            </button>

            {type !== 'sector' && type !== 'edge' && (
              <button
                type="button"
                onClick={() => {
                  if (isLocked) {
                    alert('Este elemento está bloqueado. Desbloquéalo para poder eliminarlo.');
                    return;
                  }
                  onDeleteItem(item.id, type);
                }}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar elemento</span>
                </div>
                <span className="text-[10px] bg-rose-200/70 text-rose-800 px-1.5 py-0.5 rounded font-mono font-semibold">
                  Supr / Del
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuralPropertiesPanel;
