"""Soldadura Estructural · Clase 11: Acero galvanizado e inoxidable."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 11'
E = []

E.append(dict(antes=0.5, frases=[
  'La baranda de acero inoxidable quedó brillante el día de la entrega...',
  '...y al mes, tenía manchas de óxido en cada unión. ¿Inoxidable que se oxida? Sí, si lo sueldas mal.',
  'Hoy aprendes a soldar acero galvanizado e inoxidable sin arruinarlos, y sin arruinar tu salud. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿Inoxidable', 'oxidado?', 11, 'GALVANIZADO E INOX')))

E.append(escena_obra(2, [
  'Seguimos con el módulo avanzado. Dos materiales que te van a pedir cada vez más: el galvanizado, en coberturas, tubos y cercos; y el inoxidable, en barandas, cocinas y la industria de alimentos.',
  'Los dos se sueldan con cuidados especiales.',
], 'Hoy: <span class="nar">galvanizado e inoxidable</span>', ETAPAS_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Empecemos por el galvanizado. Es acero común con una capa de zinc que lo protege del óxido.',
  'Al soldarlo, el zinc se evapora. Ese humo blanco da la fiebre de los humos metálicos, como vimos en la clase uno. Y además, el zinc llena el cordón de poros.',
  'Por eso, primero quita el zinc con la amoladora, unos dos o tres centímetros alrededor de la junta, de los dos lados. Ventila bien, y usa respirador.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">galvanizado</span>', top=110) + tarjetas([
  ('🛡️', 'Capa de zinc', 'Protege del óxido'), ('💨', 'Al soldar se evapora', 'Humo tóxico y poros'), ('🪚', 'Quita el zinc', '2 a 3 cm, los dos lados'), ('😷', 'Ventila y usa respirador', 'Siempre')],
  lambda i: [0, 1, 2, 2][i])))

E.append(dict(frases=[
  'Con el zinc retirado, se suelda como acero común: seis cero once, seis cero trece o siete cero dieciocho, según la pieza.',
  'Y el paso que casi todos olvidan: donde quitaste el zinc, el acero quedó desnudo. Ahí se va a oxidar primero.',
  'Al terminar, limpia la escoria y pinta la zona con galvanizado en frío, una pintura rica en zinc. Así devuelves la protección.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Después de <span class="nar">soldar</span>', top=110) + lista([
  ('🔥', 'Se suelda como acero común (6011, 6013 o 7018)'), ('⚠️', 'Donde quitaste el zinc, el acero quedó <b>desnudo</b>'), ('🖌️', 'Pinta con <b>galvanizado en frío</b> (rico en zinc)')],
  lambda i: i, top=290, izq=320, der=320, tam=33)))

E.append(dict(frases=[
  'Ahora el inoxidable. No se oxida porque tiene cromo, que forma una película protectora invisible.',
  'Pero tiene tres diferencias con el acero común. Uno: necesita su propio electrodo, de inoxidable. Un seis cero trece sobre inoxidable deja un cordón que se oxida.',
  'Dos: se calienta y se deforma más fácil, porque el calor se queda concentrado. Menos amperaje y cordones cortos.',
  'Y tres: se contamina. Una escobilla o un disco que usaste en fierro común le pega partículas de hierro, y esas partículas se oxidan. Por eso las manchas.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('El <span class="nar">inoxidable</span>', top=110) + tarjetas([
  ('🧪', 'Su propio electrodo', 'Nunca 6013 ni 7018'), ('🌡️', 'Se deforma fácil', 'Menos amperaje, cordones cortos'), ('🧽', 'Se contamina', 'Herramientas solo para inox')],
  lambda i: i + 1, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  '¿Qué electrodo? El inoxidable más común en barandas y cocinas es el trescientos cuatro: se suelda con E trescientos ocho L.',
  'El trescientos dieciséis, que aguanta mejor ambientes salinos o químicos, se suelda con E trescientos dieciséis L.',
  'Y para unir inoxidable con acero común, por ejemplo un poste de inoxidable a una placa de fierro: E trescientos nueve L. Es el electrodo para materiales distintos.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Qué <span class="nar">electrodo</span>?', top=110) + tabla(
  ['Unión', 'Electrodo'], [['Inox 304 con 304', '<b class="nar">E308L</b>'], ['Inox 316 con 316', '<b class="nar">E316L</b>'], ['Inox con acero común', '<b class="nar">E309L</b>']],
  lambda i: i, top=290, izq=420, der=420, tam=36, nota='Revisa siempre el tipo de inoxidable con el proveedor y el rango de amperaje en la caja.')))

E.append(dict(frases=[
  'Para que el inoxidable siga siendo inoxidable: ten escobillas, discos y limas solo para inoxidable. Márcalas, y no las mezcles.',
  'Después de soldar, la zona queda con colores, azul y dorado. Se limpia con pasta decapante para inoxidable, o con un disco de pulir para inox, y se enjuaga bien. Así la película protectora se recupera.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Que siga siendo <span class="nar">inoxidable</span>', top=110) + lista([
  ('🏷️', 'Escobillas, discos y limas <b>solo para inox</b>, marcados'), ('🌈', 'Los colores del calor se limpian'), ('🧴', '<b>Pasta decapante</b> o disco para inox, y enjuague')],
  lambda i: [0, 1, 1][i], top=290, izq=320, der=320, tam=33)))

E.append(dict(frases=[
  'Ejemplo: una baranda de inoxidable trescientos cuatro, con postes soldados a placas de acero común que van ancladas a la losa.',
  'Unión de tubos de inoxidable entre sí: E trescientos ocho L. Unión del poste de inoxidable a la placa de fierro: E trescientos nueve L.',
  'Cordones cortos, herramientas solo para inox, y al final, decapado y pulido. La placa de fierro se pinta, como siempre.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">baranda de inox</span>', top=110) + lista([
  ('🔗', 'Inox con inox: <b class="nar">E308L</b>'), ('🧱', 'Poste inox a placa de fierro: <b class="nar">E309L</b>'), ('✂️', 'Cordones cortos · herramientas solo para inox'), ('✨', 'Decapado y pulido · la placa se pinta')],
  lambda i: [0, 1, 2, 2][i], top=270, izq=320, der=320, tam=31)))

E.append(dict(frases=[
  'Los cinco errores con estos materiales.',
  'Uno: soldar galvanizado sin quitar el zinc ni ventilar.',
  'Dos: no reponer la protección con galvanizado en frío.',
  'Tres: soldar inoxidable con electrodo de acero común.',
  'Cuatro: usar en inox la escobilla o el disco del fierro.',
  'Y cinco: meterle demasiado calor al inox, y deformarlo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">galvanizado e inox</span>', [
  ('Zinc sin quitar', 'Humo tóxico y poros.'), ('Sin galvanizado en frío', 'Se oxida la zona soldada.'), ('Electrodo común en inox', 'El cordón se oxida.'),
  ('Herramientas del fierro', 'Manchas de óxido.'), ('Mucho calor en inox', 'Se deforma.')])))

E.append(dict(frases=[
  'Tu reto: identifica en tu taller qué electrodo usarías para tres uniones: inox trescientos cuatro con trescientos cuatro, inox con fierro, y galvanizado con galvanizado. Y cómo dejarías protegida cada una.',
  'En la última clase del módulo: cómo prepararte para la prueba de calificación de soldador.',
], html=reto('🧪 ¿Qué electrodo y qué protección para:<br><b class="nar">inox–inox · inox–fierro · galvanizado–galvanizado?</b>', 'CERTIFICACIÓN')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: cada material tiene su electrodo y su cuidado. Respétalos, y tu trabajo dura.',
  '¡Nos vemos en la clase doce!',
], html=final('Cada material, <span class="nar">su cuidado</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c11')
