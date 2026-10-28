// =============================================================================
// Catálogo único de precios de Innova Contratistas.
//
// Un precio por producto, en su UNIDAD DE COMPRA (barra de 6 m, plancha,
// millar, bolsa, jornal por día…), compartido por Techos Metálicos, CarpiMetal,
// Obra Civil y Drywall: si cambias un precio en cualquier apartado, cambia en
// todos. Un mismo tubo (misma sección y espesor) es UN solo producto aunque
// aparezca en Techos y en CarpiMetal.
//
// Se guarda en el dispositivo y, si hay sesión, en el documento de
// configuración del usuario (sincronizado en la nube por App).
// =============================================================================
import { useSyncExternalStore } from 'react';
import { safeStorage } from './storageManager';
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS, PLACA_BASE_ESTANDAR, PERNO_ANCLAJE_J, PERNO_EPDM_ESTANDAR, SOLDADURA_AWS_E6011 } from '../components/techos/techosCadCatalog';
import { PERFILES_CATALOGO, ACCESORIOS_CATALOGO } from '../components/herreria/herreriaCatalog';
import { DRYWALL_DEFAULTS } from '../catalogo/drywall';
import { LADRILLO_DEFAULTS } from '../catalogo/ladrillo';
import { OSB_DEFAULTS } from '../catalogo/osb';

export const AREA_PLANCHA_M2 = 1.22 * 2.44; // plancha estándar de drywall / OSB

export type GrupoCatalogo =
  | 'Perfiles de acero' | 'Coberturas' | 'Accesorios de techos' | 'Accesorios de CarpiMetal' | 'Planchas, vidrio y malla'
  | 'Consumibles y pintura' | 'Concreto y agregados' | 'Ladrillos' | 'Drywall y OSB' | 'Accesorios de drywall' | 'Acabados e instalaciones' | 'Mano de obra (jornal por día)' | 'Mis materiales';

export interface ItemCatalogo {
  clave: string;
  grupo: GrupoCatalogo;
  nombre: string;
  unidad: string;       // unidad de compra
  ref: number;          // precio de referencia (se usa si no pones el tuyo)
  usadoEn: string[];    // apartados que lo usan
  alias?: string[];     // nombres con que aparece en cada apartado (para buscar)
}

const NOMBRE_TIPO: Record<string, string> = {
  tubo_cuadrado: 'Tubo cuadrado', tubo_rectangular: 'Tubo rectangular', tubo_redondo: 'Tubo redondo', perfil_c: 'Perfil C',
  perfil_z: 'Perfil Z', perfil_h_ipe: 'Viga H / IPE', angulo: 'Ángulo', platina: 'Platina', barra_cuadrada: 'Barra cuadrada', barra_redonda: 'Barra redonda',
};
function nombrePerfil(p: { categoria: string; anchoMm: number; altoMm: number; espesorMm: number; nombre?: string; normaAcabado?: string }) {
  const c = catPerfil(p.categoria);
  const a = Math.max(p.anchoMm, p.altoMm || p.anchoMm), b = Math.min(p.anchoMm, p.altoMm || p.anchoMm);
  const med = c === 'tubo_redondo' || c === 'barra_redonda' ? `Ø ${norm(a)}` : `${norm(a)} × ${norm(b)}`;
  const galv = p.normaAcabado === 'GALVANIZADO' || /galvaniz/i.test(p.nombre || '');
  return `${NOMBRE_TIPO[c] || p.categoria} ${med} × ${norm(p.espesorMm)} mm${galv ? ' galvanizado' : ''}`;
}

