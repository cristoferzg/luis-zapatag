// =============================================================================
// Drywall: sistemas, partidas del cotizador, despiece de planchas y metrado.
//
// Lo usan el Cotizador rápido (partidas con medidas), la vista de muro en
// elevación (parantes y planchas numeradas) y el plano sobre la estructura de
// Techos (metradoDrywall). Precios: Catálogo de precios único.
//
// Cuantías referenciales (sistema estándar, parantes a 0.61 m):
//   tabique: parantes = L/0.61 + 1 (+2 jambas por vano), rieles = 2·L + dinteles,
//            tornillo de placa ≈ 25 por m² de placa, de perfil ≈ 4 por parante,
//            fijación de riel cada 0.60 m, masilla ≈ 0.9 kg/m², cinta ≈ 1.5 m/m².
//   cielo:   omegas cada 0.61 m, primario cada 1.22 m, colgador cada 1.2 m²,
//            ángulo perimetral = perímetro.
//   modular: baldosa 0.61 × 0.61, T principal cada 1.22 m, T secundarios.
//   rendimiento (m²/día por instalador): tabique 12, cielo 15, modular 25;
//            cenefa 6 m/día.
// =============================================================================
import { precio, claveDrywall, claveJornal, AREA_PLANCHA_M2, itemCatalogo } from '../../lib/catalogoPrecios';

export const PLANCHA_W = 1.22, PLANCHA_H = 2.44, PIEZA_M = 3;

export interface LineaDrywall { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota?: string }

// ── Sistemas ────────────────────────────────────────────────────────────────
export type SistemaId =
  | 'tabique_1c' | 'tabique_2c' | 'tabique_rh' | 'tabique_rf' | 'tabique_acustico' | 'muro_exterior' | 'muro_tv'
  | 'cielo_plano' | 'cielo_desnivel' | 'cielo_modular' | 'cenefa';
export type FamiliaSistema = 'tabique' | 'cielo' | 'cenefa';
export interface Sistema {
  id: SistemaId; familia: FamiliaSistema; nombre: string; corto: string; emoji: string; descripcion: string;
  placas: string[];       // id de placa por cara (tabiques) o de la placa del cielo
  parante?: '64' | '89';
  lana?: boolean; modular?: boolean; nicho?: boolean; desnivel?: boolean;
}
export const SISTEMAS: Sistema[] = [
  { id: 'tabique_2c', familia: 'tabique', nombre: 'Tabique divisorio (2 caras)', corto: 'Tabique 2 caras', emoji: '🧱', descripcion: 'Divide ambientes: placa estándar por ambos lados.', placas: ['drywall_standard_125', 'drywall_standard_125'], parante: '64' },
  { id: 'tabique_1c', familia: 'tabique', nombre: 'Forro de pared (1 cara)', corto: 'Forro 1 cara', emoji: '🪵', descripcion: 'Reviste un muro existente o tapa tuberías.', placas: ['drywall_standard_125'], parante: '64' },
  { id: 'tabique_rh', familia: 'tabique', nombre: 'Tabique de baño o cocina (RH)', corto: 'Tabique RH', emoji: '🚿', descripcion: 'Placa verde resistente a la humedad.', placas: ['drywall_humedad_125', 'drywall_humedad_125'], parante: '64' },
  { id: 'tabique_rf', familia: 'tabique', nombre: 'Tabique cortafuego (RF)', corto: 'Tabique RF', emoji: '🔥', descripcion: 'Placa rosada resistente al fuego.', placas: ['drywall_fuego_159', 'drywall_fuego_159'], parante: '89' },
  { id: 'tabique_acustico', familia: 'tabique', nombre: 'Tabique acústico (con lana)', corto: 'Tabique acústico', emoji: '🔇', descripcion: 'Dormitorios y oficinas: lana de vidrio dentro.', placas: ['drywall_standard_125', 'drywall_standard_125'], parante: '89', lana: true },
  { id: 'muro_exterior', familia: 'tabique', nombre: 'Muro exterior (fibrocemento)', corto: 'Muro exterior', emoji: '🏠', descripcion: 'Fibrocemento afuera y drywall adentro.', placas: ['fibrocemento_8', 'drywall_standard_125'], parante: '89' },
  { id: 'muro_tv', familia: 'tabique', nombre: 'Muro de TV con nicho', corto: 'Muro TV', emoji: '📺', descripcion: 'Muro decorativo con nicho iluminado.', placas: ['drywall_standard_125', 'drywall_standard_125'], parante: '64', nicho: true },
  { id: 'cielo_plano', familia: 'cielo', nombre: 'Cielo raso plano', corto: 'Cielo plano', emoji: '⬜', descripcion: 'Falso techo liso de drywall.', placas: ['drywall_standard_125'] },
  { id: 'cielo_desnivel', familia: 'cielo', nombre: 'Cielo raso con desnivel', corto: 'Cielo con desnivel', emoji: '🔲', descripcion: 'Cielo con cajón perimetral (para luz indirecta).', placas: ['drywall_standard_125'], desnivel: true },
  { id: 'cielo_modular', familia: 'cielo', nombre: 'Cielo raso modular 60 × 60', corto: 'Cielo modular', emoji: '▦', descripcion: 'Baldosas desmontables sobre perfiles T (oficinas, locales).', placas: [], modular: true },
  { id: 'cenefa', familia: 'cenefa', nombre: 'Cenefa / cajón de luz LED', corto: 'Cenefa LED', emoji: '💡', descripcion: 'Cajón lineal para cortinas o luz LED.', placas: ['drywall_standard_125'] },
];
export const sistemaDe = (id: SistemaId) => SISTEMAS.find(s => s.id === id) || SISTEMAS[0];

