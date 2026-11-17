"""Ilustraciones animadas de soldadura (arco con chispas, cordón que avanza, humo, soldador con EPP)."""
import math, random

CSS = """
<style>
@keyframes chispa{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
@keyframes parpadeo{0%,100%{opacity:1;transform:scale(1)}20%{opacity:.75;transform:scale(.92)}45%{opacity:1;transform:scale(1.08)}70%{opacity:.85;transform:scale(.97)}}
@keyframes humo{0%{transform:translate(0,0) scale(.6);opacity:.0}15%{opacity:.35}100%{transform:translate(var(--dx),-260px) scale(2.4);opacity:0}}
@keyframes avanza{from{transform:translate(0,0)}to{transform:translate(var(--dx),var(--dy))}}
.chispa{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff3c4;box-shadow:0 0 10px 3px #ffb347;animation:chispa var(--t) linear infinite}
.halo{position:absolute;border-radius:50%;background:radial-gradient(circle,#fffbe8 0%,#ffe08a 18%,rgba(255,153,51,.75) 38%,rgba(249,115,22,.25) 62%,rgba(249,115,22,0) 75%);animation:parpadeo .23s linear infinite;mix-blend-mode:screen}
.humo{position:absolute;width:90px;height:90px;border-radius:50%;background:radial-gradient(circle,rgba(200,210,220,.55),rgba(200,210,220,0) 70%);animation:humo var(--t) ease-out infinite}
.antorcha{position:absolute;animation:avanza linear both}
</style>"""

def arco(cx, cy, tam=1.0, en=0, hasta=None, chispas=36, semilla=3, humo=True):
    """Arco eléctrico vivo en (cx, cy) con chispas y humo. Visible desde la frase `en` hasta la frase `hasta`."""
    rnd = random.Random(semilla)
    v = f'data-vivo-en="{en}"' + (f' data-vivo-hasta="{hasta}"' if hasta is not None else '')
    h = ''
    r = 160 * tam
    h += f'<div class="halo vivo" {v} style="left:{cx-r}px;top:{cy-r}px;width:{2*r}px;height:{2*r}px"></div>'
    for i in range(chispas):
        a = rnd.uniform(-math.pi * 0.95, -math.pi * 0.05) if rnd.random() < .8 else rnd.uniform(0, math.pi)
        d = rnd.uniform(120, 420) * tam
        dx, dy = math.cos(a) * d, math.sin(a) * d + rnd.uniform(40, 160) * tam
        t = rnd.uniform(.45, 1.1)
        h += f'<div class="chispa vivo" {v} data-fase="{rnd.uniform(0, t):.2f}" style="left:{cx-3}px;top:{cy-3}px;--dx:{dx:.0f}px;--dy:{dy:.0f}px;--t:{t:.2f}s"></div>'
    if humo:
        for i in range(6):
            t = rnd.uniform(2.2, 3.5)
            h += f'<div class="humo vivo" {v} data-fase="{rnd.uniform(0, t):.2f}" style="left:{cx-45+rnd.uniform(-20,20):.0f}px;top:{cy-80}px;--dx:{rnd.uniform(-80,80):.0f}px;--t:{t:.2f}s"></div>'
    return h

def escena_soldando(x0=720, y0=560, largo=760, en=0, hasta=None, dur=6.0):
    """Dos planchas con junta, cordón que avanza al rojo y la pinza con el electrodo encima del arco."""
    v = f'data-vivo-en="{en}"' + (f' data-vivo-hasta="{hasta}"' if hasta is not None else '')
    html = f'''
<svg style="position:absolute;left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">
 <defs>
  <linearGradient id="pl1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d8f9f"/><stop offset="1" stop-color="#3b4a58"/></linearGradient>
  <linearGradient id="cord" x1="0" x2="1"><stop offset="0" stop-color="#8a96a0"/><stop offset=".55" stop-color="#b98d3a"/><stop offset=".85" stop-color="#ff8c1a"/><stop offset="1" stop-color="#fff2c4"/></linearGradient>
 </defs>
 <polygon points="{x0-40},{y0+10} {x0+largo},{y0-60} {x0+largo+60},{y0+70} {x0+20},{y0+150}" fill="url(#pl1)"/>
 <polygon points="{x0-60},{y0-70} {x0+largo-20},{y0-140} {x0+largo},{y0-60} {x0-40},{y0+10}" fill="#56687a"/>
 <line x1="{x0-40}" y1="{y0+10}" x2="{x0+largo}" y2="{y0-60}" stroke="#1d2731" stroke-width="5"/>
 <line class="dib" data-en="{en}" x1="{x0-30}" y1="{y0+6}" x2="{x0+largo-60}" y2="{y0-54}" stroke="url(#cord)" stroke-width="22" stroke-linecap="round" style="--l:{largo};animation-duration:{dur}s;animation-timing-function:linear"/>
</svg>'''
    # posición del arco: avanza con el cordón (se usa una antorcha con traslación lineal)
    ax, ay = x0 - 30, y0 + 6
    dxt, dyt = largo - 30, -60
    cuerpo = arco(0, 0, 0.9, en, hasta)
    html += f'''<div class="antorcha" data-en="{en}" style="left:{ax}px;top:{ay}px;--dx:{dxt}px;--dy:{dyt}px;animation-duration:{dur}s">
 <div style="position:absolute;left:0;top:0;transform:translateY(0)">
  <div style="position:absolute;left:0;top:0">{cuerpo}</div>
  <div style="position:absolute;left:-14px;top:-330px;width:12px;height:300px;background:linear-gradient(#9aa5ae,#7a858e);transform:rotate(28deg);transform-origin:bottom center;border-radius:4px"></div>
  <div style="position:absolute;left:80px;top:-560px;width:70px;height:220px;background:#1f2933;border:4px solid #f97316;border-radius:20px;transform:rotate(28deg)"></div>
 </div></div>'''
    return html

def soldador(x, y, escala=1.0, etiquetas=None):
    """Silueta de soldador con EPP. etiquetas: lista de (frase, texto, px, py, lado) relativas al dibujo."""
    s = escala
    g = f'''<svg style="position:absolute;left:{x}px;top:{y}px" width="{520*s}" height="{900*s}" viewBox="0 0 520 900">
 <rect x="150" y="300" width="220" height="330" rx="40" fill="#7c4a2a"/>
 <rect x="150" y="300" width="220" height="80" rx="30" fill="#8b5a36"/>
 <rect x="90" y="320" width="70" height="250" rx="30" fill="#7c4a2a"/><rect x="360" y="320" width="70" height="250" rx="30" fill="#7c4a2a"/>
 <rect x="80" y="550" width="90" height="90" rx="22" fill="#c48a3a"/><rect x="350" y="550" width="90" height="90" rx="22" fill="#c48a3a"/>
 <rect x="165" y="620" width="85" height="220" rx="16" fill="#2f3e4e"/><rect x="270" y="620" width="85" height="220" rx="16" fill="#2f3e4e"/>
 <rect x="150" y="830" width="110" height="50" rx="12" fill="#3a2a1d"/><rect x="262" y="830" width="110" height="50" rx="12" fill="#3a2a1d"/>
 <ellipse cx="260" cy="200" rx="110" ry="130" fill="#1f2933" stroke="#f97316" stroke-width="6"/>
 <rect x="200" y="170" width="120" height="50" rx="8" fill="#0d2b4a" stroke="#5cc8ff" stroke-width="3"/>
</svg>'''
    return g
