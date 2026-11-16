"""Tutorial: instalar InnovApp en iPhone / iPad (Safari → Compartir → Agregar a pantalla de inicio)."""
import base64
from sold_comun import *

CURSO = 'USABILIDAD · INSTALAR EN IPHONE'
URL = 'innovacontratistas-434d2.web.app'
ICONO = base64.b64encode(open('/home/claude/luis-zapatag/public/apple-touch-icon.png', 'rb').read()).decode()
E = []

# ───────── piezas del teléfono ─────────
def telefono(pantalla, x=1440, y=120, w=440, h=880, en=0):
    return (f'<div class="pop" data-en="{en}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:64px;background:#0b0f14;'
            f'border:4px solid #3b4654;box-shadow:0 30px 80px rgba(0,0,0,.55);padding:16px">'
            f'<div style="position:relative;width:100%;height:100%;border-radius:50px;overflow:hidden;background:#f2f4f7;color:#111;font-family:Inter,system-ui,sans-serif">'
            f'<div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);width:120px;height:34px;border-radius:20px;background:#000;z-index:5"></div>'
            f'<div style="position:absolute;top:16px;left:30px;font-size:18px;font-weight:700;z-index:4">9:41</div>'
            f'{pantalla}</div></div>')


def toque(x, y, en, mas=0.6):
    """Círculo de toque (coordenadas dentro de la pantalla del teléfono)."""
    return (f'<div class="pop" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x - 34}px;top:{y - 34}px;width:68px;height:68px;border-radius:50%;'
            f'background:rgba(249,115,22,.35);border:5px solid #f97316;z-index:20"></div>')


def pagina_innovapp():
    return (f'<div style="position:absolute;top:70px;left:0;right:0;bottom:120px;background:linear-gradient(180deg,#0b2a45,#123a5e);color:#fff;'
            f'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">'
            f'<img src="data:image/png;base64,{ICONO}" style="width:110px;height:110px;border-radius:26px">'
            f'<div style="font-size:28px;font-weight:900">InnovApp</div>'
            f'<div style="font-size:17px;opacity:.8">Ingresa con tu PIN</div>'
            f'<div style="display:flex;gap:10px">' + ''.join('<div style="width:38px;height:46px;border-radius:10px;background:rgba(255,255,255,.15)"></div>' for _ in range(4)) + '</div></div>')


def barra_safari(url=URL):
    """Barra inferior de Safari: dirección + botones (atrás, adelante, compartir, marcadores, pestañas)."""
    btn = lambda c: f'<div style="width:46px;height:46px;display:grid;place-items:center;font-size:26px;color:#0a84ff">{c}</div>'
    compartir = ('<div style="width:46px;height:46px;display:grid;place-items:center"><svg width="30" height="34" viewBox="0 0 30 34">'
                 '<path d="M6 13 H2 V32 H28 V13 H24" fill="none" stroke="#0a84ff" stroke-width="2.6"/><path d="M15 22 V2 M8 9 L15 2 L22 9" fill="none" stroke="#0a84ff" stroke-width="2.6"/></svg></div>')
    return (f'<div style="position:absolute;left:0;right:0;bottom:0;height:120px;background:rgba(248,248,250,.97);border-top:1px solid #ddd">'
            f'<div style="margin:10px 18px 6px;height:42px;border-radius:12px;background:#e6e7eb;display:flex;align-items:center;justify-content:center;font-size:16px;color:#333">🔒 {url}</div>'
            f'<div style="display:flex;justify-content:space-around;padding:0 12px">{btn("‹")}{btn("›")}{compartir}{btn("📖")}{btn("⧉")}</div></div>')


