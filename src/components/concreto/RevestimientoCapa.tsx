// Editor de Capas de Revestimiento (Drywall / Ladrillo)
// Se agrega a elementos de concreto para crear muros multi-capas

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DryallItem, DRYWALL_DEFAULTS } from '../../catalogo/drywall';
import { LadrilloItem, LADRILLO_DEFAULTS } from '../../catalogo/ladrillo';

export type TipoRevestimiento = 'drywall' | 'ladrillo' | 'ninguno';

export interface CapaRevestimiento {
  id: string;
  tipo: TipoRevestimiento;
  materialId: string;
  areaM2?: number;
  cantidadUnidades?: number;
  precioUnitario: number;
  costoTotal: number;
}

interface RevestimientoCapaProps {
  capas: CapaRevestimiento[];
  onAgregarCapa: (capa: CapaRevestimiento) => void;
  onEliminarCapa: (capaId: string) => void;
  drywallCatalogo?: DryallItem[];
  ladrilloCatalogo?: LadrilloItem[];
}

export const RevestimientoCapa: React.FC<RevestimientoCapaProps> = ({
  capas,
  onAgregarCapa,
  onEliminarCapa,
  drywallCatalogo = DRYWALL_DEFAULTS,
  ladrilloCatalogo = LADRILLO_DEFAULTS
}) => {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoRevestimiento>('drywall');
  const [materialSeleccionado, setMaterialSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);

  const agregarCapa = () => {
    if (!materialSeleccionado) return;

    let material: DryallItem | LadrilloItem | undefined;
    let costoUnitario = 0;
    let costoTotal = 0;

    if (tipoSeleccionado === 'drywall') {
      material = drywallCatalogo.find(d => d.id === materialSeleccionado);
      if (material) {
        costoUnitario = (material as DryallItem).precioM2;
        costoTotal = costoUnitario * cantidad;
      }
    } else if (tipoSeleccionado === 'ladrillo') {
      material = ladrilloCatalogo.find(l => l.id === materialSeleccionado);
      if (material) {
        costoUnitario = ((material as LadrilloItem).precioxMil / 1000);
        costoTotal = costoUnitario * cantidad;
      }
    }

    if (material) {
      const nuevaCapa: CapaRevestimiento = {
        id: `capa_${Date.now()}`,
        tipo: tipoSeleccionado,
        materialId: materialSeleccionado,
        areaM2: tipoSeleccionado === 'drywall' ? cantidad : undefined,
        cantidadUnidades: tipoSeleccionado === 'ladrillo' ? Math.round(cantidad) : undefined,
        precioUnitario: costoUnitario,
        costoTotal
      };

      onAgregarCapa(nuevaCapa);
      setMostrarForm(false);
      setMaterialSeleccionado('');
      setCantidad(1);
    }
  };

  const getMaterialNombre = (tipo: TipoRevestimiento, materialId: string): string => {
    if (tipo === 'drywall') {
      return drywallCatalogo.find(d => d.id === materialId)?.tipo || 'Drywall';
    } else if (tipo === 'ladrillo') {
      return ladrilloCatalogo.find(l => l.id === materialId)?.tipo || 'Ladrillo';
    }
    return 'Desconocido';
  };

  const costoTotalCapas = capas.reduce((sum, capa) => sum + capa.costoTotal, 0);
  const pesoTotalCapas = capas.reduce((sum, capa) => {
    if (capa.tipo === 'drywall') {
      const mat = drywallCatalogo.find(d => d.id === capa.materialId);
      return sum + ((mat?.pesoM2 || 0) * (capa.areaM2 || 0));
    } else if (capa.tipo === 'ladrillo') {
      const mat = ladrilloCatalogo.find(l => l.id === capa.materialId);
      return sum + ((mat?.pesoUnitario || 0) * (capa.cantidadUnidades || 0));
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-slate-700">Capas de Revestimiento</h3>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
          title="Agregar capa"
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Tipo</label>
            <select
              value={tipoSeleccionado}
              onChange={(e) => {
                setTipoSeleccionado(e.target.value as TipoRevestimiento);
                setMaterialSeleccionado('');
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
            >
              <option value="drywall">Drywall (m²)</option>
              <option value="ladrillo">Ladrillo (unidades)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Material</label>
            <select
              value={materialSeleccionado}
              onChange={(e) => setMaterialSeleccionado(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
            >
              <option value="">Seleccionar...</option>
              {tipoSeleccionado === 'drywall'
                ? drywallCatalogo.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.tipo} ({d.espesor}mm) - S/ {d.precioM2 || '?'}/m²
                    </option>
                  ))
                : ladrilloCatalogo.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.tipo} ({l.dimensiones}) - S/ {l.precioxMil || '?'}/1000
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {tipoSeleccionado === 'drywall' ? 'Área (m²)' : 'Cantidad (unidades)'}
            </label>
            <input
              type="number"
              min="0.1"
              step={tipoSeleccionado === 'drywall' ? '0.5' : '1'}
              value={cantidad}
              onChange={(e) => setCantidad(parseFloat(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={agregarCapa}
              className="flex-1 px-2 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold cursor-pointer transition-colors"
            >
              Agregar Capa
            </button>
            <button
              onClick={() => setMostrarForm(false)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-slate-300 hover:bg-slate-400 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {capas.length > 0 ? (
        <div className="space-y-2">
          {capas.map(capa => (
            <div key={capa.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-700">
                    {getMaterialNombre(capa.tipo, capa.materialId)}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {capa.tipo === 'drywall'
                      ? `${capa.areaM2?.toFixed(2) || '?'} m² · S/ ${capa.costoTotal.toFixed(2)}`
                      : `${capa.cantidadUnidades?.toLocaleString('es-PE') || '?'} unid · S/ ${capa.costoTotal.toFixed(2)}`}
                  </div>
                </div>
                <button
                  onClick={() => onEliminarCapa(capa.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  title="Eliminar capa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-2 italic">Sin revestimientos agregados</p>
      )}

      {capas.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-[10px] space-y-1">
          <div className="flex justify-between text-blue-700">
            <span><strong>Total Capas:</strong></span>
            <span>S/ {costoTotalCapas.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-blue-600">
            <span><strong>Peso Total:</strong></span>
            <span>{pesoTotalCapas.toFixed(1)} kg</span>
          </div>
        </div>
      )}
    </div>
  );
};
