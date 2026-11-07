// =============================================================================
// Tijerales longitudinales de alero (vigas celosía perimetrales).
//
// A lo largo de cada alero (línea de columnas de los extremos de la luz) arma
// una viga celosía vertical: cordón superior = línea de cabezas de columna,
// cordón inferior a "peralte" más abajo (la columna se parte en ese punto),
// montantes y diagonales en zig-zag (Warren) en paneles de ~1 m.
// La usan los generadores del asistente para "Longitudinal", "Perimetral" y
// "Completo 3D".
// =============================================================================
import type { Node3D, Segment3D } from './techosCadEngineTypes';

const cerca = (a: number, b: number, t = 0.01) => Math.abs(a - b) <= t;

export function tijeralesDeAlero(
  nodes: Record<string, Node3D>,
  segs: Record<string, Segment3D>,
  opciones: { peralteM?: number; perfil: string; perfilCordon?: string; panelM?: number },
): void {
  const cols = Object.values(segs)
    .filter(s => s.rolEstructural === 'columna')
    .map(s => ({ s, a: nodes[s.nodeAId], b: nodes[s.nodeBId] }))
    .filter(c => c.a && c.b && cerca(c.a.x, c.b.x) && cerca(c.a.z, c.b.z) && Math.abs(c.a.y - c.b.y) > 1)
    .map(c => (c.a.y < c.b.y ? { s: c.s, pie: c.a, cab: c.b } : { s: c.s, pie: c.b, cab: c.a }))
    .filter(c => c.pie.y < 0.05);
  if (cols.length < 4) return;
  const xs = cols.map(c => c.pie.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const panelM = opciones.panelM || 1.0;
  let k = 0;
  const id = (p: string) => `${p}_${++k}`;
  const nuevoNodo = (x: number, y: number, z: number, etiqueta: string) => { const i = id('n_alero'); nodes[i] = { id: i, x, y, z, nodeLabel: etiqueta }; return i; };
  const nuevoSeg = (a: string, b: string, rol: Segment3D['rolEstructural'], perfil: string) => { const i = id('s_alero'); segs[i] = { id: i, nodeAId: a, nodeBId: b, profileId: perfil, rolEstructural: rol }; };

  [minX, maxX].forEach((xLado, ladoIdx) => {
    const linea = cols.filter(c => cerca(c.pie.x, xLado)).sort((p, q) => p.cab.z - q.cab.z);
    if (linea.length < 2) return;
    const H = Math.min(...linea.map(c => c.cab.y));
    const peralte = Math.max(0.3, Math.min(opciones.peralteM || 0.6, H * 0.4));
    // Partir cada columna a la altura del cordón inferior.
    const inferior = linea.map(c => {
      const m = nuevoNodo(xLado, c.cab.y - peralte, c.cab.z, `ALERO-${ladoIdx ? 'DER' : 'IZQ'}-INF`);
      segs[c.s.id] = { ...c.s, nodeAId: c.pie.id, nodeBId: m };
      nuevoSeg(m, c.cab.id, 'columna', c.s.profileId);
      return m;
    });
    for (let i = 0; i + 1 < linea.length; i++) {
      const t0 = linea[i].cab, t1 = linea[i + 1].cab, b0 = inferior[i], b1 = inferior[i + 1];
      const vano = Math.abs(t1.z - t0.z);
      const n = Math.max(2, Math.round(vano / panelM));
      // Cordón superior: reemplaza la pieza que une las dos cabezas (correa/viga) por tramos.
      const existente = Object.values(segs).find(s => (s.nodeAId === t0.id && s.nodeBId === t1.id) || (s.nodeAId === t1.id && s.nodeBId === t0.id));
      const rolSup = existente?.rolEstructural || 'viga_principal';
      const perfSup = existente?.profileId || opciones.perfilCordon || opciones.perfil;
      if (existente) delete segs[existente.id];
      const sup: string[] = [t0.id], inf: string[] = [b0];
      for (let j = 1; j < n; j++) {
        const f = j / n;
        const z = t0.z + (t1.z - t0.z) * f;
        sup.push(nuevoNodo(xLado, t0.y + (t1.y - t0.y) * f, z, 'ALERO-SUP'));
        inf.push(nuevoNodo(xLado, nodes[b0].y + (nodes[b1].y - nodes[b0].y) * f, z, 'ALERO-INF'));
      }
      sup.push(t1.id); inf.push(b1);
      for (let j = 0; j < n; j++) {
        nuevoSeg(sup[j], sup[j + 1], rolSup, perfSup);
        nuevoSeg(inf[j], inf[j + 1], 'cordon_inferior', opciones.perfilCordon || opciones.perfil);
        // Warren: diagonales alternadas.
        if (j % 2 === 0) nuevoSeg(inf[j], sup[j + 1], 'diagonal', opciones.perfil);
        else nuevoSeg(sup[j], inf[j + 1], 'diagonal', opciones.perfil);
        if (j > 0) nuevoSeg(inf[j], sup[j], 'montante', opciones.perfil);
      }
    }
  });
}
