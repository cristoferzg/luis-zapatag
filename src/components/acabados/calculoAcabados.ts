// =============================================================================
// Acabados: metrado por ambiente y lista de materiales de la obra.
//   · Paredes: perímetro × alto − puertas y ventanas − enchape → m² de pintura.
//   · Enchape: largo enchapado × alto (desde una altura, p. ej. 0.90 m en cocina).
//   · Piso: área de la planta; contrazócalo = perímetro − puertas.
//   · Pintura en galones por color (m² × manos ÷ rendimiento), empaste e imprimante.
//   · Cerámico / porcelanato en cajas por formato y color (con su desperdicio),
//     pegamento, fragua (fórmula de consumo por junta), crucetas o niveladores, perfiles.
//   · Mano de obra por m² / ml, o por jornal del pintor y del enchapador.
// =============================================================================
import { precio, claveJornal, itemCatalogo } from '../../lib/catalogoPrecios';
import { formato, nombreFormato, claveBaldosa, esGrande, clavePintura, PINTURAS, COLORES_PARED, COLORES_BALDOSA, COLORES_FRAGUA, nombreColor } from '../../catalogo/acabados';
import { Ambiente, CotizacionAcabados, areaPiso, perimetro, esBaldosa, Vano } from './modeloAcabados';

export type GrupoLinea = 'Pintura y empaste' | 'Pisos y enchapes' | 'Pegamento y fragua' | 'Accesorios' | 'Mano de obra';
export const GRUPOS_LINEA: GrupoLinea[] = ['Pintura y empaste', 'Pisos y enchapes', 'Pegamento y fragua', 'Accesorios', 'Mano de obra'];
export interface LineaAcab { grupo: GrupoLinea; clave: string; nombre: string; nota: string; cant: number; unidad: string; precio: number; subtotal: number }

/** Metrado de un ambiente (m², ml). */
export interface CalcAmbiente {
  amb: Ambiente; area: number; per: number;
  paredBruta: number; vanos: number; puertasAncho: number;
  enchape: number; enchapeLargo: number; enchapeAlto: number;
  pintura: number; techo: number; piso: number; contrazocalo: number; perfilMl: number;
  /** m² de baldosa por formato|color (piso, contrazócalo cortado y enchape), ya con desperdicio */
  baldosas: { formato: string; color: string; m2: number; m2Neto: number; fragua: string; junta: number; pared: boolean }[];
}
const r2 = (n: number) => Math.round(n * 100) / 100;
const solape = (v: Vano, y0: number, y1: number) => Math.max(0, Math.min(v.sill + v.h, y1) - Math.max(v.sill, y0));

export function calcularAmbiente(a: Ambiente): CalcAmbiente {
  const area = areaPiso(a), per = perimetro(a), H = a.alto;
  const paredBruta = per * H;
  const vanos = a.vanos.reduce((s, v) => s + v.w * Math.min(v.h, Math.max(0, H - v.sill)), 0);
  const puertasAncho = a.vanos.filter(v => v.tipo === 'puerta').reduce((s, v) => s + v.w, 0);
  // Enchape (proporcional: los vanos se reparten a lo largo del perímetro).
  let enchape = 0, enchapeLargo = 0, enchapeAlto = 0, perfilMl = 0;
  if (a.enchape.activo) {
    enchapeLargo = a.enchape.largo > 0 ? Math.min(a.enchape.largo, per) : per;
    enchapeAlto = Math.max(0, Math.min(H - a.enchape.desde, a.enchape.alto));
    const frac = per > 0 ? enchapeLargo / per : 0;
    const y0 = a.enchape.desde, y1 = a.enchape.desde + enchapeAlto;
    const desc = a.vanos.reduce((s, v) => s + v.w * solape(v, y0, y1), 0) * frac;
    enchape = Math.max(0, enchapeLargo * enchapeAlto - desc);
    // Perfiles: remate superior (si no llega al techo), cantos de un enchape parcial y de las ventanas.
    if (y1 < H - 0.02) perfilMl += enchapeLargo;
    if (a.enchape.largo > 0 && enchapeLargo < per - 0.01) perfilMl += 2 * enchapeAlto;
    a.vanos.filter(v => v.tipo === 'ventana').forEach(v => { const h = solape(v, y0, y1); if (h > 0) perfilMl += (2 * h + (v.sill >= y0 ? v.w : 0)) * frac; });
  }
  const pintura = a.pintura.activo ? Math.max(0, paredBruta - vanos - enchape) : 0;
  const techo = a.techo.activo ? area : 0;
  const piso = a.piso.tipo !== 'ninguno' ? area : 0;
  const contrazocalo = a.contrazocalo.activo && a.piso.tipo !== 'ninguno' ? Math.max(0, per - puertasAncho) : 0;
  const baldosas: CalcAmbiente['baldosas'] = [];
  if (esBaldosa(a.piso.tipo) && piso > 0) {
    const neto = piso + contrazocalo * a.contrazocalo.alto;
    baldosas.push({ formato: a.piso.formato, color: a.piso.color, m2Neto: neto, m2: neto * (1 + a.piso.merma / 100), fragua: a.piso.fragua, junta: a.piso.junta, pared: false });
  }
  if (enchape > 0) baldosas.push({ formato: a.enchape.formato, color: a.enchape.color, m2Neto: enchape, m2: enchape * (1 + a.enchape.merma / 100), fragua: a.enchape.fragua, junta: a.enchape.junta, pared: true });
  return { amb: a, area, per, paredBruta, vanos, puertasAncho, enchape, enchapeLargo, enchapeAlto, pintura, techo, piso, contrazocalo, perfilMl, baldosas };
}

