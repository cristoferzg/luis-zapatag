"""Techos a Dos y Cuatro Aguas · Clase 2: La pendiente."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 2'
E = []

def triangulo(en, x, y, w, h, et_w, et_h, et_ang='', mas=0):
    return (f'<g class="ap" data-en="{en}" data-mas="{mas}"><polygon points="{x},{y} {x+w},{y} {x+w},{y-h}" fill="rgba(249,115,22,.15)" stroke="#f97316" stroke-width="6"/>'
            f'<text x="{x+w/2}" y="{y+46}" fill="#5ec4ff" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">{et_w}</text>'
            f'<text x="{x+w+20}" y="{y-h/2+10}" fill="#ffd166" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke">{et_h}</text>'
            f'<text x="{x+200}" y="{y-10}" fill="#fff" font-size="28" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke">{et_ang}</text></g>')

E.append(dict(antes=0.5, frases=[
  'El cliente pide un techo con "diez de pendiente". ¿Diez por ciento, o diez grados?',
  'No es lo mismo: diez grados son casi dieciocho por ciento. Si te equivocas, el techo sale más bajo o más alto de lo que pensabas, y la cobertura puede filtrar.',
  'Hoy dominas la pendiente: cómo leerla, cuánta pide cada cobertura, y cómo sacar la altura y el largo de cada faldón. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('¿10 % o 10°?', 'no es lo mismo', 2, 'LA PENDIENTE', soldando=False,
              extra_html=svg(triangulo(0, 1150, 650, 520, 92, '', '', '', 0.5)))))

E.append(obra(1, [
  'Ya conoces los tipos de techo y sus partes.',
  'Hoy: la pendiente. Con ella sacamos la altura de la cumbrera y el largo real de los faldones del taller.',
], 'Hoy: <span class="nar">la pendiente</span>'))

E.append(dict(frases=[
  'La pendiente en porcentaje dice cuántos centímetros sube el techo por cada metro que avanza en horizontal.',
  'Veinticinco por ciento: por cada metro horizontal, sube veinticinco centímetros.',
  'Fíjate que se mide en horizontal, como en el plano, no a lo largo de la plancha inclinada.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('La pendiente <span class="nar">en porcentaje</span>', top=100) + svg(
  triangulo(1, 560, 700, 800, 200, '1.00 m horizontal', '0.25 m', '25 %')) + badge('SE MIDE EN HORIZONTAL', 2, 760, 230, '#2b7fb3', '↔')))

E.append(dict(frases=[
  'Y los grados son el ángulo del faldón con la horizontal. Esta tabla te salva en obra.',
  'Diez por ciento son cinco coma siete grados. Veinticinco por ciento, catorce grados. Treinta por ciento, dieciséis coma siete.',
  'Y ojo: cien por ciento no es un techo vertical. Son cuarenta y cinco grados, porque sube un metro por cada metro.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 60)], html=titulo('Porcentaje <span class="nar">y grados</span>', top=100) + tabla(
  ['Pendiente', 'Grados', 'Sube por metro'],
  [['10 %', '5.7°', '10 cm'], ['15 %', '8.5°', '15 cm'], ['20 %', '11.3°', '20 cm'], ['25 %', '14.0°', '25 cm'], ['30 %', '16.7°', '30 cm'], ['50 %', '26.6°', '50 cm'], ['100 %', '45.0°', '1 m']],
  lambda i: [1, 1, 1, 1, 1, 2, 2][i], top=220, izq=420, der=420, tam=30)))

E.append(dict(frases=[
  '¿Cuánta pendiente le doy? La pide la cobertura, y el dato exacto está en la ficha del fabricante.',
  'Como referencia, la plancha trapezoidal tipo TR4 suele trabajar bien desde un diez por ciento, y conviene más si el faldón es largo, porque el agua se acumula.',
  'Las tejas, en general, piden bastante más: sobre veinticinco o treinta por ciento, según el producto.',
  'Y un techo "plano" de plancha no existe: siempre necesita una pendiente mínima para que el agua corra.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Cuánta <span class="nar">pendiente</span>?', top=100) + tarjetas([
  ('📄', 'Manda la ficha', 'Pendiente mínima<br>del fabricante'), ('🟧', 'Plancha TR4', 'Referencia: desde ≈ 10 %<br>más si el faldón es largo'), ('🧱', 'Tejas', 'En general<br>sobre 25 – 30 %')],
  lambda i: i, top=260, cols=3, alto=330, izq=230)))

E.append(dict(frases=[
  'Ahora, la altura de la cumbrera. En un techo a dos aguas, cada faldón cubre la mitad de la luz.',
  'Altura igual a la mitad de la luz por la pendiente.',
  'En nuestro taller de diez metros con veinticinco por ciento: cinco por cero veinticinco, un metro veinticinco. Esa es la altura de la cumbrera sobre los apoyos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('Altura <span class="nar">de la cumbrera</span>', top=100) + svg(
  tijeral(460, 1460, 680, 250, 'howe', en=0, n=8) +
  '<line class="ap" data-en="2" x1="960" y1="680" x2="960" y2="430" stroke="#ffd166" stroke-width="8" stroke-dasharray="14 8"/>'
  '<text class="ap" data-en="2" x="985" y="560" fill="#ffd166" font-size="34" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke">1.25 m</text>'
  '<text class="ap" data-en="0" x="710" y="740" fill="#5ec4ff" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">5 m</text>') +
  '<div class="tarjeta pop" data-en="1" style="position:absolute;left:560px;right:560px;top:220px;text-align:center;font-size:36px;font-weight:900">h = <span class="nar">(luz ÷ 2) × pendiente</span></div>'))

E.append(dict(frases=[
  'Y el largo real del faldón, el que necesitas para cortar el cordón superior y pedir las planchas.',
  'Es la hipotenusa del triángulo: raíz de cinco al cuadrado más uno veinticinco al cuadrado. Cinco metros quince.',
  'Más rápido: multiplica el largo horizontal por el factor de inclinación. Para veinticinco por ciento, el factor es uno coma cero tres uno.',
  'Cinco por uno coma cero tres uno: cinco quince. Guarda esta tabla: la usaremos en todo el curso.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El largo <span class="nar">del faldón</span>', top=100) + svg(
  triangulo(0, 330, 640, 640, 160, '5.00 m', '1.25 m', '') +
  '<text class="ap" data-en="1" x="600" y="520" fill="#7ee08a" font-size="34" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle" transform="rotate(-14 600 520)">5.15 m</text>') + tabla(
  ['Pendiente', 'Factor'], [['10 %', '1.005'], ['15 %', '1.011'], ['20 %', '1.020'], ['25 %', '1.031'], ['30 %', '1.044'], ['40 %', '1.077'], ['50 %', '1.118']],
  lambda i: 2, top=230, izq=1180, der=200, tam=28)))

E.append(dict(frases=[
  'Un dato más para el taller: el ángulo del corte.',
  'En la cumbrera, los dos cordones superiores se encuentran. Cada uno se corta vertical, y para eso la sierra se gira el mismo ángulo de la pendiente: catorce grados.',
  'En el apoyo pasa lo mismo, donde el cordón superior llega al inferior.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 45)], html=titulo('El ángulo <span class="nar">del corte</span>', top=100) + svg(
  tijeral(560, 1360, 660, 200, 'howe', en=0, n=8, solo='sup') + tijeral(560, 1360, 660, 200, 'howe', en=0, n=8, solo='inf') +
  '<line class="ap" data-en="1" x1="960" y1="400" x2="960" y2="520" stroke="#ff6b6b" stroke-width="6" stroke-dasharray="10 8"/>'
  '<text class="ap" data-en="1" x="985" y="440" fill="#ff6b6b" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke">corte vertical</text>') +
  badge('SIERRA A 14°', 1, 820, 250, '#f97316', '⟋')))

E.append(dict(frases=[
  'Resumen del taller: pendiente de veinticinco por ciento, que es catorce grados.',
  'Cumbrera a un metro veinticinco sobre los apoyos. Faldón de cinco metros quince, sin contar el alero, que sumamos en la clase seis.',
  'Y los cortes en la cumbrera y en el apoyo, a catorce grados.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">el taller</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'],
  [['Pendiente', '25 %', '14.0°'], ['Altura de cumbrera', '5 × 0.25', '1.25 m'], ['Largo del faldón', '5 × 1.031', '5.15 m'], ['Ángulo de corte', '= ángulo de la pendiente', '14°']],
  lambda i: [0, 1, 1, 2][i], top=250, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Los cinco errores con la pendiente.',
  'Uno: confundir porcentaje con grados.',
  'Dos: dar menos pendiente de la que pide la cobertura.',
  'Tres: pedir planchas con el largo horizontal del plano, en vez del largo inclinado.',
  'Cuatro: hacer un techo plano de plancha.',
  'Y cinco: olvidar el alero en el largo del faldón.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con la pendiente</span>', [
  ('% con grados', '10° son casi 18 %.'), ('Menos que la mínima', 'La cobertura filtra.'), ('Largo horizontal', 'Planchas cortas.'),
  ('Techo plano de plancha', 'El agua no corre.'), ('Sin el alero', 'Faldón incompleto.')])))

E.append(dict(frases=[
  'Tu reto: la casa tiene ocho metros de luz y treinta por ciento de pendiente. Calcula la altura de la cumbrera, el largo del faldón y el ángulo.',
  'En la próxima clase: el tijeral a dos aguas. Cómo elegirlo y dónde poner sus nudos.',
], html=reto('🧮 Luz 8 m · pendiente 30 %:<br><b class="nar">altura de cumbrera, largo del faldón y ángulo</b>', 'EL TIJERAL A DOS AGUAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la pendiente se mide en horizontal, y el faldón se corta inclinado.',
  '¡Nos vemos en la clase tres!',
], html=final('Pendiente bien calculada, <span class="nar">techo sin goteras</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c2')
