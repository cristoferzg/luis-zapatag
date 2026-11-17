// Carpintería Metálica → sólidos para AutoCAD (DXF 3D) y Revit (IFC), con la sección real
// de cada tubo del catálogo y las planchas/peldaños con su espesor (igual que el visor 3D).
import { PERFILES_CATALOGO } from './herreriaCatalog';
import type { HerreriaDesign, PiezaCad } from './herreriaTypes';
import type { SolidoCad, SeccionSolido, V3 } from '../../lib/solidosCad';

const esPlanchaDe = (pz: PiezaCad) => !!(pz.esPlancha || pz.tipo === 'plancha' || (pz.anchoPlanchaM && pz.altoPlanchaM) || pz.subtipoPlancha
  || pz.tipoRelleno === 'plancha' || pz.tipoRelleno === 'plancha_estriada' || pz.tipoRelleno === 'plancha_perforada' || pz.tipoRelleno === 'vidrio');

export function solidosDeHerreria(design: HerreriaDesign): SolidoCad[] {
  const out: SolidoCad[] = [];
  (design.piezas || []).forEach(pz => {
    const nombre = [pz.marca, pz.nombre].filter(Boolean).join(' ') || 'Pieza';
    const capa = pz.grupo || 'estructura';
    const material = pz.tipoRelleno === 'vidrio' ? 'Vidrio' : /madera/.test(pz.acabadoMaterial || '') ? 'Madera' : 'Acero';
    if (esPlanchaDe(pz)) {
      const esp = Math.max(0.0015, (pz.espesorPlanchaMm || 2) / 1000);
      if (pz.sectorPeldano) {
        const { rIn, rOut, a0Deg, a1Deg } = pz.sectorPeldano;
        const am = ((a0Deg + a1Deg) / 2) * Math.PI / 180, rm = (rIn + rOut) / 2;
        const c = Math.cos(am), s = -Math.sin(am);
        out.push({ tipo: 'placa', nombre, capa, material, a: [rIn * c, pz.y1 + esp / 2, rIn * s], b: [rOut * c, pz.y1 + esp / 2, rOut * s],
          seccion: { forma: 'rect', ancho: Math.max(0.05, rm * Math.abs(a1Deg - a0Deg) * Math.PI / 180), alto: esp } });
        return;
      }
      const minX = Math.min(pz.x1, pz.x2), minY = Math.min(pz.y1, pz.y2), minZ = Math.min(pz.z1 || 0, pz.z2 || 0);
      const dY = Math.abs(pz.y2 - pz.y1), dZ = Math.abs((pz.z2 || 0) - (pz.z1 || 0));
      const horizontal = dY < 0.02 && (dZ > 0.01 || (pz.altoPlanchaM || 0) > 0);
      const w = Math.max(0.02, pz.anchoPlanchaM || Math.abs(pz.x2 - pz.x1));
      if (horizontal) {
        const fondo = Math.max(0.02, pz.altoPlanchaM || dZ || 0.04);
        out.push({ tipo: 'placa', nombre, capa, material, a: [minX, pz.y1 + esp / 2, minZ + fondo / 2], b: [minX + w, pz.y1 + esp / 2, minZ + fondo / 2],
          seccion: { forma: 'rect', ancho: fondo, alto: esp } });
      } else {
        const h = Math.max(0.02, pz.altoPlanchaM || dY || 0.04);
        const z = (pz.z1 || 0) + esp / 2;
        out.push({ tipo: 'placa', nombre, capa, material, a: [minX, minY + h / 2, z], b: [minX + w, minY + h / 2, z],
          seccion: { forma: 'rect', ancho: esp, alto: h } });
      }
      return;
    }
    const perfil = PERFILES_CATALOGO.find(p => p.id === pz.perfilId) || PERFILES_CATALOGO[0];
    const a: V3 = [pz.x1, pz.y1, pz.z1 || 0], b: V3 = [pz.x2, pz.y2, pz.z2 || 0];
    const largo = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (largo < 0.002) return;
    const anchoM = perfil.anchoMm / 1000, altoM = (perfil.categoria === 'platina' ? perfil.espesorMm || 4.5 : perfil.altoMm) / 1000;
    const t = Math.max(0.0008, (perfil.espesorMm || 2) / 1000);
    const vertical = Math.abs(b[1] - a[1]) / largo > 0.98;
    // Igual que el visor: en piezas del plano XY el lado "ancho" queda en el plano y el "alto" hacia Z.
    let sx = vertical ? anchoM : altoM, sy = vertical ? altoM : anchoM;
    if (Math.round((pz.rotacionDeg || 0) / 90) % 2) [sx, sy] = [sy, sx];
    const hueco = /^tubo_/.test(perfil.categoria);
    const seccion: SeccionSolido = perfil.categoria === 'tubo_redondo'
      ? { forma: 'circ_hueco', ancho: anchoM, alto: anchoM, espesor: t }
      : { forma: hueco ? 'rect_hueco' : 'rect', ancho: Math.max(0.003, sx), alto: Math.max(0.003, sy), espesor: t };
    const inclinado = Math.abs(b[1] - a[1]) > 0.05 && !vertical;
    const g = (pz.grupo || '').toLowerCase();
    const tipo: SolidoCad['tipo'] = /baranda|pasamano/.test(g) ? 'baranda' : vertical ? 'columna' : inclinado || /diagonal|zanco/.test(g) ? 'miembro' : 'viga';
    out.push({ tipo, nombre: `${nombre} (${perfil.dimensiones || perfil.nombre})`, capa, material, a, b, seccion });
  });
  return out;
}
