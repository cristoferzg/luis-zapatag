# Manual (17/11/2026): Techos Metálicos — columnas de viga H, placas base y pernos, y paredes de aluzinc.
#  • Pág. 30 (Paso 21 · Herramientas del 3D): el texto suma «Paredes».
#  • Página nueva «30 b» (después de la 30, sin mover la numeración del índice): Paso 21-B (columnas, placas y pernos)
#    y Paso 21-C (paredes de aluzinc con largueros).
# Uso: python manual_techos_paredes.py <entrada.pdf> <columnas.png> <paredes.png> <salida.pdf>
# Capturas de PC a escala 2 (columnas: panel del Inspector; paredes: visor 3D con el panel «Paredes de aluzinc»).
import sys, pymupdf as f
from PIL import Image, ImageDraw, ImageFont
src, img_col, img_par, out = sys.argv[1:5]
FD = '/usr/share/fonts/opentype/inter/'
ROJO = (225, 29, 72)
NARANJA = (0.9176, 0.3451, 0.0471)

def marcar(ruta, marcas, destino):
    im = Image.open(ruta).convert('RGB')
    dr = ImageDraw.Draw(im); fnt = ImageFont.truetype(FD + 'Inter-Bold.otf', 30)
    for i, (x, y) in enumerate(marcas, 1):
        dr.ellipse((x - 26, y - 26, x + 26, y + 26), fill=(255, 255, 255))
        dr.ellipse((x - 21, y - 21, x + 21, y + 21), fill=ROJO)
        dr.text((x, y + 1), str(i), font=fnt, fill=(255, 255, 255), anchor='mm')
    im.save(destino, quality=88)
    return destino, im.size

d = f.open(src)
def fuentes(p):
    p.insert_font(fontname='IR', fontfile=FD + 'Inter-Regular.otf')
    p.insert_font(fontname='IB', fontfile=FD + 'Inter-Bold.otf')
def color(hx): return ((hx >> 16) / 255, ((hx >> 8) & 255) / 255, (hx & 255) / 255)
def texto(p, x, y, t, size, col, font='IR'):
    p.insert_text((x, y), t, fontname=font, fontsize=size, color=color(col))
def imagen(p, r, ruta):
    p.draw_rect(r + (-1, -1, 1, 1), color=(0.7961, 0.8353, 0.8824), width=0.8)
    p.insert_image(r, filename=ruta)
def llamadas(p, x, y, textos, radio=6.7, tam=9):
    for i, t in enumerate(textos, 1):
        p.draw_circle((x + radio, y - 3.3), radio, color=None, fill=tuple(c / 255 for c in ROJO))
        texto(p, x + radio - 2.6, y, str(i), 8, 0xffffff, 'IB')
        texto(p, x + 2 * radio + 5, y, t, tam, 0x334155, 'IB')
        x += 2 * radio + 5 + f.get_text_length(t, fontname='helv', fontsize=tam) * 1.08 + 16
def paso(p, y, n, titulo):
    p.draw_rect(f.Rect(36.7, y, 36.7 + 9 + f.get_text_length(n, fontname='helv', fontsize=8) * 1.1 + 9, y + 14.3), color=None, fill=NARANJA, radius=0.5)
    texto(p, 45.3, y + 10.2, n, 8, 0xffffff, 'IB')
    texto(p, 36.7 + 18 + f.get_text_length(n, fontname='helv', fontsize=8) * 1.1 + 8, y + 11.5, titulo, 13, 0x0f172a, 'IB')

# ── Página 30: «Paredes» entre las herramientas del 3D ──
p = d[29]
p.add_redact_annot(f.Rect(36, 78, 560, 123), fill=False)
p.apply_redactions(images=f.PDF_REDACT_IMAGE_NONE, graphics=f.PDF_REDACT_LINE_ART_NONE)
fuentes(p)
for i, t in enumerate(['Movible: techo corredizo, plegable o de lamas. Paredes: costados y frontis de aluzinc (ver pág. 30 b).',
                       'Canaletas: canaleta y bajadas automáticas. Colores: pintura de la estructura. Recorrer: camina debajo',
                       'del techo. Foto propuesta: guarda la vista como imagen para tu cliente.']):
    texto(p, 36.8, 89 + i * 14.6, t, 10.5, 0x334155)

