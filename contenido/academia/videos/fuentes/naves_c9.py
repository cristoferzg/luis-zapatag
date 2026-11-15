"""Curso Naves Parabólicas · Clase 9: Metrado y presupuesto de la nave (cierre del curso)."""
import sys
from motor import render, EMBLEMA
from comun import CAJAS, parabola, titulo, pantalla, errores_html, filas_html

CURSO = 'NAVES PARABÓLICAS · CLASE 9'
E = []

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  'Un error en el presupuesto, y trabajas gratis. Otro error, y pierdes la obra por cara.',
  '¡Bienvenido a la última clase! Hoy juntamos todo lo aprendido para metrar y presupuestar la nave completa, con números reales de InnovApp.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 55, 45)], html='''
<div style="position:absolute;left:1000px;top:260px;width:760px;font-family:DejaVu Sans Mono,monospace;font-size:44px;line-height:1.7;text-align:right">
 <div class="ap" data-en="0" data-mas="0.3">Acero ........ <b style="color:#ffd166">5 449 kg</b></div>
 <div class="ap" data-en="0" data-mas="0.8">Cobertura .... <b style="color:#ffd166">476 m²</b></div>
 <div class="ap" data-en="0" data-mas="1.3">Zapatas ...... <b style="color:#ffd166">14</b></div>
 <div class="ap" data-en="0" data-mas="1.8" style="border-top:3px solid #f97316;margin-top:10px">TOTAL ... <b class="nar">S/ ?</b></div>
</div>
<div style="position:absolute;left:120px;top:300px;width:760px">
 <div class="paso pop" data-en="1"><b>9</b>CLASE 9 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Metrado y <span class="nar">presupuesto</span></h1>
