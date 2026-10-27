import { useCatalogo, migrarPreciosAntiguos, hidratarCatalogo, EstadoCatalogo } from './lib/catalogoPrecios';
import { INVENTARIO_PERFILES_TUBULARES } from './components/techos/techosCadCatalog';
import { EmpresaProvider, datosDesdeSettings, settingsDesdeDatos, DatosEmpresa } from './lib/empresa';
import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { 
  Briefcase, Calculator, Users, DollarSign, Activity, 
  Settings, AlertCircle, TrendingUp, TrendingDown, Home, CreditCard, Menu, Plus, 
  Edit2, Trash2, ArrowRight, 
  FileSignature, Package, 
  PenTool, Video, ExternalLink, ShieldCheck, FolderKanban, X
} from 'lucide-react';
import { performAdminBackup } from './lib/backupService';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { auth, authReady } from './lib/firebase';
import { loginWithPinViaFunction } from './lib/pinAuth';
import { useFirestoreArraySync } from './lib/db';
import { setAICtx, cargarEstadoIA } from './lib/aiAccess';
import type { Ticket } from './components/TicketsView';
import type { Asesoria } from './components/AsesoriasView';
import { BookOpen, Key, DoorClosed, Headset, ChevronLeft, ChevronRight, Box, Wrench, Crown, PanelsTopLeft, Eye } from 'lucide-react';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import type { BibliotecaItem } from './components/BibliotecaPremiumView';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import type { TutorialVideo, CourseCategory } from './components/UsabilidadVideosView';
import MantenimientoView from './components/MantenimientoView';
import { safeStorage } from './lib/storageManager';
import defaultAdminLogo from './assets/images/logo_innova_oficial_1791000137990.jpg';

import { formatCurrencyWithSymbol } from './lib/currency';

