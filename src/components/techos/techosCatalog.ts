// Catálogo de Presets de Techos Metálicos y Coberturas Industriales/Residenciales
import { TechoEstructuraDesign } from './techosTypes';

export const TECHO_DOS_AGUAS_DEFAULT: TechoEstructuraDesign = {
  id: 'tech-dos-aguas-12x20',
  nombre: 'NAVE INDUSTRIAL A DOS AGUAS 12.00m x 20.00m',
  descripcion: 'Estructura metálica a dos aguas con tijerales tipo Howe, columnas tubulares 4"x4", correas C 4"x2" y cobertura Aluzinc TR-4 Prepintado Azul',
  tipoTecho: 'techo_dos_aguas',
  tipoTijeral: 'howe',

  // 1. Dimensiones Nave
  luzM: 12.00,
  largoM: 20.00,
  alturaColumnasM: 4.50,
  pendientePorcentaje: 20, // 20% de pendiente
  voladoFrontalM: 0.80,
  voladoLateralM: 0.50,

  // 2. Modulación
  distanciaTijeralesM: 5.00,
  numTijerales: 5, // (20 / 5) + 1 = 5 tijerales
  perfilColumnas: 'Tubo Cuadrado 4" x 4" x 3.0mm',
  placaBaseMm: {
    espesorMm: 10,
    anchoMm: 250,
    largoMm: 250,
    pernosAnclaje: '4 Pernos de Anclaje J 5/8" x 40cm A307 con Tuerca Doble'
  },

  // 3. Tijerales
  perfilCordonSuperior: 'Perfil C 4" x 2" x 2.0mm',
  perfilCordonInferior: 'Tubo Rectangular 2" x 2" x 2.0mm',
  perfilDiagonales: 'Ángulo Estructural 1.5" x 1.5" x 3/16"',
  alturaTijeralCentroM: 1.20,

  // 4. Correas y Arriostramientos
  tipoPerfilCorrea: 'perfil_c',
  perfilCorreas: 'Perfil C 4" x 2" x 2.0mm',
  distanciaCorreasM: 1.00,
  numFilasCorreas: 7, // Por cada caída de 6.36m
  tensoresVientoCable: {
    activo: true,
    diametroPulgadas: '1/2"',
    incluyeTempladores: true
  },

  // 5. Cobertura
  tipoCobertura: 'aluzinc_tr4',
  espesorCoberturaMm: 0.40,
  colorCobertura: 'azul_real',
  traslapeLongitudinalMm: 200,
  fijaciones: {
    tipoPerno: 'Perno Autoperforante 12-14 x 2" Hex con Arandela EPDM y Neopreno Vulcanizado',
    pernosPorM2: 4.5,
    mostrarPernosEnCad: true
  },

  // 6. Accesorios
  cumbrera: {
    activo: true,
    tipo: 'troquelada_tr4',
    desarrolloMm: 400
  },
  canaletas: {
    activo: true,
    desarrolloMm: 400,
    material: 'Plancha Galvanizada e=0.50mm Desarrollo 400mm',
    bajantesPvc4Pulg: 4
  },

  // 7. Costos
  costoM2Materiales: 85.00,
  costoM2ManoObra: 35.00,
  costoM2EquiposGrua: 12.00,
  diasEjecucion: 5,
  cuadrillaMontaje: {
    operarios: 3,
    ayudantes: 2
  },

  fechaCreacion: '2026-09-22',
  ultimaModificacion: '2026-09-22'
};

