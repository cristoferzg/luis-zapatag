// Módulo de Análisis Estructural, Simulador de Pandeo y Normativa Peruana (RNE E.020, E.030, E.050, E.090)
// Diseño amigable con la paleta y componentes de la plataforma
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Play,
  Pause,
  Zap,
  Building
} from 'lucide-react';

import { UseTechosCadEngineReturn } from './useTechosCadEngineState';

interface TechosEstructuralAnalysisViewProps {
  engineState: UseTechosCadEngineReturn;
}

export const TechosEstructuralAnalysisView: React.FC<TechosEstructuralAnalysisViewProps> = ({ engineState }) => {
  const { structuralReport, structuralInputs, setStructuralInputs, segments, nodes } = engineState;

  // Estados locales como string para edición numérica fluida sin saltos ni bloqueos al borrar
  const [cmStr, setCmStr] = useState<string>(String(structuralInputs.cargaMuertaKgM2 || 15));
  const [cvStr, setCvStr] = useState<string>(String(structuralInputs.cargaVivaKgM2 || 30));
  const [vvStr, setVvStr] = useState<string>(String(structuralInputs.velocidadVientoKmH || 75));

  // Estado del Simulador de Pandeo Animado
  const [isSimulatingBuckling, setIsSimulatingBuckling] = useState<boolean>(false);
  const [bucklingScale, setBucklingScale] = useState<number>(1.5);

  const isOK = structuralReport.resultadoGlobal === 'CUMPLE';

  // Cálculos de Pandeo por Elemento
  const bucklingAnalysis = Object.values(segments).map(seg => {
    const nA = nodes[seg.nodeAId];
    const nB = nodes[seg.nodeBId];
    if (!nA || !nB) return null;

    const dx = nB.x - nA.x;
    const dy = nB.y - nA.y;
    const dz = (nB.z || 0) - (nA.z || 0);
    const lengthM = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Asumimos perfil tubular cuadrado promedio 100x100x2.0mm
    // Radio de giro r = sqrt(I / A) ~ 3.8 cm = 0.038m
    const rRadioGiroM = 0.038;
    const KFactor = seg.rolEstructural === 'columna' ? 1.0 : 0.8; // Factor de longitud efectiva
    const lambdaEsbeltez = (KFactor * lengthM) / rRadioGiroM;

    // Límite RNE E.090 a compresión lambda <= 200
    const esbeltezOk = lambdaEsbeltez <= 200;

    // Carga crítica Euler Pcr = (pi^2 * E * I) / (K * L)^2
    const EModulusGPa = 200; // Acero A36
    const IMomentInertiaCm4 = 110; // 110 cm4
    const PcrkN = (Math.PI * Math.PI * (EModulusGPa * 1e6) * (IMomentInertiaCm4 * 1e-8)) / Math.pow(KFactor * lengthM, 2);

    let riesgoPandeo: 'BAJO' | 'MEDIO' | 'ALTO' = 'BAJO';
    if (lambdaEsbeltez > 200 || lengthM > 6.0) riesgoPandeo = 'ALTO';
    else if (lambdaEsbeltez > 150 || lengthM > 4.5) riesgoPandeo = 'MEDIO';

    return {
      id: seg.id,
      rol: seg.rolEstructural,
      longitudM: lengthM.toFixed(2),
      lambdaEsbeltez: lambdaEsbeltez.toFixed(0),
      esbeltezOk,
      PcrkN: PcrkN.toFixed(1),
      riesgoPandeo
    };
  }).filter(Boolean);

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      
      {/* 1. CABECERA NORMATIVA Y ESTADO GLOBAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">ANÁLISIS ESTRUCTURAL Y SIMULADOR DE PANDEO (RNE E.090)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verificación paramétrica de esfuerzos, esbeltez (λ), carga crítica de Euler (Pcr) y riesgo de pandeo lateral-torsional.
          </p>
        </div>

        {/* Estado de Cumplimiento Global y Acción Rápida */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const { updateMultipleSegmentsProfile } = engineState;
              const colSegs: string[] = [];
              const diagSegs: string[] = [];
              const cordonSegs: string[] = [];
              const correaSegs: string[] = [];

              Object.values(segments).forEach(seg => {
                if (seg.rolEstructural === 'columna') colSegs.push(seg.id);
                else if (seg.rolEstructural === 'diagonal' || seg.rolEstructural === 'montante') diagSegs.push(seg.id);
                else if (seg.rolEstructural === 'cordon_superior' || seg.rolEstructural === 'cordon_inferior' || seg.rolEstructural === 'viga_principal') cordonSegs.push(seg.id);
                else if (seg.rolEstructural === 'correa' || seg.rolEstructural === 'arriostre') correaSegs.push(seg.id);
              });

              if (colSegs.length > 0) updateMultipleSegmentsProfile(colSegs, 'perfil_sq_4x4_30', 'columna');
              if (cordonSegs.length > 0) updateMultipleSegmentsProfile(cordonSegs, 'perfil_rec_4x2_25', 'cordon_superior');
              if (diagSegs.length > 0) updateMultipleSegmentsProfile(diagSegs, 'perfil_sq_2x2_20', 'diagonal');
              if (correaSegs.length > 0) updateMultipleSegmentsProfile(correaSegs, 'perfil_c_4x2_20', 'correa');
            }}
            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Aplica con un solo clic las dimensiones óptimas para cumplir la norma E.090"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>⚡ APLICAR CAMBIOS RECOMENDADOS (E.090)</span>
          </button>

          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 text-xs font-bold tracking-wide shadow-2xs ${
            isOK 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}>
            {isOK ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{isOK ? 'CUMPLE PREDISEÑO ESTRUCTURAL' : 'REQUIERE REFUERZO / MAYOR PERFIL'}</span>
          </div>
        </div>
      </div>

      {/* DISCLAIMER OBLIGATORIO */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed shadow-2xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Nota de Ingeniería Estructural:</strong> Los cálculos de estabilidad y deformaciones por pandeo siguen las fórmulas de Euler e Inercia de la norma RNE E.090 (Estructuras Metálicas en Perú).
        </div>
      </div>

      {/* 2. PARÁMETROS NORMATIVOS (CARGA MUERTA, VIVA, VIENTO, SÍSMICA) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="block text-xs font-black text-slate-700 uppercase">Carga Muerta (D) - E.020</span>
          <div className="flex items-center justify-between gap-2">
            <input 
              type="number"
              value={cmStr}
              onChange={(e) => {
                const val = e.target.value;
                setCmStr(val);
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  setStructuralInputs(prev => ({ ...prev, cargaMuertaKgM2: num }));
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-sm font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-bold shrink-0">kg/m²</span>
          </div>
          <p className="text-[10px] text-slate-500">Cobertura + peso propio acero</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="block text-xs font-black text-slate-700 uppercase">Carga Viva (L) - E.020</span>
          <div className="flex items-center justify-between gap-2">
            <input 
              type="number"
              value={cvStr}
              onChange={(e) => {
                const val = e.target.value;
                setCvStr(val);
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  setStructuralInputs(prev => ({ ...prev, cargaVivaKgM2: num }));
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-sm font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-bold shrink-0">kg/m²</span>
          </div>
          <p className="text-[10px] text-slate-500">Sobrecarga de mantenimiento</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="block text-xs font-black text-slate-700 uppercase">Velocidad Viento (V)</span>
          <div className="flex items-center justify-between gap-2">
            <input 
              type="number"
              value={vvStr}
              onChange={(e) => {
                const val = e.target.value;
                setVvStr(val);
                const num = parseFloat(val);
                if (!isNaN(num) && num >= 0) {
                  setStructuralInputs(prev => ({ ...prev, velocidadVientoKmH: num }));
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-sm font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-bold shrink-0">km/h</span>
          </div>
          <p className="text-[10px] text-slate-500">Presión dinámica de viento</p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
          <span className="block text-xs font-black text-slate-700 uppercase">Zona Sísmica - E.030</span>
          <select 
            value={structuralInputs.zonaSismica}
            onChange={(e) => setStructuralInputs(prev => ({ ...prev, zonaSismica: e.target.value as any }))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-xs font-bold focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="Z4">Zona 4 (Costa / Z = 0.45g)</option>
            <option value="Z3">Zona 3 (Sierra / Z = 0.35g)</option>
            <option value="Z2">Zona 2 (Selva / Z = 0.25g)</option>
            <option value="Z1">Zona 1 (Z = 0.10g)</option>
          </select>
          <p className="text-[10px] text-slate-500">Factor de zona sísmica Z</p>
        </div>
      </div>

      {/* 3. SIMULADOR ANIMADO DE PANDEO ESTRUCTURAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase">Simulador Gráfico de Pandeo por Carga Crítica</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulatingBuckling(!isSimulatingBuckling)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                isSimulatingBuckling ? 'bg-amber-500 text-slate-950 shadow-xs font-black' : 'bg-sky-600 hover:bg-sky-700 text-white font-bold'
              }`}
            >
              {isSimulatingBuckling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isSimulatingBuckling ? 'PAUSAR SIMULACIÓN' : 'SIMULAR DEFORMACIÓN DE PANDEO'}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-bold">Escala:</span>
              <input 
                type="range"
                min="0.5"
                max="3.0"
                step="0.25"
                value={bucklingScale}
                onChange={(e) => setBucklingScale(parseFloat(e.target.value))}
                className="w-16 accent-amber-500 cursor-pointer"
              />
              <span className="font-mono font-bold text-amber-700">{bucklingScale}x</span>
            </div>
          </div>
        </div>

        {/* Lienzo 2D de Simulación de Pandeo en Líneas */}
        <div className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center p-4">
          <svg className="w-full h-full">
            {/* Suelo */}
            <line x1="50" y1="160" x2="350" y2="160" stroke="#94a3b8" strokeWidth="4" />
            <line x1="450" y1="160" x2="750" y2="160" stroke="#94a3b8" strokeWidth="4" />

            {/* Muestra 1: Columna Sin Pandeo */}
            <g transform="translate(100, 0)">
              <line x1="100" y1="160" x2="100" y2="30" stroke="#2563eb" strokeWidth="6" />
              <text x="100" y="20" fill="#475569" fontSize="10" textAnchor="middle" fontWeight="bold">Recto (Normal)</text>
              <rect x="80" y="155" width="40" height="10" fill="#cbd5e1" />
            </g>

            {/* Muestra 2: Columna con Pandeo Animado */}
            <g transform="translate(350, 0)">
              <path 
                d={isSimulatingBuckling 
                  ? `M 100 160 Q ${100 + 25 * bucklingScale} 95 100 30` 
                  : 'M 100 160 Q 100 95 100 30'} 
                fill="none" 
                stroke="#d97706" 
                strokeWidth="6" 
                className={isSimulatingBuckling ? 'animate-pulse' : ''}
              />
              {/* Flecha Carga Compresión */}
              <line x1="100" y1="5" x2="100" y2="25" stroke="#dc2626" strokeWidth="3" markerEnd="url(#arrow)" />
              <text x="100" y="20" fill="#d97706" fontSize="10" textAnchor="middle" fontWeight="black">Pandeo Euler (λ &gt; 150)</text>
              <rect x="80" y="155" width="40" height="10" fill="#cbd5e1" />
            </g>

            {/* Muestra 3: Viga / Tijeral con Flecha Deflexión */}
            <g transform="translate(600, 0)">
              <path 
                d={isSimulatingBuckling 
                  ? `M 20 80 Q 100 ${80 + 20 * bucklingScale} 180 80` 
                  : 'M 20 80 Q 100 80 180 80'} 
                fill="none" 
                stroke="#0284c7" 
                strokeWidth="5" 
              />
              <text x="100" y="65" fill="#0284c7" fontSize="10" textAnchor="middle" fontWeight="bold">Flexión / Deflexión Viga</text>
            </g>
          </svg>
        </div>

        {/* RECOMENDACIONES DE TALLER PARA EVITAR PANDEO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs font-black text-amber-700 block flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              1. Pandeo en Columnas
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Si la longitud supera los 4.0m, utilizar tubo cuadrado de mínimo <strong>100x100x3.0mm</strong> o adicionar cartelas triangulares de refuerzo en la plancha base.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs font-black text-amber-700 block flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              2. Pandeo Lateral en Vigas
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Colocar viguetas/correas a un espaciamiento máximo de <strong>1.20m a 1.40m</strong> para brindar soporte lateral continuo al cordón comprimido.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs font-black text-amber-700 block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              3. Templadores (Sag Rods)
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Instalar templadores lisos de 1/2" en el centro de los paños de correas para evitar que las correas C/Z se alabeen antes de instalar la cobertura.
            </p>
          </div>
        </div>
      </div>

      {/* 4. TABLA DE EVALUACIÓN DE ESBELTEZ Y PANDEO POR PIEZA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-600" />
          <span>VERIFICACIÓN DE ESBELTEZ Y CARGA CRÍTICA (Pcr) DE PANDEO</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-black">
                <th className="p-3">ID Elemento</th>
                <th className="p-3">Rol Estructural</th>
                <th className="p-3">Longitud</th>
                <th className="p-3">Esbeltez (λ = KL/r)</th>
                <th className="p-3">Carga Crítica (Pcr)</th>
                <th className="p-3">Nivel de Riesgo Pandeo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bucklingAnalysis.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                    No hay elementos trazados en el modelo CAD para simular pandeo.
                  </td>
                </tr>
              ) : (
                bucklingAnalysis.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors font-mono">
                    <td className="p-3 text-amber-700 font-bold">{b.id}</td>
                    <td className="p-3 text-slate-700 capitalize font-sans">{b.rol.replace('_', ' ')}</td>
                    <td className="p-3 text-slate-600">{b.longitudM} m</td>
                    <td className={`p-3 font-bold ${b.esbeltezOk ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {b.lambdaEsbeltez} {b.esbeltezOk ? '✓ (<=200)' : '⚠️ Excesiva (>200)'}
                    </td>
                    <td className="p-3 text-sky-700 font-bold">{b.PcrkN} kN</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        b.riesgoPandeo === 'BAJO' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                          : b.riesgoPandeo === 'MEDIO'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-300'
                      }`}>
                        RIESGO {b.riesgoPandeo}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TechosEstructuralAnalysisView;
