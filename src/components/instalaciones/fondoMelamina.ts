// Gasfitería con los muebles de Melamina de fondo (botón 💧 de Melamina): las paredes y los
// muebles tendidos en planta (las mismas coordenadas que usa Electricidad), y el lavadero de
// cocina sugerido sobre el primer mueble bajo de cocina.
import { desdeMelamina } from '../electricidad/modeloElectricidad';
import type { Aparato, FondoGas } from '../gasfiteria/modeloGasfiteria';
import { safeStorage } from '../../lib/storageManager';

const NOMBRE_TIPO: Record<string, string> = { cocina_baja: 'Cocina baja', cocina_alta: 'Repostero', alacena: 'Alacena', isla: 'Isla', closet: 'Closet', closet_corredizo: 'Closet corredizo', vestidor: 'Vestidor', bano: 'Mueble de baño', botiquin: 'Botiquín', rack_tv: 'Rack de TV', escritorio: 'Escritorio' };

export function fondoGasDesdeMelamina(): { fondo: FondoGas; sugeridos: Aparato[]; texto: string } | null {
  const f = desdeMelamina();
  if (f.vacio) return null;
  // Las referencias salen en el mismo orden que los muebles de la cotización: de ahí el tipo.
  const tipos = (safeStorage.getItem<{ muebles?: { tipo: string; nombre?: string }[] } | null>('melamina_cotizacion_actual', null)?.muebles || []);
  const muebles = f.refs.filter(r => r.tipo === 'mueble').map((r, i) => ({ x: r.x, y: r.y, w: r.w, d: r.d, rot: r.rot, etiqueta: r.etiqueta || NOMBRE_TIPO[tipos[i]?.tipo || ''] || 'Mueble', alto: r.alto, tipo: tipos[i]?.tipo || '' }));
  let x1 = 0, y1 = 0;
  f.muros.forEach(m => { x1 = Math.max(x1, m.x1, m.x2); y1 = Math.max(y1, m.y1, m.y2); });
  const fondo: FondoGas = { tipo: 'melamina', ancho: Math.max(1, x1), largo: Math.max(1, y1), muros: f.muros, muebles: muebles.map(({ tipo: _t, ...m }) => m) };
  const sugeridos: Aparato[] = [];
  const cocina = muebles.find(m => m.tipo === 'cocina_baja' || m.tipo === 'isla') || muebles.find(m => !m.alto && /cocina|isla/i.test(m.etiqueta || ''));
  if (cocina) {
    // Pegado a la pared detrás del mueble (la "espalda" del aparato va contra la pared).
    const a = (cocina.rot * Math.PI) / 180, nx = -Math.sin(a), ny = Math.cos(a);
    const atras = cocina.d / 2 + 0.075, dLav = 0.25 + 0.095;
    sugeridos.push({ id: 'lav_mel', tipo: 'lavadero_cocina', x: Math.round((cocina.x - nx * atras + nx * dLav) * 1000) / 1000, y: Math.round((cocina.y - ny * atras + ny * dLav) * 1000) / 1000, rot: cocina.rot, nombre: 'Lavadero (cocina)' });
  }
  return { fondo, sugeridos, texto: f.texto };
}
