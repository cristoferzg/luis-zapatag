"""Piezas comunes del curso de Soldadura (estilo nuevo: historia de la obra, animado, sin tutorial de la app)."""
from motor import EMBLEMA
from comun import titulo, errores_html
from vis_soldadura import CSS, arco, escena_soldando, soldador

ETAPAS = ['Seguridad', 'Electrodos', 'La máquina', 'Juntas', 'El cordón', 'Nudos del arco', 'Defectos', 'En obra y costos']
WA = '966 000 500'

def palabras(texto, en, mas=0.0, paso=0.22):
    return ' '.join(f'<span class="palabra" data-en="{en}" data-mas="{mas+i*paso:.2f}">{w}</span>' for i, w in enumerate(texto.split()))

def tarjetas(items, en_de, top=270, cols=4, alto=300, izq=130):
    return f'<div style="position:absolute;left:{izq}px;right:{izq}px;top:{top}px;display:grid;grid-template-columns:repeat({cols},1fr);gap:24px">' + ''.join(
        f'<div class="tarjeta pop" data-en="{en_de(i)}" style="min-height:{alto}px;text-align:center"><div style="font-size:80px">{e}</div><div style="font-size:32px;font-weight:900;margin-top:10px">{t}</div><div style="font-size:23px;color:#c9d6e3;margin-top:8px;line-height:1.35">{d}</div></div>'
        for i, (e, t, d) in enumerate(items)) + '</div>'

def lista(items, en_de, top=260, izq=220, der=220, tam=32):
    """items: (icono, texto). Tarjetas en columna que aparecen una a una."""
    return f'<div style="position:absolute;left:{izq}px;right:{der}px;top:{top}px">' + ''.join(
        f'<div class="tarjeta ap" data-en="{en_de(i)[0] if isinstance(en_de(i), tuple) else en_de(i)}" data-mas="{en_de(i)[1] if isinstance(en_de(i), tuple) else 0}" style="font-size:{tam}px;margin:14px 0;padding:18px 28px;display:flex;gap:18px;align-items:center"><span style="font-size:{tam+10}px">{ic}</span><span>{t}</span></div>'
        for i, (ic, t) in enumerate(items)) + '</div>'

def tabla(cab, filas, en_de, top=260, izq=200, der=200, tam=30, nota=''):
    h = f'<div style="position:absolute;left:{izq}px;right:{der}px;top:{top}px"><table style="width:100%;border-collapse:collapse;font-size:{tam}px">'
    h += '<tr style="background:#f97316">' + ''.join(f'<th style="padding:12px 14px;text-align:{"left" if j == 0 else "center"}">{c}</th>' for j, c in enumerate(cab)) + '</tr>'
    for i, f in enumerate(filas):
        en = en_de(i); en, mas = (en if isinstance(en, tuple) else (en, 0))
        h += f'<tr class="ap" data-en="{en}" data-mas="{mas}" style="background:{"rgba(255,255,255,.06)" if i % 2 else "transparent"}">' + ''.join(
            f'<td style="padding:12px 14px;text-align:{"left" if j == 0 else "center"};{"font-weight:800" if j == 0 else ""}">{c}</td>' for j, c in enumerate(f)) + '</tr>'
    h += '</table>' + (f'<div style="font-size:20px;color:#8fa9c2;margin-top:10px">{nota}</div>' if nota else '') + '</div>'
    return h

def badge(texto, en, x, y, color='#f97316', icono='!', mas=0, tam=28):
    return f'<div class="paso pop" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px;font-size:{tam}px;background:{color}"><b style="color:{color}">{icono}</b>{texto}</div>'

def gancho(linea1, linea2, n, nombre, extra_html='', soldando=True):
    """Escena 0: frase grande que entra palabra por palabra sobre un arco vivo."""
    fondo = (CSS + escena_soldando(760, 640, 820, en=0, dur=14)) if soldando else CSS
    return fondo + extra_html + f'''
<div style="position:absolute;inset:0;background:radial-gradient(60% 60% at 70% 55%,rgba(0,0,0,0),rgba(3,12,22,.75))"></div>
<div style="position:absolute;left:110px;top:240px;width:1000px;font-size:80px;font-weight:900;line-height:1.06;letter-spacing:-1.5px">
 {palabras(linea1, 0)}<br><span class="nar">{palabras(linea2, 0, 0.9)}</span>
</div>
<div class="paso pop" data-en="1" style="position:absolute;left:110px;top:560px;font-size:28px;background:#3f9e5a"><b style="color:#3f9e5a">{n}</b>CLASE {n} · {nombre}</div>'''

