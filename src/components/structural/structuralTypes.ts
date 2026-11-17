export type SteelMaterial = 'A36' | 'A500 Gr. B' | 'A572 Gr. 50' | 'Galvanizado';

export type ProfileType = 
  | 'IPE' 
  | 'W' 
  | 'Tubo Rectangular' 
  | 'Tubo Cuadrado' 
  | 'Tubo Redondo' 
  | 'Perfil C (Costanera)' 
  | 'Ángulo L'
  | 'tubular_cuadrado'
  | 'tubular_rectangular'
  | 'perfil_c'
  | 'perfil_w_h';

export interface ProfileDefinition {
  id: string;
  name: string;
  type: ProfileType;
  weightKgM: number; // kg per linear meter
  heightMm: number;  // Altura h (mm)
  widthMm: number;   // Ancho b (mm)
  thicknessMm: number; // Espesor e (mm)
  areaCm2: number;
  IxCm4: number;     // Inercia eje fuerte
  ixCm4?: number;    // Alias para compatibilidad
  SxCm3: number;     // Modulo resistente eje fuerte
}

export interface Point2D {
  x: number; // m en plano horizontal
  y: number; // m en plano horizontal
  z?: number; // m cota de elevación
}

export interface EdgeSegment {
  startIndex: number;
  endIndex: number;
  p1: Point2D;
  p2: Point2D;
  length: number; // m
  hasGutter: boolean;
  gutterType?: string;
  hasDownspout?: boolean;
}

export interface RoofVoid {
  id: string;
  nombre: string;
  vertices: Point2D[];
  areaM2?: number;
  descripcion?: string;
}

export interface RoofSector {
  id: string;
  nombre: string; // e.g. "SECTOR A", "SECTOR B"
  color: string; // Hex color for fill/borders
  vertices: Point2D[]; // Polygon boundary (e.g. 4+ points)
  tipoTecho?: TipoTecho;
  alturaBase?: number; // m (e.g. 3.00)
  alturaLadoAlto: number; // m (e.g. 3.80)
  alturaLadoBajo: number; // m (e.g. 3.00)
  pendientePct: number; // % (e.g. 8)
  pendienteGrados?: number;
  direccionCaida: DireccionCaida | 'angulo_personalizado';
  anguloCaidaGrados?: number; // 0 a 360 grados
  sistemaCobertura?: SistemaCobertura;
  materialCobertura?: string;
  isLocked?: boolean;
  aluzinc?: {
    tipo?: string;
    perfil?: string;
    calibre?: string;
    color?: string;
    orientacion?: 'Vertical' | 'Horizontal';
  };
  panelTermoacustico?: {
    tipo?: string;
    aislamiento?: string;
    tipoAislamiento?: string;
    espesorTotalMm?: number;
    espesorAislamientoMm?: number;
    calibreExterior?: string;
    calibreInterior?: string;
    color?: string;
  };
  correasConfig?: {
    perfilId: string;
    separacionM: number;
    orientacion?: 'horizontal' | 'vertical' | 'diagonal' | 'perpendicular_caida' | 'longitudinal';
    direccion?: 'horizontal' | 'vertical' | 'diagonal';
  };
  vigasConfig?: {
    perfilId?: string;
    direccion?: 'transversal' | 'longitudinal' | 'diagonal';
  };
  canaletaBordes?: number[]; // Índices de segmentos perimetrales con canaleta
  bajantes?: Array<{
    id: string;
    edgeIndex: number;
    fraccion: number; // 0..1 sobre el lado
    diametroPulg: string;
    alturaM: number;
  }>;
  esExistente?: boolean; // Para modo "LEVANTAMIENTO"
  acopladoAlTecho?: boolean; // Si true, acoplado y coplanar al plano del techo principal
  esTranslucido?: boolean; // Cobertura translúcida / policarbonato
  tipoTranslucido?: 'policarbonato_alveolar' | 'policarbonato_ondulado' | 'fibra_vidrio' | 'acrilico' | string;
  colorTranslucido?: 'Verde' | 'Azul' | 'Blanco' | 'Opalino' | 'Cristal' | string;
  opacidadTranslucido?: number; // 0.2 a 0.8
}

