import React, { useState, useEffect } from 'react';
import { 
  Video, Play, Plus, Trash2, Edit2, Search, FolderPlus,
  Lock, X, FileVideo,
  ShoppingCart, UserCheck, MessageCircle,
  AlertTriangle, Sliders, KeyRound, Sparkles, Users,
  Folder, ArrowLeft, GraduationCap, BookOpen, 
  CheckCircle2, ListChecks, LayoutGrid, ChevronRight, ChevronLeft, Star, Check, Paperclip, GalleryHorizontal
} from 'lucide-react';
import { useFirestoreArraySync, updateRecord, deleteRecord } from '../lib/db';
import { safeStorage } from '../lib/storageManager';
import AsistenteSubida, { BorradorSubida, borradorVacio } from './common/AsistenteSubida';
import SliderDestacados from './common/SliderDestacados';
import { comprasPermitidas } from '../lib/plataforma';
import { getCompanyCurrency, convertAmount, formatCurrencyWithSymbol } from '../lib/currency';

export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  category: string; // Corresponds to CourseCategory.name
  videoUrl: string; // "local-video-[id]" or direct MP4/Youtube link
  thumbnailUrl?: string; // NUEVO: Imagen de portada de la clase
  imageWidth?: number; // NUEVO
  imageHeight?: number; // NUEVO
  createdAt?: string;
  isEmbed?: boolean;
  isFree?: boolean; // Defaults to true
  priceSoles?: number; // Soles price if paid
  allowedUserIds?: string[]; // IDs of employees who purchased this video/course
  isFeatured?: boolean; // Destacado
  enSlider?: boolean; // aparece en el carrusel de arriba
  adjuntos?: { nombre: string; url: string; tipo: string; tamano?: number }[]; // archivos e imágenes de la clase
}

const PRESET_VIDEO_CATEGORIES = [
  'Herrería',
  'Techos Metálicos',
  'Estructuras Metálicas',
  'Carpintería Metálica',
  'Soldadura Especializada',
  'Armado y Montaje',
  'Lectura de Planos'
];

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  isFree?: boolean; // Defaults to true
  priceSoles?: number; // Soles price if paid (precio GENERAL del curso)
  allowedUserIds?: string[]; // IDs de usuarios con acceso a TODO el curso (se habilita al validar la compra)
  isFeatured?: boolean; // Destacado
  enSlider?: boolean; // aparece en el carrusel de arriba
  portadaUrl?: string; // imagen de portada del curso
  precioAntesSoles?: number; // precio tachado
  discountPercentage?: number;
  discountExpiryDate?: string; // ISO
  adjuntos?: { nombre: string; url: string; tipo: string; tamano?: number }[]; // material del curso
}

export interface SystemUser {
  id: string;
  name: string;
  role: string;
  pin: string;
  lastLogin?: string;
  isActive?: boolean;
}

interface UsabilidadVideosViewProps {
  videos?: TutorialVideo[];
  setVideos?: React.Dispatch<React.SetStateAction<TutorialVideo[]>>;
  isAdmin?: boolean;
  currentSettings?: any;
  currentUser?: any; // The logged-in worker / employeeUser
}

function getYoutubeEmbedUrl(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }
  return null;
}

