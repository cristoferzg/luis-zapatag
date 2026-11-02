// Catálogo técnico de perfiles, materiales, cerrajería y presets de HERRERÍA
import { 
  PerfilCatalogo, 
  AccesorioItem, 
  HerreriaDesign, 
  TipoElementoHerreria,
  PiezaCad,
  AccesorioCad,
  CotaCad
} from './herreriaTypes';

export const PERFILES_CATALOGO: PerfilCatalogo[] = [
  // Tubos Rectangulares de Acero Pesados y Livianos
  {
    id: 'rect-300x100-6.0',
    nombre: 'Tubo Rectangular 300 x 100 x 6.0mm (12" x 4")',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '300 x 100 x 6.0 mm',
    anchoMm: 300,
    altoMm: 100,
    espesorMm: 6.0,
    pesoKgPorMetro: 36.5,
    precioPorBarra6m: 990.00,
    descripcion: 'Viga cajón estructural pesada para grandes luces e infraestructuras'
  },
  {
    id: 'rect-250x100-5.0',
    nombre: 'Tubo Rectangular 250 x 100 x 5.0mm (10" x 4")',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '250 x 100 x 5.0 mm',
    anchoMm: 250,
    altoMm: 100,
    espesorMm: 5.0,
    pesoKgPorMetro: 26.8,
    precioPorBarra6m: 720.00,
    descripcion: 'Viga principal y pórtico de acero industrial'
  },
  {
    id: 'rect-8x4-4.0',
    nombre: 'Tubo Rectangular 8" x 4" x 4.0mm (200x100mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '200 x 100 x 4.0 mm',
    anchoMm: 200,
    altoMm: 100,
    espesorMm: 4.0,
    pesoKgPorMetro: 18.2,
    precioPorBarra6m: 480.00,
    descripcion: 'Viga y columna pesada para mezzanines, pórticos e infraestructura'
  },
  {
    id: 'rect-6x3-3.0',
    nombre: 'Tubo Rectangular 6" x 3" x 3.0mm (150x75mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '150 x 75 x 3.0 mm',
    anchoMm: 150,
    altoMm: 75,
    espesorMm: 3.0,
    pesoKgPorMetro: 10.2,
    precioPorBarra6m: 290.00,
    descripcion: 'Marcos de portones pesados, columnas e infraestructuras'
  },
  {
    id: 'rect-6x2-3.0',
    nombre: 'Tubo Rectangular 6" x 2" x 3.0mm (150x50mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '150 x 50 x 3.0 mm',
    anchoMm: 150,
    altoMm: 50,
    espesorMm: 3.0,
    pesoKgPorMetro: 9.10,
    precioPorBarra6m: 260.00,
    descripcion: 'Perfil perimetral pesado para portones industriales'
  },
  {
    id: 'rect-6x2-2.5',
    nombre: 'Tubo Rectangular 6" x 2" x 2.5mm (150x50mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '150 x 50 x 2.5 mm',
    anchoMm: 150,
    altoMm: 50,
    espesorMm: 2.5,
    pesoKgPorMetro: 7.65,
    precioPorBarra6m: 220.00,
    descripcion: 'Marcos de portones industriales y viguetas de entrepiso'
  },
  {
    id: 'rect-6x2-2.0',
    nombre: 'Tubo Rectangular 6" x 2" x 2.0mm (150x50mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '150 x 50 x 2.0 mm',
    anchoMm: 150,
    altoMm: 50,
    espesorMm: 2.0,
    pesoKgPorMetro: 6.15,
    precioPorBarra6m: 185.00,
    descripcion: 'Marco perimetral liviano para portones corredizos'
  },
  {
    id: 'rect-4x3-3.0',
    nombre: 'Tubo Rectangular 4" x 3" x 3.0mm (100x75mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '100 x 75 x 3.0 mm',
    anchoMm: 100,
    altoMm: 75,
    espesorMm: 3.0,
    pesoKgPorMetro: 7.95,
    precioPorBarra6m: 230.00,
    descripcion: 'Columnas cortas y tijerales reforzados'
  },
  {
    id: 'rect-4x2-3.0',
    nombre: 'Tubo Rectangular 4" x 2" x 3.0mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '100 x 50 x 3.0 mm',
    anchoMm: 100,
    altoMm: 50,
    espesorMm: 3.0,
    pesoKgPorMetro: 6.62,
    precioPorBarra6m: 190.00,
    descripcion: 'Marco reforzado para portones industriales pesados'
  },
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
    descripcion: 'Marco perimetral para portones vehiculares pesados'
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
    id: 'rect-3x2-2.5',
    nombre: 'Tubo Rectangular 3" x 2" x 2.5mm (75x50mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '75 x 50 x 2.5 mm',
    anchoMm: 75,
    altoMm: 50,
    espesorMm: 2.5,
    pesoKgPorMetro: 4.60,
    precioPorBarra6m: 140.00,
    descripcion: 'Perfil intermedio para batientes y tijerales'
  },
  {
    id: 'rect-3x2-2.0',
    nombre: 'Tubo Rectangular 3" x 2" x 2.0mm (75x50mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '75 x 50 x 2.0 mm',
    anchoMm: 75,
    altoMm: 50,
    espesorMm: 2.0,
    pesoKgPorMetro: 3.75,
    precioPorBarra6m: 118.00,
    descripcion: 'Bastidor de gran resistencia para puertas y portones'
  },
  {
    id: 'rect-120x60-3.0',
    nombre: 'Tubo Rectangular 120 x 60 x 3.0mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '120 x 60 x 3.0 mm',
    anchoMm: 120,
    altoMm: 60,
    espesorMm: 3.0,
    pesoKgPorMetro: 7.90,
    precioPorBarra6m: 235.00,
    descripcion: 'Viga rectangular e infraestructura de resistencia intermedia'
  },
  {
    id: 'rect-100x40-2.0',
    nombre: 'Tubo Rectangular 100 x 40 x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '100 x 40 x 2.0 mm',
    anchoMm: 100,
    altoMm: 40,
    espesorMm: 2.0,
    pesoKgPorMetro: 4.25,
    precioPorBarra6m: 130.00,
    descripcion: 'Perfil rectangular estilizado para portones y bastidores'
  },
  {
    id: 'rect-80x60-2.5',
    nombre: 'Tubo Rectangular 80 x 60 x 2.5mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '80 x 60 x 2.5 mm',
    anchoMm: 80,
    altoMm: 60,
    espesorMm: 2.5,
    pesoKgPorMetro: 5.20,
    precioPorBarra6m: 155.00,
    descripcion: 'Marcos y traviesas pesadas'
  },
  {
    id: 'rect-80x40-2.0',
    nombre: 'Tubo Rectangular 80 x 40 x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '80 x 40 x 2.0 mm',
    anchoMm: 80,
    altoMm: 40,
    espesorMm: 2.0,
    pesoKgPorMetro: 3.65,
    precioPorBarra6m: 110.00,
    descripcion: 'Perfil rectangular estándar para marquería de portón'
  },
  // 60x40 Rectangulares (LAC / LAF / Galvanizado ASTM A500)
  {
    id: 'rect-60x40-3.0',
    nombre: 'Tubo Rectangular 60 x 40 x 3.0mm (LAC ASTM A500)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '60 x 40 x 3.0 mm',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 3.0,
    pesoKgPorMetro: 4.30,
    precioPorBarra6m: 135.00,
    descripcion: 'Perfil estructural de alta resistencia para portones y marcos pesados'
  },
  {
    id: 'rect-60x40-2.5',
    nombre: 'Tubo Rectangular 60 x 40 x 2.5mm (LAC ASTM A500)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '60 x 40 x 2.5 mm',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 2.5,
    pesoKgPorMetro: 3.68,
    precioPorBarra6m: 115.00,
    descripcion: 'Perfil rectangular de alta rigidez para bastidores de portón y cerramientos'
  },
  {
    id: 'rect-60x40-2.0',
    nombre: 'Tubo Rectangular 60 x 40 x 2.0mm (LAC ASTM A500)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '60 x 40 x 2.0 mm',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.98,
    precioPorBarra6m: 95.00,
    descripcion: 'Perfil estándar de cerrajería de 60x40mm para marcos, puertas y rejas'
  },
  {
    id: 'rect-60x40-1.8',
    nombre: 'Tubo Rectangular 60 x 40 x 1.8mm (LAC ASTM A500)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '60 x 40 x 1.8 mm',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 1.8,
    pesoKgPorMetro: 2.68,
    precioPorBarra6m: 85.00,
    descripcion: 'Bastidores intermedios y marcos de portón 60x40mm'
  },
  {
    id: 'rect-60x40-1.5',
    nombre: 'Tubo Rectangular 60 x 40 x 1.5mm (LAF / Carpintería)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAF',
    dimensiones: '60 x 40 x 1.5 mm',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 1.5,
    pesoKgPorMetro: 2.26,
    precioPorBarra6m: 74.00,
    descripcion: 'Bastidores livianos y traviesas de herrería 60x40mm'
  },
  {
    id: 'rect-60x40-1.2',
    nombre: 'Tubo Rectangular 60 x 40 x 1.2mm (LAF / LAB / Carpintería)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAF',
    dimensiones: '60 x 40 x 1.2 mm',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 1.2,
    pesoKgPorMetro: 1.82,
    precioPorBarra6m: 60.00,
    descripcion: 'Cerrajería ligera, divisiones y marcos livianos 60x40mm'
  },
  {
    id: 'rect-60x40-3.0-galv',
    nombre: 'Tubo Rectangular 60 x 40 x 3.0mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '60 x 40 x 3.0 mm Galv',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 3.0,
    pesoKgPorMetro: 4.50,
    precioPorBarra6m: 155.00,
    descripcion: 'Tubo galvanizado en caliente reforzado para portones industriales anticorrosión'
  },
  {
    id: 'rect-60x40-2.5-galv',
    nombre: 'Tubo Rectangular 60 x 40 x 2.5mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '60 x 40 x 2.5 mm Galv',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 2.5,
    pesoKgPorMetro: 3.80,
    precioPorBarra6m: 135.00,
    descripcion: 'Tubo galvanizado en caliente para portones exteriores anticorrosión'
  },
  {
    id: 'rect-60x40-2.0-galv',
    nombre: 'Tubo Rectangular 60 x 40 x 2.0mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '60 x 40 x 2.0 mm Galv',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 2.0,
    pesoKgPorMetro: 3.10,
    precioPorBarra6m: 112.00,
    descripcion: 'Tubo galvanizado para marcos y rejas expuestas a intemperie y humedad'
  },
  {
    id: 'rect-60x40-1.5-galv',
    nombre: 'Tubo Rectangular 60 x 40 x 1.5mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '60 x 40 x 1.5 mm Galv',
    anchoMm: 60,
    altoMm: 40,
    espesorMm: 1.5,
    pesoKgPorMetro: 2.35,
    precioPorBarra6m: 88.00,
    descripcion: 'Tubo galvanizado liviano para cercos y marquería exterior'
  },

  // 60x30 Rectangulares (LAC / LAF / Galvanizado ASTM A500)
  {
    id: 'rect-60x30-3.0',
    nombre: 'Tubo Rectangular 60 x 30 x 3.0mm (LAC ASTM A500)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '60 x 30 x 3.0 mm',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 3.0,
    pesoKgPorMetro: 3.75,
    precioPorBarra6m: 120.00,
    descripcion: 'Perfil rectangular de alta rigidez para parantes y bastidores esbeltos'
  },
  {
    id: 'rect-60x30-2.5',
    nombre: 'Tubo Rectangular 60 x 30 x 2.5mm (LAC ASTM A500)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '60 x 30 x 2.5 mm',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 2.5,
    pesoKgPorMetro: 3.20,
    precioPorBarra6m: 102.00,
    descripcion: 'Perfil 60x30mm para marquería de portón, marcos de reja y batientes'
  },
  {
    id: 'rect-60x30-2.0',
    nombre: 'Tubo Rectangular 60 x 30 x 2.0mm (LAC ASTM A500)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '60 x 30 x 2.0 mm',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.62,
    precioPorBarra6m: 84.00,
    descripcion: 'Perfil estándar de cerrajería 60x30mm para puertas y rejas'
  },
  {
    id: 'rect-60x30-1.8',
    nombre: 'Tubo Rectangular 60 x 30 x 1.8mm (LAC ASTM A500)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '60 x 30 x 1.8 mm',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 1.8,
    pesoKgPorMetro: 2.38,
    precioPorBarra6m: 76.00,
    descripcion: 'Perfil intermedio 60x30mm para marcos y divisiones'
  },
  {
    id: 'rect-60x30-1.5',
    nombre: 'Tubo Rectangular 60 x 30 x 1.5mm (LAF / Carpintería)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAF',
    dimensiones: '60 x 30 x 1.5 mm',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 1.5,
    pesoKgPorMetro: 2.00,
    precioPorBarra6m: 65.00,
    descripcion: 'Perfil liviano 60x30mm para cerramientos y ventanas'
  },
  {
    id: 'rect-60x30-1.2',
    nombre: 'Tubo Rectangular 60 x 30 x 1.2mm (LAF / LAB / Carpintería)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAF',
    dimensiones: '60 x 30 x 1.2 mm',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 1.2,
    pesoKgPorMetro: 1.62,
    precioPorBarra6m: 54.00,
    descripcion: 'Perfil delgado 60x30mm para divisiones ornamentales'
  },
  {
    id: 'rect-60x30-3.0-galv',
    nombre: 'Tubo Rectangular 60 x 30 x 3.0mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '60 x 30 x 3.0 mm Galv',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 3.0,
    pesoKgPorMetro: 3.90,
    precioPorBarra6m: 138.00,
    descripcion: 'Tubo galvanizado 60x30mm de alto espesor resistente a ambientes costeros e industriales'
  },
  {
    id: 'rect-60x30-2.5-galv',
    nombre: 'Tubo Rectangular 60 x 30 x 2.5mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '60 x 30 x 2.5 mm Galv',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 2.5,
    pesoKgPorMetro: 3.32,
    precioPorBarra6m: 118.00,
    descripcion: 'Tubo galvanizado 60x30mm resistente a corrosión e intemperie'
  },
  {
    id: 'rect-60x30-2.0-galv',
    nombre: 'Tubo Rectangular 60 x 30 x 2.0mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '60 x 30 x 2.0 mm Galv',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.74,
    precioPorBarra6m: 98.00,
    descripcion: 'Tubo galvanizado estándar 60x30mm para rejas de jardín y exteriores'
  },
  {
    id: 'rect-60x30-1.5-galv',
    nombre: 'Tubo Rectangular 60 x 30 x 1.5mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '60 x 30 x 1.5 mm Galv',
    anchoMm: 60,
    altoMm: 30,
    espesorMm: 1.5,
    pesoKgPorMetro: 2.08,
    precioPorBarra6m: 78.00,
    descripcion: 'Tubo galvanizado liviano 60x30mm para cerramientos exteriores'
  },
  // --- FAMILIA COMPLETA 30 x 50 mm / 2" x 1 1/2" (Tubo Rectangular) ---
  {
    id: 'rect-50x30-3.0',
    nombre: 'Tubo Rectangular 2" x 1 1/2" x 3.0mm (50 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '50 x 30 x 3.0 mm',
    anchoMm: 50,
    altoMm: 30,
    espesorMm: 3.0,
    pesoKgPorMetro: 3.38,
    precioPorBarra6m: 108.00,
    descripcion: 'Tubo rectangular 2" x 1 1/2" de 3.0mm espesor pesado para marcos y tijerales'
  },
  {
    id: 'rect-50x30-2.5',
    nombre: 'Tubo Rectangular 2" x 1 1/2" x 2.5mm (50 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '50 x 30 x 2.5 mm',
    anchoMm: 50,
    altoMm: 30,
    espesorMm: 2.5,
    pesoKgPorMetro: 2.92,
    precioPorBarra6m: 94.00,
    descripcion: 'Tubo 2" x 1 1/2" de 2.5mm espesor para bastidores de portón y estructuras'
  },
  {
    id: 'rect-50x30-2.0',
    nombre: 'Tubo Rectangular 2" x 1 1/2" x 2.0mm (50 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '50 x 30 x 2.0 mm',
    anchoMm: 50,
    altoMm: 30,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.38,
    precioPorBarra6m: 76.00,
    descripcion: 'Tubo 2" x 1 1/2" de 2.0mm espesor para marcos de puertas y rejas'
  },
  {
    id: 'rect-50x30-1.8',
    nombre: 'Tubo Rectangular 2" x 1 1/2" x 1.8mm (50 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '50 x 30 x 1.8 mm',
    anchoMm: 50,
    altoMm: 30,
    espesorMm: 1.8,
    pesoKgPorMetro: 2.15,
    precioPorBarra6m: 69.00,
    descripcion: 'Tubo 2" x 1 1/2" de 1.8mm espesor para marquería de ventanas y bastidores'
  },
  {
    id: 'rect-50x30-1.5',
    nombre: 'Tubo Rectangular 2" x 1 1/2" x 1.5mm (50 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAF',
    dimensiones: '50 x 30 x 1.5 mm',
    anchoMm: 50,
    altoMm: 30,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.81,
    precioPorBarra6m: 58.00,
    descripcion: 'Tubo 2" x 1 1/2" de 1.5mm espesor para herrería liviana y cerramientos'
  },
  {
    id: 'rect-50x30-1.2',
    nombre: 'Tubo Rectangular 2" x 1 1/2" x 1.2mm (50 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAF',
    dimensiones: '50 x 30 x 1.2 mm',
    anchoMm: 50,
    altoMm: 30,
    espesorMm: 1.2,
    pesoKgPorMetro: 1.46,
    precioPorBarra6m: 48.00,
    descripcion: 'Tubo 2" x 1 1/2" de 1.2mm espesor para rejas decorativas y junquillos'
  },
  {
    id: 'rect-50x30-2.0-galv',
    nombre: 'Tubo Rectangular 2" x 1 1/2" x 2.0mm Galvanizado (50 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '50 x 30 x 2.0 mm Galv',
    anchoMm: 50,
    altoMm: 30,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.48,
    precioPorBarra6m: 89.00,
    descripcion: 'Tubo 2" x 1 1/2" galvanizado resistente a óxido para intemperie'
  },

  // --- FAMILIA COMPLETA 40 x 30 mm / 1 1/2" x 1" (Tubo Rectangular) ---
  {
    id: 'rect-40x30-2.5',
    nombre: 'Tubo Rectangular 1 1/2" x 1" x 2.5mm (40 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '40 x 30 x 2.5 mm',
    anchoMm: 40,
    altoMm: 30,
    espesorMm: 2.5,
    pesoKgPorMetro: 2.52,
    precioPorBarra6m: 82.00,
    descripcion: 'Tubo 1 1/2" x 1" de 2.5mm espesor para marcos resistentes y rejas'
  },
  {
    id: 'rect-40x30-2.0',
    nombre: 'Tubo Rectangular 1 1/2" x 1" x 2.0mm (40 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '40 x 30 x 2.0 mm',
    anchoMm: 40,
    altoMm: 30,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.06,
    precioPorBarra6m: 68.00,
    descripcion: 'Tubo 1 1/2" x 1" de 2.0mm espesor para bastidores de ventanas y puertas'
  },
  {
    id: 'rect-40x30-1.8',
    nombre: 'Tubo Rectangular 1 1/2" x 1" x 1.8mm (40 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAC',
    dimensiones: '40 x 30 x 1.8 mm',
    anchoMm: 40,
    altoMm: 30,
    espesorMm: 1.8,
    pesoKgPorMetro: 1.87,
    precioPorBarra6m: 61.00,
    descripcion: 'Tubo 1 1/2" x 1" de 1.8mm espesor para divisiones y bastidores'
  },
  {
    id: 'rect-40x30-1.5',
    nombre: 'Tubo Rectangular 1 1/2" x 1" x 1.5mm (40 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAF',
    dimensiones: '40 x 30 x 1.5 mm',
    anchoMm: 40,
    altoMm: 30,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.57,
    precioPorBarra6m: 51.00,
    descripcion: 'Tubo 1 1/2" x 1" de 1.5mm espesor para marcos ligeros de ventana y rejas'
  },
  {
    id: 'rect-40x30-1.2',
    nombre: 'Tubo Rectangular 1 1/2" x 1" x 1.2mm (40 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'LAF',
    dimensiones: '40 x 30 x 1.2 mm',
    anchoMm: 40,
    altoMm: 30,
    espesorMm: 1.2,
    pesoKgPorMetro: 1.27,
    precioPorBarra6m: 42.00,
    descripcion: 'Tubo 1 1/2" x 1" de 1.2mm espesor para adornos y cerramientos livianos'
  },
  {
    id: 'rect-40x30-2.0-galv',
    nombre: 'Tubo Rectangular 1 1/2" x 1" x 2.0mm Galvanizado (40 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '40 x 30 x 2.0 mm Galv',
    anchoMm: 40,
    altoMm: 30,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.15,
    precioPorBarra6m: 78.00,
    descripcion: 'Tubo 1 1/2" x 1" galvanizado anticorrosión para exteriores'
  },

  // --- FAMILIA COMPLETA 30 x 30 mm / 1 1/4" x 1 1/4" (Tubo Cuadrado) ---
  {
    id: 'cuad-30x30-2.5',
    nombre: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 2.5mm (30 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    normaAcabado: 'LAC',
    dimensiones: '30 x 30 x 2.5 mm',
    anchoMm: 30,
    altoMm: 30,
    espesorMm: 2.5,
    pesoKgPorMetro: 2.12,
    precioPorBarra6m: 69.00,
    descripcion: 'Tubo cuadrado 1 1/4" x 1 1/4" de 2.5mm espesor para pies derechos y pilares'
  },
  {
    id: 'cuad-30x30-2.0',
    nombre: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 2.0mm (30 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    normaAcabado: 'LAC',
    dimensiones: '30 x 30 x 2.0 mm',
    anchoMm: 30,
    altoMm: 30,
    espesorMm: 2.0,
    pesoKgPorMetro: 1.74,
    precioPorBarra6m: 57.00,
    descripcion: 'Tubo cuadrado 1 1/4" x 1 1/4" de 2.0mm espesor para parantes de rejas y portones'
  },
  {
    id: 'cuad-30x30-1.8',
    nombre: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 1.8mm (30 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    normaAcabado: 'LAC',
    dimensiones: '30 x 30 x 1.8 mm',
    anchoMm: 30,
    altoMm: 30,
    espesorMm: 1.8,
    pesoKgPorMetro: 1.58,
    precioPorBarra6m: 52.00,
    descripcion: 'Tubo cuadrado 1 1/4" x 1 1/4" de 1.8mm espesor para protecciones y rejas'
  },
  {
    id: 'cuad-30x30-1.5',
    nombre: 'Tubo Cuadrado 1 1/4" x 1 1/4" x 1.5mm (30 x 30 mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    normaAcabado: 'LAF',
    dimensiones: '30 x 30 x 1.5 mm (3x3 cm)',
    anchoMm: 30,
    altoMm: 30,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.33,
    precioPorBarra6m: 44.00,
    descripcion: 'Tubo cuadrado 3x3 cm de 1.5mm espesor para cerrajería residencial'
  },
  {
    id: 'cuad-30x30-1.2',
    nombre: 'Tubo Cuadrado 30mm x 30mm (3 x 3 cm) x 1.2mm Espesor [Liviano]',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    normaAcabado: 'LAF',
    dimensiones: '30 x 30 x 1.2 mm (3x3 cm)',
    anchoMm: 30,
    altoMm: 30,
    espesorMm: 1.2,
    pesoKgPorMetro: 1.08,
    precioPorBarra6m: 36.00,
    descripcion: 'Tubo cuadrado 3x3 cm de 1.2mm espesor para barandas y balaustres'
  },
  {
    id: 'cuad-30x30-2.0-galv',
    nombre: 'Tubo Cuadrado 30mm x 30mm (3 x 3 cm) x 2.0mm Galvanizado',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    normaAcabado: 'GALVANIZADO',
    dimensiones: '30 x 30 x 2.0 mm Galv (3x3 cm)',
    anchoMm: 30,
    altoMm: 30,
    espesorMm: 2.0,
    pesoKgPorMetro: 1.82,
    precioPorBarra6m: 66.00,
    descripcion: 'Tubo cuadrado 3x3 cm galvanizado anticorrosión para cercos'
  },
  {
    id: 'rect-40x20-1.5',
    nombre: 'Tubo Rectangular 40 x 20 x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '40 x 20 x 1.5 mm',
    anchoMm: 40,
    altoMm: 20,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.34,
    precioPorBarra6m: 45.00,
    descripcion: 'Traviesas livianas y divisiones de ventana'
  },
  {
    id: 'rect-30x20-1.2',
    nombre: 'Tubo Rectangular 30 x 20 x 1.2mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '30 x 20 x 1.2 mm',
    anchoMm: 30,
    altoMm: 20,
    espesorMm: 1.2,
    pesoKgPorMetro: 0.90,
    precioPorBarra6m: 32.00,
    descripcion: 'Celosías ornamentales y junquillos de puertas'
  },
  {
    id: 'rect-30x15-1.2',
    nombre: 'Tubo Rectangular 30 x 15 x 1.2mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '30 x 15 x 1.2 mm',
    anchoMm: 30,
    altoMm: 15,
    espesorMm: 1.2,
    pesoKgPorMetro: 0.81,
    precioPorBarra6m: 28.00,
    descripcion: 'Perfiles decorativos y rejas finas'
  },
  {
    id: 'rect-20x10-1.2',
    nombre: 'Tubo Rectangular 20 x 10 x 1.2mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '20 x 10 x 1.2 mm',
    anchoMm: 20,
    altoMm: 10,
    espesorMm: 1.2,
    pesoKgPorMetro: 0.52,
    precioPorBarra6m: 22.00,
    descripcion: 'Molduras y junquillos delgados de cerrajería'
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
    precioPorBarra6m: 105.00,
    descripcion: 'Marco para puertas principales y bastidor de portones'
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
    precioPorBarra6m: 80.00,
    descripcion: 'Bastidores de hojas y travesaños estructurales'
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
    pesoKgPorMetro: 2.21,
    precioPorBarra6m: 68.00,
    descripcion: 'Refuerzo horizontal de rigidez intermedia'
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
    precioPorBarra6m: 54.00,
    descripcion: 'Refuerzos horizontales, divisiones y marcos de ventana'
  },
  {
    id: 'rect-2x1-1.2',
    nombre: 'Tubo Rectangular 2" x 1" x 1.2mm',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '50 x 25 x 1.2 mm',
    anchoMm: 50,
    altoMm: 25,
    espesorMm: 1.2,
    pesoKgPorMetro: 1.36,
    precioPorBarra6m: 44.00,
    descripcion: 'Refuerzos livianos y junquillos de cerrajería'
  },
  {
    id: 'rect-1.5x3/4-1.2',
    nombre: 'Tubo Rectangular 1 1/2" x 3/4" x 1.2mm (38x19mm)',
    familia: 'acero',
    categoria: 'tubo_rectangular',
    dimensiones: '38 x 19 x 1.2 mm',
    anchoMm: 38,
    altoMm: 19,
    espesorMm: 1.2,
    pesoKgPorMetro: 1.02,
    precioPorBarra6m: 34.00,
    descripcion: 'Perfil decorativo, rejas horizontales y celosías'
  },

  // Tubos Cuadrados de Acero Pesados y Livianos
  {
    id: 'cuad-8x8-6.0',
    nombre: 'Tubo Cuadrado 8" x 8" x 6.0mm (200x200mm Heavy Column)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '200 x 200 x 6.0 mm',
    anchoMm: 200,
    altoMm: 200,
    espesorMm: 6.0,
    pesoKgPorMetro: 36.2,
    precioPorBarra6m: 980.00,
    descripcion: 'Columna estructural principal para naves de gran luz y puentes grúa'
  },
  {
    id: 'cuad-6x6-4.0',
    nombre: 'Tubo Cuadrado 6" x 6" x 4.0mm (150x150mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '150 x 150 x 4.0 mm',
    anchoMm: 150,
    altoMm: 150,
    espesorMm: 4.0,
    pesoKgPorMetro: 18.2,
    precioPorBarra6m: 480.00,
    descripcion: 'Columna de acero para naves industriales y estructuras pesadas'
  },
  {
    id: 'cuad-6x6-3.0',
    nombre: 'Tubo Cuadrado 6" x 6" x 3.0mm (150x150mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '150 x 150 x 3.0 mm',
    anchoMm: 150,
    altoMm: 150,
    espesorMm: 3.0,
    pesoKgPorMetro: 13.8,
    precioPorBarra6m: 370.00,
    descripcion: 'Columna estructural para galpones y techos industriales'
  },
  {
    id: 'cuad-5x5-3.0',
    nombre: 'Tubo Cuadrado 5" x 5" x 3.0mm (125x125mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '125 x 125 x 3.0 mm',
    anchoMm: 125,
    altoMm: 125,
    espesorMm: 3.0,
    pesoKgPorMetro: 11.4,
    precioPorBarra6m: 310.00,
    descripcion: 'Columna de apoyo y postes de gran altura'
  },
  {
    id: 'cuad-4x4-4.0',
    nombre: 'Tubo Cuadrado 4" x 4" x 4.0mm (100x100mm Heavy)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '100 x 100 x 4.0 mm',
    anchoMm: 100,
    altoMm: 100,
    espesorMm: 4.0,
    pesoKgPorMetro: 12.0,
    precioPorBarra6m: 320.00,
    descripcion: 'Columna reforzada para techos y portones pesados'
  },
  {
    id: 'cuad-4x4-3.0',
    nombre: 'Tubo Cuadrado 4" x 4" x 3.0mm (100x100mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '100 x 100 x 3.0 mm',
    anchoMm: 100,
    altoMm: 100,
    espesorMm: 3.0,
    pesoKgPorMetro: 9.10,
    precioPorBarra6m: 245.00,
    descripcion: 'Columna estándar para techos metálicos y cerramientos'
  },
  {
    id: 'cuad-4x4-2.5',
    nombre: 'Tubo Cuadrado 4" x 4" x 2.5mm (100x100mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '100 x 100 x 2.5 mm',
    anchoMm: 100,
    altoMm: 100,
    espesorMm: 2.5,
    pesoKgPorMetro: 7.62,
    precioPorBarra6m: 210.00,
    descripcion: 'Poste estructural y marcos de soporte'
  },
  {
    id: 'cuad-4x4-2.0',
    nombre: 'Tubo Cuadrado 4" x 4" x 2.0mm (100x100mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '100 x 100 x 2.0 mm',
    anchoMm: 100,
    altoMm: 100,
    espesorMm: 2.0,
    pesoKgPorMetro: 6.15,
    precioPorBarra6m: 175.00,
    descripcion: 'Postes de cerco perimétrico y portón de doble hoja'
  },
  {
    id: 'cuad-3x3-2.5',
    nombre: 'Tubo Cuadrado 3" x 3" x 2.5mm (75x75mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '75 x 75 x 2.5 mm',
    anchoMm: 75,
    altoMm: 75,
    espesorMm: 2.5,
    pesoKgPorMetro: 5.60,
    precioPorBarra6m: 155.00,
    descripcion: 'Postes de portón y tijerales secundarios'
  },
  {
    id: 'cuad-3x3-2.0',
    nombre: 'Tubo Cuadrado 3" x 3" x 2.0mm (75x75mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '75 x 75 x 2.0 mm',
    anchoMm: 75,
    altoMm: 75,
    espesorMm: 2.0,
    pesoKgPorMetro: 4.50,
    precioPorBarra6m: 130.00,
    descripcion: 'Columnas cortas de techo y marquería pesada'
  },
  {
    id: 'cuad-2.5x2.5-2.0',
    nombre: 'Tubo Cuadrado 2 1/2" x 2 1/2" x 2.0mm (65x65mm)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '65 x 65 x 2.0 mm',
    anchoMm: 65,
    altoMm: 65,
    espesorMm: 2.0,
    pesoKgPorMetro: 3.85,
    precioPorBarra6m: 112.00,
    descripcion: 'Marcos de rejas reforzadas y bastidores'
  },
  {
    id: 'cuad-2x2-3.0',
    nombre: 'Tubo Cuadrado 2" x 2" x 3.0mm (50x50mm Heavy)',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '50 x 50 x 3.0 mm',
    anchoMm: 50,
    altoMm: 50,
    espesorMm: 3.0,
    pesoKgPorMetro: 4.30,
    precioPorBarra6m: 125.00,
    descripcion: 'Marco de portón pesado de alta durabilidad'
  },
  {
    id: 'cuad-2x2-2.5',
    nombre: 'Tubo Cuadrado 2" x 2" x 2.5mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '50 x 50 x 2.5 mm',
    anchoMm: 50,
    altoMm: 50,
    espesorMm: 2.5,
    pesoKgPorMetro: 3.65,
    precioPorBarra6m: 108.00,
    descripcion: 'Postes de reja y marcos estructurados'
  },
  {
    id: 'cuad-2x2-2.0',
    nombre: 'Tubo Cuadrado 2" x 2" x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '50 x 50 x 2.0 mm',
    anchoMm: 50,
    altoMm: 50,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.97,
    precioPorBarra6m: 90.00,
    descripcion: 'Postes de reja, bastidores de portones y marcos de cerco'
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
    pesoKgPorMetro: 2.25,
    precioPorBarra6m: 68.00,
    descripcion: 'Bastidores de puerta de alta resistencia'
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
    pesoKgPorMetro: 1.72,
    precioPorBarra6m: 55.00,
    descripcion: 'Bastidores de puerta, parantes de baranda y marcos de reja'
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
    pesoKgPorMetro: 1.43,
    precioPorBarra6m: 46.00,
    descripcion: 'Marcos de ventana, barandales y divisiones'
  },
  {
    id: 'cuad-1x1-2.0',
    nombre: 'Tubo Cuadrado 1" x 1" x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '25 x 25 x 2.0 mm',
    anchoMm: 25,
    altoMm: 25,
    espesorMm: 2.0,
    pesoKgPorMetro: 1.45,
    precioPorBarra6m: 48.00,
    descripcion: 'Barrotes reforzados anti-impacto'
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
    pesoKgPorMetro: 1.12,
    precioPorBarra6m: 36.00,
    descripcion: 'Barrotes verticales de seguridad y rejas reforzadas'
  },
  {
    id: 'cuad-1x1-1.2',
    nombre: 'Tubo Cuadrado 1" x 1" x 1.2mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '25 x 25 x 1.2 mm',
    anchoMm: 25,
    altoMm: 25,
    espesorMm: 1.2,
    pesoKgPorMetro: 0.90,
    precioPorBarra6m: 29.00,
    descripcion: 'Barrotes verticales de portón demo y ventanas'
  },
  {
    id: 'cuad-3/4x3/4-1.5',
    nombre: 'Tubo Cuadrado 3/4" x 3/4" x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '20 x 20 x 1.5 mm',
    anchoMm: 20,
    altoMm: 20,
    espesorMm: 1.5,
    pesoKgPorMetro: 0.88,
    precioPorBarra6m: 29.00,
    descripcion: 'Barrotes de reja intermedia'
  },
  {
    id: 'cuad-3/4x3/4-1.2',
    nombre: 'Tubo Cuadrado 3/4" x 3/4" x 1.2mm',
    familia: 'acero',
    categoria: 'tubo_cuadrado',
    dimensiones: '20 x 20 x 1.2 mm',
    anchoMm: 20,
    altoMm: 20,
    espesorMm: 1.2,
    pesoKgPorMetro: 0.71,
    precioPorBarra6m: 24.00,
    descripcion: 'Barrotes livianos y rejas ornamentales'
  },
  {
    id: 'cuad-5/8x5/8-solido',
    nombre: 'Fierro Cuadrado Macizo 5/8" (15.8mm)',
    familia: 'fierro',
    categoria: 'tubo_cuadrado',
    dimensiones: '15.8 x 15.8 mm macizo',
    anchoMm: 16,
    altoMm: 16,
    espesorMm: 16,
    pesoKgPorMetro: 1.98,
    precioPorBarra6m: 62.00,
    descripcion: 'Barrotes macizos de máxima seguridad forjados'
  },
  {
    id: 'cuad-1/2x1/2-solido',
    nombre: 'Fierro Cuadrado Macizo 1/2" (12.7mm)',
    familia: 'fierro',
    categoria: 'tubo_cuadrado',
    dimensiones: '12.7 x 12.7 mm macizo',
    anchoMm: 13,
    altoMm: 13,
    espesorMm: 13,
    pesoKgPorMetro: 1.26,
    precioPorBarra6m: 42.00,
    descripcion: 'Barrotes forjados macizos para alta seguridad y rejas decorativas'
  },
  {
    id: 'cuad-3/8x3/8-solido',
    nombre: 'Fierro Cuadrado Macizo 3/8" (9.5mm)',
    familia: 'fierro',
    categoria: 'tubo_cuadrado',
    dimensiones: '9.5 x 9.5 mm macizo',
    anchoMm: 10,
    altoMm: 10,
    espesorMm: 10,
    pesoKgPorMetro: 0.71,
    precioPorBarra6m: 26.00,
    descripcion: 'Adornos forjados, rizos y entorchados ornamentales'
  },

  // Tubos Redondos
  {
    id: 'red-2-2.0',
    nombre: 'Tubo Redondo 2" x 2.0mm',
    familia: 'acero',
    categoria: 'tubo_redondo',
    dimensiones: 'Ø 50.8 x 2.0 mm',
    anchoMm: 51,
    altoMm: 51,
    espesorMm: 2.0,
    pesoKgPorMetro: 2.41,
    precioPorBarra6m: 76.00,
    descripcion: 'Pasamanos principal de barandas y postes'
  },
  {
    id: 'red-4-3.0',
    nombre: 'Tubo Redondo 4" x 3.0mm',
    familia: 'acero',
    categoria: 'tubo_redondo',
    dimensiones: 'Ø 114.3 x 3.0 mm',
    anchoMm: 114,
    altoMm: 114,
    espesorMm: 3.0,
    pesoKgPorMetro: 8.23,
    precioPorBarra6m: 0,
    descripcion: 'Poste central de escalera caracol y columnas'
  },
  {
    id: 'red-1-1.5',
    nombre: 'Tubo Redondo 1" x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_redondo',
    dimensiones: 'Ø 25.4 x 1.5 mm',
    anchoMm: 25,
    altoMm: 25,
    espesorMm: 1.5,
    pesoKgPorMetro: 0.88,
    precioPorBarra6m: 0,
    descripcion: 'Parantes (balaustres) de barandas'
  },
  {
    id: 'red-1.5-1.5',
    nombre: 'Tubo Redondo 1 1/2" x 1.5mm',
    familia: 'acero',
    categoria: 'tubo_redondo',
    dimensiones: 'Ø 38.1 x 1.5 mm',
    anchoMm: 38,
    altoMm: 38,
    espesorMm: 1.5,
    pesoKgPorMetro: 1.35,
    precioPorBarra6m: 45.00,
    descripcion: 'Pasamanos secundario y parantes de baranda'
  },
  {
    id: 'red-3/4-solido',
    nombre: 'Fierro Corrugado / Liso Ø 5/8" (16mm)',
    familia: 'fierro',
    categoria: 'tubo_redondo',
    dimensiones: 'Ø 16 mm macizo',
    anchoMm: 16,
    altoMm: 16,
    espesorMm: 16,
    pesoKgPorMetro: 1.58,
    precioPorBarra6m: 48.00,
    descripcion: 'Barrotes redondos macizos de alta seguridad'
  },

  // Platinas Pestaña Batiente / Tope de Marco para Hojas de Puerta
  {
    id: 'plat-tope-3/4',
    nombre: 'Platina Batiente / Pestaña Tope 3/4" x 1/8" (19x3mm)',
    familia: 'acero',
    categoria: 'platina',
    dimensiones: '19 x 3 mm',
    anchoMm: 19,
    altoMm: 19,
    espesorMm: 3.0,
    pesoKgPorMetro: 0.45,
    precioPorBarra6m: 18.00,
    descripcion: 'Pestaña tope de marco para batiente de hoja de puerta o ventana'
  },
  {
    id: 'plat-tope-1in',
    nombre: 'Platina Batiente / Pestaña Tope 1" x 1/8" (25x3mm)',
    familia: 'acero',
    categoria: 'platina',
    dimensiones: '25.4 x 3 mm',
    anchoMm: 25,
    altoMm: 25,
    espesorMm: 3.0,
    pesoKgPorMetro: 0.60,
    precioPorBarra6m: 24.00,
    descripcion: 'Pestaña tope de seguridad para marcos de portón y puerta principal'
  },
  {
    id: 'ang-1.5x1.5x3/16',
    nombre: 'Ángulo Estructural 1 1/2" x 1 1/2" x 3/16"',
    familia: 'acero',
    categoria: 'angulo',
    dimensiones: '38 x 38 x 4.5 mm',
    anchoMm: 38,
    altoMm: 38,
    espesorMm: 4.5,
    pesoKgPorMetro: 2.50,
    precioPorBarra6m: 78.00,
    descripcion: 'Cordones y diagonales de tijerales livianos'
  },
  {
    id: 'ang-2x2x3/16',
    nombre: 'Ángulo Estructural 2" x 2" x 3/16"',
    familia: 'acero',
    categoria: 'angulo',
    dimensiones: '50 x 50 x 4.5 mm',
    anchoMm: 50,
    altoMm: 50,
    espesorMm: 4.5,
    pesoKgPorMetro: 3.40,
    precioPorBarra6m: 98.00,
    descripcion: 'Cordón principal para tijerales y reticulados de techo'
  },
  {
    id: 'plat-1x3/16',
    nombre: 'Platina de Acero 1" x 3/16"',
    familia: 'acero',
    categoria: 'platina',
    dimensiones: '25.4 x 4.5 mm',
    anchoMm: 25,
    altoMm: 5,
    espesorMm: 4.5,
    pesoKgPorMetro: 0.90,
    precioPorBarra6m: 28.00,
    descripcion: 'Fijación de planchas, soleras, uniones y refuerzos'
  },
  {
    id: 'plat-1.5x3/16',
    nombre: 'Platina de Acero 1 1/2" x 3/16"',
    familia: 'acero',
    categoria: 'platina',
    dimensiones: '38 x 4.5 mm',
    anchoMm: 38,
    altoMm: 5,
    espesorMm: 4.5,
    pesoKgPorMetro: 1.34,
    precioPorBarra6m: 42.00,
    descripcion: 'Platina de unión intermedia, arriostres y pletinas de fijación'
  },
  {
    id: 'plat-2x3/16',
    nombre: 'Platina de Acero 2" x 3/16"',
    familia: 'acero',
    categoria: 'platina',
    dimensiones: '50 x 4.5 mm',
    anchoMm: 50,
    altoMm: 5,
    espesorMm: 4.5,
    pesoKgPorMetro: 1.78,
    precioPorBarra6m: 56.00,
    descripcion: 'Platina de unión para bastidores y refuerzos estructurales'
  },
  {
    id: 'plat-2x1/4',
    nombre: 'Platina de Acero 2" x 1/4" (Pesada)',
    familia: 'acero',
    categoria: 'platina',
    dimensiones: '50 x 6.3 mm',
    anchoMm: 50,
    altoMm: 6,
    espesorMm: 6.3,
    pesoKgPorMetro: 2.47,
    precioPorBarra6m: 78.00,
    descripcion: 'Platina de alta rigidez para uniones de carga, bisagras y anclajes'
  },
  {
    id: 'plat-4x1/4',
    nombre: 'Platina / Placa de Unión 4" x 1/4"',
    familia: 'acero',
    categoria: 'platina',
    dimensiones: '100 x 6.3 mm',
    anchoMm: 100,
    altoMm: 6,
    espesorMm: 6.3,
    pesoKgPorMetro: 4.95,
    precioPorBarra6m: 155.00,
    descripcion: 'Cartelas de esquina, placas base de apoyo y nudos de unión rígida'
  },
  {
    id: 'plat-1x1/8',
    nombre: 'Platina Liviana 1" x 1/8"',
    familia: 'acero',
    categoria: 'platina',
    dimensiones: '25.4 x 3.0 mm',
    anchoMm: 25,
    altoMm: 3,
    espesorMm: 3.0,
    pesoKgPorMetro: 0.60,
    precioPorBarra6m: 19.00,
    descripcion: 'Platina delgada para solapas, molduras decorativas y topes'
  },

  // Perfiles Estructurales de Techo (Correas C y Z)
  {
    id: 'perfil-c-4x2-2.0',
    nombre: 'Perfil Correa C 100 x 50 x 15 x 2.0mm (4" x 2")',
    familia: 'acero',
    categoria: 'perfil_c',
    dimensiones: '100 x 50 x 15 x 2.0 mm',
    anchoMm: 100,
    altoMm: 50,
    espesorMm: 2.0,
    pesoKgPorMetro: 3.52,
    precioPorBarra6m: 110.00,
    descripcion: 'Correa de techo estructural para luces hasta 5.00m'
  },
  {
    id: 'perfil-c-6x2-2.0',
    nombre: 'Perfil Correa C 150 x 50 x 15 x 2.0mm (6" x 2")',
    familia: 'acero',
    categoria: 'perfil_c',
    dimensiones: '150 x 50 x 15 x 2.0 mm',
    anchoMm: 150,
    altoMm: 50,
    espesorMm: 2.0,
    pesoKgPorMetro: 4.30,
    precioPorBarra6m: 138.00,
    descripcion: 'Correa de techo pesada para naves industriales y luces grandes'
  },
  {
    id: 'perfil-z-6x2-2.0',
    nombre: 'Perfil Correa Z 150 x 50 x 20 x 2.0mm (6" x 2")',
    familia: 'acero',
    categoria: 'perfil_z',
    dimensiones: '150 x 50 x 20 x 2.0 mm',
    anchoMm: 150,
    altoMm: 50,
    espesorMm: 2.0,
    pesoKgPorMetro: 4.35,
    precioPorBarra6m: 142.00,
    descripcion: 'Correa Z traslapable de alto rendimiento para grandes luces'
  },

  // Coberturas y Chapas de Techo
  {
    id: 'cobertura-tr4-0.40',
    nombre: 'Cobertura Aluzinc TR-4 e=0.40mm (M2)',
    familia: 'acero',
    categoria: 'cobertura',
    dimensiones: 'Ancho Útil 1.00m x Largo Variable',
    anchoMm: 1000,
    altoMm: 38,
    espesorMm: 0.40,
    pesoKgPorMetro: 3.80,
    precioPorBarra6m: 198.00,
    descripcion: 'Panel trapezoidal de alta resistencia anticorrosiva TR-4'
  },
  {
    id: 'cobertura-policarbonato-6mm',
    nombre: 'Policarbonato Alveolar 6mm Traslúcido (M2)',
    familia: 'especial',
    categoria: 'cobertura',
    dimensiones: 'Planos Alveolares con Protección UV',
    anchoMm: 2100,
    altoMm: 6,
    espesorMm: 6.0,
    pesoKgPorMetro: 1.30,
    precioPorBarra6m: 240.00,
    descripcion: 'Cobertura traslúcida solar de alta iluminación natural'
  },
  {
    id: 'cobertura-upvc-termoacustica',
    nombre: 'Cobertura Termoacústica UPVC 2.5mm 3 Capas (M2)',
    familia: 'especial',
    categoria: 'cobertura',
    dimensiones: 'Ancho 1.08m x Largo Variable',
    anchoMm: 1080,
    altoMm: 40,
    espesorMm: 2.5,
    pesoKgPorMetro: 3.20,
    precioPorBarra6m: 220.00,
    descripcion: 'Aislamiento térmico y acústico superior para lluvias e intemperie'
  },
  {
    id: 'plancha-acanalada-1.2',
    nombre: 'Plancha Acanalada / Corrugada LAC 1.2mm (Panel Cerrajería)',
    familia: 'acero',
    categoria: 'cobertura',
    dimensiones: '1.00m x 2.40m x 1.2mm',
    anchoMm: 1000,
    altoMm: 15,
    espesorMm: 1.2,
    pesoKgPorMetro: 11.5,
    precioPorBarra6m: 128.00,
    descripcion: 'Plancha acanalada corrugada de alta rigidez para paneles de portones, puertas y cercos'
  },
  {
    id: 'plancha-machihembrada-1.5',
    nombre: 'Plancha Machihembrada Galvanizada e=1.5mm',
    familia: 'acero',
    categoria: 'cobertura',
    dimensiones: '0.25m x 2.40m x 1.5mm',
    anchoMm: 250,
    altoMm: 20,
    espesorMm: 1.5,
    pesoKgPorMetro: 4.8,
    precioPorBarra6m: 55.00,
    descripcion: 'Láminas acanaladas ensamblables machihembradas para portones de seguridad y puertas pesadas'
  }
];

export const ACCESORIOS_CATALOGO: AccesorioItem[] = [
  {
    id: 'acc-bisagra-tub-5/8',
    categoria: 'bisagra',
    nombre: 'Bisagra Tubular 5/8" x 3" con Rodaje',
    descripcion: 'Bisagra capuchina para puertas y portones pesados de acero',
    unidad: 'und',
    cantidad: 4,
    precioUnitario: 9.50,
    incluido: true
  },
  {
    id: 'acc-bisagra-tub-3/4',
    categoria: 'bisagra',
    nombre: 'Bisagra Tubular 3/4" x 4" con Munición',
    descripcion: 'Para portones vehiculares pesados abatibles',
    unidad: 'und',
    cantidad: 6,
    precioUnitario: 14.00,
    incluido: true
  },
  {
    id: 'acc-cerra-forte-3g',
    categoria: 'cerradura',
    nombre: 'Cerradura de Sobreponer Forte Clásica 3 Golpes',
    descripcion: 'Cilindro exterior de latón macizo con 3 llaves',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 85.00,
    incluido: true
  },
  {
    id: 'acc-cerra-travex-cerrojo',
    categoria: 'cerradura',
    nombre: 'Cerrojo de Seguridad Travex Pasador Macizo',
    descripcion: 'Seguridad adicional para portón y puerta principal',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 55.00,
    incluido: false
  },
  {
    id: 'acc-manija-tubular',
    categoria: 'manija',
    nombre: 'Manija Tubular de Acero Inoxidable 40cm',
    descripcion: 'Jalador recto para puerta principal de diseño contemporáneo',
    unidad: 'par',
    cantidad: 1,
    precioUnitario: 65.00,
    incluido: false
  },
  {
    id: 'acc-pasador-piso-techo',
    categoria: 'pasador',
    nombre: 'Cerrojos de Piso y Techo para Portón (50cm)',
    descripcion: 'Varilla redonda maciza de 5/8" con portacandado',
    unidad: 'jgo',
    cantidad: 2,
    precioUnitario: 22.00,
    incluido: true
  },
  {
    id: 'acc-ruedas-v-4',
    categoria: 'rueda',
    nombre: 'Ruedas de Acero de 4" en V con Rodaje Blindado',
    descripcion: 'Par de ruedas de alta carga para portón corredizo',
    unidad: 'par',
    cantidad: 1,
    precioUnitario: 45.00,
    incluido: false
  },
  {
    id: 'acc-riel-angulo',
    categoria: 'riel',
    nombre: 'Riel Inferior Ángulo 1 1/2" x 3/16" (6m)',
    descripcion: 'Riel de rodadura nivelado al piso con anclajes soldables',
    unidad: 'und',
    cantidad: 1,
    precioUnitario: 85.00,
    incluido: false
  },
  {
    id: 'acc-guia-superior',
    categoria: 'guia',
    nombre: 'Guía Superior con Rodillos de Nylon y Soporte',
    descripcion: 'Evita el descarrilamiento y vibración del portón',
    unidad: 'jgo',
    cantidad: 1,
    precioUnitario: 38.00,
    incluido: false
  },
  {
    id: 'acc-tope-carrera',
    categoria: 'tope',
    nombre: 'Topes Metálicos con Amortiguador de Goma',
    descripcion: 'Topes de apertura y cierre de portón corredizo',
    unidad: 'par',
    cantidad: 1,
    precioUnitario: 18.00,
    incluido: false
  },
  {
    id: 'acc-motor-corredizo',
    categoria: 'automatizacion',
    nombre: 'Kit Motor Corredizo 800kg + Cremallera 4m + 2 Controles',
    descripcion: 'Automatización completa para portón vehicular',
    unidad: 'jgo',
    cantidad: 1,
    precioUnitario: 1150.00,
    incluido: false
  },
  {
    id: 'acc-puntas-lanza',
    categoria: 'decorativo',
    nombre: 'Puntas de Lanza en Hierro Forjado (Flecha Clásica)',
    descripcion: 'Elemento disuasivo de seguridad para coronación de reja',
    unidad: 'und',
    cantidad: 20,
    precioUnitario: 3.50,
    incluido: false
  }
];

// ==========================================
// PRESET DE PRUEBA: PORTÓN METÁLICO DEMO 4.00m × 2.50m
// ==========================================
export const PORTON_METALLICO_DEMO: HerreriaDesign = {
  id: 'demo-porton-4x2.5',
  tipoElemento: 'porton',
  nombre: 'PORTÓN METÁLICO DEMO',
  descripcion: 'Portón vehicular de dos hojas con marco perimetral, barrotes verticales de 1", refuerzo horizontal, bisagras y cerradura',
  piezas: [],
  accesoriosCad: [],
  cotasCad: [],
  anchoM: 4.00,
  altoM: 2.50,
  profundidadMarcoMm: 100,
  perfilMarcoId: 'rect-4x2-2.0',
  perfilBastidorId: 'rect-3x1.5-1.5',
  perfilRefuerzoId: 'rect-2x1-1.5',
  numHojas: 2,
  hojas: [
    {
      id: 'hoja-1',
      numero: 1,
      anchoM: 2.00,
      apertura: 'izquierda'
    },
    {
      id: 'hoja-2',
      numero: 2,
      anchoM: 2.00,
      apertura: 'derecha'
    }
  ],
  tipoAperturaPorton: 'abatible',
  sentidoAperturaTexto: 'Doble Hoja Abatible hacia el interior',
  barrotesConfig: {
    activo: true,
    perfilId: 'cuad-1x1-1.2',
    orientacion: 'vertical',
    separacionCm: 12,
    cantidad: 26,
    separacionRealCm: 12.1
  },
  divisiones: [
    {
      id: 'div-refuerzo-horiz',
      tipo: 'horizontal',
      posicionM: 1.00,
      porcentaje: 40,
      perfilId: 'rect-2x1-1.5'
    }
  ],
  paneles: [
    // Hoja 1 - Zona Superior con barrotes
    {
      id: 'pan-h1-sup',
      nombre: 'Hoja 1 Superior - Barrotes',
      hojaIndex: 0,
      relX: 0,
      relY: 0.4,
      relW: 1,
      relH: 0.6,
      tipoRelleno: 'reja',
      espesorMm: 25,
      rejaConfig: {
        orientacion: 'vertical',
        perfilId: 'cuad-1x1-1.2',
        separacionObjetivoCm: 12,
        separacionRealCm: 12.1,
        cantidadBarras: 13
      }
    },
    // Hoja 1 - Zona Inferior con plancha acanalada
    {
      id: 'pan-h1-inf',
      nombre: 'Hoja 1 Inferior - Plancha Acanalada Corrugada',
      hojaIndex: 0,
      relX: 0,
      relY: 0,
      relW: 1,
      relH: 0.4,
      tipoRelleno: 'plancha',
      espesorMm: 1.2,
      planchaConfig: {
        subtipo: 'acanalada',
        calibre: '1.2mm (22 LAC)',
        pesoKgM2: 11.5,
        precioM2: 92.0
      }
    },
    // Hoja 2 - Zona Superior con barrotes
    {
      id: 'pan-h2-sup',
      nombre: 'Hoja 2 Superior - Barrotes',
      hojaIndex: 1,
      relX: 0,
      relY: 0.4,
      relW: 1,
      relH: 0.6,
      tipoRelleno: 'reja',
      espesorMm: 25,
      rejaConfig: {
        orientacion: 'vertical',
        perfilId: 'cuad-1x1-1.2',
        separacionObjetivoCm: 12,
        separacionRealCm: 12.1,
        cantidadBarras: 13
      }
    },
    // Hoja 2 - Zona Inferior con plancha acanalada
    {
      id: 'pan-h2-inf',
      nombre: 'Hoja 2 Inferior - Plancha Acanalada Corrugada',
      hojaIndex: 1,
      relX: 0,
      relY: 0,
      relW: 1,
      relH: 0.4,
      tipoRelleno: 'plancha',
      espesorMm: 1.2,
      planchaConfig: {
        subtipo: 'acanalada',
        calibre: '1.2mm (22 LAC)',
        pesoKgM2: 11.5,
        precioM2: 92.0
      }
    }
  ],
  accesorios: [
    {
      id: 'acc-bisagra-tub-5/8',
      categoria: 'bisagra',
      nombre: 'Bisagra Tubular 5/8" x 3" con Rodaje',
      descripcion: 'Bisagras reforzadas de acero (3 por hoja)',
      unidad: 'und',
      cantidad: 6,
      precioUnitario: 10.50,
      incluido: true
    },
    {
      id: 'acc-cerra-forte-3g',
      categoria: 'cerradura',
      nombre: 'Cerradura de Sobreponer Forte Clásica 3 Golpes',
      descripcion: 'Cerradura central con llave de puntos',
      unidad: 'und',
      cantidad: 1,
      precioUnitario: 85.00,
      incluido: true
    },
    {
      id: 'acc-pasador-piso-techo',
      categoria: 'pasador',
      nombre: 'Cerrojos de Piso y Techo para Portón (50cm)',
      descripcion: 'Pasador vertical de anclaje para hoja pasiva',
      unidad: 'jgo',
      cantidad: 2,
      precioUnitario: 24.00,
      incluido: true
    }
  ],
  acabado: {
    tipoPintura: 'esmalte_sintetico',
    colorNombre: 'Negro Grafito Mate',
    colorHex: '#1e293b',
    manosPintura: 2,
    costoPorM2: 28.0
  },
  manoDeObra: {
    diasEstimados: 3,
    cantOperarios: 1,
    cantAyudantes: 1,
    costoOperarioDia: 130,
    costoAyudanteDia: 90,
    costoCorteHoras: 90,
    costoSoldaduraHoras: 180,
    costoArmadoHoras: 150,
    costoEsmeriladoHoras: 80,
    costoPinturaHoras: 120,
    costoInstalacion: 280,
    costoTransporte: 120
  },
  fechaCreacion: '2026-09-20',
  ultimaModificacion: '2026-09-20'
};

// ========================================================
// GENERADOR AUTOMÁTICO DE PIEZAS CAD 2D/3D A PARTIR DE PARÁMETROS DE DISEÑO
// Convertidor universal para garantizar la renderización perfecta de cualquier plantilla
// ========================================================
export function generarPiezasCadDesdeDiseno(design: HerreriaDesign): {
  piezas: PiezaCad[];
  accesoriosCad: AccesorioCad[];
  cotasCad: CotaCad[];
} {
  const piezas: PiezaCad[] = [];
  const accesoriosCad: AccesorioCad[] = [];
  const cotasCad: CotaCad[] = [];

  const anchoM = Math.max(0.2, design.anchoM || 1.0);
  const altoM = Math.max(0.2, design.altoM || 1.0);

  const perfilMarcoId = design.perfilMarcoId || 'rect-2x1-1.5';
  const perfilBastidorId = design.perfilBastidorId || 'rect-2x1-1.5';
  const perfilRefuerzoId = design.perfilRefuerzoId || 'cuad-1x1-1.2';

  // CASO ESPECIAL 1: SILLA / BANCO METÁLICO (Diseño Tubular 3D Estructurado sin marco perimetral de puerta)
  if (design.tipoElemento === 'silla') {
    const w = Math.max(0.35, anchoM); // ~0.45m a 0.50m
    const h = Math.max(0.70, altoM); // ~0.90m
    const seatH = 0.45; // altura de asiento
    const profZ = 0.42; // profundidad en 3D
    const pPatas = perfilBastidorId || 'cuad-1x1-1.2';
    const pAmarre = perfilRefuerzoId || 'cuad-3/4x3/4-1.2';

    // 1. Patas y Parantes de Respaldo Continuos
    // Parante Posterior Izquierdo (Suelo a Respaldo)
    piezas.push({
      id: `silla-post-izq-${Date.now()}`,
      marca: 'P-01',
      nombre: 'Parante Respaldo y Pata Posterior Izq',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: 0.04, y1: 0, z1: 0.04,
      x2: 0.04, y2: h, z2: 0.04,
      longitudM: h,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'patas'
    });
    // Parante Posterior Derecho (Suelo a Respaldo)
    piezas.push({
      id: `silla-post-der-${Date.now()}`,
      marca: 'P-02',
      nombre: 'Parante Respaldo y Pata Posterior Der',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: w - 0.04, y1: 0, z1: 0.04,
      x2: w - 0.04, y2: h, z2: 0.04,
      longitudM: h,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'patas'
    });
    // Pata Delantera Izquierda (Suelo a Asiento)
    piezas.push({
      id: `silla-pata-del-izq-${Date.now()}`,
      marca: 'P-03',
      nombre: 'Pata Delantera Izquierda',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: 0.05, y1: 0, z1: profZ,
      x2: 0.05, y2: seatH, z2: profZ,
      longitudM: seatH,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'patas'
    });
    // Pata Delantera Derecha (Suelo a Asiento)
    piezas.push({
      id: `silla-pata-del-der-${Date.now()}`,
      marca: 'P-04',
      nombre: 'Pata Delantera Derecha',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: w - 0.05, y1: 0, z1: profZ,
      x2: w - 0.05, y2: seatH, z2: profZ,
      longitudM: seatH,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'patas'
    });

    // 2. Bastidor de Asiento (H = 0.45m)
    // Travesaño Frontal de Asiento
    piezas.push({
      id: `silla-asiento-front-${Date.now()}`,
      marca: 'A-01',
      nombre: 'Travesaño Frontal Asiento',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: 0.04, y1: seatH, z1: profZ,
      x2: w - 0.04, y2: seatH, z2: profZ,
      longitudM: w - 0.08,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'asiento'
    });
    // Travesaño Posterior de Asiento
    piezas.push({
      id: `silla-asiento-back-${Date.now()}`,
      marca: 'A-02',
      nombre: 'Travesaño Posterior Asiento',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: 0.04, y1: seatH, z1: 0.04,
      x2: w - 0.04, y2: seatH, z2: 0.04,
      longitudM: w - 0.08,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'asiento'
    });
    // Travesaño Lateral Izq de Asiento
    piezas.push({
      id: `silla-asiento-lat-izq-${Date.now()}`,
      marca: 'A-03',
      nombre: 'Travesaño Lateral Izquierdo Asiento',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: 0.04, y1: seatH, z1: 0.04,
      x2: 0.04, y2: seatH, z2: profZ,
      longitudM: profZ - 0.04,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'asiento'
    });
    // Travesaño Lateral Der de Asiento
    piezas.push({
      id: `silla-asiento-lat-der-${Date.now()}`,
      marca: 'A-04',
      nombre: 'Travesaño Lateral Derecho Asiento',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: w - 0.04, y1: seatH, z1: 0.04,
      x2: w - 0.04, y2: seatH, z2: profZ,
      longitudM: profZ - 0.04,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'asiento'
    });
    // Plancha de Asiento
    piezas.push({
      id: `silla-asiento-tapa-${Date.now()}`,
      marca: 'PL-01',
      nombre: 'Plancha de Asiento LAC 1/16"',
      tipo: 'plancha',
      material: 'acero',
      perfilId: 'plancha-1.5mm',
      x1: 0.04, y1: seatH, z1: 0.04,
      x2: w - 0.04, y2: seatH, z2: profZ,
      longitudM: w - 0.08,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      esPlancha: true,
      anchoPlanchaM: w - 0.08,
      altoPlanchaM: profZ - 0.04,
      espesorPlanchaMm: 1.5,
      subtipoPlancha: 'lisa',
      tipoRelleno: 'plancha',
      cantidad: 1, grupo: 'asiento'
    });

    // 3. Amarres Inferiores de Rigidez (H = 0.15m)
    piezas.push({
      id: `silla-amarre-front-${Date.now()}`,
      marca: 'R-01',
      nombre: 'Amarre Inferior Frontal',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.05, y1: 0.15, z1: profZ,
      x2: w - 0.05, y2: 0.15, z2: profZ,
      longitudM: w - 0.10,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });
    piezas.push({
      id: `silla-amarre-back-${Date.now()}`,
      marca: 'R-02',
      nombre: 'Amarre Inferior Posterior',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.04, y1: 0.15, z1: 0.04,
      x2: w - 0.04, y2: 0.15, z2: 0.04,
      longitudM: w - 0.08,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });
    piezas.push({
      id: `silla-amarre-lat1-${Date.now()}`,
      marca: 'R-03',
      nombre: 'Amarre Inferior Lateral Izq',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.04, y1: 0.15, z1: 0.04,
      x2: 0.05, y2: 0.15, z2: profZ,
      longitudM: profZ - 0.04,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });
    piezas.push({
      id: `silla-amarre-lat2-${Date.now()}`,
      marca: 'R-04',
      nombre: 'Amarre Inferior Lateral Der',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: w - 0.04, y1: 0.15, z1: 0.04,
      x2: w - 0.05, y2: 0.15, z2: profZ,
      longitudM: profZ - 0.04,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });

    // 4. Respaldo (Copete, Travesaño y Cruceta X)
    piezas.push({
      id: `silla-resp-sup-${Date.now()}`,
      marca: 'RS-01',
      nombre: 'Copete Superior de Respaldo',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: 0.04, y1: h, z1: 0.04,
      x2: w - 0.04, y2: h, z2: 0.04,
      longitudM: w - 0.08,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'respaldo'
    });
    piezas.push({
      id: `silla-resp-med-${Date.now()}`,
      marca: 'RS-02',
      nombre: 'Travesaño Intermedio Respaldo',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.04, y1: 0.72, z1: 0.04,
      x2: w - 0.04, y2: 0.72, z2: 0.04,
      longitudM: w - 0.08,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'respaldo'
    });
    piezas.push({
      id: `silla-resp-diag1-${Date.now()}`,
      marca: 'RS-03',
      nombre: 'Cruceta Diagonal Respaldo 1',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.04, y1: seatH + 0.03, z1: 0.04,
      x2: w - 0.04, y2: h - 0.03, z2: 0.04,
      longitudM: Math.hypot(w - 0.08, h - seatH - 0.06),
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'respaldo'
    });
    piezas.push({
      id: `silla-resp-diag2-${Date.now()}`,
      marca: 'RS-04',
      nombre: 'Cruceta Diagonal Respaldo 2',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: w - 0.04, y1: seatH + 0.03, z1: 0.04,
      x2: 0.04, y2: h - 0.03, z2: 0.04,
      longitudM: Math.hypot(w - 0.08, h - seatH - 0.06),
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'respaldo'
    });

    // Cotas
    cotasCad.push(
      { id: `cota-ancho-${Date.now()}`, x1: 0, y1: -0.08, x2: w, y2: -0.08, valorM: w, eje: 'X', etiqueta: `Ancho: ${w.toFixed(2)}m` },
      { id: `cota-alto-${Date.now()}`, x1: -0.08, y1: 0, x2: -0.08, y2: h, valorM: h, eje: 'Y', etiqueta: `Alto Total: ${h.toFixed(2)}m` },
      { id: `cota-asiento-${Date.now()}`, x1: w + 0.08, y1: 0, x2: w + 0.08, y2: seatH, valorM: seatH, eje: 'Y', etiqueta: `Asiento: ${seatH.toFixed(2)}m` }
    );

    // Accesorios
    accesoriosCad.push(
      { id: `acc-reg-1-${Date.now()}`, tipo: 'tapa_embellecedor', nombre: 'Regatón Plástico 1"', especificacion: 'Protector Pata Delantera Izq', precioUnitario: 2.5, cantidad: 1, x: 0.05, y: 0.01, z: profZ, lado: 'izquierda' },
      { id: `acc-reg-2-${Date.now()}`, tipo: 'tapa_embellecedor', nombre: 'Regatón Plástico 1"', especificacion: 'Protector Pata Delantera Der', precioUnitario: 2.5, cantidad: 1, x: w - 0.05, y: 0.01, z: profZ, lado: 'derecha' },
      { id: `acc-reg-3-${Date.now()}`, tipo: 'tapa_embellecedor', nombre: 'Regatón Plástico 1"', especificacion: 'Protector Pata Posterior Izq', precioUnitario: 2.5, cantidad: 1, x: 0.04, y: 0.01, z: 0.04, lado: 'izquierda' },
      { id: `acc-reg-4-${Date.now()}`, tipo: 'tapa_embellecedor', nombre: 'Regatón Plástico 1"', especificacion: 'Protector Pata Posterior Der', precioUnitario: 2.5, cantidad: 1, x: w - 0.04, y: 0.01, z: 0.04, lado: 'derecha' }
    );

    return { piezas, accesoriosCad, cotasCad };
  }

  // CASO ESPECIAL 2: ESCALERA METÁLICA RECTA (Zancos Inclinados Reales, Peldaños con Huella y Baranda)
  if (design.tipoElemento === 'escalera') {
    const L = Math.max(1.5, anchoM); // Longitud horizontal en planta / desarrollo (e.g. 2.50m)
    const H = Math.max(1.5, altoM); // Desnivel / Altura total (e.g. 2.40m)
    const W = 0.90; // Ancho libre de paso (profundidad en Z)
    const numPeldanos = 10;
    const dx = L / numPeldanos; // Huella (~0.25m)
    const dy = H / numPeldanos; // Contrahuella (~0.24m)

    const pZanco = design.perfilMarcoId || 'rect-4x2-2.0';
    const pPeldano = design.perfilRefuerzoId || 'rect-2x1-2.0';
    const pPasamanos = 'red-2-2.0';
    const pPoste = 'cuad-1.5x1.5-1.5';

    // 1. Zancos Estructurales Inclinados (Tubo Rectangular 4" x 2")
    // Zanco Izquierdo (Lado Z=0)
    piezas.push({
      id: `esc-zanco-izq-${Date.now()}`,
      marca: 'Z-01',
      nombre: 'Zanco Estructural Inclinado Izq (4"x2")',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pZanco,
      x1: 0, y1: 0, z1: 0,
      x2: L, y2: H, z2: 0,
      longitudM: Math.hypot(L, H),
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'estructura'
    });
    // Zanco Derecho (Lado Z=W)
    piezas.push({
      id: `esc-zanco-der-${Date.now()}`,
      marca: 'Z-02',
      nombre: 'Zanco Estructural Inclinado Der (4"x2")',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pZanco,
      x1: 0, y1: 0, z1: W,
      x2: L, y2: H, z2: W,
      longitudM: Math.hypot(L, H),
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'estructura'
    });

    // 2. Peldaños Horizontales con Huella y Plancha Alfajor
    for (let k = 1; k <= numPeldanos; k++) {
      const xStart = (k - 1) * dx;
      const xEnd = k * dx;
      const yPeld = k * dy;

      // Soporte horizontal de peldaño Zanco Izquierdo
      piezas.push({
        id: `esc-sop-izq-${k}-${Date.now()}`,
        marca: `SP-${String(k).padStart(2, '0')}`,
        nombre: `Soporte Huella Izq #${k}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: pPeldano,
        x1: xStart, y1: yPeld, z1: 0,
        x2: xEnd, y2: yPeld, z2: 0,
        longitudM: dx,
        rotacionDeg: 0,
        corteInicio: '90°', corteFin: '90°',
        cantidad: 1, grupo: 'peldanos'
      });
      // Soporte horizontal de peldaño Zanco Derecho
      piezas.push({
        id: `esc-sop-der-${k}-${Date.now()}`,
        marca: `SP-D${String(k).padStart(2, '0')}`,
        nombre: `Soporte Huella Der #${k}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: pPeldano,
        x1: xStart, y1: yPeld, z1: W,
        x2: xEnd, y2: yPeld, z2: W,
        longitudM: dx,
        rotacionDeg: 0,
        corteInicio: '90°', corteFin: '90°',
        cantidad: 1, grupo: 'peldanos'
      });
      // Travesaño transversal de unión de peldaño
      piezas.push({
        id: `esc-trav-${k}-${Date.now()}`,
        marca: `TR-${String(k).padStart(2, '0')}`,
        nombre: `Travesaño Peldaño #${k} (Ancho ${W.toFixed(2)}m)`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: pPeldano,
        x1: xStart + dx / 2, y1: yPeld, z1: 0,
        x2: xStart + dx / 2, y2: yPeld, z2: W,
        longitudM: W,
        rotacionDeg: 0,
        corteInicio: '90°', corteFin: '90°',
        cantidad: 1, grupo: 'peldanos'
      });
      // Plancha estriada alfajor de huella antideslizante
      piezas.push({
        id: `esc-chapa-${k}-${Date.now()}`,
        marca: `HUE-${String(k).padStart(2, '0')}`,
        nombre: `Plancha Estriada Alfajor Huella #${k}`,
        tipo: 'plancha',
        material: 'acero',
        perfilId: 'plancha-estriada-2.5mm',
        x1: xStart, y1: yPeld, z1: 0,
        x2: xEnd, y2: yPeld, z2: W,
        longitudM: W,
        rotacionDeg: 0,
        corteInicio: '90°', corteFin: '90°',
        esPlancha: true,
        anchoPlanchaM: dx,
        altoPlanchaM: W,
        espesorPlanchaMm: 2.5,
        subtipoPlancha: 'estriada',
        tipoRelleno: 'plancha_estriada',
        cantidad: 1, grupo: 'peldanos'
      });
      // Cartela vertical de contrahuella Zanco Izquierdo
      piezas.push({
        id: `esc-cart-izq-${k}-${Date.now()}`,
        marca: `CT-${String(k).padStart(2, '0')}`,
        nombre: `Cartela Contrahuella Izq #${k}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: 'ang-1.5x1.5x3/16',
        x1: xStart, y1: yPeld - dy, z1: 0,
        x2: xStart, y2: yPeld, z2: 0,
        longitudM: dy,
        rotacionDeg: 0,
        corteInicio: '90°', corteFin: '90°',
        cantidad: 1, grupo: 'peldanos'
      });
      // Cartela vertical de contrahuella Zanco Derecho
      piezas.push({
        id: `esc-cart-der-${k}-${Date.now()}`,
        marca: `CT-D${String(k).padStart(2, '0')}`,
        nombre: `Cartela Contrahuella Der #${k}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: 'ang-1.5x1.5x3/16',
        x1: xStart, y1: yPeld - dy, z1: W,
        x2: xStart, y2: yPeld, z2: W,
        longitudM: dy,
        rotacionDeg: 0,
        corteInicio: '90°', corteFin: '90°',
        cantidad: 1, grupo: 'peldanos'
      });
    }

    // 3. Baranda de Seguridad Inclinada
    // Pasamanos Superior Redondo 2" Lado Derecho
    piezas.push({
      id: `esc-pasamanos-der-${Date.now()}`,
      marca: 'PS-01',
      nombre: 'Pasamanos Redondo 2" Tubular Der',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPasamanos,
      x1: 0, y1: 0.90, z1: W,
      x2: L, y2: H + 0.90, z2: W,
      longitudM: Math.hypot(L, H),
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'baranda'
    });
    // Pasamanos Intermedio Rodilla Lado Derecho
    piezas.push({
      id: `esc-pasamanos-med-${Date.now()}`,
      marca: 'PS-02',
      nombre: 'Tubo Intermedio Seguridad Baranda Der',
      tipo: 'perfil',
      material: 'acero',
      perfilId: 'cuad-1x1-1.2',
      x1: 0, y1: 0.45, z1: W,
      x2: L, y2: H + 0.45, z2: W,
      longitudM: Math.hypot(L, H),
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'baranda'
    });
    // Postes Verticales de Baranda
    piezas.push({
      id: `esc-post-1-${Date.now()}`,
      marca: 'PR-01',
      nombre: 'Poste Arranque Baranda Escalera',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPoste,
      x1: 0, y1: 0, z1: W,
      x2: 0, y2: 0.90, z2: W,
      longitudM: 0.90,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'baranda'
    });
    piezas.push({
      id: `esc-post-2-${Date.now()}`,
      marca: 'PR-02',
      nombre: 'Poste Central Baranda Escalera',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPoste,
      x1: L / 2, y1: H / 2, z1: W,
      x2: L / 2, y2: H / 2 + 0.90, z2: W,
      longitudM: 0.90,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'baranda'
    });
    piezas.push({
      id: `esc-post-3-${Date.now()}`,
      marca: 'PR-03',
      nombre: 'Poste Llegada Baranda Escalera',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPoste,
      x1: L, y1: H, z1: W,
      x2: L, y2: H + 0.90, z2: W,
      longitudM: 0.90,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'baranda'
    });

    // 4. Placas Base de Anclaje
    piezas.push({
      id: `esc-placa-suelo-izq-${Date.now()}`,
      marca: 'PB-01',
      nombre: 'Placa Base Anclaje Suelo Izq',
      tipo: 'plancha',
      material: 'acero',
      perfilId: 'plancha-6mm',
      x1: 0, y1: 0, z1: 0,
      x2: 0.15, y2: 0.015, z2: 0,
      longitudM: 0.15,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      esPlancha: true, anchoPlanchaM: 0.15, altoPlanchaM: 0.15, espesorPlanchaMm: 6,
      subtipoPlancha: 'lisa', tipoRelleno: 'plancha',
      cantidad: 1, grupo: 'anclaje'
    });
    piezas.push({
      id: `esc-placa-suelo-der-${Date.now()}`,
      marca: 'PB-02',
      nombre: 'Placa Base Anclaje Suelo Der',
      tipo: 'plancha',
      material: 'acero',
      perfilId: 'plancha-6mm',
      x1: 0, y1: 0, z1: W,
      x2: 0.15, y2: 0.015, z2: W,
      longitudM: 0.15,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      esPlancha: true, anchoPlanchaM: 0.15, altoPlanchaM: 0.15, espesorPlanchaMm: 6,
      subtipoPlancha: 'lisa', tipoRelleno: 'plancha',
      cantidad: 1, grupo: 'anclaje'
    });
    piezas.push({
      id: `esc-placa-losa-der-${Date.now()}`,
      marca: 'PB-03',
      nombre: 'Placa Base Anclaje Losa Superior',
      tipo: 'plancha',
      material: 'acero',
      perfilId: 'plancha-6mm',
      x1: L - 0.15, y1: H, z1: W,
      x2: L, y2: H + 0.015, z2: W,
      longitudM: 0.15,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      esPlancha: true, anchoPlanchaM: 0.15, altoPlanchaM: 0.15, espesorPlanchaMm: 6,
      subtipoPlancha: 'lisa', tipoRelleno: 'plancha',
      cantidad: 1, grupo: 'anclaje'
    });

    // Cotas
    cotasCad.push(
      { id: `cota-desarrollo-${Date.now()}`, x1: 0, y1: -0.15, x2: L, y2: -0.15, valorM: L, eje: 'X', etiqueta: `Desarrollo Horizontal: ${L.toFixed(2)}m` },
      { id: `cota-alto-${Date.now()}`, x1: -0.15, y1: 0, x2: -0.15, y2: H, valorM: H, eje: 'Y', etiqueta: `Desnivel / Altura Total: ${H.toFixed(2)}m` },
      { id: `cota-huella-${Date.now()}`, x1: 0, y1: dy + 0.08, x2: dx, y2: dy + 0.08, valorM: dx, eje: 'X', etiqueta: `Huella: ${(dx * 100).toFixed(0)}cm` },
      { id: `cota-contrahuella-${Date.now()}`, x1: dx + 0.08, y1: 0, x2: dx + 0.08, y2: dy, valorM: dy, eje: 'Y', etiqueta: `Contrahuella: ${(dy * 100).toFixed(0)}cm` }
    );

    // Accesorios
    accesoriosCad.push(
      { id: `acc-ancl-1-${Date.now()}`, tipo: 'placa_base', nombre: 'Placas Base Anclaje 6"x6"x3/8"', especificacion: '4 placas con pernos Hilti 1/2"', precioUnitario: 35.0, cantidad: 4, x: L / 2, y: 0.05, z: 0, lado: 'centro' }
    );

    return { piezas, accesoriosCad, cotasCad };
  }

  // CASO ESPECIAL 2B: ESCALERA CON DESCANSO / MULTINIVEL (2 o 3 Pisos con Meseta Intermedia y Columnas)
  if (design.tipoElemento === 'escalera_descanso') {
    const H = Math.max(2.6, altoM); // Altura total (ej. 2.80m para 2 pisos, 5.40m para 3 pisos)
    const es3Pisos = H >= 4.5 || (design.nombre && design.nombre.includes('3'));
    const numTramos = es3Pisos ? 3 : 2;
    const hPorTramo = H / numTramos; // ~1.40m o ~1.80m por tramo
    const W = 0.95; // Ancho de paso
    const LDescanso = 1.00; // Largo del descanso
    const peldPorTramo = 7;
    const lTramo = 1.75; // Desarrollo horizontal de cada tramo
    const dx = lTramo / peldPorTramo;
    const dy = hPorTramo / peldPorTramo;

    const pZanco = design.perfilMarcoId || 'rect-4x2-2.0';
    const pPeldano = design.perfilRefuerzoId || 'rect-2x1-2.0';
    const pColumna = 'cuad-3x3-2.0';
    const pPasamanos = 'red-2-2.0';
    const pPoste = 'cuad-1.5x1.5-1.5';

    let currentX = 0;
    let currentY = 0;
    let currentZ = 0;

    for (let t = 0; t < numTramos; t++) {
      const zOffset = (t % 2 === 0 ? 0 : W + 0.10) + currentZ; // Quiebre de tramo en U o L
      const xStart = currentX;
      const yStart = currentY;
      const xEnd = currentX + lTramo;
      const yEnd = currentY + hPorTramo;

      // Zancos del tramo
      piezas.push({
        id: `esc-d-zanco-izq-${t}-${Date.now()}`,
        marca: `Z-${t + 1}A`,
        nombre: `Zanco Estructural Tramo #${t + 1} Izq`,
        tipo: 'perfil', material: 'acero', perfilId: pZanco,
        x1: xStart, y1: yStart, z1: zOffset,
        x2: xEnd, y2: yEnd, z2: zOffset,
        longitudM: Math.hypot(lTramo, hPorTramo),
        rotacionDeg: 0, corteInicio: '45°', corteFin: '45°',
        cantidad: 1, grupo: 'estructura'
      });
      piezas.push({
        id: `esc-d-zanco-der-${t}-${Date.now()}`,
        marca: `Z-${t + 1}B`,
        nombre: `Zanco Estructural Tramo #${t + 1} Der`,
        tipo: 'perfil', material: 'acero', perfilId: pZanco,
        x1: xStart, y1: yStart, z1: zOffset + W,
        x2: xEnd, y2: yEnd, z2: zOffset + W,
        longitudM: Math.hypot(lTramo, hPorTramo),
        rotacionDeg: 0, corteInicio: '45°', corteFin: '45°',
        cantidad: 1, grupo: 'estructura'
      });

      // Peldaños del tramo
      for (let k = 1; k <= peldPorTramo; k++) {
        const pxStart = xStart + (k - 1) * dx;
        const pxEnd = xStart + k * dx;
        const pyPeld = yStart + k * dy;

        piezas.push({
          id: `esc-d-peld-izq-${t}-${k}-${Date.now()}`,
          marca: `P-${t + 1}-${String(k).padStart(2, '0')}`,
          nombre: `Soporte Peldaño Tramo ${t + 1} #${k}`,
          tipo: 'perfil', material: 'acero', perfilId: pPeldano,
          x1: pxStart, y1: pyPeld, z1: zOffset,
          x2: pxEnd, y2: pyPeld, z2: zOffset,
          longitudM: dx, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
          cantidad: 1, grupo: 'peldanos'
        });
        piezas.push({
          id: `esc-d-peld-der-${t}-${k}-${Date.now()}`,
          marca: `PD-${t + 1}-${String(k).padStart(2, '0')}`,
          nombre: `Soporte Peldaño Der Tramo ${t + 1} #${k}`,
          tipo: 'perfil', material: 'acero', perfilId: pPeldano,
          x1: pxStart, y1: pyPeld, z1: zOffset + W,
          x2: pxEnd, y2: pyPeld, z2: zOffset + W,
          longitudM: dx, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
          cantidad: 1, grupo: 'peldanos'
        });
        piezas.push({
          id: `esc-d-chapa-${t}-${k}-${Date.now()}`,
          marca: `HUE-${t + 1}-${String(k).padStart(2, '0')}`,
          nombre: `Huella Estriada Alfajor T${t + 1} #${k}`,
          tipo: 'plancha', material: 'acero', perfilId: 'plancha-estriada-2.5mm',
          x1: pxStart, y1: pyPeld, z1: zOffset,
          x2: pxEnd, y2: pyPeld, z2: zOffset + W,
          longitudM: W, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
          esPlancha: true, anchoPlanchaM: dx, altoPlanchaM: W, espesorPlanchaMm: 2.5,
          subtipoPlancha: 'estriada', tipoRelleno: 'plancha_estriada',
          cantidad: 1, grupo: 'peldanos'
        });
      }

      // Baranda del tramo
      piezas.push({
        id: `esc-d-pasam-${t}-${Date.now()}`,
        marca: `PS-${t + 1}`,
        nombre: `Pasamanos Redondo 2" Tramo #${t + 1}`,
        tipo: 'perfil', material: 'acero', perfilId: pPasamanos,
        x1: xStart, y1: yStart + 0.90, z1: zOffset + W,
        x2: xEnd, y2: yEnd + 0.90, z2: zOffset + W,
        longitudM: Math.hypot(lTramo, hPorTramo),
        rotacionDeg: 0, corteInicio: '45°', corteFin: '45°',
        cantidad: 1, grupo: 'baranda'
      });
      piezas.push({
        id: `esc-d-post-ini-${t}-${Date.now()}`,
        marca: `PR-${t + 1}A`,
        nombre: `Poste Arranque Baranda T${t + 1}`,
        tipo: 'perfil', material: 'acero', perfilId: pPoste,
        x1: xStart, y1: yStart, z1: zOffset + W,
        x2: xStart, y2: yStart + 0.90, z2: zOffset + W,
        longitudM: 0.90, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
        cantidad: 1, grupo: 'baranda'
      });
      piezas.push({
        id: `esc-d-post-fin-${t}-${Date.now()}`,
        marca: `PR-${t + 1}B`,
        nombre: `Poste Llegada Baranda T${t + 1}`,
        tipo: 'perfil', material: 'acero', perfilId: pPoste,
        x1: xEnd, y1: yEnd, z1: zOffset + W,
        x2: xEnd, y2: yEnd + 0.90, z2: zOffset + W,
        longitudM: 0.90, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
        cantidad: 1, grupo: 'baranda'
      });

      // Si no es el último tramo, crear Meseta / Descanso Intermedio
      if (t < numTramos - 1) {
        const descX1 = xEnd;
        const descX2 = xEnd + LDescanso;
        const descY = yEnd;
        const descZ1 = 0;
        const descZ2 = W * 2 + 0.10;

        // Bastidor perimetral del descanso
        piezas.push({
          id: `esc-desc-front-${t}-${Date.now()}`,
          marca: `D-F${t + 1}`,
          nombre: `Viga Frontal Descanso Nivel #${t + 1}`,
          tipo: 'perfil', material: 'acero', perfilId: pZanco,
          x1: descX1, y1: descY, z1: descZ1,
          x2: descX2, y2: descY, z2: descZ1,
          longitudM: LDescanso, rotacionDeg: 0, corteInicio: '45°', corteFin: '45°',
          cantidad: 1, grupo: 'estructura'
        });
        piezas.push({
          id: `esc-desc-back-${t}-${Date.now()}`,
          marca: `D-B${t + 1}`,
          nombre: `Viga Posterior Descanso Nivel #${t + 1}`,
          tipo: 'perfil', material: 'acero', perfilId: pZanco,
          x1: descX1, y1: descY, z1: descZ2,
          x2: descX2, y2: descY, z2: descZ2,
          longitudM: LDescanso, rotacionDeg: 0, corteInicio: '45°', corteFin: '45°',
          cantidad: 1, grupo: 'estructura'
        });
        piezas.push({
          id: `esc-desc-lat1-${t}-${Date.now()}`,
          marca: `D-L1-${t + 1}`,
          nombre: `Viga Lateral Descanso Nivel #${t + 1}`,
          tipo: 'perfil', material: 'acero', perfilId: pZanco,
          x1: descX1, y1: descY, z1: descZ1,
          x2: descX1, y2: descY, z2: descZ2,
          longitudM: descZ2 - descZ1, rotacionDeg: 0, corteInicio: '45°', corteFin: '45°',
          cantidad: 1, grupo: 'estructura'
        });
        piezas.push({
          id: `esc-desc-lat2-${t}-${Date.now()}`,
          marca: `D-L2-${t + 1}`,
          nombre: `Viga Lateral 2 Descanso Nivel #${t + 1}`,
          tipo: 'perfil', material: 'acero', perfilId: pZanco,
          x1: descX2, y1: descY, z1: descZ1,
          x2: descX2, y2: descY, z2: descZ2,
          longitudM: descZ2 - descZ1, rotacionDeg: 0, corteInicio: '45°', corteFin: '45°',
          cantidad: 1, grupo: 'estructura'
        });

        // Plancha de piso estriada del descanso
        piezas.push({
          id: `esc-desc-plancha-${t}-${Date.now()}`,
          marca: `PL-D${t + 1}`,
          nombre: `Plancha Estriada Alfajor Descanso Nivel #${t + 1}`,
          tipo: 'plancha', material: 'acero', perfilId: 'plancha-estriada-3.0mm',
          x1: descX1, y1: descY, z1: descZ1,
          x2: descX2, y2: descY, z2: descZ2,
          longitudM: descZ2 - descZ1, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
          esPlancha: true, anchoPlanchaM: LDescanso, altoPlanchaM: descZ2 - descZ1, espesorPlanchaMm: 3.0,
          subtipoPlancha: 'estriada', tipoRelleno: 'plancha_estriada',
          cantidad: 1, grupo: 'peldanos'
        });

        // 2 Columnas de Soporte Vertical del descanso al suelo
        piezas.push({
          id: `esc-desc-col1-${t}-${Date.now()}`,
          marca: `COL-${t + 1}A`,
          nombre: `Columna Soporte Descanso Nivel #${t + 1} (3"x3")`,
          tipo: 'perfil', material: 'acero', perfilId: pColumna,
          x1: descX2 - 0.05, y1: 0, z1: descZ1 + 0.05,
          x2: descX2 - 0.05, y2: descY, z2: descZ1 + 0.05,
          longitudM: descY, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
          cantidad: 1, grupo: 'estructura'
        });
        piezas.push({
          id: `esc-desc-col2-${t}-${Date.now()}`,
          marca: `COL-${t + 1}B`,
          nombre: `Columna Soporte Descanso Nivel #${t + 1} (3"x3")`,
          tipo: 'perfil', material: 'acero', perfilId: pColumna,
          x1: descX2 - 0.05, y1: 0, z1: descZ2 - 0.05,
          x2: descX2 - 0.05, y2: descY, z2: descZ2 - 0.05,
          longitudM: descY, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
          cantidad: 1, grupo: 'estructura'
        });

        // Placas base para las columnas
        piezas.push({
          id: `esc-desc-pb1-${t}-${Date.now()}`,
          marca: `PB-COL${t + 1}A`,
          nombre: `Placa Base Columna Descanso A`,
          tipo: 'plancha', material: 'acero', perfilId: 'plancha-6mm',
          x1: descX2 - 0.12, y1: 0, z1: descZ1,
          x2: descX2 + 0.02, y2: 0.015, z2: descZ1 + 0.14,
          longitudM: 0.14, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
          esPlancha: true, anchoPlanchaM: 0.14, altoPlanchaM: 0.14, espesorPlanchaMm: 6,
          subtipoPlancha: 'lisa', tipoRelleno: 'plancha',
          cantidad: 1, grupo: 'anclaje'
        });
        piezas.push({
          id: `esc-desc-pb2-${t}-${Date.now()}`,
          marca: `PB-COL${t + 1}B`,
          nombre: `Placa Base Columna Descanso B`,
          tipo: 'plancha', material: 'acero', perfilId: 'plancha-6mm',
          x1: descX2 - 0.12, y1: 0, z1: descZ2 - 0.14,
          x2: descX2 + 0.02, y2: 0.015, z2: descZ2,
          longitudM: 0.14, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
          esPlancha: true, anchoPlanchaM: 0.14, altoPlanchaM: 0.14, espesorPlanchaMm: 6,
          subtipoPlancha: 'lisa', tipoRelleno: 'plancha',
          cantidad: 1, grupo: 'anclaje'
        });

        currentX = descX2;
        currentY = descY;
        currentZ = descZ1;
      }
    }

    // Cotas
    cotasCad.push(
      { id: `cota-d-alto-${Date.now()}`, x1: -0.20, y1: 0, x2: -0.20, y2: H, valorM: H, eje: 'Y', etiqueta: `Altura Total (${numTramos} Pisos): ${H.toFixed(2)}m` },
      { id: `cota-d-desarrollo-${Date.now()}`, x1: 0, y1: -0.20, x2: currentX + lTramo, y2: -0.20, valorM: currentX + lTramo, eje: 'X', etiqueta: `Desarrollo Total: ${(currentX + lTramo).toFixed(2)}m` },
      { id: `cota-d-descanso-${Date.now()}`, x1: lTramo, y1: hPorTramo + 0.10, x2: lTramo + LDescanso, y2: hPorTramo + 0.10, valorM: LDescanso, eje: 'X', etiqueta: `Descanso: ${LDescanso.toFixed(2)}m` }
    );

    return { piezas, accesoriosCad, cotasCad };
  }

  // CASO ESPECIAL 2C: ESCALERA CARACOL (poste central, peldaños en gajo que giran
  // alrededor del poste, baranda exterior helicoidal y descanso de llegada).
  if (design.tipoElemento === 'escalera_caracol') {
    const H = Math.max(2.4, altoM);                         // altura de piso a piso
    const R = Math.max(0.70, anchoM / 2 || 0.80);           // radio (ancho = diámetro)
    const numPeldanos = Math.max(10, Math.round(H / 0.19)); // contrapaso ~19 cm
    const dy = H / (numPeldanos + 1);                       // el último paso es el descanso
    const angPaso = 27;                                     // ° que gira cada peldaño (~13 por vuelta)
    const rMastil = 0.057;                                  // tubo 4" (Ø114 mm)
    const ts = Date.now();

    const pMastil = 'red-4-3.0';
    const pBrazo = 'cuad-1.5x1.5-2.0';
    const pPasamanos = 'red-2-2.0';
    const pPoste = 'red-1-1.5';
    const rad = (g: number) => (g * Math.PI) / 180;
    const enRadio = (r: number, g: number) => ({ x: r * Math.cos(rad(g)), z: r * Math.sin(rad(g)) });

    // 1. Poste central continuo
    piezas.push({
      id: `caracol-mastil-${ts}`, marca: 'MC-01', nombre: 'Poste central tubo redondo 4" x 3.0mm',
      tipo: 'perfil', material: 'acero', perfilId: pMastil,
      x1: 0, y1: 0, z1: 0, x2: 0, y2: H + 0.95, z2: 0,
      longitudM: H + 0.95, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°', cantidad: 1, grupo: 'estructura'
    });

    // 2. Placa base de anclaje
    piezas.push({
      id: `caracol-pb-piso-${ts}`, marca: 'PB-MC', nombre: 'Placa base de anclaje 300 x 300 x 3/8"',
      tipo: 'plancha', material: 'acero', perfilId: 'plancha-6mm',
      x1: -0.15, y1: 0, z1: -0.15, x2: 0.15, y2: 0, z2: 0.15,
      longitudM: 0.30, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
      esPlancha: true, anchoPlanchaM: 0.30, altoPlanchaM: 0.30, espesorPlanchaMm: 9.5,
      subtipoPlancha: 'lisa', tipoRelleno: 'plancha', cantidad: 1, grupo: 'anclaje'
    });

    // 3. Peldaños: gajo de plancha estriada + 2 brazos radiales que lo cargan
    let prevTope: { x: number; y: number; z: number } | null = null;
    for (let k = 1; k <= numPeldanos; k++) {
      const a0 = (k - 1) * angPaso;
      const a1 = a0 + angPaso + 3; // 3° de traslape bajo el siguiente peldaño
      const y = k * dy;
      const marca = String(k).padStart(2, '0');
      const anchoHuella = R - rMastil;

      piezas.push({
        id: `caracol-huella-${k}-${ts}`, marca: `HC-${marca}`, nombre: `Peldaño en gajo #${k} (plancha estriada 3 mm)`,
        tipo: 'plancha', material: 'acero', perfilId: 'plancha-estriada-3.0mm',
        x1: enRadio(rMastil, a0).x, y1: y, z1: enRadio(rMastil, a0).z,
        x2: enRadio(R, a1).x, y2: y, z2: enRadio(R, a1).z,
        longitudM: anchoHuella, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
        esPlancha: true, anchoPlanchaM: anchoHuella, altoPlanchaM: R * rad(angPaso), espesorPlanchaMm: 3,
        subtipoPlancha: 'estriada', tipoRelleno: 'plancha_estriada',
        sectorPeldano: { rIn: rMastil, rOut: R, a0Deg: a0, a1Deg: a1 },
        cantidad: 1, grupo: 'peldanos'
      });
      // Brazos bajo los dos bordes del gajo (soldados al poste)
      for (const [lado, g] of [['A', a0 + 2], ['B', a1 - 2]] as const) {
        const i = enRadio(rMastil, g), o = enRadio(R - 0.02, g);
        piezas.push({
          id: `caracol-brazo-${k}${lado}-${ts}`, marca: `BR-${marca}${lado}`, nombre: `Brazo de peldaño #${k}${lado}`,
          tipo: 'perfil', material: 'acero', perfilId: pBrazo,
          x1: i.x, y1: y - 0.02, z1: i.z, x2: o.x, y2: y - 0.02, z2: o.z,
          longitudM: R - 0.02 - rMastil, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°', cantidad: 1, grupo: 'peldanos'
        });
      }

      // Parante de baranda en el borde exterior, al centro del peldaño
      const gp = a0 + angPaso / 2;
      const b = enRadio(R - 0.03, gp);
      const tope = { x: b.x, y: y + 0.90, z: b.z };
      piezas.push({
        id: `caracol-balaustre-${k}-${ts}`, marca: `BL-${marca}`, nombre: `Parante de baranda #${k}`,
        tipo: 'perfil', material: 'acero', perfilId: pPoste,
        x1: b.x, y1: y, z1: b.z, x2: tope.x, y2: tope.y, z2: tope.z,
        longitudM: 0.90, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°', cantidad: 1, grupo: 'baranda'
      });
      // Pasamanos helicoidal (tramos entre parantes)
      if (prevTope) {
        piezas.push({
          id: `caracol-pasamanos-seg-${k}-${ts}`, marca: `PS-${marca}`, nombre: `Pasamanos helicoidal tramo #${k}`,
          tipo: 'perfil', material: 'acero', perfilId: pPasamanos,
          x1: prevTope.x, y1: prevTope.y, z1: prevTope.z, x2: tope.x, y2: tope.y, z2: tope.z,
          longitudM: Math.hypot(tope.x - prevTope.x, tope.y - prevTope.y, tope.z - prevTope.z),
          rotacionDeg: 0, corteInicio: '45°', corteFin: '45°', cantidad: 1, grupo: 'baranda'
        });
      }
      prevTope = tope;
    }

    // 4. Descanso de llegada (cuarto de círculo después del último peldaño)
    const aD0 = numPeldanos * angPaso, aD1 = aD0 + 90;
    piezas.push({
      id: `caracol-descanso-top-${ts}`, marca: 'DC-TOP', nombre: 'Descanso de llegada (plancha estriada 3 mm)',
      tipo: 'plancha', material: 'acero', perfilId: 'plancha-estriada-3.0mm',
      x1: enRadio(rMastil, aD0).x, y1: H, z1: enRadio(rMastil, aD0).z,
      x2: enRadio(R, aD1).x, y2: H, z2: enRadio(R, aD1).z,
      longitudM: R, rotacionDeg: 0, corteInicio: '90°', corteFin: '90°',
      esPlancha: true, anchoPlanchaM: R, altoPlanchaM: (Math.PI * R) / 2, espesorPlanchaMm: 3,
      subtipoPlancha: 'estriada', tipoRelleno: 'plancha_estriada',
      sectorPeldano: { rIn: rMastil, rOut: R, a0Deg: aD0, a1Deg: aD1 },
      cantidad: 1, grupo: 'peldanos'
    });

    cotasCad.push(
      { id: `cota-caracol-alto-${ts}`, x1: -R - 0.15, y1: 0, x2: -R - 0.15, y2: H, valorM: H, eje: 'Y', etiqueta: `Altura de piso a piso: ${H.toFixed(2)}m` },
      { id: `cota-caracol-diam-${ts}`, x1: -R, y1: -0.15, x2: R, y2: -0.15, valorM: R * 2, eje: 'X', etiqueta: `Diámetro: ${(R * 2).toFixed(2)}m` },
      { id: `cota-caracol-paso-${ts}`, x1: rMastil, y1: dy + 0.05, x2: R, y2: dy + 0.05, valorM: R - rMastil, eje: 'X', etiqueta: `Ancho de paso: ${(R - rMastil).toFixed(2)}m · contrapaso ${(dy * 100).toFixed(0)} cm` }
    );

    return { piezas, accesoriosCad, cotasCad };
  }

  // CASO ESPECIAL 3: MESA INDUSTRIAL DE TRABAJO (Estructura de 4 patas, bastidor de cubierta y plancha de acero)
  if (design.tipoElemento === 'mesa') {
    const W = Math.max(0.80, anchoM); // ~1.80m
    const H = Math.max(0.50, altoM); // ~0.85m
    const profZ = 0.80; // profundidad en 3D
    const pPatas = perfilMarcoId || 'cuad-2x2-2.0';
    const pBastidor = perfilBastidorId || 'cuad-2x2-2.0';
    const pAmarre = perfilRefuerzoId || 'rect-2x1-1.5';

    // 1. Cuatro Patas de Tubo Cuadrado Pesado 2"x2"
    // Pata Delantera Izquierda
    piezas.push({
      id: `mesa-pata-del-izq-${Date.now()}`,
      marca: 'PT-01',
      nombre: 'Pata Delantera Izquierda (2"x2")',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: 0.06, y1: 0, z1: profZ - 0.06,
      x2: 0.06, y2: H, z2: profZ - 0.06,
      longitudM: H,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'patas'
    });
    // Pata Delantera Derecha
    piezas.push({
      id: `mesa-pata-del-der-${Date.now()}`,
      marca: 'PT-02',
      nombre: 'Pata Delantera Derecha (2"x2")',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: W - 0.06, y1: 0, z1: profZ - 0.06,
      x2: W - 0.06, y2: H, z2: profZ - 0.06,
      longitudM: H,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'patas'
    });
    // Pata Posterior Izquierda
    piezas.push({
      id: `mesa-pata-post-izq-${Date.now()}`,
      marca: 'PT-03',
      nombre: 'Pata Posterior Izquierda (2"x2")',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: 0.06, y1: 0, z1: 0.06,
      x2: 0.06, y2: H, z2: 0.06,
      longitudM: H,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'patas'
    });
    // Pata Posterior Derecha
    piezas.push({
      id: `mesa-pata-post-der-${Date.now()}`,
      marca: 'PT-04',
      nombre: 'Pata Posterior Derecha (2"x2")',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pPatas,
      x1: W - 0.06, y1: 0, z1: 0.06,
      x2: W - 0.06, y2: H, z2: 0.06,
      longitudM: H,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'patas'
    });

    // 2. Bastidor Perimetral Superior de Cubierta (Y = H)
    // Travesaño Frontal Superior
    piezas.push({
      id: `mesa-cub-front-${Date.now()}`,
      marca: 'CB-01',
      nombre: 'Travesaño Frontal Superior Cubierta',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pBastidor,
      x1: 0.06, y1: H, z1: profZ - 0.06,
      x2: W - 0.06, y2: H, z2: profZ - 0.06,
      longitudM: W - 0.12,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'cubierta'
    });
    // Travesaño Posterior Superior
    piezas.push({
      id: `mesa-cub-back-${Date.now()}`,
      marca: 'CB-02',
      nombre: 'Travesaño Posterior Superior Cubierta',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pBastidor,
      x1: 0.06, y1: H, z1: 0.06,
      x2: W - 0.06, y2: H, z2: 0.06,
      longitudM: W - 0.12,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'cubierta'
    });
    // Travesaño Lateral Izquierdo Superior
    piezas.push({
      id: `mesa-cub-lat-izq-${Date.now()}`,
      marca: 'CB-03',
      nombre: 'Travesaño Lateral Izq Cubierta',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pBastidor,
      x1: 0.06, y1: H, z1: 0.06,
      x2: 0.06, y2: H, z2: profZ - 0.06,
      longitudM: profZ - 0.12,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'cubierta'
    });
    // Travesaño Lateral Derecho Superior
    piezas.push({
      id: `mesa-cub-lat-der-${Date.now()}`,
      marca: 'CB-04',
      nombre: 'Travesaño Lateral Der Cubierta',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pBastidor,
      x1: W - 0.06, y1: H, z1: 0.06,
      x2: W - 0.06, y2: H, z2: profZ - 0.06,
      longitudM: profZ - 0.12,
      rotacionDeg: 0,
      corteInicio: '45°', corteFin: '45°',
      cantidad: 1, grupo: 'cubierta'
    });
    // Refuerzo Central Transversal bajo cubierta
    piezas.push({
      id: `mesa-cub-ref-cen-${Date.now()}`,
      marca: 'CB-05',
      nombre: 'Refuerzo Central Transversal Cubierta',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: W / 2, y1: H, z1: 0.06,
      x2: W / 2, y2: H, z2: profZ - 0.06,
      longitudM: profZ - 0.12,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'cubierta'
    });

    // 3. Cubierta de Mesa en Plancha Pesada LAC 2.0mm
    piezas.push({
      id: `mesa-tapa-plancha-${Date.now()}`,
      marca: 'PL-01',
      nombre: 'Cubierta Plancha de Acero LAC 2.0mm',
      tipo: 'plancha',
      material: 'acero',
      perfilId: 'plancha-2.0mm',
      x1: 0.06, y1: H, z1: 0.06,
      x2: W - 0.06, y2: H, z2: profZ - 0.06,
      longitudM: W - 0.12,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      esPlancha: true,
      anchoPlanchaM: W - 0.12,
      altoPlanchaM: profZ - 0.12,
      espesorPlanchaMm: 2.0,
      subtipoPlancha: 'lisa',
      tipoRelleno: 'plancha',
      cantidad: 1, grupo: 'cubierta'
    });

    // 4. Amarres Inferiores de Rigidez en H (H = 0.15m)
    piezas.push({
      id: `mesa-am-front-${Date.now()}`,
      marca: 'AM-01',
      nombre: 'Amarre Inferior Frontal',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.06, y1: 0.15, z1: profZ - 0.06,
      x2: W - 0.06, y2: 0.15, z2: profZ - 0.06,
      longitudM: W - 0.12,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });
    piezas.push({
      id: `mesa-am-back-${Date.now()}`,
      marca: 'AM-02',
      nombre: 'Amarre Inferior Posterior',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.06, y1: 0.15, z1: 0.06,
      x2: W - 0.06, y2: 0.15, z2: 0.06,
      longitudM: W - 0.12,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });
    piezas.push({
      id: `mesa-am-lat-izq-${Date.now()}`,
      marca: 'AM-03',
      nombre: 'Amarre Inferior Lateral Izq',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.06, y1: 0.15, z1: 0.06,
      x2: 0.06, y2: 0.15, z2: profZ - 0.06,
      longitudM: profZ - 0.12,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });
    piezas.push({
      id: `mesa-am-lat-der-${Date.now()}`,
      marca: 'AM-04',
      nombre: 'Amarre Inferior Lateral Der',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: W - 0.06, y1: 0.15, z1: 0.06,
      x2: W - 0.06, y2: 0.15, z2: profZ - 0.06,
      longitudM: profZ - 0.12,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });
    piezas.push({
      id: `mesa-am-long-cen-${Date.now()}`,
      marca: 'AM-05',
      nombre: 'Tirante Longitudinal Central Inferior',
      tipo: 'perfil',
      material: 'acero',
      perfilId: pAmarre,
      x1: 0.06, y1: 0.15, z1: profZ / 2,
      x2: W - 0.06, y2: 0.15, z2: profZ / 2,
      longitudM: W - 0.12,
      rotacionDeg: 0,
      corteInicio: '90°', corteFin: '90°',
      cantidad: 1, grupo: 'refuerzo'
    });

    // Cotas
    cotasCad.push(
      { id: `cota-mesa-ancho-${Date.now()}`, x1: 0, y1: -0.10, x2: W, y2: -0.10, valorM: W, eje: 'X', etiqueta: `Largo Cubierta: ${W.toFixed(2)}m` },
      { id: `cota-mesa-alto-${Date.now()}`, x1: -0.10, y1: 0, x2: -0.10, y2: H, valorM: H, eje: 'Y', etiqueta: `Altura Mesa: ${H.toFixed(2)}m` },
      { id: `cota-mesa-prof-${Date.now()}`, x1: W + 0.10, y1: 0, x2: W + 0.10, y2: profZ, valorM: profZ, eje: 'Y', etiqueta: `Fondo / Prof: ${profZ.toFixed(2)}m` }
    );

    // Accesorios
    accesoriosCad.push(
      { id: `acc-m-reg-1-${Date.now()}`, tipo: 'tapa_embellecedor', nombre: 'Regatón Plástico 2"x2"', especificacion: 'Protector Pata Delantera Izq', precioUnitario: 4.5, cantidad: 1, x: 0.06, y: 0.01, z: profZ - 0.06, lado: 'izquierda' },
      { id: `acc-m-reg-2-${Date.now()}`, tipo: 'tapa_embellecedor', nombre: 'Regatón Plástico 2"x2"', especificacion: 'Protector Pata Delantera Der', precioUnitario: 4.5, cantidad: 1, x: W - 0.06, y: 0.01, z: profZ - 0.06, lado: 'derecha' },
      { id: `acc-m-reg-3-${Date.now()}`, tipo: 'tapa_embellecedor', nombre: 'Regatón Plástico 2"x2"', especificacion: 'Protector Pata Posterior Izq', precioUnitario: 4.5, cantidad: 1, x: 0.06, y: 0.01, z: 0.06, lado: 'izquierda' },
      { id: `acc-m-reg-4-${Date.now()}`, tipo: 'tapa_embellecedor', nombre: 'Regatón Plástico 2"x2"', especificacion: 'Protector Pata Posterior Der', precioUnitario: 4.5, cantidad: 1, x: W - 0.06, y: 0.01, z: 0.06, lado: 'derecha' }
    );

    return { piezas, accesoriosCad, cotasCad };
  }

  const esVentanaOReja = design.tipoElemento === 'ventana' || design.tipoElemento === 'reja' || design.tipoElemento === 'reja_abanico' || design.tipoElemento === 'cerco' || design.tipoElemento === 'baranda' || design.tipoElemento === 'mampara';

  // 1. MARCO PERIMÉTRICO (Puertas, Portones, Ventanas, Rejas, Cercos, Barandas)
  // Cabezal Superior
  piezas.push({
    id: `m-sup-${Date.now()}-1`,
    marca: 'M-01',
    nombre: 'Marco Cabezal Superior',
    tipo: 'perfil',
    material: 'acero',
    perfilId: perfilMarcoId,
    x1: 0,
    y1: altoM,
    z1: 0,
    x2: anchoM,
    y2: altoM,
    z2: 0,
    longitudM: anchoM,
    rotacionDeg: 0,
    corteInicio: '45°',
    corteFin: '45°',
    cantidad: 1,
    grupo: 'marco'
  });

  // Jamba Izquierda
  piezas.push({
    id: `m-izq-${Date.now()}-2`,
    marca: 'M-02',
    nombre: 'Marco Jamba Izquierda',
    tipo: 'perfil',
    material: 'acero',
    perfilId: perfilMarcoId,
    x1: 0,
    y1: 0,
    z1: 0,
    x2: 0,
    y2: altoM,
    z2: 0,
    longitudM: altoM,
    rotacionDeg: 0,
    corteInicio: '45°',
    corteFin: '45°',
    cantidad: 1,
    grupo: 'marco'
  });

  // Jamba Derecha
  piezas.push({
    id: `m-der-${Date.now()}-3`,
    marca: 'M-03',
    nombre: 'Marco Jamba Derecha',
    tipo: 'perfil',
    material: 'acero',
    perfilId: perfilMarcoId,
    x1: anchoM,
    y1: 0,
    z1: 0,
    x2: anchoM,
    y2: altoM,
    z2: 0,
    longitudM: altoM,
    rotacionDeg: 0,
    corteInicio: '45°',
    corteFin: '45°',
    cantidad: 1,
    grupo: 'marco'
  });

  // Umbral Inferior (si aplica)
  if (esVentanaOReja) {
    piezas.push({
      id: `m-inf-${Date.now()}-4`,
      marca: 'M-04',
      nombre: 'Marco Umbral Inferior',
      tipo: 'perfil',
      material: 'acero',
      perfilId: perfilMarcoId,
      x1: 0,
      y1: 0,
      z1: 0,
      x2: anchoM,
      y2: 0,
      z2: 0,
      longitudM: anchoM,
      rotacionDeg: 0,
      corteInicio: '45°',
      corteFin: '45°',
      cantidad: 1,
      grupo: 'marco'
    });
  }

  // 2. BASTIDORES DE HOJAS
  const numHojas = Math.max(1, design.numHojas || 1);
  const anchoHojaM = anchoM / numHojas;

  if (design.hojas && design.hojas.length > 0 && design.tipoElemento !== 'reja_abanico') {
    design.hojas.forEach((_, hIdx) => {
      const hXMin = hIdx * anchoHojaM;
      const hXMax = (hIdx + 1) * anchoHojaM;
      const hYMin = 0;
      const hYMax = altoM;

      // Montante Vert Izq
      piezas.push({
        id: `h${hIdx+1}-v1-${Date.now()}-${hIdx}`,
        marca: `B-${String(hIdx * 2 + 1).padStart(2, '0')}`,
        nombre: `Bastidor Vertical Izq Hoja ${hIdx + 1}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: perfilBastidorId,
        x1: hXMin,
        y1: hYMin,
        z1: 0,
        x2: hXMin,
        y2: hYMax,
        z2: 0,
        longitudM: hYMax - hYMin,
        rotacionDeg: 0,
        corteInicio: '45°',
        corteFin: '45°',
        cantidad: 1,
        grupo: 'bastidor'
      });

      // Montante Vert Der
      piezas.push({
        id: `h${hIdx+1}-v2-${Date.now()}-${hIdx}`,
        marca: `B-${String(hIdx * 2 + 2).padStart(2, '0')}`,
        nombre: `Bastidor Vertical Der Hoja ${hIdx + 1}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: perfilBastidorId,
        x1: hXMax,
        y1: hYMin,
        z1: 0,
        x2: hXMax,
        y2: hYMax,
        z2: 0,
        longitudM: hYMax - hYMin,
        rotacionDeg: 0,
        corteInicio: '45°',
        corteFin: '45°',
        cantidad: 1,
        grupo: 'bastidor'
      });

      // Travesaño Horiz Inf
      piezas.push({
        id: `h${hIdx+1}-h1-${Date.now()}-${hIdx}`,
        marca: `B-${String(hIdx * 2 + 3).padStart(2, '0')}`,
        nombre: `Travesaño Inferior Zócalo Hoja ${hIdx + 1}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: perfilBastidorId,
        x1: hXMin,
        y1: hYMin,
        z1: 0,
        x2: hXMax,
        y2: hYMin,
        z2: 0,
        longitudM: hXMax - hXMin,
        rotacionDeg: 0,
        corteInicio: '45°',
        corteFin: '45°',
        cantidad: 1,
        grupo: 'bastidor'
      });

      // Travesaño Horiz Sup
      piezas.push({
        id: `h${hIdx+1}-h2-${Date.now()}-${hIdx}`,
        marca: `B-${String(hIdx * 2 + 4).padStart(2, '0')}`,
        nombre: `Travesaño Superior Cabezal Hoja ${hIdx + 1}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: perfilBastidorId,
        x1: hXMin,
        y1: hYMax,
        z1: 0,
        x2: hXMax,
        y2: hYMax,
        z2: 0,
        longitudM: hXMax - hXMin,
        rotacionDeg: 0,
        corteInicio: '45°',
        corteFin: '45°',
        cantidad: 1,
        grupo: 'bastidor'
      });
    });
  }

  // 3. REFUERZOS Y DIVISIONES
  if (design.divisiones && design.divisiones.length > 0) {
    design.divisiones.forEach((div, idx) => {
      const pDiv = div.perfilId || perfilRefuerzoId;
      if (div.tipo === 'horizontal') {
        const yPos = div.posicionM || (div.porcentaje ? (div.porcentaje / 100) * altoM : altoM / 2);
        piezas.push({
          id: `div-h-${idx}-${Date.now()}`,
          marca: `R-0${idx + 1}`,
          nombre: `Refuerzo Horizontal Intermedio`,
          tipo: 'perfil',
          material: 'acero',
          perfilId: pDiv,
          x1: 0,
          y1: yPos,
          z1: 0,
          x2: anchoM,
          y2: yPos,
          z2: 0,
          longitudM: anchoM,
          rotacionDeg: 0,
          corteInicio: '90°',
          corteFin: '90°',
          cantidad: 1,
          grupo: 'refuerzo'
        });
      } else if (div.tipo === 'vertical') {
        const xPos = div.posicionM || (div.porcentaje ? (div.porcentaje / 100) * anchoM : anchoM / 2);
        piezas.push({
          id: `div-v-${idx}-${Date.now()}`,
          marca: `R-0${idx + 1}`,
          nombre: `Refuerzo Vertical Intermedio`,
          tipo: 'perfil',
          material: 'acero',
          perfilId: pDiv,
          x1: xPos,
          y1: 0,
          z1: 0,
          x2: xPos,
          y2: altoM,
          z2: 0,
          longitudM: altoM,
          rotacionDeg: 0,
          corteInicio: '90°',
          corteFin: '90°',
          cantidad: 1,
          grupo: 'refuerzo'
        });
      }
    });
  }

  // 4. PANELES / RELLENOS
  if (design.paneles && design.paneles.length > 0) {
    design.paneles.forEach((panel, pIdx) => {
      const hojaIdx = panel.hojaIndex || 0;
      const hXMin = hojaIdx * anchoHojaM;
      const pxMin = hXMin + panel.relX * anchoHojaM;
      const pxMax = hXMin + (panel.relX + panel.relW) * anchoHojaM;
      const pyMin = panel.relY * altoM;
      const pyMax = (panel.relY + panel.relH) * altoM;

      const pW = pxMax - pxMin;
      const pH = pyMax - pyMin;

      if (panel.tipoRelleno === 'plancha' || panel.tipoRelleno === 'plancha_estriada' || panel.tipoRelleno === 'plancha_perforada') {
        const subtipo = panel.planchaConfig?.subtipo || (panel.tipoRelleno === 'plancha_estriada' ? 'estriada' : (panel.tipoRelleno === 'plancha_perforada' ? 'perforada' : 'acanalada'));
        piezas.push({
          id: `pan-plancha-${pIdx}-${Date.now()}`,
          marca: `PL-0${pIdx + 1}`,
          nombre: panel.nombre || `Plancha Metálica (${subtipo})`,
          tipo: 'plancha',
          material: 'acero',
          perfilId: 'plancha-1.2mm',
          x1: pxMin,
          y1: pyMin,
          z1: 0,
          x2: pxMax,
          y2: pyMax,
          z2: 0,
          longitudM: Math.hypot(pW, pH),
          rotacionDeg: 0,
          corteInicio: '90°',
          corteFin: '90°',
          esPlancha: true,
          anchoPlanchaM: pW,
          altoPlanchaM: pH,
          espesorPlanchaMm: panel.espesorMm || 1.2,
          subtipoPlancha: subtipo as any,
          tipoRelleno: panel.tipoRelleno,
          cantidad: 1,
          grupo: 'panel'
        });
      } else if (panel.tipoRelleno === 'vidrio') {
        piezas.push({
          id: `pan-vidrio-${pIdx}-${Date.now()}`,
          marca: `VD-0${pIdx + 1}`,
          nombre: panel.nombre || 'Vidrio Templado',
          tipo: 'vidrio',
          material: 'especial',
          perfilId: 'vidrio-6mm',
          x1: pxMin,
          y1: pyMin,
          z1: 0,
          x2: pxMax,
          y2: pyMax,
          z2: 0,
          longitudM: Math.hypot(pW, pH),
          rotacionDeg: 0,
          corteInicio: '90°',
          corteFin: '90°',
          esPlancha: true,
          anchoPlanchaM: pW,
          altoPlanchaM: pH,
          espesorPlanchaMm: panel.espesorMm || 6,
          tipoRelleno: 'vidrio',
          cantidad: 1,
          grupo: 'panel'
        });
      } else if (panel.tipoRelleno === 'reja' || panel.rejaConfig) {
        const pBarraId = panel.rejaConfig?.perfilId || design.barrotesConfig?.perfilId || 'cuad-1x1-1.2';
        const numBarras = panel.rejaConfig?.cantidadBarras || 5;
        const orient = panel.rejaConfig?.orientacion || 'vertical';

        if (orient === 'vertical') {
          for (let b = 0; b < numBarras; b++) {
            const bx = pxMin + (b + 1) * pW / (numBarras + 1);
            piezas.push({
              id: `pan-bar-${pIdx}-${b}-${Date.now()}`,
              marca: `BR-0${b + 1}`,
              nombre: `Barrote Vertical ${b + 1}`,
              tipo: 'perfil',
              material: 'acero',
              perfilId: pBarraId,
              x1: bx,
              y1: pyMin,
              z1: 0,
              x2: bx,
              y2: pyMax,
              z2: 0,
              longitudM: pH,
              rotacionDeg: 0,
              corteInicio: '90°',
              corteFin: '90°',
              cantidad: 1,
              grupo: 'barrote'
            });
          }
        } else {
          for (let b = 0; b < numBarras; b++) {
            const by = pyMin + (b + 1) * pH / (numBarras + 1);
            piezas.push({
              id: `pan-bar-h-${pIdx}-${b}-${Date.now()}`,
              marca: `BR-0${b + 1}`,
              nombre: `Barrote Horizontal ${b + 1}`,
              tipo: 'perfil',
              material: 'acero',
              perfilId: pBarraId,
              x1: pxMin,
              y1: by,
              z1: 0,
              x2: pxMax,
              y2: by,
              z2: 0,
              longitudM: pW,
              rotacionDeg: 0,
              corteInicio: '90°',
              corteFin: '90°',
              cantidad: 1,
              grupo: 'barrote'
            });
          }
        }
      }
    });
  } else if (design.barrotesConfig && design.barrotesConfig.activo) {
    const numBarras = Math.max(1, design.barrotesConfig.cantidad || 8);
    const pBarraId = design.barrotesConfig.perfilId || 'cuad-1x1-1.2';
    for (let b = 0; b < numBarras; b++) {
      const bx = (b + 1) * anchoM / (numBarras + 1);
      piezas.push({
        id: `bar-gral-${b}-${Date.now()}`,
        marca: `BR-0${b + 1}`,
        nombre: `Barrote Vertical ${b + 1}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: pBarraId,
        x1: bx,
        y1: 0,
        z1: 0,
        x2: bx,
        y2: altoM,
        z2: 0,
        longitudM: altoM,
        rotacionDeg: 0,
        corteInicio: '90°',
        corteFin: '90°',
        cantidad: 1,
        grupo: 'barrote'
      });
    }
  }

  // 4.B REJA ARTÍSTICA ABANICO / SOL NACIENTE (P008)
  if (design.tipoElemento === 'reja_abanico') {
    const pCurvoId = design.perfilRefuerzoId || 'cuad-1/2x1/2-solido';
    const pRayoId = design.barrotesConfig?.perfilId || 'cuad-1/2x1/2-solido';
    const minDim = Math.min(anchoM, altoM);
    const r1 = Number((minDim * 0.28).toFixed(3));
    const r2 = Number((minDim * 0.68).toFixed(3));

    // Arco interior concéntrico
    piezas.push({
      id: `arc-abanico-1-${Date.now()}`,
      marca: 'ARC-01',
      nombre: 'Arco Interior Concéntrico (P008)',
      tipo: 'tubo_curvo',
      material: 'acero',
      perfilId: pCurvoId,
      x1: 0,
      y1: r1,
      z1: 0,
      x2: r1,
      y2: 0,
      z2: 0,
      longitudM: Number(((Math.PI / 2) * r1).toFixed(3)),
      rotacionDeg: 0,
      corteInicio: '90°',
      corteFin: '90°',
      esCurvo: true,
      controlX: r1,
      controlY: r1,
      flechaM: Number((r1 * 0.25).toFixed(3)),
      cantidad: 1,
      grupo: 'arco'
    });

    // Arco exterior concéntrico
    piezas.push({
      id: `arc-abanico-2-${Date.now()}`,
      marca: 'ARC-02',
      nombre: 'Arco Exterior Concéntrico (P008)',
      tipo: 'tubo_curvo',
      material: 'acero',
      perfilId: pCurvoId,
      x1: 0,
      y1: r2,
      z1: 0,
      x2: r2,
      y2: 0,
      z2: 0,
      longitudM: Number(((Math.PI / 2) * r2).toFixed(3)),
      rotacionDeg: 0,
      corteInicio: '90°',
      corteFin: '90°',
      esCurvo: true,
      controlX: r2,
      controlY: r2,
      flechaM: Number((r2 * 0.25).toFixed(3)),
      cantidad: 1,
      grupo: 'arco'
    });

    // Rayos principales desde el origen (0, 0) hasta el marco perimétrico
    const numRayos = 10;
    for (let i = 1; i <= numRayos; i++) {
      const angleDeg = (90 / (numRayos + 1)) * i;
      const angleRad = (angleDeg * Math.PI) / 180;
      let endX = anchoM;
      let endY = anchoM * Math.tan(angleRad);
      if (endY > altoM) {
        endY = altoM;
        endX = altoM / Math.tan(angleRad);
      }
      const rayLen = Math.hypot(endX, endY);
      piezas.push({
        id: `rayo-p008-${i}-${Date.now()}`,
        marca: `RY-${String(i).padStart(2, '0')}`,
        nombre: `Rayo Radial ${i} (${angleDeg.toFixed(0)}°)`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: pRayoId,
        x1: 0,
        y1: 0,
        z1: 0,
        x2: Number(endX.toFixed(3)),
        y2: Number(endY.toFixed(3)),
        z2: 0,
        longitudM: Number(rayLen.toFixed(3)),
        rotacionDeg: 0,
        corteInicio: '90°',
        corteFin: '90°',
        cantidad: 1,
        grupo: 'barrote'
      });
    }

    // Rayos cortos decorativos en el centro del sol (hasta r1)
    const numRayosCortos = 8;
    for (let j = 1; j <= numRayosCortos; j++) {
      const angleDeg = (90 / (numRayosCortos + 1)) * j;
      const angleRad = (angleDeg * Math.PI) / 180;
      const endX = r1 * Math.cos(angleRad);
      const endY = r1 * Math.sin(angleRad);
      piezas.push({
        id: `rayo-corto-p008-${j}-${Date.now()}`,
        marca: `RC-${String(j).padStart(2, '0')}`,
        nombre: `Rayo Corto Sol ${j}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: pRayoId,
        x1: 0,
        y1: 0,
        z1: 0,
        x2: Number(endX.toFixed(3)),
        y2: Number(endY.toFixed(3)),
        z2: 0,
        longitudM: Number(r1.toFixed(3)),
        rotacionDeg: 0,
        corteInicio: '90°',
        corteFin: '90°',
        cantidad: 1,
        grupo: 'detalle'
      });
    }
  }

  // 5. TUBOS PERSONALIZADOS
  if (design.tubosPersonalizados && design.tubosPersonalizados.length > 0) {
    design.tubosPersonalizados.forEach((t, tIdx) => {
      piezas.push({
        id: t.id || `tubo-p-${tIdx}-${Date.now()}`,
        marca: t.marca || `TP-0${tIdx + 1}`,
        nombre: t.etiqueta || `Tubo Personalizado ${tIdx + 1}`,
        tipo: 'perfil',
        material: 'acero',
        perfilId: t.perfilId || perfilBastidorId,
        x1: t.x1,
        y1: t.y1,
        z1: 0,
        x2: t.x2,
        y2: t.y2,
        z2: 0,
        longitudM: t.longitudM || Math.hypot(t.x2 - t.x1, t.y2 - t.y1),
        rotacionDeg: t.anguloDeg || 0,
        corteInicio: '90°',
        corteFin: '90°',
        cantidad: 1,
        grupo: 'personalizado'
      });
    });
  }

  // 6. ARCO SUPERIOR
  if (design.arco && design.arco.activo) {
    piezas.push({
      id: `arco-sup-${Date.now()}`,
      marca: 'ARC-01',
      nombre: 'Arco Superior Rolado',
      tipo: 'tubo_curvo',
      material: 'acero',
      perfilId: design.arco.perfilArcoId || perfilMarcoId,
      x1: 0,
      y1: altoM,
      z1: 0,
      x2: anchoM,
      y2: altoM,
      z2: 0,
      longitudM: anchoM * 1.2,
      rotacionDeg: 0,
      corteInicio: '90°',
      corteFin: '90°',
      esCurvo: true,
      flechaM: design.arco.flechaM || 0.4,
      tipoArco: design.arco.tipo,
      cantidad: 1,
      grupo: 'arco'
    });
  }

  // 7. ACCESORIOS Y CHAPA
  if (design.chapaConfig && design.chapaConfig.activa) {
    const chX = design.chapaConfig.lado === 'izquierda' ? 0.05 : anchoM - 0.05;
    accesoriosCad.push({
      id: `acc-chapa-${Date.now()}`,
      tipo: 'chapa_sobreponer',
      nombre: design.chapaConfig.modelo || 'Cerradura de Sobreponer Forte 3G',
      x: chX,
      y: design.chapaConfig.posicionYM || 1.00,
      z: 0,
      especificacion: 'Cerradura de alta seguridad 3 golpes',
      precioUnitario: 85.00,
      cantidad: 1
    });
  }

  if (design.bisagrasConfig) {
    const cantBis = design.bisagrasConfig.cantidad || 3;
    const bisX = design.bisagrasConfig.lado === 'derecha' ? anchoM : 0;
    for (let b = 0; b < cantBis; b++) {
      const bisY = (b + 1) * altoM / (cantBis + 1);
      accesoriosCad.push({
        id: `acc-bis-${b}-${Date.now()}`,
        tipo: 'bisagra_soldable',
        nombre: `Bisagra Tubular ${design.bisagrasConfig.medidaPulgadas || '3"'}`,
        x: bisX,
        y: bisY,
        z: 0,
        especificacion: 'Bisagra soldable con pin',
        precioUnitario: 10.50,
        cantidad: 1
      });
    }
  }

  // 8. COTAS CAD
  cotasCad.push({
    id: `cota-ancho-${Date.now()}`,
    x1: 0,
    y1: -0.15,
    x2: anchoM,
    y2: -0.15,
    valorM: anchoM,
    eje: 'X',
    etiqueta: `Ancho Total: ${anchoM.toFixed(2)}m`
  });

  cotasCad.push({
    id: `cota-alto-${Date.now()}`,
    x1: -0.15,
    y1: 0,
    x2: -0.15,
    y2: altoM,
    valorM: altoM,
    eje: 'Y',
    etiqueta: `Alto Total: ${altoM.toFixed(2)}m`
  });

  return { piezas, accesoriosCad, cotasCad };
}

export function asegurarCad(d: any): HerreriaDesign {
  const base = {
    piezas: [],
    accesoriosCad: [],
    cotasCad: [],
    ...d
  };
  // Si es un lienzo en blanco o diseño personalizado vacío, respetar el lienzo en blanco
  if (base.isLienzoBlanco || base.tipoElemento === 'personalizado') {
    return base;
  }
  if (!base.piezas || base.piezas.length === 0) {
    const gen = generarPiezasCadDesdeDiseno(base);
    base.piezas = gen.piezas;
    if (!base.accesoriosCad || base.accesoriosCad.length === 0) {
      base.accesoriosCad = gen.accesoriosCad;
    }
    if (!base.cotasCad || base.cotasCad.length === 0) {
      base.cotasCad = gen.cotasCad;
    }
  }
  return base;
}

// Generador de plantillas iniciales según elemento
export function crearDisenoPorElemento(tipo: TipoElementoHerreria): HerreriaDesign {
  return asegurarCad(crearDisenoPorElementoRaw(tipo));
}

function crearDisenoPorElementoRaw(tipo: TipoElementoHerreria): any {
  switch (tipo) {
    case 'porton':
      return { ...PORTON_METALLICO_DEMO, id: 'porton-' + Date.now() };

    case 'puerta':
      return {
        id: 'puerta-' + Date.now(),
        tipoElemento: 'puerta',
        nombre: 'PUERTA PRINCIPAL DE SEGURIDAD',
        descripcion: 'Puerta peatonal metálica de 1 hoja con marco tubular, panel mixto plancha/vidrio, cerradura Forte y manija',
        anchoM: 1.00,
        altoM: 2.20,
        profundidadMarcoMm: 75,
        perfilMarcoId: 'rect-3x1.5-2.0',
        perfilBastidorId: 'cuad-1.5x1.5-1.5',
        perfilRefuerzoId: 'rect-2x1-1.5',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 1.00, apertura: 'derecha' }],
        tipoAperturaPuerta: 'derecha',
        sentidoAperturaTexto: 'Apertura Batiente Derecha hacia Interior',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-1x1-1.2',
          orientacion: 'vertical',
          separacionCm: 12,
          cantidad: 6,
          separacionRealCm: 12
        },
        divisiones: [
          { id: 'div-p-1', tipo: 'horizontal', posicionM: 1.10, porcentaje: 50, perfilId: 'rect-2x1-1.5' }
        ],
        paneles: [
          {
            id: 'pan-p-sup',
            nombre: 'Zona Superior - Vidrio Templado',
            hojaIndex: 0,
            relX: 0,
            relY: 0.5,
            relW: 1,
            relH: 0.5,
            tipoRelleno: 'vidrio',
            espesorMm: 6,
            vidrioConfig: {
              subtipo: 'templado',
              espesorMm: 6,
              colorTinte: 'Incoloro / Arenado',
              precioM2: 120.0
            }
          },
          {
            id: 'pan-p-inf',
            nombre: 'Zona Inferior - Plancha LAC 1/16"',
            hojaIndex: 0,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 0.5,
            tipoRelleno: 'plancha',
            espesorMm: 1.5,
            planchaConfig: {
              subtipo: 'lisa',
              calibre: '1/16" (1.5mm)',
              pesoKgM2: 12.0,
              precioM2: 85.0
            }
          }
        ],
        accesorios: [
          { id: 'acc-1', categoria: 'bisagra', nombre: 'Bisagra Tubular 5/8" x 3"', descripcion: '3 bisagras', unidad: 'und', cantidad: 3, precioUnitario: 9.5, incluido: true },
          { id: 'acc-2', categoria: 'cerradura', nombre: 'Cerradura de Sobreponer Forte 3 Golpes', descripcion: 'Llave de puntos', unidad: 'und', cantidad: 1, precioUnitario: 85.0, incluido: true },
          { id: 'acc-3', categoria: 'manija', nombre: 'Manija Tubular Inox 40cm', descripcion: 'Tirador exterior', unidad: 'par', cantidad: 1, precioUnitario: 65.0, incluido: true }
        ],
        // Cerrajería y Accesorios Modificables
        chapaConfig: {
          activa: true,
          modelo: 'Forte Clásica 3 Golpes',
          tipo: 'sobreponer',
          posicionYM: 1.00,
          lado: 'derecha',
          conManija: true,
          tipoManija: 'Tubular Inox 40cm'
        },
        bisagrasConfig: {
          cantidad: 3,
          tipo: 'tubular_con_pin',
          medidaPulgadas: '3"',
          lado: 'izquierda',
          distribucion: 'automatica',
          posicionesY: [0.25, 1.10, 1.95]
        },
        cerrojosList: [
          {
            id: 'crr-1',
            tipo: 'horizontal',
            posicionYM: 1.60,
            longitudCm: 25,
            lado: 'derecha',
            activo: true,
            modelo: 'Pasador de Seguridad Redondo 1/2"'
          },
          {
            id: 'crr-2',
            tipo: 'vertical_suelo',
            posicionYM: 0.10,
            longitudCm: 40,
            lado: 'derecha',
            activo: false,
            modelo: 'Cerrojo al Piso con Casquillo'
          }
        ],
        // Configuración de Arco Superior
        arco: {
          activo: false,
          tipo: 'medio_punto',
          flechaM: 0.40,
          perfilArcoId: 'rect-3x1.5-2.0',
          conBarrotesRadiales: true,
          cantidadBarrotesArco: 5
        },
        tubosPersonalizados: [],
        acabado: {
          tipoPintura: 'esmalte_sintetico',
          colorNombre: 'Negro Mate',
          colorHex: '#0f172a',
          manosPintura: 2,
          costoPorM2: 30.0
        },
        manoDeObra: {
          diasEstimados: 2,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 50,
          costoSoldaduraHoras: 90,
          costoArmadoHoras: 80,
          costoEsmeriladoHoras: 40,
          costoPinturaHoras: 60,
          costoInstalacion: 150,
          costoTransporte: 70
        },
        fechaCreacion: '2026-09-20',
        ultimaModificacion: '2026-09-20'
      };

    case 'reja':
      return {
        id: 'reja-' + Date.now(),
        tipoElemento: 'reja',
        nombre: 'REJA DE SEGURIDAD MODULAR',
        descripcion: 'Reja de protección para vano exterior con marco perimétrico, barrotes verticales tubulares y puntas de seguridad',
        anchoM: 2.00,
        altoM: 1.50,
        profundidadMarcoMm: 38,
        perfilMarcoId: 'cuad-1.5x1.5-1.5',
        perfilBastidorId: 'cuad-1.5x1.5-1.5',
        perfilRefuerzoId: 'rect-2x1-1.5',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 2.00, apertura: 'fija' }],
        sentidoAperturaTexto: 'Estructura fija amurada a mampostería',
        barrotesConfig: {
          activo: true,
          perfilId: 'cuad-1x1-1.2',
          orientacion: 'vertical',
          separacionCm: 12,
          cantidad: 14,
          separacionRealCm: 12.2
        },
        divisiones: [],
        paneles: [
          {
            id: 'pan-reja-full',
            nombre: 'Paño de Barrotes Verticales',
            hojaIndex: 0,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 1,
            tipoRelleno: 'reja',
            espesorMm: 25,
            rejaConfig: {
              orientacion: 'vertical',
              perfilId: 'cuad-1x1-1.2',
              separacionObjetivoCm: 12,
              separacionRealCm: 12.2,
              cantidadBarras: 14
            }
          }
        ],
        accesorios: [
          { id: 'acc-reja-puntas', categoria: 'decorativo', nombre: 'Puntas de Lanza Flecha Forjada', descripcion: 'Coronación superior', unidad: 'und', cantidad: 14, precioUnitario: 3.5, incluido: true },
          { id: 'acc-reja-anclajes', categoria: 'accesorio', nombre: 'Pernos de Anclaje Hilti 3/8" x 3"', descripcion: 'Fijación a concreto', unidad: 'und', cantidad: 6, precioUnitario: 4.5, incluido: true }
        ],
        acabado: {
          tipoPintura: 'anticorrosivo_simple',
          colorNombre: 'Gris Grafito Forja',
          colorHex: '#334155',
          manosPintura: 2,
          costoPorM2: 24.0
        },
        manoDeObra: {
          diasEstimados: 1.5,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 40,
          costoSoldaduraHoras: 70,
          costoArmadoHoras: 50,
          costoEsmeriladoHoras: 30,
          costoPinturaHoras: 45,
          costoInstalacion: 120,
          costoTransporte: 60
        },
        fechaCreacion: '2026-09-20',
        ultimaModificacion: '2026-09-20'
      };

    case 'reja_abanico':
      return {
        id: 'reja_abanico-' + Date.now(),
        tipoElemento: 'reja_abanico',
        nombre: 'REJA ARTÍSTICA ABANICO / SOL NACIENTE (P008)',
        descripcion: 'Reja ornamental con diseño de sol naciente (abanico), arcos concéntricos rolados y barrotes radiales desde esquina inferior izquierda.',
        anchoM: 1.00,
        altoM: 1.60,
        profundidadMarcoMm: 38,
        perfilMarcoId: 'cuad-1.5x1.5-1.5',
        perfilBastidorId: 'cuad-1x1-1.2',
        perfilRefuerzoId: 'cuad-1/2x1/2-solido',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 1.00, apertura: 'fija' }],
        sentidoAperturaTexto: 'Reja fija de vano con abanico curvo radial',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-1/2x1/2-solido',
          orientacion: 'diagonal',
          separacionCm: 10,
          cantidad: 10,
          separacionRealCm: 10.0
        },
        divisiones: [],
        paneles: [],
        accesorios: [
          { id: 'acc-reja-anclajes', categoria: 'accesorio', nombre: 'Pernos de Anclaje Hilti 3/8" x 3"', descripcion: 'Fijación a mampostería', unidad: 'und', cantidad: 6, precioUnitario: 4.5, incluido: true }
        ],
        acabado: {
          tipoPintura: 'esmalte_sintetico',
          colorNombre: 'Negro Forja Satinado',
          colorHex: '#0f172a',
          manosPintura: 2,
          costoPorM2: 32.0
        },
        manoDeObra: {
          diasEstimados: 2,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 50,
          costoSoldaduraHoras: 90,
          costoArmadoHoras: 80,
          costoEsmeriladoHoras: 40,
          costoPinturaHoras: 50,
          costoInstalacion: 130,
          costoTransporte: 60
        },
        fechaCreacion: '2026-09-20',
        ultimaModificacion: '2026-09-20'
      };

    case 'ventana':
      return {
        id: 'ventana-' + Date.now(),
        tipoElemento: 'ventana',
        nombre: 'VENTANA METÁLICA CORREDIZA CON REJA',
        descripcion: 'Ventana de 2 hojas corredizas con marco en tubo rectangular, hojas vidriadas y reja de protección exterior integrada',
        anchoM: 1.50,
        altoM: 1.20,
        profundidadMarcoMm: 50,
        perfilMarcoId: 'rect-2x1-1.5',
        perfilBastidorId: 'cuad-1x1-1.2',
        perfilRefuerzoId: 'rect-2x1-1.5',
        numHojas: 2,
        hojas: [
          { id: 'h1', numero: 1, anchoM: 0.75, apertura: 'corrediza' },
          { id: 'h2', numero: 2, anchoM: 0.75, apertura: 'corrediza' }
        ],
        sentidoAperturaTexto: '2 Hojas Corredizas sobre Riel',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-3/4x3/4-1.2',
          orientacion: 'vertical',
          separacionCm: 12,
          cantidad: 10,
          separacionRealCm: 12.0
        },
        divisiones: [],
        paneles: [
          {
            id: 'pan-v1',
            nombre: 'Hoja 1 - Vidrio Simple 6mm',
            hojaIndex: 0,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 1,
            tipoRelleno: 'vidrio',
            espesorMm: 6,
            vidrioConfig: { subtipo: 'crudo', espesorMm: 6, colorTinte: 'Incoloro', precioM2: 75.0 }
          },
          {
            id: 'pan-v2',
            nombre: 'Hoja 2 - Vidrio Simple 6mm',
            hojaIndex: 1,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 1,
            tipoRelleno: 'vidrio',
            espesorMm: 6,
            vidrioConfig: { subtipo: 'crudo', espesorMm: 6, colorTinte: 'Incoloro', precioM2: 75.0 }
          }
        ],
        accesorios: [
          { id: 'acc-v-aldaba', categoria: 'cerradura', nombre: 'Pestillos / Aldabas de Ventana', descripcion: 'Traba central', unidad: 'par', cantidad: 1, precioUnitario: 18.0, incluido: true },
          { id: 'acc-v-ruedas', categoria: 'rueda', nombre: 'Garruchas de Ventana Corrediza con Rodamiento', descripcion: '4 unidades', unidad: 'und', cantidad: 4, precioUnitario: 8.5, incluido: true }
        ],
        acabado: {
          tipoPintura: 'esmalte_sintetico',
          colorNombre: 'Blanco Esmalte',
          colorHex: '#ffffff',
          manosPintura: 2,
          costoPorM2: 26.0
        },
        manoDeObra: {
          diasEstimados: 1.5,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 35,
          costoSoldaduraHoras: 60,
          costoArmadoHoras: 50,
          costoEsmeriladoHoras: 25,
          costoPinturaHoras: 40,
          costoInstalacion: 100,
          costoTransporte: 50
        },
        fechaCreacion: '2026-09-20',
        ultimaModificacion: '2026-09-20'
      };

    case 'cerco':
      return {
        id: 'cerco-' + Date.now(),
        tipoElemento: 'cerco',
        nombre: 'CERCO PERIMÉTRICO DE SEGURIDAD',
        descripcion: 'Tramo de cerco perimétrico con postes tubulares de 2", bastidor rígido y malla electrosoldada / aluzinc',
        anchoM: 3.00,
        altoM: 2.20,
        profundidadMarcoMm: 50,
        perfilMarcoId: 'cuad-2x2-2.0',
        perfilBastidorId: 'cuad-1.5x1.5-1.5',
        perfilRefuerzoId: 'rect-2x1-1.5',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 3.00, apertura: 'fija' }],
        sentidoAperturaTexto: 'Cerco Fijo de Protección Perimetral',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-1x1-1.2',
          orientacion: 'vertical',
          separacionCm: 12,
          cantidad: 20,
          separacionRealCm: 12
        },
        divisiones: [
          { id: 'div-c-1', tipo: 'horizontal', posicionM: 1.10, porcentaje: 50, perfilId: 'rect-2x1-1.5' }
        ],
        paneles: [
          {
            id: 'pan-c-1',
            nombre: 'Malla Electrosoldada 50x50x3mm',
            hojaIndex: 0,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 1,
            tipoRelleno: 'malla',
            espesorMm: 3,
            mallaConfig: { tipoMalla: 'electrosoldada', cocada: '50x50 mm', precioM2: 45.0 }
          }
        ],
        accesorios: [
          { id: 'acc-c-pua', categoria: 'decorativo', nombre: 'Concertina / Puntas de Seguridad Superior', descripcion: '3 metros lineales', unidad: 'm', cantidad: 3, precioUnitario: 22.0, incluido: true },
          { id: 'acc-c-placa', categoria: 'refuerzo', nombre: 'Placas Base de Anclaje 150x150x6mm', descripcion: '2 unidades', unidad: 'und', cantidad: 2, precioUnitario: 25.0, incluido: true }
        ],
        acabado: {
          tipoPintura: 'anticorrosivo_simple',
          colorNombre: 'Verde Oscuro Protección',
          colorHex: '#14532d',
          manosPintura: 2,
          costoPorM2: 24.0
        },
        manoDeObra: {
          diasEstimados: 2,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 40,
          costoSoldaduraHoras: 80,
          costoArmadoHoras: 60,
          costoEsmeriladoHoras: 30,
          costoPinturaHoras: 50,
          costoInstalacion: 180,
          costoTransporte: 90
        },
        fechaCreacion: '2026-09-20',
        ultimaModificacion: '2026-09-20'
      };

    case 'baranda':
      return {
        id: 'baranda-' + Date.now(),
        tipoElemento: 'baranda',
        nombre: 'BARANDA METÁLICA MODERNA',
        descripcion: 'Baranda para escalera o balcón con pasamanos redondo de 2", parantes cuadrados y balaustres horizontales',
        anchoM: 2.50,
        altoM: 1.00,
        profundidadMarcoMm: 50,
        perfilMarcoId: 'red-2-2.0',
        perfilBastidorId: 'cuad-1.5x1.5-1.5',
        perfilRefuerzoId: 'rect-2x1-1.5',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 2.50, apertura: 'fija' }],
        sentidoAperturaTexto: 'Baranda fija de seguridad con pasamanos continuo',
        barrotesConfig: {
          activo: true,
          perfilId: 'cuad-3/4x3/4-1.2',
          orientacion: 'horizontal',
          separacionCm: 15,
          cantidad: 5,
          separacionRealCm: 15.0
        },
        divisiones: [],
        paneles: [
          {
            id: 'pan-bar-1',
            nombre: 'Líneas Horizontales de Acero',
            hojaIndex: 0,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 1,
            tipoRelleno: 'reja',
            espesorMm: 20,
            rejaConfig: {
              orientacion: 'horizontal',
              perfilId: 'cuad-3/4x3/4-1.2',
              separacionObjetivoCm: 15,
              separacionRealCm: 15.0,
              cantidadBarras: 5
            }
          }
        ],
        accesorios: [
          { id: 'acc-b-anclaje', categoria: 'accesorio', nombre: 'Bridas de Piso y Tapas Embellecedoras', descripcion: '4 unidades', unidad: 'und', cantidad: 4, precioUnitario: 16.0, incluido: true }
        ],
        acabado: {
          tipoPintura: 'esmalte_sintetico',
          colorNombre: 'Negro Forja Satinado',
          colorHex: '#1e293b',
          manosPintura: 2,
          costoPorM2: 32.0
        },
        manoDeObra: {
          diasEstimados: 1.5,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 40,
          costoSoldaduraHoras: 60,
          costoArmadoHoras: 50,
          costoEsmeriladoHoras: 35,
          costoPinturaHoras: 45,
          costoInstalacion: 140,
          costoTransporte: 60
        },
        fechaCreacion: '2026-09-20',
        ultimaModificacion: '2026-09-20'
      };

    case 'mampara':
      return {
        id: 'mampara-' + Date.now(),
        tipoElemento: 'mampara',
        nombre: 'MAMPARA METÁLICA DE VIDRIO REPARTIDO',
        descripcion: 'Mampara divisoria industrial de 3 paños con marcos tubulares esbeltos y vidrio templado de 6mm',
        anchoM: 3.00,
        altoM: 2.40,
        profundidadMarcoMm: 75,
        perfilMarcoId: 'rect-3x1.5-2.0',
        perfilBastidorId: 'rect-2x1-1.5',
        perfilRefuerzoId: 'rect-2x1-1.5',
        numHojas: 3,
        hojas: [
          { id: 'h1', numero: 1, anchoM: 1.00, apertura: 'fija' },
          { id: 'h2', numero: 2, anchoM: 1.00, apertura: 'corrediza' },
          { id: 'h3', numero: 3, anchoM: 1.00, apertura: 'fija' }
        ],
        sentidoAperturaTexto: 'Mampara 3 Hojas (1 Corrediza Central + 2 Fijas)',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-1x1-1.2',
          orientacion: 'vertical',
          separacionCm: 15,
          cantidad: 0,
          separacionRealCm: 15
        },
        divisiones: [
          { id: 'div-m-1', tipo: 'horizontal', posicionM: 0.80, porcentaje: 33, perfilId: 'rect-2x1-1.5' },
          { id: 'div-m-2', tipo: 'horizontal', posicionM: 1.60, porcentaje: 66, perfilId: 'rect-2x1-1.5' }
        ],
        paneles: [
          {
            id: 'pan-m1',
            nombre: 'Vidrio Templado 6mm Paño 1',
            hojaIndex: 0,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 1,
            tipoRelleno: 'vidrio',
            espesorMm: 6,
            vidrioConfig: { subtipo: 'templado', espesorMm: 6, colorTinte: 'Incoloro', precioM2: 125.0 }
          },
          {
            id: 'pan-m2',
            nombre: 'Vidrio Templado 6mm Paño 2',
            hojaIndex: 1,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 1,
            tipoRelleno: 'vidrio',
            espesorMm: 6,
            vidrioConfig: { subtipo: 'templado', espesorMm: 6, colorTinte: 'Incoloro', precioM2: 125.0 }
          },
          {
            id: 'pan-m3',
            nombre: 'Vidrio Templado 6mm Paño 3',
            hojaIndex: 2,
            relX: 0,
            relY: 0,
            relW: 1,
            relH: 1,
            tipoRelleno: 'vidrio',
            espesorMm: 6,
            vidrioConfig: { subtipo: 'templado', espesorMm: 6, colorTinte: 'Incoloro', precioM2: 125.0 }
          }
        ],
        accesorios: [
          { id: 'acc-m-riel', categoria: 'riel', nombre: 'Riel Superior Colgante y Rodajes de Poliacetal', descripcion: 'Sistema corredizo suave', unidad: 'jgo', cantidad: 1, precioUnitario: 140.0, incluido: true },
          { id: 'acc-m-tirador', categoria: 'manija', nombre: 'Tirador Embutido de Acero Inox', descripcion: 'Cierre discreto', unidad: 'und', cantidad: 2, precioUnitario: 35.0, incluido: true }
        ],
        acabado: {
          tipoPintura: 'electrostatica_horno',
          colorNombre: 'Negro Estructurado Microtexturado',
          colorHex: '#0f172a',
          manosPintura: 1,
          costoPorM2: 45.0
        },
        manoDeObra: {
          diasEstimados: 3,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 60,
          costoSoldaduraHoras: 90,
          costoArmadoHoras: 100,
          costoEsmeriladoHoras: 50,
          costoPinturaHoras: 70,
          costoInstalacion: 220,
          costoTransporte: 90
        },
        fechaCreacion: '2026-09-20',
        ultimaModificacion: '2026-09-20'
      };

    case 'silla':
      return {
        id: 'silla-' + Date.now(),
        tipoElemento: 'silla',
        nombre: 'SILLA METÁLICA TUBULAR DE DISEÑO INDUSTRIAL',
        descripcion: 'Silla / Banco con estructura de 4 patas en tubo cuadrado de 1", amarres perimetrales a 90°, respaldo con travesaños y asiento con tubos ensamblados',
        anchoM: 0.50,
        altoM: 0.90,
        profundidadMarcoMm: 25,
        perfilMarcoId: 'cuad-1x1-1.2',
        perfilBastidorId: 'cuad-1x1-1.2',
        perfilRefuerzoId: 'cuad-3/4x3/4-1.2',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 0.50, apertura: 'fija' }],
        sentidoAperturaTexto: 'Mueble fijo tubular soldado con soldadura TIG/MIG',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-3/4x3/4-1.2',
          orientacion: 'horizontal',
          separacionCm: 8,
          cantidad: 3,
          separacionRealCm: 8
        },
        divisiones: [
          { id: 'div-asiento', tipo: 'horizontal', posicionM: 0.45, porcentaje: 50, perfilId: 'cuad-1x1-1.2' },
          { id: 'div-respaldo-1', tipo: 'horizontal', posicionM: 0.70, porcentaje: 77, perfilId: 'cuad-3/4x3/4-1.2' },
          { id: 'div-respaldo-2', tipo: 'horizontal', posicionM: 0.85, porcentaje: 94, perfilId: 'cuad-3/4x3/4-1.2' }
        ],
        tubosPersonalizados: [
          // Patas delanteras
          { id: 't-pata-izq', marca: 'P-01', x1: 0.05, y1: 0, x2: 0.05, y2: 0.45, perfilId: 'cuad-1x1-1.2', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 0.45, anguloDeg: 90, etiqueta: 'Pata Frontal Izquierda' },
          { id: 't-pata-der', marca: 'P-02', x1: 0.45, y1: 0, x2: 0.45, y2: 0.45, perfilId: 'cuad-1x1-1.2', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 0.45, anguloDeg: 90, etiqueta: 'Pata Frontal Derecha' },
          // Amarre inferior
          { id: 't-amarre-inf', marca: 'A-01', x1: 0.05, y1: 0.15, x2: 0.45, y2: 0.15, perfilId: 'cuad-3/4x3/4-1.2', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 0.40, anguloDeg: 0, etiqueta: 'Travesaño Amarre H' },
          // Respaldo diagonal de refuerzo
          { id: 't-resp-diag1', marca: 'D-01', x1: 0.05, y1: 0.45, x2: 0.45, y2: 0.88, perfilId: 'cuad-3/4x3/4-1.2', tipoUnionInicio: 'libre', tipoUnionFin: 'libre', longitudM: 0.58, anguloDeg: 47, etiqueta: 'Diagonal Respaldo X' },
          { id: 't-resp-diag2', marca: 'D-02', x1: 0.45, y1: 0.45, x2: 0.05, y2: 0.88, perfilId: 'cuad-3/4x3/4-1.2', tipoUnionInicio: 'libre', tipoUnionFin: 'libre', longitudM: 0.58, anguloDeg: 133, etiqueta: 'Diagonal Respaldo Y' }
        ],
        paneles: [
          {
            id: 'pan-asiento',
            nombre: 'Asiento Metálico',
            hojaIndex: 0,
            relX: 0.05,
            relY: 0.45,
            relW: 0.9,
            relH: 0.05,
            tipoRelleno: 'plancha',
            espesorMm: 1.5,
            planchaConfig: { subtipo: 'lisa', calibre: '1/16"', pesoKgM2: 12, precioM2: 70 }
          }
        ],
        accesorios: [
          { id: 'acc-s-regatones', categoria: 'accesorio', nombre: 'Regatones Plásticos de 1" para Pata', descripcion: 'Protectores de piso antirrayaduras', unidad: 'jgo', cantidad: 4, precioUnitario: 3.5, incluido: true }
        ],
        acabado: {
          tipoPintura: 'electrostatica_horno',
          colorNombre: 'Negro Forja Microtexturado',
          colorHex: '#1e293b',
          manosPintura: 1,
          costoPorM2: 40.0
        },
        manoDeObra: {
          diasEstimados: 1,
          cantOperarios: 1,
          cantAyudantes: 0,
          costoOperarioDia: 130,
          costoAyudanteDia: 0,
          costoCorteHoras: 30,
          costoSoldaduraHoras: 50,
          costoArmadoHoras: 40,
          costoEsmeriladoHoras: 30,
          costoPinturaHoras: 30,
          costoInstalacion: 0,
          costoTransporte: 25
        },
        fechaCreacion: '2026-09-22',
        ultimaModificacion: '2026-09-22'
      };

    case 'escalera':
      return {
        id: 'escalera-' + Date.now(),
        tipoElemento: 'escalera',
        nombre: 'ESCALERA METÁLICA RECTA CON PELDAÑOS Y PASAMANOS',
        descripcion: 'Escalera recta de taller con dos zancos en tubo rectangular de 4" x 2", 11 peldaños horizontales de ángulo con plancha estriada y baranda de protección',
        anchoM: 0.90,
        altoM: 2.60,
        profundidadMarcoMm: 100,
        perfilMarcoId: 'rect-4x2-2.0',
        perfilBastidorId: 'rect-3x1.5-2.0',
        perfilRefuerzoId: 'rect-2x1-1.5',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 0.90, apertura: 'fija' }],
        sentidoAperturaTexto: 'Escalera fija anclada a losa y piso con placas de 3/8"',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-1x1-1.2',
          orientacion: 'horizontal',
          separacionCm: 22,
          cantidad: 11,
          separacionRealCm: 21.6
        },
        divisiones: [
          // Peldaños principales distribuidos cada 0.22m
          { id: 'div-peld-1', tipo: 'horizontal', posicionM: 0.22, porcentaje: 8, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-2', tipo: 'horizontal', posicionM: 0.44, porcentaje: 16, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-3', tipo: 'horizontal', posicionM: 0.66, porcentaje: 25, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-4', tipo: 'horizontal', posicionM: 0.88, porcentaje: 33, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-5', tipo: 'horizontal', posicionM: 1.10, porcentaje: 42, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-6', tipo: 'horizontal', posicionM: 1.32, porcentaje: 50, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-7', tipo: 'horizontal', posicionM: 1.54, porcentaje: 59, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-8', tipo: 'horizontal', posicionM: 1.76, porcentaje: 67, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-9', tipo: 'horizontal', posicionM: 1.98, porcentaje: 76, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-10', tipo: 'horizontal', posicionM: 2.20, porcentaje: 84, perfilId: 'rect-2x1-2.0' },
          { id: 'div-peld-11', tipo: 'horizontal', posicionM: 2.42, porcentaje: 93, perfilId: 'rect-2x1-2.0' }
        ],
        tubosPersonalizados: [
          // Pasamanos diagonal superior
          { id: 't-pasamanos', marca: 'PS-01', x1: 0.05, y1: 0.90, x2: 0.85, y2: 2.60, perfilId: 'rect-2x1-1.5', tipoUnionInicio: '45_inglete', tipoUnionFin: '45_inglete', longitudM: 1.88, anguloDeg: 64, etiqueta: 'Pasamanos Inclinado' },
          // Parantes verticales de baranda
          { id: 't-parante-1', marca: 'PR-01', x1: 0.05, y1: 0.22, x2: 0.05, y2: 0.90, perfilId: 'cuad-1.5x1.5-1.5', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 0.68, anguloDeg: 90, etiqueta: 'Parante Inicio' },
          { id: 't-parante-2', marca: 'PR-02', x1: 0.45, y1: 1.32, x2: 0.45, y2: 1.75, perfilId: 'cuad-1.5x1.5-1.5', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 0.43, anguloDeg: 90, etiqueta: 'Parante Intermedio' },
          { id: 't-parante-3', marca: 'PR-03', x1: 0.85, y1: 2.42, x2: 0.85, y2: 2.60, perfilId: 'cuad-1.5x1.5-1.5', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 0.18, anguloDeg: 90, etiqueta: 'Parante Llegada' }
        ],
        paneles: [],
        accesorios: [
          { id: 'acc-e-placas', categoria: 'refuerzo', nombre: 'Placas Base de Anclaje de 6" x 6" x 3/8"', descripcion: 'Placas de apoyo con 4 perforaciones', unidad: 'jgo', cantidad: 4, precioUnitario: 35.0, incluido: true },
          { id: 'acc-e-pernos', categoria: 'accesorio', nombre: 'Pernos Expansivos Hilti 1/2" x 4"', descripcion: 'Anclaje químico/mecánico a concreto', unidad: 'und', cantidad: 8, precioUnitario: 8.5, incluido: true }
        ],
        acabado: {
          tipoPintura: 'epoxico_poliuretano',
          colorNombre: 'Gris Tráfico Industrial',
          colorHex: '#475569',
          manosPintura: 2,
          costoPorM2: 38.0
        },
        manoDeObra: {
          diasEstimados: 3,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 80,
          costoSoldaduraHoras: 150,
          costoArmadoHoras: 130,
          costoEsmeriladoHoras: 70,
          costoPinturaHoras: 90,
          costoInstalacion: 260,
          costoTransporte: 110
        },
        fechaCreacion: '2026-09-22',
        ultimaModificacion: '2026-09-22'
      };

    case 'escalera_descanso':
      return {
        id: 'esc-desc-' + Date.now(),
        tipoElemento: 'escalera_descanso',
        nombre: 'ESCALERA CON DESCANSO MULTINIVEL (2 A 3 PISOS)',
        descripcion: 'Escalera metálica de 2 o 3 tramos con meseta intermedia, columnas de apoyo en tubo 3"x3", peldaños antideslizantes y barandas continuas',
        anchoM: 2.20,
        altoM: 3.20,
        profundidadMarcoMm: 100,
        perfilMarcoId: 'rect-4x2-2.0',
        perfilBastidorId: 'cuad-3x3-2.0',
        perfilRefuerzoId: 'rect-2x1-2.0',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 2.20, apertura: 'fija' }],
        sentidoAperturaTexto: 'Escalera fija estructural de acceso a pisos superiores',
        barrotesConfig: { activo: false, perfilId: 'cuad-1x1-1.2', orientacion: 'horizontal', separacionCm: 20, cantidad: 0, separacionRealCm: 20 },
        divisiones: [],
        tubosPersonalizados: [],
        paneles: [],
        accesorios: [
          { id: 'acc-ed-placas', categoria: 'refuerzo', nombre: 'Placas Base Anclaje 6"x6"x3/8" con Pernos Hilti', descripcion: 'Fijación de columnas y zancos', unidad: 'jgo', cantidad: 6, precioUnitario: 45.0, incluido: true }
        ],
        acabado: {
          tipoPintura: 'epoxico_poliuretano',
          colorNombre: 'Gris Grafito Forja',
          colorHex: '#334155',
          manosPintura: 2,
          costoPorM2: 38.0
        },
        manoDeObra: {
          diasEstimados: 4,
          cantOperarios: 2,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 90,
          costoSoldaduraHoras: 180,
          costoArmadoHoras: 160,
          costoEsmeriladoHoras: 80,
          costoPinturaHoras: 100,
          costoInstalacion: 350,
          costoTransporte: 130
        },
        fechaCreacion: '2026-09-25',
        ultimaModificacion: '2026-09-25'
      };

    case 'escalera_caracol':
      return {
        id: 'esc-caracol-' + Date.now(),
        tipoElemento: 'escalera_caracol',
        nombre: 'ESCALERA CARACOL HELICOIDAL EN ESPIRAL',
        descripcion: 'Escalera de caracol para ahorro de espacio con mástil central redondo de 4", peldaños en abanico helicoidal, huellas estriadas y pasamanos continuo',
        anchoM: 1.70, // Diámetro total
        altoM: 2.80,
        profundidadMarcoMm: 114,
        perfilMarcoId: 'red-4-3.0',
        perfilBastidorId: 'cuad-1.5x1.5-1.5',
        perfilRefuerzoId: 'red-2-2.0',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 1.70, apertura: 'fija' }],
        sentidoAperturaTexto: 'Escalera de caracol helicoidal autoportante',
        barrotesConfig: { activo: false, perfilId: 'red-1-1.5', orientacion: 'vertical', separacionCm: 15, cantidad: 0, separacionRealCm: 15 },
        divisiones: [],
        tubosPersonalizados: [],
        paneles: [],
        accesorios: [
          { id: 'acc-ec-placa', categoria: 'refuerzo', nombre: 'Placa Base Circular de Anclaje 300mm x 3/8"', descripcion: 'Placa para mástil central', unidad: 'und', cantidad: 1, precioUnitario: 65.0, incluido: true },
          { id: 'acc-ec-pernos', categoria: 'accesorio', nombre: 'Pernos Expansivos Hilti 5/8" x 5"', descripcion: 'Anclaje de alta resistencia', unidad: 'und', cantidad: 4, precioUnitario: 12.0, incluido: true }
        ],
        acabado: {
          tipoPintura: 'electrostatica_horno',
          colorNombre: 'Negro Forja Microtexturado',
          colorHex: '#1e293b',
          manosPintura: 1,
          costoPorM2: 45.0
        },
        manoDeObra: {
          diasEstimados: 3,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 80,
          costoSoldaduraHoras: 160,
          costoArmadoHoras: 140,
          costoEsmeriladoHoras: 70,
          costoPinturaHoras: 90,
          costoInstalacion: 280,
          costoTransporte: 100
        },
        fechaCreacion: '2026-09-25',
        ultimaModificacion: '2026-09-25'
      };

    case 'mesa':
      return {
        id: 'mesa-' + Date.now(),
        tipoElemento: 'mesa',
        nombre: 'MESA INDUSTRIAL DE TRABAJO PESADA',
        descripcion: 'Mesa estructural con bastidor en tubo cuadrado de 2" x 2", 4 patas reforzadas, travesaños perimetrales inferiores y cubierta de plancha de acero',
        anchoM: 1.80,
        altoM: 0.85,
        profundidadMarcoMm: 50,
        perfilMarcoId: 'cuad-2x2-2.0',
        perfilBastidorId: 'cuad-2x2-2.0',
        perfilRefuerzoId: 'rect-2x1-1.5',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 1.80, apertura: 'fija' }],
        sentidoAperturaTexto: 'Mesa fija autoportante de alta rigidez para taller',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-1x1-1.2',
          orientacion: 'horizontal',
          separacionCm: 20,
          cantidad: 0,
          separacionRealCm: 20
        },
        divisiones: [
          { id: 'div-mesa-inf', tipo: 'horizontal', posicionM: 0.20, porcentaje: 23, perfilId: 'rect-2x1-1.5' }
        ],
        tubosPersonalizados: [
          // Patas
          { id: 't-m-p1', marca: 'PT-01', x1: 0.08, y1: 0, x2: 0.08, y2: 0.85, perfilId: 'cuad-2x2-2.0', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 0.85, anguloDeg: 90, etiqueta: 'Pata Izquierda' },
          { id: 't-m-p2', marca: 'PT-02', x1: 1.72, y1: 0, x2: 1.72, y2: 0.85, perfilId: 'cuad-2x2-2.0', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 0.85, anguloDeg: 90, etiqueta: 'Pata Derecha' },
          // Travesaño superior
          { id: 't-m-sup', marca: 'TR-01', x1: 0.08, y1: 0.85, x2: 1.72, y2: 0.85, perfilId: 'cuad-2x2-2.0', tipoUnionInicio: '45_inglete', tipoUnionFin: '45_inglete', longitudM: 1.64, anguloDeg: 0, etiqueta: 'Travesaño Superior' },
          // Amarre inferior
          { id: 't-m-inf', marca: 'TR-02', x1: 0.08, y1: 0.20, x2: 1.72, y2: 0.20, perfilId: 'rect-2x1-1.5', tipoUnionInicio: '90_tope', tipoUnionFin: '90_tope', longitudM: 1.64, anguloDeg: 0, etiqueta: 'Amarre Inferior H' }
        ],
        paneles: [
          {
            id: 'pan-mesa-top',
            nombre: 'Tablero Superior Acero LAC',
            hojaIndex: 0,
            relX: 0,
            relY: 0.83,
            relW: 1,
            relH: 0.04,
            tipoRelleno: 'plancha',
            espesorMm: 3.0,
            planchaConfig: { subtipo: 'lisa', calibre: '1/8" (3mm)', pesoKgM2: 24.0, precioM2: 160.0 }
          }
        ],
        accesorios: [
          { id: 'acc-m-niveladores', categoria: 'accesorio', nombre: 'Pernos Niveladores Heavy Duty M16 con Base Goma', descripcion: 'Ajuste de nivelación en suelo irregular', unidad: 'jgo', cantidad: 4, precioUnitario: 14.0, incluido: true }
        ],
        acabado: {
          tipoPintura: 'epoxico_poliuretano',
          colorNombre: 'Azul Maquinaria Industrial',
          colorHex: '#1e3a8a',
          manosPintura: 2,
          costoPorM2: 35.0
        },
        manoDeObra: {
          diasEstimados: 2,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 40,
          costoSoldaduraHoras: 80,
          costoArmadoHoras: 70,
          costoEsmeriladoHoras: 40,
          costoPinturaHoras: 50,
          costoInstalacion: 0,
          costoTransporte: 60
        },
        fechaCreacion: '2026-09-22',
        ultimaModificacion: '2026-09-22'
      };

    case 'personalizado':
      return {
        id: 'personalizado-' + Date.now(),
        tipoElemento: 'personalizado',
        nombre: 'DISEÑO LIBRE DESDE CERO (ROMPECABEZAS METÁLICO)',
        descripcion: 'Lienzo en blanco para ensamblar tubos, empalmes verticales, horizontales y diagonales, arcos y cerrajería libremente',
        anchoM: 2.00,
        altoM: 2.00,
        profundidadMarcoMm: 50,
        perfilMarcoId: 'cuad-2x2-2.0',
        perfilBastidorId: 'rect-2x1-1.5',
        perfilRefuerzoId: 'cuad-1x1-1.2',
        numHojas: 1,
        hojas: [{ id: 'h1', numero: 1, anchoM: 2.00, apertura: 'fija' }],
        sentidoAperturaTexto: 'Diseño Libre Personalizado por Piezas',
        barrotesConfig: {
          activo: false,
          perfilId: 'cuad-1x1-1.2',
          orientacion: 'vertical',
          separacionCm: 15,
          cantidad: 0,
          separacionRealCm: 15
        },
        divisiones: [],
        tubosPersonalizados: [
          // Tubos de ejemplo inicial ensamblados como rompecabezas
          { id: 't-ini-1', marca: 'T-01', x1: 0.10, y1: 0.10, x2: 1.90, y2: 0.10, perfilId: 'rect-2x1-1.5', tipoUnionInicio: '45_inglete', tipoUnionFin: '45_inglete', longitudM: 1.80, anguloDeg: 0, etiqueta: 'Tubo Base Horizontal' },
          { id: 't-ini-2', marca: 'T-02', x1: 0.10, y1: 0.10, x2: 0.10, y2: 1.90, perfilId: 'rect-2x1-1.5', tipoUnionInicio: '45_inglete', tipoUnionFin: '45_inglete', longitudM: 1.80, anguloDeg: 90, etiqueta: 'Montante Izquierdo' },
          { id: 't-ini-3', marca: 'T-03', x1: 1.90, y1: 0.10, x2: 1.90, y2: 1.90, perfilId: 'rect-2x1-1.5', tipoUnionInicio: '45_inglete', tipoUnionFin: '45_inglete', longitudM: 1.80, anguloDeg: 90, etiqueta: 'Montante Derecho' },
          { id: 't-ini-4', marca: 'T-04', x1: 0.10, y1: 1.90, x2: 1.90, y2: 1.90, perfilId: 'rect-2x1-1.5', tipoUnionInicio: '45_inglete', tipoUnionFin: '45_inglete', longitudM: 1.80, anguloDeg: 0, etiqueta: 'Cabezal Superior' },
          { id: 't-ini-5', marca: 'T-05', x1: 0.10, y1: 0.10, x2: 1.90, y2: 1.90, perfilId: 'cuad-1x1-1.2', tipoUnionInicio: 'libre', tipoUnionFin: 'libre', longitudM: 2.55, anguloDeg: 45, etiqueta: 'Diagonal Cruzada Rompecabezas' }
        ],
        arco: {
          activo: false,
          tipo: 'medio_punto',
          flechaM: 0.40,
          perfilArcoId: 'cuad-1.5x1.5-1.5',
          conBarrotesRadiales: true,
          cantidadBarrotesArco: 6
        },
        chapaConfig: {
          activa: false,
          modelo: 'Forte 3 Golpes',
          tipo: 'sobreponer',
          posicionYM: 1.00,
          lado: 'derecha',
          conManija: true
        },
        bisagrasConfig: {
          cantidad: 3,
          tipo: 'tubular_con_pin',
          medidaPulgadas: '3"',
          lado: 'izquierda',
          distribucion: 'automatica'
        },
        cerrojosList: [],
        paneles: [],
        accesorios: [],
        acabado: {
          tipoPintura: 'esmalte_sintetico',
          colorNombre: 'Negro Grafito',
          colorHex: '#1e293b',
          manosPintura: 2,
          costoPorM2: 28.0
        },
        manoDeObra: {
          diasEstimados: 2,
          cantOperarios: 1,
          cantAyudantes: 1,
          costoOperarioDia: 130,
          costoAyudanteDia: 90,
          costoCorteHoras: 50,
          costoSoldaduraHoras: 90,
          costoArmadoHoras: 80,
          costoEsmeriladoHoras: 40,
          costoPinturaHoras: 60,
          costoInstalacion: 160,
          costoTransporte: 70
        },
        fechaCreacion: '2026-09-22',
        ultimaModificacion: '2026-09-22'
      };

    default:
      return { ...PORTON_METALLICO_DEMO, id: 'herreria-' + Date.now() };
  }
}

