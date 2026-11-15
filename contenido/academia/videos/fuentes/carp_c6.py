"""Carpintería Metálica · Clase 6: La escalera metálica — contrapaso, paso y la regla de oro."""
from sold_comun import *
from carp_c1 import ETAPAS_CARP, OBRA

CURSO = 'CARPINTERÍA METÁLICA · CLASE 6'
E = []

def escalera_svg(en, x, y, n=8, cp=40, p=56, mal=False, mas=0):
    pts = ''
    xx, yy = 20, 20 + n * cp
    for i in range(n):
        pts += f'<rect x="{xx}" y="{yy-cp}" width="{p}" height="8" fill="{"#ff6b6b" if mal and i == n // 2 else "#f97316"}"/>'
        xx += p; yy -= (cp + (14 if mal and i == n // 2 - 1 else 0))
    return (f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{n*p+80}" height="{n*cp+80}" viewBox="0 0 {n*p+80} {n*cp+80}">'
            f'<line x1="20" y1="{20+n*cp}" x2="{20+n*p}" y2="20" stroke="#9aa6b0" stroke-width="14"/>{pts}</svg>')

E.append(dict(antes=0.5, frases=[
  'Todos tropiezan en el mismo peldaño de la escalera...',
  '...porque ese peldaño es dos centímetros más alto que los demás. El cuerpo se acostumbra a una altura, y un cambio, aunque sea chico, te hace tropezar.',
  'Hoy aprendes a calcular una escalera cómoda y segura. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('El peldaño', 'traicionero', 6, 'LA ESCALERA', soldando=False) + escalera_svg(0, 1100, 260, mal=True)))

E.append(escena_obra(5, [
  'Nuestra casa necesita una escalera metálica para subir al segundo piso. Del piso terminado de abajo al de arriba hay dos metros sesenta.',
  'Hoy calculamos los peldaños, y vemos cómo se fabrica.',
], 'Hoy: <span class="nar">la escalera al segundo piso</span>', ETAPAS_CARP, OBRA))

E.append(dict(frases=[
  'Dos medidas mandan en una escalera. El contrapaso: la altura de cada escalón. Lo cómodo es entre diecisiete y dieciocho centímetros.',
  'Y el paso, o huella: la parte donde pisas. Entre veinticinco y treinta centímetros.',
  'Y la regla de oro, que se usa hace siglos: dos contrapasos más un paso, entre sesenta y sesenta y cuatro centímetros. Es el largo de un paso normal de una persona.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('Contrapaso, paso <span class="nar">y la regla de oro</span>', top=110) + '''
<svg style="position:absolute;left:260px;top:260px" width="700" height="480" viewBox="0 0 700 480">
 <path d="M40 440 H200 V300 H400 V160 H600" fill="none" stroke="#f97316" stroke-width="14"/>
 <g class="ap" data-en="0"><line x1="230" y1="300" x2="230" y2="440" stroke="#5cc8ff" stroke-width="5"/><text x="245" y="380" fill="#5cc8ff" font-size="28" font-weight="900">contrapaso</text></g>
 <g class="ap" data-en="1"><line x1="200" y1="270" x2="400" y2="270" stroke="#ffd166" stroke-width="5"/><text x="300" y="255" fill="#ffd166" font-size="28" font-weight="900" text-anchor="middle">paso</text></g>
</svg>''' + lista([('↕️', 'Contrapaso: <b>17 a 18 cm</b>'), ('↔️', 'Paso: <b>25 a 30 cm</b>'), ('⭐', '<b class="nar">2 × contrapaso + paso = 60 a 64 cm</b>')],
  lambda i: i, top=300, izq=1000, der=120, tam=31)))

E.append(dict(frases=[
  'Calculemos nuestra escalera. Altura total: doscientos sesenta centímetros. Probamos con contrapasos de unos diecisiete y medio: doscientos sesenta entre diecisiete y medio, catorce punto ocho. Redondeamos a quince contrapasos.',
  'Contrapaso real: doscientos sesenta entre quince, diecisiete punto tres centímetros. Todos iguales.',
  'Paso de veintiocho centímetros. Comprobamos la regla: dos por diecisiete punto tres, más veintiocho, sesenta y dos punto seis. Dentro del rango.',
  'Y el largo en planta: con quince contrapasos hay catorce pasos, porque el último escalón es el piso de arriba. Catorce por veintiocho: tres metros noventa y dos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">2.60 m de altura</span>', top=110) + tabla(
  ['Paso del cálculo', 'Resultado'], [['260 ÷ 17.5', '14.8 → <b>15 contrapasos</b>'], ['260 ÷ 15', '<b class="nar">17.3 cm</b> cada uno'], ['2 × 17.3 + 28', '<b style="color:#7ee08a">62.6 cm ✓</b>'], ['14 pasos × 28 cm', '<b class="nar">3.92 m</b> de largo']],
  lambda i: i, top=270, izq=360, der=360, tam=34)))

E.append(dict(frases=[
  'Ojo con el primer y el último escalón: ahí es donde más se equivocan.',
  'Las alturas se miden de piso terminado a piso terminado. Si abajo todavía falta poner el porcelanato, y arriba también, considera esos espesores. Si no, el primer o el último escalón queda distinto a los demás.',
  'Y el ancho: para una vivienda, lo usual es por lo menos noventa centímetros. Revisa el reglamento para tu caso.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El primero <span class="nar">y el último</span>', top=110) + lista([
  ('⚠️', 'Ahí se equivocan casi todos'), ('🧱', 'Mide de <b>piso terminado a piso terminado</b>: suma el porcelanato'), ('↔️', 'Ancho usual en vivienda: <b>≥ 0.90 m</b> (revisa el reglamento)')],
  lambda i: i, top=290, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Cómo se fabrica. Dos zancas, las vigas laterales: tubo rectangular, o canal C, según el largo y la carga.',
  'Los peldaños: plancha estriada doblada en forma de L, o una bandeja de ángulo con madera o porcelanato encima.',
  'Los peldaños se sueldan entre las zancas sobre unos soportes de ángulo, todos trazados con una plantilla, para que queden exactamente iguales.',
  'Y la escalera se fija abajo con placa y pernos, y arriba a la viga o losa, con una placa de apoyo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cómo se <span class="nar">fabrica</span>', top=110) + escalera_svg(0, 200, 250, n=8) + lista([
  ('📐', '<b>Zancas</b>: tubo rectangular o canal C'), ('🔳', '<b>Peldaños</b>: plancha estriada en L, o bandeja con madera'), ('📏', 'Soportes trazados con <b>plantilla</b>: todos iguales'), ('🔩', 'Fijada <b>abajo y arriba</b> con placas y pernos')],
  lambda i: i, top=270, izq=900, der=100, tam=29)))

E.append(dict(frases=[
  'Los cinco errores de la escalera.',
  'Uno: contrapasos distintos. Basta uno diferente para que todos tropiecen.',
  'Dos: no considerar el piso terminado arriba y abajo.',
  'Tres: no comprobar la regla de oro.',
  'Cuatro: trazar los soportes uno por uno, sin plantilla.',
  'Y cinco: entregarla sin baranda, como vimos en la clase anterior.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">de la escalera</span>', [
  ('Contrapasos distintos', 'Todos tropiezan.'), ('Sin piso terminado', 'Primer o último escalón distinto.'), ('Sin regla de oro', 'Incómoda y cansa.'),
  ('Sin plantilla', 'Peldaños desiguales.'), ('Sin baranda', 'Riesgo de caída.')])))

E.append(dict(frases=[
  'Tu reto: calcula una escalera para una altura de dos metros ochenta. Número de contrapasos, contrapaso real, paso, comprobación de la regla de oro, y largo en planta.',
  'En la última clase: acabado, instalación, y cómo cotizar todo el trabajo de la casa.',
], html=reto('🧮 Escalera para 2.80 m de altura:<br><b class="nar">contrapasos · paso · regla de oro · largo</b>', 'INSTALAR Y COTIZAR')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: en una escalera, todos los escalones iguales. Así nadie tropieza.',
  '¡Nos vemos en la clase siete!',
], html=final('Todos iguales, <span class="nar">nadie tropieza</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c6')
