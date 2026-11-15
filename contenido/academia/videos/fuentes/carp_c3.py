"""Carpintería Metálica · Clase 3: La puerta metálica — marco, hoja, bisagras, chapa y refuerzos."""
from sold_comun import *
from carp_c1 import ETAPAS_CARP, OBRA

CURSO = 'CARPINTERÍA METÁLICA · CLASE 3'
E = []

def puerta_svg(en, x, y, esc=1.0, diag=False, bis=True, chapa=True, mas=0):
    s = f'''<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{420*esc}" height="{640*esc}" viewBox="0 0 420 640">
 <path d="M20 630 V20 H400 V630" fill="none" stroke="#56687a" stroke-width="22"/>
 <rect x="44" y="40" width="332" height="574" fill="#7d8f9f" stroke="#9aa6b0" stroke-width="12"/>
 <line x1="44" y1="330" x2="376" y2="330" stroke="#9aa6b0" stroke-width="10"/>'''
    if diag: s += '<line x1="56" y1="600" x2="364" y2="52" stroke="#f97316" stroke-width="10"/>'
    if bis: s += ''.join(f'<rect x="30" y="{yy}" width="18" height="44" rx="4" fill="#ffd166"/>' for yy in (100, 300, 520))
    if chapa: s += '<rect x="330" y="300" width="30" height="60" rx="5" fill="#1d2731"/><rect x="300" y="318" width="40" height="10" rx="4" fill="#c9d6e3"/>'
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'La puerta quedó linda el día de la entrega...',
  '...y a los tres meses, ya rozaba el piso y la chapa no cerraba. Se descolgó.',
  'Hoy aprendes a fabricar una puerta metálica que se mantenga derecha por años. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Se', 'descolgó', 3, 'LA PUERTA', soldando=False) + puerta_svg(0, 1250, 230, 1.0)))

E.append(escena_obra(2, [
  'Ya tenemos las medidas y el despiece de la puerta de calle de nuestra casa.',
  'Ahora la fabricamos: marco, hoja, bisagras, chapa y refuerzos.',
], 'Hoy: <span class="nar">la puerta de calle</span>', ETAPAS_CARP, OBRA))

E.append(dict(frases=[
  'Las partes de una puerta. El marco: va fijo al muro. En puertas de calle, normalmente en forma de U invertida, sin travesaño abajo.',
  'La hoja: el bastidor que se mueve, con sus travesaños de refuerzo.',
  'El relleno: plancha, reja, vidrio o una combinación.',
  'Y los herrajes: bisagras, chapa, manija y pasadores.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las partes <span class="nar">de la puerta</span>', top=110) + puerta_svg(0, 300, 230, 0.95) + lista([
  ('🔲', '<b>Marco</b>: fijo al muro · en U invertida'), ('🚪', '<b>Hoja</b>: bastidor + travesaños'), ('🟫', '<b>Relleno</b>: plancha, reja o vidrio'), ('🔩', '<b>Herrajes</b>: bisagras, chapa, manija, pasadores')],
  lambda i: i, top=290, izq=820, der=150, tam=31)))

E.append(dict(frases=[
  'Perfiles típicos para una puerta de calle: marco en tubo rectangular de tres por uno y medio pulgadas. Hoja en tubo cuadrado de una y media pulgada.',
  'Y plancha de uno punto cinco milímetros, un dieciseisavo. Más delgada se abolla de un golpe.',
  'Para soldar la plancha a la hoja: cordones cortos, de dos o tres centímetros, cada diez a quince, alternando lados. Un cordón corrido calienta tanto que la plancha queda ondulada.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Perfiles y <span class="nar">plancha</span>', top=110) + tabla(
  ['Parte', 'Perfil típico'], [['Marco', 'Tubo rect. 3" × 1½"'], ['Hoja', 'Tubo cuad. 1½"'], ['Relleno', 'Plancha 1.5 mm (1/16")']],
  lambda i: [0, 0, 1][i], top=260, izq=420, der=420, tam=34) + badge('PLANCHA: CORDONES CORTOS Y ALTERNADOS', 2, 600, 620, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Las bisagras. En una puerta de calle, tres bisagras, no dos. Una a unos veinte centímetros de arriba, otra a veinte de abajo, y la tercera al medio.',
  'Y las tres deben quedar exactamente en el mismo eje, alineadas con un nivel o un hilo. Si una se sale, la puerta se traba y las bisagras se gastan.',
  'La chapa, con la manija a más o menos un metro del piso. Y por dentro del bastidor, un refuerzo donde va la chapa, para que tenga dónde agarrarse.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 30, 55)], html=titulo('Bisagras <span class="nar">y chapa</span>', top=110) + puerta_svg(0, 320, 230, 0.95) + lista([
  ('3️⃣', '<b>3 bisagras</b>: a 20 cm de arriba, 20 cm de abajo y al medio'), ('📏', 'Las 3 en el <b>mismo eje</b>'), ('🔐', 'Manija a <b>≈ 1.00 m</b> del piso · refuerzo para la chapa')],
  lambda i: i, top=300, izq=820, der=150, tam=31)))

