"""Estructuras Metálicas · Clase 10: Refuerzos y ampliaciones de estructuras existentes."""
from sold_comun import *
from est_c8 import ETAPAS_EST_AV

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 10'
E = []

def viga_ref(en, x, y, platinas=False, mas=0):
    s = f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="300" height="320" viewBox="0 0 300 320">'
    s += '<rect x="60" y="40" width="180" height="22" fill="#9aa6b0"/><rect x="141" y="62" width="18" height="196" fill="#9aa6b0"/><rect x="60" y="258" width="180" height="22" fill="#9aa6b0"/>'
    if platinas:
        s += '<rect x="75" y="18" width="150" height="22" fill="#f97316"/><rect x="75" y="280" width="150" height="22" fill="#f97316"/>'
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'El cliente quiere colgar un tecle de una tonelada de la viga que ya tiene...',
  '..."total, es una viga grande, aguanta". Nadie sabe qué acero es, ni para qué se calculó. Y si falla, la carga cae sobre alguien.',
  'Hoy aprendes a trabajar sobre estructuras que ya existen: reforzar y ampliar, sin poner a nadie en riesgo. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('"Total,', 'aguanta"', 10, 'REFUERZOS', soldando=False) + viga_ref(0, 1250, 300)))

E.append(escena_obra(2, [
  'Seguimos con el módulo avanzado. Muchos trabajos no son obras nuevas: son ampliar un mezanine, colgar un tecle, o reforzar una viga que ya está ahí.',
  'Y trabajar sobre lo existente tiene sus propias reglas.',
], 'Hoy: <span class="nar">refuerzos y ampliaciones</span>', ETAPAS_EST_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Antes de tocar nada, investiga. Mide el perfil: su altura, sus alas, y los espesores. Un calibrador te da las medidas; para espesores sin acceso, existe el medidor por ultrasonido.',
  'Revisa su estado: corrosión, partes adelgazadas, soldaduras fisuradas, perforaciones.',
  'Busca los planos originales, si existen. Y con todo eso, lleva la nueva carga al ingeniero. Él decide si aguanta, o cómo se refuerza.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Primero, <span class="nar">investiga</span>', top=110) + tarjetas([
  ('📏', 'Mide el perfil', 'Altura, alas y espesores'), ('🔍', 'Revisa su estado', 'Óxido, fisuras, perforaciones'), ('📂', 'Busca los planos', 'Si existen'), ('👷', 'Al ingeniero', 'Con la nueva carga')],
  lambda i: [0, 1, 2, 2][i])))

E.append(dict(frases=[
  'Soldar sobre acero viejo tiene trampas. Puede ser de un acero que no conoces, y algunos se fisuran al soldar.',
  'Usa electrodo de bajo hidrógeno, el siete cero dieciocho, limpia bien, y si el ingeniero lo pide, precalienta la zona.',
  'Y cuidado con la pintura vieja: algunas pinturas antiguas tienen plomo. Al quemarlas, sueltan humo tóxico. Quítala en seco con disco, con respirador, antes de soldar.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Soldar sobre <span class="nar">acero viejo</span>', top=110) + lista([
  ('❓', 'Acero desconocido: algunos <b>se fisuran</b>'), ('🔥', '<b>E7018</b>, limpieza y precalentamiento si se pide'), ('☠️', 'Pintura vieja con plomo: <b>quítala con respirador</b> antes de soldar')],
  lambda i: i, top=290, izq=300, der=300, tam=32)))

