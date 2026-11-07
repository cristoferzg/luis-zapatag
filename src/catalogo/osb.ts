// Catálogo de placas OSB. Precio de referencia (Lima 2026) por plancha 1.22 × 2.44 m, guardado por m².
// Cada usuario lo cambia en Precios.
const PLANCHA_M2 = 1.22 * 2.44;

export interface OsbItem {
  id: string;
  tipo: string;
  espesor: number; // mm
  precioM2: number; // S/ por m² de placa
  pesoM2: number;   // kg por m²
}

export const OSB_DEFAULTS: OsbItem[] = [
  { id: 'osb_9', tipo: 'OSB 9 mm', espesor: 9, precioM2: 48 / PLANCHA_M2, pesoM2: 5.8 },
  { id: 'osb_11', tipo: 'OSB 11.1 mm', espesor: 11.1, precioM2: 56 / PLANCHA_M2, pesoM2: 7.0 },
  { id: 'osb_15', tipo: 'OSB 15 mm', espesor: 15, precioM2: 76 / PLANCHA_M2, pesoM2: 9.5 },
  { id: 'osb_18', tipo: 'OSB 18 mm (entrepiso)', espesor: 18, precioM2: 92 / PLANCHA_M2, pesoM2: 11.4 },
];
