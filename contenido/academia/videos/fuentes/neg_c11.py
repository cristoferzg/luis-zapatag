"""El Negocio del Metalero · Clase 11: Tu equipo de trabajo (módulo avanzado)."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 11'
E = []

E.append(dict(antes=0.5, frases=[
  'Tienes más trabajo que nunca... y no te alcanza el día. Rechazas obras, entregas tarde, y tu ayudante se acaba de ir.',
  'Un taller no crece con un solo par de manos. Crece con un equipo.',
  'Hoy aprendes a contratar, enseñar y delegar. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('No puedes con todo', 'y no te alcanza el día', 11, 'TU EQUIPO', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">👷</div>')))

E.append(obra_av(2, [
  'Ya sabes cómo formalizar tu taller.',
  'Hoy: tu equipo de trabajo.',
], 'Hoy: <span class="nar">tu equipo</span>'))

E.append(dict(frases=[
  '¿Cuándo contratar? Cuando empiezas a rechazar obras por falta de tiempo, o cuando trabajas tantas horas que la calidad baja.',
  'Lo normal es crecer de a poco: primero un ayudante, luego un maestro de taller que fabrique mientras tú vendes y supervisas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('¿Cuándo <span class="nar">contratar</span>?', top=100) + lista([
  ('🙅', 'Rechazas obras por <b class="nar">falta de tiempo</b>'), ('😓', 'Tantas horas que <b class="nar">baja la calidad</b>'),
  ('1️⃣', 'Primero un <b class="nar">ayudante</b>'), ('2️⃣', 'Luego un <b class="nar">maestro de taller</b>')],
  lambda i: [0, 0, 1, 1][i], top=270, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  'Formas de pago. Por día, el jornal: simple, pero sin incentivo para avanzar.',
  'Por obra o a destajo: avanzan más rápido, pero cuida la calidad, porque la prisa trae retrabajos.',
  'Y el sueldo fijo, para tu gente de confianza. Si alguien trabaja contigo de forma permanente, la ley laboral le da derechos: consulta con tu contador cómo cumplir.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Cómo <span class="nar">pagar</span>?', top=100) + tabla(
  ['Forma', 'A favor', 'Cuidado'],
  [['Por día (jornal)', 'Simple', 'Sin incentivo a avanzar'], ['Por obra (destajo)', 'Más rápido', 'La prisa trae retrabajos'], ['Sueldo fijo', 'Confianza y permanencia', 'Derechos laborales: consulta']],
  lambda i: i, top=280, izq=260, der=260, tam=31)))

E.append(dict(frases=[
  'Para elegir bien, prueba primero con un trabajo pequeño, y pide referencias de dónde trabajó antes.',
  'Fíjate en la actitud: puntualidad, orden, ganas de aprender, cuidado con la seguridad.',
  'La habilidad se enseña. La actitud, casi nunca.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Elige <span class="nar">bien</span>', top=100) + tarjetas([
  ('🧪', 'Prueba pequeña', 'Antes de<br>comprometerte'), ('📞', 'Referencias', 'Dónde trabajó'), ('⭐', 'Actitud', 'Puntual, ordenado,<br>con ganas')],
  lambda i: [0, 0, 1][i], top=260, cols=3, alto=300, izq=230) + badge('LA HABILIDAD SE ENSEÑA; LA ACTITUD, NO', 2, 560, 620, '#3f9e5a', '💡')))

E.append(dict(frases=[
  'Enseña tu forma de trabajar. Escribe tus estándares: cómo se mide, cómo se corta, cómo se suelda y cómo se entrega una obra en tu taller.',
  'Usa listas de revisión, como la de la clase ocho, para que la calidad no dependa de tu memoria.',
  'Y aprovecha los cursos técnicos de la Academia para capacitar a tu equipo en soldadura, estructuras o techos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Enseña <span class="nar">tu forma de trabajar</span>', top=100) + lista([
  ('📝', 'Estándares <b class="nar">por escrito</b>'), ('✅', '<b class="nar">Listas de revisión</b>'), ('🎓', 'Capacitación con los <b class="nar">cursos técnicos</b>')],
  lambda i: i, top=290, izq=380, der=380, tam=35)))

E.append(dict(frases=[
  'La seguridad de tu equipo es tu responsabilidad.',
  'Entrega el equipo de protección y exige que se use: careta, guantes, lentes, botas, y arnés en altura.',
  'Haz una charla corta de seguridad antes de cada obra, y nunca permitas trabajos en altura sin protección. Un accidente puede cerrar tu taller.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">seguridad</span> es tuya', top=100) + tarjetas([
  ('🥽', 'EPP entregado', 'Y exigido'), ('🗣️', 'Charla de 5 min', 'Antes de cada obra'), ('🪢', 'Arnés en altura', 'Sin excepción')],
  lambda i: [1, 2, 2][i], top=260, cols=3, alto=300, izq=230)))

E.append(dict(frases=[
  'Delegar es la clave para crecer. Tú vendes, cotizas y supervisas; el maestro de taller fabrica; el ayudante apoya.',
  'Haz la cuenta. Un maestro de apoyo, veinte días a ciento veinte soles, te cuesta dos mil cuatrocientos. Si con ese tiempo libre cierras dos obras más como la cochera, ganas unos dos mil seiscientos ochenta.',
  'Se paga solo, y además tu taller crece.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Delegar <span class="nar">se paga solo</span>', top=100) + tabla(
  ['Concepto', 'Cálculo', 'S/'],
  [['Maestro de apoyo', '20 días × 120', '− 2 400'], ['2 obras más (como la cochera)', '2 × 1 340', '+ 2 680'], ['<b class="nar">Resultado</b>', '', '<b class="nar">+ 280 y un taller que crece</b>']],
  lambda i: [1, 1, 2][i], top=280, izq=280, der=280, tam=32, nota='Números de ejemplo.')))

E.append(dict(frases=[
  'Y cuida a tu gente: paga puntual, reconoce el buen trabajo, y dales movilidad o refrigerio en las obras lejanas.',
  'Un buen trabajador que se va te cuesta tiempo, plata y clientes. Cuidarlo es más barato que reemplazarlo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cuida <span class="nar">a tu gente</span>', top=100) + lista([
  ('💵', '<b class="nar">Paga puntual</b>'), ('👏', '<b class="nar">Reconoce</b> el buen trabajo'), ('🚌', 'Movilidad o refrigerio en obras lejanas')],
  lambda i: i // 2, top=300, izq=380, der=380, tam=35)))

E.append(dict(frases=[
  'Los cinco errores con el equipo.',
  'Uno: contratar con apuro, sin prueba.',
  'Dos: no enseñar tu forma de trabajar.',
  'Tres: tolerar trabajar sin protección.',
  'Cuatro: no delegar y querer hacerlo todo.',
  'Y cinco: pagar tarde.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con el equipo</span>', [
  ('Contratar con apuro', 'Problemas después.'), ('No enseñar', 'Calidad dispareja.'), ('Sin protección', 'Accidentes.'),
  ('No delegar', 'Tu taller no crece.'), ('Pagar tarde', 'Se va tu mejor gente.')])))

E.append(dict(frases=[
  'Tu reto: escribe los estándares de tu taller en una hoja: cómo medir, cortar, soldar, pintar y entregar. Ese será el manual de tu equipo.',
  'En la próxima clase, la última del curso: crecer.',
], html=reto('📝 Los estándares de tu taller<br><b class="nar">en una hoja</b>', 'CRECER')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: solo vas rápido; con un buen equipo, llegas lejos.',
  '¡Nos vemos en la clase doce!',
], html=final('Un taller crece <span class="nar">con su equipo</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c11')
