"""Portones Automáticos · Clase 1: Tipos de portón y cuál conviene."""
from porton_comun import *

CURSO = 'PORTONES AUTOMÁTICOS · CLASE 1'
E = []

E.append(dict(antes=0.5, frases=[
  'Un botón, y el portón se abre solo. El cliente lo ve en la casa del vecino y te pregunta: "¿Cuánto me cobra por automatizar el mío?"',
  'Ese trabajo paga varias veces más que solo fabricar el portón. Pero si eliges mal el tipo o el motor, el portón se traba, se quema el motor y el cliente te llama todos los meses.',
  'En este curso automatizamos un portón de verdad, de principio a fin. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 55, 60), (2, 1.0, 50, 50)],
  html=CSS_P + corredizo(x=900, piso=740, alto=380, vano=600, en_abre=0, mas=1.0) +
  '<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,12,22,.92) 0%,rgba(3,12,22,.55) 45%,rgba(3,12,22,0) 70%)"></div>' +
  gancho('Un botón', 'y se abre solo', 1, 'TIPOS DE PORTÓN', soldando=False)))

E.append(obra(0, [
  'Nuestra obra: una cochera con un vano de tres metros sesenta.',
  'Vamos a fabricar y automatizar un portón corredizo de tres noventa por dos cuarenta, y al final también veremos batientes y levadizos.',
], 'Vano 3.60 m · hoja <span class="nar">3.90 × 2.40 m</span>'))

E.append(dict(frases=[
  'Hay cinco tipos de portón que se automatizan.',
  'El corredizo se desliza sobre un riel, a un costado. Es el más común en cocheras y el más fácil de motorizar.',
  'El batiente se abre como una puerta, en una o dos hojas. El levadizo o basculante sube y queda bajo el techo.',
  'Y el seccional y el enrollable suben por paneles o enrollándose. Esos se compran casi siempre de fábrica.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Los <span class="nar">5 tipos</span>', top=90) + tarjetas([
  ('↔️', 'Corredizo', 'Riel en el piso<br>el más común'), ('🚪', 'Batiente', '1 o 2 hojas<br>que giran'), ('⤴️', 'Levadizo', 'Sube y queda<br>bajo el techo'),
  ('🪟', 'Seccional', 'Paneles que<br>suben por guías'), ('🌀', 'Enrollable', 'Lamas que<br>se enrollan')],
  lambda i: [1, 2, 2, 3, 3][i], top=240, cols=5, alto=320, izq=90)))

E.append(dict(frases=[
  'Para elegir, mira primero el espacio. El corredizo necesita, al costado, un muro libre al menos tan largo como el vano, más unos treinta centímetros.',
  'El batiente necesita espacio adentro para que giren las hojas, y un piso sin desnivel.',
  'Y el levadizo necesita altura libre arriba del vano y un techo o viga donde apoyar.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Primero: <span class="nar">el espacio</span>', top=90) + tabla(
  ['Tipo', 'Necesita', 'Ojo con'],
  [['Corredizo', 'Muro libre ≥ vano + 0.30 m', 'Riel limpio'], ['Batiente', 'Espacio adentro para girar', 'Piso con pendiente'], ['Levadizo', 'Altura libre arriba', 'Techo o viga firme']],
  lambda i: i, top=250, izq=230, der=230, tam=31)))

E.append(dict(frases=[
  'Luego, el uso. No es lo mismo una casa, que abre diez veces al día, que un condominio o una empresa, que abre cien o doscientas.',
  'A eso se le llama ciclos de trabajo. Cada motor dice cuántos ciclos por hora o por día aguanta. Si lo usas más, se calienta y se quema.',
  'Para uso intenso se eligen motores de uso industrial o de 24 voltios con trabajo continuo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Después: <span class="nar">el uso</span>', top=90) + tarjetas([
  ('🏠', 'Casa', '≈ 10 a 20 ciclos al día<br><b class="nar">motor residencial</b>'), ('🏘️', 'Condominio', '≈ 100 a 200 ciclos<br><b class="nar">motor de uso intenso</b>'),
  ('🏭', 'Empresa', 'Uso continuo<br><b class="nar">industrial o 24 V</b>')],
  lambda i: [0, 0, 2][i], top=260, cols=3, alto=320, izq=240) + badge('MÁS USO QUE EL MOTOR = MOTOR QUEMADO', 1, 560, 640, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Mira cómo trabaja un corredizo automático.',
  'El motor está fijo al costado, sobre una base de concreto. En su eje tiene un piñón, una rueda dentada.',
  'En la hoja va atornillada la cremallera, una barra con dientes. El piñón gira, empuja la cremallera, y la hoja corre sobre su riel.',
  'Al llegar al final, un tope o fin de carrera le dice al motor que pare.',
], zoom=[(0, 1.0, 50, 50), (1, 1.15, 35, 70), (2, 1.0, 50, 50)], html=CSS_P + titulo('Cómo trabaja <span class="nar">el corredizo</span>', top=70) +
  corredizo(x=430, piso=770, alto=400, vano=820, en_abre=2, mas=0.8) +
  badge('Piñón del motor', 1, 380, 520, '#3f9e5a', '⚙') + badge('Cremallera en la hoja', 2, 900, 560, '#f97316', '▤') + badge('Fin de carrera', 3, 1390, 460, '#5b8def', '■')))

E.append(dict(frases=[
  'El batiente, en cambio, se mueve con brazos. Puede ser un brazo articulado, como un codo, o un pistón que empuja la hoja.',
  'Cada hoja lleva su propio motor. Por eso un batiente de dos hojas cuesta más que un corredizo del mismo ancho.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=CSS_P + titulo('El batiente: <span class="nar">un motor por hoja</span>', top=90) +
  batiente_planta(cx=960, y=620, L=280, en=0) + badge('2 hojas = 2 motores', 1, 760, 300, '#f97316', '×2')))

E.append(dict(frases=[
  'Un portón automático tiene siempre las mismas piezas.',
  'El motor con su tarjeta de control, que es el cerebro. Los controles remotos y su receptor.',
  'Las fotoceldas, que detectan si alguien pasa. La luz destellante que avisa que se está moviendo.',
  'Y el desbloqueo manual, para abrir con la mano si se va la luz. Todas estas piezas las veremos una por una.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">piezas</span> del sistema', top=90) + '<div style="position:absolute;left:250px;right:250px;top:230px;display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
  ''.join(f'<div class="ap" data-en="{e}" data-mas="{m}" style="background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.6);border-radius:14px;padding:18px 22px;font-size:31px;font-weight:800">{t}</div>'
          for e, m, t in [(1, 0, '⚙️ Motor y tarjeta de control'), (1, 0.6, '📡 Controles y receptor'), (2, 0, '🔴 Fotoceldas'), (2, 0.6, '💡 Luz destellante'),
                          (3, 0, '🔑 Desbloqueo manual'), (3, 0.6, '⛓️ Cremallera o brazos')]) + '</div>'))

E.append(dict(frases=[
  'Para nuestra cochera elegimos corredizo. Hay muro libre de casi cinco metros al costado, el piso es plano y es una casa: uso residencial.',
  'El batiente quitaba espacio al auto adentro, y el levadizo chocaba con la viga del techo de la cochera.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Nuestra elección: <span class="nar">corredizo</span>', top=90) + lista([
  ('✅', 'Muro libre al costado: <b class="nar">≈ 4.80 m</b> (necesita 3.90 m)'), ('✅', 'Piso plano · <b class="nar">uso residencial</b>'),
  ('❌', 'Batiente: <b>quita espacio al auto</b>'), ('❌', 'Levadizo: <b>choca con la viga</b>')],
  lambda i: [0, 0, 1, 1][i], top=250, izq=320, der=320, tam=33)))

E.append(dict(frases=[
  'Los cuatro errores al elegir.',
  'Uno: ofrecer corredizo sin medir el muro del costado.',
  'Dos: batiente con el piso en pendiente: la hoja raspa.',
  'Tres: motor de casa en un condominio.',
  'Y cuatro: automatizar un portón pesado y duro sin revisarlo antes.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55)], html=errores_html('4 errores <span class="nar">al elegir</span>', [
  ('Sin medir el costado', 'La hoja no tiene dónde ir.'), ('Batiente en pendiente', 'Raspa el piso.'), ('Motor chico para mucho uso', 'Se quema en meses.'),
  ('Portón duro sin revisar', 'El motor sufre y falla.')])))

E.append(dict(frases=[
  'Tu reto: mira tres portones de tu barrio y anota de qué tipo son, cuánto espacio tienen y si conviene automatizarlos así o de otra forma.',
  'En la próxima clase: el peso del portón y cómo elegir el motor.',
], html=reto('🔎 Analiza <b class="nar">3 portones</b> de tu barrio:<br>tipo · espacio · ¿conviene así?', 'PESO Y MOTOR')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: primero el espacio y el uso, después el motor.',
  '¡Nos vemos en la clase dos!',
], html=final('Elige bien <span class="nar">el tipo</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'porton_c1')
