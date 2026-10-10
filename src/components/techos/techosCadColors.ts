// Paleta Estándar de Colores, Metadatos y Tipologías de Elementos y Tijerales CAD
// Permite identificar visualmente cada herramienta y rol estructural con un código cromático único
import { RolEstructuralSegmento, ToolModoCad } from './techosCadEngineTypes';

export type TipoTijeral = 
  | 'escalera_vierendeel' // Viga celosía tipo escalera con montantes rectos a 90° sin diagonales (Vierendeel)
  | 'warren'              // Triangulación continua en V/W (sin montantes obligatorios)
  | 'pratt'               // Diagonales hacia el centro (tracción) + montantes verticales
  | 'howe'                // Diagonales hacia los apoyos (compresión) + montantes verticales
  | 'fink'                // Celosía en W simétrica clásica para techos a dos aguas
  | 'parabolico_warren'   // Arco curvo superior con cordón inferior concéntrico y celosía Warren
  | 'parabolico_pratt'    // Arco curvo superior con montantes radiales y diagonales Pratt
  | 'parabolico_bowstring'// Arco parabólico con tirante horizontal inferior recto (Bowstring)
  | 'parabolico_curvo'    // Arco curvo continuo autoportante
  | 'viga_celosia'        // Viga reticulada en celosía
  | 'viga_ipe'            // Perfil IPE / W estructural
  | 'plano_viga'          // Viga reticulada plana de alma abierta (joist)
  | 'simple_arco';        // Arco monolítico de un solo tubo rolado

export interface EstructuralRoleInfo {
  rol: RolEstructuralSegmento;
  nombre: string;
  nombreCorto: string;
  colorHex: string;
  colorClaseTailwind: string;
  colorBgTailwind: string;
  colorBorderTailwind: string;
  colorTextTailwind: string;
  colorThreeJs: number;
  descripcion: string;
}

export interface TijeralInfo {
  id: TipoTijeral;
  nombre: string;
  categoria: 'curvo' | 'plano' | 'dos_aguas';
  descripcionCorta: string;
  comportamiento: string;
  colorHex: string;
  ventajas: string;
}

