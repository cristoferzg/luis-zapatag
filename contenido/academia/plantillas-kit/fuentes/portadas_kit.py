"""Portadas 1280×720: kit de cotización (Excel/Word) y diseños editables de Carpintería Metálica."""
import base64, glob
from playwright.sync_api import sync_playwright
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()
EMB = b64('/home/claude/luis-zapatag/contenido/academia/fuentes/emblema.png')
BADGE = {'excel': ('#1d7a3e', 'PLANTILLA EXCEL'), 'word': ('#2b579a', 'PLANTILLA WORD'), 'diseno': ('#f97316', 'DISEÑO EDITABLE')}

def html(tit, sub, tipo, img, chips, papel=True):
    col, txt = BADGE[tipo]
    mime = 'png' if img.endswith('png') else 'jpeg'
    if papel:
        visual = (f'<div style="position:absolute;left:760px;top:70px;width:440px;height:600px;overflow:hidden;background:#fff;border-radius:10px;transform:rotate(-3deg);'
                  f'box-shadow:0 30px 60px rgba(0,0,0,.55)"><img src="data:image/{mime};base64,{b64(img)}" style="width:100%"></div>')
    else:
        visual = (f'<div style="position:absolute;left:700px;top:110px;width:540px;height:400px;border-radius:18px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.5);border:4px solid rgba(255,255,255,.15)">'
                  f'<img src="data:image/{mime};base64,{b64(img)}" style="width:100%;height:100%;object-fit:cover"></div>'
                  f'<div style="position:absolute;left:720px;top:540px;font-size:20px;color:#ffb27a;font-weight:700">Ábrelo en Carpintería Metálica y cámbialo a tu medida</div>')
    ch = ''.join(f'<span style="background:rgba(249,115,22,.18);border:2px solid #f97316;padding:8px 16px;border-radius:12px">{c}</span>' for c in chips)
    return f'''<html><body style="margin:0;width:1280px;height:720px;font-family:Inter,Arial,sans-serif;color:#fff;
background:radial-gradient(90% 120% at 75% 40%,#123d63 0%,#0b2a45 55%,#061a2c 100%);position:relative;overflow:hidden">
<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(143,169,194,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(143,169,194,.07) 1px,transparent 1px);background-size:48px 48px"></div>
<div style="position:absolute;left:56px;top:44px;display:flex;align-items:center;gap:14px;font-weight:800;font-size:22px">
<img src="data:image/png;base64,{EMB}" style="width:58px;height:56px;background:#fff;border-radius:13px;padding:5px">
<div>INNOVA CONTRATISTAS<div style="color:#ffb27a;font-size:13px;letter-spacing:2.5px">RECURSOS TÉCNICOS</div></div></div>
<div style="position:absolute;left:56px;top:170px;background:{col};padding:10px 20px;border-radius:999px;font-weight:800;font-size:24px">{txt}</div>
<div style="position:absolute;left:56px;top:248px;width:620px;font-size:62px;font-weight:900;line-height:1.03;letter-spacing:-1.5px">{tit}</div>
<div style="position:absolute;left:58px;top:440px;width:600px;font-size:26px;line-height:1.35;color:#d6e4f0">{sub}</div>
<div style="position:absolute;left:58px;top:610px;display:flex;gap:12px;font-size:20px;font-weight:700">{ch}</div>
{visual}</body></html>'''

