"""Celular 2: tu primer cliente y su proyecto (cobros, avance y carpeta)."""
from cel_comun import *
CURSO = 'USABILIDAD · INNOVAPP EN EL CELULAR'
E = []
GRUPO = ['Proyectos', 'Personal', 'Carpeta']
gris = lambda t: f'<div style="font-size:12px;color:#64748b">{t}</div>'

def clientes(nombre='', dni='', tel='', foco=None, lista=False):
    f = (titulo_seccion('Proyectos & Clientes', 'Gestión centralizada de obras, cotizaciones y directorio de clientes.')
         + pestanas(['💼 Proyectos (3)', '👥 Clientes (5)' if not lista else '👥 Clientes (6)'], 1)
         + tarjeta('<b style="font-size:15px">Nuevo Cliente</b>'
                   + campo('Nombre / Razón Social *', nombre, 'Ej: Juan Pérez o Empresa SAC', foco == 0)
                   + campo('DNI / RUC', dni, '', foco == 1) + campo('Teléfono', tel, 'Ej: 987654321', foco == 2)
                   + campo('Dirección', '', 'Dirección física') + boton('Guardar Cliente')))
    if lista:
        f += tarjeta('<b>Sr. Carlos Mendoza</b>' + gris('DNI 45879632 · 987 654 321'), '#a5b4fc', '#eef2ff')
    return f

def form_proyecto(nombre='', cliente='', pres='', plazo='', foco=None):
    return tarjeta(campo('Nombre', nombre, 'Ej. Techo Aluzinc 120m2', foco == 0)
                   + campo('Cliente', cliente, 'Seleccione...', foco == 1, select=True)
                   + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + campo('Presupuesto (S/)', pres, '0.00', foco == 2)
                   + campo('Estado', 'Pendiente', select=True) + '</div>'
                   + campo('Plazo (Aprox)', plazo, 'Ej: 15 días', foco == 3) + boton('＋ Agregar', '#1e293b'))

def tarjeta_proyecto(cobrado='S/ 0', por='S/ 4 800', avance=None, resaltar=None):
    b = lambda t, i: (f'<span style="flex:1;text-align:center;padding:8px 0;border-radius:10px;font-size:12px;font-weight:800;'
                      f'{"background:#4f46e5;color:#fff" if resaltar == i else "background:#f1f5f9;color:#334155"}">{t}</span>')
    av = ('<div style="margin-top:8px;font-size:11px;font-weight:800;color:#065f46;display:flex;justify-content:space-between"><span>Avance de obra · 2 partes</span><span>%s</span></div>'
          '<div style="height:7px;border-radius:4px;background:#d1fae5;margin-top:3px"><div style="height:7px;border-radius:4px;background:#10b981;width:%s"></div></div>' % (avance, avance)) if avance else ''
    return tarjeta('<div style="display:flex;justify-content:space-between"><b style="font-size:16px">Techo Aluzinc 120 m²</b><span style="font-size:11px;font-weight:800;background:#fef3c7;color:#92400e;border-radius:8px;padding:2px 8px">Pendiente</span></div>'
                   + gris('Sr. Carlos Mendoza · Plazo 15 días')
                   + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;font-size:12px">'
                   + f'<div style="background:#f8fafc;border-radius:10px;padding:6px 8px">Presupuesto<br><b style="font-size:15px">S/ 4 800</b></div>'
                   + f'<div style="background:#ecfdf5;border-radius:10px;padding:6px 8px">Cobrado<br><b style="font-size:15px;color:#059669">{cobrado}</b></div>'
                   + f'<div style="background:#fff1f2;border-radius:10px;padding:6px 8px;grid-column:span 2">Por Cobrar<br><b style="font-size:15px;color:#e11d48">{por}</b></div></div>'
                   + av + f'<div style="display:flex;gap:6px;margin-top:10px">{b("Cobros", 0)}{b("Avance", 1)}{b("Especificaciones", 2)}</div>')

def proyectos(cont, extra=''):
    return pantalla('Proyectos', titulo_seccion('Proyectos & Clientes') + pestanas(['💼 Proyectos (4)', '👥 Clientes (6)'], 0) + cont,
                    'proyectos', GRUPO, 'Proyectos', extra=extra)