// ---- Claves -----------------------------------------------------------------
const norm = (n: number) => String(Math.round(n * 100) / 100);
function catPerfil(c: string) {
  if (c === 'angulo_estructural') return 'angulo';
  if (c === 'barra_redonda') return 'barra_redonda';
  return c;
}
export function clavePerfil(categoria: string, anchoMm: number, altoMm: number, espesorMm: number) {
  const c = catPerfil(categoria);
  const a = Math.max(anchoMm, altoMm || anchoMm), b = Math.min(anchoMm, altoMm || anchoMm);
  return `perfil:${c}:${norm(a)}x${norm(b)}x${norm(espesorMm)}`;
}
// Clave a partir del perfil (galvanizado ≠ negro aunque tengan la misma medida).
export function clavePerfilDe(p: { categoria: string; anchoMm: number; altoMm: number; espesorMm: number; nombre?: string; normaAcabado?: string }) {
  const galv = p.normaAcabado === 'GALVANIZADO' || /galvaniz/i.test(p.nombre || '');
  return clavePerfil(p.categoria, p.anchoMm, p.altoMm, p.espesorMm) + (galv ? ':galv' : '');
}
export const claveCobertura = (id: string) => `cobertura:${id}`;
export const claveDrywall = (id: string) => `drywall:${id}`;
export const claveOsb = (id: string) => `osb:${id}`;
export const claveLadrillo = (id: string) => `ladrillo:${id}`;
export const claveAccesorioCarpi = (id: string) => `carpi:${id}`;
export const claveJornal = (cargo: string) => `jornal:${cargo.toLowerCase().trim()}`;

