// Lienzo CAD 2D Interactivo para Carpintería Metálica y Ventanería
import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Cog, 
  ShieldCheck 
} from 'lucide-react';
import { PuertaVentanaDesign } from './carpinteriaTypes';
import { PERFILES_CATALOGO } from './carpinteriaCatalog';
import { calcularEspaciadoReja } from './carpinteriaCalculations';

interface CarpinteriaCanvas2DProps {
  design: PuertaVentanaDesign;
  selectedPanelId?: string | null;
  onSelectPanel?: (panelId: string) => void;
  onUpdateDimension?: (ancho: number, alto: number) => void;
}

export const CarpinteriaCanvas2D: React.FC<CarpinteriaCanvas2DProps> = ({
  design,
  selectedPanelId,
  onSelectPanel,
  onUpdateDimension: _onUpdateDimension
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Toggles de visualización
  const [showCotas, setShowCotas] = useState(true);
  const [showAccesorios, setShowAccesorios] = useState(true);
  const [showMarcas, setShowMarcas] = useState(false);
  const [showRejilla, setShowRejilla] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const perfilMarco = PERFILES_CATALOGO.find(p => p.id === design.perfilMarcoId) || PERFILES_CATALOGO[2];
  const perfilBastidor = PERFILES_CATALOGO.find(p => p.id === design.perfilBastidorId) || PERFILES_CATALOGO[7];

  // Dimensiones en coordenadas SVG (1m = 200px para nitidez)
  const SCALE = 220; // 220px por metro
  const svgWidthM = design.anchoM;
  const svgHeightM = design.altoM;
  
  const wPx = svgWidthM * SCALE;
  const hPx = svgHeightM * SCALE;
  
  // Márgenes para cotas perimétricas
  const padLeft = 80;
  const padRight = 70;
  const padTop = 60;
  const padBottom = 70;
  
  const viewBoxW = wPx + padLeft + padRight;
  const viewBoxH = hPx + padTop + padBottom;

  // Grosor visual de marco y bastidor
  const marcoW = Math.max(8, (perfilMarco.anchoMm / 1000) * SCALE);
  const bastidorW = Math.max(6, (perfilBastidor.anchoMm / 1000) * SCALE);

  // Manejo de Pan / Arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Click izquierdo
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Cálculo de hojas
  const numHojas = Math.max(1, design.numHojas);
  const leafW = (wPx - 2 * marcoW) / numHojas;
  const leafH = hPx - 2 * marcoW;

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 relative overflow-hidden select-none">
      {/* Barra de herramientas flotante superior */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 rounded-2xl shadow-xl text-xs">
        <div className="flex items-center space-x-1 border-r border-slate-800 pr-2">
          <button
            onClick={() => setZoom(z => Math.min(3.0, z + 0.15))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Acercar (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] text-slate-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Restablecer Vista"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Toggles de capas */}
        <div className="flex items-center space-x-1 pl-1">
          <button
            onClick={() => setShowCotas(!showCotas)}
            className={`px-2 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
              showCotas ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Cotas</span>
          </button>
          <button
            onClick={() => setShowAccesorios(!showAccesorios)}
            className={`px-2 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
              showAccesorios ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Cerrajería</span>
          </button>
          <button
            onClick={() => setShowMarcas(!showMarcas)}
            className={`px-2 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
              showMarcas ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Marcas Taller</span>
          </button>
          <button
            onClick={() => setShowRejilla(!showRejilla)}
            className={`px-2 py-1 rounded-lg font-semibold transition-colors ${
              showRejilla ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            <span>Rejilla</span>
          </button>
        </div>
      </div>

      {/* Info Flotante de Escala y Vano */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-2xl shadow-xl text-right">
        <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center justify-end space-x-1">
          <ShieldCheck className="w-3 h-3" />
          <span>Vano de Fabricación</span>
        </div>
        <p className="font-mono font-bold text-slate-100 text-sm">
          {design.anchoM.toFixed(2)} m × {design.altoM.toFixed(2)} m
        </p>
        <p className="text-[10px] text-slate-400">
          Área: <strong className="text-emerald-400 font-mono">{(design.anchoM * design.altoM).toFixed(2)} m²</strong>
        </p>
      </div>

      {/* Canvas SVG Interactivo */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div 
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
          className="flex items-center justify-center"
        >
          <svg
            width={viewBoxW}
            height={viewBoxH}
            viewBox={`-${padLeft} -${padTop} ${viewBoxW} ${viewBoxH}`}
            className="overflow-visible"
          >
            <defs>
              {/* Patrón de Rejilla de Fondo */}
              <pattern id="grid-cad" width="22" height="22" patternUnits="userSpaceOnUse">
                <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>

              {/* Patrón Plancha Perforada */}
              <pattern id="patron-perforada" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#334155" />
                <circle cx="4" cy="4" r="1.8" fill="#0f172a" />
              </pattern>

              {/* Patrón Plancha Estriada / Alfajor */}
              <pattern id="patron-estriada" width="14" height="14" patternUnits="userSpaceOnUse">
                <rect width="14" height="14" fill="#334155" />
                <line x1="2" y1="2" x2="6" y2="6" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="8" y1="12" x2="12" y2="8" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
              </pattern>

              {/* Patrón Malla Electrosoldada */}
              <pattern id="patron-malla-electro" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#1e293b" />
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#64748b" strokeWidth="1.2" />
              </pattern>

              {/* Patrón Malla Expandida / Rombo */}
              <pattern id="patron-malla-expandida" width="12" height="16" patternUnits="userSpaceOnUse">
                <rect width="12" height="16" fill="#1e293b" />
                <path d="M 6 0 L 12 8 L 6 16 L 0 8 Z" fill="none" stroke="#94a3b8" strokeWidth="1" />
              </pattern>

              {/* Vidrio Gradiente con Reflejo */}
              <linearGradient id="gradiente-vidrio" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="45%" stopColor="#bae6fd" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
                <stop offset="55%" stopColor="#bae6fd" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.30" />
              </linearGradient>

              {/* Flechas de Cotas */}
              <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 5 L 10 0 L 7 5 L 10 10 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 5 L 10 0 L 7 5 L 10 10 z" fill="#38bdf8" />
              </marker>
            </defs>

            {/* Rejilla de Fondo CAD */}
            {showRejilla && (
              <rect
                x={-padLeft}
                y={-padTop}
                width={viewBoxW}
                height={viewBoxH}
                fill="url(#grid-cad)"
                opacity="0.8"
              />
            )}

            {/* Vano en Pared (Línea de Muro Circundante) */}
            <rect
              x="-8"
              y="-8"
              width={wPx + 16}
              height={hPx + 16}
              fill="#0b0f19"
              stroke="#334155"
              strokeWidth="2"
              strokeDasharray="6 4"
              rx="4"
            />

            {/* ==============================================
                1. MARCO EXTERIOR
               ============================================== */}
            <g id="marco-exterior">
              {/* Marco Perimétrico */}
              <rect
                x="0"
                y="0"
                width={wPx}
                height={hPx}
                fill="#0f172a"
                stroke="#64748b"
                strokeWidth={marcoW}
                rx="2"
              />

              {/* Líneas de Corte a Inglete 45° en las esquinas */}
              <line x1="0" y1="0" x2={marcoW} y2={marcoW} stroke="#94a3b8" strokeWidth="1" />
              <line x1={wPx} y1="0" x2={wPx - marcoW} y2={marcoW} stroke="#94a3b8" strokeWidth="1" />
              <line x1="0" y1={hPx} x2={marcoW} y2={hPx - marcoW} stroke="#94a3b8" strokeWidth="1" />
              <line x1={wPx} y1={hPx} x2={wPx - marcoW} y2={hPx - marcoW} stroke="#94a3b8" strokeWidth="1" />

              {showMarcas && (
                <>
                  <text x={wPx / 2} y={marcoW / 2 + 3} fill="#a5b4fc" fontSize="10" fontWeight="bold" textAnchor="middle">
                    M-01 (Marco Sup.)
                  </text>
                  <text x={marcoW / 2} y={hPx / 2} fill="#a5b4fc" fontSize="10" fontWeight="bold" textAnchor="middle" transform={`rotate(-90, ${marcoW / 2}, ${hPx / 2})`}>
                    M-02 (Jamba Izq.)
                  </text>
                </>
              )}
            </g>

            {/* ==============================================
                2. HOJAS Y BASTIDORES
               ============================================== */}
            {Array.from({ length: numHojas }).map((_, hIdx) => {
              const leafX = marcoW + hIdx * leafW;
              const leafY = marcoW;
              const innerLeafW = leafW - 4; // holgura
              const innerLeafH = leafH - 4;

              return (
                <g key={`hoja-${hIdx}`} id={`hoja-${hIdx}`}>
                  {/* Bastidor Perimétrico de la Hoja */}
                  <rect
                    x={leafX + 2}
                    y={leafY + 2}
                    width={innerLeafW}
                    height={innerLeafH}
                    fill="#1e293b"
                    stroke="#475569"
                    strokeWidth={bastidorW}
                    rx="1"
                  />

                  {/* Vano interior útil de la hoja para paneles */}
                  {design.paneles.map((panel, _pIdx) => {
                    const pX = leafX + 2 + bastidorW + panel.relX * (innerLeafW - 2 * bastidorW);
                    const pY = leafY + 2 + bastidorW + panel.relY * (innerLeafH - 2 * bastidorW);
                    const pW = panel.relW * (innerLeafW - 2 * bastidorW);
                    const pH = panel.relH * (innerLeafH - 2 * bastidorW);

                    const isSelected = selectedPanelId === panel.id;

                    return (
                      <g 
                        key={`panel-${hIdx}-${panel.id}`}
                        onClick={() => onSelectPanel && onSelectPanel(panel.id)}
                        className="cursor-pointer transition-all"
                      >
                        {/* Relleno según Tipo */}
                        {panel.tipoRelleno === 'plancha_lisa' && (
                          <rect
                            x={pX}
                            y={pY}
                            width={pW}
                            height={pH}
                            fill={panel.colorHex || '#334155'}
                            stroke="#475569"
                            strokeWidth="1"
                          />
                        )}

                        {panel.tipoRelleno === 'plancha_perforada' && (
                          <rect
                            x={pX}
                            y={pY}
                            width={pW}
                            height={pH}
                            fill="url(#patron-perforada)"
                            stroke="#475569"
                            strokeWidth="1"
                          />
                        )}

                        {panel.tipoRelleno === 'plancha_estriada' && (
                          <rect
                            x={pX}
                            y={pY}
                            width={pW}
                            height={pH}
                            fill="url(#patron-estriada)"
                            stroke="#475569"
                            strokeWidth="1"
                          />
                        )}

                        {(panel.tipoRelleno === 'vidrio_simple' || 
                          panel.tipoRelleno === 'vidrio_templado' || 
                          panel.tipoRelleno === 'vidrio_laminado' ||
                          panel.tipoRelleno === 'vidrio_doble_dvh' ||
                          panel.tipoRelleno === 'vidrio_traslucido') && (
                          <>
                            <rect
                              x={pX}
                              y={pY}
                              width={pW}
                              height={pH}
                              fill="url(#gradiente-vidrio)"
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                            />
                            {/* Reflejo diagonal de cristal */}
                            <line 
                              x1={pX + pW * 0.2} 
                              y1={pY + 10} 
                              x2={pX + pW * 0.4} 
                              y2={pY + pH - 10} 
                              stroke="#ffffff" 
                              strokeWidth="2" 
                              strokeOpacity="0.4"
                              strokeDasharray="20 10" 
                            />
                          </>
                        )}

                        {panel.tipoRelleno === 'malla_electrosoldada' && (
                          <rect
                            x={pX}
                            y={pY}
                            width={pW}
                            height={pH}
                            fill="url(#patron-malla-electro)"
                            stroke="#475569"
                            strokeWidth="1"
                          />
                        )}

                        {panel.tipoRelleno === 'malla_expandida' && (
                          <rect
                            x={pX}
                            y={pY}
                            width={pW}
                            height={pH}
                            fill="url(#patron-malla-expandida)"
                            stroke="#475569"
                            strokeWidth="1"
                          />
                        )}

                        {panel.tipoRelleno === 'reja_vertical' && (
                          <g>
                            <rect x={pX} y={pY} width={pW} height={pH} fill="#090d16" />
                            {(() => {
                              const calc = calcularEspaciadoReja(
                                (pW / SCALE),
                                panel.espaciadoRejaCm || 11,
                                12.7
                              );
                              const step = pW / (calc.cantBarras + 1);

                              return Array.from({ length: calc.cantBarras }).map((__, bIdx) => {
                                const barX = pX + (bIdx + 1) * step;
                                return (
                                  <g key={`bar-${bIdx}`}>
                                    <line
                                      x1={barX}
                                      y1={pY + 2}
                                      x2={barX}
                                      y2={pY + pH - 2}
                                      stroke="#94a3b8"
                                      strokeWidth="3.5"
                                      strokeLinecap="square"
                                    />
                                    {/* Puntas de lanza decorativas si aplica en reja */}
                                    {design.rejaConfig?.puntasLanza && pY < 50 && (
                                      <polygon
                                        points={`${barX},${pY - 8} ${barX - 4},${pY + 2} ${barX + 4},${pY + 2}`}
                                        fill="#e2e8f0"
                                      />
                                    )}
                                  </g>
                                );
                              });
                            })()}
                          </g>
                        )}

                        {panel.tipoRelleno === 'reja_horizontal' && (
                          <g>
                            <rect x={pX} y={pY} width={pW} height={pH} fill="#090d16" />
                            {Array.from({ length: 5 }).map((__, bIdx) => {
                              const barY = pY + (bIdx + 1) * (pH / 6);
                              return (
                                <line
                                  key={`hbar-${bIdx}`}
                                  x1={pX + 2}
                                  y1={barY}
                                  x2={pX + pW - 2}
                                  y2={barY}
                                  stroke="#94a3b8"
                                  strokeWidth="3"
                                />
                              );
                            })}
                          </g>
                        )}

                        {/* Borde de selección activa del panel */}
                        {isSelected && (
                          <rect
                            x={pX}
                            y={pY}
                            width={pW}
                            height={pH}
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3"
                            strokeDasharray="6 3"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* ==============================================
                      3. PUERTA PEATONAL INTEGRADA EN PORTÓN
                     ============================================== */}
                  {design.portonConfig?.puertaPeatonalIntegrada && hIdx === 0 && (
                    <g id="puerta-peatonal-integrada">
                      {(() => {
                        const ptW = (design.portonConfig.peatonalAnchoM || 0.85) * SCALE;
                        const ptH = (design.portonConfig.peatonalAltoM || 2.00) * SCALE;
                        const ptX = leafX + 2 + bastidorW + ((design.portonConfig.peatonalPosXM || 0.30) * SCALE);
                        const ptY = leafY + 2 + innerLeafH - ptH - bastidorW;

                        return (
                          <>
                            {/* Marco de Puerta Peatonal */}
                            <rect
                              x={ptX}
                              y={ptY}
                              width={ptW}
                              height={ptH}
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="4"
                              rx="2"
                            />
                            {/* Manija de puerta peatonal */}
                            <rect
                              x={ptX + ptW - 14}
                              y={ptY + ptH / 2 - 12}
                              width="8"
                              height="24"
                              rx="2"
                              fill="#e2e8f0"
                              stroke="#0f172a"
                              strokeWidth="1.5"
                            />
                            <text
                              x={ptX + ptW / 2}
                              y={ptY + 16}
                              fill="#f59e0b"
                              fontSize="9"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              Peatonal Integrada
                            </text>
                          </>
                        );
                      })()}
                    </g>
                  )}

                  {/* ==============================================
                      4. CERRAJERÍA, BISAGRAS Y ACCESORIOS
                     ============================================== */}
                  {showAccesorios && (
                    <g id={`accesorios-hoja-${hIdx}`}>
                      {/* Cerradura Principal en Hoja 0 */}
                      {hIdx === 0 && (
                        <g id="cerradura-principal">
                          {/* Caja de cerradura de sobreponer o embutir */}
                          <rect
                            x={leafX + innerLeafW - 24}
                            y={leafY + innerLeafH / 2 - 20}
                            width="20"
                            height="40"
                            rx="3"
                            fill="#cbd5e1"
                            stroke="#0f172a"
                            strokeWidth="2"
                          />
                          {/* Manija / Tirador */}
                          <line
                            x1={leafX + innerLeafW - 14}
                            y1={leafY + innerLeafH / 2 - 6}
                            x2={leafX + innerLeafW - 35}
                            y2={leafY + innerLeafH / 2 - 6}
                            stroke="#0f172a"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <circle
                            cx={leafX + innerLeafW - 14}
                            cy={leafY + innerLeafH / 2 + 10}
                            r="3"
                            fill="#0f172a"
                          />
                        </g>
                      )}

                      {/* Bisagras para Puerta Batiente */}
                      {(design.tipoElemento === 'puerta' || design.sentidoApertura.includes('Batiente')) && (
                        <>
                          {/* Bisagra Superior */}
                          <rect
                            x={leafX - 1}
                            y={leafY + 30}
                            width="6"
                            height="24"
                            rx="2"
                            fill="#94a3b8"
                            stroke="#0f172a"
                            strokeWidth="1"
                          />
                          {/* Bisagra Media */}
                          <rect
                            x={leafX - 1}
                            y={leafY + innerLeafH / 2 - 12}
                            width="6"
                            height="24"
                            rx="2"
                            fill="#94a3b8"
                            stroke="#0f172a"
                            strokeWidth="1"
                          />
                          {/* Bisagra Inferior */}
                          <rect
                            x={leafX - 1}
                            y={leafY + innerLeafH - 50}
                            width="6"
                            height="24"
                            rx="2"
                            fill="#94a3b8"
                            stroke="#0f172a"
                            strokeWidth="1"
                          />
                        </>
                      )}

                      {/* Ruedas y Riel para Portón Corredizo */}
                      {design.tipoElemento === 'porton' && design.portonConfig?.tipo.includes('corredizo') && (
                        <g id="ruedas-porton">
                          {/* Rueda Izquierda */}
                          <circle
                            cx={leafX + 50}
                            cy={leafY + innerLeafH + 6}
                            r="12"
                            fill="#64748b"
                            stroke="#e2e8f0"
                            strokeWidth="3"
                          />
                          <circle
                            cx={leafX + 50}
                            cy={leafY + innerLeafH + 6}
                            r="4"
                            fill="#0f172a"
                          />
                          {/* Rueda Derecha */}
                          <circle
                            cx={leafX + innerLeafW - 50}
                            cy={leafY + innerLeafH + 6}
                            r="12"
                            fill="#64748b"
                            stroke="#e2e8f0"
                            strokeWidth="3"
                          />
                          <circle
                            cx={leafX + innerLeafW - 50}
                            cy={leafY + innerLeafH + 6}
                            r="4"
                            fill="#0f172a"
                          />
                        </g>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Riel Inferior para Portón Corredizo */}
            {design.tipoElemento === 'porton' && design.portonConfig?.tipo.includes('corredizo') && (
              <g id="riel-corredizo">
                <line
                  x1={-30}
                  y1={hPx + 16}
                  x2={wPx + 80}
                  y2={hPx + 16}
                  stroke="#94a3b8"
                  strokeWidth="6"
                />
                {/* Topes de Fin de Carrera */}
                <rect x="-35" y={hPx} width="8" height="22" fill="#ef4444" rx="2" />
                <rect x={wPx + 75} y={hPx} width="8" height="22" fill="#ef4444" rx="2" />
              </g>
            )}

            {/* Automatización (Cremallera + Motor) si está activado */}
            {design.portonConfig?.automatizado && showAccesorios && (
              <g id="automatizacion-porton">
                {/* Cremallera metálica M4 dentada */}
                <rect
                  x="10"
                  y={hPx - marcoW - 14}
                  width={wPx - 20}
                  height="8"
                  fill="#f59e0b"
                  stroke="#b45309"
                  strokeWidth="1"
                />
                <text x={wPx / 2} y={hPx - marcoW - 18} fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                  Cremallera Metálica M4
                </text>
                {/* Espacio para Base de Motor */}
                <g transform={`translate(${wPx + 15}, ${hPx - 50})`}>
                  <rect width="45" height="55" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                  <Cog className="w-5 h-5 text-blue-400" x="12" y="10" />
                  <text x="22" y="42" fill="#93c5fd" fontSize="7" fontWeight="bold" textAnchor="middle">
                    MOTOR
                  </text>
                </g>
              </g>
            )}

            {/* ==============================================
                5. LÍNEAS Y TEXTOS DE COTAS TÉCNICAS
               ============================================== */}
            {showCotas && (
              <g id="cotas-arquitectonicas">
                {/* Cota Superior (Ancho Total) */}
                <g id="cota-ancho">
                  <line x1="0" y1="-28" x2={wPx} y2="-28" stroke="#38bdf8" strokeWidth="1.5" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
                  <line x1="0" y1="-4" x2="0" y2="-36" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1={wPx} y1="-4" x2={wPx} y2="-36" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x={wPx / 2 - 38} y="-42" width="76" height="22" rx="4" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                  <text x={wPx / 2} y="-27" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    L = {design.anchoM.toFixed(2)} m
                  </text>
                </g>

                {/* Cota Lateral Izquierda (Alto Total) */}
                <g id="cota-alto">
                  <line x1="-38" y1="0" x2="-38" y2={hPx} stroke="#38bdf8" strokeWidth="1.5" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
                  <line x1="-4" y1="0" x2="-46" y2="0" stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="-4" y1={hPx} x2="-46" y2={hPx} stroke="#0284c7" strokeWidth="1" strokeDasharray="2 2" />
                  <rect 
                    x="-50" 
                    y={hPx / 2 - 11} 
                    width="24" 
                    height="76" 
                    rx="4" 
                    fill="#0f172a" 
                    stroke="#0284c7" 
                    strokeWidth="1" 
                  />
                  <text 
                    x="-38" 
                    y={hPx / 2 + 25} 
                    fill="#38bdf8" 
                    fontSize="11" 
                    fontWeight="bold" 
                    fontFamily="monospace" 
                    textAnchor="middle" 
                    transform={`rotate(-90, -38, ${hPx / 2})`}
                  >
                    H = {design.altoM.toFixed(2)} m
                  </text>
                </g>

                {/* Cota de cada Hoja (si numHojas > 1) */}
                {numHojas > 1 && (
                  <g id="cotas-hojas">
                    {Array.from({ length: numHojas }).map((_, hIdx) => {
                      const hx = marcoW + hIdx * leafW;
                      return (
                        <g key={`cota-hoja-${hIdx}`}>
                          <line
                            x1={hx}
                            y1={hPx + 32}
                            x2={hx + leafW}
                            y2={hPx + 32}
                            stroke="#94a3b8"
                            strokeWidth="1"
                            markerStart="url(#arrow-start)"
                            markerEnd="url(#arrow-end)"
                          />
                          <line x1={hx} y1={hPx + 4} x2={hx} y2={hPx + 38} stroke="#475569" strokeWidth="0.8" strokeDasharray="2 2" />
                          <line x1={hx + leafW} y1={hPx + 4} x2={hx + leafW} y2={hPx + 38} stroke="#475569" strokeWidth="0.8" strokeDasharray="2 2" />
                          <text
                            x={hx + leafW / 2}
                            y={hPx + 45}
                            fill="#94a3b8"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            Hoja {hIdx + 1}: {(design.anchoM / numHojas).toFixed(2)}m
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Pie de Canvas con Leyenda Rápida */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 border border-slate-500 inline-block"></span>
            <span>Marco: {perfilMarco.dimensiones}</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-900 border border-blue-500 inline-block"></span>
            <span>Bastidor: {perfilBastidor.dimensiones}</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          💡 Puedes arrastrar con el cursor para moverte y usar zoom. Haz clic sobre un panel para editar su material.
        </div>
      </div>
    </div>
  );
};

export default CarpinteriaCanvas2D;
