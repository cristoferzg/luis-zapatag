"""Carpintería Metálica · Clase 4: Portones batientes y corredizos."""
from sold_comun import *
from carp_c1 import ETAPAS_CARP, OBRA

CURSO = 'CARPINTERÍA METÁLICA · CLASE 4'
E = []

E.append(dict(antes=0.5, frases=[
  'Cada mañana, el dueño de casa tiene que levantar el portón para poder abrirlo...',
  '...porque se arrastra en el piso. O peor: el corredizo se sale del riel y casi le cae encima.',
  'Hoy aprendes a fabricar portones que abren suave y seguros. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Se arrastra', 'cada mañana', 4, 'EL PORTÓN', soldando=False) + '''
<svg class="ap" data-en="0" style="position:absolute;left:1080px;top:300px" width="720" height="460" viewBox="0 0 720 460">
 <rect x="40" y="60" width="600" height="320" fill="#7d8f9f" stroke="#9aa6b0" stroke-width="12" transform="rotate(2 40 380)"/>
 <line x1="0" y1="400" x2="720" y2="400" stroke="#56687a" stroke-width="12"/>
 <path d="M60 396 q20 -14 40 0 q20 -14 40 0 q20 -14 40 0" stroke="#ff6b6b" stroke-width="6" fill="none"/>
 <text x="360" y="450" fill="#ff6b6b" font-size="34" font-weight="900" text-anchor="middle">se arrastra</text></svg>'''))

E.append(escena_obra(3, [
  'Nuestra casa tiene una cochera con un vano de tres metros de ancho por dos veinte de alto.',
  'Primero hay que decidir: ¿portón batiente, o corredizo?',
], 'Hoy: <span class="nar">el portón de la cochera</span>', ETAPAS_CARP, OBRA))

