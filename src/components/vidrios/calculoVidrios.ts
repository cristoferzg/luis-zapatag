// =============================================================================
// Vidrios y aluminio: geometría de cada trabajo (hojas, paños), despiece de perfiles
// y vidrios, y metrado con precios.
//
//   · Perfiles: cortes en mm por tipo de ventana (rieles, jambas, cabezales, piernas,
//     traslapes, marcos, junquillos…) acomodados en barras de 6 m (mejor ajuste, sierra
//     4 mm, refile 10 mm por punta). Color: recargo % sobre el precio natural.
//   · Vidrio por m²: crudo, laminado, catedral y espejo con el % de desperdicio (se cortan
//     en el taller); el templado se pide a medida (sin desperdicio).
//   · Accesorios por hoja (rodamientos, felpa, jebe, cierres, jaladores, bisagras de piso,
//     pivotes, kit de ducha…), silicona y tornillería por perímetro, mano de obra por m²,
//     unidad, hoja o metro, o por jornal del vidriero.
// =============================================================================
import { clavePerfilAlu, claveVidrio, claveColorAlu, colorAlu, vidrioDe, TipoVidrio, PERFILES_ALU, LARGO_BARRA_ALU, ColorAluminio } from '../../catalogo/vidrios';
import { precio } from '../../lib/catalogoPrecios';
import { Acumulador, Linea, arriba, r2, empacarBarras, Barra, Corte } from '../carpinteria/comun/comun';
import { ItemVidrio, CotizacionVidrios, nombreItem, Sistema } from './modeloVidrios';

export interface HojaGeo { x: number; y: number; w: number; h: number; movil: boolean; dir: -1 | 0 | 1; plano: 0 | 1; gw: number; gh: number; bisagra?: 'izq' | 'der' }
export interface Geo { hojas: HojaGeo[]; marco: number; lamas?: number }

const sistemaDe = (it: ItemVidrio): Sistema => it.tipo === 'mampara' ? (it.sistema === 's3831' ? 's3831' : 's3825') : (it.sistema === 's25' ? 's25' : 's20');

