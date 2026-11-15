"""Estructuras Metálicas · Clase 1: El acero y los perfiles — calcula el peso antes de comprar."""
from sold_comun import *

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 1'
ETAPAS_EST = ['Perfiles y pesos', 'Vigas y columnas', 'Pernos', 'Entrepiso', 'Corte y tolerancias', 'Pintura', 'Montaje']
OBRA = 'mezanine de 4 × 6 m'
E = []

def perfil_svg(tipo):
    c = '#9aa6b0'; o = '#56687a'
    f = {
      'Tubo cuadrado': f'<rect x="40" y="40" width="120" height="120" fill="none" stroke="{c}" stroke-width="16"/>',
      'Tubo redondo': f'<circle cx="100" cy="100" r="62" fill="none" stroke="{c}" stroke-width="14"/>',
      'Viga W (H)': f'<rect x="30" y="35" width="140" height="18" fill="{c}"/><rect x="91" y="53" width="18" height="94" fill="{c}"/><rect x="30" y="147" width="140" height="18" fill="{c}"/>',
      'Canal C': f'<path d="M150 40 H55 V160 H150" fill="none" stroke="{c}" stroke-width="16"/>',
      'Perfil Z': f'<path d="M30 45 H100 V155 H170" fill="none" stroke="{c}" stroke-width="14"/>',
      'Ángulo L': f'<path d="M55 35 V155 H165" fill="none" stroke="{c}" stroke-width="18"/>',
      'Platina': f'<rect x="20" y="88" width="160" height="24" fill="{c}"/>',
      'Plancha': f'<polygon points="20,120 120,80 185,105 85,150" fill="{c}" stroke="{o}" stroke-width="4"/>',
    }[tipo]
    return f'<svg width="170" height="170" viewBox="0 0 200 200">{f}</svg>'

E.append(dict(antes=0.5, frases=[
  'Compraste el fierro "a ojo" para un mezanine...',
  '...y te faltaron tres tubos. Otro viaje, otro flete, y el maestro esperando. O al revés: te sobraron trescientos kilos que nadie te paga.',
  'En este curso vas a entender las estructuras metálicas de verdad. Y hoy empezamos por lo básico: los perfiles y cómo calcular su peso. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿Fierro', 'a ojo?', 1, 'PERFILES Y PESOS', soldando=False) +
 f'<div class="ap" data-en="0" style="position:absolute;left:1100px;top:280px;opacity:.9">{perfil_svg("Viga W (H)").replace("170", "420")}</div>'))

E.append(escena_obra(0, [
  'En este curso vamos a construir, paso a paso, una obra real: un mezanine metálico de cuatro por seis metros dentro de un taller.',
  'Columnas, vigas, viguetas, pernos, entrepiso, pintura y montaje. Hoy: qué perfiles lleva, y cuánto pesa todo.',
], 'Hoy: <span class="nar">perfiles, acero y pesos</span>', ETAPAS_EST, OBRA))

E.append(dict(frases=[
  'Primero, el acero. No todo el fierro es igual. Los más usados en estructuras son tres.',
  'El A treinta y seis: planchas, platinas, ángulos y canales. Su fluencia es de unos doscientos cincuenta megapascales.',
  'El A quinientos grado B: los tubos estructurales. Resiste más, unos trescientos quince megapascales.',
  'Y el A quinientos setenta y dos grado cincuenta: vigas W y perfiles pesados, unos trescientos cuarenta y cinco.',
  'La fluencia es el esfuerzo en que el acero empieza a deformarse para siempre. Mientras más alto, más carga aguanta el mismo perfil.',
], zoom=[(0, 1.0, 50, 50), (4, 1.04, 50, 55)], html=titulo('El <span class="nar">acero</span> estructural', top=110) + tabla(
  ['Acero', 'Dónde lo encuentras', 'Fluencia'],
  [['ASTM A36', 'Planchas, platinas, ángulos, canales', '≈ 250 MPa'], ['ASTM A500 Gr. B', 'Tubos estructurales', '≈ 315 MPa'], ['ASTM A572 Gr. 50', 'Vigas W y perfiles pesados', '≈ 345 MPa']],
  lambda i: i + 1, top=270, izq=220, der=220, tam=33, nota='Fluencia (Fy): esfuerzo en que el acero empieza a deformarse permanentemente.')))

