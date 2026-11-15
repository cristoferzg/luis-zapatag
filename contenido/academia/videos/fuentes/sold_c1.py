"""Soldadura Estructural · Clase 1 (muestra gratis): Suelda sin quemarte — seguridad y EPP."""
import sys
from motor import render, EMBLEMA
from comun import titulo, errores_html
from vis_soldadura import CSS, arco, escena_soldando, soldador

CURSO = 'SOLDADURA ESTRUCTURAL · CLASE 1'
E = []

def palabras(texto, en, mas=0.0, paso=0.22, estilo=''):
    return ' '.join(f'<span class="palabra" data-en="{en}" data-mas="{mas+i*paso:.2f}" style="{estilo}">{w}</span>' for i, w in enumerate(texto.split()))

def tarjetas(items, en_de, top=270, cols=4, alto=300):
    return f'<div style="position:absolute;left:130px;right:130px;top:{top}px;display:grid;grid-template-columns:repeat({cols},1fr);gap:24px">' + ''.join(
        f'<div class="tarjeta pop" data-en="{en_de(i)}" style="min-height:{alto}px;text-align:center"><div style="font-size:84px">{e}</div><div style="font-size:33px;font-weight:900;margin-top:10px">{t}</div><div style="font-size:23px;color:#c9d6e3;margin-top:8px">{d}</div></div>'
        for i, (e, t, d) in enumerate(items)) + '</div>'

# 0. Gancho con arco en vivo
E.append(dict(antes=0.6, frases=[
  'Un segundo. Un solo segundo de arco sin careta...',
  '...y pasas la noche con los ojos ardiendo, como si tuvieras arena. Se llama ojo de arco.',
  'Hoy aprendes a soldar sin quemarte. ¡Empezamos!',
], zoom=[(0, 1.0, 50, 50), (1, 1.08, 55, 55), (2, 1.0, 50, 50)], html=CSS + escena_soldando(760, 640, 820, en=0, dur=14) + f'''
<div style="position:absolute;inset:0;background:radial-gradient(60% 60% at 70% 55%,rgba(0,0,0,0),rgba(3,12,22,.75))"></div>
<div style="position:absolute;left:110px;top:250px;width:900px;font-size:86px;font-weight:900;line-height:1.05;letter-spacing:-1.5px">
 {palabras('Un segundo de arco', 0)}<br><span class="nar">{palabras('sin careta…', 0, 1.0)}</span>
</div>
<div class="paso pop" data-en="1" data-mas="3" style="position:absolute;left:110px;top:520px;font-size:30px"><b>!</b>OJO DE ARCO</div>
<div class="paso pop" data-en="2" style="position:absolute;left:110px;top:620px;font-size:30px;background:#3f9e5a"><b>1</b>CLASE 1 · SUELDA SIN QUEMARTE</div>'''))

