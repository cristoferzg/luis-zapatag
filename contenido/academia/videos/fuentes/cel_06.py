"""Celular 6: la Academia, tus plantillas y tus créditos."""
from cel_comun import *
CURSO = 'USABILIDAD · INNOVAPP EN EL CELULAR'
E = []
gris = lambda t: f'<div style="font-size:12px;color:#64748b">{t}</div>'
TABS = ['🛒 Tienda', '🎓 Mis cursos', '📂 Mis plantillas']

def portada_curso(t, c1, c2, etiqueta, sub):
    return tarjeta(f'<div style="height:96px;border-radius:12px;background:linear-gradient(135deg,{c1},{c2});margin:-2px -4px 8px;display:flex;align-items:flex-end;padding:8px">'
                   f'<span style="background:#fff;border-radius:8px;padding:2px 8px;font-size:11px;font-weight:900">{etiqueta}</span></div><b style="font-size:14px">{t}</b>{gris(sub)}')

def academia(tab=0, extra=''):
    if tab == 0:
        cont = (tarjeta('<div style="font-size:11px;font-weight:900;color:#f97316">ACADEMIA TÉCNICA INNOVAPP</div><b style="font-size:17px">Aprende el oficio con casos reales de obra</b>', '#fed7aa', '#fff7ed')
                + portada_curso('Naves parabólicas desde cero', '#1e3a8a', '#f97316', 'Clase de muestra gratis', 'Ver curso →')
                + portada_curso('Soldadura para estructuras', '#7c2d12', '#facc15', 'Gratis', 'Entrar →'))
    elif tab == 1:
        cont = (portada_curso('Usabilidad de la plataforma', '#4f46e5', '#22d3ee', 'Tienes acceso', 'Entrar →')
                + portada_curso('Soldadura para estructuras', '#7c2d12', '#facc15', 'Gratis', 'Entrar →'))
    else:
        cont = (tarjeta('<div style="display:flex;gap:10px;align-items:center"><span style="font-size:28px">🏗️</span><div style="flex:1"><b>Nave parabólica 12 × 24 m</b>' + gris('Plantilla · Techos metálicos') + '</div></div>'
                        + '<div style="margin-top:8px">' + boton('Usar plantilla', '#f97316', alto=40) + '</div>')
                + tarjeta('<div style="display:flex;gap:10px;align-items:center"><span style="font-size:28px">📊</span><div style="flex:1"><b>Cotización de techos (Excel)</b>' + gris('Archivo para descargar') + '</div></div>'
                          + '<div style="margin-top:8px">' + boton('Abrir', '#0f172a', alto=40) + '</div>'))
    return pantalla('Academia', pestanas(TABS, tab) + cont, 'mas', extra=extra)

