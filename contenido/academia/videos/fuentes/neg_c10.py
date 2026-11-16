"""El Negocio del Metalero · Clase 10: Formaliza tu taller (módulo avanzado)."""
from neg_comun import *

CURSO = 'EL NEGOCIO DEL METALERO · CLASE 10'
E = []

E.append(dict(antes=0.5, frases=[
  'Una constructora quiere que le hagas las barandas de un edificio. Es la obra más grande del año.',
  'Pero te piden factura, y tú no tienes RUC. La obra se la lleva otro.',
  'Hoy ves los pasos para formalizar tu taller y abrirte a clientes más grandes. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('"¿Me da factura?"', 'y no tienes RUC', 10, 'FORMALÍZATE', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🧾</div>')))

E.append(obra_av(1, [
  'Ya sabes cómo conseguir más clientes.',
  'Hoy: formalizar tu taller. Esta clase te orienta; tu caso exacto lo confirma un contador y la SUNAT, porque las reglas cambian.',
], 'Hoy: <span class="nar">formaliza tu taller</span>'))

E.append(dict(frases=[
  '¿Para qué formalizarte? Para trabajar con empresas, constructoras e instituciones, que solo contratan con comprobante.',
  'Para dar boleta o factura a tus clientes, acceder a créditos del banco para comprar máquinas, y dar una imagen seria.',
  'Y para trabajar tranquilo, sin miedo a multas ni a perder una obra grande.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('¿Para qué <span class="nar">formalizarte</span>?', top=100) + tarjetas([
  ('🏢', 'Clientes grandes', 'Empresas y<br>constructoras'), ('🧾', 'Comprobantes', 'Boleta o factura'), ('🏦', 'Créditos', 'Para máquinas<br>y materiales'), ('😌', 'Tranquilidad', 'Sin multas')],
  lambda i: [0, 1, 1, 2][i], top=260, cols=4, alto=300, izq=120)))

E.append(dict(frases=[
  'El primer paso es el RUC, el registro de contribuyentes de la SUNAT. Puedes sacarlo como persona natural con negocio, o como empresa.',
  'Al inscribirte eliges tu régimen tributario. Hay cuatro: el Nuevo RUS, el Régimen Especial, el Régimen MYPE Tributario y el Régimen General.',
  'Un dato clave para el metalero: en el Nuevo RUS no puedes emitir facturas. Si quieres trabajar con empresas que piden factura, necesitas otro régimen.',
  'Cuál te conviene depende de tus ingresos y de tus clientes. Elígelo con un contador.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('RUC <span class="nar">y régimen</span>', top=100) + tabla(
  ['Régimen', '¿Factura?', 'Para quién, en general'],
  [['Nuevo RUS', '<b style="color:#ff6b6b">No</b>', 'Negocios muy pequeños, solo boletas'], ['Régimen Especial (RER)', 'Sí', 'Pequeños negocios'], ['Régimen MYPE Tributario', 'Sí', 'Pequeñas y medianas empresas'], ['Régimen General', 'Sí', 'Empresas grandes']],
  lambda i: [1, 2, 2, 2][i], top=260, izq=260, der=260, tam=31, nota='Orientación general: confirma tu caso con un contador y la SUNAT.')))

E.append(dict(frases=[
  'El segundo paso: los comprobantes. Hoy la SUNAT trabaja con comprobantes electrónicos: boletas y facturas que se emiten desde el sistema o un programa autorizado.',
  'Cada cobro, con su comprobante. Y guarda los comprobantes de tus compras de material: en varios regímenes te sirven para tus impuestos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Los <span class="nar">comprobantes</span>', top=100) + lista([
  ('📲', 'Boletas y facturas <b class="nar">electrónicas</b>'), ('💵', '<b class="nar">Cada cobro</b>, con su comprobante'), ('🗂️', 'Guarda los de <b class="nar">tus compras</b>')],
  lambda i: [0, 0, 1][i], top=290, izq=380, der=380, tam=35)))

E.append(dict(frases=[
  'El tercer paso: tu taller. Consulta en tu municipalidad la licencia de funcionamiento. Un taller de soldadura hace ruido y trabaja con fuego, así que suelen revisar la seguridad del local.',
  'Ten extintor, botiquín, buena ventilación y la instalación eléctrica en orden. Te protege a ti, a tu equipo y a tus vecinos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Tu <span class="nar">taller en regla</span>', top=100) + tarjetas([
  ('🏛️', 'Licencia municipal', 'Consulta en tu<br>municipalidad'), ('🧯', 'Extintor y botiquín', 'Siempre a mano'), ('💨', 'Ventilación', 'Humos de<br>soldadura'), ('⚡', 'Electricidad', 'Instalación<br>en orden')],
  lambda i: [0, 1, 1, 1][i], top=260, cols=4, alto=300, izq=120)))

E.append(dict(frases=[
  'Y los seguros. En obras de construcción, las empresas suelen pedir que tus trabajadores tengan un seguro de trabajo de riesgo, como el SCTR.',
  'Considera ese costo en tus cotizaciones para empresas. Y aunque nadie te lo pida, el equipo de protección personal no se negocia.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">seguros</span>', top=100) + lista([
  ('🦺', 'Obras de construcción: <b class="nar">seguro de riesgo (SCTR)</b>'), ('🧮', 'Inclúyelo en la <b class="nar">cotización</b> a empresas'), ('🥽', '<b class="nar">EPP</b> siempre')],
  lambda i: [0, 1, 1][i], top=290, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  '¿Vale la pena? Formalizarte tiene costos: el contador, los impuestos y algo de tiempo en trámites.',
  'Pero abre puertas. Una sola obra con una constructora, por ejemplo de veinte mil soles, puede pagar con creces esos costos de todo un año. Y sin comprobante, esa obra no existe para ti.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('¿Vale <span class="nar">la pena</span>?', top=100) + tarjetas([
  ('➖', 'Costos', 'Contador, impuestos,<br>trámites'), ('➕', 'Puertas que se abren', 'Obras grandes,<br>créditos, imagen')],
  lambda i: i, top=270, cols=2, alto=300, izq=420)))

E.append(dict(frases=[
  'Los cinco errores al formalizarte.',
  'Uno: elegir el régimen sin asesoría.',
  'Dos: quedarte en un régimen que no da factura, cuando tus clientes la piden.',
  'Tres: no guardar los comprobantes de compras.',
  'Cuatro: olvidar los seguros en la cotización.',
  'Y cinco: dejarlo para "más adelante".',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al formalizarte</span>', [
  ('Régimen sin asesoría', 'Pagas de más o no te sirve.'), ('Sin factura', 'Pierdes clientes grandes.'), ('Sin comprobantes de compras', 'Pierdes beneficios.'),
  ('Seguros fuera del precio', 'Pierdes margen.'), ('"Más adelante"', 'Las obras grandes no esperan.')])))

E.append(dict(frases=[
  'Tu reto: conversa con un contador sobre tu caso, y si aún no lo tienes, saca tu RUC con el régimen que te convenga.',
  'En la próxima clase: tu equipo de trabajo.',
], html=reto('🧾 Habla con un contador<br>y saca <b class="nar">tu RUC</b>', 'TU EQUIPO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: formalizarte es la puerta a las obras grandes.',
  '¡Nos vemos en la clase once!',
], html=final('Abre la puerta <span class="nar">a obras grandes</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'neg_c10')
