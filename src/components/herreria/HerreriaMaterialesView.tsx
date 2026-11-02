// Vista de Materiales Agrupados de HERRERÍA
// Permite adjuntar perfiles comerciales adicionales (Serie LAC/LAF) e insumos personalizados
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Layers, 
  Grid, 
  Sparkles, 
  Wrench, 
  Lock, 
  Cog, 
  ArrowRightLeft, 
  ShieldAlert, 
  Flame, 
  Paintbrush,
  Copy,
  Check,
  PlusCircle,
  Trash2,
  Search,
  X,
  Tag
} from 'lucide-react';
import { HerreriaDesign, MaterialAgrupado } from './herreriaTypes';
import { generarDespiece, generarMaterialesAgrupados } from './herreriaCalculations';
import { safeStorage } from '../../lib/storageManager';

interface HerreriaMaterialesViewProps {
  design: HerreriaDesign;
}

export interface InsumoAdicional {
  id: string;
  nombre: string;
  codigoComercial?: string;
  categoria: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion?: string;
}

// CATÁLOGO COMERCIAL DESTACADO DE ACERO EN PERÚ (SERIE LAC/LAF ASTM A500 Gr. B / A36)
const CATALAGO_COMERCIAL_ADICIONAL = [
  {
    nombre: 'Tubo Cuadrado 3" x 3" x 2.0mm (75x75)',
    codigoComercial: 'LAC-75X75X2.0',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 98.00,
    observacion: 'Tubo Estructural ASTM A500 Gr. B - 6.00 metros'
  },
  {
    nombre: 'Tubo Cuadrado 3" x 3" x 2.5mm (75x75)',
    codigoComercial: 'LAC-75X75X2.5',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 118.00,
    observacion: 'Tubo Estructural Reforzado LAC ASTM A500 - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 3" x 3" x 3.0mm (75x75)',
    codigoComercial: 'LAC-75X75X3.0',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 142.00,
    observacion: 'Tubo Peso Pesado Industrial LAC ASTM A500 - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 4" x 4" x 2.0mm (100x100)',
    codigoComercial: 'LAC-100X100X2.0',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 135.00,
    observacion: 'Columna y Parante Cuadrado LAC - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 4" x 4" x 2.5mm (100x100)',
    codigoComercial: 'LAC-100X100X2.5',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 162.00,
    observacion: 'Columna Estructural Reforzada LAC - 6.00m'
  },
  {
    nombre: 'Tubo Cuadrado 4" x 4" x 3.0mm (100x100)',
    codigoComercial: 'LAC-100X100X3.0',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 195.00,
    observacion: 'Columna Industrial Pesada LAC - 6.00m'
  },
  {
    nombre: 'Tubo Rectangular 3" x 1.5" x 2.0mm (75x38)',
    codigoComercial: 'LAC-75X38X2.0',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 78.00,
    observacion: 'Marco y Tijeral Rectangular LAC - 6.00m'
  },
  {
    nombre: 'Tubo Rectangular 4" x 2" x 2.0mm (100x50)',
    codigoComercial: 'LAC-100X50X2.0',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 98.00,
    observacion: 'Marco de Portón y Viga Rectangular LAC - 6.00m'
  },
  {
    nombre: 'Tubo Rectangular 4" x 2" x 2.5mm (100x50)',
    codigoComercial: 'LAC-100X50X2.5',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 122.00,
    observacion: 'Viga Rectangular Pesada LAC - 6.00m'
  },
  {
    nombre: 'Tubo Redondo 2" x 2.0mm SCH40',
    codigoComercial: 'LAC-RED-60.3X2.0',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 72.00,
    observacion: 'Tubo Redondo para Poste/Columna - 6.00m'
  },
  {
    nombre: 'Ángulo Estructural 1 1/2" x 1 1/2" x 3/16"',
    codigoComercial: 'ANG-38X38X4.8',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 58.00,
    observacion: 'Ángulo de Acero Aceros Arequipa / Siderperu'
  },
  {
    nombre: 'Platina de Acero 2" x 1/4"',
    codigoComercial: 'PL-50X6.3',
    categoria: 'perfiles',
    unidad: 'Barra 6m',
    precioSugerido: 64.00,
    observacion: 'Platina de Hierro Laminado - 6.00m'
  },
  {
    nombre: 'Plancha LAC ASTM A36 1/8" (2.5mm) 1.20 x 2.40m',
    codigoComercial: 'PLANCHA-LAC-2.5MM',
    categoria: 'planchas',
    unidad: 'Plancha 4x8',
    precioSugerido: 185.00,
    observacion: 'Plancha Negra Estructural - 1.20m x 2.40m'
  },
  {
    nombre: 'Electrodo E6011 1/8" (Caja 20kg)',
    codigoComercial: 'AWS-E6011-20KG',
    categoria: 'soldadura',
    unidad: 'Caja 20kg',
    precioSugerido: 220.00,
    observacion: 'Electrodo Penetración Taller Soldadura'
  },
  {
    nombre: 'Base Anticorrosiva Minio Gris (Galón)',
    codigoComercial: 'PINT-PRIMER-GAL',
    categoria: 'pintura',
    unidad: 'Galón',
    precioSugerido: 68.00,
    observacion: 'Pintura Base Protección Estructural'
  }
];

