// Módulo Exclusivo para Techos Metálicos, Mezzanine y Cubiertas Estructurales - Innova Contratistas
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, 
  Save, 
  Download, 
  HelpCircle, 
  Layers, 
  Scissors, 
  Package, 
  DollarSign, 
  FileText,
  Compass,
  Plus,
  Activity,
  CheckCircle2,
  FolderOpen,
  X,
  Trash2,
  Sparkles,
  UploadCloud,
  Sliders,
  ClipboardList,
  Box,
  HardDrive,
  Briefcase,
  RefreshCw,
  Search,
  Users,
  MoreVertical
} from 'lucide-react';

import useTechosDimensions from './useTechosDimensions';
import CadToolbox from './CadToolbox';
import CanvasArea from './CanvasArea';
import PropiedadesCad from './PropiedadesCad';
import { useTechosCadEngineState } from './useTechosCadEngineState';
import { TechosDespieceView } from './TechosDespieceView';
import { TechosMaterialesView } from './TechosMaterialesView';
import { TechosCostosView } from './TechosCostosView';
import { TechosPresupuestoView } from './TechosPresupuestoView';
import { TechosPlanoCadView } from './TechosPlanoCadView';
import { TechosEstructuralAnalysisView } from './TechosEstructuralAnalysisView';
import { TechosErrorBoundary } from './TechosErrorBoundary';
import { TechosTutorialModal } from './TechosTutorialModal';
import { TechosInteractiveTutorial } from './TechosInteractiveTutorial';
import { VistaTechoCAD } from './TechosCanvas2D';
import { CadFileUploadModal, CadImportResult } from '../common/CadFileUploadModal';
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS } from './techosCadCatalog';
import { zonasDesdeCorreas } from './coberturaAuto';
import { safeStorage } from '../../lib/storageManager';
import { 
  SavedTechosDesign, 
  fetchAllTechosDesigns, 
  getCachedTechosDesigns, 
  saveOrUpdateTechosDesign, 
  deleteTechosDesign, 
  popActiveTechosDesignToLoad 
} from '../../lib/techosDesignsRepo';

interface ProjectOption {
  id: string;
  name: string;
  client: string;
  presupuesto: number;
}

interface ClientOption {
  id: string;
  name: string;
  company?: string;
}

interface TechosModuleViewProps {
  projects?: ProjectOption[];
  clients?: ClientOption[];
  onSaveToProject?: (projectId: string, projectData: any) => void;
  onCreateProject?: (newProject: any) => void;
  onNavigateToProjects?: () => void;
  currentSettings?: any;
  isAdmin?: boolean;
  currentUserName?: string;
}

export type TechosTab = 'cad' | 'despiece' | 'materiales' | 'costos' | 'presupuesto' | 'plano' | 'estructural' | 'resumen';

