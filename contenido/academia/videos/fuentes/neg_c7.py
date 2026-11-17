"""El Negocio del Metalero · Clase 7: Cobranza y flujo de caja."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 7'
E = []

E.append(dict(antes=0.5, frases=[
  'Tienes tres obras ganadas y con buena utilidad... pero hoy no tienes plata para comprar el material de la siguiente, ni para pagarle al ayudante.',
  'Ganaste en el papel, pero te faltó caja. Así quiebran muchos talleres que sí tenían trabajo.',
  'Hoy aprendes a manejar el flujo de caja y a cobrar a tiempo. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Ganaste en papel', 'pero no tienes caja', 7, 'COBRANZA', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🪙</div>')))

E.append(obra(6, [
  'El acuerdo de la cochera está firmado, con cincuenta por ciento de adelanto.',
  'Hoy: el flujo de caja de la obra y la cobranza.',
], 'Hoy: <span class="nar">cobranza y flujo de caja</span>'))

E.append(dict(frases=[
  'La ganancia dice cuánto te queda al final de la obra. El flujo de caja dice cuánta plata tienes cada semana.',
  'Puedes tener buena ganancia y quedarte sin efectivo a mitad de obra, si pagas antes de cobrar.',
  'Por eso, en cada obra, ordena semana por semana lo que entra y lo que sale.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Ganancia <span class="nar">≠ caja</span>', top=100) + tarjetas([
  ('📊', 'Ganancia', 'Cuánto te queda<br>al final'), ('💵', 'Flujo de caja', 'Cuánta plata tienes<br>cada semana')],
  lambda i: i, top=270, cols=2, alto=300, izq=420)))

E.append(dict(frases=[
  'La cochera dura tres semanas. Lo que sale: en la primera, materiales y consumibles, tres mil doscientos. En la segunda, quinientos. En la tercera, trescientos.',
  'Con cincuenta y cincuenta, entran tres mil doscientos cincuenta en la primera semana y tres mil doscientos cincuenta en la tercera.',
  'Tu caja acumulada: más cincuenta, menos cuatrocientos cincuenta, y al final, más dos mil quinientos. Casi no pones plata tuya.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Con <span class="nar">adelanto</span>', top=100) + tabla(
  ['Semana', 'Entra', 'Sale', 'Caja acumulada'],
  [['1', '3 250', '3 200', '<b style="color:#7ee08a">+ 50</b>'], ['2', '—', '500', '<b style="color:#ff6b6b">− 450</b>'], ['3', '3 250', '300', '<b style="color:#7ee08a">+ 2 500</b>']],
  lambda i: [1, 2, 2][i], top=290, izq=330, der=330, tam=34, nota='Tus horas no aparecen como salida: se pagan con tu sueldo y los fijos (clase 2).')))

E.append(dict(frases=[
  'Ahora, la misma obra sin adelanto, cobrando todo al final.',
  'En la primera semana tu caja cae a menos tres mil doscientos. En la segunda, a menos tres mil setecientos. Recién en la tercera vuelve a más dos mil quinientos.',
  'La ganancia es la misma, pero tuviste que poner tres mil setecientos soles tuyos. Estabas financiando al cliente.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Sin adelanto: <span class="nar">financias al cliente</span>', top=100) + barras(
  [('Semana 1', -3200, '#ff6b6b'), ('Semana 2', -3700, '#ff6b6b'), ('Semana 3', 2500, '#7ee08a')],
  lambda i: [1, 1, 1][i], x0=460, base=450, ancho=1000, escala=0.06) + badge('TU PLATA: S/ 3 700', 2, 800, 240, '#c0392b', '!')))

E.append(dict(frases=[
  'Tres hábitos para cuidar la caja.',
  'Uno: separa las cuentas. Una cuenta o caja para el taller, y otra para la casa. Del taller te pagas tu sueldo fijo, el que pusiste en la clase dos.',
  'Dos: guarda un fondo de reserva de cada obra, para los meses flojos y para reponer las máquinas.',
  'Y tres: anota cada semana lo que entra y lo que sale. Un cuaderno o una hoja de cálculo bastan.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Cuida <span class="nar">la caja</span>', top=100) + lista([
  ('🏦', '<b class="nar">Separa las cuentas</b>: taller y casa'), ('🐷', '<b class="nar">Fondo de reserva</b> de cada obra'), ('📒', 'Anota <b class="nar">cada semana</b> entradas y salidas')],
  lambda i: i + 1, top=290, izq=360, der=360, tam=35)))

E.append(dict(frases=[
  'La cobranza empieza en el acuerdo: el saldo se paga el día de la entrega. Recuérdalo con amabilidad un día antes.',
  'Por ejemplo: "Buenas tardes, señor Pérez. Mañana a las diez le entregamos la cochera terminada. Le recuerdo el saldo de tres mil novecientos soles. ¡Gracias por su confianza!"',
  'Claro, firme y sin pena. Cobrar lo acordado es parte del trabajo bien hecho.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Cobra <span class="nar">a tiempo</span>', top=100) +
  '<div class="pop" data-en="1" style="position:absolute;left:460px;top:280px;width:1000px;background:#1f8f5f;border-radius:20px;padding:26px 30px;font-size:30px;font-weight:700;line-height:1.45">'
  '"Buenas tardes, Sr. Pérez. Mañana a las 10 le entregamos la cochera terminada. Le recuerdo el saldo de <b>S/ 3 900</b>. ¡Gracias por su confianza!" ✔✔</div>' +
  badge('CLARO, FIRME Y SIN PENA', 2, 780, 600, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Si aun así no te pagan, sube de a pocos.',
  'Primero, un recordatorio amable. Luego, una llamada. Después, un mensaje formal por escrito, con el monto, lo acordado y una fecha límite.',
  'Si el monto lo justifica, busca asesoría legal o una conciliación. Por eso es tan importante tener el acuerdo y los pagos por escrito.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Si no <span class="nar">te pagan</span>', top=100) + tabla(
  ['Paso', 'Qué hacer'], [['1', 'Recordatorio amable'], ['2', 'Llamada'], ['3', 'Mensaje formal: monto, acuerdo y fecha límite'], ['4', 'Asesoría legal o conciliación']],
  lambda i: [1, 1, 1, 2][i], top=280, izq=380, der=380, tam=34)))

E.append(dict(frases=[
  'Los cinco errores con la plata.',
  'Uno: pagar todo antes de cobrar.',
  'Dos: mezclar la plata del taller y de la casa.',
  'Tres: no guardar reserva.',
  'Cuatro: no anotar entradas y salidas.',
  'Y cinco: dar vergüenza cobrar.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con la plata</span>', [
  ('Pagar antes de cobrar', 'Financias al cliente.'), ('Mezclar cuentas', 'No sabes cuánto tienes.'), ('Sin reserva', 'Un mes flojo te tumba.'),
  ('Sin anotar', 'La plata se pierde.'), ('Vergüenza de cobrar', 'Cobrar es parte del trabajo.')])))

E.append(dict(frases=[
  'Tu reto: arma el flujo de caja de tu próxima obra, semana a semana, con lo que entra, lo que sale y la caja acumulada.',
  'En la próxima clase: la entrega, la garantía y la postventa.',
], html=reto('📒 Flujo de caja de tu próxima obra:<br><b class="nar">semana a semana</b>', 'ENTREGA Y GARANTÍA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: sin caja no hay taller. Cobra a tiempo y no financies al cliente.',
  '¡Nos vemos en la clase ocho!',
], html=final('Cuida <span class="nar">tu caja</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c7')
