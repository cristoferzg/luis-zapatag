// Obra Civil → sólidos para AutoCAD (DXF 3D) y Revit (IFC): columnas, zapatas, cimientos, vigas,
// losas, muros, placas y escaleras con sus medidas y a la altura de su piso (como en el 3D),
// más la estructura de Techos vinculada. Plano (x, y) → 3D (x, altura, y).
import type { PlanoElem } from '../ConcretoPlanoCad';
import { contextosObra, cotaLosa, type EstructuraTechos } from './obraPisos';
import { escalera } from './extrasObra';
import { solidosDeTecho } from '../techos/exportarCadTechos';
import type { SolidoCad, SuperficieCad } from '../../lib/solidosCad';

export function solidosDeObra(elems: PlanoElem[], niveles: string[], estructura: EstructuraTechos | null):
  { solidos: SolidoCad[]; superficies: SuperficieCad[] } {
  const obra = contextosObra(niveles, estructura);
  const solidos: SolidoCad[] = [], superficies: SuperficieCad[] = [];
  const colHs = elems.filter(e => e.tipo === 'columna').map(e => e.H || 3);
  const vigaElev = colHs.length ? Math.max(...colHs) : 3;
  const rect = (ancho: number, alto: number) => ({ forma: 'rect' as const, ancho: Math.max(0.01, ancho), alto: Math.max(0.01, alto) });
  let n = 0;
  elems.forEach(e => {
    n++;
    const a = e.a, b = e.b || e.a, h = e.h || 0.5, H = e.H || 3;
    const piso = e.nivel || obra.pisos[0] || 'Piso 1';
    const base = (() => { try { return obra.ctx(e.nivel).base; } catch { return 0; } })();
    if (e.tipo === 'columna') { solidos.push({ tipo: 'columna', nombre: `Columna C-${n} ${Math.round(a * 100)}x${Math.round(b * 100)}`, capa: 'Columnas', material: 'Concreto', a: [e.x1, 0, e.y1], b: [e.x1, H, e.y1], seccion: rect(a, b) }); return; }
    if (e.tipo === 'zapata') { solidos.push({ tipo: 'zapata', nombre: `Zapata Z-${n}`, capa: 'Zapatas', material: 'Concreto', a: [e.x1, -h, e.y1], b: [e.x1, 0, e.y1], seccion: rect(a, b) }); return; }
    if (e.x2 === undefined || e.y2 === undefined) return;
    if (e.tipo === 'losa') {
      const esOsb = e.losaMaterial === 'osb', esp = e.h || (esOsb ? 0.018 : 0.2);
      const tope = (e.elevM || e.nivel || estructura) ? cotaLosa(e, niveles, estructura) : vigaElev + esp;
      const y0 = tope - esp, x1 = Math.min(e.x1, e.x2), x2 = Math.max(e.x1, e.x2), z1 = Math.min(e.y1, e.y2), z2 = Math.max(e.y1, e.y2);
      superficies.push({ tipo: 'losa', nombre: `Losa ${piso}`, capa: 'Losas', material: esOsb ? 'OSB' : 'Concreto', espesor: esp,
        contorno: [[x1, y0, z1], [x2, y0, z1], [x2, y0, z2], [x1, y0, z2]] });
      return;
    }
    const L = Math.hypot(e.x2 - e.x1, e.y2 - e.y1);
    if (L < 0.02) return;
    if (e.tipo === 'muro') {
      const alto = H, y = base + (e.baseM || 0) + alto / 2;
      const mat = e.material === 'drywall' ? 'Drywall' : e.material === 'osb' ? 'OSB' : 'Ladrillo';
      solidos.push({ tipo: 'muro', nombre: `Muro ${mat.toLowerCase()} ${piso}`, capa: `Muros ${piso}`, material: mat, a: [e.x1, y, e.y1], b: [e.x2, y, e.y2], seccion: rect(a || 0.15, alto) });
    } else if (e.tipo === 'placa') {
      const alto = H, y = base + alto / 2;
      solidos.push({ tipo: 'muro', nombre: `Placa de concreto ${piso}`, capa: 'Placas', material: 'Concreto', a: [e.x1, y, e.y1], b: [e.x2, y, e.y2], seccion: rect(a || 0.2, alto) });
    } else if (e.tipo === 'escalera') {
      const r = escalera(L, e.H || 2.6, e.a || 1);
      const ux = (e.x2 - e.x1) / L, uz = (e.y2 - e.y1) / L;
      for (let i = 0; i < r.n; i++) {
        const t0 = r.paso * i, hh = r.cp * (i + 1);
        solidos.push({ tipo: 'losa', nombre: `Escalera paso ${i + 1}`, capa: 'Escaleras', material: 'Concreto',
          a: [e.x1 + ux * t0, base + hh / 2, e.y1 + uz * t0], b: [e.x1 + ux * (t0 + r.paso), base + hh / 2, e.y1 + uz * (t0 + r.paso)], seccion: rect(e.a || 1, hh) });
      }
    } else if (e.tipo === 'viga') {
      if (!(obra.pisos.length > 1 || e.visible1Piso)) return;
      const y = (e.elevM ?? vigaElev) - h / 2;
      solidos.push({ tipo: 'viga', nombre: `Viga ${Math.round(a * 100)}x${Math.round(h * 100)}`, capa: 'Vigas', material: 'Concreto', a: [e.x1, y, e.y1], b: [e.x2, y, e.y2], seccion: rect(a, h) });
    } else {
      solidos.push({ tipo: 'zapata', nombre: 'Cimiento corrido', capa: 'Cimientos', material: 'Concreto', a: [e.x1, -h / 2, e.y1], b: [e.x2, -h / 2, e.y2], seccion: rect(a, h) });
    }
  });
  if (estructura) {
    const t = solidosDeTecho(estructura.nodes as never, estructura.segments as never, (estructura.coverageZones || {}) as never);
    solidos.push(...t.solidos); superficies.push(...t.superficies);
  }
  return { solidos, superficies };
}
