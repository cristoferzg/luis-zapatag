"""Lectura de Planos Metálicos · Clase 3: Ejes, cotas y niveles."""
from sold_comun import *
from plan_c1 import ETAPAS_PLAN, OBRA

CURSO = 'LECTURA DE PLANOS · CLASE 3'
E = []

def grilla(en, x, y, esc=1.0, extra=''):
    xs = [120, 420, 720]; ys = [120, 520]
    s = f'<svg class="ap" data-en="{en}" style="position:absolute;left:{x}px;top:{y}px" width="{860*esc}" height="{640*esc}" viewBox="0 0 860 640">'
    for k, xx in enumerate(xs):
        s += f'<line x1="{xx}" y1="60" x2="{xx}" y2="580" stroke="#9aa6b0" stroke-width="3" stroke-dasharray="30 8 4 8"/><circle cx="{xx}" cy="40" r="26" fill="none" stroke="#fff" stroke-width="4"/><text x="{xx}" y="51" fill="#fff" font-size="30" font-weight="900" text-anchor="middle">{k+1}</text>'
    for k, yy in enumerate(ys):
        s += f'<line x1="60" y1="{yy}" x2="780" y2="{yy}" stroke="#9aa6b0" stroke-width="3" stroke-dasharray="30 8 4 8"/><circle cx="820" cy="{yy}" r="26" fill="none" stroke="#fff" stroke-width="4"/><text x="820" y="{yy+11}" fill="#fff" font-size="30" font-weight="900" text-anchor="middle">{"AB"[k]}</text>'
    for xx in xs:
        for yy in ys: s += f'<rect x="{xx-16}" y="{yy-16}" width="32" height="32" fill="#f97316"/>'
    return s + extra + '</svg>'

E.append(dict(antes=0.5, frases=[
  'El plano decía cuatro metros entre columnas...',
  '...y el maestro midió cuatro metros de cara a cara. Pero eran cuatro metros entre ejes. Las vigas quedaron quince centímetros largas.',
  'Hoy aprendes a leer ejes, cotas y niveles, para que cada cosa quede exactamente donde va. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿De eje', 'o de cara?', 3, 'EJES Y COTAS', soldando=False) + grilla(0, 1060, 280, 0.8)))

E.append(escena_obra(2, [
  'Seguimos con los planos de nuestro mezanine. Ya leemos el rótulo, la escala, las vistas y los cortes.',
  'Hoy: dónde va cada cosa. Ejes, cotas y niveles.',
], 'Hoy: <span class="nar">ejes, cotas y niveles</span>', ETAPAS_PLAN, OBRA))

