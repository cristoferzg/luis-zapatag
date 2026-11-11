// =============================================================================
// Techo metálico MOVIBLE: la cobertura se divide en paños que se abren.
//   • corredizo: paños telescópicos sobre rieles; se apilan sobre el primero.
//   • plegable: paños tipo acordeón que se levantan y se juntan en un extremo.
//   • lamas: pérgola bioclimática; cada lama gira sobre su eje (se orienta).
// Accionamiento manual (manivela con caja reductora) o con motor y control.
// La configuración va en la zona de cobertura principal (campo opcional
// `movil`), así se guarda con el diseño sin cambiar la base de datos.
// El metrado suma rieles, ruedas, ejes y el motor al presupuesto.
// =============================================================================
import type { Node3D, CoverageZone3D, TechoMovil } from './techosCadEngineTypes';
import { precio, itemCatalogo } from '../../lib/catalogoPrecios';

export const TIPOS_MOVIL: { id: TechoMovil['tipo']; nombre: string; ayuda: string; panos: number }[] = [
  { id: 'corredizo', nombre: 'Corredizo', ayuda: 'Paños sobre rieles que se deslizan y se apilan sobre el primero.', panos: 3 },
  { id: 'plegable', nombre: 'Plegable', ayuda: 'Paños tipo acordeón que se levantan y se juntan en un extremo.', panos: 4 },
  { id: 'lamas', nombre: 'Lamas (bioclimático)', ayuda: 'Lamas que giran sobre su eje: dejan pasar aire y luz o cierran del todo.', panos: 12 },
];

export const esZonaTanque = (z: CoverageZone3D) => /^tq[0-9a-z]+_/.test(z.id);
/** Zona de cobertura principal (la que no es sobretecho de un tanque). */
export const zonaPrincipal = (zonas: Record<string, CoverageZone3D>) => Object.values(zonas || {}).find(z => !esZonaTanque(z));
export const movilDe = (zonas: Record<string, CoverageZone3D>) => zonaPrincipal(zonas)?.movil;

export interface LineaMovil { clave: string; nombre: string; unidad: string; cantidad: number; precio: number; subtotal: number; nota: string }

/** Materiales del mecanismo según el tamaño del techo (largo en Z, ancho en X). */
export function metradoMovil(nodes: Record<string, Node3D>, zonas: Record<string, CoverageZone3D>): LineaMovil[] {
  const m = movilDe(zonas);
  const ns = Object.values(nodes || {});
  if (!m || ns.length < 2) return [];
  const zs = ns.map(n => n.z || 0), xs = ns.map(n => n.x);
  const largo = Math.max(...zs) - Math.min(...zs), ancho = Math.max(...xs) - Math.min(...xs);
  const panos = Math.max(1, Math.round(m.panos || 1));
  const out: LineaMovil[] = [];
  const add = (clave: string, cantidad: number, nota: string) => {
    if (cantidad <= 0) return;
    const it = itemCatalogo(clave); const p = precio(clave);
    out.push({ clave, nombre: it?.nombre || clave, unidad: it?.unidad || 'und', cantidad, precio: p, subtotal: cantidad * p, nota });
  };
  if (m.tipo === 'lamas') {
    add('movil:eje_lama', panos * 2, `2 por lama (${panos} lamas de ${ancho.toFixed(2)} m)`);
    add('movil:barra_mando', Math.ceil(largo * 2 * 10) / 10, 'barra de mando a cada lado');
    add('movil:canaleta', Math.ceil(largo * 2 * 10) / 10, 'canaleta lateral que recoge el agua');
  } else {
    add('movil:riel', Math.ceil(largo * 2 * 10) / 10, `2 rieles de ${largo.toFixed(2)} m`);
    const moviles = m.tipo === 'corredizo' ? panos - 1 : panos; // en el corredizo el primer paño es fijo
    add('movil:rueda', moviles * 4, `4 por paño móvil (${moviles})`);
    add('movil:tope', 4, 'tope y seguro en cada extremo de riel');
    if (m.tipo === 'plegable') add('movil:bisagra', (panos - 1) * 3, '3 bisagras entre paños');
    add('movil:sello', Math.ceil(ancho * Math.max(1, panos - 1) * 10) / 10, 'empaque entre paños contra la lluvia');
  }
  if (m.accionamiento === 'motor') {
    add('movil:motor', 1, 'motor con caja reductora y fin de carrera');
    add('movil:control', 1, 'control remoto + sensor de lluvia');
    if (m.tipo !== 'lamas') add('movil:cremallera', Math.ceil(largo * 10) / 10, 'cremallera / cadena de arrastre');
  } else {
    add('movil:manivela', 1, 'manivela con caja reductora');
  }
  return out;
}
// Los ítems 'movil:*' están registrados en el Catálogo de precios (precio 0).
