// Catálogo de instalaciones eléctricas interiores (CNE – Utilización) con precios de
// referencia en soles (Lima). Cada usuario los cambia en Precios.
//   · Conductores THW-90 o NH-80 (libre de halógenos) por rollo de 100 m o por metro.
//   · Tubo PVC-SAP (pesado) o PVC-L (liviano) en barras de 3 m, con curvas, uniones y conectores.
//   · Cajas, dispositivos con placa, luminarias (opcional), tablero, termomagnéticos,
//     diferenciales y pozo a tierra.
// La mano de obra se cobra por punto (como se cotiza en Perú) o por jornal del electricista.

export type TipoCable = 'thw' | 'nh80';
export type TipoTubo = 'sap' | 'l';
export const SECCIONES = [2.5, 4, 6, 10, 16, 25] as const;
export const DIAMS_TUBO = ['3/4', '1', '1 1/4'] as const;

const slugSec = (s: number) => String(s).replace('.', '');
const slugD = (d: string) => d.replace(' ', '').replace('/', '');
export const claveCable = (t: TipoCable, s: number, rollo: boolean) => `ele:cable:${t}:${slugSec(s)}:${rollo ? 'rollo' : 'm'}`;
export const claveTuboEle = (t: TipoTubo, d: string) => `ele:tubo:${t}:${slugD(d)}`;
export const claveCurva = (t: TipoTubo, d: string) => `ele:curva:${t}:${slugD(d)}`;
export const claveUnion = (t: TipoTubo, d: string) => `ele:union:${t}:${slugD(d)}`;
export const claveConector = (d: string) => `ele:conector:${slugD(d)}`;
export const claveTM = (a: number) => `ele:tm:2x${a}`;
export const claveID = (a: number) => `ele:id:2x${a}`;
export const LARGO_BARRA_ELE = 3;
export const NOMBRE_CABLE: Record<TipoCable, string> = { thw: 'THW-90', nh80: 'NH-80 (libre de halógenos)' };
export const NOMBRE_TUBO: Record<TipoTubo, string> = { sap: 'PVC-SAP', l: 'PVC-L' };
export const BREAKERS = [16, 20, 25, 32, 40, 50, 63] as const;

// Precio por metro y por rollo de 100 m (el rollo sale ~8 % más barato).
const CABLES: [TipoCable, number, number, number][] = [
  ['thw', 2.5, 1.7, 155], ['thw', 4, 2.6, 240], ['thw', 6, 3.8, 350], ['thw', 10, 6.2, 575], ['thw', 16, 9.6, 890], ['thw', 25, 14.8, 1380],
  ['nh80', 2.5, 2.0, 185], ['nh80', 4, 3.1, 285], ['nh80', 6, 4.5, 415], ['nh80', 10, 7.4, 680], ['nh80', 16, 11.5, 1060], ['nh80', 25, 17.6, 1640],
];
const TUBOS: [TipoTubo, string, number, number, number][] = [ // tubo, curva, unión
  ['sap', '3/4', 5.5, 1.5, 0.8], ['sap', '1', 8.5, 2.5, 1.2], ['sap', '1 1/4', 13, 3.8, 1.8],
  ['l', '3/4', 2.8, 0.8, 0.5], ['l', '1', 4.2, 1.2, 0.7], ['l', '1 1/4', 6.5, 2.0, 1.0],
];
const TM: [number, number][] = [[16, 28], [20, 28], [25, 30], [32, 33], [40, 45], [50, 65], [63, 82]];

