import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  FileText, 
  Edit2, 
  Trash2, 
  Plus, 
  UserPlus,
  FolderKanban,
  Box,
  Search,
  Eye,
  Download,
  Image as ImageIcon,
  StickyNote,
  FileArchive,
  ArrowLeft,
  FolderOpen,
  ShieldCheck
} from 'lucide-react';
import { Project, Client, FinanceRecord, SystemUser } from '../types';
import { SavedTechosDesign, fetchAllTechosDesigns, setActiveTechosDesignToLoad, deleteTechosDesign } from '../lib/techosDesignsRepo';
import { safeStorage } from '../lib/storageManager';

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
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
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
  const [clientScopeFilter, setClientScopeFilter] = useState<'todos' | 'admin' | 'usuarios'>('todos');
  const [projectScopeFilter, setProjectScopeFilter] = useState<'todos' | 'admin' | 'usuarios'>('todos');
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');

  // --- PORTAFOLIO 3D & CARPETA PRIVADA STATE ---
  const [portfolioDesigns, setPortfolioDesigns] = useState<SavedTechosDesign[]>([]);
  const [portfolioSearch, setPortfolioSearch] = useState<string>('');
  const [portfolioAdminScope, setPortfolioAdminScope] = useState<'admin' | 'all'>('admin');
  const [selectedFolderGroupId, setSelectedFolderGroupId] = useState<string | null>(null);
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
Monto Total Pactado: S/ ${totalPresupuesto.toFixed(2)}
Monto Cobrado: S/ ${totalCobrado.toFixed(2)}
Saldo Pendiente: S/ ${saldo.toFixed(2)}

