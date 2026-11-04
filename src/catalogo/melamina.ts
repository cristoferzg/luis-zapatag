// Catálogo de melamina (muebles de closet, cocina, reposteros…): colores de tablero
// y herrajes con precios de referencia en soles (Lima). Cada usuario los cambia en Precios.

export interface ColorMelamina { id: string; nombre: string; hex: string; ref: number }

// Tablero de melamina 18 mm de 2.44 × 2.15 m. Los colores madera cuestan algo más.
export const COLORES_MELAMINA: ColorMelamina[] = [
  { id: 'blanco', nombre: 'Blanco', hex: '#f4f4f2', ref: 195 },
  { id: 'gris_humo', nombre: 'Gris humo', hex: '#9a9b98', ref: 235 },
  { id: 'negro', nombre: 'Negro', hex: '#2b2b2b', ref: 240 },
  { id: 'roble', nombre: 'Roble', hex: '#c49a63', ref: 240 },
  { id: 'nogal', nombre: 'Nogal', hex: '#7a5232', ref: 245 },
  { id: 'cerezo', nombre: 'Cerezo', hex: '#a5573a', ref: 240 },
  { id: 'haya', nombre: 'Haya', hex: '#d8b48a', ref: 240 },
  { id: 'wengue', nombre: 'Wengué', hex: '#4a3428', ref: 245 },
  { id: 'cenizo', nombre: 'Cenizo', hex: '#b8ada0', ref: 240 },
];
export const slugColor = (nombre: string) => nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'otro';
export const colorMelamina = (nombre: string): ColorMelamina =>
  COLORES_MELAMINA.find(c => c.nombre.toLowerCase() === (nombre || '').toLowerCase()) || { id: slugColor(nombre), nombre: nombre || 'Otro color', hex: '#cdbfa8', ref: 240 };
export const claveTablero = (color: string) => {
  const c = COLORES_MELAMINA.find(x => x.nombre.toLowerCase() === (color || '').toLowerCase());
  return `mel:tablero:${c ? c.id : 'otro'}`;
};

// [clave, nombre, unidad, precio de referencia S/]
export const MELAMINA_ITEMS: [string, string, string, number][] = [
  ['mel:hdf', 'Fondo HDF / MDF 3 mm (2.44 × 2.15 m)', 'plancha', 45],
  ['mel:canto_grueso', 'Tapacanto PVC grueso 2 mm', 'm', 1.2],
  ['mel:canto_delgado', 'Tapacanto delgado 0.45 mm', 'm', 0.5],
  ['mel:bisagra', 'Bisagra cazoleta 35 mm (con base)', 'unidad', 4.5],
  ['mel:corredera_30', 'Corredera telescópica 30 cm', 'par', 18],
  ['mel:corredera_35', 'Corredera telescópica 35 cm', 'par', 20],
  ['mel:corredera_40', 'Corredera telescópica 40 cm', 'par', 23],
  ['mel:corredera_45', 'Corredera telescópica 45 cm', 'par', 26],
  ['mel:jalador', 'Jalador / tirador', 'unidad', 6],
  ['mel:tubo_colgador', 'Tubo colgador ovalado (barra 3 m)', 'barra', 25],
  ['mel:soporte_tubo', 'Soporte de tubo colgador', 'unidad', 1.5],
  ['mel:pata', 'Pata niveladora para cocina', 'unidad', 3.5],
  ['mel:riel_corredizo', 'Riel para puertas corredizas (juego)', 'juego', 120],
  ['mel:minifix', 'Minifix con perno y tarugo', 'ciento', 40],
  ['mel:tornillo', 'Tornillo para melamina 4 × 50 mm', 'ciento', 6],
  ['mel:soporte_repisa', 'Soporte de repisa (pin)', 'ciento', 8],
  ['mel:corte', 'Servicio de corte (por tablero)', 'tablero', 25],
  ['mel:enchape', 'Servicio de enchape (pegado de tapacanto)', 'm', 1],
];
