// Símbolos eléctricos en planta (estilo de los planos de instalaciones en Perú).
// Coordenadas locales centradas, en unidades de `s` (tamaño del símbolo en metros);
// la pared queda hacia -y local (el símbolo gira con el punto).
import type { TipoPunto } from './modeloElectricidad';

const LETRA: Partial<Record<TipoPunto, string>> = {
  int_simple: 'S', int_doble: 'S²', int_triple: 'S³', int_conmutador: 'S₃', sensor: 'SM',
  terma: 'TE', ducha_electrica: 'DU', cocina_electrica: 'CE', aire: 'AA', cerco: 'CC', tv: 'TV', datos: 'D',
};

export function SimboloElectrico({ tipo, s = 0.3, color = '#0f172a', sw = 0.012, rot = 0 }: { tipo: TipoPunto; s?: number; color?: string; sw?: number; rot?: number }) {
  const r = s / 2, k = { stroke: color, strokeWidth: sw, fill: '#ffffff' } as const;
  // El texto no gira con el símbolo (se lee siempre derecho).
  const txt = (t: string, size = 0.42, y = 0.15, fill = color) => <text x={0} y={s * y} fontSize={s * size} fontWeight={900} textAnchor="middle" fill={fill} stroke="none" transform={rot ? `rotate(${-rot})` : undefined}>{t}</text>;
  switch (tipo) {
    case 'luz_techo': return <g><circle r={r * 0.8} {...k} /><path d={`M${-r * 0.56} ${-r * 0.56}L${r * 0.56} ${r * 0.56}M${r * 0.56} ${-r * 0.56}L${-r * 0.56} ${r * 0.56}`} stroke={color} strokeWidth={sw} /></g>;
    case 'aplique': return <g><path d={`M${-r * 0.8} ${-r * 0.5}A${r * 0.8} ${r * 0.8} 0 0 0 ${r * 0.8} ${-r * 0.5}Z`} {...k} /><path d={`M${-r * 0.4} ${-r * 0.5}L${r * 0.4} ${r * 0.15}M${r * 0.4} ${-r * 0.5}L${-r * 0.4} ${r * 0.15}`} stroke={color} strokeWidth={sw} /><line x1={-r} x2={r} y1={-r * 0.5} y2={-r * 0.5} stroke={color} strokeWidth={sw * 1.6} /></g>;
    case 'empotrado': return <g><rect x={-r * 0.8} y={-r * 0.8} width={r * 1.6} height={r * 1.6} {...k} /><rect x={-r * 0.5} y={-r * 0.5} width={r} height={r} fill={color} opacity={0.18} /><path d={`M${-r * 0.8} ${-r * 0.8}L${r * 0.8} ${r * 0.8}M${r * 0.8} ${-r * 0.8}L${-r * 0.8} ${r * 0.8}`} stroke={color} strokeWidth={sw * 0.8} /></g>;
    case 'tira_led': return <g><rect x={-r * 1.5} y={-r * 0.32} width={r * 3} height={r * 0.64} rx={r * 0.2} {...k} />{[-1, -0.5, 0, 0.5, 1].map(i => <circle key={i} cx={r * i * 1.15} cy={0} r={r * 0.12} fill={color} />)}</g>;
    case 'reflector': return <g><path d={`M${-r * 0.35} ${-r * 0.55}L${r * 0.35} ${-r * 0.55}L${r * 0.8} ${r * 0.55}L${-r * 0.8} ${r * 0.55}Z`} {...k} /><path d={`M${-r * 0.5} ${r * 0.75}L${-r * 0.75} ${r * 1.05}M0 ${r * 0.8}L0 ${r * 1.1}M${r * 0.5} ${r * 0.75}L${r * 0.75} ${r * 1.05}`} stroke={color} strokeWidth={sw} /></g>;
    case 'sensor': return <g><circle r={r * 0.8} {...k} strokeDasharray={`${sw * 2} ${sw * 1.5}`} />{txt('SM', 0.36, 0.13)}</g>;
    case 'int_simple': case 'int_doble': case 'int_triple': case 'int_conmutador':
      return <g><circle r={r * 0.62} {...k} />{txt(LETRA[tipo]!, tipo === 'int_simple' ? 0.6 : 0.5, 0.2)}</g>;
    case 'timbre': return <g><path d={`M${-r * 0.7} ${r * 0.35}A${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.7} ${r * 0.35}Z`} {...k} /><line x1={-r * 0.85} x2={r * 0.85} y1={r * 0.35} y2={r * 0.35} stroke={color} strokeWidth={sw * 1.5} /><circle cy={r * 0.6} r={r * 0.14} fill={color} /></g>;
    case 'toma_doble': case 'toma_cocina': case 'toma_lavadora': {
      const t = tipo === 'toma_cocina' ? 'M' : tipo === 'toma_lavadora' ? 'L' : 'T';
      return <g><circle r={r * 0.7} {...k} /><path d={`M${-r * 0.7} 0A${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.7} 0Z`} fill={color} opacity={0.9} transform={`rotate(180)`} /><line x1={-r * 0.25} x2={-r * 0.25} y1={-r * 0.45} y2={-r * 0.1} stroke={color} strokeWidth={sw * 1.4} /><line x1={r * 0.25} x2={r * 0.25} y1={-r * 0.45} y2={-r * 0.1} stroke={color} strokeWidth={sw * 1.4} />{txt(t, 0.34, 0.3, '#ffffff')}</g>;
    }
    case 'terma': case 'ducha_electrica': case 'cocina_electrica': case 'aire': case 'cerco':
      return <g><rect x={-r * 0.8} y={-r * 0.8} width={r * 1.6} height={r * 1.6} rx={r * 0.12} {...k} /><path d={`M${-r * 0.8} ${r * 0.8}L${r * 0.8} ${-r * 0.8}L${r * 0.8} ${r * 0.8}Z`} fill={color} opacity={0.22} />{txt(LETRA[tipo]!, 0.5, 0.17)}</g>;
    case 'tv': case 'datos': return <g><path d={`M0 ${-r * 0.8}L${r * 0.82} ${r * 0.62}L${-r * 0.82} ${r * 0.62}Z`} {...k} />{txt(LETRA[tipo]!, tipo === 'tv' ? 0.36 : 0.46, 0.4)}</g>;
    case 'tablero': return <g><rect x={-r * 1.2} y={-r * 0.55} width={r * 2.4} height={r * 1.1} {...k} strokeWidth={sw * 1.5} /><path d={`M${-r * 1.2} ${r * 0.55}L${r * 1.2} ${-r * 0.55}L${r * 1.2} ${r * 0.55}Z`} fill={color} />{txt('TD', 0.44, -0.02, color)}</g>;
    case 'medidor': return <g><rect x={-r * 0.85} y={-r * 0.85} width={r * 1.7} height={r * 1.7} {...k} /><circle r={r * 0.55} {...k} />{txt('kWh', 0.3, 0.1)}</g>;
    case 'pozo_tierra': return <g><circle r={r * 0.9} {...k} /><path d={`M0 ${-r * 0.6}L0 ${-r * 0.05}M${-r * 0.55} ${-r * 0.05}L${r * 0.55} ${-r * 0.05}M${-r * 0.36} ${r * 0.2}L${r * 0.36} ${r * 0.2}M${-r * 0.17} ${r * 0.45}L${r * 0.17} ${r * 0.45}`} stroke={color} strokeWidth={sw * 1.5} strokeLinecap="round" /></g>;
  }
  return null;
}

/** Ícono para la paleta y los resúmenes (SVG cuadrado). */
export function IconoPunto({ tipo, className = 'w-8 h-8', color = '#0f172a' }: { tipo: TipoPunto; className?: string; color?: string }) {
  const ancho = tipo === 'tira_led' || tipo === 'tablero' ? 0.52 : 0.4;
  return (
    <svg viewBox={`${-ancho / 2} -0.2 ${ancho} 0.4`} className={className} style={{ fontFamily: 'system-ui' }}>
      <SimboloElectrico tipo={tipo} s={tipo === 'tira_led' || tipo === 'tablero' ? 0.32 : 0.34} color={color} sw={0.014} />
    </svg>
  );
}
