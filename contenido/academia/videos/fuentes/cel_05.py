"""Celular 5: diseña y cotiza un portón en Carpintería Metálica."""
from cel_comun import *
CURSO = 'USABILIDAD · INNOVAPP EN EL CELULAR'
E = []
gris = lambda t: f'<div style="font-size:12px;color:#64748b">{t}</div>'
SECC = ['✏️ Diseñar', '📦 Materiales', '💰 Presupuesto']

def porton(marco=True, plancha=False, acc=False, cotas=True, alto=300):
    L = ['<defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#e2e8f0" stroke-width="1"/></pattern></defs>',
         '<rect width="380" height="300" fill="url(#g)"/>']
    if plancha:
        L.append('<rect x="44" y="60" width="292" height="190" fill="#94a3b8" opacity=".55"/>' + ''.join(f'<line x1="{44+k*24}" y1="60" x2="{44+k*24}" y2="250" stroke="#64748b" stroke-width="1"/>' for k in range(1, 13)))
    if marco:
        L.append('<rect x="40" y="56" width="300" height="198" fill="none" stroke="#1d4ed8" stroke-width="8"/>'
                 '<line x1="40" y1="155" x2="340" y2="155" stroke="#2563eb" stroke-width="5"/><line x1="190" y1="56" x2="190" y2="254" stroke="#2563eb" stroke-width="5"/>')
    if acc:
        L.append(''.join(f'<circle cx="{x}" cy="262" r="9" fill="#0f172a"/><circle cx="{x}" cy="262" r="3" fill="#f59e0b"/>' for x in (80, 300))
                 + '<rect x="318" y="140" width="12" height="30" rx="3" fill="#f59e0b"/>')
    if cotas:
        L.append('<line x1="40" y1="36" x2="340" y2="36" stroke="#f97316" stroke-width="2"/><text x="190" y="30" text-anchor="middle" font-size="15" font-weight="800" fill="#ea580c">3.90 m</text>'
                 '<line x1="356" y1="56" x2="356" y2="254" stroke="#f97316" stroke-width="2"/><text x="366" y="160" font-size="15" font-weight="800" fill="#ea580c" transform="rotate(90 366 160)">2.40 m</text>')
    return f'<svg width="100%" height="{alto}" viewBox="0 0 380 300">{"".join(L)}</svg>'

def herramientas(activa=None):
    it = [('↖', 'Selec.'), ('📏', 'Tubo'), ('▢', 'Marco'), ('▦', 'Plancha'), ('🔩', 'Accesorio'), ('↶', 'Deshacer'), ('⚙', 'Más')]
    return ('<div style="position:absolute;left:0;right:0;bottom:72px;height:60px;background:#fff;border-top:1px solid #e2e8f0;display:flex;z-index:36">'
            + ''.join(f'<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:10px;'
                      f'{"font-weight:900;color:#1d4ed8;background:#eff6ff" if t == activa else "color:#475569"}"><span style="font-size:17px">{i}</span>{t}</div>' for i, t in it) + '</div>')

def lienzo(pt, activa=None, extra='', hoja='', tab=0):
    cont = (pestanas(SECC, tab) + '<div style="display:flex;gap:6px;margin-bottom:10px">'
            + ''.join(f'<span style="padding:7px 12px;border-radius:16px;font-size:12px;font-weight:800;{s}">{t}</span>' for t, s in [('Diseño 2D / 3D', 'background:#0f172a;color:#fff'), ('Plano de fabricación', 'background:#f1f5f9')])
            + f'</div><div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden">{pt}</div>')
    return pantalla('Carpintería', cont, 'mas', extra=herramientas(activa) + hoja + extra)

def empezar():
    op = lambda i, t, d: tarjeta(f'<div style="display:flex;gap:10px;align-items:center"><span style="width:40px;height:40px;border-radius:12px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:18px">{i}</span><div><b style="font-size:14px">{t}</b>{gris(d)}</div></div>')
    return hoja_abajo('<b style="font-size:17px">¿Cómo quieres empezar?</b>' + gris('Elige una forma. Siempre puedes volver aquí con el botón ?') + '<div style="height:10px"></div>'
                      + op('🚪', 'Marco de puerta, ventana o reja', 'Toca dos esquinas: el marco se arma con cortes a 45°')
                      + op('📏', 'Tubo por tubo', 'Toca el inicio y el final de cada tubo')
                      + op('▦', 'Plancha o malla', 'Para forrar puertas, portones o rejas')
                      + op('🔩', 'Accesorios', 'Bisagras, chapas, ruedas y tiradores'), 530)

