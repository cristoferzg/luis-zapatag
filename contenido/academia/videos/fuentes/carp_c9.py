"""Carpintería Metálica · Clase 9: Toldos y techitos de policarbonato."""
from sold_comun import *
from carp_c8 import ETAPAS_CARP_AV

CURSO = 'CARPINTERÍA METÁLICA · CLASE 9'
E = []

def techito(en, x, y, mas=0):
    return f'''<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="620" height="420" viewBox="0 0 620 420">
 <rect x="20" y="40" width="40" height="360" fill="#56687a"/><line x1="60" y1="90" x2="580" y2="150" stroke="#9aa6b0" stroke-width="14"/>
 <line x1="560" y1="150" x2="560" y2="400" stroke="#9aa6b0" stroke-width="14"/><line x1="60" y1="80" x2="590" y2="141" stroke="rgba(92,200,255,.8)" stroke-width="10"/>
 <text x="330" y="70" fill="#7ee08a" font-size="26" font-weight="900" text-anchor="middle">↘ pendiente</text></svg>'''

E.append(dict(antes=0.5, frases=[
  'El techito de la cochera se veía moderno...',
  '...pero a los dos años, el policarbonato estaba amarillo, lleno de moho por dentro, y goteaba en cada tornillo.',
  'Hoy aprendes a hacer toldos y techitos de policarbonato que duren. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Amarillo', 'y con goteras', 9, 'TOLDOS Y TECHITOS', soldando=False) + techito(0, 1150, 300)))