E.append(dict(frases=[
  '¿Por qué se descuelga una puerta? Por su propio peso. La esquina del lado de la chapa tiende a bajar.',
  'Si la hoja lleva plancha soldada en todo su contorno, la plancha la mantiene a escuadra. Pero si es de reja o de vidrio, necesita una diagonal.',
  'La diagonal va desde la esquina de abajo, del lado de las bisagras, hasta la esquina de arriba, del lado de la chapa. Así trabaja empujando, y sostiene la hoja.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Que no <span class="nar">se descuelgue</span>', top=110) + puerta_svg(0, 330, 230, 0.95, bis=True) + puerta_svg(2, 1150, 230, 0.95, diag=True) +
 '<div class="ap" data-en="0" style="position:absolute;left:330px;top:190px;font-size:28px;font-weight:900;color:#ff6b6b">⬇ el lado de la chapa baja</div>' +
 '<div class="ap" data-en="2" style="position:absolute;left:1120px;top:190px;font-size:28px;font-weight:900;color:#7ee08a">✓ diagonal: de bisagra abajo a chapa arriba</div>'))

E.append(dict(frases=[
  'Vamos con nuestra puerta de calle. Marco de ochocientos setenta por dos mil noventa y cinco. Con el tubo de tres por uno y medio, el interior queda en setecientos noventa y cuatro de ancho.',
  'La hoja: setecientos ochenta y ocho de ancho, con tres milímetros de holgura por lado. Y dos mil cuarenta y dos de alto, con tres arriba y doce abajo.',
  'Bastidor en tubo de una y media: unos siete metros de tubo, como doce kilos. Plancha de uno punto cinco: uno punto seis metros cuadrados, unos diecinueve kilos.',
  'La hoja pesa unos treinta y un kilos. Con tres bisagras capuchinas de cuatro pulgadas, trabaja tranquila.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">nuestra puerta</span>', top=110) + tabla(
  ['Pieza', 'Medida', 'Peso'], [['Marco (exterior)', '870 × 2095 mm', '—'], ['Hoja', '788 × 2042 mm', '—'], ['Bastidor tubo 1½" × 1.5 mm', '≈ 7.1 m × 1.68 kg/m', '≈ 12 kg'], ['Plancha 1.5 mm', '1.61 m² × 1.5 × 7.85', '≈ 19 kg'], ['<b class="nar">Hoja total</b>', '', '<b class="nar">≈ 31 kg</b>']],
  lambda i: [0, 1, 2, 2, 3][i], top=250, izq=240, der=240, tam=30)))

E.append(dict(frases=[
  'Los cinco errores de la puerta.',
  'Uno: dos bisagras en una puerta pesada.',
  'Dos: bisagras fuera de eje.',
  'Tres: soldar la plancha con un cordón corrido, y que quede ondulada.',
  'Cuatro: hoja de reja o vidrio sin diagonal.',
  'Y cinco: la chapa sin refuerzo, que a los meses se afloja.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">de la puerta</span>', [
  ('Solo 2 bisagras', 'Se descuelga.'), ('Bisagras fuera de eje', 'Se traba y se gastan.'), ('Plancha con cordón corrido', 'Queda ondulada.'),
  ('Reja o vidrio sin diagonal', 'El lado de la chapa baja.'), ('Chapa sin refuerzo', 'Se afloja con el uso.')])))

E.append(dict(frases=[
  'Tu reto: calcula la hoja de una puerta para un marco de novecientos por dos mil cien, con tubo de marco de treinta y ocho milímetros de cara. Ancho y alto de la hoja, con sus holguras.',
  'En la próxima clase: el portón de la cochera. Batiente o corredizo, y cómo hacer que no se arrastre.',
], html=reto('🧮 Marco 900 × 2100 mm, cara del tubo 38 mm:<br><b class="nar">ancho y alto de la hoja</b>', 'EL PORTÓN')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: una buena puerta se nota a los años, no el día de la entrega.',
  '¡Nos vemos en la clase cuatro!',
], html=final('Puerta derecha, <span class="nar">por años</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c3')
