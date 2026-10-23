import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSignature, 
  HardHat, 
  Download, 
  CheckCircle,
  ShieldCheck,
  User,
  Save
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Project, Client, SystemConfig } from '../types';
import defaultAdminLogo from '../assets/images/logo_innova_oficial_1791000137990.jpg';
import { safeStorage } from '../lib/storageManager';

interface ContratosYEPPViewProps {
  projects: Project[];
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  setClients?: React.Dispatch<React.SetStateAction<Client[]>>;
  currentSettings: SystemConfig;
  setSettings?: React.Dispatch<React.SetStateAction<SystemConfig[]>>;
  initialSubTab?: 'contratos' | 'epp';
  isAdmin?: boolean;
}

// Helper to compress and read local images (0% Firebase Storage dependency)
const compressAndReadImage = (file: File, maxWidth = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ==========================================
// 1. CONTRATOS SUB-COMPONENT
// ==========================================
function ContratosSubView({ 
  projects, 
  setProjects,
  clients, 
  setClients,
  currentSettings,
  setSettings,
  isAdmin = false
}: { 
  projects: Project[];
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  setClients?: React.Dispatch<React.SetStateAction<Client[]>>;
  currentSettings: SystemConfig;
  setSettings?: React.Dispatch<React.SetStateAction<SystemConfig[]>>;
  isAdmin?: boolean;
}) {
  const [selectedProject, setSelectedProject] = useState('');
  
  // Contratista Info - Aislado estrictamente por usuario
  const [contratistaNombre, setContratistaNombre] = useState(
    currentSettings?.appName || (isAdmin ? 'Innova Contratistas' : 'Mi Empresa')
  );
  const [contratistaRuc, setContratistaRuc] = useState(
    currentSettings?.contratistaDni || (isAdmin ? '10728381642' : '')
  );
  const [contratistaTel, setContratistaTel] = useState(
    currentSettings?.contratistaPhone || (isAdmin ? '966000500' : '')
  );
  const [contratistaDir, setContratistaDir] = useState(
    currentSettings?.contratistaDir || (isAdmin ? 'URB.PPAO MZ.I LT.10' : '')
  );

  // Cliente Info
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDni, setClienteDni] = useState('');
  const [clienteDireccion, setClienteDireccion] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');

  // Objeto & Servicio
  const [proyectoNombre, setProyectoNombre] = useState('Estructura Metálica');
  const [tipoServicio, setTipoServicio] = useState('Estructura Metálica');

  // Presupuesto & Pago
  const [presupuestoTotal, setPresupuestoTotal] = useState<number>(0);
  const [adelantoInput, setAdelantoInput] = useState<number>(0);

  // Especificaciones & Metrado
  const [detallesEspeciales, setDetallesEspeciales] = useState<string>(
    '• Ejecución de estructura metálica según especificaciones y normas técnicas vigentes.\n• Acabado con base anticorrosiva y pintura de protección.\n• Instalación y montaje de cobertura.'
  );

  // Materiales a Emplear
  const [materialesTexto, setMaterialesTexto] = useState<string>('');

  // Fecha del contrato
  const [fechaContrato, setFechaContrato] = useState<string>(new Date().toLocaleDateString('es-PE'));

  // Firmas e imágenes - El usuario regular tiene su propia marca o lienzo limpio sin heredar membrete de admin
  const [logoBase64, setLogoBase64] = useState<string | null>(
    currentSettings?.logoBase64 || (isAdmin ? defaultAdminLogo : null)
  );
  const [letterheadBase64, setLetterheadBase64] = useState<string | null>(
    currentSettings?.officialLetterheadBase64 || null
  );
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);

  // Bank accounts & wallets sync
  const [bancoNombre, setBancoNombre] = useState<string>(currentSettings?.bancoNombre || 'BCP');
  const [cuentaTitular, setCuentaTitular] = useState<string>(currentSettings?.cuentaTitular || '');
  const [pagoCtaBcp, setPagoCtaBcp] = useState<string>(currentSettings?.pagoCtaBcp || '');
  const [pagoCciBcp, setPagoCciBcp] = useState<string>(currentSettings?.pagoCciBcp || '');
  const [pagoCtaCorriente, setPagoCtaCorriente] = useState<string>(currentSettings?.pagoCtaCorriente || '');
  const [pagoDetracciones, setPagoDetracciones] = useState<string>(currentSettings?.pagoDetracciones || '');
  const [pagoCciDetracciones, setPagoCciDetracciones] = useState<string>(currentSettings?.pagoCciDetracciones || '');
  const [pagoYape, setPagoYape] = useState<string>(currentSettings?.pagoYape || '');

  // Cloud feedback notice
  const [cloudNotice, setCloudNotice] = useState<string | null>(null);

  const contratoRef = useRef<HTMLDivElement>(null);

  // Sync settings when loaded
  useEffect(() => {
    if (currentSettings?.appName) setContratistaNombre(currentSettings.appName);
    if (currentSettings?.contratistaDni !== undefined) setContratistaRuc(currentSettings.contratistaDni);
    if (currentSettings?.contratistaDir !== undefined) setContratistaDir(currentSettings.contratistaDir);
    if (currentSettings?.contratistaPhone !== undefined) setContratistaTel(currentSettings.contratistaPhone);
    if (currentSettings?.bancoNombre !== undefined) setBancoNombre(currentSettings.bancoNombre);
    if (currentSettings?.cuentaTitular !== undefined) setCuentaTitular(currentSettings.cuentaTitular);
    if (currentSettings?.pagoCtaBcp !== undefined) setPagoCtaBcp(currentSettings.pagoCtaBcp);
    if (currentSettings?.pagoCciBcp !== undefined) setPagoCciBcp(currentSettings.pagoCciBcp);
    if (currentSettings?.pagoCtaCorriente !== undefined) setPagoCtaCorriente(currentSettings.pagoCtaCorriente);
    if (currentSettings?.pagoDetracciones !== undefined) setPagoDetracciones(currentSettings.pagoDetracciones);
    if (currentSettings?.pagoCciDetracciones !== undefined) setPagoCciDetracciones(currentSettings.pagoCciDetracciones);
    if (currentSettings?.pagoYape !== undefined) setPagoYape(currentSettings.pagoYape);
    setLogoBase64(currentSettings?.logoBase64 || (isAdmin ? defaultAdminLogo : null));
    setLetterheadBase64(currentSettings?.officialLetterheadBase64 || null);
  }, [currentSettings, isAdmin]);

  // Auto populate on selecting a project
  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    const p = projects.find(item => item.id === projectId);
    if (p) {
      setProyectoNombre(p.name);
      setPresupuestoTotal(p.presupuesto || 0);

      const totalCobrado = p.cobros?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;
      setAdelantoInput(totalCobrado > 0 ? totalCobrado : (p.presupuesto || 0));

      const c = clients.find(client => client.name === p.client);
      if (c) {
        setClienteNombre(c.name);
        if (c.dni) setClienteDni(c.dni);
        if (c.address) setClienteDireccion(c.address);
        if (c.company) setClienteEmpresa(c.company);
      } else {
        setClienteNombre(p.client || 'Cliente del Proyecto');
      }

      if (p.detallesContrato && p.detallesContrato.trim()) {
        setDetallesEspeciales(p.detallesContrato);
      }

      if (p.materiales && p.materiales.length > 0) {
        const matList = p.materiales.map(m => `• ${m.name} (${m.quantity} ${m.unit || 'uds'})`).join('\n');
        setMaterialesTexto(matList);
      }
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAndReadImage(file);
      setter(dataUrl);
    } catch (err: any) {
      console.error('Error al cargar imagen local:', err);
    } finally {
      e.target.value = '';
    }
  };

  const saldoPendiente = Math.max(0, presupuestoTotal - adelantoInput);

  // Guardar datos en la nube (Firestore Cloud Database)
  const handleSaveToCloud = () => {
    let savedMsg = '';

    if (selectedProject && setProjects) {
      setProjects(prev => prev.map(p => {
        if (p.id === selectedProject) {
          return {
            ...p,
            name: proyectoNombre.trim() || p.name,
            presupuesto: presupuestoTotal,
            client: clienteNombre.trim() || p.client,
            detallesContrato: detallesEspeciales
          };
        }
        return p;
      }));
      savedMsg += 'Obra';
    }

    if (setClients && clienteNombre.trim()) {
      setClients(prev => {
        const exists = prev.some(c => c.name.toLowerCase() === clienteNombre.trim().toLowerCase());
        if (exists) {
          return prev.map(c => c.name.toLowerCase() === clienteNombre.trim().toLowerCase() ? {
            ...c,
            dni: clienteDni || c.dni,
            address: clienteDireccion || c.address,
            company: clienteEmpresa || c.company
          } : c);
        } else {
          return [...prev, {
            id: 'cli-' + Date.now(),
            name: clienteNombre.trim(),
            dni: clienteDni,
            address: clienteDireccion,
            company: clienteEmpresa
          }];
        }
      });
      if (savedMsg) savedMsg += ', Cliente'; else savedMsg += 'Cliente';
    }

    if (setSettings) {
      setSettings(prev => {
        const cur = prev[0] || { id: 'settings_default', appName: contratistaNombre, currency: 'PEN', theme: 'light', logoBase64: '' };
        return [{
          ...cur,
          appName: contratistaNombre,
          contratistaDni: contratistaRuc,
          contratistaDir: contratistaDir,
          contratistaPhone: contratistaTel,
          logoBase64: logoBase64 || cur.logoBase64,
          bancoNombre,
          cuentaTitular,
          pagoCtaBcp,
          pagoCciBcp,
          pagoCtaCorriente,
          pagoDetracciones,
          pagoCciDetracciones,
          pagoYape
        }];
      });
      if (savedMsg) savedMsg += ' y Configuración'; else savedMsg += 'Configuración';
    }

    setCloudNotice(`✅ Datos del contrato guardados exitosamente en la nube (${savedMsg || 'Sincronizado'})`);
    setTimeout(() => setCloudNotice(null), 3500);
  };

  const handleGeneratePDF = async () => {
    if (!contratoRef.current) return;
    
    const opt = {
      margin: [20, 20, 20, 25] as [number, number, number, number], // Top: 20mm, Left: 25mm, Bottom: 20mm, Right: 20mm (standard [top, left, bottom, right] in html2pdf)
      filename: `Contrato_${(proyectoNombre || 'Obra').replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794 // 210mm @ 96 DPI
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      // 'avoid-all' hacía que TODO el bloque de cláusulas saltara de página,
      // dejando la primera hoja casi vacía. Con 'css'+'legacy' el texto fluye
      // natural y solo se protege el corte de cada cláusula/firma por su clase.
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.clause-block', '.signature-block', '.header-block']
      }
    };
    
    try {
      // Use html2pdf worker chain to dynamically append clean "Página X de Y" page numbers without any redundant text/footer data
      const worker = html2pdf().set(opt).from(contratoRef.current);
      const pdf = await worker.toPdf().get('jspdf');
      
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        
        // Footers inside bottom margin area (Y = 287mm) - Only page numbering without redundant text
        const footerY = 287;
        const rightText = `Página ${i} de ${totalPages}`;
        pdf.text(rightText, 190, footerY, { align: 'right' });
      }
      
      pdf.save(`Contrato_${(proyectoNombre || 'Obra').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.warn('Fallback standard PDF download:', err);
      html2pdf().set(opt).from(contratoRef.current).save();
    }

    // Automatically save contract record to client's Carpeta Privada
    try {
      const existingContracts = safeStorage.getItem<any[]>('innova_client_contracts', []) || [];
      const newContractRecord = {
        id: `contract_${Date.now()}`,
        clientName: clienteNombre || 'Cliente General',
        projectName: proyectoNombre || 'Obra',
        date: new Date().toISOString().split('T')[0],
        fileName: `Contrato_${(proyectoNombre || 'Obra').replace(/\s+/g, '_')}_${(clienteNombre || 'Cliente').replace(/\s+/g, '_')}.pdf`,
        summary: `Contrato oficial de obra - Proyecto: ${proyectoNombre || 'Obra'}`
      };
      safeStorage.setItem('innova_client_contracts', [newContractRecord, ...existingContracts]);
    } catch (e) {
      console.warn('Notice saving contract record for Carpeta Privada:', e);
    }
  };

  const renderHeader = () => {
    // Membrete limpio y uniforme: logo a la izquierda (sin estirar) + datos de
    // la empresa a la derecha. Se usa la imagen de logo si existe, y si solo
    // hay un "letterhead" cargado, se emplea como logo contenido a la izquierda.
    const logoSrc = logoBase64 || letterheadBase64 || '';
    return (
      <div className="header-block flex items-center justify-between border-b-2 border-slate-800 pb-2.5 mb-3 relative z-10 gap-4">
        {/* Logo a la izquierda, contenido y sin deformación */}
        <div className="flex items-center shrink-0">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={contratistaNombre || 'Logo Contratista'}
              className="h-auto max-h-[16mm] w-auto max-w-[55mm] object-contain object-left"
            />
          ) : (
            <div className="text-[11pt] font-black uppercase text-slate-900 leading-tight">
              {contratistaNombre || 'EMPRESA'}
            </div>
          )}
        </div>
        {/* Datos de la empresa alineados a la derecha */}
        <div className="text-right leading-snug min-w-0">
          <h2 className="text-[10pt] font-black text-slate-950 uppercase tracking-tight break-words">
            {contratistaNombre}
          </h2>
          {contratistaRuc && <p className="text-[8pt] font-semibold text-slate-600 mt-0.5">RUC/DNI: {contratistaRuc}</p>}
          {contratistaTel && <p className="text-[8pt] font-semibold text-slate-600">Tel: {contratistaTel}</p>}
          {contratistaDir && <p className="text-[8pt] font-medium text-slate-500 break-words">{contratistaDir}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT INPUT FORM SIDEBAR */}
      <div className="lg:col-span-1 space-y-4 bg-white p-5 md:p-6 rounded-3xl border border-slate-200/80 shadow-3xs h-fit text-xs">
        <h2 className="text-base font-black text-slate-800 mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
          <FileSignature className="w-5 h-5 text-slate-700" />
          Configurador de Contrato
        </h2>

        {/* PROYECTO SELECTOR */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Cargar Datos de Proyecto</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-slate-500 cursor-pointer"
            value={selectedProject}
            onChange={e => handleSelectProject(e.target.value)}
          >
            <option value="">Seleccionar un proyecto existente...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name} - {p.client}</option>)}
          </select>
        </div>

        {/* TÍTULO Y SERVICIO */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nombre del Proyecto</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800" value={proyectoNombre} onChange={e => setProyectoNombre(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Especialidad / Servicio</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800" value={tipoServicio} onChange={e => setTipoServicio(e.target.value)} />
          </div>
        </div>

        {/* DATOS CONTRATISTA */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-600" /> Datos del Contratista
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-400">Razón Social Contratista</label>
              <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800" value={contratistaNombre} onChange={e => setContratistaNombre(e.target.value)} />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400">RUC / DNI Contratista</label>
              <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800" value={contratistaRuc} onChange={e => setContratistaRuc(e.target.value)} />
            </div>
          </div>
        </div>

        {/* DATOS CLIENTE */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-600" /> Datos del Cliente
          </span>
          <div>
            <label className="block text-[9px] font-bold text-slate-400">Nombre / Razón Social Cliente</label>
            <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-400">DNI / RUC Cliente</label>
              <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800" value={clienteDni} onChange={e => setClienteDni(e.target.value)} />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400">Empresa / Representación</label>
              <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800" value={clienteEmpresa} onChange={e => setClienteEmpresa(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400">Dirección Domiciliaria Cliente</label>
            <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800" value={clienteDireccion} onChange={e => setClienteDireccion(e.target.value)} />
          </div>
        </div>

        {/* MONTO Y ADELANTO */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Presupuesto Total (S/)</label>
            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800" value={presupuestoTotal} onChange={e => setPresupuestoTotal(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Adelanto Acordado (S/)</label>
            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-800" value={adelantoInput} onChange={e => setAdelantoInput(Number(e.target.value))} />
          </div>
        </div>

        {/* ESPECIFICACIONES TÉCNICAS Y METRADO */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Especificaciones Técnicas & Cláusulas</label>
            <span className="text-[10px] text-slate-500 font-bold">Diferenciales Rápidos</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => setDetallesEspeciales(prev => prev + '\n\n• GARANTÍA: 5 años contra filtraciones y defectos estructurales.')}
              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + Garantía 5 Años
            </button>
            <button
              type="button"
              onClick={() => setDetallesEspeciales(prev => prev + '\n\n• PLAZO DE ENTREGA: 15 días hábiles a partir del abono del adelanto.')}
              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + Plazo 15 Días
            </button>
            <button
              type="button"
              onClick={() => setDetallesEspeciales(prev => prev + '\n\n• FORMA DE PAGO: 50% al inicio y 50% al finalizar la instalación.')}
              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + Pago 50/50
            </button>
            <button
              type="button"
              onClick={() => setDetallesEspeciales(prev => prev + '\n\n• ACABADO: Aplicación de base anticorrosiva epóxica + 2 manos de pintura gloss.')}
              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + Acabado Epóxico
            </button>
            <button
              type="button"
              onClick={() => setDetallesEspeciales(prev => prev + '\n\n• LIMPIEZA: Retiro total de residuos metálicos y desmonte de obra.')}
              className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              + Limpieza Final
            </button>
          </div>
          <textarea 
            rows={5} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono leading-relaxed resize-none text-slate-800"
            value={detallesEspeciales}
            onChange={e => setDetallesEspeciales(e.target.value)}
          />
        </div>

        {/* MATERIALES A EMPLEAR */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Materiales a Emplear (Lista)</label>
          <textarea 
            rows={5} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed resize-none text-slate-800"
            value={materialesTexto}
            onChange={e => setMaterialesTexto(e.target.value)}
          />
        </div>

        {/* FECHA CONTRATO */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Fecha de Emisión / Firma</label>
          <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800" value={fechaContrato} onChange={e => setFechaContrato(e.target.value)} />
        </div>

        {/* LOGO Y FIRMA DIGITAL */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="block text-[10px] font-black text-slate-400 uppercase">
            Imágenes & Firma Digital
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Logo Contratista</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setLogoBase64)} className="w-full text-[10px] text-slate-500" />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Firma Digital (PNG)</label>
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setFirmaBase64)} className="w-full text-[10px] text-slate-500" />
            </div>
          </div>
        </div>

        {cloudNotice && (
          <div className="p-3 bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold animate-fadeIn">
            {cloudNotice}
          </div>
        )}

        {/* ACTION BUTTONS (ELEGANT SOBRE STYLING) */}
        <div className="space-y-2 pt-2">
          <button 
            type="button"
            onClick={handleSaveToCloud}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer border border-slate-700"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios en la Nube
          </button>

          <button 
            type="button"
            onClick={handleGeneratePDF}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Contrato PDF Completo
          </button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER (Lienzo Profesional A4 con proporciones reales 210 x 297 mm) */}
      <div className="lg:col-span-2 bg-slate-800/20 p-2 sm:p-6 rounded-3xl border border-slate-300 shadow-inner overflow-x-auto flex flex-col items-center">
        {/* Banner de Especificación Técnica A4 */}
        <div className="w-full max-w-[210mm] mb-3 flex flex-wrap items-center justify-between text-xs text-slate-300 px-1 gap-2">
          <span className="font-bold tracking-wide uppercase text-[10px] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Formato A4 Vertical (210 × 297 mm)
          </span>
          <span className="text-[10px] font-medium text-slate-300">
            Márgenes Oficiales: Sup 20mm · Inf 20mm · Izq 25mm · Der 20mm
          </span>
        </div>

        {/* Inyección de estilos de impresión A4 y protección de corte de cláusulas */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #contract-a4-print-wrapper, #contract-a4-print-wrapper * {
              visibility: visible !important;
            }
            #contract-a4-print-wrapper {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              margin: 0 !important;
              padding: 20mm 20mm 20mm 25mm !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }
            @page {
              size: A4 portrait;
              margin: 0;
            }
          }

          .clause-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .clause-block h2 {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .signature-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .header-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Evita que cualquier contenido (RUC, direcciones o textos largos
             sin espacios) se salga del margen derecho de la hoja. */
          #contract-a4-content,
          #contract-a4-content * {
            box-sizing: border-box;
            max-width: 100%;
            overflow-wrap: break-word;
            word-break: break-word;
          }
          #contract-a4-content img {
            max-width: 100%;
            height: auto;
          }

          /* Diseño más práctico y escaneable: cada cláusula con un acento
             lateral ámbar y separación clara (sin quitar ninguna cláusula). */
          #contract-a4-content .clause-block h2 {
            border-left: 3px solid #d97706;
            padding-left: 8px;
            margin-bottom: 4px;
          }
          #contract-a4-content .clause-block {
            padding: 2px 0 2px 2px;
          }
        `}</style>

        <div className="w-full flex justify-center overflow-x-auto py-2">
          {/* Contenedor A4 Profesional Hoja de Papel */}
          <div
            id="contract-a4-print-wrapper"
            className="a4-page bg-white shadow-2xl relative text-slate-900 mx-auto border border-slate-200 shrink-0 min-w-[210mm]"
            style={{
              width: '210mm',
              minHeight: '297mm',
              paddingTop: '20mm',
              paddingBottom: '20mm',
              paddingLeft: '25mm',
              paddingRight: '20mm',
              boxSizing: 'border-box',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              fontSize: '10pt',
              lineHeight: '1.5',
              color: '#0f172a'
            }}
          >
            {/* Bloque interno imprimible (Ref para html2pdf) */}
            <div 
              id="contract-a4-content"
              ref={contratoRef}
              className="relative z-10 flex flex-col justify-between h-full"
            >
              <div className="space-y-4">
                {/* Membrete Oficial o Cabecera */}
                {renderHeader()}

                {/* Título del Documento */}
                <h1 className="text-center font-black text-[12pt] uppercase tracking-wider underline my-3 text-slate-950">
                  CONTRATO DE SERVICIOS - {tipoServicio.toUpperCase()}
                </h1>

                {/* Introducción Legal */}
                <p className="text-justify leading-relaxed font-sans text-[10pt] text-slate-900">
                  Conste por el presente documento, el <strong>CONTRATO DE PRESTACIÓN DE SERVICIOS</strong> que celebran de una parte <strong>{contratistaNombre}</strong> con RUC/DNI {contratistaRuc}, domiciliado en {contratistaDir}, en adelante <strong>"EL CONTRATISTA"</strong>; y de la otra parte <strong>{clienteNombre}</strong> con DNI/RUC {clienteDni}, domiciliado en {clienteDireccion}, en representación de la empresa {clienteEmpresa}, en adelante <strong>"EL CLIENTE"</strong>, en los términos y condiciones siguientes:
                </p>

                {/* Cláusulas con protección de corte de página */}
                <div className="space-y-3.5 text-justify font-sans text-[10pt] leading-relaxed text-slate-900">
                  
                  {/* PRIMERO */}
                  <div className="clause-block">
                    <h2 className="font-bold text-slate-950 text-[10.5pt] mb-0.5 uppercase tracking-wide">PRIMERO: OBJETO DEL CONTRATO</h2>
                    <p>
                      <strong>EL CLIENTE</strong> contrata a <strong>EL CONTRATISTA</strong> para la ejecución de la obra/proyecto denominado <strong>"{proyectoNombre}"</strong> especializado en <strong>{tipoServicio}</strong>.
                    </p>
                  </div>

                  {/* SEGUNDO */}
                  <div className="clause-block">
                    <h2 className="font-bold text-slate-950 text-[10.5pt] mb-0.5 uppercase tracking-wide">SEGUNDO: PRESUPUESTO Y FORMA DE PAGO</h2>
                    <p className="mb-0.5">
                      El presupuesto total acordado para el proyecto es de <strong>S/ {presupuestoTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>.
                    </p>
                    <ul className="list-none pl-3 space-y-0.5">
                      <li>• <strong>Adelanto Acordado:</strong> S/ {adelantoInput.toLocaleString('es-PE', { minimumFractionDigits: 2 })} a la firma del contrato y/o inicio de obra.</li>
                      <li>• <strong>Saldo Pendiente:</strong> S/ {saldoPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}, que será cancelado según el avance de obra o a la entrega final y conformidad del cliente.</li>
                    </ul>
                    {(pagoCtaBcp || pagoYape || pagoCtaCorriente || pagoDetracciones) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-[9.5pt] space-y-0.5">
                        <p className="font-semibold text-slate-900">Cuentas Autorizadas para Depósito / Transferencia ({bancoNombre || 'BCP'}):</p>
                        {cuentaTitular && <p>• <strong>Titular:</strong> {cuentaTitular}</p>}
                        {pagoCtaBcp && <p>• <strong>Cta. BCP (Soles):</strong> {pagoCtaBcp}</p>}
                        {pagoCciBcp && <p>• <strong>CCI BCP:</strong> {pagoCciBcp}</p>}
                        {pagoCtaCorriente && <p>• <strong>Cta. Corriente / Otro Banco:</strong> {pagoCtaCorriente}</p>}
                        {pagoDetracciones && <p>• <strong>Cta. Detracciones (Banco de la Nación):</strong> {pagoDetracciones} {pagoCciDetracciones ? `(CCI: ${pagoCciDetracciones})` : ''}</p>}
                        {pagoYape && <p>• <strong>Yape / Plin:</strong> {pagoYape}</p>}
                      </div>
                    )}
                  </div>

                  {/* TERCERO */}
                  <div className="clause-block">
                    <h2 className="font-bold text-slate-950 text-[10.5pt] mb-0.5 uppercase tracking-wide">TERCERO: ESPECIFICACIONES TÉCNICAS Y METRADO</h2>
                    <div className="whitespace-pre-line bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-[9.5pt] leading-relaxed font-sans text-slate-900 my-1 break-words">
                      {detallesEspeciales}
                    </div>
                  </div>

                  {/* CUARTO */}
                  {materialesTexto && (
                    <div className="clause-block">
                      <h2 className="font-bold text-slate-950 text-[10.5pt] mb-0.5 uppercase tracking-wide">CUARTO: MATERIALES A EMPLEAR</h2>
                      <div className="whitespace-pre-line bg-slate-50/80 p-3 rounded-lg border border-slate-200 text-[9.5pt] leading-relaxed font-sans text-slate-900 my-1 break-words">
                        {materialesTexto}
                      </div>
                    </div>
                  )}

                  {/* QUINTO */}
                  <div className="clause-block">
                    <h2 className="font-bold text-slate-950 text-[10.5pt] mb-0.5 uppercase tracking-wide">QUINTO: CONDICIONES EXTERNAS Y AJUSTES DE PRESUPUESTO</h2>
                    <p>
                      Queda expresamente establecido que el presupuesto total y los plazos de ejecución del proyecto están sujetos a modificaciones según las características finales del perímetro, área de trabajo y las condiciones climáticas que se presenten durante la obra. Cualquier gasto o ajuste adicional derivado de estos factores externos será reevaluado a favor de <strong>EL CONTRATISTA</strong>.
                    </p>
                  </div>

                  {/* SEXTO */}
                  <div className="clause-block">
                    <h2 className="font-bold text-slate-950 text-[10.5pt] mb-0.5 uppercase tracking-wide">SEXTO: CANCELACIÓN O RESOLUCIÓN CONTRACTUAL POR ALCANCE O VARIACIÓN DE COSTOS</h2>
                    <p>
                      Se establece expresamente que <strong>EL CONTRATISTA</strong> se reserva la facultad y el derecho de resolver o cancelar unilateralmente el presente contrato en cualquier momento, sin penalidad ni responsabilidad alguna, en caso de que los costos operativos, especificaciones técnicas no previstas, imprevistos técnicos o variaciones en la zona de trabajo superen el alcance del presupuesto acordado o impidan la viabilidad económica del proyecto. Lo estipulado se ampara legalmente en el <strong>Artículo 1769º</strong> y el <strong>Artículo 1777º</strong> del <strong>Código Civil Peruano (Decreto Legislativo Nº 295)</strong>.
                    </p>
                  </div>

                  {/* SÉPTIMO */}
                  <div className="clause-block">
                    <h2 className="font-bold text-slate-950 text-[10.5pt] mb-0.5 uppercase tracking-wide">SÉPTIMO: CONFORMIDAD</h2>
                    <p>
                      Ambas partes declaran su conformidad con los términos del presente documento, firmándolo en señal de aceptación en la fecha <strong>{fechaContrato}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cierre y Firmas */}
              <div className="signature-block pt-8 mt-6">
                <div className="grid grid-cols-2 gap-10 text-center font-sans">
                  {/* Firma Contratista */}
                  <div className="flex flex-col items-center justify-end min-h-[90px]">
                    <div className="h-16 flex items-end justify-center mb-1">
                      {firmaBase64 && (
                        <img src={firmaBase64} alt="Firma Contratista" className="max-h-16 max-w-[140px] object-contain" />
                      )}
                    </div>
                    <div className="w-52 max-w-[85%] border-t border-slate-900 pt-1.5 text-[9.5pt]">
                      <strong className="block text-slate-950 font-bold leading-snug">{contratistaNombre}</strong>
                      <span className="block text-slate-700 text-[8.5pt]">RUC/DNI: {contratistaRuc}</span>
                      <span className="block text-slate-950 text-[8.5pt] uppercase font-black tracking-wider mt-0.5">EL CONTRATISTA</span>
                    </div>
                  </div>

                  {/* Firma Cliente */}
                  <div className="flex flex-col items-center justify-end min-h-[90px]">
                    <div className="h-16 flex items-end justify-center mb-1">
                      {/* Espacio para firma cliente */}
                    </div>
                    <div className="w-52 max-w-[85%] border-t border-slate-900 pt-1.5 text-[9.5pt]">
                      <strong className="block text-slate-950 font-bold leading-snug">{clienteNombre || 'Nombre del Cliente'}</strong>
                      <span className="block text-slate-700 text-[8.5pt]">DNI/RUC: {clienteDni || '---'}</span>
                      <span className="block text-slate-950 text-[8.5pt] uppercase font-black tracking-wider mt-0.5">EL CLIENTE</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. EPP SUB-COMPONENT (MOBILE RESPONSIVE, SOBER DESIGN)
// ==========================================
function EPPSubView({ 
  projects,
  setProjects
}: { 
  projects: Project[];
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
}) {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const eppRef = useRef<HTMLDivElement>(null);
  const [eppDateText, setEppDateText] = useState(new Date().toLocaleDateString('es-PE'));
  const [eppObs, setEppObs] = useState('Declaro haber recibido capacitación sobre el uso correcto de los equipos de protección personal y me comprometo a reportar cualquier deterioro para su reposición inmediata.');
  const [cloudEppNotice, setCloudEppNotice] = useState<string | null>(null);

  const [eppList, setEppList] = useState([
    { cant: '1', desc: 'Casco de seguridad', estado: 'Nuevo' },
    { cant: '1', desc: 'Lentes de seguridad (Claros / Oscuros)', estado: 'Nuevo' },
    { cant: '1', desc: 'Zapatos / Botas de seguridad con punta de acero', estado: 'Nuevo' },
    { cant: '1', desc: 'Guantes de cuero / badana', estado: 'Nuevo' },
    { cant: '1', desc: 'Tapones auditivos', estado: 'Nuevo' },
    { cant: '1', desc: 'Respirador con filtros / Mascarilla', estado: 'Nuevo' },
    { cant: '1', desc: 'Arnés de seguridad con doble línea de vida', estado: 'Nuevo' },
    { cant: '1', desc: 'Uniforme de trabajo (Pantalón y Camisa/Polo)', estado: 'Nuevo' },
    { cant: '1', desc: 'Chaleco reflectivo', estado: 'Nuevo' }
  ]);

  const project = projects.find(p => p.id === selectedProject);
  const selectedWorker = project?.personal?.find((w: any) => w.id === selectedWorkerId);

  const handleSaveEPPToCloud = () => {
    if (!selectedProject || !selectedWorkerId || !setProjects) return;
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProject) {
        return {
          ...p,
          personal: (p.personal || []).map((w: any) => w.id === selectedWorkerId ? {
            ...w,
            eppFechaEntrega: eppDateText,
            eppObservacion: eppObs
          } : w)
        };
      }
      return p;
    }));
    setCloudEppNotice(`✅ Registro de EPP guardado en la nube para ${selectedWorker?.name || 'el colaborador'}`);
    setTimeout(() => setCloudEppNotice(null), 3500);
  };

  const handlePrintEPP = () => {
    if (eppRef.current) {
      const workerNameClean = selectedWorker?.name ? selectedWorker.name.replace(/ /g, '_') : 'Trabajador';
      const projectNameClean = project?.name ? project.name.replace(/ /g, '_') : 'Proyecto';
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `EPP_${workerNameClean}_${projectNameClean}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, scrollX: 0, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        // Sin 'avoid-all' para que el contenido fluya y no salte de página de
        // golpe; solo se evita partir cada fila de la tabla y el bloque de firma.
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.epp-signature', '.epp-no-break'] }
      };
      html2pdf().set(opt).from(eppRef.current).save();
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
      {/* SELECTION COLUMN */}
      <div className="lg:col-span-1 flex flex-col space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-3xs">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider">Seleccionar Proyecto</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-slate-500 transition-colors cursor-pointer"
            value={selectedProject}
            onChange={e => { setSelectedProject(e.target.value); setSelectedWorkerId(null); }}
          >
            <option value="">Seleccione un proyecto...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        
        {project && (
          <div className="bg-white border border-slate-200/80 shadow-3xs rounded-3xl overflow-hidden">
            <div className="bg-slate-50 p-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs">Personal del Proyecto</h3>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full font-bold text-[10px]">
                {project.personal?.length || 0}
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {project.personal?.map((p: any) => (
                <button 
                  key={p.id} 
                  onClick={() => setSelectedWorkerId(p.id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-center justify-between cursor-pointer ${
                    selectedWorkerId === p.id 
                      ? 'bg-slate-100/90 border-l-4 border-slate-900 font-bold text-slate-900' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-800 text-xs">{p.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">{p.role}</div>
                  </div>
                  {selectedWorkerId === p.id && <CheckCircle className="w-4 h-4 text-slate-800 shrink-0" />}
                </button>
              ))}
              {(!project.personal || project.personal.length === 0) && (
                <div className="p-4 text-center text-slate-400 text-xs font-medium">No hay personal registrado en este proyecto.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PREVIEW CONTAINER */}
      <div className="lg:col-span-3 flex flex-col bg-white border border-slate-200/80 shadow-3xs rounded-3xl overflow-hidden min-w-0">
        {selectedWorker ? (
          <>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center bg-white shrink-0 gap-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-slate-700" /> Previsualización EPP - {selectedWorker.name}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSaveEPPToCloud} 
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs border border-slate-700"
                >
                  <Save className="w-4 h-4" /> Guardar en Nube
                </button>
                <button 
                  onClick={handlePrintEPP} 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" /> Descargar PDF
                </button>
              </div>
            </div>
            
            {cloudEppNotice && (
              <div className="p-3 bg-slate-100 border-b border-slate-200 text-slate-800 text-xs font-bold">
                {cloudEppNotice}
              </div>
            )}

            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 shrink-0 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Fecha a Imprimir</label>
                <input 
                  type="text" 
                  value={eppDateText} 
                  onChange={e => setEppDateText(e.target.value)} 
                  className="w-full md:w-36 bg-white border border-slate-300 rounded-xl px-3 py-2 outline-none font-bold text-slate-800"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Cláusula Adicional / Capacitación</label>
                <textarea 
                  value={eppObs} 
                  onChange={e => setEppObs(e.target.value)} 
                  rows={2} 
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 outline-none text-xs leading-relaxed text-slate-800"
                />
              </div>
            </div>
            
            <div className="p-3 sm:p-6 overflow-x-auto bg-slate-200 flex-1">
              <div className="min-w-[210mm] flex justify-center">
                <style>{`
                  #epp-a4-content, #epp-a4-content * {
                    box-sizing: border-box;
                    max-width: 100%;
                    overflow-wrap: break-word;
                    word-break: break-word;
                  }
                  #epp-a4-content table { table-layout: fixed; width: 100%; }
                  #epp-a4-content td, #epp-a4-content th { overflow-wrap: break-word; }
                  #epp-a4-content img { max-width: 100%; height: auto; }
                  #epp-a4-content tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                `}</style>
                <div
                  id="epp-a4-content"
                  ref={eppRef}
                  className="bg-white p-8 sm:p-12 shadow-2xl shrink-0 text-xs"
                  style={{ width: '210mm', minHeight: '297mm', color: '#000', fontFamily: 'serif' }}
                >
                  <h2 className="text-center font-bold text-lg mb-6 uppercase underline decoration-2 underline-offset-4">
                    CONSTANCIA DE ENTREGA DE EQUIPOS DE PROTECCIÓN PERSONAL (EPP)
                  </h2>
                  <div className="mb-6 grid grid-cols-2 gap-3 text-xs leading-relaxed">
                    <div><strong>Nombres y Apellidos:</strong> {selectedWorker.name}</div>
                    <div><strong>DNI:</strong> {selectedWorker.dni || '_________________'}</div>
                    <div><strong>Cargo / Especialidad:</strong> {selectedWorker.role}</div>
                    <div><strong>Fecha de Entrega:</strong> {eppDateText}</div>
                    <div className="col-span-2"><strong>Proyecto:</strong> {project?.name}</div>
                  </div>
                  <p className="text-justify mb-4 leading-relaxed">
                    Por el presente documento, el trabajador arriba mencionado, deja constancia de haber recibido de la empresa/contratista los Equipos de Protección Personal (EPP) adecuados para el desempeño seguro de sus labores, comprometiéndose a su uso obligatorio, cuidado y mantenimiento durante la jornada de trabajo. Adicionalmente: {eppObs}
                  </p>
                  <table className="w-full border-collapse border border-black text-xs mb-6">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-2 text-left w-12">Cant.</th>
                        <th className="border border-black p-2 text-left">Descripción del Equipo de Protección Personal</th>
                        <th className="border border-black p-2 text-center w-24">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eppList.map((item, idx) => (
                        <tr key={idx}>
                          <td className="border border-black p-0">
                            <input className="w-full bg-transparent outline-none text-center p-1.5" value={item.cant} onChange={e => { const newList = [...eppList]; newList[idx].cant = e.target.value; setEppList(newList); }} />
                          </td>
                          <td className="border border-black p-0">
                            <input className="w-full bg-transparent outline-none px-2 py-1.5" value={item.desc} onChange={e => { const newList = [...eppList]; newList[idx].desc = e.target.value; setEppList(newList); }} />
                          </td>
                          <td className="border border-black p-0">
                            <input className="w-full bg-transparent outline-none text-center p-1.5" value={item.estado} onChange={e => { const newList = [...eppList]; newList[idx].estado = e.target.value; setEppList(newList); }} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="epp-signature mt-20 pt-10 grid grid-cols-2 gap-12 text-center">
                    <div>
                      <div className="border-t border-black pt-2 font-bold">{selectedWorker.name}</div>
                      <div className="text-[10px] text-slate-600">DNI: {selectedWorker.dni || '_________________'}</div>
                      <div className="text-[10px] text-slate-600 font-sans">Firma / Huella del Trabajador</div>
                    </div>
                    <div>
                      <div className="border-t border-black pt-2 font-bold">INNOVA CONTRATISTAS</div>
                      <div className="text-[10px] text-slate-600">Área de SST & Prevención</div>
                      <div className="text-[10px] text-slate-600 font-sans">Entregado Por</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <HardHat className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <h3 className="font-bold text-slate-700 text-sm">Selecciona un Proyecto y Trabajador</h3>
            <p className="text-xs mt-1">Elige un colaborador en la columna izquierda para estructurar e imprimir su constancia de EPP.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN UNIFIED MODULE VIEW
// ==========================================
export default function ContratosYEPPView({
  projects,
  setProjects,
  clients,
  setClients,
  currentSettings,
  setSettings,
  initialSubTab = 'contratos',
  isAdmin = false
}: ContratosYEPPViewProps) {
  const [activeTab, setActiveTab] = useState<'contratos' | 'epp'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* UNIFIED HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-slate-900 text-amber-400 rounded-2xl border border-slate-800">
              <FileSignature className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Gestión Legal & Seguridad EPP
            </h1>
          </div>
          <p className="text-slate-500 text-xs font-medium pl-1">
            Módulo unificado para la generación de contratos de obra y constancias oficiales de entrega de EPP.
          </p>
        </div>

        {/* UNIFIED TABS SWITCHER (SOBER ELEGANT STYLING) */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('contratos')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'contratos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSignature className={`w-4 h-4 ${activeTab === 'contratos' ? 'text-white' : 'text-slate-500'}`} />
            <span>Generador de Contratos</span>
          </button>

          <button
            onClick={() => setActiveTab('epp')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'epp'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardHat className={`w-4 h-4 ${activeTab === 'epp' ? 'text-white' : 'text-slate-500'}`} />
            <span>Documentos EPP</span>
          </button>
        </div>
      </div>

      {/* ACTIVE SUB-TAB VIEW */}
      {activeTab === 'contratos' ? (
        <ContratosSubView 
          projects={projects} 
          setProjects={setProjects}
          clients={clients} 
          setClients={setClients}
          currentSettings={currentSettings} 
          setSettings={setSettings}
          isAdmin={isAdmin}
        />
      ) : (
        <EPPSubView projects={projects} setProjects={setProjects} />
      )}
    </div>
  );
}
