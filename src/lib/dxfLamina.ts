// =============================================================================
// Exportación a AutoCAD (DXF R12, el que abre cualquier versión) — Techos.
//
// Antes se exportaban las líneas en 3D tal cual (la altura en el eje Y): AutoCAD abre
// mirando desde arriba (plano X-Y) y solo se veía el FRENTE, con los pórticos encimados.
// Ahora hay dos formas:
//   1. LÁMINAS ESTRUCTURALES listas para imprimir (A1/A0 en mm): E-01 estructura (planta, elevaciones e
//      isométrica a escala 1:50 / 1:75 / 1:100, cotas y ejes), E-02 detalles y especificaciones técnicas
//      (placa base, empalme, cuadro de columnas, cargas y parámetros sísmicos) y E-03 memoria de cálculo
//      (E.020, E.090 y sismo E.030). Marco y rótulo estructural; trazos con grosor según el perfil.
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
  ['MARCO', 7, 'CONTINUOUS'], ['CUADRO', 7, 'CONTINUOUS'],
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
// Datos de la memoria de cálculo (los da el motor de Techos).
// ---------------------------------------------------------------------------
export interface MemoriaDxf {
  datos: { tipo: string; luz: number; largo: number; alturaCol: number; alturaMax: number; area: number; pendientePct: number | null; nCols: number; nPiezas: number; cobertura: string };
  cargas: { D: number; L: number; V: number; qViento: number; succion: number; zona: string; Z: number; U1: number; U2: number; U3: number };
  grupos: { rol: string; nombreRol: string; perfilId: string; cant: number; Lmax: number; lambdaMax: number; lambdaLim: number; verif: { tipo: 'axial' | 'flecha'; demanda: number; capacidad: number; ratio: number } | null; estado: string; motivo: string; recomendado?: string }[];
  reacciones: { servicioKg: number; ultimaKg: number; levantamientoKg: number; nCols: number };
  pesoTotalKg: number; kgM2: number; estado: string;
  tijeral: { w: number; luz: number; d: number; M: number; Ncordon: number; V: number } | null;
  sismo?: {
    Z: number; U: number; C: number; S: number; R: number; Tp: number; TL: number; T: number; hn: number; zona: string; suelo: string; categoria: string;
    PKg: number; VKg: number; VColKg: number; nCols: number; perfilCol: string; deltaCm: number; deriva: number; derivaLim: number;
    MColKgM: number; fbKgCm2: number; fbAdmKgCm2: number; ratioFlexion: number; estado: string; motivo: string;
    concreto?: { b: number; h: number; n: number; barra: string; asCm2: number; cuantia: number; PuKg: number; phiPnKg: number; MuKgM: number; phiMnKgM: number; deriva: number; derivaLim: number; estribos: string; LoCm: number; estado: string; motivo: string } | null;
  } | null;
}
/** escala: 0 = automática (la mayor que quepa: 1:50, 1:75, 1:100…); 50, 75 o 100 = fija para planta y elevaciones. */
export interface OpcionesLamina { nombre: string; empresa?: string; fecha?: string; memoria?: MemoriaDxf | null; escala?: number }

// Formatos de papel apaisados (mm). Margen de encuadernación a la izquierda.
const FORMATOS = { A1: [841, 594], A0: [1189, 841] } as const;
type Formato = keyof typeof FORMATOS;
const ML = 25, MR = 10, MB = 10, MT = 10, SEP_HOJAS = 60;
const ESCALAS = [5, 10, 20, 25, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000];
const TXT = 3.5, TXT_S = 2.7, TXT_T = 5;
const RW = 180, RH = 64; // rótulo
const RECUB = 40; // recubrimiento de columnas de concreto (mm)
const DIAM_MM: Record<string, number> = { '1/2"': 12.7, '5/8"': 15.9, '3/4"': 19.1, '1"': 25.4 };

/**
 * JUEGO DE LÁMINAS ESTRUCTURALES listo para imprimir:
 *  E-01… Estructura (planta, elevaciones e isométrica a la escala elegida; si no caben en A1 se
 *        reparten en más láminas o se usa A0, sin cambiar la escala), E-0n Detalles y
 *        especificaciones, E-0n Memoria de cálculo (con análisis sísmico). Solo contenido estructural:
 *        el despiece de cortes es información de taller y NO va en las láminas.
 */
