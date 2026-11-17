"""El Negocio del Metalero · Clase 3: La visita técnica."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 3'
E = []

E.append(dict(antes=0.5, frases=[
  '"Maestro, ¿cuánto me cobra por un portón?" Y tú, por WhatsApp, sin ver nada, das un precio.',
  'Si te quedas corto, pierdes plata. Si te pasas, pierdes el trabajo. Y en los dos casos, el cliente te ve como uno más.',
  'Hoy aprendes a hacer una visita técnica que vende antes de cotizar. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('"¿Cuánto me cobra?"', 'no des precio a ciegas', 3, 'LA VISITA', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">📋</div>')))

E.append(obra(2, [
  'Ya sabes cuánto cuesta tu hora.',
  'Hoy: la visita técnica a la cochera del cliente.',
], 'Hoy: <span class="nar">la visita técnica</span>'))

E.append(dict(frases=[
  'La venta empieza antes de llegar. Responde rápido: el primero que contesta bien suele llevarse el trabajo.',
  'Pide fotos y la ubicación, para ir preparado. Agenda una hora exacta, no "en la tarde", y confírmala un día antes.',
  'Si la obra es lejos, puedes cobrar la visita y descontarla si el cliente contrata. Avísalo desde el inicio.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Antes <span class="nar">de ir</span>', top=100) + lista([
  ('⚡', '<b class="nar">Responde rápido</b>'), ('📸', 'Pide <b class="nar">fotos y ubicación</b>'), ('🕒', '<b class="nar">Hora exacta</b> y confirma un día antes'),
  ('💳', 'Lejos: visita con costo, <b class="nar">se descuenta si contrata</b>')],
  lambda i: [0, 1, 1, 2][i], top=260, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'En la visita, tu imagen también vende. Llega puntual, con ropa limpia de trabajo y tus herramientas de medir.',
  'Y lo más importante: escucha primero. El cliente te dirá qué necesita, qué le preocupa y qué valora. Eso vale más que cualquier catálogo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Tu <span class="nar">imagen</span> vende', top=100) + tarjetas([
  ('⏰', 'Puntual', 'Llega a la hora<br>que dijiste'), ('👕', 'Presentable', 'Ropa limpia,<br>wincha y libreta'), ('👂', 'Escucha primero', 'Qué necesita<br>y qué le preocupa')],
  lambda i: 0 if i < 2 else 1, top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  'Haz siempre las mismas seis preguntas.',
  '¿Para qué lo va a usar? ¿Tiene fotos o ideas de lo que le gusta? ¿Para cuándo lo necesita?',
  '¿Quién decide la compra? Si es otra persona, conviene que esté en la visita.',
  '¿Tiene un monto pensado? Y, ¿hay luz y acceso para trabajar y descargar el material?',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">seis preguntas</span>', top=90) + '<div style="position:absolute;left:300px;right:300px;top:220px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="{e}" data-mas="{0.3*(k%3):.1f}" style="background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.6);border-radius:14px;padding:18px 22px;font-size:30px;font-weight:800">{t}</div>'
          for k, (e, t) in enumerate([(1, '🎯 ¿Para qué lo usará?'), (1, '🖼️ ¿Qué le gusta?'), (1, '📅 ¿Para cuándo?'), (2, '👤 ¿Quién decide?'), (3, '💰 ¿Monto pensado?'), (3, '🔌 ¿Luz y acceso?')])) + '</div>'))

E.append(dict(frases=[
  'Luego, mide y registra. Mide cada medida dos veces, y en el vano, arriba, al medio y abajo: los vanos casi nunca están a escuadra.',
  'Toma fotos de cada lado, con la wincha visible. Y anota en qué te vas a apoyar: muro, columnas, viga, y en qué estado están.',
  'Cómo medir el vano y las holguras de una puerta o portón ya lo viste en el curso de Carpintería. Aquí lo importante es no olvidar nada que cambie el precio.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Mide <span class="nar">y registra</span>', top=100) + lista([
  ('📏', 'Cada medida <b class="nar">dos veces</b>; el vano arriba, al medio y abajo'), ('📸', 'Fotos de cada lado <b class="nar">con la wincha visible</b>'),
  ('🧱', 'Apoyos: <b class="nar">muro, columnas, viga</b> y su estado')],
  lambda i: i, top=270, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Mira también los riesgos que encarecen o complican la obra.',
  'Muros débiles o rajados, cables eléctricos cerca de donde vas a soldar, vecinos que pueden reclamar por el ruido o por invadir su espacio.',
  'Y pregunta si la obra necesita permiso del condominio o de la municipalidad. Mejor saberlo antes que tener la obra parada.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Detecta <span class="nar">los riesgos</span>', top=100) + tarjetas([
  ('🧱', 'Muros débiles', 'Rajados o<br>sin viga'), ('⚡', 'Cables cerca', 'Peligro al<br>soldar'), ('🏘️', 'Vecinos', 'Ruido y<br>linderos'), ('📄', 'Permisos', 'Condominio o<br>municipalidad')],
  lambda i: [1, 1, 1, 2][i], top=260, cols=4, alto=300, izq=120)))

E.append(dict(frases=[
  'Al terminar, no des el precio en ese momento. Di algo así: "Le envío la cotización detallada mañana antes de las seis de la tarde".',
  'Y cúmplelo. Esa promesa cumplida ya te diferencia de la mayoría.',
  'Si el cliente insiste, da solo un rango amplio y aclara que el precio final va en la cotización.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('No des precio <span class="nar">en el acto</span>', top=100) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:380px;right:380px;top:300px;text-align:center;font-size:38px;font-weight:800">💬 "Le envío la cotización detallada<br><span class="nar">mañana antes de las 6 p. m.</span>"</div>' +
  badge('PROMESA CUMPLIDA = CONFIANZA', 1, 700, 520, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Así quedó la ficha de la visita a la cochera.',
  'El vano del portón mide tres metros por dos cuarenta, y el cliente quiere un portón corredizo. La cochera mide tres veinte por seis, para techar.',
  'Hay muro de ladrillo con columnas, punto de luz, y buen acceso. Es para un auto, lo quiere para fin de mes, y tiene pensado entre seis y siete mil soles.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El caso: <span class="nar">ficha de la visita</span>', top=100) + tabla(
  ['Dato', 'Lo que anotaste'],
  [['Portón', 'Corredizo · vano 3.00 × 2.40 m'], ['Techo', 'Cochera 3.20 × 6.00 m'], ['Apoyos', 'Muro de ladrillo con columnas'], ['Luz y acceso', 'Sí · buen acceso'],
   ['Uso y plazo', '1 auto · para fin de mes'], ['Monto pensado', 'S/ 6 000 a 7 000']],
  lambda i: [1, 1, 2, 2, 2, 2][i], top=240, izq=340, der=340, tam=31)))

E.append(dict(frases=[
  'Los cinco errores en la visita.',
  'Uno: dar precio por WhatsApp sin ver la obra.',
  'Dos: llegar tarde o sin herramientas.',
  'Tres: hablar más de lo que escuchas.',
  'Cuatro: medir una sola vez y sin fotos.',
  'Y cinco: prometer la cotización y no enviarla a tiempo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en la visita</span>', [
  ('Precio a ciegas', 'Pierdes plata o el trabajo.'), ('Tarde o sin herramientas', 'Mala imagen.'), ('No escuchar', 'Cotizas lo que no quiere.'),
  ('Medir una vez, sin fotos', 'Errores caros.'), ('Cotización tarde', 'Se va con otro.')])))

E.append(dict(frases=[
  'Tu reto: arma tu propia ficha de visita, con las seis preguntas, las medidas y los riesgos. Úsala en tu próxima visita.',
  'En la próxima clase: la cotización profesional.',
], html=reto('📋 Arma tu <b class="nar">ficha de visita</b>:<br>6 preguntas · medidas · riesgos', 'LA COTIZACIÓN')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la visita bien hecha vende antes de cotizar.',
  '¡Nos vemos en la clase cuatro!',
], html=final('La visita <span class="nar">también vende</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c3')