</div>'''))

# 1. Respuesta del reto
E.append(dict(frases=[
  'Primero, el reto. Nave de veinte metros, flecha óptima: dos metros ochenta.',
  'Radio en la cumbre: veinte al cuadrado, cuatrocientos, entre ocho por dos ochenta, veintidós cuarenta. Unos diecisiete metros noventa.',
  'Y si activaste las canaletas, viste cómo InnovApp las suma solas al presupuesto. ¡Eso es trabajar con datos!',
], html=titulo('Respuesta <span class="nar">del reto</span>') + filas_html([('f = 0.14 × 20', '2.80 m'), ('R = 400 ÷ (8 × 2.80)', '≈ 17.9 m'), ('Canaletas en InnovApp', 'suman solas')], 290)))

# 2. Las partidas
partidas = [('Materiales e insumos', 'Perfilería, cobertura, placas, pernos, soldadura y obra civil'), ('Mano de obra', 'Fabricación en taller y montaje en obra'),
            ('Gastos operativos', 'Grúa, transporte, andamios y EPP'), ('Gastos generales', 'Oficina, luz, desgaste de equipos · %'), ('Utilidad', 'Tu ganancia · %')]
E.append(dict(frases=[
  'Un presupuesto de nave tiene cinco partidas. Así lo arma también InnovApp.',
  'Uno: materiales e insumos. La perfilería, la cobertura, las placas, pernos y soldadura, y la obra civil.',
  'Dos: la mano de obra, de fabricación y de montaje.',
  'Tres: los gastos operativos: grúa, transporte, andamios y equipos de protección. Muchos los olvidan.',
  'Cuatro y cinco: los gastos generales y tu utilidad, como porcentaje del costo directo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50), (4, 1.0, 50, 50)], html=titulo('Las 5 <span class="nar">partidas</span>', top=100) +
 '<div style="position:absolute;left:260px;right:260px;top:220px">' + ''.join(
  f'<div class="ap" data-en="{[1,2,3,4,4][i]}" data-mas="{[0,0,0,0,1.5][i]}" style="display:flex;gap:22px;align-items:center;background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.45);border-radius:18px;padding:14px 24px;margin:12px 0">'
  f'<span class="paso" style="font-size:22px;flex:none"><b>{i+1}</b></span><div><div style="font-size:33px;font-weight:900">{t}</div><div style="font-size:24px;color:#c9d6e3">{d}</div></div></div>' for i, (t, d) in enumerate(partidas)) + '</div>'))

# 3. Metrado del acero
E.append(dict(frases=[
  'Empecemos por el acero de nuestra nave de quince por treinta. Este es el metrado de InnovApp, pieza por pieza.',
  'Las correas son lo que más pesa: mil ochocientos cuarenta y ocho kilos. Igual que calculamos en la clase cuatro.',
  'Las columnas, mil ochocientos cincuenta y cinco. Los cordones de los arcos, mil veinticinco. Y los arriostres y la celosía, el resto.',
  'En total: cinco mil cuatrocientos cuarenta y nueve kilos. Entre cuatrocientos setenta y dos metros cuadrados: unos once kilos y medio por metro cuadrado. Anota ese número: te sirve para estimar rápido otras naves parecidas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55), (3, 1.0, 50, 50)], html=titulo('Metrado <span class="nar">del acero</span>', top=100) + filas_html([
  ('Correas · 330 m de tubo 100×50×2.5', '1 848 kg'), ('Columnas · 70 m de tubo 6"×6"×6', '1 855 kg'), ('Cordones · 220 m de tubo 3"×2"×2.5', '1 025 kg'),
  ('Arriostres, celosía y tensores', '≈ 720 kg'), ('TOTAL · 5 449 kg ÷ 472 m²', '≈ 11.5 kg/m²')], 210)))
E.append(pantalla('p19_resumen', ['Todo esto lo tienes en el Resumen: el acero total, el costo de los tubos, las planchas, el área, y las zapatas.'], None, 'Resumen · Techos Metálicos', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.25, 50, 30)]

# 4. Obra civil
E.append(dict(frases=[
  'La obra civil también se presupuesta. InnovApp calcula las zapatas: en esta nave, catorce zapatas de un metro cincuenta y cinco por lado.',
  'Cincuenta y siete metros cúbicos de excavación, dieciséis ochenta y dos de concreto, y quinientos noventa y dos kilos de fierro.',
  'Si tú no haces la obra civil, déjalo claro en la cotización: no incluye zapatas. Si la haces, inclúyela. Pero nunca la olvides.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Obra civil: <span class="nar">zapatas</span>', top=110) + filas_html([
  ('Zapatas aisladas', '14 · 1.55 × 1.55 m'), ('Excavación', '57.5 m³'), ('Concreto f\'c 210', '16.8 m³'), ('Fierro', '592 kg')], 250)))

# 5. Presupuesto en InnovApp
E.append(pantalla('p22_presupuesto', ['Ahora, el presupuesto formal en InnovApp. Materiales, mano de obra, gastos operativos, gastos generales del quince por ciento, y utilidad del diez.', 'Arriba pones el nombre de tu empresa, tu RUC y tu celular. Se guardan para todas tus cotizaciones.'], CAJAS['p16_presupuesto'], 'Presupuesto · partidas', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.3, 50, 70), (1, 1.3, 45, 45)]
E.append(pantalla('p23_presupuesto_total', ['Y el total: ciento veinticinco mil setecientos doce soles, sin I G V. Con el adelanto del cincuenta por ciento, la validez y la garantía ya escritos.'], None, 'Total y condiciones', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.3, 50, 45)]
E[-1]['fundido'] = True

# 6. Análisis: por m²
E.append(dict(frases=[
  'Analicemos ese número. Ciento veinticinco mil setecientos doce, entre cuatrocientos setenta y dos metros cuadrados: unos doscientos sesenta y seis soles por metro cuadrado, incluyendo zapatas.',
  'Ese precio por metro cuadrado es tu referencia para cotizar rápido por teléfono. Pero ojo: es solo una referencia.',
  'Cada obra cambia: la altura, la luz, la cobertura, el terreno, la distancia. Siempre confirma con el metrado.',
  'Y muy importante: los precios de InnovApp son de referencia. Ve al Catálogo de precios y pon los de tu proveedor y tu zona. Así tu presupuesto es tuyo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 60)], html=titulo('El precio <span class="nar">por m²</span>', top=110) + '''
<div class="tarjeta pop" data-en="0" data-mas="2" style="position:absolute;left:460px;right:460px;top:270px;text-align:center;font-size:44px;font-weight:900;padding:28px">
 S/ 125 712 ÷ 472 m² ≈ <span style="color:#ffd166">S/ 266 / m²</span><div style="font-size:24px;color:#c9d6e3;font-weight:600;margin-top:8px">nave 15 × 30 m · con zapatas · sin IGV</div></div>
<div style="position:absolute;left:0;right:0;top:520px;display:flex;justify-content:center;gap:20px">
 <div class="paso pop" data-en="1" style="background:#3f9e5a"><b>✓</b>PARA COTIZAR RÁPIDO</div><div class="paso pop" data-en="2" style="background:#ff6b6b"><b>!</b>CONFIRMA CON EL METRADO</div>