// ── Partidas del cotizador ──────────────────────────────────────────────────
export type TipoVano = 'puerta' | 'ventana';
export interface VanoPartida { id: string; tipo: TipoVano; w: number; h: number; sill: number; x?: number }
export interface Partida {
  id: string;
  sistema: SistemaId;
  nombre: string;          // ambiente o referencia ("Sala", "Muro baño")
  largo: number;           // m
  alto: number;            // m (tabique) · ancho (cielo) · alto del cajón (cenefa)
  cantidad: number;        // repetir la misma partida
  vanos: VanoPartida[];
  nicho?: { w: number; h: number; prof: number; sill: number };
  cajon?: { ancho: number; alto: number }; // desnivel del cielo / sección de la cenefa
  nivel?: string;          // piso de Obra Civil al que se suma (opcional)
}
export const PRESET_VANO: Record<TipoVano, { w: number; h: number; sill: number; nombre: string }> = {
  puerta: { w: 0.9, h: 2.1, sill: 0, nombre: 'Puerta' },
  ventana: { w: 1.2, h: 1.0, sill: 1.0, nombre: 'Ventana' },
};
export const uid = () => Math.random().toString(36).slice(2, 9);

export function partidaNueva(sistema: SistemaId): Partida {
  const s = sistemaDe(sistema);
  if (s.familia === 'cielo') return { id: uid(), sistema, nombre: '', largo: 4, alto: 3, cantidad: 1, vanos: [], ...(s.desnivel ? { cajon: { ancho: 0.4, alto: 0.25 } } : {}) };
  if (s.familia === 'cenefa') return { id: uid(), sistema, nombre: '', largo: 3, alto: 0.25, cantidad: 1, vanos: [], cajon: { ancho: 0.3, alto: 0.25 } };
  return { id: uid(), sistema, nombre: '', largo: 3, alto: 2.6, cantidad: 1, vanos: [], ...(s.nicho ? { nicho: { w: 1.6, h: 0.9, prof: 0.15, sill: 0.9 } } : {}) };
}

export const areaVanos = (p: Partida) => p.vanos.reduce((x, v) => x + v.w * v.h, 0);
// m² que se muestran de la partida: muro neto, cielo o metros de cenefa.
export function medidaPartida(p: Partida): { valor: number; unidad: string } {
  const s = sistemaDe(p.sistema);
  if (s.familia === 'cenefa') return { valor: p.largo * p.cantidad, unidad: 'm' };
  if (s.familia === 'cielo') return { valor: p.largo * p.alto * p.cantidad, unidad: 'm²' };
  return { valor: Math.max(0, p.largo * p.alto - areaVanos(p)) * p.cantidad, unidad: 'm²' };
}

