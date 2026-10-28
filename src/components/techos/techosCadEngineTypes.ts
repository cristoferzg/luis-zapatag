// Arquitectura de Modelos de Datos, Interfaces y Tipos del Motor CAD Vectorial de Techos Metálicos
// Inteligencia de Materiales: Enlace físico entre trazo vectorial 2D/3D, física real, despiece 1D, metrados, análisis estructural y costos.

export type CategoriaPerfil = 
  | 'tubo_cuadrado'
  | 'tubo_rectangular'
  | 'tubo_redondo'
  | 'perfil_c'
  | 'perfil_z'
  | 'perfil_h_ipe'
  | 'angulo_estructural'
  | 'platina'
  | 'barra_cuadrada'
  | 'barra_redonda';

export type CategoriaCobertura = 
  | 'aluzinc_tr4'
  | 'aluzinc_tr5'
  | 'policarbonato_alveolar'
  | 'upvc_termoacustica'
  | 'panel_sandwich_pur'
  | 'calamina_galvanizada'
  | 'plancha_acero_deck'
  | 'fibrocemento_eternit';

export type CategoriaAccesorio = 
  | 'placa_base'
  | 'perno_autoperforante_epdm'
  | 'perno_anclaje_j'
  | 'soldadura_aws'
  | 'canaleta_pluvial'
  | 'cumbrera_aluzinc'
  | 'bajante_pvc';

export type NormaAcabadoTechos = 'LAC' | 'LAF' | 'GALVANIZADO' | 'ASTM';

// 1.1 MODELO DE PERFIL TUBULAR / ESTRUCTURAL (INVENTARIO FÍSICO)
export interface PerfilTubularItem {
  id: string;
  categoria: CategoriaPerfil;
  normaAcabado?: NormaAcabadoTechos;
  nombre: string;
  codigoComercial: string;
  anchoMm: number;              // Ancho de la sección transv. (mm)
  altoMm: number;               // Alto de la sección transv. (mm)
  espesorMm: number;            // Espesor de pared (mm)
  pesoLinealKgM: number;        // Masa lineal real (kg por metro lineal)
  longitudComercialM: number;   // Largo estándar de venta en Perú (ej. 6.00 m)
  costoMetroSol: number;        // Precio por metro lineal (S/.)
  resistenciaFluenciaFyMpa: number; // Propiedad mecánica (ej. 250 MPa A36)
  inerciaIcm4?: number;         // Momento de inercia Ix (cm4)
  moduloSeccionZcm3?: number;   // Módulo de sección Zx (cm3)
  areaSeccionCm2?: number;      // Área transversal (cm2)
}

// 1.2 MODELO DE COBERTURA / PLANCHA
export interface CoberturaItem {
  id: string;
  categoria: CategoriaCobertura;
  nombre: string;
  anchoTotalMm: number;         // Ancho total bruto de la plancha (mm)
  anchoUtilMm: number;          // Ancho útil / efectivo considerando traslape lateral (mm)
  espesorMm: number;            // Espesor nominal (mm)
  tipoOnda: string;             // ej. "Trapezoidal TR-4", "Ondulada TR-5"
  longitudComercialM: number;   // Medida estándar (ej. 3.0m) o 0 si es "al corte"
  pesoM2Kg: number;             // Peso por metro cuadrado (kg/m²)
  costoM2Sol: number;           // Precio por m² útil (S/.)
  traslapeTransversalMinMm: number; // Traslape longitudinal entre filas (mm)
  pernosRequeridosPorM2: number;    // Densidad recomendada de pernos EPDM por m²
}

// 1.3 MODELO DE ACCESORIOS Y ANCLAJES
export interface PlacaBaseItem {
  id: string;
  nombre: string;
  anchoMm: number;
  largoMm: number;
  espesorMm: number;
  pesoKg: number;
  costoUnidadSol: number;
}

export interface PernoItem {
  id: string;
  categoria: 'autoperforante_epdm' | 'anclaje_j';
  nombre: string;
  diametroPulgadas: string;    // ej. "12-14 x 2"" o "5/8""
  longitudMm: number;
  costoCaja100Sol: number;     // Costo de caja x 100 unidades
}

export interface SoldaduraItem {
  id: string;
  nombre: string;              // ej. "AWS E-6011 1/8"" o "AWS E-7018"
  tipoProceso: 'SMAW_Electrodo' | 'GMAW_MIG';
  consumoKgPorMetroJunta: number; // Consumo estimado (ej. 0.25 kg/m)
  costoKgSol: number;
}

