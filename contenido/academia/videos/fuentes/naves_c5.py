"""Curso Naves Parabólicas · Clase 5: Columnas, placas base y pernos de anclaje."""
import sys
from motor import render, EMBLEMA
from comun import CAJAS, parabola, titulo, pantalla

CURSO = 'NAVES PARABÓLICAS · CLASE 5'
E = []

def placa_svg(en=-1):
    """Corte de un apoyo: pedestal, grout, placa, tuercas y perno J."""
    return f'''
 <rect x="120" y="300" width="460" height="260" fill="#6b7f93"/>
 <rect class="ap" data-en="{en}" x="170" y="270" width="360" height="30" fill="#9ca3af"/>
 <rect x="150" y="238" width="400" height="32" fill="#cfd8e0"/>
 <rect x="290" y="40" width="120" height="198" fill="none" stroke="#f97316" stroke-width="12"/>
 <path d="M240 238 L290 160 L290 238 Z M460 238 L410 160 L410 238 Z" fill="#ffb27a"/>
 <g stroke="#ffd166" stroke-width="10" fill="none"><path d="M200 196 L200 470 Q200 520 250 520"/><path d="M500 196 L500 470 Q500 520 450 520"/></g>
 <rect x="184" y="270" width="32" height="14" fill="#ffd166"/><rect x="484" y="270" width="32" height="14" fill="#ffd166"/>
 <rect x="182" y="214" width="36" height="24" fill="#ffd166"/><rect x="482" y="214" width="36" height="24" fill="#ffd166"/>'''

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  'La mayoría de los dolores de cabeza del montaje nacen abajo, en el piso: un perno fuera de sitio, y el arco ya no calza.',
  '¡Bienvenido a la clase cinco! Hoy vemos las columnas, las placas base y los pernos de anclaje: dónde empieza una nave bien hecha.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 55, 55)], html=f'''
<svg style="position:absolute;left:1000px;top:200px" width="700" height="600" viewBox="0 0 700 600">{placa_svg(0)}</svg>
<div style="position:absolute;left:120px;top:300px;width:820px">
 <div class="paso pop" data-en="1"><b>5</b>CLASE 5 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Columnas, placas <span class="nar">y anclajes</span></h1>
</div>'''))

# 1. Respuesta del reto
E.append(dict(frases=[
  'Primero, la respuesta del reto. Nave de doce por veinticuatro, arco en ocho tramos.',
  'Ocho tramos son nueve nudos: nueve líneas de correa. Nueve por veinticuatro: doscientos dieciséis metros.',
  'Con seis arcos hay cinco paños, de cuatro metros ochenta. De arco a arco, un tramo por barra.',
  'Cinco paños por nueve líneas: cuarenta y cinco barras. ¿Te acordaste de la trampa del sobrante? ¡Bien hecho!',
], html=titulo('Respuesta <span class="nar">del reto</span>') + '''
<div style="position:absolute;left:420px;right:420px;top:300px;font-size:42px;line-height:1.9">
 <div class="ap" data-en="1">8 tramos → <b style="color:#ffd166">9 líneas</b> · 9 × 24 = <b style="color:#ffd166">216 m</b></div>
 <div class="ap" data-en="2">6 arcos → <b style="color:#ffd166">5 paños de 4.80 m</b></div>
 <div class="ap" data-en="3">5 × 9 = <b style="color:#ffd166">45 barras</b> (un tramo por barra)</div>
</div>'''))

# 2. Columnas
E.append(dict(frases=[
  'Las columnas reciben tres cosas: el peso del techo, el empuje del arco hacia afuera, y el viento.',
  'Por eso, aunque el arco sea liviano, las columnas son las piezas más grandes de la nave.',
  'En InnovApp, para quince metros salen tubos de seis por seis pulgadas, y para veinte, de ocho por ocho.',
  'En el Asistente puedes elegir columnas metálicas, que se arman en el taller, o columnas de concreto armado, donde el arco se apoya en una plancha embebida.',
  'Y la altura: normalmente entre cuatro y medio y seis metros. Si entran camiones, piensa en seis o más.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 60), (4, 1.0, 50, 50)], html=titulo('Las <span class="nar">columnas</span>', top=110) + '''
