import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, Key, Plus, Trash2, RefreshCw, Clock, Search, ShieldCheck, 
  CheckCircle2, UserCheck, Download, Upload, Database, 
  FileSpreadsheet, Shield, RotateCcw, AlertTriangle, X, Check
} from 'lucide-react';
import { useFirestoreArraySync } from '../lib/db';
import { safeStorage } from '../lib/storageManager';
import { UploadProgressBar } from './common/UploadProgressBar';
import { SystemUser } from '../types';
export type { SystemUser };

interface UsuariosViewProps {
  usuarios?: SystemUser[];
  setUsuarios?: React.Dispatch<React.SetStateAction<SystemUser[]>>;
  isAdmin?: boolean;
}

export default function UsuariosView({ usuarios: propUsuarios, setUsuarios: propSetUsuarios, isAdmin = false }: UsuariosViewProps = {}) {
  const [internalUsuarios, setInternalUsuarios] = useFirestoreArraySync<SystemUser>('usuarios', 'global', true, isAdmin);
  const rawUsuarios = propUsuarios || internalUsuarios;
  const setUsuarios = propSetUsuarios || setInternalUsuarios;

  // Auto-remove any user with pin '123456' and filter out master admin or legacy references
  const usuarios = useMemo(() => {
    return rawUsuarios
      .filter(u => {
        if (u.pin === '123456' || u.name?.trim() === '123456') return false;
        const nameLower = (u.name || '').toLowerCase();
        // Hide master admin from the collaborators list so it doesn't appear as a regular worker
        if (u.role === 'admin' || nameLower === 'administrador principal' || nameLower === 'administrador' || u.id === 'admin' || u.id === 'admin_master') {
          return false;
        }
        return true;
      })
      .map(u => {
        const nameLower = (u.name || '').toLowerCase();
        if (nameLower.includes('newton') || nameLower.includes('academia')) {
          return {
            ...u,
            name: 'Innova Contratistas'
          };
        }
        return u;
      });
  }, [rawUsuarios]);

  useEffect(() => {
    const hasLegacy123456 = rawUsuarios.some(u => u.pin === '123456' || u.name?.trim() === '123456');
    if (hasLegacy123456) {
      setUsuarios(rawUsuarios.filter(u => u.pin !== '123456' && u.name?.trim() !== '123456'));
    }
  }, [rawUsuarios, setUsuarios]);

  // Auto-resguardo continuo en memoria local protegida
  useEffect(() => {
    if (usuarios && usuarios.length > 0) {
      safeStorage.setItem('usuarios_backup_snapshot_data', usuarios);
      safeStorage.setItem('usuarios_backup_snapshot_time', new Date().toISOString());
    }
  }, [usuarios]);

  const generatePIN = () => Math.floor(100000 + Math.random() * 900000).toString();
  const getUserMB = (userId: string, userName: string) => {
    let hash = 0;
    const str = userId + userName;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const val = (Math.abs(hash) % 185 + 15) / 10;
    return `${val.toFixed(1)} MB`;
  };
  const [name, setName] = useState('');
  const [currentPin, setCurrentPin] = useState(generatePIN());
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para Descarga e Importación / Resguardo
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [parsedImportUsers, setParsedImportUsers] = useState<SystemUser[] | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [importFileSize, setImportFileSize] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notify = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotificationMsg({ type, text });
    setTimeout(() => {
      setNotificationMsg(null);
    }, 4500);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentPin) return;
    
    const now = new Date();
    const formattedNow = now.toLocaleDateString('es-PE') + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    let sanitizedName = name.trim();
    if (sanitizedName.toLowerCase().includes('newton')) {
      sanitizedName = 'Innova Contratistas';
    }

    const newUser: SystemUser = {
      id: 'usr_' + Date.now().toString(),
      name: sanitizedName,
      role: 'Colaborador',
      pin: currentPin,
      lastLogin: formattedNow,
      lastLoginTimestamp: Date.now(),
      isActive: true
    };
    
    setUsuarios([...usuarios, newUser]);
    setName('');
    setCurrentPin(generatePIN());
    notify(`✓ Acceso registrado para ${sanitizedName} (PIN: ${currentPin})`);
  };

  const handleDelete = (id: string) => {
    const target = usuarios.find(u => u.id === id);
    if (confirm(`¿Seguro que deseas eliminar el acceso de "${target?.name || 'este usuario'}"?`)) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      notify(`Acceso eliminado correctamente.`, 'info');
    }
  };

  const handleRegeneratePIN = (id: string) => {
    const newPin = generatePIN();
    if (confirm(`¿Generar un nuevo PIN (${newPin}) para este colaborador?`)) {
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, pin: newPin } : u));
      notify(`✓ Nuevo PIN generado: ${newPin}`);
    }
  };

  const toggleUserStatus = (id: string) => {
    setUsuarios(usuarios.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  // ==========================================
  // 1. DESCARGA DE BASE DE DATOS (EXPORTACIÓN)
  // ==========================================
  const handleExportJSON = () => {
    try {
      const nowStr = new Date().toISOString().split('T')[0];
      const exportPayload = {
        metadata: {
          system: 'Innova Contratistas - Sistema de Gestión',
          module: 'Accesos y Usuarios PIN',
          version: '2.5',
          exportedAt: new Date().toISOString(),
          totalUsers: usuarios.length,
          activeUsers: usuarios.filter(u => u.isActive !== false).length
        },
        usuarios: usuarios
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `base_datos_usuarios_pin_${nowStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      notify(`✓ Base de datos descargada con éxito (${usuarios.length} usuarios en formato JSON)`);
      setShowBackupMenu(false);
    } catch (err: any) {
      console.error('Error al exportar base de datos:', err);
      notify(`Error al descargar base de datos: ${err?.message || 'Error'}`, 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      const nowStr = new Date().toISOString().split('T')[0];
      const headers = ['ID', 'Nombre', 'Rol', 'PIN', 'Estado', 'Ultimo_Acceso', 'Email', 'Telefono'];
      
      const rows = usuarios.map(u => [
        `"${u.id || ''}"`,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${(u.role || 'Colaborador').replace(/"/g, '""')}"`,
        `"${u.pin || ''}"`,
        `"${u.isActive !== false ? 'Activo' : 'Inactivo'}"`,
        `"${u.lastLogin || 'Ninguno'}"`,
        `"${u.email || ''}"`,
        `"${u.phone || ''}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_usuarios_credenciales_${nowStr}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      notify(`✓ Reporte CSV de usuarios descargado correctamente (${usuarios.length} registros)`);
      setShowBackupMenu(false);
    } catch (err: any) {
      console.error('Error al exportar CSV:', err);
      notify(`Error al exportar CSV: ${err?.message || 'Error'}`, 'error');
    }
  };

  // ==========================================
  // 2. RESGUARDO LOCAL INSTANTÁNEO & RESTAURACIÓN
  // ==========================================
  const handleSaveInstantSnapshot = () => {
    safeStorage.setItem('usuarios_backup_snapshot_data', usuarios);
    safeStorage.setItem('usuarios_backup_snapshot_time', new Date().toISOString());
    notify(`🛡️ Copia de resguardo local actualizada (${usuarios.length} usuarios resguardados)`);
    setShowBackupMenu(false);
  };

  const handleRestoreFromSnapshot = () => {
    const saved = safeStorage.getItem<SystemUser[]>('usuarios_backup_snapshot_data', []);
    const time = safeStorage.getItem<string>('usuarios_backup_snapshot_time', '');
    if (!saved || saved.length === 0) {
      notify('No se encontró una copia de seguridad previa guardada en este equipo.', 'info');
      return;
    }

    const formattedTime = time ? new Date(time).toLocaleString('es-PE') : 'reciente';
    if (confirm(`¿Restaurar la copia de seguridad de usuarios del ${formattedTime} (${saved.length} usuarios)?`)) {
      setUsuarios(saved);
      notify(`✓ Base de datos restaurada con éxito desde el resguardo local (${saved.length} usuarios).`);
      setShowBackupMenu(false);
    }
  };

  // ==========================================
  // 3. SUBIDA / IMPORTACIÓN DE BASE DE DATOS
  // ==========================================
  const handleSelectFileToImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportFileName(file.name);
    setImportFileSize(file.size);
    setParsedImportUsers(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json') || file.type.includes('json')) {
          const parsed = JSON.parse(content);
          let userArray: any[] = [];
          if (Array.isArray(parsed)) {
            userArray = parsed;
          } else if (parsed && Array.isArray(parsed.usuarios)) {
            userArray = parsed.usuarios;
          } else if (parsed && Array.isArray(parsed.users)) {
            userArray = parsed.users;
          } else {
            throw new Error('El archivo JSON no contiene una lista válida de usuarios.');
          }

          // Sanitizar y validar usuarios
          const sanitizedUsers: SystemUser[] = userArray
            .filter((u: any) => u && (u.name || u.pin))
            .map((u: any, idx: number) => ({
              id: u.id ? String(u.id) : `usr_${Date.now()}_${idx}`,
              name: String(u.name || `Usuario ${idx + 1}`).trim(),
              role: String(u.role || 'Colaborador').trim(),
              pin: String(u.pin || generatePIN()).trim(),
              email: u.email ? String(u.email) : undefined,
              phone: u.phone ? String(u.phone) : undefined,
              photoUrl: u.photoUrl ? String(u.photoUrl) : undefined,
              lastLogin: u.lastLogin ? String(u.lastLogin) : undefined,
              lastLoginTimestamp: typeof u.lastLoginTimestamp === 'number' ? u.lastLoginTimestamp : undefined,
              isActive: u.isActive !== false
            }));

          if (sanitizedUsers.length === 0) {
            throw new Error('No se detectaron usuarios válidos en el archivo JSON.');
          }

          setParsedImportUsers(sanitizedUsers);
        } else if (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('spreadsheet')) {
          // Parse CSV
          const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
          if (lines.length < 2) {
            throw new Error('El archivo CSV no contiene registros suficientes.');
          }

          const parsedUsers: SystemUser[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
            if (cols.length >= 2) {
              // Format: ID, Nombre, Rol, PIN, Estado, Ultimo_Acceso...
              const id = cols[0] || `usr_${Date.now()}_${i}`;
              const nameVal = cols[1] || `Colaborador ${i}`;
              const roleVal = cols[2] || 'Colaborador';
              const pinVal = cols[3] || generatePIN();
              const estadoVal = cols[4] || 'Activo';

              parsedUsers.push({
                id,
                name: nameVal,
                role: roleVal,
                pin: pinVal,
                isActive: !estadoVal.toLowerCase().includes('inactiv')
              });
            }
          }

          if (parsedUsers.length === 0) {
            throw new Error('No se pudieron leer columnas válidas en el CSV.');
          }

          setParsedImportUsers(parsedUsers);
        } else {
          throw new Error('Formato no soportado. Por favor sube un archivo .JSON o .CSV');
        }
      } catch (err: any) {
        console.error('Error al procesar archivo de usuarios:', err);
        setImportError(err?.message || 'Error al leer el archivo.');
        setParsedImportUsers(null);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteImport = async () => {
    if (!parsedImportUsers || parsedImportUsers.length === 0) return;

    setIsProcessingImport(true);
    setImportProgress(25);

    try {
      setImportProgress(60);
      let finalList: SystemUser[] = [];

      if (importMode === 'overwrite') {
        finalList = parsedImportUsers;
      } else {
        // Merge: Update existing if id matches, or add if new
        const map = new Map<string, SystemUser>();
        usuarios.forEach(u => map.set(u.id, u));
        
        parsedImportUsers.forEach(u => {
          map.set(u.id, u);
        });

        finalList = Array.from(map.values());
      }

      setImportProgress(90);
      setUsuarios(finalList);

      // Guardar respaldo inmediato
      safeStorage.setItem('usuarios_backup_snapshot_data', finalList);
      safeStorage.setItem('usuarios_backup_snapshot_time', new Date().toISOString());

      setImportProgress(100);
      notify(`✓ Base de datos actualizada con éxito (${finalList.length} usuarios totales sincronizados)`);
      
      setTimeout(() => {
        setIsProcessingImport(false);
        setShowImportModal(false);
        setParsedImportUsers(null);
        setImportFileName('');
        setImportProgress(0);
      }, 700);
    } catch (err: any) {
      console.error('Error al aplicar importación:', err);
      setImportError(err?.message || 'Error al aplicar importación.');
      setIsProcessingImport(false);
    }
  };

  const getUserConnectionStatus = (user: SystemUser) => {
    if (user.isActive === false) {
      return {
        label: 'Inactivo',
        dotClass: 'bg-rose-500',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        desc: 'Desactivado por la Administración'
      };
    }

    const timestamp = user.lastLoginTimestamp;
    if (!timestamp) {
      return {
        label: 'Sin conexión',
        dotClass: 'bg-slate-300',
        badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
        desc: 'Nunca ha iniciado sesión'
      };
    }

    const diffMinutes = (Date.now() - timestamp) / (1000 * 60);
    if (diffMinutes <= 30) {
      return {
        label: 'En línea',
        dotClass: 'bg-emerald-500 animate-pulse',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Activo en este momento'
      };
    } else if (diffMinutes <= 24 * 60) {
      return {
        label: 'Hoy',
        dotClass: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'Conectado en las últimas 24 horas'
      };
    } else {
      return {
        label: 'Inactivo',
        dotClass: 'bg-slate-400',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        desc: 'Sin actividad reciente'
      };
    }
  };

  const activeCount = useMemo(() => usuarios.filter(u => u.isActive !== false).length, [usuarios]);
  const onlineCount = useMemo(() => {
    return usuarios.filter(u => {
      if (u.isActive === false || !u.lastLoginTimestamp) return false;
      return (Date.now() - u.lastLoginTimestamp) <= 30 * 60 * 1000;
    }).length;
  }, [usuarios]);

  const filteredUsuarios = useMemo(() => {
    if (!searchQuery.trim()) return usuarios;
    const q = searchQuery.toLowerCase().trim();
    return usuarios.filter(u => 
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.pin && u.pin.includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  }, [usuarios, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Notificación Toast Flotante */}
      {notificationMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
          notificationMsg.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : notificationMsg.type === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {notificationMsg.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button 
            onClick={() => setNotificationMsg(null)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Encabezado con Botones de Base de Datos y Resguardo */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-white shadow-sm border border-slate-200 text-emerald-600">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Accesos y Usuarios PIN</h1>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Base de Datos Segura
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Control de credenciales privadas, respaldos descargables y sincronización en la nube.
            </p>
          </div>
        </div>

        {/* Botones de Gestión de Base de Datos */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Descarga JSON */}
          <button
            onClick={handleExportJSON}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
            title="Descargar base de datos completa en formato JSON seguro"
          >
            <Download className="w-4 h-4" />
            <span>Descargar BD (.JSON)</span>
          </button>

          {/* Botón Subir / Restaurar BD */}
          <button
            onClick={() => {
              setParsedImportUsers(null);
              setImportError(null);
              setImportFileName('');
              setShowImportModal(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
            title="Subir o restaurar base de datos de usuarios desde archivo"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Subir / Restaurar BD</span>
          </button>

          {/* Menú de Más Opciones de Resguardo */}
          <div className="relative">
            <button
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Opciones avanzadas de resguardo y formatos"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Resguardo</span>
            </button>

            {showBackupMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  Herramientas de Base de Datos
                </div>
                
                <button
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Exportar a Excel / CSV</span>
                </button>

                <button
                  onClick={handleSaveInstantSnapshot}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Crear Resguardo Local</span>
                </button>

                <button
                  onClick={handleRestoreFromSnapshot}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Restaurar Último Resguardo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* KPI Cards Estilo Inversiones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accesos</p>
            <p className="text-2xl font-bold text-slate-800">{usuarios.length} registrados</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Personal Habilitado</p>
            <p className="text-2xl font-bold text-emerald-600">{activeCount} activos</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En Línea Ahora</p>
            <p className="text-2xl font-bold text-amber-600">{onlineCount} conectados</p>
          </div>
        </div>
      </div>

      {/* Banner Informativo y Resguardo */}
      <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xs flex-wrap">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">
            <strong>Protección de Datos & Respaldo Permanente:</strong> Puedes descargar la base de datos de usuarios en cualquier momento para resguardarla o restaurarla tras actualizaciones mayores del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700">
            ✓ Auto-Sync Nube & Local Activo
          </span>
        </div>
      </div>

      {/* Formulario y Tabla de Registros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Formulario Agregar Acceso */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddUser} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Nuevo Acceso de Colaborador</span>
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Nombre del Colaborador *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
                  placeholder="Ej. Juan Pérez - Soldador"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">PIN Asignado (6 dígitos)</label>
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-mono text-xl font-black tracking-widest text-slate-900">{currentPin}</span>
                  <button 
                    type="button" 
                    onClick={() => setCurrentPin(generatePIN())}
                    className="flex items-center text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-3xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Cambiar
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
                El colaborador usará este PIN directamente en la pantalla de inicio para entrar a sus módulos de trabajo.
              </div>

              <button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Registrar Acceso</span>
              </button>
            </div>
          </form>
        </div>

        {/* Buscador y Lista de Colaboradores */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar colaborador por nombre o PIN..."
              className="w-full bg-transparent border-none text-slate-800 text-xs font-medium focus:outline-none placeholder-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Colaboradores con Acceso</span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {filteredUsuarios.length} registros
              </span>
            </div>

            {filteredUsuarios.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">{searchQuery ? 'No hay resultados' : 'Sin usuarios creados'}</p>
                <p className="text-[11px]">{searchQuery ? 'Intenta con otro término de búsqueda' : 'Registra un colaborador en el formulario'}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUsuarios.map(u => {
                  const status = getUserConnectionStatus(u);
                  return (
                    <div key={u.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200 shrink-0 shadow-3xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-sm truncate" title={u.name}>
                              {u.name}
                            </h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                              {status.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-1">
                            <span className="font-semibold text-slate-600">{u.role || 'Colaborador'}</span>
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Último acceso: {u.lastLogin || 'Ninguno'}</span>
                            </span>
                            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Volumen de datos / utilidad registrada">
                              💾 {getUserMB(u.id, u.name)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-center shrink-0">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">PIN</span>
                          <span className="font-mono font-black text-sm text-slate-800 tracking-widest">{u.pin}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(u.id)}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              u.isActive !== false 
                                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' 
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            }`}
                            title={u.isActive !== false ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {u.isActive !== false ? 'Desactivar' : 'Activar'}
                          </button>

                          <button 
                            type="button"
                            onClick={() => handleRegeneratePIN(u.id)} 
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 bg-white transition-colors cursor-pointer" 
                            title="Regenerar PIN"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => handleDelete(u.id)} 
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 bg-white transition-colors cursor-pointer" 
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL PARA SUBIR / RESTAURAR BASE DE DATOS DE USUARIOS    */}
      {/* ========================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-900 text-white rounded-xl">
                  <Upload className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Subir Base de Datos de Usuarios PIN
                  </h3>
                  <p className="text-[11px] text-slate-500">Restaura o actualiza los accesos de tus colaboradores</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!isProcessingImport) {
                    setShowImportModal(false);
                    setParsedImportUsers(null);
                  }
                }}
                disabled={isProcessingImport}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Archivo */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Seleccionar archivo de respaldo (.JSON o .CSV)
              </label>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 p-5 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
              >
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleSelectFileToImport}
                  className="hidden"
                />
                
                <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center mx-auto text-slate-600 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors shadow-2xs">
                  <Database className="w-5 h-5" />
                </div>

                {importFileName ? (
                  <div>
                    <p className="text-xs font-bold text-slate-800">{importFileName}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">
                      {(importFileSize / 1024).toFixed(1)} KB • Archivo seleccionado
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-extrabold text-slate-700">Haz clic para buscar tu archivo de respaldo</p>
                    <p className="text-[11px] text-slate-400">Archivos .JSON descargados previamente o tablas .CSV</p>
                  </div>
                )}
              </div>

              {/* Mensaje de Error si ocurre */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Previsualización de Datos Detectados */}
              {parsedImportUsers && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{parsedImportUsers.length} usuarios detectados en el archivo</span>
                    </div>
                  </div>

                  {/* Modo de Restauración */}
                  <div className="space-y-1.5 pt-1 border-t border-emerald-200/60">
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Método de Integración:
                    </label>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setImportMode('merge')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                          importMode === 'merge'
                            ? 'bg-white border-emerald-600 text-emerald-900 shadow-2xs'
                            : 'bg-emerald-100/50 border-emerald-200 text-emerald-800 hover:bg-white/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Fusionar</span>
                          {importMode === 'merge' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">Conserva los actuales y agrega los nuevos</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setImportMode('overwrite')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                          importMode === 'overwrite'
                            ? 'bg-white border-rose-500 text-rose-900 shadow-2xs'
                            : 'bg-emerald-100/50 border-emerald-200 text-emerald-800 hover:bg-white/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Reemplazo Total</span>
                          {importMode === 'overwrite' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                        </div>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">Sustituye toda la lista por el respaldo</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Barra de Progreso */}
              {isProcessingImport && (
                <div className="pt-2">
                  <UploadProgressBar
                    progress={importProgress}
                    fileName={importFileName}
                    fileSizeBytes={importFileSize}
                    statusMessage="Sincronizando y resguardando usuarios en la base de datos..."
                    isComplete={importProgress >= 100}
                    type="document"
                  />
                </div>
              )}
            </div>

            {/* Acciones Modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessingImport}
                onClick={() => {
                  setShowImportModal(false);
                  setParsedImportUsers(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!parsedImportUsers || isProcessingImport}
                onClick={handleExecuteImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-40 flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>{isProcessingImport ? 'Procesando...' : 'Aplicar Base de Datos'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
