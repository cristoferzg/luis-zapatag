import React, { useState, useEffect } from 'react';
import { 
  Video, Play, Plus, Trash2, Edit2, Search, FolderPlus,
  Lock, X, FileVideo, UploadCloud,
  ShoppingCart, UserCheck, MessageCircle,
  AlertTriangle, Sliders, KeyRound, Sparkles, Users,
  Folder, ArrowLeft, GraduationCap, BookOpen, 
  CheckCircle2, ListChecks, LayoutGrid, ChevronRight, ChevronLeft, Star, Check
} from 'lucide-react';
import { useFirestoreArraySync, updateRecord, deleteRecord } from '../lib/db';
import { uploadFileToFirebaseStorage } from '../lib/storage';
import { safeStorage } from '../lib/storageManager';
import { UploadProgressBar } from './common/UploadProgressBar';
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
  priceSoles?: number; // Soles price if paid
  isFeatured?: boolean; // Destacado
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
  const [playingLocalBlobUrl, setPlayingLocalBlobUrl] = useState<string | null>(null);

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

  const toggleVideoWatched = (videoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchedVideoIds(prev => {
      const exists = prev.includes(videoId);
      const next = exists ? prev.filter(id => id !== videoId) : [...prev, videoId];
      safeStorage.setItem(`innova_watched_videos_${currentUser?.id || 'guest'}`, next);
      return next;
    });
  };

  // Daily free video limit modal state (configurable free videos per day)
  const [dailyFreeLimit, setDailyFreeLimit] = useState<number>(() => {
    return safeStorage.getItem('innova_admin_daily_limit', 1);
  });
  const [dailyLimitExceededInfo, setDailyLimitExceededInfo] = useState<{
    activeTodayTitle: string;
    activeTodayVideo: TutorialVideo | null;
  } | null>(null);
  const [dailyQuotaInfo, setDailyQuotaInfo] = useState<{
    date: string;
    videoId: string;
    videoTitle: string;
  } | null>(() => {
    return safeStorage.getItem('innova_daily_free_video_quota', null);
  });

  // Admin user access manager modal
  const [showAccessManagerVideo, setShowAccessManagerVideo] = useState<TutorialVideo | null>(null);

  // Modal State for Adding / Editing Video (Admin)
  const [showModal, setShowModal] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoSourceType, setVideoSourceType] = useState<'file' | 'link'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [videoFormError, setVideoFormError] = useState<string | null>(null);

  // Real-time Upload Progress State
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBytesTransferred, setUploadBytesTransferred] = useState(0);
  const [uploadTotalBytes, setUploadTotalBytes] = useState(0);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Modal State for Adding / Editing Course (Admin)
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormError, setCourseFormError] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    description: '',
    isFree: true,
    priceSoles: 49.90,
    isFeatured: false
  });

  // Thumbnail upload progress state
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    externalUrl: '',
    thumbnailUrl: '',
    imageWidth: 0,
    imageHeight: 0,
    isFree: true,
    priceSoles: 39.90,
    isFeatured: false
  });

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    setThumbnailUploadProgress(20);

    try {
      const localDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new window.Image();
      img.src = localDataUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => {
          if (!formData.imageWidth) {
            setFormData(prev => ({ ...prev, imageWidth: img.naturalWidth || 400 }));
          }
          if (!formData.imageHeight) {
            setFormData(prev => ({ ...prev, imageHeight: img.naturalHeight || 225 }));
          }
          resolve();
        };
        img.onerror = () => resolve();
      });

      setThumbnailUploadProgress(60);

      try {
        const cloudThumbUrl = await uploadFileToFirebaseStorage(file, 'thumbnails', (percent) => {
          setThumbnailUploadProgress(60 + Math.round(percent * 0.4));
        });
        setFormData(prev => ({ ...prev, thumbnailUrl: cloudThumbUrl }));
      } catch (cloudErr) {
        setFormData(prev => ({ ...prev, thumbnailUrl: localDataUrl }));
      }
      setThumbnailUploadProgress(100);
    } catch (err) {
      console.warn('Error subiendo miniatura:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, thumbnailUrl: reader.result as string }));
        setThumbnailUploadProgress(100);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingThumbnail(false);
      e.target.value = '';
    }
  };

  // Automatically select the first category if none is set when opening modal
  useEffect(() => {
    if (cursosList.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: cursosList[0].name }));
    }
  }, [cursosList, formData.category]);

  // Clear local blob url state as all videos are cloud-hosted
  useEffect(() => {
    setPlayingLocalBlobUrl(null);
  }, [playingVideo]);

  // Group videos by Course (from cursosList or dynamic categories)
  const coursesMap: Record<string, TutorialVideo[]> = {};
  
  // 1. Initialize with all actual course categories
  cursosList.forEach(c => {
    coursesMap[c.name] = [];
  });

  // 2. Add videos to their categories
  activeVideos.forEach(v => {
    const cat = v.category || 'Otros';
    if (!coursesMap[cat]) {
      coursesMap[cat] = [];
    }
    coursesMap[cat].push(v);
  });

  // Handlers for Video / Lesson Modal
  const handleOpenAddModal = (defaultCategory?: string) => {
    setEditingVideoId(null);
    setSelectedFile(null);
    setVideoSourceType('link');
    setVideoFormError(null);
    setUploadProgress(0);
    setUploadError(null);
    setFormData({
      title: '',
      description: '',
      category: defaultCategory || selectedCourseFolder || cursosList[0]?.name || allPresetCategories[0] || 'Herrería',
      externalUrl: '',
      thumbnailUrl: '',
      imageWidth: 0,
      imageHeight: 0,
      isFree: true,
      priceSoles: 39.90,
      isFeatured: false
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (video: TutorialVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideoId(video.id);
    setSelectedFile(null);
    setVideoFormError(null);
    setUploadProgress(0);
    setUploadError(null);
    const isFileVideo = video.videoUrl.includes('firebasestorage') || video.videoUrl.startsWith('local-video-');
    setVideoSourceType(isFileVideo ? 'file' : 'link');
    setFormData({
      title: video.title,
      description: video.description,
      category: video.category,
      externalUrl: isFileVideo ? '' : video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || '',
      imageWidth: video.imageWidth || 0,
      imageHeight: video.imageHeight || 0,
      isFree: video.isFree !== false,
      priceSoles: video.priceSoles || 39.90,
      isFeatured: !!video.isFeatured
    });
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const lastDotIndex = file.name.lastIndexOf('.');
      const autoTitle = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      const cleanTitle = autoTitle.replace(/[_-]/g, ' ');
      setFormData(prev => ({
        ...prev,
        title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)
      }));
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoFormError(null);

    if (!formData.title.trim()) {
      setVideoFormError('Ingresa un título para la clase.');
      return;
    }

    if (!formData.category.trim()) {
      setVideoFormError('Selecciona o crea un curso para asignar la clase.');
      return;
    }

    setIsProcessingUpload(true);
    try {
      let finalVideoUrl = '';

      if (videoSourceType === 'file') {
        if (selectedFile) {
          setUploadProgress(5);
          setUploadTotalBytes(selectedFile.size);
          setUploadBytesTransferred(0);
          setUploadStatusMsg('Iniciando subida directa a Firebase Cloud Storage...');
          setUploadError(null);

          try {
            setUploadStatusMsg('Subiendo archivo de video a Firebase Cloud Storage...');
            const uploadedUrl = await uploadFileToFirebaseStorage(
              selectedFile,
              'videos',
              (percent, bytesTransferred, totalBytes) => {
                setUploadProgress(percent);
                setUploadBytesTransferred(bytesTransferred);
                setUploadTotalBytes(totalBytes);
                setUploadStatusMsg(`Subiendo a Firebase Cloud... ${percent}%`);
              }
            );
            finalVideoUrl = uploadedUrl;
            setUploadProgress(100);
          } catch (storageErr: any) {
            console.error('Error al subir video a Firebase Storage:', storageErr);
            setVideoFormError(`No se pudo subir a Firebase Storage: ${storageErr.message || 'Error de almacenamiento'}.`);
            setIsProcessingUpload(false);
            return;
          }
        } else {
          if (editingVideoId) {
            const existingVideo = activeVideos.find(v => v.id === editingVideoId);
            finalVideoUrl = existingVideo ? existingVideo.videoUrl : '';
          } else {
            setVideoFormError('Por favor selecciona un archivo de video desde tu dispositivo.');
            setIsProcessingUpload(false);
            return;
          }
        }
      } else {
        if (!formData.externalUrl.trim()) {
          setVideoFormError('Por favor añade un enlace de video (YouTube o MP4).');
          setIsProcessingUpload(false);
          return;
        }
        finalVideoUrl = formData.externalUrl.trim();
      }

      if (editingVideoId) {
        const existingVideo = activeVideos.find(v => v.id === editingVideoId);
        if (!existingVideo) return;

        const updatedItem: TutorialVideo = {
          ...existingVideo,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          videoUrl: finalVideoUrl || existingVideo.videoUrl,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          imageWidth: formData.imageWidth || undefined,
          imageHeight: formData.imageHeight || undefined,
          isFree: formData.isFree,
          priceSoles: Number(formData.priceSoles) || 0,
          isFeatured: formData.isFeatured
        };

        const updatedList = activeVideos.map(v => v.id === editingVideoId ? updatedItem : v);
        updateVideos(updatedList);
        await updateRecord('tutoriales', editingVideoId, updatedItem);

        if (playingVideo?.id === editingVideoId) {
          setPlayingVideo(updatedItem);
        }
      } else {
        const newVideoId = 'tut-' + Date.now();
        const newVideo: TutorialVideo = {
          id: newVideoId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          videoUrl: finalVideoUrl,
          thumbnailUrl: formData.thumbnailUrl || undefined,
          imageWidth: formData.imageWidth || undefined,
          imageHeight: formData.imageHeight || undefined,
          isFree: formData.isFree,
          priceSoles: Number(formData.priceSoles) || 0,
          allowedUserIds: [],
          isFeatured: formData.isFeatured,
          createdAt: new Date().toISOString().split('T')[0]
        };

        const updatedList = [newVideo, ...activeVideos];
        updateVideos(updatedList);
        await updateRecord('tutoriales', newVideoId, newVideo);

        // Ensure category is also recorded in cursos list if not already present
        const categoryName = formData.category.trim();
        const existsInCursos = cursosList.some(c => c.name.trim().toLowerCase() === categoryName.toLowerCase());
        if (!existsInCursos && categoryName) {
          const autoCourseId = 'course-' + Date.now();
          const autoCourse: CourseCategory = {
            id: autoCourseId,
            name: categoryName,
            description: '',
            isFree: formData.isFree,
            priceSoles: Number(formData.priceSoles) || 49.90,
            createdAt: new Date().toISOString().split('T')[0]
          };
          await updateRecord('cursos', autoCourseId, autoCourse);
          setCursosList(prev => [...prev, autoCourse]);
        }
      }

      setShowModal(false);
    } catch (err: any) {
      console.error("Error saving video:", err);
      setVideoFormError(err.message || 'Error al guardar la clase.');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Handlers for Course Categories
  const handleOpenAddCourseModal = () => {
    setEditingCourseId(null);
    setCourseFormError(null);
    setCourseFormData({ name: '', description: '', isFree: true, priceSoles: 49.90, isFeatured: false });
    setShowCourseModal(true);
  };

  const handleOpenEditCourseModal = (course: CourseCategory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCourseId(course.id);
    setCourseFormError(null);
    setCourseFormData({
      name: course.name,
      description: course.description || '',
      isFree: course.isFree !== false,
      priceSoles: course.priceSoles || 49.90,
      isFeatured: !!course.isFeatured
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseFormError(null);

    if (!courseFormData.name.trim()) {
      setCourseFormError('El nombre del curso es obligatorio.');
      return;
    }

    try {
      if (editingCourseId) {
        const existing = cursosList.find(c => c.id === editingCourseId);
        if (!existing) return;

        const oldName = existing.name;
        const newName = courseFormData.name.trim();

        const updatedCourse: CourseCategory = {
          ...existing,
          name: newName,
          description: courseFormData.description.trim(),
          isFree: courseFormData.isFree,
          priceSoles: Number(courseFormData.priceSoles) || 0,
          isFeatured: courseFormData.isFeatured
        };
        await updateRecord('cursos', editingCourseId, updatedCourse);
        setCursosList(prev => prev.map(c => c.id === editingCourseId ? updatedCourse : c));

        // Update all videos belonging to the old name to the new name
        const updatedVideos = activeVideos.map(v => {
          if (v.category === oldName) {
            const updatedVideo = { ...v, category: newName };
            updateRecord('tutoriales', v.id, updatedVideo);
            return updatedVideo;
          }
          return v;
        });
        updateVideos(updatedVideos);

        if (playingVideo && playingVideo.category === oldName) {
          setPlayingVideo({ ...playingVideo, category: newName });
        }
      } else {
        const newCourseId = 'course-' + Date.now();
        const newCourse: CourseCategory = {
          id: newCourseId,
          name: courseFormData.name.trim(),
          description: courseFormData.description.trim(),
          isFree: courseFormData.isFree,
          priceSoles: Number(courseFormData.priceSoles) || 0,
          isFeatured: courseFormData.isFeatured,
          createdAt: new Date().toISOString().split('T')[0]
        };
        await updateRecord('cursos', newCourseId, newCourse);
        setCursosList(prev => [...prev, newCourse]);

        // Automatically assign newly created course to the video form so there is zero confusion or bug
        setFormData(prev => ({ ...prev, category: newCourse.name }));
        setSelectedCourseFolder(newCourse.name);
      }
      setShowCourseModal(false);
    } catch (err: any) {
      console.error(err);
      setCourseFormError(err.message || 'Error al guardar el curso.');
    }
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

  const hasAccessToVideo = (video: TutorialVideo): boolean => {
    if (isAdmin) return true;
    
    // Si un contenido dentro del catálogo o videos es gratis, de manera automática se habilita para todos sin restricciones
    if (video.isFree !== false) return true;

    // Si el curso padre es gratuito, también se habilita automáticamente
    const parentCourse = cursosList.find(c => c.name === video.category);
    if (parentCourse && parentCourse.isFree !== false) {
      return true;
    }

    // Si es de pago, verificar si el colaborador o usuario cuenta con autorización
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
    const message = `Hola Innova Contratistas, deseo adquirir acceso exclusivo para el curso / clase: "${video.title}" (Curso: ${video.category}).\n\n💵 Inversión: ${getFormattedPrice(effectivePrice)}\n👤 Mi usuario/PIN es: ${userIdentifier}\n\nPor favor habilitar mi acceso para poder ingresar.`;
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
        const quotaObj = {
          date: todayStr,
          videoId: video.id,
          videoTitle: video.title
        };
        safeStorage.setItem('innova_daily_free_video_quota', quotaObj);
        setDailyQuotaInfo(quotaObj);
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
            Los videos subidos a Firebase Cloud Storage o enlaces externos están siempre disponibles en todos tus dispositivos.
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
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-slate-700/50 flex items-center gap-2 text-[11px] font-extrabold shadow-lg pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Reproductor Nativo HD • {video.category}</span>
        </div>
      </div>
    );
  };

  const getCategoryTheme = (categoryName: string) => {
    const norm = (categoryName || '').toLowerCase();
    if (norm.includes('herr')) {
      return {
        gradient: 'from-amber-600 via-orange-600 to-amber-900',
        badge: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
        accent: 'text-amber-500',
        icon: '🔥',
        level: 'Herrería & Forja • Taller'
      };
    }
    if (norm.includes('techo')) {
      return {
        gradient: 'from-blue-600 via-sky-600 to-indigo-900',
        badge: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
        accent: 'text-sky-500',
        icon: '🏗️',
        level: 'Techos & Coberturas'
      };
    }
    if (norm.includes('estructura')) {
      return {
        gradient: 'from-indigo-600 via-slate-800 to-indigo-950',
        badge: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
        accent: 'text-indigo-400',
        icon: '📐',
        level: 'Estructuras Pesadas'
      };
    }
    if (norm.includes('soldad')) {
      return {
        gradient: 'from-violet-600 via-purple-700 to-slate-900',
        badge: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
        accent: 'text-purple-400',
        icon: '⚡',
        level: 'Soldadura Calificada'
      };
    }
    if (norm.includes('carpinter')) {
      return {
        gradient: 'from-emerald-600 via-teal-700 to-slate-900',
        badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
        accent: 'text-emerald-400',
        icon: '🛠️',
        level: 'Carpintería Metálica'
      };
    }
    if (norm.includes('plano')) {
      return {
        gradient: 'from-cyan-600 via-blue-700 to-slate-900',
        badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
        accent: 'text-cyan-400',
        icon: '📋',
        level: 'Lectura Técnica'
      };
    }
    return {
      gradient: 'from-slate-800 via-indigo-900 to-slate-950',
      badge: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/30',
      accent: 'text-indigo-400',
      icon: '🎓',
      level: 'Capacitación General'
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
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return v.title.toLowerCase().includes(q) || (v.description && v.description.toLowerCase().includes(q));
      })
    : [];

  // Filter displayVideos for global cards list (matching BibliotecaPremiumView)
  const displayVideos = activeVideos.filter(v => {
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
      if (!v.isFeatured && v.isFree !== false) return false; // Show featured OR paid
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
          isWatched ? 'border-emerald-200 shadow-2xs' : 'border-slate-200 shadow-xs hover:shadow-xl hover:border-indigo-400'
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
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 p-4 text-center">
                <Video className="w-8 h-8 text-indigo-400 opacity-60 mb-1" />
                <span className="text-[11px] font-bold text-slate-300 line-clamp-1">{video.title}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-slate-950/40 group-hover/thumb:bg-slate-950/20 transition-colors flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-hover/thumb:scale-110 transition-transform">
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
                <div className="p-1.5 rounded-xl shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80 truncate">
                  {video.category}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <FileVideo className="w-3.5 h-3.5 text-indigo-500" />
                <span>Lección Práctica</span>
              </div>
            )}

            <div className="shrink-0">
              {video.isFree !== false ? (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                  Gratis
                </span>
              ) : (
                <span className="text-[10px] font-black text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                  {getFormattedPrice(video.priceSoles || 39.90)}
                </span>
              )}
            </div>
          </div>

          {/* Título y Descripción */}
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
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
            title={isWatched ? 'Marcar como pendiente' : 'Marcar como completada'}
          >
            <CheckCircle2 className={`w-4 h-4 ${isWatched ? 'text-emerald-600 fill-emerald-100' : ''}`} />
          </button>

          <div className="flex-1 min-w-0">
            {unlocked ? (
              <button
                onClick={() => handlePlayVideoClick(video)}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
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
                <span className="truncate">Solicitar ({getFormattedPrice(video.priceSoles || 39.90)})</span>
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
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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

  return (
    <div className="w-full min-h-full space-y-6 pb-16 select-none max-w-6xl mx-auto px-3 sm:px-4">
      {/* HEADER DE ACADEMIA TÉCNICA - ESTILO UDEMY PRO */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 p-5 sm:p-7 text-white shadow-xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-black uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                Academia Técnica Innova
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
                <Star className="w-3 h-3 fill-amber-300" />
                Acreditación de Taller
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              {currentUser?.name ? `¡Hola, ${currentUser.name}! Continúa tu aprendizaje` : 'Capacitación Profesional en Estructuras y Metalmecánica'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Lecciones prácticas paso a paso filmadas en taller: domina soldadura, armado de coberturas, forja y lectura de planos.
            </p>

            {/* BARRA DE PROGRESO GLOBAL DEL ESTUDIANTE */}
            <div className="pt-2 space-y-1.5 max-w-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Progreso completado
                </span>
                <span className="font-black text-indigo-300">
                  {activeVideos.filter(v => watchedVideoIds.includes(v.id)).length} de {activeVideos.length} clases ({activeVideos.length > 0 ? Math.round((activeVideos.filter(v => watchedVideoIds.includes(v.id)).length / activeVideos.length) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${activeVideos.length > 0 ? Math.round((activeVideos.filter(v => watchedVideoIds.includes(v.id)).length / activeVideos.length) * 100) : 0}%` 
                  }}
                />
              </div>
            </div>

            {/* ESTADO DE CUPO DIARIO */}
            {!isAdmin && (
              <div className="pt-1">
                {dailyQuotaInfo?.date === new Date().toISOString().split('T')[0] ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-bold">
                    <span>🎁 Clase gratuita de hoy activa:</span>
                    <span className="text-white font-extrabold max-w-[200px] truncate">{dailyQuotaInfo.videoTitle}</span>
                    <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[10px] font-black">1/1 Usada</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
                    <span>🎁 Cupo diario gratuito:</span>
                    <span className="text-white font-extrabold">{dailyFreeLimit} clase(s) disponible(s) para hoy</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOTONES DE ADMINISTRACIÓN COMPACTOS */}
          {isAdmin && (
            <div className="flex flex-col gap-2 shrink-0 bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-sm sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                Panel Instructor Admin
              </span>
              <div className="flex flex-col sm:flex-row md:flex-col gap-2">
                <button
                  onClick={handleOpenAddCourseModal}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Crear Curso</span>
                </button>
                <button
                  onClick={() => handleOpenAddModal(selectedCourseFolder || undefined)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Clase</span>
                </button>
                <button
                  onClick={() => setShowCategoryManagerModal(true)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Categorías</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PESTAÑAS DE NAVEGACIÓN ESTILO UDEMY */}
        <div className="flex border-t border-slate-800 mt-6 pt-3 space-x-2 sm:space-x-3 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('cursos'); setSelectedCourseFolder(null); }}
            className={`flex items-center space-x-2 py-2 px-3.5 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer ${
              activeTab === 'cursos'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Todos los Cursos ({allCourseItems.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('ofertas'); setSelectedCourseFolder(null); setSelectedCategoryFilter('all'); }}
            className={`flex items-center space-x-2 py-2 px-3.5 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer ${
              activeTab === 'ofertas'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>⭐ Destacadas / Ofertas</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => { setActiveTab('admin'); setSelectedCourseFolder(null); }}
              className={`flex items-center space-x-2 py-2 px-3.5 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestión Admin</span>
            </button>
          )}
        </div>
      </header>

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
              {/* HERO BANNER DEL CURSO ESTILO UDEMY */}
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${courseTheme.gradient} border border-slate-700/60 p-5 sm:p-7 text-white shadow-xl`}>
                <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-black/30 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  {/* Fila Superior: Botón Volver y Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedCourseFolder(null)}
                      className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 font-bold text-xs shadow-xs"
                      title="Volver al catálogo de cursos"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver al Catálogo de Cursos</span>
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border backdrop-blur-md shadow-xs ${courseTheme.badge}`}>
                        <span>{courseTheme.icon}</span>
                        <span>{courseTheme.level}</span>
                      </span>

                      {currentCourseObj.isFeatured && (
                        <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Curso Destacado</span>
                        </span>
                      )}

                      {currentCourseObj.isFree ? (
                        <span className="text-xs font-black text-emerald-300 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40 backdrop-blur-xs">
                          100% Gratuito
                        </span>
                      ) : (
                        <span className="text-xs font-black text-amber-200 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40 backdrop-blur-xs">
                          {getFormattedPrice(currentCourseObj.priceSoles || 49.90)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título y Descripción del Curso */}
                  <div className="space-y-2 max-w-3xl">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
                      {currentCourseObj.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
                      {currentCourseObj.description || `Formación técnica integral y lecciones prácticas paso a paso filmadas en taller para perfeccionar tu dominio en ${currentCourseObj.name}.`}
                    </p>
                  </div>

                  {/* Barra de Progreso del Alumno y Métricas */}
                  <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/15">
                    <div className="space-y-1.5 flex-1 max-w-md">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white/90 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Tu Progreso en este Curso:
                        </span>
                        <span className="font-black text-emerald-300">
                          {watchedInCurrentCourse} de {currentCourseVideos.length} lecciones ({currentCourseProgressPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/20">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${currentCourseProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Botones Admin en Banner Hero */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                        <button
                          onClick={() => handleOpenAddModal(currentCourseObj.name)}
                          className="px-3.5 py-2 bg-white text-indigo-950 hover:bg-slate-100 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                          title="Subir o enlazar una nueva clase a este curso"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Agregar Clase</span>
                        </button>
                        {currentCourseObj.rawCourse && (
                          <button
                            onClick={(e) => handleOpenEditCourseModal(currentCourseObj.rawCourse!, e)}
                            className="p-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl transition-colors cursor-pointer"
                            title="Editar detalles del curso"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-400 transition-all"
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
                          ? 'bg-white text-indigo-600 shadow-2xs'
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
                          ? 'bg-white text-indigo-600 shadow-2xs'
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
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mx-auto border border-indigo-100">
                    {courseTheme.icon}
                  </div>
                  <p className="text-sm font-extrabold text-slate-800">Este curso aún no tiene clases publicadas</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sube videos de capacitación directamente a este curso para estructurar el temario técnico.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => handleOpenAddModal(currentCourseObj.name)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
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
                            : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
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
                            title={isWatched ? 'Marcar como pendiente' : 'Marcar como completada'}
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
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-indigo-400">
                                <Video className="w-5 h-5 opacity-70" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-950/30 group-hover/th:bg-slate-950/10 flex items-center justify-center transition-colors">
                              <div className="w-6 h-6 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-md">
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
                              ) : (
                                <span className="text-[10px] font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                  {getFormattedPrice(video.priceSoles || 39.90)}
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
                              className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1 leading-snug"
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
                              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
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
                              <span>Solicitar ({getFormattedPrice(video.priceSoles || 39.90)})</span>
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
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-400 transition-all"
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
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
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
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-indigo-400 transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden relative"
                  >
                    {/* BANNER TEMÁTICO SUPERIOR ESTILO UDEMY */}
                    <div className={`relative h-44 w-full bg-gradient-to-br ${theme.gradient} p-4 sm:p-5 flex flex-col justify-between text-white overflow-hidden`}>
                      <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-black/25 rounded-full blur-2xl pointer-events-none" />

                      {/* Fila Superior: Badge Nivel y Precios */}
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border backdrop-blur-md shadow-xs ${theme.badge}`}>
                          <span>{theme.icon}</span>
                          <span className="truncate max-w-[150px]">{theme.level}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {course.isFeatured && (
                            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              <Star className="w-3 h-3 fill-slate-950" />
                              <span>Destacado</span>
                            </span>
                          )}
                          {course.isFree ? (
                            <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 backdrop-blur-xs">
                              100% Gratis
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-200 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40 backdrop-blur-xs">
                              {getFormattedPrice(course.priceSoles || 49.90)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pie del Banner: Insignia 3D y Play Overlay */}
                      <div className="relative z-10 flex items-end justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-md">
                            {theme.icon}
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-wider block">Módulo Técnico</span>
                            <span className="text-xs font-black text-white">{course.videosCount} {course.videosCount === 1 ? 'lección' : 'lecciones'}</span>
                          </div>
                        </div>

                        <div className="w-9 h-9 rounded-full bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-indigo-500 group-hover:border-indigo-400 transition-colors shadow-md">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* CUERPO DE LA TARJETA */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
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
                                ? 'bg-gradient-to-r from-indigo-500 to-emerald-400' 
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* BOTÓN CTA INFERIOR & HERRAMIENTAS ADMIN */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 group-hover:text-indigo-700">
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
                              className="p-1.5 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                              title="Añadir clase a este curso"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            {course.rawCourse && (
                              <button
                                onClick={(e) => handleOpenEditCourseModal(course.rawCourse!, e)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
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
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit border border-indigo-100">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-sm">Gestión de Categorías</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Revisa categorías existentes, unifica nombres duplicados y elimina cursos vacíos.
                </p>
              </div>
              <button
                onClick={() => setShowCategoryManagerModal(true)}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer"
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
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDailyFreeLimit(val);
                      safeStorage.setItem('innova_admin_daily_limit', val);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={1}>1 video gratuito al día (Por defecto)</option>
                    <option value={2}>2 videos gratuitos al día</option>
                    <option value={3}>3 videos gratuitos al día</option>
                    <option value={5}>5 videos gratuitos al día</option>
                    <option value={10}>10 videos gratuitos al día</option>
                    <option value={999}>Ilimitado (Sin restricciones)</option>
                  </select>
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
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-400 transition-all"
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
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 cursor-pointer"
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
            <div className="flex items-center justify-between p-4 border-b border-slate-150 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
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
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
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
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                    <Play className="w-4 h-4 fill-indigo-400" />
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
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
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

      {/* MODAL CREAR / EDITAR CURSO (ADMIN) */}
      {showCourseModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between p-4 border-b border-slate-150 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  {editingCourseId ? 'Editar Curso' : 'Crear Nuevo Curso'}
                </h3>
              </div>
              <button
                onClick={() => setShowCourseModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-4 space-y-3.5">
              {courseFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-700">
                  {courseFormError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Nombre del Curso *
                </label>
                <input
                  type="text"
                  required
                  value={courseFormData.name}
                  onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                  placeholder="Ej: Techos Parabólicos Avanzados"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Descripción Corta
                </label>
                <textarea
                  rows={2}
                  value={courseFormData.description}
                  onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  placeholder="Explica qué temas o técnicas se enseñarán..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Modalidad de Acceso al Curso (Gratuito vs De Pago) */}
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/60 space-y-2.5">
                <label className="block text-[10px] font-extrabold text-slate-800 uppercase">
                  Modalidad de Acceso
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCourseFormData({ ...courseFormData, isFree: true })}
                    className={`p-2 rounded-lg border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      courseFormData.isFree
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🟢 Gratuito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCourseFormData({ ...courseFormData, isFree: false })}
                    className={`p-2 rounded-lg border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !courseFormData.isFree
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>🔒 De Pago</span>
                  </button>
                </div>

                {!courseFormData.isFree && (
                  <div className="pt-1.5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Precio de Venta del Curso Completo (PEN S/.) *
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                        S/.
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        required={!courseFormData.isFree}
                        value={courseFormData.priceSoles}
                        onChange={(e) => setCourseFormData({ ...courseFormData, priceSoles: Number(e.target.value) })}
                        placeholder="Ej: 49.90"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Course featured toggle */}
              <div className="p-3 border border-amber-200 rounded-xl bg-amber-50/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!courseFormData.isFeatured}
                    onChange={(e) => setCourseFormData({ ...courseFormData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    ⭐ Marcar como Curso Destacado (Aparecerá en la pestaña Destacadas)
                  </span>
                </label>
              </div>

              <div className="pt-2.5 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-black rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {editingCourseId ? 'Guardar Cambios' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CLASE (ADMIN) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between p-4 border-b border-slate-150 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                  {editingVideoId ? 'Editar Clase' : 'Agregar Nueva Clase'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitVideo} className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
              {videoFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                  <p>{videoFormError}</p>
                </div>
              )}

              {/* Source Type Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-650 uppercase">
                  Método de Publicación del Video
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVideoSourceType('file')}
                    className={`p-2.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer flex flex-col items-center gap-1 text-center ${
                      videoSourceType === 'file'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-750 shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>☁️ Subir Archivo (Firebase)</span>
                    <span className="text-[9px] font-normal text-slate-500">Subir MP4 directo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVideoSourceType('link')}
                    className={`p-2.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer flex flex-col items-center gap-1 text-center ${
                      videoSourceType === 'link'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-750 shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>🔗 Pegar Enlace</span>
                    <span className="text-[9px] font-normal text-slate-500">YouTube / URL</span>
                  </button>
                </div>
              </div>

              {videoSourceType === 'file' ? (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">
                    Seleccionar Archivo de Video *
                  </label>
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 transition-all bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer group">
                    <input
                      type="file"
                      required={!editingVideoId}
                      accept="video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-8 h-8 text-slate-450 group-hover:text-indigo-500 transition-colors mb-1" />
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-indigo-600 line-clamp-1">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-extrabold text-slate-700">Haz clic para cargar video</p>
                        <p className="text-[10px] text-slate-400">MP4, WebM, MOV a Firebase Cloud</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Enlace / URL de Video (YouTube o MP4 directo) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Título de la Clase *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Paso 1: Cálculo de tijerales en acero"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Course & Category Selector with Preset Chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">
                    Curso / Categoría al que pertenece *
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenAddCourseModal}
                    className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    + Crear Curso Nuevo
                  </button>
                </div>

                <div className="space-y-2 bg-slate-50/80 p-2.5 border border-slate-200 rounded-xl">
                  {/* Selector por chips */}
                  <div className="flex flex-wrap gap-1">
                    {allPresetCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                          formData.category === cat 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs scale-105' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Dropdown y texto libre */}
                  <div className="flex flex-col sm:flex-row gap-1.5 pt-1 border-t border-slate-200/70">
                    <select
                      value={allPresetCategories.includes(formData.category) ? formData.category : '__custom'}
                      onChange={(e) => {
                        if (e.target.value !== '__custom') {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="" disabled>-- Selecciona un curso/categoría --</option>
                      {allPresetCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__custom">+ Escribir categoría personalizada...</option>
                    </select>

                    <input
                      type="text"
                      placeholder="O escribe nueva categoría..."
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cargar Miniatura / Imagen de Portada (Opcional) */}
              <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">
                    Imagen de Portada / Miniatura (Opcional)
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formData.imageWidth && formData.imageHeight ? `${formData.imageWidth} × ${formData.imageHeight} px` : 'Auto'}
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={isUploadingThumbnail}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700"
                />

                {isUploadingThumbnail && (
                  <div className="mt-1">
                    <UploadProgressBar 
                      progress={thumbnailUploadProgress}
                      statusMessage="Subiendo miniatura a la nube..."
                      isComplete={thumbnailUploadProgress >= 100}
                      type="image"
                    />
                  </div>
                )}

                {/* Controles de Dimensiones en Píxeles */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Ancho (px)</label>
                      <input
                        type="number"
                        placeholder="Auto (100%)"
                        value={formData.imageWidth || ''}
                        onChange={(e) => setFormData({ ...formData, imageWidth: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Alto (px)</label>
                      <input
                        type="number"
                        placeholder="Auto (225px)"
                        value={formData.imageHeight || ''}
                        onChange={(e) => setFormData({ ...formData, imageHeight: Number(e.target.value) || 0 })}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* Presets de Tamaño */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageWidth: 0, imageHeight: 0 })}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold border cursor-pointer ${
                        !formData.imageWidth && !formData.imageHeight 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      100% Responsivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageWidth: 400, imageHeight: 225 })}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold border cursor-pointer ${
                        formData.imageWidth === 400 && formData.imageHeight === 225 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      16:9 (400×225 px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageWidth: 280, imageHeight: 180 })}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-bold border cursor-pointer ${
                        formData.imageWidth === 280 && formData.imageHeight === 180 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Miniatura (280×180 px)
                    </button>
                  </div>

                  {/* Vista previa de miniatura */}
                  {formData.thumbnailUrl && (
                    <div className="mt-1.5 p-1.5 bg-white rounded-lg border border-slate-200 flex flex-col items-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase self-start mb-1">Previsualización de Portada:</span>
                      <div className="max-w-full overflow-hidden flex items-center justify-center bg-slate-900 rounded-md p-0.5">
                        <img 
                          src={formData.thumbnailUrl} 
                          alt="Preview" 
                          style={{
                            width: formData.imageWidth && formData.imageWidth > 0 ? `${formData.imageWidth}px` : '100%',
                            height: formData.imageHeight && formData.imageHeight > 0 ? `${formData.imageHeight}px` : '120px',
                            maxWidth: '100%',
                            maxHeight: '180px',
                            objectFit: 'cover'
                          }}
                          className="rounded-md shadow-2xs" 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Individual lesson pricing override */}
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <label className="block text-[10px] font-extrabold text-slate-800 uppercase">
                  Acceso a esta clase específica
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isFree"
                      checked={formData.isFree}
                      onChange={() => setFormData({ ...formData, isFree: true })}
                      className="w-3.5 h-3.5 text-indigo-600"
                    />
                    <span>Gratuita</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isFree"
                      checked={!formData.isFree}
                      onChange={() => setFormData({ ...formData, isFree: false })}
                      className="w-3.5 h-3.5 text-indigo-600"
                    />
                    <span>De Pago Individual</span>
                  </label>
                </div>

                {!formData.isFree && (
                  <div className="pt-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                      Precio Individual (PEN S/.)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                        S/.
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        required={!formData.isFree}
                        value={formData.priceSoles}
                        onChange={(e) => setFormData({ ...formData, priceSoles: Number(e.target.value) })}
                        placeholder="Ej: 39.90"
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Video featured toggle */}
              <div className="p-3 border border-amber-200 rounded-xl bg-amber-50/50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    ⭐ Marcar como Clase / Video Destacado (Aparecerá en la pestaña Destacadas)
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                  Descripción Corta
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles sobre lo que se explica en esta lección..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Real-time Progress Bar for Video Upload */}
              {isProcessingUpload && videoSourceType === 'file' && (
                <div className="pt-2">
                  <UploadProgressBar
                    progress={uploadProgress}
                    fileName={selectedFile?.name}
                    fileSizeBytes={uploadTotalBytes || selectedFile?.size}
                    bytesTransferred={uploadBytesTransferred}
                    statusMessage={uploadStatusMsg}
                    isComplete={uploadProgress >= 100}
                    isError={!!uploadError}
                    errorMessage={uploadError || undefined}
                    type="video"
                  />
                </div>
              )}

              <div className="pt-2.5 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isProcessingUpload}
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingUpload}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessingUpload ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingVideoId ? 'Guardar Cambios' : 'Publicar Clase'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADQUIRIR CURSO / CLASE POR WHATSAPP */}
      {showPurchaseModal && targetPurchaseVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
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
                <h4 className="font-black text-slate-800 text-sm leading-snug">{targetPurchaseVideo.title}</h4>
                <p className="text-slate-500 text-xs font-bold">Curso: {targetPurchaseVideo.category}</p>
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
                <UserCheck className="w-4 h-4 text-indigo-600" />
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs cursor-pointer"
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
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-900 mt-2">
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
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
