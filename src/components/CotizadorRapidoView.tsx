import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, PieChart, ShieldCheck } from 'lucide-react';
import { safeStorage } from '../lib/storageManager';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
};

const CotizadorRapidoView = () => {
  // Calculadora Techos
  const [calcLargo, setCalcLargo] = useState('');
  const [calcAncho, setCalcAncho] = useState('');
  const [calcSeparacion, setCalcSeparacion] = useState('1'); // cada cuantos metros
  const [calcAlero, setCalcAlero] = useState('0'); // Alero opcional (m)
  const [calcBarLength, setCalcBarLength] = useState('6'); // 6m, 12m, 13.5m
  const [calcCoverageType, setCalcCoverageType] = useState('aluzinc_035'); // Coberturas
  
  // Calculadora Columnas
  const [calcAlturaColumnas, setCalcAlturaColumnas] = useState('');
  const [calcNumColumnas, setCalcNumColumnas] = useState('4');

  // Precios y Margen de Ganancia del Contratista
  const [precioPorM2, setPrecioPorM2] = useState('140');
  const [margenGananciaPct, setMargenGananciaPct] = useState('25'); // 25% por defecto para asegurar > S/1000 de utilidad

  // Cargar estado guardado de forma segura
  useEffect(() => {
    try {
      const d = safeStorage.getItem<any>('innova_cotizador_rapido_data', null);
      if (d) {
        if (d.calcLargo !== undefined) setCalcLargo(d.calcLargo);
        if (d.calcAncho !== undefined) setCalcAncho(d.calcAncho);
        if (d.calcSeparacion !== undefined) setCalcSeparacion(d.calcSeparacion);
        if (d.calcAlero !== undefined) setCalcAlero(d.calcAlero);
        if (d.calcAlturaColumnas !== undefined) setCalcAlturaColumnas(d.calcAlturaColumnas);
        if (d.calcNumColumnas !== undefined) setCalcNumColumnas(d.calcNumColumnas);
        if (d.precioPorM2 !== undefined) setPrecioPorM2(d.precioPorM2);
        if (d.margenGananciaPct !== undefined) setMargenGananciaPct(d.margenGananciaPct);
      }
    } catch (e) {
      console.warn('Error al cargar datos del cotizador:', e);
    }
  }, []);

  // Guardar estado con safeStorage
  useEffect(() => {
    try {
      const d = {
        calcLargo,
        calcAncho,
        calcSeparacion,
        calcAlero,
        calcAlturaColumnas,
        calcNumColumnas,
        precioPorM2,
        margenGananciaPct,
        calcBarLength,
        calcCoverageType
      };
      safeStorage.setItem('innova_cotizador_rapido_data', d);
    } catch (e) {
      console.warn('Error al guardar datos del cotizador:', e);
    }
  }, [calcLargo, calcAncho, calcSeparacion, calcAlero, calcAlturaColumnas, calcNumColumnas, precioPorM2, margenGananciaPct, calcBarLength, calcCoverageType]);
  

  // Matemáticas de la calculadora estructural
  const l_base = Number(calcLargo) || 0;
  const a_base = Number(calcAncho) || 0;
  const alero = Number(calcAlero) || 0;
  const s = Number(calcSeparacion) || 1;
  const barLen = Number(calcBarLength) || 6;
  
  // Medidas Finales sumando el alero (alero a ambos lados = * 2)
  const l = l_base > 0 ? l_base + (alero * 2) : 0;
  const a = a_base > 0 ? a_base + (alero * 2) : 0;
  
  const area = l * a;
  
  
  // Cantidad de fierros para la cuadrícula
  const lineasLargo = Math.floor(a / s) + 1;
  const lineasAncho = Math.floor(l / s) + 1;
  const metrajeHorizontal = lineasLargo * l;
  const metrajeVertical = lineasAncho * a;
  const metrajeTotal = metrajeHorizontal + metrajeVertical;

  // Cantidad de fierros (6m, 12m, etc.) para el techo
  const fierrosRequeridos = Math.ceil(metrajeTotal / barLen);
  
  // Columnas
  const altura = Number(calcAlturaColumnas) || 0;
  const numColumnas = Number(calcNumColumnas) || 0;
  const metrajeColumnas = altura * numColumnas;
  const fierrosColumnas = metrajeColumnas > 0 ? Math.ceil(metrajeColumnas / barLen) : 0;

  // Coberturas (Aluzinc, Eternit, UPVC, Policarbonato, etc.)
  const getCoverageUnitLabel = (type: string) => {
    switch (type) {
      case 'eternit_gran_onda':
        return 'Planchas Eternit Gran Onda (1.83m × 1.10m)';
      case 'eternit_perfil_4':
        return 'Planchas Eternit Perfil 4 (2.44m × 1.10m)';
      case 'eternit_teja_andina':
        return 'Tejas Andinas Fibrocemento Eternit (1.14m × 0.72m)';
      case 'policarbonato_alveolar_6':
        return 'Planchas Policarbonato Alveolar 6mm (5.90m × 2.10m)';
      case 'policarbonato_alveolar_8':
        return 'Planchas Policarbonato Alveolar 8mm (5.90m × 2.10m)';
      case 'upvc_termoacustico':
        return 'Planchas UPVC Termoacústico Tricapa (5.80m × 1.07m)';
      case 'panel_sandwich_pur':
        return 'Paneles Sandwich Termoaislante PUR/PIR (6.00m × 1.00m)';
      case 'aluzinc_030':
        return 'Planchas Aluzinc TR4 0.30mm (6.00m × 1.10m)';
      case 'aluzinc_040':
        return 'Planchas Aluzinc TR4 0.40mm (6.00m × 1.10m)';
      case 'aluzinc_045':
        return 'Planchas Aluzinc TR4 0.45mm (6.00m × 1.10m)';
      case 'aluzinc_050':
        return 'Planchas Aluzinc TR4 0.50mm (6.00m × 1.10m)';
      case 'aluzinc_035':
      default:
        return 'Planchas Aluzinc TR4 0.35mm (6.00m × 1.10m)';
    }
  };

  const getCoveragePlatesCount = (type: string, largo: number, ancho: number) => {
    if (largo <= 0 || ancho <= 0) return 0;
    if (type.startsWith('eternit_gran_onda')) {
      return Math.ceil(area / 1.60); // 1.83 x 1.10 con traslape util ~1.60m2
    }
    if (type.startsWith('eternit_perfil_4')) {
      return Math.ceil(area / 2.20); // 2.44 x 1.10 con traslape util ~2.20m2
    }
    if (type.startsWith('eternit_teja_andina')) {
      return Math.ceil(area / 0.65); // 1.14 x 0.72 con traslape util ~0.65m2
    }
    if (type.startsWith('policarbonato')) {
      return Math.ceil(area / 11.5); // 5.90 x 2.10 util ~11.5m2
    }
    // Aluzinc / UPVC / Panel Sandwich estándar de 6m x 1m útil
    const calcOpt1 = Math.ceil(ancho / 1.0) * Math.ceil(largo / 6);
    const calcOpt2 = Math.ceil(largo / 1.0) * Math.ceil(ancho / 6);
    return (calcOpt1 > 0 && calcOpt2 > 0) ? Math.min(calcOpt1, calcOpt2) : 0;
  };

  const planchasCoberturaOptimas = getCoveragePlatesCount(calcCoverageType, l, a);

  
  
  // Presupuesto y Margen de Utilidad del Contratista
  const presupuestoSugerido = area * Number(precioPorM2 || 140);
  const porcentajeGanancia = Number(margenGananciaPct) || 25;
  const gananciaNetaEstimada = presupuestoSugerido * (porcentajeGanancia / 100);
  const costoDirectoTotal = Math.max(0, presupuestoSugerido - gananciaNetaEstimada);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Calculator className="w-8 h-8 mr-3 text-indigo-500" />
            Calculadora Estructural y Presupuesto
          </h1>
          <p className="text-slate-500 mt-1">Cálculo de estructuras, metrados y presupuestos operativos al instante para sacar nuevos clientes.</p>
        </div>
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h3 className="text-lg font-bold text-indigo-900 mb-1">Cálculo y Presupuesto</h3>
                <p className="text-indigo-700 text-sm">Calcula el área, cantidades de barras, Aluzinc y genera un presupuesto estimado.</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b border-indigo-200/60 pb-6 mb-6">
            {/* Dimensiones */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider">Largo Techo (m)</label>
              <input value={calcLargo} onChange={e => setCalcLargo(e.target.value)} type="number" step="0.1" min="0" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 10.5" />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider">Ancho Techo (m)</label>
              <input value={calcAncho} onChange={e => setCalcAncho(e.target.value)} type="number" step="0.1" min="0" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 6.2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider">Separación (m)</label>
              <input value={calcSeparacion} onChange={e => setCalcSeparacion(e.target.value)} type="number" step="0.1" min="0.1" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 1" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider">Alero (m)</label>
              <input value={calcAlero} onChange={e => setCalcAlero(e.target.value)} type="number" step="0.1" min="0" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 0.5" title="Se sumará a cada lado" />
            </div>
            
            <h4 className="font-bold text-slate-800 text-sm border-b pb-2 mt-6 md:col-span-3 lg:col-span-6">2. Columnas (Metálicas)</h4>
            <div className="lg:col-span-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Altura (m)</label>
                <input value={calcAlturaColumnas} onChange={e => setCalcAlturaColumnas(e.target.value)} type="number" step="0.1" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Cantidad</label>
                <input value={calcNumColumnas} onChange={e => setCalcNumColumnas(e.target.value)} type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
            </div>

            <h4 className="font-bold text-slate-800 text-sm border-b pb-2 mt-6 md:col-span-3 lg:col-span-6">3. Especificaciones Industriales (Fierros & Cobertura)</h4>
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-indigo-800 mb-1">Longitud de Tubo Comercial</label>
              <select value={calcBarLength} onChange={e => setCalcBarLength(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 font-bold text-indigo-900">
                <option value="6">6.00 m (Estándar Comercial)</option>
                <option value="12">12.00 m (Industrial de Fábrica)</option>
                <option value="13.5">13.50 m (Industrial Extra-Pesado)</option>
              </select>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-indigo-800 mb-1">Tipo de Cobertura / Eternit / Aluzinc / UPVC</label>
              <select value={calcCoverageType} onChange={e => setCalcCoverageType(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 font-bold text-indigo-900">
                <optgroup label="Aluzinc TR4 (Aluzinc / Zincalum)">
                  <option value="aluzinc_030">Aluzinc TR4 0.30 mm (Económico / Liviano)</option>
                  <option value="aluzinc_035">Aluzinc TR4 0.35 mm (Estándar Comercial)</option>
                  <option value="aluzinc_040">Aluzinc TR4 0.40 mm (Semi-Industrial)</option>
                  <option value="aluzinc_045">Aluzinc TR4 0.45 mm (Industrial)</option>
                  <option value="aluzinc_050">Aluzinc TR4 0.50 mm (Industrial Pesado)</option>
                </optgroup>
                <optgroup label="Fibrocemento Eternit">
                  <option value="eternit_gran_onda">Eternit Gran Onda (1.83m × 1.10m - Resistente al óxido)</option>
                  <option value="eternit_perfil_4">Eternit Perfil 4 (2.44m × 1.10m - Cubierta Industrial)</option>
                  <option value="eternit_teja_andina">Teja Andina Eternit Fibrocemento (Decorativa / Rústica)</option>
                </optgroup>
                <optgroup label="Termoacústico & Policarbonato">
                  <option value="upvc_termoacustico">UPVC Termoacústico Tricapa 2.5mm (Anti-Calor / Anti-Ruido)</option>
                  <option value="panel_sandwich_pur">Panel Sandwich PUR/PIR Aislante 30mm/50mm</option>
                  <option value="policarbonato_alveolar_6">Policarbonato Alveolar 6mm (Translúcido Iluminación)</option>
                  <option value="policarbonato_alveolar_8">Policarbonato Alveolar 8mm (Alta Resistencia UV)</option>
                </optgroup>
              </select>
            </div>
          </div>
          
          <div className="md:col-span-1 lg:col-span-2 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm border-b pb-2">Presupuesto al Cliente</h4>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Precio x m² (A Todo Costo)</label>
                  <input value={precioPorM2} onChange={e => setPrecioPorM2(e.target.value)} type="number" className="w-full bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none font-bold text-indigo-700" />
              </div>
            </div>
            
        {(fierrosRequeridos > 0 || fierrosColumnas > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
            {/* RESULTADOS */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 shadow-sm text-center lg:col-span-2">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Techo (Metraje {metrajeTotal.toFixed(1)}m)</p>
              <p className="text-3xl font-bold text-indigo-900">{fierrosRequeridos}</p>
              <p className="text-xs text-indigo-600 mt-1">Barras de {calcBarLength}m</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm text-center lg:col-span-2">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Columnas</p>
              <p className="text-3xl font-bold text-emerald-900">{fierrosColumnas}</p>
              <p className="text-xs text-emerald-600 mt-1">Barras de {calcBarLength}m</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm text-center lg:col-span-2">
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">Cobertura Optimizada</p>
              <p className="text-3xl font-bold text-orange-900">{planchasCoberturaOptimas}</p>
              <p className="text-xs text-orange-700 mt-1 font-medium">{getCoverageUnitLabel(calcCoverageType)}</p>
            </div>

            {/* VISTA PREVIA VISUAL MEJORADA */}
            <div className="md:col-span-2 lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 mt-2 shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm mb-4">Plano de Estructura (Vista Superior)</h4>
              
              <div className="w-full flex flex-col items-center justify-center bg-slate-50 rounded-lg p-3 sm:p-6 border border-slate-100">
                <div 
                  className="relative bg-slate-100 overflow-hidden shadow-sm" 
                  style={{ 
                    width: l > a ? '100%' : `${(l/a) * 100}%`, 
                    maxWidth: '800px',
                    aspectRatio: `${l} / ${a}`,
                    border: '4px solid #94a3b8' 
                  }}
                >
                  {/* Líneas Verticales del Techo (paralelas al Ancho) */}
                  {Array.from({ length: lineasAncho }).map((_, i) => {
                    const leftPos = (i * s / l) * 100;
                    return leftPos <= 100 ? (
                      <div key={`v-${i}`} style={{ left: `${leftPos}%` }} className="absolute top-0 bottom-0 w-[2px] bg-slate-400" />
                    ) : null;
                  })}
                  {/* Líneas Horizontales del Techo (paralelas al Largo) */}
                  {Array.from({ length: lineasLargo }).map((_, i) => {
                    const topPos = (i * s / a) * 100;
                    return topPos <= 100 ? (
                      <div key={`h-${i}`} style={{ top: `${topPos}%` }} className="absolute left-0 right-0 h-[2px] bg-slate-400" />
                    ) : null;
                  })}
                  
                  {/* Cobertura Aluzinc Translúcida encima para diferenciar */}
                  <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px]"></div>
                  {Array.from({ length: Math.ceil(a/1) }).map((_, i) => {
                     const topPos = (i * 1 / a) * 100;
                     return topPos <= 100 ? (
                       <div key={`aluzinc-${i}`} style={{ top: `${topPos}%` }} className="absolute left-0 right-0 h-[1px] bg-blue-300/40" />
                     ) : null;
                  })}
                  
                  {/* Columnas distribuidas */}
                  {numColumnas > 0 && (
                    <>
                      {Array.from({ length: Math.ceil(numColumnas / 2) }).map((_, i) => {
                         const colsPerSide = Math.ceil(numColumnas / 2);
                         const leftPos = colsPerSide > 1 ? (i / (colsPerSide - 1)) * 100 : 50;
                         return (
                            <div key={`col-pair-${i}`}>
                              <div style={{ left: `calc(${leftPos}% - 12px)` }} className="absolute -top-3 w-6 h-6 bg-emerald-600 rounded-sm border-2 border-white shadow-lg z-20 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-sm"></div></div>
                              {(i * 2 + 1 < numColumnas) && (
                                <div style={{ left: `calc(${leftPos}% - 12px)` }} className="absolute -bottom-3 w-6 h-6 bg-emerald-600 rounded-sm border-2 border-white shadow-lg z-20 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-sm"></div></div>
                              )}
                            </div>
                         );
                      })}
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-xs text-slate-500">
                    <div className="flex items-center"><div className="w-3 h-3 bg-slate-400 mr-2 flex-shrink-0"></div> Cuadrícula Techo</div>
                    <div className="flex items-center"><div className="w-3 h-3 bg-blue-500/20 border border-blue-200 mr-2 flex-shrink-0"></div> Cobertura Aluzinc</div>
                    {numColumnas > 0 && <div className="flex items-center"><div className="w-3 h-3 bg-emerald-600 mr-2 flex-shrink-0"></div> Columnas Metálicas</div>}
                </div>
              </div>
            </div>
            
            {/* PRESUPUESTO Y MARGEN DE GANANCIA RESULTADO */}
            <div className="md:col-span-2 lg:col-span-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 md:p-8 rounded-2xl border border-indigo-800/80 text-white mt-4 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <TrendingUp className="w-32 h-32 text-indigo-400" />
               </div>
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-indigo-800/60 relative z-10 gap-4">
                 <div>
                   <h4 className="font-bold text-indigo-300 text-sm uppercase tracking-wider flex items-center gap-2">
                     <PieChart className="w-4 h-4 text-emerald-400" />
                     <span>Presupuesto y Análisis de Margen de Ganancia</span>
                   </h4>
                   <p className="text-xs text-slate-400 mt-1">Desglose de costos de materiales, mano de obra y utilidad neta para tu cotización.</p>
                 </div>

                 {/* Controles simples de Precio por m2 y % de Ganancia */}
                 <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                   <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase">Precio/m² Cliente</label>
                     <div className="flex items-center text-xs font-bold text-indigo-300">
                       <span className="mr-1">S/</span>
                       <input 
                         type="number" 
                         value={precioPorM2} 
                         onChange={e => setPrecioPorM2(e.target.value)}
                         className="w-16 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white font-bold outline-none text-right"
                       />
                     </div>
                   </div>
                   <div className="h-6 w-px bg-slate-800" />
                   <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase">% Ganancia Deseada</label>
                     <div className="flex items-center text-xs font-bold text-emerald-400">
                       <input 
                         type="number" 
                         value={margenGananciaPct} 
                         onChange={e => setMargenGananciaPct(e.target.value)}
                         className="w-12 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-emerald-300 font-bold outline-none text-right"
                       />
                       <span className="ml-1">%</span>
                     </div>
                   </div>
                   <div className="flex gap-1 ml-1">
                     {['20', '25', '30', '35'].map(pct => (
                       <button
                         key={pct}
                         onClick={() => setMargenGananciaPct(pct)}
                         className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                           margenGananciaPct === pct 
                             ? 'bg-emerald-600 text-white shadow-xs' 
                             : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                         }`}
                       >
                         {pct}%
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  {/* Presupuesto Total */}
                  <div className="bg-indigo-600/30 p-5 rounded-xl border border-indigo-500/40 flex flex-col justify-between text-center relative overflow-hidden">
                     <h5 className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-2 flex justify-center items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Presupuesto a Cliente</span>
                     </h5>
                     <p className="text-3xl font-bold text-white my-1">{formatCurrency(presupuestoSugerido)}</p>
                     <p className="text-xs text-indigo-300">Área {area.toFixed(2)} m² × S/ {precioPorM2 || 140}/m²</p>
                  </div>

                  {/* Utilidad / Ganancia del Contratista */}
                  <div className="bg-emerald-950/70 p-5 rounded-xl border border-emerald-500/60 flex flex-col justify-between text-center shadow-lg relative">
                     <h5 className="text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-2 flex justify-center items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tu Ganancia Neta Estimada</span>
                     </h5>
                     <p className="text-3xl font-extrabold text-emerald-300 my-1">{formatCurrency(gananciaNetaEstimada)}</p>
                     <div className="mt-1">
                       <span className="text-[11px] font-bold text-emerald-200 bg-emerald-900/80 border border-emerald-500/40 py-1 px-2.5 rounded-lg inline-block">
                          {porcentajeGanancia}% de Ganancia para el Contratista
                       </span>
                     </div>
                  </div>

                  {/* Costos Operativos */}
                  <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60 flex flex-col justify-between text-center">
                     <h5 className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 flex justify-center items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Costos Operativos Estimados</span>
                     </h5>
                     <p className="text-3xl font-bold text-slate-200 my-1">{formatCurrency(costoDirectoTotal)}</p>
                     <p className="text-xs text-slate-400">Presupuesto menos Ganancia ({100 - porcentajeGanancia}%)</p>
                  </div>
               </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default CotizadorRapidoView;
