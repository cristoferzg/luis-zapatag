// Presupuesto de obra: datos guardados, totales y cronograma (días hábiles).
import { safeStorage } from '../../lib/storageManager';
import { FUENTES, Lectura, PartidaFuente } from './fuentes';

export interface TareaCrono {
  id: string;            // id del apartado o 'x_…' para una tarea libre
  nombre?: string;       // solo tareas libres
  dias?: number;         // duración editada (si no, la del apartado)
  despuesDe?: string;    // 'anterior' (por defecto) · '' = al inicio · id de otra tarea
  rel?: 'fin' | 'inicio'; // empieza cuando la otra termina, o junto con ella
  desfase?: number;      // días hábiles de espera (+) o de traslape (−)
}
export interface PagoObra { id: string; concepto: string; pct: number; hito: 'inicio' | 'mitad' | 'fin' }
export interface PresupuestoObra {
  id: string;
  nombre: string;
  cliente: string;
  direccion: string;
  incluir: Record<string, boolean>;  // apartado → incluido (sin dato = incluido si tiene datos)
  base: 'directo' | 'venta';         // costo directo + GG/utilidad de aquí, o el precio de cada apartado
  gg: number; util: number; igv: boolean;
  pagos: PagoObra[];
  inicio: string;                    // AAAA-MM-DD
  sabado: boolean;                   // se trabaja el sábado
  orden: string[];                   // orden de las tareas del cronograma
  tareas: Record<string, TareaCrono>;
  notas: string;
  foto?: Record<string, Lectura>;    // montos congelados al guardar
  fotoFecha?: string;
  actualizado?: string;
}

export const KEY_ACTUAL = 'obra_integral_actual';
export const KEY_LISTA = 'obra_integral_lista';
export const KEY_PESTANA = 'obra_integral_pestana';

export const uidObra = () => Math.random().toString(36).slice(2, 10);
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const pagosDefecto = (adelanto = 50): PagoObra[] => {
  const a = Math.min(90, Math.max(10, Math.round(adelanto)));
  const resto = 100 - a, avance = Math.round(resto * 0.6);
  return [
    { id: uidObra(), concepto: 'Adelanto al firmar', pct: a, hito: 'inicio' },
    { id: uidObra(), concepto: 'Avance de obra', pct: avance, hito: 'mitad' },
    { id: uidObra(), concepto: 'A la entrega', pct: resto - avance, hito: 'fin' },
  ];
};
export const presupuestoVacio = (adelanto?: number): PresupuestoObra => ({
  id: uidObra(), nombre: '', cliente: '', direccion: '', incluir: {}, base: 'directo', gg: 10, util: 15, igv: false,
  pagos: pagosDefecto(adelanto), inicio: hoyISO(), sabado: true, orden: FUENTES.map(f => f.id), tareas: {}, notas: '',
});
export const normalizar = (p: Partial<PresupuestoObra> | null | undefined): PresupuestoObra => {
  const v = presupuestoVacio();
  const n = { ...v, ...(p || {}) } as PresupuestoObra;
  const orden = Array.isArray(n.orden) ? n.orden.filter(x => typeof x === 'string') : v.orden;
  // Apartados nuevos que no estaban en el orden guardado: al final, en su orden habitual.
  FUENTES.forEach(f => { if (!orden.includes(f.id)) orden.push(f.id); });
  return {
    ...n, orden, incluir: n.incluir && typeof n.incluir === 'object' ? n.incluir : {}, tareas: n.tareas && typeof n.tareas === 'object' ? n.tareas : {},
    pagos: Array.isArray(n.pagos) && n.pagos.length ? n.pagos : v.pagos, inicio: /^\d{4}-\d{2}-\d{2}$/.test(n.inicio || '') ? n.inicio : v.inicio,
  };
};
export const leerActual = () => normalizar(safeStorage.getItem<PresupuestoObra | null>(KEY_ACTUAL, null));
export const leerLista = (): PresupuestoObra[] => (safeStorage.getItem<PresupuestoObra[]>(KEY_LISTA, []) || []).filter(x => x && x.id);

// ── Totales ─────────────────────────────────────────────────────────────────
export interface SeccionCalc {
  id: string; lectura: Lectura;
  incluida: boolean;
  partidas: (PartidaFuente & { omitida?: string })[]; // omitida = nombre del apartado que ya la cuenta
  directo: number;   // costo directo sin lo repetido
  monto: number;     // lo que suma al presupuesto (directo o precio del apartado)
}
export function calcular(p: PresupuestoObra, lecturas: Record<string, Lectura>) {
  const incluida = (id: string) => !!lecturas[id] && !lecturas[id].vacio && p.incluir[id] !== false;
  const secciones: SeccionCalc[] = FUENTES.filter(f => lecturas[f.id] && !lecturas[f.id].vacio).map(f => {
    const l = lecturas[f.id];
    const partidas = l.partidas.map(x => ({ ...x, omitida: x.origen && x.origen !== f.id && incluida(x.origen) ? FUENTES.find(y => y.id === x.origen)?.nombre : undefined }));
    const directo = Math.round(partidas.filter(x => !x.omitida).reduce((s, x) => s + x.subtotal, 0) * 100) / 100;
    // Con el precio de cada apartado, lo repetido se descuenta en la misma proporción.
    const factor = l.directo > 0 ? l.venta / l.directo : 1;
    const monto = p.base === 'venta' ? Math.round(directo * factor * 100) / 100 : directo;
    return { id: f.id, lectura: l, incluida: incluida(f.id), partidas, directo, monto };
  });
  const incl = secciones.filter(s => s.incluida);
  const directo = incl.reduce((s, x) => s + x.monto, 0);
  const gg = p.base === 'directo' ? directo * p.gg / 100 : 0;
  const util = p.base === 'directo' ? directo * p.util / 100 : 0;
  const subtotal = directo + gg + util;
  const igv = p.igv ? subtotal * 0.18 : 0;
  const total = subtotal + igv;
  // Factor para mostrar cada apartado con su parte de GG y utilidad (sin IGV).
  const factorVenta = directo > 0 ? subtotal / directo : 1;
  return { secciones, incl, directo, gg, util, subtotal, igv, total, factorVenta };
}

