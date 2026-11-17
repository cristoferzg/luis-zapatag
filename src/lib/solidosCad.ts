// =============================================================================
// SÓLIDOS CAD para exportar el modelo a otros programas, igual en todo el sistema:
//  • AutoCAD: DXF con cada tubo, viga, peldaño o muro como VOLUMEN 3D (3DFACE), por capas.
//  • Revit (y cualquier programa BIM): IFC 2x3 con cada pieza como columna, viga, miembro,
//    placa, muro, losa o zapata con su sección real (Revit: Insertar → Vincular IFC, o Abrir IFC).
// Cada pieza es un «sólido extruido»: un eje de A a B y una sección (rectangular, tubo
// rectangular, tubo redondo o barra) que se arrastra a lo largo del eje.
// Coordenadas de entrada como en los visores: X = largo, Y = ALTURA, Z = ancho (metros).
// En DXF e IFC la altura va en Z (como en AutoCAD y Revit).
// =============================================================================

export type V3 = [number, number, number];
export type TipoSolido = 'columna' | 'viga' | 'miembro' | 'placa' | 'losa' | 'muro' | 'zapata' | 'baranda';
export interface SeccionSolido {
  forma: 'rect' | 'rect_hueco' | 'circ' | 'circ_hueco' | 'h';
  ancho: number;      // m, lado horizontal de la sección (o diámetro)
  alto: number;       // m, lado vertical de la sección
  espesor?: number;   // m, pared de los tubos (viga H: alma)
  espesorAla?: number; // m, viga H: alas
  almaVertical?: boolean; // viga H: el alma corre a lo «alto» (si no, a lo «ancho», como en columnas)
}
export interface SolidoCad {
  tipo: TipoSolido;
  nombre: string;
  capa: string;       // grupo / capa (zancos, peldanos, correas…)
  a: V3; b: V3;       // eje (para placas: de un borde al otro por el centro)
  seccion: SeccionSolido;
  material?: string;  // "Acero", "Madera", "Concreto"…
}
/** Superficie plana de cualquier contorno con espesor (cobertura de techo, losa, plancha inclinada). */
export interface SuperficieCad {
  tipo: 'cubierta' | 'losa';
  nombre: string;
  capa: string;
  contorno: V3[];     // puntos en orden (mismas coordenadas de los visores), todos en un plano
  espesor: number;    // m, hacia arriba del plano
  material?: string;
}

/** Ejes del plano de una superficie: origen, X sobre el primer lado, Z normal hacia arriba. */
export function ejesSuperficie(f: SuperficieCad): { o: V3; x: V3; y: V3; z: V3; pts2d: [number, number][] } | null {
  const c = f.contorno;
  if (c.length < 3) return null;
  let n: V3 = [0, 0, 0];
  for (let i = 0; i < c.length; i++) { const p = c[i], q = c[(i + 1) % c.length]; n = [n[0] + (p[1] - q[1]) * (p[2] + q[2]), n[1] + (p[2] - q[2]) * (p[0] + q[0]), n[2] + (p[0] - q[0]) * (p[1] + q[1])]; }
  if (len(n) < 1e-9) return null;
  let z = nrm(n);
  if (z[1] < 0) z = [-z[0], -z[1], -z[2]];
  const o = c[0];
  let x = sub(c[1], o);
  x = nrm(sub(x, [z[0] * (x[0] * z[0] + x[1] * z[1] + x[2] * z[2]), z[1] * (x[0] * z[0] + x[1] * z[1] + x[2] * z[2]), z[2] * (x[0] * z[0] + x[1] * z[1] + x[2] * z[2])]));
  const y = cruz(z, x);
  const pts2d = c.map(p => { const d = sub(p, o); return [d[0] * x[0] + d[1] * x[1] + d[2] * x[2], d[0] * y[0] + d[1] * y[1] + d[2] * y[2]] as [number, number]; });
  return { o, x, y, z, pts2d };
}

