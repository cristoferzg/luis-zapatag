"""Carpintería Metálica · Clase 10: Estanterías y muebles metálicos."""
from sold_comun import *
from carp_c8 import ETAPAS_CARP_AV

CURSO = 'CARPINTERÍA METÁLICA · CLASE 10'
E = []

def estante(en, x, y, inclinado=False, arriostre=False, mas=0):
    t = 'transform="skewX(-10)"' if inclinado else ''
    s = f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="460" height="520" viewBox="0 0 460 520"><g {t}>'
    s += '<rect x="80" y="20" width="16" height="480" fill="#9aa6b0"/><rect x="360" y="20" width="16" height="480" fill="#9aa6b0"/>'
    for k in range(5): s += f'<rect x="80" y="{60+k*100}" width="296" height="14" fill="#f97316"/><rect x="{110+k*12}" y="{30+k*100}" width="90" height="30" fill="#c48a3a"/>'
    if arriostre: s += '<line x1="96" y1="40" x2="360" y2="480" stroke="#7ee08a" stroke-width="5"/><line x1="360" y1="40" x2="96" y2="480" stroke="#7ee08a" stroke-width="5"/>'
    return s + '</g><line x1="20" y1="505" x2="440" y2="505" stroke="#56687a" stroke-width="8"/></svg>'

E.append(dict(antes=0.5, frases=[
  'El cliente llenó la estantería del almacén con trescientos kilos de cajas...',
  '...y una mañana, la encontró inclinada de costado, a punto de caerse sobre el pasillo.',
  'Hoy aprendes a fabricar estanterías y muebles metálicos firmes y seguros. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Se fue', 'de costado', 10, 'ESTANTERÍAS', soldando=False) + estante(0, 1200, 260, inclinado=True)))

E.append(escena_obra(2, [
  'Seguimos con el módulo avanzado. Estanterías para almacenes y tiendas, mesas de trabajo, muebles industriales: trabajos rápidos y que se venden bien.',
  'Pero cargan mucho peso, y si se caen, lastiman.',
], 'Hoy: <span class="nar">estanterías y muebles</span>', ETAPAS_CARP_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Una estantería tiene parantes, los verticales: de ángulo o de tubo.',
  'Repisas: de plancha doblada, o un marco de tubo con tablero encima.',
  'Y lo que casi todos olvidan: arriostres en X, atrás y a los costados. Sin ellos, la estantería se va de lado como un acordeón, igual que vimos en estructuras.',
  'Y el anclaje: toda estantería alta se fija al muro o al piso. Si alguien se trepa o la carga se corre, no se viene encima.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las partes <span class="nar">de la estantería</span>', top=110) + estante(0, 230, 250, arriostre=False) + estante(2, 230, 250, arriostre=True) + lista([
  ('📏', '<b>Parantes</b>: ángulo o tubo'), ('🟧', '<b>Repisas</b>: plancha doblada o marco + tablero'), ('✖️', '<b>Arriostres en X</b> atrás y a los costados'), ('🔩', '<b>Anclada</b> al muro o al piso')],
  lambda i: i, top=280, izq=780, der=120, tam=30)))

E.append(dict(frases=[
  'La repisa de plancha se dobla con pestañas en los bordes, de tres a cuatro centímetros. Esa pestaña es como el peralte de una viga: una plancha plana se comba con poco peso; doblada, aguanta mucho más.',
  'Si la repisa es larga, un refuerzo debajo, al medio.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La repisa: <span class="nar">dobla los bordes</span>', top=110) + '''
<svg style="position:absolute;left:420px;top:290px" width="1080" height="300" viewBox="0 0 1080 300">
 <g class="ap" data-en="0"><path d="M40 100 Q240 170 440 100" stroke="#ff6b6b" stroke-width="10" fill="none"/><text x="240" y="230" fill="#ff6b6b" font-size="28" font-weight="900" text-anchor="middle">plana: se comba</text></g>
 <g class="ap" data-en="0" data-mas="1"><path d="M620 140 V100 H1020 V140" stroke="#7ee08a" stroke-width="10" fill="none"/><text x="820" y="230" fill="#7ee08a" font-size="28" font-weight="900" text-anchor="middle">con pestañas de 3–4 cm</text></g>
</svg>'''))

E.append(dict(frases=[
  'Ejemplo: una estantería de un metro de ancho, cuarenta centímetros de fondo y dos metros de alto, con cinco niveles de cien kilos cada uno. Quinientos kilos en total.',
  'Cuatro parantes de ángulo de una y media pulgada por un octavo: ocho metros, unos quince kilos.',
  'Cinco repisas de plancha de uno punto dos milímetros, dobladas: medio metro cuadrado cada una, unos cinco kilos por repisa.',
  'Arriostres en X atrás y a los costados, y dos anclajes al muro arriba. Y un letrero: cien kilos máximo por nivel.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">estantería de almacén</span>', top=100) + tabla(
  ['Parte', 'Detalle', 'Peso'], [['Parantes', '4 × 2 m de ángulo 1½" × ⅛" (1.83 kg/m)', '≈ 15 kg'], ['Repisas', '5 × 0.5 m² × 1.2 mm × 7.85', '≈ 24 kg'], ['Arriostres', 'En X, atrás y costados', '—'], ['Anclaje y letrero', '2 anclajes al muro · "100 kg por nivel"', '—']],
  lambda i: [0, 1, 2, 3][i], top=240, izq=220, der=220, tam=30)))

E.append(dict(frases=[
  'Y los muebles: mesas industriales, bancas, repisas de pared, bases para equipos. Las mismas reglas: triángulos o arriostres para que no se balanceen, y patas niveladas.',
  'Pero en un mueble, el cliente toca todo. Por eso: sin rebabas, esquinas redondeadas, tubos con tapas, y patas con regatones de jebe para no rayar el piso.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">muebles</span>', top=110) + tarjetas([
  ('🪑', 'Que no se balancee', 'Arriostres y patas niveladas'), ('🪚', 'Sin rebabas', 'Esquinas redondeadas'), ('🧢', 'Tapas en los tubos', 'Y regatones de jebe')],
  lambda i: [0, 1, 1][i], top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Los cinco errores con estanterías y muebles.',
  'Uno: estantería sin arriostres.',
  'Dos: estantería alta sin anclar.',
  'Tres: repisas planas, sin pestañas.',
  'Cuatro: no indicar la carga máxima.',
  'Y cinco: bordes cortantes y tubos abiertos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con estanterías</span>', [
  ('Sin arriostres', 'Se va de costado.'), ('Sin anclar', 'Se puede volcar.'), ('Repisa plana', 'Se comba.'),
  ('Sin carga máxima', 'La sobrecargan.'), ('Bordes cortantes', 'Cortes y reclamos.')])))

E.append(dict(frases=[
  'Tu reto: diseña en papel una estantería de uno veinte por cincuenta por dos metros, con cuatro niveles. Dibuja dónde van los arriostres y los anclajes, y calcula el peso de los parantes.',
  'En la última clase del módulo: cercos perimétricos.',
], html=reto('✏️ Estantería 1.20 × 0.50 × 2.00 m, 4 niveles:<br><b class="nar">arriostres, anclajes y peso de parantes</b>', 'CERCOS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: arriostres, anclaje, repisas dobladas y la carga máxima a la vista.',
  '¡Nos vemos en la clase once!',
], html=final('Firme, anclada <span class="nar">y segura</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c10')