def mapa_obra(actual, etapas=None):
    etapas = etapas or ETAPAS
    """Línea del curso con la etapa actual resaltada."""
    return '<div style="position:absolute;left:140px;right:140px;top:300px;display:flex;justify-content:space-between">' + ''.join(
        f'<div class="pop" data-en="0" data-mas="{0.3*i:.2f}" style="text-align:center;width:180px;opacity:{1 if i <= actual else .45}"><div style="width:86px;height:86px;margin:0 auto;border-radius:50%;background:{"#f97316" if i == actual else ("#3f9e5a" if i < actual else "rgba(255,255,255,.08)")};border:3px solid {"#3f9e5a" if i < actual else "#f97316"};display:grid;place-items:center;font-size:34px;font-weight:900">{"✓" if i < actual else i+1}</div><div style="font-size:23px;font-weight:800;margin-top:12px">{t}</div></div>'
        for i, t in enumerate(etapas)) + '</div>'

def escena_obra(actual, frases, meta, etapas=None, obra='almacén de 15 × 30 m'):
    return dict(frases=frases, zoom=[(0, 1.0, 50, 50)], html=titulo(f'La obra: <span class="nar">{obra}</span>', top=120) + mapa_obra(actual, etapas) +
                f'<div class="tarjeta pop" data-en="{len(frases)-1}" style="position:absolute;left:420px;right:420px;top:600px;text-align:center;font-size:34px;font-weight:900">{meta}</div>')

def reto(texto_html, siguiente):
    return f'''
<div style="position:absolute;left:0;right:0;top:170px;text-align:center"><div class="paso pop" data-en="0" style="font-size:30px"><b>★</b>TU RETO</div></div>
<div class="tarjeta ap" data-en="0" data-mas="0.5" style="position:absolute;left:330px;right:330px;top:300px;font-size:36px;line-height:1.55;text-align:center">{texto_html}
 <div style="font-size:28px;color:#c9d6e3;margin-top:14px">💬 Mándalo por WhatsApp al <b class="nar">{WA}</b></div></div>
<div class="paso pop" data-en="1" style="position:absolute;left:50%;transform:translateX(-50%);top:650px;font-size:28px"><b>→</b>PRÓXIMA: {siguiente}</div>'''

def final(frase_html):
    return f'''
<div style="position:absolute;left:0;right:0;top:220px;text-align:center">
 <img class="pop" data-en="0" src="data:image/png;base64,{EMBLEMA}" style="width:170px;height:164px;background:#fff;border-radius:34px;padding:14px">
 <h2 class="t ap" data-en="0" data-mas="0.4" style="margin-top:30px">{frase_html}</h2>
 <div class="ap" data-en="1" style="margin-top:46px;font-size:26px;color:#8fa9c2;font-weight:700;letter-spacing:2px">INNOVA CONTRATISTAS · ACADEMIA TÉCNICA · WHATSAPP {WA}</div>
</div>'''

def electrodo(x, y, largo, color, etiqueta, en, mas=0, rot=0):
    """Varilla de electrodo dibujada (revestimiento de color, punta metálica)."""
    return f'''<div class="pop" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px;transform:rotate({rot}deg)">
 <div style="display:flex;align-items:center"><div style="width:70px;height:14px;background:#9aa5ae;border-radius:4px 0 0 4px"></div>
 <div style="width:{largo}px;height:28px;background:{color};border-radius:0 14px 14px 0;box-shadow:inset 0 -6px 0 rgba(0,0,0,.18)"></div></div>
 <div style="font-size:30px;font-weight:900;margin-top:10px;text-align:center">{etiqueta}</div></div>'''