const sub = (p: V3, q: V3): V3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const len = (v: V3) => Math.hypot(v[0], v[1], v[2]);
const nrm = (v: V3): V3 => { const l = len(v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cruz = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
/** Del sistema de los visores (Y arriba) al de AutoCAD/Revit (Z arriba), sin espejar. */
export const aZArriba = (p: V3): V3 => [p[0], -p[2], p[1]];

/** Ejes locales de la pieza: Z = a lo largo, X = horizontal perpendicular, Y = "hacia arriba" de la sección. */
export function ejesLocales(s: SolidoCad): { z: V3; x: V3; y: V3; largo: number } {
  const d = sub(s.b, s.a), largo = len(d), z = nrm(d);
  const vertical = Math.abs(z[1]) > 0.98;
  const x = vertical ? [1, 0, 0] as V3 : nrm(cruz([0, 1, 0], z));
  const y = cruz(z, x);
  return { z, x, y, largo };
}

/** Rectángulos que forman la sección (centro x, centro y, ancho, alto): uno, o tres en la viga H (alas + alma). */
export function partesSeccion(sec: SeccionSolido): [number, number, number, number][] {
  if (sec.forma !== 'h') return [[0, 0, sec.ancho, sec.alto]];
  const tw = Math.max(0.002, sec.espesor || 0.006), tf = Math.max(0.002, sec.espesorAla || tw * 1.3);
  if (sec.almaVertical) { const d = sec.alto, bf = sec.ancho; return [[0, -d / 2 + tf / 2, bf, tf], [0, d / 2 - tf / 2, bf, tf], [0, 0, tw, Math.max(0.001, d - 2 * tf)]]; }
  const d = sec.ancho, bf = sec.alto;
  return [[-d / 2 + tf / 2, 0, tf, bf], [d / 2 - tf / 2, 0, tf, bf], [0, 0, Math.max(0.001, d - 2 * tf), tw]];
}

/** Las 8 esquinas de una caja del sólido (para el DXF); `parte` = rectángulo de partesSeccion (por defecto, toda la sección). */
export function esquinas(s: SolidoCad, parte: [number, number, number, number] = [0, 0, s.seccion.ancho, s.seccion.alto]): V3[] {
  const { x, y } = ejesLocales(s);
  const [cx, cy, w, h] = parte, hx = w / 2, hy = h / 2;
  const off = (p: V3, i: number, j: number): V3 => { const u = cx + hx * i, v = cy + hy * j; return [p[0] + x[0] * u + y[0] * v, p[1] + x[1] * u + y[1] * v, p[2] + x[2] * u + y[2] * v]; };
  return [off(s.a, -1, -1), off(s.a, 1, -1), off(s.a, 1, 1), off(s.a, -1, 1), off(s.b, -1, -1), off(s.b, 1, -1), off(s.b, 1, 1), off(s.b, -1, 1)];
}

const COLOR_CAPA = [1, 3, 5, 6, 4, 2, 30, 140, 200, 8];
const nombreCapa = (c: string) => (c || 'ESTRUCTURA').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9_-]+/g, '_').slice(0, 31) || 'ESTRUCTURA';

/** DXF (R12, el que abre cualquier AutoCAD) con cada sólido como caja 3D de 3DFACE + su eje en la capa EJES. */
export function dxf3D(solidos: SolidoCad[], proyecto = 'InnovApp', superficies: SuperficieCad[] = []): string {
  const capas = [...new Set([...solidos.map(s => nombreCapa(s.capa)), ...superficies.map(f => nombreCapa(f.capa))])];
  const o: string[] = ['999', `InnovApp - ${proyecto} (modelo 3D, metros)`, '0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '9', '$INSUNITS', '70', '6', '0', 'ENDSEC',
    '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', String(capas.length + 1)];
  [...capas, 'EJES'].forEach((c, i) => o.push('0', 'LAYER', '2', c, '70', '0', '62', String(c === 'EJES' ? 8 : COLOR_CAPA[i % COLOR_CAPA.length]), '6', 'CONTINUOUS'));
  o.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  const f = (n: number) => n.toFixed(4);
  const cara = (capa: string, q: V3[]) => {
    o.push('0', '3DFACE', '8', capa);
    q.forEach((p, i) => { const z = aZArriba(p); o.push(String(10 + i), f(z[0]), String(20 + i), f(z[1]), String(30 + i), f(z[2])); });
  };
  solidos.forEach(s => {
    const capa = nombreCapa(s.capa);
    partesSeccion(s.seccion).forEach(parte => {
      const e = esquinas(s, parte);
      [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].forEach(ix => cara(capa, ix.map(i => e[i])));
    });
    const a = aZArriba(s.a), b = aZArriba(s.b);
    o.push('0', 'LINE', '8', 'EJES', '10', f(a[0]), '20', f(a[1]), '30', f(a[2]), '11', f(b[0]), '21', f(b[1]), '31', f(b[2]));
  });
  // Superficies: la cara de arriba y la de abajo en triángulos (abanico desde el primer punto).
  superficies.forEach(sf => {
    const capa = nombreCapa(sf.capa), c = sf.contorno, ej = ejesSuperficie(sf);
    if (!ej) return;
    const arriba = c.map(p => [p[0] + ej.z[0] * sf.espesor, p[1] + ej.z[1] * sf.espesor, p[2] + ej.z[2] * sf.espesor] as V3);
    for (let i = 1; i < c.length - 1; i++) { cara(capa, [c[0], c[i], c[i + 1], c[i + 1]]); if (sf.espesor > 0.0005) cara(capa, [arriba[0], arriba[i], arriba[i + 1], arriba[i + 1]]); }
  });
  o.push('0', 'ENDSEC', '0', 'EOF');
  return o.join('\n');
}

