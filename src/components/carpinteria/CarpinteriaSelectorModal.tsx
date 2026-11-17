// Pantalla Inicial: "¿QUÉ QUIERES DISEÑAR?" para Puertas, Ventanas, Rejas y Portones
import React from 'react';
import { 
  DoorClosed, 
  Square, 
  Grid, 
  PenTool, 
  ShieldAlert, 
  Minimize2, 
  Columns, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { TipoElementoCarpinteria, PuertaVentanaDesign } from './carpinteriaTypes';
import { DEFAULT_DESIGNS } from './carpinteriaCatalog';

interface CarpinteriaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (design: PuertaVentanaDesign) => void;
  onStartFreeDraw: () => void;
}

interface OptionCard {
  tipo: TipoElementoCarpinteria;
  titulo: string;
  subtitulo: string;
  icono: any;
  dimensionDefault: string;
  badge: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
}

const OPCIONES_ELEMENTOS: OptionCard[] = [
  {
    tipo: 'reja',
    titulo: 'REJA',
    subtitulo: 'Barras de seguridad, cuadrículas, puntas de lanza y cálculo automático de separación',
    icono: Grid,
    dimensionDefault: '2.00m x 1.50m',
    badge: 'Cálculo Paramétrico',
    colorBorder: 'border-blue-200 hover:border-blue-500',
    colorBg: 'bg-blue-50/50 hover:bg-blue-50',
    colorText: 'text-blue-600'
  },
  {
    tipo: 'puerta',
    titulo: 'PUERTA',
    subtitulo: 'Peatonal de 1 o 2 hojas, plancha LAC, mixta con reja/vidrio, cerraduras Forte y bisagras',
    icono: DoorClosed,
    dimensionDefault: '1.00m x 2.20m',
    badge: '1 o 2 Hojas',
    colorBorder: 'border-indigo-200 hover:border-indigo-500',
    colorBg: 'bg-indigo-50/50 hover:bg-indigo-50',
    colorText: 'text-indigo-600'
  },
  {
    tipo: 'porton',
    titulo: 'PORTÓN',
    subtitulo: 'Vehicular corredizo o abatible, ruedas en V, rieles, puerta peatonal integrada y automatización',
    icono: Columns,
    dimensionDefault: '3.50m x 2.40m',
    badge: 'Corredizo / Abatible',
    colorBorder: 'border-emerald-200 hover:border-emerald-500',
    colorBg: 'bg-emerald-50/50 hover:bg-emerald-50',
    colorText: 'text-emerald-600'
  },
  {
    tipo: 'ventana',
    titulo: 'VENTANA',
    subtitulo: 'Corrediza, fija, abatible o proyectante. Sistemas en aluminio (Serie 20/25) o tubos de acero',
    icono: Square,
    dimensionDefault: '1.50m x 1.20m',
    badge: 'Aluminio / Acero',
    colorBorder: 'border-sky-200 hover:border-sky-500',
    colorBg: 'bg-sky-50/50 hover:bg-sky-50',
    colorText: 'text-sky-600'
  },
  {
    tipo: 'cerco',
    titulo: 'CERCO',
    subtitulo: 'Cerco perimétrico modular con postes tubulares y malla electrosoldada o barrotes',
    icono: ShieldAlert,
    dimensionDefault: '3.00m x 2.00m',
    badge: 'Mallas y Postes',
    colorBorder: 'border-amber-200 hover:border-amber-500',
    colorBg: 'bg-amber-50/50 hover:bg-amber-50',
    colorText: 'text-amber-600'
  },
  {
    tipo: 'baranda',
    titulo: 'BARANDA',
    subtitulo: 'Pasamanos ergonómico para escaleras o balcones con tubos redondos o líneas modernas',
    icono: Minimize2,
    dimensionDefault: '2.50m x 1.00m',
    badge: 'Escaleras y Balcones',
    colorBorder: 'border-violet-200 hover:border-violet-500',
    colorBg: 'bg-violet-50/50 hover:bg-violet-50',
    colorText: 'text-violet-600'
  },
  {
    tipo: 'cerramiento',
    titulo: 'CERRAMIENTO',
    subtitulo: 'Estructuras modulares con policarbonato, celosías o paneles para terrazas y azoteas',
    icono: Columns,
    dimensionDefault: '3.00m x 2.20m',
    badge: 'Terrazas y Techos',
    colorBorder: 'border-teal-200 hover:border-teal-500',
    colorBg: 'bg-teal-50/50 hover:bg-teal-50',
    colorText: 'text-teal-600'
  },
  {
    tipo: 'mampara',
    titulo: 'MAMPARA',
    subtitulo: 'Mamparas corredizas de piso a techo con vidrio templado de 8mm o 10mm y perfil Serie 3825',
    icono: Square,
    dimensionDefault: '2.40m x 2.30m',
    badge: 'Vidrio Templado',
    colorBorder: 'border-cyan-200 hover:border-cyan-500',
    colorBg: 'bg-cyan-50/50 hover:bg-cyan-50',
    colorText: 'text-cyan-600'
  },
  {
    tipo: 'otro',
    titulo: 'OTRO',
    subtitulo: 'Estructuras especiales a medida con perfiles personalizados y divisiones libres',
    icono: Sparkles,
    dimensionDefault: 'Personalizable',
    badge: 'Geometría Libre',
    colorBorder: 'border-slate-200 hover:border-slate-500',
    colorBg: 'bg-slate-50/50 hover:bg-slate-50',
    colorText: 'text-slate-600'
  }
];

export const CarpinteriaSelectorModal: React.FC<CarpinteriaSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  onStartFreeDraw
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 text-white px-8 py-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase block font-bold">
              Gestor de Fabricación — Módulo de Carpintería
            </span>
            <h2 className="text-2xl font-black text-white mt-1">
              ¿QUÉ QUIERES DISEÑAR?
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Selecciona el tipo de elemento para cargar perfiles recomendados o inicia un dibujo desde cero.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onStartFreeDraw}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all shadow-md hover:shadow-indigo-500/25 cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              <span>DIBUJAR DISEÑO LIBRE</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuadrícula de Opciones */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {OPCIONES_ELEMENTOS.map(op => {
              const Icon = op.icono;
              return (
                <div
                  key={op.tipo}
                  onClick={() => onSelectPreset(DEFAULT_DESIGNS[op.tipo])}
                  className={`bg-white rounded-2xl p-5 border-2 ${op.colorBorder} transition-all duration-200 hover:shadow-lg cursor-pointer flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 rounded-2xl ${op.colorBg} ${op.colorText} flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                        {op.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-wide">
                      [ {op.titulo} ]
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                      {op.subtitulo}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400 text-[11px]">
                      Base: {op.dimensionDefault}
                    </span>
                    <span className="font-bold text-indigo-600 flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Diseñar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie de Modal con Botón de Dibujo Libre */}
        <div className="bg-white border-t border-slate-200 px-8 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="text-slate-500 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Cada elemento cuenta con despiece exacto, optimización de cortes y cómputo de materiales.</span>
          </div>

          <button
            onClick={onStartFreeDraw}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <PenTool className="w-4 h-4 text-indigo-400" />
            <span>Crear desde Lienzo en Blanco</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarpinteriaSelectorModal;
