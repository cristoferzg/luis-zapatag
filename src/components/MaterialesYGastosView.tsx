import { itemsCatalogo, precio, fijarPrecio, useCatalogo } from '../lib/catalogoPrecios';
import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  TrendingDown,
  Edit2,
  Trash2,
  Plus,
  FileText,
  CheckCircle2,
  ArrowDownToLine,
  Receipt,
  Camera,
  Loader2,
  ScanLine
} from 'lucide-react';
import { Project, Material, FinanceRecord } from '../types';
import { scanReceipt } from '../lib/receiptScan';
import { checkAIAccess, consumeAIUse } from '../lib/aiAccess';
import PlanesIAModal from './PlanesIAModal';

interface MaterialesYGastosViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  finances: FinanceRecord[];
  setFinances: React.Dispatch<React.SetStateAction<FinanceRecord[]>>;
  initialSubTab?: 'materials' | 'gastos';
  initialProjectId?: string;
}

export default function MaterialesYGastosView({
  projects,
  setProjects,
  finances,
  setFinances,
  initialSubTab = 'materials',
  initialProjectId
}: MaterialesYGastosViewProps) {
  const [activeTab, setActiveTab] = useState<'materials' | 'gastos'>(initialSubTab);
  useCatalogo();

  // Sync activeTab whenever navigation changes (e.g. from sidebar or dashboard)
  useEffect(() => {
    setActiveTab(initialSubTab);
  }, [initialSubTab]);

  // Material state & calculator state
  const [selectedProject, setSelectedProject] = useState<string>(
    initialProjectId || (projects.length > 0 ? projects[0].id : '')
  );

  useEffect(() => {
    if (initialProjectId && projects.some(p => String(p.id) === String(initialProjectId))) {
      setSelectedProject(initialProjectId);
    }
  }, [initialProjectId, projects]);

  const [activeMaterialTab, setActiveMaterialTab] = useState<'lista' | 'techo'>('lista');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Auto-sync project selection if projects list updates
  useEffect(() => {
    if (projects.length > 0) {
      const exists = projects.some(p => String(p.id) === String(selectedProject) || p.name?.toLowerCase().trim() === selectedProject.toLowerCase().trim());
      if (!selectedProject || !exists) {
        setSelectedProject(projects[0].id);
      }
    }
  }, [projects, selectedProject]);

  // Calculator Techos
  const [calcLargo, setCalcLargo] = useState('');
  const [calcAncho, setCalcAncho] = useState('');
  const [calcSeparacion, setCalcSeparacion] = useState('1');
  const [calcAlero, setCalcAlero] = useState('0');
  const [calcAlturaColumnas] = useState('');
  const [calcNumColumnas] = useState('4');
  const [precioPorM2] = useState('140');

  // Finances Gastos state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Escaneo de comprobantes (QR gratis + IA de visión)
  const [scanning, setScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<{ ok: boolean; msg: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPlanesIA, setShowPlanesIA] = useState<false | 'sin_plan' | 'agotado'>(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const handleScanReceipt = async (file: File | null) => {
    if (!file) return;
    setScanning(true);
    setScanNotice(null);
    try {
      // El QR del comprobante es gratis para todos; la lectura por IA (y la
      // lectura de PDFs) requiere un plan de IA activo. El admin siempre puede.
      const acc = await checkAIAccess();
      const result = await scanReceipt(file, acc.ok);
      const d = result.data;
      // Sin QR y sin IA permitida.
      if (result.source === 'sin_ia') {
        if (acc.motivo === 'no_disponible') {
          // IA aún no abierta a usuarios: no se ofrece plan, solo se avisa.
          setScanNotice({ ok: false, msg: 'No se encontró QR en el comprobante. La lectura automática con IA está en pruebas internas; por ahora ingresa el gasto a mano.' });
        } else {
          setShowPlanesIA(acc.motivo === 'agotado' ? 'agotado' : 'sin_plan');
          setScanNotice({ ok: false, msg: 'La lectura automática con IA requiere un plan activo. El QR del comprobante es gratis; para fotos o PDFs sin QR, activa un plan.' });
        }
        return;
      }
      if (result.source === 'none' || (!d.total && !d.proveedor && !d.ruc)) {
        setScanNotice({ ok: false, msg: 'No se pudieron leer los datos. Ingrésalos a mano o intenta con una foto más nítida.' });
        return;
      }
      // Si la IA aportó datos, descuenta un uso del plan.
      if (result.source === 'ia' || result.source === 'qr_ia') {
        try { await consumeAIUse(); } catch { /* ignore */ }
      }
      // Rellenar el formulario (el usuario revisa y confirma antes de guardar).
      // La descripción combina el DETALLE de lo comprado + proveedor + método de pago.
      const parts: string[] = [];
      if (d.detalle) parts.push(d.detalle);
      else if (d.descripcion) parts.push(d.descripcion);
      const firstLower = (parts[0] || '').toLowerCase();
      if (d.proveedor && !firstLower.includes(d.proveedor.toLowerCase())) parts.push(d.proveedor);
      if (d.metodoPago) parts.push(`Pago: ${d.metodoPago}${d.nroOperacion ? ` (Op. ${d.nroOperacion})` : ''}`);
      const desc = parts.join(' — ');
      if (desc) setDescription(desc);
      else if (d.serie) setDescription(d.serie);

      if (typeof d.total === 'number' && d.total > 0) setAmount(String(d.total));
      if (d.fecha) setDate(d.fecha);
      if (d.categoriaSugerida) setCategory(d.categoriaSugerida);
      const via = result.source === 'qr_ia' ? 'QR + IA'
        : result.source === 'qr' ? 'QR del comprobante'
        : 'lectura con IA';
      setScanNotice({ ok: true, msg: `✓ Datos cargados (${via}). Revisa y pulsa "Agregar Gasto".` });
    } catch (err: any) {
      const code = String(err?.code || err?.message || '');
      const msg = code.includes('failed-precondition')
        ? 'El QR no se detectó y la lectura por IA aún no está activada. Registra el gasto a mano por ahora.'
        : 'No se pudo escanear. Revisa la conexión o ingresa el gasto a mano.';
      setScanNotice({ ok: false, msg });
    } finally {
      setScanning(false);
      if (receiptInputRef.current) receiptInputRef.current.value = '';
    }
  };

  // Pegar comprobante con Ctrl+V (solo en la pestaña de Gastos, ideal en PC)
  useEffect(() => {
    if (activeTab !== 'gastos') return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) { e.preventDefault(); handleScanReceipt(f); break; }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  const [sourceProject, setSourceProject] = useState('');
  const [category, setCategory] = useState('');
  const [editingGastoId, setEditingGastoId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  const project = projects.find(p => String(p.id) === String(selectedProject)) || 
    (selectedProject ? projects.find(p => p.name?.toLowerCase().trim() === selectedProject.toLowerCase().trim()) : projects[0]);

  // Comparación flexible de proyecto (por ID o por Nombre)
  const isProjectMatch = (source?: string) => {
    if (!source || !project) return false;
    const s = source.trim().toLowerCase();
    const pName = (project.name || '').trim().toLowerCase();
    const pId = String(project.id).trim().toLowerCase();
    return s === pName || s === pId || pName.includes(s) || s.includes(pName);
  };

  // Gastos vinculados a este proyecto
  const gastosProyecto = finances.filter(f => 
    (f.type === 'gasto' || f.type === 'gastos' || f.type === 'familia') && isProjectMatch(f.sourceProject)
  );

  // Compras de materiales registradas en Gastos Operativos
  const gastosMaterialesFinanzas = gastosProyecto.filter(f => 
    f.category?.toLowerCase() === 'material'
  );

  // Otros gastos operativos (Personal, Transporte, etc.) que no son materiales
  const otrosGastosOperativos = gastosProyecto.filter(f => 
    f.category?.toLowerCase() !== 'material'
  );

  // Producto del Catálogo de precios elegido por su nombre (opcional).
  const itemCat = itemsCatalogo().find(i => i.nombre === name.trim());
  const [actualizarCatalogo, setActualizarCatalogo] = useState(true);
  const precioDistinto = !!itemCat && unitPrice !== '' && Math.abs(precio(itemCat.clave) - parseFloat(unitPrice)) > 0.009;

  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !name || !quantity || !unitPrice) return;
    
    const newMaterial: Material = {
      id: editingMaterialId || `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice),
      ...(itemCat ? { unit: itemCat.unidad, category: itemCat.grupo } : {}),
    };
    // La compra real actualiza el precio del catálogo (lo usan todos los presupuestos).
    if (itemCat && precioDistinto && actualizarCatalogo) fijarPrecio(itemCat.clave, parseFloat(unitPrice), `compra en ${project.name}`);

    setProjects(prev => prev.map(p => p.id === project.id ? {
      ...p,
      materiales: editingMaterialId 
        ? (p.materiales || []).map(m => m.id === editingMaterialId ? newMaterial : m) 
        : [...(p.materiales || []), newMaterial]
    } : p));
    
    setName(''); setQuantity(''); setUnitPrice(''); setEditingMaterialId(null);
  };

  const handleEditMaterial = (m: Material) => {
    setName(m.name);
    setQuantity(m.quantity.toString());
    setUnitPrice(m.unitPrice?.toString() || '');
    setEditingMaterialId(m.id);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (!project) return;
    setProjects(prev => prev.map(p => p.id === project.id ? {
      ...p,
      materiales: (p.materiales || []).filter(m => m.id !== materialId)
    } : p));
  };

  // Verificar si un gasto de categoría Material ya existe en la lista técnica
  const isGastoAlreadyInMaterials = (gasto: FinanceRecord) => {
    const gDesc = (gasto.description || '').toLowerCase().trim();
    const gId = String(gasto.id);
    return (project?.materiales || []).some(m => {
      const mName = (m.name || '').toLowerCase().trim();
      return (m.id && (m.id === 'mat-imp-' + gId || m.id === 'mat-gasto-' + gId || m.id.startsWith('mat-imp-' + gId))) ||
             (mName && gDesc && (mName === gDesc || mName.includes(gDesc) || gDesc.includes(mName)));
    });
  };

  // Compras de materiales registradas en Gastos Operativos que aún no han sido importadas
  const gastosMaterialesNoImportados = gastosMaterialesFinanzas.filter(g => !isGastoAlreadyInMaterials(g));

  // Importar una compra de Gastos Operativos a la lista de materiales del proyecto
  const handleImportGastoToMaterials = (gasto: FinanceRecord) => {
    if (!project) return;
    const targetId = 'mat-imp-' + gasto.id;
    if ((project.materiales || []).some(m => m.id === targetId || m.id?.startsWith(targetId))) {
      setFeedbackNotice(`ℹ La compra "${gasto.description}" ya figura en la lista de materiales.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }
    const importedMat: Material = {
      id: targetId,
      name: gasto.description,
      quantity: 1,
      unitPrice: gasto.amount,
      unit: 'und'
    };
    setProjects(prev => prev.map(p => p.id === project.id ? {
      ...p,
      materiales: [...(p.materiales || []).filter(m => m.id !== targetId && !m.id?.startsWith(targetId)), importedMat]
    } : p));
    setFeedbackNotice(`✅ Compra "${gasto.description}" importada a la lista de materiales del proyecto`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Importar todas las compras de Gastos Operativos a la lista de materiales (sin duplicar las ya presentes)
  const handleImportAllGastosMaterials = () => {
    if (!project || gastosMaterialesFinanzas.length === 0) return;
    const existingIds = new Set((project.materiales || []).map(m => m.id));
    const toImport = gastosMaterialesFinanzas.filter(g => !isGastoAlreadyInMaterials(g) && !existingIds.has('mat-imp-' + g.id));
    if (toImport.length === 0) {
      setFeedbackNotice(`ℹ Todos los comprobantes de gastos operativos ya figuran en la lista de materiales.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }
    const importedMats: Material[] = toImport.map(g => ({
      id: 'mat-imp-' + g.id,
      name: g.description,
      quantity: 1,
      unitPrice: g.amount,
      unit: 'und'
    }));
    setProjects(prev => prev.map(p => {
      if (p.id !== project.id) return p;
      const curMats = p.materiales || [];
      const newMatIds = new Set(importedMats.map(m => m.id));
      const cleanedExisting = curMats.filter(m => !newMatIds.has(m.id));
      return {
        ...p,
        materiales: [...cleanedExisting, ...importedMats]
      };
    }));
    setFeedbackNotice(`✅ Se incorporaron ${importedMats.length} compras de gastos operativos a la lista de materiales.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Calculator logic
  const l_base = Number(calcLargo) || 0;
  const a_base = Number(calcAncho) || 0;
  const s = Number(calcSeparacion) || 1;
  const alero = Number(calcAlero) || 0;
  const l = l_base > 0 ? +(l_base + (alero * 2)).toFixed(2) : 0;
  const a = a_base > 0 ? +(a_base + (alero * 2)).toFixed(2) : 0;
  const perimetro = (l + a) * 2;
  const area = l * a;
  const lineasLargo = Math.floor(a / s) + 1;
  const lineasAncho = Math.floor(l / s) + 1;
  const metrajeHorizontal = lineasLargo * l;
  const metrajeVertical = lineasAncho * a;
  const metrajeTotal = metrajeHorizontal + metrajeVertical;
  const fierrosRequeridos = Math.ceil(metrajeTotal / 6);
  const altura = Number(calcAlturaColumnas) || 0;
  const numColumnas = Number(calcNumColumnas) || 0;
  const metrajeColumnas = altura * numColumnas;
  const fierrosColumnas = metrajeColumnas > 0 ? Math.ceil(metrajeColumnas / 6) : 0;
  const calcOpt1 = l > 0 && a > 0 ? Math.ceil(a / 1.0) * Math.ceil(l / 6) : 0;
  const calcOpt2 = l > 0 && a > 0 ? Math.ceil(l / 1.0) * Math.ceil(a / 6) : 0;
  const planchasAluzincOptimas = (calcOpt1 > 0 && calcOpt2 > 0) ? Math.min(calcOpt1, calcOpt2) : 0;
  const presupuestoSugerido = area * Number(precioPorM2 || 140);

  const handleAddToContract = () => {
    if (!project) return;
    const detallesTexto = `Estructura de Techo Metálico con Aluzinc.\nDimensiones Base: ${l_base}m x ${a_base}m.\nAlero: ${alero}m perimetral. Dimensiones Finales: ${l}m x ${a}m.\nÁrea: ${area.toFixed(2)}m², Perímetro: ${perimetro.toFixed(2)}m.\nEstructura:\n- Tubos Techo: ${fierrosRequeridos} uds. (Aprox. ${metrajeTotal.toFixed(2)}m lineales).\n${numColumnas > 0 ? `- Columnas: ${numColumnas} uds, Altura ${altura}m (Tubos Columnas: ${fierrosColumnas} uds).` : ''}\nCobertura (Aluzinc 6m x 1.10m):\n- Planchas: ${planchasAluzincOptimas} uds (Traslape 10cm considerado para impermeabilidad).\n\nPresupuesto Estimado a todo costo: S/ ${presupuestoSugerido.toFixed(2)}`;

    setProjects(prev => prev.map(p => p.id === project.id ? {
      ...p,
      presupuesto: presupuestoSugerido,
      detallesContrato: detallesTexto
    } : p));
    alert('Se han añadido los detalles al proyecto. Puedes revisar la pestaña de Contratos.');
  };

  const totalMateriales = (project?.materiales || []).reduce((sum, m) => sum + ((Number(m.quantity) || 0) * (Number(m.unitPrice) || 0)), 0);
  const totalGastosMateriales = gastosMaterialesFinanzas.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const totalPersonal = (project?.personal || []).reduce((sum, p) => sum + (p.adelantos || []).reduce((aSum: number, a: any) => aSum + (Number(a.amount) || 0), 0), 0);
  const totalOtrosGastos = otrosGastosOperativos.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const deudasProyecto = finances.filter(f => f.type === 'deuda' && isProjectMatch(f.sourceProject));
  const totalPagosDeuda = deudasProyecto.reduce((sum, f) => sum + (f.payments?.reduce((s, p) => s + (Number(p.amount) || 0), 0) || (f.isPaid ? (Number(f.amount) || 0) : 0)), 0);

  // Evitar duplicar costos ("cruce de gastos operativos"):
  // Si ya hay materiales en project.materiales, solo sumamos otros gastos (transporte, personal, deudas)
  // Si no hay materiales en project.materiales, se contabilizan las compras registradas en finanzas
  const costoInsumosTotal = totalMateriales + (totalMateriales === 0 ? totalGastosMateriales : 0) + totalPersonal + totalOtrosGastos + totalPagosDeuda;

  // Gastos handlers
  const handleGastoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;
    const newRecord: FinanceRecord = {
      id: editingGastoId || Date.now().toString(),
      type: 'gastos',
      description,
      amount: Number(amount),
      date,
      isPaid: true,
      sourceProject: sourceProject || undefined,
      category
    };
    if (editingGastoId) {
      setFinances(prev => prev.map(f => f.id === editingGastoId ? newRecord : f));
      setEditingGastoId(null);
    } else {
      setFinances([...finances, newRecord]);
    }
    setDescription('');
    setAmount('');
    setCategory('');
    setSourceProject('');
  };

  const gastosRecords = finances.filter(f => f.type === 'gastos').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalGastosOperativos = gastosRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* UNIFIED HEADER & SUB-TABS */}
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center">
              <Package className="w-8 h-8 mr-3 text-indigo-600" />
              Materiales & Gastos Operativos
            </h1>
            <p className="text-slate-500 mt-1">Módulo unificado para control de materiales de proyectos, calculadoras estructurales y egresos operativos.</p>
          </div>
        </div>

        {/* Pestanas de Navegación */}
        <div className="flex border-b border-slate-200 mt-6 space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px cursor-pointer ${
              activeTab === 'materials'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Materiales & Calculadoras</span>
          </button>
          <button
            onClick={() => setActiveTab('gastos')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px cursor-pointer ${
              activeTab === 'gastos'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Gastos Operativos</span>
          </button>
        </div>
      </header>

      {feedbackNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer font-black ml-2">✕</button>
        </div>
      )}

      {activeTab === 'materials' ? (
        <div className="space-y-6 h-full flex flex-col">
          {/* BARRA SUPERIOR DE PROYECTO & ACCIONES DE RESTAURACIÓN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 max-w-xl">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Proyecto Seleccionado
              </label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 focus:border-indigo-500 rounded-xl px-4 py-2.5 outline-none font-bold text-slate-800 text-sm transition-colors cursor-pointer"
                value={selectedProject}
                onChange={e => { setSelectedProject(e.target.value); setEditingMaterialId(null); }}
              >
                <option value="">Seleccione un proyecto...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.client} (S/ {p.presupuesto?.toFixed(2) || '0.00'})
                  </option>
                ))}
              </select>
            </div>

            {project && gastosMaterialesNoImportados.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 lg:self-end">
                <button
                  onClick={handleImportAllGastosMaterials}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
                  title="Incorporar compras registradas en Gastos Operativos a la lista de materiales"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Incorporar {gastosMaterialesNoImportados.length} compras de Gastos Operativos</span>
                </button>
              </div>
            )}
          </div>

          {project && (
            <>
              <div className="flex border-b border-slate-200 mb-6 space-x-6 overflow-x-auto">
                <button 
                  onClick={() => setActiveMaterialTab('lista')}
                  className={`pb-3 font-bold text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${activeMaterialTab === 'lista' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Package className="w-4 h-4" />
                  <span>Lista de Materiales e Insumos</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-black border border-slate-200">
                    {(project.materiales || []).length}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveMaterialTab('techo')}
                  className={`pb-3 font-bold text-sm transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${activeMaterialTab === 'techo' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Calculadora Estructural y Presupuesto</span>
                </button>
              </div>

              {activeMaterialTab === 'lista' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                  {/* FORMULARIO AGREGAR / EDITAR */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>{editingMaterialId ? 'Editar Material' : `Añadir Material a "${project.name}"`}</span>
                    </h2>
                    <form onSubmit={handleMaterialSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Nombre del Material o Perfil</label>
                        <input required list="catalogo-precios-lista" value={name} onChange={e => { setName(e.target.value); const it = itemsCatalogo().find(i => i.nombre === e.target.value.trim()); if (it && !unitPrice) setUnitPrice(String(precio(it.clave))); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 font-medium" placeholder="Escribe o elige del Catálogo de precios (ej. Tubo 2x2)" />
                        <datalist id="catalogo-precios-lista">{itemsCatalogo().map(i => <option key={i.clave} value={i.nombre}>{`${i.unidad} · S/ ${precio(i.clave).toFixed(2)}`}</option>)}</datalist>
                        {itemCat && <p className="text-[11px] text-slate-500 mt-1">Del catálogo: por {itemCat.unidad} · precio vigente S/ {precio(itemCat.clave).toFixed(2)}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Cantidad (Uds / Barras / m²)</label>
                        <input required type="number" step="0.01" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} onFocus={e => e.target.select()} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 font-mono" placeholder="Ej. 1" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Precio Unit. (S/)</label>
                        <input required type="number" step="0.01" min="0" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} onFocus={e => e.target.select()} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 font-mono" placeholder="Ej. 0.00" />
                      </div>
                      {precioDistinto && (
                        <label className="md:col-span-4 flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 rounded-xl px-3 py-2 cursor-pointer">
                          <input type="checkbox" checked={actualizarCatalogo} onChange={e => setActualizarCatalogo(e.target.checked)} />
                          Actualizar el precio en el Catálogo de precios a S/ {parseFloat(unitPrice).toFixed(2)} (se usará en Techos, CarpiMetal, Obra Civil y Drywall)
                        </label>
                      )}
                      <div className="md:col-span-4 flex justify-end space-x-3 mt-1">
                        {editingMaterialId && <button type="button" onClick={() => { setEditingMaterialId(null); setName(''); setQuantity(''); setUnitPrice(''); }} className="px-5 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-xs cursor-pointer">Cancelar</button>}
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-xs transition-colors cursor-pointer">{editingMaterialId ? 'Guardar Cambios' : 'Añadir Material'}</button>
                      </div>
                    </form>
                  </div>

                  {/* TABLA DE MATERIALES DEL PROYECTO */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-800">
                          Insumos del Proyecto: <span className="text-indigo-600 font-black">{project.name}</span>
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500">
                          Total Insumos: <span className="text-slate-800 font-mono font-black">{formatCurrency(totalMateriales)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                            <th className="p-3.5">Material / Descripción</th>
                            <th className="p-3.5 text-center">Cantidad</th>
                            <th className="p-3.5 text-right">Precio Unit.</th>
                            <th className="p-3.5 text-right">Subtotal</th>
                            <th className="p-3.5 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(project.materiales || []).map((m, idx) => {
                            const subtotal = m.quantity * (m.unitPrice || 0);
                            const isImportedFromGasto = m.id.startsWith('mat-imp-') || m.id.startsWith('mat-gasto-');
                            return (
                              <tr key={m.id ? `mat-${m.id}-${idx}` : `mat-idx-${idx}`} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3.5 font-bold text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <span>{m.name}</span>
                                    {isImportedFromGasto && (
                                      <span className="inline-flex items-center text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                                        Gastos Operativos
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3.5 text-center font-mono text-slate-600">{m.quantity} {m.unit || ''}</td>
                                <td className="p-3.5 text-right font-mono text-slate-600">{formatCurrency(m.unitPrice || 0)}</td>
                                <td className="p-3.5 text-right font-mono font-bold text-slate-800">{formatCurrency(subtotal)}</td>
                                <td className="p-3.5 text-center">
                                  <button onClick={() => handleEditMaterial(m)} className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors mr-1 cursor-pointer" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => handleDeleteMaterial(m.id)} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                                </td>
                              </tr>
                            );
                          })}
                          {(!project.materiales || project.materiales.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center">
                                <div className="max-w-md mx-auto space-y-3">
                                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                                    <Package className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Este proyecto no tiene materiales en su lista técnica</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                      Puedes agregarlos utilizando el formulario de arriba.
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                                    {gastosMaterialesNoImportados.length > 0 && (
                                      <button
                                        onClick={handleImportAllGastosMaterials}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                      >
                                        <ArrowDownToLine className="w-4 h-4" />
                                        <span>Incorporar {gastosMaterialesNoImportados.length} compras de Gastos Operativos</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                          <tr>
                            <td colSpan={3} className="p-3.5 text-right font-bold text-slate-500 uppercase tracking-wider text-xs">Total Materiales Directos:</td>
                            <td className="p-3.5 text-right font-mono font-bold text-sm text-slate-800">{formatCurrency(totalMateriales)}</td>
                            <td></td>
                          </tr>
                          {gastosMaterialesFinanzas.length > 0 && (
                            <tr className="bg-rose-50/40 text-rose-700">
                              <td colSpan={3} className="p-2.5 text-right font-bold text-xs">
                                + Compras de Materiales Registradas en Gastos Operativos ({gastosMaterialesFinanzas.length}):
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-xs">{formatCurrency(totalGastosMateriales)}</td>
                              <td></td>
                            </tr>
                          )}
                          <tr className="border-t border-slate-200 bg-emerald-50/60">
                            <td colSpan={3} className="p-3.5 text-right font-black text-slate-800 uppercase tracking-wider text-xs">Costo Total de Insumos y Gastos de Obra:</td>
                            <td className="p-3.5 text-right font-mono font-black text-base text-emerald-700">{formatCurrency(costoInsumosTotal)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* SECCIÓN VINCULADA: COMPRAS REGISTRADAS EN GASTOS OPERATIVOS PARA ESTE PROYECTO */}
                  {gastosMaterialesFinanzas.length > 0 && (
                    <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden mt-6">
                      <div className="p-4 bg-rose-50/60 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                            <Receipt className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">
                              Compras de Materiales en Gastos Operativos ({gastosMaterialesFinanzas.length})
                            </h3>
                            <p className="text-xs text-slate-500">
                              Egresos registrados en finanzas asociados al proyecto "{project.name}" (evita duplicidad y clarifica los costos)
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={handleImportAllGastosMaterials}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
                          title="Importar todas las compras a la lista de materiales del proyecto"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Pasar todas a Lista de Materiales</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                              <th className="p-3">Fecha</th>
                              <th className="p-3">Detalle / Factura de Compra</th>
                              <th className="p-3 text-right">Monto Pagado</th>
                              <th className="p-3 text-center">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {gastosMaterialesFinanzas.map((g, gIdx) => (
                              <tr key={g.id ? `${g.id}_${gIdx}` : `gasto_${gIdx}`} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3 text-slate-500 font-mono">{g.date}</td>
                                <td className="p-3 font-semibold text-slate-800">{g.description}</td>
                                <td className="p-3 text-right font-bold font-mono text-rose-600">{formatCurrency(g.amount)}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleImportGastoToMaterials(g)}
                                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                                    title="Añadir como material formal al proyecto"
                                  >
                                    + Añadir a Lista
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-rose-50/30 border-t border-rose-100">
                            <tr>
                              <td colSpan={2} className="p-3 text-right font-bold text-slate-600">Subtotal Compras en Gastos:</td>
                              <td className="p-3 text-right font-mono font-black text-rose-700 text-sm">{formatCurrency(totalGastosMateriales)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeMaterialTab === 'techo' && (
                <div className="animate-in fade-in duration-300 space-y-6">
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <h3 className="text-lg font-bold text-indigo-900 mb-1">Calculadora Estructural y Presupuesto</h3>
                          <p className="text-indigo-700 text-sm">Calcula el área, cantidades de barras, Aluzinc y genera un presupuesto estimado.</p>
                       </div>
                       {(l > 0 && a > 0) && (
                          <button onClick={handleAddToContract} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl flex items-center text-sm transition-colors shadow-sm cursor-pointer">
                            <FileText className="w-4 h-4 mr-2" />
                            Agregar al Contrato
                          </button>
                       )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 border-b border-indigo-200/60 pb-6 mb-6">
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider">Largo Techo (m)</label>
                        <input value={calcLargo} onChange={e => setCalcLargo(e.target.value)} onFocus={e => e.target.select()} type="number" step="0.1" min="0" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 10.5" />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider">Ancho Techo (m)</label>
                        <input value={calcAncho} onChange={e => setCalcAncho(e.target.value)} onFocus={e => e.target.select()} type="number" step="0.1" min="0" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 6.2" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider">Separación (m)</label>
                        <input value={calcSeparacion} onChange={e => setCalcSeparacion(e.target.value)} onFocus={e => e.target.select()} type="number" step="0.1" min="0.1" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 1" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-800 mb-1 uppercase tracking-wider">Alero (m)</label>
                        <input value={calcAlero} onChange={e => setCalcAlero(e.target.value)} onFocus={e => e.target.select()} type="number" step="0.1" min="0" className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Gastos Operativos</p>
              <p className="text-3xl font-bold text-slate-800">{formatCurrency(totalGastosOperativos)}</p>
            </div>
          </div>

          {/* ESCÁNER DE COMPROBANTES: QR gratis + IA de visión (foto, archivo o PDF) */}
          <div
            onDragOver={e => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
            onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer?.files?.[0];
              if (f) handleScanReceipt(f);
            }}
            className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${
              dragOver ? 'bg-slate-50 border-slate-400 border-dashed' : 'bg-white border-slate-200'
            }`}
          >
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={e => handleScanReceipt(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => receiptInputRef.current?.click()}
              disabled={scanning}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              <span>{scanning ? 'Leyendo…' : 'Escanear comprobante'}</span>
            </button>
            <div className="min-w-0 flex-1">
              {scanNotice ? (
                <p className={`text-xs font-bold ${scanNotice.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {scanNotice.msg}
                </p>
              ) : dragOver ? (
                <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  Suelta aquí la imagen o el PDF del comprobante…
                </p>
              ) : (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>En celular: toma la foto. En PC: elige un archivo, <b>arrástralo aquí</b> o <b>pega con Ctrl+V</b> (imagen o PDF). Llenamos los datos por ti.</span>
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleGastoSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Descripción</label>
              <input required value={description} onChange={e => setDescription(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Detalle del gasto..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Proyecto Asociado</label>
              <select value={sourceProject} onChange={e => setSourceProject(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                <option value="">General (Sin proyecto)</option>
                {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Categoría</label>
              <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                <option value="" disabled>Seleccionar...</option>
                <option value="Material">Material</option>
                <option value="Personal">Personal</option>
                <option value="Transporte">Transporte</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Monto (S/)</label>
              <input required value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="Ej. 0.00" />
            </div>
            <div>
              <button type="submit" className="w-full flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                {editingGastoId ? 'Actualizar' : 'Agregar Gasto'}
              </button>
            </div>
          </form>

          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Descripción</th>
                    <th className="p-4 font-semibold">Proyecto</th>
                    <th className="p-4 font-semibold">Categoría</th>
                    <th className="p-4 font-semibold text-right">Monto</th>
                    <th className="p-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {gastosRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-500">{r.date}</td>
                      <td className="p-4 font-medium text-slate-800">{r.description}</td>
                      <td className="p-4 text-sm text-indigo-600 font-semibold">{r.sourceProject || 'General'}</td>
                      <td className="p-4 text-sm text-slate-600">{r.category || '-'}</td>
                      <td className="p-4 text-right font-semibold text-slate-800">{formatCurrency(r.amount)}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button onClick={() => setFinances(finances.filter(x => x.id !== r.id))} className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {gastosRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No hay registros de gastos operativos.</td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
      {showPlanesIA && <PlanesIAModal motivo={showPlanesIA} onClose={() => setShowPlanesIA(false)} />}
    </div>
  );
}
