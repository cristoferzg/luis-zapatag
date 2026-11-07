// Catálogo de gasfitería (agua fría, agua caliente, desagüe y ventilación) con precios
// de referencia en soles (Lima). Cada usuario los cambia en Precios.
//   · Agua fría: PVC clase 10 (barra de 5 m).   · Agua caliente: CPVC (barra de 5 m).
//   · Desagüe y ventilación: PVC SAL (barra de 3 m).
// La mano de obra se cobra por punto (como se cotiza en Perú) o por jornal del gasfitero.

export type SistemaTubo = 'pvc' | 'cpvc' | 'sal';
export type PiezaGas = 'codo90' | 'codo45' | 'tee' | 'yee' | 'union' | 'reduccion' | 'tapon' | 'adaptador' | 'trampa';

/** Diámetro en pulgadas como texto ('1/2', '3/4', '1', '2', '3', '4') → parte de la clave. */
export const slugDiam = (d: string) => d.replace('/', '');
export const claveTubo = (sis: SistemaTubo, d: string) => `gas:tubo:${sis}:${slugDiam(d)}`;
export const clavePieza = (p: PiezaGas, sis: SistemaTubo, d: string) => `gas:${p}:${sis}:${slugDiam(d)}`;
export const claveLlave = (d: string) => `gas:llave:${slugDiam(d)}`;

export const LARGO_BARRA: Record<SistemaTubo, number> = { pvc: 5, cpvc: 5, sal: 3 };
const NOMBRE_SIS: Record<SistemaTubo, string> = { pvc: 'PVC agua C-10', cpvc: 'CPVC agua caliente', sal: 'PVC SAL desagüe' };
const NOMBRE_PIEZA: Record<PiezaGas, string> = {
  codo90: 'Codo 90°', codo45: 'Codo 45°', tee: 'Tee', yee: 'Yee', union: 'Unión universal', reduccion: 'Reducción',
  tapon: 'Tapón', adaptador: 'Adaptador rosca (UPR)', trampa: 'Trampa “P”',
};
export const nombreTubo = (sis: SistemaTubo, d: string) => `Tubo ${NOMBRE_SIS[sis]} Ø ${d}" (barra ${LARGO_BARRA[sis]} m)`;
export const nombrePieza = (p: PiezaGas, sis: SistemaTubo, d: string) =>
  p === 'reduccion' ? `Reducción ${NOMBRE_SIS[sis]} ${d}" a ${MENOR[d] || d}"` : `${NOMBRE_PIEZA[p]} ${NOMBRE_SIS[sis]} Ø ${d}"`;
/** Diámetro al que reduce una reducción del diámetro dado (la más común). */
export const MENOR: Record<string, string> = { '3/4': '1/2', '1': '3/4', '3': '2', '4': '2' };

// Precio de referencia por barra.
const TUBOS: [SistemaTubo, string, number][] = [
  ['pvc', '1/2', 12], ['pvc', '3/4', 17], ['pvc', '1', 26],
  ['cpvc', '1/2', 22], ['cpvc', '3/4', 38],
  ['sal', '2', 12], ['sal', '3', 19], ['sal', '4', 26],
];
// Conexiones: [pieza, sistema, diámetro, precio S/]
const PIEZAS: [PiezaGas, SistemaTubo, string, number][] = [
  ['codo90', 'pvc', '1/2', 1.0], ['codo90', 'pvc', '3/4', 1.6], ['codo90', 'pvc', '1', 2.8],
  ['codo45', 'pvc', '1/2', 1.0], ['codo45', 'pvc', '3/4', 1.7], ['codo45', 'pvc', '1', 3.0],
  ['tee', 'pvc', '1/2', 1.3], ['tee', 'pvc', '3/4', 2.0], ['tee', 'pvc', '1', 3.5],
  ['union', 'pvc', '1/2', 3.0], ['union', 'pvc', '3/4', 4.5], ['union', 'pvc', '1', 7.0],
  ['reduccion', 'pvc', '3/4', 1.2], ['reduccion', 'pvc', '1', 2.0],
  ['tapon', 'pvc', '1/2', 0.8], ['tapon', 'pvc', '3/4', 1.0], ['tapon', 'pvc', '1', 1.5],
  ['adaptador', 'pvc', '1/2', 1.0], ['adaptador', 'pvc', '3/4', 1.5], ['adaptador', 'pvc', '1', 2.2],
  ['codo90', 'cpvc', '1/2', 1.8], ['codo90', 'cpvc', '3/4', 3.2],
  ['codo45', 'cpvc', '1/2', 2.0], ['codo45', 'cpvc', '3/4', 3.5],
  ['tee', 'cpvc', '1/2', 2.2], ['tee', 'cpvc', '3/4', 3.8],
  ['union', 'cpvc', '1/2', 6.0], ['union', 'cpvc', '3/4', 9.0],
  ['reduccion', 'cpvc', '3/4', 2.5],
  ['tapon', 'cpvc', '1/2', 1.5], ['tapon', 'cpvc', '3/4', 2.2],
  ['adaptador', 'cpvc', '1/2', 3.5], ['adaptador', 'cpvc', '3/4', 5.0],
  ['codo90', 'sal', '2', 2.5], ['codo90', 'sal', '3', 4.5], ['codo90', 'sal', '4', 6.5],
  ['codo45', 'sal', '2', 2.3], ['codo45', 'sal', '3', 4.0], ['codo45', 'sal', '4', 6.0],
  ['yee', 'sal', '2', 4.0], ['yee', 'sal', '3', 7.0], ['yee', 'sal', '4', 10.0],
  ['tee', 'sal', '2', 3.5], ['tee', 'sal', '3', 6.0], ['tee', 'sal', '4', 9.0],
  ['reduccion', 'sal', '3', 3.5], ['reduccion', 'sal', '4', 5.0],
  ['tapon', 'sal', '2', 1.5], ['tapon', 'sal', '3', 2.5], ['tapon', 'sal', '4', 3.5],
  ['trampa', 'sal', '2', 7.5],
];

