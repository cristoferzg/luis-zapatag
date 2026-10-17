import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Sparkles, 
  Ruler, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { TipoTecho, PatronTijeral, TipoTijeral } from './structuralTypes';

export interface BasicTrussRoofConfig {
  tipoTecho: TipoTecho;
  tipoTijeral: TipoTijeral;
  patronTijeral: PatronTijeral;
  largo: number;
  ancho: number;
  alturaColumna: number;
  peralteTijeral: number;
  pendientePct: number;
  separacionTijerales: number;
  perfilCuerda: string;
  perfilWeb: string;
  generarColumnas: boolean;
  generarCorreas: boolean;
  generarCobertura: boolean;
  tipoCobertura: string;
}

interface BasicTrussRoofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: BasicTrussRoofConfig) => void;
  currentLargo?: number;
  currentAncho?: number;
  initialDimensions?: {
    largo?: number;
    ancho?: number;
    altura?: number;
    tipoTecho?: TipoTecho;
  };
}

export const BasicTrussRoofModal: React.FC<BasicTrussRoofModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  currentLargo = 9.0,
  currentAncho = 7.0,
  initialDimensions
}) => {
  if (!isOpen) return null;

  const initL = initialDimensions?.largo || currentLargo || 9.0;
  const initA = initialDimensions?.ancho || currentAncho || 7.0;
  const initAlt = initialDimensions?.altura || 3.50;
  const initTipo = initialDimensions?.tipoTecho || 'dos_aguas';

  // Selected Roof Archetype
  const [tipoTecho, setTipoTecho] = useState<TipoTecho>(initTipo);
  const [tipoTijeral, setTipoTijeral] = useState<TipoTijeral>(initTipo === 'dos_aguas' ? 'dos_aguas' : 'una_agua');
  const [patronTijeral, setPatronTijeral] = useState<PatronTijeral>('warren');

  // Dimensions
  const [largo, setLargo] = useState<number>(initL);
  const [ancho, setAncho] = useState<number>(initA);
  const [alturaColumna, setAlturaColumna] = useState<number>(initAlt);
  const [peralteTijeral, setPeralteTijeral] = useState<number>(0.80);
  const [pendientePct, setPendientePct] = useState<number>(12.0);
  const [separacionTijerales, setSeparacionTijerales] = useState<number>(4.50);

  // Profiles
  const [perfilCuerda, setPerfilCuerda] = useState<string>('tub-cuad-75x75x3');
  const [perfilWeb, setPerfilWeb] = useState<string>('tub-cuad-50x50x2');

  // Auto Components
  const [generarColumnas, setGenerarColumnas] = useState<boolean>(true);
  const [generarCorreas, setGenerarCorreas] = useState<boolean>(true);
  const [generarCobertura, setGenerarCobertura] = useState<boolean>(true);
  const [tipoCobertura, setTipoCobertura] = useState<string>('Aluzinc TR4');

  // Calculated estimates
  const numTijerales = Math.max(2, Math.round(largo / separacionTijerales) + 1);
  const areaTecho = largo * ancho;

  // Handle preset archetype changes
  const handleSelectArchetype = (type: TipoTecho) => {
    setTipoTecho(type);
    if (type === 'dos_aguas') {
      setTipoTijeral('dos_aguas');
      setPendientePct(12.0);
      setPeralteTijeral(0.80);
    } else if (type === 'una_caida' || type === 'un_agua') {
      setTipoTijeral('una_agua');
      setPendientePct(10.0);
      setPeralteTijeral(0.70);
    } else if (type === 'parabolico' || type === 'arco') {
      setTipoTijeral('parabolico');
      setPendientePct(5.0);
      setPeralteTijeral(1.20);
    } else if (type === 'plano') {
      setTipoTijeral('plano');
      setPendientePct(2.0);
      setPeralteTijeral(0.60);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      tipoTecho,
      tipoTijeral,
      patronTijeral,
      largo: Math.max(2.0, largo),
      ancho: Math.max(2.0, ancho),
      alturaColumna: Math.max(1.5, alturaColumna),
      peralteTijeral: Math.max(0.3, peralteTijeral),
      pendientePct: Math.max(1.0, pendientePct),
      separacionTijerales: Math.max(1.5, separacionTijerales),
      perfilCuerda,
      perfilWeb,
      generarColumnas,
      generarCorreas,
      generarCobertura,
      tipoCobertura
    });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-xl shadow-inner">
              🏗️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black tracking-tight">Techo Básico con Tijeral</h2>
                <span className="px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold rounded-full uppercase">
                  Generador Sencillo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Configura en 1 clic un techo completo con cerchas reticuladas, columnas y correas.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-slate-800">
          
          {/* 1. SELECCIÓN DE ARQUETIPO DE TIJERAL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Tipo de Techo y Cercha (Tijeral)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'dos_aguas',
                  name: 'Dos Aguas',
                  sub: 'Cumbrera central',
                  icon: '⛺',
                  badge: 'Más Común'
                },
                {
                  id: 'una_caida',
                  name: 'Una Caída',
                  sub: 'Monopendiente',
                  icon: '📐',
                  badge: 'Adosados'
                },
                {
                  id: 'parabolico',
                  name: 'Parabólico',
                  sub: 'Arco reticulado',
                  icon: '🏟️',
                  badge: 'Coliseo/Nave'
                },
                {
                  id: 'plano',
                  name: 'Plano / Recto',
                  sub: 'Cercha horizontal',
                  icon: '📏',
                  badge: 'Comercial'
                }
              ].map(opt => {
                const isSelected = tipoTecho === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectArchetype(opt.id as TipoTecho)}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{opt.icon}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="block text-xs font-black text-slate-900">{opt.name}</span>
                      <span className="block text-[10px] text-slate-500 font-medium">{opt.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. MEDIDAS PRINCIPALES DEL TECHO */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-indigo-600" />
                2. Dimensiones Generales
              </label>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                Área: {areaTecho.toFixed(1)} m²
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* LARGO */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Largo Total (L)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    min="2"
                    max="60"
                    value={largo}
                    onChange={(e) => setLargo(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-right font-black text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  />
                  <span className="ml-1.5 text-xs font-bold text-slate-500">m</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {[6, 9, 12, 15, 18].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLargo(val)}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                        largo === val ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>

              {/* ANCHO / LUZ DEL TIJERAL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ancho / Luz Tijeral (A)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.5"
                    min="2"
                    max="40"
                    value={ancho}
                    onChange={(e) => setAncho(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-right font-black text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  />
                  <span className="ml-1.5 text-xs font-bold text-slate-500">m</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {[5, 6, 7, 8, 10].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAncho(val)}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                        ancho === val ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>

              {/* ALTURA DE COLUMNAS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Altura Columnas (H)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="1.5"
                    max="15"
                    value={alturaColumna}
                    onChange={(e) => setAlturaColumna(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-right font-black text-sm text-slate-900 focus:border-indigo-600 outline-none"
                  />
                  <span className="ml-1.5 text-xs font-bold text-slate-500">m</span>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {[3.0, 3.5, 4.0, 4.5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAlturaColumna(val)}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                        alturaColumna === val ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {val}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-parámetros: Peralte y Pendiente */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Peralte del Tijeral
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type="number"
                    step="0.05"
                    min="0.3"
                    max="3.0"
                    value={peralteTijeral}
                    onChange={(e) => setPeralteTijeral(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-right"
                  />
                  <span className="ml-1 text-[11px] font-bold text-slate-500">m</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Pendiente de Caída
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="40"
                    value={pendientePct}
                    onChange={(e) => setPendientePct(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-right"
                  />
                  <span className="ml-1 text-[11px] font-bold text-slate-500">%</span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                  Separación Tijerales
                </label>
                <div className="flex items-center mt-1">
                  <input
                    type="number"
                    step="0.25"
                    min="2.0"
                    max="10.0"
                    value={separacionTijerales}
                    onChange={(e) => setSeparacionTijerales(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-right"
                  />
                  <span className="ml-1 text-[11px] font-bold text-slate-500">m</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PATRÓN DE CELOSÍA Y PERFILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Patrón de Celosía */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Patrón de Celosía
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'warren', name: 'Warren', desc: 'En V alternada' },
                  { id: 'pratt', name: 'Pratt', desc: 'Montante vertical' },
                  { id: 'howe', name: 'Howe', desc: 'Compresión diagonal' },
                  { id: 'fink', name: 'Fink', desc: 'Doble sub-tijeral' },
                  { id: 'king_post', name: 'King Post', desc: 'Montante central' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPatronTijeral(p.id as PatronTijeral)}
                    className={`p-2 rounded-xl text-center border text-[10px] font-bold transition-all cursor-pointer ${
                      patronTijeral === p.id 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs scale-[1.02]' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>{p.name}</div>
                    <div className={`text-[8px] font-normal leading-tight mt-0.5 ${patronTijeral === p.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {p.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Perfil de Cuerdas */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Perfil Estructural
              </label>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Cuerdas Superior e Inferior
                </label>
                <select
                  value={perfilCuerda}
                  onChange={(e) => setPerfilCuerda(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="tub-cuad-75x75x3">Tubo Cuadrado 75×75×3.0 mm (6.8 kg/m)</option>
                  <option value="tub-cuad-100x100x3">Tubo Cuadrado 100×100×3.0 mm (8.9 kg/m)</option>
                  <option value="tub-cuad-50x50x2">Tubo Cuadrado 50×50×2.0 mm (3.0 kg/m)</option>
                  <option value="tub-rec-80x40x2.5">Tubo Rectangular 80×40×2.5 mm (4.4 kg/m)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Montantes y Diagonales
                </label>
                <select
                  value={perfilWeb}
                  onChange={(e) => setPerfilWeb(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="tub-cuad-50x50x2">Tubo Cuadrado 50×50×2.0 mm (3.0 kg/m)</option>
                  <option value="tub-cuad-40x40x2">Tubo Cuadrado 40×40×2.0 mm (2.4 kg/m)</option>
                  <option value="ang-1.5x1.5x3/16">Ángulo Estructural 1½"×1½"×3/16" (2.7 kg/m)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. COMPONENTES ADICIONALES (CHECKBOXES) */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
            <span className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
              5. Componentes Automáticos Incluidos
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-white/60">
                <input
                  type="checkbox"
                  checked={generarColumnas}
                  onChange={(e) => setGenerarColumnas(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span>Columnas con Placas</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-white/60">
                <input
                  type="checkbox"
                  checked={generarCorreas}
                  onChange={(e) => setGenerarCorreas(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span>Correas Costaneras C</span>
              </label>

              <div className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-white/60">
                <input
                  type="checkbox"
                  id="chk-cobertura"
                  checked={generarCobertura}
                  onChange={(e) => setGenerarCobertura(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <label htmlFor="chk-cobertura" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Cobertura:
                </label>
                <select
                  value={tipoCobertura}
                  onChange={(e) => setTipoCobertura(e.target.value)}
                  className="text-[11px] font-bold bg-white border border-indigo-200 rounded-md px-1.5 py-0.5 text-indigo-900"
                >
                  <option value="Aluzinc TR4">Aluzinc TR4</option>
                  <option value="Panel Termoacústico">Panel Termoacústico</option>
                  <option value="Policarbonato">Policarbonato</option>
                </select>
              </div>
            </div>
          </div>

          {/* RESUMEN PREVIO */}
          <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl text-xs">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Se generarán: <strong>{numTijerales} tijerales</strong> espaciados a {separacionTijerales}m</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              {generarColumnas ? `${numTijerales * 2} columnas` : 'Sin columnas'}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generar Techo con Tijerales</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
