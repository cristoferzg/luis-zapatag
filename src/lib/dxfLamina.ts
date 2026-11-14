// =============================================================================
// Exportación a AutoCAD (DXF R12, el que abre cualquier versión) — Techos.
//
// Antes se exportaban las líneas en 3D tal cual (la altura en el eje Y): AutoCAD abre
// mirando desde arriba (plano X-Y) y solo se veía el FRENTE, con todos los pórticos
// encimados. Ahora hay dos formas:
//   1. LÁMINA: un plano listo para imprimir con 4 vistas ordenadas (planta, elevación
//      frontal, elevación lateral e isométrica), cotas, ejes, cuadro de perfiles y rótulo.
//   2. MODELO 3D: la misma estructura con la altura en Z (como trabaja AutoCAD), para
//      girarla con Órbita 3D; capas por tipo de pieza.
// Unidades: metros (1 unidad = 1 m).
// =============================================================================
import type { Node3D, Segment3D } from '../components/techos/techosCadEngineTypes';
import { INVENTARIO_PERFILES_TUBULARES } from '../components/techos/techosCadCatalog';

type P2 = [number, number];
interface Linea { a: P2; b: P2; capa: string }
interface Texto { p: P2; h: number; t: string; capa: string; centro?: boolean }
interface Circulo { c: P2; r: number; capa: string }

/** Capas: nombre, color AutoCAD (ACI) y tipo de línea. */
const CAPAS: [string, number, string][] = [
  ['COLUMNAS', 7, 'CONTINUOUS'], ['VIGAS', 2, 'CONTINUOUS'], ['CORDON_SUPERIOR', 1, 'CONTINUOUS'],
  ['CORDON_INFERIOR', 3, 'CONTINUOUS'], ['MONTANTES', 6, 'CONTINUOUS'], ['DIAGONALES', 5, 'CONTINUOUS'],
  ['CORREAS', 4, 'CONTINUOUS'], ['ARRIOSTRES', 8, 'CONTINUOUS'], ['TENSORES', 9, 'CONTINUOUS'],
  ['EJES', 8, 'DASHED'], ['COTAS', 30, 'CONTINUOUS'], ['TEXTOS', 7, 'CONTINUOUS'],
  ['MARCO', 7, 'CONTINUOUS'], ['CUADRO', 7, 'CONTINUOUS'],
];
const CAPA_ROL: Record<string, string> = {
  columna: 'COLUMNAS', columna_concreto: 'COLUMNAS', viga_principal: 'VIGAS', viga_secundaria: 'VIGAS',
  cordon_superior: 'CORDON_SUPERIOR', cordon_inferior: 'CORDON_INFERIOR', montante: 'MONTANTES',
  diagonal: 'DIAGONALES', correa: 'CORREAS', arriostre: 'ARRIOSTRES', tensor_viento: 'TENSORES',
};
const NOMBRE_ROL: Record<string, string> = {
  columna: 'Columnas', columna_concreto: 'Columnas de concreto', viga_principal: 'Vigas', viga_secundaria: 'Vigas secundarias',
  cordon_superior: 'Cordon superior (tijeral)', cordon_inferior: 'Cordon inferior (tijeral)', montante: 'Montantes',
  diagonal: 'Diagonales', correa: 'Correas', arriostre: 'Arriostres / cruces', tensor_viento: 'Tensores',
};
const capaDe = (s: Segment3D) => CAPA_ROL[s.rolEstructural || ''] || 'VIGAS';

