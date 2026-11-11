// Catálogo técnico de perfiles, materiales, cerrajería y plantillas para carpintería metálica y aluminio
import { 
  PerfilCatalogo, 
  AccesorioItem, 
  PuertaVentanaDesign, 
  TipoElementoCarpinteria 
} from './carpinteriaTypes';

export const PERFILES_CATALOGO: PerfilCatalogo[] = [
  // Tubos Rectangulares de Acero ASTM A500
  {
    id: 'rect-4x2-2.5',
    nombre: 'Tubo Rectangular 4" x 2" x 2.5mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '100 x 50 x 2.5 mm',
    anchoMm: 100,
    altoMm: 50,
    espesorMm: 2.5,
    pesoKgPorMetro: 5.56,
    precioPorBarra6m: 165.00,
    descripcion: 'Ideal para marcos de portones pesados y columnas perimétricas'
  },
  {
    id: 'rect-4x2-2.0',
    nombre: 'Tubo Rectangular 4" x 2" x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '100 x 50 x 2.0 mm',
    anchoMm: 100,
    altoMm: 50,
    espesorMm: 2.0,
    pesoKgPorMetro: 4.51,
    precioPorBarra6m: 135.00,
    descripcion: 'Marco perimétrico estándar para portones residenciales'
  },
  {
    id: 'rect-3x1.5-2.0',
    nombre: 'Tubo Rectangular 3" x 1 1/2" x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '75 x 38 x 2.0 mm',
    anchoMm: 75,
    altoMm: 38,
    espesorMm: 2.0,
    pesoKgPorMetro: 3.42,
    precioPorBarra6m: 102.00,
    descripcion: 'Perfil clásico de marco para puertas principales y bastidor de portones'
  },
  {
    id: 'rect-3x1.5-1.5',
    nombre: 'Tubo Rectangular 3" x 1 1/2" x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '75 x 38 x 1.5 mm',
    anchoMm: 75,
    altoMm: 38,
    espesorMm: 1.5,
    pesoKgPorMetro: 2.60,
    precioPorBarra6m: 78.00,
    descripcion: 'Bastidor intermedio y divisiones para puertas y portones'
  },
  {
    id: 'rect-2x1-1.5',
    nombre: 'Tubo Rectangular 2" x 1" x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '50 x 25 x 1.5 mm',
    anchoMm: 50,
    altoMm: 25,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.68,
    precioPorBarra6m: 52.00,
    descripcion: 'Travesaños, refuerzos y marcos de ventanas metálicas'
  },
  {
    id: 'rect-2x1-2.0',
    nombre: 'Tubo Rectangular 2" x 1" x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '50 x 25 x 2.0 mm',
    anchoMm: 50,
    altoMm: 25,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.20,
    precioPorBarra6m: 68.00,
    descripcion: 'Bastidor resistente y perfiles de refuerzo'
  },

  // Tubos Cuadrados de Acero ASTM A500
  {
    id: 'cuad-2x2-2.0',
    nombre: 'Tubo Cuadrado 2" x 2" x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '50 x 50 x 2.0 mm',
    anchoMm: 50,
    altoMm: 50,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.98,
    precioPorBarra6m: 88.00,
    descripcion: 'Marcos de puertas robustas, postes de cerco y bastidores'
  },
  {
    id: 'cuad-1.5x1.5-1.5',
    nombre: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '38 x 38 x 1.5 mm',
    anchoMm: 38,
    altoMm: 38,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.70,
    precioPorBarra6m: 53.00,
    descripcion: 'Bastidor estándar de hojas de puerta, rejas y cerramientos'
  },
  {
    id: 'cuad-1.5x1.5-2.0',
    nombre: 'Tubo Cuadrado 1 1/2" x 1 1/2" x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '38 x 38 x 2.0 mm',
    anchoMm: 38,
    altoMm: 38,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.22,
    precioPorBarra6m: 69.00,
    descripcion: 'Bastidor de hojas para uso intensivo de seguridad'
  },
  {
    id: 'cuad-1.25x1.25-1.5',
    nombre: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '32 x 32 x 1.5 mm',
    anchoMm: 32,
    altoMm: 32,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.42,
    precioPorBarra6m: 45.00,
    descripcion: 'Marcos de rejas livianas y puertas secundarias'
  },
  {
    id: 'cuad-1x1-1.5',
    nombre: 'Tubo Cuadrado 1" x 1" x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '25 x 25 x 1.5 mm',
    anchoMm: 25,
    altoMm: 25,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.10,
    precioPorBarra6m: 35.00,
    descripcion: 'Marcos de ventanas interiores, divisiones y barrotes'
  },
  {
    id: 'cuad-3/4x3/4-1.2',
    nombre: 'Tubo Cuadrado 3/4" x 3/4" x 1.2mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '19 x 19 x 1.2 mm',
    anchoMm: 19,
    altoMm: 19,
    espesorMm: 1.2,
    pesoKgPorMetro: 0.68,
    precioPorBarra6m: 22.00,
    descripcion: 'Barrotes decorativos y rejas livianas'
  },
  {
    id: 'cuad-1/2x1/2-solido',
    nombre: 'Fierro Cuadrado Macizo 1/2" (12.7mm)',
    familia: 'fierro',
    categoria: 'tubo_cuadrado',
    dimensiones: '12.7 x 12.7 mm sólido',
    anchoMm: 12.7,
    altoMm: 12.7,
    espesorMm: 12.7,
    pesoKgPorMetro: 1.27,
    precioPorBarra6m: 38.00,
    descripcion: 'Barrote macizo de alta seguridad para rejas residenciales'
  },
  {
    id: 'cuad-5/8x5/8-solido',
    nombre: 'Fierro Cuadrado Macizo 5/8" (15.9mm)',
    familia: 'fierro',
    categoria: 'tubo_cuadrado',
    dimensiones: '15.9 x 15.9 mm sólido',
    anchoMm: 15.9,
    altoMm: 15.9,
    espesorMm: 15.9,
    pesoKgPorMetro: 1.98,
    precioPorBarra6m: 58.00,
    descripcion: 'Barrote macizo pesado para rejas de máxima protección'
  },

  // Perfiles Redondos
  {
    id: 'red-tub-1-1.5',
    nombre: 'Tubo Redondo 1" (25.4mm) x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_redondo',
    dimensiones: 'Ø 25.4 x 1.5 mm',
    anchoMm: 25.4,
    altoMm: 25.4,
    espesorMm: 1.5,
    pesoKgPorMetro: 0.88,
    precioPorBarra6m: 29.00,
    descripcion: 'Pasamanos, barrotes tubulares y barandas'
  },
  {
    id: 'red-tub-1.5-1.5',
    nombre: 'Tubo Redondo 1 1/2" (38.1mm) x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_redondo',
    dimensiones: 'Ø 38.1 x 1.5 mm',
    anchoMm: 38.1,
    altoMm: 38.1,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.35,
    precioPorBarra6m: 44.00,
    descripcion: 'Pasamanos ergonómico y postes de baranda'
  },
  {
    id: 'red-tub-2-1.5',
    nombre: 'Tubo Redondo 2" (50.8mm) x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_redondo',
    dimensiones: 'Ø 50.8 x 1.5 mm',
    anchoMm: 50.8,
    altoMm: 50.8,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.82,
    precioPorBarra6m: 59.00,
    descripcion: 'Columna tubular y baranda pesada'
  },

  // Ángulos y Platinas
  {
    id: 'ang-1.5x1/8',
    nombre: 'Ángulo Estructural 1 1/2" x 1 1/2" x 1/8" (3.0mm)',
    familia: 'acero',
    categoria: 'angulo',
    dimensiones: '38.1 x 38.1 x 3.0 mm',
    anchoMm: 38.1,
    altoMm: 38.1,
    espesorMm: 3.0,
    pesoKgPorMetro: 1.73,
    precioPorBarra6m: 52.00,
    descripcion: 'Riel inferior para portón corredizo y refuerzos perimetrales'
  },
  {
    id: 'ang-1x1/8',
    nombre: 'Ángulo Estructural 1" x 1" x 1/8" (3.0mm)',
    familia: 'acero',
    categoria: 'angulo',
    dimensiones: '25.4 x 25.4 x 3.0 mm',
    anchoMm: 25.4,
    altoMm: 25.4,
    espesorMm: 3.0,
    pesoKgPorMetro: 1.12,
    precioPorBarra6m: 36.00,
    descripcion: 'Marcos de ventana con junquillo y topes'
  },
  {
    id: 'plat-1x3/16',
    nombre: 'Platina de Fierro 1" x 3/16" (4.5mm)',
    familia: 'fierro',
    categoria: 'platina',
    dimensiones: '25.4 x 4.5 mm',
    anchoMm: 25.4,
    altoMm: 4.5,
    espesorMm: 4.5,
    pesoKgPorMetro: 0.90,
    precioPorBarra6m: 28.00,
    descripcion: 'Junquillos para planchas, pletinas de unión y topes batientes'
  },
  {
    id: 'plat-1.5x3/16',
    nombre: 'Platina de Fierro 1 1/2" x 3/16" (4.5mm)',
    familia: 'fierro',
    categoria: 'platina',
    dimensiones: '38.1 x 4.5 mm',
    anchoMm: 38.1,
    altoMm: 4.5,
    espesorMm: 4.5,
    pesoKgPorMetro: 1.35,
    precioPorBarra6m: 42.00,
    descripcion: 'Solera de anclaje y refuerzos longitudinales'
  },

  // Perfiles de Aluminio (Sistemas Estandarizados)
  {
    id: 'alu-serie-20-marco',
    nombre: 'Perfil Aluminio Serie 20 - Marco Perimétrico',
    familia: 'aluminio',
    categoria: 'aluminio_serie',
    dimensiones: 'Serie 20 (Ventanería Corrediza)',
    anchoMm: 50,
    altoMm: 35,
    espesorMm: 1.2,
    pesoKgPorMetro: 0.65,
    precioPorBarra6m: 55.00,
    descripcion: 'Sistema tradicional corredizo para ventanas residenciales'
  },
  {
    id: 'alu-serie-20-hoja',
    nombre: 'Perfil Aluminio Serie 20 - Zócalo y Enganche de Hoja',
    familia: 'aluminio',
    categoria: 'aluminio_serie',
    dimensiones: 'Serie 20 Hojas',
    anchoMm: 32,
    altoMm: 45,
    espesorMm: 1.2,
    pesoKgPorMetro: 0.58,
    precioPorBarra6m: 48.00,
    descripcion: 'Perfiles de hoja corrediza Serie 20 con felpa cortaviento'
  },
  {
    id: 'alu-serie-25-marco',
    nombre: 'Perfil Aluminio Serie 25 - Marco Pesado Hermético',
    familia: 'aluminio',
    categoria: 'aluminio_serie',
    dimensiones: 'Serie 25 (Gama Media-Alta)',
    anchoMm: 65,
    altoMm: 40,
    espesorMm: 1.4,
    pesoKgPorMetro: 0.85,
    precioPorBarra6m: 75.00,
    descripcion: 'Mayor aislamiento acústico y resistencia al viento'
  },
  {
    id: 'alu-serie-3825-mampara',
    nombre: 'Perfil Aluminio Mampara Serie 3825',
    familia: 'aluminio',
    categoria: 'aluminio_serie',
    dimensiones: 'Mamparas y Puertas Vidriadas',
    anchoMm: 80,
    altoMm: 45,
    espesorMm: 1.6,
    pesoKgPorMetro: 1.15,
    precioPorBarra6m: 110.00,
    descripcion: 'Diseñado para grandes luces de mamparas piso-a-techo'
  }
];

