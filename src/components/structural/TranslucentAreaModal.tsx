import React, { useState } from 'react';
import { Sparkles, Check, X, Sun, Layers, Grid, Sliders, ArrowDownRight, Link2 } from 'lucide-react';
import { RoofSector, StructuralGeometry, CoberturaOptions } from './structuralTypes';

interface TranslucentAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  geometria: StructuralGeometry;
  cobertura: CoberturaOptions;
  onAddSector: (sector: RoofSector) => void;
  onUpdateSector: (sectorId: string, updates: Partial<RoofSector>) => void;
  onStartDrawingTranslucent: () => void;
}

export const TranslucentAreaModal: React.FC<TranslucentAreaModalProps> = ({
  isOpen,
  onClose,
  geometria,
  cobertura,
  onAddSector,
  onUpdateSector,
  onStartDrawingTranslucent
}) => {
  const [tab, setTab] = useState<'automatic' | 'convert' | 'draw'>('automatic');

  // Automatic strip configuration
  const [stripType, setStripType] = useState<'central' | 'left' | 'right' | 'percentage'>('central');
  const [stripWidthM, setStripWidthM] = useState<number>(2.0);
  const [stripPct, setStripPct] = useState<number>(20);
  const [tipoPolicarbonato, setTipoPolicarbonato] = useState<string>('policarbonato_alveolar');
  const [colorTranslucido, setColorTranslucido] = useState<'Verde' | 'Azul' | 'Blanco' | 'Cristal'>('Verde');
  const [acoplarAlTecho, setAcoplarAlTecho] = useState<boolean>(true);

  if (!isOpen) return null;

  const sectores = geometria.sectores || [];
  const mainSec = sectores.length > 0 ? sectores[0] : null;

  // Roof reference bounds
  const roofLargo = geometria.largo || 12;
  const roofAncho = geometria.ancho || 8;

  // Handle creating automatic translucent strip
  const handleCreateAutomaticStrip = () => {
    let minY = 0;
    let maxY = roofAncho;
    let minX = 0;
    let maxX = roofLargo;

    if (stripType === 'central') {
      const width = Math.min(stripWidthM, roofAncho * 0.8);
      minY = (roofAncho - width) / 2;
      maxY = minY + width;
    } else if (stripType === 'left') {
      const width = Math.min(stripWidthM, roofAncho * 0.5);
      minY = 0;
      maxY = width;
    } else if (stripType === 'right') {
      const width = Math.min(stripWidthM, roofAncho * 0.5);
      minY = roofAncho - width;
      maxY = roofAncho;
    } else if (stripType === 'percentage') {
      const lengthStrip = roofLargo * (stripPct / 100);
      minX = (roofLargo - lengthStrip) / 2;
      maxX = minX + lengthStrip;
    }

    const vertices = [
      { x: parseFloat(minX.toFixed(2)), y: parseFloat(minY.toFixed(2)), z: 3.50 },
      { x: parseFloat(maxX.toFixed(2)), y: parseFloat(minY.toFixed(2)), z: 3.50 },
      { x: parseFloat(maxX.toFixed(2)), y: parseFloat(maxY.toFixed(2)), z: 3.50 },
      { x: parseFloat(minX.toFixed(2)), y: parseFloat(maxY.toFixed(2)), z: 3.50 }
    ];

    const count = sectores.filter(s => s.esTranslucido).length + 1;
    const refSlope = mainSec?.pendientePct ?? 10.0;
    const refDir = mainSec?.direccionCaida ?? geometria.direccionCaida ?? 'calle';
    const refHBajo = mainSec?.alturaLadoBajo ?? 3.00;
    const refHAlto = mainSec?.alturaLadoAlto ?? 3.60;

    const newSector: RoofSector = {
      id: `sec-trans-${Date.now()}`,
      nombre: `Translúcido ${count}`,
      vertices,
      alturaLadoBajo: refHBajo,
      alturaLadoAlto: refHAlto,
      pendientePct: refSlope,
      direccionCaida: refDir,
      color: colorTranslucido === 'Azul' ? '#0284c7' : colorTranslucido === 'Blanco' ? '#94a3b8' : colorTranslucido === 'Cristal' ? '#06b6d4' : '#10b981',
      materialCobertura: tipoPolicarbonato === 'policarbonato_alveolar' ? 'Policarbonato Alveolar 6mm' :
                         tipoPolicarbonato === 'policarbonato_ondulado' ? 'Policarbonato Ondulado TR4' :
                         tipoPolicarbonato === 'fibra_vidrio' ? 'Fibra de Vidrio Translúcida' : 'Policarbonato Compacto 4mm',
      canaletaBordes: [0],
      acopladoAlTecho: acoplarAlTecho,
      esTranslucido: true,
      tipoTranslucido: tipoPolicarbonato,
      colorTranslucido: colorTranslucido,
      opacidadTranslucido: 0.42
    };

    onAddSector(newSector);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-black text-sm md:text-base leading-tight">Complemento de Áreas Translúcidas</h3>
              <p className="text-[11px] text-emerald-100 font-medium">Policarbonato y Luz Natural con Acople Automático</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setTab('automatic')}
            className={`flex-1 py-2.5 px-2 flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              tab === 'automatic'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Franja Automática</span>
          </button>

          <button
            onClick={() => setTab('convert')}
            className={`flex-1 py-2.5 px-2 flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              tab === 'convert'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Convertir Sector ({sectores.length})</span>
          </button>

          <button
            onClick={() => setTab('draw')}
            className={`flex-1 py-2.5 px-2 flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              tab === 'draw'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Dibujar con Imán</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
          
          {/* TAB 1: AUTOMATIC STRIP */}
          {tab === 'automatic' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 flex items-start space-x-2.5">
                <Link2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Acople inteligente 100% coplanar:</strong> La franja translúcida se genera ajustada a las cotas del techo y mantiene la misma pendiente y altura Z que el techo existente, eliminando descuadres o desniveles.
                </div>
              </div>

              {/* Posición de la Franja */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                  Ubicación de la Franja Translúcida
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStripType('central')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      stripType === 'central'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Franja Central</span>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <p className="text-[10px] text-slate-500">Iluminación cenital en el centro del galpón</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStripType('percentage')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      stripType === 'percentage'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Por Tramo (%)</span>
                      <Sliders className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="text-[10px] text-slate-500">Tramo central {stripPct}% de la longitud</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStripType('left')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      stripType === 'left'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Lado Izquierdo</span>
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] text-slate-500">Borde lateral izquierdo del techo</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStripType('right')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      stripType === 'right'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 text-emerald-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">Lado Derecho</span>
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] text-slate-500">Borde lateral derecho del techo</p>
                  </button>
                </div>
              </div>

              {/* Ancho o Porcentaje */}
              {stripType !== 'percentage' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Ancho de Franja (m)</label>
                    <span className="font-mono font-bold text-emerald-700">{stripWidthM.toFixed(2)} m</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1.0, 1.5, 2.0, 3.0].map((w) => (
                      <button
                        key={`w-${w}`}
                        type="button"
                        onClick={() => setStripWidthM(w)}
                        className={`py-1.5 rounded-lg border font-bold text-xs cursor-pointer ${
                          stripWidthM === w
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {w.toFixed(1)} m
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Porcentaje de Luz (%)</label>
                    <span className="font-mono font-bold text-emerald-700">{stripPct}% del techo</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={stripPct}
                    onChange={(e) => setStripPct(parseInt(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              )}

              {/* Material Policarbonato */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tipo de Material</label>
                  <select
                    value={tipoPolicarbonato}
                    onChange={(e) => setTipoPolicarbonato(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="policarbonato_alveolar">Policarbonato Alveolar 6mm</option>
                    <option value="policarbonato_ondulado">Policarbonato Ondulado TR4</option>
                    <option value="fibra_vidrio">Fibra de Vidrio Translúcida</option>
                    <option value="acrilico">Policarbonato Compacto 4mm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tonalidad / Color</label>
                  <select
                    value={colorTranslucido}
                    onChange={(e) => setColorTranslucido(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Verde">Verde Esmeralda (Recomendado)</option>
                    <option value="Azul">Azul Cielo</option>
                    <option value="Blanco">Blanco Opalino (Difusor)</option>
                    <option value="Cristal">Cristal Transparente</option>
                  </select>
                </div>
              </div>

              {/* Acople Checkbox */}
              <label className="flex items-center space-x-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acoplarAlTecho}
                  onChange={(e) => setAcoplarAlTecho(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-[11px] font-bold text-slate-700">
                  Acoplar y nivelar automáticamente con el plano del techo (Recomendado)
                </span>
              </label>

              <button
                type="button"
                onClick={handleCreateAutomaticStrip}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Generar Franja Translúcida Acoplada</span>
              </button>
            </div>
          )}

          {/* TAB 2: CONVERT EXISTING SECTOR */}
          {tab === 'convert' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500">
                Selecciona cualquier sector dibujado para convertirlo en cobertura translúcida de policarbonato o volverlo aluzinc.
              </p>

              {sectores.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 font-bold">
                  No hay sectores creados todavía. Ve a "Franja Automática" para crear uno con 1 clic.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sectores.map((sec) => (
                    <div
                      key={`modal-sec-${sec.id}`}
                      className={`p-3 rounded-xl border transition-all ${
                        sec.esTranslucido
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: sec.color || '#2563eb' }}
                          ></span>
                          <strong className="text-xs font-bold text-slate-800">{sec.nombre}</strong>
                          {sec.esTranslucido && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                              ✨ Translúcido
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const willBeTranslucent = !sec.esTranslucido;
                            onUpdateSector(sec.id, {
                              esTranslucido: willBeTranslucent,
                              acopladoAlTecho: true,
                              color: willBeTranslucent ? '#10b981' : '#2563eb',
                              materialCobertura: willBeTranslucent ? 'Policarbonato Alveolar' : (cobertura.tipo || 'Aluzinc TR4'),
                              colorTranslucido: willBeTranslucent ? 'Verde' : undefined,
                              opacidadTranslucido: willBeTranslucent ? 0.42 : undefined
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            sec.esTranslucido
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {sec.esTranslucido ? 'Quitar Translúcido' : 'Hacer Translúcido'}
                        </button>
                      </div>

                      {sec.esTranslucido && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                          <div>
                            <label className="text-[10px] font-bold text-emerald-800">Color Policarbonato</label>
                            <select
                              value={sec.colorTranslucido || 'Verde'}
                              onChange={(e) => onUpdateSector(sec.id, { colorTranslucido: e.target.value as any })}
                              className="w-full p-1 bg-white border border-emerald-300 rounded text-xs"
                            >
                              <option value="Verde">Verde Esmeralda</option>
                              <option value="Azul">Azul Cielo</option>
                              <option value="Blanco">Blanco Opalino</option>
                              <option value="Cristal">Cristal Transparente</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateSector(sec.id, { acopladoAlTecho: true });
                              }}
                              className="w-full p-1.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] hover:bg-emerald-200 flex items-center justify-center space-x-1"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>{sec.acopladoAlTecho !== false ? '✓ Acoplado al Techo' : 'Acoplar al Techo'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DRAW CUSTOM AREA WITH MAGNETIC SNAP */}
          {tab === 'draw' && (
            <div className="space-y-3.5 text-center p-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Grid className="w-6 h-6" />
              </div>
              <h4 className="font-black text-sm text-slate-800">Dibujar Área Translúcida con Imán CAD</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                El cursor se acoplará magnéticamente a los vértices y bordes del techo existente para trazar claraboyas o ventanas cenitales con precisión milimétrica.
              </p>

              <button
                type="button"
                onClick={() => {
                  onStartDrawingTranslucent();
                  onClose();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Activar Lápiz Magnético Translúcido</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
