"""Techos a Dos y Cuatro Aguas · Clase 4: Trazo y armado del tijeral."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 4'
E = []
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

E.append(dict(antes=0.5, frases=[
  'Cinco tijerales para el mismo techo... y al montarlos, ninguno es igual al otro. Las correas no asientan y la cumbrera sale torcida.',
  'El problema no fue la soldadura: fue el trazo.',
  'Hoy aprendes a trazar el tijeral a tamaño real y a armarlos todos idénticos. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Cinco tijerales', 'y ninguno igual', 4, 'TRAZO Y ARMADO', soldando=False,
              extra_html=svg(tijeral(1100, 1760, 560, 160, 'pratt', en=0, n=8) + tijeral(1110, 1750, 600, 150, 'pratt', en=0, mas=0.8, n=8, grosor=0.6)))))

E.append(obra(3, [
  'Ya elegiste el tijeral del taller: Pratt, de diez metros, con ocho paneles y cumbrera a un metro veinticinco.',
  'Hoy: el trazo en el piso y el armado en serie.',
], 'Hoy: <span class="nar">trazo y armado</span>'))

E.append(dict(frases=[
  'El tijeral se traza a tamaño real, uno a uno, sobre una superficie plana: una losa de concreto nivelada y limpia, o un tablero grande.',
  'Si el piso tiene desniveles, el tijeral sale alabeado, y eso ya no se corrige después.',
  'Herramientas: wincha, tiralíneas con tiza, escuadra, nivel, y marcador para el acero.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Dónde <span class="nar">trazar</span>?', top=100) + tarjetas([
  ('🟫', 'Piso plano', 'Losa nivelada<br>o tablero'), ('📏', 'Wincha y tiralíneas', 'Trazo a<br>tamaño real'), ('📐', 'Escuadra y nivel', 'Ángulos<br>exactos')],
  lambda i: 0 if i == 0 else 2, top=260, cols=3, alto=300, izq=230) + badge('PISO DESNIVELADO = TIJERAL ALABEADO', 1, 560, 640, '#c0392b', '!')))

A, B, C, D = (460, 700), (1460, 700), (960, 700), (960, 450)
E.append(dict(frases=[
  'Paso uno: traza la línea del cordón inferior, de diez metros. Marca sus extremos, A y B, y el centro, C.',
  'Paso dos: en C, levanta una perpendicular exacta.',
  'Paso tres: sobre ella marca la cumbrera, D, a un metro veinticinco.',
  'Paso cuatro: une A con D y D con B. Esos son los cordones superiores.',
], zoom=[(0, 1.0, 50, 50), (3, 1.03, 50, 55)], html=titulo('El trazo <span class="nar">paso a paso</span>', top=100) + svg(
  f'<g class="ap" data-en="0"><line x1="{A[0]}" y1="{A[1]}" x2="{B[0]}" y2="{B[1]}" stroke="#5ec4ff" stroke-width="8"/>'
  f'<text x="{A[0]-30}" y="{A[1]+50}" fill="#fff" font-size="36" {T}>A</text><text x="{B[0]+10}" y="{B[1]+50}" fill="#fff" font-size="36" {T}>B</text><text x="{C[0]-12}" y="{C[1]+50}" fill="#fff" font-size="36" {T}>C</text></g>'
  f'<line class="ap" data-en="1" x1="{C[0]}" y1="{C[1]}" x2="{D[0]}" y2="{D[1]-40}" stroke="#ffd166" stroke-width="6" stroke-dasharray="12 8"/>'
  f'<g class="pop" data-en="2"><circle cx="{D[0]}" cy="{D[1]}" r="12" fill="#ffd166"/><text x="{D[0]+20}" y="{D[1]-10}" fill="#ffd166" font-size="36" {T}>D</text>'
  f'<text x="{D[0]+20}" y="{(C[1]+D[1])/2+10}" fill="#ffd166" font-size="30" {T}>1.25 m</text></g>'
  f'<g class="ap" data-en="3"><line x1="{A[0]}" y1="{A[1]}" x2="{D[0]}" y2="{D[1]}" stroke="#f97316" stroke-width="9"/><line x1="{D[0]}" y1="{D[1]}" x2="{B[0]}" y2="{B[1]}" stroke="#f97316" stroke-width="9"/></g>')))

E.append(dict(frases=[
  'Para levantar la perpendicular en obra, usa el tres cuatro cinco.',
  'Desde C, mide tres metros sobre la línea. Desde C, en la dirección perpendicular, mide cuatro.',
  'Si la distancia entre esos dos puntos es exactamente cinco metros, el ángulo es recto. Si no, mueve el segundo punto hasta que dé cinco.',
  'Para espacios chicos, usa la misma proporción: sesenta, ochenta y cien centímetros.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La escuadra <span class="nar">3 – 4 – 5</span>', top=100) + svg(
  f'<g class="ap" data-en="1"><line x1="760" y1="720" x2="1160" y2="720" stroke="#5ec4ff" stroke-width="8"/><text x="960" y="770" fill="#5ec4ff" font-size="36" {T} text-anchor="middle">3 m</text>'
  f'<line x1="760" y1="720" x2="760" y2="340" stroke="#ffd166" stroke-width="8"/><text x="720" y="540" fill="#ffd166" font-size="36" {T} text-anchor="end">4 m</text></g>'
  f'<g class="ap" data-en="2"><line x1="760" y1="340" x2="1160" y2="720" stroke="#7ee08a" stroke-width="8"/><text x="1000" y="510" fill="#7ee08a" font-size="36" {T}>5 m = 90° ✓</text></g>'
  '<rect class="pop" data-en="2" x="760" y="680" width="40" height="40" fill="none" stroke="#fff" stroke-width="4"/>') +
  badge('60 – 80 – 100 cm', 3, 1250, 300, '#2b7fb3', '📐')))

E.append(dict(frases=[
  'Antes de seguir, comprueba. Mide de A a D, y de D a B.',
  'Los dos deben medir lo mismo: cinco metros quince, el largo del faldón que calculaste.',
  'Si uno sale más largo, la cumbrera está corrida hacia un lado. Corrige ahora, porque este trazo será el molde de todos los tijerales.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 50)], html=titulo('Comprueba <span class="nar">las diagonales</span>', top=100) + svg(
  f'<g class="ap" data-en="0"><line x1="{A[0]}" y1="{A[1]}" x2="{B[0]}" y2="{B[1]}" stroke="#5ec4ff" stroke-width="8"/>'
  f'<line x1="{A[0]}" y1="{A[1]}" x2="{D[0]}" y2="{D[1]}" stroke="#f97316" stroke-width="9"/><line x1="{D[0]}" y1="{D[1]}" x2="{B[0]}" y2="{B[1]}" stroke="#f97316" stroke-width="9"/></g>'
  f'<text class="ap" data-en="1" x="690" y="545" fill="#7ee08a" font-size="34" {T} text-anchor="middle">5.15 m</text>'
  f'<text class="ap" data-en="1" x="1230" y="545" fill="#7ee08a" font-size="34" {T} text-anchor="middle">5.15 m</text>') +
  badge('AD = DB', 1, 870, 250, '#3f9e5a', '=')))

E.append(dict(frases=[
  'Ahora, los nudos. Divide la mitad del cordón inferior, de A a C, en cuatro partes iguales de un metro veinticinco.',
  'Desde cada marca, levanta una vertical hasta el cordón superior: esos son los montantes. Y donde tocan el cordón superior, quedan los nudos de las correas.',
  'Luego une cada nudo superior con el nudo inferior siguiente, hacia el centro: esas son las diagonales del Pratt.',
], zoom=[(0, 1.0, 50, 50), (2, 1.03, 50, 55)], html=titulo('Marca <span class="nar">los nudos</span>', top=100) + svg(
  tijeral(A[0], B[0], 700, 250, 'pratt', en=0, n=8, solo='sup') + tijeral(A[0], B[0], 700, 250, 'pratt', en=0, n=8, solo='inf') +
  ''.join(f'<circle class="pop" data-en="0" data-mas="{0.2*i}" cx="{A[0]+125*i}" cy="700" r="10" fill="#fff"/>' for i in range(1, 5)) +
  ''.join(f'<line class="ap" data-en="1" data-mas="{0.2*i}" x1="{A[0]+125*i}" y1="700" x2="{A[0]+125*i}" y2="{700-62.5*i}" stroke="#ffd166" stroke-width="7"/>' for i in range(1, 5)) +
  ''.join(f'<line class="ap" data-en="1" data-mas="{0.2*i}" x1="{B[0]-125*i}" y1="700" x2="{B[0]-125*i}" y2="{700-62.5*i}" stroke="#ffd166" stroke-width="7"/>' for i in range(1, 4)) +
  ''.join(f'<line class="ap" data-en="2" data-mas="{0.2*i}" x1="{A[0]+125*i}" y1="{700-62.5*i}" x2="{A[0]+125*(i+1)}" y2="700" stroke="#7ee08a" stroke-width="7"/>' for i in range(1, 4)) +
  ''.join(f'<line class="ap" data-en="2" data-mas="{0.2*i}" x1="{B[0]-125*i}" y1="{700-62.5*i}" x2="{B[0]-125*(i+1)}" y2="700" stroke="#7ee08a" stroke-width="7"/>' for i in range(1, 4)) +
  f'<text class="ap" data-en="0" x="{A[0]+62}" y="750" fill="#5ec4ff" font-size="28" {T} text-anchor="middle">1.25</text>')))

E.append(dict(frases=[
  'Con el trazo, saca la lista de cortes de un tijeral.',
  'Los montantes miden el largo horizontal hasta el centro por la pendiente: treinta y uno, sesenta y tres y noventa y cuatro centímetros, a cada lado, y el central, un metro veinticinco.',
  'Las diagonales, por Pitágoras: uno veintinueve, uno cuarenta y uno cincuenta y seis, a cada lado.',
  'En total, cerca de treinta y cuatro metros de tubo por tijeral, sin contar el alero.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Lista <span class="nar">de cortes</span>', top=90) + tabla(
  ['Pieza', 'Medida', 'Cant.', 'Total'],
  [['Cordón superior', '5.15 m', '2', '10.31 m'], ['Cordón inferior', '10.00 m (2 × 5.00)', '1', '10.00 m'], ['Montantes', '0.31 · 0.63 · 0.94 m', '2 c/u', '3.75 m'],
   ['Montante central', '1.25 m', '1', '1.25 m'], ['Diagonales', '1.29 · 1.40 · 1.56 m', '2 c/u', '8.50 m'], ['<b class="nar">Total por tijeral</b>', '', '', '<b class="nar">≈ 33.8 m</b>']],
  lambda i: [0, 0, 1, 1, 2, 3][i], top=210, izq=230, der=230, tam=29, nota='Medidas a ejes. Descuenta en los extremos el espesor de los tubos donde se apoyan.')))

E.append(dict(frases=[
  'Para que los cinco tijerales salgan iguales, arma un gálibo: sobre el trazo, suelda o fija topes, retazos de ángulo, por fuera de los cordones y en cada nudo.',
  'El primer tijeral se puntea dentro del gálibo, se revisan sus medidas y diagonales, y recién se suelda.',
  'Para soldar sin torcerlo, primero puntea todo; luego suelda alternando lados, del centro hacia los extremos, y voltéalo para la otra cara. Es lo que viste con los nudos del arco en el curso de Soldadura.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El gálibo: <span class="nar">todos iguales</span>', top=100) + svg(
  tijeral(A[0], B[0], 700, 250, 'pratt', en=0, n=8) +
  ''.join(f'<rect class="pop" data-en="0" data-mas="{0.1*k}" x="{x-12:.0f}" y="{y-12:.0f}" width="24" height="24" fill="#ff6b6b"/>' for k, (x, y) in enumerate(
      [(A[0]+125*i, 724) for i in range(0, 9)] + [(A[0]+125*i, 700-62.5*min(i, 8-i)-26) for i in range(0, 9)]))) +
  badge('PUNTEA → REVISA → SUELDA', 1, 640, 230, '#f97316', '✓')))

E.append(dict(frases=[
  'Un detalle: el cordón inferior mide diez metros, y el tubo viene en barras de seis. Hay que empalmar.',
  'El empalme va en un nudo, por ejemplo en el centro, donde llega el montante central. Nunca a media barra entre dos nudos.',
  'Y con soldadura completa en todo el contorno, más la plancha de empalme si el cálculo la pide.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Empalme <span class="nar">del cordón</span>', top=100) + svg(
  tijeral(A[0], B[0], 700, 250, 'pratt', en=0, n=8) +
  '<g class="pop" data-en="1"><circle cx="960" cy="700" r="34" fill="none" stroke="#7ee08a" stroke-width="7"/>'
  f'<text x="960" y="790" fill="#7ee08a" font-size="32" {T} text-anchor="middle">empalme en el nudo ✓</text></g>'
  '<g class="pop" data-en="1" data-mas="0.8"><circle cx="1085" cy="700" r="28" fill="none" stroke="#ff6b6b" stroke-width="6"/>'
  f'<text x="1170" y="740" fill="#ff6b6b" font-size="28" {T}>entre nudos ✕</text></g>')))

E.append(dict(frases=[
  'Los cinco errores al trazar y armar.',
  'Uno: trazar sobre un piso desnivelado.',
  'Dos: no comprobar que las dos diagonales midan igual.',
  'Tres: armar cada tijeral a ojo, sin gálibo.',
  'Cuatro: soldar todo de un lado y torcer el tijeral.',
  'Y cinco: empalmar el cordón entre nudos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al trazar y armar</span>', [
  ('Piso desnivelado', 'Tijeral alabeado.'), ('Sin comprobar diagonales', 'Cumbrera corrida.'), ('Sin gálibo', 'Tijerales distintos.'),
  ('Soldar de un lado', 'Se tuerce.'), ('Empalme entre nudos', 'Punto débil.')])))

E.append(dict(frases=[
  'Tu reto: la casa tiene ocho metros de luz, treinta por ciento de pendiente y cuatro paneles por faldón. Calcula la altura de cada montante y el total de montantes de un tijeral.',
  'En la próxima clase: los apoyos. Dónde y cómo se apoya el tijeral.',
], html=reto('🧮 Luz 8 m · 30 % · 4 paneles por faldón:<br><b class="nar">altura de cada montante y total</b>', 'LOS APOYOS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: un buen trazo y un gálibo hacen tijerales idénticos.',
  '¡Nos vemos en la clase cinco!',
], html=final('Trazo exacto, <span class="nar">tijerales idénticos</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c4')
