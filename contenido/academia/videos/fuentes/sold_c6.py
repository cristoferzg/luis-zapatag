"""Soldadura Estructural · Clase 6: Suelda los nudos del arco sin torcerlo (deformación y secuencia)."""
from sold_comun import *
from comun import arco_reticulado

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 6'
E = []
P = '#7d8f9f'; S = '#f97316'

def arco_svg(en=0, x0=260, x1=1660, base=740, alto=420, peralte=70, extra='', torcido=False):
    a = arco_reticulado(x0, x1, base, alto, peralte, en=en)
    if torcido:
        a = a.replace('stroke="#f97316"', 'stroke="#ff6b6b"')
    return f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">{a}{extra}</svg>'

def secuencia(en, x0=260, x1=1660, base=740, alto=420, paso=1.1):
    orden = [20, 16, 24, 12, 28, 8, 32, 4, 36, 0, 40]
    h = ''
    for k, i in enumerate(orden):
        x = x0 + (x1 - x0) * i / 40; y = base - 4 * alto * (i / 40) * (1 - i / 40)
        h += (f'<g class="pop" data-en="{en}" data-mas="{k*paso:.2f}" style="transform-origin:{x:.0f}px {y-46:.0f}px"><circle cx="{x:.0f}" cy="{y-46:.0f}" r="30" fill="{"#3f9e5a" if k == 0 else "#ffd166"}"/>'
              f'<text x="{x:.0f}" y="{y-35:.0f}" fill="#0b2a45" font-size="30" font-weight="900" text-anchor="middle">{k+1}</text></g>')
    return h

E.append(dict(antes=0.5, frases=[
  'Soldaste todos los nudos del arco, uno por uno...',
  '...y cuando lo soltaste de la mesa, se cerró cinco centímetros. Ya no entra entre las columnas. El calor lo torció.',
  'Hoy aprendes a soldar los nudos del arco sin que se deforme. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¡Se cerró', '5 centímetros!', 6, 'NUDOS DEL ARCO')))

E.append(escena_obra(5, [
  'Nuestro almacén de quince metros lleva siete arcos reticulados. Cada arco tiene más de cuarenta uniones: montantes y diagonales que llegan a los cordones.',
  'Son casi trescientas uniones en toda la nave. Si cada una jala un poquito, el arco se tuerce. Hoy aprendemos a controlarlo.',
], 'Hoy: <span class="nar">secuencia y control de la deformación</span>'))