export const DISENOS_PREDETERMINADOS: HerreriaDesign[] = [
  crearDisenoPorElemento('puerta'),
  crearDisenoPorElemento('ventana'),
  crearDisenoPorElemento('silla'),
  crearDisenoPorElemento('escalera'),
  crearDisenoPorElemento('escalera_descanso'),
  crearDisenoPorElemento('escalera_caracol'),
  crearDisenoPorElemento('porton'),
  crearDisenoPorElemento('mesa'),
  crearDisenoPorElemento('reja'),
  crearDisenoPorElemento('reja_abanico'),
  crearDisenoPorElemento('baranda'),
  crearDisenoPorElemento('personalizado')
];

// ========================================================
// LIENZO 100% VACÍO PARA CENTRO CAD PARAMÉTRICO
// ========================================================
export function crearDisenoVacio(nombre: string = 'Nuevo Diseño Paramétrico'): HerreriaDesign {
  return {
    id: 'herreria-' + Date.now(),
    tipoElemento: 'personalizado',
    isLienzoBlanco: true,
    nombre,
    descripcion: 'Diseño CAD de herrería iniciado en blanco desde cero',
    piezas: [],
    accesoriosCad: [],
    cotasCad: [],
    anchoM: 2.00,
    altoM: 2.20,
    profundidadMarcoMm: 50,
    perfilMarcoId: 'rect-2x1-1.5',
    perfilBastidorId: 'rect-2x1-1.5',
    perfilRefuerzoId: 'cuad-1x1-1.2',
    numHojas: 1,
    hojas: [],
    barrotesConfig: {
      activo: false,
      perfilId: 'cuad-1x1-1.2',
      orientacion: 'vertical',
      separacionCm: 12,
      cantidad: 0,
      separacionRealCm: 12
    },
    divisiones: [],
    tubosPersonalizados: [],
    paneles: [],
    accesorios: [],
    acabado: {
      tipoPintura: 'esmalte_sintetico',
      colorNombre: 'Negro Grafito',
      colorHex: '#1e293b',
      manosPintura: 2,
      costoPorM2: 28.0
    },
    manoDeObra: {
      diasEstimados: 1,
      cantOperarios: 1,
      cantAyudantes: 1,
      costoOperarioDia: 130,
      costoAyudanteDia: 90,
      costoCorteHoras: 40,
      costoSoldaduraHoras: 60,
      costoArmadoHoras: 50,
      costoEsmeriladoHoras: 30,
      costoPinturaHoras: 40,
      costoInstalacion: 120,
      costoTransporte: 50
    },
    fechaCreacion: new Date().toISOString().split('T')[0],
    ultimaModificacion: new Date().toISOString().split('T')[0]
  };
}

