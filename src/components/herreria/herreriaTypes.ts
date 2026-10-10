// Tipos de datos para el módulo HERRERÍA de Innova Contratistas Manager

export type TipoElementoHerreria = 
  | 'puerta' 
  | 'porton' 
  | 'reja' 
  | 'ventana' 
  | 'cerco' 
  | 'baranda' 
  | 'mampara'
  | 'cerramiento'
  | 'silla'
  | 'escalera'
  | 'escalera_descanso'
  | 'escalera_caracol'
  | 'mesa'
  | 'personalizado'
  | 'reja_abanico'
  | 'techo_dos_aguas'
  | 'techo_una_agua'
  | 'techo_parabolico'
  | 'nave_industrial'
  | 'techo_policarbonato';

export type VistaHerreria = 'frontal' | 'lateral' | 'superior' | '3d';

export type MaterialFamilia = 'acero' | 'aluminio' | 'fierro' | 'acero_inoxidable' | 'especial';

export type TipoAperturaPuerta = 
  | 'izquierda' 
  | 'derecha' 
  | 'interior' 
  | 'exterior'
  | 'doble';

export type TipoAperturaPorton = 
  | 'abatible' 
  | 'corredizo' 
  | 'plegable' 
  | 'levadizo' 
  | 'personalizado';

export type TipoRellenoPanel = 
  | 'plancha'
  | 'plancha_estriada'
  | 'plancha_perforada'
  | 'malla'
  | 'aluzinc'
  | 'policarbonato'
  | 'vidrio'
  | 'reja'
  | 'otro';

export type OrientacionBarrote = 'vertical' | 'horizontal' | 'diagonal';

export type NormaAcabadoPerfil = 'LAC' | 'LAF' | 'GALVANIZADO' | 'ASTM';

export interface PerfilCatalogo {
  id: string;
  nombre: string;
  familia: MaterialFamilia;
  categoria: 'tubo_rectangular' | 'tubo_cuadrado' | 'tubo_redondo' | 'angulo' | 'canal_u' | 'platina' | 'perfil_t' | 'perfil_c' | 'perfil_z' | 'cobertura' | 'aluminio_serie' | 'especial';
  normaAcabado?: NormaAcabadoPerfil;
  dimensiones: string; // e.g. "100 x 50 x 2.0 mm"
  anchoMm: number;
  altoMm: number;
  espesorMm: number;
  pesoKgPorMetro: number;
  pesoKgM?: number;
  precioPorBarra6m: number; // PEN (S/.)
  descripcion?: string;
}

export interface HojaConfig {
  id: string;
  numero: number;
  anchoM: number;
  apertura: 'izquierda' | 'derecha' | 'fija' | 'corrediza';
}

export interface PanelZone {
  id: string;
  nombre: string;
  hojaIndex: number; // 0, 1, ... a qué hoja pertenece
  relX: number; // 0 a 1 relativo a la hoja
  relY: number; // 0 a 1 relativo a la hoja
  relW: number; // 0 a 1
  relH: number; // 0 a 1
  tipoRelleno: TipoRellenoPanel;
  espesorMm: number; // ej. 1.5mm plancha, 6mm vidrio
  colorHex?: string;
  
  // Si el panel es de tipo reja o barrotes
  rejaConfig?: {
    orientacion: OrientacionBarrote;
    perfilId: string;
    separacionObjetivoCm: number;
    separacionRealCm: number;
    cantidadBarras: number;
  };

  // Si el panel es de plancha
  planchaConfig?: {
    subtipo: 'lisa' | 'estriada' | 'perforada' | 'aluzinc' | 'acanalada' | 'machihembrada' | 'corrugada';
    calibre: string; // ej. "1/16\" (1.5mm)"
    pesoKgM2: number;
    precioM2: number;
  };

  // Si el panel es de vidrio
  vidrioConfig?: {
    subtipo: 'crudo' | 'templado' | 'laminado' | 'arenado';
    espesorMm: number;
    colorTinte: string;
    precioM2: number;
  };