export interface StructuralGrid {
  ejesX: Array<{ id: string; etiqueta: string; x: number }>;
  ejesY: Array<{ id: string; etiqueta: string; y: number }>;
}

export type ProjectMode = 'diseno_nuevo' | 'levantamiento' | 'modificar_existente' | 'diseño_libre';
export type CreationMethod = 'dibujar_planta' | 'ingresar_dimensiones' | 'usar_plantilla' | 'plantilla' | 'dimensiones';

export interface ColumnElement {
  id: string;
  tag: string; // e.g. "C-01"
  x: number;   // metros en planta
  y: number;   // metros en planta
  altura: number; // metros (Z)
  alturaM?: number; // alias
  baseZ?: number;  // metros (Z base, standard 0)
  profileId: string;
  material: SteelMaterial;
  basePlate?: boolean;
  anchorBoltsCount?: number;
  rotacion?: number;
  isLocked?: boolean;
  isCustom?: boolean; // When user explicitly edited height or properties
}

export interface BeamElement {
  id: string;
  tag: string; // e.g. "V-01" or "TJ-01"
  startNode: { x: number; y: number; z: number };
  endNode: { x: number; y: number; z: number };
  startColId?: string;
  endColId?: string;
  columnaInicioId?: string;
  columnaFinId?: string;
  tipoEstructural?: string;
  longitudM?: number;
  profileId: string;
  material: SteelMaterial;
  type: 'principal' | 'secundaria' | 'tijeral_cuerda' | 'tijeral_diagonal' | 'tijeral_montante' | 'arriostre';
  zLevelPlacement?: 'techo_superior' | 'cuerda_inferior' | 'personalizado';
  // Configuración individual de tijeral si corresponde
  tipoTijeral?: TipoTijeral;
  patronTijeral?: PatronTijeral;
  trussHeight?: number; // m (peralte)
  trussSpan?: number;   // m (luz)
  trussSlope?: number;  // % (pendiente)
  apexRatio?: number;   // 0.5 para simétrico, 0.33 para asimétrico
  isLocked?: boolean;
}

export interface PurlinElement {
  id: string;
  tag: string; // e.g. "COR-01"
  bayIndex?: number;
  slopePos?: number; // meters along slope
  x?: number;
  y?: number;
  startNode: { x: number; y: number; z: number };
  endNode: { x: number; y: number; z: number };
  profileId: string;
  material: SteelMaterial;
  zLevelPlacement?: 'techo_superior' | 'cuerda_inferior' | 'personalizado';
  isLocked?: boolean;
}

// 1. TIPO DE TECHO
export type TipoTecho = 
  | 'una_caida'             // 1. UNA SOLA CAÍDA (cochera, patio, almacén, pegado a muro)
  | 'dos_aguas'             // 2. DOS AGUAS
  | 'dos_aguas_cumbrera'   // 3. DOS AGUAS CON CUMBRERA
  | 'casi_plano'            // 4. TECHO CASI PLANO (pendiente mínima técnica)
  | 'personalizado'         // 5. TECHO PERSONALIZADO (como forma en L de 7x9m)
  | 'parabolico'            // Arco / Parabólico
  | 'arco'                  // Alias parabólico / arco
  | 'plano'                 // Alias para plano con pendiente técnica
  | 'un_agua'               // Alias para una caída
  | 'forma_l'               // Forma en L
  | 'forma_u'               // Forma en U
  | 'poligono_libre';       // Geometría Libre / Polígono irregular

