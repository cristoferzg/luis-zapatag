// =============================================================================
// Techo alpino (tipo chalet / cabaña en A): dos aguas muy empinadas que bajan
// casi hasta el suelo. Pórticos en A cada cierta separación, cada uno con dos
// vigas inclinadas (pares) que se juntan en la cumbrera y un tirante horizontal
// (sirve de piso de altillo). Columnas cortas desde el suelo hasta el arranque
// (zócalo), vigas de base y cumbrera a lo largo, correas en cada agua y
// arriostres en cruz en los extremos. Dos zonas de cobertura (una por agua).
// =============================================================================
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';
import { INVENTARIO_PERFILES_TUBULARES } from './techosCadCatalog';

export interface TechoAlpinoCfg {
  anchoM: number;        // ancho de la base (de un arranque al otro)
  largoM: number;        // largo de la nave (a lo largo de la cumbrera)
  alturaCumbreraM: number; // altura de la cumbrera desde el suelo
  alturaBaseM: number;   // altura del arranque de los pares (zócalo / columnas cortas); 0 = desde el suelo
  sepPorticosM: number;  // separación entre pórticos en A
  coberturaId: string;
  perfilDefecto: string;
}

export function generarTechoAlpino(c: TechoAlpinoCfg) {
  const N: Record<string, Node3D> = {}, S: Record<string, Segment3D> = {};
  const existe = (id: string) => (INVENTARIO_PERFILES_TUBULARES.some(p => p.id === id) ? id : c.perfilDefecto);
  const parProf = existe('perfil_rec_100x50_20');
  const colProf = existe('perfil_rec_80x40_20');
  const vigaProf = existe('perfil_rec_60x40_20');
  const correaProf = existe('perfil_rec_2x1_15');
  const node = (id: string, x: number, y: number, z: number, label: string, fijo = false) => { N[id] = { id, x, y, z, nodeLabel: label, isFixedSupport: fijo }; return id; };
  const seg = (id: string, a: string, b: string, prof: string, rol: Segment3D['rolEstructural']) => { S[id] = { id, nodeAId: a, nodeBId: b, profileId: prof, rolEstructural: rol }; };

  const ancho = Math.max(2, c.anchoM), largo = Math.max(1, c.largoM);
  const yBase = Math.max(0, c.alturaBaseM);
  const yCum = Math.max(yBase + ancho * 0.5, c.alturaCumbreraM); // al menos 45°
  const xm = ancho / 2;
  const subida = yCum - yBase;
  const nPor = Math.max(2, Math.round(largo / Math.max(0.6, c.sepPorticosM)) + 1);
  const zs = Array.from({ length: nPor }, (_, i) => (largo * i) / (nPor - 1));
  const largoPar = Math.hypot(xm, subida);
  const nCorreas = Math.max(2, Math.round(largoPar / 0.9));   // tramos por agua
  // Puntos del par (fracción desde el arranque): las correas; el tirante (altillo)
  // va en el punto de correa más cercano al 45 % de la subida.
  const ts = Array.from({ length: nCorreas + 1 }, (_, k) => k / nCorreas);
  const tTir = ts.slice(1, -1).reduce((m, t) => (Math.abs(t - 0.45) < Math.abs(m - 0.45) ? t : m), ts[1]);
  const idPar = (l: number, i: number, t: number) => `al_p_${l}_${i}_${Math.round(t * 1000)}`;

  // Punto sobre el par del lado l (0 = x=0, 1 = x=ancho) a la fracción t (0 arranque, 1 cumbrera)
  const enPar = (l: number, t: number) => ({ x: l === 0 ? xm * t : ancho - xm * t, y: yBase + subida * t });

  zs.forEach((z, i) => {
    const n = i + 1;
    const cum = node(`al_cum_${i}`, xm, yCum, z, `ALP-CUMBRERA-${n}`);
    [0, 1].forEach(l => {
      const lado = l === 0 ? 'A' : 'B';
      const arr = node(`al_arr_${l}_${i}`, l === 0 ? 0 : ancho, yBase, z, `ALP-ARRANQUE-${lado}-${n}`, yBase < 0.01);
      if (yBase >= 0.01) {
        const b = node(`al_cb_${l}_${i}`, l === 0 ? 0 : ancho, 0, z, `ALP-COL-${lado}-${n}`, true);
        seg(`al_c_${l}_${i}`, b, arr, colProf, 'columna');
      }
      // Par dividido en los puntos de correa (y el del tirante) para que todo quede conectado.
      let prev = arr;
      ts.slice(1, -1).forEach(t => {
        const p = enPar(l, t);
        const id = node(idPar(l, i, t), p.x, p.y, z, `ALP-PAR-${lado}-${n}`);
        seg(`al_ps_${l}_${i}_${Math.round(t * 1000)}`, prev, id, parProf, 'viga_principal');
        prev = id;
      });
      seg(`al_ps_${l}_${i}_cum`, prev, cum, parProf, 'viga_principal');
    });
    // Tirante (piso del altillo)
    seg(`al_tir_${i}`, idPar(0, i, tTir), idPar(1, i, tTir), vigaProf, 'viga_secundaria');
  });

  // A lo largo: base, cumbrera y correas (unen el mismo punto de pórtico a pórtico)
  const porNivel = new Map<string, string[]>();
  Object.values(N).forEach(q => {
    if (q.y < 0.01 && !q.id.startsWith('al_arr_')) return; // bases de columnas no se unen
    const clave = `${q.x.toFixed(3)}|${q.y.toFixed(3)}`;
    porNivel.set(clave, [...(porNivel.get(clave) || []), q.id]);
  });
  porNivel.forEach(ids => {
    const fila = ids.map(id => N[id]).sort((a, b) => a.z - b.z);
    for (let k = 1; k < fila.length; k++) {
      const a = fila[k - 1], b = fila[k];
      const rol: Segment3D['rolEstructural'] = a.id.startsWith('al_cum_') || a.id.startsWith('al_arr_') ? 'viga_secundaria' : 'correa';
      seg(`al_l_${a.id}_${k}`, a.id, b.id, rol === 'correa' ? correaProf : vigaProf, rol);
    }
  });

  // Arriostres en cruz en el primer y último vano de cada agua
  const vanos = nPor > 2 ? [0, nPor - 2] : [0];
  vanos.forEach(v => [0, 1].forEach(l => {
    seg(`al_x1_${l}_${v}`, `al_arr_${l}_${v}`, `al_cum_${v + 1}`, correaProf, 'arriostre');
    seg(`al_x2_${l}_${v}`, `al_arr_${l}_${v + 1}`, `al_cum_${v}`, correaProf, 'arriostre');
  }));

  const pend = Math.round((subida / xm) * 100);
  const t0 = Date.now();
  const zonas: Record<string, CoverageZone3D> = {
    [`zone_alp_a_${t0}`]: { id: `zone_alp_a_${t0}`, nombre: 'Agua A', nodeIdsBoundary: ['al_arr_0_0', `al_arr_0_${nPor - 1}`, `al_cum_${nPor - 1}`, 'al_cum_0'], coberturaMaterialId: c.coberturaId, pendientePorcentaje: pend, orientacionInclinacionDeg: 270 },
    [`zone_alp_b_${t0}`]: { id: `zone_alp_b_${t0}`, nombre: 'Agua B', nodeIdsBoundary: ['al_cum_0', `al_cum_${nPor - 1}`, `al_arr_1_${nPor - 1}`, 'al_arr_1_0'], coberturaMaterialId: c.coberturaId, pendientePorcentaje: pend, orientacionInclinacionDeg: 90 },
  };
  return { nodes: N, segments: S, coverageZones: zonas };
}
