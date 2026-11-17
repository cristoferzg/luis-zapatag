"""Seguridad en Obra · Clase 12: Seguridad que vende."""
from seg_comun import *

CURSO = 'SEGURIDAD EN OBRA · CLASE 12'
E = []

E.append(dict(antes=0.5, frases=[
  'Dos cotizaciones para la misma nave. La más barata no incluía arneses, ni línea de vida, ni seguro. La empresa eligió la otra.',
  'Las empresas serias saben que un accidente les sale carísimo. Por eso pagan más por un contratista seguro.',
  'Hoy aprendes a cotizar la seguridad y a presentarla como una ventaja. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('La más barata', 'no ganó', 12, 'SEGURIDAD QUE VENDE', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🤝</div>')))

E.append(obra_av(3, [
  'Llegamos a la última clase.',
  'Hoy: la seguridad como parte de tu cotización y de tu marca.',
], 'Hoy: <span class="nar">cobrar la seguridad</span>'))

E.append(dict(frases=[
  'La seguridad tiene un costo, y ese costo va en la cotización, como cualquier material.',
  'El EPP de tu equipo, lo que se gasta en cada obra. La línea de vida y los anclajes.',
  'El alquiler de andamios. El SCTR de los días de obra. Y las horas de charlas y permisos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La seguridad <span class="nar">se cotiza</span>', top=90) + lista([
  ('🦺', '<b class="nar">EPP</b> que se gasta en la obra'), ('🪢', '<b class="nar">Línea de vida</b> y anclajes'), ('🏗️', 'Alquiler de <b class="nar">andamios</b>'), ('📄', '<b class="nar">SCTR</b> de los días de obra'),
  ('⏱️', 'Horas de <b class="nar">charlas y permisos</b>')],
  lambda i: [1, 1, 2, 2, 2][i], top=230, izq=360, der=360, tam=31)))

E.append(dict(frases=[
  'Un ejemplo, con precios de referencia: para el montaje de la nave, con seis personas durante veinte días.',
  'EPP de reposición, ochocientos soles. Línea de vida y anclajes, mil doscientos. Andamios, seiscientos. SCTR, novecientos. Charlas y permisos, quinientos.',
  'Total de la partida de seguridad: cuatro mil soles. En una obra de más de cien mil, es menos del cuatro por ciento. Y evita el costo que no tiene precio.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Ejemplo: <span class="nar">partida de seguridad</span>', top=80) + tabla(
  ['Concepto', 'S/'],
  [['EPP de reposición', '800'], ['Línea de vida y anclajes', '1 200'], ['Andamios (alquiler)', '600'], ['SCTR (6 personas)', '900'], ['Charlas y permisos', '500'],
   ['<span class="nar">TOTAL</span>', '<b class="nar">4 000</b>']],
  lambda i: [1, 1, 1, 1, 1, 2][i], top=210, izq=460, der=460, tam=29) + badge('PRECIOS DE REFERENCIA', 0, 1500, 210, '#5b8def', 'i', tam=22)))

E.append(dict(frases=[
  'Ponla como una partida aparte, con su nombre: "Seguridad y salud en el trabajo". No la escondas dentro de otra.',
  'Así el cliente ve que la tomas en serio, y si compara con alguien que no la puso, entiende por qué cuestas más.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Una <span class="nar">partida aparte</span>', top=90) +
  '<div class="tarjeta pop" data-en="0" style="position:absolute;left:460px;right:460px;top:300px;text-align:center;font-size:36px;font-weight:800">📑 Partida:<br><span class="nar">Seguridad y salud en el trabajo</span></div>'))

E.append(dict(frases=[
  'Arma tu carpeta de seguridad, lista para enviar cuando te la pidan.',
  'El SCTR vigente de tu equipo. El certificado de tus arneses y líneas. Un modelo de IPERC, de ATS y de PETAR. Las constancias de entrega de EPP y de capacitación.',
  'Con esa carpeta, cuando una empresa te la pida, la envías en minutos. Muchos competidores no pueden.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Tu <span class="nar">carpeta de seguridad</span>', top=90) + '<div style="position:absolute;left:300px;right:300px;top:240px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="1" data-mas="{m}" style="background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.6);border-radius:14px;padding:16px 22px;font-size:30px;font-weight:800">{t}</div>'
          for m, t in [(0, '📄 SCTR vigente'), (0.5, '🪢 Certificado de arneses'), (1.0, '🔎 Modelo de IPERC'), (1.5, '✍️ Modelos de ATS y PETAR'), (2.0, '🦺 Entrega de EPP'), (2.5, '🎓 Capacitaciones')]) + '</div>'))

E.append(dict(frases=[
  'Y muéstralo. En tus fotos de obra, que se vea a tu gente con casco, arnés y línea de vida. Eso dice más que cualquier publicidad.',
  'Una foto de alguien soldando en altura sin arnés aleja a los buenos clientes.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('<span class="nar">Muéstralo</span>', top=90) + tarjetas([
  ('📸', 'Foto con EPP', 'Atrae a los<br><b class="nar">buenos clientes</b>'), ('🚫', 'Foto sin arnés', 'Los aleja')],
  lambda i: i, top=280, cols=2, alto=290, izq=380)))

E.append(dict(frases=[
  'En la nave: la partida de seguridad fue de cuatro mil soles dentro del presupuesto, la carpeta se envió el mismo día que la pidieron, y el montaje terminó sin un solo accidente.',
  'La empresa nos volvió a llamar para su segunda nave.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">resultado</span>', top=90) + tabla(
  ['Dato', 'Resultado'],
  [['Partida de seguridad', 'S/ 4 000 en el presupuesto'], ['Carpeta', 'Enviada el mismo día'], ['Accidentes', '0'], ['Cliente', 'Segunda nave contratada ✓']],
  lambda i: [0, 0, 0, 1][i], top=270, izq=360, der=360, tam=32)))

E.append(dict(frases=[
  'Los cuatro errores al vender la seguridad.',
  'Uno: no cotizarla y pagarla de tu bolsillo.',
  'Dos: esconderla en otra partida.',
  'Tres: no tener la carpeta lista.',
  'Y cuatro: fotos de obra sin EPP.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">al venderla</span>', [
  ('Sin cotizarla', 'La pagas tú.'), ('Escondida', 'El cliente no la ve.'), ('Sin carpeta', 'Pierdes la obra.'), ('Fotos sin EPP', 'Ahuyentan clientes.')])))

E.append(dict(frases=[
  'Tu último reto: agrega la partida de seguridad a tu próxima cotización y arma tu carpeta de seguridad.',
  'Terminaste el curso de Seguridad en Obra y Trabajos en Altura. Ahora trabajas seguro, y lo cobras.',
], html=reto('📑 Agrega la <b class="nar">partida de seguridad</b><br>y arma tu carpeta', 'TU PRÓXIMA OBRA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la seguridad se planifica, se cumple y se cobra. Y todos vuelven a casa.',
  '¡Felicitaciones, terminaste el curso!',
], html=final('Curso <span class="nar">completado</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'seg_c12')