// 1.1 TIPO DE TIJERAL (ESTRUCTURAL)
export type TipoTijeral = 
  | 'dos_aguas'             // A DOS AGUAS (Simétrico con cumbrera central)
  | 'una_agua'              // UNA AGUA (Monopendiente / Cuña)
  | 'plano'                 // PLANO (Cordones paralelos / Peralte constante)
  | 'parabolico'            // PARABÓLICO / ARCO
  | 'asimetrico'            // ASIMÉTRICO (Cumbrera desplazada ej. 1/3 o 2/3)
  | 'personalizado';        // PERSONALIZADO (Nodos y alturas libres)

export type PatronTijeral = 'warren' | 'pratt' | 'howe' | 'fink' | 'king_post';

// 2. DIRECCIÓN DE CAÍDA
export type DireccionCaida = 
  | 'calle'        // HACIA LA CALLE (Frontal / ↓)
  | 'interior'     // HACIA EL INTERIOR / FONDO (Posterior / ↑)
  | 'fondo'        // HACIA EL FONDO (↑)
  | 'izquierda'    // HACIA LA IZQUIERDA (←)
  | 'derecha'      // HACIA LA DERECHA (→)
  | 'personalizada';// PERSONALIZADA (Ángulo o destino custom)

export type SistemaCobertura = 'aluzinc' | 'termoacustico' | 'sandwich' | 'policarbonato' | 'panel_termoacustico' | 'otro';
export type AluzincCalibre = '0.30 mm' | '0.35 mm' | '0.40 mm' | '0.45 mm' | '0.50 mm' | '0.60 mm' | string;
export type AluzincPerfil = 'TR4' | 'TR4 Translúcido' | 'TR5' | 'Ondulado' | 'Personalizado' | string;
export type TermoacusticoEspesor = 30 | 40 | 50 | 60 | 80 | 100 | number;

export interface StructuralGeometry {
  largo: number;       // m (longitudinal, e.g. 16.00 o 9.00)
  ancho: number;       // m (transversal / luz libre, e.g. 12.00 o 7.00)
  altura: number;      // m (altura de referencia / lado alto de columnas, e.g. 3.50)
  alturaLadoAlto?: number; // m (lado alto)
  alturaLadoBajo?: number; // m (lado bajo calculado o directo)
  modoCalculoPendiente?: 'por_pendiente' | 'por_alturas';
  pendiente: number;   // % (pendiente del techo, e.g. 3.0, 5.0, 8.0, 15.0)
  pendienteGrados?: number; // grados (ej. 4.57°)
  separacionPorticos: number; // m (e.g. 4.00)
  tipoTecho: TipoTecho;
  direccionCaida?: DireccionCaida;
  anguloCaidaGrados?: number;
  ladoCalle?: 'frontal' | 'posterior' | 'izquierda' | 'derecha';
  sistemaCobertura?: 'aluzinc' | 'termoacustico' | 'sandwich' | 'policarbonato' | 'panel_termoacustico' | 'otro';
  aluzinc?: {
    calibre?: string;
    perfil?: string;
    tipo?: string;
    color?: string;
    orientacion?: string;
  };
  panelTermoacustico?: {
    espesorTotalMm?: number;
    espesorAislamientoMm?: number;
    tipoAislamiento?: string;
    aislamiento?: string;
    tipo?: string;
    materialCaras?: string;
    calibreExterior?: string;
    calibreInterior?: string;
    color?: string;
  };
  evacuacion?: EvacuacionOptions;
  // Extra parameters
  flechaArco?: number; // meters of rise in parabolic arch (default 1.20)
  anchoCorteL?: number; // width of reduced section in L-shape (e.g. 4.00)
  largoCorteL?: number; // length of reduced section in L-shape (e.g. 2.25)
  // Truss Configuration
  tipoTijeral?: TipoTijeral;
  patronTijeral?: PatronTijeral;
  peralteTijeral?: number; // m
  esTranslucido?: boolean;
  // Parametric Free Geometry & Multi-Sector Architecture
  projectMode?: ProjectMode; // 'diseno_nuevo' | 'levantamiento' | 'modificar_existente'
  creationMethod?: CreationMethod; // 'dibujar_planta' | 'ingresar_dimensiones' | 'usar_plantilla'
  sectores?: RoofSector[];
  vacios?: RoofVoid[];
  gridConfig?: StructuralGrid;
  poligonoPrincipal?: Point2D[];
  selectedSectorId?: string;
  direccionCorreas?: 'horizontal' | 'vertical' | 'diagonal';
  direccionVigas?: 'transversal' | 'longitudinal' | 'diagonal';
  posicionCorreas?: 'sobre_cuerda_superior' | 'bajo_cuerda_inferior' | 'ambas';
  posicionVigas?: 'superior' | 'inferior' | 'en_columnas';
}

