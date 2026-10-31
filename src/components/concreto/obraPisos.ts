// Integración Obra Civil por pisos: muros (drywall / ladrillo), techos metálicos
// vinculados desde el módulo de Techos y soporte metálico de tanque elevado con
// su sobrepecho. Todo se guarda en localStorage junto al metrado de concreto.
import { DrywallItem } from '../../catalogo/drywall';
import { LadrilloItem } from '../../catalogo/ladrillo';
import { OsbItem, OSB_DEFAULTS } from '../../catalogo/osb';
import { safeStorage } from '../../lib/storageManager';
import { leerDisenosCarpi, costoDisenoCarpi } from './carpiObra';
import { precio, precioPlanchaAM2, precioBarraPerfil, claveDrywall, claveOsb, claveLadrillo } from '../../lib/catalogoPrecios';
import { INVENTARIO_PERFILES_TUBULARES } from '../techos/techosCadCatalog';
import type { PlanoElem } from '../ConcretoPlanoCad';
import { metradoDrywall } from './metradoDrywall';
import { metradoPartidas } from '../drywall/calculoDrywall';
import { leerCotizacionActual } from '../drywall/cotizacionDrywall';
import { leerBloques } from './bloques';
import {
  ContextoMuro, perfilMuro, areaPerfil, areaAberturas, esNodoTanque, esPuerta, esVidrio, detectarAmbientes, regionesCielo, mallaCielo,
  mallaCieloTanque, tanquesEnEstructura, metradoTechosPorPiso, MetradoTechosPiso, CieloRaso, Sobrepecho, perimetroSobrepecho,
} from './geometriaObra';

export const KEY_TECHOS_DISPONIBLES = 'obra_techos_disponibles';
export const KEY_SISTEMAS_NIVEL = 'concreto_sistemas_nivel';
export const KEY_CAT_DRYWALL = 'catalogo_drywall';
export const KEY_CAT_LADRILLO = 'catalogo_ladrillo';
export const KEY_CAT_OSB = 'catalogo_osb';
export const KEY_OBRA_TECHOS_ID = 'concreto_obra_techos_id';

export const leerCatalogoOsb = (): OsbItem[] => safeStorage.getItem<OsbItem[]>(KEY_CAT_OSB, OSB_DEFAULTS) || OSB_DEFAULTS;
export type MaterialMuro = 'ladrillo' | 'drywall' | 'osb';

// Resumen del presupuesto de un techo metálico, enviado desde el módulo Techos.
export interface TechoSnapshot {
  id: string;
  nombre: string;
  fecha: string;
  pesoAceroKg: number;
  areaCoberturaM2: number;
  costoDirectoSoles: number;
  precioVentaSoles: number;
}

export interface MuroCapa {
  id: string;
  deCad?: boolean; // dibujado en el Plano CAD (se edita allá)
  tipo: MaterialMuro;
  materialId: string;
  areaM2: number;
  caras: 1 | 2; // drywall / OSB: placas en una o ambas caras
}

export interface SoporteTanque {
  capacidadL: 600 | 1100 | 2500;
  alturaM: number;
  perfilId: string;
  precioMetro: number; // editable; arranca con el precio del catálogo de Techos
  sobrepecho: boolean;
  sobrepechoLadrilloId: string;
  sobrepechoAlturaM: number;
}

export interface SistemaNivel {
  muros: MuroCapa[];
  techoIds: string[];
  tanque?: SoporteTanque;
}

export const sistemaVacio = (): SistemaNivel => ({ muros: [], techoIds: [] });

// Medidas aproximadas de tanques tipo Rotoplas (diámetro en m, peso lleno en kg).
export const TANQUES: Record<SoporteTanque['capacidadL'], { diametro: number; pesoLlenoKg: number }> = {
  600: { diametro: 0.97, pesoLlenoKg: 620 },
  1100: { diametro: 1.10, pesoLlenoKg: 1130 },
  2500: { diametro: 1.55, pesoLlenoKg: 2560 },
};

