"""Techos a Dos y Cuatro Aguas · Clase 1: Tipos de techo y sus partes."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 1'
E = []

E.append(dict(antes=0.5, frases=[
  'Un techo mal elegido gotea, se recalienta, o el primer ventarrón se lo lleva.',
  'Y casi siempre el problema empezó antes de soldar la primera pieza: en la forma del techo.',
  'En este curso aprendes a diseñar, fabricar y presupuestar techos metálicos a dos y a cuatro aguas. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Un techo mal elegido', 'gotea o se vuela', 1, 'TIPOS Y PARTES', soldando=False,
              extra_html=svg(casa_2aguas(1150, 1700, 760, 260, 190, en=0, mas=0.6)))))

E.append(obra(0, [
  'En este curso techamos dos obras reales: un taller de diez por dieciséis metros a dos aguas, y una casa de ocho por doce metros a cuatro aguas.',
  'Son ocho clases en el módulo principal, y cuatro en el avanzado. Hoy: los tipos de techo y sus partes.',
], 'Hoy: <span class="nar">tipos de techo y sus partes</span>'))

E.append(dict(frases=[
  'Se llama "agua" a cada plano inclinado del techo, por donde corre la lluvia. También se le dice faldón.',
  'El techo a una agua tiene un solo faldón. Es el más simple, ideal para cocheras, depósitos o un techo pegado a un muro.',
  'El de dos aguas tiene dos faldones que se juntan arriba, en la cumbrera. Es el más usado en talleres, almacenes y casas.',
  'Y el de cuatro aguas tiene un faldón hacia cada lado. Protege las cuatro fachadas y se ve más elegante, pero tiene más piezas y más cortes.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('Una, dos <span class="nar">o cuatro aguas</span>', top=100) + tarjetas([
  ('📐', 'Una agua', 'Un faldón.<br>Simple y económico'), ('🏠', 'Dos aguas', 'Dos faldones y cumbrera.<br>El más usado'), ('🏯', 'Cuatro aguas', 'Protege 4 fachadas.<br>Más cortes')],
  lambda i: i + 1, top=260, cols=3, alto=330, izq=230)))

E.append(dict(frases=[
  'Veamos las partes de un techo a dos aguas.',
  'Arriba, la cumbrera: la línea donde se juntan los dos faldones. Es el punto más alto.',
  'Debajo, los tijerales, que cargan todo. Sobre ellos, las correas, y sobre las correas, la cobertura.',
  'Abajo, el alero: lo que el techo sale más allá del muro. Y en el borde, la canaleta, que recibe el agua.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('Partes de un techo <span class="nar">a dos aguas</span>', top=90) + svg(
  tijeral(560, 1360, 640, 230, 'howe', en=0, n=6, alero=90) +
  ''.join(f'<rect class="pop" data-en="2" data-mas="{0.15*k}" x="{x-14:.0f}" y="{y-22:.0f}" width="28" height="18" fill="#c9d6e3"/>' for k, (x, y) in enumerate(
      [(560 + 400*t, 640 - 230*t) for t in (0.15, 0.4, 0.65, 0.88)] + [(1360 - 400*t, 640 - 230*t) for t in (0.15, 0.4, 0.65, 0.88)])) +
  '<text class="ap" data-en="1" x="960" y="380" fill="#ffd166" font-size="34" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">cumbrera</text>'
  '<text class="ap" data-en="2" x="960" y="700" fill="#5ec4ff" font-size="30" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">tijeral</text>'
  '<text class="ap" data-en="2" x="1300" y="470" fill="#c9d6e3" font-size="28" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke">correas</text>'
  '<text class="ap" data-en="3" x="400" y="760" fill="#f97316" font-size="30" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">alero</text>'
  '<path class="ap" data-en="3" d="M440 690 q0 30 30 30 h40 q30 0 30 -30" fill="none" stroke="#7ee08a" stroke-width="8"/>'
  '<text class="ap" data-en="3" x="490" y="790" fill="#7ee08a" font-size="28" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">canaleta</text>')))

E.append(dict(frases=[
  'El techo a cuatro aguas visto desde arriba, en planta, se ve así.',
  'Al centro, la cumbrera, más corta que el largo de la casa.',
  'Desde cada esquina sube una limatesa: la arista inclinada donde se juntan dos faldones que miran hacia afuera.',
  'Los faldones largos quedan en forma de trapecio, y los cortos, en forma de triángulo. Y cuando dos techos se juntan formando un rincón, aparece la limahoya, que veremos en el módulo avanzado.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('Partes de un techo <span class="nar">a cuatro aguas</span>', top=90) + svg(
  planta_4aguas(560, 260, 800, 480, en=0, etiquetas=True, en_et=1) +
  '<text class="ap" data-en="3" x="960" y="330" fill="#e8edf2" font-size="28" font-weight="800" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">trapecio</text>'
  '<text class="ap" data-en="3" x="640" y="510" fill="#e8edf2" font-size="28" font-weight="800" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">triángulo</text>')))

E.append(dict(frases=[
  '¿Cuál conviene? Depende de cuatro cosas.',
  'La luz: cuanto más ancho, más alto sube un techo a una agua. Pasando unos seis u ocho metros, conviene repartirlo en dos aguas.',
  'Hacia dónde va el agua: nunca descargues la lluvia sobre el terreno o el techo del vecino. A veces eso solo decide la forma.',
  'El clima: con mucha lluvia y viento, los aleros en las cuatro fachadas protegen los muros.',
  'Y el presupuesto: el cuatro aguas lleva más acero en las esquinas, más cortes de plancha y más remates.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55), (4, 1.0, 50, 50)], html=titulo('¿Cuál <span class="nar">conviene</span>?', top=100) + lista([
  ('↔️', '<b class="nar">La luz</b>: techos anchos, mejor a dos aguas'), ('💧', '<b class="nar">El agua</b>: nunca hacia el vecino'),
  ('🌧️', '<b class="nar">El clima</b>: lluvia y viento piden aleros'), ('💰', '<b class="nar">El presupuesto</b>: cuatro aguas cuesta más')],
  lambda i: i + 1, top=250, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'Apliquémoslo a nuestras dos obras.',
  'El taller tiene diez metros de luz y adentro maniobran vehículos: no queremos columnas al medio. Lleva dos aguas, con tijerales que salvan los diez metros.',
  'La casa es de ocho por doce, con muros de ladrillo y ventanas en las cuatro fachadas. Lleva cuatro aguas, con aleros que protegen todo el perímetro.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 30, 50), (2, 1.04, 70, 50)], html=titulo('Nuestras <span class="nar">dos obras</span>', top=100) + svg(
  casa_2aguas(260, 860, 640, 220, 120, en=1, alero=40) +
  '<text class="ap" data-en="1" x="560" y="705" fill="#fff" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">Taller 10 × 16 m · dos aguas</text>' +
  planta_4aguas(1100, 330, 520, 310, en=2) +
  '<text class="ap" data-en="2" x="1360" y="705" fill="#fff" font-size="32" font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke" text-anchor="middle">Casa 8 × 12 m · cuatro aguas</text>')))

E.append(dict(frases=[
  'Los cinco errores al elegir el techo.',
  'Uno: un techo a una agua muy ancho, que termina altísimo de un lado.',
  'Dos: mandar el agua al terreno del vecino.',
  'Tres: elegir cuatro aguas sin presupuestar sus cortes y remates.',
  'Cuatro: olvidar los aleros donde llueve.',
  'Y cinco: dar menos pendiente de la que pide la cobertura. Eso lo resolvemos en la próxima clase.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al elegir el techo</span>', [
  ('Una agua muy ancho', 'Queda altísimo de un lado.'), ('Agua al vecino', 'Problemas y reclamos.'), ('Cuatro aguas sin presupuestar', 'Cortes y remates cuestan.'),
  ('Sin aleros', 'Los muros se mojan.'), ('Poca pendiente', 'La cobertura filtra.')])))

E.append(dict(frases=[
  'Tu reto: dibuja en planta el techo de una casa de diez por catorce metros a cuatro aguas. Marca la cumbrera, las cuatro limatesas y los cuatro faldones.',
  'En la próxima clase: la pendiente. Cómo calcular la altura y el largo de cada faldón.',
], html=reto('✏️ Casa de 10 × 14 m a cuatro aguas:<br><b class="nar">dibuja la planta</b> y marca cumbrera,<br>limatesas y faldones', 'LA PENDIENTE')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la forma del techo se decide por la luz, el agua, el clima y el presupuesto.',
  '¡Nos vemos en la clase dos!',
], html=final('El techo empieza <span class="nar">en la forma</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c1')
