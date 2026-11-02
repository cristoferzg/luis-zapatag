import React, { useState } from 'react';
import { MessageSquare, BookOpen, Headset } from 'lucide-react';
import { SystemUser } from '../types';
import TicketsView, { Ticket } from './TicketsView';
import AsesoriasView, { Asesoria } from './AsesoriasView';
import { useFirestoreArraySync } from '../lib/db';

interface SoporteYAsesoriasViewProps {
  tickets?: Ticket[];
  setTickets?: React.Dispatch<React.SetStateAction<Ticket[]>>;
  asesorias?: Asesoria[];
  setAsesorias?: React.Dispatch<React.SetStateAction<Asesoria[]>>;
  currentUser: SystemUser | null;
  isAdmin: boolean;
  initialSubTab?: 'tickets' | 'asesorias';
  usuariosList?: SystemUser[];
}

export default function SoporteYAsesoriasView({
  tickets: propTickets,
  setTickets: propSetTickets,
  asesorias: propAsesorias,
  setAsesorias: propSetAsesorias,
  currentUser,
  isAdmin,
  initialSubTab = 'tickets',
  usuariosList: propUsuariosList
}: SoporteYAsesoriasViewProps) {
  const [activeTab, setActiveTab] = useState<'tickets' | 'asesorias'>(initialSubTab);
  
  const activeUid = currentUser ? ('user_' + currentUser.id) : (isAdmin ? 'admin' : 'shared');
  
  const [internalTickets, setInternalTickets] = useFirestoreArraySync<Ticket>('tickets', activeUid, true);
  const [internalAsesorias, setInternalAsesorias] = useFirestoreArraySync<Asesoria>('asesorias', activeUid, true);
  const [internalUsuariosList] = useFirestoreArraySync<SystemUser>('usuarios', activeUid, true);

  const tickets = propTickets || internalTickets;
  const setTickets = propSetTickets || setInternalTickets;
  const asesorias = propAsesorias || internalAsesorias;
  const setAsesorias = propSetAsesorias || setInternalAsesorias;
  const usuariosList = propUsuariosList || internalUsuariosList;

  // Counter metrics for tabs
  const openTicketsCount = tickets.filter(t => t.status === 'Abierto' || t.status === 'En Progreso').length;
  const pendingAsesoriasCount = asesorias.filter(a => a.status === 'Pendiente' || a.status === 'Programada').length;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-3xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Headset className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
              Centro de Atención & Asesorías
            </h1>
          </div>
          <p className="text-slate-500 text-xs font-medium pl-1">
            Módulo centralizado para reportes de servicio, soporte técnico y solicitud de asesorías de ingeniería.
          </p>
        </div>

        {/* UNIFIED TABS SWITCHER */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>Reportes & Soporte</span>
            {openTicketsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'tickets' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
              }`}>
                {openTicketsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('asesorias')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'asesorias'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Asesorías Técnicas</span>
            {pendingAsesoriasCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'asesorias' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {pendingAsesoriasCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE TAB CONTENT */}
      {activeTab === 'tickets' ? (
        <TicketsView 
          tickets={tickets} 
          setTickets={setTickets} 
          currentUser={currentUser} 
          isAdmin={isAdmin} 
        />
      ) : (
        <AsesoriasView 
          asesorias={asesorias} 
          setAsesorias={setAsesorias} 
          currentUser={currentUser} 
          isAdmin={isAdmin} 
          usuariosList={usuariosList}
        />
      )}
    </div>
  );
}