// ── Despiece de planchas de un muro (por cara) ──────────────────────────────
// Planchas verticales de 1.22 × 2.44 desde la izquierda y desde el piso. Los
// trozos que tocan un vano se marcan como "corte". Los retazos se juntan en
// una misma plancha cuando comparten ancho (se apilan) o alto (lado a lado).
export interface PiezaPlancha { x: number; y: number; w: number; h: number; corte: boolean; plancha: number }
export interface DespieceCara { piezas: PiezaPlancha[]; planchas: number }

const solapa = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
  a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.h - 1e-6 && b.y < a.y + a.h - 1e-6;

export function posicionVanos(p: { largo: number; vanos: VanoPartida[] }): (VanoPartida & { x: number })[] {
  // Vanos sin posición: repartidos de forma pareja a lo largo del muro.
  const n = p.vanos.length;
  return p.vanos.map((v, i) => ({ ...v, x: v.x !== undefined ? v.x : Math.max(0, Math.min(p.largo - v.w, (p.largo * (i + 1)) / (n + 1) - v.w / 2)) }));
}

export function despieceCara(L: number, H: number, vanos: { x: number; w: number; h: number; sill: number }[]): DespieceCara {
  const piezas: PiezaPlancha[] = [];
  for (let x = 0; x < L - 1e-6; x += PLANCHA_W) {
    for (let y = 0; y < H - 1e-6; y += PLANCHA_H) {
      const r = { x, y, w: Math.min(PLANCHA_W, L - x), h: Math.min(PLANCHA_H, H - y) };
      // El trozo que queda dentro de un vano no se coloca (si lo cubre todo).
      const dentro = vanos.some(v => r.x >= v.x - 1e-6 && r.x + r.w <= v.x + v.w + 1e-6 && r.y >= v.sill - 1e-6 && r.y + r.h <= v.sill + v.h + 1e-6);
      if (dentro) continue;
      const corte = r.w < PLANCHA_W - 1e-6 || r.h < PLANCHA_H - 1e-6 || vanos.some(v => solapa(r, { x: v.x, y: v.sill, w: v.w, h: v.h }));
      piezas.push({ ...r, corte, plancha: 0 });
    }
  }
  // Asignar planchas: enteras 1 a 1; retazos agrupados.
  let n = 0;
  const grupos: { w: number; h: number; usadoW: number; usadoH: number; modo: 'v' | 'h' | 'a'; area: number; idx: number }[] = [];
  const orden = piezas.map((p, i) => ({ p, i })).sort((a, b) => b.p.w * b.p.h - a.p.w * a.p.h);
  for (const { p } of orden) {
    const llenaW = p.w >= PLANCHA_W - 1e-6, llenaH = p.h >= PLANCHA_H - 1e-6;
    if (llenaW && llenaH && !p.corte) { p.plancha = ++n; continue; }
    // Un trozo grande con corte (por un vano) usa su propia plancha; su sobrante no se cuenta.
    if (llenaW && llenaH) { p.plancha = ++n; grupos.push({ w: PLANCHA_W, h: PLANCHA_H, usadoW: PLANCHA_W, usadoH: PLANCHA_H, modo: 'v', area: PLANCHA_W * PLANCHA_H, idx: n }); continue; }
    let g = grupos.find(g =>
      (llenaW && g.modo === 'v' && g.usadoH + p.h <= PLANCHA_H + 1e-6) ||
      (llenaH && !llenaW && g.modo === 'h' && g.usadoW + p.w <= PLANCHA_W + 1e-6) ||
      (!llenaW && !llenaH && g.area + p.w * p.h <= PLANCHA_W * PLANCHA_H * 0.8));
    if (!g) { g = { w: PLANCHA_W, h: PLANCHA_H, usadoW: 0, usadoH: 0, modo: llenaW ? 'v' : llenaH ? 'h' : 'a', area: 0, idx: ++n }; grupos.push(g); }
    g.usadoH += p.h; g.usadoW += p.w; g.area += p.w * p.h;
    p.plancha = g.idx;
  }
  return { piezas, planchas: n };
}