export const PERFILES_TANQUE = INVENTARIO_PERFILES_TUBULARES.filter(
  p => p.categoria === 'tubo_cuadrado' && p.anchoMm >= 40
);

export function tanqueDefault(): SoporteTanque {
  const p = PERFILES_TANQUE.find(x => x.espesorMm >= 2) || PERFILES_TANQUE[0] || INVENTARIO_PERFILES_TUBULARES[0];
  return {
    capacidadL: 1100, alturaM: 1.5, perfilId: p.id, precioMetro: p.costoMetroSol,
    sobrepecho: false, sobrepechoLadrilloId: 'ladrillo_pandereta', sobrepechoAlturaM: 1.0,
  };
}

export const ALTURA_PISO_M = 3;

// Muro dibujado en el plano → capa de muro (área = largo × alto).
// Drywall: placa en ambas caras. OSB: una cara (forro exterior), editable.
// Con contexto (estructura y cota del piso) el alto sigue el techo si el muro
// va "hasta el techo"; siempre se descuentan puertas y ventanas.
export function muroDesdePlano(e: PlanoElem, ctx?: ContextoMuro): MuroCapa {
  const largo = e.x2 !== undefined && e.y2 !== undefined ? Math.hypot(e.x2 - e.x1, e.y2 - e.y1) : 0;
  const tipo = e.material || 'ladrillo';
  const bruta = ctx ? areaPerfil(perfilMuro(e, ctx)) : largo * (e.H || 2.6);
  return { id: `cad_${e.uid}`, deCad: true, tipo, materialId: e.materialId || '', areaM2: Math.max(0, bruta - areaAberturas(e)), caras: e.caras || (tipo === 'osb' ? 1 : 2) };
}

// ---- Estructura guardada en Techos Metálicos ----
export interface EstructuraTechos {
  id: string;
  nombre: string;
  nodes: Record<string, { id: string; x: number; y: number; z: number; nodeLabel?: string }>;
  segments: Record<string, { id: string; nodeAId: string; nodeBId: string; profileId: string; rolEstructural: string; concretoBaseM?: number; anguloRotacionGrados?: number }>;
  coverageZones: Record<string, { id: string; nombre: string; nodeIdsBoundary: string[]; coberturaMaterialId: string }>;
}

// Alturas de los entrepisos: vigas horizontales que no son el techo (la cota
// más alta, donde van las correas). Piso 2 arranca en la primera, etc.
export function entrepisosDesdeTechos(t: EstructuraTechos | null | undefined): number[] {
  if (!t) return [];
  const nodes = t.nodes || {};
  const segs = Object.values(t.segments || {}).filter(s => !esNodoTanque(nodes[s.nodeAId]) && !esNodoTanque(nodes[s.nodeBId]));
  const yTecho = yTechoObra(t);
  const conCorrea = new Set(segs.filter(s => s.rolEstructural === 'correa').map(s => Math.round((nodes[s.nodeAId]?.y ?? 0) * 100)));
  const niveles = new Set<number>();
  segs.forEach(s => {
    if (!['viga_principal', 'viga_secundaria', 'piso_deck'].includes(s.rolEstructural)) return;
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    if (!a || !b || Math.abs(a.y - b.y) > 0.01 || a.y < 1.5) return;
    const k = Math.round(a.y * 100);
    if (conCorrea.has(k) || a.y >= yTecho - 0.05) return;
    niveles.add(k);
  });
  return [...niveles].sort((x, y) => x - y).map(k => k / 100);
}

// Cota más alta de la estructura sin contar la torre del tanque.
export function yTechoObra(t: EstructuraTechos | null | undefined): number {
  if (!t) return 0;
  return Math.max(0, ...Object.values(t.nodes || {}).filter(n => !esNodoTanque(n)).map(n => n.y));
}

// Cota de arranque de cada piso para el 3D (Cimentación y Piso 1 en 0). Si hay
// estructura de Techos se usan sus entrepisos; si no, 3 m por piso.
export function basesDeNiveles(niveles: string[], entrepisos: number[] = []): Record<string, number> {
  const out: Record<string, number> = {};
  let k = 0;
  niveles.forEach(n => {
    if (/cimentaci/i.test(n)) { out[n] = 0; return; }
    out[n] = k === 0 ? 0 : (entrepisos[k - 1] ?? k * ALTURA_PISO_M);
    k++;
  });
  return out;
}