nombres = ['Tubo cuadrado', 'Tubo redondo', 'Viga W (H)', 'Canal C', 'Perfil Z', 'Ángulo L', 'Platina', 'Plancha']
usos = ['Columnas, tijerales, marcos', 'Barandas, columnas', 'Vigas y columnas pesadas', 'Viguetas, correas', 'Correas de techo', 'Arriostres, marcos', 'Conexiones, refuerzos', 'Placas base, cartelas']
E.append(dict(frases=[
  'Ahora, los perfiles. Tubos cuadrados, rectangulares y redondos: livianos, fáciles de soldar, y se ven limpios.',
  'La viga W, o H: el perfil más eficiente para vigas largas y cargas grandes.',
  'El canal C y el perfil Z: livianos, para viguetas y correas.',
  'Y el ángulo, la platina y la plancha: para arriostres, conexiones y placas.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">perfiles</span>', top=110) +
 '<div style="position:absolute;left:120px;right:120px;top:250px;display:grid;grid-template-columns:repeat(4,1fr);gap:18px">' + ''.join(
  f'<div class="tarjeta pop" data-en="{[0,0,1,2,2,3,3,3][i]}" style="text-align:center;padding:10px">{perfil_svg(n)}<div style="font-size:27px;font-weight:900">{n}</div><div style="font-size:20px;color:#c9d6e3">{u}</div></div>'
  for i, (n, u) in enumerate(zip(nombres, usos))) + '</div>'))

