"""Seguridad en Obra · Clase 2: La ley en simple."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 2'
E = []

E.append(dict(antes=0.5, frases=[
  'Llega el cliente, una empresa grande, y antes de dejarte entrar a la obra te pide: el seguro de tus trabajadores, el análisis de riesgos y el permiso de trabajo en altura.',
  'Si no los tienes, no entras. Así de simple.',
  'Hoy ves las normas en lenguaje sencillo y qué te piden a ti. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('Sin papeles', 'no entras a la obra', 2, 'LA LEY', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">📋</div>')))

E.append(obra(1, [
  'Ya sabes por qué te cuidas.',
  'Hoy: qué dicen las normas peruanas de seguridad en construcción, y cómo te afectan.',
], 'Hoy: <span class="nar">las normas en simple</span>'))

E.append(dict(frases=[
  'Antes de empezar: esto es una orientación general. Para tu caso concreto, consulta con un especialista en seguridad y salud en el trabajo.',
  'Dicho eso, son cuatro las normas que más vas a escuchar en una obra.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Orientación <span class="nar">general</span>', top=90) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:420px;right:420px;top:300px;text-align:center;font-size:34px;font-weight:800">ℹ️ Para tu caso concreto, consulta con un<br><span class="nar">especialista en seguridad y salud en el trabajo</span></div>'))

E.append(dict(frases=[
  'Uno: la Ley veintinueve mil setecientos ochenta y tres, de Seguridad y Salud en el Trabajo.',
  'Con su reglamento, el Decreto Supremo cero cero cinco del dos mil doce. Es la base para todos los sectores.',
  'Dos: el reglamento para el sector construcción, el Decreto Supremo cero once del dos mil diecinueve.',
  'Tres: la Norma G punto cero cincuenta, Seguridad durante la Construcción. Es la más práctica.',
  'Dice cómo trabajar en altura, cómo armar andamios y cómo soldar sin riesgos.',
  'Y cuatro: el SCTR, el Seguro Complementario de Trabajo de Riesgo. En construcción es obligatorio.',
  'Cubre salud y pensión si hay un accidente.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('Las <span class="nar">4 normas</span>', top=80) + tabla(
  ['Norma', 'Qué es'],
  [['Ley 29783 + DS 005-2012-TR', 'Base de seguridad y salud en el trabajo'], ['DS 011-2019-TR', 'Reglamento para construcción'], ['Norma G.050 (RNE)', 'Cómo trabajar seguro en obra'],
   ['SCTR', 'Seguro obligatorio: salud y pensión']],
  lambda i: [0, 2, 3, 5][i], top=220, izq=260, der=260, tam=31)))

E.append(dict(frases=[
  '¿Qué te piden a ti, como contratista? Lo básico.',
  'Evaluar los riesgos de tu trabajo y controlarlos. Capacitar a tu gente. Darles el equipo de protección. Tener el SCTR vigente de cada trabajador.',
  'Y no permitir que nadie trabaje expuesto a una caída de más de un metro ochenta sin protección.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Lo que <span class="nar">te piden</span>', top=90) + lista([
  ('🔎', 'Evaluar y <b class="nar">controlar los riesgos</b>'), ('🎓', '<b class="nar">Capacitar</b> a tu gente'), ('🦺', 'Dar el <b class="nar">EPP</b>'),
  ('📄', '<b class="nar">SCTR vigente</b> de cada trabajador'), ('🪂', 'Protección contra caídas: <b class="nar">más de 1.80 m</b>')],
  lambda i: [1, 1, 1, 1, 2][i], top=240, izq=330, der=330, tam=32)))

E.append(dict(frases=[
  'El número que tienes que grabarte: uno ochenta.',
  'La Norma G punto cero cincuenta exige sistema de detención de caídas, arnés y línea con amortiguador, siempre que la caída libre pueda superar un metro ochenta.',
  'Y también cerca de bordes de techos, losas y aberturas que no tengan baranda.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 50)], html=titulo('El número: <span class="nar">1.80 m</span>', top=90) + svg(
  '<rect x="560" y="390" width="400" height="30" fill="#5b4a3f"/><line x1="960" y1="390" x2="960" y2="740" stroke="#ffd166" stroke-width="5" stroke-dasharray="12 10"/>'
  '<rect x="440" y="740" width="1040" height="30" fill="#3a4651"/>'
  + trabajador(800, 390, 0.7) +
  f'<g class="ap" data-en="1"><text x="1000" y="580" fill="#ffd166" font-size="64" {T}>&gt; 1.80 m</text>'
  f'<text x="1000" y="640" fill="#fff" font-size="32" {T}>arnés + línea con amortiguador</text></g>')))

E.append(dict(frases=[
  '¿Y si trabajas solo, o con tu ayudante, en obras chicas? La ley de seguridad alcanza también a los trabajadores por cuenta propia.',
  'Pero más allá del papel: tu cuerpo es tu herramienta de trabajo. Un accidente te deja sin ingresos. Protegerte es proteger tu negocio.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('¿Y en obras <span class="nar">chicas</span>?', top=90) + tarjetas([
  ('👷', 'La ley', 'Alcanza también a quien<br>trabaja por cuenta propia'), ('💪', 'Tu cuerpo', 'Es tu herramienta<br><b class="nar">y tu ingreso</b>')],
  lambda i: i, top=280, cols=2, alto=290, izq=380)))

E.append(dict(frases=[
  'En nuestra nave, la empresa nos pidió: el SCTR de los seis trabajadores, el análisis de riesgos del montaje, los permisos de trabajo en altura y en caliente, y el certificado de los arneses.',
  'Los vemos uno por uno en las próximas clases.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">lo que nos pidieron</span>', top=90) + '<div style="position:absolute;left:330px;right:330px;top:250px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="0" data-mas="{m}" style="background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.6);border-radius:14px;padding:16px 22px;font-size:30px;font-weight:800">{t}</div>'
          for m, t in [(0, '📄 SCTR de los 6'), (0.5, '🔎 Análisis de riesgos'), (1.0, '✍️ Permiso en altura'), (1.5, '🔥 Permiso en caliente'), (2.0, '🪢 Certificado de arneses')]) + '</div>'))

E.append(dict(frases=[
  'Los cuatro errores con la ley.',
  'Uno: trabajar sin SCTR.',
  'Dos: creer que la norma es solo para empresas grandes.',
  'Tres: tener los papeles pero no cumplirlos.',
  'Y cuatro: no guardar las copias de lo que firmaste.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">con la ley</span>', [
  ('Sin SCTR', 'Sin cobertura ni contrato.'), ('"Es para grandes"', 'Te alcanza igual.'), ('Papel sin práctica', 'El accidente no lee papeles.'), ('Sin copias', 'No puedes demostrar nada.')])))

E.append(dict(frases=[
  'Tu reto: averigua cuánto cuesta el SCTR para tu equipo con una aseguradora, y arma una carpeta con los documentos de tu gente.',
  'En la próxima clase: cómo planificar un trabajo antes de empezarlo.',
], html=reto('📁 Cotiza el <b class="nar">SCTR</b> de tu equipo<br>y arma tu carpeta de documentos', 'PLANIFICA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: uno ochenta, y el SCTR al día.',
  '¡Nos vemos en la clase tres!',
], html=final('Uno <span class="nar">ochenta</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c2')
