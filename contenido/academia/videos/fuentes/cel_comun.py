"""Kit para tutoriales de InnovApp en el CELULAR: teléfono dibujado con la interfaz real de la app
(barra de arriba, barra de abajo Material 3, menú «Más», botón flotante, pestañas, formularios).
Textos y botones copiados del código de la app (App.tsx, ProyectosYClientesView, Techos, Carpintería…).
Pantalla interior: 400 × 840 px. Coordenadas de los toques: dentro de la pantalla."""
import base64
from sold_comun import *

ICONO = base64.b64encode(open('/home/claude/luis-zapatag/public/apple-touch-icon.png', 'rb').read()).decode()
W, H = 400, 840
# Íconos (trazos tipo Lucide)
_SVG = lambda d, s=22, c='currentColor', w=2: f'<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round">{d}</svg>'
IC = {
    'inicio': '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    'proyectos': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'techos': '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    'gastos': '<path d="M16.5 9.4L7.5 4.2"/><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/>',
    'mas': '<path d="M4 6h16M4 12h16M4 18h16"/>',
    'campana': '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'ajustes': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    'mas_signo': '<path d="M12 5v14M5 12h14"/>',
    'moneda': '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/>',
    'clientes': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    'camara': '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    'enviar': '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
}
ic = lambda k, s=22, c='currentColor', w=2: _SVG(IC[k], s, c, w)

# ───────── piezas generales ─────────
# Subtítulos a la izquierda, para que no tapen el teléfono.
SUB_IZQ = '<style>.sub{left:650px!important;max-width:1080px!important}</style>'
def telefono(pantalla, x=1352, y=72, en=0, esc=1.08):
    w, h = W + 40, H + 40
    return (SUB_IZQ + f'<div class="pop" data-en="{en}" style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;transform:scale({esc});transform-origin:0 0;border-radius:60px;background:#0b0f14;'
            f'border:4px solid #3b4654;box-shadow:0 30px 80px rgba(0,0,0,.55);padding:16px">'
            f'<div style="position:relative;width:{W}px;height:{H}px;border-radius:46px;overflow:hidden;background:#f8fafc;color:#0f172a;font-family:Inter,Roboto,system-ui,sans-serif">'
            f'<div style="position:absolute;top:0;left:0;right:0;height:40px;display:flex;justify-content:space-between;align-items:center;padding:0 28px;font-size:15px;font-weight:700;z-index:60;color:#0f172a">'
            f'<span>9:41</span><span style="width:90px;height:26px;border-radius:14px;background:#000"></span><span>▮▮▮ ◔</span></div>'
            f'{pantalla}</div></div>')

def toque(x, y, en, mas=0.6):
    return (f'<div class="pop" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x - 30}px;top:{y - 30}px;width:60px;height:60px;border-radius:50%;'
            f'background:rgba(249,115,22,.35);border:5px solid #f97316;z-index:90;box-shadow:0 0 0 8px rgba(249,115,22,.15)"></div>')

def capa(html, en, mas=0, clase='pop'):
    """Algo que aparece dentro de la pantalla en la frase `en` (ventanas, menús, mensajes)."""
    return f'<div class="{clase}" data-en="{en}" data-mas="{mas}" style="position:absolute;inset:0;z-index:70">{html}</div>'

def barra_arriba(titulo, sub='Innova Contratistas', creditos='120', bajo=False):
    chip = (f'<div style="display:flex;align-items:center;gap:4px;padding:0 4px 0 10px;height:36px;border-radius:18px;border:1px solid {"#fda4af" if bajo else "#fde68a"};'
            f'background:{"#fff1f2" if bajo else "#fffbeb"};color:#92400e;font-weight:900;font-size:13px">{ic("moneda", 16, "#f59e0b")}{creditos}'
            f'<span style="width:28px;height:28px;border-radius:50%;background:{"#f43f5e" if bajo else "#10b981"};display:grid;place-items:center;color:#fff">{ic("mas_signo", 16, "#fff", 3)}</span></div>') if creditos else ''
    return (f'<div style="position:absolute;top:40px;left:0;right:0;height:56px;background:#fff;display:flex;align-items:center;gap:10px;padding:0 10px;box-shadow:0 1px 0 #e7e0ec;z-index:40">'
            f'<img src="data:image/png;base64,{ICONO}" style="width:36px;height:36px;border-radius:12px;border:1px solid #e2e8f0">'
            f'<div style="flex:1;min-width:0"><div style="font-size:17px;font-weight:600;line-height:1.1">{titulo}</div><div style="font-size:11px;color:#64748b">{sub}</div></div>'
            f'{chip}<span style="width:36px;display:grid;place-items:center;color:#475569">{ic("campana")}</span>'
            f'<span style="width:36px;display:grid;place-items:center;color:#475569">{ic("ajustes")}</span></div>')