// 1. DICCIONARIO DE COLORES Y METADATOS POR ROL ESTRUCTURAL
export const ROLES_ESTRUCTURALES_INFO: Record<RolEstructuralSegmento, EstructuralRoleInfo> = {
  columna: {
    rol: 'columna',
    nombre: 'Columna Estructural',
    nombreCorto: 'Columna',
    colorHex: '#2563eb', // Azul Real
    colorClaseTailwind: 'bg-blue-600',
    colorBgTailwind: 'bg-blue-50',
    colorBorderTailwind: 'border-blue-300',
    colorTextTailwind: 'text-blue-700',
    colorThreeJs: 0x2563eb,
    descripcion: 'Elementos verticales portantes que transmiten las cargas al suelo'
  },
  cordon_superior: {
    rol: 'cordon_superior',
    nombre: 'Cordón Superior (Arco / Caída)',
    nombreCorto: 'Cordón Sup.',
    colorHex: '#f59e0b', // Ámbar / Naranja Brillante
    colorClaseTailwind: 'bg-amber-500',
    colorBgTailwind: 'bg-amber-50',
    colorBorderTailwind: 'border-amber-300',
    colorTextTailwind: 'text-amber-800',
    colorThreeJs: 0xf59e0b,
    descripcion: 'Perfil superior sobre el que descansan las correas y coberturas'
  },
  cordon_inferior: {
    rol: 'cordon_inferior',
    nombre: 'Cordón Inferior / Tirante',
    nombreCorto: 'Cordón Inf.',
    colorHex: '#10b981', // Verde Esmeralda
    colorClaseTailwind: 'bg-emerald-500',
    colorBgTailwind: 'bg-emerald-50',
    colorBorderTailwind: 'border-emerald-300',
    colorTextTailwind: 'text-emerald-800',
    colorThreeJs: 0x10b981,
    descripcion: 'Tirante horizontal o curvo inferior que resiste la tracción'
  },
  montante: {
    rol: 'montante',
    nombre: 'Montante Vertical',
    nombreCorto: 'Montante',
    colorHex: '#8b5cf6', // Púrpura / Violeta
    colorClaseTailwind: 'bg-purple-500',
    colorBgTailwind: 'bg-purple-50',
    colorBorderTailwind: 'border-purple-300',
    colorTextTailwind: 'text-purple-800',
    colorThreeJs: 0x8b5cf6,
    descripcion: 'Barras perpendiculares que unen el cordón superior con el inferior'
  },
  diagonal: {
    rol: 'diagonal',
    nombre: 'Diagonal de Celosía',
    nombreCorto: 'Diagonal',
    colorHex: '#06b6d4', // Cian / Turquesa
    colorClaseTailwind: 'bg-cyan-500',
    colorBgTailwind: 'bg-cyan-50',
    colorBorderTailwind: 'border-cyan-300',
    colorTextTailwind: 'text-cyan-800',
    colorThreeJs: 0x06b6d4,
    descripcion: 'Barras inclinadas que forman la triangulación Warren, Pratt o Howe'
  },
  viga_principal: {
    rol: 'viga_principal',
    nombre: 'Viga Principal Portante',
    nombreCorto: 'Viga Pral.',
    colorHex: '#ef4444', // Rojo Carmesí
    colorClaseTailwind: 'bg-rose-500',
    colorBgTailwind: 'bg-rose-50',
    colorBorderTailwind: 'border-rose-300',
    colorTextTailwind: 'text-rose-800',
    colorThreeJs: 0xef4444,
    descripcion: 'Vigas maestras de apoyo entre columnas'
  },
  viga_secundaria: {
    rol: 'viga_secundaria',
    nombre: 'Viga Secundaria / Vigueta',
    nombreCorto: 'Vigueta',
    colorHex: '#6366f1', // Índigo
    colorClaseTailwind: 'bg-indigo-500',
    colorBgTailwind: 'bg-indigo-50',
    colorBorderTailwind: 'border-indigo-300',
    colorTextTailwind: 'text-indigo-800',
    colorThreeJs: 0x6366f1,
    descripcion: 'Viguetas intermedias de distribución de carga'
  },
  correa: {
    rol: 'correa',
    nombre: 'Correa Longitudinal (Z/C)',
    nombreCorto: 'Correa',
    colorHex: '#84cc16', // Verde Lima
    colorClaseTailwind: 'bg-lime-500',
    colorBgTailwind: 'bg-lime-50',
    colorBorderTailwind: 'border-lime-300',
    colorTextTailwind: 'text-lime-800',
    colorThreeJs: 0x84cc16,
    descripcion: 'Perfiles longitudinales espaciados cada 0.90m - 1.20m para fijar calamina/aluzinc'
  },
  arriostre: {
    rol: 'arriostre',
    nombre: 'Arriostre / Cruz San Andrés',
    nombreCorto: 'Arriostre',
    colorHex: '#ec4899', // Rosa / Fucsia
    colorClaseTailwind: 'bg-pink-500',
    colorBgTailwind: 'bg-pink-50',
    colorBorderTailwind: 'border-pink-300',
    colorTextTailwind: 'text-pink-800',
    colorThreeJs: 0xec4899,
    descripcion: 'Tirantes en cruz para estabilidad contra vientos y sismos'
  },
  tensor_viento: {
    rol: 'tensor_viento',
    nombre: 'Tensor de Viento / Templador',
    nombreCorto: 'Tensor',
    colorHex: '#d946ef', // Magenta
    colorClaseTailwind: 'bg-fuchsia-500',
    colorBgTailwind: 'bg-fuchsia-50',
    colorBorderTailwind: 'border-fuchsia-300',
    colorTextTailwind: 'text-fuchsia-800',
    colorThreeJs: 0xd946ef,
    descripcion: 'Cables o varillas redondas tensadas'
  },
  piso_deck: {
    rol: 'piso_deck',
    nombre: 'Piso Metal Deck / Plancha Colaborante',
    nombreCorto: 'Piso Deck',
    colorHex: '#14b8a6', // Teal
    colorClaseTailwind: 'bg-teal-500',
    colorBgTailwind: 'bg-teal-50',
    colorBorderTailwind: 'border-teal-300',
    colorTextTailwind: 'text-teal-800',
    colorThreeJs: 0x14b8a6,
    descripcion: 'Estructura de entrepiso y losa de acero colaborante'
  },
  baranda: {
    rol: 'baranda',
    nombre: 'Baranda Perimétrica',
    nombreCorto: 'Baranda',
    colorHex: '#64748b', // Slate
    colorClaseTailwind: 'bg-slate-500',
    colorBgTailwind: 'bg-slate-50',
    colorBorderTailwind: 'border-slate-300',
    colorTextTailwind: 'text-slate-800',
    colorThreeJs: 0x64748b,
    descripcion: 'Protección de borde perimétrico'
  },
  escalera: {
    rol: 'escalera',
    nombre: 'Zanca de Escalera',
    nombreCorto: 'Escalera',
    colorHex: '#78716c', // Stone
    colorClaseTailwind: 'bg-stone-500',
    colorBgTailwind: 'bg-stone-50',
    colorBorderTailwind: 'border-stone-300',
    colorTextTailwind: 'text-stone-800',
    colorThreeJs: 0x78716c,
    descripcion: 'Estructura de soporte de gradas metálicas'
  },
  placa_base: {
    rol: 'placa_base',
    nombre: 'Placa Base de Acero',
    nombreCorto: 'Placa Base',
    colorHex: '#334155', // Slate Oscuro
    colorClaseTailwind: 'bg-slate-700',
    colorBgTailwind: 'bg-slate-100',
    colorBorderTailwind: 'border-slate-400',
    colorTextTailwind: 'text-slate-900',
    colorThreeJs: 0x334155,
    descripcion: 'Plancha de anclaje para pernos J-Bolt'
  },
  cartela: {
    rol: 'cartela',
    nombre: 'Cartela de Refuerzo / Acople',
    nombreCorto: 'Cartela',
    colorHex: '#475569',
    colorClaseTailwind: 'bg-slate-600',
    colorBgTailwind: 'bg-slate-100',
    colorBorderTailwind: 'border-slate-300',
    colorTextTailwind: 'text-slate-800',
    colorThreeJs: 0x475569,
    descripcion: 'Gusset plate para nudos rígidos'
  }
};