// ==========================================================
// NUEVA SECCIÓN DE AUDITORÍA Y REVISIÓN DE COMPONENTES 2D/3D
// ==========================================================
export function TechosResumenGeneralPanel({ engineState, nombreProyecto }: { engineState: any; nombreProyecto: string }) {
  const nodes = engineState?.nodes || {};
  const segments = engineState?.segments || {};
  const coverageZones = engineState?.coverageZones || {};

  const nodeList = Object.values(nodes);
  const segmentList = Object.values(segments);
  const zoneList = Object.values(coverageZones);

  // Calcular estadísticas de perfiles en tiempo real
  const profileStats = React.useMemo(() => {
    const stats: Record<string, { profile: any; count: number; totalLength: number; totalWeight: number; totalCost: number }> = {};
    
    segmentList.forEach((seg: any) => {
      // Las columnas de concreto NO son acero: se metran como concreto aparte.
      if (seg.rolEstructural === 'columna_concreto') return;
      const pId = seg.profileId || 'perfil_sq_2x2_15';
      const profile = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === pId) || INVENTARIO_PERFILES_TUBULARES[0];

      const nodeA = nodes[seg.nodeAId];
      const nodeB = nodes[seg.nodeBId];
      let length = 0;
      if (nodeA && nodeB) {
        length = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y, (nodeB.z || 0) - (nodeA.z || 0));
      }

      if (!stats[pId]) {
        stats[pId] = {
          profile,
          count: 0,
          totalLength: 0,
          totalWeight: 0,
          totalCost: 0
        };
      }

      stats[pId].count += 1;
      stats[pId].totalLength += length;
      stats[pId].totalWeight += length * profile.pesoLinealKgM;
      stats[pId].totalCost += length * profile.costoMetroSol;
    });

    return Object.values(stats).sort((a, b) => b.totalLength - a.totalLength);
  }, [segments, nodes, segmentList]);

  // Métricas de cobertura
  const totalCoveredArea = React.useMemo(() => {
    let area = 0;
    zoneList.forEach((zone: any) => {
      area += zone.areaM2 || 0;
    });
    // Fallback si no hay zonas definidas pero sí hay tramos dibujados
    if (area === 0 && segmentList.length > 0) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      nodeList.forEach((node: any) => {
        if (node.x < minX) minX = node.x;
        if (node.x > maxX) maxX = node.x;
        if (node.y < minY) minY = node.y;
        if (node.y > maxY) maxY = node.y;
      });
      if (maxX > minX && maxY > minY) {
        area = (maxX - minX) * (maxY - minY);
      }
    }
    return area;
  }, [coverageZones, segments, nodes, nodeList, segmentList, zoneList]);

  // Estimación de coberturas y planchas
  const calaminaType = INVENTARIO_COBERTURAS[0] || { nombre: 'Calamina Aluzinc TR4 0.40mm', costoM2Sol: 28 };
  const numPlanchasEstimado = Math.ceil(totalCoveredArea / 3.5);

  const totalStructuralWeight = profileStats.reduce((sum, item) => sum + item.totalWeight, 0);
  const totalStructuralCost = profileStats.reduce((sum, item) => sum + item.totalCost, 0);

  // METRADO DE CONCRETO: columnas marcadas como concreto (rol 'columna_concreto').
  // Volumen = longitud × sección (asumida 25×25 cm). Materiales aproximados por
  // m³ de concreto f'c=210 (dosificación referencial 1:2:3).
  const concretoMetrado = React.useMemo(() => {
    const seccionM = 0.25; // 25 cm × 25 cm
    let columnas = 0;
    let longitudTotalM = 0;
    segmentList.forEach((seg: any) => {
      if (seg.rolEstructural !== 'columna_concreto') return;
      const a = nodes[seg.nodeAId];
      const b = nodes[seg.nodeBId];
      if (!a || !b) return;
      longitudTotalM += Math.hypot(b.x - a.x, b.y - a.y, (b.z || 0) - (a.z || 0));
      columnas += 1;
    });
    const volumenM3 = longitudTotalM * seccionM * seccionM;
    return {
      columnas,
      longitudTotalM,
      volumenM3,
      seccionCm: 25,
      // Dosificación referencial f'c=210 kg/cm² por m³
      cementoBolsas: volumenM3 * 9.5,
      arenaM3: volumenM3 * 0.54,
      piedraM3: volumenM3 * 0.55,
      aguaL: volumenM3 * 180
    };
  }, [segmentList, nodes]);

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      
      {/* Cabecera del Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">Panel de Auditoría de Componentes y Metrados</h2>
            <p className="text-xs text-slate-500">Revisión consolidada y metrados de perfiles 2D/3D, nodos, coberturas y herrajes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
            Proyecto Activo: <strong className="text-slate-800 font-extrabold">{nombreProyecto}</strong>
          </span>
        </div>
      </div>

      {/* Tarjetas de Resumen Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-lg shrink-0">
            {nodeList.length}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Nodos Totales</p>
            <p className="text-sm font-bold text-slate-800">Conexiones & Columnas</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-lg shrink-0">
            {segmentList.length}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Tramos Dibujados</p>
            <p className="text-sm font-bold text-slate-800">Vigas, Correas y Arriostres</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-lg shrink-0">
            {totalStructuralWeight.toFixed(1)} <span className="text-xs">kg</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Peso de Estructura</p>
            <p className="text-sm font-bold text-slate-800">Peso Total Acero</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold text-lg shrink-0">
            {totalCoveredArea.toFixed(1)} <span className="text-xs">m²</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase">Área de Cobertura</p>
            <p className="text-sm font-bold text-slate-800">Techo Proyectado</p>
          </div>
        </div>
      </div>

      {/* METRADO DE CONCRETO (solo si hay columnas de concreto) */}
      {concretoMetrado.columnas > 0 && (
        <div className="bg-white border border-stone-300 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-200 bg-stone-100/70 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-500 text-white flex items-center justify-center font-black text-sm shrink-0">
              {concretoMetrado.columnas}
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-800 uppercase">Metrado de Concreto</h3>
              <p className="text-[11px] text-stone-500">
                {concretoMetrado.columnas} columnas de concreto · sección {concretoMetrado.seccionCm}×{concretoMetrado.seccionCm} cm · {concretoMetrado.longitudTotalM.toFixed(2)} m lineales
              </p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-stone-800">{concretoMetrado.volumenM3.toFixed(2)}</p>
              <p className="text-[10px] font-bold text-stone-500 uppercase">m³ Concreto</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-stone-800">{Math.ceil(concretoMetrado.cementoBolsas)}</p>
              <p className="text-[10px] font-bold text-stone-500 uppercase">Bolsas cemento</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-stone-800">{concretoMetrado.arenaM3.toFixed(2)}</p>
              <p className="text-[10px] font-bold text-stone-500 uppercase">m³ Arena</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-stone-800">{concretoMetrado.piedraM3.toFixed(2)}</p>
              <p className="text-[10px] font-bold text-stone-500 uppercase">m³ Piedra</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-lg font-black text-stone-800">{Math.round(concretoMetrado.aguaL)}</p>
              <p className="text-[10px] font-bold text-stone-500 uppercase">Litros agua</p>
            </div>
          </div>
          <p className="px-4 pb-3 text-[10px] text-stone-400 leading-snug">
            Estimado referencial para concreto f'c=210 kg/cm² (dosificación 1:2:3). Sección asumida {concretoMetrado.seccionCm}×{concretoMetrado.seccionCm} cm. No incluye acero de refuerzo ni encofrado.
          </p>
        </div>
      )}

      {/* Grid de Tablas de Inspección */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna 1 & 2: Perfiles y Coberturas en Uso */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TABLA DE PERFILES EN USO */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-600" />
                1. Perfilería Estructural Consolidada (2D/3D)
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                {profileStats.length} Modelos de Perfil
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {profileStats.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  No hay perfiles trazados en el lienzo CAD.
                </div>
              ) : (
                profileStats.map(({ profile, count, totalLength, totalWeight, totalCost }) => (
                  <div key={profile.id} className="p-4 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{profile.nombre}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Categoría: <span className="capitalize">{profile.categoria.replace('_', ' ')}</span> | Código: <strong className="font-mono">{profile.codigoComercial}</strong>
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                        <span>Cant. Tramos: <strong className="text-slate-800">{count}</strong></span>
                        <span>Longitud Total: <strong className="text-slate-800">{totalLength.toFixed(2)} m</strong></span>
                        <span>Peso: <strong className="text-slate-800">{totalWeight.toFixed(1)} kg</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-black text-slate-700">
                        S/. {totalCost.toFixed(2)}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">S/. {(profile.costoMetroSol).toFixed(2)}/m</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {profileStats.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Total Perfilería:</span>
                <span className="font-mono font-black text-amber-700 text-sm">S/. {totalStructuralCost.toFixed(2)} Soles</span>
              </div>
            )}
          </div>

          {/* TABLA DE COBERTURAS Y FIJACIONES */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                2. Planchas de Cobertura y Consumibles Proyectados
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="block font-black text-slate-400 text-[9px] uppercase">Material de Cubierta</span>
                  <p className="font-bold text-slate-800">{calaminaType.nombre}</p>
                  <p className="text-[10px] text-slate-500">Costo aproximado: <strong>S/. {calaminaType.costoM2Sol} por m²</strong></p>
                  <div className="pt-2 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Cant. Requerida Estimada:</span>
                    <strong className="text-blue-700 font-mono font-black">{numPlanchasEstimado} planchas</strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="block font-black text-slate-400 text-[9px] uppercase">Accesorios y Fijaciones</span>
                  <p className="font-bold text-slate-800">Pernos Autoperforantes EPDM</p>
                  <p className="text-[10px] text-slate-500">Fijación de alta hermeticidad de 2"</p>
                  <div className="pt-2 flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Cant. Pernos Estimada:</span>
                    <strong className="text-blue-700 font-mono font-black">{Math.ceil(totalCoveredArea * 4.5)} unids</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 text-blue-800 rounded-xl border border-blue-200 text-[10px] leading-relaxed">
                ℹ️ <strong>Nota de Metrado Techo:</strong> La estimación de calamina asume planchas de 1.10m x 3.60m considerando traslape lateral de un canal y traslape longitudinal de 15cm. Ajustar según cortes en obra.
              </div>
            </div>
          </div>

        </div>

        {/* Columna 3: Auditoría de Nodos / Coordenadas de Dibujo */}
        <div className="space-y-6">
          
          {/* MATRIX DE NODOS */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col max-h-[500px]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                3. Matriz de Nodos / Coordenadas 3D
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-none">
              {nodeList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic">
                  No hay nodos trazados.
                </div>
              ) : (
                nodeList.map((node: any, idx) => (
                  <div key={node.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-mono text-[9px] font-black">
                        N{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 text-[11px] font-mono">{node.id}</span>
                        {node.isColumna && <span className="ml-2 bg-purple-100 text-purple-800 text-[8px] font-black px-1 rounded-full">Columna</span>}
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      X: <strong className="text-slate-800">{node.x.toFixed(2)}</strong> | Y: <strong className="text-slate-800">{node.y.toFixed(2)}</strong> | Z: <strong className="text-slate-800">{(node.z || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PARÁMETROS GENERALES */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-slate-500" />
              Parámetros de Diseño Activos
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Normativa de Diseño:</span>
                <strong className="text-slate-800 font-bold">RNE E.090 Metálicas</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Carga Viva de Techo:</span>
                <strong className="text-slate-800 font-bold">0.30 kN/m² (RNE E.020)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sobrecarga de Viento:</span>
                <strong className="text-slate-800 font-bold">75 km/h (Costa Peruana)</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export const TechosModuleViewContent: React.FC<TechosModuleViewProps> = ({
  projects = [],
  clients = [],
  onSaveToProject,
  onCreateProject,
  onNavigateToProjects,
  currentSettings,
  isAdmin = false,
  currentUserName = 'Usuario'
}) => {
  const { isMobile, isDesktop } = useTechosDimensions();

  // Estado Central del Motor CAD Paramétrico (PROJECT_MODEL)
  const engineState = useTechosCadEngineState();

  const [nombreProyecto, setNombreProyecto] = useState<string>(() => safeStorage.getItem<string>('innova_techos_nombre_actual', 'Nave Industrial Estructural') || 'Nave Industrial Estructural');
  useEffect(() => { safeStorage.setItem('innova_techos_nombre_actual', nombreProyecto); }, [nombreProyecto]);
  const [activeTab, setActiveTab] = useState<TechosTab>('cad');
  const [isOpenMobileToolbox, setIsOpenMobileToolbox] = useState<boolean>(false);
  const [isOpenMobileProperties, setIsOpenMobileProperties] = useState<boolean>(false);
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);
  const [savedNotificationMsg, setSavedNotificationMsg] = useState<string>('¡Diseño guardado exitosamente!');
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showInteractiveTutorial, setShowInteractiveTutorial] = useState<boolean>(false);
  const [activeCadVista, setActiveCadVista] = useState<VistaTechoCAD>('planta');
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showMobileActions, setShowMobileActions] = useState<boolean>(false);
  // La barra tiene overflow-x-auto, que recortaría un menú absoluto: se ubica fijo bajo el botón.
  const [mobileActionsPos, setMobileActionsPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [savedDesignsList, setSavedDesignsList] = useState<SavedTechosDesign[]>([]);
  const [showInspector, setShowInspector] = useState<boolean>(true);

  // States for Smart Save and Client Portfolio
  const [currentEditingDesignId, setCurrentEditingDesignId] = useState<string | null>(() => safeStorage.getItem<string | null>('innova_techos_diseno_actual', null));
  useEffect(() => { safeStorage.setItem('innova_techos_diseno_actual', currentEditingDesignId); }, [currentEditingDesignId]);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveModalNombre, setSaveModalNombre] = useState<string>('Nave Industrial Estructural');
  const [saveModalClientId, setSaveModalClientId] = useState<string>('');
  const [saveModalProjectId, setSaveModalProjectId] = useState<string>('');
  const [saveModalOverwrite, setSaveModalOverwrite] = useState<boolean>(true);
  const [isSavingInProgress, setIsSavingInProgress] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false); // ✓ breve en el botón Guardar
  const [repoSearchTerm, setRepoSearchTerm] = useState<string>('');
  const [repoFilterClient, setRepoFilterClient] = useState<string>('todos');

  // Cargar lista de guardados al abrir modal y al montar
  const loadSavedList = async () => {
    try {
      const list = await fetchAllTechosDesigns();
      setSavedDesignsList(list);
    } catch {
      setSavedDesignsList(getCachedTechosDesigns());
    }
  };

  useEffect(() => {
    // Check if an external action requested loading a specific design (e.g. from Client Portfolio)
    const pending = popActiveTechosDesignToLoad();
    if (pending && pending.nodes && pending.segments) {
      engineState.loadScene(pending.nodes, pending.segments, pending.coverageZones || {});
      setNombreProyecto(pending.nombre || 'Techo Estructural');
      setCurrentEditingDesignId(pending.id);
      if (pending.clientId) setSaveModalClientId(pending.clientId);
      if (pending.projectId) setSaveModalProjectId(pending.projectId);
      setSavedNotificationMsg(`✓ Plano 3D cargado: "${pending.nombre}" (${pending.clientName || 'Cliente'})`);
      setShowSavedNotification(true);
      setTimeout(() => setShowSavedNotification(false), 3500);
    }
    loadSavedList();
  }, []);

  // Botón [ + NUEVO DISEÑO ] -> Vacía el lienzo por completo
  const handleNuevo = () => {
    engineState.clearScene();
    setNombreProyecto('Nuevo Techo Estructural');
    setCurrentEditingDesignId(null);
    setSaveModalClientId('');
    setSaveModalProjectId('');
  };

  // Importar archivo AutoCAD DXF
  const handleImportDxf = (result: CadImportResult) => {
    if (result.dxfModel) {
      engineState.importDxfModel(result.dxfModel, result.customScale);
      setNombreProyecto(result.fileName.replace(/\.dxf$/i, ''));
      setCurrentEditingDesignId(null);
      setSavedNotificationMsg('¡Archivo DXF importado con éxito!');
      setShowSavedNotification(true);
      setTimeout(() => setShowSavedNotification(false), 2500);
    }
  };

  // Importar archivo JSON
  const handleImportJson = (jsonData: any, fileName: string) => {
    if (jsonData && jsonData.nodes && jsonData.segments) {
      engineState.loadScene(jsonData.nodes, jsonData.segments, jsonData.coverageZones || {});
      setNombreProyecto(jsonData.nombre || fileName.replace(/\.json$/i, ''));
      setCurrentEditingDesignId(null);
      setSavedNotificationMsg('¡Archivo CAD JSON importado con éxito!');
      setShowSavedNotification(true);
      setTimeout(() => setShowSavedNotification(false), 2500);
    }
  };

  const handleExportDxf = () => {
    const dxfString = engineState.exportDxf(nombreProyecto);
    const dataStr = "data:application/dxf;charset=utf-8," + encodeURIComponent(dxfString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${nombreProyecto.toLowerCase().replace(/\s+/g, '_')}.dxf`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    if (downloadAnchor && downloadAnchor.parentNode) {
      try {
        downloadAnchor.parentNode.removeChild(downloadAnchor);
      } catch (_e) {
        // ignore
      }
    }
  };

  // Abrir modal de guardado inteligente
  const handleGuardar = () => {
    // GUARDADO RÁPIDO: si el plano ya existe (ya se guardó antes) y tiene nombre,
    // se actualiza directo en un toque, sin reabrir el modal. Para un plano nuevo
    // (o sin nombre) sí abrimos el modal para nombrarlo y asignar cliente/proyecto.
    if (currentEditingDesignId && nombreProyecto.trim() && !isSavingInProgress) {
      handleQuickSave();
    } else {
      setSaveModalNombre(nombreProyecto);
      setSaveModalOverwrite(!!currentEditingDesignId);
      setShowSaveModal(true);
    }
  };

  // Actualiza el plano actual sin abrir el modal (usa el cliente/proyecto ya asignados).
  const handleQuickSave = async () => {
    if (!currentEditingDesignId || isSavingInProgress) return;
    setIsSavingInProgress(true);
    try {
      const selectedClient = clients.find(c => c.id === saveModalClientId);
      const selectedProject = projects.find(p => p.id === saveModalProjectId);
      const res = await saveOrUpdateTechosDesign(
        {
          id: currentEditingDesignId,
          nombre: nombreProyecto.trim(),
          authorName: currentUserName,
          authorRole: isAdmin ? 'Administrador' : 'Colaborador',
          clientId: selectedClient?.id,
          clientName: selectedClient?.name,
          projectId: selectedProject?.id,
          projectName: selectedProject?.name,
          nodes: engineState.nodes,
          segments: engineState.segments,
          coverageZones: engineState.coverageZones,
        },
        true
      );
      setCurrentEditingDesignId(res.design.id);
      setSavedNotificationMsg('✓ Cambios guardados');
      setShowSavedNotification(true);
      setJustSaved(true);
      setTimeout(() => setShowSavedNotification(false), 2200);
      setTimeout(() => setJustSaved(false), 2200);
      loadSavedList();
    } catch (err: any) {
      console.error('Error en guardado rápido:', err);
      // Si falla el guardado rápido, caemos al modal para que el usuario reintente.
      setSaveModalNombre(nombreProyecto);
      setSaveModalOverwrite(true);
      setShowSaveModal(true);
    } finally {
      setIsSavingInProgress(false);
    }
  };

  // Confirmar guardado (con opción de actualizar o nueva versión y asignación a cliente)
  const handleConfirmSave = async () => {
    if (!saveModalNombre.trim()) return;
    setIsSavingInProgress(true);
    try {
      const selectedClient = clients.find(c => c.id === saveModalClientId);
      const selectedProject = projects.find(p => p.id === saveModalProjectId);

      const res = await saveOrUpdateTechosDesign(
        {
          id: saveModalOverwrite && currentEditingDesignId ? currentEditingDesignId : undefined,
          nombre: saveModalNombre.trim(),
          authorName: currentUserName,
          authorRole: isAdmin ? 'Administrador' : 'Colaborador',
          clientId: selectedClient?.id,
          clientName: selectedClient?.name,
          projectId: selectedProject?.id,
          projectName: selectedProject?.name,
          nodes: engineState.nodes,
          segments: engineState.segments,
          coverageZones: engineState.coverageZones,
        },
        saveModalOverwrite
      );

      setCurrentEditingDesignId(res.design.id);
      setNombreProyecto(res.design.nombre);
      setShowSaveModal(false);
      setSavedNotificationMsg(
        res.isNew 
          ? `✓ Nuevo plano guardado en la nube y asignado a ${selectedClient?.name || 'la empresa'}`
          : `✓ Plano actualizado exitosamente sin duplicados`
      );
      setShowSavedNotification(true);
      setJustSaved(true);
      setTimeout(() => setShowSavedNotification(false), 3000);
      setTimeout(() => setJustSaved(false), 2200);
      loadSavedList();
    } catch (err: any) {
      console.error('Error guardando plano:', err);
    } finally {
      setIsSavingInProgress(false);
    }
  };

  // Botón [ EXPORTAR JSON ]
  const handleExportar = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      nombre: nombreProyecto,
      nodes: engineState.nodes,
      segments: engineState.segments,
      coverageZones: engineState.coverageZones,
      bomReport: engineState.bomReport
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${nombreProyecto.toLowerCase().replace(/\s+/g, '_')}_cad.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    if (downloadAnchor && downloadAnchor.parentNode) {
      try {
        downloadAnchor.parentNode.removeChild(downloadAnchor);
      } catch (_e) {
        // ignore
      }
    }
  };

  // PUENTE TECHOS → CONCRETO (Etapa A): toma las posiciones de las columnas del
  // esqueleto metálico y genera columnas + zapatas en el CAD de Concreto para
  // diseñar la cimentación que soporta la nave. Se comunican por localStorage.
  const handleEnviarAConcreto = () => {
    const nodes: any = engineState.nodes;
    const segs: any = engineState.segments;
    const bases = new Map<string, { x: number; z: number; H: number }>();
    Object.values(segs).forEach((s: any) => {
      if (s.rolEstructural === 'columna' || s.rolEstructural === 'columna_concreto') {
        const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
        if (!a || !b) return;
        const base = a.y <= b.y ? a : b;
        const top = a.y <= b.y ? b : a;
        const key = `${Math.round(base.x * 100)}_${Math.round((base.z || 0) * 100)}`;
        const H = Math.max(0.3, Math.round(Math.abs(top.y - base.y) * 100) / 100);
        if (!bases.has(key)) bases.set(key, { x: base.x, z: base.z || 0, H });
      }
    });
    if (bases.size === 0) {
      alert('No se encontraron columnas en el diseño de techo para enviar a Concreto.');
      return;
    }
    const prev = (safeStorage.getItem<any[]>('concreto_plano_elems', []) || []);
    if (!window.confirm(`Se enviarán ${bases.size} columnas (con sus zapatas) al CAD de Concreto para diseñar la cimentación.${prev.length ? ' Se agregarán a lo que ya tengas ahí.' : ''}\n\n¿Continuar?`)) return;
    const nuevos: any[] = [];
    let i = 0;
    const pts: { x: number; z: number }[] = [];
    bases.forEach(({ x, z, H }) => {
      const stamp = `tc_${Date.now()}_${i++}`;
      nuevos.push({ uid: `${stamp}_z`, tipo: 'zapata', x1: x, y1: z, a: 1.0, b: 1.0, h: 0.5 });
      nuevos.push({ uid: `${stamp}_c`, tipo: 'columna', x1: x, y1: z, a: 0.25, b: 0.25, H });
      pts.push({ x, z });
    });
    // Vigas de cimentación entre columnas alineadas y adyacentes (grilla).
    const R = (v: number) => Math.round(v * 100) / 100;
    const byX = new Map<number, { x: number; z: number }[]>();
    const byZ = new Map<number, { x: number; z: number }[]>();
    pts.forEach(pt => {
      const kx = R(pt.x), kz = R(pt.z);
      if (!byX.has(kx)) byX.set(kx, []);
      byX.get(kx)!.push(pt);
      if (!byZ.has(kz)) byZ.set(kz, []);
      byZ.get(kz)!.push(pt);
    });
    let vi = 0;
    const addViga = (a: { x: number; z: number }, b: { x: number; z: number }) => {
      nuevos.push({ uid: `tv_${Date.now()}_${vi++}`, tipo: 'viga', x1: a.x, y1: a.z, x2: b.x, y2: b.z, a: 0.25, h: 0.40 });
    };
    byX.forEach(arr => { arr.sort((a, b) => a.z - b.z); for (let k = 1; k < arr.length; k++) addViga(arr[k - 1], arr[k]); });
    byZ.forEach(arr => { arr.sort((a, b) => a.x - b.x); for (let k = 1; k < arr.length; k++) addViga(arr[k - 1], arr[k]); });
    const nVigas = nuevos.filter(n => n.tipo === 'viga').length;

    // Muros de ladrillo en el perímetro (entre columnas exteriores contiguas).
    let nMuros = 0;
    if (pts.length >= 2 && window.confirm('¿Crear también muros de ladrillo en el perímetro (entre las columnas exteriores)?\n\nLuego puedes cambiarlos a drywall, borrarlos o ajustar su alto en el Plano CAD.')) {
      const xs = pts.map(p => R(p.x)), zs = pts.map(p => R(p.z));
      const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
      const niveles = safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Cimentación', 'Piso 1'];
      const piso = niveles.find(n => !/cimentaci/i.test(n)) || 'Piso 1';
      const altoMuro = Math.min(3, Math.max(2.2, Math.max(...Array.from(bases.values()).map(b => b.H))));
      const addMuro = (a: { x: number; z: number }, b: { x: number; z: number }) => {
        nuevos.push({ uid: `tm_${Date.now()}_${nMuros++}`, tipo: 'muro', x1: a.x, y1: a.z, x2: b.x, y2: b.z, a: 0.15, H: altoMuro, nivel: piso, material: 'ladrillo', materialId: 'ladrillo_kingkong_18' });
      };
      const tramos = (arr: { x: number; z: number }[], key: 'x' | 'z') => {
        const o = [...arr].sort((p, q) => p[key] - q[key]);
        for (let k = 1; k < o.length; k++) addMuro(o[k - 1], o[k]);
      };
      byX.forEach((arr, kx) => { if (kx === minX || kx === maxX) tramos(arr, 'z'); });
      byZ.forEach((arr, kz) => { if (kz === minZ || kz === maxZ) tramos(arr, 'x'); });
    }

    safeStorage.setItem('concreto_plano_elems', [...prev, ...nuevos]);
    alert(`✓ Enviado a Concreto: ${bases.size} columnas + zapatas + ${nVigas} vigas de cimentación${nMuros ? ` + ${nMuros} muros de ladrillo en el perímetro` : ''}.\n\nAbre "Obra Civil" → modo "Plano CAD". Con la herramienta "Muro" puedes dibujar más muros de ladrillo o drywall por piso.`);
  };

  // PUENTE TECHOS → OBRA POR PISOS: guarda un resumen del presupuesto del techo
  // para que Concreto lo asigne a un piso (Piso 1, Piso 2, azotea…).
  const handleEnviarAObraPisos = () => {
    const bom: any = engineState.bomReport;
    const pesoAceroKg = (bom?.despiecePerfiles || []).reduce((a: number, p: any) => a + (p.totalPesoAceroKg || 0), 0);
    if (!bom || pesoAceroKg <= 0) {
      alert('El diseño no tiene perfiles todavía. Dibuja o carga un techo antes de enviarlo a la obra.');
      return;
    }
    const areaCoberturaM2 = (bom.resumenCoberturas || []).reduce((a: number, c: any) => a + (c.areaRealSuperficieM2 || 0), 0);
    const lib = safeStorage.getItem<any[]>('obra_techos_disponibles', []) || [];
    const nombre = nombreProyecto.trim() || 'Techo metálico';
    const snap = {
      id: `techo_${Date.now()}`,
      nombre,
      fecha: new Date().toLocaleDateString('es-PE'),
      pesoAceroKg,
      areaCoberturaM2,
      costoDirectoSoles: bom.costoDirectoTotalSoles || 0,
      precioVentaSoles: bom.precioVentaFinalSoles || 0,
    };
    safeStorage.setItem('obra_techos_disponibles', [...lib, snap]);
    alert(`✓ "${nombre}" enviado a la obra.\n\nAbre "Obra Civil", elige el piso y en "Techo / estructura metálica en este piso" vincúlalo.`);
  };

  // Plantillas: al terminar de generarse, se cubren solas con Aluzinc TR-4
  // sobre las correas (el material se cambia en ⋯ Más → Cobertura).
  const coberturaAutoPendiente = React.useRef(false);
  useEffect(() => {
    if (!coberturaAutoPendiente.current || !engineState) return;
    const segs = engineState.segments || {};
    if (!Object.keys(segs).length) return;
    coberturaAutoPendiente.current = false;
    if (Object.keys(engineState.coverageZones || {}).length) return;
    const zonas = zonasDesdeCorreas(engineState.nodes, segs, 'cob_aluzinc_030');
    if (Object.keys(zonas).length) engineState.loadScene(engineState.nodes, segs, zonas);
  }, [engineState?.segments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar Plantilla Prediseñada
  const handleCargarPlantilla = (tipo: 'dos_aguas' | 'parabolico' | 'un_agua' | 'mezzanine' | 'marquesina' | 'multinivel' | 'tijeral_curvo') => {
    engineState.clearScene();
    coberturaAutoPendiente.current = true;
    if (tipo === 'dos_aguas') {
      engineState.generateRoofGable(12, 20, 5, 15);
      setNombreProyecto('Nave Industrial 2 Aguas 12x20m');
    } else if (tipo === 'parabolico') {
      engineState.generateRoofParabolic(15, 25, 6, 2.5);
      setNombreProyecto('Almacén Parabólico 15x25m');
    } else if (tipo === 'un_agua') {
      engineState.generateRoofMonoslope(8, 12, 3.5, 4.5);
      setNombreProyecto('Cobertura Un Agua 8x12m');
    } else if (tipo === 'mezzanine') {
      engineState.generateMezzanine(15, 10, 3.2, 3, 4);
      setNombreProyecto('Mezzanine Industrial 10x15m');
    } else if (tipo === 'marquesina') {
      engineState.generateRoofMarquesina(8, 16, 3.2, 1.2, 5);
      setNombreProyecto('Marquesina Curva 8x16m');
    } else if (tipo === 'multinivel') {
      engineState.generateMultinivel(8, 10, 2, 3.0, 2, 2);
      setNombreProyecto('Edificación Metálica 2 Pisos 8x10m');
    } else if (tipo === 'tijeral_curvo') {
      engineState.generateRoofTijeralCurvo(10, 20, 4, undefined, undefined, 5);
      setNombreProyecto('Tijeral 2 Aguas Cordón Curvo 10x20m');
    }
    setShowLoadModal(false);
  };

  // Cargar Diseño Guardado
  const handleCargarDisenoGuardado = (saved: SavedTechosDesign) => {
    if (saved.nodes && saved.segments) {
      engineState.loadScene(saved.nodes, saved.segments, saved.coverageZones || {});
    } else {
      engineState.clearScene();
    }
    setNombreProyecto(saved.nombre);
    setCurrentEditingDesignId(saved.id);
    if (saved.clientId) setSaveModalClientId(saved.clientId);
    if (saved.projectId) setSaveModalProjectId(saved.projectId);
    setShowLoadModal(false);
    setSavedNotificationMsg(`✓ Plano cargado: "${saved.nombre}"`);
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 2500);
  };

  // Eliminar Guardado
  const handleEliminarGuardado = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar este plano del repositorio de la nube?')) {
      await deleteTechosDesign(id);
      const updated = savedDesignsList.filter(d => d.id !== id);
      setSavedDesignsList(updated);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 text-slate-800 overflow-hidden font-sans select-none relative notranslate" translate="no">
      
      {/* NOTIFICACIÓN FLOTANTE DE GUARDADO */}
      {showSavedNotification && (
        <div className="absolute top-14 right-4 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotificationMsg}</span>
        </div>
      )}

      {/* 1. CABECERA PRINCIPAL UNIFICADA (ESTILO HERRERÍA) */}
      <header className="w-full bg-white border-b border-slate-200 px-2.5 sm:px-5 py-1.5 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 z-20 shadow-xs">
        
        {/* Título e Identificación de Módulo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-sm shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-base font-extrabold text-slate-900 tracking-wide truncate">
                TECHOS METÁLICOS
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-mono font-bold border border-amber-200">
                CAD RNE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span className="hidden sm:inline">Proyecto:</span>
              <input
                type="text"
                value={nombreProyecto}
                onChange={e => setNombreProyecto(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded px-1.5 py-0.2 text-slate-800 font-medium text-[11px] sm:text-xs focus:border-amber-500 focus:bg-white focus:outline-none transition-colors w-32 sm:w-56 truncate"
                title="Editar nombre del proyecto"
              />
            </div>
          </div>
        </div>

        {/* Botones de Acción Principal. En móvil solo "Guardar" + menú "⋯";
            el resto se oculta para dejar la barra limpia (solo lo esencial). */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-x-auto scrollbar-none py-0.5 relative">
          {/* [ SUBIR ARCHIVO / AUTOCAD ] — solo escritorio */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Subir archivo .DXF (AutoCAD) o .JSON de proyecto"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] font-bold hidden md:inline">Subir CAD</span>
          </button>

          {/* [ + NUEVO ] — solo escritorio */}
          <button
            onClick={handleNuevo}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Crear nuevo diseño CAD vacío"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] font-bold hidden sm:inline">+ Nuevo</span>
          </button>

          {/* [ GUARDAR ] — siempre visible. Guardado rápido con estado (spinner / ✓). */}
          <button
            onClick={handleGuardar}
            disabled={isSavingInProgress}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-90 ${
              justSaved ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-700'
            }`}
            title={currentEditingDesignId ? 'Guardar cambios (guardado rápido)' : 'Guardar diseño'}
          >
            {isSavingInProgress
              ? <RefreshCw className="w-3.5 h-3.5 text-white shrink-0 animate-spin" />
              : justSaved
                ? <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                : <Save className="w-3.5 h-3.5 text-white shrink-0" />}
            <span className="text-[11px] font-bold text-white hidden sm:inline">
              {isSavingInProgress ? 'Guardando…' : justSaved ? 'Guardado' : 'Guardar'}
            </span>
          </button>

          {/* [ CARGAR ] — solo escritorio */}
          <button
            onClick={() => {
              loadSavedList();
              setShowLoadModal(true);
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Cargar plantillas o proyectos guardados"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] font-bold hidden sm:inline">Cargar</span>
          </button>

          {/* [ EXPORTAR ] — solo escritorio */}
          <button
            onClick={handleExportar}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Exportar archivo JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold hidden md:inline">Exportar</span>
          </button>

          {/* [ ENVIAR A CONCRETO ] — puente de cimentación, solo escritorio */}
          <button
            onClick={handleEnviarAConcreto}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-300 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Enviar las columnas del techo al CAD de Concreto para diseñar la cimentación"
          >
            <Box className="w-3.5 h-3.5 text-stone-600 shrink-0" />
            <span className="text-[11px] font-bold hidden lg:inline">→ Obra Civil</span>
          </button>

          {/* [ ENVIAR A OBRA POR PISOS ] — solo escritorio */}
          <button
            onClick={handleEnviarAObraPisos}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-300 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Enviar el presupuesto de este techo a un piso de la obra (Obra Civil)"
          >
            <Layers className="w-3.5 h-3.5 text-stone-600 shrink-0" />
            <span className="text-[11px] font-bold hidden lg:inline">→ Obra por pisos</span>
          </button>

          {/* [ AYUDA Y TUTORIAL ] — solo escritorio */}
          <button
            onClick={() => setShowTutorialModal(true)}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Manual y Guía de Ayuda"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-950 shrink-0" />
            <span className="font-black text-[11px] hidden sm:inline">Ayuda</span>
          </button>

          {/* [ MENÚ ⋯ ] — solo móvil: agrupa las acciones secundarias */}
          <div className="relative sm:hidden shrink-0">
            <button
              onClick={e => {
                const r = e.currentTarget.getBoundingClientRect();
                setMobileActionsPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                setShowMobileActions(v => !v);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="Más acciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMobileActions && createPortal(
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowMobileActions(false)} />
                <div style={mobileActionsPos} className="fixed z-[100] w-48 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 flex flex-col gap-0.5 animate-fadeIn">
                  {[
                    { l: 'Subir CAD', I: UploadCloud, on: () => setShowUploadModal(true) },
                    { l: '+ Nuevo', I: Plus, on: handleNuevo },
                    { l: 'Cargar', I: FolderOpen, on: () => { loadSavedList(); setShowLoadModal(true); } },
                    { l: 'Exportar', I: Download, on: handleExportar },
                    { l: '→ Enviar a Concreto', I: Box, on: handleEnviarAConcreto },
                    { l: '→ Obra por pisos', I: Layers, on: handleEnviarAObraPisos },
                    { l: 'Ayuda', I: HelpCircle, on: () => setShowTutorialModal(true) },
                  ].map(a => {
                    const Icon = a.I;
                    return (
                      <button key={a.l} onClick={() => { a.on(); setShowMobileActions(false); }}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 text-slate-700 text-[13px] font-semibold text-left cursor-pointer">
                        <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{a.l}</span>
                      </button>
                    );
                  })}
                </div>
              </>,
              document.body
            )}
          </div>
        </div>
      </header>

      {/* 2. BARRA DE PESTAÑAS NAVEGACIÓN PRINCIPAL (ESTILO HERRERÍA) */}
      <nav 
        onWheel={(e) => {
          if (e.currentTarget) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 flex items-center justify-between overflow-x-auto shrink-0 z-10 select-none scrollbar-none"
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('cad')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'cad'
                ? 'border-amber-600 text-amber-600 bg-amber-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="sm:hidden">1. Diseño</span>
            <span className="hidden sm:inline">1. DISEÑO CAD (2D / 3D)</span>
          </button>

          <button
            onClick={() => setActiveTab('despiece')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'despiece'
                ? 'border-amber-600 text-amber-600 bg-amber-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span className="sm:hidden">2. Despiece</span>
            <span className="hidden sm:inline">2. DESPIECE Y CORTES</span>
          </button>

          <button
            onClick={() => setActiveTab('materiales')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'materiales'
                ? 'border-amber-600 text-amber-600 bg-amber-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="sm:hidden">3. Materiales</span>
            <span className="hidden sm:inline">3. MATERIALES AGRUPADOS</span>
          </button>

          <button
            onClick={() => setActiveTab('costos')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'costos'
                ? 'border-amber-600 text-amber-600 bg-amber-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="sm:hidden">4. Costos</span>
            <span className="hidden sm:inline">4. ESTRUCTURA DE COSTOS</span>
          </button>

          <button
            onClick={() => setActiveTab('presupuesto')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'presupuesto'
                ? 'border-amber-600 text-amber-600 bg-amber-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="sm:hidden">5. Presupuesto</span>
            <span className="hidden sm:inline">5. PRESUPUESTO FORMAL</span>
          </button>

          <button
            onClick={() => setActiveTab('plano')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'plano'
                ? 'border-purple-600 text-purple-600 bg-purple-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="sm:hidden">6. Plano</span>
            <span className="hidden sm:inline">6. PLANO CM-02</span>
          </button>

          <button
            onClick={() => setActiveTab('estructural')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'estructural'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="sm:hidden">7. Análisis</span>
            <span className="hidden sm:inline">7. ANÁLISIS ESTRUCTURAL RNE</span>
          </button>

          <button
            onClick={() => setActiveTab('resumen')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'resumen'
                ? 'border-amber-600 text-amber-600 bg-amber-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4 text-amber-600" />
            <span className="sm:hidden">📊 Resumen</span>
            <span className="hidden sm:inline">📊 RESUMEN COMPONENTES 2D/3D</span>
          </button>
        </div>
      </nav>

      {/* 3. CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <div className="flex-1 min-h-0 relative bg-slate-50 overflow-hidden">
        {activeTab === 'cad' && (
          <div className="w-full h-full flex flex-row relative overflow-hidden bg-slate-50">
            
            {/* ESCRITORIO (3 COLUMNAS: CANVAS, PROPIEDADES) */}
            {isDesktop && (
              <>
                <CanvasArea 
                  engineState={engineState} 
                  onNuevoTecho={handleNuevo}
                  onOpenTutorial={() => setShowTutorialModal(true)}
                  onOpenInteractiveTutorial={() => {
                    setActiveTab('cad');
                    setShowInteractiveTutorial(true);
                  }}
                  activeVista={activeCadVista}
                  onChangeVista={(v) => setActiveCadVista(v)}
                  onOpenMobileToolbox={() => setIsOpenMobileToolbox(true)}
                  onOpenMobileProperties={() => setIsOpenMobileProperties(true)}
                  showInspector={showInspector}
                  setShowInspector={setShowInspector}
                />
                {showInspector && (
                  <PropiedadesCad 
                    engineState={engineState} 
                    onOpenTutorial={() => setShowTutorialModal(true)}
                    onClose={() => setShowInspector(false)}
                  />
                )}
              </>
            )}

            {/* MÓVIL ANDROID (CANVAS FULL + DRAWER & BOTTOM SHEET) */}
            {isMobile && (
              <>
                <CanvasArea 
                  engineState={engineState}
                  isMobile={true}
                  onNuevoTecho={handleNuevo}
                  onOpenTutorial={() => setShowTutorialModal(true)}
                  onOpenInteractiveTutorial={() => {
                    setActiveTab('cad');
                    setShowInteractiveTutorial(true);
                  }}
                  activeVista={activeCadVista}
                  onChangeVista={(v) => setActiveCadVista(v)}
                  onOpenMobileToolbox={() => setIsOpenMobileToolbox(true)}
                  onOpenMobileProperties={() => setIsOpenMobileProperties(true)}
                />

                {/* DRAWER TOOLBOX EN MÓVIL */}
                {isOpenMobileToolbox && (
                  <div className="fixed inset-0 z-50 flex">
                    <div 
                      onClick={() => setIsOpenMobileToolbox(false)}
                      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
                    />
                    <div className="relative z-10">
                      <CadToolbox 
                        engineState={engineState} 
                        isMobileDrawer={true}
                        onCloseMobileDrawer={() => setIsOpenMobileToolbox(false)}
                      />
                    </div>
                  </div>
                )}

                {/* BOTTOM SHEET PROPIEDADES EN MÓVIL */}
                {isOpenMobileProperties && (
                  <div className="fixed inset-0 z-50 flex flex-col justify-end">
                    <div 
                      onClick={() => setIsOpenMobileProperties(false)}
                      className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                    />
                    <div className="relative z-10 w-full">
                      <PropiedadesCad 
                        engineState={engineState} 
                        isBottomSheetMobile={true}
                        onOpenTutorial={() => setShowTutorialModal(true)}
                        onCloseBottomSheetMobile={() => setIsOpenMobileProperties(false)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'despiece' && (
          <TechosDespieceView design={engineState.bomReport as any} />
        )}

        {activeTab === 'materiales' && (
          <TechosMaterialesView design={engineState.bomReport as any} />
        )}

        {activeTab === 'costos' && (
          <TechosCostosView design={engineState.bomReport as any} />
        )}

        {activeTab === 'presupuesto' && (
          <TechosPresupuestoView
            design={engineState.bomReport as any}
            nombreProyecto={nombreProyecto}
            onSaveToProject={onSaveToProject}
            onCreateProject={onCreateProject}
            projects={projects}
            clients={clients}
            onNavigateToProjects={onNavigateToProjects}
            currentSettings={currentSettings}
          />
        )}

        {activeTab === 'plano' && (
          <TechosPlanoCadView engineState={engineState} nombreProyecto={nombreProyecto} />
        )}

        {activeTab === 'estructural' && (
          <TechosEstructuralAnalysisView engineState={engineState} />
        )}

        {activeTab === 'resumen' && (
          <TechosResumenGeneralPanel engineState={engineState} nombreProyecto={nombreProyecto} />
        )}
      </div>

      {/* MODAL DE CARGAR (PLANTILLAS PREDISEÑADAS Y PROYECTOS GUARDADOS) */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl text-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900">Cargar Proyecto o Plantilla Estructural</h3>
              </div>
              <button 
                onClick={() => setShowLoadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* SECCIÓN 1: PLANTILLAS PREDISEÑADAS */}
              <div>
                <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Plantillas Prediseñadas Rápidas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleCargarPlantilla('dos_aguas')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700">Nave Industrial Dos Aguas</div>
                    <div className="text-xs text-slate-500 mt-1">Luz: 12.0m | Largo: 20.0m | Altura: 5.0m | Tijerales Fink</div>
                  </button>

                  <button
                    onClick={() => handleCargarPlantilla('parabolico')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700">Almacén Parabólico Curvo</div>
                    <div className="text-xs text-slate-500 mt-1">Luz: 15.0m | Largo: 25.0m | Altura: 6.0m | Arco Arriostrado</div>
                  </button>

                  <button
                    onClick={() => handleCargarPlantilla('un_agua')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700">Cobertura Un Agua / Sombra</div>
                    <div className="text-xs text-slate-500 mt-1">Luz: 8.0m | Largo: 12.0m | Altura: 3.5m-4.5m | Pendiente 12%</div>
                  </button>

                  <button
                    onClick={() => handleCargarPlantilla('mezzanine')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700">Entrepiso / Mezzanine Metal Deck</div>
                    <div className="text-xs text-slate-500 mt-1">Ancho: 10.0m | Largo: 15.0m | Altura: 3.2m | Vigas IPE/Tubulares</div>
                  </button>

                  <button
                    onClick={() => handleCargarPlantilla('marquesina')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700">Marquesina / Nave Curva (Ala) ✨</div>
                    <div className="text-xs text-slate-500 mt-1">Luz: 8.0m | Largo: 16.0m | Altura: 3.2m | Columna central + voladizo curvo</div>
                  </button>

                  <button
                    onClick={() => handleCargarPlantilla('multinivel')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700">Edificación Metálica 2 Pisos 🏢</div>
                    <div className="text-xs text-slate-500 mt-1">Luz: 8.0m | Largo: 10.0m | 2 pisos × 3.0m | Columnas + entrepiso + techo</div>
                  </button>

                  <button
                    onClick={() => handleCargarPlantilla('tijeral_curvo')}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700">Tijeral 2 Aguas — Cordón Inferior Curvo ✨</div>
                    <div className="text-xs text-slate-500 mt-1">Luz: 10.0m | Largo: 20.0m | Aguas rectas (aluzinc perfecto) + cordón curvo abajo</div>
                  </button>
                </div>
              </div>

              {/* SECCIÓN 2: REPOSITORIO DE PLANOS EN LA NUBE */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-indigo-600" />
                      <span>Repositorio de Planos ({savedDesignsList.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Planos guardados en la nube y organizados por cliente.
                    </p>
                  </div>

                  {/* Filtro por Cliente y Búsqueda */}
                  <div className="flex items-center gap-2">
                    <select
                      value={repoFilterClient}
                      onChange={(e) => setRepoFilterClient(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-indigo-500"
                    >
                      <option value="todos">Todos los Clientes</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buscador rápido */}
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={repoSearchTerm}
                    onChange={(e) => setRepoSearchTerm(e.target.value)}
                    placeholder="Buscar plano por nombre, cliente o proyecto..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {(() => {
                  const filtered = savedDesignsList.filter(item => {
                    const matchClient = repoFilterClient === 'todos' || item.clientId === repoFilterClient;
                    const searchLower = repoSearchTerm.toLowerCase();
                    const matchSearch = !repoSearchTerm.trim() || 
                      item.nombre?.toLowerCase().includes(searchLower) ||
                      item.clientName?.toLowerCase().includes(searchLower) ||
                      item.projectName?.toLowerCase().includes(searchLower) ||
                      item.authorName?.toLowerCase().includes(searchLower);
                    return matchClient && matchSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                        No se encontraron planos guardados con los filtros seleccionados.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {filtered.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-2xs group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                                {item.nombre}
                              </span>
                              {item.id === currentEditingDesignId && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-700 font-extrabold px-1.5 py-0.5 rounded-md">
                                  En pantalla
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              {item.clientName && (
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <Users className="w-3 h-3 text-blue-500" />
                                  <span>{item.clientName}</span>
                                </span>
                              )}
                              {item.projectName && (
                                <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <Briefcase className="w-3 h-3 text-purple-500" />
                                  <span>{item.projectName}</span>
                                </span>
                              )}
                              {item.authorName && (
                                <span className="text-slate-400">
                                  Por: <strong className="text-slate-600">{item.authorName}</strong>
                                </span>
                              )}
                              <span className="text-slate-400">
                                • {item.updatedAt ? `Act. ${item.updatedAt}` : item.savedAt}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => handleCargarDisenoGuardado(item)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Box className="w-3.5 h-3.5" />
                              <span>Cargar en 3D</span>
                            </button>
                            <button
                              onClick={(e) => handleEliminarGuardado(item.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar plano"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GUARDADO INTELIGENTE (PORTAFOLIO POR CLIENTE) */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg text-slate-800 shadow-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Guardar Plano en Portafolio
                  </h3>
                  <p className="text-xs text-slate-500">
                    Almacena el diseño 3D, organízalo por cliente y respáldalo en la nube.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre del Plano */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre del Plano / Estructura *
                </label>
                <input
                  type="text"
                  value={saveModalNombre}
                  onChange={(e) => setSaveModalNombre(e.target.value)}
                  placeholder="Ej. Techo Dos Aguas 15x30m - Almacén"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Asignación a Cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Asignar a Cliente (Para su Portafolio)</span>
                </label>
                <select
                  value={saveModalClientId}
                  onChange={(e) => {
                    setSaveModalClientId(e.target.value);
                    // auto-select or clear project if client changes
                    const clientProjects = projects.filter(p => p.client === clients.find(c => c.id === e.target.value)?.name);
                    if (clientProjects.length > 0) {
                      setSaveModalProjectId(clientProjects[0].id);
                    } else {
                      setSaveModalProjectId('');
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-amber-500 transition-all font-medium"
                >
                  <option value="">-- Sin cliente asignado (Plano General) --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asignación a Proyecto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                  <span>Vincular a Obra / Proyecto Específico</span>
                </label>
                <select
                  value={saveModalProjectId}
                  onChange={(e) => setSaveModalProjectId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-amber-500 transition-all font-medium"
                >
                  <option value="">-- Sin proyecto específico --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.client ? `(${p.client})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opción de Sobrescritura Inteligente vs Nueva Versión */}
              {currentEditingDesignId && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                    <span>Control de Versiones y Modificaciones Frecuentes</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                      <input
                        type="radio"
                        name="saveMode"
                        checked={saveModalOverwrite}
                        onChange={() => setSaveModalOverwrite(true)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span><strong>Actualizar plano actual:</strong> reescribe este archivo sin crear copias duplicadas.</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                      <input
                        type="radio"
                        name="saveMode"
                        checked={!saveModalOverwrite}
                        onChange={() => setSaveModalOverwrite(false)}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span><strong>Guardar como nueva versión:</strong> conserva el anterior y crea un plano adicional.</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Indicador de Firestore Cloud */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Sincronización en la Nube
                </span>
                <span className="font-semibold text-emerald-700">
                  Nube Activa
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSavingInProgress || !saveModalNombre.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingInProgress ? 'Guardando en Nube...' : (saveModalOverwrite && currentEditingDesignId ? 'Actualizar Plano' : 'Guardar en Portafolio')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AYUDA */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg text-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-900">Guía Centro CAD Techos Metálicos</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>📐 <strong>Diseño Libre desde Cero:</strong> Empieza con un lienzo completamente vacío y traza nodo a nodo o línea a línea tus columnas, tijerales y correas.</p>
              <p>🏗️ <strong>Generadores de Ayuda Paramétricos:</strong> Usa el botón [ CARGAR ] o el inspector lateral para insertar estructuras base (Dos Aguas, Parabólico, Mezzanine) y modifícalas libremente.</p>
              <p>🔩 <strong>Despiece 1D & Metrados:</strong> Optimización automática de cortes para barras de 6.00m con desperdicio mínimo y resumen de materiales.</p>
              <p>📄 <strong>Análisis Estructural RNE:</strong> Verificación de esfuerzos, momentos y ratios Demanda/Capacidad según la normativa RNE E.020, E.030, E.090.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL / TUTORIAL TEÓRICO */}
      <TechosTutorialModal 
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        engineState={engineState}
        onSwitchView={() => setActiveTab('cad')}
        onStartInteractiveTutorial={() => {
          setActiveTab('cad');
          setShowInteractiveTutorial(true);
        }}
      />

      {/* MODAL DE SUBIDA / IMPORTACIÓN DE ARCHIVOS AUTOCAD (.DXF) Y PROYECTOS (.JSON) */}
      <CadFileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        moduleName="techos"
        onImportDxf={handleImportDxf}
        onImportJson={handleImportJson}
        onExportDxf={handleExportDxf}
      />

      {/* TUTORIAL INTERACTIVO GUIADO PASO A PASO EN LIENZO */}
      <TechosInteractiveTutorial
        isOpen={showInteractiveTutorial}
        onClose={() => setShowInteractiveTutorial(false)}
        engineState={engineState}
        activeVista={activeCadVista}
        onChangeVista={(v) => setActiveCadVista(v)}
        activeTool={engineState.activeTool}
        onChangeTool={(tool) => engineState.setActiveTool(tool)}
      />
    </div>
  );
};

export const TechosModuleView: React.FC<TechosModuleViewProps> = (props) => {
  return (
    <TechosErrorBoundary fallbackTitle="Error en Centro CAD de Techos Metálicos">
      <TechosModuleViewContent {...props} />
    </TechosErrorBoundary>
  );
};

export default TechosModuleView;