/** Hojas o paños del trabajo (mm, origen arriba a la izquierda del vano, y hacia abajo). */
export function geometria(it: ItemVidrio): Geo {
  const W = Math.round(it.ancho * 1000), H = Math.round(it.alto * 1000);
  const n = Math.max(1, Math.round(it.hojas || 1));
  switch (it.tipo) {
    case 'corrediza': case 'mampara': {
      const mam = it.tipo === 'mampara';
      const j = mam ? 22 : 14, T = mam ? 50 : 40, dh = mam ? 45 : 30;
      const hw = (W - 2 * j + T * (n - 1)) / n, hh = H - dh;
      const planos = n === 4 ? [0, 1, 1, 0] : Array.from({ length: n }, (_, k) => k % 2);
      return {
        marco: j, hojas: Array.from({ length: n }, (_, k) => {
          const plano = planos[k] as 0 | 1, movil = plano === 1 || (!mam && n === 2);
          const dir: -1 | 0 | 1 = !movil ? 0 : n === 4 ? (k === 1 ? -1 : 1) : k === 0 ? 1 : -1;
          return { x: j + k * (hw - T), y: dh / 2, w: hw, h: hh, movil, dir, plano, gw: Math.round(hw - (mam ? 50 : 30)), gh: Math.round(hh - (mam ? 90 : 55)) };
        }),
      };
    }
    case 'proyectante': case 'fija': {
      const m = 25, pw = (W - 2 * m - (n - 1) * m) / n, ph = H - 2 * m;
      const proy = it.tipo === 'proyectante';
      return { marco: m, hojas: Array.from({ length: n }, (_, k) => ({ x: m + k * (pw + m), y: m, w: pw, h: ph, movil: proy, dir: 0, plano: 0, gw: Math.round(pw - (proy ? 60 : 6)), gh: Math.round(ph - (proy ? 60 : 6)) })) };
    }
    case 'celosia': {
      const m = 25, lamas = Math.max(2, Math.ceil((H - 2 * m) / 90));
      return { marco: m, lamas, hojas: [{ x: m, y: m, w: W - 2 * m, h: H - 2 * m, movil: true, dir: 0, plano: 0, gw: W - 2 * m - 10, gh: 100 }] };
    }
    case 'puerta_templada': {
      const g = 3, w = (W - g * (n + 1)) / n, h = H - 10;
      return { marco: 0, hojas: Array.from({ length: n }, (_, k) => ({ x: g + k * (w + g), y: 0, w, h, movil: true, dir: 0, plano: 0, gw: Math.round(w), gh: Math.round(h), bisagra: n === 1 ? it.lado : k === 0 ? 'izq' : 'der' })) };
    }
    case 'ducha': {
      if (it.ducha === 'batiente') {
        const nn = Math.max(2, n), w = (W - 3 * (nn + 1)) / nn;
        return { marco: 0, hojas: Array.from({ length: nn }, (_, k) => ({ x: 3 + k * (w + 3), y: 0, w, h: H, movil: k === 1, dir: 0, plano: 0, gw: Math.round(w), gh: H, bisagra: 'izq' as const })) };
      }
      const T = 50, w = (W + T * (n - 1)) / n;
      return { marco: 0, hojas: Array.from({ length: n }, (_, k) => ({ x: k * (w - T), y: 0, w, h: H, movil: k % 2 === 1, dir: k % 2 === 1 ? -1 : 0, plano: (k % 2) as 0 | 1, gw: Math.round(w), gh: H })) };
    }
    case 'baranda': {
      const c = Math.max(1, Math.ceil(W / 1200)), pinzas = it.baranda === 'pinzas';
      const sep = pinzas ? 60 : 20, w = W / c - sep;
      const gh = pinzas ? H - 60 : H + 50;
      return { marco: 0, hojas: Array.from({ length: c }, (_, k) => ({ x: k * (w + sep) + sep / 2, y: 40, w, h: pinzas ? H - 100 : H - 40, movil: false, dir: 0, plano: 0, gw: Math.round(w), gh: Math.round(gh) })) };
    }
    case 'espejo': default: {
      const m = it.marcoEspejo ? 20 : 0;
      return { marco: m, hojas: [{ x: m, y: m, w: W - 2 * m, h: H - 2 * m, movil: false, dir: 0, plano: 0, gw: W - 2 * m, gh: H - 2 * m }] };
    }
  }
}

export interface CortePerfil { perfil: string; largo: number; n: number; etiqueta: string }
export interface PanoVidrio { nombre: string; w: number; h: number; n: number }
export interface DespieceVid { cortes: CortePerfil[]; panos: PanoVidrio[]; acc: [string, number, string][]; silicona: number; tornillos: number; pernos: number; mo: [string, number][]; dias: number; avisos: string[] }