  // Si el panel es de malla
  mallaConfig?: {
    tipoMalla: 'electrosoldada' | 'desplegada_expandida' | 'olimpica';
    cocada: string;
    precioM2: number;
  };
}

export interface DivisionRefuerzo {
  id: string;
  tipo: 'horizontal' | 'vertical' | 'diagonal';
  posicionM: number; // distancia desde abajo o izquierda
  porcentaje: number; // 0 a 100
  perfilId: string;
  hojaIndex?: number;
}

// Tubo personalizado ensamblable libremente como rompecabezas
export interface TuboPersonalizado {
  id: string;
  marca?: string; // T-01, T-02
  x1: number; // en metros
  y1: number;
  x2: number;
  y2: number;
  perfilId: string;
  tipoUnionInicio: '90_tope' | '45_inglete' | 'libre';
  tipoUnionFin: '90_tope' | '45_inglete' | 'libre';
  longitudM: number;
  anguloDeg: number;
  colorHex?: string;
  etiqueta?: string;
}

// Arco superior para puertas, ventanas o marcos
export interface ArcoConfig {
  activo: boolean;
  tipo: 'medio_punto' | 'rebajado' | 'ojival';
  flechaM: number; // Altura de la curvatura (m)
  perfilArcoId?: string;
  conBarrotesRadiales?: boolean;
  cantidadBarrotesArco?: number;
}

// Chapa / Cerradura configurable
export interface ChapaConfig {
  activa: boolean;
  modelo: string;
  tipo: 'sobreponer' | 'embutir' | 'electrica' | 'digital';
  posicionYM: number; // Altura sobre el piso en m
  lado: 'izquierda' | 'derecha';
  conManija: boolean;
  tipoManija?: string;
}

// Bisagras configurables
export interface BisagrasConfig {
  cantidad: number;
  tipo: 'tubular_con_pin' | 'capuchina' | 'vaiven';
  medidaPulgadas: string;
  lado: 'izquierda' | 'derecha';
  distribucion: 'automatica' | 'personalizada';
  posicionesY?: number[];
}

// Cerrojo / Pasador individual
export interface CerrojoConfig {
  id: string;
  tipo: 'horizontal' | 'vertical_suelo' | 'vertical_techo';
  posicionYM: number;
  longitudCm: number;
  lado: 'izquierda' | 'derecha' | 'centro';
  activo: boolean;
  modelo: string;
}

export interface AccesorioItem {
  id: string;
  categoria: 
    | 'cerradura' 
    | 'bisagra' 
    | 'manija' 
    | 'pasador' 
    | 'rueda' 
    | 'riel' 
    | 'guia' 
    | 'tope' 
    | 'automatizacion' 
    | 'decorativo' 
    | 'refuerzo' 
    | 'accesorio';
  nombre: string;
  descripcion: string;
  unidad: 'und' | 'jgo' | 'm' | 'par';
  cantidad: number;
  precioUnitario: number; // PEN (S/.)
  incluido: boolean;
}

// ========================================================
// CENTRO CAD PARAMÉTRICO: TIPOS DE PIEZAS, ACCESORIOS Y HERRAMIENTAS
// ========================================================

export type HerramientaCad = 
  | 'select' 
  | 'linea' 
  | 'horizontal' 
  | 'vertical' 
  | 'diagonal' 
  | 'rectangulo' 
  | 'arco' 
  | 'plancha' 
  | 'platina_tope'
  | 'cota' 
  | 'accesorio' 
  | 'mover' 
  | 'copiar' 
  | 'rotar' 
  | 'espejo' 
  | 'borrar';

export type TipoCorteCad = '90°' | '45°' | 'otro';

export interface PiezaCad {
  id: string;
  marca: string; // e.g. "P-01", "T-01"
  nombre: string; // e.g. "Parante Izquierdo", "Travesaño Superior", "Pata Delantera"
  tipo: 'perfil' | 'tubo_curvo' | 'plancha' | 'malla' | 'vidrio';
  material: MaterialFamilia;
  perfilId: string; // ID en PERFILES_CATALOGO

