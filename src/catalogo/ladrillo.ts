// Catálogo de Ladrillos y Bloques para Obra Civil.
// Los precios arrancan en 0: cada usuario ingresa los de su proveedor.

export interface LadrilloItem {
  id: string;
  tipo: string;
  dimensiones: string;
  precioxMil: number;   // S/ por 1000 unidades
  pesoUnitario: number; // kg por unidad
  unidadesM2: number;   // unidades por m² de muro (asentado de soga), editable
  uso?: string;
}

export const LADRILLO_DEFAULTS: LadrilloItem[] = [
  { id: 'ladrillo_kingkong_18', tipo: 'Ladrillo King Kong 18 huecos', dimensiones: '9x13x24 cm', precioxMil: 0, pesoUnitario: 2.7, unidadesM2: 39, uso: 'Muro portante' },
  { id: 'ladrillo_industrial', tipo: 'Ladrillo King Kong Industrial', dimensiones: '9x13x24 cm', precioxMil: 0, pesoUnitario: 3.2, unidadesM2: 39, uso: 'Muro portante' },
  { id: 'ladrillo_pandereta', tipo: 'Ladrillo Pandereta', dimensiones: '9x12x23 cm', precioxMil: 0, pesoUnitario: 1.8, unidadesM2: 36, uso: 'Tabiquería / sobrepecho' },
  { id: 'bloque_concreto_12', tipo: 'Bloque de concreto 12', dimensiones: '12x19x39 cm', precioxMil: 0, pesoUnitario: 13.5, unidadesM2: 12.5, uso: 'Muro / cerco' },
  { id: 'bloque_concreto_10', tipo: 'Bloque de concreto 10', dimensiones: '10x19x39 cm', precioxMil: 0, pesoUnitario: 11.0, unidadesM2: 12.5, uso: 'Tabiquería' },
];
