"""Seguridad en Obra · Clase 11: Emergencias y primeros auxilios."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 11'
E = []

E.append(dict(antes=0.5, frases=[
  'Un grito en la obra. Todos corren... y nadie sabe qué hacer, ni a quién llamar, ni dónde está el botiquín.',
  'En una emergencia, los primeros minutos los decide lo que se preparó antes.',
  'Hoy armas tu plan de emergencia y repasamos los primeros auxilios básicos. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Todos corren', 'y nadie sabe qué hacer', 11, 'EMERGENCIAS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🚑</div>')))

E.append(obra_av(2, [
  'Ya trabajamos con herramientas y energía seguras.',
  'Hoy: qué hacer si, pese a todo, algo pasa.',
], 'Hoy: <span class="nar">emergencias</span>'))

E.append(dict(frases=[
  'Los números, a la vista en la obra y en el celular de todos: ciento cinco, Policía.',
  'Ciento seis, el SAMU, para emergencias médicas. Y ciento dieciséis, los Bomberos, para incendios y rescates.',
  'En Lima y Callao se está implementando además el nueve uno uno como número único.',
  'Y anota la clínica o el hospital más cercano, y si tus trabajadores tienen SCTR, la clínica que les corresponde.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Los <span class="nar">números</span>', top=90) +
  '<div style="position:absolute;left:330px;right:330px;top:250px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px">' +
  ''.join(f'<div class="pop" data-en="0" data-mas="{0.4*k}" style="background:rgba(255,255,255,.06);border:3px solid {c};border-radius:18px;padding:26px 14px;text-align:center"><div style="font-size:84px;font-weight:900;color:{c}">{n}</div><div style="font-size:30px;font-weight:800">{t}</div></div>'
          for k, (n, t, c) in enumerate([('105', 'Policía', '#5b8def'), ('106', 'SAMU', '#3f9e5a'), ('116', 'Bomberos', '#ff6b6b')])) + '</div>' +
  badge('LIMA Y CALLAO: 911 EN IMPLEMENTACIÓN', 2, 620, 600, '#5b8def', 'i') + badge('+ CLÍNICA MÁS CERCANA · CLÍNICA DEL SCTR', 3, 600, 680, '#ffb020', '🏥')))

E.append(dict(frases=[
  'Ante un accidente, tres pasos: proteger, avisar, socorrer.',
  'Proteger: que no haya más víctimas. Corta la energía, para la máquina, aleja a la gente del peligro.',
  'Avisar: llama al número que corresponde, di dónde estás exactamente y qué pasó. Y socorrer: solo lo que sabes hacer, sin empeorar las cosas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('<span class="nar">Proteger · Avisar · Socorrer</span>', top=90) + tarjetas([
  ('🛑', 'Proteger', 'Corta energía<br>para la máquina'), ('📞', 'Avisar', 'Dónde estás<br>y qué pasó'), ('🩹', 'Socorrer', 'Solo lo que sabes<br><b class="nar">sin empeorar</b>')],
  lambda i: i, top=270, cols=3, alto=290, izq=240)))

E.append(dict(frases=[
  'Si alguien cae de altura, no lo muevas, salvo que esté en peligro inmediato. Puede tener una lesión de columna, y moverlo puede dejarlo peor.',
  'Llama al ciento seis o al ciento dieciséis, abrígalo y háblale mientras llega la ayuda.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Si alguien <span class="nar">cae</span>', top=90) + lista([
  ('🚫', '<b class="nar">No lo muevas</b> (salvo peligro inmediato)'), ('📞', 'Llama al <b class="nar">106 o 116</b>'), ('🧥', '<b class="nar">Abrígalo</b> y háblale')],
  lambda i: [0, 1, 1][i], top=280, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  'Para quemaduras pequeñas: agua corriente fresca por varios minutos, sin hielo, sin pasta dental ni remedios caseros. Y cubrir con una gasa limpia.',
  'Para un cuerpo extraño en el ojo, una chispa o una esquirla: no frotar. Lavar con abundante agua limpia y acudir al médico.',
  'Ante una descarga eléctrica: primero corta la energía. Nunca toques a la persona mientras siga en contacto con la corriente.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Primeros auxilios <span class="nar">básicos</span>', top=90) + tabla(
  ['Caso', 'Qué hacer', 'Qué NO hacer'],
  [['Quemadura pequeña', 'Agua fresca varios minutos · gasa', 'Hielo · pasta dental'], ['Esquirla en el ojo', 'Lavar con agua · al médico', 'Frotar'], ['Descarga eléctrica', 'Cortar la energía primero', 'Tocar a la persona']],
  lambda i: i + 0, top=270, izq=200, der=200, tam=29)))

E.append(dict(frases=[
  'Estos son solo los primeros pasos. Lo ideal es que en cada equipo haya al menos una persona con un curso de primeros auxilios, que lo dan instituciones como la Cruz Roja o los Bomberos.',
  'Y un botiquín en la obra, revisado cada mes, más un extintor PQS a la vista.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('<span class="nar">Prepárate</span>', top=90) + tarjetas([
  ('🎓', 'Curso de primeros auxilios', 'Al menos 1 por equipo'), ('🧰', 'Botiquín', 'Revisado cada mes'), ('🧯', 'Extintor PQS', 'A la vista')],
  lambda i: [0, 1, 1][i], top=270, cols=3, alto=280, izq=240)))

E.append(dict(frases=[
  'Después de la emergencia: se reporta. Qué pasó, por qué, y qué cambiamos para que no se repita. Los accidentes también se notifican según manda la ley.',
  'Y los casi accidentes, los sustos, también se anotan: son los avisos gratis antes del accidente grave.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Después: <span class="nar">reportar</span>', top=90) + lista([
  ('📝', 'Qué pasó · <b class="nar">por qué</b> · qué cambiamos'), ('⚠️', 'Los <b class="nar">casi accidentes</b> también se anotan')],
  lambda i: i, top=300, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  'En la nave: hoja de emergencia pegada en la caseta con los números, la clínica más cercana y la del SCTR.',
  'Botiquín y dos extintores. Dos trabajadores con curso de primeros auxilios. Y el andamio listo para el rescate en altura.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La obra: <span class="nar">plan de emergencia</span>', top=90) + '<div style="position:absolute;left:300px;right:300px;top:240px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="0" data-mas="{m}" style="background:rgba(63,158,90,.12);border:2px solid rgba(63,158,90,.7);border-radius:14px;padding:16px 22px;font-size:30px;font-weight:800">✅ {t}</div>'
          for m, t in [(0, 'Hoja de emergencia'), (0.6, 'Botiquín + 2 extintores'), (1.2, '2 con primeros auxilios'), (1.8, 'Andamio para rescate')]) + '</div>'))

E.append(dict(frases=[
  'Los cuatro errores en emergencias.',
  'Uno: no tener los números a la vista.',
  'Dos: mover a quien cayó.',
  'Tres: tocar a alguien electrocutado.',
  'Y cuatro: no reportar los casi accidentes.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">en emergencias</span>', [
  ('Sin números', 'Minutos perdidos.'), ('Mover al que cayó', 'Lesión peor.'), ('Tocar al electrocutado', 'Dos víctimas.'), ('Callar los sustos', 'Llega el accidente grave.')])))

E.append(dict(frases=[
  'Tu reto: arma la hoja de emergencia de tu obra o taller, con los números, la clínica más cercana y dónde está el botiquín, y pégala a la vista.',
  'En la próxima clase, la última: cómo la seguridad te ayuda a vender.',
], html=reto('🚑 Arma tu <b class="nar">hoja de emergencia</b><br>y pégala a la vista', 'SEGURIDAD QUE VENDE')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: proteger, avisar y socorrer.',
  '¡Nos vemos en la última clase!',
], html=final('Preparado <span class="nar">antes</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c11')
