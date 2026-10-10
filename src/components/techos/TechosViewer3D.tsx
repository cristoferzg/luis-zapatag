// Visor 3D Interactivo de Techos Metálicos con Planchas de Aluzinc TR-4 (0.25mm a 0.60mm),
// Geometría Física de Perfiles y Nudos de Unión Estructurales Biselados (Clean Miters & Welded Joints),
// Simulador de Lluvias de Alta Fidelidad con Trazas Aerodinámicas y Evacuación Lateral en Aleros,
// Simulador Sísmico Reactivo con Desglose Detallado de Zonas Críticas y Mejoras por Tubo (Norma E.090 / E.030),
// Giroscopio Espacial y Controles Táctiles/Pointer Originales Suaves,
// e Iluminación Simplificada en 2 Modos Únicos: Claro y Oscuro
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, 
  Plus, 
  Minus, 
  Maximize2, 
  Eye, 
  Sliders, 
  X,
  CloudRain,
  Activity,
  ShieldCheck,
  BookOpen,
  Wrench,
  Compass,
  Search,
  ArrowLeft,
  ArrowRight,
  Minimize2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Layers,
  SlidersHorizontal,
  Video,
  Square,
  Box
} from 'lucide-react';
import { UseTechosCadEngineReturn } from './useTechosCadEngineState';
import { INVENTARIO_PERFILES_TUBULARES, PERFILES_TECHOS_AGRUPADOS } from './techosCadCatalog';

interface TechosViewer3DProps {
  engineState?: UseTechosCadEngineReturn;
  nodes?: Record<string, { id: string; x: number; y: number; z?: number; isFixedSupport?: boolean; anchorBoltsCount?: number }>;
  segments?: Record<string, { id: string; nodeAId: string; nodeBId: string; profileId: string; rolEstructural?: string }>;
  onSelectElement?: (id: string, type: 'node' | 'segment') => void;
  selectedElementId?: string | null;
}

export interface ModeloAluzincPeru {
  id: string;
  nombre: string;
  espesorMm: number;
  tipo: 'aluzinc_tr4' | 'aluzinc_tr5' | 'calamina_ondulada' | 'policarbonato' | 'termoacustico';
  opacidadDefecto: number;
  colorDefectoHex: number;
  ribHeightMm: number;
  ribCountPerMeter: number;
}

// Dos únicos modos de iluminación claros y concisos: Claro y Oscuro
export type ModoIluminacionTechos = 'claro' | 'oscuro';

export const CONFIG_ILUMINACION_TECHOS: Record<ModoIluminacionTechos, {
  id: ModoIluminacionTechos;
  nombre: string;
  nombreCorto: string;
  descripcion: string;
  icon: string;
  bgColor: number;
  ambientColor: number;
  ambientIntensity: number;
  dir1Color: number;
  dir1Intensity: number;
  dir1Pos: [number, number, number];
  dir2Color: number;
  dir2Intensity: number;
  dir2Pos: [number, number, number];
}> = {
  claro: {
    id: 'claro',
    nombre: 'Modo Claro (Estudio CAD)',
    nombreCorto: 'Claro',
    descripcion: 'Fondo claro e iluminación nítida sin reflejos cegadores',
    icon: '☀️',
    bgColor: 0xf8fafc,
    ambientColor: 0xffffff,
    ambientIntensity: 1.25,
    dir1Color: 0xffffff,
    dir1Intensity: 1.25,
    dir1Pos: [25, 45, 30],
    dir2Color: 0xe2e8f0,
    dir2Intensity: 0.95,
    dir2Pos: [-25, -15, -25]
  },
  oscuro: {
    id: 'oscuro',
    nombre: 'Modo Oscuro (Grafito CAD)',
    nombreCorto: 'Oscuro',
    descripcion: 'Fondo grafito oscuro para resaltar aristas y perfiles',
    icon: '🌙',
    bgColor: 0x0f172a,
    ambientColor: 0x64748b,
    ambientIntensity: 0.95,
    dir1Color: 0xffffff,
    dir1Intensity: 1.35,
    dir1Pos: [30, 40, 30],
    dir2Color: 0x38bdf8,
    dir2Intensity: 1.0,
    dir2Pos: [-30, 10, -30]
  }
};

export const MODOS_ILUMINACION_ARRAY: ModoIluminacionTechos[] = ['claro', 'oscuro'];

// Modelos del Mercado Peruano incluyendo calibres económicos de 0.25mm a 0.60mm
export const MODELOS_ALUZINC_PERU: ModeloAluzincPeru[] = [
  { id: 'tr4_025', nombre: 'Aluzinc TR-4 (0.25 mm - Económico Comercial)', espesorMm: 0.25, tipo: 'aluzinc_tr4', opacidadDefecto: 0.95, colorDefectoHex: 0x0284c7, ribHeightMm: 35, ribCountPerMeter: 4 },
  { id: 'tr4_030', nombre: 'Aluzinc TR-4 (0.30 mm - Estándar Ligero Perú)', espesorMm: 0.30, tipo: 'aluzinc_tr4', opacidadDefecto: 0.95, colorDefectoHex: 0x0284c7, ribHeightMm: 35, ribCountPerMeter: 4 },
  { id: 'tr4_035', nombre: 'Aluzinc TR-4 (0.35 mm - Residencial Reforzado)', espesorMm: 0.35, tipo: 'aluzinc_tr4', opacidadDefecto: 0.95, colorDefectoHex: 0x0284c7, ribHeightMm: 35, ribCountPerMeter: 4 },
  { id: 'tr4_040', nombre: 'Aluzinc TR-4 (0.40 mm - Comercial 4 Crestas)', espesorMm: 0.40, tipo: 'aluzinc_tr4', opacidadDefecto: 0.95, colorDefectoHex: 0x0284c7, ribHeightMm: 35, ribCountPerMeter: 4 },
  { id: 'tr4_045', nombre: 'Aluzinc TR-4 (0.45 mm - Industrial Semi-Pesado)', espesorMm: 0.45, tipo: 'aluzinc_tr4', opacidadDefecto: 0.98, colorDefectoHex: 0x0284c7, ribHeightMm: 35, ribCountPerMeter: 4 },
  { id: 'tr4_050', nombre: 'Aluzinc TR-4 (0.50 mm - Industrial Heavy Duty)', espesorMm: 0.50, tipo: 'aluzinc_tr4', opacidadDefecto: 1.0, colorDefectoHex: 0x334155, ribHeightMm: 35, ribCountPerMeter: 4 },
  { id: 'tr5_050', nombre: 'Aluzinc TR-5 (0.50 mm - 5 Crestas Alta Carga)', espesorMm: 0.50, tipo: 'aluzinc_tr5', opacidadDefecto: 1.0, colorDefectoHex: 0x1e293b, ribHeightMm: 38, ribCountPerMeter: 5.2 },
  { id: 'tr5_060', nombre: 'Aluzinc TR-5 (0.60 mm - Extra Robusto)', espesorMm: 0.60, tipo: 'aluzinc_tr5', opacidadDefecto: 1.0, colorDefectoHex: 0x475569, ribHeightMm: 38, ribCountPerMeter: 5.2 },
  { id: 'ondulada_025', nombre: 'Calamina Ondulada Zinc (0.25 mm - Económica)', espesorMm: 0.25, tipo: 'calamina_ondulada', opacidadDefecto: 1.0, colorDefectoHex: 0x94a3b8, ribHeightMm: 18, ribCountPerMeter: 8 },
  { id: 'ondulada_030', nombre: 'Calamina Ondulada Zinc (0.30 mm - Reforzada)', espesorMm: 0.30, tipo: 'calamina_ondulada', opacidadDefecto: 1.0, colorDefectoHex: 0x64748b, ribHeightMm: 18, ribCountPerMeter: 8 },
  { id: 'tr4_poly_trans', nombre: 'Policarbonato TR-4 Alveolar Traslúcido (Tragazul 6mm)', espesorMm: 6.0, tipo: 'policarbonato', opacidadDefecto: 0.45, colorDefectoHex: 0x38bdf8, ribHeightMm: 35, ribCountPerMeter: 4 },
  { id: 'tr5_poly_opal', nombre: 'Policarbonato TR-5 Opalino (Luz Difusa 6mm)', espesorMm: 6.0, tipo: 'policarbonato', opacidadDefecto: 0.60, colorDefectoHex: 0xf8fafc, ribHeightMm: 38, ribCountPerMeter: 5.2 },
  { id: 'st1000_sand', nombre: 'Panel Termoacústico ST-1000 (Sandwich PUR 30mm)', espesorMm: 30.0, tipo: 'termoacustico', opacidadDefecto: 1.0, colorDefectoHex: 0x15803d, ribHeightMm: 40, ribCountPerMeter: 3 },
  { id: 'sandwich_pur_50', nombre: 'Panel Sándwich PUR Industrial 50mm (Aislante Térmico)', espesorMm: 50.0, tipo: 'termoacustico', opacidadDefecto: 1.0, colorDefectoHex: 0x047857, ribHeightMm: 45, ribCountPerMeter: 3 }
];

export interface DetalleZonaCritica {
  id: string;
  zonaNombre: string;
  rolEstructural: string;
  elementoDesc: string;
  perfilActualNombre: string;
  espesorActualMm: number;
  anchoActualMm: number;
  ratioEsfuerzo: number; // 0.0 a 1.5
  estadoZona: 'OK' | 'ALERTA_PANDEO' | 'COLAPSO';
  perfilRecomendado: string;
  justificacionNorma: string;
}

// Generador de textura procedural de Gota de Agua Cristalina (Lágrima con Bulbo, Brillo y Estela)
let cachedRainDropTexture: THREE.CanvasTexture | null = null;
function getRainDropTexture(): THREE.CanvasTexture {
  if (cachedRainDropTexture) return cachedRainDropTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 64, 128);

  // 1. Estela translúcida de caída (cola de gota aerodinámica)
  const tailGrad = ctx.createLinearGradient(32, 6, 32, 100);
  tailGrad.addColorStop(0, 'rgba(186, 230, 253, 0.0)');
  tailGrad.addColorStop(0.3, 'rgba(186, 230, 253, 0.22)');
  tailGrad.addColorStop(0.7, 'rgba(224, 242, 254, 0.65)');
  tailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.92)');

  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(32, 6);
  ctx.quadraticCurveTo(28, 55, 22, 98);
  ctx.lineTo(42, 98);
  ctx.quadraticCurveTo(36, 55, 32, 6);
  ctx.closePath();
  ctx.fill();

  // 2. Bulbo esférico de la gota de agua (lente líquida con refracción)
  const bulbGrad = ctx.createRadialGradient(32, 102, 1, 32, 102, 13);
  bulbGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');     // Núcleo blanco brillante
  bulbGrad.addColorStop(0.35, 'rgba(224, 242, 254, 0.95)'); // Capa cristalina
  bulbGrad.addColorStop(0.7, 'rgba(125, 211, 252, 0.70)');  // Halo azul celeste agua
  bulbGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');      // Transición suave

  ctx.fillStyle = bulbGrad;
  ctx.beginPath();
  ctx.arc(32, 102, 13, 0, Math.PI * 2);
  ctx.fill();

  // 3. Destello especular de reflexión solar en la lente de la gota
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.beginPath();
  ctx.arc(29, 99, 3.5, 0, Math.PI * 2);
  ctx.fill();

  cachedRainDropTexture = new THREE.CanvasTexture(canvas);
  cachedRainDropTexture.needsUpdate = true;
  return cachedRainDropTexture;
}

// Generador de textura procedural de Salpicadura de Agua / Ondas de Choque
let cachedSplashTexture: THREE.CanvasTexture | null = null;
function getSplashTexture(): THREE.CanvasTexture {
  if (cachedSplashTexture) return cachedSplashTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 64, 64);

  // Anillo de onda concéntrico
  const rippleGrad = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
  rippleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  rippleGrad.addColorStop(0.35, 'rgba(186, 230, 253, 0.75)');
  rippleGrad.addColorStop(0.75, 'rgba(125, 211, 252, 0.35)');
  rippleGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

  ctx.fillStyle = rippleGrad;
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();

  // Gotículas de rebote
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const dist = 16 + (i % 2) * 6;
    const sx = 32 + Math.cos(angle) * dist;
    const sy = 32 + Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedSplashTexture = new THREE.CanvasTexture(canvas);
  cachedSplashTexture.needsUpdate = true;
  return cachedSplashTexture;
}

