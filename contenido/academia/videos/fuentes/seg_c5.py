"""Seguridad en Obra · Clase 5: Arnés, línea y anclaje."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 5'
E = []

E.append(dict(antes=0.5, frases=[
  'El arnés puesto, la línea colgando... y enganchada a un tubo de PVC de la instalación eléctrica.',
  'Un arnés solo funciona si las tres partes del sistema están bien: el arnés, la línea y el punto de anclaje.',
  'Hoy aprendes a elegirlas, a revisarlas y a usarlas. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Enganchado a un tubo', 'que no aguanta nada', 5, 'EL ARNÉS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🪢</div>')))

E.append(obra(4, [
  'Cada trabajador ya tiene su EPP básico.',
  'Hoy: el sistema de detención de caídas para trabajar arriba de la nave.',
], 'Hoy: <span class="nar">arnés · línea · anclaje</span>'))

E.append(dict(frases=[
  'El sistema tiene tres partes, como una cadena: si una falla, falla todo.',
  'El arnés de cuerpo entero, que reparte la fuerza de la caída en hombros, pecho y piernas. Nunca un cinturón.',
  'La línea de anclaje, que une el arnés al anclaje. Y el punto de anclaje, donde se engancha, que tiene que aguantar la caída.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Una <span class="nar">cadena de 3</span>', top=90) + tarjetas([
  ('🦺', 'Arnés', 'De cuerpo entero<br><b class="nar">nunca un cinturón</b>'), ('🪢', 'Línea', 'Con amortiguador<br>y 2 mosquetones'), ('⚓', 'Anclaje', 'Que aguante<br><b class="nar">la caída</b>')],
  lambda i: [1, 2, 2][i], top=270, cols=3, alto=300, izq=240)))

E.append(dict(frases=[
  'La línea de anclaje: máximo un metro ochenta de largo, con amortiguador de impacto, que se abre y frena la caída de a poco.',
  'Con dos mosquetones de doble seguro, que no se abren solos. Se engancha a la argolla de la espalda del arnés.',
  'Y la línea en Y, con dos ramales, te permite pasar de un anclaje a otro sin soltarte nunca: primero enganchas uno, después sueltas el otro.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('La <span class="nar">línea de anclaje</span>', top=90) + lista([
  ('📏', 'Máximo <b class="nar">1.80 m</b> con <b class="nar">amortiguador</b>'), ('🔒', '<b class="nar">2 mosquetones</b> de doble seguro'), ('🔀', 'Línea en Y: <b class="nar">siempre uno enganchado</b>')],
  lambda i: i, top=280, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'El punto de anclaje. La Norma G punto cero cincuenta pide que resista como mínimo dos mil doscientos sesenta y cinco kilos por trabajador, unas cinco mil libras.',
  'Eso aguanta una viga o columna metálica bien soldada, un anclaje certificado, o una línea de vida bien instalada.',
  'No aguantan: tubos de agua o de electricidad, barandas comunes, ni las propias correas sueltas que estás colocando.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 55)], html=titulo('El anclaje: <span class="nar">2 265 kg</span>', top=90) + tarjetas([
  ('✅', 'Sí aguanta', 'Viga o columna soldada<br>anclaje certificado<br>línea de vida'), ('❌', 'No aguanta', 'Tubos de agua o luz<br>barandas comunes<br>correas sueltas')],
  lambda i: [1, 2][i], top=280, cols=2, alto=320, izq=380) + badge('≥ 2 265 kg (5 000 lb) POR TRABAJADOR', 0, 600, 650, '#3f9e5a', '⚓')))

E.append(dict(frases=[
  'La línea de vida horizontal es un cable tendido de un extremo a otro, donde los trabajadores enganchan su línea y caminan sin soltarse.',
  'La norma pide cable de acero de media pulgada o soga de nylon de cinco octavos, sin nudos ni empates.',
  'Y sus extremos van a anclajes que aguanten la carga de todos los que se enganchan.',
  'Su diseño y su cálculo los hace una persona competente. Tú la instalas tal como está diseñada.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">línea de vida</span>', top=90) + svg(
  '<rect x="300" y="300" width="40" height="400" fill="#9aa5ae"/><rect x="1580" y="300" width="40" height="400" fill="#9aa5ae"/>'
  '<path class="dib" data-en="0" d="M340 320 Q960 360 1580 320" fill="none" stroke="#ffd166" stroke-width="8" style="--l:1300"/>'
  + trabajador(760, 620, 1.3) + '<line x1="760" y1="470" x2="760" y2="342" stroke="#facc15" stroke-width="5"/>'
  + trabajador(1160, 620, 1.3) + '<line x1="1160" y1="470" x2="1160" y2="342" stroke="#facc15" stroke-width="5"/>'
  f'<text class="ap" data-en="1" x="960" y="270" fill="#ffd166" font-size="30" {T} text-anchor="middle">cable de ½" o soga de nylon de ⅝" · sin nudos ni empates</text>')))

E.append(dict(frases=[
  'Revisa el arnés antes de cada uso: correas sin cortes, quemaduras ni costuras sueltas; hebillas y argollas sin deformarse; la etiqueta legible.',
  'Y una regla sin excepción: un arnés o una línea que ya detuvo una caída se descarta. Aunque se vea bien, ya no protege igual.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 55)], html=titulo('Revisa <span class="nar">antes de usar</span>', top=90) + lista([
  ('✂️', 'Correas sin <b class="nar">cortes ni quemaduras</b>'), ('🧵', 'Costuras <b class="nar">completas</b>'), ('🔩', 'Hebillas y argollas <b class="nar">sin deformar</b>'), ('🏷️', 'Etiqueta <b class="nar">legible</b>')],
  lambda i: 0, top=240, izq=360, der=360, tam=32) + badge('SI DETUVO UNA CAÍDA: SE DESCARTA', 1, 600, 720, '#ff6b6b', '✕')))

E.append(dict(frases=[
  'Ponerlo bien también importa. Las correas de las piernas ajustadas, que entre la mano plana y nada más. La argolla de la espalda entre los omóplatos.',
  'Un arnés flojo puede hacer que te salgas o te lastimes en la caída.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Póntelo <span class="nar">bien</span>', top=90) + svg(trabajador(960, 760, 2.4)) +
  badge('Piernas: entra la mano plana', 0, 1180, 560, '#5b8def', '✋') + badge('Argolla entre los omóplatos', 0, 1180, 380, '#5b8def', '◎')))

E.append(dict(frases=[
  'En la nave: seis arneses de cuerpo entero revisados y anotados, líneas en Y con amortiguador, y una línea de vida de cable de media pulgada a lo largo de cada arco, instalada antes de subir.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La obra: <span class="nar">sistema listo</span>', top=90) + tabla(
  ['Parte', 'En la nave'],
  [['Arnés', '6 de cuerpo entero · revisados'], ['Línea', 'En Y con amortiguador'], ['Anclaje', 'Línea de vida de cable ½" en cada arco']],
  lambda i: 0, top=280, izq=330, der=330, tam=32)))

E.append(dict(frases=[
  'Los cinco errores con el arnés.',
  'Uno: engancharse a un tubo o a una baranda.',
  'Dos: soltarse para pasar de un lado a otro.',
  'Tres: arnés flojo.',
  'Cuatro: amarrar la línea con un nudo.',
  'Y cinco: seguir usando un arnés que ya frenó una caída.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">con el arnés</span>', [
  ('Anclaje débil', 'Se rompe con la caída.'), ('Soltarse', 'Justo ahí te caes.'), ('Arnés flojo', 'Te sales o te lastimas.'), ('Nudos', 'Debilitan la línea.'), ('Arnés usado en caída', 'Ya no protege.')])))

E.append(dict(frases=[
  'Tu reto: revisa tu arnés con la lista de hoy y busca en tu próxima obra tres puntos de anclaje que sí aguanten.',
  'En la próxima clase: el espacio libre de caída. Un arnés bien puesto puede no salvarte si estás muy cerca del piso.',
], html=reto('🪢 Revisa tu <b class="nar">arnés</b> y busca<br>3 anclajes que sí aguanten', 'ESPACIO LIBRE')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: arnés, línea y anclaje, los tres bien.',
  '¡Nos vemos en la clase seis!',
], html=final('Siempre <span class="nar">enganchado</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c5')