// ---- Ítems (armados desde los catálogos técnicos de cada apartado) -----------
function construirItems(): ItemCatalogo[] {
  const items = new Map<string, ItemCatalogo>();
  const add = (it: ItemCatalogo) => {
    const prev = items.get(it.clave);
    if (prev) {
      it.usadoEn.forEach(u => { if (!prev.usadoEn.includes(u)) prev.usadoEn.push(u); });
      (it.alias || []).forEach(a => { if (!(prev.alias ||= []).includes(a)) prev.alias.push(a); });
      return;
    }
    items.set(it.clave, it);
  };
  // Perfiles: CarpiMetal ya está por barra de 6 m; Techos por metro → ×6.
  PERFILES_CATALOGO.forEach(p => {
    if (['cobertura', 'aluminio_serie', 'especial'].includes(p.categoria)) {
      add({ clave: `carpiperfil:${p.id}`, grupo: 'Perfiles de acero', nombre: p.nombre, unidad: 'barra 6 m', ref: p.precioPorBarra6m, usadoEn: ['CarpiMetal'] });
      return;
    }
    add({ clave: clavePerfilDe(p), grupo: 'Perfiles de acero', nombre: nombrePerfil(p), unidad: 'barra 6 m', ref: p.precioPorBarra6m, usadoEn: ['CarpiMetal'], alias: [p.nombre] });
  });
  INVENTARIO_PERFILES_TUBULARES.forEach(p => {
    const largo = p.longitudComercialM || 6;
    add({ clave: clavePerfilDe(p), grupo: 'Perfiles de acero', nombre: nombrePerfil(p), alias: [p.nombre], unidad: `barra ${norm(largo)} m`, ref: Math.round(p.costoMetroSol * largo * 100) / 100, usadoEn: ['Techos'] });
  });
  INVENTARIO_COBERTURAS.forEach(c => add({ clave: claveCobertura(c.id), grupo: 'Coberturas', nombre: c.nombre, unidad: 'm²', ref: c.costoM2Sol, usadoEn: ['Techos'] }));
  // Tensores (varilla lisa / cable de acero) y sus accesorios.
  ([
    ['tensor:varilla_12', 'Varilla lisa Ø 1/2" (tensor)', 'barra 6 m'], ['tensor:varilla_58', 'Varilla lisa Ø 5/8" (tensor)', 'barra 6 m'], ['tensor:varilla_34', 'Varilla lisa Ø 3/4" (tensor)', 'barra 6 m'],
    ['tensor:cable_14', 'Cable de acero Ø 1/4"', 'm'], ['tensor:cable_38', 'Cable de acero Ø 3/8"', 'm'], ['tensor:cable_12', 'Cable de acero Ø 1/2"', 'm'],
    ['tensor:templador_12', 'Templador (tensor) Ø 1/2"', 'unidad'], ['tensor:templador_58', 'Templador (tensor) Ø 5/8"', 'unidad'], ['tensor:templador_34', 'Templador (tensor) Ø 3/4"', 'unidad'],
    ['tensor:tuerca', 'Tuerca + arandela para tensor', 'unidad'], ['tensor:grapa', 'Grapa para cable', 'unidad'], ['tensor:guardacabo', 'Guardacabo para cable', 'unidad'],
  ] as [string, string, string][]).forEach(([clave, nombre, unidad]) => add({ clave, grupo: 'Accesorios de techos', nombre, unidad, ref: 0, usadoEn: ['Techos'] }));
  // Techo movible (corredizo, plegable o de lamas): rieles, ruedas, motor…
  ([
    ['movil:riel', 'Riel guía para techo corredizo / plegable', 'm'], ['movil:rueda', 'Rueda (garrucha) con rodaje para riel', 'unidad'],
    ['movil:tope', 'Tope y seguro de riel', 'unidad'], ['movil:bisagra', 'Bisagra pesada para paño plegable', 'unidad'],
    ['movil:sello', 'Empaque / sello entre paños', 'm'], ['movil:eje_lama', 'Eje pivote para lama (con buje)', 'unidad'],
    ['movil:barra_mando', 'Barra de mando de lamas', 'm'], ['movil:canaleta', 'Canaleta lateral para lamas', 'm'],
    ['movil:motor', 'Motor para techo movible (con reductor)', 'unidad'], ['movil:control', 'Control remoto + sensor de lluvia', 'unidad'],
    ['movil:cremallera', 'Cremallera / cadena de arrastre', 'm'], ['movil:manivela', 'Manivela con caja reductora', 'unidad'],
  ] as [string, string, string][]).forEach(([clave, nombre, unidad]) => add({ clave, grupo: 'Accesorios de techos', nombre, unidad, ref: 0, usadoEn: ['Techos'] }));
  // Canaletas y bajadas de agua
  ([
    ['agua:canaleta_galv', 'Canaleta galvanizada', 'm'], ['agua:canaleta_pvc', 'Canaleta de PVC', 'm'],
    ['agua:bajada_galv', 'Bajada (tubo) galvanizada', 'm'], ['agua:bajada_pvc', 'Bajada (tubo) de PVC 3"', 'm'],
    ['agua:soporte', 'Soporte de canaleta', 'unidad'], ['agua:tapa', 'Tapa de canaleta', 'unidad'], ['agua:embudo', 'Embudo / salida de canaleta', 'unidad'],
    ['agua:abrazadera', 'Abrazadera para bajada', 'unidad'], ['agua:codo', 'Codo para bajada', 'unidad'],
  ] as [string, string, string][]).forEach(([clave, nombre, unidad]) => add({ clave, grupo: 'Accesorios de techos', nombre, unidad, ref: 0, usadoEn: ['Techos'] }));
  // Obra Civil: acabados por ambiente, instalaciones y ladrillo de techo
  ([
    ['acab:piso_ceramico', 'Piso cerámico (instalado)', 'm²'], ['acab:piso_porcelanato', 'Piso porcelanato (instalado)', 'm²'],
    ['acab:piso_pulido', 'Piso de cemento pulido', 'm²'], ['acab:piso_laminado', 'Piso laminado (instalado)', 'm²'], ['acab:piso_vinilico', 'Piso vinílico (instalado)', 'm²'],
    ['acab:pintura', 'Pintura de muros (2 manos)', 'm²'], ['acab:zocalo', 'Zócalo', 'm'],
    ['inst:punto_luz', 'Punto de luz', 'punto'], ['inst:tomacorriente', 'Tomacorriente', 'punto'], ['inst:interruptor', 'Interruptor', 'punto'],
    ['inst:punto_agua', 'Salida de agua fría', 'punto'], ['inst:punto_desague', 'Salida de desagüe', 'punto'], ['inst:sumidero', 'Sumidero', 'unidad'],
  ] as [string, string, string][]).forEach(([clave, nombre, unidad]) => add({ clave, grupo: 'Acabados e instalaciones', nombre, unidad, ref: 0, usadoEn: ['Obra Civil'] }));
  ([
    ['obra:ladrillo_techo_12', 'Ladrillo de techo 12 (losa 17 cm)', 'unidad'], ['obra:ladrillo_techo_15', 'Ladrillo de techo 15 (losa 20 cm)', 'unidad'], ['obra:ladrillo_techo_20', 'Ladrillo de techo 20 (losa 25 cm)', 'unidad'],
  ] as [string, string, string][]).forEach(([clave, nombre, unidad]) => add({ clave, grupo: 'Ladrillos', nombre, unidad, ref: 0, usadoEn: ['Obra Civil'] }));
  add({ clave: 'techos:placa_base', grupo: 'Accesorios de techos', nombre: PLACA_BASE_ESTANDAR.nombre, unidad: 'unidad', ref: PLACA_BASE_ESTANDAR.costoUnidadSol, usadoEn: ['Techos'] });
  add({ clave: 'techos:perno_anclaje', grupo: 'Accesorios de techos', nombre: PERNO_ANCLAJE_J.nombre, unidad: 'caja ×100', ref: PERNO_ANCLAJE_J.costoCaja100Sol, usadoEn: ['Techos'] });
  add({ clave: 'techos:perno_epdm', grupo: 'Accesorios de techos', nombre: PERNO_EPDM_ESTANDAR.nombre, unidad: 'caja ×100', ref: PERNO_EPDM_ESTANDAR.costoCaja100Sol, usadoEn: ['Techos'] });
  add({ clave: 'soldadura:kg', grupo: 'Consumibles y pintura', nombre: 'Soldadura (electrodos E6011 / E7018)', unidad: 'kg', ref: SOLDADURA_AWS_E6011.costoKgSol || 22, usadoEn: ['Techos', 'CarpiMetal'] });
  // Accesorios que se colocan en el plano de CarpiMetal (por tipo).
  ([
    ['bisagra_soldable', 'Bisagra tubular 5/8" × 3" soldable', 10.5], ['bisagra_reforzada', 'Bisagra capuchina 3 1/2"', 14],
    ['chapa_sobreponer', 'Cerradura de sobreponer 3 golpes', 85], ['cerradura_embutir', 'Cerradura de embutir', 75],
    ['cerrojo_pasador', 'Pasador de piso y techo 50 cm', 24], ['manija_tirador', 'Tirador tubular inox 40 cm', 45],
    ['rueda_porton', 'Rueda de acero 3" canal U', 32], ['placa_base', 'Placa base de anclaje 150 × 150 × 6 mm', 28],
  ] as [string, string, number][]).forEach(([t, nombre, ref]) => add({ clave: `carpicad:${t}`, grupo: 'Accesorios de CarpiMetal', nombre, unidad: 'unidad', ref, usadoEn: ['CarpiMetal'] }));
  ACCESORIOS_CATALOGO.forEach(a => add({ clave: claveAccesorioCarpi(a.id), grupo: 'Accesorios de CarpiMetal', nombre: a.nombre, unidad: a.unidad || 'und', ref: a.precioUnitario, usadoEn: ['CarpiMetal'] }));
  ([
    ['carpi:plancha_acanalada', 'Plancha acanalada LAC 1.2 mm (1.00 × 2.40 m)', 'plancha', 128],
    ['carpi:plancha_lisa', 'Plancha LAC 1/16" (1.20 × 2.40 m)', 'plancha', 135],
    ['carpi:malla', 'Malla electrosoldada galvanizada 50×50×3 mm', 'm²', 45],
    ['carpi:vidrio', 'Vidrio templado incoloro 6 mm', 'm²', 110],
  ] as [string, string, string, number][]).forEach(([clave, nombre, unidad, ref]) => add({ clave, grupo: 'Planchas, vidrio y malla', nombre, unidad, ref, usadoEn: ['CarpiMetal'] }));
  ([
    ['carpi:perno_expansion', 'Perno de expansión 3/8" × 3 1/2" + arandela', 'juego', 4.5],
    ['carpi:disco_corte', 'Disco de corte extra fino 4 1/2"', 'unidad', 5.5],
    ['carpi:disco_desbaste', 'Disco de desbaste / flap 4 1/2"', 'unidad', 8.5],
    ['pintura:anticorrosiva', 'Pintura anticorrosiva + esmalte', 'galón', 65],
    ['pintura:thinner', 'Thinner acrílico', 'galón', 25],
  ] as [string, string, string, number][]).forEach(([clave, nombre, unidad, ref]) => add({ clave, grupo: 'Consumibles y pintura', nombre, unidad, ref, usadoEn: ['CarpiMetal'] }));
  ([
    ['concreto:cemento', 'Cemento Portland tipo I (42.5 kg)', 'bolsa', 28],
    ['concreto:arena', 'Arena gruesa', 'm³', 55],
    ['concreto:piedra', 'Piedra chancada 1/2"', 'm³', 60],
    ['concreto:acero', 'Acero corrugado (fierro)', 'kg', 4.2],
    ['concreto:encofrado', 'Encofrado y desencofrado', 'm²', 25],
  ] as [string, string, string, number][]).forEach(([clave, nombre, unidad, ref]) => add({ clave, grupo: 'Concreto y agregados', nombre, unidad, ref, usadoEn: ['Obra Civil'] }));
  LADRILLO_DEFAULTS.forEach(l => add({ clave: claveLadrillo(l.id), grupo: 'Ladrillos', nombre: l.tipo, unidad: 'millar', ref: l.precioxMil || 0, usadoEn: ['Obra Civil'] }));
  DRYWALL_DEFAULTS.forEach(d => add({ clave: claveDrywall(d.id), grupo: 'Drywall y OSB', nombre: `${d.tipo} ${d.espesor} mm`, unidad: 'plancha 1.22 × 2.44', ref: Math.round((d.precioM2 || 0) * AREA_PLANCHA_M2 * 100) / 100, usadoEn: ['Obra Civil', 'Drywall'] }));
  OSB_DEFAULTS.forEach(o => add({ clave: claveOsb(o.id), grupo: 'Drywall y OSB', nombre: o.tipo, unidad: 'plancha 1.22 × 2.44', ref: Math.round((o.precioM2 || 0) * AREA_PLANCHA_M2 * 100) / 100, usadoEn: ['Obra Civil', 'Drywall'] }));
  ([
    ['dw:parante_64', 'Parante 64 mm (0.45 mm) × 3 m', 'pieza'], ['dw:parante_89', 'Parante 89 mm (0.45 mm) × 3 m', 'pieza'],
    ['dw:riel_65', 'Riel 65 mm × 3 m', 'pieza'], ['dw:riel_90', 'Riel 90 mm × 3 m', 'pieza'],
    ['dw:omega', 'Omega / vigueta para cielo raso × 3 m', 'pieza'], ['dw:angulo', 'Ángulo perimetral × 3 m', 'pieza'],
    ['dw:esquinero', 'Esquinero metálico × 3 m', 'pieza'], ['dw:colgador', 'Colgador / alambre N.º 16 para cielo', 'unidad'],
    ['dw:tornillo_placa', 'Tornillo punta fina 6 × 1" (placa)', 'ciento'], ['dw:tornillo_perfil', 'Tornillo wafer 8 × 1/2" (perfil)', 'ciento'],
    ['dw:fijacion', 'Clavo de fijación / tarugo para riel', 'ciento'], ['dw:masilla', 'Masilla lista (balde 28 kg)', 'balde'],
    ['dw:cinta', 'Cinta de papel para juntas (rollo 75 m)', 'rollo'],
    ['dw:lana', 'Lana de vidrio 2" (aislante acústico)', 'm²'], ['dw:baldosa_6060', 'Baldosa de cielo raso 0.61 × 0.61', 'unidad'],
    ['dw:t_principal', 'Perfil T principal × 3.66 m', 'pieza'], ['dw:t_sec_122', 'Perfil T secundario × 1.22 m', 'pieza'],
    ['dw:t_sec_061', 'Perfil T secundario × 0.61 m', 'pieza'], ['dw:cinta_led', 'Cinta LED (rollo 5 m)', 'rollo'],
  ] as [string, string, string][]).forEach(([clave, nombre, unidad]) => add({ clave, grupo: 'Accesorios de drywall', nombre, unidad, ref: 0, usadoEn: ['Drywall', 'Obra Civil'] }));
  ['Ingeniero residente', 'Maestro de obra', 'Soldador homologado', 'Armador / montajista', 'Operario', 'Oficial', 'Ayudante', 'Instalador de drywall', 'Albañil']
    .forEach(c => add({ clave: claveJornal(c), grupo: 'Mano de obra (jornal por día)', nombre: c, unidad: 'día', ref: 0, usadoEn: ['Techos', 'CarpiMetal', 'Obra Civil', 'Drywall'] }));
  return [...items.values()];
}

