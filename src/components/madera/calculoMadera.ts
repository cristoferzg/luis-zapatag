// =============================================================================
// Carpintería de madera: despiece de cada ítem y metrado con precios.
//
//   · Madera sólida en PIES TABLARES: p2 = espesor(pulg) × ancho(pulg) × largo(pies) / 12,
//     con secciones comerciales (1 1/2" × 2" el bastidor, 1 1/2" × 4" el marco…) y el
//     % de desperdicio de la cotización.
//   · Tableros (MDF, triplay, OSB): las piezas se acomodan en planchas con el mismo
//     optimizador de Melamina (sierra 4 mm, refile 5 mm). Pisos y cielos en tablero: por m².
//   · Acabado por m² (rendimientos por galón), consumibles (cola, clavos, tornillos, lija),
//     herrajes y mano de obra del carpintero por unidad / m² / paso, o por jornal.
// =============================================================================
import { MaderaSolida, MaderaTablero, Madera, esSolida, clavePt, claveTablero, PLANCHA, NOMBRE_MADERA } from '../../catalogo/madera';
import { optimizar, TableroCortado } from '../melamina/optimizador';
import { Acumulador, Linea, arriba, r2 } from '../carpinteria/comun/comun';
import { ItemMadera, CotizacionMadera, Acabado, nombreItem } from './modeloMadera';

const IN = 0.0254;
const PIE = 0.3048;
export interface PiezaS { nombre: string; madera: MaderaSolida; e: number; a: number; largo: number; n: number } // pulgadas, m
export interface PiezaT { nombre: string; madera: MaderaTablero; esp: number; largo: number; ancho: number; n: number; porArea?: boolean } // m
export interface DespieceItem {
  solidas: PiezaS[]; tableros: PiezaT[]; herrajes: [string, number, string][]; area: number;
  mo: [string, number][]; dias: number; cola: number; clavos: number; tornillos: number; avisos: string[];
}
export const p2De = (p: { e: number; a: number; largo: number; n: number }) => (p.e * p.a * (p.largo / PIE)) / 12 * p.n;
export const pulgTxt = (n: number) => {
  const ent = Math.floor(n + 1e-6), fr = n - ent;
  const f = fr > 0.7 ? '3/4' : fr > 0.4 ? '1/2' : fr > 0.1 ? '1/4' : '';
  return `${ent || ''}${ent && f ? ' ' : ''}${f}"`;
};
export const seccionTxt = (p: PiezaS) => `${pulgTxt(p.e)} × ${pulgTxt(p.a)}`;

const CHAPA_CLAVE: Record<string, string> = { perilla: 'mad:chapa_perilla', dos_golpes: 'mad:chapa_dos_golpes', manija: 'mad:chapa_manija', closet: 'mad:chapa_closet' };

function vacio(): DespieceItem { return { solidas: [], tableros: [], herrajes: [], area: 0, mo: [], dias: 0, cola: 0, clavos: 0, tornillos: 0, avisos: [] }; }

function marco(d: DespieceItem, W: number, H: number, m: MaderaSolida) {
  d.solidas.push(
    { nombre: 'Jamba del marco', madera: m, e: 1.5, a: 4, largo: H + 0.05, n: 2 },
    { nombre: 'Cabezal del marco', madera: m, e: 1.5, a: 4, largo: W + 0.10, n: 1 },
    { nombre: 'Contramarco vertical', madera: m, e: 0.5, a: 2.5, largo: H + 0.08, n: 4 },
    { nombre: 'Contramarco horizontal', madera: m, e: 0.5, a: 2.5, largo: W + 0.22, n: 2 },
  );
  d.area += (2 * H + W) * 0.23;
  d.clavos += 0.15; d.tornillos += 0.12; d.cola += 0.05;
  d.mo.push(['mad:mo:marco', 1]); d.dias += 0.5;
}