export const TECHO_UNA_AGUA_DEFAULT: TechoEstructuraDesign = {
  id: 'tech-una-agua-8x15',
  nombre: 'TECHO INCLINADO A UNA AGUA 8.00m x 15.00m',
  descripcion: 'Estructura ligera de una sola caída para almacenes y cobertizos con correas C y Aluzinc TR-4',
  tipoTecho: 'techo_una_agua',
  tipoTijeral: 'viga_celosia',

  luzM: 8.00,
  largoM: 15.00,
  alturaColumnasM: 3.80,
  pendientePorcentaje: 15,
  voladoFrontalM: 0.60,
  voladoLateralM: 0.40,

  distanciaTijeralesM: 5.00,
  numTijerales: 4,
  perfilColumnas: 'Tubo Cuadrado 3" x 3" x 2.5mm',
  placaBaseMm: {
    espesorMm: 8,
    anchoMm: 200,
    largoMm: 200,
    pernosAnclaje: '4 Pernos de Anclaje J 1/2" x 35cm'
  },

  perfilCordonSuperior: 'Perfil C 4" x 2" x 2.0mm',
  perfilCordonInferior: 'Perfil C 4" x 2" x 2.0mm',
  perfilDiagonales: 'Ángulo Estructural 1.25" x 1.25" x 1/8"',
  alturaTijeralCentroM: 0.60,

  tipoPerfilCorrea: 'perfil_c',
  perfilCorreas: 'Perfil C 4" x 2" x 2.0mm',
  distanciaCorreasM: 1.00,
  numFilasCorreas: 9,
  tensoresVientoCable: {
    activo: true,
    diametroPulgadas: '3/8"',
    incluyeTempladores: true
  },

  tipoCobertura: 'aluzinc_tr4',
  espesorCoberturaMm: 0.40,
  colorCobertura: 'rojo_teja',
  traslapeLongitudinalMm: 150,
  fijaciones: {
    tipoPerno: 'Perno Autoperforante 12-14 x 2" Hex con Arandela EPDM',
    pernosPorM2: 4.5,
    mostrarPernosEnCad: true
  },

  cumbrera: {
    activo: false,
    tipo: 'lisa_aluzinc',
    desarrolloMm: 300
  },
  canaletas: {
    activo: true,
    desarrolloMm: 400,
    material: 'Plancha Galvanizada e=0.50mm',
    bajantesPvc4Pulg: 2
  },

  costoM2Materiales: 72.00,
  costoM2ManoObra: 30.00,
  costoM2EquiposGrua: 8.00,
  diasEjecucion: 3,
  cuadrillaMontaje: {
    operarios: 2,
    ayudantes: 2
  },

  fechaCreacion: '2026-09-22',
  ultimaModificacion: '2026-09-22'
};

export const TECHO_PARABOLICO_DEFAULT: TechoEstructuraDesign = {
  id: 'tech-parabolico-15x30',
  nombre: 'TECHO PARABÓLICO CURVO DE LUZ LIBRE 15.00m x 30.00m',
  descripcion: 'Cobertura curva tipo coliseo/depósito con arcos reticulados tubulares, flecha de 3.20m y cobertura Aluzinc curvo',
  tipoTecho: 'techo_parabolico',
  tipoTijeral: 'parabolico_curvo',

  luzM: 15.00,
  largoM: 30.00,
  alturaColumnasM: 5.50,
  pendientePorcentaje: 0,
  flechaArcoM: 3.20,
  voladoFrontalM: 1.00,
  voladoLateralM: 0.60,

  distanciaTijeralesM: 5.00,
  numTijerales: 7,
  perfilColumnas: 'Tubo Cuadrado 6" x 6" x 4.0mm',
  placaBaseMm: {
    espesorMm: 12,
    anchoMm: 300,
    largoMm: 300,
    pernosAnclaje: '4 Pernos de Anclaje J 3/4" x 50cm A325'
  },

  perfilCordonSuperior: 'Tubo Redondo 2" x 2.0mm',
  perfilCordonInferior: 'Tubo Redondo 2" x 2.0mm',
  perfilDiagonales: 'Tubo Redondo 1" x 1.5mm',
  alturaTijeralCentroM: 0.80,

  tipoPerfilCorrea: 'tubo_rectangular',
  perfilCorreas: 'Tubo Rectangular 2" x 1.5" x 2.0mm',
  distanciaCorreasM: 0.90,
  numFilasCorreas: 18,
  tensoresVientoCable: {
    activo: true,
    diametroPulgadas: '1/2"',
    incluyeTempladores: true
  },

  tipoCobertura: 'aluzinc_tr4',
  espesorCoberturaMm: 0.50,
  colorCobertura: 'gris_grafito',
  traslapeLongitudinalMm: 200,
  fijaciones: {
    tipoPerno: 'Perno Autoperforante 12-14 x 2" Hex con EPDM Vulcanizado',
    pernosPorM2: 5.0,
    mostrarPernosEnCad: true
  },

  cumbrera: {
    activo: false,
    tipo: 'troquelada_tr4',
    desarrolloMm: 400
  },
  canaletas: {
    activo: true,
    desarrolloMm: 500,
    material: 'Plancha Galvanizada e=0.60mm Desarrollo 500mm',
    bajantesPvc4Pulg: 6
  },

  costoM2Materiales: 98.00,
  costoM2ManoObra: 42.00,
  costoM2EquiposGrua: 18.00,
  diasEjecucion: 7,
  cuadrillaMontaje: {
    operarios: 4,
    ayudantes: 3
  },

  fechaCreacion: '2026-09-22',
  ultimaModificacion: '2026-09-22'
};