// ── IFC 2x3 (Revit, ArchiCAD, Tekla, BIMcollab…) ─────────────────────────────
const CLASE_IFC: Record<TipoSolido, string> = {
  columna: 'IFCCOLUMN', viga: 'IFCBEAM', miembro: 'IFCMEMBER', baranda: 'IFCRAILING', placa: 'IFCPLATE', losa: 'IFCSLAB', muro: 'IFCWALL', zapata: 'IFCFOOTING',
};
const guid = () => {
  const c = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
  let s = c[Math.floor(Math.random() * 4)];
  for (let i = 0; i < 21; i++) s += c[Math.floor(Math.random() * 64)];
  return s;
};
const txt = (s: string) => `'${String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '').replace(/'/g, "''").slice(0, 120)}'`;
const r = (n: number) => { const v = Math.round(n * 1e6) / 1e6; return Number.isInteger(v) ? `${v}.` : String(v); };

/** Archivo IFC 2x3 con un proyecto, un sitio, un edificio, un nivel y cada sólido con su sección. */
export function ifc(solidos: SolidoCad[], proyecto = 'InnovApp', autor = 'InnovApp', superficies: SuperficieCad[] = []): string {
  const L: string[] = [];
  let n = 0;
  const e = (s: string) => { n++; L.push(`#${n}=${s};`); return `#${n}`; };
  const pt = (p: V3) => e(`IFCCARTESIANPOINT((${r(p[0])},${r(p[1])},${r(p[2])}))`);
  const dir = (p: V3) => e(`IFCDIRECTION((${r(p[0])},${r(p[1])},${r(p[2])}))`);
  const persona = e(`IFCPERSON($,${txt(autor)},$,$,$,$,$,$)`);
  const org = e(`IFCORGANIZATION($,'InnovApp',$,$,$)`);
  const po = e(`IFCPERSONANDORGANIZATION(${persona},${org},$)`);
  const app = e(`IFCAPPLICATION(${org},'1.0','InnovApp','InnovApp')`);
  const hist = e(`IFCOWNERHISTORY(${po},${app},$,.ADDED.,$,$,$,${Math.floor(Date.now() / 1000)})`);
  const origen = pt([0, 0, 0]), dZ = dir([0, 0, 1]), dX = dir([1, 0, 0]);
  const ejeMundo = e(`IFCAXIS2PLACEMENT3D(${origen},${dZ},${dX})`);
  const ctx = e(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,${ejeMundo},$)`);
  const uL = e(`IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)`), uA = e(`IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)`), uV = e(`IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)`), uR = e(`IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)`);
  const unidades = e(`IFCUNITASSIGNMENT((${uL},${uA},${uV},${uR}))`);
  const proy = e(`IFCPROJECT('${guid()}',${hist},${txt(proyecto)},'Exportado desde InnovApp',$,$,$,(${ctx}),${unidades})`);
  const colocar = (rel: string | '$') => e(`IFCLOCALPLACEMENT(${rel},${e(`IFCAXIS2PLACEMENT3D(${pt([0, 0, 0])},$,$)`)})`);
  const pSitio = colocar('$'), sitio = e(`IFCSITE('${guid()}',${hist},'Terreno',$,$,${pSitio},$,$,.ELEMENT.,$,$,$,$,$)`);
  const pEdif = colocar(pSitio), edif = e(`IFCBUILDING('${guid()}',${hist},${txt(proyecto)},$,$,${pEdif},$,$,.ELEMENT.,$,$,$)`);
  const pNivel = colocar(pEdif), nivel = e(`IFCBUILDINGSTOREY('${guid()}',${hist},'Nivel 1',$,$,${pNivel},$,$,.ELEMENT.,0.)`);
  e(`IFCRELAGGREGATES('${guid()}',${hist},$,$,${proy},(${sitio}))`);
  e(`IFCRELAGGREGATES('${guid()}',${hist},$,$,${sitio},(${edif}))`);
  e(`IFCRELAGGREGATES('${guid()}',${hist},$,$,${edif},(${nivel}))`);
  const centro2d = e(`IFCAXIS2PLACEMENT2D(${e('IFCCARTESIANPOINT((0.,0.))')},$)`);
  const elementos: string[] = [];
  const porMaterial = new Map<string, string[]>();
  solidos.forEach(s => {
    const { largo } = ejesLocales(s);
    if (largo < 1e-4) return;
    const { x, z } = ejesLocales(s);
    const a = aZArriba(s.a), zz = aZArriba(z), xx = aZArriba(x);
    const sec = s.seccion;
    const t = Math.max(0.0005, Math.min(sec.espesor || 0.002, Math.min(sec.ancho, sec.alto) / 2 - 0.0001));
    const perfil = sec.forma === 'h'
      ? (() => { // IfcIShapeProfileDef: ancho de ala en X del perfil y peralte en Y; si el alma va «a lo ancho», se gira 90°.
          const tw = Math.max(0.002, sec.espesor || 0.006), tf = Math.max(0.002, sec.espesorAla || tw * 1.3);
          const d = sec.almaVertical ? sec.alto : sec.ancho, bf = sec.almaVertical ? sec.ancho : sec.alto;
          const pos = sec.almaVertical ? centro2d : e(`IFCAXIS2PLACEMENT2D(${e('IFCCARTESIANPOINT((0.,0.))')},${e('IFCDIRECTION((0.,1.))')})`);
          return e(`IFCISHAPEPROFILEDEF(.AREA.,$,${pos},${r(bf)},${r(d)},${r(Math.min(tw, bf / 2))},${r(Math.min(tf, d / 2 - 0.0005))},$)`);
        })()
      : sec.forma === 'rect_hueco' ? e(`IFCRECTANGLEHOLLOWPROFILEDEF(.AREA.,$,${centro2d},${r(sec.ancho)},${r(sec.alto)},${r(t)},$,$)`)
      : sec.forma === 'circ_hueco' ? e(`IFCCIRCLEHOLLOWPROFILEDEF(.AREA.,$,${centro2d},${r(sec.ancho / 2)},${r(t)})`)
      : sec.forma === 'circ' ? e(`IFCCIRCLEPROFILEDEF(.AREA.,$,${centro2d},${r(sec.ancho / 2)})`)
      : e(`IFCRECTANGLEPROFILEDEF(.AREA.,$,${centro2d},${r(sec.ancho)},${r(sec.alto)})`);
    const solido = e(`IFCEXTRUDEDAREASOLID(${perfil},${e(`IFCAXIS2PLACEMENT3D(${pt([0, 0, 0])},$,$)`)},${dZ},${r(largo)})`);
    const rep = e(`IFCSHAPEREPRESENTATION(${ctx},'Body','SweptSolid',(${solido}))`);
    const forma = e(`IFCPRODUCTDEFINITIONSHAPE($,$,(${rep}))`);
    const lugar = e(`IFCLOCALPLACEMENT(${pNivel},${e(`IFCAXIS2PLACEMENT3D(${pt(a)},${dir(zz)},${dir(xx)})`)})`);
    const clase = CLASE_IFC[s.tipo];
    const extra = clase === 'IFCSLAB' ? ',.FLOOR.' : clase === 'IFCFOOTING' ? ',.PAD_FOOTING.' : clase === 'IFCRAILING' ? ',.HANDRAIL.' : '';
    const el = e(`${clase}('${guid()}',${hist},${txt(s.nombre)},${txt(s.capa)},$,${lugar},${forma},$${extra})`);
    elementos.push(el);
    const m = s.material || 'Acero';
    porMaterial.set(m, [...(porMaterial.get(m) || []), el]);
  });
  superficies.forEach(sf => {
    const ej = ejesSuperficie(sf);
    if (!ej) return;
    const pts = ej.pts2d.map(([u, v]) => e(`IFCCARTESIANPOINT((${r(u)},${r(v)}))`));
    const poli = e(`IFCPOLYLINE((${[...pts, pts[0]].join(',')}))`);
    const perfil = e(`IFCARBITRARYCLOSEDPROFILEDEF(.AREA.,$,${poli})`);
    const solido = e(`IFCEXTRUDEDAREASOLID(${perfil},${e(`IFCAXIS2PLACEMENT3D(${pt([0, 0, 0])},$,$)`)},${dZ},${r(Math.max(0.0005, sf.espesor))})`);
    const forma = e(`IFCPRODUCTDEFINITIONSHAPE($,$,(${e(`IFCSHAPEREPRESENTATION(${ctx},'Body','SweptSolid',(${solido}))`)}))`);
    const lugar = e(`IFCLOCALPLACEMENT(${pNivel},${e(`IFCAXIS2PLACEMENT3D(${pt(aZArriba(ej.o))},${dir(aZArriba(ej.z))},${dir(aZArriba(ej.x))})`)})`);
    const el = e(`IFCSLAB('${guid()}',${hist},${txt(sf.nombre)},${txt(sf.capa)},$,${lugar},${forma},$,${sf.tipo === 'cubierta' ? '.ROOF.' : '.FLOOR.'})`);
    elementos.push(el);
    const m = sf.material || (sf.tipo === 'cubierta' ? 'Cobertura' : 'Concreto');
    porMaterial.set(m, [...(porMaterial.get(m) || []), el]);
  });
  if (elementos.length) e(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid()}',${hist},$,$,(${elementos.join(',')}),${nivel})`);
  porMaterial.forEach((els, m) => e(`IFCRELASSOCIATESMATERIAL('${guid()}',${hist},$,$,(${els.join(',')}),${e(`IFCMATERIAL(${txt(m)})`)})`));
  const fecha = new Date().toISOString().slice(0, 19);
  return ['ISO-10303-21;', 'HEADER;', "FILE_DESCRIPTION(('ViewDefinition [CoordinationView_V2.0]'),'2;1');",
    `FILE_NAME(${txt(proyecto + '.ifc')},'${fecha}',(${txt(autor)}),('InnovApp'),'InnovApp','InnovApp','');`, "FILE_SCHEMA(('IFC2X3'));", 'ENDSEC;', 'DATA;', ...L, 'ENDSEC;', 'END-ISO-10303-21;'].join('\n');
}