// [clave, nombre, unidad, precio de referencia S/, grupo del catálogo]
export const ELECTRICIDAD_ITEMS: [string, string, string, number, string][] = [
  ...CABLES.flatMap(([t, s, m, r]) => [
    [claveCable(t, s, true), `Cable ${NOMBRE_CABLE[t]} ${s} mm² (rollo 100 m)`, 'rollo', r, 'Electricidad'],
    [claveCable(t, s, false), `Cable ${NOMBRE_CABLE[t]} ${s} mm² (por metro)`, 'm', m, 'Electricidad'],
  ] as [string, string, string, number, string][]),
  ['ele:cable_desnudo:16', 'Conductor de cobre desnudo 16 mm² (pozo a tierra)', 'm', 10, 'Electricidad'],
  ['ele:coaxial', 'Cable coaxial RG-6 (TV / cable)', 'm', 1.2, 'Electricidad'],
  ['ele:utp', 'Cable UTP Cat 6 (datos / internet)', 'm', 1.8, 'Electricidad'],
  ['ele:timbre_cable', 'Cable mellizo 2 × 1 mm² (timbre)', 'm', 0.9, 'Electricidad'],
  ...TUBOS.flatMap(([t, d, tb, cv, un]) => [
    [claveTuboEle(t, d), `Tubo ${NOMBRE_TUBO[t]} Ø ${d}" (barra 3 m)`, 'barra', tb, 'Electricidad'],
    [claveCurva(t, d), `Curva ${NOMBRE_TUBO[t]} Ø ${d}"`, 'unidad', cv, 'Electricidad'],
    [claveUnion(t, d), `Unión ${NOMBRE_TUBO[t]} Ø ${d}"`, 'unidad', un, 'Electricidad'],
  ] as [string, string, string, number, string][]),
  [claveConector('3/4'), 'Conector / adaptador a caja Ø 3/4"', 'unidad', 0.6, 'Electricidad'],
  [claveConector('1'), 'Conector / adaptador a caja Ø 1"', 'unidad', 0.9, 'Electricidad'],
  [claveConector('1 1/4'), 'Conector / adaptador a caja Ø 1 1/4"', 'unidad', 1.4, 'Electricidad'],
  ['ele:caja:octogonal', 'Caja octogonal 4" × 1½" PVC pesada (luces)', 'unidad', 1.6, 'Electricidad'],
  ['ele:caja:rectangular', 'Caja rectangular 4" × 2" PVC pesada (interruptores y tomas)', 'unidad', 1.2, 'Electricidad'],
  ['ele:caja:cuadrada', 'Caja cuadrada 4" × 4" PVC pesada (salidas de fuerza)', 'unidad', 2.2, 'Electricidad'],
  ['ele:caja:paso', 'Caja de paso 4" × 4" con tapa ciega', 'unidad', 3.5, 'Electricidad'],
  // Dispositivos con su placa.
  ['ele:disp:int_simple', 'Interruptor simple con placa', 'unidad', 9, 'Electricidad'],
  ['ele:disp:int_doble', 'Interruptor doble con placa', 'unidad', 13, 'Electricidad'],
  ['ele:disp:int_triple', 'Interruptor triple con placa', 'unidad', 18, 'Electricidad'],
  ['ele:disp:int_conmutador', 'Interruptor de conmutación (3 vías) con placa', 'unidad', 14, 'Electricidad'],
  ['ele:disp:toma_doble', 'Tomacorriente doble con línea a tierra, con placa', 'unidad', 12, 'Electricidad'],
  ['ele:disp:toma_cocina', 'Tomacorriente doble con tierra y tapa (mesada)', 'unidad', 15, 'Electricidad'],
  ['ele:disp:toma_lavadora', 'Tomacorriente 16 A con tierra (lavadora / refrigeradora)', 'unidad', 13, 'Electricidad'],
  ['ele:disp:fuerza_terma', 'Salida de fuerza para terma (caja con borne y placa)', 'unidad', 16, 'Electricidad'],
  ['ele:disp:fuerza_ducha', 'Salida de fuerza para ducha eléctrica', 'unidad', 16, 'Electricidad'],
  ['ele:disp:fuerza_cocina', 'Tomacorriente 32 A para cocina eléctrica / horno', 'unidad', 28, 'Electricidad'],
  ['ele:disp:fuerza_aire', 'Salida de fuerza para aire acondicionado', 'unidad', 18, 'Electricidad'],
  ['ele:disp:timbre', 'Timbre con pulsador', 'unidad', 45, 'Electricidad'],
  ['ele:disp:tv', 'Salida de TV (placa coaxial)', 'unidad', 10, 'Electricidad'],
  ['ele:disp:datos', 'Salida de datos RJ45 Cat 6 con placa', 'unidad', 18, 'Electricidad'],
  ['ele:disp:sensor', 'Sensor de movimiento 360° de techo', 'unidad', 45, 'Electricidad'],
  ['ele:disp:cerco', 'Energizador de cerco eléctrico (salida y equipo)', 'unidad', 450, 'Electricidad'],
  // Luminarias (opcional en el presupuesto).
  ['ele:lum:luz_techo', 'Luminaria LED de techo (plafón 18 W)', 'unidad', 35, 'Electricidad'],
  ['ele:lum:aplique', 'Aplique / braquete de pared LED', 'unidad', 45, 'Electricidad'],
  ['ele:lum:empotrado', 'Panel LED empotrado 18 W', 'unidad', 30, 'Electricidad'],
  ['ele:lum:tira_led', 'Tira LED 5 m con fuente y perfil', 'unidad', 75, 'Electricidad'],
  ['ele:lum:reflector', 'Reflector LED 50 W exterior', 'unidad', 60, 'Electricidad'],
  // Tablero y protecciones.
  ['ele:tablero:12', 'Tablero de distribución para empotrar, 12 polos (riel DIN)', 'unidad', 95, 'Electricidad'],
  ['ele:tablero:18', 'Tablero de distribución para empotrar, 18 polos (riel DIN)', 'unidad', 135, 'Electricidad'],
  ['ele:tablero:24', 'Tablero de distribución para empotrar, 24 polos (riel DIN)', 'unidad', 170, 'Electricidad'],
  ['ele:tablero:36', 'Tablero de distribución para empotrar, 36 polos (riel DIN)', 'unidad', 260, 'Electricidad'],
  ...TM.map(([a, p]) => [claveTM(a), `Interruptor termomagnético 2 × ${a} A`, 'unidad', p, 'Electricidad'] as [string, string, string, number, string]),
  [claveID(25), 'Interruptor diferencial 2 × 25 A, 30 mA', 'unidad', 95, 'Electricidad'],
  [claveID(40), 'Interruptor diferencial 2 × 40 A, 30 mA', 'unidad', 125, 'Electricidad'],
  [claveID(63), 'Interruptor diferencial 2 × 63 A, 30 mA', 'unidad', 175, 'Electricidad'],
  ['ele:barra_tierra', 'Barra de tierra (bornera) para tablero', 'unidad', 15, 'Electricidad'],
  ['ele:caja_medidor', 'Caja portamedidor monofásica para empotrar', 'unidad', 110, 'Electricidad'],
  // Pozo a tierra.
  ['ele:pt:varilla', 'Varilla de cobre 5/8" × 2.40 m', 'unidad', 85, 'Electricidad'],
  ['ele:pt:conector', 'Conector de cobre tipo AB para varilla', 'unidad', 12, 'Electricidad'],
  ['ele:pt:bentonita', 'Bentonita (bolsa 30 kg)', 'bolsa', 35, 'Electricidad'],
  ['ele:pt:cemento', 'Cemento conductivo (bolsa 25 kg)', 'bolsa', 48, 'Electricidad'],
  ['ele:pt:caja', 'Caja de registro de concreto con tapa (pozo a tierra)', 'unidad', 45, 'Electricidad'],
  // Consumibles.
  ['ele:cinta', 'Cinta aislante de vinilo (rollo 20 m)', 'rollo', 4, 'Electricidad'],
  ['ele:abrazadera', 'Abrazadera de 1 oreja para tubo 3/4" – 1"', 'unidad', 0.5, 'Electricidad'],
  ['ele:guia', 'Alambre guía galvanizado N.º 16 (kg)', 'kg', 9, 'Electricidad'],
  // Mano de obra por punto (Lima: incluye canaleteo, tendido, cableado, conexionado y resane simple).
  ['ele:mo:punto_luz', 'Punto de luz con su interruptor (mano de obra)', 'punto', 65, 'Electricidad'],
  ['ele:mo:punto_toma', 'Punto de tomacorriente (mano de obra)', 'punto', 60, 'Electricidad'],
  ['ele:mo:salida_fuerza', 'Salida de fuerza – circuito exclusivo (mano de obra)', 'punto', 110, 'Electricidad'],
  ['ele:mo:punto_debil', 'Punto de TV / datos (mano de obra)', 'punto', 45, 'Electricidad'],
  ['ele:mo:tablero', 'Armado e instalación del tablero de distribución', 'unidad', 220, 'Electricidad'],
  ['ele:mo:alimentador', 'Tendido del alimentador medidor – tablero', 'm', 6, 'Electricidad'],
  ['ele:mo:pozo', 'Pozo a tierra (excavación, relleno y medición)', 'unidad', 380, 'Electricidad'],
  ['ele:mo:prueba', 'Pruebas de aislamiento y continuidad, protocolo', 'global', 120, 'Electricidad'],
  ['ele:mo:luminaria', 'Instalación de luminaria', 'unidad', 15, 'Electricidad'],
];
