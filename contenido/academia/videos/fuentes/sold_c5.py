"""Soldadura Estructural · Clase 5: El cordón perfecto — ángulo, velocidad y movimiento."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 5'
E = []
P = '#7d8f9f'; S = '#f97316'

E.append(dict(antes=0.5, frases=[
  'El cordón del maestro parece escamas de pescado...',
  '...y el tuyo, un gusano torcido. Misma máquina, mismo electrodo. ¿Cuál es la diferencia? La mano.',
  'Hoy aprendes las cinco cosas que controlan un cordón perfecto. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Escamas', 'o gusano', 5, 'EL CORDÓN PERFECTO')))

E.append(escena_obra(4, [
  'En nuestro almacén ya preparamos las juntas: limpias, punteadas y con bisel donde hace falta.',
  'Ahora sí: a soldar. Y cada cordón tiene que salir parejo, porque hay cientos de nudos en esta nave.',
], 'Hoy: <span class="nar">la técnica del cordón</span>'))

E.append(dict(frases=[
  'Un cordón depende de cinco cosas. Apréndelas como un chequeo.',
  'Uno: el amperaje, que ya vimos en la clase tres.',
  'Dos: el largo del arco, más o menos el diámetro del electrodo.',
  'Tres: el ángulo del electrodo.',
  'Cuatro: el movimiento de la mano.',
  'Y cinco: la velocidad de avance. Las tres últimas son las de hoy.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las <span class="nar">5 claves</span> del cordón', top=110) +
 '<div style="position:absolute;left:120px;right:120px;top:300px;display:grid;grid-template-columns:repeat(5,1fr);gap:20px">' + ''.join(
  f'<div class="tarjeta pop" data-en="{i+1}" style="text-align:center;min-height:300px;{"border-color:#ffd166;box-shadow:0 0 0 3px #ffd166 inset" if i >= 2 else ""}"><div style="font-size:70px">{e}</div><div style="font-size:30px;font-weight:900;margin-top:10px">{t}</div><div style="font-size:22px;color:#c9d6e3;margin-top:8px">{d}</div></div>'
  for i, (e, t, d) in enumerate([('⚡', 'Amperaje', 'Clase 3'), ('📏', 'Largo de arco', '≈ diámetro'), ('📐', 'Ángulo', 'Hoy'), ('〰️', 'Movimiento', 'Hoy'), ('⏱️', 'Velocidad', 'Hoy')])) + '</div>'))

E.append(dict(frases=[
  'El ángulo tiene dos partes. Primero, el ángulo de trabajo: hacia dónde apuntas, mirando de frente la junta.',
  'En una junta en T, apunta al medio: cuarenta y cinco grados entre las dos piezas. Así el calor se reparte en las dos.',
  'Segundo, el ángulo de avance: inclina el electrodo de cinco a quince grados hacia atrás, y arrástralo. Con electrodo, se jala, no se empuja.',
  'Si lo inclinas demasiado, la escoria se adelanta al charco y queda atrapada.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 30, 55), (2, 1.06, 72, 55)], html=titulo('El <span class="nar">ángulo</span>', top=110) + f'''
<div class="tarjeta ap" data-en="0" style="position:absolute;left:150px;top:250px;width:760px;text-align:center">
 <svg width="560" height="380" viewBox="0 0 560 380"><rect x="40" y="280" width="480" height="50" fill="{P}"/><rect x="250" y="60" width="50" height="220" fill="{P}"/>
 <g class="ap" data-en="1"><line x1="250" y1="280" x2="110" y2="140" stroke="#d9d2c5" stroke-width="16" stroke-linecap="round"/>
 <path d="M200 280 A 50 50 0 0 1 215 245" fill="none" stroke="#ffd166" stroke-width="4"/><text x="160" y="250" fill="#ffd166" font-size="32" font-weight="900">45°</text></g></svg>
 <div style="font-size:32px;font-weight:900">Ángulo de trabajo</div></div>
<div class="tarjeta ap" data-en="2" style="position:absolute;left:1010px;top:250px;width:760px;text-align:center">
 <svg width="560" height="380" viewBox="0 0 560 380"><rect x="20" y="260" width="520" height="60" fill="{P}"/><line x1="60" y1="258" x2="300" y2="258" stroke="{S}" stroke-width="16" stroke-linecap="round"/>
 <line x1="300" y1="255" x2="350" y2="60" stroke="#b9c3cc" stroke-width="16" stroke-linecap="round"/><line x1="300" y1="255" x2="300" y2="60" stroke="#ffffff55" stroke-width="3" stroke-dasharray="10 8"/>
 <text x="345" y="150" fill="#ffd166" font-size="30" font-weight="900">5–15°</text><text x="430" y="230" fill="#7ee08a" font-size="44" font-weight="900">→</text><text x="400" y="200" fill="#7ee08a" font-size="24" font-weight="800">avance</text></svg>
 <div style="font-size:32px;font-weight:900">Ángulo de avance: <span class="nar">se arrastra</span></div></div>'''))

E.append(dict(frases=[
  'El movimiento. Para la raíz y para la mayoría de cordones con siete cero dieciocho en plano: cordón recto, sin vaivén. Avanzas parejo.',
  'Para rellenar juntas anchas, o en vertical: un vaivén. Zigzag, media luna o triángulo.',
  'Regla del siete cero dieciocho: el vaivén no debe pasar de dos y media a tres veces el diámetro del electrodo. Con tres punto dos, unos ocho a diez milímetros.',
  'Y en vertical, el siete cero dieciocho siempre se suelda subiendo, de abajo hacia arriba, con una pequeña pausa en cada borde.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('El <span class="nar">movimiento</span>', top=110) + f'''
<svg style="position:absolute;left:160px;top:270px" width="1600" height="420" viewBox="0 0 1600 420">
 <g class="ap" data-en="0"><text x="180" y="30" fill="#fff" font-size="32" font-weight="900" text-anchor="middle">Recto</text>
  <path class="dib" data-en="0" d="M60 200 L300 200" stroke="{S}" stroke-width="12" fill="none" stroke-linecap="round" style="--l:240"/></g>
 <g class="ap" data-en="1"><text x="580" y="30" fill="#fff" font-size="32" font-weight="900" text-anchor="middle">Zigzag</text>
  <path class="dib" data-en="1" d="M460 200 l20 -50 l20 100 l20 -100 l20 100 l20 -100 l20 100 l20 -100 l20 100 l20 -100 l20 100 l20 -50" stroke="{S}" stroke-width="10" fill="none" stroke-linecap="round" style="--l:1300"/></g>
 <g class="ap" data-en="1" data-mas="1"><text x="980" y="30" fill="#fff" font-size="32" font-weight="900" text-anchor="middle">Media luna</text>
  <path class="dib" data-en="1" data-mas="1" d="M860 150 q20 100 40 0 q20 100 40 0 q20 100 40 0 q20 100 40 0 q20 100 40 0 q20 100 40 0" stroke="{S}" stroke-width="10" fill="none" stroke-linecap="round" style="--l:800"/></g>
 <g class="ap" data-en="1" data-mas="2"><text x="1380" y="30" fill="#fff" font-size="32" font-weight="900" text-anchor="middle">Triángulo</text>
  <path class="dib" data-en="1" data-mas="2" d="M1260 230 l30 -80 l30 80 l30 -80 l30 80 l30 -80 l30 80 l30 -80 l20 50" stroke="{S}" stroke-width="10" fill="none" stroke-linejoin="round" style="--l:900"/></g>
</svg>''' + badge('VAIVÉN MÁX. 2.5 – 3 × DIÁMETRO · 3.2 mm → 8 a 10 mm', 2, 400, 600, '#5cc8ff', '↔') + badge('7018 EN VERTICAL: SIEMPRE SUBIENDO ↑', 3, 560, 700, '#3f9e5a', '↑')))

E.append(dict(frases=[
  'La velocidad. Mira el charco, no el arco. El charco te dice si vas bien.',
  'Si vas muy rápido: cordón angosto, alto, con poca fusión en los bordes.',
  'Si vas muy lento: cordón gordo, mucho calor, la pieza se deforma y la escoria se mete delante del charco.',
  'La velocidad correcta deja un cordón de más o menos dos a tres veces el diámetro del electrodo, con ondas parejas, como escamas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.08, 45, 38), (2, 1.08, 45, 72), (3, 1.08, 45, 55)], html=titulo('La <span class="nar">velocidad</span>', top=110) +
 cordon(260, 250, 900, 'bajo', 1, etiqueta='❌ Muy rápido: angosto, alto, poca fusión', color_et='#ff6b6b') +
 cordon(260, 470, 900, 'ok', 3, etiqueta='✅ Justo: 2 a 3 veces el diámetro, ondas parejas', color_et='#7ee08a') +
 cordon(260, 690, 900, 'alto', 2, etiqueta='❌ Muy lento: gordo, mucho calor, se deforma', color_et='#ff6b6b')))

E.append(dict(frases=[
  'Dos detalles que separan al maestro del aprendiz.',
  'Al terminar un cordón, no levantes de golpe: haz una pequeña pausa, o regresa un poquito, para llenar el cráter. Un cráter hundido es donde nacen las fisuras.',
  'Y al cambiar de electrodo, pica la escoria, prende el arco un centímetro antes del cráter, y regresa para empalmar. Así no queda un bulto ni un hueco.',
  'Y entre pasada y pasada: pica y escobilla toda la escoria. Escoria que se queda, es un defecto adentro.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Detalles de <span class="nar">maestro</span>', top=110) + tarjetas([
  ('🕳️', 'Llena el cráter', 'Pausa al terminar · ahí nacen las fisuras'), ('🔗', 'Empalme limpio', 'Prende 1 cm antes y regresa'), ('🧹', 'Limpia entre pasadas', 'Pica y escobilla toda la escoria')],
  lambda i: i + 1, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Cómo practicar. Toma una plancha de seis milímetros, y suelda diez cordones rectos, uno al lado del otro, cada uno tapando la mitad del anterior.',
  'Con siete cero dieciocho de tres punto dos, a unos ciento veinte amperios. El cordón debe salir de unos siete a nueve milímetros de ancho.',
  'Cuando los diez salgan iguales, pasa a filetes en T. Y después, a vertical subiendo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=CSS + titulo('Practica: <span class="nar">10 cordones</span>', top=110) + escena_soldando(700, 760, 700, en=0, dur=10) +
 lista([('🟧', 'Plancha de <b>6 mm</b> · 10 cordones rectos'), ('½', 'Cada uno tapa la <b>mitad</b> del anterior'), ('⚡', '7018 de 3.2 mm · <b>≈ 120 A</b> · ancho 7 a 9 mm'), ('➡️', 'Luego filete en T → vertical subiendo')],
  lambda i: [0, 0, 1, 2][i], top=230, izq=120, der=1000, tam=28)))

E.append(dict(frases=[
  'Los cinco errores del cordón.',
  'Uno: arco largo. Salpica y llena de poros.',
  'Dos: velocidad dispareja. Un tramo gordo, otro flaco.',
  'Tres: no picar la escoria entre pasadas.',
  'Cuatro: dejar el cráter hundido al final.',
  'Y cinco: vaivén demasiado ancho con el siete cero dieciocho.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">del cordón</span>', [
  ('Arco largo', 'Salpicadura y poros.'), ('Velocidad dispareja', 'Tramos gordos y flacos.'), ('Escoria sin picar', 'Inclusiones de escoria adentro.'),
  ('Cráter hundido', 'Ahí empiezan las fisuras.'), ('Vaivén muy ancho', 'Más calor y defectos con el 7018.')])))

E.append(dict(frases=[
  'Tu reto: haz los diez cordones de práctica, límpialos bien, y mándanos una foto de cerca, con buena luz.',
  'Te decimos cómo mejorar. Y en la próxima clase: soldar los nudos del arco sin que el arco se tuerza.',
], html=reto('🔥 10 cordones rectos en plancha de 6 mm:<br><b class="nar">foto de cerca, limpios y con buena luz</b>', 'NUDOS DEL ARCO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: mira el charco, controla la mano, y el cordón sale solo.',
  '¡Nos vemos en la clase seis!',
], html=final('Mira el charco, <span class="nar">no el arco</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c5')
