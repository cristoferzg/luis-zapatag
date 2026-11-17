// Catálogo de carpintería de madera (puertas, marcos, closets, pisos, cielos y escaleras)
// con precios de referencia en soles (Lima). Cada usuario los cambia en Precios.
//   · Madera sólida (cedro, tornillo, pino): precio por PIE TABLAR (p2).
//   · Tableros (MDF, triplay de lupuna, OSB): precio por plancha.
//   · Mano de obra del carpintero por unidad / m² / paso, o por jornal.

export type MaderaSolida = 'cedro' | 'tornillo' | 'pino';
export type MaderaTablero = 'mdf' | 'triplay' | 'osb';
export type Madera = MaderaSolida | MaderaTablero;

export const esSolida = (m: Madera): m is MaderaSolida => m === 'cedro' || m === 'tornillo' || m === 'pino';
export const NOMBRE_MADERA: Record<Madera, string> = {
  cedro: 'Cedro', tornillo: 'Tornillo', pino: 'Pino radiata', mdf: 'MDF', triplay: 'Triplay de lupuna', osb: 'OSB',
};
/** Color de cada madera (dibujo y 3D). */
export const COLOR_MADERA: Record<Madera, string> = {
  cedro: '#9a5b34', tornillo: '#b07a4f', pino: '#e2c08d', mdf: '#c9a77c', triplay: '#d8b98a', osb: '#c8a466',
};
/** Medidas de la plancha (m): MDF 1.83 × 2.44; triplay y OSB 1.22 × 2.44. */
export const PLANCHA: Record<MaderaTablero, { L: number; A: number }> = {
  mdf: { L: 2.44, A: 1.83 }, triplay: { L: 2.44, A: 1.22 }, osb: { L: 2.44, A: 1.22 },
};
export const ESPESORES: Record<MaderaTablero, number[]> = { mdf: [5.5, 9, 12, 15, 18], triplay: [4, 6, 9, 12, 18], osb: [9, 11, 15, 18] };

export const clavePt = (m: MaderaSolida) => `mad:pt:${m}`;
export const claveTablero = (m: MaderaTablero, esp: number) => `mad:tab:${m}:${String(esp).replace('.', '_')}`;

const PT: [MaderaSolida, number][] = [['cedro', 13], ['tornillo', 7.5], ['pino', 5.5]];
const TAB: [MaderaTablero, number, number][] = [
  ['mdf', 5.5, 45], ['mdf', 9, 72], ['mdf', 12, 88], ['mdf', 15, 105], ['mdf', 18, 125],
  ['triplay', 4, 32], ['triplay', 6, 42], ['triplay', 9, 58], ['triplay', 12, 75], ['triplay', 18, 112],
  ['osb', 9, 48], ['osb', 11, 56], ['osb', 15, 76], ['osb', 18, 92],
];

// [clave, nombre, unidad, precio de referencia S/, grupo del catálogo]
export const MADERA_ITEMS: [string, string, string, number, string][] = [
  ...PT.map(([m, p]) => [clavePt(m), `Madera ${NOMBRE_MADERA[m]} cepillada (seca)`, 'pie tablar', p, 'Carpintería de madera'] as [string, string, string, number, string]),
  ...TAB.map(([m, e, p]) => [claveTablero(m, e), `${NOMBRE_MADERA[m]} ${e} mm (${PLANCHA[m].A.toFixed(2)} × ${PLANCHA[m].L.toFixed(2)} m)`, 'plancha', p, 'Carpintería de madera'] as [string, string, string, number, string]),
  // Herrajes
  ['mad:bisagra_capuchina', 'Bisagra capuchina 3 1/2" × 3 1/2" (acero bronceado)', 'unidad', 9, 'Carpintería de madera'],
  ['mad:bisagra_cangrejo', 'Bisagra cangrejo 35 mm cierre suave', 'unidad', 7, 'Carpintería de madera'],
  ['mad:chapa_perilla', 'Cerradura de perilla (pomo) con llave', 'unidad', 45, 'Carpintería de madera'],
  ['mad:chapa_dos_golpes', 'Cerradura de sobreponer 2 golpes (puerta principal)', 'unidad', 85, 'Carpintería de madera'],
  ['mad:chapa_manija', 'Cerradura de embutir con manija', 'unidad', 95, 'Carpintería de madera'],
  ['mad:chapa_closet', 'Chapa para mueble / closet', 'unidad', 12, 'Carpintería de madera'],
  ['mad:tirador', 'Tirador para mueble (128 mm)', 'unidad', 8, 'Carpintería de madera'],
  ['mad:riel_cajon', 'Correderas telescópicas 45 cm (par)', 'par', 22, 'Carpintería de madera'],
  ['mad:barra_colgador', 'Barra colgadora ovalada con soportes', 'm', 14, 'Carpintería de madera'],
  ['mad:tope', 'Tope de puerta', 'unidad', 6, 'Carpintería de madera'],
  // Consumibles y acabado
  ['mad:cola', 'Cola sintética para madera', 'galón', 38, 'Carpintería de madera'],
  ['mad:clavos', 'Clavos (con y sin cabeza) 1" a 3"', 'kg', 7, 'Carpintería de madera'],
  ['mad:tornillos', 'Tornillos para madera 1 1/2" con tarugo', 'ciento', 10, 'Carpintería de madera'],
  ['mad:lija', 'Lija para madera (N.º 80, 120, 220)', 'pliego', 2.5, 'Carpintería de madera'],
  ['mad:masilla', 'Masilla para madera', 'kg', 12, 'Carpintería de madera'],
  ['mad:sellador', 'Sellador para madera (nitrocelulosa)', 'galón', 55, 'Carpintería de madera'],
  ['mad:laca', 'Laca piroxilina / DD transparente', 'galón', 78, 'Carpintería de madera'],
  ['mad:barniz', 'Barniz marino', 'galón', 70, 'Carpintería de madera'],
  ['mad:tinte', 'Tinte para madera al thinner', 'galón', 48, 'Carpintería de madera'],
  ['mad:duco', 'Pintura al duco (base + acabado)', 'galón', 88, 'Carpintería de madera'],
  ['pintura:thinner', 'Thinner acrílico', 'galón', 25, 'Consumibles y pintura'],
  // Mano de obra del carpintero (fabricación e instalación)
  ['mad:mo:puerta_contraplacada', 'Puerta contraplacada: fabricación e instalación', 'unidad', 220, 'Carpintería de madera'],
  ['mad:mo:puerta_apanelada', 'Puerta apanelada: fabricación e instalación', 'unidad', 480, 'Carpintería de madera'],
  ['mad:mo:marco', 'Marco y contramarco: fabricación e instalación', 'unidad', 90, 'Carpintería de madera'],
  ['mad:mo:closet', 'Closet / ropero de madera (por m² de frente)', 'm²', 230, 'Carpintería de madera'],
  ['mad:mo:mueble', 'Mueble a medida (por m² de frente)', 'm²', 210, 'Carpintería de madera'],
  ['mad:mo:piso', 'Piso de madera machihembrado instalado', 'm²', 38, 'Carpintería de madera'],
  ['mad:mo:cielo', 'Cielo / revestimiento de madera instalado', 'm²', 42, 'Carpintería de madera'],
  ['mad:mo:escalera', 'Escalera de madera (por paso)', 'paso', 130, 'Carpintería de madera'],
  ['mad:mo:acabado', 'Acabado (lijado, sellado y laqueado / pintado)', 'm²', 24, 'Carpintería de madera'],
  ['jornal:carpintero de madera', 'Carpintero de madera', 'día', 120, 'Mano de obra (jornal por día)'],
];