/** Despiece de UNA unidad del ítem. */
export function despieceItem(it: ItemMadera): DespieceItem {
  const d = vacio();
  const W = Math.max(0.1, it.ancho), H = Math.max(0.1, it.alto), D = Math.max(0.1, it.prof);
  const chapa = (n = 1) => { if (it.chapa !== 'ninguna' && CHAPA_CLAVE[it.chapa]) d.herrajes.push([CHAPA_CLAVE[it.chapa], n, '']); };
  switch (it.tipo) {
    case 'puerta_contraplacada': {
      const tab = (esSolida(it.madera) ? 'mdf' : it.madera) as MaderaTablero;
      const esp = tab === 'triplay' ? 4 : tab === 'mdf' ? 5.5 : it.espesor;
      const nT = Math.max(4, Math.round(H / 0.5) + 1);
      d.solidas.push(
        { nombre: 'Larguero del bastidor', madera: 'pino', e: 1.5, a: 2, largo: H, n: 2 },
        { nombre: 'Travesaño del bastidor', madera: 'pino', e: 1.5, a: 2, largo: W - 4 * IN, n: nT },
        { nombre: 'Tapacanto', madera: 'pino', e: 0.5, a: 2, largo: 2 * H + W, n: 1 },
      );
      if (it.chapa !== 'ninguna') d.solidas.push({ nombre: 'Taco para la cerradura', madera: 'pino', e: 1.5, a: 4, largo: 0.4, n: 1 });
      d.tableros.push({ nombre: 'Cara de la puerta', madera: tab, esp, largo: H, ancho: W, n: 2 });
      d.herrajes.push(['mad:bisagra_capuchina', it.bisagras, '3 1/2"'], ['mad:tope', 1, '']); chapa();
      d.area += 2 * W * H + 0.045 * (2 * H + W);
      d.cola += 0.2; d.clavos += 0.25; d.tornillos += 0.1;
      d.mo.push(['mad:mo:puerta_contraplacada', 1]); d.dias += 1.5;
      if (it.marco) marco(d, W, H, it.maderaMarco);
      if (W > 1.0) d.avisos.push('Hoja de más de 1.00 m: considera dos hojas.');
      if (H > 2.4) d.avisos.push('Más alta que la plancha (2.44 m): la cara llevará empalme.');
      break;
    }
    case 'puerta_apanelada': {
      const m = (esSolida(it.madera) ? it.madera : 'cedro') as MaderaSolida;
      const P = [2, 4, 6].includes(it.paneles) ? it.paneles : 4;
      const cols = P >= 4 ? 2 : 1, rows = P / cols;
      const pw = (W - 2 * 5 * IN - (cols - 1) * 5 * IN) / cols, ph = (H - 5 * IN - 8 * IN - (rows - 1) * 6 * IN) / rows;
      d.solidas.push(
        { nombre: 'Larguero', madera: m, e: 1.75, a: 5, largo: H, n: 2 },
        { nombre: 'Travesaño superior', madera: m, e: 1.75, a: 5, largo: W - 10 * IN, n: 1 },
        { nombre: 'Travesaño inferior', madera: m, e: 1.75, a: 8, largo: W - 10 * IN, n: 1 },
      );
      if (rows > 1) d.solidas.push({ nombre: 'Travesaño intermedio', madera: m, e: 1.75, a: 6, largo: W - 10 * IN, n: rows - 1 });
      if (cols > 1) d.solidas.push({ nombre: 'Montante central', madera: m, e: 1.75, a: 5, largo: ph, n: rows });
      d.solidas.push(
        { nombre: 'Tablero (panel)', madera: m, e: 1, a: Math.ceil((pw + 0.02) / IN), largo: ph + 0.02, n: P },
        { nombre: 'Junquillo / moldura (total lineal)', madera: m, e: 0.5, a: 0.75, largo: P * 2 * 2 * (pw + ph), n: 1 },
      );
      d.herrajes.push(['mad:bisagra_capuchina', it.bisagras, '4" para puerta pesada'], ['mad:tope', 1, '']); chapa();
      d.area += 2 * W * H * 1.15 + 0.045 * (2 * H + W);
      d.cola += 0.4; d.clavos += 0.2; d.tornillos += 0.12;
      d.mo.push(['mad:mo:puerta_apanelada', 1]); d.dias += 4;
      if (it.marco) marco(d, W, H, it.maderaMarco);
      if (m === 'pino') d.avisos.push('El pino no es para exterior: en puerta principal usa cedro o tornillo.');
      if (pw < 0.15) d.avisos.push('Los paneles quedan muy angostos: usa menos paneles.');
      break;
    }
    case 'marco': {
      marco(d, W, H, (esSolida(it.madera) ? it.madera : 'tornillo') as MaderaSolida);
      break;
    }
    case 'closet': case 'mueble': {
      const t = (esSolida(it.madera) ? 19 : it.espesor) / 1000;
      const z = 0.08, hc = 0.18;
      const hojas = Math.max(1, Math.round(it.hojas)), comps = hojas >= 2 ? Math.ceil(hojas / 2) : 1;
      const cw = (W - 2 * t - (comps - 1) * t) / comps;
      const filas = Math.max(0, Math.round(it.filasCajones)), nc = filas * comps;
      const hp = H - z - filas * hc - 0.006;
      const paneles: [string, number, number, number][] = [ // nombre, largo, ancho, n
        ['Costado', H, D, 2], ['Techo y piso', W - 2 * t, D, 2], ['Zócalo', W - 2 * t, z, 1],
      ];
      if (comps > 1) paneles.push(['División', H - 2 * t - z, D - 0.02, comps - 1]);
      if (it.repisas > 0) paneles.push(['Repisa', cw, D - 0.03, Math.round(it.repisas)]);
      if (nc) paneles.push(['Frente de cajón', cw - 0.004, hc - 0.004, nc], ['Costado de cajón', D - 0.1, 0.15, 2 * nc], ['Frente y trasera interior de cajón', cw - 0.06, 0.15, 2 * nc]);
      // Puertas: 2 por compartimiento (el último puede llevar 1).
      const anchos = new Map<number, number>();
      for (let c = 0; c < comps; c++) {
        const enEste = c === comps - 1 ? hojas - 2 * (comps - 1) : 2;
        const w = r2((cw - 0.004 * enEste) / Math.max(1, enEste) * 1000) / 1000;
        anchos.set(w, (anchos.get(w) || 0) + Math.max(1, enEste));
      }
      if (hp > 0.1) anchos.forEach((n, w) => paneles.push(['Puerta', hp, w, n]));
      paneles.forEach(([nombre, largo, ancho, n]) => {
        if (largo <= 0 || ancho <= 0 || n <= 0) return;
        if (esSolida(it.madera)) d.solidas.push({ nombre, madera: it.madera, e: 0.75, a: Math.ceil(Math.min(largo, ancho) / IN), largo: Math.max(largo, ancho), n });
        else d.tableros.push({ nombre, madera: it.madera as MaderaTablero, esp: it.espesor, largo, ancho, n });
      });
      const fondo: MaderaTablero = it.madera === 'mdf' ? 'mdf' : 'triplay';
      // Fondo en paños que entren en la plancha (se unen sobre las divisiones).
      const nF = Math.max(1, Math.ceil(W / (PLANCHA[fondo].A - 0.01)));
      d.tableros.push({ nombre: nF > 1 ? `Fondo (${nF} paños)` : 'Fondo', madera: fondo, esp: fondo === 'mdf' ? 5.5 : 4, largo: H - z, ancho: r2(W / nF), n: nF });
      if (nc) d.tableros.push({ nombre: 'Fondo de cajón', madera: fondo, esp: fondo === 'mdf' ? 5.5 : 4, largo: cw - 0.06, ancho: D - 0.1, n: nc });
      const nPuertas = hp > 0.1 ? hojas : 0;
      if (nPuertas) d.herrajes.push(['mad:bisagra_cangrejo', nPuertas * it.bisagras, `${it.bisagras} por puerta`]);
      if (nc) d.herrajes.push(['mad:riel_cajon', nc, '1 par por cajón']);
      if (it.tirador) d.herrajes.push(['mad:tirador', nPuertas + nc, 'puertas y cajones']);
      if (it.colgador && it.tipo === 'closet') d.herrajes.push(['mad:barra_colgador', r2(comps * cw), `${comps} barra(s)`]);
      chapa();
      const frente = W * H;
      d.area += 2 * frente + 2 * H * D;
      d.cola += frente / 12; d.clavos += 0.2; d.tornillos += frente / 2;
      d.mo.push([it.tipo === 'closet' ? 'mad:mo:closet' : 'mad:mo:mueble', r2(frente)]); d.dias += (it.tipo === 'closet' ? 1.3 : 1.5) * frente;
      if (it.tipo === 'closet' && it.colgador && D < 0.55) d.avisos.push('Para colgar ropa la profundidad mínima es 0.55 m.');
      if (cw > 1.2) d.avisos.push('Compartimientos de más de 1.20 m: las repisas se pandean; agrega hojas.');
      if (hp > 2.44) d.avisos.push('Puertas más altas que la plancha (2.44 m).');
      break;
    }
    case 'piso': case 'cielo': {
      const piso = it.tipo === 'piso';
      const A = W * H;
      if (esSolida(it.madera)) {
        d.solidas.push({ nombre: piso ? 'Machihembrado 3/4" (ancho útil 3 1/2")' : 'Machihembrado 1/2" (ancho útil 3 1/2")', madera: it.madera, e: piso ? 0.75 : 0.5, a: 4, largo: r2(A / (3.5 * IN)), n: 1 });
        d.solidas.push(piso
          ? { nombre: 'Contrazócalo', madera: it.madera, e: 0.75, a: 3, largo: 2 * (W + H), n: 1 }
          : { nombre: 'Moldura perimetral', madera: it.madera, e: 0.75, a: 1.5, largo: 2 * (W + H), n: 1 });
      } else {
        d.tableros.push({ nombre: piso ? 'Entablado de piso' : 'Forro de cielo', madera: it.madera as MaderaTablero, esp: it.espesor, largo: H, ancho: W, n: 1, porArea: true });
      }
      const sep = piso ? 0.4 : 0.5;
      d.solidas.push(piso
        ? { nombre: 'Durmiente @ 40 cm', madera: 'tornillo', e: 2, a: 3, largo: H, n: Math.ceil(W / sep) + 1 }
        : { nombre: 'Listón de bastidor @ 50 cm', madera: 'pino', e: 2, a: 2, largo: H, n: Math.ceil(W / sep) + 1 });
      if (!piso) d.solidas.push({ nombre: 'Listón perimetral', madera: 'pino', e: 2, a: 2, largo: 2 * (W + H), n: 1 });
      d.area += A;
      d.clavos += (piso ? 0.15 : 0.12) * A; d.tornillos += piso ? 0 : A / 8;
      d.mo.push([piso ? 'mad:mo:piso' : 'mad:mo:cielo', r2(A)]); d.dias += (piso ? 0.12 : 0.15) * A;
      if (piso && it.madera === 'pino') d.avisos.push('El pino es blando para pisos de tránsito: mejor tornillo o cedro.');
      break;
    }
    case 'escalera': {
      const m = (esSolida(it.madera) ? it.madera : 'tornillo') as MaderaSolida;
      const n = Math.max(2, Math.ceil(H / 0.18)), pasos = n - 1, run = pasos * 0.25;
      const zanca = Math.hypot(H, run) + 0.3;
      d.solidas.push(
        { nombre: 'Zanca', madera: m, e: 2, a: 10, largo: zanca, n: 2 },
        { nombre: 'Paso (huella 25 cm)', madera: m, e: 1.5, a: 11, largo: W, n: pasos },
        { nombre: 'Contrapaso', madera: m, e: 0.75, a: 7, largo: W, n },
        { nombre: 'Pasamanos', madera: m, e: 2, a: 3, largo: zanca, n: 1 },
        { nombre: 'Balaustre', madera: m, e: 1.5, a: 1.5, largo: 0.9, n: 2 * pasos },
        { nombre: 'Poste de arranque y llegada', madera: m, e: 3, a: 3, largo: 1.1, n: 2 },
      );
      d.area += pasos * W * 0.28 * 2 + n * W * (H / n) + 2 * zanca * 0.25 * 2 + zanca * 0.25 + 2 * pasos * 0.9 * 0.15;
      d.cola += 0.3; d.clavos += 0.3; d.tornillos += pasos * 0.08;
      d.mo.push(['mad:mo:escalera', pasos]); d.dias += 0.6 * pasos;
      if (H / n > 0.19) d.avisos.push('Contrapaso mayor a 19 cm: la escalera queda empinada.');
      break;
    }
  }
  return d;
}