let cacheItems: ItemCatalogo[] | null = null;
let cacheTodos: { base: ItemCatalogo[]; propios?: ItemCatalogo[]; lista: ItemCatalogo[] } | null = null;
export const itemsCatalogo = () => {
  const base = (cacheItems ||= construirItems());
  if (!cacheTodos || cacheTodos.base !== base || cacheTodos.propios !== estado.propios || cacheTodos.lista.length !== base.length + (estado.propios?.length || 0)) {
    cacheTodos = { base, propios: estado.propios, lista: [...(estado.propios || []), ...base] };
  }
  return cacheTodos.lista;
};
let mapa: { lista: ItemCatalogo[]; m: Map<string, ItemCatalogo> } | null = null;
export const itemCatalogo = (clave: string) => {
  const lista = itemsCatalogo();
  if (!mapa || mapa.lista !== lista) mapa = { lista, m: new Map(lista.map(i => [i.clave, i])) };
  return mapa.m.get(clave);
};

// ---- Estado: precios del usuario -------------------------------------------
// planchas: coberturas que compras POR PLANCHA → largo de la plancha (m). Sin
// entrada, la cobertura se compra por m². El precio se guarda siempre por m².
// propios: materiales que agrega el usuario (clave 'propio:…').
export interface EstadoCatalogo { precios: Record<string, number>; fechas: Record<string, string>; actualizado: number; planchas?: Record<string, number>; propios?: ItemCatalogo[] }
const KEY = 'innova_catalogo_precios';
let estado: EstadoCatalogo = safeStorage.getItem<EstadoCatalogo>(KEY, { precios: {}, fechas: {}, actualizado: 0 }) || { precios: {}, fechas: {}, actualizado: 0 };
const oyentes = new Set<() => void>();
const emitir = () => { safeStorage.setItem(KEY, estado); oyentes.forEach(f => f()); };

