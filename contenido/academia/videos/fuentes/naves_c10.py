"""Naves Parabólicas · Clase 10: Naves de luces grandes (25 a 40 m)."""
from sold_comun import *
from comun import arco_reticulado

CURSO = 'NAVES PARABÓLICAS · CLASE 10'
ETAPAS_NAV_AV = ['Luces grandes', 'Luz y ventilación', 'Cerramientos', 'Mantenimiento']
E = []

def svg_arco(en, x, y, w, alto, peralte, mas=0, extra=''):
    return (f'<svg style="position:absolute;left:{x}px;top:{y}px" width="{w+40}" height="{alto+60}" viewBox="0 0 {w+40} {alto+60}">'
            + arco_reticulado(20, 20 + w, alto + 30, alto, peralte, en=en, mas=mas) + extra + '</svg>')

def cortes(en, x0, x1, base, alto, n, mas=0):
    """Marcas rojas donde se divide el arco en n tramos."""
    s = ''
    for k in range(1, n):
        t = k / n; xx = x0 + (x1 - x0) * t; yy = base - 4 * alto * t * (1 - t)
        s += f'<g class="pop" data-en="{en}" data-mas="{mas + 0.4*k:.1f}"><circle cx="{xx:.0f}" cy="{yy:.0f}" r="22" fill="none" stroke="#ff6b6b" stroke-width="7"/><line x1="{xx-30:.0f}" y1="{yy-30:.0f}" x2="{xx+30:.0f}" y2="{yy+30:.0f}" stroke="#ff6b6b" stroke-width="6"/></g>'
    return s

# 0. Gancho
E.append(dict(antes=0.5, frases=[
  'Un arco de treinta metros, ya soldado, mide más de treinta y un metros de largo...',
  '...y no entra en ningún camión. ¿Cómo se fabrica, se lleva y se monta una nave así?',
  'Hoy lo aprendes. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Un arco de 30 m', 'no entra en el camión', 10, 'LUCES GRANDES', soldando=False,
              extra_html=svg_arco(0, 980, 330, 820, 230, 60))))

# 1. Mapa del módulo avanzado
E.append(escena_obra(0, [
  'Terminaste el módulo principal con la nave de quince por treinta. Ahora empieza el módulo avanzado: lo que piden los clientes cuando la obra crece.',
  'Hoy: naves de luces grandes, de veinticinco a cuarenta metros.',
], 'Hoy: <span class="nar">naves de luces grandes</span>', ETAPAS_NAV_AV, 'Módulo avanzado', cab=''))

# 2. Qué cambia
E.append(dict(frases=[
  'Cuando la luz crece, cambian cuatro cosas.',
  'Uno: la flecha. Con la regla de cero catorce por la luz, en treinta metros ya son cuatro metros veinte.',
  'Dos: el empuje del arco sobre las columnas. Con la flecha óptima, si duplicas la luz, duplicas el empuje. Y el arco pesa mucho más.',
  'Tres: el arco ya no entra entero en un camión. Hay que dividirlo en tramos y unirlo en obra.',
  'Y cuatro: las reglas rápidas ya no alcanzan. Desde unos veinticinco metros, los tubos, el peralte y los empalmes los define el ingeniero con su memoria de cálculo.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55), (4, 1.0, 50, 50)], html=titulo('Qué cambia <span class="nar">al crecer la luz</span>', top=100) + tarjetas([
  ('📐', 'Más flecha', '0.14 × L<br>30 m → 4.20 m'), ('↔️', 'Más empuje', 'Doble luz,<br>doble empuje'),
  ('🚛', 'No entra entero', 'Se divide en tramos'), ('🧮', 'Cálculo', 'Tubos, peralte y empalmes<br>los define el ingeniero')],
  lambda i: i + 1, top=250, cols=4, alto=330, izq=120)))

# 3. Tabla de flechas y largos
E.append(dict(frases=[
  'Con lo que ya sabes del módulo principal, armemos la tabla de las luces grandes.',
  'La flecha óptima es cero catorce por la luz: tres metros cincuenta para veinticinco, cuatro veinte para treinta, cuatro noventa para treinta y cinco, y cinco sesenta para cuarenta.',
  'Y el largo del arco es unos cinco por ciento más que la luz. En treinta metros: treinta y uno y medio.',
  'Ese largo es el que manda para el transporte, no la luz.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Flecha y largo <span class="nar">del arco</span>', top=100) + tabla(
  ['Luz', 'Flecha óptima (0.14 L)', 'Largo del arco (≈ 1.05 L)'],
  [['25 m', '3.50 m', '≈ 26.3 m'], ['30 m', '4.20 m', '≈ 31.5 m'], ['35 m', '4.90 m', '≈ 36.8 m'], ['40 m', '5.60 m', '≈ 42.0 m']],
  lambda i: (1, 0.4 * i), top=250, izq=300, der=300, tam=34, nota='Largo medido sobre la curva del arco, con flecha óptima.')))

