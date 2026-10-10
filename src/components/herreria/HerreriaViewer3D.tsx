// Visor 3D Isométrico Paramétrico para Herrería y Carpintería Metálica
// Proyección 3D en tiempo real de piezas (PiezaCad) y accesorios (AccesorioCad) como única fuente de verdad
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  RotateCw, 
  Sun,
  Plus,
  Minus,
  Maximize2,
  Compass,
  Search,
  Layers,
  ArrowLeft,
  ArrowRight,
  Minimize2,
  Box,
  SlidersHorizontal,
  Wrench,
  CheckCircle2,
  X,
  Video,
  Square
} from 'lucide-react';
import { HerreriaDesign } from './herreriaTypes';
import { PERFILES_CATALOGO } from './herreriaCatalog';

// Helper para generar textura procedural de Plancha Estriada / Estrellada (Diamond plate / Alfajor)
function createPlanchaEstriadaTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Fondo base metálico
  ctx.fillStyle = colorHex || '#334155';
  ctx.fillRect(0, 0, 256, 256);

  // Veteado suave de acero laminado
  for (let i = 0; i < 256; i += 3) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + Math.random() * 0.03})`;
    ctx.fillRect(0, i, 256, 1);
  }

  // Trama de estrías / estrellas en relieve diamantado (5-bar / lágrima cruzada)
  const drawDiamond = (cx: number, cy: number, rotDeg: number, len = 24, thick = 7) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotDeg * Math.PI) / 180);

    // Sombra inferior para relieve 3D
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(1.5, 1.5, len / 2, thick / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo de la estría metálica
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, len / 2, thick / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brillo especular superior
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.ellipse(-1, -1, len / 2.5, thick / 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const step = 64;
  for (let y = 0; y < 256; y += step) {
    for (let x = 0; x < 256; x += step) {
      // Grupo 1: inclinadas a 45°
      drawDiamond(x + 16, y + 16, 45);
      drawDiamond(x + 28, y + 28, 45);
      // Grupo 2: inclinadas a 135° (cruzadas / estrelladas)
      drawDiamond(x + 48, y + 16, 135);
      drawDiamond(x + 48, y + 48, 45);
      drawDiamond(x + 16, y + 48, 135);
      drawDiamond(x + 28, y + 60, 135);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Helper para generar textura de Plancha Machihembrada (Duelas metálicas con bisel en V)
function createPlanchaMachihembradaTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Fondo color de la plancha
  ctx.fillStyle = colorHex || '#334155';
  ctx.fillRect(0, 0, 128, 128);

  // Veteado suave lineal vertical (acabado metal laminado)
  for (let i = 0; i < 128; i += 2) {
    const alpha = 0.02 + Math.random() * 0.04;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(i, 0, 1, 128);
  }

  // Canal/Junta machihembrada en borde izquierdo (sombra profunda)
  const gradIzq = ctx.createLinearGradient(0, 0, 12, 0);
  gradIzq.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  gradIzq.addColorStop(0.3, 'rgba(0, 0, 0, 0.35)');
  gradIzq.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradIzq;
  ctx.fillRect(0, 0, 12, 128);

  // Bisel brillante en borde derecho (arista viva de encastre)
  const gradDer = ctx.createLinearGradient(116, 0, 128, 0);
  gradDer.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradDer.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
  gradDer.addColorStop(1, 'rgba(255, 255, 255, 0.65)');
  ctx.fillStyle = gradDer;
  ctx.fillRect(116, 0, 12, 128);

  // Línea oscura de separación de encastre
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0, 0, 2, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Helper para generar textura de Plancha Perforada (Círculos regulares con transparencia)
function createPlanchaPerforadaTexture(colorHex: string): { map: THREE.CanvasTexture; alpha: THREE.CanvasTexture } {
  const canvasMap = document.createElement('canvas');
  canvasMap.width = 128;
  canvasMap.height = 128;
  const ctxMap = canvasMap.getContext('2d')!;

  const canvasAlpha = document.createElement('canvas');
  canvasAlpha.width = 128;
  canvasAlpha.height = 128;
  const ctxAlpha = canvasAlpha.getContext('2d')!;

  // Map
  ctxMap.fillStyle = colorHex || '#475569';
  ctxMap.fillRect(0, 0, 128, 128);

  // Alpha (blanco = sólido, negro = agujero transparente)
  ctxAlpha.fillStyle = '#ffffff';
  ctxAlpha.fillRect(0, 0, 128, 128);

  const r = 8;
  const step = 32;

  const drawHole = (cx: number, cy: number) => {
    // Sombra interior del agujero en el map
    ctxMap.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctxMap.beginPath();
    ctxMap.arc(cx, cy, r, 0, Math.PI * 2);
    ctxMap.fill();

    // Borde biselado
    ctxMap.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctxMap.lineWidth = 1.5;
    ctxMap.stroke();

    // En el alpha map: negro = agujero transparente
    ctxAlpha.fillStyle = '#000000';
    ctxAlpha.beginPath();
    ctxAlpha.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctxAlpha.fill();
  };

  for (let y = 0; y <= 128; y += step) {
    for (let x = 0; x <= 128; x += step) {
      drawHole(x, y);
      drawHole(x + step / 2, y + step / 2);
    }
  }

  const mapTex = new THREE.CanvasTexture(canvasMap);
  mapTex.wrapS = THREE.RepeatWrapping;
  mapTex.wrapT = THREE.RepeatWrapping;

  const alphaTex = new THREE.CanvasTexture(canvasAlpha);
  alphaTex.wrapS = THREE.RepeatWrapping;
  alphaTex.wrapT = THREE.RepeatWrapping;

  return { map: mapTex, alpha: alphaTex };
}

interface HerreriaViewer3DProps {
  design: HerreriaDesign;
  onVolver2D?: (vista?: 'frontal' | 'superior' | 'lateral') => void;
  onOpenInspector?: () => void;
  isInspectorOpen?: boolean;
  onUpdateDesign?: (design: HerreriaDesign) => void;
}

export const HerreriaViewer3D: React.FC<HerreriaViewer3DProps> = ({ 
  design,
  onVolver2D,
  onOpenInspector,
  isInspectorOpen,
  onUpdateDesign
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(false);
  // Grabación de video del visor 3D (giro lento + descarga)
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const handleRecord3D = useCallback(() => {
    if (isRecording) { recorderRef.current?.stop(); return; }
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
        a.download = `herreria_3d_${new Date().toISOString().split('T')[0]}.webm`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setIsRecording(false);
      };
      const prevAuto = autoRotateRef.current;
      setAutoRotate(true);
      recorder.start();
      setIsRecording(true);
      window.setTimeout(() => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
        if (!prevAuto) setAutoRotate(false);
      }, 14000);
    } catch (err: any) {
      console.warn('No se pudo iniciar la grabación 3D:', err);
      alert('No se pudo iniciar la grabación: ' + (err?.message || err));
      setIsRecording(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);
  const [modoIluminacion, setModoIluminacion] = useState<'estudio' | 'obra' | 'alambrico'>('estudio');
  const [mostrarHerrajes, setMostrarHerrajes] = useState(true);

  // Selección e Inspección 3D Interactiva de Piezas de Herrería
  const [selectedPiezaIds, setSelectedPiezaIds] = useState<string[]>([]);
  const [selectedPiezaId, setSelectedPiezaId] = useState<string | null>(null);
  const [tempChosenPerfilId, setTempChosenPerfilId] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  // Soporte de arrastre libre y reposicionamiento del Inspector 3D (PC, tablet y móvil)
  const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
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

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Control orbital manual táctil y giroscopio
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRadiusRef = useRef(4.5);
  const cameraAngleThetaRef = useRef(0.45); // Ángulo azimutal
  const cameraAnglePhiRef = useRef(1.15);   // Ángulo polar
  const cameraTargetRef = useRef(new THREE.Vector3(1.0, 1.1, 0));

  // Sensor de Giroscopio de Dispositivos Móviles (Calibrado Suave y Lento)
  const [gyroActive, setGyroActive] = useState<boolean>(false);
  const [gyroSpeedMode, setGyroSpeedMode] = useState<'lento' | 'muy_lento' | 'medio'>('lento');

  const updateCameraPos = useCallback(() => {
    if (!cameraRef.current) return;
    const theta = cameraAngleThetaRef.current;
    const phi = Math.max(0.04, Math.min(Math.PI - 0.04, cameraAnglePhiRef.current));
    const r = cameraRadiusRef.current;

    cameraRef.current.position.x = cameraTargetRef.current.x + r * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = cameraTargetRef.current.y + r * Math.cos(phi);
    cameraRef.current.position.z = cameraTargetRef.current.z + r * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(cameraTargetRef.current);
    
    // Si tenemos un renderer, forzamos renderizado manual si es necesario
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);

  // Escuchar Giroscopio / Inclinación con amortiguación suave y velocidad reducida
  useEffect(() => {
    if (!gyroActive) return;

    let prevOrientation: { gamma: number; beta: number } | null = null;

    const handleDeviceMotion = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // En la primera lectura, solo memorizamos la orientación de referencia
        if (!prevOrientation) {
          prevOrientation = { gamma: e.gamma, beta: e.beta };
          return;
        }

        // Calculamos la variación relativa (delta) respecto a la última posición
        const deltaGamma = e.gamma - prevOrientation.gamma;
        const deltaBeta = e.beta - prevOrientation.beta;
        prevOrientation = { gamma: e.gamma, beta: e.beta };

        // Descartar saltos bruscos si el giroscopio cruza ±180°
        if (Math.abs(deltaGamma) > 25 || Math.abs(deltaBeta) > 25) return;

        // Zona muerta mínima para filtrar temblores involuntarios del pulso
        const deadzone = 0.08;
        const filteredGamma = Math.abs(deltaGamma) > deadzone ? deltaGamma : 0;
        const filteredBeta = Math.abs(deltaBeta) > deadzone ? deltaBeta : 0;

        // Factores calibrados a velocidad lenta y confortable (sin giros bruscos)
        const factor = gyroSpeedMode === 'muy_lento' ? 0.0025 : (gyroSpeedMode === 'medio' ? 0.009 : 0.005);

        const gammaRad = (filteredGamma * Math.PI / 180) * factor;
        const betaRad = (filteredBeta * Math.PI / 180) * factor;

        cameraAngleThetaRef.current += gammaRad;
        cameraAnglePhiRef.current = Math.max(0.04, Math.min(Math.PI - 0.04, cameraAnglePhiRef.current + betaRad));
        updateCameraPos();
      }
    };

    window.addEventListener('deviceorientation', handleDeviceMotion);
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceMotion);
      prevOrientation = null;
    };
  }, [gyroActive, gyroSpeedMode, updateCameraPos]);

  const handleZoomIn = () => {
    cameraRadiusRef.current = Math.max(0.10, cameraRadiusRef.current * 0.70);
    updateCameraPos();
  };

  const handleZoomOut = () => {
    cameraRadiusRef.current = Math.min(30, cameraRadiusRef.current * 1.30);
    updateCameraPos();
  };

  // Modos de Proximidad Directa para Herrería
  const setProximityCloseInspection = () => {
    cameraRadiusRef.current = 0.35; // Inspección ultra-cercana a chapas/bisagras
    updateCameraPos();
  };

  const resetCamera = () => {
    cameraAngleThetaRef.current = 0.45;
    cameraAnglePhiRef.current = 1.15;
    const piezas = design.piezas || [];
    if (piezas.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      piezas.forEach(p => {
        minX = Math.min(minX, p.x1, p.x2);
        maxX = Math.max(maxX, p.x1, p.x2);
        minY = Math.min(minY, p.y1, p.y2);
        maxY = Math.max(maxY, p.y1, p.y2);
        minZ = Math.min(minZ, p.z1 || 0, p.z2 || 0);
        maxZ = Math.max(maxZ, p.z1 || 0, p.z2 || 0);
      });
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = isFinite(minZ) && isFinite(maxZ) ? (minZ + maxZ) / 2 : 0;
      const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1.2);
      cameraTargetRef.current.set(centerX, centerY, centerZ);
      cameraRadiusRef.current = Math.max(2.0, span * 2.0);
    } else {
      cameraTargetRef.current.set(1.0, 1.1, 0);
      cameraRadiusRef.current = 4.5;
    }
    updateCameraPos();
  };



  // Construcción del modelo 3D a partir del PROJECT MODEL (design.piezas)
  const construirModelo3D = useCallback((scene: THREE.Scene, d: HerreriaDesign) => {
    const isWire = modoIluminacion === 'alambrico';

    // Materiales PBR
    const rawHex = d.acabado.colorHex || '#475569';
    const isPitchBlack = rawHex === '#000000' || rawHex === '#0f172a' || rawHex === '#1e293b' || rawHex === '#09090b' || rawHex === '#111827';
    const renderMetalHex = isPitchBlack ? '#475569' : rawHex;

    const metalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(renderMetalHex),
      metalness: 0.38,
      roughness: 0.55,
      wireframe: isWire
    });

    const latonMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.2,
      wireframe: isWire
    });

    const cromoMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.12,
      wireframe: isWire
    });

    const vidrioMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5,
      wireframe: isWire
    });

    const modeloGroup = new THREE.Group();
    modeloGroup.name = 'modelo_piezas';
    scene.add(modeloGroup);

    const piezas = d.piezas || [];

    // Helper to check if two endpoints are contiguous (within 0.02m)
    const arePointsNear = (pA: THREE.Vector3, pB: THREE.Vector3, thresh = 0.02) => {
      return pA.distanceTo(pB) <= thresh;
    };

    // Renderizar cada pieza CAD exactamente como fue trazada con resolución geométrica de uniones
    piezas.forEach((pz) => {
      const perfil = PERFILES_CATALOGO.find(p => p.id === pz.perfilId) || PERFILES_CATALOGO[0];
      const p1 = new THREE.Vector3(pz.x1, pz.y1, pz.z1 || 0);
      const p2 = new THREE.Vector3(pz.x2, pz.y2, pz.z2 || 0);

      // CASO A: PLANCHA / RELLENO (Machihembrada, Estriada/Estrellada, Acanalada/Corrugada, Perforada, Lisa, Vidrio)
      const isPlancha = pz.esPlancha || pz.tipo === 'plancha' || (pz.anchoPlanchaM && pz.altoPlanchaM) || pz.subtipoPlancha || pz.tipoRelleno === 'plancha' || pz.tipoRelleno === 'plancha_estriada' || pz.tipoRelleno === 'plancha_perforada';

      const attachPieceData = (obj: THREE.Object3D) => {
        const uData = {
          piezaId: pz.id,
          marca: pz.marca,
          nombre: pz.nombre,
          grupo: pz.grupo || 'general',
          perfilId: pz.perfilId,
          esPlancha: !!isPlancha
        };
        obj.userData = uData;
        obj.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.userData = { ...uData };
          }
        });
      };
      if (isPlancha) {
        const minX = Math.min(pz.x1, pz.x2);
        const minY = Math.min(pz.y1, pz.y2);
        const minZ = Math.min(pz.z1 || 0, pz.z2 || 0);
        const diffY = Math.abs(pz.y2 - pz.y1);
        const diffZ = Math.abs((pz.z2 || 0) - (pz.z1 || 0));
        
        // Detectar si la plancha está en plano horizontal X-Z (como huellas de escalera, asiento de silla, tablero de mesa)
        const isHorizontal = diffY < 0.02 && (diffZ > 0.01 || (pz.altoPlanchaM && pz.altoPlanchaM > 0));
        
        const w = Math.max(0.02, pz.anchoPlanchaM || Math.abs(pz.x2 - pz.x1));
        const depthZ = Math.max(0.02, (isHorizontal ? pz.altoPlanchaM : undefined) || diffZ || 0.04);
        const h = Math.max(0.02, (!isHorizontal ? pz.altoPlanchaM : undefined) || diffY || 0.04);
        const esp = Math.max(0.0015, (pz.espesorPlanchaMm || 2.0) / 1000);
        const baseZ = pz.z1 || 0;

        const subtipo = pz.subtipoPlancha || (pz.tipoRelleno === 'plancha_estriada' ? 'estriada' : (pz.tipoRelleno === 'plancha_perforada' ? 'perforada' : 'lisa'));
        const colorHex = pz.colorHex || d.acabado.colorHex || '#334155';

        if (pz.tipoRelleno === 'vidrio') {
          const geo = isHorizontal ? new THREE.BoxGeometry(w, esp, depthZ) : new THREE.BoxGeometry(w, h, esp);
          const mesh = new THREE.Mesh(geo, vidrioMat.clone());
          if (isHorizontal) {
            mesh.position.set(minX + w / 2, pz.y1 + esp / 2, minZ + depthZ / 2);
          } else {
            mesh.position.set(minX + w / 2, minY + h / 2, baseZ + esp / 2);
          }
          attachPieceData(mesh);
          modeloGroup.add(mesh);
        } else if (subtipo === 'machihembrada') {
          // 1. PLANCHA MACHIHEMBRADA (Duelas individuales con juntas y biseles en 3D real)
          const planchaGroup = new THREE.Group();
          const numDuelas = Math.max(2, Math.round(w / 0.12));
          const duelaW = w / numDuelas;
          const seamGap = 0.005; // 5mm junta ranurada
          const duelaEsp = esp + 0.003; // sobresale 3mm del fondo

          const machTexture = createPlanchaMachihembradaTexture(colorHex);
          machTexture.repeat.set(1, 1);

          const duelaMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorHex),
            map: machTexture,
            bumpMap: machTexture,
            bumpScale: 0.04,
            metalness: 0.85,
            roughness: 0.28,
            wireframe: isWire
          });

          const fondoMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#0f172a'),
            metalness: 0.9,
            roughness: 0.5,
            wireframe: isWire
          });

          if (isHorizontal) {
            const fondoGeo = new THREE.BoxGeometry(w, esp, depthZ);
            const fondoMesh = new THREE.Mesh(fondoGeo, fondoMat);
            fondoMesh.position.set(minX + w / 2, pz.y1 + esp / 2, minZ + depthZ / 2);
            fondoMesh.castShadow = true;
            fondoMesh.receiveShadow = true;
            planchaGroup.add(fondoMesh);

            const duelaGeo = new THREE.BoxGeometry(duelaW - seamGap, duelaEsp, depthZ);
            for (let i = 0; i < numDuelas; i++) {
              const duelaMesh = new THREE.Mesh(duelaGeo, duelaMat);
              const posX = minX + i * duelaW + (duelaW - seamGap) / 2 + seamGap / 2;
              duelaMesh.position.set(posX, pz.y1 + duelaEsp / 2, minZ + depthZ / 2);
              duelaMesh.castShadow = true;
              duelaMesh.receiveShadow = true;
              planchaGroup.add(duelaMesh);
            }
          } else {
            // Plancha base de fondo vertical
            const fondoGeo = new THREE.BoxGeometry(w, h, esp);
            const fondoMesh = new THREE.Mesh(fondoGeo, fondoMat);
            fondoMesh.position.set(minX + w / 2, minY + h / 2, baseZ + esp / 2);
            fondoMesh.castShadow = true;
            fondoMesh.receiveShadow = true;
            planchaGroup.add(fondoMesh);

            // Duelas individuales en 3D
            const duelaGeo = new THREE.BoxGeometry(duelaW - seamGap, h, duelaEsp);
            for (let i = 0; i < numDuelas; i++) {
              const duelaMesh = new THREE.Mesh(duelaGeo, duelaMat);
              const posX = minX + i * duelaW + (duelaW - seamGap) / 2 + seamGap / 2;
              duelaMesh.position.set(posX, minY + h / 2, baseZ + duelaEsp / 2);
              duelaMesh.castShadow = true;
              duelaMesh.receiveShadow = true;
              planchaGroup.add(duelaMesh);

              // Bisel central decorativo en cada duela
              const bevelGeo = new THREE.BoxGeometry(0.003, h, duelaEsp + 0.001);
              const bevelMesh = new THREE.Mesh(bevelGeo, fondoMat);
              bevelMesh.position.set(posX, minY + h / 2, baseZ + (duelaEsp + 0.001) / 2);
              planchaGroup.add(bevelMesh);
            }
          }
          attachPieceData(planchaGroup);
          modeloGroup.add(planchaGroup);
        } else if (subtipo === 'estriada') {
          // 2. PLANCHA ESTRIADA / ESTRELLADA (Textura diamond tread bump + relieves 3D físicos)
          const planchaGroup = new THREE.Group();
          const estriadaTex = createPlanchaEstriadaTexture(colorHex);
          const repeatY = isHorizontal ? Math.max(2, Math.round(depthZ / 0.08)) : Math.max(2, Math.round(h / 0.08));
          estriadaTex.repeat.set(Math.max(2, Math.round(w / 0.08)), repeatY);

          const matEstriada = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorHex),
            map: estriadaTex,
            bumpMap: estriadaTex,
            bumpScale: 0.09,
            metalness: 0.88,
            roughness: 0.25,
            wireframe: isWire
          });

          if (isHorizontal) {
            // Plancha base horizontal (como huella de escalera)
            const baseGeo = new THREE.BoxGeometry(w, esp, depthZ);
            const baseMesh = new THREE.Mesh(baseGeo, matEstriada);
            baseMesh.position.set(minX + w / 2, pz.y1 + esp / 2, minZ + depthZ / 2);
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            planchaGroup.add(baseMesh);

            const stepX = 0.07;
            const stepZ = 0.07;
            const cols = Math.floor(w / stepX);
            const rows = Math.floor(depthZ / stepZ);
            const count = Math.min(120, cols * rows);

            if (count > 0 && !isWire) {
              const lugGeo = new THREE.BoxGeometry(0.022, 0.0035, 0.007);
              const lugMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0xd1d5db),
                metalness: 0.92,
                roughness: 0.18
              });
              const instancedLugs = new THREE.InstancedMesh(lugGeo, lugMat, count);
              const dummy = new THREE.Object3D();
              let idx = 0;

              for (let r = 0; r < rows && idx < count; r++) {
                for (let c = 0; c < cols && idx < count; c++) {
                  const px = minX + (c + 0.5) * (w / cols);
                  const pzFront = minZ + (r + 0.5) * (depthZ / rows);
                  const pyTop = pz.y1 + esp + 0.00175;
                  const rotY = ((r + c) % 2 === 0 ? 45 : 135) * (Math.PI / 180);

                  dummy.position.set(px, pyTop, pzFront);
                  dummy.rotation.set(0, rotY, 0);
                  dummy.updateMatrix();
                  instancedLugs.setMatrixAt(idx, dummy.matrix);
                  idx++;
                }
              }
              instancedLugs.instanceMatrix.needsUpdate = true;
              instancedLugs.castShadow = true;
              planchaGroup.add(instancedLugs);
            }
          } else {
            // Plancha base vertical
            const baseGeo = new THREE.BoxGeometry(w, h, esp);
            const baseMesh = new THREE.Mesh(baseGeo, matEstriada);
            baseMesh.position.set(minX + w / 2, minY + h / 2, baseZ + esp / 2);
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            planchaGroup.add(baseMesh);

            const stepX = 0.07;
            const stepY = 0.07;
            const cols = Math.floor(w / stepX);
            const rows = Math.floor(h / stepY);
            const count = Math.min(350, cols * rows);

            if (count > 0 && !isWire) {
              const lugGeo = new THREE.BoxGeometry(0.022, 0.007, 0.0035);
              const lugMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0xd1d5db),
                metalness: 0.92,
                roughness: 0.18
              });
              const instancedLugs = new THREE.InstancedMesh(lugGeo, lugMat, count);
              const dummy = new THREE.Object3D();
              let idx = 0;

              for (let r = 0; r < rows && idx < count; r++) {
                for (let c = 0; c < cols && idx < count; c++) {
                  const px = minX + (c + 0.5) * (w / cols);
                  const py = minY + (r + 0.5) * (h / rows);
                  const pzFront = baseZ + esp + 0.00175;
                  const rot = ((r + c) % 2 === 0 ? 45 : 135) * (Math.PI / 180);

                  dummy.position.set(px, py, pzFront);
                  dummy.rotation.set(0, 0, rot);
                  dummy.updateMatrix();
                  instancedLugs.setMatrixAt(idx, dummy.matrix);
                  idx++;
                }
              }
              instancedLugs.instanceMatrix.needsUpdate = true;
              instancedLugs.castShadow = true;
              planchaGroup.add(instancedLugs);
            }
          }
          attachPieceData(planchaGroup);
          modeloGroup.add(planchaGroup);
        } else if (subtipo === 'acanalada' || subtipo === 'corrugada') {
          // 3. PLANCHA ACANALADA / CORRUGADA (Ondas y canales trapezoidales 3D)
          const planchaGroup = new THREE.Group();
          const baseGeo = isHorizontal ? new THREE.BoxGeometry(w, esp, depthZ) : new THREE.BoxGeometry(w, h, esp);
          const baseMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorHex),
            metalness: 0.88,
            roughness: 0.28,
            wireframe: isWire
          });
          const baseMesh = new THREE.Mesh(baseGeo, baseMat);
          if (isHorizontal) {
            baseMesh.position.set(minX + w / 2, pz.y1 + esp / 2, minZ + depthZ / 2);
          } else {
            baseMesh.position.set(minX + w / 2, minY + h / 2, baseZ + esp / 2);
          }
          baseMesh.castShadow = true;
          baseMesh.receiveShadow = true;
          planchaGroup.add(baseMesh);

          const numCanales = Math.max(3, Math.floor(w / 0.08));
          const canalW = 0.024;
          const canalProf = 0.008;
          const canalMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorHex),
            metalness: 0.92,
            roughness: 0.22,
            wireframe: isWire
          });

          for (let i = 0; i < numCanales; i++) {
            const posX = minX + (i + 0.5) * (w / numCanales);
            if (isHorizontal) {
              const ribGeo = new THREE.BoxGeometry(canalW, esp + canalProf, depthZ);
              const ribMesh = new THREE.Mesh(ribGeo, canalMat);
              ribMesh.position.set(posX, pz.y1 + (esp + canalProf) / 2, minZ + depthZ / 2);
              ribMesh.castShadow = true;
              planchaGroup.add(ribMesh);
            } else {
              const ribGeo = new THREE.BoxGeometry(canalW, h, esp + canalProf);
              const ribMesh = new THREE.Mesh(ribGeo, canalMat);
              ribMesh.position.set(posX, minY + h / 2, baseZ + (esp + canalProf) / 2);
              ribMesh.castShadow = true;
              planchaGroup.add(ribMesh);
            }
          }
          attachPieceData(planchaGroup);
          modeloGroup.add(planchaGroup);
        } else if (subtipo === 'perforada') {
          // 4. PLANCHA PERFORADA (Malla de perforaciones con transparencia)
          const { map: perfMap, alpha: perfAlpha } = createPlanchaPerforadaTexture(colorHex);
          const repeatY = isHorizontal ? Math.max(4, Math.round(depthZ / 0.035)) : Math.max(4, Math.round(h / 0.035));
          perfMap.repeat.set(Math.max(4, Math.round(w / 0.035)), repeatY);
          perfAlpha.repeat.set(Math.max(4, Math.round(w / 0.035)), repeatY);

          const perfMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorHex),
            map: perfMap,
            alphaMap: perfAlpha,
            transparent: true,
            alphaTest: 0.35,
            bumpMap: perfMap,
            bumpScale: 0.03,
            metalness: 0.85,
            roughness: 0.3,
            side: THREE.DoubleSide,
            wireframe: isWire
          });

          const geo = isHorizontal ? new THREE.BoxGeometry(w, esp, depthZ) : new THREE.BoxGeometry(w, h, esp);
          const mesh = new THREE.Mesh(geo, perfMat);
          if (isHorizontal) {
            mesh.position.set(minX + w / 2, pz.y1 + esp / 2, minZ + depthZ / 2);
          } else {
            mesh.position.set(minX + w / 2, minY + h / 2, baseZ + esp / 2);
          }
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          attachPieceData(mesh);
          modeloGroup.add(mesh);
        } else {
          // 5. PLANCHA LISA ESTÁNDAR
          const lisaMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(colorHex),
            metalness: 0.82,
            roughness: 0.26,
            wireframe: isWire
          });
          const geo = isHorizontal ? new THREE.BoxGeometry(w, esp, depthZ) : new THREE.BoxGeometry(w, h, esp);
          const mesh = new THREE.Mesh(geo, lisaMat);
          if (isHorizontal) {
            mesh.position.set(minX + w / 2, pz.y1 + esp / 2, minZ + depthZ / 2);
          } else {
            mesh.position.set(minX + w / 2, minY + h / 2, baseZ + esp / 2);
          }
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          attachPieceData(mesh);
          modeloGroup.add(mesh);
        }

        // PERNOS / REMACHES EN ESQUINAS
        if (pz.conPernos === true && w > 0.08 && !isWire) {
          const pernoGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.006, 6);
          const washerGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.002, 12);
          const pernoMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            metalness: 0.95,
            roughness: 0.15
          });

          const margin = 0.025;
          if (isHorizontal) {
            const cornerPositions = [
              [minX + margin, minZ + margin],
              [minX + w - margin, minZ + margin],
              [minX + margin, minZ + depthZ - margin],
              [minX + w - margin, minZ + depthZ - margin]
            ];
            cornerPositions.forEach(([cx, cz]) => {
              const washerMesh = new THREE.Mesh(washerGeo, pernoMat);
              washerMesh.position.set(cx, pz.y1 + esp + 0.001, cz);
              modeloGroup.add(washerMesh);

              const pernoMesh = new THREE.Mesh(pernoGeo, pernoMat);
              pernoMesh.position.set(cx, pz.y1 + esp + 0.004, cz);
              pernoMesh.castShadow = true;
              modeloGroup.add(pernoMesh);
            });
          } else if (h > 0.08) {
            const cornerPositions = [
              [minX + margin, minY + margin],
              [minX + w - margin, minY + margin],
              [minX + margin, minY + h - margin],
              [minX + w - margin, minY + h - margin]
            ];

            cornerPositions.forEach(([cx, cy]) => {
              const washerMesh = new THREE.Mesh(washerGeo, pernoMat);
              washerMesh.rotation.x = Math.PI / 2;
              washerMesh.position.set(cx, cy, baseZ + esp + 0.001);
              modeloGroup.add(washerMesh);

              const pernoMesh = new THREE.Mesh(pernoGeo, pernoMat);
              pernoMesh.rotation.x = Math.PI / 2;
              pernoMesh.position.set(cx, cy, baseZ + esp + 0.004);
              pernoMesh.castShadow = true;
              modeloGroup.add(pernoMesh);
            });
          }
        }

        return;
      }

      // CASO B: ARCO CURVO
      if (pz.esCurvo) {
        const flecha = pz.flechaM || 0.35;
        const midPoint = (pz.controlX !== undefined && pz.controlY !== undefined)
          ? new THREE.Vector3(pz.controlX, pz.controlY, pz.z1 || 0)
          : new THREE.Vector3(
              (pz.x1 + pz.x2) / 2,
              Math.max(pz.y1, pz.y2) + flecha,
              (pz.z1 || 0)
            );
        const curve = new THREE.QuadraticBezierCurve3(p1, midPoint, p2);
        const radio = (perfil.anchoMm / 1000) / 2;
        const tubeGeo = new THREE.TubeGeometry(curve, 32, radio, 12, false);
        const tubeMesh = new THREE.Mesh(tubeGeo, metalMat.clone());
        tubeMesh.castShadow = true;
        tubeMesh.receiveShadow = true;
        attachPieceData(tubeMesh);
        modeloGroup.add(tubeMesh);
        return;
      }

      // CASO C: PIEZA RECTA DE PERFIL METÁLICO
      const dirVec = new THREE.Vector3().subVectors(p2, p1);
      const rawLength = dirVec.length();
      if (rawLength < 0.005) return;

      const unitDir = dirVec.clone().normalize();
      const isPlatina = perfil.categoria === 'platina';
      const anchoM = perfil.anchoMm / 1000;
      const altoM = isPlatina ? ((perfil.espesorMm || 4.5) / 1000) : (perfil.altoMm / 1000);

      // Calcular extensión en extremos para uniones a inglete, boca de pez y empalmes 90°
      let startExtend = 0;
      let endExtend = 0;
      const weldCollars: THREE.Vector3[] = [];

      piezas.forEach(otherPz => {
        if (otherPz.id === pz.id || otherPz.esCurvo || otherPz.esPlancha) return;
        const otherPerfil = PERFILES_CATALOGO.find(p => p.id === otherPz.perfilId) || PERFILES_CATALOGO[0];
        const otherAncho = otherPerfil.anchoMm / 1000;
        const otherDimension = Math.max(otherPerfil.anchoMm, otherPerfil.altoMm) / 1000;
        const op1 = new THREE.Vector3(otherPz.x1, otherPz.y1, otherPz.z1 || 0);
        const op2 = new THREE.Vector3(otherPz.x2, otherPz.y2, otherPz.z2 || 0);
        const otherDir = new THREE.Vector3().subVectors(op2, op1).normalize();
        const dot = Math.abs(unitDir.dot(otherDir));

        const isRoundThis = perfil.categoria === 'tubo_redondo';
        const isRoundOther = otherPerfil.categoria === 'tubo_redondo';

        // Determinar offset de contacto óptimo según geometría
        let contactOffset = otherDimension / 2;
        if (isRoundThis && !isRoundOther) {
          // Tubo redondo apoyando sobre cara plana de tubo cuadrado
          contactOffset = otherAncho / 2;
        } else if (!isRoundThis && isRoundOther) {
          // Tubo cuadrado apoyando sobre cilindro redondo (boca de pez / radio de apoyo)
          contactOffset = otherAncho / 2;
        } else if (isRoundThis && isRoundOther) {
          // Tubo redondo sobre tubo redondo (boca de pez coplanar)
          contactOffset = otherAncho / 2;
        }

        // Unión en p1 (inicio de pz)
        if (arePointsNear(p1, op1) || arePointsNear(p1, op2)) {
          if (dot < 0.95) {
            startExtend = Math.max(startExtend, contactOffset);
            if ((isRoundThis !== isRoundOther || isRoundThis) && !isWire) {
              weldCollars.push(p1.clone());
            }
          }
        }
        // Unión en p2 (fin de pz)
        if (arePointsNear(p2, op1) || arePointsNear(p2, op2)) {
          if (dot < 0.95) {
            endExtend = Math.max(endExtend, contactOffset);
            if ((isRoundThis !== isRoundOther || isRoundThis) && !isWire) {
              weldCollars.push(p2.clone());
            }
          }
        }
      });

      const adjP1 = p1.clone().sub(unitDir.clone().multiplyScalar(startExtend));
      const adjP2 = p2.clone().add(unitDir.clone().multiplyScalar(endExtend));
      const adjCenter = new THREE.Vector3().addVectors(adjP1, adjP2).multiplyScalar(0.5);
      const finalLength = Math.max(0.005, adjP1.distanceTo(adjP2));

      let geo: THREE.BufferGeometry;
      if (perfil.categoria === 'tubo_redondo') {
        geo = new THREE.CylinderGeometry(anchoM / 2, anchoM / 2, finalLength, 20);
      } else {
        // Tubo cuadrado, rectangular, platina o ángulo
        geo = new THREE.BoxGeometry(anchoM, finalLength, altoM);
      }

      const pieceMat = metalMat.clone();
      const mesh = new THREE.Mesh(geo, pieceMat);

      // Contornos nítidos para delimitar claramente cada tubo, marco y barrote
      if (!isWire) {
        const edgesGeo = new THREE.EdgesGeometry(geo, 20);
        const edgeLineMat = new THREE.LineBasicMaterial({
          color: isPitchBlack ? 0x94a3b8 : 0x0f172a,
          transparent: true,
          opacity: 0.40
        });
        const tubeLines = new THREE.LineSegments(edgesGeo, edgeLineMat);
        mesh.add(tubeLines);
      }
      mesh.position.copy(adjCenter);

      // Orientación en el espacio 3D
      if (Math.abs(unitDir.z) < 0.001) {
        // 2D coplanar (eje XY)
        const angle = Math.atan2(unitDir.y, unitDir.x);
        mesh.rotation.z = angle - Math.PI / 2;
      } else {
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, unitDir);
        mesh.quaternion.copy(quat);
      }

      // Rotación torsional adicional si está especificada
      if (pz.rotacionDeg) {
        mesh.rotateOnWorldAxis(unitDir, pz.rotacionDeg * (Math.PI / 180));
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Renderizar cordones de soldadura / transición estética en uniones tubo redondo ↔ cuadrado
      if (weldCollars.length > 0 && perfil.categoria === 'tubo_redondo' && !isWire) {
        const weldMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x475569),
          metalness: 0.90,
          roughness: 0.35
        });
        weldCollars.forEach(wcPos => {
          const weldGeo = new THREE.TorusGeometry(anchoM / 2 + 0.0015, 0.0035, 8, 16);
          const weldMesh = new THREE.Mesh(weldGeo, weldMat);
          weldMesh.position.copy(wcPos);
          if (Math.abs(unitDir.z) < 0.001) {
            const angle = Math.atan2(unitDir.y, unitDir.x);
            weldMesh.rotation.z = angle - Math.PI / 2;
          } else {
            const up = new THREE.Vector3(0, 0, 1);
            weldMesh.quaternion.setFromUnitVectors(up, unitDir);
          }
          modeloGroup.add(weldMesh);
        });
      }

      attachPieceData(mesh);
      modeloGroup.add(mesh);
    });

    // Renderizar accesorios
    if (mostrarHerrajes && d.accesoriosCad) {
      d.accesoriosCad.forEach((acc) => {
        const accPos = new THREE.Vector3(acc.x, acc.y, acc.z || 0);

        if (acc.tipo.includes('bisagra')) {
          const bisagraGroup = new THREE.Group();
          const barilGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.075, 12);
          const barilMesh = new THREE.Mesh(barilGeo, latonMat);
          bisagraGroup.add(barilMesh);

          const alaGeo = new THREE.BoxGeometry(0.025, 0.06, 0.004);
          const ala1 = new THREE.Mesh(alaGeo, metalMat);
          ala1.position.set(-0.015, 0, 0);
          bisagraGroup.add(ala1);

          bisagraGroup.position.copy(accPos);
          modeloGroup.add(bisagraGroup);
        } else if (acc.tipo.includes('chapa') || acc.tipo.includes('cerradura') || acc.tipo.includes('manija')) {
          const chapaGroup = new THREE.Group();
          const cajaGeo = new THREE.BoxGeometry(0.08, 0.14, 0.045);
          const cajaMesh = new THREE.Mesh(cajaGeo, metalMat);
          chapaGroup.add(cajaMesh);

          const pomoGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 12);
          const pomoMesh = new THREE.Mesh(pomoGeo, cromoMat);
          pomoMesh.rotation.x = Math.PI / 2;
          pomoMesh.position.set(0, 0.02, 0.03);
          chapaGroup.add(pomoMesh);

          chapaGroup.position.copy(accPos);
          modeloGroup.add(chapaGroup);
        } else if (acc.tipo.includes('rueda')) {
          const ruedaGroup = new THREE.Group();
          const ruedaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.025, 20);
          const ruedaMesh = new THREE.Mesh(ruedaGeo, metalMat);
          ruedaMesh.rotation.z = Math.PI / 2;
          ruedaGroup.add(ruedaMesh);

          ruedaGroup.position.copy(accPos);
          modeloGroup.add(ruedaGroup);
        } else if (acc.tipo.includes('placa_base')) {
          const placaGeo = new THREE.BoxGeometry(0.15, 0.01, 0.15);
          const placaMesh = new THREE.Mesh(placaGeo, metalMat);
          placaMesh.position.copy(accPos);
          modeloGroup.add(placaMesh);
        }
      });
    }
  }, [modoIluminacion, mostrarHerrajes]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(
      modoIluminacion === 'estudio' ? 0xf8fafc : (modoIluminacion === 'obra' ? 0xf1f5f9 : 0xffffff)
    );
    sceneRef.current = scene;

    // Cámara con proximidad ultra-cercana (0.01m)
    const camera = new THREE.PerspectiveCamera(45, Math.max(1, width) / Math.max(1, height), 0.01, 100);
    cameraRef.current = camera;
    resetCamera();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, modoIluminacion === 'estudio' ? 1.4 : 1.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffdf5, 1.2);
    mainLight.position.set(6, 10, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.9);
    fillLight.position.set(-6, 6, -5);
    scene.add(fillLight);

    // Suelo y Rejilla Métrica
    const gridHelper = new THREE.GridHelper(16, 32, 0x3b82f6, 0xcbd5e1);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Ejes de coordenadas (Rojo: X, Verde: Y, Azul: Z)
    const axesHelper = new THREE.AxesHelper(1.2);
    axesHelper.position.set(0, 0.005, 0);
    scene.add(axesHelper);

    // Construir modelo a partir de piezas CAD
    construirModelo3D(scene, design);

    // Resize Observer
    const handleResize = (w: number, h: number) => {
      if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        handleResize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Render loop
    let lastTime = performance.now();
    const animate = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (autoRotateRef.current) {
        cameraAngleThetaRef.current += delta * 0.4;
        updateCameraPos();
      }

      renderer.render(scene, camera);
    };
    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      try {
        renderer.dispose();
      } catch (_e) {
        // ignore
      }
      const domEl = renderer?.domElement;
      if (domEl && domEl.parentNode) {
        try {
          domEl.parentNode.removeChild(domEl);
        } catch (_err) {
          try {
            if (typeof domEl.remove === 'function') domEl.remove();
          } catch (_e) {
            // ignore
          }
        }
      } else if (domEl && typeof domEl.remove === 'function') {
        try {
          domEl.remove();
        } catch (_e) {
          // ignore
        }
      }
    };
  }, [design, modoIluminacion, construirModelo3D, resetCamera, updateCameraPos]);

  // Resaltado visual en tiempo real en la escena 3D de las piezas seleccionadas
  useEffect(() => {
    if (!sceneRef.current) return;
    const modeloGroup = sceneRef.current.getObjectByName('modelo_piezas');
    if (!modeloGroup) return;

    const allSelectedIds = new Set(selectedPiezaIds);
    if (selectedPiezaId) allSelectedIds.add(selectedPiezaId);

    modeloGroup.traverse(child => {
      if (child instanceof THREE.Mesh) {
        const pId = child.userData?.piezaId;
        const isSelected = !!pId && allSelectedIds.has(pId);
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive !== undefined) {
          if (isSelected) {
            mat.emissive = new THREE.Color(0x06b6d4); // Cyan brillante
            mat.emissiveIntensity = 0.85;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0.0;
          }
        }
      }
    });
  }, [selectedPiezaId, selectedPiezaIds]);

  // Manejo táctil y ratón para orbitar y selección interactiva en 3D
  const handlePointerDown = (e: React.PointerEvent) => {
    // Si se hizo clic en un botón, barra de herramientas o panel flotante, ignorar
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button, select, input, .pointer-events-auto, [role="button"]')) {
      return;
    }
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) {
      // Detección hover para cursor pointer sobre piezas interactivas en 3D
      const targetEl = e.target as HTMLElement;
      if (targetEl.closest('button, select, input, .pointer-events-auto, [role="button"]')) {
        return;
      }
      const container = mountRef.current;
      if (container && cameraRef.current && sceneRef.current) {
        const rect = container.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
        const modeloGroup = sceneRef.current.getObjectByName('modelo_piezas');
        if (modeloGroup) {
          const intersects = raycaster.intersectObjects(modeloGroup.children, true);
          if (intersects.length > 0) {
            const hit = intersects[0].object;
            const pId = hit.userData?.piezaId || hit.parent?.userData?.piezaId;
            if (pId) {
              container.style.cursor = 'pointer';
              return;
            }
          }
        }
        container.style.cursor = 'grab';
      }
      return;
    }
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    cameraAngleThetaRef.current -= deltaX * 0.008;
    cameraAnglePhiRef.current -= deltaY * 0.008;
    cameraAnglePhiRef.current = Math.max(0.08, Math.min(Math.PI - 0.05, cameraAnglePhiRef.current));
    updateCameraPos();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    const container = mountRef.current;
    if (container) {
      container.style.cursor = 'grab';
    }

    // Si se hizo clic en un botón, barra de herramientas o control de interfaz, NUNCA disparar raycaster
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest('button, select, input, .pointer-events-auto, [role="button"]')) {
      return;
    }

    // Detección de clic limpio (desplazamiento < 6 píxeles) para selección por Raycaster
    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    if (Math.hypot(dx, dy) < 6) {
      if (container && cameraRef.current && sceneRef.current) {
        const rect = container.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

        const modeloGroup = sceneRef.current.getObjectByName('modelo_piezas');
        if (modeloGroup) {
          const intersects = raycaster.intersectObjects(modeloGroup.children, true);
          if (intersects.length > 0) {
            let hit = intersects[0].object;
            let pId = hit.userData?.piezaId;
            if (!pId && hit.parent && hit.parent.userData?.piezaId) {
              pId = hit.parent.userData.piezaId;
            }
            if (pId) {
              if (e.shiftKey) {
                setSelectedPiezaIds(prev => {
                  const updated = prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId];
                  setSelectedPiezaId(updated[0] || null);
                  return updated;
                });
              } else {
                setSelectedPiezaIds([pId]);
                setSelectedPiezaId(pId);
              }
              const piece = (design.piezas || []).find(p => p.id === pId);
              if (piece) {
                setTempChosenPerfilId(piece.perfilId);
              }
              return;
            }
          }
        }
        // Clic en el vacío: deseleccionar
        setSelectedPiezaId(null);
        setSelectedPiezaIds([]);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * 0.002;
    cameraRadiusRef.current = Math.max(0.6, Math.min(25, cameraRadiusRef.current + zoomFactor));
    updateCameraPos();
  };

  const hasPiezas = (design.piezas && design.piezas.length > 0) || (design.accesoriosCad && design.accesoriosCad.length > 0);

  return (
    <div 
      className="w-full h-full relative bg-slate-50 overflow-hidden select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Contenedor Three.js */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            isDraggingRef.current = true;
            previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }}
        onTouchMove={(e) => {
          if (isDraggingRef.current && e.touches.length === 1) {
              const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
              const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;
              
              cameraAngleThetaRef.current -= deltaX * 0.01;
              cameraAnglePhiRef.current -= deltaY * 0.01;
              
              previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
              updateCameraPos();
          }
        }}
        onTouchEnd={() => {
          isDraggingRef.current = false;
        }}
        onPointerDown={(e) => {
          isDraggingRef.current = true;
          previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (isDraggingRef.current) {
            const deltaX = e.clientX - previousMousePositionRef.current.x;
            const deltaY = e.clientY - previousMousePositionRef.current.y;
            cameraAngleThetaRef.current -= deltaX * 0.01;
            cameraAnglePhiRef.current -= deltaY * 0.01;
            previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
            updateCameraPos();
          }
        }}
        onPointerUp={() => { isDraggingRef.current = false; }}
        onPointerLeave={() => { isDraggingRef.current = false; }}
      />

      {/* Badge Flotante si el modelo está vacío */}
      {!hasPiezas && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="max-w-md bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-200">
            <Compass className="w-8 h-8 text-blue-600 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Lienzo 3D Isométrico Vacío</h3>
            <p className="text-xs text-slate-600">
              Dibuja piezas en el lienzo 2D frontal para observar la extrusión volumétrica tridimensional en tiempo real.
            </p>
          </div>
        </div>
      )}

      {/* Barra Flotante Superior Unificada del Visor 3D (Sin superposiciones ni duplicados) */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 sm:top-3 left-2 sm:left-3 right-2 sm:right-auto z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200/90 max-w-[calc(100vw-16px)] overflow-x-auto touch-pan-x scrollbar-none select-none pointer-events-auto"
      >
        {/* Botón para Regresar al Lienzo 2D CAD */}
        {onVolver2D && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPiezaId(null);
              setSelectedPiezaIds([]);
              onVolver2D('frontal');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Volver al Lienzo de Dibujo 2D (Frontal)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a 2D</span>
          </button>
        )}

        {/* Indicador de Estado 3D (Badge informativo limpio, no toggle duplicado) */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shrink-0">
          <Box className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">3D Isométrico</span>
          <span className="sm:hidden">3D</span>
        </div>

        <div className="h-5 w-px bg-slate-200 shrink-0" />

        {/* Controles 3D */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              autoRotate ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Giro automático del modelo 3D"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Giro Auto</span>
            <span className="sm:hidden">Giro</span>
          </button>

          {/* Grabar video 3D (giro lento 360° y descarga) */}
          <button
            onClick={handleRecord3D}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              isRecording ? 'bg-rose-600 text-white shadow-xs animate-pulse' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title={isRecording ? 'Detener y descargar el video 3D' : 'Grabar video 3D (giro lento 360°) y descargar'}
          >
            {isRecording ? <Square className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isRecording ? 'Detener' : 'Grabar'}</span>
          </button>

          <button
            onClick={() => setModoIluminacion(m => m === 'estudio' ? 'obra' : (m === 'obra' ? 'alambrico' : 'estudio'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="Cambiar Iluminación (Estudio / Obra / Alámbrico)"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="capitalize hidden sm:inline">{modoIluminacion}</span>
          </button>

          <button
            onClick={() => setMostrarHerrajes(!mostrarHerrajes)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
              mostrarHerrajes ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="Mostrar / Ocultar Herrajes y Accesorios"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Accesorios</span>
          </button>
        </div>

        {/* Toggle Inspector CAD en 3D */}
        {onOpenInspector && (
          <>
            <div className="h-5 w-px bg-slate-200 shrink-0" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenInspector();
              }}
              title="Abrir Inspector CAD"
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 ${
                isInspectorOpen
                  ? 'bg-indigo-600 text-white shadow-indigo-200'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${isInspectorOpen ? 'text-white' : 'text-indigo-600'}`} />
              <span className="hidden sm:inline">Inspector CAD</span>
              <span className="sm:hidden">CAD</span>
            </button>
          </>
        )}
      </div>

      {/* PANEL FLOTANTE INSPECTOR 3D: SELECCIÓN Y CAMBIO DIRECTO DE PERFILES EN HERRERÍA */}
      {selectedPiezaId && (() => {
        const selectedPieza = (design.piezas || []).find(p => p.id === selectedPiezaId);
        if (!selectedPieza) return null;

        const currentPerfil = PERFILES_CATALOGO.find(p => p.id === selectedPieza.perfilId) || PERFILES_CATALOGO[0];
        const piezaLengthM = Math.hypot(
          selectedPieza.x2 - selectedPieza.x1,
          selectedPieza.y2 - selectedPieza.y1,
          (selectedPieza.z2 || 0) - (selectedPieza.z1 || 0)
        );

        const grupoName = selectedPieza.grupo || 'general';
        const matchingGrupoPiezas = (design.piezas || []).filter(p => (p.grupo || 'general') === grupoName);
        const countGrupo = matchingGrupoPiezas.length;

        const matchingMismoPerfil = (design.piezas || []).filter(p => p.perfilId === selectedPieza.perfilId);
        const countMismoPerfil = matchingMismoPerfil.length;

        const totalPiezasCount = (design.piezas || []).length;
        const multiSelectedCount = selectedPiezaIds.length;
        const isMultiSelected = multiSelectedCount > 1;

        const handleApplySingle = () => {
          if (!tempChosenPerfilId || !onUpdateDesign) return;
          const updatedPiezas = (design.piezas || []).map(p => {
            if (p.id === selectedPieza.id) {
              return { ...p, perfilId: tempChosenPerfilId };
            }
            return p;
          });
          onUpdateDesign({ ...design, piezas: updatedPiezas });
          const chosenProf = PERFILES_CATALOGO.find(p => p.id === tempChosenPerfilId);
          setFeedbackMsg(`✅ Perfil cambiado a: ${chosenProf?.nombre || tempChosenPerfilId}`);
          setTimeout(() => setFeedbackMsg(null), 3000);
        };

        const handleApplyMulti = () => {
          if (!tempChosenPerfilId || !onUpdateDesign || multiSelectedCount === 0) return;
          const setMulti = new Set(selectedPiezaIds);
          const updatedPiezas = (design.piezas || []).map(p => {
            if (setMulti.has(p.id)) {
              return { ...p, perfilId: tempChosenPerfilId };
            }
            return p;
          });
          onUpdateDesign({ ...design, piezas: updatedPiezas });
          const chosenProf = PERFILES_CATALOGO.find(p => p.id === tempChosenPerfilId);
          setFeedbackMsg(`⚡ Actualizadas ${multiSelectedCount} piezas seleccionadas a: ${chosenProf?.nombre || tempChosenPerfilId}`);
          setTimeout(() => setFeedbackMsg(null), 3500);
        };

        const handleApplyToGroup = () => {
          if (!tempChosenPerfilId || !onUpdateDesign || countGrupo === 0) return;
          const updatedPiezas = (design.piezas || []).map(p => {
            if ((p.grupo || 'general') === grupoName) {
              return { ...p, perfilId: tempChosenPerfilId };
            }
            return p;
          });
          onUpdateDesign({ ...design, piezas: updatedPiezas });
          const chosenProf = PERFILES_CATALOGO.find(p => p.id === tempChosenPerfilId);
          setFeedbackMsg(`⚡ Actualizadas ${countGrupo} piezas de '${grupoName}' a: ${chosenProf?.nombre || tempChosenPerfilId}`);
          setTimeout(() => setFeedbackMsg(null), 3500);
        };

        const handleApplyToSameProfile = () => {
          if (!tempChosenPerfilId || !onUpdateDesign || countMismoPerfil === 0) return;
          const oldId = selectedPieza.perfilId;
          const updatedPiezas = (design.piezas || []).map(p => {
            if (p.perfilId === oldId) {
              return { ...p, perfilId: tempChosenPerfilId };
            }
            return p;
          });
          onUpdateDesign({ ...design, piezas: updatedPiezas });
          const chosenProf = PERFILES_CATALOGO.find(p => p.id === tempChosenPerfilId);
          setFeedbackMsg(`⚡ Actualizadas ${countMismoPerfil} piezas idénticas a: ${chosenProf?.nombre || tempChosenPerfilId}`);
          setTimeout(() => setFeedbackMsg(null), 3500);
        };

        const handleApplyToAllDesign = () => {
          if (!tempChosenPerfilId || !onUpdateDesign || totalPiezasCount === 0) return;
          const updatedPiezas = (design.piezas || []).map(p => {
            return { ...p, perfilId: tempChosenPerfilId };
          });
          onUpdateDesign({ ...design, piezas: updatedPiezas });
          const chosenProf = PERFILES_CATALOGO.find(p => p.id === tempChosenPerfilId);
          setFeedbackMsg(`⚡ Actualizadas TODAS las ${totalPiezasCount} piezas a: ${chosenProf?.nombre || tempChosenPerfilId}`);
          setTimeout(() => setFeedbackMsg(null), 3500);
        };

        const handleToggleRotation = () => {
          if (!onUpdateDesign) return;
          const currentRot = selectedPieza.rotacionDeg || 0;
          const newRot = (currentRot + 90) % 360;
          const updatedPiezas = (design.piezas || []).map(p => {
            if (p.id === selectedPieza.id) {
              return { ...p, rotacionDeg: newRot };
            }
            return p;
          });
          onUpdateDesign({ ...design, piezas: updatedPiezas });
        };

        const categoriasHerreria = [
          { id: 'tubo_cuadrado', label: 'Tubos Cuadrados (LAC ASTM A500)' },
          { id: 'tubo_rectangular', label: 'Tubos Rectangulares' },
          { id: 'tubo_redondo', label: 'Tubos Redondos / Tubulares' },
          { id: 'angulo', label: 'Ángulos Estructurales' },
          { id: 'platina', label: 'Platinas de Acero' },
          { id: 'perfil_c', label: 'Perfiles C / Costaneras' },
          { id: 'perfil_z', label: 'Perfiles Z' }
        ];

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
                    <p className="text-[10px] text-cyan-300/80 truncate">Seleccionado directamente en el plano 3D</p>
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
                      setSelectedPiezaId(null);
                      setSelectedPiezaIds([]);
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
              <div className="overflow-y-auto flex-1 overscroll-contain pr-1 mt-1">

            {/* Datos de la Pieza */}
            <div className="py-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] font-mono font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded">
                    {selectedPieza.marca || 'PZ'}
                  </span>
                  <span className="text-xs font-bold text-white truncate">
                    {selectedPieza.nombre || 'Pieza'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md shrink-0">
                  L = {piezaLengthM.toFixed(2)} m
                </span>
              </div>

              {/* Badge de Grupo */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Grupo:</span>
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800 uppercase tracking-wide">
                  {grupoName} ({countGrupo} pzs)
                </span>
                {isMultiSelected && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                    {multiSelectedCount} seleccionadas
                  </span>
                )}
              </div>

              {/* Perfil Actual Asignado */}
              <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400">Perfil actual:</div>
                <div className="font-black text-amber-300 truncate">{currentPerfil.nombre}</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                  <span>{currentPerfil.dimensiones || `${currentPerfil.anchoMm}x${currentPerfil.altoMm}mm`}</span>
                  <span className="font-mono text-cyan-400">{currentPerfil.pesoKgPorMetro || currentPerfil.pesoKgM || 0} kg/m</span>
                </div>
              </div>

              {/* Selector de Nuevo Perfil */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-300 block">
                  Cambiar a nuevo perfil:
                </label>
                <select
                  value={tempChosenPerfilId || selectedPieza.perfilId}
                  onChange={(e) => setTempChosenPerfilId(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-slate-700 hover:border-cyan-500 focus:border-cyan-400 text-white rounded-xl p-2 text-xs font-bold outline-none cursor-pointer transition-colors"
                >
                  {categoriasHerreria.map(cat => {
                    const profsInCat = PERFILES_CATALOGO.filter(p => p.categoria === cat.id);
                    if (profsInCat.length === 0) return null;
                    return (
                      <optgroup key={cat.id} label={cat.label} className="bg-slate-900 text-slate-300 font-bold">
                        {profsInCat.map(p => (
                          <option key={p.id} value={p.id} className="bg-slate-950 text-white py-1">
                            {p.nombre} ({p.dimensiones})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              {/* Giro de Sección (Cara vs Canto) */}
              {currentPerfil.categoria !== 'tubo_redondo' && (
                <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-300 font-semibold flex items-center gap-1.5">
                    <RotateCw className="w-3 h-3 text-cyan-400" />
                    Orientación: {(selectedPieza.rotacionDeg || 0) % 180 === 90 ? 'Canto' : 'Cara frontal'}
                  </span>
                  <button
                    onClick={handleToggleRotation}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold border border-slate-700 transition-colors cursor-pointer"
                    title="Girar sección 90 grados"
                  >
                    Girar 90°
                  </button>
                </div>
              )}

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
                    disabled={!tempChosenPerfilId}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      !tempChosenPerfilId
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-98'
                    }`}
                    title={`Aplica este perfil a las ${multiSelectedCount} piezas seleccionadas con Shift+Clic`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aplicar a las {multiSelectedCount} seleccionadas</span>
                  </button>
                )}

                <button
                  onClick={handleApplySingle}
                  disabled={!tempChosenPerfilId || tempChosenPerfilId === selectedPieza.perfilId}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                    !tempChosenPerfilId || tempChosenPerfilId === selectedPieza.perfilId
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-98'
                  }`}
                  title="Cambia el perfil únicamente para esta pieza seleccionada en 3D"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aplicar a esta pieza</span>
                </button>

                {countGrupo > 1 && (
                  <button
                    onClick={handleApplyToGroup}
                    className="w-full py-1.5 px-3 rounded-xl text-[11px] font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-98 border border-purple-400/30"
                    title={`Aplica este perfil de una sola vez a todas las ${countGrupo} piezas del grupo '${grupoName}'`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-200" />
                    <span>Aplicar a todas las {countGrupo} de '{grupoName}'</span>
                  </button>
                )}

                {countMismoPerfil > 1 && countMismoPerfil !== countGrupo && (
                  <button
                    onClick={handleApplyToSameProfile}
                    className="w-full py-1.5 px-3 rounded-xl text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-98 border border-slate-600/50"
                    title={`Aplica este perfil a las ${countMismoPerfil} piezas con el mismo perfil actual`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Cambiar las {countMismoPerfil} piezas con este perfil</span>
                  </button>
                )}

                {totalPiezasCount > 1 && totalPiezasCount !== countGrupo && totalPiezasCount !== countMismoPerfil && (
                  <button
                    onClick={handleApplyToAllDesign}
                    className="w-full py-1.5 px-3 rounded-xl text-[10px] font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98 border border-slate-700"
                    title={`Aplica este perfil a todas las ${totalPiezasCount} piezas del diseño`}
                  >
                    <Box className="w-3 h-3 text-slate-400" />
                    <span>Cambiar todo el diseño ({totalPiezasCount} piezas)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
            )}
          </div>
        );
      })()}

      {/* Control Flotante de Velocidad de Giroscopio */}
      {gyroActive && (
        <div className="absolute top-16 right-3 z-20 flex items-center gap-2 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-amber-500/50 text-xs">
          <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-semibold text-[11px]">Giroscopio:</span>
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setGyroSpeedMode('muy_lento')}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                gyroSpeedMode === 'muy_lento' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Extra Lento
            </button>
            <button
              onClick={() => setGyroSpeedMode('lento')}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                gyroSpeedMode === 'lento' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lento
            </button>
            <button
              onClick={() => setGyroSpeedMode('medio')}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                gyroSpeedMode === 'medio' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Medio
            </button>
          </div>
        </div>
      )}

      {/* Pista de Selección en 3D para el Usuario */}
      {!selectedPiezaId && (
        <div className="absolute bottom-4 left-3 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 text-slate-300 border border-slate-700/60 rounded-xl text-[11px] backdrop-blur-xs shadow-md">
          <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>💡 Clic en cualquier tubo, marco o barrote en 3D para seleccionarlo y cambiar su perfil sin ir al 2D</span>
        </div>
      )}

      {/* Controles de Zoom y Centrado 3D (Ubicados en la esquina inferior derecha, nunca cortados en móvil) */}
      <div className="absolute bottom-6 right-3 sm:right-4 z-40 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-slate-200/90 pointer-events-auto select-none touch-manipulation">
        <button
          onClick={() => setGyroActive(!gyroActive)}
          className={`p-2 sm:p-1.5 rounded-xl border transition-colors flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 ${
            gyroActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
          title="Giroscopio por movimiento"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={setProximityCloseInspection}
          className="p-2 sm:p-1.5 rounded-xl bg-slate-50 text-indigo-700 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9"
          title="Inspección De Cerca"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 sm:p-1.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9"
          title="Acercar Cámara (+)"
        >
          <Plus className="w-5 h-5 font-black text-slate-900" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 sm:p-1.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9"
          title="Alejar Cámara (-)"
        >
          <Minus className="w-5 h-5 font-black text-slate-900" />
        </button>
        <button
          onClick={resetCamera}
          className="p-2 sm:p-1.5 rounded-xl bg-slate-50 text-amber-600 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9"
          title="Centrar Modelo (Restablecer)"
        >
          <Maximize2 className="w-5 h-5 text-amber-600" />
        </button>
      </div>
    </div>
  );
};
