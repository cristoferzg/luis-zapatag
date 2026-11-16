"""Techos a Dos y Cuatro Aguas · Clase 7: El techo a cuatro aguas."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 7'
E = []
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'
# planta de la casa: techo 9 × 13 m → escala 50 px/m
X, Y, ESC = 635, 300, 50
W, H = 13 * ESC, 9 * ESC

E.append(dict(antes=0.5, frases=[
  'El cliente quiere su casa con techo a cuatro aguas. Se ve elegante y protege las cuatro fachadas.',
  'Pero aparecen piezas nuevas: limatesas, medios tijerales, correas cortadas en ángulo. Si la geometría no cierra, la cumbrera sale torcida.',
  'Hoy aprendes la geometría del cuatro aguas y cómo se arma su estructura. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Cuatro aguas', 'cuatro veces más cortes', 7, 'CUATRO AGUAS', soldando=False,
              extra_html=svg(planta_4aguas(1150, 320, 560, 360, en=0, mas=0.5)))))

E.append(obra(6, [
  'Ya tienes el taller resuelto. Ahora pasamos a la casa de ocho por doce, que con sus aleros cubre nueve por trece metros, con treinta por ciento de pendiente.',
  'Hoy: el techo a cuatro aguas.',
], 'Hoy: <span class="nar">el techo a cuatro aguas</span>'))

E.append(dict(frases=[
  'La regla de oro: si los cuatro faldones tienen la misma pendiente, las limatesas salen a cuarenta y cinco grados en planta, como la bisectriz de cada esquina.',
  'Y entonces la cumbrera mide el largo menos el ancho. En la casa: trece menos nueve, cuatro metros.',
  'Si un faldón tiene distinta pendiente, todo eso se rompe: las limatesas ya no van a cuarenta y cinco y la cumbrera se corre. Por eso, misma pendiente en los cuatro.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 50)], html=titulo('La geometría <span class="nar">en planta</span>', top=90) + svg(
  planta_4aguas(X, Y, W, H, en=0, etiquetas=True, en_et=0) +
  f'<text class="ap" data-en="0" x="{X+W/2}" y="{Y+H+50}" fill="#5ec4ff" font-size="30" {T} text-anchor="middle">13 m</text>'
  f'<text class="ap" data-en="0" x="{X-20}" y="{Y+H/2}" fill="#5ec4ff" font-size="30" {T} text-anchor="end">9 m</text>'
  f'<text class="ap" data-en="1" x="{X+W/2}" y="{Y+H/2+50}" fill="#ffd166" font-size="34" {T} text-anchor="middle">13 − 9 = 4 m</text>'
  f'<path class="ap" data-en="0" d="M{X+70} {Y} A70 70 0 0 1 {X+50} {Y+50}" fill="none" stroke="#fff" stroke-width="4"/>'
  f'<text class="ap" data-en="0" x="{X+80}" y="{Y+60}" fill="#fff" font-size="26" {T}>45°</text>')))

E.append(dict(frases=[
  'La altura de la cumbrera sale igual que en dos aguas: la mitad del ancho por la pendiente.',
  'Sobre los muros: cuatro por cero treinta, un metro veinte. Y medida desde el borde del alero, que está más bajo: cuatro cincuenta por cero treinta, un metro treinta y cinco.',
  'Para la limatesa usaremos esa última, porque la limatesa nace en la esquina del alero.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Altura <span class="nar">de la cumbrera</span>', top=100) + tabla(
  ['Desde', 'Cálculo', 'Altura'], [['Los muros (apoyo)', '4.00 × 0.30', '1.20 m'], ['El borde del alero', '4.50 × 0.30', '1.35 m']],
  lambda i: 1, top=300, izq=330, der=330, tam=36)))

E.append(dict(frases=[
  'Ahora, la limatesa, la pieza estrella del cuatro aguas.',
  'En planta, va de la esquina del alero al extremo de la cumbrera: es la diagonal de un cuadrado de cuatro cincuenta. Cuatro cincuenta por raíz de dos: seis metros treinta y seis.',
  'Y sube un metro treinta y cinco. Su largo real, por Pitágoras: raíz de seis treinta y seis al cuadrado más uno treinta y cinco al cuadrado. Seis metros cincuenta y uno.',
  'Fíjate: la limatesa sube lo mismo que el faldón, pero en más distancia. Su pendiente es menor: veintiuno por ciento, no treinta. Eso importa para la cobertura.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">limatesa</span>', top=100) + svg(
  f'<g class="ap" data-en="1"><rect x="460" y="330" width="320" height="320" fill="rgba(249,115,22,.08)" stroke="#9aa6b0" stroke-width="4"/>'
  f'<line x1="460" y1="650" x2="780" y2="330" stroke="#f97316" stroke-width="9"/><text x="560" y="470" fill="#f97316" font-size="30" {T} text-anchor="middle">6.36 m</text>'
  f'<text x="620" y="700" fill="#5ec4ff" font-size="28" {T} text-anchor="middle">4.50</text><text x="810" y="500" fill="#5ec4ff" font-size="28" {T}>4.50</text>'
  f'<text x="620" y="300" fill="#fff" font-size="28" {T} text-anchor="middle">en planta</text></g>'
  f'<g class="ap" data-en="2"><polygon points="1040,650 1580,650 1580,535" fill="rgba(249,115,22,.15)" stroke="#f97316" stroke-width="6"/>'
  f'<text x="1310" y="700" fill="#5ec4ff" font-size="28" {T} text-anchor="middle">6.36 m</text><text x="1600" y="600" fill="#ffd166" font-size="28" {T}>1.35 m</text>'
  f'<text x="1300" y="570" fill="#7ee08a" font-size="32" {T} text-anchor="middle">6.51 m</text><text x="1310" y="300" fill="#fff" font-size="28" {T} text-anchor="middle">largo real</text></g>') +
  badge('PENDIENTE DE LA LIMATESA ≈ 21 %', 3, 680, 225, '#2b7fb3', '↘')))

E.append(dict(frases=[
  '¿Cómo se arma la estructura? En la zona central, bajo la cumbrera, van tijerales completos, como en dos aguas. Los de los extremos de la cumbrera se llaman tijerales de punta.',
  'Desde cada muro corto llega un medio tijeral, que se apoya en el muro y en la punta de la cumbrera.',
  'Y por cada limatesa va una viga o un tijeral de limatesa, de la esquina a la punta. En ella se apoyan las correas que llegan cortadas en ángulo.',
  'Cómo se une cada pieza y qué perfil lleva lo define el cálculo. Tú cuidas la geometría.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('La <span class="nar">estructura</span>', top=90) + svg(
  planta_4aguas(X, Y, W, H, en=0) +
  ''.join(f'<line class="ap" data-en="0" data-mas="{0.3*k}" x1="{X+W/2+dx}" y1="{Y}" x2="{X+W/2+dx}" y2="{Y+H}" stroke="#5ec4ff" stroke-width="9"/>' for k, dx in enumerate((-100, 0, 100))) +
  f'<line class="ap" data-en="1" x1="{X}" y1="{Y+H/2}" x2="{X+W/2-100}" y2="{Y+H/2}" stroke="#7ee08a" stroke-width="9"/>'
  f'<line class="ap" data-en="1" x1="{X+W}" y1="{Y+H/2}" x2="{X+W/2+100}" y2="{Y+H/2}" stroke="#7ee08a" stroke-width="9"/>'
  f'<text class="ap" data-en="0" x="{X+W/2}" y="{Y-16}" fill="#5ec4ff" font-size="28" {T} text-anchor="middle">tijerales completos</text>'
  f'<text class="ap" data-en="1" x="{X+110}" y="{Y+H/2-14}" fill="#7ee08a" font-size="26" {T} text-anchor="middle">medio tijeral</text>'
  f'<text class="ap" data-en="2" x="{X+W-90}" y="{Y+H-20}" fill="#f97316" font-size="26" {T} text-anchor="middle">tijeral de limatesa</text>')))

E.append(dict(frases=[
  'Las correas corren paralelas al borde de cada faldón.',
  'En los faldones triangulares, cada correa es más corta que la de abajo: al subir, la limatesa se va comiendo los extremos.',
  'En planta, cada fila se acorta dos veces la distancia horizontal que subió. Y sus extremos se cortan a cuarenta y cinco grados en planta, para unirse a la limatesa.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 30, 50)], html=titulo('Las <span class="nar">correas</span>', top=100) + svg(
  planta_4aguas(X, Y, W, H, en=0) +
  ''.join(f'<line class="ap" data-en="1" data-mas="{0.2*k}" x1="{X+d}" y1="{Y+d}" x2="{X+d}" y2="{Y+H-d}" stroke="#c9d6e3" stroke-width="6"/>' for k, d in enumerate((40, 90, 140, 190))) +
  ''.join(f'<line class="ap" data-en="0" data-mas="{0.2*k}" x1="{X+d}" y1="{Y+d}" x2="{X+W-d}" y2="{Y+d}" stroke="#c9d6e3" stroke-width="6"/>' for k, d in enumerate((40, 90, 140, 190)))) +
  badge('CADA FILA: −2 × LO QUE SUBE', 2, 720, 225, '#2b7fb3', '↕')))

E.append(dict(frases=[
  'Resumen de la casa: techo de nueve por trece, con treinta por ciento.',
  'Cumbrera de cuatro metros, a un metro veinte sobre los muros. Cuatro limatesas de seis metros cincuenta y uno: veintiséis metros de limatesa.',
  'Y la limatesa con veintiuno por ciento de pendiente.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">la casa</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'],
  [['Cumbrera', '13 − 9', '4.00 m'], ['Altura sobre muros', '4 × 0.30', '1.20 m'], ['Limatesa (real)', '√(6.36² + 1.35²)', '6.51 m'],
   ['Total de limatesas', '4 × 6.51', '26.0 m'], ['Pendiente de la limatesa', '1.35 ÷ 6.36', '≈ 21 %']],
  lambda i: [1, 1, 1, 1, 2][i], top=230, izq=280, der=280, tam=31)))

E.append(dict(frases=[
  'Los cinco errores en cuatro aguas.',
  'Uno: dar distinta pendiente a los faldones.',
  'Dos: medir la limatesa en planta y cortarla corta.',
  'Tres: olvidar que la limatesa tiene menos pendiente.',
  'Cuatro: correas sueltas en la limatesa, sin unión.',
  'Y cinco: no prever los medios tijerales y los de limatesa en el presupuesto.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en cuatro aguas</span>', [
  ('Pendientes distintas', 'Cumbrera torcida.'), ('Limatesa medida en planta', 'Queda corta.'), ('Olvidar su pendiente', 'Menos que los faldones.'),
  ('Correas sin unión', 'Se sueltan con el viento.'), ('Sin piezas extra', 'Presupuesto corto.')])))

E.append(dict(frases=[
  'Tu reto: una casa cuyo techo cubre diez por catorce metros, con treinta por ciento. Calcula la cumbrera, su altura desde el borde del alero, y el largo real de una limatesa.',
  'En la próxima clase, la última del módulo principal: el metrado y presupuesto del techo.',
], html=reto('🧮 Techo de 10 × 14 m · 30 %:<br><b class="nar">cumbrera, altura y largo real de la limatesa</b>', 'METRADO Y PRESUPUESTO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: misma pendiente en los cuatro faldones, y la limatesa siempre se calcula en tres dimensiones.',
  '¡Nos vemos en la clase ocho!',
], html=final('Cuatro aguas <span class="nar">bien calculadas</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c7')
