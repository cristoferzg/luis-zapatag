// Types for Puertas y Ventanas (Carpintería Metálica y de Aluminio)

export type TipoElementoCarpinteria = 
  | 'reja' 
  | 'puerta' 
  | 'porton' 
  | 'ventana' 
  | 'cerco' 
  | 'baranda' 
  | 'cerramiento' 
  | 'mampara' 
  | 'otro';

export type FormaGeometria = 'rectangular' | 'arco_superior' | 'medio_punto' | 'diagonal' | 'irregular';

export type MaterialFamilia = 'acero' | 'aluminio' | 'fierro' | 'pvc' | 'acero_inoxidable';

export type TipoAperturaPuerta = 
  | 'batiente_derecha' 
  | 'batiente_izquierda' 
  | 'doble_batiente' 
  | 'vaiven' 
  | 'corrediza' 
  | 'plegadiza';

export type TipoAperturaPorton = 
  | 'corredizo_1_hoja' 
  | 'corredizo_2_hojas' 
  | 'telescopico' 
  | 'batiente_1_hoja' 
  | 'batiente_2_hojas' 
  | 'levadizo' 
  | 'seccional';

export type TipoAperturaVentana = 
  | 'fija' 
  | 'corrediza_2_hojas' 
  | 'corrediza_3_hojas' 
  | 'corrediza_4_hojas' 
  | 'batiente' 
  | 'proyectante' 
  | 'oscilobatiente' 
  | 'guillotina' 
  | 'mixta';

export type TipoRellenoPanel = 
  | 'plancha_lisa'
  | 'plancha_perforada'
  | 'plancha_estriada'
  | 'plancha_galvanizada'
  | 'aluzinc'
  | 'reja_vertical'
  | 'reja_horizontal'
  | 'reja_cuadricula'
  | 'reja_diagonal'
  | 'malla_electrosoldada'
  | 'malla_expandida'
  | 'malla_ciclonica'
  | 'vidrio_simple'
  | 'vidrio_templado'
  | 'vidrio_laminado'
  | 'vidrio_doble_dvh'
  | 'vidrio_traslucido'
  | 'policarbonato'
  | 'persiana_celosia'
  | 'vacio';

export interface PerfilCatalogo {
  id: string;
  nombre: string;
  familia: MaterialFamilia;
  categoria: 'tubo_rectangular' | 'tubo_cuadrado' | 'tubo_redondo' | 'angulo' | 'canal_u' | 'platina' | 'perfil_t' | 'perfil_z' | 'aluminio_serie' | 'especial';
  dimensiones: string; // e.g. "3\" x 1 1/2\" x 2.0mm"
  anchoMm: number;
  altoMm: number;
  espesorMm: number;
  pesoKgPorMetro: number;
  precioPorBarra6m: number; // PEN (S/.)
  descripcion?: string;
}

export interface PanelZone {
  id: string;
  nombre: string;
  relX: number; // 0 to 1 relative to leaf width
  relY: number; // 0 to 1 relative to leaf height
  relW: number; // 0 to 1
  relH: number; // 0 to 1
  tipoRelleno: TipoRellenoPanel;
  espesorMm: number; // e.g. 1.5mm plancha, 6mm vidrio
  espaciadoRejaCm?: number;
  perfilRejaId?: string;
  colorHex?: string;
  vidrioDetalle?: {
    tipo: 'simple' | 'templado' | 'laminado' | 'doble' | 'traslucido';
    espesorMm: number;
    colorTinte: 'incoloro' | 'bronce' | 'gris' | 'azul' | 'reflejante' | 'arenado';
    precioPorM2: number;
  };
  planchaDetalle?: {
    tipo: 'lisa' | 'perforada' | 'estriada' | 'galvanizada' | 'acero' | 'aluzinc';
    calibreOEspesor: string;
    pesoKgM2: number;
    precioPorM2: number;
  };
  mallaDetalle?: {
    tipo: 'electrosoldada' | 'expandida' | 'ciclonica';
    cocada: string; // e.g. "50x50mm", "1x1 pulgada"
    precioPorM2: number;
  };
}

export interface DivisionInterior {
  id: string;
  tipo: 'montante_vertical' | 'travesaño_horizontal' | 'diagonal';
  posicionM: number; // distancia desde origen o porcentaje
  posicionPorcentaje: number; // 0 to 100
  perfilId: string;
  longitudM: number;
}

