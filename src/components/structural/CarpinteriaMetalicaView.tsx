import React, { useState } from 'react';
import { 
  Hammer, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Eye, 
  Layers, 
  Maximize2, 
  Wrench, 
  Box,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Cuboid
} from 'lucide-react';

export type TipoCarpinteria = 
  | 'puerta' 
  | 'ventana' 
  | 'porton' 
  | 'baranda' 
  | 'escalera' 
  | 'cerco' 
  | 'estructura_ligera';

interface CarpinteriaProject {
  tipo: TipoCarpinteria;
  nombre: string;
  ancho: number; // metros
  alto: number; // metros
  profundidadOrLargo: number; // metros (para escaleras o estructuras)
  numHojas: number;
  tipoMarco: string; 
  tipoBastidor: string; 
  tipoTravesaño: string;
  tipoRelleno: 'plancha_lisa' | 'rejas_barras' | 'machihembrado' | 'vidrio' | 'mixto_plancha_reja' | 'plancha_estriada' | 'rejilla_grating' | 'ninguno';
  espesorPlancha: string; 
  espaciadoRejasCm: number;
  numPeldaños: number;
  alturaBaranda: number;
  cerradura: string;
  numBisagras: number;
  tipoApertura: 'batiente_derecha' | 'batiente_izquierda' | 'doble_batiente' | 'corrediza' | 'levadizo' | 'fijo' | 'caracol' | 'recta';
  colorPintura: string;
  observaciones: string;
}

export interface CarpinteriaViewProps {
  onBackToDesigner?: () => void;
}

const CATALOGO_PERFILES = {
  marcos: [
    'Tubo Rectangular 3" x 1 1/2" x 2.0mm',
    'Tubo Rectangular 4" x 2" x 2.5mm (Pesado)',
    'Tubo Rectangular 6" x 2" x 3.0mm (Estructural)',
    'Tubo Cuadrado 2" x 2" x 2.0mm',
    'Tubo Cuadrado 3" x 3" x 3.0mm',
    'Perfil Canal UPN 80 x 45mm',
    'Perfil Canal UPN 100 x 50mm',
    'Ángulo de Acero 2" x 2" x 1/4"'
  ],
  bastidores: [
    'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm',
    'Tubo Cuadrado 2" x 2" x 2.0mm',
    'Tubo Rectangular 3" x 1 1/2" x 2.0mm',
    'Tubo Cuadrado 1" x 1" x 1.2mm (Liviano)',
    'Ángulo Structural 1 1/2" x 1 1/2" x 3/16"'
  ],
  travesanos: [
    'Tubo Cuadrado 1" x 1" x 1.2mm',
    'Tubo Cuadrado 1 1/2" x 1" x 1.5mm',
    'Pletina de Acero 1" x 1/4"',
    'Ninguno'
  ]
};