# 1. La historia del curso
etapas = ['Seguridad', 'Electrodos', 'La máquina', 'Juntas', 'El cordón', 'Nudos del arco', 'Defectos', 'En obra y costos']
E.append(dict(frases=[
  'Este curso no es teoría suelta. Vamos a soldar juntos una obra real: un almacén de quince por treinta metros, de principio a fin.',
  'Clase por clase: elegimos el electrodo, regulamos la máquina, preparamos las juntas, soldamos los arcos, los inspeccionamos y terminamos en la obra.',
  'Y todo empieza por lo más importante: que tú y tu equipo lleguen enteros a casa.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 55)], html=titulo('La obra: <span class="nar">almacén de 15 × 30 m</span>', top=120) +
 '<div style="position:absolute;left:140px;right:140px;top:330px;display:flex;justify-content:space-between;align-items:center">' +
 ''.join(f'<div class="pop" data-en="1" data-mas="{0.45*i:.2f}" style="text-align:center;width:180px"><div style="width:86px;height:86px;margin:0 auto;border-radius:50%;background:{"#f97316" if i == 0 else "rgba(255,255,255,.08)"};border:3px solid #f97316;display:grid;place-items:center;font-size:36px;font-weight:900">{i+1}</div><div style="font-size:24px;font-weight:800;margin-top:12px">{t}</div></div>' for i, t in enumerate(etapas)) +
 '</div><div class="ap" data-en="1" style="position:absolute;left:180px;right:180px;top:372px;height:4px;background:linear-gradient(90deg,#f97316,rgba(249,115,22,.2));z-index:-1"></div>'
 '<div class="tarjeta pop" data-en="2" style="position:absolute;left:520px;right:520px;top:640px;text-align:center;font-size:36px;font-weight:900">Meta n.° 1: <span class="nar">todos llegan enteros a casa</span></div>'))

# 2. Los 4 enemigos
E.append(dict(frases=[
  'El soldador tiene cuatro enemigos. Conócelos bien.',
  'Uno: la luz del arco. Quema los ojos y la piel, como el sol, pero en segundos.',
  'Dos: la electricidad. La máquina, los cables y la pinza.',
  'Tres: los humos. No se ven mucho, pero se respiran todo el día.',
  'Y cuatro: el fuego. Una chispa puede volar varios metros y prender lo que encuentre.',
], zoom=[(0, 1.0, 50, 50), (2, 1.04, 50, 50)], html=titulo('Los 4 <span class="nar">enemigos</span> del soldador', top=120) + tarjetas([
  ('☀️', 'La luz del arco', 'Rayos UV e infrarrojos'), ('⚡', 'La electricidad', 'Máquina, cables y pinza'), ('💨', 'Los humos', 'Metales y gases'), ('🔥', 'El fuego', 'Chispas que vuelan lejos')], lambda i: i + 1)))

# 3. La careta y la sombra
filas = [('Menos de 60 A', '7', '—'), ('60 a 160 A', '8', '10'), ('160 a 250 A', '10', '12'), ('250 a 550 A', '11', '14')]
E.append(dict(frases=[
  'Contra la luz del arco: la careta. Pero no cualquiera. Lo que importa es la sombra: qué tan oscuro es el filtro.',
  'Para electrodo, entre sesenta y ciento sesenta amperios, la sombra mínima es ocho, y lo recomendable es diez.',
  'Entre ciento sesenta y doscientos cincuenta amperios, mínimo diez, y lo ideal es doce.',
  'Si puedes, usa careta fotosensible: se oscurece sola al prender el arco, y no tienes que levantarla para ver.',
  'Y ojo: la luz rebota. Tu ayudante, que mira de costado, también se quema. Usa una cortina o un biombo, o que él también use protección.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 62, 48), (3, 1.0, 50, 50)], html=titulo('La careta: <span class="nar">la sombra correcta</span>', top=110) + f'''
<div class="ap" data-en="0" data-mas="1" style="position:absolute;left:150px;top:260px;width:560px;text-align:center">
 <svg width="420" height="460" viewBox="0 0 420 460"><ellipse cx="210" cy="240" rx="170" ry="210" fill="#1f2933" stroke="#f97316" stroke-width="8"/>
  <rect x="110" y="170" width="200" height="90" rx="12" fill="#0d2b4a" stroke="#5cc8ff" stroke-width="5"/><text x="210" y="228" fill="#5cc8ff" font-size="42" font-weight="900" text-anchor="middle">DIN 10</text></svg></div>
<div class="ap" data-en="1" style="position:absolute;left:780px;right:150px;top:270px"><table style="width:100%;border-collapse:collapse;font-size:32px">
 <tr style="background:#f97316"><th style="padding:12px;text-align:left">Electrodo (amperaje)</th><th>Sombra mínima</th><th>Recomendada</th></tr>''' +
 ''.join(f'<tr class="ap" data-en="{1 if i < 2 else 2}" data-mas="{0.4*(i%2):.1f}" style="background:{"rgba(255,255,255,.06)" if i % 2 else "transparent"}"><td style="padding:12px">{a}</td><td style="text-align:center">{m}</td><td style="text-align:center;color:#ffd166;font-weight:900">{r}</td></tr>' for i, (a, m, r) in enumerate(filas)) +
 '''</table><div style="font-size:21px;color:#8fa9c2;margin-top:10px">Referencia: AWS F2.2 / ANSI Z49.1 (soldadura por arco con electrodo)</div></div>
<div class="paso pop" data-en="3" style="position:absolute;left:780px;top:690px;font-size:24px;background:#3f9e5a"><b>✓</b>CARETA FOTOSENSIBLE</div>
<div class="paso pop" data-en="4" style="position:absolute;left:1180px;top:690px;font-size:24px"><b>!</b>CORTINA PARA EL AYUDANTE</div>'''))

# 4. El EPP completo
etq = [(1, 'Careta + lentes debajo', 340, 1240, 0.0), (2, 'Respirador para humos', 425, 1240, 0.0), (3, 'Casaca de cuero o algodón', 560, 1220, 0.0),
       (4, 'Guantes de caña larga', 680, 1200, 0.0), (5, 'Botas de seguridad', 860, 1250, 0.0), (5, 'Tapones (al esmerilar)', 780, 1260, 2.5)]
E.append(dict(frases=[
  'Ahora, el equipo completo, de la cabeza a los pies.',
  'Careta con la sombra correcta, y lentes de seguridad debajo, para cuando la levantas a picar la escoria.',
  'Respirador para humos, sobre todo en lugares cerrados.',
  'Casaca de cuero, o de algodón grueso. Nunca ropa sintética: con una chispa se derrite y se pega a la piel.',
  'Guantes de cuero de caña larga, secos.',
  'Botas de seguridad, el pantalón por encima de la bota para que no entren chispas, y tapones para el oído cuando esmerilas.',
], zoom=[(0, 1.0, 50, 50), (1, 1.08, 55, 35), (3, 1.0, 50, 50)], html=soldador(1130, 170, 0.85) + titulo('El EPP <span class="nar">completo</span>', top=110) +
 ''.join(f'<div class="pop" data-en="{f}" data-mas="{m}" style="position:absolute;left:180px;top:{y-26}px;display:flex;align-items:center;gap:0"><span class="paso" style="font-size:24px;padding:10px 22px;width:400px;justify-content:center">{t}</span><span class="dib" style="display:block;width:{x-640}px;height:3px;background:#ffd166"></span><span style="width:16px;height:16px;border-radius:50%;background:#ffd166;margin-left:-8px"></span></div>' for f, t, y, x, m in etq)))

# 5. Electricidad
E.append(dict(frases=[
  'Contra la electricidad: guantes secos, siempre. Un guante mojado con sudor ya conduce.',
  'Nunca suelden parados sobre agua o con el piso mojado. Pon una tabla o una alfombra de jebe.',
  'Revisa los cables antes de empezar: si hay cinta, cortes o cobre a la vista, se cambia.',
  'Y la tierra, bien ajustada y cerca de la junta. Una tierra floja calienta, chispea y hace que la corriente busque otro camino.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 55)], html=titulo('Contra la <span class="nar">electricidad</span>', top=120) + tarjetas([
  ('🧤', 'Guantes secos', 'El sudor también conduce'), ('💧', 'Nunca sobre agua', 'Tabla o alfombra de jebe'), ('🔌', 'Cables sanos', 'Sin cortes ni cobre a la vista'), ('🗜️', 'Tierra firme y cerca', 'Bien ajustada a la pieza')], lambda i: i)))

# 6. Humos
E.append(dict(frases=[
  'Contra los humos: ventila. Si sueldas adentro, abre puertas o pon un ventilador que saque el humo, no que te lo tire a la cara.',
  'Mantén la cabeza fuera de la columna de humo. Muchos soldadores se inclinan sobre la pieza, justo donde sube el humo.',
  'Y mucho cuidado con el acero galvanizado. Al soldarlo suelta humo de zinc, que da la fiebre de los humos metálicos: escalofríos y malestar como de gripe.',
  'Si tienes que soldar galvanizado, quita el zinc de la zona con la amoladora, ventila bien, y usa respirador.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 50, 50)], html=CSS + titulo('Contra los <span class="nar">humos</span>', top=120) + arco(1360, 720, 0.7, 0, None, chispas=18, semilla=9) + '''
<div style="position:absolute;left:150px;top:290px;width:820px">
 <div class="tarjeta ap" data-en="0" style="font-size:30px;margin:14px 0">💨 <b>Ventila</b>: saca el humo, no lo empujes a tu cara</div>
 <div class="tarjeta ap" data-en="1" style="font-size:30px;margin:14px 0">🙅 <b>Cabeza fuera</b> de la columna de humo</div>
 <div class="tarjeta ap" data-en="2" style="font-size:30px;margin:14px 0;border-color:#ff6b6b">⚠️ <b>Galvanizado</b> = humo de zinc → fiebre de humos metálicos</div>
 <div class="tarjeta ap" data-en="3" style="font-size:30px;margin:14px 0;border-color:#7ee08a">✅ Quita el zinc, ventila y usa respirador</div>
</div>'''))

# 7. Fuego
E.append(dict(frases=[
  'Y contra el fuego: antes de soldar, mira a tu alrededor. Unos diez metros sin nada que se pueda prender: trapos, cartón, madera, pintura, combustible.',
  'Ten un extintor de polvo químico a la mano, no en la oficina.',
  'Y al terminar, quédate vigilando por lo menos media hora. Muchos incendios empiezan cuando el soldador ya se fue.',
], zoom=[(0, 1.0, 50, 50), (2, 1.05, 50, 55)], html=CSS + arco(960, 640, 1.3, 0, None, chispas=60, semilla=5, humo=False) + '''
<div class="ap" data-en="0" data-mas="2" style="position:absolute;left:560px;top:240px;width:800px;height:800px;border-radius:50%;border:5px dashed #ffd166"></div>
<div class="paso pop" data-en="0" data-mas="2.5" style="position:absolute;left:820px;top:200px;font-size:30px"><b>⟷</b>10 m LIBRES</div>
<div class="paso pop" data-en="1" style="position:absolute;left:150px;top:300px;font-size:30px;background:#ff6b6b"><b>🧯</b>EXTINTOR A LA MANO</div>
<div class="paso pop" data-en="2" style="position:absolute;left:1380px;top:300px;font-size:30px;background:#3f9e5a"><b>⏱</b>VIGILA 30 MIN</div>
<div style="position:absolute;left:0;right:0;top:110px;text-align:center"><h2 class="t ap" data-en="0">Contra el <span class="nar">fuego</span></h2></div>'''))

# 8. Checklist de 60 segundos
check = ['Careta con la sombra correcta', 'Lentes, guantes secos y casaca', 'Cables sanos y tierra firme', 'Nada inflamable a 10 m', 'Extintor a la mano', 'Ventilación o respirador', 'Ayudante protegido']
E.append(dict(frases=[
  'Para que no se te olvide nada, este es el chequeo de sesenta segundos antes de prender la máquina. Siete puntos.',
  'Careta, lentes, guantes y casaca. Cables y tierra. Nada inflamable cerca, y el extintor a la mano.',
  'Ventilación, y tu ayudante protegido. Sesenta segundos que te pueden salvar un ojo, o tu taller.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 50, 50)], html=titulo('Chequeo de <span class="nar">60 segundos</span>', top=110) +
 '<div style="position:absolute;left:520px;right:520px;top:240px">' + ''.join(
  f'<div class="ap" data-en="{1 if i < 5 else 2}" data-mas="{0.7*(i if i < 5 else i-5):.1f}" style="display:flex;gap:18px;align-items:center;font-size:34px;font-weight:800;margin:14px 0"><span style="background:#3f9e5a;border-radius:10px;width:50px;height:50px;display:grid;place-items:center;flex:none">✓</span>{t}</div>' for i, t in enumerate(check)) + '</div>'))

# 9. Errores
E.append(dict(frases=[
  'Los cinco errores que más mandan soldadores al hospital.',
  'Uno: mirar el arco "solo un ratito" sin careta.',
  'Dos: soldar con guantes o ropa mojados.',
  'Tres: ropa sintética o con los bolsillos abiertos, donde caen las chispas.',
  'Cuatro: soldar galvanizado sin ventilar.',
  'Y cinco: irse apenas termina, sin vigilar el fuego.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=errores_html('5 errores <span class="nar">que lastiman</span>', [
  ('Mirar el arco "solo un ratito"', 'El ojo de arco aparece horas después.'), ('Guantes o ropa mojados', 'El agua y el sudor conducen la corriente.'),
  ('Ropa sintética o bolsillos abiertos', 'Se derrite o atrapa chispas.'), ('Galvanizado sin ventilar', 'Fiebre de humos metálicos.'), ('Irse sin vigilar', 'El incendio empieza cuando nadie mira.')])))

# 10. Reto
E.append(dict(frases=[
  '¡Tu reto de hoy! Ponte todo tu equipo, tómate una foto de cuerpo entero, y mándala por WhatsApp al nueve seis seis, cero cero cero, quinientos.',
  'Te decimos si te falta algo. Y en la próxima clase: ¿seis cero once, seis cero trece o siete cero dieciocho? Aprende a elegir el electrodo correcto, y ahorra.',
], html='''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:380px;right:380px;top:300px;font-size:38px;line-height:1.6;text-align:center">
 <div>📸 Foto con tu <b class="nar">EPP completo</b></div>
 <div>💬 WhatsApp <b class="nar">966 000 500</b></div>
 <div class="ap" data-en="0" data-mas="5" style="font-size:30px;color:#c9d6e3">Te decimos si te falta algo</div>
</div>
<div class="paso pop" data-en="1" data-mas="2" style="position:absolute;left:50%;transform:translateX(-50%);top:720px;font-size:28px"><b>2</b>PRÓXIMA: ¿6011, 6013 o 7018?</div>'''))

# 11. Cierre
E.append(dict(antes=0.3, despues=2.6, frases=[
  'Recuerda: el mejor soldador no es el más rápido. Es el que suelda bien, y llega entero a casa todos los días.',
  '¡Nos vemos en la clase dos!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:220px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">Suelda bien, <span class="nar">llega entero</span></h2>
 <div class="ap" data-en="1" style="margin-top:46px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/sold_c1.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [3.0, 9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