# 0 · gancho
E.append(dict(antes=.5, frases=[
  'Un cliente, una obra y todo lo que cobras, en un solo lugar del celular.',
  'En este tutorial registras a tu cliente, creas su proyecto, anotas un adelanto y guardas las fotos del avance.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=portada('Tu cliente', 'y su proyecto', 2) + telefono(proyectos(tarjeta_proyecto('S/ 2 000', 'S/ 2 800', '40%')))))

# 1 · llegar
E.append(dict(frases=[
  'Paso uno: en la barra de abajo toca Proyectos.',
  'Arriba ves tres botones: Proyectos, Personal y Carpeta. Quédate en Proyectos.',
  'Y debajo, dos pestañas: Proyectos y Clientes. Empezamos por el cliente: toca Clientes.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(1, 'Entra a <span class="nar">Proyectos</span>', [
    ('🏗️', 'Barra de abajo → <b class="nar">Proyectos</b>'), ('🔘', 'Proyectos · Personal · Carpeta'), ('👥', 'Pestaña <b class="nar">Clientes</b>')], lambda i: i)
  + telefono(proyectos(tarjeta_proyecto(), toque(X_BARRA['proyectos'], 800, 0) + toque(70, 124, 1) + toque(290, 252, 2)))))

# 2 · cliente
E.append(dict(frases=[
  'Paso dos: llena el cliente. El nombre es lo único obligatorio.',
  'Agrega su DNI o RUC y su teléfono: así luego le mandas la propuesta por WhatsApp con un toque.',
  'Toca Guardar Cliente. Ya aparece en tu directorio.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(2, 'Registra al <span class="nar">cliente</span>', [
    ('✍️', '<b class="nar">Nombre</b> (obligatorio)'), ('📞', 'DNI / RUC y <b class="nar">teléfono</b>'), ('💾', 'Toca <b class="nar">Guardar Cliente</b>')], lambda i: i)
  + telefono(pantalla('Proyectos', clientes('Sr. Carlos Mendoza', foco=0), 'proyectos', GRUPO, 'Proyectos')
             + capa(pantalla('Proyectos', clientes('Sr. Carlos Mendoza', '45879632', '987 654 321', foco=2), 'proyectos', GRUPO, 'Proyectos'), 1)
             + capa(pantalla('Proyectos', clientes(lista=True), 'proyectos', GRUPO, 'Proyectos'), 2) + toque(200, 590, 2, -.4))))

# 3 · proyecto
E.append(dict(frases=[
  'Paso tres: vuelve a la pestaña Proyectos y llena el formulario de arriba.',
  'Ponle un nombre que reconozcas, por ejemplo: Techo Aluzinc ciento veinte metros cuadrados. Elige al cliente de la lista.',
  'Escribe el presupuesto que acordaste y el plazo aproximado. Al inicio, el estado queda en Pendiente.',
  'Toca Agregar, y tu proyecto aparece abajo como una tarjeta.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(3, 'Crea el <span class="nar">proyecto</span>', [
    ('🏷️', '<b class="nar">Nombre</b> de la obra'), ('👤', 'Elige el <b class="nar">cliente</b>'), ('💰', 'Presupuesto y <b class="nar">plazo</b>'), ('➕', 'Toca <b class="nar">Agregar</b>')], lambda i: i)
  + telefono(proyectos(form_proyecto('Techo Aluzinc 120 m²', foco=0))
             + capa(proyectos(form_proyecto('Techo Aluzinc 120 m²', 'Sr. Carlos Mendoza', foco=1)), 1)
             + capa(proyectos(form_proyecto('Techo Aluzinc 120 m²', 'Sr. Carlos Mendoza', '4 800', '15 días', foco=2)), 2)
             + capa(proyectos(tarjeta_proyecto()), 3))))