export const HerreriaMaterialesView: React.FC<HerreriaMaterialesViewProps> = ({ design }) => {
  const [copiado, setCopiado] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Storage Key for Additional Attached Items
  const storageKey = `herreria_extra_materials_${design.id || 'default'}`;

  // Load Saved Additional Items
  const [itemsAdicionales, setItemsAdicionales] = useState<InsumoAdicional[]>(() => {
    return safeStorage.getItem<InsumoAdicional[]>(storageKey, []);
  });

  // Form State for Adding Item
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<typeof CATALAGO_COMERCIAL_ADICIONAL[0] | null>(null);
  const [nombreManual, setNombreManual] = useState('');
  const [codigoComercialManual, setCodigoComercialManual] = useState('');
  const [categoriaManual, setCategoriaManual] = useState('perfiles');
  const [unidadManual, setUnidadManual] = useState('Barra 6m');
  const [cantidadManual, setCantidadManual] = useState<number>(1);
  const [precioManual, setPrecioManual] = useState<number>(100);
  const [observacionManual, setObservacionManual] = useState('');

  useEffect(() => {
    safeStorage.setItem(storageKey, itemsAdicionales);
  }, [itemsAdicionales, storageKey]);

  const despiece = generarDespiece(design);
  const categoriasMateriales: MaterialAgrupado[] = generarMaterialesAgrupados(design, despiece);

  // Integrate Additional Items into Categories or Add Additional Category
  const subtotalAutomatico = categoriasMateriales.reduce((acc, cat) => acc + cat.subtotalCategoria, 0);
  const subtotalAdicionales = itemsAdicionales.reduce((acc, item) => acc + item.subtotal, 0);
  const subtotalTotalPEN = subtotalAutomatico + subtotalAdicionales;

  const handleCopiarMateriales = () => {
    let texto = `LISTADO DE MATERIALES Y REQUERIMIENTO CONSOLIDADO - ${design.nombre}\n\n`;
    
    categoriasMateriales.forEach(cat => {
      if (cat.items.length > 0) {
        texto += `--- ${getCategoriaNombre(cat.categoria).toUpperCase()} ---\n`;
        cat.items.forEach(it => {
          texto += `${it.nombre} | Cant: ${it.cantidad} ${it.unidad} | P.Unit: S/. ${it.precioUnitario.toFixed(2)} | Subtotal: S/. ${it.subtotal.toFixed(2)}\n`;
        });
        texto += `Subtotal: S/. ${cat.subtotalCategoria.toFixed(2)}\n\n`;
      }
    });

    if (itemsAdicionales.length > 0) {
      texto += `--- INSUMOS Y PERFILES ADICIONALES ADJUNTADOS ---\n`;
      itemsAdicionales.forEach(it => {
        texto += `${it.nombre} (${it.codigoComercial || 'N/A'}) | Cant: ${it.cantidad} ${it.unidad} | P.Unit: S/. ${it.precioUnitario.toFixed(2)} | Subtotal: S/. ${it.subtotal.toFixed(2)} | Obs: ${it.observacion || '-'}\n`;
      });
      texto += `Subtotal Adicionales: S/. ${subtotalAdicionales.toFixed(2)}\n\n`;
    }

    texto += `TOTAL MATERIALES CONSOLIDADO ESTIMADO: S/. ${subtotalTotalPEN.toFixed(2)} PEN`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSelectCatalogItem = (item: typeof CATALAGO_COMERCIAL_ADICIONAL[0]) => {
    setSelectedCatalogItem(item);
    setNombreManual(item.nombre);
    setCodigoComercialManual(item.codigoComercial);
    setCategoriaManual(item.categoria);
    setUnidadManual(item.unidad);
    setPrecioManual(item.precioSugerido);
    setObservacionManual(item.observacion);
    setCantidadManual(1);
  };

  const handleAgregarInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreManual.trim() || cantidadManual <= 0 || precioManual < 0) return;

    const nuevoItem: InsumoAdicional = {
      id: 'extra_' + Date.now(),
      nombre: nombreManual.trim(),
      codigoComercial: codigoComercialManual.trim() || undefined,
      categoria: categoriaManual,
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

  const handleEliminarItemAdicional = (id: string) => {
    setItemsAdicionales(prev => prev.filter(i => i.id !== id));
  };

  const getCategoriaIcon = (cat: string) => {
    switch (cat) {
      case 'perfiles': return <Package className="w-4 h-4 text-blue-600" />;
      case 'planchas': return <Layers className="w-4 h-4 text-amber-600" />;
      case 'mallas': return <Grid className="w-4 h-4 text-teal-600" />;
      case 'vidrios': return <Sparkles className="w-4 h-4 text-sky-600" />;
      case 'bisagras': return <Wrench className="w-4 h-4 text-slate-600" />;
      case 'cerraduras': return <Lock className="w-4 h-4 text-amber-600" />;
      case 'ruedas': return <Cog className="w-4 h-4 text-orange-600" />;
      case 'rieles': return <ArrowRightLeft className="w-4 h-4 text-indigo-600" />;
      case 'tornillos': return <ShieldAlert className="w-4 h-4 text-slate-600" />;
      case 'soldadura': return <Flame className="w-4 h-4 text-red-600" />;
      case 'pintura': return <Paintbrush className="w-4 h-4 text-emerald-600" />;
      default: return <Package className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getCategoriaNombre = (cat: string) => {
    switch (cat) {
      case 'perfiles': return 'Perfiles y Tubos Metálicos';
      case 'planchas': return 'Planchas y Láminas LAC/LAF';
      case 'mallas': return 'Mallas Electrosoldadas y Tejidas';
      case 'vidrios': return 'Vidrios y Cristales de Seguridad';
      case 'bisagras': return 'Bisagras Tubulares y Pivotes';
      case 'cerraduras': return 'Cerraduras y Cerrojos de Seguridad';
      case 'ruedas': return 'Ruedas en V y Rodamientos';
      case 'rieles': return 'Rieles y Guías de Piso/Techo';
      case 'tornillos': return 'Tornillos, Pernos y Anclajes Hilti';
      case 'soldadura': return 'Soldadura y Abrasivos de Taller';
      case 'pintura': return 'Base Anticorrosiva, Esmaltes y Thinner';
      default: return cat;
    }
  };

  const filteredCatalog = CATALAGO_COMERCIAL_ADICIONAL.filter(item => 
    item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.codigoComercial.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoriasConItems = categoriasMateriales.filter(cat => cat.items.length > 0);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-4 sm:p-6 overflow-y-auto text-slate-800 select-none">
      
      {/* CABECERA Y ACCIONES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-wide">
                REQUERIMIENTO CONSOLIDADO DE MATERIALES
              </h2>
              <p className="text-xs text-slate-500">
                Insumos calculados + Perfiles comerciales serie LAC/LAF adjuntados • Precios Perú (PEN S/.)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón para Adjuntar Perfiles/Insumos */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>➕ Adjuntar Perfil / Insumo Adicional</span>
          </button>

          <button
            onClick={handleCopiarMateriales}
            disabled={categoriasConItems.length === 0 && itemsAdicionales.length === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              categoriasConItems.length === 0 && itemsAdicionales.length === 0
                ? 'bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? 'Copiado' : 'Copiar Insumos'}</span>
          </button>

          <div className="text-right bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Consolidado</span>
            <span className="text-base font-mono font-bold text-emerald-600">S/. {subtotalTotalPEN.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE INSUMOS Y PERFILES ADICIONALES ADJUNTADOS POR EL USUARIO */}
      {itemsAdicionales.length > 0 && (
        <div className="my-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Insumos y Perfiles Comerciales Adjuntados Manualmente ({itemsAdicionales.length})
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-700">
              Subtotal Adjuntados: S/. {subtotalAdicionales.toFixed(2)}
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
                  <tr key={item.id ? `h-item-${item.id}-${idx}` : `h-item-${idx}`} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{item.nombre}</td>
                    <td className="py-2.5 px-3 text-indigo-600 font-bold text-[11px]">{item.codigoComercial || 'N/A'}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-sans">{item.unidad}</td>
                    <td className="py-2.5 px-3 text-center font-bold bg-indigo-50/50">{item.cantidad}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">S/. {item.precioUnitario.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600">S/. {item.subtotal.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">{item.observacion || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleEliminarItemAdicional(item.id)}
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

      {/* GRID DE CATEGORÍAS AGRUPADAS AUTOMÁTICAS */}
      {categoriasConItems.length === 0 && itemsAdicionales.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 text-center my-5">
          <Package className="w-10 h-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">Sin materiales requeridos</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Dibuja piezas en el CAD o presiona el botón <span className="font-bold text-indigo-600">"➕ Adjuntar Perfil / Insumo Adicional"</span> para agregar tubos de la serie LAC/LAF y accesorios al pedido.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            ➕ Adjuntar Insumo Comercial Ahora
          </button>
        </div>
      ) : (
        <div className="space-y-4 my-2">
          {categoriasConItems.map(cat => (
            <div key={cat.categoria} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-100/70 border-b border-slate-200">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  {getCategoriaIcon(cat.categoria)}
                  <span className="tracking-wide uppercase">{getCategoriaNombre(cat.categoria)}</span>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-600">
                  Subtotal: S/. {cat.subtotalCategoria.toFixed(2)}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] text-slate-500 uppercase border-b border-slate-200 font-bold bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-4">Descripción del Insumo</th>
                      <th className="py-2.5 px-4 text-center">Unidad</th>
                      <th className="py-2.5 px-4 text-center">Cantidad Requerida</th>
                      <th className="py-2.5 px-4 text-right">Precio Unit. (S/.)</th>
                      <th className="py-2.5 px-4 text-right">Subtotal (S/.)</th>
                      <th className="py-2.5 px-4">Detalle / Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {cat.items.map((item, iIdx) => (
                      <tr key={item.id || iIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{item.nombre}</td>
                        <td className="py-2.5 px-4 text-center text-slate-500 font-sans">{item.unidad}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800 bg-slate-50">{item.cantidad}</td>
                        <td className="py-2.5 px-4 text-right text-slate-600">S/. {item.precioUnitario.toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600">S/. {item.subtotal.toFixed(2)}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">{item.observacion || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
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
                  Adjuntar Perfil o Material Comercial Adicional
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
                  1. Buscar en Catálogo Comercial de Perfiles (Serie LAC / LAF / ASTM A500)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ejemplo: 3x3, 75x75, LAC-75X75X2.5, 4x2, plancha..."
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
                      <option value="Plancha 4x8">Plancha 4x8</option>
                      <option value="Unid">Unid</option>
                      <option value="Galón">Galón</option>
                      <option value="Caja">Caja</option>
                      <option value="Kg">Kg</option>
                      <option value="m2">m2</option>
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
                    placeholder="Ej. Tubos para refuerzo de parantes en campo"
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
