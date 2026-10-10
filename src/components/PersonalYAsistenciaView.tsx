import React, { useState } from 'react';
import { 
  Users, 
  ClipboardCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Activity, 
  UserCheck
} from 'lucide-react';
import { Project, AsistenciaRecord } from '../types';

interface PersonalYAsistenciaViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  initialSubTab?: 'personal' | 'asistencia';
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
};

export default function PersonalYAsistenciaView({
  projects,
  setProjects,
  initialSubTab = 'personal'
}: PersonalYAsistenciaViewProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'asistencia'>(initialSubTab);

  // --- TRABAJADORES (PERSONAL) STATE ---
  const [pSelectedProject, setPSelectedProject] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [paymentType, setPaymentType] = useState('Global');
  const [days, setDays] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [globalAmount, setGlobalAmount] = useState('');
  
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);

  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [adelantoMonto, setAdelantoMonto] = useState('');
  const [adelantoFecha, setAdelantoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [adelantoMetodo, setAdelantoMetodo] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [adelantoRef, setAdelantoRef] = useState('');

  // Sugerencias
  const [calcArea, setCalcArea] = useState('');
  const [calcTools, setCalcTools] = useState(false);
  const [calcRole, setCalcRole] = useState('Maestro/Soldador');

  // --- CONTROL DE ASISTENCIA STATE ---
  const [aSelectedProject, setASelectedProject] = useState('');
  const [aSelectedWorkerId, setASelectedWorkerId] = useState<string | null>(null);
  const [asisDate, setAsisDate] = useState(new Date().toISOString().split('T')[0]);
  const [asisHours, setAsisHours] = useState('8');
  const [asisStatus, setAsisStatus] = useState<'Presente' | 'Tarde' | 'Falta' | 'Medio Día'>('Presente');
  const [asisNotes, setAsisNotes] = useState('');
  const [editingAsisId, setEditingAsisId] = useState<string | null>(null);

  // Derived objects
  const pProject = projects.find(p => p.id === pSelectedProject);
  const pSelectedWorker = pProject?.personal?.find(p => p.id === selectedWorkerId);

  const aProject = projects.find(p => p.id === aSelectedProject);
  const aSelectedWorker = aProject?.personal?.find((w: any) => w.id === aSelectedWorkerId);

  // --- HANDLERS TRABAJADORES ---
  const getSuggestedRate = () => {
    let base = calcRole === 'Ayudante' ? 60 : (calcRole === 'Operario' ? 90 : 120);
    if (calcTools) base += 30;
    const areaBonus = Number(calcArea) > 50 ? 20 : 0;
    return base + areaBonus;
  };

  const handleEditWorker = (w: any) => {
    setName(w.name);
    setRole(w.role);
    setDni(w.dni || '');
    setPhone(w.phone || '');
    setAddress(w.address || '');
    setPaymentType(w.paymentType || 'Global');
    if (w.paymentType === 'Por Día') {
      setDays(w.days?.toString() || '');
      setDailyRate(w.dailyRate?.toString() || '');
      setGlobalAmount('');
    } else {
      setGlobalAmount(w.amount.toString());
      setDays(''); setDailyRate('');
    }
    setEditingWorkerId(w.id);
  };

  const handleDeleteWorker = (workerId: string) => {
    if (!pProject) return;
    setProjects(prev => prev.map(p => p.id === pProject.id ? {
      ...p,
      personal: (p.personal || []).filter(w => w.id !== workerId)
    } : p));
    if (selectedWorkerId === workerId) setSelectedWorkerId(null);
  };

  const handleSubmitWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pProject || !name || !role) return;
    
    let totalAmount = 0;
    if (paymentType === 'Por Día') {
      totalAmount = Number(days) * Number(dailyRate);
    } else {
      totalAmount = Number(globalAmount);
    }
    
    const newWorker = {
      id: editingWorkerId || Date.now().toString(),
      name,
      role,
      dni,
      phone,
      address,
      paymentType,
      days: paymentType === 'Por Día' ? Number(days) : undefined,
      dailyRate: paymentType === 'Por Día' ? Number(dailyRate) : undefined,
      amount: totalAmount,
      adelantos: editingWorkerId ? (pProject.personal?.find(w => w.id === editingWorkerId)?.adelantos || []) : [],
      asistencia: editingWorkerId ? (pProject.personal?.find(w => w.id === editingWorkerId)?.asistencia || []) : []
    };

    setProjects(prev => prev.map(p => p.id === pProject.id ? {
      ...p,
      personal: editingWorkerId 
        ? (p.personal || []).map(w => w.id === editingWorkerId ? newWorker : w)
        : [...(p.personal || []), newWorker]
    } : p));

    setName(''); setRole(''); setDni(''); setPhone(''); setAddress(''); setDays(''); setDailyRate(''); setGlobalAmount(''); setEditingWorkerId(null);
  };

  const handleAddAdelanto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pProject || !pSelectedWorker || !adelantoMonto) return;
    const amountNum = Number(adelantoMonto);
    const newAdelanto = {
      id: Date.now().toString(),
      amount: amountNum,
      date: adelantoFecha,
      method: adelantoMetodo,
      reference: adelantoRef
    };

    setProjects(prev => prev.map(p => p.id === pProject.id ? {
      ...p,
      personal: (p.personal || []).map(w => w.id === pSelectedWorker.id ? {
        ...w,
        adelantos: [...(w.adelantos || []), newAdelanto]
      } : w)
    } : p));

    setAdelantoMonto('');
    setAdelantoRef('');
  };

  const handleDeleteAdelanto = (adelantoId: string) => {
    if (!pProject || !pSelectedWorker) return;
    setProjects(prev => prev.map(p => p.id === pProject.id ? {
      ...p,
      personal: (p.personal || []).map(w => w.id === pSelectedWorker.id ? {
        ...w,
        adelantos: (w.adelantos || []).filter(a => a.id !== adelantoId)
      } : w)
    } : p));
  };

  // --- HANDLERS ASISTENCIA ---
  const handleAddAsistencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aProject || !aSelectedWorker || !asisDate || !asisHours) return;
    const newAsis: AsistenciaRecord = {
      id: editingAsisId || Date.now().toString(),
      date: asisDate,
      hours: Number(asisHours),
      status: asisStatus as any,
      notes: asisNotes
    };
    setProjects(prev => prev.map(p => p.id === aProject.id ? {
      ...p,
      personal: (p.personal || []).map(w => w.id === aSelectedWorker.id ? {
        ...w,
        asistencia: editingAsisId 
          ? (w.asistencia || []).map(a => a.id === editingAsisId ? newAsis : a)
          : [...(w.asistencia || []), newAsis]
      } : w)
    } : p));
    setAsisNotes('');
    setEditingAsisId(null);
  };

  const handleEditAsistencia = (a: any) => {
    setAsisDate(a.date);
    setAsisHours(a.hours.toString());
    setAsisStatus(a.status);
    setAsisNotes(a.notes || '');
    setEditingAsisId(a.id);
  };

  const handleDeleteAsistencia = (id: string) => {
    if (!aProject || !aSelectedWorker) return;
    setProjects(prev => prev.map(p => p.id === aProject.id ? {
      ...p,
      personal: (p.personal || []).map(w => w.id === aSelectedWorker.id ? {
        ...w,
        asistencia: (w.asistencia || []).filter(a => a.id !== id)
      } : w)
    } : p));
  };

  return (
    <div className="space-y-6">
      {/* Header Unificado */}
      <header className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center">
              <Users className="w-8 h-8 mr-3 text-emerald-600" />
              Gestión de Personal
            </h1>
            <p className="text-slate-500 mt-1">Gestión integral de personal, jornales, adelantos de pago y control de asistencia.</p>
          </div>
        </div>

        {/* Pestanas de Navegación */}
        <div className="flex border-b border-slate-200 mt-6 space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'personal'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Personal & Adelantos</span>
          </button>
          <button
            onClick={() => setActiveTab('asistencia')}
            className={`flex items-center space-x-2 py-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px ${
              activeTab === 'asistencia'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Control de Asistencia</span>
          </button>
        </div>
      </header>

      {/* TAB 1: PERSONAL & ADELANTOS */}
      {activeTab === 'personal' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Seleccionar Proyecto</label>
            <select 
              className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
              value={pSelectedProject}
              onChange={e => { setPSelectedProject(e.target.value); setSelectedWorkerId(null); }}
            >
              <option value="">Seleccione un proyecto...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {pProject ? (
                <>
                  <form onSubmit={handleSubmitWorker} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2">{editingWorkerId ? 'Editar Trabajador' : 'Agregar Trabajador'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Nombres Completos</label>
                        <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. Juan Pérez" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Rol / Especialidad</label>
                        <input required value={role} onChange={e => setRole(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. Soldador Homologado" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">DNI</label>
                        <input value={dni} onChange={e => setDni(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Opcional" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Teléfono</label>
                        <input value={phone} onChange={e => setPhone(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Opcional" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Dirección</label>
                        <input value={address} onChange={e => setAddress(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Opcional" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Tipo de Pago</label>
                        <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500">
                          <option value="Global">Por Proyecto Completo (Global)</option>
                          <option value="Por Evento">Por Evento (Una Vez)</option>
                          <option value="Por Día">Por Día (Jornal)</option>
                        </select>
                      </div>
                       
                      {paymentType === 'Global' || paymentType === 'Por Evento' ? (
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Monto Total Pactado (S/)</label>
                          <input required value={globalAmount} onChange={e => setGlobalAmount(e.target.value)} type="number" step="0.01" min="0" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. 0.00" />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Días Laborables</label>
                            <input required value={days} onChange={e => setDays(e.target.value)} type="number" min="1" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. 5" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Pago Diario (S/)</label>
                            <input required value={dailyRate} onChange={e => setDailyRate(e.target.value)} type="number" step="0.01" min="0" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. 120.00" />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      {editingWorkerId && (
                        <button type="button" onClick={() => { setEditingWorkerId(null); setName(''); setRole(''); setDni(''); setPhone(''); setAddress(''); setDays(''); setDailyRate(''); setGlobalAmount(''); }} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center">
                        {editingWorkerId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {editingWorkerId ? 'Guardar Cambios' : 'Agregar Trabajador'}
                      </button>
                    </div>
                  </form>

                  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                      Lista de Personal ({pProject.personal?.length || 0})
                    </div>
                    <div className="divide-y divide-slate-100">
                      {pProject.personal?.map((p: any) => {
                        const totalAdelantos = (p.adelantos || []).reduce((sum: number, a: any) => sum + a.amount, 0);
                        const saldo = p.amount - totalAdelantos;
                        const isSelected = selectedWorkerId === p.id;
                        
                        return (
                          <div key={p.id} className={`p-4 transition-colors cursor-pointer hover:bg-emerald-50 ${isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'bg-white'}`} onClick={() => setSelectedWorkerId(p.id)}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-bold text-slate-800">{p.name}</div>
                                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                                  <span>{p.role}</span>
                                  {p.paymentType !== 'Global' && p.paymentType !== 'Por Día' && <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded-sm">{p.paymentType}</span>}
                                  {p.paymentType === 'Por Día' && (
                                    <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded-sm">{p.days} días a S/{p.dailyRate}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); handleEditWorker(p); }} className="text-slate-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteWorker(p.id); }} className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-slate-100">
                              <div>
                                <span className="text-slate-500 text-xs block mb-0.5">Total Pactado</span>
                                <span className="font-bold text-slate-700">{formatCurrency(p.amount)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-500 text-xs block mb-0.5">Saldo Restante</span>
                                <span className="font-bold text-emerald-600">{formatCurrency(saldo)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(!pProject.personal || pProject.personal.length === 0) && (
                        <div className="p-8 text-center text-slate-500">No hay personal registrado en este proyecto.</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
                  Selecciona un proyecto arriba para gestionar su personal.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                <h3 className="text-indigo-800 font-bold mb-3 flex items-center text-sm">
                  <Activity className="w-4 h-4 mr-2" /> Sugerencia de Presupuesto
                </h3>
                <p className="text-xs text-indigo-600 mb-4">Calcula el pago sugerido basado en las características del proyecto.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1">Rol</label>
                    <select value={calcRole} onChange={e => setCalcRole(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none">
                      <option>Maestro/Soldador</option>
                      <option>Operario</option>
                      <option>Ayudante</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-700 mb-1">Perímetro o Área (m² / ml)</label>
                    <input type="number" value={calcArea} onChange={e => setCalcArea(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Ej. 120" />
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <input type="checkbox" id="toolsCheckbox" checked={calcTools} onChange={e => setCalcTools(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="toolsCheckbox" className="text-sm text-indigo-800 font-medium cursor-pointer">Pone sus propias herramientas (+ S/ 30)</label>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-indigo-200/50">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Pago Diario Sugerido</p>
                    <p className="text-2xl font-bold text-indigo-900">{formatCurrency(getSuggestedRate())}</p>
                  </div>
                </div>
              </div>

              {pSelectedWorker && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-1">{pSelectedWorker.name}</h2>
                  <p className="text-xs text-slate-500 mb-4">{pSelectedWorker.role} | DNI: {pSelectedWorker.dni || 'N/A'}</p>
                  
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Registrar Adelanto</h3>
                    <form onSubmit={handleAddAdelanto} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Monto (S/)</label>
                        <input required value={adelantoMonto} onChange={e => setAdelantoMonto(e.target.value)} type="number" step="0.01" min="0" max={(pSelectedWorker.amount || 0) - ((pSelectedWorker.adelantos || []).reduce((s: number, a: any) => s + a.amount, 0))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. 0.00" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
                          <input required value={adelantoFecha} onChange={e => setAdelantoFecha(e.target.value)} type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Método</label>
                          <select value={adelantoMetodo} onChange={e => setAdelantoMetodo(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500">
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                          </select>
                        </div>
                      </div>
                      {adelantoMetodo === 'Transferencia' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Código de Operación</label>
                          <input required value={adelantoRef} onChange={e => setAdelantoRef(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. 18274619" />
                        </div>
                      )}
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                        Registrar Adelanto
                      </button>
                    </form>

                    <div>
                      <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Historial de Adelantos</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {(!pSelectedWorker.adelantos || pSelectedWorker.adelantos.length === 0) ? (
                          <p className="text-sm text-slate-500 text-center py-4">No hay adelantos registrados.</p>
                        ) : (
                          pSelectedWorker.adelantos.map((a: any) => (
                            <div key={a.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-slate-800">{formatCurrency(a.amount)}</div>
                                  <div className="text-xs text-slate-500">{a.date} &middot; {a.method}</div>
                                  {a.reference && <div className="text-xs text-slate-400 mt-1">Ref: {a.reference}</div>}
                                </div>
                                <button onClick={() => handleDeleteAdelanto(a.id)} className="text-slate-400 hover:text-rose-500 transition-opacity p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTROL DE ASISTENCIA */}
      {activeTab === 'asistencia' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Seleccionar Proyecto</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                  value={aSelectedProject}
                  onChange={e => { setASelectedProject(e.target.value); setASelectedWorkerId(null); }}
                >
                  <option value="">Seleccione un proyecto...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              {aProject && (
                <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700">Trabajadores del Proyecto</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {aProject.personal?.map((p: any) => (
                      <button 
                        key={p.id}
                        onClick={() => setASelectedWorkerId(p.id)}
                        className={`w-full text-left p-4 hover:bg-emerald-50 transition-colors ${aSelectedWorkerId === p.id ? 'bg-emerald-50 border-l-4 border-emerald-500 font-bold' : ''}`}
                      >
                        <div className="font-bold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.role}</div>
                      </button>
                    ))}
                    {(!aProject.personal || aProject.personal.length === 0) && (
                      <div className="p-4 text-center text-slate-500 text-sm">No hay personal registrado en este proyecto.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
              {aSelectedWorker ? (
                <>
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center">
                      <ClipboardCheck className="w-5 h-5 mr-2 text-emerald-600" />
                      Registro de Asistencia - {aSelectedWorker.name}
                    </h3>
                  </div>
                  
                  <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8 bg-slate-50">
                    <form onSubmit={handleAddAsistencia} className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
                          <input required value={asisDate} onChange={e => setAsisDate(e.target.value)} type="date" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Horas</label>
                          <input required value={asisHours} onChange={e => setAsisHours(e.target.value)} type="number" step="0.5" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Estado</label>
                          <select value={asisStatus} onChange={e => setAsisStatus(e.target.value as any)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500">
                            <option value="Presente">Presente</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Medio Día">Medio Día</option>
                            <option value="Falta">Falta</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Notas (Opcional)</label>
                        <input value={asisNotes} onChange={e => setAsisNotes(e.target.value)} type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. Permiso médico..." />
                      </div>
                      <div className="flex gap-3 pt-2">
                        {editingAsisId && (
                           <button type="button" onClick={() => { setEditingAsisId(null); setAsisNotes(''); }} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg transition-colors text-sm">
                             Cancelar
                           </button>
                        )}
                        <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                          {editingAsisId ? 'Guardar Cambios' : 'Registrar Asistencia'}
                        </button>
                      </div>
                    </form>
                    
                    <div>
                      <h3 className="font-bold text-slate-800 text-md mb-4">Registro Histórico</h3>
                      <div className="space-y-3">
                        {(!aSelectedWorker.asistencia || aSelectedWorker.asistencia.length === 0) ? (
                          <p className="text-sm text-slate-500 text-center py-8 bg-white rounded-xl border border-dashed border-slate-200">No hay asistencia registrada para este trabajador.</p>
                        ) : (
                          [...aSelectedWorker.asistencia].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((a: any) => (
                            <div key={a.id} className="bg-white p-4 rounded-xl border border-slate-200 relative group flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-all gap-4">
                              <div className="flex-1">
                                <div className="font-bold text-slate-800 flex items-center text-lg">
                                  {a.date}
                                  <span className={`ml-3 px-2 py-1 rounded text-xs uppercase font-bold ${a.status === 'Presente' ? 'bg-emerald-100 text-emerald-700' : a.status === 'Falta' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                                </div>
                                <div className="text-sm text-slate-500 mt-1">{a.hours} horas trabajadas</div>
                                {a.notes && <div className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded-md">{a.notes}</div>}
                              </div>
                              <div className="flex space-x-2 self-end sm:self-center">
                                <button onClick={() => handleEditAsistencia(a)} className="bg-slate-100 text-slate-500 hover:text-emerald-600 p-2 rounded-lg transition-colors flex items-center gap-2"><Edit2 className="w-4 h-4" /> <span className="text-xs font-semibold sm:hidden">Editar</span></button>
                                <button onClick={() => handleDeleteAsistencia(a.id)} className="bg-slate-100 text-slate-500 hover:text-rose-600 p-2 rounded-lg transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4" /> <span className="text-xs font-semibold sm:hidden">Eliminar</span></button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-slate-50 my-auto">
                  <ClipboardCheck className="w-16 h-16 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">Selecciona un trabajador</h3>
                  <p className="text-slate-500 max-w-sm mt-2">Elige un proyecto y un trabajador de la lista para gestionar su asistencia y horas laborales.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
