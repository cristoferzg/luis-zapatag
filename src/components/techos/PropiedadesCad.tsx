// Panel de Edición y Propiedades CAD Paramétricas (PropiedadesCad)
// Cohesivo con el diseño amigable de la plataforma Innova Contratistas
// Permite modificar libremente medidas exactas de vigas, columnas y nodos sin bloqueos al borrar números
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  X, 
  Trash2, 
  Box,
  Columns,
  ArrowUpDown, 
  GraduationCap, 
  ArrowUpRight,
  Ruler,
  CheckCircle2,
  Layers,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';

import { UseTechosCadEngineReturn } from './useTechosCadEngineState';
import { INVENTARIO_PERFILES_TUBULARES, PERFILES_TECHOS_AGRUPADOS } from './techosCadCatalog';
import { RolEstructuralSegmento } from './techosCadEngineTypes';
import { MERCADO_COLORES_PINTURA, TipoTijeral } from './techosCadColors';

export interface PropiedadesCadProps {
  engineState?: UseTechosCadEngineReturn;
  design?: any;
  onUpdateDesign?: (updated: any) => void;
  isBottomSheetMobile?: boolean;
  onCloseBottomSheetMobile?: () => void;
  onOpenTutorial?: () => void;
  onClose?: () => void;
}

export const PropiedadesCad: React.FC<PropiedadesCadProps> = ({
  engineState,
  isBottomSheetMobile = false,
  onCloseBottomSheetMobile,
  onOpenTutorial,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'activos' | 'seleccion' | 'perfiles' | 'generadores'>('activos');
  const [selectedTrussGen, setSelectedTrussGen] = useState<TipoTijeral>('warren');

  // Estado para filtrado de elementos activos
  const [searchActivosTerm, setSearchActivosTerm] = useState('');
  const [filterActivosRol, setFilterActivosRol] = useState<string>('all');
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({});
  // Confirmación en 2 pasos para eliminar un grupo completo (evita borrados por error).
  const [confirmDelRol, setConfirmDelRol] = useState<string | null>(null);

  const toggleExpandRole = (rol: string) => {
    setExpandedRoles(prev => ({ ...prev, [rol]: !prev[rol] }));
  };

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Gesto táctil Swipe-Down para cerrar el Inspector Paramétrico en dispositivos móviles
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const touchStartYRef = React.useRef(0);
  const currentDragYRef = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    currentDragYRef.current = 0;
    setIsDraggingSheet(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    if (deltaY > 0) {
      currentDragYRef.current = deltaY;
      setDragOffsetY(deltaY);
    } else {
      currentDragYRef.current = 0;
      setDragOffsetY(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDraggingSheet(false);
    if (currentDragYRef.current > 75) {
      setDragOffsetY(0);
      if (onCloseBottomSheetMobile) {
        onCloseBottomSheetMobile();
      } else if (onClose) {
        onClose();
      }
    } else {
      setDragOffsetY(0);
    }
  };

  // Parámetros de Generación Paramétrica con Strings para evitar bloqueos al borrar números
  const [posicionZTijeralStr, setPosicionZTijeralStr] = useState<string>('5.0');

  const selectedIds = engineState?.selectedElementIds || [];
  const nodes = engineState?.nodes || {};
  const segments = engineState?.segments || {};

  // Calcular perfiles en uso en el dibujo 2D
  const perfilesEnUso = React.useMemo(() => {
    if (!engineState || !engineState.segments) return [];
    
    // Obtener todos los segmentos
    const allSegments = Object.values(engineState.segments);
    
    // Agrupar segmentos por profileId
    const profileMap: Record<string, { profile: typeof INVENTARIO_PERFILES_TUBULARES[0]; count: number; totalLength: number }> = {};
    
    allSegments.forEach(seg => {
      const pId = seg.profileId || 'perfil_sq_2x2_15'; // Default fallback
      const profile = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === pId) || INVENTARIO_PERFILES_TUBULARES[0];
      
      // Calcular longitud del segmento
      const nodeA = engineState.nodes[seg.nodeAId];
      const nodeB = engineState.nodes[seg.nodeBId];
      let length = 0;
      if (nodeA && nodeB) {
        length = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y, (nodeB.z || 0) - (nodeA.z || 0));
      }
      
      if (!profileMap[pId]) {
        profileMap[pId] = {
          profile,
          count: 0,
          totalLength: 0
        };
      }
      
      profileMap[pId].count += 1;
      profileMap[pId].totalLength += length;
    });
    
    return Object.values(profileMap).sort((a, b) => b.totalLength - a.totalLength);
  }, [engineState?.segments, engineState?.nodes]);

  // Agrupación detallada de elementos activos en el modelo para inspección y cambio de perfil
  const gruposElementosActivos = React.useMemo(() => {
    if (!engineState || !engineState.segments) return [];
    const allSegments = Object.values(engineState.segments);
    
    const roleMeta: Record<string, { label: string; icon: string; colorBadge: string }> = {
      columna: { label: 'Columnas Estructurales', icon: '🏛️', colorBadge: 'bg-blue-50 text-blue-700 border-blue-200' },
      viga_principal: { label: 'Vigas Principales', icon: '📏', colorBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      viga_secundaria: { label: 'Vigas Secundarias / Viguetas', icon: '📐', colorBadge: 'bg-teal-50 text-teal-700 border-teal-200' },
      cordon_superior: { label: 'Cordones Superiores (Tijeral)', icon: '🔺', colorBadge: 'bg-amber-50 text-amber-700 border-amber-200' },
      cordon_inferior: { label: 'Cordones Inferiores (Tijeral)', icon: '🔻', colorBadge: 'bg-orange-50 text-orange-700 border-orange-200' },
      montante: { label: 'Montantes Verticales', icon: '📍', colorBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      diagonal: { label: 'Diagonales de Celosía', icon: '⚡', colorBadge: 'bg-purple-50 text-purple-700 border-purple-200' },
      correa: { label: 'Correas / Tubos de Tejido', icon: '🪵', colorBadge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      arriostre: { label: 'Arriostres y Cruces San Andrés', icon: '⛓️', colorBadge: 'bg-slate-100 text-slate-800 border-slate-300' },
      piso_deck: { label: 'Piso Metal Deck / Mezzanine', icon: '🏁', colorBadge: 'bg-slate-50 text-slate-700 border-slate-200' }
    };

    const map: Record<string, {
      rol: RolEstructuralSegmento;
      label: string;
      icon: string;
      colorBadge: string;
      items: {
        seg: typeof allSegments[0];
        lengthM: number;
        profile: typeof INVENTARIO_PERFILES_TUBULARES[0];
      }[];
      totalLengthM: number;
      mostCommonProfileId: string;
    }> = {};

    allSegments.forEach(seg => {
      const rol = seg.rolEstructural || 'viga_principal';
      if (!map[rol]) {
        const meta = roleMeta[rol] || { label: rol.toUpperCase(), icon: '📦', colorBadge: 'bg-slate-50 text-slate-700 border-slate-200' };
        map[rol] = {
          rol,
          label: meta.label,
          icon: meta.icon,
          colorBadge: meta.colorBadge,
          items: [],
          totalLengthM: 0,
          mostCommonProfileId: seg.profileId || INVENTARIO_PERFILES_TUBULARES[0].id
        };
      }
      const nodeA = engineState.nodes[seg.nodeAId];
      const nodeB = engineState.nodes[seg.nodeBId];
      let lengthM = 0;
      if (nodeA && nodeB) {
        lengthM = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y, (nodeB.z || 0) - (nodeA.z || 0));
      }
      const prof = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === seg.profileId) || INVENTARIO_PERFILES_TUBULARES[0];
      map[rol].items.push({ seg, lengthM, profile: prof });
      map[rol].totalLengthM += lengthM;
    });

    // Determinar perfil más común por rol
    Object.values(map).forEach(group => {
      const counts: Record<string, number> = {};
      group.items.forEach(it => {
        counts[it.seg.profileId] = (counts[it.seg.profileId] || 0) + 1;
      });
      let bestP = group.mostCommonProfileId;
      let maxC = 0;
      Object.entries(counts).forEach(([pId, c]) => {
        if (c > maxC) {
          maxC = c;
          bestP = pId;
        }
      });
      group.mostCommonProfileId = bestP;
    });

    return Object.values(map).sort((a, b) => b.items.length - a.items.length);
  }, [engineState?.segments, engineState?.nodes]);

  const handleBulkUpdateGroupProfile = (segIds: string[], newProfileId: string) => {
    if (!engineState || !segIds.length) return;
    if (typeof engineState.updateMultipleSegmentsProfile === 'function') {
      engineState.updateMultipleSegmentsProfile(segIds, newProfileId);
    } else {
      segIds.forEach(id => engineState.updateSegmentProfile(id, newProfileId));
    }
  };

  const handleReplaceProfileUsage = (oldProfileId: string, newProfileId: string) => {
    if (!engineState || !engineState.segments) return;
    const matchingIds = Object.values(engineState.segments)
      .filter(s => (s.profileId || 'perfil_sq_2x2_15') === oldProfileId)
      .map(s => s.id);
    if (matchingIds.length > 0) {
      handleBulkUpdateGroupProfile(matchingIds, newProfileId);
    }
  };

  const firstSelectedId = selectedIds[0];
  const selectedNode = firstSelectedId ? nodes[firstSelectedId] : null;
  const selectedSegment = firstSelectedId ? segments[firstSelectedId] : null;

  // Estados locales como String para edición de Nodo seleccionado
  const [nodeXStr, setNodeXStr] = useState<string>('');
  const [nodeYStr, setNodeYStr] = useState<string>('');
  const [nodeZStr, setNodeZStr] = useState<string>('');

  // Estados locales como String para edición de Segmento/Viga/Columna seleccionada
  const [exactLengthStr, setExactLengthStr] = useState<string>('');
  const [colHeightEditStr, setColHeightEditStr] = useState<string>('');
  const [nodeAYEditStr, setNodeAYEditStr] = useState<string>('');
  const [nodeBYEditStr, setNodeBYEditStr] = useState<string>('');

  // Cálculos geométricos del tramo seleccionado
  const nodeA = selectedSegment ? nodes[selectedSegment.nodeAId] : null;
  const nodeB = selectedSegment ? nodes[selectedSegment.nodeBId] : null;

  const lengthM = (nodeA && nodeB) 
    ? Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y, (nodeB.z || 0) - (nodeA.z || 0)) 
    : 0;

  const isColumna = selectedSegment?.rolEstructural === 'columna';
  const isViga = selectedSegment?.rolEstructural === 'viga_principal' || selectedSegment?.rolEstructural === 'viga_secundaria';

  const baseNode = (nodeA && nodeB) ? (nodeA.y <= nodeB.y ? nodeA : nodeB) : null;
  const topNode = (nodeA && nodeB) ? (nodeA.y <= nodeB.y ? nodeB : nodeA) : null;
  const currentHeightM = (topNode && baseNode) ? Number((topNode.y - baseNode.y).toFixed(2)) : 4.0;

  // Sincronizar estados locales cuando cambia el elemento seleccionado (evitando pisar el campo enfocado)
  useEffect(() => {
    if (selectedNode) {
      if (focusedField !== 'nodeX') setNodeXStr(selectedNode.x.toString());
      if (focusedField !== 'nodeY') setNodeYStr(selectedNode.y.toString());
      if (focusedField !== 'nodeZ') setNodeZStr((selectedNode.z || 0).toString());
    }
  }, [firstSelectedId, selectedNode?.x, selectedNode?.y, selectedNode?.z, focusedField]);

  useEffect(() => {
    if (selectedSegment && nodeA && nodeB) {
      if (focusedField !== 'exactLength') setExactLengthStr(lengthM.toFixed(2));
      if (focusedField !== 'colHeight') setColHeightEditStr(currentHeightM.toFixed(2));
      if (focusedField !== 'nodeAY') setNodeAYEditStr(nodeA.y.toFixed(2));
      if (focusedField !== 'nodeBY') setNodeBYEditStr(nodeB.y.toFixed(2));
    }
  }, [firstSelectedId, selectedSegment?.id, lengthM, currentHeightM, nodeA?.y, nodeB?.y, focusedField]);

  // Manejador para aplicar cambios de coordenadas al Nodo
  const handleUpdateNodeFromLocalStr = (axis: 'x' | 'y' | 'z', strVal: string) => {
    if (!selectedNode || !engineState) return;
    if (axis === 'x') {
      setNodeXStr(strVal);
      const val = parseFloat(strVal);
      if (!isNaN(val)) engineState.updateNodeCoords(selectedNode.id, val, selectedNode.y, selectedNode.z);
    } else if (axis === 'y') {
      setNodeYStr(strVal);
      const val = parseFloat(strVal);
      if (!isNaN(val)) engineState.updateNodeCoords(selectedNode.id, selectedNode.x, val, selectedNode.z);
    } else if (axis === 'z') {
      setNodeZStr(strVal);
      const val = parseFloat(strVal);
      if (!isNaN(val)) engineState.updateNodeCoords(selectedNode.id, selectedNode.x, selectedNode.y, val);
    }
  };

  // Manejador para ajustar la LONGITUD EXACTA REAL de cualquier tramo/viga
  const handleApplyExactSegmentLength = (newLengthStr: string) => {
    setExactLengthStr(newLengthStr);
    const targetLength = parseFloat(newLengthStr);
    if (!engineState || !nodeA || !nodeB || isNaN(targetLength) || targetLength <= 0) return;

    const currentLen = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y, (nodeB.z || 0) - (nodeA.z || 0));
    if (currentLen < 0.001) {
      // Si coinciden los nodos, extender en dirección X
      engineState.updateNodeCoords(nodeB.id, nodeA.x + targetLength, nodeA.y, nodeA.z || 0);
      return;
    }

    const ratio = targetLength / currentLen;
    const newBx = nodeA.x + (nodeB.x - nodeA.x) * ratio;
    const newBy = nodeA.y + (nodeB.y - nodeA.y) * ratio;
    const newBz = (nodeA.z || 0) + ((nodeB.z || 0) - (nodeA.z || 0)) * ratio;

    engineState.updateNodeCoords(nodeB.id, Number(newBx.toFixed(3)), Number(newBy.toFixed(3)), Number(newBz.toFixed(3)));
  };

  // Manejador para cambiar ALTURA EXACTA de columna
  const handleUpdateColHeight = (newHStr: string) => {
    setColHeightEditStr(newHStr);
    const newH = parseFloat(newHStr);
    if (!engineState || !topNode || !baseNode || isNaN(newH) || newH <= 0) return;
    const targetY = baseNode.y + newH;
    engineState.updateNodeCoords(topNode.id, topNode.x, Number(targetY.toFixed(3)), topNode.z);
  };

  // Manejador para desplazar altura de viga (ambos extremos)
  const handleShiftBeamElevation = (deltaY: number) => {
    if (!engineState || !nodeA || !nodeB) return;
    engineState.updateNodeCoords(nodeA.id, nodeA.x, Math.max(0, nodeA.y + deltaY), nodeA.z);
    engineState.updateNodeCoords(nodeB.id, nodeB.x, Math.max(0, nodeB.y + deltaY), nodeB.z);
  };

  const handleSetBeamElevation = (targetY: number) => {
    if (!engineState || !nodeA || !nodeB || targetY < 0) return;
    const diff = targetY - nodeA.y;
    engineState.updateNodeCoords(nodeA.id, nodeA.x, targetY, nodeA.z);
    engineState.updateNodeCoords(nodeB.id, nodeB.x, Math.max(0, nodeB.y + diff), nodeB.z);
  };

  return (
    <div 
      style={{
        transform: isBottomSheetMobile 
          ? (isDraggingSheet && dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : 'translateY(0)') 
          : undefined,
        transition: isDraggingSheet ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className={`
        bg-white text-slate-800 border-l border-slate-200 flex flex-col h-full select-none shadow-xs transition-all
        ${isBottomSheetMobile 
          ? 'fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t-2 border-slate-300 max-h-[85vh] w-full shadow-2xl bg-white overflow-hidden pointer-events-auto' 
          : 'w-80 lg:w-96 shrink-0 h-full overflow-hidden'
        }
      `}
    >
      {/* DRAG HANDLE PARA MÓVIL CON GESTO TÁCTIL SWIPE-DOWN */}
      {isBottomSheetMobile && (
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full flex flex-col items-center pt-2.5 pb-2 bg-slate-50 border-b border-slate-200 rounded-t-3xl cursor-grab active:cursor-grabbing select-none touch-none"
        >
          <div className="w-14 h-1.5 rounded-full bg-slate-300 hover:bg-amber-500 transition-colors" />
          <span className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-1">
            <ChevronDown className="w-3 h-3 text-slate-400" />
            Desliza hacia abajo para cerrar
          </span>
        </div>
      )}

      {/* CABECERA PRINCIPAL */}
      <div 
        onTouchStart={isBottomSheetMobile ? handleTouchStart : undefined}
        onTouchMove={isBottomSheetMobile ? handleTouchMove : undefined}
        onTouchEnd={isBottomSheetMobile ? handleTouchEnd : undefined}
        className={`p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 ${
          isBottomSheetMobile ? 'cursor-grab active:cursor-grabbing select-none' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black tracking-wide text-slate-900 uppercase">
            Inspector Paramétrico CAD
          </h3>
        </div>
        {onClose ? (
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            title="Cerrar Inspector"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        ) : isBottomSheetMobile && onCloseBottomSheetMobile ? (
          <button 
            onClick={onCloseBottomSheetMobile} 
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        ) : null}
      </div>

      {/* PESTAÑAS DEL INSPECTOR */}
      <div className="flex items-center border-b border-slate-200 bg-slate-100/80 p-1.5 gap-1 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('activos')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
            activeTab === 'activos' 
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Activos ({Object.keys(segments).length})
        </button>
        <button
          onClick={() => setActiveTab('seleccion')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
            activeTab === 'seleccion' 
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Selección ({selectedIds.length})
        </button>
        <button
          onClick={() => setActiveTab('perfiles')}
          className={`py-1.5 px-2.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
            activeTab === 'perfiles' 
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Perfiles
        </button>
        <button
          onClick={() => setActiveTab('generadores')}
          className={`py-1.5 px-2.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
            activeTab === 'generadores' 
              ? 'bg-white text-slate-900 shadow-2xs font-extrabold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Tijeral Interno
        </button>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs font-sans scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* PESTAÑA NUEVA: TODOS LOS ELEMENTOS ACTIVOS DEL DISEÑO */}
        {activeTab === 'activos' && (
          <div className="space-y-3">
            {/* Cabecera Informativa y Buscador */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  Elementos Activos ({Object.keys(segments).length})
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {gruposElementosActivos.length} Grupos
                </span>
              </div>

              {/* Buscador Rápido de Elementos */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchActivosTerm}
                  onChange={(e) => setSearchActivosTerm(e.target.value)}
                  placeholder="Buscar elemento por ID (ej. s_col, s_correa)..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              {/* Filtro por Categoría Estructural */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setFilterActivosRol('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors shrink-0 cursor-pointer ${
                    filterActivosRol === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  Todos ({Object.keys(segments).length})
                </button>
                {gruposElementosActivos.map(grp => (
                  <button
                    key={grp.rol}
                    onClick={() => setFilterActivosRol(grp.rol)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
                      filterActivosRol === grp.rol
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span>{grp.icon}</span>
                    <span>{grp.label.split(' ')[0]} ({grp.items.length})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Asignación Global de Perfil a Todo el Modelo */}
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <span className="block text-[10px] font-black text-amber-950 uppercase tracking-wide">
                ⚡ Cambiar Perfil a TODOS los Elementos del Modelo:
              </span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkUpdateGroupProfile(Object.keys(segments), e.target.value);
                    e.target.value = "";
                  }
                }}
                className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-slate-800 font-bold text-xs cursor-pointer shadow-2xs focus:border-amber-600 outline-none"
              >
                <option value="">-- Seleccionar nuevo perfil general --</option>
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
            </div>

            {/* Listado de Grupos de Elementos Activos */}
            {Object.keys(segments).length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 space-y-2">
                <Box className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700">No hay elementos activos</p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Carga un techo o dibuja tramos para verlos e inspeccionar sus perfiles aquí.
                </p>
              </div>
            ) : (
              gruposElementosActivos
                .filter(grp => filterActivosRol === 'all' || filterActivosRol === grp.rol)
                .map(grp => {
                  const filteredItems = grp.items.filter(it => 
                    !searchActivosTerm || it.seg.id.toLowerCase().includes(searchActivosTerm.toLowerCase())
                  );
                  if (filteredItems.length === 0 && searchActivosTerm) return null;

                  const isExpanded = expandedRoles[grp.rol] ?? false;

                  return (
                    <div key={grp.rol} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      {/* Cabecera del Grupo Estructural */}
                      <div className="p-3 bg-slate-50/80 border-b border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base">{grp.icon}</span>
                            <span className="font-extrabold text-slate-900 text-xs truncate">{grp.label}</span>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border shrink-0 ${grp.colorBadge}`}>
                            {grp.items.length} {grp.items.length === 1 ? 'tramo' : 'tramos'} • {grp.totalLengthM.toFixed(1)}m
                          </span>
                        </div>

                        {/* Cambiar Perfil del Grupo Completo */}
                        <div>
                          <label className="block text-[10px] text-slate-500 font-bold mb-0.5">
                            Cambiar Perfil de todo el grupo ({grp.label}):
                          </label>
                          <select
                            value={grp.mostCommonProfileId}
                            onChange={(e) => handleBulkUpdateGroupProfile(grp.items.map(it => it.seg.id), e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 font-bold text-xs cursor-pointer focus:border-amber-500 outline-none shadow-2xs"
                          >
                            {PERFILES_TECHOS_AGRUPADOS.map(g => (
                              <optgroup key={g.norma} label={g.label} className="font-bold text-slate-800">
                                {g.items.map(p => (
                                  <option key={p.id} value={p.id} className="text-slate-900 font-medium">
                                    {p.nombre} ({p.codigoComercial})
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        {/* Acciones del Grupo Completo: Seleccionar / Eliminar (sin ir uno por uno) */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              engineState?.setSelectedElementIds?.(grp.items.map(it => it.seg.id));
                              setConfirmDelRol(null);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                            title={`Seleccionar los ${grp.items.length} elementos de este grupo en el lienzo`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Seleccionar {grp.items.length}</span>
                          </button>
                          {confirmDelRol === grp.rol ? (
                            <button
                              type="button"
                              onClick={() => {
                                engineState?.deleteSegmentsByIds?.(grp.items.map(it => it.seg.id));
                                setConfirmDelRol(null);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95 shadow-xs"
                              title="Confirmar: borrar todo el grupo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>¿Confirmar borrar?</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDelRol(grp.rol)}
                              className="flex-1 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                              title={`Eliminar los ${grp.items.length} elementos de este grupo`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar grupo</span>
                            </button>
                          )}
                        </div>

                        {/* Botón para Desplegar Elementos Individuales */}
                        <button
                          type="button"
                          onClick={() => toggleExpandRole(grp.rol)}
                          className="w-full pt-1 text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Ocultar elementos individuales' : `Ver los ${grp.items.length} elementos individuales`}</span>
                        </button>
                      </div>

                      {/* Lista Desplegable de Elementos Individuales */}
                      {isExpanded && (
                        <div className="p-2 space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white">
                          {filteredItems.map(it => {
                            const isSelected = selectedIds.includes(it.seg.id);
                            return (
                              <div key={it.seg.id} className={`pt-2 first:pt-0 space-y-1.5 p-1.5 rounded-lg transition-colors ${
                                isSelected ? 'bg-amber-50/80 border border-amber-300' : 'hover:bg-slate-50'
                              }`}>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-mono font-bold text-slate-800">{it.seg.id}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                                      {it.lengthM.toFixed(2)} m
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (engineState?.setSelectedElementIds) {
                                          engineState.setSelectedElementIds([it.seg.id]);
                                        }
                                      }}
                                      className={`text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                        isSelected 
                                          ? 'bg-amber-500 text-slate-950' 
                                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      }`}
                                      title="Seleccionar en lienzo 2D/3D"
                                    >
                                      {isSelected ? '✓ Seleccionado' : 'Seleccionar'}
                                    </button>
                                  </div>
                                </div>

                                {/* Selector de Perfil Individual */}
                                <select
                                  value={it.seg.profileId}
                                  onChange={(e) => engineState?.updateSegmentProfile(it.seg.id, e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded p-1 text-[10px] font-bold text-slate-800 cursor-pointer outline-none"
                                >
                                  {INVENTARIO_PERFILES_TUBULARES.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* PESTAÑA 2: PROPIEDADES DEL ELEMENTO SELECCIONADO */}
        {activeTab === 'seleccion' && (
          <div className="space-y-3">
            {selectedIds.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 space-y-2.5">
                <Box className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700">Sin elementos seleccionados en el lienzo</p>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Haz clic sobre un nodo, viga o columna en el lienzo para editar sus cotas exactas, o inspecciona todos los elementos activos aquí:
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('activos')}
                  className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Ver y Cambiar Perfiles de los {Object.keys(segments).length} Elementos Activos</span>
                </button>
              </div>
            ) : selectedNode ? (
              /* PROPIEDADES DE NODO */
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-slate-900 text-xs">Nodo: {selectedNode.nodeLabel || selectedNode.id}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-mono font-bold">Punto Coordenada</span>
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">X (m):</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={nodeXStr}
                      onFocus={() => setFocusedField('nodeX')}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      onChange={(e) => handleUpdateNodeFromLocalStr('x', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1 sm:p-1.5 text-slate-900 font-mono font-bold text-[11px] sm:text-xs focus:border-amber-500 focus:outline-none shadow-2xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Y (m):</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={nodeYStr}
                      onFocus={() => setFocusedField('nodeY')}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      onChange={(e) => handleUpdateNodeFromLocalStr('y', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1 sm:p-1.5 text-slate-900 font-mono font-bold text-[11px] sm:text-xs focus:border-amber-500 focus:outline-none shadow-2xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Z (m):</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={nodeZStr}
                      onFocus={() => setFocusedField('nodeZ')}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      onChange={(e) => handleUpdateNodeFromLocalStr('z', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1 sm:p-1.5 text-slate-900 font-mono font-bold text-[11px] sm:text-xs focus:border-amber-500 focus:outline-none shadow-2xs"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* CONFIGURACIÓN DE PERNOS DE ANCLAJE */}
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                  <span className="block font-black text-blue-900 text-[11px] uppercase tracking-wide">
                    🔩 Pernos de Anclaje y Placa Base:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Cant. Pernos:</label>
                      <select
                        value={selectedNode.numPernos || 4}
                        onChange={(e) => engineState?.updateNodeAnchorBolts(selectedNode.id, Number(e.target.value), selectedNode.boltDiameter || '5/8"')}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 font-bold text-xs cursor-pointer focus:border-amber-500 outline-none"
                      >
                        <option value={4}>4 Pernos (Estándar)</option>
                        <option value={6}>6 Pernos (Reforzado)</option>
                        <option value={8}>8 Pernos (Pesado / Alta Carga)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Diámetro:</label>
                      <select
                        value={selectedNode.boltDiameter || '5/8"'}
                        onChange={(e) => engineState?.updateNodeAnchorBolts(selectedNode.id, selectedNode.numPernos || 4, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800 font-bold text-xs cursor-pointer focus:border-amber-500 outline-none"
                      >
                        <option value="1/2'">1/2"</option>
                        <option value="5/8'">5/8"</option>
                        <option value="3/4'">3/4"</option>
                        <option value="M16">M16</option>
                        <option value="M20">M20</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => engineState?.deleteSelectedElements()}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform text-xs"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Eliminar Nodo</span>
                </button>
              </div>
            ) : selectedSegment ? (
              /* PROPIEDADES DE TRAMO / ELEMENTO ESTRUCTURAL */
              <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <span className="font-extrabold text-slate-900 block text-xs">
                      {isColumna ? 'Columna' : isViga ? 'Viga' : 'Tramo'}: {selectedSegment.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Longitud Actual: <strong className="text-slate-800">{lengthM.toFixed(2)} m</strong>
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                    isColumna 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : isViga 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {selectedSegment.rolEstructural.toUpperCase()}
                  </span>
                </div>

                {/* ------------------------------------------------------ */}
                {/* AJUSTAR MEDIDA EXACTA REAL DE VIGA / TRAMO */}
                {/* ------------------------------------------------------ */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-amber-600" />
                      Medida Exacta de Longitud (m)
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-white px-1.5 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Editable
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={exactLengthStr}
                      onFocus={() => setFocusedField('exactLength')}
                      onBlur={() => setFocusedField(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      onChange={(e) => handleApplyExactSegmentLength(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 font-mono font-black text-xs focus:border-amber-600 focus:outline-none shadow-2xs"
                      placeholder="Ej. 6.00"
                    />
                    <span className="text-xs font-bold text-slate-600">m</span>
                  </div>

                  {/* Botones de Presets Rápidos de Medida */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    <span className="text-[10px] text-amber-800 font-bold mr-0.5">Medidas Típicas:</span>
                    {[2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0].map((len) => (
                      <button
                        key={len}
                        onClick={() => handleApplyExactSegmentLength(len.toString())}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          Math.abs(lengthM - len) < 0.05
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-white text-amber-900 hover:bg-amber-100 border-amber-200'
                        }`}
                      >
                        {len}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* ------------------------------------------------------ */}
                {/* CONTROL DE ALTURA DE COLUMNA ESPECÍFICO */}
                {/* ------------------------------------------------------ */}
                {isColumna && baseNode && topNode && (
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                        <Columns className="w-3.5 h-3.5 text-blue-600" />
                        Altura de Columna (m)
                      </span>
                      <span className="text-xs font-mono font-black text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                        {currentHeightM.toFixed(2)} m
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={colHeightEditStr}
                        onFocus={() => setFocusedField('colHeight')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        onChange={(e) => handleUpdateColHeight(e.target.value)}
                        className="w-full bg-white border border-blue-300 rounded-lg p-1.5 text-slate-900 font-mono font-bold text-xs focus:border-blue-600 focus:outline-none shadow-2xs"
                        placeholder="4.50"
                      />
                      <button
                        onClick={() => handleUpdateColHeight((Math.max(1, currentHeightM - 0.5)).toFixed(2))}
                        className="px-2 py-1.5 bg-white hover:bg-blue-100 text-blue-800 rounded-lg font-bold text-xs border border-blue-200 cursor-pointer shadow-2xs shrink-0"
                        title="Reducir 0.5m"
                      >
                        -0.5m
                      </button>
                      <button
                        onClick={() => handleUpdateColHeight((currentHeightM + 0.5).toFixed(2))}
                        className="px-2 py-1.5 bg-white hover:bg-blue-100 text-blue-800 rounded-lg font-bold text-xs border border-blue-200 cursor-pointer shadow-2xs shrink-0"
                        title="Aumentar 0.5m"
                      >
                        +0.5m
                      </button>
                    </div>

                    {/* Presets Rápidos de Altura de Columna */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[10px] text-blue-800 font-bold mr-0.5">Presets:</span>
                      {[3.0, 3.5, 4.0, 4.5, 5.0, 6.0].map((h) => (
                        <button
                          key={h}
                          onClick={() => handleUpdateColHeight(h.toString())}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            Math.abs(currentHeightM - h) < 0.05
                              ? 'bg-blue-600 text-white border-blue-700'
                              : 'bg-white text-blue-900 hover:bg-blue-100 border-blue-200'
                          }`}
                        >
                          {h}m
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-blue-100/80 flex items-center justify-between">
                      <span>Base Y: {baseNode.y.toFixed(2)}m</span>
                      <span>Tope Y: {topNode.y.toFixed(2)}m</span>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------ */}
                {/* CONTROL DE ELEVACIÓN Y APOYO PARA VIGAS */}
                {/* ------------------------------------------------------ */}
                {!isColumna && nodeA && nodeB && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                        <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                        Elevación / Altura sobre el suelo (Y)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        {nodeA.y === nodeB.y ? `Nivel ${nodeA.y.toFixed(2)}m` : `ΔY = ${Math.abs(nodeB.y - nodeA.y).toFixed(2)}m`}
                      </span>
                    </div>

                    {/* Entradas de elevación Y para nodo A y nodo B con strings */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-emerald-800 font-bold mb-0.5">Y Inicio (m):</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={nodeAYEditStr}
                          onFocus={() => setFocusedField('nodeAY')}
                          onBlur={() => setFocusedField(null)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          onChange={(e) => {
                            setNodeAYEditStr(e.target.value);
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && engineState) engineState.updateNodeCoords(nodeA.id, nodeA.x, val, nodeA.z);
                          }}
                          className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-slate-900 font-mono font-bold text-xs focus:border-emerald-600 focus:outline-none shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-emerald-800 font-bold mb-0.5">Y Final (m):</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={nodeBYEditStr}
                          onFocus={() => setFocusedField('nodeBY')}
                          onBlur={() => setFocusedField(null)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          onChange={(e) => {
                            setNodeBYEditStr(e.target.value);
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && engineState) engineState.updateNodeCoords(nodeB.id, nodeB.x, val, nodeB.z);
                          }}
                          className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-slate-900 font-mono font-bold text-xs focus:border-emerald-600 focus:outline-none shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Botones para subir o bajar la viga completa */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-emerald-800 font-bold">Mover Viga:</span>
                      <button
                        onClick={() => handleShiftBeamElevation(-0.5)}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 rounded font-bold text-[10px] border border-emerald-200 cursor-pointer shadow-2xs"
                        title="Bajar 0.5m"
                      >
                        -0.5m
                      </button>
                      <button
                        onClick={() => handleShiftBeamElevation(+0.5)}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 rounded font-bold text-[10px] border border-emerald-200 cursor-pointer shadow-2xs"
                        title="Subir 0.5m"
                      >
                        +0.5m
                      </button>
                      <button
                        onClick={() => handleSetBeamElevation(4.0)}
                        className="px-2 py-0.5 bg-white hover:bg-emerald-100 text-emerald-900 rounded font-bold text-[10px] border border-emerald-200 cursor-pointer shadow-2xs ml-auto"
                        title="Nivelar a 4.0m"
                      >
                        A 4.0m
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Rol Estructural:</label>
                  <select 
                    value={selectedSegment.rolEstructural}
                    onChange={(e) => engineState?.updateSegmentProfile(selectedSegment.id, selectedSegment.profileId, e.target.value as RolEstructuralSegmento)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-bold text-xs focus:border-amber-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="columna">Columna Estructural</option>
                    <option value="viga_principal">Viga Principal</option>
                    <option value="viga_secundaria">Viga Secundaria / Vigueta</option>
                    <option value="cordon_superior">Cordón Superior Tijeral</option>
                    <option value="cordon_inferior">Cordón Inferior Tijeral</option>
                    <option value="montante">Montante Vertical</option>
                    <option value="diagonal">Diagonal Celosía</option>
                    <option value="correa">Correa Longitudinal C/Z</option>
                    <option value="arriostre">Arriostre / Diagonal Cruz</option>
                    <option value="piso_deck">Piso Metal Deck / Mezzanine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">Perfil Asignado:</label>
                  <select 
                    value={selectedSegment.profileId}
                    onChange={(e) => engineState?.updateSegmentProfile(selectedSegment.id, e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-bold text-xs focus:border-amber-500 focus:outline-none cursor-pointer shadow-2xs"
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
                </div>

                <button 
                  onClick={() => engineState?.deleteSelectedElements()}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform text-xs"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Eliminar Tramo</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* PESTAÑA 2: CATÁLOGO Y PERFIL ACTIVO */}
        {activeTab === 'perfiles' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2.5">
              <span className="block font-black text-slate-700 text-[11px] uppercase tracking-wide">
                🎨 Color de Pintura Estructural (Mercado):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {MERCADO_COLORES_PINTURA.map(color => {
                  const isSelected = (engineState?.globalPaintColor || 'blanco') === color.id;
                  return (
                    <button
                      key={color.id}
                      onClick={() => engineState?.setGlobalPaintColor(color.id)}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40 text-slate-900 font-extrabold' 
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs" style={{ backgroundColor: color.hex }} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold truncate">{color.nombre}</div>
                        <div className="text-[9px] text-slate-500">{color.tipoComercial}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
              <span className="block font-black text-slate-700 text-[11px] uppercase tracking-wide">
                Perfil Activo para Nuevos Trazos:
              </span>
              <select 
                value={engineState?.activeProfileId || ''}
                onChange={(e) => engineState?.setActiveProfileId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-bold text-xs outline-none cursor-pointer focus:border-amber-500 shadow-2xs"
              >
                {PERFILES_TECHOS_AGRUPADOS.map(grp => (
                  <optgroup key={grp.norma} label={grp.label} className="font-bold text-slate-800">
                    {grp.items.map(p => (
                      <option key={p.id} value={p.id} className="text-slate-900 font-medium">
                        {p.nombre} ({p.pesoLinealKgM} kg/m)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* PERFILES EN USO EN EL DIBUJO 2D */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
              <span className="block font-black text-slate-700 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Perfiles en uso en el dibujo 2D:
              </span>
              
              {perfilesEnUso.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No hay perfiles trazados en el lienzo aún.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-none pr-1">
                  {perfilesEnUso.map(({ profile, count, totalLength }) => {
                    const pesoTotal = totalLength * profile.pesoLinealKgM;
                    return (
                      <div key={profile.id} className="p-2 bg-white rounded-lg border border-slate-200 text-[10px] flex flex-col gap-1 shadow-2xs">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-slate-800 leading-snug">{profile.nombre}</span>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">
                            {count} {count === 1 ? 'tramo' : 'tramos'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 font-medium">
                          <span>Longitud: <strong>{totalLength.toFixed(2)} m</strong></span>
                          <span>Peso total: <strong>{pesoTotal.toFixed(2)} kg</strong></span>
                        </div>
                        <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-500 font-bold shrink-0">Reemplazar por:</span>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleReplaceProfileUsage(profile.id, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded p-1 text-[9px] font-bold text-slate-800 cursor-pointer outline-none"
                          >
                            <option value="">-- Reemplazar este perfil en todos los tramos --</option>
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: AYUDAS Y GENERADORES DE MODELOS */}
        {activeTab === 'generadores' && (
          <div className="space-y-3">
            {/* BOTÓN PROMINENTE AL TUTORIAL INTERACTIVO */}
            {onOpenTutorial && (
              <div 
                onClick={() => {
                  onOpenTutorial();
                  if (isBottomSheetMobile && onCloseBottomSheetMobile) onCloseBottomSheetMobile();
                }}
                className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-2xl shadow-sm cursor-pointer hover:brightness-105 active:scale-98 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/30 backdrop-blur-xs text-slate-950">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-wide">Tutorial para Principiantes</h4>
                    <p className="text-[10px] text-slate-900/80 font-medium">Guía paso a paso: Parabólico, 2 Aguas, Mezzanine</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-950 shrink-0" />
              </div>
            )}

            {/* Aviso: la generación de techos completos vive ahora SOLO en el
                Asistente, para no duplicarla aquí (evita la redundancia). */}
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 leading-relaxed">
              La generación de <strong>techos completos</strong> (Dos Aguas, Un Agua, Parabólico, Mezzanine) está ahora en el botón <strong>✦ Asistente</strong> de la barra superior, para no tenerla duplicada. Aquí solo quedan las herramientas que el Asistente no cubre.
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <span className="block font-black text-slate-800 text-xs uppercase tracking-wide">
                Tijeral Interno por Profundidad (Z)
              </span>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Tipo de Tijeral / Cercha:</label>
                <select
                  value={selectedTrussGen}
                  onChange={(e) => setSelectedTrussGen(e.target.value as TipoTijeral)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 font-bold text-xs focus:border-amber-500 focus:outline-none shadow-2xs cursor-pointer"
                >
                  <option value="warren">Warren (Zig-Zag continuo)</option>
                  <option value="pratt">Pratt (Montantes verticales y diagonales al centro)</option>
                  <option value="howe">Howe (Montantes verticales y diagonales a apoyos)</option>
                  <option value="fink">Fink (Celosía clásica para 2 Aguas)</option>
                  <option value="parabolico_warren">Parabólico Warren (Curvo)</option>
                  <option value="parabolico_pratt">Parabólico Pratt (Curvo)</option>
                  <option value="parabolico_bowstring">Parabólico Bowstring (Tirante recto)</option>
                  <option value="plano_viga">Viga Celosía de Alma Abierta (Joist)</option>
                  <option value="simple_arco">Arco Monotubo Simple</option>
                </select>
              </div>

              {/* SECCIÓN DEDICADA: TIJERALES POR DENTRO Y TUBOS DE TEJIDO */}
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Tijerales por Dentro y Tejido
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full">
                    Posición Arbitraria
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Coloca tijerales estructurales por dentro en cualquier posición Z con tubos de tejido (cordones, montantes y diagonales) para evitar pandeo o caída del aluzinc.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-32">
                      <label className="block text-[10px] text-slate-700 font-bold mb-0.5">Posición Z (m):</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={posicionZTijeralStr}
                        onChange={(e) => setPosicionZTijeralStr(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-900 font-mono font-bold text-xs focus:border-amber-500 focus:outline-none shadow-2xs"
                        placeholder="5.0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Accesos Rápidos:</label>
                      <div className="flex flex-wrap gap-1">
                        {[2.5, 5.0, 7.5, 10.0, 15.0].map((pz) => (
                          <button
                            key={pz}
                            type="button"
                            onClick={() => setPosicionZTijeralStr(pz.toString())}
                            className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            {pz}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const z = parseFloat(posicionZTijeralStr) || 5.0;
                      engineState?.addInternalTruss(z, selectedTrussGen);
                      if (isBottomSheetMobile && onCloseBottomSheetMobile) onCloseBottomSheetMobile();
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    + Insertar Tijeral por Dentro en Z = {posicionZTijeralStr}m
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropiedadesCad;
