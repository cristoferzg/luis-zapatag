"""Estructuras Metálicas · Clase 4: El entrepiso — viguetas, piso y baranda del mezanine."""
from sold_comun import *
from est_c1 import ETAPAS_EST, OBRA

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 4'
E = []

def corte_piso(en, sep_px, etiqueta, x, y, color='#c48a3a', grosor=16, mas=0):
    n = int(600 / sep_px) + 1
    return (f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="680" height="200" viewBox="0 0 680 200">'
            f'<rect x="20" y="40" width="640" height="{grosor}" fill="{color}"/>' +
            ''.join(f'<path d="M{40+i*sep_px} {40+grosor} v60 h-18 m18 -60 h-18" stroke="#9aa6b0" stroke-width="7" fill="none"/>' for i in range(n) if 40 + i * sep_px < 660) +
            f'<text x="340" y="170" fill="#fff" font-size="28" font-weight="900" text-anchor="middle">{etiqueta}</text></svg>')

E.append(dict(antes=0.5, frases=[
  'Le pusieron un tablero delgado encima de las viguetas...',
  '...y al pisar, se hunde como colchón. El cliente camina con miedo. Y todo porque nadie pensó en el piso.',
  'Hoy armamos el entrepiso del mezanine: viguetas, piso y baranda. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Se hunde', 'al pisar', 4, 'EL ENTREPISO', soldando=False) +
 corte_piso(0, 200, 'Viguetas muy separadas', 1080, 360, grosor=10)))

E.append(escena_obra(3, [
  'Nuestro mezanine ya tiene columnas, vigas y pernos.',
  'Ahora, lo que el cliente pisa: el entrepiso. Y su seguridad: la baranda.',
], 'Hoy: <span class="nar">piso, viguetas y baranda</span>', ETAPAS_EST, OBRA))

E.append(dict(frases=[
  'Hay cuatro pisos típicos para un mezanine. Tablero, de OSB o fenólico: liviano, rápido y barato. Ideal para oficinas y depósitos livianos.',
  'Plancha estriada: de acero, antideslizante y muy resistente. Para talleres y zonas de trabajo.',
  'Placa colaborante con concreto: la más rígida, no vibra y resiste mejor el fuego. Pero pesa mucho más.',
  'Y la rejilla metálica, o grating: deja pasar luz y aire. Para plataformas industriales.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Qué <span class="nar">piso</span>?', top=110) + tarjetas([
  ('🟫', 'Tablero OSB / fenólico', 'Liviano y rápido · oficinas'), ('🔳', 'Plancha estriada', 'Antideslizante · talleres'), ('🧱', 'Placa colaborante', 'Rígida, no vibra · pesa más'), ('#️⃣', 'Rejilla (grating)', 'Luz y aire · industria')],
  lambda i: i)))

E.append(dict(frases=[
  'El piso decide cada cuánto van las viguetas. Con tablero de dieciocho milímetros, normalmente entre cuarenta y sesenta centímetros. Revisa lo que dice el fabricante del tablero.',
  'En nuestro mezanine, las viguetas van más o menos cada cincuenta y siete centímetros: ocho en cada paño de cuatro metros. Dentro del rango.',
  'Con placa colaborante, las viguetas pueden ir mucho más separadas, porque la placa con concreto trabaja como losa. La separación sale de la tabla del fabricante de la placa.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Cada cuánto <span class="nar">las viguetas</span>', top=110) +
 corte_piso(0, 110, 'Tablero 18 mm: cada 40 a 60 cm', 160, 300) + corte_piso(1, 95, 'Nuestro mezanine: ≈ 57 cm', 1080, 300, color='#f97316') +
 corte_piso(2, 300, 'Placa colaborante: según tabla del fabricante', 620, 580, color='#9aa6b0', grosor=34)))

