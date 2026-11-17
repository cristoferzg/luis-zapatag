"""Celular 3: materiales y gastos de la obra, y cuánto ganaste."""
from cel_comun import *
CURSO = 'USABILIDAD · INNOVAPP EN EL CELULAR'
E = []
gris = lambda t: f'<div style="font-size:12px;color:#64748b">{t}</div>'
ENC = titulo_seccion('Materiales & Gastos', 'Lo que compras para cada obra y tus gastos del día.')

def mat(nombre='', cant='', precio='', foco=None, filas=(), aviso=False):
    f = (ENC + pestanas(['📦 Materiales', '📉 Gastos'], 0) + campo('Proyecto', 'Techo Aluzinc 120 m²', select=True)
         + tarjeta('<b style="font-size:14px">Añadir Material a "Techo Aluzinc 120 m²"</b>'
                   + campo('Nombre del Material o Perfil', nombre, 'Escribe o elige del Catálogo de precios (ej. Tubo 2x2)', foco == 0)
                   + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + campo('Cantidad', cant, 'Ej. 1', foco == 1) + campo('Precio Unit. (S/)', precio, 'Ej. 0.00', foco == 2) + '</div>'
                   + ('<div style="font-size:11px;font-weight:800;color:#92400e;background:#fffbeb;border-radius:10px;padding:7px 9px;margin-bottom:8px">☑ Actualizar el precio en el Catálogo de precios</div>' if aviso else '')
                   + boton('Añadir Material')))
    if filas:
        f += tarjeta(''.join(f'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span>{n}</span><b>{t}</b></div>' for n, t in filas)
                     + '<div style="border-top:1px solid #e2e8f0;margin-top:6px;padding-top:6px;display:flex;justify-content:space-between;font-size:13px"><b>Total Materiales Directos</b><b style="color:#4f46e5">S/ 1 642</b></div>')
    return f

def gasto(desc='', cat='', monto='', foco=None, lista=False):
    f = (ENC + pestanas(['📦 Materiales', '📉 Gastos'], 1)
         + tarjeta(campo('Descripción', desc, 'Detalle del gasto...', foco == 0) + campo('Proyecto Asociado', 'Techo Aluzinc 120 m²', select=True)
                   + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + campo('Categoría', cat, 'Seleccionar...', foco == 1, select=True) + campo('Monto', monto, '0.00', foco == 2) + '</div>'
                   + boton('Agregar Gasto', '#e11d48')))
    if lista:
        f += tarjeta(''.join(f'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span>{d}<br><span style="color:#64748b;font-size:11px">{c}</span></span><b style="color:#e11d48">{m}</b></div>'
                             for d, c, m in [('Flete de tubos a obra', 'Transporte · Techo Aluzinc', 'S/ 80'), ('Pago soldador (2 días)', 'Personal · Techo Aluzinc', 'S/ 240')]))
    return f

P = lambda html, extra='': pantalla('Gastos', html, 'gastos', fab_txt='Nuevo material', extra=extra)
FILAS = [('Tubo LAC 2"×2"×2 mm · 18 barras', 'S/ 1 152'), ('Correa 2"×1"×1.5 mm · 14', 'S/ 490')]

# 0
E.append(dict(antes=.5, frases=[
  '¿Cuánto ganaste de verdad en esa obra? Solo lo sabes si anotas todo lo que gastas.',
  'En este tutorial registras los materiales y los gastos desde el celular, y ves tu ganancia real del mes.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=portada('Materiales', 'y gastos', 3) + telefono(P(mat(filas=FILAS)))))

# 1
E.append(dict(frases=[
  'Paso uno: en la barra de abajo toca Gastos.',
  'Ahí tienes dos pestañas. Materiales: lo que compras para una obra. Y Gastos: lo del día a día, como fletes, viáticos o pagos al personal.',
  'Arriba eliges el proyecto. Todo lo que anotes se suma a esa obra.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(1, 'Entra a <span class="nar">Gastos</span>', [
    ('📉', 'Barra de abajo → <b class="nar">Gastos</b>'), ('📦', '<b class="nar">Materiales</b> y <b class="nar">Gastos</b>'), ('🏗️', 'Elige el <b class="nar">proyecto</b>')], lambda i: i)
  + telefono(P(mat(), toque(X_BARRA['gastos'], 800, 0) + toque(110, 200, 1) + toque(290, 200, 1, .5) + toque(200, 262, 2)))))

# 2
E.append(dict(frases=[
  'Paso dos: anota un material. Escribe el nombre y la aplicación te sugiere los del Catálogo de precios, por ejemplo: tubo de dos por dos.',
  'Pon la cantidad y el precio por unidad. Si cambias el precio, puedes marcar la casilla para actualizarlo también en el catálogo.',
  'Toca Añadir Material. Abajo se arma la lista con el total de materiales de la obra.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(2, 'Anota los <span class="nar">materiales</span>', [
    ('🔎', 'Elige del <b class="nar">Catálogo de precios</b>'), ('🔢', 'Cantidad y <b class="nar">precio</b>'), ('🧾', 'Lista con el <b class="nar">total</b>')], lambda i: i)
  + telefono(P(mat('Tubo LAC 2"×2"×2 mm', foco=0))
             + capa(P(mat('Tubo LAC 2"×2"×2 mm', '18', '64.00', foco=2, aviso=True)), 1)
             + capa(P(mat(filas=FILAS)), 2))))

# 3
E.append(dict(frases=[
  'Paso tres: abre la pestaña Gastos.',
  'Escribe qué pagaste, por ejemplo: flete de tubos a la obra. Elige el proyecto y la categoría: material, personal, transporte u otro.',
  'Pon el monto y toca Agregar Gasto. Si el gasto no es de una obra, elige General, sin proyecto.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(3, 'Anota los <span class="nar">gastos</span>', [
    ('📉', 'Pestaña <b class="nar">Gastos</b>'), ('🏷️', 'Proyecto y <b class="nar">categoría</b>'), ('➕', 'Toca <b class="nar">Agregar Gasto</b>')], lambda i: i)
  + telefono(P(mat(), toque(290, 200, 0))
             + capa(P(gasto('Flete de tubos a obra', 'Transporte', foco=1)), 1)
             + capa(P(gasto(lista=True)), 2))))