// ── Calendario de días hábiles ─────────────────────────────────────────────
const aFecha = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const habil = (d: Date, sabado: boolean) => d.getDay() !== 0 && (sabado || d.getDay() !== 6);
/** Fecha del día hábil número n (0 = el primer día hábil desde el inicio). */
export function fechaHabil(inicio: string, n: number, sabado: boolean): Date {
  const d = aFecha(inicio);
  while (!habil(d, sabado)) d.setDate(d.getDate() + 1);
  let k = 0;
  while (k < n) { d.setDate(d.getDate() + 1); if (habil(d, sabado)) k++; }
  return d;
}
export const fechaCorta = (d: Date) => d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).replace('.', '');
export const fechaLarga = (d: Date) => d.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '');

// Encadenamiento habitual: las instalaciones eléctricas van a la par de las sanitarias.
const POR_DEFECTO: Record<string, Pick<TareaCrono, 'despuesDe' | 'rel'>> = { electricidad: { despuesDe: 'gasfiteria', rel: 'inicio' } };
export interface BarraCrono {
  id: string; nombre: string; color: string; dias: number; diasApartado: number;
  ini: number; fin: number; // días hábiles: [ini, fin) desde el día 0
  despuesDe: string; rel: 'fin' | 'inicio'; desfase: number;
  libre: boolean; estimado?: boolean;
}
export function cronograma(p: PresupuestoObra, lecturas: Record<string, Lectura>, incluidas: Set<string>) {
  const ids = p.orden.filter(id => id.startsWith('x_') ? !!p.tareas[id] : incluidas.has(id));
  const barras: BarraCrono[] = [];
  const porId = new Map<string, BarraCrono>();
  ids.forEach((id, i) => {
    const t = { ...(POR_DEFECTO[id] || {}), ...(p.tareas[id] || { id }) };
    const f = FUENTES.find(x => x.id === id);
    const diasAp = f ? Math.max(1, Math.ceil((lecturas[id]?.dias || 1) - 1e-9)) : 1;
    const dias = Math.max(1, Math.round(t.dias ?? diasAp));
    const despuesDe = t.despuesDe === undefined ? 'anterior' : t.despuesDe;
    const rel = t.rel || 'fin';
    const desfase = Math.round(t.desfase || 0);
    // La referencia tiene que estar antes en el orden (evita ciclos).
    // (si esa tarea no está en el cronograma, va después de la anterior)
    const ref = despuesDe === 'anterior' ? barras[i - 1] : despuesDe ? porId.get(despuesDe) ?? barras[i - 1] : undefined;
    const usaRel = despuesDe && despuesDe !== 'anterior' && porId.has(despuesDe) ? rel : 'fin';
    const base = ref ? (usaRel === 'fin' ? ref.fin : ref.ini) : 0;
    const ini = Math.max(0, base + desfase);
    const b: BarraCrono = { id, nombre: f ? f.nombre : (t.nombre || 'Tarea'), color: f ? f.color : '#6366f1', dias, diasApartado: diasAp, ini, fin: ini + dias,
      despuesDe: despuesDe && despuesDe !== 'anterior' && !porId.has(despuesDe) ? 'anterior' : despuesDe, rel: usaRel, desfase, libre: !f, estimado: f ? lecturas[id]?.diasEstimados : undefined };
    barras.push(b); porId.set(id, b);
  });
  const totalDias = barras.reduce((m, b) => Math.max(m, b.fin), 0);
  const inicio = fechaHabil(p.inicio, 0, p.sabado);
  const entrega = fechaHabil(p.inicio, Math.max(0, totalDias - 1), p.sabado);
  const calendario = Math.round((entrega.getTime() - inicio.getTime()) / 86400000) + 1;
  return { barras, totalDias, inicio, entrega, calendario };
}
/** Fecha de cada pago según su hito. */
export function fechaPago(pg: PagoObra, p: PresupuestoObra, totalDias: number): Date {
  const n = pg.hito === 'inicio' ? 0 : pg.hito === 'mitad' ? Math.floor(Math.max(0, totalDias - 1) / 2) : Math.max(0, totalDias - 1);
  return fechaHabil(p.inicio, n, p.sabado);
}
