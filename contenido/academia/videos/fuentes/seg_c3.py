"""Seguridad en Obra · Clase 3: Planifica antes de subir."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 3'
E = []

E.append(dict(antes=0.5, frases=[
  'Cinco minutos. Es lo que toma revisar el trabajo antes de empezar.',
  'Y en esos cinco minutos alguien dice: "Oye, ¿dónde vamos a enganchar el arnés?". Nadie lo había pensado.',
  'Hoy aprendes a planificar con tres herramientas sencillas. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Cinco minutos', 'que salvan el día', 3, 'PLANIFICA', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🗒️</div>')))

E.append(obra(2, [
  'Ya conoces las normas.',
  'Hoy: el IPERC, el análisis de trabajo seguro y el permiso de trabajo de alto riesgo.',
], 'Hoy: <span class="nar">IPERC · ATS · PETAR</span>'))

E.append(dict(frases=[
  'El IPERC es la identificación de peligros, evaluación de riesgos y controles. Se hace una vez, al planificar la obra.',
  'Por cada tarea: ¿qué peligro hay? ¿Qué tan probable es y qué tan grave sería? ¿Y qué control pondremos?',
  'Se ordena de mayor a menor riesgo. Lo más grave se controla primero.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">IPERC</span>', top=90) + tabla(
  ['Tarea', 'Peligro', 'Riesgo', 'Control'],
  [['Izar arco', 'Carga suspendida', 'Alto', 'Zona aislada · cuerdas guía'], ['Poner correas', 'Caída de 6 m', 'Alto', 'Línea de vida + arnés'], ['Cortar perfiles', 'Disco de amoladora', 'Medio', 'Guarda + careta']],
  lambda i: [1, 1, 2][i], top=250, izq=180, der=180, tam=29)))

E.append(dict(frases=[
  'El ATS, o análisis de trabajo seguro, se hace cada día, antes de empezar, con el equipo que va a hacer el trabajo.',
  'Se divide el trabajo en pasos, y en cada paso: qué puede pasar y cómo lo evitamos. Todos lo leen y lo firman.',
  'Es la famosa charla de cinco minutos, pero por escrito y sobre el trabajo de hoy.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">ATS</span>: cada día', top=90) + svg(
  ''.join(f'<g class="ap" data-en="1" data-mas="{0.4*k}"><rect x="{300+k*450}" y="320" width="400" height="220" rx="16" fill="rgba(255,255,255,.06)" stroke="#5b8def" stroke-width="4"/>'
          f'<text x="{500+k*450}" y="380" fill="#ffd166" font-size="30" {T} text-anchor="middle">Paso {k+1}</text>'
          f'<text x="{500+k*450}" y="440" fill="#fff" font-size="26" {T} text-anchor="middle">{a}</text>'
          f'<text x="{500+k*450}" y="490" fill="#3f9e5a" font-size="24" {T} text-anchor="middle">{b}</text></g>'
          for k, (a, b) in enumerate([('Subir a la columna', '→ escalera amarrada'), ('Enganchar arnés', '→ antes de soltarse'), ('Fijar correa', '→ herramienta amarrada')]))
  + f'<text class="ap" data-en="2" x="960" y="620" fill="#c9d6e3" font-size="30" {T} text-anchor="middle">todos lo leen y lo firman</text>')))

E.append(dict(frases=[
  'El PETAR es el permiso escrito de trabajo de alto riesgo. Lo piden para trabajos en altura, en caliente, en espacios confinados o con energía eléctrica.',
  'Dice quién hace el trabajo, dónde, cuándo, con qué equipo y con qué controles, y lo firman el que ejecuta y el que autoriza.',
  'Vale solo para ese trabajo y ese turno. Si cambian las condiciones, se para y se hace uno nuevo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El <span class="nar">PETAR</span>', top=90) + tarjetas([
  ('🪂', 'Altura', ''), ('🔥', 'En caliente', ''), ('🕳️', 'Espacio confinado', ''), ('⚡', 'Eléctrico', '')],
  lambda i: 0, top=250, cols=4, alto=180, izq=180) + lista([
  ('✍️', 'Quién, dónde, cuándo, con qué equipo y controles'), ('⏱️', 'Vale <b class="nar">ese trabajo y ese turno</b>')],
  lambda i: i + 1, top=470, izq=360, der=360, tam=30)))

E.append(dict(frases=[
  'Y la herramienta más poderosa de todas: el derecho a parar.',
  'Si alguien ve una condición peligrosa, puede y debe detener el trabajo. Nadie lo regaña por eso. Primero se corrige, después se sigue.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 55)], html=titulo('El derecho <span class="nar">a parar</span>', top=90) +
  '<div class="pop" data-en="0" style="position:absolute;left:760px;top:260px;width:400px;height:400px;border-radius:50%;background:#dc2626;display:flex;align-items:center;justify-content:center;font-size:110px;font-weight:900;color:#fff;border:14px solid #fff">ALTO</div>'))

E.append(dict(frases=[
  'En nuestra nave, el primer día de montaje: el IPERC ya estaba hecho. A las siete y media, ATS con todo el equipo sobre el izaje de los arcos.',
  'Y el supervisor firmó el PETAR de trabajo en altura para la colocación de correas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">día 1 de montaje</span>', top=90) + tabla(
  ['Documento', 'Cuándo', 'Estado'],
  [['IPERC', 'Al planificar', '✅'], ['ATS izaje de arcos', '7:30 am, con el equipo', '✅'], ['PETAR altura (correas)', 'Antes de subir', '✅']],
  lambda i: [0, 0, 1][i], top=270, izq=300, der=300, tam=32)))

E.append(dict(frases=[
  'Los cuatro errores al planificar.',
  'Uno: copiar el ATS de ayer sin leerlo.',
  'Dos: firmar sin entender.',
  'Tres: seguir trabajando aunque cambien las condiciones.',
  'Y cuatro: castigar al que para el trabajo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">al planificar</span>', [
  ('ATS copiado', 'No es el trabajo de hoy.'), ('Firmar sin leer', 'Papel sin valor.'), ('Condiciones cambiadas', 'El permiso ya no vale.'), ('Castigar al que para', 'Nadie vuelve a avisar.')])))

E.append(dict(frases=[
  'Tu reto: haz el ATS de un trabajo que tengas esta semana, en tres pasos, con su peligro y su control, y léelo con tu equipo.',
  'En la próxima clase: el equipo de protección personal.',
], html=reto('✍️ Haz el <b class="nar">ATS</b> de un trabajo tuyo<br>y léelo con tu equipo', 'EPP')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: planifica, analiza, y si hace falta, para.',
  '¡Nos vemos en la clase cuatro!',
], html=final('Primero <span class="nar">planifica</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c3')