# 0
E.append(dict(antes=.5, frases=[
  'Un portón corredizo de tres noventa por dos cuarenta. El cliente quiere el precio el mismo día.',
  'En este tutorial lo dibujas en el celular, lo ves en tres D, sacas los cortes y el presupuesto, y lo guardas en PDF.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=portada('Diseña un portón', 'desde el celular', 5) + telefono(lienzo(porton(plancha=True, acc=True)))))

# 1
E.append(dict(frases=[
  'Paso uno: toca Más, y en Diseño y presupuesto elige Carpintería Metálica.',
  'Ahí tienes tres secciones: Diseñar, Materiales y Presupuesto.',
  'Con un diseño nuevo aparece: ¿Cómo quieres empezar? Para un portón, toca la primera opción: Marco de puerta, ventana o reja.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(1, 'Entra a <span class="nar">Carpintería Metálica</span>', [
    ('☰', 'Más → <b class="nar">Carpintería Metálica</b>'), ('🧭', 'Diseñar · Materiales · Presupuesto'), ('🚪', 'Toca <b class="nar">Marco</b>')], lambda i: i)
  + telefono(pantalla('Panel', '', 'inicio') + capa(menu_mas('Panel Principal', 'Carpintería Metálica'), 0)
             + capa(lienzo(porton(False, cotas=False), tab=0), 1) + capa(lienzo(porton(False, cotas=False), hoja=empezar()) + toque(200, 420, 2), 2))))

# 2
E.append(dict(frases=[
  'Paso dos: toca una esquina y luego la esquina contraria. El marco se arma solo, con cortes a cuarenta y cinco grados.',
  'Escribe la medida exacta: tres noventa de ancho por dos cuarenta de alto.',
  'Con la herramienta Tubo agregas los refuerzos del medio: un travesaño y un parante.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(2, 'Dibuja el <span class="nar">marco</span>', [
    ('👆', 'Toca <b class="nar">dos esquinas</b>'), ('📐', 'Medida exacta: <b class="nar">3.90 × 2.40 m</b>'), ('➕', '<b class="nar">Tubo</b>: refuerzos')], lambda i: i)
  + telefono(lienzo(porton(cotas=False), 'Marco', toque(80, 262, 0) + toque(330, 455, 0, .6)) + capa(lienzo(porton(), 'Marco'), 1)
             + capa(lienzo(porton(), 'Tubo', toque(200, 360, 2)), 2))))

# 3
E.append(dict(frases=[
  'Paso tres: toca Plancha y elige el tipo, por ejemplo: acanalada. Toca dentro del marco y se forra completo.',
  'Luego toca Accesorio y pon las dos ruedas abajo y la chapa al costado.',
  'Si te equivocas, toca Deshacer.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(3, 'Plancha y <span class="nar">accesorios</span>', [
    ('▦', '<b class="nar">Plancha</b> acanalada'), ('🔩', 'Ruedas y <b class="nar">chapa</b>'), ('↶', '<b class="nar">Deshacer</b>')], lambda i: i)
  + telefono(lienzo(porton(plancha=True), 'Plancha', toque(150, 330, 0)) + capa(lienzo(porton(plancha=True, acc=True), 'Accesorio', toque(120, 470, 1)), 1)
             + toque(314, 738, 2))))

# 4 · 3D
cubo = ('<div style="background:linear-gradient(#e0f2fe,#f8fafc);height:300px;display:flex;align-items:center;justify-content:center">'
        '<div style="transform:perspective(500px) rotateY(-28deg) rotateX(6deg);width:300px">' + porton(plancha=True, acc=True, cotas=False, alto=220) + '</div></div>')
E.append(dict(frases=[
  'Paso cuatro: cambia a tres D y gíralo con el dedo. Así se lo enseñas al cliente antes de fabricar.',
  'Con el botón Grabar sacas un video de quince segundos del portón girando, para mandarlo por WhatsApp.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(4, 'Míralo en <span class="nar">3D</span>', [
    ('🔄', 'Gíralo con el dedo'), ('🎬', '<b class="nar">Grabar</b>: video de 15 s')], lambda i: i)
  + telefono(lienzo(cubo, extra=toque(200, 360, 0) + '<div style="position:absolute;right:26px;top:262px;z-index:40;background:#dc2626;color:#fff;font-size:12px;font-weight:900;border-radius:10px;padding:6px 10px">● Grabar</div>' + toque(330, 274, 1)))))