# 4 · proyecto actualizado
tp = tarjeta('<b style="font-size:16px">Techo Aluzinc 120 m²</b>' + gris('Sr. Carlos Mendoza')
             + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;font-size:12px">'
             + '<div style="background:#f8fafc;border-radius:10px;padding:6px 8px">Presupuesto<br><b style="font-size:15px">S/ 4 800</b></div>'
             + '<div style="background:#fff1f2;border-radius:10px;padding:6px 8px">Costo (Mat+Per+Gast)<br><b style="font-size:15px;color:#e11d48">S/ 1 962</b></div>'
             + '<div style="background:#ecfdf5;border-radius:10px;padding:6px 8px;grid-column:span 2">Margen (Utilidad)<br><b style="font-size:18px;color:#059669">S/ 2 838</b></div></div>'
             )
E.append(dict(frases=[
  'Paso cuatro: vuelve a tu proyecto. La tarjeta suma el costo: materiales, personal y gastos. Y te muestra el margen, o sea tu utilidad.',
  'Así sabes, en plena obra, cuánto te va quedando. Si el costo se acerca al presupuesto, es momento de revisar.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(4, 'Mira tu <span class="nar">margen</span>', [
    ('➖', '<b class="nar">Costo</b> y <b class="nar">margen</b>'), ('⚠️', 'Revisa a tiempo')], lambda i: i)
  + telefono(pantalla('Proyectos', titulo_seccion('Proyectos & Clientes') + pestanas(['💼 Proyectos (4)', '👥 Clientes (6)'], 0) + tp,
                      'proyectos', ['Proyectos', 'Personal', 'Carpeta'], 'Proyectos', extra=toque(200, 400, 1)))))

# 5 · reporte del mes
barras = ''.join(f'<div style="flex:1;display:flex;gap:3px;align-items:flex-end;height:90px"><div style="flex:1;background:#10b981;height:{a}%;border-radius:4px 4px 0 0"></div><div style="flex:1;background:#f43f5e;height:{b}%;border-radius:4px 4px 0 0"></div></div>'
                 for a, b in [(40, 30), (55, 35), (35, 30), (70, 40), (60, 45), (85, 37)])
rep = (titulo_seccion('Reporte del mes', 'Cotizado, ganado, cobrado, gastado y tu utilidad real.')
       + tarjeta('<div style="font-size:11px;font-weight:800;color:#64748b">UTILIDAD REAL</div><div style="font-size:30px;font-weight:900;color:#059669">S/ 5 330</div>'
                 + '<div style="display:flex;gap:14px;font-size:12px"><span>Cobrado <b style="color:#059669">S/ 8 450</b></span><span>Gastado <b style="color:#e11d48">S/ 3 120</b></span></div>', '#a7f3d0', '#ecfdf5')
       + tarjeta('<div style="font-size:12px;font-weight:800;margin-bottom:6px">Últimos 6 meses</div><div style="display:flex;gap:8px">' + barras + '</div>')
       + tarjeta('<div style="font-size:12px;font-weight:800;margin-bottom:6px">¿En qué se gastó?</div>'
                 + ''.join(f'<div style="display:flex;justify-content:space-between;font-size:12px"><span>{n}</span><b>{v}</b></div>' for n, v in [('Material', 'S/ 1 960'), ('Personal', 'S/ 840'), ('Transporte', 'S/ 320')])))
E.append(dict(frases=[
  'Paso cinco: el Reporte del mes. Toca Inicio, y arriba el botón Reporte del mes.',
  'Ves tu utilidad real: lo que cobraste menos lo que gastaste. Y una gráfica de los últimos seis meses.',
  'Y abajo ves en qué se fue tu dinero: material, personal o transporte.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(5, 'Tu <span class="nar">Reporte del mes</span>', [
    ('📊', 'Inicio → <b class="nar">Reporte del mes</b>'), ('💚', 'Tu <b class="nar">utilidad real</b>'), ('🧮', '¿En qué se gastó?')], lambda i: i)
  + telefono(pantalla('Panel', rep, 'inicio', ['Panel', 'Reporte del mes'], 'Reporte del mes', extra=toque(140, 124, 0) + toque(120, 240, 1) + toque(200, 590, 2)))))

# 6 · consejos
E.append(dict(frases=[
  'Tres consejos.',
  'Anota el gasto en el momento, con el celular: al final de la semana ya no te acuerdas.',
  'Guarda la boleta y escribe en la descripción su número. Y usa General para lo que no es de una obra, como la gasolina de la camioneta.',
], zoom=[(0, 1.0, 50, 50)],
  html=titulo('Tres <span class="nar">consejos</span>', top=90) + lista([
    ('⏱️', 'Anota <b class="nar">en el momento</b>'), ('🧾', 'Número de <b class="nar">boleta</b> en la descripción'),
    ('🚚', '<b class="nar">General</b>: lo que no es de una obra')], lambda i: i if i < 2 else 2, top=270, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Listo: ya sabes cuánto ganas en cada obra. En el siguiente tutorial cotizas un techo metálico desde el celular, en plena obra.',
], html=final('Cada sol <span class="nar">en su lugar</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'cel_03')
