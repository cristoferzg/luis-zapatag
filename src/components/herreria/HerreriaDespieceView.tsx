// Vista de Despiece y Lista de Corte con Optimización de Barras Comerciales
// Diseño claro, legible y compatible con dispositivos móviles
import React, { useState } from 'react';
import { 
  Scissors, 
  Sparkles, 
  Copy, 
  Check,
  Package
} from 'lucide-react';
import { HerreriaDesign, DespieceResult, BarraOptimizada } from './herreriaTypes';
import { generarDespiece, optimizarCortes } from './herreriaCalculations';

interface HerreriaDespieceViewProps {
  design: HerreriaDesign;
}

export const HerreriaDespieceView: React.FC<HerreriaDespieceViewProps> = ({ design }) => {
  const [longitudBarra, setLongitudBarra] = useState<number>(6); // 6m, 9m, 12m
  const [mostrarOptimizacion, setMostrarOptimizacion] = useState<boolean>(false);
  const [copiado, setCopiado] = useState(false);

  // Calcular despiece actual
  const despiece: DespieceResult = generarDespiece(design);
  const barrasOptimizadas: BarraOptimizada[] = optimizarCortes(despiece.piezas, longitudBarra);

  const totalBarras = barrasOptimizadas.length;
  const longitudTotalPiezas = despiece.longitudTotalPerfilesM;
  const longitudTotalComercial = totalBarras * longitudBarra;
  const desperdicioTotalPct = totalBarras > 0 
    ? Math.round(((longitudTotalComercial - longitudTotalPiezas) / Math.max(1, longitudTotalComercial)) * 1000) / 10 
    : 0;

  const handleCopiarDespiece = () => {
    if (despiece.piezas.length === 0) return;
    const texto = despiece.piezas.map(p => 
      `${p.marca}\t${p.descripcion}\t${p.perfilNombre}\t${p.longitudMm}mm\t${p.cantidad}\t${p.corteInicio}-${p.corteFin}\t${p.pesoTotalKg.toFixed(1)}kg`
    ).join('\n');
    navigator.clipboard.writeText(`LISTA DE CORTE: ${design.nombre}\nMarca\tDescripción\tPerfil\tLongitud\tCant\tCortes\tPeso\n` + texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 p-4 sm:p-6 overflow-y-auto text-slate-800 select-none">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-wide">
                LISTA DE CORTE Y DESPIECE TÉCNICO
              </h2>
              <p className="text-xs text-slate-500">
                {design.nombre} • Dimensiones: {design.anchoM.toFixed(2)}m × {design.altoM.toFixed(2)}m • {despiece.totalPiezas} piezas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Botón [ OPTIMIZAR CORTES ] */}
          <button
            onClick={() => setMostrarOptimizacion(!mostrarOptimizacion)}
            disabled={despiece.totalPiezas === 0}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              despiece.totalPiezas === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : (mostrarOptimizacion
                  ? 'bg-amber-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700')
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{mostrarOptimizacion ? 'VER TABLA DESPIECE' : 'OPTIMIZAR CORTES (1D)'}</span>
          </button>

          <button
            onClick={handleCopiarDespiece}
            disabled={despiece.totalPiezas === 0}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              despiece.totalPiezas === 0 
                ? 'bg-slate-100 text-slate-400 border-slate-200' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* Métricas Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Total de Piezas</span>
          <span className="text-xl font-mono font-bold text-slate-900">{despiece.totalPiezas} und</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Metros Lineales Perfiles</span>
          <span className="text-xl font-mono font-bold text-blue-600">{despiece.longitudTotalPerfilesM.toFixed(2)} m</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Peso Total Acero</span>
          <span className="text-xl font-mono font-bold text-amber-600">{despiece.pesoTotalAceroKg.toFixed(1)} kg</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Barras Comerciales {longitudBarra}m</span>
          <span className="text-xl font-mono font-bold text-emerald-600">{totalBarras} barras</span>
        </div>
      </div>

      {/* SI EL DESPIECE ESTÁ VACÍO */}
      {despiece.totalPiezas === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 text-center">
          <Package className="w-10 h-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">Aún no hay piezas en el diseño</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Ve a la pestaña <b>1. CAD 2D/3D</b> y dibuja perfiles metálicos, marcos o planchas. Aparecerán aquí con sus longitudes de corte a 45° y 90° calculadas al milímetro.
          </p>
        </div>
      ) : (
        /* VISTA 1: TABLA DE DESPIECE TRADICIONAL */
        !mostrarOptimizacion ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Marca</th>
                    <th className="py-3 px-3.5">Descripción</th>
                    <th className="py-3 px-3.5">Perfil y Sección</th>
                    <th className="py-3 px-3.5 text-right">Longitud</th>
                    <th className="py-3 px-3.5 text-center">Cant</th>
                    <th className="py-3 px-3.5 text-center">Cortes</th>
                    <th className="py-3 px-3.5 text-right">Peso Total</th>
                    <th className="py-3 px-3.5">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {despiece.piezas.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-bold text-blue-700">{p.marca}</td>
                      <td className="py-2.5 px-3.5 font-sans font-medium text-slate-900">{p.descripcion}</td>
                      <td className="py-2.5 px-3.5 text-slate-600">{p.perfilNombre}</td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">
                        {p.longitudMm} mm <span className="text-[10px] text-slate-400">({p.longitudM.toFixed(2)}m)</span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-slate-800 bg-slate-50">{p.cantidad}</td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                          {p.corteInicio} / {p.corteFin}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-amber-700 font-semibold">{p.pesoTotalKg.toFixed(2)} kg</td>
                      <td className="py-2.5 px-3.5 font-sans capitalize text-slate-500 text-[11px]">{p.ubicacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VISTA 2: OPTIMIZADOR DE CORTE 1D DE BARRAS */
          <div className="space-y-4 flex-1">
            {/* Selector de Barra Comercial */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold">Longitud de Barra Comercial:</span>
                {[6, 9, 12].map(l => (
                  <button
                    key={l}
                    onClick={() => setLongitudBarra(l)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      longitudBarra === l
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {l}.00 metros
                  </button>
                ))}
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[11px]">Desperdicio / Retazo Total: </span>
                <span className={`font-mono font-bold ${desperdicioTotalPct > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {desperdicioTotalPct}%
                </span>
              </div>
            </div>

            {/* Listado Gráfico de Barras Optimizadas */}
            <div className="space-y-3">
              {barrasOptimizadas.map((barra, bIdx) => {
                const anchoBarraTotalMm = longitudBarra * 1000;

                return (
                  <div key={bIdx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[11px]">
                          Barra #{barra.barraIndex}
                        </span>
                        <span className="font-bold text-slate-900">{barra.perfilNombre}</span>
                        <span className="text-slate-400 font-mono text-[11px]">({barra.longitudComercialM}m comercial)</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-slate-600">
                          Usado: <b className="text-blue-600">{(barra.longitudUsadaMm / 1000).toFixed(2)}m</b>
                        </span>
                        <span className="text-slate-600">
                          Sobrante: <b className="text-amber-600">{barra.sobranteMm}mm</b>
                        </span>
                        <span className="text-emerald-600 font-bold">
                          {barra.porcentajeAprovechamiento}% útil
                        </span>
                      </div>
                    </div>

                    {/* Representación Visual de los Cortes en la Barra */}
                    <div className="w-full h-8 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 flex">
                      {barra.piezas.map((corte, cIdx) => {
                        const pctWidth = (corte.longitudMm / anchoBarraTotalMm) * 100;
                        return (
                          <div
                            key={cIdx}
                            style={{ width: `${pctWidth}%` }}
                            className="h-full bg-blue-600 hover:bg-blue-700 border-r border-white flex items-center justify-center text-[10px] font-mono text-white font-bold px-1 overflow-hidden transition-colors cursor-pointer"
                            title={`${corte.marca}: ${corte.longitudMm}mm`}
                          >
                            <span className="truncate">{corte.marca} ({corte.longitudMm}mm)</span>
                          </div>
                        );
                      })}
                      {/* Sobrante / Retazo */}
                      {barra.sobranteMm > 0 && (
                        <div
                          style={{ width: `${(barra.sobranteMm / anchoBarraTotalMm) * 100}%` }}
                          className="h-full bg-amber-50 border-dashed border-l border-amber-300 flex items-center justify-center text-[10px] font-mono text-amber-700 font-semibold"
                          title={`Sobrante: ${barra.sobranteMm}mm`}
                        >
                          <span className="truncate">{barra.sobranteMm}mm retazo</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};
