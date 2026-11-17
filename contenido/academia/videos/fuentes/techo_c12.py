"""Techos a Dos y Cuatro Aguas · Clase 12: Aislamiento térmico y acústico (cierre del curso)."""
from techo_comun import *

CURSO = 'TECHOS A DOS Y CUATRO AGUAS · CLASE 12'
E = []
T = 'font-weight="900" stroke="#0b2a45" stroke-width="7" paint-order="stroke"'

def capas(en=0, foil=None, lana=None, cielo=None, aire=None):
    s = '<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">'
    s += f'<g class="ap" data-en="{en}"><polyline points="' + ' '.join(f'{x},{330 if (x//60)%2 else 300}' for x in range(420, 1501, 30)) + '" fill="none" stroke="#f97316" stroke-width="8"/>'
    s += f'<text x="1530" y="320" fill="#f97316" font-size="28" {T}>plancha</text>'
    s += ''.join(f'<rect x="{x}" y="340" width="60" height="30" fill="#9aa6b0"/>' for x in (480, 900, 1320)) + f'<text x="400" y="365" fill="#9aa6b0" font-size="26" {T} text-anchor="end">correas</text></g>'
    if foil is not None:
        s += f'<g class="ap" data-en="{foil}"><rect x="420" y="372" width="1080" height="10" fill="#e8edf2"/><text x="1530" y="390" fill="#e8edf2" font-size="26" {T}>manta reflectiva</text></g>'
    if aire is not None:
        s += f'<g class="ap" data-en="{aire}"><text x="960" y="345" fill="#5ec4ff" font-size="24" {T} text-anchor="middle">cámara de aire</text></g>'
    if lana is not None:
        s += f'<g class="ap" data-en="{lana}"><rect x="420" y="520" width="1080" height="70" fill="#ffd166" opacity=".55"/><text x="1530" y="565" fill="#ffd166" font-size="26" {T}>lana mineral</text></g>'
    if cielo is not None:
        s += f'<g class="ap" data-en="{cielo}"><rect x="420" y="592" width="1080" height="16" fill="#c9d6e3"/><text x="1530" y="610" fill="#c9d6e3" font-size="26" {T}>cielo raso</text></g>'
    return s + '</svg>'

