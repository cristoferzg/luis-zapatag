// Resumen Agrupado de Materiales Exclusivo para Techos Metálicos
// Incluye módulo para adjuntar perfiles comerciales adicionales (Serie LAC/LAF) e insumos personalizados
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Building2, 
  ShieldCheck, 
  PlusCircle, 
  Trash2, 
  Search, 
  X, 
  Tag 
} from 'lucide-react';
import { safeStorage } from '../../lib/storageManager';

interface TechosMaterialesViewProps {
  design?: any;
}

export interface InsumoTechoAdicional {
  id: string;
  nombre: string;
  codigoComercial?: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion?: string;
}

// CATÁLOGO COMERCIAL DESTACADO DE ACERO EN PERÚ (SERIE LAC/LAF ASTM A500 Gr. B / A36)
const CATALAGO_COMERCIAL_TECHOS = [
  {
    nombre: 'Tubo Cuadrado 3" x 3" x 2.0mm (75x75)',
    codigoComercial: 'LAC-75X75X2.0',
    unidad: 'Barra 6m',
    precioSugerido: 98.00,
    observacion: 'Tubo Estructural ASTM A500 Gr. B - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 3" x 3" x 2.5mm (75x75)',
    codigoComercial: 'LAC-75X75X2.5',
    unidad: 'Barra 6m',
    precioSugerido: 118.00,
    observacion: 'Tubo Estructural Reforzado LAC ASTM A500 - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 3" x 3" x 3.0mm (75x75)',
    codigoComercial: 'LAC-75X75X3.0',
    unidad: 'Barra 6m',
    precioSugerido: 142.00,
    observacion: 'Tubo Peso Pesado Industrial LAC ASTM A500 - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 4" x 4" x 2.0mm (100x100)',
    codigoComercial: 'LAC-100X100X2.0',
    unidad: 'Barra 6m',
    precioSugerido: 135.00,
    observacion: 'Columna y Parante Cuadrado LAC - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 4" x 4" x 2.5mm (100x100)',
    codigoComercial: 'LAC-100X100X2.5',
    unidad: 'Barra 6m',
    precioSugerido: 162.00,
    observacion: 'Columna Estructural Reforzada LAC - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 4" x 4" x 3.0mm (100x100)',
    codigoComercial: 'LAC-100X100X3.0',
    unidad: 'Barra 6m',
    precioSugerido: 195.00,
    observacion: 'Columna Industrial Pesada LAC - 6.00m'
  },
  {
    nombre: 'Tubo Rectangular 3" x 1.5" x 2.0mm (75x38)',
    codigoComercial: 'LAC-75X38X2.0',
    unidad: 'Barra 6m',
    precioSugerido: 78.00,
    observacion: 'Marco y Tijeral Rectangular LAC - 6.00m'
  },
  {
    nombre: 'Tubo Rectangular 4" x 2" x 2.0mm (100x50)',
    codigoComercial: 'LAC-100X50X2.0',
    unidad: 'Barra 6m',
    precioSugerido: 98.00,
    observacion: 'Correa / Viga Rectangular LAC - 6.00m'
  },
  {
    nombre: 'Tubo Rectangular 4" x 2" x 2.5mm (100x50)',
    codigoComercial: 'LAC-100X50X2.5',
    unidad: 'Barra 6m',
    precioSugerido: 122.00,
    observacion: 'Viga Rectangular Pesada LAC - 6.00m'
  },
  {
    nombre: 'Tubo Redondo 2" x 2.0mm SCH40',
    codigoComercial: 'LAC-RED-60.3X2.0',
    unidad: 'Barra 6m',
    precioSugerido: 72.00,
    observacion: 'Tubo Redondo para Columna/Poste - 6.00m'
  },
  {
    nombre: 'Ángulo Estructural 1 1/2" x 1 1/2" x 3/16"',
    codigoComercial: 'ANG-38X38X4.8',
    unidad: 'Barra 6m',
    precioSugerido: 58.00,
    observacion: 'Ángulo de Acero Aceros Arequipa / Siderperu'
  },
  {
    nombre: 'Plancha Aluzinc TR4 0.40mm Rojo Teja / Azul / Gris',
    codigoComercial: 'TR4-ALUZINC-0.40',
    unidad: 'm2',
    precioSugerido: 38.00,
    observacion: 'Plancha de Cobertura Termoacústica TR4'
  },
  {
    nombre: 'Pernos Autoperforantes 12-14x2" con Arandela EPDM',
    codigoComercial: 'PERNO-EPDM-100',
    unidad: 'Caja 100u',
    precioSugerido: 35.00,
    observacion: 'Fijación de Cobertura TR4 con Neopreno'
  }
];

