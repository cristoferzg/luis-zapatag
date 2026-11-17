"""Portones Automáticos · Clase 7: Seguridad."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 7'
E = []

E.append(dict(antes=0.5, frases=[
  'Doscientos kilos de acero que se mueven solos. Un niño en bicicleta, una mascota, un auto que entra tarde.',
  'Un portón automático sin seguridad no es un lujo: es un peligro. Y si pasa algo, la responsabilidad también alcanza a quien lo instaló.',
  'Hoy instalas y pruebas la seguridad, como se debe. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('200 kg en movimiento', 'la seguridad manda', 7, 'SEGURIDAD', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🛡️</div>')))

E.append(obra(6, [
  'El portón ya abre y cierra con el motor.',
  'Hoy: fotoceldas, fuerza, luz, bandas y la prueba del obstáculo.',
], 'Hoy: <span class="nar">que nunca lastime a nadie</span>'))

E.append(dict(frases=[
  'Las fotoceldas son un par: un emisor y un receptor, uno a cada lado del vano, que se ven con un rayo invisible.',
  'Van a unos cuarenta o cincuenta centímetros del piso, en la línea por donde pasa la gente y el auto.',
  'Si algo corta el rayo mientras el portón cierra, el motor para y vuelve a abrir.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 60)], html=CSS_P + titulo('Las <span class="nar">fotoceldas</span>', top=70) +
  corredizo(x=430, piso=770, alto=400, vano=820, fotoceldas=True, en_foto=0, luz=False) +
  badge('a 40–50 cm del piso', 1, 1340, 560, '#ff6b6b', '↕')))

E.append(dict(frases=[
  'La tarjeta del motor tiene un ajuste de fuerza o de sensibilidad. Detecta cuando la hoja choca con algo y la detiene o la hace retroceder.',
  'Regúlala al mínimo que mueva el portón de punta a punta, incluso con viento. Con la fuerza al máximo, el motor aplasta antes de darse cuenta.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Regula <span class="nar">la fuerza</span>', top=90) + svg(
  '<rect x="560" y="420" width="800" height="40" rx="20" fill="rgba(255,255,255,.1)"/>'
  '<rect class="ap" data-en="0" x="560" y="420" width="280" height="40" rx="20" fill="#3f9e5a"/>'
  '<rect class="ap" data-en="1" data-mas="0.8" x="1120" y="420" width="240" height="40" rx="20" fill="#ff6b6b"/>'
  f'<text class="ap" data-en="0" x="700" y="530" fill="#3f9e5a" font-size="32" {T} text-anchor="middle">lo justo ✓</text>'
  f'<text class="ap" data-en="1" data-mas="0.8" x="1240" y="530" fill="#ff6b6b" font-size="32" {T} text-anchor="middle">al máximo ✕</text>'
  f'<text x="960" y="390" fill="#c9d6e3" font-size="28" {T} text-anchor="middle">fuerza / sensibilidad</text>')))

E.append(dict(frases=[
  'Más protecciones que suman.',
  'La luz destellante avisa que el portón se mueve. Es obligatoria si el portón cierra solo.',
  'La banda de seguridad, un perfil de goma en el borde de cierre, detecta el contacto y hace retroceder la hoja.',
  'Y el desbloqueo manual con llave, para abrir con la mano si se va la luz o falla el motor.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Más <span class="nar">protecciones</span>', top=90) + tarjetas([
  ('💡', 'Luz destellante', 'Avisa que<br>se mueve'), ('🟨', 'Banda de seguridad', 'En el borde<br>de cierre'), ('🔑', 'Desbloqueo manual', 'Abrir sin luz<br>o con falla')],
  lambda i: [1, 2, 3][i], top=270, cols=3, alto=290, izq=240)))

E.append(dict(frases=[
  'Mira también las zonas de atrapamiento, donde una mano o un pie pueden quedar presos.',
  'En el corredizo, entre la hoja y el poste de la guía, y entre la hoja y el muro cuando abre. En el batiente, entre la hoja y el pilar, del lado de la bisagra.',
  'Deja espacio suficiente o protégelas. Y si la hoja tiene barrotes que pasan cerca del poste, coloca malla en la parte baja, para que no entren manos de niños.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Zonas de <span class="nar">atrapamiento</span>', top=90) + lista([
  ('↔️', 'Corredizo: <b class="nar">hoja–poste guía</b> y <b class="nar">hoja–muro</b>'), ('🚪', 'Batiente: <b class="nar">hoja–pilar</b> en la bisagra'),
  ('🕸️', 'Barrotes cerca del poste: <b class="nar">malla abajo</b>')],
  lambda i: [1, 1, 2][i], top=270, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Y la prueba que nunca debes saltarte: la del obstáculo.',
  'Pon una caja de cartón o un tablón en el camino del portón y dale cerrar. Debe detenerse al tocarla y retroceder, sin aplastarla.',
  'Luego cruza el rayo de las fotoceldas mientras cierra: debe parar y abrir. Haz las dos pruebas delante del cliente.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 60)], html=CSS_P + titulo('La prueba <span class="nar">del obstáculo</span>', top=70) +
  corredizo(x=430, piso=770, alto=400, vano=820, fotoceldas=True, en_foto=0) +
  '<div class="pop" data-en="1" style="position:absolute;left:1020px;top:640px;font-size:120px">📦</div>' +
  badge('PARA Y RETROCEDE', 1, 1300, 300, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Para tu referencia: las normas internacionales de portones automáticos, como la europea EN doce cuatro cincuenta y tres, piden justamente esto: limitar la fuerza, detectar obstáculos y avisar.',
  'Seguirlas protege a las personas, y también te protege a ti.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Normas <span class="nar">de referencia</span>', top=90) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:420px;right:420px;top:300px;text-align:center;font-size:36px;font-weight:800">📘 Referencia internacional: <span class="nar">EN 12453</span><br><span style="font-size:28px;color:#c9d6e3">fuerza limitada · detectar obstáculos · avisar</span></div>' +
  badge('PROTEGE A LAS PERSONAS Y A TI', 1, 660, 580, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Nuestra cochera quedó así: fotoceldas a cincuenta centímetros, fuerza regulada, luz destellante, banda en el borde de cierre, malla en la parte baja junto al poste y desbloqueo con llave.',
  'Y las dos pruebas, obstáculo y fotoceldas, aprobadas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">checklist de seguridad</span>', top=90) + '<div style="position:absolute;left:300px;right:300px;top:240px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="{e}" data-mas="{m}" style="background:rgba(63,158,90,.12);border:2px solid rgba(63,158,90,.7);border-radius:14px;padding:16px 22px;font-size:30px;font-weight:800">✅ {t}</div>'
          for e, m, t in [(0, 0, 'Fotoceldas a 50 cm'), (0, 0.5, 'Fuerza regulada'), (0, 1.0, 'Luz destellante'), (0, 1.5, 'Banda de seguridad'),
                          (0, 2.0, 'Malla junto al poste'), (0, 2.5, 'Desbloqueo con llave'), (1, 0, 'Prueba del obstáculo'), (1, 0.5, 'Prueba de fotoceldas')]) + '</div>'))

E.append(dict(frases=[
  'Los cinco errores de seguridad.',
  'Uno: instalar sin fotoceldas.',
  'Dos: fuerza al máximo.',
  'Tres: cierre automático sin luz ni fotoceldas.',
  'Cuatro: no revisar las zonas de atrapamiento.',
  'Y cinco: no hacer la prueba del obstáculo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('5 errores <span class="nar">de seguridad</span>', [
  ('Sin fotoceldas', 'Cierra sobre lo que pase.'), ('Fuerza al máximo', 'Aplasta.'), ('Cierre automático sin aviso', 'Sorprende a la gente.'),
  ('Atrapamientos', 'Manos y pies presos.'), ('Sin prueba', 'No sabes si funciona.')])))

E.append(dict(frases=[
  'Tu reto: haz la prueba del obstáculo y de las fotoceldas en un portón automático que conozcas, con permiso del dueño, y anota el resultado.',
  'En la próxima clase: programación, cotización y entrega.',
], html=reto('📦 Haz la <b class="nar">prueba del obstáculo</b><br>y de fotoceldas (con permiso)', 'LA ENTREGA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el portón debe parar ante cualquier obstáculo.',
  '¡Nos vemos en la clase ocho!',
], html=final('Seguro <span class="nar">siempre</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c7')
