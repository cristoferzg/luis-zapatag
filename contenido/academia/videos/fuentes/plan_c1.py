"""Lectura de Planos Metálicos · Clase 1: Partes de un plano — rótulo, escalas y láminas."""
from sold_comun import *

CURSO = 'LECTURA DE PLANOS · CLASE 1'
ETAPAS_PLAN = ['Partes y escalas', 'Vistas y cortes', 'Ejes y cotas', 'Soldadura AWS', 'Notas y especificaciones', 'Marcas y montaje']
OBRA = 'planos del mezanine'
E = []

def lamina(en, x, y, esc=1.0, mas=0, resalta=None):
    r = lambda k: ' style="stroke:#ffd166;stroke-width:6"' if resalta == k else ''
    return f'''<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{760*esc}" height="{520*esc}" viewBox="0 0 760 520">
 <rect x="10" y="10" width="740" height="500" fill="#f4f1e8" stroke="#2b3640" stroke-width="4"/>
 <rect x="30" y="30" width="480" height="300" fill="none" stroke="#5c6b7a" stroke-width="3"{r('planta')}/>
 <line x1="80" y1="80" x2="460" y2="80" stroke="#5c6b7a" stroke-width="2"/><line x1="80" y1="280" x2="460" y2="280" stroke="#5c6b7a" stroke-width="2"/>
 {"".join(f'<rect x="{xx-8}" y="{yy-8}" width="16" height="16" fill="#2b3640"/>' for xx in (80, 270, 460) for yy in (80, 280))}
 <rect x="30" y="350" width="230" height="140" fill="none" stroke="#5c6b7a" stroke-width="3"{r('detalle')}/><circle cx="145" cy="420" r="40" fill="none" stroke="#5c6b7a" stroke-width="3"/>
 <rect x="530" y="30" width="200" height="300" fill="none" stroke="#5c6b7a" stroke-width="3"{r('notas')}/>{"".join(f'<line x1="545" y1="{60+i*22}" x2="715" y2="{60+i*22}" stroke="#9aa6b0" stroke-width="3"/>' for i in range(11))}
 <rect x="530" y="350" width="200" height="140" fill="#e8e3d4" stroke="#2b3640" stroke-width="3"{r('rotulo')}/>
 <text x="630" y="385" fill="#2b3640" font-size="18" font-weight="900" text-anchor="middle">MEZANINE 4×6</text><text x="630" y="420" fill="#2b3640" font-size="30" font-weight="900" text-anchor="middle">E-02</text><text x="630" y="455" fill="#2b3640" font-size="16" text-anchor="middle">ESC. 1:50 · REV. B</text>
</svg>'''

E.append(dict(antes=0.5, frases=[
  'Te mandaron un plano por WhatsApp...',
  '...y lo miras, y lo miras, y no sabes por dónde empezar. Líneas, números, símbolos. Y el cliente espera tu cotización mañana.',
  'En este curso aprendes a leer planos de estructuras metálicas como un maestro. Hoy: las partes del plano. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿Por dónde', 'empiezo?', 1, 'PARTES Y ESCALAS', soldando=False) + lamina(0, 1060, 300, 0.95)))

E.append(escena_obra(0, [
  'En este curso vamos a leer, lámina por lámina, los planos de un mezanine metálico, como los que te llegan en un trabajo real.',
  'Hoy: cómo está organizado un plano, el rótulo, y las escalas.',
], 'Hoy: <span class="nar">partes del plano y escalas</span>', ETAPAS_PLAN, OBRA))

E.append(dict(frases=[
  'Una lámina tiene cuatro zonas. El dibujo principal: aquí, la planta del mezanine.',
  'Los detalles: dibujos más grandes de una parte, como una conexión.',
  'Las notas: los textos con las especificaciones. Casi nadie las lee, y ahí está la mitad de la información.',
  'Y el rótulo, o cajetín: la cédula de identidad del plano.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las zonas <span class="nar">de una lámina</span>', top=100) + lamina(0, 140, 250, 1.0) + lista([
  ('🗺️', '<b>Dibujo principal</b>: planta, elevación'), ('🔍', '<b>Detalles</b>: conexiones ampliadas'), ('📝', '<b>Notas</b>: especificaciones'), ('🪪', '<b>Rótulo</b>: la identidad del plano')],
  lambda i: i, top=280, izq=1000, der=100, tam=30)))

E.append(dict(frases=[
  'El rótulo te dice: el nombre del proyecto, y el número de lámina. E cero dos: la E es de estructuras.',
  'La escala, la fecha, y el profesional responsable, con su firma.',
  'Y la revisión: A, B, C. Cada vez que el plano cambia, sube la revisión. Siempre trabaja con la última. Fabricar con una revisión vieja es fabricar algo que ya no existe.',
], zoom=[(0, 1.0, 50, 50), (2, 1.1, 30, 70)], html=titulo('El <span class="nar">rótulo</span>', top=100) + lamina(0, 140, 250, 1.0, resalta='rotulo') + lista([
  ('🏷️', 'Proyecto y <b>lámina (E-02)</b>'), ('📐', '<b>Escala</b>, fecha, responsable y firma'), ('🔁', '<b>Revisión</b>: trabaja siempre con la última')],
  lambda i: i, top=300, izq=1000, der=100, tam=30)))