// 2. CATÁLOGO DE TIPOLOGÍAS DE TIJERALES
export const CATALOGO_TIJERALES_INFO: Record<TipoTijeral, TijeralInfo> = {
  escalera_vierendeel: {
    id: 'escalera_vierendeel',
    nombre: 'Tijeral Tipo Escalera / Vierendeel (Montantes Rectos a 90°)',
    categoria: 'plano',
    descripcionCorta: 'Cordones paralelos con montantes verticales a 90° sin diagonales (Viga Escalera)',
    comportamiento: 'Resiste flexión mediante marcos cerrados rectangulares y nudos ortogonales rígidos',
    colorHex: '#10b981',
    ventajas: 'Aspecto limpio, modulación regular de vanos rectangulares y paso libre para luminarias/tuberías'
  },
  parabolico_warren: {
    id: 'parabolico_warren',
    nombre: 'Tijeral Parabólico Warren (Curvo)',
    categoria: 'curvo',
    descripcionCorta: 'Arco curvo con celosía en zig-zag sin montantes',
    comportamiento: 'Diagonales alternadas en tracción y compresión para máxima ligereza',
    colorHex: '#f59e0b',
    ventajas: 'Menor cantidad de soldadura y peso de acero óptimo para grandes luces (12m a 30m)'
  },
  parabolico_pratt: {
    id: 'parabolico_pratt',
    nombre: 'Tijeral Parabólico Pratt (Curvo)',
    categoria: 'curvo',
    descripcionCorta: 'Arco curvo con montantes radiales y diagonales hacia el centro',
    comportamiento: 'Montantes verticales a compresión y diagonales largas a tracción',
    colorHex: '#8b5cf6',
    ventajas: 'Excelente rigidez y fijación uniforme para colgar luminarias y bandejas'
  },
  parabolico_bowstring: {
    id: 'parabolico_bowstring',
    nombre: 'Arco con Tirante Horizontal (Bowstring)',
    categoria: 'curvo',
    descripcionCorta: 'Arco parabólico superior con tirante horizontal inferior recto',
    comportamiento: 'El tirante recto anula el empuje horizontal sobre las cabezas de columna',
    colorHex: '#0ea5e9',
    ventajas: 'Ideal para columnas esbeltas o de concreto, máxima estabilidad lateral'
  },
  warren: {
    id: 'warren',
    nombre: 'Tijeral Tipo Warren (Plano / Recto)',
    categoria: 'plano',
    descripcionCorta: 'Triángulos equiláteros continuos en zig-zag',
    comportamiento: 'Ideal para vigas de alma abierta (Joists) y naves industriales',
    colorHex: '#06b6d4',
    ventajas: 'Construcción muy rápida y distribución simétrica de esfuerzos'
  },
  pratt: {
    id: 'pratt',
    nombre: 'Tijeral Tipo Pratt (Plano / Inclinado)',
    categoria: 'plano',
    descripcionCorta: 'Montantes verticales con diagonales inclinadas hacia el centro',
    comportamiento: 'Diagonales trabajan a tracción, evitando el pandeo por compresión',
    colorHex: '#6366f1',
    ventajas: 'Muy eficiente en acero estructural estándar (perfiles tubulares y ángulos)'
  },
  howe: {
    id: 'howe',
    nombre: 'Tijeral Tipo Howe (Plano / 2 Aguas)',
    categoria: 'plano',
    descripcionCorta: 'Montantes verticales con diagonales inclinadas hacia los apoyos',
    comportamiento: 'Diagonales trabajan a compresión y montantes a tracción',
    colorHex: '#ec4899',
    ventajas: 'Clásico para techos con cargas pesadas concentradas en nudos'
  },
  fink: {
    id: 'fink',
    nombre: 'Tijeral Tipo Fink (Dos Aguas Triangular)',
    categoria: 'dos_aguas',
    descripcionCorta: 'Subdivisión simétrica en forma de W para cumbrera central',
    comportamiento: 'Cordones superiores comprimidos con diagonales cortas',
    colorHex: '#10b981',
    ventajas: 'El diseño más popular y económico para techos a dos aguas de 6m a 24m'
  },
  plano_viga: {
    id: 'plano_viga',
    nombre: 'Viga Reticulada de Alma Abierta (Joist)',
    categoria: 'plano',
    descripcionCorta: 'Cordones paralelos superior e inferior con celosía interna',
    comportamiento: 'Viga plana horizontal para soportar entrepisos o techos planos',
    colorHex: '#ef4444',
    ventajas: 'Permite pasar tuberías y ductos de ventilación a través de su alma abierta'
  },
  simple_arco: {
    id: 'simple_arco',
    nombre: 'Arco Rolado Simple (Monotubo)',
    categoria: 'curvo',
    descripcionCorta: 'Un solo tubo curvado continuo sin celosía interna',
    comportamiento: 'Estructura liviana de curvatura directa',
    colorHex: '#3b82f6',
    ventajas: 'Ideal para cocheras, terrazas y techos residenciales de 4m a 8m de luz'
  },
  parabolico_curvo: {
    id: 'parabolico_curvo',
    nombre: 'Arco Curvo Continuo Autoportante',
    categoria: 'curvo',
    descripcionCorta: 'Arco continuo con tirante horizontal y tímpanos de fachada',
    comportamiento: 'Distribución continua de cargas axiales y empuje lateral absorbido por tirante',
    colorHex: '#0284c7',
    ventajas: 'Gran velocidad de montaje y cobertura de grandes naves sin columnas intermedias'
  },
  viga_celosia: {
    id: 'viga_celosia',
    nombre: 'Viga de Celosía Paramétrica',
    categoria: 'plano',
    descripcionCorta: 'Viga reticulada de alta inercia con entramado diagonal',
    comportamiento: 'Elevada capacidad resistente para cargas concentradas y puentes grúa',
    colorHex: '#d97706',
    ventajas: 'Excelente relación resistencia/peso para vanos libres considerables'
  },
  viga_ipe: {
    id: 'viga_ipe',
    nombre: 'Viga Alma Llena IPE / Perfil W',
    categoria: 'plano',
    descripcionCorta: 'Perfil de acero laminado en caliente o soldado de alma llena',
    comportamiento: 'Resistencia a flexión pura con sección compacta',
    colorHex: '#475569',
    ventajas: 'Montaje directo y menor mano de obra de armado que un tijeral reticulado'
  }
};