<div style="position:absolute;left:150px;right:150px;top:250px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px;text-align:center">
 <div class="tarjeta ap" data-en="0" data-mas="1"><div style="font-size:60px">⬇️</div><b style="font-size:31px">Peso del techo</b></div>
 <div class="tarjeta ap" data-en="0" data-mas="2.5"><div style="font-size:60px">↔️</div><b style="font-size:31px">Empuje del arco</b></div>
 <div class="tarjeta ap" data-en="0" data-mas="4"><div style="font-size:60px">🌬️</div><b style="font-size:31px">Viento</b></div>
</div>
<div style="position:absolute;left:150px;right:150px;top:520px;display:grid;grid-template-columns:1fr 1fr;gap:26px">
 <div class="tarjeta ap" data-en="2" style="font-size:28px"><b class="nar" style="font-size:32px">Metálicas (tubo)</b><br>Se arman en taller · 15 m → tubo 6"×6" · 20 m → 8"×8"</div>
 <div class="tarjeta ap" data-en="3" data-mas="3" style="font-size:28px"><b class="nar" style="font-size:32px">Concreto armado</b><br>El arco se apoya en una plancha embebida</div>
</div>'''))

# 3. Placa base y perno J
E.append(dict(frases=[
  'Ahora la placa base. Es una plancha de acero soldada al pie de la columna, con cartelas que la rigidizan.',
  'Se fija al concreto con pernos de anclaje tipo jota: el gancho de abajo queda embebido en el concreto y no deja que el perno se salga.',
  'Y algo que muchos olvidan: el viento no solo empuja, también succiona el techo hacia arriba. Los pernos son los que evitan que la nave se levante.',
  'InnovApp calcula los pernos contra ese levantamiento por viento. Normalmente son cuatro por placa, de cinco octavos o más, según el cálculo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.07, 25, 62), (2, 1.0, 50, 50)], html=f'''
<svg style="position:absolute;left:120px;top:220px" width="800" height="680" viewBox="0 0 700 600">{placa_svg(-1)}
 <g class="pop" data-en="0" data-mas="1"><text x="580" y="260" fill="#cfd8e0" font-size="26" font-weight="800">placa base</text></g>
 <g class="pop" data-en="0" data-mas="2.5"><text x="420" y="150" fill="#ffb27a" font-size="26" font-weight="800">cartela</text></g>
 <g class="pop" data-en="1"><text x="20" y="420" fill="#ffd166" font-size="26" font-weight="800">perno J</text></g>
</svg>
<div style="position:absolute;left:980px;top:200px;width:820px">
 <h2 class="t ap" data-en="0">Placa base <span class="nar">y perno J</span></h2>
 <div class="tarjeta ap" data-en="1" style="margin-top:26px;font-size:28px;line-height:1.45">El <b class="nar">gancho</b> queda embebido: el perno no se sale</div>
 <div class="tarjeta ap" data-en="2" style="margin-top:18px;font-size:28px;line-height:1.45">🌬️ El viento también <b class="nar">succiona</b> el techo hacia arriba</div>
 <div class="tarjeta ap" data-en="3" style="margin-top:18px;font-size:28px;line-height:1.45">InnovApp calcula los pernos contra el <b class="nar">levantamiento</b> · típico 4 por placa</div>
</div>'''))

# 4. Plantilla de pernos y vaciado
E.append(dict(frases=[
  'El secreto para que los pernos queden perfectos: la plantilla de pernos.',
  'Es una plancha o un triplay con los agujeros exactamente donde van los pernos, igual que la placa base.',
  'La fijas al encofrado, alineada con los ejes, y metes los pernos con sus tuercas. Así no se mueven al vaciar el concreto.',
  'Y protege las roscas con cinta o un tubo. Una rosca llena de concreto te hace perder horas en el montaje.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 50)], html=titulo('La plantilla <span class="nar">de pernos</span>', top=110) + '''