/** Texto DXF: tildes y ñ como \U+XXXX (AutoCAD las muestra bien en cualquier idioma). */
const enc = (s: string) => s.replace(/[^\x20-\x7e]/g, ch => `\\U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
const f = (n: number) => (Math.round(n * 10000) / 10000).toString();
const m2 = (n: number) => n.toFixed(2);

function nombreCorto(id?: string) {
  const p = INVENTARIO_PERFILES_TUBULARES.find(x => x.id === id);
  return p ? p.nombre.replace(/\s*\[[^\]]*\]/, '').replace(/\s*\((?:\d|LA|ASTM)[^)]*\)/g, '').replace(/ Espesor/, '').trim() : (id || '-');
}

/** Arma el archivo DXF R12 con capas, tipos de línea y las entidades dadas. */
function armarDxf(nombre: string, lineas3d: { a: number[]; b: number[]; capa: string }[], textos: Texto[], circulos: Circulo[], ext: [number, number, number, number]): string {
  const o: string[] = ['999', enc(`InnovApp - ${nombre}`), '0', 'SECTION', '2', 'HEADER',
    '9', '$ACADVER', '1', 'AC1009', '9', '$INSUNITS', '70', '6',
    '9', '$EXTMIN', '10', f(ext[0]), '20', f(ext[1]), '30', '0', '9', '$EXTMAX', '10', f(ext[2]), '20', f(ext[3]), '30', '0',
    '9', '$LIMMIN', '10', f(ext[0]), '20', f(ext[1]), '9', '$LIMMAX', '10', f(ext[2]), '20', f(ext[3]),
    '9', '$LTSCALE', '40', f(Math.max(0.2, Math.max(ext[2] - ext[0], ext[3] - ext[1]) / 120)),
    '0', 'ENDSEC', '0', 'SECTION', '2', 'TABLES',
    '0', 'TABLE', '2', 'LTYPE', '70', '2',
    '0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0',
    '0', 'LTYPE', '2', 'DASHED', '70', '0', '3', '__ __ __ __', '72', '65', '73', '2', '40', '0.75', '49', '0.5', '49', '-0.25',
    '0', 'ENDTAB', '0', 'TABLE', '2', 'LAYER', '70', String(CAPAS.length)];
  CAPAS.forEach(([n, c, lt]) => o.push('0', 'LAYER', '2', n, '70', '0', '62', String(c), '6', lt));
  o.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  lineas3d.forEach(l => o.push('0', 'LINE', '8', l.capa, '10', f(l.a[0]), '20', f(l.a[1]), '30', f(l.a[2] || 0), '11', f(l.b[0]), '21', f(l.b[1]), '31', f(l.b[2] || 0)));
  circulos.forEach(c => o.push('0', 'CIRCLE', '8', c.capa, '10', f(c.c[0]), '20', f(c.c[1]), '30', '0', '40', f(c.r)));
  textos.forEach(t => {
    o.push('0', 'TEXT', '8', t.capa, '10', f(t.p[0]), '20', f(t.p[1]), '30', '0', '40', f(t.h), '1', enc(t.t));
    if (t.centro) o.push('72', '1', '73', '2', '11', f(t.p[0]), '21', f(t.p[1]), '31', '0'); // centrado (horizontal y vertical)
  });
  o.push('0', 'ENDSEC', '0', 'EOF');
  return o.join('\n');
}

/** MODELO 3D: altura en Z, largo de la nave en Y (como se trabaja en AutoCAD). */
export function dxfModelo3D(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, nombre: string): string {
  const ns = Object.values(nodes);
  if (!ns.length) return armarDxf(nombre, [], [], [], [0, 0, 1, 1]);
  const maxZ = Math.max(...ns.map(n => n.z || 0));
  // App: x = luz, y = altura, z = largo  →  AutoCAD: X = x, Y = largo, Z = altura (sin espejo).
  const a3 = (n: Node3D) => [n.x, maxZ - (n.z || 0), n.y];
  const ls = Object.values(segments).map(s => {
    const A = nodes[s.nodeAId], B = nodes[s.nodeBId];
    return A && B ? { a: a3(A), b: a3(B), capa: capaDe(s) } : null;
  }).filter(Boolean) as { a: number[]; b: number[]; capa: string }[];
  const xs = ls.flatMap(l => [l.a[0], l.b[0]]), ys = ls.flatMap(l => [l.a[1], l.b[1]]);
  return armarDxf(nombre, ls, [], [], [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]);
}

/** LÁMINA: planta, elevación frontal, elevación lateral e isométrica + cotas, ejes, cuadro y rótulo. */
export function dxfLamina(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, o: { nombre: string; empresa?: string; fecha?: string }): string {
  const ns = Object.values(nodes);
  const segs = Object.values(segments).filter(s => nodes[s.nodeAId] && nodes[s.nodeBId]);
  if (!ns.length || !segs.length) return armarDxf(o.nombre, [], [], [], [0, 0, 1, 1]);
  const minX = Math.min(...ns.map(n => n.x)), maxX = Math.max(...ns.map(n => n.x));
  const minY = Math.min(...ns.map(n => n.y)), maxY = Math.max(...ns.map(n => n.y));
  const minZ = Math.min(...ns.map(n => n.z || 0)), maxZ = Math.max(...ns.map(n => n.z || 0));
  const L = Math.max(0.1, maxX - minX), H = Math.max(0.1, maxY - minY), D = Math.max(0.1, maxZ - minZ);
  const g = Math.max(2.5, Math.max(L, D, H) * 0.28);       // separación entre vistas
  const th = Math.max(0.16, Math.max(L, D) / 55);           // alto de texto
  const LN: Linea[] = [], TX: Texto[] = [], CI: Circulo[] = [];
  const linea = (a: P2, b: P2, capa: string) => LN.push({ a, b, capa });
  const texto = (p: P2, t: string, h = th, capa = 'TEXTOS', centro = true) => TX.push({ p, t, h, capa, centro });

  // Pórticos (z de las columnas) y pórtico frontal (el plano con más piezas).
  const zCol = [...new Set(segs.filter(s => /^columna/.test(s.rolEstructural || '')).flatMap(s => [nodes[s.nodeAId].z || 0, nodes[s.nodeBId].z || 0]).map(z => Math.round(z * 100) / 100))].sort((a, b) => a - b);
  const cuenta: Record<string, number> = {};
  segs.forEach(s => { const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; if (Math.abs((a.z || 0) - (b.z || 0)) < 0.02) { const k = (Math.round((a.z || 0) * 100) / 100).toFixed(2); cuenta[k] = (cuenta[k] || 0) + 1; } });
  const zFrente = parseFloat(Object.entries(cuenta).sort((p, q) => q[1] - p[1])[0]?.[0] ?? String(minZ));
  const alturaCol = (() => {
    const t = segs.filter(s => s.rolEstructural === 'columna').map(s => Math.max(nodes[s.nodeAId].y, nodes[s.nodeBId].y));
    return t.length ? Math.min(...t) - minY : H;
  })();

  // Proyección de piezas a una vista (sin repetir líneas encimadas).
  const proyectar = (filtro: (s: Segment3D) => boolean, pr: (n: Node3D) => P2, org: P2) => {
    const vistos = new Set<string>();
    segs.filter(filtro).forEach(s => {
      const a = pr(nodes[s.nodeAId]), b = pr(nodes[s.nodeBId]);
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.005) return; // pieza vista de punta
      const k = [a, b].map(p => p.map(v => Math.round(v * 200)).join(',')).sort().join('|');
      if (vistos.has(k)) return; vistos.add(k);
      linea([org[0] + a[0], org[1] + a[1]], [org[0] + b[0], org[1] + b[1]], capaDe(s));
    });
  };
  // Cota con líneas (compatible con todas las versiones): extensiones, flechas oblicuas y valor.
  const cota = (a: P2, b: P2, off: P2, txt?: string) => {
    const a2: P2 = [a[0] + off[0], a[1] + off[1]], b2: P2 = [b[0] + off[0], b[1] + off[1]];
    linea(a, a2, 'COTAS'); linea(b, b2, 'COTAS'); linea(a2, b2, 'COTAS');
    const t = th * 0.5;
    [a2, b2].forEach(p => linea([p[0] - t, p[1] - t], [p[0] + t, p[1] + t], 'COTAS'));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.hypot(off[0], off[1]) || 1;
    texto([(a2[0] + b2[0]) / 2 + (off[0] / n) * th * 0.9, (a2[1] + b2[1]) / 2 + (off[1] / n) * th * 0.9], txt ?? m2(len), th * 0.85, 'COTAS');
  };
  const titulo = (c: P2, t1: string, t2: string) => {
    texto(c, t1, th * 1.4, 'TEXTOS'); texto([c[0], c[1] - th * 2], t2, th * 0.9, 'TEXTOS');
    linea([c[0] - t1.length * th * 0.55, c[1] - th * 0.95], [c[0] + t1.length * th * 0.55, c[1] - th * 0.95], 'TEXTOS');
  };
  const eje = (c: P2, t: string) => { CI.push({ c, r: th * 1.1, capa: 'EJES' }); texto(c, t, th, 'EJES'); };

  // --- 1. ELEVACIÓN FRONTAL (pórtico) ------------------------------------------
  const oF: P2 = [0, 0];
  proyectar(s => Math.abs((nodes[s.nodeAId].z || 0) - zFrente) < 0.02 && Math.abs((nodes[s.nodeBId].z || 0) - zFrente) < 0.02, n => [n.x - minX, n.y - minY], oF);
  linea([oF[0] - g * 0.15, oF[1]], [oF[0] + L + g * 0.15, oF[1]], 'EJES'); // nivel de piso
  cota([oF[0], oF[1]], [oF[0] + L, oF[1]], [0, -th * 3], `LUZ ${m2(L)} m`);
  cota([oF[0], oF[1]], [oF[0], oF[1] + alturaCol], [-th * 3, 0], m2(alturaCol));
  if (H - alturaCol > 0.05) cota([oF[0] + L, oF[1]], [oF[0] + L, oF[1] + H], [th * 3, 0], m2(H));
  eje([oF[0], oF[1] - th * 6.5], 'A'); eje([oF[0] + L, oF[1] - th * 6.5], 'B');
  titulo([oF[0] + L / 2, oF[1] - th * 10], 'ELEVACION FRONTAL (PORTICO)', `Luz ${m2(L)} m  ·  altura ${m2(H)} m`);

  // --- 2. ELEVACIÓN LATERAL ----------------------------------------------------
  const oL: P2 = [L + g, 0];
  proyectar(s => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    return Math.abs(a.x - b.x) < 0.02 && !/montante|diagonal/.test(s.rolEstructural || '');
  }, n => [(n.z || 0) - minZ, n.y - minY], oL);
  linea([oL[0] - g * 0.15, oL[1]], [oL[0] + D + g * 0.15, oL[1]], 'EJES');
  cota([oL[0], oL[1]], [oL[0] + D, oL[1]], [0, -th * 3], `LARGO ${m2(D)} m`);
  zCol.forEach((z, i) => eje([oL[0] + z - minZ, oL[1] - th * 6.5], String(i + 1)));
  titulo([oL[0] + D / 2, oL[1] - th * 10], 'ELEVACION LATERAL', `${zCol.length} porticos${zCol.length > 1 ? ` a ${m2(D / (zCol.length - 1))} m` : ''}`);

  // --- 3. PLANTA DE TECHO ------------------------------------------------------
  const oP: P2 = [0, H + g * 1.2 + th * 8];
  proyectar(s => !/^columna/.test(s.rolEstructural || ''), n => [n.x - minX, (n.z || 0) - minZ], oP);
  zCol.forEach((z, i) => {
    const y = oP[1] + z - minZ;
    linea([oP[0] - th * 2.5, y], [oP[0] + L + th * 1.5, y], 'EJES');
    eje([oP[0] - th * 4, y], String(i + 1));
  });
  [['A', 0], ['B', L]].forEach(([t, x]) => { linea([oP[0] + (x as number), oP[1] - th * 1.5], [oP[0] + (x as number), oP[1] + D + th * 2.5], 'EJES'); eje([oP[0] + (x as number), oP[1] + D + th * 4], t as string); });
  cota([oP[0], oP[1] + D], [oP[0] + L, oP[1] + D], [0, th * 6.5], `${m2(L)}`);
  cota([oP[0] + L, oP[1]], [oP[0] + L, oP[1] + D], [th * 3, 0], `${m2(D)}`);
  titulo([oP[0] + L / 2, oP[1] - th * 4], 'PLANTA DE TECHO Y CORREAS', `${m2(L)} x ${m2(D)} m`);

  // --- 4. ISOMÉTRICA -----------------------------------------------------------
  const c30 = Math.cos(Math.PI / 6), s30 = 0.5;
  const iso = (n: Node3D): P2 => { const x = n.x - minX, z = (n.z || 0) - minZ, y = n.y - minY; return [(x + z) * c30, y + (z - x) * s30]; };
  const pts = ns.map(iso);
  const iMinU = Math.min(...pts.map(p => p[0])), iMinV = Math.min(...pts.map(p => p[1]));
  const iW = Math.max(...pts.map(p => p[0])) - iMinU;
  const oI: P2 = [L + g - iMinU, oP[1] - iMinV];
  proyectar(() => true, iso, oI);
  titulo([oI[0] + iMinU + iW / 2, oP[1] - th * 4], 'VISTA ISOMETRICA', 'Estructura completa');

  // --- 5. CUADRO DE ELEMENTOS Y PERFILES ------------------------------------------
  const filas: [string, string, string, string][] = [];
  const porRol = new Map<string, { n: number; m: number; perf: Set<string> }>();
  segs.forEach(s => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
    const r = porRol.get(s.rolEstructural || 'viga_principal') || { n: 0, m: 0, perf: new Set<string>() };
    r.n++; r.m += Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)); r.perf.add(nombreCorto(s.profileId));
    porRol.set(s.rolEstructural || 'viga_principal', r);
  });
  porRol.forEach((r, rol) => filas.push([NOMBRE_ROL[rol] || rol, String(r.n), [...r.perf].join(' / '), m2(r.m)]));
  const yT = -th * 16, rh = th * 1.9;
  // Ancho de cada columna según su texto más largo (letra de AutoCAD ≈ 0.85 × alto por carácter).
  const enc0 = ['Elemento', 'Cant.', 'Perfil', 'Long. (m)'];
  const cw = [0, 1, 2, 3].map(j => Math.max(...[enc0, ...filas].map(r => r[j].length)) * th * 0.8 * 0.85 + th * 1.2);
  const anchoT = cw.reduce((x, y) => x + y, 0);
  const altoT = rh * (filas.length + 2);
  const caja = (x0: number, y0: number, x1: number, y1: number, capa = 'CUADRO') => { linea([x0, y0], [x1, y0], capa); linea([x1, y0], [x1, y1], capa); linea([x1, y1], [x0, y1], capa); linea([x0, y1], [x0, y0], capa); };
  caja(0, yT, anchoT, yT - altoT);
  texto([anchoT / 2, yT - rh * 0.5], 'CUADRO DE ELEMENTOS Y PERFILES', th * 1.05, 'CUADRO');
  [enc0, ...filas].forEach((fila, i) => {
    const y = yT - rh * (i + 1);
    linea([0, y], [anchoT, y], 'CUADRO');
    let x = 0;
    fila.forEach((c, j) => {
      TX.push({ p: [x + th * 0.4, y - rh * 0.68], t: c, h: th * (i ? 0.8 : 0.85), capa: 'CUADRO' });
      x += cw[j]; if (j < 3) linea([x, y], [x, y - rh], 'CUADRO');
    });
  });

  // --- 6. NOTAS + MARCO + RÓTULO ------------------------------------------------
  const notas = ['NOTAS:', '1. Unidades en metros. Acero ASTM A500 Gr. B y perfiles C ASTM A36.', '2. Soldadura AWS E-6011 (raiz) y E-7018 (acabado), garganta min. 4 mm.',
    '3. Placas base con pernos de anclaje tipo J empotrados 35 cm.', '4. Cobertura fijada con pernos autoperforantes y arandela EPDM.', '5. Pintura: 2 manos anticorrosivo + 2 manos esmalte.'];
  notas.forEach((t, i) => TX.push({ p: [anchoT + th * 3, yT - th * 1.3 - i * th * 1.7], t, h: th * (i ? 0.8 : 0.95), capa: 'TEXTOS' }));
  const allX = LN.flatMap(l => [l.a[0], l.b[0]]), allY = LN.flatMap(l => [l.a[1], l.b[1]]);
  const mg = th * 4;
  const X0 = Math.min(...allX, -th * 8) - mg, Y0 = Math.min(...allY, yT - altoT) - mg - th * 9;
  const X1 = Math.max(...allX, anchoT + th * 50) + mg, Y1 = Math.max(...allY) + mg;
  caja(X0, Y0, X1, Y1, 'MARCO'); caja(X0 + th * 0.6, Y0 + th * 0.6, X1 - th * 0.6, Y1 - th * 0.6, 'MARCO');
  // Rótulo abajo a la derecha: 4 filas (empresa · proyecto · descripción y fecha · lámina y escala).
  const proy = `Proyecto: ${o.nombre}`;
  const rw = Math.max(th * 34, proy.length * th * 0.85 * 0.85 + th * 2), fh = th * 2.2, rhh = fh * 4, rx = X1 - th * 0.6 - rw, ry = Y0 + th * 0.6;
  caja(rx, ry, rx + rw, ry + rhh, 'MARCO');
  [1, 2, 3].forEach(k => linea([rx, ry + fh * k], [rx + rw, ry + fh * k], 'MARCO'));
  linea([rx + rw * 0.5, ry], [rx + rw * 0.5, ry + fh], 'MARCO');
  const fila = (k: number, t: string, h: number, x = rx + th * 0.6) => TX.push({ p: [x, ry + fh * k + fh * 0.32], t, h, capa: 'TEXTOS' });
  fila(3, (o.empresa || 'InnovApp').toUpperCase(), th * 1.1);
  fila(2, proy, th * 0.85);
  fila(1, `Estructura metalica de techo  ·  ${o.fecha || new Date().toLocaleDateString('es-PE')}`, th * 0.75);
  fila(0, 'Lamina TM-01', th * 0.9);
  fila(0, 'Escala 1:1 · metros', th * 0.75, rx + rw * 0.5 + th * 0.6);
  TX.push({ p: [X0 + th * 1.2, Y0 + th * 1.4], t: 'Generado con InnovApp · capas por tipo de pieza (COLUMNAS, CORDON_SUPERIOR, CORREAS, ...)', h: th * 0.6, capa: 'TEXTOS' });

  return armarDxf(o.nombre, LN.map(l => ({ a: [...l.a, 0], b: [...l.b, 0], capa: l.capa })), TX, CI, [X0, Y0, X1, Y1]);
}
