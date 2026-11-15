"""Lectura de Planos Metálicos · Clase 5: Notas generales, abreviaturas y especificaciones."""
from sold_comun import *
from plan_c1 import ETAPAS_PLAN, OBRA

CURSO = 'LECTURA DE PLANOS · CLASE 5'
E = []

NOTAS = [
  ('1', 'ACERO: tubos ASTM A500 Gr. B · vigas ASTM A572 Gr. 50 · planchas ASTM A36.'),
  ('2', 'PERNOS: ASTM A325 Ø 5/8" salvo indicación.'),
  ('3', 'SOLDADURA: AWS D1.1, electrodos E70XX. Filetes no indicados: 5 mm.'),
  ('4', 'PINTURA: arenado SSPC-SP6 + base epóxica 2 × 75 µm + acabado poliuretano 50 µm.'),
  ('5', 'CARGA VIVA DE DISEÑO: 250 kg/m² (oficinas).'),
]

def bloque_notas(en_de, x=300, y=240, w=1320):
    return (f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;background:#f4f1e8;color:#2b3640;border-radius:12px;padding:26px 34px;font-family:monospace">'
            '<div style="font-size:30px;font-weight:900;margin-bottom:10px">NOTAS GENERALES</div>' + ''.join(
            f'<div class="ap" data-en="{en_de(i)}" style="font-size:26px;margin:10px 0;line-height:1.35"><b>{n}.</b> {t}</div>' for i, (n, t) in enumerate(NOTAS)) + '</div>')

E.append(dict(antes=0.5, frases=[
  'Pintaste toda la estructura con anticorrosivo y esmalte, como siempre...',
  '...y la supervisión la rechazó. La nota del plano pedía arenado y pintura epóxica. Hubo que lijar todo y volver a pintar, a tu costo.',
  'Hoy aprendes a leer lo que casi nadie lee: las notas generales. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Lo que nadie', 'lee', 5, 'NOTAS', soldando=False) + '<div class="pop" data-en="0" style="position:absolute;left:1250px;top:300px;font-size:260px">📝</div>'))

E.append(escena_obra(4, [
  'En los planos de nuestro mezanine, la lámina de notas generales tiene cinco puntos.',
  'Parecen letra chica. Pero cada uno cambia lo que compras, cómo fabricas, y cuánto cobras.',
], 'Hoy: <span class="nar">notas generales y abreviaturas</span>', ETAPAS_PLAN, OBRA))

