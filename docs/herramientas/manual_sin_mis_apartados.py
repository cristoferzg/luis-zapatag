# Manual (16/11/2026): quita «Mis apartados» (págs. 3, 4, 6, 70 y 84) y pone el Paso 4 «Vincular a un proyecto».
# Edita el PDF en su lugar (PyMuPDF + fuente Inter). Uso: python manual_sin_mis_apartados.py <entrada.pdf> <captura.png> <salida.pdf>
import sys, pymupdf as f
src, img, out = sys.argv[1:4]
d = f.open(src)
FD = '/usr/share/fonts/opentype/inter/'
def fuentes(p):
    p.insert_font(fontname='IR', fontfile=FD + 'Inter-Regular.otf')
    p.insert_font(fontname='IB', fontfile=FD + 'Inter-Bold.otf')
    p.insert_font(fontname='IS', fontfile=FD + 'Inter-SemiBold.otf')
def color(h): return ((h >> 16) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255)
def borrar(p, rects, imgs=False):
    for r in rects: p.add_redact_annot(f.Rect(*r), fill=False)
    p.apply_redactions(images=f.PDF_REDACT_IMAGE_REMOVE if imgs else f.PDF_REDACT_IMAGE_NONE,
                       graphics=f.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED if imgs else f.PDF_REDACT_LINE_ART_NONE)
def texto(p, x, y, t, size, col, font='IR'):
    p.insert_text((x, y), t, fontname=font, fontsize=size, color=color(col))

# Página 3 (contenido): capítulo 1 y capítulo 14
p = d[2]; borrar(p, [(78, 108, 520, 133), (78, 778, 512, 804)]); fuentes(p)
texto(p, 79.3, 117, 'Entra con tu PIN, conoce el menú por grupos y sus pestañas, vincula tus cotizaciones a un proyecto y', 8.7, 0x64748b)
texto(p, 79.3, 129.7, 'deja listos los datos de tu empresa: salen en todos tus documentos.', 8.7, 0x64748b)
texto(p, 79.3, 787.5, 'Familia, inversiones y deudas, separadas de la obra. Está siempre en el menú, en su propio grupo.', 8.7, 0x64748b)
# Página 4 (portada del capítulo 1)
p = d[3]; borrar(p, [(50, 171, 480, 225), (80, 433, 300, 448)]); fuentes(p)
texto(p, 51, 184, 'Entra con tu PIN, conoce el menú por grupos y sus pestañas,', 13, 0xffffff)
texto(p, 51, 202, 'vincula tus cotizaciones a un proyecto y deja listos los datos', 13, 0xffffff)
texto(p, 51, 220, 'de tu empresa: salen en todos tus documentos.', 13, 0xffffff)
texto(p, 81.5, 444.5, 'Vincular a un proyecto', 10.5, 0x0f172a, 'IS')
# Página 6: Paso 4 nuevo
p = d[5]; borrar(p, [(88, 420, 330, 437), (35, 442, 550, 472), (180, 472, 415, 738), (40, 739, 345, 753)], imgs=True); fuentes(p)
texto(p, 89.1, 433, 'Vincular a un proyecto', 13, 0x0f172a, 'IB')
texto(p, 36.8, 453, 'En Gasfitería, Electricidad, Drywall, Melamina y los demás apartados de diseño, toca “Vincular a un', 10.5, 0x334155)
texto(p, 36.8, 468, 'proyecto” y elige uno de Proyectos & Clientes: la obra y el cliente se llenan solos. Con “Enviar al proyecto”', 10.5, 0x334155)
texto(p, 36.8, 483, 'el total de la cotización se suma a su presupuesto (si la vuelves a enviar, se actualiza sin duplicarse).', 10.5, 0x334155)
r = f.Rect(96, 496, 499, 496 + (499 - 96) * 238 / 1200)
p.draw_rect(r + (-5, -5, 5, 5), color=(0.886, 0.91, 0.941), fill=(0.973, 0.98, 0.988), radius=0.03, width=0.8)
p.insert_image(r, filename=img)
y = r.y1 + 18
x = 41
for i, t in enumerate(['Elegir el proyecto', 'Obra y cliente se llenan solos', 'Enviar al proyecto']):
    p.draw_circle((x + 4, y - 3.2), 8, color=None, fill=(0.882, 0.114, 0.282))
    texto(p, x + 1, y, str(i + 1), 8, 0xffffff, 'IB')
    texto(p, x + 15, y, t, 9, 0x1e293b, 'IB')
    x += 15 + f.get_text_length(t, fontname='helv', fontsize=9) * 1.08 + 22
# Página 70 (portada del capítulo 14)
p = d[69]; borrar(p, [(50, 171, 480, 207)]); fuentes(p)
texto(p, 51, 184, 'Familia, inversiones y deudas, separadas de la obra. Está', 13, 0xffffff)
texto(p, 51, 202, 'siempre en el menú, en su propio grupo.', 13, 0xffffff)
# Página 84 (preguntas frecuentes)
p = d[83]; borrar(p, [(45, 109.5, 540, 122.5)]); fuentes(p)
texto(p, 46.6, 119, 'rápida, en Techos). Todos los apartados se ven siempre en el menú, ordenados por grupos.', 9.6, 0x1e293b)
d.save(out, garbage=3, deflate=True)
print('ok', len(d))
