"""Celular 4: cotiza un techo metálico desde el celular, en plena obra."""
from cel_comun import *
CURSO = 'USABILIDAD · INNOVAPP EN EL CELULAR'
E = []
gris = lambda t: f'<div style="font-size:12px;color:#64748b">{t}</div>'
GRUPO = ['Diseño', 'Cotización rápida']

def techo_svg(alto=330):
    """Techo a dos aguas en vista 3D sencilla (columnas, tijerales, correas y planchas)."""
    L = []
    for i in range(5):  # pórticos
        dx, dy = i * 46, -i * 20
        x0, x1, xm = 40 + dx, 250 + dx, 145 + dx
        yb, yc = 250 + dy, 150 + dy
        L.append(f'<line x1="{x0}" y1="{yb+60}" x2="{x0}" y2="{yb}" stroke="#1e3a8a" stroke-width="5"/><line x1="{x1}" y1="{yb+60}" x2="{x1}" y2="{yb}" stroke="#1e3a8a" stroke-width="5"/>')
        L.append(f'<polyline points="{x0},{yb} {xm},{yc} {x1},{yb}" fill="none" stroke="#2563eb" stroke-width="4"/><line x1="{x0}" y1="{yb}" x2="{x1}" y2="{yb}" stroke="#2563eb" stroke-width="3"/>')
        L.append(''.join(f'<line x1="{x0 + k*21}" y1="{yb}" x2="{x0 + (k+1)*21}" y2="{yb - (k+1)*(100/5) if k < 4 else yb-100}" stroke="#60a5fa" stroke-width="1.6"/>' for k in range(5)))
    for t in [0, .25, .5, .75, 1]:  # correas
        x, y = 40 + t * 105, 250 - t * 100
        L.append(f'<line x1="{x}" y1="{y}" x2="{x+184}" y2="{y-80}" stroke="#f59e0b" stroke-width="2.5"/>')
        x, y = 145 + t * 105, 150 + t * 100
        L.append(f'<line x1="{x}" y1="{y}" x2="{x+184}" y2="{y-80}" stroke="#f59e0b" stroke-width="2.5"/>')
    L.append('<polygon points="145,150 329,70 434,170 250,250" fill="#3b82f6" opacity=".35"/>')
    return f'<svg width="100%" height="{alto}" viewBox="0 0 470 330">{"".join(L)}</svg>'

def disenar(extra='', hoja=''):
    cont = (pestanas(['✏️ Diseñar', '📦 Materiales', '💰 Presupuesto', '📐 Plano'], 0)
            + f'<div style="background:#eef2ff;border-radius:16px;margin:0 -6px">{techo_svg()}</div>'
            + '<div style="display:flex;gap:6px;margin-top:10px">' + ''.join(f'<span style="flex:1;text-align:center;font-size:12px;font-weight:800;padding:8px 0;border-radius:10px;{s}">{t}</span>'
              for t, s in [('Planta', 'background:#f1f5f9'), ('Frente', 'background:#f1f5f9'), ('3D', 'background:#0f172a;color:#fff')]) + '</div>'
            + tarjeta('<div style="display:flex;justify-content:space-between;font-size:13px"><span>Nave 8 × 12 m · dos aguas</span><b style="color:#059669">✔ Cumple</b></div>', '#a7f3d0', '#ecfdf5'))
    return pantalla('Techos', cont, 'techos', GRUPO, 'Diseño', extra=hoja + extra)

def empezar():
    op = lambda i, t, d: tarjeta(f'<div style="display:flex;gap:10px;align-items:center"><span style="width:40px;height:40px;border-radius:12px;background:#ffedd5;display:flex;align-items:center;justify-content:center;font-size:18px">{i}</span><div><b style="font-size:14px">{t}</b>{gris(d)}</div></div>')
    return hoja_abajo('<b style="font-size:17px">¿Cómo quieres empezar?</b>' + gris('Elige una forma. Siempre puedes volver aquí con el botón ?') + '<div style="height:10px"></div>'
                      + op('①', 'Paso a paso', 'Base de columnas, estructura, techo y revisar')
                      + op('✨', 'Asistente con medidas', 'Dos aguas, una agua, arco…: el techo se arma solo')
                      + op('✏️', 'Dibujar libre', 'Empiezas con la herramienta Viga'), 400)

