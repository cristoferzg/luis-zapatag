// Gasfitería con los muebles de Melamina de fondo (botón 💧 de Melamina): las paredes y los
// muebles tendidos en planta (las mismas coordenadas que usa Electricidad), y el lavadero de
// cocina sugerido sobre el primer mueble bajo de cocina.
import { desdeMelamina } from '../electricidad/modeloElectricidad';
import type { Aparato, FondoGas } from '../gasfiteria/modeloGasfiteria';

export function fondoGasDesdeMelamina(): { fondo: FondoGas; sugeridos: Aparato[]; texto: string } | null {
  const f = desdeMelamina();
  if (f.vacio) return null;
  const muebles = f.refs.filter(r => r.tipo === 'mueble').map(r => ({ x: r.x, y: r.y, w: r.w, d: r.d, rot: r.rot, etiqueta: r.etiqueta, alto: r.alto }));
  let x1 = 0, y1 = 0;
  f.muros.forEach(m => { x1 = Math.max(x1, m.x1, m.x2); y1 = Math.max(y1, m.y1, m.y2); });
  const fondo: FondoGas = { tipo: 'melamina', ancho: Math.max(1, x1), largo: Math.max(1, y1), muros: f.muros, muebles };
  const sugeridos: Aparato[] = [];
  const cocina = muebles.find(m => !m.alto && /cocina|isla/i.test(m.etiqueta || ''));
  if (cocina) {
    // Pegado a la pared detrás del mueble (la "espalda" del aparato va contra la pared).
    const a = (cocina.rot * Math.PI) / 180, nx = -Math.sin(a), ny = Math.cos(a);
    const atras = cocina.d / 2 + 0.075, dLav = 0.25 + 0.095;
    sugeridos.push({ id: 'lav_mel', tipo: 'lavadero_cocina', x: Math.round((cocina.x - nx * atras + nx * dLav) * 1000) / 1000, y: Math.round((cocina.y - ny * atras + ny * dLav) * 1000) / 1000, rot: cocina.rot, nombre: 'Lavadero (cocina)' });
  }
  return { fondo, sugeridos, texto: f.texto };
}
