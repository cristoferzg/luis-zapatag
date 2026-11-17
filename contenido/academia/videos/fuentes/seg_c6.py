"""Seguridad en Obra · Clase 6: Espacio libre de caída y rescate."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 6'
E = []

def diagrama_espacio(en0=1):
    s = '<rect x="560" y="250" width="800" height="24" fill="#5b4a3f"/>'
    s += '<circle cx="760" cy="262" r="14" fill="#ffd166"/>'
    s += '<rect x="420" y="860" width="1080" height="24" fill="#3a4651"/>'
    y = 262
    tramos = [('línea', 180, '#5b8def', '1.80 m'), ('amortiguador', 106, '#f97316', '1.06 m'), ('tu cuerpo', 150, '#a78bfa', '1.50 m'), ('margen', 100, '#3f9e5a', '1.00 m')]
    for k, (n, h, c, t) in enumerate(tramos):
        s += (f'<g class="ap" data-en="{en0}" data-mas="{0.7*k}"><rect x="900" y="{y}" width="60" height="{h}" fill="{c}"/>'
              f'<text x="990" y="{y+h/2+12}" fill="#fff" font-size="32" {T}>{t} · {n}</text></g>')
        y += h
    s += (f'<g class="ap" data-en="{en0+1}"><line x1="860" y1="262" x2="860" y2="{y}" stroke="#ffd166" stroke-width="5"/>'
          f'<text x="840" y="{(262+y)/2+20}" fill="#ffd166" font-size="54" {T} text-anchor="end">≈ 5.40 m</text></g>')
    return svg(s)

E.append(dict(antes=0.5, frases=[
  'Arnés puesto, línea enganchada, anclaje firme... y aun así, el trabajador golpea el piso.',
  '¿Cómo? Porque el sistema necesita espacio para frenarte. Si estás muy cerca del suelo, no alcanza.',
  'Hoy aprendes a calcular el espacio libre de caída y qué hacer si alguien queda colgado. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Enganchado', 'y aun así golpeó el piso', 6, 'ESPACIO LIBRE', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">📏</div>')))

E.append(obra(5, [
  'El sistema de arnés, línea y anclaje ya está listo.',
  'Hoy: verificar que alcanza para frenar la caída a tiempo, y el plan de rescate.',
], 'Hoy: <span class="nar">espacio libre y rescate</span>'))

E.append(dict(frases=[
  'Cuando caes, la distancia se suma por partes, medida desde el anclaje.',
  'Primero el largo de la línea: un metro ochenta.',
  'Luego el amortiguador, que se estira: hasta un metro seis, según la norma.',
  'Después tu cuerpo, desde la argolla de la espalda hasta los pies: un metro y medio aproximadamente. Y un margen de seguridad de un metro.',
  'Total: unos cinco metros cuarenta libres debajo del anclaje. Si hay menos, ese sistema no te salva.',
], zoom=[(0, 1.0, 50, 50), (4, 1.05, 50, 55)], html=titulo('El espacio <span class="nar">libre de caída</span>', top=70) + diagrama_espacio(1)))

E.append(dict(frases=[
  '¿Qué haces si no hay cinco metros y medio? Tres opciones.',
  'Subir el anclaje: si está sobre tu cabeza, la caída libre es menor.',
  'Usar una línea retráctil, que funciona como el cinturón del auto: se traba en centímetros y necesita mucho menos espacio.',
  'O mejor aún: protección colectiva, como barandas, que evitan que caigas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Y si <span class="nar">no alcanza</span>?', top=90) + tarjetas([
  ('⬆️', 'Anclaje arriba', 'Sobre tu cabeza<br>menos caída libre'), ('🌀', 'Línea retráctil', 'Se traba en<br><b class="nar">centímetros</b>'), ('🚧', 'Barandas', 'Evitan<br><b class="nar">la caída</b>')],
  lambda i: i + 1, top=270, cols=3, alto=290, izq=240)))

E.append(dict(frases=[
  'Cuidado también con el efecto péndulo. Si el anclaje está muy a un costado, al caer te balanceas y te golpeas contra la columna o la estructura.',
  'Engánchate lo más vertical posible sobre ti, y mueve el anclaje mientras avanzas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El efecto <span class="nar">péndulo</span>', top=90) + svg(
  '<rect x="580" y="260" width="40" height="40" fill="#ffd166"/>'
  '<line x1="600" y1="300" x2="1100" y2="520" stroke="#facc15" stroke-width="5"/>'
  '<path class="dib" data-en="0" d="M1100 520 A540 540 0 0 1 600 760" fill="none" stroke="#ff6b6b" stroke-width="6" stroke-dasharray="14 10" style="--l:800"/>'
  '<rect x="520" y="620" width="40" height="180" fill="#9aa5ae"/>'
  f'<text class="ap" data-en="0" x="1000" y="740" fill="#ff6b6b" font-size="34" {T}>golpe contra la estructura</text>'
  f'<text class="ap" data-en="1" x="960" y="240" fill="#3f9e5a" font-size="32" {T} text-anchor="middle">engánchate vertical sobre ti</text>')))

E.append(dict(frases=[
  'Y lo que casi nadie planea: el rescate.',
  'Una persona colgada del arnés, quieta, sufre el llamado trauma por suspensión: las correas de las piernas cortan la circulación y puede perder el conocimiento en pocos minutos.',
  'Por eso la regla práctica es rescatarla, o al menos ayudarla a levantar las piernas, en los primeros diez minutos. Antes de subir, ya tiene que estar decidido cómo se la baja.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('El <span class="nar">rescate</span>', top=90) +
  '<div class="tarjeta pop" data-en="1" style="position:absolute;left:400px;right:400px;top:280px;text-align:center;font-size:34px;font-weight:800">🩺 Colgado y quieto: <span class="nar">trauma por suspensión</span><br><span style="font-size:28px;color:#c9d6e3">puede perder el conocimiento en pocos minutos</span></div>' +
  badge('RESCATE EN LOS PRIMEROS 10 MINUTOS', 2, 580, 580, '#ff6b6b', '⏱')))

E.append(dict(frases=[
  'Un plan de rescate simple tiene cuatro cosas.',
  'Quién rescata, entrenado. Con qué: una escalera, el andamio, o un equipo de rescate. Cómo se llega a cualquier punto de la obra.',
  'Y a quién se llama: el ciento dieciséis de bomberos y el ciento seis del SAMU. Mientras, el que está colgado mueve las piernas o apoya los pies en algo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Plan de rescate <span class="nar">simple</span>', top=90) + lista([
  ('👷', '<b class="nar">Quién</b> rescata (entrenado)'), ('🪜', '<b class="nar">Con qué</b>: escalera, andamio o equipo'), ('🗺️', '<b class="nar">Cómo</b> se llega a cada punto'),
  ('📞', '<b class="nar">116</b> Bomberos · <b class="nar">106</b> SAMU')],
  lambda i: [1, 1, 1, 2][i], top=250, izq=360, der=360, tam=33)))

E.append(dict(frases=[
  'En la nave: la línea de vida va en lo alto del arco, unos seis metros sobre el piso en los apoyos y más arriba en el centro. El espacio libre alcanza.',
  'Pero al subir por la columna, hasta los cuatro metros, no alcanza con la línea de un metro ochenta. Ahí usamos línea retráctil, y el andamio queda armado para el rescate.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">¿alcanza?</span>', top=90) + tabla(
  ['Zona', 'Espacio libre', 'Solución'],
  [['Arriba del arco', 'Más de 6 m', 'Línea con amortiguador ✓'], ['Subiendo la columna', 'Menos de 5.4 m', 'Línea retráctil ✓'], ['Rescate', '—', 'Andamio armado + 116 / 106']],
  lambda i: [0, 1, 1][i], top=270, izq=240, der=240, tam=30)))

E.append(dict(frases=[
  'Los cuatro errores de espacio y rescate.',
  'Uno: usar línea de un metro ochenta a poca altura.',
  'Dos: anclaje muy a un costado.',
  'Tres: no tener plan de rescate.',
  'Y cuatro: esperar a los bomberos sin hacer nada.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">de espacio y rescate</span>', [
  ('Línea larga a poca altura', 'Golpeas el piso.'), ('Anclaje al costado', 'Péndulo y golpe.'), ('Sin plan', 'Minutos perdidos.'), ('Solo esperar', 'El tiempo juega en contra.')])))

E.append(dict(frases=[
  'Tu reto: calcula el espacio libre para un trabajo en altura tuyo y decide si te sirve la línea con amortiguador o necesitas una retráctil. Y escribe tu plan de rescate en cuatro líneas.',
  'En la próxima clase: andamios y escaleras.',
], html=reto('📏 Calcula tu <b class="nar">espacio libre</b><br>y escribe tu plan de rescate', 'ANDAMIOS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: cinco cuarenta libres, y el rescate decidido antes de subir.',
  '¡Nos vemos en la clase siete!',
], html=final('Espacio <span class="nar">para frenar</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c6')
