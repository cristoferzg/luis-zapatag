// Lámina Técnica de Plano CAD Arquitectónico Imprimible para Herrería y Carpintería Metálica
import BotonImprimir from '../common/BotonImprimir';
import React, { useState, useRef } from 'react';
import { 
  Download, 
  Compass, 
  Check
} from 'lucide-react';
import { HerreriaDesign, DespieceResult, BarraOptimizada } from './herreriaTypes';
import { PERFILES_CATALOGO } from './herreriaCatalog';
import { generarDespiece, optimizarCortes } from './herreriaCalculations';

interface HerreriaPlanoCadViewProps {
  design: HerreriaDesign;
  onUpdateDesign?: (updated: HerreriaDesign) => void;
  currentSettings?: any;
}

export type EstiloPlano = 'blueprint' | 'cad_dark' | 'impresion_blanco';

export const HerreriaPlanoCadView: React.FC<HerreriaPlanoCadViewProps> = ({
  design,
  currentSettings
}) => {
  const [estilo, setEstilo] = useState<EstiloPlano>('impresion_blanco');
  const [mostrarCotas, setMostrarCotas] = useState<boolean>(true);
  const [mostrarMarcasCorte, setMostrarMarcasCorte] = useState<boolean>(true);
  const [mostrarSimbologiaSoldadura, setMostrarSimbologiaSoldadura] = useState<boolean>(true);
  const escala = '1:20';
  const [copiado, setCopiado] = useState(false);
  const [collapsedHeader, setCollapsedHeader] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Cálculos de despiece y barras
  const despiece: DespieceResult = generarDespiece(design);
  const barras6m: BarraOptimizada[] = optimizarCortes(despiece.piezas, 6);
  const perfilMarco = PERFILES_CATALOGO.find(p => p.id === design.perfilMarcoId) || PERFILES_CATALOGO[1];


  // Métricas de material y retazos
  const totalBarrasComerciales = barras6m.length;
  const metrosUtiles = despiece.longitudTotalPerfilesM;
  const metrosComprados = totalBarrasComerciales * 6;
  const metrosRetazo = Math.max(0, metrosComprados - metrosUtiles);
  const retazosReutilizables = barras6m.filter(b => b.sobranteMm >= 500).length;

  // Exportar SVG como archivo
  const handleExportSVG = () => {
    const svgElement = document.getElementById('plano-arquitectonico-svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PLANO_CAD_${design.nombre.toUpperCase().replace(/\s+/g, '_')}_INNOVA.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Esquemas de colores según el estilo seleccionado
  const themeColors = {
    blueprint: {
      bgPage: '#0f2744',
      bgPlano: '#0c1e33',
      gridLines: '#1d3e68',
      cadStroke: '#60a5fa',
      cadFill: '#132e4f',
      metalFill: '#1d4ed8',
      textPrimary: '#93c5fd',
      textSecondary: '#60a5fa',
      cotaLine: '#38bdf8',
      cotaText: '#7dd3fc',
      bordeHoja: '#3b82f6',
      acento: '#38bdf8',
      soldaduraColor: '#f59e0b'
    },
    cad_dark: {
      bgPage: '#090d16',
      bgPlano: '#000000',
      gridLines: '#1e293b',
      cadStroke: '#38bdf8',
      cadFill: '#0f172a',
      metalFill: '#1e293b',
      textPrimary: '#e2e8f0',
      textSecondary: '#94a3b8',
      cotaLine: '#22c55e',
      cotaText: '#4ade80',
      bordeHoja: '#334155',
      acento: '#38bdf8',
      soldaduraColor: '#ef4444'
    },
    impresion_blanco: {
      bgPage: '#f1f5f9',
      bgPlano: '#ffffff',
      gridLines: '#e2e8f0',
      cadStroke: '#0f172a',
      cadFill: '#f8fafc',
      metalFill: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      cotaLine: '#dc2626',
      cotaText: '#b91c1c',
      bordeHoja: '#000000',
      acento: '#0f172a',
      soldaduraColor: '#b45309'
    }
  };

  const tc = themeColors[estilo];

  // Geometría del dibujo en Lámina Técnica
  // Tamaño estándar de la lámina técnica virtual: 1200 x 880 px
  const laminaW = 1200;
  const laminaH = 880;

  // Área útil de dibujo dentro del marco de la lámina
  const drawAreaX = 50;
  const drawAreaY = 60;
  const drawAreaW = 760; // Deja 380px a la derecha para cuadro de despiece y especificaciones
  const drawAreaH = 670; // Deja 120px abajo para membrete y notas

  // Escalar diseño al área de dibujo
  const paddingDrawing = 75;
  const altoEfectivo = design.arco?.activo ? design.altoM + (design.arco.flechaM || 0.4) : design.altoM;
  const scaleX = (drawAreaW - 2 * paddingDrawing) / Math.max(0.5, design.anchoM);
  const scaleY = (drawAreaH - 2 * paddingDrawing) / Math.max(0.5, altoEfectivo);
  const scale = Math.min(scaleX, scaleY);

  const anchoSvg = design.anchoM * scale;
  const altoSvg = design.altoM * scale;
  const xOrigin = drawAreaX + (drawAreaW - anchoSvg) / 2;
  const yOrigin = drawAreaY + drawAreaH - 30; // base inferior

  const bastidorThick = Math.max(4, 25 / 1000 * scale);



  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto select-none font-sans">
      {/* 1. BARRA SUPERIOR DE HERRAMIENTAS DEL PLANO ARQUITECTÓNICO (COLAPSABLE Y COMPACTA) */}
      <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden z-20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
              PLANO CAD ARQUITECTÓNICO
            </h2>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
              CM-01
            </span>
          </div>
          <button
            onClick={() => setCollapsedHeader(!collapsedHeader)}
            className="ml-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition-colors"
          >
            {collapsedHeader ? '▼ Expandir Barra' : '▲ Ocultar Barra'}
          </button>
        </div>

        {/* Acciones y Estilos (Se Ocultan si collapsedHeader === true) */}
        {!collapsedHeader && (
          <div className="flex items-center flex-wrap gap-2">
            {/* Selector de Estilo */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setEstilo('blueprint')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  estilo === 'blueprint' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Blueprint
              </button>
              <button
                onClick={() => setEstilo('cad_dark')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  estilo === 'cad_dark' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                AutoCAD Dark
              </button>
              <button
                onClick={() => setEstilo('impresion_blanco')}
                className={`px-2 py-1 rounded-lg font-semibold transition-all ${
                  estilo === 'impresion_blanco' ? 'bg-white text-slate-900 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Impresión Plotter
              </button>
            </div>

            {/* Toggle de Cotas */}
            <button
              onClick={() => setMostrarCotas(!mostrarCotas)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                mostrarCotas 
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {mostrarCotas ? '✓ Cotas On' : 'Cotas Off'}
            </button>

            {/* Toggle de Marcas */}
            <button
              onClick={() => setMostrarMarcasCorte(!mostrarMarcasCorte)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                mostrarMarcasCorte 
                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {mostrarMarcasCorte ? '✓ Marcas (T-01)' : 'Marcas Off'}
            </button>

            {/* Toggle de Soldadura */}
            <button
              onClick={() => setMostrarSimbologiaSoldadura(!mostrarSimbologiaSoldadura)}
              className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                mostrarSimbologiaSoldadura 
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/50' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {mostrarSimbologiaSoldadura ? '✓ AWS' : 'AWS Off'}
            </button>

            {/* Botón [ EXPORTAR SVG ] */}
            <button
              onClick={handleExportSVG}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 active:scale-95"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Descargado' : 'SVG'}</span>
            </button>

            {/* Botón [ IMPRIMIR PLANO ] */}
            <BotonImprimir objetivo={() => document.getElementById('plano-arquitectonico-svg')?.parentElement || null} titulo="Plano de herrería" etiqueta="IMPRIMIR / PDF" orientacion="landscape" unaHoja
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 active:scale-95 transition-all cursor-pointer" />
          </div>
        )}
      </div>

      {/* 2. ÁREA DE VISUALIZACIÓN DE LA LÁMINA TÉCNICA */}
      <div 
        ref={printAreaRef}
        className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center justify-start print:p-0 print:m-0"
        style={{ backgroundColor: tc.bgPage }}
      >
        <div 
          className="w-full max-w-6xl my-auto shadow-2xl rounded-sm overflow-hidden shrink-0 print:w-full print:max-w-none print:shadow-none print:rounded-none"
          style={{ backgroundColor: tc.bgPlano }}
        >
          <svg
            id="plano-arquitectonico-svg"
            viewBox={`0 0 ${laminaW} ${laminaH}`}
            className="w-full h-auto block"
            style={{ backgroundColor: tc.bgPlano }}
          >
            {/* DEFINICIONES Y PATRONES CAD */}
            <defs>
              {/* Cuadrícula milimétrica de fondo */}
              <pattern id="cad-grid-major" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke={tc.gridLines} strokeWidth="0.8" strokeOpacity="0.6" />
                <path d="M 25 0 L 25 50 M 0 25 L 50 25" fill="none" stroke={tc.gridLines} strokeWidth="0.4" strokeOpacity="0.3" />
              </pattern>

              {/* Símbolo de Flechas de Cota */}
              <marker id="cota-arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 10 2 L 2 5 L 10 8 z" fill={tc.cotaLine} />
              </marker>
              <marker id="cota-arrow-end" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 2 L 8 5 L 0 8 z" fill={tc.cotaLine} />
              </marker>

              {/* Símbolo de soldadura */}
              <marker id="weld-dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4">
                <circle cx="5" cy="5" r="4" fill={tc.soldaduraColor} />
              </marker>
            </defs>

            {/* FONDO CUADRICULADO TÉCNICO */}
            <rect width="100%" height="100%" fill={tc.bgPlano} />
            <rect width="100%" height="100%" fill="url(#cad-grid-major)" />

            {/* MARGEN Y RECUADRO NORMALIZADO DE LA LÁMINA */}
            <rect
              x="20"
              y="20"
              width={laminaW - 40}
              height={laminaH - 40}
              fill="none"
              stroke={tc.bordeHoja}
              strokeWidth="2.5"
            />
            {/* Margen fino interior */}
            <rect
              x="24"
              y="24"
              width={laminaW - 48}
              height={laminaH - 48}
              fill="none"
              stroke={tc.bordeHoja}
              strokeWidth="0.8"
            />

            {/* ========================================================
                ZONA A: DIBUJO ELEVACIÓN PRINCIPAL (ESCALA 1:20)
            ======================================================== */}
            <g id="capa-elevacion-principal">
              {/* Título de la Elevación */}
              <text
                x={drawAreaX + 15}
                y={drawAreaY + 25}
                fill={tc.textPrimary}
                fontSize="14"
                fontWeight="900"
                fontFamily="monospace"
                letterSpacing="1.5"
              >
                ELEVACIÓN FRONTAL TÉCNICA (ESC. {escala})
              </text>
              <line
                x1={drawAreaX + 15}
                y1={drawAreaY + 32}
                x2={drawAreaX + 380}
                y2={drawAreaY + 32}
                stroke={tc.cadStroke}
                strokeWidth="1.5"
              />

              {/* LÍNEA DE TIERRA / N.P.T. ±0.00 */}
              <line
                x1={xOrigin - 50}
                y1={yOrigin}
                x2={xOrigin + anchoSvg + 50}
                y2={yOrigin}
                stroke={tc.cadStroke}
                strokeWidth="2"
                strokeDasharray="8,4"
              />
              <text
                x={xOrigin - 45}
                y={yOrigin + 18}
                fill={tc.textSecondary}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                N.P.T. ±0.00 (PISO TERMINADO)
              </text>

              {/* Modelo básico predeterminado eliminado: se muestran exclusivamente los dibujos libres del usuario */}

              {/* 4. TUBOS PERSONALIZADOS (Añadidos libremente) */}
              {design.tubosPersonalizados && design.tubosPersonalizados.map((tubo, tIdx) => {
                const tx1 = xOrigin + tubo.x1 * scale;
                const ty1 = yOrigin - tubo.y1 * scale;
                const tx2 = xOrigin + tubo.x2 * scale;
                const ty2 = yOrigin - tubo.y2 * scale;

                return (
                  <g key={tubo.id || tIdx} id={`tubo-cad-${tubo.id}`}>
                    <line
                      x1={tx1}
                      y1={ty1}
                      x2={tx2}
                      y2={ty2}
                      stroke={tubo.colorHex || tc.cadStroke}
                      strokeWidth={bastidorThick}
                      strokeLinecap="round"
                    />
                    {mostrarMarcasCorte && (
                      <text
                        x={(tx1 + tx2) / 2}
                        y={(ty1 + ty2) / 2 - 4}
                        fill={tc.acento}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {tubo.marca || `TP-${tIdx + 1}`} ({(tubo.longitudM * 1000).toFixed(0)}mm)
                      </text>
                    )}
                  </g>
                );
              })}

              {/* PIEZAS CAD LIBRES (Única Fuente de Verdad) */}
              {design.piezas && design.piezas.map((pz) => {
                const p1X = xOrigin + pz.x1 * scale;
                const p1Y = yOrigin - pz.y1 * scale;
                const p2X = xOrigin + pz.x2 * scale;
                const p2Y = yOrigin - pz.y2 * scale;

                if (pz.esPlancha && (pz.anchoPlanchaM || pz.esPlancha)) {
                  const rawDx = Math.abs(p2X - p1X);
                  const rawDy = Math.abs(p2Y - p1Y);
                  const isEdgeOnH = rawDy < 6;
                  const isEdgeOnV = rawDx < 6;
                  const isMachihembrada = pz.subtipoPlancha === 'machihembrada';
                  const isAcanalada = pz.subtipoPlancha === 'acanalada' || pz.subtipoPlancha === 'corrugada' || (pz.tipoRelleno as string) === 'plancha_acanalada';
                  const isEstriada = pz.subtipoPlancha === 'estriada' || pz.tipoRelleno === 'plancha_estriada';
                  const isPerforada = pz.subtipoPlancha === 'perforada' || pz.tipoRelleno === 'plancha_perforada';
                  const isMalla = pz.tipoRelleno === 'malla';
                  const isVidrio = pz.tipoRelleno === 'vidrio';
                  const espMm = pz.espesorPlanchaMm || 2.5;

                  if (isEdgeOnH || isEdgeOnV) {
                    const plateCadStroke = Math.max(2.5, (espMm / 1000) * scale * 1.5);
                    return (
                      <g key={pz.id}>
                        <line
                          x1={p1X}
                          y1={p1Y}
                          x2={p2X}
                          y2={p2Y}
                          stroke={tc.cadStroke}
                          strokeWidth={plateCadStroke}
                          strokeLinecap="butt"
                        />
                      </g>
                    );
                  }

                  const rectX = Math.min(p1X, p2X);
                  const rectY = Math.min(p1Y, p2Y);
                  const rectW = Math.max(10, rawDx);
                  const rectH = Math.max(10, rawDy);
                  const showCadLabel = rectW >= 70 && rectH >= 35;

                  return (
                    <g key={pz.id}>
                      <defs>
                        {/* Textura Machihembrada en Plano CAD */}
                        <pattern id={`cad-machihembrada-${pz.id}`} width="24" height="20" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="20" stroke={tc.cadStroke} strokeWidth="1.5" />
                          <line x1="2" y1="0" x2="2" y2="20" stroke={tc.cadStroke} strokeWidth="0.6" strokeDasharray="2,2" />
                          <line x1="12" y1="0" x2="12" y2="20" stroke={tc.cadStroke} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="3,3" />
                        </pattern>
                        {/* Textura Acanalada Corrugada en Plano CAD */}
                        <pattern id={`cad-acanalada-${pz.id}`} width="14" height="20" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="20" stroke={tc.cadStroke} strokeWidth="1.2" />
                          <line x1="7" y1="0" x2="7" y2="20" stroke={tc.cadStroke} strokeWidth="0.8" strokeOpacity="0.6" />
                        </pattern>
                        {/* Textura Estriada en Plano CAD */}
                        <pattern id={`cad-estriada-${pz.id}`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="16" stroke={tc.cadStroke} strokeWidth="1" strokeOpacity="0.4" />
                          <line x1="0" y1="0" x2="16" y2="0" stroke={tc.cadStroke} strokeWidth="1" strokeOpacity="0.4" />
                        </pattern>
                        {/* Textura Perforada */}
                        <pattern id={`cad-dots-${pz.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                          <circle cx="5" cy="5" r="1.5" fill={tc.cadStroke} fillOpacity="0.5" />
                        </pattern>
                        {/* Textura Malla */}
                        <pattern id={`cad-mesh-${pz.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                          <path d="M 8 0 L 0 0 0 8" fill="none" stroke={tc.cadStroke} strokeWidth="0.8" strokeOpacity="0.4" />
                        </pattern>
                      </defs>
                      <rect
                        x={rectX}
                        y={rectY}
                        width={rectW}
                        height={rectH}
                        fill={
                          isMachihembrada ? `url(#cad-machihembrada-${pz.id})` :
                          (isAcanalada ? `url(#cad-acanalada-${pz.id})` :
                          (isEstriada ? `url(#cad-estriada-${pz.id})` :
                          (isPerforada ? `url(#cad-dots-${pz.id})` :
                          (isMalla ? `url(#cad-mesh-${pz.id})` :
                          (isVidrio ? 'none' : tc.cadFill)))))
                        }
                        stroke={tc.cadStroke}
                        strokeWidth="1.5"
                      />
                      {/* Pernos en esquinas sólo si conPernos === true */}
                      {pz.conPernos === true && rectW > 25 && rectH > 25 && (
                        <>
                          <circle cx={rectX + 6} cy={rectY + 6} r="2.5" fill={tc.cadStroke} stroke={tc.bgPlano} strokeWidth="0.8" />
                          <circle cx={rectX + rectW - 6} cy={rectY + 6} r="2.5" fill={tc.cadStroke} stroke={tc.bgPlano} strokeWidth="0.8" />
                          <circle cx={rectX + 6} cy={rectY + rectH - 6} r="2.5" fill={tc.cadStroke} stroke={tc.bgPlano} strokeWidth="0.8" />
                          <circle cx={rectX + rectW - 6} cy={rectY + rectH - 6} r="2.5" fill={tc.cadStroke} stroke={tc.bgPlano} strokeWidth="0.8" />
                        </>
                      )}
                      {showCadLabel && (
                        <text
                          x={rectX + rectW / 2}
                          y={rectY + rectH / 2}
                          fill={tc.textPrimary}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {pz.marca}: {isMachihembrada ? 'PLANCHA MACHIHEMBRADA' : (isAcanalada ? 'PLANCHA ACANALADA' : (isEstriada ? 'PLANCHA ESTRIADA / ESTRELLADA' : (isPerforada ? 'PLANCHA PERFORADA' : (isMalla ? 'MALLA METÁLICA' : (isVidrio ? 'VIDRIO TEMPLADO' : pz.nombre)))))}
                        </text>
                      )}
                    </g>
                  );
                }

                if (pz.esCurvo) {
                  const midX = xOrigin + ((pz.x1 + pz.x2) / 2) * scale;
                  const midY = yOrigin - (Math.max(pz.y1, pz.y2) + (pz.flechaM || 0.35)) * scale;
                  const pathD = `M ${p1X} ${p1Y} Q ${midX} ${midY} ${p2X} ${p2Y}`;
                  return (
                    <g key={pz.id}>
                      <path d={pathD} fill="none" stroke={tc.cadStroke} strokeWidth="2.5" />
                      <text x={(p1X + p2X) / 2} y={(p1Y + p2Y) / 2 - 6} fill={tc.acento} fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                        {pz.marca} ({pz.longitudM}m)
                      </text>
                    </g>
                  );
                }

                return (
                  <g key={pz.id}>
                    <line
                      x1={p1X}
                      y1={p1Y}
                      x2={p2X}
                      y2={p2Y}
                      stroke={tc.cadStroke}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    {mostrarMarcasCorte && (
                      <text
                        x={(p1X + p2X) / 2}
                        y={(p1Y + p2Y) / 2 - 5}
                        fill={tc.acento}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {pz.marca} [{pz.corteInicio || '90°'}/{pz.corteFin || '90°'}]
                      </text>
                    )}
                  </g>
                );
              })}

              {/* ACCESORIOS CAD */}
              {design.accesoriosCad && design.accesoriosCad.map((acc) => {
                const accX = xOrigin + acc.x * scale;
                const accY = yOrigin - acc.y * scale;
                return (
                  <g key={acc.id}>
                    <rect
                      x={accX - 7}
                      y={accY - 7}
                      width="14"
                      height="14"
                      fill={tc.soldaduraColor}
                      stroke={tc.cadStroke}
                      strokeWidth="1"
                      rx="2"
                    />
                    <text x={accX} y={accY - 10} fill={tc.soldaduraColor} fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      {acc.nombre}
                    </text>
                  </g>
                );
              })}

              {/* 5. CERROJOS ADICIONALES (Modificables libremente) */}
              {design.cerrojosList && design.cerrojosList.map((cerrojo, cIdx) => {
                const yCerrojo = yOrigin - cerrojo.posicionYM * scale;
                const xCerrojo = cerrojo.lado === 'izquierda' ? xOrigin + 10 : xOrigin + anchoSvg - 25;

                return (
                  <g key={cerrojo.id || cIdx}>
                    <rect
                      x={xCerrojo}
                      y={yCerrojo - 4}
                      width="18"
                      height="8"
                      fill={tc.soldaduraColor}
                      stroke={tc.cadStroke}
                      strokeWidth="1"
                    />
                    <text
                      x={xCerrojo + 22}
                      y={yCerrojo + 2}
                      fill={tc.soldaduraColor}
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {cerrojo.modelo} ({cerrojo.longitudCm}cm)
                    </text>
                  </g>
                );
              })}

              {/* ========================================================
                  COTAS NORMALIZADAS (ANCHO, ALTO Y PARCIALES)
              ======================================================== */}
              {mostrarCotas && (
                <g id="cotas-arquitectonicas">
                  {/* COTA DE ANCHO TOTAL (SUPERIOR) */}
                  <g>
                    <line
                      x1={xOrigin}
                      y1={drawAreaY + 45}
                      x2={xOrigin + anchoSvg}
                      y2={drawAreaY + 45}
                      stroke={tc.cotaLine}
                      strokeWidth="1.2"
                      markerStart="url(#cota-arrow-start)"
                      markerEnd="url(#cota-arrow-end)"
                    />
                    <line x1={xOrigin} y1={drawAreaY + 38} x2={xOrigin} y2={yOrigin - altoSvg} stroke={tc.cotaLine} strokeWidth="0.8" strokeDasharray="3,3" />
                    <line x1={xOrigin + anchoSvg} y1={drawAreaY + 38} x2={xOrigin + anchoSvg} y2={yOrigin - altoSvg} stroke={tc.cotaLine} strokeWidth="0.8" strokeDasharray="3,3" />
                    <rect
                      x={xOrigin + anchoSvg / 2 - 50}
                      y={drawAreaY + 33}
                      width="100"
                      height="20"
                      fill={tc.bgPlano}
                      stroke={tc.cotaLine}
                      strokeWidth="0.8"
                    />
                    <text
                      x={xOrigin + anchoSvg / 2}
                      y={drawAreaY + 47}
                      fill={tc.cotaText}
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      L = {design.anchoM.toFixed(2)} m
                    </text>
                  </g>

                  {/* COTA DE ALTO TOTAL (LATERAL IZQUIERDA) */}
                  <g>
                    <line
                      x1={drawAreaX + 25}
                      y1={yOrigin - altoSvg}
                      x2={drawAreaX + 25}
                      y2={yOrigin}
                      stroke={tc.cotaLine}
                      strokeWidth="1.2"
                      markerStart="url(#cota-arrow-start)"
                      markerEnd="url(#cota-arrow-end)"
                    />
                    <line x1={drawAreaX + 20} y1={yOrigin - altoSvg} x2={xOrigin} y2={yOrigin - altoSvg} stroke={tc.cotaLine} strokeWidth="0.8" strokeDasharray="3,3" />
                    <line x1={drawAreaX + 20} y1={yOrigin} x2={xOrigin} y2={yOrigin} stroke={tc.cotaLine} strokeWidth="0.8" strokeDasharray="3,3" />
                    <rect
                      x={drawAreaX + 8}
                      y={yOrigin - altoSvg / 2 - 12}
                      width="35"
                      height="24"
                      fill={tc.bgPlano}
                      stroke={tc.cotaLine}
                      strokeWidth="0.8"
                    />
                    <text
                      x={drawAreaX + 25}
                      y={yOrigin - altoSvg / 2 + 4}
                      fill={tc.cotaText}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {design.altoM.toFixed(2)}m
                    </text>
                  </g>
                </g>
              )}
            </g>

            {/* ========================================================
                ZONA B: CUADRO DE DESPIECE, PERFILES Y ESPECIFICACIONES
                (Columna lateral derecha de la lámina técnica)
            ======================================================== */}
            <g id="capa-cuadro-perfiles" transform={`translate(${laminaW - 390}, 50)`}>
              {/* Marco del cuadro de especificaciones */}
              <rect
                x="0"
                y="0"
                width="360"
                height="650"
                fill={tc.cadFill}
                stroke={tc.bordeHoja}
                strokeWidth="1.5"
              />

              {/* Encabezado del Cuadro */}
              <rect x="0" y="0" width="360" height="30" fill={tc.metalFill} />
              <text x="15" y="20" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace" letterSpacing="1">
                CUADRO DE PERFILERÍA Y CORTES
              </text>

              {/* Métricas de Barras de 6m y Retazos */}
              <g transform="translate(15, 45)">
                <rect x="0" y="0" width="330" height="75" fill={tc.bgPlano} stroke={tc.cadStroke} strokeWidth="1" rx="4" />
                <text x="12" y="20" fill={tc.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">
                  RESUMEN DE BARRAS COMERCIALES (6.00m)
                </text>
                <text x="12" y="40" fill={tc.textSecondary} fontSize="10" fontFamily="monospace">
                  • Barras Compradas: <tspan fill={tc.acento} fontWeight="bold">{totalBarrasComerciales} und (6m)</tspan>
                </text>
                <text x="12" y="55" fill={tc.textSecondary} fontSize="10" fontFamily="monospace">
                  • Metros Útiles: <tspan fill="#22c55e" fontWeight="bold">{metrosUtiles.toFixed(2)}m</tspan> | Retazo: <tspan fill="#f59e0b" fontWeight="bold">{metrosRetazo.toFixed(2)}m</tspan>
                </text>
                <text x="12" y="68" fill={tc.textSecondary} fontSize="10" fontFamily="monospace">
                  • Retazos Reutilizables (&gt;0.5m): <tspan fill={tc.textPrimary} fontWeight="bold">{retazosReutilizables} cortes</tspan>
                </text>
              </g>

              {/* Tabla de Piezas / Despiece Técnico */}
              <g transform="translate(15, 135)">
                <text x="0" y="-5" fill={tc.textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  DETALLE DE CORTE (LISTA DE PIEZAS)
                </text>
                {/* Cabecera tabla */}
                <rect x="0" y="5" width="330" height="20" fill={tc.gridLines} />
                <text x="5" y="19" fill={tc.textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">MARCA</text>
                <text x="50" y="19" fill={tc.textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">DESCRIPCIÓN</text>
                <text x="180" y="19" fill={tc.textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">LONG (mm)</text>
                <text x="250" y="19" fill={tc.textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">CANT</text>
                <text x="290" y="19" fill={tc.textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">CORTE</text>

                {/* Filas de piezas (primeras 12 piezas para entrar en la lámina) */}
                {despiece.piezas.slice(0, 11).map((pieza, pIdx) => {
                  const yRow = 30 + pIdx * 20;
                  return (
                    <g key={pIdx}>
                      <rect x="0" y={yRow - 5} width="330" height="18" fill={pIdx % 2 === 0 ? 'none' : tc.bgPlano} />
                      <text x="5" y={yRow + 8} fill={tc.acento} fontSize="9" fontWeight="bold" fontFamily="monospace">{pieza.marca}</text>
                      <text x="50" y={yRow + 8} fill={tc.textSecondary} fontSize="8" fontFamily="monospace" width="120">{pieza.descripcion.substring(0, 22)}</text>
                      <text x="180" y={yRow + 8} fill={tc.textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">{pieza.longitudMm}</text>
                      <text x="255" y={yRow + 8} fill={tc.textPrimary} fontSize="9" fontWeight="bold" fontFamily="monospace">{pieza.cantidad}</text>
                      <text x="290" y={yRow + 8} fill={tc.soldaduraColor} fontSize="8" fontFamily="monospace">{pieza.corteInicio}°/{pieza.corteFin}°</text>
                    </g>
                  );
                })}
              </g>

              {/* Especificaciones Técnicas de Taller Metalmecánico */}
              <g transform="translate(15, 410)">
                <rect x="0" y="0" width="330" height="150" fill={tc.bgPlano} stroke={tc.cadStroke} strokeWidth="1" rx="4" />
                <rect x="0" y="0" width="330" height="22" fill={tc.gridLines} />
                <text x="10" y="15" fill={tc.textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  NOTAS TÉCNICAS Y SOLDADURA (AWS D1.1)
                </text>
                <text x="10" y="38" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">
                  1. Perfilería tubular según Norma ASTM A500 Grado B.
                </text>
                <text x="10" y="53" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">
                  2. Soldadura SMAW con electrodo E6011 raíz + E7018 remate.
                </text>
                <text x="10" y="68" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">
                  3. Esmerilado de cordones al ras en caras vistas y batientes.
                </text>
                <text x="10" y="83" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">
                  4. Desengrase químico y limpieza mecánica previa SSPC-SP3.
                </text>
                <text x="10" y="98" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">
                  5. Base: 2 manos de anticorrosivo epóxico zinc-cromato (2 mils).
                </text>
                <text x="10" y="113" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">
                  6. Acabado: {design.acabado.tipoPintura.toUpperCase()} ({design.acabado.colorNombre}).
                </text>
                <text x="10" y="128" fill={tc.soldaduraColor} fontSize="9" fontFamily="monospace" fontWeight="bold">
                  7. Cerrajería: {design.chapaConfig?.modelo || 'Forte 3 Golpes'} + {design.bisagrasConfig?.cantidad || 3} Bisagras.
                </text>
              </g>
            </g>

            {/* ========================================================
                ZONA C: MEMBRETE ARQUITECTÓNICO NORMALIZADO
                (Borde inferior derecho de la lámina)
            ======================================================== */}
            <g id="capa-membrete-arquitectonico" transform={`translate(20, ${laminaH - 120})`}>
              <rect
                x="0"
                y="0"
                width={laminaW - 40}
                height="100"
                fill={tc.cadFill}
                stroke={tc.bordeHoja}
                strokeWidth="1.8"
              />

              {/* División 1: Logo y Razón Social de Innova Contratistas */}
              <g transform="translate(15, 15)">
                <text x="0" y="22" fill={tc.textPrimary} fontSize="18" fontWeight="900" fontFamily="monospace" letterSpacing="1">
                  {(currentSettings?.appName || 'INNOVA CONTRATISTAS').toUpperCase()}
                </text>
                <text x="0" y="42" fill={tc.textSecondary} fontSize="10" fontFamily="monospace">
                  DIVISIÓN DE CARPINTERÍA METÁLICA Y HERRERÍA
                </text>
                <text x="0" y="60" fill={tc.acento} fontSize="9" fontFamily="monospace">
                  SISTEMA DE GESTIÓN Y PRODUCCIÓN INTEGRADA
                </text>
              </g>

              <line x1="340" y1="0" x2="340" y2="100" stroke={tc.bordeHoja} strokeWidth="1.2" />

              {/* División 2: Información del Proyecto */}
              <g transform="translate(360, 15)">
                <text x="0" y="16" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">PROYECTO:</text>
                <text x="75" y="16" fill={tc.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {design.nombre.toUpperCase()}
                </text>

                <text x="0" y="36" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">TIPO ELEMENTO:</text>
                <text x="110" y="36" fill={tc.textPrimary} fontSize="10" fontWeight="bold" fontFamily="monospace">
                  {design.tipoElemento.toUpperCase()} • {design.anchoM.toFixed(2)}m × {design.altoM.toFixed(2)}m
                </text>

                <text x="0" y="56" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">PERFIL MARCO:</text>
                <text x="95" y="56" fill={tc.acento} fontSize="10" fontFamily="monospace">
                  {perfilMarco.nombre} ({perfilMarco.dimensiones})
                </text>

                <text x="0" y="74" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">FECHA:</text>
                <text x="50" y="74" fill={tc.textPrimary} fontSize="10" fontFamily="monospace">
                  {new Date().toLocaleDateString('es-PE')}
                </text>
              </g>

              <line x1="820" y1="0" x2="820" y2="100" stroke={tc.bordeHoja} strokeWidth="1.2" />

              {/* División 3: Escala, Aprobación y Código de Lámina */}
              <g transform="translate(840, 15)">
                <div className="flex">
                  <text x="0" y="20" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">ESCALA:</text>
                  <text x="60" y="20" fill={tc.textPrimary} fontSize="12" fontWeight="bold" fontFamily="monospace">{escala}</text>

                  <text x="140" y="20" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">UNIDADES:</text>
                  <text x="210" y="20" fill={tc.textPrimary} fontSize="11" fontWeight="bold" fontFamily="monospace">METROS / MM</text>
                </div>

                <text x="0" y="50" fill={tc.textSecondary} fontSize="9" fontFamily="monospace">PLANO N°:</text>
                <text x="75" y="55" fill={tc.soldaduraColor} fontSize="22" fontWeight="900" fontFamily="monospace">
                  CM-01
                </text>

                <text x="180" y="75" fill={tc.textSecondary} fontSize="8" fontFamily="monospace">
                  LÁMINA 01 DE 01
                </text>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
