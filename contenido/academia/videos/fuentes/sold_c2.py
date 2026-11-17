"""Soldadura Estructural · Clase 2: ¿6011, 6013 o 7018? Elige bien y ahorra."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 2'
E = []

E.append(dict(antes=0.5, frases=[
  'Soldaste el arco de la nave con el electrodo de siempre...',
  '...y el inspector lo rechazó. Hay que picar y volver a soldar. ¿Por qué? Por elegir mal el electrodo.',
  'Hoy aprendes a elegir entre seis cero once, seis cero trece y siete cero dieciocho. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)],
  html=gancho('El inspector', 'lo rechazó…', 2, 'ELIGE EL ELECTRODO') + badge('RECHAZADO', 1, 110, 660, '#ff6b6b', '✕', mas=1.5)))

E.append(escena_obra(1, [
  'Seguimos con nuestra obra: el almacén de quince por treinta. Ya tenemos al equipo protegido.',
  'Ahora toca comprar los electrodos. Y aquí se gana o se pierde plata, y se gana o se pierde calidad.',
], 'Hoy: <span class="nar">qué electrodo y cuánto comprar</span>'))

# Cómo leer el código
dig = [('E', 'Electrodo', '#5cc8ff'), ('70', 'Resistencia: 70 mil psi', '#f97316'), ('1', 'Posición: 1 = todas', '#7ee08a'), ('8', 'Revestimiento y corriente', '#ffd166')]
E.append(dict(frases=[
  'Primero, aprende a leer el código. Está impreso en cada varilla.',
  'La E dice que es un electrodo.',
  'Los dos primeros números son la resistencia: sesenta o setenta mil libras por pulgada cuadrada. Setenta resiste más que sesenta.',
  'El tercero es la posición: el uno significa que sirve en todas las posiciones: plana, vertical, horizontal y sobre cabeza.',
  'Y el último dice el tipo de revestimiento y con qué corriente trabaja. Ahí está la gran diferencia entre los tres.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 45)], html=titulo('Lee el <span class="nar">código</span>', top=110) +
 '<div style="position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center;gap:26px">' + ''.join(
  f'<div class="pop" data-en="{i+1}" style="text-align:center;width:300px"><div style="font-size:150px;font-weight:900;color:{c};line-height:1">{d}</div><div style="font-size:28px;font-weight:800;margin-top:16px">{t}</div></div>'
  for i, (d, t, c) in enumerate(dig)) + '</div>' +
 '<div class="ap" data-en="2" data-mas="3" style="position:absolute;left:0;right:0;top:660px;text-align:center;font-size:26px;color:#c9d6e3">60 mil psi ≈ 420 MPa · 70 mil psi ≈ 490 MPa</div>'))

def ficha(codigo, color, nombre, filas, uso, no, en_codigo=0):
    return (electrodo(150, 300, 520, color, codigo, 0) +
            f'<div style="position:absolute;left:150px;top:170px"><h2 class="t ap" data-en="0">{codigo}: <span class="nar">{nombre}</span></h2></div>' +
            '<div style="position:absolute;left:880px;right:120px;top:290px">' + ''.join(
              f'<div class="tarjeta ap" data-en="{e}" style="font-size:29px;margin:12px 0;padding:16px 24px">{t}</div>' for e, t in filas) + '</div>' +
            f'<div class="tarjeta ap" data-en="{uso[0]}" style="position:absolute;left:150px;top:470px;width:640px;font-size:28px;border-color:#7ee08a">✅ {uso[1]}</div>' +
            f'<div class="tarjeta ap" data-en="{no[0]}" style="position:absolute;left:150px;top:640px;width:640px;font-size:28px;border-color:#ff6b6b">⛔ {no[1]}</div>')

E.append(dict(frases=[
  'El seis cero once es el "rompe todo". Su revestimiento es celulósico.',
  'Penetra profundo, tiene un arco fuerte y trabaja aunque el metal tenga algo de óxido o pintura.',
  'Funciona con corriente alterna o continua, y salpica bastante. La escoria es delgada.',
  'Úsalo para la pasada de raíz, en obra, y en piezas que no puedes limpiar a la perfección.',
  'No es el mejor para el acabado: el cordón queda rústico.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 30, 55)], html=ficha('E6011', '#d9d2c5', 'el que penetra',
  [(1, '🔥 Penetración <b>profunda</b>, arco fuerte'), (1, '🧽 Aguanta algo de óxido o pintura'), (2, '⚡ Corriente alterna o continua'), (2, '💥 Salpica más; escoria delgada')],
  (3, 'Raíz, obra, piezas no muy limpias'), (4, 'Acabado bonito o chapa delgada'))))

E.append(dict(frases=[
  'El seis cero trece es el "fácil". Su revestimiento es rutílico.',
  'Prende fácil, el arco es suave, salpica poco, y el cordón queda bonito. La escoria se suelta sola.',
  'Pero penetra poco. Por eso es ideal para chapas delgadas, rejas, puertas y trabajos livianos.',
  'Y aquí está el error del inspector: el seis cero trece no es para las uniones que cargan la nave.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 30, 70)], html=ficha('E6013', '#e9e2a8', 'el fácil',
  [(1, '🙂 Arco <b>suave</b>, prende fácil'), (1, '✨ Cordón bonito, poca salpicadura'), (1, '🧹 La escoria sale sola'), (2, '📉 Penetración <b>baja</b>')],
  (2, 'Chapa delgada, rejas, puertas, muebles'), (3, 'Uniones estructurales que cargan'))))

E.append(dict(frases=[
  'Y el siete cero dieciocho es el estructural. Es de bajo hidrógeno.',
  'Da un cordón más resistente, setenta mil, y más tenaz: no se raja fácil. Es el que piden los planos de estructuras.',
  'Trabaja con arco corto, normalmente en corriente continua, con el electrodo al positivo.',
  'Su punto débil: la humedad. El revestimiento absorbe agua del aire, y esa agua mete hidrógeno en la soldadura, que puede causar fisuras.',
  'Por eso se guarda en horno, a ciento veinte grados o más. Y la norma de estructuras soldadas, la AWS D uno punto uno, permite tenerlo fuera del horno como máximo cuatro horas.',
], zoom=[(0, 1.0, 50, 50), (4, 1.05, 35, 60)], html=ficha('E7018', '#b9c3cc', 'el estructural',
  [(1, '💪 70 mil psi, cordón <b>tenaz</b>'), (2, '📏 Arco corto, CC electrodo +'), (3, '💧 Le hace daño la <b>humedad</b>'), (4, '🔥 Horno ≥ 120 °C · máx. 4 h afuera')],
  (1, 'Arcos, columnas, placas: todo lo que carga'), (3, 'Electrodo húmedo: no va en estructura'))))

E.append(dict(frases=[
  'Resumen en una sola tabla. Mírala bien y tómale captura.',
  'Penetración: alta en el seis cero once, baja en el seis cero trece, media a buena en el siete cero dieciocho.',
  'Facilidad: el seis cero trece es el más fácil. El siete cero dieciocho pide más mano.',
  'Y para estructura: el siete cero dieciocho. El seis cero once como raíz cuando la junta lo pide.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La tabla <span class="nar">para decidir</span>', top=110) + tabla(
  ['', 'E6011', 'E6013', 'E7018'],
  [['Penetración', 'Alta', 'Baja', 'Media-buena'], ['Facilidad', 'Media', '<b style="color:#7ee08a">Fácil</b>', 'Pide mano'], ['Acabado', 'Rústico', 'Bonito', 'Bueno'],
   ['Humedad', 'Tolera', 'Tolera', '<b style="color:#ff6b6b">Horno</b>'], ['¿Estructura?', 'Raíz', '<b style="color:#ff6b6b">No</b>', '<b style="color:#7ee08a">Sí</b>']],
  lambda i: [1, 2, 2, 3, 3][i], top=250, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Ahora, el amperaje. Depende del diámetro de la varilla. Esta es una tabla de referencia.',
  'Con dos y medio milímetros, más o menos entre cincuenta y cien amperios.',
  'Con tres punto dos milímetros, el más usado en estructura, entre ochenta y ciento cuarenta.',
  'Y con cuatro milímetros, entre ciento diez y ciento noventa.',
  'Pero ojo: manda la caja del fabricante. Cada marca trae su rango impreso. Empieza al medio y ajusta.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 50)], html=titulo('Amperaje <span class="nar">por diámetro</span>', top=110) + tabla(
  ['Diámetro', 'E6011', 'E6013', 'E7018'],
  [['2.5 mm (3/32")', '50 – 85 A', '60 – 90 A', '70 – 100 A'], ['3.2 mm (1/8")', '80 – 120 A', '90 – 130 A', '100 – 140 A'], ['4.0 mm (5/32")', '110 – 160 A', '120 – 170 A', '140 – 190 A']],
  lambda i: i + 1, top=270, izq=240, der=240, tam=34, nota='Valores de referencia. Usa siempre el rango impreso en la caja del fabricante.') +
 badge('MANDA LA CAJA', 4, 760, 700, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Volvamos a la obra. ¿Qué compramos para el almacén?',
  'Arcos, columnas y placas base: todo lo que carga. Siete cero dieciocho de tres punto dos.',
  'Si la junta va abierta, con bisel, la primera pasada, la raíz, con seis cero once. Y el relleno y el acabado, con siete cero dieciocho.',
  'Y la puerta de rejas del almacén, que no carga la estructura: ahí sí, seis cero trece.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En nuestra obra: <span class="nar">¿qué compramos?</span>', top=110) + tarjetas([
  ('🏗️', 'Arcos y columnas', 'E7018 de 3.2 mm'), ('📐', 'Junta abierta con bisel', 'Raíz E6011 · relleno y acabado E7018'), ('🚪', 'Puerta de rejas', 'E6013')], lambda i: i + 1, top=290, cols=3, alto=330, izq=200)))

E.append(dict(frases=[
  'Y ahora, cómo ahorrar. Ejemplo con números.',
  'Supongamos que la nave lleva ciento cincuenta metros de cordón. A cero punto veintiocho kilos por metro, son unos cuarenta y dos kilos de electrodo que se funden.',
  'Pero no todo el electrodo se deposita: la colilla se bota. Si botas colillas de diez centímetros, desperdicias casi tres de cada diez partes, y tienes que comprar unos cincuenta y nueve kilos.',
  'Si quemas hasta dejar unos cinco centímetros, compras unos cuarenta y nueve. Son diez kilos menos.',
  'A diecinueve soles el kilo, que es el precio de referencia de la app, te ahorras casi ciento noventa soles. Solo con la colilla.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55), (4, 1.0, 50, 50)], html=titulo('Ahorra: <span class="nar">la colilla</span>', top=110) + f'''
<div class="tarjeta ap" data-en="1" style="position:absolute;left:200px;right:200px;top:250px;font-size:32px;text-align:center">150 m de cordón × 0.28 kg/m = <b class="nar">42 kg</b> de electrodo que se funde</div>
<div style="position:absolute;left:200px;right:200px;top:400px;display:grid;grid-template-columns:1fr 1fr;gap:30px">
 <div class="tarjeta ap" data-en="2" style="text-align:center;border-color:#ff6b6b"><div style="font-size:28px">Colilla de <b>10 cm</b></div><div style="font-size:70px;font-weight:900;color:#ff6b6b">≈ 59 kg</div><div style="font-size:24px;color:#c9d6e3">que comprar</div></div>
 <div class="tarjeta ap" data-en="3" style="text-align:center;border-color:#7ee08a"><div style="font-size:28px">Colilla de <b>5 cm</b></div><div style="font-size:70px;font-weight:900;color:#7ee08a">≈ 49 kg</div><div style="font-size:24px;color:#c9d6e3">que comprar</div></div>
</div>
<div class="paso pop" data-en="4" style="position:absolute;left:50%;transform:translateX(-50%);top:740px;font-size:34px;background:#3f9e5a"><b style="color:#3f9e5a">S/</b>AHORRAS ≈ S/ 186</div>'''))

E.append(dict(frases=[
  'Otro ahorro: no botes electrodos por humedad.',
  'Si dejas dos cajas de cinco kilos de siete cero dieciocho abiertas toda la noche, al sereno, ya no van para la estructura. Son diez kilos, ciento noventa soles.',
  'La solución: saca del horno solo lo que vas a usar en las próximas cuatro horas. Cierra las cajas. Y nunca las dejes en el piso.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 60)], html=titulo('Ahorra: <span class="nar">cuida el 7018</span>', top=110) + lista([
  ('🌙', '2 cajas abiertas al sereno = <b class="nar">10 kg perdidos ≈ S/ 190</b>'), ('🔥', 'Saca del horno solo lo de <b>4 horas</b>'), ('📦', 'Cajas cerradas y <b>nunca en el piso</b>')], lambda i: [1, 2, 2][i] if i else 1, top=270, izq=300, der=300, tam=34)))

E.append(dict(frases=[
  'Los cinco errores con los electrodos.',
  'Uno: usar seis cero trece en uniones que cargan.',
  'Dos: usar siete cero dieciocho húmedo.',
  'Tres: usar el amperaje de otro diámetro, o de otra marca, sin mirar la caja.',
  'Cuatro: botar colillas largas.',
  'Y cinco: mezclar electrodos sin rotular, y terminar soldando la estructura con el que no era.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con electrodos</span>', [
  ('6013 en uniones que cargan', 'Penetra poco: el inspector lo rechaza.'), ('7018 húmedo', 'Hidrógeno en la soldadura: riesgo de fisuras.'),
  ('Amperaje "a ojo"', 'Cada diámetro y cada marca tiene su rango.'), ('Colillas largas', 'Plata que va a la basura.'), ('Electrodos sin rotular', 'Terminas usando el que no era.')])))

E.append(dict(frases=[
  'Tu reto: toma una caja de electrodos de tu taller. Busca el código, el diámetro y el rango de amperaje.',
  'Mándanos la foto con tus respuestas. En la próxima clase: la máquina. Aprende a regularla para que el arco no se te pegue ni te perfore la plancha.',
], html=reto('📦 Toma una caja de electrodos y anota:<br><b class="nar">código · diámetro · rango de amperaje</b>', 'LA MÁQUINA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el electrodo correcto, bien guardado y bien quemado, es calidad y es plata en tu bolsillo.',
  '¡Nos vemos en la clase tres!',
], html=final('Elige bien, <span class="nar">ahorra</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c2')