Proyectos:
${clientProjects.map(p => `- ${p.name}: Presupuesto S/ ${p.presupuesto || 0} (${p.status})`).join('\n') || 'Sin proyectos activos'}


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

  const handleClientFileUpload = async (clientId: string, e: React.ChangeEvent<HTMLInputElement>, fileType: 'photo' | 'contract' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (!dataUrl) return;

      const newFileItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: file.name,
        type: fileType,
        dataUrl,
        uploadedAt: new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        size: (file.size / 1024).toFixed(1) + ' KB'
      };

      setClients(prev => prev.map(c => {
        if (c.id === clientId) {
          const files = c.files || [];
          return { ...c, files: [newFileItem, ...files] };
        }
        return c;
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
        <header className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center">
                <FolderKanban className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-slate-600" />
                Carpeta Privada de Clientes
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Carpeta privada segura: consulta y gestiona automáticamente planos 3D, contratos, estados de cuenta y recursos técnicos de cada cliente.
              </p>
            </div>
          </div>
        </header>
      ) : (
        <header className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center">
                <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-blue-600" />
                Proyectos & Clientes
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Gestión centralizada de obras, cotizaciones y directorio de clientes.</p>
            </div>
          </div>

          {/* Pestanas de Navegación Exclusivas de Proyectos & Clientes */}
          <div className="flex border-b border-slate-200 mt-6 space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px ${
                activeTab === 'projects'
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
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
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
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
              <input required value={pName} onChange={e => setPName(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Ej. Techo Aluzinc 120m2" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Cliente</label>
              <select required value={pClient} onChange={e => setPClient(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="">Seleccione...</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Presupuesto (S/)</label>
              <input required value={pPresupuesto} onChange={e => setPPresupuesto(e.target.value)} onFocus={e => e.target.select()} type="number" min="0" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="0.00" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Estado</label>
              <select value={pStatus} onChange={e => setPStatus(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500">
                <option value="Pendiente">Pendiente</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Completado">Completado</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Plazo (Aprox)</label>
              <input value={pPlazoEstimado} onChange={e => setPPlazoEstimado(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Ej: 15 días" />
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

          {/* BARRA DE FILTROS PARA PROYECTOS (Especialmente para Administrador) */}
          {isAdmin && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Filtrar Proyectos:</span>
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'todos', label: `👥 Todos (${projects.length})` },
                  { id: 'admin', label: `👑 Mis Proyectos (${projects.filter(p => isProjectCreatedByAdmin(p)).length})` },
                  { id: 'usuarios', label: `👤 De Colaboradores (${projects.filter(p => !isProjectCreatedByAdmin(p)).length})` },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setProjectScopeFilter(f.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      projectScopeFilter === f.id
                        ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              const rentabilidadAprox = (Number(p.presupuesto) || 0) - costoTotal;
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
                      p.status === 'En Progreso' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  
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
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Costo (Mat+Per+Gast)</p>
                        <p className="font-semibold text-slate-700">{formatCurrency(costoTotal)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Margen (Utilidad)</p>
                        <p className={`font-bold ${rentabilidadAprox >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(rentabilidadAprox)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => { setAddingCobroId(addingCobroId === p.id ? null : p.id); setEditingSpecsId(null); }} 
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${addingCobroId === p.id ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Cobros</span>
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
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${editingSpecsId === p.id ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Especificaciones</span>
                      </button>
                      <button 
                        onClick={() => { setPName(p.name); setPClient(p.client); setPPresupuesto(p.presupuesto.toString()); setPPlazoEstimado(p.plazoEstimado || ''); setPStatus(p.status); setPEditingId(p.id); }} 
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
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
                                    <button onClick={() => startEditCobro(p.id, c)} className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
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
                    <div className="p-5 border-t border-blue-100 bg-blue-50/30">
                      <h4 className="font-bold text-slate-800 text-sm mb-3">Especificaciones Técnicas / Detalles</h4>
                      <p className="text-xs text-slate-500 mb-3">Estos detalles se incluirán automáticamente en el contrato.</p>
                      <textarea 
                        value={specsText} 
                        onChange={(e) => setSpecsText(e.target.value)} 
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 min-h-[120px]" 
                        placeholder="Ej: Materiales a usar, calidades, marcas, espesores, acabados..."
                      />
                      <div className="flex gap-2 mt-3">
                        <button type="button" onClick={() => setEditingSpecsId(null)} className="w-1/3 bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">
                          Cancelar
                        </button>
                        <button type="button" onClick={() => handleSaveSpecs(p.id)} className="w-2/3 bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
              <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
              {cEditingId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleClientSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nombre / Razón Social *</label><input required value={cName} onChange={e => setCName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500" placeholder="Ej: Juan Pérez o Empresa SAC" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Empresa</label><input value={cCompany} onChange={e => setCCompany(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500" placeholder="Opcional" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">DNI / RUC</label><input value={cDni} onChange={e => setCDni(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500" placeholder="Opcional" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Teléfono</label><input value={cPhone} onChange={e => setCPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500" placeholder="Ej: 987654321" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Email</label><input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500" placeholder="cliente@correo.com" /></div>
              <div><label className="block text-xs font-semibold text-slate-500 mb-1">Dirección</label><input value={cAddress} onChange={e => setCAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500" placeholder="Dirección física" /></div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 mt-2">
                {cEditingId && <button type="button" onClick={() => { setCEditingId(null); setCName(''); setCCompany(''); setCPhone(''); setCEmail(''); setCDni(''); setCAddress(''); }} className="px-6 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium">Cancelar</button>}
                <button type="submit" className="bg-blue-600 text-white font-medium px-6 py-2 rounded-xl hover:bg-blue-700">{cEditingId ? 'Actualizar Cliente' : 'Guardar Cliente'}</button>
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
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
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

            {/* Filtros de Pestañas (Especialmente para Administrador para separar sus clientes de los usuarios) */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Filtrar:</span>
                {[
                  { id: 'todos', label: `👥 Todos (${clients.length})` },
                  { id: 'admin', label: `👑 Mis Clientes (${clients.filter(c => isClientCreatedByAdmin(c)).length})` },
                  { id: 'usuarios', label: `👤 De Usuarios (${clients.filter(c => !isClientCreatedByAdmin(c)).length})` },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setClientScopeFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                      clientScopeFilter === f.id
                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
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
                          {c.company && <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mt-1">{c.company}</p>}
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
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0 ml-4">
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
                      <button onClick={() => handleEditClient(c)} className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium cursor-pointer">
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
      {activeTab === 'portafolio' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header depending on whether a specific folder is selected or all folders are shown */}
          {selectedFolderGroupId === null ? (
            <>
              {/* Barra Superior de la Vista de Carpetas */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight">
                        {isAdmin ? 'Carpetas Privadas de Administrador' : `Carpeta Privada de ${currentUser?.name || 'Usuario'}`}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {isAdmin
                          ? 'Espacio exclusivo y ordenado: visualiza únicamente tus proyectos y clientes sin mezclar datos de otros usuarios.'
                          : 'Tu espacio 100% privado e independiente: organiza tus planos 3D, contratos, fotos de obra y notas.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Selector de Ámbito solo para Administrador */}
                  {isAdmin && (
                    <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => setPortfolioAdminScope('admin')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          portfolioAdminScope === 'admin'
                            ? 'bg-white text-slate-700 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        👑 Solo Mis Carpetas
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortfolioAdminScope('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          portfolioAdminScope === 'all'
                            ? 'bg-white text-slate-700 shadow-2xs font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        👥 Todo el Equipo
                      </button>
                    </div>
                  )}

                  {/* Filtro de búsqueda en mis carpetas */}
                  <div className="relative min-w-[200px] flex-1 sm:flex-none">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={portfolioSearch}
                      onChange={(e) => setPortfolioSearch(e.target.value)}
                      placeholder="Buscar en mis carpetas..."
                      className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                    />
                    {portfolioSearch && (
                      <button 
                        onClick={() => setPortfolioSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Botón Ir a Diseñar */}
                  {onNavigateToTechos && (
                    <button
                      type="button"
                      onClick={onNavigateToTechos}
                      className="px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-98"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Plano 3D</span>
                    </button>
                  )}
                </div>
              </div>

              {/* VISTA EN CUADRÍCULA DE CARPETAS (FOLDER GRID VIEW CON FILTRO ESTRICTO DE PROPIEDAD) */}
              {(() => {
                const clientGroups = new Map<string, { clientName: string; clientObj?: Client; designs: SavedTechosDesign[] }>();
                
                // Aislamiento estricto: los usuarios ven solo sus propios clientes; el admin ve los suyos o del equipo según toggle
                const filteredClients = clients.filter(c => {
                  if (!isAdmin) {
                    const isMyClient = 
                      (c.userId && (c.userId === 'user_' + currentUser?.id || c.userId === currentUser?.id)) ||
                      (c.creatorName && currentUser?.name && c.creatorName.toLowerCase().trim() === currentUser.name.toLowerCase().trim());
                    return isMyClient;
                  }
                  if (portfolioAdminScope === 'admin') {
                    return isClientCreatedByAdmin(c);
                  }
                  return true;
                });

                filteredClients.forEach(c => {
                  if (portfolioSearch.trim()) {
                    const s = portfolioSearch.toLowerCase();
                    const matchClient = c.name.toLowerCase().includes(s) || (c.company || '').toLowerCase().includes(s) || (c.dni || '').includes(s);
                    const matchHasDesign = portfolioDesigns.some(d => (d.clientId === c.id || d.clientName === c.name) && d.nombre.toLowerCase().includes(s));
                    if (!matchClient && !matchHasDesign) return;
                  }
                  clientGroups.set(c.id, { clientName: c.name, clientObj: c, designs: [] });
                });

                portfolioDesigns.forEach(d => {
                  const groupKey = d.clientId || 'sin_cliente';
                  if (clientGroups.has(groupKey)) {
                    clientGroups.get(groupKey)!.designs.push(d);
                  } else if (groupKey === 'sin_cliente') {
                    // Solo incluir si pertenece al usuario activo
                    const dUserId = (d as any).userId;
                    const isMyDesign = !dUserId || dUserId === 'admin' || (currentUser?.id && dUserId === currentUser.id);
                    if (isMyDesign && (!portfolioSearch.trim() || d.nombre.toLowerCase().includes(portfolioSearch.toLowerCase()))) {
                      if (!clientGroups.has('sin_cliente')) {
                        clientGroups.set('sin_cliente', { clientName: 'Planos Generales (Sin Asignar)', designs: [] });
                      }
                      clientGroups.get('sin_cliente')!.designs.push(d);
                    }
                  }
                });

                if (clientGroups.size === 0) {
                  return (
                    <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5 max-w-lg mx-auto animate-fadeIn">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50/80 text-slate-500 border border-slate-100 flex items-center justify-center text-3xl">
                        📁
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800">
                        {isAdmin && portfolioAdminScope === 'admin'
                          ? 'No tienes carpetas privadas de administrador registradas'
                          : 'Tu espacio privado está en orden y al día'}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                        {isAdmin
                          ? 'Tus obras y clientes registrados aparecerán aquí sin mezclarse con la información de los usuarios.'
                          : 'Cada cliente que registres en tu directorio creará de inmediato su carpeta privada para almacenar planos 3D, contratos y fotos.'}
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setActiveTab('clients'); setCEditingId(null); }}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          + Registrar Cliente
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-fadeIn">
                    {Array.from(clientGroups.entries()).map(([groupId, group]) => {
                      const clientObj = group.clientObj || clients.find(c => c.id === groupId);
                      const clientProjects = projects.filter(p => p.client === group.clientName || (clientObj && p.client === clientObj.name));
                      const totalPresupuesto = clientProjects.reduce((s, p) => s + (p.presupuesto || 0), 0);

                      const allSavedContracts = safeStorage.getItem<any[]>('innova_client_contracts', []) || [];
                      const clientSavedContracts = allSavedContracts.filter(c => 
                        c.clientName.toLowerCase().trim() === group.clientName.toLowerCase().trim() ||
                        (clientObj && c.clientName.toLowerCase().trim() === clientObj.name.toLowerCase().trim())
                      );
                      const uploadedDocsCount = (clientObj?.files || []).filter(f => f.type === 'contract' || f.type === 'document').length;
                      const photosCount = (clientObj?.files || []).filter(f => f.type === 'photo').length;
                      const docsTotal = clientSavedContracts.length + uploadedDocsCount;

                      return (
                        <div
                          key={groupId}
                          onClick={() => setSelectedFolderGroupId(groupId)}
                          className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between space-y-3.5"
                        >
                          {/* Folder Top Header */}
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50/80 text-slate-600 border border-slate-100 flex items-center justify-center font-bold text-2xl group-hover:scale-105 transition-transform shrink-0">
                              📁
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-slate-600 transition-colors line-clamp-1">
                                {group.clientName}
                              </h3>
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                {clientObj?.company || 'Cliente Registrado'}
                              </p>
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                                {clientObj?.phone && <span>📞 {clientObj.phone}</span>}
                                {clientObj?.dni && <span>🆔 {clientObj.dni}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Stats / File Indicators */}
                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center text-[10px]">
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-1.5">
                              <span className="block font-black text-slate-800">{group.designs.length}</span>
                              <span className="text-slate-500 text-[9px] font-semibold">Planos 3D</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-1.5">
                              <span className="block font-black text-slate-800">{docsTotal}</span>
                              <span className="text-slate-500 text-[9px] font-semibold">Contratos</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-1.5">
                              <span className="block font-black text-slate-800">{photosCount}</span>
                              <span className="text-slate-500 text-[9px] font-semibold">Fotos</span>
                            </div>
                          </div>

                          {/* Footer Action */}
                          <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-slate-600 group-hover:text-slate-800">
                            <span className="truncate pr-1 text-slate-600 font-semibold">{clientProjects.length > 0 ? `${clientProjects.length} Obra(s) — ${formatCurrency(totalPresupuesto)}` : 'Sin obras activas'}</span>
                            <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0 font-extrabold text-slate-600">
                              Abrir 📁
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          ) : (
            /* VISTA INTERIOR DE CARPETA DEL CLIENTE SELECCIONADO */
            (() => {
              const groupId = selectedFolderGroupId;
              const clientObj = clients.find(c => c.id === groupId);
              const groupDesigns = portfolioDesigns.filter(d => (groupId !== 'sin_cliente' ? (d.clientId === groupId || d.clientName === clientObj?.name) : !d.clientId));
              const clientName = clientObj?.name || (groupId === 'sin_cliente' ? 'Planos Generales (Sin Cliente)' : 'Cliente de Obra');

              const clientProjects = projects.filter(p => p.client === clientName || (clientObj && p.client === clientObj.name));
              const totalPresupuesto = clientProjects.reduce((s, p) => s + (p.presupuesto || 0), 0);
              const totalCobrado = clientProjects.reduce((s, p) => s + (p.cobros?.reduce((cs, c) => cs + c.amount, 0) || 0), 0);
              const saldoPendiente = totalPresupuesto - totalCobrado;

              const allSavedContracts = safeStorage.getItem<any[]>('innova_client_contracts', []) || [];
              const clientSavedContracts = allSavedContracts.filter(c => 
                c.clientName.toLowerCase().trim() === clientName.toLowerCase().trim() ||
                (clientObj && c.clientName.toLowerCase().trim() === clientObj.name.toLowerCase().trim())
              );
              const uploadedDocs = (clientObj?.files || []).filter(f => f.type === 'contract' || f.type === 'document');
              const currentNote = clientNotesMap[groupId] || '';

              return (
                <div className="space-y-6">
                  {/* Top Navigation Bar inside Client Folder */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedFolderGroupId(null)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Volver a Carpetas</span>
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-5 h-5 text-slate-600" />
                          <h2 className="text-base font-bold text-slate-900">
                            Carpeta Privada: {clientName}
                          </h2>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {clientObj?.company && <span>🏢 {clientObj.company}</span>}
                          {clientObj?.dni && <span>🆔 {clientObj.dni}</span>}
                          {clientObj?.phone && <span>📞 {clientObj.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadClientZip(clientName, clientObj, clientProjects, groupDesigns, currentNote);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="Descargar ZIP completo de esta carpeta"
                    >
                      <FileArchive className="w-4 h-4 text-emerald-100" />
                      <span>Descargar ZIP de esta Carpeta</span>
                    </button>
                  </div>

                  {/* Context Guarantee Banner */}
                  <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>
                      <strong>Entorno Seguro de Archivos:</strong> Estás dentro de la carpeta exclusiva de <strong>{clientName}</strong>. Todos los planos, contratos y fotos subidas en esta vista se asignan de forma automática a este cliente.
                    </span>
                  </div>

                  {/* Resumen Financiero y Obras */}
                  {clientProjects.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{clientProjects.length} Obra(s) Asignada(s): {clientProjects.map(p => p.name).join(', ')}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 font-mono font-bold">
                        <span className="text-slate-700">Total: {formatCurrency(totalPresupuesto)}</span>
                        <span className="text-emerald-700">Cobrado: {formatCurrency(totalCobrado)}</span>
                        <span className="text-amber-700">Saldo: {formatCurrency(saldoPendiente)}</span>
                      </div>
                    </div>
                  )}

                  {/* Grid / Content Blocks inside Folder */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. PLANOS 3D / CAD DE LA CARPETA */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Box className="w-4 h-4 text-slate-600" />
                          <span>Planos 3D y CAD ({groupDesigns.length})</span>
                        </h4>
                        {groupId !== 'sin_cliente' && onNavigateToTechos && (
                          <button
                            onClick={onNavigateToTechos}
                            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Nuevo Plano 3D</span>
                          </button>
                        )}
                      </div>

                      {groupDesigns.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {groupDesigns.map((design) => (
                            <div key={design.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2.5 hover:border-slate-300 transition-all">
                              <div>
                                <div className="font-bold text-xs text-slate-900 truncate">{design.nombre}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  {design.updatedAt ? `Actualizado: ${design.updatedAt}` : `Guardado: ${design.savedAt}`}
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePortfolioDesign(design.id, design.nombre)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                  title="Eliminar plano"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPlanInTechos(design)}
                                  className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-[11px] font-bold rounded-md shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Abrir 3D</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                          Sin planos 3D registrados en esta carpeta.
                        </div>
                      )}
                    </div>

                    {/* 2. CONTRATOS Y DOCUMENTOS */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Contratos y Documentos ({clientSavedContracts.length + uploadedDocs.length})</span>
                        </h4>
                        {groupId !== 'sin_cliente' && (
                          <label className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Subir Documento</span>
                            <input 
                              type="file" 
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*" 
                              className="hidden" 
                              onChange={(e) => handleClientFileUpload(groupId, e, 'contract')} 
                            />
                          </label>
                        )}
                      </div>

                      {(clientSavedContracts.length > 0 || uploadedDocs.length > 0) ? (
                        <div className="space-y-2">
                          {clientSavedContracts.map(c => (
                            <div key={c.id} className="p-2.5 bg-blue-50/50 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-slate-800 truncate">{c.fileName}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Generado</span>
                            </div>
                          ))}
                          {uploadedDocs.map(docItem => (
                            <div key={docItem.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                              <span className="font-medium text-slate-800 truncate">{docItem.name}</span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={docItem.dataUrl}
                                  download={docItem.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Ver</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveClientFile(groupId, docItem.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Eliminar archivo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                          Sin contratos registrados en esta carpeta.
                        </div>
                      )}
                    </div>

                    {/* 3. FOTOS DE OBRA */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-slate-600" />
                          <span>Fotos de Avance / Obra ({(clientObj?.files || []).filter(f => f.type === 'photo').length})</span>
                        </h4>
                        {groupId !== 'sin_cliente' && (
                          <label className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Subir Foto</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleClientFileUpload(groupId, e, 'photo')} 
                            />
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {(clientObj?.files || []).filter(f => f.type === 'photo').map(photo => (
                          <div key={photo.id} className="relative group bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-square flex items-center justify-center">
                            <img 
                              src={photo.dataUrl} 
                              alt={photo.name} 
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setPreviewPhotoUrl(photo.dataUrl)}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveClientFile(groupId, photo.id);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(clientObj?.files || []).filter(f => f.type === 'photo').length === 0 && (
                          <div className="col-span-full py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                            Sin fotos de trabajo subidas a esta carpeta.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. NOTAS U OBSERVACIONES DEL CLIENTE */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-amber-500" />
                        <span>Notas u Observaciones del Cliente</span>
                      </label>
                      <textarea
                        value={currentNote}
                        onChange={(e) => handleSaveClientNote(groupId, e.target.value)}
                        placeholder="Escribe notas de obra, acuerdos de pago o requerimientos especiales de este cliente..."
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-400 transition-all resize-none"
                      />
                      <p className="text-[11px] text-slate-400 italic">
                        * Las notas se guardan automáticamente y se incluirán al descargar la carpeta ZIP.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

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
    </div>
  );
}
