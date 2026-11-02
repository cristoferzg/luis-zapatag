// Boundary de Error aislado exclusivo para el Módulo Techos Metálicos
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { esErrorDeVersion, recargarPorVersionNueva } from '../../lib/versionNueva';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TechosErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (esErrorDeVersion(error) && recargarPorVersionNueva()) return; // versión nueva desplegada
    console.error('[TechosErrorBoundary] Error capturado:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 text-center select-none font-sans">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/30 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase">
                {this.props.fallbackTitle || 'Aviso en Módulo Techos Metálicos'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Se detectó una excepción en el lienzo o cálculo CAD. La aplicación sigue estable.
              </p>
            </div>

            {this.state.error && (
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-mono text-red-300 truncate text-left">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reiniciar Lienzo CAD</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TechosErrorBoundary;