E = '/home/claude/excel/'
ITEMS = [
  ('cotizacion', 'Cotización profesional', 'Con tu logo y tu lista de precios: elige el trabajo y el precio sale solo. IGV, adelanto y saldo.', 'excel', E + 'prevs/crop_cot-2.png', ['Lista para PDF', 'Con tu logo', 'IGV automático'], True),
  ('presupuesto', 'Presupuesto de obra y cobros', 'Partidas con títulos que suman solos, valorizaciones por avance y control de pagos.', 'excel', E + 'prevs/crop_pre-3.png', ['Valorizaciones', 'Adelanto', 'Por cobrar'], True),
  ('propuesta', 'Propuesta comercial', 'La carta que vende: qué harás, materiales, inversión, plazo, pagos y garantía.', 'word', E + 'word/hi_Propuesta_Comercial-1.png', ['Editable', 'Campos marcados', 'Lista para firmar'], True),
  ('acta', 'Acta de entrega y garantía', 'Cierra la obra con la conformidad firmada y entrega un certificado de garantía.', 'word', E + 'word/hi_Acta_de_Entrega_y_Garantia-1.png', ['Checklist', 'Conformidad', 'Garantía'], True),
  ('acuerdo', 'Acuerdo de trabajo', 'Precio, pagos, plazo, adicionales y garantía por escrito antes de empezar.', 'word', E + 'word/hi_Acuerdo_de_Trabajo-1.png', ['Editable', 'Cláusulas claras', 'Dos firmas'], True),
  ('d-porton', 'Portón corredizo de cochera', '3.90 × 2.40 m: plancha abajo y barrotes arriba. Con despiece, materiales y presupuesto.', 'diseno', '/tmp/pcm/porton-corredizo-cochera_3d.png', ['3D', 'Despiece', 'Presupuesto'], False),
  ('d-puerta', 'Puerta principal de dos hojas', '1.60 × 2.40 m con vidrio templado arriba y plancha abajo.', 'diseno', '/tmp/pcm/puerta-principal-dos-hojas_3d.png', ['3D', 'Despiece', 'Presupuesto'], False),
  ('d-reja', 'Reja de ventana', '1.50 × 1.20 m con barrotes cada 11 cm y travesaño al centro.', 'diseno', '/tmp/pcm/reja-ventana_3d.png', ['3D', 'Despiece', 'Presupuesto'], False),
  ('d-baranda', 'Baranda de terraza', '4.00 × 1.00 m con pasamanos de 2" y barrotes seguros para niños.', 'diseno', '/tmp/pcm/baranda-terraza_3d.png', ['3D', 'Despiece', 'Presupuesto'], False),
  ('liquidacion', 'Liquidación de obra', 'Cierra la obra con la cuenta clara: adicionales, deductivos, pagos, atraso, garantía y el acta lista para firmar.', 'excel', E + 'prevs/crop_liq.png', ['Saldo automático', 'Adicionales', 'Acta lista'], True),
  ('d-batiente', 'Portón batiente de dos hojas', '3.00 × 2.20 m: dos hojas de 1.50 m, plancha abajo y barrotes arriba.', 'diseno', '/tmp/pcm2/porton-batiente-dos-hojas_3d.png', ['3D', 'Despiece', 'Presupuesto'], False),
  ('d-ventana', 'Ventana de fierro con vidrio', '1.80 × 1.20 m: dos hojas corredizas con vidrio de 6 mm.', 'diseno', '/tmp/pcm2/ventana-fierro-con-vidrio_3d.png', ['3D', 'Despiece', 'Presupuesto'], False),
  ('d-escalera-l', 'Escalera en L con descanso', 'Llega a 2.70 m con descanso en la esquina, columnas y baranda.', 'diseno', '/tmp/pcm2/escalera-en-l-con-descanso_3d.png', ['3D', 'Despiece', 'Presupuesto'], False),
  ('d-escalera', 'Escalera recta a segundo piso', 'Llega a 2.70 m: zancos, peldaños de plancha estriada y baranda.', 'diseno', '/tmp/pcm/escalera-recta-segundo-piso_3d.png', ['3D', 'Despiece', 'Presupuesto'], False),
]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 720})
    import sys
    for k, t, s, tipo, img, ch, papel in [x for x in ITEMS if len(sys.argv) < 2 or x[0] in sys.argv[1:]]:
        pg.set_content(html(t, s, tipo, img, ch, papel)); pg.wait_for_timeout(150)
        pg.screenshot(path=f'{E}portadas2/portada-{k}.jpg', type='jpeg', quality=88)
    b.close()
print('ok')