E.append(dict(frases=[
  '¿Por qué se tuerce? Cuando sueldas, el metal se calienta y se estira.',
  'Al enfriarse, el cordón se encoge. Y al encogerse, jala las piezas hacia su lado.',
  'Un nudo jala poquito. Pero cuarenta nudos del mismo lado, jalan mucho. Ahí está el secreto: repartir los jalones.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('¿Por qué <span class="nar">se tuerce</span>?', top=110) + f'''
<div style="position:absolute;left:250px;right:250px;top:300px;display:grid;grid-template-columns:1fr 1fr;gap:50px">
 <div class="tarjeta ap" data-en="0" style="text-align:center"><div style="font-size:90px">🔥 ↔️</div><div style="font-size:34px;font-weight:900">Al calentar: se estira</div></div>
 <div class="tarjeta ap" data-en="1" style="text-align:center;border-color:#5cc8ff"><div style="font-size:90px">❄️ ➡️⬅️</div><div style="font-size:34px;font-weight:900">Al enfriar: se encoge y jala</div></div>
</div>''' + badge('SECRETO: REPARTE LOS JALONES', 2, 640, 720, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Regla uno: arma todo el arco y puntéalo completo antes de soldar. Sobre el trazo en el piso o sobre la mesa, con topes y prensas.',
  'Regla dos: suelda desde el centro hacia los extremos. Así el metal se puede mover hacia afuera y no se acumula tensión.',
  'Regla tres: alterna. Un nudo a la izquierda, el siguiente a la derecha. Y si el perfil tiene dos caras, suelda una cara, voltea, y suelda la otra.',
  'Regla cuatro: cordones cortos. En lugar de un cordón largo y seguido, varios tramos cortos, saltando.',
  'Y regla cinco: deja enfriar solo, al aire. Nunca con agua.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Las <span class="nar">5 reglas</span>', top=110) + lista([
  ('📍', '<b>Arma y puntea</b> todo el arco antes de soldar (trazo o mesa, con topes y prensas)'), ('🎯', 'Del <b>centro hacia los extremos</b>'),
  ('🔀', '<b>Alterna</b>: izquierda, derecha · una cara, luego la otra'), ('✂️', '<b>Cordones cortos</b>, saltando'), ('🌬️', 'Enfría <b>al aire</b>, nunca con agua')],
  lambda i: i, top=240, izq=230, der=230, tam=30)))

E.append(dict(frases=[
  'Mira la secuencia en un arco. Primero, el nudo del centro.',
  'Después, uno a la izquierda y uno a la derecha. Y así, alternando, hasta llegar a los apoyos.',
  'Cuando terminas esta cara, volteas el arco y repites la misma secuencia del otro lado.',
], zoom=[(0, 1.0, 50, 50), (1, 1.03, 50, 55)], html=titulo('La <span class="nar">secuencia</span>', top=110) + arco_svg(0, extra=secuencia(1, paso=0.9)) +
 badge('VOLTEA Y REPITE EN LA OTRA CARA', 2, 640, 900, '#5cc8ff', '↻')))

E.append(dict(frases=[
  'Y en cada nudo, ¿qué cordón va primero? En un montante de tubo cuadrado, que llega al cordón del arco, suelda primero los dos lados opuestos.',
  'Después, los otros dos lados. Así el montante no se inclina hacia ningún lado.',
  'Y si el nudo lleva una diagonal, suelda el montante y la diagonal alternando, no uno completo y luego el otro.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 50, 55)], html=titulo('Dentro de <span class="nar">cada nudo</span>', top=110) + f'''
<svg style="position:absolute;left:560px;top:250px" width="800" height="560" viewBox="0 0 800 560">
 <rect x="60" y="400" width="680" height="80" fill="{P}"/><rect x="330" y="80" width="140" height="320" fill="{P}" stroke="#56687a" stroke-width="6"/>
 <g class="ap" data-en="0"><rect x="300" y="380" width="30" height="24" fill="{S}"/><rect x="470" y="380" width="30" height="24" fill="{S}"/><text x="230" y="370" fill="#ffd166" font-size="40" font-weight="900">1</text><text x="530" y="370" fill="#ffd166" font-size="40" font-weight="900">1</text></g>
 <g class="ap" data-en="1"><rect x="330" y="396" width="140" height="12" fill="#ffd166"/><text x="400" y="540" fill="#ffd166" font-size="40" font-weight="900" text-anchor="middle">2 (frente y atrás)</text></g>
 <g class="ap" data-en="2"><line x1="490" y1="400" x2="700" y2="120" stroke="{P}" stroke-width="60"/><text x="640" y="300" fill="#7ee08a" font-size="34" font-weight="900">alterna</text></g>
</svg>'''))

E.append(dict(frases=[
  'Controla cada arco antes de soltarlo. Con la wincha, mide la luz entre apoyos y la flecha en el centro. Deben coincidir con el trazo.',
  'Si un arco salió cerrado, en el siguiente cambia la secuencia: más cortes, más alternado, menos calor seguido.',
  'Y no lo sueltes caliente. Si lo liberas antes de que se enfríe, se sigue moviendo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Controla <span class="nar">antes de soltar</span>', top=110) + arco_svg(0, extra=f'''
 <g class="ap" data-en="0"><line x1="260" y1="790" x2="1660" y2="790" stroke="#5cc8ff" stroke-width="5"/><text x="1200" y="835" fill="#5cc8ff" font-size="34" font-weight="900" text-anchor="middle">luz entre apoyos</text>
 <line x1="960" y1="740" x2="960" y2="320" stroke="#7ee08a" stroke-width="5" stroke-dasharray="14 10"/><text x="985" y="560" fill="#7ee08a" font-size="34" font-weight="900">flecha</text></g>''') +
 badge('NO LO SUELTES CALIENTE', 2, 140, 220, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Un ejemplo de por qué vale la pena. Si un arco sale cerrado y no entra, hay que cortar uniones, abrirlo y volver a soldar.',
  'Eso puede ser medio día de un soldador y su ayudante, más electrodos, más disco. Y se nota en la obra.',
  'Con la secuencia correcta, lo haces bien a la primera. Siete arcos iguales, que entran justo entre las columnas.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Hazlo bien <span class="nar">a la primera</span>', top=110) + f'''
<div style="position:absolute;left:250px;right:250px;top:290px;display:grid;grid-template-columns:1fr 1fr;gap:50px">
 <div class="tarjeta ap" data-en="0" style="text-align:center;border-color:#ff6b6b"><div style="font-size:80px">✂️🔥</div><div style="font-size:32px;font-weight:900">Arco torcido</div><div style="font-size:26px;color:#c9d6e3;margin-top:8px">Cortar, abrir, volver a soldar · medio día perdido</div></div>
 <div class="tarjeta ap" data-en="2" style="text-align:center;border-color:#7ee08a"><div style="font-size:80px">✅📏</div><div style="font-size:32px;font-weight:900">Con secuencia</div><div style="font-size:26px;color:#c9d6e3;margin-top:8px">7 arcos iguales, entran justo</div></div>
</div>'''))

E.append(dict(frases=[
  'Los cinco errores que tuercen los arcos.',
  'Uno: soldar sin puntear todo el arco primero.',
  'Dos: soldar todos los nudos de un lado, y después los del otro.',
  'Tres: cordones largos y seguidos, sin dejar enfriar.',
  'Cuatro: enfriar con agua.',
  'Y cinco: soltar el arco de la mesa cuando todavía está caliente.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">que tuercen</span>', [
  ('Soldar sin puntear todo', 'Las piezas se mueven mientras sueldas.'), ('Un lado completo primero', 'Todos los jalones van al mismo lado.'),
  ('Cordones largos seguidos', 'Demasiado calor acumulado.'), ('Enfriar con agua', 'Encoge de golpe y puede fisurar.'), ('Soltarlo caliente', 'Se sigue moviendo fuera de la mesa.')])))

E.append(dict(frases=[
  'Tu reto: dibuja un arco con once nudos en un papel, y numera la secuencia en la que los soldarías. Mándanos la foto.',
  'En la próxima clase: los defectos de soldadura y cómo los revisa un inspector, con la norma AWS D uno punto uno.',
], html=reto('✏️ Dibuja un arco con 11 nudos:<br><b class="nar">numera tu secuencia de soldadura</b>', 'DEFECTOS E INSPECCIÓN')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el calor siempre jala. Tu trabajo es repartir los jalones.',
  '¡Nos vemos en la clase siete!',
], html=final('Reparte el calor, <span class="nar">arco derecho</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c6')