// 3. OBTENER COLOR PARA UN SEGMENTO CAD
export interface MarketPaintColor {
  id: string;
  nombre: string;
  hex: string;
  threeColor: number;
  tipoComercial: string;
}

export const MERCADO_COLORES_PINTURA: MarketPaintColor[] = [
  { id: 'blanco', nombre: 'Blanco Alerce / Industrial', hex: '#f8fafc', threeColor: 0xf8fafc, tipoComercial: 'Esmalte Sintético' },
  { id: 'gris', nombre: 'Gris Industrial / Galvanizado', hex: '#64748b', threeColor: 0x64748b, tipoComercial: 'Anticorrosivo' },
  { id: 'negro', nombre: 'Negro Mate / Grafito', hex: '#1e293b', threeColor: 0x1e293b, tipoComercial: 'Esmalte Sintético' },
  { id: 'azul', nombre: 'Azul Metálico / Marino', hex: '#2563eb', threeColor: 0x2563eb, tipoComercial: 'Esmalte Sintético' },
  { id: 'rojo', nombre: 'Rojo Óxido / Primer', hex: '#dc2626', threeColor: 0xdc2626, tipoComercial: 'Anticorrosivo' },
  { id: 'amarillo', nombre: 'Amarillo Seguridad OSHA', hex: '#eab308', threeColor: 0xeab308, tipoComercial: 'Poliuretano' },
  { id: 'verde', nombre: 'Verde Maquinaria', hex: '#16a34a', threeColor: 0x16a34a, tipoComercial: 'Esmalte Sintético' },
  { id: 'naranja', nombre: 'Naranja Naranjo', hex: '#ea580c', threeColor: 0xea580c, tipoComercial: 'Esmalte Sintético' },
];

