"""Seguridad en Obra · Clase 4: El EPP básico."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 4'
E = []

E.append(dict(antes=0.5, frases=[
  'Un perno cae desde seis metros. Con casco, es un susto. Sin casco, es otra historia.',
  'El equipo de protección personal es la última barrera, pero cuando todo lo demás falla, es la que te salva.',
  'Hoy ves el equipo básico, cómo elegirlo y cuándo cambiarlo. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Un perno desde 6 m', 'con casco es un susto', 4, 'EPP', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">⛑️</div>')))

E.append(obra(3, [
  'Ya planificamos el trabajo.',
  'Hoy: el equipo que cada trabajador lleva puesto en la nave.',
], 'Hoy: <span class="nar">el equipo de cada uno</span>'))

E.append(dict(frases=[
  'De la cabeza a los pies.',
  'Casco, y en altura con barbiquejo, la cinta de la barbilla, para que no se caiga si te agachas.',
  'Lentes de seguridad siempre, y careta facial al usar la amoladora.',
  'Protección auditiva con ruido fuerte, guantes según la tarea, y botas con punta de acero.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('De la cabeza <span class="nar">a los pies</span>', top=80) +
  svg(trabajador(560, 820, 3.0, arnes=False)) + lista([
  ('⛑️', 'Casco <b class="nar">con barbiquejo</b> en altura'), ('🥽', 'Lentes siempre · <b class="nar">careta</b> con amoladora'), ('🎧', 'Protección <b class="nar">auditiva</b>'),
  ('🧤', 'Guantes <b class="nar">según la tarea</b>'), ('🥾', 'Botas con <b class="nar">punta de acero</b>')],
  lambda i: [1, 2, 3, 3, 3][i], top=230, izq=880, der=160, tam=31)))

E.append(dict(frases=[
  'Cada tarea pide algo extra.',
  'Para soldar: careta de soldar con el filtro adecuado, guantes de cuero largos, mandil o casaca de cuero, y respirador contra humos.',
  'Para cortar con amoladora: careta facial sobre los lentes, guantes y orejeras. Y para pintar con pistola: respirador con filtro para vapores.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('EPP <span class="nar">por tarea</span>', top=90) + tabla(
  ['Tarea', 'EPP extra'],
  [['Soldar', 'Careta con filtro · guantes y mandil de cuero · respirador'], ['Amoladora', 'Careta facial + lentes · guantes · orejeras'], ['Pintar con pistola', 'Respirador con filtro para vapores']],
  lambda i: [1, 2, 2][i], top=270, izq=240, der=240, tam=30)))

E.append(dict(frases=[
  'El EPP también se gasta. Revísalo cada día.',
  'Casco rajado, golpeado fuerte o muy viejo: se cambia. Lentes rayados que no dejan ver: se cambian.',
  'Guantes rotos, botas con la punta expuesta o la suela lisa: se cambian. Un EPP malogrado da una falsa seguridad.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Revisa <span class="nar">cada día</span>', top=90) + tarjetas([
  ('⛑️', 'Casco', 'Rajado o golpeado<br><b class="nar">se cambia</b>'), ('🥽', 'Lentes', 'Rayados<br><b class="nar">se cambian</b>'), ('🥾', 'Botas y guantes', 'Rotos o lisos<br><b class="nar">se cambian</b>')],
  lambda i: [1, 1, 2][i], top=270, cols=3, alto=290, izq=240)))

E.append(dict(frases=[
  'Y la ropa: manga larga de algodón o tela que no se derrita, nunca sintética para soldar, porque se pega a la piel.',
  'Nada suelto que se enganche en la amoladora o el taladro: ni cadenas, ni pulseras, ni la camisa abierta. Y chaleco de alta visibilidad donde hay vehículos o grúa.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La <span class="nar">ropa</span>', top=90) + lista([
  ('👕', 'Manga larga de <b class="nar">algodón</b> · nunca sintética al soldar'), ('⛓️', '<b class="nar">Nada suelto</b>: cadenas, pulseras, camisa abierta'), ('🦺', '<b class="nar">Chaleco reflectivo</b> con vehículos o grúa')],
  lambda i: [0, 1, 1][i], top=280, izq=320, der=320, tam=33)))

E.append(dict(frases=[
  'En la nave, armamos un kit por trabajador y lo anotamos en una hoja de entrega con su firma. Así queda constancia de que se entregó.',
  'Seis kits: casco con barbiquejo, lentes, careta facial, guantes, orejeras, botas y chaleco. Más el equipo de soldar para los dos soldadores.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">un kit por trabajador</span>', top=90) + tabla(
  ['Para', 'Kit'],
  [['Los 6 trabajadores', 'Casco + barbiquejo · lentes · careta · guantes · orejeras · botas · chaleco'], ['Los 2 soldadores', '+ careta de soldar · cuero · respirador'], ['Constancia', 'Hoja de entrega firmada']],
  lambda i: [0, 1, 1][i], top=270, izq=200, der=200, tam=29)))

E.append(dict(frases=[
  'Los cuatro errores con el EPP.',
  'Uno: casco sin barbiquejo en altura.',
  'Dos: lentes en la frente en vez de en los ojos.',
  'Tres: ropa sintética para soldar.',
  'Y cuatro: usar el EPP malogrado.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">con el EPP</span>', [
  ('Sin barbiquejo', 'El casco cae primero.'), ('Lentes en la frente', 'No protegen nada.'), ('Ropa sintética', 'Se pega a la piel.'), ('EPP malogrado', 'Falsa seguridad.')])))

E.append(dict(frases=[
  'Tu reto: revisa el EPP de tu equipo hoy mismo, y anota qué hay que cambiar.',
  'En la próxima clase: el arnés y la línea de anclaje, el equipo que te sostiene en el aire.',
], html=reto('⛑️ Revisa el <b class="nar">EPP de tu equipo</b><br>y anota qué cambiar', 'EL ARNÉS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el EPP correcto, en buen estado y bien puesto.',
  '¡Nos vemos en la clase cinco!',
], html=final('Bien <span class="nar">puesto</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c4')