export interface MetradoAcab {
  lineas: LineaAcab[]; ambientes: CalcAmbiente[];
  materiales: number; manoObra: number; directo: number;
  tot: { piso: number; pintura: number; techo: number; enchape: number; contrazocalo: number; galones: number; cajas: number };
}

export function metradoAcabados(cot: CotizacionAcabados): MetradoAcab {
  const lineas: LineaAcab[] = [];
  const add = (grupo: GrupoLinea, clave: string, nombre: string, nota: string, cant: number, unidad?: string) => {
    if (!(cant > 0)) return;
    const pr = precio(clave);
    lineas.push({ grupo, clave, nombre, nota, cant: r2(cant), unidad: unidad || itemCatalogo(clave)?.unidad || 'unidad', precio: pr, subtotal: Math.round(pr * cant * 100) / 100 });
  };
  const nom = (clave: string, def: string) => itemCatalogo(clave)?.nombre || def;
  const cs = cot.ambientes.map(calcularAmbiente);
  const rend = Math.max(10, cot.rendPintura || 35);
  const lista = (xs: string[]) => { const u = [...new Set(xs)]; return u.length > 3 ? `${u.slice(0, 3).join(', ')} y ${u.length - 3} más` : u.join(', '); };

  // ── Pintura por tipo y color ──
  const pint = new Map<string, { clave: string; nombre: string; m2: number; m2m: number; amb: string[]; manos: Set<number> }>();
  const sumaPint = (clave: string, nombre: string, color: string, m2: number, manos: number, amb: string) => {
    if (m2 <= 0) return;
    const k = `${clave}|${color}`;
    const g = pint.get(k) || { clave, nombre: `${nombre} – ${nombreColor(COLORES_PARED, color)}`, m2: 0, m2m: 0, amb: [], manos: new Set<number>() };
    g.m2 += m2; g.m2m += m2 * manos; g.amb.push(amb); g.manos.add(manos); pint.set(k, g);
  };
  cs.forEach(c => {
    const a = c.amb;
    const p = PINTURAS.find(x => x.id === a.pintura.tipo) || PINTURAS[0];
    sumaPint(clavePintura(p.id), `Pintura ${p.corto.toLowerCase()} muros`, a.pintura.color, c.pintura, a.pintura.manos, a.nombre);
    sumaPint('acab:pint:techo', 'Pintura de techo', a.techo.color, c.techo, a.techo.manos, a.nombre);
  });
  let galones = 0;
  [...pint.values()].forEach(g => {
    const gal = Math.ceil(g.m2m / rend - 1e-9); galones += gal;
    add('Pintura y empaste', g.clave, g.nombre, `${r2(g.m2)} m² × ${[...g.manos].join('/')} manos ÷ ${rend} m²/gal · ${lista(g.amb)}`, gal, 'galón');
  });
  const mEmp = cs.reduce((s, c) => s + (c.amb.pintura.empaste ? c.pintura : 0) + (c.amb.techo.empaste ? c.techo : 0), 0);
  const mImp = cs.reduce((s, c) => s + (c.amb.pintura.imprimante ? c.pintura : 0) + (c.amb.techo.imprimante ? c.techo : 0), 0);
  const mPint = cs.reduce((s, c) => s + c.pintura + c.techo, 0);
  if (mEmp) add('Pintura y empaste', 'acab:empaste', nom('acab:empaste', 'Empaste'), `${r2(mEmp)} m² (2 pasadas) ÷ 18 m² por bolsa`, Math.ceil(mEmp / 18 - 1e-9));
  if (mImp) add('Pintura y empaste', 'acab:imprimante', nom('acab:imprimante', 'Imprimante'), `${r2(mImp)} m² ÷ 30 m² por galón`, Math.ceil(mImp / 30 - 1e-9));
  if (mEmp) add('Pintura y empaste', 'acab:lija', nom('acab:lija', 'Lija'), `${r2(mEmp)} m² ÷ 12 m² por pliego`, Math.ceil(mEmp / 12 - 1e-9));
  const nPint = cs.filter(c => c.pintura + c.techo > 0).length;
  if (nPint) add('Pintura y empaste', 'acab:masking', nom('acab:masking', 'Masking tape'), '1 rollo por ambiente', nPint);
  if (mPint) add('Pintura y empaste', 'acab:rodillo', nom('acab:rodillo', 'Rodillo y bandeja'), 'herramienta para la obra', 1);

  // ── Baldosas por formato y color ──
  const bal = new Map<string, { formato: string; color: string; m2: number; m2Neto: number; amb: string[] }>();
  const fraguas = new Map<string, { kg: number; m2: number }>();
  let pegNormal = 0, pegPorc = 0, crucetas = 0, clips = 0;
  cs.forEach(c => c.baldosas.forEach(b => {
    const k = `${b.formato}|${b.color}`;
    const g = bal.get(k) || { formato: b.formato, color: b.color, m2: 0, m2Neto: 0, amb: [] };
    g.m2 += b.m2; g.m2Neto += b.m2Neto; g.amb.push(c.amb.nombre); bal.set(k, g);
    const f = formato(b.formato);
    const piezas = b.m2 / ((f.a * f.b) / 1e4);
    if (f.tipo === 'porcelanato' || esGrande(f)) pegPorc += b.m2Neto; else pegNormal += b.m2Neto;
    if (esGrande(f) && !b.pared) clips += piezas * 3; else if (b.junta >= 1) crucetas += piezas * (b.pared ? 1.2 : 1);
    if (b.junta > 0) {
      const A = f.a * 10, B = f.b * 10, D = f.tipo === 'porcelanato' ? 9 : 8;
      const kg = b.m2Neto * ((A + B) / (A * B)) * b.junta * D * 1.6;
      const fg = fraguas.get(b.fragua) || { kg: 0, m2: 0 }; fg.kg += kg; fg.m2 += b.m2Neto; fraguas.set(b.fragua, fg);
    }
  }));
  let cajas = 0;
  [...bal.values()].sort((p, q) => q.m2 - p.m2).forEach(g => {
    const f = formato(g.formato), n = Math.ceil(g.m2 / f.m2Caja - 1e-9); cajas += n;
    add('Pisos y enchapes', claveBaldosa(f.id), `${nombreFormato(f)} – ${nombreColor(COLORES_BALDOSA, g.color)}`, `${r2(g.m2Neto)} m² + desperdicio = ${r2(g.m2)} m² ÷ ${f.m2Caja} m²/caja · ${lista(g.amb)}`, n, 'caja');
  });
  // Laminado y vinílico.
  const flot = (tipo: 'laminado' | 'vinilico', m2Caja: number) => {
    const xs = cs.filter(c => c.amb.piso.tipo === tipo && c.piso > 0); if (!xs.length) return;
    const m2 = xs.reduce((s, c) => s + c.piso * (1 + c.amb.piso.merma / 100), 0);
    const n = Math.ceil(m2 / m2Caja - 1e-9); cajas += n;
    const colores = lista(xs.map(c => nombreColor(COLORES_BALDOSA, c.amb.piso.color)));
    add('Pisos y enchapes', `acab:${tipo}`, `${nom(`acab:${tipo}`, tipo)} – ${colores}`, `${r2(m2)} m² con desperdicio ÷ ${m2Caja} m²/caja · ${lista(xs.map(c => c.amb.nombre))}`, n, 'caja');
    if (tipo === 'laminado') add('Pisos y enchapes', 'acab:espuma', nom('acab:espuma', 'Espuma'), 'área + 5 % de traslape', Math.ceil(xs.reduce((s, c) => s + c.piso, 0) * 1.05));
  };
  flot('laminado', 2.22); flot('vinilico', 2.23);
  const flotantes = cs.filter(c => (c.amb.piso.tipo === 'laminado' || c.amb.piso.tipo === 'vinilico') && c.piso > 0);
  const mlZoc = flotantes.reduce((s, c) => s + c.contrazocalo, 0);
  if (mlZoc) add('Pisos y enchapes', 'acab:zocalo_mdf', nom('acab:zocalo_mdf', 'Zócalo'), `${r2(mlZoc)} ml + 5 % ÷ 2.40 m`, Math.ceil((mlZoc * 1.05) / 2.4 - 1e-9));
  const nTrans = flotantes.reduce((s, c) => s + c.amb.vanos.filter(v => v.tipo === 'puerta').length, 0);
  if (nTrans) add('Pisos y enchapes', 'acab:transicion', nom('acab:transicion', 'Perfil de transición'), 'en cada puerta del piso flotante', nTrans);
  // Cemento pulido.
  const mPul = cs.filter(c => c.amb.piso.tipo === 'pulido').reduce((s, c) => s + c.piso, 0);
  if (mPul) {
    add('Pisos y enchapes', 'acab:cemento', nom('acab:cemento', 'Cemento'), `${r2(mPul)} m² × 0.25 bolsa (mortero 1:4 e = 2 cm + pulido)`, Math.ceil(mPul * 0.25 - 1e-9));
    add('Pisos y enchapes', 'acab:arena_fina', nom('acab:arena_fina', 'Arena fina'), `${r2(mPul)} m² × 0.022 m³`, Math.ceil(mPul * 0.022 * 10) / 10);
  }
  // Pegamento, fragua y separadores.
  if (pegNormal) add('Pegamento y fragua', 'acab:pegamento', nom('acab:pegamento', 'Pegamento'), `${r2(pegNormal)} m² ÷ 4.5 m² por bolsa`, Math.ceil(pegNormal / 4.5 - 1e-9));
  if (pegPorc) add('Pegamento y fragua', 'acab:pegamento_porc', nom('acab:pegamento_porc', 'Pegamento porcelanato'), `${r2(pegPorc)} m² ÷ 3.5 m² por bolsa (doble encolado)`, Math.ceil(pegPorc / 3.5 - 1e-9));
  [...fraguas.entries()].forEach(([hex, f]) => add('Pegamento y fragua', 'acab:fragua', `${nom('acab:fragua', 'Fragua')} – ${nombreColor(COLORES_FRAGUA, hex)}`, `${r2(f.m2)} m² · ${f.kg.toFixed(1)} kg + 10 %`, Math.max(1, Math.ceil(f.kg * 1.1 - 1e-9)), 'bolsa'));
  if (crucetas) add('Accesorios', 'acab:crucetas', nom('acab:crucetas', 'Crucetas'), `${Math.round(crucetas)} piezas ≈ 1 cruceta por pieza`, Math.ceil(crucetas / 100 - 1e-9));
  if (clips) {
    add('Accesorios', 'acab:nivelador_clip', nom('acab:nivelador_clip', 'Clips'), `${Math.round(clips / 3)} piezas grandes × 3 clips`, Math.ceil(clips / 100 - 1e-9));
    add('Accesorios', 'acab:nivelador_cuna', nom('acab:nivelador_cuna', 'Cuñas'), 'se reutilizan en toda la obra', 1);
  }
  const mlPerfil = cs.reduce((s, c) => s + c.perfilMl, 0);
  if (mlPerfil) add('Accesorios', 'acab:perfil', nom('acab:perfil', 'Perfil'), `${r2(mlPerfil)} ml (remate del enchape y cantos de ventanas) ÷ 2.50 m`, Math.ceil((mlPerfil * 1.05) / 2.5 - 1e-9));
  const materiales = lineas.reduce((s, l) => s + l.subtotal, 0);

  // ── Mano de obra ──
  const antes = lineas.length;
  const suma = (f: (c: CalcAmbiente) => number) => cs.reduce((s, c) => s + f(c), 0);
  const mMuros = suma(c => c.pintura), mTecho = suma(c => c.techo);
  const porTipo = (t: string) => suma(c => (c.amb.piso.tipo === t ? c.piso : 0));
  const mEnch = suma(c => c.enchape), mlCz = suma(c => c.contrazocalo);
  const mCer = porTipo('ceramico'), mPor = porTipo('porcelanato'), mLam = porTipo('laminado'), mVin = porTipo('vinilico');
  if (cot.modoMO === 'jornal') {
    const medio = (d: number) => Math.ceil(d * 2 - 1e-9) / 2;
    const dPint = medio(mEmp / 30 + mMuros / 45 + mTecho / 35);
    const dEnch = medio(mCer / 12 + mPor / 9 + mEnch / 8 + mLam / 25 + mVin / 30 + mPul / 15 + mlCz / 35);
    add('Mano de obra', claveJornal('Pintor'), 'Pintor', `empaste ${r2(mEmp)} m² ÷ 30 + muros ${r2(mMuros)} m² ÷ 45 + techos ${r2(mTecho)} m² ÷ 35 por día`, dPint, 'día');
    add('Mano de obra', claveJornal('Enchapador'), 'Enchapador', `pisos ${r2(mCer + mPor + mLam + mVin + mPul)} m² + enchape ${r2(mEnch)} m² + contrazócalo ${r2(mlCz)} ml`, dEnch, 'día');
    add('Mano de obra', claveJornal('Ayudante'), 'Ayudante', 'acompaña al enchapador (mezcla, cortes y limpieza)', dEnch, 'día');
  } else {
    add('Mano de obra', 'acab:mo:empaste', 'Empastado y lijado', 'muros y techos con empaste', mEmp, 'm²');
    add('Mano de obra', 'acab:mo:pintura', 'Imprimado y pintado de muros', 'descontando puertas, ventanas y enchapes', mMuros, 'm²');
    add('Mano de obra', 'acab:mo:pintura_techo', 'Pintado de techos', 'área de cada ambiente', mTecho, 'm²');
    add('Mano de obra', 'acab:mo:piso_ceramico', 'Asentado de piso cerámico', 'incluye fraguado', mCer, 'm²');
    add('Mano de obra', 'acab:mo:piso_porcelanato', 'Asentado de porcelanato', 'con niveladores y fragua', mPor, 'm²');
    add('Mano de obra', 'acab:mo:enchape', 'Enchape de paredes', 'baños, cocina y lavandería', mEnch, 'm²');
    add('Mano de obra', 'acab:mo:laminado', 'Instalación de piso laminado', 'con espuma y zócalo', mLam, 'm²');
    add('Mano de obra', 'acab:mo:vinilico', 'Instalación de piso vinílico', 'sistema click', mVin, 'm²');
    add('Mano de obra', 'acab:mo:pulido', 'Piso de cemento pulido', 'con bruñas', mPul, 'm²');
    add('Mano de obra', 'acab:mo:contrazocalo', 'Contrazócalo', 'perímetro sin puertas', mlCz, 'ml');
  }
  const manoObra = lineas.slice(antes).reduce((s, l) => s + l.subtotal, 0);
  const directo = (cot.soloMO ? 0 : materiales) + manoObra;
  return {
    lineas, ambientes: cs, materiales, manoObra, directo,
    tot: { piso: suma(c => c.piso), pintura: mMuros, techo: mTecho, enchape: mEnch, contrazocalo: mlCz, galones, cajas },
  };
}
export const totalCon = (r: MetradoAcab, cot: CotizacionAcabados) => r.directo * (1 + (cot.gg + cot.util) / 100);