<svg style="position:absolute;left:560px;top:250px" width="800" height="440" viewBox="0 0 800 440">
 <rect class="ap" data-en="1" x="200" y="60" width="400" height="320" rx="10" fill="#c8a165" stroke="#8a6a3a" stroke-width="6"/>
 <g class="pop" data-en="1" data-mas="1">''' + ''.join(f'<circle cx="{x}" cy="{yy}" r="18" fill="#061a2c"/>' for x, yy in [(270, 130), (530, 130), (270, 310), (530, 310)]) + '''</g>
 <g class="ap" data-en="2"><line x1="100" y1="220" x2="700" y2="220" stroke="#5cc8ff" stroke-width="3" stroke-dasharray="12 8"/><line x1="400" y1="20" x2="400" y2="420" stroke="#5cc8ff" stroke-width="3" stroke-dasharray="12 8"/>
  <text x="710" y="214" fill="#5cc8ff" font-size="26" font-weight="800">eje</text></g>
 <g class="pop" data-en="2" data-mas="2">''' + ''.join(f'<circle cx="{x}" cy="{yy}" r="12" fill="#ffd166"/>' for x, yy in [(270, 130), (530, 130), (270, 310), (530, 310)]) + '''</g>
</svg>
<div style="position:absolute;left:0;right:0;top:730px;display:flex;justify-content:center;gap:20px">
 <div class="paso pop" data-en="2" style="background:#3f9e5a"><b>✓</b>FIJA AL ENCOFRADO</div><div class="paso pop" data-en="3" style="background:#3f9e5a"><b>✓</b>ROSCAS PROTEGIDAS</div>
</div>'''))

# 5. Tolerancias y control
E.append(dict(frases=[
  'Antes de montar, controla los pernos. Tres medidas.',
  'Uno: la distancia entre pernos de una misma placa. Máximo unos tres milímetros de error.',
  'Dos: el grupo de pernos respecto al eje. Máximo unos seis milímetros.',
  'Y tres: la proyección: cuánto sale el perno. Debe alcanzar para la tuerca de nivelación, la placa, la arandela, la tuerca, y dos o tres hilos libres.',
  'Y mide las diagonales entre ejes. Si las diagonales no son iguales, la nave no está a escuadra.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 60), (4, 1.0, 50, 50)], html=titulo('Control <span class="nar">antes de montar</span>', top=110) + '''
<div style="position:absolute;left:260px;right:260px;top:250px">''' +
 ''.join(f'<div class="ap" data-en="{i+1}" style="display:grid;grid-template-columns:70px 1fr 260px;align-items:center;gap:20px;background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.45);border-radius:18px;padding:16px 24px;margin:14px 0">'
         f'<span class="paso" style="font-size:22px;padding:8px"><b>{i+1}</b></span><div style="font-size:30px;font-weight:800">{t}</div><div style="font-size:34px;font-weight:900;color:#ffd166;text-align:right">{r}</div></div>'
         for i, (t, r) in enumerate([('Entre pernos de una placa', '± 3 mm'), ('Grupo de pernos vs. eje', '± 6 mm'), ('Proyección: 2 tuercas + placa + arandela', '+ 2-3 hilos'), ('Diagonales entre ejes', 'iguales')])) + '</div>'))

# 6. Nivelación y grout
E.append(dict(frases=[
  'Ahora, cómo se asienta la placa. Primero, las tuercas de nivelación debajo de la placa. Con ellas dejas la placa perfectamente a nivel y a la altura correcta.',
  'Encima, la arandela y la tuerca, bien ajustadas.',
  'Y al final, el grout: un mortero sin contracción que rellena el espacio entre la placa y el concreto, de dos a cinco centímetros.',
  'Sin grout, la placa se apoya solo en cuatro tuercas, y todo el peso de la columna se concentra ahí.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 25, 55), (3, 1.0, 50, 50)], html=f'''
<svg style="position:absolute;left:120px;top:220px" width="800" height="680" viewBox="0 0 700 600">{placa_svg(2)}</svg>
<div style="position:absolute;left:980px;top:220px;width:820px">
 <h2 class="t ap" data-en="0">Nivelación <span class="nar">y grout</span></h2>
 <div class="tarjeta ap" data-en="0" data-mas="1" style="margin-top:26px;font-size:28px">① Tuercas de <b class="nar">nivelación</b> bajo la placa</div>
 <div class="tarjeta ap" data-en="1" style="margin-top:18px;font-size:28px">② Arandela y tuerca <b class="nar">encima</b></div>
 <div class="tarjeta ap" data-en="2" style="margin-top:18px;font-size:28px">③ <b class="nar">Grout</b> sin contracción: 2 a 5 cm</div>
 <div class="paso pop" data-en="3" style="margin-top:26px;background:#ff6b6b;font-size:22px"><b>✕</b>SIN GROUT: TODO EL PESO EN 4 TUERCAS</div>