// [clave, nombre, unidad, precio de referencia S/, grupo del catálogo]
export const GASFITERIA_ITEMS: [string, string, string, number, string][] = [
  ...TUBOS.map(([s, d, p]) => [claveTubo(s, d), nombreTubo(s, d), 'barra', p, 'Gasfitería'] as [string, string, string, number, string]),
  ...PIEZAS.map(([pz, s, d, p]) => [clavePieza(pz, s, d), nombrePieza(pz, s, d), 'unidad', p, 'Gasfitería'] as [string, string, string, number, string]),
  [claveLlave('1/2'), 'Llave de paso esférica de bronce Ø 1/2"', 'unidad', 25, 'Gasfitería'],
  [claveLlave('3/4'), 'Llave de paso esférica de bronce Ø 3/4"', 'unidad', 35, 'Gasfitería'],
  [claveLlave('1'), 'Llave de paso esférica de bronce Ø 1"', 'unidad', 55, 'Gasfitería'],
  ['gas:abasto', 'Conexión flexible (abasto) 1/2" × 40 cm', 'unidad', 9, 'Gasfitería'],
  ['gas:sumidero', 'Sumidero de bronce 2" con rejilla', 'unidad', 14, 'Gasfitería'],
  ['gas:registro:4', 'Registro roscado de bronce 4"', 'unidad', 22, 'Gasfitería'],
  ['gas:registro:2', 'Registro roscado de bronce 2"', 'unidad', 14, 'Gasfitería'],
  ['gas:caja_registro', 'Caja de registro 12" × 24" con tapa (construida)', 'unidad', 180, 'Gasfitería'],
  ['gas:caja_medidor', 'Caja para medidor con tapa', 'unidad', 120, 'Gasfitería'],
  ['gas:sombrero', 'Sombrero de ventilación PVC 2"', 'unidad', 4, 'Gasfitería'],
  ['gas:pegamento_pvc', 'Pegamento para PVC (frasco 1/4 gal)', 'frasco', 32, 'Gasfitería'],
  ['gas:pegamento_cpvc', 'Pegamento para CPVC (frasco 1/4 gal)', 'frasco', 45, 'Gasfitería'],
  ['gas:imprimante', 'Imprimante / limpiador para PVC (frasco 1/4 gal)', 'frasco', 20, 'Gasfitería'],
  ['gas:teflon', 'Cinta teflón 3/4" × 10 m', 'rollo', 1.5, 'Gasfitería'],
  ['gas:abrazadera_agua', 'Abrazadera para tubo de agua 1/2" – 1"', 'unidad', 0.8, 'Gasfitería'],
  ['gas:abrazadera_desague', 'Abrazadera para tubo de desagüe 2" – 4"', 'unidad', 2, 'Gasfitería'],
  // Mano de obra por punto (lo usual en Lima: incluye picado, tendido, pruebas y resane simple).
  ['gas:mo:punto_agua', 'Punto de agua fría (mano de obra)', 'punto', 45, 'Gasfitería'],
  ['gas:mo:punto_caliente', 'Punto de agua caliente (mano de obra)', 'punto', 55, 'Gasfitería'],
  ['gas:mo:punto_desague', 'Punto de desagüe (mano de obra)', 'punto', 55, 'Gasfitería'],
  ['gas:mo:punto_ventilacion', 'Punto de ventilación (mano de obra)', 'punto', 35, 'Gasfitería'],
  ['gas:mo:aparato', 'Instalación de aparato sanitario', 'unidad', 40, 'Gasfitería'],
  ['gas:mo:prueba', 'Prueba hidráulica y de desagüe', 'global', 80, 'Gasfitería'],
  // Aparatos sanitarios (opcional en el presupuesto: muchas veces los compra el cliente).
  ['gas:ap:inodoro', 'Inodoro de tanque bajo con accesorios', 'unidad', 280, 'Aparatos sanitarios'],
  ['gas:ap:lavatorio', 'Lavatorio con pedestal y grifería', 'unidad', 190, 'Aparatos sanitarios'],
  ['gas:ap:ducha', 'Ducha con mezcladora', 'unidad', 140, 'Aparatos sanitarios'],
  ['gas:ap:tina', 'Tina de baño 1.50 m con grifería', 'unidad', 690, 'Aparatos sanitarios'],
  ['gas:ap:lavadero_cocina', 'Lavadero de cocina de acero (1 poza) con grifería', 'unidad', 230, 'Aparatos sanitarios'],
  ['gas:ap:lavadero_ropa', 'Lavadero de ropa de granito con grifo', 'unidad', 180, 'Aparatos sanitarios'],
  ['gas:ap:lavadora', 'Caja y grifo para lavadora', 'unidad', 35, 'Aparatos sanitarios'],
  ['gas:ap:terma', 'Terma eléctrica 80 L', 'unidad', 650, 'Aparatos sanitarios'],
  ['gas:ap:urinario', 'Urinario con fluxómetro', 'unidad', 320, 'Aparatos sanitarios'],
  ['gas:ap:tanque', 'Tanque de agua 1100 L con accesorios', 'unidad', 480, 'Aparatos sanitarios'],
  ['gas:ap:grifo_jardin', 'Grifo de bronce 1/2" para jardín', 'unidad', 18, 'Aparatos sanitarios'],
];