export const CarpinteriaMetalicaView: React.FC<CarpinteriaViewProps> = ({ onBackToDesigner }) => {
  const [project, setProject] = useState<CarpinteriaProject>({
    tipo: 'puerta',
    nombre: 'Puerta Principal de Seguridad',
    ancho: 1.00,
    alto: 2.20,
    profundidadOrLargo: 1.00,
    numHojas: 1,
    tipoMarco: 'Tubo Rectangular 3" x 1 1/2" x 2.0mm',
    tipoBastidor: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm',
    tipoTravesaño: 'Tubo Cuadrado 1" x 1" x 1.2mm',
    tipoRelleno: 'mixto_plancha_reja',
    espesorPlancha: '1/16" (1.5mm)',
    espaciadoRejasCm: 12,
    numPeldaños: 12,
    alturaBaranda: 0.90,
    cerradura: 'Cerradura de Sobreponer Forte 3 Golpes + Cerrojo',
    numBisagras: 3,
    tipoApertura: 'batiente_derecha',
    colorPintura: 'Negro Mate Texturizado Anticorrosivo',
    observaciones: 'Incluye marco contramarco y tratamiento epóxico'
  });

  const [activeTab, setActiveTab] = useState<'diseño_2d' | 'diseño_3d' | 'metrado'>('diseño_3d');
  const [copied, setCopied] = useState(false);

  // 3D Orbit Camera State
  const [rotX, setRotX] = useState<number>(35); // Pitch
  const [rotZ, setRotZ] = useState<number>(45); // Yaw
  const [zoom3D, setZoom3D] = useState<number>(1.0);
  const [pan3D, setPan3D] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [lastMouse, setLastMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3D Layer Visibility Toggles
  const [showMarco3D, setShowMarco3D] = useState<boolean>(true);
  const [showBastidor3D, setShowBastidor3D] = useState<boolean>(true);
  const [showRelleno3D, setShowRelleno3D] = useState<boolean>(true);

  const handleSelectTipo = (tipo: TipoCarpinteria) => {
    switch (tipo) {
      case 'puerta':
        setProject({
          tipo: 'puerta',
          nombre: 'Puerta Principal de Ingreso',
          ancho: 1.00,
          alto: 2.20,
          profundidadOrLargo: 1.00,
          numHojas: 1,
          tipoMarco: 'Tubo Rectangular 3" x 1 1/2" x 2.0mm',
          tipoBastidor: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm',
          tipoTravesaño: 'Tubo Cuadrado 1" x 1" x 1.2mm',
          tipoRelleno: 'mixto_plancha_reja',
          espesorPlancha: '1/16" (1.5mm)',
          espaciadoRejasCm: 12,
          numPeldaños: 12,
          alturaBaranda: 0.90,
          cerradura: 'Cerradura de Sobreponer Forte 3 Golpes',
          numBisagras: 3,
          tipoApertura: 'batiente_derecha',
          colorPintura: 'Negro Mate Texturizado',
          observaciones: 'Puerta de alta seguridad con reja superior'
        });
        break;
      case 'ventana':
        setProject({
          tipo: 'ventana',
          nombre: 'Ventana Panorámica con Reja',
          ancho: 1.80,
          alto: 1.20,
          profundidadOrLargo: 1.00,
          numHojas: 2,
          tipoMarco: 'Tubo Cuadrado 2" x 2" x 2.0mm',
          tipoBastidor: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm',
          tipoTravesaño: 'Tubo Cuadrado 1" x 1" x 1.2mm',
          tipoRelleno: 'rejas_barras',
          espesorPlancha: '1/20" (0.9mm)',
          espaciadoRejasCm: 10,
          numPeldaños: 12,
          alturaBaranda: 0.90,
          cerradura: 'Pestillos de Seguridad Deslizantes',
          numBisagras: 4,
          tipoApertura: 'corrediza',
          colorPintura: 'Blanco Esmalte Sintético',
          observaciones: 'Sistema corrediza con rodamientos pesados'
        });
        break;
      case 'porton':
        setProject({
          tipo: 'porton',
          nombre: 'Portón Vehicular y Peatonal',
          ancho: 3.50,
          alto: 2.50,
          profundidadOrLargo: 1.00,
          numHojas: 2,
          tipoMarco: 'Tubo Rectangular 4" x 2" x 2.5mm (Pesado)',
          tipoBastidor: 'Tubo Rectangular 3" x 1 1/2" x 2.0mm',
          tipoTravesaño: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm',
          tipoRelleno: 'plancha_lisa',
          espesorPlancha: '3/32" (2.0mm)',
          espaciadoRejasCm: 15,
          numPeldaños: 12,
          alturaBaranda: 0.90,
          cerradura: 'Cerradura Eléctrica + Pasadores de Piso',
          numBisagras: 6,
          tipoApertura: 'doble_batiente',
          colorPintura: 'Gris Grafito Forja',
          observaciones: 'Portón de doble hoja con refuerzos diagonales'
        });
        break;
      case 'baranda':
        setProject({
          tipo: 'baranda',
          nombre: 'Baranda Metálica para Balcón / Escalera',
          ancho: 3.00,
          alto: 0.95,
          profundidadOrLargo: 1.00,
          numHojas: 1,
          tipoMarco: 'Tubo Redondo 2" x 2.0mm (Pasamanos)',
          tipoBastidor: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm (Parantes)',
          tipoTravesaño: 'Tubo Cuadrado 3/4" x 3/4" (Balaustres)',
          tipoRelleno: 'rejas_barras',
          espesorPlancha: '1/16" (1.5mm)',
          espaciadoRejasCm: 12,
          numPeldaños: 12,
          alturaBaranda: 0.95,
          cerradura: 'Anclajes de expansión con pernos estructurales',
          numBisagras: 0,
          tipoApertura: 'fijo',
          colorPintura: 'Negro Semi-Brillo',
          observaciones: 'Cumple normativa de seguridad contra caídas'
        });
        break;
      case 'escalera':
        setProject({
          tipo: 'escalera',
          nombre: 'Escalera Metálica Recta con Zancos',
          ancho: 1.00,
          alto: 2.80,
          profundidadOrLargo: 3.50,
          numHojas: 1,
          tipoMarco: 'Perfil Canal UPN 100 x 50mm (Zancos)',
          tipoBastidor: 'Ángulo Structural 1 1/2" x 1 1/2" x 3/16" (Soporte Peldaño)',
          tipoTravesaño: 'Pletina de Refuerzo 1" x 1/4"',
          tipoRelleno: 'plancha_estriada',
          espesorPlancha: '1/8" (3.0mm Estriada)',
          espaciadoRejasCm: 15,
          numPeldaños: 15,
          alturaBaranda: 0.90,
          cerradura: 'Anclajes directos a losa de concreto',
          numBisagras: 0,
          tipoApertura: 'recta',
          colorPintura: 'Gris Industrial Anticorrosivo',
          observaciones: 'Incluye peldaños antideslizantes y zancos dobles'
        });
        break;
      case 'cerco':
        setProject({
          tipo: 'cerco',
          nombre: 'Reja de Cerco Perimétrico de Alta Seguridad',
          ancho: 5.00,
          alto: 2.00,
          profundidadOrLargo: 1.00,
          numHojas: 1,
          tipoMarco: 'Tubo Cuadrado 2" x 2" x 2.0mm',
          tipoBastidor: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm',
          tipoTravesaño: 'Tubo Cuadrado 1" x 1" x 1.2mm',
          tipoRelleno: 'rejas_barras',
          espesorPlancha: '1/16" (1.5mm)',
          espaciadoRejasCm: 12,
          numPeldaños: 12,
          alturaBaranda: 0.90,
          cerradura: 'Candado de Alta Seguridad con Portacandado',
          numBisagras: 2,
          tipoApertura: 'fijo',
          colorPintura: 'Verde Campestre / Negro',
          observaciones: 'Módulos prefabricados para soldar en obra'
        });
        break;
      case 'estructura_ligera':
        setProject({
          tipo: 'estructura_ligera',
          nombre: 'Techo Sol y Sombra / Pérgola Metálica',
          ancho: 4.00,
          alto: 2.60,
          profundidadOrLargo: 3.00,
          numHojas: 1,
          tipoMarco: 'Tubo Rectangular 4" x 2" x 2.5mm (Pesado)',
          tipoBastidor: 'Tubo Rectangular 3" x 1 1/2" x 2.0mm (Vigas)',
          tipoTravesaño: 'Tubo Cuadrado 2" x 1" x 1.5mm (Listones)',
          tipoRelleno: 'ninguno',
          espesorPlancha: '1/16" (1.5mm)',
          espaciadoRejasCm: 30,
          numPeldaños: 12,
          alturaBaranda: 0.90,
          cerradura: 'Soportes y cartelas de unión',
          numBisagras: 0,
          tipoApertura: 'fijo',
          colorPintura: 'Marrón Madera Forja',
          observaciones: 'Estructura modular para terraza con listones de sombra'
        });
        break;
    }
  };

  // Calculations
  const areaM2 = project.tipo === 'escalera' || project.tipo === 'estructura_ligera' 
    ? project.ancho * project.profundidadOrLargo 
    : project.ancho * project.alto;
    
  const perimetroMarcoM = (2 * project.alto) + project.ancho;
  const perimetroHojasM = project.tipo === 'baranda' || project.tipo === 'cerco' || project.tipo === 'estructura_ligera'
    ? project.ancho * 2 + project.alto * 2
    : project.numHojas * (2 * (project.alto + (project.ancho / project.numHojas)));

  const pesoMarcoKg = perimetroMarcoM * 4.2; 
  const pesoBastidorKg = perimetroHojasM * 2.8; 
  const pesoPlanchaKg = project.tipoRelleno === 'plancha_lisa' || project.tipoRelleno === 'mixto_plancha_reja' || project.tipoRelleno === 'plancha_estriada'
    ? areaM2 * (project.espesorPlancha.includes('3.0mm') ? 23.5 : project.espesorPlancha.includes('2.0mm') ? 15.7 : 12) 
    : 0;
  
  const numBarrasReja = project.tipoRelleno === 'rejas_barras' || project.tipoRelleno === 'mixto_plancha_reja'
    ? Math.floor((project.ancho * 100) / (project.espaciadoRejasCm || 12))
    : 0;
  const pesoBarrasKg = numBarrasReja * project.alto * 1.4;

  const pesoTotalAceroKg = pesoMarcoKg + pesoBastidorKg + pesoPlanchaKg + pesoBarrasKg + (project.tipo === 'escalera' ? project.numPeldaños * 6.5 : 0);
  const areaPinturaM2 = areaM2 * 2.4; 

  const costoAcero = pesoTotalAceroKg * 10.50; 
  const costoCerrajería = project.tipo === 'porton' ? 280 : project.tipo === 'puerta' ? 160 : 80;
  const costoPintura = areaPinturaM2 * 22.00;
  const costoManoObra = areaM2 * 140.00;
  const subtotal = costoAcero + costoCerrajería + costoPintura + costoManoObra;
  const igv = 0;
  const totalCotizacion = subtotal;

  const copyPresupuesto = () => {
    const text = `COTIZACIÓN CARPINTERÍA METÁLICA Y HERRERÍA:
Proyecto: ${project.nombre} (${project.tipo.toUpperCase()})
Dimensiones: ${project.ancho.toFixed(2)}m Ancho x ${project.alto.toFixed(2)}m Alto (Área: ${areaM2.toFixed(2)} m²)
Perfil Marco: ${project.tipoMarco}
Perfil Bastidor: ${project.tipoBastidor}
Perfil Travesaño: ${project.tipoTravesaño}
Tipo de Relleno: ${project.tipoRelleno.replace(/_/g, ' ')} (${project.espesorPlancha})
Peso Estimado Acero: ${pesoTotalAceroKg.toFixed(1)} kg
Cerrajería / Accesorios: ${project.cerradura}
Total Estimado: S/. ${totalCotizacion.toFixed(2)} PEN (Incluye IGV)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 3D Isometric projection math for SVG rendering
  const scale3D = 75;
  const proj3D = (x: number, y: number, z: number) => {
    const radZ = (rotZ * Math.PI) / 180;
    const radX = (rotX * Math.PI) / 180;

    const dx = x * scale3D * zoom3D;
    const dy = y * scale3D * zoom3D;
    const dz = z * scale3D * zoom3D;

    // Rotate Z
    const x1 = dx * Math.cos(radZ) - dy * Math.sin(radZ);
    const y1 = dx * Math.sin(radZ) + dy * Math.cos(radZ);

    // Rotate X
    const y2 = y1 * Math.cos(radX) - dz * Math.sin(radX);
    const z2 = y1 * Math.sin(radX) + dz * Math.cos(radX);

    return {
      sx: x1 + 320 + pan3D.x,
      sy: -y2 + 260 + pan3D.y,
      depth: z2
    };
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden select-none">
      {/* Top Header & Project Type Selector */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          {onBackToDesigner && (
            <button
              onClick={onBackToDesigner}
              className="mr-1 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer border border-slate-700"
              title="Volver a Techos Metálicos"
            >
              <span>←</span>
              <span className="hidden sm:inline">Techos Metálicos</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Hammer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Herrería y Carpintería Metálica 3D</span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono">
                ASTM A36 / A500
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Diseño paramétrico y visualizador 3D interactivo para perfiles metálicos
            </p>
          </div>
        </div>

        {/* Project Type Nav Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'puerta', label: '🚪 Puertas' },
            { id: 'ventana', label: '🪟 Ventanas' },
            { id: 'porton', label: '🚙 Portones' },
            { id: 'baranda', label: '🛡️ Barandas' },
            { id: 'escalera', label: '🪜 Escaleras' },
            { id: 'cerco', label: '⛓️ Cercos' },
            { id: 'estructura_ligera', label: '🏛️ Pérgolas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSelectTipo(tab.id as TipoCarpinteria)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                project.tipo === tab.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('diseño_3d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'diseño_3d' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Cuboid className="w-4 h-4 text-indigo-300" />
            <span>Modelo 3D</span>
          </button>
          <button
            onClick={() => setActiveTab('diseño_2d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'diseño_2d' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Plano 2D</span>
          </button>
          <button
            onClick={() => setActiveTab('metrado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'metrado' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Metrado y Presupuesto</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Parameters Drawer */}
        <div className="w-full lg:w-96 xl:w-[420px] bg-slate-950 border-r border-slate-800 overflow-y-auto p-4 space-y-4 shrink-0 text-xs text-slate-200 custom-scrollbar">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Nombre del Proyecto</span>
            <input 
              type="text" 
              value={project.nombre} 
              onChange={e => setProject({ ...project, nombre: e.target.value })} 
              className="w-full font-bold text-white bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Dimensiones */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center">
              <Maximize2 className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Dimensiones Geométricas
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Ancho / Longitud (m)</label>
                <input 
                  type="number" 
                  step="0.05" 
                  min="0.5" 
                  max="20" 
                  value={project.ancho} 
                  onChange={e => setProject({ ...project, ancho: parseFloat(e.target.value) || 1 })} 
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white text-right font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  {project.tipo === 'escalera' ? 'Proyección Horizontal (m)' : 'Alto / Altura (m)'}
                </label>
                <input 
                  type="number" 
                  step="0.05" 
                  min="0.5" 
                  max="15" 
                  value={project.tipo === 'escalera' ? project.profundidadOrLargo : project.alto} 
                  onChange={e => setProject({ 
                    ...project, 
                    [project.tipo === 'escalera' ? 'profundidadOrLargo' : 'alto']: parseFloat(e.target.value) || 2 
                  })} 
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white text-right font-mono"
                />
              </div>
            </div>

            {project.tipo === 'escalera' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Altura Total (m)</label>
                  <input 
                    type="number" 
                    step="0.05" 
                    min="0.5" 
                    max="8" 
                    value={project.alto} 
                    onChange={e => setProject({ ...project, alto: parseFloat(e.target.value) || 2.5 })} 
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Número de Peldaños</label>
                  <input 
                    type="number" 
                    min="3" 
                    max="30" 
                    value={project.numPeldaños} 
                    onChange={e => setProject({ ...project, numPeldaños: parseInt(e.target.value) || 12 })} 
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white text-right font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Perfiles Metálicos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center">
              <Wrench className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Selección de Perfiles Metálicos
            </h4>
            
            <div>
              <label className="block text-slate-400 font-medium mb-1">Marco Perimétrico / Zanco</label>
              <select
                value={project.tipoMarco}
                onChange={e => setProject({ ...project, tipoMarco: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
              >
                {CATALOGO_PERFILES.marcos.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Bastidor / Parantes / Vigas</label>
              <select
                value={project.tipoBastidor}
                onChange={e => setProject({ ...project, tipoBastidor: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
              >
                {CATALOGO_PERFILES.bastidores.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Travesaños / Refuerzos</label>
              <select
                value={project.tipoTravesaño}
                onChange={e => setProject({ ...project, tipoTravesaño: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
              >
                {CATALOGO_PERFILES.travesanos.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {(project.tipo === 'puerta' || project.tipo === 'porton' || project.tipo === 'ventana') && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Número de Hojas</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="6" 
                    value={project.numHojas} 
                    onChange={e => setProject({ ...project, numHojas: Math.max(1, parseInt(e.target.value) || 1) })} 
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Sistema Apertura</label>
                  <select
                    value={project.tipoApertura}
                    onChange={e => setProject({ ...project, tipoApertura: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold text-[11px]"
                  >
                    <option value="batiente_derecha">Batiente Derecha</option>
                    <option value="batiente_izquierda">Batiente Izquierda</option>
                    <option value="doble_batiente">Doble Batiente</option>
                    <option value="corrediza">Corrediza</option>
                    <option value="levadizo">Levadizo</option>
                    <option value="fijo">Fijo</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Relleno y Acabados */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Tipo de Relleno y Acabados
            </h4>
            
            <div>
              <label className="block text-slate-400 font-medium mb-1">Material de Relleno</label>
              <select
                value={project.tipoRelleno}
                onChange={e => setProject({ ...project, tipoRelleno: e.target.value as any })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
              >
                <option value="plancha_lisa">Plancha de Acero Lisa (Cieguilla)</option>
                <option value="mixto_plancha_reja">Mixto: Plancha inferior + Reja superior</option>
                <option value="rejas_barras">Barras / Rejas de Seguridad Tubulares</option>
                <option value="plancha_estriada">Plancha Estriada Antideslizante</option>
                <option value="rejilla_grating">Rejilla Grating Industrial</option>
                <option value="machihembrado">Machihembrado Metálico</option>
                <option value="vidrio">Vidrio Templado</option>
                <option value="ninguno">Sin Relleno (Estructura Abierta)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Cerrajería / Accesorios</label>
              <input
                type="text"
                value={project.cerradura}
                onChange={e => setProject({ ...project, cerradura: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Pintura Anticorrosiva</label>
              <input
                type="text"
                value={project.colorPintura}
                onChange={e => setProject({ ...project, colorPintura: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Center / Right Display Area */}
        <div className="flex-1 bg-slate-950 p-4 lg:p-6 flex flex-col items-center justify-center overflow-auto relative">
          {activeTab === 'diseño_3d' ? (
            /* 3D Interactive Viewport with Floating Controls */
            <div 
              className="w-full h-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col"
              onMouseDown={e => {
                setIsRotating(true);
                setLastMouse({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={e => {
                if (!isRotating) return;
                const dx = e.clientX - lastMouse.x;
                const dy = e.clientY - lastMouse.y;
                setRotZ(prev => prev + dx * 0.6);
                setRotX(prev => Math.max(5, Math.min(85, prev - dy * 0.6)));
                setLastMouse({ x: e.clientX, y: e.clientY });
              }}
              onMouseUp={() => setIsRotating(false)}
              onMouseLeave={() => setIsRotating(false)}
            >
              {/* Floating Top Header Bar inside 3D View */}
              <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between pointer-events-none">
                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl shadow-lg pointer-events-auto flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="font-bold text-white text-xs">Modelo 3D: {project.nombre}</span>
                  <span className="text-[10px] text-indigo-400 font-mono">({project.ancho}m × {project.alto}m)</span>
                </div>

                {/* Layer Visibility Floating Pills */}
                <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-lg pointer-events-auto flex items-center gap-2">
                  <button
                    onClick={() => setShowMarco3D(!showMarco3D)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                      showMarco3D ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Marco ({showMarco3D ? 'ON' : 'OFF'})
                  </button>
                  <button
                    onClick={() => setShowBastidor3D(!showBastidor3D)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                      showBastidor3D ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Bastidor ({showBastidor3D ? 'ON' : 'OFF'})
                  </button>
                  <button
                    onClick={() => setShowRelleno3D(!showRelleno3D)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                      showRelleno3D ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Relleno ({showRelleno3D ? 'ON' : 'OFF'})
                  </button>
                </div>
              </div>

              {/* Floating Camera Action Buttons (Bottom Right) */}
              <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
                <button
                  onClick={() => setZoom3D(prev => Math.min(2.2, prev + 0.15))}
                  className="w-10 h-10 rounded-2xl bg-slate-950/90 hover:bg-slate-800 text-white border border-slate-800 shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                  title="Acercar Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom3D(prev => Math.max(0.5, prev - 0.15))}
                  className="w-10 h-10 rounded-2xl bg-slate-950/90 hover:bg-slate-800 text-white border border-slate-800 shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                  title="Alejar Zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setRotX(35); setRotZ(45); setZoom3D(1.0); setPan3D({ x: 0, y: 0 }); }}
                  className="w-10 h-10 rounded-2xl bg-slate-950/90 hover:bg-slate-800 text-white border border-slate-800 shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                  title="Restaurar Cámara"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* SVG 3D Isometric Viewport */}
              <div className="w-full h-full flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 700 520" className="w-full h-full">
                  <defs>
                    <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#475569" />
                      <stop offset="50%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>

                  {/* Floor grid reference */}
                  <g opacity="0.3">
                    {[-2, -1, 0, 1, 2].map(gx => {
                      const p1 = proj3D(gx, -2, 0);
                      const p2 = proj3D(gx, 2, 0);
                      return <line key={`gx-${gx}`} x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#334155" strokeWidth="1" />;
                    })}
                  </g>

                  {/* 3D Geometry Rendering */}
                  <g>
                    {/* Marco Perimetral 3D */}
                    {showMarco3D && (() => {
                      const w = project.ancho;
                      const h = project.alto;
                      const pBot1 = proj3D(0, 0, 0);
                      const pBot2 = proj3D(w, 0, 0);
                      const pBot3 = proj3D(w, 0, 0.1);
                      const pBot4 = proj3D(0, 0, 0.1);

                      const pLeft1 = proj3D(0, 0, 0);
                      const pLeft2 = proj3D(0, 0, h);
                      const pLeft3 = proj3D(0.1, 0, h);
                      const pLeft4 = proj3D(0.1, 0, 0);

                      const pRight1 = proj3D(w, 0, 0);
                      const pRight2 = proj3D(w, 0, h);
                      const pRight3 = proj3D(w - 0.1, 0, h);
                      const pRight4 = proj3D(w - 0.1, 0, 0);

                      return (
                        <g>
                          {/* Bottom Marco */}
                          <polygon
                            points={`${pBot1.sx},${pBot1.sy} ${pBot2.sx},${pBot2.sy} ${pBot3.sx},${pBot3.sy} ${pBot4.sx},${pBot4.sy}`}
                            fill="#6366f1"
                            stroke="#4338ca"
                            strokeWidth="1"
                          />
                          {/* Left Marco Vertical */}
                          <polygon
                            points={`${pLeft1.sx},${pLeft1.sy} ${pLeft2.sx},${pLeft2.sy} ${pLeft3.sx},${pLeft3.sy} ${pLeft4.sx},${pLeft4.sy}`}
                            fill="#4f46e5"
                            stroke="#312e81"
                            strokeWidth="1"
                          />
                          {/* Right Marco Vertical */}
                          <polygon
                            points={`${pRight1.sx},${pRight1.sy} ${pRight2.sx},${pRight2.sy} ${pRight3.sx},${pRight3.sy} ${pRight4.sx},${pRight4.sy}`}
                            fill="#4f46e5"
                            stroke="#312e81"
                            strokeWidth="1"
                          />
                        </g>
                      );
                    })()}

                    {/* Bastidor & Relleno 3D */}
                    {showBastidor3D && (
                      <g>
                        {Array.from({ length: project.numHojas }).map((_, hIdx) => {
                          const leafW = project.ancho / project.numHojas;
                          const startX = hIdx * leafW + 0.05;
                          const endX = (hIdx + 1) * leafW - 0.05;
                          const h = project.alto - 0.1;

                          const pBottomLeft = proj3D(startX, 0.05, 0.05);
                          const pBottomRight = proj3D(endX, 0.05, 0.05);
                          const pTopRight = proj3D(endX, 0.05, h);
                          const pTopLeft = proj3D(startX, 0.05, h);

                          return (
                            <g key={`leaf-3d-${hIdx}`}>
                              {/* Leaf Frame */}
                              <polygon
                                points={`${pBottomLeft.sx},${pBottomLeft.sy} ${pBottomRight.sx},${pBottomRight.sy} ${pTopRight.sx},${pTopRight.sy} ${pTopLeft.sx},${pTopLeft.sy}`}
                                fill="url(#metalGrad)"
                                stroke="#38bdf8"
                                strokeWidth="2"
                              />

                              {/* Infill / Glass / Plancha */}
                              {showRelleno3D && (
                                <polygon
                                  points={`${proj3D(startX + 0.05, 0.06, 0.1).sx},${proj3D(startX + 0.05, 0.06, 0.1).sy} 
                                           ${proj3D(endX - 0.05, 0.06, 0.1).sx},${proj3D(endX - 0.05, 0.06, 0.1).sy} 
                                           ${proj3D(endX - 0.05, 0.06, h - 0.05).sx},${proj3D(endX - 0.05, 0.06, h - 0.05).sy} 
                                           ${proj3D(startX + 0.05, 0.06, h - 0.05).sx},${proj3D(startX + 0.05, 0.06, h - 0.05).sy}`}
                                  fill={project.tipoRelleno === 'vidrio' ? 'url(#glassGrad)' : '#334155'}
                                  stroke="#64748b"
                                  strokeWidth="1.5"
                                  opacity="0.85"
                                />
                              )}
                            </g>
                          );
                        })}
                      </g>
                    )}
                  </g>
                </svg>
              </div>

              {/* Bottom Quick Status Bar in 3D View */}
              <div className="absolute bottom-4 left-4 z-20 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl shadow-lg flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Peso Acero:</span> <strong className="text-emerald-400 font-mono">{pesoTotalAceroKg.toFixed(1)} kg</strong>
                </div>
                <div className="w-px h-3 bg-slate-800"></div>
                <div>
                  <span className="text-slate-400">Cotización:</span> <strong className="text-indigo-400 font-mono">S/. {totalCotizacion.toFixed(0)} PEN</strong>
                </div>
              </div>
            </div>
          ) : activeTab === 'diseño_2d' ? (
            /* 2D Schematic Elevation View */
            <div className="w-full max-w-3xl bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-4 text-slate-300 text-xs border-b border-slate-800 pb-3">
                <span className="font-mono font-bold text-white flex items-center gap-2">
                  <Box className="w-4 h-4 text-indigo-400" />
                  {project.nombre} — Plano de Elevación 2D
                </span>
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-full text-[11px] font-bold">
                  {project.ancho}m × {project.alto}m
                </span>
              </div>

              <div className="w-full flex justify-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800/80 my-2">
                <svg
                  width={Math.min(420, project.ancho * 110)}
                  height={Math.min(380, project.alto * 120)}
                  viewBox={`-30 -30 ${project.ancho * 100 + 60} ${project.alto * 100 + 60}`}
                  className="overflow-visible"
                >
                  <defs>
                    <pattern id="grid2d" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect x="-20" y="-20" width={project.ancho * 100 + 40} height={project.alto * 100 + 40} fill="url(#grid2d)" rx="8" />

                  <rect
                    x="0"
                    y="0"
                    width={project.ancho * 100}
                    height={project.alto * 100}
                    fill="#0f172a"
                    stroke="#4f46e5"
                    strokeWidth="6"
                    rx="3"
                  />

                  {Array.from({ length: project.numHojas }).map((_, hIdx) => {
                    const leafWidth = (project.ancho * 100) / project.numHojas;
                    const leafX = hIdx * leafWidth;
                    return (
                      <g key={`leaf-2d-${hIdx}`}>
                        <rect
                          x={leafX + 4}
                          y="4"
                          width={leafWidth - 8}
                          height={project.alto * 100 - 8}
                          fill="#1e293b"
                          stroke="#3b82f6"
                          strokeWidth="3.5"
                        />
                      </g>
                    );
                  })}

                  <text x={(project.ancho * 100) / 2} y="-12" fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    ANCHO = {project.ancho.toFixed(2)} m
                  </text>
                  <text x="-16" y={(project.alto * 100) / 2} fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace" transform={`rotate(-90, -16, ${(project.alto * 100) / 2})`}>
                    ALTO = {project.alto.toFixed(2)} m
                  </text>
                </svg>
              </div>
            </div>
          ) : (
            /* Metrado Table View */
            <div className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl text-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    Metrado y Presupuesto de Carpintería Metálica
                  </h3>
                  <p className="text-xs text-slate-500">{project.nombre} — Especificaciones técnicas, perfiles y costos</p>
                </div>
                <button
                  onClick={copyPresupuesto}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Cotización'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-mono font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Descripción de Partida / Perfil / Insumo</th>
                      <th className="p-3 text-center">Unidad</th>
                      <th className="p-3 text-right">Cant.</th>
                      <th className="p-3 text-right">P. Unit (S/.)</th>
                      <th className="p-3 text-right">Subtotal (S/.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold">Perfil Marco Perimétrico ({project.tipoMarco})</td>
                      <td className="p-3 text-center">m</td>
                      <td className="p-3 text-right font-mono">{perimetroMarcoM.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">38.00</td>
                      <td className="p-3 text-right font-mono font-bold">{(perimetroMarcoM * 38).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Perfil Bastidor / Parantes ({project.tipoBastidor})</td>
                      <td className="p-3 text-center">m</td>
                      <td className="p-3 text-right font-mono">{perimetroHojasM.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">26.00</td>
                      <td className="p-3 text-right font-mono font-bold">{(perimetroHojasM * 26).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Relleno / Chapa / Peldaños ({project.tipoRelleno})</td>
                      <td className="p-3 text-center">m²</td>
                      <td className="p-3 text-right font-mono">{areaM2.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">95.00</td>
                      <td className="p-3 text-right font-mono font-bold">{(areaM2 * 95).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Cerrajería y Accesorios ({project.cerradura})</td>
                      <td className="p-3 text-center">glb</td>
                      <td className="p-3 text-right font-mono">1.00</td>
                      <td className="p-3 text-right font-mono">{costoCerrajería.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold">{costoCerrajería.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Pintura Base Epóxica y Acabado ({project.colorPintura})</td>
                      <td className="p-3 text-center">m²</td>
                      <td className="p-3 text-right font-mono">{areaPinturaM2.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">22.00</td>
                      <td className="p-3 text-right font-mono font-bold">{costoPintura.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Mano de Obra Especializada (Corte, Soldadura MIG, Armado)</td>
                      <td className="p-3 text-center">glb</td>
                      <td className="p-3 text-right font-mono">1.00</td>
                      <td className="p-3 text-right font-mono">{costoManoObra.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold">{costoManoObra.toFixed(2)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="border-t-2 border-slate-800 bg-slate-50 font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="p-3 text-right text-slate-600">Subtotal Costo Directo:</td>
                      <td className="p-3 text-right font-mono">S/. {subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right text-slate-600">IGV (18%):</td>
                      <td className="p-2.5 text-right font-mono">S/. {igv.toFixed(2)}</td>
                    </tr>
                    <tr className="text-indigo-900 bg-indigo-50 text-sm">
                      <td colSpan={4} className="p-3.5 text-right">TOTAL PRESUPUESTO OFICIAL:</td>
                      <td className="p-3.5 text-right font-mono text-base font-black">S/. {totalCotizacion.toFixed(2)} PEN</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarpinteriaMetalicaView;
