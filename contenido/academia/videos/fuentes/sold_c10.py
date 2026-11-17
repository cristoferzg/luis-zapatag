"""Soldadura Estructural · Clase 10: Soldar tubos y perfiles delgados sin perforarlos."""
from sold_comun import *

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 10'
E = []

E.append(dict(antes=0.5, frases=[
  'Le diste con todo al tubo de uno punto cinco milímetros...',
  '...y en un segundo, un hueco. Lo tapas, se abre otro. Al final, una bola de soldadura fea donde debía ir un cordón fino.',
  'Hoy aprendes a soldar tubos y perfiles delgados sin perforarlos. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¡Otro', 'hueco!', 10, 'TUBOS DELGADOS')))

E.append(escena_obra(1, [
  'Seguimos con el módulo avanzado. En barandas, rejas, muebles y estructuras livianas, casi todo es tubo delgado: de uno a dos milímetros.',
  'Y el delgado se suelda distinto que el grueso.',
], 'Hoy: <span class="nar">tubos y perfiles delgados</span>', ETAPAS_AV, 'Módulo avanzado', cab=''))

E.append(dict(frases=[
  '¿Por qué se perfora? Porque la pared es tan delgada que el calor la atraviesa antes de que el charco se forme.',
  'En una plancha de seis milímetros, el calor tiene dónde ir. En un tubo de uno y medio, no.',
  'La solución no es solo bajar el amperaje: es controlar cuánto calor metes, y por cuánto tiempo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('¿Por qué <span class="nar">se perfora</span>?', top=110) + f'''
<div style="position:absolute;left:300px;right:300px;top:290px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
 <div class="tarjeta ap" data-en="1" style="text-align:center"><svg width="300" height="120"><rect x="20" y="30" width="260" height="60" fill="#7d8f9f"/></svg><div style="font-size:30px;font-weight:900">6 mm: el calor se reparte</div></div>
 <div class="tarjeta ap" data-en="1" data-mas="1" style="text-align:center;border-color:#ff6b6b"><svg width="300" height="120"><rect x="20" y="55" width="260" height="12" fill="#7d8f9f"/><circle cx="150" cy="61" r="12" fill="#0b2a45" stroke="#ff6b6b" stroke-width="4"/></svg><div style="font-size:30px;font-weight:900">1.5 mm: lo atraviesa</div></div>
</div>''' + badge('CONTROLA CUÁNTO CALOR Y POR CUÁNTO TIEMPO', 2, 560, 680, '#3f9e5a', '✓')))

E.append(dict(frases=[
  'El electrodo: para tubo delgado, seis cero trece de dos y medio milímetros, o incluso de dos milímetros. Prende fácil y penetra poco, justo lo que necesitas.',
  'Amperaje bajo: con el de dos y medio, empieza por unos sesenta a setenta amperios, y ajusta con un retazo del mismo tubo.',
  'Y si tienes MIG, es lo ideal para delgado: alambre de cero punto ocho, corriente baja, y cordones cortos.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Electrodo <span class="nar">y amperaje</span>', top=110) + tabla(
  ['Para tubo delgado', 'Recomendación'], [['Electrodo', 'E6013 de 2.5 mm (o 2.0 mm)'], ['Amperaje inicial', '≈ 60 a 70 A con 2.5 mm · prueba en retazo'], ['Mejor aún', 'MIG con alambre 0.8 mm, corriente baja']],
  lambda i: i, top=280, izq=300, der=300, tam=32)))

E.append(dict(frases=[
  'La técnica: cordones cortos. Dos o tres centímetros, y paras. Mejor aún: puntos encadenados, uno al lado del otro, dejando que cada uno se enfríe un segundo.',
  'Arco corto y avance rápido. Si te quedas en un sitio, perforas.',
  'Y cuando unes un tubo delgado con una plancha gruesa, apunta el arco hacia la pieza gruesa, y deja que el charco "moje" la delgada.',
  'Las piezas bien pegadas, sin abertura. En delgado, una abertura es un hueco garantizado.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">técnica</span>', top=110) + lista([
  ('✂️', 'Cordones de <b>2 a 3 cm</b> o <b>puntos encadenados</b>'), ('⚡', 'Arco corto, <b>avance rápido</b>'), ('🎯', 'Delgado con grueso: <b>apunta a la gruesa</b>'), ('🤝', 'Piezas <b>pegadas, sin abertura</b>')],
  lambda i: i, top=270, izq=330, der=330, tam=31)))

E.append(dict(frases=[
  'Para los tubos redondos que se cruzan, como en barandas, el corte se llama boca de pescado, o destaje: un corte curvo que abraza al otro tubo.',
  'Con un corte recto queda un hueco enorme que no se puede rellenar en tubo delgado. Con boca de pescado, encaja y se suelda fino.',
  'Se hace con sierra copa, con plantilla de papel enrollada y esmeril, o con una máquina de destaje.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">boca de pescado</span>', top=110) + '''
<svg style="position:absolute;left:400px;top:270px" width="1120" height="420" viewBox="0 0 1120 420">
 <g class="ap" data-en="1"><rect x="40" y="250" width="440" height="70" rx="35" fill="#7d8f9f"/><rect x="225" y="40" width="70" height="215" fill="#7d8f9f"/><polygon points="215,250 305,250 305,232 215,232" fill="#ff6b6b"/>
  <text x="260" y="390" fill="#ff6b6b" font-size="30" font-weight="900" text-anchor="middle">Corte recto: hueco</text></g>
 <g class="ap" data-en="1" data-mas="1"><rect x="620" y="250" width="440" height="70" rx="35" fill="#7d8f9f"/><path d="M805 40 H875 V250 Q840 228 805 250 Z" fill="#7d8f9f"/>
  <text x="840" y="390" fill="#7ee08a" font-size="30" font-weight="900" text-anchor="middle">Boca de pescado: encaja</text></g>
</svg>'''))

E.append(dict(frases=[
  'Para que el tubo no se tuerza, suelda alrededor en cuatro tramos, alternando lados opuestos: arriba, abajo, izquierda, derecha.',
  'Y tapa los extremos de los tubos que quedan abiertos, con una tapita soldada o un tapón. Un tubo abierto se llena de agua y se oxida por dentro, donde nadie lo ve.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Que no se tuerza <span class="nar">ni se oxide</span>', top=110) + tarjetas([
  ('🔄', '4 tramos alternos', 'Arriba, abajo, izquierda, derecha'), ('🧢', 'Tapa los extremos', 'Tapita soldada o tapón'), ('💧', 'Tubo abierto', 'Se oxida por dentro')],
  lambda i: [0, 1, 1][i], top=290, cols=3, alto=320, izq=220)))

E.append(dict(frases=[
  'Ejemplo: una baranda de tubo cuadrado de una y media pulgada por uno punto cinco milímetros.',
  'Seis cero trece de dos y medio, empezando en sesenta y cinco amperios. Prueba en un retazo del mismo tubo.',
  'Puntea las cuatro esquinas de cada unión. Después, cordones de dos centímetros, alternando caras, dejando enfriar entre uno y otro.',
  'Y al final, tapas en todos los extremos abiertos antes de pintar.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('En la obra: <span class="nar">una baranda</span>', top=110) + lista([
  ('🟧', 'Tubo cuadrado <b>1½" × 1.5 mm</b>'), ('⚡', 'E6013 de 2.5 mm · <b>≈ 65 A</b> · prueba en retazo'), ('📍', 'Puntea las <b>4 esquinas</b>'), ('🔄', 'Cordones de <b>2 cm</b> alternando caras'), ('🧢', '<b>Tapas</b> en extremos abiertos')],
  lambda i: [0, 1, 2, 2, 3][i], top=250, izq=330, der=330, tam=31)))

E.append(dict(frases=[
  'Los cinco errores con el delgado.',
  'Uno: amperaje de plancha gruesa.',
  'Dos: un cordón largo y continuo.',
  'Tres: dejar abertura entre las piezas.',
  'Cuatro: corte recto en tubos redondos que se cruzan.',
  'Y cinco: dejar los tubos abiertos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con el delgado</span>', [
  ('Amperaje alto', 'Perforas.'), ('Cordón largo continuo', 'Acumula calor, perfora y tuerce.'), ('Abertura entre piezas', 'Hueco garantizado.'),
  ('Corte recto en tubo redondo', 'No se puede rellenar.'), ('Tubos abiertos', 'Se oxidan por dentro.')])))

E.append(dict(frases=[
  'Tu reto: une dos tubos cuadrados de uno y medio milímetros en T, con cordones cortos alternados, sin perforar. Mándanos la foto.',
  'En la próxima clase: soldar acero galvanizado e inoxidable, con seguridad.',
], html=reto('🔥 Une 2 tubos de 1.5 mm en T, sin perforar:<br><b class="nar">cordones cortos y alternados</b>', 'GALVANIZADO E INOXIDABLE')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: en delgado, poco calor, cordones cortos y piezas bien pegadas.',
  '¡Nos vemos en la clase once!',
], html=final('Poco calor, <span class="nar">cordones cortos</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'sold_c10')
