import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Calendar, Video, Clock, 
  ExternalLink, MessageCircle, Edit3, Send, User, Phone, Check, X, Trash2,
  CheckCircle2, Building, Sparkles, Lock, ShieldCheck
} from 'lucide-react';
import { SystemUser } from '../types';

export interface Asesoria {
  id: string;
  subject: string;
  requestedDate: string;
  status: 'Pendiente' | 'Aceptada' | 'Programada' | 'Completada' | 'Rechazada';
  notes?: string;
  authorName: string;
  authorPhone?: string;
  authorUserId?: string;
  clientInfo?: string;
  price?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  meetLink?: string;
  adminResponse?: string;
  createdAt: string;
  assignedUserId?: string;
  assignedUserName?: string;
}

export default function AsesoriasView({ 
  asesorias, 
  setAsesorias, 
  currentUser, 
  isAdmin,
  usuariosList = []
}: { 
  asesorias: Asesoria[], 
  setAsesorias: React.Dispatch<React.SetStateAction<Asesoria[]>>, 
  currentUser: SystemUser | null, 
  isAdmin: boolean,
  usuariosList?: SystemUser[]
}) {
  // Request & Direct Scheduling Form state
  const [subject, setSubject] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [meetLink, setMeetLink] = useState('');
  const [price, setPrice] = useState('');
  const [clientInfo, setClientInfo] = useState('');
  const [authorPhone, setAuthorPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  
  // Notification message
  const [successMsg, setSuccessMsg] = useState('');

  // Active editing item
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState<string>('');
  const [editClientInfo, setEditClientInfo] = useState<string>('');
  const [editAuthorPhone, setEditAuthorPhone] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editScheduledDate, setEditScheduledDate] = useState<string>('');
  const [editScheduledTime, setEditScheduledTime] = useState<string>('');
  const [editMeetLink, setEditMeetLink] = useState<string>('');
  const [editAdminResponse, setEditAdminResponse] = useState<string>('');
  const [editStatus, setEditStatus] = useState<Asesoria['status']>('Programada');
  const [editAssignedUserId, setEditAssignedUserId] = useState<string>('');

  // Inline delete confirmation (solves iframe window.confirm blockage)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Video Meeting Generators
  const generateGoogleMeetLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const pick = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${pick(3)}-${pick(4)}-${pick(3)}`;
  };

  const generateZoomLink = () => {
    const meetingId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    return `https://zoom.us/j/${meetingId}`;
  };

  const openGoogleMeetNew = () => {
    window.open('https://meet.google.com/new', '_blank');
  };

  // Safe date formatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Sin fecha';
    try {
      const cleanStr = dateStr.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const dt = new Date(dateStr);
      return isNaN(dt.getTime()) ? dateStr : dt.toLocaleDateString('es-PE');
    } catch {
      return dateStr;
    }
  };

  // Safe phone cleaner
  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  // WhatsApp link generator
  const generateWhatsAppLink = (a: Asesoria, targetNumber?: string) => {
    let phoneToUse = targetNumber ? cleanPhone(targetNumber) : '';
    if (!phoneToUse) {
      phoneToUse = a.authorPhone ? cleanPhone(a.authorPhone) : '51966000500';
    }
    
    // Normalize Peruvian numbers
    if (phoneToUse.length === 9) {
      phoneToUse = `51${phoneToUse}`;
    }

    const priceText = a.price !== undefined && !isNaN(Number(a.price))
      ? `💰 *Precio:* S/. ${Number(a.price).toFixed(2)} Soles`
      : null;

    const lines = [
      `*GESTIÓN DE ASESORÍA TÉCNICA / CLASE - INNOVA CONTRATISTAS*`,
      `---------------------------------`,
      `📌 *Tema:* ${a.subject}`,
      `👤 *Solicitante:* ${a.authorName}`,
      a.assignedUserName ? `🎯 *Asignado a Usuario:* ${a.assignedUserName}` : null,
      a.clientInfo ? `🏢 *Cliente/Proyecto:* ${a.clientInfo}` : null,
      a.authorPhone ? `📞 *Teléfono:* ${a.authorPhone}` : null,
      priceText,
      a.scheduledDate ? `📅 *Fecha Programada:* ${formatDate(a.scheduledDate)}` : (a.requestedDate ? `📅 *Fecha Sugerida:* ${formatDate(a.requestedDate)}` : null),
      a.scheduledTime ? `⏰ *Hora:* ${a.scheduledTime}` : null,
      a.meetLink ? `🎥 *Enlace Videollamada:* ${a.meetLink}` : null,
      a.adminResponse ? `📄 *Indicaciones / Comprobante:* ${a.adminResponse}` : null,
      `---------------------------------`,
      `*Estado:* ${a.status.toUpperCase()}`
    ].filter(Boolean).join('\n');

    return `https://wa.me/${phoneToUse}?text=${encodeURIComponent(lines)}`;
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const handleAddAsesoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !requestedDate) return;
    
    const assignedUser = usuariosList.find(u => u.id === assignedUserId);
    const numericPrice = parseFloat(price);
    const validPrice = !isNaN(numericPrice) && numericPrice >= 0 ? numericPrice : undefined;

    const newAsesoria: Asesoria = {
      id: Date.now().toString(),
      subject: subject.trim(),
      requestedDate,
      clientInfo: clientInfo.trim() || undefined,
      authorPhone: authorPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      status: isAdmin ? (meetLink || assignedUserId ? 'Programada' : 'Aceptada') : 'Pendiente',
      authorName: currentUser?.name || (isAdmin ? 'Administrador' : 'Usuario'),
      authorUserId: currentUser?.id || (isAdmin ? 'admin' : undefined),
      assignedUserId: assignedUserId || undefined,
      assignedUserName: assignedUser?.name || undefined,
      scheduledDate: isAdmin ? requestedDate : undefined,
      scheduledTime: isAdmin && scheduledTime ? scheduledTime.trim() : undefined,
      meetLink: isAdmin && meetLink ? meetLink.trim() : undefined,
      price: validPrice,
      adminResponse: isAdmin && adminResponse ? adminResponse.trim() : undefined,
      createdAt: new Date().toISOString()
    };
    
    setAsesorias(prev => [newAsesoria, ...prev]);
    setSubject('');
    setRequestedDate('');
    setClientInfo('');
    setAuthorPhone('');
    setNotes('');
    setAssignedUserId('');
    setMeetLink('');
    setPrice('');
    setAdminResponse('');
    setScheduledTime('10:00 AM');
    showNotification(isAdmin ? '✓ Asesoría / Clase programada y guardada con éxito' : '✓ Solicitud de asesoría enviada con éxito');
  };

  const startEditing = (a: Asesoria) => {
    setActiveEditingId(a.id);
    setEditSubject(a.subject || '');
    setEditClientInfo(a.clientInfo || '');
    setEditAuthorPhone(a.authorPhone || '');
    setEditNotes(a.notes || '');
    setEditPrice(a.price !== undefined ? a.price.toString() : '');
    setEditScheduledDate(a.scheduledDate || a.requestedDate || '');
    setEditScheduledTime(a.scheduledTime || '10:00 AM');
    setEditMeetLink(a.meetLink || '');
    setEditAdminResponse(a.adminResponse || '');
    setEditStatus(a.status === 'Pendiente' ? 'Programada' : a.status);
    setEditAssignedUserId(a.assignedUserId || '');
    setDeleteConfirmId(null);
  };

  const handleSaveAdminResponse = (id: string, overrideStatus?: Asesoria['status']) => {
    const numericPrice = parseFloat(editPrice);
    const validPrice = !isNaN(numericPrice) && numericPrice >= 0 ? numericPrice : undefined;
    const finalStatus = overrideStatus || editStatus;
    const assignedUser = usuariosList.find(u => u.id === editAssignedUserId);

    setAsesorias(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          subject: editSubject.trim() || a.subject,
          clientInfo: editClientInfo.trim() || undefined,
          authorPhone: editAuthorPhone.trim() || undefined,
          notes: editNotes.trim() || undefined,
          status: finalStatus,
          price: validPrice,
          scheduledDate: editScheduledDate || undefined,
          scheduledTime: editScheduledTime.trim() || undefined,
          meetLink: editMeetLink.trim() || undefined,
          adminResponse: editAdminResponse.trim() || undefined,
          assignedUserId: editAssignedUserId || undefined,
          assignedUserName: assignedUser?.name || undefined
        };
      }
      return a;
    }));

    setActiveEditingId(null);
    showNotification(overrideStatus === 'Rechazada' ? '✓ Asesoría rechazada' : '✓ Cambios guardados correctamente');
  };

  const handleQuickStatusChange = (id: string, newStatus: Asesoria['status']) => {
    setAsesorias(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          status: newStatus
        };
      }
      return a;
    }));
    showNotification(`✓ Estado cambiado a "${newStatus}"`);
  };

  const confirmDelete = (id: string) => {
    setAsesorias(prev => prev.filter(a => a.id !== id));
    if (activeEditingId === id) {
      setActiveEditingId(null);
    }
    setDeleteConfirmId(null);
    showNotification('✓ Asesoría eliminada del sistema');
  };

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: asesorias.length,
      Pendiente: 0,
      Aceptada: 0,
      Programada: 0,
      Completada: 0,
      Rechazada: 0
    };
    asesorias.forEach(a => {
      if (counts[a.status] !== undefined) {
        counts[a.status]++;
      }
    });
    return counts;
  }, [asesorias]);

  const filteredAsesorias = asesorias.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast notification banner */}
      {successMsg && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-sm font-semibold animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{successMsg}</span>
          </div>
          <button 
            onClick={() => setSuccessMsg('')} 
            className="text-emerald-200 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 text-blue-500">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Asesorías Técnicas & Clases</h1>
            <p className="text-slate-500 mt-0.5">
              {isAdmin 
                ? 'Programa clases, genera enlaces de Google Meet / Zoom, asigna horarios a usuarios y gestiona solicitudes.' 
                : 'Solicita asesorías especializadas para resolver dudas técnicas, presupuestos o contratos.'}
            </p>
          </div>
        </div>
      </header>

      {/* Official WhatsApp banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Canal Oficial de WhatsApp</p>
            <p className="text-xs text-slate-600">
              Coordinación y envío de comprobantes: <strong className="text-blue-700 font-mono">+51 966 000 500</strong>
            </p>
          </div>
        </div>
        <a 
          href="https://wa.me/51966000500?text=Hola%20Innova%20Contratistas%2C%20tengo%20una%20consulta%20sobre%20las%20asesor%C3%ADas%20t%C3%A9cnicas" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Escribir al WhatsApp (+51 966 000 500)</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request / Program Form (Left Column) */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddAsesoria} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              {isAdmin ? 'Programar Asesoría o Clase' : 'Solicitar Nueva Asesoría'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Tema o Motivo de la Asesoría / Clase *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Ej. Revisión de planos estructurales de nave industrial"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Asignar al Usuario (Recibirá notificación)
                  </label>
                  <select
                    value={assignedUserId}
                    onChange={e => setAssignedUserId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-700"
                  >
                    <option value="">-- Seleccionar usuario registrado con PIN --</option>
                    {usuariosList.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} (PIN: {u.pin})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Cliente o Proyecto (Opcional)
                </label>
                <input
                  type="text"
                  value={clientInfo}
                  onChange={e => setClientInfo(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Ej. Almacén Lurín / Empresa Metal Perú"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    {isAdmin ? 'Fecha de Clase / Asesoría *' : 'Fecha Sugerida *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={requestedDate}
                    onChange={e => setRequestedDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Horario
                    </label>
                    <input
                      type="text"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Admin Quick Times Helper */}
              {isAdmin && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Horas rápidas:</span>
                  {['09:00 AM', '11:00 AM', '03:00 PM', '05:00 PM', '07:00 PM'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setScheduledTime(t)}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors cursor-pointer"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Admin Google Meet / Zoom Links Form */}
              {isAdmin && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Enlace de Videollamada
                    </label>
                    <span className="text-[10px] text-blue-600 font-bold">Google Meet / Zoom</span>
                  </div>

                  <input
                    type="url"
                    value={meetLink}
                    onChange={e => setMeetLink(e.target.value)}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                  {/* Quick Video Room Generator Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMeetLink(generateGoogleMeetLink())}
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      title="Genera un enlace válido instantáneo de Google Meet"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>+ Google Meet Rápido</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMeetLink(generateZoomLink())}
                      className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                      title="Genera un enlace de reunión Zoom"
                    >
                      <Video className="w-3 h-3 text-blue-600" />
                      <span>+ Zoom</span>
                    </button>

                    <button
                      type="button"
                      onClick={openGoogleMeetNew}
                      className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer ml-auto"
                      title="Abrir meet.google.com/new para crear reunión oficial con tu cuenta"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>meet.new</span>
                    </button>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Precio en Soles (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400 font-bold text-xs">S/.</span>
                    <input
                      type="number"
                      step="0.10"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp de Contacto
                </label>
                <input
                  type="text"
                  value={authorPhone}
                  onChange={e => setAuthorPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="Ej. 987654321"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  {isAdmin ? 'Indicaciones / Temario para el Alumno' : 'Detalles o Preguntas Previas'}
                </label>
                <textarea
                  rows={2}
                  value={isAdmin ? adminResponse : notes}
                  onChange={e => isAdmin ? setAdminResponse(e.target.value) : setNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                  placeholder={isAdmin ? 'Indica temas a tratar, requerimientos para la clase o cuentas de pago...' : 'Indica tus preguntas clave o requerimientos para la videollamada...'}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start">
                <Video className="w-5 h-5 text-blue-500 mr-2.5 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  {isAdmin 
                    ? 'Al programar la asesoría, el usuario seleccionado recibirá el enlace de Google Meet/Zoom y una notificación directa en su Panel de Control.'
                    : 'Al enviar la solicitud, el administrador confirmará la fecha, el enlace de Google Meet/Zoom y el costo en Soles (PEN).'}
                </p>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isAdmin ? 'Programar y Enviar Asesoría / Clase' : 'Enviar Solicitud de Asesoría'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Asesorías List (Right Columns) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Filter tabs */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase px-2">Filtrar:</span>
            {[
              { id: 'all', label: 'Todas', count: statusCounts.all },
              { id: 'Pendiente', label: 'Pendientes', count: statusCounts.Pendiente },
              { id: 'Aceptada', label: 'Aceptadas', count: statusCounts.Aceptada },
              { id: 'Programada', label: 'Programadas', count: statusCounts.Programada },
              { id: 'Completada', label: 'Completadas', count: statusCounts.Completada },
              { id: 'Rechazada', label: 'Rechazadas', count: statusCounts.Rechazada }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{f.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterStatus === f.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* List Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {isAdmin ? 'Solicitudes y Clases Programadas' : 'Tus Asesorías y Clases'}
                </h2>
                <p className="text-xs text-slate-500">
                  Total mostradas: {filteredAsesorias.length} registro{filteredAsesorias.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            
            {filteredAsesorias.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="font-semibold text-slate-600">No hay asesorías registradas en esta vista.</p>
                <p className="text-sm text-slate-400 mt-1">Usa el formulario para programar o solicitar una nueva asesoría técnica.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAsesorias.map(a => {
                  const isEditingThis = activeEditingId === a.id;
                  const isConfirmingDelete = deleteConfirmId === a.id;
                  const authorPhoneClean = cleanPhone(a.authorPhone);
                  
                  // Verification of ownership or admin privileges
                  const isOwnerOrAssigned = 
                    isAdmin || 
                    Boolean(currentUser && (
                      (a.assignedUserId && a.assignedUserId === currentUser.id) ||
                      (a.assignedUserName && a.assignedUserName.toLowerCase() === currentUser.name.toLowerCase()) ||
                      (a.authorName && a.authorName.toLowerCase() === currentUser.name.toLowerCase()) ||
                      (a.authorUserId && a.authorUserId === currentUser.id)
                    ));

                  return (
                    <div key={a.id} className="p-6 hover:bg-slate-50/60 transition-colors space-y-4">
                      {/* Header info & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-base sm:text-lg">{a.subject}</h3>
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                              a.status === 'Pendiente' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                              a.status === 'Aceptada' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                              a.status === 'Programada' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              a.status === 'Completada' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              'bg-rose-100 text-rose-800 border-rose-200'
                            }`}>
                              {a.status}
                            </span>
                            {a.assignedUserName && (
                              <span className="flex items-center text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-xs">
                                <User className="w-3.5 h-3.5 mr-1 text-blue-500" />
                                Para usuario: {a.assignedUserName}
                              </span>
                            )}
                            {!isOwnerOrAssigned && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Sesión Privada</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center">
                              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              Registrado por: <strong className="ml-1 text-slate-700">{a.authorName}</strong>
                            </span>
                            {a.clientInfo && (
                              <span className="flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                <Building className="w-3 h-3 mr-1 text-slate-400" />
                                {a.clientInfo}
                              </span>
                            )}
                            {a.authorPhone && isOwnerOrAssigned && (
                              <span className="flex items-center text-slate-600 font-mono">
                                <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                {a.authorPhone}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              Fecha: {formatDate(a.scheduledDate || a.requestedDate)}
                            </span>
                          </div>
                          
                          {a.notes && isOwnerOrAssigned && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                              <span className="font-semibold text-slate-700">Consulta previa: </span>
                              {a.notes}
                            </p>
                          )}
                        </div>

                        {/* Top Action buttons */}
                        <div className="flex flex-wrap sm:flex-col items-end gap-2 flex-shrink-0">
                          {/* Admin primary action buttons */}
                          {isAdmin && !isEditingThis && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Quick accept button for pending */}
                              {a.status === 'Pendiente' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(a.id, 'Aceptada')}
                                  className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                  title="Aceptar esta solicitud"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aceptar</span>
                                </button>
                              )}

                              {/* Quick complete button for accepted/scheduled */}
                              {(a.status === 'Aceptada' || a.status === 'Programada') && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(a.id, 'Completada')}
                                  className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                                  title="Marcar como Completada"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Completar</span>
                                </button>
                              )}

                              {/* Edit / Program details */}
                              <button
                                type="button"
                                onClick={() => startEditing(a)}
                                className="inline-flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{a.status === 'Pendiente' ? 'Cotizar / Programar' : 'Editar Asesoría'}</span>
                              </button>

                              {/* Inline Safe Delete */}
                              {isConfirmingDelete ? (
                                <div className="inline-flex items-center space-x-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl">
                                  <span className="text-[11px] font-bold text-rose-700">¿Eliminar?</span>
                                  <button
                                    type="button"
                                    onClick={() => confirmDelete(a.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Sí
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(a.id)}
                                  className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                  title="Eliminar asesoría"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Regular User actions (if user requested and wants to edit or cancel their own pending request) */}
                          {!isAdmin && isOwnerOrAssigned && a.status === 'Pendiente' && !isEditingThis && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditing(a)}
                                className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Modificar</span>
                              </button>

                              {isConfirmingDelete ? (
                                <div className="inline-flex items-center space-x-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl">
                                  <span className="text-[11px] font-bold text-rose-700">¿Cancelar?</span>
                                  <button
                                    type="button"
                                    onClick={() => confirmDelete(a.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Sí
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(a.id)}
                                  className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Cancelar</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scheduled & Pricing Details Bar */}
                      {(a.price !== undefined || a.scheduledDate || a.meetLink || a.adminResponse) && (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 rounded-xl border border-slate-200/80 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Price */}
                            {a.price !== undefined && !isNaN(Number(a.price)) && (
                              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Costo de Asesoría</p>
                                <p className="text-xl font-bold text-emerald-600 font-mono">
                                  S/. {Number(a.price).toFixed(2)}
                                </p>
                              </div>
                            )}

                            {/* Scheduled Date & Time */}
                            {a.scheduledDate && (
                              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cita Programada</p>
                                <p className="text-sm font-bold text-slate-800 flex items-center mt-0.5">
                                  <Clock className="w-4 h-4 mr-1 text-blue-500 flex-shrink-0" />
                                  <span>{formatDate(a.scheduledDate)} {a.scheduledTime ? `| ${a.scheduledTime}` : ''}</span>
                                </p>
                              </div>
                            )}

                            {/* Video Call Link: PRIVACY GUARD */}
                            {a.meetLink && (
                              isOwnerOrAssigned ? (
                                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-center">
                                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Tu Enlace de Videollamada</span>
                                  </p>
                                  <a
                                    href={a.meetLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                                  >
                                    <Video className="w-4 h-4 text-indigo-500" />
                                    <span>Unirse a la llamada</span>
                                    <ExternalLink className="w-3 h-3 ml-0.5" />
                                  </a>
                                </div>
                              ) : (
                                <div className="bg-slate-100/90 p-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-center">
                                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>Videollamada Privada</span>
                                  </p>
                                  <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                    <span>Sesión programada en camino</span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          {/* Admin Response / Notes */}
                          {a.adminResponse && (
                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                              <p className="font-bold text-slate-700 mb-0.5">Indicaciones / Temario / Pago:</p>
                              <p className="text-slate-600 whitespace-pre-line">
                                {isOwnerOrAssigned ? a.adminResponse : 'Sesión técnica coordinada en privado con el docente/administrador.'}
                              </p>
                            </div>
                          )}

                          {/* Direct WhatsApp Contact Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                            <span className="text-xs text-slate-500">Enviar comprobante o consultar:</span>
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Direct to Client WhatsApp if phone was provided and user is authorized */}
                              {authorPhoneClean && isOwnerOrAssigned && (
                                <a
                                  href={generateWhatsAppLink(a, authorPhoneClean)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                  title={`Enviar WhatsApp a ${a.authorName} (${a.authorPhone})`}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp Solicitante ({a.authorPhone})</span>
                                </a>
                              )}

                              {/* Official Company WhatsApp */}
                              <a
                                href={generateWhatsAppLink(a, '51966000500')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                                title="Enviar comprobante al WhatsApp Oficial"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>WhatsApp Oficial (966000500)</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin/User Detailed Edit Form */}
                      {isEditingThis && (
                        <div className="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-200 space-y-4 animate-fadeIn">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center">
                              <Edit3 className="w-4 h-4 mr-1.5 text-indigo-600" />
                              {isAdmin ? 'Gestionar y Programar Asesoría' : 'Modificar Solicitud de Asesoría'}
                            </h4>
                            <button
                              type="button"
                              onClick={() => setActiveEditingId(null)}
                              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Editable fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Tema o Asunto *
                              </label>
                              <input
                                type="text"
                                value={editSubject}
                                onChange={e => setEditSubject(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Proyecto o Referencia del Cliente
                              </label>
                              <input
                                type="text"
                                value={editClientInfo}
                                onChange={e => setEditClientInfo(e.target.value)}
                                placeholder="Ej: Obra Almacén Lurín"
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Teléfono / WhatsApp del Solicitante
                              </label>
                              <input
                                type="text"
                                value={editAuthorPhone}
                                onChange={e => setEditAuthorPhone(e.target.value)}
                                placeholder="Ej: 987654321"
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>

                            {/* Status dropdown (Admin only) */}
                            {isAdmin ? (
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Estado de la Asesoría
                                </label>
                                <select
                                  value={editStatus}
                                  onChange={e => setEditStatus(e.target.value as Asesoria['status'])}
                                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                  <option value="Programada">Programada</option>
                                  <option value="Aceptada">Aceptada</option>
                                  <option value="Completada">Completada</option>
                                  <option value="Pendiente">Pendiente</option>
                                  <option value="Rechazada">Rechazada</option>
                                </select>
                              </div>
                            ) : null}
                          </div>

                          {isAdmin && (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Asignar a Usuario Específico
                              </label>
                              <select
                                value={editAssignedUserId}
                                onChange={e => setEditAssignedUserId(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                              >
                                <option value="">-- Sin usuario asignado específico --</option>
                                {usuariosList.map(u => (
                                  <option key={u.id} value={u.id}>
                                    {u.name} (PIN: {u.pin})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Notas / Preguntas del Solicitante
                            </label>
                            <textarea
                              rows={2}
                              value={editNotes}
                              onChange={e => setEditNotes(e.target.value)}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                            />
                          </div>

                          {/* Admin pricing & scheduling controls */}
                          {isAdmin && (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Precio en Soles (S/.)
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">S/.</span>
                                    <input
                                      type="number"
                                      step="0.10"
                                      value={editPrice}
                                      onChange={e => setEditPrice(e.target.value)}
                                      placeholder="Ej: 150.00"
                                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Fecha Programada
                                  </label>
                                  <input
                                    type="date"
                                    value={editScheduledDate}
                                    onChange={e => setEditScheduledDate(e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Hora Programada
                                  </label>
                                  <input
                                    type="text"
                                    value={editScheduledTime}
                                    onChange={e => setEditScheduledTime(e.target.value)}
                                    placeholder="Ej: 10:30 AM"
                                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                              </div>

                              {/* Google Meet & Zoom Dedicated Module */}
                              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Enlace de Videollamada (Google Meet / Zoom)
                                  </label>
                                  {editMeetLink && (
                                    <a
                                      href={editMeetLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                                    >
                                      <span>Probar Sala</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>

                                <input
                                  type="url"
                                  value={editMeetLink}
                                  onChange={e => setEditMeetLink(e.target.value)}
                                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                />

                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditMeetLink(generateGoogleMeetLink())}
                                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    <span>Generar Google Meet</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditMeetLink(generateZoomLink())}
                                    className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                                  >
                                    <Video className="w-3 h-3 text-blue-600" />
                                    <span>Generar Zoom</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={openGoogleMeetNew}
                                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer ml-auto"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Abrir meet.new</span>
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Indicaciones de Pago, Comprobante y Temario
                                </label>
                                <textarea
                                  rows={2}
                                  value={editAdminResponse}
                                  onChange={e => setEditAdminResponse(e.target.value)}
                                  placeholder="Indica cuentas bancarias para depósito (BCP/Yape/Plin), confirmación de comprobante o indicaciones para la reunión..."
                                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                              </div>
                            </>
                          )}

                          {/* Modal action buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-100">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Save Changes button */}
                              <button
                                type="button"
                                onClick={() => handleSaveAdminResponse(a.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                                <span>Guardar Cambios</span>
                              </button>

                              {/* Reject button (Only for Admin) - Now directly saves rejection */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveAdminResponse(a.id, 'Rechazada')}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs px-3 py-2.5 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Rechazar Asesoría</span>
                                </button>
                              )}

                              {/* Delete button with safe inline confirmation */}
                              {isConfirmingDelete ? (
                                <div className="inline-flex items-center space-x-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded-xl">
                                  <span className="text-[11px] font-bold text-rose-700">¿Confirmas borrar?</span>
                                  <button
                                    type="button"
                                    onClick={() => confirmDelete(a.id)}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Sí, borrar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(a.id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-2.5 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar Solicitud</span>
                                </button>
                              )}

                              {/* Cancel button */}
                              <button
                                type="button"
                                onClick={() => setActiveEditingId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>

                            {/* WhatsApp button inside edit form: Saves changes then opens WhatsApp */}
                            <a
                              href={generateWhatsAppLink({
                                ...a,
                                subject: editSubject || a.subject,
                                clientInfo: editClientInfo || a.clientInfo,
                                authorPhone: editAuthorPhone || a.authorPhone,
                                notes: editNotes || a.notes,
                                status: editStatus,
                                price: parseFloat(editPrice) >= 0 ? parseFloat(editPrice) : a.price,
                                scheduledDate: editScheduledDate || a.scheduledDate,
                                scheduledTime: editScheduledTime || a.scheduledTime,
                                meetLink: editMeetLink || a.meetLink,
                                adminResponse: editAdminResponse || a.adminResponse
                              }, editAuthorPhone || a.authorPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                handleSaveAdminResponse(a.id);
                              }}
                              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
                              title="Guarda los datos y abre el mensaje formateado en WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Guardar y Enviar WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