export const UsabilidadVideosView: React.FC<UsabilidadVideosViewProps> = ({
  videos = [],
  setVideos,
  isAdmin = false,
  currentSettings: _currentSettings,
  currentUser
}) => {
  const [usuariosList] = useFirestoreArraySync<SystemUser>('usuarios', 'global', true);
  const [dbVideos, setDbVideos] = useFirestoreArraySync<TutorialVideo>('tutoriales', 'global', true);
  const [cursosList, setCursosList] = useFirestoreArraySync<CourseCategory>('cursos', 'global', true);

  const activeVideos = setVideos ? videos : dbVideos;

  const getFormattedPrice = (priceSoles: number) => {
    // App Android: sin precios (solo se ve lo que el usuario ya tiene).
    if (!comprasPermitidas()) return 'Habilitado';
    const currency = getCompanyCurrency();
    const converted = convertAmount(priceSoles, 'PEN', currency.code);
    return formatCurrencyWithSymbol(converted, currency);
  };
  const updateVideos = (newList: TutorialVideo[]) => {
    if (setVideos) {
      setVideos(newList);
    } else {
      setDbVideos(newList);
    }
  };

  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');

  // Active playing video modal (Floating Popup Player instead of permanent screen clutter)
  const [playingVideo, setPlayingVideo] = useState<TutorialVideo | null>(null);
  const [playingLocalBlobUrl] = useState<string | null>(null);

  // In-App Confirmation Modal for Deletion (No window.confirm!)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'course' | 'video' | 'all';
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Purchase modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [targetPurchaseVideo, setTargetPurchaseVideo] = useState<TutorialVideo | null>(null);

  // Modo de visualización dentro del curso (Temario Udemy o Cuadrícula)
  const [courseViewMode, setCourseViewMode] = useState<'temario' | 'grid'>('temario');

  // Control de lecciones completadas / vistas estilo Udemy
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>(() => {
    return safeStorage.getItem<string[]>(`innova_watched_videos_${currentUser?.id || 'guest'}`, []);
  });

  // Marcar una lección como vista. Es "pegajoso": una vez vista queda fija y NO
  // se puede desactivar (así el avance del usuario no se pierde por un re-clic).
  const toggleVideoWatched = (videoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchedVideoIds(prev => {
      if (prev.includes(videoId)) return prev; // ya vista → se queda activa
      const next = [...prev, videoId];
      safeStorage.setItem(`innova_watched_videos_${currentUser?.id || 'guest'}`, next);
      return next;
    });
  };

  // Daily free video limit (configurable free videos per day).
  // DEFAULT = Ilimitado (999): así ningún usuario queda limitado a "1 al día"
  // en su propio dispositivo. El valor se sincroniza de forma GLOBAL vía
  // Firestore (abajo) para que el cambio del admin llegue a todos los alumnos.
  const [dailyFreeLimit, setDailyFreeLimit] = useState<number>(() => {
    return safeStorage.getItem('innova_admin_daily_limit', 999);
  });
  const [limitSaved, setLimitSaved] = useState<boolean>(false);

  // Configuración GLOBAL de la Academia (un solo documento, legible por todos).
  const [academiaCfg] = useFirestoreArraySync<{ id: string; dailyFreeLimit?: number }>(
    'config_academia', undefined, true
  );
  useEffect(() => {
    const cfg = academiaCfg.find(c => c.id === 'global');
    if (cfg && typeof cfg.dailyFreeLimit === 'number') {
      setDailyFreeLimit(cfg.dailyFreeLimit);
      safeStorage.setItem('innova_admin_daily_limit', cfg.dailyFreeLimit);
    }
  }, [academiaCfg]);

  // Guarda el límite de forma local (instantáneo) y global (para todos).
  const saveDailyFreeLimit = (val: number) => {
    setDailyFreeLimit(val);
    safeStorage.setItem('innova_admin_daily_limit', val);
    updateRecord('config_academia', 'global', { dailyFreeLimit: val });
    setLimitSaved(true);
    setTimeout(() => setLimitSaved(false), 2500);
  };
  const [dailyLimitExceededInfo, setDailyLimitExceededInfo] = useState<{
    activeTodayTitle: string;
    activeTodayVideo: TutorialVideo | null;
  } | null>(null);

  // Admin user access manager modal
  const [showAccessManagerVideo, setShowAccessManagerVideo] = useState<TutorialVideo | null>(null);

  // Navigation tabs: 'cursos' (Carpetas de Cursos), 'todos' (Todas las clases), 'ofertas' (De Pago / Destacadas), 'admin'
  const [activeTab, setActiveTab] = useState<'cursos' | 'todos' | 'ofertas' | 'admin'>('cursos');
  const [selectedCourseFolder, setSelectedCourseFolder] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState(false);

  // Category deletion & duplicate cleanup handler
  const handleDeleteCategory = async (categoryToDelete: string) => {
    try {
      const matchedCourses = cursosList.filter(c => c.name.trim().toLowerCase() === categoryToDelete.trim().toLowerCase());
      for (const course of matchedCourses) {
        await deleteRecord('cursos', course.id);
      }

      const remainingCats = allPresetCategories.filter(c => c.trim().toLowerCase() !== categoryToDelete.trim().toLowerCase());
      const fallbackCat = remainingCats[0] || 'Herrería';

      const updatedList = activeVideos.map(v => {
        if (v.category.trim().toLowerCase() === categoryToDelete.trim().toLowerCase()) {
          const updated = { ...v, category: fallbackCat };
          updateRecord('tutoriales', v.id, updated);
          return updated;
        }
        return v;
      });

      updateVideos(updatedList);
    } catch (err) {
      console.error("Error al eliminar categoría:", err);
    }
  };

  // All preset categories list
  const allPresetCategories = Array.from(new Set([
    ...PRESET_VIDEO_CATEGORIES,
    ...cursosList.map(c => c.name),
    ...activeVideos.map(v => v.category).filter(Boolean)
  ]));

  // Asistente de subida (cursos y clases)
  const [asistente, setAsistente] = useState<{ modo: 'clase' | 'curso'; id: string | null; inicial: BorradorSubida } | null>(null);

  const handleOpenAddModal = (defaultCategory?: string) => {
    setAsistente({ modo: 'clase', id: null, inicial: borradorVacio({ categoria: defaultCategory || selectedCourseFolder || cursosList[0]?.name || '' }) });
  };

  const handleOpenEditModal = (video: TutorialVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    const esArchivo = video.videoUrl.includes('firebasestorage') || video.videoUrl.startsWith('local-video-');
    setAsistente({
      modo: 'clase', id: video.id,
      inicial: borradorVacio({
        titulo: video.title, descripcion: video.description, categoria: video.category,
        portadaUrl: video.thumbnailUrl || '', archivoUrl: esArchivo ? video.videoUrl : '', archivoNombre: esArchivo ? 'Video actual' : '',
        enlaceVideo: esArchivo ? '' : video.videoUrl, adjuntos: video.adjuntos || [],
        isFree: video.isFree !== false, precio: video.priceSoles || 0, destacado: !!video.isFeatured, enSlider: !!video.enSlider,
      }),
    });
  };

  const handleOpenAddCourseModal = () => {
    setAsistente({ modo: 'curso', id: null, inicial: borradorVacio({ isFree: true, precio: 49.9 }) });
  };

  const handleOpenEditCourseModal = (course: CourseCategory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAsistente({
      modo: 'curso', id: course.id,
      inicial: borradorVacio({
        titulo: course.name, descripcion: course.description || '', portadaUrl: course.portadaUrl || '',
        adjuntos: course.adjuntos || [], isFree: course.isFree !== false, precio: course.priceSoles || 0,
        precioAntes: course.precioAntesSoles || 0, descuentoPct: course.discountPercentage || 0,
        descuentoHasta: (course.discountExpiryDate || '').slice(0, 16), destacado: !!course.isFeatured, enSlider: !!course.enSlider,
      }),
    });
  };

  // Firestore no acepta undefined.
  const limpio = <T extends object>(o: T): T => {
    Object.keys(o).forEach(k => (o as any)[k] === undefined && delete (o as any)[k]);
    return o;
  };

  const guardarClase = async (b: BorradorSubida, editId: string | null) => {
    const videoUrl = b.enlaceVideo.trim() || b.archivoUrl;
    const base = {
      title: b.titulo.trim(),
      description: b.descripcion.trim(),
      category: b.categoria,
      videoUrl,
      thumbnailUrl: b.portadaUrl || undefined,
      isFree: b.isFree,
      priceSoles: b.isFree ? 0 : Number(b.precio) || 0,
      isFeatured: b.destacado,
      enSlider: b.enSlider,
      adjuntos: b.adjuntos,
    };
    if (editId) {
      const existing = activeVideos.find(v => v.id === editId);
      if (!existing) return;
      const updatedItem: TutorialVideo = limpio({ ...existing, ...base, videoUrl: videoUrl || existing.videoUrl });
      updateVideos(activeVideos.map(v => v.id === editId ? updatedItem : v));
      void updateRecord('tutoriales', editId, updatedItem);
      if (playingVideo?.id === editId) setPlayingVideo(updatedItem);
      return;
    }
    const newVideoId = 'tut-' + Date.now();
    const newVideo: TutorialVideo = limpio({ id: newVideoId, ...base, allowedUserIds: [], createdAt: new Date().toISOString().split('T')[0] });
    updateVideos([newVideo, ...activeVideos]);
    void updateRecord('tutoriales', newVideoId, newVideo);
    // Si el curso aún no existe como registro, se crea.
    const categoryName = b.categoria.trim();
    if (categoryName && !cursosList.some(c => c.name.trim().toLowerCase() === categoryName.toLowerCase())) {
      const autoCourse: CourseCategory = { id: 'course-' + Date.now(), name: categoryName, description: '', isFree: b.isFree, priceSoles: Number(b.precio) || 49.90, createdAt: new Date().toISOString().split('T')[0] };
      setCursosList(prev => [...prev, autoCourse]);
      void updateRecord('cursos', autoCourse.id, autoCourse);
    }
  };

  const guardarCurso = async (b: BorradorSubida, editId: string | null) => {
    const datos = {
      name: b.titulo.trim(),
      description: b.descripcion.trim(),
      isFree: b.isFree,
      priceSoles: b.isFree ? 0 : Number(b.precio) || 0,
      precioAntesSoles: !b.isFree && b.precioAntes > b.precio ? b.precioAntes : undefined,
      discountPercentage: b.isFree ? 0 : b.descuentoPct || 0,
      discountExpiryDate: b.descuentoPct && b.descuentoHasta ? new Date(b.descuentoHasta).toISOString() : '',
      isFeatured: b.destacado,
      enSlider: b.enSlider,
      portadaUrl: b.portadaUrl,
      adjuntos: b.adjuntos,
    };
    if (editId) {
      const existing = cursosList.find(c => c.id === editId);
      if (!existing) return;
      const oldName = existing.name;
      const updatedCourse: CourseCategory = limpio({ ...existing, ...datos });
      setCursosList(prev => prev.map(c => c.id === editId ? updatedCourse : c));
      void updateRecord('cursos', editId, updatedCourse);
      if (oldName !== datos.name) {
        // Las clases del curso se mueven al nombre nuevo.
        updateVideos(activeVideos.map(v => {
          if (v.category !== oldName) return v;
          const updatedVideo = { ...v, category: datos.name };
          updateRecord('tutoriales', v.id, updatedVideo);
          return updatedVideo;
        }));
        if (playingVideo && playingVideo.category === oldName) setPlayingVideo({ ...playingVideo, category: datos.name });
        if (selectedCourseFolder === oldName) setSelectedCourseFolder(datos.name);
      }
      return;
    }
    const newCourse: CourseCategory = limpio({ id: 'course-' + Date.now(), ...datos, createdAt: new Date().toISOString().split('T')[0] });
    setCursosList(prev => [...prev, newCourse]);
    void updateRecord('cursos', newCourse.id, newCourse);
    setSelectedCourseFolder(newCourse.name);
  };

  const guardarDesdeAsistente = async (b: BorradorSubida) => {
    if (!asistente) return;
    if (asistente.modo === 'clase') await guardarClase(b, asistente.id);
    else await guardarCurso(b, asistente.id);
    setAsistente(null);
  };

  // ⭐ destacado / 🎞️ carrusel en un toque (admin).
  const alternarCurso = async (course: CourseCategory, campo: 'isFeatured' | 'enSlider') => {
    const updated = { ...course, [campo]: !course[campo] };
    setCursosList(prev => prev.map(c => c.id === course.id ? updated : c));
    await updateRecord('cursos', course.id, updated);
  };

  // In-App Delete Execution (100% reliable, zero window.confirm reliance)
  const confirmExecuteDelete = async () => {
    if (!deleteConfirmation) return;
    setIsDeleting(true);

    try {
      if (deleteConfirmation.type === 'video') {
        const videoId = deleteConfirmation.id;
        const updated = activeVideos.filter(v => v.id !== videoId);
        updateVideos(updated);
        await deleteRecord('tutoriales', videoId);

        if (playingVideo?.id === videoId) {
          setPlayingVideo(null);
        }
      } else if (deleteConfirmation.type === 'course') {
        const courseId = deleteConfirmation.id;
        const courseObj = cursosList.find(c => c.id === courseId);
        const courseName = courseObj ? courseObj.name : deleteConfirmation.title;

        // Delete course category metadata
        await deleteRecord('cursos', courseId);
        setCursosList(prev => prev.filter(c => c.id !== courseId));

        // Find and delete all videos inside this course
        const videosToDelete = activeVideos.filter(v => v.category === courseName);
        for (const v of videosToDelete) {
          await deleteRecord('tutoriales', v.id);
        }

        const updatedVideos = activeVideos.filter(v => v.category !== courseName);
        updateVideos(updatedVideos);

        if (playingVideo && playingVideo.category === courseName) {
          setPlayingVideo(null);
        }
      } else if (deleteConfirmation.type === 'all') {
        // Clear all courses and all videos
        for (const c of cursosList) {
          await deleteRecord('cursos', c.id);
        }
        for (const v of activeVideos) {
          await deleteRecord('tutoriales', v.id);
        }
        setCursosList([]);
        updateVideos([]);
        setPlayingVideo(null);
      }
    } catch (err) {
      console.error("Error executing delete:", err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(null);
    }
  };

  // Access check and pricing calculations
  const getEffectivePrice = (video: TutorialVideo): number => {
    const parentCourse = cursosList.find(c => c.name === video.category);
    if (parentCourse?.isFree === false && parentCourse.priceSoles) {
      return parentCourse.priceSoles;
    }
    return video.priceSoles || 39.90;
  };

  // ¿La clase pertenece a un CURSO DE PAGO? En ese caso el precio es GENERAL del
  // curso (se muestra una sola vez a nivel de curso); las clases solo indican
  // que están "incluidas en el curso" y al comprarlas se habilita todo el curso.
  const isPaidCourseVideo = (video: TutorialVideo): boolean => {
    const parentCourse = cursosList.find(c => c.name === video.category);
    return parentCourse?.isFree === false && !!parentCourse.priceSoles;
  };

  const hasAccessToVideo = (video: TutorialVideo): boolean => {
    if (isAdmin) return true;
    
    // Si un contenido dentro del catálogo o videos es gratis, de manera automática se habilita para todos sin restricciones
    if (video.isFree !== false) return true;

    // Si el curso padre es gratuito, también se habilita automáticamente
    const parentCourse = cursosList.find(c => c.name === video.category);
    if (parentCourse && parentCourse.isFree !== false) {
      return true;
    }

    // ACCESO A NIVEL DE CURSO: si el usuario compró el curso completo, se habilitan
    // TODAS sus clases automáticamente (se agrega al validar la compra).
    if (currentUser?.id && parentCourse?.allowedUserIds?.includes(currentUser.id)) {
      return true;
    }

    // Compatibilidad: acceso individual a una clase suelta.
    if (currentUser?.id && video.allowedUserIds?.includes(currentUser.id)) {
      return true;
    }
    return false;
  };

  const handleOpenPurchase = (video: TutorialVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetPurchaseVideo(video);
    setShowPurchaseModal(true);
  };

  const handlePurchaseRequest = (video: TutorialVideo) => {
    const adminPhone = "+51966000500"; 
    const userIdentifier = currentUser?.name || 'Invitado';
    const effectivePrice = getEffectivePrice(video);
    const message = isPaidCourseVideo(video)
      ? `Hola Innova Contratistas, deseo adquirir el CURSO COMPLETO: "${video.category}" (acceso a todas las clases).\n\n💵 Inversión: ${getFormattedPrice(effectivePrice)}\n👤 Mi usuario/PIN es: ${userIdentifier}\n\nPor favor habilitar mi acceso para poder ingresar.`
      : `Hola Innova Contratistas, deseo adquirir acceso exclusivo para la clase: "${video.title}" (Curso: ${video.category}).\n\n💵 Inversión: ${getFormattedPrice(effectivePrice)}\n👤 Mi usuario/PIN es: ${userIdentifier}\n\nPor favor habilitar mi acceso para poder ingresar.`;
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
    setShowPurchaseModal(false);
  };

  const handleToggleUserAccess = async (userId: string, video: TutorialVideo) => {
    const currentAllowed = video.allowedUserIds || [];
    let updatedAllowed: string[] = [];

    if (currentAllowed.includes(userId)) {
      updatedAllowed = currentAllowed.filter(id => id !== userId);
    } else {
      updatedAllowed = [...currentAllowed, userId];
    }

    const updatedVideo = {
      ...video,
      allowedUserIds: updatedAllowed
    };

    // Optimistic UI update for instant response
    const updatedList = activeVideos.map(v => v.id === video.id ? updatedVideo : v);
    updateVideos(updatedList);
    if (playingVideo?.id === video.id) {
      setPlayingVideo(updatedVideo);
    }
    setShowAccessManagerVideo(updatedVideo);

    // Background sync to Firestore
    try {
      await updateRecord('tutoriales', video.id, updatedVideo);
    } catch (e) {
      console.error("Error updating user access:", e);
    }
  };

  // Video Play Handler with Daily Free Video Limit (1 per day for non-admins)
  const handlePlayVideoClick = (video: TutorialVideo) => {
    const isUnlocked = hasAccessToVideo(video);
    if (!isUnlocked && !comprasPermitidas()) return;
    if (!isUnlocked) {
      setTargetPurchaseVideo(video);
      setShowPurchaseModal(true);
      return;
    }

    // Límite para videos gratuitos: configurable por el administrador
    const isFreeVideo = video.isFree !== false;
    if (!isAdmin && isFreeVideo && dailyFreeLimit < 999) {
      const todayStr = new Date().toISOString().split('T')[0];
      const trackerKey = `innova_daily_quota_${currentUser?.id || 'guest'}_${todayStr}`;
      const viewedVideoIds = safeStorage.getItem<string[]>(trackerKey, []);

      if (viewedVideoIds.length >= dailyFreeLimit && !viewedVideoIds.includes(video.id)) {
        setDailyLimitExceededInfo({
          activeTodayTitle: `Has alcanzado el límite diario de ${dailyFreeLimit} video(s) gratuito(s) permitido(s) para hoy.`,
          activeTodayVideo: null
        });
        return;
      }

      if (!viewedVideoIds.includes(video.id)) {
        const updated = [...viewedVideoIds, video.id];
        safeStorage.setItem(trackerKey, updated);
        safeStorage.setItem('innova_daily_free_video_quota', {
          date: todayStr,
          videoId: video.id,
          videoTitle: video.title
        });
      }
    }

    // Marcar como visto automáticamente al reproducir estilo Udemy
    if (!watchedVideoIds.includes(video.id)) {
      setWatchedVideoIds(prev => {
        const next = [...prev, video.id];
        safeStorage.setItem(`innova_watched_videos_${currentUser?.id || 'guest'}`, next);
        return next;
      });
    }

    setPlayingVideo(video);
  };

  // Video Player Renderer inside the Popup Modal
  const renderPopupPlayer = (video: TutorialVideo) => {
    const youtubeUrl = getYoutubeEmbedUrl(video.videoUrl);
    if (youtubeUrl) {
      return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner">
          <iframe
            src={youtubeUrl}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      );
    }

    if (video.videoUrl && (video.videoUrl.includes('drive.google.com') || video.videoUrl.includes('googleusercontent.com'))) {
      let fileId = '';
      const url = video.videoUrl;

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
        const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        return (
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner group">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            ></iframe>
          </div>
        );
      }
    }

    const videoSrc = video.videoUrl.startsWith('local-video-') ? (playingLocalBlobUrl || '') : video.videoUrl;

    if (video.videoUrl.startsWith('local-video-') && !playingLocalBlobUrl) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-950 aspect-video rounded-xl">
          <FileVideo className="w-12 h-12 text-slate-600 mb-2" />
          <p className="font-extrabold text-slate-300 text-xs">Video Local no Disponible</p>
          <p className="text-[10px] text-slate-500 max-w-xs mt-1">
            Los videos subidos a la nube o enlaces externos están siempre disponibles en todos tus dispositivos.
          </p>
        </div>
      );
    }

    return (
      <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group" onContextMenu={(e) => e.preventDefault()}>
        <video
          key={video.id}
          id={`native-player-${video.id}`}
          src={videoSrc}
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full object-contain bg-slate-950"
          autoPlay
          playsInline
        >
          Tu navegador no soporta la reproducción de video HTML5.
        </video>
      </div>
    );
  };

  const getCategoryTheme = (categoryName: string) => {
    const norm = (categoryName || '').toLowerCase();
    // Paleta sobria y uniforme para toda la Academia: un solo tono neutro
    // (slate) en lugar de un gradiente de color distinto por categoría. Solo
    // cambia la etiqueta de texto del nivel, no el color, para evitar distracción.
    let level = 'Capacitación General';
    if (norm.includes('herr')) level = 'Herrería & Forja • Taller';
    else if (norm.includes('techo')) level = 'Techos & Coberturas';
    else if (norm.includes('estructura')) level = 'Estructuras Pesadas';
    else if (norm.includes('soldad')) level = 'Soldadura Calificada';
    else if (norm.includes('carpinter')) level = 'Carpintería Metálica';
    else if (norm.includes('plano')) level = 'Lectura Técnica';
    return {
      gradient: 'from-slate-700 via-slate-800 to-slate-900',
      badge: 'bg-white/15 text-slate-100 border-white/20',
      accent: 'text-slate-300',
      icon: '🎓',
      level
    };
  };

  // Unified list of all courses for the folder grid view
  const allCourseItems = Array.from(new Set([
    ...cursosList.map(c => c.name.trim()),
    ...activeVideos.map(v => (v.category || '').trim()).filter(Boolean)
  ])).filter(Boolean).map(courseName => {
    const existing = cursosList.find(c => c.name.trim().toLowerCase() === courseName.toLowerCase());
    const videosInCourse = activeVideos.filter(v => (v.category || '').trim().toLowerCase() === courseName.toLowerCase());
    return {
      id: existing?.id || `course-${courseName}`,
      name: courseName,
      description: existing?.description || '',
      isFree: existing ? existing.isFree !== false : true,
      priceSoles: existing?.priceSoles || 49.90,
      isFeatured: !!existing?.isFeatured,
      videosCount: videosInCourse.length,
      videos: videosInCourse,
      rawCourse: existing
    };
  });

  const filteredCourseItems = allCourseItems.filter(course => {
    // App Android: solo cursos con alguna clase habilitada para el usuario.
    if (!comprasPermitidas() && !course.videos.some(hasAccessToVideo)) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return course.name.toLowerCase().includes(q) || course.description.toLowerCase().includes(q);
  });

  // Selected course object and its videos
  const currentCourseObj = selectedCourseFolder 
    ? allCourseItems.find(c => c.name.trim().toLowerCase() === selectedCourseFolder.trim().toLowerCase()) 
    : null;

  const currentCourseVideos = selectedCourseFolder
    ? activeVideos.filter(v => (v.category || '').trim().toLowerCase() === selectedCourseFolder.trim().toLowerCase()).filter(v => {
        if (!comprasPermitidas() && !hasAccessToVideo(v)) return false;
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return v.title.toLowerCase().includes(q) || (v.description && v.description.toLowerCase().includes(q));
      })
    : [];

  // Filter displayVideos for global cards list (matching BibliotecaPremiumView)
  const displayVideos = activeVideos.filter(v => {
    if (!comprasPermitidas() && !hasAccessToVideo(v)) return false;
    // 1. Search term filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = v.title.toLowerCase().includes(q);
      const matchDesc = v.description?.toLowerCase().includes(q);
      const matchCat = v.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    // 2. Tab filter
    if (activeTab === 'ofertas') {
      // Destacados: solo lo que el admin marcó como destacado (la clase o su curso).
      const curso = cursosList.find((c: CourseCategory) => c.name.trim().toLowerCase() === (v.category || '').trim().toLowerCase());
      if (!v.isFeatured && !curso?.isFeatured) return false;
    }

    // 3. Category Filter
    if (selectedCategoryFilter !== 'all') {
      if (v.category.trim().toLowerCase() !== selectedCategoryFilter.trim().toLowerCase()) {
        return false;
      }
    }

    return true;
  });

  const renderVideoCard = (video: TutorialVideo, hideCategoryTag = false) => {
    const unlocked = hasAccessToVideo(video);
    const isWatched = watchedVideoIds.includes(video.id);

    return (
      <div 
        key={video.id} 
        className={`bg-white rounded-3xl border transition-all duration-200 p-4 flex flex-col justify-between space-y-3.5 group relative ${
          isWatched ? 'border-emerald-200 shadow-2xs' : 'border-slate-200 shadow-xs hover:shadow-xl hover:border-slate-400'
        }`}
      >
        <div className="space-y-3">
          {/* Portada / Miniatura con Play Overlay */}
          <div 
            onClick={() => handlePlayVideoClick(video)}
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 cursor-pointer group/thumb"
          >
            {video.thumbnailUrl ? (
              <img 
                src={video.thumbnailUrl} 
                alt={video.title} 
                style={{
                  width: video.imageWidth && video.imageWidth > 0 ? `${video.imageWidth}px` : '100%',
                  height: video.imageHeight && video.imageHeight > 0 ? `${video.imageHeight}px` : '100%',
                  maxWidth: '100%',
                  objectFit: 'cover'
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-center">
                <Video className="w-8 h-8 text-slate-400 opacity-60 mb-1" />
                <span className="text-[11px] font-bold text-slate-300 line-clamp-1">{video.title}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-slate-950/40 group-hover/thumb:bg-slate-950/20 transition-colors flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-slate-600/90 text-white flex items-center justify-center shadow-lg transform group-hover/thumb:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>

            {/* Badges Flotantes en Portada */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
              {isWatched && (
                <span className="bg-emerald-600/95 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Vista</span>
                </span>
              )}
            </div>

            {video.isFeatured && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 fill-slate-950" />
                  <span>Destacada</span>
                </span>
              </div>
            )}
          </div>

          {/* Fila: Icono + Categoría | Precio Tag */}
          <div className="flex items-center justify-between gap-2">
            {!hideCategoryTag ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl shrink-0 flex items-center justify-center bg-slate-50 text-slate-600 border border-slate-100">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80 truncate">
                  {video.category}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <FileVideo className="w-3.5 h-3.5 text-slate-500" />
                <span>Lección Práctica</span>
              </div>
            )}

            <div className="shrink-0">
              {video.isFree !== false ? (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                  Gratis
                </span>
              ) : isPaidCourseVideo(video) ? (
                <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                  Incluida en el curso
                </span>
              ) : (
                <span className="text-[10px] font-black text-slate-900 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                  {getFormattedPrice(getEffectivePrice(video))}
                </span>
              )}
            </div>
          </div>

          {/* Título y Descripción */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-slate-600 transition-colors">
              {video.title}
            </h3>
            {video.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                {video.description}
              </p>
            )}
          </div>
        </div>

        {/* Footer & Botones de Acción */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Botón Marcar Vista */}
          <button
            type="button"
            onClick={(e) => toggleVideoWatched(video.id, e)}
            className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isWatched 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title={isWatched ? 'Lección completada' : 'Marcar como completada'}
          >
            <CheckCircle2 className={`w-4 h-4 ${isWatched ? 'text-emerald-600 fill-emerald-100' : ''}`} />
          </button>

          <div className="flex-1 min-w-0">
            {unlocked ? (
              <button
                onClick={() => handlePlayVideoClick(video)}
                className="w-full py-2.5 px-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span className="truncate">Ver Clase</span>
              </button>
            ) : (
              <button
                onClick={(e) => handleOpenPurchase(video, e)}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">{isPaidCourseVideo(video) ? 'Desbloquear curso' : `Solicitar (${getFormattedPrice(getEffectivePrice(video))})`}</span>
              </button>
            )}
          </div>

          {/* Herramientas Admin Inline */}
          {isAdmin && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setShowAccessManagerVideo(video)}
                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Gestionar accesos de usuarios"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleOpenEditModal(video, e)}
                className="p-1.5 text-slate-500 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Editar clase"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteConfirmation({
                  type: 'video',
                  id: video.id,
                  title: `Clase: "${video.title}"`
                })}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Eliminar clase"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Archivos e imágenes adjuntas (curso o clase).
  const listaAdjuntos = (lista: { nombre: string; url: string; tipo: string }[] | undefined, oscuro = false) => (lista?.length || 0) > 0 && (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {lista!.map((a, k) => (
        <a key={a.url + k} href={a.url} target="_blank" rel="noopener noreferrer" download={a.nombre}
          className={`shrink-0 flex items-center gap-2 rounded-xl p-1.5 pr-3 max-w-[220px] border ${oscuro ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
          <span className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${oscuro ? 'bg-white/10' : 'bg-slate-100'}`}>
            {a.tipo.startsWith('image/') ? <img src={a.url} alt="" className="w-full h-full object-cover" /> : <Paperclip className={`w-4 h-4 ${oscuro ? 'text-slate-300' : 'text-slate-500'}`} />}
          </span>
          <span className={`text-[11px] font-bold truncate ${oscuro ? 'text-slate-200' : 'text-slate-700'}`}>{a.nombre}</span>
        </a>
      ))}
    </div>
  );

  return (
    <div className="w-full min-h-full space-y-6 pb-16 select-none max-w-6xl mx-auto px-3 sm:px-4">
      {/* HEADER COMPACTO Y CLARO (mismo estilo limpio de Recursos Técnicos) */}
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              <GraduationCap className="w-7 h-7 text-slate-700 shrink-0" />
              Academia Técnica
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Lecciones prácticas paso a paso: soldadura, coberturas, forja y lectura de planos.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleOpenAddCourseModal}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" /><span>Crear Curso</span>
              </button>
              <button
                onClick={() => handleOpenAddModal(selectedCourseFolder || undefined)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /><span>Agregar Clase</span>
              </button>
              <button
                onClick={() => setShowCategoryManagerModal(true)}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" /><span>Categorías</span>
              </button>
            </div>
          )}
        </div>

        {/* Progreso del alumno (línea sutil) */}
        {activeVideos.length > 0 && (
          <div className="flex items-center gap-3 max-w-md">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((activeVideos.filter(v => watchedVideoIds.includes(v.id)).length / activeVideos.length) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500 shrink-0">
              {activeVideos.filter(v => watchedVideoIds.includes(v.id)).length} de {activeVideos.length} ({Math.round((activeVideos.filter(v => watchedVideoIds.includes(v.id)).length / activeVideos.length) * 100)}%)
            </span>
          </div>
        )}

        {/* Cupo diario: solo se muestra si realmente hay restricción */}
        {!isAdmin && dailyFreeLimit < 999 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <span>🎁 Cupo diario gratuito: {dailyFreeLimit} clase(s) para hoy</span>
          </div>
        )}

        {/* Pestañas con subrayado (estilo Recursos Técnicos) */}
        <div className="flex gap-5 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('cursos'); setSelectedCourseFolder(null); }}
            className={`pb-2.5 px-0.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'cursos' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Todos los Cursos ({allCourseItems.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('ofertas'); setSelectedCourseFolder(null); setSelectedCategoryFilter('all'); }}
            className={`pb-2.5 px-0.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ofertas' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Destacadas / Ofertas</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => { setActiveTab('admin'); setSelectedCourseFolder(null); }}
              className={`pb-2.5 px-0.5 font-bold text-sm border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'admin' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestión Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* CARRUSEL DE DESTACADOS */}
      {activeTab !== 'admin' && !selectedCourseFolder && (() => {
        const tieneCurso = (c: CourseCategory) => isAdmin || c.isFree !== false || (!!currentUser?.id && !!c.allowedUserIds?.includes(currentUser.id));
        const laminas = [
          ...cursosList.filter(c => c.enSlider && (comprasPermitidas() || tieneCurso(c))).map(c => {
            const clases = activeVideos.filter(v => (v.category || '').trim().toLowerCase() === c.name.trim().toLowerCase());
            const acceso = tieneCurso(c);
            return {
              id: c.id, titulo: c.name, descripcion: c.description, imagen: c.portadaUrl,
              etiqueta: `Curso · ${clases.length} ${clases.length === 1 ? 'lección' : 'lecciones'}`,
              gratis: c.isFree !== false, sinPrecio: !comprasPermitidas(), precio: c.priceSoles || 0, precioAntes: c.precioAntesSoles,
              descuentoPct: c.discountPercentage, descuentoHasta: c.discountExpiryDate,
              textoBoton: acceso ? 'Ver curso' : 'Adquirir',
              onAccion: () => {
                if (!acceso && clases[0]) { setTargetPurchaseVideo(clases[0]); setShowPurchaseModal(true); }
                else { setActiveTab('cursos'); setSelectedCourseFolder(c.name); }
              },
            };
          }),
          ...activeVideos.filter(v => v.enSlider && (comprasPermitidas() || hasAccessToVideo(v))).map(v => ({
            id: v.id, titulo: v.title, descripcion: v.description, imagen: v.thumbnailUrl,
            etiqueta: `Clase · ${v.category}`, gratis: v.isFree !== false && !isPaidCourseVideo(v), sinPrecio: !comprasPermitidas(), precio: getEffectivePrice(v),
            textoBoton: hasAccessToVideo(v) ? 'Ver clase' : 'Adquirir',
            onAccion: () => handlePlayVideoClick(v),
          })),
        ];
        return laminas.length > 0 && <SliderDestacados laminas={laminas} />;
      })()}

      {/* CONTENIDO PRINCIPAL: VISTA INTERIOR DE CARPETA O VISTAS POR PESTAÑAS */}
      {selectedCourseFolder && currentCourseObj ? (
        /* VISTA INTERIOR DEL CURSO SELECCIONADO (ESTILO UDEMY PRO) */
        (() => {
          const courseTheme = getCategoryTheme(currentCourseObj.name);
          const watchedInCurrentCourse = currentCourseVideos.filter(v => watchedVideoIds.includes(v.id)).length;
          const currentCourseProgressPercent = currentCourseVideos.length > 0 
            ? Math.round((watchedInCurrentCourse / currentCourseVideos.length) * 100) 
            : 0;

          return (
            <div className="space-y-5 animate-fadeIn">
              {/* CABECERA DEL CURSO (clara y compacta, en armonía con el catálogo) */}
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedCourseFolder(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Volver al catálogo de cursos"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver al catálogo</span>
                </button>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                        <span>{courseTheme.icon}</span>
                        <span>{courseTheme.level}</span>
                      </span>
                      {currentCourseObj.isFeatured && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>Destacado</span>
                        </span>
                      )}
                      {currentCourseObj.isFree ? (
                        <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          100% Gratuito
                        </span>
                      ) : (
                        <span className="text-[11px] font-black text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                          {getFormattedPrice(currentCourseObj.priceSoles || 49.90)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                      {currentCourseObj.name}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 max-w-2xl leading-relaxed">
                      {currentCourseObj.description || `Formación técnica integral y lecciones prácticas paso a paso para dominar ${currentCourseObj.name}.`}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenAddModal(currentCourseObj.name)}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        title="Subir o enlazar una nueva clase a este curso"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Clase</span>
                      </button>
                      {currentCourseObj.rawCourse && (
                        <button
                          onClick={(e) => handleOpenEditCourseModal(currentCourseObj.rawCourse!, e)}
                          className="p-2 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                          title="Editar detalles del curso"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {listaAdjuntos(currentCourseObj.rawCourse?.adjuntos)}

                {/* Progreso en el curso (línea sutil) */}
                {currentCourseVideos.length > 0 && (
                  <div className="flex items-center gap-3 max-w-md">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${currentCourseProgressPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">
                      {watchedInCurrentCourse} de {currentCourseVideos.length} ({currentCourseProgressPercent}%)
                    </span>
                  </div>
                )}
              </div>

              {/* BARRA DE HERRAMIENTAS: BÚSQUEDA Y SELECTOR DE MODO DE VISTA UDEMY */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Buscar lección en ${currentCourseObj.name}...`}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 transition-all"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[11px] font-bold text-slate-500 pr-1">
                    {currentCourseVideos.length} lecciones
                  </span>

                  {/* SELECTOR DE MODO: TEMARIO UDEMY vs CUADRÍCULA */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setCourseViewMode('temario')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        courseViewMode === 'temario'
                          ? 'bg-white text-slate-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Ver como lista estructurada estilo Udemy"
                    >
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>Temario</span>
                    </button>
                    <button
                      onClick={() => setCourseViewMode('grid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        courseViewMode === 'grid'
                          ? 'bg-white text-slate-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Ver en cuadrícula de tarjetas"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cuadrícula</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTENIDO DE LAS LECCIONES */}
              {currentCourseVideos.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center text-3xl mx-auto border border-slate-100">
                    {courseTheme.icon}
                  </div>
                  <p className="text-sm font-extrabold text-slate-800">Este curso aún no tiene clases publicadas</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sube videos de capacitación directamente a este curso para estructurar el temario técnico.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenAddModal(currentCourseObj.name)}
                      className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Agregar Primera Clase a este Curso</span>
                    </button>
                  )}
                </div>
              ) : courseViewMode === 'temario' ? (
                /* MODO TEMARIO SECUENCIAL ESTILO UDEMY */
                <div className="space-y-3">
                  {currentCourseVideos.map((video, idx) => {
                    const unlocked = hasAccessToVideo(video);
                    const isWatched = watchedVideoIds.includes(video.id);
                    const lessonNum = String(idx + 1).padStart(2, '0');

                    return (
                      <div
                        key={video.id}
                        className={`bg-white rounded-2xl border p-4 sm:p-4.5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                          isWatched 
                            ? 'border-emerald-200 bg-emerald-50/15 shadow-2xs' 
                            : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                        }`}
                      >
                        {/* Lado Izquierdo: Número, Checkbox, Portada y Datos de la Lección */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          {/* Número de Lección */}
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 shrink-0">
                            {lessonNum}
                          </div>

                          {/* Checkbox Interactivo de Completado */}
                          <button
                            type="button"
                            onClick={(e) => toggleVideoWatched(video.id, e)}
                            className={`w-7 h-7 rounded-full border transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                              isWatched 
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs' 
                                : 'bg-slate-50 border-slate-300 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                            }`}
                            title={isWatched ? 'Lección completada' : 'Marcar como completada'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>

                          {/* Miniatura / Thumbnail con Play Overlay */}
                          <div
                            onClick={() => handlePlayVideoClick(video)}
                            className="relative w-20 sm:w-28 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shrink-0 cursor-pointer group/th shadow-2xs"
                          >
                            {video.thumbnailUrl ? (
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/th:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-400">
                                <Video className="w-5 h-5 opacity-70" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-950/30 group-hover/th:bg-slate-950/10 flex items-center justify-center transition-colors">
                              <div className="w-6 h-6 rounded-full bg-slate-600/90 text-white flex items-center justify-center shadow-md">
                                <Play className="w-3 h-3 fill-white ml-0.5" />
                              </div>
                            </div>
                          </div>

                          {/* Título y Metadatos */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {video.isFree !== false ? (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  Gratis
                                </span>
                              ) : isPaidCourseVideo(video) ? (
                                <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Incluida en el curso
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                  {getFormattedPrice(getEffectivePrice(video))}
                                </span>
                              )}

                              {isWatched && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Vista</span>
                                </span>
                              )}

                              {video.isFeatured && (
                                <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>Destacada</span>
                                </span>
                              )}
                            </div>

                            <h4
                              onClick={() => handlePlayVideoClick(video)}
                              className="font-extrabold text-sm text-slate-900 group-hover:text-slate-600 transition-colors cursor-pointer line-clamp-1 leading-snug"
                            >
                              {video.title}
                            </h4>

                            {video.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                                {video.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Lado Derecho: Botón de Reproducción & Herramientas Admin */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          {unlocked ? (
                            <button
                              onClick={() => handlePlayVideoClick(video)}
                              className="py-2 px-4 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>Ver Clase</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleOpenPurchase(video, e)}
                              className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isPaidCourseVideo(video) ? 'Desbloquear curso' : `Solicitar (${getFormattedPrice(getEffectivePrice(video))})`}</span>
                            </button>
                          )}

                          {/* Herramientas Rápidas Admin */}
                          {isAdmin && (
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                              <button
                                onClick={() => setShowAccessManagerVideo(video)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Gestionar accesos de alumnos"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleOpenEditModal(video, e)}
                                className="p-1.5 text-slate-500 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Editar clase"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmation({
                                  type: 'video',
                                  id: video.id,
                                  title: `Clase: "${video.title}"`
                                })}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Eliminar clase"
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
                /* MODO CUADRÍCULA DE TARJETAS */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {currentCourseVideos.map(video => renderVideoCard(video, true))}
                </div>
              )}
            </div>
          );
        })()
      ) : activeTab === 'cursos' ? (
        /* VISTA DE CARPETAS DE CURSOS EN CUADRÍCULA (LAYOUT TIPO CARPETA PRIVADA / PROYECTOS) */
        <div className="space-y-4 animate-fadeIn">
          {/* Barra de Búsqueda y Botón de Creación */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar carpeta de curso..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-[11px] font-bold text-slate-400 pr-1">
                {filteredCourseItems.length} carpetas
              </span>
              {isAdmin && (
                <button
                  onClick={handleOpenAddCourseModal}
                  className="px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Nuevo Curso</span>
                </button>
              )}
            </div>
          </div>

          {/* Rejilla de Carpetas de Cursos */}
          {filteredCourseItems.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3 max-w-md mx-auto">
              <Folder className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No se encontraron cursos</p>
              <p className="text-xs text-slate-400">Crea un nuevo curso o ajusta tu término de búsqueda.</p>
              {isAdmin && (
                <button
                  onClick={handleOpenAddCourseModal}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Crear Primer Curso</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourseItems.map(course => {
                const theme = getCategoryTheme(course.name);
                const watchedInCourse = course.videos.filter(v => watchedVideoIds.includes(v.id)).length;
                const progressPct = course.videosCount > 0 
                  ? Math.round((watchedInCourse / course.videosCount) * 100) 
                  : 0;

                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseFolder(course.name)}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-slate-400 transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden relative"
                  >
                    {course.rawCourse?.portadaUrl && (
                      <div className="aspect-[16/7] bg-slate-100 overflow-hidden">
                        <img src={course.rawCourse.portadaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    {/* CABECERA CLARA Y COMPACTA DEL CURSO */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                          {theme.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Módulo Técnico</span>
                          <span className="text-xs font-black text-slate-700">
                            {course.videosCount} {course.videosCount === 1 ? 'lección' : 'lecciones'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {course.isFeatured && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>Destacado</span>
                          </span>
                        )}
                        {course.isFree ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            100% Gratis
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                            {getFormattedPrice(course.priceSoles || 49.90)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CUERPO DE LA TARJETA */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-slate-600 transition-colors line-clamp-1 leading-snug">
                          {course.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {course.description || `Formación técnica integral en ${course.name}. Aprende métodos de taller, buenas prácticas y técnicas de fabricación.`}
                        </p>
                      </div>

                      {/* Barra de Progreso del Alumno en este Curso */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600 flex items-center gap-1">
                            {watchedInCourse > 0 ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-700 font-extrabold">{watchedInCourse} de {course.videosCount} completadas</span>
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                <span>{course.videosCount} lecciones disponibles</span>
                              </>
                            )}
                          </span>
                          <span className="font-black text-slate-700">{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPct === 100 
                                ? 'bg-emerald-500' 
                                : progressPct > 0 
                                ? 'bg-gradient-to-r from-slate-500 to-emerald-400' 
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* BOTÓN CTA INFERIOR & HERRAMIENTAS ADMIN */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 group-hover:text-slate-700">
                          <span>{watchedInCourse > 0 ? 'Continuar Lecciones' : 'Comenzar Curso'}</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {isAdmin && (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 p-1 rounded-xl"
                          >
                            <button
                              onClick={() => handleOpenAddModal(course.name)}
                              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Añadir clase a este curso"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {course.rawCourse && (
                              <>
                                <button
                                  onClick={() => alternarCurso(course.rawCourse!, 'isFeatured')}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white ${course.isFeatured ? 'text-amber-500' : 'text-slate-400'}`}
                                  title={course.isFeatured ? 'Quitar de Destacados' : 'Marcar como Destacado'}
                                >
                                  <Star className="w-3.5 h-3.5" fill={course.isFeatured ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={() => alternarCurso(course.rawCourse!, 'enSlider')}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white ${course.rawCourse.enSlider ? 'text-indigo-600' : 'text-slate-400'}`}
                                  title={course.rawCourse.enSlider ? 'Quitar del carrusel' : 'Mostrar en el carrusel'}
                                >
                                  <GalleryHorizontal className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {course.rawCourse && (
                              <button
                                onClick={(e) => handleOpenEditCourseModal(course.rawCourse!, e)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Editar curso"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirmation({
                                type: 'course',
                                id: course.rawCourse?.id || course.id,
                                title: `Curso: "${course.name}" (${course.videosCount} clases)`
                              })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                              title="Eliminar curso y sus clases"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'admin' ? (
        /* VISTA DE GESTIÓN Y PANEL ADMINISTRATIVO */
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarjeta 1: Gestión de Categorías */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl w-fit border border-slate-100">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-sm">Gestión de Categorías</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Revisa categorías existentes, unifica nombres duplicados y elimina cursos vacíos.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryManagerModal(true)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Abrir Administrador
              </button>
            </div>

            {/* Tarjeta 2: Alumnos Autorizados */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl w-fit border border-emerald-200">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-sm">Alumnos y Accesos</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gestiona permisos por alumno para cursos y lecciones de pago individuales.
                </p>
              </div>
              <button
                onClick={() => {
                  if (activeVideos.length > 0) {
                    setShowAccessManagerVideo(activeVideos[0]);
                  }
                }}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                Ver Lista de Alumnos
              </button>
            </div>

            {/* Tarjeta 3: Límite Diario de Videos Gratuitos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit border border-amber-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-sm">Límite Diario de Visualizaciones</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Configura cuántos videos gratuitos puede ver un alumno/colaborador al día.
                </p>
                <div className="pt-2">
                  <select
                    value={dailyFreeLimit}
                    onChange={(e) => saveDailyFreeLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={999}>Ilimitado (Sin restricciones) — recomendado</option>
                    <option value={1}>1 video gratuito al día</option>
                    <option value={2}>2 videos gratuitos al día</option>
                    <option value={3}>3 videos gratuitos al día</option>
                    <option value={5}>5 videos gratuitos al día</option>
                    <option value={10}>10 videos gratuitos al día</option>
                  </select>
                  <p className={`text-[11px] mt-2 font-bold flex items-center gap-1.5 ${limitSaved ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {limitSaved ? '✓ Guardado — se aplica a TODOS tus usuarios' : 'El cambio se guarda automáticamente para todos.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DE TODAS LAS CLASES / DESTACADAS */
        <div className="space-y-4 animate-fadeIn">
          {/* BARRA DE BÚSQUEDA Y FILTRO DE CATEGORÍA */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar clases por nombre o tema..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 transition-all"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-slate-400 cursor-pointer"
                >
                  <option value="all">Todas las Categorías</option>
                  {allPresetCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* REJILLA DE CLASES */}
          {displayVideos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3 max-w-md mx-auto">
              <Video className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No se encontraron clases o videos</p>
              <p className="text-xs text-slate-400">Intenta cambiar la categoría o término de búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayVideos.map(video => renderVideoCard(video))}
            </div>
          )}
        </div>
      )}

      {/* MODAL GESTIÓN DE CATEGORÍAS Y LIMPIEZA DE DUPLICADOS (ADMIN) */}
      {showCategoryManagerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  Gestión de Categorías & Limpieza de Duplicados
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryManagerModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-500 leading-relaxed">
                Aquí puedes revisar todas las categorías y eliminar categorías duplicadas o no deseadas. Al eliminar una categoría, sus lecciones se reasignarán automáticamente.
              </p>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {allPresetCategories.map(cat => {
                  const assignedCount = activeVideos.filter(v => v.category.trim().toLowerCase() === cat.trim().toLowerCase()).length;
                  
                  return (
                    <div key={cat} className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 shrink-0">
                          <Video className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{cat}</p>
                          <p className="text-[10px] text-slate-500">{assignedCount} lecciones asignadas</p>
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
                onClick={() => setShowCategoryManagerModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPRODUCTOR DE VIDEO EMERGENTE (POPUP PLAYER) */}
      {playingVideo && (() => {
        const isPlayingWatched = watchedVideoIds.includes(playingVideo.id);
        const courseVideosForPlayer = activeVideos.filter(v => 
          (v.category || '').trim().toLowerCase() === (playingVideo.category || '').trim().toLowerCase()
        );
        const currentVideoIndex = courseVideosForPlayer.findIndex(v => v.id === playingVideo.id);
        const prevVideo = currentVideoIndex > 0 ? courseVideosForPlayer[currentVideoIndex - 1] : null;
        const nextVideo = currentVideoIndex >= 0 && currentVideoIndex < courseVideosForPlayer.length - 1 
          ? courseVideosForPlayer[currentVideoIndex + 1] 
          : null;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-800 text-white animate-scaleUp">
              <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-slate-500/20 text-slate-400 rounded-xl">
                    <Play className="w-4 h-4 fill-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-black text-white truncate">
                        {playingVideo.title}
                      </h3>
                      {isPlayingWatched && (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Vista</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Curso: {playingVideo.category} {currentVideoIndex >= 0 ? `• Lección ${currentVideoIndex + 1} de ${courseVideosForPlayer.length}` : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 sm:p-4 bg-black">
                {renderPopupPlayer(playingVideo)}
              </div>

              {/* BARRA DE NAVEGACIÓN Y DETALLES DEL REPRODUCTOR */}
              <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {playingVideo.description || 'Lección práctica filmada en taller con explicación técnica paso a paso.'}
                  </p>
                  {listaAdjuntos(playingVideo.adjuntos, true)}
                  {playingVideo.createdAt && (
                    <p className="text-[10px] text-slate-500">
                      Fecha de publicación: {playingVideo.createdAt}
                    </p>
                  )}
                </div>

                {/* Controles de avance de lección estilo Udemy */}
                <div className="flex items-center gap-2 flex-wrap shrink-0 self-end md:self-center">
                  <button
                    onClick={() => toggleVideoWatched(playingVideo.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isPlayingWatched 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30' 
                        : 'bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10'
                    }`}
                    title={isPlayingWatched ? 'Marcar lección como pendiente' : 'Marcar lección como completada'}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isPlayingWatched ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{isPlayingWatched ? 'Completada ✓' : 'Marcar Completada'}</span>
                  </button>

                  {prevVideo && (
                    <button
                      onClick={() => handlePlayVideoClick(prevVideo)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      title={`Lección anterior: ${prevVideo.title}`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>
                  )}

                  {nextVideo && (
                    <button
                      onClick={() => handlePlayVideoClick(nextVideo)}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                      title={`Siguiente lección: ${nextVideo.title}`}
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => setPlayingVideo(null)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL IN-APP DE CONFIRMACIÓN DE ELIMINACIÓN (SIN CONFIRM NATIVO) */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800">
                  ¿Confirmar Eliminación?
                </h3>
                <p className="text-xs text-slate-600">
                  Estás a punto de eliminar definitivamente:
                </p>
                <p className="text-xs font-black text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                  {deleteConfirmation.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  Esta acción es irreversible y no se podrá deshacer.
                </p>
              </div>

              <div className="pt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmation(null)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmExecuteDelete}
                  className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <span>Eliminando...</span>
                  ) : (
                    <span>Sí, Eliminar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {asistente && (
        <AsistenteSubida
          modo={asistente.modo}
          editando={!!asistente.id}
          inicial={asistente.inicial}
          categorias={asistente.modo === 'clase' ? allCourseItems.map(c => c.name) : []}
          onGuardar={guardarDesdeAsistente}
          onCerrar={() => setAsistente(null)}
        />
      )}

      {/* MODAL ADQUIRIR CURSO / CLASE POR WHATSAPP */}
      {showPurchaseModal && targetPurchaseVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Adquirir Acceso</h3>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="text-center pb-1">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Contenido Premium
                </p>
                {isPaidCourseVideo(targetPurchaseVideo) ? (
                  <>
                    <h4 className="font-black text-slate-800 text-sm leading-snug">Curso completo: {targetPurchaseVideo.category}</h4>
                    <p className="text-slate-500 text-xs font-bold">Incluye todas las clases del curso</p>
                  </>
                ) : (
                  <>
                    <h4 className="font-black text-slate-800 text-sm leading-snug">{targetPurchaseVideo.title}</h4>
                    <p className="text-slate-500 text-xs font-bold">Curso: {targetPurchaseVideo.category}</p>
                  </>
                )}
                <p className="text-emerald-600 font-black text-lg mt-1">S/ {getEffectivePrice(targetPurchaseVideo).toFixed(2)}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-600 leading-relaxed">
                <p className="font-extrabold text-slate-800">¿Cómo funciona la compra?</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-xs text-slate-600">
                  <li>Haz clic en <strong className="text-emerald-700">Comprar por WhatsApp</strong>.</li>
                  <li>Envía el mensaje automático con tu nombre o PIN.</li>
                  <li>El administrador activará tu acceso inmediato.</li>
                </ol>
              </div>

              <div className="pt-3 flex flex-col gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePurchaseRequest(targetPurchaseVideo)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Comprar por WhatsApp (S/ {getEffectivePrice(targetPurchaseVideo).toFixed(2)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN DE ACCESOS DE ALUMNOS (ADMIN) */}
      {showAccessManagerVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-600" />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800">Alumnos Autorizados</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Habilita o revoca accesos manualmente</p>
                </div>
              </div>
              <button
                onClick={() => setShowAccessManagerVideo(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
              <p className="text-xs text-slate-600">
                Clase: <strong className="text-slate-800">{showAccessManagerVideo.title}</strong>
              </p>
              
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                {usuariosList.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">No hay alumnos registrados en el sistema.</p>
                ) : (
                  usuariosList.map((usr) => {
                    const isAllowed = showAccessManagerVideo.allowedUserIds?.includes(usr.id) || false;
                    return (
                      <div key={usr.id} className="p-3 flex items-center justify-between text-xs transition-colors hover:bg-slate-50">
                        <div>
                          <p className="font-extrabold text-slate-800">{usr.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">Cargo: {usr.role}</p>
                        </div>
                        <button
                          onClick={() => handleToggleUserAccess(usr.id, showAccessManagerVideo)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isAllowed
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isAllowed ? '✓ Autorizado' : 'Sin Acceso'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAccessManagerVideo(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LÍMITE DE 1 CLASE GRATUITA POR DÍA */}
      {dailyLimitExceededInfo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-3xl mx-auto shadow-sm">
              🎁
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full inline-block">
                Cupo Diario Gratuito (1/1)
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 pt-1">
                Ya utilizaste tu clase gratuita de hoy
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                El acceso gratuito tiene un límite de <strong>1 video por día</strong>. Tu clase asignada para hoy es:
              </p>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs font-bold text-slate-900 mt-2">
                🎬 "{dailyLimitExceededInfo.activeTodayTitle}"
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Puedes seguir repasando tu lección de hoy todas las veces que desees. Mañana a la medianoche se habilitará tu siguiente clase gratuita, o puedes solicitar acceso ilimitado para todo el catálogo.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {dailyLimitExceededInfo.activeTodayVideo && (
                <button
                  type="button"
                  onClick={() => {
                    const target = dailyLimitExceededInfo.activeTodayVideo;
                    setDailyLimitExceededInfo(null);
                    if (target) setPlayingVideo(target);
                  }}
                  className="w-full py-2.5 bg-slate-600 hover:bg-slate-700 active:scale-98 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Ver mi clase gratuita de hoy</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const adminPhone = "+51966000500";
                  const message = `Hola Innova Contratistas, deseo solicitar acceso ILIMITADO a los cursos y videos de la Academia Técnica sin restricción de 1 video diario.`;
                  window.open(`https://wa.me/${adminPhone.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
                  setDailyLimitExceededInfo(null);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Solicitar Acceso Ilimitado (WhatsApp)</span>
              </button>
              <button
                type="button"
                onClick={() => setDailyLimitExceededInfo(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Entendido, volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsabilidadVideosView;