export interface CalcMuro { unidades: number; pesoKg: number; costo: number; nombre: string; }

export function calcMuro(m: MuroCapa, dry: DrywallItem[], lad: LadrilloItem[], osb: OsbItem[] = leerCatalogoOsb()): CalcMuro {
  if (m.tipo === 'osb') {
    const o = osb.find(x => x.id === m.materialId);
    const placaM2 = m.areaM2 * m.caras;
    return { unidades: placaM2, pesoKg: placaM2 * (o?.pesoM2 || 0), costo: placaM2 * (o?.precioM2 || 0), nombre: o?.tipo || 'OSB' };
  }
  if (m.tipo === 'drywall') {
    const d = dry.find(x => x.id === m.materialId);
    const placaM2 = m.areaM2 * m.caras;
    return { unidades: placaM2, pesoKg: placaM2 * (d?.pesoM2 || 0), costo: placaM2 * (d?.precioM2 || 0), nombre: d?.tipo || 'Drywall' };
  }
  const l = lad.find(x => x.id === m.materialId);
  const unidades = Math.ceil(m.areaM2 * (l?.unidadesM2 || 0));
  return { unidades, pesoKg: unidades * (l?.pesoUnitario || 0), costo: unidades * (l?.precioxMil || 0) / 1000, nombre: l?.tipo || 'Ladrillo' };
}

export interface CalcTanque {
  ladoM: number; metrosPerfil: number; barras6m: number; pesoAceroKg: number; costoAcero: number;
  perimetroSobrepechoM: number; areaSobrepechoM2: number; ladrillos: number; costoSobrepecho: number;
  cargaTotalKg: number; costo: number;
}

// Mesa de 4 patas: anillo superior + anillo intermedio, 3 travesaños bajo el
// tanque y una diagonal por cara.
export function calcTanque(t: SoporteTanque, lad: LadrilloItem[]): CalcTanque {
  const tk = TANQUES[t.capacidadL];
  const lado = Math.round((tk.diametro + 0.2) * 100) / 100;
  const perfil = INVENTARIO_PERFILES_TUBULARES.find(p => p.id === t.perfilId);
  const metrosPerfil = 4 * t.alturaM + 2 * 4 * lado + 3 * lado + 4 * Math.hypot(lado, t.alturaM);
  const pesoAceroKg = metrosPerfil * (perfil?.pesoLinealKgM || 0);
  // Precio del perfil: el del Catálogo de precios (por barra) llevado a metro.
  const costoAcero = metrosPerfil * (perfil ? precioBarraPerfil(perfil, perfil.costoMetroSol * (perfil.longitudComercialM || 6)) / (perfil.longitudComercialM || 6) : t.precioMetro);

  const perimetro = 4 * (lado + 0.6);
  const area = t.sobrepecho ? perimetro * t.sobrepechoAlturaM : 0;
  const l = lad.find(x => x.id === t.sobrepechoLadrilloId);
  const ladrillos = Math.ceil(area * (l?.unidadesM2 || 0));
  const costoSobrepecho = ladrillos * (l?.precioxMil || 0) / 1000;
  return {
    ladoM: lado, metrosPerfil, barras6m: Math.ceil(metrosPerfil / 6), pesoAceroKg, costoAcero,
    perimetroSobrepechoM: perimetro, areaSobrepechoM2: area, ladrillos, costoSobrepecho,
    cargaTotalKg: tk.pesoLlenoKg + pesoAceroKg + ladrillos * (l?.pesoUnitario || 0),
    costo: costoAcero + costoSobrepecho,
  };
}

export interface CalcSistema {
  muros: { m: MuroCapa; r: CalcMuro }[];
  techos: TechoSnapshot[];
  tanque?: CalcTanque;
  costoMuros: number; costoTechos: number; costoTanque: number; costo: number; pesoKg: number;
}

