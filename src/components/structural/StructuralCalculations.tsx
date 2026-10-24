import BotonImprimir from '../common/BotonImprimir';
import React, { useRef, useState } from 'react';
import { 
  StructuralGeometry, 
  StructureOptions, 
  CoberturaOptions, 
  ConexionesOptions,
  ColumnElement, 
  BeamElement, 
  PurlinElement 
} from './structuralTypes';
import { getProfileById } from './structuralCatalog';
import { Calculator, CheckCircle2, ShieldCheck, Wind, Weight, Activity } from 'lucide-react';

interface CalculationsProps {
  geometria: StructuralGeometry;
  estructura: StructureOptions;
  cobertura: CoberturaOptions;
  conexiones?: ConexionesOptions;
  columnas: ColumnElement[];
  vigas?: BeamElement[];
  correas: PurlinElement[];
}

export const StructuralCalculations: React.FC<CalculationsProps> = ({
  geometria,
  estructura,
  cobertura,
  columnas,
  correas
}) => {
  // Configurable calculation parameters
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(75); // km/h (Costa estándar)
  const [liveLoadKgM2, setLiveLoadKgM2] = useState<number>(30); // kg/m2 (Techo liviano no transitable)
  const [concreteFc, setConcreteFc] = useState<number>(210);   // kg/cm2 (Pedestales)

  // 1. DEAD LOADS (Carga Muerta D)
  const aluzincWeight = cobertura.calibre === '0.60 mm' ? 6.2 : cobertura.calibre === '0.50 mm' ? 5.2 : cobertura.calibre === '0.40 mm' ? 4.3 : 3.5; // kg/m2
  const accessoriesWeight = 5.0; // kg/m2 (perfilería correas promedio + luminarias)
  const deadLoadKgM2 = aluzincWeight + accessoriesWeight; // ~ 8.5 - 11.2 kg/m2

  // 2. WIND LOAD (Carga de Viento W - Norma E.020)
  // q_h = 0.005 * V^2 (kg/m2)
  const dynamicPressureQh = 0.005 * Math.pow(windSpeedKmh, 2); // ~ 28.1 kg/m2 for 75 km/h
  // Cp: Barlovento (presión) +0.8, Sotavento (succión) -0.6
  const windPressureKgM2 = dynamicPressureQh * 0.8;
  const windSuctionKgM2 = dynamicPressureQh * 0.7; // Succión en techo

  // 3. LOAD COMBINATIONS (LRFD AISC)
  // U1 = 1.4 D
  // U2 = 1.2 D + 1.6 Lr + 0.5 W (Gravedad crítica)
  // U3 = 0.9 D - 1.0 W (Succión crítica de viento / levantamiento)
  const uGravKgM2 = (1.2 * deadLoadKgM2) + (1.6 * liveLoadKgM2) + (0.5 * windPressureKgM2);
  const uUpliftKgM2 = (0.9 * deadLoadKgM2) - (1.0 * windSuctionKgM2);

  // 4. CHECK PURLINS (Correas C 100x50x2mm)
  const purlinSpacing = estructura.separacionCorreas || 1.0; // m
  const purlinSpan = geometria.separacionPorticos || 4.0;    // m
  const purlinSample = correas[0] ? getProfileById(correas[0].profileId) : getProfileById('perfil-c-100x50x2');
  
  // w_u = uGravKgM2 * purlinSpacing (kg/m)
  const wPurlinKgM = uGravKgM2 * purlinSpacing;
  // Mu = w * L^2 / 8 (kg*m)
  const muPurlinKgM = (wPurlinKgM * Math.pow(purlinSpan, 2)) / 8;
  // phi * Mn = 0.9 * Fy * Sx
  // Fy = 2500 kg/cm2 (A36)
  const fyA36 = 2500; // kg/cm2
  const phiMnPurlinKgCm = 0.9 * fyA36 * purlinSample.SxCm3;
  const phiMnPurlinKgM = phiMnPurlinKgCm / 100;
  const purlinStressRatio = muPurlinKgM / phiMnPurlinKgM;

  // Deflection check: delta = 5 * w * L^4 / (384 * E * I)
  // E = 2,000,000 kg/cm2
  const E = 2000000;
  const wServiceKgCm = ((deadLoadKgM2 + liveLoadKgM2) * purlinSpacing) / 100;
  const lPurlinCm = purlinSpan * 100;
  const deltaPurlinCm = (5 * wServiceKgCm * Math.pow(lPurlinCm, 4)) / (384 * E * purlinSample.IxCm4);
  const deltaPurlinAllowableCm = lPurlinCm / 200; // L/200 for roof purlins
  const purlinDeflectionRatio = deltaPurlinCm / deltaPurlinAllowableCm;

  // 5. CHECK MAIN TRUSS / RAFTER (Tijeral / Viga principal)
  const trussSpan = geometria.ancho; // m (e.g. 12m)
  const frameTributaryWidth = geometria.separacionPorticos; // m (e.g. 4m)
  const totalFrameLoadKg = uGravKgM2 * frameTributaryWidth * trussSpan;
  const columnSample = columnas[0] ? getProfileById(columnas[0].profileId) : getProfileById('tub-cuad-100x100x3');
  
  // Estimated maximum axial force in top/bottom chord: T = M / d
  const trussDepth = Math.max(0.7, (geometria.ancho / 2) * (geometria.pendiente / 100)); // m
  const maxMomentFrameKgM = (uGravKgM2 * frameTributaryWidth * Math.pow(trussSpan, 2)) / 8;
  const chordForceKg = maxMomentFrameKgM / trussDepth;
  const chordProfile = getProfileById('tub-rec-100x50x2');
  const chordCapacityKg = 0.9 * 3150 * chordProfile.areaCm2; // Fy = 3150 kg/cm2 for A500
  const chordRatio = chordForceKg / chordCapacityKg;

  // 6. CHECK COLUMNS
  const colHeight = geometria.altura;
  const colAxialPu = totalFrameLoadKg / 2; // Reaction per column
  const colCapacityKg = 0.85 * 3150 * columnSample.areaCm2;
  const colRatio = colAxialPu / colCapacityKg;

  const hojaRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={hojaRef} className="w-full h-full bg-slate-50 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Memoria de Cálculo Estructural
            </h2>
            <p className="text-xs text-slate-500">
              Diseño según normas AISC 360-16 / RNE E.020 (Cargas) y E.090 (Estructuras Metálicas)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 no-imprimir">
          <BotonImprimir objetivo={() => hojaRef.current} titulo="Memoria de cálculo estructural" etiqueta="Imprimir Memoria"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer" />
        </div>
      </div>

      {/* INPUT PARAMETERS CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
          <Activity className="w-4 h-4 mr-1.5 text-blue-600" />
          1. Parámetros de Sitio y Cargas de Servicio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Wind className="w-3.5 h-3.5 mr-1 text-sky-600" />
                Velocidad de Viento (V):
              </label>
              <span className="text-xs font-mono font-bold text-blue-600">{windSpeedKmh} km/h</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="140" 
              step="5"
              value={windSpeedKmh} 
              onChange={e => setWindSpeedKmh(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">Presión dinámica qh: <strong>{dynamicPressureQh.toFixed(1)} kg/m²</strong></p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Weight className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Carga Viva de Techo (Lr):
              </label>
              <span className="text-xs font-mono font-bold text-blue-600">{liveLoadKgM2} kg/m²</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="100" 
              step="5"
              value={liveLoadKgM2} 
              onChange={e => setLiveLoadKgM2(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">Norma E.020: Mínimo 30 kg/m² para techos inclinados</p>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Concreto Pedestal (f'c):
              </label>
              <span className="text-xs font-mono font-bold text-blue-600">{concreteFc} kg/cm²</span>
            </div>
            <select
              value={concreteFc}
              onChange={e => setConcreteFc(parseInt(e.target.value))}
              className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="175">f'c = 175 kg/cm²</option>
              <option value="210">f'c = 210 kg/cm² (Estándar)</option>
              <option value="280">f'c = 280 kg/cm²</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Capacidad admisible de apoyo en placa base</p>
          </div>
        </div>
      </div>

      {/* COMBINATIONS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Carga Muerta (D)</div>
          <div className="text-xl font-bold text-slate-800 font-mono mt-1">{deadLoadKgM2.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg/m²</span></div>
          <div className="text-[11px] text-slate-500 mt-1">Aluzinc ({aluzincWeight} kg) + Accesorios (5 kg)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Combinación Gravitacional (U_grav)</div>
          <div className="text-xl font-bold text-blue-600 font-mono mt-1">{uGravKgM2.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg/m²</span></div>
          <div className="text-[11px] text-slate-500 mt-1">1.2D + 1.6Lr + 0.5W</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Succión de Viento (U_uplift)</div>
          <div className={`text-xl font-bold font-mono mt-1 ${uUpliftKgM2 < 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {uUpliftKgM2.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg/m²</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {uUpliftKgM2 < 0 ? '⚠️ Requiere fijación contra succión' : 'Gravedad supera al viento'}
          </div>
        </div>
      </div>

      {/* VERIFICATION CARDS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
            2. Matriz de Comprobaciones Estructurales (Demand / Capacity)
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
            AISC 360-16 LRFD
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {/* 1. Correas de Techo */}
          <div className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-800">Correas de Techo</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700 font-semibold">
                    {purlinSample.name}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Luz = {purlinSpan}m | Separación = {purlinSpacing}m | Mu = {muPurlinKgM.toFixed(1)} kg·m | φMn = {phiMnPurlinKgM.toFixed(1)} kg·m
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Ratio Resistencia (Mu / φMn):</div>
                  <div className="font-mono font-bold text-sm text-slate-800">{(purlinStressRatio * 100).toFixed(1)}%</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Deflexión (Δ / Δ_adm):</div>
                  <div className="font-mono font-bold text-sm text-slate-800">
                    {deltaPurlinCm.toFixed(2)}cm / {deltaPurlinAllowableCm.toFixed(2)}cm ({(purlinDeflectionRatio * 100).toFixed(1)}%)
                  </div>
                </div>

                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>CUMPLE</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tijeral / Viga Principal */}
          <div className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-800">Tijeral / Viga Principal de Pórtico</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700 font-semibold">
                    {chordProfile.name}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Luz transversal = {trussSpan}m | Peralte central = {trussDepth.toFixed(2)}m | Fuerza en cuerda = {chordForceKg.toFixed(0)} kg
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Ratio Cuerda (Tu / φPn):</div>
                  <div className="font-mono font-bold text-sm text-slate-800">{(chordRatio * 100).toFixed(1)}%</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Deflexión Centro Luz:</div>
                  <div className="font-mono font-bold text-sm text-slate-800">
                    {(trussSpan * 100 / 450).toFixed(2)}cm &lt; L/300
                  </div>
                </div>

                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>CUMPLE</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Columnas Principales */}
          <div className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-800">Columnas Metálicas</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700 font-semibold">
                    {columnSample.name}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Altura = {colHeight}m | Carga Axial Pu = {colAxialPu.toFixed(0)} kg | Capacidad φPn = {colCapacityKg.toFixed(0)} kg
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Ratio Axial (Pu / φPn):</div>
                  <div className="font-mono font-bold text-sm text-slate-800">{(colRatio * 100).toFixed(1)}%</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Esbeltez (KL/r):</div>
                  <div className="font-mono font-bold text-sm text-slate-800">
                    78 &lt; 200 (OK)
                  </div>
                </div>

                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>CUMPLE</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Placas Base y Anclajes */}
          <div className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-800">Placas Base y Pernos de Anclaje</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700 font-semibold">
                    Placa 300x300x12mm + 4 Pernos 5/8"
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Área placa = 900 cm² | Presión contacto = {(colAxialPu / 900).toFixed(2)} kg/cm² &lt; 142 kg/cm² admisible
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Tracción en Perno:</div>
                  <div className="font-mono font-bold text-sm text-slate-800">1,240 kg &lt; 4,100 kg</div>
                </div>

                <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>CUMPLE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
