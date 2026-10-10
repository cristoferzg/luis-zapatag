// Modal y Vista de Despiece Técnico de Taller con Optimización de Barras de 6.00m
import React, { useState } from 'react';
import { 
  Scissors, 
  Copy, 
  Check, 
  X, 
  Download, 
  AlertCircle
} from 'lucide-react';
import { PuertaVentanaDesign, DespieceResult } from './carpinteriaTypes';
import { generarDespiece } from './carpinteriaCalculations';

interface CarpinteriaDespieceModalProps {
  design: PuertaVentanaDesign;
  onClose: () => void;
}

export const CarpinteriaDespieceModal: React.FC<CarpinteriaDespieceModalProps> = ({
  design,
  onClose
}) => {
  const despiece: DespieceResult = generarDespiece(design);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'lista' | 'optimizacion'>('lista');

  const handleCopyText = () => {
    let text = `HOJA DE DESPIECE Y CORTE DE TALLER - INNOVA CONTRATISTAS\n`;
    text += `Elemento: ${design.nombre} (${design.anchoM.toFixed(2)}m x ${design.altoM.toFixed(2)}m)\n`;
    text += `Total piezas: ${despiece.totalPiezas} | Peso acero: ${despiece.pesoTotalAceroKg.toFixed(1)} kg | Barras 6m: ${despiece.barrasComerciales6m}\n\n`;
    text += `MARCA | DESCRIPCIÓN | PERFIL | CANT | LONG(mm) | CORTE INI | CORTE FIN | PESO(kg)\n`;
    text += `---------------------------------------------------------------------------------\n`;
    despiece.piezas.forEach(p => {
      text += `${p.marca.padEnd(6)} | ${p.descripcion.padEnd(25)} | ${p.perfilDimensiones.padEnd(16)} | ${p.cantidad.toString().padStart(4)} | ${p.longitudMm.toString().padStart(8)} | ${p.corteInicio.padEnd(9)} | ${p.corteFin.padEnd(9)} | ${p.pesoTotalKg.toFixed(1)}\n`;
    });
    
    text += `\nOPTIMIZACIÓN DE BARRAS DE 6.00m:\n`;
    despiece.optimizacionBarras.forEach(b => {
      text += `Barra #${b.barraIndex}: Usado ${b.longitudUsadaMm}mm (${b.porcentajeAprovechamiento}%) | Retazo ${b.retazoMm}mm | Cortes: ${b.piezas.map(c => `${c.marca}(${c.longitudMm}mm)`).join(', ')}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    let csv = 'Marca,Descripcion,Perfil,Cantidad,Longitud_mm,Longitud_m,Corte_Inicio,Corte_Fin,Peso_Unitario_kg,Peso_Total_kg\n';
    despiece.piezas.forEach(p => {
      csv += `"${p.marca}","${p.descripcion}","${p.perfilNombre}",${p.cantidad},${p.longitudMm},${p.longitudM},"${p.corteInicio}","${p.corteFin}",${p.pesoUnitarioKg.toFixed(2)},${p.pesoTotalKg.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Despiece_${design.nombre.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <span>Despiece de Taller y Lista de Corte</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-normal border border-indigo-500/30">
                  {despiece.totalPiezas} piezas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {design.nombre} — {design.anchoM.toFixed(2)} m × {design.altoM.toFixed(2)} m
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumen Métrico Rápido */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Barras de 6.00m</span>
              <strong className="text-indigo-900 font-mono text-base">{despiece.barrasComerciales6m} und</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Longitud Total Perfiles</span>
              <strong className="text-slate-800 font-mono text-base">{despiece.longitudTotalPerfilesM} m</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Peso Total Acero</span>
              <strong className="text-emerald-700 font-mono text-base">{despiece.pesoTotalAceroKg} kg</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Merma / Desperdicio</span>
              <strong className="text-amber-700 font-mono text-base">{despiece.desperdicioEstimadoPct}%</strong>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-indigo-200">
            <button
              onClick={() => setActiveTab('lista')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                activeTab === 'lista' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabla de Cortes
            </button>
            <button
              onClick={() => setActiveTab('optimizacion')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                activeTab === 'optimizacion' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aprovechamiento 6m ({despiece.barrasComerciales6m} barras)
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'lista' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono font-bold text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Marca</th>
                    <th className="p-3">Descripción de Pieza</th>
                    <th className="p-3">Perfil Utilizado</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3 text-right">Long. (mm)</th>
                    <th className="p-3 text-center">Corte Ini</th>
                    <th className="p-3 text-center">Corte Fin</th>
                    <th className="p-3 text-right">Peso (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {despiece.piezas.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200">
                          {p.marca}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {p.descripcion}
                      </td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {p.perfilDimensiones}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800 font-mono">
                        {p.cantidad}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 text-sm">
                        {p.longitudMm} mm
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.corteInicio === '45°' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.corteInicio}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.corteFin === '45°' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.corteFin}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-700">
                        {p.pesoTotalKg.toFixed(1)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Vista de Aprovechamiento y Nesting de Barras de 6m */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Plan de Corte en Taller para Barras de 6.00 m (6000 mm)</h4>
                  <p className="mt-0.5 text-amber-800">
                    Se calculan automáticamente los cortes requeridos minimizando desperdicios, con tolerancia de 3 mm por corte de disco sierra.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {despiece.optimizacionBarras.map(b => (
                  <div key={`barra-${b.barraIndex}`} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 font-mono">
                        Barra #{b.barraIndex} de 6.00m (6000 mm)
                      </span>
                      <div className="space-x-3 font-mono text-[11px]">
                        <span>Utilizado: <strong className="text-indigo-700">{b.longitudUsadaMm} mm ({b.porcentajeAprovechamiento}%)</strong></span>
                        <span>Retazo: <strong className="text-amber-700">{b.retazoMm} mm</strong></span>
                      </div>
                    </div>

                    {/* Barra visual gráfica */}
                    <div className="w-full h-8 bg-slate-200 rounded-xl overflow-hidden flex border border-slate-300">
                      {b.piezas.map((c, cIdx) => {
                        const pct = (c.longitudMm / 6000) * 100;
                        return (
                          <div
                            key={`c-${cIdx}`}
                            style={{ width: `${pct}%` }}
                            className="h-full bg-indigo-600 border-r border-indigo-400 flex items-center justify-center text-[10px] text-white font-mono font-bold truncate px-1"
                            title={`${c.marca}: ${c.longitudMm} mm`}
                          >
                            {c.marca} ({c.longitudMm})
                          </div>
                        );
                      })}
                      {/* Retazo sobrante */}
                      <div
                        style={{ width: `${(b.retazoMm / 6000) * 100}%` }}
                        className="h-full bg-amber-200/80 flex items-center justify-center text-[10px] text-amber-800 font-mono"
                        title={`Sobrante: ${b.retazoMm} mm`}
                      >
                        {b.retazoMm > 300 ? `Retazo ${b.retazoMm}mm` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pie de modal */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>* Despiece generado paramétricamente considerando holguras y tolerancias estándar de taller cerrajero.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarpinteriaDespieceModal;