E.append(dict(frases=[
  'Estas son las notas del mezanine. Léelas conmigo. Primero, el acero de cada tipo de perfil.',
  'Los pernos: A trescientos veinticinco de cinco octavos, "salvo indicación". O sea: siempre ese, a menos que un detalle diga otro.',
  'La soldadura: según la AWS D uno punto uno, con electrodos E setenta. Y los filetes que no tienen tamaño en el plano, de cinco milímetros.',
  'La pintura: arenado comercial, base epóxica en dos manos de setenta y cinco micras, y acabado poliuretano de cincuenta.',
  'Y la carga viva de diseño: doscientos cincuenta kilos por metro cuadrado. Uso de oficina.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 60)], html=bloque_notas(lambda i: i)))

E.append(dict(frases=[
  '¿Qué cambia cada nota en tu trabajo? El acero: tienes que comprar y pedir certificado de ese material, no "uno parecido".',
  'Los pernos: A trescientos veinticinco, con su marca en la cabeza. No de ferretería.',
  'La soldadura: electrodos E setenta, como el siete cero dieciocho, y ningún filete menor a cinco.',
  'La pintura: es la que más cambia el precio. Arenado y epóxica cuestan bastante más que el anticorrosivo común. Si no la leíste, perdiste plata en la cotización.',
  'Y la carga viva: si el cliente quiere usar el mezanine de almacén, ya no es el mismo diseño. Eso lo tiene que revisar el ingeniero.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Qué cambia <span class="nar">cada nota</span>?', top=100) + tabla(
  ['Nota', 'Qué cambia en tu trabajo'], [['Acero', 'Comprar ese material, con certificado'], ['Pernos', 'A325 marcados, no de ferretería'], ['Soldadura', 'E70XX · filetes mínimo 5 mm'], ['Pintura', '<b class="nar">Arenado + epóxica: cambia el precio</b>'], ['Carga viva', 'Otro uso = revisión del ingeniero']],
  lambda i: i, top=240, izq=260, der=260, tam=30)))

E.append(dict(frases=[
  'Ahora, las abreviaturas más comunes en los planos de acero. P L: plancha. L: ángulo. H S S: tubo estructural. W: viga de ala ancha.',
  'La arroba significa "cada": barrotes arroba diez, es "barrotes cada diez centímetros". Y c barra c: de centro a centro.',
  'La letra e con un igual es el espesor. El círculo con una raya, el diámetro. Y S barra E: sin escala.',
  'Y una palabra muy importante: TÍPICO. Si un detalle dice "típico", se aplica a todos los casos iguales, aunque no lo dibujen en cada uno.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 60)], html=titulo('Las <span class="nar">abreviaturas</span>', top=100) + tabla(
  ['Abreviatura', 'Significa', 'Abreviatura', 'Significa'], [['PL', 'Plancha', '@', 'Cada'], ['L', 'Ángulo', 'c/c', 'Centro a centro'], ['HSS', 'Tubo estructural', 'e =', 'Espesor'], ['W', 'Viga ala ancha', 'Ø', 'Diámetro'], ['S/E', 'Sin escala', '<b class="nar">TÍP.</b>', '<b class="nar">Típico: a todos los iguales</b>']],
  lambda i: [0, 1, 2, 2, 3][i], top=240, izq=220, der=220, tam=30)))

E.append(dict(frases=[
  'Y cuando quieras cambiar algo, por ejemplo usar otro perfil porque no hay stock, no lo cambies por tu cuenta.',
  'Pide la aprobación por escrito al proyectista. Un "equivalente" que nadie aprobó es tu responsabilidad si algo falla.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Un <span class="nar">"equivalente"</span>?', top=110) + f'''
<div class="tarjeta ap" data-en="0" style="position:absolute;left:380px;right:380px;top:300px;text-align:center"><div style="font-size:80px">🔄 ✍️</div><div style="font-size:34px;font-weight:900">Cualquier cambio: <span class="nar">aprobación por escrito</span></div><div style="font-size:27px;color:#c9d6e3;margin-top:8px">Si no está aprobado, la responsabilidad es tuya</div></div>'''))

E.append(dict(frases=[
  'Los cinco errores con las notas.',
  'Uno: no leer la lámina de notas generales.',
  'Dos: cotizar la pintura sin ver qué sistema pide.',
  'Tres: ignorar la palabra "típico".',
  'Cuatro: cambiar materiales por "equivalentes" sin aprobación.',
  'Y cinco: aceptar un cambio de uso sin avisar al ingeniero.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con las notas</span>', [
  ('No leer las notas', 'Se te pasan materiales y procesos.'), ('Pintura sin leer', 'Pierdes en la cotización.'), ('Ignorar "típico"', 'Faltan detalles en muchas partes.'),
  ('"Equivalentes" sin aprobar', 'La responsabilidad es tuya.'), ('Cambio de uso', 'Ya no es el mismo diseño.')])))

E.append(dict(frases=[
  'Tu reto: toma las notas generales de un plano tuyo y haz una lista: qué acero, qué pernos, qué soldadura y qué pintura piden. Y marca qué afecta tu precio.',
  'En la última clase: las marcas de piezas y el plano de montaje. Cómo saber qué pieza va en cada sitio.',
], html=reto('📝 De las notas de un plano tuyo, lista:<br><b class="nar">acero · pernos · soldadura · pintura · qué cambia tu precio</b>', 'MARCAS Y MONTAJE')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la letra chica del plano es la que más cuesta ignorar. Léela primero.',
  '¡Nos vemos en la clase seis!',
], html=final('Lee la letra chica, <span class="nar">cotiza bien</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c5')