export interface StructureOptions {
  columnas: boolean;
  vigasPrincipales: boolean;
  tijerales: boolean;
  correas: boolean;
  arriostres: boolean;
  separacionCorreas: number; // m (e.g. 1.00)
  tipoTijeral: TipoTijeral;
  patronTijeral: PatronTijeral;
  direccionCorreas?: 'horizontal' | 'vertical' | 'diagonal';
  direccionVigas?: 'transversal' | 'longitudinal' | 'diagonal';
  posicionCorreas?: 'sobre_cuerda_superior' | 'bajo_cuerda_inferior' | 'ambas';
  posicionVigas?: 'superior' | 'inferior' | 'en_columnas';
}

// 3. EVACUACIÓN DE AGUA
export interface EvacuacionOptions {
  tieneCanaleta: boolean;
  tipoCanaleta?: string;
  posicionCanaleta?: string;
  canaletaMaterial?: 'Aluzinc prepintado' | 'Acero Galvanizado' | 'PVC' | 'Aluminio' | string;
  canaletaAnchoMm?: number; // e.g. 150
  canaletaAltoMm?: number;  // e.g. 120
  canaletaLongitudM?: number;
  tieneBajante?: boolean;
  bajanteCantidad?: number;
  cantBajantes?: number;
  bajanteDiametroPulg?: string;
  bajantesDiametroPulg?: string;
  bajanteMaterial?: 'PVC' | 'Fierro Galvanizado' | 'Aluzinc' | string;
  bajanteAlturaM?: number;
}

// 5. SISTEMA DE COBERTURA
export type TipoCobertura = 
  | 'Aluzinc TR4' 
  | 'Aluzinc TR5' 
  | 'Aluzinc Ondulado' 
  | 'Ondulado'
  | 'Tipo Teja'
  | 'Plano / Agrafado'
  | 'Panel Termoacústico' 
  | 'Panel Sándwich' 
  | 'Calamina' 
  | 'Policarbonato' 
  | 'Otro'
  | string;

// 6. PANEL TERMOACÚSTICO ESPECÍFICO
export interface PanelTermoacusticoOptions {
  espesorTotalMm?: number; // 30, 40, 50, 80, 100 mm
  espesorAislamientoMm?: number; // 30, 50 mm
  tipoAislamiento?: 'EPS' | 'PU' | 'PIR' | 'Lana mineral' | 'Otro' | string;
  aislamiento?: string;
  tipo?: string;
  materialCaras?: 'Aluzinc' | 'Acero prepintado' | 'Otro' | string;
  longitudPanelM?: number;
  anchoTotalM?: number; // e.g. 1.15 m
  anchoUtilM?: number;  // e.g. 1.00 m
  pesoKgM2?: number;    // e.g. 9.50 kg/m²
  desperdicioPct?: number; // e.g. 5%
}

// 7. ALUZINC ESPECÍFICO
export interface AluzincOptions {
  calibre: '0.25 mm' | '0.30 mm' | '0.35 mm' | '0.40 mm' | '0.45 mm' | '0.50 mm' | '0.60 mm' | string;
  perfil: 'TR4' | 'TR5' | 'Ondulado' | 'Otro' | string;
  longitudM?: number;
  anchoTotalM?: number; // e.g. 1.08 m
  anchoUtilM?: number;  // e.g. 1.00 m
  traslapeLateralM?: number; // e.g. 0.08 m
  traslapeLongitudinalM?: number; // e.g. 0.20 m
  orientacion: 'Vertical' | 'Horizontal';
  color: 'Azul' | 'Gris Zinc' | 'Rojo Teja' | 'Blanco' | 'Verde' | string;
  desperdicioPct?: number; // e.g. 5%
}

