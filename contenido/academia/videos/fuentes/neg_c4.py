"""El Negocio del Metalero · Clase 4: La cotización profesional."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 4'
E = []

wsp = ('<div class="pop" data-en="0" data-mas="0.5" style="position:absolute;left:1120px;top:190px;width:330px;background:#1f8f5f;border-radius:18px;padding:18px;font-size:26px;font-weight:700">'
       'portón y techo<br>6500 soles 👍</div>'
       '<div class="pop" data-en="0" data-mas="1.2" style="position:absolute;left:1500px;top:150px;width:300px;height:400px;background:#fff;border-radius:10px;padding:20px;color:#0b2a45;font-size:18px">'
       '<div style="height:14px;background:#f97316;margin-bottom:14px"></div><b style="font-size:22px">COTIZACIÓN N.º 025</b><br><br>'
       + ''.join(f'<div style="height:10px;background:#cbd5e1;margin:10px 0;width:{w}%"></div>' for w in (90, 70, 85, 60, 95, 75, 80, 50)) + '</div>')

E.append(dict(antes=0.5, frases=[
  'El cliente recibe dos respuestas. Una dice: "portón y techo, seis mil quinientos soles". La otra es un documento con su nombre, el detalle de cada trabajo, el plazo y la garantía.',
  'Aunque la segunda sea un poco más cara, casi siempre gana. Transmite seriedad, y el cliente sabe exactamente qué compra.',
  'Hoy aprendes a armar esa cotización profesional. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 70, 45), (2, 1.0, 50, 50)],
  html=gancho('Dos cotizaciones', '¿cuál elegirías?', 4, 'COTIZACIÓN', soldando=False, extra_html=wsp)))

E.append(obra(3, [
  'Ya hiciste la visita y tienes la ficha de la cochera.',
  'Hoy: la cotización profesional. Cómo calcular el costo ya lo viste en los cursos técnicos; aquí, cómo presentarlo para vender.',
], 'Hoy: <span class="nar">la cotización profesional</span>'))

E.append(dict(frases=[
  'Una cotización profesional tiene siete partes.',
  'Tus datos y tu logo. Los datos del cliente y de la obra. Y el alcance: qué vas a hacer, con qué medidas, materiales y acabado.',
  'Lo que no incluye. El plazo. La forma de pago.',
  'Y la validez de la oferta, con la garantía.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">siete partes</span>', top=90) + lista([
  ('🏷️', 'Tus datos y tu logo'), ('👤', 'Datos del cliente y de la obra'), ('🔧', '<b class="nar">Alcance</b>: qué, medidas, materiales, acabado'),
  ('🚫', '<b class="nar">Lo que no incluye</b>'), ('📅', 'Plazo'), ('💳', 'Forma de pago'), ('🛡️', 'Validez y garantía')],
  lambda i: [1, 1, 1, 2, 2, 2, 3][i], top=180, izq=360, der=360, tam=26)))

E.append(dict(frases=[
  'El alcance es la parte más importante. Compara.',
  'Mal: "portón metálico". Así cualquier detalle se vuelve discusión.',
  'Bien: "portón corredizo de tres metros por dos cuarenta, en tubo cuadrado de dos pulgadas con plancha de una veinte, riel inferior con garruchas, chapa de seguridad, anticorrosivo y esmalte en color a elegir, con instalación".',
  'Cuanto más claro el alcance, menos reclamos y menos adicionales regalados.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El <span class="nar">alcance</span>', top=100) +
  '<div class="tarjeta ap" data-en="1" style="position:absolute;left:300px;right:300px;top:250px;font-size:32px;border-color:#ff6b6b">✕ "Portón metálico"</div>'
  '<div class="tarjeta ap" data-en="2" style="position:absolute;left:300px;right:300px;top:370px;font-size:28px;line-height:1.45;border-color:#7ee08a">✓ "Portón <b class="nar">corredizo de 3.00 × 2.40 m</b>, tubo cuadrado 2", plancha 1.2 mm, '
  'riel inferior con garruchas, chapa de seguridad, <b class="nar">anticorrosivo + esmalte</b> color a elegir, con instalación"</div>'))

E.append(dict(frases=[
  'Igual de importante: lo que no incluye. Escríbelo, aunque te parezca obvio.',
  'Por ejemplo: la obra civil y los resanes de la pared, la instalación eléctrica o un motor, los permisos, y el retiro de desmonte.',
  'Si el cliente lo quiere, se cotiza aparte. Así nadie se siente engañado.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Lo que <span class="nar">no incluye</span>', top=100) + tarjetas([
  ('🧱', 'Obra civil', 'Resanes y<br>tarrajeo'), ('⚡', 'Electricidad', 'Motor y<br>puntos de luz'), ('📄', 'Permisos', 'Condominio o<br>municipalidad'), ('🚛', 'Desmonte', 'Retiro de<br>escombros')],
  lambda i: 1, top=260, cols=4, alto=300, izq=120)))

E.append(dict(frases=[
  'Luego, las condiciones. El plazo, contado desde el pago del adelanto, no desde hoy.',
  'La forma de pago, que veremos en la clase seis. Y la validez: por ejemplo, quince días, porque el precio del acero cambia.',
  'Y la garantía: qué cubre y por cuánto tiempo. La detallamos en la clase ocho.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">condiciones</span>', top=100) + tabla(
  ['Condición', 'Ejemplo'], [['Plazo', '12 días hábiles desde el adelanto'], ['Forma de pago', '50 % adelanto · 50 % a la entrega'], ['Validez', '15 días'], ['Garantía', 'Por escrito (clase 8)']],
  lambda i: [0, 1, 1, 2][i], top=280, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  'Un truco que funciona muy bien: ofrece tres opciones.',
  'En la cochera: una básica, con techo de policarbonato, en cinco mil novecientos. Una estándar, con plancha TR4, en seis mil quinientos. Y una superior, con panel termoacústico y chapa eléctrica, en siete mil ochocientos.',
  'Así el cliente compara entre tus opciones, no contra otro maestro. Y muchos eligen la del medio.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Tres <span class="nar">opciones</span>', top=100) + tarjetas([
  ('🥉', 'Básica · S/ 5 900', 'Techo de<br>policarbonato'), ('🥈', 'Estándar · S/ 6 500', 'Plancha TR4<br>(la más elegida)'), ('🥇', 'Superior · S/ 7 800', 'Termoacústico +<br>chapa eléctrica')],
  lambda i: 1, top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  'La presentación: en PDF, con tu logo y numerada, por ejemplo cotización número veinticinco. Nunca solo un mensaje de texto.',
  'Envíala con un mensaje corto y amable, a la hora que prometiste.',
  'Y haz seguimiento: dos días después, llama para resolver dudas. Sin presionar. Muchas obras se ganan en esa llamada.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Envía <span class="nar">y haz seguimiento</span>', top=100) + lista([
  ('📄', '<b class="nar">PDF</b> con logo y número'), ('⏰', 'Envíala a la hora prometida'), ('📞', '<b class="nar">Llama a los 2 días</b>: resuelve dudas')],
  lambda i: i, top=290, izq=380, der=380, tam=36)))

E.append(dict(frases=[
  'Los cinco errores en la cotización.',
  'Uno: mandar solo un número por WhatsApp.',
  'Dos: un alcance vago.',
  'Tres: no escribir lo que no incluye.',
  'Cuatro: sin fecha de validez.',
  'Y cinco: enviarla y no hacer seguimiento.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en la cotización</span>', [
  ('Solo un número', 'No transmite seriedad.'), ('Alcance vago', 'Reclamos y regalos.'), ('Sin "no incluye"', 'Discusiones.'),
  ('Sin validez', 'El acero sube y pierdes.'), ('Sin seguimiento', 'Se enfría la venta.')])))

E.append(dict(frases=[
  'Tu reto: toma tu última cotización y rehazla con las siete partes y tres opciones.',
  'En la próxima clase: el precio y la negociación.',
], html=reto('📄 Rehaz tu última cotización:<br><b class="nar">7 partes y 3 opciones</b>', 'PRECIO Y NEGOCIACIÓN')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: una cotización clara vende sola.',
  '¡Nos vemos en la clase cinco!',
], html=final('Cotiza como <span class="nar">empresa</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c4')
