"""Estructuras Metálicas · Clase 11: Control de calidad y documentos (dossier de calidad)."""
from sold_comun import *
from est_c8 import ETAPAS_EST_AV

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 11'
E = []

E.append(dict(antes=0.5, frases=[
  'Tu precio era el mejor, y tu trabajo de buena calidad...',
  '...pero la obra se la dieron a otro. ¿Por qué? Te pidieron el dossier de calidad, y no sabías qué era.',
  'En esta última clase aprendes qué documentos te piden en las obras grandes, y cómo armarlos sin complicarte. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿El dossier', 'de calidad?', 11, 'CALIDAD Y DOCUMENTOS', soldando=False) +
 '<div class="pop" data-en="0" style="position:absolute;left:1250px;top:300px;font-size:260px">📁</div>'))

E.append(escena_obra(3, [
  'Llegamos a la última clase del módulo avanzado.',
  'En minería, industria y obras con supervisión, no basta con hacerlo bien: hay que demostrarlo con papeles.',
], 'Hoy: <span class="nar">calidad y documentos</span>', ETAPAS_EST_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'El dossier de calidad es una carpeta con la prueba de todo lo que hiciste. Normalmente lleva estos documentos.',
  'Los certificados de los materiales: del acero, de los pernos, de la pintura. Los da el proveedor, y hay que pedirlos al comprar.',
  'Los papeles de la soldadura: el procedimiento, el WPS, y la calificación de los soldadores, como vimos en el curso de soldadura.',
  'Y los protocolos de inspección: medidas, soldaduras, apriete de pernos, espesor de pintura. Más las fotos y el acta de entrega.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Qué lleva <span class="nar">el dossier</span>?', top=110) + tarjetas([
  ('📜', 'Certificados', 'Acero, pernos y pintura'), ('🔥', 'Soldadura', 'WPS y calificación de soldadores'), ('📋', 'Protocolos', 'Medidas, soldadura, pernos, pintura'), ('📸', 'Fotos y acta', 'De avance y de entrega')],
  lambda i: [1, 1, 2, 3][i])))

E.append(dict(frases=[
  'El certificado del acero trae un número de colada: el lote de fabricación. Ese número también suele venir pintado o grabado en el perfil.',
  'La trazabilidad es poder decir: esta columna, la C uno, salió de esta barra, de esta colada, con este certificado.',
  'Se logra con algo simple: al cortar, anota en tu lista de piezas de qué colada salió cada marca.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">trazabilidad</span>', top=110) +
 '<div style="position:absolute;left:150px;right:150px;top:340px;display:flex;align-items:center;justify-content:space-between">' + ''.join(
  f'<div class="pop" data-en="{e}" style="text-align:center;width:320px"><div style="font-size:76px">{ic}</div><div style="font-size:30px;font-weight:900;margin-top:8px">{t}</div></div>' + (f'<div class="ap" data-en="{e}" style="font-size:56px;color:#f97316">→</div>' if i < 2 else '')
  for i, (ic, t, e) in enumerate([('📜', 'Certificado (colada)', 0), ('🟫', 'Barra con su colada', 1), ('🏷️', 'Pieza C1', 1)])) + '</div>' +
 badge('ANOTA LA COLADA DE CADA MARCA AL CORTAR', 2, 600, 640, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Un protocolo de inspección es un formato sencillo: fecha, marca de la pieza, qué se midió, la tolerancia, el resultado, y la firma de quien inspeccionó.',
  'Por ejemplo, el protocolo dimensional de la columna C uno: largo de tres mil milímetros, tolerancia de más o menos dos, medido tres mil uno. Conforme.',
  'Se hace mientras se fabrica, no al final. Lo que se mide al final, ya no se puede corregir barato.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">protocolo</span>', top=110) + tabla(
  ['Fecha', 'Marca', 'Control', 'Tolerancia', 'Medido', 'Resultado'], [['15/11', 'C1', 'Largo', '3000 ± 2 mm', '3001 mm', '<b style="color:#7ee08a">Conforme</b>'], ['15/11', 'C1', 'Rectitud', '≤ 3 mm', '1 mm', '<b style="color:#7ee08a">Conforme</b>']],
  lambda i: 1, top=280, izq=160, der=160, tam=29) + badge('SE HACE MIENTRAS SE FABRICA', 2, 700, 560, '#3f9e5a', '✓')))

