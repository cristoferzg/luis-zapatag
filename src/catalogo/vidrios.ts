// Catálogo de vidrios y aluminio (ventanas, mamparas, templados, duchas, barandas y espejos)
// con precios de referencia en soles (Lima). Cada usuario los cambia en Precios.
//   · Perfiles de aluminio: precio por BARRA DE 6 m en color natural (mate). Los colores
//     negro, bronce y blanco suman un recargo (%) que también se edita en Precios.
//   · Vidrios: precio por m² (el templado se pide a medida: sin desperdicio).

export type ColorAluminio = 'natural' | 'negro' | 'bronce' | 'blanco';
export const COLORES_ALU: { id: ColorAluminio; nombre: string; hex: string; recargo: number }[] = [
  { id: 'natural', nombre: 'Natural (mate)', hex: '#c4c9cf', recargo: 0 },
  { id: 'negro', nombre: 'Negro', hex: '#2b2f36', recargo: 18 },
  { id: 'bronce', nombre: 'Bronce', hex: '#7a5a3a', recargo: 12 },
  { id: 'blanco', nombre: 'Blanco', hex: '#f4f4f2', recargo: 10 },
];
export const colorAlu = (c: ColorAluminio) => COLORES_ALU.find(x => x.id === c) || COLORES_ALU[0];
export const claveColorAlu = (c: ColorAluminio) => `vid:color:${c}`;

export type TipoVidrio = 'crudo4' | 'crudo6' | 'templado6' | 'templado8' | 'templado10' | 'laminado6' | 'laminado8' | 'catedral' | 'espejo4' | 'espejo6';
export const VIDRIOS: { id: TipoVidrio; nombre: string; corto: string; ref: number; templado: boolean; espesor: number }[] = [
  { id: 'crudo4', nombre: 'Vidrio crudo incoloro 4 mm', corto: 'Crudo 4 mm', ref: 34, templado: false, espesor: 4 },
  { id: 'crudo6', nombre: 'Vidrio crudo incoloro 6 mm', corto: 'Crudo 6 mm', ref: 52, templado: false, espesor: 6 },
  { id: 'templado6', nombre: 'Vidrio templado incoloro 6 mm', corto: 'Templado 6 mm', ref: 115, templado: true, espesor: 6 },
  { id: 'templado8', nombre: 'Vidrio templado incoloro 8 mm', corto: 'Templado 8 mm', ref: 145, templado: true, espesor: 8 },
  { id: 'templado10', nombre: 'Vidrio templado incoloro 10 mm', corto: 'Templado 10 mm', ref: 175, templado: true, espesor: 10 },
  { id: 'laminado6', nombre: 'Vidrio laminado 3 + 3 mm (6 mm)', corto: 'Laminado 6 mm', ref: 120, templado: false, espesor: 6 },
  { id: 'laminado8', nombre: 'Vidrio laminado 4 + 4 mm (8 mm)', corto: 'Laminado 8 mm', ref: 150, templado: false, espesor: 8 },
  { id: 'catedral', nombre: 'Vidrio catedral 4 mm', corto: 'Catedral', ref: 38, templado: false, espesor: 4 },
  { id: 'espejo4', nombre: 'Espejo 4 mm', corto: 'Espejo 4 mm', ref: 58, templado: false, espesor: 4 },
  { id: 'espejo6', nombre: 'Espejo 6 mm', corto: 'Espejo 6 mm', ref: 78, templado: false, espesor: 6 },
];
export const vidrioDe = (v: TipoVidrio) => VIDRIOS.find(x => x.id === v) || VIDRIOS[0];
export const claveVidrio = (v: TipoVidrio) => `vid:vidrio:${v}`;

