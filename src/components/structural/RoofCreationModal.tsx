import React from 'react';
import { 
  Grid, 
  Sparkles, 
  Compass, 
  PenTool, 
  Sliders, 
  X, 
  CheckCircle2
} from 'lucide-react';
import { TipoTecho, DireccionCaida } from './structuralTypes';

export interface RoofTemplateOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  tipoTecho: TipoTecho;
  defaultLargo: number;
  defaultAncho: number;
  defaultAlto: number;
  defaultPendiente: number;
  direccionCaida: DireccionCaida;
  renderGraphic: () => React.ReactNode;
}

interface RoofCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: RoofTemplateOption) => void;
  onCustomDimensions: (params: {
    frente: number;
    fondoDer: number;
    posterior: number;
    fondoIzq: number;
    hAlto: number;
    hBajo: number;
    caida: DireccionCaida;
    tipoTecho: TipoTecho;
  }) => void;
  onStartBlank: () => void;
}

export const ROOF_TEMPLATES: RoofTemplateOption[] = [
  {
    id: 'una_caida',
    title: 'Una Agua (Monopendiente)',
    subtitle: 'Cocheras, patios, almacenes adosados',
    description: 'Caída uniforme hacia la calle o hacia el fondo con pendiente continua.',
    badge: 'Más Usado',
    tipoTecho: 'una_caida',
    defaultLargo: 12.0,
    defaultAncho: 8.0,
    defaultAlto: 3.8,
    defaultPendiente: 10.0,
    direccionCaida: 'calle',
    renderGraphic: () => (
      <svg viewBox="0 0 160 100" className="w-full h-24 stroke-current">
        {/* Isometric Monoslope Roof */}
        <polygon points="25,65 110,75 140,40 55,30" fill="#3b82f6" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
        {/* Columns */}
        <line x1="25" y1="65" x2="25" y2="88" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="110" y1="75" x2="110" y2="98" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="140" y1="40" x2="140" y2="70" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="55" y1="30" x2="55" y2="60" stroke="#1e293b" strokeWidth="2.5" />
        {/* Fall Arrow */}
        <path d="M 80,38 L 70,68" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#arrow)" />
        <text x="75" y="85" fontSize="9" fill="#2563eb" fontWeight="bold" textAnchor="middle">Caída 10%</text>
      </svg>
    )
  },
  {
    id: 'dos_aguas',
    title: 'Dos Aguas (Cumbrera Central)',
    subtitle: 'Naves industriales, talleres, viviendas',
    description: 'Dos faldones inclinados unidos en cumbrera central con drenaje a dos lados.',
    badge: 'Industrial',
    tipoTecho: 'dos_aguas',
    defaultLargo: 16.0,
    defaultAncho: 12.0,
    defaultAlto: 4.5,
    defaultPendiente: 15.0,
    direccionCaida: 'personalizada',
    renderGraphic: () => (
      <svg viewBox="0 0 160 100" className="w-full h-24 stroke-current">
        {/* Left Slope */}
        <polygon points="20,65 75,40 115,25 60,50" fill="#3b82f6" fillOpacity="0.25" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
        {/* Right Slope */}
        <polygon points="75,40 130,55 170,40 115,25" fill="#60a5fa" fillOpacity="0.35" stroke="#1d4ed8" strokeWidth="2" strokeLinejoin="round" />
        {/* Ridge Line */}
        <line x1="75" y1="40" x2="115" y2="25" stroke="#dc2626" strokeWidth="2.5" />
        {/* Columns */}
        <line x1="20" y1="65" x2="20" y2="88" stroke="#1e293b" strokeWidth="2" />
        <line x1="130" y1="55" x2="130" y2="78" stroke="#1e293b" strokeWidth="2" />
        <line x1="60" y1="50" x2="60" y2="73" stroke="#1e293b" strokeWidth="2" />
        <line x1="170" y1="40" x2="170" y2="63" stroke="#1e293b" strokeWidth="2" />
      </svg>
    )
  },
  {
    id: 'forma_l',
    title: 'Techo en Forma de L',
    subtitle: 'Construcciones perimétricas, esquinas y patios',
    description: 'Geometría en escuadra de 6 vértices con dos sectores articulados.',
    tipoTecho: 'forma_l',
    defaultLargo: 14.0,
    defaultAncho: 10.0,
    defaultAlto: 3.5,
    defaultPendiente: 8.0,
    direccionCaida: 'calle',
    renderGraphic: () => (
      <svg viewBox="0 0 160 100" className="w-full h-24 stroke-current">
        <polygon points="30,70 90,70 90,45 135,45 135,25 30,25" fill="#3b82f6" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
        <line x1="90" y1="45" x2="90" y2="25" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
        <text x="60" y="50" fontSize="9" fill="#1e293b" fontWeight="bold">Sec A</text>
        <text x="110" y="38" fontSize="9" fill="#1e293b" fontWeight="bold">Sec B</text>
      </svg>
    )
  },
  {
    id: 'forma_u',
    title: 'Techo en Forma de U',
    subtitle: 'Patios centrales y terrazas envolventes',
    description: 'Estructura en herradura con patio central libre de cobertura.',
    tipoTecho: 'forma_u',
    defaultLargo: 16.0,
    defaultAncho: 12.0,
    defaultAlto: 3.5,
    defaultPendiente: 8.0,
    direccionCaida: 'interior',
    renderGraphic: () => (
      <svg viewBox="0 0 160 100" className="w-full h-24 stroke-current">
        <polygon points="25,75 135,75 135,25 105,25 105,55 55,55 55,25 25,25" fill="#3b82f6" fillOpacity="0.2" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" />
        <text x="80" y="42" fontSize="8" fill="#ef4444" fontWeight="bold" textAnchor="middle">PATIO VACÍO</text>
      </svg>
    )
  },
  {
    id: 'casi_plano',
    title: 'Plano con Caída Técnica',
    subtitle: 'Azoteas modernas, edificios residenciales',
    description: 'Pendiente mínima técnica del 3% al 5% oculta tras parapetos.',
    tipoTecho: 'casi_plano',
    defaultLargo: 10.0,
    defaultAncho: 7.0,
    defaultAlto: 3.2,
    defaultPendiente: 4.0,
    direccionCaida: 'fondo',
    renderGraphic: () => (
      <svg viewBox="0 0 160 100" className="w-full h-24 stroke-current">
        <polygon points="25,60 115,65 135,35 45,30" fill="#3b82f6" fillOpacity="0.15" stroke="#2563eb" strokeWidth="2" />
        <line x1="20" y1="58" x2="20" y2="75" stroke="#64748b" strokeWidth="3" />
        <line x1="120" y1="63" x2="120" y2="80" stroke="#64748b" strokeWidth="3" />
        <text x="80" y="50" fontSize="9" fill="#0284c7" fontWeight="bold" textAnchor="middle">Pendiente 4%</text>
      </svg>
    )
  },
  {
    id: 'parabolico',
    title: 'Arco Parabólico',
    subtitle: 'Coliseos, losas deportivas y hangares',
    description: 'Estructura curva autoportante con flecha de arco paramétrica.',
    badge: 'Gran Luz',
    tipoTecho: 'parabolico',
    defaultLargo: 20.0,
    defaultAncho: 14.0,
    defaultAlto: 5.0,
    defaultPendiente: 15.0,
    direccionCaida: 'personalizada',
    renderGraphic: () => (
      <svg viewBox="0 0 160 100" className="w-full h-24 stroke-current">
        <path d="M 25,65 Q 80,15 135,65" fill="none" stroke="#2563eb" strokeWidth="3" />
        <path d="M 25,65 L 135,65" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
        <line x1="25" y1="65" x2="25" y2="85" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="135" y1="65" x2="135" y2="85" stroke="#1e293b" strokeWidth="2.5" />
        <text x="80" y="55" fontSize="8" fill="#2563eb" fontWeight="bold" textAnchor="middle">Flecha 1.50m</text>
      </svg>
    )
  },
  {
    id: 'varias_aguas',
    title: 'Multi-Sector / Varias Aguas',
    subtitle: 'Proyectos arquitectónicos complejos',
    description: 'Múltiples faldones interconectados con limahoyas y cumbreras.',
    tipoTecho: 'personalizado',
    defaultLargo: 18.0,
    defaultAncho: 12.0,
    defaultAlto: 4.2,
    defaultPendiente: 12.0,
    direccionCaida: 'personalizada',
    renderGraphic: () => (
      <svg viewBox="0 0 160 100" className="w-full h-24 stroke-current">
        <polygon points="30,70 80,70 110,40 60,40" fill="#3b82f6" fillOpacity="0.25" stroke="#2563eb" strokeWidth="1.5" />
        <polygon points="80,70 130,70 160,40 110,40" fill="#60a5fa" fillOpacity="0.3" stroke="#2563eb" strokeWidth="1.5" />
        <line x1="80" y1="70" x2="110" y2="40" stroke="#ef4444" strokeWidth="2" />
        <text x="95" y="58" fontSize="8" fill="#ef4444" fontWeight="bold">Limahoya</text>
      </svg>
    )
  },
  {
    id: 'dibujar_cero',
    title: 'Dibujar desde Cero',
    subtitle: 'Lienzo CAD en blanco para diseño libre',
    description: 'Dibuja el polígono punto a punto sobre la cuadrícula con snapping.',
    badge: 'CAD Libre',
    tipoTecho: 'poligono_libre',
    defaultLargo: 12.0,
    defaultAncho: 8.0,
    defaultAlto: 3.5,
    defaultPendiente: 10.0,
    direccionCaida: 'calle',
    renderGraphic: () => (
      <svg viewBox="0 0 160 100" className="w-full h-24 stroke-current">
        <rect x="25" y="20" width="110" height="60" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
        <path d="M 40,65 L 80,30 L 120,50" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="3,3" />
        <circle cx="40" cy="65" r="4" fill="#2563eb" />
        <circle cx="80" cy="30" r="4" fill="#2563eb" />
        <circle cx="120" cy="50" r="4" fill="#ef4444" />
        <text x="80" y="85" fontSize="9" fill="#64748b" fontWeight="bold" textAnchor="middle">Haga clic en el CAD</text>
      </svg>
    )
  }
];

