"""Celular 1: conoce InnovApp en tu celular."""
from cel_comun import *
CURSO = 'USABILIDAD · INNOVAPP EN EL CELULAR'
E = []

def inicio(extra=''):
    k = lambda t, v, c: tarjeta(f'<div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase">{t}</div><div style="font-size:22px;font-weight:900;color:{c}">{v}</div>')
    cont = (titulo_seccion('Hola, Taller Ruiz 👋', 'Así va tu negocio este mes')
            + tarjeta('<div style="display:flex;align-items:center;gap:8px"><span>✨</span><b style="flex:1;font-size:14px">Novedades para ti</b><span style="background:#f97316;color:#fff;border-radius:11px;padding:2px 8px;font-size:11px;font-weight:900">2</span></div>'
                      '<div style="font-size:12px;color:#64748b;margin-top:4px">Clase nueva en Academia técnica</div>', '#fed7aa')
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + k('Tus Proyectos', '4', '#4f46e5') + k('Ingresos Cobrados', 'S/ 8 450', '#059669')
            + k('Gastos y Egresos', 'S/ 3 120', '#e11d48') + k('Balance (Liquidez)', 'S/ 5 330', '#0f172a') + '</div>')
    return barra_arriba('Panel', 'Innova Contratistas · Taller Ruiz') + chips_grupo(['Panel', 'Reporte del mes'], 'Panel') + contenido(cont, top=152) + barra_abajo('inicio') + fab('Nuevo proyecto') + extra

