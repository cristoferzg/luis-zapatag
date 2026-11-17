import sys, glob, os, json, http.server, threading, functools
from playwright.sync_api import sync_playwright
DIR = os.path.dirname(os.path.abspath(__file__)); src = sys.argv[1]
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIR))
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    for f in sorted(glob.glob(src + '/*.json')):
        pg = b.new_page(viewport={'width': 1200, 'height': 800})
        pg.goto('http://127.0.0.1:8765/render.html'); pg.wait_for_function('window.listo === true')
        pg.evaluate('d => window.render(d)', json.load(open(f))); pg.wait_for_timeout(300)
        out = f.replace('.json', '_3d.png'); pg.locator('#c').screenshot(path=out); print(out); pg.close()
    b.close()
srv.shutdown()
