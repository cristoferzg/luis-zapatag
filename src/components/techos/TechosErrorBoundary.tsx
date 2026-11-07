// Boundary de Error aislado exclusivo para el Módulo Techos Metálicos
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { esErrorDeVersion, recargarPorVersionNueva } from '../../lib/versionNueva';
import { plataforma } from '../../lib/appDescargas';

/** El navegador no pudo crear el lienzo 3D (tarjeta de video, drivers o demasiados 3D abiertos). */
const esErrorWebGL = (e?: Error) => !!e && /webgl|context/i.test(e.message || '');

/** Pasos según dónde se usa: cada lugar tiene los suyos (no se mezclan). */
const pasosWebGL = (): string[] => {
  const p = plataforma();
  if (p === 'pc') return [
    'Toca «Reiniciar Lienzo CAD».',
    'Si sigue igual, cierra InnovApp del todo (clic derecho en el ícono junto al reloj → Salir) y vuelve a abrirlo.',
    'Si tienes un programa anterior a la versión 2.1.1, instala el nuevo (Configuración → Descargar la app → Computadora).',
    'Si la PC es antigua, actualiza el driver de la tarjeta de video (Windows Update → Actualizaciones opcionales).',
  ];
  if (p === 'android' || p === 'ios') return [
    'Toca «Reiniciar Lienzo CAD».',
    'Si sigue igual, cierra la app (quítala de las apps recientes) y vuelve a abrirla.',
  ];
  return [
    'Toca «Reiniciar Lienzo CAD» (si tienes otras pestañas con 3D abiertas, ciérralas antes).',
    'Si sigue igual, recarga la página con F5.',
    'En Chrome: menú ⋮ → Configuración → Sistema → activa «Usar aceleración de gráficos cuando esté disponible» y toca «Reiniciar».',
    'Si la PC es antigua, actualiza Chrome (menú ⋮ → Ayuda → Información de Google Chrome) y el driver de la tarjeta de video.',
  ];
};

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
                {esErrorWebGL(this.state.error) ? 'Este equipo no pudo abrir el 3D en este momento. Tus datos están a salvo.' : 'Se detectó una excepción en el lienzo o cálculo CAD. La aplicación sigue estable.'}
              </p>
            </div>
            {esErrorWebGL(this.state.error) && (
              <ol className="text-left text-[11px] text-slate-300 bg-slate-900/70 rounded-xl p-3 pl-7 list-decimal space-y-1">
                {pasosWebGL().map(t => <li key={t}>{t}</li>)}
              </ol>
            )}

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