export const TechosMaterialesView: React.FC<TechosMaterialesViewProps> = ({ design }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const designId = design?.id || 'techos_current_design';
  const storageKey = `techos_extra_materials_${designId}`;

  const [itemsAdicionales, setItemsAdicionales] = useState<InsumoTechoAdicional[]>(() => {
    return safeStorage.getItem<InsumoTechoAdicional[]>(storageKey, []);
  });

  // Form State
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<typeof CATALAGO_COMERCIAL_TECHOS[0] | null>(null);
  const [nombreManual, setNombreManual] = useState('');
  const [codigoComercialManual, setCodigoComercialManual] = useState('');
  const [unidadManual, setUnidadManual] = useState('Barra 6m');
  const [cantidadManual, setCantidadManual] = useState<number>(1);
  const [precioManual, setPrecioManual] = useState<number>(100);
  const [observacionManual, setObservacionManual] = useState('');

  useEffect(() => {
    safeStorage.setItem(storageKey, itemsAdicionales);
  }, [itemsAdicionales, storageKey]);

  const subtotalAdicionales = itemsAdicionales.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSelectCatalogItem = (item: typeof CATALAGO_COMERCIAL_TECHOS[0]) => {
    setSelectedCatalogItem(item);
    setNombreManual(item.nombre);
    setCodigoComercialManual(item.codigoComercial);
    setUnidadManual(item.unidad);
    setPrecioManual(item.precioSugerido);
    setObservacionManual(item.observacion);
    setCantidadManual(1);
  };

  const handleAgregarInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreManual.trim() || cantidadManual <= 0 || precioManual < 0) return;

    const nuevoItem: InsumoTechoAdicional = {
      id: 'tech_extra_' + Date.now(),
      nombre: nombreManual.trim(),
      codigoComercial: codigoComercialManual.trim() || undefined,
      unidad: unidadManual,
      cantidad: cantidadManual,
      precioUnitario: precioManual,
      subtotal: cantidadManual * precioManual,
      observacion: observacionManual.trim() || undefined
    };

    setItemsAdicionales(prev => [...prev, nuevoItem]);
    setShowModal(false);

    // Reset Form
    setSelectedCatalogItem(null);
    setNombreManual('');
    setCodigoComercialManual('');
    setCantidadManual(1);
    setPrecioManual(100);
    setObservacionManual('');
  };

  const handleEliminarItem = (id: string) => {
    setItemsAdicionales(prev => prev.filter(i => i.id !== id));
  };

  const filteredCatalog = CATALAGO_COMERCIAL_TECHOS.filter(item => 
    item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.codigoComercial.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isBom = design && Array.isArray(design.resumenCoberturas);

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      
      {/* CABECERA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">RESUMEN CONSOLIDADO DE MATERIALES - TECHOS</h2>
            <p className="text-xs text-slate-500">Perfilería calculada + Tubos comerciales de la serie LAC/LAF adjuntados.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>➕ Adjuntar Perfil / Insumo Adicional</span>
          </button>

          {itemsAdicionales.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Subtotal Adjuntados:</span>
              <span className="text-sm font-mono font-black text-indigo-900">S/. {subtotalAdicionales.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN DE INSUMOS Y PERFILES ADICIONALES ADJUNTADOS */}
      {itemsAdicionales.length > 0 && (
        <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Insumos y Perfiles Comerciales Adjuntados Manualmente ({itemsAdicionales.length})
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700">
              Subtotal: S/. {subtotalAdicionales.toFixed(2)} PEN
            </span>
          </div>

          <div className="overflow-x-auto bg-white rounded-xl border border-indigo-100 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-indigo-800 uppercase border-b border-indigo-100 font-bold bg-indigo-100/50">
                <tr>
                  <th className="py-2.5 px-3">Insumo / Perfil Adjuntado</th>
                  <th className="py-2.5 px-3">Código Comercial</th>
                  <th className="py-2.5 px-3 text-center">Unidad</th>
                  <th className="py-2.5 px-3 text-center">Cantidad</th>
                  <th className="py-2.5 px-3 text-right">Precio Unit. (S/.)</th>
                  <th className="py-2.5 px-3 text-right">Subtotal (S/.)</th>
                  <th className="py-2.5 px-3">Observación</th>
                  <th className="py-2.5 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                {itemsAdicionales.map((item, idx) => (
                  <tr key={item.id ? `item-${item.id}-${idx}` : `item-${idx}`} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{item.nombre}</td>
                    <td className="py-2.5 px-3 text-indigo-600 font-bold text-[11px]">{item.codigoComercial || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-sans">{item.unidad}</td>
                    <td className="py-2.5 px-3 text-center font-bold bg-indigo-50/50">{item.cantidad}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">S/. {item.precioUnitario.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">S/. {item.subtotal.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">{item.observacion || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleEliminarItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Quitar este material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO MODELO CAD O LEGACY */}
      {isBom ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PERFILERÍA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-amber-600" />
              1. Perfilería Estructural en Modelo (Barras 6m)
            </h3>
            <div className="space-y-2">
              {design.despiecePerfiles.length === 0 ? (
                <p className="text-xs text-slate-400 p-3">Sin perfiles en el modelo.</p>
              ) : (
                design.despiecePerfiles.map((p: any) => (
                  <div key={p.profileId} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{p.nombrePerfil}</div>
                      <div className="text-[10px] text-slate-500">Req: {p.totalMetrosRequeridosM.toFixed(1)}m | Peso: {p.totalPesoAceroKg.toFixed(1)}kg</div>
                    </div>
                    <span className="font-mono font-black text-amber-700">{p.totalBarrasComerciales6m} barras 6m</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COBERTURAS Y FIJACIONES */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              2. Coberturas de Aluzinc & Cumbrera
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-3 bg-sky-50/70 rounded-xl border border-sky-200">
                <div>
                  <div className="font-bold text-slate-950">Planchas de Aluzinc TR-4 (Ancho útil 1.10m)</div>
                  <div className="text-[10px] text-slate-600">Área total proyectada del techo con pendiente</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sky-800 block text-sm">
                    {design.resumenCoberturas?.[0]?.areaTotalM2 ? `${design.resumenCoberturas[0].areaTotalM2.toFixed(1)} m²` : 'Calculado s/ modelo'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">Pernos Autoperforantes EPDM</div>
                  <div className="text-[10px] text-slate-500">Fijación con arandela de neopreno</div>
                </div>
                <span className="font-mono font-black text-amber-700">{design.cajasPernosEpdmTotales || 2} Cajas (100 unids)</span>
              </div>
            </div>
          </div>

          {/* CANALETAS Y BAJADAS DE AGUA */}
          {design.canaletas && design.canaletas.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs lg:col-span-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                Canaletas y bajadas de agua
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {design.canaletas.map((l: any) => (
                  <div key={l.clave} className="flex justify-between items-center gap-2 p-3 bg-sky-50/60 rounded-xl border border-sky-200">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">{l.nombre}</div>
                      <div className="text-[10px] text-slate-500">{l.nota}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-sky-800 block">{l.cantidad} {l.unidad}</span>
                      <span className="text-[10px] text-slate-500">{l.precio ? `S/ ${l.subtotal.toFixed(2)}` : 'sin precio'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MECANISMO DE TECHO MOVIBLE */}
          {design.mecanismoMovil && design.mecanismoMovil.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs lg:col-span-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Mecanismo de techo movible
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {design.mecanismoMovil.map((l: any) => (
                  <div key={l.clave} className="flex justify-between items-center gap-2 p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">{l.nombre}</div>
                      <div className="text-[10px] text-slate-500">{l.nota}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-teal-800 block">{l.cantidad} {l.unidad}</span>
                      <span className="text-[10px] text-slate-500">{l.precio ? `S/ ${l.subtotal.toFixed(2)}` : 'sin precio'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TENSORES (varilla / cable) */}
          {design.tensores && design.tensores.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs lg:col-span-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                3. Tensores y templadores
              </h3>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {design.tensores.map((l: any) => (
                  <div key={l.clave} className="flex justify-between items-center gap-2 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">{l.nombre}</div>
                      <div className="text-[10px] text-slate-500">{l.nota}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-emerald-800 block">{l.cantidad} {l.unidad}</span>
                      <span className="text-[10px] text-slate-500">{l.precio ? `S/ ${l.subtotal.toFixed(2)}` : 'sin precio'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-amber-600" />
            Perfilería Estructural Calculada
          </h3>
          <p className="text-xs text-slate-500">
            Dibuja tu modelo de techo en el CAD 2D/3D o presiona el botón <span className="font-bold text-indigo-600">"➕ Adjuntar Perfil / Insumo Adicional"</span> para agregar tubos de la serie LAC/LAF directamente.
          </p>
        </div>
      )}

      {/* MODAL PARA ADJUNTAR MATERIALES / CATÁLOGO COMERCIAL ESPESORES LAC/LAF */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black tracking-wide">
                  Adjuntar Perfil o Material Comercial Adicional a Techos
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              
              {/* Buscador de Catálogo Comercial */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  1. Buscar en Catálogo Comercial de Perfiles para Techos (Serie LAC / LAF / ASTM A500)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ejemplo: 3x3, 75x75, LAC-75X75X2.5, 4x2, TR4, pernos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Lista Seleccionable de Perfiles del Catálogo */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {filteredCatalog.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 font-medium">
                    No se encontraron perfiles coincidentes. Puedes ingresar el nombre manualmente abajo.
                  </div>
                ) : (
                  filteredCatalog.map((catItem, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCatalogItem(catItem)}
                      className={`w-full p-2.5 text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        selectedCatalogItem?.codigoComercial === catItem.codigoComercial
                          ? 'bg-indigo-100/80 border-l-4 border-indigo-600 font-bold'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{catItem.nombre}</div>
                        <div className="text-[10px] text-indigo-700 font-mono font-bold mt-0.5">
                          Código: {catItem.codigoComercial} · {catItem.unidad}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 shrink-0">
                        S/. {catItem.precioSugerido.toFixed(2)}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Formulario de Detalle e Ingreso */}
              <form onSubmit={handleAgregarInsumo} className="space-y-3 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nombre / Descripción del Material *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Tubo Cuadrado 3x3x2.5mm"
                      value={nombreManual}
                      onChange={(e) => setNombreManual(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Código Comercial (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. LAC-75X75X2.5"
                      value={codigoComercialManual}
                      onChange={(e) => setCodigoComercialManual(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Unidad
                    </label>
                    <select
                      value={unidadManual}
                      onChange={(e) => setUnidadManual(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      <option value="Barra 6m">Barra 6m</option>
                      <option value="m2">m2</option>
                      <option value="Plancha 4x8">Plancha 4x8</option>
                      <option value="Unid">Unid</option>
                      <option value="Caja 100u">Caja 100u</option>
                      <option value="Kg">Kg</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={cantidadManual}
                      onChange={(e) => setCantidadManual(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Precio Unit. (S/.) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      value={precioManual}
                      onChange={(e) => setPrecioManual(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-emerald-600 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Detalle / Observación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Tubos para parantes de soporte adicional en obra"
                    value={observacionManual}
                    onChange={(e) => setObservacionManual(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-800">
                    Subtotal Insumo: <span className="text-emerald-600 font-mono text-sm">S/. {(cantidadManual * precioManual).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Confirmar y Adjuntar
                    </button>
                  </div>
                </div>

              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
