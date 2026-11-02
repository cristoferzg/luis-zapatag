import React, { useState } from 'react';
import { 
  MessageSquare, Plus, CheckCircle, MessageCircle, User, Clock, 
  CheckCircle2, Trash2, Send, AlertCircle, RefreshCw 
} from 'lucide-react';
import { SystemUser } from '../types';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Abierto' | 'En Progreso' | 'Resuelto';
  createdAt: string;
  author: string;
  authorName: string;
  authorRole?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export default function TicketsView({ 
  tickets, 
  setTickets, 
  currentUser, 
  isAdmin 
}: { 
  tickets: Ticket[], 
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>, 
  currentUser: SystemUser | null, 
  isAdmin: boolean 
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<'all' | 'Abierto' | 'En Progreso' | 'Resuelto'>('all');
  
  // Admin resolution note input state for specific ticket
  const [activeResolvingId, setActiveResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    const newTicket: Ticket = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      status: 'Abierto',
      createdAt: new Date().toISOString(),
      author: currentUser?.id || (isAdmin ? 'admin' : 'usuario'),
      authorName: currentUser?.name || (isAdmin ? 'Administrador' : 'Usuario'),
      authorRole: currentUser?.role || (isAdmin ? 'Administrador Principal' : 'Usuario')
    };
    
    setTickets([newTicket, ...tickets]);
    setTitle('');
    setDescription('');
  };

  const updateStatus = (id: string, status: Ticket['status'], note?: string) => {
    setTickets(tickets.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status,
          ...(status === 'Resuelto' ? {
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'Administrador Principal',
            resolutionNote: note || t.resolutionNote || 'Ticket atendido y resuelto con éxito.'
          } : {})
        };
      }
      return t;
    }));
    setActiveResolvingId(null);
    setResolutionText('');
  };

  const handleDeleteTicket = (id: string) => {
    if (window.confirm('¿Deseas eliminar este ticket de reporte?')) {
      setTickets(tickets.filter(t => t.id !== id));
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const countPending = tickets.filter(t => t.status === 'Abierto').length;
  const countInProgress = tickets.filter(t => t.status === 'En Progreso').length;
  const countResolved = tickets.filter(t => t.status === 'Resuelto').length;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-3 rounded-xl bg-white shadow-sm border border-slate-100 text-rose-500">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Mesa de Ayuda y Reportes</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isAdmin 
                ? 'Monitorea las consultas, revisa quién envió cada ticket y marca como resuelto con respuestas inmediatas.' 
                : 'Envía tus dudas o problemas técnicos. El administrador atenderá tu reporte y verás su respuesta aquí.'}
            </p>
          </div>
        </div>
      </header>

      {/* WhatsApp banner */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Soporte y Atención Directa por WhatsApp</p>
            <p className="text-xs text-slate-600">
              Coordinación rápida y asistencia técnica al número: <strong className="text-emerald-700 font-mono">+51 966 000 500</strong>
            </p>
          </div>
        </div>
        <a 
          href="https://wa.me/51966000500?text=Hola%20Innova%20Contratistas%2C%20tengo%20un%20reporte%20o%20consulta%20t%C3%A9cnica" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Contactar WhatsApp 966000500</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Nuevo Reporte */}
        <div className="lg:col-span-1">
          <form onSubmit={handleAddTicket} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-rose-500" />
                Nuevo Ticket
              </h2>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                {currentUser?.name || (isAdmin ? 'Admin' : 'Usuario')}
              </span>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Título o Asunto</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm"
                placeholder="Ej. Error al registrar cobro de obra"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Descripción Detallada</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all resize-none text-sm"
                placeholder="Explica qué sucedió, en qué sección y qué necesitas..."
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Ticket de Soporte</span>
            </button>
          </form>
        </div>

        {/* Lista de Tickets con estados y respuestas */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de Filtros */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === 'all' 
                    ? 'bg-slate-800 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({tickets.length})
              </button>
              <button
                onClick={() => setFilter('Abierto')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === 'Abierto' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Abiertos ({countPending})
              </button>
              <button
                onClick={() => setFilter('En Progreso')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === 'En Progreso' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                En Progreso ({countInProgress})
              </button>
              <button
                onClick={() => setFilter('Resuelto')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filter === 'Resuelto' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Resueltos ({countResolved})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2 text-rose-500" />
                Historial de Reportes
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {filteredTickets.length} ticket{filteredTickets.length === 1 ? '' : 's'}
              </span>
            </div>
            
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" />
                <p className="font-bold text-slate-700">No hay tickets en este estado.</p>
                <p className="text-xs text-slate-400 mt-1">Los nuevos reportes se mostrarán en esta sección.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTickets.map(t => {
                  const isResolving = activeResolvingId === t.id;
                  
                  return (
                    <div key={t.id} className="p-6 hover:bg-slate-50/70 transition-colors space-y-4">
                      {/* Ticket Header & Author Info */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                            <h3 className="font-bold text-slate-800 text-lg">{t.title}</h3>
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                              t.status === 'Abierto' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              t.status === 'En Progreso' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}>
                              {t.status}
                            </span>
                          </div>

                          {/* Remitente claro para que el administrador sepa quién lo mandó */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center text-slate-700 font-medium bg-slate-100 px-2.5 py-1 rounded-lg">
                              <User className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                              Remitente: <strong className="ml-1 text-slate-900">{t.authorName}</strong>
                              {t.authorRole && <span className="ml-1 text-slate-500">({t.authorRole})</span>}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                              {new Date(t.createdAt).toLocaleString('es-PE')}
                            </span>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        {isAdmin && (
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {t.status !== 'En Progreso' && (
                              <button 
                                onClick={() => updateStatus(t.id, 'En Progreso')}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                              >
                                En Progreso
                              </button>
                            )}
                            
                            {t.status !== 'Resuelto' && (
                              <button 
                                onClick={() => {
                                  setActiveResolvingId(t.id);
                                  setResolutionText(t.resolutionNote || '');
                                }}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs flex items-center space-x-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Marcar Resuelto</span>
                              </button>
                            )}

                            {t.status === 'Resuelto' && (
                              <button 
                                onClick={() => updateStatus(t.id, 'Abierto')}
                                className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center space-x-1"
                                title="Reabrir ticket"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reabrir</span>
                              </button>
                            )}

                            <button 
                              onClick={() => handleDeleteTicket(t.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar reporte"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Ticket Description */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {t.description}
                      </div>

                      {/* Resolving Box for Admin */}
                      {isAdmin && isResolving && (
                        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3 animate-fadeIn">
                          <p className="text-xs font-bold text-emerald-800 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                            Responder y Marcar como Resuelto
                          </p>
                          <textarea
                            rows={2}
                            value={resolutionText}
                            onChange={e => setResolutionText(e.target.value)}
                            placeholder="Escribe la solución dada o mensaje al usuario (ej. 'Se revisó y se actualizó el registro en el sistema')..."
                            className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateStatus(t.id, 'Resuelto', resolutionText)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shadow-2xs"
                            >
                              Confirmar y Marcar Resuelto
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveResolvingId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-xs px-3 py-2 rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Banner de Estado para el Usuario y Admin cuando está Resuelto */}
                      {t.status === 'Resuelto' && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                              <span className="font-bold text-emerald-900 text-sm">
                                Este ticket fue atentido y resuelto por el Administrador
                              </span>
                            </div>
                            {t.resolvedAt && (
                              <span className="text-xs text-emerald-700 font-medium">
                                Resuelto el: {new Date(t.resolvedAt).toLocaleString('es-PE')}
                              </span>
                            )}
                          </div>
                          {t.resolutionNote && (
                            <div className="bg-white/80 p-3 rounded-lg border border-emerald-100 text-xs text-slate-700">
                              <span className="font-bold text-emerald-800 block mb-1 uppercase tracking-wider">
                                Respuesta del Administrador:
                              </span>
                              <p className="whitespace-pre-line">{t.resolutionNote}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Estado cuando está En Progreso */}
                      {t.status === 'En Progreso' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-amber-800 font-medium">
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>El administrador está revisando y atendiendo este reporte actualmente.</span>
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