// Clasificación de perfiles de herrería por Norma / Acabado Industrial (LAC, Galvanizados, LAF/LAB, ASTM)
export function getNormaAcabadoPerfil(p: PerfilCatalogo): 'LAC' | 'LAF' | 'GALVANIZADO' | 'ASTM' {
  if (p.normaAcabado) return p.normaAcabado;
  const n = (p.nombre + ' ' + p.id + ' ' + (p.descripcion || '')).toLowerCase();
  if (n.includes('galv') || n.includes('zinc')) return 'GALVANIZADO';
  if (n.includes('laf') || n.includes('lab') || (p.espesorMm <= 1.2 && !n.includes('pesad') && p.categoria.includes('tubo'))) return 'LAF';
  if (p.categoria === 'platina' || p.categoria === 'angulo' || p.categoria === 'canal_u' || p.categoria === 'perfil_t' || p.categoria === 'perfil_c' || p.categoria === 'perfil_z') return 'ASTM';
  return 'LAC';
}

export const PERFILES_HERRERIA_AGRUPADOS = [
  {
    norma: 'LAC' as const,
    label: '📦 PERFILES LAC (ASTM A500 Negro Estructural)',
    items: PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'LAC')
  },
  {
    norma: 'GALVANIZADO' as const,
    label: '🛡️ PERFILES GALVANIZADOS (ASTM A500 Galv)',
    items: PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'GALVANIZADO')
  },
  {
    norma: 'LAF' as const,
    label: '❄️ PERFILES LAF / LAB (Laminado en Frío / Cerrajería Ligera)',
    items: PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'LAF')
  },
  {
    norma: 'ASTM' as const,
    label: '📐 PERFILES ESTRUCTURALES ASTM (A36 / Vigas / Ángulos / Platinas)',
    items: PERFILES_CATALOGO.filter(p => getNormaAcabadoPerfil(p) === 'ASTM')
  }
];