E.append(dict(frases=[
  'Cómo se lee un tubo: tubo cuadrado de seis por seis pulgadas, por cuatro y medio milímetros de espesor.',
  'Seis pulgadas son ciento cincuenta milímetros de lado. Y el espesor es la pared. Dos tubos iguales por fuera pueden pesar muy distinto por dentro.',
  'Por ejemplo, el de seis por seis en tres milímetros pesa trece punto siete kilos por metro. En seis milímetros, veintiséis y medio. Casi el doble.',
  'Por eso, en la cotización y en la compra, el espesor siempre se escribe. "Tubo de seis" no dice nada.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Lee el <span class="nar">perfil</span>', top=110) + f'''
<div class="tarjeta ap" data-en="0" style="position:absolute;left:260px;right:260px;top:250px;text-align:center;font-size:40px;font-weight:900">Tubo cuadrado <span class="nar">6" × 6"</span> × <span style="color:#5cc8ff">4.5 mm</span></div>
<div style="position:absolute;left:260px;right:260px;top:400px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:26px">''' + ''.join(
  f'<div class="tarjeta ap" data-en="2" data-mas="{0.6*i}" style="text-align:center"><svg width="150" height="150" viewBox="0 0 150 150"><rect x="{10+e/2}" y="{10+e/2}" width="{130-e}" height="{130-e}" fill="none" stroke="#9aa6b0" stroke-width="{e}"/></svg>'
  f'<div style="font-size:30px;font-weight:900">{t} mm</div><div style="font-size:42px;font-weight:900;color:#ffd166">{p} kg/m</div></div>'
  for i, (t, e, p) in enumerate([('3.0', 6, '13.7'), ('4.5', 9, '20.2'), ('6.0', 12, '26.5')])) + '</div>' +
 badge('SIEMPRE ESCRIBE EL ESPESOR', 3, 690, 790, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Calcular el peso es fácil: largo total por el peso por metro. El peso por metro sale en el catálogo del proveedor, y también en el catálogo de perfiles de InnovApp.',
  'Y para planchas, una regla de oro: un metro cuadrado de plancha de un milímetro pesa siete punto ochenta y cinco kilos. Multiplica por el espesor.',
  'Una placa de treinta por treinta centímetros, en doce milímetros: cero punto cero nueve metros cuadrados, por doce, por siete punto ochenta y cinco. Unos ocho y medio kilos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 60)], html=titulo('Calcula el <span class="nar">peso</span>', top=110) + f'''
<div class="tarjeta ap" data-en="0" style="position:absolute;left:300px;right:300px;top:260px;text-align:center;font-size:38px;font-weight:900">Perfil: <span class="nar">largo (m) × kg/m</span></div>
<div class="tarjeta ap" data-en="1" style="position:absolute;left:300px;right:300px;top:400px;text-align:center;font-size:38px;font-weight:900">Plancha: <span class="nar">m² × espesor (mm) × 7.85</span></div>
<div class="tarjeta ap" data-en="2" style="position:absolute;left:300px;right:300px;top:560px;text-align:center;font-size:32px;border-color:#7ee08a">Placa 30 × 30 cm × 12 mm → 0.09 × 12 × 7.85 = <b style="color:#7ee08a">≈ 8.5 kg</b></div>'''))

filas = [['Columnas', '6 × 3 m', 'Tubo 6"×6"×4.5', '20.2', '364'], ['Vigas principales', '3 × 4 m', 'W8×18', '26.8', '322'],
         ['Viguetas', '16 × 3 m', 'C 6"×2"×2.5', '5.3', '254'], ['Placas base', '6 × 30×30 cm', 'Plancha 12 mm', '8.5 c/u', '51'], ['<b class="nar">Total</b>', '', '', '', '<b class="nar">≈ 991</b>']]
E.append(dict(frases=[
  'Vamos con nuestro mezanine. Lleva seis columnas de tres metros, en tubo de seis por seis por cuatro y medio. Dieciocho metros: trescientos sesenta y cuatro kilos.',
  'Tres vigas principales de cuatro metros, en viga W ocho por dieciocho: trescientos veintidós kilos.',
  'Dieciséis viguetas de tres metros, en canal C de seis por dos por dos y medio: doscientos cincuenta y cuatro kilos.',
  'Y seis placas base: unos cincuenta y un kilos. Total: casi una tonelada. Estos perfiles son un predimensionamiento para aprender a metrar; el diseño final lo verifica el ingeniero.',
], zoom=[(0, 1.0, 50, 50), (3, 1.03, 50, 55)], html=titulo('El metrado del <span class="nar">mezanine</span>', top=100) + tabla(
  ['Elemento', 'Cantidad', 'Perfil', 'kg/m', 'kg'], filas, lambda i: [0, 1, 2, 3, 3][i], top=230, izq=150, der=150, tam=29,
  nota='Perfiles y pesos del catálogo de InnovApp. Predimensionamiento de ejemplo: el diseño final lo verifica el ingeniero.')))

E.append(dict(frases=[
  'Y ahora, compra en barras. Los perfiles vienen en barras de seis metros, y las vigas W también en doce.',
  'Columnas: seis piezas de tres metros. Salen dos por barra: tres barras, cero desperdicio.',
  'Viguetas: dieciséis de tres metros: ocho barras, cero desperdicio.',
  'Vigas: tres de cuatro metros. En barras de seis, te sobran dos metros por viga. Pero en una sola viga de doce metros, salen las tres exactas. Pregunta siempre por el largo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 60)], html=titulo('Compra en <span class="nar">barras</span>', top=110) + f'''
<div style="position:absolute;left:220px;right:220px;top:260px">
 {"".join(f'<div class="ap" data-en="{en}" style="display:flex;align-items:center;gap:20px;margin:22px 0"><div style="width:330px;font-size:28px;font-weight:900">{t}</div><div style="flex:1;display:flex;height:46px;border-radius:8px;overflow:hidden;border:3px solid #56687a">' + "".join(f'<div style="flex:{w};background:{c};border-right:3px solid #0b2a45;display:grid;place-items:center;font-size:22px;font-weight:800">{l}</div>' for w, c, l in segs) + f'</div><div style="width:200px;text-align:right;font-size:26px;font-weight:900;color:{col}">{r}</div></div>' for en, t, segs, r, col in [
   (1, 'Columnas (barra 6 m)', [(3, '#f97316', '3 m'), (3, '#f97316', '3 m')], '× 3 barras', '#7ee08a'),
   (2, 'Viguetas (barra 6 m)', [(3, '#f97316', '3 m'), (3, '#f97316', '3 m')], '× 8 barras', '#7ee08a'),
   (3, 'Vigas (barra 6 m)', [(4, '#f97316', '4 m'), (2, '#ff6b6b', 'sobra 2')], '× 3 = 6 m perdidos', '#ff6b6b'),
   (3, 'Vigas (barra 12 m)', [(4, '#f97316', '4 m'), (4, '#f97316', '4 m'), (4, '#f97316', '4 m')], '× 1 barra', '#7ee08a')])}
</div>'''))

E.append(dict(frases=[
  'Los cinco errores al comprar fierro.',
  'Uno: pedir "tubo de seis" sin decir el espesor.',
  'Dos: usar tubo delgado de carpintería en una estructura que carga.',
  'Tres: no sumar las planchas, cartelas y pernos.',
  'Cuatro: comprar sin pensar en el largo de las barras, y botar los sobrantes.',
  'Y cinco: no agregar un pequeño margen, de tres a cinco por ciento, para cortes y errores.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al comprar</span>', [
  ('"Tubo de seis" sin espesor', 'Te venden el más delgado.'), ('Tubo de carpintería en estructura', 'No está hecho para cargar.'), ('Olvidar planchas y pernos', 'También pesan y cuestan.'),
  ('Ignorar el largo de barra', 'Sobrantes que nadie paga.'), ('Sin margen', 'Un corte malo y falta material.')])))

E.append(dict(frases=[
  'Tu reto: elige una estructura que hayas hecho, o que vayas a hacer. Haz su metrado como el del mezanine: elemento, cantidad, perfil, kilos por metro y kilos totales.',
  'En la próxima clase: cómo trabajan las vigas y las columnas, y cómo predimensionarlas con reglas sencillas.',
], html=reto('📋 Haz el metrado de una estructura tuya:<br><b class="nar">elemento · cantidad · perfil · kg</b>', 'VIGAS Y COLUMNAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: en estructuras metálicas, el que sabe calcular el peso, sabe cotizar.',
  '¡Nos vemos en la clase dos!',
], html=final('Calcula el peso, <span class="nar">cotiza bien</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c1')
