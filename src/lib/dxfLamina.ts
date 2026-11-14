// =============================================================================
// Exportación a AutoCAD (DXF R12, el que abre cualquier versión) — Techos.
//
// Antes se exportaban las líneas en 3D tal cual (la altura en el eje Y): AutoCAD abre
// mirando desde arriba (plano X-Y) y solo se veía el FRENTE, con los pórticos encimados.
// Ahora hay dos formas:
//   1. JUEGO DE LÁMINAS listo para imprimir (A1 en milímetros; en A3 "ajustar al papel"):
//      TM-01 Estructura: planta, elevación frontal, elevación lateral e isométrica a escala
//            normalizada, con cotas completas, ejes, cuadro de perfiles, leyenda y notas.
//      TM-02 Despiece y cortes: cada barra de 6 m dibujada con sus cortes y su sobrante.
//      TM-03 Memoria de cálculo: datos, cargas, verificación por pieza, reacciones y peso.
//      Cada lámina con marco, margen de encuadernación y rótulo. Las piezas se dibujan con
//      grosor proporcional al perfil (una columna de 4" sale gruesa; una diagonal de 1", delgada).
//   2. MODELO 3D: la estructura con la altura en Z, para girarla con Órbita 3D.
// =============================================================================
import type { Node3D, Segment3D } from '../components/techos/techosCadEngineTypes';
import { INVENTARIO_PERFILES_TUBULARES } from '../components/techos/techosCadCatalog';

type P2 = [number, number];

/** Capas: nombre, color AutoCAD (ACI) y tipo de línea. */
const CAPAS: [string, number, string][] = [
  ['COLUMNAS', 7, 'CONTINUOUS'], ['VIGAS', 2, 'CONTINUOUS'], ['CORDON_SUPERIOR', 1, 'CONTINUOUS'],
  ['CORDON_INFERIOR', 3, 'CONTINUOUS'], ['MONTANTES', 6, 'CONTINUOUS'], ['DIAGONALES', 5, 'CONTINUOUS'],
  ['CORREAS', 4, 'CONTINUOUS'], ['ARRIOSTRES', 8, 'CONTINUOUS'], ['TENSORES', 9, 'CONTINUOUS'],
  ['EJES', 8, 'DASHED'], ['COTAS', 30, 'CONTINUOUS'], ['TEXTOS', 7, 'CONTINUOUS'],
  ['MARCO', 7, 'CONTINUOUS'], ['CUADRO', 7, 'CONTINUOUS'], ['DESPIECE', 4, 'CONTINUOUS'],
  ['NO_CUMPLE', 1, 'CONTINUOUS'],
];
const CAPA_ROL: Record<string, string> = {
  columna: 'COLUMNAS', columna_concreto: 'COLUMNAS', viga_principal: 'VIGAS', viga_secundaria: 'VIGAS',
  cordon_superior: 'CORDON_SUPERIOR', cordon_inferior: 'CORDON_INFERIOR', montante: 'MONTANTES',
  diagonal: 'DIAGONALES', correa: 'CORREAS', arriostre: 'ARRIOSTRES', tensor_viento: 'TENSORES',
};
const NOMBRE_ROL: Record<string, string> = {
  columna: 'Columnas', columna_concreto: 'Columnas de concreto', viga_principal: 'Vigas', viga_secundaria: 'Vigas secundarias',
  cordon_superior: 'Cordón superior (tijeral)', cordon_inferior: 'Cordón inferior (tijeral)', montante: 'Montantes',
  diagonal: 'Diagonales', correa: 'Correas', arriostre: 'Arriostres / cruces', tensor_viento: 'Tensores',
};
const ORDEN_ROL = ['columna', 'columna_concreto', 'viga_principal', 'cordon_superior', 'cordon_inferior', 'montante', 'diagonal', 'viga_secundaria', 'correa', 'arriostre', 'tensor_viento'];
const capaDe = (s: Segment3D) => CAPA_ROL[s.rolEstructural || ''] || 'VIGAS';

