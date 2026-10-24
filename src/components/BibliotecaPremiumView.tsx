import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Lock, 
  Plus, 
  Trash2, 
  Edit, 
  Globe, 
  Users, 
  Search, 
  MessageCircle, 
  X,
  Download, 
  KeyRound, 
  FolderOpen,
  Sparkles,
  Sliders,
  Star,
  GalleryHorizontal,
  Paperclip,
  LayoutTemplate
} from 'lucide-react';
import { SystemUser } from '../types';
import { deleteRecord, useFirestoreArraySync, updateRecord } from '../lib/db';
import AsistenteSubida, { BorradorSubida, borradorVacio } from './common/AsistenteSubida';
import SliderDestacados from './common/SliderDestacados';
import { usarPlantilla, NOMBRE_MODULO } from '../lib/plantillas';
import { 
  getCompanyCurrency, 
  convertAmount, 
  formatCurrencyWithSymbol 
} from '../lib/currency';
import { 
  saveBibliotecaBackup, 
  getBibliotecaBackup,
  getBibliotecaFile,
  saveBibliotecaFile,
  deleteBibliotecaFile
} from '../lib/bibliotecaDB';

export interface BibliotecaItem {
  id: string;
  tipo: 'libro' | 'documento' | 'plano' | 'video';
  titulo: string;
  descripcion: string;
  categoria: string;
  enlaceVideoUrl?: string;
  enlaceDescargaUrl?: string;
  previewImageUrl?: string; // Imagen de previsualización en la nube
  imageWidth?: number;
  imageHeight?: number;
  discountPercentage?: number; // NUEVO
  discountExpiryDate?: string; // NUEVO: ISO String
  precioSoles?: number;
  precioOriginalSoles?: number;
  isMasComprado?: boolean;
  isOferta?: boolean;
  isDestacado?: boolean;   // aparece en la pestaña Destacados
  enSlider?: boolean;      // aparece en el carrusel de arriba
  adjuntos?: { nombre: string; url: string; tipo: string; tamano?: number }[];
  plantilla?: { modulo: 'techos' | 'carpimetal' | 'drywall'; datos: any }; // plantilla prediseñada
  allowedUserIds?: string[];
  fileName?: string;
  isFree?: boolean;
}

const PRESET_CATEGORIES = [
  'Herrería',
  'Techos Metálicos',
  'Estructuras Metálicas',
  'Carpintería Metálica',
  'Soldadura Especializada',
  'Planos y Detalles',
  'Cálculo Estructural'
];

interface BibliotecaPremiumViewProps {
  items?: BibliotecaItem[];
  setItems?: React.Dispatch<React.SetStateAction<BibliotecaItem[]>>;
  currentUser: SystemUser | null;
  isAdmin: boolean;
  userEmail?: string;
  usuariosList?: SystemUser[];
}