export const datosEscalera = (it: ItemMadera) => { const n = Math.max(2, Math.ceil(it.alto / 0.18)); return { n, pasos: n - 1, contrapaso: it.alto / n, huella: 0.25 }; };

// ── Metrado de la cotización ─────────────────────────────────────────────────
export const GRUPOS_MADERA = ['Madera sólida', 'Tableros', 'Herrajes', 'Acabado', 'Consumibles', 'Mano de obra'] as const;
export const COLOR_GRUPO_MADERA: Record<string, string> = {
  'Madera sólida': '#9a5b34', Tableros: '#c9a77c', Herrajes: '#64748b', Acabado: '#d97706', Consumibles: '#94a3b8', 'Mano de obra': '#7c3aed',
};
export interface FilaDespiece { item: string; nombre: string; material: string; seccion: string; largo: number; ancho?: number; n: number; p2?: number }
export interface PlanchasMat { clave: string; nombre: string; L: number; A: number; tableros: TableroCortado[]; porArea?: number }
export interface MetradoMadera {
  lineas: Linea[]; materiales: number; manoObra: number; directo: number;
  p2: Partial<Record<MaderaSolida, { neto: number; compra: number }>>; planchas: PlanchasMat[];
  area: number; dias: number; despiece: FilaDespiece[]; avisos: Map<string, string[]>; nPlanchas: number;
}

