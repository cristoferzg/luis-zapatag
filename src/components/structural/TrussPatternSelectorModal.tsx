import React, { useState } from 'react';
import { X, Check, Info, Box, Layout } from 'lucide-react';
import { PatronTijeral, TipoTijeral } from './structuralTypes';

interface TrussPatternSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPattern: (pattern: PatronTijeral) => void;
  onSelectTipo: (tipo: TipoTijeral) => void;
  onConfirm?: () => void;
  currentPattern: PatronTijeral;
  currentTipo: TipoTijeral;
}

export const TrussPatternSelectorModal: React.FC<TrussPatternSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPattern,
  onSelectTipo,
  onConfirm,
  currentPattern,
  currentTipo
}) => {
  const [activeTab, setActiveTab] = useState<'tipo' | 'patron'>('tipo');

  if (!isOpen) return null;

  const types: { id: TipoTijeral; name: string; desc: string; icon: string }[] = [
    { id: 'dos_aguas', name: 'Dos Aguas', desc: 'Simétrico con cumbrera central. El más común para naves industriales.', icon: '🏠' },
    { id: 'una_agua', name: 'Una Agua', desc: 'Monopendiente. Ideal para cobertizos o ampliaciones laterales.', icon: '📐' },
    { id: 'parabolico', name: 'Parabólico', desc: 'Arco curvado. Máxima eficiencia para grandes luces y drenaje fluido.', icon: '🌈' },
    { id: 'plano', name: 'Plano', desc: 'Cordones paralelos. Peralte constante para techos planos o entrepisos.', icon: '➖' },
    { id: 'asimetrico', name: 'Asimétrico', desc: 'Cumbrera desplazada. Soluciones arquitectónicas especiales.', icon: '⚡' },
  ];

  const patterns: { id: PatronTijeral; name: string; desc: string; icon: string }[] = [
    { id: 'warren', name: 'Warren', desc: 'Sistema de diagonales en V alternada. Muy eficiente para luces medianas.', icon: '📐' },
    { id: 'pratt', name: 'Pratt', desc: 'Montantes verticales y diagonales hacia el centro. Ideal para cargas uniformes.', icon: '🏗️' },
    { id: 'howe', name: 'Howe', desc: 'Diagonales que trabajan a compresión. Diseño clásico y robusto.', icon: '📏' },
    { id: 'fink', name: 'Fink', desc: 'Subdivisiones internas que reducen la longitud de las cuerdas. Para grandes luces.', icon: '🔱' },
    { id: 'king_post', name: 'King Post', desc: 'Montante central único. Estructura simple para luces pequeñas.', icon: '📍' },
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-xl bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-8 py-6 bg-amber-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner backdrop-blur-sm">
                📐
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight leading-none mb-1">Diseñador de Tijerales</h2>
                <p className="text-[10px] text-amber-100 font-bold uppercase tracking-[0.2em]">Configuración de Geometría y Carga</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-white/10 text-amber-100 hover:text-white transition-all cursor-pointer group active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* TABS */}
          <div className="flex p-1 bg-amber-700/30 rounded-2xl">
            <button
              onClick={() => setActiveTab('tipo')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'tipo' ? 'bg-white text-amber-600 shadow-lg' : 'text-amber-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>1. Arquetipo (Forma)</span>
            </button>
            <button
              onClick={() => setActiveTab('patron')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'patron' ? 'bg-white text-amber-600 shadow-lg' : 'text-amber-100 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>2. Patrón (Celosía)</span>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar space-y-6">
          <div className="flex items-start space-x-4 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-[13px] text-amber-900/80 leading-relaxed font-medium">
              {activeTab === 'tipo' 
                ? "Define la forma exterior del tijeral. Debe coincidir con la pendiente y estilo arquitectónico de tu techo."
                : "Define la distribución interna de los elementos de acero. Un patrón adecuado optimiza el peso y la resistencia."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {(activeTab === 'tipo' ? types : patterns).map((item) => {
              const isSelected = activeTab === 'tipo' 
                ? currentTipo === item.id 
                : currentPattern === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (activeTab === 'tipo') {
                      onSelectTipo(item.id as TipoTijeral);
                      setActiveTab('patron');
                    } else {
                      onSelectPattern(item.id as PatronTijeral);
                    }
                  }}
                  className={`flex items-center p-4 rounded-[24px] border-2 transition-all text-left group relative ${
                    isSelected 
                      ? 'bg-amber-50 border-amber-600 ring-4 ring-amber-500/10' 
                      : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-amber-300 hover:shadow-xl'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mr-5 shrink-0 transition-all ${
                    isSelected ? 'bg-amber-600 text-white shadow-xl scale-110' : 'bg-white border border-slate-200 group-hover:bg-amber-100'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 pr-8">
                    <h3 className={`text-base font-black mb-1 ${isSelected ? 'text-amber-900' : 'text-slate-700'}`}>
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold leading-tight uppercase tracking-wide opacity-80">
                      {item.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute right-6 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-200">
                      <Check className="w-5 h-5" strokeWidth={4} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Estado Actual</span>
            <div className="flex items-center space-x-2 text-[11px] font-black text-slate-700">
              <span className="text-amber-600">{currentTipo.replace('_', ' ').toUpperCase()}</span>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-600">{currentPattern.toUpperCase()}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className="px-8 py-3 rounded-2xl text-xs font-black bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-[0_12px_24px_-8px_rgba(217,119,6,0.5)] active:scale-95 flex items-center space-x-2"
            >
              <span>{onConfirm ? 'Generar Estructura' : 'Guardar Diseño'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
