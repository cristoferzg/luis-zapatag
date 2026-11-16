"""El Negocio del Metalero · Clase 8: Entrega, garantía y postventa (cierre del módulo principal)."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 8'
E = []

E.append(dict(antes=0.5, frases=[
  'Terminaste la obra, cobraste, y nunca más supiste del cliente.',
  'Pero ese cliente conoce a vecinos, familiares y compañeros de trabajo que también necesitan portones, rejas y techos. Tu mejor vendedor es tu último cliente.',
  'Hoy aprendes a entregar bien, dar garantía y hacer postventa. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Tu mejor vendedor', 'es tu último cliente', 8, 'ENTREGA', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">⭐</div>')))

E.append(obra(7, [
  'La cochera está terminada.',
  'Hoy, en la última clase del módulo principal: la entrega, la garantía y la postventa.',
], 'Hoy: <span class="nar">entrega, garantía y postventa</span>'))

E.append(dict(frases=[
  'Antes de llamar al cliente, revisa tú mismo.',
  'Que el portón corra suave y la chapa cierre bien. Que no queden rebabas ni filos que corten. Que la pintura no tenga fallas.',
  'Que el techo no gotee: haz una prueba con manguera. Y deja la obra limpia, sin restos de electrodo, viruta ni desmonte.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Tu revisión <span class="nar">antes de entregar</span>', top=100) + lista([
  ('🚪', 'Portón corre suave · chapa cierra bien'), ('✋', 'Sin rebabas ni filos'), ('🎨', 'Pintura sin fallas'),
  ('🚿', 'Techo probado con manguera'), ('🧹', 'Obra limpia')],
  lambda i: [1, 1, 1, 2, 2][i], top=240, izq=360, der=360, tam=33)))

E.append(dict(frases=[
  'La entrega se hace con el cliente. Recorran juntos la obra, y muéstrale cómo usarla y cuidarla: por ejemplo, limpiar y lubricar el riel del portón cada cierto tiempo.',
  'Al final, que firme o confirme por escrito su conformidad. Con eso cierras la obra y se cobra el saldo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La <span class="nar">entrega</span>', top=100) + tarjetas([
  ('🚶', 'Recorran juntos', 'Revisa todo<br>con el cliente'), ('🛠️', 'Enseña a cuidarla', 'Limpiar y lubricar<br>el riel'), ('✍️', 'Conformidad', 'Firmada o<br>por escrito')],
  lambda i: [0, 0, 1][i], top=260, cols=3, alto=320, izq=230)))

E.append(dict(frases=[
  'La garantía, siempre por escrito. Di qué cubre: defectos de fabricación e instalación, como una soldadura que falla o un portón que se descuadra.',
  'Y qué no cubre: golpes, mal uso, falta de mantenimiento, o cambios hechos por otra persona.',
  'Pon el plazo, por ejemplo seis meses o un año, según el trabajo, y cómo reclamar. Una garantía clara da confianza y te protege.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">garantía</span>', top=100) + tabla(
  ['Cubre', 'No cubre'],
  [['Soldaduras que fallan', 'Golpes y choques'], ['Portón que se descuadra', 'Mal uso'], ['Goteras por mala instalación', 'Falta de mantenimiento'], ['', 'Cambios hechos por terceros']],
  lambda i: [0, 1, 1, 1][i], top=250, izq=330, der=330, tam=32) + badge('PLAZO Y CÓMO RECLAMAR, POR ESCRITO', 2, 620, 560, '#2b7fb3', '🛡️')))

E.append(dict(frases=[
  'Con el cliente contento, pide tres cosas.',
  'Permiso para tomar fotos de la obra y usarlas en tus redes.',
  'Una reseña en tu perfil de Google o de Facebook.',
  'Y una recomendación directa: "¿Conoce a alguien que necesite un portón, una reja o un techo? Con gusto lo atiendo."',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('Pide <span class="nar">tres cosas</span>', top=100) + tarjetas([
  ('📸', 'Fotos', 'Para tus redes'), ('⭐', 'Reseña', 'Google o Facebook'), ('🗣️', 'Recomendación', '"¿Conoce a alguien...?"')],
  lambda i: i + 1, top=260, cols=3, alto=300, izq=230)))

E.append(dict(frases=[
  'La postventa es simple, y casi nadie la hace.',
  'A los treinta días, un mensaje: "¿Todo bien con el portón?". A los seis meses, un recordatorio de mantenimiento.',
  'Y guarda una lista de tus clientes: nombre, teléfono, qué obra hiciste y cuándo. Esa lista, con los años, vale más que una máquina nueva.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('La <span class="nar">postventa</span>', top=100) + tabla(
  ['Cuándo', 'Qué haces'], [['A los 30 días', '"¿Todo bien con el portón?"'], ['A los 6 meses', 'Recordatorio de mantenimiento'], ['Siempre', 'Lista de clientes: nombre, teléfono, obra, fecha']],
  lambda i: [1, 1, 2][i], top=290, izq=330, der=330, tam=33)))

E.append(dict(frases=[
  'Así terminó la cochera. Cobraste seis mil quinientos, más el adicional de seiscientos cincuenta: siete mil ciento cincuenta.',
  'El costo total, con el adicional, fue de cinco mil ochocientos diez. Ganancia: mil trescientos cuarenta, casi el diecinueve por ciento, con tu hora ya pagada.',
  'Y el cliente te recomendó a dos vecinos. Esa es la diferencia entre un maestro y una empresa.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El caso: <span class="nar">resultado final</span>', top=100) + tabla(
  ['Concepto', 'S/'], [['Cobrado (6 500 + 650)', '7 150'], ['Costo total con adicional', '− 5 810'], ['<b class="nar">Ganancia</b>', '<b class="nar">1 340 (18.7 %)</b>'], ['Recomendaciones', '2 vecinos 🎉']],
  lambda i: [0, 1, 1, 2][i], top=280, izq=420, der=420, tam=34, nota='Tu hora de taller ya está pagada dentro del costo.')))

E.append(dict(frases=[
  'Los cinco errores al cerrar la obra.',
  'Uno: entregar sin revisar.',
  'Dos: entregar sin el cliente presente.',
  'Tres: garantía de palabra.',
  'Cuatro: no pedir fotos, reseña ni recomendación.',
  'Y cinco: olvidarte del cliente.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al cerrar la obra</span>', [
  ('Entregar sin revisar', 'Reclamos y retrabajos.'), ('Sin el cliente', 'Sin conformidad.'), ('Garantía de palabra', 'Discusiones.'),
  ('No pedir nada', 'Pierdes clientes nuevos.'), ('Olvidar al cliente', 'Pierdes trabajos repetidos.')])))

temas = ['Mentalidad', 'Tu hora', 'La visita', 'La cotización', 'Precio', 'Acuerdo', 'Cobranza', 'Entrega']
E.append(dict(frases=[
  '¡Terminaste el módulo principal! Ya puedes llevar una obra de principio a fin, como una empresa.',
  'Ahora viene el módulo avanzado: conseguir clientes, formalizar tu taller, armar tu equipo, y crecer.',
  'Tu reto antes de seguir: aplica todo el método a tu próxima obra, desde la visita hasta la postventa.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¡Módulo principal <span class="nar">completado</span>!', top=100) + '<div style="position:absolute;left:260px;right:260px;top:220px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px">' +
  ''.join(f'<div class="ap" data-en="0" data-mas="{0.3*i:.2f}" style="display:flex;gap:12px;align-items:center;background:rgba(126,224,138,.08);border:2px solid rgba(126,224,138,.5);border-radius:16px;padding:14px 16px;font-size:24px;font-weight:800"><span style="background:#3f9e5a;border-radius:50%;width:38px;height:38px;display:grid;place-items:center;flex:none">✓</span>{i+1}. {t}</div>' for i, t in enumerate(temas)) +
  '</div><div class="paso pop" data-en="1" style="position:absolute;left:50%;transform:translateX(-50%);top:470px;font-size:26px"><b>→</b>PRÓXIMA: CONSIGUE CLIENTES</div>'
  f'<div class="tarjeta ap" data-en="2" style="position:absolute;left:420px;right:420px;top:570px;text-align:center;font-size:30px">🏁 Aplica el método a <b class="nar">tu próxima obra</b><div style="font-size:24px;color:#c9d6e3;margin-top:8px">💬 WhatsApp <b class="nar">{WA}</b></div></div>'))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la obra no termina al cobrar; termina cuando el cliente te recomienda.',
  '¡Nos vemos en la clase nueve!',
], html=final('Cada cliente, <span class="nar">una recomendación</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c8')
