// Estructura de Costos y Margen Exclusivo para Techos Metálicos
// Diseño amigable con la paleta y componentes de la plataforma
import React from 'react';
import { DollarSign } from 'lucide-react';

interface TechosCostosViewProps {
  design?: any;
  onUpdateDesign?: (updated: any) => void;
}

export const TechosCostosView: React.FC<TechosCostosViewProps> = ({ design }) => {
  const isBom = design && typeof design.precioVentaFinalSoles === 'number';

  const precioFinal = isBom 
    ? design.precioVentaFinalSoles 
    : (design?.costoM2Materiales || 80) * 240 * 1.35;

  const costoMateriales = isBom ? design.costoDirectoMaterialesSoles : (design?.costoM2Materiales || 80) * 240;
  const costoManoObra = isBom ? design.costoManoObraMontajeSoles : (design?.costoM2ManoObra || 35) * 240;
  const costoEquipos = isBom ? design.costoEquiposGruaSoles : (design?.costoM2EquiposGrua || 15) * 240;
  const igv = 0;

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">ESTRUCTURA DE COSTOS Y PRESUPUESTO DIRECCIONADO</h2>
              <p className="text-xs text-slate-500 mt-0.5">Cálculo en Soles (S/.) para fabricación y montaje de estructuras metálicas.</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500 text-slate-950 px-5 py-2.5 rounded-2xl font-black text-right shadow-xs">
          <span className="text-[10px] uppercase block tracking-wider opacity-85 font-black">Precio de Venta Final:</span>
          <span className="text-2xl font-mono">S/. {precioFinal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TARJETA 1: MATERIALES */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="text-xs font-black text-amber-700 uppercase tracking-wider">1. Materiales e Insumos</div>
          <div className="text-2xl font-mono font-black text-slate-900">S/. {costoMateriales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-slate-500">Tubos, perfiles C/Z, planchas, pernos EPDM, soldadura AWS.</p>
        </div>

        {/* TARJETA 2: MANO DE OBRA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="text-xs font-black text-amber-700 uppercase tracking-wider">2. Mano de Obra y Montaje</div>
          <div className="text-2xl font-mono font-black text-slate-900">S/. {costoManoObra.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-slate-500">Cuadrilla de armadores, soldadores homologados y montajistas.</p>
        </div>

        {/* TARJETA 3: EQUIPOS Y GRÚA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="text-xs font-black text-amber-700 uppercase tracking-wider">3. Equipos y Maniobra Grúa</div>
          <div className="text-2xl font-mono font-black text-slate-900">S/. {costoEquipos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-slate-500">Alquiler de grúa telescópica, andamios normados y EPPs.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Resumen de Impuestos y Gastos Generales</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">GASTOS GENERALES (15%)</span>
            <span className="text-slate-900 font-bold">S/. {(costoMateriales * 0.15).toFixed(2)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">UTILIDAD EMPRESARIAL (10%)</span>
            <span className="text-amber-700 font-bold">S/. {(costoMateriales * 0.10).toFixed(2)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">IGV PERÚ (18%)</span>
            <span className="text-blue-700 font-bold">S/. {igv.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">MONTO VENTA FINAL</span>
            <span className="text-emerald-700 font-bold">S/. {precioFinal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechosCostosView;
