// Catálogo de placas de Drywall.
// Los precios arrancan en 0: cada usuario ingresa los de su proveedor.

export interface DrywallItem {
  id: string;
  tipo: string;
  espesor: number; // mm
  precioM2: number; // S/ por m² de placa
  pesoM2: number;   // kg por m² de placa
}

export const DRYWALL_DEFAULTS: DrywallItem[] = [
  { id: 'drywall_standard_125', tipo: 'Drywall Estándar (ST)', espesor: 12.5, precioM2: 0, pesoM2: 8.5 },
  { id: 'drywall_humedad_125', tipo: 'Drywall Resistente a Humedad (RH)', espesor: 12.5, precioM2: 0, pesoM2: 8.8 },
  { id: 'drywall_fuego_159', tipo: 'Drywall Resistente al Fuego (RF)', espesor: 15.9, precioM2: 0, pesoM2: 10.2 },
  { id: 'fibrocemento_8', tipo: 'Placa de Fibrocemento (exterior)', espesor: 8, precioM2: 0, pesoM2: 11.5 },
];
