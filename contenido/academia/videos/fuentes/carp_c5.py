"""Carpintería Metálica · Clase 5: Rejas y barandas de la casa."""
from sold_comun import *
from carp_c1 import ETAPAS_CARP, OBRA

CURSO = 'CARPINTERÍA METÁLICA · CLASE 5'
E = []

def reja_svg(en, x, y, n=8, horizontal=False, esc=1.0, mas=0):
    s = f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{460*esc}" height="{460*esc}" viewBox="0 0 460 460"><rect x="20" y="20" width="420" height="420" fill="none" stroke="#9aa6b0" stroke-width="16"/>'
    for i in range(n):
        p = 28 + (i + 1) * 404 / (n + 1)
        s += (f'<line x1="28" y1="{p:.0f}" x2="432" y2="{p:.0f}" stroke="#9aa6b0" stroke-width="10"/>' if horizontal else f'<line x1="{p:.0f}" y1="28" x2="{p:.0f}" y2="432" stroke="#9aa6b0" stroke-width="10"/>')
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'La reja de la ventana se veía fuerte...',
  '...pero a la primera patada, salió entera del muro. Estaba pegada con un poquito de cemento.',
  'Hoy aprendes a hacer rejas y barandas que protegen de verdad. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Salió entera', 'del muro', 5, 'REJAS Y BARANDAS', soldando=False) + reja_svg(0, 1220, 280)))

E.append(escena_obra(4, [
  'Nuestra casa lleva rejas en las ventanas del primer piso, y una baranda en el balcón del segundo.',
  'Las dos cosas protegen personas. Por eso, además de bonitas, tienen que ser seguras y estar bien ancladas.',
], 'Hoy: <span class="nar">rejas y barandas</span>', ETAPAS_CARP, OBRA))

E.append(dict(frases=[
  'Primero, la separación entre barrotes. Para seguridad, que no quede más de unos diez a doce centímetros libres. Así no pasa una persona, ni la cabeza de un niño.',
  'La fórmula para repartir los barrotes parejo: número de barrotes igual al ancho libre menos la separación, entre el ancho del barrote más la separación. Redondeas.',
  'Y la separación real queda: el ancho libre, menos todos los barrotes, entre el número de barrotes más uno.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Separación <span class="nar">de barrotes</span>', top=110) + reja_svg(0, 230, 260, 8, esc=1.0) + f'''
<div style="position:absolute;left:800px;right:120px;top:290px">
 <div class="tarjeta ap" data-en="0" style="font-size:30px;margin:12px 0">🧒 Libre entre barrotes: <b class="nar">≈ 10 a 12 cm</b> máx.</div>
 <div class="tarjeta ap" data-en="1" style="font-size:30px;margin:12px 0">n = (ancho libre − sep.) ÷ (barrote + sep.)</div>
 <div class="tarjeta ap" data-en="2" style="font-size:30px;margin:12px 0">sep. real = (ancho libre − n × barrote) ÷ (n + 1)</div>
</div>'''))

E.append(dict(frases=[
  'Ejemplo: la reja de la ventana mide uno veinte por uno veinte, con marco de una pulgada. El ancho libre queda en ciento quince centímetros.',
  'Barrotes de fierro cuadrado de media pulgada, uno punto veintisiete centímetros, y separación objetivo de once.',
  'Ciento quince menos once, entre doce punto veintisiete: ocho punto cinco. Redondeamos a ocho barrotes.',
  'Separación real: ciento quince menos ocho por uno punto veintisiete, entre nueve. Once punto seis centímetros. Pareja, y segura.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">reja de ventana</span>', top=110) + reja_svg(0, 230, 260, 8) + lista([
  ('📏', 'Ancho libre: 120 − 2 × 2.5 = <b>115 cm</b>'), ('▮', 'Barrote ½" = <b>1.27 cm</b> · objetivo <b>11 cm</b>'), ('🧮', '(115 − 11) ÷ 12.27 = 8.5 → <b class="nar">8 barrotes</b>'), ('✅', '(115 − 8 × 1.27) ÷ 9 = <b class="nar">11.6 cm</b>')],
  lambda i: i if i < 3 else 3, top=280, izq=800, der=120, tam=29)))