BARRA = [('inicio', 'Inicio'), ('proyectos', 'Proyectos'), ('techos', 'Techos'), ('gastos', 'Gastos'), ('mas', 'Más')]
def barra_abajo(activo='inicio'):
    it = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:64px">'
                 f'<span style="width:64px;height:32px;border-radius:16px;display:grid;place-items:center;{"background:#e8def8;color:#0f172a" if k == activo else "color:#475569"}">{ic(k, 24)}</span>'
                 f'<span style="font-size:12px;{"font-weight:800;color:#0f172a" if k == activo else "font-weight:500;color:#475569"}">{t}</span></div>' for k, t in BARRA)
    return f'<div style="position:absolute;bottom:0;left:0;right:0;height:72px;background:#f3edf7;display:flex;justify-content:space-around;padding-top:8px;z-index:40">{it}</div>'
# centros de los botones de la barra de abajo (x) — y = 800
X_BARRA = {k: 40 + i * 80 for i, (k, _) in enumerate(BARRA)}

def fab(label, en=0):
    return (f'<div class="pop" data-en="{en}" style="position:absolute;right:16px;bottom:88px;height:56px;padding:0 20px 0 16px;border-radius:16px;background:#f59e0b;color:#0f172a;'
            f'display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.25);z-index:45">{ic("mas_signo", 24, "#0f172a", 2.5)}{label}</div>')

def contenido(html, top=96, bottom=72, fondo='#f8fafc', pad=14):
    return f'<div style="position:absolute;top:{top}px;bottom:{bottom}px;left:0;right:0;overflow:hidden;background:{fondo};padding:{pad}px">{html}</div>'

def pestanas(items, activa):
    return ('<div style="display:flex;gap:4px;border-bottom:1px solid #e2e8f0;margin:-4px -14px 12px;padding:0 6px">' + ''.join(
        f'<div style="flex:1;text-align:center;padding:11px 4px;font-size:13px;font-weight:900;border-bottom:3px solid {"#4f46e5" if i == activa else "transparent"};'
        f'color:{"#4338ca" if i == activa else "#64748b"};white-space:nowrap">{t}</div>' for i, t in enumerate(items)) + '</div>')

def titulo_seccion(t, sub=''):
    return (f'<div style="font-size:20px;font-weight:900;margin-bottom:2px">{t}</div>'
            + (f'<div style="font-size:12px;color:#64748b;margin-bottom:12px">{sub}</div>' if sub else ''))

def campo(etiqueta, valor='', placeholder='', foco=False, select=False, en=None):
    txt = valor or f'<span style="color:#94a3b8">{placeholder}</span>'
    anim = f' class="ap" data-en="{en}"' if en is not None else ''
    return (f'<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">{etiqueta}</div>'
            f'<div style="height:42px;border-radius:12px;border:{"2px solid #4f46e5" if foco else "1px solid #cbd5e1"};background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:15px">'
            f'<span{anim}>{txt}</span>{"<span style=color:#64748b>▾</span>" if select else ""}</div></div>')

def boton(t, color='#4f46e5', texto='#fff', alto=46, ancho='100%', icono=None):
    return (f'<div style="height:{alto}px;width:{ancho};border-radius:12px;background:{color};color:{texto};display:flex;align-items:center;justify-content:center;gap:8px;'
            f'font-size:15px;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,.12)">{ic(icono, 18, texto) if icono else ""}{t}</div>')

def tarjeta(html, borde='#e2e8f0', fondo='#fff'):
    return f'<div style="background:{fondo};border:1px solid {borde};border-radius:16px;padding:12px 14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,.05)">{html}</div>'

def hoja_abajo(html, alto=560):
    """Ventana que sube desde abajo (estilo de la app en el celular)."""
    return (f'<div style="position:absolute;inset:0;background:rgba(15,23,42,.45)"></div>'
            f'<div style="position:absolute;left:0;right:0;bottom:0;height:{alto}px;background:#fff;border-radius:26px 26px 0 0;padding:16px;box-shadow:0 -10px 30px rgba(0,0,0,.2)">'
            f'<div style="width:44px;height:5px;border-radius:3px;background:#cbd5e1;margin:0 auto 12px"></div>{html}</div>')

SECCIONES = [('INICIO', [('Panel Principal', 'inicio'), ('Membresía Premium', 'moneda')]),
             ('MIS OBRAS', [('Proyectos & Clientes', 'proyectos'), ('Materiales & Gastos', 'gastos'), ('Contratos & EPP', 'proyectos')]),
             ('DISEÑO Y PRESUPUESTO', [('Presupuesto de obra', 'gastos'), ('Techos Metálicos', 'techos'), ('Obra Civil', 'gastos'), ('Drywall', 'gastos'),
                                       ('Carpintería Metálica', 'proyectos'), ('Melamina', 'gastos'), ('Gasfitería', 'gastos'), ('Electricidad', 'gastos')]),
             ('APRENDER', [('Academia técnica', 'inicio')]), ('CUENTA', [('Ayuda y soporte', 'campana'), ('Configuración', 'ajustes')])]
