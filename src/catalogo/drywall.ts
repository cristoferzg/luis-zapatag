// Catálogo de Drywall y Sistemas de Cielo Raso
// Permite al usuario agregar sus propios precios y tipos

export interface DryallItem {
  id: string;
  tipo: string;
  espesor: number; // milímetros
  precioM2: number; // Soles por m²
  pesoM2: number; // kg por m²
  resistenciaFuego?: boolean;
  resistenciaHumedad?: boolean;
  proveedor?: string;
}

export const DRYWALL_DEFAULTS: DryallItem[] = [
  {
    id: 'drywall_standard_125',
    tipo: 'Drywall Standard',
    espesor: 12.5,
    precioM2: 0, // Usuario ingresa
    pesoM2: 8.5,
    resistenciaFuego: false,
    resistenciaHumedad: false,
    proveedor: 'Knauf / Volcán / Durlock'
  },
  {
    id: 'drywall_humedad_125',
    tipo: 'Drywall Resistente Humedad (Verde)',
    espesor: 12.5,
    precioM2: 0,
    pesoM2: 8.8,
    resistenciaFuego: false,
    resistenciaHumedad: true,
    proveedor: 'Knauf / Volcán'
  },
  {
    id: 'drywall_fuego_15',
    tipo: 'Drywall Resistente Fuego (Rosa)',
    espesor: 15,
    precioM2: 0,
    pesoM2: 10.2,
    resistenciaFuego: true,
    resistenciaHumedad: false,
    proveedor: 'Knauf / Volcán'
  },
  {
    id: 'drywall_acustico_125',
    tipo: 'Drywall Acústico',
    espesor: 12.5,
    precioM2: 0,
    pesoM2: 6.5,
    resistenciaFuego: false,
    resistenciaHumedad: false,
    proveedor: 'Knauf / Volcán'
  }
];

export function obtenerCostoDrywall(drywallId: string, areaM2: number, catalogo: DryallItem[]): number {
  const item = catalogo.find(d => d.id === drywallId);
  if (!item) return 0;
  return item.precioM2 * areaM2;
}

export function obtenerPesoDrywall(drywallId: string, areaM2: number, catalogo: DryallItem[]): number {
  const item = catalogo.find(d => d.id === drywallId);
  if (!item) return 0;
  return item.pesoM2 * areaM2;
}