E.append(dict(frases=[
  'El batiente abre como una puerta, en una o dos hojas. Es más simple y más barato. Pero necesita espacio libre para girar: un radio igual al ancho de cada hoja.',
  'El corredizo se desliza a un costado, sobre un riel. No ocupa espacio hacia adentro, pero necesita muro libre al costado: el ancho del portón, más unos diez a veinte centímetros.',
  'La pregunta clave en la obra: ¿dónde hay espacio? ¿Adentro, o al costado?',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Batiente <span class="nar">o corredizo</span>?', top=110) + '''
<svg style="position:absolute;left:200px;top:250px" width="1520" height="520" viewBox="0 0 1520 520">
 <g class="ap" data-en="0"><line x1="60" y1="420" x2="660" y2="420" stroke="#56687a" stroke-width="16"/>
  <line x1="60" y1="420" x2="60" y2="120" stroke="#f97316" stroke-width="12"/><line x1="660" y1="420" x2="660" y2="120" stroke="#f97316" stroke-width="12"/>
  <path d="M60 120 A300 300 0 0 1 360 420" fill="none" stroke="#ffd166" stroke-width="4" stroke-dasharray="12 8"/><path d="M660 120 A300 300 0 0 0 360 420" fill="none" stroke="#ffd166" stroke-width="4" stroke-dasharray="12 8"/>
  <text x="360" y="490" fill="#fff" font-size="32" font-weight="900" text-anchor="middle">Batiente: espacio para girar</text></g>
 <g class="ap" data-en="1"><line x1="820" y1="420" x2="1460" y2="420" stroke="#56687a" stroke-width="16"/>
  <rect x="820" y="400" width="320" height="22" fill="#f97316"/><line x1="1140" y1="440" x2="1460" y2="440" stroke="#5cc8ff" stroke-width="6"/>
  <text x="1300" y="380" fill="#5cc8ff" font-size="28" font-weight="900" text-anchor="middle">muro libre al costado</text>
  <text x="1140" y="490" fill="#fff" font-size="32" font-weight="900" text-anchor="middle">Corredizo: espacio al costado</text></g>
</svg>'''))

E.append(dict(frases=[
  'Si es batiente: los postes o columnas donde se cuelga tienen que ser firmes. Tubo de cuatro por cuatro, anclado al concreto, o una columna de concreto con platinas embebidas.',
  'Bisagras pesadas, tipo barril, con pin grueso. Tres por hoja si la hoja es grande.',
  'En la hoja que no se usa a diario, un pasador al piso, con su agujero en el concreto. Un tope al centro. Y cada hoja con su diagonal, como vimos en la puerta.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">batiente</span>', top=110) + tarjetas([
  ('🏛️', 'Postes firmes', 'Tubo 4"×4" anclado o columna con platinas'), ('🔩', 'Bisagras pesadas', 'Tipo barril · 3 por hoja si es grande'), ('⬇️', 'Pasador y tope', 'Pasador al piso · tope central'), ('↗️', 'Diagonal', 'En cada hoja, contra el descuelgue')],
  lambda i: [0, 1, 2, 2][i])))

E.append(dict(frases=[
  'Si es corredizo: abajo, un riel en el piso: ángulo invertido o riel en V, bien nivelado y anclado.',
  'Ruedas en V, con rodaje, que calcen en el riel. Su capacidad debe sobrar: por lo menos el doble de lo que les toca cargar.',
  'Arriba, una guía con rodillos, para que el portón no se incline ni se caiga. Esto no es opcional: un portón corredizo sin guía superior puede caer sobre alguien.',
  'Y topes en los dos extremos, para que la hoja no se salga del riel.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 40)], html=titulo('El <span class="nar">corredizo</span>', top=110) + '''
<svg style="position:absolute;left:380px;top:240px" width="1160" height="560" viewBox="0 0 1160 560">
 <rect x="80" y="110" width="760" height="360" fill="#7d8f9f" stroke="#9aa6b0" stroke-width="12"/>
 <g class="ap" data-en="0"><line x1="20" y1="520" x2="1140" y2="520" stroke="#ffd166" stroke-width="10"/><text x="1000" y="510" fill="#ffd166" font-size="26" font-weight="900">riel</text></g>
 <g class="ap" data-en="1"><circle cx="190" cy="495" r="26" fill="#1d2731" stroke="#c9d6e3" stroke-width="5"/><circle cx="730" cy="495" r="26" fill="#1d2731" stroke="#c9d6e3" stroke-width="5"/></g>
 <g class="ap" data-en="2"><rect x="20" y="40" width="1120" height="16" fill="#5cc8ff"/><circle cx="300" cy="80" r="16" fill="#5cc8ff"/><circle cx="620" cy="80" r="16" fill="#5cc8ff"/><text x="1000" y="34" fill="#5cc8ff" font-size="26" font-weight="900">guía superior</text></g>
 <g class="ap" data-en="3"><rect x="20" y="440" width="22" height="80" fill="#ff6b6b"/><rect x="1118" y="440" width="22" height="80" fill="#ff6b6b"/></g>
</svg>''' + badge('SIN GUÍA SUPERIOR, PUEDE CAER', 2, 680, 830, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Nuestra cochera: vano de tres metros. Elegimos corredizo, porque adentro estacionan el carro y no hay espacio para que gire una hoja.',
  'La hoja: tres metros diez, para cubrir cinco centímetros por lado. Necesitamos unos tres metros veinte de muro libre al costado.',
  'Bastidor en tubo de dos pulgadas por dos milímetros, con dos travesaños: unos diecisiete metros, unos cincuenta kilos. Plancha de uno punto cinco: casi siete metros cuadrados, unos ochenta kilos.',
  'Total, unos ciento treinta kilos. En dos ruedas, unos sesenta y cinco kilos por rueda. Elegimos ruedas de por lo menos ciento cincuenta kilos de capacidad cada una.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">la cochera</span>', top=110) + tabla(
  ['Dato', 'Valor'], [['Vano', '3.00 × 2.20 m'], ['Hoja corrediza', '3.10 m de ancho'], ['Muro libre al costado', '≈ 3.20 m'], ['Bastidor tubo 2" × 2 mm', '≈ 16.8 m × 2.98 = 50 kg'], ['Plancha 1.5 mm', '6.82 m² × 11.8 = 80 kg'], ['Ruedas (2)', '≈ 65 kg c/u → elige ≥ 150 kg']],
  lambda i: [0, 1, 1, 2, 2, 3][i], top=240, izq=300, der=300, tam=29)))

E.append(dict(frases=[
  'Los cinco errores del portón.',
  'Uno: un batiente donde no hay espacio para girar.',
  'Dos: postes débiles, que se inclinan con el peso de la hoja.',
  'Tres: un corredizo sin guía superior.',
  'Cuatro: riel desnivelado o mal anclado.',
  'Y cinco: ruedas justas para el peso. Se rompen en meses.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">del portón</span>', [
  ('Batiente sin espacio', 'Choca con el carro o el piso.'), ('Postes débiles', 'Se inclinan y la hoja se arrastra.'), ('Corredizo sin guía', 'Peligro: puede caer.'),
  ('Riel desnivelado', 'Se traba o se sale.'), ('Ruedas justas', 'Se rompen pronto.')])))

E.append(dict(frases=[
  'Tu reto: para un portón corredizo de dos ochenta de vano, calcula el ancho de la hoja, el muro libre que necesitas, y el peso con bastidor de dos pulgadas y plancha de uno punto cinco.',
  'En la próxima clase: rejas y barandas para la casa. Diseño, separación de barrotes y anclaje al muro.',
], html=reto('🧮 Corredizo para vano de 2.80 m:<br><b class="nar">ancho de hoja · muro libre · peso</b>', 'REJAS Y BARANDAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: un portón se abre todos los días. Hazlo para que abra suave, y seguro, durante años.',
  '¡Nos vemos en la clase cinco!',
], html=final('Abre suave, <span class="nar">cierra seguro</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c4')
