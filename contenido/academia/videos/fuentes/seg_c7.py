"""Seguridad en Obra · Clase 7: Andamios y escaleras."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 7'
E = []

def andamio(en_bar=1):
    s = '<rect x="420" y="860" width="1080" height="24" fill="#3a4651"/>'
    for x in (700, 1100):
        s += f'<rect x="{x}" y="380" width="16" height="480" fill="#9aa5ae"/>'
    for y in (620, 860):
        s += f'<rect x="700" y="{y-10}" width="416" height="12" fill="#9aa5ae"/>'
    s += '<line x1="716" y1="620" x2="1100" y2="850" stroke="#9aa5ae" stroke-width="8"/>'
    s += '<rect x="690" y="600" width="436" height="22" fill="#c08a52"/>'
    s += (f'<g class="ap" data-en="{en_bar}"><rect x="700" y="420" width="416" height="10" fill="#ffd166"/>'
          f'<rect x="700" y="510" width="416" height="10" fill="#ffd166"/><rect x="700" y="575" width="416" height="26" fill="#f97316"/>'
          f'<text x="1140" y="432" fill="#ffd166" font-size="28" {T}>pasamanos 1.05 m</text>'
          f'<text x="1140" y="522" fill="#ffd166" font-size="28" {T}>intermedia 0.54 m</text>'
          f'<text x="1140" y="598" fill="#f97316" font-size="28" {T}>rodapié ≥ 10 cm</text></g>')
    return svg(f'<g transform="translate(0,-190)">{s}</g>')

E.append(dict(antes=0.5, frases=[
  'Un andamio armado sobre ladrillos sueltos, sin baranda, con dos tablones mal puestos. Así empiezan muchos accidentes.',
  'Un andamio bien armado es protección colectiva: protege a todos los que suben, sin que nadie tenga que acordarse.',
  'Hoy ves cómo armar andamios y usar escaleras como manda la norma. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Sobre ladrillos sueltos', 'así empieza el accidente', 7, 'ANDAMIOS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🪜</div>')))

E.append(obra(6, [
  'Ya sabemos frenar una caída.',
  'Hoy: andamios y escaleras para llegar arriba sin caernos.',
], 'Hoy: <span class="nar">andamios y escaleras</span>'))

E.append(dict(frases=[
  'La base: sobre piso firme y nivelado, con sus placas o garruchas. Nunca sobre ladrillos, bloques o cajas.',
  'Si tiene garruchas, frenadas siempre que haya alguien arriba. Y no se mueve el andamio con gente encima.',
  'Si su altura pasa de tres veces el lado más corto de la base, se arriostra a la estructura para que no se voltee.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">base</span>', top=90) + lista([
  ('🟫', 'Piso <b class="nar">firme y nivelado</b> · nunca ladrillos'), ('🛞', 'Garruchas <b class="nar">frenadas</b> · no se mueve con gente'), ('📐', 'Altura > 3 × base menor: <b class="nar">arriostrar</b>')],
  lambda i: i, top=280, izq=320, der=320, tam=33)))

E.append(dict(frases=[
  'La plataforma, completa: sin huecos, con tablones de veinticinco a treinta centímetros de ancho y cinco de espesor, que pasen de su apoyo entre quince y treinta centímetros, y bien sujetos.',
  'Las barandas: pasamanos a un metro cinco y baranda intermedia a cincuenta y cuatro centímetros.',
  'Y rodapié de al menos diez centímetros, para que no caigan herramientas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 50)], html=titulo('Plataforma <span class="nar">y barandas</span>', top=70) + andamio(1)))

E.append(dict(frases=[
  'Cada día, antes de usarlo, alguien competente lo revisa y le pone su tarjeta.',
  'Verde: completo, se puede usar. Amarilla: falta algo, solo se usa con el arnés enganchado todo el tiempo. Roja: prohibido subir.',
  'Y aunque esté en verde, en altura se trabaja con arnés, enganchado a la línea de vida o a una estructura resistente.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Las <span class="nar">tarjetas</span>', top=90) +
  '<div style="position:absolute;left:360px;right:360px;top:260px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px">' +
  ''.join(f'<div class="pop" data-en="1" data-mas="{0.4*k}" style="background:{c};border-radius:18px;padding:30px 18px;text-align:center;font-size:34px;font-weight:900;color:#111">{t}<div style="font-size:24px;font-weight:700;margin-top:10px">{d}</div></div>'
          for k, (c, t, d) in enumerate([('#4ade80', 'VERDE', 'Se puede usar'), ('#facc15', 'AMARILLA', 'Solo con arnés enganchado'), ('#f87171', 'ROJA', 'Prohibido subir')])) + '</div>'))

E.append(dict(frases=[
  'Las escaleras portátiles: para subir y bajar, no para trabajar horas encima.',
  'La regla del cuatro a uno: por cada cuatro metros de altura, la base se separa un metro de la pared.',
  'Que sobresalga un metro sobre el punto donde vas a bajar, y amarrada arriba.',
  'Siempre tres puntos de apoyo: dos manos y un pie, o dos pies y una mano. Las herramientas suben en un bolso o con una soga, no en la mano.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 55)], html=titulo('Las <span class="nar">escaleras</span>', top=80) + svg('<g transform="translate(0,-110)">' +
  '<rect x="1000" y="260" width="40" height="600" fill="#5b4a3f"/><rect x="560" y="860" width="600" height="24" fill="#3a4651"/>'
  '<line x1="860" y1="860" x2="1000" y2="300" stroke="#c9d6e3" stroke-width="10"/><line x1="900" y1="860" x2="1040" y2="300" stroke="#c9d6e3" stroke-width="10"/>'
  + ''.join(f'<line x1="{860+k*14}" y1="{860-k*56}" x2="{900+k*14}" y2="{860-k*56}" stroke="#c9d6e3" stroke-width="6"/>' for k in range(1, 10)) +
  f'<g class="ap" data-en="1"><line x1="860" y1="900" x2="1000" y2="900" stroke="#ffd166" stroke-width="5"/><text x="930" y="945" fill="#ffd166" font-size="30" {T} text-anchor="middle">1</text>'
  f'<line x1="1080" y1="360" x2="1080" y2="860" stroke="#ffd166" stroke-width="5"/><text x="1110" y="620" fill="#ffd166" font-size="30" {T}>4</text>'
  f'<text x="1110" y="320" fill="#ffd166" font-size="28" {T}>sobresale ≈ 1 m · amarrada</text></g></g>')
  + badge('3 PUNTOS DE APOYO', 3, 380, 400, '#3f9e5a', '✋')))

E.append(dict(frases=[
  'En la nave usamos dos andamios de tres cuerpos con garruchas para soldar los empalmes de las columnas y para el rescate, con baranda completa y tarjeta verde cada mañana.',
  'Y escaleras de cinco metros, amarradas, solo para subir a la línea de vida.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">andamios y escaleras</span>', top=90) + tabla(
  ['Equipo', 'Uso', 'Control'],
  [['2 andamios de 3 cuerpos', 'Empalmes de columnas · rescate', 'Barandas + tarjeta diaria'], ['Escaleras de 5 m', 'Subir a la línea de vida', 'Amarradas · 4 a 1']],
  lambda i: i, top=290, izq=200, der=200, tam=30)))

E.append(dict(frases=[
  'Los cinco errores con andamios y escaleras.',
  'Uno: base sobre ladrillos.',
  'Dos: plataforma con huecos o sin baranda.',
  'Tres: mover el andamio con gente arriba.',
  'Cuatro: escalera sin amarrar.',
  'Y cinco: subir con las manos ocupadas.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">al subir</span>', [
  ('Base sobre ladrillos', 'Se hunde o se voltea.'), ('Plataforma incompleta', 'Caída por el hueco.'), ('Mover con gente', 'Vuelco.'), ('Escalera suelta', 'Resbala.'), ('Manos ocupadas', 'Sin agarre.')])))

E.append(dict(frases=[
  'Tu reto: revisa un andamio en tu obra con la lista de hoy y ponle la tarjeta que le corresponde.',
  'En la próxima clase: trabajos en caliente e izaje, y cerramos el módulo principal.',
], html=reto('🏷️ Revisa un <b class="nar">andamio</b><br>y ponle su tarjeta', 'CALIENTE E IZAJE')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: base firme, plataforma completa y barandas.',
  '¡Nos vemos en la clase ocho!',
], html=final('Base <span class="nar">firme</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c7')