// Parantes de un muro: cada 0.61 m, extremos y jambas de cada vano.
export function posicionParantes(L: number, vanos: { x: number; w: number }[]): number[] {
  const xs: number[] = [];
  for (let x = 0; x < L - 0.05; x += 0.61) xs.push(Math.round(x * 1000) / 1000);
  xs.push(L);
  vanos.forEach(v => { xs.push(v.x, v.x + v.w); });
  const unicos = [...new Set(xs.map(x => Math.round(x * 100) / 100))].sort((a, b) => a - b);
  // Los parantes que caen dentro de un vano se cortan (quedan como "cripples" arriba/abajo).
  return unicos;
}

// ── Acumulador de materiales ────────────────────────────────────────────────
export interface Acumulado {
  planchas: Map<string, number>;   // clave de placa → planchas (ya contadas)
  placaM2: Map<string, number>;    // clave de placa → m² (se pasa a planchas con 5%)
  placaAcabadoM2: number;          // m² de placa a masillar y atornillar
  parantes: { '64': number; '89': number }; // piezas de 3 m
  rielM: { '64': number; '89': number };
  parantesCuenta: number;
  vanosPerimetro: number; esquineroExtraM: number;
  cieloM2: number; omegaM: number; primarioM: number; anguloM: number; colgadores: number;
  lanaM2: number;
  modularM2: number; modularPerim: number;
  cenefaM: number; ledM: number;
  tabiqueM2: number;
}
export const acumuladoVacio = (): Acumulado => ({
  planchas: new Map(), placaM2: new Map(), placaAcabadoM2: 0, parantes: { '64': 0, '89': 0 }, rielM: { '64': 0, '89': 0 }, parantesCuenta: 0,
  vanosPerimetro: 0, esquineroExtraM: 0, cieloM2: 0, omegaM: 0, primarioM: 0, anguloM: 0, colgadores: 0, lanaM2: 0, modularM2: 0, modularPerim: 0, cenefaM: 0, ledM: 0, tabiqueM2: 0,
});
const sumar = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) || 0) + v);

// Tabique con su alto (hMax para piezas de parante), placas por cara y vanos.
// planchasPorCara: si se conoce el despiece exacto, en vez de m² + 5%.
export function agregarTabique(a: Acumulado, o: { L: number; areaNeta: number; hMax: number; placas: string[]; vanos: { w: number; h: number; sill: number }[]; parante: '64' | '89'; lana?: boolean; planchasPorCara?: number[]; veces?: number }) {
  const k = o.veces ?? 1;
  o.placas.forEach((id, i) => {
    const clave = claveDrywall(id);
    if (o.planchasPorCara) sumar(a.planchas, clave, o.planchasPorCara[i] * k);
    else sumar(a.placaM2, clave, o.areaNeta * k);
  });
  a.placaAcabadoM2 += o.areaNeta * o.placas.length * k;
  a.tabiqueM2 += o.areaNeta * k;
  const nPar = (Math.ceil(o.L / 0.61) + 1 + o.vanos.length * 2) * Math.max(1, Math.ceil(o.hMax / PIEZA_M));
  a.parantes[o.parante] += nPar * k;
  a.parantesCuenta += nPar * k;
  a.rielM[o.parante] += (2 * o.L + o.vanos.reduce((x, v) => x + v.w * (v.sill > 0 ? 2 : 1), 0)) * k;
  a.vanosPerimetro += o.vanos.reduce((x, v) => x + 2 * v.h + v.w * (v.sill > 0 ? 2 : 1), 0) * k;
  if (o.lana) a.lanaM2 += o.areaNeta * k;
}
export function agregarCielo(a: Acumulado, area: number, perimetro: number, placaId: string) {
  sumar(a.placaM2, claveDrywall(placaId), area);
  a.placaAcabadoM2 += area; a.cieloM2 += area;
  a.omegaM += area / 0.61; a.primarioM += area / 1.22; a.anguloM += perimetro; a.colgadores += area / 1.2;
}
export function agregarCieloModular(a: Acumulado, area: number, perimetro: number) {
  a.modularM2 += area; a.modularPerim += perimetro; a.colgadores += area / 1.2;
}
// Cajón: dos caras verticales (alto) y una horizontal (ancho) por metro.
export function agregarCenefa(a: Acumulado, L: number, ancho: number, alto: number, placaId: string, led: boolean) {
  const area = L * (2 * alto + ancho);
  sumar(a.placaM2, claveDrywall(placaId), area);
  a.placaAcabadoM2 += area; a.cenefaM += L;
  a.omegaM += L * 2; a.rielM['64'] += L * 2; a.esquineroExtraM += L * 2;
  a.parantes['64'] += Math.ceil(L / 0.61) * ((alto + ancho) / PIEZA_M); a.parantesCuenta += Math.ceil(L / 0.61);
  if (led) a.ledM += L;
}

