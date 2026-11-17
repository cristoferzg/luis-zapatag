"""Portones Automáticos · Clase 12: Fallas y mantenimiento."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 12'
E = []

E.append(dict(antes=0.5, frases=[
  '"Maestro, el portón se abre un poquito y regresa." "No hace caso al control." "Suena pero no se mueve."',
  'Cada falla tiene unas pocas causas, y casi siempre se encuentran en minutos si revisas en orden.',
  'Hoy aprendes a diagnosticar y a vender el mantenimiento. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('"Se abre y regresa"', 'diagnostica en minutos', 12, 'FALLAS', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🩺</div>')))

E.append(obra_av(3, [
  'Llegamos a la última clase.',
  'Hoy: las fallas más comunes, cómo revisarlas y el mantenimiento que puedes vender.',
], 'Hoy: <span class="nar">diagnóstico y mantenimiento</span>'))

E.append(dict(frases=[
  'Primero, el orden. Antes de abrir la tarjeta, revisa lo simple.',
  '¿Hay energía? ¿Está bloqueado o desbloqueado el motor? ¿La pila del control funciona? ¿Hay algo cortando las fotoceldas?',
  'La mayoría de llamadas se resuelve en este paso. Y siempre corta la energía antes de meter la mano.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Primero <span class="nar">lo simple</span>', top=90) + '<div style="position:absolute;left:330px;right:330px;top:250px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="1" data-mas="{0.5*k}" style="background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.6);border-radius:14px;padding:18px 22px;font-size:31px;font-weight:800">{t}</div>'
          for k, t in enumerate(['⚡ ¿Hay energía?', '🔑 ¿Bloqueado?', '🔋 ¿Pila del control?', '🔴 ¿Fotoceldas libres?'])) + '</div>' +
  badge('CORTA LA ENERGÍA ANTES DE METER LA MANO', 2, 560, 560, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Ahora, las fallas típicas y dónde mirar.',
  'No responde al control, pero sí al pulsador: la pila, el receptor o el control se borró de la memoria.',
  'Abre un poco y regresa, o se detiene: fotoceldas sucias o desalineadas, fuerza muy baja, o el portón roza en algún tramo.',
  'Suena, zumba, pero no se mueve: en motores de doscientos veinte voltios, muchas veces es el condensador de arranque. Y si se pasa del final, revisa el fin de carrera.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 60)], html=titulo('Fallas <span class="nar">típicas</span>', top=80) + tabla(
  ['Síntoma', 'Dónde mirar'],
  [['No hace caso al control', 'Pila · receptor · memoria'], ['Abre y regresa / se detiene', 'Fotoceldas · fuerza · roce'], ['Zumba y no se mueve', 'Condensador (220 V)'],
   ['Se pasa del final', 'Fin de carrera']],
  lambda i: [1, 2, 3, 3][i], top=230, izq=300, der=300, tam=31)))

E.append(dict(frases=[
  'Y si hace ruido: casi siempre es mecánico.',
  'Cremallera desalineada o apoyada sobre el piñón, ruedas gastadas, riel con piedras o tierra, o la guía superior apretada.',
  'Lo viste en las primeras clases: un portón que corre suave a mano no hace ruido con motor.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Si hace <span class="nar">ruido</span>', top=90) + tarjetas([
  ('⚙️', 'Cremallera', 'Desalineada o<br>sobre el piñón'), ('🛞', 'Ruedas', 'Gastadas'), ('🪨', 'Riel', 'Piedras o tierra'), ('🔩', 'Guía', 'Apretada')],
  lambda i: 1, top=270, cols=4, alto=280, izq=130)))

E.append(dict(frases=[
  'El mantenimiento preventivo, cada seis meses, evita casi todas estas llamadas.',
  'Limpia el riel y las fotoceldas. Revisa ruedas, guías y topes. Ajusta la cremallera y los pernos de la base.',
  'Prueba la fuerza, las fotoceldas y el obstáculo. Revisa el desbloqueo. Y no pongas grasa en el riel: junta tierra y frena el portón.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Mantenimiento <span class="nar">cada 6 meses</span>', top=90) + lista([
  ('🧹', 'Limpiar <b class="nar">riel y fotoceldas</b>'), ('🔧', 'Revisar <b class="nar">ruedas, guías, topes</b>; ajustar <b class="nar">cremallera y pernos</b>'),
  ('🛡️', 'Probar <b class="nar">fuerza, fotoceldas y obstáculo</b>; revisar desbloqueo'), ('🚫', '<b class="nar">Sin grasa en el riel</b>')],
  lambda i: [1, 1, 2, 2][i], top=250, izq=290, der=290, tam=32)))

E.append(dict(frases=[
  'Y aquí está el negocio: el contrato de mantenimiento.',
  'Por ejemplo, dos visitas al año con un precio fijo por visita, y descuento en los repuestos. El cliente está tranquilo, y tú tienes ingreso fijo y trabajos nuevos de los mismos clientes.',
  'Con treinta portones en contrato, tienes sesenta visitas al año aseguradas. Ofrécelo siempre en la entrega.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('El negocio: <span class="nar">contrato anual</span>', top=90) + tarjetas([
  ('📅', '2 visitas al año', 'Precio fijo<br>por visita'), ('🔩', 'Repuestos', 'Con descuento'), ('📈', '30 portones', '= <b class="nar">60 visitas</b><br>aseguradas')],
  lambda i: [1, 1, 2][i], top=270, cols=3, alto=290, izq=240)))

E.append(dict(frases=[
  'Así queda el registro de la primera revisión de nuestra cochera, a los seis meses.',
  'Riel limpio, ruedas bien, cremallera ajustada, fotoceldas limpias, prueba del obstáculo aprobada. Y el cliente renovó el contrato.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">revisión de 6 meses</span>', top=90) + '<div style="position:absolute;left:330px;right:330px;top:250px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="{e}" data-mas="{m}" style="background:rgba(63,158,90,.12);border:2px solid rgba(63,158,90,.7);border-radius:14px;padding:16px 22px;font-size:30px;font-weight:800">✅ {t}</div>'
          for e, m, t in [(0, 0, 'Riel limpio'), (0, 0.5, 'Ruedas y guías'), (0, 1.0, 'Cremallera ajustada'), (1, 0, 'Fotoceldas limpias'), (1, 0.5, 'Prueba del obstáculo'), (1, 1.0, 'Contrato renovado')]) + '</div>'))

E.append(dict(frases=[
  'Los cuatro errores al dar servicio.',
  'Uno: cambiar la tarjeta sin revisar lo simple.',
  'Dos: trabajar con la energía conectada.',
  'Tres: engrasar el riel.',
  'Y cuatro: no ofrecer el contrato de mantenimiento.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">de servicio</span>', [
  ('Cambiar la tarjeta primero', 'Gasto sin solución.'), ('Con energía', 'Riesgo de descarga.'), ('Grasa en el riel', 'Junta tierra y frena.'), ('Sin contrato', 'Pierdes ingreso fijo.')])))

E.append(dict(frases=[
  'Tu último reto: arma tu propio contrato de mantenimiento, con lo que revisas, cuántas visitas y el precio, y ofrécelo a tus clientes.',
  'Terminaste el curso de Portones Automáticos. Ahora ya puedes elegir, fabricar, automatizar, asegurar y mantener cualquier portón.',
], html=reto('📄 Arma tu <b class="nar">contrato de mantenimiento</b><br>y ofrécelo a tus clientes', 'TU PRÓXIMO PORTÓN')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: lo simple primero, y el mantenimiento también se vende.',
  '¡Felicitaciones, terminaste el curso!',
], html=final('Curso <span class="nar">completado</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c12')
