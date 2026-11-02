import BotonImprimir from '../common/BotonImprimir';
import React, { useRef, useState } from 'react';
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
import { safeStorage } from '../../lib/storageManager';
import { 
  FileSpreadsheet, 
  Send, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign 
} from 'lucide-react';

interface PresupuestoProps {
  geometria: StructuralGeometry;
  estructura: StructureOptions;
  cobertura: CoberturaOptions;
  conexiones: ConexionesOptions;
  columnas: ColumnElement[];
  vigas: BeamElement[];
  correas: PurlinElement[];
  projectName?: string;
  onGoToProjects?: () => void;
  currentSettings?: any;
}

export interface PresupuestoItem {
  itemCode: string;
  categoria: 'COLUMNAS' | 'VIGAS' | 'TIJERALES' | 'CORREAS' | 'COBERTURA' | 'EVACUACION' | 'REMATES' | 'MONTAJE';
  descripcion: string;
  unidad: string;
  metrado: number;
  material: string;
  precioUnitario: number;
  manoObraUnitario: number;
  subtotal: number;
  observaciones: string;
}

export const StructuralPresupuesto: React.FC<PresupuestoProps> = ({
  geometria,
  estructura,
  cobertura,
  conexiones,
  columnas,
  vigas,
  correas,
  projectName = 'Techo Metálico Estructural',
  onGoToProjects,
  currentSettings
}) => {
  const [copied, setCopied] = useState(false);
  const [showSendSuccessModal, setShowSendSuccessModal] = useState(false);
  const [clientName, setClientName] = useState('Cliente Particular');

  // Editable Unit Costs (PEN - Soles)
  const [steelPricePerKg, setSteelPricePerKg] = useState<number>(8.50);
  const [coveragePricePerM2, setCoveragePricePerM2] = useState<number>(
    (geometria.sistemaCobertura as any) === 'panel_termoacustico' || (geometria.sistemaCobertura as any) === 'termoacustico' || cobertura.tipo === 'Panel Termoacústico' ? 88.00 : 38.00
  );
  const [gutterPricePerM, setGutterPricePerM] = useState<number>(45.00);
  const [downpipePricePerM, setDownpipePricePerM] = useState<number>(32.00);
  const [laborPricePerKg, setLaborPricePerKg] = useState<number>(3.50);

  // Geometric Calculations
  const roofGeo = calculateRoofGeometry(geometria);

  // 1. Columns calculation
  let colTotalWeight = 0;
  let colTotalLen = 0;
  columnas.forEach(c => {
    const prof = getProfileById(c.profileId);
    colTotalWeight += c.altura * prof.weightKgM;
    colTotalLen += c.altura;
  });

  // 2. Beams & Trusses calculation
  let beamTotalWeight = 0;
  let beamTotalLen = 0;
  let trussTotalWeight = 0;
  let trussTotalLen = 0;

  vigas.forEach(b => {
    const prof = getProfileById(b.profileId);
    const len = Math.hypot(b.endNode.x - b.startNode.x, b.endNode.y - b.startNode.y, b.endNode.z - b.startNode.z);
    const w = len * prof.weightKgM;
    if (b.type.startsWith('tijeral')) {
      trussTotalWeight += w;
      trussTotalLen += len;
    } else {
      beamTotalWeight += w;
      beamTotalLen += len;
    }
  });

  // 3. Purlins calculation
  let purlinTotalWeight = 0;
  let purlinTotalLen = 0;
  correas.forEach(p => {
    const prof = getProfileById(p.profileId);
    const len = Math.hypot(p.endNode.x - p.startNode.x, p.endNode.y - p.startNode.y, p.endNode.z - p.startNode.z);
    purlinTotalWeight += len * prof.weightKgM;
    purlinTotalLen += len;
  });

  // 4. Base plates and hardware
  const numBasePlates = columnas.filter(c => c.basePlate).length;
  const plateWeightTotal = numBasePlates * 8.5; // ~8.5 kg per plate 250x250x12mm
  const numBolts = columnas.reduce((acc, c) => acc + (c.anchorBoltsCount || 4), 0);

  const totalSteelWeightKg = colTotalWeight + beamTotalWeight + trussTotalWeight + purlinTotalWeight + plateWeightTotal;

  // 5. Drainage & Gutter
  const gutterM = roofGeo.metrosCanaleta || 0;
  const downpipeM = roofGeo.metrosBajantes || 0;
  const areaTechoM2 = roofGeo.areaCoberturaM2 || (geometria.largo * geometria.ancho);

  // Build items array matching requirement:
  // Descripción, Unidad, Cantidad, Metrado, Material, Precio unitario, Subtotal, Mano de obra, Observaciones
  const items: PresupuestoItem[] = [
    {
      itemCode: '01.01',
      categoria: 'COLUMNAS',
      descripcion: `Columnas estructurales (${columnas.length} unidades, h=${(colTotalLen / (columnas.length || 1)).toFixed(2)}m)`,
      unidad: 'kg',
      metrado: parseFloat(colTotalWeight.toFixed(1)),
      material: columnas[0]?.material || 'ASTM A500 Gr. B',
      precioUnitario: steelPricePerKg,
      manoObraUnitario: laborPricePerKg,
      subtotal: parseFloat((colTotalWeight * (steelPricePerKg + laborPricePerKg)).toFixed(2)),
      observaciones: 'Incluye corte, armado, biselado y pintura anticorrosiva'
    },
    {
      itemCode: '01.02',
      categoria: 'VIGAS',
      descripcion: `Vigas principales y de amarre perimetral (${beamTotalLen.toFixed(1)} m lineales)`,
      unidad: 'kg',
      metrado: parseFloat(beamTotalWeight.toFixed(1)),
      material: vigas[0]?.material || 'ASTM A500 Gr. B',
      precioUnitario: steelPricePerKg,
      manoObraUnitario: laborPricePerKg,
      subtotal: parseFloat((beamTotalWeight * (steelPricePerKg + laborPricePerKg)).toFixed(2)),
      observaciones: 'Vigas perimetrales y pórticos principales de arriostre'
    }
  ];

  if (trussTotalWeight > 0) {
    items.push({
      itemCode: '01.03',
      categoria: 'TIJERALES',
      descripcion: `Tijerales metálicos reticulados (${trussTotalLen.toFixed(1)} m cordones/montantes)`,
      unidad: 'kg',
      metrado: parseFloat(trussTotalWeight.toFixed(1)),
      material: 'ASTM A36 / A500',
      precioUnitario: steelPricePerKg + 0.5,
      manoObraUnitario: laborPricePerKg + 1.0,
      subtotal: parseFloat((trussTotalWeight * (steelPricePerKg + 0.5 + laborPricePerKg + 1.0)).toFixed(2)),
      observaciones: 'Armado reticulado con cordones superior, inferior y diagonales'
    });
  }

  items.push({
    itemCode: '01.04',
    categoria: 'CORREAS',
    descripcion: `Correas de techo tipo Costanera (${correas.length} unidades, ${purlinTotalLen.toFixed(1)} m)`,
    unidad: 'kg',
    metrado: parseFloat(purlinTotalWeight.toFixed(1)),
    material: 'Perfil C Galvanizado / A36',
    precioUnitario: steelPricePerKg,
    manoObraUnitario: laborPricePerKg,
    subtotal: parseFloat((purlinTotalWeight * (steelPricePerKg + laborPricePerKg)).toFixed(2)),
    observaciones: `Separación calculada a ${(estructura.separacionCorreas || 1.0).toFixed(2)} m`
  });

  if (numBasePlates > 0) {
    items.push({
      itemCode: '01.05',
      categoria: 'COLUMNAS',
      descripcion: `Placas base e=${conexiones.espesorPlacaMm || 12}mm y pernos anclaje Ø${conexiones.diametroPernoPulg || '5/8'}" (${numBolts} pernos)`,
      unidad: 'und',
      metrado: numBasePlates,
      material: 'Plancha A36 + Pernos Grado 5',
      precioUnitario: 85.00,
      manoObraUnitario: 25.00,
      subtotal: parseFloat((numBasePlates * 110.00).toFixed(2)),
      observaciones: 'Con cartelas de refuerzo rigidizadoras y tuercas dobles'
    });
  }

  items.push({
    itemCode: '02.01',
    categoria: 'COBERTURA',
    descripcion: `Suministro e instalación de cobertura ${cobertura.tipo} (${cobertura.calibre})`,
    unidad: 'm2',
    metrado: parseFloat(areaTechoM2.toFixed(2)),
    material: `${cobertura.tipo} prepintado color ${cobertura.color || 'Azul'}`,
    precioUnitario: coveragePricePerM2,
    manoObraUnitario: 12.00,
    subtotal: parseFloat((areaTechoM2 * (coveragePricePerM2 + 12.00)).toFixed(2)),
    observaciones: 'Incluye tornillos autorroscantes con arandela de neopreno'
  });

  if (gutterM > 0) {
    items.push({
      itemCode: '03.01',
      categoria: 'EVACUACION',
      descripcion: `Canaleta pluvial perimetral desarrollo 330mm (${gutterM.toFixed(1)} m)`,
      unidad: 'm',
      metrado: parseFloat(gutterM.toFixed(1)),
      material: 'Aluzinc prepintado / F°G° e=0.50mm',
      precioUnitario: gutterPricePerM,
      manoObraUnitario: 10.00,
      subtotal: parseFloat((gutterM * (gutterPricePerM + 10.00)).toFixed(2)),
      observaciones: 'Con soportes platinados cada 0.80m y sellador poliuretánico'
    });
  }

  if (downpipeM > 0) {
    items.push({
      itemCode: '03.02',
      categoria: 'EVACUACION',
      descripcion: `Bajantes pluviales de evacuación Ø${geometria.evacuacion?.bajantesDiametroPulg || '4'}" (${downpipeM.toFixed(1)} m)`,
      unidad: 'm',
      metrado: parseFloat(downpipeM.toFixed(1)),
      material: 'Tubería PVC SAP / Acero',
      precioUnitario: downpipePricePerM,
      manoObraUnitario: 8.00,
      subtotal: parseFloat((downpipeM * (downpipePricePerM + 8.00)).toFixed(2)),
      observaciones: `Abrazaderas cada 1.50m hacia piso o buzón de desagüe`
    });
  }

  items.push({
    itemCode: '04.01',
    categoria: 'MONTAJE',
    descripcion: 'Montaje en obra, izaje de pórticos, soldadura AWS y pruebas de estanqueidad',
    unidad: 'glb',
    metrado: 1,
    material: 'Equipos, andamios, soldadura E7018',
    precioUnitario: 800.00,
    manoObraUnitario: parseFloat((totalSteelWeightKg * 1.5).toFixed(2)),
    subtotal: parseFloat((800.00 + totalSteelWeightKg * 1.5).toFixed(2)),
    observaciones: 'Seguridad industrial, EPP normado y protocolos de altura'
  });

  // Calculate totals
  const subtotalMateriales = items.reduce((sum, item) => sum + (item.metrado * item.precioUnitario), 0);
  const subtotalManoObra = items.reduce((sum, item) => sum + (item.metrado * item.manoObraUnitario), 0);
  const totalCostoDirecto = subtotalMateriales + subtotalManoObra;
  const gastosGenerales = totalCostoDirecto * 0.10;
  const utilidad = totalCostoDirecto * 0.10;
  const subtotalNeto = totalCostoDirecto + gastosGenerales + utilidad;
  const igv = 0;
  const totalPresupuestoPEN = subtotalNeto;

  // [ ENVIAR AL PRESUPUESTO ] Handler
  const handleEnviarAlPresupuesto = () => {
    try {
      const existingProjects = safeStorage.getItem<any[]>('projects', []);

      const newProjectId = `proj-tech-${Date.now()}`;
      const newProjectData = {
        id: newProjectId,
        name: `${projectName} (${areaTechoM2.toFixed(1)} m²)`,
        client: clientName,
        status: 'Pendiente',
        presupuesto: Math.round(totalPresupuestoPEN),
        date: new Date().toISOString().split('T')[0],
        plazoEstimado: '15 a 25 días hábiles',
        detallesContrato: `Estructura Metálica para Techo de ${areaTechoM2.toFixed(1)} m². Peso estimado de acero: ${totalSteelWeightKg.toFixed(1)} kg. Cobertura: ${cobertura.tipo}.`,
        materiales: items.map((it, idx) => ({
          id: `mat-${idx}-${Date.now()}`,
          name: it.descripcion,
          quantity: it.metrado,
          unit: it.unidad,
          unitPrice: it.precioUnitario + it.manoObraUnitario,
          category: it.categoria
        }))
      };

      const updatedProjects = [newProjectData, ...(Array.isArray(existingProjects) ? existingProjects : [])];
      safeStorage.setItem('projects', updatedProjects);
      window.dispatchEvent(new Event('storage'));

      setShowSendSuccessModal(true);
    } catch (err) {
      console.error('Error al guardar presupuesto en proyectos:', err);
      alert('Presupuesto preparado y copiado al portapapeles.');
    }
  };

  const copyToClipboard = () => {
    const text = `=====================================================
PRESUPUESTO TÉCNICO - INNOVA CONTRATISTAS
Proyecto: ${projectName}
Cliente: ${clientName}
Área Techada: ${areaTechoM2.toFixed(2)} m²
Peso de Acero: ${totalSteelWeightKg.toFixed(1)} kg
Fecha: ${new Date().toLocaleDateString('es-PE')}
=====================================================

DESGLOSE DE PARTIDAS:
${items.map(it => `${it.itemCode} | ${it.descripcion}
   Metrado: ${it.metrado} ${it.unidad} | Subtotal: S/. ${it.subtotal.toFixed(2)}`).join('\n\n')}

-----------------------------------------------------
SUBTOTAL COSTO DIRECTO: S/. ${totalCostoDirecto.toFixed(2)}
GASTOS GENERALES (10%): S/. ${gastosGenerales.toFixed(2)}
UTILIDAD (10%): S/. ${utilidad.toFixed(2)}
IGV (18%): S/. ${igv.toFixed(2)}
=====================================================
TOTAL PRESUPUESTO ESTIMADO: S/. ${totalPresupuestoPEN.toFixed(2)} PEN
=====================================================`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const hojaRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={hojaRef} className="flex-1 w-full h-full bg-slate-50 overflow-y-auto p-4 md:p-6 space-y-6 select-text">
      {/* 1. CABECERA PRINCIPAL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
            📊
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                PRESUPUESTO COMERCIAL
              </span>
              <span className="text-xs text-slate-400 font-medium">{currentSettings?.appName || 'Innova Contratistas'}</span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
              {projectName}
            </h2>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
              <span>Cliente:</span>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                className="font-medium text-slate-700 bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 outline-none px-1 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
              <span>📐 Área: <strong className="text-slate-800 font-bold">{areaTechoM2.toFixed(1)} m²</strong></span>
              <span>•</span>
              <span>⚖️ Acero: <strong className="text-slate-800 font-bold">{totalSteelWeightKg.toFixed(1)} kg</strong></span>
              <span>•</span>
              <span>🛡️ Cobertura: <strong className="text-slate-800 font-bold">{cobertura.tipo}</strong></span>
            </div>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto no-imprimir">
          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
          </button>

          {/* Print Button */}
          <BotonImprimir objetivo={() => hojaRef.current} titulo="Presupuesto estructural" etiqueta="Imprimir"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200" />

          {/* [ ENVIAR AL PRESUPUESTO ] PRIMARY BUTTON */}
          <button
            onClick={handleEnviarAlPresupuesto}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-95"
            title="Transferir este metrado y presupuesto al módulo central de proyectos"
          >
            <Send className="w-4 h-4" />
            <span>ENVIAR AL PRESUPUESTO</span>
          </button>
        </div>
      </div>

      {/* 2. COST KPIS BANNER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Acero Fabricado</span>
          <p className="text-xl md:text-2xl font-black font-mono text-blue-700 mt-1">
            S/. {(totalSteelWeightKg * steelPricePerKg).toLocaleString('es-PE', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{totalSteelWeightKg.toFixed(1)} kg @ S/. {steelPricePerKg.toFixed(2)}/kg</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cobertura de Techo</span>
          <p className="text-xl md:text-2xl font-black font-mono text-indigo-700 mt-1">
            S/. {(areaTechoM2 * coveragePricePerM2).toLocaleString('es-PE', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{areaTechoM2.toFixed(1)} m² @ S/. {coveragePricePerM2.toFixed(2)}/m²</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mano de Obra / Montaje</span>
          <p className="text-xl md:text-2xl font-black font-mono text-amber-700 mt-1">
            S/. {subtotalManoObra.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Armado, corte, soldadura e izaje</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-2xl p-4 shadow-md">
          <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">Total Presupuesto (Inc. IGV)</span>
          <p className="text-xl md:text-2xl font-black font-mono text-white mt-1">
            S/. {totalPresupuestoPEN.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-200 mt-0.5 block">Precio llave en mano garantizado</span>
        </div>
      </div>

      {/* 3. EDITABLE UNIT COSTS STRIP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center">
            <DollarSign className="w-3.5 h-3.5 text-blue-600 mr-1" />
            Configurar Costos Unitarios de Mercado
          </span>
          <span className="text-[11px] text-slate-400 font-normal">Modifica los valores para recalcular el presupuesto al instante</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Acero (S/./kg):</label>
            <input
              type="number"
              step="0.5"
              value={steelPricePerKg}
              onChange={e => setSteelPricePerKg(parseFloat(e.target.value) || 0)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Cobertura (S/./m²):</label>
            <input
              type="number"
              step="1"
              value={coveragePricePerM2}
              onChange={e => setCoveragePricePerM2(parseFloat(e.target.value) || 0)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Mano de Obra (S/./kg):</label>
            <input
              type="number"
              step="0.5"
              value={laborPricePerKg}
              onChange={e => setLaborPricePerKg(parseFloat(e.target.value) || 0)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Canaleta (S/./m):</label>
            <input
              type="number"
              step="1"
              value={gutterPricePerM}
              onChange={e => setGutterPricePerM(parseFloat(e.target.value) || 0)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Bajante (S/./m):</label>
            <input
              type="number"
              step="1"
              value={downpipePricePerM}
              onChange={e => setDownpipePricePerM(parseFloat(e.target.value) || 0)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* 4. TABLA DETALLADA DE PARTIDAS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
              DESGLOSE TÉCNICO DE PARTIDAS Y METRADOS
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {items.length} partidas presupuestadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-16 text-center">Ítem</th>
                <th className="py-3 px-3">Descripción de Partida</th>
                <th className="py-3 px-2 text-center w-16">Und</th>
                <th className="py-3 px-3 text-right w-24">Metrado</th>
                <th className="py-3 px-3">Material</th>
                <th className="py-3 px-3 text-right w-24">M.O. (S/.)</th>
                <th className="py-3 px-3 text-right w-24">P.U. (S/.)</th>
                <th className="py-3 px-3 text-right w-28">Subtotal (S/.)</th>
                <th className="py-3 px-3 hidden md:table-cell">Observaciones Técnicas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((it) => (
                <tr key={it.itemCode} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-500 text-center text-[11px]">
                    {it.itemCode}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {it.descripcion}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-600">
                    {it.unidad}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {it.metrado.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-medium border border-slate-200">
                      {it.material}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    S/. {it.manoObraUnitario.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    S/. {it.precioUnitario.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    S/. {it.subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] hidden md:table-cell leading-snug">
                    {it.observaciones}
                  </td>
                </tr>
              ))}

              {/* TOTAL RESUMEN ROW */}
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <td colSpan={7} className="py-3 px-4 text-right uppercase tracking-wider text-xs">
                  Costo Directo Total:
                </td>
                <td className="py-3 px-3 text-right font-mono text-base font-black text-blue-700">
                  S/. {totalCostoDirecto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="hidden md:table-cell"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. FINISHING SUMMARY AND CONTRACT DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1.5" />
            Condiciones Comerciales y Garantía
          </h4>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Garantía estructural de 5 años por defectos de soldadura y anclaje.</li>
            <li>Cobertura Aluzinc con garantía anticorrosiva de fábrica.</li>
            <li>Pintura anticorrosiva base zinc cromato + esmalte epóxico de acabado.</li>
            <li>Plazo estimado de entrega y montaje: 15 a 25 días hábiles.</li>
            <li>Forma de pago: 50% adelanto, 40% contra entrega de estructura, 10% conformidad.</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2 text-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
            <span>Liquidación Presupuestal</span>
            <span className="font-mono text-slate-400">PEN Soles</span>
          </h4>
          <div className="divide-y divide-slate-100 text-slate-600 pt-1">
            <div className="py-1.5 flex justify-between">
              <span>Costo Directo (Materiales + Mano de obra):</span>
              <strong className="font-mono text-slate-800">S/. {totalCostoDirecto.toFixed(2)}</strong>
            </div>
            <div className="py-1.5 flex justify-between">
              <span>Gastos Generales (10%):</span>
              <strong className="font-mono text-slate-800">S/. {gastosGenerales.toFixed(2)}</strong>
            </div>
            <div className="py-1.5 flex justify-between">
              <span>Utilidad de Empresa (10%):</span>
              <strong className="font-mono text-slate-800">S/. {utilidad.toFixed(2)}</strong>
            </div>
            <div className="py-1.5 flex justify-between">
              <span>Subtotal Neto:</span>
              <strong className="font-mono text-slate-800">S/. {subtotalNeto.toFixed(2)}</strong>
            </div>
            <div className="py-1.5 flex justify-between">
              <span>Impuesto General a las Ventas (IGV 18%):</span>
              <strong className="font-mono text-slate-800">S/. {igv.toFixed(2)}</strong>
            </div>
            <div className="py-2 flex justify-between items-center text-sm font-black text-slate-900 border-t-2 border-slate-300">
              <span className="uppercase text-blue-900">PRESUPUESTO TOTAL:</span>
              <span className="font-mono text-lg text-emerald-700">
                S/. {totalPresupuestoPEN.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: SUCCESS CONFIRMATION AFTER [ ENVIAR AL PRESUPUESTO ] */}
      {showSendSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
              ✓
            </div>
            <h3 className="text-lg font-black text-slate-900">
              ¡Presupuesto Enviado Exitosamente!
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              El diseño de techo metálico ha sido transferido e integrado al sistema de proyectos de <strong>{currentSettings?.appName || 'Innova Contratistas'}</strong> con un monto total de <strong>S/. {totalPresupuestoPEN.toLocaleString('es-PE', { maximumFractionDigits: 2 })} PEN</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs space-y-1">
              <div>• <strong>Proyecto:</strong> {projectName}</div>
              <div>• <strong>Área:</strong> {areaTechoM2.toFixed(1)} m²</div>
              <div>• <strong>Partidas:</strong> {items.length} incluidas</div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={() => setShowSendSuccessModal(false)}
                className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Seguir Editando
              </button>
              {onGoToProjects && (
                <button
                  onClick={() => {
                    setShowSendSuccessModal(false);
                    onGoToProjects();
                  }}
                  className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Ver en Proyectos
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuralPresupuesto;
