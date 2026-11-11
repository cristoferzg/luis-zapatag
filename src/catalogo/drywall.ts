// Catálogo de placas de Drywall.
// Precio de referencia (Lima 2026) por plancha 1.22 × 2.44 m, guardado por m².
// Cada usuario lo cambia en Precios.
const PLANCHA_M2 = 1.22 * 2.44;

export interface DrywallItem {
  id: string;
  tipo: string;
  espesor: number; // mm
  precioM2: number; // S/ por m² de placa
  pesoM2: number;   // kg por m² de placa
}

export const DRYWALL_DEFAULTS: DrywallItem[] = [
  { id: 'drywall_standard_125', tipo: 'Drywall Estándar (ST)', espesor: 12.5, precioM2: 32 / PLANCHA_M2, pesoM2: 8.5 },
  { id: 'drywall_humedad_125', tipo: 'Drywall Resistente a Humedad (RH)', espesor: 12.5, precioM2: 45 / PLANCHA_M2, pesoM2: 8.8 },
  { id: 'drywall_fuego_159', tipo: 'Drywall Resistente al Fuego (RF)', espesor: 15.9, precioM2: 55 / PLANCHA_M2, pesoM2: 10.2 },
  { id: 'fibrocemento_8', tipo: 'Placa de Fibrocemento (exterior)', espesor: 8, precioM2: 75 / PLANCHA_M2, pesoM2: 11.5 },
];

// Acabados, puertas y ventanas del cotizador de Drywall, con precios de referencia
// en soles (Lima). Cada usuario los cambia en Precios.
// [clave, nombre, unidad, precio de referencia S/, grupo del catálogo]
export const DRYWALL_ITEMS_EXTRA: [string, string, string, number, string][] = [
  ['dw:placa_flex', 'Placa de drywall flexible 6.4 mm (para curvas)', 'plancha 1.22 × 2.44', 42, 'Drywall y OSB'],
  ['dw:empaste', 'Empaste para interiores (bolsa 25 kg)', 'bolsa', 30, 'Consumibles y pintura'],
  ['dw:imprimante', 'Imprimante / sellador para muros', 'galón', 25, 'Consumibles y pintura'],
  ['dw:pintura_latex', 'Pintura látex lavable para interiores', 'galón', 58, 'Consumibles y pintura'],
  ['dw:lija', 'Lija para pared N.º 120', 'pliego', 1.5, 'Consumibles y pintura'],
  ['dw:puerta_lisa', 'Puerta contraplacada lisa con marco, bisagras y chapa', 'unidad', 380, 'Acabados e instalaciones'],
  ['dw:puerta_vidrio', 'Puerta con vidrio (marco, bisagras y chapa)', 'unidad', 620, 'Acabados e instalaciones'],
  ['dw:puerta_corrediza', 'Puerta corrediza con riel, garruchas y jalador', 'unidad', 650, 'Acabados e instalaciones'],
  ['dw:ventana_corrediza', 'Ventana corrediza de aluminio y vidrio', 'm²', 230, 'Acabados e instalaciones'],
  ['dw:ventana_fija', 'Ventana fija de aluminio y vidrio', 'm²', 170, 'Acabados e instalaciones'],
  ['dw:ventana_batiente', 'Ventana batiente de aluminio y vidrio', 'm²', 280, 'Acabados e instalaciones'],
];
