// Catálogo de acabados (pintura, pisos y enchapes) con precios de referencia en soles
// (Lima). Cada usuario los cambia en Precios.
//   · Pintura por galón (rinde ~35–40 m² por mano), empaste en bolsa de 25 kg, imprimante.
//   · Cerámicos y porcelanatos por CAJA de cada formato (m² por caja según fábrica).
//   · Pegamento en bolsa de 25 kg, fragua en bolsa de 1 kg, crucetas y niveladores en bolsa de 100.
//   · Mano de obra por m² (o ml) como se cotiza en Perú, o por jornal del pintor / enchapador.

export type TipoBaldosa = 'ceramico' | 'porcelanato';
export interface FormatoBaldosa {
  id: string; tipo: TipoBaldosa; a: number; b: number; // cm (a = ancho, b = largo)
  m2Caja: number; piezasCaja: number; ref: number;     // precio de referencia por caja
  uso: 'piso' | 'pared' | 'ambos';
}
export const FORMATOS: FormatoBaldosa[] = [
  { id: 'cer_30x30', tipo: 'ceramico', a: 30, b: 30, m2Caja: 1.53, piezasCaja: 17, ref: 32, uso: 'piso' },
  { id: 'cer_45x45', tipo: 'ceramico', a: 45, b: 45, m2Caja: 2.03, piezasCaja: 10, ref: 48, uso: 'piso' },
  { id: 'cer_60x60', tipo: 'ceramico', a: 60, b: 60, m2Caja: 1.44, piezasCaja: 4, ref: 42, uso: 'piso' },
  { id: 'cer_25x40', tipo: 'ceramico', a: 25, b: 40, m2Caja: 1.5, piezasCaja: 15, ref: 33, uso: 'pared' },
  { id: 'cer_30x45', tipo: 'ceramico', a: 30, b: 45, m2Caja: 1.62, piezasCaja: 12, ref: 38, uso: 'pared' },
  { id: 'cer_30x60', tipo: 'ceramico', a: 30, b: 60, m2Caja: 1.44, piezasCaja: 8, ref: 42, uso: 'ambos' },
  { id: 'cer_10x30', tipo: 'ceramico', a: 10, b: 30, m2Caja: 1.0, piezasCaja: 33, ref: 45, uso: 'pared' },
  { id: 'por_60x60', tipo: 'porcelanato', a: 60, b: 60, m2Caja: 1.44, piezasCaja: 4, ref: 68, uso: 'ambos' },
  { id: 'por_30x60', tipo: 'porcelanato', a: 30, b: 60, m2Caja: 1.44, piezasCaja: 8, ref: 66, uso: 'ambos' },
  { id: 'por_60x120', tipo: 'porcelanato', a: 60, b: 120, m2Caja: 1.44, piezasCaja: 2, ref: 98, uso: 'ambos' },
  { id: 'por_20x120', tipo: 'porcelanato', a: 20, b: 120, m2Caja: 1.44, piezasCaja: 6, ref: 79, uso: 'piso' },
  { id: 'por_80x80', tipo: 'porcelanato', a: 80, b: 80, m2Caja: 1.28, piezasCaja: 2, ref: 92, uso: 'piso' },
];
export const formato = (id: string) => FORMATOS.find(f => f.id === id) || FORMATOS[1];
export const nombreFormato = (f: FormatoBaldosa) => `${f.tipo === 'porcelanato' ? 'Porcelanato' : 'Cerámico'} ${f.a} × ${f.b} cm`;
export const claveBaldosa = (id: string) => `acab:baldosa:${id}`;
/** Formato grande (≥ 60 cm por lado): pide pegamento de porcelanato y niveladores. */
export const esGrande = (f: FormatoBaldosa) => Math.max(f.a, f.b) >= 60;

export type TipoPintura = 'latex' | 'lavable' | 'satinado';
export const PINTURAS: { id: TipoPintura; nombre: string; corto: string; ref: number }[] = [
  { id: 'latex', nombre: 'Pintura látex para interiores (galón)', corto: 'Látex', ref: 42 },
  { id: 'lavable', nombre: 'Pintura látex lavable premium (galón)', corto: 'Lavable', ref: 62 },
  { id: 'satinado', nombre: 'Pintura satinada / esmalte al agua para baños y cocinas (galón)', corto: 'Satinado', ref: 75 },
];
export const clavePintura = (t: TipoPintura) => `acab:pint:${t}`;

