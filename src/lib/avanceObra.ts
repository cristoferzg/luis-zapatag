// Avance de obra: partidas con %, partes diarios con fotos e informe para el cliente.
// Todo se guarda DENTRO del proyecto (`project.avance`), sin colecciones nuevas.
// Las fotos se comprimen en el equipo (JPEG ~1600 px) y se suben a Storage en
// `obras/<workspace>/<projectId>/...`; si la subida falla quedan en memoria como
// "pendiente de subir" y se pueden reintentar.
import { useSyncExternalStore } from 'react';
import type { Project, AvanceObra, PartidaAvance, FotoAvance, ParteDiario } from '../types';
import { uploadFileToFirebaseStorage } from './storage';

export const PARTIDAS_RAPIDAS = ['Cimentación', 'Muros', 'Techo', 'Instalaciones', 'Acabados', 'Limpieza'];
export const CLIMAS: { id: NonNullable<ParteDiario['clima']>; label: string; emoji: string }[] = [
  { id: 'soleado', label: 'Soleado', emoji: '☀️' },
  { id: 'nublado', label: 'Nublado', emoji: '☁️' },
  { id: 'lluvia', label: 'Lluvia', emoji: '🌧️' },
  { id: 'viento', label: 'Viento', emoji: '💨' },
  { id: 'calor', label: 'Calor', emoji: '🔥' },
];

export const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
export const avanceVacio = (): AvanceObra => ({ partidas: [], partes: [] });
export const avanceDe = (p: Project): AvanceObra => ({ ...avanceVacio(), ...(p.avance || {}) });
const lim = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
export const limitarPct = lim;

/** % global ponderado por el peso (costo) de cada partida; sin pesos, todas pesan igual. */
export function avanceGlobal(partidas: PartidaAvance[]): number {
  if (!partidas.length) return 0;
  const conPeso = partidas.some(x => (Number(x.peso) || 0) > 0);
  let s = 0, t = 0;
  for (const x of partidas) { const w = conPeso ? Math.max(0, Number(x.peso) || 0) : 1; s += lim(x.avance) * w; t += w; }
  return t > 0 ? Math.round((s / t) * 10) / 10 : 0;
}

/** Plazo en días: el del avance o el texto libre del proyecto ("15 días", "3 semanas", "2 meses"). */
export function plazoEnDias(p: Project): number | null {
  if (p.avance?.plazoDias && p.avance.plazoDias > 0) return p.avance.plazoDias;
  const m = /(\d+(?:[.,]\d+)?)\s*(d|sem|mes)?/i.exec(p.plazoEstimado || '');
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  const u = (m[2] || 'd').toLowerCase();
  const d = Math.round(u.startsWith('sem') ? n * 7 : u.startsWith('mes') ? n * 30 : n);
  return d > 0 ? d : null;
}

const aFecha = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
export const diasEntre = (a: string, b: string) => Math.round((aFecha(b).getTime() - aFecha(a).getTime()) / 86400000);

export function fechaInicio(p: Project): string | null {
  const a = p.avance;
  if (a?.fechaInicio) return a.fechaInicio;
  const primera = [...(a?.partes || [])].map(x => x.fecha).sort()[0];
  const fp = /^\d{4}-\d{2}-\d{2}/.test(p.date || '') ? p.date.slice(0, 10) : null;
  if (fp && primera) return fp < primera ? fp : primera;
  return fp || primera || null;
}

/** Días transcurridos (contando el primero) vs plazo, y el % que "debería" llevar a la fecha. */
export function tiempoObra(p: Project) {
  const ini = fechaInicio(p), plazo = plazoEnDias(p);
  if (!ini) return null;
  const dias = Math.max(0, diasEntre(ini, hoyISO()) + 1);
  const esperado = plazo ? Math.min(100, Math.round((dias / plazo) * 100)) : null;
  return { inicio: ini, dias, plazo, esperado, restantes: plazo ? plazo - dias : null };
}

