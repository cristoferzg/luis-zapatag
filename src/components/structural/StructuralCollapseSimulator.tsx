import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Info, 
  Layers, 
  Ruler, 
  Scale, 
  ShieldCheck, 
  Sparkles, 
  X, 
  ArrowRight,
  TrendingUp,
  Sliders,
  Compass
} from 'lucide-react';
import { STEEL_PROFILES, getProfileById } from './structuralCatalog';
import { 
  ProfileDefinition, 
  StructuralGeometry, 
  StructureOptions, 
  CoberturaOptions, 
  ColumnElement, 
  BeamElement, 
  PurlinElement 
} from './structuralTypes';

export interface CollapseSimulatorProps {
  isOpen?: boolean;
  onClose: () => void;
  geometria: StructuralGeometry;
  estructura: StructureOptions;
  columnas?: ColumnElement[];
  vigas?: BeamElement[];
  correas?: PurlinElement[];
  cobertura?: CoberturaOptions;
  onApplyRecommendedProfile?: (type: 'correas' | 'vigas' | 'columnas' | 'tijerales', profileId: string) => void;
}

export const StructuralCollapseSimulator: React.FC<CollapseSimulatorProps> = ({
  isOpen = true,
  onClose,
  geometria,
  estructura,
  columnas = [],
  vigas = [],
  correas = [],
  onApplyRecommendedProfile
}) => {
  // Element type to simulate: 'correa' | 'viga' | 'columna' | 'tijeral'
  const [elementType, setElementType] = useState<'correa' | 'viga' | 'columna' | 'tijeral'>('correa');
  
  // Custom profile selection
  const [selectedProfileId, setSelectedProfileId] = useState<string>('tub-rec-50x25x1.2');
  
  // Span (Luz libre) in meters
  const [spanM, setSpanM] = useState<number>(geometria.separacionPorticos || 4.0);
  
  // Tributary spacing (Separación entre elementos) in meters
  const [spacingM, setSpacingM] = useState<number>(estructura.separacionCorreas || 1.0);
  
  // Live load (Sobrecarga de techo) in kg/m² (RNE E.020)
  const [liveLoadKgM2, setLiveLoadKgM2] = useState<number>(30);
  
  // Wind Speed in km/h (Costa 75 km/h, Sierra 90 km/h, Selva 100 km/h)
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(75);

  // Column height (for columns)
  const [colHeightM, setColHeightM] = useState<number>(geometria.alturaLadoAlto || geometria.altura || 3.5);

  // Truss depth (for trusses)
  const [trussDepthM, setTrussDepthM] = useState<number>(0.60);

  // Initialize from current project elements when opening or changing type
  React.useEffect(() => {
    if (!isOpen) return;

    if (elementType === 'correa') {
      const firstCorrea = correas[0];
      if (firstCorrea) setSelectedProfileId(firstCorrea.profileId);
      setSpanM(geometria.separacionPorticos || 4.0);
      setSpacingM(estructura.separacionCorreas || 1.0);
    } else if (elementType === 'viga' || elementType === 'tijeral') {
      const firstViga = vigas.find(v => 
        elementType === 'viga' ? v.type === 'principal' : (v.tipoTijeral || v.type.includes('tijeral'))
      ) || vigas[0];
      if (firstViga) setSelectedProfileId(firstViga.profileId);
      
      const bounds = geometria.ancho || 6.0;
      setSpanM(bounds);
      setSpacingM(geometria.separacionPorticos || 4.0);
      if (elementType === 'tijeral') setTrussDepthM(0.70);
    } else if (elementType === 'columna') {
      const firstCol = columnas[0];
      if (firstCol) {
        setSelectedProfileId(firstCol.profileId);
        setColHeightM(firstCol.altura || geometria.alturaLadoAlto || 3.5);
      }
      setSpanM(geometria.ancho || 6.0);
      setSpacingM(geometria.separacionPorticos || 4.0);
    }
  }, [isOpen, elementType, geometria, estructura, columnas, vigas, correas]);

  if (!isOpen) return null;

  const currentProfile = getProfileById(selectedProfileId);

  // 1. CALCULATE LOADS (LRFD / RNE E.020)
  const sheetWeightKgM2 = geometria.sistemaCobertura === 'panel_termoacustico' ? 9.5 : 4.5; // kg/m²
  const ownWeightKgM2 = (currentProfile.weightKgM / Math.max(0.5, spacingM)) + 1.5;
  const deadLoadD = sheetWeightKgM2 + ownWeightKgM2; // Carga muerta D (kg/m²)

  const qWind = 0.005 * Math.pow(windSpeedKmh, 2); // Presión dinámica de viento kg/m²
  const windLoadW = qWind * 0.75; // kg/m² sobre techo

  // Carga mayorada w_u (kg/m lineal sobre el elemento)
  // U = 1.2D + 1.6L + 0.5W
  const factoredPressureKgM2 = (1.2 * deadLoadD) + (1.6 * liveLoadKgM2) + (0.5 * windLoadW);
  const factoredLinearLoadWu = factoredPressureKgM2 * spacingM; // kg/m
  const serviceLinearLoadWs = (deadLoadD + liveLoadKgM2) * spacingM; // kg/m

  // 2. MOMENTO SOLICITANTE Mu & CAPACIDADES SEGÚN ELEMENTO
  const E = 2000000; // Modulo de elasticidad acero = 2,000,000 kg/cm²
  const Fy = currentProfile.type.includes('Tubo') ? 3150 : 2500; // kg/cm²
  const phiBending = 0.90;
  const phiComp = 0.85;

  let MuKgM = 0;
  let MuKgCm = 0;
  let phiMnKgCm = phiBending * Fy * Math.max(0.1, currentProfile.SxCm3);
  let phiMnKgM = phiMnKgCm / 100;
  let stressRatio = 0.1;
  let deltaCm = 0;
  let allowableDeflectionCm = 1;
  let deflectionRatio = 0.1;
  let slendernessLambda = 0;
  let axialCapacityKg = 0;
  let axialDemandPuKg = 0;

  if (elementType === 'correa') {
    // Correas: Flexión simple / bi-axial
    MuKgM = (factoredLinearLoadWu * Math.pow(spanM, 2)) / 8;
    MuKgCm = MuKgM * 100;
    stressRatio = phiMnKgCm > 0 ? (MuKgCm / phiMnKgCm) : 9.99;

    const w_s_cm = serviceLinearLoadWs / 100;
    const L_cm = spanM * 100;
    deltaCm = (5 * w_s_cm * Math.pow(L_cm, 4)) / (384 * E * Math.max(1, currentProfile.IxCm4));
    allowableDeflectionCm = L_cm / 200;
    deflectionRatio = deltaCm / allowableDeflectionCm;
  } else if (elementType === 'viga') {
    // Vigas: Flexión en eje mayor
    MuKgM = (factoredLinearLoadWu * Math.pow(spanM, 2)) / 8;
    MuKgCm = MuKgM * 100;
    stressRatio = phiMnKgCm > 0 ? (MuKgCm / phiMnKgCm) : 9.99;

    const w_s_cm = serviceLinearLoadWs / 100;
    const L_cm = spanM * 100;
    deltaCm = (5 * w_s_cm * Math.pow(L_cm, 4)) / (384 * E * Math.max(1, currentProfile.IxCm4));
    allowableDeflectionCm = L_cm / 250;
    deflectionRatio = deltaCm / allowableDeflectionCm;
  } else if (elementType === 'columna') {
    // Columnas: Pandeo por flexo-compresión (AISC 360 / RNE E.090)
    const tributaryAreaM2 = (spanM * spacingM) / 2;
    axialDemandPuKg = tributaryAreaM2 * factoredPressureKgM2;
    
    // Altura efectiva K * L (K = 1.5 para pórtico simple)
    const K = 1.5;
    const L_cm = colHeightM * 100;
    // Radio de giro r = sqrt(Ix / Area)
    const Ag = currentProfile.areaCm2 || (currentProfile.weightKgM / 0.785);
    const rx = Math.sqrt(Math.max(0.1, currentProfile.IxCm4) / Math.max(0.1, Ag));
    slendernessLambda = (K * L_cm) / Math.max(0.5, rx);

    // Tensión crítica de Euler / Pn
    const Fe = (Math.PI * Math.PI * E) / Math.pow(slendernessLambda, 2);
    let Fcr = 0;
    if (slendernessLambda <= 4.71 * Math.sqrt(E / Fy)) {
      Fcr = Math.pow(0.658, Fy / Fe) * Fy;
    } else {
      Fcr = 0.877 * Fe;
    }
    axialCapacityKg = phiComp * Fcr * Ag;

    // Carga de viento lateral sobre la columna (Momento flector)
    const qColWind = (windLoadW * spacingM * Math.pow(colHeightM, 2)) / 8; // kg·m
    MuKgM = qColWind;
    MuKgCm = MuKgM * 100;

    // P-M Interaction ratio
    const P_ratio = axialDemandPuKg / Math.max(1, axialCapacityKg);
    const M_ratio = MuKgCm / Math.max(1, phiMnKgCm);
    if (P_ratio >= 0.2) {
      stressRatio = P_ratio + (8 / 9) * M_ratio;
    } else {
      stressRatio = (P_ratio / 2) + M_ratio;
    }
    
    // Check if slenderness is absolutely critical
    if (slendernessLambda > 200) {
      stressRatio = Math.max(stressRatio, 1.15); // Forced failure due to code violation
    }

    // Corregido: Deflexión de columna en cantilever (un extremo fijo, otro libre con carga lateral)
    // Formula: δ = wL⁴ / 8EI
    const w_wind_cm = (qWind * spacingM) / 100;
    deltaCm = (w_wind_cm * Math.pow(colHeightM * 100, 4)) / (8 * E * Math.max(1, currentProfile.IxCm4));
    allowableDeflectionCm = (colHeightM * 100) / 180; // H/180 es común para viento en columnas
    deflectionRatio = deltaCm / Math.max(0.1, allowableDeflectionCm);
  } else {
    // Tijerales / Celosías
    MuKgM = (factoredLinearLoadWu * Math.pow(spanM, 2)) / 8;
    const depthM = Math.max(0.30, trussDepthM);
    // Fuerza axial en cordón superior (compresión) e inferior (tracción)
    const chordForceKg = MuKgM / depthM;
    axialDemandPuKg = chordForceKg;

    // Capacidad del cordón
    const panelLenCm = (spanM / 6) * 100; // ~0.8m - 1.2m entre montantes
    const Ag = currentProfile.areaCm2 || (currentProfile.weightKgM / 0.785);
    const rx = Math.sqrt(Math.max(0.1, currentProfile.IxCm4) / Math.max(0.1, Ag));
    const lambdaChord = panelLenCm / Math.max(0.5, rx);
    const Fe = (Math.PI * Math.PI * E) / Math.pow(lambdaChord, 2);
    const Fcr = lambdaChord <= 4.71 * Math.sqrt(E / Fy) ? Math.pow(0.658, Fy / Fe) * Fy : 0.877 * Fe;
    axialCapacityKg = phiComp * Fcr * Ag;

    stressRatio = chordForceKg / Math.max(1, axialCapacityKg);
    allowableDeflectionCm = (spanM * 100) / 350;
    deltaCm = (5 * (serviceLinearLoadWs / 100) * Math.pow(spanM * 100, 4)) / (384 * E * (2 * Ag * Math.pow((depthM * 100) / 2, 2)));
    deflectionRatio = deltaCm / allowableDeflectionCm;
  }

  // Diagnóstico
  // Unificamos criterios de colapso:
  // 1. Ratio de esfuerzo >= 1.0 (Falla por resistencia)
  // 2. Ratio de deflexión >= 1.5 (Falla por deformación excesiva / empozamiento)
  // 3. Esbeltez Lambda > 220 (Riesgo inminente de pandeo global en columnas)
  const isCollapse = (stressRatio >= 1.00 || deflectionRatio >= 1.50 || (elementType === 'columna' && slendernessLambda > 220)) && currentProfile !== null;
  const isWarning = !isCollapse && (stressRatio >= 0.85 || deflectionRatio >= 0.95 || (elementType === 'columna' && slendernessLambda > 180));
  const isSafe = !isCollapse && !isWarning;

  // Recommended Profile (Improved precision)
  const findRecommendedProfile = (): ProfileDefinition | null => {
    if (isSafe) return null;
    let candidates = STEEL_PROFILES;
    if (elementType === 'correa') {
      candidates = STEEL_PROFILES.filter(p => p.type === 'Perfil C (Costanera)' || p.type === 'Tubo Rectangular');
    } else if (elementType === 'viga') {
      candidates = STEEL_PROFILES.filter(p => p.type === 'IPE' || p.type === 'Tubo Rectangular' || p.type === 'W');
    } else if (elementType === 'columna') {
      candidates = STEEL_PROFILES.filter(p => (p.type === 'Tubo Cuadrado' || p.type === 'Tubo Rectangular') && p.widthMm >= 75);
    } else {
      candidates = STEEL_PROFILES.filter(p => p.type === 'Tubo Rectangular' || p.type === 'Tubo Cuadrado');
    }

    // Sort candidates by weight (ascending) to find the lightest safe profile
    const sortedCandidates = [...candidates].sort((a, b) => a.weightKgM - b.weightKgM);

    for (const cand of sortedCandidates) {
      // Don't recommend the same profile
      if (cand.id === selectedProfileId) continue;

      const candFy = cand.type.includes('Tubo') ? 3150 : 2500;
      const candPhiMnKgCm = phiBending * candFy * cand.SxCm3;
      const candAg = cand.areaCm2 || (cand.weightKgM / 0.785);
      const candRx = Math.sqrt(Math.max(0.1, cand.IxCm4) / Math.max(0.1, candAg));
      
      let candStressRatio = 0.1;
      let candDeflectionRatio = 0.1;
      let candIsSlendernessCrit = false;

      if (elementType === 'correa' || elementType === 'viga') {
        const candMuKgM = (factoredLinearLoadWu * Math.pow(spanM, 2)) / 8;
        candStressRatio = (candMuKgM * 100) / Math.max(1, candPhiMnKgCm);
        const candDeltaCm = (5 * (serviceLinearLoadWs / 100) * Math.pow(spanM * 100, 4)) / (384 * E * Math.max(1, cand.IxCm4));
        candDeflectionRatio = candDeltaCm / allowableDeflectionCm;
      } else if (elementType === 'columna') {
        const KL = 1.5 * (colHeightM * 100);
        const candLambda = KL / Math.max(0.5, candRx);
        candIsSlendernessCrit = candLambda > 180;
        
        const Fe = (Math.PI * Math.PI * E) / Math.pow(candLambda, 2);
        const Fcr = candLambda <= 4.71 * Math.sqrt(E / candFy) ? Math.pow(0.658, candFy / Fe) * candFy : 0.877 * Fe;
        const candAxialCapacityKg = phiComp * Fcr * candAg;
        
        const qColWind = (windLoadW * spacingM * Math.pow(colHeightM, 2)) / 8;
        const candMuKgCm = qColWind * 100;
        
        const P_ratio = axialDemandPuKg / Math.max(1, candAxialCapacityKg);
        const M_ratio = candMuKgCm / Math.max(1, candPhiMnKgCm);
        
        if (P_ratio >= 0.2) {
          candStressRatio = P_ratio + (8 / 9) * M_ratio;
        } else {
          candStressRatio = (P_ratio / 2) + M_ratio;
        }
        
        const candDeltaCm = (qWind * spacingM * Math.pow(colHeightM * 100, 4)) / (185 * E * Math.max(1, cand.IxCm4));
        candDeflectionRatio = candDeltaCm / allowableDeflectionCm;
      } else {
        // Tijeral
        const candMuKgM = (factoredLinearLoadWu * Math.pow(spanM, 2)) / 8;
        const depthM = Math.max(0.30, trussDepthM);
        const chordForceKg = candMuKgM / depthM;
        const panelLenCm = (spanM / 6) * 100;
        const candLambdaChord = panelLenCm / Math.max(0.5, candRx);
        const Fe = (Math.PI * Math.PI * E) / Math.pow(candLambdaChord, 2);
        const Fcr = candLambdaChord <= 4.71 * Math.sqrt(E / candFy) ? Math.pow(0.658, candFy / Fe) * candFy : 0.877 * Fe;
        const candAxialCapacityKg = phiComp * Fcr * candAg;
        candStressRatio = chordForceKg / Math.max(1, candAxialCapacityKg);
        
        const candDeltaCm = (5 * (serviceLinearLoadWs / 100) * Math.pow(spanM * 100, 4)) / (384 * E * (2 * candAg * Math.pow((depthM * 100) / 2, 2)));
        candDeflectionRatio = candDeltaCm / allowableDeflectionCm;
      }

      // We want a profile that is safe and has some margin (e.g., stress ratio < 0.90 and deflection < 0.95)
      if (candStressRatio < 0.90 && candDeflectionRatio < 0.95 && !candIsSlendernessCrit) {
        return cand;
      }
    }
    return sortedCandidates[sortedCandidates.length - 1] || null;
  };

  const recommendedProfile = findRecommendedProfile();

  // Filtrado de perfiles
  const filteredProfiles = STEEL_PROFILES.filter(p => {
    if (elementType === 'correa') {
      return p.type === 'Perfil C (Costanera)' || p.type === 'Tubo Rectangular' || p.type === 'Tubo Cuadrado';
    } else if (elementType === 'viga') {
      return p.type === 'Tubo Rectangular' || p.type === 'IPE' || p.type === 'Tubo Cuadrado' || p.type === 'W';
    } else if (elementType === 'columna') {
      return p.type === 'Tubo Cuadrado' || p.type === 'Tubo Rectangular' || p.type === 'W';
    } else {
      return p.type === 'Tubo Rectangular' || p.type === 'Tubo Cuadrado' || p.type === 'Perfil C (Costanera)';
    }
  });

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              isCollapse ? 'bg-rose-600 text-white animate-pulse' : isWarning ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isCollapse ? <Flame className="w-5 h-5" /> : isWarning ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Simulador de Resistencia Estructural & Diagnóstico de Colapso
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isCollapse ? 'bg-rose-100 text-rose-800 border border-rose-200' : isWarning ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isCollapse ? 'RIESGO DE COLAPSO' : isWarning ? 'AL LÍMITE TÉCNICO' : 'ESTRUCTURA RESISTENTE'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Verificación paramétrica normativa según RNE E.020 (Cargas), E.090 (Estructuras Metálicas) y AISC 360-16
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Cerrar simulador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/40">
          
          {/* Element Type Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-200/70 rounded-xl border border-slate-300/80">
            <button
              onClick={() => {
                setElementType('correa');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                elementType === 'correa' ? 'bg-white text-blue-700 shadow-xs border border-slate-300 font-extrabold' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Correas Techo</span>
            </button>

            <button
              onClick={() => {
                setElementType('viga');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                elementType === 'viga' ? 'bg-white text-blue-700 shadow-xs border border-slate-300 font-extrabold' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>2. Vigas Principales</span>
            </button>

            <button
              onClick={() => {
                setElementType('columna');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                elementType === 'columna' ? 'bg-white text-blue-700 shadow-xs border border-slate-300 font-extrabold' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>3. Columnas Portantes</span>
            </button>

            <button
              onClick={() => {
                setElementType('tijeral');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                elementType === 'tijeral' ? 'bg-white text-blue-700 shadow-xs border border-slate-300 font-extrabold' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>4. Tijerales / Celosías</span>
            </button>
          </div>

          {/* MAIN VERDICT BANNER */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isCollapse 
              ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs' 
              : isWarning 
              ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs' 
              : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="text-sm sm:text-base font-black tracking-tight">
                    {isCollapse 
                      ? '⚠️ DIAGNÓSTICO CRÍTICO: FALLA ESTRUCTURAL / RIESGO DE COLAPSO' 
                      : isWarning 
                      ? '⚠️ DIAGNÓSTICO: ALERTA DE PANDEO O DEFLEXIÓN AL LÍMITE' 
                      : '✅ DIAGNÓSTICO: ESTRUCTURA TOTALMENTE RESISTENTE Y SEGURA'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">
                  {isCollapse ? (
                    <>
                      {stressRatio >= 1.00 ? (
                        <>El perfil <strong>{currentProfile.name}</strong> para <strong>{elementType.toUpperCase()}</strong> supera su capacidad de resistencia en un <strong>{((stressRatio - 1) * 100).toFixed(0)}%</strong>. </>
                      ) : deflectionRatio >= 1.50 ? (
                        <>El perfil presenta una deflexión crítica de <strong>{deltaCm.toFixed(2)} cm</strong>, superando por mucho el límite admisible ({allowableDeflectionCm.toFixed(2)} cm). </>
                      ) : (
                        <>Riesgo crítico de inestabilidad: </>
                      )}
                      {elementType === 'columna' && slendernessLambda > 200 ? 
                        `La esbeltez λ=${slendernessLambda.toFixed(0)} supera el límite normativo de 200, lo que garantiza un colapso por pandeo global.` : 
                        'La estructura no es apta para soportar las cargas de diseño y colapsará ante eventos climáticos.'}
                    </>
                  ) : isWarning ? (
                    <>
                      El perfil <strong>{currentProfile.name}</strong> trabaja al <strong>{(stressRatio * 100).toFixed(0)}%</strong> de su resistencia. Presenta una deflexión o esbeltez cercana al límite admisible ({deltaCm.toFixed(2)} cm vs máx {allowableDeflectionCm.toFixed(2)} cm). Se recomienda reforzar para garantizar mayor rigidez.
                    </>
                  ) : (
                    <>
                      El perfil <strong>{currentProfile.name}</strong> cumple con creces la norma RNE E.090 y AISC 360. Trabaja con un factor de utilización óptimo del <strong>{(stressRatio * 100).toFixed(0)}%</strong> y una deflexión de <strong>{deltaCm.toFixed(2)} cm</strong> (inferior al límite admisible de {allowableDeflectionCm.toFixed(2)} cm).
                    </>
                  )}
                </p>
              </div>

              {/* Stress, Deflection & Slenderness Badges */}
              <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="text-center px-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">DEMANDA / DCR</span>
                  <span className={`text-lg sm:text-xl font-black ${
                    stressRatio > 1.0 ? 'text-rose-600' : stressRatio > 0.85 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {(stressRatio * 100).toFixed(0)}%
                  </span>
                  <span className="text-[9px] text-slate-400 block">{stressRatio > 1.0 ? 'Falla' : 'Límite < 85%'}</span>
                </div>

                <div className="h-8 w-px bg-slate-200" />

                <div className="text-center px-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    {elementType === 'columna' ? 'ESBELTEZ (λ)' : 'FLECHA'}
                  </span>
                  <span className={`text-lg sm:text-xl font-black ${
                    elementType === 'columna' 
                      ? (slendernessLambda > 200 ? 'text-rose-600' : slendernessLambda > 160 ? 'text-amber-600' : 'text-emerald-600')
                      : (deflectionRatio > 1.0 ? 'text-rose-600' : deflectionRatio > 0.85 ? 'text-amber-600' : 'text-emerald-600')
                  }`}>
                    {elementType === 'columna' ? slendernessLambda.toFixed(0) : deltaCm.toFixed(2)} 
                    <span className="text-[10px] text-slate-500 ml-0.5">{elementType === 'columna' ? '' : 'cm'}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {elementType === 'columna' ? 'Norma: λ ≤ 200' : `Máx: ${allowableDeflectionCm.toFixed(2)} cm`}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendation Box if collapsing */}
            {isCollapse && recommendedProfile && (
              <div className="mt-3 pt-3 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-rose-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    <strong>Recomendación Técnica Precisa:</strong> Cambiar a <strong>{recommendedProfile.name}</strong> para asegurar rigidez y resistencia estructural total.
                  </span>
                </div>
                {onApplyRecommendedProfile && (
                  <button
                    onClick={() => {
                      const applyType = elementType === 'correa' ? 'correas' : elementType === 'viga' ? 'vigas' : elementType === 'columna' ? 'columnas' : 'tijerales';
                      onApplyRecommendedProfile(applyType, recommendedProfile.id);
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-extrabold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
                  >
                    <span>Aplicar {recommendedProfile.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* SIMULATION CONTROLS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Profile selector & Technical Matrix */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Perfil y Sección Metálica</span>
              </span>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Perfil Metálico Evaluado:
                </label>
                <select
                  value={selectedProfileId}
                  onChange={e => setSelectedProfileId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  {filteredProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.weightKgM.toFixed(1)} kg/m (Espesor: {p.thicknessMm}mm)
                    </option>
                  ))}
                </select>
              </div>

              {/* Profile Details Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block">PESO LINEAL</span>
                  <span className="text-xs font-bold text-slate-800">{currentProfile.weightKgM.toFixed(2)} kg/m</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block">ESPESOR</span>
                  <span className="text-xs font-bold text-slate-800">{currentProfile.thicknessMm} mm</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block">MÓDULO Sx</span>
                  <span className="text-xs font-bold text-slate-800">{currentProfile.SxCm3.toFixed(1)} cm³</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 block">INERCIA Ix</span>
                  <span className="text-xs font-bold text-slate-800">{currentProfile.IxCm4.toFixed(1)} cm⁴</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 block mb-1.5">Perfiles Recomendados para Probar:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'tub-cuad-100x100x3', label: 'Tubo Cuad 4"x4" (3mm) [Columnas]' },
                    { id: 'tub-rec-100x50x2', label: 'Tubo 4"x2" (2mm) [Vigas/Tijerales]' },
                    { id: 'tub-rec-75x38x2', label: 'Tubo 3"x1 1/2" (2mm) [Correas Pesadas]' },
                    { id: 'perfil-c-100x50x2', label: 'Costanera C 100x50 [Correas]' },
                    { id: 'ipe-200', label: 'Viga IPE 200 [Gran Luz]' }
                  ].map(quick => (
                    <button
                      key={quick.id}
                      onClick={() => setSelectedProfileId(quick.id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        selectedProfileId === quick.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Span, Spacing, and Loading Inputs */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Geometría y Cargas de Servicio</span>
              </span>

              <div className="grid grid-cols-2 gap-3">
                {elementType === 'columna' ? (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 flex justify-between mb-1">
                      <span>Altura Libre Columna (H):</span>
                      <span className="font-bold text-slate-900">{colHeightM.toFixed(2)} m</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="2.0"
                        max="7.0"
                        step="0.10"
                        value={colHeightM}
                        onChange={e => setColHeightM(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-600 cursor-pointer"
                      />
                      <input
                        type="number"
                        step="0.05"
                        value={colHeightM}
                        onFocus={(e) => e.target.select()}
                        onChange={e => setColHeightM(parseFloat(e.target.value) || 0)}
                        className="w-16 p-1 text-[10px] font-bold border border-slate-200 rounded text-center bg-slate-50"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>2.0m</span>
                      <span>4.5m</span>
                      <span>7.0m</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 flex justify-between mb-1">
                      <span>Luz Libre (L):</span>
                      <span className="font-bold text-slate-900">{spanM.toFixed(2)} m</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1.0"
                        max="14.0"
                        step="0.25"
                        value={spanM}
                        onChange={e => setSpanM(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-600 cursor-pointer"
                      />
                      <input
                        type="number"
                        step="0.10"
                        value={spanM}
                        onFocus={(e) => e.target.select()}
                        onChange={e => setSpanM(parseFloat(e.target.value) || 0)}
                        className="w-16 p-1 text-[10px] font-bold border border-slate-200 rounded text-center bg-slate-50"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>1.0m</span>
                      <span>7.0m</span>
                      <span>14.0m</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 flex justify-between mb-1">
                    <span>Separación Tributaria (S):</span>
                    <span className="font-bold text-slate-900">{spacingM.toFixed(2)} m</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0.50"
                      max="6.0"
                      step="0.10"
                      value={spacingM}
                      onChange={e => setSpacingM(parseFloat(e.target.value))}
                      className="flex-1 accent-blue-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      step="0.05"
                      value={spacingM}
                      onFocus={(e) => e.target.select()}
                      onChange={e => setSpacingM(parseFloat(e.target.value) || 0)}
                      className="w-16 p-1 text-[10px] font-bold border border-slate-200 rounded text-center bg-slate-50"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>0.5m</span>
                    <span>3.0m</span>
                    <span>6.0m</span>
                  </div>
                </div>
              </div>

              {elementType === 'tijeral' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 flex justify-between mb-1">
                    <span>Peralte / Altura de Tijeral (H):</span>
                    <span className="font-bold text-slate-900">{trussDepthM.toFixed(2)} m (Luz/{(spanM / trussDepthM).toFixed(1)})</span>
                  </label>
                  <input
                    type="range"
                    min="0.30"
                    max="2.00"
                    step="0.05"
                    value={trussDepthM}
                    onChange={e => setTrussDepthM(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 flex justify-between mb-1">
                    <span>Sobrecarga Viva:</span>
                    <span className="font-bold text-slate-900">{liveLoadKgM2} kg/m²</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={liveLoadKgM2}
                    onChange={e => setLiveLoadKgM2(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 flex justify-between mb-1">
                    <span>Velocidad de Viento:</span>
                    <span className="font-bold text-slate-900">{windSpeedKmh} km/h</span>
                  </label>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    step="5"
                    value={windSpeedKmh}
                    onChange={e => setWindSpeedKmh(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Summary Calculation Values */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Carga total última w_u:</span>
                  <span className="font-mono font-bold text-slate-900">{factoredLinearLoadWu.toFixed(1)} kg/m</span>
                </div>
                {elementType === 'columna' ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Carga Axial Mayorada Pu:</span>
                      <span className="font-mono font-bold text-slate-900">{axialDemandPuKg.toFixed(0)} kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Capacidad Axial Compresión (ΦPn):</span>
                      <span className="font-mono font-bold text-slate-900">{axialCapacityKg.toFixed(0)} kg</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Momento Flector Actuante (Mu):</span>
                      <span className="font-mono font-bold text-slate-900">{MuKgM.toFixed(1)} kg·m</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Momento Resistente Diseño (ΦMn):</span>
                      <span className="font-mono font-bold text-slate-900">{phiMnKgM.toFixed(1)} kg·m</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 hidden sm:flex items-center space-x-1.5">
            <Info className="w-4 h-4 text-blue-500" />
            <span>Los cálculos verifican estados límite de falla por resistencia y estados límite de servicio por deflexión.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer ml-auto"
          >
            Entendido / Cerrar Simulador
          </button>
        </div>

      </div>
    </div>
  );
};