# ── Página nueva 30 b ──
W, H = d[29].rect.width, d[29].rect.height
p = d.new_page(pno=30, width=W, height=H)
fuentes(p)
p.draw_rect(f.Rect(36.7, 36.0, 45.0, 44.2), color=None, fill=NARANJA, radius=0.2)
texto(p, 52.4, 42.9, '4. TECHOS METÁLICOS', 8.5, 0xea580c, 'IB')

# Paso 21-B: columnas, placas y pernos
paso(p, 59.2, 'Paso 21-B', 'Columnas de viga H, placas base y pernos')
for i, t in enumerate(['En el Inspector (a la derecha) eliges el material de las columnas: Tubo, Viga H o Concreto. «Viga H» pone',
                       'la viga W más liviana que cumple el peso del techo y el sismo. Debajo, «Placas base y pernos» cambia',
                       'TODAS las bases: cuántos pernos J, su diámetro y la placa (ancho × largo × espesor). «Recomendado» pone',
                       'lo que pide el cálculo; el 3D, los costos, la memoria y el plano CM-02 usan lo que elijas.']):
    texto(p, 36.8, 89 + i * 14.6, t, 10.5, 0x334155)
ruta, (iw, ih) = marcar(img_col, [(282, 82), (512, 343), (200, 470), (140, 587)], img_col + '.m.jpg')
h1 = 232; w1 = h1 * iw / ih
r1 = f.Rect((W - w1) / 2, 150, (W + w1) / 2, 150 + h1)
imagen(p, r1, ruta)
llamadas(p, 36.7, r1.y1 + 18, ['Viga H', 'Recomendado', 'Pernos J y diámetro', 'Medida de la placa'])

# Paso 21-C: paredes de aluzinc
y0 = r1.y1 + 40
paso(p, y0, 'Paso 21-C', 'Paredes de aluzinc con largueros')
for i, t in enumerate(['En el 3D toca «Paredes» y marca «La nave lleva paredes». Elige los lados (los dos costados de la luz y',
                       'los frontis), desde qué altura empieza la plancha (0 = piso, o encima de un muro) y la plancha. Los',
                       'largueros (correas de pared) van a 1.50 m o 1.20 m según la plancha y la distancia entre columnas, con',
                       'el tubo más económico que aguanta el viento. Suma planchas, largueros, pernos y remates al presupuesto.']):
    texto(p, 36.8, y0 + 30 + i * 14.6, t, 10.5, 0x334155)
ruta, (iw, ih) = marcar(img_par, [(1196, 266), (52, 722), (196, 1008), (52, 1184)], img_par + '.m.jpg')
top = y0 + 30 + 4 * 14.6 + 6
h2 = 790 - 26 - top; w2 = h2 * iw / ih
r2 = f.Rect((W - w2) / 2, top, (W + w2) / 2, top + h2)
imagen(p, r2, ruta)
llamadas(p, 36.7, r2.y1 + 18, ['Botón Paredes', 'Qué lados', 'Desde y plancha', 'Largueros recomendados'])

# Pie de página
p.draw_rect(f.Rect(36.8, 807.8, 558.8, 808.5), color=None, fill=(0.8863, 0.9098, 0.9412))
texto(p, 36.8, 821.5, 'Techos Metálicos · Innova Contratistas · Manual de usuario', 7.5, 0x94a3b8)
texto(p, 558.4 - f.get_text_length('30 b', fontname='helv', fontsize=7.5) * 1.08, 821.5, '30 b', 7.5, 0x94a3b8)
d.save(out, garbage=3, deflate=True)
print('ok', len(d))
