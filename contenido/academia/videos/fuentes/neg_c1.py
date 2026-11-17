"""El Negocio del Metalero · Clase 1: De maestro a empresario."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 1'
E = []

E.append(dict(antes=0.5, frases=[
  'Trabajas de lunes a sábado, sales con las manos negras de tanto soldar... y a fin de mes no te queda casi nada.',
  'No es falta de trabajo ni de habilidad. Casi siempre es cómo se cotiza, cómo se cobra y dónde se escapa la plata.',
  'En este curso aprendes a manejar tu taller como una empresa, con números claros. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Trabajas de sol a sol', 'y no te queda nada', 1, 'MENTALIDAD', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">💸</div>')))

E.append(obra(0, [
  'En todo el curso seguimos un caso real: un cliente te escribe para hacer el portón y el techo de su cochera.',
  'Lo llevamos desde el primer mensaje hasta el cobro final y la recomendación. Hoy: el cambio de mentalidad.',
], 'Hoy: <span class="nar">de maestro a empresario</span>'))

E.append(dict(frases=[
  'La diferencia entre un buen maestro y un taller que crece no está en la soldadura.',
  'El maestro cobra a ojo; el empresario sabe cuánto le cuesta su hora. El maestro da el precio de palabra; el empresario manda una cotización escrita.',
  'El maestro empieza sin adelanto y mezcla la plata del taller con la de la casa. El empresario cobra un adelanto y separa las cuentas.',
  'Y cuando termina, el maestro se olvida. El empresario pide una recomendación y vuelve a llamar.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Maestro <span class="nar">vs. empresario</span>', top=100) + tabla(
  ['Maestro', 'Empresario'],
  [['Cobra a ojo', 'Sabe cuánto cuesta su hora'], ['Precio de palabra', 'Cotización escrita'], ['Empieza sin adelanto', 'Cobra adelanto'],
   ['Mezcla la plata', 'Separa las cuentas'], ['Termina y se olvida', 'Pide recomendación y vuelve']],
  lambda i: [1, 1, 2, 2, 3][i], top=240, izq=330, der=330, tam=33)))

E.append(dict(frases=[
  'Hay tres números que todo taller debe conocer.',
  'Uno: cuánto cuesta tu hora de taller. Sin eso, cualquier precio es una adivinanza.',
  'Dos: tu margen real, lo que de verdad queda después de pagar todo.',
  'Y tres: tu flujo de caja, cuándo entra y cuándo sale la plata. Se puede ganar en papel y quebrar por falta de efectivo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Tres números <span class="nar">que debes conocer</span>', top=100) + tarjetas([
  ('⏱️', 'Costo de tu hora', 'La base de<br>todo precio'), ('📊', 'Margen real', 'Lo que de verdad<br>queda'), ('💵', 'Flujo de caja', 'Cuándo entra<br>y cuándo sale')],
  lambda i: i + 1, top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  '¿Dónde se escapa la plata? En seis lugares.',
  'Las horas que no cobras: visitas, compras, traslados y cotizaciones.',
  'Los adicionales que haces "de favor", y los descuentos que das sin pensar.',
  'Los materiales que suben de precio entre la cotización y la compra, los cobros que se atrasan, y los retrabajos por errores.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Dónde se <span class="nar">escapa la plata</span>?', top=100) + lista([
  ('🚗', 'Horas no cobradas: visitas, compras, traslados'), ('🎁', 'Adicionales "de favor" y descuentos'),
  ('📈', 'Materiales que suben de precio'), ('⏳', 'Cobros atrasados'), ('🔁', 'Retrabajos por errores')],
  lambda i: [1, 2, 3, 3, 3][i], top=240, izq=330, der=330, tam=33)))

E.append(dict(frases=[
  'Mira el caso de la cochera. La cobraste en seis mil quinientos soles, y los materiales costaron tres mil. Parece que ganaste tres mil quinientos.',
  'Pero resta el ayudante, mil; el transporte, trescientos; los discos, electrodos y pintura que no contaste, cuatrocientos; y un retrabajo, doscientos.',
  'Quedan mil seiscientos. Y tú le dedicaste unas sesenta horas, contando visitas y compras: unos veintisiete soles por hora. Menos de lo que creías.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El caso: <span class="nar">¿cuánto ganaste?</span>', top=100) + tabla(
  ['Concepto', 'S/'],
  [['Cobrado', '6 500'], ['Materiales', '− 3 000'], ['Ayudante', '− 1 000'], ['Transporte', '− 300'], ['Consumibles no contados', '− 400'], ['Retrabajo', '− 200'],
   ['<b class="nar">Te queda</b>', '<b class="nar">1 600</b>'], ['Entre 60 horas de tu trabajo', '≈ 27 por hora']],
  lambda i: [0, 0, 1, 1, 1, 1, 2, 2][i], top=170, izq=460, der=460, tam=27, nota='Números de ejemplo.')))

E.append(dict(frases=[
  'Así está armado el curso. En el módulo principal: el costo de tu hora, la visita técnica, la cotización, el precio y la negociación, el acuerdo y el adelanto, la cobranza, y la entrega con garantía.',
  'Y en el módulo avanzado: conseguir clientes, formalizar tu taller, armar tu equipo, y crecer.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El mapa <span class="nar">del curso</span>', top=100) + mapa_obra(0, ETAPAS_N) +
  '<div class="tarjeta ap" data-en="1" style="position:absolute;left:420px;right:420px;top:600px;text-align:center;font-size:32px;font-weight:900">+ Avanzado: <span class="nar">clientes · formalización · equipo · crecer</span></div>'))

E.append(dict(frases=[
  'Los cinco errores del maestro que no crece.',
  'Uno: cobrar a ojo.',
  'Dos: no anotar los gastos.',
  'Tres: mezclar la plata del taller con la de la casa.',
  'Cuatro: empezar sin adelanto.',
  'Y cinco: no pedir recomendaciones.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">del maestro que no crece</span>', [
  ('Cobrar a ojo', 'Ganas menos de lo que crees.'), ('No anotar gastos', 'No sabes dónde se va.'), ('Mezclar la plata', 'No sabes si ganas.'),
  ('Sin adelanto', 'Financias al cliente.'), ('Sin recomendaciones', 'Siempre empiezas de cero.')])))

E.append(dict(frases=[
  'Tu reto: durante una semana, anota todos los gastos del taller, por pequeños que sean, y todas las horas que trabajas sin cobrar: visitas, compras y traslados.',
  'En la próxima clase usaremos esos datos para calcular el costo de tu hora.',
], html=reto('📝 Una semana anotando:<br><b class="nar">todos los gastos y las horas no cobradas</b>', 'EL COSTO DE TU HORA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: lo que no se mide, no se puede mejorar.',
  '¡Nos vemos en la clase dos!',
], html=final('Tu taller es <span class="nar">una empresa</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c1')
