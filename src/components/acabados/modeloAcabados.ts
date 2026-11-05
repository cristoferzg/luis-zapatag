// =============================================================================
// Acabados: modelo de datos (ambientes con paredes, techo, piso y contrazócalo) y la
// cotización guardada en el equipo (claves `acabados_…`).
//
// Medidas en metros. Un ambiente es un rectángulo (largo × ancho) o el polígono que
// viene del plano de Obra Civil (coordenadas en planta, x a la derecha, y hacia abajo).
// =============================================================================
import { safeStorage } from '../../lib/storageManager';
import { detectarAmbientes } from '../concreto/geometriaObra';
import type { PlanoElem } from '../ConcretoPlanoCad';
import { COLORES_PARED, COLORES_BALDOSA, COLORES_FRAGUA, TipoPintura } from '../../catalogo/acabados';

export interface Pt { x: number; y: number }
export type TipoAmbiente = 'sala' | 'dormitorio' | 'cocina' | 'bano' | 'lavanderia' | 'pasadizo' | 'otro';
export const TIPOS_AMBIENTE: { id: TipoAmbiente; nombre: string }[] = [
  { id: 'sala', nombre: 'Sala / comedor' }, { id: 'dormitorio', nombre: 'Dormitorio' }, { id: 'cocina', nombre: 'Cocina' },
  { id: 'bano', nombre: 'Baño' }, { id: 'lavanderia', nombre: 'Lavandería' }, { id: 'pasadizo', nombre: 'Pasadizo / hall' }, { id: 'otro', nombre: 'Otro' },
];
export type TipoPiso = 'ninguno' | 'ceramico' | 'porcelanato' | 'laminado' | 'vinilico' | 'pulido';
export const TIPOS_PISO: { id: TipoPiso; nombre: string; corto: string }[] = [
  { id: 'ceramico', nombre: 'Cerámico', corto: 'Cerámico' }, { id: 'porcelanato', nombre: 'Porcelanato', corto: 'Porcelanato' },
  { id: 'laminado', nombre: 'Laminado', corto: 'Laminado' }, { id: 'vinilico', nombre: 'Vinílico SPC', corto: 'Vinílico' },
  { id: 'pulido', nombre: 'Cemento pulido', corto: 'Pulido' }, { id: 'ninguno', nombre: 'Sin piso', corto: 'Ninguno' },
];
export const esBaldosa = (t: TipoPiso) => t === 'ceramico' || t === 'porcelanato';

export interface Vano { id: string; tipo: 'puerta' | 'ventana'; w: number; h: number; sill: number }
export interface Revestimiento { formato: string; color: string; junta: number; fragua: string; merma: number }
export interface AcabadoPintura { activo: boolean; color: string; manos: number; empaste: boolean; imprimante: boolean; tipo: TipoPintura }
export interface Enchape extends Revestimiento { activo: boolean; desde: number; alto: number; largo: number } // largo 0 = todo el perímetro
export interface Piso extends Revestimiento { tipo: TipoPiso }
export interface Ambiente {
  id: string; nombre: string; tipo: TipoAmbiente;
  largo: number; ancho: number; alto: number;
  poly?: Pt[];            // si viene de Obra Civil (planta real)
  origen?: string;        // 'Piso 1' (de Obra Civil)
  vanos: Vano[];
  pintura: AcabadoPintura; techo: AcabadoPintura; enchape: Enchape; piso: Piso;
  contrazocalo: { activo: boolean; alto: number };
}
export interface CotizacionAcabados {
  id: string; nombre: string; cliente: string;
  ambientes: Ambiente[];
  gg: number; util: number;
  rendPintura: number;              // m² por galón y por mano
  modoMO: 'm2' | 'jornal';
  soloMO: boolean;                  // el cliente compra los materiales
  total?: number;                   // total con GG y utilidad (lo lee "Presupuesto de obra")
  actualizado?: string;
}
export const KEY_COT_ACTUAL = 'acabados_cotizacion_actual';
export const KEY_COT_LISTA = 'acabados_cotizaciones';
export const KEY_PESTANA = 'acabados_pestana';

export const uid = () => Math.random().toString(36).slice(2, 10);
const pintura = (color = COLORES_PARED[1].hex, p: Partial<AcabadoPintura> = {}): AcabadoPintura => ({ activo: true, color, manos: 2, empaste: true, imprimante: true, tipo: 'latex', ...p });

