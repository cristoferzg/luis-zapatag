"""El Negocio del Metalero · Clase 6: El acuerdo y el adelanto."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 6'
E = []

E.append(dict(antes=0.5, frases=[
  'Terminaste la obra. Y ahora el cliente dice que eso no era lo que habían hablado, y que no te paga el saldo.',
  'Sin nada escrito, es tu palabra contra la suya.',
  'Hoy aprendes a cerrar cada trabajo con un acuerdo claro y un adelanto. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('"Eso no era lo hablado"', 'y no te paga', 6, 'ACUERDO', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">✍️</div>')))

E.append(obra(5, [
  'El cliente de la cochera aceptó la opción estándar, en seis mil quinientos soles.',
  'Hoy: cómo dejar el acuerdo por escrito y cobrar el adelanto.',
], 'Hoy: <span class="nar">acuerdo y adelanto</span>'))

E.append(dict(frases=[
  'Un acuerdo escrito protege a los dos: el cliente sabe qué recibe, y tú sabes qué y cuándo te pagan.',
  'No tiene que ser complicado. En trabajos pequeños, basta que el cliente responda por escrito: "Acepto la cotización número veinticinco, con adelanto del cincuenta por ciento". Eso ya deja un registro.',
  'En obras más grandes, conviene un acuerdo firmado. Y para montos importantes o casos especiales, consulta con un abogado: esta clase no reemplaza su asesoría.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Siempre <span class="nar">por escrito</span>', top=100) +
  '<div class="pop" data-en="1" style="position:absolute;left:560px;top:290px;width:800px;background:#1f8f5f;border-radius:20px;padding:24px 28px;font-size:32px;font-weight:700">'
  '"Acepto la cotización N.º 025, opción estándar, S/ 6 500, con adelanto del 50 %." ✔✔</div>' +
  badge('MONTOS GRANDES: CONSULTA A UN ABOGADO', 2, 600, 560, '#2b7fb3', '⚖️')))

E.append(dict(frases=[
  'Un acuerdo simple dice ocho cosas.',
  'Quiénes son las partes, con nombre y documento. Qué cotización se acepta, por número. El precio total, y la forma y las fechas de pago.',
  'El plazo de entrega. Cómo se manejan los cambios y adicionales. La garantía.',
  'Y las firmas, o la aceptación escrita de los dos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Qué dice <span class="nar">el acuerdo</span>', top=90) + '<div style="position:absolute;left:300px;right:300px;top:220px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="{e}" data-mas="{0.25*(k%4):.2f}" style="background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.6);border-radius:14px;padding:16px 20px;font-size:28px;font-weight:800">{t}</div>'
          for k, (e, t) in enumerate([(1, '👥 Las partes'), (1, '📄 Cotización N.º'), (1, '💰 Precio total'), (1, '📅 Pagos y fechas'), (2, '⏱️ Plazo'), (2, '🔁 Cambios y adicionales'), (2, '🛡️ Garantía'), (3, '✍️ Firmas')])) + '</div>'))

E.append(dict(frases=[
  'El adelanto. Con él compras los materiales sin poner tu plata, y el cliente se compromete.',
  'Lo común en trabajos como este es un cincuenta por ciento. Y la regla: sin adelanto, no se compra material ni se empieza.',
  'La excepción son empresas serias que pagan con orden de compra y a plazo. Ahí evalúa si puedes financiar esa obra con tu propia caja.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">adelanto</span>', top=100) + tarjetas([
  ('🧱', 'Compra materiales', 'Sin poner<br>tu plata'), ('🤝', 'Compromete', 'Al cliente<br>con la obra'), ('🚫', 'Sin adelanto', 'No se empieza')],
  lambda i: [0, 0, 1][i], top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  'Formas de pago para la cochera de seis mil quinientos.',
  'La simple: cincuenta y cincuenta. Tres mil doscientos cincuenta al firmar, y tres mil doscientos cincuenta a la entrega.',
  'O en tres partes: cincuenta al inicio, cuarenta cuando el portón y el techo están fabricados, y diez a la conformidad. Ese diez por ciento final le da confianza al cliente.',
  'En obras grandes, se cobra por avance: cada semana o quincena, lo que se ejecutó.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Formas <span class="nar">de pago</span>', top=100) + tabla(
  ['Esquema', 'Inicio', 'Intermedio', 'Final'],
  [['50 / 50', 'S/ 3 250', '—', 'S/ 3 250'], ['50 / 40 / 10', 'S/ 3 250', 'S/ 2 600', 'S/ 650'], ['Por avance', 'adelanto', 'cada semana o quincena', 'saldo']],
  lambda i: [1, 2, 3][i], top=290, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Los cambios y adicionales son donde más se pierde.',
  'El cliente, a mitad de obra: "¿Y si alargamos el techo un metro?" Antes de hacerlo, mándale por escrito el adicional: qué se agrega, cuánto cuesta y cuántos días suma.',
  'Por ejemplo: un metro más de techo, seiscientos cincuenta soles y un día más. Solo cuando lo acepta por escrito, lo haces.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Cambios <span class="nar">y adicionales</span>', top=100) +
  '<div class="pop" data-en="1" style="position:absolute;left:300px;top:280px;width:620px;background:rgba(255,255,255,.08);border-radius:20px;padding:22px;font-size:30px">💬 "¿Y si alargamos el techo un metro?"</div>'
  '<div class="pop" data-en="2" style="position:absolute;left:1000px;top:400px;width:620px;background:#1f8f5f;border-radius:20px;padding:22px;font-size:28px;font-weight:700">'
  'Adicional N.º 1: +1 m de techo · <b>S/ 650</b> · +1 día. ¿Lo confirmamos? ✔✔</div>' +
  badge('PRIMERO POR ESCRITO, LUEGO SE HACE', 2, 620, 640, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Y por cada pago, deja constancia. Entrega un recibo o un comprobante, y guarda las capturas de cada transferencia o Yape.',
  'Al final, deben cuadrar: el precio, más los adicionales aceptados, menos lo pagado. Así el cobro final no tiene discusión.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Constancia <span class="nar">de cada pago</span>', top=100) + tabla(
  ['Concepto', 'S/'], [['Precio (cotización 025)', '6 500'], ['Adicional N.º 1', '+ 650'], ['Adelanto pagado', '− 3 250'], ['<b class="nar">Saldo a la entrega</b>', '<b class="nar">3 900</b>']],
  lambda i: [0, 0, 0, 1][i], top=280, izq=460, der=460, tam=34)))

E.append(dict(frases=[
  'Los cinco errores al cerrar el trato.',
  'Uno: todo de palabra.',
  'Dos: empezar sin adelanto.',
  'Tres: hacer adicionales sin precio escrito.',
  'Cuatro: no dar ni guardar constancia de los pagos.',
  'Y cinco: dejar el plazo sin fecha.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al cerrar el trato</span>', [
  ('Todo de palabra', 'Tu palabra contra la suya.'), ('Sin adelanto', 'Financias al cliente.'), ('Adicionales sin precio', 'Trabajo regalado.'),
  ('Sin constancia de pagos', 'Discusiones al final.'), ('Plazo sin fecha', 'Reclamos sin fin.')])))

E.append(dict(frases=[
  'Tu reto: escribe tu propio modelo de acuerdo simple, con los ocho puntos, para usarlo en tus próximas obras.',
  'En la próxima clase: la cobranza y el flujo de caja.',
], html=reto('✍️ Tu modelo de acuerdo simple<br><b class="nar">con los 8 puntos</b>', 'COBRANZA Y FLUJO DE CAJA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: lo que no está escrito, no existe.',
  '¡Nos vemos en la clase siete!',
], html=final('Todo <span class="nar">por escrito</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c6')