</div>'''))

# 7. InnovApp: zapatas
E.append(pantalla('p19_resumen', ['Y abajo de todo, las zapatas. En el Resumen de InnovApp tienes la cimentación ya calculada: las zapatas, la excavación, el concreto y el fierro.', 'Con esto presupuestas también la obra civil, no solo el acero.'], None, 'Zapatas · Resumen de InnovApp', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.5, 50, 38)]
E[-1]['fundido'] = True

# 8. Errores
errores = [('Pernos sin plantilla', 'Se mueven al vaciar: el arco ya no calza.'), ('Rosca corta', 'No alcanza para nivelar ni para la tuerca.'),
           ('Roscas sin proteger', 'Llenas de concreto: horas perdidas en el montaje.'), ('Placa sin grout', 'Todo el peso en cuatro tuercas.'),
           ('No medir diagonales', 'La nave sale fuera de escuadra.')]
E.append(dict(frases=[
  'Cinco errores en los anclajes.',
  'Uno: pernos sin plantilla.',
  'Dos: rosca muy corta.',
  'Tres: roscas sin proteger durante el vaciado.',
  'Cuatro: placa sin grout.',
  'Y cinco: no medir las diagonales entre ejes.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=titulo('5 errores <span class="nar">en los anclajes</span>', top=110) +
 '<div style="position:absolute;left:220px;right:220px;top:230px">' +
 ''.join(f'<div class="ap" data-en="{i+1}" style="display:flex;gap:22px;align-items:center;background:rgba(255,93,93,.08);border:2px solid rgba(255,107,107,.55);border-radius:18px;padding:14px 24px;margin:12px 0">'
         f'<span style="background:#ff6b6b;color:#fff;font-weight:900;font-size:30px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:none">✕</span>'
         f'<div><div style="font-size:33px;font-weight:900">{t}</div><div style="font-size:25px;color:#c9d6e3">{d}</div></div></div>' for i, (t, d) in enumerate(errores)) + '</div>'))

# 9. Reto
E.append(dict(frases=[
  '¡Tu reto! Para nuestra nave de quince por treinta, con siete arcos.',
  '¿Cuántas columnas, cuántas placas base, y cuántos pernos, si van cuatro por placa?',
  'Y el bonus: dibuja la plantilla de pernos en un triplay. Respuestas, en la próxima clase.',
], html='''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:380px;right:380px;top:300px;font-size:36px;line-height:1.6">
 <div>🏗️ Nave <b class="nar">15 × 30 m</b> · <b class="nar">7 arcos</b></div>
 <div class="ap" data-en="1">🔩 ¿Columnas? ¿Placas? ¿Pernos (4 por placa)?</div>
 <div class="ap" data-en="2">⭐ Dibuja la plantilla de pernos</div>
</div>'''))

# 10. Cierre
E.append(dict(antes=0.3, despues=2.4, frases=[
  'Resumiendo: columnas que aguantan peso, empuje y viento; placas con cartelas; pernos jota contra el levantamiento.',
  'Plantilla de pernos, control de medidas, tuercas de nivelación y grout. Así el arco calza a la primera.',
  'En la próxima clase vamos al taller: trazado en el piso y fabricación de todos los arcos. ¡Nos vemos!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:220px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">¡Clase 5 <span class="nar">completada</span>!</h2>
 <div class="ap" data-en="2" style="margin-top:26px;font-size:34px;color:#c9d6e3;font-weight:600">Siguiente: <b style="color:#fff">Clase 6 · Trazado en piso y fabricación en taller</b></div>
 <div class="paso pop" data-en="1" data-mas="0.6" style="margin-top:36px;font-size:26px"><b>↓</b>MATERIAL: CHECKLIST DE MONTAJE (PDF)</div>
 <div class="ap" data-en="2" data-mas="3" style="margin-top:42px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c5.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
