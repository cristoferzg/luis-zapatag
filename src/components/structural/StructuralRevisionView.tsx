import React from 'react';
import { 
  StructuralGeometry, 
  StructureOptions, 
  CoberturaOptions, 
  ColumnElement, 
  BeamElement, 
  PurlinElement
} from './structuralTypes';
import { calculateRoofGeometry, getPolygonBounds } from './structuralGenerator';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Building2, 
  Droplets, 
  Ruler, 
  ArrowRight, 
  Box, 
  Calculator,
  ShieldCheck,
  Scale
} from 'lucide-react';

interface StructuralRevisionViewProps {
  geometria: StructuralGeometry;
  columnas: ColumnElement[];
  vigas: BeamElement[];
  correas: PurlinElement[];
  estructura: StructureOptions;
  cobertura: CoberturaOptions;
  onGoTo3D: () => void;
  onGoToMetrado: () => void;
  onOpenCollapseSimulator?: () => void;
}

export const StructuralRevisionView: React.FC<StructuralRevisionViewProps> = ({
  geometria,
  columnas,
  vigas,
  correas,
  cobertura,
  onGoTo3D,
  onGoToMetrado,
  onOpenCollapseSimulator
}) => {
  const calc = calculateRoofGeometry(geometria);

  const bounds = geometria.sectores && geometria.sectores.length > 0
    ? getPolygonBounds(geometria.sectores.flatMap(s => s.vertices))
    : { minX: 0, maxX: geometria.largo, minY: 0, maxY: geometria.ancho, length: geometria.largo, width: geometria.ancho };

  const totalArea = calc.areaCoberturaM2 || (geometria.largo * geometria.ancho);
  const totalPerimeter = (bounds.length + bounds.width) * 2;

  // Structural checks
  const hasColumns = columnas.length > 0;
  const hasBeams = vigas.length > 0;
  const hasPurlins = correas.length > 0;
  const slopeOk = (calc.pendientePct || geometria.pendiente) >= 3.0; // Min 3% for metal roofs
  const hasGutter = !!geometria.evacuacion?.tieneCanaleta;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Etapa de Revisión y Validación Técnica
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Resumen Estructural del Techo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifica la geometría, componentes estructurales y sistema de evacuación antes del modelo 3D y presupuesto.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenCollapseSimulator && (
            <button
              onClick={onOpenCollapseSimulator}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Scale className="w-4 h-4 text-slate-950" />
              <span>⚡ Simular Resistencia / Colapso</span>
            </button>
          )}

          <button
            onClick={onGoTo3D}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Box className="w-4 h-4" />
            <span>Ver Modelo 3D</span>
          </button>

          <button
            onClick={onGoToMetrado}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Generar Metrado</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Structural Collapse Simulator Callout */}
      {onOpenCollapseSimulator && (
        <div className="bg-linear-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Simulador de Resistencia vs Riesgo de Colapso</h3>
                <span className="text-[10px] uppercase font-mono font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                  AISC 360 / RNE E.020
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Simula en tiempo real si los perfiles (tubos 3x3, 2x1, costaneras, vigas) resistirán las cargas vivas, peso propio y viento o si colapsarán.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCollapseSimulator}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ejecutar Simulación</span>
          </button>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase">Área Techada</span>
            <Ruler className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalArea.toFixed(2)} <span className="text-xs font-bold text-slate-500">m²</span></p>
          <span className="text-[11px] text-slate-500">Perímetro: {totalPerimeter.toFixed(1)}m</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase">Dimensiones</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{bounds.length.toFixed(1)}×{bounds.width.toFixed(1)} <span className="text-xs font-bold text-slate-500">m</span></p>
          <span className="text-[11px] text-slate-500">H. Alto: {calc.alturaLadoAlto.toFixed(2)}m</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase">Pendiente</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{(calc.pendientePct || geometria.pendiente).toFixed(1)} <span className="text-xs font-bold text-slate-500">%</span></p>
          <span className="text-[11px] text-slate-500">Caída: {geometria.direccionCaida || 'Calle'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase">Elementos</span>
            <Scale className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{columnas.length + vigas.length + correas.length} <span className="text-xs font-bold text-slate-500">uds</span></p>
          <span className="text-[11px] text-slate-500">{columnas.length} col / {vigas.length} vig / {correas.length} cor</span>
        </div>
      </div>

      {/* Validation Checklist & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Checklist */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Lista de Comprobación Técnica (Norma E.090)</span>
          </h3>

          <div className="space-y-2 pt-2">
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              hasColumns ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center space-x-2">
                {hasColumns ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>Apoyos Verticales (Columnas)</span>
              </div>
              <span>{columnas.length} columnas configuradas</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              hasBeams ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center space-x-2">
                {hasBeams ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                <span>Vigas Principales / Tijerales</span>
              </div>
              <span>{vigas.length} elementos portantes</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              hasPurlins ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center space-x-2">
                {hasPurlins ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>Correas de Soporte de Cobertura</span>
              </div>
              <span>{correas.length} correas generadas</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              slopeOk ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center space-x-2">
                {slopeOk ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                <span>Pendiente Mínima de Evacuación Pluvial</span>
              </div>
              <span>{(calc.pendientePct || geometria.pendiente).toFixed(1)}% (Mínimo 3% técnico)</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              hasGutter ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>Sistema de Canaletas y Bajantes</span>
              </div>
              <span>{hasGutter ? 'Canaleta activa' : 'Sin canaleta'}</span>
            </div>
          </div>
        </div>

        {/* Technical Specs Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Especificaciones de Cobertura y Materiales</span>
          </h3>

          <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 border border-slate-200/80">
            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
              <span className="font-semibold">Sistema de Cobertura:</span>
              <span className="font-bold text-slate-900">{geometria.sistemaCobertura === 'panel_termoacustico' ? 'Panel Termoacústico Sandwich' : cobertura.tipo || 'Aluzinc TR4'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
              <span className="font-semibold">Calibre de Chapa / Acabado:</span>
              <span className="font-bold text-slate-900">{cobertura.calibre || '0.35 mm'} - Color {cobertura.color || 'Azul'}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
              <span className="font-semibold">Separación de Porticos:</span>
              <span className="font-bold text-slate-900">{geometria.separacionPorticos || 4.0} m</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
              <span className="font-semibold">Separación de Correas:</span>
              <span className="font-bold text-slate-900">1.00 m estándar</span>
            </div>

            <div className="flex justify-between py-1 text-slate-700">
              <span className="font-semibold">Tipo de Estructura:</span>
              <span className="font-bold text-slate-900">{geometria.tipoTecho?.toUpperCase().replace('_', ' ') || 'UNA CAÍDA'}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onGoToMetrado}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
            >
              <span>Ver Cuadro de Metrados Completo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