E.append(dict(antes=0.5, frases=[
  'Llueve sobre un techo de calamina, y adentro no se escucha ni la televisión. Sale el sol, y la casa se vuelve un horno.',
  'El techo metálico es fuerte y económico, pero sin aislamiento, el cliente lo sufre todos los días.',
  'Hoy aprendes a hacerlo fresco y silencioso, en la última clase del curso. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 60, 55), (2, 1.0, 50, 50)],
  html=gancho('Lluvia sobre el techo', 'y no se escucha nada', 12, 'AISLAMIENTO', soldando=False,
              extra_html='<div class="pop" data-en="0" data-mas="0.8" style="position:absolute;left:1260px;top:300px;font-size:200px">🔊</div>')))

E.append(obra_av(3, [
  'Ya sabes resolver limahoyas y techos en L.',
  'Hoy: el aislamiento térmico y acústico, para que la casa sea cómoda.',
], 'Hoy: <span class="nar">aislamiento térmico y acústico</span>'))

E.append(dict(frases=[
  'Primero entiende el problema. El calor: el sol calienta la plancha, y la plancha caliente irradia ese calor hacia abajo, a la casa.',
  'Y el ruido: la plancha es delgada y liviana. Cada gota la hace vibrar como un tambor.',
  'Contra el calor que irradia, sirve reflejarlo. Contra el ruido, sirven la masa y los materiales que absorben la vibración.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Calor <span class="nar">y ruido</span>', top=100) + tarjetas([
  ('☀️', 'Calor', 'La plancha caliente<br>irradia hacia abajo'), ('🥁', 'Ruido', 'La plancha delgada<br>vibra como tambor')],
  lambda i: i, top=260, cols=2, alto=300, izq=420) + badge('REFLEJAR EL CALOR · ABSORBER EL RUIDO', 2, 560, 640, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'Las soluciones, de la más simple a la más completa.',
  'Pintura reflectante blanca por encima de la plancha. La manta reflectiva bajo la plancha, una lámina de aluminio que refleja el calor.',
  'La lana mineral o de vidrio, sobre el cielo raso o bajo la plancha con malla de soporte, que aísla el calor y absorbe el ruido.',
  'Y la más completa: el panel termoacústico, que ya trae el aislante entre dos planchas. Se puede combinar, por ejemplo, manta reflectiva más cielo raso con lana.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">soluciones</span>', top=90) + lista([
  ('🎨', '<b class="nar">Pintura reflectante</b> encima de la plancha'), ('🪞', '<b class="nar">Manta reflectiva</b> bajo la plancha'),
  ('🧶', '<b class="nar">Lana mineral o de vidrio</b>: calor y ruido'), ('🥪', '<b class="nar">Panel termoacústico</b>: todo en uno')],
  lambda i: [1, 1, 2, 3][i], top=240, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'Un detalle que casi nadie respeta: la manta reflectiva funciona reflejando el calor hacia un espacio de aire.',
  'Si la pegas directo contra la plancha caliente, sin aire en medio, el calor pasa por contacto y la manta pierde gran parte de su efecto.',
  'Por eso se instala dejando una cámara de aire entre la plancha y la manta, como indique el fabricante. Por ejemplo, tendiéndola sobre las correas, que separan las dos capas.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 40)], html=titulo('La manta necesita <span class="nar">aire</span>', top=100) + capas(0, foil=0, aire=2) + badge('SIN CÁMARA DE AIRE, NO FUNCIONA BIEN', 1, 560, 470, '#c0392b', '!')))

E.append(dict(frases=[
  'Otro enemigo del techo metálico: la condensación.',
  'En las noches frías, la plancha se enfría más que el aire de adentro. La humedad de la casa se condensa bajo la plancha, y gotea, como si lloviera adentro.',
  'Se evita con una barrera de vapor bajo la plancha, que suele ser la misma manta con sus uniones selladas con cinta, y con ventilación, para sacar el aire húmedo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 45)], html=titulo('La <span class="nar">condensación</span>', top=100) + capas(0) + svg(
  ''.join(f'<circle class="pop" data-en="1" data-mas="{0.15*k}" cx="{500 + 140*k}" cy="{395 + 25*(k%2)}" r="9" fill="#5ec4ff"/>' for k in range(8))) +
  badge('BARRERA DE VAPOR + VENTILACIÓN', 2, 600, 560, '#2b7fb3', '💨')))

E.append(dict(frases=[
  'Para el ruido, lo que más ayuda es la masa y la absorción: lana mineral, cielo raso, o panel termoacústico.',
  'Una cámara de aire con lana, entre la plancha y un cielo raso, baja mucho el ruido de la lluvia. El cielo raso de drywall lo viste en los tutoriales gratuitos de la plataforma.',
  'Y un detalle de instalación: planchas bien fijadas, sin piezas sueltas que vibren con el viento.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 50)], html=titulo('Contra <span class="nar">el ruido</span>', top=100) + capas(0, foil=0, lana=1, cielo=1)))

E.append(dict(frases=[
  'Cómo se instala la manta bajo la plancha. Se tiende sobre las correas, de alero a cumbrera, antes de colocar la plancha.',
  'Las uniones se traslapan unos diez centímetros, o lo que pida el fabricante, y se sellan con cinta de aluminio.',
  'Si la separación entre correas es grande, se tiende una malla o alambres de soporte, para que la manta no cuelgue ni se rompa.',
  'Y cuidado con la lana: no debe mojarse. Mojada pierde su aislamiento y pesa.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Instalación <span class="nar">de la manta</span>', top=100) + lista([
  ('⬇️', 'Sobre las correas, <b class="nar">antes de la plancha</b>'), ('🔁', 'Traslape ≈ <b class="nar">10 cm</b> + cinta de aluminio'),
  ('🕸️', '<b class="nar">Malla de soporte</b> si las correas están separadas'), ('💧', 'La lana <b class="nar">nunca mojada</b>')],
  lambda i: i, top=250, izq=330, der=330, tam=34)))

E.append(dict(frases=[
  'En la casa: el techo tiene ciento veintidós metros cuadrados de área real.',
  'Sumando un diez por ciento por traslapes, son unos ciento treinta y cuatro metros cuadrados de manta.',
  'Si cada rollo cubre, por ejemplo, cuarenta y ocho metros cuadrados: ciento treinta y cuatro entre cuarenta y ocho, dos coma ocho. Compras tres rollos.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('En la obra: <span class="nar">la manta</span>', top=100) + tabla(
  ['Dato', 'Cálculo', 'Resultado'], [['Área real del techo', 'clase 8', '122.1 m²'], ['Con traslapes (+10 %)', '122.1 × 1.10', '≈ 134 m²'], ['Rollos (48 m² c/u, ejemplo)', '134 ÷ 48 = 2.8', '3 rollos']],
  lambda i: [0, 1, 2][i], top=280, izq=280, der=280, tam=34, nota='Rendimiento del rollo de ejemplo: usa el de tu proveedor.')))

E.append(dict(frases=[
  'Los cinco errores de aislamiento.',
  'Uno: pegar la manta reflectiva contra la plancha, sin cámara de aire.',
  'Dos: dejar las uniones sin cinta: ahí condensa.',
  'Tres: dejar mojar la lana.',
  'Cuatro: tapar toda la ventilación.',
  'Y cinco: perforaciones o pernos sin sellar en la manta.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">de aislamiento</span>', [
  ('Manta sin cámara de aire', 'Pierde su efecto.'), ('Uniones sin cinta', 'Condensación.'), ('Lana mojada', 'Ya no aísla.'),
  ('Sin ventilación', 'Humedad atrapada.'), ('Perforaciones sin sellar', 'Goteras y vapor.')])))

E.append(dict(frases=[
  'Tu último reto: la casa de diez por catorce con treinta por ciento. Calcula su área real, la manta con diez por ciento de traslapes, y cuántos rollos de cuarenta y ocho metros cuadrados necesitas.',
  'Mándalo por WhatsApp, y te respondemos.',
], html=reto('🧮 Techo de 10 × 14 m · 30 %:<br><b class="nar">área real, manta (+10 %) y rollos de 48 m²</b>', '¡CURSO COMPLETADO!')))

temas = ['Tipos y partes', 'La pendiente', 'El tijeral', 'Trazo y armado', 'Los apoyos', 'Los aleros', 'Cuatro aguas', 'Metrado y presupuesto',
         'Coberturas', 'Cortes y remates', 'Limahoyas', 'Aislamiento']
E.append(dict(frases=[
  '¡Terminaste el curso completo de techos a dos y cuatro aguas! Mira todo lo que aprendiste.',
  'En el módulo principal: del tipo de techo y la pendiente, al tijeral, su trazo, sus apoyos y aleros, el cuatro aguas y el metrado.',
  'Y en el módulo avanzado: coberturas, cortes y remates, limahoyas, y aislamiento.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¡Curso <span class="nar">completado</span>!', top=90) + '<div style="position:absolute;left:200px;right:200px;top:200px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">' +
  ''.join(f'<div class="ap" data-en="{1 if i < 8 else 2}" data-mas="{0.25*(i if i < 8 else i-8):.2f}" style="display:flex;gap:12px;align-items:center;background:rgba(126,224,138,.08);border:2px solid rgba(126,224,138,.5);border-radius:14px;padding:12px 16px;font-size:25px;font-weight:800"><span style="background:#3f9e5a;border-radius:50%;width:36px;height:36px;display:grid;place-items:center;flex:none">✓</span>{i+1}. {t}</div>' for i, t in enumerate(temas)) +
  '</div>'))

E.append(dict(antes=0.3, despues=3.0, frases=[
  'Gracias por aprender con Innova Contratistas. Sigue creciendo con nuestros otros cursos: naves parabólicas, soldadura estructural, estructuras metálicas, carpintería metálica, y lectura de planos.',
  '¡Éxitos en tus obras, y nos vemos en la próxima!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:190px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:180px;height:174px;background:#fff;border-radius:36px;padding:15px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:28px">¡Gracias y <span class="nar">éxitos en tus obras</span>!</h2>
 <div style="margin-top:30px;display:flex;justify-content:center;gap:14px;flex-wrap:wrap;padding:0 200px">''' + ''.join(f'<div class="paso pop" data-en="0" data-mas="{2+0.5*i:.1f}" style="font-size:21px">{c}</div>' for i, c in enumerate(['NAVES PARABÓLICAS', 'SOLDADURA ESTRUCTURAL', 'ESTRUCTURAS METÁLICAS', 'CARPINTERÍA METÁLICA', 'LECTURA DE PLANOS'])) + f'''</div>
 <div class="ap" data-en="1" style="margin-top:40px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP {WA}</div>
</div>'''))

if __name__ == '__main__':
    render_clase(E, CURSO, 'techo_c12')
