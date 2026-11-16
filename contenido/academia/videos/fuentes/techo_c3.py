"""Techos a Dos y Cuatro Aguas · Clase 3: El tijeral a dos aguas."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 3'
E = []

E.append(dict(antes=0.5, frases=[
  'Diez metros de luz, sin una sola columna al medio.',
  'Lo que lo hace posible es el tijeral. Pero hay varios tipos, y no todos sirven igual para un techo a dos aguas.',
  'Hoy aprendes a elegir el tijeral, a darle altura suficiente, y a ubicar sus nudos donde van las correas. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('10 m sin columnas', '¿qué tijeral uso?', 3, 'EL TIJERAL', soldando=False,
              extra_html=svg(tijeral(1100, 1760, 620, 170, 'howe', en=0, mas=0.6, n=8)))))

E.append(obra(2, [
  'Ya sabes calcular la pendiente: el taller tiene cumbrera a un metro veinticinco y faldones de cinco quince.',
  'Hoy: el tijeral que va a cargar ese techo.',
], 'Hoy: <span class="nar">el tijeral a dos aguas</span>'))

E.append(dict(frases=[
  'Recuerda lo que viste en el curso de Estructuras: un tijeral está hecho de triángulos, con cordón superior, cordón inferior, montantes y diagonales.',
  'En el tijeral a dos aguas, el cordón superior sigue la pendiente del techo, y el cordón inferior va recto, de apoyo a apoyo.',
  'Ese cordón inferior funciona como un tirante: impide que los dos faldones se abran y empujen los muros hacia afuera.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 60)], html=titulo('El tijeral <span class="nar">triangular</span>', top=100) + svg(
  tijeral(460, 1460, 720, 250, 'howe', en=0, n=8) +
  '<text class="ap" data-en="1" x="640" y="560" fill="#f97316" font-size="30" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle" transform="rotate(-27 640 560)">cordón superior</text>'
  '<text class="ap" data-en="1" x="960" y="780" fill="#5ec4ff" font-size="30" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">cordón inferior = tirante</text>'
  '<path class="ap" data-en="2" d="M420 720 L330 720" stroke="#ff6b6b" stroke-width="8"/><path class="ap" data-en="2" d="M1500 720 L1590 720" stroke="#ff6b6b" stroke-width="8"/>'
  '<text class="ap" data-en="2" x="330" y="690" fill="#ff6b6b" font-size="28" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke">no empuja</text>')))

E.append(dict(frases=[
  'Para dos aguas se usan sobre todo cuatro tipos, los mismos que encuentras en el módulo de techos de InnovApp.',
  'El Fink, en forma de W: pocas barras, liviano. Muy usado en luces cortas y medianas con buena pendiente.',
  'El Howe y el Pratt, con montantes y diagonales. Sirven para luces mayores. En el Pratt, las diagonales bajan hacia el centro y trabajan estiradas.',
  'Y el Warren, en zigzag, sin montantes. Cuál conviene en cada obra lo confirma el cálculo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.03, 50, 50)], html=titulo('Cuatro tipos <span class="nar">para dos aguas</span>', top=90) + svg(
  tijeral(200, 860, 450, 170, 'fink', en=1, n=6) + '<text class="ap" data-en="1" x="530" y="500" fill="#fff" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">Fink</text>' +
  tijeral(1060, 1720, 450, 170, 'howe', en=2, n=8) + '<text class="ap" data-en="2" x="1390" y="500" fill="#fff" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">Howe</text>' +
  tijeral(200, 860, 760, 170, 'pratt', en=2, mas=0.6, n=8) + '<text class="ap" data-en="2" x="530" y="810" fill="#fff" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">Pratt</text>' +
  tijeral(1060, 1720, 760, 170, 'warren', en=3, n=8) + '<text class="ap" data-en="3" x="1390" y="810" fill="#fff" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">Warren</text>')))

E.append(dict(frases=[
  'Ahora, la altura. En el curso de Estructuras viste una regla para empezar: el peralte, entre la luz entre quince y la luz entre diez.',
  'En un tijeral triangular, la altura al centro es la altura de la cumbrera. En el taller: un metro veinticinco, más que la luz entre diez. Bien.',
  'Pero con una pendiente baja, por ejemplo diez por ciento, la cumbrera queda en cincuenta centímetros: el tijeral queda muy plano y sus barras salen pesadas.',
  'La solución: darle altura también en el apoyo, con un montante extremo, o talón. El tijeral queda con forma de trapecio y recupera su altura.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('La altura <span class="nar">del tijeral</span>', top=100) + svg(
  tijeral(260, 900, 600, 32, 'pratt', en=2, n=8) + '<text class="ap" data-en="2" x="580" y="660" fill="#ff6b6b" font-size="30" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">10 %: muy plano ✕</text>' +
  f'<g class="ap" data-en="3"><line x1="1060" y1="600" x2="1700" y2="600" stroke="{COL["inf"]}" stroke-width="10"/>'
  f'<line x1="1060" y1="600" x2="1060" y2="520" stroke="{COL["mon"]}" stroke-width="8"/><line x1="1700" y1="600" x2="1700" y2="520" stroke="{COL["mon"]}" stroke-width="8"/>'
  f'<line x1="1060" y1="520" x2="1380" y2="488" stroke="{COL["sup"]}" stroke-width="10"/><line x1="1380" y1="488" x2="1700" y2="520" stroke="{COL["sup"]}" stroke-width="10"/>'
  + ''.join(f'<line x1="{1060+80*i}" y1="600" x2="{1060+80*i}" y2="{520 - 32*min(i,8-i)/4:.0f}" stroke="{COL["mon"]}" stroke-width="5"/><line x1="{1060+80*i}" y1="{520 - 32*min(i,8-i)/4:.0f}" x2="{1060+80*(i+1) if i < 4 else 1060+80*(i-1)}" y2="600" stroke="{COL["dia"]}" stroke-width="5"/>' for i in range(1, 8)) +
  '<text x="1380" y="660" fill="#7ee08a" font-size="30" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">con talón ✓</text></g>') +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:560px;right:560px;top:220px;text-align:center;font-size:34px;font-weight:900">altura ≈ <span class="nar">luz ÷ 15 a luz ÷ 10</span></div>'))

E.append(dict(frases=[
  'La regla de los nudos también la viste en Estructuras: las correas se apoyan sobre los nudos del cordón superior, nunca entre nudos.',
  'Entonces, el paso entre nudos del tijeral lo decide la separación de las correas, y esa la decide la cobertura.',
  'Si la ficha de tu plancha permite correas hasta, digamos, un metro treinta, divide el faldón: cinco quince entre uno treinta, tres coma nueve. Redondeas a cuatro paneles por faldón.',
  'Cuatro paneles de un metro veintinueve, medido sobre el faldón. En total, ocho paneles en el tijeral.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Nudos <span class="nar">= correas</span>', top=100) + svg(
  tijeral(460, 1460, 720, 250, 'pratt', en=0, n=8) +
  ''.join(f'<rect class="pop" data-en="1" data-mas="{0.15*k}" x="{x-16:.0f}" y="{y-26:.0f}" width="32" height="22" fill="#c9d6e3"/>' for k, (x, y) in enumerate(
      [(460 + 125*i, 720 - 62.5*i) for i in range(0, 5)] + [(1460 - 125*i, 720 - 62.5*i) for i in range(0, 4)])) +
  '<text class="ap" data-en="3" x="650" y="560" fill="#ffd166" font-size="30" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle" transform="rotate(-27 650 560)">4 × 1.29 m</text>') +
  badge('5.15 ÷ 1.30 = 3.9 → 4 PANELES', 2, 640, 240, '#f97316', '÷')))

E.append(dict(frases=[
  '¿Con qué perfiles? En techos de talleres y casas se usan mucho los tubos cuadrados y rectangulares, y también ángulos dobles.',
  'Usa los nombres y medidas del catálogo de perfiles de InnovApp, que trae su peso por metro para el metrado.',
  'Los perfiles exactos de cada barra los fija el cálculo, por ejemplo con la memoria de cálculo según la norma E.090. Aquí aprendes a armar la geometría correcta para que ese cálculo se cumpla en obra.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">perfiles</span>', top=100) + tarjetas([
  ('⬛', 'Tubo cuadrado', 'Cordones, montantes<br>y diagonales'), ('▬', 'Tubo rectangular', 'Cordones con<br>más carga'), ('📐', 'Ángulos dobles', 'Tijerales<br>empernados')],
  lambda i: 0 if i < 2 else 1, top=250, cols=3, alto=300, izq=230) + badge('LOS PERFILES LOS FIJA EL CÁLCULO (E.090)', 2, 560, 640, '#2b7fb3', '🧮')))

E.append(dict(frases=[
  'Falta decidir cada cuánto va un tijeral. En techos como este, lo común es entre tres y cinco metros. Mientras más separados, más fuertes deben ser las correas.',
  'El taller mide dieciséis metros. Con tijerales cada cuatro metros: cuatro paños, y cinco tijerales.',
  'Resumen: tijeral Pratt de diez metros, con ocho paneles, cumbrera a un metro veinticinco, cinco tijerales cada cuatro metros.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">el taller</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'],
  [['Tipo', 'luz 10 m, pendiente 25 %', 'Pratt'], ['Paneles', '4 por faldón', '8 de 1.29 m'], ['Altura al centro', '≥ 10 ÷ 10 = 1.00 m', '1.25 m ✓'],
   ['Separación', 'entre 3 y 5 m', '4 m'], ['N.º de tijerales', '16 ÷ 4 = 4 paños + 1', '5']],
  lambda i: [2, 2, 2, 0, 1][i], top=230, izq=280, der=280, tam=31, nota='Ejemplo de predimensionamiento: el diseño final lo verifica el cálculo.')))

E.append(dict(frases=[
  'Los cinco errores con el tijeral.',
  'Uno: poner correas entre nudos.',
  'Dos: un tijeral muy plano, sin talón.',
  'Tres: un paso entre nudos distinto a la separación de correas.',
  'Cuatro: tijerales muy separados con correas débiles.',
  'Y cinco: dejar los tijerales sin arriostrar, como viste en Naves y en Estructuras.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con el tijeral</span>', [
  ('Correas entre nudos', 'Doblan el cordón.'), ('Tijeral muy plano', 'Barras pesadas: usa talón.'), ('Nudos ≠ correas', 'Todo se descuadra.'),
  ('Muy separados', 'Correas que se doblan.'), ('Sin arriostre', 'Se voltean con el viento.')])))

E.append(dict(frases=[
  'Tu reto: la casa tiene faldones de cuatro metros dieciocho, y la plancha permite correas hasta un metro veinte. ¿Cuántos paneles por faldón, y de qué largo?',
  'En la próxima clase: el trazo y armado del tijeral en el taller.',
], html=reto('🧮 Faldón de 4.18 m · correas hasta 1.20 m:<br><b class="nar">n.º de paneles por faldón y su largo</b>', 'TRAZO Y ARMADO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el tijeral se diseña desde las correas, y las correas desde la cobertura.',
  '¡Nos vemos en la clase cuatro!',
], html=final('El tijeral se diseña <span class="nar">desde arriba</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c3')