  // Coordenadas 3D de los extremos del eje baricéntrico (en metros)
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;

  // Medidas paramétricas
  longitudM: number;
  rotacionDeg: number; // Rotación axial de la sección (0, 90, 45, etc.)
  corteInicio: TipoCorteCad;
  corteFin: TipoCorteCad;

  // Si es un perfil curvo / arco rolado
  esCurvo?: boolean;
  flechaM?: number;
  tipoArco?: 'medio_punto' | 'rebajado' | 'ojival';
  controlX?: number;
  controlY?: number;

  // Si es una plancha o relleno
  esPlancha?: boolean;
  anchoPlanchaM?: number;
  altoPlanchaM?: number;
  espesorPlanchaMm?: number;
  subtipoPlancha?: 'lisa' | 'estriada' | 'perforada' | 'acanalada' | 'machihembrada' | 'corrugada';
  tipoRelleno?: TipoRellenoPanel;
  conPernos?: boolean; // Opción de colocar pernos en esquinas (desactivado por defecto)

  // Platina Pestaña/Tope de Hoja para Marcos
  isPlatinaTope?: boolean;
  parentFrameId?: string;
  sideTope?: 'inner' | 'outer';

  colorHex?: string;
  cantidad: number;
  grupo?: string; // e.g. 'marco', 'bastidor', 'patas', 'asiento', 'refuerzo'
  bloqueado?: boolean;
}

export type TipoAccesorioCad = 
  | 'bisagra_simple'
  | 'bisagra_reforzada'
  | 'bisagra_soldable'
  | 'bisagra_libro'
  | 'bisagra_porton'
  | 'chapa_sobreponer'
  | 'cerradura_embutir'
  | 'cerrojo_pasador'
  | 'manija_tirador'
  | 'rueda_porton'
  | 'tope'
  | 'escuadra_refuerzo'
  | 'placa_base'
  | 'tapa_embellecedor';

export interface AccesorioCad {
  id: string;
  tipo: TipoAccesorioCad;
  nombre: string;
  descripcion?: string;
  x: number;
  y: number;
  z: number;
  rotacionDeg?: number;
  lado?: 'izquierda' | 'derecha' | 'centro';
  especificacion: string;
  precioUnitario: number;
  cantidad: number;
}

export interface CotaCad {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  valorM: number;
  eje?: 'X' | 'Y' | 'alineada';
  offsetVisual?: number;
  etiqueta?: string;
  piezaId?: string;
}

export interface HerreriaDesign {
  id: string;
  tipoElemento: TipoElementoHerreria;
  nombre: string;
  descripcion: string;
  isLienzoBlanco?: boolean;

  // PIEZAS Y COMPONENTES PARAMÉTRICOS (Única fuente de verdad)
  piezas: PiezaCad[];
  accesoriosCad: AccesorioCad[];
  cotasCad: CotaCad[];

  // Dimensiones del Marco / Vano de referencia
  anchoM: number;
  altoM: number;
  profundidadMarcoMm: number;
  
  // Marco y Perfilería principal
  perfilMarcoId: string;
  perfilBastidorId: string;
  perfilRefuerzoId: string;
  
  // Hojas
  numHojas: number;
  hojas: HojaConfig[];
  
  // Sistema de Abertura
  tipoAperturaPuerta?: TipoAperturaPuerta;
  tipoAperturaPorton?: TipoAperturaPorton;
  sentidoAperturaTexto?: string;
  
  // Barrotes generales (si aplica por defecto)
  barrotesConfig: {
    activo: boolean;
    perfilId: string;
    orientacion: OrientacionBarrote;
    separacionCm: number;
    cantidad: number;
    separacionRealCm: number;
  };

  // Divisiones y refuerzos
  divisiones: DivisionRefuerzo[];

  // Tubos y Empalmes Personalizados tipo Rompecabezas (Cualquier dirección / ángulo)
  tubosPersonalizados?: TuboPersonalizado[];

  // Arco Superior Paramétrico (para puertas, ventanas, etc.)
  arco?: ArcoConfig;