def asistente(paso):
    tipos = ''.join(f'<div style="border-radius:14px;border:2px solid {"#f97316" if t == "A Dos Aguas" else "#e2e8f0"};background:{"#fff7ed" if t == "A Dos Aguas" else "#fff"};padding:8px;font-size:12px"><b>{t}</b>{gris(d)}</div>'
                    for t, d in [('Parabólico Rolado', 'Arco curvo con celosía'), ('A Dos Aguas', 'Tijeral cumbrera central'), ('A Una Agua', 'Inclinado monopendiente'), ('Cuatro Aguas', 'Ancho de cada caída ajustable')])
    medidas = ('<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + campo('Ancho (luz) m', '8.0', '12.0', paso == 1) + campo('Largo (fondo) m', '12.0', '24.0')
               + campo('Columnas de (m)', '4.5', '4.5') + campo('Inclinación (%)', '20', '20') + '</div>')
    return hoja_abajo('<b style="font-size:17px">✨ Asistente con medidas</b>' + gris('Elige el tipo y pon tus medidas') + '<div style="height:10px"></div>'
                      + f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">{tipos}</div>' + medidas
                      + boton('Armar mi techo', '#f97316'), 520)

# 0
E.append(dict(antes=.5, frases=[
  'El cliente te pregunta cuánto cuesta su techo, y estás en la obra. Sin computadora.',
  'En este tutorial diseñas el techo con tus medidas, sacas la lista de materiales y le mandas la propuesta al cliente. Todo desde el celular.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=portada('Cotiza un techo', 'desde el celular', 4) + telefono(disenar())))

# 1
E.append(dict(frases=[
  'Paso uno: toca Techos en la barra de abajo.',
  'Arriba tienes Diseño, para dibujar el techo completo, y Cotización rápida, para un precio aproximado en segundos.',
  'Dentro de Diseño tienes cuatro secciones: Diseñar, Materiales, Presupuesto y Plano. Vamos en ese orden.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(1, 'Entra a <span class="nar">Techos</span>', [
    ('🏠', 'Barra de abajo → <b class="nar">Techos</b>'), ('⚡', '<b class="nar">Diseño</b> o Cotización rápida'), ('🧭', 'Diseñar · Materiales · Presupuesto · Plano')], lambda i: i)
  + telefono(disenar(toque(X_BARRA['techos'], 800, 0) + toque(60, 124, 1) + toque(200, 192, 2)))))

# 2
E.append(dict(frases=[
  'Paso dos: con un diseño nuevo aparece la ventana: ¿Cómo quieres empezar?',
  'Si es tu primera vez, toca Asistente con medidas: el techo se arma solo.',
  'Más adelante puedes probar Paso a paso o Dibujar libre.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(2, '¿Cómo quieres <span class="nar">empezar</span>?', [
    ('🪟', 'Se abre al crear un diseño'), ('✨', '<b class="nar">Asistente con medidas</b>'), ('✏️', 'Paso a paso o Dibujar libre')], lambda i: i)
  + telefono(disenar(hoja=empezar(), extra=toque(200, 640, 1)))))

# 3
E.append(dict(frases=[
  'Paso tres: elige el tipo de techo. Por ejemplo: A Dos Aguas.',
  'Escribe las medidas que tomaste con la wincha: ocho metros de ancho, doce de largo y columnas de cuatro metros y medio.',
  'Toca Armar mi techo. En segundos tienes columnas, tijerales y correas, con perfiles que cumplen.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(3, 'Pon tus <span class="nar">medidas</span>', [
    ('🏠', 'Tipo: <b class="nar">A Dos Aguas</b>'), ('📏', 'Ancho, largo y <b class="nar">columnas</b>'), ('🧱', 'Toca <b class="nar">Armar mi techo</b>')], lambda i: i)
  + telefono(disenar(hoja=asistente(0), extra=toque(300, 437, 0)) + capa(disenar(hoja=asistente(1)), 1) + capa(disenar(), 2, .6) + toque(200, 805, 2))))