export default function BibliotecaPremiumView({
  items: propItems,
  setItems: propSetItems,
  currentUser,
  isAdmin,
  userEmail = '',
  usuariosList: propUsuariosList
}: BibliotecaPremiumViewProps) {
  const activeUid = currentUser ? ('user_' + currentUser.id) : (isAdmin ? 'admin' : 'shared');
  const [internalItems, setInternalItems] = useFirestoreArraySync<BibliotecaItem>('biblioteca', activeUid, true);
  const [internalUsuariosList] = useFirestoreArraySync<SystemUser>('usuarios', activeUid, true);

  const items = propItems || internalItems;
  const setItems = propSetItems || setInternalItems;
  const usuariosList = propUsuariosList || internalUsuariosList;

  const [activeTab, setActiveTab] = useState<'todos' | 'documentos' | 'ofertas' | 'plantillas' | 'admin'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Helper Component: Countdown
const Countdown = ({ expiryDate }: { expiryDate: string }) => {
  const [timeLeft, setTimeLeft] = useState(new Date(expiryDate).getTime() - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(new Date(expiryDate).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  if (timeLeft <= 0) return null;

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <span className="font-mono text-[10px] font-extrabold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/80 shrink-0">
      ⏳ Expira: {days > 0 ? `${days}d ` : ''}{hours}h {minutes}m {seconds}s
    </span>
  );
};

  // Buy / Request item state
  const [purchasingItem, setPurchasingItem] = useState<BibliotecaItem | null>(null);
  const [viewingItem, setViewingItem] = useState<BibliotecaItem | null>(null); // NEW

  const getConvertedPriceStr = (precioSoles: number, discountPercentage?: number) => {
    const currency = getCompanyCurrency();
    const convertedOriginal = convertAmount(precioSoles, 'PEN', currency.code);
    if (discountPercentage && discountPercentage > 0) {
      const discounted = convertedOriginal * (1 - discountPercentage / 100);
      return {
        originalStr: formatCurrencyWithSymbol(convertedOriginal, currency),
        discountedStr: formatCurrencyWithSymbol(discounted, currency),
        hasDiscount: true
      };
    }
    return {
      originalStr: formatCurrencyWithSymbol(convertedOriginal, currency),
      discountedStr: formatCurrencyWithSymbol(convertedOriginal, currency),
      hasDiscount: false
    };
  };

  // Admin CRUD states
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<BibliotecaItem | null>(null);
  const [grantUserSearch, setGrantUserSearch] = useState('');
  const [activeManagerItemId, setActiveManagerItemId] = useState<string | null>(null);
  const activeManagerItem = items.find(i => i.id === activeManagerItemId) || null;

  const isHydratedRef = useRef(false);

  // Sync backup and hydrate local IndexedDB backup ONCE on initial load
  useEffect(() => {
    async function hydrateBackup() {
      if (!isHydratedRef.current) {
        isHydratedRef.current = true;
        if (items.length === 0) {
          const backup = await getBibliotecaBackup();
          if (backup && backup.length > 0) {
            setItems(backup);
            return;
          }
        }
      }
      if (items.length > 0) {
        await saveBibliotecaBackup(items);
      } else if (isHydratedRef.current) {
        await saveBibliotecaBackup([]);
      }
    }
    hydrateBackup();
  }, [items.length]);

  // Helper to resolve real media DataURL from memory, item or IndexedDB
  const resolveMediaUrl = async (item: BibliotecaItem): Promise<string> => {
    const originalUrl = item.enlaceDescargaUrl || item.enlaceVideoUrl;
    if (originalUrl && !originalUrl.startsWith('indexeddb://')) {
      return originalUrl;
    }

    // Attempt retrieval from IndexedDB
    return await getBibliotecaFile(item.id) || '';
  };

  // Helper to check user access - Free items are automatically enabled for everyone
  const hasAccess = (item: BibliotecaItem) => {
    if (isAdmin) return true;
    if (item.isFree || (item.isFree !== false && (!item.precioSoles || item.precioSoles === 0))) return true;
    const currentUserId = currentUser?.id || userEmail;
    if (!currentUserId) return false;
    return Array.isArray(item.allowedUserIds) && item.allowedUserIds.includes(currentUserId);
  };

  // Categories extraction for filtering & admin creation
  const categories = ['all', ...Array.from(new Set(items.map(item => item.categoria).filter(Boolean)))];
  const allPresetCategories = Array.from(new Set([
    ...PRESET_CATEGORIES,
    ...items.map(item => item.categoria).filter(Boolean)
  ]));

  // Category deletion & cleanup handler (Biblioteca Premium)
  const handleDeleteCategory = async (categoryName: string) => {
    try {
      const fallbackCat = allPresetCategories.filter(c => c.trim().toLowerCase() !== categoryName.trim().toLowerCase())[0] || 'Herrería';

      const updatedItems = items.map(item => {
        if (item.categoria && item.categoria.trim().toLowerCase() === categoryName.trim().toLowerCase()) {
          const updated = { ...item, categoria: fallbackCat };
          updateRecord('biblioteca', item.id, updated);
          return updated;
        }
        return item;
      });

      setItems(updatedItems);
    } catch (err) {
      console.error("Error al eliminar categoría de biblioteca:", err);
    }
  };

  const loadPdfBlob = async (url: string) => {
    setIsLoadingPdf(true);
    setPdfBlobUrl(null);

    try {
      // 1. Check if it's an IndexedDB local file
      if (url.startsWith('indexeddb://')) {
        const fileId = url.replace('indexeddb://', '');
        const localDataUrl = await getBibliotecaFile(fileId);
        if (!localDataUrl) {
          throw new Error('No se encontró el archivo local en la base de datos de tu navegador.');
        }
        const res = await fetch(localDataUrl);
        const blob = await res.blob();
        const localUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(localUrl);
        return;
      }

      // 2. Direct Cloud Storage or Web URL
      if (url.startsWith('http')) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            const localUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(localUrl);
            return;
          }
        } catch {
          // If direct CORS fetch is blocked, fallback to iframe / direct view
        }
      }
    } catch (err: any) {
      console.warn("Direct PDF loading failed:", err);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  useEffect(() => {
    if (viewingItem) {
      loadPdfBlob(viewingItem.enlaceDescargaUrl || '');
    } else {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      setPdfBlobUrl(null);
      setIsLoadingPdf(false);
    }
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [viewingItem]);

  // Filtered lists (No video tab, pure technical resources)
  const filteredItems = items.filter(item => {
    let matchesTab = true;
    if (activeTab === 'documentos') {
      matchesTab = item.tipo !== 'video';
    } else if (activeTab === 'ofertas') {
      // Destacados: solo los recursos que el admin marcó como destacados.
      matchesTab = !!item.isDestacado;
    } else if (activeTab === 'plantillas') {
      matchesTab = !!item.plantilla;
    }

    const matchesSearch = item.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
    return matchesTab && matchesSearch && matchesCategory;
  });

  // WhatsApp purchase helper
  const handlePurchaseRequest = (item: BibliotecaItem) => {
    const adminPhone = "+51966000500"; 
    const userIdentifier = currentUser?.name || userEmail || 'Colaborador';
    const isSpecialOffer = item.isOferta || (item.precioOriginalSoles && item.precioOriginalSoles > (item.precioSoles || 0));
    const offerBadge = isSpecialOffer ? '🔥 [OPCIÓN DESTACADA]' : '';
    const message = `Hola Innova Contratistas, deseo habilitar el recurso técnico: "${item.titulo}" (Manual/Plano PDF). ${offerBadge}\n\n💵 Inversión: S/ ${item.precioSoles || 0} ${item.precioOriginalSoles ? `(Precio anterior: S/ ${item.precioOriginalSoles})` : ''}\n👤 Mi usuario/PIN es: ${userIdentifier}\n\nPor favor confirmar mi acceso para descarga.`;
    const whatsappUrl = `https://wa.me/${adminPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    try {
      const a = document.createElement('a');
      a.href = whatsappUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(whatsappUrl, '_blank');
    }
    setPurchasingItem(null);
  };

  // Asistente de subida (crear / editar)
  const [plantillaAUsar, setPlantillaAUsar] = useState<BibliotecaItem | null>(null);
  const [asistente, setAsistente] = useState<{ id: string | null; inicial: BorradorSubida } | null>(null);

  const abrirAsistente = async (item?: BibliotecaItem) => {
    if (!item) { setAsistente({ id: null, inicial: borradorVacio({ isFree: false, precio: 35 }) }); return; }
    const url = await resolveMediaUrl(item);
    setAsistente({
      id: item.id,
      inicial: borradorVacio({
        titulo: item.titulo, descripcion: item.descripcion, categoria: item.categoria,
        portadaUrl: item.previewImageUrl || '', archivoUrl: url || '', archivoNombre: item.fileName || '',
        adjuntos: item.adjuntos || [], isFree: !!item.isFree, precio: item.precioSoles || 0,
        precioAntes: item.precioOriginalSoles || 0, descuentoPct: item.discountPercentage || 0,
        descuentoHasta: (item.discountExpiryDate || '').slice(0, 16), destacado: !!item.isDestacado,
        enSlider: !!item.enSlider, masComprado: !!item.isMasComprado, plantilla: item.plantilla || null,
      }),
    });
  };
  const handleStartEdit = (item: BibliotecaItem) => { abrirAsistente(item); };

  const guardarDesdeAsistente = async (b: BorradorSubida) => {
    const editId = asistente?.id || null;
    const itemId = editId || `bib_${Date.now()}`;
    let storedUrl = b.archivoUrl.trim();
    if (storedUrl.length > 150000 || storedUrl.startsWith('data:')) {
      await saveBibliotecaFile(itemId, storedUrl);
      storedUrl = `indexeddb://${itemId}`;
    }
    const previo = editId ? items.find(i => i.id === editId) : undefined;
    const itemData: BibliotecaItem = {
      ...(previo || {}),
      id: itemId,
      tipo: previo?.tipo || 'documento',
      titulo: b.titulo.trim(),
      descripcion: b.descripcion.trim(),
      categoria: b.categoria.trim(),
      isFree: b.isFree,
      precioSoles: b.isFree ? 0 : Number(b.precio) || 0,
      precioOriginalSoles: !b.isFree && b.precioAntes > b.precio ? b.precioAntes : undefined,
      isOferta: !b.isFree && (b.precioAntes > b.precio || b.descuentoPct > 0),
      isMasComprado: b.masComprado,
      isDestacado: b.destacado,
      enSlider: b.enSlider,
      adjuntos: b.adjuntos,
      plantilla: b.plantilla || undefined,
      fileName: b.archivoNombre.trim() || previo?.fileName || 'documento_tecnico.pdf',
      enlaceDescargaUrl: storedUrl,
      previewImageUrl: b.portadaUrl,
      imageWidth: 0,
      imageHeight: 0,
      discountPercentage: b.isFree ? 0 : b.descuentoPct || 0,
      discountExpiryDate: b.descuentoPct && b.descuentoHasta ? new Date(b.descuentoHasta).toISOString() : '',
      allowedUserIds: previo?.allowedUserIds || [],
    };
    // Firestore no acepta undefined.
    Object.keys(itemData).forEach(k => (itemData as any)[k] === undefined && delete (itemData as any)[k]);
    const updatedItems = editId ? items.map(i => i.id === editId ? itemData : i) : [itemData, ...items];
    setItems(updatedItems);
    await saveBibliotecaBackup(updatedItems);
    setAsistente(null);
  };

  // Alternar ⭐ destacado / 🎞️ carrusel desde la tarjeta (admin).
  const alternar = async (item: BibliotecaItem, campo: 'isDestacado' | 'enSlider') => {
    const updated = items.map(i => i.id === item.id ? { ...i, [campo]: !i[campo] } : i);
    setItems(updated);
    await saveBibliotecaBackup(updated);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const idToDelete = itemToDelete.id;
    setItemToDelete(null);

    try {
      await deleteBibliotecaFile(idToDelete);
      await deleteRecord('biblioteca', idToDelete);
    } catch (err) {
      console.warn('Cleanup on deletion:', err);
    }

    setItems((prevItems) => {
      const updated = prevItems.filter(i => i.id !== idToDelete);
      saveBibliotecaBackup(updated);
      return updated;
    });
  };

  const toggleUserAccess = async (item: BibliotecaItem, userKey: string) => {
    const currentAllowed = item.allowedUserIds || [];
    let updated: string[];
    if (currentAllowed.includes(userKey)) {
      updated = currentAllowed.filter(id => id !== userKey);
    } else {
      updated = [...currentAllowed, userKey];
    }

    const newItems = items.map(i => {
      if (i.id === item.id) {
        return { ...i, allowedUserIds: updated };
      }
      return i;
    });

    setItems(newItems);
    await saveBibliotecaBackup(newItems);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION - RECURSOS TÉCNICOS */}
      <header className="mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-indigo-600" />
              Recursos Técnicos
            </h1>
            <p className="text-slate-500 mt-1">Planos de ingeniería, manuales de taller, fichas técnicas y catálogos en PDF para descarga.</p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCategoryManager(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>Gestión Categorías</span>
              </button>

            </div>
          )}
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN ESTILO PROYECTOS & CLIENTES */}
        <div className="flex border-b border-slate-200 mt-6 space-x-2 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('todos'); setSelectedCategory('all'); }}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'todos'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Todos los Recursos ({items.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('ofertas'); setSelectedCategory('all'); }}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'ofertas'
                ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Destacados</span>
          </button>

          <button
            onClick={() => { setActiveTab('plantillas'); setSelectedCategory('all'); }}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
              activeTab === 'plantillas'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutTemplate className="w-4 h-4 text-emerald-600" />
            <span>Plantillas ({items.filter(i => i.plantilla).length})</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
                activeTab === 'admin'
                  ? 'border-slate-800 text-slate-900 bg-slate-100/80 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestión Admin</span>
            </button>
          )}
        </div>
      </header>

      {activeTab !== 'admin' ? (
        <div className="space-y-4">
          {/* CARRUSEL DE DESTACADOS */}
          {(() => {
            const enCarrusel = items.filter(i => i.enSlider);
            return enCarrusel.length > 0 && (
              <SliderDestacados laminas={enCarrusel.map(item => ({
                id: item.id,
                titulo: item.titulo,
                descripcion: item.descripcion,
                imagen: item.previewImageUrl,
                etiqueta: item.isMasComprado ? 'Más comprado' : item.categoria,
                gratis: !!item.isFree,
                precio: item.precioSoles || 0,
                precioAntes: item.precioOriginalSoles,
                descuentoPct: item.discountPercentage,
                descuentoHasta: item.discountExpiryDate,
                textoBoton: hasAccess(item) ? (item.plantilla ? 'Usar plantilla' : 'Ver recurso') : 'Adquirir',
                onAccion: async () => {
                  if (hasAccess(item) && item.plantilla) setPlantillaAUsar(item);
                  else if (hasAccess(item)) {
                    const url = await resolveMediaUrl(item);
                    setViewingItem({ ...item, enlaceDescargaUrl: url });
                  } else handlePurchaseRequest(item);
                },
              }))} />
            );
          })()}
          {/* BARRA DE BÚSQUEDA Y FILTRADO RÁPIDO */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por plano, manual o tema técnico..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-slate-400 transition-all shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoría:</span>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-slate-400"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'Todas las Categorías' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* LISTA DE RECURSOS - DISEÑO SIMPLE, ELEGANTE Y EJECUTIVO */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => {
                const unlocked = hasAccess(item);

                return (
                  <div 
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 group"
                  >
                    {/* Header del Item */}
                    <div className="space-y-3">
                      {item.previewImageUrl && (
                        <div className="w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-100 border border-slate-200/70">
                          <img 
                            src={item.previewImageUrl} 
                            alt={item.titulo} 
                            style={{
                              width: item.imageWidth && item.imageWidth > 0 ? `${item.imageWidth}px` : '100%',
                              height: item.imageHeight && item.imageHeight > 0 ? `${item.imageHeight}px` : '150px',
                              maxWidth: '100%',
                              objectFit: 'cover'
                            }}
                            className="rounded-xl transition-transform duration-300 group-hover:scale-105" 
                          />
                        </div>
                      )}

                      {/* Fila Superior: Icono de Tipo + Categoria | Precio / Acceso Libre */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2.5 rounded-xl shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 truncate">
                            {item.categoria}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {item.isFree ? (
                            <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                              Acceso Libre
                            </span>
                          ) : (
                            (() => {
                              const pricing = getConvertedPriceStr(item.precioSoles || 0, item.discountPercentage);
                              return (
                                <span className="text-[11px] font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/90 shadow-2xs flex items-center gap-1.5 flex-wrap">
                                  {pricing.hasDiscount ? (
                                    <>
                                      <span className="line-through text-slate-400 font-bold text-[10px]">
                                        {pricing.originalStr}
                                      </span>
                                      <span className="text-emerald-600 font-black">
                                        {pricing.discountedStr}
                                      </span>
                                      <span className="text-emerald-600 font-extrabold text-[9px] bg-emerald-50 px-1 rounded-md">
                                        -{item.discountPercentage}%
                                      </span>
                                    </>
                                  ) : (
                                    <span>{pricing.originalStr}</span>
                                  )}
                                </span>
                              );
                            })()
                          )}
                        </div>
                      </div>

                      {/* Banner de Oferta / Contador de Expiración (si aplica) */}
                      {item.discountExpiryDate && (
                        <div className="w-full flex items-center justify-between gap-2 bg-amber-50/90 border border-amber-200/90 rounded-xl px-2.5 py-1.5 text-[11px] text-amber-900 font-bold">
                          <span className="flex items-center gap-1 text-amber-800 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Oferta</span>
                          </span>
                          <Countdown expiryDate={item.discountExpiryDate} />
                        </div>
                      )}

                      {/* Título y Descripción */}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {item.isDestacado && <Star className="w-3.5 h-3.5 text-amber-500 inline -mt-0.5 mr-1" fill="currentColor" />}
                          {item.plantilla && <span className="inline-block align-middle mr-1.5 text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">Plantilla {NOMBRE_MODULO[item.plantilla.modulo]}</span>}
                          {item.titulo}
                        </h3>
                        {(item.adjuntos?.length || 0) > 0 && (
                          <p className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1"><Paperclip className="w-3 h-3" />{item.adjuntos!.length} archivo(s) adjunto(s)</p>
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.descripcion}
                        </p>
                      </div>
                    </div>

                    {/* Footer y Botones de Acción */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {unlocked && item.plantilla ? (
                          <button
                            onClick={() => setPlantillaAUsar(item)}
                            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          >
                            <LayoutTemplate className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Usar plantilla</span>
                          </button>
                        ) : unlocked ? (
                          <button
                            onClick={async () => {
                              const url = await resolveMediaUrl(item);
                              setViewingItem({ ...item, enlaceDescargaUrl: url });
                            }}
                            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Ver Recurso</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchaseRequest(item)}
                            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                            <span className="truncate">
                              Solicitar Recurso ({
                                (() => {
                                  const pricing = getConvertedPriceStr(item.precioSoles || 0, item.discountPercentage);
                                  return pricing.discountedStr;
                                })()
                              })
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Herramientas de Administración Inline */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl shrink-0">
                          <button
                            onClick={() => alternar(item, 'isDestacado')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white ${item.isDestacado ? 'text-amber-500' : 'text-slate-400'}`}
                            title={item.isDestacado ? 'Quitar de Destacados' : 'Marcar como Destacado'}
                          >
                            <Star className="w-3.5 h-3.5" fill={item.isDestacado ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => alternar(item, 'enSlider')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white ${item.enSlider ? 'text-indigo-600' : 'text-slate-400'}`}
                            title={item.enSlider ? 'Quitar del carrusel' : 'Mostrar en el carrusel'}
                          >
                            <GalleryHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveManagerItemId(item.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Gestionar accesos de usuarios / PINs"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Editar recurso"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="Eliminar recurso"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No se encontraron recursos técnicos</h3>
              <p className="text-slate-400 text-xs">Prueba con otro término de búsqueda o selecciona otra categoría.</p>
            </div>
          )}
        </div>
      ) : (
        /* PANEL DE GESTIÓN ADMINISTRATIVA */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Publicar nuevo recurso (asistente de 3 pasos) */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 self-start">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              Publicar recurso técnico
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Un asistente de 3 pasos: <b>qué es</b>, <b>archivos</b> (portada, documento y adjuntos) y <b>publicación</b> (precio, descuento, ⭐ destacado y carrusel). Ves la tarjeta tal como la verá el usuario.
            </p>
            <button
              onClick={() => abrirAsistente()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" /> Nuevo recurso
            </button>
          </div>

          {/* Lista de Inventario y Accesos */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              Recursos Técnicos Registrados ({items.length})
            </h2>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {items.map(item => (
                <div 
                  key={item.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-indigo-100 text-indigo-700">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">{item.titulo}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.categoria} • {item.isFree ? 'Acceso Libre' : formatCurrencyWithSymbol(convertAmount(item.precioSoles || 0, 'PEN', getCompanyCurrency().code))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => setActiveManagerItemId(item.id)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <KeyRound className="w-3 h-3 text-emerald-600" />
                      <span>PINs ({item.allowedUserIds?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 bg-white border border-slate-200 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {plantillaAUsar?.plantilla && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-slate-800">Usar plantilla</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Se abrirá <b>{NOMBRE_MODULO[plantillaAUsar.plantilla.modulo]}</b> con una copia de “{plantillaAUsar.titulo}” para que la ajustes a tu obra.
              El diseño que tenías abierto se guarda como respaldo.
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setPlantillaAUsar(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">Cancelar</button>
              <button onClick={() => { const it = plantillaAUsar; setPlantillaAUsar(null); usarPlantilla(it.plantilla!, it.titulo); }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black cursor-pointer">Abrir plantilla</button>
            </div>
          </div>
        </div>
      )}

      {asistente && (
        <AsistenteSubida
          modo="recurso"
          editando={!!asistente.id}
          inicial={asistente.inicial}
          categorias={allPresetCategories}
          onGuardar={guardarDesdeAsistente}
          onCerrar={() => setAsistente(null)}
        />
      )}

      {/* MODAL DE GESTIÓN DE ACCESOS Y PINS DE USUARIOS */}
      {activeManagerItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Accesos y PINs Autorizados
                </h3>
              </div>
              <button 
                onClick={() => setActiveManagerItemId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Selecciona los usuarios o colaboradores que tienen permiso para acceder a: <strong>{activeManagerItem.titulo}</strong>
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={grantUserSearch}
                onChange={e => setGrantUserSearch(e.target.value)}
                placeholder="Buscar usuario o colaborador..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
              {usuariosList
                .filter(u => u.name.toLowerCase().includes(grantUserSearch.toLowerCase()) || (u.email && u.email.toLowerCase().includes(grantUserSearch.toLowerCase())))
                .map(u => {
                  const isGranted = (activeManagerItem.allowedUserIds || []).includes(u.id);
                  return (
                    <div key={u.id} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{u.name}</div>
                        <div className="text-[10px] text-slate-400">PIN: {u.pin || '••••'} • {u.role || 'Usuario'}</div>
                      </div>
                      <button
                        onClick={() => toggleUserAccess(activeManagerItem, u.id)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          isGranted 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isGranted ? '✓ Habilitado' : '+ Habilitar'}
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveManagerItemId(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SOLICITUD DE RECURSO / WHATSAPP */}
      {purchasingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Solicitar Acceso a Recurso
              </h3>
              <button onClick={() => setPurchasingItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-slate-900 text-sm">{purchasingItem.titulo}</h4>
              <p className="text-slate-500 leading-relaxed">{purchasingItem.descripcion}</p>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-600">Inversión:</span>
                <span className="text-base font-black text-indigo-600">S/ {(purchasingItem.precioSoles || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPurchasingItem(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>
              <button
                onClick={() => handlePurchaseRequest(purchasingItem)}
                className="flex-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Solicitar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN DE ELIMINAR */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900">¿Eliminar este recurso?</h3>
            <p className="text-xs text-slate-500">
              Se eliminará <strong>{itemToDelete.titulo}</strong> de forma permanente.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setItemToDelete(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancelar
              </button>
              <button onClick={confirmDeleteItem} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE VISUALIZACIÓN DE RECURSO */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-sm truncate">{viewingItem.titulo}</h3>
              <div className="flex items-center gap-2">
                {!viewingItem.isFree && (
                  <a
                    href={pdfBlobUrl || viewingItem.enlaceDescargaUrl || '#'}
                    download={viewingItem.fileName || 'documento.pdf'}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </a>
                )}
                 <button onClick={() => setViewingItem(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            {(viewingItem.adjuntos?.length || 0) > 0 && (
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex gap-2 overflow-x-auto">
                {viewingItem.adjuntos!.map((a, k) => (
                  <a key={a.url + k} href={a.url} target="_blank" rel="noopener noreferrer" download={a.nombre}
                    className="shrink-0 flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 pr-3 hover:border-indigo-300 max-w-[220px]">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {a.tipo.startsWith('image/') ? <img src={a.url} alt="" className="w-full h-full object-cover" /> : <Paperclip className="w-4 h-4 text-slate-500" />}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 truncate">{a.nombre}</span>
                  </a>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-auto bg-slate-100 relative min-h-0 flex flex-col justify-center items-center w-full h-full">
              {isLoadingPdf ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h4 className="text-sm font-extrabold text-slate-800">Cargando documento...</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed mx-auto">
                    Preparando visor de alta velocidad.
                  </p>
                </div>
              ) : (
                <iframe
                  src={pdfBlobUrl || (() => {
                    const url = viewingItem.enlaceDescargaUrl || '';
                    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
                      let fileId = '';
                      if (url.includes('/file/d/')) {
                        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) fileId = match[1];
                      } else if (url.includes('id=')) {
                        const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) fileId = match[1];
                      } else if (url.includes('/d/')) {
                        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) fileId = match[1];
                      }
                      if (fileId) {
                        return `https://drive.google.com/file/d/${fileId}/preview`;
                      }
                    }
                    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                  })()}
                  className="w-full h-full border-0 bg-white"
                  title="Visor de Recurso"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN DE CATEGORÍAS (BIBLIOTECA PREMIUM / RECURSOS TÉCNICOS) */}
      {showCategoryManager && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  Gestión de Categorías - Recursos Técnicos
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-500 leading-relaxed">
                Revisa y elimina las categorías duplicadas o redundantes de tu biblioteca. Al eliminar una categoría, todos sus libros o planos asociados se reasignarán automáticamente.
              </p>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {allPresetCategories.map(cat => {
                  const count = items.filter(item => item.categoria && item.categoria.trim().toLowerCase() === cat.trim().toLowerCase()).length;
                  
                  return (
                    <div key={cat} className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                          <FolderOpen className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{cat}</p>
                          <p className="text-[10px] text-slate-500">{count} recursos asociados</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Eliminar esta categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowCategoryManager(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