def hoja_compartir(resaltar=True):
    filas = ['Copiar', 'Agregar a la lista de lectura', 'Agregar a favoritos', 'Agregar a pantalla de inicio', 'Buscar en la página']
    items = ''.join(
        f'<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #e3e3e8;font-size:19px;'
        f'{"background:#fff3e8;font-weight:800;color:#c2410c" if (resaltar and f == "Agregar a pantalla de inicio") else ""}">'
        f'<span>{f}</span><span style="font-size:22px">{"⊞" if f == "Agregar a pantalla de inicio" else "›"}</span></div>' for f in filas)
    apps = ''.join(f'<div style="width:62px;height:62px;border-radius:16px;background:{c}"></div>' for c in ('#34c759', '#5ac8fa', '#ff9f0a', '#af52de'))
    return (f'<div style="position:absolute;inset:0;background:rgba(0,0,0,.35)"></div>'
            f'<div style="position:absolute;left:0;right:0;bottom:0;height:600px;background:#f2f2f7;border-radius:26px 26px 0 0;padding-top:18px">'
            f'<div style="display:flex;gap:12px;align-items:center;padding:0 20px 14px"><img src="data:image/png;base64,{ICONO}" style="width:46px;height:46px;border-radius:11px">'
            f'<div><div style="font-weight:800;font-size:17px">InnovApp</div><div style="font-size:13px;color:#777">{URL}</div></div></div>'
            f'<div style="display:flex;gap:22px;padding:6px 20px 18px">{apps}</div>'
            f'<div style="margin:0 14px;background:#fff;border-radius:14px;overflow:hidden">{items}</div></div>')


def pantalla_agregar():
    return (f'<div style="position:absolute;inset:0;background:#f2f2f7;padding-top:70px">'
            f'<div style="display:flex;justify-content:space-between;align-items:center;padding:0 20px 18px;font-size:19px">'
            f'<span style="color:#0a84ff">Cancelar</span><b>Agregar a inicio</b><span style="color:#0a84ff;font-weight:800">Agregar</span></div>'
            f'<div style="margin:0 16px;background:#fff;border-radius:14px;padding:16px;display:flex;gap:14px;align-items:center">'
            f'<img src="data:image/png;base64,{ICONO}" style="width:70px;height:70px;border-radius:16px">'
            f'<div style="flex:1"><div style="font-size:21px;border-bottom:1px solid #ddd;padding-bottom:8px">InnovApp</div>'
            f'<div style="font-size:14px;color:#888;margin-top:8px">https://{URL}</div></div></div>'
            f'<div style="margin:18px 16px;background:#fff;border-radius:14px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;font-size:19px">'
            f'<span>Abrir como app web</span><span style="width:58px;height:34px;border-radius:20px;background:#34c759;position:relative;display:inline-block">'
            f'<span style="position:absolute;right:3px;top:3px;width:28px;height:28px;border-radius:50%;background:#fff"></span></span></div>'
            f'<div style="margin:0 24px;font-size:14px;color:#888">Disponible en las versiones recientes de iOS.</div></div>')


def pantalla_inicio(en_icono=0):
    colores = ['#34c759', '#5ac8fa', '#ff9f0a', '#af52de', '#ff375f', '#64d2ff', '#30d158', '#bf5af2', '#ffd60a', '#0a84ff', '#ff453a']
    iconos = ''.join(f'<div style="text-align:center"><div style="width:70px;height:70px;border-radius:17px;background:{c};margin:0 auto"></div>'
                     f'<div style="font-size:12px;color:#fff;margin-top:5px;opacity:.85">App</div></div>' for c in colores)
    innov = (f'<div class="pop" data-en="{en_icono}" data-mas="0.4" style="text-align:center"><img src="data:image/png;base64,{ICONO}" '
             f'style="width:70px;height:70px;border-radius:17px;display:block;margin:0 auto;box-shadow:0 0 0 4px #f97316">'
             f'<div style="font-size:12px;color:#fff;margin-top:5px;font-weight:800">InnovApp</div></div>')
    return (f'<div style="position:absolute;inset:0;background:linear-gradient(160deg,#1e3a5f,#6b3fa0)">'
            f'<div style="position:absolute;top:80px;left:22px;right:22px;display:grid;grid-template-columns:repeat(4,1fr);gap:26px 10px">{iconos}{innov}</div></div>')