# 4. Transporte en tramos
base, alto, x0, x1 = 560, 300, 260, 1660
E.append(dict(frases=[
  'Ahora, el camión. Una plataforma normal lleva piezas de hasta unos doce metros de largo, y de no más de dos metros sesenta de ancho.',
  'Si partes el arco de treinta metros en dos mitades, cada una mide quince metros y medio. No entra.',
  'En tres tramos, cada uno mide unos diez metros y medio, y su curvatura es de solo cuarenta y cinco centímetros. Echado sobre la plataforma, con el peralte, cabe sin problema.',
  'Por eso, antes de fabricar, consulta con el transportista. El largo de los tramos se decide en el taller, no en la carretera.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50), (3, 1.0, 50, 50)], html=titulo('Llévalo <span class="nar">en tramos</span>', top=100) +
 f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">{arco_reticulado(x0, x1, base, alto, 70, en=0)}'
 f'<g class="ap" data-en="1"><line x1="960" y1="{base-alto-40}" x2="960" y2="{base+20}" stroke="#ff6b6b" stroke-width="6" stroke-dasharray="14 10"/><text x="960" y="{base+70}" fill="#ff6b6b" font-size="34" font-weight="900" text-anchor="middle">2 mitades de 15.6 m ✕</text></g>'
 f'{cortes(2, x0, x1, base, alto, 3)}</svg>'
 + badge('3 TRAMOS DE ≈ 10.7 m ✓', 2, 760, 640, '#3f9e5a', '✓', 1.5)
 + badge('CONSULTA AL TRANSPORTISTA', 3, 730, 740, '#f97316', '🚛')))

# 5. Empalmes de campo
E.append(dict(frases=[
  'Cada corte se vuelve un empalme de campo: una unión empernada que se arma en la obra.',
  'La regla: el empalme va siempre en un nudo, nunca a media pieza, y en el lugar que indica el ingeniero.',
  'En cada cordón se suelda en el taller una plancha de unión, o brida, a cada lado del corte. En obra, solo se ponen los pernos.',
  'Las planchas, los pernos y su calidad los define el cálculo. Tú cuidas que encajen perfecto.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 50)], html=titulo('El <span class="nar">empalme de campo</span>', top=100) + '''
<svg style="position:absolute;left:360px;top:250px" width="1200" height="440" viewBox="0 0 1200 440">
 <g class="ap" data-en="0">
  <line x1="40" y1="90" x2="560" y2="90" stroke="#9aa6b0" stroke-width="22"/><line x1="40" y1="330" x2="560" y2="330" stroke="#9aa6b0" stroke-width="22"/>
  <line x1="640" y1="90" x2="1160" y2="90" stroke="#9aa6b0" stroke-width="22"/><line x1="640" y1="330" x2="1160" y2="330" stroke="#9aa6b0" stroke-width="22"/>
  <line x1="420" y1="90" x2="560" y2="330" stroke="#9aa6b0" stroke-width="10"/><line x1="640" y1="330" x2="780" y2="90" stroke="#9aa6b0" stroke-width="10"/>
  <line x1="560" y1="90" x2="560" y2="330" stroke="#9aa6b0" stroke-width="10"/><line x1="640" y1="90" x2="640" y2="330" stroke="#9aa6b0" stroke-width="10"/>
 </g>
 <g class="pop" data-en="2"><rect x="552" y="50" width="22" height="80" fill="#f97316"/><rect x="626" y="50" width="22" height="80" fill="#f97316"/>
  <rect x="552" y="290" width="22" height="80" fill="#f97316"/><rect x="626" y="290" width="22" height="80" fill="#f97316"/></g>
 <g class="pop" data-en="2" data-mas="1.2"><line x1="540" y1="70" x2="660" y2="70" stroke="#ffd166" stroke-width="8"/><line x1="540" y1="110" x2="660" y2="110" stroke="#ffd166" stroke-width="8"/>
  <line x1="540" y1="310" x2="660" y2="310" stroke="#ffd166" stroke-width="8"/><line x1="540" y1="350" x2="660" y2="350" stroke="#ffd166" stroke-width="8"/></g>
 <text class="ap" data-en="1" x="600" y="420" fill="#7ee08a" font-size="32" font-weight="900" text-anchor="middle">empalme en un nudo ✓</text>
 <text class="ap" data-en="2" x="600" y="30" fill="#ffd166" font-size="28" font-weight="900" text-anchor="middle">bridas + pernos</text>
</svg>'''))

# 6. Pre-armado en el taller
E.append(dict(frases=[
  'El secreto de las naves grandes: el pre-armado. Antes de enviar, arma el arco completo en el piso del taller, con sus tres tramos.',
  'Así presentas las bridas juntas, las taladras alineadas, y compruebas la luz y la flecha del arco entero.',
  'Luego marca cada empalme con letras: A con A, B con B, y el número del arco. En obra, nadie adivina.',
  'Y protege las caras de las bridas: sin pintura gruesa ni salpicaduras, para que asienten planas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('Pre-armado <span class="nar">en el taller</span>', top=100) + lista([
  ('🧩', 'Arma el arco completo en el piso, con sus tramos'), ('🔩', 'Taladra las bridas juntas y verifica <b class="nar">luz y flecha</b>'),
  ('🔤', 'Marca cada empalme: <b class="nar">A-A, B-B</b> y el número del arco'), ('🧼', 'Caras de las bridas limpias y planas')],
  lambda i: i, top=240, izq=330, der=330, tam=33)))

# 7. Montaje con torres
E.append(dict(frases=[
  'En obra, hay dos formas de montarlo. La primera: unir los tramos en el piso y levantar el arco completo, muchas veces con dos grúas.',
  'La segunda: montar tramo por tramo, apoyando cada empalme en una torre provisional, hasta cerrar el arco.',
  'Con torres, la torre no se retira hasta que el arco está completo, empernado y amarrado al anterior con correas y arriostres.',
  'El plan de izaje, con pesos y puntos de enganche, lo prepara el responsable del montaje. Los principios de seguridad son los mismos de la clase siete.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55), (3, 1.0, 50, 50)], html=titulo('Montaje <span class="nar">con torres</span>', top=100) +
 f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">{arco_reticulado(x0, x1, 700, 360, 70, en=0)}'
 + ''.join(f'<g class="pop" data-en="1" data-mas="{0.5*k}"><rect x="{x0 + (x1-x0)*t - 30:.0f}" y="{700 - 4*360*t*(1-t) + 20:.0f}" width="60" height="{4*360*t*(1-t) - 20:.0f}" fill="none" stroke="#ffd166" stroke-width="6"/>'
           f'<line x1="{x0 + (x1-x0)*t - 30:.0f}" y1="{700 - 4*360*t*(1-t) + 20:.0f}" x2="{x0 + (x1-x0)*t + 30:.0f}" y2="700" stroke="#ffd166" stroke-width="4"/></g>' for k, t in enumerate((1/3, 2/3)))
 + '<text class="ap" data-en="1" x="960" y="750" fill="#ffd166" font-size="32" font-weight="900" text-anchor="middle">torres provisionales bajo los empalmes</text></svg>'
 + badge('NO RETIRES LA TORRE ANTES DE TIEMPO', 2, 620, 225, '#c0392b', '!')))

# 8. En la obra: números
E.append(dict(frases=[
  'Hagamos los números de una nave de treinta por cuarenta, con arcos cada cinco metros.',
  'Cuarenta entre cinco son ocho paños: nueve arcos. Cada arco en tres tramos: veintisiete tramos para fabricar y transportar.',
  'Cada arco tiene dos empalmes, y en cada empalme se unen los dos cordones: cuatro uniones por arco. En la nave, treinta y seis uniones.',
  'Si el ingeniero pide dos bridas y cuatro pernos por unión: setenta y dos bridas y ciento cuarenta y cuatro pernos. Sin olvidar los de repuesto.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">nave de 30 × 40 m</span>', top=100) + tabla(
  ['Partida', 'Cálculo', 'Cantidad'],
  [['Arcos', '40 ÷ 5 = 8 paños → 8 + 1', '9'], ['Tramos', '9 × 3', '27'], ['Uniones empernadas', '9 arcos × 2 empalmes × 2 cordones', '36'],
   ['Bridas', '36 × 2', '72'], ['Pernos (4 por unión)', '36 × 4', '144 + repuesto']],
  lambda i: [1, 1, 2, 3, 3][i], top=230, izq=260, der=260, tam=31, nota='Ejemplo: el número de pernos y el tamaño de las bridas los define el cálculo.')))

# 9. Errores
E.append(dict(frases=[
  'Los cinco errores en naves de luces grandes.',
  'Uno: fabricar sin consultar el transporte.',
  'Dos: hacer el empalme a media pieza.',
  'Tres: no pre-armar en el taller, y descubrir en obra que las bridas no calzan.',
  'Cuatro: retirar las torres antes de que el arco esté completo y amarrado.',
  'Y cinco: usar las reglas de una nave chica sin el cálculo del ingeniero.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">en luces grandes</span>', [
  ('Sin consultar el transporte', 'Tramos que no entran al camión.'), ('Empalme a media pieza', 'Siempre en un nudo.'),
  ('Sin pre-armado', 'Bridas que no calzan en obra.'), ('Torres retiradas antes', 'Arco suelto, peligro.'), ('Reglas de nave chica', 'Desde 25 m, cálculo del ingeniero.')])))

# 10. Reto
E.append(dict(frases=[
  'Tu reto: una nave de veinticinco metros de luz. Calcula la flecha óptima, el largo del arco, y en cuántos tramos lo llevas en una plataforma de doce metros.',
  'En la próxima clase: luz y ventilación. Cómo hacer que la nave no sea oscura ni un horno.',
], html=reto('🧮 Nave de 25 m de luz:<br><b class="nar">flecha óptima, largo del arco y n.º de tramos</b><br>para una plataforma de 12 m', 'LUZ Y VENTILACIÓN')))

# 11. Final
E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: tramos que entren al camión, empalmes en los nudos, y todo pre-armado en el taller.',
  '¡Nos vemos en la clase once!',
], html=final('Grandes luces, <span class="nar">bien planeadas</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'naves_c10')
