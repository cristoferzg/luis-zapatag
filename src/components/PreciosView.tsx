// =============================================================================
// PRECIOS DE MERCADO — vista sobria y responsive (Innova Contratistas)
//
// Rediseño: paleta neutra (slate), sin exceso de color; adaptable a móvil y
// cualquier pantalla (tarjetas en pantallas chicas, filas en escritorio).
// Es una COMPARACIÓN REFERENCIAL de mercado (no un servicio en línea): el
// antiguo botón "Actualizar IA" llamaba a un endpoint inexistente y solo
// cambiaba la fecha, por eso se eliminó. El admin puede editar/añadir precios a
// mano y persisten en el dispositivo. El cotizador es opcional (colapsable).
// =============================================================================
import React, { useRef, useState } from 'react';
import BotonImprimir from './common/BotonImprimir';
import {
  MapPin, Calculator, Search, Plus, Edit2, Trash2, RotateCcw,
  Copy, Check, X, AlertTriangle, ChevronDown, Pencil
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

// Fecha de última revisión manual de la comparación de mercado.
const REVISION_MERCADO = 'Octubre 2026';

const DEFAULT_PRECIOS_CATEGORIES: PriceCategory[] = [
  {
    categoria: 'Estructuras Metálicas & Techos',
    items: [
      { nombre: 'Tijeral metálico Warren / Pratt (fabricación y montaje)', precio: 'S/ 190 – 260 / m²', variacion: '+2.4%', detalle: 'Tubo estructural 2x1 y 3x1.5 mm' },
      { nombre: 'Columnas metálicas tubulares / perfil H', precio: 'S/ 210 – 320 / ml', variacion: 'Estable', detalle: 'Incluye anclaje y placa base' },
      { nombre: 'Instalación cobertura Aluzinc TR-4', precio: 'S/ 65 – 95 / m²', variacion: '+1.8%', detalle: 'Con pernos autoperforantes EPDM' },
      { nombre: 'Instalación planchas Eternit / fibrocemento', precio: 'S/ 55 – 85 / m²', variacion: 'Estable', detalle: 'Fijación con ganchos J galvanizados' },
      { nombre: 'Correas metálicas costanera (C)', precio: 'S/ 45 – 70 / ml', variacion: '+3.1%', detalle: 'Espaciamiento 1.00 – 1.20 m' },
    ],
  },
  {
    categoria: 'Tubos & Perfiles (distribuidor)',
    items: [
      { nombre: 'Tubo galvanizado 1"x1" x 0.9 mm (6 m)', precio: 'S/ 25 – 33 / barra', variacion: '+2.0%', detalle: 'Ref. distribuidor 2026' },
      { nombre: 'Tubo cuadrado 2"x2" x 1.5 mm (6 m)', precio: 'S/ 68 – 88 / barra', variacion: '+2.5%', detalle: 'LAC/galv. · ref. distribuidor 2026' },
      { nombre: 'Tubo rectangular LAC 2"x1" x 1.5 mm (6 m)', precio: 'S/ 40 – 52 / barra', variacion: '+2.0%', detalle: 'ASTM A500 comercial' },
      { nombre: 'Tubo cuadrado LAC 3"x3" x 2.0 mm (6 m)', precio: 'S/ 115 – 145 / barra', variacion: '+2.8%', detalle: 'Columnas y marcos medianos' },
      { nombre: 'Tubo cuadrado LAC 4"x4" x 2.0 mm (6 m)', precio: 'S/ 300 – 345 / barra', variacion: '+2.8%', detalle: 'ASTM A500 · ref. Ferropolis 2026' },
    ],
  },
  {
    categoria: 'Coberturas (distribuidor)',
    items: [
      { nombre: 'Plancha Aluzinc TR-4 0.35 mm x 6 m', precio: 'S/ 115 – 135 / plancha', variacion: '+4.0%', detalle: 'Aceros Arequipa / Tupemesa' },
      { nombre: 'Plancha Aluzinc TR-4 0.40 mm x 6 m', precio: 'S/ 138 – 160 / plancha', variacion: '+3.5%', detalle: 'Alta resistencia a la intemperie' },
      { nombre: 'Plancha Eternit gran onda 1.83 x 1.10 m', precio: 'S/ 42 – 52 / unidad', variacion: 'Estable', detalle: 'Fibrocemento sin asbesto' },
      { nombre: 'Policarbonato alveolar 6 mm (traslúcido)', precio: 'S/ 90 – 130 / plancha', variacion: 'Estable', detalle: 'Para techos curvos / tragaluz' },
    ],
  },
  {
    categoria: 'Carpintería Metálica & Herrería',
    items: [
      { nombre: 'Portón corredizo metálico c/ chapa', precio: 'S/ 420 – 650 / m²', variacion: 'Estable', detalle: 'Tubo galvanizado y plancha estriada' },
      { nombre: 'Puerta principal de acero c/ cerradura', precio: 'S/ 380 – 580 / m²', variacion: '+1.5%', detalle: 'Pintura epóxica al horno' },
      { nombre: 'Reja de seguridad / ventana', precio: 'S/ 160 – 240 / m²', variacion: 'Estable', detalle: 'Fierro macizo o tubular' },
      { nombre: 'Baranda de escalera con pasamanos', precio: 'S/ 130 – 195 / ml', variacion: '+2.2%', detalle: 'Tubo redondo 2" y barras verticales' },
    ],
  },
  {
    categoria: 'Mano de Obra & Soldadura',
    items: [
      { nombre: 'Jornal soldador homologado 6G', precio: 'S/ 140 – 190 / día', variacion: '+5.0%', detalle: 'AWS D1.1 calificado' },
      { nombre: 'Jornal maestro cerrajero / armador', precio: 'S/ 120 – 160 / día', variacion: 'Estable', detalle: 'Habilitado y ensamble' },
      { nombre: 'Jornal operario / oficial metalmecánico', precio: 'S/ 90 – 125 / día', variacion: 'Estable', detalle: 'Ayudante y pulidor' },
      { nombre: 'Servicio de pintura base epóxica + gloss', precio: 'S/ 25 – 40 / m²', variacion: '+2.5%', detalle: 'Aplicación con soplete' },
    ],
  },
];

export const PreciosView: React.FC = () => {
  const hojaRef = useRef<HTMLDivElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Perú (Nacional)');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showCotizador, setShowCotizador] = useState<boolean>(false);

  const [categories, setCategories] = useState<PriceCategory[]>(() => {
    const saved = safeStorage.getItem<PriceCategory[]>('innova_precios_mercado', null as any);
    return saved && Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_PRECIOS_CATEGORIES;
  });
  const saveCategories = (next: PriceCategory[]) => {
    setCategories(next);
    safeStorage.setItem('innova_precios_mercado', next);
  };

  // Cotizador
  const [costoEstimado, setCostoEstimado] = useState<number>(0);
  const [marginMode, setMarginMode] = useState<'percent' | 'fixed'>('percent');
  const [marginPercent, setMarginPercent] = useState<number>(30);
  const [margenFijo, setMargenFijo] = useState<number>(500);
  const [imprevistosPercent, setImprevistosPercent] = useState<number>(5);
  const [incluirIgv, setIncluirIgv] = useState<boolean>(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);

  const baseCosto = Number(costoEstimado) || 0;
  const montoImprevistos = (baseCosto * (Number(imprevistosPercent) || 0)) / 100;
  const costoProduccion = baseCosto + montoImprevistos;
  const montoUtilidad = marginMode === 'percent'
    ? (costoProduccion * (Number(marginPercent) || 0)) / 100
    : (Number(margenFijo) || 0);
  const subtotal = costoProduccion + montoUtilidad;
  const montoIgv = incluirIgv ? subtotal * 0.18 : 0;
  const precioFinalCalculado = subtotal + montoIgv;

  // Modales
  const [itemModal, setItemModal] = useState<{ open: boolean; mode: 'add' | 'edit'; categoryName: string; itemIndex?: number; item: PriceItem; } | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ open: boolean; categoryName: string; itemIndex: number; itemName: string; } | null>(null);
  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemModal) return;
    const { mode, categoryName, itemIndex, item } = itemModal;
    if (!item.nombre.trim() || !item.precio.trim()) return;
    const next = categories.map(cat => {
      if (cat.categoria.toLowerCase() === categoryName.toLowerCase()) {
        if (mode === 'add') return { ...cat, items: [item, ...cat.items] };
        if (mode === 'edit' && itemIndex !== undefined) {
          const items = [...cat.items]; items[itemIndex] = item; return { ...cat, items };
        }
      }
      return cat;
    });
    saveCategories(next);
    setItemModal(null);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteModal) return;
    const { categoryName, itemIndex } = confirmDeleteModal;
    const next = categories.map(cat =>
      cat.categoria.toLowerCase() === categoryName.toLowerCase()
        ? { ...cat, items: cat.items.filter((_, i) => i !== itemIndex) }
        : cat
    );
    saveCategories(next);
    setConfirmDeleteModal(null);
  };

  const handleResetToDefault = () => { saveCategories(DEFAULT_PRECIOS_CATEGORIES); setConfirmResetModal(false); };

  const handleCopyWhatsApp = () => {
    const text = `*COTIZACIÓN ESTIMADA — INNOVA CONTRATISTAS*
Fecha: ${new Date().toLocaleDateString('es-PE')}  ·  Región: ${selectedRegion}
----------------------------------------
Costo directo base: S/ ${baseCosto.toFixed(2)}
Merma e imprevistos (${imprevistosPercent}%): S/ ${montoImprevistos.toFixed(2)}
Costo de producción: S/ ${costoProduccion.toFixed(2)}
Utilidad (${marginMode === 'percent' ? marginPercent + '%' : 'monto fijo'}): S/ ${montoUtilidad.toFixed(2)}
Subtotal: S/ ${subtotal.toFixed(2)}
${incluirIgv ? `IGV (18%): S/ ${montoIgv.toFixed(2)}\n` : ''}PRECIO FINAL SUGERIDO: S/ ${precioFinalCalculado.toFixed(2)} ${incluirIgv ? '(con factura)' : '(neto / proforma)'}
----------------------------------------
Precios referenciales sujetos a verificación en planos o visita de campo.`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2500);
    }
  };

  const filteredCategories = categories
    .filter(cat => selectedCategoryTab === 'all' || cat.categoria.toLowerCase() === selectedCategoryTab.toLowerCase())
    .map(cat => ({
      ...cat,
      items: cat.items.filter(it =>
        it.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.detalle && it.detalle.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter(cat => cat.items.length > 0 || searchQuery === '');

  // Variación sobria (sin colores fuertes): sube = ámbar tenue, estable/baja = gris.
  const variacionTono = (v?: string) =>
    v && v.startsWith('+') ? 'text-amber-700/80' : 'text-slate-400';

  return (
    <div ref={hojaRef} className="h-full overflow-y-auto bg-slate-50 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ENCABEZADO */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-white shrink-0">
                <Calculator className="w-4.5 h-4.5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">Precios de mercado</h1>
                <p className="text-[12px] text-slate-500">Comparación referencial · revisado {REVISION_MERCADO}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
                className="bg-transparent text-[12px] text-slate-700 outline-none cursor-pointer font-semibold max-w-[8.5rem]">
                <option>Perú (Nacional)</option>
                <option>Lima y Callao</option>
                <option>Trujillo / La Libertad</option>
                <option>Arequipa</option>
                <option>Chiclayo / Lambayeque</option>
                <option>Piura</option>
                <option>Cusco</option>
                <option>Huancayo / Junín</option>
              </select>
            </div>
            <BotonImprimir objetivo={() => hojaRef.current} titulo="Precios de mercado" etiqueta="Imprimir"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 text-[12px] font-bold cursor-pointer transition-colors" />
            <button onClick={() => setEditMode(v => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border cursor-pointer transition-colors ${
                editMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}>
              <Pencil className="w-3.5 h-3.5" /> {editMode ? 'Editando' : 'Editar'}
            </button>
          </div>
        </header>

        {/* BUSCADOR + FILTROS */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar: aluzinc, tijeral, tubo, soldador…"
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 focus:outline-none focus:border-slate-400 transition-colors" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {[{ k: 'all', label: 'Todas' }, ...categories.map(c => ({ k: c.categoria, label: c.categoria }))].map(t => {
              const active = (t.k === 'all' && selectedCategoryTab === 'all') || selectedCategoryTab.toLowerCase() === t.k.toLowerCase();
              return (
                <button key={t.k} onClick={() => setSelectedCategoryTab(t.k)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap cursor-pointer transition-colors border ${
                    active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTADO DE PRECIOS */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Sin resultados</p>
              <p className="text-[12px] text-slate-400">Prueba con otra palabra clave.</p>
            </div>
          ) : filteredCategories.map((cat, ci) => (
            <section key={ci} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">{cat.categoria}</h3>
                {editMode && (
                  <button onClick={() => setItemModal({ open: true, mode: 'add', categoryName: cat.categoria, item: { nombre: '', precio: 'S/ ', variacion: 'Estable', detalle: '' } })}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Añadir
                  </button>
                )}
              </div>
              <ul className="divide-y divide-slate-100">
                {cat.items.map((item, ii) => (
                  <li key={ii} className="flex items-start sm:items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 leading-snug">{item.nombre}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {item.detalle && <span className="text-[11px] text-slate-400">{item.detalle}</span>}
                        {item.variacion && item.variacion !== 'Estable' && (
                          <span className={`text-[10px] font-bold ${variacionTono(item.variacion)}`}>{item.variacion}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[13px] font-black text-slate-900 whitespace-nowrap">{item.precio}</span>
                    </div>
                    {editMode && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => setItemModal({ open: true, mode: 'edit', categoryName: cat.categoria, itemIndex: ii, item: { ...item } })}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer" title="Editar">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDeleteModal({ open: true, categoryName: cat.categoria, itemIndex: ii, itemName: item.nombre })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {editMode && (
            <button onClick={() => setConfirmResetModal(true)}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Restablecer precios de referencia
            </button>
          )}

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Precios referenciales de mercado (distribuidores peruanos), sujetos a variación según cotización del acero,
            espesor, norma y volumen. Verifica con tu proveedor antes de cotizar en firme.
          </p>
        </div>

        {/* COTIZADOR (colapsable) */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <button onClick={() => setShowCotizador(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
            <span className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-800">
              <Calculator className="w-4 h-4 text-slate-500" /> Cotizador rápido (opcional)
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCotizador ? 'rotate-180' : ''}`} />
          </button>

          {showCotizador && (
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Costo directo base (materiales + mano de obra)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">S/</span>
                  <input type="number" min="0" value={costoEstimado === 0 ? '' : costoEstimado}
                    onChange={e => setCostoEstimado(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="Ej. 3500.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-[13px] font-bold outline-none focus:border-slate-400 text-slate-800" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Merma e imprevistos</label>
                  <span className="text-[11px] font-bold text-slate-600">+{imprevistosPercent}% · S/ {montoImprevistos.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 3, 5, 8, 10].map(v => (
                    <button key={v} onClick={() => setImprevistosPercent(v)}
                      className={`py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${imprevistosPercent === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{v}%</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Margen de utilidad</label>
                  <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                    <button onClick={() => setMarginMode('percent')} className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer ${marginMode === 'percent' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}>%</button>
                    <button onClick={() => setMarginMode('fixed')} className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer ${marginMode === 'fixed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}>S/</button>
                  </div>
                </div>
                {marginMode === 'percent' ? (
                  <div className="grid grid-cols-5 gap-1.5">
                    {[15, 20, 25, 30, 35].map(p => (
                      <button key={p} onClick={() => setMarginPercent(p)}
                        className={`py-1.5 rounded-lg text-[12px] font-bold cursor-pointer transition-colors ${marginPercent === p ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{p}%</button>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">S/</span>
                    <input type="number" min="0" value={margenFijo}
                      onChange={e => setMargenFijo(e.target.value === '' ? 0 : Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-[13px] font-bold outline-none focus:border-slate-400 text-slate-800" />
                  </div>
                )}
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[12px] font-semibold text-slate-600">Incluir IGV (18%)</span>
                <input type="checkbox" checked={incluirIgv} onChange={e => setIncluirIgv(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 cursor-pointer" />
              </label>

              <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Precio final sugerido</p>
                  <p className="text-xl font-black">S/ {precioFinalCalculado.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400">{incluirIgv ? 'con factura' : 'neto / proforma'}</p>
                </div>
                <button onClick={handleCopyWhatsApp}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-[12px] font-bold cursor-pointer transition-colors">
                  {copiedWhatsApp ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL AÑADIR / EDITAR */}
      {itemModal?.open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setItemModal(null)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleSaveItem}
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">{itemModal.mode === 'add' ? 'Nuevo precio' : 'Editar precio'}</h3>
              <button type="button" onClick={() => setItemModal(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Concepto / material</label>
              <input value={itemModal.item.nombre} onChange={e => setItemModal({ ...itemModal, item: { ...itemModal.item, nombre: e.target.value } })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-slate-400" placeholder="Ej. Tubo cuadrado 2x2…" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Precio</label>
                <input value={itemModal.item.precio} onChange={e => setItemModal({ ...itemModal, item: { ...itemModal.item, precio: e.target.value } })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-slate-400" placeholder="S/ 100 – 130 / barra" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Variación</label>
                <input value={itemModal.item.variacion || ''} onChange={e => setItemModal({ ...itemModal, item: { ...itemModal.item, variacion: e.target.value } })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-slate-400" placeholder="Estable / +2%" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Detalle (opcional)</label>
              <input value={itemModal.item.detalle || ''} onChange={e => setItemModal({ ...itemModal, item: { ...itemModal.item, detalle: e.target.value } })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-800 outline-none focus:border-slate-400" placeholder="Norma, espesor, proveedor…" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setItemModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 cursor-pointer">Cancelar</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-[13px] hover:bg-slate-800 cursor-pointer">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {confirmDeleteModal?.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setConfirmDeleteModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 p-5 space-y-3 text-center">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto"><Trash2 className="w-5 h-5" /></div>
            <h3 className="text-sm font-black text-slate-900">¿Eliminar este precio?</h3>
            <p className="text-[12px] text-slate-500 leading-snug">"{confirmDeleteModal.itemName}" se quitará de la lista.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmDeleteModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 cursor-pointer">Cancelar</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-[13px] hover:bg-rose-700 cursor-pointer">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESTABLECER */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setConfirmResetModal(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 p-5 space-y-3 text-center">
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto"><AlertTriangle className="w-5 h-5" /></div>
            <h3 className="text-sm font-black text-slate-900">¿Restablecer precios?</h3>
            <p className="text-[12px] text-slate-500 leading-snug">Se recupera la lista de referencia y se descartan tus cambios.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmResetModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 cursor-pointer">Cancelar</button>
              <button onClick={handleResetToDefault} className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-[13px] hover:bg-slate-800 cursor-pointer">Restablecer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreciosView;
