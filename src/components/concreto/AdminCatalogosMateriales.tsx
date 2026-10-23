// Administrador de Catálogos: Drywall y Ladrillo
// Permite al usuario editar precios y agregar nuevos materiales

import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { DryallItem } from '../../catalogo/drywall';
import { LadrilloItem } from '../../catalogo/ladrillo';

interface AdminCatalogoProps {
  drywallCatalogo: DryallItem[];
  ladrilloCatalogo: LadrilloItem[];
  onActualizarDrywall: (catalogo: DryallItem[]) => void;
  onActualizarLadrillo: (catalogo: LadrilloItem[]) => void;
}

export const AdminCatalogosMateriales: React.FC<AdminCatalogoProps> = ({
  drywallCatalogo,
  ladrilloCatalogo,
  onActualizarDrywall,
  onActualizarLadrillo
}) => {
  const [pestana, setPestana] = useState<'drywall' | 'ladrillo'>('drywall');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [tempPrecio, setTempPrecio] = useState<number>(0);

  const guardarPrecioDrywall = (id: string, nuevoPrecio: number) => {
    const actualizado = drywallCatalogo.map(d =>
      d.id === id ? { ...d, precioM2: nuevoPrecio } : d
    );
    onActualizarDrywall(actualizado);
    setEditandoId(null);
  };

  const guardarPrecioLadrillo = (id: string, nuevoPrecio: number) => {
    const actualizado = ladrilloCatalogo.map(l =>
      l.id === id ? { ...l, precioxMil: nuevoPrecio } : l
    );
    onActualizarLadrillo(actualizado);
    setEditandoId(null);
  };

  return (
    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
      <h3 className="text-xs font-bold uppercase text-slate-700">Administrar Catálogos de Materiales</h3>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-slate-300">
        <button
          onClick={() => setPestana('drywall')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            pestana === 'drywall'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-700'
          }`}
        >
          Drywall
        </button>
        <button
          onClick={() => setPestana('ladrillo')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            pestana === 'ladrillo'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-600 hover:text-slate-700'
          }`}
        >
          Ladrillo
        </button>
      </div>

      {/* Contenido DRYWALL */}
      {pestana === 'drywall' && (
        <div className="space-y-2">
          <div className="text-[11px] text-slate-600 italic">
            Edita los precios de drywall por metro cuadrado (m²)
          </div>
          {drywallCatalogo.map(drywall => (
            <div
              key={drywall.id}
              className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
            >
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-700">{drywall.tipo}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Espesor: {drywall.espesor}mm · Peso: {drywall.pesoM2} kg/m²
                </div>
              </div>

              {editandoId === drywall.id ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center border border-blue-300 rounded bg-white">
                    <span className="text-[10px] text-slate-600 px-1.5 py-1">S/ </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={tempPrecio}
                      onChange={(e) => setTempPrecio(parseFloat(e.target.value))}
                      className="w-16 px-1.5 py-1 text-xs border-0 outline-none"
                      autoFocus
                    />
                    <span className="text-[10px] text-slate-600 px-1.5 py-1">/m²</span>
                  </div>
                  <button
                    onClick={() => guardarPrecioDrywall(drywall.id, tempPrecio)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Guardar"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="p-1 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="text-xs font-bold text-blue-600 min-w-12 text-right">
                    S/ {drywall.precioM2 === 0 ? '?' : drywall.precioM2.toFixed(2)}
                  </div>
                  <button
                    onClick={() => {
                      setEditandoId(drywall.id);
                      setTempPrecio(drywall.precioM2);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar precio"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contenido LADRILLO */}
      {pestana === 'ladrillo' && (
        <div className="space-y-2">
          <div className="text-[11px] text-slate-600 italic">
            Edita los precios de ladrillo por 1000 unidades
          </div>
          {ladrilloCatalogo.map(ladrillo => (
            <div
              key={ladrillo.id}
              className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
            >
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-700">{ladrillo.tipo}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {ladrillo.dimensiones} · {ladrillo.pesoUnitario} kg/unid · {ladrillo.uso}
                </div>
              </div>

              {editandoId === ladrillo.id ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center border border-blue-300 rounded bg-white">
                    <span className="text-[10px] text-slate-600 px-1.5 py-1">S/ </span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={tempPrecio}
                      onChange={(e) => setTempPrecio(parseFloat(e.target.value))}
                      className="w-20 px-1.5 py-1 text-xs border-0 outline-none"
                      autoFocus
                    />
                    <span className="text-[10px] text-slate-600 px-1.5 py-1">/1000</span>
                  </div>
                  <button
                    onClick={() => guardarPrecioLadrillo(ladrillo.id, tempPrecio)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Guardar"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="p-1 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className="text-xs font-bold text-blue-600 min-w-16 text-right">
                    S/ {ladrillo.precioxMil === 0 ? '?' : ladrillo.precioxMil.toFixed(2)}
                  </div>
                  <button
                    onClick={() => {
                      setEditandoId(ladrillo.id);
                      setTempPrecio(ladrillo.precioxMil);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar precio"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-[10px] text-blue-700">
        <strong>💡 Tip:</strong> Edita los precios según tu proveedor actual. Los cambios se aplican
        inmediatamente a los cálculos de presupuesto.
      </div>
    </div>
  );
};