// Legacy CoberturaOptions for backwards compatibility
export interface CoberturaOptions {
  tipo: TipoCobertura;
  calibre: '0.25 mm' | '0.30 mm' | '0.35 mm' | '0.40 mm' | '0.45 mm' | '0.50 mm' | '0.60 mm' | string;
  orientacion: 'Vertical' | 'Horizontal';
  color: 'Azul' | 'Gris Zinc' | 'Rojo Teja' | 'Blanco' | 'Verde' | string;
  panel?: PanelTermoacusticoOptions;
  aluzincDetalle?: AluzincOptions;
}

// 11. REMATES DE TECHO
export interface RematesOptions {
  remateLateral: boolean;
  remateLateralLongitudM: number;
  remateFrontal: boolean;
  remateFrontalLongitudM: number;
  remateContraMuro: boolean;
  remateContraMuroLongitudM: number;
  cumbrera: boolean;
  cumbreraLongitudM: number;
  babero: boolean;
  baberoLongitudM: number;
  tapajuntas: boolean;
  tapajuntasLongitudM: number;
}

export interface ConexionesOptions {
  placasBase: boolean;
  espesorPlacaMm: number;
  pernosAnclaje: boolean;
  diametroPernoPulg: string; // "5/8", "3/4", "1"
  soldadura: boolean;
  tipoElectrodo: 'E6011' | 'E7018';
}

export interface MetradoItem {
  id: string;
  categoria: 'ESTRUCTURA' | 'COBERTURA' | 'EVACUACIÓN' | 'REMATES' | 'ACABADOS';
  descripcion: string;
  unidad: 'm' | 'm2' | 'kg' | 'und' | 'pza' | 'gl';
  cantidad: number;
  longitudOArea?: number;
  pesoUnitarioKg?: number;
  pesoTotalKg?: number;
  material?: string;
  observacion?: string;
  precioUnitario?: number;
  subtotal?: number;
}

export interface StructuralProject {
  id: string;
  nombre: string;
  cliente: string;
  geometria: StructuralGeometry;
  estructura: StructureOptions;
  cobertura: CoberturaOptions;
  evacuacion: EvacuacionOptions;
  remates: RematesOptions;
  conexiones: ConexionesOptions;
  columnas: ColumnElement[];
  vigas: BeamElement[];
  correas: PurlinElement[];
  updatedAt: string;
}

export interface TrussElement {
  id: string;
  tag: string; // e.g. "TIJ-01"
  startNode: { x: number; y: number; z: number };
  endNode: { x: number; y: number; z: number };
  type: 'warren' | 'pratt' | 'howe';
  topChordProfileId: string;
  bottomChordProfileId: string;
  webProfileId: string;
  heightM: number;
  panelsCount: number;
  material: SteelMaterial;
}

export type ActiveTab = 'diseño' | 'calculo' | 'metrado' | 'presupuesto' | 'planos' | '3d';
export type ViewMode2D = 'planta' | 'elevacion' | 'seccion' | 'elevacion_frontal' | 'elevacion_lateral' | '3d';
export type CADTool = 
  | 'select' 
  | 'draw_polygon' 
  | 'cota' 
  | 'pan' 
  | 'column' 
  | 'beam' 
  | 'purlin' 
  | 'truss' 
  | 'brace' 
  | 'draw_void' 
  | 'draw_translucent' 
  | 'axis' 
  | 'add_gutter' 
  | 'add_downspout' 
  | 'base_plate' 
  | 'bolt' 
  | 'custom_element' 
  | 'delete' 
  | 'measure'
  | 'slope';

