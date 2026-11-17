import sys, json, os, math, http.server, threading, functools
from playwright.sync_api import sync_playwright
from escenas import *
DIR = os.path.dirname(os.path.abspath(__file__)); OUT = '/home/claude/excel/portadas3/3d'; os.makedirs(OUT, exist_ok=True)
ESC = {
  'naves':       lambda: dict(techos('nave-parabolica-15x30.json', cubrir='arco'), dir=[.85, .38, .75], zoom=1.1),
  'techos':      lambda: dict(techos('casa-4aguas-8x12.json', cubrir='mitad', cover_o=.75), dir=[.75, .55, .9], zoom=1.2),
  'soldadura':   lambda: dict(nudo_soldado(), dir=[.25, .2, 1], zoom=1.05),
  'seguridad':   lambda: dict(techos('nave-parabolica-15x30.json', frames=[0, 1, 2, 3]), dir=[.9, .35, .8], zoom=1.4),
  'estructuras': lambda: dict(mezanine(), dir=[.85, .5, .8], zoom=1.55),
  'planos':      lambda: dict(mezanine(False), dir=[-.6, .55, .9], zoom=1.4),
  'carpinteria': lambda: dict(carpinteria(), dir=[.35, .3, 1], zoom=.85),
  'portones':    lambda: dict(porton_auto(), dir=[.45, .25, 1], zoom=.8),
  'negocio':     lambda: dict(cochera(), dir=[-.6, .35, 1], zoom=1.45),
  'revit':       lambda: dict(casa_bim(), dir=[.9, .45, -.75], zoom=1.25),
  'usabilidad':  lambda: dict(techos('taller-2aguas-10x16.json', cubrir='mitad'), dir=[.8, .45, .9], zoom=1.15),
}
solo = sys.argv[1:] or list(ESC)
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8766), functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIR))
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for k in solo:
        pg = b.new_page(viewport={'width': 1400, 'height': 1100})
        pg.goto('http://127.0.0.1:8766/escena.html'); pg.wait_for_function('window.listo === true')
        pg.evaluate('e => window.render(e)', ESC[k]()); pg.wait_for_timeout(300)
        pg.locator('#c').screenshot(path=f'{OUT}/{k}.png', omit_background=True); pg.close(); print('ok', k)
    b.close()
srv.shutdown()