# 4 · la tarjeta
E.append(dict(frases=[
  'Paso cuatro: lee la tarjeta del proyecto.',
  'Presupuesto es lo pactado; Cobrado, lo que ya te pagaron; y Por Cobrar, lo que aún te deben. Se calcula solo.',
  'Abajo tienes tres botones: Cobros, Avance y Especificaciones. Vamos uno por uno.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(4, 'La <span class="nar">tarjeta</span> del proyecto', [
    ('📋', 'Presupuesto pactado'), ('💵', '<b class="nar">Cobrado</b> y <b class="nar">Por Cobrar</b>'), ('🔘', 'Cobros · Avance · Especificaciones')], lambda i: i)
  + telefono(proyectos(tarjeta_proyecto(), toque(110, 380, 1) + toque(200, 470, 2)))))

# 5 · cobros
cobro = ('<b style="font-size:16px">Registrar Adelanto / Pago</b>' + campo('Monto', '2 000', 'Ej: 500', True)
         + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + campo('Fecha', '16/11/2026') + campo('Método', 'Transferencia', select=True) + '</div>'
         + boton('Guardar Adelanto', '#059669') + '<div style="font-size:12px;font-weight:800;color:#475569;margin:14px 0 6px">HISTORIAL DE COBROS</div>'
         + tarjeta('<div style="display:flex;justify-content:space-between"><span>16/11 · Transferencia</span><b style="color:#059669">S/ 2 000</b></div>'))
E.append(dict(frases=[
  'Paso cinco: toca el botón Cobros cada vez que el cliente te pague.',
  'Escribe el monto, la fecha y cómo te pagó: transferencia, efectivo, cheque o tarjeta. Toca Guardar Adelanto.',
  'Queda en el historial, y la tarjeta se actualiza: ahora te deben dos mil ochocientos soles.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(5, 'Anota cada <span class="nar">cobro</span>', [
    ('💵', 'Toca <b class="nar">Cobros</b>'), ('✍️', 'Monto, fecha y método'), ('📉', '<b class="nar">Por Cobrar</b> baja solo')], lambda i: i)
  + telefono(proyectos(tarjeta_proyecto(resaltar=0), toque(80, 470, 0)) + capa(hoja_abajo(cobro, 520), 1)
             + capa(proyectos(tarjeta_proyecto('S/ 2 000', 'S/ 2 800')), 2))))

# 6 · avance
parte = ('<div style="background:#064e3b;color:#fff;border-radius:16px;padding:12px;margin:-4px 0 10px"><div style="font-size:10px;font-weight:900;color:#6ee7b7;letter-spacing:.1em">AVANCE DE OBRA</div>'
         '<b style="font-size:16px">Techo Aluzinc 120 m²</b><div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px"><span>avance total</span><b>40%</b></div>'
         '<div style="height:7px;border-radius:4px;background:#065f46;margin-top:3px"><div style="height:7px;border-radius:4px;background:#34d399;width:40%"></div></div></div>'
         + pestanas(['📈 Avance', '📋 Parte diario', '📄 Informe'], 1)
         + '<div style="font-size:12px;font-weight:800;color:#475569;margin-bottom:6px">¿Hasta qué % avanzó cada partida hoy?</div>'
         + ''.join(f'<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>{n}</span><b>{p}</b></div>' for n, p in [('Columnas y vigas', '100%'), ('Tijerales', '60%'), ('Cobertura', '0%')])
         + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0">' + boton('Cámara', '#0f172a', icono='camara') + boton('Galería', '#e2e8f0', '#0f172a') + '</div>'
         + '<div style="display:flex;gap:6px">' + ''.join(f'<div style="flex:1;height:64px;border-radius:10px;background:linear-gradient(135deg,{a},{b})"></div>' for a, b in [('#94a3b8', '#475569'), ('#a8a29e', '#57534e'), ('#93c5fd', '#64748b')]) + '</div>')
