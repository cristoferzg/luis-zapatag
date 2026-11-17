"""Escenas 3D de las portadas de cursos (se dibujan con escena.html). Todas en metros, eje Y hacia arriba."""
import json, math, re
PL = '/home/claude/luis-zapatag/contenido/academia/plantillas/'
CM = '/home/claude/luis-zapatag/contenido/academia/plantillas-carpimetal/'
CAT = {p['id']: p for p in json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__), '../../plantillas-excel/fuentes/catalogo_techos.json')))['perfiles']}
NAR, ACERO, GRIS, ALU, VID = '#f97316', '#d5dde7', '#94a3b8', '#e6edf5', '#7cc4ea'

def techos(archivo, frames=None, cubrir=None, colores=None, cover_o=.6):
    d = json.load(open(PL + archivo)); N = d['nodes']; E = {'tubos': [], 'polis': []}
    col = {'columna': NAR, 'cordon_superior': NAR, 'cordon_inferior': NAR, 'viga_principal': NAR, 'limatesa': NAR,
           'montante': ACERO, 'diagonal': ACERO, 'correa': GRIS, 'arriostre': '#64748b', 'tensor_viento': '#64748b', **(colores or {})}
    def frame_of(nid):
        m = re.search(r'_(\d+)$', nid) if 'arc' not in nid else re.search(r'n_arc_[tb]_(\d+)_', nid)
        return int(m.group(1)) if m else None
    for s in d['segments'].values():
        a, b = N[s['nodeAId']], N[s['nodeBId']]
        if frames is not None:
            fa, fb = frame_of(s['nodeAId']), frame_of(s['nodeBId'])
            if (fa is not None and fa not in frames) or (fb is not None and fb not in frames): continue
        p = CAT.get(s['profileId'], {}); w = (p.get('anchoMm') or 40) / 1000; h = (p.get('altoMm') or w * 1000) / 1000
        t = {'a': [a['x'], a['y'], a['z']], 'b': [b['x'], b['y'], b['z']], 'c': col.get(s.get('rolEstructural'), ACERO)}
        if 'redondo' in p.get('categoria', '') or 'varilla' in p.get('categoria', ''): t['r'] = max(w / 2, .008)
        else: t['w'], t['h'] = max(w, .02), max(h, .02)
        E['tubos'].append(t)
    if cubrir == 'arco':
        tops = {}
        for nid, n in N.items():
            m = re.match(r'n_arc_t_(\d+)_(\d+)$', nid)
            if m: tops.setdefault(int(m.group(1)), {})[int(m.group(2))] = n
        fr = sorted(tops); sel = fr[len(fr) // 2:]
        for i0, i1 in zip(sel, sel[1:]):
            ks = sorted(tops[i0])
            for k0, k1 in zip(ks, ks[1:]):
                pts = [tops[i0][k0], tops[i0][k1], tops[i1][k1], tops[i1][k0]]
                E['polis'].append({'pts': [[q['x'], q['y'] + .07, q['z']] for q in pts], 'c': ALU, 'o': cover_o, 'm': .75, 'ro': .3})
    elif cubrir:
        for i, z in enumerate(d['coverageZones'].values()):
            if cubrir == 'mitad' and i % 2: continue
            E['polis'].append({'pts': [[N[n]['x'], N[n]['y'] + .05, N[n]['z']] for n in z['nodeIdsBoundary']], 'c': ALU, 'o': cover_o, 'm': .75, 'ro': .3})
    return E

def _pulg(s): return (float(s.split('/')[0]) / float(s.split('/')[1])) if '/' in s else float(s)
def carpi(archivo_o_dic, dx=0, dy=0, dz=0, ry=0, marco=NAR, otros=ACERO):
    d = json.load(open(CM + archivo_o_dic)) if isinstance(archivo_o_dic, str) else archivo_o_dic
    E = {'tubos': [], 'cajas': [], 'polis': []}
    cr, sr = math.cos(ry), math.sin(ry)
    T = lambda x, y, z: [dx + x * cr + z * sr, dy + y, dz - x * sr + z * cr]
    for p in d['piezas']:
        a, b = T(p['x1'], p['y1'], p['z1']), T(p['x2'], p['y2'], p['z2'])
        if p.get('esPlancha'):
            vid = p.get('tipo') == 'vidrio'
            if abs(p['z2'] - p['z1']) < 1e-6:   # plancha vertical en el plano XY
                pts = [T(p['x1'], p['y1'], p['z1']), T(p['x2'], p['y1'], p['z1']), T(p['x2'], p['y2'], p['z1']), T(p['x1'], p['y2'], p['z1'])]
            else:                                # peldaño horizontal
                pts = [T(p['x1'], p['y1'], p['z1']), T(p['x2'], p['y1'], p['z1']), T(p['x2'], p['y1'], p['z2']), T(p['x1'], p['y1'], p['z2'])]
            E['polis'].append({'pts': pts, 'c': VID if vid else ('#64748b' if p.get('subtipoPlancha') == 'estriada' else '#475569'), 'o': .45 if vid else .97, 'm': .2 if vid else .5})
            continue
        m = re.match(r'^(rect|cuad)-([\d/.]+)x([\d/.]+)', p.get('perfilId', '')); r = re.match(r'^red-([\d/.]+)', p.get('perfilId', ''))
        t = {'a': a, 'b': b, 'c': marco if (p.get('grupo') in ('marco', 'bastidor', 'zancos', 'estructura') or (m and _pulg(m.group(2)) >= 1.5)) else otros}
        if r: t['r'] = _pulg(r.group(1)) * .0254 / 2
        elif m: t['w'], t['h'] = _pulg(m.group(2)) * .0254, _pulg(m.group(3)) * .0254
        else: t['w'] = t['h'] = .03
        E['tubos'].append(t)
    return E

def unir(*es):
    out = {'tubos': [], 'cajas': [], 'polis': []}
    for e in es:
        for k in out: out[k] += e.get(k, [])
    return out

def tubo(a, b, w=.1, h=None, c=NAR, **k): return {'a': a, 'b': b, 'w': w, 'h': h or w, 'c': c, **k}

def mezanine(con_escalera=True):
    E = {'tubos': [], 'cajas': [], 'polis': []}; H, A, L = 2.7, 4.0, 6.0
    cols = [(0, 0), (0, 3), (0, 6), (4, 0), (4, 3), (4, 6)]
    for x, z in cols:
        E['tubos'].append(tubo([x, 0, z], [x, H, z], .1)); E['cajas'].append({'p': [x, .01, z], 's': [.3, .02, .3], 'c': '#64748b'})
    for x in (0, 4): E['tubos'].append(tubo([x, H, 0], [x, H, 6], .15, .1))
    for z in (0, 3, 6): E['tubos'].append(tubo([0, H, z], [4, H, z], .15, .1))
    for k in range(1, 10):
        z = k * .6
        if abs(z - 3) > .05: E['tubos'].append(tubo([0, H + .1, z], [4, H + .1, z], .05, .1, ACERO))
    E['polis'].append({'pts': [[0, H + .16, 0], [4, H + .16, 0], [4, H + .16, 6], [0, H + .16, 6]], 'c': '#475569', 'o': .55, 'm': .4})
    # baranda en el borde frontal y lateral
    for (a, b) in (((4, 0), (4, 6)), ((0, 6), (4, 6))):
        a3, b3 = [a[0], H + 1.07, a[1]], [b[0], H + 1.07, b[1]]
        E['tubos'].append({'a': a3, 'b': b3, 'r': .025, 'c': NAR})
        n = int(math.dist(a, b) / .12)
        for k in range(n + 1):
            f = k / n; x, z = a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f
            E['tubos'].append({'a': [x, H + .16, z], 'b': [x, H + 1.07, z], 'r': .009, 'c': ACERO})
    # arriostres en X en un paño
    E['tubos'] += [{'a': [0, .2, 0], 'b': [0, H - .1, 3], 'r': .012, 'c': '#64748b'}, {'a': [0, .2, 3], 'b': [0, H - .1, 0], 'r': .012, 'c': '#64748b'}]
    if con_escalera:
        E = unir(E, carpi('escalera-recta-segundo-piso.json', dx=4.3, dz=6.0, ry=math.pi / 2))
    return E

def cochera():
    E = carpi('porton-corredizo-cochera.json', dx=0, dz=0)
    H0, pend, F = 2.6, .1, 5.0   # techo a una agua de 4.2 × 5 m sobre el portón
    for x in (0, 4.2):
        for z in (0, -F):
            h = H0 + pend * (-z)
            E['tubos'].append(tubo([x, 0, z], [x, h + 0.0, z], .1))
        E['tubos'].append(tubo([x, H0, .3], [x, H0 + pend * (F + .3), -F - .3], .1, .05))
    for k in range(7):
        z = .3 - k * (F + .6) / 6
        E['tubos'].append(tubo([-.2, H0 + .06 + pend * (-z), z], [4.4, H0 + .06 + pend * (-z), z], .05, .04, ACERO))
    E['polis'].append({'pts': [[-.25, H0 + .1 - pend * .3, .35], [4.45, H0 + .1 - pend * .3, .35], [4.45, H0 + .1 + pend * (F + .35), -F - .35], [-.25, H0 + .1 + pend * (F + .35), -F - .35]], 'c': ALU, 'o': .7, 'm': .8})
    E['cajas'] = E.get('cajas', []) + [{'p': [-.25, 1.3, 0], 's': [.35, 2.6, .35], 'c': '#a8a29e'}, {'p': [4.45, 1.3, 0], 's': [.35, 2.6, .35], 'c': '#a8a29e'}]
    return E

def porton_auto():
    E = carpi('porton-corredizo-cochera.json')
    E['cajas'] += [{'p': [-.3, 1.3, -.05], 's': [.45, 2.6, .45], 'c': '#a8a29e'}, {'p': [4.2, 1.3, -.05], 's': [.45, 2.6, .45], 'c': '#a8a29e'},
                   {'p': [.3, .2, -.32], 's': [.32, .38, .26], 'c': '#1f2937', 'm': .3},               # motor
                   {'p': [3.9, .45, .35], 's': [.09, .9, .09], 'c': '#e5e7eb'}, {'p': [-.05, .45, .35], 's': [.09, .9, .09], 'c': '#e5e7eb'},  # postes de fotoceldas
                   {'p': [3.9, .8, .35], 's': [.11, .12, .11], 'c': '#ef4444', 'em': '#ef4444'}, {'p': [-.05, .8, .35], 's': [.11, .12, .11], 'c': '#ef4444', 'em': '#ef4444'},
                   {'p': [4.2, 2.75, -.05], 's': [.16, .16, .16], 'c': '#f59e0b', 'em': '#f59e0b'}]   # luz de destello
    E['tubos'].append({'a': [-.6, .02, 0], 'b': [8.2, .02, 0], 'w': .04, 'h': .04, 'c': '#cbd5e1'})   # riel
    E['tubos'].append({'a': [0, .14, -.18], 'b': [3.9, .14, -.18], 'w': .03, 'h': .03, 'c': '#e5e7eb'})  # cremallera
    return E

def carpinteria():
    return unir(carpi('puerta-principal-dos-hojas.json', dx=0), carpi('reja-ventana.json', dx=2.1, dy=.9),
                carpi('escalera-recta-segundo-piso.json', dx=4.3, dz=-.2))

def nudo_soldado():
    E = {'tubos': [], 'cajas': [], 'polis': []}
    E['tubos'].append(tubo([-1.6, 0, 0], [1.6, 0, 0], .075, .05))                      # cordón inferior
    E['tubos'].append(tubo([-1.6, 1.0, 0], [1.6, 1.0, 0], .075, .05))                  # cordón superior
    for x0, x1 in ((-1.4, -.45), (.45, 1.4)):
        E['tubos'].append(tubo([x0, .03, 0], [x1, .97, 0], .05, .05, ACERO))            # diagonales
    E['tubos'].append(tubo([-.45, .97, 0], [.45, .03, 0], .05, .05, ACERO))
    E['tubos'].append(tubo([0, .04, 0], [0, .96, 0], .04, .04, ACERO))                  # montante
    for (x, y) in ((-.45, .97), (.45, .03), (0, .04), (0, .96), (-1.4, .03), (1.4, .03)):
        E['cajas'].append({'p': [x, y, .03], 's': [.16, .07, .07], 'c': '#ffb347', 'em': '#ff7a00', 'm': .2, 'ro': .3, 'sombra': False})
    return E

def casa_bim():
    E = {'tubos': [], 'cajas': [], 'polis': []}; W, D, H = 8.0, 10.0, 2.8
    muro = lambda p, s: E['cajas'].append({'p': p, 's': s, 'c': '#e2e8f0', 'm': .05, 'ro': .9})
    for piso in (0, 1):
        y = piso * (H + .2) + H / 2
        muro([W / 2, y, 0], [W, H, .15]); muro([W / 2, y, D], [W, H, .15]); muro([0, y, D / 2], [.15, H, D]); muro([W, y, D / 2], [.15, H, D])
        E['cajas'].append({'p': [W / 2, piso * (H + .2) + H + .1, D / 2], 's': [W + .4, .2, D + .4], 'c': '#94a3b8', 'm': .1})
        for k in range(3):   # ventanas en la fachada larga
            E['cajas'].append({'p': [W + .1, piso * (H + .2) + 1.5, 1.8 + k * 3.2], 's': [.06, 1.2, 1.6], 'c': '#38bdf8', 'o': .75, 'm': .3, 'ro': .1, 'em': '#0ea5e9'})
        for k in range(2):
            E['cajas'].append({'p': [2 + k * 4, piso * (H + .2) + 1.5, -.1], 's': [1.6, 1.2, .06], 'c': '#38bdf8', 'o': .75, 'm': .3, 'ro': .1, 'em': '#0ea5e9'})
    E['cajas'].append({'p': [6.4, 1.1, -.1], 's': [1.0, 2.2, .07], 'c': '#f97316', 'm': .2})   # puerta
    E['cajas'].append({'p': [W / 2, -.05, D / 2], 's': [W + 3, .1, D + 3], 'c': '#1e3a5f', 'm': 0, 'fuera': True})
    for k in range(13):   # rejilla de ejes (líneas azules)
        E['tubos'].append({'a': [-1.5 + k * (W + 3) / 12, .01, -1.5], 'b': [-1.5 + k * (W + 3) / 12, .01, D + 1.5], 'w': .02, 'h': .01, 'c': '#60a5fa', 'em': '#60a5fa'})
    return E
