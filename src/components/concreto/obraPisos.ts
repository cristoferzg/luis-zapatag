// Integración Obra Civil por pisos: muros (drywall / ladrillo), techos metálicos
// vinculados desde el módulo de Techos y soporte metálico de tanque elevado con
// su sobrepecho. Todo se guarda en localStorage junto al metrado de concreto.
import { DrywallItem } from '../../catalogo/drywall';
import { LadrilloItem } from '../../catalogo/ladrillo';
import { OsbItem, OSB_DEFAULTS } from '../../catalogo/osb';
import { safeStorage } from '../../lib/storageManager';
import { INVENTARIO_PERFILES_TUBULARES } from '../techos/techosCadCatalog';
import type { PlanoElem } from '../ConcretoPlanoCad';

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
export function muroDesdePlano(e: PlanoElem): MuroCapa {
  const largo = e.x2 !== undefined && e.y2 !== undefined ? Math.hypot(e.x2 - e.x1, e.y2 - e.y1) : 0;
  const tipo = e.material || 'ladrillo';
  return { id: `cad_${e.uid}`, deCad: true, tipo, materialId: e.materialId || '', areaM2: largo * (e.H || 2.6), caras: e.caras || (tipo === 'osb' ? 1 : 2) };
}

// ---- Estructura guardada en Techos Metálicos ----
export interface EstructuraTechos {
  id: string;
  nombre: string;
  nodes: Record<string, { id: string; x: number; y: number; z: number }>;
  segments: Record<string, { id: string; nodeAId: string; nodeBId: string; profileId: string; rolEstructural: string; concretoBaseM?: number }>;
  coverageZones: Record<string, { id: string; nombre: string; nodeIdsBoundary: string[]; coberturaMaterialId: string }>;
}

// Alturas de los entrepisos: vigas horizontales que no son el techo (la cota
// más alta, donde van las correas). Piso 2 arranca en la primera, etc.
export function entrepisosDesdeTechos(t: EstructuraTechos | null | undefined): number[] {
  if (!t) return [];
  const nodes = t.nodes || {};
  const segs = Object.values(t.segments || {});
  const yTecho = Math.max(0, ...Object.values(nodes).map(n => n.y));
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
  const costoAcero = metrosPerfil * t.precioMetro;

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