/** Descarga un texto como archivo (en la app de Android lo guarda en Descargas/InnovApp).
 *  Los .IFC y .DXF van como «application/octet-stream»: con su tipo propio, Android puede cambiarles la
 *  extensión al guardarlos y Revit/AutoCAD ya no los reconocen. */
export function descargarTexto(contenido: string, nombre: string, mime = 'application/octet-stream') {
  const cad = /\.(ifc|dxf)$/i.test(nombre);
  const url = URL.createObjectURL(new Blob([contenido], { type: cad ? 'application/octet-stream' : mime }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  if (/\.ifc$/i.test(nombre)) avisoComoAbrirIfc();
}

/** El .IFC no se abre con doble clic (Windows no lo asocia a Revit): se dice cómo abrirlo. */
function avisoComoAbrirIfc() {
  try {
    const d = document.createElement('div');
    d.setAttribute('role', 'status');
    d.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:10001;max-width:min(92vw,520px);background:#312e81;color:#fff;font:600 13px/1.4 system-ui,sans-serif;padding:12px 40px 12px 14px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.3)';
    d.innerHTML = '<b>Archivo para Revit (.IFC)</b><br>Ábrelo desde Revit: <b>Archivo → Abrir → IFC</b>, o <b>Insertar → Vincular IFC</b>. Con doble clic Windows no lo reconoce.';
    const x = document.createElement('button');
    x.textContent = '✕'; x.setAttribute('aria-label', 'Cerrar');
    x.style.cssText = 'position:absolute;right:8px;top:8px;background:transparent;border:0;color:#fff;font-size:16px;cursor:pointer';
    x.onclick = () => d.remove();
    d.appendChild(x); document.body.appendChild(d);
    setTimeout(() => d.remove(), 14000);
  } catch { /* sin aviso */ }
}
export const nombreArchivo = (s: string) => (s || 'modelo').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60) || 'modelo';