/** Valores de partida según el tipo de ambiente (baño y cocina con enchape). */
export function ambienteNuevo(tipo: TipoAmbiente = 'dormitorio', p: Partial<Ambiente> = {}): Ambiente {
  const humedo = tipo === 'bano' || tipo === 'cocina' || tipo === 'lavanderia';
  const nombre = p.nombre || TIPOS_AMBIENTE.find(t => t.id === tipo)!.nombre.split(' /')[0];
  const enchape: Enchape = {
    activo: humedo, formato: tipo === 'bano' ? 'cer_30x60' : 'cer_25x40', color: COLORES_BALDOSA[0].hex, junta: 2, fragua: COLORES_FRAGUA[0].hex, merma: 10,
    desde: tipo === 'cocina' ? 0.9 : 0, alto: tipo === 'bano' ? 1.8 : tipo === 'cocina' ? 0.6 : 1.2, largo: tipo === 'cocina' ? 3 : tipo === 'lavanderia' ? 2 : 0,
  };
  return {
    id: uid(), nombre, tipo, largo: 4, ancho: 3, alto: 2.5, vanos: [{ id: uid(), tipo: 'puerta', w: tipo === 'bano' ? 0.7 : 0.9, h: 2.1, sill: 0 }],
    pintura: pintura(COLORES_PARED[1].hex, humedo ? { tipo: 'satinado' } : {}),
    techo: pintura('#ffffff', { manos: 2, empaste: true }),
    enchape,
    piso: { tipo: humedo ? 'ceramico' : 'porcelanato', formato: humedo ? 'cer_45x45' : 'por_60x60', color: COLORES_BALDOSA[humedo ? 3 : 2].hex, junta: humedo ? 3 : 2, fragua: COLORES_FRAGUA[humedo ? 2 : 1].hex, merma: 10 },
    contrazocalo: { activo: tipo !== 'bano', alto: 0.1 },
    ...p,
  };
}
export const cotizacionVacia = (): CotizacionAcabados => ({ id: uid(), nombre: '', cliente: '', ambientes: [], gg: 10, util: 15, rendPintura: 35, modoMO: 'm2', soloMO: false });
export function leerCotizacionActual(): CotizacionAcabados {
  const c = { ...cotizacionVacia(), ...(safeStorage.getItem<CotizacionAcabados | null>(KEY_COT_ACTUAL, null) || {}) };
  return { ...c, ambientes: Array.isArray(c.ambientes) ? c.ambientes.map(a => normalizar(a)) : [] };
}
/** Completa un ambiente guardado con una versión anterior. */
export function normalizar(a: Partial<Ambiente>): Ambiente {
  const base = ambienteNuevo(a.tipo || 'otro');
  return { ...base, ...a, pintura: { ...base.pintura, ...a.pintura }, techo: { ...base.techo, ...a.techo }, enchape: { ...base.enchape, ...a.enchape }, piso: { ...base.piso, ...a.piso }, contrazocalo: { ...base.contrazocalo, ...a.contrazocalo }, vanos: Array.isArray(a.vanos) ? a.vanos : [] } as Ambiente;
}
export const leerCotizaciones = (): CotizacionAcabados[] => safeStorage.getItem<CotizacionAcabados[]>(KEY_COT_LISTA, []) || [];

// ── Geometría ────────────────────────────────────────────────────────────────
export const areaPoly = (p: Pt[]) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a.x * b.y - b.x * a.y; }, 0)) / 2;
export const perimetroPoly = (p: Pt[]) => p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + Math.hypot(b.x - a.x, b.y - a.y); }, 0);
/** Planta del ambiente (polígono en metros, empezando en 0,0 si es manual). */
export const plantaDe = (a: Ambiente): Pt[] => (a.poly && a.poly.length >= 3 ? a.poly : [{ x: 0, y: 0 }, { x: a.largo, y: 0 }, { x: a.largo, y: a.ancho }, { x: 0, y: a.ancho }]);
export const areaPiso = (a: Ambiente) => areaPoly(plantaDe(a));
export const perimetro = (a: Ambiente) => perimetroPoly(plantaDe(a));