export const getSegmentColorHex = (rolEstructural: RolEstructuralSegmento, isSelected: boolean = false): string => {
  if (isSelected) return '#0f172a'; // Slate-900 oscuro destacado
  return ROLES_ESTRUCTURALES_INFO[rolEstructural]?.colorHex || '#3b82f6';
};

// 4. MAPA DE COLOR POR HERRAMIENTA CAD
export const getToolColorBadge = (tool: ToolModoCad): { bg: string; text: string; border: string; hex: string } => {
  switch (tool) {
    case 'draw_col':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', hex: '#2563eb' };
    case 'draw_arc':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', hex: '#f59e0b' };
    case 'draw_tijeral':
    case 'draw_truss_warren':
      return { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-300', hex: '#06b6d4' };
    case 'draw_truss_pratt':
      return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', hex: '#8b5cf6' };
    case 'draw_truss_howe':
      return { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-300', hex: '#ec4899' };
    case 'draw_truss_fink':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', hex: '#10b981' };
    case 'draw_line':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', hex: '#ef4444' };
    case 'draw_correa':
      return { bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-300', hex: '#84cc16' };
    case 'draw_arriostre':
      return { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-300', hex: '#ec4899' };
    case 'draw_node':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', hex: '#3b82f6' };
    case 'draw_mezzanine':
      return { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-300', hex: '#14b8a6' };
    default:
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', hex: '#f59e0b' };
  }
};