def render_clase(E, curso, nombre_salida):
    import sys
    from motor import render
    salida = f'/home/claude/video/salida/{nombre_salida}.mp4'
    if len(sys.argv) > 1 and sys.argv[1] == 'prueba':
        render(E, curso, salida, cuadros={i: [3.0, 12.0] for i in range(len(E))})
    else:
        render(E, curso, salida)

def cordon(x, y, largo, tipo, en, mas=0, etiqueta='', color_et='#fff'):
    """Cordón visto desde arriba: 'bajo' (angosto, alto, irregular), 'ok' (parejo), 'alto' (ancho, salpicaduras, mordedura)."""
    import random
    rnd = random.Random(len(tipo) * 7 + int(x))
    ancho = {'bajo': 26, 'ok': 40, 'alto': 58}[tipo]
    s = f'<svg width="{largo+40}" height="140" viewBox="0 0 {largo+40} 140">'
    s += f'<rect x="0" y="20" width="{largo+40}" height="100" rx="6" fill="#56687a"/>'
    if tipo == 'alto':
        s += f'<rect x="10" y="{70-ancho/2-7}" width="{largo+10}" height="4" fill="#26323d"/><rect x="10" y="{70+ancho/2+3}" width="{largo+10}" height="4" fill="#26323d"/>'
        for _ in range(40):
            s += f'<circle cx="{rnd.uniform(10, largo+30):.0f}" cy="{rnd.choice([rnd.uniform(24,46), rnd.uniform(94,116)]):.0f}" r="{rnd.uniform(1.5,3.5):.1f}" fill="#a3aeb7"/>'
    paso = 12; n = int(largo / paso)
    for k in range(n):
        w = ancho * (rnd.uniform(.7, 1.15) if tipo == 'bajo' else rnd.uniform(.96, 1.03))
        cy = 70 + (rnd.uniform(-6, 6) if tipo == 'bajo' else 0)
        s += f'<ellipse cx="{20+k*paso}" cy="{cy:.1f}" rx="{paso*1.25:.0f}" ry="{w/2:.1f}" fill="#9aa6b0" stroke="#6d7983" stroke-width="2"/>'
    s += '</svg>'
    return (f'<div class="ap" data-en="{en}" data-mas="{mas}" style="position:absolute;left:{x}px;top:{y}px">{s}'
            + (f'<div style="font-size:28px;font-weight:900;color:{color_et};margin-top:6px">{etiqueta}</div>' if etiqueta else '') + '</div>')

def maquina(x, y, amperios, en, escala=1.0, giro_en=None):
    """Máquina inversora con dial y pantalla de amperaje."""
    ang = -120 + 240 * min(1, amperios / 200)
    g = giro_en if giro_en is not None else en
    return f'''<div class="pop" data-en="{en}" style="position:absolute;left:{x}px;top:{y}px;transform:scale({escala});transform-origin:0 0">
<svg width="520" height="420" viewBox="0 0 520 420"><rect x="10" y="40" width="500" height="340" rx="30" fill="#f97316"/><rect x="10" y="40" width="500" height="70" rx="30" fill="#e2620a"/>
<rect x="150" y="10" width="220" height="40" rx="14" fill="none" stroke="#2b3640" stroke-width="12"/>
<rect x="50" y="140" width="210" height="110" rx="14" fill="#0d1b26"/><text x="155" y="215" fill="#7ee08a" font-size="64" font-weight="900" text-anchor="middle" font-family="monospace">{amperios}A</text>
<circle cx="390" cy="200" r="70" fill="#2b3640"/><circle cx="390" cy="200" r="54" fill="#3a4753"/>
<g class="ap" data-en="{g}" style="transform-origin:390px 200px;transform:rotate({ang}deg)"><rect x="384" y="150" width="12" height="52" rx="6" fill="#ffd166"/></g>
<circle cx="110" cy="320" r="26" fill="#1d2731"/><circle cx="210" cy="320" r="26" fill="#1d2731"/><text x="110" y="330" fill="#fff" font-size="30" text-anchor="middle">+</text><text x="210" y="330" fill="#fff" font-size="30" text-anchor="middle">−</text>
<text x="390" y="320" fill="#fff" font-size="26" font-weight="800" text-anchor="middle">INVERSORA</text></svg></div>'''