/** Despiece de UNA unidad. */
export function despieceVid(it: ItemVidrio): DespieceVid {
  const d: DespieceVid = { cortes: [], panos: [], acc: [], silicona: 0, tornillos: 0, pernos: 0, mo: [], dias: 0, avisos: [] };
  const W = Math.round(it.ancho * 1000), H = Math.round(it.alto * 1000);
  const g = geometria(it), n = g.hojas.length;
  const v = vidrioDe(it.vidrio);
  const corte = (perfil: string, largo: number, nn: number, etiqueta: string) => { if (largo > 0 && nn > 0) d.cortes.push({ perfil, largo: Math.round(largo), n: nn, etiqueta }); };
  const perim = (2 * (W + H)) / 1000, m2 = (W * H) / 1e6;
  const marco4 = (perfil: string, etiqueta = 'Marco') => { corte(perfil, W, 2, `${etiqueta} horizontal`); corte(perfil, H, 2, `${etiqueta} vertical`); };
  switch (it.tipo) {
    case 'corrediza': case 'mampara': {
      const s = sistemaDe(it), mam = it.tipo === 'mampara';
      corte(`${s}:riel_sup`, W, 1, 'Riel superior'); corte(`${s}:riel_inf`, W, 1, 'Riel inferior'); corte(`${s}:jamba`, H, 2, 'Jamba');
      const h0 = g.hojas[0];
      corte(`${s}:cabezal`, h0.w, 2 * n, 'Cabezal y zócalo de hoja');
      const piernas = n === 1 ? 2 : 2, traslapes = n === 1 ? 0 : 2 * n - 2;
      corte(`${s}:pierna`, h0.h, piernas, 'Pierna de hoja'); corte(`${s}:traslape`, h0.h, traslapes, 'Traslape de hoja');
      d.panos.push({ nombre: 'Vidrio de hoja', w: h0.gw, h: h0.gh, n });
      const moviles = g.hojas.filter(h => h.movil).length;
      d.acc.push([mam ? 'vid:acc:rodamiento_mampara' : 'vid:acc:rodamiento', 2 * n, '2 por hoja'], ['vid:acc:felpa', r2((n * 2 * (h0.w + h0.h)) / 1000), 'contorno de las hojas'], ['vid:acc:jebe', r2((n * 2 * (h0.gw + h0.gh)) / 1000), 'contorno de los vidrios']);
      if (mam) { d.acc.push(['vid:acc:jalador', Math.max(1, moviles), 'hojas móviles']); if (it.chapa) d.acc.push(['vid:acc:chapa_mampara', 1, '']); else d.acc.push(['vid:acc:pestillo', 1, '']); }
      else d.acc.push(['vid:acc:pestillo', Math.max(1, Math.floor(n / 2)), '']);
      d.silicona += perim / 8; d.tornillos += perim / 0.35 / 100;
      d.mo.push([mam ? 'vid:mo:mampara' : 'vid:mo:ventana', r2(Math.max(0.5, m2))]); d.dias += mam ? 0.4 * m2 + 0.3 : 0.3 * m2 + 0.15;
      if (!mam && s === 's20' && h0.w > 1200) d.avisos.push('Hojas de más de 1.20 m en Sistema 20: usa Sistema 25 o más hojas.');
      if (mam && !v.templado && !it.vidrio.startsWith('laminado')) d.avisos.push('En mamparas usa vidrio templado o laminado (Norma E.040).');
      if (!mam && (h0.gw * h0.gh) / 1e6 > 2 && !v.templado && !it.vidrio.startsWith('laminado')) d.avisos.push('Paños de más de 2 m² en vidrio crudo: usa templado o laminado.');
      break;
    }
    case 'proyectante': {
      marco4('proy:marco');
      if (n > 1) corte('proy:marco', H - 50, n - 1, 'Parante');
      const h0 = g.hojas[0];
      corte('proy:hoja', h0.w, 2 * n, 'Hoja horizontal'); corte('proy:hoja', h0.h, 2 * n, 'Hoja vertical');
      d.panos.push({ nombre: 'Vidrio de hoja', w: h0.gw, h: h0.gh, n });
      d.acc.push(['vid:acc:brazo_proyectante', n, '1 par por hoja'], ['vid:acc:manija_proyectante', n, ''], ['vid:acc:jebe', r2((n * 2 * (h0.w + h0.h + h0.gw + h0.gh)) / 1000), 'hoja y vidrio']);
      d.silicona += perim / 8; d.tornillos += perim / 0.35 / 100;
      d.mo.push(['vid:mo:ventana', r2(Math.max(0.5, m2))]); d.dias += 0.35 * m2 + 0.15;
      break;
    }
    case 'fija': {
      marco4('fijo:marco');
      if (n > 1) corte('fijo:marco', H - 50, n - 1, 'Parante');
      const h0 = g.hojas[0];
      corte('fijo:junquillo', h0.w, 2 * n, 'Junquillo horizontal'); corte('fijo:junquillo', h0.h, 2 * n, 'Junquillo vertical');
      d.panos.push({ nombre: 'Vidrio del paño', w: h0.gw, h: h0.gh, n });
      d.acc.push(['vid:acc:jebe', r2((n * 2 * (h0.gw + h0.gh)) / 1000), 'contorno de los vidrios']);
      d.silicona += perim / 8; d.tornillos += perim / 0.35 / 100;
      d.mo.push(['vid:mo:ventana', r2(Math.max(0.5, m2))]); d.dias += 0.25 * m2 + 0.1;
      if ((h0.gw * h0.gh) / 1e6 > 2.5 && !v.templado && !it.vidrio.startsWith('laminado')) d.avisos.push('Paño fijo grande en vidrio crudo: usa templado o laminado.');
      break;
    }
    case 'celosia': {
      marco4('celosia:marco');
      d.panos.push({ nombre: 'Lama de vidrio (10 cm)', w: g.hojas[0].gw, h: 100, n: g.lamas || 2 });
      d.acc.push(['vid:acc:mecanismo_celosia', Math.ceil(it.ancho / 0.9), 'juego de laterales']);
      d.silicona += perim / 8; d.tornillos += perim / 0.35 / 100;
      d.mo.push(['vid:mo:ventana', r2(Math.max(0.5, m2))]); d.dias += 0.3 * m2 + 0.15;
      break;
    }
    case 'puerta_templada': {
      const h0 = g.hojas[0];
      d.panos.push({ nombre: 'Hoja de templado', w: h0.gw, h: h0.gh, n });
      if (it.sujecion === 'piso') d.acc.push(['vid:acc:bisagra_piso', n, '1 por hoja'], ['vid:acc:pivote', n, 'superior']);
      else d.acc.push(['vid:acc:pivote', 2 * n, 'superior e inferior']);
      d.acc.push(['vid:acc:jalador_templado', n, '1 por hoja']);
      if (it.chapa) d.acc.push(['vid:acc:chapa_templado', 1, '']);
      d.silicona += 0.5; d.pernos += 2 * n;
      d.mo.push(['vid:mo:puerta_templada', n]); d.dias += 0.8 * n;
      if (h0.w > 1100) d.avisos.push('Hoja de templado de más de 1.10 m: muy pesada, usa dos hojas.');
      if (!v.templado) d.avisos.push('Las puertas de vidrio deben ser de templado.');
      break;
    }
    case 'ducha': {
      const fijas = g.hojas.filter(h => !h.movil), moviles = g.hojas.filter(h => h.movil);
      g.hojas.forEach(h => d.panos.push({ nombre: h.movil ? 'Hoja móvil de templado' : 'Paño fijo de templado', w: h.gw, h: h.gh, n: 1 }));
      corte('u:templado', H, Math.min(2, fijas.length), 'U lateral (pared)');
      if (it.ducha === 'corrediza') {
        fijas.forEach(f => corte('u:templado', f.w, 1, 'U inferior del fijo'));
        d.acc.push(['vid:acc:kit_ducha', 1, 'tubo inox, carros y soportes']);
      } else d.acc.push(['vid:acc:bisagra_ducha', moviles.length * (H > 2000 ? 3 : 2), 'pared-vidrio / vidrio-vidrio']);
      d.acc.push(['vid:acc:jalador_ducha', moviles.length, ''], ['vid:acc:sello_ducha', r2((moviles.length * 2 * H) / 1000), 'bordes de la hoja móvil']);
      d.silicona += 1.5; d.tornillos += 0.12;
      d.mo.push(['vid:mo:ducha', 1]); d.dias += 1;
      if (!v.templado) d.avisos.push('La división de ducha debe ser de vidrio templado (8 mm).');
      break;
    }
    case 'baranda': {
      const c = n, pinzas = it.baranda === 'pinzas';
      d.panos.push({ nombre: 'Paño de baranda', w: g.hojas[0].gw, h: g.hojas[0].gh, n: c });
      if (!pinzas) { corte('baranda:base', W, 1, 'Perfil base'); d.pernos += Math.ceil(it.ancho / 0.3); }
      else { d.acc.push(['vid:acc:pinza', 4 * c, '4 por paño'], ['vid:acc:parante', c + 1, '']); d.pernos += 4 * (c + 1); }
      corte('baranda:pasamanos', W, 1, 'Pasamanos');
      d.silicona += it.ancho / 3;
      d.mo.push(['vid:mo:baranda', r2(it.ancho)]); d.dias += 0.35 * it.ancho;
      if (it.alto < 0.9) d.avisos.push('Altura mínima de baranda: 0.90 m (1.00 m en balcones y escaleras).');
      if (!v.templado && !it.vidrio.startsWith('laminado')) d.avisos.push('En barandas usa templado o laminado (Norma E.040).');
      break;
    }
    case 'espejo': {
      const h0 = g.hojas[0];
      d.panos.push({ nombre: 'Espejo', w: h0.gw, h: h0.gh, n: 1 });
      d.acc.push([it.biselado ? 'vid:biselado' : 'vid:canto_pulido', r2((2 * (h0.gw + h0.gh)) / 1000), 'contorno']);
      if (it.marcoEspejo) marco4('espejo:marco', 'Marco del espejo');
      else d.acc.push(['vid:acc:clip_espejo', it.ancho * it.alto > 0.8 ? 6 : 4, '']);
      d.silicona += Math.max(0.5, m2);
      d.mo.push(['vid:mo:espejo', 1]); d.dias += 0.3;
      if (!it.vidrio.startsWith('espejo')) d.avisos.push('Elige un espejo (4 o 6 mm).');
      break;
    }
  }
  return d;
}