export function dxfLamina(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, o: OpcionesLamina): string {
  const d = new Dibujo();
  const ns = Object.values(nodes);
  const segs = Object.values(segments).filter(s => nodes[s.nodeAId] && nodes[s.nodeBId]);
  if (!ns.length || !segs.length) return armarDxf(o.nombre, d, 'mm');
  const fecha = o.fecha || new Date().toLocaleDateString('es-PE');
  const hojas: { x: number; w: number; h: number; codigo: string }[] = [];
  let xSig = 0;

  /** Marco y rótulo estructural. Devuelve la hoja (origen x, ancho y alto). */
  const hoja = (titulo: string, escalaTxt: string, formato: Formato = 'A1') => {
    const [W, H] = FORMATOS[formato];
    const ox = xSig; xSig += W + SEP_HOJAS;
    const codigo = `E-${String(hojas.length + 1).padStart(2, '0')}`;
    hojas.push({ x: ox, w: W, h: H, codigo });
    d.caja(ox, 0, ox + W, H, 'MARCO');
    d.caja(ox + ML, MB, ox + W - MR, H - MT, 'MARCO', 0.7);
    // Rótulo: empresa · proyecto · plano · especialidad y escala · ingeniero y fecha | lámina.
    const rx = ox + W - MR - RW, ry = MB, fh = RH / 5, cx = rx + 135;
    d.caja(rx, ry, rx + RW, ry + RH, 'MARCO', 0.5);
    [1, 2, 3, 4].forEach(k => d.linea([rx, ry + fh * k], [k <= 3 ? cx : rx + RW, ry + fh * k], 'MARCO'));
    d.linea([cx, ry], [cx, ry + fh * 4], 'MARCO');
    d.linea([rx + 70, ry], [rx + 70, ry + fh * 2], 'MARCO');
    const t = (k: number, x: number, txt: string, h = TXT_S) => d.texto([x, ry + fh * k + fh * 0.33], txt, h, 'TEXTOS');
    t(4, rx + 3, (o.empresa || 'InnovApp').toUpperCase().slice(0, 34), 4.5);
    t(3, rx + 3, `PROYECTO: ${o.nombre}`.slice(0, 48));
    t(2, rx + 3, `PLANO: ${titulo}`.slice(0, 50));
    t(1, rx + 3, 'ESPECIALIDAD: ESTRUCTURAS');
    t(1, rx + 72, `ESCALA: ${escalaTxt}`);
    t(0, rx + 3, 'ING. RESP.: ____________');
    t(0, rx + 72, 'CIP N° ________');
    d.texto([cx + 22.5, ry + fh * 3.45], 'LÁMINA', TXT_S, 'TEXTOS', 'centro');
    d.texto([cx + 22.5, ry + fh * 2.2], codigo, 9, 'TEXTOS', 'centro');
    d.texto([cx + 22.5, ry + fh * 0.95], `FECHA ${fecha}`, 2.2, 'TEXTOS', 'centro');
    d.texto([cx + 22.5, ry + fh * 0.35], `FORMATO ${formato}`, 2.2, 'TEXTOS', 'centro');
    d.texto([ox + ML + 3, MB + 3], 'Generado con InnovApp · imprimir: Trazar → Ventana (marco de la lámina) → papel del formato a escala 1:1 (o A3 "ajustar al papel")', 1.8, 'TEXTOS');
    return { ox, W, H };
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
  const ladoSeg = (s: Segment3D) => s.rolEstructural === 'columna_concreto' ? Math.max(...((s as any).seccionCm || [25, 25])) * 10 : ladoMm(s.profileId);
  const grosor = (s: Segment3D, esc: number) => Math.min(1.8, Math.max(0.18, ladoSeg(s) / esc));

  // ---------- Cotas y ejes (en mm de papel) ----------
  const cota = (a: P2, b: P2, off: number, txt?: string, vertical = false) => {
    const nrm: P2 = vertical ? [off, 0] : [0, off];
    const a2: P2 = [a[0] + nrm[0], a[1] + nrm[1]], b2: P2 = [b[0] + nrm[0], b[1] + nrm[1]];
    const ext = (p: P2, q: P2) => { const L0 = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; const ux = (q[0] - p[0]) / L0, uy = (q[1] - p[1]) / L0; d.linea([p[0] + ux * 1.5, p[1] + uy * 1.5], [q[0] + ux * 1.5, q[1] + uy * 1.5], 'COTAS'); };
    ext(a, a2); ext(b, b2);
    d.linea(a2, b2, 'COTAS');
    [a2, b2].forEach(p => d.gruesa([[p[0] - 1.1, p[1] - 1.1], [p[0] + 1.1, p[1] + 1.1]], 0.35, 'COTAS'));
    const t = txt ?? m2(Math.hypot(b[0] - a[0], b[1] - a[1]));
    if (vertical) d.texto([(a2[0] + b2[0]) / 2 - 2.2, (a2[1] + b2[1]) / 2], t, TXT_S, 'COTAS', 'centro', 90);
    else d.texto([(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2 + 2.3], t, TXT_S, 'COTAS', 'centro');
  };
  const cadena = (pos: number[], off: number, P: (u: number) => P2, vertical: boolean, k: number) => {
    for (let i = 1; i < pos.length; i++) {
      if ((pos[i] - pos[i - 1]) * k < anchoTxt(m2(pos[i] - pos[i - 1]), TXT_S) + 2) continue;
      cota(P(pos[i - 1]), P(pos[i]), off, m2(pos[i] - pos[i - 1]), vertical);
    }
  };
  let ejesPuestos: P2[] = [];
  const eje = (c: P2, t: string) => { if (ejesPuestos.some(p => Math.hypot(p[0] - c[0], p[1] - c[1]) < 11)) return; ejesPuestos.push(c); d.circulo(c, 5, 'EJES'); d.texto(c, t, 3.6, 'EJES', 'centro'); };
  const letra = (i: number) => String.fromCharCode(65 + (i % 26));

  // ---------- Vistas ----------
  interface Vista {
    titulo: string; sub: string; filtro: (s: Segment3D) => boolean; pr: (n: Node3D) => P2;
    margen: [number, number, number, number]; // izq, der, abajo, arriba
    anotar?: (P: (u: number, v: number) => P2, k: number) => void; libre?: boolean;
  }
  const c30 = Math.cos(Math.PI / 6);
  const fr = segs.filter(enFrente);
  const yEn = (rol: RegExp, x: number) => {
    let y: number | null = null;
    fr.filter(s => rol.test(s.rolEstructural || '')).forEach(s => {
      const a = nodes[s.nodeAId], b = nodes[s.nodeBId];
      const [xa, xb] = [a.x - minX, b.x - minX];
      if ((xa - x) * (xb - x) <= 0 && Math.abs(xb - xa) > 1e-6) { const yy = a.y + (b.y - a.y) * (x - xa) / (xb - xa) - minY; y = y === null ? yy : Math.max(y, yy); }
    });
    return y as number | null;
  };
  const vistas: Vista[] = [
    {
      titulo: 'PLANTA DE TECHO Y CORREAS', sub: `${m2(L)} × ${m2(D)} m`, margen: [26, 26, 26, 24],
      filtro: s => !/^columna/.test(s.rolEstructural || ''), pr: n => [n.x - minX, (n.z || 0) - minZ],
      anotar: (P, k) => {
        zCol.forEach((z, i) => { const y = P(0, z - minZ)[1]; d.linea([P(0, 0)[0] - 10, y], [P(L, 0)[0] + 4, y], 'EJES'); eje([P(0, 0)[0] - 15, y], String(i + 1)); });
        xCol.forEach((x, i) => { const xx = P(x - minX, 0)[0]; d.linea([xx, P(0, 0)[1] - 4], [xx, P(0, D)[1] + 8], 'EJES'); eje([xx, P(0, D)[1] + 13], letra(i)); });
        const yTop = P(0, D)[1];
        if (xCorreas.length > 1 && xCorreas.length <= 40) cadena(xCorreas.map(x => x - minX), 0, u => [P(u, 0)[0], yTop], false, k);
        cota([P(0, 0)[0], yTop], [P(L, 0)[0], yTop], xCorreas.length > 1 ? 7 : 3, `${m2(L)} m`);
        const xR = P(L, 0)[0];
        if (zCol.length > 1) cadena(zCol.map(z => z - minZ), 7, v => [xR, P(0, v)[1]], true, k);
        cota([xR, P(0, 0)[1]], [xR, P(0, D)[1]], zCol.length > 1 ? 14 : 7, `${m2(D)} m`, true);
      },
    },
    {
      titulo: 'ELEVACIÓN FRONTAL (PÓRTICO TÍPICO)', sub: `Luz ${m2(L)} m · altura ${m2(H)} m`, margen: [28, 28, 40, 12],
      filtro: enFrente, pr: n => [n.x - minX, n.y - minY],
      anotar: (P, k) => {
        d.linea([P(0, 0)[0] - 8, P(0, 0)[1]], [P(L, 0)[0] + 8, P(0, 0)[1]], 'EJES');
        d.texto([P(0, 0)[0] - 9, P(0, 0)[1] + 1.5], 'NPT ±0.00', TXT_S, 'COTAS', 'der');
        if (xCol.length > 1) cadena(xCol.map(x => x - minX), -7, u => P(u, 0), false, k);
        cota(P(0, 0), P(L, 0), xCol.length > 2 ? -14 : -8, `LUZ ${m2(L)} m`);
        cota(P(0, 0), P(0, alturaCol), -8, m2(alturaCol), true);
        if (H - alturaCol > 0.05) { cota(P(L, 0), P(L, H), 8, m2(H), true); cota(P(L, alturaCol), P(L, H), 16, m2(H - alturaCol), true); }
        const xc = L / 2, ys = yEn(/cordon_superior|viga_principal/, xc), yi = yEn(/cordon_inferior/, xc);
        if (ys !== null && yi !== null && ys - yi > 0.05) cota(P(xc, yi), P(xc, ys), 6, `PERALTE ${m2(ys - yi)}`, true);
        const m = o.memoria?.datos.pendientePct;
        if (m) d.texto([P(L * 0.27, 0)[0], P(0, (yEn(/cordon_superior|viga_principal/, L * 0.27) ?? H))[1] + 5], `PENDIENTE ${m} %`, TXT_S, 'COTAS', 'centro');
        xCol.forEach((x, i) => eje([P(x - minX, 0)[0], P(0, 0)[1] - (xCol.length > 2 ? 24 : 18)], letra(i)));
      },
    },
    {
      titulo: 'ELEVACIÓN LATERAL', sub: `${zCol.length} pórticos${zCol.length > 1 ? ` a ${m2(D / (zCol.length - 1))} m` : ''}`, margen: [26, 26, 40, 12],
      filtro: s => { const a = nodes[s.nodeAId], b = nodes[s.nodeBId]; return Math.abs(a.x - b.x) < 0.02 && !/montante|diagonal/.test(s.rolEstructural || ''); },
      pr: n => [(n.z || 0) - minZ, n.y - minY],
      anotar: (P, k) => {
        d.linea([P(0, 0)[0] - 8, P(0, 0)[1]], [P(D, 0)[0] + 8, P(0, 0)[1]], 'EJES');
        if (zCol.length > 1) cadena(zCol.map(z => z - minZ), -7, u => P(u, 0), false, k);
        cota(P(0, 0), P(D, 0), zCol.length > 1 ? -14 : -8, `LARGO ${m2(D)} m`);
        cota(P(D, 0), P(D, H), 8, m2(H), true);
        zCol.forEach((z, i) => eje([P(z - minZ, 0)[0], P(0, 0)[1] - 24], String(i + 1)));
      },
    },
    {
      titulo: 'VISTA ISOMÉTRICA', sub: 'Estructura completa', margen: [14, 14, 26, 10], libre: true,
      filtro: () => true, pr: n => { const x = n.x - minX, z = (n.z || 0) - minZ, y = n.y - minY; return [(x + z) * c30, y + (z - x) * 0.5]; },
    },
  ];

  const medida = (v: Vista) => {
    const pts = segs.filter(v.filtro).flatMap(s => [v.pr(nodes[s.nodeAId]), v.pr(nodes[s.nodeBId])]);
    if (!pts.length) return null;
    return { u0: Math.min(...pts.map(p => p[0])), u1: Math.max(...pts.map(p => p[0])), v0: Math.min(...pts.map(p => p[1])), v1: Math.max(...pts.map(p => p[1])) };
  };
  const tam = (v: Vista, m: { u0: number; u1: number; v0: number; v1: number }, esc: number): [number, number] =>
    [(m.u1 - m.u0) * 1000 / esc + v.margen[0] + v.margen[1], (m.v1 - m.v0) * 1000 / esc + v.margen[2] + v.margen[3]];

  // Área útil de una hoja estructural (sobre el rótulo / la franja de cuadros en la primera).
  const FRANJA = 112;
  const area = (fmt: Formato, primera: boolean) => { const [W, Hh] = FORMATOS[fmt]; return { w: W - ML - MR - 8, h: Hh - MT - MB - 8 - (primera ? FRANJA : RH + 6) }; };
  // Escala: fija (la elegida) o automática = la mayor que deja las 4 vistas en una A1.
  const esc0 = o.escala && o.escala > 0 ? o.escala : (() => {
    for (const e of [50, 75, 100, 125, 150, 200, 250, 300, 400, 500]) {
      const a = area('A1', true);
      const ts = vistas.map(v => { const m = medida(v); return m ? tam(v, m, e) : [0, 0] as [number, number]; });
      // Dos filas: (planta, isométrica) y (frontal, lateral).
      if (Math.max(ts[0][0] + ts[3][0], ts[1][0] + ts[2][0]) <= a.w && Math.max(ts[0][1], ts[3][1]) + Math.max(ts[1][1], ts[2][1]) <= a.h) return e;
    }
    return 500;
  })();
  const escTxt = `1:${esc0} (indicada)`;

  // Empaquetado por filas: [planta, iso] y [frontal, lateral]; si no caben, más láminas o A0.
  type Colocada = { v: Vista; m: { u0: number; u1: number; v0: number; v1: number }; esc: number; x: number; yTop: number; w: number; h: number };
  const filas: Vista[][] = [[vistas[0], vistas[3]], [vistas[1], vistas[2]]];
  let hojaAct: { ox: number; W: number; H: number } | null = null, primera = true, yCursor = 0;
  const colocar = (fila: Colocada[]) => {
    const total = fila.reduce((s, c) => s + c.w, 0);
    const a = area('A1', false);
    void a;
    const libreW = (hojaAct!.W - ML - MR - 8) - total, gap = libreW / (fila.length + 1);
    let x = hojaAct!.ox + ML + 4 + gap;
    fila.forEach(c => { c.x = x; c.yTop = yCursor; x += c.w + gap; dibujarVista(c); });
    yCursor -= Math.max(...fila.map(c => c.h)) + 4;
  };
  const dibujarVista = (c: Colocada) => {
    const { v, m, esc } = c, k = 1000 / esc;
    const ox = c.x + v.margen[0] - m.u0 * k;
    const oy = c.yTop - v.margen[3] - (m.v1 - m.v0) * k - m.v0 * k;
    const P = (u: number, w: number): P2 => [ox + u * k, oy + w * k];
    const trazos = new Map<string, { a: P2; b: P2; w: number; capa: string }>();
    segs.filter(v.filtro).forEach(s => {
      const a = v.pr(nodes[s.nodeAId]), b = v.pr(nodes[s.nodeBId]);
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.005) return;
      const key = [a, b].map(p => p.map(q => Math.round(q * 200)).join(',')).sort().join('|');
      const w = grosor(s, esc), prev = trazos.get(key);
      if (!prev || prev.w < w) trazos.set(key, { a: P(...a), b: P(...b), w, capa: capaDe(s) });
    });
    [...trazos.values()].sort((p, q) => p.w - q.w).forEach(t => d.gruesa([t.a, t.b], t.w, t.capa));
    ejesPuestos = [];
    v.anotar?.(P, k);
    const cx = c.x + c.w / 2, ty = c.yTop - c.h + 11;
    d.texto([cx, ty + 4.5], v.titulo, TXT_T, 'TEXTOS', 'centro');
    d.gruesa([[cx - anchoTxt(v.titulo, TXT_T) / 2, ty + 1.8], [cx + anchoTxt(v.titulo, TXT_T) / 2, ty + 1.8]], 0.35, 'TEXTOS');
    d.texto([cx, ty - 2.5], `${v.sub}  ·  ESC. ${v.libre ? 'S/E' : `1:${esc}`}`, TXT_S, 'TEXTOS', 'centro');
  };
  const nuevaHoja = (fmt: Formato) => {
    hojaAct = hoja(primera ? 'ESTRUCTURA: PLANTA, ELEVACIONES E ISOMÉTRICA' : 'ESTRUCTURA (continuación)', escTxt, fmt);
    yCursor = hojaAct.H - MT - 4;
    const p = primera; primera = false;
    return p;
  };
  let esPrimeraHoja = true, hojaPrimeraOx = 0;
  let pend: Colocada[] = [];
  const cierreFila = () => { if (pend.length) colocar(pend); pend = []; };
  filas.forEach(fila => {
    const items = fila.map(v => {
      const m = medida(v); if (!m) return null;
      let esc = v.libre ? esc0 : esc0;
      // Si ni en A0 cabe a la escala elegida, se reduce a la siguiente que quepa (y se indica).
      const a0 = area('A0', false);
      while (tam(v, m, esc)[0] > a0.w || tam(v, m, esc)[1] > a0.h) esc = ESCALAS.find(e => e > esc) || esc * 2;
      const [w, h] = tam(v, m, esc);
      return { v, m, esc, x: 0, yTop: 0, w, h } as Colocada;
    }).filter(Boolean) as Colocada[];
    items.forEach(it => {
      const fmtNec: Formato = it.w <= area('A1', false).w && it.h <= area('A1', false).h ? 'A1' : 'A0';
      if (!hojaAct) { esPrimeraHoja = nuevaHoja(fmtNec); hojaPrimeraOx = hojaAct!.ox; }
      const lim = (hojaAct!.ox === hojaPrimeraOx ? MB + FRANJA : MB + RH + 6);
      const anchoUsado = pend.reduce((s, c) => s + c.w, 0);
      const anchoHoja = hojaAct!.W - ML - MR - 8;
      if (anchoUsado + it.w > anchoHoja) cierreFila();
      const altoFila = Math.max(it.h, ...pend.map(c => c.h));
      if (yCursor - altoFila < lim || (fmtNec === 'A0' && hojaAct!.W < FORMATOS.A0[0])) { cierreFila(); nuevaHoja(fmtNec); }
      pend.push(it);
    });
    cierreFila();
  });
  void esPrimeraHoja;

  // Franja inferior de la primera lámina: cuadro de elementos, leyenda y notas breves.
  const yFr = MB + FRANJA - 4, X0 = hojaPrimeraOx + ML;
  const porRol = new Map<string, { n: number; m: number; perf: Map<string, number> }>();
  segs.forEach(s => {
    const a = nodes[s.nodeAId], b = nodes[s.nodeBId], rol = s.rolEstructural || 'viga_principal';
    const r = porRol.get(rol) || { n: 0, m: 0, perf: new Map<string, number>() };
    r.n++; r.m += Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)); r.perf.set(s.profileId || '', (r.perf.get(s.profileId || '') || 0) + 1);
    porRol.set(rol, r);
  });
  const tabla = (x: number, yTop: number, titulo: string, enc0: string[], rows: string[][], h = TXT_S) => {
    const rh = h * 2.2;
    const cw = enc0.map((_, j) => Math.max(...[enc0, ...rows].map(r => anchoTxt(r[j] || '', h))) + 3);
    const W = cw.reduce((a, b) => a + b, 0), alto = rh * (rows.length + 2);
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
  const caE1 = o.memoria?.sismo?.concreto;
  const filasCuadro = [...porRol.entries()].sort((p, q) => ORDEN_ROL.indexOf(p[0]) - ORDEN_ROL.indexOf(q[0]))
    .map(([rol, r]) => rol === 'columna_concreto'
      ? ['Columnas de concreto armado', String(r.n), caE1 ? `C-1 ${caE1.b}×${caE1.h} cm · ${caE1.n} Ø ${caE1.barra}` : 'C-1 25×25 cm', "f'c 210 · fy 4200"]
      : [NOMBRE_ROL[rol] || rol, String(r.n), [...r.perf.keys()].map(nombreCorto).join(' / '),
      [...new Set([...r.perf.keys()].map(id => { const c = perfilDe(id)?.categoria || ''; return /perfil_c|perfil_z|angulo|perfil_h/.test(c) ? 'ASTM A36' : 'ASTM A500 Gr. B'; }))].join(' / ')] as string[]);
  const t1 = tabla(X0 + 4, yFr, 'CUADRO DE ELEMENTOS ESTRUCTURALES', ['Elemento', 'Cant.', 'Perfil', 'Material'], filasCuadro);
  const xLey = X0 + 4 + t1.W + 10;
  d.texto([xLey, yFr - 3], 'LEYENDA (grosor según el perfil)', TXT_S, 'TEXTOS');
  [...porRol.keys()].sort((p, q) => ORDEN_ROL.indexOf(p) - ORDEN_ROL.indexOf(q)).forEach((rol, i) => {
    const s = segs.find(x => x.rolEstructural === rol)!;
    const y = yFr - 10 - i * 6;
    d.gruesa([[xLey, y], [xLey + 16, y]], Math.min(1.8, Math.max(0.18, ladoSeg(s) / 100)), CAPA_ROL[rol] || 'VIGAS');
    d.texto([xLey + 19, y - 1], NOMBRE_ROL[rol] || rol, TXT_S, 'TEXTOS');
  });
  const xNot = xLey + 92;
  const sis = o.memoria?.sismo;
  ['NOTAS:', '1. Cotas en metros; láminas en mm.', '2. Ver especificaciones técnicas y detalles en E-02.', '3. Ver memoria de cálculo estructural.',
    sis ? `4. Sismo E.030: Z=${sis.Z} U=${sis.U} S=${sis.S} R=${sis.R} · V=${sis.VKg.toFixed(0)} kg` : '4. Cargas según RNE E.020.',
    '5. Prediseño: revisar y firmar por ingeniero CIP.']
    .forEach((t, i) => { if (xNot + 60 < X0 + FORMATOS.A1[0] - ML - MR - RW - 8) d.texto([xNot, yFr - 3 - i * 5.6], t, i ? TXT_S : TXT, 'TEXTOS'); });

  // =========================================================================
  // DETALLES Y ESPECIFICACIONES TÉCNICAS
  // =========================================================================
  {
    const { ox, H: Hh } = hoja('DETALLES Y ESPECIFICACIONES TÉCNICAS', 'INDICADA');
    const colSeg = segs.find(s => s.rolEstructural === 'columna');
    const colMm = colSeg ? ladoMm(colSeg.profileId) : 100;
    const placa = Math.ceil((colMm + 150) / 50) * 50; // mm
    const ePlaca = colMm > 100 ? 15.9 : 12.7;
    const anclaje = ns.find(n => n.isFixedSupport && (n as any).boltDiameter) as any;
    const perno = anclaje?.boltDiameter || '5/8"', nPernos = anclaje?.numPernos || 4;
    const esc = 5, k = 1 / esc; // detalle 1:5 (mm reales → mm papel)
    const ca = sis?.concreto;
    const ex = ox + ML + 50, ey = Hh - MT - 150;
    if (!ca) {
      // Detalle 1: placa base — elevación.
      const dado = placa + 150;
      d.caja(ex - dado * k / 2, ey - 400 * k, ex + dado * k / 2, ey, 'COLUMNAS', 0.35);                    // dado de concreto
      for (let i = 0; i < 10; i++) d.linea([ex - dado * k / 2 + i * dado * k / 10, ey - 400 * k], [ex - dado * k / 2 + (i + 1) * dado * k / 10, ey - 330 * k], 'ARRIOSTRES');
      d.caja(ex - placa * k / 2, ey + 25 * k, ex + placa * k / 2, ey + (25 + ePlaca) * k, 'VIGAS', 0.5);  // placa
      d.caja(ex - placa * k / 2, ey, ex + placa * k / 2, ey + 25 * k, 'ARRIOSTRES', 0.2);                // grout
      d.caja(ex - colMm * k / 2, ey + (25 + ePlaca) * k, ex + colMm * k / 2, ey + (25 + ePlaca) * k + 70, 'COLUMNAS', 0.7); // columna
      [-1, 1].forEach(sx => {
        const px = ex + sx * (placa / 2 - 40) * k;
        d.gruesa([[px, ey + (25 + ePlaca + 25) * k], [px, ey - 350 * k], [px + sx * 50 * k, ey - 350 * k]], 0.6, 'COTAS');  // perno J
        d.gruesa([[ex + sx * colMm * k / 2, ey + (25 + ePlaca) * k], [ex + sx * (colMm / 2 + 12) * k, ey + (25 + ePlaca) * k], [ex + sx * colMm * k / 2, ey + (25 + ePlaca + 12) * k]], 0.3, 'NO_CUMPLE', true);
      });
      cota([ex - placa * k / 2, ey + 70 + 20], [ex + placa * k / 2, ey + 70 + 20], 4, `PLACA ${placa}×${placa}×${ePlaca} mm`);
      cota([ex + dado * k / 2, ey - 350 * k], [ex + dado * k / 2, ey], 6, '0.35 (empotramiento)', true);
      d.texto([ex + placa * k / 2 + 6, ey + 12 * k], 'GROUT SIN RETRACCIÓN e = 25 mm', TXT_S, 'COTAS');
      d.texto([ex + placa * k / 2 + 6, ey + (25 + ePlaca + 40) * k], `SOLDADURA FILETE 6 mm (E-7018) TODO EL CONTORNO`, TXT_S, 'COTAS');
      d.texto([ex - dado * k / 2, ey - 400 * k - 6], `${nPernos} PERNOS DE ANCLAJE Ø ${perno} TIPO J (ASTM A307), L = 450 mm`, TXT_S, 'COTAS');
      d.texto([ex - dado * k / 2, ey - 400 * k - 12], "DADO DE CONCRETO f'c = 210 kg/cm²", TXT_S, 'COTAS');
      d.texto([ex, ey + 110], 'DETALLE 1: PLACA BASE Y ANCLAJE (ELEVACIÓN)', TXT, 'TEXTOS', 'centro');
      d.texto([ex, ey + 104], 'ESC. 1:5', TXT_S, 'TEXTOS', 'centro');
      // Detalle 2: placa base — planta.
      const px0 = ex + 140, py0 = ey + 20;
      d.caja(px0 - placa * k / 2, py0 - placa * k / 2, px0 + placa * k / 2, py0 + placa * k / 2, 'VIGAS', 0.5);
      d.caja(px0 - colMm * k / 2, py0 - colMm * k / 2, px0 + colMm * k / 2, py0 + colMm * k / 2, 'COLUMNAS', 0.7);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].slice(0, Math.max(2, Math.min(4, nPernos))).forEach(([sx, sy]) => d.circulo([px0 + sx * (placa / 2 - 40) * k, py0 + sy * (placa / 2 - 40) * k], 2.2, 'COTAS'));
      cota([px0 - placa * k / 2, py0 - placa * k / 2], [px0 + placa * k / 2, py0 - placa * k / 2], -7, `${placa}`);
      cota([px0 + placa * k / 2, py0 - placa * k / 2], [px0 + placa * k / 2, py0 + placa * k / 2], 7, `${placa}`, true);
      d.texto([px0, py0 + placa * k / 2 + 12], 'DETALLE 2: PLACA BASE (PLANTA)', TXT, 'TEXTOS', 'centro');
      d.texto([px0, py0 + placa * k / 2 + 6], `ESC. 1:5 · columna ${nombreCorto(colSeg?.profileId)}`, TXT_S, 'TEXTOS', 'centro');
    } else {
      // ---------- COLUMNA DE CONCRETO ARMADO ----------
      const bm = ca.b * 10, hm = ca.h * 10, e1 = bm <= 350 ? 5 : 10, k1 = 1 / e1;  // mm
      // Detalle 1: sección transversal.
      const cx = ex, cy = ey + 25;
      d.caja(cx - bm * k1 / 2, cy - hm * k1 / 2, cx + bm * k1 / 2, cy + hm * k1 / 2, 'COLUMNAS', 0.5);
      const r = (RECUB - 5) * k1;                                   // estribo al ras del recubrimiento
      d.caja(cx - bm * k1 / 2 + r, cy - hm * k1 / 2 + r, cx + bm * k1 / 2 - r, cy + hm * k1 / 2 - r, 'CORDON_INFERIOR', 0.35);
      d.gruesa([[cx - bm * k1 / 2 + r, cy + hm * k1 / 2 - r], [cx - bm * k1 / 2 + r + 9, cy + hm * k1 / 2 - r - 9]], 0.35, 'CORDON_INFERIOR'); // gancho 135°
      const rb = Math.max(1.1, (DIAM_MM[ca.barra] || 16) * k1 / 2);
      const xi = cx - bm * k1 / 2 + r + rb + 1, xf = cx + bm * k1 / 2 - r - rb - 1, yi = cy - hm * k1 / 2 + r + rb + 1, yf = cy + hm * k1 / 2 - r - rb - 1;
      const porLado = ca.n <= 4 ? 2 : ca.n <= 8 ? 3 : 4;
      const pts: P2[] = [];
      for (let t = 0; t < porLado; t++) { const f = t / (porLado - 1); pts.push([xi + (xf - xi) * f, yi], [xi + (xf - xi) * f, yf]); if (t > 0 && t < porLado - 1) pts.push([xi, yi + (yf - yi) * f], [xf, yi + (yf - yi) * f]); }
      pts.slice(0, ca.n).forEach(p => { d.circulo(p, rb, 'CORDON_SUPERIOR'); d.gruesa([[p[0] - rb * 0.5, p[1]], [p[0] + rb * 0.5, p[1]]], rb, 'CORDON_SUPERIOR'); });
      cota([cx - bm * k1 / 2, cy - hm * k1 / 2], [cx + bm * k1 / 2, cy - hm * k1 / 2], -7, `${ca.b} cm`);
      cota([cx + bm * k1 / 2, cy - hm * k1 / 2], [cx + bm * k1 / 2, cy + hm * k1 / 2], 7, `${ca.h} cm`, true);
      d.texto([cx - bm * k1 / 2, cy - hm * k1 / 2 - 17], `${ca.n} Ø ${ca.barra} (ρ = ${(ca.cuantia * 100).toFixed(2)} %)`, TXT_S, 'COTAS');
      d.texto([cx - bm * k1 / 2, cy - hm * k1 / 2 - 22], `□ Ø 3/8" · recubrimiento ${RECUB / 10} cm`, TXT_S, 'COTAS');
      d.texto([cx, cy + hm * k1 / 2 + 14], 'DETALLE 1: COLUMNA C-1 (SECCIÓN)', TXT, 'TEXTOS', 'centro');
      d.texto([cx, cy + hm * k1 / 2 + 8], `ESC. 1:${e1} · f'c = 210 kg/cm² · fy = 4 200 kg/cm²`, TXT_S, 'TEXTOS', 'centro');
      // Detalle 2: elevación con la distribución de estribos.
      const e2 = 50, k2 = 1 / e2, Hc = alturaCol * 1000;
      const gx = ex + 115, gy0 = ey - 75;                          // base de la columna (NPT)
      const wcol = Math.max(5, bm * k2);
      d.caja(gx - wcol / 2, gy0, gx + wcol / 2, gy0 + Hc * k2, 'COLUMNAS', 0.5);
      d.caja(gx - 22, gy0 - 22, gx + 22, gy0 - 10, 'EJES', 0.25);  // zapata (referencial)
      d.linea([gx - wcol / 2, gy0], [gx - wcol / 2, gy0 - 10], 'COLUMNAS'); d.linea([gx + wcol / 2, gy0], [gx + wcol / 2, gy0 - 10], 'COLUMNAS');
      d.texto([gx + 25, gy0 - 17], 'ZAPATA: ver Obra Civil', TXT_S, 'COTAS');
      const Lo = ca.LoCm * 10;
      const marcas: number[] = [50];
      for (let z = 150; z <= Lo; z += 100) marcas.push(z);
      for (let z = Lo + 200; z < Hc - Lo; z += 200) marcas.push(z);
      const arriba = marcas.filter(z => z <= Lo).map(z => Hc - z);
      [...marcas, ...arriba].forEach(z => d.linea([gx - wcol / 2 - 1.5, gy0 + z * k2], [gx + wcol / 2 + 1.5, gy0 + z * k2], 'CORDON_INFERIOR'));
      cota([gx + wcol / 2, gy0], [gx + wcol / 2, gy0 + Lo * k2], 8, `Lo ${(Lo / 1000).toFixed(2)}`, true);
      cota([gx + wcol / 2, gy0 + (Hc - Lo) * k2], [gx + wcol / 2, gy0 + Hc * k2], 8, `Lo ${(Lo / 1000).toFixed(2)}`, true);
      cota([gx - wcol / 2, gy0], [gx - wcol / 2, gy0 + Hc * k2], -8, `h = ${m2(alturaCol)}`, true);
      d.texto([gx + 17, gy0 + Hc * k2 / 2], 'Rto. @ .20', TXT_S, 'COTAS');
      d.gruesa([[gx - wcol / 2 - 2, gy0 + Hc * k2], [gx + wcol / 2 + 2, gy0 + Hc * k2]], 0.6, 'VIGAS');  // plancha embebida
      d.texto([gx, gy0 + Hc * k2 + 14], 'DETALLE 2: COLUMNA C-1 (ELEVACIÓN)', TXT, 'TEXTOS', 'centro');
      d.texto([gx, gy0 + Hc * k2 + 8], `ESC. 1:50 · ${ca.estribos}`, TXT_S, 'TEXTOS', 'centro');
      // Detalle 3: plancha embebida y apoyo del tijeral.
      const e3 = 5, k3 = 1 / e3, pl = bm - 50;
      const tx = ex + 235, ty = ey - 10;                          // cara superior de la columna
      d.caja(tx - bm * k3 / 2, ty - 300 * k3, tx + bm * k3 / 2, ty, 'COLUMNAS', 0.5);
      for (let t = 0; t < 6; t++) d.linea([tx - bm * k3 / 2, ty - 300 * k3 + t * 10], [tx - bm * k3 / 2 + 8, ty - 300 * k3 + t * 10 + 8], 'ARRIOSTRES');
      d.caja(tx - pl * k3 / 2, ty, tx + pl * k3 / 2, ty + 12.7 * k3, 'VIGAS', 0.6);
      [-1, 1].forEach(sx => {
        const px = tx + sx * (pl / 2 - 35) * k3;
        d.gruesa([[px, ty], [px, ty - 300 * k3 + 8], [px - sx * 50 * k3, ty - 300 * k3 + 8]], 0.55, 'COTAS');  // espárrago con gancho
      });
      // Apoyo del tijeral: cordones que llegan a una placa de asiento soldada.
      const top = ty + 12.7 * k3;
      d.gruesa([[tx - pl * k3 / 2 + 4, top + 2], [tx + bm * k3 / 2 + 22, top + 14]], 0.7, 'CORDON_SUPERIOR');
      d.gruesa([[tx - pl * k3 / 2 + 4, top + 2], [tx + bm * k3 / 2 + 22, top + 2]], 0.7, 'CORDON_INFERIOR');
      d.gruesa([[tx - pl * k3 / 2 + 4, top], [tx - pl * k3 / 2 + 4, top + 10], [tx + 8, top]], 0.3, 'NO_CUMPLE', true);  // cartela + soldadura
      d.texto([tx + bm * k3 / 2 + 4, ty + 3], `PLANCHA e = 1/2" (${pl / 10}×${pl / 10} cm) EMBEBIDA`, TXT_S, 'COTAS');
      d.texto([tx + bm * k3 / 2 + 4, ty - 4], '4 ESPÁRRAGOS Ø 5/8" L = 30 cm CON GANCHO, SOLDADOS A LA PLANCHA', TXT_S, 'COTAS');
      d.texto([tx + bm * k3 / 2 + 4, ty - 11], 'TIJERAL SOLDADO A LA PLANCHA: FILETE 6 mm (E-7018)', TXT_S, 'COTAS');
      d.texto([tx + bm * k3 / 2 + 4, ty - 18], 'APOYO ARTICULADO: LA COLUMNA TRABAJA EN VOLADIZO', TXT_S, 'COTAS');
      d.texto([tx + 30, top + 34], 'DETALLE 3: PLANCHA EMBEBIDA Y APOYO DEL TIJERAL', TXT, 'TEXTOS', 'centro');
      d.texto([tx + 30, top + 28], 'ESC. 1:5', TXT_S, 'TEXTOS', 'centro');
    }
    // Detalle 3: empalme soldado (piezas de más de 6 m).
    const sx0 = ca ? ex + 215 : ex + 240, sy0 = ca ? ey - 125 : ey + 40, tubo = 60;
    d.gruesa([[sx0, sy0], [sx0 + 70, sy0]], 0.5, 'CORDON_SUPERIOR'); d.gruesa([[sx0, sy0 + tubo * k * 2], [sx0 + 70, sy0 + tubo * k * 2]], 0.5, 'CORDON_SUPERIOR');
    d.gruesa([[sx0 + 72, sy0], [sx0 + 142, sy0]], 0.5, 'CORDON_SUPERIOR'); d.gruesa([[sx0 + 72, sy0 + tubo * k * 2], [sx0 + 142, sy0 + tubo * k * 2]], 0.5, 'CORDON_SUPERIOR');
    d.caja(sx0 + 56, sy0 - 3, sx0 + 86, sy0 + tubo * k * 2 + 3, 'VIGAS', 0.35);
    d.texto([sx0 + 71, sy0 + tubo * k * 2 + 8], 'CUBREJUNTA 4 LADOS e = 3 mm, L = 150 mm', TXT_S, 'COTAS', 'centro');
    d.texto([sx0 + 71, sy0 - 8], 'SOLDADURA A TOPE PENETRACIÓN COMPLETA + FILETE 4 mm', TXT_S, 'COTAS', 'centro');
    d.texto([sx0 + 71, sy0 + 54], `DETALLE ${ca ? 4 : 3}: EMPALME SOLDADO DE TUBO`, TXT, 'TEXTOS', 'centro');
    d.texto([sx0 + 71, sy0 + 48], 'Para piezas de más de 6 m · ESC. 1:2.5', TXT_S, 'TEXTOS', 'centro');
    // Cuadro de columnas.
    if (ca) {
      const nCA = segs.filter(s => s.rolEstructural === 'columna_concreto').length;
      tabla(ox + ML + 6, ey - 140, 'CUADRO DE COLUMNAS', ['Tipo', 'Cant.', 'Sección', 'Acero longitudinal', 'Estribos Ø 3/8"', 'Concreto'],
        [['C-1', String(nCA), `${ca.b} × ${ca.h} cm`, `${ca.n} Ø ${ca.barra}`, ca.estribos.replace(/^□ Ø 3\/8": /, ''), "f'c = 210 kg/cm²"]], TXT);
    } else {
      const colSeg2 = segs.find(s => s.rolEstructural === 'columna');
      const colMm2 = colSeg2 ? ladoMm(colSeg2.profileId) : 100;
      const placa2 = Math.ceil((colMm2 + 150) / 50) * 50, ePlaca2 = colMm2 > 100 ? 15.9 : 12.7;
      const anclaje2 = ns.find(n => n.isFixedSupport && (n as any).boltDiameter) as any;
      const cols = segs.filter(s => s.rolEstructural === 'columna');
      const tiposCol = new Map<string, number>(); cols.forEach(s => tiposCol.set(s.profileId || '', (tiposCol.get(s.profileId || '') || 0) + 1));
      tabla(ox + ML + 6, ey - 120, 'CUADRO DE COLUMNAS', ['Tipo', 'Cant.', 'Perfil', 'Altura (m)', 'Placa base (mm)', 'Pernos'],
        [...tiposCol.entries()].map(([id, n], i) => [`C-${i + 1}`, String(n), nombreCorto(id), m2(alturaCol), `${placa2}×${placa2}×${ePlaca2}`, `${anclaje2?.numPernos || 4} Ø ${anclaje2?.boltDiameter || '5/8"'} J`]), TXT);
    }
    // Especificaciones técnicas y parámetros sísmicos (columna derecha).
    const xe = ox + (FORMATOS.A1[0]) * 0.56;
    let ye = Hh - MT - 10;
    const bloque = (titulo: string, lineas: string[]) => {
      d.texto([xe, ye], titulo, TXT_T * 0.9, 'TEXTOS'); d.gruesa([[xe, ye - 2], [xe + anchoTxt(titulo, TXT_T * 0.9), ye - 2]], 0.35, 'TEXTOS'); ye -= 8.5;
      lineas.forEach(t => { d.texto([xe + 2, ye], t, TXT, 'TEXTOS'); ye -= 6.2; });
      ye -= 4;
    };
    const mem = o.memoria;
    bloque('ESPECIFICACIONES TÉCNICAS', [
      'ACERO: tubos ASTM A500 Gr. B (Fy = 3 200 kg/cm²); perfiles C, placas y',
      '  platinas ASTM A36 (Fy = 2 530 kg/cm²).',
      'SOLDADURA: AWS E-6011 (raíz) y E-7018 (acabado); filete mínimo 4 mm,',
      '  continuo en uniones de tijeral y columnas (AWS D1.1).',
      sis?.concreto ? 'ANCLAJE: plancha embebida e = 1/2" con 4 espárragos Ø 5/8" L = 30 cm (ASTM A36).' : `ANCLAJE: pernos tipo J Ø ${(ns.find(n => n.isFixedSupport && (n as any).boltDiameter) as any)?.boltDiameter || '5/8"'} ASTM A307, empotrados 35 cm; grout 25 mm.`,
      sis?.concreto ? "CONCRETO: columnas y zapatas f'c = 210 kg/cm²; acero fy = 4 200 kg/cm²; recubrimiento 4 cm." : "CONCRETO: dados y zapatas f'c = 210 kg/cm²; acero de refuerzo fy = 4 200 kg/cm².",
      'COBERTURA: fijada con autoperforantes 12-14 × 2" con arandela EPDM.',
      'PINTURA: arenado o limpieza mecánica, 2 manos de anticorrosivo epóxico',
      '  y 2 manos de esmalte (espesor seco total ≥ 125 micras).',
      'TOLERANCIAS: verticalidad de columnas h/500; flecha de piezas L/1000.',
    ]);
    if (mem) bloque('CARGAS DE DISEÑO (E.020)', [
      `Carga muerta D = ${mem.cargas.D} kg/m² · Carga viva de techo L = ${mem.cargas.L} kg/m²`,
      `Viento V = ${mem.cargas.V} km/h → q = ${mem.cargas.qViento.toFixed(1)} kg/m² (succión ${mem.cargas.succion.toFixed(1)} kg/m²)`,
    ]);
    if (sis) bloque('PARÁMETROS SÍSMICOS (E.030-2018)', [
      `Zona ${sis.zona}: Z = ${sis.Z} · Suelo ${sis.suelo}: S = ${sis.S}, Tp = ${sis.Tp} s, TL = ${sis.TL} s`,
      `Categoría ${sis.categoria}: U = ${sis.U} · Sistema: ${sis.concreto ? 'columnas de concreto en voladizo' : 'pórtico ordinario de acero'}, R = ${sis.R}`,
      `T = ${sis.T.toFixed(3)} s · C = ${sis.C.toFixed(2)} · Peso sísmico P = ${sis.PKg.toFixed(0)} kg`,
      `Cortante basal V = ZUCS/R · P = ${sis.VKg.toFixed(0)} kg · por columna ${sis.VColKg.toFixed(0)} kg`,
      `Deriva máxima ${sis.deriva.toFixed(4)} ≤ ${sis.derivaLim} (${sis.concreto ? 'concreto' : 'acero'}) · ${sis.estado === 'CUMPLE' ? 'CUMPLE' : 'NO CUMPLE'}`,
    ]);
    bloque('NORMAS', ['RNE E.020 Cargas · E.030 Diseño sismorresistente · E.090 Estructuras metálicas', 'AWS D1.1 Soldadura estructural · ASTM A500 / A36 / A307']);
  }

  // =========================================================================
  // MEMORIA DE CÁLCULO
  // =========================================================================
  const mem = o.memoria;
  if (mem) {
    const { ox: mx, H: Hh } = hoja('MEMORIA DE CÁLCULO ESTRUCTURAL', 'S/E');
    const xa = mx + ML + 6, ytop = Hh - MT - 10;
    let y = ytop;
    const bloque = (titulo: string, lineas: string[]) => {
      d.texto([xa, y], titulo, TXT_T, 'TEXTOS'); d.gruesa([[xa, y - 2], [xa + anchoTxt(titulo, TXT_T), y - 2]], 0.35, 'TEXTOS'); y -= 9;
      lineas.forEach(t => { d.texto([xa + 2, y], t, 3.6, 'TEXTOS'); y -= 6.6; });
      y -= 4;
    };
    const dd = mem.datos, c = mem.cargas;
    bloque('1. DATOS GENERALES', [
      `Tipo de techo: ${dd.tipo} · Cobertura: ${dd.cobertura}`, `Luz ${m2(dd.luz)} m · Largo ${m2(dd.largo)} m · Área ${m2(dd.area)} m²`,
      `Altura de columnas ${m2(dd.alturaCol)} m · Altura máxima ${m2(dd.alturaMax)} m · Pendiente ${dd.pendientePct != null ? `${dd.pendientePct} %` : '—'}`,
    ]);
    bloque('2. CARGAS (E.020) Y COMBINACIONES', [
      `D = ${c.D} kg/m² · L = ${c.L} kg/m² · Viento ${c.V} km/h → q = ${c.qViento.toFixed(1)} kg/m², succión ${c.succion.toFixed(1)} kg/m²`,
      `U1 = 1.4 D = ${c.U1.toFixed(1)} · U2 = 1.2 D + 1.6 L = ${c.U2.toFixed(1)} · U3 = 0.9 D − W = ${c.U3.toFixed(1)} kg/m²`,
    ]);
    let n = 3;
    if (mem.tijeral) {
      const t = mem.tijeral;
      bloque(`${n++}. TIJERAL`, [
        `w = ${(t.w / 1000).toFixed(2)} kN/m · luz ${m2(t.luz)} m · peralte ${m2(t.d)} m · M = wL²/8 = ${(t.M / 1000).toFixed(2)} kN·m`,
        `Cordones N = M/d = ${t.Ncordon.toFixed(2)} kN · cortante en apoyo V = wL/2 = ${t.V.toFixed(2)} kN`,
      ]);
    }
    if (sis) bloque(`${n++}. ANÁLISIS SÍSMICO ESTÁTICO (E.030-2018)`, [
      `Z = ${sis.Z} (${sis.zona}) · U = ${sis.U} (cat. ${sis.categoria}) · S = ${sis.S} (${sis.suelo}), Tp = ${sis.Tp} s, TL = ${sis.TL} s`,
      `T = hn/CT = ${sis.hn.toFixed(2)}/35 = ${sis.T.toFixed(3)} s → C = ${sis.C.toFixed(2)} · R = ${sis.R} (${sis.concreto ? 'columnas de concreto en voladizo' : 'pórtico ordinario de acero'})`,
      `P = acero + área·(D + 0.25 L) = ${sis.PKg.toFixed(0)} kg`,
      `V = Z·U·C·S/R · P = ${sis.VKg.toFixed(0)} kg  →  por columna (${sis.nCols}) = ${sis.VColKg.toFixed(0)} kg`,
      ...(sis.concreto ? [
        `Columna de concreto armado C-1 ${sis.concreto.b}×${sis.concreto.h} cm, ${sis.concreto.n} Ø ${sis.concreto.barra} (ρ ${(sis.concreto.cuantia * 100).toFixed(2)} %) · voladizo (apoyo articulado del tijeral)`,
        `Pu = ${sis.concreto.PuKg.toFixed(0)} ≤ φPn = ${sis.concreto.phiPnKg.toFixed(0)} kg · Mu = V·h = ${sis.concreto.MuKgM.toFixed(0)} ≤ φMn = ${sis.concreto.phiMnKgM.toFixed(0)} kg·m (E.060)`,
        `Deriva Δ/h = 0.75·R·V·h³/(3·Ec·0.7Ig)/h = ${sis.deriva.toFixed(4)} ≤ 0.007 (concreto) · Estribos ${sis.concreto.estribos}`,
      ] : [
        `Columna ${nombreCorto(INVENTARIO_PERFILES_TUBULARES.find(x => x.nombre === sis.perfilCol)?.id) || sis.perfilCol}: Δ = 0.75·R·V·h³/12EI (nudo rígido, base empotrada) = ${sis.deltaCm.toFixed(2)} cm`,
        `Deriva Δ/h = ${sis.deriva.toFixed(4)} ≤ 0.010 · M = V·h/2 = ${sis.MColKgM.toFixed(0)} kg·m, fb = ${sis.fbKgCm2.toFixed(0)} ≤ ${sis.fbAdmKgCm2.toFixed(0)} kg/cm²`,
      ]),
      `Resultado: ${sis.estado === 'CUMPLE' ? 'CUMPLE' : 'NO CUMPLE'} · ${sis.motivo}`,
    ]);
    const r = mem.reacciones;
    bloque(`${n++}. REACCIONES POR COLUMNA Y PESO`, [
      `Servicio ${r.servicioKg.toFixed(0)} kg · Última (U2) ${r.ultimaKg.toFixed(0)} kg · Levantamiento (U3) ${r.levantamientoKg.toFixed(0)} kg`,
      `Corte sísmico en la base ${sis ? sis.VColKg.toFixed(0) : '—'} kg · Peso del acero ${mem.pesoTotalKg.toFixed(0)} kg (${mem.kgM2.toFixed(1)} kg/m²)`,
    ]);
    bloque('CRITERIOS', [
      'Columnas: Euler con FS = 3 (o 0.6·Fy·A). Vigas, cordones y correas: flecha ≤ L/240 (correas L/180).',
      'Esbeltez λ = KL/r ≤ 200 (correas y arriostres ≤ 300). Sismo: deriva ≤ 0.010 acero / 0.007 concreto (E.030); concreto E.060.',
      'PREDISEÑO: el cálculo definitivo y los planos los firma un ingeniero civil colegiado (CIP).',
    ]);
    const xb = mx + ML + 6 + (FORMATOS.A1[0] - ML - MR) * 0.5;
    const filasV = mem.grupos.map(g => [
      g.nombreRol, nombreCorto(g.perfilId), String(g.cant), m2(g.Lmax), `${g.lambdaMax.toFixed(0)} / ${g.lambdaLim}`,
      g.verif ? (g.verif.tipo === 'axial' ? `P ${g.verif.demanda.toFixed(1)} ≤ ${g.verif.capacidad.toFixed(1)} kN` : `f ${g.verif.demanda.toFixed(0)} ≤ ${g.verif.capacidad.toFixed(0)} mm`) : 'Solo esbeltez',
      g.verif ? g.verif.ratio.toFixed(2) : '—', g.estado === 'CUMPLE' ? 'CUMPLE' : g.estado === 'OBSERVACION' ? 'OBSERV.' : 'NO CUMPLE',
    ]);
    const tv = tabla(xb, ytop + 3, 'VERIFICACIÓN POR TIPO DE PIEZA (E.090)', ['Elemento', 'Perfil', 'Cant.', 'L máx (m)', 'λ / lím', 'Demanda ≤ capacidad', 'Ratio', 'Estado'], filasV, 3.2);
    let yy = ytop + 3 - tv.alto - 8;
    const obs = mem.grupos.filter(g => g.estado !== 'CUMPLE');
    if (obs.length) {
      d.texto([xb, yy], 'OBSERVACIONES', TXT, 'TEXTOS'); yy -= 6;
      obs.slice(0, 14).forEach(g => { const t = `• ${g.nombreRol}: ${g.motivo}`; d.texto([xb + 2, yy], t.slice(0, 80), TXT_S, g.estado === 'NO_CUMPLE' ? 'NO_CUMPLE' : 'TEXTOS'); yy -= 5; });
    }
    // Sello y firma.
    const sx = xb, sy = MB + RH + 14;
    const okTxt = mem.estado === 'CUMPLE' ? 'CUMPLE' : mem.estado === 'OBSERVACION' ? 'CUMPLE CON OBSERVACIONES' : 'NO CUMPLE';
    d.caja(sx, sy, sx + 130, sy + 20, mem.estado === 'NO_CUMPLE' ? 'NO_CUMPLE' : 'MARCO', 0.5);
    d.texto([sx + 65, sy + 13], `RESULTADO: ${okTxt}`, 4.2, mem.estado === 'NO_CUMPLE' ? 'NO_CUMPLE' : 'TEXTOS', 'centro');
    d.texto([sx + 65, sy + 5.5], 'E.090 + sismo E.030 · prediseño referencial', TXT_S, 'TEXTOS', 'centro');
    d.linea([sx + 160, sy + 6], [sx + 250, sy + 6], 'TEXTOS');
    d.texto([sx + 205, sy + 1.5], 'Firma y sello · Ing. Civil CIP N° ______', TXT_S, 'TEXTOS', 'centro');
  }

  // "n de N" en cada rótulo.
  hojas.forEach((h, i) => d.texto([h.x + h.w - MR - 4, MB + RH / 5 * 4 - 3], `${i + 1} de ${hojas.length}`, TXT_S, 'TEXTOS', 'der'));
  return armarDxf(o.nombre, d, 'mm');
}