</div>
<div class="tarjeta ap" data-en="3" style="position:absolute;left:420px;right:420px;top:660px;text-align:center;font-size:32px;font-weight:800">Actualiza el <span class="nar">Catálogo de precios</span> con los de tu proveedor</div>'''))

# 7. Presentar al cliente
E.append(dict(frases=[
  'Y para cerrar la venta, presenta bien.',
  'En InnovApp tienes la Propuesta visual para el cliente: una portada con la nave en 3D, opciones A, B y C con precio, y un enlace para que el cliente la vea y la acepte desde su celular.',
  'Ofrecer opciones funciona: por ejemplo, la opción A con aluzinc de cero treinta, la B con cero cuarenta, y la C con canaletas y claraboyas. El cliente elige, en vez de decir que no.',
  'Y siempre por escrito: adelanto, plazo, garantía, y qué no incluye.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Presenta <span class="nar">y cierra la venta</span>', top=100) + '<div style="position:absolute;left:160px;right:160px;top:250px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="2" data-mas="{0.8*i:.1f}" style="min-height:260px;text-align:center"><div class="paso" style="font-size:26px">OPCIÓN {o}</div><div style="font-size:30px;font-weight:900;margin-top:16px">{t}</div><div style="font-size:24px;color:#c9d6e3;margin-top:8px">{d}</div></div>'
         for i, (o, t, d) in enumerate([('A', 'Económica', 'Aluzinc 0.30 mm'), ('B', 'Reforzada', 'Aluzinc 0.40 mm'), ('C', 'Completa', '+ canaletas y claraboyas')])) + '</div>'
 '<div class="ap" data-en="1" style="position:absolute;left:0;right:0;top:600px;text-align:center;font-size:32px;font-weight:900;color:#ffd166">Propuesta visual: 3D · opciones A/B/C · enlace para aceptar</div>'
 '<div class="ap" data-en="3" style="position:absolute;left:0;right:0;top:680px;text-align:center;font-size:30px;font-weight:800">Por escrito: adelanto · plazo · garantía · qué no incluye</div>'))

# 8. Errores
E.append(dict(frases=[
  'Los cinco errores que te hacen perder plata.',
  'Uno: contar barras sin los sobrantes. Acuérdate de las correas: sesenta y seis barras, no cincuenta y cinco.',
  'Dos: olvidar la obra civil, o no decir que no la incluyes.',
  'Tres: no cobrar la grúa, el transporte y el EPP.',
  'Cuatro: usar precios viejos de materiales.',
  'Y cinco: cotizar solo por metro cuadrado, sin metrar.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">que cuestan plata</span>', [
  ('Barras sin sobrantes', 'Las correas: 66 barras, no 55.'), ('Olvidar la obra civil', 'O no aclarar que no está incluida.'), ('No cobrar operativos', 'Grúa, transporte, andamios y EPP.'),
  ('Precios viejos', 'Actualiza el Catálogo de precios.'), ('Solo por m², sin metrar', 'El m² es referencia, no presupuesto.')])))

# 9. Cierre del curso
temas = ['Qué es y dónde conviene', 'Geometría y trazo del arco', 'Arcos reticulados', 'Correas, arriostres y tensores', 'Columnas y anclajes',
         'Fabricación en serie', 'Izaje y montaje seguro', 'Cobertura y canaletas', 'Metrado y presupuesto']
E.append(dict(frases=[
  '¡Y con esto, terminaste el curso de naves parabólicas! Mira todo lo que aprendiste.',
  'Desde qué es una nave parabólica, la geometría y el trazo del arco, la fabricación y el montaje, hasta el presupuesto completo.',
  'Ahora tienes el conocimiento y la herramienta. Usa las plantillas de naves en Recursos Técnicos para tu próxima cotización.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¡Curso <span class="nar">completado</span>!', top=100) + '<div style="position:absolute;left:220px;right:220px;top:220px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">' +
 ''.join(f'<div class="ap" data-en="1" data-mas="{0.35*i:.2f}" style="display:flex;gap:14px;align-items:center;background:rgba(126,224,138,.08);border:2px solid rgba(126,224,138,.5);border-radius:16px;padding:16px 18px;font-size:25px;font-weight:800"><span style="background:#3f9e5a;border-radius:50%;width:40px;height:40px;display:grid;place-items:center;flex:none">✓</span>{i+1}. {t}</div>' for i, t in enumerate(temas)) +
 '</div><div class="paso pop" data-en="2" style="position:absolute;left:50%;transform:translateX(-50%);top:640px;font-size:26px"><b>↓</b>PLANTILLAS DE NAVES EN RECURSOS TÉCNICOS</div>'))
E.append(dict(antes=0.3, despues=3.0, frases=[
  'Gracias por aprender con Innova Contratistas. Sigue creciendo con nuestros otros cursos: soldadura estructural, estructuras metálicas, carpintería metálica, y lectura de planos.',
  '¡Éxitos en tus obras, y nos vemos en la próxima!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:200px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:190px;height:184px;background:#fff;border-radius:38px;padding:16px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">¡Gracias y <span class="nar">éxitos en tus obras</span>!</h2>
 <div style="margin-top:34px;display:flex;justify-content:center;gap:16px;flex-wrap:wrap">''' + ''.join(f'<div class="paso pop" data-en="0" data-mas="{2+0.6*i:.1f}" style="font-size:22px">{c}</div>' for i, c in enumerate(['SOLDADURA ESTRUCTURAL', 'ESTRUCTURAS METÁLICAS', 'CARPINTERÍA METÁLICA', 'LECTURA DE PLANOS'])) + '''</div>
 <div class="ap" data-en="1" style="margin-top:46px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c9.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