// ── Metrado ────────────────────────────────────────────────────────────────
export const GRUPOS_VID = ['Perfiles de aluminio', 'Vidrios', 'Accesorios', 'Consumibles', 'Mano de obra'] as const;
export const COLOR_GRUPO_VID: Record<string, string> = {
  'Perfiles de aluminio': '#64748b', Vidrios: '#0891b2', Accesorios: '#0f766e', Consumibles: '#94a3b8', 'Mano de obra': '#7c3aed',
};
export interface BarrasPerfil { perfil: string; nombre: string; color: ColorAluminio; barras: Barra[]; cortes: number }
export interface FilaPano { item: string; nombre: string; vidrio: string; w: number; h: number; n: number; m2: number }
export interface FilaCorte { item: string; perfil: string; etiqueta: string; largo: number; n: number; color: ColorAluminio }
export interface MetradoVidrios {
  lineas: Linea[]; materiales: number; manoObra: number; directo: number;
  barras: BarrasPerfil[]; nBarras: number; panos: FilaPano[]; cortes: FilaCorte[];
  m2: Partial<Record<TipoVidrio, { neto: number; compra: number }>>; m2Total: number; dias: number; avisos: Map<string, string[]>;
}
const NOMBRE_PERFIL = new Map(PERFILES_ALU.map(([id, n]) => [id, n]));
export const nombrePerfil = (id: string) => NOMBRE_PERFIL.get(id) || id;