# 0 · gancho
E.append(dict(antes=.5, frases=[
  ('Tu taller, en el bolsillo. En este tutorial aprendes a moverte en InnovApp desde el celular.', 'Tu taller, en el bolsillo. En este tutorial aprendes a moverte en Innova Ap desde el celular.'),
  'Cómo entrar, para qué sirve cada botón y dónde está cada apartado. Al final te vas a mover tan rápido como en WhatsApp.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=portada('InnovApp', 'en tu celular', 1) + telefono(inicio())))

# 1 · entrar
E.append(dict(frases=[
  'Paso uno: abre la aplicación. Lo primero que ves es la pantalla de acceso.',
  ('Escribe tu clave PIN de seis dígitos, la que te entregó el administrador, y toca Ingresar.', 'Escribe tu clave PIN de seis dígitos, la que te entregó el administrador, y toca: Ingresar.'),
  'Es la misma clave en el celular, en la página web y en el programa de la computadora. Tus datos son los mismos en todos lados.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(1, 'Entra con tu <span class="nar">clave PIN</span>', [
    ('🔑', 'Clave de <b class="nar">6 dígitos</b>'), ('👆', 'Toca <b class="nar">Ingresar</b>'), ('☁️', 'Misma clave en <b class="nar">celular, web y PC</b>')], lambda i: i)
  + telefono(login() + capa(login('482915'), 1) + toque(200, 510, 1, 1.2))))

# 2 · el panel
E.append(dict(frases=[
  'Entras al Panel Principal. Arriba ves las novedades: clases y recursos nuevos de la Academia.',
  'Abajo, el resumen del mes: tus proyectos, lo que cobraste, lo que gastaste y el balance.',
  'Toca cualquiera de estos cuadros y te lleva directo al detalle.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(2, 'El <span class="nar">Panel Principal</span>', [
    ('✨', '<b class="nar">Novedades</b> de la Academia'), ('📊', 'Cobrado, gastado y <b class="nar">balance</b>'), ('👆', 'Toca un cuadro para ver el detalle')], lambda i: i)
  + telefono(inicio(toque(110, 330, 2)))))

# 3 · barra de arriba
E.append(dict(frases=[
  'Paso tres: la barra de arriba. A la izquierda, el nombre del apartado donde estás.',
  'La moneda con el número son tus créditos para las funciones inteligentes. El botón verde con el signo más es para recargar.',
  'La campana guarda tus avisos, aunque borres la notificación del celular. Y el engranaje abre la Configuración.',
], zoom=[(0, 1.0, 50, 50), (0, 1.02, 55, 50)],
  html=lado(3, 'La barra de <span class="nar">arriba</span>', [
    ('📍', 'Dónde estás'), ('🪙', 'Tus <b class="nar">créditos</b> y el botón para recargar'), ('🔔', 'La <b class="nar">campana</b> de avisos · ⚙️ Configuración')], lambda i: i)
  + telefono(inicio(toque(90, 68, 0, .3) + toque(268, 68, 1) + toque(318, 68, 2) + toque(360, 68, 2, 1.2)))))

# 4 · barra de abajo
E.append(dict(frases=[
  'Paso cuatro: la barra de abajo. Son tus atajos de todos los días.',
  'Inicio, Proyectos, Techos y Gastos. El que está pintado es donde estás ahora.',
  ('Y en Más encuentras todo lo demás: Carpintería Metálica, Obra Civil, Drywall, la Academia y mucho más.', 'Y en Más encuentras todo lo demás: Carpintería Metálica, Obra Civil, Drai-uol, la Academia y mucho más.'),
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(4, 'La barra de <span class="nar">abajo</span>', [
    ('🏠', 'Inicio · Proyectos · Techos · Gastos'), ('🟣', 'El pintado es <b class="nar">donde estás</b>'), ('☰', '<b class="nar">Más</b>: todos los apartados')], lambda i: i)
  + telefono(inicio(toque(X_BARRA['proyectos'], 800, 1) + toque(X_BARRA['mas'], 800, 2)))))

# 5 · menú Más
E.append(dict(frases=[
  'Al tocar Más se abre el menú completo, ordenado por secciones.',
  ('Mis obras: proyectos, clientes, gastos y contratos. Diseño y presupuesto: techos, obra civil, drywall, carpintería metálica, melamina, gasfitería y electricidad.', 'Mis obras: proyectos, clientes, gastos y contratos. Diseño y presupuesto: techos, obra civil, drai-uol, carpintería metálica, melamina, gasfitería y electricidad.'),
  'Más abajo, la Academia técnica, Ayuda y soporte y la Configuración. Toca fuera del menú para cerrarlo.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(5, 'El menú <span class="nar">Más</span>', [
    ('🗂️', '<b class="nar">Mis obras</b>'), ('📐', '<b class="nar">Diseño y presupuesto</b>'), ('🎓', 'Academia · Ayuda · Configuración')], lambda i: i)
  + telefono(inicio(capa(menu_mas(), 0)))))

# 6 · botón flotante
E.append(dict(frases=[
  'Paso seis: el botón naranja de abajo a la derecha. Cambia según la pantalla.',
  'En el Panel dice Nuevo proyecto; en Gastos, Nuevo material; en la carpeta de clientes, Registrar cliente.',
  'Tócalo y te lleva directo al formulario para crear lo que necesitas, sin buscar.',
], zoom=[(0, 1.0, 50, 50), (0, 1.02, 55, 50)],
  html=lado(6, 'El botón <span class="nar">naranja</span>', [
    ('➕', 'Cambia según la pantalla'), ('📝', 'Nuevo proyecto · Nuevo material · Registrar cliente'), ('⚡', 'Te lleva <b class="nar">directo al formulario</b>')], lambda i: i)
  + telefono(inicio(toque(310, 724, 0, 1.0)))))

# 7 · pestañas
proy = (titulo_seccion('Proyectos & Clientes', 'Gestión centralizada de obras, cotizaciones y directorio de clientes.')
        + pestanas(['💼 Proyectos (4)', '👥 Clientes (6)'], 0)
        + tarjeta('<b>Techo Aluzinc 120 m²</b><div style="font-size:12px;color:#64748b">Sr. Carlos Mendoza · En Progreso</div>')
        + tarjeta('<b>Portón corredizo 3.90 m</b><div style="font-size:12px;color:#64748b">Sra. Rosa Huamán · Pendiente</div>'))
E.append(dict(frases=[
  'Muchos apartados tienen partes: arriba aparecen como botones redondos, por ejemplo Proyectos, Personal y Carpeta. Y dentro, pestañas con una raya de color debajo de la que está abierta.',
  'Por ejemplo, en Proyectos y Clientes tocas Clientes para ver tu directorio, y Proyectos para volver a tus obras.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(7, 'Las <span class="nar">pestañas</span>', [
    ('〰️', 'La raya marca la pestaña abierta'), ('👥', 'Proyectos ↔ Clientes')], lambda i: i)
  + telefono(pantalla('Proyectos', proy, 'proyectos', ['Proyectos', 'Personal', 'Carpeta'], 'Proyectos', extra=toque(300, 252, 1)))))

