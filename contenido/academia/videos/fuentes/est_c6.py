"""Estructuras Metálicas · Clase 6: Pintura anticorrosiva — preparación, espesor y cuánta comprar."""
from sold_comun import *
from est_c1 import ETAPAS_EST, OBRA

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 6'
E = []

E.append(dict(antes=0.5, frases=[
  'Compraste dos galones de pintura "porque alcanza"...',
  '...y a la mitad de la estructura se acabó. O al revés: le diste una capa tan gruesa que se cuarteó al secar.',
  'Hoy aprendes a calcular la pintura como un profesional: cuánto espesor, y cuántos galones. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('¿Cuántos', 'galones?', 6, 'PINTURA', soldando=False) + '''
<div class="pop" data-en="0" style="position:absolute;left:1250px;top:330px;font-size:260px">🪣</div>'''))

E.append(escena_obra(5, [
  'Las piezas del mezanine ya están cortadas, taladradas y soldadas. Antes de que salgan del taller, se pintan.',
  'En el curso de naves vimos el orden de la pintura. Hoy vamos más allá: la preparación, el espesor, y el cálculo de cuánta comprar.',
], 'Hoy: <span class="nar">preparación, espesor y galones</span>', ETAPAS_EST, OBRA))

E.append(dict(frases=[
  'La pintura dura lo que dura su preparación. Hay tres niveles comunes.',
  'Limpieza manual o mecánica, con escobilla y disco: quita el óxido suelto, la escoria y la grasa. Es lo mínimo, para ambientes interiores secos.',
  'Arenado comercial: deja la mayor parte del acero a metal limpio. Para exteriores.',
  'Y arenado a metal casi blanco: para ambientes agresivos, como cerca del mar o en industrias. Cada nivel cuesta más, pero la pintura dura mucho más.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('La <span class="nar">preparación</span>', top=110) + tabla(
  ['Preparación', 'Norma', 'Para'], [['Manual / mecánica', 'SSPC-SP3 · St 3', 'Interiores secos'], ['Arenado comercial', 'SSPC-SP6 · Sa 2', 'Exteriores'], ['Arenado casi blanco', 'SSPC-SP10 · Sa 2½', 'Cerca del mar, industria']],
  lambda i: i + 1, top=280, izq=220, der=220, tam=33)))

E.append(dict(frases=[
  'El espesor se mide en micras, después de seco. La ficha técnica de cada pintura dice cuántas micras dar por mano.',
  'Un sistema típico para interiores: base anticorrosiva, dos manos de unas cincuenta micras, y acabado esmalte, dos manos de unas cuarenta. En total, unas ciento ochenta micras.',
  'Más grueso no es mejor. Una mano demasiado gruesa no seca bien por dentro, y se cuartea. Mejor varias manos delgadas.',
  'Y para medir: un medidor de espesor en seco, o una galga de peine en la pintura todavía húmeda.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('El <span class="nar">espesor</span>', top=110) + f'''
<svg style="position:absolute;left:330px;top:270px" width="1260" height="360" viewBox="0 0 1260 360">
 <rect x="40" y="250" width="880" height="80" fill="#7d8f9f"/><text x="480" y="300" fill="#fff" font-size="28" font-weight="900" text-anchor="middle">Acero</text>
 <rect class="ap" data-en="1" x="40" y="220" width="880" height="30" fill="#c0392b"/><text class="ap" data-en="1" x="940" y="242" fill="#ff8a7a" font-size="24" font-weight="800">Base 1 · 50 µm</text>
 <rect class="ap" data-en="1" data-mas="0.6" x="40" y="190" width="880" height="30" fill="#e05a47"/><text class="ap" data-en="1" data-mas="0.6" x="940" y="212" fill="#ff8a7a" font-size="24" font-weight="800">Base 2 · 50 µm</text>
 <rect class="ap" data-en="1" data-mas="1.2" x="40" y="166" width="880" height="24" fill="#5c6b7a"/><text class="ap" data-en="1" data-mas="1.2" x="940" y="185" fill="#c9d6e3" font-size="24" font-weight="800">Acabado 1 · 40 µm</text>
 <rect class="ap" data-en="1" data-mas="1.8" x="40" y="142" width="880" height="24" fill="#6d7d8c"/><text class="ap" data-en="1" data-mas="1.8" x="940" y="161" fill="#c9d6e3" font-size="24" font-weight="800">Acabado 2 · 40 µm</text>
</svg>''' + badge('TOTAL ≈ 180 µm SECOS', 1, 760, 680, '#3f9e5a', 'µ', mas=2.5) + badge('VARIAS MANOS DELGADAS', 2, 770, 780, '#5cc8ff', '✓')))

E.append(dict(frases=[
  'Ahora, la fórmula del rendimiento. Necesitas dos datos de la ficha técnica: los sólidos por volumen, en porcentaje, y el espesor seco por mano, en micras.',
  'Rendimiento teórico, en metros cuadrados por litro: sólidos por diez, dividido entre las micras.',
  'Por ejemplo: una base con cincuenta por ciento de sólidos, a cincuenta micras: cincuenta por diez, entre cincuenta. Diez metros cuadrados por litro. Un galón tiene tres punto setenta y nueve litros: unos treinta y ocho metros cuadrados por galón.',
  'Pero eso es teórico. Con brocha y pistola se pierde pintura: calcula unos treinta por ciento de pérdidas. Quedan unos veintiséis metros cuadrados por galón, por mano.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('El <span class="nar">rendimiento</span>', top=110) + f'''
<div class="tarjeta ap" data-en="1" style="position:absolute;left:300px;right:300px;top:250px;text-align:center;font-size:40px;font-weight:900">m²/L = <span class="nar">% sólidos × 10</span> ÷ <span style="color:#5cc8ff">micras</span></div>
<div class="tarjeta ap" data-en="2" style="position:absolute;left:300px;right:300px;top:400px;text-align:center;font-size:32px">50 × 10 ÷ 50 = <b class="nar">10 m²/L</b> × 3.79 L = <b>≈ 38 m²/galón</b></div>
<div class="tarjeta ap" data-en="3" style="position:absolute;left:300px;right:300px;top:540px;text-align:center;font-size:32px;border-color:#7ee08a">− 30 % de pérdidas → <b style="color:#7ee08a">≈ 26 m² por galón, por mano</b></div>'''))

E.append(dict(frases=[
  '¿Cuántos metros cuadrados hay que pintar? Se calcula con el perímetro de cada perfil, por su largo.',
  'Columnas: tubo de ciento cincuenta, perímetro cero punto seis metros, por dieciocho metros: unos once metros cuadrados.',
  'Vigas W ocho: alrededor de cero punto noventa y tres metros cuadrados por metro, por doce: once. Viguetas C, por las dos caras: unos veintitrés y medio. Y las placas, uno más.',
  'Total del mezanine: unos cuarenta y siete metros cuadrados.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Cuántos <span class="nar">m²</span> pintar?', top=110) + tabla(
  ['Elemento', 'm² por metro', 'Metros', 'm²'], [['Columnas tubo 150', '0.60', '18', '≈ 11'], ['Vigas W8×18', '≈ 0.93', '12', '≈ 11'], ['Viguetas C 6" (2 caras)', '≈ 0.49', '48', '≈ 23.5'], ['Placas base (2 caras)', '', '6 × 0.18', '≈ 1'], ['<b class="nar">Total</b>', '', '', '<b class="nar">≈ 47</b>']],
  lambda i: [1, 2, 2, 2, 3][i], top=250, izq=260, der=260, tam=31)))

E.append(dict(frases=[
  'Y ahora sí: los galones. Base anticorrosiva: cuarenta y siete metros cuadrados, por dos manos: noventa y cuatro. Entre veintiséis metros por galón: tres galones y medio. Compras cuatro.',
  'Acabado: si su ficha da un rendimiento parecido, otros cuatro galones. Más el diluyente que indique la ficha.',
  'Sin calcular, hubieras comprado dos "porque alcanza", y te faltaba más de la mitad.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('Los <span class="nar">galones</span>', top=110) + f'''
<div style="position:absolute;left:300px;right:300px;top:270px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
 <div class="tarjeta ap" data-en="0" style="text-align:center"><div style="font-size:30px;font-weight:900">Base anticorrosiva</div><div style="font-size:26px;color:#c9d6e3">47 m² × 2 manos ÷ 26</div><div style="font-size:70px;font-weight:900;color:#ffd166">4 gal</div></div>
 <div class="tarjeta ap" data-en="1" style="text-align:center"><div style="font-size:30px;font-weight:900">Acabado</div><div style="font-size:26px;color:#c9d6e3">según su ficha técnica</div><div style="font-size:70px;font-weight:900;color:#ffd166">≈ 4 gal</div></div>
</div>''' + badge('"2 GALONES ALCANZAN" → FALTABA MÁS DE LA MITAD', 2, 500, 680, '#ff6b6b', '!')))

E.append(dict(frases=[
  'Y el clima importa. No pintes con humedad relativa de más de ochenta y cinco por ciento.',
  'El acero debe estar por lo menos tres grados más caliente que el punto de rocío. Si no, se forma una película de agua invisible, y la pintura no agarra.',
  'Y respeta el tiempo entre mano y mano que dice la ficha. Ni antes, porque se arruga, ni mucho después, porque la siguiente mano no se pega.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El <span class="nar">clima</span>', top=110) + tarjetas([
  ('💧', 'Humedad', 'Máximo 85 %'), ('🌡️', 'Punto de rocío', 'Acero 3 °C más caliente, mínimo'), ('⏱️', 'Entre manos', 'El tiempo que dice la ficha')],
  lambda i: i, top=290, cols=3, alto=300, izq=220)))

E.append(dict(frases=[
  'Los cinco errores con la pintura.',
  'Uno: comprar "a ojo", sin calcular metros cuadrados ni rendimiento.',
  'Dos: una sola mano muy gruesa.',
  'Tres: diluir de más para que "rinda". Baja el espesor y la protección.',
  'Cuatro: pintar con humedad, rocío o lluvia.',
  'Y cinco: no respetar el tiempo entre manos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">con la pintura</span>', [
  ('Comprar a ojo', 'Falta o sobra pintura.'), ('Una mano gruesa', 'No seca por dentro y se cuartea.'), ('Diluir de más', 'Menos espesor, menos protección.'),
  ('Humedad o rocío', 'La pintura no agarra.'), ('Apurar las manos', 'Se arruga o no se pega.')])))

E.append(dict(frases=[
  'Tu reto: calcula los metros cuadrados de pintura de una estructura tuya, y cuántos galones de base necesitas, con la ficha técnica de tu pintura.',
  'En la próxima y última clase: el montaje del mezanine. Plomo, nivel, arriostres y el orden correcto.',
], html=reto('🧮 En una estructura tuya, calcula:<br><b class="nar">m² a pintar · galones de base</b>', 'MONTAJE')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la pintura bien calculada protege tu estructura, y tu bolsillo.',
  '¡Nos vemos en la clase siete!',
], html=final('Calcula la pintura, <span class="nar">protege el acero</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c6')