def lado(paso, titulo_html, items, en_de, top=300):
    return (f'<div class="paso pop" data-en="0" style="position:absolute;left:120px;top:170px;font-size:28px"><b>{paso}</b>PASO {paso}</div>'
            f'<div class="ap" data-en="0" style="position:absolute;left:120px;top:235px;width:950px;font-size:54px;font-weight:900;line-height:1.1">{titulo_html}</div>'
            + lista(items, en_de, top=top + 60, izq=110, der=880, tam=30))


# ───────── escenas ─────────
E.append(dict(antes=0.5, frases=[
  'InnovApp en tu iPhone, con su propio ícono, como cualquier aplicación. Y sin pasar por la App Store.',
  'Se instala desde Safari en menos de un minuto. Te muestro cómo, paso a paso.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 60, 50)],
  html=gancho('InnovApp en tu iPhone', 'en menos de un minuto', '📱', 'INSTALAR EN IPHONE', soldando=False) + telefono(pantalla_inicio(0), en=0)))

E.append(dict(frases=[
  'Paso uno: abre Safari, el navegador de Apple. Tiene que ser Safari, no el navegador que se abre dentro de WhatsApp o Facebook.',
  ('En la barra de direcciones escribe la dirección que ves en pantalla: innovacontratistas-434d2.web.app. Y entra.', 'En la barra de direcciones, escribe la dirección que ves en pantalla. Empieza con innova contratistas, y termina en punto web, punto app. Y entra.'),
  'Si alguien te mandó el enlace por WhatsApp, toca el botón para abrirlo en Safari antes de seguir.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 60, 50)],
  html=lado(1, 'Abre <span class="nar">Safari</span>', [
    ('🧭', 'Usa <b class="nar">Safari</b>, no el navegador de WhatsApp'), ('⌨️', f'<b class="nar" style="font-size:24px">{URL}</b>'), ('↗️', 'Enlace de WhatsApp: <b class="nar">Abrir en Safari</b>')],
    lambda i: i) + telefono(pagina_innovapp() + barra_safari() + toque(200, 752, 1))))

E.append(dict(frases=[
  'Paso dos: toca el botón Compartir. Es el cuadrado con una flecha hacia arriba.',
  ('En el iPhone está en la barra de abajo. En el iPad, arriba a la derecha.', 'En el iPhone está en la barra de abajo. En el ái pad, arriba a la derecha.'),
  ('Y en las versiones nuevas de iOS, según cómo tengas Safari, puede estar dentro del menú de los tres puntos.', 'Y en las versiones nuevas de ai o ese, según cómo tengas Safari, puede estar dentro del menú de los tres puntos.'),
], zoom=[(0, 1.0, 50, 50), (0, 1.06, 70, 75)],
  html=lado(2, 'Toca <span class="nar">Compartir</span>', [
    ('⬆️', 'El <b class="nar">cuadrado con la flecha</b>'), ('📱', 'iPhone: <b class="nar">abajo</b> · iPad: <b class="nar">arriba</b>'), ('⋯', 'iOS nuevo: puede estar en el <b class="nar">menú ⋯</b>')],
    lambda i: i) + telefono(pagina_innovapp() + barra_safari() + toque(204, 802, 0, 0.8))))

E.append(dict(frases=[
  'Paso tres: se abre el menú de compartir. Baja un poco y toca: Agregar a pantalla de inicio.',
  ('Según tu versión de iOS, puede decir Agregar a inicio. Es la misma opción.', 'Según tu versión de ai o ese, puede decir: Agregar a inicio. Es la misma opción.'),
], zoom=[(0, 1.0, 50, 50), (0, 1.05, 70, 65)],
  html=lado(3, '<span class="nar">Agregar a pantalla de inicio</span>', [
    ('👇', 'Baja en el menú de compartir'), ('⊞', 'Toca <b class="nar">Agregar a pantalla de inicio</b>'), ('ℹ️', 'O <b class="nar">Agregar a inicio</b>, según tu versión')],
    lambda i: [0, 0, 1][i]) + telefono(pagina_innovapp() + barra_safari() + hoja_compartir() + toque(200, 603, 0, 1.0))))

E.append(dict(frases=[
  ('Paso cuatro: verás el ícono y el nombre, InnovApp. Déjalo así.', 'Paso cuatro: verás el ícono y el nombre: Innova Ap. Déjalo así.'),
  ('En las versiones recientes de iOS aparece la opción Abrir como app web. Déjala activada: así se abre en su propia ventana, sin las barras de Safari.', 'En las versiones recientes de ai o ese, aparece la opción: Abrir como aplicación web. Déjala activada: así se abre en su propia ventana, sin las barras de Safari.'),
  'Por último, toca Agregar, arriba a la derecha.',
], zoom=[(0, 1.0, 50, 50), (2, 1.06, 70, 30)],
  html=lado(4, 'Toca <span class="nar">Agregar</span>', [
    ('✏️', 'Nombre: <b class="nar">InnovApp</b>'), ('🟢', '<b class="nar">Abrir como app web</b>: activado'), ('✅', 'Toca <b class="nar">Agregar</b>, arriba a la derecha')],
    lambda i: i) + telefono(pantalla_agregar() + toque(370, 105, 2, 0.6))))

E.append(dict(frases=[
  ('¡Listo! Ya tienes el ícono de InnovApp en tu pantalla de inicio, junto a tus demás aplicaciones.', '¡Listo! Ya tienes el ícono de Innova Ap, en tu pantalla de inicio, junto a tus demás aplicaciones.'),
  'Puedes moverlo donde quieras, o meterlo en una carpeta, como cualquier aplicación.',
], zoom=[(0, 1.0, 50, 50), (0, 1.05, 70, 40)],
  html=lado(5, '¡Ya está en tu <span class="nar">inicio</span>!', [
    ('📲', 'El ícono <b class="nar">InnovApp</b> aparece en tu pantalla'), ('📁', 'Muévelo o ponlo en una <b class="nar">carpeta</b>')],
    lambda i: i) + telefono(pantalla_inicio(0))))

E.append(dict(frases=[
  'Ábrela tocando el ícono. Se abre a pantalla completa, sin la barra de Safari.',
  'Ingresa con tu clave PIN, la misma que usas en la computadora o en Android. Tus proyectos, clientes y cotizaciones están en la nube: ves lo mismo en todos tus equipos.',
], zoom=[(0, 1.0, 50, 50), (1, 1.04, 60, 50)],
  html=lado(6, 'Entra con tu <span class="nar">PIN</span>', [
    ('🔢', 'El <b class="nar">mismo PIN</b> de siempre'), ('☁️', 'Tus datos en la nube: <b class="nar">lo mismo en todos tus equipos</b>')],
    lambda i: i) + telefono(pagina_innovapp())))

E.append(dict(frases=[
  'Tres preguntas que me hacen siempre.',
  '¿Tengo que actualizarla? No. Cada vez que la abres con internet, se actualiza sola.',
  '¿Si borro el ícono, pierdo mis datos? No. Tus datos están en la nube; vuelves a instalarla, e ingresas con tu clave PIN.',
  '¿No aparece la opción Agregar a pantalla de inicio? Casi siempre es porque no estás en Safari. Abre el enlace en Safari y repite los pasos.',
], zoom=[(0, 1.0, 50, 50), (3, 1.03, 50, 55)],
  html=titulo('Preguntas <span class="nar">frecuentes</span>', top=90) + lista([
    ('🔄', '¿Actualizar? <b class="nar">Se actualiza sola</b> al abrirla con internet'), ('🗑️', '¿Borro el ícono? <b class="nar">No pierdes nada</b>: todo está en la nube'),
    ('🧭', '¿No aparece la opción? <b class="nar">Ábrela en Safari</b>')], lambda i: i + 1, top=270, izq=260, der=260, tam=32)))

E.append(dict(frases=[
  'Resumen: Safari, Compartir, Agregar a pantalla de inicio, Agregar. Luego, ingresas con tu clave PIN.',
  'Si tienes alguna duda, escríbenos por la Ayuda de la aplicación, o por WhatsApp. ¡Nos vemos en el siguiente tutorial!',
], html=final('Safari · Compartir · <span class="nar">Agregar</span>')))

if __name__ == '__main__':
    render_clase(E, CURSO, 'ios_tuto')