// 2. LIENZO VECTORIAL CAD (NODOS Y TRAMOS)
export interface Node3D {
  id: string;
  x: number;                    // Coordenada X (m)
  y: number;                    // Coordenada Y (m)
  z: number;                    // Coordenada Z (m)
  isFixedSupport?: boolean;     // Apoyo fijo / Apoyo en columna
  nodeLabel?: string;           // Nombre de nodo ej. "N-01"
  selected?: boolean;
  numPernos?: number;           // Número de pernos de anclaje (4, 6, 8)
  boltDiameter?: string;        // Diámetro de pernos (ej. "5/8\"", "M16")
}

export type RolEstructuralSegmento =
  | 'columna'
  | 'columna_concreto'
  | 'cordon_superior'
  | 'cordon_inferior'
  | 'diagonal'
  | 'montante'
  | 'correa'
  | 'viga_principal'
  | 'viga_secundaria'
  | 'tensor_viento'
  | 'arriostre'
  | 'piso_deck'
  | 'baranda'
  | 'escalera'
  | 'placa_base'
  | 'cartela';

export interface Segment3D {
  id: string;
  nodeAId: string;              // ID Nodo Inicial
  nodeBId: string;              // ID Nodo Final
  profileId: string;            // ID del Perfil Tubular asignado
  rolEstructural: RolEstructuralSegmento;
  anguloRotacionGrados?: number;// Orientación de la sección respecto al eje (0°, 90°)
  selected?: boolean;
  // Columna mixta: metros de CONCRETO (encamisado) desde la base; el resto es
  // metal. Solo aplica a columnas. Es visual (no altera el metrado por ahora).
  concretoBaseM?: number;
  // Tensores (varilla/cable): colocados por el botón automático y su función.
  tensorAuto?: boolean;
  funcionTensor?: 'cruz' | 'correa';
  // Tijeral dibujado con 2 clics: sus datos, para cambiar peralte y espacios sin redibujarlo.
  tijeral?: { id: string; a: string; b: string; h: number; n: number; tipo: string };
}

export interface CoverageZone3D {
  id: string;
  nombre: string;
  nodeIdsBoundary: string[];    // Nodos en orden que forman el polígono cerrado
  coberturaMaterialId: string;  // ID de la Cobertura asignada
  pendientePorcentaje: number;  // Pendiente de la caída %
  orientacionInclinacionDeg: number; // Orientación del flujo de agua (0°, 90°, 180°, 270°)
  selected?: boolean;
  movil?: TechoMovil;           // Techo movible (opcional): mecanismo de apertura
}

// Techo movible: la cobertura se divide en paños que se abren a lo largo (Z).
export interface TechoMovil {
  tipo: 'corredizo' | 'plegable' | 'lamas';
  panos: number;                       // paños (o lamas)
  accionamiento: 'manual' | 'motor';
  abreHacia?: 'inicio' | 'final';      // extremo donde se juntan los paños
}

// 3. ESTADO GLOBAL DEL MOTOR DE DIBUJO Y HERRAMIENTAS
export type VistaTechoCAD = 'planta' | 'seccion' | '3d';

export type TipoSnapCad = 
  | 'endpoint'
  | 'midpoint'
  | 'intersection'
  | 'perpendicular'
  | 'nearest_edge'
  | 'close_loop'
  | 'origin'
  | 'grid';

export interface CadSnapResult {
  x: number;
  y: number;
  z: number;
  projX: number;
  projY: number;
  tipo: TipoSnapCad;
  nodeId?: string;
  segmentId?: string;
  segmentIdB?: string;
  isClosingPerimeter?: boolean;
  label: string;
  distanceWorld: number;
  distancePx: number;
}

export type ToolModoCad = 
  | 'select'
  | 'draw_line'
  | 'draw_arc'
  | 'draw_col'
  | 'draw_tijeral'
  | 'draw_correa'
  | 'draw_arriostre'
  | 'draw_tensor'
  | 'draw_line_h'
  | 'draw_line_v'
  | 'draw_rect'
  | 'draw_circle'
  | 'draw_node'
  | 'draw_truss_howe'
  | 'draw_truss_pratt'
  | 'draw_truss_warren'
  | 'draw_truss_fink'
  | 'draw_purlin_grid'
  | 'draw_coverage_poly'
  | 'draw_mezzanine'
  | 'pan'
  | 'measure';

export interface CadSceneState {
  nodes: Record<string, Node3D>;
  segments: Record<string, Segment3D>;
  coverageZones: Record<string, CoverageZone3D>;
  activeTool: ToolModoCad;
  selectedElementIds: string[];
  activeProfileId: string;      // Perfil actualmente seleccionado para nuevos trazos
  activeCoverageId: string;     // Cobertura activa para nuevas áreas
  snapGridSizeM: number;        // Tamaño de retícula de atracción Snap (ej. 0.25 m)
  snapEnabled: boolean;
  historyStack: {
    nodes: Record<string, Node3D>;
    segments: Record<string, Segment3D>;
    coverageZones: Record<string, CoverageZone3D>;
  }[];
  historyIndex: number;
}