E.append(dict(frases=[
  'Regla de seguridad clave: el calor de la soldadura le quita resistencia al acero, por un momento, en la zona que estás soldando.',
  'Si la viga está cargada, y sueldas un refuerzo grande, ese momento puede ser peligroso. Por eso, antes de reforzar, se descarga o se apuntala la estructura.',
  'Y nunca cortes, perfores o quites un elemento existente sin autorización. Un agujero en el ala de una viga le quita mucha más resistencia de la que parece.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El calor <span class="nar">debilita</span>', top=110) + tarjetas([
  ('🌡️', 'El calor debilita', 'Por un momento, en la zona soldada'), ('🪵', 'Apuntala o descarga', 'Antes de reforzar'), ('🚫', 'No cortes ni perfores', 'Sin autorización')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Los refuerzos más comunes. Platinas soldadas a las alas de la viga: aumentan su sección y su rigidez.',
  'Cartelas en las uniones, para hacerlas más fuertes.',
  'Una columna o un puntal intermedio, que acorta la luz de la viga.',
  'Y arriostres adicionales, si el problema es la estabilidad.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cómo se <span class="nar">refuerza</span>', top=100) + viga_ref(0, 230, 240) + viga_ref(0, 560, 240, platinas=True, mas=0.8) + lista([
  ('🟧', '<b>Platinas</b> en las alas'), ('📐', '<b>Cartelas</b> en las uniones'), ('🏛️', '<b>Columna o puntal</b> intermedio'), ('✖️', '<b>Arriostres</b> adicionales')],
  lambda i: i, top=260, izq=1000, der=120, tam=30)))

E.append(dict(frases=[
  'Y las platinas se sueldan con cordones intermitentes y alternados, como vimos en soldadura. Un cordón corrido y grueso a lo largo de la viga la tuerce.',
  'El tamaño y el paso de esos cordones los indica el plano del refuerzo. Por ejemplo: filete de seis, cincuenta milímetros cada ciento cincuenta.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cómo se <span class="nar">sueldan las platinas</span>', top=110) + '''
<svg style="position:absolute;left:300px;top:300px" width="1320" height="260" viewBox="0 0 1320 260">
 <rect x="40" y="90" width="1240" height="80" fill="#9aa6b0"/><rect x="80" y="60" width="1160" height="30" fill="#f97316"/>''' +
 ''.join(f'<rect class="pop" data-en="0" data-mas="{0.25*k:.2f}" x="{100+k*150}" y="{52 if k % 2 == 0 else 86}" width="50" height="10" fill="#ffd166"/>' for k in range(8)) + '''
</svg>''' + badge('INTERMITENTES Y ALTERNADOS · SEGÚN EL PLANO', 1, 560, 640, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Volvamos al tecle de una tonelada. Lo más seguro, casi siempre, es no colgarlo de la viga existente, sino hacer una viga carrilera nueva, con sus propias columnas o apoyos verificados.',
  'Si el ingeniero decide reforzar la viga existente, por ejemplo con dos platinas de cuatro pulgadas por tres octavos, de cuatro metros, son unos sesenta kilos de acero, más el apuntalamiento y la soldadura.',
  'Y en los dos casos: el tecle se prueba con carga antes de entregarlo, y se coloca un letrero con la carga máxima.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">el tecle de 1 t</span>', top=110) + lista([
  ('🆕', 'Lo más seguro: <b>viga carrilera nueva</b> con apoyos propios'), ('🟧', 'O refuerzo: 2 platinas 4" × ⅜" × 4 m ≈ <b>60 kg</b> + apuntalar'), ('🏷️', 'Prueba con carga y <b>letrero de carga máxima</b>')],
  lambda i: i, top=290, izq=280, der=280, tam=31)))

E.append(dict(frases=[
  'Los cinco errores al reforzar.',
  'Uno: decir "total, aguanta", sin investigar ni consultar.',
  'Dos: soldar un refuerzo grande con la viga cargada, sin apuntalar.',
  'Tres: perforar o cortar las alas de una viga existente.',
  'Cuatro: quemar pintura vieja sin protección.',
  'Y cinco: soldar las platinas con un cordón corrido y grueso.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">al reforzar</span>', [
  ('"Total, aguanta"', 'Nadie sabe qué carga resiste.'), ('Soldar con carga', 'Momento de debilidad peligroso.'), ('Perforar alas', 'Quita mucha resistencia.'),
  ('Quemar pintura vieja', 'Puede tener plomo.'), ('Cordón corrido grueso', 'Tuerce la viga.')])))

E.append(dict(frases=[
  'Tu reto: elige una estructura existente cerca de ti. Mide su perfil principal, revisa su estado, y anota qué información le llevarías al ingeniero para ampliarla.',
  'En la última clase del módulo: control de calidad y documentos. Lo que te hace ganar obras grandes.',
], html=reto('📏 En una estructura existente:<br><b class="nar">mide, revisa su estado y lista qué llevarías al ingeniero</b>', 'CALIDAD Y DOCUMENTOS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: sobre lo existente, primero investiga, después consulta, y recién después suelda.',
  '¡Nos vemos en la clase once!',
], html=final('Investiga, consulta <span class="nar">y recién suelda</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c10')
