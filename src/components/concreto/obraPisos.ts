// Integración Obra Civil por pisos: muros (drywall / ladrillo), techos metálicos
// vinculados desde el módulo de Techos y soporte metálico de tanque elevado con
// su sobrepecho. Todo se guarda en localStorage junto al metrado de concreto.
import { DrywallItem } from '../../catalogo/drywall';
import { LadrilloItem } from '../../catalogo/ladrillo';
import { INVENTARIO_PERFILES_TUBULARES } from '../techos/techosCadCatalog';

export const KEY_TECHOS_DISPONIBLES = 'obra_techos_disponibles';
export const KEY_SISTEMAS_NIVEL = 'concreto_sistemas_nivel';
export const KEY_CAT_DRYWALL = 'catalogo_drywall';
export const KEY_CAT_LADRILLO = 'catalogo_ladrillo';

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
  tipo: 'drywall' | 'ladrillo';
  materialId: string;
  areaM2: number;
  caras: 1 | 2; // solo drywall: placas en una o ambas caras del tabique
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
    sobrepecho: true, sobrepechoLadrilloId: 'ladrillo_pandereta', sobrepechoAlturaM: 1.0,
  };
}

export interface CalcMuro { unidades: number; pesoKg: number; costo: number; nombre: string; }

export function calcMuro(m: MuroCapa, dry: DrywallItem[], lad: LadrilloItem[]): CalcMuro {
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

export function calcSistema(s: SistemaNivel | undefined, dry: DrywallItem[], lad: LadrilloItem[], techosLib: TechoSnapshot[]): CalcSistema {
  const sis = s || sistemaVacio();
  const muros = sis.muros.map(m => ({ m, r: calcMuro(m, dry, lad) }));
  const techos = sis.techoIds.map(id => techosLib.find(t => t.id === id)).filter((t): t is TechoSnapshot => !!t);
  const tanque = sis.tanque ? calcTanque(sis.tanque, lad) : undefined;
  const costoMuros = muros.reduce((a, x) => a + x.r.costo, 0);
  const costoTechos = techos.reduce((a, t) => a + t.costoDirectoSoles, 0);
  const costoTanque = tanque?.costo || 0;
  const pesoKg = muros.reduce((a, x) => a + x.r.pesoKg, 0) + techos.reduce((a, t) => a + t.pesoAceroKg, 0) + (tanque?.cargaTotalKg || 0);
  return { muros, techos, tanque, costoMuros, costoTechos, costoTanque, costo: costoMuros + costoTechos + costoTanque, pesoKg };
}
