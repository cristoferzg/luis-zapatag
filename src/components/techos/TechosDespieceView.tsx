// Lista de Despiece y Optimización de Cortes 6m Exclusivo para Techos Metálicos
// Diseño amigable con la paleta y componentes de la plataforma
import React from 'react';
import { Scissors, Download, Box } from 'lucide-react';
import { FullTechosBomReport } from './techosCadEngineTypes';

interface TechosDespieceViewProps {
  design?: any;
  bomReport?: FullTechosBomReport;
}

export const TechosDespieceView: React.FC<TechosDespieceViewProps> = ({ design }) => {
  // Manejo flex de props
  const report: FullTechosBomReport | null = (design && design.despiecePerfiles) ? design : null;

  // Fallback para legacy design
  const luz = design?.luzM || 12;
  const largo = design?.largoM || 20;
  const numTij = design?.numTijerales || 5;
  const pend = design?.pendientePorcentaje || 20;
  const numCorreas = design?.numFilasCorreas || 7;
  const altCol = design?.alturaColumnasM || 4;

  const hTijeral = (luz / 2) * (pend / 100);
  const largoCaidaM = Math.sqrt(Math.pow(luz / 2, 2) + Math.pow(hTijeral, 2));

  const numCols = numTij * 2;
  const barrasCols6m = Math.ceil((numCols * altCol) / 6.0);

  const metrosCordonInf = numTij * luz;
  const barrasCordonInf6m = Math.ceil(metrosCordonInf / 6.0);

  const metrosCordonSup = numTij * (largoCaidaM * 2);
  const barrasCordonSup6m = Math.ceil(metrosCordonSup / 6.0);

  const totalMetrosCorreas = largo * (numCorreas * 2);
  const barrasCorreas6m = Math.ceil(totalMetrosCorreas / 6.0);

  const areaTechoM2 = (largoCaidaM * 2) * largo;
  const numPlanchasEstandar3m = Math.ceil(areaTechoM2 / (1.0 * 3.0));

  const handleExportarGuiaCortes = () => {
    let contenido = `INNOVA CONTRATISTAS - GUÍA DE CORTES DE PERFILERÍA Y ESTRUCTURAS (6.00m)\n`;
    contenido += `Fecha: ${new Date().toLocaleDateString('es-PE')}\n`;
    contenido += `=========================================================================\n\n`;

    if (report && report.despiecePerfiles && report.despiecePerfiles.length > 0) {
      report.despiecePerfiles.forEach((p) => {
        contenido += `PERFIL: ${p.nombrePerfil} (${p.codigoComercial})\n`;
        contenido += `Barras de 6.00m Requeridas: ${p.totalBarrasComerciales6m} barras\n`;
        contenido += `Metros Requeridos: ${p.totalMetrosRequeridosM.toFixed(2)}m | Peso Total: ${p.totalPesoAceroKg.toFixed(1)}kg\n`;
        contenido += `Eficiencia: ${p.eficienciaPromedioPorcentaje.toFixed(1)}% | Desperdicio: ${p.desperdicioTotalKg.toFixed(1)}kg\n`;
        contenido += `--- PATRONES DE CORTE ---\n`;
        p.patronesBarras.forEach((pat) => {
          contenido += `  Barra #${pat.indiceBarra}: `;
          const cortesTexto = pat.cortes.map(c => `${c.etiquetaPieza} (${c.longitudM.toFixed(2)}m)`).join(' + ');
          contenido += `${cortesTexto} | Sobra: ${pat.desperdicioSobraM.toFixed(2)}m\n`;
        });
        contenido += `\n`;
      });
    } else {
      contenido += `RESUMEN ESTIMADO:\n`;
      contenido += `- Columnas (${design?.perfilColumnas || 'Tubo Cuadrado 4"x4"'}): ${numCols} piezas de ${altCol.toFixed(2)}m -> ${barrasCols6m} barras 6m\n`;
      contenido += `- Cordones (${design?.perfilCordonSuperior || 'Tubo Rectangular 3"x2"'}): ${numTij * 2} tramos de ${largoCaidaM.toFixed(2)}m -> ${barrasCordonSup6m + barrasCordonInf6m} barras 6m\n`;
      contenido += `- Correas (${design?.perfilCorreas || 'Perfil C 4"x2"'}): ${numCorreas * 2} hileras de ${largo.toFixed(2)}m -> ${barrasCorreas6m} barras 6m\n`;
      contenido += `- Cobertura (${design?.tipoCobertura?.toUpperCase() || 'ALUZINC TR-4'}): Área ${areaTechoM2.toFixed(1)}m² -> ~${numPlanchasEstandar3m} planchas 3m\n`;
    }

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guia_cortes_techos_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    if (link && link.parentNode) {
      try {
        link.parentNode.removeChild(link);
      } catch (_e) {
        // ignore
      }
    }
    URL.revokeObjectURL(url);
  };

  if (report && report.despiecePerfiles) {
    return (
      <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
        {/* CABECERA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                <Scissors className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">OPTIMIZACIÓN DE CORTES (BARRAS 6.00m)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Despiece 1D automático generado directamente a partir de las barras y perfiles del modelo CAD.
            </p>
          </div>

          <button 
            onClick={handleExportarGuiaCortes}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Guía de Cortes (.txt)</span>
          </button>
        </div>

        {/* TABLA DE OPTIMIZACIÓN DE CORTES BARRAS 6M */}
        <div className="space-y-4">
          {report.despiecePerfiles.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-500 shadow-xs">
              <Box className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700">Sin piezas en el modelo CAD</p>
              <p className="text-xs text-slate-500 mt-1">Traza líneas o elementos en el lienzo CAD para generar el despiece automático.</p>
            </div>
          ) : (
            report.despiecePerfiles.map((p) => (
              <div key={p.profileId} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{p.nombrePerfil}</h3>
                    <span className="text-xs text-slate-500 font-mono">Código Comercial: {p.codigoComercial}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Barras Comerciales 6m:</span>
                    <span className="text-base sm:text-lg font-black text-amber-700">{p.totalBarrasComerciales6m} barras ({p.totalMetrosComprados6mM} m)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Metros Requeridos</span>
                    <span className="font-bold text-slate-800">{p.totalMetrosRequeridosM.toFixed(2)} m</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Peso Acero</span>
                    <span className="font-bold text-amber-700">{p.totalPesoAceroKg.toFixed(1)} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Eficiencia Promedio</span>
                    <span className="font-bold text-emerald-700">{p.eficienciaPromedioPorcentaje.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Desperdicio Estimado</span>
                    <span className="font-bold text-rose-600">{p.desperdicioTotalKg.toFixed(1)} kg</span>
                  </div>
                </div>

                {/* VISUALIZACIÓN DE PATRONES DE CORTE EN BARRAS */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Patrones de Corte por Barra (6.00m):</span>
                  <div className="space-y-1.5">
                    {p.patronesBarras.map((pat, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-800 font-bold min-w-[70px]">Barra #{pat.indiceBarra}:</span>
                        <div className="flex-1 flex items-center gap-1.5 mx-2 overflow-x-auto">
                          {pat.cortes.map((c, cIdx) => (
                            <span key={cIdx} className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-300 text-[10px] font-bold shadow-2xs whitespace-nowrap">
                              {c.etiquetaPieza}: {c.longitudM.toFixed(2)}m
                            </span>
                          ))}
                        </div>
                        <span className="text-slate-500 text-[10px] font-semibold shrink-0">Sobra: {pat.desperdicioSobraM.toFixed(2)}m ({pat.eficienciaPorcentaje.toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 text-slate-800 p-4 sm:p-6 overflow-y-auto space-y-6 font-sans select-none">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Scissors className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">OPTIMIZACIÓN DE CORTES (BARRAS DE 6.00m)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mapeo paramétrico de tubos, perfiles C/Z y tiras de cobertura para desperdicio mínimo.
          </p>
        </div>

        <button 
          onClick={handleExportarGuiaCortes}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>Exportar Guía de Cortes (.txt)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">1. Columnas de Apoyo</div>
            <div className="text-sm font-bold text-slate-900 mb-1">{design?.perfilColumnas || 'Tubo Cuadrado 4"x4"'}</div>
            <div className="text-xs text-slate-500 font-mono">
              {numCols} piezas x {altCol.toFixed(2)}m
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Total Barras 6m:</span>
            <span className="text-amber-700 font-extrabold text-base">{barrasCols6m} barras</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">2. Cordones de Tijerales</div>
            <div className="text-sm font-bold text-slate-900 mb-1">{design?.perfilCordonSuperior || 'Tubo Rectangular 3"x2"'}</div>
            <div className="text-xs text-slate-500 font-mono">
              {numTij * 2} tramos de {largoCaidaM.toFixed(2)}m
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Total Barras 6m:</span>
            <span className="text-amber-700 font-extrabold text-base">{barrasCordonSup6m + barrasCordonInf6m} barras</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">3. Correas Longitudinales</div>
            <div className="text-sm font-bold text-slate-900 mb-1">{design?.perfilCorreas || 'Perfil C 4"x2"'}</div>
            <div className="text-xs text-slate-500 font-mono">
              {numCorreas * 2} hileras x {largo.toFixed(2)}m
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Total Barras 6m:</span>
            <span className="text-amber-700 font-extrabold text-base">{barrasCorreas6m} barras</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">4. Planchas de Cobertura</div>
            <div className="text-sm font-bold text-slate-900 mb-1">{design?.tipoCobertura?.toUpperCase() || 'ALUZINC TR-4'}</div>
            <div className="text-xs text-slate-500 font-mono">
              Área total: {areaTechoM2.toFixed(1)} m²
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Planchas Estimadas (3m):</span>
            <span className="text-amber-700 font-extrabold text-base">{numPlanchasEstandar3m} unids.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechosDespieceView;