curso = ('<div style="height:150px;border-radius:14px;background:linear-gradient(135deg,#1e3a8a,#f97316);margin-bottom:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:44px">▶</div>'
         + '<b style="font-size:17px">Naves parabólicas desde cero</b>' + gris('6 clases · con plantillas de práctica')
         + '<div style="font-size:12px;font-weight:800;color:#475569;margin:12px 0 6px">CONTENIDO DEL CURSO</div>'
         + ''.join(f'<div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid #f1f5f9"><span>{n}</span><span>{e}</span></div>' for n, e in [
             ('1 · La obra y sus medidas', '▶ Gratis'), ('2 · Columnas y arco', '🔒'), ('3 · Correas y cobertura', '🔒')])
         + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">' + boton('Ver clase gratis', '#0f172a', alto=44) + boton('Canjear créditos', '#f59e0b', '#0f172a', alto=44) + '</div>')

canje = ('<b style="font-size:17px">Canjear créditos</b>' + gris('Naves parabólicas desde cero') + '<div style="height:10px"></div>'
         + tarjeta('<div style="display:flex;justify-content:space-between;font-size:14px"><span>Cuesta</span><b>🪙 180 créditos</b></div>'
                   '<div style="display:flex;justify-content:space-between;font-size:14px;margin-top:4px"><span>Tu saldo</span><b>🪙 220</b></div>'
                   '<div style="display:flex;justify-content:space-between;font-size:14px;margin-top:4px"><span>Te quedan</span><b style="color:#059669">🪙 40</b></div>')
         + boton('Confirmar canje', '#f59e0b', '#0f172a'))

# 0
E.append(dict(antes=.5, frases=[
  'Cursos con obras reales y plantillas listas para usar, en el bolsillo.',
  'En este último tutorial entras a la Academia desde el celular, ves tus cursos, usas una plantilla y aprendes a usar tus créditos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=portada('La Academia', 'en tu celular', 6) + telefono(academia(0))))

# 1
E.append(dict(frases=[
  'Paso uno: toca Más, y en Aprender elige Academia técnica.',
  'Arriba tienes tres pestañas: Tienda, Mis cursos y Mis plantillas.',
  'En la Tienda ves todos los cursos. Los cursos gratis los abres de una vez.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(1, 'Entra a la <span class="nar">Academia</span>', [
    ('☰', 'Más → <b class="nar">Academia técnica</b>'), ('🗂️', 'Tienda · Mis cursos · Mis plantillas'), ('🆓', 'Los <b class="nar">Gratis</b> se abren de una vez')], lambda i: i)
  + telefono(pantalla('Panel', '', 'inicio') + capa(menu_mas('Panel Principal', 'Academia técnica'), 0)
             + capa(academia(0, toque(70, 116, 1) + toque(200, 116, 1, .4) + toque(330, 116, 1, .8)), 1) + toque(200, 470, 2))))

# 2
E.append(dict(frases=[
  'Paso dos: toca un curso, y verás sus clases y el material incluido.',
  'Muchos cursos traen una clase de muestra gratis: tócala y mira cómo se enseña antes de decidir.',
  'Las clases se ven en el celular, en la web y en la computadora, con el mismo PIN.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(2, 'Abre un <span class="nar">curso</span>', [
    ('📚', 'Clases y material incluido'), ('▶️', '<b class="nar">Clase de muestra gratis</b>'), ('📱', 'Celular, web y PC')], lambda i: i)
  + telefono(academia(0, toque(200, 260, 0)) + capa(hoja_abajo(curso, 610), 0, .6) + toque(110, 600, 1))))

# 3
E.append(dict(frases=[
  'Paso tres: tus créditos. Son la moneda de arriba, junto a la campana.',
  'Con ellos puedes canjear cursos y plantillas: toca Canjear créditos, revisa cuánto cuesta y cuánto te queda, y confirma.',
  'El curso pasa de inmediato a Mis cursos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(3, 'Canjea con <span class="nar">créditos</span>', [
    ('🪙', 'Tu saldo: la <b class="nar">moneda</b> de arriba'), ('🔁', '<b class="nar">Canjear créditos</b> → Confirmar'), ('🎓', 'Pasa a <b class="nar">Mis cursos</b>')], lambda i: i)
  + telefono(academia(0, toque(268, 68, 0)) + capa(hoja_abajo(curso, 610), 1) + toque(295, 600, 1, .4)
             + capa(hoja_abajo(canje, 330), 1, 1.2) + toque(200, 690, 1, 2.2) + capa(academia(1), 2))))

# 4
E.append(dict(frases=[
  'Paso cuatro: abre Mis plantillas. Ahí están las plantillas y archivos que tienes.',
  'Toca Usar plantilla y se abre en su apartado: por ejemplo, la nave parabólica se abre en Techos, lista para cambiar las medidas.',
  'Los archivos de Excel y Word los abres con un toque.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(4, 'Usa tus <span class="nar">plantillas</span>', [
    ('📂', '<b class="nar">Mis plantillas</b>'), ('🏗️', '<b class="nar">Usar plantilla</b>: se abre en su apartado'), ('📊', 'Excel y Word: <b class="nar">Abrir</b>')], lambda i: i)
  + telefono(academia(2, toque(330, 116, 0) + toque(200, 222, 1) + toque(200, 345, 2)))))

# 5
E.append(dict(frases=[
  'Paso cinco: cuando necesites más créditos, toca el botón verde junto a la moneda.',
  'En la aplicación de Android, las recargas se hacen con Google Play, de forma segura.',
  'Y recuerda: con cada recarga tus créditos no vencen.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(5, 'Recarga tus <span class="nar">créditos</span>', [
    ('➕', 'Botón <b class="nar">verde</b> junto a la moneda'), ('▶️', 'En Android: con <b class="nar">Google Play</b>'), ('⏳', 'Las recargas <b class="nar">no vencen</b>')], lambda i: i)
  + telefono(academia(1, toque(268, 68, 0, .3) + toque(292, 68, 0, 1.0)))))

# 6 · resumen de la serie
E.append(dict(frases=[
  ('Con estos seis tutoriales ya dominas InnovApp en el celular.', 'Con estos seis tutoriales ya dominas Innova Ap en el celular.'),
  'Entrar y moverte, clientes y proyectos, gastos, techos, carpintería metálica y la Academia.',
  'Si te queda una duda, entra a Ayuda y soporte. Y revisa la campana: ahí te avisamos de cada curso nuevo.',
], zoom=[(0, 1.0, 50, 50)],
  html=titulo('Ya dominas <span class="nar">InnovApp</span>', top=60) + lista([
    ('📱', 'Entrar y moverte'), ('👥', 'Clientes y proyectos'), ('📉', 'Materiales y gastos'),
    ('🏠', 'Techos'), ('🚪', 'Carpintería Metálica'), ('🎓', 'Academia y créditos')], lambda i: 1, top=165, izq=260, der=260, tam=26)))

E.append(dict(frases=[
  'Gracias por aprender con nosotros. Nos vemos en el próximo curso de la Academia.',
], html=final('Aprende <span class="nar">y cobra mejor</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'cel_06')
