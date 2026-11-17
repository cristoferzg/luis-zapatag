"""Carpintería Metálica · Clase 2: Despiece y optimización de barras de 6 m."""
from sold_comun import *
from carp_c1 import ETAPAS_CARP, OBRA

CURSO = 'CARPINTERÍA METÁLICA · CLASE 2'
E = []

def barra(en, mas, segs, etiqueta, col='#7ee08a', y=0):
    return (f'<div class="ap" data-en="{en}" data-mas="{mas}" style="display:flex;align-items:center;gap:18px;margin:14px 0"><div style="width:120px;font-size:24px;font-weight:900">{etiqueta}</div>'
            '<div style="flex:1;display:flex;height:44px;border-radius:8px;overflow:hidden;border:3px solid #56687a;background:rgba(255,107,107,.25)">' +
            ''.join(f'<div style="flex:0 0 {w/6*100:.2f}%;background:{c};border-right:3px solid #0b2a45;display:grid;place-items:center;font-size:20px;font-weight:800">{l}</div>' for w, c, l in segs) +
            '</div></div>')

O = '#f97316'; A = '#5cc8ff'; V = '#ffd166'

E.append(dict(antes=0.5, frases=[
  'Compraste diez barras para unas ventanas...',
  '...y al final, en el piso del taller, quedaron siete pedazos de casi un metro que nadie va a usar. Eso es plata tirada.',
  'Hoy aprendes a hacer el despiece y a sacarle el máximo a cada barra de seis metros. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Plata', 'en el piso', 2, 'DESPIECE', soldando=False)))

E.append(escena_obra(1, [
  'Ya medimos los vanos de nuestra casa. Antes de comprar el material, hacemos el despiece: la lista exacta de cada pieza que hay que cortar.',
  'Y con esa lista, decidimos cómo cortar cada barra para que sobre lo menos posible.',
], 'Hoy: <span class="nar">despiece y barras de 6 m</span>', ETAPAS_CARP, OBRA))

E.append(dict(frases=[
  'El despiece es una tabla. Por cada pieza: el código, el perfil, la cantidad, el largo y el tipo de corte.',
  'El tipo de corte cambia el largo. A cuarenta y cinco grados, o inglete: la pieza mide lo mismo que el lado exterior del marco.',
  'A tope, a noventa grados: el travesaño que va entre dos parantes mide el ancho total, menos dos veces el ancho del perfil.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('El <span class="nar">despiece</span>', top=110) + tabla(
  ['Código', 'Perfil', 'Cant.', 'Largo', 'Corte'], [['P1', 'Rect. 3"×1½"', '2', '2095 mm', '45°'], ['P2', 'Rect. 3"×1½"', '1', '870 mm', '45°'], ['H1', 'Cuad. 1½"', '2', '2060 mm', '90°']],
  lambda i: i, top=250, izq=260, der=260, tam=32) + f'''
<div style="position:absolute;left:260px;right:260px;top:560px;display:grid;grid-template-columns:1fr 1fr;gap:30px">
 <div class="tarjeta ap" data-en="1" style="text-align:center;font-size:28px"><svg width="300" height="120" viewBox="0 0 300 120"><polygon points="20,20 280,20 240,60 60,60" fill="{O}"/><polygon points="20,20 60,60 60,110 20,110" fill="{A}"/></svg><br>Inglete 45°: largo = <b>lado exterior</b></div>
 <div class="tarjeta ap" data-en="2" style="text-align:center;font-size:28px"><svg width="300" height="120" viewBox="0 0 300 120"><rect x="20" y="20" width="40" height="90" fill="{A}"/><rect x="240" y="20" width="40" height="90" fill="{A}"/><rect x="60" y="20" width="180" height="40" fill="{O}"/></svg><br>A tope 90°: largo = <b>ancho − 2 × perfil</b></div>
</div>'''))

