// Tipos y Estructuras de Datos Exclusivos para Techos Metálicos y Coberturas Industriales/Residenciales

export type TipoTecho = 
  | 'techo_dos_aguas'
  | 'techo_una_agua'
  | 'techo_parabolico'
  | 'techo_policarbonato'
  | 'techo_dientes_sierra'
  | 'techo_cuatro_aguas'
  | 'techo_seis_aguas'
  | 'techo_mansarda'
  | 'techo_cupula_domo'
  | 'techo_espacial'
  | 'techo_mezzanine'
  | 'techo_forma_l'
  | 'techo_forma_u'
  | 'techo_forma_c'
  | 'techo_mariposa'
  | 'techo_curvo_autoportante'
  | 'techo_monitor'
  | 'techo_saltbox'
  | 'techo_holandes'
  | 'techo_piramidal';

export type TipoTijeral = 
  | 'howe'
  | 'pratt'
  | 'fink'
  | 'warren'
  | 'parabolico_curvo'
  | 'viga_celosia'
  | 'viga_ipe'
  | 'escalera_vierendeel';

export type TipoPerfilCorrea = 
  | 'perfil_c'
  | 'perfil_z'
  | 'tubo_rectangular'
  | 'tubo_cuadrado'
  | 'angulo_doble';

export type TipoCobertura = 
  | 'aluzinc_tr4'
  | 'aluzinc_tr5'
  | 'policarbonato_alveolar'
  | 'upvc_termoacustica'
  | 'panel_sandwich_pur'
  | 'teja_andina';

export type ColorCobertura = 
  | 'aluzinc_natural'
  | 'rojo_teja'
  | 'azul_real'
  | 'gris_grafito'
  | 'verde_pino'
  | 'traslucido'
  | 'opal_blanco';

export type ZonaTranslúcida = 
  | 'ninguna'
  | 'franja_central'
  | 'laterales'
  | 'alternados'
  | 'total';

export interface TechoEstructuraDesign {
  id: string;
  nombre: string;
  descripcion: string;
  tipoTecho: TipoTecho;
  tipoTijeral: TipoTijeral;
  zonaTranslúcida?: ZonaTranslúcida;
  orientacionTijeral?: 'vertical' | 'horizontal' | 'ambos' | 'transversal' | 'longitudinal' | 'perimetral' | 'completo';

  // 1. DIMENSIONES GENERALES DE LA NAVE / ESTRUCTURA
  luzM: number;               // Ancho libre L (m)
  largoM: number;            // Largo total de la nave/estructura (m)
  alturaColumnasM: number;   // Altura libre de columnas H (m)
  pendientePorcentaje: number;// Pendiente S (%) e.g. 15%, 20%
  flechaArcoM?: number;      // Flecha f (m) si es parabólico
  voladoFrontalM: number;    // Volado / Alero frontal (m)
  voladoLateralM: number;    // Volado / Alero lateral (m)

  // 2. MODULACIÓN DE TIJERALES Y COLUMNAS
  distanciaTijeralesM: number; // Espaciamiento entre tijerales e.g. 4.0m o 5.0m
  numTijerales: number;        // Calculado: Math.ceil(largoM / distanciaTijeralesM) + 1
  perfilColumnas: string;      // e.g. 'cuad-4x4-3.0' o 'perfil-h-6x6'
  placaBaseMm: {
    espesorMm: number;        // e.g. 10mm
    anchoMm: number;          // e.g. 250mm
    largoMm: number;          // e.g. 250mm
    pernosAnclaje: string;    // e.g. '4 Pernos J 5/8" x 40cm A307'
  };

  // 3. TIJERALES / CERCHAS
  perfilCordonSuperior: string;  // e.g. 'perfil-c-4x2-2.0' o 'tubo-2x2-2.0'
  perfilCordonInferior: string;  // e.g. 'rect-2x2-2.0'
  perfilDiagonales: string;      // e.g. 'ang-1.5x1.5x3/16'
  alturaTijeralCentroM: number;  // Calculado o manual h (m)

  // 4. CORREAS Y ARRIOSTRANMIENTOS
  tipoPerfilCorrea: TipoPerfilCorrea;
  perfilCorreas: string;         // e.g. 'perfil-c-4x2-2.0'
  distanciaCorreasM: number;     // Espaciamiento entre correas e.g. 0.90m - 1.20m
  numFilasCorreas: number;       // Calculado por caída
  tensoresVientoCable: {
    activo: boolean;
    diametroPulgadas: string;   // e.g. '1/2"'
    incluyeTempladores: boolean;
  };

  // 5. COBERTURA Y FIJACIONES
  tipoCobertura: TipoCobertura;
  espesorCoberturaMm: number;   // e.g. 0.40, 0.50, 6.0
  colorCobertura: ColorCobertura;
  traslapeLongitudinalMm: number;// e.g. 200mm
  fijaciones: {
    tipoPerno: string;          // e.g. 'Autoperforante 12-14 x 2" Hex con Arandela EPDM'
    pernosPorM2: number;        // e.g. 4.5
    mostrarPernosEnCad: boolean;// Visualización activa por defecto
  };

  // 6. ACCESORIOS Y HOJALATERÍA
  cumbrera: {
    activo: boolean;
    tipo: 'troquelada_tr4' | 'lisa_aluzinc' | 'policarbonato';
    desarrolloMm: number;       // e.g. 400mm
  };
  canaletas: {
    activo: boolean;
    desarrolloMm: number;       // e.g. 400mm (6")
    material: string;           // Galvanizada 0.50mm / Aluzinc
    bajantesPvc4Pulg: number;   // Cantidad de bajantes pluviales
  };

  // 7. COSTOS Y TIMING
  costoM2Materiales: number;
  costoM2ManoObra: number;
  costoM2EquiposGrua: number;
  diasEjecucion: number;
  cuadrillaMontaje: {
    operarios: number;
    ayudantes: number;
  };

  fechaCreacion: string;
  ultimaModificacion: string;
}