E.append(dict(frases=[
  'El piso también pesa, y eso va a la carga muerta. Calculemos para los veinticuatro metros cuadrados del mezanine.',
  'Tablero OSB de dieciocho milímetros: unos doce kilos por metro cuadrado. En total, unos doscientos ochenta y ocho kilos.',
  'Plancha estriada de tres dieciseisavos, cuatro punto cinco milímetros: unos treinta y siete kilos por metro cuadrado, con las estrías. En total, unos ochocientos ochenta y ocho kilos.',
  'Más del triple. Si cambias el piso, cambia la carga muerta, y el ingeniero tiene que revisar vigas y columnas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El piso <span class="nar">también pesa</span>', top=110) + tabla(
  ['Piso', 'kg/m²', '× 24 m²'], [['Tablero OSB 18 mm', '≈ 12', '≈ 288 kg'], ['Plancha estriada 4.5 mm', '≈ 37', '≈ 888 kg']],
  lambda i: i + 1, top=280, izq=380, der=380, tam=35, nota='Plancha: 4.5 mm × 7.85 kg ≈ 35 kg/m², más las estrías.') +
 badge('CAMBIAS EL PISO = CAMBIA LA CARGA', 3, 600, 620, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Cómo fijar el piso. El tablero va atornillado a cada vigueta, con tornillos para metal, cada quince a veinte centímetros en los bordes.',
  'Cada junta entre tableros debe caer sobre una vigueta. Una junta "en el aire" se quiebra con el primer peso.',
  'Y la plancha estriada se suelda o se atornilla a las viguetas, con las estrías hacia arriba.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Fija <span class="nar">bien</span> el piso', top=110) + lista([
  ('🔩', 'Tablero atornillado a <b>cada vigueta</b> · bordes cada 15 a 20 cm'), ('📏', 'Cada <b>junta sobre una vigueta</b>, nunca en el aire'), ('🔳', 'Plancha estriada soldada o atornillada, <b>estrías arriba</b>')],
  lambda i: i, top=280, izq=300, der=300, tam=33)))

E.append(dict(frases=[
  'Y la baranda. En un mezanine no es adorno: es lo que evita que alguien se caiga. Va en todo el borde libre.',
  'Debe tener por lo menos un metro de alto, con un pasamanos firme arriba y una barra intermedia, o barrotes.',
  'Abajo, un rodapié, o zócalo, de unos diez centímetros, para que no se caigan herramientas o cajas sobre la gente de abajo.',
  'Y debe aguantar que alguien se apoye o empuje con fuerza. Revisa siempre lo que pide la norma para tu caso.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 65)], html=titulo('La <span class="nar">baranda</span>', top=110) + f'''
<svg style="position:absolute;left:520px;top:240px" width="880" height="560" viewBox="0 0 880 560">
 <rect x="40" y="470" width="800" height="24" fill="#c48a3a"/>
 <g class="ap" data-en="1">{"".join(f'<rect x="{60+i*190}" y="110" width="18" height="360" fill="#9aa6b0"/>' for i in range(5))}
  <rect x="50" y="100" width="790" height="22" rx="10" fill="#f97316"/><rect x="60" y="290" width="780" height="12" fill="#9aa6b0"/>
  <line x1="20" y1="110" x2="20" y2="470" stroke="#ffd166" stroke-width="4"/><text x="0" y="300" fill="#ffd166" font-size="30" font-weight="900" text-anchor="end">≥ 1.0 m</text></g>
 <g class="ap" data-en="2"><rect x="60" y="430" width="780" height="40" fill="#5cc8ff"/><text x="450" y="540" fill="#5cc8ff" font-size="28" font-weight="900" text-anchor="middle">rodapié ≈ 10 cm</text></g>
</svg>'''))

E.append(dict(frases=[
  'Los cinco errores del entrepiso.',
  'Uno: viguetas muy separadas para el piso que pusiste.',
  'Dos: juntas de tablero que no caen sobre una vigueta.',
  'Tres: cambiar a un piso más pesado sin avisar al ingeniero.',
  'Cuatro: baranda baja, débil, o sin rodapié.',
  'Y cinco: plancha lisa en una zona de trabajo. Con aceite o polvo, resbala.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">del entrepiso</span>', [
  ('Viguetas muy separadas', 'El piso se hunde y vibra.'), ('Juntas en el aire', 'El tablero se quiebra.'), ('Piso más pesado sin avisar', 'La estructura ya no es la calculada.'),
  ('Baranda baja o sin rodapié', 'Riesgo de caída de personas y objetos.'), ('Plancha lisa', 'Resbala con aceite o polvo.')])))

E.append(dict(frases=[
  'Tu reto: para un mezanine de tres por cinco metros, con tablero de dieciocho milímetros, calcula cuántas viguetas necesitas, y el peso del piso.',
  'En la próxima clase: corte, taladrado y tolerancias en el taller. Cuánto se puede equivocar una pieza, y cómo cortarla bien.',
], html=reto('🧮 Mezanine de 3 × 5 m con tablero 18 mm:<br><b class="nar">cuántas viguetas · peso del piso</b>', 'CORTE Y TOLERANCIAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el cliente no ve las vigas. Ve y siente el piso. Hazlo firme.',
  '¡Nos vemos en la clase cinco!',
], html=final('Piso firme, <span class="nar">cliente tranquilo</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c4')