// Perfiles: [id, nombre, precio barra 6 m natural]
export const PERFILES_ALU: [string, string, number][] = [
  ['s20:riel_sup', 'Riel superior Sistema 20', 42], ['s20:riel_inf', 'Riel inferior Sistema 20', 45], ['s20:jamba', 'Jamba Sistema 20', 32],
  ['s20:cabezal', 'Cabezal / zócalo de hoja Sistema 20', 30], ['s20:pierna', 'Pierna (lateral de hoja) Sistema 20', 32], ['s20:traslape', 'Traslape (encuentro) Sistema 20', 34],
  ['s25:riel_sup', 'Riel superior Sistema 25', 55], ['s25:riel_inf', 'Riel inferior Sistema 25', 58], ['s25:jamba', 'Jamba Sistema 25', 42],
  ['s25:cabezal', 'Cabezal / zócalo de hoja Sistema 25', 40], ['s25:pierna', 'Pierna (lateral de hoja) Sistema 25', 42], ['s25:traslape', 'Traslape (encuentro) Sistema 25', 45],
  ['s3825:riel_sup', 'Riel superior Sistema 3825 (mampara)', 88], ['s3825:riel_inf', 'Riel inferior Sistema 3825 (mampara)', 98], ['s3825:jamba', 'Jamba Sistema 3825', 72],
  ['s3825:cabezal', 'Cabezal / zócalo de hoja Sistema 3825', 66], ['s3825:pierna', 'Pierna (lateral de hoja) Sistema 3825', 72], ['s3825:traslape', 'Traslape (encuentro) Sistema 3825', 75],
  ['s3831:riel_sup', 'Riel superior Sistema 3831 (mampara pesada)', 110], ['s3831:riel_inf', 'Riel inferior Sistema 3831', 122], ['s3831:jamba', 'Jamba Sistema 3831', 90],
  ['s3831:cabezal', 'Cabezal / zócalo de hoja Sistema 3831', 84], ['s3831:pierna', 'Pierna (lateral de hoja) Sistema 3831', 90], ['s3831:traslape', 'Traslape (encuentro) Sistema 3831', 94],
  ['proy:marco', 'Marco para ventana proyectante (serie 35)', 48], ['proy:hoja', 'Hoja para ventana proyectante (serie 35)', 52],
  ['fijo:marco', 'Marco tubular 1" × 2" (paño fijo)', 38], ['fijo:junquillo', 'Junquillo para vidrio', 14],
  ['celosia:marco', 'Marco para celosía de vidrio', 36],
  ['u:templado', 'Perfil U 1/2" para vidrio templado', 28],
  ['baranda:base', 'Perfil base U para baranda de vidrio', 260], ['baranda:pasamanos', 'Pasamanos de aluminio con canal', 110],
  ['espejo:marco', 'Perfil marco para espejo', 30],
];
export const clavePerfilAlu = (id: string) => `vid:perfil:${id}`;
export const LARGO_BARRA_ALU = 6000; // mm

