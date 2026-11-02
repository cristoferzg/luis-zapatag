// Vista de Costos de HERRERÍA
// Desglosa en los 9 rubros solicitados: Materiales, Corte, Soldadura, Armado, Esmerilado, Pintura, Accesorios, Instalación, Transporte
// Diseño claro, profesional y adaptable a móviles
import React from 'react';
import { 
  DollarSign, 
  Package, 
  Scissors, 
  Flame, 
  Hammer, 
  Sparkles, 
  Paintbrush, 
  Wrench, 
  Building2, 
  Truck
} from 'lucide-react';
import { HerreriaDesign, CostoDesglosado } from './herreriaTypes';
import { generarDespiece, generarMaterialesAgrupados, calcularCostosDesglosados } from './herreriaCalculations';

interface HerreriaCostosViewProps {
  design: HerreriaDesign;
  onUpdateDesign: (updated: HerreriaDesign) => void;
}

export const HerreriaCostosView: React.FC<HerreriaCostosViewProps> = ({ design, onUpdateDesign }) => {
  const despiece = generarDespiece(design);
  const materialesAgrupados = generarMaterialesAgrupados(design, despiece);
  const costos: CostoDesglosado = calcularCostosDesglosados(design, materialesAgrupados);

  // Manejo de actualización de rubros de mano de obra
  const handleUpdateMO = (campo: string, valor: number) => {
    onUpdateDesign({
      ...design,
      manoDeObra: {
        ...design.manoDeObra,
        [campo]: valor
      }
    });
  };

  const rubros = [
    {
      id: 'materiales',
      nombre: '1. Materiales (Acero, Planchas, Mallas, Vidrios, Consumibles)',
      descripcion: 'Costo directo de perfiles tubulares, planchas, soldadura y discos',
      monto: costos.materiales,
      icono: Package,
      color: 'text-blue-600 bg-blue-50',
      editable: false
    },
    {
      id: 'corte',
      nombre: '2. Corte y Dimensionado de Perfiles',
      descripcion: 'Horas de trazado y corte a 45°/90° con tronzadora y disco',
      monto: costos.corte,
      icono: Scissors,
      color: 'text-indigo-600 bg-indigo-50',
      editable: true,
      campoMO: 'costoCorteHoras'
    },
    {
      id: 'soldadura',
      nombre: '3. Soldadura y Fusión de Estructura',
      descripcion: 'Tiempo de armado, apuntalado y cordones continuos SMAW / MIG',
      monto: costos.soldadura,
      icono: Flame,
      color: 'text-amber-600 bg-amber-50',
      editable: true,
      campoMO: 'costoSoldaduraHoras'
    },
    {
      id: 'armado',
      nombre: '4. Armado, Escuadrado y Ensamble',
      descripcion: 'Verificación de diagonales, nivelación y escuadra del marco y hojas',
      monto: costos.armado,
      icono: Hammer,
      color: 'text-orange-600 bg-orange-50',
      editable: true,
      campoMO: 'costoArmadoHoras'
    },
    {
      id: 'esmerilado',
      nombre: '5. Esmerilado, Pulido y Limpieza de Escorias',
      descripcion: 'Desbaste de cordones con disco flap, lijado y masillado fino',
      monto: costos.esmerilado,
      icono: Sparkles,
      color: 'text-purple-600 bg-purple-50',
      editable: true,
      campoMO: 'costoEsmeriladoHoras'
    },
    {
      id: 'pintura',
      nombre: '6. Tratamiento Anticorrosivo y Pintura de Acabado',
      descripcion: 'Desengrase con solvente, 2 manos de base y esmalte a soplete',
      monto: costos.pintura,
      icono: Paintbrush,
      color: 'text-emerald-600 bg-emerald-50',
      editable: true,
      campoMO: 'costoPinturaHoras'
    },
    {
      id: 'accesorios',
      nombre: '7. Accesorios, Cerrajería y Rodajes',
      descripcion: 'Cerraduras Forte/Travex, bisagras tubulares, ruedas en V, cerrojos',
      monto: costos.accesorios,
      icono: Wrench,
      color: 'text-amber-600 bg-amber-50',
      editable: false
    },
    {
      id: 'instalacion',
      nombre: '8. Instalación y Fijación en Obra',
      descripcion: 'Anclaje con pernos de expansión, plomado, fijación y pruebas de cierre',
      monto: costos.instalacion,
      icono: Building2,
      color: 'text-teal-600 bg-teal-50',
      editable: true,
      campoMO: 'costoInstalacionHoras'
    },
    {
      id: 'transporte',
      nombre: '9. Transporte, Flete y Acarreo',
      descripcion: 'Movilización de la estructura terminada desde taller hasta obra',
      monto: costos.transporte,
      icono: Truck,
      color: 'text-sky-600 bg-sky-50',
      editable: true,
      campoMO: 'costoTransporte'
    }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-4 sm:p-6 overflow-y-auto text-slate-800 select-none">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-wide">
                ESTRUCTURA Y ANÁLISIS DE COSTOS
              </h2>
              <p className="text-xs text-slate-500">
                Desglose analítico de fabricación por rubros técnicos • Moneda: Soles (S/.)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-2xs text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Costo Directo Total</span>
            <span className="text-lg font-mono font-bold text-blue-600">S/. {costos.costoDirectoTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Materiales + Accesorios</span>
          <span className="text-xl font-mono font-bold text-slate-900">
            S/. {(costos.materiales + costos.accesorios).toFixed(2)}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Mano de Obra Taller</span>
          <span className="text-xl font-mono font-bold text-blue-600">
            S/. {(costos.corte + costos.soldadura + costos.armado + costos.esmerilado + costos.pintura).toFixed(2)}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Obra y Flete</span>
          <span className="text-xl font-mono font-bold text-teal-600">
            S/. {(costos.instalacion + costos.transporte).toFixed(2)}
          </span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Precio Sugerido Venta</span>
          <span className="text-xl font-mono font-bold text-emerald-600">
            S/. {costos.precioTotalVenta.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Lista de los 9 Rubros */}
      <div className="space-y-2.5 my-3">
        {rubros.map(rubro => {
          const Icon = rubro.icono;
          const porcentaje = Math.round((rubro.monto / Math.max(1, costos.costoDirectoTotal)) * 1000) / 10;

          return (
            <div
              key={rubro.id}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${rubro.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 tracking-wide">{rubro.nombre}</h4>
                  <p className="text-[11px] text-slate-500">{rubro.descripcion}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* Barra de Porcentaje */}
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">{porcentaje}% del total</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div style={{ width: `${porcentaje}%` }} className="h-full bg-blue-600 rounded-full" />
                  </div>
                </div>

                {/* Input Editable o Monto */}
                {rubro.editable && rubro.campoMO ? (
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-300">
                    <span className="text-xs text-slate-500 font-mono">S/.</span>
                    <input
                      type="number"
                      step="10"
                      value={rubro.monto}
                      onChange={e => handleUpdateMO(rubro.campoMO!, parseFloat(e.target.value) || 0)}
                      className="w-20 bg-transparent text-slate-900 font-mono font-bold text-xs text-right focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="font-mono text-sm font-bold text-slate-900 px-2">
                    S/. {rubro.monto.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen Final de Utilidad e Impuestos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 my-4 space-y-2 text-xs shadow-2xs">
        <div className="flex justify-between text-slate-600">
          <span>Gastos Generales de Taller (10%):</span>
          <span className="font-mono font-semibold text-slate-900">S/. {costos.gastosGenerales.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Utilidad Estimada del Contratista (20%):</span>
          <span className="font-mono font-semibold text-blue-600">S/. {costos.utilidad.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-800 font-bold pt-2 border-t border-slate-200">
          <span>Subtotal antes de Impuestos:</span>
          <span className="font-mono text-slate-900">S/. {costos.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>I.G.V. (18% opcional):</span>
          <span className="font-mono">S/. {costos.igv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-emerald-700 font-bold text-sm pt-2 border-t border-slate-200">
          <span>PRECIO TOTAL ESTIMADO DE VENTA:</span>
          <span className="font-mono text-base font-extrabold text-emerald-600">S/. {costos.precioTotalVenta.toFixed(2)} PEN</span>
        </div>
      </div>
    </div>
  );
};