// Módulos pesados: se descargan recién al abrirlos (arranque más rápido en el celular).
const CatalogoPreciosView = lazy(() => import('./components/CatalogoPreciosView'));
const CotizadorRapidoView = lazy(() => import('./components/CotizadorRapidoView'));
const UsuariosView = lazy(() => import('./components/UsuariosView'));
const SoporteYAsesoriasView = lazy(() => import('./components/SoporteYAsesoriasView'));
const MaterialesYGastosView = lazy(() => import('./components/MaterialesYGastosView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const DiseñadorView = lazy(() => import('./components/DiseñadorView'));
const HerreriaModuleView = lazy(() => import('./components/herreria/HerreriaModuleView'));
const TechosModuleView = lazy(() => import('./components/techos/TechosModuleView'));
const AdminPurchasesView = lazy(() => import('./components/AdminPurchasesView'));
const SupervisionView = lazy(() => import('./components/SupervisionView'));
const ContratosYEPPView = lazy(() => import('./components/ContratosYEPPView'));
const ProyectosYClientesView = lazy(() => import('./components/ProyectosYClientesView'));
const PersonalYAsistenciaView = lazy(() => import('./components/PersonalYAsistenciaView'));
const ConcretoMetradosView = lazy(() => import('./components/ConcretoMetradosView'));
const DrywallView = lazy(() => import('./components/DrywallView'));
const BibliotecaPremiumView = lazy(() => import('./components/BibliotecaPremiumView'));
const UsabilidadVideosView = lazy(() => import('./components/UsabilidadVideosView'));

export * from './types';
import { ViewType, Project, Client, FinanceRecord, SystemUser, SystemConfig, GlobalNotification } from './types';

const formatCurrency = (amount: number) => formatCurrencyWithSymbol(amount);

const AnnouncementBanner = ({ notifications, isAdmin, setNotifications }: { notifications: GlobalNotification[], isAdmin: boolean, setNotifications?: (notifs: GlobalNotification[]) => void }) => {
  const [now, setNow] = useState(Date.now());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAnnouncements = notifications.filter(notif => {
    const expiresAt = notif.expiresAtTimestamp || (notif.createdAtTimestamp + 24 * 60 * 60 * 1000);
    return expiresAt > now;
  });

  // Deslizamiento automático cada 5.5 segundos cuando hay múltiples comunicados
  useEffect(() => {
    if (activeAnnouncements.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [activeAnnouncements.length, isPaused]);

  if (activeAnnouncements.length === 0) return null;

  const safeIndex = activeAnnouncements.length > 0 ? (currentIndex % activeAnnouncements.length) : 0;
  const notif = activeAnnouncements[safeIndex];
  if (!notif) return null;

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('¿Eliminar este comunicado para todos los usuarios?')) {
      if (setNotifications) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    }
  };

  const expiresAt = notif.expiresAtTimestamp || (notif.createdAtTimestamp + 24 * 60 * 60 * 1000);
  const diffMs = expiresAt - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  const countdownStr = diffMs > 0 ? `${hours}h ${minutes}m ${seconds}s` : 'Expirado';

  let priorityBorder = 'border-slate-200 bg-white';
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  let badgeText = '📌 Comunicado';

  if (notif.priority === 'important') {
    priorityBorder = 'border-amber-200 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
    badgeText = '⚠️ Importante';
  } else if (notif.priority === 'alert') {
    priorityBorder = 'border-rose-200 bg-gradient-to-r from-rose-50/50 via-white to-rose-50/30';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
    badgeText = '🚨 Urgente';
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeAnnouncements.length);
  };

  return (
    <div 
      className="mb-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className={`p-4 sm:p-5 rounded-2xl border ${priorityBorder} shadow-2xs relative flex flex-col justify-between gap-3 transition-all duration-300 overflow-hidden`}>
        {/* Barra superior del comunicado unificado */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 pb-2.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-3xs ${badgeColor}`}>
              {badgeText}
            </span>
            <span className="text-[11px] text-slate-400 font-medium truncate">
              Publicado por <strong className="text-slate-700">{notif.author || 'Administración'}</strong>
            </span>
            {notif.date && (
              <span className="text-[10px] text-slate-400 hidden sm:inline">• {notif.date}</span>
            )}
          </div>

          {/* Controles de deslizamiento (Auto-slide & flechas) */}
          <div className="flex items-center gap-2 shrink-0">
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100/90 px-2 py-0.5 rounded-xl border border-slate-200/70 text-[10px] font-bold text-slate-600 shadow-3xs">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1 hover:bg-white rounded-md transition-colors cursor-pointer text-slate-500 hover:text-slate-900"
                  title="Comunicado anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-1 font-mono">
                  {safeIndex + 1} / {activeAnnouncements.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1 hover:bg-white rounded-md transition-colors cursor-pointer text-slate-500 hover:text-slate-900"
                  title="Siguiente comunicado"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Cuenta regresiva de expiración */}
            <div className="hidden sm:flex items-center gap-1.5 text-right bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase">Expira:</span>
              <span className="text-[11px] font-mono font-black text-slate-700">
                {countdownStr}
              </span>
            </div>

            {/* Botón de eliminación solo Administrador */}
            {isAdmin && setNotifications && (
              <button
                type="button"
                onClick={(e) => handleDelete(notif.id, e)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Eliminar comunicado"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Contenido del comunicado en pantalla */}
        <div key={notif.id} className="space-y-1 animate-fadeIn">
          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            {notif.title}
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
            {notif.message}
          </p>
        </div>

        {/* Indicadores de puntos inferiores y estado de auto-deslizamiento */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100/60 text-[10px]">
          <div className="flex items-center gap-2">
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center gap-1">
                {activeAnnouncements.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      dotIdx === safeIndex ? 'w-4 bg-indigo-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                    title={`Ir al comunicado ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
            {activeAnnouncements.length > 1 && (
              <span className="text-slate-400 text-[10px]">
                {isPaused ? '⏸ Pausado' : '▶ Deslizando automáticamente'}
              </span>
            )}
          </div>

          <div className="sm:hidden font-mono text-slate-500 font-bold">
            Expira en: {countdownStr}
          </div>
        </div>
      </div>
    </div>
  );
};



  const DashboardView = ({ projects, finances, setCurrentView, isAdmin, asesorias = [], currentUser, globalNotifs = [], setGlobalNotifs }: { projects: Project[], finances: FinanceRecord[], setCurrentView: (v: ViewType) => void, isAdmin: boolean, asesorias?: Asesoria[], currentUser?: SystemUser | null, globalNotifs?: GlobalNotification[], setGlobalNotifs?: (notifs: GlobalNotification[]) => void }) => {
    const activeProjects = projects.filter(p => p.status !== 'Completado');
    const activeProjectsCount = activeProjects.length;

    // Proyectos Activos Flow
    const totalPresupuestoActivos = activeProjects.reduce((sum, p) => sum + (Number(p.presupuesto) || 0), 0);
    const ingresosActivos = activeProjects.reduce((sum, p) => sum + (p.cobros?.reduce((cSum, c) => cSum + (Number(c.amount) || 0), 0) || 0), 0);
    const totalPorCobrarActivos = totalPresupuestoActivos - ingresosActivos;
    const getDebtPaymentsTotalItem = (f: FinanceRecord) => f.type === 'deuda' ? (f.payments?.reduce((s, p) => s + (Number(p.amount) || 0), 0) || (f.isPaid ? (Number(f.amount) || 0) : 0)) : 0;
    
    const egresosActivosExternos = finances.filter(f => (['gastos', 'gasto', 'familia', 'inversion', 'deuda'].includes(f.type)) && f.sourceProject && activeProjects.some(ap => ap.name === f.sourceProject)).reduce((sum, f) => {
      if (f.type === 'deuda') return sum + getDebtPaymentsTotalItem(f);
      return sum + (Number(f.amount) || 0);
    }, 0);
    const egresosActivosMateriales = activeProjects.reduce((sum, p) => sum + (p.materiales || []).filter(m => !m.id?.startsWith('mat-imp-') && !m.id?.startsWith('mat-gasto-')).reduce((s, m) => s + (Number(m.quantity) || 0) * (Number(m.unitPrice) || 0), 0), 0);
    const egresosActivosPersonal = activeProjects.reduce((sum, p) => sum + (p.personal || []).reduce((s, pay) => s + (pay.adelantos ? pay.adelantos.reduce((aSum, a) => aSum + (Number(a.amount) || 0), 0) : 0), 0), 0);
    const egresosActivosProyectosGastos = activeProjects.reduce((sum, p) => sum + (Number(p.gastos) || 0), 0);
    const egresosActivos = egresosActivosExternos + egresosActivosMateriales + egresosActivosPersonal + egresosActivosProyectosGastos;
    const balanceActivos = ingresosActivos - egresosActivos;

    // Global Flow (matching FinanceGenericView)
    const ingresosProyectosGlobales = projects.reduce((sum, p) => sum + (p.cobros?.reduce((cSum, c) => cSum + (Number(c.amount) || 0), 0) || 0), 0);
    const ingresosExtraFinanzas = finances.filter(f => f.type === 'ingreso').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const ingresosGlobales = ingresosProyectosGlobales + ingresosExtraFinanzas;

    const egresosGlobalesMateriales = projects.reduce((sum, p) => sum + (p.materiales || []).filter(m => !m.id?.startsWith('mat-imp-') && !m.id?.startsWith('mat-gasto-')).reduce((s, m) => s + (Number(m.quantity) || 0) * (Number(m.unitPrice) || 0), 0), 0);
    const egresosGlobalesPersonal = projects.reduce((sum, p) => sum + (p.personal || []).reduce((s, pay) => s + (pay.adelantos ? pay.adelantos.reduce((aSum, a) => aSum + (Number(a.amount) || 0), 0) : 0), 0), 0);
    const egresosGlobalesProyectosGastos = projects.reduce((sum, p) => sum + (Number(p.gastos) || 0), 0);
    
    const egresosGlobalesFinanzas = finances.filter(f => 
      ['gastos', 'gasto', 'familia', 'inversion', 'deuda'].includes(f.type)
    ).reduce((sum, f) => {
        if (f.type === 'deuda') return sum + getDebtPaymentsTotalItem(f);
        return sum + (Number(f.amount) || 0);
    }, 0);

    const egresosGlobales = egresosGlobalesMateriales + egresosGlobalesPersonal + egresosGlobalesProyectosGastos + egresosGlobalesFinanzas;
    const balanceGlobal = ingresosGlobales - egresosGlobales;
    
    // Familia breakdown
    const egresosFamilia = finances.filter(f => f.type === 'familia').reduce((sum, f) => sum + f.amount, 0);

    const userScheduledAsesorias = asesorias.filter(a => 
      ((currentUser?.id && a.assignedUserId === currentUser.id) || 
       (currentUser?.id && a.authorUserId === currentUser.id) || 
       (currentUser?.name && a.authorName?.toLowerCase() === currentUser.name.toLowerCase()) ||
       (currentUser?.name && a.assignedUserName?.toLowerCase() === currentUser.name.toLowerCase())) &&
      (a.status === 'Programada' || a.status === 'Aceptada')
    );

    if (!isAdmin) {
      return (
        <div className="space-y-6">
          <AnnouncementBanner notifications={globalNotifs} isAdmin={isAdmin} />

          {userScheduledAsesorias.length > 0 && (
            <div className="bg-indigo-950 text-white p-6 rounded-2xl shadow-sm border border-indigo-900 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
                <div className="flex items-start space-x-4">
                  <div className="p-3.5 bg-white/10 rounded-xl shrink-0 border border-white/10">
                    <Video className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="bg-white/10 text-slate-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/10">
                        {userScheduledAsesorias[0].status === 'Programada' ? 'Clase / Asesoría confirmada' : 'Asesoría agendada'}
                      </span>
                      {userScheduledAsesorias.length > 1 && (
                        <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          +{userScheduledAsesorias.length - 1} más
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                      {userScheduledAsesorias[0].subject}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 text-xs mt-1 font-medium">
                      <span>
                        <strong className="font-semibold text-slate-100">{userScheduledAsesorias[0].scheduledDate || 'Fecha próxima'}</strong>
                      </span>
                      {userScheduledAsesorias[0].scheduledTime && (
                        <span>
                          <strong className="font-semibold text-slate-100">{userScheduledAsesorias[0].scheduledTime}</strong>
                        </span>
                      )}
                      {userScheduledAsesorias[0].price !== undefined && Number(userScheduledAsesorias[0].price) > 0 && (
                        <span className="text-slate-100 font-semibold">
                          S/. {Number(userScheduledAsesorias[0].price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {userScheduledAsesorias[0].adminResponse && (
                      <p className="text-slate-300 text-xs mt-2 bg-black/20 p-2 rounded-lg border border-white/5 inline-block max-w-xl">
                        <strong className="text-slate-100 font-semibold">Indicaciones:</strong> {userScheduledAsesorias[0].adminResponse}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                  {userScheduledAsesorias[0].meetLink && (
                    <a
                      href={userScheduledAsesorias[0].meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 font-bold px-5 py-3 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-slate-700" />
                      <span>Unirse a Videollamada</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentView('asesorias')}
                    className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/20 font-semibold px-4 py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Ver en Mis Asesorías</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-stone-900 ring-1 ring-amber-400/40 shadow-lg shadow-amber-900/10">
            <div className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.25em] text-amber-300/80 uppercase">Edición exclusiva</p>
                <h2 className="text-xl font-black bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent">Licencia Permanente PRO Activada</h2>
                <p className="text-sm text-slate-300 mt-0.5">Acceso completo sin caducidad. Tus proyectos y finanzas son 100% privados.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4 cursor-pointer hover:bg-indigo-50 transition-colors" onClick={() => setCurrentView('projects')}>
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><Briefcase className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Tus Proyectos</p>
                <p className="text-2xl font-bold text-slate-800">{activeProjectsCount} activos</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4 cursor-pointer hover:bg-emerald-50 transition-colors" onClick={() => setCurrentView('projects')}>
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Ingresos Cobrados</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(ingresosActivos)}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4 cursor-pointer hover:bg-amber-50 transition-colors" onClick={() => setCurrentView('gastos')}>
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl"><TrendingDown className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Gastos y Egresos</p>
                <p className="text-xl font-bold text-amber-700">{formatCurrency(egresosActivos)}</p>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-slate-500" />
                Gestión de Obras
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Crea tus proyectos, asigna presupuestos, añade clientes y lleva el control de cobros sin límites.
              </p>
              <button
                onClick={() => setCurrentView('projects')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors"
              >
                Ir a Proyectos
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <TrendingDown className="w-4 h-4 mr-2 text-slate-500" />
                Gastos e Inversiones
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Registra tus compras operativas, caja familiar y seguimiento de deudas de forma independiente.
              </p>
              <button
                onClick={() => setCurrentView('gastos')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors"
              >
                Ir a Gastos Operativos
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-slate-500" />
                Asesorías Técnicas
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ¿Necesitas revisión de planos o cálculo estructural? Solicita una asesoría y recíbela por videollamada.
              </p>
              <button
                onClick={() => setCurrentView('asesorias')}
                className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold text-xs py-2.5 rounded-xl transition-colors"
              >
                Ver Asesorías
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <AnnouncementBanner notifications={globalNotifs} isAdmin={isAdmin} setNotifications={setGlobalNotifs} />

        <div className="relative overflow-hidden rounded-2xl p-4 mb-6 bg-gradient-to-r from-slate-950 via-slate-900 to-stone-900 ring-1 ring-amber-400/40 shadow-lg shadow-amber-900/10 flex items-center gap-4">
          <div className="absolute -right-10 -top-12 w-40 h-40 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30">
            <Crown className="w-6 h-6" />
          </div>
          <div className="relative">
            <h2 className="text-base font-black bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-100 bg-clip-text text-transparent">Licencia Permanente PRO</h2>
            <p className="text-xs text-slate-300">Sistema activo sin límites de caducidad · Edición exclusiva</p>
          </div>
        </div>





        {/* KPIs Globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-xl shrink-0 ${balanceGlobal >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}><TrendingUp className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase truncate">Balance (Liquidez)</p>
              <p className={`text-lg sm:text-xl font-bold truncate ${balanceGlobal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(balanceGlobal)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl shrink-0"><ArrowRight className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase truncate">Total Ingresos</p>
              <p className="text-lg sm:text-xl font-bold text-indigo-700 truncate">{formatCurrency(ingresosGlobales)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0"><TrendingDown className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase truncate">Egresos Totales</p>
              <p className="text-lg sm:text-xl font-bold text-amber-700 truncate">{formatCurrency(egresosGlobales)}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0"><Home className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase truncate">Gastos Familia</p>
              <p className="text-lg sm:text-xl font-bold text-rose-700 truncate">{formatCurrency(egresosFamilia)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flujo Proyectos Activos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Flujo: Proyectos Activos</h2>
            </div>
            <div className="space-y-6">
               <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Presupuesto Total (Activos)</p>
                  <p className="text-xl sm:text-2xl font-black text-indigo-700">{formatCurrency(totalPresupuestoActivos)}</p>
                  <p className="text-xs text-slate-500 mt-2">Por Cobrar: {formatCurrency(totalPorCobrarActivos)}</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                   <div className="flex items-center space-x-2 text-emerald-600 mb-2">
                     <TrendingUp className="w-4 h-4"/>
                     <span className="font-bold text-xs uppercase">Ingresos (Cobrado)</span>
                   </div>
                   <p className="text-lg sm:text-xl font-bold text-emerald-700">{formatCurrency(ingresosActivos)}</p>
                 </div>

                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                   <div className="flex items-center space-x-2 text-amber-600 mb-2">
                     <TrendingDown className="w-4 h-4"/>
                     <span className="font-bold text-xs uppercase">Egresos (Gastos)</span>
                   </div>
                   <p className="text-lg sm:text-xl font-bold text-amber-700">{formatCurrency(egresosActivos)}</p>
                 </div>
               </div>

               <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                 <span className="font-bold text-slate-600 uppercase tracking-wider text-xs">Balance Actual (Activos)</span>
                 <span className={`text-lg sm:text-xl font-bold ${balanceActivos >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {formatCurrency(balanceActivos)}
                 </span>
               </div>
            </div>
          </div>
          
          {/* Flujo Global Histórico */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Flujo Financiero Global</h2>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <TrendingUp className="w-5 h-5"/>
                    <span className="font-bold uppercase tracking-wider text-sm">Ingresos Totales (Histórico)</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-700">{formatCurrency(ingresosGlobales)}</span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-3">
                  <div className="bg-emerald-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center space-x-2 text-amber-600">
                    <TrendingDown className="w-5 h-5"/>
                    <span className="font-bold uppercase tracking-wider text-sm">Egresos Totales (Histórico)</span>
                  </div>
                  <span className="text-2xl font-bold text-amber-700">{formatCurrency(egresosGlobales)}</span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-3">
                  <div className="bg-amber-600 h-3 rounded-full" style={{ width: `${Math.min((egresosGlobales / Math.max(ingresosGlobales, 1)) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t pt-6">
              <button onClick={() => setCurrentView('finances')} className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-3 rounded-xl border border-indigo-200 transition-colors flex items-center justify-center space-x-2">
                <span>Ver Reporte de Egresos Completo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Proyectos Recientes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Proyectos Activos</h2>
            <button onClick={() => setCurrentView('projects')} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Proyecto</th>
                  <th className="px-4 py-3">Progreso</th>
                  <th className="px-4 py-3">Presupuesto</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProjects.slice(0, 5).map(p => {
                  const cobrado = p.cobros?.reduce((sum, c) => sum + c.amount, 0) || 0;
                  const percent = p.presupuesto > 0 ? (cobrado / p.presupuesto) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-4">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                          <div className="bg-slate-700 h-2 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatCurrency(p.presupuesto)}</td>
                      <td className="px-4 py-4 text-right font-medium text-slate-800">{formatCurrency(cobrado)}</td>
                    </tr>
                  );
                })}
                {activeProjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No hay proyectos activos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


export const LegacyViewPlaceholder = () => null;





  




/*
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
                     <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Monto Total Pactado (S/)</label>
                      <input required value={globalAmount} onChange={e => setGlobalAmount(e.target.value)} type="number" step="0.01" min="0" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. 0.00" />
                     </div>
                   ) : (
                     <>
                       <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Días Laborables</label>
                        <input required value={days} onChange={e => setDays(e.target.value)} type="number" min="1" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. 5" />
                       </div>
                       <div>
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

              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-x-auto">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-800">
                  Lista de Personal ({project.personal?.length || 0})
                </div>
                <div className="p-0">
                  <div className="block md:hidden divide-y divide-slate-100">
                    {project.personal?.map((p: any) => {
                        const totalAdelantos = (p.adelantos || []).reduce((sum: number, a: any) => sum + a.amount, 0);
                        const saldo = p.amount - totalAdelantos;
                        const isSelected = selectedWorkerId === p.id;
                        
                        return (
                          <div key={p.id} className={`p-4 transition-colors cursor-pointer hover:bg-emerald-50 ${isSelected ? 'bg-emerald-50' : 'bg-white'}`} onClick={() => setSelectedWorkerId(p.id)}>
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
                                <span className="text-slate-500 text-xs block mb-0.5">Total a Pagar</span>
                                <span className="font-bold text-slate-700">{formatCurrency(p.amount)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-500 text-xs block mb-0.5">Saldo Restante</span>
                                <span className="font-bold text-emerald-600">{formatCurrency(saldo)}</span>
                              </div>
                            </div>
                          </div>
                        )
                    })}
                    {(!project.personal || project.personal.length === 0) && (
                        <div className="p-8 text-center text-slate-500">No hay personal registrado en este proyecto.</div>
                    )}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-white border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">Trabajador</th>
                          <th className="p-4 font-semibold">Total a Pagar</th>
                          <th className="p-4 font-semibold">Saldo Restante</th>
                          <th className="p-4 font-semibold text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.personal?.map((p: any) => {
                          const totalAdelantos = (p.adelantos || []).reduce((sum: number, a: any) => sum + a.amount, 0);
                          const saldo = p.amount - totalAdelantos;
                          const isSelected = selectedWorkerId === p.id;
                          
                          return (
                            <tr key={p.id} className={`transition-colors cursor-pointer hover:bg-emerald-50 ${isSelected ? 'bg-emerald-50' : 'bg-white'}`} onClick={() => setSelectedWorkerId(p.id)}>
                              <td className="p-4">
                                <div className="font-bold text-slate-800">{p.name}</div>
                                <div className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
                                  <span>{p.role}</span>
                                  {p.paymentType !== 'Global' && p.paymentType !== 'Por Día' && <span className="bg-indigo-100 text-indigo-700 px-1.5 rounded-sm ml-2">{p.paymentType}</span>}
                                  {p.paymentType === 'Por Día' && (
                                    <span className="bg-emerald-100 text-emerald-700 px-1.5 rounded-sm">{p.days} días a S/{p.dailyRate}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 font-bold text-slate-700">{formatCurrency(p.amount)}</td>
                              <td className="p-4 font-bold text-emerald-600">{formatCurrency(saldo)}</td>
                              <td className="p-4 text-center">
                                <button onClick={(e) => { e.stopPropagation(); handleEditWorker(p); }} className="text-slate-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors mr-1">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteWorker(p.id); }} className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {(!project.personal || project.personal.length === 0) && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">No hay personal registrado en este proyecto.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
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

          {selectedWorker && (
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-1">{selectedWorker.name}</h2>
              <p className="text-xs text-slate-500 mb-4">{selectedWorker.role} | DNI: {selectedWorker.dni || 'N/A'}</p>
              
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Registrar Adelanto</h3>
                <form onSubmit={handleAddAdelanto} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Monto (S/)</label>
                    <input required value={adelantoMonto} onChange={e => setAdelantoMonto(e.target.value)} type="number" step="0.01" min="0" max={(selectedWorker.amount || 0) - ((selectedWorker.adelantos || []).reduce((s: number, a: any) => s + a.amount, 0))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Ej. 0.00" />
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
                  <button type="submit" className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-2 rounded-lg transition-colors text-sm">
                    Registrar Adelanto
                  </button>
                </form>

                <div>
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">Historial de Adelantos</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                    {(!selectedWorker.adelantos || selectedWorker.adelantos.length === 0) ? (
                      <p className="text-sm text-slate-500 text-center py-4">No hay adelantos registrados.</p>
                    ) : (
                      selectedWorker.adelantos.map((a: any) => (
                        <div key={a.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-800">{formatCurrency(a.amount)}</div>
                              <div className="text-xs text-slate-500">{a.date} &middot; {a.method}</div>
                              {a.reference && <div className="text-xs text-slate-400 mt-1">Ref: {a.reference}</div>}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button onClick={() => handleEditAdelanto(a)} className="text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteAdelanto(a.id)} className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
*/
const FinanceGenericView = ({ type, title, subtitle, icon: Icon, colorClass, finances, setFinances, projects }: { type: FinanceRecord['type'], title: string, subtitle: string, icon: any, colorClass: string, finances: FinanceRecord[], setFinances: React.Dispatch<React.SetStateAction<FinanceRecord[]>>, projects: Project[] }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const [sourceProject, setSourceProject] = useState('');
    const [category, setCategory] = useState('');
    const [frequency, setFrequency] = useState<FinanceRecord['frequency']>('Unico');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [addingPaymentTo, setAddingPaymentTo] = useState<string | null>(null);

    const colorMap: { [key: string]: string } = {
      indigo: 'text-indigo-600',
      emerald: 'text-emerald-600',
      rose: 'text-rose-600',
      amber: 'text-amber-600',
      slate: 'text-slate-600'
    };

    const getDebtPaymentsTotal = (f: FinanceRecord) => f.type === 'deuda' ? (f.payments?.reduce((s, p) => s + p.amount, 0) || (f.isPaid ? f.amount : 0)) : 0;
    const records = finances.filter(f => f.type === type).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = records.reduce((sum, r) => sum + r.amount, 0);

    const totalPagado = type === 'deuda'
       ? records.reduce((sum, r) => sum + getDebtPaymentsTotal(r), 0)
       : records.filter(r => r.isPaid).reduce((sum, r) => sum + r.amount, 0);

    const totalPorPagar = type === 'deuda'
      ? records.reduce((sum, r) => sum + Math.max(0, r.amount - getDebtPaymentsTotal(r)), 0)
      : records.filter(r => !r.isPaid).reduce((sum, r) => sum + r.amount, 0);

    const totalCobrado = projects.reduce((sum, p) => sum + (p.cobros?.reduce((cSum, c) => cSum + (Number(c.amount) || 0), 0) || 0), 0);
    const totalGastosDirectosProyectos = projects.reduce((sum, p) => 
      sum + (Number(p.gastos) || 0) + 
      (p.materiales || [])
        .filter(m => !m.id?.startsWith('mat-imp-') && !m.id?.startsWith('mat-gasto-'))
        .reduce((s, m) => s + (Number(m.quantity) || 0) * (Number(m.unitPrice) || 0), 0) + 
      (p.personal || [])
        .reduce((s, pay) => s + (pay.adelantos ? pay.adelantos.reduce((aSum, a) => aSum + (Number(a.amount) || 0), 0) : 0), 0), 0);
    
    const totalFinanzasSalidas = finances.filter(f => 
      f.type === 'gastos' || 
      f.type === 'gasto' || 
      f.type === 'familia' || 
      f.type === 'inversion' || 
      f.type === 'deuda'
    ).reduce((sum, f) => {
       if (f.type === 'deuda') return sum + getDebtPaymentsTotal(f);
       return sum + (Number(f.amount) || 0);
    }, 0);

    const liquidez = totalCobrado - totalGastosDirectosProyectos - totalFinanzasSalidas;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!description || !amount) return;
      if (type === 'gastos' && !category) return;
      
      const newRecord: FinanceRecord = {
        id: editingId || Date.now().toString(),
        type,
        description,
        amount: Number(amount),
        date,
        isPaid: type === 'gastos' || type === 'familia' || type === 'inversion' ? true : false,
        sourceProject: (type === 'gastos' || type === 'familia' || type === 'deuda') ? sourceProject : undefined,
        isMonthly: type === 'deuda' ? (frequency === 'Mensual') : false,
        category: type === 'gastos' ? category : undefined,
        frequency: type === 'deuda' ? frequency : undefined,
        payments: editingId ? (finances.find(f => f.id === editingId)?.payments || []) : []
      };

      if (editingId) {
        setFinances(prev => prev.map(f => f.id === editingId ? newRecord : f));
      } else {
        setFinances([...finances, newRecord]);
      }
      
      setDescription('');
      setAmount('');
      setCategory('');
      setSourceProject('');
      setFrequency('Unico');
      setEditingId(null);
    };

    const handleEdit = (record: FinanceRecord) => {
      setDescription(record.description);
      setAmount(record.amount.toString());
      setDate(record.date);
      if (record.sourceProject) setSourceProject(record.sourceProject);
      if (record.category) setCategory(record.category);
      if (record.frequency) setFrequency(record.frequency);
      setEditingId(record.id);
    };

    const handleAddPayment = (recordId: string) => {
      if (!paymentAmount) return;
      const record = finances.find(f => f.id === recordId);
      if (!record) return;
      
      const paymentAmountNum = Number(paymentAmount);
      const newPayment = {
        id: Date.now().toString(),
        amount: paymentAmountNum,
        date: new Date().toISOString().split('T')[0]
      };
      
      const updatedPayments = [...(record.payments || []), newPayment];
      const totalPaidNow = updatedPayments.reduce((s, p) => s + p.amount, 0);
      
      const isNowPaid = totalPaidNow >= record.amount || record.isPaid;
      const updatedRecord = {
        ...record,
        payments: updatedPayments,
        isPaid: isNowPaid
      };
      
      let additionalRecords: FinanceRecord[] = [];
      if (isNowPaid && !record.isPaid && (record.frequency === 'Mensual' || record.frequency === 'Quincenal' || record.frequency === 'Semanal')) {
         const nextDate = new Date(record.date);
         if (record.frequency === 'Mensual') nextDate.setMonth(nextDate.getMonth() + 1);
         else if (record.frequency === 'Quincenal') nextDate.setDate(nextDate.getDate() + 15);
         else if (record.frequency === 'Semanal') nextDate.setDate(nextDate.getDate() + 7);
         
         additionalRecords.push({
             ...record,
             id: Date.now().toString() + "_next",
             date: nextDate.toISOString().split('T')[0],
             isPaid: false,
             payments: []
         });
      }
      
      setFinances(prev => prev.map(f => f.id === recordId ? updatedRecord : f).concat(additionalRecords));
      setPaymentAmount('');
      setAddingPaymentTo(null);
    };

    return (
      <div className="space-y-6">
        <header className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-3 rounded-xl bg-white shadow-sm border border-slate-100 ${colorMap[colorClass]}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
          </div>
          <p className="text-slate-500">{subtitle}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {type === 'deuda' ? (
               <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                   <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pagado</p>
                   <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalPagado)}</p>
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Por Pagar</p>
                   <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalPorPagar)}</p>
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total</p>
                   <p className="text-2xl font-bold text-slate-800">{formatCurrency(total)}</p>
                 </div>
               </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-3">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total {type}</p>
                <p className="text-3xl font-bold text-slate-800">{formatCurrency(total)}</p>
              </div>
            )}
          </div>

        {type === 'deuda' && liquidez < 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm font-medium">Alerta de Liquidez: Actualmente no tienes liquidez suficiente (Liquidez actual: {formatCurrency(liquidez)}). No es recomendable pagar deudas en este momento.</p>
          </div>
        )}
        
        {type === 'deuda' && liquidez >= 0 && (
          <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl flex items-center">
            <Activity className="w-5 h-5 mr-3 flex-shrink-0 text-slate-400" />
            <p className="text-sm font-medium">Liquidez Saludable: Tienes {formatCurrency(liquidez)} disponibles para cubrir deudas u otros gastos.</p>
          </div>
        )}

        {type === 'inversion' && (
          <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl flex items-center">
            <TrendingUp className="w-5 h-5 mr-3 flex-shrink-0 text-slate-400" />
            <p className="text-sm font-medium">El capital invertido se extrae de tu liquidez actual. Para evitar pérdidas, asegúrate de recuperar este capital a través de la utilidad de tus proyectos futuros.</p>
          </div>
        )}

        {type === 'familia' && (
          <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl flex items-center mb-4">
            <Home className="w-5 h-5 mr-3 flex-shrink-0 text-slate-400" />
            <p className="text-sm font-medium">Los retiros familiares pueden registrarse de manera independiente (disminuyendo tu liquidez general) o asignarse directamente a la utilidad de un proyecto específico (seleccionándolo en el formulario).</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 ${type === 'gastos' ? 'md:grid-cols-7 lg:grid-cols-9' : type === 'familia' ? 'md:grid-cols-6 lg:grid-cols-7' : type === 'deuda' ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4 items-end`}>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Descripción</label>
            <input required value={description} onChange={e => setDescription(e.target.value)} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all" placeholder="Detalle del registro..." />
          </div>

          {type === 'gastos' && (
            <div className="md:col-span-1 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Categoría</label>
              <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all">
                <option value="" disabled>Seleccionar...</option>
                <option value="Material">Material</option>
                <option value="Personal">Personal</option>
                <option value="Transporte">Transporte</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          )}

          {(type === 'familia' || type === 'gastos' || type === 'deuda') && (
            <div className="md:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Proyecto Origen</label>
              <select value={sourceProject} onChange={e => setSourceProject(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all">
                <option value="">Ninguno</option>
                {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Monto (S/)</label>
            <input required value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all" placeholder="Ej. 0.00" />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Fecha</label>
            <input required value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all" />
          </div>

          {type === 'deuda' && (
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Frecuencia</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all">
                <option value="Unico">Único</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Mensual">Mensual</option>
                <option value="Semanal">Semanal</option>
              </select>
            </div>
          )}

          <div className="md:col-span-1">
            <button type="submit" className="w-full flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 rounded-lg transition-colors">
              {editingId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingId ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>

        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          
          {/* VISTA MÓVIL (Tarjetas) */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {records.map(r => {
              let alertClass = '';
              let AlertIcon = null;
              let sinLiquidez = false;

              if (type === 'deuda') {
                const totalPaid = getDebtPaymentsTotal(r);
                const pendingAmount = r.amount - totalPaid;
                const isFullyPaid = pendingAmount <= 0 || r.isPaid;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const recordDate = new Date(r.date + 'T00:00:00');
                const diffTime = recordDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (liquidez < pendingAmount && !isFullyPaid) {
                  sinLiquidez = true;
                }
                if (isFullyPaid) {
                   alertClass = 'border-l-4 border-l-slate-300 bg-slate-50/50 opacity-75';
                   AlertIcon = <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide">Completada</span>;
                } else if (diffDays < 0) {
                  alertClass = 'border-l-4 border-l-rose-500 bg-rose-50/50';
                  AlertIcon = <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide">Vencida</span>;
                } else if (diffDays <= 3) {
                  alertClass = 'border-l-4 border-l-amber-500 bg-amber-50/50';
                  AlertIcon = <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wide">Próxima</span>;
                }
                
                return (
                  <div key={r.id} className={`p-4 transition-colors ${alertClass} ${alertClass ? '' : 'hover:bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">{r.date}</div>
                        <div className="font-bold text-slate-800">{r.description}</div>
                        {AlertIcon}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(r)} className="text-slate-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setFinances(finances.filter(x => x.id !== r.id))} className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-slate-100">
                      <div>
                        {isFullyPaid ? (
                          <span className="text-slate-500 font-semibold text-xs flex items-center">Pagado</span>
                        ) : sinLiquidez ? (
                          <span className="text-rose-600 font-semibold text-xs flex items-center">Esperar</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs flex items-center">Prioridad</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{formatCurrency(r.amount)}</div>
                        {totalPaid > 0 && !isFullyPaid && (
                          <div className="text-xs text-emerald-600 mt-1">Pagado: {formatCurrency(totalPaid)}</div>
                        )}
                      </div>
                    </div>
                    
                    {!isFullyPaid && (
                      <div className="mt-3">
                         <button
                           onClick={() => addingPaymentTo === r.id ? setAddingPaymentTo(null) : setAddingPaymentTo(r.id)}
                           className="w-full text-center p-2 rounded-lg transition-colors font-semibold text-xs uppercase tracking-wide text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200"
                         >
                           {addingPaymentTo === r.id ? 'Cancelar Pago' : '+ Abonar / Cuota'}
                         </button>
                      </div>
                    )}
                    
                    {addingPaymentTo === r.id && (
                      <div className="mt-3 bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col space-y-2">
                        <label className="text-sm font-medium text-slate-600">Abonar a la deuda:</label>
                        <input type="number" min="0" step="0.01" max={pendingAmount} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder={`Máx: ${pendingAmount}`} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 transition-all" />
                        <button onClick={() => handleAddPayment(r.id)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors">
                          Pagar
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
              
              // OTRAS FINANZAS
              return (
                <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">{r.date}</div>
                      <div className="font-bold text-slate-800">{r.description}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.isMonthly && <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Mensual</span>}
                        {type === 'gastos' && r.category && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">{r.category}</span>}
                        {(type === 'familia' || type === 'gastos') && r.sourceProject && <span className="inline-flex items-center text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{r.sourceProject}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(r)} className="text-slate-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setFinances(finances.filter(x => x.id !== r.id))} className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right pt-2 border-t border-slate-100 mt-2">
                    <span className="font-bold text-slate-800">{formatCurrency(r.amount)}</span>
                  </div>
                </div>
              );
            })}
            {records.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">No hay registros para mostrar.</div>
            )}
          </div>
<div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold">Descripción</th>
                  {type === 'gastos' && <th className="p-4 font-semibold">Categoría</th>}
                  {(type === 'familia' || type === 'gastos') && <th className="p-4 font-semibold">Origen</th>}
                  {type === 'deuda' && <th className="p-4 font-semibold">Estado</th>}
                  <th className="p-4 font-semibold text-right">Monto</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(r => {
                  let alertClass = '';
                  let AlertIcon = null;
                  let sinLiquidez = false;
                  
                  if (type === 'deuda') {
                    const totalPaid = getDebtPaymentsTotal(r);
                    const pendingAmount = r.amount - totalPaid;
                    const isFullyPaid = pendingAmount <= 0 || r.isPaid;
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const recordDate = new Date(r.date + 'T00:00:00');
                    const diffTime = recordDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (liquidez < pendingAmount && !isFullyPaid) {
                      sinLiquidez = true;
                    }

                    if (isFullyPaid) {
                       alertClass = 'border-l-4 border-l-slate-300 bg-slate-50/50 opacity-75';
                       AlertIcon = <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide">Completada</span>;
                    } else if (diffDays < 0) {
                      alertClass = 'border-l-4 border-l-rose-500 bg-rose-50/50';
                      AlertIcon = <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide"><AlertCircle className="w-3 h-3 mr-1"/>Vencida</span>;
                    } else if (diffDays <= 3) {
                      alertClass = 'border-l-4 border-l-amber-500 bg-amber-50/50';
                      AlertIcon = <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide"><AlertCircle className="w-3 h-3 mr-1"/>Próxima</span>;
                    }

                    return (
                      <React.Fragment key={r.id}>
                        <tr className={`hover:bg-slate-50 transition-colors ${alertClass}`}>
                          <td className="p-4 text-sm text-slate-500">{r.date}</td>
                          <td className="p-4 font-medium text-slate-800">
                            <div className="flex items-center">
                              {r.description}
                              {r.frequency && <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide">{r.frequency}</span>}
                              {AlertIcon}
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {isFullyPaid ? (
                              <span className="text-slate-500 font-semibold text-xs flex items-center">Pagado</span>
                            ) : sinLiquidez ? (
                              <span className="text-rose-600 font-semibold text-xs flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Esperar</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold text-xs flex items-center"><Activity className="w-3 h-3 mr-1"/> Prioridad</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-semibold text-slate-800">
                            {formatCurrency(r.amount)}
                            {totalPaid > 0 && !isFullyPaid && (
                              <div className="text-xs text-emerald-600 mt-1">Pagado: {formatCurrency(totalPaid)}</div>
                            )}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button onClick={() => handleEdit(r)} className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-blue-50 mr-1">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!isFullyPaid && (
                              <button 
                                onClick={() => addingPaymentTo === r.id ? setAddingPaymentTo(null) : setAddingPaymentTo(r.id)}
                                className={`p-2 rounded-lg transition-colors mr-1 font-semibold text-[11px] uppercase tracking-wide text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200`}
                              >
                                {addingPaymentTo === r.id ? 'Cancelar Pago' : '+ Abonar / Cuota'}
                              </button>
                            )}
                            <button onClick={() => setFinances(finances.filter(x => x.id !== r.id))} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        {addingPaymentTo === r.id && (
                          <tr className="bg-slate-50">
                            <td colSpan={5} className="p-4">
                              <div className="flex items-center space-x-3 justify-end">
                                <label className="text-sm font-medium text-slate-600">Abonar a la deuda:</label>
                                <input type="number" min="0" step="0.01" max={pendingAmount} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder={`Máx: ${pendingAmount}`} className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-all" />
                                <button onClick={() => handleAddPayment(r.id)} className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-1.5 rounded-lg text-sm transition-colors">
                                  Pagar
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-500">{r.date}</td>
                      <td className="p-4 font-medium text-slate-800">
                        <div className="flex items-center">
                          {r.description}
                          {r.isMonthly && <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide">Mensual</span>}
                        </div>
                      </td>
                      {type === 'gastos' && (
                        <td className="p-4">
                          {r.category ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              {r.category}
                            </span>
                          ) : <span className="text-slate-400 text-sm">-</span>}
                        </td>
                      )}
                      {(type === 'familia' || type === 'gastos') && <td className="p-4 text-sm text-slate-500">{r.sourceProject || '-'}</td>}
                      <td className="p-4 text-right font-semibold text-slate-800">{formatCurrency(r.amount)}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <button onClick={() => handleEdit(r)} className="text-slate-400 hover:text-blue-500 transition-colors p-2 rounded-lg hover:bg-blue-50 mr-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setFinances(finances.filter(x => x.id !== r.id))} className="text-slate-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={type === 'gastos' ? 6 : type === 'familia' || type === 'deuda' ? 5 : 4} className="p-8 text-center text-slate-500">No hay registros de {type}.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


// Master Administrator Email
export const PRIMARY_ADMIN_EMAIL = 'chiwawatec@gmail.com';

// SHA-256 hash of the Master Administrator PIN.
// SECURITY NOTE: A 6-digit PIN only has 1,000,000 combinations, so this hash
// embedded in the client bundle can be brute-forced offline in seconds. This
// is a temporary rotation (demo PIN) — the real fix (phase 2b) is to verify the
// admin PIN server-side and NOT ship any admin credential in the bundle.
// Current value: SHA-256('602908').
const MASTER_ADMIN_PIN_HASH = '60876bbe7e8f5271eaa089908ba07c0d872aa80ecfed113b0417c1afb4da9875';

async function computePinSha256(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates if the user is authorized as an Administrator.
 */
export const isAuthorizedAdminEmail = async (authUser: User): Promise<boolean> => {
  const email = (authUser.email || '').trim().toLowerCase();
  if (!email) return false;

  // Cache bypass to prevent auto-logout on refresh/poor connection
  const cachedAdminEmail = safeStorage.getItem<string>('innova_last_authorized_admin_email', '');
  if (cachedAdminEmail && email === cachedAdminEmail.toLowerCase()) {
    return true;
  }

  // 1. Direct match with primary Administrator email
  if (email === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    safeStorage.setItem('innova_last_authorized_admin_email', email);
    return true;
  }

  return false;
};

export default function App() {
  const [user, setUser] = useState<SystemUser | null>(() => {
    return safeStorage.getItem<SystemUser | null>('savedUser', null);
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPinMask, setShowPinMask] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState(() => !!safeStorage.getItem<SystemUser | null>('savedUser', null));
  const [loading, setLoading] = useState(() => {
    const cachedUser = safeStorage.getItem<SystemUser | null>('savedUser', null);
    return !cachedUser;
  });

  const isAdmin = user?.role === 'admin' || user?.id === 'admin' || user?.id === 'admin_master';

  // Strict Workspace Isolation:
  // - Admin sees their own master workspace (projects, finances, clients)
  // - Regular users work in their own independent workspace ('user_' + id)
  // - Admin data is NEVER visible to regular users
  const activeUid = isAdmin ? 'admin' : (user ? ('user_' + user.id) : undefined);

  // Private collections scoped to workspace (each workspace is strictly isolated by userId):
  const [projects, setProjects] = useFirestoreArraySync<Project>('projects', activeUid, false, isAdmin);
  const [clients, setClients] = useFirestoreArraySync<Client>('clients', activeUid, false, isAdmin);
  const [finances, setFinances] = useFirestoreArraySync<FinanceRecord>('finances', activeUid, false, isAdmin);
  // User-specific settings (logo, business name, and bank details per workspace):
  const [settings, setSettings] = useFirestoreArraySync<SystemConfig>('settings', activeUid, false, isAdmin);

  // Global collections:
  const [usuarios, setUsuarios] = useFirestoreArraySync<SystemUser>('usuarios', activeUid, true, isAdmin);
  const [cursos, setCursos] = useFirestoreArraySync<CourseCategory>('cursos', activeUid, true, isAdmin);
  const [tickets, setTickets] = useFirestoreArraySync<Ticket>('tickets', activeUid, true, isAdmin);
  const [asesorias, setAsesorias] = useFirestoreArraySync<Asesoria>('asesorias', activeUid, true, isAdmin);
  const [biblioteca, setBiblioteca] = useFirestoreArraySync<BibliotecaItem>('biblioteca', activeUid, true, isAdmin);
  const [tutoriales, setTutoriales] = useFirestoreArraySync<TutorialVideo>('tutoriales', activeUid, true, isAdmin);
  const [globalNotifs, setGlobalNotifs] = useFirestoreArraySync<GlobalNotification>('notificaciones', 'global', true);

  // Interruptores globales de apartados "en desarrollo": el admin decide qué
  // secciones se ocultan para los usuarios. Colección global (visible por todos).
  const [devFlags, setDevFlags] = useFirestoreArraySync<{ id: string; disabledSections: string[] }>('config_flags', 'global', true);
  // Leemos el documento 'nav_flags' por su id (no por posición), para que no se
  // rompa si la colección global tuviera otros documentos de configuración.
  const navFlagsDoc = devFlags.find(f => f.id === 'nav_flags');
  const disabledSections: string[] = navFlagsDoc?.disabledSections || [];
  const setDisabledSections = (list: string[]) => {
    // Preservamos cualquier otro documento de config_flags y solo actualizamos nav_flags.
    setDevFlags(prev => [
      { id: 'nav_flags', disabledSections: Array.from(new Set(list)) },
      ...prev.filter(f => f.id !== 'nav_flags'),
    ]);
  };
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);
  // Contexto para el control de acceso a la IA (admin ilimitado; usuarios por plan).
  useEffect(() => { setAICtx(user?.id, isAdmin, user?.name || ''); }, [user?.id, user?.name, isAdmin]);
  // Sesiones antiguas (anónimas, de antes del ingreso seguro por PIN) no tienen
  // permisos para leer/guardar configuraciones globales (p. ej. los apartados
  // desactivados por el admin). Se pide el PIN una sola vez para renovarla.
  useEffect(() => {
    if (!user || safeStorage.getItem<boolean>('innova_sesion_v2', false)) return;
    authReady.then(() => {
      if (auth.currentUser && !auth.currentUser.isAnonymous) { safeStorage.setItem('innova_sesion_v2', true); return; }
      setPinError('Actualizamos la seguridad de la plataforma: vuelve a ingresar tu PIN (solo esta vez).');
      handleLogout();
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si la sesión sigue siendo anónima (ingreso antiguo o el servidor no respondió),
  // el servidor no deja leer comunicados ni configuraciones globales: se avisa.
  const [sesionLimitada, setSesionLimitada] = useState(false);
  useEffect(() => {
    if (!user) { setSesionLimitada(false); return; }
    authReady.then(() => setSesionLimitada(!!auth.currentUser?.isAnonymous));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Apartados ya abiertos (Diseñador y Calculadora se quedan montados después).
  const vistasAbiertas = useRef(new Set<string>());
  vistasAbiertas.current.add(currentView);
  // Interruptor de la IA para usuarios (lo enciende el admin en Configuración).
  const [, setIaUsuarios] = useState(false);
  useEffect(() => { if (user) cargarEstadoIA().then(setIaUsuarios); }, [user?.id]);

  // Strict isolation fallback: Filter arrays to strictly prevent cross-account leakage.
  // The Admin sees ONLY their own records where userId matches administrative tags ('admin', 'user_admin', 'shared', or 'user').
  // This prevents the admin from seeing ALL users' projects unless they are specifically in the admin workspace.
  const filteredProjects = projects.filter(p => {
    if (isAdmin) {
      // Allow projects that are explicitly marked as shared, or belong to the admin, or are general 'user' level, but NOT user-specific projects if they are not meant for the master workspace.
      return p.userId === 'admin' || p.userId === 'user_admin' || p.userId === 'shared' || p.userId === 'user';
    }
    return true;
  });

  // Clientes: el admin no ve aquí los de sus usuarios (están en "Supervisión").
  const workspacesDeUsuarios = useMemo(() => {
    const ids = new Set<string>();
    usuarios.forEach(u => {
      if (u.role === 'admin' || u.id === 'admin') return;
      const core = u.id.replace(/^user_/, '').replace(/^usr_/, '');
      [u.id, core, `user_${core}`, `usr_${core}`, `user_usr_${core}`].forEach(x => ids.add(x));
    });
    return ids;
  }, [usuarios]);
  const filteredClients = isAdmin ? clients.filter(c => !c.userId || !workspacesDeUsuarios.has(c.userId)) : clients;

  const filteredFinances = finances.filter(f => {
    if (isAdmin) {
      return !f.userId || f.userId === 'admin' || f.userId === 'user_admin' || f.userId === 'shared' || f.userId === 'user';
    }
    return true;
  });
  
  // IMPORTANTE: el admin lee TODA la colección de settings (de todos los
  // usuarios). Por eso NO podemos usar settings[0] (sería el de cualquier
  // usuario y mostraría su logo). Seleccionamos SIEMPRE el documento del
  // usuario actual por su id/userId; si no existe, usamos el predeterminado.
  const mySettingsId = 'settings_' + (activeUid || 'default');
  const myOwnSettings = settings.find(s => s.id === mySettingsId || s.userId === activeUid);
  const currentSettings = myOwnSettings || {
    id: mySettingsId,
    appName: (!isAdmin && user?.name) ? user.name : (isAdmin ? 'Innova Contratistas' : 'Mi Empresa'),
    logoBase64: '',
    currency: 'PEN',
    theme: 'light'
  };

  // Datos de la empresa para cotizaciones y planos (se editan también desde el documento).
  const empresaCtx = useMemo(() => ({
    datos: datosDesdeSettings(currentSettings),
    guardar: (p: Partial<DatosEmpresa>) => setSettings(prev => {
      const actual = prev.find(s => s.id === mySettingsId || s.userId === activeUid) || currentSettings;
      const nuevo = { ...actual, ...settingsDesdeDatos(p), id: (actual as any).id || mySettingsId, userId: activeUid || 'guest' } as SystemConfig;
      return prev.some(s => s.id === nuevo.id) ? prev.map(s => s.id === nuevo.id ? nuevo : s) : [...prev, nuevo];
    }),
  }), [currentSettings, mySettingsId, activeUid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Catálogo de precios único: migra precios viejos una vez y se sincroniza
  // con el documento de configuración del usuario (gana el más reciente).
  const catalogoPrecios = useCatalogo();
  useEffect(() => { migrarPreciosAntiguos(id => INVENTARIO_PERFILES_TUBULARES.find(p => p.id === id)); }, []);
  const catalogoRemoto = (currentSettings as any).catalogoPrecios as EstadoCatalogo | undefined;
  useEffect(() => { hidratarCatalogo(catalogoRemoto); }, [catalogoRemoto?.actualizado]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!activeUid || !catalogoPrecios.actualizado || catalogoRemoto?.actualizado === catalogoPrecios.actualizado) return;
    const t = setTimeout(() => setSettings(prev => {
      const actual = prev.find(s => s.id === mySettingsId || s.userId === activeUid) || currentSettings;
      const nuevo = { ...actual, catalogoPrecios: catalogoPrecios, id: (actual as any).id || mySettingsId, userId: activeUid } as SystemConfig;
      return prev.some(s => s.id === nuevo.id) ? prev.map(s => s.id === nuevo.id ? nuevo : s) : [...prev, nuevo];
    }), 1500);
    return () => clearTimeout(t);
  }, [catalogoPrecios, activeUid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Automated Daily Backup for Admin
  useEffect(() => {
    if (isAdmin) {
      const lastBackupDate = localStorage.getItem('lastBackupDate');
      const today = new Date().toISOString().split('T')[0];

      if (lastBackupDate !== today) {
        performAdminBackup().then(() => {
          localStorage.setItem('lastBackupDate', today);
          console.log('Backup automático completado');
        }).catch(err => console.error('Error en backup automático:', err));
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    // Safety timeout: Never keep the user stuck on the loading spinner for more than 400ms
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setAuthInitialized(true);
    }, 400);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, []);

  // Validate active user in background if logged in
  useEffect(() => {
    if (isAdmin || !user?.id) return;
    let isCurrent = true;

    getDoc(doc(db, 'usuarios', user.id)).then((snap) => {
      if (!isCurrent) return;
      if (!snap.exists()) {
        handleLogout();
        setPinError('Tu usuario ya no existe en el sistema.');
      } else {
        const data = snap.data();
        if (data.isActive === false) {
          handleLogout();
          setPinError('Tu acceso ha sido desactivado.');
        } else if (data.pin && user.pin && data.pin !== user.pin) {
          handleLogout();
          setPinError('Tu PIN ha sido actualizado. Por favor vuelve a ingresar.');
        }
      }
    }).catch(err => {
      console.warn('Background user check:', err);
    });

    return () => {
      isCurrent = false;
    };
  }, [user?.id, isAdmin]);

  // App Android (Capacitor): el botón "atrás" vuelve al Panel Principal y, si
  // ya estás ahí, minimiza la app (en vez de cerrarla de golpe).
  const vistaActualRef = useRef(currentView);
  vistaActualRef.current = currentView;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = CapApp.addListener('backButton', () => {
      if (document.querySelector('.fixed.inset-0')) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return; }
      if (vistaActualRef.current !== 'dashboard') setCurrentView('dashboard');
      else CapApp.minimizeApp();
    });
    h.catch(() => { /* sin plugin nativo: no hay botón atrás que manejar */ });
    return () => { h.then(x => x.remove()).catch(() => {}); };
  }, []);

  // Global custom event listener for module navigation
  useEffect(() => {
    const handleNavEvent = (e: any) => {
      if (e?.detail) {
        setCurrentView(e.detail);
      }
    };
    window.addEventListener('innova_navigate_tab', handleNavEvent);
    return () => window.removeEventListener('innova_navigate_tab', handleNavEvent);
  }, []);

  if (loading || !authInitialized) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const handlePinLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput || pinInput.length !== 6) {
      setPinError('El PIN debe tener exactamente 6 dígitos numéricos.');
      return;
    }
    setIsLoggingIn(true);
    setPinError('');

    // 0. PREFERRED: server-side PIN verification via Cloud Function (phase 3).
    //    Establishes a trusted Firebase Auth session (role/workspace claims) so
    //    the browser never needs to read the 'usuarios' collection. If the
    //    function is not deployed yet, we fall through to the legacy flow below,
    //    so the app keeps working before and after the function is live.
    try {
      const result = await loginWithPinViaFunction(pinInput);
      const nowStr = new Date().toLocaleDateString('es-PE') + ' ' +
        new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      const sessionUser: SystemUser = result.role === 'admin'
        ? { id: 'admin', name: result.name || 'Innova Contratistas', email: PRIMARY_ADMIN_EMAIL, role: 'admin', pin: '', isActive: true, lastLogin: nowStr }
        : { id: result.workspace.replace(/^user_/, ''), name: result.name || 'Usuario', role: 'user', pin: '', isActive: true, lastLogin: nowStr };
      setUser(sessionUser);
      safeStorage.setItem('savedUser', sessionUser);
      safeStorage.setItem('innova_sesion_v2', true);
      if (result.role === 'admin') {
        safeStorage.setItem('innova_last_authorized_admin_email', PRIMARY_ADMIN_EMAIL);
      }
      setCurrentView('dashboard');
      setIsLoggingIn(false);
      return;
    } catch (fnErr: any) {
      // The server path failed. We intentionally fall through to the legacy
      // client-side flow in ALL cases (not just transport errors):
      //  - If the function is not deployed yet, legacy keeps the app working.
      //  - If the function IS deployed but rejects (e.g. the ADMIN_PIN secret
      //    is unset or differs from the master PIN), the legacy master-admin
      //    hash check below still lets the administrator in, so a server
      //    misconfiguration can never fully lock the admin out.
      // A genuinely wrong PIN simply fails the legacy checks too and shows the
      // normal "PIN no registrado" message.
      const code = String(fnErr?.code || '').toLowerCase();
      console.warn('[pinAuth] server login unavailable, using legacy flow:', code || fnErr?.message);
    }

    try {
      // 1. Verificación del PIN Maestro de Administrador mediante hash SHA-256
      const enteredHash = await computePinSha256(pinInput);
      if (enteredHash === MASTER_ADMIN_PIN_HASH) {
        const adminSystemUser: SystemUser = {
          id: 'admin',
          name: 'Innova Contratistas',
          email: PRIMARY_ADMIN_EMAIL,
          role: 'admin',
          pin: '',
          isActive: true,
          lastLogin: new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        };

        safeStorage.setItem('savedUser', adminSystemUser);
        safeStorage.setItem('innova_sesion_v2', true);
        safeStorage.setItem('innova_last_authorized_admin_email', PRIMARY_ADMIN_EMAIL);
        setUser(adminSystemUser);
        setCurrentView('dashboard');
        return;
      }

      // 2. Consulta de usuarios registrados en 'usuarios'
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 7000)
      );

      const task = async () => {
        const q = query(collection(db, 'usuarios'), where('pin', '==', pinInput));
        return await getDocs(q);
      };

      const snapshot = await Promise.race([task(), timeoutPromise]);
      
      if (snapshot.empty) {
        setPinError('PIN no registrado. Verifica la clave asignada.');
        return;
      }

      const docSnap = snapshot.docs[0];
      const userData = { id: docSnap.id, ...docSnap.data() } as SystemUser;
      if (userData.isActive === false) {
        setPinError('Este usuario ha sido desactivado. Comuníquese con el administrador.');
        return;
      }

      // Update last login in background
      const now = new Date();
      const formattedNow = now.toLocaleDateString('es-PE') + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      setDoc(doc(db, 'usuarios', docSnap.id), {
        lastLogin: formattedNow,
        lastLoginTimestamp: Date.now()
      }, { merge: true }).catch(() => {});

      setUser(userData);
      safeStorage.setItem('savedUser', userData);
      safeStorage.setItem('innova_sesion_v2', true);
      setCurrentView('dashboard');
    } catch (error: any) {
      console.warn('Firestore PIN check error, checking local cache fallback:', error);
      
      // Fallback a usuarios en caché local si Firebase está en cuota excedida o sin conexión
      const cachedUsers: SystemUser[] = 
        safeStorage.getItem<SystemUser[]>('sync_cache_usuarios_admin', []) ||
        safeStorage.getItem<SystemUser[]>('sync_cache_usuarios_shared', []) ||
        safeStorage.getItem<SystemUser[]>('usuarios_backup_snapshot_data', []) || [];

      const cachedUser = Array.isArray(cachedUsers) ? cachedUsers.find(u => u.pin === pinInput) : null;

      if (cachedUser) {
        if (cachedUser.isActive === false) {
          setPinError('Este usuario ha sido desactivado. Comuníquese con el administrador.');
          setIsLoggingIn(false);
          return;
        }

        if (cachedUser.role === 'admin') {
          const adminUser: SystemUser = {
            id: 'admin_master',
            email: cachedUser.email || PRIMARY_ADMIN_EMAIL,
            name: cachedUser.name || 'Innova Contratistas',
            role: 'Administrador',
            pin: '',
            isActive: true
          };
          setUser(adminUser);
          safeStorage.setItem('savedUser', { ...cachedUser, role: 'admin' });
        } else {
          setUser(cachedUser);
          safeStorage.setItem('savedUser', cachedUser);
        }

        setCurrentView('dashboard');
        return;
      }

      const errStr = String(error?.message || error);
      const isQuota = error?.code === 'resource-exhausted' || errStr.toLowerCase().includes('resource-exhausted') || errStr.toLowerCase().includes('quota exceeded');
      if (isQuota) {
        setPinError('Límite de cuota diaria de Firebase alcanzado. El Administrador puede ingresar directamente con su PIN Maestro o actualizar al Plan Blaze.');
      } else if (error?.message === 'TIMEOUT') {
        setPinError('Tiempo de espera agotado al consultar la base de datos. Verifique su conexión a internet.');
      } else {
        setPinError('Error al validar el PIN: ' + (error?.message || 'Intente nuevamente.'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    safeStorage.removeItem('savedUser');
    safeStorage.removeItem('innova_last_authorized_admin_email');
    setUser(null);
    try {
      await auth.signOut();
    } catch (e) {}
    setCurrentView('dashboard');
  };

  if (loading && !user && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4 select-none">
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-2.5 flex items-center justify-center shadow-md shadow-slate-200/60">
            <img src="/icon.svg" alt="Innova Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-slate-900 tracking-tight">Innova Contratistas</h2>
            <p className="text-[11px] text-slate-500 font-medium">Iniciando espacio de trabajo...</p>
          </div>
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-0.5" />
        </div>
      </div>
    );
  }

  if (!isAdmin && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 select-none">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-200/50 max-w-[310px] w-full text-center">
          <div className="flex flex-col items-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center mb-2 shadow-2xs">
              <img src="/icon.svg" alt="Innova Logo Estructuras Metálicas" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">Innova Contratistas</h1>
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Estructuras Metálicas & Obras</p>
          </div>

          <div className="mb-3.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-left flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Key className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800 leading-tight">Acceso por PIN</p>
              <p className="text-[9px] text-slate-500">Ingresa tu clave de 6 dígitos</p>
            </div>
          </div>

          <form onSubmit={(e) => handlePinLogin(e)} className="space-y-3">
            <div className="relative">
              <input
                type={showPinMask ? "password" : "text"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-center text-xl font-mono tracking-[0.3em] font-black text-slate-900 placeholder:text-slate-400 placeholder:tracking-[0.2em]"
                disabled={isLoggingIn}
                autoFocus
              />
              {pinInput.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPinMask(!showPinMask)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold cursor-pointer"
                >
                  {showPinMask ? 'Ver' : 'Ocultar'}
                </button>
              )}
            </div>

            {pinError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-[11px] font-medium text-left flex items-start gap-1.5">
                <span>⚠️</span>
                <span>{pinError}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoggingIn || pinInput.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>
          </form>

          <p className="mt-4 text-[9px] text-slate-400 font-medium">
            Innova Contratistas Cloud
          </p>
        </div>
      </div>
    );
  }

  const handleSaveHerreriaToProject = (projectId: string, projectData: any) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          presupuesto: projectData.presupuesto,
          materiales: [...(p.materiales || []), ...(projectData.materiales || [])],
          detallesContrato: (p.detallesContrato ? p.detallesContrato + '\n\n' : '') + projectData.detallesContrato
        };
      }
      return p;
    }));
  };

  const handleCreateHerreriaProject = (newProject: any) => {
    setProjects(prev => [newProject, ...prev]);
  };

  // Varias vistas internas pertenecen al mismo interruptor del menú (p. ej. el
  // Panel abre 'gastos', que es parte de "Materiales & Gastos").
  const SECCION_DE_VISTA: Partial<Record<string, string>> = {
    gastos: 'materials', clients: 'projects', asistencia: 'personal', epp: 'contracts',
    carpinteria: 'herreria', tickets: 'soporte', asesorias: 'soporte', finances: 'inversion',
  };
  const seccionDeVista = (v: string) => SECCION_DE_VISTA[v] || v;
  const vistaBloqueada = (v: string) => !isAdmin && v !== 'dashboard' && disabledSections.includes(seccionDeVista(v));
  const renderMantenimiento = () => (
    <MantenimientoView
      seccion={allNavItems.find(it => it.id === seccionDeVista(currentView))?.label}
      appName={currentSettings?.appName}
      onVolver={() => setCurrentView('dashboard')}
    />
  );

  const cargandoModulo = (
    <div className="w-full h-full min-h-[40vh] flex items-center justify-center">
      <div className="w-7 h-7 border-[3px] border-slate-300 border-t-emerald-500 rounded-full animate-spin" aria-label="Cargando" />
    </div>
  );

  const renderView = () => {
    // Si un usuario (no admin) entra a un apartado en desarrollo, mostramos la
    // pantalla de mantenimiento en vez del módulo real.
    if (vistaBloqueada(currentView)) return renderMantenimiento();
    switch (currentView) {
      case 'dashboard': return <DashboardView projects={filteredProjects} finances={filteredFinances} setCurrentView={setCurrentView} isAdmin={isAdmin} asesorias={asesorias} currentUser={user} globalNotifs={globalNotifs} setGlobalNotifs={setGlobalNotifs} />;
      case 'admin_purchases': return <AdminPurchasesView />;
      case 'supervision': return isAdmin ? (
        <SupervisionView usuarios={usuarios} projects={projects} clients={clients} finances={finances} settings={settings}
          setProjects={setProjects} setClients={setClients} setFinances={setFinances} setSettings={setSettings} />
      ) : null;
      case 'techos':
        return (
          <TechosModuleView 
            projects={filteredProjects} 
            clients={filteredClients} 
            onSaveToProject={handleSaveHerreriaToProject} 
            onCreateProject={handleCreateHerreriaProject} 
            onNavigateToProjects={() => setCurrentView('projects')} 
            currentSettings={currentSettings}
            isAdmin={isAdmin}
            currentUserName={user ? user.name : 'Administrador Principal'}
          />
        );
      case 'calculator': return null; // Rendered in persistent wrapper
      case 'herreria':
      case 'carpinteria': 
        return (
          <HerreriaModuleView 
            projects={filteredProjects} 
            clients={filteredClients} 
            onSaveToProject={handleSaveHerreriaToProject} 
            onCreateProject={handleCreateHerreriaProject} 
            onNavigateToProjects={() => setCurrentView('projects')} 
            currentSettings={currentSettings}
          />
        );
      case 'portafolio':
      case 'projects':
      case 'clients':
        return (
          <ProyectosYClientesView 
            projects={filteredProjects} 
            setProjects={setProjects} 
            clients={filteredClients} 
            setClients={setClients} 
            finances={filteredFinances} 
            initialSubTab={currentView === 'clients' ? 'clients' : currentView === 'portafolio' ? 'portafolio' : 'projects'}
            isAdmin={isAdmin}
            currentUser={user || (isAdmin ? { id: 'admin', name: 'Administrador Principal', role: 'Administrador', pin: '', isActive: true, lastLogin: '' } as SystemUser : null)}
            onNavigateToTechos={() => setCurrentView('techos')}
          />
        );
      case 'materials':
      case 'gastos':
        return (
          <MaterialesYGastosView 
            projects={filteredProjects} 
            setProjects={setProjects} 
            finances={filteredFinances} 
            setFinances={setFinances} 
            initialSubTab={currentView === 'gastos' ? 'gastos' : 'materials'}
          />
        );
      case 'personal':
      case 'asistencia':
        return (
          <PersonalYAsistenciaView 
            projects={filteredProjects} 
            setProjects={setProjects} 
            initialSubTab={currentView === 'asistencia' ? 'asistencia' : 'personal'}
          />
        );
      case 'contracts':
      case 'epp':
        return (
          <ContratosYEPPView 
            projects={filteredProjects} 
            setProjects={setProjects}
            clients={filteredClients} 
            setClients={setClients}
            currentSettings={currentSettings}
            setSettings={setSettings}
            initialSubTab={currentView === 'epp' ? 'epp' : 'contratos'}
            isAdmin={isAdmin}
          />
        );
      case 'finances': return <FinanceGenericView type="inversion" title="Finanzas" subtitle="" icon={TrendingUp} colorClass="indigo" finances={filteredFinances} setFinances={setFinances} projects={filteredProjects} />;
      case 'familia': return <FinanceGenericView type="familia" title="Finanzas Familiares" subtitle="Control de gastos personales" icon={Home} colorClass="rose" finances={filteredFinances} setFinances={setFinances} projects={filteredProjects} />;
      case 'inversion': return <FinanceGenericView type="inversion" title="Inversiones" subtitle="Capital invertido en equipos/negocio" icon={TrendingUp} colorClass="emerald" finances={filteredFinances} setFinances={setFinances} projects={filteredProjects} />;
      case 'deuda': return <FinanceGenericView type="deuda" title="Deudas y Préstamos" subtitle="Control de cuentas por pagar" icon={CreditCard} colorClass="rose" finances={filteredFinances} setFinances={setFinances} projects={filteredProjects} />;
      case 'precios': return <CatalogoPreciosView projects={filteredProjects} />;
      case 'concreto': return <ConcretoMetradosView onIrATechos={() => setCurrentView('techos')} />;
      case 'drywall': return <DrywallView onIrATechos={() => setCurrentView('techos')} onIrAPrecios={() => setCurrentView('precios')} />;
      case 'usuarios': return <UsuariosView usuarios={usuarios} setUsuarios={setUsuarios} isAdmin={isAdmin} />;
      case 'soporte':
      case 'tickets':
      case 'asesorias':
        return (
          <SoporteYAsesoriasView 
            tickets={tickets} 
            setTickets={setTickets} 
            asesorias={asesorias} 
            setAsesorias={setAsesorias} 
            currentUser={user} 
            isAdmin={isAdmin}
            initialSubTab={currentView === 'asesorias' ? 'asesorias' : 'tickets'}
            usuariosList={usuarios}
          />
        );
      case 'biblioteca': 
        return (
          <BibliotecaPremiumView 
            items={biblioteca} 
            setItems={setBiblioteca} 
            currentUser={user} 
            isAdmin={isAdmin} 
            userEmail={user?.email || ''}
            usuariosList={usuarios}
          />
        );
      case 'usabilidad':
        return (
          <UsabilidadVideosView 
            videos={tutoriales}
            setVideos={setTutoriales}
            isAdmin={isAdmin}
            currentSettings={currentSettings}
            currentUser={user}
          />
        );
      case 'settings': 
        return (
          <SettingsView 
            projects={projects} 
            setProjects={setProjects} 
            clients={filteredClients} 
            setClients={setClients} 
            finances={finances} 
            setFinances={setFinances} 
            settings={settings} 
            setSettings={setSettings} 
            isAdmin={isAdmin} 
            currentUserName={user?.name || 'Administrador Principal'}
            usuarios={usuarios}
            setUsuarios={setUsuarios}
            cursos={cursos}
            setCursos={setCursos}
            tutoriales={tutoriales}
            setTutoriales={setTutoriales}
            biblioteca={biblioteca}
            setBiblioteca={setBiblioteca}
            tickets={tickets}
            setTickets={setTickets}
            asesorias={asesorias}
            setAsesorias={setAsesorias}
            globalNotifs={globalNotifs}
            setGlobalNotifs={setGlobalNotifs}
          />
        );
      default: return <DashboardView projects={projects} finances={finances} setCurrentView={setCurrentView} isAdmin={isAdmin} globalNotifs={globalNotifs} setGlobalNotifs={setGlobalNotifs} currentUser={user} />;
    }
  };

  const getDebtPaymentsTotal = (f: FinanceRecord) => f.type === 'deuda' ? (f.payments?.reduce((s, p) => s + p.amount, 0) || (f.isPaid ? f.amount : 0)) : 0;
  
  const pendingDebtsCount = filteredFinances.filter(r => {
    if (r.type !== 'deuda' || r.isPaid) return false;
    const totalPaid = getDebtPaymentsTotal(r);
    const pendingAmount = r.amount - totalPaid;
    if (pendingAmount <= 0) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recordDate = new Date(r.date + 'T00:00:00');
    const diffTime = recordDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 3;
  }).length;

  const allNavItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: Activity },
    { id: 'calculator', label: 'Calculadora Estructural', icon: Calculator },
    { id: 'techos', label: 'Techos Metálicos', icon: PenTool },
    { id: 'concreto', label: 'Obra Civil', icon: Box },
    { id: 'herreria', label: 'CarpiMetal', icon: DoorClosed },
    { id: 'drywall', label: 'Drywall', icon: PanelsTopLeft },
    { id: 'projects', label: 'Proyectos & Clientes', icon: Briefcase },
    { id: 'portafolio', label: 'Carpeta Privada', icon: FolderKanban },
    { id: 'materials', label: 'Materiales & Gastos', icon: Package },
    { id: 'personal', label: 'Personal', icon: Users },
    { id: 'usuarios', label: 'Accesos (PIN)', icon: Key, adminOnly: true },
    { id: 'familia', label: 'Caja Familiar', icon: Home },
    { id: 'inversion', label: 'Inversiones', icon: TrendingUp },
    { id: 'deuda', label: 'Deudas', icon: CreditCard, badge: pendingDebtsCount },
    { id: 'precios', label: 'Precios', icon: DollarSign },
    { id: 'usabilidad', label: 'Academia Técnica', icon: Video },
    { id: 'admin_purchases', label: 'Validar Compras', icon: ShieldCheck, adminOnly: true },
    { id: 'supervision', label: 'Supervisión', icon: Eye, adminOnly: true },
    { id: 'biblioteca', label: 'Recursos Técnicos', icon: BookOpen },
    { id: 'contracts', label: 'Contratos & EPP', icon: FileSignature },
    { id: 'soporte', label: 'Atención & Asesorías', icon: Headset },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];
  
  const navItems = isAdmin
    // El admin ve todo; las secciones ocultas para usuarios se marcan "en desarrollo".
    ? allNavItems.map(item => ({ ...item, enDesarrollo: disabledSections.includes(item.id) }))
    // Los usuarios no ven las secciones solo-admin; las que están en desarrollo se
    // muestran con la etiqueta "Mantenimiento" (al entrar ven una pantalla bonita).
    : allNavItems.filter(item => !item.adminOnly).map(item => ({ ...item, enMantenimiento: vistaBloqueada(item.id) }));

  const rawDisplayName = isAdmin ? (user?.name || user?.email || 'Administrador') : user?.name;
  const cleanUserName = (rawDisplayName && rawDisplayName.toLowerCase().includes('newton')) ? 'Innova Contratistas' : (rawDisplayName || 'Administrador');
  const activeLogo = currentSettings?.logoBase64 || safeStorage.getItem('innova_logo_' + (activeUid || 'guest'), '') || defaultAdminLogo;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* PANEL DE INTERRUPTORES DE APARTADOS (solo admin) */}
      {isAdmin && showDevPanel && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3" onClick={() => setShowDevPanel(false)}>
          <div className="bg-white w-full max-w-md max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-900">Apartados en desarrollo</h3>
                <p className="text-[11px] text-slate-500">Desactiva los apartados que aún no quieres mostrar a los usuarios. Tú (admin) siempre los ves.</p>
              </div>
              <button onClick={() => setShowDevPanel(false)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {allNavItems.filter(it => it.id !== 'dashboard' && it.id !== 'settings').map(it => {
                const off = disabledSections.includes(it.id);
                return (
                  <div key={it.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <it.icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-sm font-bold text-slate-700 truncate">{it.label}</span>
                    </div>
                    <button
                      onClick={() => setDisabledSections(off ? disabledSections.filter(s => s !== it.id) : [...disabledSections, it.id])}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${off ? 'bg-slate-300' : 'bg-emerald-500'}`}
                      title={off ? 'Oculto para usuarios' : 'Visible para usuarios'}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${off ? 'left-0.5' : 'left-[22px]'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{disabledSections.length} oculto(s) para usuarios</span>
              <button onClick={() => setShowDevPanel(false)} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800">Listo</button>
            </div>
          </div>
        </div>
      )}
      <div className={`fixed xl:static inset-y-0 left-0 z-50 ${isSidebarCollapsed ? 'xl:w-20 w-72' : 'w-72'} bg-slate-900 text-slate-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0 transition-transform duration-200 ease-out flex flex-col`}>
        <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center xl:px-2' : 'justify-between'} border-b border-slate-800`}>
          <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
            <img 
              src={activeLogo} 
              alt="Logo Administrador" 
              className="w-8 h-8 rounded-lg bg-white p-0.5 object-cover flex-shrink-0 shadow-2xs border border-slate-700/80" 
              onError={(e) => { (e.target as HTMLImageElement).src = defaultAdminLogo; }}
            />
            {!isSidebarCollapsed && (
              <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate flex-1" title={currentSettings.appName}>
                {currentSettings.appName}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {/* Interruptores de apartados (solo admin) */}
            {isAdmin && !isSidebarCollapsed && (
              <button
                className="text-slate-400 hover:text-amber-300 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => setShowDevPanel(true)}
                title="Habilitar / ocultar apartados en desarrollo"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            {/* Botón de Colapsar en Escritorio */}
            <button
              className="hidden xl:block text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button className="xl:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}><Menu className="w-5 h-5" /></button>
          </div>
        </div>
        <div className={`flex-1 overflow-y-auto py-4 ${isSidebarCollapsed ? 'px-2' : 'px-3'} custom-scrollbar`}>
          <div className="space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const enDesarrollo = (item as any).enDesarrollo;
              const enMantenimiento = (item as any).enMantenimiento;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id as ViewType); setIsMobileMenuOpen(false); }}
                  className={`group w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-2.5' : 'pl-3 pr-2.5 py-2'} rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                  title={item.label}
                >
                  {isActive && !isSidebarCollapsed && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-emerald-400" />}
                  <Icon className={`w-[18px] h-[18px] ${isSidebarCollapsed ? '' : 'mr-3'} shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {!isSidebarCollapsed && <span className="truncate text-[13px]">{item.label}</span>}
                  {!isSidebarCollapsed && item.badge ? (
                    <span className="ml-auto text-[10px] font-black bg-rose-500 text-white rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{item.badge}</span>
                  ) : null}
                  {!isSidebarCollapsed && enDesarrollo ? (
                    <span className="ml-auto text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded px-1 py-0.5">EN DESARROLLO</span>
                  ) : null}
                  {!isSidebarCollapsed && enMantenimiento ? (
                    <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded px-1 py-0.5">
                      <Wrench className="w-2.5 h-2.5" /> MANTENIMIENTO
                    </span>
                  ) : null}
                </button>
              );            })}
          </div>
        </div>
        
        {/* Software Version Info & Status for All Users */}
        {!isSidebarCollapsed && (
          <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-mono font-bold text-slate-300">{currentSettings.softwareVersion || 'v3.9.5 Pro'}</span>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              Al Día
            </span>
          </div>
        )}

        {/* User / Admin Session Footer */}
        <div className={`p-3.5 border-t border-slate-800 mt-auto bg-slate-950/60 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} w-full gap-2`}>
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <img 
                      src={activeLogo} 
                      alt="Avatar Administrador" 
                      className="w-9 h-9 rounded-xl object-cover bg-white p-0.5 border border-indigo-500/70 shadow-md"
                      onError={(e) => { (e.target as HTMLImageElement).src = defaultAdminLogo; }}
                    />
                    {isAdmin && (
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full ring-2 ring-slate-950" title="Administrador Verificado">
                        <ShieldCheck className="w-3 h-3 font-black" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-100 truncate max-w-[125px]" title={cleanUserName}>
                      {cleanUserName}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isAdmin ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                      <p className="text-[10px] text-indigo-300 font-semibold truncate">
                        {isAdmin ? 'Administrador' : 'Usuario'}
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <img 
                    src={activeLogo} 
                    alt="Logo Admin" 
                    className="w-8 h-8 rounded-lg object-cover bg-white p-0.5 border border-indigo-500/70"
                    onError={(e) => { (e.target as HTMLImageElement).src = defaultAdminLogo; }}
                  />
                </div>
                <button 
                  onClick={handleLogout} 
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title={`Cerrar Sesión (${cleanUserName})`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen bg-slate-50 text-slate-800">
        {currentView !== 'designer' && (
          <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex justify-between items-center z-10 xl:hidden shrink-0 shadow-2xs">
             <div className="flex items-center space-x-2.5 min-w-0">
               <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"><Menu className="w-6 h-6"/></button>
               <img 
                 src={activeLogo} 
                 alt="Logo Admin" 
                 className="w-8 h-8 rounded-lg object-cover bg-white border border-slate-200 p-0.5 shrink-0 shadow-2xs"
                 onError={(e) => { (e.target as HTMLImageElement).src = defaultAdminLogo; }}
               />
               <div className="min-w-0">
                 <h2 className="text-sm font-black text-slate-800 truncate">{currentSettings.appName}</h2>
                 <p className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                   {isAdmin ? (
                     <>
                       <ShieldCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                       <span>Administrador Principal</span>
                     </>
                   ) : (
                     <>
                       <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                       <span className="text-slate-600 font-semibold">{user?.name || 'Usuario'}</span>
                     </>
                   )}
                 </p>
               </div>
             </div>
          </header>
        )}
        
        {/* Diseñador y Calculadora se mantienen vivos al cambiar de apartado, pero
            solo se montan la primera vez que se abren (antes cargaban al arrancar). */}
        {vistasAbiertas.current.has('designer') && (
        <div className={currentView === 'designer' ? 'flex-1 min-h-0 w-full overflow-hidden flex flex-col' : 'hidden'}>
          <Suspense fallback={cargandoModulo}>
          <DiseñadorView 
            onOpenCarpinteria={() => setCurrentView('herreria')} 
            onToggleMenu={() => setIsMobileMenuOpen(true)}
            onGoBack={() => setCurrentView('dashboard')}
          />
          </Suspense>
        </div>
        )}

        {vistasAbiertas.current.has('calculator') && (
        <div className={currentView === 'calculator' ? 'flex-1 overflow-y-auto bg-slate-50/50 p-4 xl:p-8 scroll-smooth' : 'hidden'}>
          <div className="max-w-7xl mx-auto h-full">
            {vistaBloqueada('calculator') ? renderMantenimiento() : <Suspense fallback={cargandoModulo}><CotizadorRapidoView /></Suspense>}
          </div>
        </div>
        )}

        {/* Other Views Container */}
        {sesionLimitada && (
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-amber-100 border-b border-amber-300 text-amber-900 text-xs font-bold">
            <span>Tu sesión es antigua: no puedes ver los comunicados ni algunas configuraciones. Vuelve a ingresar tu PIN.</span>
            <button type="button" onClick={() => { setPinError('Ingresa tu PIN para renovar la sesión.'); handleLogout(); }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer">Renovar sesión</button>
          </div>
        )}
        {currentView !== 'designer' && currentView !== 'calculator' && (
          <main className={currentView === 'herreria' || currentView === 'carpinteria' || currentView === 'techos' ? "flex-1 overflow-hidden bg-slate-950 p-0" : "flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-4 xl:p-8 scroll-smooth"}>
            <div className={currentView === 'herreria' || currentView === 'carpinteria' || currentView === 'techos' ? "w-full h-full" : "max-w-7xl mx-auto h-full"}>
              <EmpresaProvider value={empresaCtx}><Suspense fallback={cargandoModulo}>{renderView()}</Suspense></EmpresaProvider>
            </div>
          </main>
        )}
      </div>
      
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 xl:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}
      <OfflineIndicator />
    </div>
  );
}