E.append(dict(frases=[
  '¿Y si algo sale mal? Se registra una no conformidad: qué pasó, en qué pieza, cómo se corrigió, y la nueva inspección.',
  'Parece que te deja mal parado, pero es al revés: demuestra que tienes control. Un supervisor confía más en quien registra y corrige, que en quien dice que nunca se equivoca.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">no conformidad</span>', top=110) + lista([
  ('⚠️', 'Qué pasó y en qué pieza'), ('🔧', 'Cómo se corrigió'), ('✅', 'Nueva inspección'), ('🤝', 'Demuestra <b>control</b>, no debilidad')],
  lambda i: [0, 0, 0, 1][i], top=280, izq=330, der=330, tam=32)))

E.append(dict(frases=[
  'El dossier del mezanine quedaría así. Certificados del acero, de los pernos A trescientos veinticinco y de la pintura.',
  'El WPS y la calificación de los soldadores. Protocolos dimensionales de cada marca. Inspección visual de soldaduras.',
  'Registro de pernos ajustados, lecturas de espesor de pintura en micras, fotos del avance y de la entrega, y el acta firmada por el cliente.',
  'Las fotos las puedes ir guardando en el avance de obra de cada proyecto en InnovApp, con su fecha. Al final, ya están ordenadas.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El dossier <span class="nar">del mezanine</span>', top=100) + tabla(
  ['#', 'Documento'], [['1', 'Certificados: acero, pernos A325, pintura'], ['2', 'WPS y calificación de soldadores'], ['3', 'Protocolos dimensionales por marca'], ['4', 'Inspección visual de soldaduras'], ['5', 'Pernos ajustados · espesor de pintura (µm)'], ['6', 'Fotos de avance y acta de entrega']],
  lambda i: [0, 1, 1, 1, 2, 3][i], top=230, izq=360, der=360, tam=30)))

E.append(dict(frases=[
  'Los cinco errores con la calidad.',
  'Uno: no pedir los certificados al comprar. Después, el proveedor ya no los encuentra.',
  'Dos: mezclar barras sin saber de qué colada son.',
  'Tres: inspeccionar solo al final.',
  'Cuatro: esconder los errores en lugar de registrarlos y corregirlos.',
  'Y cinco: entregar sin acta firmada.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con la calidad</span>', [
  ('Sin certificados', 'Pídelos al comprar.'), ('Sin trazabilidad', 'No sabes de qué colada es cada pieza.'), ('Inspeccionar al final', 'Corregir sale caro.'),
  ('Esconder errores', 'Pierdes la confianza del supervisor.'), ('Sin acta', 'No puedes demostrar la entrega.')])))

E.append(dict(frases=[
  'Tu reto final: arma un formato de protocolo dimensional para tus trabajos, con fecha, marca, control, tolerancia, medido, resultado y firma.',
  'Mándanoslo, y te ayudamos a mejorarlo.',
], html=reto('📋 Arma tu formato de protocolo dimensional:<br><b class="nar">fecha · marca · control · tolerancia · medido · resultado · firma</b>', 'TU PRÓXIMA OBRA')))

E.append(dict(antes=0.3, despues=3.0, frases=[
  '¡Felicitaciones! Terminaste el curso completo de Estructuras Metálicas, con el módulo avanzado.',
  'Ya sabes calcular, fabricar, montar y demostrar la calidad de tu trabajo. ¡Éxitos en tus obras!',
], html=final('¡Curso <span class="nar">completado</span>!')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c11')
