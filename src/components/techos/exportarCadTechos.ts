import { geometriaCerramiento } from './cerramiento';
// Techos Metálicos → sólidos para AutoCAD (DXF 3D) y Revit (IFC): cada tubo con su perfil del
// catálogo (columnas, cordones, montantes, diagonales, correas, tensores…) y la cobertura
// de cada zona como cubierta con su espesor.
import { INVENTARIO_PERFILES_TUBULARES, INVENTARIO_COBERTURAS } from './techosCadCatalog';
import type { Node3D, Segment3D, CoverageZone3D } from './techosCadEngineTypes';
import type { SolidoCad, SuperficieCad, SeccionSolido, V3 } from '../../lib/solidosCad';

const NOMBRE_ROL: Record<string, string> = {
  columna: 'Columna', columna_concreto: 'Columna de concreto', cordon_superior: 'Cordón superior', cordon_inferior: 'Cordón inferior',
  diagonal: 'Diagonal', montante: 'Montante', correa: 'Correa', viga_principal: 'Viga principal', viga_secundaria: 'Viga secundaria',
  tensor_viento: 'Tensor', arriostre: 'Arriostre', piso_deck: 'Piso', baranda: 'Baranda', escalera: 'Escalera', placa_base: 'Placa base', cartela: 'Cartela',
};

export function solidosDeTecho(nodes: Record<string, Node3D>, segments: Record<string, Segment3D>, zonas: Record<string, CoverageZone3D> = {}):
  { solidos: SolidoCad[]; superficies: SuperficieCad[] } {
  const solidos: SolidoCad[] = [];
  Object.values(segments || {}).forEach(sg => {
    const A = nodes[sg.nodeAId], B = nodes[sg.nodeBId];
    if (!A || !B) return;
    const a: V3 = [A.x, A.y, A.z || 0], b: V3 = [B.x, B.y, B.z || 0];
    const largo = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (largo < 0.005) return;
    const rol = sg.rolEstructural || 'viga_principal';
    const vertical = Math.abs(b[1] - a[1]) / largo > 0.98;
    let seccion: SeccionSolido, material = 'Acero', etiqueta = '';
    if (rol === 'columna_concreto') {
      const [w, h] = sg.seccionCm || [25, 25];
      seccion = { forma: 'rect', ancho: w / 100, alto: h / 100 };
      material = 'Concreto'; etiqueta = `${w}x${h} cm`;
    } else {
      const p = INVENTARIO_PERFILES_TUBULARES.find(x => x.id === sg.profileId) || INVENTARIO_PERFILES_TUBULARES[0];
      const an = (p?.anchoMm || 50) / 1000, al = (p?.altoMm || p?.anchoMm || 50) / 1000, t = Math.max(0.0008, (p?.espesorMm || 2) / 1000);
      etiqueta = p?.nombre || '';
      // Vigas y correas: el lado alto del tubo en vertical (como en el 3D); 90° lo voltea.
      let sx = vertical ? an : Math.min(an, al), sy = vertical ? al : Math.max(an, al);
      if (Math.round((sg.anguloRotacionGrados || 0) / 90) % 2) [sx, sy] = [sy, sx];
      seccion = p?.categoria === 'perfil_h_ipe'
        // Viga H (anchoMm = peralte, altoMm = ala): de columna, el alma en el plano del pórtico (X); acostada, alma vertical.
        ? (vertical ? { forma: 'h', ancho: an, alto: al, espesor: t, espesorAla: (p.alaEspMm || p.espesorMm * 1.3) / 1000, almaVertical: false }
          : { forma: 'h', ancho: al, alto: an, espesor: t, espesorAla: (p.alaEspMm || p.espesorMm * 1.3) / 1000, almaVertical: true })
        : p?.categoria === 'tubo_redondo' || p?.categoria === 'barra_redonda'
        ? { forma: p.categoria === 'barra_redonda' ? 'circ' : 'circ_hueco', ancho: an, alto: an, espesor: t }
        : { forma: /^tubo_/.test(p?.categoria || '') ? 'rect_hueco' : 'rect', ancho: Math.max(0.004, sx), alto: Math.max(0.004, sy), espesor: t };
    }
    const tipo: SolidoCad['tipo'] = /^columna/.test(rol) ? 'columna' : rol === 'baranda' ? 'baranda'
      : /viga|correa|cordon/.test(rol) ? 'viga' : rol === 'piso_deck' || rol === 'placa_base' || rol === 'cartela' ? 'placa' : 'miembro';
    const nombre = NOMBRE_ROL[rol] || rol;
    solidos.push({ tipo: vertical && tipo === 'viga' ? 'columna' : tipo, nombre: etiqueta ? `${nombre} (${etiqueta})` : nombre, capa: nombre, material, a, b, seccion });
  });
  const superficies: SuperficieCad[] = [];
  Object.values(zonas || {}).forEach(z => {
    const contorno = (z.nodeIdsBoundary || []).map(id => nodes[id]).filter(Boolean).map(n => [n.x, n.y, n.z || 0] as V3);
    if (contorno.length < 3) return;
    const cob = INVENTARIO_COBERTURAS.find(c => c.id === z.coberturaMaterialId) as { nombre?: string; espesorMm?: number } | undefined;
    superficies.push({ tipo: 'cubierta', nombre: z.nombre || cob?.nombre || 'Cobertura', capa: 'Cobertura', contorno,
      espesor: Math.max(0.0004, (Number(cob?.espesorMm) || 0.4) / 1000), material: cob?.nombre || 'Cobertura' });
  });
  // Cerramiento lateral: largueros y planchas de pared.
  const gc = geometriaCerramiento(nodes, segments, zonas);
  if (gc) {
    const an = gc.perfil.anchoMm / 1000, al = (gc.perfil.altoMm || gc.perfil.anchoMm) / 1000, t = Math.max(0.0008, gc.perfil.espesorMm / 1000);
    gc.largueros.forEach(g => solidos.push({ tipo: 'viga', nombre: `Larguero de pared (${gc.perfil.nombre})`, capa: 'Largueros de pared', material: 'Acero', a: g.a, b: g.b,
      seccion: { forma: /^tubo_/.test(gc.perfil.categoria) ? 'rect_hueco' : 'rect', ancho: Math.max(an, al), alto: Math.min(an, al), espesor: t } }));
    gc.panos.forEach(q => superficies.push({ tipo: 'cubierta', nombre: `Pared de aluzinc (${q.lado})`, capa: 'Paredes de aluzinc', material: 'Aluzinc', espesor: 0.004, contorno: q.pts }));
  }
  return { solidos, superficies };
}