def menu_mas(activo='Panel Principal', resaltar=None):
    filas = ''
    for sec, items in SECCIONES:
        filas += f'<div style="padding:12px 12px 4px;font-size:10px;font-weight:900;letter-spacing:.12em;color:#64748b">{sec}</div>'
        for t, k in items:
            on = t == activo; hl = t == resaltar
            filas += (f'<div style="position:relative;display:flex;align-items:center;gap:12px;padding:8px 12px;margin:0 6px;border-radius:9px;font-size:14px;'
                      f'{"background:#1e293b;color:#fff;font-weight:700" if on else "color:#94a3b8"};{"outline:3px solid #f97316" if hl else ""}">'
                      f'{"<span style=position:absolute;left:0;top:6px;bottom:6px;width:3px;border-radius:2px;background:#34d399></span>" if on else ""}'
                      f'{ic(k, 18, "#34d399" if on else "#64748b")}{t}</div>')
    return (f'<div style="position:absolute;inset:0;background:rgba(15,23,42,.5)"></div>'
            f'<div style="position:absolute;top:0;bottom:0;left:0;width:300px;background:#020617;padding-top:48px;box-shadow:10px 0 30px rgba(0,0,0,.4)">'
            f'<div style="display:flex;align-items:center;gap:10px;padding:6px 14px 10px;color:#fff;font-weight:900"><img src="data:image/png;base64,{ICONO}" style="width:34px;height:34px;border-radius:10px">Innova Contratistas</div>'
            f'{filas}</div>')

def login(pin=''):
    puntos = ' '.join('●' if i < len(pin) else '•' for i in range(6))
    return (f'<div style="position:absolute;inset:0;background:#f8fafc;display:flex;align-items:center;justify-content:center">'
            f'<div style="width:310px;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:20px;text-align:center;box-shadow:0 10px 30px rgba(148,163,184,.4)">'
            f'<img src="data:image/png;base64,{ICONO}" style="width:64px;height:64px;border-radius:16px">'
            f'<div style="font-size:17px;font-weight:900;margin-top:8px">Innova Contratistas</div>'
            f'<div style="font-size:10px;font-weight:800;color:#2563eb;letter-spacing:.15em">ESTRUCTURAS METÁLICAS &amp; OBRAS</div>'
            f'<div style="margin:16px 0 10px;padding:10px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;text-align:left">'
            f'<div style="font-size:13px;font-weight:800">🔑 Acceso por PIN</div><div style="font-size:11px;color:#64748b">Ingresa tu clave de 6 dígitos</div></div>'
            f'<div style="height:50px;border-radius:14px;border:2px solid {"#2563eb" if pin else "#cbd5e1"};display:grid;place-items:center;font-size:24px;letter-spacing:.3em;font-weight:900">{puntos}</div>'
            f'<div style="margin-top:12px">{boton("Ingresar", "#2563eb")}</div></div></div>')

def lado(paso, titulo_html, items, en_de, top=300):
    return (f'<div class="paso pop" data-en="0" style="position:absolute;left:120px;top:170px;font-size:28px"><b>{paso}</b>PASO {paso}</div>'
            f'<div class="ap" data-en="0" style="position:absolute;left:120px;top:235px;width:1050px;font-size:54px;font-weight:900;line-height:1.1">{titulo_html}</div>'
            + lista(items, en_de, top=top + 60, izq=110, der=860, tam=30))

def portada(titulo, sub, n):
    return gancho(titulo, sub, '📱', f'INNOVAPP EN EL CELULAR · {n}', soldando=False)

def chips_grupo(items, activo):
    """Pestañas del apartado (p. ej. Proyectos · Personal · Carpeta): píldoras bajo la barra de arriba."""
    return ('<div style="position:absolute;top:96px;left:0;right:0;height:56px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;gap:6px;align-items:center;padding:0 12px;z-index:35">'
            + ''.join(f'<span style="height:40px;padding:0 14px;border-radius:20px;display:flex;align-items:center;font-size:13px;font-weight:800;'
                      f'{"background:#0f172a;color:#fff" if t == activo else "background:#f1f5f9;color:#475569"}">{t}</span>' for t in items) + '</div>')

def pantalla(titulo, html, abajo='inicio', grupo=None, activo=None, fab_txt=None, extra='', creditos='120'):
    """Pantalla completa de la app: barra de arriba + (pestañas del apartado) + contenido + barra de abajo + botón naranja."""
    top = 152 if grupo else 96
    return (barra_arriba(titulo, creditos=creditos) + (chips_grupo(grupo, activo) if grupo else '') + contenido(html, top=top)
            + barra_abajo(abajo) + (fab(fab_txt) if fab_txt else '') + extra)