E.append(dict(frases=[
  'Ahora, el anclaje. Una reja no se pega con un poco de cemento. Se empotra: las patas del marco, o unas uñas de platina, entran de cinco a ocho centímetros en el muro, y se rellenan con mortero.',
  'O se fija con pernos de expansión o anclajes químicos al concreto, como vimos en estructuras.',
  'Y un consejo de seguridad muy importante: en cada piso, por lo menos una reja que se pueda abrir desde adentro, con pestillo o candado. Si hay un incendio, la familia tiene que poder salir.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Anclaje <span class="nar">y salida</span>', top=110) + tarjetas([
  ('🧱', 'Empotrada', 'Patas o uñas 5 a 8 cm en el muro, con mortero'), ('🔩', 'Con anclajes', 'Pernos de expansión o químicos'), ('🔥', 'Reja de escape', 'Por piso, al menos una que abra desde adentro')],
  lambda i: i, top=290, cols=3, alto=330, izq=220)))

E.append(dict(frases=[
  'Ahora la baranda del balcón. En balcones, por lo menos un metro de alto. En escaleras, unos noventa centímetros, medidos desde la punta del peldaño. Revisa siempre lo que pide el reglamento.',
  'Barrotes verticales, no horizontales. Las barras horizontales se vuelven una escalera para un niño.',
  'Postes cada uno a uno y medio metros, bien anclados con placa y pernos. Y el pasamanos continuo, sin puntas que enganchen la ropa.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('La <span class="nar">baranda</span>', top=110) + reja_svg(1, 250, 260, 8, horizontal=True, esc=0.9) + reja_svg(1, 760, 260, 8, esc=0.9, mas=1) +
 '<div class="ap" data-en="1" style="position:absolute;left:250px;top:690px;font-size:28px;font-weight:900;color:#ff6b6b">✕ horizontales: se escalan</div>' +
 '<div class="ap" data-en="1" data-mas="1" style="position:absolute;left:760px;top:690px;font-size:28px;font-weight:900;color:#7ee08a">✓ verticales</div>' + lista([
  ('📏', 'Balcón ≥ <b>1.00 m</b> · escalera ≈ <b>0.90 m</b>'), ('🏛️', 'Postes cada <b>1 a 1.5 m</b>, con placa y pernos'), ('✋', 'Pasamanos <b>continuo</b>, sin puntas')],
  lambda i: [0, 2, 2][i], top=280, izq=1240, der=80, tam=26)))

E.append(dict(frases=[
  'Sobre el diseño: los adornos venden, pero cuestan. Puntas, volutas y platinas curvas suman peso, horas de taller y soldadura.',
  'Cotiza el diseño aparte: una reja simple y una decorada no cuestan lo mismo, aunque midan igual.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">adornos</span> se cobran', top=110) + f'''
<div style="position:absolute;left:300px;right:300px;top:290px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
 <div class="tarjeta ap" data-en="0" style="text-align:center"><div style="font-size:80px">▮▮▮</div><div style="font-size:32px;font-weight:900">Simple</div><div style="font-size:26px;color:#c9d6e3">menos peso, menos horas</div></div>
 <div class="tarjeta ap" data-en="0" data-mas="1" style="text-align:center;border-color:#ffd166"><div style="font-size:80px">⚜️🌀</div><div style="font-size:32px;font-weight:900">Decorada</div><div style="font-size:26px;color:#c9d6e3">más peso, más horas, más soldadura</div></div>
</div>''' + badge('COTIZA EL DISEÑO APARTE', 1, 760, 680, '#3f9e5a', 'S/')))

E.append(dict(frases=[
  'Los cinco errores de rejas y barandas.',
  'Uno: barrotes muy separados.',
  'Dos: pegarlas con un poco de cemento, sin empotrar ni anclar.',
  'Tres: enrejar toda la casa sin una salida de emergencia.',
  'Cuatro: barandas con barras horizontales, que los niños escalan.',
  'Y cinco: barandas bajas, o postes flojos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">de rejas y barandas</span>', [
  ('Barrotes muy separados', 'Pasa una persona o un niño.'), ('Sin empotrar', 'Sale de una patada.'), ('Sin salida de emergencia', 'Peligro en un incendio.'),
  ('Barras horizontales', 'Se escalan.'), ('Baranda baja o floja', 'No protege.')])))

E.append(dict(frases=[
  'Tu reto: calcula los barrotes de una reja de uno cincuenta de ancho, con marco de una pulgada y barrotes de media pulgada, con separación objetivo de diez centímetros. ¿Cuántos barrotes, y cuál es la separación real?',
  'En la próxima clase: la escalera metálica. Contrapaso, paso, la regla de oro, y cuántos peldaños lleva.',
], html=reto('🧮 Reja de 1.50 m, marco 1", barrote ½", objetivo 10 cm:<br><b class="nar">¿cuántos barrotes? ¿separación real?</b>', 'LA ESCALERA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: una reja y una baranda cuidan personas. Hazlas fuertes, bien ancladas y seguras.',
  '¡Nos vemos en la clase seis!',
], html=final('Fuerte, anclada <span class="nar">y segura</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c5')