export function calcSistema(s: SistemaNivel | undefined, dry: DrywallItem[], lad: LadrilloItem[], techosLib: TechoSnapshot[], murosCad: MuroCapa[] = [], osb: OsbItem[] = leerCatalogoOsb()): CalcSistema {
  const sis = s || sistemaVacio();
  const muros = [...murosCad, ...sis.muros].map(m => ({ m, r: calcMuro(m, dry, lad, osb) }));
  const techos = sis.techoIds.map(id => techosLib.find(t => t.id === id)).filter((t): t is TechoSnapshot => !!t);
  const tanque = sis.tanque ? calcTanque(sis.tanque, lad) : undefined;
  const costoMuros = muros.reduce((a, x) => a + x.r.costo, 0);
  const costoTechos = techos.reduce((a, t) => a + t.costoDirectoSoles, 0);
  const costoTanque = tanque?.costo || 0;
  const pesoKg = muros.reduce((a, x) => a + x.r.pesoKg, 0) + techos.reduce((a, t) => a + t.pesoAceroKg, 0) + (tanque?.cargaTotalKg || 0);
  return { muros, techos, tanque, costoMuros, costoTechos, costoTanque, costo: costoMuros + costoTechos + costoTanque, pesoKg };
}

// Contexto de cada piso para los muros: cota de arranque y tope (el piso de
// arriba); el último piso llega hasta el techo de la estructura.
export function contextosObra(niveles: string[], est: EstructuraTechos | null) {
  const bases = basesDeNiveles(niveles, entrepisosDesdeTechos(est));
  const pisos = niveles.filter(n => !/cimentaci/i.test(n));
  const ctx = (nivel?: string): ContextoMuro => {
    const n = nivel || pisos[0] || 'Piso 1';
    const k = pisos.indexOf(n);
    const sig = k >= 0 ? pisos[k + 1] : undefined;
    return { estructura: est, base: bases[n] || 0, tope: sig !== undefined ? bases[sig] : undefined };
  };
  return { bases, pisos, ctx };
}