export const leerCatalogo = () => estado;
export function useCatalogo() {
  return useSyncExternalStore(f => { oyentes.add(f); return () => oyentes.delete(f); }, () => estado);
}
// Precio vigente: el del usuario o, si no puso uno, el de referencia.
export function precio(clave: string, defecto = 0): number {
  const v = estado.precios[clave];
  if (v !== undefined) return v;
  return itemCatalogo(clave)?.ref ?? defecto;
}
export const tienePrecioPropio = (clave: string) => estado.precios[clave] !== undefined;
export function fijarPrecio(clave: string, valor: number, fuente = 'manual') {
  estado = { ...estado, precios: { ...estado.precios, [clave]: Math.max(0, valor) }, fechas: { ...estado.fechas, [clave]: `${new Date().toISOString().slice(0, 10)} · ${fuente}` }, actualizado: Date.now() };
  emitir();
}
export function quitarPrecio(clave: string) {
  const precios = { ...estado.precios }; delete precios[clave];
  const fechas = { ...estado.fechas }; delete fechas[clave];
  estado = { ...estado, precios, fechas, actualizado: Date.now() };
  emitir();
}
// Llega desde la nube (configuración del usuario): gana el más reciente.
export function hidratarCatalogo(remoto?: EstadoCatalogo | null) {
  if (!remoto || !remoto.precios || (remoto.actualizado || 0) <= estado.actualizado) return;
  estado = { precios: { ...remoto.precios }, fechas: { ...(remoto.fechas || {}) }, actualizado: remoto.actualizado, planchas: { ...(remoto.planchas || {}) }, propios: [...(remoto.propios || [])] };
  emitir();
}

