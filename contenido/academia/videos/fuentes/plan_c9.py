"""Lectura de Planos Metálicos · Clase 9: Tu propio croquis acotado para el cliente."""
from sold_comun import *
from plan_c7 import ETAPAS_PLAN_AV

CURSO = 'LECTURA DE PLANOS · CLASE 9'
E = []
PAPEL = '#f4f1e8'; TINTA = '#2b3640'

def croquis(en, x, y, esc=1.0, cotas=True, firma=True, mas=0):
    s = (f'<svg class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px" width="{760*esc}" height="{560*esc}" viewBox="0 0 760 560">'
         f'<rect x="0" y="0" width="760" height="560" rx="10" fill="{PAPEL}"/>'
         f'<rect x="120" y="80" width="360" height="360" fill="none" stroke="{TINTA}" stroke-width="8"/>' +
         ''.join(f'<line x1="{120+k*40}" y1="84" x2="{120+k*40}" y2="436" stroke="{TINTA}" stroke-width="4"/>' for k in range(1, 9)))
    if cotas:
        s += (f'<line x1="120" y1="480" x2="480" y2="480" stroke="#c0392b" stroke-width="2"/><text x="300" y="510" fill="#c0392b" font-size="24" font-weight="900" text-anchor="middle">1200</text>'
              f'<line x1="80" y1="80" x2="80" y2="440" stroke="#c0392b" stroke-width="2"/><text x="70" y="265" fill="#c0392b" font-size="24" font-weight="900" text-anchor="end">1200</text>'
              f'<text x="300" y="60" fill="#c0392b" font-size="20" font-weight="900" text-anchor="middle">8 barrotes ½" @ 116 mm</text>')
    s += (f'<text x="520" y="110" fill="{TINTA}" font-size="20" font-weight="900">REJA V-1</text><text x="520" y="140" fill="{TINTA}" font-size="18">Marco tubo 1" × 1.5</text>'
          f'<text x="520" y="168" fill="{TINTA}" font-size="18">Barrote cuadrado ½"</text><text x="520" y="196" fill="{TINTA}" font-size="18">Empotrar 5 cm</text>'
          f'<text x="520" y="224" fill="{TINTA}" font-size="18">Negro mate · fija</text><text x="520" y="252" fill="{TINTA}" font-size="18">Cotas en mm</text>')
    if firma:
        s += f'<line x1="520" y1="420" x2="720" y2="420" stroke="{TINTA}" stroke-width="2"/><text x="620" y="445" fill="{TINTA}" font-size="18" text-anchor="middle">Aprobado: cliente · fecha</text>'
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'El cliente aprobó "la reja" por teléfono...',
  '...y cuando la vio instalada, dijo: "yo pensaba que era más alta, y de otro color". No había nada por escrito. A rehacerla.',
  'En esta última clase aprendes a hacer tu propio croquis acotado, para que el cliente apruebe exactamente lo que vas a fabricar. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('"Yo pensaba', 'que era otra"', 9, 'TU CROQUIS', soldando=False) + croquis(0, 1100, 300, 0.8, cotas=False, firma=False)))

E.append(escena_obra(2, [
  'Llegamos a la última clase del módulo avanzado.',
  'En muchos trabajos pequeños no hay planos. Ahí el plano lo haces tú. Y ahora ya sabes leer uno, así que también sabes hacerlo.',
], 'Hoy: <span class="nar">tu croquis acotado</span>', ETAPAS_PLAN_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  'Un croquis sirve para dos cosas. Uno: es el acuerdo con el cliente. Lo que está dibujado y aprobado, es lo que se fabrica.',
  'Dos: es la guía del taller. El que corta y suelda no tiene que adivinar ni llamarte cada rato.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Para qué <span class="nar">un croquis</span>?', top=110) + tarjetas([
  ('🤝', 'Acuerdo con el cliente', 'Lo aprobado es lo que se fabrica'), ('🛠️', 'Guía del taller', 'Nadie adivina')],
  lambda i: i, top=290, cols=2, alto=300, izq=380)))