E.append(dict(frases=[
  'La escala dice cuántas veces más chico está el dibujo. Uno a cincuenta: un centímetro en el papel son cincuenta centímetros en la realidad.',
  'Uno a cien, para plantas generales. Uno a veinte, o uno a diez, para detalles.',
  'Ejemplo: en una planta a uno a cincuenta, una viga mide ocho centímetros en el papel. Ocho por cincuenta: cuatrocientos centímetros. Cuatro metros.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">escala</span>', top=110) + tabla(
  ['Escala', '1 cm en el papel =', 'Se usa para'], [['1:100', '1 m', 'Plantas generales'], ['1:50', '50 cm', 'Plantas y elevaciones'], ['1:20 · 1:10', '20 · 10 cm', 'Detalles']],
  lambda i: [0, 1, 1][i], top=260, izq=300, der=300, tam=33) + f'''
<div class="tarjeta ap" data-en="2" style="position:absolute;left:400px;right:400px;top:560px;text-align:center;font-size:34px">8 cm en el papel × 50 = <b class="nar">400 cm = 4 m</b></div>'''))

E.append(dict(frases=[
  'Pero cuidado con una trampa muy común. El plano se dibujó para imprimirse en tamaño A uno. Si te lo mandan por WhatsApp, o lo imprimen en A tres, ya no está a escala.',
  'Por eso, la regla de oro: manda la cota escrita. Nunca midas con regla para fabricar. Si una medida no está escrita, pregúntale al proyectista. Eso se llama una consulta, o RFI.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">trampa</span> de la escala', top=110) + f'''
<div style="position:absolute;left:300px;right:300px;top:280px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
 <div class="tarjeta ap" data-en="0" style="text-align:center;border-color:#ff6b6b"><div style="font-size:80px">📱📏</div><div style="font-size:30px;font-weight:900">Plano en el celular o en A3</div><div style="font-size:25px;color:#c9d6e3">ya no está a escala</div></div>
 <div class="tarjeta ap" data-en="1" style="text-align:center;border-color:#7ee08a"><div style="font-size:80px">✍️❓</div><div style="font-size:30px;font-weight:900">Manda la cota escrita</div><div style="font-size:25px;color:#c9d6e3">si falta, pregunta (RFI)</div></div>
</div>''' + badge('NUNCA MIDAS CON REGLA PARA FABRICAR', 1, 640, 680, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Un juego de planos de estructura suele venir así: notas generales, cimentación y anclajes, plantas, elevaciones y cortes, y detalles de conexiones.',
  'La primera lámina que debes leer, siempre, es la de notas generales: ahí dice el acero, la soldadura, los pernos, la pintura y las tolerancias. Lo vemos en la clase cinco.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">juego de planos</span>', top=110) + tabla(
  ['Lámina', 'Contenido'], [['E-00', 'Notas generales y especificaciones'], ['E-01', 'Cimentación y anclajes'], ['E-02', 'Planta estructural'], ['E-03', 'Elevaciones y cortes'], ['E-04', 'Detalles de conexiones']],
  lambda i: 0 if i else 1, top=250, izq=420, der=420, tam=33) + badge('LEE PRIMERO LAS NOTAS GENERALES', 1, 650, 780, '#3f9e5a', '1')))

E.append(dict(frases=[
  'Los cinco errores al empezar a leer un plano.',
  'Uno: medir con regla un plano reducido.',
  'Dos: trabajar con una revisión vieja.',
  'Tres: saltarse las notas generales.',
  'Cuatro: confundir las unidades: milímetros, centímetros o metros. Fíjate qué dice el rótulo o las notas.',
  'Y cinco: quedarse con la duda. Pregunta por escrito, y guarda la respuesta.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al empezar</span>', [
  ('Medir con regla', 'El plano reducido ya no está a escala.'), ('Revisión vieja', 'Fabricas algo que cambió.'), ('Sin leer las notas', 'Se te pasa el acero, la pintura...'),
  ('Confundir unidades', 'mm, cm o m.'), ('Quedarse con la duda', 'Pregunta por escrito.')])))

E.append(dict(frases=[
  'Tu reto: toma un plano que tengas, de cualquier obra. Encuentra el número de lámina, la escala, la revisión y la fecha. Mándanos una foto del rótulo con tus respuestas.',
  'En la próxima clase: vistas, cortes y detalles. Cómo entender una pieza en tres dimensiones desde un papel plano.',
], html=reto('🪪 En un plano tuyo, encuentra en el rótulo:<br><b class="nar">lámina · escala · revisión · fecha</b>', 'VISTAS Y CORTES')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: rótulo, última revisión, notas generales, y la cota escrita manda.',
  '¡Nos vemos en la clase dos!',
], html=final('La cota escrita <span class="nar">manda</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c1')
