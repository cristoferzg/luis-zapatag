import React, { useState, useEffect } from 'react';
import { 
  Building2, CreditCard, Save, Download, 
  Upload, Image as ImageIcon, Trash2, 
  ShieldCheck, Phone, Mail, MapPin, Landmark,
  Sparkles, Check, Smartphone, Monitor, Apple, ShieldAlert,
  CheckCircle, Bell, FileSignature, Globe, Coins
} from 'lucide-react';
import { WORLD_CURRENCIES, getCompanyCurrency, saveCompanyCurrency } from '../lib/currency';
import { Project, Client, FinanceRecord, SystemConfig, SystemUser, GlobalNotification } from '../types';
import { Ticket } from './TicketsView';
import { Asesoria } from './AsesoriasView';
import { BibliotecaItem } from './BibliotecaPremiumView';
import { TutorialVideo, CourseCategory } from './UsabilidadVideosView';
import { safeStorage } from '../lib/storageManager';
import { StorageAuditPanel } from './common/StorageAuditPanel';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UploadProgressBar } from './common/UploadProgressBar';
import defaultAdminLogo from '../assets/images/logo_innova_oficial_1791000137990.jpg';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano (S/)', flag: '🇵🇪' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense (US$)', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)', flag: '🇪🇺' },
  { code: 'MXN', symbol: '$ MXN', name: 'Peso Mexicano', flag: '🇲🇽' },
  { code: 'COP', symbol: '$ COP', name: 'Peso Colombiano', flag: '🇨🇴' },
  { code: 'CLP', symbol: '$ CLP', name: 'Peso Chileno', flag: '🇨🇱' },
  { code: 'ARS', symbol: '$ ARS', name: 'Peso Argentino', flag: '🇦🇷' },
  { code: 'BOB', symbol: 'Bs.', name: 'Boliviano', flag: '🇧🇴' },
  { code: 'ECU', symbol: 'US$', name: 'Ecuador (Dólar US$)', flag: '🇪🇨' },
  { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco', flag: '🇬🇹' },
  { code: 'HNL', symbol: 'L', name: 'Lempira Hondureño', flag: '🇭🇳' },
  { code: 'NIO', symbol: 'C$', name: 'Córdoba Nicaragüense', flag: '🇳🇮' },
  { code: 'CRC', symbol: '₡', name: 'Colón Costarricense', flag: '🇨🇷' },
  { code: 'PAB', symbol: 'B/.', name: 'Balboa Panameño / US$', flag: '🇵🇦' },
  { code: 'UYU', symbol: '$ UYU', name: 'Peso Uruguayo', flag: '🇺🇾' },
  { code: 'PYG', symbol: '₲', name: 'Guaraní Paraguayo', flag: '🇵🇾' },
  { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano', flag: '🇩🇴' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño', flag: '🇧🇷' },
  { code: 'VES', symbol: 'Bs.D', name: 'Bolívar Soberano', flag: '🇻🇪' },
  { code: 'CAD', symbol: 'CA$', name: 'Dólar Canadiense', flag: '🇨🇦' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina', flag: '🇬🇧' },
];

interface SettingsViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  finances: FinanceRecord[];
  setFinances: React.Dispatch<React.SetStateAction<FinanceRecord[]>>;
  settings: SystemConfig[];
  setSettings: React.Dispatch<React.SetStateAction<SystemConfig[]>>;
  isAdmin: boolean;
  currentUserName?: string;
  activeUid?: string;
  usuarios?: SystemUser[];
  setUsuarios?: React.Dispatch<React.SetStateAction<SystemUser[]>>;
  cursos?: CourseCategory[];
  setCursos?: React.Dispatch<React.SetStateAction<CourseCategory[]>>;
  tutoriales?: TutorialVideo[];
  setTutoriales?: React.Dispatch<React.SetStateAction<TutorialVideo[]>>;
  biblioteca?: BibliotecaItem[];
  setBiblioteca?: React.Dispatch<React.SetStateAction<BibliotecaItem[]>>;
  tickets?: Ticket[];
  setTickets?: React.Dispatch<React.SetStateAction<Ticket[]>>;
  asesorias?: Asesoria[];
  setAsesorias?: React.Dispatch<React.SetStateAction<Asesoria[]>>;
  globalNotifs?: GlobalNotification[];
  setGlobalNotifs?: (notifs: GlobalNotification[]) => void;
}