E.append(escena_obra(1, [
  'Seguimos con el módulo avanzado. Techitos de cochera, toldos de patio, marquesinas de entrada: se piden muchísimo.',
  'La estructura es sencilla. Lo difícil es instalar bien el policarbonato.',
], 'Hoy: <span class="nar">toldos y techitos</span>', ETAPAS_CARP_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Hay dos tipos de policarbonato. El alveolar: tiene canales por dentro, como un cartón. Es liviano y aísla. Viene en seis, ocho o diez milímetros.',
  'Y el compacto u ondulado: macizo, más resistente a los golpes.',
  'Los dos traen un lado con protección contra el sol, el lado UV, marcado en el plástico protector. Ese lado va hacia arriba, hacia el sol. Si lo pones al revés, en dos años está amarillo y quebradizo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El <span class="nar">policarbonato</span>', top=110) + tarjetas([
  ('▤', 'Alveolar', 'Canales por dentro · 6, 8 o 10 mm'), ('〰️', 'Compacto u ondulado', 'Macizo, aguanta golpes'), ('☀️', 'Lado UV', 'Siempre hacia el sol')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Con el alveolar, los canales van en el sentido de la pendiente, de arriba hacia abajo. Así, la humedad que entra puede salir.',
  'Los extremos se sellan. Arriba, con cinta de aluminio cerrada. Abajo, con cinta microperforada, que deja salir el agua pero no deja entrar polvo ni bichos.',
  'Y encima de las cintas, un perfil en U que protege el borde.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('Canales <span class="nar">y extremos</span>', top=110) + '''
<svg style="position:absolute;left:560px;top:240px" width="800" height="500" viewBox="0 0 800 500">
 <rect x="100" y="40" width="600" height="400" fill="rgba(92,200,255,.25)" stroke="#5cc8ff" stroke-width="4"/>''' +
 ''.join(f'<line class="ap" data-en="0" x1="{130+k*40}" y1="40" x2="{130+k*40}" y2="440" stroke="#5cc8ff" stroke-width="2"/>' for k in range(14)) + '''
 <rect class="ap" data-en="1" x="100" y="30" width="600" height="18" fill="#c9d6e3"/><text class="ap" data-en="1" x="720" y="45" fill="#c9d6e3" font-size="24" font-weight="900">arriba: cinta cerrada</text>
 <rect class="ap" data-en="1" data-mas="1" x="100" y="432" width="600" height="18" fill="#7ee08a"/><text class="ap" data-en="1" data-mas="1" x="720" y="447" fill="#7ee08a" font-size="24" font-weight="900">abajo: microperforada</text>
 <text class="ap" data-en="0" x="60" y="250" fill="#ffd166" font-size="40" font-weight="900">↓</text>
</svg>'''))

E.append(dict(frases=[
  'La pendiente: por lo menos unos cinco grados, más o menos nueve centímetros por cada metro. Con menos, el agua y el polvo se quedan encima.',
  'La fijación: tornillos autoperforantes con arandela de jebe. El agujero en el policarbonato, más grande que el tornillo, porque el plástico se estira y se encoge mucho con el calor: unos tres milímetros por metro entre el día y la noche.',
  'Y no aprietes de más: la arandela debe sellar, no hundir la plancha.',
  'Las correas, a la distancia que indique el fabricante según el espesor.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Pendiente <span class="nar">y fijación</span>', top=110) + lista([
  ('📐', 'Pendiente ≥ <b>5°</b> (≈ 9 cm por metro)'), ('🔩', 'Autoperforante con <b>arandela de jebe</b>'), ('⭕', 'Agujero <b>más grande</b>: se dilata ≈ 3 mm por metro'), ('✋', 'No aprietes de más · correas según el fabricante')],
  lambda i: i, top=270, izq=300, der=300, tam=31)))

E.append(dict(frases=[
  'La estructura: si va pegada a la casa, se sostiene en el muro con ménsulas ancladas, y adelante con columnas. Tubo cuadrado o rectangular, con correas de tubo.',
  'No olvides la canaleta abajo, con su bajada. Sin canaleta, el agua cae justo en la entrada.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">estructura</span>', top=110) + techito(0, 300, 260) + lista([
  ('🧱', 'Ménsulas <b>ancladas al muro</b>'), ('🏛️', 'Columnas adelante'), ('🟧', 'Tubo cuadrado o rectangular · correas de tubo'), ('🌧️', '<b>Canaleta</b> con bajada')],
  lambda i: [0, 0, 0, 1][i], top=280, izq=980, der=100, tam=29)))

E.append(dict(frases=[
  'Ejemplo: un techito de tres metros de ancho por dos de fondo para la cochera.',
  'Las planchas de alveolar suelen venir de dos metros diez por cinco ochenta. Los canales van a lo largo de los cinco ochenta.',
  'Necesitamos dos tramos de unos dos metros en el sentido de la pendiente, de dos metros diez de ancho cada uno. Sale de una sola plancha, y sobra un tramo para reponer.',
  'Pendiente de nueve centímetros por metro: en dos metros de fondo, la parte de atrás va dieciocho centímetros más alta.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">techito 3 × 2 m</span>', top=110) + lista([
  ('▤', 'Plancha alveolar <b>2.10 × 5.80 m</b> · canales a lo largo'), ('✂️', '2 tramos de <b>≈ 2 m</b> → sale de <b>1 plancha</b>'), ('📐', '9 cm/m × 2 m = atrás <b class="nar">18 cm más alto</b>')],
  lambda i: [0, 2, 3][i], top=290, izq=300, der=300, tam=32)))

E.append(dict(frases=[
  'Los cinco errores con policarbonato.',
  'Uno: el lado UV hacia abajo.',
  'Dos: canales atravesados a la pendiente.',
  'Tres: extremos abiertos. Entra polvo, agua y moho.',
  'Cuatro: tornillos sin holgura ni arandela, y apretados de más.',
  'Y cinco: poca pendiente y sin canaleta.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con policarbonato</span>', [
  ('Lado UV abajo', 'Amarillo y quebradizo.'), ('Canales atravesados', 'El agua queda adentro.'), ('Extremos abiertos', 'Polvo, agua y moho.'),
  ('Tornillos sin holgura', 'Se raja y gotea.'), ('Poca pendiente', 'Se ensucia y empoza.')])))

E.append(dict(frases=[
  'Tu reto: calcula cuántas planchas de dos diez por cinco ochenta necesitas para un toldo de cuatro metros de ancho por dos y medio de fondo, y cuánto más alto va atrás.',
  'En la próxima clase: estanterías y muebles metálicos.',
], html=reto('🧮 Toldo de 4 × 2.5 m con planchas 2.10 × 5.80:<br><b class="nar">¿cuántas planchas? ¿cuánto más alto atrás?</b>', 'ESTANTERÍAS Y MUEBLES')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: lado UV arriba, canales con la pendiente, extremos sellados y tornillos con holgura.',
  '¡Nos vemos en la clase diez!',
], html=final('Bien sellado, <span class="nar">sin goteras</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c9')
