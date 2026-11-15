"""Estructuras Metálicas · Clase 2: Cómo trabajan vigas y columnas — cargas y predimensionamiento."""
from sold_comun import *
from est_c1 import ETAPAS_EST, OBRA

CURSO = 'ESTRUCTURAS METÁLICAS · CLASE 2'
E = []
P = '#7d8f9f'

E.append(dict(antes=0.5, frases=[
  'El mezanine se veía firme. Hasta que subieron los estantes llenos...',
  '...y la viga empezó a bajar, y el piso a vibrar cada vez que alguien caminaba. No se cayó, pero nadie quería subir.',
  'Hoy aprendes cómo trabajan las vigas y las columnas, para que eso no te pase. ¡Vamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 55, 55), (2, 1.0, 50, 50)], html=gancho('Se veía', 'firme…', 2, 'VIGAS Y COLUMNAS', soldando=False) + f'''
<svg class="ap" data-en="0" style="position:absolute;left:1040px;top:300px" width="760" height="520" viewBox="0 0 760 520">
 <rect x="60" y="120" width="40" height="380" fill="#9aa6b0"/><rect x="660" y="120" width="40" height="380" fill="#9aa6b0"/>
 <path d="M60 110 Q380 200 700 110" stroke="#ff6b6b" stroke-width="34" fill="none"/>
 {"".join(f'<rect x="{150+i*110}" y="{40-int(30*(1-((i-2)/2.5)**2))}" width="70" height="90" fill="#c48a3a"/>' for i in range(5))}
 <text x="380" y="270" fill="#ff6b6b" font-size="44" font-weight="900" text-anchor="middle">↓ 3 cm</text></svg>'''))

E.append(escena_obra(1, [
  'Ya tenemos el metrado de nuestro mezanine de cuatro por seis. Casi una tonelada de acero.',
  'Ahora entendamos por qué lleva esos perfiles, y no otros. Todo empieza por las cargas.',
], 'Hoy: <span class="nar">cargas, vigas y columnas</span>', ETAPAS_EST, OBRA))

E.append(dict(frases=[
  'Hay dos tipos de carga. La carga muerta: todo lo que está siempre. El peso del acero, el piso, el tablero, los acabados.',
  'Y la carga viva: lo que va y viene. Personas, muebles, mercadería.',
  'La norma peruana E punto cero veinte da valores mínimos de carga viva. Por ejemplo: vivienda, doscientos kilos por metro cuadrado. Oficinas, doscientos cincuenta. Almacenaje, quinientos.',
  'Ojo: un mezanine que "es para oficina" y termina lleno de estantes, ya es almacenaje. Pregunta siempre para qué se va a usar.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('Las <span class="nar">cargas</span>', top=110) + f'''
<div style="position:absolute;left:200px;right:200px;top:250px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
 <div class="tarjeta ap" data-en="0"><div style="font-size:36px;font-weight:900">🧱 Carga muerta</div><div style="font-size:27px;color:#c9d6e3;margin-top:8px">Acero, piso, tablero, acabados: siempre está</div></div>
 <div class="tarjeta ap" data-en="1"><div style="font-size:36px;font-weight:900">🚶 Carga viva</div><div style="font-size:27px;color:#c9d6e3;margin-top:8px">Personas, muebles, mercadería: va y viene</div></div>
</div>''' + tabla(['Uso (Norma E.020)', 'Carga viva mínima'], [['Vivienda', '200 kg/m²'], ['Oficinas', '250 kg/m²'], ['Almacenaje', '500 kg/m²']],
  lambda i: (2, 0.6 * i), top=500, izq=520, der=520, tam=32) + badge('¿PARA QUÉ SE VA A USAR?', 3, 720, 880, '#ff6b6b', '?')))

E.append(dict(frases=[
  'La carga baja siempre por el mismo camino. Del piso a las viguetas.',
  'De las viguetas a las vigas principales.',
  'De las vigas a las columnas.',
  'Y de las columnas, por la placa base, a la cimentación. Si un eslabón falla, falla todo.',
], zoom=[(0, 1.0, 50, 50)], html=titulo('El camino <span class="nar">de la carga</span>', top=110) +
 '<div style="position:absolute;left:150px;right:150px;top:330px;display:flex;align-items:center;justify-content:space-between">' + ''.join(
  f'<div class="pop" data-en="{e}" style="text-align:center;width:250px"><div style="font-size:76px">{ic}</div><div style="font-size:30px;font-weight:900;margin-top:8px">{t}</div></div>' + (f'<div class="ap" data-en="{e}" style="font-size:60px;color:#f97316">→</div>' if i < 4 else '')
  for i, (ic, t, e) in enumerate([('🟫', 'Piso', 0), ('〰️', 'Viguetas', 0), ('➖', 'Vigas', 1), ('🏛️', 'Columnas', 2), ('🧱', 'Cimentación', 3)])) + '</div>'))

E.append(dict(frases=[
  'La viga trabaja a flexión: se dobla. La parte de arriba se aprieta, y la de abajo se estira.',
  'Por eso lo que más importa en una viga es su altura, el peralte. Mira esta platina de diez centímetros por un centímetro.',
  'Echada, se dobla con la mano. Parada, la misma platina, el mismo peso, es cien veces más rígida.',
  'Por eso las vigas W tienen el alma alta y las alas arriba y abajo: el acero está donde más trabaja.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=titulo('La viga: <span class="nar">el peralte manda</span>', top=110) + f'''
<svg class="ap" data-en="0" style="position:absolute;left:210px;top:250px" width="700" height="300" viewBox="0 0 700 300">
 <path d="M40 120 Q350 220 660 120" stroke="#9aa6b0" stroke-width="40" fill="none"/>
 <text x="350" y="90" fill="#ff6b6b" font-size="30" font-weight="900" text-anchor="middle">arriba: se aprieta ⇢⇠</text>
 <text x="350" y="270" fill="#5cc8ff" font-size="30" font-weight="900" text-anchor="middle">abajo: se estira ⇠⇢</text></svg>
<div style="position:absolute;left:1000px;top:260px;display:flex;gap:60px;align-items:flex-end">
 <div class="ap" data-en="2" style="text-align:center"><svg width="240" height="60"><rect x="20" y="20" width="200" height="20" fill="#9aa6b0"/></svg><div style="font-size:28px;font-weight:900;color:#ff6b6b">Echada: ×1</div></div>
 <div class="ap" data-en="2" data-mas="1.5" style="text-align:center"><svg width="60" height="240"><rect x="20" y="20" width="20" height="200" fill="#9aa6b0"/></svg><div style="font-size:28px;font-weight:900;color:#7ee08a">Parada: ×100</div></div>
</div>''' + badge('MISMO PESO · 100 VECES MÁS RÍGIDA', 2, 1000, 640, '#3f9e5a', '✓', mas=2)))

E.append(dict(frases=[
  'Regla para predimensionar vigas de acero de entrepiso: el peralte, más o menos la luz entre veinte.',
  'En nuestro mezanine: la viga principal mide cuatro metros. Cuatro mil milímetros entre veinte: doscientos milímetros. Por eso la viga W ocho, de doscientos.',
  'Las viguetas miden tres metros: tres mil entre veinte, ciento cincuenta. Por eso el canal C de seis pulgadas.',
  'Y cuánto puede bajar: un límite común para entrepisos es la luz entre trescientos sesenta. En cuatro metros, unos once milímetros. Más que eso, se nota, y vibra.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('Predimensiona: <span class="nar">peralte ≈ L / 20</span>', top=110) + tabla(
  ['Elemento', 'Luz (L)', 'L / 20', 'Perfil'], [['Viga principal', '4.00 m', '200 mm', 'W8×18 (200 mm)'], ['Vigueta', '3.00 m', '150 mm', 'C 6" (150 mm)']],
  lambda i: i + 1, top=270, izq=280, der=280, tam=33) + f'''
<div class="tarjeta ap" data-en="3" style="position:absolute;left:400px;right:400px;top:560px;text-align:center;font-size:32px">Flecha máxima común: <b class="nar">L / 360</b> → 4 m = <b style="color:#ffd166">≈ 11 mm</b></div>''' +
 badge('REGLA PARA EMPEZAR: EL INGENIERO VERIFICA', 3, 600, 720, '#5cc8ff', 'i', mas=3)))

E.append(dict(frases=[
  'Ahora la columna. Trabaja a compresión: la aplastan de arriba.',
  'Pero casi nunca falla por aplastarse. Falla por pandeo: se dobla de lado, de golpe, como cuando aprietas una regla de plástico por las puntas.',
  'Mientras más larga y delgada, más fácil se pandea. Por eso las columnas se arriostran, y se prefieren los tubos, que son igual de rígidos en las dos direcciones.',
], zoom=[(0, 1.0, 50, 50), (1, 1.05, 50, 55)], html=titulo('La columna: <span class="nar">cuidado con el pandeo</span>', top=110) + f'''
<svg style="position:absolute;left:300px;top:250px" width="1320" height="520" viewBox="0 0 1320 520">
 <g class="ap" data-en="0"><rect x="160" y="60" width="60" height="400" fill="#9aa6b0"/><text x="190" y="40" fill="#ffd166" font-size="50" text-anchor="middle">⬇</text><text x="190" y="505" fill="#fff" font-size="28" font-weight="900" text-anchor="middle">Compresión</text></g>
 <g class="ap" data-en="1"><path d="M620 60 Q720 260 620 460" stroke="#ff6b6b" stroke-width="30" fill="none"/><text x="640" y="40" fill="#ffd166" font-size="50" text-anchor="middle">⬇</text><text x="650" y="505" fill="#ff6b6b" font-size="28" font-weight="900" text-anchor="middle">Pandeo</text></g>
 <g class="ap" data-en="2"><rect x="1040" y="60" width="60" height="400" fill="#9aa6b0"/><line x1="1100" y1="260" x2="1260" y2="60" stroke="#7ee08a" stroke-width="12"/><line x1="1100" y1="260" x2="1260" y2="460" stroke="#7ee08a" stroke-width="12"/><text x="1100" y="505" fill="#7ee08a" font-size="28" font-weight="900" text-anchor="middle">Arriostrada</text></g>
</svg>'''))

E.append(dict(frases=[
  'Calculemos cuánto le llega a cada columna del mezanine. Supongamos uso de oficina: doscientos cincuenta de carga viva, más unos cien de carga muerta. Trescientos cincuenta kilos por metro cuadrado.',
  'Una columna de esquina recibe el área de un metro y medio por dos metros: tres metros cuadrados. Unos mil cincuenta kilos.',
  'Una columna del medio recibe el doble: seis metros cuadrados, unos dos mil cien kilos.',
  'Y si el mezanine se usa para almacenaje, la carga viva sube a quinientos, y las cargas casi se duplican. Por eso pregunta el uso antes de cotizar.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 55)], html=titulo('¿Cuánto llega <span class="nar">a cada columna</span>?', top=110) + f'''
<svg style="position:absolute;left:180px;top:240px" width="760" height="560" viewBox="0 0 760 560">
 <rect x="60" y="60" width="600" height="400" fill="none" stroke="#56687a" stroke-width="4"/>
 <line x1="360" y1="60" x2="360" y2="460" stroke="#56687a" stroke-width="3" stroke-dasharray="10 8"/>
 {"".join(f'<rect x="{x-18}" y="{y-18}" width="36" height="36" fill="#f97316"/>' for x in (60, 360, 660) for y in (60, 460))}
 <rect class="ap" data-en="1" x="60" y="60" width="150" height="200" fill="rgba(92,200,255,.35)"/>
 <rect class="ap" data-en="2" x="210" y="60" width="300" height="200" fill="rgba(126,224,138,.35)"/>
 <text x="360" y="520" fill="#c9d6e3" font-size="26" text-anchor="middle">6 m</text><text x="20" y="265" fill="#c9d6e3" font-size="26" text-anchor="middle">4 m</text>
</svg>
<div style="position:absolute;left:1000px;right:150px;top:270px">
 <div class="tarjeta ap" data-en="0" style="font-size:30px;margin:12px 0">250 viva + 100 muerta = <b class="nar">350 kg/m²</b></div>
 <div class="tarjeta ap" data-en="1" style="font-size:30px;margin:12px 0;border-color:#5cc8ff">Esquina: 1.5 × 2 = 3 m² → <b>≈ 1,050 kg</b></div>
 <div class="tarjeta ap" data-en="2" style="font-size:30px;margin:12px 0;border-color:#7ee08a">Medio: 3 × 2 = 6 m² → <b>≈ 2,100 kg</b></div>
 <div class="tarjeta ap" data-en="3" style="font-size:30px;margin:12px 0;border-color:#ff6b6b">Almacenaje (500): <b>casi el doble</b></div>
</div>'''))

E.append(dict(frases=[
  'Los cinco errores con vigas y columnas.',
  'Uno: poner la viga echada, o el tubo rectangular acostado.',
  'Dos: calcular para oficina, y que lo usen de almacén.',
  'Tres: columnas largas y delgadas, sin arriostrar.',
  'Cuatro: cambiar un perfil por otro "que pesa igual". Pesar igual no es aguantar igual.',
  'Y cinco: olvidar la vibración. Un piso que se mueve al caminar, aunque no se caiga, es un mal trabajo.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">de estructura</span>', [
  ('Viga echada', 'Pierde casi toda su rigidez.'), ('Calcular para otro uso', 'Almacenaje pesa el doble que oficina.'), ('Columnas sin arriostrar', 'Riesgo de pandeo.'),
  ('"Pesa igual, aguanta igual"', 'Falso: manda la forma y el peralte.'), ('Ignorar la vibración', 'El piso se mueve al caminar.')])))

E.append(dict(frases=[
  'Tu reto: toma una estructura tuya. Calcula la carga por metro cuadrado según su uso, y cuántos kilos le llegan a la columna más cargada.',
  'En la próxima clase: las conexiones empernadas. Pernos, agujeros, distancias y cómo ajustarlos bien.',
], html=reto('🧮 En una estructura tuya, calcula:<br><b class="nar">kg/m² según el uso · kg en la columna más cargada</b>', 'CONEXIONES EMPERNADAS')))

E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: la carga siempre baja. Tu trabajo es darle un camino firme hasta el suelo.',
  '¡Nos vemos en la clase tres!',
], html=final('Dale a la carga <span class="nar">un camino firme</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'est_c2')