E.append(dict(frases=[
  'Paso seis: toca el botón Avance para llevar la obra con fotos.',
  'En Parte diario pones hasta qué porcentaje avanzó cada partida hoy, por ejemplo: tijerales, sesenta por ciento.',
  'Toca Cámara y toma las fotos ahí mismo, o elígelas de la Galería. Se guardan aunque tengas poca señal.',
  'En Informe se arma solo el reporte con fotos, listo para mandarlo por WhatsApp a tu cliente.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(6, '<span class="nar">Avance</span> con fotos', [
    ('📈', 'Toca <b class="nar">Avance</b>'), ('📋', '<b class="nar">Parte diario</b>: % por partida'), ('📷', '<b class="nar">Cámara</b> o Galería'), ('📄', '<b class="nar">Informe</b> por WhatsApp')], lambda i: i)
  + telefono(proyectos(tarjeta_proyecto('S/ 2 000', 'S/ 2 800', resaltar=1), toque(200, 470, 0)) + capa(hoja_abajo(parte, 700), 1)
             + toque(110, 560, 2) + toque(340, 284, 3))))

# 7 · especificaciones
esp = ('<b style="font-size:16px">Especificaciones Técnicas / Detalles</b>' + gris('Estos detalles se incluirán automáticamente en el contrato.')
       + '<div style="margin:10px 0;height:150px;border-radius:12px;border:2px solid #4f46e5;padding:10px;font-size:14px;line-height:1.45">Cobertura aluzinc TR4 de 0.40 mm, color azul. Tijerales de tubo 2"×2"×2 mm. Pintura anticorrosiva y esmalte. Incluye canaletas.</div>'
       + boton('Guardar Especificaciones'))
E.append(dict(frases=[
  'Paso siete: en Especificaciones escribes lo que acordaste: materiales, espesores, colores y acabados.',
  'Ese texto pasa solo al contrato que haces en Contratos y EPP. Así no hay discusiones al final de la obra.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(7, '<span class="nar">Especificaciones</span>', [
    ('🧾', 'Materiales, espesores y acabados'), ('📑', 'Pasan solas al <b class="nar">contrato</b>')], lambda i: i)
  + telefono(proyectos(tarjeta_proyecto('S/ 2 000', 'S/ 2 800', '40%', resaltar=2)) + capa(hoja_abajo(esp, 440), 0))))

# 8 · carpeta (diseño del 17/11: lista con conteos + interior con ficha, una fila para agregar y pestañas)
def conteo(ic, n):
    return f'<span style="display:inline-flex;gap:3px;align-items:center;font-size:11px;font-weight:800;border-radius:7px;padding:2px 6px;{"background:#f1f5f9;color:#334155" if n else "color:#cbd5e1"}">{ic} {n}</span>'
def tarjeta_carpeta(nombre, c, cobro, color, av):
    return tarjeta(f'<div style="display:flex;gap:10px;align-items:center"><span style="font-size:28px">📁</span><div style="flex:1"><b>{nombre}</b>'
                   f'<div style="display:flex;gap:4px;margin-top:4px">{conteo("📄", c[0])}{conteo("🖼️", c[1])}{conteo("📐", c[2])}{conteo("📝", c[3])}</div></div>'
                   f'<b style="font-size:12px;color:{color}">{cobro}</b></div>'
                   f'<div style="height:5px;border-radius:3px;background:#e2e8f0;margin-top:8px"><div style="height:5px;border-radius:3px;background:#10b981;width:{av}"></div></div>')
lista_carp = (titulo_seccion('Carpetas de clientes', 'Una carpeta por cliente con sus documentos, fotos, planos y notas. Solo tú la ves.')
              + '<div style="height:42px;border-radius:12px;border:1px solid #cbd5e1;background:#fff;display:flex;align-items:center;padding:0 12px;color:#94a3b8;font-size:14px;margin-bottom:10px">🔍 Buscar cliente, DNI o plano…</div>'
              + tarjeta_carpeta('Sr. Carlos Mendoza', (1, 3, 1, 1), 'Por cobrar S/ 2 800', '#e11d48', '42%')
              + tarjeta_carpeta('Sra. Rosa Huamán', (2, 0, 0, 0), 'Pagado ✓', '#059669', '100%'))
