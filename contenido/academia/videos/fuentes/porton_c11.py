"""Portones Automáticos · Clase 11: Cuando se va la luz."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 11'
E = []

E.append(dict(antes=0.5, frases=[
  'Diez de la noche. Se va la luz en todo el barrio, y el cliente está afuera, con el auto, frente a un portón de doscientos kilos que no se mueve.',
  'Si no previste esto, la llamada es para ti.',
  'Hoy ves las soluciones para cuando no hay luz. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Se fue la luz', 'y el auto está afuera', 11, 'SIN LUZ', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🔦</div>')))

E.append(obra_av(2, [
  'Ya sabes controlar quién abre.',
  'Hoy: que el portón no deje a nadie afuera cuando no hay energía.',
], 'Hoy: <span class="nar">abrir sin luz</span>'))

E.append(dict(frases=[
  'La primera solución siempre existe: el desbloqueo manual. Con la llave, el motor se suelta y la hoja se mueve a mano.',
  'Pero ojo: casi siempre el desbloqueo está adentro. Si el cliente vive solo y queda afuera, necesita otra entrada, una puerta peatonal, o un desbloqueo exterior con llave.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('1. El <span class="nar">desbloqueo manual</span>', top=90) + tarjetas([
  ('🔑', 'Siempre existe', 'Llave que suelta<br>el motor'), ('⚠️', 'Pero está adentro', 'Puerta peatonal o<br><b class="nar">desbloqueo exterior</b>')],
  lambda i: i, top=280, cols=2, alto=290, izq=380)))

E.append(dict(frases=[
  'La segunda: batería de respaldo. Los motores de veinticuatro voltios suelen aceptar baterías que se cargan solas mientras hay luz.',
  'Cuando hay un corte, el motor sigue funcionando un número limitado de ciclos. El fabricante dice cuántos, según la batería y el peso de la hoja.',
  'Para motores de doscientos veinte voltios existe otra opción: un equipo de respaldo con inversor, dimensionado para el arranque del motor.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('2. <span class="nar">Batería</span> de respaldo', top=90) + lista([
  ('🔋', 'Motores <b class="nar">24 V</b>: batería que se carga sola'), ('🔁', 'Ciclos limitados: <b class="nar">según el fabricante</b>'),
  ('🔌', 'Motores 220 V: <b class="nar">respaldo con inversor</b> para el arranque')],
  lambda i: i, top=280, izq=330, der=330, tam=33)))

E.append(dict(frases=[
  'La tercera: energía solar. En zonas sin red eléctrica, como una chacra o un fundo, un panel pequeño con su controlador de carga mantiene la batería del motor de veinticuatro voltios.',
  'Sirve para portones de pocos ciclos al día. El tamaño del panel y de la batería depende de cuántas veces abre y de las horas de sol de la zona: pide el cálculo al proveedor del kit.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('3. Energía <span class="nar">solar</span>', top=90) + svg(
  '<g class="pop" data-en="0"><rect x="540" y="300" width="300" height="180" fill="#1e3a5f" stroke="#5b8def" stroke-width="5" transform="skewX(-12)"/>'
  + ''.join(f'<line x1="{560+k*60}" y1="300" x2="{560+k*60}" y2="480" stroke="#5b8def" stroke-width="2" transform="skewX(-12)"/>' for k in range(1, 5)) + '</g>'
  '<path class="dib" data-en="0" data-mas="0.6" d="M760 480 L760 620 L1020 620" fill="none" stroke="#ffd166" stroke-width="6" style="--l:420"/>'
  '<rect class="pop" data-en="0" data-mas="1.0" x="1020" y="570" width="150" height="100" rx="12" fill="#2b3a47" stroke="#3f9e5a" stroke-width="5"/>'
  f'<text class="pop" data-en="0" data-mas="1.0" x="1095" y="630" fill="#fff" font-size="24" {T} text-anchor="middle">BATERÍA</text>'
  '<path class="dib" data-en="0" data-mas="1.4" d="M1170 620 L1330 620" fill="none" stroke="#ffd166" stroke-width="6" style="--l:200"/>'
  '<rect class="pop" data-en="0" data-mas="1.6" x="1330" y="570" width="150" height="100" rx="12" fill="#2b3a47" stroke="#f97316" stroke-width="5"/>'
  f'<text class="pop" data-en="0" data-mas="1.6" x="1405" y="630" fill="#fff" font-size="24" {T} text-anchor="middle">MOTOR 24 V</text>'
  f'<text class="ap" data-en="1" x="960" y="760" fill="#c9d6e3" font-size="28" {T} text-anchor="middle">pocos ciclos al día · cálculo del proveedor</text>')))

E.append(dict(frases=[
  '¿Cómo decides? Haz tres preguntas al cliente.',
  '¿Hay cortes de luz frecuentes en la zona? ¿Quién usa el portón, y si alguien puede quedar afuera solo? ¿Cuántas veces abre al día?',
  'Con cortes frecuentes o personas que no pueden mover la hoja a mano, recomienda veinticuatro voltios con batería desde el inicio. Es más barato que cambiar el motor después.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Cómo <span class="nar">decidir</span>', top=90) + lista([
  ('⚡', '¿<b class="nar">Cortes frecuentes</b> en la zona?'), ('👵', '¿Alguien <b class="nar">puede quedar afuera</b> solo?'), ('🔁', '¿<b class="nar">Cuántas veces</b> abre al día?')],
  lambda i: 1, top=260, izq=360, der=360, tam=34) + badge('24 V CON BATERÍA DESDE EL INICIO', 2, 600, 650, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'En nuestra cochera, el cliente dijo que hay cortes cortos un par de veces al mes y que tiene puerta peatonal.',
  'Con motor de doscientos veinte voltios, desbloqueo manual y la puerta peatonal es suficiente.',
  'Le explicamos cómo desbloquear, y dejamos anotado que, si los cortes aumentan, se puede pasar a un equipo con respaldo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">la cochera</span>', top=90) + tabla(
  ['Pregunta', 'Respuesta'],
  [['Cortes', 'Cortos, 2 veces al mes'], ['¿Otra entrada?', 'Sí, puerta peatonal'], ['Decisión', '220 V + desbloqueo manual ✓']],
  lambda i: [0, 0, 1][i], top=270, izq=380, der=380, tam=33)))

E.append(dict(frases=[
  'Los cuatro errores sin luz.',
  'Uno: no explicar el desbloqueo al cliente.',
  'Dos: desbloqueo solo adentro y sin otra entrada.',
  'Tres: prometer ciclos de batería sin ver la ficha.',
  'Y cuatro: panel solar "al ojo", sin cálculo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">sin luz</span>', [
  ('No explicar el desbloqueo', 'Llamadas de noche.'), ('Sin otra entrada', 'Cliente afuera.'), ('Prometer ciclos', 'Promesa incumplida.'), ('Solar al ojo', 'Batería siempre baja.')])))

E.append(dict(frases=[
  'Tu reto: haz las tres preguntas a un cliente con portón automático y decide qué solución le corresponde para cuando se va la luz.',
  'En la próxima clase, la última: fallas, diagnóstico y mantenimiento.',
], html=reto('🔦 Haz las <b class="nar">3 preguntas</b> a un cliente<br>y elige su solución sin luz', 'FALLAS Y MANTENIMIENTO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: piensa en el corte de luz antes de que pase.',
  '¡Nos vemos en la última clase!',
], html=final('Que nadie <span class="nar">quede afuera</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c11')