# 5 · materiales
mats = (pestanas(SECC, 1) + '<div style="display:flex;gap:6px;margin-bottom:10px">'
        + ''.join(f'<span style="padding:7px 12px;border-radius:16px;font-size:12px;font-weight:800;{s}">{t}</span>' for t, s in [('Despiece y cortes', 'background:#0f172a;color:#fff'), ('Agrupados', 'background:#f1f5f9')]) + '</div>'
        + tarjeta(''.join(f'<div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid #f1f5f9"><span>{n}</span><b>{c}</b></div>' for n, c in [
            ('Tubo 2"×2" · 2 piezas de 3.90 m', 'corte 45°'), ('Tubo 2"×2" · 2 piezas de 2.40 m', 'corte 45°'), ('Tubo 1½"×1½" · travesaño 3.80 m', 'corte 90°'),
            ('Tubo 1½"×1½" · parante 2.30 m', 'corte 90°'), ('Plancha acanalada', '3 planchas'), ('Ruedas · chapa', '2 · 1')])))
E.append(dict(frases=[
  'Paso cinco: toca Materiales. En Despiece y cortes tienes cada pieza con su medida y su ángulo de corte.',
  'En Agrupados ves cuántas barras de seis metros compras, sin desperdiciar.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(5, 'Lista de <span class="nar">cortes</span>', [
    ('✂️', 'Medida y <b class="nar">ángulo</b> de cada corte'), ('📦', 'Barras de <b class="nar">6 m</b> a comprar')], lambda i: i)
  + telefono(pantalla('Carpintería', mats, 'mas', extra=toque(200, 152, 0) + toque(200, 232, 1)))))

# 6 · presupuesto y PDF
pres = (pestanas(SECC, 2) + tarjeta('<div style="font-size:11px;font-weight:800;color:#64748b">PRESUPUESTO DE HERRERÍA</div><div style="font-size:28px;font-weight:900">S/ 3 450</div>'
        + gris('Materiales · mano de obra · pintura · instalación')) + boton('Imprimir', '#0f172a', icono='enviar'))
pdf = ('<b style="font-size:17px">Imprimir</b>' + gris('Elige una impresora') + '<div style="height:10px"></div>'
       + tarjeta('<div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">📄</span><b>Guardar como PDF</b></div>', '#a5b4fc', '#eef2ff')
       + tarjeta('<div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">🖨️</span><span>Impresora del taller</span></div>'))
E.append(dict(frases=[
  'Paso seis: toca Presupuesto. Ahí está el total con materiales, mano de obra e instalación, y arriba, el logo de tu empresa.',
  'Toca Imprimir y elige: Guardar como PDF.',
  'Elige dónde guardarlo, por ejemplo en Descargas, y queda listo para mandarlo por WhatsApp al cliente.',
], zoom=[(0, 1.0, 50, 50), (1, 1.02, 55, 50)],
  html=lado(6, 'Presupuesto en <span class="nar">PDF</span>', [
    ('💰', 'Total con <b class="nar">tu logo</b>'), ('🖨️', 'Imprimir → <b class="nar">Guardar como PDF</b>'), ('💬', 'Mándalo por <b class="nar">WhatsApp</b>')], lambda i: i)
  + telefono(pantalla('Carpintería', pres, 'mas', extra=toque(320, 152, 0) + toque(200, 290, 1, -.3)) + capa(hoja_abajo(pdf, 300), 1) + toque(200, 640, 1, .8))))

# 7 · consejos
E.append(dict(frases=[
  'Tres consejos.',
  'Mide dos veces: el vano a veces no es recto. Usa la medida más chica.',
  'Muestra el tres D al cliente antes de cortar. Y para escaleras, usa el botón Escalera a medida: la arma sola con tus medidas.',
], zoom=[(0, 1.0, 50, 50)],
  html=titulo('Tres <span class="nar">consejos</span>', top=90) + lista([
    ('📏', 'Mide dos veces: usa <b class="nar">la más chica</b>'), ('🔄', 'Enseña el <b class="nar">3D</b> antes de cortar'),
    ('🪜', '<b class="nar">Escalera a medida</b>')], lambda i: i if i < 2 else 2, top=270, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Listo: diseñaste y cotizaste un portón desde el celular. En el último tutorial usas la Academia y tus créditos.',
], html=final('Del boceto <span class="nar">al taller</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'cel_05')