/** Texto DXF: tildes y ñ como \U+XXXX (AutoCAD las muestra bien en cualquier idioma). */
const enc = (s: string) => s.replace(/[^\x20-\x7e]/g, ch => `\\U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
const f = (n: number) => (Math.round(n * 10000) / 10000).toString();
const m2 = (n: number) => n.toFixed(2);
/** Ancho aproximado de un texto en AutoCAD (letra estándar ≈ 0.85 × alto por carácter). */
const anchoTxt = (t: string, h: number) => t.length * h * 0.85;

function perfilDe(id?: string) { return INVENTARIO_PERFILES_TUBULARES.find(x => x.id === id); }
function nombreCorto(id?: string) {
  const p = perfilDe(id);
  return p ? p.nombre.replace(/\s*\[[^\]]*\]/, '').replace(/\s*\((?:\d|LA|ASTM)[^)]*\)/g, '').replace(/ Espesor/, '').trim() : (id || '-');
}
/** Lado mayor del perfil en mm (para el grosor del trazo). */
const ladoMm = (id?: string) => { const p = perfilDe(id); return p ? Math.max(p.anchoMm, p.altoMm || p.anchoMm) : 50; };

// ---------------------------------------------------------------------------
// Dibujo: entidades acumuladas en milímetros de papel.
// ---------------------------------------------------------------------------
interface Ent { l: string[] }
class Dibujo {
  ents: Ent[] = [];
  minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
  private ext(x: number, y: number) { this.minX = Math.min(this.minX, x); this.minY = Math.min(this.minY, y); this.maxX = Math.max(this.maxX, x); this.maxY = Math.max(this.maxY, y); }
  linea(a: P2, b: P2, capa: string) {
    this.ext(...a); this.ext(...b);
    this.ents.push({ l: ['0', 'LINE', '8', capa, '10', f(a[0]), '20', f(a[1]), '30', '0', '11', f(b[0]), '21', f(b[1]), '31', '0'] });
  }
  /** Línea gruesa (polilínea con ancho constante: se imprime con ese grosor en mm). */
  gruesa(pts: P2[], w: number, capa: string, cerrada = false) {
    const l = ['0', 'POLYLINE', '8', capa, '66', '1', '10', '0', '20', '0', '30', '0', '70', cerrada ? '1' : '0', '40', f(w), '41', f(w)];
    pts.forEach(p => { this.ext(...p); l.push('0', 'VERTEX', '8', capa, '10', f(p[0]), '20', f(p[1]), '30', '0'); });
    l.push('0', 'SEQEND', '8', capa);
    this.ents.push({ l });
  }
  caja(x0: number, y0: number, x1: number, y1: number, capa: string, w = 0) {
    if (w) this.gruesa([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], w, capa, true);
    else { this.linea([x0, y0], [x1, y0], capa); this.linea([x1, y0], [x1, y1], capa); this.linea([x1, y1], [x0, y1], capa); this.linea([x0, y1], [x0, y0], capa); }
  }
  circulo(c: P2, r: number, capa: string) {
    this.ext(c[0] - r, c[1] - r); this.ext(c[0] + r, c[1] + r);
    this.ents.push({ l: ['0', 'CIRCLE', '8', capa, '10', f(c[0]), '20', f(c[1]), '30', '0', '40', f(r)] });
  }
  /** al: 'izq' | 'centro' | 'der'. Texto centrado en vertical salvo 'izq' (línea base). */
  texto(p: P2, t: string, h: number, capa = 'TEXTOS', al: 'izq' | 'centro' | 'der' = 'izq', rot = 0) {
    this.ext(...p);
    const l = ['0', 'TEXT', '8', capa, '10', f(p[0]), '20', f(p[1]), '30', '0', '40', f(h), '1', enc(t)];
    if (rot) l.push('50', f(rot));
    if (al !== 'izq') l.push('72', al === 'centro' ? '1' : '2', '73', '2', '11', f(p[0]), '21', f(p[1]), '31', '0');
    this.ents.push({ l });
  }
}

function armarDxf(nombre: string, d: Dibujo, unidades: 'mm' | 'm', lineas3d: { a: number[]; b: number[]; capa: string }[] = []): string {
  if (!isFinite(d.minX)) { d.minX = d.minY = 0; d.maxX = d.maxY = 1; }
  lineas3d.forEach(l => { d.minX = Math.min(d.minX, l.a[0], l.b[0]); d.maxX = Math.max(d.maxX, l.a[0], l.b[0]); d.minY = Math.min(d.minY, l.a[1], l.b[1]); d.maxY = Math.max(d.maxY, l.a[1], l.b[1]); });
  const lt = unidades === 'mm' ? 1 : 0.05;
  const o: string[] = ['999', enc(`InnovApp - ${nombre}`), '0', 'SECTION', '2', 'HEADER',
    '9', '$ACADVER', '1', 'AC1009', '9', '$INSUNITS', '70', unidades === 'mm' ? '4' : '6',
    '9', '$EXTMIN', '10', f(d.minX), '20', f(d.minY), '30', '0', '9', '$EXTMAX', '10', f(d.maxX), '20', f(d.maxY), '30', '0',
    '9', '$LIMMIN', '10', f(d.minX), '20', f(d.minY), '9', '$LIMMAX', '10', f(d.maxX), '20', f(d.maxY),
    '9', '$LTSCALE', '40', f(lt), '9', '$PLINEWID', '40', '0',
    '0', 'ENDSEC', '0', 'SECTION', '2', 'TABLES',
    '0', 'TABLE', '2', 'LTYPE', '70', '2',
    '0', 'LTYPE', '2', 'CONTINUOUS', '70', '0', '3', 'Solid line', '72', '65', '73', '0', '40', '0.0',
    '0', 'LTYPE', '2', 'DASHED', '70', '0', '3', '__ __ __ __', '72', '65', '73', '2', '40', '9.0', '49', '6.0', '49', '-3.0',
    '0', 'ENDTAB', '0', 'TABLE', '2', 'LAYER', '70', String(CAPAS.length)];
  CAPAS.forEach(([n, c, t]) => o.push('0', 'LAYER', '2', n, '70', '0', '62', String(c), '6', t));
  o.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  d.ents.forEach(e => o.push(...e.l));
  lineas3d.forEach(l => o.push('0', 'LINE', '8', l.capa, '10', f(l.a[0]), '20', f(l.a[1]), '30', f(l.a[2] || 0), '11', f(l.b[0]), '21', f(l.b[1]), '31', f(l.b[2] || 0)));
  o.push('0', 'ENDSEC', '0', 'EOF');
  return o.join('\n');
}

/** MODELO 3D: altura en Z, largo de la nave en Y (como se trabaja en AutoCAD). Unidades: metros. */
export function dxfModelo3D(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, nombre: string): string {
  const ns = Object.values(nodes);
  const d = new Dibujo();
  if (!ns.length) return armarDxf(nombre, d, 'm');
  const maxZ = Math.max(...ns.map(n => n.z || 0));
  // App: x = luz, y = altura, z = largo  →  AutoCAD: X = x, Y = largo, Z = altura (sin espejo).
  const a3 = (n: Node3D) => [n.x, maxZ - (n.z || 0), n.y];
  const ls = Object.values(segments).map(s => {
    const A = nodes[s.nodeAId], B = nodes[s.nodeBId];
    return A && B ? { a: a3(A), b: a3(B), capa: capaDe(s) } : null;
  }).filter(Boolean) as { a: number[]; b: number[]; capa: string }[];
  return armarDxf(nombre, d, 'm', ls);
}

// ---------------------------------------------------------------------------
// Datos opcionales de despiece y memoria (los da el motor de Techos).
// ---------------------------------------------------------------------------
export interface DespieceDxf {
  profileId: string; nombrePerfil: string; totalBarrasComerciales6m: number; totalMetrosRequeridosM: number;
  totalPesoAceroKg: number; eficienciaPromedioPorcentaje: number;
  patronesBarras: { longitudBarraComercialM: number; cortes: { longitudM: number; rolEstructural: string }[]; desperdicioSobraM: number }[];
}
export interface MemoriaDxf {
  datos: { tipo: string; luz: number; largo: number; alturaCol: number; alturaMax: number; area: number; pendientePct: number | null; nCols: number; nPiezas: number; cobertura: string };
  cargas: { D: number; L: number; V: number; qViento: number; succion: number; zona: string; Z: number; U1: number; U2: number; U3: number };
  grupos: { rol: string; nombreRol: string; perfilId: string; cant: number; Lmax: number; lambdaMax: number; lambdaLim: number; verif: { tipo: 'axial' | 'flecha'; demanda: number; capacidad: number; ratio: number } | null; estado: string; motivo: string; recomendado?: string }[];
  reacciones: { servicioKg: number; ultimaKg: number; levantamientoKg: number; nCols: number };
  pesoTotalKg: number; kgM2: number; estado: string;
  tijeral: { w: number; luz: number; d: number; M: number; Ncordon: number; V: number } | null;
}
export interface OpcionesLamina { nombre: string; empresa?: string; fecha?: string; despiece?: DespieceDxf[]; memoria?: MemoriaDxf | null }

// Hoja A1 apaisada (mm). Margen de encuadernación a la izquierda.
const HW = 841, HH = 594, ML = 25, MR = 10, MB = 10, MT = 10, SEP_HOJAS = 60;
const ESCALAS = [10, 20, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000];
const TXT = 3.5, TXT_S = 2.7, TXT_T = 5;

/** JUEGO DE LÁMINAS listo para imprimir: TM-01 estructura, TM-02 despiece, TM-03 memoria. */
export function dxfLamina(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, o: OpcionesLamina): string {
  const d = new Dibujo();
  const ns = Object.values(nodes);
  const segs = Object.values(segments).filter(s => nodes[s.nodeAId] && nodes[s.nodeBId]);
  if (!ns.length || !segs.length) return armarDxf(o.nombre, d, 'mm');
  const fecha = o.fecha || new Date().toLocaleDateString('es-PE');
  const hojas: { titulo: string; codigo: string }[] = [];

  // Marco y rótulo de una hoja; devuelve el origen (esquina inferior izquierda) de la hoja.
  const hoja = (titulo: string, sub: string): P2 => {
    const i = hojas.length;
    const codigo = `TM-0${i + 1}`;
    hojas.push({ titulo, codigo });
    const ox = i * (HW + SEP_HOJAS);
    d.caja(ox, 0, ox + HW, HH, 'MARCO');                                   // borde del papel
    d.caja(ox + ML, MB, ox + HW - MR, HH - MT, 'MARCO', 0.7);              // marco de dibujo
    // Rótulo 180 × 56 mm abajo a la derecha.
    const rw = 180, rh = 56, rx = ox + HW - MR - rw, ry = MB;
    d.caja(rx, ry, rx + rw, ry + rh, 'MARCO', 0.5);
    [14, 28, 42].forEach(y => d.linea([rx, ry + y], [rx + rw, ry + y], 'MARCO'));
    d.linea([rx + 120, ry], [rx + 120, ry + 28], 'MARCO');
    d.linea([rx + 120, ry + 14], [rx + rw, ry + 14], 'MARCO');
    d.texto([rx + 4, ry + 47], (o.empresa || 'InnovApp').toUpperCase(), 4.5, 'TEXTOS');
    d.texto([rx + 4, ry + 33], `PROYECTO: ${o.nombre}`.slice(0, 48), TXT, 'TEXTOS');
    d.texto([rx + 4, ry + 19], titulo.length > 46 ? titulo.slice(0, 46) : titulo, TXT_S, 'TEXTOS');
    d.texto([rx + 4, ry + 5], sub.slice(0, 44), TXT_S, 'TEXTOS');
    d.texto([rx + 123, ry + 22], 'LÁMINA', TXT_S, 'TEXTOS');
    d.texto([rx + 123, ry + 16.5], codigo, 4.5, 'TEXTOS');
    d.texto([rx + 123, ry + 8.5], `FECHA: ${fecha}`, TXT_S, 'TEXTOS');
    d.texto([rx + 123, ry + 3.5], 'FORMATO A1 · mm', TXT_S, 'TEXTOS');
    d.texto([ox + ML + 3, MB + 3], 'Generado con InnovApp · imprimir: Trazar → Ventana (marco de la lámina) → A1 a escala 1:1, o A3 "ajustar al papel"', 1.8, 'TEXTOS');
    return [ox, 0];
  };

  const minX = Math.min(...ns.map(n => n.x)), maxX = Math.max(...ns.map(n => n.x));
  const minY = Math.min(...ns.map(n => n.y)), maxY = Math.max(...ns.map(n => n.y));
  const minZ = Math.min(...ns.map(n => n.z || 0)), maxZ = Math.max(...ns.map(n => n.z || 0));
  const L = Math.max(0.1, maxX - minX), H = Math.max(0.1, maxY - minY), D = Math.max(0.1, maxZ - minZ);
  const r2 = (v: number) => Math.round(v * 100) / 100;

  // Pórticos (z de las columnas) y pórtico frontal (el plano con más piezas).
  const zCol = [...new Set(segs.filter(s => /^columna/.test(s.rolEstructural || '')).flatMap(s => [nodes[s.nodeAId].z || 0, nodes[s.nodeBId].z || 0]).map(r2))].sort((a, b) => a - b);
  const cuenta: Record<string, number> = {};
  segs.forEach(s => { const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; if (Math.abs((a.z || 0) - (b.z || 0)) < 0.02) { const k = r2(a.z || 0).toFixed(2); cuenta[k] = (cuenta[k] || 0) + 1; } });
  const zFrente = parseFloat(Object.entries(cuenta).sort((p, q) => q[1] - p[1])[0]?.[0] ?? String(minZ));
  const enFrente = (s: Segment3D) => Math.abs((nodes[s.nodeAId].z || 0) - zFrente) < 0.02 && Math.abs((nodes[s.nodeBId].z || 0) - zFrente) < 0.02;
  const alturaCol = (() => {
    const t = segs.filter(s => s.rolEstructural === 'columna').map(s => Math.max(nodes[s.nodeAId].y, nodes[s.nodeBId].y));
    return t.length ? Math.min(...t) - minY : H;
  })();
  const xCol = [...new Set(segs.filter(s => /^columna/.test(s.rolEstructural || '') && enFrente(s)).map(s => r2(nodes[s.nodeAId].x)))].sort((a, b) => a - b);
  const xCorreas = [...new Set(segs.filter(s => s.rolEstructural === 'correa').flatMap(s => [nodes[s.nodeAId].x, nodes[s.nodeBId].x]).map(r2))].sort((a, b) => a - b);

  /** Escala normalizada más pequeña que hace caber w×h metros en una caja de W×H mm. */
  const escala = (w: number, h: number, W: number, Hh: number) => ESCALAS.find(s => (w * 1000) / s <= W && (h * 1000) / s <= Hh) || ESCALAS[ESCALAS.length - 1];
  /** Grosor de trazo en mm de papel según el perfil y la escala. */
  const grosor = (s: Segment3D, esc: number) => Math.min(1.4, Math.max(0.18, ladoMm(s.profileId) / esc));

  // Dibuja una vista: proyección pr (metros) → caja de papel, centrada. Devuelve el mapeo.
  const vista = (caja: [number, number, number, number], filtro: (s: Segment3D) => boolean, pr: (n: Node3D) => P2, titulo: string, sub: string, margen: [number, number, number, number] = [18, 16, 30, 14]) => {
    const [x0, y0, x1, y1] = caja;
    const usados = segs.filter(filtro);
    const pts = usados.flatMap(s => [pr(nodes[s.nodeAId]), pr(nodes[s.nodeBId])]);
    if (!pts.length) return null;
    const u0 = Math.min(...pts.map(p => p[0])), u1 = Math.max(...pts.map(p => p[0])), v0 = Math.min(...pts.map(p => p[1])), v1 = Math.max(...pts.map(p => p[1]));
    const [mi, md, mb, ma] = margen; // izq, der, abajo (título + cotas), arriba
    const W = x1 - x0 - mi - md, Hh = y1 - y0 - mb - ma;
    const esc = escala(u1 - u0, v1 - v0, W, Hh);
    const k = 1000 / esc;
    const ox = x0 + mi + (W - (u1 - u0) * k) / 2 - u0 * k, oy = y0 + mb + Math.min(12, (Hh - (v1 - v0) * k) / 2) - v0 * k;
    const P = (u: number, v: number): P2 => [ox + u * k, oy + v * k];
    // Piezas: de la más delgada a la más gruesa; sin repetir trazos encimados (queda el más grueso).
    const trazos = new Map<string, { a: P2; b: P2; w: number; capa: string }>();
    usados.forEach(s => {
      const a = pr(nodes[s.nodeAId]), b = pr(nodes[s.nodeBId]);
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.005) return;
      const key = [a, b].map(p => p.map(v => Math.round(v * 200)).join(',')).sort().join('|');
      const w = grosor(s, esc), prev = trazos.get(key);
      if (!prev || prev.w < w) trazos.set(key, { a: P(...a), b: P(...b), w, capa: capaDe(s) });
    });
    [...trazos.values()].sort((p, q) => p.w - q.w).forEach(t => d.gruesa([t.a, t.b], t.w, t.capa));
    // Título de la vista con su escala.
    const cx = (x0 + x1) / 2, ty = y0 + 11;
    d.texto([cx, ty + 4.5], titulo, TXT_T, 'TEXTOS', 'centro');
    d.gruesa([[cx - anchoTxt(titulo, TXT_T) / 2, ty + 1.8], [cx + anchoTxt(titulo, TXT_T) / 2, ty + 1.8]], 0.35, 'TEXTOS');
    d.texto([cx, ty - 2.5], `${sub}  ·  ESC. 1:${esc}`, TXT_S, 'TEXTOS', 'centro');
    return { P, k, esc, u0, u1, v0, v1 };
  };

  // Cotas en papel: línea de cota desplazada, líneas de extensión, marcas oblicuas y valor (m).
  const cota = (a: P2, b: P2, off: number, txt?: string, vertical = false) => {
    const nrm: P2 = vertical ? [off, 0] : [0, off];
    const a2: P2 = [a[0] + nrm[0], a[1] + nrm[1]], b2: P2 = [b[0] + nrm[0], b[1] + nrm[1]];
    const ext = (p: P2, q: P2) => { const L0 = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; const ux = (q[0] - p[0]) / L0, uy = (q[1] - p[1]) / L0; d.linea([p[0] + ux * 1.5, p[1] + uy * 1.5], [q[0] + ux * 1.5, q[1] + uy * 1.5], 'COTAS'); };
    ext(a, a2); ext(b, b2);
    d.linea(a2, b2, 'COTAS');
    [a2, b2].forEach(p => d.gruesa([[p[0] - 1.1, p[1] - 1.1], [p[0] + 1.1, p[1] + 1.1]], 0.35, 'COTAS'));
    const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t = txt ?? m2(largo);
    const sgn = off >= 0 ? 1 : -1;
    void sgn;
    if (vertical) d.texto([(a2[0] + b2[0]) / 2 - 2.2, (a2[1] + b2[1]) / 2], t, TXT_S, 'COTAS', 'centro', 90);
    else d.texto([(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2 + 2.3], t, TXT_S, 'COTAS', 'centro');
  };
  /** Cadena de cotas (distancias parciales en metros) sobre una línea. */
  const cadena = (pos: number[], fijo: number, off: number, P: (u: number) => P2, vertical = false, k = 1) => {
    for (let i = 1; i < pos.length; i++) {
      const anchoMm = (pos[i] - pos[i - 1]) * k;
      if (anchoMm < anchoTxt(m2(pos[i] - pos[i - 1]), TXT_S) + 2) continue; // muy junto: se omite el número (queda la cota total)
      cota(P(pos[i - 1]), P(pos[i]), off, m2(pos[i] - pos[i - 1]), vertical);
    }
    void fijo;
  };
  const ejesPuestos: P2[] = [];
  const eje = (c: P2, t: string) => { if (ejesPuestos.some(p => Math.hypot(p[0] - c[0], p[1] - c[1]) < 11)) return; ejesPuestos.push(c); d.circulo(c, 5, 'EJES'); d.texto(c, t, 3.6, 'EJES', 'centro'); };

  // =========================================================================
  // TM-01 ESTRUCTURA
  // =========================================================================
  const [hx] = hoja('ESTRUCTURA METÁLICA: PLANTA, ELEVACIONES E ISOMÉTRICA', `Luz ${m2(L)} m · largo ${m2(D)} m · altura ${m2(H)} m`);
  const X0 = hx + ML, X1 = hx + HW - MR, Y0 = MB, Y1 = HH - MT;
  const yFranja = Y0 + 100, xMed = X0 + (X1 - X0) * 0.5, yMed = yFranja + (Y1 - yFranja) * 0.54;

  // 1. PLANTA (arriba izquierda) — x = luz, y = largo.
  const vP = vista([X0, yMed, xMed, Y1], s => !/^columna/.test(s.rolEstructural || ''), n => [n.x - minX, (n.z || 0) - minZ],
    'PLANTA DE TECHO Y CORREAS', `${m2(L)} × ${m2(D)} m`, [26, 26, 30, 22]);
  if (vP) {
    const { P, k } = vP;
    zCol.forEach((z, i) => { const y = P(0, z - minZ)[1]; d.linea([P(0, 0)[0] - 10, y], [P(L, 0)[0] + 4, y], 'EJES'); eje([P(0, 0)[0] - 15, y], String(i + 1)); });
    xCol.forEach((x, i) => { const xx = P(x - minX, 0)[0]; d.linea([xx, P(0, 0)[1] - 4], [xx, P(0, D)[1] + 8], 'EJES'); eje([xx, P(0, D)[1] + 13], String.fromCharCode(65 + i)); });
    // Cotas: separación de correas (arriba) y de pórticos (derecha), con totales.
    const yTop = P(0, D)[1];
    if (xCorreas.length > 1 && xCorreas.length <= 30) cadena(xCorreas.map(x => x - minX), 0, 0, u => [P(u, 0)[0], yTop], false, k);
    cota([P(0, 0)[0], yTop], [P(L, 0)[0], yTop], xCorreas.length > 1 ? 7 : 3, `${m2(L)} m`);
    const xR = P(L, 0)[0];
    if (zCol.length > 1) cadena(zCol.map(z => z - minZ), 0, 7, v => [xR, P(0, v)[1]], true, k);
    cota([xR, P(0, 0)[1]], [xR, P(0, D)[1]], zCol.length > 1 ? 14 : 7, `${m2(D)} m`, true);
  }

  // 2. ELEVACIÓN FRONTAL (abajo izquierda) — pórtico.
  const vF = vista([X0, yFranja, xMed, yMed], enFrente, n => [n.x - minX, n.y - minY], 'ELEVACIÓN FRONTAL (PÓRTICO)',
    `Luz ${m2(L)} m · altura ${m2(H)} m`, [26, 26, 36, 10]);
  if (vF) {
    const { P, k } = vF;
    d.linea([P(0, 0)[0] - 8, P(0, 0)[1]], [P(L, 0)[0] + 8, P(0, 0)[1]], 'EJES');
    d.texto([P(0, 0)[0] - 9, P(0, 0)[1] + 1.5], 'NPT ±0.00', TXT_S, 'COTAS', 'der');
    if (xCol.length > 1) cadena(xCol.map(x => x - minX), 0, -7, u => P(u, 0), false, k);
    cota(P(0, 0), P(L, 0), xCol.length > 2 ? -14 : -8, `LUZ ${m2(L)} m`);
    cota(P(0, 0), P(0, alturaCol), -8, m2(alturaCol), true);
    if (H - alturaCol > 0.05) {
      cota(P(L, 0), P(L, H), 8, m2(H), true);
      cota(P(L, alturaCol), P(L, H), 16, m2(H - alturaCol), true);
    }
    // Peralte del tijeral al centro y pendiente.
    const fr = segs.filter(enFrente);
    const yEn = (rol: RegExp, x: number) => {
      let y: number | null = null;
      fr.filter(s => rol.test(s.rolEstructural || '')).forEach(s => {
        const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
        const [xa, xb] = [a.x - minX, b.x - minX];
        if ((xa - x) * (xb - x) <= 0 && Math.abs(xb - xa) > 1e-6) { const yy = a.y + (b.y - a.y) * (x - xa) / (xb - xa) - minY; y = y === null ? yy : Math.max(y, yy); }
      });
      return y;
    };
    const xc = L / 2, ys = yEn(/cordon_superior|viga_principal/, xc), yi = yEn(/cordon_inferior/, xc);
    if (ys !== null && yi !== null && ys - yi > 0.05) {
      cota(P(xc, yi), P(xc, ys), 6, `PERALTE ${m2(ys - yi)}`, true);
    }
    const m = o.memoria?.datos.pendientePct;
    if (m) d.texto([P(L * 0.27, 0)[0], P(0, (yEn(/cordon_superior|viga_principal/, L * 0.27) ?? H)) [1] + 5], `PENDIENTE ${m} %`, TXT_S, 'COTAS', 'centro');
    xCol.forEach((x, i) => eje([P(x - minX, 0)[0], P(0, 0)[1] - (xCol.length > 2 ? 24 : 18)], String.fromCharCode(65 + i)));
  }

  // 3. ISOMÉTRICA (arriba derecha).
  const c30 = Math.cos(Math.PI / 6);
  const vI = vista([xMed, yMed, X1, Y1], () => true, n => { const x = n.x - minX, z = (n.z || 0) - minZ, y = n.y - minY; return [(x + z) * c30, y + (z - x) * 0.5]; },
    'VISTA ISOMÉTRICA', 'Estructura completa', [14, 14, 30, 14]);
  void vI;

  // 4. ELEVACIÓN LATERAL (abajo derecha) — piezas a lo largo (columnas, correas, vigas, cruces).
  const vL = vista([xMed, yFranja, X1, yMed], s => { const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; return Math.abs(a.x - b.x) < 0.02 && !/montante|diagonal/.test(s.rolEstructural || ''); },
    n => [(n.z || 0) - minZ, n.y - minY], 'ELEVACIÓN LATERAL', `${zCol.length} pórticos${zCol.length > 1 ? ` a ${m2(D / (zCol.length - 1))} m` : ''}`, [26, 26, 36, 10]);
  if (vL) {
    const { P, k } = vL;
    d.linea([P(0, 0)[0] - 8, P(0, 0)[1]], [P(D, 0)[0] + 8, P(0, 0)[1]], 'EJES');
    if (zCol.length > 1) cadena(zCol.map(z => z - minZ), 0, -7, u => P(u, 0), false, k);
    cota(P(0, 0), P(D, 0), zCol.length > 1 ? -14 : -8, `LARGO ${m2(D)} m`);
    cota(P(D, 0), P(D, H), 8, m2(H), true);
    zCol.forEach((z, i) => eje([P(z - minZ, 0)[0], P(0, 0)[1] - 24], String(i + 1)));
  }

  // 5. Franja inferior: cuadro de elementos, leyenda de trazos y notas.
  const porRol = new Map<string, { n: number; m: number; perf: Map<string, number> }>();
  segs.forEach(s => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId], rol = s.rolEstructural || 'viga_principal';
    const r = porRol.get(rol) || { n: 0, m: 0, perf: new Map<string, number>() };
    r.n++; r.m += Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)); r.perf.set(s.profileId || '', (r.perf.get(s.profileId || '') || 0) + 1);
    porRol.set(rol, r);
  });
  const filas = [...porRol.entries()].sort((p, q) => ORDEN_ROL.indexOf(p[0]) - ORDEN_ROL.indexOf(q[0]))
    .map(([rol, r]) => [NOMBRE_ROL[rol] || rol, String(r.n), [...r.perf.keys()].map(nombreCorto).join(' / '), m2(r.m)]);
  const tabla = (x: number, yTop: number, titulo: string, enc0: string[], rows: string[][], h = TXT_S, anchoMin?: number[]) => {
    const rh = h * 2.2;
    const cw = enc0.map((_, j) => Math.max(anchoMin?.[j] || 0, ...[enc0, ...rows].map(r => anchoTxt(r[j] || '', h))) + 3);
    const W = cw.reduce((a, b) => a + b, 0);
    const alto = rh * (rows.length + 2);
    d.caja(x, yTop, x + W, yTop - alto, 'CUADRO', 0.35);
    d.texto([x + W / 2, yTop - rh / 2], titulo, h * 1.1, 'CUADRO', 'centro');
    [enc0, ...rows].forEach((fila, i) => {
      const y = yTop - rh * (i + 1);
      d.linea([x, y], [x + W, y], 'CUADRO');
      let xx = x;
      fila.forEach((c, j) => { d.texto([xx + 1.5, y - rh * 0.68], c, h, i === 0 ? 'TEXTOS' : (c === 'NO CUMPLE' ? 'NO_CUMPLE' : 'CUADRO')); xx += cw[j]; if (j < fila.length - 1) d.linea([xx, y], [xx, y - rh], 'CUADRO'); });
    });
    return { W, alto };
  };
  const t1 = tabla(X0 + 4, yFranja - 4, 'CUADRO DE ELEMENTOS Y PERFILES', ['Elemento', 'Cant.', 'Perfil', 'Long. (m)'], filas);
  // Leyenda de trazos: grosor según perfil.
  const xLey = X0 + 4 + t1.W + 10;
  d.texto([xLey, yFranja - 7], 'LEYENDA (grosor según el perfil)', TXT_S, 'TEXTOS');
  [...porRol.keys()].sort((p, q) => ORDEN_ROL.indexOf(p) - ORDEN_ROL.indexOf(q)).forEach((rol, i) => {
    const s = segs.find(x => x.rolEstructural === rol)!;
    const y = yFranja - 14 - i * 6;
    d.gruesa([[xLey, y], [xLey + 16, y]], Math.min(1.4, Math.max(0.18, ladoMm(s.profileId) / 100)), CAPA_ROL[rol] || 'VIGAS');
    d.texto([xLey + 19, y - 1], NOMBRE_ROL[rol] || rol, TXT_S, 'TEXTOS');
  });
  const xNot = xLey + 92;
  ['NOTAS:', '1. Medidas en metros; láminas en mm (A1).', '2. Acero ASTM A500 Gr. B; perfiles C ASTM A36.', '3. Soldadura E-6011 (raíz) y E-7018 (acabado), 4 mm mín.',
    '4. Placas base con 4 pernos tipo J empotrados 35 cm.', '5. Cobertura con autoperforantes y arandela EPDM.', '6. Pintura: 2 manos anticorrosivo + 2 de esmalte.',
    '7. Ver despiece (TM-02) y memoria de cálculo (TM-03).']
    .forEach((t, i) => { if (xNot + 60 < X1 - 185) d.texto([xNot, yFranja - 7 - i * 5.6], t, i ? TXT_S : TXT, 'TEXTOS'); });

  // =========================================================================
  // TM-02 DESPIECE Y CORTES (barras de 6 m)
  // =========================================================================
  const desp = (o.despiece || []).filter(p => p.patronesBarras?.length);
  if (desp.length) {
    let hj = hoja('DESPIECE Y CORTES (BARRAS COMERCIALES DE 6 m)', `${desp.reduce((s, p) => s + p.totalBarrasComerciales6m, 0)} barras · ${desp.length} perfiles`);
    let x0 = hj[0] + ML + 6;
    const yIni = HH - MT - 8, yFin = MB + 64;
    let y = yIni;
    // Resumen arriba.
    const resumen = desp.map(p => [nombreCorto(p.profileId), String(p.totalBarrasComerciales6m), m2(p.totalMetrosRequeridosM), p.totalPesoAceroKg.toFixed(1), `${Math.min(100, Math.round(p.eficienciaPromedioPorcentaje))} %`]);
    const tr = tabla(x0, y, 'RESUMEN DE COMPRA', ['Perfil', 'Barras 6 m', 'Metros', 'Peso (kg)', 'Aprovech.'], resumen);
    y -= tr.alto + 10;
    const anchoCol = HW - ML - MR - 12, barraMm = 330;
    const siguiente = (alto: number) => {
      if (y - alto >= yFin) return;
      hj = hoja('DESPIECE Y CORTES (continuación)', 'Barras comerciales de 6 m'); x0 = hj[0] + ML + 6; y = yIni;
    };
    desp.forEach(p => {
      // Patrones iguales juntos (mismos cortes) con su cantidad.
      const grupos = new Map<string, { n: number; pat: DespieceDxf['patronesBarras'][number] }>();
      p.patronesBarras.forEach(b => { const k = b.cortes.map(c => c.longitudM.toFixed(3)).sort().join('+'); const g = grupos.get(k); if (g) g.n++; else grupos.set(k, { n: 1, pat: b }); });
      siguiente(20);
      d.texto([x0, y], `${nombreCorto(p.profileId)}  —  ${p.totalBarrasComerciales6m} barras de 6 m · ${m2(p.totalMetrosRequeridosM)} m · ${p.totalPesoAceroKg.toFixed(1)} kg`, TXT, 'TEXTOS');
      d.gruesa([[x0, y - 1.6], [x0 + anchoCol - 6, y - 1.6]], 0.25, 'TEXTOS');
      y -= 11;
      [...grupos.values()].sort((a, b) => b.n - a.n).forEach((g, i) => {
        siguiente(13);
        const L6 = g.pat.longitudBarraComercialM || 6, k = barraMm / L6;
        d.texto([x0, y - 5], `${String.fromCharCode(65 + (i % 26))}  ×${g.n}`, TXT, 'TEXTOS');
        const bx = x0 + 22;
        d.caja(bx, y, bx + barraMm, y - 7, 'DESPIECE', 0.35);
        let cx = bx;
        const cortes = [...g.pat.cortes].sort((a, b) => b.longitudM - a.longitudM);
        // Pieza más larga que la barra: no se puede sacar de una barra → se marca para empalmar.
        if (cortes.some(c => c.longitudM > L6 + 1e-6)) {
          d.caja(bx, y, bx + barraMm, y - 7, 'NO_CUMPLE', 0.5);
          d.texto([bx + barraMm / 2, y - 3.5], `PIEZA DE ${m2(Math.max(...cortes.map(c => c.longitudM)))} m > ${m2(L6)} m: REQUIERE EMPALME SOLDADO`, TXT_S, 'NO_CUMPLE', 'centro');
          y -= 11;
          return;
        }
        cortes.forEach(c => {
          const w = c.longitudM * k;
          d.linea([cx + w, y], [cx + w, y - 7], 'DESPIECE');
          if (w > anchoTxt(m2(c.longitudM), TXT_S) + 1.5) d.texto([cx + w / 2, y - 3.5], m2(c.longitudM), TXT_S, 'TEXTOS', 'centro');
          cx += w;
        });
        // Sobrante rayado.
        for (let xx = cx + 2; xx < bx + barraMm - 0.5; xx += 3) d.linea([xx, y - 7], [Math.min(bx + barraMm, xx + 3), y], 'ARRIOSTRES');
        const resumenTxt = `${cortes.map(c => m2(c.longitudM)).join(' + ')}  · sobra ${m2(g.pat.desperdicioSobraM)}`;
        d.texto([bx + barraMm + 4, y - 4.6], resumenTxt.length > 95 ? resumenTxt.slice(0, 93) + '…' : resumenTxt, TXT_S, 'TEXTOS');
        y -= 11;
      });
      y -= 4;
    });
  }

  // =========================================================================
  // TM-03 MEMORIA DE CÁLCULO
  // =========================================================================
  const mem = o.memoria;
  if (mem) {
    const [mx] = hoja('MEMORIA DE CÁLCULO (PREDISEÑO RNE E.020 / E.090)', `Estado: ${mem.estado === 'CUMPLE' ? 'CUMPLE' : mem.estado === 'OBSERVACION' ? 'CON OBSERVACIONES' : 'NO CUMPLE'}`);
    const xa = mx + ML + 6, ytop = HH - MT - 10;
    let y = ytop;
    const bloque = (titulo: string, lineas: string[]) => {
      d.texto([xa, y], titulo, TXT_T, 'TEXTOS'); d.gruesa([[xa, y - 2], [xa + anchoTxt(titulo, TXT_T), y - 2]], 0.35, 'TEXTOS'); y -= 9;
      lineas.forEach(t => { d.texto([xa + 2, y], t, 4, 'TEXTOS'); y -= 7.5; });
      y -= 5;
    };
    const dd = mem.datos, c = mem.cargas;
    bloque('1. DATOS GENERALES', [
      `Tipo de techo: ${dd.tipo}`, `Luz: ${m2(dd.luz)} m · Largo: ${m2(dd.largo)} m · Área: ${m2(dd.area)} m²`,
      `Altura de columnas: ${m2(dd.alturaCol)} m · Altura máxima: ${m2(dd.alturaMax)} m`,
      `Pendiente: ${dd.pendientePct != null ? `${dd.pendientePct} %` : '—'} · Columnas apoyadas: ${dd.nCols} · Piezas: ${dd.nPiezas}`,
      `Cobertura: ${dd.cobertura}`,
    ]);
    bloque('2. CARGAS (E.020) Y COMBINACIONES', [
      `Carga muerta D = ${c.D} kg/m² · Carga viva de techo L = ${c.L} kg/m²`,
      `Viento V = ${c.V} km/h → q = 0.005·V² = ${c.qViento.toFixed(1)} kg/m² · succión (Cp −0.7) = ${c.succion.toFixed(1)} kg/m²`,
      `Zona sísmica ${c.zona} (Z = ${c.Z})`,
      `U1 = 1.4 D = ${c.U1.toFixed(1)} kg/m² · U2 = 1.2 D + 1.6 L = ${c.U2.toFixed(1)} kg/m²`,
      `U3 = 0.9 D − W (levantamiento) = ${c.U3.toFixed(1)} kg/m²`,
    ]);
    if (mem.tijeral) {
      const t = mem.tijeral;
      bloque('3. TIJERAL', [
        `Carga por tijeral w = ${(t.w / 1000).toFixed(2)} kN/m · luz = ${m2(t.luz)} m · peralte d = ${m2(t.d)} m`,
        `Momento M = w·L²/8 = ${(t.M / 1000).toFixed(2)} kN·m → fuerza en cordones N = M/d = ${t.Ncordon.toFixed(2)} kN`,
        `Cortante en apoyo V = w·L/2 = ${t.V.toFixed(2)} kN (diagonales y montantes)`,
      ]);
    }
    const r = mem.reacciones;
    bloque(`${mem.tijeral ? 4 : 3}. REACCIONES POR COLUMNA Y PESO`, [
      `Servicio: ${r.servicioKg.toFixed(0)} kg · Última (U2): ${r.ultimaKg.toFixed(0)} kg · Levantamiento (U3): ${r.levantamientoKg.toFixed(0)} kg`,
      `Peso de la estructura: ${mem.pesoTotalKg.toFixed(0)} kg (${mem.kgM2.toFixed(1)} kg/m² de techo)`,
    ]);
    bloque('CRITERIOS', [
      'Columnas: carga crítica de Euler con FS = 3 (o fluencia 0.6·Fy·A, lo menor).',
      'Vigas, cordones y correas: flecha 5qL⁴/384EI ≤ L/240 (correas L/180).',
      'Esbeltez λ = KL/r ≤ 200 (correas y arriostres ≤ 300).',
      'Es un PREDISEÑO: el cálculo definitivo lo firma un ingeniero colegiado.',
    ]);
    // Tabla de verificación (columna derecha).
    const xb = mx + ML + 6 + (HW - ML - MR) * 0.5;
    const filasV = mem.grupos.map(g => [
      g.nombreRol, nombreCorto(g.perfilId), String(g.cant), m2(g.Lmax), `${g.lambdaMax.toFixed(0)} / ${g.lambdaLim}`,
      g.verif ? (g.verif.tipo === 'axial' ? `P ${g.verif.demanda.toFixed(1)} ≤ ${g.verif.capacidad.toFixed(1)} kN` : `f ${g.verif.demanda.toFixed(0)} ≤ ${g.verif.capacidad.toFixed(0)} mm`) : 'Solo esbeltez',
      g.verif ? g.verif.ratio.toFixed(2) : '—', g.estado === 'CUMPLE' ? 'CUMPLE' : g.estado === 'OBSERVACION' ? 'OBSERV.' : 'NO CUMPLE',
    ]);
    const tv = tabla(xb, ytop + 3, 'VERIFICACIÓN POR TIPO DE PIEZA', ['Elemento', 'Perfil', 'Cant.', 'L máx (m)', 'λ / lím', 'Demanda ≤ capacidad', 'Ratio', 'Estado'], filasV, 3.2);
    let yy = ytop + 3 - tv.alto - 8;
    const obs = mem.grupos.filter(g => g.estado !== 'CUMPLE' || g.recomendado);
    if (obs.length) {
      d.texto([xb, yy], 'OBSERVACIONES Y RECOMENDACIONES', TXT, 'TEXTOS'); yy -= 6;
      obs.slice(0, 14).forEach(g => { const t = `• ${g.nombreRol}: ${g.motivo}${g.recomendado ? ` → usar ${g.recomendado.replace(/\s*\[[^\]]*\]/, '').replace(/\s*\((?:\d|LA|ASTM)[^)]*\)/g, '')}` : ''}`; const capa = g.estado === 'NO_CUMPLE' ? 'NO_CUMPLE' : 'TEXTOS'; const max = 70; d.texto([xb + 2, yy], t.slice(0, max), TXT_S, capa); yy -= 5; if (t.length > max) { d.texto([xb + 6, yy], t.slice(max, max * 2), TXT_S, capa); yy -= 5; } });
    }
    // Sello de estado.
    const sx = xb, sy = MB + 64;
    d.caja(sx, sy, sx + 120, sy + 18, mem.estado === 'NO_CUMPLE' ? 'NO_CUMPLE' : 'MARCO', 0.5);
    d.texto([sx + 60, sy + 11.5], `RESULTADO: ${mem.estado === 'CUMPLE' ? 'CUMPLE' : mem.estado === 'OBSERVACION' ? 'CUMPLE CON OBSERVACIONES' : 'NO CUMPLE'}`, 4, mem.estado === 'NO_CUMPLE' ? 'NO_CUMPLE' : 'TEXTOS', 'centro');
    d.texto([sx + 60, sy + 4.5], 'Prediseño referencial · revisar y firmar por ingeniero', TXT_S, 'TEXTOS', 'centro');
  }

  // Número total de láminas en cada rótulo ("1 de 3").
  hojas.forEach((_h, i) => d.texto([i * (HW + SEP_HOJAS) + HW - MR - 4, MB + 16.5], `${i + 1} de ${hojas.length}`, TXT_S, 'TEXTOS', 'der'));
  return armarDxf(o.nombre, d, 'mm');
}