// [clave, nombre, unidad, precio de referencia S/, grupo del catálogo]
export const ACABADOS_ITEMS: [string, string, string, number, string][] = [
  ...PINTURAS.map(p => [clavePintura(p.id), p.nombre, 'galón', p.ref, 'Consumibles y pintura'] as [string, string, string, number, string]),
  ['acab:pint:techo', 'Pintura látex para techos / cielo raso (galón)', 'galón', 36, 'Consumibles y pintura'],
  ['acab:imprimante', 'Imprimante para muros (galón)', 'galón', 25, 'Consumibles y pintura'],
  ['acab:empaste', 'Empaste para interiores (bolsa 25 kg)', 'bolsa', 30, 'Consumibles y pintura'],
  ['acab:lija', 'Lija para pared N.º 100 (pliego)', 'pliego', 1.5, 'Consumibles y pintura'],
  ['acab:masking', 'Cinta masking tape 2" (rollo)', 'rollo', 5, 'Consumibles y pintura'],
  ['acab:rodillo', 'Rodillo 9", bandeja y brocha (juego)', 'juego', 28, 'Consumibles y pintura'],
  ...FORMATOS.map(f => [claveBaldosa(f.id), `${nombreFormato(f)} (caja ${f.m2Caja.toFixed(2)} m²)`, 'caja', f.ref, 'Acabados e instalaciones'] as [string, string, string, number, string]),
  ['acab:laminado', 'Piso laminado 8 mm AC4 (caja 2.22 m²)', 'caja', 88, 'Acabados e instalaciones'],
  ['acab:vinilico', 'Piso vinílico SPC click 4 mm (caja 2.23 m²)', 'caja', 105, 'Acabados e instalaciones'],
  ['acab:espuma', 'Espuma niveladora para laminado 2 mm', 'm²', 3, 'Acabados e instalaciones'],
  ['acab:zocalo_mdf', 'Zócalo MDF / PVC 7 cm × 2.40 m', 'pieza', 14, 'Acabados e instalaciones'],
  ['acab:transicion', 'Perfil de transición / umbral de aluminio 0.90 m', 'pieza', 22, 'Acabados e instalaciones'],
  ['acab:cemento', 'Cemento Portland tipo I (bolsa 42.5 kg)', 'bolsa', 30, 'Acabados e instalaciones'],
  ['acab:arena_fina', 'Arena fina', 'm³', 65, 'Acabados e instalaciones'],
  ['acab:pegamento', 'Pegamento en polvo para cerámico (bolsa 25 kg)', 'bolsa', 22, 'Acabados e instalaciones'],
  ['acab:pegamento_porc', 'Pegamento para porcelanato y formato grande (bolsa 25 kg)', 'bolsa', 38, 'Acabados e instalaciones'],
  ['acab:fragua', 'Fragua / porcelana para juntas (bolsa 1 kg)', 'bolsa', 6, 'Acabados e instalaciones'],
  ['acab:crucetas', 'Crucetas de plástico (bolsa 100 und)', 'bolsa', 4, 'Acabados e instalaciones'],
  ['acab:nivelador_clip', 'Niveladores de cerámica: clips (bolsa 100 und)', 'bolsa', 18, 'Acabados e instalaciones'],
  ['acab:nivelador_cuna', 'Niveladores de cerámica: cuñas reutilizables (bolsa 100 und)', 'bolsa', 25, 'Acabados e instalaciones'],
  ['acab:perfil', 'Perfil / esquinero de aluminio para cerámico × 2.50 m', 'pieza', 12, 'Acabados e instalaciones'],
  // Mano de obra por m² (lo usual en Lima).
  ['acab:mo:empaste', 'Empastado y lijado de muros y techos (mano de obra)', 'm²', 6.5, 'Acabados e instalaciones'],
  ['acab:mo:pintura', 'Imprimado y pintado de muros (mano de obra)', 'm²', 6, 'Acabados e instalaciones'],
  ['acab:mo:pintura_techo', 'Pintado de techos (mano de obra)', 'm²', 7, 'Acabados e instalaciones'],
  ['acab:mo:piso_ceramico', 'Asentado de piso cerámico con fragua (mano de obra)', 'm²', 22, 'Acabados e instalaciones'],
  ['acab:mo:piso_porcelanato', 'Asentado de porcelanato con niveladores (mano de obra)', 'm²', 30, 'Acabados e instalaciones'],
  ['acab:mo:enchape', 'Enchape de pared (cerámico / porcelanato) (mano de obra)', 'm²', 28, 'Acabados e instalaciones'],
  ['acab:mo:laminado', 'Instalación de piso laminado (mano de obra)', 'm²', 12, 'Acabados e instalaciones'],
  ['acab:mo:vinilico', 'Instalación de piso vinílico (mano de obra)', 'm²', 12, 'Acabados e instalaciones'],
  ['acab:mo:pulido', 'Piso de cemento pulido y bruñado (mano de obra)', 'm²', 22, 'Acabados e instalaciones'],
  ['acab:mo:contrazocalo', 'Contrazócalo asentado o instalado (mano de obra)', 'ml', 6, 'Acabados e instalaciones'],
];

