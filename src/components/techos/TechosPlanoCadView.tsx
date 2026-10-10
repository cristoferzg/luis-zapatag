// Lámina de Plano CAD Arquitectónico y Estructural CM-02 Exclusiva para Techos Metálicos
// Planos 2D de Elevación y Planta Estructural con cotas, ejes, correas y tijerales RNE
import React, { useState } from 'react';
import { Compass, Printer } from 'lucide-react';

interface TechosPlanoCadViewProps {
  design?: any;
}

export const TechosPlanoCadView: React.FC<TechosPlanoCadViewProps> = ({ design }) => {
  const [selectedVistaTijeral, setSelectedVistaTijeral] = useState<
    | 'escalera_vierendeel' 
    | 'dos_aguas_fink' 
    | 'dos_aguas_howe' 
    | 'dos_aguas_pratt' 
    | 'dientes_sierra' 
    | 'cuatro_aguas' 
    | 'seis_aguas' 
    | 'mansarda' 
    | 'mariposa' 
    | 'curvo_autoportante' 
    | 'monitor' 
    | 'parabolico' 
    | 'viga_warren'
  >('escalera_vierendeel');
  const [activePlanoTab, setActivePlanoTab] = useState<'ambos' | 'elevacion' | 'planta'>('ambos');

  const handleImprimirPlano = () => {
    window.print();
  };

  const nombreProy = design?.nombre || 'ESTRUCTURA DE TECHO Y COBERTURA CUBIERTA';

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      {/* BARRA DE IMPRESIÓN Y CONTROLES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">LÁMINA CAD ESTRUCTURAL DE TECHO (CM-02)</h2>
            <p className="text-xs text-slate-500">Planos 2D de Elevación Frontal y Planta de Techo acotados con ejes y correas.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Vistas de Lámina */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActivePlanoTab('ambos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activePlanoTab === 'ambos' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Elevación + Planta
            </button>
            <button
              onClick={() => setActivePlanoTab('elevacion')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activePlanoTab === 'elevacion' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Elevación
            </button>
            <button
              onClick={() => setActivePlanoTab('planta')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activePlanoTab === 'planta' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Planta Techo
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-bold text-slate-500 px-1.5">Tipología:</span>
            <select
              value={selectedVistaTijeral}
              onChange={(e) => setSelectedVistaTijeral(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="escalera_vierendeel">🪜 Tijeral Escalera / Vierendeel</option>
              <option value="dientes_sierra">🏭 Dientes de Sierra (Sheds)</option>
              <option value="cuatro_aguas">🏛️ A Cuatro Aguas (Piramidal)</option>
              <option value="seis_aguas">🏯 A Seis Aguas (Hexagonal)</option>
              <option value="mansarda">🏚️ Mansarda (Gambrel)</option>
              <option value="mariposa">🦋 Techo Mariposa (V)</option>
              <option value="curvo_autoportante">🌈 Curvo Autoportante (Span)</option>
              <option value="monitor">🏭 Monitor / Linterna Cenital</option>
              <option value="dos_aguas_fink">🏠 2 Aguas Fink (W)</option>
              <option value="dos_aguas_pratt">📐 2 Aguas Pratt</option>
              <option value="dos_aguas_howe">🏛️ 2 Aguas Howe</option>
              <option value="parabolico">🏟️ Parabólico Warren</option>
              <option value="viga_warren">🏢 Viga Plana Warren (Joist)</option>
              <option value="tijeral_longitudinal">🏗️ Tijeral Longitudinal Warren/Pratt</option>
              <option value="tijeral_perimetral">🏛️ Tijeral Perimetral / Tímpano Fachada</option>
            </select>
          </div>

          <button
            onClick={handleImprimirPlano}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR PLANO CAD</span>
          </button>
        </div>
      </div>

      {/* LÁMINA DE PLANO ESTRUCTURAL CM-02 */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 max-w-6xl mx-auto shadow-sm border border-slate-300 font-mono text-xs print:shadow-none print:p-0 print:border-none space-y-6">
        
        {/* TITULO DE LÁMINA Y ESPECIFICACIONES TÉCNICAS */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-base font-black uppercase text-slate-900">PROYECTO: {nombreProy}</h1>
            <p className="text-[10px] text-slate-600 font-bold mt-0.5">SISTEMA ESTRUCTURAL DE TIJERALES, CORREAS Y PLANO DE COBERTURA</p>
          </div>
          <div className="text-left sm:text-right border-l-2 border-slate-900 pl-4">
            <span className="text-xs font-black text-amber-700 block">LÁMINA: CM-02</span>
            <span className="text-[10px] text-slate-500 block">ESCALA: 1:50 / 1:75</span>
          </div>
        </div>

        {/* CONTENIDO DIBUJOS CAD 2D */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-b-2 border-slate-900 pb-6">
          
          {/* DETALLE 1: PLANO DE ELEVACIÓN DE TIJERAL */}
          {(activePlanoTab === 'ambos' || activePlanoTab === 'elevacion') && (
            <div className={`border border-slate-300 p-4 rounded-xl bg-slate-50/70 relative ${activePlanoTab === 'elevacion' ? 'lg:col-span-2' : ''}`}>
              <div className="text-[10px] font-black uppercase text-slate-800 mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>DETALLE 01: ELEVACIÓN FRONTAL TIJERAL T-01 (ESC 1:50)</span>
                <span className="text-amber-700 text-[9px] font-bold">LUZ = 12.00m • H_COL = 4.50m</span>
              </div>

              <svg viewBox="0 0 500 250" className="w-full h-56 bg-white border border-slate-200 rounded-lg p-2">
                {/* Línea de suelo */}
                <line x1="20" y1="210" x2="480" y2="210" stroke="#64748b" strokeWidth="2" strokeDasharray="6 3" />
                <text x="25" y="222" fill="#64748b" fontSize="8" fontFamily="sans-serif">N.P.T. ±0.00</text>

                {/* Pedestales de concreto */}
                <rect x="50" y="195" width="20" height="15" fill="#94a3b8" stroke="#334155" strokeWidth="1" />
                <rect x="430" y="195" width="20" height="15" fill="#94a3b8" stroke="#334155" strokeWidth="1" />

                {/* Placas base y columnas */}
                <rect x="55" y="90" width="10" height="105" fill="#1e293b" />
                <rect x="435" y="90" width="10" height="105" fill="#1e293b" />
                <rect x="50" y="192" width="20" height="3" fill="#f59e0b" stroke="#000" strokeWidth="0.5" />
                <rect x="430" y="192" width="20" height="3" fill="#f59e0b" stroke="#000" strokeWidth="0.5" />

                {/* Ejes A y B */}
                <circle cx="60" cy="235" r="7" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <text x="60" y="238" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">A</text>
                <circle cx="440" cy="235" r="7" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <text x="440" y="238" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">B</text>

                {/* Cota Altura Columna */}
                <line x1="40" y1="90" x2="40" y2="195" stroke="#94a3b8" strokeWidth="1" />
                <text x="35" y="145" fill="#475569" fontSize="8" textAnchor="end">H=4.50m</text>

                {/* RENDERIZADO DEL TIJERAL SEGÚN TIPOLOGÍA */}
                {selectedVistaTijeral === 'escalera_vierendeel' ? (
                  /* TIJERAL TIPO ESCALERA / VIERENDEEL (Montantes a 90° sin diagonales) */
                  <g>
                    {/* Cordón Inferior */}
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    {/* Cordón Superior Izq y Der */}
                    <line x1="60" y1="90" x2="250" y2="35" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="250" y1="35" x2="440" y2="90" stroke="#f59e0b" strokeWidth="3" />
                    {/* Montante Central de Cumbrera */}
                    <line x1="250" y1="35" x2="250" y2="90" stroke="#8b5cf6" strokeWidth="2.5" />
                    {/* Montantes Intermedios a 90° Perpendiculares (Sin Diagonales) */}
                    <line x1="107" y1="76" x2="107" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="155" y1="62" x2="155" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="202" y1="49" x2="202" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="298" y1="49" x2="298" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="345" y1="62" x2="345" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="393" y1="76" x2="393" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    
                    {/* Indicador Rotulado de Vanos Tipo Escalera */}
                    <text x="250" y="24" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">
                      TIJERAL ESCALERA (VIERENDEEL) - MONTANTES A 90°
                    </text>
                  </g>
                ) : selectedVistaTijeral === 'parabolico' ? (
                  /* Arco Parabólico */
                  <g>
                    <path d="M 60 90 Q 250 20 440 90" fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <path d="M 60 90 Q 250 50 440 90" fill="none" stroke="#10b981" strokeWidth="3" />
                    <line x1="120" y1="73" x2="120" y2="84" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="180" y1="46" x2="180" y2="65" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="250" y1="20" x2="250" y2="50" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="320" y1="46" x2="320" y2="65" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="380" y1="73" x2="380" y2="84" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="60" y1="90" x2="120" y2="73" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="120" y1="84" x2="180" y2="46" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="180" y1="65" x2="250" y2="20" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="250" y1="50" x2="320" y2="46" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="320" y1="65" x2="380" y2="73" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="380" y1="84" x2="440" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                  </g>
                ) : selectedVistaTijeral === 'dientes_sierra' ? (
                  /* Techo Dientes de Sierra (Shed Industrial 3 Módulos) */
                  <g>
                    {/* Cordón Inferior Base */}
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    {/* Diente 1 (60 a 186) */}
                    <line x1="60" y1="90" x2="186" y2="40" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="186" y1="40" x2="186" y2="90" stroke="#8b5cf6" strokeWidth="2.5" />
                    <line x1="102" y1="73" x2="102" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="144" y1="56" x2="144" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    {/* Diente 2 (186 a 313) */}
                    <line x1="186" y1="90" x2="313" y2="40" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="313" y1="40" x2="313" y2="90" stroke="#8b5cf6" strokeWidth="2.5" />
                    <line x1="228" y1="73" x2="228" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="270" y1="56" x2="270" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    {/* Diente 3 (313 a 440) */}
                    <line x1="313" y1="90" x2="440" y2="40" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="440" y1="40" x2="440" y2="90" stroke="#8b5cf6" strokeWidth="2.5" />
                    <line x1="355" y1="73" x2="355" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="397" y1="56" x2="397" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <text x="250" y="24" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      TECHO DIENTES DE SIERRA (SHED INDUSTRIAL) - LUZ CENITAL
                    </text>
                  </g>
                ) : selectedVistaTijeral === 'cuatro_aguas' ? (
                  /* Techo a Cuatro Aguas / Piramidal */
                  <g>
                    {/* Cordón Inferior */}
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    {/* Limatesas Diagonales / Faldones */}
                    <line x1="60" y1="90" x2="180" y2="40" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="180" y1="40" x2="320" y2="40" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="320" y1="40" x2="440" y2="90" stroke="#f59e0b" strokeWidth="3" />
                    {/* Montantes y Péndulos */}
                    <line x1="180" y1="40" x2="180" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="250" y1="40" x2="250" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="320" y1="40" x2="320" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="120" y1="65" x2="120" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="380" y1="65" x2="380" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <text x="250" y="24" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      TECHO A CUATRO AGUAS / PIRAMIDAL - 4 CAÍDAS SIMÉTRICAS
                    </text>
                  </g>
                ) : selectedVistaTijeral === 'seis_aguas' ? (
                  /* Pabellón Hexagonal a Seis Aguas */
                  <g>
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    <line x1="60" y1="90" x2="250" y2="35" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="440" y1="90" x2="250" y2="35" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="155" y1="62" x2="250" y2="35" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
                    <line x1="345" y1="62" x2="250" y2="35" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
                    <line x1="250" y1="35" x2="250" y2="90" stroke="#8b5cf6" strokeWidth="2.5" />
                    <circle cx="250" cy="35" r="4" fill="#f59e0b" />
                    <text x="250" y="24" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      PABELLÓN HEXAGONAL A SEIS AGUAS - CÚSPIDE CENTRAL Y LIMATESAS RADIALES
                    </text>
                  </g>
                ) : selectedVistaTijeral === 'mansarda' ? (
                  /* Mansarda / Gambrel */
                  <g>
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    <line x1="60" y1="90" x2="130" y2="40" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="130" y1="40" x2="250" y2="25" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="250" y1="25" x2="370" y2="40" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="370" y1="40" x2="440" y2="90" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="130" y1="40" x2="130" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="250" y1="25" x2="250" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="370" y1="40" x2="370" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <text x="250" y="16" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      TECHO MANSARDA (GAMBREL) - QUIEBRE INFERIOR DE ALTA PENDIENTE
                    </text>
                  </g>
                ) : selectedVistaTijeral === 'mariposa' ? (
                  /* Techo Mariposa / V Invertida */
                  <g>
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="2" />
                    <line x1="60" y1="35" x2="250" y2="90" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="250" y1="90" x2="440" y2="35" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="60" y1="35" x2="60" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="440" y1="35" x2="440" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="155" y1="62" x2="155" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="345" y1="62" x2="345" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <rect x="242" y="85" width="16" height="10" fill="#3b82f6" rx="2" />
                    <text x="250" y="24" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      TECHO MARIPOSA (V) - CANALETA CENTRAL COLECTORA DE AGUAS
                    </text>
                  </g>
                ) : selectedVistaTijeral === 'curvo_autoportante' ? (
                  /* Arco Curvo Autoportante */
                  <g>
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="2" />
                    <path d="M 60 90 Q 250 15 440 90" fill="none" stroke="#f59e0b" strokeWidth="4" />
                    <text x="250" y="22" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      ARCO CURVO AUTOPORTANTE CONTINUO - PERFIL ACANALADO ESTRUCTURAL
                    </text>
                  </g>
                ) : selectedVistaTijeral === 'monitor' ? (
                  /* Techo Monitor con Linterna Cenital */
                  <g>
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    <line x1="60" y1="90" x2="190" y2="52" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="310" y1="52" x2="440" y2="90" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="190" y1="52" x2="190" y2="28" stroke="#8b5cf6" strokeWidth="2.5" />
                    <line x1="310" y1="52" x2="310" y2="28" stroke="#8b5cf6" strokeWidth="2.5" />
                    <line x1="180" y1="28" x2="250" y2="15" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="250" y1="15" x2="320" y2="28" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="190" y1="52" x2="190" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="310" y1="52" x2="310" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <text x="250" y="10" fill="#f59e0b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      TECHO CON MONITOR INDUSTRIAL - LOUVERS Y VENTILACIÓN CENITAL
                    </text>
                  </g>
                ) : selectedVistaTijeral === 'viga_warren' ? (
                  /* Viga Plana Warren (Joist) */
                  <g>
                    <line x1="60" y1="55" x2="440" y2="55" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    <line x1="60" y1="90" x2="105" y2="55" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="105" y1="55" x2="150" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="150" y1="90" x2="200" y2="55" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="200" y1="55" x2="250" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="250" y1="90" x2="300" y2="55" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="300" y1="55" x2="350" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="350" y1="90" x2="395" y2="55" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="395" y1="55" x2="440" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                  </g>
                ) : (selectedVistaTijeral as string) === 'tijeral_longitudinal' ? (
                  /* TIJERAL LONGITUDINAL (Warren / Pratt entre pórticos) */
                  <g>
                    <line x1="60" y1="45" x2="440" y2="45" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    {/* Montantes en ejes de columnas */}
                    <line x1="60" y1="45" x2="60" y2="90" stroke="#8b5cf6" strokeWidth="2.5" />
                    <line x1="155" y1="45" x2="155" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="250" y1="45" x2="250" y2="90" stroke="#8b5cf6" strokeWidth="2.5" />
                    <line x1="345" y1="45" x2="345" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="440" y1="45" x2="440" y2="90" stroke="#8b5cf6" strokeWidth="2.5" />
                    {/* Diagonales trianguladas Warren longitudinal */}
                    <line x1="60" y1="90" x2="155" y2="45" stroke="#06b6d4" strokeWidth="2" />
                    <line x1="155" y1="45" x2="250" y2="90" stroke="#06b6d4" strokeWidth="2" />
                    <line x1="250" y1="90" x2="345" y2="45" stroke="#06b6d4" strokeWidth="2" />
                    <line x1="345" y1="45" x2="440" y2="90" stroke="#06b6d4" strokeWidth="2" />
                    <text x="250" y="24" fill="#06b6d4" fontSize="8" fontWeight="bold" textAnchor="middle">
                      ELEVACIÓN TIJERAL LONGITUDINAL (ENTRE PÓRTICOS EJE 1-5)
                    </text>
                  </g>
                ) : (selectedVistaTijeral as string) === 'tijeral_perimetral' ? (
                  /* TIJERAL PERIMETRAL / TÍMPANO DE FACHADA */
                  <g>
                    {/* Solera inferior y dintel */}
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    <line x1="60" y1="90" x2="250" y2="35" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="250" y1="35" x2="440" y2="90" stroke="#f59e0b" strokeWidth="3" />
                    {/* Columnas y montantes de frontón perimetral */}
                    <line x1="250" y1="35" x2="250" y2="195" stroke="#1e293b" strokeWidth="2.5" />
                    <line x1="155" y1="62" x2="155" y2="195" stroke="#1e293b" strokeWidth="2" />
                    <line x1="345" y1="62" x2="345" y2="195" stroke="#1e293b" strokeWidth="2" />
                    {/* Diagonales perimetrales antivuelco */}
                    <line x1="60" y1="195" x2="155" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="155" y1="195" x2="60" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="345" y1="195" x2="440" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="440" y1="195" x2="345" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <text x="250" y="24" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">
                      TÍMPANO PERIMETRAL DE FACHADA Y ARRIOSTRAMIENTO FRONTAL
                    </text>
                  </g>
                ) : (
                  /* Techo a Dos Aguas Fink / Howe / Pratt */
                  <g>
                    <line x1="60" y1="90" x2="440" y2="90" stroke="#10b981" strokeWidth="3" />
                    <line x1="60" y1="90" x2="250" y2="35" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="250" y1="35" x2="440" y2="90" stroke="#f59e0b" strokeWidth="3" />
                    <line x1="250" y1="35" x2="250" y2="90" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="110" y1="75" x2="110" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="160" y1="61" x2="160" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="205" y1="48" x2="205" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="295" y1="48" x2="295" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="340" y1="61" x2="340" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="390" y1="75" x2="390" y2="90" stroke="#8b5cf6" strokeWidth="1.5" />
                    <line x1="60" y1="90" x2="110" y2="75" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="110" y1="90" x2="160" y2="61" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="160" y1="90" x2="205" y2="48" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="205" y1="90" x2="250" y2="35" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="250" y1="35" x2="295" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="295" y1="48" x2="340" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="340" y1="61" x2="390" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                    <line x1="390" y1="75" x2="440" y2="90" stroke="#06b6d4" strokeWidth="1.5" />
                  </g>
                )}

                {/* Cota de Luz Total */}
                <line x1="60" y1="105" x2="440" y2="105" stroke="#3b82f6" strokeWidth="1.5" />
                <line x1="60" y1="100" x2="60" y2="110" stroke="#3b82f6" strokeWidth="1.5" />
                <line x1="440" y1="100" x2="440" y2="110" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="250" y="118" fill="#1d4ed8" fontSize="9" fontWeight="bold" textAnchor="middle">LUZ TOTAL = 12.00 m</text>
              </svg>
            </div>
          )}

          {/* DETALLE 2: PLANO DE PLANTA ESTRUCTURAL DE TECHO */}
          {(activePlanoTab === 'ambos' || activePlanoTab === 'planta') && (
            <div className={`border border-slate-300 p-4 rounded-xl bg-slate-50/70 relative ${activePlanoTab === 'planta' ? 'lg:col-span-2' : ''}`}>
              <div className="text-[10px] font-black uppercase text-slate-800 mb-2 border-b border-slate-300 pb-1 flex items-center justify-between">
                <span>DETALLE 02: PLANTA ESTRUCTURAL DE TECHO Y CORREAS (ESC 1:75)</span>
                <span className="text-emerald-700 text-[9px] font-bold">LARGO = 20.00m • 5 PÓRTICOS</span>
              </div>

              <svg viewBox="0 0 500 250" className="w-full h-56 bg-white border border-slate-200 rounded-lg p-2">
                {/* Ejes de Pórticos Longitudinales 1, 2, 3, 4, 5 */}
                {[0, 1, 2, 3, 4].map((idx) => {
                  const xPos = 60 + idx * 85;
                  return (
                    <g key={idx}>
                      {/* Línea de eje */}
                      <line x1={xPos} y1="20" x2={xPos} y2="215" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5 3" />
                      {/* Burbuja de Eje */}
                      <circle cx={xPos} cy="15" r="7" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                      <text x={xPos} y="18" fill="#0f172a" fontSize="7.5" fontWeight="bold" textAnchor="middle">{idx + 1}</text>
                      
                      {/* Viga / Tijeral Transversal en Eje */}
                      <line x1={xPos} y1="40" x2={xPos} y2="190" stroke="#f59e0b" strokeWidth="3" />

                      {/* Columnas en extremos de eje */}
                      <rect x={xPos - 5} y="35" width="10" height="10" fill="#1e293b" stroke="#000" strokeWidth="0.5" />
                      <rect x={xPos - 5} y="185" width="10" height="10" fill="#1e293b" stroke="#000" strokeWidth="0.5" />
                    </g>
                  );
                })}

                {/* Ejes Transversales A y B */}
                <line x1="40" y1="40" x2="420" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5 3" />
                <circle cx="35" cy="40" r="7" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <text x="35" y="43" fill="#0f172a" fontSize="7.5" fontWeight="bold" textAnchor="middle">A</text>

                <line x1="40" y1="190" x2="420" y2="190" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5 3" />
                <circle cx="35" cy="190" r="7" fill="#ffffff" stroke="#0f172a" strokeWidth="1" />
                <text x="35" y="193" fill="#0f172a" fontSize="7.5" fontWeight="bold" textAnchor="middle">B</text>

                {/* Eje Central de Cumbrera */}
                <line x1="40" y1="115" x2="420" y2="115" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="425" y="118" fill="#ef4444" fontSize="7" fontWeight="bold">CUMBRERA</text>

                {/* Correas Longitudinales (C 4"x2"x2.0mm @ 0.85m) */}
                {[55, 70, 85, 100, 130, 145, 160, 175].map((yPurlin, pIdx) => (
                  <line key={pIdx} x1="60" y1={yPurlin} x2="400" y2={yPurlin} stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray={yPurlin === 115 ? 'none' : 'none'} />
                ))}

                {/* Arriostramiento en Cruz de San Andrés en los vanos extremos */}
                {/* Vano 1-2 */}
                <line x1="60" y1="40" x2="145" y2="115" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="145" y1="40" x2="60" y2="115" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="60" y1="115" x2="145" y2="190" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="145" y1="115" x2="60" y2="190" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />

                {/* Vano 4-5 */}
                <line x1="315" y1="40" x2="400" y2="115" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="400" y1="40" x2="315" y2="115" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="315" y1="115" x2="400" y2="190" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />
                <line x1="400" y1="115" x2="315" y2="190" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3 2" />

                {/* Cota Longitudinal Total */}
                <line x1="60" y1="210" x2="400" y2="210" stroke="#3b82f6" strokeWidth="1.5" />
                <line x1="60" y1="205" x2="60" y2="215" stroke="#3b82f6" strokeWidth="1.5" />
                <line x1="400" y1="205" x2="400" y2="215" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="230" y="222" fill="#1d4ed8" fontSize="9" fontWeight="bold" textAnchor="middle">LARGO TOTAL = 20.00 m (4 TRAMOS @ 5.00m)</text>

                {/* Cota Transversal de Ancho */}
                <line x1="415" y1="40" x2="415" y2="190" stroke="#3b82f6" strokeWidth="1.5" />
                <line x1="410" y1="40" x2="420" y2="40" stroke="#3b82f6" strokeWidth="1.5" />
                <line x1="410" y1="190" x2="420" y2="190" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="430" y="120" fill="#1d4ed8" fontSize="8" fontWeight="bold" transform="rotate(90 430 120)" textAnchor="middle">ANCHO = 12.00m</text>
              </svg>
            </div>
          )}

        </div>

        {/* DETALLE 3 Y ESPECIFICACIONES TÉCNICAS RNE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CUADRO DE PERFILES Y METRADOS */}
          <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/70 space-y-2 text-[10px]">
            <div className="font-black uppercase text-slate-800 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>CUADRO DE ELEMENTOS ESTRUCTURALES Y PERFILES</span>
              <span className="text-amber-700 font-bold">RNE E.090</span>
            </div>
            <div className="space-y-1 font-mono text-[9.5px]">
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold">• Columnas Principales (C-01):</span>
                <span className="text-slate-800">Tubo Cuadrado LAC 100x100x3.2mm</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold">• Cordones Superior/Inferior:</span>
                <span className="text-slate-800">Tubo Cuadrado LAC 50x50x2.0mm</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold">• Montantes / Celosía 90°:</span>
                <span className="text-slate-800">Tubo Cuadrado LAC 40x40x2.0mm</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-0.5">
                <span className="font-bold">• Correas de Techo (Girts):</span>
                <span className="text-slate-800">Perfil C 100x50x15x2.0mm @ 0.85m</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">• Arriostramiento y Cruces:</span>
                <span className="text-slate-800">Barra Redonda Lisa Ø 1/2" con Templadores</span>
              </div>
            </div>
          </div>

          {/* ESPECIFICACIONES TÉCNICAS RNE */}
          <div className="border border-slate-300 p-4 rounded-xl bg-slate-50/70 space-y-1.5 text-[10px]">
            <div className="font-black uppercase text-slate-800 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>NOTAS TÉCNICAS GENERALES DE CONSTRUCCIÓN</span>
              <span className="text-emerald-700 font-bold">NORMA RNE PERÚ</span>
            </div>
            <p>• <strong>ACERO:</strong> Perfiles tubulares ASTM A500 Grado B (Fy = 3200 kg/cm²) y perfiles C ASTM A36.</p>
            <p>• <strong>SOLDADURA:</strong> Electrodos AWS E-6011 (raíz) y AWS E-7018 (acabado) garganta mínima 4mm continua.</p>
            <p>• <strong>ANCLAJE:</strong> Placas base 200x200x9.5mm con 4 pernos J-Bolt 5/8" ASTM A307 empotrados 35cm.</p>
            <p>• <strong>COBERTURA:</strong> Aluzinc TR-4 0.40mm fijado con pernos autoperforantes 12-14x2" y arandelas de neopreno EPDM.</p>
            <p>• <strong>PINTURA:</strong> 2 manos anticorrosivo epóxico (2.0 mils) + 2 manos esmalte poliuretano.</p>
          </div>
        </div>

        {/* FIRMA Y CARTELA */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-bold gap-2 pt-2 border-t border-slate-200">
          <div>INNOVA CONTRATISTAS | INGENIERÍA ESTRUCTURAL & METÁLICA PERÚ</div>
          <div className="text-amber-700 font-black">DIBUJO CAD PARAMÉTRICO V3.5 - COMPATIBILIZADO RNE</div>
        </div>
      </div>
    </div>
  );
};

export default TechosPlanoCadView;