export const ACCESORIOS_CATALOGO: AccesorioItem[] = [
  // Cerraduras
  {
    id: 'acc-forte-3g',
    categoria: 'cerradura',
    nombre: 'Cerradura de Sobreponer Forte Clásica 3 Golpes',
    descripcion: 'Cilindro exterior de latón, cerrojo de 3 bulones macizos de acero, 3 llaves',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 85.00,
    proveedor: 'Forte Perú',
    incluido: true
  },
  {
    id: 'acc-yale-sobreponer',
    categoria: 'cerradura',
    nombre: 'Cerradura de Sobreponer Yale Blindada 3 Golpes',
    descripcion: 'Alta seguridad con caja protectora de acero y cerrojo antichoque',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 125.00,
    proveedor: 'Yale',
    incluido: false
  },
  {
    id: 'acc-embutir-manija',
    categoria: 'cerradura',
    nombre: 'Cerradura de Embutir con Manija Acero Inoxidable',
    descripcion: 'Caja embutida, pestillo reversible y manija tubular de acero inoxidable satinado',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 110.00,
    proveedor: 'Geo / Kantoc',
    incluido: false
  },
  {
    id: 'acc-cisa-electrica',
    categoria: 'cerradura',
    nombre: 'Cerradura Eléctrica Cisa 12V con Pulsador',
    descripcion: 'Apertura remota para intercomunicador y cerrojo basculante de alta seguridad',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 240.00,
    proveedor: 'Cisa',
    incluido: false
  },

  // Bisagras
  {
    id: 'acc-bisagra-tubular-3/4',
    categoria: 'bisagra',
    nombre: 'Bisagra Tubular con Bolilla 3/4" x 3 1/2" (Acero Soldable)',
    descripcion: 'Con bolilla de acero templado antifricción para giro suave de puertas pesadas',
    unidad: 'par',
    cantidad: 2,
    precioUnitario: 16.00,
    proveedor: 'Nacional',
    incluido: true
  },
  {
    id: 'acc-bisagra-tubular-1',
    categoria: 'bisagra',
    nombre: 'Bisagra Tubular con Bolilla 1" x 4 1/2" (Pesada para Portón)',
    descripcion: 'Especial para portones abatibles vehiculares con carga superior a 150 kg',
    unidad: 'par',
    cantidad: 3,
    precioUnitario: 28.00,
    proveedor: 'Nacional',
    incluido: false
  },
  {
    id: 'acc-bisagra-capuchina-4',
    categoria: 'bisagra',
    nombre: 'Bisagra Capuchina 4" x 4" Acero Cincado',
    descripcion: 'Para puertas de paso y mamparas batientes de aluminio o tubo liviano',
    unidad: 'par',
    cantidad: 2,
    precioUnitario: 14.00,
    proveedor: 'Importado',
    incluido: false
  },

  // Accesorios de Portón Corredizo
  {
    id: 'acc-ruedas-v-3',
    categoria: 'rueda',
    nombre: 'Juego de Ruedas de Acero Torneado Canal V de 3" (con Rodajes Blindados)',
    descripcion: '2 ruedas de 75mm canal en V con caja protectora soldable para riel de ángulo',
    unidad: 'jgo',
    cantidad: 1,
    precioUnitario: 75.00,
    proveedor: 'Nacional',
    incluido: true
  },
  {
    id: 'acc-ruedas-v-4',
    categoria: 'rueda',
    nombre: 'Juego de Ruedas de Acero Torneado Canal V de 4" (Pesadas de 100mm)',
    descripcion: 'Para portones de más de 300 kg, doble rodamiento blindado sellado',
    unidad: 'jgo',
    cantidad: 1,
    precioUnitario: 115.00,
    proveedor: 'Nacional',
    incluido: false
  },
  {
    id: 'acc-riel-piso-angulo',
    categoria: 'riel',
    nombre: 'Riel Inferior de Ángulo 1 1/2" x 1/8" con Pernos de Anclaje',
    descripcion: 'Guía de piso nivelada con empotramiento para deslizamiento de ruedas en V',
    unidad: 'm',
    cantidad: 6,
    precioUnitario: 22.00,
    proveedor: 'Taller',
    incluido: true
  },
  {
    id: 'acc-guia-superior-nylon',
    categoria: 'guia',
    nombre: 'Guía Superior Doble Rodillo de Nylon Antidescarrilamiento',
    descripcion: 'Soporte regulable con rodillos de nylon para silenciar el recorrido',
    unidad: 'jgo',
    cantidad: 1,
    precioUnitario: 45.00,
    proveedor: 'Importado',
    incluido: true
  },
  {
    id: 'acc-tope-carrera-goma',
    categoria: 'tope',
    nombre: 'Topes de Fin de Carrera Soldables con Goma Amortiguadora',
    descripcion: '2 topes metálicos con taco de neopreno de alto impacto para apertura y cierre',
    unidad: 'jgo',
    cantidad: 1,
    precioUnitario: 35.00,
    proveedor: 'Taller',
    incluido: true
  },

  // Automatización
  {
    id: 'acc-cremallera-m4',
    categoria: 'automatizacion',
    nombre: 'Cremallera Metálica Zincada Módulo 4 (con separadores)',
    descripcion: 'Pistas dentadas para acople de piñón de motor corredizo (metro lineal)',
    unidad: 'm',
    cantidad: 4,
    precioUnitario: 32.00,
    proveedor: 'Universal',
    incluido: false
  },
  {
    id: 'acc-base-motor',
    categoria: 'automatizacion',
    nombre: 'Base Metálica Nivelable Soldable para Motor Corredizo',
    descripcion: 'Placa de acero 4.5mm con ranuras de ajuste y pernos de anclaje',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 50.00,
    proveedor: 'Taller',
    incluido: false
  },

  // Manijas y Pasadores
  {
    id: 'acc-manijon-inox-60',
    categoria: 'manija',
    nombre: 'Manijón Barral Tubular Recto Acero Inox 304 (60 cm)',
    descripcion: 'Elegante tirador para puerta principal de alta durabilidad sin oxidación',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 95.00,
    proveedor: 'Importado',
    incluido: false
  },
  {
    id: 'acc-pasador-piso-techo',
    categoria: 'pasador',
    nombre: 'Pasador Vertical de Varilla 1/2" con Portacandado (Piso / Techo)',
    descripcion: 'Pasador de 40cm forjado para fijar la hoja pasiva en puertas y portones dobles',
    unidad: 'und',
    cantidad: 2,
    precioUnitario: 22.00,
    proveedor: 'Nacional',
    incluido: true
  },
  {
    id: 'acc-cierrapuerta-aereo',
    categoria: 'brazo',
    nombre: 'Cierrapuertas Hidráulico Aéreo con Brazo Articulado (45-65 kg)',
    descripcion: 'Velocidad de cierre y golpe final regulable, apto para alto tránsito',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 85.00,
    proveedor: 'Dorma / Geo',
    incluido: false
  }
];

