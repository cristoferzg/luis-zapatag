# Manual (17/11/2026): Carpeta privada rediseñada (pág. 65: Paso 1 lista + Paso 2 dentro de la carpeta) y
# Mis plantillas con «Ver en 3D» (pág. 78, Paso 6). Uso:
#   python manual_carpeta_plantillas.py <entrada.pdf> <lista.png> <dentro.png> <misplantillas.png> <salida.pdf>
# Las capturas son de 2800 px de ancho (PC, escala 2); las marcas numeradas se dibujan aquí.
import sys, pymupdf as f
from PIL import Image, ImageDraw, ImageFont
src, img_lista, img_dentro, img_plant, out = sys.argv[1:6]
FD = '/usr/share/fonts/opentype/inter/'
ROJO = (225, 29, 72)

def marcar(ruta, marcas, aspecto, destino):
    im = Image.open(ruta).convert('RGB')
    w = im.width; h = min(im.height, round(w / aspecto)); im = im.crop((0, 0, w, h))
    dr = ImageDraw.Draw(im); fnt = ImageFont.truetype(FD + 'Inter-Bold.otf', 40)
    for i, (x, y) in enumerate(marcas, 1):
        dr.ellipse((x - 34, y - 34, x + 34, y + 34), fill=(255, 255, 255))
        dr.ellipse((x - 28, y - 28, x + 28, y + 28), fill=ROJO)
        dr.text((x, y + 1), str(i), font=fnt, fill=(255, 255, 255), anchor='mm')
    im.save(destino, quality=88)
    return destino

d = f.open(src)
def fuentes(p):
    p.insert_font(fontname='IR', fontfile=FD + 'Inter-Regular.otf')
    p.insert_font(fontname='IB', fontfile=FD + 'Inter-Bold.otf')
def color(hx): return ((hx >> 16) / 255, ((hx >> 8) & 255) / 255, (hx & 255) / 255)
def borrar(p, rects):
    for r in rects: p.add_redact_annot(f.Rect(*r), fill=False)
    p.apply_redactions(images=f.PDF_REDACT_IMAGE_REMOVE, graphics=f.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)
def texto(p, x, y, t, size, col, font='IR'):
    p.insert_text((x, y), t, fontname=font, fontsize=size, color=color(col))
def imagen(p, r, ruta):
    p.draw_rect(r + (-4, -4, 4, 4), color=(0.886, 0.91, 0.941), fill=(0.973, 0.98, 0.988), radius=0.03, width=0.8)
    p.insert_image(r, filename=ruta)
def llamadas(p, x, y, textos, radio=6.7, tam=9):
    for i, t in enumerate(textos, 1):
        p.draw_circle((x + radio, y - 3.3), radio, color=None, fill=tuple(c / 255 for c in ROJO))
        texto(p, x + radio - 2.6, y, str(i), 8, 0xffffff, 'IB')
        texto(p, x + 2 * radio + 5, y, t, tam, 0x1e293b, 'IB')
        x += 2 * radio + 5 + f.get_text_length(t, fontname='helv', fontsize=tam) * 1.08 + 18

# ── Página 65: Carpeta privada ──
p = d[64]
borrar(p, [(95, 99, 500, 356), (36, 358, 300, 376)]); fuentes(p)
r1 = f.Rect(96, 100.5, 498.8, 100.5 + 402.8 * 1650 / 2800)
imagen(p, r1, marcar(img_lista, [(683, 386), (650, 536), (700, 640), (1184, 575)], 2800 / 1650, img_lista + '.m.jpg'))
y = r1.y1 + 18
llamadas(p, 36.7, y, ['Buscar', 'Carpeta del cliente', 'Documentos, fotos, planos y nota', 'Lo que falta cobrar'])
# Paso 2
y0 = y + 26
p.draw_rect(f.Rect(36.7, y0, 78.8, y0 + 14.3), color=None, fill=(0.278, 0.333, 0.412), radius=0.5)
texto(p, 45.3, y0 + 10.2, 'Paso 2', 8, 0xffffff, 'IB')
texto(p, 87.1, y0 + 11.5, 'Dentro de la carpeta', 13, 0x0f172a, 'IB')
texto(p, 36.8, y0 + 31, 'Una fila para agregar (documento, fotos o nota) y pestañas: Todo, Documentos, Fotos, Planos y Notas.', 10.5, 0x334155)
texto(p, 36.8, y0 + 45, 'Cada techo se baja en PDF, AutoCAD o Revit; «Descargar todo (ZIP)» lleva la carpeta completa.', 10.5, 0x334155)
r2 = f.Rect(96, y0 + 56, 498.8, y0 + 56 + 402.8 * 1150 / 2800)
imagen(p, r2, marcar(img_dentro, [(651, 638), (1240, 700), (742, 966), (2400, 209)], 2800 / 1150, img_dentro + '.m.jpg'))
llamadas(p, 36.7, r2.y1 + 18, ['Agregar', 'Pestañas', 'PDF · AutoCAD · Revit', 'Descargar todo'])

# ── Página 78: Paso 6 Mis plantillas ──
p = d[77]
borrar(p, [(36, 399, 556, 440), (98, 444, 497, 686), (98, 687, 360, 703)]); fuentes(p)
for i, t in enumerate(['Plantillas listas (techos, puertas, drywall), planos y libros. «Ver en 3D» te deja mirar el diseño sin abrirlo;',
                       '«Abrir en Techos / Carpintería / Drywall» abre una COPIA para que cambies medidas y precios (lo que',
                       'tenías abierto queda de respaldo). Las de pago se compran o se canjean con créditos en la Tienda.']):
    texto(p, 36.8, 408.6 + i * 13.5, t, 9.6, 0x334155)
r3 = f.Rect(103.5, 450, 491.2, 450 + 387.7 * 1663 / 2800)
imagen(p, r3, marcar(img_plant, [(1046, 417), (700, 582), (1137, 725), (819, 1371)], 2800 / 1663, img_plant + '.m.jpg'))
llamadas(p, 99, r3.y1 + 14, ['Solo plantillas', 'Buscar', 'Ver en 3D', 'Abrir en el programa'], radio=6, tam=8.4)
d.save(out, garbage=3, deflate=True)
print('ok', len(d))
