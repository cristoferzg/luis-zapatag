"""Portones Automáticos · Clase 4: Motor y cremallera del corredizo."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 4'
E = []

def pinon_cremallera(en_holgura=1):
    s = ''
    # cremallera
    s += '<rect x="420" y="560" width="1080" height="46" fill="#e8e8e8"/>'
    for k in range(30):
        s += f'<polygon points="{430+k*36},560 {442+k*36},530 {454+k*36},530 {466+k*36},560" fill="#e8e8e8"/>'
    # piñón
    s += '<g><circle cx="960" cy="430" r="92" fill="#9aa5ae" stroke="#2b3a47" stroke-width="6"/>'
    import math
    for k in range(16):
        a = 2 * math.pi * k / 16
        x, y = 960 + 100 * math.cos(a), 430 + 100 * math.sin(a)
        s += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="14" fill="#9aa5ae"/>'
    s += '<circle cx="960" cy="430" r="22" fill="#2b3a47"/></g>'
    s += f'<g class="ap" data-en="{en_holgura}"><line x1="1120" y1="514" x2="1120" y2="530" stroke="#ffd166" stroke-width="5"/>'
    s += f'<text x="1150" y="500" fill="#ffd166" font-size="34" {T}>holgura 1 a 2 mm</text></g>'
    s += f'<text x="960" y="680" fill="#c9d6e3" font-size="28" {T} text-anchor="middle">cremallera (en la hoja)</text>'
    s += f'<text x="960" y="300" fill="#c9d6e3" font-size="28" {T} text-anchor="middle">piñón (en el motor)</text>'
    return svg(s)

E.append(dict(antes=0.5, frases=[
  'Clac, clac, clac. El portón avanza a saltos y la cremallera se come los dientes del piñón.',
  'Casi siempre es lo mismo: la cremallera mal colocada, apoyada sobre el piñón o con los empalmes desalineados.',
  'Hoy instalas el motor y la cremallera como un profesional. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Clac, clac, clac', 'la cremallera mal puesta', 4, 'EL MOTOR CORREDIZO', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">⚙️</div>')))

E.append(obra(3, [
  'La hoja ya corre suave con una mano.',
  'Hoy: la base del motor, la cremallera y los fines de carrera.',
], 'Hoy: <span class="nar">base, cremallera y fines de carrera</span>'))

E.append(dict(frases=[
  'El motor va sobre una base de concreto, a un costado del vano, del lado donde se abre la hoja.',
  'Un dado de unos cuarenta por treinta centímetros y treinta de profundidad, con la placa de anclaje del motor nivelada en la parte de arriba.',
  'Antes de vaciar el concreto, deja el tubo para los cables. Después es tarde.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('La base <span class="nar">del motor</span>', top=90) + svg(
  '<rect x="0" y="470" width="1920" height="230" fill="#3a4651"/>'
  '<rect class="ap" data-en="1" x="760" y="420" width="400" height="250" fill="#8a8f96" stroke="#5c6168" stroke-width="5"/>'
  '<rect class="ap" data-en="1" data-mas="0.4" x="800" y="405" width="320" height="16" fill="#c9d6e3"/>'
  '<path class="dib" data-en="2" d="M1100 460 L1100 620 L1500 620" fill="none" stroke="#ffb020" stroke-width="14" style="--l:600"/>'
  f'<text class="ap" data-en="1" x="730" y="560" fill="#fff" font-size="30" {T} text-anchor="end">dado ≈ 40 × 30 × 30 cm</text>'
  f'<text class="ap" data-en="2" x="1520" y="610" fill="#ffb020" font-size="30" {T}>tubo para cables</text>'
  f'<text class="ap" data-en="1" data-mas="0.4" x="960" y="385" fill="#c9d6e3" font-size="28" {T} text-anchor="middle">placa nivelada</text>')))

E.append(dict(frases=[
  'La distancia del motor a la hoja y la altura de la placa no se inventan: vienen en el manual del motor, con un dibujo y medidas.',
  'Sigue ese dibujo al milímetro. Cada marca tiene la suya, y de eso depende que el piñón y la cremallera engranen bien.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Sigue <span class="nar">el manual</span>', top=90) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:460px;right:460px;top:300px;text-align:center;font-size:38px;font-weight:800">📘 Distancia a la hoja y altura de la placa:<br><span class="nar">las da el fabricante</span></div>' +
  badge('CADA MARCA TIENE LAS SUYAS', 1, 660, 560, '#5b8def', 'i')))

E.append(dict(frases=[
  'Ahora la cremallera. Primero desbloquea el motor con su llave, para mover la hoja con la mano.',
  'La cremallera viene en tramos de un metro. Fíjala a la hoja, a la altura que pide el manual, desde un extremo.',
  'Lo más importante: entre el piñón y la cremallera debe quedar una holgura de uno a dos milímetros. El piñón empuja; no debe cargar el peso del portón.',
], zoom=[(0, 1.0, 50, 50), (2, 1.12, 55, 45)], html=titulo('La <span class="nar">cremallera</span>', top=90) + pinon_cremallera(2)))

E.append(dict(frases=[
  'Para que no salte en los empalmes, une los tramos con un pedazo de cremallera puesto encima, como regla, y así el paso de los dientes queda igual.',
  'Mueve la hoja a mano y fija cada tramo justo cuando pasa sobre el piñón. Así toda la cremallera queda a la misma altura sobre él.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Empalmes <span class="nar">sin saltos</span>', top=90) + lista([
  ('📏', 'Une tramos con un <b class="nar">pedazo de cremallera como regla</b>'), ('✋', 'Mueve la hoja a mano y fija <b class="nar">sobre el piñón</b>'),
  ('✅', 'Misma altura <b class="nar">en todo el recorrido</b>')],
  lambda i: [0, 1, 1][i], top=280, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'Los fines de carrera le dicen al motor dónde parar. Pueden ser magnéticos, con imanes en la cremallera, o de resorte, con unas pestañas.',
  'Colócalos para que el motor pare dos o tres centímetros antes de los topes mecánicos. El tope solo debe tocar si algo falla.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=CSS_P + titulo('Fines <span class="nar">de carrera</span>', top=70) +
  corredizo(x=430, piso=770, alto=400, vano=820, en_abre=0, mas=1.0) +
  badge('Para 2 a 3 cm antes del tope', 1, 700, 280, '#3f9e5a', '■')))

E.append(dict(frases=[
  'Prueba final. Primero, desbloqueado, recorre toda la carrera a mano: no debe haber saltos ni roces.',
  'Luego bloquea el motor y haz varios ciclos completos. Escucha: debe sonar parejo, sin golpes en los empalmes.',
  'En nuestra cochera usamos cuatro tramos, cuatro metros de cremallera, para cubrir los tres setenta de recorrido con margen.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">prueba final</span>', top=90) + tabla(
  ['Prueba', 'Resultado'],
  [['A mano, desbloqueado', 'Sin saltos ni roces ✓'], ['Con motor, varios ciclos', 'Sonido parejo ✓'], ['Cremallera', '4 tramos = 4.00 m ✓']],
  lambda i: i, top=270, izq=380, der=380, tam=33)))

E.append(dict(frases=[
  'Los cinco errores con motor y cremallera.',
  'Uno: el piñón carga el peso de la hoja.',
  'Dos: empalmes desalineados.',
  'Tres: base sin nivel.',
  'Cuatro: olvidar el tubo de los cables.',
  'Y cinco: el motor para recién en el tope.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">al instalar</span>', [
  ('Piñón con peso', 'Se gasta y se rompe.'), ('Empalmes desalineados', 'Saltos y ruido.'), ('Base sin nivel', 'Engrane desigual.'),
  ('Sin tubo de cables', 'Romper el piso después.'), ('Para en el tope', 'Golpes que dañan todo.')])))

E.append(dict(frases=[
  'Tu reto: dibuja la base de tu próximo motor corredizo con sus medidas y el recorrido del tubo de cables, y anota cuántos tramos de cremallera necesitas.',
  'En la próxima clase: portones batientes.',
], html=reto('✏️ Dibuja la <b class="nar">base del motor</b><br>con tubo de cables y tramos de cremallera', 'BATIENTES')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el piñón empuja, no carga.',
  '¡Nos vemos en la clase cinco!',
], html=final('El piñón <span class="nar">empuja</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c4')