// Presets y Plantillas Inteligentes por Tipo de Elemento
export const DEFAULT_DESIGNS: Record<TipoElementoCarpinteria, PuertaVentanaDesign> = {
  puerta: {
    id: 'preset-puerta-01',
    tipoElemento: 'puerta',
    nombre: 'Puerta Principal de Ingreso',
    descripcion: 'Puerta peatonal de seguridad con marco de 3"x1.5" y diseño mixto (plancha inferior + rejas/vidrio superior)',
    forma: 'rectangular',
    anchoM: 1.00,
    altoM: 2.20,
    numHojas: 1,
    sentidoApertura: 'Batiente Interior Derecha',
    aperturaDireccion: 'derecha',
    perfilMarcoId: 'rect-3x1.5-2.0',
    perfilBastidorId: 'cuad-1.5x1.5-1.5',
    perfilRefuerzoId: 'rect-2x1-1.5',
    divisiones: [
      {
        id: 'div-1',
        tipo: 'travesaño_horizontal',
        posicionM: 1.00,
        posicionPorcentaje: 45,
        perfilId: 'rect-2x1-1.5',
        longitudM: 0.90
      }
    ],
    paneles: [
      {
        id: 'panel-inf',
        nombre: 'Panel Inferior de Acero',
        relX: 0,
        relY: 0.45,
        relW: 1.0,
        relH: 0.55,
        tipoRelleno: 'plancha_lisa',
        espesorMm: 1.5,
        colorHex: '#334155',
        planchaDetalle: {
          tipo: 'lisa',
          calibreOEspesor: '1/16" (1.5mm) LAF',
          pesoKgM2: 12.0,
          precioPorM2: 85.00
        }
      },
      {
        id: 'panel-sup',
        nombre: 'Panel Superior de Barrotes',
        relX: 0,
        relY: 0,
        relW: 1.0,
        relH: 0.45,
        tipoRelleno: 'reja_vertical',
        espesorMm: 12.7,
        espaciadoRejaCm: 11,
        perfilRejaId: 'cuad-1/2x1/2-solido',
        colorHex: '#0f172a'
      }
    ],
    accesorios: [
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-forte-3g')!, incluido: true },
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-bisagra-tubular-3/4')!, cantidad: 3, incluido: true },
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-manijon-inox-60')!, incluido: true }
    ],
    acabado: {
      tipoPintura: 'anticorrosivo_simple',
      colorNombre: 'Negro Mate Grafito',
      colorHex: '#1e293b',
      manosPintura: 2,
      costoPorM2: 24.00
    },
    manoDeObra: {
      diasEstimados: 1.5,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  },

  porton: {
    id: 'preset-porton-01',
    tipoElemento: 'porton',
    nombre: 'Portón Vehicular Corredizo',
    descripcion: 'Portón corredizo pesado de 3.50m con puerta peatonal de escape integrada y preparación para motor automático',
    forma: 'rectangular',
    anchoM: 3.50,
    altoM: 2.40,
    numHojas: 1,
    sentidoApertura: 'Corredizo Lateral Izquierda',
    aperturaDireccion: 'izquierda',
    portonConfig: {
      tipo: 'corredizo_1_hoja',
      puertaPeatonalIntegrada: true,
      peatonalAnchoM: 0.85,
      peatonalAltoM: 2.00,
      peatonalPosXM: 0.30,
      automatizado: true,
      tipoRiel: 'angulo_piso',
      longitudCremalleraM: 4.0,
      tipoRuedas: 'v_groove_3',
      cantRuedas: 2
    },
    perfilMarcoId: 'rect-4x2-2.0',
    perfilBastidorId: 'rect-3x1.5-2.0',
    perfilRefuerzoId: 'rect-2x1-1.5',
    divisiones: [
      {
        id: 'div-p-1',
        tipo: 'travesaño_horizontal',
        posicionM: 1.20,
        posicionPorcentaje: 50,
        perfilId: 'rect-2x1-1.5',
        longitudM: 3.40
      }
    ],
    paneles: [
      {
        id: 'panel-porton-inf',
        nombre: 'Zona Inferior Plancha Estriada / Lisa',
        relX: 0,
        relY: 0.5,
        relW: 1.0,
        relH: 0.5,
        tipoRelleno: 'plancha_lisa',
        espesorMm: 1.5,
        planchaDetalle: {
          tipo: 'lisa',
          calibreOEspesor: '1/16" (1.5mm) LAF',
          pesoKgM2: 12.0,
          precioPorM2: 85.00
        }
      },
      {
        id: 'panel-porton-sup',
        nombre: 'Zona Superior Barrotes de Seguridad',
        relX: 0,
        relY: 0,
        relW: 1.0,
        relH: 0.5,
        tipoRelleno: 'reja_vertical',
        espesorMm: 12.7,
        espaciadoRejaCm: 12,
        perfilRejaId: 'cuad-1/2x1/2-solido'
      }
    ],
    accesorios: [
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-ruedas-v-3')!, incluido: true },
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-riel-piso-angulo')!, cantidad: 7, incluido: true },
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-guia-superior-nylon')!, incluido: true },
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-tope-carrera-goma')!, incluido: true },
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-forte-3g')!, incluido: true },
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-cremallera-m4')!, cantidad: 4, incluido: true },
      { ...ACCESORIOS_CATALOGO.find(a => a.id === 'acc-base-motor')!, incluido: true }
    ],
    acabado: {
      tipoPintura: 'epoxico_poliuretano',
      colorNombre: 'Gris Forja Martillado',
      colorHex: '#334155',
      manosPintura: 2,
      costoPorM2: 32.00
    },
    manoDeObra: {
      diasEstimados: 3.5,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  },

  ventana: {
    id: 'preset-ventana-01',
    tipoElemento: 'ventana',
    nombre: 'Ventana Corrediza con Reja Integrada',
    descripcion: 'Ventana de 2 hojas corredizas en aluminio o acero, con marco perimétrico de seguridad y vidrio de 6mm',
    forma: 'rectangular',
    anchoM: 1.50,
    altoM: 1.20,
    numHojas: 2,
    sentidoApertura: 'Corrediza Doble Hoja',
    aperturaDireccion: 'doble',
    ventanaConfig: {
      tipo: 'corrediza_2_hojas',
      aluminioSerie: 'Serie 20',
      numDivisionesHoriz: 0,
      numDivisionesVert: 1,
      conRejaIntegrada: true,
      conMallaMosquitera: false
    },
    perfilMarcoId: 'cuad-1.5x1.5-1.5',
    perfilBastidorId: 'rect-2x1-1.5',
    perfilRefuerzoId: 'cuad-1x1-1.5',
    divisiones: [],
    paneles: [
      {
        id: 'panel-vidrio-1',
        nombre: 'Vidrio Templado Incoloro 6mm (Hoja Izq)',
        relX: 0,
        relY: 0,
        relW: 0.5,
        relH: 1.0,
        tipoRelleno: 'vidrio_templado',
        espesorMm: 6,
        vidrioDetalle: {
          tipo: 'templado',
          espesorMm: 6,
          colorTinte: 'incoloro',
          precioPorM2: 120.00
        }
      },
      {
        id: 'panel-vidrio-2',
        nombre: 'Vidrio Templado Incoloro 6mm (Hoja Der)',
        relX: 0.5,
        relY: 0,
        relW: 0.5,
        relH: 1.0,
        tipoRelleno: 'vidrio_templado',
        espesorMm: 6,
        vidrioDetalle: {
          tipo: 'templado',
          espesorMm: 6,
          colorTinte: 'incoloro',
          precioPorM2: 120.00
        }
      }
    ],
    accesorios: [
      {
        id: 'acc-pestillos-ventana',
        categoria: 'otro',
        nombre: 'Cierres de Caracol y Rodamientos para Ventana',
        descripcion: '2 cierres de embutir y 4 garruchas de poliamida con rulemán',
        unidad: 'jgo',
        cantidad: 1,
        precioUnitario: 45.00,
        proveedor: 'Nacional',
        incluido: true
      }
    ],
    acabado: {
      tipoPintura: 'anticorrosivo_simple',
      colorNombre: 'Blanco Esmalte',
      colorHex: '#f8fafc',
      manosPintura: 2,
      costoPorM2: 20.00
    },
    manoDeObra: {
      diasEstimados: 1.0,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  },

  reja: {
    id: 'preset-reja-01',
    tipoElemento: 'reja',
    nombre: 'Reja de Seguridad Perimétrica',
    descripcion: 'Reja con marco perimétrico de tubo cuadrado 1 1/2" y barrotes de fierro cuadrado macizo 1/2" espaciados uniformemente',
    forma: 'rectangular',
    anchoM: 2.00,
    altoM: 1.50,
    numHojas: 1,
    sentidoApertura: 'Fija Empotrada',
    aperturaDireccion: 'derecha',
    rejaConfig: {
      orientacion: 'vertical',
      perfilBarraId: 'cuad-1/2x1/2-solido',
      separacionObjetivoCm: 11,
      separacionRealCalculadaCm: 10.8,
      cantBarrasCalculadas: 16,
      puntasLanza: true,
      tipoPunta: 'flecha_hierro'
    },
    perfilMarcoId: 'cuad-1.5x1.5-1.5',
    perfilBastidorId: 'cuad-1.5x1.5-1.5',
    perfilRefuerzoId: 'plat-1x3/16',
    divisiones: [
      {
        id: 'div-reja-centro',
        tipo: 'travesaño_horizontal',
        posicionM: 0.75,
        posicionPorcentaje: 50,
        perfilId: 'plat-1x3/16',
        longitudM: 1.92
      }
    ],
    paneles: [
      {
        id: 'panel-reja-tot',
        nombre: 'Barrotes Verticales Macizos',
        relX: 0,
        relY: 0,
        relW: 1.0,
        relH: 1.0,
        tipoRelleno: 'reja_vertical',
        espesorMm: 12.7,
        espaciadoRejaCm: 11,
        perfilRejaId: 'cuad-1/2x1/2-solido'
      }
    ],
    accesorios: [
      {
        id: 'acc-puntas-lanza',
        categoria: 'otro',
        nombre: 'Puntas de Lanza Forjadas de Hierro Fundido',
        descripcion: 'Remate ornamental superior antiescalamiento',
        unidad: 'und',
        cantidad: 16,
        precioUnitario: 4.50,
        proveedor: 'Fundición',
        incluido: true
      },
      {
        id: 'acc-orejas-anclaje',
        categoria: 'otro',
        nombre: 'Orejas de Fijación y Tarugos de Expansión 3/8"',
        descripcion: '6 puntos de empotramiento perimetral al vano de concreto',
        unidad: 'jgo',
        cantidad: 1,
        precioUnitario: 25.00,
        proveedor: 'Taller',
        incluido: true
      }
    ],
    acabado: {
      tipoPintura: 'anticorrosivo_simple',
      colorNombre: 'Negro Mate Antióxido',
      colorHex: '#0f172a',
      manosPintura: 2,
      costoPorM2: 22.00
    },
    manoDeObra: {
      diasEstimados: 1.0,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  },

  cerco: {
    id: 'preset-cerco-01',
    tipoElemento: 'cerco',
    nombre: 'Cerco Perimétrico Modular',
    descripcion: 'Módulo de cerco de seguridad con postes tubulares y malla electrosoldada o barrotes',
    forma: 'rectangular',
    anchoM: 3.00,
    altoM: 2.00,
    numHojas: 1,
    sentidoApertura: 'Fijo',
    aperturaDireccion: 'derecha',
    perfilMarcoId: 'cuad-2x2-2.0',
    perfilBastidorId: 'cuad-1.5x1.5-1.5',
    perfilRefuerzoId: 'rect-2x1-1.5',
    divisiones: [],
    paneles: [
      {
        id: 'panel-malla',
        nombre: 'Malla Electrosoldada Galvanizada 2"x2"',
        relX: 0,
        relY: 0,
        relW: 1.0,
        relH: 1.0,
        tipoRelleno: 'malla_electrosoldada',
        espesorMm: 3.0,
        mallaDetalle: {
          tipo: 'electrosoldada',
          cocada: '50x50 mm (2" x 2")',
          precioPorM2: 38.00
        }
      }
    ],
    accesorios: [],
    acabado: {
      tipoPintura: 'anticorrosivo_simple',
      colorNombre: 'Verde Oscuro Perimetral',
      colorHex: '#14532d',
      manosPintura: 2,
      costoPorM2: 20.00
    },
    manoDeObra: {
      diasEstimados: 1.5,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  },

  baranda: {
    id: 'preset-baranda-01',
    tipoElemento: 'baranda',
    nombre: 'Baranda Metálica para Escalera o Balcón',
    descripcion: 'Baranda moderna con pasamanos tubular de 2", parantes cuadrados y divisiones horizontales',
    forma: 'rectangular',
    anchoM: 2.50,
    altoM: 1.00,
    numHojas: 1,
    sentidoApertura: 'Fija',
    aperturaDireccion: 'derecha',
    perfilMarcoId: 'red-tub-2-1.5',
    perfilBastidorId: 'cuad-1.5x1.5-1.5',
    perfilRefuerzoId: 'cuad-3/4x3/4-1.2',
    divisiones: [
      {
        id: 'div-b-1',
        tipo: 'travesaño_horizontal',
        posicionM: 0.25,
        posicionPorcentaje: 25,
        perfilId: 'cuad-3/4x3/4-1.2',
        longitudM: 2.40
      },
      {
        id: 'div-b-2',
        tipo: 'travesaño_horizontal',
        posicionM: 0.50,
        posicionPorcentaje: 50,
        perfilId: 'cuad-3/4x3/4-1.2',
        longitudM: 2.40
      },
      {
        id: 'div-b-3',
        tipo: 'travesaño_horizontal',
        posicionM: 0.75,
        posicionPorcentaje: 75,
        perfilId: 'cuad-3/4x3/4-1.2',
        longitudM: 2.40
      }
    ],
    paneles: [
      {
        id: 'panel-baranda-lineas',
        nombre: 'Líneas Horizontales de Protección',
        relX: 0,
        relY: 0,
        relW: 1.0,
        relH: 1.0,
        tipoRelleno: 'vacio',
        espesorMm: 0
      }
    ],
    accesorios: [],
    acabado: {
      tipoPintura: 'epoxico_poliuretano',
      colorNombre: 'Negro Satinado Forja',
      colorHex: '#1e293b',
      manosPintura: 2,
      costoPorM2: 28.00
    },
    manoDeObra: {
      diasEstimados: 1.2,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  },

  cerramiento: {
    id: 'preset-cerramiento-01',
    tipoElemento: 'cerramiento',
    nombre: 'Cerramiento Acristalado / Celosía',
    descripcion: 'Estructura perimétrica modular para cerramiento de terraza, azotea o patio',
    forma: 'rectangular',
    anchoM: 3.00,
    altoM: 2.20,
    numHojas: 2,
    sentidoApertura: 'Mixto',
    aperturaDireccion: 'derecha',
    perfilMarcoId: 'rect-3x1.5-2.0',
    perfilBastidorId: 'cuad-1.5x1.5-1.5',
    perfilRefuerzoId: 'rect-2x1-1.5',
    divisiones: [],
    paneles: [
      {
        id: 'panel-policarb',
        nombre: 'Plancha de Policarbonato Alveolar 8mm / Vidrio',
        relX: 0,
        relY: 0,
        relW: 1.0,
        relH: 1.0,
        tipoRelleno: 'policarbonato',
        espesorMm: 8
      }
    ],
    accesorios: [],
    acabado: {
      tipoPintura: 'anticorrosivo_simple',
      colorNombre: 'Gris Grafito',
      colorHex: '#334155',
      manosPintura: 2,
      costoPorM2: 24.00
    },
    manoDeObra: {
      diasEstimados: 2.0,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  },

  mampara: {
    id: 'preset-mampara-01',
    tipoElemento: 'mampara',
    nombre: 'Mampara Corrediza de Vidrio y Aluminio Serie 3825',
    descripcion: 'Mampara de piso a techo con vidrio templado de seguridad 8mm y perfiles anodizados',
    forma: 'rectangular',
    anchoM: 2.40,
    altoM: 2.30,
    numHojas: 2,
    sentidoApertura: 'Corrediza 2 Hojas',
    aperturaDireccion: 'doble',
    perfilMarcoId: 'alu-serie-3825-mampara',
    perfilBastidorId: 'alu-serie-25-marco',
    perfilRefuerzoId: 'alu-serie-20-hoja',
    divisiones: [],
    paneles: [
      {
        id: 'mampara-vidrio-izq',
        nombre: 'Vidrio Templado 8mm Incoloro (Hoja Fija)',
        relX: 0,
        relY: 0,
        relW: 0.5,
        relH: 1.0,
        tipoRelleno: 'vidrio_templado',
        espesorMm: 8,
        vidrioDetalle: {
          tipo: 'templado',
          espesorMm: 8,
          colorTinte: 'incoloro',
          precioPorM2: 155.00
        }
      },
      {
        id: 'mampara-vidrio-der',
        nombre: 'Vidrio Templado 8mm Incoloro (Hoja Móvil)',
        relX: 0.5,
        relY: 0,
        relW: 0.5,
        relH: 1.0,
        tipoRelleno: 'vidrio_templado',
        espesorMm: 8,
        vidrioDetalle: {
          tipo: 'templado',
          espesorMm: 8,
          colorTinte: 'incoloro',
          precioPorM2: 155.00
        }
      }
    ],
    accesorios: [
      {
        id: 'acc-cerradura-pico-loro',
        categoria: 'cerradura',
        nombre: 'Cerradura Pico de Loro para Mampara con Llave Tetra',
        descripcion: 'Cierre de seguridad con gancho para mampara corrediza',
        unidad: 'und',
        cantidad: 1,
        precioUnitario: 65.00,
        proveedor: 'Importado',
        incluido: true
      },
      {
        id: 'acc-garruchas-pesadas',
        categoria: 'rueda',
        nombre: 'Juego de Garruchas Dobles de Acero con Rulemán para Serie 3825',
        descripcion: 'Capacidad de hasta 120 kg por hoja',
        unidad: 'jgo',
        cantidad: 1,
        precioUnitario: 80.00,
        proveedor: 'Importado',
        incluido: true
      }
    ],
    acabado: {
      tipoPintura: 'anodizado_aluminio',
      colorNombre: 'Aluminio Negro Mate Anodizado',
      colorHex: '#0f172a',
      manosPintura: 1,
      costoPorM2: 30.00
    },
    manoDeObra: {
      diasEstimados: 1.5,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  },

  otro: {
    id: 'preset-otro-01',
    tipoElemento: 'otro',
    nombre: 'Estructura Metálica Personalizada',
    descripcion: 'Diseño libre de carpintería metálica configurada a medida',
    forma: 'rectangular',
    anchoM: 2.00,
    altoM: 2.00,
    numHojas: 1,
    sentidoApertura: 'Personalizada',
    aperturaDireccion: 'derecha',
    perfilMarcoId: 'rect-3x1.5-2.0',
    perfilBastidorId: 'cuad-1.5x1.5-1.5',
    perfilRefuerzoId: 'rect-2x1-1.5',
    divisiones: [],
    paneles: [
      {
        id: 'panel-libre-1',
        nombre: 'Panel Central',
        relX: 0,
        relY: 0,
        relW: 1.0,
        relH: 1.0,
        tipoRelleno: 'reja_vertical',
        espesorMm: 12.7,
        espaciadoRejaCm: 12,
        perfilRejaId: 'cuad-1/2x1/2-solido'
      }
    ],
    accesorios: [],
    acabado: {
      tipoPintura: 'anticorrosivo_simple',
      colorNombre: 'Gris Base',
      colorHex: '#475569',
      manosPintura: 2,
      costoPorM2: 22.00
    },
    manoDeObra: {
      diasEstimados: 1.0,
      costoOperarioDia: 130.00,
      costoAyudanteDia: 90.00,
      cantOperarios: 1,
      cantAyudantes: 1
    },
    fechaCreacion: new Date().toISOString(),
    ultimaModificacion: new Date().toISOString()
  }
};
