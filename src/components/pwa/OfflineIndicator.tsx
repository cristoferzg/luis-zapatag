import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle, X } from 'lucide-react';
import { useOnlineStatus } from '../../lib/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(() => {
    try {
      return localStorage.getItem('firestore_quota_exceeded') === 'true';
    } catch (_e) {
      return false;
    }
  });

  useEffect(() => {
    const checkQuota = () => {
      try {
        const val = localStorage.getItem('firestore_quota_exceeded') === 'true';
        const timestamp = localStorage.getItem('firestore_quota_exceeded_timestamp');
        
        // Auto-clear after 12 hours
        if (val && timestamp) {
          const hoursPassed = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
          if (hoursPassed > 12) {
            localStorage.removeItem('firestore_quota_exceeded');
            localStorage.removeItem('firestore_quota_exceeded_timestamp');
            window.location.reload();
            return;
          }
        }
        
        setIsQuotaExceeded(val);
      } catch (_e) {}
    };
    
    // Listen to custom DB quota events
    window.addEventListener('firestore_quota_status_changed', checkQuota);
    window.addEventListener('storage', checkQuota);
    
    return () => {
      window.removeEventListener('firestore_quota_status_changed', checkQuota);
      window.removeEventListener('storage', checkQuota);
    };
  }, []);

  // Priority 1: No Internet Connection
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/90 backdrop-blur-sm border border-amber-400/40 px-3.5 py-2 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 select-none">
        <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
        <span>Modo sin conexión — Los datos están almacenados localmente.</span>
      </div>
    );
  }

  const handleReconnect = () => {
    try {
      localStorage.removeItem('firestore_quota_exceeded');
      localStorage.removeItem('firestore_quota_exceeded_timestamp');
      window.dispatchEvent(new Event('firestore_quota_status_changed'));
      window.location.reload();
    } catch (_e) {}
  };

  // Priority 2: Database Quota Exceeded (Operating on fast local fallback)
  if (isQuotaExceeded && !isDismissed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-2xl bg-indigo-950/95 backdrop-blur-md border border-indigo-500/40 p-4 text-xs font-medium text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 select-none max-w-md">
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-yellow-400 animate-bounce" />
            <span className="font-extrabold uppercase tracking-wider text-yellow-300">Modo Local Activo</span>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="sm:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            title="Ocultar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <span className="text-slate-200 text-[11px] leading-snug">
            Base de datos en modo local de resguardo. ¿Deseas intentar conectarte de nuevo a Firebase en vivo?
          </span>
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={handleReconnect}
              className="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              Reconectar Firebase
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="hidden sm:inline-flex text-slate-400 hover:text-slate-200 px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer"
            >
              Ocultar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
