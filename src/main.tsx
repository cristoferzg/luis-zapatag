import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { AppErrorBoundary } from './components/common/AppErrorBoundary'
import { auditLogger } from './lib/auditLogger'
import { ensureAnonymousAuth } from './lib/firebase'
import { registerSW } from 'virtual:pwa-register'

// Establish an (anonymous) Firebase Auth session as early as possible so that
// every Firestore/Storage request is authenticated and the security rules can
// reject unauthenticated traffic. Best-effort and non-blocking.
ensureAnonymousAuth();

// Registro y monitoreo de Service Worker para PWA (únicamente en producción)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      auditLogger.info('PWA', 'Nueva versión de la aplicación lista en caché PWA.');
    },
    onOfflineReady() {
      auditLogger.info('PWA', 'La aplicación está precargada y lista para operar 100% sin conexión.');
    },
    onRegistered(r) {
      if (r) {
        auditLogger.info('PWA', `Service Worker activo en ámbito: ${r.scope}`);
      }
    },
    onRegisterError(error) {
      auditLogger.warn('PWA', 'No se pudo registrar el Service Worker.', { error: String(error) });
    }
  });
}

// Global error handling for unhandled rejections and cross-origin script errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : (reason?.message || String(reason || ''));
    if (
      msg.includes('Script error') ||
      msg.includes('popup-blocked') ||
      msg.includes('network-request-failed') ||
      msg.includes('popup-closed-by-user') ||
      msg.includes('cancelled-popup-request') ||
      msg.includes('auth/')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    if (event.message === 'Script error.' || event.message?.includes('Script error')) {
      event.preventDefault();
    }
  });
}

// Suppress benign Firebase clock skew warnings, internal assertion errors, and fetch setter warnings
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const isBenignMessage = (args: any[]) => {
  const fullMsg = args.map(a => typeof a === 'string' ? a : (a?.message || a?.stack || String(a || ''))).join(' ');
  return (
    fullMsg.includes('INTERNAL ASSERTION FAILED') ||
    fullMsg.includes('Pending promise was never set') ||
    fullMsg.includes('Detected an update time that is in the future') ||
    fullMsg.includes('auth/popup-blocked') ||
    fullMsg.includes('auth/network-request-failed') ||
    fullMsg.includes('auth/unauthorized-domain') ||
    fullMsg.includes('Google login error') ||
    fullMsg.includes('Script error') ||
    (fullMsg.includes('Cannot set property fetch of') && fullMsg.includes('getter'))
  );
};

console.error = (...args: any[]) => {
  if (isBenignMessage(args)) return;
  
  const msg = typeof args[0] === 'string' ? args[0] : (args[0]?.message || String(args[0] || ''));
  if (msg && !msg.includes('ResizeObserver') && !msg.includes('WebGL')) {
    auditLogger.error('SYSTEM', `Console Error: ${msg.slice(0, 200)}`);
  }

  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  if (isBenignMessage(args)) return;
  originalConsoleWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary fallbackTitle="Centro de Mitigación de Excepciones PWA">
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