export default function SettingsView({
  projects, setProjects,
  clients, setClients,
  finances, setFinances,
  settings, setSettings,
  isAdmin,
  currentUserName,
  activeUid,
  usuarios = [],
  setUsuarios,
  cursos = [],
  setCursos,
  tutoriales = [],
  setTutoriales,
  biblioteca = [],
  setBiblioteca,
  tickets = [],
  setTickets,
  asesorias = [],
  setAsesorias,
  globalNotifs = [],
  setGlobalNotifs
}: SettingsViewProps) {
  const currentSettings = settings[0] || { 
    id: activeUid ? ('settings_' + activeUid) : 'settings_default', 
    appName: isAdmin ? 'Innova Contratistas' : (currentUserName ? `${currentUserName} - Contratista` : 'Mi Empresa'), 
    logoBase64: '' 
  };
  
  const [appName, setAppName] = useState(currentSettings.appName || '');
  const [logoBase64, setLogoBase64] = useState(
    currentSettings.logoBase64 || safeStorage.getItem('innova_logo_' + (activeUid || 'guest'), '') || (isAdmin ? defaultAdminLogo : '')
  );
  const [officialLetterheadBase64, setOfficialLetterheadBase64] = useState(
    currentSettings.officialLetterheadBase64 || safeStorage.getItem('innova_letterhead_' + (activeUid || 'guest'), '') || ''
  );
  const [isUploadingLetterhead, setIsUploadingLetterhead] = useState(false);
  const [contratistaDni, setContratistaDni] = useState(currentSettings.contratistaDni || '');
  const [contratistaDir, setContratistaDir] = useState(currentSettings.contratistaDir || '');
  const [contratistaPhone, setContratistaPhone] = useState(currentSettings.contratistaPhone || '');
  const [contratistaEmail, setContratistaEmail] = useState(currentSettings.contratistaEmail || '');
  
  // Bank accounts
  const [bancoNombre, setBancoNombre] = useState(currentSettings.bancoNombre || (isAdmin ? 'BCP' : ''));
  const [cuentaTitular, setCuentaTitular] = useState(currentSettings.cuentaTitular || '');
  const [pagoCtaBcp, setPagoCtaBcp] = useState(currentSettings.pagoCtaBcp || '');
  const [pagoCciBcp, setPagoCciBcp] = useState(currentSettings.pagoCciBcp || '');
  const [pagoCtaCorriente, setPagoCtaCorriente] = useState(currentSettings.pagoCtaCorriente || '');
  const [pagoDetracciones, setPagoDetracciones] = useState(currentSettings.pagoDetracciones || '');
  const [pagoCciDetracciones, setPagoCciDetracciones] = useState(currentSettings.pagoCciDetracciones || '');
  const [pagoYape, setPagoYape] = useState(currentSettings.pagoYape || '');

  // Currency & Multi-Country
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(() => {
    return currentSettings.currency || getCompanyCurrency().code || 'PEN';
  });

  // Software Version & Cloud Storage
  const [softwareVersion, setSoftwareVersion] = useState(currentSettings.softwareVersion || 'v3.9.5 Pro RNE-2026');

  useEffect(() => {
    setAppName(currentSettings.appName || (isAdmin ? 'Innova Contratistas' : (currentUserName || 'Mi Empresa')));
    setLogoBase64(currentSettings.logoBase64 || safeStorage.getItem('innova_logo_' + (activeUid || 'guest'), '') || (isAdmin ? defaultAdminLogo : ''));
    setOfficialLetterheadBase64(currentSettings.officialLetterheadBase64 || safeStorage.getItem('innova_letterhead_' + (activeUid || 'guest'), '') || '');
    setContratistaDni(currentSettings.contratistaDni || (isAdmin ? '10728381642' : ''));
    setContratistaDir(currentSettings.contratistaDir || (isAdmin ? 'URB.PPAO MZ. I - LT. 10' : ''));
    setContratistaPhone(currentSettings.contratistaPhone || '');
    setContratistaEmail(currentSettings.contratistaEmail || (isAdmin ? 'innovacontratistas@gmail.com' : ''));
    setBancoNombre(currentSettings.bancoNombre || (isAdmin ? 'BCP' : ''));
    setCuentaTitular(currentSettings.cuentaTitular || '');
    setPagoCtaBcp(currentSettings.pagoCtaBcp || '');
    setPagoCciBcp(currentSettings.pagoCciBcp || '');
    setPagoCtaCorriente(currentSettings.pagoCtaCorriente || '');
    setPagoDetracciones(currentSettings.pagoDetracciones || '');
    setPagoCciDetracciones(currentSettings.pagoCciDetracciones || '');
    setPagoYape(currentSettings.pagoYape || '');
    setSoftwareVersion(currentSettings.softwareVersion || 'v3.9.5 Pro RNE-2026');
  }, [currentSettings, isAdmin, activeUid, currentUserName]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const [exeUrl, setExeUrl] = useState(() => safeStorage.getItem('innova_exe_url', ''));
  const [inputExeUrl, setInputExeUrl] = useState(exeUrl);
  const [exeSavedSuccess, setExeSavedSuccess] = useState(false);

  const handleSaveExeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    safeStorage.setItem('innova_exe_url', inputExeUrl.trim());
    setExeUrl(inputExeUrl.trim());
    setExeSavedSuccess(true);
    setTimeout(() => setExeSavedSuccess(false), 2500);
  };

  const compressAndReadLogo = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png', 0.9));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const saveSettings = () => {
    const updatedSettings: SystemConfig = {
      ...currentSettings,
      id: currentSettings.id || (activeUid ? ('settings_' + activeUid) : 'settings_default'),
      appName: appName.trim() || (isAdmin ? 'Innova Contratistas' : 'Mi Empresa'),
      logoBase64,
      officialLetterheadBase64,
      contratistaDni: contratistaDni.trim(),
      contratistaDir: contratistaDir.trim(),
      contratistaPhone: contratistaPhone.trim(),
      contratistaEmail: contratistaEmail.trim(),
      bancoNombre,
      cuentaTitular: cuentaTitular.trim(),
      pagoCtaBcp: pagoCtaBcp.trim(),
      pagoCciBcp: pagoCciBcp.trim(),
      pagoCtaCorriente: pagoCtaCorriente.trim(),
      pagoDetracciones: pagoDetracciones.trim(),
      pagoCciDetracciones: pagoCciDetracciones.trim(),
      pagoYape: pagoYape.trim(),
      currency: selectedCurrencyCode,
      softwareVersion: softwareVersion.trim(),
      googleDriveFolderUrl: currentSettings.googleDriveFolderUrl || '',
      notifications: currentSettings.notifications || []
    };

    if (settings.length > 0) {
      setSettings(settings.map(s => s.id === currentSettings.id ? updatedSettings : s));
    } else {
      setSettings([updatedSettings]);
    }

    const currencyConfig = WORLD_CURRENCIES.find(c => c.code === selectedCurrencyCode);
    if (currencyConfig) {
      saveCompanyCurrency(currencyConfig);
    }

    if (logoBase64) {
      safeStorage.setItem('innova_logo_' + (activeUid || 'guest'), logoBase64);
    } else {
      safeStorage.removeItem('innova_logo_' + (activeUid || 'guest'));
    }

    if (officialLetterheadBase64) {
      safeStorage.setItem('innova_letterhead_' + (activeUid || 'guest'), officialLetterheadBase64);
    } else {
      safeStorage.removeItem('innova_letterhead_' + (activeUid || 'guest'));
    }

    setDoc(doc(db, 'settings', updatedSettings.id), updatedSettings, { merge: true }).catch(() => {});

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoUploadStatus, setLogoUploadStatus] = useState<string | null>(null);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);
  const [logoUploadFileName, setLogoUploadFileName] = useState('');
  const [logoBytesTransferred, setLogoBytesTransferred] = useState(0);
  const [logoTotalBytes, setLogoTotalBytes] = useState(0);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Por favor selecciona una imagen de menos de 15MB.');
      return;
    }

    setIsUploadingLogo(true);
    setIsUploading(true);
    setLogoUploadFileName(file.name);
    setLogoUploadProgress(15);
    setLogoTotalBytes(file.size);
    setLogoBytesTransferred(0);
    setLogoUploadError(null);
    setLogoUploadStatus('Procesando e imagen...');

    try {
      // 1. Convert to local compressed Base64 data URL first
      const base64Url = await compressAndReadLogo(file);
      if (!base64Url) {
        throw new Error('No se pudo leer la imagen local.');
      }

      setLogoUploadProgress(60);
      setLogoBase64(base64Url);
      safeStorage.setItem('innova_logo_' + (activeUid || 'guest'), base64Url);

      const updatedSettings: SystemConfig = {
        ...currentSettings,
        id: currentSettings.id || (activeUid ? ('settings_' + activeUid) : 'settings_default'),
        logoBase64: base64Url,
        userId: activeUid || 'guest'
      };

      if (settings.length > 0) {
        setSettings(settings.map(s => s.id === currentSettings.id ? updatedSettings : s));
      } else {
        setSettings([updatedSettings]);
      }

      // Save strictly to current user's settings document
      setDoc(doc(db, 'settings', updatedSettings.id), updatedSettings, { merge: true }).catch(() => {});

      setLogoUploadProgress(100);
      setLogoUploadStatus('¡Logotipo actualizado con éxito para tu cuenta!');
      setTimeout(() => setLogoUploadStatus(null), 3000);
    } catch (err: any) {
      console.error('Error al subir logotipo:', err);
      setLogoUploadError(err?.message || 'Error al procesar la imagen');
      setLogoUploadStatus('Error al procesar: ' + (err?.message || 'Formato no soportado'));
      setTimeout(() => setLogoUploadStatus(null), 4000);
    } finally {
      setIsUploadingLogo(false);
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setLogoBase64('');
    safeStorage.removeItem('innova_logo_' + (activeUid || 'guest'));
    const updatedSettings: SystemConfig = {
      ...currentSettings,
      id: currentSettings.id || (activeUid ? ('settings_' + activeUid) : 'settings_default'),
      logoBase64: '',
      userId: activeUid || 'guest'
    };
    if (settings.length > 0) {
      setSettings(settings.map(s => s.id === currentSettings.id ? updatedSettings : s));
    } else {
      setSettings([updatedSettings]);
    }
    setDoc(doc(db, 'settings', updatedSettings.id), updatedSettings, { merge: true }).catch(() => {});
  };

  const handleSetDefaultAdminLogo = async () => {
    if (!isAdmin) return;
    setLogoBase64(defaultAdminLogo);
    safeStorage.setItem('innova_logo_' + (activeUid || 'admin'), defaultAdminLogo);
    const updatedSettings: SystemConfig = {
      ...currentSettings,
      id: currentSettings.id || (activeUid ? ('settings_' + activeUid) : 'settings_admin'),
      logoBase64: defaultAdminLogo,
      userId: activeUid || 'admin'
    };
    if (settings.length > 0) {
      setSettings(settings.map(s => s.id === currentSettings.id ? updatedSettings : s));
    } else {
      setSettings([updatedSettings]);
    }
    await setDoc(doc(db, 'settings', updatedSettings.id), updatedSettings, { merge: true }).catch(() => {});
    setLogoUploadStatus('¡Logo Oficial de Administrador aplicado a tu cuenta!');
    setTimeout(() => setLogoUploadStatus(null), 3000);
  };

  const compressAndReadLetterhead = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png', 0.92));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleLetterheadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLetterhead(true);
    try {
      const b64 = await compressAndReadLetterhead(file);
      if (b64) {
        setOfficialLetterheadBase64(b64);
        safeStorage.setItem('innova_letterhead_' + (activeUid || 'guest'), b64);
        const updatedSettings: SystemConfig = {
          ...currentSettings,
          id: currentSettings.id || (activeUid ? ('settings_' + activeUid) : 'settings_default'),
          officialLetterheadBase64: b64,
          userId: activeUid || 'guest'
        };
        if (settings.length > 0) {
          setSettings(settings.map(s => s.id === currentSettings.id ? updatedSettings : s));
        } else {
          setSettings([updatedSettings]);
        }
        setDoc(doc(db, 'settings', updatedSettings.id), updatedSettings, { merge: true }).catch(() => {});
      }
    } finally {
      setIsUploadingLetterhead(false);
      e.target.value = '';
    }
  };

  const handleRemoveLetterhead = async () => {
    setOfficialLetterheadBase64('');
    safeStorage.removeItem('innova_letterhead_' + (activeUid || 'guest'));
    const updatedSettings: SystemConfig = {
      ...currentSettings,
      id: currentSettings.id || (activeUid ? ('settings_' + activeUid) : 'settings_default'),
      officialLetterheadBase64: '',
      userId: activeUid || 'guest'
    };
    if (settings.length > 0) {
      setSettings(settings.map(s => s.id === currentSettings.id ? updatedSettings : s));
    } else {
      setSettings([updatedSettings]);
    }
    await setDoc(doc(db, 'settings', updatedSettings.id), updatedSettings, { merge: true }).catch(() => {});
  };

  const [restoringState, setRestoringState] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // Deep sanitization helper to strip any 'undefined' values that cause Firestore setDoc/writeBatch to fail
  const cleanForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanForFirestore).filter(item => item !== undefined);
    }
    if (obj !== null && typeof obj === 'object') {
      const clean: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        if (obj[key] !== undefined) {
          clean[key] = cleanForFirestore(obj[key]);
        }
      }
      return clean;
    }
    return obj;
  };

  // Backup handlers for Admin
  const handleBackup = () => {
    const currentFullSettings: SystemConfig = {
      ...currentSettings,
      id: currentSettings.id || (activeUid ? ('settings_' + activeUid) : 'settings_default'),
      appName: appName.trim() || currentSettings.appName || (isAdmin ? 'Innova Contratistas' : 'Mi Empresa'),
      logoBase64: logoBase64 || currentSettings.logoBase64 || '',
      contratistaDni: contratistaDni.trim() || currentSettings.contratistaDni,
      contratistaDir: contratistaDir.trim() || currentSettings.contratistaDir,
      contratistaPhone: contratistaPhone.trim() || currentSettings.contratistaPhone,
      contratistaEmail: contratistaEmail.trim() || currentSettings.contratistaEmail,
      bancoNombre: bancoNombre || currentSettings.bancoNombre,
      cuentaTitular: cuentaTitular.trim() || currentSettings.cuentaTitular,
      pagoCtaBcp: pagoCtaBcp.trim() || currentSettings.pagoCtaBcp,
      pagoCciBcp: pagoCciBcp.trim() || currentSettings.pagoCciBcp,
      pagoCtaCorriente: pagoCtaCorriente.trim() || currentSettings.pagoCtaCorriente,
      pagoDetracciones: pagoDetracciones.trim() || currentSettings.pagoDetracciones,
      pagoCciDetracciones: pagoCciDetracciones.trim() || currentSettings.pagoCciDetracciones,
      pagoYape: pagoYape.trim() || currentSettings.pagoYape
    };

    const data = {
      systemVersion: '3.0',
      projects,
      clients,
      finances,
      settings: currentFullSettings,
      usuarios,
      cursos,
      tutoriales,
      biblioteca,
      tickets,
      asesorias,
      exportedAt: new Date().toISOString(),
      role: isAdmin ? 'admin' : 'usuario'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_sistema_completo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setRestoringState(true);
    setRestoreStatus('Leyendo y analizando archivo de respaldo...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawContent = event.target?.result as string;
        const json = JSON.parse(rawContent);
        const effectiveUserId = activeUid || 'shared';

        setRestoreStatus('Subiendo registros directamente a Cloud Firestore...');

        const writePromises: Promise<any>[] = [];
        let writtenCount = 0;

        const scheduleDocWrite = (collectionName: string, rawId: any, data: any) => {
          const docId = String(rawId || data.id || data.uid || data._id || (Date.now() + Math.random().toString(36).substring(2, 8)));
          const payload = cleanForFirestore({ ...data, id: docId });
          
          const writeTask = setDoc(doc(db, collectionName, docId), payload, { merge: true })
            .then(() => {
              writtenCount++;
            })
            .catch((err) => {
              console.warn(`Error writing to ${collectionName}/${docId}:`, err);
            });
          writePromises.push(writeTask);
        };

        // 1. Projects
        if (Array.isArray(json.projects)) {
          for (const item of json.projects) {
            if (item) scheduleDocWrite('projects', item.id, { ...item, userId: effectiveUserId });
          }
        }

        // 2. Clients
        if (Array.isArray(json.clients)) {
          for (const item of json.clients) {
            if (item) scheduleDocWrite('clients', item.id, { ...item, userId: effectiveUserId });
          }
        }

        // 3. Finances
        if (Array.isArray(json.finances)) {
          for (const item of json.finances) {
            if (item) scheduleDocWrite('finances', item.id, { ...item, userId: effectiveUserId });
          }
        }

        // 4. Materials
        if (Array.isArray(json.materials)) {
          for (const item of json.materials) {
            if (item) scheduleDocWrite('materials', item.id, { ...item, userId: effectiveUserId });
          }
        }

        // 5. Workers / Personal
        if (Array.isArray(json.workers)) {
          for (const item of json.workers) {
            if (item) scheduleDocWrite('workers', item.id, { ...item, userId: effectiveUserId });
          }
        }
        if (Array.isArray(json.personal)) {
          for (const item of json.personal) {
            if (item) scheduleDocWrite('personal', item.id, { ...item, userId: effectiveUserId });
          }
        }

        // 6. Users / Usuarios (sync to both 'usuarios' and 'users' for universal cross-platform access)
        const userList = Array.isArray(json.usuarios) ? json.usuarios : (Array.isArray(json.users) ? json.users : []);
        for (const item of userList) {
          if (item) {
            scheduleDocWrite('usuarios', item.id || item.uid, item);
            scheduleDocWrite('users', item.id || item.uid, item);
          }
        }

        // 7. Settings
        if (json.settings) {
          const s = Array.isArray(json.settings) ? json.settings[0] : json.settings;
          if (s) {
            const settingId = String(s.id || (activeUid ? ('settings_' + activeUid) : 'settings_default'));
            scheduleDocWrite('settings', settingId, { ...s, id: settingId, userId: effectiveUserId });
          }
        }

        // 8. Cursos
        if (Array.isArray(json.cursos)) {
          for (const item of json.cursos) {
            if (item) scheduleDocWrite('cursos', item.id, item);
          }
        }

        // 9. Tutoriales
        if (Array.isArray(json.tutoriales)) {
          for (const item of json.tutoriales) {
            if (item) scheduleDocWrite('tutoriales', item.id, item);
          }
        }

        // 10. Biblioteca
        if (Array.isArray(json.biblioteca)) {
          for (const item of json.biblioteca) {
            if (item) scheduleDocWrite('biblioteca', item.id, item);
          }
        }

        // 11. Tickets
        if (Array.isArray(json.tickets)) {
          for (const item of json.tickets) {
            if (item) scheduleDocWrite('tickets', item.id, item);
          }
        }

        // 12. Asesorias
        if (Array.isArray(json.asesorias)) {
          for (const item of json.asesorias) {
            if (item) scheduleDocWrite('asesorias', item.id, item);
          }
        }

        // Wait strictly until ALL remote setDoc writes finish in Firestore
        await Promise.all(writePromises);

        // Update local React states and safeStorage caches with full persistence
        if (Array.isArray(json.projects)) {
          setProjects(json.projects);
          safeStorage.setItem('sync_cache_projects_admin', json.projects);
          safeStorage.setItem(`sync_cache_projects_${activeUid || 'shared'}`, json.projects);
        }
        if (Array.isArray(json.clients)) {
          setClients(json.clients);
          safeStorage.setItem('sync_cache_clients_admin', json.clients);
          safeStorage.setItem(`sync_cache_clients_${activeUid || 'shared'}`, json.clients);
        }
        if (Array.isArray(json.finances)) {
          setFinances(json.finances);
          safeStorage.setItem('sync_cache_finances_admin', json.finances);
          safeStorage.setItem(`sync_cache_finances_${activeUid || 'shared'}`, json.finances);
        }
        if (json.settings) {
          const settingsArr = Array.isArray(json.settings) ? json.settings : [json.settings];
          setSettings(settingsArr);
          safeStorage.setItem('sync_cache_settings_admin', settingsArr);
          safeStorage.setItem(`sync_cache_settings_${activeUid || 'shared'}`, settingsArr);
          
          const s = settingsArr[0];
          if (s) {
            if (s.appName) setAppName(s.appName);
            if (s.logoBase64 !== undefined) setLogoBase64(s.logoBase64);
            if (s.contratistaDni !== undefined) setContratistaDni(s.contratistaDni);
            if (s.contratistaDir !== undefined) setContratistaDir(s.contratistaDir);
            if (s.contratistaPhone !== undefined) setContratistaPhone(s.contratistaPhone);
            if (s.contratistaEmail !== undefined) setContratistaEmail(s.contratistaEmail);
            if (s.bancoNombre !== undefined) setBancoNombre(s.bancoNombre);
            if (s.cuentaTitular !== undefined) setCuentaTitular(s.cuentaTitular);
            if (s.pagoCtaBcp !== undefined) setPagoCtaBcp(s.pagoCtaBcp);
            if (s.pagoCciBcp !== undefined) setPagoCciBcp(s.pagoCciBcp);
            if (s.pagoCtaCorriente !== undefined) setPagoCtaCorriente(s.pagoCtaCorriente);
            if (s.pagoDetracciones !== undefined) setPagoDetracciones(s.pagoDetracciones);
            if (s.pagoCciDetracciones !== undefined) setPagoCciDetracciones(s.pagoCciDetracciones);
            if (s.pagoYape !== undefined) setPagoYape(s.pagoYape);
          }
        }
        if (userList.length > 0 && setUsuarios) {
          setUsuarios(userList);
          safeStorage.setItem('sync_cache_usuarios_global', userList);
          safeStorage.setItem('sync_cache_usuarios_admin', userList);
        }
        if (Array.isArray(json.cursos) && setCursos) {
          setCursos(json.cursos);
          safeStorage.setItem('sync_cache_cursos_global', json.cursos);
          safeStorage.setItem('sync_cache_cursos_admin', json.cursos);
        }
        if (Array.isArray(json.tutoriales) && setTutoriales) {
          setTutoriales(json.tutoriales);
          safeStorage.setItem('sync_cache_tutoriales_global', json.tutoriales);
          safeStorage.setItem('sync_cache_tutoriales_admin', json.tutoriales);
        }
        if (Array.isArray(json.biblioteca) && setBiblioteca) {
          setBiblioteca(json.biblioteca);
          safeStorage.setItem('sync_cache_biblioteca_global', json.biblioteca);
          safeStorage.setItem('sync_cache_biblioteca_admin', json.biblioteca);
        }
        if (Array.isArray(json.tickets) && setTickets) {
          setTickets(json.tickets);
          safeStorage.setItem('sync_cache_tickets_global', json.tickets);
          safeStorage.setItem('sync_cache_tickets_admin', json.tickets);
        }
        if (Array.isArray(json.asesorias) && setAsesorias) {
          setAsesorias(json.asesorias);
          safeStorage.setItem('sync_cache_asesorias_global', json.asesorias);
          safeStorage.setItem('sync_cache_asesorias_admin', json.asesorias);
        }

        // Deactivate loading state
        setIsSyncing(false);
        setRestoringState(false);
        const successMessage = `¡Restauración exitosa! Se escribieron ${writtenCount} registros directamente en Cloud Firestore.`;
        setRestoreStatus(successMessage);
        alert(successMessage);

        setTimeout(() => {
          setRestoreStatus(null);
        }, 5000);
      } catch (err: any) {
        console.error('Error al restaurar JSON en Firestore:', err);
        setIsSyncing(false);
        setRestoringState(false);
        const errorMessage = 'Error al restaurar en Firestore: ' + (err?.message || 'Formato no válido');
        setRestoreStatus(errorMessage);
        alert(errorMessage);
        setTimeout(() => {
          setRestoreStatus(null);
        }, 6000);
      } finally {
        setIsSyncing(false);
        setRestoringState(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Configuración y Perfil
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {isAdmin 
                  ? 'Configura la identidad global, cuentas de cobro y datos del Administrador Principal.' 
                  : `Personaliza el logo, nombre de tu empresa y tus cuentas bancarias.`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {savedSuccess && (
            <div className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Guardado con éxito!</span>
            </div>
          )}
          <button 
            onClick={saveSettings} 
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Grid de Configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Logo e Identidad Visual */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-slate-600" />
              Logo de la Empresa
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Este logo aparecerá en el menú lateral, en los contratos como membrete o marca de agua, y en las cotizaciones para tus clientes.
            </p>

            <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/70 relative">
              {logoBase64 ? (
                <div className="relative group w-full flex flex-col items-center">
                  <div className="w-36 h-36 bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex items-center justify-center overflow-hidden">
                    <img 
                      src={logoBase64} 
                      alt="Logo Empresa" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="mt-3 text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Logotipo</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Sin logotipo cargado</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sube un archivo PNG transparente o JPG</p>
                </div>
              )}

              <div className="mt-4 w-full space-y-2">
                <button
                  type="button"
                  onClick={handleSetDefaultAdminLogo}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-colors border border-slate-200 flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span>Usar Logo Oficial de Administrador</span>
                </button>

                <label className="w-full cursor-pointer block">
                  <div className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-4 rounded-xl text-center transition-colors shadow-2xs flex items-center justify-center space-x-2">
                    {isUploadingLogo || isUploading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Guardando Logotipo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>{logoBase64 ? 'Cambiar Logotipo Personalizado' : 'Subir Logotipo Personalizado'}</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleLogoUpload} 
                    disabled={isUploadingLogo || isUploading}
                    className="hidden" 
                  />
                </label>
              </div>

              {isUploadingLogo && (
                <div className="mt-3">
                  <UploadProgressBar
                    progress={logoUploadProgress}
                    fileName={logoUploadFileName}
                    fileSizeBytes={logoTotalBytes}
                    bytesTransferred={logoBytesTransferred}
                    statusMessage={logoUploadStatus || undefined}
                    isComplete={logoUploadProgress >= 100}
                    isError={!!logoUploadError}
                    errorMessage={logoUploadError || undefined}
                    type="image"
                  />
                </div>
              )}

              {logoUploadStatus && !isUploadingLogo && (
                <p className="mt-2 text-[11px] text-center font-bold text-slate-700 animate-fadeIn">
                  {logoUploadStatus}
                </p>
              )}
            </div>

            <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Consejo de diseño:
              </span>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Usa un logo con fondo transparente en formato PNG para que luzca perfecto sobre tus contratos y documentos oficiales.
              </p>
            </div>

            {/* Tarjeta: Membrete Oficial para Contratos & Hojas A4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center">
                  <FileSignature className="w-4 h-4 mr-1.5 text-slate-600" />
                  Membrete Oficial (Hojas A4)
                </h3>
                {officialLetterheadBase64 && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Activo
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sube la imagen de tu membrete corporativo (cabecera con logo, RUC y lema). Se plasmará automáticamente en la parte superior de cada hoja de tus contratos y documentos.
              </p>

              {officialLetterheadBase64 ? (
                <div className="space-y-3">
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 shadow-2xs group">
                    <img 
                      src={officialLetterheadBase64} 
                      alt="Membrete Oficial" 
                      className="w-full h-auto max-h-32 object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingLetterhead ? 'Subiendo...' : 'Cambiar Membrete'}</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleLetterheadUpload} 
                        disabled={isUploadingLetterhead}
                        className="hidden" 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveLetterhead}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-all font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 text-center">
                    {isUploadingLetterhead ? 'Cargando membrete...' : 'Subir Membrete Oficial'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 text-center">
                    Recomendado: Imagen horizontal (PNG o JPG)
                  </span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handleLetterheadUpload} 
                    disabled={isUploadingLetterhead}
                    className="hidden" 
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Datos de Empresa y Datos Bancarios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta: Datos Generales de la Empresa */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Datos de la Empresa / Contratista
              </h2>
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-100">
                Membrete Oficial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Nombre Comercial / Razón Social *
                </label>
                <input 
                  value={appName} 
                  onChange={e => setAppName(e.target.value)} 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                  placeholder="Ej. ESTRUCTURAS & METALMECÁNICA PERÚ S.A.C." 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  RUC o DNI
                </label>
                <input 
                  value={contratistaDni} 
                  onChange={e => setContratistaDni(e.target.value)} 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                  placeholder="Ej. 20601234567" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Teléfono / Celular de Contacto
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input 
                    value={contratistaPhone} 
                    onChange={e => setContratistaPhone(e.target.value)} 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                    placeholder="Ej. +51 987 654 321" 
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Dirección Fiscal o Taller
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input 
                    value={contratistaDir} 
                    onChange={e => setContratistaDir(e.target.value)} 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                    placeholder="Ej. Av. Industrial 450, Urb. Vulcano, Ate, Lima" 
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Correo Electrónico de Contacto
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    value={contratistaEmail} 
                    onChange={e => setContratistaEmail(e.target.value)} 
                    type="email" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                    placeholder="Ej. contacto@miempresa.pe" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta: Cuentas Bancarias y Métodos de Cobro */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
                  Datos Bancarios y Métodos de Cobro
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estas cuentas aparecerán automáticamente en la cláusula de pagos de tus contratos de obra.
                </p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                Pagos en Soles
              </span>
            </div>

            {/* Titular y Banco Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Banco Principal
                </label>
                <select
                  value={bancoNombre}
                  onChange={e => setBancoNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                >
                  <option value="BCP">BCP - Banco de Crédito del Perú</option>
                  <option value="BBVA">BBVA Continental</option>
                  <option value="Interbank">Interbank</option>
                  <option value="Scotiabank">Scotiabank Perú</option>
                  <option value="Banco de la Nación">Banco de la Nación</option>
                  <option value="Otro Banco">Otro Banco / Caja Municipal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Titular de las Cuentas
                </label>
                <input 
                  value={cuentaTitular} 
                  onChange={e => setCuentaTitular(e.target.value)} 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" 
                  placeholder="Ej. Juan Pérez / Inversiones Metálicas SAC" 
                />
              </div>
            </div>

            {/* Bloque BCP & Transferencias */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center">
                <Landmark className="w-4 h-4 mr-1.5 text-blue-600" />
                Cuentas de Transferencia Bancaria
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cuenta BCP (Soles)
                  </label>
                  <input 
                    value={pagoCtaBcp} 
                    onChange={e => setPagoCtaBcp(e.target.value)} 
                    type="text" 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono outline-none focus:border-blue-500 transition-all" 
                    placeholder="Ej. 191-12345678-0-99" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Código Interbancario (CCI BCP)
                  </label>
                  <input 
                    value={pagoCciBcp} 
                    onChange={e => setPagoCciBcp(e.target.value)} 
                    type="text" 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono outline-none focus:border-blue-500 transition-all" 
                    placeholder="Ej. 002-1910012345678099" 
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Otra Cuenta Bancaria / Cuenta Corriente
                  </label>
                  <input 
                    value={pagoCtaCorriente} 
                    onChange={e => setPagoCtaCorriente(e.target.value)} 
                    type="text" 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono outline-none focus:border-blue-500 transition-all" 
                    placeholder="Ej. Interbank Cta Cte: 200-3001234567 / BBVA: 0011-0123-..." 
                  />
                </div>
              </div>
            </div>

            {/* Bloque Detracciones (Banco de la Nación) */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-slate-600" />
                Cuenta de Detracciones (Banco de la Nación - SPOT)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Número de Cuenta de Detracciones
                  </label>
                  <input 
                    value={pagoDetracciones} 
                    onChange={e => setPagoDetracciones(e.target.value)} 
                    type="text" 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono outline-none focus:border-slate-500 transition-all" 
                    placeholder="Ej. 00-012-345678" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    CCI Cuenta Detracciones
                  </label>
                  <input 
                    value={pagoCciDetracciones} 
                    onChange={e => setPagoCciDetracciones(e.target.value)} 
                    type="text" 
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono outline-none focus:border-slate-500 transition-all" 
                    placeholder="Ej. 01801200001234567899" 
                  />
                </div>
              </div>
            </div>

            {/* Bloque Billeteras Digitales (Yape / Plin) */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center">
                <CreditCard className="w-4 h-4 mr-1.5 text-slate-600" />
                Billeteras Digitales (Yape / Plin)
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Número Telefónico de Yape / Plin
                </label>
                <input 
                  value={pagoYape} 
                  onChange={e => setPagoYape(e.target.value)} 
                  type="text" 
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono outline-none focus:border-slate-500 transition-all" 
                  placeholder="Ej. 9XX XXX XXX (a nombre del titular de la cuenta)"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-700 italic">
                  💡 Estos datos se guardan y sincronizan automáticamente con tus contratos y cotizaciones.
                </span>
                <button
                  type="button"
                  onClick={saveSettings}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cuentas y Billeteras</span>
                </button>
              </div>
            </div>

            {/* Bloque Moneda Principal & Configuración Internacional (Soporte Multipaís) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
                    <Globe className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>Moneda Principal & Configuración Internacional</span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
                        {WORLD_CURRENCIES.find(c => c.code === selectedCurrencyCode)?.flag || '🌎'} {selectedCurrencyCode}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Soporte para usuarios de todos los países. Define la moneda predeterminada y el símbolo de cotización.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    País / Moneda de Trabajo
                  </label>
                  <select
                    value={selectedCurrencyCode}
                    onChange={e => {
                      const newCode = e.target.value;
                      setSelectedCurrencyCode(newCode);
                      const curr = WORLD_CURRENCIES.find(c => c.code === newCode);
                      if (curr) saveCompanyCurrency(curr);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-slate-400 transition-all cursor-pointer"
                  >
                    {WORLD_CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code} className="bg-white text-slate-900 py-1">
                        {curr.flag} {curr.country} — {curr.name} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Símbolo Oficial en Presupuestos
                  </label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-700 flex items-center justify-between">
                    <span>{WORLD_CURRENCIES.find(c => c.code === selectedCurrencyCode)?.symbol || 'S/'}</span>
                    <span className="text-slate-400 text-[11px] font-normal">
                      Código ISO: {selectedCurrencyCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vista previa de formato de dinero */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-600 font-medium">Formato de importes en la plataforma:</span>
                </div>
                <div className="font-mono font-black text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-lg">
                  {WORLD_CURRENCIES.find(c => c.code === selectedCurrencyCode)?.symbol || 'S/'} 15,850.00
                </div>
              </div>
            </div>

            {/* Versión del Software y Almacenamiento Cloud (Firebase) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-slate-400" />
                Versión del Software y Almacenamiento Central
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Versión del Software (Visible para todos los usuarios)
                </label>
                <input
                  value={softwareVersion}
                  onChange={e => setSoftwareVersion(e.target.value)}
                  type="text"
                  disabled={!isAdmin}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 outline-none focus:border-slate-400 transition-all disabled:opacity-60"
                  placeholder="Ej. v3.9.5 Pro (RNE-2026)"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAdmin
                    ? 'Define la versión que se mostrará en el menú lateral y estado del sistema de los usuarios.'
                    : 'Versión actual del sistema configurada por el Administrador.'}
                </p>
              </div>

              {/* Almacenamiento Cloud Nativo */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Almacenamiento Cloud Directo (Firebase)
                  </h4>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Directo y Optimizado
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-600 font-medium">
                    Todas las fotos de obras, planos CAD, contratos y videos tutoriales se suben y transmiten directamente a los servidores seguros en la nube sin depender de cuentas externas ni bloqueos de permisos.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-mono pt-1 flex-wrap">
                    <span>✓ Servidor centralizado y seguro</span>
                    <span className="text-slate-300">•</span>
                    <span>✓ Acceso instantáneo multidispositivo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apartado de Aplicación Móvil y PC (.exe) */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Aplicación Móvil (Android / iOS) y PC (.exe)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Instala la plataforma de forma nativa en tu teléfono inteligente, tablet o computadora personal.
              </p>
            </div>
          </div>
        </div>

        {/* Direct .exe Download Card / Admin Panel */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0 mt-0.5 sm:mt-0">
                <Monitor className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base leading-snug text-slate-900">Descargar Archivo Ejecutable `.exe` para PC Windows</h3>
                <p className="text-xs text-slate-500 mt-0.5">Instalador directo de escritorio para ejecutar la plataforma sin navegador</p>
              </div>
            </div>
            {exeUrl ? (
              <a
                href={exeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Instalador .exe</span>
              </a>
            ) : (
              <div className="w-full sm:w-auto text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-2.5 rounded-xl text-center sm:text-left shrink-0">
                {isAdmin ? '⚠️ Aún no has configurado el enlace del .exe abajo' : '⚠️ El administrador publicará el .exe próximamente'}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-2">
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Panel de Administrador: Configurar / Subir Enlace del .exe</span>
              </div>
              <form onSubmit={handleSaveExeUrl} className="space-y-2">
                <label className="block text-[11px] text-slate-500">
                  Pega la URL de descarga directa de tu archivo `.exe` (Google Drive, OneDrive, Mega, GitHub, etc.):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={inputExeUrl}
                    onChange={e => setInputExeUrl(e.target.value)}
                    placeholder="https://ejemplo.com/InnovaContratistas-Setup.exe"
                    className="w-full sm:flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 min-w-0"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center"
                  >
                    Guardar Enlace
                  </button>
                </div>
              </form>
              {exeSavedSuccess && (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> ¡Enlace del .exe guardado y listo para todos los usuarios!
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 bg-slate-50/70 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Android (Google Chrome)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Abre la plataforma en Google Chrome, presiona el menú de los 3 puntos (⋮) y selecciona <strong className="text-slate-800">"Instalar aplicación"</strong> o <strong className="text-slate-800">"Agregar a la pantalla principal"</strong>.
            </p>
          </div>

          <div className="p-4 border border-slate-200 bg-slate-50/70 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <Apple className="w-4 h-4" />
              <span>iPhone / iPad (Safari iOS)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Abre la plataforma en Safari, presiona el botón de <strong className="text-slate-800">Compartir</strong> (cuadrado con flecha hacia arriba) y selecciona <strong className="text-slate-800">"Agregar a pantalla de inicio"</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Apartado de Comunicados / Notificaciones: VISIBLE ÚNICAMENTE PARA EL ADMINISTRADOR */}
      {isAdmin && setGlobalNotifs && (
        <AdminAnnouncementPanel 
          notifications={globalNotifs} 
          setNotifications={setGlobalNotifs} 
          authorName={currentUserName || 'Administrador Principal'} 
        />
      )}

      {/* Apartado de Auditoría de Almacenamiento, Caché PWA y Logs: VISIBLE ÚNICAMENTE PARA EL ADMINISTRADOR */}
      {isAdmin && (
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <StorageAuditPanel />
        </div>
      )}

      {/* Apartado de Respaldo de Datos: VISIBLE ÚNICAMENTE PARA EL ADMINISTRADOR */}
      {isAdmin && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-800 text-white rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Respaldo y Restauración de Datos (Local)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Herramienta exclusiva de administración para crear copias de seguridad de los proyectos, clientes y registros financieros.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              Solo Administrador
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <Download className="w-4 h-4 mr-2 text-slate-700" />
                Descargar Copia de Respaldo
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Descarga un archivo seguro JSON con todos los datos registrados en el sistema para conservarlo en tu almacenamiento seguro.
              </p>
              <button 
                onClick={handleBackup} 
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-2xs"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Archivo JSON</span>
              </button>
            </div>
            
            <div className="p-5 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <Upload className="w-4 h-4 mr-2 text-slate-700" />
                Restaurar Información desde Copia
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Restaura información previa desde un archivo JSON descargado anteriormente. <strong className="text-rose-600">Sincroniza proyectos, clientes, usuarios, cursos y finanzas.</strong>
              </p>
              <label className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>{isSyncing || restoringState ? 'Sincronizando con Cloud Firestore...' : 'Seleccionar y Cargar JSON'}</span>
                <input type="file" accept=".json" onChange={handleRestore} disabled={isSyncing || restoringState} className="hidden" />
              </label>
            </div>

            {restoreStatus && (
              <div className="col-span-1 md:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                {isSyncing || restoringState ? (
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{restoreStatus}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6 mt-6">
            <div className="p-5 border border-slate-200 bg-slate-50 rounded-2xl space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-slate-600 animate-pulse" />
                Descargar Código Fuente y Archivos del Sistema (.ZIP)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                El código fuente de la aplicación (HTML, React, Vite, CSS, config) se entrega de forma controlada por el administrador, no desde un botón público dentro de la app. Con el código podrás desplegarlo en un hosting estático (Vercel, Netlify, Firebase Hosting, o tu propio servidor) y enlazarlo con tu dominio personalizado siguiendo la guía siguiente.
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 mb-4">
                Nota de seguridad: la descarga automática del código desde la aplicación fue retirada porque exponía todo el proyecto sin autenticación.
              </p>

              <div className="border-t border-slate-200/80 pt-4 mt-4 space-y-3 text-xs text-slate-600 leading-relaxed">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center">
                  🚀 Guía Paso a Paso para Desplegar en tu propio Firebase
                </h4>
                <p>
                  Si deseas publicar la plataforma bajo tu propia cuenta de Firebase y conectar tu propio dominio personalizado, sigue estos sencillos comandos en tu terminal una vez que descomprimas el archivo ZIP:
                </p>
                <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed space-y-2 border border-slate-800">
                  <p className="text-slate-500"># 1. Instalar las herramientas de Firebase globalmente</p>
                  <p>npm install -g firebase-tools</p>
                  <p className="text-slate-500"># 2. Iniciar sesión en tu cuenta de Google/Firebase</p>
                  <p>firebase login</p>
                  <p className="text-slate-500"># 3. Compilar el sistema para producción (genera la carpeta dist/)</p>
                  <p>npm run build</p>
                  <p className="text-slate-500"># 4. Desplegar a tu hosting en producción</p>
                  <p>firebase deploy --only hosting</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong className="font-extrabold">Nota Importante:</strong> El archivo ZIP ya incluye tu archivo de configuración de Firebase actual con la base de datos Firestore y las reglas de seguridad completamente configuradas. ¡No necesitas re-configurar nada! Al desplegar, tu base de datos permanecerá intacta y se sincronizará en tiempo real con el nuevo hosting.
                  </div>
                </div>
              </div>

              {/* SECCIÓN DEDICADA A LA APP MÓVIL Y ARCHIVO .APK */}
              <div className="border-t border-slate-200/80 pt-5 mt-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center">
                    <Smartphone className="w-4 h-4 mr-2 text-slate-600" />
                    📱 Instalación Móvil PWA & Generación de APK para Android
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    ✓ Sin alterar la plataforma web
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Puedes utilizar tu plataforma en celulares Android e iPhone de dos formas 100% compatibles con tu base de datos de Firebase:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opción 1: PWA Directa */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2 text-slate-700 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Opción 1: PWA (Instalación Directa)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Cualquier colaborador puede abrir la URL en Chrome/Safari y presionar <strong className="text-slate-800">"Agregar a la pantalla de inicio"</strong>. Se creará el ícono nativo de la app sin descargar archivos APK pesados.
                    </p>
                  </div>

                  {/* Opción 2: Compilación a APK */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>Opción 2: Compilar Archivo .APK</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Descomprime el archivo ZIP del sistema y ejecuta las herramientas <strong className="text-slate-800">Capacitor (Ionic)</strong> o <strong className="text-slate-800">Bubblewrap (TWA de Google)</strong> para obtener el ejecutable <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">.apk</code> para instalar en cualquier Android.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-900 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-slate-950">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Garantía de Seguridad e Integridad:</span>
                  </div>
                  Tanto la versión Web como la versión en archivo APK descargado se conectan directamente a la **misma base de datos de Firebase (`innovacontratistas`)**. Generar un APK **NO altera ni modifica tus clientes, proyectos o la plataforma web**.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AdminAnnouncementPanel = ({ notifications, setNotifications, authorName }: { notifications: GlobalNotification[], setNotifications: (notifs: GlobalNotification[]) => void, authorName: string }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'info' | 'important' | 'alert'>('info');
  const [duration, setDuration] = useState<number>(24);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const now = Date.now();
    const expiresAt = now + duration * 60 * 60 * 1000;
    
    const newNotif: GlobalNotification = {
      id: 'announcement_' + now,
      title: title.trim(),
      message: message.trim(),
      priority,
      createdAtTimestamp: now,
      expiresAtTimestamp: expiresAt,
      durationHours: duration,
      author: authorName,
      date: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setNotifications([newNotif, ...notifications]);
    setTitle('');
    setMessage('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fadeIn">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="p-2 bg-slate-50 text-slate-500 rounded-xl border border-slate-100">
          <Bell className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Publicar Comunicado / Notificación</h3>
          <p className="text-[11px] text-slate-400">Se mostrará con cuenta regresiva en la parte superior del panel de control de todos los usuarios.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título del Comunicado *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Mantenimiento del Sistema..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-slate-300 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-slate-300 cursor-pointer"
              >
                <option value="info">📌 Informativo</option>
                <option value="important">⚠️ Importante</option>
                <option value="alert">🚨 Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duración</label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-700 font-semibold outline-none focus:border-slate-300 cursor-pointer"
              >
                <option value={1}>1 Hora</option>
                <option value={6}>6 Horas</option>
                <option value={12}>12 Horas</option>
                <option value={24}>24 Horas</option>
                <option value={48}>48 Horas</option>
                <option value={168}>7 Días</option>
                <option value={87600}>Permanente</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mensaje del Comunicado *</label>
          <textarea
            required
            rows={2}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Escribe el mensaje o indicaciones aquí..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-medium outline-none focus:border-slate-300 resize-none font-sans"
          />
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-slate-100">
          {success ? (
            <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-fadeIn">
              <CheckCircle className="w-4 h-4" /> ¡Comunicado publicado con éxito!
            </p>
          ) : (
            <div />
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Publicar Comunicado</span>
          </button>
        </div>
      </form>
    </div>
  );
};
