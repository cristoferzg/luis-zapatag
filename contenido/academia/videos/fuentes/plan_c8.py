"""Lectura de Planos Metálicos · Clase 8: Planos de arquitectura para el metalero."""
from sold_comun import *
from plan_c7 import ETAPAS_PLAN_AV

CURSO = 'LECTURA DE PLANOS · CLASE 8'
E = []
PAPEL = '#f4f1e8'; TINTA = '#2b3640'

def planta_arq(en, x, y, esc=1.0, mas=0):
    return f'''<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{760*esc}" height="{520*esc}" viewBox="0 0 760 520">
 <rect x="0" y="0" width="760" height="520" rx="10" fill="{PAPEL}"/>
 <path d="M60 60 H700 V460 H60 Z" fill="none" stroke="{TINTA}" stroke-width="16"/>
 <rect x="300" y="452" width="120" height="16" fill="{PAPEL}"/><path d="M300 460 L300 360 A100 100 0 0 1 400 460" fill="none" stroke="{TINTA}" stroke-width="3"/>
 <text x="360" y="500" fill="#c0392b" font-size="26" font-weight="900" text-anchor="middle">P-1</text>
 <rect x="480" y="52" width="160" height="16" fill="{PAPEL}"/><line x1="480" y1="56" x2="640" y2="56" stroke="{TINTA}" stroke-width="2"/><line x1="480" y1="64" x2="640" y2="64" stroke="{TINTA}" stroke-width="2"/>
 <text x="560" y="40" fill="#c0392b" font-size="26" font-weight="900" text-anchor="middle">V-1</text>
 <rect x="52" y="180" width="16" height="200" fill="{PAPEL}"/><line x1="56" y1="180" x2="56" y2="380" stroke="{TINTA}" stroke-width="3" stroke-dasharray="10 6"/>
 <text x="100" y="290" fill="#c0392b" font-size="26" font-weight="900">P-3</text></svg>'''

E.append(dict(antes=0.5, frases=[
  'Fabricaste el marco con la medida exacta del plano de arquitectura...',
  '...y en la obra no entraba. El plano tenía la medida del vano terminado, con el tarrajeo, y el muro estaba en bruto, o al revés.',
  'Hoy aprendes a leer los planos de arquitectura para encontrar todo lo que te sirve como metalero. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Medida del plano,', 'no entraba', 8, 'PLANOS DE ARQUITECTURA', soldando=False) + planta_arq(0, 1080, 300, 0.85)))

E.append(escena_obra(1, [
  'Seguimos con el módulo avanzado. Muchas veces no te dan planos de estructuras: te dan los planos de arquitectura de la casa o del local.',
  'Ahí están tus puertas, ventanas, rejas, barandas y escaleras. Solo hay que saber dónde mirar.',
], 'Hoy: <span class="nar">planos de arquitectura</span>', ETAPAS_PLAN_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'En la planta de arquitectura, cada vano lleva un código. P, de puerta: P uno, P dos. V, de ventana: V uno, V dos.',
  'La puerta se dibuja con un arco: te dice hacia dónde abre, y en qué lado van las bisagras.',
  'Una puerta corrediza o un portón se dibuja con líneas a lo largo del muro, a veces punteadas, mostrando hacia dónde corre.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">vanos</span> en la planta', top=100) + planta_arq(0, 200, 250, 1.0) + lista([
  ('🚪', '<b>P-1, P-2</b>: puertas · <b>V-1, V-2</b>: ventanas'), ('◜', 'El <b>arco</b> dice hacia dónde abre y dónde van las bisagras'), ('↔️', 'Corredizas: líneas a lo largo del muro')],
  lambda i: i, top=300, izq=1010, der=80, tam=28)))

E.append(dict(frases=[
  'Las medidas de cada vano están en el cuadro de vanos: código, ancho, alto, alféizar, tipo y material.',
  'El alféizar es la altura desde el piso hasta donde empieza la ventana. Una ventana de uno veinte por uno, con alféizar de uno, termina a dos metros del piso.',
  'En el cuadro buscas los que son de metal: puertas metálicas, portones, ventanas de fierro. Esos son tu trabajo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">cuadro de vanos</span>', top=100) + tabla(
  ['Código', 'Ancho', 'Alto', 'Alféizar', 'Tipo / material'], [['P-1', '0.90', '2.10', '—', 'Batiente · madera'], ['P-3', '3.00', '2.20', '—', '<b class="nar">Portón corredizo · metálico</b>'], ['V-1', '1.20', '1.00', '1.00', '<b class="nar">Batiente · fierro + vidrio 4 mm</b>']],
  lambda i: [0, 2, 2][i], top=250, izq=200, der=200, tam=31, nota='Cuadro de vanos (ejemplo).')))