// 4. ESTRUCTURA DE RESULTADOS Y DESPIECE 1D (BIN PACKING)
export interface CortePiezaSegmento {
  segmentId: string;
  longitudM: number;
  rolEstructural: RolEstructuralSegmento;
  etiquetaPieza: string;
}

export interface PatronBarraComercial6M {
  indiceBarra: number;
  profileId: string;
  longitudBarraComercialM: number; // Normal 6.00 m
  cortes: CortePiezaSegmento[];
  totalUsadoM: number;
  desperdicioSobraM: number;
  eficienciaPorcentaje: number;
}

export interface ResumenDespiecePerfil1D {
  profileId: string;
  nombrePerfil: string;
  codigoComercial: string;
  totalBarrasComerciales6m: number;
  totalMetrosRequeridosM: number;
  totalMetrosComprados6mM: number;
  totalPesoAceroKg: number;
  totalCostoSoles: number;
  eficienciaPromedioPorcentaje: number;
  desperdicioTotalKg: number;
  patronesBarras: PatronBarraComercial6M[];
}

export interface ResumenCálculoCobertura {
  coberturaMaterialId: string;
  nombreCobertura: string;
  areaRealSuperficieM2: number;
  areaEfectivaCalculadaM2: number;
  numColumnasAnchoUtil: number;
  numFilasLargoPlancha: number;
  totalPlanchasEstimadas: number;
  pesoTotalCoberturaKg: number;
  costoTotalCoberturaSoles: number;
  pernosEpdmRequeridosUnidades: number;
}

export interface FullTechosBomReport {
  despiecePerfiles: ResumenDespiecePerfil1D[];
  resumenCoberturas: ResumenCálculoCobertura[];
  placasBaseTotalesUnids: number;
  pernosAnclajeJTotalesUnids: number;
  cajasPernosEpdmTotales: number;
  kgSoldaduraAwsEstimados: number;
  
  costoDirectoMaterialesSoles: number;
  costoManoObraMontajeSoles: number;
  costoEquiposGruaSoles: number;
  costoDirectoTotalSoles: number;
  gastosGeneralesYUtilidadSoles: number; // 25%
  igvSoles: number;                      // 18%
  precioVentaFinalSoles: number;
  costoPerfilesSoles?: number;
  costoCoberturasSoles?: number;
  costoAccesoriosSoles?: number;
  gastosGeneralesSoles?: number;
  utilidadSoles?: number;
  subtotalSoles?: number;
  tensores?: { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota: string }[];
  costoTensoresSoles?: number;
  mecanismoMovil?: { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota: string }[];
  costoMovilSoles?: number;
}

// 5. ANÁLISIS ESTRUCTURAL Y PARÁMETROS NORMATIVOS (RNE E.020, E.030, E.050, E.090)
export interface StructuralAnalysisInput {
  cargaMuertaKgM2: number;     // Cobertura + peso propio (ej. 15 kg/m2)
  cargaVivaKgM2: number;       // Mantenimiento RNE E.020 (ej. 30 kg/m2)
  velocidadVientoKmH: number;  // RNE E.020 Viento (ej. 75 km/h)
  zonaSismica: 'Z1' | 'Z2' | 'Z3' | 'Z4'; // RNE E.030 (Z4 = Lima/Costa)
  tipoSuelo: 'S0' | 'S1' | 'S2' | 'S3';
}

export interface MemberStructuralResult {
  segmentId: string;
  rolEstructural: RolEstructuralSegmento;
  longitudM: number;
  fuerzaAxialkN: number;       // Tracción (+) o Compresión (-)
  momentoFlectorMaxkNm: number;
  fuerzaCortantekN: number;
  deflexionMaxMm: number;
  deflexionAdmisibleMm: number; // L/240 o L/360 segun RNE E.090
  esfuerzoMaxMPa: number;
  esfuerzoAdmisibleMPa: number; // 0.6 * Fy
  ratioDemandaCapacidad: number; // D/C Ratio (< 1.0 OK, > 1.0 Sobrecargado)
  estadoCumplimiento: 'CUMPLE' | 'SOBRECARGADO';
}

export interface StructuralAnalysisReport {
  normativaReferencia: string; // "RNE E.020 / E.030 / E.090 (Perú)"
  pesoPropioTotalKg: number;
  reaccionTotalBasekN: number;
  deflexionMaximaGlobalMm: number;
  ratioDemandaCapacidadMax: number;
  resultadoGlobal: 'CUMPLE' | 'REQUIERE_REFUERZO';
  miembros: MemberStructuralResult[];
}