export const TECHO_POLICARBONATO_DEFAULT: TechoEstructuraDesign = {
  id: 'tech-policarbonato-6x8',
  nombre: 'TECHO RESIDENCIAL POLICARBONATO ALVEOLAR 6.00m x 8.00m',
  descripcion: 'Estructura elegante estilo Sol y Sombra con vigas tubulares 3"x2", correas 2"x1" y planchas de Policarbonato Alveolar 6mm Traslúcido con perfiles H de aluminio',
  tipoTecho: 'techo_policarbonato',
  tipoTijeral: 'viga_celosia',

  luzM: 6.00,
  largoM: 8.00,
  alturaColumnasM: 2.80,
  pendientePorcentaje: 10,
  voladoFrontalM: 0.40,
  voladoLateralM: 0.30,

  distanciaTijeralesM: 2.00,
  numTijerales: 5,
  perfilColumnas: 'Tubo Cuadrado 3" x 3" x 2.0mm',
  placaBaseMm: {
    espesorMm: 6,
    anchoMm: 150,
    largoMm: 150,
    pernosAnclaje: '4 Pernos de Expansión 3/8" x 3"'
  },

  perfilCordonSuperior: 'Tubo Rectangular 3" x 2" x 2.0mm',
  perfilCordonInferior: 'Tubo Rectangular 3" x 2" x 2.0mm',
  perfilDiagonales: 'Tubo Cuadrado 1" x 1" x 1.5mm',
  alturaTijeralCentroM: 0.25,

  tipoPerfilCorrea: 'tubo_rectangular',
  perfilCorreas: 'Tubo Rectangular 2" x 1" x 1.5mm',
  distanciaCorreasM: 0.70,
  numFilasCorreas: 9,
  tensoresVientoCable: {
    activo: false,
    diametroPulgadas: '3/8"',
    incluyeTempladores: false
  },

  tipoCobertura: 'policarbonato_alveolar',
  espesorCoberturaMm: 6.0,
  colorCobertura: 'traslucido',
  traslapeLongitudinalMm: 100,
  fijaciones: {
    tipoPerno: 'Tornillo Autoperforante de Aluminio con Arandela Neopreno y Perfil H',
    pernosPorM2: 4.0,
    mostrarPernosEnCad: true
  },

  cumbrera: {
    activo: false,
    tipo: 'policarbonato',
    desarrolloMm: 300
  },
  canaletas: {
    activo: true,
    desarrolloMm: 300,
    material: 'Perfil U Cierre Aluminio / Canaleta Alum.',
    bajantesPvc4Pulg: 2
  },

  costoM2Materiales: 110.00,
  costoM2ManoObra: 38.00,
  costoM2EquiposGrua: 0.00,
  diasEjecucion: 2,
  cuadrillaMontaje: {
    operarios: 2,
    ayudantes: 1
  },

  fechaCreacion: '2026-09-22',
  ultimaModificacion: '2026-09-22'
};

export const PRESETS_TECHOS_EXCLUSIVOS: TechoEstructuraDesign[] = [
  TECHO_DOS_AGUAS_DEFAULT,
  TECHO_UNA_AGUA_DEFAULT,
  TECHO_PARABOLICO_DEFAULT,
  TECHO_POLICARBONATO_DEFAULT
];
