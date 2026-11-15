"""Curso Naves Parabólicas · Clase 4: Correas, arriostres y tensores."""
import sys
from motor import render, EMBLEMA
from comun import CAJAS, parabola, titulo, pantalla

CURSO = 'NAVES PARABÓLICAS · CLASE 4'
E = []

def nave_iso(en=0, cruces=True, correas=True, n=6):
    """Nave en perspectiva sencilla: arcos, correas y cruces de arriostre."""
    g = ''
    dx, dy = 120, -55
    arcos = []
    for k in range(n):
        ox, oy = 260 + k * dx, 620 + k * dy
        pts = [(ox + 520 * i / 20, oy - 330 * 4 * (i / 20) * (1 - i / 20)) for i in range(21)]
        arcos.append(pts)
        g += f'<polyline class="ap" data-en="{en}" data-mas="{0.15*k:.2f}" points="{" ".join(f"{x:.0f},{y:.0f}" for x, y in pts)}" fill="none" stroke="#f97316" stroke-width="8"/>'
        g += f'<line class="ap" data-en="{en}" data-mas="{0.15*k:.2f}" x1="{ox}" y1="{oy}" x2="{ox}" y2="{oy+150}" stroke="#9fb3c6" stroke-width="8"/><line class="ap" data-en="{en}" data-mas="{0.15*k:.2f}" x1="{ox+520}" y1="{oy}" x2="{ox+520}" y2="{oy+150}" stroke="#9fb3c6" stroke-width="8"/>'
    if correas is not False:
        for i in range(0, 21, 2):
            g += f'<line class="ap" data-en="{correas}" data-mas="{0.06*i:.2f}" x1="{arcos[0][i][0]:.0f}" y1="{arcos[0][i][1]:.0f}" x2="{arcos[-1][i][0]:.0f}" y2="{arcos[-1][i][1]:.0f}" stroke="#e8edf2" stroke-width="3.5"/>'
    if cruces is not False:
        for k in (0, n - 2):
            for i0 in (4, 12):
                a, b = arcos[k][i0], arcos[k + 1][i0 + 4]; c, d = arcos[k][i0 + 4], arcos[k + 1][i0]
                g += f'<g class="pop" data-en="{cruces}" data-mas="{0.3*(k>0)}"><line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{b[0]:.0f}" y2="{b[1]:.0f}" stroke="#5cc8ff" stroke-width="4"/><line x1="{c[0]:.0f}" y1="{c[1]:.0f}" x2="{d[0]:.0f}" y2="{d[1]:.0f}" stroke="#5cc8ff" stroke-width="4"/></g>'
            ox, oy = 260 + k * dx, 620 + k * dy
            g += f'<g class="pop" data-en="{cruces}" data-mas="0.6"><line x1="{ox}" y1="{oy}" x2="{ox+dx}" y2="{oy+dy+150}" stroke="#5cc8ff" stroke-width="4"/><line x1="{ox}" y1="{oy+150}" x2="{ox+dx}" y2="{oy+dy}" stroke="#5cc8ff" stroke-width="4"/></g>'
    return g

