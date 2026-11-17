"""Alinea los trozos transcritos de la grabación con las frases del guion (programación dinámica)
y arma los clips de voz por frase. Uso: python3 alinear.py modulo audio.m4a trozos.json salida.mp4 [--solo-revisar]"""
import sys, json, re, unicodedata, importlib, difflib, numpy as np
import voz_propia as v, motor

def norm(t):
    t = unicodedata.normalize('NFD', t.lower()); t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]+', ' ', t)

def sim(a, b):
    a, b = norm(a), norm(b)
    if not a.strip() or not b.strip(): return 0.0
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()

mod = importlib.import_module(sys.argv[1]); audio = sys.argv[2]; tro = json.load(open(sys.argv[3])); salida = sys.argv[4]
frases = [(f[1] if isinstance(f, tuple) else f) for e in mod.E for f in e['frases']]
n, m = len(frases), len(tro)
dur_tot = tro[-1]['t'] - tro[0]['s']; pal = [len(f.split()) for f in frases]; spw = dur_tot / sum(pal)
pausa = [tro[k]['s'] - tro[k - 1]['t'] if k else 2.0 for k in range(m)]
MAXG = 12; INF = -1e9
best = np.full((n + 1, m + 1), INF); prev = np.zeros((n + 1, m + 1), dtype=int); best[0][0] = 0
for i in range(1, n + 1):
    esp = pal[i - 1] * spw
    for j in range(1, m + 1):
        for g in range(1, min(MAXG, j) + 1):
            k = j - g
            if best[i - 1][k] == INF: continue
            txt = ' '.join(t['txt'] for t in tro[k:j]); d = tro[j - 1]['t'] - tro[k]['s']
            sc = 3.0 * sim(txt, frases[i - 1]) + 0.6 * min(pausa[k], 2.5) - 0.8 * abs(np.log((d + 0.3) / (esp + 0.3)))
            if best[i - 1][k] + sc > best[i][j]: best[i][j] = best[i - 1][k] + sc; prev[i][j] = k
j = m; grupos = []
for i in range(n, 0, -1):
    k = prev[i][j]; grupos.append((k, j)); j = k
grupos.reverse()
a = v.cargar(audio); SR = v.SR
clips = []; malas = 0
for i, (k, j) in enumerate(grupos):
    s = max(0, int((tro[k]['s'] - 0.06) * SR)); t = min(len(a), int((tro[j - 1]['t'] + 0.15) * SR))
    txt = ' '.join(x['txt'] for x in tro[k:j]); sc = sim(txt, frases[i]); malas += sc < 0.35
    print(f'{i+1:2d} [{tro[k]["s"]:6.1f}-{tro[j-1]["t"]:6.1f}] {sc:.2f} | {frases[i][:60]} || {txt[:60]}')
    clips.append((a[s:t].astype(np.float32), SR))
print('frases con baja coincidencia:', malas)
if '--solo-revisar' not in sys.argv:
    motor.VOZ_PROPIA[:] = clips
    motor.render(mod.E, mod.CURSO, salida)