# 4
E.append(dict(frases=[
  'Paso cuatro: mira tu techo en tres D. Gíralo con un dedo y acerca con dos.',
  'Debajo del dibujo, la revisión te dice si cumple. Si algo no alcanza, la aplicación te propone el perfil adecuado.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(4, 'Míralo en <span class="nar">3D</span>', [
    ('👆', 'Un dedo gira · dos dedos acercan'), ('✅', 'La revisión te dice si <b class="nar">cumple</b>')], lambda i: i)
  + telefono(disenar(toque(220, 330, 0) + toque(300, 628, 1)))))

# 5 · materiales
mats = (pestanas(['✏️ Diseñar', '📦 Materiales', '💰 Presupuesto', '📐 Plano'], 1)
        + '<div style="display:flex;gap:6px;margin-bottom:10px">' + ''.join(f'<span style="padding:7px 12px;border-radius:16px;font-size:12px;font-weight:800;{s}">{t}</span>' for t, s in [('Despiece y cortes', 'background:#f1f5f9'), ('Agrupados', 'background:#0f172a;color:#fff')]) + '</div>'
        + tarjeta(''.join(f'<div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid #f1f5f9"><span>{n}</span><b>{c}</b></div>' for n, c in [
            ('Tubo 3"×3"×2 mm (columnas)', '5 barras'), ('Tubo 2"×2"×2 mm (cordón superior)', '12 barras'), ('Tubo 1"×1"×1.5 mm (montantes y diagonales)', '15 barras'),
            ('Correa 2"×1"×1.5 mm', '14 barras'), ('Aluzinc TR4 0.40 mm', '24 planchas'), ('Perno J y autoperforantes', '1 lote')])))
E.append(dict(frases=[
  'Paso cinco: toca Materiales. En la parte Agrupados ves cuántas barras y planchas necesitas.',
  'En Despiece y cortes tienes la medida de cada pieza para el taller: así cortas sin desperdiciar.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(5, 'Saca los <span class="nar">materiales</span>', [
    ('📦', '<b class="nar">Agrupados</b>: barras y planchas'), ('✂️', '<b class="nar">Despiece y cortes</b>')], lambda i: i)
  + telefono(pantalla('Techos', mats, 'techos', GRUPO, 'Diseño', extra=toque(150, 192, 0) + toque(70, 232, 1)))))

# 6 · presupuesto y propuesta
pres = (pestanas(['✏️ Diseñar', '📦 Materiales', '💰 Presupuesto', '📐 Plano'], 2)
        + tarjeta('<div style="font-size:11px;font-weight:800;color:#64748b">TOTAL DE LA COTIZACIÓN</div><div style="font-size:28px;font-weight:900">S/ 9 860</div>'
                  + gris('Materiales · mano de obra · transporte · utilidad'))
        + '<div style="border-radius:16px;padding:12px;background:linear-gradient(90deg,#4f46e5,#7c3aed);color:#fff"><b>Propuesta visual para el cliente</b>'
        + '<div style="font-size:11px;opacity:.9;margin:4px 0 10px">Portada con tu techo en 3D, opciones con precio y un link para que el cliente acepte.</div>'
        + '<div style="background:#fff;color:#4338ca;border-radius:10px;padding:9px;text-align:center;font-weight:900;font-size:13px">Armar propuesta</div></div>')