# 0. Gancho
E.append(dict(antes=0.8, frases=[
  'Una nave con arcos perfectos, pero sin arriostres, es como una mesa sin travesaños: con el primer viento fuerte, se tambalea.',
  '¡Bienvenido a la clase cuatro! Hoy vemos las piezas que convierten varios arcos sueltos en una sola estructura firme: correas, arriostres y tensores.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 55, 50)], html=f'''
<svg style="position:absolute;left:640px;top:120px" width="1280" height="900" viewBox="0 0 1460 1026">{nave_iso(0, 1, 0)}</svg>
<div style="position:absolute;left:120px;top:300px;width:700px">
 <div class="paso pop" data-en="1"><b>4</b>CLASE 4 DE 9</div>
 <h1 class="t ap" data-en="1" data-mas="0.3" style="margin-top:30px">Correas, <span class="nar">arriostres</span> y tensores</h1>
</div>'''))

# 1. Respuesta del reto
E.append(dict(frases=[
  'Primero, el reto de la clase pasada. ¿Qué pasó con las columnas al usar el arco con tirante?',
  'El arco, al cargarse, empuja sus apoyos hacia afuera. Ese empuje lo toman las columnas, y por eso trabajan a flexión.',
  'El tirante amarra los dos apoyos y se queda con ese empuje. Así las columnas trabajan menos.',
  'Por eso el arco con tirante es buena opción cuando las columnas son delgadas, o cuando el cliente no quiere columnas grandes.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 50, 55)], html=titulo('Respuesta <span class="nar">del reto</span>', top=110) + f'''
<svg style="position:absolute;left:310px;top:250px" width="1300" height="520" viewBox="0 0 1300 520">
 <defs><marker id="fr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="#ff6b6b"/></marker></defs>
 <rect x="130" y="300" width="26" height="200" fill="#9fb3c6"/><rect x="1144" y="300" width="26" height="200" fill="#9fb3c6"/>
 <polyline points="{parabola(143, 1157, 300, 250)}" fill="none" stroke="#f97316" stroke-width="12"/>
 <g class="ap" data-en="1" data-mas="1"><line x1="120" y1="300" x2="20" y2="300" stroke="#ff6b6b" stroke-width="10" marker-end="url(#fr)"/><line x1="1180" y1="300" x2="1280" y2="300" stroke="#ff6b6b" stroke-width="10" marker-end="url(#fr)"/>
  <text x="650" y="150" fill="#ff8a8a" font-size="36" font-weight="900" text-anchor="middle">empuje hacia afuera</text></g>
 <g class="ap" data-en="2"><line x1="143" y1="300" x2="1157" y2="300" stroke="#7ee08a" stroke-width="10"/><text x="650" y="350" fill="#7ee08a" font-size="36" font-weight="900" text-anchor="middle">tirante: toma el empuje</text></g>
</svg>'''))

# 2. Correas
E.append(dict(frases=[
  'Empecemos por las correas. Son los tubos que van de arco a arco, a lo largo de la nave.',
  'Hacen tres trabajos: sostienen la cobertura, llevan su peso a los arcos, y además amarran el cordón superior para que no se pandee de lado.',
  'En InnovApp, las correas van en los nudos del arco: cada metro veinte a metro sesenta. Y la separación nunca debe pasar lo que permite la ficha de tu cobertura.',
  'El perfil típico es un tubo rectangular de cien por cincuenta milímetros, de dos o dos y medio de espesor, según la luz entre arcos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 60, 45), (3, 1.0, 50, 50)], html=f'''
<svg style="position:absolute;left:640px;top:120px" width="1280" height="900" viewBox="0 0 1460 1026">{nave_iso(-1, False, 0)}</svg>
<div style="position:absolute;left:110px;top:150px;width:640px">
 <h2 class="t ap" data-en="0">Las <span class="nar">correas</span></h2>
 <div class="tarjeta ap" data-en="1" style="margin-top:30px;font-size:28px;line-height:1.5">① Sostienen la cobertura<br>② Llevan su peso a los arcos<br>③ Amarran el cordón superior</div>
 <div class="tarjeta ap" data-en="2" style="margin-top:20px;font-size:28px;line-height:1.5">Separación: <b class="nar">1.2 a 1.6 m</b><br><span style="font-size:22px;color:#c9d6e3">nunca más de lo que permite la cobertura</span></div>
 <div class="tarjeta ap" data-en="3" style="margin-top:20px;font-size:28px;line-height:1.5">Perfil típico: <b class="nar">tubo 100 × 50</b><br><span style="font-size:22px;color:#c9d6e3">2.0 a 2.5 mm, según la luz entre arcos</span></div>
</div>'''))

# 3. Metrado de correas
E.append(dict(frases=[
  'Ahora metremos las correas de nuestra nave de quince por treinta.',
  'InnovApp divide este arco en diez tramos: once nudos, once líneas de correas.',
  'Cada línea mide treinta metros. Once por treinta: trescientos treinta metros de correa.',
  'Ahora, ¿cuántas barras? Aquí está la trampa. Si cortas la correa de arco a arco, cada tramo mide cinco metros: de cada barra de seis sale un solo tramo, y sobra un metro.',
  'Seis paños por once líneas: sesenta y seis tramos, sesenta y seis barras. No cincuenta y cinco. Es exactamente lo que te pide InnovApp en Materiales.',
  'Y el peso: el tubo de cien por cincuenta por dos y medio pesa cinco sesenta el metro. Trescientos treinta por cinco sesenta: mil ochocientos cuarenta y ocho kilos. Igualito a la app.',
  'Consejo: esos sesenta y seis metros sobrantes no son basura. Úsalos para clips, tacos y refuerzos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 60), (6, 1.0, 50, 50)], html=titulo('Metrado de <span class="nar">correas</span> · 15 × 30 m', top=110) + '''
<div style="position:absolute;left:300px;right:300px;top:230px">''' +
 ''.join(f'<div class="ap" data-en="{e}" style="display:grid;grid-template-columns:70px 1fr 320px;align-items:center;gap:20px;background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.45);border-radius:18px;padding:14px 24px;margin:12px 0">'
         f'<span class="paso" style="font-size:22px;padding:8px"><b>{i+1}</b></span><div style="font-size:30px;font-weight:800">{t}</div><div style="font-size:36px;font-weight:900;color:#ffd166;text-align:right">{r}</div></div>'
         for i, (e, t, r) in enumerate([(1, 'Líneas de correa (nudos del arco)', '11'), (2, '11 × 30 m', '330 m'), (3, 'Tramo de arco a arco', '5 m · sobra 1 m'), (4, '6 paños × 11 líneas', '66 barras'), (5, '330 m × 5.60 kg/m', '1 848 kg')])) + '</div>'))

# 3b. Unión correa-arco
E.append(dict(frases=[
  '¿Y cómo se une la correa al arco? Tienes tres formas.',
  'Soldada directo sobre el cordón superior: la más rápida y económica.',
  'Con un clip: un pedazo de ángulo o platina soldado al arco, y la correa encima. Te permite nivelar y corregir.',
  'O empernada al clip: se puede desmontar, ideal si la nave algún día se va a trasladar.',
  'En los tres casos: la correa va centrada sobre el nudo del arco, nunca entre nudos. Así su peso baja directo por la celosía.',
], zoom=[(0, 1.0, 50, 50), (4, 1.05, 50, 50)], html=titulo('Unión <span class="nar">correa – arco</span>', top=110) + '<div style="position:absolute;left:160px;right:160px;top:250px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i+1}" style="min-height:330px;text-align:center"><svg width="260" height="170" viewBox="0 0 260 170">{svg}</svg><div style="font-size:31px;font-weight:900;margin-top:8px">{t}</div><div style="font-size:23px;color:#c9d6e3;margin-top:6px">{d}</div></div>'
         for i, (t, d, svg) in enumerate([
           ('Soldada directa', 'Rápida y económica', '<rect x="30" y="110" width="200" height="34" fill="#f97316"/><rect x="95" y="50" width="70" height="60" fill="none" stroke="#e8edf2" stroke-width="7"/><path d="M90 110 l-8 0 M170 110 l8 0" stroke="#ffd166" stroke-width="8"/>'),
           ('Con clip', 'Permite nivelar y corregir', '<rect x="30" y="120" width="200" height="34" fill="#f97316"/><path d="M90 120 L90 70 L105 70 L105 120" fill="#9fb3c6"/><rect x="105" y="40" width="70" height="60" fill="none" stroke="#e8edf2" stroke-width="7"/>'),
           ('Empernada', 'Desmontable', '<rect x="30" y="120" width="200" height="34" fill="#f97316"/><path d="M90 120 L90 70 L105 70 L105 120" fill="#9fb3c6"/><rect x="105" y="40" width="70" height="60" fill="none" stroke="#e8edf2" stroke-width="7"/><circle cx="97" cy="85" r="7" fill="#ffd166"/>')])) +
 '</div><div class="ap" data-en="4" style="position:absolute;left:0;right:0;top:720px;text-align:center;font-size:32px;font-weight:900;color:#ffd166">Siempre centrada sobre el nudo del arco</div>'))

# 4. Arriostres
E.append(dict(frases=[
  'Ahora, los arriostres. Los arcos son muy fuertes en su plano, pero de costado son débiles: el viento que entra por el frente los puede tumbar como fichas de dominó.',
  'La solución son las cruces: barras en X entre dos arcos, en el techo y en las paredes.',
  'No van en todos los paños. Van en el primero y en el último, y en naves largas, también en algún paño intermedio.',
  'InnovApp las pone así: cruces de varilla en el primer y último paño de cada costado, y arriostres en el techo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.06, 45, 50), (3, 1.0, 50, 50)], html=f'''
<svg style="position:absolute;left:640px;top:120px" width="1280" height="900" viewBox="0 0 1460 1026">{nave_iso(-1, 1, -1)}</svg>
<div style="position:absolute;left:110px;top:150px;width:640px">
 <h2 class="t ap" data-en="0">Los <span class="nar">arriostres</span></h2>
 <div class="tarjeta ap" data-en="0" data-mas="2" style="margin-top:30px;font-size:28px;line-height:1.5">Los arcos son fuertes en su plano,<br><b class="nar">débiles de costado</b></div>
 <div class="tarjeta ap" data-en="1" style="margin-top:20px;font-size:28px;line-height:1.5">Cruces en <b class="nar">X</b> en techo y paredes</div>
 <div class="tarjeta ap" data-en="2" style="margin-top:20px;font-size:28px;line-height:1.5"><b class="nar">Primer y último paño</b><br><span style="font-size:22px;color:#c9d6e3">y paños intermedios en naves largas</span></div>
</div>'''))
E.append(pantalla('p20_3d_estructura', ['Míralo en la vista 3D de InnovApp: las cruces en los paños de los extremos, en las paredes y en el techo.', 'Gira la nave y ubícalas: así sabrás exactamente dónde van en obra.'], None, 'Cruces de arriostre · 3D', fundido=True))
E[-1]['zoom'] = [(0, 1.0, 50, 50), (0, 1.4, 50, 58), (1, 1.4, 62, 58)]
E[-1]['fundido'] = True

# 5. Tensores
E.append(dict(frases=[
  'Las cruces de varilla llevan tensores, o templadores: una pieza con rosca para tensarlas.',
  'La varilla solo trabaja estirada. Si queda floja, no sirve. Si la tensas de más, deformas el arco.',
  'La regla es simple: tensa hasta que la varilla quede recta, sin colgar. Siempre de a pocos, y las dos varillas de la cruz por igual.',
  'Y vuelve a revisar los tensores unas semanas después del montaje, porque con el viento se aflojan un poco.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 50, 55), (3, 1.0, 50, 50)], html=titulo('Los <span class="nar">tensores</span>', top=120) + '''
<svg style="position:absolute;left:460px;top:270px" width="1000" height="360" viewBox="0 0 1000 360">
 <line x1="40" y1="180" x2="400" y2="180" stroke="#cfd8e0" stroke-width="10"/><line x1="600" y1="180" x2="960" y2="180" stroke="#cfd8e0" stroke-width="10"/>
 <rect x="400" y="140" width="200" height="80" rx="16" fill="none" stroke="#f97316" stroke-width="10"/>
 <g stroke="#ffd166" stroke-width="3">''' + ''.join(f'<line x1="{410+i*12}" y1="160" x2="{404+i*12}" y2="200"/>' for i in range(4)) + ''.join(f'<line x1="{556+i*12}" y1="160" x2="{550+i*12}" y2="200"/>' for i in range(4)) + '''</g>
 <text x="500" y="270" fill="#f97316" font-size="34" font-weight="900" text-anchor="middle">templador</text>
</svg>
<div style="position:absolute;left:0;right:0;top:670px;display:flex;justify-content:center;gap:22px">
 <div class="paso pop" data-en="1" style="background:#ff6b6b"><b>✕</b>FLOJA: NO SIRVE</div>
 <div class="paso pop" data-en="1" data-mas="1.5" style="background:#ff6b6b"><b>✕</b>MUY TENSA: DEFORMA</div>
 <div class="paso pop" data-en="2" style="background:#3f9e5a"><b>✓</b>RECTA, SIN COLGAR</div>
</div>'''))

# 6. Montaje: primer módulo rígido
E.append(dict(frases=[
  'Un secreto del montaje seguro: el primer módulo rígido.',
  'Levantas el primer arco y lo sujetas con vientos o puntales. Nunca lo sueltes solo.',
  'Levantas el segundo, y de inmediato colocas las correas y las cruces entre los dos.',
  'Ese paño, con sus cruces, ya es un cajón rígido. Desde ahí avanzas arco por arco, amarrando cada uno con sus correas.',
], zoom=[(0, 1.0, 50, 50), (3, 1.05, 50, 50)], html=titulo('El primer <span class="nar">módulo rígido</span>', top=110) + '<div style="position:absolute;left:180px;right:180px;top:260px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">' +
 ''.join(f'<div class="tarjeta ap" data-en="{i+1}" style="min-height:300px"><div class="paso" style="font-size:20px"><b>{i+1}</b>PASO</div><div style="font-size:31px;font-weight:900;margin-top:14px">{t}</div><div style="font-size:24px;color:#c9d6e3;margin-top:8px">{d}</div></div>'
         for i, (t, d) in enumerate([('Primer arco', 'Izado, aplomado y sujeto con vientos o puntales.'), ('Segundo arco', 'De inmediato: correas y cruces entre los dos.'), ('Avanza', 'Desde el cajón rígido, arco por arco con sus correas.')])) + '</div>'))

# 7. Errores
errores = [('Correas más separadas que la ficha', 'La cobertura se hunde o se vuela.'), ('Arriostres solo en un extremo', 'La nave se va de lado con el viento.'),
           ('Cruces flojas o sobretensadas', 'Flojas no trabajan; tensas deforman el arco.'), ('Soltar un arco sin arriostrar', 'Riesgo de volteo en pleno montaje.'),
           ('No revisar tensores', 'Con el tiempo se aflojan: revisa tras unas semanas.')]
E.append(dict(frases=[
  'Cinco errores con correas y arriostres.',
  'Uno: separar las correas más de lo que permite la cobertura.',
  'Dos: poner arriostres solo en un extremo de la nave.',
  'Tres: cruces flojas, o tan tensas que deforman el arco.',
  'Cuatro: soltar un arco sin arriostrar durante el montaje.',
  'Y cinco: nunca volver a revisar los tensores.',
], zoom=[(0, 1.0, 50, 50), (3, 1.04, 50, 55), (5, 1.0, 50, 50)], html=titulo('5 errores <span class="nar">a evitar</span>', top=110) +
 '<div style="position:absolute;left:220px;right:220px;top:230px">' +
 ''.join(f'<div class="ap" data-en="{i+1}" style="display:flex;gap:22px;align-items:center;background:rgba(255,93,93,.08);border:2px solid rgba(255,107,107,.55);border-radius:18px;padding:14px 24px;margin:12px 0">'
         f'<span style="background:#ff6b6b;color:#fff;font-weight:900;font-size:30px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;flex:none">✕</span>'
         f'<div><div style="font-size:33px;font-weight:900">{t}</div><div style="font-size:25px;color:#c9d6e3">{d}</div></div></div>' for i, (t, d) in enumerate(errores)) + '</div>'))

# 8. Reto
E.append(dict(frases=[
  '¡Tu reto! Metra las correas de una nave de doce por veinticuatro.',
  'Ojo: en doce metros, InnovApp divide el arco en ocho tramos. Calcula las líneas de correa, los metros, y las barras de seis metros.',
  'Luego compáralo con la pestaña Materiales de InnovApp. Te doy la respuesta en la próxima clase.',
], html='''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:380px;right:380px;top:300px;font-size:36px;line-height:1.6">
 <div>🏗️ Nave <b class="nar">12 × 24 m</b> · arco en <b class="nar">8 tramos</b></div>
 <div class="ap" data-en="1">📏 Líneas de correa · metros · barras de 6 m</div>
 <div class="ap" data-en="2">✅ Compáralo con <b class="nar">Materiales</b> en InnovApp</div>
</div>'''))

# 9. Cierre
E.append(dict(antes=0.3, despues=2.4, frases=[
  'Resumiendo: las correas sostienen la cobertura y amarran los arcos. Las cruces con tensores, en los paños extremos, hacen que la nave no se mueva.',
  'Y en el montaje, siempre el primer módulo rígido antes de avanzar.',
  'En la próxima clase bajamos al piso: columnas, placas base y pernos de anclaje. ¡Nos vemos!',
], html=f'''
<div style="position:absolute;left:0;right:0;top:220px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">¡Clase 4 <span class="nar">completada</span>!</h2>
 <div class="ap" data-en="2" style="margin-top:26px;font-size:34px;color:#c9d6e3;font-weight:600">Siguiente: <b style="color:#fff">Clase 5 · Columnas, placas base y anclajes</b></div>
 <div class="paso pop" data-en="1" data-mas="0.6" style="margin-top:36px;font-size:26px"><b>↓</b>MATERIAL: CHECKLIST DE MONTAJE (PDF)</div>
 <div class="ap" data-en="2" data-mas="3" style="margin-top:42px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP 966 000 500</div>
</div>'''))

if __name__ == '__main__':
    salida = '/home/claude/video/salida/naves_c4.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, CURSO, salida, cuadros={i: [9.0] for i in range(len(E))})
    else:
        render(E, CURSO, salida)