// ── Desde el plano de Obra Civil ─────────────────────────────────────────────
export function pisosObra(): string[] {
  const niv = safeStorage.getItem<string[]>('concreto_metrados_niveles', ['Cimentación', 'Piso 1']) || ['Piso 1'];
  const l = niv.filter(n => !/cimentaci/i.test(n));
  return l.length ? l : ['Piso 1'];
}
const distSeg = (p: Pt, a: Pt, b: Pt) => {
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
  const t = L2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
};
const adivinarTipo = (n: string): TipoAmbiente => /ba[ñn]o|ss\.?hh|servicio/i.test(n) ? 'bano' : /cocina|kitchen/i.test(n) ? 'cocina' : /lavand|patio de servicio/i.test(n) ? 'lavanderia'
  : /dorm|habitaci|cuarto|rec[aá]mara/i.test(n) ? 'dormitorio' : /sala|comedor|estar/i.test(n) ? 'sala' : /pasad|hall|corredor|pasillo/i.test(n) ? 'pasadizo' : 'otro';
const PISO_OBRA: Record<string, TipoPiso> = { ceramico: 'ceramico', porcelanato: 'porcelanato', cemento_pulido: 'pulido', laminado: 'laminado', vinilico: 'vinilico' };

/** Ambientes cerrados del plano de Obra Civil (con sus puertas y ventanas, nombres y acabados). */
export function ambientesDeObra(nivel: string): Ambiente[] {
  const elems = safeStorage.getItem<PlanoElem[]>('concreto_plano_elems', []) || [];
  const pisos = pisosObra();
  const muros = elems.filter(e => e.tipo === 'muro' && e.x2 !== undefined && e.y2 !== undefined && (e.nivel || pisos[0]) === nivel);
  if (muros.length < 3) return [];
  const nombres = safeStorage.getItem<Record<string, string>>('concreto_ambientes_nombres', {}) || {};
  const acab = safeStorage.getItem<Record<string, { piso?: string; pintura?: boolean; zocalo?: boolean; colorPintura?: string }>>('concreto_acabados_ambiente', {}) || {};
  const altos = muros.map(m => m.H || 2.6).sort((p, q) => p - q);
  const alto = Math.round(altos[Math.floor(altos.length / 2)] * 100) / 100;
  return detectarAmbientes(muros).map((am, i) => {
    const k = `${nivel}#${am.key}`;
    const nombre = nombres[k] || `Ambiente ${i + 1}`;
    const tipo = adivinarTipo(nombre);
    // Vanos: los que caen sobre algún lado del polígono del ambiente.
    const vanos: Vano[] = [];
    muros.forEach(m => {
      const L = Math.hypot(m.x2! - m.x1, m.y2! - m.y1); if (L < 0.01) return;
      (m.aberturas || []).forEach(v => {
        const c = { x: m.x1 + ((m.x2! - m.x1) * v.t) / L, y: m.y1 + ((m.y2! - m.y1) * v.t) / L };
        const sobre = am.poly.some((p, j) => distSeg(c, p, am.poly[(j + 1) % am.poly.length]) < Math.max(0.05, (m.a || 0.15) / 2 + 0.02));
        const puerta = !(v.sill > 0.05) && !/ventana/i.test(v.tipo);
        if (sobre) vanos.push({ id: uid(), tipo: puerta ? 'puerta' : 'ventana', w: v.w, h: v.h || (puerta ? 2.1 : 1), sill: puerta ? 0 : v.sill || 0.9 });
      });
    });
    const xs = am.poly.map(p => p.x), ys = am.poly.map(p => p.y);
    const base = ambienteNuevo(tipo, {
      nombre, alto, poly: am.poly.map(p => ({ x: Math.round(p.x * 1000) / 1000, y: Math.round(p.y * 1000) / 1000 })), origen: nivel, vanos,
      largo: Math.round((Math.max(...xs) - Math.min(...xs)) * 100) / 100, ancho: Math.round((Math.max(...ys) - Math.min(...ys)) * 100) / 100,
    });
    const ac = acab[k];
    if (ac) {
      const tp = PISO_OBRA[ac.piso || ''];
      if (tp) base.piso = { ...base.piso, tipo: tp, formato: tp === 'porcelanato' ? 'por_60x60' : tp === 'ceramico' ? 'cer_45x45' : base.piso.formato };
      if (ac.piso === 'ninguno') base.piso = { ...base.piso, tipo: 'ninguno' };
      if (ac.pintura) base.pintura = { ...base.pintura, activo: true, color: ac.colorPintura || base.pintura.color };
      base.contrazocalo = { ...base.contrazocalo, activo: !!ac.zocalo || base.contrazocalo.activo };
    }
    return base;
  });
}