E.append(dict(frases=[
  'Ahora la trampa del inicio. Las medidas del plano de arquitectura suelen ser del vano terminado: con el muro ya tarrajeado.',
  'Si llegas a la obra cuando el muro está en bruto, el vano real es más grande: el tarrajeo suele sumar uno y medio a dos centímetros por lado.',
  'Por eso, el plano te dice qué y cómo; pero la medida para fabricar, siempre la tomas en obra, como vimos en carpintería. Y confirmas con el cliente si el vano ya está terminado.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Vano en bruto <span class="nar">o terminado</span>', top=110) + '''
<svg style="position:absolute;left:520px;top:270px" width="880" height="400" viewBox="0 0 880 400">
 <rect class="ap" data-en="0" x="40" y="40" width="180" height="320" fill="#a39d92"/><rect class="ap" data-en="0" x="660" y="40" width="180" height="320" fill="#a39d92"/>
 <rect class="ap" data-en="1" x="200" y="40" width="20" height="320" fill="#e8e3d4"/><rect class="ap" data-en="1" x="660" y="40" width="20" height="320" fill="#e8e3d4"/>
 <g class="ap" data-en="0"><line x1="220" y1="390" x2="660" y2="390" stroke="#ffd166" stroke-width="4"/><text x="440" y="380" fill="#ffd166" font-size="26" font-weight="900" text-anchor="middle">terminado (plano)</text></g>
 <g class="ap" data-en="1"><line x1="200" y1="20" x2="680" y2="20" stroke="#5cc8ff" stroke-width="4"/><text x="440" y="14" fill="#5cc8ff" font-size="24" font-weight="900" text-anchor="middle">en bruto: +1.5 a 2 cm por lado</text></g>
</svg>''' + badge('LA MEDIDA PARA FABRICAR: EN OBRA', 2, 680, 720, '#3f9e5a', '📏')))

E.append(dict(frases=[
  'En los cortes y elevaciones de arquitectura están las alturas: niveles de piso de cada nivel, alturas de barandas, y la escalera completa, con sus contrapasos dibujados.',
  'Y en los detalles, a veces, el diseño de la baranda o de la reja: barrotes, pasamanos, adornos.',
  'Revisa también la leyenda de acabados: color y tipo de pintura de las partes metálicas.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cortes, detalles <span class="nar">y acabados</span>', top=110) + tarjetas([
  ('📐', 'Cortes y elevaciones', 'Niveles, barandas, escalera'), ('🔍', 'Detalles', 'Diseño de rejas y barandas'), ('🎨', 'Leyenda de acabados', 'Color y tipo de pintura')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Los cinco errores con planos de arquitectura.',
  'Uno: fabricar con la medida del plano, sin medir en obra.',
  'Dos: ignorar hacia dónde abre la puerta.',
  'Tres: confundir los códigos de los vanos.',
  'Cuatro: olvidar el alféizar de las ventanas.',
  'Y cinco: no revisar el color y el acabado pedidos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con arquitectura</span>', [
  ('Medida del plano sin medir', 'No entra o queda holgado.'), ('Sentido de apertura', 'Abre al revés.'), ('Códigos confundidos', 'Fabricas el vano equivocado.'),
  ('Sin alféizar', 'Ventana a otra altura.'), ('Sin ver acabados', 'Color o pintura equivocados.')])))

E.append(dict(frases=[
  'Tu reto: en un plano de arquitectura que tengas, haz la lista de todos los vanos metálicos con su código, ancho, alto y alféizar. Y marca hacia dónde abre cada puerta.',
  'En la última clase: cómo hacer tu propio croquis acotado para el cliente, cuando no hay planos.',
], html=reto('📝 En un plano de arquitectura tuyo:<br><b class="nar">lista los vanos metálicos y su sentido de apertura</b>', 'TU CROQUIS ACOTADO')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el plano de arquitectura te dice qué hacer. La medida para fabricar, siempre en obra.',
  '¡Nos vemos en la clase nueve!',
], html=final('El plano dice qué, <span class="nar">la obra dice cuánto</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c8')
