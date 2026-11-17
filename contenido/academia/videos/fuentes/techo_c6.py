"""Techos a Dos y Cuatro Aguas · Clase 6: Aleros y voladizos."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 6'
E = []
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

E.append(dict(antes=0.5, frases=[
  'Un techo sin alero: la lluvia baja directo por la pared, moja la base del muro, mancha la pintura y entra por las ventanas.',
  'Medio metro de alero bien hecho evita todo eso.',
  'Hoy aprendes a diseñar el alero: cuánto sale, cómo se arma, y cómo cambia las medidas del techo. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Sin alero', 'la pared se moja', 6, 'LOS ALEROS', soldando=False,
              extra_html=svg(casa_2aguas(1180, 1680, 760, 240, 150, en=0, alero=0) +
                             ''.join(f'<line class="ap" data-en="0" data-mas="{0.5+0.1*k}" x1="{1170+8*k}" y1="{530+40*k}" x2="{1166+8*k}" y2="{560+40*k}" stroke="#5ec4ff" stroke-width="5"/>' for k in range(6))))))

E.append(obra(5, [
  'Ya sabes apoyar y anclar el tijeral.',
  'Hoy: los aleros, la parte del techo que sale más allá del muro o de la columna.',
], 'Hoy: <span class="nar">los aleros</span>'))

E.append(dict(frases=[
  'El alero protege los muros y las ventanas de la lluvia y del sol directo, y aleja el agua de la base de la pared.',
  'En casas se usan mucho aleros de unos cincuenta a ochenta centímetros, medidos en horizontal desde el muro. Donde llueve fuerte, más.',
  'Y en el taller, el alero cubre la entrada y protege los portones.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('¿Para qué <span class="nar">el alero</span>?', top=100) + tarjetas([
  ('🌧️', 'Protege muros', 'La lluvia cae<br>lejos de la pared'), ('☀️', 'Da sombra', 'Ventanas<br>más frescas'), ('📏', '≈ 50 a 80 cm', 'En casas, medido<br>en horizontal')],
  lambda i: 0 if i < 2 else 1, top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  'La forma más común en tijerales metálicos: prolongar el cordón superior más allá del apoyo. Así el alero sale en la misma pendiente del techo.',
  'Otra forma: soldar una ménsula, o can, al nudo del apoyo, cuando el cordón superior no se puede alargar.',
  'En los dos casos, la última correa va en la punta del alero, para fijar el borde de las planchas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 30, 50)], html=titulo('Cómo <span class="nar">se arma</span>', top=100) + svg(
  tijeral(620, 1420, 560, 200, 'pratt', en=0, n=8, alero=150) +
  '<rect x="580" y="574" width="80" height="190" fill="#8d99a6" class="ap" data-en="0"/><rect x="1380" y="574" width="80" height="190" fill="#8d99a6" class="ap" data-en="0"/>'
  f'<text class="ap" data-en="0" x="470" y="560" fill="#f97316" font-size="30" {T} text-anchor="middle">cordón prolongado</text>'
  '<rect class="pop" data-en="2" x="452" y="584" width="36" height="24" fill="#c9d6e3"/>'
  f'<text class="ap" data-en="2" x="470" y="660" fill="#c9d6e3" font-size="28" {T} text-anchor="middle">correa de borde</text>')))

E.append(dict(frases=[
  'El alero es la parte del techo que más castiga el viento: lo empuja desde abajo y desde arriba a la vez.',
  'Por eso es lo primero que arranca un ventarrón. Su unión al tijeral debe ser continua y bien soldada, y sus planchas, bien fijadas.',
  'Aleros grandes, de más de un metro, ya no se dejan a ojo: los verifica el cálculo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 40, 55)], html=titulo('El viento <span class="nar">y el alero</span>', top=100) + svg(
  tijeral(620, 1420, 560, 200, 'pratt', en=0, n=8, alero=150) +
  ''.join(f'<path class="pop" data-en="0" data-mas="{0.2*k}" d="M{x} 760 L{x} 670" stroke="#5ec4ff" stroke-width="9" marker-end="url(#fb)"/>' for k, x in enumerate((480, 540))) +
  '<defs><marker id="fb" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="#5ec4ff"/></marker></defs>') +
  badge('MÁS DE 1 m: LO VERIFICA EL CÁLCULO', 2, 640, 240, '#c0392b', '!')))

E.append(dict(frases=[
  'El alero cambia dos medidas del techo.',
  'Uno: el largo del faldón. En el taller, con alero de sesenta centímetros, la proyección horizontal pasa de cinco a cinco sesenta. Por el factor uno coma cero tres uno: cinco metros setenta y siete.',
  'Ese es el largo de la plancha que vas a pedir.',
  'Dos: el alero baja. Con veinticinco por ciento, sesenta centímetros de alero bajan quince centímetros por debajo del apoyo. Revisa que no choque con puertas, portones ni ventanas.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('El alero <span class="nar">cambia las medidas</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'],
  [['Proyección horizontal', '5.00 + 0.60', '5.60 m'], ['Largo del faldón', '5.60 × 1.031', '5.77 m'], ['Cuánto baja el alero', '0.60 × 0.25', '0.15 m']],
  lambda i: [1, 1, 3][i], top=270, izq=300, der=300, tam=34)))

E.append(dict(frases=[
  'El acabado del alero. En la punta va una cenefa, o tapa de borde: una plancha doblada que oculta la correa de borde y da un acabado limpio.',
  'Por debajo, si el cliente lo quiere, se cierra con un cielo raso de alero, que oculta las correas y evita que aniden aves.',
  'Y en el borde se cuelga la canaleta, que recibe el agua del faldón. Cómo dimensionarla y darle pendiente ya lo viste en el curso de Naves.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 30, 55)], html=titulo('Acabado <span class="nar">del alero</span>', top=100) + tarjetas([
  ('▭', 'Cenefa', 'Tapa de borde:<br>oculta la correa'), ('⬜', 'Cielo de alero', 'Cierra por debajo,<br>sin nidos'), ('〰️', 'Canaleta', 'Colgada<br>del borde')],
  lambda i: i, top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  'En la casa, con muros de ocho por doce metros y aleros de cincuenta centímetros en todo el perímetro, el techo cubre nueve por trece metros.',
  'Esa es la planta del techo que usaremos en la clase siete para el cuatro aguas, y en la clase ocho para el metrado.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 50)], html=titulo('En la obra: <span class="nar">la casa</span>', top=100) + svg(
  '<rect class="ap" data-en="0" x="660" y="320" width="600" height="400" fill="none" stroke="#9aa6b0" stroke-width="6" stroke-dasharray="14 10"/>'
  f'<text class="ap" data-en="0" x="960" y="365" fill="#9aa6b0" font-size="30" {T} text-anchor="middle">muros 8 × 12 m</text>' +
  planta_4aguas(635, 295, 650, 450, en=0, mas=0.6) +
  f'<text class="ap" data-en="1" x="960" y="790" fill="#f97316" font-size="34" {T} text-anchor="middle">techo 9 × 13 m (alero 0.50 m)</text>')))

E.append(dict(frases=[
  'Los cinco errores con los aleros.',
  'Uno: unir el alero al tijeral con puntos de soldadura.',
  'Dos: olvidar el alero al calcular el largo de las planchas.',
  'Tres: un alero que baja y choca con el portón o las ventanas.',
  'Cuatro: dejar la correa de borde a la vista, sin cenefa.',
  'Y cinco: aleros de más de un metro sin verificar.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con los aleros</span>', [
  ('Unión con puntos', 'El viento lo arranca.'), ('Sin el alero en el metrado', 'Planchas cortas.'), ('Alero que choca', 'Revisa cuánto baja.'),
  ('Sin cenefa', 'Mal acabado y óxido.'), ('Alero grande sin cálculo', 'Riesgo con el viento.')])))

E.append(dict(frases=[
  'Tu reto: el taller con aleros de ochenta centímetros. Calcula el nuevo largo del faldón, y cuánto baja el alero.',
  'En la próxima clase: el techo a cuatro aguas.',
], html=reto('🧮 Taller · alero de 0.80 m · 25 %:<br><b class="nar">largo del faldón y cuánto baja el alero</b>', 'CUATRO AGUAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el alero protege, pero también suma al metrado y baja.',
  '¡Nos vemos en la clase siete!',
], html=final('Un buen alero <span class="nar">cuida la casa</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c6')
