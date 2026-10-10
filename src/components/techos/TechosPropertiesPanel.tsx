// Panel de Propiedades Exclusivo para Techos Metálicos y Coberturas Industriales
import React, { useState } from 'react';
import { 
  Building2, 
  Ruler, 
  Layers, 
  ShieldCheck, 
  Compass, 
  DollarSign
} from 'lucide-react';
import { TechoEstructuraDesign, TipoTecho, TipoTijeral, TipoCobertura, ColorCobertura } from './techosTypes';

interface TechosPropertiesPanelProps {
  design: TechoEstructuraDesign;
  onUpdateDesign: (updated: TechoEstructuraDesign) => void;
  isOpenMobile?: boolean;
  onToggleMobile?: () => void;
}

export const TechosPropertiesPanel: React.FC<TechosPropertiesPanelProps> = ({
  design,
  onUpdateDesign,
  isOpenMobile,
  onToggleMobile
}) => {
  const [activeSection, setActiveSection] = useState<'dimensiones' | 'tijerales' | 'correas' | 'cobertura' | 'costos'>('dimensiones');

  // Soporte de gesto táctil Swipe-Down en móviles para deslizar hacia abajo y cerrar
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const touchStartYRef = React.useRef(0);
  const currentDragYRef = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    currentDragYRef.current = 0;
    setIsDraggingSheet(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    if (deltaY > 0) {
      currentDragYRef.current = deltaY;
      setDragOffsetY(deltaY);
    } else {
      currentDragYRef.current = 0;
      setDragOffsetY(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDraggingSheet(false);
    if (currentDragYRef.current > 70 && onToggleMobile) {
      setDragOffsetY(0);
      onToggleMobile();
    } else {
      setDragOffsetY(0);
    }
  };

  // Actualizadores helper
  const updateField = (field: keyof TechoEstructuraDesign, value: any) => {
    onUpdateDesign({
      ...design,
      [field]: value
    });
  };

  // Recalcular número de tijerales al cambiar distancia o largo
  const handleLargoChange = (largo: number) => {
    const numTij = Math.ceil(largo / (design.distanciaTijeralesM || 5)) + 1;
    onUpdateDesign({
      ...design,
      largoM: largo,
      numTijerales: numTij
    });
  };

  const handleDistanciaTijeralesChange = (dist: number) => {
    const numTij = Math.ceil((design.largoM || 20) / dist) + 1;
    onUpdateDesign({
      ...design,
      distanciaTijeralesM: dist,
      numTijerales: numTij
    });
  };

  return (
    <>
      {/* Backdrop oscuro translúcido en móvil */}
      {isOpenMobile && (
        <div 
          onClick={onToggleMobile}
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 animate-in fade-in duration-200"
        />
      )}

      <aside 
        style={{
          transform: isOpenMobile
            ? (isDraggingSheet && dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : 'translateY(0)')
            : undefined,
          transition: isDraggingSheet ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className={`
          w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 text-slate-200 select-none shadow-2xl
          ${isOpenMobile 
            ? 'fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-3xl border-t-2 border-slate-700' 
            : 'hidden lg:flex h-full z-20'
          }
        `}
      >
        {/* CABECERA DE PANEL DE PROPIEDADES (Drag handle en móvil) */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="p-3.5 bg-slate-950 border-b border-slate-800 flex flex-col items-center justify-between rounded-t-3xl lg:rounded-none cursor-grab active:cursor-grabbing select-none touch-none"
        >
          {/* Píldora de arrastre visual en móvil */}
          <div className="lg:hidden w-12 h-1.5 bg-slate-700 rounded-full mb-2.5" />

          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-extrabold tracking-wide text-white">INSPECTOR DE TECHO CAD</h2>
            </div>
            {onToggleMobile && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 hidden sm:inline lg:hidden">Desliza abajo para cerrar</span>
                <button 
                  onClick={onToggleMobile} 
                  className="lg:hidden p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar Inspector"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

      {/* NAVEGACIÓN PESTAÑAS SECCIONALES */}
      <div className="grid grid-cols-5 bg-slate-950 p-1 border-b border-slate-800 text-[10px] font-bold">
        <button
          onClick={() => setActiveSection('dimensiones')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeSection === 'dimensiones' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveSection('tijerales')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeSection === 'tijerales' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Tijerales</span>
        </button>

        <button
          onClick={() => setActiveSection('correas')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeSection === 'correas' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Correas</span>
        </button>

        <button
          onClick={() => setActiveSection('cobertura')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeSection === 'cobertura' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cobertura</span>
        </button>

        <button
          onClick={() => setActiveSection('costos')}
          className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
            activeSection === 'costos' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Costos</span>
        </button>
      </div>

      {/* CONTENIDO DE PROPIEDADES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">

        {/* 1. SECCIÓN: DIMENSIONES GENERALES */}
        {activeSection === 'dimensiones' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                Geometría y Tipo de Estructura
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tipo de Techo</label>
                <select
                  value={design.tipoTecho}
                  onChange={e => updateField('tipoTecho', e.target.value as TipoTecho)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:border-amber-500 focus:outline-none"
                >
                  <option value="techo_dos_aguas">🏠 Techo a Dos Aguas (Nave Industrial)</option>
                  <option value="techo_una_agua">📐 Techo Inclinado a Una Agua</option>
                  <option value="techo_parabolico">🌀 Techo Parabólico Curvo</option>
                  <option value="techo_mezzanine">🏢 Mezzanine / Entrepiso Metálico</option>
                  <option value="techo_forma_l">📐 Estructura en Forma de L</option>
                  <option value="techo_forma_u">🔲 Estructura en Forma de U</option>
                  <option value="techo_forma_c">🏛️ Estructura en Forma de C</option>
                  <option value="techo_policarbonato">☀️ Techo Residencial Policarbonato</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Luz Libre L (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={design.luzM}
                    onChange={e => updateField('luzM', parseFloat(e.target.value) || 12)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Largo Total Nave (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={design.largoM}
                    onChange={e => handleLargoChange(parseFloat(e.target.value) || 20)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Altura Columnas H (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={design.alturaColumnasM}
                    onChange={e => updateField('alturaColumnasM', parseFloat(e.target.value) || 4)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pendiente (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={design.pendientePorcentaje}
                    onChange={e => updateField('pendientePorcentaje', parseFloat(e.target.value) || 20)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              {design.tipoTecho === 'techo_parabolico' && (
                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 mb-1">Flecha del Arco f (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={design.flechaArcoM || 2.5}
                    onChange={e => updateField('flechaArcoM', parseFloat(e.target.value) || 2.5)}
                    className="w-full bg-slate-800 border border-amber-500/50 rounded-lg p-2 text-amber-300 font-mono font-bold"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Aleros y Volados</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Volado Frontal (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={design.voladoFrontalM}
                    onChange={e => updateField('voladoFrontalM', parseFloat(e.target.value) || 0.8)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Volado Lateral (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={design.voladoLateralM}
                    onChange={e => updateField('voladoLateralM', parseFloat(e.target.value) || 0.5)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SECCIÓN: TIJERALES Y COLUMNAS */}
        {activeSection === 'tijerales' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Configuración de Tijerales / Cerchas
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tipo de Cercha</label>
                <select
                  value={design.tipoTijeral}
                  onChange={e => updateField('tipoTijeral', e.target.value as TipoTijeral)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold cursor-pointer"
                >
                  <option value="escalera_vierendeel">Tijeral Tipo Escalera / Vierendeel (Montantes a 90°)</option>
                  <option value="howe">Tijeral Howe (Diagonales en compresión)</option>
                  <option value="pratt">Tijeral Pratt (Diagonales en tracción)</option>
                  <option value="fink">Tijeral Fink (Pendientes altas)</option>
                  <option value="warren">Tijeral Warren (Triangulación directa)</option>
                  <option value="parabolico_curvo">Arco Reticulado Curvo</option>
                  <option value="viga_celosia">Viga Celosía Plana</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Distribución / Orientación de Tijerales</label>
                <select
                  value={design.orientacionTijeral || 'transversal'}
                  onChange={e => updateField('orientacionTijeral', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold cursor-pointer text-xs"
                >
                  <option value="transversal">📐 Transversal (Estándar / Pórticos de Carga)</option>
                  <option value="longitudinal">📏 Longitudinal (Vigas de Amarre / Diagonales)</option>
                  <option value="perimetral">🧱 Perimetral (Anillo Perimetral / Tímpanos)</option>
                  <option value="completo">🕸️ Completo (Malla / Reticulado Bidireccional)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Espaciado Tijerales (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={design.distanciaTijeralesM}
                    onChange={e => handleDistanciaTijeralesChange(parseFloat(e.target.value) || 5)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">N° Tijerales Totales</label>
                  <div className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold text-center">
                    {design.numTijerales} unids.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Perfil Cordón Superior</label>
                <select
                  value={design.perfilCordonSuperior}
                  onChange={e => updateField('perfilCordonSuperior', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white"
                >
                  <optgroup label="Perfiles C">
                    <option value='Perfil C 3" x 1 1/2" x 1.5mm'>Perfil C 3" x 1 1/2" x 1.5mm</option>
                    <option value='Perfil C 4" x 2" x 2.0mm'>Perfil C 4" x 2" x 2.0mm</option>
                    <option value='Perfil C 4" x 2" x 2.5mm'>Perfil C 4" x 2" x 2.5mm</option>
                    <option value='Perfil C 5" x 2" x 2.0mm'>Perfil C 5" x 2" x 2.0mm</option>
                    <option value='Perfil C 6" x 2" x 2.0mm'>Perfil C 6" x 2" x 2.0mm</option>
                    <option value='Perfil C 6" x 2" x 3.0mm'>Perfil C 6" x 2" x 3.0mm</option>
                    <option value='Perfil C 8" x 2" x 2.5mm'>Perfil C 8" x 2" x 2.5mm</option>
                  </optgroup>
                  <optgroup label="Tubos Cuadrados">
                    <option value='Tubo Cuadrado 1 1/2" x 1 1/2" x 2.0mm'>Tubo Cuadrado 1 1/2" x 1 1/2" x 2.0mm</option>
                    <option value='Tubo Cuadrado 2" x 2" x 2.0mm'>Tubo Cuadrado 2" x 2" x 2.0mm</option>
                    <option value='Tubo Cuadrado 2" x 2" x 2.5mm'>Tubo Cuadrado 2" x 2" x 2.5mm</option>
                    <option value='Tubo Cuadrado 2 1/2" x 2 1/2" x 2.0mm'>Tubo Cuadrado 2 1/2" x 2 1/2" x 2.0mm</option>
                    <option value='Tubo Cuadrado 3" x 3" x 2.0mm'>Tubo Cuadrado 3" x 3" x 2.0mm</option>
                    <option value='Tubo Cuadrado 3" x 3" x 2.5mm'>Tubo Cuadrado 3" x 3" x 2.5mm</option>
                    <option value='Tubo Cuadrado 4" x 4" x 2.5mm'>Tubo Cuadrado 4" x 4" x 2.5mm</option>
                  </optgroup>
                  <optgroup label="Tubos Rectangulares">
                    <option value='Tubo Rectangular 2" x 1" x 1.5mm'>Tubo Rectangular 2" x 1" x 1.5mm</option>
                    <option value='Tubo Rectangular 2" x 1" x 2.0mm'>Tubo Rectangular 2" x 1" x 2.0mm</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.2mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.2mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.5mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.5mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.8mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.8mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.0mm (60x40mm)'>Tubo Rectangular 60 x 40 x 2.0mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.5mm (60x40mm)'>Tubo Rectangular 60 x 40 x 2.5mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 3.0mm (60x40mm)'>Tubo Rectangular 60 x 40 x 3.0mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.0mm Galvanizado'>Tubo Rectangular 60 x 40 x 2.0mm Galvanizado</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.5mm Galvanizado'>Tubo Rectangular 60 x 40 x 2.5mm Galvanizado</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.2mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.2mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.5mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.5mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.8mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.8mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.0mm (60x30mm)'>Tubo Rectangular 60 x 30 x 2.0mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.5mm (60x30mm)'>Tubo Rectangular 60 x 30 x 2.5mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 3.0mm (60x30mm)'>Tubo Rectangular 60 x 30 x 3.0mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.0mm Galvanizado'>Tubo Rectangular 60 x 30 x 2.0mm Galvanizado</option>
                    <option value='Tubo Rectangular 80 x 40 x 1.5mm (80x40mm)'>Tubo Rectangular 80 x 40 x 1.5mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 1.8mm (80x40mm)'>Tubo Rectangular 80 x 40 x 1.8mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 2.0mm (80x40mm)'>Tubo Rectangular 80 x 40 x 2.0mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 2.5mm (80x40mm)'>Tubo Rectangular 80 x 40 x 2.5mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 3.0mm (80x40mm)'>Tubo Rectangular 80 x 40 x 3.0mm (80x40mm)</option>
                    <option value='Tubo Rectangular 100 x 40 x 2.0mm (100x40mm)'>Tubo Rectangular 100 x 40 x 2.0mm (100x40mm)</option>
                    <option value='Tubo Rectangular 100 x 40 x 2.5mm (100x40mm)'>Tubo Rectangular 100 x 40 x 2.5mm (100x40mm)</option>
                    <option value='Tubo Rectangular 100 x 50 x 2.0mm (100x50mm)'>Tubo Rectangular 100 x 50 x 2.0mm (100x50mm)</option>
                    <option value='Tubo Rectangular 100 x 50 x 2.5mm (100x50mm)'>Tubo Rectangular 100 x 50 x 2.5mm (100x50mm)</option>
                    <option value='Tubo Rectangular 100 x 50 x 3.0mm (100x50mm)'>Tubo Rectangular 100 x 50 x 3.0mm (100x50mm)</option>
                    <option value='Tubo Rectangular 3" x 1.5" x 2.0mm'>Tubo Rectangular 3" x 1.5" x 2.0mm</option>
                    <option value='Tubo Rectangular 3" x 2" x 2.0mm'>Tubo Rectangular 3" x 2" x 2.0mm</option>
                    <option value='Tubo Rectangular 4" x 2" x 2.0mm'>Tubo Rectangular 4" x 2" x 2.0mm</option>
                    <option value='Tubo Rectangular 4" x 2" x 2.5mm'>Tubo Rectangular 4" x 2" x 2.5mm</option>
                    <option value='Tubo Rectangular 6" x 2" x 2.5mm'>Tubo Rectangular 6" x 2" x 2.5mm</option>
                  </optgroup>
                  <optgroup label="Tubos Redondos / Cilíndricos">
                    <option value='Tubo Redondo 1 1/2" x 2.0mm'>Tubo Redondo 1 1/2" x 2.0mm</option>
                    <option value='Tubo Redondo 2" x 2.0mm'>Tubo Redondo 2" x 2.0mm</option>
                    <option value='Tubo Redondo 2 1/2" x 2.0mm'>Tubo Redondo 2 1/2" x 2.0mm</option>
                    <option value='Tubo Redondo 3" x 2.5mm'>Tubo Redondo 3" x 2.5mm</option>
                    <option value='Tubo Redondo 4" x 3.0mm'>Tubo Redondo 4" x 3.0mm</option>
                  </optgroup>
                  <optgroup label="Ángulos y Vigas Estructurales">
                    <option value='Ángulo Estructural 2" x 2" x 3/16"'>Ángulo Estructural 2" x 2" x 3/16"</option>
                    <option value='Ángulo Estructural 2 1/2" x 2 1/2" x 1/4"'>Ángulo Estructural 2 1/2" x 2 1/2" x 1/4"</option>
                    <option value='Ángulo Estructural 3" x 3" x 1/4"'>Ángulo Estructural 3" x 3" x 1/4"</option>
                    <option value='Viga IPE 120 (120x64mm)'>Viga IPE 120 (120x64mm)</option>
                    <option value='Viga IPE 160 (160x82mm)'>Viga IPE 160 (160x82mm)</option>
                    <option value='Canal UPN 100 (100x50mm)'>Canal UPN 100 (100x50mm)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Perfil Cordón Inferior</label>
                <select
                  value={design.perfilCordonInferior}
                  onChange={e => updateField('perfilCordonInferior', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white"
                >
                  <optgroup label="Perfiles C">
                    <option value='Perfil C 3" x 1 1/2" x 1.5mm'>Perfil C 3" x 1 1/2" x 1.5mm</option>
                    <option value='Perfil C 4" x 2" x 2.0mm'>Perfil C 4" x 2" x 2.0mm</option>
                    <option value='Perfil C 6" x 2" x 2.0mm'>Perfil C 6" x 2" x 2.0mm</option>
                  </optgroup>
                  <optgroup label="Tubos Rectangulares y Cuadrados">
                    <option value='Tubo Rectangular 2" x 1" x 1.5mm'>Tubo Rectangular 2" x 1" x 1.5mm</option>
                    <option value='Tubo Rectangular 2" x 1" x 2.0mm'>Tubo Rectangular 2" x 1" x 2.0mm</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.2mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.2mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.5mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.5mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.8mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.8mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.0mm (60x40mm)'>Tubo Rectangular 60 x 40 x 2.0mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.5mm (60x40mm)'>Tubo Rectangular 60 x 40 x 2.5mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 3.0mm (60x40mm)'>Tubo Rectangular 60 x 40 x 3.0mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.2mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.2mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.5mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.5mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.8mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.8mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.0mm (60x30mm)'>Tubo Rectangular 60 x 30 x 2.0mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.5mm (60x30mm)'>Tubo Rectangular 60 x 30 x 2.5mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 3.0mm (60x30mm)'>Tubo Rectangular 60 x 30 x 3.0mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.0mm Galvanizado'>Tubo Rectangular 60 x 30 x 2.0mm Galvanizado</option>
                    <option value='Tubo Rectangular 80 x 40 x 1.5mm (80x40mm)'>Tubo Rectangular 80 x 40 x 1.5mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 1.8mm (80x40mm)'>Tubo Rectangular 80 x 40 x 1.8mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 2.0mm (80x40mm)'>Tubo Rectangular 80 x 40 x 2.0mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 2.5mm (80x40mm)'>Tubo Rectangular 80 x 40 x 2.5mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 3.0mm (80x40mm)'>Tubo Rectangular 80 x 40 x 3.0mm (80x40mm)</option>
                    <option value='Tubo Rectangular 100 x 40 x 2.0mm (100x40mm)'>Tubo Rectangular 100 x 40 x 2.0mm (100x40mm)</option>
                    <option value='Tubo Rectangular 100 x 50 x 2.0mm (100x50mm)'>Tubo Rectangular 100 x 50 x 2.0mm (100x50mm)</option>
                    <option value='Tubo Rectangular 3" x 1.5" x 2.0mm'>Tubo Rectangular 3" x 1.5" x 2.0mm</option>
                    <option value='Tubo Rectangular 3" x 2" x 2.0mm'>Tubo Rectangular 3" x 2" x 2.0mm</option>
                    <option value='Tubo Rectangular 4" x 2" x 2.0mm'>Tubo Rectangular 4" x 2" x 2.0mm</option>
                    <option value='Tubo Cuadrado 2" x 2" x 2.0mm'>Tubo Cuadrado 2" x 2" x 2.0mm</option>
                    <option value='Tubo Cuadrado 2 1/2" x 2 1/2" x 2.0mm'>Tubo Cuadrado 2 1/2" x 2 1/2" x 2.0mm</option>
                  </optgroup>
                  <optgroup label="Ángulos y Tubos Redondos">
                    <option value='Ángulo Estructural 1.5" x 1.5" x 3/16"'>Ángulo Estructural 1.5" x 1.5" x 3/16"</option>
                    <option value='Ángulo Estructural 2" x 2" x 3/16"'>Ángulo Estructural 2" x 2" x 3/16"</option>
                    <option value='Ángulo Estructural 2 1/2" x 2 1/2" x 1/4"'>Ángulo Estructural 2 1/2" x 2 1/2" x 1/4"</option>
                    <option value='Tubo Redondo 1 1/2" x 2.0mm'>Tubo Redondo 1 1/2" x 2.0mm</option>
                    <option value='Tubo Redondo 2" x 2.0mm'>Tubo Redondo 2" x 2.0mm</option>
                    <option value='Tubo Redondo 2 1/2" x 2.0mm'>Tubo Redondo 2 1/2" x 2.0mm</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Perfil Diagonales y Montantes</label>
                <select
                  value={design.perfilDiagonales}
                  onChange={e => updateField('perfilDiagonales', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white"
                >
                  <optgroup label="Ángulos Estructurales">
                    <option value='Ángulo Estructural 1" x 1" x 1/8"'>Ángulo Estructural 1" x 1" x 1/8"</option>
                    <option value='Ángulo Estructural 1.25" x 1.25" x 1/8"'>Ángulo Estructural 1.25" x 1.25" x 1/8"</option>
                    <option value='Ángulo Estructural 1.5" x 1.5" x 3/16"'>Ángulo Estructural 1.5" x 1.5" x 3/16"</option>
                    <option value='Ángulo Estructural 2" x 2" x 3/16"'>Ángulo Estructural 2" x 2" x 3/16"</option>
                  </optgroup>
                  <optgroup label="Tubos Cuadrados y Rectangulares">
                    <option value='Tubo Cuadrado 1" x 1" x 1.5mm'>Tubo Cuadrado 1" x 1" x 1.5mm</option>
                    <option value='Tubo Cuadrado 1.25" x 1.25" x 1.5mm'>Tubo Cuadrado 1.25" x 1.25" x 1.5mm</option>
                    <option value='Tubo Cuadrado 1.5" x 1.5" x 1.5mm'>Tubo Cuadrado 1.5" x 1.5" x 1.5mm</option>
                    <option value='Tubo Rectangular 2" x 1" x 1.5mm'>Tubo Rectangular 2" x 1" x 1.5mm</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.5mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.5mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.0mm (60x40mm)'>Tubo Rectangular 60 x 40 x 2.0mm (60x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 1.5mm (80x40mm)'>Tubo Rectangular 80 x 40 x 1.5mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 2.0mm (80x40mm)'>Tubo Rectangular 80 x 40 x 2.0mm (80x40mm)</option>
                  </optgroup>
                  <optgroup label="Tubos Redondos y Fierro Macizo">
                    <option value='Tubo Redondo 3/4" x 1.5mm'>Tubo Redondo 3/4" x 1.5mm</option>
                    <option value='Tubo Redondo 1" x 1.5mm'>Tubo Redondo 1" x 1.5mm</option>
                    <option value='Tubo Redondo 1 1/4" x 1.5mm'>Tubo Redondo 1 1/4" x 1.5mm</option>
                    <option value='Tubo Redondo 1 1/2" x 2.0mm'>Tubo Redondo 1 1/2" x 2.0mm</option>
                    <option value='Fierro Corrugado / Liso Ø 5/8" (16mm)'>Fierro Corrugado / Liso Ø 5/8" (16mm)</option>
                    <option value='Fierro Corrugado / Liso Ø 3/4" (19mm)'>Fierro Corrugado / Liso Ø 3/4" (19mm)</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Columnas y Anclajes</h3>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Perfil Columnas</label>
                <select
                  value={design.perfilColumnas}
                  onChange={e => updateField('perfilColumnas', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white"
                >
                  <optgroup label="Tubos Cuadrados E.H.">
                    <option value='Tubo Cuadrado 3" x 3" x 2.5mm'>Tubo Cuadrado 3" x 3" x 2.5mm</option>
                    <option value='Tubo Cuadrado 3" x 3" x 3.0mm'>Tubo Cuadrado 3" x 3" x 3.0mm</option>
                    <option value='Tubo Cuadrado 4" x 4" x 2.5mm'>Tubo Cuadrado 4" x 4" x 2.5mm</option>
                    <option value='Tubo Cuadrado 4" x 4" x 3.0mm'>Tubo Cuadrado 4" x 4" x 3.0mm</option>
                    <option value='Tubo Cuadrado 4" x 4" x 4.0mm'>Tubo Cuadrado 4" x 4" x 4.0mm</option>
                    <option value='Tubo Cuadrado 5" x 5" x 3.0mm'>Tubo Cuadrado 5" x 5" x 3.0mm</option>
                    <option value='Tubo Cuadrado 6" x 6" x 3.0mm'>Tubo Cuadrado 6" x 6" x 3.0mm</option>
                    <option value='Tubo Cuadrado 6" x 6" x 4.0mm'>Tubo Cuadrado 6" x 6" x 4.0mm</option>
                    <option value='Tubo Cuadrado 8" x 8" x 6.0mm'>Tubo Cuadrado 8" x 8" x 6.0mm (Heavy Column)</option>
                  </optgroup>
                  <optgroup label="Tubos Redondos / SCH40">
                    <option value='Tubo Redondo 3" x 2.5mm'>Tubo Redondo 3" x 2.5mm</option>
                    <option value='Tubo Redondo 4" x 3.0mm'>Tubo Redondo 4" x 3.0mm (Columna Tubular Circular)</option>
                    <option value='Tubo Redondo 5" x 4.0mm'>Tubo Redondo 5" x 4.0mm</option>
                    <option value='Tubo Redondo 6" x 4.0mm'>Tubo Redondo 6" x 4.0mm</option>
                    <option value='Tubo SCH40 ISO Ø 3" (88.9mm x 5.5mm)'>Tubo SCH40 ISO Ø 3" (88.9mm x 5.5mm)</option>
                    <option value='Tubo SCH40 ISO Ø 4" (114.3mm x 6.0mm)'>Tubo SCH40 ISO Ø 4" (114.3mm x 6.0mm)</option>
                    <option value='Tubo SCH40 ISO Ø 6" (168.3mm x 7.1mm)'>Tubo SCH40 ISO Ø 6" (168.3mm x 7.1mm)</option>
                  </optgroup>
                  <optgroup label="Vigas H / I / Canales UPN">
                    <option value='Perfil H 6" x 6" Heavy Steel'>Perfil H 6" x 6" Heavy Steel</option>
                    <option value='Viga HEA 120 (120x114mm)'>Viga HEA 120 (120x114mm)</option>
                    <option value='Viga HEA 160 (160x152mm)'>Viga HEA 160 (160x152mm)</option>
                    <option value='Viga W 8" x 21 (200x133mm)'>Viga W 8" x 21 (200x133mm)</option>
                    <option value='Viga W 10" x 30 (250x146mm)'>Viga W 10" x 30 (250x146mm)</option>
                    <option value='Canal UPN 120 (120x55mm Doble)'>Canal UPN 120 (120x55mm Doble)</option>
                    <option value='Canal UPN 150 (150x65mm Doble)'>Canal UPN 150 (150x65mm Doble)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Pernos de Anclaje</label>
                <input
                  type="text"
                  value={design.placaBaseMm.pernosAnclaje}
                  onChange={e => onUpdateDesign({
                    ...design,
                    placaBaseMm: { ...design.placaBaseMm, pernosAnclaje: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. SECCIÓN: CORREAS Y ARRIOSTRANMIENTO */}
        {activeSection === 'correas' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                Modulación de Correas
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Perfil de Correas</label>
                <select
                  value={design.perfilCorreas}
                  onChange={e => updateField('perfilCorreas', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
                >
                  <optgroup label="Perfiles C (Formado en Frío)">
                    <option value='Perfil C 3" x 1 1/2" x 1.5mm'>Perfil C 3" x 1 1/2" x 1.5mm</option>
                    <option value='Perfil C 4" x 2" x 1.5mm'>Perfil C 4" x 2" x 1.5mm</option>
                    <option value='Perfil C 4" x 2" x 2.0mm'>Perfil C 4" x 2" x 2.0mm (Estándar)</option>
                    <option value='Perfil C 4" x 2" x 2.5mm'>Perfil C 4" x 2" x 2.5mm</option>
                    <option value='Perfil C 5" x 2" x 2.0mm'>Perfil C 5" x 2" x 2.0mm</option>
                    <option value='Perfil C 6" x 2" x 2.0mm'>Perfil C 6" x 2" x 2.0mm (Carga Alta)</option>
                    <option value='Perfil C 6" x 2" x 2.5mm'>Perfil C 6" x 2" x 2.5mm</option>
                    <option value='Perfil C 6" x 2" x 3.0mm'>Perfil C 6" x 2" x 3.0mm (Industrial Pesado)</option>
                    <option value='Perfil C 8" x 2" x 2.5mm'>Perfil C 8" x 2" x 2.5mm</option>
                    <option value='Perfil C 8" x 2" x 3.0mm'>Perfil C 8" x 2" x 3.0mm</option>
                  </optgroup>
                  <optgroup label="Perfiles Z (Traslapables Continuos)">
                    <option value='Perfil Z 4" x 2" x 2.0mm'>Perfil Z 4" x 2" x 2.0mm</option>
                    <option value='Perfil Z 6" x 2" x 2.0mm'>Perfil Z 6" x 2" x 2.0mm</option>
                    <option value='Perfil Z 6" x 2.5" x 2.0mm'>Perfil Z 6" x 2.5" x 2.0mm (Solape Continuo)</option>
                    <option value='Perfil Z 8" x 2.5" x 2.5mm'>Perfil Z 8" x 2.5" x 2.5mm</option>
                    <option value='Perfil Z 10" x 3" x 3.0mm'>Perfil Z 10" x 3" x 3.0mm</option>
                  </optgroup>
                  <optgroup label="Tubos Rectangulares y Cuadrados">
                    <option value='Tubo Rectangular 2" x 1" x 1.5mm'>Tubo Rectangular 2" x 1" x 1.5mm</option>
                    <option value='Tubo Rectangular 2" x 1.5" x 2.0mm'>Tubo Rectangular 2" x 1.5" x 2.0mm</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.2mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.2mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.5mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.5mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 1.8mm (60x40mm)'>Tubo Rectangular 60 x 40 x 1.8mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.0mm (60x40mm)'>Tubo Rectangular 60 x 40 x 2.0mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 2.5mm (60x40mm)'>Tubo Rectangular 60 x 40 x 2.5mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 40 x 3.0mm (60x40mm)'>Tubo Rectangular 60 x 40 x 3.0mm (60x40mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.2mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.2mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.5mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.5mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 1.8mm (60x30mm)'>Tubo Rectangular 60 x 30 x 1.8mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.0mm (60x30mm)'>Tubo Rectangular 60 x 30 x 2.0mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.5mm (60x30mm)'>Tubo Rectangular 60 x 30 x 2.5mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 3.0mm (60x30mm)'>Tubo Rectangular 60 x 30 x 3.0mm (60x30mm)</option>
                    <option value='Tubo Rectangular 60 x 30 x 2.0mm Galvanizado'>Tubo Rectangular 60 x 30 x 2.0mm Galvanizado</option>
                    <option value='Tubo Rectangular 80 x 40 x 1.5mm (80x40mm)'>Tubo Rectangular 80 x 40 x 1.5mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 1.8mm (80x40mm)'>Tubo Rectangular 80 x 40 x 1.8mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 2.0mm (80x40mm)'>Tubo Rectangular 80 x 40 x 2.0mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 2.5mm (80x40mm)'>Tubo Rectangular 80 x 40 x 2.5mm (80x40mm)</option>
                    <option value='Tubo Rectangular 80 x 40 x 3.0mm (80x40mm)'>Tubo Rectangular 80 x 40 x 3.0mm (80x40mm)</option>
                    <option value='Tubo Rectangular 100 x 40 x 2.0mm (100x40mm)'>Tubo Rectangular 100 x 40 x 2.0mm (100x40mm)</option>
                    <option value='Tubo Rectangular 100 x 50 x 2.0mm (100x50mm)'>Tubo Rectangular 100 x 50 x 2.0mm (100x50mm)</option>
                    <option value='Tubo Rectangular 3" x 1.5" x 2.0mm'>Tubo Rectangular 3" x 1.5" x 2.0mm</option>
                    <option value='Tubo Rectangular 3" x 2" x 2.0mm'>Tubo Rectangular 3" x 2" x 2.0mm</option>
                    <option value='Tubo Rectangular 4" x 2" x 2.0mm'>Tubo Rectangular 4" x 2" x 2.0mm</option>
                    <option value='Tubo Cuadrado 1.5" x 1.5" x 1.5mm'>Tubo Cuadrado 1.5" x 1.5" x 1.5mm</option>
                    <option value='Tubo Cuadrado 2" x 2" x 2.0mm'>Tubo Cuadrado 2" x 2" x 2.0mm</option>
                  </optgroup>
                  <optgroup label="Tubos Redondos / Cilíndricos">
                    <option value='Tubo Redondo 1 1/2" x 2.0mm'>Tubo Redondo 1 1/2" x 2.0mm</option>
                    <option value='Tubo Redondo 2" x 2.0mm'>Tubo Redondo 2" x 2.0mm</option>
                    <option value='Tubo Redondo 2 1/2" x 2.0mm'>Tubo Redondo 2 1/2" x 2.0mm</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Espaciado Correas (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={design.distanciaCorreasM}
                    onChange={e => updateField('distanciaCorreasM', parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Filas por Caída</label>
                  <input
                    type="number"
                    value={design.numFilasCorreas}
                    onChange={e => updateField('numFilasCorreas', parseInt(e.target.value) || 7)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Arriostramientos de Viento (Tensores X)</h3>
              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-xs font-semibold text-slate-200">Cables de Acero y Templadores</span>
                <input
                  type="checkbox"
                  checked={design.tensoresVientoCable.activo}
                  onChange={e => onUpdateDesign({
                    ...design,
                    tensoresVientoCable: { ...design.tensoresVientoCable, activo: e.target.checked }
                  })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </div>

              {design.tensoresVientoCable.activo && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Diámetro de Cable</label>
                  <select
                    value={design.tensoresVientoCable.diametroPulgadas}
                    onChange={e => onUpdateDesign({
                      ...design,
                      tensoresVientoCable: { ...design.tensoresVientoCable, diametroPulgadas: e.target.value }
                    })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-white"
                  >
                    <option value='3/8"'>Cable de Acero Galvanizado 3/8"</option>
                    <option value='1/2"'>Cable de Acero Galvanizado 1/2"</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SECCIÓN: COBERTURA Y FIJACIONES */}
        {activeSection === 'cobertura' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Material de Cobertura
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tipo de Cobertura</label>
                <select
                  value={design.tipoCobertura}
                  onChange={e => updateField('tipoCobertura', e.target.value as TipoCobertura)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
                >
                  <option value="aluzinc_tr4">Aluzinc TR-4 Prepintado (Industrial Estándar)</option>
                  <option value="aluzinc_tr5">Aluzinc TR-5 (Carga Alta / Luces Largas)</option>
                  <option value="policarbonato_alveolar">Policarbonato Alveolar Traslúcido</option>
                  <option value="upvc_termoacustica">UPVC Termoacústica 3 Capas</option>
                  <option value="panel_sandwich_pur">Panel Sándwich Poliuretano PUR 30mm</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Espesor (mm)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={design.espesorCoberturaMm}
                    onChange={e => updateField('espesorCoberturaMm', parseFloat(e.target.value) || 0.40)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Color Cobertura</label>
                  <select
                    value={design.colorCobertura}
                    onChange={e => updateField('colorCobertura', e.target.value as ColorCobertura)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold"
                  >
                    <option value="azul_real">Azul Real Prepintado</option>
                    <option value="rojo_teja">Rojo Teja Prepintado</option>
                    <option value="gris_grafito">Gris Grafito Prepintado</option>
                    <option value="aluzinc_natural">Aluzinc Natural Malla Galv.</option>
                    <option value="traslucido">Traslúcido / Opal (Luz)</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-amber-300 mb-1">📐 Zona de Placas Translúcidas (Iluminación Natural)</label>
                <select
                  value={design.zonaTranslúcida || 'ninguna'}
                  onChange={e => updateField('zonaTranslúcida', e.target.value as any)}
                  className="w-full bg-slate-800 border border-amber-500/50 rounded-lg p-2 text-white font-semibold"
                >
                  <option value="ninguna">🚫 Sin Translúcidos (Opaco Total)</option>
                  <option value="franja_central">☀️ Franja Central (Eje Cumbrera)</option>
                  <option value="laterales">📐 Laterales / Aleros</option>
                  <option value="alternados">🔀 Alternados por Módulo</option>
                  <option value="total">✨ Cobertura Total Translúcida</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Fijaciones con Pernos EPDM</h3>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Especificación de Pernos</label>
                <input
                  type="text"
                  value={design.fijaciones.tipoPerno}
                  onChange={e => onUpdateDesign({
                    ...design,
                    fijaciones: { ...design.fijaciones, tipoPerno: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-xs font-semibold text-slate-200">Mostrar Pernos EPDM en Lienzo CAD</span>
                <input
                  type="checkbox"
                  checked={design.fijaciones.mostrarPernosEnCad}
                  onChange={e => onUpdateDesign({
                    ...design,
                    fijaciones: { ...design.fijaciones, mostrarPernosEnCad: e.target.checked }
                  })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. SECCIÓN: COSTOS Y MANO DE OBRA */}
        {activeSection === 'costos' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Ratios de Costo por m²
              </h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Materiales Estructura y Cobertura (S/ por m²)</label>
                <input
                  type="number"
                  value={design.costoM2Materiales}
                  onChange={e => updateField('costoM2Materiales', parseFloat(e.target.value) || 85)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Mano de Obra y Montaje (S/ por m²)</label>
                <input
                  type="number"
                  value={design.costoM2ManoObra}
                  onChange={e => updateField('costoM2ManoObra', parseFloat(e.target.value) || 35)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Equipos y Camión Grúa (S/ por m²)</label>
                <input
                  type="number"
                  value={design.costoM2EquiposGrua}
                  onChange={e => updateField('costoM2EquiposGrua', parseFloat(e.target.value) || 12)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </aside>
    </>
  );
};

export default TechosPropertiesPanel;
