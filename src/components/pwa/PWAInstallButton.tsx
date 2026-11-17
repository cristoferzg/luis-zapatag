import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'sidebar' | 'banner';
  className?: string;
  isAdmin?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'compact',
  className = '',
  isAdmin = false
}) => {
  const { isInstalled, isInstallable } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If running in standalone mode, show a discreet status or hide
  if (isInstalled && variant === 'banner') {
    return null;
  }

  return (
    <>
      {variant === 'compact' && (
        <button
          onClick={() => setModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all ${className}`}
          title="Instalar en Android, iOS o PC"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Instalar App</span>
          <span className="sm:hidden">App</span>
          {isInstallable && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      )}

      {variant === 'full' && (
        <button
          onClick={() => setModalOpen(true)}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Instalar en Android / iOS / PC</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={() => setModalOpen(true)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 transition-colors ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block font-semibold text-white">Instalar App</span>
              <span className="block text-[10px] text-slate-400">Android, iOS, PC</span>
            </div>
          </div>
          {isInstalled ? (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Download className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      )}

      {variant === 'banner' && !isInstalled && (
        <div className={`bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Lleva Innova en tu Celular o Computadora</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Instala como aplicación nativa en Android, iPhone/iPad y PC con acceso instantáneo.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Ver Opciones de Instalación</span>
          </button>
        </div>
      )}

      <PWAInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} isAdmin={isAdmin} />
    </>
  );
};