E.append(dict(frases=[
  'Los ejes son la columna vertebral del plano. Son líneas de raya y punto, con un círculo en la punta.',
  'En una dirección llevan números: uno, dos, tres. En la otra, letras: A, B.',
  'Cada columna se nombra por su cruce de ejes. La columna B dos está donde se cruzan el eje B y el eje dos. Así todo el equipo habla el mismo idioma.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 60)], html=titulo('Los <span class="nar">ejes</span>', top=100) + grilla(0, 530, 230, 1.0, extra='<circle class="ap" data-en="2" cx="420" cy="520" r="42" fill="none" stroke="#ffd166" stroke-width="6"/><text class="ap" data-en="2" x="420" y="610" fill="#ffd166" font-size="34" font-weight="900" text-anchor="middle">B-2</text>')))

E.append(dict(frases=[
  'Las cotas casi siempre se miden entre ejes, no entre caras. El eje pasa por el centro de la columna.',
  'Si las columnas son tubos de ciento cincuenta, y entre ejes hay cuatro metros, de cara a cara hay tres metros ochenta y cinco.',
  'Cuando una cota va a la cara de algo, el plano lo muestra con la línea de cota llegando a esa cara. Mira siempre dónde empieza y dónde termina la cota.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Entre ejes <span class="nar">o entre caras</span>', top=110) + '''
<svg style="position:absolute;left:260px;top:280px" width="1400" height="360" viewBox="0 0 1400 360">
 <rect x="100" y="120" width="120" height="120" fill="#f97316"/><rect x="1180" y="120" width="120" height="120" fill="#f97316"/>
 <line x1="160" y1="40" x2="160" y2="320" stroke="#9aa6b0" stroke-width="3" stroke-dasharray="30 8 4 8"/><line x1="1240" y1="40" x2="1240" y2="320" stroke="#9aa6b0" stroke-width="3" stroke-dasharray="30 8 4 8"/>
 <g class="ap" data-en="0"><line x1="160" y1="80" x2="1240" y2="80" stroke="#ffd166" stroke-width="4"/><text x="700" y="66" fill="#ffd166" font-size="34" font-weight="900" text-anchor="middle">4.00 entre ejes</text></g>
 <g class="ap" data-en="1"><line x1="220" y1="290" x2="1180" y2="290" stroke="#5cc8ff" stroke-width="4"/><text x="700" y="335" fill="#5cc8ff" font-size="34" font-weight="900" text-anchor="middle">3.85 de cara a cara</text></g>
</svg>'''))

E.append(dict(frases=[
  'Las cotas vienen en cadena: tramos seguidos, y una cota total que los abarca.',
  'En nuestro mezanine, en la dirección larga: tres metros, más tres metros, total seis. La suma de los tramos tiene que dar la total.',
  'Si no cuadra, hay un error en el plano. No adivines: pregunta por escrito antes de cortar.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Cotas <span class="nar">en cadena</span>', top=100) + grilla(0, 530, 230, 1.0, extra='''
 <g class="ap" data-en="1"><line x1="120" y1="600" x2="420" y2="600" stroke="#ffd166" stroke-width="4"/><text x="270" y="590" fill="#ffd166" font-size="28" font-weight="900" text-anchor="middle">3.00</text>
 <line x1="420" y1="600" x2="720" y2="600" stroke="#ffd166" stroke-width="4"/><text x="570" y="590" fill="#ffd166" font-size="28" font-weight="900" text-anchor="middle">3.00</text>
 <line x1="120" y1="634" x2="720" y2="634" stroke="#7ee08a" stroke-width="4"/><text x="760" y="640" fill="#7ee08a" font-size="28" font-weight="900">6.00 ✓</text></g>''') +
 badge('SI NO CUADRA: PREGUNTA ANTES DE CORTAR', 2, 620, 900, '#ff6b6b', '?')))

E.append(dict(frases=[
  'Los niveles dicen la altura. Se marcan con un triángulo y un número: más tres punto cero cero, por ejemplo.',
  'El punto de partida es el cero: normalmente el nivel de piso terminado, N P T, del piso de abajo.',
  'En nuestro mezanine: piso terminado más cero cero, y el nivel superior de las vigas, más tres cero cero.',
  'Ojo: si el piso del taller todavía no tiene su acabado, o no está nivelado, el cero real puede ser otro. Por eso en el montaje se marca el nivel con láser o manguera, como vimos en estructuras.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">niveles</span>', top=110) + '''
<svg style="position:absolute;left:420px;top:250px" width="1100" height="520" viewBox="0 0 1100 520">
 <line x1="40" y1="460" x2="1060" y2="460" stroke="#9aa6b0" stroke-width="10"/><rect x="200" y="140" width="34" height="320" fill="#9aa6b0"/><rect x="800" y="140" width="34" height="320" fill="#9aa6b0"/>
 <rect x="200" y="120" width="634" height="26" fill="#f97316"/>
 <g class="ap" data-en="1"><polygon points="980,440 1010,440 995,460" fill="#fff"/><text x="1090" y="430" fill="#fff" font-size="30" font-weight="900" text-anchor="end">NPT ±0.00</text></g>
 <g class="ap" data-en="2"><polygon points="900,100 930,100 915,120" fill="#ffd166"/><text x="1090" y="96" fill="#ffd166" font-size="30" font-weight="900" text-anchor="end">NSV +3.00</text></g>
</svg>'''))

E.append(dict(frases=[
  'Los cinco errores con ejes y cotas.',
  'Uno: medir de cara cuando la cota es entre ejes.',
  'Dos: no sumar la cadena para comprobar el total.',
  'Tres: dar por hecho que el piso existente está a nivel cero.',
  'Cuatro: confundir el nivel de piso terminado con el nivel de la losa sin acabado.',
  'Y cinco: llamar a las columnas "la de la esquina", en lugar de por sus ejes. Así se confunde todo el equipo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con ejes y cotas</span>', [
  ('Cara por eje', 'Piezas largas o cortas.'), ('Sin sumar la cadena', 'Errores del plano pasan.'), ('Piso existente = 0', 'Niveles equivocados.'),
  ('NPT vs losa', 'Diferencia del acabado.'), ('Sin nombres de ejes', 'El equipo se confunde.')])))

E.append(dict(frases=[
  'Tu reto: en un plano tuyo, suma una cadena de cotas y comprueba si da la total. Y encuentra un nivel: ¿qué indica, y desde dónde se mide?',
  'En la próxima clase: la simbología de soldadura AWS. Cómo leer qué cordón, de qué tamaño y de qué lado.',
], html=reto('📐 En un plano tuyo:<br><b class="nar">suma una cadena de cotas · explica un nivel</b>', 'SOLDADURA AWS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: entre ejes, la cadena siempre cuadra, y el nivel parte de un cero que tú verificas.',
  '¡Nos vemos en la clase cuatro!',
], html=final('Ejes, cotas y niveles: <span class="nar">todo en su sitio</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'plan_c3')