const linea = (clave: string, cantidad: number, nota?: string): LineaDrywall => {
  const it = itemCatalogo(clave);
  const p = precio(clave);
  return { clave, nombre: it?.nombre || clave, unidad: it?.unidad || 'und', cantidad, precio: p, subtotal: cantidad * p, nota };
};

export interface ResultadoDrywall { lineas: LineaDrywall[]; materiales: number; dias: number; manoObra: number; total: number }

export function lineasDe(a: Acumulado): ResultadoDrywall {
  const lineas: LineaDrywall[] = [];
  const claves = new Set([...a.planchas.keys(), ...a.placaM2.keys()]);
  claves.forEach(clave => {
    const exactas = a.planchas.get(clave) || 0;
    const m2 = a.placaM2.get(clave) || 0;
    const n = exactas + (m2 > 0 ? Math.ceil((m2 * 1.05) / AREA_PLANCHA_M2) : 0);
    const nota = [exactas ? `${exactas} por despiece` : '', m2 ? `${m2.toFixed(1)} m² + 5%` : ''].filter(Boolean).join(' · ');
    if (n > 0) lineas.push(linea(clave, n, nota));
  });
  (['64', '89'] as const).forEach(t => {
    if (a.parantes[t] > 0) lineas.push(linea(`dw:parante_${t}`, Math.ceil(a.parantes[t]), t === '64' && a.primarioM > 0 && a.tabiqueM2 === 0 ? 'perfil primario' : 'cada 0.61 m + jambas'));
    if (a.rielM[t] > 0) lineas.push(linea(t === '89' ? 'dw:riel_90' : 'dw:riel_65', Math.ceil(a.rielM[t] / PIEZA_M), `${a.rielM[t].toFixed(1)} m`));
  });
  const rielTotal = a.rielM['64'] + a.rielM['89'];
  if (rielTotal > 0) lineas.push(linea('dw:fijacion', Math.ceil(rielTotal / 2 / 0.6 / 100), 'riel inferior cada 0.60 m'));
  if (a.parantesCuenta > 0) lineas.push(linea('dw:tornillo_perfil', Math.ceil((a.parantesCuenta * 4) / 100), '4 por parante'));
  const esq = a.vanosPerimetro + a.esquineroExtraM;
  if (esq > 0) lineas.push(linea('dw:esquinero', Math.ceil(esq / PIEZA_M), 'bordes de vanos y cajones'));
  if (a.lanaM2 > 0) lineas.push(linea('dw:lana', Math.ceil(a.lanaM2 * 1.05), 'dentro del tabique'));
  if (a.omegaM > 0) lineas.push(linea('dw:omega', Math.ceil(a.omegaM / PIEZA_M), 'viguetas cada 0.61 m'));
  if (a.primarioM > 0) lineas.push(linea('dw:parante_64', Math.ceil(a.primarioM / PIEZA_M), 'perfil primario del cielo cada 1.22 m'));
  if (a.anguloM + a.modularPerim > 0) lineas.push(linea('dw:angulo', Math.ceil((a.anguloM + a.modularPerim) / PIEZA_M), 'perímetro del cielo'));
  if (a.colgadores > 0) lineas.push(linea('dw:colgador', Math.ceil(a.colgadores), '1 cada 1.2 m²'));
  if (a.modularM2 > 0) {
    lineas.push(linea('dw:baldosa_6060', Math.ceil((a.modularM2 / (0.61 * 0.61)) * 1.05), 'baldosas + 5%'));
    lineas.push(linea('dw:t_principal', Math.ceil(a.modularM2 / 1.22 / 3.66), 'cada 1.22 m'));
    lineas.push(linea('dw:t_sec_122', Math.ceil(a.modularM2 / (1.22 * 0.61)), 'entre principales'));
    lineas.push(linea('dw:t_sec_061', Math.ceil(a.modularM2 / (1.22 * 1.22)), 'cierra el módulo 0.61'));
  }
  if (a.ledM > 0) lineas.push(linea('dw:cinta_led', Math.ceil(a.ledM / 5), `${a.ledM.toFixed(1)} m de cajón`));
  if (a.placaAcabadoM2 > 0) {
    lineas.push(linea('dw:tornillo_placa', Math.ceil((a.placaAcabadoM2 * 25) / 100), '≈ 25 por m² de placa'));
    lineas.push(linea('dw:masilla', Math.ceil((a.placaAcabadoM2 * 0.9) / 28), '≈ 0.9 kg/m², balde 28 kg'));
    lineas.push(linea('dw:cinta', Math.ceil((a.placaAcabadoM2 * 1.5) / 75), '≈ 1.5 m/m², rollo 75 m'));
  }
  const materiales = lineas.reduce((x, l) => x + l.subtotal, 0);
  const dias = Math.round((a.tabiqueM2 / 12 + a.cieloM2 / 15 + a.modularM2 / 25 + a.cenefaM / 6) * 10) / 10;
  const manoObra = dias * precio(claveJornal('Instalador de drywall'));
  return { lineas, materiales, dias, manoObra, total: materiales + manoObra };
}