// ── Ejemplo: departamento con sala-comedor, cocina, 2 dormitorios, baño y lavandería ──
export function cotizacionEjemplo(): CotizacionAcabados {
  const v = (tipo: 'puerta' | 'ventana', w: number, h: number, sill = tipo === 'puerta' ? 0 : 0.9): Vano => ({ id: uid(), tipo, w, h, sill });
  const ambientes: Ambiente[] = [
    ambienteNuevo('sala', { nombre: 'Sala-comedor', largo: 6, ancho: 3.6, alto: 2.5, vanos: [v('puerta', 1, 2.1), v('ventana', 2, 1.2), v('ventana', 1.5, 1.2)],
      pintura: pintura(COLORES_PARED[4].hex, { tipo: 'lavable' }), piso: { tipo: 'porcelanato', formato: 'por_60x60', color: COLORES_BALDOSA[2].hex, junta: 2, fragua: COLORES_FRAGUA[1].hex, merma: 8 } }),
    ambienteNuevo('cocina', { nombre: 'Cocina', largo: 3.2, ancho: 2.6, alto: 2.5, vanos: [v('puerta', 0.8, 2.1), v('ventana', 1.2, 0.8, 1.2)],
      enchape: { activo: true, formato: 'cer_10x30', color: COLORES_BALDOSA[0].hex, junta: 2, fragua: COLORES_FRAGUA[0].hex, merma: 12, desde: 0.9, alto: 0.6, largo: 4.2 } }),
    ambienteNuevo('dormitorio', { nombre: 'Dormitorio principal', largo: 4, ancho: 3.5, alto: 2.5, vanos: [v('puerta', 0.9, 2.1), v('ventana', 1.6, 1.2)],
      pintura: pintura(COLORES_PARED[9].hex), piso: { tipo: 'laminado', formato: 'por_20x120', color: COLORES_BALDOSA[7].hex, junta: 0, fragua: COLORES_FRAGUA[0].hex, merma: 8 } }),
    ambienteNuevo('dormitorio', { nombre: 'Dormitorio 2', largo: 3.2, ancho: 3, alto: 2.5, vanos: [v('puerta', 0.8, 2.1), v('ventana', 1.2, 1.2)],
      pintura: pintura(COLORES_PARED[10].hex), piso: { tipo: 'vinilico', formato: 'por_20x120', color: COLORES_BALDOSA[8].hex, junta: 0, fragua: COLORES_FRAGUA[0].hex, merma: 8 } }),
    ambienteNuevo('bano', { nombre: 'Baño', largo: 2.4, ancho: 1.6, alto: 2.4, vanos: [v('puerta', 0.7, 2.1), v('ventana', 0.6, 0.4, 1.8)],
      enchape: { activo: true, formato: 'cer_30x60', color: COLORES_BALDOSA[1].hex, junta: 2, fragua: COLORES_FRAGUA[1].hex, merma: 10, desde: 0, alto: 1.8, largo: 0 },
      piso: { tipo: 'ceramico', formato: 'cer_30x30', color: COLORES_BALDOSA[4].hex, junta: 3, fragua: COLORES_FRAGUA[2].hex, merma: 10 } }),
    ambienteNuevo('lavanderia', { nombre: 'Lavandería', largo: 2, ancho: 1.8, alto: 2.4, vanos: [v('puerta', 0.8, 2.1)],
      enchape: { activo: true, formato: 'cer_25x40', color: COLORES_BALDOSA[3].hex, junta: 2, fragua: COLORES_FRAGUA[2].hex, merma: 10, desde: 0, alto: 1.2, largo: 2 },
      techo: pintura('#ffffff', { empaste: false }), piso: { tipo: 'pulido', formato: 'cer_45x45', color: '#a9a7a2', junta: 0, fragua: COLORES_FRAGUA[2].hex, merma: 5 } }),
  ];
  return { ...cotizacionVacia(), nombre: 'Departamento – acabados completos', cliente: 'Sr. Jorge Huamán', ambientes };
}
