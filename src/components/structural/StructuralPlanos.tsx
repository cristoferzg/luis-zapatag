import React, { useState } from 'react';
import { 
  StructuralGeometry, 
  StructureOptions, 
  CoberturaOptions, 
  ConexionesOptions,
  ColumnElement, 
  BeamElement, 
  PurlinElement 
} from './structuralTypes';
import { Printer, Layers } from 'lucide-react';

interface PlanosProps {
  geometria: StructuralGeometry;
  estructura?: StructureOptions;
  cobertura?: CoberturaOptions;
  conexiones?: ConexionesOptions;
  columnas?: ColumnElement[];
  vigas?: BeamElement[];
  correas?: PurlinElement[];
  projectName: string;
}

export const StructuralPlanos: React.FC<PlanosProps> = ({
  geometria,
  projectName
}) => {
  const [activeSheet, setActiveSheet] = useState<'E01' | 'E02' | 'E03' | 'E04'>('E01');
  const [blueprintTheme, setBlueprintTheme] = useState<'white' | 'blueprint'>('white');

  const handlePrint = () => {
    window.print();
  };

  const isDark = blueprintTheme === 'blueprint';
  const bgColor = isDark ? '#0f172a' : '#ffffff';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const strokeMain = isDark ? '#38bdf8' : '#0f172a';
  const strokeDim = isDark ? '#f59e0b' : '#2563eb';
  const textMain = isDark ? '#e2e8f0' : '#1e293b';

  return (
    <div className="w-full h-full bg-slate-100 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col">
      {/* Blueprint Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
            <Layers className="w-4 h-4 mr-1.5 text-blue-600" />
            Lámina:
          </span>
          <div className="flex rounded-xl bg-slate-100 p-1 space-x-1">
            <button
              onClick={() => setActiveSheet('E01')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSheet === 'E01' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              E-01: Planta Cimentación
            </button>
            <button
              onClick={() => setActiveSheet('E02')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSheet === 'E02' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              E-02: Elevación y Tijeral
            </button>
            <button
              onClick={() => setActiveSheet('E03')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSheet === 'E03' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              E-03: Planta de Techos
            </button>
            <button
              onClick={() => setActiveSheet('E04')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSheet === 'E04' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              E-04: Detalle Placa Base
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setBlueprintTheme('white')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                blueprintTheme === 'white' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Plano Blanco
            </button>
            <button
              onClick={() => setBlueprintTheme('blueprint')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                blueprintTheme === 'blueprint' ? 'bg-slate-900 text-cyan-400 shadow-xs' : 'text-slate-500'
              }`}
            >
              Blueprint Azul
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Plano (PDF)</span>
          </button>
        </div>
      </div>

      {/* Blueprint Canvas Frame */}
      <div 
        className="flex-1 min-h-[560px] rounded-2xl border-2 shadow-lg overflow-hidden relative flex items-center justify-center p-4 transition-colors"
        style={{ backgroundColor: bgColor, borderColor: isDark ? '#334155' : '#cbd5e1' }}
      >
        <svg
          viewBox="0 0 920 600"
          className="w-full h-full max-h-[700px] select-none"
        >
          {/* Technical Sheet Border */}
          <rect x="15" y="15" width="890" height="570" fill="none" stroke={isDark ? '#38bdf8' : '#334155'} strokeWidth="2" />
          <rect x="20" y="20" width="880" height="560" fill="none" stroke={isDark ? '#0284c7' : '#64748b'} strokeWidth="1" strokeDasharray="4 2" />

          {/* North Arrow Symbol */}
          <g transform="translate(850, 60)">
            <circle cx="0" cy="0" r="18" fill="none" stroke={textMain} strokeWidth="1.5" />
            <polygon points="0,-16 -6,4 0,0" fill={strokeDim} />
            <polygon points="0,-16 6,4 0,0" fill="none" stroke={textMain} strokeWidth="1" />
            <text x="0" y="-20" fontSize="11" fill={textMain} fontWeight="bold" textAnchor="middle">N</text>
          </g>

          {/* SHEET CONTENT BASED ON ACTIVE SHEET */}
          {activeSheet === 'E01' && (
            <g id="sheet-e01-planta">
              <text x="50" y="55" fontSize="14" fill={textMain} fontWeight="bold" fontFamily="monospace">
                PLANO DE CIMENTACIÓN Y UBICACIÓN DE COLUMNAS (ESC: 1:75)
              </text>

              {/* Grid axes along length (1, 2, 3, 4...) */}
              {(() => {
                const numFrames = Math.max(2, Math.round(geometria.largo / geometria.separacionPorticos) + 1);
                const stepPx = 600 / (numFrames - 1);
                const elements = [];

                for (let i = 0; i < numFrames; i++) {
                  const x = 160 + i * stepPx;
                  elements.push(
                    <g key={`axis-x-${i}`}>
                      <line x1={x} y1="90" x2={x} y2="420" stroke={gridColor} strokeWidth="1.5" strokeDasharray="6 3" />
                      <circle cx={x} cy="80" r="12" fill={bgColor} stroke={strokeDim} strokeWidth="1.5" />
                      <text x={x} y="84" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                        {i + 1}
                      </text>
                      <circle cx={x} cy="430" r="12" fill={bgColor} stroke={strokeDim} strokeWidth="1.5" />
                      <text x={x} y="434" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                        {i + 1}
                      </text>
                    </g>
                  );
                }
                return elements;
              })()}

              {/* Grid axes along width (A, B) */}
              <line x1="130" y1="140" x2="790" y2="140" stroke={gridColor} strokeWidth="1.5" strokeDasharray="6 3" />
              <circle cx="120" cy="140" r="12" fill={bgColor} stroke={strokeDim} strokeWidth="1.5" />
              <text x="120" y="144" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">A</text>

              <line x1="130" y1="360" x2="790" y2="360" stroke={gridColor} strokeWidth="1.5" strokeDasharray="6 3" />
              <circle cx="120" cy="360" r="12" fill={bgColor} stroke={strokeDim} strokeWidth="1.5" />
              <text x="120" y="364" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">B</text>

              {/* Columns & Footing Representations */}
              {(() => {
                const numFrames = Math.max(2, Math.round(geometria.largo / geometria.separacionPorticos) + 1);
                const stepPx = 600 / (numFrames - 1);
                const cols = [];

                for (let i = 0; i < numFrames; i++) {
                  const x = 160 + i * stepPx;
                  // Eje A
                  cols.push(
                    <g key={`col-foot-a-${i}`}>
                      <rect x={x - 16} y={140 - 16} width="32" height="32" fill="none" stroke={strokeMain} strokeWidth="1.5" />
                      <rect x={x - 8} y={140 - 8} width="16" height="16" fill={strokeMain} />
                      <text x={x + 14} y={135} fontSize="9" fill={textMain} fontWeight="bold">C-{i*2 + 1}</text>
                    </g>
                  );
                  // Eje B
                  cols.push(
                    <g key={`col-foot-b-${i}`}>
                      <rect x={x - 16} y={360 - 16} width="32" height="32" fill="none" stroke={strokeMain} strokeWidth="1.5" />
                      <rect x={x - 8} y={360 - 8} width="16" height="16" fill={strokeMain} />
                      <text x={x + 14} y={355} fontSize="9" fill={textMain} fontWeight="bold">C-{i*2 + 2}</text>
                    </g>
                  );
                }
                return cols;
              })()}

              {/* Dimension lines (Cotas) */}
              <line x1="160" y1="460" x2="760" y2="460" stroke={strokeDim} strokeWidth="1.5" />
              <text x="460" y="478" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                LARGO TOTAL: {geometria.largo.toFixed(2)} m
              </text>

              <line x1="795" y1="140" x2="795" y2="360" stroke={strokeDim} strokeWidth="1.5" />
              <text x="805" y="255" fontSize="11" fill={strokeDim} fontWeight="bold">
                {geometria.ancho.toFixed(2)} m
              </text>
            </g>
          )}

          {activeSheet === 'E02' && (
            <g id="sheet-e02-elevacion">
              <text x="50" y="55" fontSize="14" fill={textMain} fontWeight="bold" fontFamily="monospace">
                ELEVACIÓN FRONTAL TÍPICA Y DETALLE DE TIJERAL (ESC: 1:50)
              </text>

              {/* Ground level */}
              <line x1="100" y1="400" x2="800" y2="400" stroke={strokeMain} strokeWidth="2" />
              <text x="100" y="420" fontSize="10" fill={strokeDim} fontWeight="bold">N.P.T. ±0.00 m</text>

              {/* Render dynamic trusses based on tipoTecho */}
              {geometria.tipoTecho === 'una_caida' && (
                <g id="truss-una-caida">
                  {/* Columns */}
                  <rect x="180" y="240" width="16" height="160" fill={strokeMain} />
                  <rect x="704" y="150" width="16" height="250" fill={strokeMain} />

                  {/* Top and Bottom Chords */}
                  <line x1="188" y1="240" x2="712" y2="150" stroke={strokeMain} strokeWidth="4" />
                  <line x1="188" y1="240" x2="712" y2="240" stroke={strokeMain} strokeWidth="4" />
                  <line x1="712" y1="240" x2="712" y2="150" stroke={strokeMain} strokeWidth="3" />

                  {/* Truss web elements */}
                  {[0.25, 0.5, 0.75].map((frac, idx) => {
                    const x = 188 + frac * (712 - 188);
                    const yTop = 240 - frac * (240 - 150);
                    const prevX = 188 + (frac - 0.25) * (712 - 188);
                    return (
                      <g key={`web-1a-${idx}`}>
                        <line x1={x} y1="240" x2={x} y2={yTop} stroke={strokeMain} strokeWidth="2" />
                        <line x1={prevX} y1="240" x2={x} y2={yTop} stroke={strokeMain} strokeWidth="1.5" />
                      </g>
                    );
                  })}

                  {/* Labels */}
                  <text x="320" y="180" fontSize="11" fill={strokeDim} fontWeight="bold">
                    Pendiente: {geometria.pendiente}%
                  </text>
                  <text x="704" y="130" fontSize="12" fill={strokeDim} fontWeight="bold" textAnchor="end">
                    Punto Alto +{(geometria.altura + (geometria.ancho * (geometria.pendiente / 100))).toFixed(2)} m
                  </text>
                </g>
              )}

              {geometria.tipoTecho === 'plano' && (
                <g id="truss-plano">
                  {/* Columns */}
                  <rect x="180" y="240" width="16" height="160" fill={strokeMain} />
                  <rect x="704" y="240" width="16" height="160" fill={strokeMain} />

                  {/* Top and Bottom Chords */}
                  <line x1="188" y1="190" x2="712" y2="190" stroke={strokeMain} strokeWidth="4" />
                  <line x1="188" y1="240" x2="712" y2="240" stroke={strokeMain} strokeWidth="4" />
                  <line x1="188" y1="240" x2="188" y2="190" stroke={strokeMain} strokeWidth="3" />
                  <line x1="712" y1="240" x2="712" y2="190" stroke={strokeMain} strokeWidth="3" />

                  {/* Truss web elements */}
                  {[0.25, 0.5, 0.75].map((frac, idx) => {
                    const x = 188 + frac * (712 - 188);
                    const prevX = 188 + (frac - 0.25) * (712 - 188);
                    return (
                      <g key={`web-flat-${idx}`}>
                        <line x1={x} y1="240" x2={x} y2="190" stroke={strokeMain} strokeWidth="2" />
                        <line x1={prevX} y1={idx % 2 === 0 ? "240" : "190"} x2={x} y2={idx % 2 === 0 ? "190" : "240"} stroke={strokeMain} strokeWidth="1.5" />
                      </g>
                    );
                  })}

                  {/* Labels */}
                  <text x="450" y="175" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                    Techo Plano (Pendiente mínima)
                  </text>
                  <text x="450" y="145" fontSize="12" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                    Nivel de Viga +{geometria.altura.toFixed(2)} m
                  </text>
                </g>
              )}

              {geometria.tipoTecho === 'arco' && (
                <g id="truss-arco">
                  {/* Columns */}
                  <rect x="180" y="240" width="16" height="160" fill={strokeMain} />
                  <rect x="704" y="240" width="16" height="160" fill={strokeMain} />

                  {(() => {
                    const h = 85; // Altura de flecha de arco
                    const points: Array<{ x: number; y: number }> = [];
                    const numSteps = 8;
                    for (let i = 0; i <= numSteps; i++) {
                      const t = i / numSteps;
                      const x = 188 + t * 524;
                      const y = 240 - 4 * h * t * (1 - t);
                      points.push({ x, y });
                    }

                    // Curved top chord segments
                    const segments = [];
                    for (let i = 0; i < points.length - 1; i++) {
                      segments.push(
                        <line 
                          key={`arc-seg-${i}`} 
                          x1={points[i].x} 
                          y1={points[i].y} 
                          x2={points[i+1].x} 
                          y2={points[i+1].y} 
                          stroke={strokeMain} 
                          strokeWidth="4" 
                        />
                      );
                    }

                    // Webs (Montantes and Diagonals)
                    const webs = [];
                    for (let i = 1; i < points.length - 1; i++) {
                      const pt = points[i];
                      webs.push(
                        <line 
                          key={`arc-mont-${i}`} 
                          x1={pt.x} 
                          y1="240" 
                          x2={pt.x} 
                          y2={pt.y} 
                          stroke={strokeMain} 
                          strokeWidth="2" 
                        />
                      );
                      const prevPt = points[i - 1];
                      webs.push(
                        <line 
                          key={`arc-diag-${i}`} 
                          x1={prevPt.x} 
                          y1="240" 
                          x2={pt.x} 
                          y2={pt.y} 
                          stroke={strokeMain} 
                          strokeWidth="1.5" 
                        />
                      );
                    }

                    return (
                      <g>
                        {/* Bottom Chord */}
                        <line x1="188" y1="240" x2="712" y2="240" stroke={strokeMain} strokeWidth="4" />
                        {segments}
                        {webs}
                      </g>
                    );
                  })()}

                  {/* Labels */}
                  <text x="450" y="130" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                    Flecha de Arco: {(geometria.flechaArco || 1.20).toFixed(2)} m
                  </text>
                  <text x="450" y="105" fontSize="12" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                    Nivel Clave +{(geometria.altura + (geometria.flechaArco || 1.20)).toFixed(2)} m
                  </text>
                </g>
              )}

              {geometria.tipoTecho !== 'una_caida' && geometria.tipoTecho !== 'plano' && geometria.tipoTecho !== 'arco' && (
                <g id="truss-dos-caidas">
                  {/* Columns */}
                  <rect x="180" y="240" width="16" height="160" fill={strokeMain} />
                  <rect x="704" y="240" width="16" height="160" fill={strokeMain} />

                  {/* Truss Top Chords */}
                  <line x1="188" y1="240" x2="450" y2="130" stroke={strokeMain} strokeWidth="4" />
                  <line x1="450" y1="130" x2="712" y2="240" stroke={strokeMain} strokeWidth="4" />

                  {/* Truss Bottom Chord */}
                  <line x1="188" y1="240" x2="712" y2="240" stroke={strokeMain} strokeWidth="4" />

                  {/* King post */}
                  <line x1="450" y1="240" x2="450" y2="130" stroke={strokeMain} strokeWidth="2.5" />

                  {/* Webs */}
                  {[0.25, 0.5, 0.75].map((frac, idx) => {
                    const xL = 188 + frac * (450 - 188);
                    const yTopL = 240 - frac * (240 - 130);
                    const xR = 712 - frac * (712 - 450);
                    return (
                      <g key={`web-${idx}`}>
                        <line x1={xL} y1="240" x2={xL} y2={yTopL} stroke={strokeMain} strokeWidth="2" />
                        <line x1={xL} y1="240" x2={xL - 65} y2={yTopL + 25} stroke={strokeMain} strokeWidth="1.5" />
                        <line x1={xR} y1="240" x2={xR} y2={yTopL} stroke={strokeMain} strokeWidth="2" />
                        <line x1={xR} y1="240" x2={xR + 65} y2={yTopL + 25} stroke={strokeMain} strokeWidth="1.5" />
                      </g>
                    );
                  })}

                  {/* Slope Tag */}
                  <text x="320" y="170" fontSize="11" fill={strokeDim} fontWeight="bold">
                    Pendiente: {geometria.pendiente}%
                  </text>
                  <text x="450" y="110" fontSize="12" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                    Cumbrera +{(geometria.altura + (geometria.ancho/2)*(geometria.pendiente/100)).toFixed(2)} m
                  </text>
                </g>
              )}

              {/* General Column height label */}
              <text x="130" y="245" fontSize="11" fill={strokeDim} fontWeight="bold">
                H Col = {geometria.altura.toFixed(2)} m
              </text>
            </g>
          )}

          {activeSheet === 'E03' && (
            <g id="sheet-e03-techos">
              <text x="50" y="55" fontSize="14" fill={textMain} fontWeight="bold" fontFamily="monospace">
                PLANTA DE DISTRIBUCIÓN DE CORREAS Y COBERTURA (ESC: 1:75)
              </text>

              {/* Roof boundary */}
              <rect x="150" y="100" width="600" height="300" fill="none" stroke={strokeMain} strokeWidth="2.5" />

              {/* Purlin distribution lines */}
              {[130, 160, 190, 220, 280, 310, 340, 370].map((y, idx) => (
                <g key={`purlin-line-${idx}`}>
                  <line x1="150" y1={y} x2="750" y2={y} stroke={isDark ? '#34d399' : '#059669'} strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="135" y={y + 3} fontSize="8" fill={textMain} textAnchor="end">COR-{idx+1}</text>
                </g>
              ))}

              {/* Flow of water arrows based on slope type */}
              {geometria.tipoTecho === 'una_caida' ? (
                <g id="arrow-1caida">
                  <line x1="450" y1="320" x2="450" y2="180" stroke={strokeDim} strokeWidth="2.5" markerEnd="url(#arrow)" />
                  <text x="465" y="255" fontSize="11" fill={strokeDim} fontWeight="bold">Caída de agua (Monocapa)</text>
                </g>
              ) : geometria.tipoTecho === 'plano' ? (
                <g id="arrow-plano">
                  <text x="450" y="255" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">Nivel de Pendiente Mínimo (Techo Plano)</text>
                </g>
              ) : geometria.tipoTecho === 'arco' ? (
                <g id="arrow-arco">
                  {/* Arc peak line */}
                  <line x1="150" y1="250" x2="750" y2="250" stroke={strokeDim} strokeWidth="2" strokeDasharray="6 3" />
                  <text x="450" y="245" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">EJE DE CLAVE (CÚPULA)</text>

                  <line x1="450" y1="210" x2="450" y2="130" stroke={strokeDim} strokeWidth="2" markerEnd="url(#arrow)" />
                  <text x="460" y="170" fontSize="10" fill={strokeDim} fontWeight="bold">Caída Curva</text>
                  <line x1="450" y1="290" x2="450" y2="370" stroke={strokeDim} strokeWidth="2" markerEnd="url(#arrow)" />
                  <text x="460" y="330" fontSize="10" fill={strokeDim} fontWeight="bold">Caída Curva</text>
                </g>
              ) : (
                <g id="arrow-2caidas">
                  {/* Ridge line */}
                  <line x1="150" y1="250" x2="750" y2="250" stroke={strokeDim} strokeWidth="2" strokeDasharray="6 3" />
                  <text x="450" y="245" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">EJE DE CUMBRERA</text>

                  <line x1="450" y1="210" x2="450" y2="130" stroke={strokeDim} strokeWidth="2" markerEnd="url(#arrow)" />
                  <text x="460" y="170" fontSize="10" fill={strokeDim} fontWeight="bold">Caída de agua</text>
                  <line x1="450" y1="290" x2="450" y2="370" stroke={strokeDim} strokeWidth="2" markerEnd="url(#arrow)" />
                  <text x="460" y="330" fontSize="10" fill={strokeDim} fontWeight="bold">Caída de agua</text>
                </g>
              )}
            </g>
          )}

          {activeSheet === 'E04' && (
            <g id="sheet-e04-placa">
              <text x="50" y="55" fontSize="14" fill={textMain} fontWeight="bold" fontFamily="monospace">
                DETALLE TÍPICO DE PLACA BASE Y PERNOS DE ANCLAJE (ESC: 1:10)
              </text>

              {/* Concrete Pedestal 400x400 */}
              <rect x="280" y="110" width="340" height="340" fill="none" stroke={strokeDim} strokeWidth="2" strokeDasharray="5 3" />
              <text x="450" y="100" fontSize="11" fill={strokeDim} fontWeight="bold" textAnchor="middle">
                Pedestal de Concreto f'c=210 kg/cm² (400 x 400 mm)
              </text>

              {/* Steel Base Plate 300x300x12mm */}
              <rect x="325" y="155" width="250" height="250" fill={isDark ? '#1e293b' : '#f8fafc'} stroke={strokeMain} strokeWidth="3" rx="4" />

              {/* Column Core */}
              <rect x="400" y="230" width="100" height="100" fill={strokeMain} rx="2" />
              <text x="450" y="285" fontSize="12" fill={bgColor} fontWeight="bold" textAnchor="middle">
                COLUMNA
              </text>

              {/* 4 Anchor Bolts 5/8" */}
              {[[355, 185], [545, 185], [355, 375], [545, 375]].map(([bx, by], idx) => (
                <g key={`bolt-${idx}`}>
                  <circle cx={bx} cy={by} r="12" fill="none" stroke={strokeDim} strokeWidth="2" />
                  <circle cx={bx} cy={by} r="4" fill={strokeDim} />
                </g>
              ))}

              <text x="450" y="435" fontSize="11" fill={textMain} fontWeight="bold" textAnchor="middle">
                Placa Base: 300x300x12mm A36 con 4 Pernos de Anclaje de 5/8" L=400mm
              </text>
            </g>
          )}

          {/* ENGINEERING TITLE BLOCK (CAJETÍN) */}
          <g transform="translate(560, 480)" id="cajetin-plano">
            <rect x="0" y="0" width="335" height="75" fill={isDark ? '#020617' : '#ffffff'} stroke={strokeMain} strokeWidth="1.5" />
            <line x1="0" y1="25" x2="335" y2="25" stroke={strokeMain} strokeWidth="1" />
            <line x1="240" y1="0" x2="240" y2="75" stroke={strokeMain} strokeWidth="1" />
            <line x1="0" y1="50" x2="240" y2="50" stroke={strokeMain} strokeWidth="1" />

            <text x="10" y="17" fontSize="10" fill={textMain} fontWeight="bold">
              PROYECTO: {projectName || 'TECHO METÁLICO'}
            </text>
            <text x="10" y="40" fontSize="9" fill={textMain}>
              ESPECIALIDAD: INGENIERÍA ESTRUCTURAL
            </text>
            <text x="10" y="65" fontSize="8" fill={strokeDim}>
              DIMENSIONES: {geometria.largo}m x {geometria.ancho}m x {geometria.altura}m
            </text>

            <text x="287" y="20" fontSize="8" fill={textMain} textAnchor="middle">LÁMINA</text>
            <text x="287" y="52" fontSize="20" fill={strokeDim} fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {activeSheet}
            </text>
            <text x="287" y="68" fontSize="8" fill={textMain} textAnchor="middle">REV: 01</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