// [clave, nombre, unidad, precio de referencia S/, grupo del catálogo]
export const VIDRIOS_ITEMS: [string, string, string, number, string][] = [
  ...PERFILES_ALU.map(([id, n, p]) => [clavePerfilAlu(id), `${n} (natural)`, 'barra 6 m', p, 'Vidrios y aluminio'] as [string, string, string, number, string]),
  ...COLORES_ALU.filter(c => c.recargo > 0).map(c => [claveColorAlu(c.id), `Recargo aluminio color ${c.nombre.toLowerCase()}`, '% sobre perfiles', c.recargo, 'Vidrios y aluminio'] as [string, string, string, number, string]),
  ...VIDRIOS.map(v => [claveVidrio(v.id), v.nombre, 'm²', v.ref, 'Planchas, vidrio y malla'] as [string, string, string, number, string]),
  // Accesorios
  ['vid:acc:rodamiento', 'Rodamiento para ventana corrediza', 'unidad', 3.5, 'Vidrios y aluminio'],
  ['vid:acc:rodamiento_mampara', 'Rodamiento doble para mampara', 'unidad', 14, 'Vidrios y aluminio'],
  ['vid:acc:felpa', 'Felpa (cepillo) para corrediza', 'm', 0.9, 'Vidrios y aluminio'],
  ['vid:acc:jebe', 'Jebe / burlete para vidrio', 'm', 1.2, 'Vidrios y aluminio'],
  ['vid:acc:pestillo', 'Cierre / pestillo para corrediza', 'unidad', 7, 'Vidrios y aluminio'],
  ['vid:acc:jalador', 'Jalador de aluminio para mampara', 'unidad', 14, 'Vidrios y aluminio'],
  ['vid:acc:chapa_mampara', 'Chapa (cerradura) para mampara corrediza', 'unidad', 48, 'Vidrios y aluminio'],
  ['vid:acc:brazo_proyectante', 'Brazos para ventana proyectante', 'par', 36, 'Vidrios y aluminio'],
  ['vid:acc:manija_proyectante', 'Manija / cremona para proyectante', 'unidad', 18, 'Vidrios y aluminio'],
  ['vid:acc:mecanismo_celosia', 'Mecanismo de celosía (juego lateral)', 'juego', 45, 'Vidrios y aluminio'],
  ['vid:acc:bisagra_piso', 'Bisagra hidráulica de piso (freno) para templado', 'unidad', 420, 'Vidrios y aluminio'],
  ['vid:acc:pivote', 'Pivote / zapata superior para templado', 'unidad', 55, 'Vidrios y aluminio'],
  ['vid:acc:jalador_templado', 'Jalador tubular inox 60 cm para templado', 'unidad', 85, 'Vidrios y aluminio'],
  ['vid:acc:chapa_templado', 'Chapa de piso para puerta templada', 'unidad', 95, 'Vidrios y aluminio'],
  ['vid:acc:kit_ducha', 'Kit corredizo para ducha (tubo inox, carros y soportes)', 'juego', 280, 'Vidrios y aluminio'],
  ['vid:acc:bisagra_ducha', 'Bisagra pared-vidrio para ducha', 'unidad', 75, 'Vidrios y aluminio'],
  ['vid:acc:jalador_ducha', 'Jalador para puerta de ducha', 'unidad', 45, 'Vidrios y aluminio'],
  ['vid:acc:sello_ducha', 'Sello / burlete para ducha', 'm', 9, 'Vidrios y aluminio'],
  ['vid:acc:pinza', 'Pinza (botón) de acero inox para baranda', 'unidad', 28, 'Vidrios y aluminio'],
  ['vid:acc:parante', 'Parante de acero inox para baranda', 'unidad', 160, 'Vidrios y aluminio'],
  ['vid:acc:clip_espejo', 'Clip / gancho para espejo', 'unidad', 1.5, 'Vidrios y aluminio'],
  ['vid:biselado', 'Biselado de espejo', 'm', 8, 'Vidrios y aluminio'],
  ['vid:canto_pulido', 'Canto pulido', 'm', 5, 'Vidrios y aluminio'],
  ['vid:silicona', 'Silicona neutra (tubo 300 ml)', 'tubo', 18, 'Vidrios y aluminio'],
  ['vid:tornillos', 'Tornillos autorroscantes con tarugo', 'ciento', 12, 'Vidrios y aluminio'],
  ['carpi:perno_expansion', 'Perno de expansión 3/8" × 3 1/2" + arandela', 'juego', 4.5, 'Consumibles y pintura'],
  // Mano de obra del vidriero (fabricación e instalación)
  ['vid:mo:ventana', 'Ventana de aluminio: fabricación e instalación', 'm²', 40, 'Vidrios y aluminio'],
  ['vid:mo:mampara', 'Mampara de aluminio: fabricación e instalación', 'm²', 50, 'Vidrios y aluminio'],
  ['vid:mo:puerta_templada', 'Puerta de vidrio templado: instalación (por hoja)', 'hoja', 220, 'Vidrios y aluminio'],
  ['vid:mo:ducha', 'División de ducha en templado: instalación', 'unidad', 200, 'Vidrios y aluminio'],
  ['vid:mo:baranda', 'Baranda de vidrio: instalación', 'm', 90, 'Vidrios y aluminio'],
  ['vid:mo:espejo', 'Espejo: corte e instalación', 'unidad', 45, 'Vidrios y aluminio'],
  ['jornal:vidriero', 'Vidriero', 'día', 110, 'Mano de obra (jornal por día)'],
];