peq = lambda t, sel: f'<span style="padding:6px 10px;font-size:12px;font-weight:800;{"color:#4f46e5;border-bottom:3px solid #4f46e5" if sel else "color:#64748b"}">{t}</span>'
dentro = ('<div style="font-size:12px;font-weight:800;color:#4f46e5;margin-bottom:6px">‹ Todas las carpetas</div>'
          + tarjeta('<b style="font-size:16px">📁 Sr. Carlos Mendoza</b>' + gris('DNI 45879632 · 987 654 321')
                    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px;font-size:11px">'
                    + ''.join(f'<div style="background:{b};border-radius:10px;padding:5px 7px">{t}<br><b style="font-size:13px;color:{c}">{v}</b></div>'
                              for t, v, b, c in [('Presupuesto', 'S/ 4 800', '#f8fafc', '#0f172a'), ('Cobrado', 'S/ 2 000', '#ecfdf5', '#059669'), ('Por cobrar', 'S/ 2 800', '#fff1f2', '#e11d48')]) + '</div>')
          + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">' + boton('+ Documento', '#0f172a', alto=38) + boton('+ Fotos', '#0f172a', alto=38) + boton('+ Nota', '#0f172a', alto=38) + '</div>'
          + '<div style="display:flex;border-bottom:1px solid #e2e8f0;margin-bottom:8px">' + peq('Todo', 1) + peq('Documentos', 0) + peq('Fotos', 0) + peq('Planos', 0) + peq('Notas', 0) + '</div>'
          + tarjeta('<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px"><span>📄 Contrato techo.pdf</span><span style="font-size:11px;font-weight:800;color:#4f46e5">Ver · Descargar</span></div>')
          + '<div style="display:flex;gap:6px;margin-bottom:8px">' + ''.join(f'<div style="flex:1;height:54px;border-radius:10px;background:linear-gradient(135deg,{a},{b})"></div>' for a, b in [('#94a3b8', '#475569'), ('#a8a29e', '#57534e'), ('#93c5fd', '#64748b')]) + '</div>'
          + boton('Descargar todo (ZIP)', '#e2e8f0', '#0f172a', alto=40))
E.append(dict(frases=[
  'Paso ocho: toca Carpeta, el tercer botón de arriba.',
  'Cada cliente tiene su carpeta. En la tarjeta ves cuántos documentos, fotos y planos tiene, y cuánto te debe.',
  'Ábrela: arriba ves lo que ya te pagaron y lo que falta. Con más Documento, más Fotos y más Nota guardas contratos, fotos de obra y acuerdos.',
  'Las pestañas separan todo por tipo, y con Descargar todo te llevas la carpeta completa en un archivo ZIP. Solo tú la ves.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(8, 'La <span class="nar">carpeta</span> del cliente', [
    ('📁', 'Botón <b class="nar">Carpeta</b>'), ('🔢', 'Conteos y <b class="nar">por cobrar</b>'), ('➕', '<b class="nar">Documento · Fotos · Nota</b>'), ('🗜️', 'Pestañas y <b class="nar">ZIP</b>')], lambda i: i)
  + telefono(pantalla('Proyectos', lista_carp, 'proyectos', GRUPO, 'Carpeta', fab_txt='Registrar cliente', extra=toque(270, 124, 0) + toque(200, 330, 1))
             + capa(pantalla('Proyectos', dentro, 'proyectos', GRUPO, 'Carpeta'), 2) + toque(200, 330, 2) + toque(200, 500, 3))))

# 9 · consejos
E.append(dict(frases=[
  'Tres consejos.',
  'Crea el proyecto apenas el cliente diga sí: todo lo que cotices después lo puedes enviar a ese proyecto.',
  'Anota cada pago el mismo día. Y toma fotos del avance todos los días: te respaldan si hay un reclamo.',
], zoom=[(0, 1.0, 50, 50)],
  html=titulo('Tres <span class="nar">consejos</span>', top=90) + lista([
    ('✅', 'Crea el proyecto <b class="nar">apenas te digan sí</b>'), ('💵', 'Anota cada pago <b class="nar">el mismo día</b>'),
    ('📷', 'Fotos diarias: tu <b class="nar">respaldo</b>')], lambda i: i if i < 2 else 2, top=270, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Listo: tu cliente y su proyecto ya están en el celular. En el siguiente tutorial registramos los gastos de la obra.',
], html=final('Tu obra <span class="nar">bajo control</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'cel_02')
