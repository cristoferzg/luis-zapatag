import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Download, RotateCcw, ShieldAlert } from 'lucide-react';
import { auditLogger } from '../../lib/auditLogger';
import { safeStorage } from '../../lib/storageManager';
import { esErrorDeVersion, recargarPorVersionNueva } from '../../lib/versionNueva';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Apartado de la versión anterior que ya no existe: se recarga solo.
    if (esErrorDeVersion(error) && recargarPorVersionNueva()) return;
    this.setState({ errorInfo });
    auditLogger.error('EXCEPTION', `Error de interfaz atrapado por AppErrorBoundary: ${error.message}`, {
      componentStack: errorInfo.componentStack
    }, error.stack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleEmergencyClean = () => {
    safeStorage.pruneTransientStorage();
    this.handleReload();
  };

  private handleDownloadDiagnostic = () => {
    try {
      const data = auditLogger.exportDiagnosticReport();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnostico-innova-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error exportando diagnóstico:', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {this.props.fallbackTitle || 'Se detectó una excepción en la vista'}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  El sistema de mitigación PWA aisló el problema para evitar la pérdida de datos.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs font-mono space-y-2 overflow-hidden">
              <div className="flex items-center text-rose-400 font-semibold gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="truncate">{this.state.error?.name || 'Error'}: {this.state.error?.message || 'Error inesperado'}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Los registros del evento se han guardado en el módulo de auditoría de logs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition-colors shadow-lg shadow-blue-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reintentar componente</span>
              </button>

              <button
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar aplicación</span>
              </button>

              <button
                onClick={this.handleDownloadDiagnostic}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-medium text-xs transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Exportar diagnóstico</span>
              </button>

              <button
                onClick={this.handleEmergencyClean}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-medium text-xs transition-colors"
                title="Libera espacio de almacenamiento temporal sin borrar proyectos"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Limpiar caché temporal</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