export function metradoVidrios(items: ItemVidrio[], cot: Pick<CotizacionVidrios, 'merma' | 'modoMO'>): MetradoVidrios {
  const merma = Math.max(0, cot.merma) / 100;
  const porPerfil = new Map<string, { perfil: string; color: ColorAluminio; cortes: Corte[] }>();
  const m2: MetradoVidrios['m2'] = {};
  const panos: FilaPano[] = [], cortesLista: FilaCorte[] = [];
  const acc = new Acumulador(), cons = new Acumulador(), mo = new Acumulador();
  const avisos = new Map<string, string[]>();
  let silicona = 0, tornillos = 0, pernos = 0, dias = 0;
  items.forEach((it, idx) => {
    const d = despieceVid(it), q = Math.max(1, Math.round(it.cantidad)), nom = nombreItem(it, idx);
    if (d.avisos.length) avisos.set(it.id, d.avisos);
    d.cortes.forEach(c => {
      const k = `${c.perfil}|${it.color}`;
      const g = porPerfil.get(k) || porPerfil.set(k, { perfil: c.perfil, color: it.color, cortes: [] }).get(k)!;
      for (let u = 0; u < c.n * q; u++) g.cortes.push({ etiqueta: `${nom}: ${c.etiqueta}`, largo: c.largo });
      cortesLista.push({ item: nom, perfil: c.perfil, etiqueta: c.etiqueta, largo: c.largo, n: c.n * q, color: it.color });
    });
    d.panos.forEach(p => {
      const a = (p.w * p.h * p.n * q) / 1e6;
      const x = (m2[it.vidrio] ||= { neto: 0, compra: 0 }); x.neto += a;
      panos.push({ item: nom, nombre: p.nombre, vidrio: vidrioDe(it.vidrio).corto, w: p.w, h: p.h, n: p.n * q, m2: r2(a) });
    });
    d.acc.forEach(([k, n, nota]) => acc.add('Accesorios', k, n * q, nota ? `${nom}: ${nota}` : nom));
    silicona += d.silicona * q; tornillos += d.tornillos * q; pernos += d.pernos * q; dias += d.dias * q;
    d.mo.forEach(([k, n]) => mo.add('Mano de obra', k, n * q, nom));
  });
  const lineas: Linea[] = [];
  // Perfiles en barras de 6 m.
  const barras: BarrasPerfil[] = [];
  const perf = new Acumulador();
  porPerfil.forEach(g => {
    const bs = empacarBarras(g.cortes, { largo: LARGO_BARRA_ALU, sierra: 4, refile: 10 });
    const c = colorAlu(g.color);
    const recargo = g.color === 'natural' ? 0 : precio(claveColorAlu(g.color), c.recargo);
    barras.push({ perfil: g.perfil, nombre: nombrePerfil(g.perfil), color: g.color, barras: bs, cortes: g.cortes.length });
    const sobra = bs.reduce((s, b) => s + b.sobrante, 0) / 1000;
    perf.add('Perfiles de aluminio', clavePerfilAlu(g.perfil), bs.length, `${g.cortes.length} cortes · sobran ${sobra.toFixed(2)} m${recargo ? ` · color +${recargo}%` : ''}`,
      { id: `${g.perfil}|${g.color}`, nombre: `${nombrePerfil(g.perfil)} – ${c.nombre.toLowerCase()}`, factor: 1 + recargo / 100 });
  });
  lineas.push(...perf.lineas());
  // Vidrios por m².
  const vid = new Acumulador();
  (Object.keys(m2) as TipoVidrio[]).forEach(t => {
    const x = m2[t]!, tem = vidrioDe(t).templado;
    x.neto = r2(x.neto); x.compra = r2(tem ? x.neto : x.neto * (1 + merma));
    vid.add('Vidrios', claveVidrio(t), x.compra, tem ? `${x.neto} m² a medida (templado, sin desperdicio)` : `${x.neto} m² netos + ${Math.round(merma * 100)}% desperdicio`);
  });
  lineas.push(...vid.lineas());
  const redondeo = (k: string, n: number) => ['vid:acc:felpa', 'vid:acc:jebe', 'vid:acc:sello_ducha', 'vid:biselado', 'vid:canto_pulido'].includes(k) ? arriba(n, 0.5) : Math.ceil(n - 1e-9);
  lineas.push(...acc.lineas(redondeo));
  cons.add('Consumibles', 'vid:silicona', silicona, 'sellado de marcos y vidrios');
  cons.add('Consumibles', 'vid:tornillos', tornillos, 'fijación de marcos');
  cons.add('Consumibles', 'carpi:perno_expansion', pernos, 'anclajes de templado y barandas');
  lineas.push(...cons.lineas((k, n) => k === 'vid:tornillos' ? arriba(n, 0.5) : Math.ceil(n - 1e-9)));
  let lineasMO: Linea[];
  if (cot.modoMO === 'jornal') {
    const j = new Acumulador(); j.add('Mano de obra', 'jornal:vidriero', arriba(dias, 0.5), `${(Math.round(dias * 10) / 10).toLocaleString('es-PE')} días de fabricación e instalación`);
    lineasMO = j.lineas();
  } else lineasMO = mo.lineas((_k, n) => r2(n));
  lineas.push(...lineasMO);
  const manoObra = r2(lineasMO.reduce((s, l) => s + l.subtotal, 0));
  const directo = r2(lineas.reduce((s, l) => s + l.subtotal, 0));
  const m2Total = r2(Object.values(m2).reduce((s, x) => s + (x?.neto || 0), 0));
  return { lineas, materiales: r2(directo - manoObra), manoObra, directo, barras, nBarras: barras.reduce((s, b) => s + b.barras.length, 0), panos, cortes: cortesLista, m2, m2Total, dias: r2(dias), avisos };
}