const RENDIMIENTO: Record<Exclude<Acabado, 'ninguno'>, [string, number][]> = {
  laca: [['mad:sellador', 14], ['mad:laca', 10]],
  tinte: [['mad:tinte', 30], ['mad:sellador', 14], ['mad:laca', 10]],
  barniz: [['mad:barniz', 12]],
  duco: [['mad:sellador', 14], ['mad:duco', 9]],
};
export const NOMBRE_ACABADO: Record<Acabado, string> = { laca: 'laca', tinte: 'tinte y laca', barniz: 'barniz', duco: 'duco', ninguno: 'sin acabado' };

export function metradoMadera(items: ItemMadera[], cot: Pick<CotizacionMadera, 'merma' | 'modoMO'>): MetradoMadera {
  const ac = new Acumulador();
  const merma = Math.max(0, cot.merma) / 100;
  const p2: MetradoMadera['p2'] = {};
  const notasP2 = new Map<MaderaSolida, Set<string>>();
  const piezasTab = new Map<string, { m: MaderaTablero; esp: number; piezas: { id: string; nombre: string; mueble: string; largo: number; ancho: number }[]; area: number; notas: Set<string> }>();
  const despiece: FilaDespiece[] = [];
  const areaPorAcabado = new Map<Acabado, number>();
  const avisos = new Map<string, string[]>();
  let area = 0, dias = 0, cola = 0, clavos = 0, tornillos = 0;
  const herrajes = new Acumulador();
  const mo = new Acumulador();

  items.forEach((it, idx) => {
    const d = despieceItem(it), q = Math.max(1, Math.round(it.cantidad));
    const nom = nombreItem(it, idx);
    if (d.avisos.length) avisos.set(it.id, d.avisos);
    d.solidas.forEach(p => {
      const v = p2De(p) * q;
      const x = (p2[p.madera] ||= { neto: 0, compra: 0 }); x.neto += v;
      (notasP2.get(p.madera) || notasP2.set(p.madera, new Set()).get(p.madera)!).add(nom);
      despiece.push({ item: nom, nombre: p.nombre, material: NOMBRE_MADERA[p.madera], seccion: seccionTxt(p), largo: p.largo, n: p.n * q, p2: r2(v) });
    });
    d.tableros.forEach((p, j) => {
      const k = claveTablero(p.madera, p.esp);
      const g = piezasTab.get(k) || piezasTab.set(k, { m: p.madera, esp: p.esp, piezas: [], area: 0, notas: new Set() }).get(k)!;
      g.notas.add(nom);
      if (p.porArea) g.area += p.largo * p.ancho * p.n * q;
      else for (let u = 0; u < p.n * q; u++) g.piezas.push({ id: `${it.id}-${j}-${u}`, nombre: p.nombre, mueble: nom, largo: Math.round(p.largo * 1000), ancho: Math.round(p.ancho * 1000) });
      despiece.push({ item: nom, nombre: p.nombre, material: `${NOMBRE_MADERA[p.madera]} ${p.esp} mm`, seccion: p.porArea ? 'por m²' : `${p.esp} mm`, largo: p.largo, ancho: p.ancho, n: p.n * q });
    });
    d.herrajes.forEach(([k, n, nota]) => herrajes.add('Herrajes', k, n * q, nota ? `${nom}: ${nota}` : nom));
    if (it.acabado !== 'ninguno') areaPorAcabado.set(it.acabado, (areaPorAcabado.get(it.acabado) || 0) + d.area * q);
    area += it.acabado !== 'ninguno' ? d.area * q : 0;
    dias += d.dias * q;
    cola += d.cola * q; clavos += d.clavos * q; tornillos += d.tornillos * q;
    d.mo.forEach(([k, n]) => mo.add('Mano de obra', k, n * q, nom));
  });

  // Madera sólida (p2 con desperdicio, redondeado al pie tablar).
  (Object.keys(p2) as MaderaSolida[]).forEach(m => {
    const x = p2[m]!; x.neto = r2(x.neto); x.compra = Math.ceil(x.neto * (1 + merma));
    ac.add('Madera sólida', clavePt(m), x.compra, `${f1(x.neto)} p2 netos + ${Math.round(merma * 100)} % desperdicio · ${[...(notasP2.get(m) || [])].slice(0, 3).join(', ')}`);
  });
  // Tableros (optimizador de planchas).
  const planchas: PlanchasMat[] = [];
  let nPlanchas = 0;
  piezasTab.forEach((g, k) => {
    const pl = PLANCHA[g.m];
    const res = g.piezas.length ? optimizar(g.piezas, { largo: pl.L * 1000, ancho: pl.A * 1000, sierra: 4, refile: 5 }) : { tableros: [], sobredimensionadas: [] };
    // Piezas más grandes que la plancha (van con empalme): por área.
    const extraSobre = res.sobredimensionadas.reduce((s, p) => s + (p.largo * p.ancho) / (pl.L * pl.A * 1e6), 0) * 1.1;
    const porArea = g.area > 0 ? Math.ceil((g.area * (1 + merma)) / (pl.L * pl.A)) : 0;
    const n = res.tableros.length + Math.ceil(extraSobre) + porArea;
    nPlanchas += n;
    const nombre = `${NOMBRE_MADERA[g.m]} ${g.esp} mm`;
    planchas.push({ clave: k, nombre, L: pl.L, A: pl.A, tableros: res.tableros, porArea: porArea || undefined });
    const nota = [
      res.tableros.length ? `${res.tableros.length} con plano de cortes` : '',
      porArea ? `${porArea} por área (${f1(g.area)} m² + ${Math.round(merma * 100)} %)` : '',
      extraSobre ? `${Math.ceil(extraSobre)} por piezas con empalme` : '',
    ].filter(Boolean).join(' · ');
    ac.add('Tableros', k, n, nota);
  });
  // Acabado (por m²).
  const acab = new Acumulador();
  let thinner = 0, lija = 0, masilla = 0;
  areaPorAcabado.forEach((A, a) => {
    if (a === 'ninguno') return;
    RENDIMIENTO[a].forEach(([k, rinde]) => { acab.add('Acabado', k, A / rinde, `${f1(A)} m² de ${NOMBRE_ACABADO[a]}`); if (k !== 'mad:barniz' && k !== 'mad:tinte') thinner += A / rinde * 0.8; else thinner += A / rinde * 0.5; });
    lija += A / (a === 'duco' ? 1 : 1.3);
    if (a === 'duco') masilla += A * 0.12;
  });
  acab.add('Acabado', 'pintura:thinner', thinner, 'para diluir y limpiar');
  // Consumibles.
  const cons = new Acumulador();
  cons.add('Consumibles', 'mad:cola', cola, 'armado y encolado');
  cons.add('Consumibles', 'mad:clavos', clavos, '');
  cons.add('Consumibles', 'mad:tornillos', tornillos, 'herrajes y fijación');
  cons.add('Consumibles', 'mad:lija', lija, '3 granos (80, 120, 220)');
  cons.add('Consumibles', 'mad:masilla', masilla, 'resanes para el duco');
  // Mano de obra.
  let lineasMO: Linea[];
  if (cot.modoMO === 'jornal') {
    const diasAcab = area * 0.08;
    const moJ = new Acumulador();
    moJ.add('Mano de obra', 'jornal:carpintero de madera', arriba(dias + diasAcab, 0.5), `${f1(dias)} días de fabricación e instalación + ${f1(diasAcab)} de acabado`);
    lineasMO = moJ.lineas();
  } else {
    if (area > 0) mo.add('Mano de obra', 'mad:mo:acabado', area, `${f1(area)} m² de acabado`);
    lineasMO = mo.lineas((_k, n) => r2(n));
  }
  const redondeo = (k: string, n: number) => {
    if (k === 'mad:clavos' || k === 'mad:masilla') return arriba(n, 0.5);
    if (k === 'mad:lija' || k.startsWith('mad:pt:') || k.startsWith('mad:tab:')) return Math.ceil(n - 1e-9);
    if (k === 'mad:tornillos') return arriba(n, 0.5);
    if (k === 'mad:barra_colgador') return arriba(n, 0.5);
    if (['mad:cola', 'mad:sellador', 'mad:laca', 'mad:barniz', 'mad:tinte', 'mad:duco', 'pintura:thinner'].includes(k)) return arriba(n, 0.25);
    return Math.ceil(n - 1e-9);
  };
  const lineas = [...ac.lineas(redondeo), ...herrajes.lineas(redondeo), ...acab.lineas(redondeo), ...cons.lineas(redondeo), ...lineasMO];
  const manoObra = r2(lineasMO.reduce((s, l) => s + l.subtotal, 0));
  const directo = r2(lineas.reduce((s, l) => s + l.subtotal, 0));
  return { lineas, materiales: r2(directo - manoObra), manoObra, directo, p2, planchas, area: r2(area), dias: r2(dias), despiece, avisos, nPlanchas };
}
const f1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString('es-PE');
export type { Madera };