E.append(dict(frases=[
  'Paso seis: toca Presupuesto. Ahí está el total con materiales, mano de obra, transporte y tu utilidad.',
  'Los precios salen de tu Catálogo de precios: actualízalo con los precios de tu ferretería y la cotización sale exacta.',
  'Luego toca el botón: Armar propuesta.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(6, 'El <span class="nar">presupuesto</span>', [
    ('💰', 'Total con <b class="nar">tu utilidad</b>'), ('🏷️', 'Precios de tu <b class="nar">catálogo</b>'), ('🎁', 'Toca <b class="nar">Armar propuesta</b>')], lambda i: i)
  + telefono(pantalla('Techos', pres, 'techos', GRUPO, 'Diseño', extra=toque(255, 192, 0) + toque(200, 455, 2)))))

# 7 · propuesta al cliente
op = lambda t, p, sel: (f'<div style="flex:1;border-radius:12px;border:2px solid {"#4f46e5" if sel else "#e2e8f0"};padding:8px 4px;text-align:center;font-size:11px;font-weight:800">'
                        f'{t}<div style="font-size:14px;font-weight:900;color:#0f172a">{p}</div></div>')
prop = ('<b style="font-size:17px">Propuesta para Sr. Carlos Mendoza</b>' + gris('Techo metálico · Nave 8 × 12 m')
        + f'<div style="background:#eef2ff;border-radius:14px;margin:8px 0">{techo_svg(170)}</div>'
        + '<div style="display:flex;gap:6px;margin-bottom:10px">' + op('Económica', 'S/ 8 900', 0) + op('Estándar', 'S/ 9 860', 1) + op('Premium', 'S/ 11 400', 0) + '</div>'
        + '<div style="font-size:11px;font-weight:800;color:#475569;margin-bottom:4px">LINK PARA EL CLIENTE</div>'
        + '<div style="display:flex;gap:6px;margin-bottom:10px"><div style="flex:1;height:40px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;padding:0 10px;font-size:12px;color:#475569">innovapp.pe/p/…</div>'
        + '<div style="width:80px">' + boton('Copiar', '#0f172a', alto=40) + '</div></div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + boton('WhatsApp', '#16a34a', alto=44) + boton('Imprimir', '#e2e8f0', '#0f172a', alto=44) + '</div>')
E.append(dict(frases=[
  'Paso siete: la propuesta se arma sola, con tu techo en tres D y tres opciones: Económica, Estándar y Premium.',
  'Toca WhatsApp y se la mandas al cliente con un link: él ve su techo en tres D desde su celular y elige su opción.',
  'Cuando el cliente acepta, el monto queda como acordado en tu proyecto. Y con el botón Imprimir la guardas en PDF.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(7, 'Manda la <span class="nar">propuesta</span>', [
    ('🎁', 'Tres opciones con precio'), ('💬', 'Link por <b class="nar">WhatsApp</b>'), ('🤝', 'El cliente acepta · <b class="nar">PDF</b> con Imprimir')], lambda i: i)
  + telefono(pantalla('Techos', pres, 'techos', GRUPO, 'Diseño', extra=capa(hoja_abajo(prop, 500), 0) + toque(105, 778, 1) + toque(295, 778, 2)))))

# 8 · consejos
E.append(dict(frases=[
  'Tres consejos.',
  'Toma bien las medidas: ancho entre columnas, largo y altura. Un error de medida es un error de precio.',
  'Vincula el diseño a la obra del cliente. Y manda la propuesta el mismo día: quien responde primero, gana el trabajo.',
], zoom=[(0, 1.0, 50, 50)],
  html=titulo('Tres <span class="nar">consejos</span>', top=90) + lista([
    ('📏', 'Medidas bien tomadas = <b class="nar">precio correcto</b>'), ('📁', 'Vincula el diseño a la <b class="nar">obra</b>'),
    ('⚡', 'Manda la propuesta <b class="nar">el mismo día</b>')], lambda i: i if i < 2 else 2, top=270, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Listo: cotizaste un techo completo desde el celular. En el siguiente tutorial diseñamos un portón en Carpintería Metálica.',
], html=final('Cotiza <span class="nar">en plena obra</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'cel_04')