E.append(dict(frases=[
  'Lo que no puede faltar. La vista de frente, con las medidas totales: ancho y alto.',
  'Las medidas parciales: separación de barrotes, divisiones, posición de la chapa. Y que las parciales sumen la total.',
  'Los perfiles y espesores, el sentido de apertura, el acabado y el color.',
  'Y abajo: la unidad de las medidas, la fecha, y un espacio para la firma de aprobación del cliente.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 70, 70)], html=titulo('Lo que <span class="nar">no puede faltar</span>', top=100) + croquis(0, 180, 240, 1.0) + lista([
  ('📏', 'Medidas <b>totales</b>'), ('➗', 'Medidas <b>parciales</b> que sumen la total'), ('🔩', 'Perfiles, apertura, acabado y color'), ('✍️', 'Unidad, fecha y <b>firma del cliente</b>')],
  lambda i: i, top=290, izq=1000, der=80, tam=28)))

E.append(dict(frases=[
  'Cómo dibujarlo sin ser dibujante: papel cuadriculado, regla y lapicero. El dibujo puede ser aproximado; las medidas escritas tienen que ser exactas.',
  'Escribe todas las medidas en una sola unidad, en milímetros o en centímetros, y dilo en el croquis.',
  'Y si lo dibujas en el módulo de carpintería metálica de InnovApp, además le puedes mostrar al cliente el plano y el modelo en tres dimensiones.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cómo <span class="nar">dibujarlo</span>', top=110) + tarjetas([
  ('📓', 'Papel cuadriculado', 'Dibujo aproximado, medidas exactas'), ('📏', 'Una sola unidad', 'mm o cm, y dilo'), ('📱', 'O en InnovApp', 'Plano y 3D para el cliente')],
  lambda i: i, top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Ejemplo: el croquis de la reja de ventana que calculamos en carpintería.',
  'Mil doscientos por mil doscientos milímetros. Marco de tubo de una pulgada. Ocho barrotes de media pulgada, cada ciento dieciséis milímetros.',
  'Empotrada cinco centímetros. Negro mate. Fija, no abre.',
  'El cliente lo firma con la fecha. Y si después quiere otra cosa, es un cambio, y se cotiza aparte.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 40, 50)], html=titulo('En la obra: <span class="nar">croquis de la reja</span>', top=100) + croquis(0, 580, 240, 1.0)))

E.append(dict(frases=[
  'Envíalo por WhatsApp como foto o PDF, y pide que el cliente responda "aprobado". Guarda esa conversación.',
  'Y cuando entregues, compara el trabajo con el croquis aprobado. Si coincide, no hay discusión.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Aprobación <span class="nar">por escrito</span>', top=110) + lista([
  ('📤', 'Envíalo en foto o PDF'), ('✅', 'Pide la respuesta <b>"aprobado"</b> y guárdala'), ('📋', 'Al entregar: compara con el croquis')],
  lambda i: [0, 0, 1][i], top=300, izq=330, der=330, tam=33)))

E.append(dict(frases=[
  'Los cinco errores con los croquis.',
  'Uno: sin medidas totales.',
  'Dos: medidas parciales que no suman la total.',
  'Tres: sin decir la unidad.',
  'Cuatro: sin sentido de apertura, acabado ni color.',
  'Y cinco: sin la aprobación del cliente.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con croquis</span>', [
  ('Sin totales', 'Nadie sabe el tamaño final.'), ('Parciales que no suman', 'Error en el taller.'), ('Sin unidad', '¿mm o cm?'),
  ('Sin apertura ni acabado', 'Discusión en la entrega.'), ('Sin aprobación', 'Rehacer a tu costo.')])))

E.append(dict(frases=[
  'Tu reto final: haz el croquis acotado de tu próximo trabajo, con todo lo que vimos, y mándanoslo.',
  'Te ayudamos a revisarlo antes de que se lo envíes a tu cliente.',
], html=reto('✏️ Croquis acotado de tu próximo trabajo:<br><b class="nar">totales · parciales · perfiles · acabado · firma</b>', 'TU PRÓXIMO PLANO')))

E.append(dict(antes=0.3, despues=3.0, frases=[
  '¡Felicitaciones! Terminaste el curso completo de Lectura de Planos Metálicos, con el módulo avanzado.',
  'Ahora sabes leer cualquier plano, y hacer los tuyos. ¡Éxitos en tus trabajos!',
], html=final('¡Curso <span class="nar">completado</span>!')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c9')