// ── Partidas → acumulado ────────────────────────────────────────────────────
export function despiecePartida(p: Partida): { caras: DespieceCara[]; vanos: (VanoPartida & { x: number })[] } {
  const s = sistemaDe(p.sistema);
  const vanos = posicionVanos(p);
  const vs = [...vanos.map(v => ({ x: v.x, w: v.w, h: v.h, sill: v.sill }))];
  // El nicho del muro de TV solo atraviesa la cara frontal.
  const cara0 = p.nicho ? [...vs, { x: (p.largo - p.nicho.w) / 2, w: p.nicho.w, h: p.nicho.h, sill: p.nicho.sill }] : vs;
  return { caras: s.placas.map((_, i) => despieceCara(p.largo, p.alto, i === 0 ? cara0 : vs)), vanos };
}

export function agregarPartida(a: Acumulado, p: Partida) {
  const s = sistemaDe(p.sistema);
  const k = Math.max(1, p.cantidad || 1);
  if (s.familia === 'tabique') {
    const { caras } = despiecePartida(p);
    const areaNeta = Math.max(0, p.largo * p.alto - areaVanos(p));
    agregarTabique(a, { L: p.largo, areaNeta, hMax: p.alto, placas: s.placas, vanos: p.vanos, parante: s.parante || '64', lana: s.lana, planchasPorCara: caras.map(c => c.planchas), veces: k });
    if (p.nicho) {
      // Fondo y costados del nicho, con su esquinero y luz LED.
      const n = p.nicho;
      const extra = (2 * (n.w + n.h) * n.prof) * k;
      sumar(a.placaM2, claveDrywall(s.placas[0]), extra);
      a.placaAcabadoM2 += extra; a.esquineroExtraM += 2 * (n.w + n.h) * k; a.ledM += n.w * k;
      a.rielM[s.parante || '64'] += 2 * (n.w + n.h) * k;
    }
  } else if (s.familia === 'cielo') {
    for (let i = 0; i < k; i++) {
      const area = p.largo * p.alto, per = 2 * (p.largo + p.alto);
      if (s.modular) agregarCieloModular(a, area, per);
      else agregarCielo(a, area, per, s.placas[0]);
      if (s.desnivel && p.cajon) agregarCenefa(a, per, p.cajon.ancho, p.cajon.alto, s.placas[0], true);
    }
  } else {
    const c = p.cajon || { ancho: 0.3, alto: 0.25 };
    for (let i = 0; i < k; i++) agregarCenefa(a, p.largo, c.ancho, c.alto, s.placas[0], true);
  }
}

export function metradoPartidas(partidas: Partida[]): ResultadoDrywall {
  const a = acumuladoVacio();
  partidas.forEach(p => agregarPartida(a, p));
  return lineasDe(a);
}
