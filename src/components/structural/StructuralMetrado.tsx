import React, { useState } from 'react';
import { 
  StructuralGeometry, 
  StructureOptions, 
  CoberturaOptions, 
  ConexionesOptions,
  ColumnElement, 
  BeamElement, 
  PurlinElement 
} from './structuralTypes';
import { getProfileById } from './structuralCatalog';
import { calculateRoofGeometry } from './structuralGenerator';
import { FileSpreadsheet, Download, Copy, Check, Droplets, ShieldCheck, Layers, Hammer } from 'lucide-react';

interface MetradoProps {
  geometria: StructuralGeometry;
  estructura?: StructureOptions;
  cobertura: CoberturaOptions;
  conexiones?: ConexionesOptions;
  columnas: ColumnElement[];
  vigas: BeamElement[];
  correas: PurlinElement[];
}

export const StructuralMetrado: React.FC<MetradoProps> = ({
  geometria,
  cobertura,
  columnas,
  vigas,
  correas
}) => {
  const [copied, setCopied] = useState(false);

  // Unit costs in PEN (S/.) editable by the contractor
  const [steelPricePerKg, setSteelPricePerKg] = useState<number>(8.50); // S/. per kg fabricado y pintado
  const [coveragePricePerM2, setCoveragePricePerM2] = useState<number>(
    (geometria.sistemaCobertura as any) === 'panel_termoacustico' || (geometria.sistemaCobertura as any) === 'termoacustico' || cobertura.tipo === 'Panel Termoacústico' ? 88.00 : 38.00
  );
  const [gutterPricePerM, setGutterPricePerM] = useState<number>(45.00); // S/. per m canaleta instalada
  const [downpipePricePerM, setDownpipePricePerM] = useState<number>(32.00); // S/. per m bajante instalado
  const [laborPricePerKg, setLaborPricePerKg] = useState<number>(3.50); // S/. per kg montaje en obra

  // 0. Compute Parametric Roof Geometry & Take-offs
  const roofGeo = calculateRoofGeometry(geometria);

  // 1. Columns
  let colTotalWeight = 0;
  let colTotalLength = 0;
  let colTotalPaintArea = 0;
  const colRows = columnas.map(c => {
    const prof = getProfileById(c.profileId);
    const len = c.altura;
    const weight = len * prof.weightKgM;
    const perimeterM = (2 * (prof.heightMm + prof.widthMm)) / 1000;
    const paintArea = len * perimeterM;
    colTotalWeight += weight;
    colTotalLength += len;
    colTotalPaintArea += paintArea;
    return {
      tag: c.tag,
      description: `Columna ${prof.name}`,
      profile: prof.name,
      material: c.material,
      length: len,
      qty: 1,
      unitWeight: prof.weightKgM,
      weight,
      paintArea
    };
  });

  // Group columns by profile
  const groupedColumns: Record<string, { profile: string; material: string; count: number; totalLen: number; totalWeight: number; paintArea: number }> = {};
  colRows.forEach(r => {
    const key = `${r.profile}_${r.material}`;
    if (!groupedColumns[key]) {
      groupedColumns[key] = { profile: r.profile, material: r.material, count: 0, totalLen: 0, totalWeight: 0, paintArea: 0 };
    }
    groupedColumns[key].count += 1;
    groupedColumns[key].totalLen += r.length;
    groupedColumns[key].totalWeight += r.weight;
    groupedColumns[key].paintArea += r.paintArea;
  });

  // 2. Beams & Trusses
  let beamTotalWeight = 0;
  let beamTotalLength = 0;
  let beamTotalPaintArea = 0;
  const groupedBeams: Record<string, { typeName: string; profile: string; material: string; count: number; totalLen: number; totalWeight: number; paintArea: number }> = {};

  vigas.forEach(b => {
    const prof = getProfileById(b.profileId);
    const len = Math.hypot(b.endNode.x - b.startNode.x, b.endNode.y - b.startNode.y, b.endNode.z - b.startNode.z);
    const weight = len * prof.weightKgM;
    const perimeterM = (2 * (prof.heightMm + prof.widthMm)) / 1000;
    const paintArea = len * perimeterM;

    beamTotalWeight += weight;
    beamTotalLength += len;
    beamTotalPaintArea += paintArea;

    const typeLabel = b.type === 'tijeral_cuerda' ? 'Tijeral (Cuerdas)' :
                     b.type === 'tijeral_diagonal' ? 'Tijeral (Diagonales)' :
                     b.type === 'tijeral_montante' ? 'Tijeral (Montantes)' :
                     b.type === 'arriostre' ? 'Arriostres / Tensores' : 'Vigas Principales / Amarre';

    const key = `${typeLabel}_${prof.name}_${b.material}`;
    if (!groupedBeams[key]) {
      groupedBeams[key] = { typeName: typeLabel, profile: prof.name, material: b.material, count: 0, totalLen: 0, totalWeight: 0, paintArea: 0 };
    }
    groupedBeams[key].count += 1;
    groupedBeams[key].totalLen += len;
    groupedBeams[key].totalWeight += weight;
    groupedBeams[key].paintArea += paintArea;
  });

  // 3. Purlins (Correas)
  let purlinTotalWeight = 0;
  let purlinTotalLength = 0;
  let purlinTotalPaintArea = 0;
  const groupedPurlins: Record<string, { profile: string; material: string; count: number; totalLen: number; totalWeight: number; paintArea: number }> = {};

  correas.forEach(p => {
    const prof = getProfileById(p.profileId);
    const len = Math.hypot(p.endNode.x - p.startNode.x, p.endNode.y - p.startNode.y, p.endNode.z - p.startNode.z);
    const weight = len * prof.weightKgM;
    const perimeterM = (2 * (prof.heightMm + prof.widthMm)) / 1000;
    const paintArea = len * perimeterM;

    purlinTotalWeight += weight;
    purlinTotalLength += len;
    purlinTotalPaintArea += paintArea;

    const key = `${prof.name}_${p.material}`;
    if (!groupedPurlins[key]) {
      groupedPurlins[key] = { profile: prof.name, material: p.material, count: 0, totalLen: 0, totalWeight: 0, paintArea: 0 };
    }
    groupedPurlins[key].count += 1;
    groupedPurlins[key].totalLen += len;
    groupedPurlins[key].totalWeight += weight;
    groupedPurlins[key].paintArea += paintArea;
  });

  // 4. Base Plates & Anchors
  const numBasePlates = columnas.filter(c => c.basePlate).length;
  const plateWeightEach = 0.3 * 0.3 * 0.012 * 7850; // 300x300x12mm ~ 8.48 kg each
  const totalBasePlatesWeight = numBasePlates * plateWeightEach;
  const numAnchorBolts = columnas.reduce((acc, c) => acc + (c.anchorBoltsCount || 0), 0);

  // 5. Total Steel Weight & Paint Area
  const totalSteelWeightKg = colTotalWeight + beamTotalWeight + purlinTotalWeight + totalBasePlatesWeight;
  const totalPaintAreaM2 = colTotalPaintArea + beamTotalPaintArea + purlinTotalPaintArea;

  // 6. Roof Coverage Take-off
  const totalRoofAreaM2 = roofGeo.areaCoberturaM2;
  const isTermoacustico = (geometria.sistemaCobertura as any) === 'panel_termoacustico' || (geometria.sistemaCobertura as any) === 'termoacustico' || cobertura.tipo === 'Panel Termoacústico';
  const coverageTitle = isTermoacustico
    ? `Panel Termoacústico ${(geometria.panelTermoacustico as any)?.aislamiento || (geometria.panelTermoacustico as any)?.tipoAislamiento || 'EPS'} ${geometria.panelTermoacustico?.espesorAislamientoMm || 50}mm`
    : `${(geometria.aluzinc as any)?.perfil || (geometria.aluzinc as any)?.tipo || cobertura.tipo || 'Aluzinc TR4'} e=${geometria.aluzinc?.calibre || cobertura.calibre || '0.35 mm'} (${geometria.aluzinc?.color || cobertura.color || 'Azul'})`;

  const sheetCountApprox = Math.ceil(totalRoofAreaM2 / (1.00 * 0.95)); // ~0.95m useful coverage width
  const totalScrewsCount = Math.ceil(totalRoofAreaM2 * 6); // 6 autoperforantes screws per m²

  // 7. Evacuación Pluvial Take-off
  const metrosCanaleta = roofGeo.metrosCanaleta;
  const cantGanchosCanaleta = roofGeo.tieneCanaleta ? Math.ceil(metrosCanaleta / 0.8) + 2 : 0;
  const cantBajantes = roofGeo.cantBajantes;
  const metrosBajantes = roofGeo.metrosBajantes;
  const cantCodos = cantBajantes * 2;

  // 8. Remates y Cierres
  const metrosCumbrera = roofGeo.metrosCumbrera;
  const metrosRematesLaterales = roofGeo.metrosRematesLaterales;
  const metrosBabetaMuro = geometria.tipoTecho === 'una_caida' ? geometria.largo : 0;
  const totalLinearRemates = metrosCumbrera + metrosRematesLaterales + metrosBabetaMuro;
  const cartuchosSikaflex = totalLinearRemates > 0 ? Math.ceil(totalLinearRemates / 6) : 0;

  // 9. Cost Calculations in Soles (PEN)
  const costSteel = totalSteelWeightKg * steelPricePerKg;
  const costRoofCoverage = totalRoofAreaM2 * coveragePricePerM2;
  const costPlumbingDrainage = (metrosCanaleta * gutterPricePerM) + (metrosBajantes * downpipePricePerM) + (cantGanchosCanaleta * 12);
  const costRematesScrews = (totalLinearRemates * 28) + (totalScrewsCount * 0.85) + (cartuchosSikaflex * 35);
  const costHardware = (numAnchorBolts * 25) + (numBasePlates * 45);
  const costLabor = totalSteelWeightKg * laborPricePerKg;

  const subtotalCost = costSteel + costRoofCoverage + costPlumbingDrainage + costRematesScrews + costHardware + costLabor;
  const igvTax = 0;
  const totalCost = subtotalCost;

  const exportCSV = () => {
    let csv = 'METRADO Y CÓMPUTO DE MATERIALES - TECHO METÁLICO\n';
    csv += `Proyecto: Dimensiones ${geometria.largo}m x ${geometria.ancho}m x ${geometria.altura}m | Tipo: ${geometria.tipoTecho.replace(/_/g, ' ')}\n`;
    csv += `Pendiente Real: ${roofGeo.pendienteRealPct.toFixed(1)}% | Cobertura: ${coverageTitle}\n\n`;
    csv += 'PARTIDA,DESCRIPCION,PERFIL / ESPECIFICACION,CANTIDAD,UNIDAD,LONGITUD TOTAL (m),PESO TOTAL (kg),PINTURA (m2)\n';

    Object.values(groupedColumns).forEach((c, idx) => {
      csv += `01.${idx + 1},Columna Estructural,${c.profile},${c.count},und,${c.totalLen.toFixed(2)},${c.totalWeight.toFixed(2)},${c.paintArea.toFixed(2)}\n`;
    });
    Object.values(groupedBeams).forEach((b, idx) => {
      csv += `02.${idx + 1},${b.typeName},${b.profile},${b.count},und,${b.totalLen.toFixed(2)},${b.totalWeight.toFixed(2)},${b.paintArea.toFixed(2)}\n`;
    });
    Object.values(groupedPurlins).forEach((p, idx) => {
      csv += `03.${idx + 1},Correas de Techo,${p.profile},${p.count},und,${p.totalLen.toFixed(2)},${p.totalWeight.toFixed(2)},${p.paintArea.toFixed(2)}\n`;
    });
    csv += `04.1,Placas Base 300x300x12mm,Placa A36,${numBasePlates},und,-,${totalBasePlatesWeight.toFixed(2)},${(numBasePlates * 0.18).toFixed(2)}\n`;
    csv += `04.2,Pernos de Anclaje 5/8" x 400mm,Varilla Roscada A307,${numAnchorBolts},und,${(numAnchorBolts * 0.4).toFixed(2)},${(numAnchorBolts * 1.2).toFixed(2)},-\n`;
    csv += `05.1,Cobertura Principal,${coverageTitle},${sheetCountApprox},planchas,${totalRoofAreaM2.toFixed(2)} m²,-,-\n`;
    csv += `05.2,Tornillos Autoperforantes con arandela EPDM,12-14 x 2 1/2",${totalScrewsCount},und,-,-,-\n`;
    if (roofGeo.tieneCanaleta) {
      csv += `06.1,Canaleta Pluvial Metálica Galvanizada e=1.2mm,Desarrollo 330mm,1,glb,${metrosCanaleta.toFixed(2)},-,-\n`;
      csv += `06.2,Soportes / Ganchos de Platina para Canaleta,Pletina 1 1/4" x 3/16",${cantGanchosCanaleta},und,-,-,-\n`;
      csv += `06.3,Bajantes Pluviales Ø4" con accesorios y codos,Tubo Ø4",${cantBajantes},und,${metrosBajantes.toFixed(2)},-,-\n`;
    }
    if (totalLinearRemates > 0) {
      csv += `07.1,Remates perimétricos / Cumbrera / Babeta,Aluzinc / Hoja doblada,1,glb,${totalLinearRemates.toFixed(2)},-,-\n`;
      csv += `07.2,Sellador de Poliuretano Sikaflex,Cartucho 300ml,${cartuchosSikaflex},und,-,-,-\n`;
    }
    csv += `\nRESUMEN PRESUPUESTO ESTIMADO (PEN):\n`;
    csv += `Acero Fabricado: S/. ${costSteel.toFixed(2)}\n`;
    csv += `Cobertura de Techo: S/. ${costRoofCoverage.toFixed(2)}\n`;
    csv += `Evacuación Pluvial: S/. ${costPlumbingDrainage.toFixed(2)}\n`;
    csv += `Remates y Fijaciones: S/. ${costRematesScrews.toFixed(2)}\n`;
    csv += `Conexiones y Placas: S/. ${costHardware.toFixed(2)}\n`;
    csv += `Mano de Obra Montaje: S/. ${costLabor.toFixed(2)}\n`;
    csv += `Subtotal: S/. ${subtotalCost.toFixed(2)}\n`;
    csv += `IGV (18%): S/. ${igvTax.toFixed(2)}\n`;
    csv += `TOTAL GENERAL: S/. ${totalCost.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Metrado_Techo_${geometria.tipoTecho}_${geometria.largo}x${geometria.ancho}m.csv`;
    link.click();
  };

  const copySummary = () => {
    const text = `METRADO RESUMEN - TECHO METÁLICO:
- Tipo de Techo: ${geometria.tipoTecho.replace(/_/g, ' ').toUpperCase()} (${geometria.largo}m x ${geometria.ancho}m)
- Pendiente Real: ${roofGeo.pendienteRealPct.toFixed(1)}% (H.Bajo=${roofGeo.alturaLadoBajo.toFixed(2)}m, H.Alto=${roofGeo.alturaLadoAlto.toFixed(2)}m)
- Peso Total de Acero: ${totalSteelWeightKg.toFixed(1)} kg (${(totalSteelWeightKg / 1000).toFixed(2)} ton)
- Área de Pintura Estructural: ${totalPaintAreaM2.toFixed(1)} m²
- Área de Cobertura: ${totalRoofAreaM2.toFixed(1)} m² (${sheetCountApprox} planchas útiles) - ${coverageTitle}
- Evacuación Pluvial: ${roofGeo.tieneCanaleta ? `${metrosCanaleta.toFixed(1)}m canaleta, ${cantBajantes} bajantes (${metrosBajantes.toFixed(1)}m)` : 'Sin canaleta'}
- Remates y Babetas: ${totalLinearRemates.toFixed(1)} m lineales (+ ${cartuchosSikaflex} cartuchos Sikaflex)
- Tornillos Autoperforantes: ${totalScrewsCount} unidades con arandela EPDM
- Presupuesto Estimado: S/. ${totalCost.toLocaleString('es-PE', { maximumFractionDigits: 0 })} PEN (Inc. IGV y montaje)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-slate-50 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Metrado y Cómputo de Materiales
            </h2>
            <p className="text-xs text-slate-500">
              Desglose de perfiles de acero, cobertura {isTermoacustico ? 'termoacústica' : 'Aluzinc'}, canaletas, bajantes y presupuesto referencial
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={copySummary}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado' : 'Copiar Resumen'}</span>
          </button>
          <button 
            onClick={exportCSV}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* 5 KEY KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center">
            <Hammer className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Peso Acero Total
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
            {totalSteelWeightKg.toLocaleString('es-PE', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{(totalSteelWeightKg / 1000).toFixed(2)} toneladas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center">
            <Layers className="w-3.5 h-3.5 mr-1 text-blue-500" />
            Área Pintura (2 manos)
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {totalPaintAreaM2.toFixed(1)} <span className="text-xs font-normal text-slate-500">m²</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Anticorrosivo + Esmalte</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            Cobertura Real
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {totalRoofAreaM2.toFixed(1)} <span className="text-xs font-normal text-slate-500">m²</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">~{sheetCountApprox} planchas útiles</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center">
            <Droplets className="w-3.5 h-3.5 mr-1 text-sky-500" />
            Evacuación Pluvial
          </div>
          <div className="text-2xl font-bold font-mono text-sky-600 mt-1">
            {metrosCanaleta.toFixed(1)} <span className="text-xs font-normal text-slate-500">m</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{cantBajantes} bajantes ({metrosBajantes.toFixed(1)}m)</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Presupuesto Estimado</div>
          <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
            S/. {totalCost.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Inc. IGV, montaje y materiales</div>
        </div>
      </div>

      {/* DETAILED TAKE-OFF TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
            Desglose Detallado de Partidas, Perfiles y Cobertura
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {geometria.tipoTecho.replace(/_/g, ' ').toUpperCase()} | Pendiente: {roofGeo.pendienteRealPct.toFixed(1)}%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-700 border-b border-slate-200 uppercase font-mono font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Ítem / Partida</th>
                <th className="py-3 px-4">Descripción del Elemento</th>
                <th className="py-3 px-4">Perfil / Especificación</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4 text-center">Cant.</th>
                <th className="py-3 px-4 text-right">Long. / Área</th>
                <th className="py-3 px-4 text-right">Peso (kg)</th>
                <th className="py-3 px-4 text-right">Pintura (m²)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {/* Columns */}
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td colSpan={8} className="py-2 px-4 text-[11px] text-blue-700 uppercase">
                  01. Columnas Principales
                </td>
              </tr>
              {Object.values(groupedColumns).map((c, idx) => (
                <tr key={`gcol-${idx}`} className="hover:bg-blue-50/30">
                  <td className="py-2.5 px-4 text-slate-400 font-mono">01.{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">Columna Estructural</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{c.profile}</td>
                  <td className="py-2.5 px-4 text-slate-500">{c.material}</td>
                  <td className="py-2.5 px-4 text-center font-bold">{c.count}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{c.totalLen.toFixed(2)} m</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{c.totalWeight.toFixed(1)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{c.paintArea.toFixed(1)}</td>
                </tr>
              ))}

              {/* Beams & Trusses */}
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td colSpan={8} className="py-2 px-4 text-[11px] text-blue-700 uppercase">
                  02. Vigas y Tijerales
                </td>
              </tr>
              {Object.values(groupedBeams).map((b, idx) => (
                <tr key={`gbeam-${idx}`} className="hover:bg-blue-50/30">
                  <td className="py-2.5 px-4 text-slate-400 font-mono">02.{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{b.typeName}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{b.profile}</td>
                  <td className="py-2.5 px-4 text-slate-500">{b.material}</td>
                  <td className="py-2.5 px-4 text-center font-bold">{b.count}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{b.totalLen.toFixed(2)} m</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{b.totalWeight.toFixed(1)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{b.paintArea.toFixed(1)}</td>
                </tr>
              ))}

              {/* Purlins */}
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td colSpan={8} className="py-2 px-4 text-[11px] text-blue-700 uppercase">
                  03. Correas de Techo (Costaneras)
                </td>
              </tr>
              {Object.values(groupedPurlins).map((p, idx) => (
                <tr key={`gpurl-${idx}`} className="hover:bg-blue-50/30">
                  <td className="py-2.5 px-4 text-slate-400 font-mono">03.{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">Correas longitudinales</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{p.profile}</td>
                  <td className="py-2.5 px-4 text-slate-500">{p.material}</td>
                  <td className="py-2.5 px-4 text-center font-bold">{p.count}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{p.totalLen.toFixed(2)} m</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{p.totalWeight.toFixed(1)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{p.paintArea.toFixed(1)}</td>
                </tr>
              ))}

              {/* Connections */}
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td colSpan={8} className="py-2 px-4 text-[11px] text-blue-700 uppercase">
                  04. Conexiones y Placas Base
                </td>
              </tr>
              <tr className="hover:bg-blue-50/30">
                <td className="py-2.5 px-4 text-slate-400 font-mono">04.1</td>
                <td className="py-2.5 px-4 font-semibold text-slate-800">Placas Base 300x300x12mm</td>
                <td className="py-2.5 px-4 font-mono text-slate-700">Placa A36 e=12mm</td>
                <td className="py-2.5 px-4 text-slate-500">A36</td>
                <td className="py-2.5 px-4 text-center font-bold">{numBasePlates}</td>
                <td className="py-2.5 px-4 text-right font-mono">-</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{totalBasePlatesWeight.toFixed(1)}</td>
                <td className="py-2.5 px-4 text-right font-mono">{(numBasePlates * 0.18).toFixed(1)}</td>
              </tr>
              <tr className="hover:bg-blue-50/30">
                <td className="py-2.5 px-4 text-slate-400 font-mono">04.2</td>
                <td className="py-2.5 px-4 font-semibold text-slate-800">Pernos de Anclaje 5/8" x 400mm L</td>
                <td className="py-2.5 px-4 font-mono text-slate-700">Varilla Roscada + Tuercas</td>
                <td className="py-2.5 px-4 text-slate-500">ASTM A307</td>
                <td className="py-2.5 px-4 text-center font-bold">{numAnchorBolts}</td>
                <td className="py-2.5 px-4 text-right font-mono">{(numAnchorBolts * 0.4).toFixed(1)} m</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">{(numAnchorBolts * 1.2).toFixed(1)}</td>
                <td className="py-2.5 px-4 text-right font-mono">-</td>
              </tr>

              {/* 05. Cobertura */}
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td colSpan={8} className="py-2 px-4 text-[11px] text-emerald-700 uppercase">
                  05. Cobertura y Fijaciones
                </td>
              </tr>
              <tr className="hover:bg-emerald-50/30">
                <td className="py-2.5 px-4 text-slate-400 font-mono">05.1</td>
                <td className="py-2.5 px-4 font-semibold text-slate-800">{coverageTitle}</td>
                <td className="py-2.5 px-4 font-mono text-slate-700">{isTermoacustico ? 'Panel Aislado' : 'Aluzinc prepintado'}</td>
                <td className="py-2.5 px-4 text-slate-500">{isTermoacustico ? 'Acero+Núcleo' : 'AZ-150'}</td>
                <td className="py-2.5 px-4 text-center font-bold">{sheetCountApprox} und</td>
                <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">{totalRoofAreaM2.toFixed(1)} m²</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
              </tr>
              <tr className="hover:bg-emerald-50/30">
                <td className="py-2.5 px-4 text-slate-400 font-mono">05.2</td>
                <td className="py-2.5 px-4 font-semibold text-slate-800">Pernos autoperforantes con arandela EPDM</td>
                <td className="py-2.5 px-4 font-mono text-slate-700">#12-14 x 2 1/2" zincado</td>
                <td className="py-2.5 px-4 text-slate-500">Acero Templado</td>
                <td className="py-2.5 px-4 text-center font-bold">{totalScrewsCount} und</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
              </tr>

              {/* 06. Evacuación Pluvial */}
              {roofGeo.tieneCanaleta && (
                <>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td colSpan={8} className="py-2 px-4 text-[11px] text-sky-700 uppercase">
                      06. Sistema de Evacuación Pluvial
                    </td>
                  </tr>
                  <tr className="hover:bg-sky-50/30">
                    <td className="py-2.5 px-4 text-slate-400 font-mono">06.1</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Canaleta Metálica Galvanizada e=1.2mm</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">Desarrollo 330/400mm</td>
                    <td className="py-2.5 px-4 text-slate-500">F°G° e=1.2mm</td>
                    <td className="py-2.5 px-4 text-center font-bold">1 glb</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-700">{metrosCanaleta.toFixed(1)} m</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                  </tr>
                  <tr className="hover:bg-sky-50/30">
                    <td className="py-2.5 px-4 text-slate-400 font-mono">06.2</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Ganchos / Soportes de Platina cada 0.80m</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">Platina 1 1/4" x 3/16"</td>
                    <td className="py-2.5 px-4 text-slate-500">Acero A36</td>
                    <td className="py-2.5 px-4 text-center font-bold">{cantGanchosCanaleta} und</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-2.5 px-4 text-right font-mono">{(cantGanchosCanaleta * 0.45).toFixed(1)}</td>
                    <td className="py-2.5 px-4 text-right font-mono">-</td>
                  </tr>
                  <tr className="hover:bg-sky-50/30">
                    <td className="py-2.5 px-4 text-slate-400 font-mono">06.3</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Bajantes Pluviales Ø4" con codos y abrazaderas</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">Tubo Ø4" + {cantCodos} codos</td>
                    <td className="py-2.5 px-4 text-slate-500">PVC SAP / F°G°</td>
                    <td className="py-2.5 px-4 text-center font-bold">{cantBajantes} bajantes</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-700">{metrosBajantes.toFixed(1)} m</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                  </tr>
                </>
              )}

              {/* 07. Remates y Sellado */}
              {totalLinearRemates > 0 && (
                <>
                  <tr className="bg-slate-50 font-bold text-slate-800">
                    <td colSpan={8} className="py-2 px-4 text-[11px] text-amber-700 uppercase">
                      07. Remates, Babetas y Sellado
                    </td>
                  </tr>
                  <tr className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-4 text-slate-400 font-mono">07.1</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Remates laterales, cumbreras o babetas de muro</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">Aluzinc doblado</td>
                    <td className="py-2.5 px-4 text-slate-500">Aluzinc 0.40mm</td>
                    <td className="py-2.5 px-4 text-center font-bold">1 glb</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700">{totalLinearRemates.toFixed(1)} m</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                  </tr>
                  <tr className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-4 text-slate-400 font-mono">07.2</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">Sellador de Poliuretano Sikaflex para babetas y juntas</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">Cartucho 300 ml</td>
                    <td className="py-2.5 px-4 text-slate-500">Poliuretano</td>
                    <td className="py-2.5 px-4 text-center font-bold">{cartuchosSikaflex} und</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                  </tr>
                </>
              )}

              {/* TOTAL ROW */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={4} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                  TOTALES GENERALES DE ACERO ESTRUCTURAL:
                </td>
                <td className="py-3 px-4 text-center">
                  {columnas.length + vigas.length + correas.length + numBasePlates} und
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {(colTotalLength + beamTotalLength + purlinTotalLength).toFixed(1)} m
                </td>
                <td className="py-3 px-4 text-right font-mono text-blue-700 text-sm">
                  {totalSteelWeightKg.toLocaleString('es-PE', { maximumFractionDigits: 1 })} kg
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm">
                  {totalPaintAreaM2.toFixed(1)} m²
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* BUDGET ESTIMATE CARD */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Costos Unitarios y Estimación Presupuestaria (Soles PEN)</span>
          <span className="text-[11px] text-slate-400 font-normal">Precios editables del mercado de construcción en Perú</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Acero Fabricado (S/./kg):</label>
            <input 
              type="number" 
              step="0.5" 
              value={steelPricePerKg} 
              onChange={e => setSteelPricePerKg(parseFloat(e.target.value) || 0)} 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cobertura Techo (S/./m²):</label>
            <input 
              type="number" 
              step="1" 
              value={coveragePricePerM2} 
              onChange={e => setCoveragePricePerM2(parseFloat(e.target.value) || 0)} 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Canaleta Pluvial (S/./m):</label>
            <input 
              type="number" 
              step="1" 
              value={gutterPricePerM} 
              onChange={e => setGutterPricePerM(parseFloat(e.target.value) || 0)} 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Bajante Pluvial (S/./m):</label>
            <input 
              type="number" 
              step="1" 
              value={downpipePricePerM} 
              onChange={e => setDownpipePricePerM(parseFloat(e.target.value) || 0)} 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Mano de Obra (S/./kg):</label>
            <input 
              type="number" 
              step="0.5" 
              value={laborPricePerKg} 
              onChange={e => setLaborPricePerKg(parseFloat(e.target.value) || 0)} 
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800"
            />
          </div>
        </div>

        {/* Breakdown Cost Summary */}
        <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs text-slate-600">
            <div>• Acero: <strong className="font-mono text-slate-800">S/. {costSteel.toFixed(2)}</strong></div>
            <div>• Cobertura: <strong className="font-mono text-slate-800">S/. {costRoofCoverage.toFixed(2)}</strong></div>
            <div>• Evacuación: <strong className="font-mono text-slate-800">S/. {costPlumbingDrainage.toFixed(2)}</strong></div>
            <div>• Remates y Sikaflex: <strong className="font-mono text-slate-800">S/. {costRematesScrews.toFixed(2)}</strong></div>
            <div>• Placas y Anclajes: <strong className="font-mono text-slate-800">S/. {costHardware.toFixed(2)}</strong></div>
            <div>• Montaje y Equipos: <strong className="font-mono text-slate-800">S/. {costLabor.toFixed(2)}</strong></div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between md:space-x-6 shrink-0">
            <div>
              <div className="text-[11px] font-bold text-indigo-700 uppercase">Costo Total de Obra (Inc. IGV)</div>
              <div className="text-2xl font-black font-mono text-indigo-950">
                S/. {totalCost.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