# 8 · campana
avisos = ('<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><b style="flex:1;font-size:15px">Avisos · 2 sin leer</b><span style="color:#64748b">✕</span></div>'
          + tarjeta('<b style="font-size:13px">🎓 Clase nueva</b><div style="font-size:12px;color:#64748b">Instalar InnovApp en tu iPhone o iPad</div>', '#c7d2fe', '#eef2ff')
          + tarjeta('<b style="font-size:13px">📢 Comunicado</b><div style="font-size:12px;color:#64748b">Nuevas plantillas en Recursos Técnicos</div>', '#c7d2fe', '#eef2ff')
          + tarjeta('<b style="font-size:13px">💬 Ayuda y soporte</b><div style="font-size:12px;color:#64748b">Te respondimos tu consulta</div>'))
E.append(dict(frases=[
  'Paso ocho: la campana. Ahí quedan guardados tus avisos: clases nuevas, comunicados y las respuestas de soporte.',
  'Toca un aviso y te lleva a lo que avisa. Con los botones de arriba los marcas como leídos o los borras.',
], zoom=[(0, 1.0, 50, 50), (0, 1.02, 55, 50)],
  html=lado(8, 'La <span class="nar">campana</span>', [
    ('🔔', 'Clases, comunicados y soporte'), ('👆', 'Toca un aviso para ir a él')], lambda i: i)
  + telefono(inicio(capa('<div style="position:absolute;inset:0;background:rgba(15,23,42,.4)"></div><div style="position:absolute;top:104px;left:10px;right:10px;background:#fff;border-radius:18px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.25)">' + avisos + '</div>', 0)))))

# 9 · configuración
conf = (titulo_seccion('Configuración') + tarjeta('<b>🖼️ Logo de la Empresa</b><div style="font-size:12px;color:#64748b;margin:4px 0 8px">Sale en tus presupuestos y PDF</div>' + boton('Subir logo', '#0f172a'))
        + tarjeta('<b>🏢 Datos de la Empresa / Contratista</b>' + campo('Nombre', 'Taller Metálico Ruiz') + campo('Teléfono', '987 654 321'))
        + tarjeta('<b>🏦 Datos Bancarios y Métodos de Cobro</b><div style="font-size:12px;color:#64748b">Tus cuentas para cobrar a tus clientes</div>'))
E.append(dict(frases=[
  'Paso nueve: entra a la Configuración con el engranaje. Hazlo una sola vez, al empezar.',
  'Sube el logo de tu empresa y llena tus datos: nombre, teléfono y dirección. Así salen en todos tus presupuestos y documentos en PDF.',
  'También puedes poner las cuentas donde tus clientes te pagan.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(9, 'Pon tu <span class="nar">logo y tus datos</span>', [
    ('🖼️', '<b class="nar">Logo de la Empresa</b>'), ('🏢', 'Nombre, teléfono y dirección'), ('🏦', 'Cuentas para cobrar a tus clientes')], lambda i: i)
  + telefono(barra_arriba('Configuración') + contenido(conf) + barra_abajo('mas') + toque(200, 222, 1))))

# 10 · preguntas
E.append(dict(frases=[
  'Tres consejos rápidos.',
  'Si un apartado no aparece en tu barra de abajo, búscalo en Más.',
  ('Cuando la aplicación te avise que hay una versión nueva, actualízala desde Google Play: así tienes las últimas mejoras.', 'Cuando la aplicación te avise que hay una versión nueva, actualízala desde Google Play: así tienes las últimas mejoras.'),
  'Y si tienes una duda, entra a Ayuda y soporte: el asistente te responde al instante, o te atiende una persona.',
], zoom=[(0, 1.0, 50, 50)],
  html=titulo('Tres <span class="nar">consejos</span>', top=90) + lista([
    ('☰', '¿No ves un apartado? Búscalo en <b class="nar">Más</b>'), ('🔄', 'Actualiza la app cuando te avise'),
    ('🎧', 'Dudas: <b class="nar">Ayuda y soporte</b>')], lambda i: i + 1, top=270, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  ('Listo: ya sabes moverte en InnovApp desde el celular. En el siguiente tutorial creamos un cliente y su proyecto.', 'Listo: ya sabes moverte en Innova Ap desde el celular. En el siguiente tutorial creamos un cliente y su proyecto.'),
], html=final('Tu taller <span class="nar">en el bolsillo</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'cel_01')