export const RoofCreationModal: React.FC<RoofCreationModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onCustomDimensions,
  onStartBlank
}) => {
  const [activeTab, setActiveTab] = React.useState<'templates' | 'survey'>('templates');

  // Custom Survey Dimension Form State
  const [survey, setSurvey] = React.useState({
    frente: 12.0,
    fondoDer: 8.0,
    posterior: 12.0,
    fondoIzq: 8.0,
    hAlto: 3.8,
    hBajo: 3.0,
    caida: 'calle' as DireccionCaida,
    tipoTecho: 'una_caida' as TipoTecho
  });

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Nuevo Proyecto de Techo Metálico
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              ¿Qué tipo de techo deseas diseñar?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Plantillas Rápidas (8 Opciones)</span>
          </button>

          <button
            onClick={() => setActiveTab('survey')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'survey'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Ingresar Medidas del Terreno</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'templates' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ROOF_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    if (tmpl.id === 'dibujar_cero') {
                      onStartBlank();
                    } else {
                      onSelectTemplate(tmpl);
                    }
                    onClose();
                  }}
                  className="group relative bg-white rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all p-3.5 flex flex-col justify-between cursor-pointer text-left"
                >
                  {tmpl.badge && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase">
                      {tmpl.badge}
                    </span>
                  )}

                  {/* SVG Thumbnail */}
                  <div className="bg-slate-50 group-hover:bg-blue-50/50 rounded-lg p-2 transition-colors flex items-center justify-center mb-3">
                    {tmpl.renderGraphic()}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {tmpl.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 font-medium">
                      {tmpl.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{tmpl.defaultLargo}m × {tmpl.defaultAncho}m</span>
                    <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      Seleccionar →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Levantamiento / Dimension Entry Form */
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start space-x-3">
                <Compass className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-blue-900">Modo Levantamiento de Campo</h4>
                  <p className="mt-0.5 text-blue-700">
                    Ingresa las 4 medidas reales del perímetro y las alturas de soporte. El generador creará el polígono exacto y la estructura paramétrica adecuada.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Frente / Fachada (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={survey.frente === 0 ? '' : survey.frente}
                    onChange={(e) => setSurvey({ ...survey, frente: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fondo Derecho (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={survey.fondoDer === 0 ? '' : survey.fondoDer}
                    onChange={(e) => setSurvey({ ...survey, fondoDer: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Posterior / Atrás (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={survey.posterior === 0 ? '' : survey.posterior}
                    onChange={(e) => setSurvey({ ...survey, posterior: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fondo Izquierdo (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={survey.fondoIzq === 0 ? '' : survey.fondoIzq}
                    onChange={(e) => setSurvey({ ...survey, fondoIzq: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Altura Lado Alto (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={survey.hAlto === 0 ? '' : survey.hAlto}
                    onChange={(e) => setSurvey({ ...survey, hAlto: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Altura Lado Bajo (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={survey.hBajo === 0 ? '' : survey.hBajo}
                    onChange={(e) => setSurvey({ ...survey, hBajo: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Dirección de Caída
                  </label>
                  <select
                    value={survey.caida}
                    onChange={(e) => setSurvey({ ...survey, caida: e.target.value as DireccionCaida })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  >
                    <option value="calle">Hacia la Calle (Frontal ↓)</option>
                    <option value="interior">Hacia el Fondo / Interior (↑)</option>
                    <option value="izquierda">Hacia la Izquierda (←)</option>
                    <option value="derecha">Hacia la Derecha (→)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Volver a Plantillas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCustomDimensions(survey);
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crear Techo con Estas Medidas</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Las plantillas solo definen la geometría inicial. Todo es editable en el CAD.
          </span>
          <button
            onClick={() => {
              onStartBlank();
              onClose();
            }}
            className="font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
          >
            <PenTool className="w-3.5 h-3.5" />
            Comenzar con lienzo en blanco
          </button>
        </div>

      </div>
    </div>
  );
};
