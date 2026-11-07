import React, { useState, useRef } from 'react';
import { 
  ColumnElement, 
  BeamElement, 
  PurlinElement, 
  StructuralGeometry, 
  CoberturaOptions,
  EvacuacionOptions 
} from './structuralTypes';
import { calculateRoofGeometry, getPolygonBounds, isPointInPolygon } from './structuralGenerator';
import { ZoomIn, ZoomOut, RotateCcw, Box, Droplets, Layers } from 'lucide-react';

interface Structural3DViewProps {
  geometria: StructuralGeometry;
  columnas: ColumnElement[];
  vigas: BeamElement[];
  correas: PurlinElement[];
  cobertura?: CoberturaOptions;
  evacuacion?: EvacuacionOptions;
  selectedId?: string;
  onSelectElement?: (id: string, type: 'column' | 'beam' | 'purlin') => void;
}

export const Structural3DView: React.FC<Structural3DViewProps> = ({
  geometria,
  columnas,
  vigas,
  correas,
  cobertura,
  evacuacion,
  selectedId,
  onSelectElement
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D Orbit Angles (degrees)
  const [rotX, setRotX] = useState<number>(55); // Pitch (0 = top-down, 90 = side)
  const [rotZ, setRotZ] = useState<number>(40); // Yaw / Azimuth

  const [zoom, setZoom] = useState<number>(1.1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 30 });
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [lastMouse, setLastMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer visibility & positioning
  const [showColumns, setShowColumns] = useState<boolean>(true);
  const [showBeams, setShowBeams] = useState<boolean>(true);
  const [showPurlins, setShowPurlins] = useState<boolean>(true);
  const [showCovering, setShowCovering] = useState<boolean>(true);
  const [showWaterFlow, setShowWaterFlow] = useState<boolean>(false); // Hidden by default to avoid visual clutter
  const [showEvacuacion, setShowEvacuacion] = useState<boolean>(true);
  const [coverOpacity, setCoverOpacity] = useState<number>(0.92);
  const [coverLayerOrder, setCoverLayerOrder] = useState<'superior' | 'inferior'>('superior');

  const calc = calculateRoofGeometry(geometria);

  // Multi-sector bounding box calculation for centering
  const sectores = geometria.sectores || [];
  const vacios = geometria.vacios || [];

  const allVertices = sectores.length > 0 
    ? sectores.flatMap(s => s.vertices) 
    : [{ x: 0, y: 0 }, { x: geometria.largo, y: geometria.ancho }];
  const bounds = getPolygonBounds(allVertices);

  // 3D Projection Math
  const centerX = bounds.length > 0 ? (bounds.minX + bounds.maxX) / 2 : geometria.largo / 2;
  const centerY = bounds.width > 0 ? (bounds.minY + bounds.maxY) / 2 : geometria.ancho / 2;
  const centerZ = (calc.alturaLadoAlto + 1) / 2;
  const SCALE_3D = 32; // pixels per meter in 3D

  const projectPoint = (x: number, y: number, z: number) => {
    // 1. Shift to center
    const dx = (x - centerX) * SCALE_3D;
    const dy = (y - centerY) * SCALE_3D;
    const dz = (z - centerZ) * SCALE_3D;

    // 2. Rotate around Z (Yaw)
    const radZ = (rotZ * Math.PI) / 180;
    const x1 = dx * Math.cos(radZ) - dy * Math.sin(radZ);
    const y1 = dx * Math.sin(radZ) + dy * Math.cos(radZ);

    // 3. Rotate around X (Pitch)
    const radX = (rotX * Math.PI) / 180;
    const y2 = y1 * Math.cos(radX) - dz * Math.sin(radX);
    const z2 = y1 * Math.sin(radX) + dz * Math.cos(radX);

    return {
      sx: x1 + 380 + pan.x,
      sy: y2 + 260 + pan.y,
      depth: z2
    };
  };

  // Helper to get sector elevation at (x, y)
  const getSectorZ = (sec: any, x: number, y: number): number => {
    if (geometria.tipoTecho === 'parabolico' || geometria.tipoTecho === 'arco' || sec.tipoTecho === 'parabolico' || sec.tipoTecho === 'arco') {
      const normY = (geometria.ancho || 1) > 0 ? Math.max(0, Math.min(1, y / (geometria.ancho || 1))) : 0;
      const flecha = geometria.flechaArco || 1.20;
      return sec.alturaLadoBajo + 4 * flecha * normY * (1 - normY);
    }

    // If sector is docked (coplanar) with the primary roof plane:
    const primarySec = (sectores.length > 0) ? (sectores.find(s => s.id !== sec.id && !s.esTranslucido) || sectores[0]) : null;
    const isDocked = sec.acopladoAlTecho !== false;

    if (isDocked && primarySec && sec.id !== primarySec.id) {
      const pBounds = getPolygonBounds(primarySec.vertices);
      const deltaZ = Math.max(0.05, primarySec.alturaLadoAlto - primarySec.alturaLadoBajo);
      const pDir = primarySec.direccionCaida || 'calle';
      let t = 0;
      if (pDir === 'calle') {
        const span = pBounds.length || 1;
        t = (x - pBounds.minX) / span;
      } else if (pDir === 'interior' || pDir === 'fondo') {
        const span = pBounds.length || 1;
        t = 1 - (x - pBounds.minX) / span;
      } else if (pDir === 'izquierda') {
        const span = pBounds.width || 1;
        t = (y - pBounds.minY) / span;
      } else if (pDir === 'derecha') {
        const span = pBounds.width || 1;
        t = 1 - (y - pBounds.minY) / span;
      } else {
        const span = Math.hypot(pBounds.length, pBounds.width) || 1;
        t = ((x - pBounds.minX) + (y - pBounds.minY)) / (2 * span);
      }
      return primarySec.alturaLadoBajo + t * deltaZ;
    }

    const secBounds = getPolygonBounds(sec.vertices);
    const deltaZ = Math.max(0.05, sec.alturaLadoAlto - sec.alturaLadoBajo);
    let t = 0;
    if (sec.direccionCaida === 'calle') {
      const span = secBounds.length || 1;
      t = (x - secBounds.minX) / span;
    } else if (sec.direccionCaida === 'interior' || sec.direccionCaida === 'fondo') {
      const span = secBounds.length || 1;
      t = 1 - (x - secBounds.minX) / span;
    } else if (sec.direccionCaida === 'izquierda') {
      const span = secBounds.width || 1;
      t = (y - secBounds.minY) / span;
    } else if (sec.direccionCaida === 'derecha') {
      const span = secBounds.width || 1;
      t = 1 - (y - secBounds.minY) / span;
    } else {
      const span = Math.hypot(secBounds.length, secBounds.width) || 1;
      t = ((x - secBounds.minX) + (y - secBounds.minY)) / (2 * span);
    }
    t = Math.max(0, Math.min(1, t));
    return sec.alturaLadoBajo + t * deltaZ;
  };

  // Helper to get roof height at (x, y)
  const getRoofZ = (x: number, y: number): number => {
    if (sectores.length > 0) {
      const matchingSector = sectores.find(s => isPointInPolygon({ x, y }, s.vertices));
      if (matchingSector) {
        return getSectorZ(matchingSector, x, y);
      }
      return getSectorZ(sectores[0], x, y);
    }

    const { tipoTecho, direccionCaida = 'calle', flechaArco = 1.20, largo, ancho } = geometria;

    if (tipoTecho === 'parabolico' || tipoTecho === 'arco') {
      const normY = ancho > 0 ? y / ancho : 0;
      return calc.alturaLadoBajo + 4 * flechaArco * normY * (1 - normY);
    }

    if (tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera') {
      const halfW = ancho / 2;
      const distFromApex = Math.abs(y - halfW);
      return calc.alturaLadoAlto - (distFromApex / (halfW || 1)) * calc.deltaZ;
    }

    // Una caída / Casi plano:
    if (direccionCaida === 'calle') {
      const frac = x / (largo || 1);
      return calc.alturaLadoBajo + frac * calc.deltaZ;
    }
    if (direccionCaida === 'interior') {
      const frac = x / (largo || 1);
      return calc.alturaLadoAlto - frac * calc.deltaZ;
    }
    if (direccionCaida === 'izquierda') {
      const frac = y / (ancho || 1);
      return calc.alturaLadoBajo + frac * calc.deltaZ;
    }
    if (direccionCaida === 'derecha') {
      const frac = y / (ancho || 1);
      return calc.alturaLadoAlto - frac * calc.deltaZ;
    }

    const frac = y / (ancho || 1);
    return calc.alturaLadoBajo + frac * calc.deltaZ;
  };

  // Mouse event handlers for 3D Orbit & Pan
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      setIsPanning(true);
    } else {
      setIsRotating(true);
    }
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isRotating && !isPanning) return;

    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;

    if (isRotating) {
      setRotZ(prev => (prev + dx * 0.6) % 360);
      setRotX(prev => Math.max(10, Math.min(85, prev - dy * 0.4)));
    } else if (isPanning) {
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }

    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsRotating(false);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom(z => Math.max(0.4, Math.min(3.5, z * factor)));
  };

  const setPresetView = (view: 'iso' | 'top' | 'front' | 'side') => {
    if (view === 'iso') {
      setRotX(55);
      setRotZ(40);
    } else if (view === 'top') {
      setRotX(15);
      setRotZ(0);
    } else if (view === 'front') {
      setRotX(80);
      setRotZ(0);
    } else if (view === 'side') {
      setRotX(80);
      setRotZ(90);
    }
    setPan({ x: 0, y: 30 });
    setZoom(1.1);
  };

  // Render ground platform grid
  const renderGroundGrid = () => {
    const lines = [];
    const step = 2;
    const maxL = Math.ceil(geometria.largo + 2);
    const maxW = Math.ceil(geometria.ancho + 2);

    for (let x = -2; x <= maxL; x += step) {
      const p1 = projectPoint(x, -2, 0);
      const p2 = projectPoint(x, maxW, 0);
      lines.push(
        <line key={`g3d-x-${x}`} x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#334155" strokeWidth="0.8" />
      );
    }
    for (let y = -2; y <= maxW; y += step) {
      const p1 = projectPoint(-2, y, 0);
      const p2 = projectPoint(maxL, y, 0);
      lines.push(
        <line key={`g3d-y-${y}`} x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#334155" strokeWidth="0.8" />
      );
    }

    // Concrete slab boundary
    const c0 = projectPoint(0, 0, 0);
    const c1 = projectPoint(geometria.largo, 0, 0);
    const c2 = projectPoint(geometria.largo, geometria.ancho, 0);
    const c3 = projectPoint(0, geometria.ancho, 0);

    return (
      <g id="ground-grid">
        <polygon 
          points={`${c0.sx},${c0.sy} ${c1.sx},${c1.sy} ${c2.sx},${c2.sy} ${c3.sx},${c3.sy}`} 
          fill="#1e293b" 
          stroke="#475569" 
          strokeWidth="1.5" 
        />
        {lines}
      </g>
    );
  };

  // Render Roof Cladding (Cobertura) according to real slope
  const renderRoofCovering = () => {
    if (!showCovering) return null;

    const isGlobalTranslucent = geometria.esTranslucido || geometria.aluzinc?.perfil === 'TR4 Translúcido' || geometria.sistemaCobertura === 'policarbonato';
    
    const roofColor = isGlobalTranslucent ? '#cffafe' : 
                      (cobertura?.color === 'Rojo Teja' ? '#dc2626' :
                      cobertura?.color === 'Azul' ? '#2563eb' :
                      cobertura?.color === 'Verde' ? '#16a34a' :
                      cobertura?.color === 'Blanco' ? '#f8fafc' : '#0284c7');

    const strokeColor = isGlobalTranslucent ? '#38bdf8' :
                        (cobertura?.color === 'Rojo Teja' ? '#991b1b' :
                        cobertura?.color === 'Azul' ? '#1d4ed8' :
                        cobertura?.color === 'Verde' ? '#15803d' : '#0369a1');

    const baseZ = coverLayerOrder === 'superior' ? 0.22 : -0.15;
    const globalOpacity = isGlobalTranslucent ? 0.45 : coverOpacity;

    // MULTI-SECTOR & VOIDS 3D RENDERING
    if (sectores.length > 0) {
      return (
        <g id="roof-covering-multisector" opacity={globalOpacity}>
          {sectores.map((sec, sIdx) => {
            const isTranslucent = sec.esTranslucido || 
              sec.sistemaCobertura === 'policarbonato' || 
              sec.materialCobertura?.toLowerCase().includes('policarbonato') || 
              sec.materialCobertura?.toLowerCase().includes('translucid');

            const zOffset = isTranslucent ? (baseZ + 0.005) : baseZ;
            const secBounds = getPolygonBounds(sec.vertices);
            
            // Translucent colors & opacity
            const translucentFill = sec.colorTranslucido === 'Azul' ? '#38bdf8' :
                                    sec.colorTranslucido === 'Blanco' || sec.colorTranslucido === 'Opalino' ? '#f1f5f9' :
                                    sec.colorTranslucido === 'Cristal' ? '#cffafe' :
                                    '#10b981'; // Verde Esmeralda

            const secFill = isTranslucent ? translucentFill : (sec.color || roofColor);
            const secFillOpacity = isTranslucent ? (sec.opacidadTranslucido || 0.42) : 1.0;
            const secStroke = isTranslucent ? '#34d399' : '#ffffff';

            const isParaSec = sec.tipoTecho === 'parabolico' || sec.tipoTecho === 'arco' || geometria.tipoTecho === 'parabolico' || geometria.tipoTecho === 'arco';

            if (isParaSec) {
              const numStrips = 20;
              const secStrips = [];
              const width = secBounds.width || geometria.ancho || 1;
              for (let i = 0; i < numStrips; i++) {
                const y1 = secBounds.minY + (i / numStrips) * width;
                const y2 = secBounds.minY + ((i + 1) / numStrips) * width;

                const p1 = projectPoint(secBounds.minX, y1, getSectorZ(sec, secBounds.minX, y1) + zOffset);
                const p2 = projectPoint(secBounds.maxX, y1, getSectorZ(sec, secBounds.maxX, y1) + zOffset);
                const p3 = projectPoint(secBounds.maxX, y2, getSectorZ(sec, secBounds.maxX, y2) + zOffset);
                const p4 = projectPoint(secBounds.minX, y2, getSectorZ(sec, secBounds.minX, y2) + zOffset);

                secStrips.push(
                  <polygon
                    key={`sec-para-strip-${sIdx}-${i}`}
                    points={`${p1.sx},${p1.sy} ${p2.sx},${p2.sy} ${p3.sx},${p3.sy} ${p4.sx},${p4.sy}`}
                    fill={secFill}
                    fillOpacity={secFillOpacity}
                    stroke={secStroke}
                    strokeWidth="0.8"
                  />
                );
              }
              return (
                <g key={`sec-3d-${sec.id}`}>
                  {secStrips}
                </g>
              );
            }

            const screenPoints = sec.vertices.map(v => {
              const p = projectPoint(v.x, v.y, getSectorZ(sec, v.x, v.y) + zOffset);
              return `${p.sx},${p.sy}`;
            }).join(' ');

            // Texture ribs / alveolar flutes across sector
            const secRibs = [];
            const numRibs = isTranslucent ? 14 : 8;
            for (let i = 1; i < numRibs; i++) {
              const rx = secBounds.minX + (i / numRibs) * secBounds.length;
              const p1 = projectPoint(rx, secBounds.minY, getSectorZ(sec, rx, secBounds.minY) + zOffset + 0.01);
              const p2 = projectPoint(rx, secBounds.maxY, getSectorZ(sec, rx, secBounds.maxY) + zOffset + 0.01);
              secRibs.push(
                <line 
                  key={`sec-rib-${sIdx}-${i}`} 
                  x1={p1.sx} 
                  y1={p1.sy} 
                  x2={p2.sx} 
                  y2={p2.sy} 
                  stroke={isTranslucent ? '#ecfdf5' : '#ffffff'} 
                  strokeWidth={isTranslucent ? '1.2' : '0.8'} 
                  strokeOpacity={isTranslucent ? 0.65 : 0.4} 
                />
              );
            }

            return (
              <g key={`sec-3d-${sec.id}`}>
                <polygon 
                  points={screenPoints} 
                  fill={secFill} 
                  fillOpacity={secFillOpacity}
                  stroke={secStroke} 
                  strokeWidth={isTranslucent ? '2.5' : '2'} 
                  strokeDasharray={isTranslucent ? '6 2' : 'none'}
                />
                {secRibs}
              </g>
            );
          })}

          {/* Voids rendering in 3D */}
          {vacios.map(v => {
            const vPoints = v.vertices.map(pt => {
              const p = projectPoint(pt.x, pt.y, getRoofZ(pt.x, pt.y) + 0.1);
              return `${p.sx},${p.sy}`;
            }).join(' ');
            return (
              <g key={`void-3d-${v.id}`}>
                <polygon points={vPoints} fill="#0f172a" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
              </g>
            );
          })}
        </g>
      );
    }

    const { largo, ancho, tipoTecho } = geometria;
    const isDosAguas = tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera';
    const isParabolico = tipoTecho === 'parabolico' || tipoTecho === 'arco';

    if (isParabolico) {
      const numStrips = 24;
      const effectiveZ = baseZ + 0.10; // Extra lift for parabolic to avoid rib clipping
      const strips = [];

      for (let i = 0; i < numStrips; i++) {
        const y1 = (i / numStrips) * ancho;
        const y2 = ((i + 1) / numStrips) * ancho;

        const p1 = projectPoint(0, y1, getRoofZ(0, y1) + effectiveZ);
        const p2 = projectPoint(largo, y1, getRoofZ(largo, y1) + effectiveZ);
        const p3 = projectPoint(largo, y2, getRoofZ(largo, y2) + effectiveZ);
        const p4 = projectPoint(0, y2, getRoofZ(0, y2) + effectiveZ);

        strips.push(
          <polygon
            key={`para-strip-${i}`}
            points={`${p1.sx},${p1.sy} ${p2.sx},${p2.sy} ${p3.sx},${p3.sy} ${p4.sx},${p4.sy}`}
            fill={roofColor}
            stroke={strokeColor}
            strokeWidth="0.8"
            fillOpacity="0.95"
          />
        );
      }

      const ribs = [];
      const numRibs = 12;
      for (let i = 1; i < numRibs; i++) {
        const x = (i / numRibs) * largo;
        const archPolyPoints = [];
        for (let j = 0; j <= numStrips; j++) {
          const y = (j / numStrips) * ancho;
          const pt = projectPoint(x, y, getRoofZ(x, y) + effectiveZ + 0.01);
          archPolyPoints.push(`${pt.sx},${pt.sy}`);
        }
        ribs.push(
          <polyline
            key={`para-rib-${i}`}
            points={archPolyPoints.join(' ')}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1"
            strokeOpacity="0.7"
          />
        );
      }

      return (
        <g id="roof-covering-parabolico" opacity={globalOpacity}>
          {strips}
          {ribs}
        </g>
      );
    }

    if (isDosAguas) {
      const halfW = ancho / 2;
      // Ridge nodes
      const r0 = projectPoint(0, halfW, getRoofZ(0, halfW) + baseZ);
      const rL = projectPoint(largo, halfW, getRoofZ(largo, halfW) + baseZ);

      // Left Eave
      const e0L = projectPoint(0, 0, getRoofZ(0, 0) + baseZ);
      const eLL = projectPoint(largo, 0, getRoofZ(largo, 0) + baseZ);

      // Right Eave
      const e0R = projectPoint(0, ancho, getRoofZ(0, ancho) + baseZ);
      const eLR = projectPoint(largo, ancho, getRoofZ(largo, ancho) + baseZ);

      return (
        <g id="roof-covering" opacity={globalOpacity}>
          {/* Left Slope Sheet */}
          <polygon 
            points={`${e0L.sx},${e0L.sy} ${eLL.sx},${eLL.sy} ${rL.sx},${rL.sy} ${r0.sx},${r0.sy}`}
            fill={roofColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Right Slope Sheet */}
          <polygon 
            points={`${r0.sx},${r0.sy} ${rL.sx},${rL.sy} ${eLR.sx},${eLR.sy} ${e0R.sx},${e0R.sy}`}
            fill={roofColor}
            stroke={strokeColor}
            strokeWidth="1.5"
            fillOpacity="0.9"
          />
          {/* Ridge cap line */}
          <line x1={r0.sx} y1={r0.sy} x2={rL.sx} y2={rL.sy} stroke="#f8fafc" strokeWidth="2.5" />
        </g>
      );
    }

    // Single Slope / Casi plano / Parabólico
    const c00 = projectPoint(0, 0, getRoofZ(0, 0) + baseZ);
    const cL0 = projectPoint(largo, 0, getRoofZ(largo, 0) + baseZ);
    const cLW = projectPoint(largo, ancho, getRoofZ(largo, ancho) + baseZ);
    const c0W = projectPoint(0, ancho, getRoofZ(0, ancho) + baseZ);

    // Rib lines to show corrugated sheet texture
    const ribs = [];
    const numRibs = 12;
    for (let i = 1; i < numRibs; i++) {
      const frac = i / numRibs;
      const x = frac * largo;
      const pStart = projectPoint(x, 0, getRoofZ(x, 0) + baseZ + 0.01);
      const pEnd = projectPoint(x, ancho, getRoofZ(x, ancho) + baseZ + 0.01);
      ribs.push(
        <line 
          key={`rib-${i}`} 
          x1={pStart.sx} 
          y1={pStart.sy} 
          x2={pEnd.sx} 
          y2={pEnd.sy} 
          stroke={strokeColor} 
          strokeWidth="1" 
          strokeOpacity="0.7"
        />
      );
    }

    return (
      <g id="roof-covering" opacity={globalOpacity}>
        <polygon 
          points={`${c00.sx},${c00.sy} ${cL0.sx},${cL0.sy} ${cLW.sx},${cLW.sy} ${c0W.sx},${c0W.sy}`}
          fill={roofColor}
          stroke={strokeColor}
          strokeWidth="1.8"
        />
        {ribs}
      </g>
    );
  };

  // Render 3D Water Evacuation Arrow
  const renderWaterEvacuationArrow = () => {
    if (!showWaterFlow) return null;

    if (sectores.length > 0) {
      return (
        <g id="water-flow-arrows-multisector" className="select-none pointer-events-none">
          {sectores.map((sec) => {
            const secBounds = getPolygonBounds(sec.vertices);
            const midX = (secBounds.minX + secBounds.maxX) / 2;
            const midY = (secBounds.minY + secBounds.maxY) / 2;

            let xH = midX, yH = midY, xL = midX, yL = midY;
            if (sec.direccionCaida === 'calle') {
              xH = midX + secBounds.length * 0.25;
              xL = midX - secBounds.length * 0.25;
            } else if (sec.direccionCaida === 'interior' || sec.direccionCaida === 'fondo') {
              xH = midX - secBounds.length * 0.25;
              xL = midX + secBounds.length * 0.25;
            } else if (sec.direccionCaida === 'izquierda') {
              yH = midY + secBounds.width * 0.25;
              yL = midY - secBounds.width * 0.25;
            } else {
              yH = midY - secBounds.width * 0.25;
              yL = midY + secBounds.width * 0.25;
            }

            const pStart = projectPoint(xH, yH, getSectorZ(sec, xH, yH) + 0.55);
            const pEnd = projectPoint(xL, yL, getSectorZ(sec, xL, yL) + 0.55);

            const isTranslucent = sec.esTranslucido || 
              sec.sistemaCobertura === 'policarbonato' || 
              sec.materialCobertura?.toLowerCase().includes('policarbonato') || 
              sec.materialCobertura?.toLowerCase().includes('translucid');

            const badgeText = isTranslucent 
              ? `↓ ${sec.nombre} (${sec.pendientePct}%) ✨ Translúcido`
              : `↓ ${sec.nombre} (${sec.pendientePct}%)`;
            const badgeWidth = isTranslucent ? 140 : 104;
            const badgeColor = isTranslucent ? "#34d399" : "#38bdf8";

            return (
              <g key={`flow-sec-${sec.id}`}>
                <line x1={pStart.sx} y1={pStart.sy} x2={pEnd.sx} y2={pEnd.sy} stroke={badgeColor} strokeWidth="3" markerEnd="url(#water-arrow)" />
                <rect 
                  x={(pStart.sx + pEnd.sx) / 2 - badgeWidth / 2} 
                  y={(pStart.sy + pEnd.sy) / 2 - 12} 
                  width={badgeWidth} 
                  height="20" 
                  rx="6" 
                  fill="#0f172a" 
                  stroke={badgeColor} 
                  strokeWidth="1" 
                />
                <text 
                  x={(pStart.sx + pEnd.sx) / 2} 
                  y={(pStart.sy + pEnd.sy) / 2 + 2} 
                  fill={badgeColor} 
                  fontSize="9" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  {badgeText}
                </text>
              </g>
            );
          })}
        </g>
      );
    }

    const { largo, ancho, direccionCaida = 'calle', tipoTecho } = geometria;
    const isDosAguas = tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera';

    if (isDosAguas) {
      const halfW = ancho / 2;
      const midX = largo / 2;

      // Arrow left slope
      const pHighL = projectPoint(midX, halfW * 0.7, getRoofZ(midX, halfW * 0.7) + 0.45);
      const pLowL = projectPoint(midX, halfW * 0.2, getRoofZ(midX, halfW * 0.2) + 0.45);

      // Arrow right slope
      const pHighR = projectPoint(midX, halfW + halfW * 0.3, getRoofZ(midX, halfW + halfW * 0.3) + 0.45);
      const pLowR = projectPoint(midX, halfW + halfW * 0.8, getRoofZ(midX, halfW + halfW * 0.8) + 0.45);

      return (
        <g id="water-flow-arrows" className="select-none pointer-events-none">
          <line x1={pHighL.sx} y1={pHighL.sy} x2={pLowL.sx} y2={pLowL.sy} stroke="#38bdf8" strokeWidth="3" markerEnd="url(#water-arrow)" />
          <line x1={pHighR.sx} y1={pHighR.sy} x2={pLowR.sx} y2={pLowR.sy} stroke="#38bdf8" strokeWidth="3" markerEnd="url(#water-arrow)" />
        </g>
      );
    }

    // Single slope arrow pointing from high side towards low side
    let xHigh = largo * 0.75, yHigh = ancho / 2;
    let xLow = largo * 0.25, yLow = ancho / 2;

    if (direccionCaida === 'calle') {
      // Calle is low (x = 0), interior is high (x = largo)
      xHigh = largo * 0.75;
      xLow = largo * 0.20;
      yHigh = ancho / 2;
      yLow = ancho / 2;
    } else if (direccionCaida === 'interior') {
      xHigh = largo * 0.25;
      xLow = largo * 0.80;
      yHigh = ancho / 2;
      yLow = ancho / 2;
    } else if (direccionCaida === 'izquierda') {
      xHigh = largo / 2;
      xLow = largo / 2;
      yHigh = ancho * 0.80;
      yLow = ancho * 0.20;
    } else if (direccionCaida === 'derecha') {
      xHigh = largo / 2;
      xLow = largo / 2;
      yHigh = ancho * 0.20;
      yLow = ancho * 0.80;
    }

    const pStart = projectPoint(xHigh, yHigh, getRoofZ(xHigh, yHigh) + 0.55);
    const pEnd = projectPoint(xLow, yLow, getRoofZ(xLow, yLow) + 0.55);

    return (
      <g id="water-flow-arrow" className="select-none pointer-events-none">
        {/* Glow behind arrow */}
        <line x1={pStart.sx} y1={pStart.sy} x2={pEnd.sx} y2={pEnd.sy} stroke="#0284c7" strokeWidth="6" strokeOpacity="0.4" />
        <line x1={pStart.sx} y1={pStart.sy} x2={pEnd.sx} y2={pEnd.sy} stroke="#38bdf8" strokeWidth="3.5" markerEnd="url(#water-arrow)" />
        {/* Floating Text Pill */}
        <rect 
          x={(pStart.sx + pEnd.sx) / 2 - 80} 
          y={(pStart.sy + pEnd.sy) / 2 - 24} 
          width="160" 
          height="20" 
          rx="10" 
          fill="#0f172a" 
          fillOpacity="0.9" 
          stroke="#0284c7" 
          strokeWidth="1"
        />
        <text 
          x={(pStart.sx + pEnd.sx) / 2} 
          y={(pStart.sy + pEnd.sy) / 2 - 10} 
          fill="#38bdf8" 
          fontSize="9.5" 
          fontWeight="bold" 
          textAnchor="middle"
        >
          ↓ EVACUACIÓN ({calc.pendientePct}% Pend.)
        </text>
      </g>
    );
  };

  // Render Gutter (Canaleta) and Downspouts (Bajantes)
  const renderEvacuacionAgua = () => {
    if (!showEvacuacion) return null;
    const hasCanaleta = evacuacion?.tieneCanaleta ?? true;
    if (!hasCanaleta) return null;

    const { largo, ancho, direccionCaida = 'calle', tipoTecho } = geometria;
    const isDosAguas = tipoTecho === 'dos_aguas' || tipoTecho === 'dos_aguas_cumbrera';

    // Locate gutter line based on direction
    const gutters: { x1: number; y1: number; z1: number; x2: number; y2: number; z2: number; downspoutNodes: { x: number; y: number }[] }[] = [];

    if (isDosAguas) {
      // Both lateral eaves have gutters
      gutters.push({
        x1: 0, y1: 0, z1: getRoofZ(0, 0),
        x2: largo, y2: 0, z2: getRoofZ(largo, 0),
        downspoutNodes: [{ x: 0, y: 0 }, { x: largo, y: 0 }]
      });
      gutters.push({
        x1: 0, y1: ancho, z1: getRoofZ(0, ancho),
        x2: largo, y2: ancho, z2: getRoofZ(largo, ancho),
        downspoutNodes: [{ x: 0, y: ancho }, { x: largo, y: ancho }]
      });
    } else {
      // Single slope: placed along low eave
      if (direccionCaida === 'calle') {
        // Low at x = 0 across width (y: 0 to ancho)
        gutters.push({
          x1: 0, y1: 0, z1: getRoofZ(0, 0),
          x2: 0, y2: ancho, z2: getRoofZ(0, ancho),
          downspoutNodes: [{ x: 0, y: 0 }, { x: 0, y: ancho }]
        });
      } else if (direccionCaida === 'interior') {
        gutters.push({
          x1: largo, y1: 0, z1: getRoofZ(largo, 0),
          x2: largo, y2: ancho, z2: getRoofZ(largo, ancho),
          downspoutNodes: [{ x: largo, y: 0 }, { x: largo, y: ancho }]
        });
      } else if (direccionCaida === 'izquierda') {
        gutters.push({
          x1: 0, y1: 0, z1: getRoofZ(0, 0),
          x2: largo, y2: 0, z2: getRoofZ(largo, 0),
          downspoutNodes: [{ x: 0, y: 0 }, { x: largo, y: 0 }]
        });
      } else {
        // derecha
        gutters.push({
          x1: 0, y1: ancho, z1: getRoofZ(0, ancho),
          x2: largo, y2: ancho, z2: getRoofZ(largo, ancho),
          downspoutNodes: [{ x: 0, y: ancho }, { x: largo, y: ancho }]
        });
      }
    }

    return (
      <g id="evacuacion-3d">
        {gutters.map((g, idx) => {
          const p1 = projectPoint(g.x1, g.y1, g.z1);
          const p2 = projectPoint(g.x2, g.y2, g.z2);

          return (
            <g key={`gutter-${idx}`}>
              {/* Canaleta Channel Bar */}
              <line 
                x1={p1.sx} 
                y1={p1.sy} 
                x2={p2.sx} 
                y2={p2.sy} 
                stroke="#0284c7" 
                strokeWidth="8" 
                strokeLinecap="square"
              />
              <line 
                x1={p1.sx} 
                y1={p1.sy - 2} 
                x2={p2.sx} 
                y2={p2.sy - 2} 
                stroke="#e0f2fe" 
                strokeWidth="3" 
                strokeLinecap="square"
              />

              {/* Bajantes (Downspouts to ground z = 0) */}
              {g.downspoutNodes.map((dp, dIdx) => {
                const zTop = getRoofZ(dp.x, dp.y);
                const pTop = projectPoint(dp.x, dp.y, zTop);
                const pBase = projectPoint(dp.x, dp.y, 0);

                return (
                  <g key={`bajante-${idx}-${dIdx}`}>
                    {/* Vertical pipe */}
                    <line 
                      x1={pTop.sx + 4} 
                      y1={pTop.sy} 
                      x2={pBase.sx + 4} 
                      y2={pBase.sy} 
                      stroke="#94a3b8" 
                      strokeWidth="5" 
                      strokeLinecap="round"
                    />
                    <line 
                      x1={pTop.sx + 4} 
                      y1={pTop.sy} 
                      x2={pBase.sx + 4} 
                      y2={pBase.sy} 
                      stroke="#f1f5f9" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                    {/* Discharge elbow at bottom */}
                    <circle cx={pBase.sx + 4} cy={pBase.sy} r="4" fill="#64748b" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden select-none"
    >
      {/* 3D Viewport Controls (Floating Top Left on desktop, Top-12 on mobile) */}
      <div className="absolute top-12 left-2 md:top-3 md:left-3 z-20 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 text-xs font-semibold text-white shadow-xl max-w-[calc(100vw-1rem)] overflow-x-auto no-scrollbar">
        <span className="text-slate-400 px-1.5 flex items-center text-[11px] shrink-0">
          <Box className="w-3.5 h-3.5 mr-1 text-blue-400" />
          Vistas:
        </span>
        <button 
          onClick={() => setPresetView('iso')} 
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-[11px] shrink-0 transition-colors cursor-pointer"
        >
          Isométrica
        </button>
        <button 
          onClick={() => setPresetView('top')} 
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] shrink-0 transition-colors cursor-pointer"
        >
          Planta 3D
        </button>
        <button 
          onClick={() => setPresetView('front')} 
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] shrink-0 transition-colors cursor-pointer"
        >
          Frontal (Calle)
        </button>
        <button 
          onClick={() => setPresetView('side')} 
          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] shrink-0 transition-colors cursor-pointer"
        >
          Lateral
        </button>
      </div>

      {/* Layer Visibility Toggles & Order Control (Floating Top Right on desktop, Top-2 on mobile) */}
      <div className="absolute top-2 left-2 right-2 md:top-3 md:right-3 md:left-auto z-20 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 md:p-2 rounded-xl border border-slate-700/80 text-xs text-slate-300 shadow-xl max-w-[calc(100vw-1rem)] overflow-x-auto no-scrollbar">
        {/* Layer Order Switcher (Arriba vs Abajo de correas) */}
        <button
          type="button"
          onClick={() => setCoverLayerOrder(prev => prev === 'superior' ? 'inferior' : 'superior')}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-xs ${
            coverLayerOrder === 'superior' 
              ? 'bg-blue-600 text-white' 
              : 'bg-amber-600 text-white'
          }`}
          title="Alternar si la cobertura de aluzinc va encima de las correas o por debajo"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{coverLayerOrder === 'superior' ? '▲ Cobertura Arriba' : '▼ Cobertura Abajo'}</span>
        </button>

        <div className="h-4 w-px bg-slate-700 mx-0.5 shrink-0" />

        <label className="flex items-center space-x-1 cursor-pointer hover:text-white shrink-0">
          <input 
            type="checkbox" 
            checked={showColumns} 
            onChange={e => setShowColumns(e.target.checked)}
            className="rounded text-blue-500 bg-slate-700 border-slate-600"
          />
          <span className="text-[11px]">Columnas</span>
        </label>
        <label className="flex items-center space-x-1 cursor-pointer hover:text-white shrink-0">
          <input 
            type="checkbox" 
            checked={showBeams} 
            onChange={e => setShowBeams(e.target.checked)}
            className="rounded text-blue-500 bg-slate-700 border-slate-600"
          />
          <span className="text-[11px]">Vigas</span>
        </label>
        <label className="flex items-center space-x-1 cursor-pointer hover:text-white shrink-0">
          <input 
            type="checkbox" 
            checked={showPurlins} 
            onChange={e => setShowPurlins(e.target.checked)}
            className="rounded text-blue-500 bg-slate-700 border-slate-600"
          />
          <span className="text-[11px]">Correas</span>
        </label>
        <label className="flex items-center space-x-1 cursor-pointer hover:text-white shrink-0">
          <input 
            type="checkbox" 
            checked={showCovering} 
            onChange={e => setShowCovering(e.target.checked)}
            className="rounded text-blue-500 bg-slate-700 border-slate-600"
          />
          <span className="text-[11px]">Cobertura</span>
        </label>

        {showCovering && (
          <div className="flex items-center space-x-1 pl-1 shrink-0">
            <button
              type="button"
              onClick={() => setCoverOpacity(1.0)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                coverOpacity >= 0.9 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Cobertura sólida 100% (cubre correas)"
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => setCoverOpacity(0.55)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                coverOpacity > 0.3 && coverOpacity < 0.9 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Semirreflectante / Rayos X"
            >
              55%
            </button>
          </div>
        )}

        <div className="h-4 w-px bg-slate-700 mx-0.5 shrink-0" />

        <label className="flex items-center space-x-1 cursor-pointer hover:text-white shrink-0">
          <input 
            type="checkbox" 
            checked={showWaterFlow} 
            onChange={e => setShowWaterFlow(e.target.checked)}
            className="rounded text-sky-500 bg-slate-700 border-slate-600"
          />
          <span className="text-[11px] text-sky-400">💧 Caída</span>
        </label>
        <label className="flex items-center space-x-1 cursor-pointer hover:text-white shrink-0">
          <input 
            type="checkbox" 
            checked={showEvacuacion} 
            onChange={e => setShowEvacuacion(e.target.checked)}
            className="rounded text-blue-500 bg-slate-700 border-slate-600"
          />
          <span className="text-[11px]">Canaletas</span>
        </label>
      </div>

      {/* Orbit Helper Tip */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
        <Droplets className="w-4 h-4 text-sky-400" />
        <span>
          Caída: <strong>{calc.direccionTexto}</strong> | Pendiente: <strong>{calc.pendientePct}% ({calc.pendienteGrados}°)</strong> | Lado Alto: <strong>{calc.alturaLadoAlto}m</strong> | Lado Bajo: <strong>{calc.alturaLadoBajo}m</strong>
        </span>
      </div>

      {/* Zoom controls bottom right */}
      <div className="absolute bottom-6 right-3 sm:right-4 z-40 flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl overflow-hidden shadow-2xl pointer-events-auto select-none touch-manipulation">
        <button 
          onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} 
          className="p-2.5 sm:p-2 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
          title="Alejar (-)"
        >
          <ZoomOut className="w-4 h-4 font-bold" />
        </button>
        <span className="px-2 text-xs font-mono font-black text-slate-100">{Math.round(zoom * 100)}%</span>
        <button 
          onClick={() => setZoom(z => Math.min(3.5, z + 0.2))} 
          className="p-2.5 sm:p-2 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
          title="Acercar (+)"
        >
          <ZoomIn className="w-4 h-4 font-bold" />
        </button>
        <button 
          onClick={() => setPresetView('iso')} 
          className="p-2.5 sm:p-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 border-l border-slate-700/80"
          title="Restablecer vista 3D"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG 3D Canvas */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      >
        <defs>
          <marker id="water-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
        </defs>

        <g transform={`scale(${zoom})`} style={{ transformOrigin: 'center center' }}>
          {renderGroundGrid()}

          {/* 1. RENDER 3D COLUMNS (SQUARE PROFILE & SQUARE BASE PLATES) */}
          {showColumns && columnas.map((col, idx) => {
            const isSelected = selectedId === col.id;
            const bZ = col.baseZ || 0;
            const topZ = col.altura;
            
            // Dimensions for square base plate and square column tube
            const plateS = 0.22;
            const colW = 0.075;

            // Base plate 4 corners
            const bp1 = projectPoint(col.x - plateS, col.y - plateS, bZ);
            const bp2 = projectPoint(col.x + plateS, col.y - plateS, bZ);
            const bp3 = projectPoint(col.x + plateS, col.y + plateS, bZ);
            const bp4 = projectPoint(col.x - plateS, col.y - plateS, bZ);

            // Anchor bolt coordinates (4 corners of square plate)
            const ab1 = projectPoint(col.x - plateS * 0.7, col.y - plateS * 0.7, bZ);
            const ab2 = projectPoint(col.x + plateS * 0.7, col.y - plateS * 0.7, bZ);
            const ab3 = projectPoint(col.x + plateS * 0.7, col.y + plateS * 0.7, bZ);
            const ab4 = projectPoint(col.x - plateS * 0.7, col.y + plateS * 0.7, bZ);

            // Square column 8 vertices
            const b1 = projectPoint(col.x - colW, col.y - colW, bZ);
            const b2 = projectPoint(col.x + colW, col.y - colW, bZ);
            const b3 = projectPoint(col.x + colW, col.y + colW, bZ);
            const b4 = projectPoint(col.x - colW, col.y + colW, bZ);

            const t1 = projectPoint(col.x - colW, col.y - colW, topZ);
            const t2 = projectPoint(col.x + colW, col.y - colW, topZ);
            const t3 = projectPoint(col.x + colW, col.y + colW, topZ);
            const t4 = projectPoint(col.x - colW, col.y + colW, topZ);

            return (
              <g 
                key={`col3d-${col.id}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement?.(col.id, 'column');
                }}
                className="cursor-pointer group"
              >
                {/* 3D Square Base Plate */}
                {col.basePlate && (
                  <g id={`baseplate-3d-${col.id}`}>
                    <polygon 
                      points={`${bp1.sx},${bp1.sy} ${bp2.sx},${bp2.sy} ${bp3.sx},${bp3.sy} ${bp4.sx},${bp4.sy}`}
                      fill={isSelected ? '#0284c7' : '#334155'} 
                      stroke={isSelected ? '#38bdf8' : '#64748b'} 
                      strokeWidth="1.5" 
                    />
                    {/* 4 Corner Anchor Bolts */}
                    <circle cx={ab1.sx} cy={ab1.sy} r="2" fill="#cbd5e1" stroke="#0f172a" strokeWidth="0.8" />
                    <circle cx={ab2.sx} cy={ab2.sy} r="2" fill="#cbd5e1" stroke="#0f172a" strokeWidth="0.8" />
                    <circle cx={ab3.sx} cy={ab3.sy} r="2" fill="#cbd5e1" stroke="#0f172a" strokeWidth="0.8" />
                    <circle cx={ab4.sx} cy={ab4.sy} r="2" fill="#cbd5e1" stroke="#0f172a" strokeWidth="0.8" />
                  </g>
                )}

                {/* 3D Square Column Faces */}
                {/* Side Face 1 */}
                <polygon 
                  points={`${b1.sx},${b1.sy} ${b2.sx},${b2.sy} ${t2.sx},${t2.sy} ${t1.sx},${t1.sy}`}
                  fill={isSelected ? '#0369a1' : '#334155'}
                  stroke={isSelected ? '#38bdf8' : '#475569'}
                  strokeWidth="1"
                />
                {/* Side Face 2 */}
                <polygon 
                  points={`${b2.sx},${b2.sy} ${b3.sx},${b3.sy} ${t3.sx},${t3.sy} ${t2.sx},${t2.sy}`}
                  fill={isSelected ? '#0284c7' : '#475569'}
                  stroke={isSelected ? '#38bdf8' : '#64748b'}
                  strokeWidth="1"
                />
                {/* Side Face 3 */}
                <polygon 
                  points={`${b3.sx},${b3.sy} ${b4.sx},${b4.sy} ${t4.sx},${t4.sy} ${t3.sx},${t3.sy}`}
                  fill={isSelected ? '#0369a1' : '#1e293b'}
                  stroke={isSelected ? '#38bdf8' : '#334155'}
                  strokeWidth="0.8"
                />
                {/* Top Cap */}
                <polygon 
                  points={`${t1.sx},${t1.sy} ${t2.sx},${t2.sy} ${t3.sx},${t3.sy} ${t4.sx},${t4.sy}`}
                  fill={isSelected ? '#38bdf8' : '#64748b'}
                  stroke={isSelected ? '#7dd3fc' : '#94a3b8'}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Cobertura when placed INFERIOR (Cielo raso / falso techo debajo de correas) */}
          {coverLayerOrder === 'inferior' && renderRoofCovering()}

          {/* 2. RENDER 3D BEAMS & TRUSSES */}
          {showBeams && vigas.map((beam, bIdx) => {
            const p1 = projectPoint(beam.startNode.x, beam.startNode.y, beam.startNode.z);
            const p2 = projectPoint(beam.endNode.x, beam.endNode.y, beam.endNode.z);
            const isSelected = selectedId === beam.id;

            let strokeColor = '#60a5fa';
            let strokeWidth = 4.5;

            if (beam.type === 'tijeral_cuerda') {
              strokeColor = '#3b82f6';
              strokeWidth = 4;
            } else if (beam.type === 'tijeral_montante' || beam.type === 'tijeral_diagonal') {
              strokeColor = '#94a3b8';
              strokeWidth = 2.2;
            } else if (beam.type === 'arriostre') {
              strokeColor = '#fb923c';
              strokeWidth = 2.2;
            } else if (beam.type === 'secundaria') {
              strokeColor = '#38bdf8';
              strokeWidth = 3;
            }

            if (isSelected) {
              strokeColor = '#f43f5e';
              strokeWidth = 6;
            }

            return (
              <g 
                key={`beam3d-${beam.id}-${bIdx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement?.(beam.id, 'beam');
                }}
                className="cursor-pointer"
              >
                <line 
                  x1={p1.sx} 
                  y1={p1.sy} 
                  x2={p2.sx} 
                  y2={p2.sy} 
                  stroke={strokeColor} 
                  strokeWidth={strokeWidth} 
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* 3. RENDER 3D PURLINS (CORREAS) */}
          {showPurlins && correas.map((purlin, purIdx) => {
            const p1 = projectPoint(purlin.startNode.x, purlin.startNode.y, purlin.startNode.z);
            const p2 = projectPoint(purlin.endNode.x, purlin.endNode.y, purlin.endNode.z);
            const isSelected = selectedId === purlin.id;

            return (
              <line 
                key={`purlin3d-${purlin.id}-${purIdx}`}
                x1={p1.sx} 
                y1={p1.sy} 
                x2={p2.sx} 
                y2={p2.sy} 
                stroke={isSelected ? '#f43f5e' : '#34d399'} 
                strokeWidth={isSelected ? 4 : 2.5} 
                strokeLinecap="round"
              />
            );
          })}

          {/* 4. RENDER ROOF COVERING (ALUZINC / PANEL) - Superior Layer (Sobre correas) */}
          {coverLayerOrder === 'superior' && renderRoofCovering()}

          {/* 5. RENDER GUTTER (CANALETA) & DOWNSPOUTS (BAJANTES) */}
          {renderEvacuacionAgua()}

          {/* 6. RENDER WATER EVACUATION ARROW */}
          {renderWaterEvacuationArrow()}
        </g>
      </svg>
    </div>
  );
};
