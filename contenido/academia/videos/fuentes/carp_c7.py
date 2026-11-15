"""Carpintería Metálica · Clase 7: Acabado, instalación y cotización."""
from sold_comun import *
from carp_c1 import ETAPAS_CARP, OBRA

CURSO = 'CARPINTERÍA METÁLICA · CLASE 7'
E = []

E.append(dict(antes=0.5, frases=[
  'Hiciste un trabajo impecable...',
  '...y cuando sacaste las cuentas, ganaste menos que tu ayudante. Cobraste "lo que cobran todos", sin calcular.',
  'En esta última clase: el acabado, la instalación, y cómo cotizar para ganar lo justo. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿Y tu', 'ganancia?', 7, 'INSTALAR Y COTIZAR', soldando=False) + '<div class="pop" data-en="0" style="position:absolute;left:1250px;top:300px;font-size:260px">🧾</div>'))

E.append(escena_obra(6, [
  'Ya fabricamos la puerta, el portón, las rejas, la baranda y la escalera de nuestra casa.',
  'Falta lo que el cliente más recuerda: que quede bien instalada, bien pintada, y un precio claro.',
], 'Hoy: <span class="nar">acabado, instalación y precio</span>', ETAPAS_CARP, OBRA))

E.append(dict(frases=[
  'El acabado empieza en el taller. Esmerila los cordones que se ven, sin comerte el cordón: solo lo que sobresale.',
  'Limpia la escoria, la salpicadura y la grasa. Y pinta en el taller: base anticorrosiva y acabado. El cálculo de galones lo vimos en el curso de Estructuras.',
  'Y protege lo pintado para el transporte: cartón o jebe en las esquinas, y amarres que no rayen.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">acabado</span>', top=110) + tarjetas([
  ('🪚', 'Esmerila lo que se ve', 'Solo lo que sobresale, sin comerte el cordón'), ('🎨', 'Pinta en el taller', 'Base + acabado, sobre metal limpio'), ('📦', 'Protege para el viaje', 'Cartón o jebe en esquinas')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'La instalación de un marco. Primero, presenta el marco en el vano y cálzalo con cuñas.',
  'Aploma los costados con el nivel, en las dos direcciones, y revisa las diagonales.',
  'Fija con anclajes al muro, o empotrando las uñas con mortero. No aprietes del todo hasta comprobar que la hoja abre y cierra bien.',
  'Al final, resana alrededor del marco, retoca la pintura donde se rayó, y lubrica bisagras, chapa y ruedas.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">instalación</span>', top=110) +
 '<div style="position:absolute;left:120px;right:120px;top:330px;display:flex;justify-content:space-between">' + ''.join(
  f'<div class="pop" data-en="{e}" style="text-align:center;width:300px"><div style="width:84px;height:84px;margin:0 auto;border-radius:50%;background:#f97316;display:grid;place-items:center;font-size:36px;font-weight:900">{i+1}</div><div style="font-size:28px;font-weight:900;margin-top:12px">{t}</div><div style="font-size:22px;color:#c9d6e3">{d}</div></div>'
  for i, (t, d, e) in enumerate([('Presenta y calza', 'Con cuñas', 0), ('Aploma', 'Nivel y diagonales', 1), ('Fija', 'Anclajes o uñas · prueba la hoja', 2), ('Resana y lubrica', 'Retoca la pintura', 3)])) + '</div>'))

E.append(dict(frases=[
  'Ahora, la cotización. Un precio justo tiene cinco partes. Uno: los materiales: barras, planchas, herrajes, pintura y consumibles, con un pequeño margen por desperdicio.',
  'Dos: la mano de obra del taller: cuántos días de maestro y de ayudante.',
  'Tres: la instalación y el transporte.',
  'Cuatro: los gastos del taller: luz, discos, alquiler, herramientas. Se suelen cargar como un porcentaje.',
  'Y cinco: tu utilidad. La ganancia no es lo que sobra: es una partida más, y se pone desde el principio.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las 5 partes <span class="nar">del precio</span>', top=110) + lista([
  ('🔩', '<b>Materiales</b> + margen por desperdicio'), ('👷', '<b>Mano de obra</b>: días de maestro y ayudante'), ('🚚', '<b>Instalación y transporte</b>'),
  ('💡', '<b>Gastos del taller</b>: luz, discos, alquiler'), ('💰', '<b>Tu utilidad</b>: se pone desde el principio')], lambda i: i, top=240, izq=330, der=330, tam=31)))

E.append(dict(frases=[
  'Ejemplo: la puerta de calle. Son precios de ejemplo; usa los de tu zona. Materiales: tubos, plancha, bisagras, chapa, pintura y consumibles: digamos cuatrocientos ochenta soles.',
  'Mano de obra: un día y medio de maestro a ciento veinte, y de ayudante a ochenta: trescientos soles.',
  'Instalación y transporte: ciento veinte. Gastos del taller, diez por ciento de lo anterior: noventa. Suma: novecientos noventa.',
  'Y tu utilidad, veinte por ciento: ciento noventa y ocho. Precio: mil ciento ochenta y ocho soles. Y si emites factura, súmale el IGV.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">la puerta de calle</span>', top=100) + tabla(
  ['Partida (precios de ejemplo)', 'Soles'], [['Materiales', '480'], ['Mano de obra (1.5 días × 120 + 1.5 × 80)', '300'], ['Instalación y transporte', '120'], ['Gastos del taller (10 %)', '90'], ['Utilidad (20 %)', '198'], ['<b class="nar">Precio</b>', '<b class="nar">1,188</b>']],
  lambda i: [0, 1, 2, 2, 3, 3][i], top=230, izq=330, der=330, tam=31, nota='Sin IGV. Si emites factura, súmale el IGV. Usa los precios de tu zona.')))

E.append(dict(frases=[
  'Presenta la cotización por escrito, con el detalle: medidas, perfiles, acabado, plazo, forma de pago y garantía.',
  'Pide un adelanto para comprar el material, normalmente la mitad. Y deja claro qué no incluye: por ejemplo, resanes de albañilería o pintura de paredes.',
  'Y el módulo de Carpintería Metálica de InnovApp te arma el despiece, los materiales y el presupuesto. Tú revisas los precios y tu utilidad.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Presenta <span class="nar">por escrito</span>', top=110) + lista([
  ('📝', 'Medidas, perfiles, acabado, <b>plazo</b>, pago y <b>garantía</b>'), ('💵', '<b>Adelanto</b> para el material (≈ 50 %)'), ('🚫', 'Deja claro <b>qué no incluye</b>'), ('📱', 'InnovApp arma despiece, materiales y presupuesto')],
  lambda i: [0, 1, 1, 2][i], top=270, izq=300, der=300, tam=31)))

E.append(dict(frases=[
  'Los cinco errores al cotizar e instalar.',
  'Uno: cobrar "lo que cobran todos", sin calcular.',
  'Dos: olvidar los gastos del taller y la instalación.',
  'Tres: dejar tu utilidad para "lo que sobre".',
  'Cuatro: empezar sin adelanto ni nada por escrito.',
  'Y cinco: instalar sin aplomar, y fijar del todo antes de probar la hoja.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al cotizar e instalar</span>', [
  ('"Lo que cobran todos"', 'Sin saber tu costo.'), ('Olvidar gastos e instalación', 'Pierdes sin darte cuenta.'), ('Utilidad "lo que sobre"', 'Casi nunca sobra.'),
  ('Sin adelanto ni papel', 'Riesgo de no cobrar.'), ('Instalar sin aplomar', 'La hoja se traba.')])))

E.append(dict(frases=[
  'Tu reto final: cotiza un trabajo real con las cinco partes: materiales, mano de obra, instalación, gastos del taller y tu utilidad.',
  'Mándanos tu cotización. Y en la próxima clase empieza el módulo avanzado: ventanas de fierro con vidrio.',
], html=reto('🧾 Cotiza un trabajo real con las 5 partes:<br><b class="nar">materiales · mano de obra · instalación · gastos · utilidad</b>', 'VENTANAS CON VIDRIO')))

E.append(dict(antes=0.3, despues=3.0, frases=[
  '¡Felicitaciones! Terminaste el módulo principal de Carpintería Metálica. Medir, despiezar, fabricar, instalar y cotizar: ya tienes el oficio completo.',
  'Ahora viene el módulo avanzado: ventanas con vidrio, toldos, estanterías y cercos. ¡Nos vemos en la clase ocho!',
], html=final('¡Módulo principal <span class="nar">completado</span>!')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c7')