// Colores de pintura más pedidos en Lima (nombres de carta usuales).
export const COLORES_PARED: { hex: string; nombre: string }[] = [
  { hex: '#ffffff', nombre: 'Blanco' }, { hex: '#f4efe6', nombre: 'Blanco hueso' }, { hex: '#f3e7cf', nombre: 'Marfil' },
  { hex: '#f1e1b8', nombre: 'Crema' }, { hex: '#e6d3b3', nombre: 'Arena' }, { hex: '#efd3b0', nombre: 'Durazno' },
  { hex: '#f4c9a0', nombre: 'Melón' }, { hex: '#efb9a3', nombre: 'Salmón' }, { hex: '#f6e08a', nombre: 'Amarillo maíz' },
  { hex: '#cfe3f2', nombre: 'Celeste cielo' }, { hex: '#cfe9df', nombre: 'Verde agua' }, { hex: '#c9d8b6', nombre: 'Verde olivo claro' },
  { hex: '#ddd2e8', nombre: 'Lila' }, { hex: '#d8d9d6', nombre: 'Gris perla' }, { hex: '#a7a9a6', nombre: 'Gris humo' },
  { hex: '#c97c5d', nombre: 'Terracota' }, { hex: '#5f7d95', nombre: 'Azul acero' }, { hex: '#3e4a52', nombre: 'Gris grafito' },
];
// Tonos de cerámico / porcelanato.
export const COLORES_BALDOSA: { hex: string; nombre: string }[] = [
  { hex: '#f7f7f5', nombre: 'Blanco brillante' }, { hex: '#ece6da', nombre: 'Hueso' }, { hex: '#e3dccf', nombre: 'Beige mármol' },
  { hex: '#d6d4cf', nombre: 'Gris claro' }, { hex: '#a9a7a2', nombre: 'Gris cemento' }, { hex: '#6b6a67', nombre: 'Gris oscuro' },
  { hex: '#2f3033', nombre: 'Negro' }, { hex: '#c7a27a', nombre: 'Madera miel' }, { hex: '#8a6446', nombre: 'Madera nogal' },
  { hex: '#b7c6c2', nombre: 'Verde salvia' }, { hex: '#3f6170', nombre: 'Azul petróleo' }, { hex: '#c07a55', nombre: 'Terracota' },
];
export const COLORES_FRAGUA: { hex: string; nombre: string }[] = [
  { hex: '#f4f4f2', nombre: 'Blanca' }, { hex: '#d9d3c6', nombre: 'Hueso' }, { hex: '#a3a3a0', nombre: 'Gris' },
  { hex: '#58585a', nombre: 'Grafito' }, { hex: '#2b2b2c', nombre: 'Negra' }, { hex: '#9a7b5f', nombre: 'Café' },
];
export const nombreColor = (lista: { hex: string; nombre: string }[], hex: string) => lista.find(c => c.hex.toLowerCase() === (hex || '').toLowerCase())?.nombre || hex;
