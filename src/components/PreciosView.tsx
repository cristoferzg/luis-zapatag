import React, { useState } from 'react';
import { 
  RefreshCw, 
  MapPin, 
  Calculator, 
  Search, 
  Clock,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  Printer,
  X,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { safeStorage } from '../lib/storageManager';

export interface PriceItem {
  nombre: string;
  precio: string;
  variacion?: string;
  detalle?: string;
}

export interface PriceCategory {
  categoria: string;
  items: PriceItem[];
}

const DEFAULT_PRECIOS_CATEGORIES: PriceCategory[] = [
  {
    categoria: 'Estructuras Metálicas & Techos',
    items: [
      { nombre: 'Tijeral Metálico Warren/Pratt (Fabricación y Montaje)', precio: 'S/ 190 - S/ 260 por m²', variacion: '+2.4%', detalle: 'Tubo estructural 2x1 y 3x1.5mm' },
      { nombre: 'Columnas Metálicas Tubulares / Perfil H', precio: 'S/ 210 - S/ 320 por ml', variacion: 'Estable', detalle: 'Incluye anclaje y placa base' },
      { nombre: 'Instalación de Cobertura Aluzinc TR4', precio: 'S/ 65 - S/ 95 por m²', variacion: '+1.8%', detalle: 'Con pernos autoperforantes EPDM' },
      { nombre: 'Instalación de Planchas Eternit / Fibrocemento', precio: 'S/ 55 - S/ 85 por m²', variacion: 'Estable', detalle: 'Fijación con ganchos J galvanizados' },
      { nombre: 'Correas Metálicas Costanera (C)', precio: 'S/ 45 - S/ 70 por ml', variacion: '+3.1%', detalle: 'Espaciamiento 1.00m a 1.20m' }
    ]
  },
  {
    categoria: 'Materiales & Coberturas en Distribuidor',
    items: [
      { nombre: 'Plancha Aluzinc TR4 0.35mm x 6m', precio: 'S/ 115 - S/ 135 por plancha', variacion: '+4.0%', detalle: 'Aceros Arequipa / Tupemesa' },
      { nombre: 'Plancha Aluzinc TR4 0.40mm x 6m', precio: 'S/ 138 - S/ 160 por plancha', variacion: '+3.5%', detalle: 'Alta resistencia a la intemperie' },
      { nombre: 'Plancha Eternit Gran Onda 1.83m x 1.10m', precio: 'S/ 42 - S/ 52 por unidad', variacion: 'Estable', detalle: 'Fibrocemento sin asbesto' },
      { nombre: 'Tubo Rectangular LAC 2"x1"x1.5mm (6m)', precio: 'S/ 38 - S/ 46 por barra', variacion: '+2.0%', detalle: 'Comercial estándar' },
      { nombre: 'Tubo Cuadrado 3"x3"x2.0mm (6m)', precio: 'S/ 110 - S/ 135 por barra', variacion: '+2.8%', detalle: 'Columnas y marcos mayores' }
    ]
  },
  {
    categoria: 'Carpintería Metálica & Herrería',
    items: [
      { nombre: 'Portón Corredizo Metálico c/ chapa', precio: 'S/ 420 - S/ 650 por m²', variacion: 'Estable', detalle: 'Tubo galvanizado y plancha estriada' },
      { nombre: 'Puerta Principal de Acero c/ Cerradura', precio: 'S/ 380 - S/ 580 por m²', variacion: '+1.5%', detalle: 'Acabado pintura epóxica al horno' },
      { nombre: 'Reja de Seguridad / Ventana', precio: 'S/ 160 - S/ 240 por m²', variacion: 'Estable', detalle: 'Fierro macizo o tubular de seguridad' },
      { nombre: 'Baranda de Escalera con Pasamanos', precio: 'S/ 130 - S/ 195 por ml', variacion: '+2.2%', detalle: 'Tubo redondo 2" y barras verticales' }
    ]
  },
  {
    categoria: 'Mano de Obra & Soldadura Especializada',
    items: [
      { nombre: 'Jornal Soldador Homologado 6G / Estructural', precio: 'S/ 140 - S/ 190 por día', variacion: '+5.0%', detalle: 'AWS D1.1 Calificado' },
      { nombre: 'Jornal Maestro Cerrajero / Armador', precio: 'S/ 120 - S/ 160 por día', variacion: 'Estable', detalle: 'Habilitado y ensamble de piezas' },
      { nombre: 'Jornal Operario / Oficial Metalmecánico', precio: 'S/ 90 - S/ 125 por día', variacion: 'Estable', detalle: 'Ayudante y pulidor' },
      { nombre: 'Servicio de Pintura Base Epóxica + Gloss', precio: 'S/ 25 - S/ 40 por m²', variacion: '+2.5%', detalle: 'Aplicación con soplete y compresora' }
    ]
  }
];

export const PreciosView: React.FC = () => {
  // Filtros y Búsqueda
  const [selectedRegion, setSelectedRegion] = useState<string>('Perú (Nacional)');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    return safeStorage.getItem<string>('innova_precios_last_updated', 'Actualizado 2026');
  });

  // Base de datos local de Precios
  const [categories, setCategories] = useState<PriceCategory[]>(() => {
    const saved = safeStorage.getItem<PriceCategory[]>('innova_precios_mercado', null as any);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return DEFAULT_PRECIOS_CATEGORIES;
  });

  const saveCategories = (newCategories: PriceCategory[]) => {
    setCategories(newCategories);
    safeStorage.setItem('innova_precios_mercado', newCategories);
  };

  // Calculadora de Rentabilidad Avanzada
  const [costoEstimado, setCostoEstimado] = useState<number>(0);
  const [marginMode, setMarginMode] = useState<'percent' | 'fixed'>('percent');
  const [marginPercent, setMarginPercent] = useState<number>(30);
  const [margenFijo, setMargenFijo] = useState<number>(500);
  const [imprevistosPercent, setImprevistosPercent] = useState<number>(5);
  const [incluirIgv, setIncluirIgv] = useState<boolean>(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);

  // Cálculos matemáticos de la proforma
  const baseCosto = Number(costoEstimado) || 0;
  const montoImprevistos = (baseCosto * (Number(imprevistosPercent) || 0)) / 100;
  const costoProduccion = baseCosto + montoImprevistos;
  const montoUtilidad = marginMode === 'percent' 
    ? (costoProduccion * (Number(marginPercent) || 0)) / 100 
    : (Number(margenFijo) || 0);
  const subtotal = costoProduccion + montoUtilidad;
  const montoIgv = incluirIgv ? subtotal * 0.18 : 0;
  const precioFinalCalculado = subtotal + montoIgv;

  // Modales de Gestión de Precios
  const [itemModal, setItemModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    categoryName: string;
    itemIndex?: number;
    item: PriceItem;
  } | null>(null);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    open: boolean;
    categoryName: string;
    itemIndex: number;
    itemName: string;
  } | null>(null);

  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);

  // Guardar o Actualizar Ítem
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemModal) return;

    const { mode, categoryName, itemIndex, item } = itemModal;
    if (!item.nombre.trim() || !item.precio.trim()) return;

    const nextCategories = categories.map(cat => {
      if (cat.categoria.toLowerCase() === categoryName.toLowerCase()) {
        if (mode === 'add') {
          return {
            ...cat,
            items: [item, ...cat.items]
          };
        } else if (mode === 'edit' && itemIndex !== undefined) {
          const updatedItems = [...cat.items];
          updatedItems[itemIndex] = item;
          return {
            ...cat,
            items: updatedItems
          };
        }
      }
      return cat;
    });

    saveCategories(nextCategories);
    setItemModal(null);
  };

  // Eliminar Ítem
  const handleConfirmDelete = () => {
    if (!confirmDeleteModal) return;
    const { categoryName, itemIndex } = confirmDeleteModal;

    const nextCategories = categories.map(cat => {
      if (cat.categoria.toLowerCase() === categoryName.toLowerCase()) {
        return {
          ...cat,
          items: cat.items.filter((_, idx) => idx !== itemIndex)
        };
      }
      return cat;
    });

    saveCategories(nextCategories);
    setConfirmDeleteModal(null);
  };

  // Restablecer Precios
  const handleResetToDefault = () => {
    saveCategories(DEFAULT_PRECIOS_CATEGORIES);
    setConfirmResetModal(false);
  };

  // Actualizar con IA
  const handleUpdatePricesWithAI = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/market-prices-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: selectedRegion })
      });

      if (!response.ok) throw new Error('Error al conectar con el servicio de IA');

      const data = await response.json();
      if (data.categories && Array.isArray(data.categories)) {
        saveCategories(data.categories);
        const now = new Date();
        const formatted = `Actualizado con IA el ${now.toLocaleDateString('es-PE')} a las ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
        setLastUpdated(formatted);
        safeStorage.setItem('innova_precios_last_updated', formatted);
      }
    } catch (error: any) {
      console.warn('Usando base interna de precios:', error);
      const now = new Date();
      const formatted = `Actualizado el ${now.toLocaleDateString('es-PE')} a las ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
      setLastUpdated(formatted);
      safeStorage.setItem('innova_precios_last_updated', formatted);
    } finally {
      setIsUpdating(false);
    }
  };

  // Copiar resumen para WhatsApp
  const handleCopyWhatsApp = () => {
    const text = `🛠️ *COTIZACIÓN ESTIMADA - INNOVA CONTRATISTAS*
📅 Fecha: ${new Date().toLocaleDateString('es-PE')}
📍 Región: ${selectedRegion}
----------------------------------------
• Costo Directo Base (Materiales/MO): S/ ${baseCosto.toFixed(2)}
• Merma & Imprevistos (${imprevistosPercent}%): S/ ${montoImprevistos.toFixed(2)}
• Costo Total de Producción: S/ ${costoProduccion.toFixed(2)}
• Margen Técnico de Utilidad: S/ ${montoUtilidad.toFixed(2)} (${marginMode === 'percent' ? `${marginPercent}%` : 'Monto Fijo'})
• Subtotal: S/ ${subtotal.toFixed(2)}
${incluirIgv ? `• IGV (18%): S/ ${montoIgv.toFixed(2)}\n` : ''}👉 *PRECIO FINAL SUGERIDO: S/ ${precioFinalCalculado.toFixed(2)}* ${incluirIgv ? '(Con Factura)' : '(Neto / Proforma)'}
----------------------------------------
_Nota: Precios referenciales sujetos a verificación técnica en planos o visita de campo._`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    }
  };

  // Filtro de Categorías e Ítems
  const filteredCategories = categories
    .filter(cat => selectedCategoryTab === 'all' || cat.categoria.toLowerCase() === selectedCategoryTab.toLowerCase())
    .map(cat => ({
      ...cat,
      items: cat.items.filter(item => 
        item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.detalle && item.detalle.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }))
    .filter(cat => cat.items.length > 0 || searchQuery === '');

  return (
    <div className="space-y-6 overflow-y-auto pb-20 h-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* HEADER DE PRECIOS */}
      <header className="bg-white text-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                <DollarSign className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Precios de Mercado & Rentabilidad de Obra
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Consulta, personaliza y actualiza costos referenciales de materiales, estructuras, coberturas y mano de obra. Calcula cotizaciones con utilidad real.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lastUpdated}</span>
            </div>
          </div>

          {/* ACCIONES DEL HEADER: REGIÓN, IMPRIMIR, ACTUALIZAR */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="bg-transparent text-xs text-slate-700 outline-none cursor-pointer font-bold"
              >
                <option value="Perú (Nacional)">🇵🇪 Perú (Nacional)</option>
                <option value="Lima y Callao">📍 Lima y Callao</option>
                <option value="Trujillo / La Libertad">📍 Trujillo / La Libertad</option>
                <option value="Arequipa">📍 Arequipa</option>
                <option value="Chiclayo / Lambayeque">📍 Chiclayo / Lambayeque</option>
                <option value="Piura">📍 Piura</option>
                <option value="Cusco">📍 Cusco</option>
                <option value="Huancayo / Junín">📍 Huancayo / Junín</option>
              </select>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Imprimir cartilla o guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={handleUpdatePricesWithAI}
              disabled={isUpdating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Actualizando...' : 'Actualizar IA'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* PESTAÑAS DE CATEGORÍA, BÚSQUEDA Y GESTIÓN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Barra de Búsqueda */}
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar material o servicio (ej: Aluzinc, Tijeral, Soldador, Eternit)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-400 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botones de Gestión de Precios */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={() => {
                const targetCat = selectedCategoryTab !== 'all' ? selectedCategoryTab : (categories[0]?.categoria || 'Estructuras Metálicas & Techos');
                setItemModal({
                  open: true,
                  mode: 'add',
                  categoryName: targetCat,
                  item: { nombre: '', precio: 'S/ ', variacion: 'Estable', detalle: '' }
                });
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Precio</span>
            </button>

            <button
              onClick={() => setConfirmResetModal(true)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
              title="Restablecer precios estándar de referencia"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pestañas de Filtro Rápido por Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategoryTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategoryTab === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas las Categorías</span>
          </button>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCategoryTab(cat.categoria)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategoryTab.toLowerCase() === cat.categoria.toLowerCase()
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.categoria} ({cat.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* CUERPO PRINCIPAL: TABLA DE PRECIOS A LA IZQUIERDA Y CALCULADORA A LA DERECHA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: LISTADO DE CATEGORÍAS Y PRECIOS */}
        <div className="lg:col-span-2 space-y-5">
          {filteredCategories.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No se encontraron precios para tu búsqueda</p>
              <p className="text-xs text-slate-400">Intenta buscar con otra palabra clave o agrega un nuevo precio al catálogo.</p>
            </div>
          ) : (
            filteredCategories.map((cat, catIdx) => (
              <div key={catIdx} className="bg-white border border-slate-200 rounded-3xl shadow-2xs overflow-hidden">
                <div className="bg-slate-50/70 px-5 py-3.5 border-b border-slate-150 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-800">{cat.categoria}</h3>
                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                      {cat.items.length} ítems
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setItemModal({
                        open: true,
                        mode: 'add',
                        categoryName: cat.categoria,
                        item: { nombre: '', precio: 'S/ ', variacion: 'Estable', detalle: '' }
                      });
                    }}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title={`Agregar ítem a ${cat.categoria}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 bg-slate-50/40">
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Concepto / Material</th>
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Especificación</th>
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Rango de Precio</th>
                        <th className="p-3.5 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center w-20">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cat.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900 text-xs leading-snug">{item.nombre}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.detalle && <span className="text-[11px] text-slate-500">{item.detalle}</span>}
                              {item.variacion && (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                  item.variacion.startsWith('+') 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {item.variacion}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <span className="text-slate-900 font-black text-xs bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl inline-block shadow-2xs">
                              {item.precio}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setItemModal({
                                    open: true,
                                    mode: 'edit',
                                    categoryName: cat.categoria,
                                    itemIndex: itemIdx,
                                    item: { ...item }
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Editar precio"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDeleteModal({
                                    open: true,
                                    categoryName: cat.categoria,
                                    itemIndex: itemIdx,
                                    itemName: item.nombre
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar ítem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* COLUMNA DERECHA: CALCULADORA DE RENTABILIDAD AVANZADA (OPCIÓN 2/3) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs sticky top-4 space-y-4">
            {/* Cabecera de la Calculadora */}
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                  <Calculator className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Calculadora de Rentabilidad</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Cotizaciones con utilidad y merma real.</p>
                </div>
              </div>

              <span className="p-1 bg-amber-50 text-amber-600 rounded-lg" title="Módulo Pro de Costos">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* 1. Costo Directo */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">
                  Costo Directo Base (Materiales + Mano de Obra)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">S/</span>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-xs font-black outline-none focus:border-indigo-500 transition-colors text-slate-800"
                    value={costoEstimado === 0 ? '' : costoEstimado}
                    onChange={e => setCostoEstimado(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="Ej. 3500.00"
                  />
                </div>
              </div>

              {/* 2. Factor de Desperdicio / Imprevistos */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Merma e Imprevistos de Taller
                  </label>
                  <span className="font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px]">
                    +{imprevistosPercent}% (S/ {montoImprevistos.toFixed(2)})
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 3, 5, 8, 10].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setImprevistosPercent(val)}
                      className={`py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        imprevistosPercent === val
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Margen de Ganancia Neto */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Margen de Utilidad
                  </label>

                  {/* Selector de Modo: % vs Monto Fijo */}
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setMarginMode('percent')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        marginMode === 'percent' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      % Porcentaje
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarginMode('fixed')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        marginMode === 'fixed' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500'
                      }`}
                    >
                      S/ Monto
                    </button>
                  </div>
                </div>

                {marginMode === 'percent' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-1">
                      {[15, 20, 25, 30, 35].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setMarginPercent(p)}
                          className={`py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                            marginPercent === p
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Utilidad calculada:</span>
                      <span className="font-black text-indigo-700">+ S/ {montoUtilidad.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">S/</span>
                      <input 
                        type="number"
                        min="0"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 text-slate-800"
                        value={margenFijo}
                        onChange={e => setMargenFijo(e.target.value === '' ? 0 : Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Conmutador de Factura / IGV */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">¿Incluir Factura (+18% IGV)?</span>
                  <span className="text-[10px] text-slate-400">Calcula impuestos para empresas o clientes con RUC.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIncluirIgv(!incluirIgv)}
                  className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                    incluirIgv ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs"></span>
                </button>
              </div>

              {/* BLOQUE DE RESULTADO Y DESGLOSE DETALLADO */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4.5 rounded-2xl space-y-3 shadow-lg border border-slate-800">
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>Costo Directo Base:</span>
                    <span className="font-bold text-slate-200">S/ {baseCosto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-amber-300">
                    <span>Merma e Imprevistos ({imprevistosPercent}%):</span>
                    <span>+ S/ {montoImprevistos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 font-bold">
                    <span>Utilidad de Taller:</span>
                    <span>+ S/ {montoUtilidad.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800">
                    <span>Subtotal Operativo:</span>
                    <span>S/ {subtotal.toFixed(2)}</span>
                  </div>
                  {incluirIgv && (
                    <div className="flex justify-between items-center text-indigo-300">
                      <span>IGV (18%):</span>
                      <span>+ S/ {montoIgv.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Precio Final Sugerido:
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {incluirIgv ? 'Factura Oficial' : 'Neto / Libre de Impuestos'}
                    </span>
                  </div>
                  <span className="text-xl font-black text-emerald-400">
                    S/ {precioFinalCalculado.toFixed(2)}
                  </span>
                </div>

                {/* BOTÓN COPIAR RESUMEN PARA WHATSAPP */}
                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="w-full mt-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {copiedWhatsApp ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>¡Copiado para WhatsApp!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Desglose para WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL PARA AGREGAR / EDITAR PRECIO */}
      {itemModal && itemModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between p-4.5 border-b border-slate-150 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  {itemModal.mode === 'add' ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                    {itemModal.mode === 'add' ? 'Registrar Nuevo Precio' : 'Editar Precio de Lista'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">{itemModal.categoryName}</span>
                </div>
              </div>
              <button
                onClick={() => setItemModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">
                  Nombre del Concepto o Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Plancha Aluzinc TR4 0.45mm"
                  value={itemModal.item.nombre}
                  onChange={e => setItemModal({
                    ...itemModal,
                    item: { ...itemModal.item, nombre: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">
                    Rango de Precio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: S/ 140 - S/ 165 por plancha"
                    value={itemModal.item.precio}
                    onChange={e => setItemModal({
                      ...itemModal,
                      item: { ...itemModal.item, precio: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">
                    Tendencia / Variación
                  </label>
                  <select
                    value={itemModal.item.variacion || 'Estable'}
                    onChange={e => setItemModal({
                      ...itemModal,
                      item: { ...itemModal.item, variacion: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="Estable">Estable</option>
                    <option value="+1.5%">+1.5% (Alza leve)</option>
                    <option value="+3.0%">+3.0% (Alza moderada)</option>
                    <option value="+5.0%">+5.0% (Alza considerable)</option>
                    <option value="-2.0%">-2.0% (Baja de precio)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase tracking-wider">
                  Especificación Técnica / Proveedor
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tubo rectangular LAC 2x1x1.5mm - Aceros Arequipa"
                  value={itemModal.item.detalle || ''}
                  onChange={e => setItemModal({
                    ...itemModal,
                    item: { ...itemModal.item, detalle: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setItemModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {itemModal.mode === 'add' ? 'Registrar Ítem' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDeleteModal && confirmDeleteModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">¿Eliminar este precio?</h3>
              <p className="text-xs text-slate-500 mt-1">Estás a punto de borrar:</p>
              <p className="text-xs font-black text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100 mt-2">
                {confirmDeleteModal.itemName}
              </p>
            </div>
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(null)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESTABLECER PRECIOS */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">¿Restablecer precios estándar?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Esto restaurará la lista de materiales y servicios a los valores de mercado originales de referencia.
              </p>
            </div>
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