// Resumen por piso de lo dibujado en el Plano CAD (para la vista Lista):
// estructura de Techos del piso, ambientes, aberturas y cielo raso.
export interface ObraPiso {
  metal?: MetradoTechosPiso;
  ambientes: { nombre: string; area: number }[];
  puertas: number; ventanas: number; vanos: number;
  cielo?: { area: number; perimetro: number; costo: number; nombre: string; modo: string };
  cieloTanque?: { area: number; costo: number };
  entrepisoOsb?: { area: number; costo: number; nombre: string };
  carpi?: { nombre: string; costo: number; medidas: string }[]; // puertas/ventanas de CarpiMetal
  // Drywall (módulo Drywall): perfilería, tornillos, masilla, cinta e instalación;
  // las placas ya van en los muros y el cielo raso.
  drywall?: { accesorios: number; manoObra: number; dias: number; lineas: number };
  drywallCotizador?: { partidas: number; total: number; dias: number }; // Drywall → Cotizar
  observaciones?: string[]; // notas de la cotización (bloques, CarpiMetal no incluido, mobiliario)
  tanques?: { numero: number; litros: number; sobretecho?: string; sobretechoM2: number; sobrepechoM2: number; ladrillos: number; costoSobrepecho: number }[];
  costo: number;
}
export function obraPorPiso(niveles: string[], est: EstructuraTechos | null, elems: PlanoElem[], cielos: Record<string, CieloRaso>, nombres: Record<string, string>, dry: DrywallItem[],
  osb: OsbItem[] = leerCatalogoOsb(), lad: LadrilloItem[] = [], sobrepechos: Record<string, Sobrepecho> = {}): Record<string, ObraPiso> {
  const { pisos, ctx } = contextosObra(niveles, est);
  const metal = metradoTechosPorPiso(est, pisos.map(n => ctx(n).base));
  const tanques = tanquesEnEstructura(est);
  const dw = metradoDrywall(niveles, est, elems, cielos);
  const partidasCot = leerCotizacionActual().partidas;
  const bloques = leerBloques();
  const out: Record<string, ObraPiso> = {};
  pisos.forEach((n, k) => {
    const c = ctx(n);
    const muros = elems.filter(e => e.tipo === 'muro' && (e.nivel || pisos[0]) === n && e.x2 !== undefined && e.y2 !== undefined);
    const abs = muros.flatMap(m => m.aberturas || []);
    const o: ObraPiso = {
      metal: est ? metal[k] : undefined,
      ambientes: detectarAmbientes(muros).map((a, i) => ({ nombre: nombres[`${n}#${a.key}`] || `Ambiente ${i + 1}`, area: a.area })),
      puertas: abs.filter(a => esPuerta(a.tipo)).length, ventanas: abs.filter(a => esVidrio(a.tipo)).length, vanos: abs.filter(a => a.tipo === 'vano').length,
      costo: est ? metal[k].costoAcero + metal[k].costoCobertura : 0,
    };
    const cfg = cielos[n];
    if (cfg?.activo) {
      const m = mallaCielo(regionesCielo(muros, est, c.base), cfg, c);
      const d = dry.find(x => x.id === cfg.materialId);
      o.cielo = { area: m.area, perimetro: m.perimetro, costo: m.area * (d?.precioM2 || 0), nombre: d?.tipo || 'Drywall', modo: cfg.modo };
      o.costo += o.cielo.costo;
    }
    // El cielo raso bajo el sobretecho de los tanques se suma al último piso.
    if (k === pisos.length - 1) {
      const ts = tanques.filter(t => cielos[`tanque:${t.id}`]?.activo && t.ySobretecho !== null);
      if (ts.length) {
        const area = ts.reduce((s2, t) => s2 + mallaCieloTanque(t).area, 0);
        const costo = ts.reduce((s2, t) => s2 + mallaCieloTanque(t).area * (dry.find(x => x.id === cielos[`tanque:${t.id}`]?.materialId)?.precioM2 || 0), 0);
        o.cieloTanque = { area, costo }; o.costo += costo;
      }
    }
    // Puertas, ventanas y rejas de CarpiMetal en los vanos, y bloques sueltos
    // (mesas, barandas, portones…). Solo suman los marcados "Incluir en la
    // cotización"; las observaciones van a la cotización del piso.
    const obs: string[] = [];
    const conCarpi = abs.filter(a => a.carpiId);
    const bloquesPiso = bloques.filter(b => (b.nivel || pisos[0]) === n);
    if (conCarpi.length || bloquesPiso.some(b => b.origen === 'carpi')) {
      const disenos = leerDisenosCarpi();
      const lista: { nombre: string; costo: number; medidas: string }[] = [];
      conCarpi.forEach(a => {
        const d = disenos.find(x => x.id === a.carpiId);
        const nombre = d?.nombre || a.carpiNombre || 'Diseño de carpintería metálica';
        if (a.incluir !== false) lista.push({ nombre, costo: d ? costoDisenoCarpi(d) : 0, medidas: `${a.w.toFixed(2)} × ${a.h.toFixed(2)} m` });
        if (a.obs?.trim()) obs.push(`${nombre}: ${a.obs.trim()}`);
        else if (a.incluir === false) obs.push(`${nombre}: no incluido en esta cotización.`);
      });
      bloquesPiso.filter(b => b.origen === 'carpi').forEach(b => {
        const d = disenos.find(x => x.id === b.refId);
        if (b.incluir) lista.push({ nombre: `${b.nombre} (suelto)`, costo: d ? costoDisenoCarpi(d) : 0, medidas: `${b.ancho.toFixed(2)} × ${b.fondo.toFixed(2)} × ${b.alto.toFixed(2)} m` });
        if (b.obs.trim()) obs.push(`${b.nombre}: ${b.obs.trim()}`);
        else if (!b.incluir) obs.push(`${b.nombre}: no incluido en esta cotización.`);
      });
      if (lista.length) { o.carpi = lista; o.costo += lista.reduce((x, c) => x + c.costo, 0); }
    }
    const muebles = bloquesPiso.filter(b => b.origen === 'mueble');
    if (muebles.length) {
      const conObs = muebles.filter(b => b.obs.trim() && b.obs.trim() !== 'Mobiliario referencial, no incluido.');
      const resto = muebles.filter(b => !conObs.includes(b));
      if (resto.length) obs.push(`Mobiliario referencial, no incluido: ${[...new Set(resto.map(b => b.nombre.toLowerCase()))].join(', ')}.`);
      conObs.forEach(b => obs.push(`${b.nombre}: ${b.obs.trim()}`));
    }
    if (obs.length) o.observaciones = obs;
    const md = dw.find(x => x.nivel === n);
    if (md && md.lineas.length) {
      const accesorios = md.lineas.filter(l => !/^(drywall|osb):/.test(l.clave)).reduce((x, l) => x + l.subtotal, 0);
      o.drywall = { accesorios, manoObra: md.manoObra, dias: md.dias, lineas: md.lineas.length };
      o.costo += accesorios + md.manoObra;
    }
    // Partidas del Cotizador de Drywall asignadas a este piso (placas incluidas).
    const delPiso = partidasCot.filter(p => p.nivel === n);
    if (delPiso.length) {
      const r = metradoPartidas(delPiso);
      o.drywallCotizador = { partidas: delPiso.length, total: r.total, dias: r.dias };
      o.costo += r.total;
    }
    // Entrepisos de OSB dibujados como "techo" de este piso.
    const losasOsb = elems.filter(e => e.tipo === 'losa' && e.losaMaterial === 'osb' && (e.nivel || pisos[0]) === n && e.x2 !== undefined && e.y2 !== undefined);
    if (losasOsb.length) {
      const area = losasOsb.reduce((s2, e) => s2 + Math.abs(e.x2! - e.x1) * Math.abs(e.y2! - e.y1), 0);
      const p = osb.find(x => x.id === 'osb_18') || osb[0];
      o.entrepisoOsb = { area, costo: area * (p?.precioM2 || 0), nombre: p?.tipo || 'OSB' };
      o.costo += o.entrepisoOsb.costo;
    }
    // Tanques: se metran en el piso donde apoya su torre.
    const tq = tanques.filter(t => { const b = t.cotaBase; const sig = pisos[k + 1]; return b >= c.base - 0.05 && (sig === undefined || b < ctx(sig).base - 0.05); });
    if (tq.length) o.tanques = tq.map(t => {
      const sp = sobrepechos[t.id];
      const m2 = sp?.activo ? perimetroSobrepecho(t, sp) * sp.alto : 0;
      const l = lad.find(x => x.id === sp?.ladrilloId);
      const ladrillos = Math.ceil(m2 * (l?.unidadesM2 || 0));
      const costoSobrepecho = ladrillos * (l?.precioxMil || 0) / 1000;
      o.costo += costoSobrepecho;
      return { numero: t.numero, litros: t.litros, sobretecho: t.sobretechoCobertura, sobretechoM2: t.sobretechoM2, sobrepechoM2: m2, ladrillos, costoSobrepecho };
    });
    out[n] = o;
  });
  return out;
}

// Listas de materiales con el precio vigente del Catálogo de precios único
// (drywall y OSB por plancha → S/ por m²; ladrillo por millar).
export const drywallConCatalogo = (l: DrywallItem[]) => l.map(d => ({ ...d, precioM2: precioPlanchaAM2(claveDrywall(d.id), d.precioM2) }));
export const osbConCatalogo = (l: OsbItem[]) => l.map(d => ({ ...d, precioM2: precioPlanchaAM2(claveOsb(d.id), d.precioM2) }));
export const ladrilloConCatalogo = (l: LadrilloItem[]) => l.map(d => ({ ...d, precioxMil: precio(claveLadrillo(d.id), d.precioxMil) }));
export const preciosConcretoCatalogo = () => ({
  cementoBolsa: precio('concreto:cemento', 28), arenaM3: precio('concreto:arena', 55), piedraM3: precio('concreto:piedra', 60),
  aceroKg: precio('concreto:acero', 4.2), encofradoM2: precio('concreto:encofrado', 25),
});
