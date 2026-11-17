import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { TrendingUp, Briefcase, Users, DollarSign, FileText, Edit2, Trash2, Plus, UserPlus, FolderKanban, Box, Search, Eye, Download, Image as ImageIcon, StickyNote, FileArchive, ArrowLeft, EyeOff } from 'lucide-react';
import { Project, Client, ClientFile, FinanceRecord, SystemUser } from '../types';
import PestanasMovil from './common/PestanasMovil';
import { SavedTechosDesign, fetchAllTechosDesigns, setActiveTechosDesignToLoad, deleteTechosDesign } from '../lib/techosDesignsRepo';
import { safeStorage } from '../lib/storageManager';
import { sincronizarAceptadas, datosDiseno, fechaCorta, opcionesDesdePrecio } from '../lib/acuerdoTechos';
import { prepararArchivoCarpeta, migrarArchivosPesados } from '../lib/carpetaArchivos';
import { simb, dinero } from '../lib/currency';
import AvanceObraPanel, { SincronizadorFotosAvance, BarraAvance } from './avance/AvanceObraPanel';
import { avanceGlobal } from '../lib/avanceObra';

interface ProyectosYClientesViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  finances: FinanceRecord[];
  initialSubTab?: 'projects' | 'clients' | 'portafolio';
  isAdmin?: boolean;
  currentUser?: SystemUser | null;
  onNavigateToTechos?: () => void;
}

const formatCurrency = (amount: number) => {
  return dinero(amount);
};

