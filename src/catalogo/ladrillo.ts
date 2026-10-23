// Catálogo de Ladrillos y Bloques para Obra Civil
// Permite al usuario agregar sus propios precios y tipos

export interface LadrilloItem {
  id: string;
  tipo: string;
  dimensiones: string; // ej: "9x12x24 cm"
  precioxMil: number; // Soles por 1000 unidades
  pesoUnitario: number; // kg por unidad
  pesoM2?: number; // kg por m² (aproximado)
  resistencia?: string; // ej: "140 kg/cm²"
  uso?: string; // ej: "Muro estructural", "Tabiquería"
  proveedor?: string;
}

export const LADRILLO_DEFAULTS: LadrilloItem[] = [
  {
    id: 'ladrillo_kingkong_18',
    tipo: 'Ladrillo King Kong 18',
    dimensiones: '9x12x24 cm',
    precioxMil: 0, // Usuario ingresa
    pesoUnitario: 2.7,
    pesoM2: 190,
    resistencia: '140 kg/cm²',
    uso: 'Muro estructural',
    proveedor: 'Fabricantes locales Perú'
  },
  {
    id: 'ladrillo_industrial_14',
    tipo: 'Ladrillo Industrial 14',
    dimensiones: '9x14x24 cm',
    precioxMil: 0,
    pesoUnitario: 3.2,
    pesoM2: 220,
    resistencia: '140 kg/cm²',
    uso: 'Muro estructural',
    proveedor: 'Fabricantes locales Perú'
  },
  {
    id: 'bloque_concreto_12x19',
    tipo: 'Bloque de Concreto 12x19x39',
    dimensiones: '12x19x39 cm',
    precioxMil: 0,
    pesoUnitario: 13.5,
    pesoM2: 280,
    resistencia: '35 kg/cm²',
    uso: 'Muro estructural / Divisiones',
    proveedor: 'Fabricantes locales'
  },
  {
    id: 'bloque_concreto_10x19',
    tipo: 'Bloque de Concreto 10x19x39',
    dimensiones: '10x19x39 cm',
    precioxMil: 0,
    pesoUnitario: 11.0,
    pesoM2: 240,
    resistencia: '25 kg/cm²',
    uso: 'Tabiquería',
    proveedor: 'Fabricantes locales'
  },
  {
    id: 'ladrillo_pandereta',
    tipo: 'Ladrillo Pandereta',
    dimensiones: '12x12x24 cm',
    precioxMil: 0,
    pesoUnitario: 1.8,
    pesoM2: 75,
    resistencia: '70 kg/cm²',
    uso: 'Tabiquería / Divisiones',
    proveedor: 'Fabricantes locales'
  }
];

export function obtenerCostoLadrillo(
  ladrilloId: string,
  cantidadUnidades: number,
  catalogo: LadrilloItem[]
): number {
  const item = catalogo.find(l => l.id === ladrilloId);
  if (!item) return 0;
  return (item.precioxMil / 1000) * cantidadUnidades;
}

export function obtenerPesoLadrillo(
  ladrilloId: string,
  cantidadUnidades: number,
  catalogo: LadrilloItem[]
): number {
  const item = catalogo.find(l => l.id === ladrilloId);
  if (!item) return 0;
  return item.pesoUnitario * cantidadUnidades;
}

export function calcularCantidadPorM2(ladrilloId: string, catalogo: LadrilloItem[]): number {
  const item = catalogo.find(l => l.id === ladrilloId);
  if (!item) return 0;

  // Aproximado: ladrillo king kong 18 = ~50 unidades/m²
  // ladrillo industrial = ~45 unidades/m²
  // bloque concreto = ~12 unidades/m²
  // pandereta = ~55 unidades/m²

  if (item.id.includes('kingkong')) return 50;
  if (item.id.includes('industrial')) return 45;
  if (item.id.includes('concreto')) return 12;
  if (item.id.includes('pandereta')) return 55;
  return 50; // default
}