E.append(dict(frases=[
  'Ahora, las barras. Vienen de seis metros. Y cada corte se come el ancho del disco: unos tres milímetros.',
  'Por eso, tres piezas de dos metros exactos no salen de una barra: seis metros más dos cortes ya no alcanza. Siempre suma el disco.',
  'Y los sobrantes de más de cincuenta centímetros no se botan: se rotulan con su perfil y su largo, y se guardan para el próximo trabajo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La barra de <span class="nar">6 metros</span>', top=110) + '<div style="position:absolute;left:220px;right:220px;top:300px">' +
 barra(0, 0, [(6, '#9aa6b0', '6.00 m')], 'Barra') + barra(1, 0, [(2, O, '2.00'), (2, O, '2.00'), (1.994, '#ff6b6b', '1.994 ✕')], '3 × 2 m') + '</div>' +
 badge('CADA CORTE ≈ 3 mm DE DISCO', 1, 700, 560, '#ff6b6b', '!', mas=1) + badge('SOBRANTE > 50 cm: RÓTULALO Y GUÁRDALO', 2, 610, 660, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Mira este ejemplo. Dos ventanas con marco de dos cuarenta por uno veinte, y dos pasamanos de tres cincuenta. Todo en el mismo perfil.',
  'Si cortas en el orden en que fabricas, pieza por pieza, cada vez que no alcanza abres una barra nueva. Terminas usando seis barras.',
  'Ahora, el método del maestro: ordena las piezas de la más larga a la más corta, y llena cada barra con las que quepan.',
  'Tres cincuenta con dos cuarenta, en dos barras. Dos cuarenta con dos cuarenta en otra. Y los cuatro de uno veinte, juntos. Cuatro barras. Te ahorraste dos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.03, 50, 55)], html=titulo('Optimiza: <span class="nar">de 6 barras a 4</span>', top=100) +
 '<div style="position:absolute;left:120px;right:980px;top:230px"><div class="ap" data-en="1" style="font-size:30px;font-weight:900;color:#ff6b6b;margin-bottom:6px">En orden de fabricación: 6</div>' +
 ''.join(barra(1, 0.4 * k, s, f'B{k+1}') for k, s in enumerate([[(2.4, O, '2.40'), (1.2, A, '1.20')]] * 4 + [[(3.5, V, '3.50')]] * 2)) + '</div>' +
 '<div style="position:absolute;left:1000px;right:100px;top:230px"><div class="ap" data-en="2" style="font-size:30px;font-weight:900;color:#7ee08a;margin-bottom:6px">De mayor a menor: 4</div>' +
 ''.join(barra(3, 0.5 * k, s, f'B{k+1}') for k, s in enumerate([[(3.5, V, '3.50'), (2.4, O, '2.40')], [(3.5, V, '3.50'), (2.4, O, '2.40')], [(2.4, O, '2.40'), (2.4, O, '2.40')], [(1.2, A, '1.20')] * 4])) + '</div>'))

E.append(dict(frases=[
  '¿Y cuánto ahorras? Si ese perfil cuesta cuarenta soles la barra, dos barras son ochenta soles. En un solo trabajo.',
  'Haz eso en cada trabajo del mes, y es una buena parte de tu ganancia.',
  'Y no tienes que hacerlo a mano: el módulo de Carpintería Metálica de InnovApp optimiza los cortes de seis metros solo, en su despiece. Tú revisas y cortas.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Cuánto <span class="nar">ahorras</span>?', top=110) + f'''
<div class="tarjeta ap" data-en="0" style="position:absolute;left:420px;right:420px;top:280px;text-align:center"><div style="font-size:32px">2 barras × S/ 40 (ejemplo)</div><div style="font-size:90px;font-weight:900;color:#7ee08a">S/ 80</div><div style="font-size:26px;color:#c9d6e3">en un solo trabajo</div></div>''' +
 badge('INNOVAPP OPTIMIZA LOS CORTES DE 6 m POR TI', 2, 560, 640, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Los cinco errores del despiece.',
  'Uno: cortar sin lista, "sobre la marcha".',
  'Dos: olvidar el ancho del disco.',
  'Tres: confundir el largo a inglete con el largo a tope.',
  'Cuatro: cortar en el orden de fabricación, sin optimizar.',
  'Y cinco: botar sobrantes útiles en lugar de rotularlos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">del despiece</span>', [
  ('Cortar sin lista', 'Faltan o sobran piezas.'), ('Olvidar el disco', '3 mm por corte.'), ('Inglete vs tope', 'Piezas largas o cortas.'),
  ('Sin optimizar', 'Más barras de las necesarias.'), ('Botar sobrantes', 'Material que ya pagaste.')])))

E.append(dict(frases=[
  'Tu reto: tienes que cortar seis piezas de un metro ochenta y cuatro de un metro cuarenta, del mismo perfil. ¿Cuántas barras de seis metros necesitas como mínimo? Considera el disco.',
  'En la próxima clase: la puerta metálica. Marco, hoja, bisagras, chapa y refuerzos.',
], html=reto('🧮 6 piezas de 1.80 m + 4 de 1.40 m:<br><b class="nar">¿cuántas barras de 6 m como mínimo?</b>', 'LA PUERTA')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la ganancia también se corta con la sierra. Despieza, ordena y optimiza.',
  '¡Nos vemos en la clase tres!',
], html=final('Corta con lista, <span class="nar">ahorra en cada barra</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'carp_c2')