  // Cerrajería y Accesorios Específicos Modificables
  chapaConfig?: ChapaConfig;
  bisagrasConfig?: BisagrasConfig;
  cerrojosList?: CerrojoConfig[];

  // Zonas / Paneles independientes (Diseños Mixtos)
  paneles: PanelZone[];

  // Accesorios y Herrajes
  accesorios: AccesorioItem[];

  // Acabado y Pintura
  acabado: {
    tipoPintura: 'anticorrosivo_simple' | 'esmalte_sintetico' | 'epoxico_poliuretano' | 'electrostatica_horno';
    colorNombre: string;
    colorHex: string;
    manosPintura: number;
    costoPorM2: number;
  };

  // Mano de Obra y Costos de Taller
  manoDeObra: {
    diasEstimados: number;
    cantOperarios: number;
    cantAyudantes: number;
    costoOperarioDia: number;
    costoAyudanteDia: number;
    costoCorteHoras: number;
    costoSoldaduraHoras: number;
    costoArmadoHoras: number;
    costoEsmeriladoHoras: number;
    costoPinturaHoras: number;
    costoInstalacion: number;
    costoTransporte: number;
  };

  fechaCreacion: string;
  ultimaModificacion: string;
}

// Despiece (Cutting List)
export interface PiezaDespiece {
  id: string;
  marca: string; // M-01, B-01, R-01, etc.
  descripcion: string;
  perfilNombre: string;
  perfilDimensiones: string;
  material: MaterialFamilia;
  longitudMm: number;
  longitudM: number;
  cantidad: number;
  corteInicio: '90°' | '45°' | 'otro';
  corteFin: '90°' | '45°' | 'otro';
  pesoUnitarioKg: number;
  pesoTotalKg: number;
  ubicacion: 'marco' | 'hoja' | 'refuerzo' | 'barrote' | 'riel' | 'otro';
}

export interface BarraOptimizada {
  barraIndex: number;
  longitudComercialM: number; // 6m, 9m, 12m
  perfilNombre: string;
  piezas: {
    marca: string;
    longitudMm: number;
  }[];
  longitudUsadaMm: number;
  sobranteMm: number;
  porcentajeAprovechamiento: number;
}

export interface DespieceResult {
  piezas: PiezaDespiece[];
  totalPiezas: number;
  longitudTotalPerfilesM: number;
  pesoTotalAceroKg: number;
  barrasComerciales6m: number;
  desperdicioEstimadoPct: number;
  optimizacionBarras: BarraOptimizada[];
}

export interface MaterialAgrupado {
  categoria: 
    | 'perfiles' 
    | 'planchas' 
    | 'mallas' 
    | 'vidrios' 
    | 'bisagras' 
    | 'cerraduras' 
    | 'ruedas' 
    | 'rieles' 
    | 'tornillos' 
    | 'soldadura' 
    | 'pintura';
  items: {
    id: string;
    nombre: string;
    unidad: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    observacion?: string;
  }[];
  subtotalCategoria: number;
}

export interface CostoDesglosado {
  materiales: number;
  corte: number;
  soldadura: number;
  armado: number;
  esmerilado: number;
  pintura: number;
  accesorios: number;
  instalacion: number;
  transporte: number;
  costoDirectoTotal: number;
  gastosGenerales: number;
  utilidad: number;
  subtotal: number;
  igv: number;
  precioTotalVenta: number;
}

export interface ItemPresupuestoHerreria {
  id: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  metrado: number;
  material: number;
  manoDeObra: number;
  precioUnitario: number;
  subtotal: number;
  observaciones: string;
}

export interface PresupuestoHerreriaResult {
  items: ItemPresupuestoHerreria[];
  costoDirecto: number;
  gastosGeneralesPct: number;
  gastosGeneralesMonto: number;
  utilidadPct: number;
  utilidadMonto: number;
  subtotalSinIgv: number;
  igvPct: number;
  igvMonto: number;
  totalPresupuestoPEN: number;
  costoPorM2PEN: number;
}