export interface AccesorioItem {
  id: string;
  categoria: 'cerradura' | 'bisagra' | 'manija' | 'pasador' | 'rueda' | 'riel' | 'guia' | 'tope' | 'brazo' | 'automatizacion' | 'otro';
  nombre: string;
  descripcion: string;
  unidad: 'und' | 'jgo' | 'm' | 'par';
  cantidad: number;
  precioUnitario: number; // PEN
  proveedor?: string;
  incluido: boolean;
}

export interface PuertaVentanaDesign {
  id: string;
  tipoElemento: TipoElementoCarpinteria;
  nombre: string;
  descripcion: string;
  forma: FormaGeometria;
  radioArcoM?: number; // para arco superior o medio punto
  anguloInclinacion?: number; // para diagonal
  
  // Dimensiones exteriores del vano
  anchoM: number;
  altoM: number;
  altoFlechaArcoM?: number; // altura de la flecha del arco si aplica
  
  // Hojas
  numHojas: number;
  sentidoApertura: string;
  aperturaDireccion: 'derecha' | 'izquierda' | 'doble' | 'interior' | 'exterior';
  
  // Portón específico
  portonConfig?: {
    tipo: TipoAperturaPorton;
    puertaPeatonalIntegrada: boolean;
    peatonalAnchoM: number;
    peatonalAltoM: number;
    peatonalPosXM: number;
    automatizado: boolean;
    tipoRiel: 'angulo_piso' | 'canal_u_piso' | 'colgante_pesado';
    longitudCremalleraM: number;
    tipoRuedas: 'v_groove_3' | 'v_groove_4' | 'u_groove_3' | 'colgante_doble';
    cantRuedas: number;
  };

  // Ventana específica
  ventanaConfig?: {
    tipo: TipoAperturaVentana;
    aluminioSerie?: string;
    numDivisionesHoriz: number;
    numDivisionesVert: number;
    conRejaIntegrada: boolean;
    conMallaMosquitera: boolean;
  };

  // Reja específica
  rejaConfig?: {
    orientacion: 'vertical' | 'horizontal' | 'cuadricula' | 'diagonal' | 'decorativa';
    perfilBarraId: string;
    separacionObjetivoCm: number;
    separacionRealCalculadaCm: number;
    cantBarrasCalculadas: number;
    puntasLanza: boolean;
    tipoPunta?: 'flecha_hierro' | 'corona' | 'corte_45' | 'ninguna';
  };

  // Perfiles seleccionados
  perfilMarcoId: string;
  perfilBastidorId: string;
  perfilRefuerzoId: string;
  
  // Bastidor y divisiones
  divisiones: DivisionInterior[];
  
  // Paneles de relleno (zonas)
  paneles: PanelZone[];
  
  // Accesorios
  accesorios: AccesorioItem[];
  
  // Acabado y pintura
  acabado: {
    tipoPintura: 'anticorrosivo_simple' | 'epoxico_poliuretano' | 'electrostatica_horno' | 'anodizado_aluminio' | 'galvanizado_caliente';
    colorNombre: string;
    colorHex: string;
    manosPintura: number;
    costoPorM2: number;
  };
  
  // Mano de obra
  manoDeObra: {
    diasEstimados: number;
    costoOperarioDia: number;
    costoAyudanteDia: number;
    cantOperarios: number;
    cantAyudantes: number;
  };

  // Fecha y metadatos
  fechaCreacion: string;
  ultimaModificacion: string;
}

// Despiece (Cutting List)
export interface PiezaDespiece {
  id: string;
  marca: string; // ej. M-01 (Marco Superior), B-01 (Bastidor Izquierdo), R-01 (Barrote)
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
  longitudComercialM: number;
  piezas: {
    marca: string;
    longitudMm: number;
  }[];
  longitudUsadaMm: number;
  retazoMm: number;
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

export interface MetradoCarpinteriaItem {
  id: string;
  categoria: 'perfiles' | 'planchas' | 'vidrios' | 'mallas' | 'accesorios' | 'consumibles' | 'pintura' | 'mano_obra';
  descripcion: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  detalle?: string;
}

export interface PresupuestoCarpinteriaResult {
  items: MetradoCarpinteriaItem[];
  subtotalMateriales: number;
  subtotalAccesorios: number;
  subtotalConsumibles: number;
  subtotalPintura: number;
  subtotalManoObra: number;
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