// ---- Materiales propios del usuario -----------------------------------------
export function agregarPropio(it: { nombre: string; grupo: GrupoCatalogo | string; unidad: string; precio: number; usadoEn: string[] }) {
  const clave = `propio:${Date.now().toString(36)}`;
  const nuevo: ItemCatalogo = { clave, grupo: it.grupo as GrupoCatalogo, nombre: it.nombre.trim(), unidad: it.unidad.trim() || 'unidad', ref: 0, usadoEn: it.usadoEn.length ? it.usadoEn : ['Mis materiales'] };
  estado = { ...estado, propios: [...(estado.propios || []), nuevo], precios: { ...estado.precios, [clave]: Math.max(0, it.precio) },
    fechas: { ...estado.fechas, [clave]: `${new Date().toISOString().slice(0, 10)} · propio` }, actualizado: Date.now() };
  emitir();
  return clave;
}
export function quitarPropio(clave: string) {
  const precios = { ...estado.precios }; delete precios[clave];
  estado = { ...estado, propios: (estado.propios || []).filter(p => p.clave !== clave), precios, actualizado: Date.now() };
  emitir();
}
export const esPropio = (clave: string) => clave.startsWith('propio:');

// ---- Coberturas: por m² o por plancha ----------------------------------------
const coberturaDe = (clave: string) => INVENTARIO_COBERTURAS.find(c => claveCobertura(c.id) === clave);
/** Largo de plancha (m) si esta cobertura se compra por plancha; si no, undefined. */
export const largoPlanchaCompra = (clave: string): number | undefined => estado.planchas?.[clave];
/** m² que trae una plancha (ancho total × largo). */
export function m2PorPlancha(clave: string, largoM = largoPlanchaCompra(clave)): number {
  const c = coberturaDe(clave);
  return c && largoM ? (c.anchoTotalMm / 1000) * largoM : 0;
}
/** Cambia cómo se compra la cobertura. El precio se guarda por m² y se convierte para mostrarlo. */
export function fijarCompraCobertura(clave: string, largoM: number | null) {
  const planchas = { ...(estado.planchas || {}) };
  if (largoM && largoM > 0) planchas[clave] = Math.round(largoM * 100) / 100; else delete planchas[clave];
  estado = { ...estado, planchas, actualizado: Date.now() };
  emitir();
}
export const esCobertura = (clave: string) => clave.startsWith('cobertura:');
/** Unidad y precio tal como el usuario compra (plancha o m²). */
export function unidadCompra(clave: string, unidadBase: string): string {
  const L = largoPlanchaCompra(clave);
  const c = coberturaDe(clave);
  return L && c ? `plancha ${(c.anchoTotalMm / 1000).toFixed(2)} × ${L.toFixed(2)} m` : unidadBase;
}
export const precioEnUnidad = (clave: string) => { const k = m2PorPlancha(clave); return k ? precio(clave) * k : precio(clave); };
export const fijarPrecioEnUnidad = (clave: string, valor: number, fuente = 'manual') => { const k = m2PorPlancha(clave); fijarPrecio(clave, k ? valor / k : valor, fuente); };
export const refEnUnidad = (clave: string, ref: number) => { const k = m2PorPlancha(clave); return k ? ref * k : ref; };

