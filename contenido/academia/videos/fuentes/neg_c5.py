"""El Negocio del Metalero · Clase 5: Precio y negociación."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 5'
E = []

E.append(dict(antes=0.5, frases=[
  '"Está caro, maestro. ¿No me deja en menos?"',
  'Si bajas sin pensar, el que pierde eres tú. Un diez por ciento de descuento puede llevarse más de la mitad de tu ganancia.',
  'Hoy aprendes a poner el precio con números y a negociar sin regalar tu trabajo. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('"Está caro, maestro"', '¿y ahora qué dices?', 5, 'PRECIO', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🤝</div>')))

E.append(obra(4, [
  'Ya tienes la cotización con tres opciones.',
  'Hoy: cómo poner el precio y cómo negociarlo.',
], 'Hoy: <span class="nar">precio y negociación</span>'))

E.append(dict(frases=[
  'Primero, el costo total de la opción estándar de la cochera.',
  'Materiales, tres mil. Consumibles, cuatrocientos. Transporte, trescientos. Tus cuarenta horas de taller, mil trescientos sesenta. Y el ayudante, trescientos.',
  'Costo total: cinco mil trescientos sesenta soles. Recuerda que tus costos fijos y tu sueldo ya van dentro de tu hora.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El <span class="nar">costo total</span>', top=100) + tabla(
  ['Partida', 'S/'], [['Materiales', '3 000'], ['Consumibles', '400'], ['Transporte', '300'], ['Tu taller (40 h × 34)', '1 360'], ['Ayudante', '300'], ['<b class="nar">Costo total</b>', '<b class="nar">5 360</b>']],
  lambda i: [1, 1, 1, 1, 1, 2][i], top=230, izq=480, der=480, tam=31)))

E.append(dict(frases=[
  'Ahora, la trampa más común. Muchos dicen "le sumo un veinte por ciento al costo" y creen que ganan el veinte por ciento.',
  'Cinco mil trescientos sesenta más veinte por ciento: seis mil cuatrocientos treinta y dos. Pero la ganancia, mil setenta y dos, es solo el dieciséis coma siete por ciento del precio.',
  'Si de verdad quieres que te quede el veinte por ciento del precio, divide el costo entre cero ochenta: seis mil setecientos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Sumar 20 % <span class="nar">no es ganar 20 %</span>', top=100) + tabla(
  ['Forma', 'Cálculo', 'Precio', 'Te queda del precio'],
  [['Sumar 20 % al costo', '5 360 × 1.20', '6 432', '16.7 %'], ['Margen real de 20 %', '5 360 ÷ 0.80', '6 700', '<b class="nar">20 %</b>']],
  lambda i: i + 1, top=290, izq=260, der=260, tam=32) +
  '<div class="tarjeta pop" data-en="2" style="position:absolute;left:520px;right:520px;top:520px;text-align:center;font-size:38px;font-weight:900">precio = <span class="nar">costo ÷ (1 − margen)</span></div>'))

E.append(dict(frases=[
  '¿Cuánto margen poner? Depende del riesgo de la obra, del cliente y de tu mercado. Por ejemplo, entre quince y veinticinco por ciento.',
  'En la cochera cotizaste seis mil quinientos. Tu ganancia: seis mil quinientos menos cinco mil trescientos sesenta, mil ciento cuarenta. Un diecisiete coma cinco por ciento del precio.',
  'Más riesgo, más margen: obras en altura, plazos muy cortos o clientes difíciles.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('¿Cuánto <span class="nar">margen</span>?', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'], [['Precio estándar', '', '6 500'], ['Ganancia', '6 500 − 5 360', '1 140'], ['Margen', '1 140 ÷ 6 500', '17.5 %']],
  lambda i: 1, top=280, izq=360, der=360, tam=34) + badge('MÁS RIESGO = MÁS MARGEN', 2, 760, 530, '#2b7fb3', '⚠️')))

E.append(dict(frases=[
  'Ahora mira lo que hace un descuento. Si das diez por ciento, bajas seiscientos cincuenta soles.',
  'Pero tu costo no baja. Tu ganancia pasa de mil ciento cuarenta a cuatrocientos noventa.',
  'Con un diez por ciento de descuento, perdiste el cincuenta y siete por ciento de tu ganancia. Por eso el descuento se piensa dos veces.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El descuento <span class="nar">duele</span>', top=100) + barras(
  [('Ganancia sin descuento', 1140, '#7ee08a'), ('Con 10 % de descuento', 490, '#ff6b6b')],
  lambda i: i, x0=560, base=680, ancho=800, escala=0.32) + badge('− 57 % DE TU GANANCIA', 2, 1250, 330, '#c0392b', '!')))

E.append(dict(frases=[
  'Cuando te digan "está caro", no bajes de inmediato. Pregunta: "¿comparado con qué? ¿qué incluye la otra cotización?". Muchas veces no incluye lo mismo.',
  'Explica el valor: tus materiales, la garantía, el plazo, tus trabajos anteriores.',
  'Y si el presupuesto no alcanza, negocia el alcance, no el precio: ofrece la opción básica, otra cobertura, o que el cliente se encargue de la pintura final.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Cuando dicen <span class="nar">"está caro"</span>', top=100) + lista([
  ('❓', 'Pregunta: <b class="nar">¿comparado con qué?</b>'), ('💎', 'Explica el <b class="nar">valor</b>: materiales, garantía, plazo'),
  ('✂️', 'Negocia el <b class="nar">alcance</b>, no el precio')],
  lambda i: i, top=290, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'Si das algo, pide algo a cambio.',
  'Un pequeño descuento solo por pago completo por adelantado, por un adelanto mayor, o a cambio de permiso para tomar fotos de la obra y una recomendación.',
  'Y conoce tu límite: nunca bajes de tu costo más un margen mínimo. Debajo de eso, es mejor decir que no con amabilidad.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Si das, <span class="nar">pides</span>', top=100) + tarjetas([
  ('💵', 'Pago completo', 'Descuento pequeño<br>por pagar todo'), ('📸', 'Fotos y recomendación', 'Para tus redes'), ('🛑', 'Tu límite', 'Costo + margen<br>mínimo')],
  lambda i: [1, 1, 2][i], top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  'Los cinco errores con el precio.',
  'Uno: creer que sumar veinte por ciento es ganar veinte por ciento.',
  'Dos: dar descuento a la primera.',
  'Tres: bajar el precio sin cambiar el alcance.',
  'Cuatro: dar sin pedir nada a cambio.',
  'Y cinco: aceptar obras por debajo de tu costo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con el precio</span>', [
  ('Sumar ≠ ganar', 'Margen menor al que crees.'), ('Descuento a la primera', 'Se va tu ganancia.'), ('Mismo alcance, menos precio', 'Regalas trabajo.'),
  ('Dar sin pedir', 'Pierdes la ocasión.'), ('Bajo tu costo', 'Trabajas para perder.')])))

E.append(dict(frases=[
  'Tu reto: una obra con un costo total de cuatro mil doscientos soles. Calcula el precio para un margen real de veinte por ciento. Y luego, cuánto ganas si das un cinco por ciento de descuento sobre ese precio.',
  'En la próxima clase: el acuerdo y el adelanto.',
], html=reto('🧮 Costo S/ 4 200 · margen real 20 %:<br><b class="nar">precio, y ganancia con 5 % de descuento</b>', 'ACUERDO Y ADELANTO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: precio con números, y negocia el alcance, no tu ganancia.',
  '¡Nos vemos en la clase seis!',
], html=final('Defiende <span class="nar">tu precio</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c5')
