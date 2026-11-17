"""Soldadura Estructural · Clase 12: Prepárate para la prueba de calificación de soldador."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 12'
E = []

E.append(dict(antes=0.5, frases=[
  'Te salió un trabajo grande, en una minera o una fábrica...',
  '...y te piden: "soldador calificado, con su certificado". No basta con decir que sueldas bien. Hay que demostrarlo.',
  'En esta última clase aprendes cómo es la prueba de calificación, y cómo prepararte para aprobarla. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Demuéstralo', 'con papel', 12, 'CERTIFICACIÓN')))

E.append(escena_obra(3, [
  'Llegamos a la última clase del módulo avanzado.',
  'Lo que aprendiste en todo el curso se pone a prueba aquí: en una plancha, frente a un inspector.',
], 'Hoy: <span class="nar">la calificación de soldador</span>', ETAPAS_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Primero, tres palabras que vas a escuchar. W P S: la especificación del procedimiento de soldadura. Es la receta: proceso, electrodo, amperaje, junta, posiciones.',
  'P Q R: el registro que demuestra que esa receta funciona. Cuando la empresa usa un procedimiento precalificado de la AWS D uno punto uno, no siempre lo necesita.',
  'Y la calificación del soldador: la prueba de que tú puedes seguir esa receta y dejar una soldadura sana. Esa es la tuya.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Tres <span class="nar">documentos</span>', top=110) + tarjetas([
  ('📋', 'WPS', 'La receta: proceso, electrodo, amperaje, junta'), ('🧪', 'PQR', 'Prueba de que la receta funciona'), ('👷', 'Calificación del soldador', 'Prueba de que TÚ la sigues bien')],
  lambda i: i, top=290, cols=3, alto=330, izq=200)))

E.append(dict(frases=[
  'Una prueba muy común con la AWS D uno punto uno: dos planchas de diez milímetros, tres octavos de pulgada, con bisel en V y una platina de respaldo abajo.',
  'Se suelda en la posición que te piden. Si apruebas en vertical y en sobre cabeza, tres G y cuatro G, quedas calificado para soldar planchas en todas las posiciones.',
  'Con la plancha de diez milímetros quedas calificado para espesores limitados. Para cualquier espesor, la prueba es con plancha de una pulgada.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La <span class="nar">prueba</span>', top=110) + '''
<svg style="position:absolute;left:460px;top:270px" width="1000" height="360" viewBox="0 0 1000 360">
 <g class="ap" data-en="0"><polygon points="60,100 430,100 470,260 60,260" fill="#7d8f9f"/><polygon points="530,260 570,100 940,100 940,260" fill="#7d8f9f"/>
 <rect x="420" y="260" width="160" height="30" fill="#5cc8ff"/><text x="500" y="330" fill="#5cc8ff" font-size="28" font-weight="900" text-anchor="middle">respaldo</text>
 <text x="500" y="70" fill="#ffd166" font-size="30" font-weight="900" text-anchor="middle">plancha 10 mm · bisel en V</text></g>
</svg>''' + badge('3G + 4G = PLANCHAS EN TODAS LAS POSICIONES', 1, 520, 700, '#3f9e5a', '✓')))

E.append(dict(frases=[
  '¿Cómo te evalúan? Primero, inspección visual, con los criterios que vimos en la clase siete: sin fisuras, sin socavación profunda, cráter lleno.',
  'Después cortan probetas de tu plancha y las doblan en forma de U, ciento ochenta grados. Una por la cara, otra por la raíz.',
  'Si al doblar se abre una grieta de más de unos tres milímetros, desapruebas. Ahí salen todos los defectos escondidos: falta de fusión, escoria, poros.',
  'Algunas empresas, en lugar de doblar, toman una radiografía de la plancha.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Cómo te <span class="nar">evalúan</span>', top=110) +
 '<div style="position:absolute;left:150px;right:150px;top:320px;display:flex;justify-content:space-between">' + ''.join(
  f'<div class="pop" data-en="{e}" style="text-align:center;width:360px"><div style="font-size:80px">{ic}</div><div style="font-size:30px;font-weight:900;margin-top:10px">{t}</div><div style="font-size:23px;color:#c9d6e3">{d}</div></div>'
  for ic, t, d, e in [('👁️', 'Inspección visual', 'Criterios de la clase 7', 0), ('🔪', 'Cortan probetas', 'Cara y raíz', 1), ('🧲', 'Doblez a 180°', 'Grieta > 3 mm = desaprueba', 2), ('☢️', 'O radiografía', 'Según la empresa', 3)]) + '</div>'))

E.append(dict(frases=[
  'La clave para aprobar es la raíz. Si la raíz no funde bien contra el respaldo y los dos biseles, la probeta de raíz se abre.',
  'Practica la raíz una y otra vez: abertura pareja, arco corto, y que el charco "muerda" los dos lados.',
  'Entre pasada y pasada, limpia toda la escoria y revisa. Una escoria olvidada abre la probeta de cara.',
  'Y no te apures en el relleno: pasadas parejas, sin sobrecalentar la plancha.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La clave: <span class="nar">la raíz</span>', top=110) + lista([
  ('🎯', 'Raíz fundida contra el <b>respaldo y los dos biseles</b>'), ('📏', 'Abertura pareja · <b>arco corto</b> · que muerda los 2 lados'), ('🧹', '<b>Limpia toda la escoria</b> entre pasadas'), ('🌡️', 'Relleno parejo, <b>sin sobrecalentar</b>')],
  lambda i: i, top=270, izq=320, der=320, tam=31)))

E.append(dict(frases=[
  'Un plan de práctica de cuatro semanas. Semana uno: cordones y filetes en plano y vertical, como en las clases cinco y nueve.',
  'Semana dos: raíces con respaldo, en plano. Córtalas y dóblalas tú mismo en una prensa o con una comba.',
  'Semana tres: la plancha completa en vertical. Semana cuatro: sobre cabeza, y simulacros con tiempo.',
  'Y la noche antes: duerme bien. Un pulso firme vale más que una hora extra de práctica cansado.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Plan de <span class="nar">4 semanas</span>', top=110) + tabla(
  ['Semana', 'Práctica'], [['1', 'Cordones y filetes en plano y vertical'], ['2', 'Raíces con respaldo · corta y dobla'], ['3', 'Plancha completa en vertical (3G)'], ['4', 'Sobre cabeza (4G) · simulacros con tiempo']],
  lambda i: [0, 1, 2, 2][i], top=270, izq=330, der=330, tam=33) + badge('LA NOCHE ANTES: DUERME BIEN', 3, 700, 700, '#3f9e5a', 'Z')))

E.append(dict(frases=[
  'Y una buena noticia: según la AWS D uno punto uno, la calificación del soldador no vence, mientras sigas soldando con ese proceso. Si pasas más de seis meses sin usarlo, se pierde.',
  'Guarda tu certificado y lleva un registro de tus trabajos. Es tu carta de presentación para los trabajos mejor pagados.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Cuánto <span class="nar">dura</span>?', top=110) + tarjetas([
  ('♾️', 'No vence', 'Mientras sigas soldando con ese proceso'), ('⏳', '6 meses sin usarlo', 'Se pierde'), ('📁', 'Guarda tu certificado', 'Y un registro de trabajos')],
  lambda i: [0, 0, 1][i], top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Los cinco errores en la prueba.',
  'Uno: llegar sin haber practicado la raíz con respaldo.',
  'Dos: arco largo, por los nervios.',
  'Tres: dejar escoria entre pasadas.',
  'Cuatro: el respaldo mal punteado o con luz, que se mueve.',
  'Y cinco: llegar cansado o apurado.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en la prueba</span>', [
  ('Sin practicar la raíz', 'La probeta de raíz se abre.'), ('Arco largo por nervios', 'Poros y falta de fusión.'), ('Escoria entre pasadas', 'Se abre la probeta de cara.'),
  ('Respaldo mal punteado', 'Se mueve y la raíz falla.'), ('Cansado o apurado', 'El pulso no ayuda.')])))

E.append(dict(frases=[
  'Tu reto final: haz una raíz con respaldo en plancha de diez milímetros, córtala y dóblala. Mándanos la foto de la probeta doblada.',
  'Te decimos si pasaría la prueba.',
], html=reto('🔥 Raíz con respaldo en plancha de 10 mm:<br><b class="nar">córtala, dóblala y manda la foto</b>', 'TU CERTIFICADO')))

E.append(dict(antes=0.3, despues=3.0, frases=[
  '¡Felicitaciones! Terminaste el curso completo de Soldadura Estructural, con el módulo avanzado.',
  'Ahora, a practicar, a calificarte, y a conseguir los trabajos que pagan mejor. ¡Éxitos!',
], html=final('¡Curso <span class="nar">completado</span>!')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c12')