// ---- Atajos por apartado ----------------------------------------------------
export function precioBarraPerfil(p: { categoria: string; anchoMm: number; altoMm: number; espesorMm: number; id?: string; nombre?: string; normaAcabado?: string }, refBarra: number) {
  const k = ['cobertura', 'aluminio_serie', 'especial'].includes(p.categoria) && p.id ? `carpiperfil:${p.id}` : clavePerfilDe(p);
  return precio(k, refBarra);
}
export const precioPlanchaAM2 = (clave: string, refM2: number) => {
  const v = precio(clave, refM2 * AREA_PLANCHA_M2);
  return v / AREA_PLANCHA_M2;
};

// Promedio de jornales por cargo desde Personal (trabajadores con su jornal).
export function importarJornales(trabajadores: { role?: string; dailyRate?: number }[]): number {
  const grupos = new Map<string, number[]>();
  trabajadores.forEach(t => { if (t.role && (t.dailyRate || 0) > 0) { const k = claveJornal(t.role); grupos.set(k, [...(grupos.get(k) || []), t.dailyRate!]); } });
  grupos.forEach((v, k) => {
    const prom = Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100;
    if (!itemCatalogo(k)) {
      const nombre = k.slice('jornal:'.length);
      cacheItems?.push({ clave: k, grupo: 'Mano de obra (jornal por día)', nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1), unidad: 'día', ref: 0, usadoEn: ['Personal'] });
      mapa = null; cacheTodos = null;
    }
    estado.precios[k] = prom; estado.fechas[k] = `${new Date().toISOString().slice(0, 10)} · Personal`;
  });
  estado = { ...estado, precios: { ...estado.precios }, fechas: { ...estado.fechas }, actualizado: Date.now() };
  emitir();
  return grupos.size;
}