// Etiquetas y colores descriptivos por rol estructural
const ROL_LABELS: Record<string, { label: string; badgeBg: string }> = {
  columna: { label: 'Columna Principal', badgeBg: 'bg-blue-900/60 text-blue-300 border-blue-500/50' },
  cordon_superior: { label: 'Cordón Superior (Arco/Cumbrera)', badgeBg: 'bg-purple-900/60 text-purple-300 border-purple-500/50' },
  cordon_inferior: { label: 'Cordón Inferior', badgeBg: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/50' },
  diagonal: { label: 'Diagonal de Celosía', badgeBg: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/50' },
  montante: { label: 'Montante Vertical', badgeBg: 'bg-amber-900/60 text-amber-300 border-amber-500/50' },
  correa: { label: 'Correa de Cubierta', badgeBg: 'bg-cyan-900/60 text-cyan-300 border-cyan-500/50' },
  viga_principal: { label: 'Viga Principal', badgeBg: 'bg-sky-900/60 text-sky-300 border-sky-500/50' },
  arriostre: { label: 'Arriostre / Tensor', badgeBg: 'bg-rose-900/60 text-rose-300 border-rose-500/50' }
};

export const TechosViewer3D: React.FC<TechosViewer3DProps> = ({ 
  engineState,
  nodes: propsNodes,
  segments: propsSegments,
  onSelectElement,
  selectedElementId
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(false);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);
  
  // Dos Modos de Iluminación: Claro u Oscuro
  const [modoIluminacion, setModoIluminacion] = useState<ModoIluminacionTechos>('claro');

  const handleToggleIluminacion = () => {
    setModoIluminacion(prev => prev === 'claro' ? 'oscuro' : 'claro');
  };

  // Por defecto OCULTA para que al abrir el 3D se vea la estructura metálica
  // (tubos, cordones, montantes). El botón del ojo muestra la cobertura Aluzinc.
  const [mostrarCobertura, setMostrarCobertura] = useState(false);
  const mostrarCoberturaRef = useRef(true);
  useEffect(() => { mostrarCoberturaRef.current = mostrarCobertura; }, [mostrarCobertura]);

  const [mostrarPlataforma] = useState(true);
  const [mostrarPernosAnclaje] = useState(true);
  const [mostrarEjesGiroscopio] = useState(true);

  // SIMULADORES ESTRUCTURALES Y AMBIENTALES
  const [simulacionModo, setSimulacionModo] = useState<'ninguno' | 'lluvia' | 'sismo'>('ninguno');
  const simulacionModoRef = useRef<'ninguno' | 'lluvia' | 'sismo'>('ninguno');
  useEffect(() => {
    simulacionModoRef.current = simulacionModo;
  }, [simulacionModo]);

  // Parámetros de Sismo
  const [sismoMagnitud, setSismoMagnitud] = useState<number>(7.2);
  const sismoMagnitudRef = useRef(7.2);
  useEffect(() => { sismoMagnitudRef.current = sismoMagnitud; }, [sismoMagnitud]);
  const [mostrarDetalleZonasSismo, setMostrarDetalleZonasSismo] = useState(false);

  // Parámetros de Lluvia
  const [lluviaIntensidad, setLluviaIntensidad] = useState<number>(45);
  const lluviaIntensidadRef = useRef(45);
  useEffect(() => { lluviaIntensidadRef.current = lluviaIntensidad; }, [lluviaIntensidad]);

  // Elementos activos desde engineState o props fallback
  const nodes = engineState?.nodes || propsNodes || {};
  const segments = engineState?.segments || propsSegments || {};

  // Estado para Selección e Inspección 3D Interactiva de Perfiles
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [tempChosenProfileId, setTempChosenProfileId] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Soporte de gesto Swipe-Down en móvil para el Inspector 3D
  // Soporte de arrastre libre y reposicionamiento del Inspector 3D (PC, tablet y móvil)
  const [panelPos, setPanelPos] = useState<{ x: number, y: number } | null>(null);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const isDraggingPanelRef = useRef(false);
  const panelDragStartRef = useRef<{ clientX: number; clientY: number; posX: number; posY: number }>({ clientX: 0, clientY: 0, posX: 0, posY: 0 });
  const panelContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const handlePanelPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input')) return;

    e.preventDefault();
    isDraggingPanelRef.current = true;
    setIsDraggingPanel(true);

    const defaultX = typeof window !== 'undefined' && window.innerWidth >= 640 ? Math.max(20, window.innerWidth - 410) : 12;
    const currentX = panelPos?.x ?? defaultX;
    const currentY = panelPos?.y ?? 70;

    panelDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: currentX,
      posY: currentY
    };

    const handlePointerMoveWindow = (moveEvent: PointerEvent) => {
      if (!isDraggingPanelRef.current) return;
      const deltaX = moveEvent.clientX - panelDragStartRef.current.clientX;
      const deltaY = moveEvent.clientY - panelDragStartRef.current.clientY;

      const panelWidth = panelContainerRef.current?.offsetWidth || 380;
      const panelHeight = panelContainerRef.current?.offsetHeight || 300;

      const maxX = Math.max(10, window.innerWidth - panelWidth - 10);
      const maxY = Math.max(10, window.innerHeight - Math.min(panelHeight, 150));

      const newX = Math.max(10, Math.min(maxX, panelDragStartRef.current.posX + deltaX));
      const newY = Math.max(10, Math.min(maxY, panelDragStartRef.current.posY + deltaY));

      setPanelPos({ x: newX, y: newY });
    };

    const handlePointerUpWindow = () => {
      isDraggingPanelRef.current = false;
      setIsDraggingPanel(false);
      window.removeEventListener('pointermove', handlePointerMoveWindow);
      window.removeEventListener('pointerup', handlePointerUpWindow);
    };

    window.addEventListener('pointermove', handlePointerMoveWindow);
    window.addEventListener('pointerup', handlePointerUpWindow);
  };

  const handleDockLeft = () => {
    setPanelPos({ x: 20, y: 70 });
  };

  const handleDockRight = () => {
    if (typeof window !== 'undefined') {
      setPanelPos({ x: Math.max(20, window.innerWidth - 410), y: 70 });
    }
  };

  const activeSelectedSegId = selectedSegmentId || (engineState?.selectedElementIds?.[0] || selectedElementId || null);

  // Sincronizar el perfil temporal con el perfil del elemento seleccionado
  useEffect(() => {
    if (activeSelectedSegId && segments[activeSelectedSegId]) {
      setTempChosenProfileId(segments[activeSelectedSegId].profileId);
    }
  }, [activeSelectedSegId, segments]);

  // Diagnóstico Sísmico Reactivo con Desglose Pormenorizado de Zonas Críticas y Mejoras por Tubo
  const getDiagnosticoSismo = (mag: number) => {
    const activeSegList = Object.values(segments);
    
    // 1. Análisis por Zonas Estructurales Individuales
    const zonasEvaluadas: DetalleZonaCritica[] = [
      {
        id: 'zona_col',
        zonaNombre: '1. Columnas y Apoyos Principales',
        rolEstructural: 'columna',
        elementoDesc: 'Pilares verticales de transmisión de carga a zapatas',
        perfilActualNombre: 'No asignado',
        espesorActualMm: 1.5,
        anchoActualMm: 50,
        ratioEsfuerzo: 0.5,
        estadoZona: 'OK',
        perfilRecomendado: 'Tubo Cuadrado LAC 100x100x3.2mm o Redondo SCH 40 Ø 4"',
        justificacionNorma: 'Norma E.090 / E.030: Requiere rigidez lateral mínima para evitar deriva inelástica excesiva.'
      },
      {
        id: 'zona_diag',
        zonaNombre: '2. Diagonales de Celosía (Tijerales)',
        rolEstructural: 'diagonal',
        elementoDesc: 'Barras trianguladas sometidas a compresión diagonal alternante',
        perfilActualNombre: 'No asignado',
        espesorActualMm: 1.5,
        anchoActualMm: 50,
        ratioEsfuerzo: 0.5,
        estadoZona: 'OK',
        perfilRecomendado: 'Tubo Cuadrado LAC 50x50x2.0mm (2"x2") o LAC 75x75x2.5mm',
        justificacionNorma: 'Norma E.090 Cap. 5: Control de esbeltez λ = kL/r ≤ 200 ante compresión axial sísmica.'
      },
      {
        id: 'zona_cordon',
        zonaNombre: '3. Cordones Superior e Inferior',
        rolEstructural: 'cordon_superior',
        elementoDesc: 'Vigas y arcos de cumbrera sometidos a flexión y compresión máxima',
        perfilActualNombre: 'No asignado',
        espesorActualMm: 1.5,
        anchoActualMm: 50,
        ratioEsfuerzo: 0.5,
        estadoZona: 'OK',
        perfilRecomendado: 'Tubo Rectangular LAC 100x50x2.5mm (4"x2") o LAC 75x75x3.0mm',
        justificacionNorma: 'Norma E.090 Cap. 6: Módulo plástico Zx suficiente para absorber momento flector sísmico Mu.'
      },
      {
        id: 'zona_correa',
        zonaNombre: '4. Correas de Tejido de Cubierta',
        rolEstructural: 'correa',
        elementoDesc: 'Perfiles longitudinales de soporte directo de planchas de Aluzinc',
        perfilActualNombre: 'No asignado',
        espesorActualMm: 1.5,
        anchoActualMm: 50,
        ratioEsfuerzo: 0.4,
        estadoZona: 'OK',
        perfilRecomendado: 'Perfil C 100x50x2.0mm o Tubo Rectangular 2"x1"x2.0mm',
        justificacionNorma: 'Norma E.090: Limitar deflexión a L/350 y evitar volcamiento lateral bajo sismo transversal.'
      }
    ];

    // Buscar perfiles reales instalados en cada zona
    activeSegList.forEach(seg => {
      const p = INVENTARIO_PERFILES_TUBULARES.find(item => item.id === seg.profileId);
      if (!p) return;

      if (seg.rolEstructural === 'columna') {
        zonasEvaluadas[0].perfilActualNombre = p.nombre;
        zonasEvaluadas[0].espesorActualMm = Math.max(zonasEvaluadas[0].espesorActualMm, p.espesorMm);
        zonasEvaluadas[0].anchoActualMm = Math.max(zonasEvaluadas[0].anchoActualMm, p.anchoMm);
      } else if (seg.rolEstructural === 'diagonal' || seg.rolEstructural === 'montante') {
        zonasEvaluadas[1].perfilActualNombre = p.nombre;
        zonasEvaluadas[1].espesorActualMm = Math.max(zonasEvaluadas[1].espesorActualMm, p.espesorMm);
        zonasEvaluadas[1].anchoActualMm = Math.max(zonasEvaluadas[1].anchoActualMm, p.anchoMm);
      } else if (seg.rolEstructural === 'cordon_superior' || seg.rolEstructural === 'cordon_inferior' || seg.rolEstructural === 'viga_principal') {
        zonasEvaluadas[2].perfilActualNombre = p.nombre;
        zonasEvaluadas[2].espesorActualMm = Math.max(zonasEvaluadas[2].espesorActualMm, p.espesorMm);
        zonasEvaluadas[2].anchoActualMm = Math.max(zonasEvaluadas[2].anchoActualMm, p.anchoMm);
      } else if (seg.rolEstructural === 'correa') {
        zonasEvaluadas[3].perfilActualNombre = p.nombre;
        zonasEvaluadas[3].espesorActualMm = Math.max(zonasEvaluadas[3].espesorActualMm, p.espesorMm);
        zonasEvaluadas[3].anchoActualMm = Math.max(zonasEvaluadas[3].anchoActualMm, p.anchoMm);
      }
    });

    // Calcular ratios y estados por zona con base en la magnitud sísmica y las dimensiones del perfil
    zonasEvaluadas.forEach(zona => {
      const baseCapFactor = (zona.anchoActualMm / 50) * (zona.espesorActualMm / 1.5);
      const demandFactor = Math.pow(mag / 6.0, 2.2);
      const ratio = demandFactor / Math.max(0.6, baseCapFactor);
      zona.ratioEsfuerzo = parseFloat(ratio.toFixed(2));

      if (ratio <= 0.85) {
        zona.estadoZona = 'OK';
      } else if (ratio <= 1.25) {
        zona.estadoZona = 'ALERTA_PANDEO';
      } else {
        zona.estadoZona = 'COLAPSO';
      }
    });

    // Diagnóstico Global Consolidado
    const maxRatio = Math.max(...zonasEvaluadas.map(z => z.ratioEsfuerzo));
    const zonasEnColapso = zonasEvaluadas.filter(z => z.estadoZona === 'COLAPSO');
    const zonasEnAlerta = zonasEvaluadas.filter(z => z.estadoZona === 'ALERTA_PANDEO');

    let globalEstado: 'ESTABLE' | 'SE_DOBLARA' | 'COLAPSO' = 'ESTABLE';
    let globalMensaje = '🟢 ESTRUCTURA ESTABLE Y CONFORME (Norma E.090)';
    let globalDescripcion = 'Perfiles asignados proporcionan la inercia necesaria. Esfuerzos dentro del rango elástico admisible.';
    let globalColor = 'text-emerald-400';
    let globalBg = 'bg-emerald-950/80 border-emerald-800';
    let globalBadge = '🟢 SEGURO (CONFORME E.090)';
    let zonaRiesgoTexto = 'Estructura en rango elástico seguro';
    let perfilSugeridoGlobal = 'Perfiles actuales óptimos y conformes';

    if (maxRatio > 1.25 || zonasEnColapso.length > 0) {
      globalEstado = 'COLAPSO';
      globalMensaje = '🚨 SE CAERÁ (Peligro Inminente de Colapso)';
      globalDescripcion = `Pandeo crítico en ${zonasEnColapso.map(z => z.zonaNombre.split('.')[1]?.trim() || z.zonaNombre).join(' y ')}. Se exige reforzar a tubos de mayor inercia.`;
      globalColor = 'text-rose-400';
      globalBg = 'bg-rose-950/80 border-rose-800';
      globalBadge = '🔴 SE CAERÁ (COLAPSO INMINENTE)';
      zonaRiesgoTexto = zonasEnColapso.map(z => z.zonaNombre).join(', ');
      perfilSugeridoGlobal = 'Tubo Cuadrado LAC 100x100x3.2mm o Tubo Redondo Ø 4" SCH 40';
    } else if (maxRatio > 0.85 || zonasEnAlerta.length > 0) {
      globalEstado = 'SE_DOBLARA';
      globalMensaje = '⚠️ SE DOBLARÁ (Deformación Plástica y Pandeo Local)';
      globalDescripcion = `La solicitación supera el rango elástico en ${zonasEnAlerta.map(z => z.zonaNombre.split('.')[1]?.trim() || z.zonaNombre).join(' y ')}. Requiere aumentar sección.`;
      globalColor = 'text-amber-400';
      globalBg = 'bg-amber-950/80 border-amber-800';
      globalBadge = '🟡 SE DOBLARÁ (FLECHA EXCESIVA)';
      zonaRiesgoTexto = zonasEnAlerta.map(z => z.zonaNombre).join(', ');
      perfilSugeridoGlobal = 'Tubo Cuadrado LAC 75x75x2.5mm o Tubo Rectangular LAC 100x50x2.5mm';
    }

    return {
      estado: globalEstado,
      mensaje: globalMensaje,
      descripcion: globalDescripcion,
      color: globalColor,
      bg: globalBg,
      badge: globalBadge,
      zonaRiesgo: zonaRiesgoTexto,
      recomendacionNorma: 'Norma Técnica Peruana E.090 (Estructuras Metálicas) y E.030 (Diseño Sismorresistente).',
      perfilSugerido: perfilSugeridoGlobal,
      zonasEvaluadas
    };
  };

  // Modelo y Opacidad de Aluzinc
  const [selectedModeloId, setSelectedModeloId] = useState<string>('tr4_030');
  const [aluzincOpacity, setAluzincOpacity] = useState<number>(1.0);
  const [aluzincColorHex, setAluzincColorHex] = useState<number>(0x0284c7);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const rainLinesRef = useRef<THREE.Group | null>(null);
  const rainWaterMetaRef = useRef<any>(null);

  // Giroscopio espacial y Controles de Orbitación suaves (Pointer Events & Multi-touch Pinch)
  const isDraggingRef = useRef(false);
  const previousPointerPosRef = useRef({ x: 0, y: 0 });
  const pointerDownPosRef = useRef({ x: 0, y: 0 });
  const touchPinchDistRef = useRef<number | null>(null);
  const cameraRadiusRef = useRef(16);
  const cameraAngleThetaRef = useRef(0.65);
  const cameraAnglePhiRef = useRef(0.48);
  const cameraTargetRef = useRef(new THREE.Vector3(6, 3.5, 6));

  // Inertia Damping Velocity for Smooth Orbit Gyroscope
  const velocityThetaRef = useRef(0);
  const velocityPhiRef = useRef(0);

  // Grabación de video del visor 3D (giro lento + descarga)
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const updateCameraPos = useCallback(() => {
    if (!cameraRef.current) return;
    const r = cameraRadiusRef.current;
    const theta = cameraAngleThetaRef.current;
    const phi = cameraAnglePhiRef.current;
    const target = cameraTargetRef.current;

    const x = target.x + r * Math.sin(phi) * Math.sin(theta);
    const y = target.y + r * Math.cos(phi);
    const z = target.z + r * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  }, []);


  // Manejadores Pointer Events con captura completa para ratón, lápiz y pantallas táctiles
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    velocityThetaRef.current = 0;
    velocityPhiRef.current = 0;
    previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      // Detección hover para cursor pointer sobre tubos seleccionables en 3D
      const container = mountRef.current;
      if (container && cameraRef.current && sceneRef.current) {
        const rect = container.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const tubesGroup = sceneRef.current.getObjectByName('tubes_group') || sceneRef.current.getObjectByName('tubos_estructurales');
        if (tubesGroup) {
          const intersects = raycaster.intersectObjects(tubesGroup.children, true)
            .filter(i => i.object instanceof THREE.Mesh);
          if (intersects.length > 0) {
            container.style.cursor = 'pointer';
            return;
          }
        }
        container.style.cursor = 'grab';
      }
      return;
    }
    const deltaX = e.clientX - previousPointerPosRef.current.x;
    const deltaY = e.clientY - previousPointerPosRef.current.y;
    previousPointerPosRef.current = { x: e.clientX, y: e.clientY };

    // Sensibilidad suave e inercial calibrada para el giroscopio 3D
    const sensitivity = 0.006;
    velocityThetaRef.current = -deltaX * sensitivity;
    velocityPhiRef.current = -deltaY * sensitivity;

    cameraAngleThetaRef.current += velocityThetaRef.current;
    cameraAnglePhiRef.current += velocityPhiRef.current;
    cameraAnglePhiRef.current = Math.max(0.02, Math.min(Math.PI - 0.05, cameraAnglePhiRef.current));
    updateCameraPos();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    touchPinchDistRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Detección de clic limpio (desplazamiento < 6 píxeles) para selección por Raycaster
    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    if (Math.hypot(dx, dy) < 6) {
      const container = mountRef.current;
      if (container && cameraRef.current && sceneRef.current) {
        const rect = container.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

        const tubesGroup = sceneRef.current.getObjectByName('tubes_group') || sceneRef.current.getObjectByName('tubos_estructurales');
        if (tubesGroup) {
          const intersects = raycaster.intersectObjects(tubesGroup.children, true)
            .filter(i => i.object instanceof THREE.Mesh);
          if (intersects.length > 0) {
            let hit = intersects[0].object;
            let segId = hit.userData?.segmentId;
            if (!segId && hit.parent && hit.parent.userData?.segmentId) {
              segId = hit.parent.userData.segmentId;
            }
            if (segId) {
              if (e.shiftKey) {
                const currentIds = engineState?.selectedElementIds || (selectedSegmentId ? [selectedSegmentId] : []);
                const updated = currentIds.includes(segId)
                  ? currentIds.filter(id => id !== segId)
                  : [...currentIds, segId];
                if (engineState?.setSelectedElementIds) {
                  engineState.setSelectedElementIds(updated);
                }
                setSelectedSegmentId(updated[0] || null);
              } else {
                setSelectedSegmentId(segId);
                if (engineState?.setSelectedElementIds) {
                  engineState.setSelectedElementIds([segId]);
                }
              }
              const segObj = segments[segId];
              if (segObj) {
                setTempChosenProfileId(segObj.profileId);
              }
              if (onSelectElement) {
                onSelectElement(segId, 'segment');
              }
              return;
            }
          }
        }
        // Clic en el espacio vacío: deseleccionar
        setSelectedSegmentId(null);
        if (engineState?.setSelectedElementIds) {
          engineState.setSelectedElementIds([]);
        }
      }
    }
  };

  // Resaltado visual en tiempo real en la escena 3D de los tubos seleccionados
  useEffect(() => {
    if (!sceneRef.current) return;
    const tubesGroup = sceneRef.current.getObjectByName('tubes_group') || sceneRef.current.getObjectByName('tubos_estructurales');
    if (!tubesGroup) return;

    const allSelectedIds = new Set(engineState?.selectedElementIds || []);
    if (activeSelectedSegId) allSelectedIds.add(activeSelectedSegId);

    tubesGroup.children.forEach(child => {
      const mesh = child as THREE.Mesh;
      const segId = mesh.userData?.segmentId;
      const isSelected = !!segId && allSelectedIds.has(segId);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        if (isSelected) {
          mat.emissive = new THREE.Color(0x06b6d4); // Cyan brillante
          mat.emissiveIntensity = 0.9;
        } else {
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0.0;
        }
      }
    });
  }, [activeSelectedSegId, engineState?.selectedElementIds]);

  // Soporte táctil de 2 dedos (Pinch-to-Zoom ultra-cercano en teléfonos móviles y tablets)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchPinchDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = touchPinchDistRef.current - dist;
      touchPinchDistRef.current = dist;
      // Proximidad ultra-cercana hasta 0.15 metros sin cortarse
      cameraRadiusRef.current = Math.max(0.15, Math.min(60, cameraRadiusRef.current + delta * 0.04));
      updateCameraPos();
    }
  };

  const handleTouchEnd = () => {
    touchPinchDistRef.current = null;
  };

  // Zoom por rueda de ratón con proximidad ultra-cercana
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * 0.008;
    cameraRadiusRef.current = Math.max(0.15, Math.min(60, cameraRadiusRef.current + zoomFactor));
    updateCameraPos();
  };

  // Botones de Zoom e Inspección de Proximidad
  const handleZoomIn = () => {
    cameraRadiusRef.current = Math.max(0.15, cameraRadiusRef.current * 0.70);
    updateCameraPos();
  };

  const handleZoomOut = () => {
    cameraRadiusRef.current = Math.min(60, cameraRadiusRef.current * 1.30);
    updateCameraPos();
  };

  // Grabar un video del visor 3D con un giro lento de 360° y descargarlo.
  const recorderRef = useRef<MediaRecorder | null>(null);
  const handleRecord3D = () => {
    // Si ya está grabando, detener y descargar.
    if (isRecording) {
      recorderRef.current?.stop();
      return;
    }
    const canvas = rendererRef.current?.domElement as HTMLCanvasElement | undefined;
    if (!canvas || typeof (canvas as any).captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      alert('La grabación de video no está disponible en este navegador. Prueba con Chrome o Edge actualizados.');
      return;
    }

    try {
      const stream = (canvas as any).captureStream(30) as MediaStream;
      const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find(m => (MediaRecorder as any).isTypeSupported?.(m)) || 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `techo_3d_${new Date().toISOString().split('T')[0]}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setIsRecording(false);
      };

      // Giro lento automático durante la grabación (una vuelta completa).
      const prevAuto = autoRotateRef.current;
      setAutoRotate(true);
      recorder.start();
      setIsRecording(true);

      // ~14 s = una vuelta lenta y suave; luego detener automáticamente.
      window.setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
        if (!prevAuto) setAutoRotate(false);
      }, 14000);
    } catch (err: any) {
      console.warn('No se pudo iniciar la grabación 3D:', err);
      alert('No se pudo iniciar la grabación: ' + (err?.message || err));
      setIsRecording(false);
    }
  };

  // Modos de Proximidad Directa
  const setProximityCloseInspection = () => {
    cameraRadiusRef.current = 0.60; // Inspección ultra-cercana de perfiles
    cameraAnglePhiRef.current = 0.60;
    updateCameraPos();
  };

  const setProximityCenteredView = () => {
    resetCamera();
  };

  const setProximityPanoramicView = () => {
    cameraRadiusRef.current = 25.0; // Vista panorámica amplia
    updateCameraPos();
  };

  const resetCamera = useCallback(() => {
    const nodeArray = Object.values(nodes);
    if (nodeArray.length > 0) {
      const avgX = nodeArray.reduce((sum, n) => sum + n.x, 0) / nodeArray.length;
      const avgY = nodeArray.reduce((sum, n) => sum + n.y, 0) / nodeArray.length;
      const avgZ = nodeArray.reduce((sum, n) => sum + (n.z || 0), 0) / nodeArray.length;
      cameraTargetRef.current.set(avgX, Math.max(2, avgY), avgZ);
      const spanX = Math.max(...nodeArray.map(n => n.x)) - Math.min(...nodeArray.map(n => n.x));
      const spanZ = Math.max(...nodeArray.map(n => n.z || 0)) - Math.min(...nodeArray.map(n => n.z || 0));
      cameraRadiusRef.current = Math.max(10, Math.max(spanX, spanZ) * 1.5);
    } else {
      cameraTargetRef.current.set(6, 3.5, 6);
      cameraRadiusRef.current = 16;
    }
    cameraAngleThetaRef.current = 0.65;
    cameraAnglePhiRef.current = 0.48;
    updateCameraPos();
  }, [nodes, updateCameraPos]);

  // Estado de minimización del HUD (Inicia minimizado por defecto para no estorbar en móviles)
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(true);

  // Aplicar optimización completa de perfiles con un solo clic según Norma E.090
  const handleApplyAllOptimizations = () => {
    if (!engineState) {
      alert("⚠️ Motor CAD no disponible en este momento.");
      return;
    }
    const { segments, updateMultipleSegmentsProfile } = engineState;
    const allSegs = Object.values(segments);
    if (allSegs.length === 0) {
      alert("⚠️ No hay elementos estructurales en el modelo. Dibuja o genera un techo primero.");
      return;
    }

    const colSegs: string[] = [];
    const diagSegs: string[] = [];
    const cordonSegs: string[] = [];
    const correaSegs: string[] = [];

    allSegs.forEach(seg => {
      const rol = seg.rolEstructural || '';
      if (rol === 'columna' || (!rol && seg.nodeAId && nodes[seg.nodeAId]?.y < 1.0)) {
        colSegs.push(seg.id);
      } else if (rol === 'diagonal' || rol === 'montante') {
        diagSegs.push(seg.id);
      } else if (rol === 'cordon_superior' || rol === 'cordon_inferior' || rol === 'viga_principal' || !rol) {
        cordonSegs.push(seg.id);
      } else {
        correaSegs.push(seg.id);
      }
    });

    if (colSegs.length > 0) updateMultipleSegmentsProfile(colSegs, 'perfil_sq_4x4_30', 'columna');
    if (cordonSegs.length > 0) updateMultipleSegmentsProfile(cordonSegs, 'perfil_rec_4x2_25', 'cordon_superior');
    if (diagSegs.length > 0) updateMultipleSegmentsProfile(diagSegs, 'perfil_sq_2x2_20', 'diagonal');
    if (correaSegs.length > 0) updateMultipleSegmentsProfile(correaSegs, 'perfil_c_4x2_20', 'correa');

    alert("⚡ ¡Optimización y perfiles recomendados según Norma E.090 aplicados con éxito a todos los elementos del modelo!");
  };

  // Cambiar perfil por zona estructural directamente desde el panel
  const handleZoneProfileChange = (rolKey: string, newProfileId: string) => {
    if (!engineState) return;
    const { segments, updateMultipleSegmentsProfile } = engineState;
    const segIds = Object.values(segments)
      .filter(s => {
        if (rolKey === 'columna') return s.rolEstructural === 'columna';
        if (rolKey === 'diagonal') return s.rolEstructural === 'diagonal' || s.rolEstructural === 'montante';
        if (rolKey === 'cordon_superior') return s.rolEstructural === 'cordon_superior' || s.rolEstructural === 'cordon_inferior' || s.rolEstructural === 'viga_principal';
        if (rolKey === 'correa') return s.rolEstructural === 'correa' || s.rolEstructural === 'arriostre';
        return false;
      })
      .map(s => s.id);

    if (segIds.length > 0) {
      updateMultipleSegmentsProfile(segIds, newProfileId);
    }
  };

  // Función matemática precisa para calcular la cota de la cubierta, normales y pendiente física en cualquier coordenada X
  const evaluateRoofHeightAtX = useCallback((x: number, topPoints: { x: number; y: number }[]): { y: number; nx: number; ny: number; slope: number } => {
    if (topPoints.length === 0) return { y: 4.5, nx: 0, ny: 1, slope: 0 };
    if (topPoints.length === 1) return { y: topPoints[0].y, nx: 0, ny: 1, slope: 0 };

    // Fuera del límite izquierdo
    if (x <= topPoints[0].x) {
      const p0 = topPoints[0];
      const p1 = topPoints[1];
      const slope = (p1.y - p0.y) / Math.max(0.001, p1.x - p0.x);
      const yVal = p0.y + slope * (x - p0.x);
      const len = Math.sqrt(slope * slope + 1);
      return { y: yVal, nx: -slope / len, ny: 1 / len, slope };
    }

    // Fuera del límite derecho
    const lastIdx = topPoints.length - 1;
    if (x >= topPoints[lastIdx].x) {
      const pPrev = topPoints[lastIdx - 1];
      const pLast = topPoints[lastIdx];
      const slope = (pLast.y - pPrev.y) / Math.max(0.001, pLast.x - pPrev.x);
      const yVal = pLast.y + slope * (x - pLast.x);
      const len = Math.sqrt(slope * slope + 1);
      return { y: yVal, nx: -slope / len, ny: 1 / len, slope };
    }

    // Tramo intermedio
    for (let i = 0; i < topPoints.length - 1; i++) {
      const pA = topPoints[i];
      const pB = topPoints[i + 1];
      if (x >= pA.x && x <= pB.x) {
        const span = Math.max(0.001, pB.x - pA.x);
        const t = (x - pA.x) / span;
        const slope = (pB.y - pA.y) / span;
        const yVal = pA.y + t * (pB.y - pA.y);
        const len = Math.sqrt(slope * slope + 1);
        return { y: yVal, nx: -slope / len, ny: 1 / len, slope };
      }
    }

    return { y: topPoints[0].y, nx: 0, ny: 1, slope: 0 };
  }, []);

  // Evaluación tridimensional exacta de cota Y y vector normal (Considerando 4 aguas, 6 aguas y naves compuestas)
  const evaluateRoofHeightAtXZ = useCallback((
    x: number,
    z: number,
    topPoints: { x: number; y: number }[],
    roofMeta?: any
  ): { y: number; nx: number; ny: number; nz: number; slope: number } => {
    if (roofMeta?.isHipRoof && roofMeta?.hipParams) {
      const { minX, maxX, minZ, maxZ, yEave, yRidge, zRidge1, zRidge2, xMid } = roofMeta.hipParams;
      const distL = Math.max(0, x - minX);
      const distR = Math.max(0, maxX - x);
      const distF = Math.max(0, z - minZ);
      const distB = Math.max(0, maxZ - z);

      const spanXHalf = Math.max(0.01, xMid - minX);
      const spanZF = Math.max(0.01, zRidge1 - minZ);
      const spanZB = Math.max(0.01, maxZ - zRidge2);

      const slopeX = (yRidge - yEave) / spanXHalf;
      const slopeZF = (yRidge - yEave) / spanZF;
      const slopeZB = (yRidge - yEave) / spanZB;

      const yL = yEave + distL * slopeX;
      const yR = yEave + distR * slopeX;
      const yF = yEave + distF * slopeZF;
      const yB = yEave + distB * slopeZB;

      const minY = Math.min(yL, yR, yF, yB);
      const finalY = Math.min(yRidge, Math.max(yEave, minY));

      if (finalY === yF) return { y: finalY, nx: 0, ny: 1, nz: -slopeZF * 0.1, slope: slopeZF };
      if (finalY === yB) return { y: finalY, nx: 0, ny: 1, nz: slopeZB * 0.1, slope: slopeZB };
      if (finalY === yL) return { y: finalY, nx: -slopeX * 0.1, ny: 1, nz: 0, slope: slopeX };
      return { y: finalY, nx: slopeX * 0.1, ny: 1, nz: 0, slope: slopeX };
    }

    if (roofMeta?.is6AguasRoof && roofMeta?.hexParams) {
      const { cX, cZ, yPeak, yEave, rAvg } = roofMeta.hexParams;
      const distCenter = Math.hypot(x - cX, z - cZ);
      const u = Math.min(1, distCenter / Math.max(0.1, rAvg));
      const finalY = yPeak - u * (yPeak - yEave);
      const radialDir = new THREE.Vector2(x - cX, z - cZ).normalize();
      return { y: finalY, nx: radialDir.x * 0.1, ny: 1, nz: radialDir.y * 0.1, slope: (yPeak - yEave) / rAvg };
    }

    const { y, nx, ny, slope } = evaluateRoofHeightAtX(x, topPoints);
    return { y, nx, ny, nz: 0, slope };
  }, [evaluateRoofHeightAtX]);

  // Función para calcular la onda trapezoidal exacta del Aluzinc TR-4 / TR-5 / Calamina
  const getRibHeightProfile = (
    zPos: number,
    freq: number,
    height: number,
    tipo: string
  ): { offset: number; slopeZ: number } => {
    if (tipo === 'calamina_ondulada') {
      const period = 1 / Math.max(1, freq);
      const phase = ((zPos % period) + period) % period;
      const angle = (phase / period) * Math.PI * 2;
      const amp = height * 0.5;
      return {
        offset: Math.sin(angle) * amp,
        slopeZ: Math.cos(angle) * amp * (Math.PI * 2 / period)
      };
    }

    // Perfil Trapezoidal TR-4 / TR-5 (Estándar Aluzinc Perú)
    const period = 1 / Math.max(1, freq);
    const phase = ((zPos % period) + period) % period;
    const u = phase / period; // 0.0 a 1.0

    // Geometría trapezoidal con cresta plana de 20%, flancos inclinados de 15% y valles de 50%
    const riseRatio = 0.15;
    const crownRatio = 0.20;
    const fallRatio = 0.15;

    if (u < riseRatio) {
      // Flanco de subida
      const t = u / riseRatio;
      return {
        offset: t * height,
        slopeZ: height / (riseRatio * period)
      };
    } else if (u < riseRatio + crownRatio) {
      // Cresta plana superior (Crown)
      return {
        offset: height,
        slopeZ: 0
      };
    } else if (u < riseRatio + crownRatio + fallRatio) {
      // Flanco de bajada
      const t = (u - (riseRatio + crownRatio)) / fallRatio;
      return {
        offset: (1 - t) * height,
        slopeZ: -height / (fallRatio * period)
      };
    } else {
      // Valle plano inferior (Valley)
      return {
        offset: 0,
        slopeZ: 0
      };
    }
  };

  // Generador Adaptativo y Continuo de Geometría de Aluzinc TR-4 de Alta Fidelidad (Con crestas trapezoidales y volumen real)
  const createAdaptiveAluzincGeometry = (
    topPoints: { x: number; y: number }[],
    minZ: number,
    maxZ: number,
    overhangX: number = 0.35,
    overhangZ: number = 0.35
  ): THREE.BufferGeometry => {
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const activeModel = MODELOS_ALUZINC_PERU.find(m => m.id === selectedModeloId) || MODELOS_ALUZINC_PERU[0];
    const isSandwich = activeModel.tipo === 'termoacustico';

    const minX = topPoints[0]?.x ?? 0;
    const maxX = topPoints[topPoints.length - 1]?.x ?? 12;
    const totalSpanX = (maxX - minX) + overhangX * 2;
    const totalZ = (maxZ - minZ) + overhangZ * 2;

    // Alta resolución de malla para facetado trapezoidal nítido
    const ribFreq = Math.max(3, activeModel.ribCountPerMeter);
    const ribHeightM = (activeModel.ribHeightMm || 35) / 1000; // 0.035m a 0.045m
    const sheetThicknessM = Math.max(0.002, (activeModel.espesorMm || 0.40) / 1000);

    // Cantidad de subdivisiones en Z para capturar cada flanco trapezoidal
    const segmentsZ = Math.max(140, Math.round(totalZ * ribFreq * 6));
    const segmentsX = Math.max(100, Math.round(totalSpanX * 16));

    const dx = totalSpanX / segmentsX;
    const dz = totalZ / segmentsZ;

    // Asiento exacto sobre las correas superiores
    const purlinClearance = 0.040; // 40mm sobre el eje del cordón/correa
    const baseCoreThickness = isSandwich ? (activeModel.espesorMm / 1000) : 0;
    const bottomClearance = purlinClearance;
    const topClearance = purlinClearance + baseCoreThickness + sheetThicknessM;

    // Cara Superior (Top Shell)
    const vertexOffsetTop = 0;
    for (let iz = 0; iz <= segmentsZ; iz++) {
      const zWorld = (minZ - overhangZ) + iz * dz;
      const { offset: ribVal } = getRibHeightProfile(zWorld, ribFreq, ribHeightM, activeModel.tipo);

      for (let ix = 0; ix <= segmentsX; ix++) {
        const xWorld = (minX - overhangX) + ix * dx;
        const { y: yBase, nx, ny } = evaluateRoofHeightAtX(xWorld, topPoints);

        const totalElev = topClearance + ribVal;
        const finalX = xWorld + nx * totalElev;
        const finalY = yBase + ny * totalElev;

        vertices.push(finalX, finalY, zWorld);
        normals.push(nx, ny, 0);
        uvs.push(ix / segmentsX, iz / segmentsZ);
      }
    }

    // Triangulación Cara Superior
    for (let iz = 0; iz < segmentsZ; iz++) {
      for (let ix = 0; ix < segmentsX; ix++) {
        const a = vertexOffsetTop + iz * (segmentsX + 1) + ix;
        const b = a + 1;
        const c = a + (segmentsX + 1);
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    // Cara Inferior (Bottom Shell para paneles sándwich y vista interior sólida)
    const vertexOffsetBottom = (segmentsZ + 1) * (segmentsX + 1);
    for (let iz = 0; iz <= segmentsZ; iz++) {
      const zWorld = (minZ - overhangZ) + iz * dz;
      // Para sándwich o plancha, la base inferior es lisa o con micro-nervaduras
      const ribBottom = isSandwich ? 0 : getRibHeightProfile(zWorld, ribFreq, ribHeightM * 0.95, activeModel.tipo).offset;

      for (let ix = 0; ix <= segmentsX; ix++) {
        const xWorld = (minX - overhangX) + ix * dx;
        const { y: yBase, nx, ny } = evaluateRoofHeightAtX(xWorld, topPoints);

        const totalElev = bottomClearance + ribBottom;
        const finalX = xWorld + nx * totalElev;
        const finalY = yBase + ny * totalElev;

        vertices.push(finalX, finalY, zWorld);
        normals.push(-nx, -ny, 0);
        uvs.push(ix / segmentsX, iz / segmentsZ);
      }
    }

    // Triangulación Cara Inferior (orden inverso para normales hacia adentro)
    for (let iz = 0; iz < segmentsZ; iz++) {
      for (let ix = 0; ix < segmentsX; ix++) {
        const a = vertexOffsetBottom + iz * (segmentsX + 1) + ix;
        const b = a + 1;
        const c = a + (segmentsX + 1);
        const d = c + 1;

        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    // Bordes Laterales (Cierre perimetral de aleros y testeros)
    // Borde Izquierdo (ix = 0)
    for (let iz = 0; iz < segmentsZ; iz++) {
      const topA = vertexOffsetTop + iz * (segmentsX + 1);
      const topB = vertexOffsetTop + (iz + 1) * (segmentsX + 1);
      const botA = vertexOffsetBottom + iz * (segmentsX + 1);
      const botB = vertexOffsetBottom + (iz + 1) * (segmentsX + 1);

      indices.push(topA, botA, topB);
      indices.push(botA, botB, topB);
    }

    // Borde Derecho (ix = segmentsX)
    for (let iz = 0; iz < segmentsZ; iz++) {
      const topA = vertexOffsetTop + iz * (segmentsX + 1) + segmentsX;
      const topB = vertexOffsetTop + (iz + 1) * (segmentsX + 1) + segmentsX;
      const botA = vertexOffsetBottom + iz * (segmentsX + 1) + segmentsX;
      const botB = vertexOffsetBottom + (iz + 1) * (segmentsX + 1) + segmentsX;

      indices.push(topA, topB, botA);
      indices.push(topB, botB, botA);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);

    // Grupos de materiales para Aluzinc Doble Cara (Grupo 0: Exterior Comercial, Grupo 1: Interior Blanco Poliéster de Fábrica)
    const topIndicesCount = segmentsZ * segmentsX * 6;
    geom.addGroup(0, topIndicesCount, 0);
    geom.addGroup(topIndicesCount, indices.length - topIndicesCount, 1);

    geom.computeVertexNormals();
    return geom;
  };

  // Generador Especializado de Cobertura para Techos a Cuatro Aguas (Hip Roof / Piramidal)
  const createHipRoofGeometry = (
    params: {
      minX: number;
      maxX: number;
      minZ: number;
      maxZ: number;
      yEave: number;
      yRidge: number;
      zRidge1: number;
      zRidge2: number;
      xMid: number;
    },
    activeModel: any,
    aluzincColorHex: number,
    isSandwich: boolean,
    aluzincMatTop: THREE.Material
  ): THREE.Group => {
    const hipGroup = new THREE.Group();
    const overhangX = 0.35;
    const overhangZ = 0.35;

    const { minX, maxX, minZ, maxZ, yEave, yRidge, zRidge1, zRidge2, xMid } = params;

    const ribFreq = Math.max(3, activeModel.ribCountPerMeter || 3.3);
    const ribHeightM = (activeModel.ribHeightMm || 35) / 1000;
    const sheetThicknessM = Math.max(0.002, (activeModel.espesorMm || 0.40) / 1000);
    const purlinClearance = 0.040;
    const baseCoreThickness = isSandwich ? ((activeModel.espesorMm || 50) / 1000) : 0;
    const topClearance = purlinClearance + baseCoreThickness + sheetThicknessM;

    const yEaveAdj = yEave + topClearance;
    const yRidgeAdj = yRidge + topClearance;

    // Vértices clave de la estructura a 4 aguas con aleros
    const P_c1 = new THREE.Vector3(minX - overhangX, yEaveAdj, minZ - overhangZ);
    const P_c2 = new THREE.Vector3(maxX + overhangX, yEaveAdj, minZ - overhangZ);
    const P_c3 = new THREE.Vector3(maxX + overhangX, yEaveAdj, maxZ + overhangZ);
    const P_c4 = new THREE.Vector3(minX - overhangX, yEaveAdj, maxZ + overhangZ);

    const R1 = new THREE.Vector3(xMid, yRidgeAdj, zRidge1);
    const R2 = new THREE.Vector3(xMid, yRidgeAdj, zRidge2);

    const allVertices: number[] = [];
    const allNormals: number[] = [];
    const allUvs: number[] = [];
    const allIndices: number[] = [];

    // Función auxiliar para agregar una cara trapezoidal o triangular subdividida
    const addSubdividedFace = (
      vEaveA: THREE.Vector3,
      vEaveB: THREE.Vector3,
      vRidgeA: THREE.Vector3,
      vRidgeB: THREE.Vector3,
      isTriangle: boolean,
      ribAxis: 'x' | 'z'
    ) => {
      const segsSlope = 36;
      const segsWidth = 36;
      const baseIdx = allVertices.length / 3;

      // Calcular normal matemática exacta de la cara plana
      const vDirW = new THREE.Vector3().subVectors(vEaveB, vEaveA);
      const vDirS = new THREE.Vector3().subVectors(vRidgeA, vEaveA);
      let faceNormal = new THREE.Vector3().crossVectors(vDirW, vDirS).normalize();
      if (faceNormal.y < 0) faceNormal.negate();
      if (faceNormal.lengthSq() < 0.001) faceNormal.set(0, 1, 0);

      for (let is = 0; is <= segsSlope; is++) {
        const v = is / segsSlope; // 0 = eave, 1 = ridge
        for (let iw = 0; iw <= segsWidth; iw++) {
          const u = iw / segsWidth;

          const pEave = new THREE.Vector3().lerpVectors(vEaveA, vEaveB, u);
          const pRidge = isTriangle 
            ? vRidgeA.clone() 
            : new THREE.Vector3().lerpVectors(vRidgeA, vRidgeB, u);

          const pBase = new THREE.Vector3().lerpVectors(pEave, pRidge, v);

          // Crestas trapezoidales
          const coord = ribAxis === 'z' ? pBase.z : pBase.x;
          const { offset: ribVal } = getRibHeightProfile(coord, ribFreq, ribHeightM, activeModel.tipo);

          const pFinal = pBase.clone().addScaledVector(faceNormal, ribVal);

          allVertices.push(pFinal.x, pFinal.y, pFinal.z);
          allNormals.push(faceNormal.x, faceNormal.y, faceNormal.z);
          allUvs.push(u, v);
        }
      }

      for (let is = 0; is < segsSlope; is++) {
        for (let iw = 0; iw < segsWidth; iw++) {
          const a = baseIdx + is * (segsWidth + 1) + iw;
          const b = a + 1;
          const c = a + (segsWidth + 1);
          const d = c + 1;

          allIndices.push(a, b, c);
          allIndices.push(b, d, c);
        }
      }
    };

    // 1. Faldón Izquierdo (Trapecio)
    addSubdividedFace(P_c1, P_c4, R1, R2, false, 'z');

    // 2. Faldón Derecho (Trapecio)
    addSubdividedFace(P_c3, P_c2, R2, R1, false, 'z');

    // 3. Faldón Frontal (Triángulo)
    addSubdividedFace(P_c1, P_c2, R1, R1, true, 'x');

    // 4. Faldón Posterior (Triángulo)
    addSubdividedFace(P_c3, P_c4, R2, R2, true, 'x');

    const hipGeom = new THREE.BufferGeometry();
    hipGeom.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
    hipGeom.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3));
    hipGeom.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2));
    hipGeom.setIndex(allIndices);
    hipGeom.computeVertexNormals();

    const hipMat = (aluzincMatTop as THREE.MeshStandardMaterial).clone();
    hipMat.side = THREE.DoubleSide;

    const roofMesh = new THREE.Mesh(hipGeom, hipMat);
    roofMesh.name = 'cobertura_malla_hip';
    hipGroup.add(roofMesh);

    // Material para Caballetes de Cumbrera y Limatesas Plegadas
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: aluzincColorHex,
      metalness: 0.85,
      roughness: 0.25
    });

    // Cumbrera central horizontal (si no es pirámide pura puntual)
    if (zRidge2 > zRidge1 + 0.15) {
      const ridgeLen = (zRidge2 - zRidge1) + 0.40;
      const ridgeGeo = new THREE.BoxGeometry(0.35, 0.05, ridgeLen);
      const ridgeMesh = new THREE.Mesh(ridgeGeo, ridgeMat);
      ridgeMesh.position.set(xMid, yRidgeAdj + 0.03, (zRidge1 + zRidge2) / 2);
      ridgeMesh.name = 'cumbrera_hip';
      hipGroup.add(ridgeMesh);
    }

    // Cuatro Limatesas Plegadas (Caballetes Diagonales de Esquinas a Cumbrera)
    const hipLines = [
      { start: P_c1, end: R1 },
      { start: P_c2, end: R1 },
      { start: P_c3, end: R2 },
      { start: P_c4, end: R2 }
    ];

    hipLines.forEach((line, idx) => {
      const dir = new THREE.Vector3().subVectors(line.end, line.start);
      const len = dir.length();
      if (len > 0.1) {
        dir.normalize();
        const limGeo = new THREE.BoxGeometry(0.28, 0.04, len);
        const limMesh = new THREE.Mesh(limGeo, ridgeMat);
        const midP = new THREE.Vector3().addVectors(line.start, line.end).multiplyScalar(0.5);
        midP.y += 0.025;
        limMesh.position.copy(midP);
        limMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        limMesh.name = `limatesa_hip_${idx + 1}`;
        hipGroup.add(limMesh);
      }
    });

    return hipGroup;
  };

  // Generador Especializado de Cobertura para Techos a Seis Aguas (Hexagonal Pavilion)
  const createHex6AguasRoofGeometry = (
    cX: number,
    cZ: number,
    yPeak: number,
    hexCorners: { x: number; y: number; z: number }[],
    activeModel: any,
    aluzincColorHex: number,
    isSandwich: boolean,
    aluzincMatTop: THREE.Material
  ): THREE.Group => {
    const hexGroup = new THREE.Group();
    const overhang = 0.35;

    const ribFreq = Math.max(3, activeModel.ribCountPerMeter || 3.3);
    const ribHeightM = (activeModel.ribHeightMm || 35) / 1000;
    const sheetThicknessM = Math.max(0.002, (activeModel.espesorMm || 0.40) / 1000);
    const purlinClearance = 0.040;
    const baseCoreThickness = isSandwich ? ((activeModel.espesorMm || 50) / 1000) : 0;
    const topClearance = purlinClearance + baseCoreThickness + sheetThicknessM;

    const pApex = new THREE.Vector3(cX, yPeak + topClearance, cZ);

    // Esquinas con alero perimetral radial
    const extendedCorners = hexCorners.map(c => {
      const vRadial = new THREE.Vector3(c.x - cX, 0, c.z - cZ).normalize();
      return new THREE.Vector3(
        c.x + vRadial.x * overhang, 
        c.y + topClearance, 
        c.z + vRadial.z * overhang
      );
    });

    const allVertices: number[] = [];
    const allNormals: number[] = [];
    const allUvs: number[] = [];
    const allIndices: number[] = [];

    const numCorners = extendedCorners.length;
    const segsSlope = 36;
    const segsWidth = 36;

    for (let k = 0; k < numCorners; k++) {
      const nextK = (k + 1) % numCorners;
      const pA = extendedCorners[k];
      const pB = extendedCorners[nextK];
      const baseIdx = allVertices.length / 3;

      // Vector normal a la cara triangular
      const edgeAB = new THREE.Vector3().subVectors(pB, pA);
      const edgeApex = new THREE.Vector3().subVectors(pApex, pA);
      let normal = new THREE.Vector3().crossVectors(edgeAB, edgeApex).normalize();
      if (normal.y < 0) normal.negate();
      if (normal.lengthSq() < 0.001) normal.set(0, 1, 0);

      for (let is = 0; is <= segsSlope; is++) {
        const v = is / segsSlope; // 0 = eave, 1 = apex
        for (let iw = 0; iw <= segsWidth; iw++) {
          const u = iw / segsWidth;

          const pEave = new THREE.Vector3().lerpVectors(pA, pB, u);
          const pBase = new THREE.Vector3().lerpVectors(pEave, pApex, v);

          // Crestas trapezoidales a lo ancho del faldón
          const distAlongWidth = pBase.distanceTo(pA);
          const { offset: ribVal } = getRibHeightProfile(distAlongWidth, ribFreq, ribHeightM, activeModel.tipo);

          const pFinal = pBase.clone().addScaledVector(normal, ribVal);

          allVertices.push(pFinal.x, pFinal.y, pFinal.z);
          allNormals.push(normal.x, normal.y, normal.z);
          allUvs.push(u, v);
        }
      }

      for (let is = 0; is < segsSlope; is++) {
        for (let iw = 0; iw < segsWidth; iw++) {
          const a = baseIdx + is * (segsWidth + 1) + iw;
          const b = a + 1;
          const c = a + (segsWidth + 1);
          const d = c + 1;

          allIndices.push(a, b, c);
          allIndices.push(b, d, c);
        }
      }
    }

    const hexGeom = new THREE.BufferGeometry();
    hexGeom.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
    hexGeom.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3));
    hexGeom.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2));
    hexGeom.setIndex(allIndices);
    hexGeom.computeVertexNormals();

    const hexMat = (aluzincMatTop as THREE.MeshStandardMaterial).clone();
    hexMat.side = THREE.DoubleSide;

    const roofMesh = new THREE.Mesh(hexGeom, hexMat);
    roofMesh.name = 'cobertura_malla_hex';
    hexGroup.add(roofMesh);

    // Material para limatesas y sombrerete
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: aluzincColorHex,
      metalness: 0.85,
      roughness: 0.25
    });

    // Seis Limatesas Radiales
    extendedCorners.forEach((c, idx) => {
      const dir = new THREE.Vector3().subVectors(c, pApex);
      const len = dir.length();
      if (len > 0.1) {
        dir.normalize();
        const limGeo = new THREE.BoxGeometry(0.25, 0.04, len);
        const limMesh = new THREE.Mesh(limGeo, ridgeMat);
        const midP = new THREE.Vector3().addVectors(pApex, c).multiplyScalar(0.5);
        midP.y += 0.025;
        limMesh.position.copy(midP);
        limMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        limMesh.name = `limatesa_hex_${idx + 1}`;
        hexGroup.add(limMesh);
      }
    });

    // Sombrerete / Remate Hexagonal Central de Cúspide
    const capGeo = new THREE.ConeGeometry(0.45, 0.16, numCorners);
    const capMesh = new THREE.Mesh(capGeo, ridgeMat);
    capMesh.position.set(cX, yPeak + topClearance + 0.08, cZ);
    capMesh.name = 'sombrerete_hex_apex';
    hexGroup.add(capMesh);

    return hexGroup;
  };

  // Generador Especializado de Cobertura para Techos Tipo Domo / Cúpula Esférica Radial
  const createDomeRoofGeometry = (
    cX: number,
    cZ: number,
    yPeak: number,
    yEave: number,
    radius: number,
    numRibs: number,
    activeModel: any,
    aluzincColorHex: number,
    isSandwich: boolean,
    aluzincMatTop: THREE.Material
  ): THREE.Group => {
    const domeGroup = new THREE.Group();
    const overhang = 0.30;
    const R = Math.max(2.0, radius + overhang);

    const ribFreq = Math.max(3, activeModel.ribCountPerMeter || 3.3);
    const ribHeightM = (activeModel.ribHeightMm || 35) / 1000;
    const sheetThicknessM = Math.max(0.002, (activeModel.espesorMm || 0.40) / 1000);
    const purlinClearance = 0.040;
    const baseCoreThickness = isSandwich ? ((activeModel.espesorMm || 50) / 1000) : 0;
    const topClearance = purlinClearance + baseCoreThickness + sheetThicknessM;

    const yPeakAdj = yPeak + topClearance;
    const yEaveAdj = yEave + topClearance;
    const flecha = Math.max(0.5, yPeakAdj - yEaveAdj);

    const allVertices: number[] = [];
    const allNormals: number[] = [];
    const allUvs: number[] = [];
    const allIndices: number[] = [];

    const sectors = Math.max(8, numRibs || 12);
    const rings = 24;

    for (let s = 0; s < sectors; s++) {
      const a1 = (s * 2 * Math.PI) / sectors;
      const a2 = ((s + 1) * 2 * Math.PI) / sectors;
      const baseIdx = allVertices.length / 3;

      const segsWidth = 6;
      for (let ir = 0; ir <= rings; ir++) {
        const v = ir / rings; // 0 = eave, 1 = apex
        const currentR = R * (1 - v);
        // Perfil parabólico suave de cúpula
        const currentY = yEaveAdj + flecha * (1 - Math.pow(v - 1, 2));

        for (let iw = 0; iw <= segsWidth; iw++) {
          const u = iw / segsWidth;
          const angle = a1 + u * (a2 - a1);
          const x = cX + currentR * Math.cos(angle);
          const z = cZ + currentR * Math.sin(angle);
          const y = currentY;

          // Normal direction from curvature
          const normX = Math.cos(angle) * (1 - v * 0.5);
          const normZ = Math.sin(angle) * (1 - v * 0.5);
          const normY = Math.max(0.25, v + 0.35);
          const normal = new THREE.Vector3(normX, normY, normZ).normalize();

          const distAlongArc = (1 - v) * R;
          const { offset: ribVal } = getRibHeightProfile(distAlongArc, ribFreq, ribHeightM, activeModel.tipo);
          const pos = new THREE.Vector3(x, y, z).addScaledVector(normal, ribVal * (1 - v * 0.7));

          allVertices.push(pos.x, pos.y, pos.z);
          allNormals.push(normal.x, normal.y, normal.z);
          allUvs.push(u, v);
        }
      }

      for (let ir = 0; ir < rings; ir++) {
        for (let iw = 0; iw < segsWidth; iw++) {
          const a = baseIdx + ir * (segsWidth + 1) + iw;
          const b = a + 1;
          const c = a + (segsWidth + 1);
          const d = c + 1;

          allIndices.push(a, b, c);
          allIndices.push(b, d, c);
        }
      }
    }

    const domeGeom = new THREE.BufferGeometry();
    domeGeom.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
    domeGeom.setAttribute('normal', new THREE.Float32BufferAttribute(allNormals, 3));
    domeGeom.setAttribute('uv', new THREE.Float32BufferAttribute(allUvs, 2));
    domeGeom.setIndex(allIndices);
    domeGeom.computeVertexNormals();

    const domeMat = (aluzincMatTop as THREE.MeshStandardMaterial).clone();
    domeMat.side = THREE.DoubleSide;

    const domeMesh = new THREE.Mesh(domeGeom, domeMat);
    domeMesh.name = 'cobertura_malla_dome';
    domeGroup.add(domeMesh);

    // Material para remates y arcos
    const ridgeMat = new THREE.MeshStandardMaterial({
      color: aluzincColorHex,
      metalness: 0.85,
      roughness: 0.25
    });

    // Spire / Cúspide central cónica
    const spireGeo = new THREE.ConeGeometry(0.50, 0.40, sectors);
    const spireMesh = new THREE.Mesh(spireGeo, ridgeMat);
    spireMesh.position.set(cX, yPeakAdj + 0.15, cZ);
    spireMesh.name = 'remate_cupula_apex';
    domeGroup.add(spireMesh);

    return domeGroup;
  };

  // Generador de Sistema de Lluvia de Alta Fidelidad: Gotas de Agua Volumétricas con Brillo Especular y Salpicaduras en Techo
  const createRainLineSystem = (
    minX: number, 
    maxX: number, 
    minZ: number, 
    maxZ: number, 
    maxY: number, 
    topProfilePoints: { x: number; y: number }[],
    roofMeta?: any
  ) => {
    const maxDrops = 3000;
    const dropPositions = new Float32Array(maxDrops * 3);
    const dropColors = new Float32Array(maxDrops * 3);
    const velocities = new Float32Array(maxDrops);
    const dropStates = new Uint8Array(maxDrops); // 0 = aire, 1 = flujo sobre plancha, 2 = cortina goteo alero
    const swayOffsets = new Float32Array(maxDrops);

    const spanX = Math.max(8, maxX - minX + 6);
    const spanZ = Math.max(8, maxZ - minZ + 6);

    for (let i = 0; i < maxDrops; i++) {
      dropPositions[i * 3] = minX - 3 + Math.random() * spanX;
      dropPositions[i * 3 + 1] = maxY + 1.0 + Math.random() * 16;
      dropPositions[i * 3 + 2] = minZ - 3 + Math.random() * spanZ;

      // Color celeste agua cristalina con matices
      const cTone = 0.88 + Math.random() * 0.12;
      dropColors[i * 3] = 0.72 * cTone;
      dropColors[i * 3 + 1] = 0.88 * cTone;
      dropColors[i * 3 + 2] = 1.0;

      velocities[i] = 16 + Math.random() * 10;
      dropStates[i] = 0;
      swayOffsets[i] = Math.random() * Math.PI * 2;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(dropPositions, 3));
    rainGeo.setAttribute('color', new THREE.BufferAttribute(dropColors, 3));

    const rainMat = new THREE.PointsMaterial({
      map: getRainDropTexture(),
      size: 0.55,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.75,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.name = 'rain_points';

    // Salpicaduras en techo y suelo (Splash system)
    const maxSplashes = 250;
    const splashPositions = new Float32Array(maxSplashes * 3);
    const splashLifes = new Float32Array(maxSplashes);

    for (let s = 0; s < maxSplashes; s++) {
      splashPositions[s * 3] = 0;
      splashPositions[s * 3 + 1] = -999;
      splashPositions[s * 3 + 2] = 0;
      splashLifes[s] = 0;
    }

    const splashGeo = new THREE.BufferGeometry();
    splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));

    const splashMat = new THREE.PointsMaterial({
      map: getSplashTexture(),
      size: 0.45,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const splashPoints = new THREE.Points(splashGeo, splashMat);
    splashPoints.name = 'splash_points';

    const rainGroup = new THREE.Group();
    rainGroup.name = 'rain_lines';
    rainGroup.add(rainPoints);
    rainGroup.add(splashPoints);

    const peakPoint = (topProfilePoints && topProfilePoints.length > 0)
      ? topProfilePoints.reduce((max, p) => (p.y > max.y ? p : max), topProfilePoints[0])
      : { x: (minX + maxX) / 2, y: maxY };

    rainWaterMetaRef.current = {
      minX, maxX, minZ, maxZ, maxY,
      spanX: maxX - minX,
      topProfilePoints,
      peakX: peakPoint.x,
      velocities,
      dropStates,
      swayOffsets,
      maxDrops,
      rainPoints,
      splashPoints,
      splashPositions,
      splashLifes,
      maxSplashes,
      nextSplashIdx: 0,
      roofMeta
    };

    return rainGroup;
  };

  // Construcción del Modelo 3D con Perfiles Físicos Reales y Nudos de Conexión Soldados
  const construirModelo3D = useCallback((scene: THREE.Scene) => {
    // 1. Limpieza rigurosa de objetos previos
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach(child => {
      if (child.name === 'modelo' || child.name === 'rain_lines' || child.name === 'cobertura_malla') {
        toRemove.push(child);
      }
    });
    toRemove.forEach(c => scene.remove(c));

    const isWire = false;

    // Material para Nudos de Conexión / Esferas de Unión en Vértices (Azul Eléctrico / Acero Azulado como en la imagen)
    const nudoJointMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.65,
      roughness: 0.25,
      wireframe: isWire
    });

    const activeCover = MODELOS_ALUZINC_PERU.find(m => m.id === selectedModeloId) || MODELOS_ALUZINC_PERU[0];
    const isPoly = activeCover.tipo === 'policarbonato';
    const isTransparent = isPoly ? aluzincOpacity < 0.98 : false;
    const finalOpacity = isPoly ? aluzincOpacity : 1.0;

    // Aluzinc Doble Cara Sólido: Cara Exterior (Color Comercial Satinado) + Cara Interior (Fondo Esmalte Blanco de Fábrica #f8fafc)
    const aluzincMatTop = new THREE.MeshStandardMaterial({
      color: aluzincColorHex,
      metalness: isPoly ? 0.05 : 0.35,
      roughness: isPoly ? 0.15 : 0.58,
      side: THREE.FrontSide,
      transparent: isTransparent,
      opacity: finalOpacity,
      wireframe: isWire,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0
    });

    const aluzincMatBottom = new THREE.MeshStandardMaterial({
      color: isPoly ? aluzincColorHex : 0xf8fafc, // ¡Esmalte Blanco Poliéster de Fábrica (#f8fafc) hacia el interior!
      metalness: isPoly ? 0.05 : 0.10,
      roughness: isPoly ? 0.15 : 0.50,
      side: THREE.FrontSide,
      transparent: isTransparent,
      opacity: finalOpacity,
      wireframe: isWire,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -2.0
    });

    const modeloGroup = new THREE.Group();
    modeloGroup.name = 'modelo';
    scene.add(modeloGroup);

    // 2. RENDERIZADO DE LA PLATAFORMA DE CONCRETO
    let minX = 0, maxX = 12, minZ = 0, maxZ = 20, maxY = 5;
    const nodeArray = Object.values(nodes);
    if (nodeArray.length > 0) {
      minX = Math.min(...nodeArray.map(n => n.x)) - 1.5;
      maxX = Math.max(...nodeArray.map(n => n.x)) + 1.5;
      minZ = Math.min(...nodeArray.map(n => n.z || 0)) - 1.5;
      maxZ = Math.max(...nodeArray.map(n => n.z || 0)) + 1.5;
      maxY = Math.max(...nodeArray.map(n => n.y));
    }

    if (mostrarPlataforma) {
      const pWidth = Math.max(6, maxX - minX);
      const pLength = Math.max(6, maxZ - minZ);

      // Plataforma Blanca Arquitectónica para máximo contraste y evitar confusión con tubos metálicos
      const slabGeo = new THREE.BoxGeometry(pWidth, 0.25, pLength);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.20,
        metalness: 0.05
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.set((minX + maxX) / 2, -0.125, (minZ + maxZ) / 2);
      modeloGroup.add(slab);

      // Bisel y bordes perimetrales sutiles en gris claro
      const edges = new THREE.EdgesGeometry(slabGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xd1d5db,
        linewidth: 1
      });
      const wireframe = new THREE.LineSegments(edges, edgeMat);
      wireframe.position.copy(slab.position);
      modeloGroup.add(wireframe);
    }

    // 3. RENDERIZADO DE DADOS DE CONCRETO (PEDESTALES), PLACAS BASE Y PERNOS DE ANCLAJE
    if (mostrarPernosAnclaje) {
      const pedestalGeo = new THREE.BoxGeometry(0.40, 0.22, 0.40);
      const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.85,
        metalness: 0.08
      });

      const plateGeo = new THREE.BoxGeometry(0.30, 0.02, 0.30);
      const plateMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.95,
        roughness: 0.20
      });

      const boltGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.06, 8);
      const boltMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.95,
        roughness: 0.15
      });

      nodeArray.forEach(n => {
        if (n.y === 0 || n.isFixedSupport) {
          // Dado de concreto / Pedestal de cimentación
          const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
          pedestal.position.set(n.x, 0.11, n.z || 0);
          modeloGroup.add(pedestal);

          // Placa base de anclaje
          const plate = new THREE.Mesh(plateGeo, plateMat);
          plate.position.set(n.x, 0.22 + 0.01, n.z || 0);
          modeloGroup.add(plate);

          const offsets = [
            [-0.09, -0.09],
            [0.09, -0.09],
            [-0.09, 0.09],
            [0.09, 0.09]
          ];
          offsets.forEach(([ox, oz]) => {
            const boltMesh = new THREE.Mesh(boltGeo, boltMat);
            boltMesh.position.set(n.x + ox, 0.22 + 0.035, (n.z || 0) + oz);
            modeloGroup.add(boltMesh);
          });
        }
      });
    }

    // 4. RENDERIZADO DE PERFILES CON GEOMETRÍA REAL Y DISEÑO UNIFICADO ELEGANTE
    const tubesGroup = new THREE.Group();
    tubesGroup.name = 'tubes_group';
    modeloGroup.add(tubesGroup);

    // Material de acero estructural claro satinado (Tono limpio sin destellos ni sombras negras)
    const steelTubeMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Gris Acero Satinado Claro (slate-500)
      metalness: 0.38,
      roughness: 0.55,
      wireframe: isWire
    });

    // Contabilizar grado de conectividad por nodo para generar nudos de unión sólidos
    const nodeDegreeMap: Record<string, { count: number; maxProfileWidth: number }> = {};

    Object.values(segments).forEach(seg => {
      const nA = nodes[seg.nodeAId];
      const nB = nodes[seg.nodeBId];
      if (!nA || !nB) return;

      const pA = new THREE.Vector3(nA.x, nA.y, nA.z || 0);
      const pB = new THREE.Vector3(nB.x, nB.y, nB.z || 0);

      const distance = pA.distanceTo(pB);
      if (distance < 0.001) return;

      // Buscar perfil en el catálogo
      const profCatalog = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === seg.profileId);
      const isRedondo = profCatalog 
        ? (profCatalog.categoria === 'tubo_redondo' || profCatalog.categoria === 'barra_redonda')
        : (seg.profileId?.includes('pipe') || seg.profileId?.includes('redondo') || seg.profileId?.includes('sch') || seg.profileId?.includes('red'));

      const isRectangular = profCatalog
        ? (profCatalog.categoria === 'tubo_rectangular' || profCatalog.categoria === 'perfil_c')
        : (seg.profileId?.includes('rec') || seg.profileId?.includes('rect'));

      // Respetar estrictamente las dimensiones del catálogo si el usuario seleccionó un perfil específico (rectangular, cuadrado o redondo)
      let anchoM = profCatalog ? (profCatalog.anchoMm / 1000) : 0.08;
      let altoM = profCatalog ? (profCatalog.altoMm / 1000) : (isRectangular ? 0.075 : (isRedondo ? anchoM : 0.08));

      // Si no tiene catálogo y es columna por defecto, dar sección generosa
      if (!profCatalog && seg.rolEstructural === 'columna') {
        anchoM = Math.max(anchoM, 0.12);
        altoM = Math.max(altoM, 0.12);
      }

      const radiusM = anchoM * 0.5;

      // Registrar conectividad y ancho máximo en cada nodo
      [seg.nodeAId, seg.nodeBId].forEach(nId => {
        if (!nodeDegreeMap[nId]) {
          nodeDegreeMap[nId] = { count: 1, maxProfileWidth: anchoM };
        } else {
          nodeDegreeMap[nId].count++;
          if (anchoM > nodeDegreeMap[nId].maxProfileWidth) {
            nodeDegreeMap[nId].maxProfileWidth = anchoM;
          }
        }
      });

      let geom: THREE.BufferGeometry;

      if (isRedondo) {
        geom = new THREE.CylinderGeometry(radiusM, radiusM, distance, 16);
        geom.rotateX(Math.PI / 2);
      } else if (isRectangular) {
        geom = new THREE.BoxGeometry(anchoM, altoM, distance);
      } else {
        geom = new THREE.BoxGeometry(anchoM, altoM, distance);
      }

      const isSelected = seg.id === activeSelectedSegId;
      const tubeMat = steelTubeMat.clone();
      if (isSelected) {
        tubeMat.emissive = new THREE.Color(0x06b6d4);
        tubeMat.emissiveIntensity = 0.9;
      }
      const tubeMesh = new THREE.Mesh(geom, tubeMat);

      // Contornos nítidos para visibilidad perfecta de cada tubo y pieza individual
      if (!isWire) {
        const edgesGeo = new THREE.EdgesGeometry(geom, 22);
        const edgeLineMat = new THREE.LineBasicMaterial({
          color: modoIluminacion === 'claro' ? 0x1e293b : 0x38bdf8,
          transparent: true,
          opacity: modoIluminacion === 'claro' ? 0.38 : 0.55
        });
        const tubeLines = new THREE.LineSegments(edgesGeo, edgeLineMat);
        tubeMesh.add(tubeLines);
      }

      const midPoint = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
      tubeMesh.position.copy(midPoint);

      const dir = new THREE.Vector3().subVectors(pB, pA).normalize();
      const zAxis = new THREE.Vector3(0, 0, 1);
      tubeMesh.quaternion.setFromUnitVectors(zAxis, dir);
      
      const isCriticalZone = seg.rolEstructural === 'diagonal' || 
                             seg.rolEstructural === 'montante' ||
                             seg.rolEstructural === 'cordon_superior' ||
                             seg.rolEstructural === 'columna';

      tubeMesh.userData = {
        segmentId: seg.id,
        rolEstructural: seg.rolEstructural || 'viga_principal',
        isCriticalZone,
        isRedondo,
        isRectangular,
        origPos: midPoint.clone(),
        dir: dir.clone(),
        length: distance
      };
      tubesGroup.add(tubeMesh);
    });

    // 5. NUDOS DE CONEXIÓN Y ESFERAS DE UNIÓN EN VÉRTICES ESTRUCTURALES (Como en la imagen)
    Object.entries(nodeDegreeMap).forEach(([nId, data]) => {
      const node = nodes[nId];
      if (!node) return;
      
      // Mostrar esfera de unión azul en todas las conexiones superiores (evitando superponer sobre la placa base en y=0)
      if (node.y > 0.10 && data.count >= 1) {
        const jointRadius = Math.max(0.055, Math.min(0.12, (data.maxProfileWidth || 0.08) * 0.65));
        const jointGeo = new THREE.SphereGeometry(jointRadius, 16, 16);
        const jointMesh = new THREE.Mesh(jointGeo, nudoJointMat);
        jointMesh.position.set(node.x, node.y, node.z || 0);
        jointMesh.name = `joint_${nId}`;
        modeloGroup.add(jointMesh);
      }
    });

    // Extraer envolvente superior exacta de la estructura para ajustar la cobertura y la lluvia
    const topPointsMap: Record<number, number> = {};
    const allNodeArray = Object.values(nodes);
    
    const topSegments = Object.values(segments).filter(
      s => s.rolEstructural === 'cordon_superior' || s.rolEstructural === 'correa' || s.rolEstructural === 'viga_principal'
    );
    
    if (topSegments.length > 0) {
      topSegments.forEach(s => {
        const nA = nodes[s.nodeAId];
        const nB = nodes[s.nodeBId];
        if (nA) {
          const rx = Number(nA.x.toFixed(2));
          topPointsMap[rx] = Math.max(topPointsMap[rx] ?? -Infinity, nA.y);
        }
        if (nB) {
          const rx = Number(nB.x.toFixed(2));
          topPointsMap[rx] = Math.max(topPointsMap[rx] ?? -Infinity, nB.y);
        }
      });
    }

    if (Object.keys(topPointsMap).length < 2 && allNodeArray.length >= 2) {
      const maxYVal = Math.max(...allNodeArray.map(n => n.y));
      const minYVal = Math.min(...allNodeArray.map(n => n.y));
      const cutoff = minYVal + (maxYVal - minYVal) * 0.40;
      allNodeArray.filter(n => n.y >= cutoff).forEach(n => {
        const rx = Number(n.x.toFixed(2));
        topPointsMap[rx] = Math.max(topPointsMap[rx] ?? -Infinity, n.y);
      });
    }

    const topProfilePoints = Object.entries(topPointsMap)
      .map(([xStr, y]) => ({ x: parseFloat(xStr), y }))
      .sort((a, b) => a.x - b.x);

    // Identificar tipología de cubierta para renderizado geométrico de alta fidelidad
    const isHipRoof = allNodeArray.some(n => 
      n.id.toLowerCase().includes('hip') || 
      n.id.toLowerCase().includes('4ag') ||
      (n.nodeLabel && (n.nodeLabel.includes('HIP') || n.nodeLabel.includes('4AG')))
    );
    const is6AguasRoof = allNodeArray.some(n => 
      n.id.toLowerCase().includes('hex_6ag') || 
      n.id.toLowerCase().includes('6ag') ||
      (n.nodeLabel && (n.nodeLabel.includes('HEX') || n.nodeLabel.includes('6AG')))
    );
    const isDomeRoof = allNodeArray.some(n => 
      n.id.toLowerCase().includes('dome') || 
      n.id.toLowerCase().includes('cupula') ||
      (n.nodeLabel && (n.nodeLabel.includes('DOME') || n.nodeLabel.includes('CUPULA')))
    );

    let hipParams: any = null;
    if (isHipRoof && allNodeArray.length >= 4) {
      const minX = Math.min(...allNodeArray.map(n => n.x));
      const maxX = Math.max(...allNodeArray.map(n => n.x));
      const minZ = Math.min(...allNodeArray.map(n => n.z || 0));
      const maxZ = Math.max(...allNodeArray.map(n => n.z || 0));
      const yRidge = Math.max(...allNodeArray.map(n => n.y));

      const ridgeNodes = allNodeArray.filter(n => n.y >= yRidge - 0.08 && (n.id.includes('ridge') || (n.nodeLabel && n.nodeLabel.includes('CUMBRERA'))));
      const fallbackRidge = allNodeArray.filter(n => n.y >= yRidge - 0.08);
      const activeRidgeNodes = ridgeNodes.length > 0 ? ridgeNodes : fallbackRidge;

      const zRidge1 = Math.min(...activeRidgeNodes.map(n => n.z || 0));
      const zRidge2 = Math.max(...activeRidgeNodes.map(n => n.z || 0));
      const xMid = (minX + maxX) / 2;

      const eaveNodes = allNodeArray.filter(n => n.y > 0.5 && n.y <= yRidge - 0.25);
      const yEave = eaveNodes.length > 0 ? Math.min(...eaveNodes.map(n => n.y)) : yRidge * 0.7;

      hipParams = { minX, maxX, minZ, maxZ, yEave, yRidge, zRidge1, zRidge2, xMid };
    }

    let hexCorners: { x: number; y: number; z: number }[] = [];
    let hexParams: any = null;

    if (is6AguasRoof && allNodeArray.length >= 6) {
      const apexNode = allNodeArray.find(n => n.id.includes('apex') || (n.nodeLabel && n.nodeLabel.includes('APEX'))) || allNodeArray.reduce((max, n) => n.y > max.y ? n : max, allNodeArray[0]);
      const cX = apexNode.x;
      const cZ = apexNode.z || 0;
      const yPeak = apexNode.y;

      let pNodes = allNodeArray.filter(n => n.id.includes('hex_6ag_t_'));
      if (pNodes.length < 6) {
        const maxR = Math.max(...allNodeArray.map(n => Math.hypot(n.x - cX, (n.z || 0) - cZ)));
        pNodes = allNodeArray.filter(n => {
          const r = Math.hypot(n.x - cX, (n.z || 0) - cZ);
          return r >= maxR * 0.85 && n.y < yPeak - 0.25;
        });
      }

      const cornerMap = pNodes.map(n => ({
        x: n.x,
        y: n.y,
        z: n.z || 0,
        angle: Math.atan2((n.z || 0) - cZ, n.x - cX)
      })).sort((a, b) => a.angle - b.angle);

      const filteredCorners: { x: number; y: number; z: number }[] = [];
      cornerMap.forEach(c => {
        if (!filteredCorners.some(fc => Math.hypot(fc.x - c.x, fc.z - c.z) < 0.25)) {
          filteredCorners.push(c);
        }
      });

      if (filteredCorners.length >= 6) {
        hexCorners = filteredCorners.slice(0, 6);
        const yEave = Math.min(...hexCorners.map(c => c.y));
        const rAvg = hexCorners.reduce((sum, c) => sum + Math.hypot(c.x - cX, c.z - cZ), 0) / hexCorners.length;
        hexParams = { cX, cZ, yPeak, yEave, rAvg };
      }
    }

    let domeParams: any = null;
    if (isDomeRoof && allNodeArray.length >= 6) {
      const apexNode = allNodeArray.find(n => n.id.includes('dome_apex') || (n.nodeLabel && n.nodeLabel.includes('APEX'))) || allNodeArray.reduce((max, n) => n.y > max.y ? n : max, allNodeArray[0]);
      const cX = apexNode.x;
      const cZ = apexNode.z || 0;
      const yPeak = apexNode.y;

      const pNodes = allNodeArray.filter(n => n.id.includes('dome_t_') || (n.nodeLabel && n.nodeLabel.includes('DOME-COL-T')));
      const validNodes = pNodes.length >= 4 ? pNodes : allNodeArray.filter(n => n.y < yPeak - 0.25 && n.y > 0.5);
      
      const radii = validNodes.map(n => Math.hypot(n.x - cX, (n.z || 0) - cZ));
      const radius = radii.length > 0 ? Math.max(...radii) : 8.0;
      const yEave = validNodes.length > 0 ? Math.min(...validNodes.map(n => n.y)) : yPeak * 0.6;
      const numRibs = pNodes.length >= 4 ? pNodes.length : 8;

      domeParams = { cX, cZ, yPeak, yEave, radius, numRibs };
    }

    const roofMeta = {
      isHipRoof: !!hipParams,
      is6AguasRoof: !!hexParams,
      isDomeRoof: !!domeParams,
      hipParams,
      hexParams,
      domeParams
    };

    // 6. RENDERIZADO DE COBERTURA ALUZINC ADAPTADA EXACTAMENTE A LA ESTRUCTURA
    if (mostrarCobertura) {
      const activeModel = MODELOS_ALUZINC_PERU.find(m => m.id === selectedModeloId) || MODELOS_ALUZINC_PERU[0];
      const isSandwich = activeModel.tipo === 'termoacustico';

      if (isDomeRoof && domeParams) {
        const domeRoofGroup = createDomeRoofGeometry(
          domeParams.cX,
          domeParams.cZ,
          domeParams.yPeak,
          domeParams.yEave,
          domeParams.radius,
          domeParams.numRibs,
          activeModel,
          aluzincColorHex,
          isSandwich,
          aluzincMatTop
        );
        domeRoofGroup.name = 'cobertura_malla';
        modeloGroup.add(domeRoofGroup);
      } else if (is6AguasRoof && hexParams && hexCorners.length >= 6) {
        const hexRoofGroup = createHex6AguasRoofGeometry(
          hexParams.cX,
          hexParams.cZ,
          hexParams.yPeak,
          hexCorners,
          activeModel,
          aluzincColorHex,
          isSandwich,
          aluzincMatTop
        );
        hexRoofGroup.name = 'cobertura_malla';
        modeloGroup.add(hexRoofGroup);
      } else if (isHipRoof && hipParams) {
        const hipRoofGroup = createHipRoofGeometry(
          hipParams,
          activeModel,
          aluzincColorHex,
          isSandwich,
          aluzincMatTop
        );
        hipRoofGroup.name = 'cobertura_malla';
        modeloGroup.add(hipRoofGroup);
      } else if (topProfilePoints.length >= 2) {
        const minZNode = Math.min(...allNodeArray.map(n => n.z || 0));
        const maxZNode = Math.max(...allNodeArray.map(n => n.z || 0));

        const roofGeom = createAdaptiveAluzincGeometry(
          topProfilePoints,
          minZNode,
          maxZNode,
          0.30,
          0.30
        );

        const roofMesh = new THREE.Mesh(roofGeom, [aluzincMatTop, aluzincMatBottom]);
        roofMesh.name = 'cobertura_malla';
        modeloGroup.add(roofMesh);

        // Renderizado de Cumbrera Metálica Plegada (Techos a Dos Aguas)
        const peakPoint = topProfilePoints.reduce((max, p) => p.y > max.y ? p : max, topProfilePoints[0]);
        if (peakPoint && topProfilePoints.length >= 3) {
          const ridgeGeo = new THREE.BoxGeometry(0.35, 0.05, (maxZNode - minZNode) + 0.5);
          const ridgeMat = new THREE.MeshStandardMaterial({
            color: aluzincColorHex,
            metalness: 0.85,
            roughness: 0.25
          });
          const ridgeMesh = new THREE.Mesh(ridgeGeo, ridgeMat);
          ridgeMesh.position.set(peakPoint.x, peakPoint.y + 0.07, (minZNode + maxZNode) / 2);
          ridgeMesh.name = 'cumbrera_techo';
          modeloGroup.add(ridgeMesh);
        }
      }
    }

    // 7. SISTEMA DE LÍNEAS DE LLUVIA DE ALTA FIDELIDAD
    const rainLines = createRainLineSystem(minX, maxX, minZ, maxZ, maxY, topProfilePoints, roofMeta);
    rainLines.visible = (simulacionModoRef.current === 'lluvia');
    scene.add(rainLines);
    rainLinesRef.current = rainLines;

  }, [nodes, segments, selectedModeloId, aluzincOpacity, aluzincColorHex, mostrarPlataforma, mostrarPernosAnclaje, mostrarCobertura]);

  // Inicialización de WebGL
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const cfgIlum = CONFIG_ILUMINACION_TECHOS[modoIluminacion] || CONFIG_ILUMINACION_TECHOS.claro;
    scene.background = new THREE.Color(cfgIlum.bgColor);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    if (container) {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.appendChild(renderer.domElement);
    }

    // Luces Base
    const ambientLight = new THREE.AmbientLight(cfgIlum.ambientColor, cfgIlum.ambientIntensity);
    ambientLight.name = 'ambient_light';
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(cfgIlum.dir1Color, cfgIlum.dir1Intensity);
    dirLight1.name = 'dir_light_1';
    dirLight1.position.set(...cfgIlum.dir1Pos);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(cfgIlum.dir2Color, cfgIlum.dir2Intensity);
    dirLight2.name = 'dir_light_2';
    dirLight2.position.set(...cfgIlum.dir2Pos);
    scene.add(dirLight2);

    const gridCenterColor = modoIluminacion === 'oscuro' ? 0x38bdf8 : 0x0ea5e9;
    const gridLineColor = modoIluminacion === 'oscuro' ? 0x334155 : 0xe2e8f0;
    const gridHelper = new THREE.GridHelper(50, 50, gridCenterColor, gridLineColor);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Ejes de coordenadas espaciales del giroscopio (Rojo: X, Verde: Y, Azul: Z)
    if (mostrarEjesGiroscopio) {
      const axesHelper = new THREE.AxesHelper(1.8);
      axesHelper.position.set(0, 0.02, 0);
      scene.add(axesHelper);
    }

    // Construcción inicial
    construirModelo3D(scene);
    resetCamera();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let lastTime = performance.now();

    // Bucle de Renderizado y Animaciones de Simulación
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Giro automático suave
      if (autoRotateRef.current) {
        cameraAngleThetaRef.current += 0.005;
        updateCameraPos();
      }

      const currentModo = simulacionModoRef.current;
      const modelo = scene.getObjectByName('modelo') as THREE.Group;
      const tubesGroup = (modelo?.getObjectByName('tubes_group') || 
                          modelo?.getObjectByName('tubos_estructurales') || 
                          scene.getObjectByName('tubes_group') || 
                          scene.getObjectByName('tubos_estructurales')) as THREE.Group;

      // 1. ANIMACIÓN DE SISMO CON PANDEO DINÁMICO Y GRADIENTE DE RIESGO POR ZONAS CRÍTICAS
      if (modelo) {
        if (currentModo === 'sismo') {
          const mag = sismoMagnitudRef.current;
          const diag = getDiagnosticoSismo(mag);
          const isStable = diag.estado === 'ESTABLE';

          const freq = 4.5 + (mag - 5.0) * 1.8;
          // Si la estructura es conforme/estable, tiene vibración elástica perfectamente visible sin romperse.
          // Si no es conforme, la vibración es más violenta y destructiva.
          const amp = isStable 
            ? (0.02 + Math.pow((mag - 5.0) / 3.5, 2) * 0.05) 
            : (0.045 + Math.pow((mag - 5.0) / 3.5, 2) * 0.18);
          
          const sismoOffset = Math.sin(now * 0.001 * freq) * amp;

          // Sacudir todo el modelo (placas, techo de aluzinc, columnas, pedestales, etc.) en unísono sismorresistente
          modelo.position.x = sismoOffset;
          modelo.position.z = Math.cos(now * 0.0011 * freq) * (amp * 0.35);

          if (tubesGroup) {
            tubesGroup.children.forEach(child => {
              const mesh = child as THREE.Mesh;
              const uData = mesh.userData;
              if (uData && uData.origPos) {
                const origP = uData.origPos as THREE.Vector3;
                const heightFactor = Math.max(0, origP.y / 4.5);
                mesh.position.x = origP.x + sismoOffset * heightFactor * 0.5;

                // Si la estructura cumple y es estable, se mantiene rígida sin deformación ni pandeo visual
                if (isStable) {
                  mesh.scale.set(1.0, 1.0, 1.0);
                  const mat = mesh.material as THREE.MeshStandardMaterial;
                  if (mat) mat.color.setHex(0x64748b);
                } else if (uData.isCriticalZone && mag >= 6.0) {
                  // Deformación visual y código de color por zona estructural sólo si hay riesgo o colapso
                  const buckleScale = 1.0 + Math.sin(now * 0.003 * freq) * 0.12 * (mag / 7.0);
                  mesh.scale.set(buckleScale, 1.0, buckleScale);
                  
                  const mat = mesh.material as THREE.MeshStandardMaterial;
                  if (mat) {
                    if (uData.rolEstructural === 'columna' && mag >= 7.6) {
                      mat.color.setHex(0xef4444); // Rojo: Colapso en columna
                    } else if (uData.rolEstructural === 'diagonal' || uData.rolEstructural === 'montante') {
                      mat.color.setHex(mag >= 7.4 ? 0xf97316 : 0xf59e0b); // Naranja / Amarillo
                    } else {
                      mat.color.setHex(0xf59e0b); // Pandeo flexionante
                    }
                  }
                }
              }
            });
          }
        } else {
          // Reset de posiciones globales
          modelo.position.set(0, 0, 0);

          // Reset de posiciones y materiales de los tubos tras finalizar sismo
          if (tubesGroup) {
            tubesGroup.children.forEach(child => {
              const mesh = child as THREE.Mesh;
              const uData = mesh.userData;
              if (uData && uData.origPos) {
                mesh.position.copy(uData.origPos);
              }
              mesh.scale.set(1.0, 1.0, 1.0);
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat) mat.color.setHex(0x64748b);
            });
          }
        }
      }

      // 2. ANIMACIÓN DE LLUVIAS DE ALTA FIDELIDAD CON GOTAS ESTILIZADAS, DENSIDAD VARIABLE Y SALPICADURAS
      const rainGroup = rainLinesRef.current;
      const meta = rainWaterMetaRef.current;
      const hasRoofCover = mostrarCoberturaRef.current;

      if (rainGroup) {
        if (currentModo === 'lluvia' && meta) {
          rainGroup.visible = true;

          const intensity = Math.max(5, Math.min(120, lluviaIntensidadRef.current));
          // Intensidad modula el número de gotas activas: desde ~180 (garúa tenue) hasta 3000 (tormenta torrencial)
          const activeDropCount = Math.min(meta.maxDrops, Math.max(160, Math.round((intensity / 120) * meta.maxDrops)));

          const rainPoints = meta.rainPoints as THREE.Points;
          const posAttr = rainPoints.geometry.attributes.position as THREE.BufferAttribute;
          const posArr = posAttr.array as Float32Array;
          const rainMat = rainPoints.material as THREE.PointsMaterial;

          // Velocidad, opacidad y grosor de gota modulados por la intensidad
          const speed = 10 + (intensity / 120) * 26;
          rainMat.opacity = Math.min(0.95, 0.35 + (intensity / 120) * 0.55);
          rainMat.size = 0.36 + (intensity / 120) * 0.34;

          rainPoints.geometry.setDrawRange(0, activeDropCount);

          const { minX, maxX, minZ, maxZ, topProfilePoints, spanX, velocities, dropStates, splashLifes, maxSplashes } = meta;

          const activeModel = MODELOS_ALUZINC_PERU.find(m => m.id === selectedModeloId) || MODELOS_ALUZINC_PERU[0];
          const ribFreq = Math.max(3, activeModel.ribCountPerMeter);
          const ribHeightM = (activeModel.ribHeightMm || 35) / 1000;
          const purlinClearance = 0.040;

          const splashPoints = meta.splashPoints as THREE.Points;
          const splashPosAttr = splashPoints.geometry.attributes.position as THREE.BufferAttribute;
          const splashPosArr = splashPosAttr.array as Float32Array;

          // Función para emitir ondas de salpicadura
          const triggerSplash = (sx: number, sy: number, sz: number) => {
            const sIdx = meta.nextSplashIdx;
            meta.nextSplashIdx = (meta.nextSplashIdx + 1) % maxSplashes;
            splashPosArr[sIdx * 3] = sx;
            splashPosArr[sIdx * 3 + 1] = sy + 0.015;
            splashPosArr[sIdx * 3 + 2] = sz;
            splashLifes[sIdx] = 1.0;
          };

          for (let i = 0; i < activeDropCount; i++) {
            let px = posArr[i * 3];
            let py = posArr[i * 3 + 1];
            let pz = posArr[i * 3 + 2];
            const pSpeed = velocities[i] * (speed / 20);
            const state = dropStates[i];

            const insideFootprint = (px >= minX - 0.35 && px <= maxX + 0.35 && pz >= minZ - 0.35 && pz <= maxZ + 0.35);
            const roofData = evaluateRoofHeightAtXZ(px, pz, topProfilePoints || [], meta.roofMeta);
            const ribInfo = getRibHeightProfile(pz, ribFreq, ribHeightM, activeModel.tipo);
            const totalElev = purlinClearance + ribInfo.offset;
            const roofSurfaceY = roofData.y + roofData.ny * totalElev + 0.02;

            if (hasRoofCover && insideFootprint) {
              if (py <= roofSurfaceY && state === 0) {
                dropStates[i] = 1; // Flujo a lo largo de la vertiente del techo
                py = roofSurfaceY;
                // Salpicadura proporcional a la intensidad de lluvia
                if (Math.random() < 0.65 * (intensity / 100)) {
                  triggerSplash(px, py, pz);
                }
              }

              if (dropStates[i] === 1) {
                // 1. Detección física exacta de la pendiente del techo:
                // slope = dy/dx.
                // Si slope < 0 (la cota baja hacia la derecha), el agua cae hacia la derecha (+1).
                // Si slope > 0 (la cota sube hacia la derecha / baja hacia la izquierda), el agua cae hacia la izquierda (-1).
                const { slope } = roofData;
                let flowDir = 0;

                if (Math.abs(slope) > 0.005) {
                  flowDir = slope < 0 ? 1 : -1;
                } else {
                  // Cerca del ápice o cumbrera (pendiente casi cero):
                  // Se evacúa hacia los costados respectivos según la posición respecto a la cumbrera
                  const peakX = meta.peakX ?? (minX + maxX) / 2;
                  flowDir = px >= peakX ? 1 : -1;
                }

                // 2. Velocidad de escorrentía proporcional a la pendiente física y porcentaje de caída:
                // - Techos parabólicos: en la corona superior fluye suavemente y va acelerando
                //   fuertemente en los flancos curvos donde la pendiente supera 25%-60%.
                // - Techos a dos aguas o una agua: la velocidad responde a la pendiente continua de diseño.
                const slopeMag = Math.abs(slope);
                const speedSlopeFactor = Math.max(0.25, Math.min(1.8, Math.sqrt(slopeMag * 3.0)));
                const flowSpeed = flowDir * (3.8 + 9.2 * speedSlopeFactor) * (1.0 + (intensity / 100) * 0.5) * delta;

                px += flowSpeed;

                const nextRoofData = evaluateRoofHeightAtXZ(px, pz, topProfilePoints || [], meta.roofMeta);
                const nextRibInfo = getRibHeightProfile(pz, ribFreq, ribHeightM, activeModel.tipo);
                const nextTotalElev = purlinClearance + nextRibInfo.offset;
                py = nextRoofData.y + nextRoofData.ny * nextTotalElev + 0.02;

                // Transición a cortina de goteo exterior al sobrepasar el borde del alero
                if (px <= minX - 0.25 || px >= maxX + 0.25) {
                  dropStates[i] = 2; // Cortina goteo alero
                }
              } else if (dropStates[i] === 2) {
                py -= pSpeed * delta;
              } else {
                if (py < roofSurfaceY) {
                  py = roofSurfaceY;
                  dropStates[i] = 1;
                } else {
                  py -= pSpeed * delta;
                }
              }
            } else {
              py -= pSpeed * delta;
            }

            // Reciclaje al llegar al suelo
            if (py <= 0.05) {
              if (Math.random() < 0.35 * (intensity / 100)) {
                triggerSplash(px, 0.05, pz);
              }
              py = meta.maxY + 1.0 + Math.random() * 12.0;
              px = minX - 3 + Math.random() * (spanX + 6);
              dropStates[i] = 0;
            }

            posArr[i * 3] = px;
            posArr[i * 3 + 1] = py;
            posArr[i * 3 + 2] = pz;
          }
          posAttr.needsUpdate = true;

          // Actualizar salpicaduras
          for (let s = 0; s < maxSplashes; s++) {
            if (splashLifes[s] > 0) {
              splashLifes[s] -= delta * 3.2;
              if (splashLifes[s] <= 0) {
                splashLifes[s] = 0;
                splashPosArr[s * 3 + 1] = -999;
              }
            }
          }
          splashPosAttr.needsUpdate = true;
          splashPoints.geometry.setDrawRange(0, maxSplashes);
        } else {
          rainGroup.visible = false;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      try {
        renderer.dispose();
      } catch {
        // ignore
      }
    };
  }, [construirModelo3D, resetCamera, updateCameraPos, modoIluminacion, mostrarEjesGiroscopio]);

  // Actualizar modelo cuando cambian los nodos o segmentos
  useEffect(() => {
    if (sceneRef.current) {
      construirModelo3D(sceneRef.current);
    }
  }, [nodes, segments, selectedModeloId, aluzincOpacity, aluzincColorHex, mostrarCobertura, construirModelo3D]);

  // Cambiar modelo de aluzinc
  const handleModeloChange = (modeloId: string) => {
    const mod = MODELOS_ALUZINC_PERU.find(m => m.id === modeloId);
    if (!mod) return;
    setSelectedModeloId(modeloId);
    setAluzincOpacity(mod.opacidadDefecto);
    setAluzincColorHex(mod.colorDefectoHex);
  };

  const diagSismo = getDiagnosticoSismo(sismoMagnitud);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none touch-none">
      {/* Canvas 3D con Giroscopio Espacial y Soporte Táctil/Pointer Completo */}
      <div 
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="w-full flex-1 cursor-grab active:cursor-grabbing relative touch-none"
      />

      {/* WIDGET VISUAL DE ORIENTACIÓN ESPACIAL / GIROSCOPIO 3D */}
      <div className="absolute bottom-3 right-3 pointer-events-none z-10 flex flex-col items-end gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
        <div className="bg-slate-900/90 border border-slate-700/70 backdrop-blur-md rounded-2xl p-2 shadow-xl flex items-center gap-2 text-[10px] font-mono text-slate-300">
          <Compass className="w-4 h-4 text-sky-400" />
          <div className="flex items-center gap-2">
            <span className="text-rose-400 font-bold">X (Luz)</span>
            <span className="text-emerald-400 font-bold">Y (Altura)</span>
            <span className="text-blue-400 font-bold">Z (Largo)</span>
          </div>
        </div>
      </div>

      {/* BARRA SUPERIOR ELEGANTE Y COMPLETA */}
      <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20 max-w-[calc(100vw-16px)]">
        
        {/* Lado Izquierdo: Selector de Aluzinc, Opacidad y Colores Rápidos */}
        <div className="flex items-center gap-2 bg-white/95 border border-slate-200 p-1.5 rounded-2xl shadow-xl backdrop-blur-md pointer-events-auto max-w-full overflow-x-auto touch-pan-x scrollbar-none shrink-0">
          
          {/* Selector Directo de Modelo Aluzinc */}
          <div className="flex items-center gap-1.5 px-1 shrink-0">
            <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
            <select
              value={selectedModeloId}
              onChange={(e) => handleModeloChange(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer shadow-2xs max-w-[150px] sm:max-w-[220px] truncate"
              title="Seleccionar perfil de cobertura (TR-4, TR-5, Calamina, etc.)"
            >
              {MODELOS_ALUZINC_PERU.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0" />

          {/* Slider Rápido de Opacidad */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-xl border border-slate-200 text-xs shrink-0">
            <span className="text-[11px] font-bold text-slate-600">Opacidad:</span>
            <input
              type="range"
              min="0.10"
              max="1.0"
              step="0.05"
              value={aluzincOpacity}
              onChange={(e) => setAluzincOpacity(parseFloat(e.target.value))}
              className="w-16 accent-amber-500 cursor-pointer"
              title={`Opacidad: ${Math.round(aluzincOpacity * 100)}%`}
            />
            <span className="font-mono font-black text-amber-600 text-[11px] min-w-[32px] text-right">
              {Math.round(aluzincOpacity * 100)}%
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block shrink-0" />

          {/* Paleta Rápida de Colores Comerciales */}
          <div className="flex items-center gap-1 px-1 shrink-0">
            {[
              { hex: 0x0284c7, label: 'Azul Comercial (TR-4)' },
              { hex: 0x94a3b8, label: 'Aluzinc Natural / Zinc' },
              { hex: 0xdc2626, label: 'Rojo Teja' },
              { hex: 0x16a34a, label: 'Verde Selva' },
              { hex: 0x334155, label: 'Gris Grafito' },
              { hex: 0xf8fafc, label: 'Blanco Nieve' }
            ].map(c => (
              <button
                key={c.hex}
                onClick={() => setAluzincColorHex(c.hex)}
                className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer transform ${
                  aluzincColorHex === c.hex 
                    ? 'border-amber-500 scale-110 shadow-md ring-2 ring-amber-400/50' 
                    : 'border-white hover:scale-105 shadow-2xs opacity-85 hover:opacity-100'
                }`}
                style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, '0')}` }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Lado Derecho: Simulación (Lluvia, Sismo), Iluminación, Cámara y Zoom */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 border border-slate-200 p-1.5 rounded-2xl shadow-xl backdrop-blur-md pointer-events-auto max-w-full overflow-x-auto touch-pan-x scrollbar-none select-none">

          {/* Badge de estado 3D (estilo Herrería, limpio y consistente) */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shrink-0">
            <Box className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Vista 3D</span>
            <span className="sm:hidden">3D</span>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

          {/* Alternar Modo Claro / Oscuro */}
          <button
            onClick={handleToggleIluminacion}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 cursor-pointer shadow-2xs transition-all flex items-center gap-1 shrink-0"
            title={`Iluminación: ${CONFIG_ILUMINACION_TECHOS[modoIluminacion]?.nombre} (Clic para cambiar a ${modoIluminacion === 'claro' ? 'Oscuro' : 'Claro'})`}
          >
            <span className="text-sm">{CONFIG_ILUMINACION_TECHOS[modoIluminacion]?.icon}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

          {/* Botón Simulación Lluvia */}
          <button
            onClick={() => setSimulacionModo(simulacionModo === 'lluvia' ? 'ninguno' : 'lluvia')}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer border shrink-0 ${
              simulacionModo === 'lluvia'
                ? 'bg-sky-500 text-white border-sky-400 shadow-md ring-2 ring-sky-300/40 font-bold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Simulador de Lluvias de Alta Fidelidad (Detección de Techo y Drenaje en Aleros)"
          >
            <CloudRain className="w-4 h-4" />
          </button>

          {/* Botón Simulación Sismo */}
          <button
            onClick={() => setSimulacionModo(simulacionModo === 'sismo' ? 'ninguno' : 'sismo')}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer border shrink-0 ${
              simulacionModo === 'sismo'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-300/40 font-black'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Simulador Sísmico con Desglose de Zonas Críticas y Mejoras por Tubo"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Toggle Cobertura */}
          <button
            onClick={() => setMostrarCobertura(!mostrarCobertura)}
            className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer border shrink-0 ${
              mostrarCobertura
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title="Mostrar / Ocultar Cobertura Aluzinc"
          >
            <Eye className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

          {/* Grabar video 3D (giro lento 360° y descarga) */}
          <button
            onClick={handleRecord3D}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              isRecording ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-300 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={isRecording ? 'Detener y descargar el video 3D' : 'Grabar video 3D (giro lento 360°) y descargar'}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            <span className="hidden xl:inline text-[11px] font-bold">{isRecording ? 'Detener' : 'Grabar'}</span>
          </button>

          {/* Giro Automático */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              autoRotate ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
            title="Giro Automático"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden xl:inline text-[11px] font-bold">Giro</span>
          </button>

          {/* Botón Inspección de Proximidad Ultra-Cercana y Panorámica */}
          <button 
            onClick={setProximityCloseInspection} 
            className="px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0" 
            title="Inspección De Cerca (Acercamiento Máximo a Tubos/Pernos)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden xl:inline text-[11px]">De Cerca</span>
          </button>

          <button 
            onClick={setProximityPanoramicView} 
            className="px-2 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer hidden xl:flex items-center gap-1 shadow-2xs shrink-0" 
            title="Vista Panorámica Lejana"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px]">Panorámica</span>
          </button>

          {/* Zoom (+/-) y Centrar se eliminaron de esta barra: ya están en los
              controles flotantes siempre visibles de abajo-derecha. */}
        </div>
      </div>

      {/* CONTROLES FLOTANTES DE ZOOM Y CENTRADO RÁPIDO (SIEMPRE VISIBLES Y ACCESIBLES EN MÓVIL Y DESKTOP) */}
      <div className="absolute bottom-6 right-3 sm:right-4 z-40 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-slate-200/90 pointer-events-auto select-none touch-manipulation">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9"
          title="Acercar Cámara (+)"
        >
          <Plus className="w-5 h-5 font-black text-slate-900" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9"
          title="Alejar Cámara (-)"
        >
          <Minus className="w-5 h-5 font-black text-slate-900" />
        </button>
        <button
          onClick={setProximityCenteredView}
          className="p-2 rounded-xl bg-slate-50 text-amber-600 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9"
          title="Centrar Vista 3D"
        >
          <Maximize2 className="w-5 h-5 text-amber-600" />
        </button>
      </div>

      {/* HUD DE DIAGNÓSTICO EN TIEMPO REAL: SISMO / LLUVIA (ULTRA-COMPACTO Y NO INVASIVO PARA PANTALLAS PEQUEÑAS) */}
      {simulacionModo !== 'ninguno' && (
        <div className="absolute bottom-3 left-3 z-10 pointer-events-auto max-w-full sm:max-w-md">
          {simulacionModo === 'sismo' ? (
            <div className="bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl p-2.5 sm:p-3.5 shadow-xl backdrop-blur-md transition-all duration-200">
              {/* Header Mini Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 truncate">
                    Sismo {sismoMagnitud} Mw
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${diagSismo.bg} ${diagSismo.color}`}>
                    {diagSismo.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsHudCollapsed(!isHudCollapsed)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isHudCollapsed ? '🔼 Ajustar' : '🔽 Minimizar'}</span>
                  </button>
                  <button
                    onClick={() => setSimulacionModo('ninguno')}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Cerrar simulación"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CONTENIDO EXPANDIDO O MINIMIZADO */}
              {!isHudCollapsed && (
                <div className="space-y-2.5 pt-2 mt-2 border-t border-slate-800/80 animate-in fade-in duration-150 text-xs">
                  {/* DICTAMEN ESTRUCTURAL */}
                  <div className={`p-2 rounded-xl border ${diagSismo.bg}`}>
                    <div className={`text-[11px] font-black ${diagSismo.color}`}>
                      {diagSismo.mensaje}
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                      {diagSismo.descripcion}
                    </div>
                  </div>

                  {/* BOTÓN DE ACCIÓN RÁPIDA */}
                  <button
                    onClick={handleApplyAllOptimizations}
                    className="w-full py-1.5 px-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-lg text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-98"
                    title="Aplica automáticamente todos los tubos recomendados según Norma E.090 a la estructura"
                  >
                    <Wrench className="w-3.5 h-3.5 text-slate-950" />
                    <span>⚡ APLICAR CAMBIOS RECOMENDADOS (E.090)</span>
                  </button>

                  {/* Slider de Intensidad Sísmica */}
                  <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">Sismo:</span>
                    <input
                      type="range"
                      min="5.0"
                      max="8.5"
                      step="0.1"
                      value={sismoMagnitud}
                      onChange={(e) => setSismoMagnitud(parseFloat(e.target.value))}
                      className="flex-1 accent-amber-500 cursor-pointer h-1.5"
                    />
                    <span className="text-[11px] font-mono font-black text-amber-400 shrink-0">{sismoMagnitud} Mw</span>
                  </div>

                  {/* RECOMENDACIÓN TÉCNICA NORMA PERUANA E.090 / E.030 */}
                  <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-xl text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-indigo-300 font-bold text-[10px]">
                        <BookOpen className="w-3 h-3 text-indigo-400" />
                        <span>Norma E.090 / E.030</span>
                      </div>
                      <button
                        onClick={() => setMostrarDetalleZonasSismo(!mostrarDetalleZonasSismo)}
                        className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{mostrarDetalleZonasSismo ? 'Ocultar' : 'Elegir por Zona'}</span>
                        {mostrarDetalleZonasSismo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                      <Wrench className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Refuerzo Sugerido: {diagSismo.perfilSugerido}</span>
                    </div>
                  </div>

                  {/* TABLA DETALLADA DE ZONAS CRÍTICAS CON SELECTORES INLINE */}
                  {mostrarDetalleZonasSismo && (
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        Elegir Perfil Directamente por Zona:
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {diagSismo.zonasEvaluadas.map(zona => (
                          <div 
                            key={zona.id} 
                            className={`p-2 rounded-xl border text-[11px] space-y-1 ${
                              zona.estadoZona === 'COLAPSO' 
                                ? 'bg-rose-950/60 border-rose-800/80 text-rose-200' 
                                : zona.estadoZona === 'ALERTA_PANDEO'
                                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span className="text-white text-[10px]">{zona.zonaNombre}</span>
                              <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-black border ${
                                zona.estadoZona === 'COLAPSO' ? 'bg-rose-900 text-white border-rose-700' :
                                zona.estadoZona === 'ALERTA_PANDEO' ? 'bg-amber-900 text-amber-200 border-amber-700' :
                                'bg-emerald-900 text-emerald-200 border-emerald-700'
                              }`}>
                                {zona.estadoZona === 'COLAPSO' ? '🔴 Peligro' : zona.estadoZona === 'ALERTA_PANDEO' ? '🟡 Pandeo' : '🟢 Seguro'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[9px] text-slate-400 font-bold shrink-0">Cambiar a:</span>
                              <select
                                onChange={(e) => handleZoneProfileChange(zona.rolEstructural, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-[10px] font-bold text-amber-300 focus:border-amber-400 outline-none cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>Seleccionar perfil...</option>
                                {PERFILES_TECHOS_AGRUPADOS.map(grp => (
                                  <optgroup key={grp.norma} label={grp.label} className="bg-slate-950 text-amber-400 font-bold">
                                    {grp.items.map(p => (
                                      <option key={p.id} value={p.id} className="bg-slate-900 text-white font-medium">
                                        {p.nombre} ({p.codigoComercial})
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* HUD LLUVIA COMPACTO Y NO INVASIVO */
            <div className="bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl p-2.5 sm:p-3.5 shadow-xl backdrop-blur-md transition-all duration-200">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-300 truncate">
                    Lluvia ({lluviaIntensidad} mm/h)
                  </span>
                  <span className="text-[9px] font-bold bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-full shrink-0">
                    {mostrarCobertura ? 'Evacuación OK' : 'Sin Cobertura'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setIsHudCollapsed(!isHudCollapsed)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isHudCollapsed ? '🔼 Ajustar' : '🔽 Minimizar'}</span>
                  </button>
                  <button
                    onClick={() => setSimulacionModo('ninguno')}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Cerrar simulación de lluvia"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CONTENIDO EXPANDIDO DE LLUVIA */}
              {!isHudCollapsed && (
                <div className="space-y-2 pt-2 mt-2 border-t border-slate-800/80 animate-in fade-in duration-150 text-xs">
                  <div className="p-2 bg-sky-950/40 border border-sky-800/60 rounded-xl text-[11px] space-y-0.5">
                    <div className="font-bold text-sky-300 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {mostrarCobertura 
                        ? 'Agua evacúa fluidamente por aleros' 
                        : 'Cobertura desactivada: Lluvia cae al interior'}
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400">Intensidad:</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/80">
                        {lluviaIntensidad <= 15 ? 'Garúa / Llovizna' : (lluviaIntensidad <= 45 ? 'Lluvia Moderada' : (lluviaIntensidad <= 80 ? 'Lluvia Fuerte' : 'Tormenta Torrencial'))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={lluviaIntensidad}
                        onChange={(e) => setLluviaIntensidad(parseInt(e.target.value))}
                        className="flex-1 accent-sky-500 cursor-pointer h-1.5"
                      />
                      <span className="text-[11px] font-mono font-black text-sky-400 shrink-0 w-16 text-right">{lluviaIntensidad} mm/h</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PANEL FLOTANTE INSPECTOR 3D: SELECCIÓN Y CAMBIO DIRECTO DE PERFILES */}
      {activeSelectedSegId && segments[activeSelectedSegId] && (() => {
        const seg = segments[activeSelectedSegId];
        const currentProf = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === seg.profileId) || INVENTARIO_PERFILES_TUBULARES[0];
        const nodeA = nodes[seg.nodeAId];
        const nodeB = nodes[seg.nodeBId];
        const lengthM = nodeA && nodeB 
          ? Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y, (nodeB.z || 0) - (nodeA.z || 0)) 
          : 0;

        const rolInfo = ROL_LABELS[seg.rolEstructural || 'viga_principal'] || { 
          label: 'Viga Estructural', 
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700' 
        };

        const matchingRoleSegs = Object.values(segments).filter(s => s.rolEstructural === seg.rolEstructural);
        const countMatching = matchingRoleSegs.length;

        const selectedMultiIds = (engineState?.selectedElementIds || []).filter(id => !!segments[id]);
        const isMultiSelected = selectedMultiIds.length > 1;

        const handleApplySingle = () => {
          if (!tempChosenProfileId) return;
          if (engineState?.updateSegmentProfile) {
            engineState.updateSegmentProfile(seg.id, tempChosenProfileId);
          }
          const chosenProf = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === tempChosenProfileId);
          setFeedbackMsg(`✅ Perfil cambiado a: ${chosenProf?.codigoComercial || tempChosenProfileId}`);
          setTimeout(() => setFeedbackMsg(null), 3000);
        };

        const handleApplyMulti = () => {
          if (!tempChosenProfileId || selectedMultiIds.length === 0) return;
          if (engineState?.updateMultipleSegmentsProfile) {
            engineState.updateMultipleSegmentsProfile(selectedMultiIds, tempChosenProfileId);
          }
          const chosenProf = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === tempChosenProfileId);
          setFeedbackMsg(`⚡ Actualizados ${selectedMultiIds.length} tubos seleccionados a ${chosenProf?.codigoComercial || tempChosenProfileId}`);
          setTimeout(() => setFeedbackMsg(null), 3500);
        };

        const handleApplyAllMatching = () => {
          if (!tempChosenProfileId || countMatching === 0) return;
          if (engineState?.updateMultipleSegmentsProfile) {
            engineState.updateMultipleSegmentsProfile(matchingRoleSegs.map(s => s.id), tempChosenProfileId);
          }
          const chosenProf = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === tempChosenProfileId);
          setFeedbackMsg(`⚡ Actualizados ${countMatching} tubos (${rolInfo.label}) a ${chosenProf?.codigoComercial || tempChosenProfileId}`);
          setTimeout(() => setFeedbackMsg(null), 3500);
        };

        const currentPos = panelPos ?? {
          x: typeof window !== 'undefined' && window.innerWidth >= 640 ? Math.max(20, window.innerWidth - 410) : 12,
          y: 70
        };

        return (
          <div 
            ref={panelContainerRef}
            style={{
              left: `${currentPos.x}px`,
              top: `${currentPos.y}px`,
              transition: isDraggingPanel ? 'none' : 'box-shadow 0.2s',
            }}
            className={`fixed z-40 w-[calc(100vw-24px)] sm:w-96 max-w-[420px] max-h-[85vh] bg-slate-900/95 text-white border-2 border-cyan-500/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-md pointer-events-auto flex flex-col ${
              isDraggingPanel ? 'ring-2 ring-cyan-400 select-none cursor-grabbing opacity-95 shadow-cyan-900/50' : ''
            }`}
          >
            {/* Cabecera / Drag handle universal para mover en cualquier dirección */}
            <div 
              onPointerDown={handlePanelPointerDown}
              className="flex flex-col select-none touch-none pb-2 border-b border-slate-800 cursor-grab active:cursor-grabbing hover:bg-slate-800/40 rounded-xl px-1 -mx-1 transition-colors"
              title="Haz clic y arrastra para mover el inspector a cualquier parte de la pantalla"
            >
              {/* Barra de agarre visual (Grip) */}
              <div className="w-16 h-1 bg-slate-600 hover:bg-cyan-400 rounded-full mx-auto mb-2 transition-colors cursor-grab" />

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                    <Wrench className="w-4 h-4" />
                  </span>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-black text-white tracking-wide truncate">Inspector 3D de Perfil</h3>
                      <span className="text-[9px] font-bold text-cyan-400/90 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60 hidden sm:inline shrink-0">
                        ✥ Arrastrable
                      </span>
                    </div>
                    <p className="text-[10px] text-cyan-300/80 truncate">Seleccionado directamente en 3D</p>
                  </div>
                </div>

                {/* Botones de acople rápido y cierre */}
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={handleDockLeft}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex items-center"
                    title="Mover a la izquierda"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={handleDockRight}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex items-center"
                    title="Mover a la derecha"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isPanelCollapsed ? "Expandir panel" : "Minimizar panel"}
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedSegmentId(null);
                      if (engineState?.setSelectedElementIds) engineState.setSelectedElementIds([]);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-0.5"
                    title="Cerrar inspector"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Contenido scrolleable (si no está minimizado) */}
            {!isPanelCollapsed && (
              <div className="overflow-y-auto flex-1 overscroll-contain pr-1 pb-4">

            {/* Datos del Tubo */}
            <div className="py-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rolInfo.badgeBg}`}>
                  {rolInfo.label}
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md">
                  L = {lengthM.toFixed(2)} m
                </span>
              </div>

              {/* Perfil Actual Asignado */}
              <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400">Perfil actual:</div>
                <div className="font-black text-amber-300 truncate">{currentProf.nombre}</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                  <span>Sección: {currentProf.anchoMm}x{currentProf.altoMm}mm (e: {currentProf.espesorMm}mm)</span>
                  <span className="font-mono text-cyan-400">{currentProf.pesoLinealKgM} kg/m</span>
                </div>
              </div>

              {/* Selector de Nuevo Perfil */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-300 block">
                  Cambiar a nuevo perfil:
                </label>
                <select
                  value={tempChosenProfileId || seg.profileId}
                  onChange={(e) => setTempChosenProfileId(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-700 hover:border-cyan-500 focus:border-cyan-400 text-white rounded-xl p-2 text-xs font-bold outline-none cursor-pointer transition-colors"
                >
                  {PERFILES_TECHOS_AGRUPADOS.map(grp => (
                    <optgroup key={grp.norma} label={grp.label} className="bg-slate-900 text-cyan-300 font-bold">
                      {grp.items.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-950 text-white py-1">
                          {p.codigoComercial} - {p.nombre} ({p.pesoLinealKgM} kg/m)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Banner de Confirmación / Toast */}
              {feedbackMsg && (
                <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{feedbackMsg}</span>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="pt-1.5 flex flex-col gap-1.5">
                {isMultiSelected && (
                  <button
                    onClick={handleApplyMulti}
                    disabled={!tempChosenProfileId}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      !tempChosenProfileId
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-98'
                    }`}
                    title={`Aplica este perfil a los ${selectedMultiIds.length} tubos seleccionados con Shift+Clic`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aplicar a los {selectedMultiIds.length} seleccionados</span>
                  </button>
                )}

                <button
                  onClick={handleApplySingle}
                  disabled={!tempChosenProfileId || tempChosenProfileId === seg.profileId}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                    !tempChosenProfileId || tempChosenProfileId === seg.profileId
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-98'
                  }`}
                  title="Cambia el perfil únicamente para este tubo seleccionado en 3D"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aplicar a este tubo</span>
                </button>

                {countMatching > 1 && (
                  <button
                    onClick={handleApplyAllMatching}
                    className="w-full py-1.5 px-3 rounded-xl text-[11px] font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-98 border border-purple-400/30"
                    title={`Aplica este perfil de una sola vez a los ${countMatching} tubos con el rol "${rolInfo.label}"`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-200" />
                    <span>Aplicar a todos los {countMatching} ({rolInfo.label})</span>
                  </button>
                )}

                {Object.keys(segments).length > 1 && Object.keys(segments).length !== countMatching && (
                  <button
                    onClick={() => {
                      if (!tempChosenProfileId) return;
                      const allSegIds = Object.keys(segments);
                      if (engineState?.updateMultipleSegmentsProfile) {
                        engineState.updateMultipleSegmentsProfile(allSegIds, tempChosenProfileId);
                      }
                      const chosenProf = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === tempChosenProfileId);
                      setFeedbackMsg(`⚡ Actualizados TODOS los ${allSegIds.length} tubos a ${chosenProf?.codigoComercial || tempChosenProfileId}`);
                      setTimeout(() => setFeedbackMsg(null), 3500);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98 border border-slate-600/50"
                    title={`Aplica este perfil a todos los ${Object.keys(segments).length} tubos de la estructura metálica`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Cambiar toda la estructura ({Object.keys(segments).length} tubos)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
            )}
          </div>
        );
      })()}

      {/* Pista de Selección en 3D para el Usuario */}
      {!activeSelectedSegId && (
        <div className="absolute bottom-4 left-3 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 text-slate-300 border border-slate-700/60 rounded-xl text-[11px] backdrop-blur-xs shadow-md">
          <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>💡 Clic en cualquier tubo del 3D para seleccionarlo y cambiar su perfil</span>
        </div>
      )}

      {/* CAJÓN LATERAL DE CONFIGURACIÓN & CALIBRES PERÚ */}
      {showSettingsDrawer && (
        <div className="absolute top-16 right-3 w-80 bg-white/95 border border-slate-200 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-600" />
              Materiales & Calibres de Aluzinc
            </span>
            <button 
              onClick={() => setShowSettingsDrawer(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de Calibres y Modelos de Aluzinc Perú */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Calamina / Aluzinc Perú:</span>
            <select
              value={selectedModeloId}
              onChange={(e) => handleModeloChange(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
            >
              {MODELOS_ALUZINC_PERU.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Slider de Opacidad */}
          <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold text-slate-600 uppercase">Opacidad Cobertura:</span>
              <span className="font-mono font-black text-amber-600">{Math.round(aluzincOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="1.0"
              step="0.05"
              value={aluzincOpacity}
              onChange={(e) => setAluzincOpacity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Selector de Color de Plancha */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Color Comercial de Plancha:</span>
            <div className="grid grid-cols-5 gap-2">
              {[
                { hex: 0x0284c7, label: 'Azul' },
                { hex: 0xdc2626, label: 'Rojo' },
                { hex: 0x16a34a, label: 'Verde' },
                { hex: 0x334155, label: 'Gris' },
                { hex: 0xf8fafc, label: 'Blanco' }
              ].map(c => (
                <button
                  key={c.hex}
                  onClick={() => setAluzincColorHex(c.hex)}
                  className={`h-8 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                    aluzincColorHex === c.hex ? 'border-amber-500 scale-105 shadow-md ring-2 ring-amber-300' : 'border-slate-300 hover:scale-102'
                  }`}
                  style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, '0')}` }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