export const totalCobrado = (p: Project) => (p.cobros || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
/** Cobro sugerido = % de avance × presupuesto − lo ya cobrado. */
export const cobroSugerido = (p: Project, pct: number) =>
  Math.round(((pct / 100) * (Number(p.presupuesto) || 0) - totalCobrado(p)) * 100) / 100;

/** Partidas sugeridas desde lo que ya tiene el proyecto: materiales por categoría y techo acordado. */
export function partidasDesdeProyecto(p: Project): PartidaAvance[] {
  const out: PartidaAvance[] = [];
  const porCat = new Map<string, number>();
  (p.materiales || [])
    .filter(m => !m.id?.startsWith('mat-imp-') && !m.id?.startsWith('mat-gasto-'))
    .forEach(m => {
      const cat = (m.category || '').trim() || 'Materiales';
      const costo = (Number(m.quantity) || 0) * (Number(m.unitPrice ?? m.price) || 0);
      porCat.set(cat, (porCat.get(cat) || 0) + costo);
    });
  porCat.forEach((costo, cat) => out.push({ id: nuevoId(), nombre: cat, avance: 0, peso: Math.round(costo * 100) / 100 || undefined, origen: 'materiales' }));
  const t = p.techos;
  if (t && (t.acordado || t.disenoId)) out.push({ id: nuevoId(), nombre: `Techo metálico${t.disenoNombre ? ` · ${t.disenoNombre}` : ''}`, avance: 0, peso: t.acordado?.total || undefined, origen: 'techos' });
  return out;
}

export const fechaLarga = (iso: string) => {
  try { return aFecha(iso).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return iso; }
};
export const fechaCortaAv = (iso: string) => {
  try { return aFecha(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return iso; }
};
export const fmtPct = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString('es-PE', { maximumFractionDigits: 1 })} %`;

/** Texto para WhatsApp: "Avance al 65 %…" */
export function textoWhatsApp(p: Project, empresa?: string): string {
  const a = avanceDe(p), pct = avanceGlobal(a.partidas), t = tiempoObra(p);
  const ult = [...a.partes].sort((x, y) => (y.fecha + y.creadoEn).localeCompare(x.fecha + x.creadoEn))[0];
  const l: string[] = [];
  l.push(`*${p.name}* — Avance al ${fmtPct(pct)}`);
  if (t) l.push(t.plazo ? `Día ${t.dias} de ${t.plazo} del plazo.` : `Día ${t.dias} de obra.`);
  if (a.partidas.length) {
    l.push('');
    a.partidas.forEach(x => l.push(`${lim(x.avance) >= 100 ? '✅' : '▫️'} ${x.nombre}: ${lim(x.avance)} %`));
  }
  if (ult) {
    l.push('', `Último parte (${fechaCortaAv(ult.fecha)}):${ult.nota ? ` ${ult.nota}` : ''}`);
    if (ult.fotos.length) l.push(`${ult.fotos.length} foto${ult.fotos.length > 1 ? 's' : ''} en el informe.`);
  }
  l.push('', `Saludos${empresa ? `, ${empresa}` : ''}.`);
  return l.join('\n');
}

// ── Fotos: compresión y subida con cola local ──────────────────────────────

/** Reduce a ~1600 px de lado mayor y lo pasa a JPEG (en el equipo, antes de subir). */
export async function comprimirFoto(file: Blob, max = 1600, calidad = 0.8): Promise<{ blob: Blob; dataUrl: string; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = c.toDataURL('image/jpeg', calidad);
    const blob = await (await fetch(dataUrl)).blob();
    return { blob, dataUrl, w, h };
  } finally { URL.revokeObjectURL(url); }
}

/** Ruta en Storage a partir del enlace de descarga (…/o/<ruta>?alt=media…). */
export const rutaDesdeUrl = (url: string) => { const m = /\/o\/([^?]+)/.exec(url); return m ? decodeURIComponent(m[1]) : ''; };

export interface FotoLocal {
  id: string; projectId: string; ws: string; parteId: string | null;
  dataUrl: string; blob: Blob; w: number; h: number;
  estado: 'subiendo' | 'error' | 'lista'; progreso: number; foto?: FotoAvance; error?: string;
}

const locales = new Map<string, FotoLocal>();
const subs = new Set<() => void>();
let version = 0;
const emitir = () => { version++; subs.forEach(f => f()); };
const suscribir = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const cambiar = (id: string, p: Partial<FotoLocal>) => { const f = locales.get(id); if (f) { locales.set(id, { ...f, ...p }); emitir(); } };

/** Fotos en el equipo (subiendo, con error o listas para pegarse a su parte). */
export function useFotosLocales(projectId?: string): FotoLocal[] {
  useSyncExternalStore(suscribir, () => version);
  return [...locales.values()].filter(f => !projectId || f.projectId === projectId);
}
/** Saca de la cola las fotos ya subidas que pertenecen a un parte guardado (para pegarlas al proyecto). */
export function tomarFotosListas(): FotoLocal[] {
  const l = [...locales.values()].filter(f => f.estado === 'lista' && f.parteId && f.foto);
  if (l.length) { l.forEach(f => locales.delete(f.id)); emitir(); }
  return l;
}
export const suscribirFotosLocales = suscribir;

function subir(id: string) {
  const f = locales.get(id); if (!f) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) { cambiar(id, { estado: 'error', error: 'Sin conexión' }); return; }
  cambiar(id, { estado: 'subiendo', progreso: 0, error: undefined });
  const archivo = new File([f.blob], `${f.parteId || 'parte'}_${id}.jpg`, { type: 'image/jpeg' });
  let ultimo = Date.now(), terminado = false;
  // Si no avanza en 45 s se marca "pendiente" (la subida puede terminar igual más tarde).
  const vigia = setInterval(() => {
    if (terminado) { clearInterval(vigia); return; }
    if (Date.now() - ultimo > 45000) { clearInterval(vigia); cambiar(id, { estado: 'error', error: 'La subida no avanza' }); }
  }, 5000);
  uploadFileToFirebaseStorage(archivo, `obras/${f.ws}/${f.projectId}`, pct => { ultimo = Date.now(); cambiar(id, { progreso: Math.round(pct) }); })
    .then(url => { terminado = true; cambiar(id, { estado: 'lista', progreso: 100, foto: { id, url, path: rutaDesdeUrl(url), w: f.w, h: f.h } }); })
    .catch(e => { terminado = true; cambiar(id, { estado: 'error', error: String(e?.message || e).slice(0, 120) }); })
    .finally(() => clearInterval(vigia));
}

export async function agregarFotoLocal(file: File, projectId: string, ws: string): Promise<void> {
  const c = await comprimirFoto(file);
  const id = nuevoId();
  locales.set(id, { id, projectId, ws, parteId: null, ...c, estado: 'subiendo', progreso: 0 });
  emitir();
  subir(id);
}
export const reintentarFoto = (id: string) => subir(id);
export const reintentarPendientes = (projectId: string) => locales.forEach(f => { if (f.projectId === projectId && f.estado === 'error') subir(f.id); });
export const quitarFotoLocal = (id: string) => { if (locales.delete(id)) emitir(); };
export const asignarParte = (ids: string[], parteId: string) => { ids.forEach(id => { const f = locales.get(id); if (f) locales.set(id, { ...f, parteId }); }); emitir(); };

// ── Solo en desarrollo: avance de ejemplo con fotos generadas (capturas) ───
// Se activa con `window.__avanceSimulado = true` antes de abrir el avance de un proyecto.
export function avanceSimuladoDev(p: Project): AvanceObra | null {
  if (!import.meta.env.DEV || !(window as any).__avanceSimulado) return null;
  const foto = (txt: string, h1: number, h2: number, i: number): FotoAvance => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 480;
    const x = c.getContext('2d')!;
    const g = x.createLinearGradient(0, 0, 0, 480); g.addColorStop(0, `hsl(${h1},55%,72%)`); g.addColorStop(1, `hsl(${h2},35%,42%)`);
    x.fillStyle = g; x.fillRect(0, 0, 640, 480);
    x.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 7; k++) x.fillRect(40 + k * 85, 200 - (k % 3) * 40, 60, 280);
    x.fillStyle = 'rgba(15,23,42,.55)'; x.fillRect(0, 400, 640, 80);
    x.fillStyle = '#fff'; x.font = 'bold 34px sans-serif'; x.fillText(txt, 24, 452);
    return { id: `sim${i}`, url: c.toDataURL('image/jpeg', 0.7), path: '', w: 640, h: 480 };
  };
  const hoy = hoyISO(), dia = (n: number) => { const d = aFecha(hoy); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA'); };
  const partidas: PartidaAvance[] = [
    { id: 'pc', nombre: 'Cimentación', avance: 100, peso: 9800 },
    { id: 'pm', nombre: 'Muros', avance: 80, peso: 14500 },
    { id: 'pt', nombre: 'Techo', avance: 45, peso: 12200 },
    { id: 'pi', nombre: 'Instalaciones', avance: 30, peso: 6400 },
    { id: 'pa', nombre: 'Acabados', avance: 0, peso: 8100 },
  ];
  const partes: ParteDiario[] = [
    { id: 's1', fecha: dia(9), avances: [{ partidaId: 'pc', de: 60, a: 100 }], nota: 'Vaciado de zapatas y cimiento corrido. Curado con agua.', personal: 5, clima: 'soleado', creadoEn: '1', fotos: [foto('Zapatas', 30, 25, 1), foto('Cimiento corrido', 35, 20, 2)] },
    { id: 's2', fecha: dia(4), avances: [{ partidaId: 'pm', de: 40, a: 80 }, { partidaId: 'pi', de: 10, a: 30 }], nota: 'Asentado de ladrillo en 2.º nivel; tuberías empotradas en muros.', personal: 6, clima: 'nublado', creadoEn: '2', fotos: [foto('Muro eje A', 15, 10, 3), foto('Muro eje B', 18, 12, 4), foto('Tuberías', 200, 210, 5), foto('Vista general', 40, 30, 6)] },
    { id: 's3', fecha: dia(1), avances: [{ partidaId: 'pt', de: 10, a: 45 }], nota: 'Montaje de vigas y correas del techo. Mañana se colocan las planchas.', personal: 4, clima: 'viento', creadoEn: '3', fotos: [foto('Vigas', 210, 220, 7), foto('Correas', 205, 215, 8), foto('Avance techo', 195, 225, 9)] },
  ];
  return { partidas, partes, fechaInicio: dia(12), plazoDias: p.avance?.plazoDias || 30, actualizado: new Date().toISOString() };
}