// ---- Migración única de precios guardados antes en cada apartado ------------
// (Techos guardaba S/ por metro; Obra Civil S/ por m² y S/ por millar.)
export function migrarPreciosAntiguos(perfilTechos: (id: string) => { categoria: string; anchoMm: number; altoMm: number; espesorMm: number; longitudComercialM?: number; nombre?: string; normaAcabado?: string } | undefined) {
  if (safeStorage.getItem<boolean>('innova_catalogo_migrado', false)) return;
  const p = { ...estado.precios };
  const poner = (k: string, v: unknown) => { if (typeof v === 'number' && isFinite(v) && p[k] === undefined) p[k] = Math.round(v * 100) / 100; };
  const ct = safeStorage.getItem<any>('techos_costos_usuario', null);
  if (ct) {
    Object.entries(ct.precioPerfil || {}).forEach(([id, v]) => { const pf = perfilTechos(id); if (pf) poner(clavePerfilDe(pf), (v as number) * (pf.longitudComercialM || 6)); });
    Object.entries(ct.precioCobertura || {}).forEach(([id, v]) => poner(claveCobertura(id), v));
    poner('techos:placa_base', ct.placaBase); poner('techos:perno_anclaje', ct.pernoAnclajeCaja); poner('techos:perno_epdm', ct.pernoEpdmCaja); poner('soldadura:kg', ct.soldaduraKg);
    (ct.cuadrilla || []).forEach((f: any) => { if (f.jornal > 0) poner(claveJornal(f.cargo), f.jornal); });
  }
  const ref = new Map(itemsCatalogo().map(i => [i.clave, i.ref]));
  const siDistinto = (k: string, v: number) => { if (Math.abs((ref.get(k) ?? -1) - v) > 0.009) poner(k, v); };
  (safeStorage.getItem<any[]>('catalogo_drywall', []) || []).forEach(d => siDistinto(claveDrywall(d.id), (d.precioM2 || 0) * AREA_PLANCHA_M2));
  (safeStorage.getItem<any[]>('catalogo_osb', []) || []).forEach(d => siDistinto(claveOsb(d.id), (d.precioM2 || 0) * AREA_PLANCHA_M2));
  (safeStorage.getItem<any[]>('catalogo_ladrillo', []) || []).forEach(d => siDistinto(claveLadrillo(d.id), d.precioxMil || 0));
  const pc = safeStorage.getItem<any>('concreto_metrados_precios', null);
  if (pc) { siDistinto('concreto:cemento', pc.cementoBolsa); siDistinto('concreto:arena', pc.arenaM3); siDistinto('concreto:piedra', pc.piedraM3); siDistinto('concreto:acero', pc.aceroKg); siDistinto('concreto:encofrado', pc.encofradoM2); }
  if (Object.keys(p).length !== Object.keys(estado.precios).length) { estado = { ...estado, precios: p, actualizado: Date.now() }; emitir(); }
  safeStorage.setItem('innova_catalogo_migrado', true);
}
