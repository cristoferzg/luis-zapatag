"""Portones Automáticos · Clase 2: Peso del portón y elección del motor."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 2'
E = []

E.append(dict(antes=0.5, frases=[
  'El motor se quemó a los cuatro meses. El cliente culpa a la marca, pero la marca no tuvo la culpa.',
  'El portón pesaba casi el doble de lo que el maestro calculó "al ojo", y además corría duro.',
  'Hoy aprendes a pesar el portón en el papel y a elegir el motor con números. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('El motor no se quema solo', 'lo quema el portón', 2, 'PESO Y MOTOR', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">⚖️</div>')))

E.append(obra(1, [
  'Ya elegimos corredizo para la cochera.',
  'Hoy calculamos cuánto pesa la hoja de tres noventa por dos cuarenta, y qué motor le corresponde.',
], 'Hoy: <span class="nar">peso de la hoja y motor</span>'))

E.append(dict(frases=[
  'Para pesar en el papel necesitas dos datos: los metros de cada perfil y cuánto pesa un metro, y los metros cuadrados de plancha y cuánto pesa un metro cuadrado.',
  'Un tubo cuadrado de cincuenta por cincuenta y dos milímetros pesa unos tres kilos por metro.',
  'Y una plancha de un milímetro y medio pesa casi doce kilos por metro cuadrado. La fórmula es simple: siete punto ochenta y cinco por el espesor en milímetros.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Pesa <span class="nar">en el papel</span>', top=90) + tarjetas([
  ('📏', 'Perfiles', 'metros × kg por metro'), ('🟧', 'Tubo 50 × 50 × 2 mm', '<b class="nar">≈ 3.0 kg/m</b>'), ('▦', 'Plancha 1.5 mm', '7.85 × 1.5 = <b class="nar">≈ 11.8 kg/m²</b>')],
  lambda i: i, top=270, cols=3, alto=300, izq=240)))

E.append(dict(frases=[
  'Hagamos la cuenta de nuestra hoja.',
  'El marco y tres travesaños suman unos veinticuatro metros de tubo: setenta y tres kilos.',
  'La plancha, tres noventa por dos cuarenta, son nueve metros cuadrados y algo: ciento diez kilos.',
  'Ruedas, guías, cremallera y soldadura, unos veinte kilos más. Total: unos doscientos kilos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 60)], html=titulo('La cuenta de <span class="nar">nuestra hoja</span>', top=90) + tabla(
  ['Parte', 'Cálculo', 'Peso'],
  [['Marco y travesaños', '24.3 m × 3.0 kg/m', '73 kg'], ['Plancha 1.5 mm', '9.36 m² × 11.8 kg/m²', '110 kg'], ['Ruedas, guías, cremallera', 'estimado', '20 kg'],
   ['<span class="nar">TOTAL</span>', '', '<b class="nar">≈ 200 kg</b>']],
  lambda i: [1, 2, 3, 3][i], top=250, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Ahora, el motor. Nunca elijas un motor justo para el peso.',
  'Elige uno que aguante al menos una vez y media o dos veces el peso real. Así trabaja descansado, no se calienta y dura años.',
  'Para nuestra hoja de doscientos kilos, un motor de cuatrocientos quedaría al límite. Elegimos uno de seiscientos kilos, que es un modelo muy común y el precio casi no cambia.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('El motor: <span class="nar">con margen</span>', top=90) + svg(
  ''.join(f'<g class="ap" data-en="{e}"><rect x="{x}" y="{760-h}" width="220" height="{h}" rx="10" fill="{c}"/>'
          f'<text x="{x+110}" y="{740-h}" fill="#fff" font-size="34" {T} text-anchor="middle">{t}</text>'
          f'<text x="{x+110}" y="800" fill="#c9d6e3" font-size="26" {T} text-anchor="middle">{n}</text></g>'
          for e, x, h, c, t, n in [(0, 420, 120, '#5b8def', '200 kg', 'tu hoja'), (1, 760, 240, '#ffb020', '400 kg', 'al límite'), (2, 1100, 360, '#3f9e5a', '600 kg ✓', 'elegido')])
  + '<line x1="380" y1="760" x2="1380" y2="760" stroke="#9aa6b0" stroke-width="3"/>')))

E.append(dict(frases=[
  'El peso no es todo. Lo que de verdad cansa al motor es la fuerza para moverlo: el roce.',
  'Haz la prueba: con el portón suelto, una persona debe moverlo con una mano, sin empujar con el cuerpo. Si cuesta, el problema está en el riel o en las ruedas, y eso se arregla antes de poner el motor.',
  'Y si la hoja es ciega, de plancha completa, el viento la empuja como una vela. En zonas de mucho viento sube un escalón el motor.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El enemigo: <span class="nar">el roce</span>', top=90) + tarjetas([
  ('✋', 'Prueba de una mano', 'Suelto, se mueve<br><b class="nar">sin empujar con el cuerpo</b>'), ('🛠️', 'Si cuesta', 'Arregla riel y ruedas<br><b class="nar">antes del motor</b>'),
  ('💨', 'Hoja ciega', 'El viento empuja<br><b class="nar">sube un escalón</b>')],
  lambda i: [0, 1, 2][i], top=260, cols=3, alto=310, izq=240)))

E.append(dict(frases=[
  'Aprende a leer la ficha del motor.',
  'Capacidad en kilos; uso o ciclos, que te dice cuántas veces por hora o por día puede abrir.',
  'Velocidad en metros por minuto: unos doce metros por minuto es normal; nuestra hoja recorre su camino en unos veinte segundos.',
  'Y el grado de protección contra agua y polvo, las letras I P. Para exterior, busca I P cuarenta y cuatro o más.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Lee <span class="nar">la ficha</span>', top=90) + tabla(
  ['Dato', 'Qué significa', 'Nuestro motor'],
  [['Capacidad', 'Peso máximo de hoja', '600 kg'], ['Uso / ciclos', 'Veces por hora o día', 'Residencial'], ['Velocidad', 'Metros por minuto', '≈ 12 m/min · ≈ 20 s'],
   ['Protección IP', 'Agua y polvo', 'IP44 o más']],
  lambda i: [1, 1, 2, 3][i], top=250, izq=230, der=230, tam=30)))

E.append(dict(frases=[
  'Hay motores de doscientos veinte voltios y de veinticuatro voltios.',
  'El de doscientos veinte es más económico y suficiente para una casa.',
  'El de veinticuatro voltios arranca y frena suave, aguanta más ciclos y puede llevar batería para cuando se va la luz. Cuesta más, pero es el indicado para condominios y zonas con cortes.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('<span class="nar">220 V</span> o <span class="nar">24 V</span>', top=90) + tarjetas([
  ('🔌', '220 V', 'Más económico<br>suficiente para casa'), ('🔋', '24 V', 'Arranque suave · más ciclos<br><b class="nar">admite batería</b>')],
  lambda i: [1, 2][i], top=270, cols=2, alto=300, izq=380)))

E.append(dict(frases=[
  'En batientes la ficha dice dos cosas: el largo máximo de hoja y el peso máximo por hoja.',
  'Una hoja larga hace palanca. Una hoja de dos metros y medio pide más motor que dos hojas de uno ochenta, aunque pesen parecido.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('En batientes: <span class="nar">largo y peso</span>', top=90) + lista([
  ('📐', 'Largo máximo de hoja <b class="nar">(la palanca)</b>'), ('⚖️', 'Peso máximo <b class="nar">por hoja</b>'), ('⚠️', 'Hoja larga = <b class="nar">más motor</b>')],
  lambda i: [0, 0, 1][i], top=280, izq=380, der=380, tam=34)))

E.append(dict(frases=[
  'Así queda la elección para la cochera: hoja de doscientos kilos; motor corredizo de seiscientos kilos, de doscientos veinte voltios, uso residencial, protección I P cuarenta y cuatro, y fines de carrera magnéticos.',
  'Margen de tres veces. Este motor va a trabajar tranquilo muchos años.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">motor elegido</span>', top=90) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:420px;right:420px;top:260px;font-size:34px;line-height:1.7;text-align:center">'
  'Hoja: <b class="nar">≈ 200 kg</b><br>Motor corredizo <b class="nar">600 kg · 220 V</b><br>Residencial · IP44 · fines de carrera magnéticos</div>' +
  badge('MARGEN × 3', 1, 820, 640, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Los cuatro errores al elegir el motor.',
  'Uno: calcular el peso al ojo.',
  'Dos: motor justo para el peso.',
  'Tres: motorizar un portón que corre duro.',
  'Y cuatro: no mirar los ciclos de uso.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">con el motor</span>', [
  ('Peso al ojo', 'Te quedas corto.'), ('Motor justo', 'Trabaja forzado.'), ('Portón duro', 'Quema el motor.'), ('Sin mirar ciclos', 'No aguanta el uso.')])))

E.append(dict(frases=[
  'Tu reto: calcula el peso de un portón que hayas hecho, con perfiles y plancha, y di qué motor le pondrías.',
  'En la próxima clase: cómo fabricar la hoja para que corra sola.',
], html=reto('⚖️ Calcula el <b class="nar">peso de un portón</b> tuyo<br>y elige su motor con margen', 'LA HOJA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: pesa en el papel y elige con margen.',
  '¡Nos vemos en la clase tres!',
], html=final('Motor con <span class="nar">margen</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c2')