export default function ProyectosYClientesView({
  projects,
  setProjects,
  clients,
  setClients,
  finances,
  initialSubTab = 'projects',
  isAdmin = false,
  currentUser,
  onNavigateToTechos
}: ProyectosYClientesViewProps) {
  const [activeTab, setActiveTab] = useState<'projects' | 'clients' | 'portafolio'>(initialSubTab);
  // El admin solo ve aquí lo suyo; lo de los usuarios está en "Supervisión".
  const clientScopeFilter = 'admin' as 'todos' | 'admin' | 'usuarios';
  const projectScopeFilter = 'admin' as 'todos' | 'admin' | 'usuarios';
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');

  // --- PORTAFOLIO 3D & CARPETA PRIVADA STATE ---
  const [portfolioDesigns, setPortfolioDesigns] = useState<SavedTechosDesign[]>([]);
  const [portfolioSearch, setPortfolioSearch] = useState<string>('');
  const [portfolioAdminScope, setPortfolioAdminScope] = useState<'admin' | 'all'>('admin');
  const [selectedFolderGroupId, setSelectedFolderGroupId] = useState<string | null>(null);
  const [exportandoPlano, setExportandoPlano] = useState<string | null>(null);
  const [pestanaCarpeta, setPestanaCarpeta] = useState<'todo' | 'docs' | 'fotos' | 'planos' | 'notas'>('todo');
  const [clientNotesMap, setClientNotesMap] = useState<Record<string, string>>(() => {
    return safeStorage.getItem<Record<string, string>>('innova_client_notes_map', {}) || {};
  });

  const handleSaveClientNote = (key: string, note: string) => {
    const updated = { ...clientNotesMap, [key]: note };
    setClientNotesMap(updated);
    safeStorage.setItem('innova_client_notes_map', updated);
  };

  const handleDownloadClientZip = async (
    clientName: string,
    clientObj: Client | undefined,
    clientProjects: Project[],
    designs: SavedTechosDesign[],
    notesText: string = ''
  ) => {
    try {
      const zip = new JSZip();
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const safeName = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');

      const totalPresupuesto = clientProjects.reduce((s, p) => s + (p.presupuesto || 0), 0);
      const totalCobrado = clientProjects.reduce((s, p) => s + (p.cobros?.reduce((cs, c) => cs + c.amount, 0) || 0), 0);
      const saldo = totalPresupuesto - totalCobrado;

      const summaryText = `================================================================================
INNOVA CONTRATISTAS - CARPETA PRIVADA DEL CLIENTE
Cliente: ${clientName}
DNI/RUC: ${clientObj?.dni || 'N/A'}
Empresa: ${clientObj?.company || 'N/A'}
Teléfono: ${clientObj?.phone || 'N/A'}
Email: ${clientObj?.email || 'N/A'}
Dirección: ${clientObj?.address || 'N/A'}
Fecha de Generación: ${now.toLocaleString('es-PE')}
================================================================================

1. NOTAS U OBSERVACIONES DEL CLIENTE:
--------------------------------------------------------------------------------
${notesText.trim() || 'Sin notas u observaciones registradas.'}


2. RESUMEN FINANCIERO Y DE OBRAS:
--------------------------------------------------------------------------------
Proyectos Totales: ${clientProjects.length}
Monto Total Pactado: ${simb()} ${totalPresupuesto.toFixed(2)}
Monto Cobrado: ${simb()} ${totalCobrado.toFixed(2)}
Saldo Pendiente: ${simb()} ${saldo.toFixed(2)}

Proyectos:
${clientProjects.map(p => `- ${p.name}: Presupuesto ${simb()} ${p.presupuesto || 0} (${p.status})`).join('\n') || 'Sin proyectos activos'}


3. PLANOS 3D REGISTRADOS (${designs.length}):
--------------------------------------------------------------------------------
${designs.map(d => `- ${d.nombre} (Guardado: ${d.savedAt || d.updatedAt})`).join('\n') || 'Sin planos 3D registrados'}
`;

      zip.file(`1_Notas_e_Informacion_${safeName}.txt`, summaryText);

      const payload = {
        cliente: clientObj || { nombre: clientName },
        notas: notesText,
        proyectos: clientProjects,
        planos3D: designs,
        fechaExportacion: now.toISOString()
      };
      zip.file(`2_Expediente_${safeName}.json`, JSON.stringify(payload, null, 2));

      if (designs.length > 0) {
        const folder3D = zip.folder("Planos_3D");
        designs.forEach((d, idx) => {
          folder3D?.file(`Plano_${idx + 1}_${d.nombre.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`, JSON.stringify(d, null, 2));
        });
      }

      const photos = (clientObj?.files || []).filter(f => f.type === 'photo');
      if (photos.length > 0) {
        const folderFotos = zip.folder("Fotos_de_Obra");
        photos.forEach((photo, idx) => {
          if (photo.dataUrl && photo.dataUrl.includes('base64,')) {
            const base64Data = photo.dataUrl.split('base64,')[1];
            folderFotos?.file(`Foto_${idx + 1}_${photo.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`, base64Data, { base64: true });
          }
        });
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Carpeta_Privada_${safeName}_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error creando archivo ZIP de cliente:', err);
    }
  };

  const isClientCreatedByAdmin = (c: Client) => {
    if (!c.userId || c.userId === 'admin' || c.userId === 'user') return true;
    const nameLower = (c.creatorName || '').toLowerCase().trim();
    if (!nameLower || nameLower === 'usuario' || nameLower === 'administrador' || nameLower === 'administrador principal' || nameLower.includes('admin')) {
      return true;
    }
    return false;
  };

  const isProjectCreatedByAdmin = (p: Project) => {
    if (!(p as any).userId || (p as any).userId === 'admin' || (p as any).userId === 'user') return true;
    const nameLower = ((p as any).creatorName || '').toLowerCase().trim();
    if (!nameLower || nameLower === 'usuario' || nameLower === 'administrador' || nameLower === 'administrador principal' || nameLower.includes('admin')) {
      return true;
    }
    return false;
  };

  // Techos: lo que el cliente aceptó en el link se fija como acordado, y el
  // presupuesto actual de cada diseño enlazado para ver la diferencia.
  const [actualTechos, setActualTechos] = useState<Record<string, { venta: number; costo: number }>>({});
  useEffect(() => {
    sincronizarAceptadas(projects).then(r => { if (r) setProjects(r); }).catch(() => {});
    projects.filter(p => p.techos?.disenoId).forEach(p => datosDiseno(p.techos!.disenoId).then(v => { if (v) setActualTechos(a => ({ ...a, [p.id]: v })); }).catch(() => {}));
  }, [projects.map(p => `${p.id}:${p.techos?.propuestaId || ''}:${p.techos?.disenoId || ''}`).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    fetchAllTechosDesigns().then(setPortfolioDesigns).catch(() => {});
  }, [activeTab]);

  const handleOpenPlanInTechos = (design: SavedTechosDesign) => {
    setActiveTechosDesignToLoad(design);
    if (onNavigateToTechos) {
      onNavigateToTechos();
    }
  };

  const handleDeletePortfolioDesign = async (designId: string, designName: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el plano 3D "${designName}"? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;

    await deleteTechosDesign(designId);
    setPortfolioDesigns(prev => prev.filter(d => d.id !== designId));
  };

  // --- PROYECTOS STATE ---
  const [pName, setPName] = useState('');
  const [pClient, setPClient] = useState('');
  const [pPresupuesto, setPPresupuesto] = useState('');
  const [pStatus, setPStatus] = useState<Project['status']>('Pendiente');
  const [pPlazoEstimado, setPPlazoEstimado] = useState('');
  const [pEditingId, setPEditingId] = useState<string | null>(null);

  const [addingCobroId, setAddingCobroId] = useState<string | null>(null);
  const [editingCobroId, setEditingCobroId] = useState<string | null>(null);
  const [cobroAmount, setCobroAmount] = useState('');
  const [cobroDate, setCobroDate] = useState(new Date().toISOString().split('T')[0]);
  const [cobroMethod, setCobroMethod] = useState('Transferencia');

  const [editingSpecsId, setEditingSpecsId] = useState<string | null>(null);
  const [avanceId, setAvanceId] = useState<string | null>(null);
  const [specsText, setSpecsText] = useState('');

  // --- CLIENTES STATE ---
  const [cName, setCName] = useState('');
  const [cCompany, setCCompany] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cDni, setCDni] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cEditingId, setCEditingId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const [subiendoArchivo, setSubiendoArchivo] = useState<'photo' | 'contract' | null>(null);
  const AVATAR_COLORES = ['bg-blue-50 text-blue-600', 'bg-amber-50 text-amber-600', 'bg-emerald-50 text-emerald-600', 'bg-purple-50 text-purple-600', 'bg-rose-50 text-rose-600', 'bg-sky-50 text-sky-600'];
  const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '📁';
  const soles = (v: number) => `${simb()} ${Math.round(v).toLocaleString('es-PE')}`;
  const colorAvatar = (n: string) => AVATAR_COLORES[[...n].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_COLORES.length];

  const handleClientFileUpload = async (clientId: string, e: React.ChangeEvent<HTMLInputElement>, fileType: 'photo' | 'contract' | 'document') => {
    const input = e.target;
    const selected = Array.from(input.files || []);
    input.value = '';
    if (selected.length === 0 || subiendoArchivo) return;
    const cliente = clients.find(c => c.id === clientId);
    if (!cliente) {
      alert('Esta carpeta no pertenece a un cliente registrado. Crea el cliente primero para poder guardar archivos.');
      return;
    }
    setSubiendoArchivo(fileType === 'photo' ? 'photo' : 'contract');
    const nuevos: ClientFile[] = [];
    const errores: string[] = [];
    for (const file of selected) {
      try {
        nuevos.push(await prepararArchivoCarpeta(file, fileType, clientId));
      } catch (err: any) {
        errores.push(err?.message || `No se pudo guardar "${file.name}".`);
      }
    }
    const previos = await migrarArchivosPesados(cliente.files || [], clientId);
    if (nuevos.length > 0 || previos.some((f, i) => f !== (cliente.files || [])[i])) {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, files: [...nuevos, ...previos] } : c));
    }
    setSubiendoArchivo(null);
    if (errores.length) alert(errores.join('\n'));
  };

  const handleRemoveClientFile = (clientId: string, fileId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este archivo adjunto?')) return;
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const files = (c.files || []).filter(f => f.id !== fileId);
        return { ...c, files };
      }
      return c;
    }));
  };

  // --- HANDLERS PROYECTOS ---
  const handleSaveSpecs = (projectId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, detallesContrato: specsText } : p));
    setEditingSpecsId(null);
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pClient || !pPresupuesto) return;
    const baseProject = pEditingId ? (projects.find(p => p.id === pEditingId) || {} as any) : {};
    const newProject: Project & { userId?: string; creatorName?: string } = {
      ...baseProject,
      id: pEditingId || Date.now().toString(),
      name: pName,
      client: pClient,
      status: pStatus,
      presupuesto: Number(pPresupuesto),
      // Si cambias el monto a mano, ese es el precio pactado con el cliente.
      ...(baseProject.techos?.acordado && Math.abs(baseProject.techos.acordado.total - Number(pPresupuesto)) > 0.004
        ? { techos: { ...baseProject.techos, acordado: { ...baseProject.techos.acordado, total: Number(pPresupuesto), fecha: new Date().toISOString(), fuente: 'manual' as const } } } : {}),
      plazoEstimado: pPlazoEstimado,
      date: pEditingId ? baseProject.date : new Date().toISOString().split('T')[0],
      userId: baseProject.userId || currentUser?.id || (isAdmin ? 'admin' : 'user'),
      creatorName: baseProject.creatorName || currentUser?.name || (isAdmin ? 'Administrador Principal' : 'Colaborador')
    };
    if (pEditingId) {
      setProjects(prev => prev.map(p => p.id === pEditingId ? newProject : p));
    } else {
      setProjects([...projects, newProject]);
    }
    setPName(''); setPClient(''); setPPresupuesto(''); setPPlazoEstimado(''); setPStatus('Pendiente'); setPEditingId(null);
  };

  const handleAddCobro = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!cobroAmount) return;
    const amount = Number(cobroAmount);
    const newProjects = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          cobros: editingCobroId 
            ? (p.cobros || []).map(c => c.id === editingCobroId ? { ...c, amount, date: cobroDate, method: cobroMethod } : c)
            : [...(p.cobros || []), { id: Date.now().toString(), amount, date: cobroDate, method: cobroMethod }]
        };
      }
      return p;
    });
    setProjects(newProjects);
    setAddingCobroId(null);
    setEditingCobroId(null);
    setCobroAmount('');
    setCobroDate(new Date().toISOString().split('T')[0]);
    setCobroMethod('Transferencia');
  };

  const startEditCobro = (projectId: string, cobro: any) => {
    setAddingCobroId(projectId);
    setEditingCobroId(cobro.id);
    setCobroAmount(cobro.amount.toString());
    setCobroDate(cobro.date);
    setCobroMethod(cobro.method || 'Transferencia');
  };

  const handleDeleteCobro = (projectId: string, cobroId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      cobros: (p.cobros || []).filter(c => c.id !== cobroId)
    } : p));
  };

  // --- HANDLERS CLIENTES ---
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;
    const baseClient = cEditingId ? (clients.find(c => c.id === cEditingId) || {} as any) : {};
    const newClient: Client = {
      ...baseClient,
      id: cEditingId || Date.now().toString(),
      name: cName, 
      company: cCompany, 
      phone: cPhone, 
      email: cEmail, 
      dni: cDni, 
      address: cAddress,
      createdAt: baseClient.createdAt || new Date().toISOString().split('T')[0],
      userId: isAdmin ? 'admin' : (baseClient.userId || (currentUser?.id ? `user_${currentUser.id}` : 'user')),
      creatorName: isAdmin ? 'Administrador Principal' : (baseClient.creatorName || currentUser?.name || 'Colaborador')
    };
    if (cEditingId) {
      setClients(clients.map(c => c.id === cEditingId ? newClient : c));
    } else {
      setClients([...clients, newClient]);
    }
    setCName(''); setCCompany(''); setCPhone(''); setCEmail(''); setCDni(''); setCAddress(''); setCEditingId(null);
  };

  const handleEditClient = (c: Client) => {
    setCName(c.name); setCCompany(c.company || ''); setCPhone(c.phone || ''); 
    setCEmail(c.email || ''); setCDni(c.dni || ''); setCAddress(c.address || ''); 
    setCEditingId(c.id);
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Encabezado según sección */}
      {activeTab === 'portafolio' ? (
        selectedFolderGroupId !== null ? null : <header className="mb-2">
          <div className="titulo-pagina">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center">
              <FolderKanban className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-slate-600" />
              Carpetas de clientes
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Una carpeta por cliente con sus documentos, fotos, planos y notas. Solo tú la ves.</p>
          </div>
        </header>
      ) : (
        <header className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="titulo-pagina">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center">
                <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-indigo-600" />
                Proyectos & Clientes
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Gestión centralizada de obras, cotizaciones y directorio de clientes.</p>
            </div>
          </div>

          {/* Pestanas de Navegación Exclusivas de Proyectos & Clientes */}
          <PestanasMovil activa={activeTab as any} onCambio={(t: any) => setActiveTab(t)} pestanas={[{ id: 'projects', label: `Proyectos (${projects.length})`, icon: Briefcase }, { id: 'clients', label: `Clientes (${clients.length})`, icon: Users }]} />
          <div className="hidden xl:flex border-b border-slate-200 mt-6 space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px ${
                activeTab === 'projects'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Gestión de Proyectos ({projects.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px ${
                activeTab === 'clients'
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Directorio de Clientes ({clients.length})</span>
            </button>
          </div>
        </header>
      )}

      {/* TAB 1: PROYECTOS */}
      {activeTab === 'projects' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <form onSubmit={handleProjectSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Nombre</label>
              <input required value={pName} onChange={e => setPName(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. Techo Aluzinc 120m2" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Cliente</label>
              <select required value={pClient} onChange={e => setPClient(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                <option value="">Seleccione...</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Presupuesto ({simb()})</label>
              <input required value={pPresupuesto} onChange={e => setPPresupuesto(e.target.value)} onFocus={e => e.target.select()} type="number" min="0" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="0.00" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Estado</label>
              <select value={pStatus} onChange={e => setPStatus(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                <option value="Pendiente">Pendiente</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Completado">Completado</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Plazo (Aprox)</label>
              <input value={pPlazoEstimado} onChange={e => setPPlazoEstimado(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej: 15 días" />
            </div>
            <div className="md:col-span-1 flex gap-2">
              {pEditingId && (
                <button type="button" onClick={() => { setPEditingId(null); setPName(''); setPClient(''); setPPresupuesto(''); setPPlazoEstimado(''); setPStatus('Pendiente'); }} className="w-1/3 bg-slate-200 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-300 text-sm">
                  X
                </button>
              )}
              <button type="submit" className="w-full bg-slate-800 text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center text-sm">
                <Plus className="w-4 h-4 mr-1" />
                {pEditingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {([...projects]
              .filter(p => {
                if (isAdmin) {
                  const isCreatedByAdmin = isProjectCreatedByAdmin(p);
                  if (projectScopeFilter === 'admin' && !isCreatedByAdmin) return false;
                  if (projectScopeFilter === 'usuarios' && isCreatedByAdmin) return false;
                }
                return true;
              })
              .sort((a, b) => Number(b.id) - Number(a.id))
            ).map(p => {
              const isCreatedByAdmin = isProjectCreatedByAdmin(p);
              const totalCobrado = p.cobros?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;
              const totalMateriales = (p.materiales || [])
                .filter(m => !m.id?.startsWith('mat-imp-') && !m.id?.startsWith('mat-gasto-'))
                .reduce((sum, m) => sum + ((Number(m.quantity) || 0) * (Number(m.unitPrice) || 0)), 0);
              const totalPersonal = (p.personal || []).reduce((sum, per) => sum + (per.adelantos || []).reduce((aSum: number, a: any) => aSum + (Number(a.amount) || 0), 0), 0);
              const gastosOperativos = finances.filter(f => (f.type === 'gasto' || f.type === 'gastos' || f.type === 'familia') && f.sourceProject === p.name).reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
              const deudasPagadas = finances.filter(f => f.type === 'deuda' && f.sourceProject === p.name).reduce((sum, f) => sum + (f.payments?.reduce((s, pay) => s + (Number(pay.amount) || 0), 0) || (f.isPaid ? (Number(f.amount) || 0) : 0)), 0);
              const costoTotal = totalMateriales + totalPersonal + gastosOperativos + deudasPagadas;
              const porCobrar = (Number(p.presupuesto) || 0) - totalCobrado;
              
              return (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                      <p className="text-sm font-medium text-slate-500">{p.client}</p>
                      {isAdmin && (
                        <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                          isCreatedByAdmin
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {isCreatedByAdmin ? '👑 Proyecto de Administrador' : `👤 Creado por: ${(p as any).creatorName || 'Colaborador'}`}
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.status === 'Completado' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'En Progreso' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  {p.excluidoBalance && (
                    <p className="mx-5 mt-2 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5">No se dio · sus cobros y gastos no cuentan en la liquidez ni en el balance del panel.</p>
                  )}
                  
                  {/* Techos Metálicos: propuesta, lo acordado y el presupuesto actual del diseño */}
                  {p.techos && (p.techos.opciones?.length || p.techos.acordado || p.techos.disenoId) && (() => {
                    const t = p.techos, d = actualTechos[p.id];
                    // El precio del proyecto es lo pactado: las opciones parten de él y solo suman o
                    // restan la diferencia de cobertura (así nunca aparece un precio "inventado").
                    const precio = Number(p.presupuesto) || 0;
                    const opciones = t.opciones?.length ? opcionesDesdePrecio(t.opciones, t.acordado?.opcion, precio) : [];
                    const margenDiseno = d && precio > 0 ? precio - d.costo : null;
                    return (
                      <div className="mx-5 mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <p className="font-black text-indigo-900">Techo metálico{t.disenoNombre ? ` · ${t.disenoNombre}` : ''}</p>
                          {t.acordado
                            ? <span className="font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">{t.acordado.fuente === 'link' ? 'Aceptó en el link' : 'Acordado'} · {fechaCorta(t.acordado.fecha)}</span>
                            : t.propuestaId ? <span className="font-bold text-indigo-700 bg-white rounded-full px-2 py-0.5 border border-indigo-200">Propuesta enviada{t.propuestaFecha ? ` · ${fechaCorta(t.propuestaFecha)}` : ''} · esperando</span> : null}
                        </div>
                        {!!opciones.length && (
                          <div className="grid grid-cols-3 gap-1.5">
                            {opciones.map(o => { const sel = t.acordado?.opcion === o.nombre; return (
                              <div key={o.nombre} className={`rounded-lg p-1.5 border min-w-0 ${sel ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-700'}`}>
                                <p className="text-[10px] font-black truncate">{o.nombre}</p>
                                <p className="text-[11px] font-black truncate">{formatCurrency(o.total)}</p>
                              </div>
                            ); })}
                          </div>
                        )}
                        <div className="space-y-0.5 text-[11px]">
                          <p>Precio pactado (presupuesto del proyecto): <b>{formatCurrency(precio)}</b></p>
                          {d && <p>Costo del diseño (materiales + mano de obra + equipos): <b>{formatCurrency(d.costo)}</b></p>}
                          {margenDiseno != null && <p className={`font-black ${margenDiseno >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{margenDiseno >= 0 ? `Te queda ${formatCurrency(margenDiseno)} de margen` : `Pierdes ${formatCurrency(-margenDiseno)}: el diseño cuesta más de lo pactado`}</p>}
                          {d && <p className="text-slate-500">Si cotizaras hoy con tus % de gastos y utilidad saldría {formatCurrency(d.venta)}.</p>}
                        </div>
                      </div>
                    );
                  })()}

                  {!!p.avance?.partidas?.length && (
                    <button onClick={() => setAvanceId(p.id)} className="mx-5 mt-4 text-left rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 cursor-pointer hover:bg-emerald-50">
                      <span className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1"><span>Avance de obra · {p.avance.partes?.length || 0} partes</span><span className="font-black">{Math.round(avanceGlobal(p.avance.partidas))}%</span></span>
                      <BarraAvance pct={avanceGlobal(p.avance.partidas)} />
                    </button>
                  )}

                  {/* Cotizaciones enviadas desde los apartados («Enviar al proyecto»): ya están sumadas al presupuesto. */}
                  {!!p.partidas?.length && (
                    <div className="mx-5 mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-2.5 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Cotizaciones del proyecto</p>
                      {p.partidas.map(pt => (
                        <div key={pt.clave} className="flex items-center justify-between gap-2 text-xs">
                          <span className="min-w-0 truncate text-slate-700">{pt.nombre}</span>
                          <span className="font-bold text-slate-900 shrink-0">{formatCurrency(pt.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Card Body - Stats Grid */}
                  <div className="p-5 grid grid-cols-2 gap-4 flex-1">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Presupuesto</p>
                      <p className="font-semibold text-slate-800">{formatCurrency(p.presupuesto)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plazo</p>
                      <p className="font-semibold text-slate-800">{p.plazoEstimado || 'N/A'}</p>
                    </div>
                    
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Cobrado</p>
                      <p className="font-bold text-emerald-700">{formatCurrency(totalCobrado)}</p>
                    </div>
                    <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Por Cobrar</p>
                      <p className="font-bold text-rose-700">{formatCurrency(porCobrar)}</p>
                    </div>
                    
                    <div className="col-span-2 pt-3 border-t border-slate-100 flex justify-between items-center">
                      {(() => {
                        // Sin gastos registrados todavía, el margen real sería engañoso (= todo el presupuesto):
                        // se usa el costo estimado del diseño de Techos enlazado.
                        const est = costoTotal === 0 ? actualTechos[p.id]?.costo : undefined;
                        const costo = est ?? costoTotal, margen = (Number(p.presupuesto) || 0) - costo;
                        return (<>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{est != null ? 'Costo estimado (diseño)' : 'Costo (Mat+Per+Gast)'}</p>
                            <p className="font-semibold text-slate-700">{formatCurrency(costo)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{est != null ? 'Margen estimado' : 'Margen (Utilidad)'}</p>
                            <p className={`font-bold ${margen >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(margen)}</p>
                            {est != null && <p className="text-[10px] text-slate-400">Se actualiza al registrar materiales y gastos reales</p>}
                          </div>
                        </>);
                      })()}
                    </div>
                  </div>
                  
                  {/* Card Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => { setAddingCobroId(addingCobroId === p.id ? null : p.id); setEditingSpecsId(null); }} 
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${addingCobroId === p.id ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Cobros</span>
                      </button>
                      <button
                        onClick={() => setAvanceId(p.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                        title="Avance de obra con fotos"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Avance</span>
                      </button>
                      <button 
                        onClick={() => { 
                          if (editingSpecsId === p.id) {
                            setEditingSpecsId(null);
                          } else {
                            setEditingSpecsId(p.id);
                            setSpecsText(p.detallesContrato || '');
                            setAddingCobroId(null);
                          }
                        }} 
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${editingSpecsId === p.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Especificaciones</span>
                      </button>
                      <button
                        onClick={() => setProjects(prev => prev.map(x => x.id === p.id ? { ...x, excluidoBalance: !x.excluidoBalance } : x))}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${p.excluidoBalance ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        title={p.excluidoBalance ? 'El trabajo no se dio: no cuenta en liquidez ni balance. Toca para volver a contarlo.' : 'Si el trabajo no se dio, quítalo de la liquidez y el balance del panel (no se borra).'}
                      >
                        {p.excluidoBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="hidden sm:inline whitespace-nowrap">{p.excluidoBalance ? 'No se dio' : '¿No se dio?'}</span>
                      </button>
                      <button 
                        onClick={() => { setPName(p.name); setPClient(p.client); setPPresupuesto(p.presupuesto.toString()); setPPlazoEstimado(p.plazoEstimado || ''); setPStatus(p.status); setPEditingId(p.id); }} 
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const isColaboradorProj = !isProjectCreatedByAdmin(p);
                          const confirmMsg = isColaboradorProj
                            ? `⚠️ ATENCIÓN: Este proyecto fue registrado por el colaborador "${(p as any).creatorName || 'Usuario'}".\n\n¿Estás seguro de eliminar permanentemente el proyecto "${p.name}"?`
                            : `¿Estás seguro de eliminar el proyecto "${p.name}"?`;
                          if (window.confirm(confirmMsg)) {
                            setProjects(prev => prev.filter(x => x.id !== p.id));
                          }
                        }} 
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar proyecto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">#{p.id.slice(-4)}</span>
                  </div>

                  {/* Expanded Sections (Cobros) */}
                  {addingCobroId === p.id && (
                    <div className="p-5 border-t border-emerald-100 bg-emerald-50/30">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">Registrar Adelanto / Pago</h4>
                      <form onSubmit={(e) => handleAddCobro(e, p.id)} className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wider">Monto</label>
                            <input required type="number" min="0" step="0.01" value={cobroAmount} onChange={(e) => setCobroAmount(e.target.value)} onFocus={e => e.target.select()} className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej: 500" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wider">Fecha</label>
                            <input required type="date" value={cobroDate} onChange={(e) => setCobroDate(e.target.value)} className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wider">Método</label>
                          <select required value={cobroMethod} onChange={(e) => setCobroMethod(e.target.value)} className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500">
                            <option value="Transferencia">Transferencia</option>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div className="flex gap-2 mt-2">
                        {editingCobroId && (
                           <button type="button" onClick={() => { setEditingCobroId(null); setCobroAmount(''); setAddingCobroId(null); }} className="w-1/3 bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">
                             Cancelar
                           </button>
                        )}
                        <button type="submit" className={`${editingCobroId ? 'w-2/3' : 'w-full'} bg-emerald-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors`}>
                          {editingCobroId ? 'Actualizar Cobro' : 'Guardar Adelanto'}
                        </button>
                      </div>
                      </form>
                      
                      {p.cobros && p.cobros.length > 0 && (
                        <div className="mt-5">
                          <h4 className="font-bold text-slate-800 text-sm mb-2">Historial de Cobros</h4>
                          <div className="space-y-2">
                            {p.cobros.map(c => (
                              <div key={c.id} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-slate-100">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-700">{c.method}</p>
                                  <p className="text-xs text-slate-500">{c.date}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-emerald-600">+{formatCurrency(c.amount)}</span>
                                  <div className="flex space-x-1 border-l border-slate-200 pl-2">
                                    <button onClick={() => startEditCobro(p.id, c)} className="text-slate-400 hover:text-indigo-600 p-1 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDeleteCobro(p.id, c.id)} className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Expanded Sections (Especificaciones) */}
                  {editingSpecsId === p.id && (
                    <div className="p-5 border-t border-indigo-100 bg-indigo-50/30">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">Especificaciones Técnicas / Detalles</h4>
                      <p className="text-xs text-slate-500 mb-3">Estos detalles se incluirán automáticamente en el contrato.</p>
                      <textarea 
                        value={specsText} 
                        onChange={(e) => setSpecsText(e.target.value)} 
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 min-h-[120px]" 
                        placeholder="Ej: Materiales a usar, calidades, marcas, espesores, acabados..."
                      />
                      <div className="flex gap-2 mt-3">
                        <button type="button" onClick={() => setEditingSpecsId(null)} className="w-1/3 bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">
                          Cancelar
                        </button>
                        <button type="button" onClick={() => handleSaveSpecs(p.id)} className="w-2/3 bg-indigo-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                          Guardar Especificaciones
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {projects.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                No hay proyectos registrados. Utiliza el formulario superior para añadir uno.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLIENTES */}
      {activeTab === 'clients' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
              {cEditingId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleClientSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nombre / Razón Social *</label><input required value={cName} onChange={e => setCName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500" placeholder="Ej: Juan Pérez o Empresa SAC" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Empresa</label><input value={cCompany} onChange={e => setCCompany(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500" placeholder="Opcional" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">DNI / RUC</label><input inputMode="numeric" value={cDni} onChange={e => setCDni(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500" placeholder="Opcional" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Teléfono</label><input inputMode="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500" placeholder="Ej: 987654321" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Email</label><input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500" placeholder="cliente@correo.com" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Dirección</label><input value={cAddress} onChange={e => setCAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-indigo-500" placeholder="Dirección física" /></div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 mt-2">
                {cEditingId && <button type="button" onClick={() => { setCEditingId(null); setCName(''); setCCompany(''); setCPhone(''); setCEmail(''); setCDni(''); setCAddress(''); }} className="px-6 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium">Cancelar</button>}
                <button type="submit" className="bg-indigo-600 text-white font-medium px-6 py-2 rounded-xl hover:bg-indigo-700">{cEditingId ? 'Actualizar Cliente' : 'Guardar Cliente'}</button>
              </div>
            </form>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTROS DEL DIRECTORIO DE CLIENTES */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Buscador */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, DNI/RUC, empresa..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              {clientSearchTerm && (
                <button
                  type="button"
                  onClick={() => setClientSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {clients
              .filter(c => {
                // Filtro por ámbito (Admin vs Usuarios)
                if (isAdmin) {
                  const isCreatedByAdmin = isClientCreatedByAdmin(c);
                  if (clientScopeFilter === 'admin' && !isCreatedByAdmin) return false;
                  if (clientScopeFilter === 'usuarios' && isCreatedByAdmin) return false;
                }
                // Filtro por búsqueda
                if (clientSearchTerm.trim()) {
                  const term = clientSearchTerm.toLowerCase();
                  const matchesName = (c.name || '').toLowerCase().includes(term);
                  const matchesCompany = (c.company || '').toLowerCase().includes(term);
                  const matchesDni = (c.dni || '').toLowerCase().includes(term);
                  const matchesPhone = (c.phone || '').toLowerCase().includes(term);
                  const matchesCreator = (c.creatorName || '').toLowerCase().includes(term);
                  return matchesName || matchesCompany || matchesDni || matchesPhone || matchesCreator;
                }
                return true;
              })
              .map(c => {
                const isCreatedByAdmin = isClientCreatedByAdmin(c);
                
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800 leading-tight">{c.name}</h3>
                          {c.company && <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider mt-1">{c.company}</p>}
                          {isAdmin && (
                            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                              isCreatedByAdmin
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {isCreatedByAdmin ? '👑 Cliente de Administrador' : `👤 Creado por: ${c.creatorName || 'Usuario'}`}
                            </span>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0 ml-4">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="space-y-2 mt-4 text-sm text-slate-600">
                        {c.phone && (
                          <div className="flex items-center">
                            <span className="w-6 text-center mr-2 text-slate-400">📞</span> 
                            <span className="font-medium text-slate-700">{c.phone}</span>
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center">
                            <span className="w-6 text-center mr-2 text-slate-400">✉️</span> 
                            <span className="font-medium text-slate-700 truncate">{c.email}</span>
                          </div>
                        )}
                        {c.dni && (
                          <div className="flex items-center">
                            <span className="w-6 text-center mr-2 text-slate-400">🆔</span> 
                            <span className="font-medium text-slate-700">{c.dni}</span>
                          </div>
                        )}
                        {c.address && (
                          <div className="flex items-start">
                            <span className="w-6 text-center mr-2 text-slate-400">📍</span> 
                            <span className="font-medium text-slate-700 line-clamp-2">{c.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                      <button onClick={() => handleEditClient(c)} className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button onClick={() => handleDeleteClient(c.id)} className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            {clients.length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                No hay clientes registrados en el directorio.
              </div>
            )}
            {clients.length > 0 && clients.filter(c => {
              if (isAdmin) {
                const isCreatedByAdmin = isClientCreatedByAdmin(c);
                if (clientScopeFilter === 'admin' && !isCreatedByAdmin) return false;
                if (clientScopeFilter === 'usuarios' && isCreatedByAdmin) return false;
              }
              if (clientSearchTerm.trim()) {
                const term = clientSearchTerm.toLowerCase();
                const matchesName = (c.name || '').toLowerCase().includes(term);
                const matchesCompany = (c.company || '').toLowerCase().includes(term);
                const matchesDni = (c.dni || '').toLowerCase().includes(term);
                const matchesPhone = (c.phone || '').toLowerCase().includes(term);
                const matchesCreator = (c.creatorName || '').toLowerCase().includes(term);
                return matchesName || matchesCompany || matchesDni || matchesPhone || matchesCreator;
              }
              return true;
            }).length === 0 && (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
                No se encontraron clientes con el filtro seleccionado.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PORTAFOLIO 3D & CARPETAS PRIVADAS POR CLIENTE */}
      {activeTab === 'portafolio' && (() => {
        // Descargas desde la carpeta: archivos (PDF, Word…) y planos de techo en PDF / AutoCAD / Revit.
        const bajarBlob = (blob: Blob, nombre: string) => {
          const u = URL.createObjectURL(blob); const a = document.createElement('a');
          a.href = u; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(u), 4000);
        };
        const descargarArchivo = async (url: string, nombre: string) => {
          try {
            if (url.startsWith('data:')) { const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); return; }
            bajarBlob(await (await fetch(url)).blob(), nombre);
          } catch { window.open(url, '_blank'); }
        };
        const base = (n: string) => (n || 'techo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'techo';
        const exportarPlano = async (dz: SavedTechosDesign, tipo: 'pdf' | 'dxf' | 'ifc') => {
          setExportandoPlano(`${dz.id}:${tipo}`);
          try {
            if (tipo === 'ifc') {
              const [{ solidosDeTecho }, { ifc, descargarTexto }] = await Promise.all([import('./techos/exportarCadTechos'), import('../lib/solidosCad')]);
              const r = solidosDeTecho(dz.nodes || {}, dz.segments || {}, dz.coverageZones || {});
              if (!r.solidos.length) { alert('Este plano no tiene piezas para exportar.'); return; }
              descargarTexto(ifc(r.solidos, dz.nombre || 'Techo', currentUser?.name || 'InnovApp', r.superficies), `${base(dz.nombre)}.ifc`, 'application/x-step');
              return;
            }
            const [m, mem] = await Promise.all([import('../lib/dxfLamina'), import('./techos/memoriaCalculo')]);
            let memoria: any = null;
            try { memoria = mem.calcularMemoria(dz.nodes || {}, dz.segments || {}, dz.coverageZones || {}, {} as any); } catch { /* sin memoria */ }
            const o = { nombre: dz.nombre || 'Techo', empresa: undefined, escala: 0, memoria };
            if (tipo === 'pdf') {
              const blob = await m.pdfLaminas(dz.nodes || {}, dz.segments || {}, o, 'A3');
              if (blob) bajarBlob(blob, `${base(dz.nombre)}_laminas_A3.pdf`); else alert('Este plano no tiene piezas para dibujar.');
            } else {
              const { descargarTexto } = await import('../lib/solidosCad');
              descargarTexto(m.dxfLamina(dz.nodes || {}, dz.segments || {}, o), `${base(dz.nombre)}_lamina.dxf`, 'application/dxf');
            }
          } catch (e: any) {
            alert('No se pudo preparar el archivo: ' + (e?.message || e));
          } finally { setExportandoPlano(null); }
        };
        // Datos de una carpeta: obras, cobros y archivos por tipo (mismos datos que antes).
        const contratosGuardados = safeStorage.getItem<any[]>('innova_client_contracts', []) || [];
        const datosCarpeta = (groupId: string) => {
          const clientObj = clients.find(c => c.id === groupId);
          const clientName = clientObj?.name || (groupId === 'sin_cliente' ? 'Planos sin cliente' : 'Cliente');
          const nombreN = clientName.toLowerCase().trim();
          const planos = portfolioDesigns.filter(d => (groupId !== 'sin_cliente' ? (d.clientId === groupId || d.clientName === clientObj?.name) : !d.clientId));
          const obras = projects.filter(p => p.client === clientName);
          const presupuesto = obras.reduce((s2, p) => s2 + (p.presupuesto || 0), 0);
          const cobrado = obras.reduce((s2, p) => s2 + (p.cobros?.reduce((cs, c) => cs + c.amount, 0) || 0), 0);
          const fotos = (clientObj?.files || []).filter(f => f.type === 'photo');
          const docs = (clientObj?.files || []).filter(f => f.type === 'contract' || f.type === 'document');
          // La ficha del contrato solo se muestra si su PDF no está ya en la carpeta (antes salía repetido y sin descarga).
          const contratos = contratosGuardados.filter(c => String(c.clientName || '').toLowerCase().trim() === nombreN && !docs.some(f => f.name === c.fileName));
          return { clientObj, clientName, planos, obras, presupuesto, cobrado, contratos, fotos, docs, nota: clientNotesMap[groupId] || '' };
        };
        const Conteo = ({ icon: Ic, n, t }: { icon: any; n: number; t: string }) => (
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-1.5 py-0.5 ${n ? 'bg-slate-100 text-slate-700' : 'text-slate-300'}`} title={t}>
            <Ic className="w-3.5 h-3.5" />{n}
          </span>
        );

        if (selectedFolderGroupId === null) {
          // ─── LISTA DE CARPETAS ───
          const filteredClients = clients.filter(c => {
            if (!isAdmin) {
              return (c.userId && (c.userId === 'user_' + currentUser?.id || c.userId === currentUser?.id)) ||
                (c.creatorName && currentUser?.name && c.creatorName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
            }
            return portfolioAdminScope === 'admin' ? isClientCreatedByAdmin(c) : true;
          });
          const q = portfolioSearch.trim().toLowerCase();
          const ids = filteredClients.filter(c => !q || c.name.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.dni || '').includes(q)
            || portfolioDesigns.some(d => (d.clientId === c.id || d.clientName === c.name) && d.nombre.toLowerCase().includes(q))).map(c => c.id);
          const sinCliente = portfolioDesigns.filter(d => !d.clientId && (!(d as any).userId || (d as any).userId === 'admin' || (d as any).userId === currentUser?.id) && (!q || d.nombre.toLowerCase().includes(q)));
          if (sinCliente.length) ids.push('sin_cliente');
          return (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={portfolioSearch} onChange={(e) => setPortfolioSearch(e.target.value)} placeholder="Buscar cliente, DNI o plano…"
                    className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 transition-all" />
                  {portfolioSearch && <button onClick={() => setPortfolioSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Borrar búsqueda">×</button>}
                </div>
                {isAdmin && (
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold shrink-0">
                    {([['admin', 'Mis carpetas'], ['all', 'Todo el equipo']] as const).map(([v, t]) => (
                      <button key={v} type="button" onClick={() => setPortfolioAdminScope(v)}
                        className={`px-3 py-1.5 rounded-lg cursor-pointer ${portfolioAdminScope === v ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'}`}>{t}</button>
                    ))}
                  </div>
                )}
              </div>
              {ids.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-3xl shadow-2xs space-y-3 max-w-lg mx-auto">
                  <div className="text-4xl">📁</div>
                  <h3 className="text-base font-extrabold text-slate-800">{q ? 'No hay carpetas con esa búsqueda' : 'Aún no tienes carpetas'}</h3>
                  <p className="text-xs text-slate-500">Cada cliente que registres tiene su carpeta para guardar contratos, fotos de obra, planos y notas.</p>
                  {!q && <button type="button" onClick={() => { setActiveTab('clients'); setCEditingId(null); }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer">+ Registrar cliente</button>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ids.map(id => {
                    const d = datosCarpeta(id);
                    const avance = d.presupuesto > 0 ? Math.min(100, Math.round((d.cobrado / d.presupuesto) * 100)) : 0;
                    const sub = d.obras.length ? `${d.obras[0].name}${d.obras.length > 1 ? ` +${d.obras.length - 1}` : ''}` : (d.clientObj?.company || 'Sin obras');
                    return (
                      <button type="button" key={id} onClick={() => { setSelectedFolderGroupId(id); setPestanaCarpeta('todo'); }}
                        className="text-left bg-white rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99] space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${id === 'sin_cliente' ? 'bg-slate-100 text-slate-500' : colorAvatar(d.clientName)}`}>
                            {id === 'sin_cliente' ? '📐' : iniciales(d.clientName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-slate-900 truncate">{d.clientName}</h3>
                            <p className="text-xs text-slate-500 truncate">{sub}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Conteo icon={FileText} n={d.contratos.length + d.docs.length} t="Documentos" />
                          <Conteo icon={ImageIcon} n={d.fotos.length} t="Fotos" />
                          <Conteo icon={Box} n={d.planos.length} t="Planos 3D" />
                          {d.nota && <Conteo icon={StickyNote} n={1} t="Nota" />}
                          {d.presupuesto > 0 && <span className={`ml-auto text-[11px] font-bold ${d.presupuesto - d.cobrado > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {d.presupuesto - d.cobrado > 0 ? `Por cobrar ${soles(d.presupuesto - d.cobrado)}` : 'Pagado ✓'}</span>}
                        </div>
                        {d.presupuesto > 0 && (
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" title={`Cobrado ${avance}%`}>
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${avance}%` }} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // ─── DENTRO DE UNA CARPETA ───
        const groupId = selectedFolderGroupId;
        const d = datosCarpeta(groupId);
        const saldo = d.presupuesto - d.cobrado;
        const nDocs = d.contratos.length + d.docs.length;
        const esCliente = groupId !== 'sin_cliente';
        const subir = (tipo: 'photo' | 'contract', texto: string, corto: string, Ic: any, color: string) => esCliente && (
          <label className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${color} ${subiendoArchivo ? 'opacity-60 pointer-events-none' : ''}`}>
            <Ic className="w-4 h-4 shrink-0" />{subiendoArchivo === tipo ? 'Subiendo…' : <><span className="sm:hidden">{corto}</span><span className="hidden sm:inline">{texto}</span></>}
            <input type="file" multiple accept={tipo === 'photo' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.txt,.dwg,.dxf,image/*'} className="hidden"
              disabled={subiendoArchivo !== null} onChange={(e) => handleClientFileUpload(groupId, e, tipo)} />
          </label>
        );
        const Fila = ({ icon: Ic, color, titulo, sub, children }: { icon: any; color: string; titulo: string; sub: string; children?: React.ReactNode }) => (
          <div className="flex items-center gap-3 py-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}><Ic className="w-4 h-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{titulo}</p>
              <p className="text-[11px] text-slate-400 truncate">{sub}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">{children}</div>
          </div>
        );
        const Vacio = ({ t }: { t: string }) => <p className="py-8 text-center text-xs text-slate-400">{t}</p>;
        const btnBorrar = (fn: () => void, t: string) => (
          <button type="button" onClick={fn} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer" title={t} aria-label={t}><Trash2 className="w-4 h-4" /></button>
        );
        const listaDocs = (
          <>
            {d.contratos.map(c => <Fila key={c.id} icon={FileText} color="bg-indigo-50 text-indigo-600" titulo={c.fileName} sub="Contrato hecho en la app · para bajarlo, vuelve a generarlo en Contratos & EPP" />)}
            {d.docs.map(f => (
              <Fila key={f.id} icon={FileText} color="bg-blue-50 text-blue-600" titulo={f.name} sub={`Documento · ${f.uploadedAt}`}>
                <a href={f.dataUrl} target="_blank" rel="noopener noreferrer" title="Ver" aria-label={`Ver ${f.name}`}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center"><Eye className="w-4 h-4" /></a>
                <button type="button" onClick={() => descargarArchivo(f.dataUrl, f.name)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"><Download className="w-3.5 h-3.5" />Descargar</button>
                {btnBorrar(() => handleRemoveClientFile(groupId, f.id), 'Eliminar archivo')}
              </Fila>
            ))}
          </>
        );
        const listaPlanos = d.planos.map(p => (
          <div key={p.id} className="py-2.5">
            <Fila icon={Box} color="bg-amber-50 text-amber-600" titulo={p.nombre} sub={`Plano de techo · ${p.updatedAt || p.savedAt || ''}`}>
              <button type="button" onClick={() => handleOpenPlanInTechos(p)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"><Eye className="w-3.5 h-3.5" />Abrir</button>
              {btnBorrar(() => handleDeletePortfolioDesign(p.id, p.nombre), 'Eliminar plano')}
            </Fila>
            <div className="flex flex-wrap gap-1.5 pl-12">
              {([['pdf', 'PDF', 'Láminas para imprimir (A3)', 'text-rose-700 bg-rose-50 hover:bg-rose-100'], ['dxf', 'AutoCAD', 'Láminas en .DXF (AutoCAD lo abre y guarda como .DWG)', 'text-blue-700 bg-blue-50 hover:bg-blue-100'], ['ifc', 'Revit', 'Modelo .IFC para Revit (Insertar → Vincular IFC)', 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100']] as const).map(([t, l, tt, c]) => (
                <button key={t} type="button" title={tt} disabled={exportandoPlano !== null} onClick={() => exportarPlano(p, t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer disabled:opacity-50 ${c}`}>
                  <Download className="w-3 h-3" />{exportandoPlano === `${p.id}:${t}` ? 'Preparando…' : l}
                </button>
              ))}
            </div>
          </div>
        ));
        const galeria = (lista: typeof d.fotos) => (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {lista.map(ph => (
              <div key={ph.id} className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square">
                <img src={ph.dataUrl} alt={ph.name} className="w-full h-full object-cover cursor-pointer" onClick={() => setPreviewPhotoUrl(ph.dataUrl)} />
                <button type="button" onClick={() => handleRemoveClientFile(groupId, ph.id)} title="Eliminar foto" aria-label="Eliminar foto"
                  className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-rose-600 text-white rounded-md sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        );
        const pestanas = [
          { id: 'todo' as const, label: 'Todo', n: -1 },
          { id: 'docs' as const, label: 'Documentos', corto: 'Docs', n: nDocs },
          { id: 'fotos' as const, label: 'Fotos', n: d.fotos.length },
          { id: 'planos' as const, label: 'Planos', n: d.planos.length },
          { id: 'notas' as const, label: 'Notas', n: -1 },
        ].filter(t => esCliente || t.id === 'planos' || t.id === 'todo');
        return (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={() => setSelectedFolderGroupId(null)} className="text-sm font-bold text-blue-600 flex items-center gap-1.5 cursor-pointer hover:text-blue-700">
                <ArrowLeft className="w-4 h-4" /><span>Todas las carpetas</span>
              </button>
              <button type="button" onClick={() => handleDownloadClientZip(d.clientName, d.clientObj, d.obras, d.planos, d.nota)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer" title="Descargar toda la carpeta en un ZIP">
                <FileArchive className="w-4 h-4 text-emerald-600" /><span>Descargar todo (ZIP)</span>
              </button>
            </div>

            {/* Ficha del cliente */}
            <div className="bg-white rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold shrink-0 ${esCliente ? colorAvatar(d.clientName) : 'bg-slate-100 text-slate-500'}`}>{esCliente ? iniciales(d.clientName) : '📐'}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold text-slate-900 leading-tight truncate">{d.clientName}</h2>
                  <p className="text-xs text-slate-500 truncate">{[d.obras.map(p => p.name).join(', ') || d.clientObj?.company, d.clientObj?.phone && `📞 ${d.clientObj.phone}`, d.clientObj?.dni && `DNI ${d.clientObj.dni}`].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              {d.presupuesto > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {([['Presupuesto', d.presupuesto, 'text-slate-900'], ['Cobrado', d.cobrado, 'text-emerald-700'], [saldo > 0 ? 'Por cobrar' : 'Saldo', saldo, saldo > 0 ? 'text-amber-700' : 'text-emerald-700']] as [string, number, string][]).map(([l, v, c]) => (
                    <div key={l} className="bg-slate-50 rounded-xl px-3 py-2 min-w-0">
                      <p className={`text-sm sm:text-base font-extrabold truncate ${c}`}>{soles(v)}</p>
                      <p className="text-[11px] text-slate-500">{l}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Una sola fila para agregar */}
            {esCliente && (
              <div className="flex flex-wrap gap-2">
                {subir('contract', 'Subir documento', '+ Documento', FileText, 'bg-blue-600 hover:bg-blue-700 text-white')}
                {subir('photo', 'Subir fotos', '+ Fotos', ImageIcon, 'bg-emerald-600 hover:bg-emerald-700 text-white')}
                <button type="button" onClick={() => setPestanaCarpeta('notas')} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap bg-white text-slate-700 shadow-xs cursor-pointer">
                  <StickyNote className="w-4 h-4 shrink-0 text-amber-500" /><span className="sm:hidden">+ Nota</span><span className="hidden sm:inline">Escribir nota</span>
                </button>
              </div>
            )}

            {/* Pestañas: lo que hay en la carpeta, por tipo */}
            <div className="bg-white rounded-2xl shadow-xs">
              <div className="flex gap-1 border-b border-slate-100 px-2 overflow-x-auto">
                {pestanas.map(t => (
                  <button key={t.id} type="button" onClick={() => setPestanaCarpeta(t.id)}
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 sm:px-3 py-3 -mb-px border-b-[3px] text-[13px] font-black whitespace-nowrap cursor-pointer ${pestanaCarpeta === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>
                    {'corto' in t ? <><span className="sm:hidden">{t.corto}</span><span className="hidden sm:inline">{t.label}</span></> : t.label}{t.n >= 0 && <span className={`text-[10px] rounded-md px-1.5 py-0.5 ${pestanaCarpeta === t.id ? 'bg-indigo-100' : 'bg-slate-100'}`}>{t.n}</span>}
                  </button>
                ))}
              </div>
              <div className="p-4 pt-1">
                {pestanaCarpeta === 'todo' && (
                  nDocs + d.fotos.length + d.planos.length === 0 && !d.nota
                    ? <Vacio t="La carpeta está vacía. Sube el contrato, fotos de la obra o escribe una nota." />
                    : <div className="divide-y divide-slate-100">
                        {d.nota && (
                          <button type="button" onClick={() => setPestanaCarpeta('notas')} className="w-full text-left py-3 cursor-pointer">
                            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Nota</p>
                            <p className="text-sm text-slate-700 line-clamp-2">{d.nota}</p>
                          </button>
                        )}
                        {d.fotos.length > 0 && <div className="py-3 space-y-2"><p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Fotos de obra</p>{galeria(d.fotos.slice(0, 6))}</div>}
                        {nDocs > 0 && <div className="divide-y divide-slate-100">{listaDocs}</div>}
                        {d.planos.length > 0 && <div className="divide-y divide-slate-100">{listaPlanos}</div>}
                      </div>
                )}
                {pestanaCarpeta === 'docs' && (nDocs ? <div className="divide-y divide-slate-100">{listaDocs}</div> : <Vacio t="Sin documentos. Usa «Subir documento» (PDF, Word, Excel, DWG, DXF)." />)}
                {pestanaCarpeta === 'fotos' && (d.fotos.length ? <div className="pt-3">{galeria(d.fotos)}</div> : <Vacio t="Sin fotos. Usa «Subir fotos» para guardar el avance de la obra." />)}
                {pestanaCarpeta === 'planos' && (
                  <div>
                    {d.planos.length ? <div className="divide-y divide-slate-100">{listaPlanos}</div> : <Vacio t="Sin planos. Los techos que guardes con este cliente en Techos Metálicos aparecen aquí." />}
                    {esCliente && onNavigateToTechos && (
                      <button type="button" onClick={onNavigateToTechos} className="mt-2 w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1.5">
                        <Plus className="w-4 h-4" />Dibujar un plano en Techos Metálicos
                      </button>
                    )}
                  </div>
                )}
                {pestanaCarpeta === 'notas' && (
                  <div className="pt-3 space-y-2">
                    <textarea id="carpeta-notas" autoFocus value={d.nota} onChange={(e) => handleSaveClientNote(groupId, e.target.value)} rows={6}
                      placeholder="Acuerdos de pago, pedidos del cliente, medidas, recordatorios…"
                      className="w-full bg-slate-50 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
                    <p className="text-[11px] text-slate-400">Se guarda sola mientras escribes y va dentro del ZIP.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL DE VISTA PREVIA DE FOTO */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setPreviewPhotoUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 p-3 shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
            <img src={previewPhotoUrl} alt="Vista Previa" className="max-w-full max-h-[80vh] object-contain mx-auto rounded-xl" />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
      <SincronizadorFotosAvance setProjects={setProjects} />
      {avanceId && (() => {
        const pa = projects.find(x => x.id === avanceId);
        return pa ? (
          <AvanceObraPanel project={pa} setProjects={setProjects} onClose={() => setAvanceId(null)}
            ws={isAdmin ? 'admin' : currentUser ? `user_${currentUser.id}` : 'user'} autor={currentUser?.name} />
        ) : null;
      })()}
    </div>
  );
}
