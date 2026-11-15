"""Motor de videos de la Academia Innova Contratistas.
Cada escena: frases narradas (voz IA) + un HTML con elementos que aparecen al empezar una frase.
Elementos con data-en="N" aparecen cuando empieza la frase N (0 = al inicio). Clase .ap = aparece subiendo,
.dib = trazo SVG que se dibuja, .zoom con data-zoom="N:escala:x%:y%" = acercamiento de cámara.
Subtítulos sobre fondo oscuro, sincronizados con cada frase.
"""
import base64, json, pathlib, subprocess, sys, wave, os
import sherpa_onnx
import numpy as np

FPS = 30
W, H = 1920, 1080
AQUI = pathlib.Path(__file__).parent
EMBLEMA = base64.b64encode(pathlib.Path('/home/claude/luis-zapatag/contenido/academia/fuentes/emblema.png').read_bytes()).decode()
VOZ = os.environ.get('VOZ', 'vits-piper-es_MX-claude-high')
_tts = None

def tts():
    global _tts
    if _tts is None:
        d = f'/tmp/tts/{VOZ}'
        m = next(pathlib.Path(d).glob('*.onnx'))
        cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=str(m), tokens=d + '/tokens.txt', data_dir=d + '/espeak-ng-data', noise_scale=0.8, noise_scale_w=0.9), num_threads=2))
        _tts = sherpa_onnx.OfflineTts(cfg)
    return _tts

VEL = float(os.environ.get('VEL', '1.12'))

def decir(texto, vel=None):
    vel = vel or VEL
    # La pronunciación: el texto hablado puede diferir del subtítulo (siglas, números).
    a = tts().generate(texto, sid=0, speed=vel)
    return np.array(a.samples, dtype=np.float32), a.sample_rate

CSS_BASE = """
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#061a2c;font-family:Inter,Arial,sans-serif;color:#fff}
.lienzo{position:absolute;inset:0;background:radial-gradient(90% 120% at 70% 40%,#123d63 0%,#0b2a45 55%,#061a2c 100%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(143,169,194,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(143,169,194,.07) 1px,transparent 1px);background-size:48px 48px}
.camara{position:absolute;inset:0;transform-origin:50% 50%}
.marca{position:absolute;left:56px;top:40px;display:flex;align-items:center;gap:14px;font-weight:800;font-size:22px;letter-spacing:.5px;z-index:5}
.marca img{width:58px;height:56px;background:#fff;border-radius:13px;padding:5px}
.marca small{display:block;color:#ffb27a;font-size:13px;letter-spacing:2.5px;font-weight:700}
.curso{position:absolute;right:56px;top:52px;font-size:18px;color:#8fa9c2;font-weight:700;letter-spacing:1.5px;z-index:5}
.sub{position:absolute;left:50%;bottom:58px;transform:translateX(-50%);max-width:1500px;background:rgba(3,12,22,.86);padding:16px 30px;border-radius:14px;
 font-size:38px;line-height:1.3;font-weight:600;text-align:center;opacity:0;z-index:10;border-bottom:4px solid #f97316}
.sub.on{opacity:1}
h1.t{font-size:76px;font-weight:900;letter-spacing:-1.5px;line-height:1.05}
h2.t{font-size:58px;font-weight:900;letter-spacing:-1px;line-height:1.08}
.nar{color:#f97316}
.paso{display:inline-flex;align-items:center;gap:14px;background:#f97316;color:#fff;font-weight:800;font-size:24px;padding:9px 20px 9px 9px;border-radius:999px;letter-spacing:1px}
.paso b{background:#fff;color:#f97316;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:22px}
.tarjeta{background:rgba(255,255,255,.06);border:2px solid rgba(249,115,22,.55);border-radius:22px;padding:26px 30px}
.ap{opacity:0;animation:aparece .7s cubic-bezier(.2,.8,.2,1) both paused}
@keyframes aparece{from{opacity:0;transform:translateY(34px) scale(.97)}to{opacity:1;transform:none}}
.pop{opacity:0;animation:pop .55s cubic-bezier(.3,1.6,.5,1) both paused}
@keyframes pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
.dib{stroke-dasharray:var(--l,3000);stroke-dashoffset:var(--l,3000);animation:dibuja 1.8s ease-in-out both paused}
@keyframes dibuja{to{stroke-dashoffset:0}}
.cursor{position:absolute;width:44px;height:44px;z-index:8;animation:mueve .9s cubic-bezier(.4,0,.2,1) both paused;filter:drop-shadow(0 3px 6px rgba(0,0,0,.5))}
@keyframes mueve{from{left:var(--x0);top:var(--y0)}to{left:var(--x1);top:var(--y1)}}
.clic{position:absolute;border-radius:50%;border:5px solid #f97316;z-index:7;opacity:0;animation:clic .8s ease-out both paused}
@keyframes clic{0%{opacity:1;transform:scale(.2)}100%{opacity:0;transform:scale(1.6)}}
.resalta{position:absolute;border:5px solid #f97316;border-radius:12px;box-shadow:0 0 0 9999px rgba(3,12,22,.35),0 0 24px rgba(249,115,22,.9);z-index:6;opacity:0;animation:aparece .5s ease both paused}
.globo{position:absolute;z-index:9;background:#f97316;color:#fff;font-weight:800;font-size:30px;padding:12px 22px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.vivo{animation-play-state:paused !important}
.palabra{display:inline-block;margin-right:.26em;opacity:0;animation:pop .45s cubic-bezier(.3,1.6,.5,1) both paused}
.brillo{animation:brillo 1.6s ease-in-out infinite paused}
@keyframes brillo{0%,100%{filter:drop-shadow(0 0 0 rgba(249,115,22,0))}50%{filter:drop-shadow(0 0 18px rgba(249,115,22,.9))}}
"""

JS = """
window.__fijar = (t, inicios, subs, zooms) => {
  let mov = false;
  // aparición por frase
  document.querySelectorAll('[data-en]').forEach(el => {
    const base = inicios[parseInt(el.dataset.en)] ?? 0;
    const extra = parseFloat(el.dataset.mas || '0'); // data-mas = segundos después del inicio de la frase
    el.getAnimations().forEach(a => { a.pause(); a.currentTime = Math.max(0, (t - base - extra) * 1000);
      const p = a.effect && a.effect.getComputedTiming().progress; if (p !== null && p > 0 && p < 1) mov = true; });
  });
  document.querySelectorAll('.brillo').forEach(el => el.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000; }));
  document.querySelectorAll('.vivo').forEach(el => {
    const desde = el.dataset.vivoEn !== undefined ? (inicios[parseInt(el.dataset.vivoEn)] ?? 0) : 0;
    const hasta = el.dataset.vivoHasta !== undefined ? (inicios[parseInt(el.dataset.vivoHasta)] ?? 1e9) : 1e9;
    const on = t >= desde && t < hasta; el.style.visibility = on ? 'visible' : 'hidden';
    el.getAnimations().forEach(a => { a.pause(); a.currentTime = (t - desde) * 1000 + parseFloat(el.dataset.fase || '0') * 1000; });
    if (on) mov = true;
  });
  // subtítulos
  const s = document.querySelector('.sub'); let txt = '';
  for (const x of subs) if (t >= x[0] && t < x[1]) txt = x[2];
  s.textContent = txt; s.classList.toggle('on', !!txt);
  const res = () => ({ mov, sub: txt });
  // cámara: interpolación suave entre puntos [t, escala, x, y]
  const cam = document.querySelector('.camara'); if (!cam || !zooms.length) return res();
  let a = zooms[0], b = zooms[0];
  for (let i = 0; i < zooms.length; i++) { if (zooms[i][0] <= t) { a = zooms[i]; b = zooms[i + 1] || zooms[i]; } }
  const u = b[0] > a[0] ? Math.min(1, (t - a[0]) / Math.min(1.6, b[0] - a[0])) : 1;
  const e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const L = (p, q) => p + (q - p) * e;
  cam.style.transformOrigin = `${L(a[2], b[2])}% ${L(a[3], b[3])}%`;
  cam.style.transform = `scale(${L(a[1], b[1])})`;
  if (u > 0 && u < 1 && (a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3])) mov = true;
  return res();
};
"""

def pagina(cuerpo, curso, sin_marca=False):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS_BASE}</style></head><body>
<div class="lienzo"><div class="grid"></div></div>
<div class="camara">{cuerpo}</div>
{'' if sin_marca else f'<div class="marca"><img src="data:image/png;base64,{EMBLEMA}"><div>INNOVA CONTRATISTAS<small>ACADEMIA TÉCNICA</small></div></div><div class="curso">{curso}</div>'}
<div class="sub"></div><script>{JS}</script></body></html>"""

def preparar_audio(escena, carpeta, i):
    """Genera la voz de cada frase; devuelve inicios, subtítulos, duración y el wav de la escena."""
    sr = None; partes = []; inicios = []; subs = []; t = escena.get('antes', 0.6)
    for f in escena['frases']:
        texto, hablado = (f if isinstance(f, tuple) else (f, f))
        a, sr = decir(hablado)
        inicios.append(t)
        subs.append([t, t + len(a) / sr + 0.15, texto])
        partes.append((t, a)); t += len(a) / sr + escena.get('pausa', 0.3)
    dur = t + escena.get('despues', 0.8)
    total = np.zeros(int(dur * sr) + 1, dtype=np.float32)
    for t0, a in partes:
        k = int(t0 * sr); total[k:k + len(a)] += a
    wav = carpeta / f'e{i:02d}.wav'
    with wave.open(str(wav), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(total, -1, 1) * 32767).astype(np.int16).tobytes())
    return inicios, subs, dur, wav

def hacer_musica(ruta, dur, sr=44100):
    """Fondo musical sencillo y animado (sintetizado aquí, sin derechos de autor)."""
    bpm = 108; beat = 60 / bpm; n = int(sr * dur); out = np.zeros(n, dtype=np.float32)
    prog = [(261.6, 329.6, 392.0), (220.0, 261.6, 329.6), (174.6, 220.0, 261.6), (196.0, 246.9, 293.7)]
    rnd = np.random.default_rng(3)
    for k in range(int(dur / beat) + 1):
        ch = prog[(k // 4) % 4]; s0 = int(k * beat * sr); s1 = min(n, s0 + int(beat * sr))
        if s0 >= n: break
        tt = np.arange(s1 - s0) / sr; env = np.exp(-tt * 4.5)
        for f in ch: out[s0:s1] += (0.05 * np.sin(2 * np.pi * f * tt) + 0.015 * np.sin(4 * np.pi * f * tt)) * env
        out[s0:s1] += 0.08 * np.sin(2 * np.pi * ch[0] / 2 * tt) * np.exp(-tt * 3)
        h = min(s1 - s0, int(0.05 * sr))
        if k % 2: out[s0:s0 + h] += 0.04 * rnd.standard_normal(h) * np.exp(-np.arange(h) / sr * 70)
        # arpegio suave en corcheas
        for j, f in enumerate((ch[1] * 2, ch[2] * 2)):
            a0 = s0 + int(j * beat / 2 * sr); a1 = min(n, a0 + int(beat / 2 * sr))
            if a0 < n: ta = np.arange(a1 - a0) / sr; out[a0:a1] += 0.018 * np.sin(2 * np.pi * f * ta) * np.exp(-ta * 9)
    with wave.open(ruta, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())

def render(escenas, curso, salida, solo=None, cuadros=None):
    from playwright.sync_api import sync_playwright
    carpeta = pathlib.Path(salida).with_suffix(''); carpeta.mkdir(parents=True, exist_ok=True)
    datos = []
    for i, e in enumerate(escenas):
        datos.append(preparar_audio(e, carpeta, i))
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = b.new_page(viewport={'width': W, 'height': H})
        archivos = []
        for i, (e, (inicios, subs, dur, wav)) in enumerate(zip(escenas, datos)):
            pg.set_content(pagina(e['html'], curso, e.get('sin_marca', False))); pg.wait_for_timeout(250)
            zooms = [[inicios[int(z[0])] if z[0] < len(inicios) else dur, z[1], z[2], z[3]] for z in e.get('zoom', [])] or []
            if cuadros is not None:  # solo capturas de prueba
                for c in cuadros.get(i, []):
                    pg.evaluate('([t,a,b,c]) => window.__fijar(t,a,b,c)', [c, inicios, subs, zooms])
                    pg.screenshot(path=str(carpeta / f'prueba_e{i:02d}_{c:05.1f}.jpg'), type='jpeg', quality=88)
                continue
            if solo is not None and i not in solo and (carpeta / f'e{i:02d}.mp4').exists():
                archivos.append(carpeta / f'e{i:02d}.mp4'); continue
            n = int(round(dur * FPS))
            tmp = carpeta / f'e{i:02d}.tmp.mp4'
            fade = f',fade=t=in:st=0:d=0.35,fade=t=out:st={dur-0.35:.3f}:d=0.35' if e.get('fundido', True) else ''
            ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                                   '-i', str(wav), '-vf', 'format=yuv420p' + fade, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                                   '-r', str(FPS), '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2', '-shortest', str(tmp)], stdin=subprocess.PIPE)
            previo, quieto, sub_prev, reusados = None, False, None, 0
            for k in range(n):
                est = pg.evaluate('([t,a,b,c]) => window.__fijar(t,a,b,c)', [k / FPS, inicios, subs, zooms]) or {'mov': True, 'sub': None}
                # Cuadro quieto (sin animación, sin zoom en curso, mismo subtítulo): se repite el anterior.
                if previo is not None and quieto and not est['mov'] and est['sub'] == sub_prev:
                    ff.stdin.write(previo); reusados += 1; continue
                previo = pg.screenshot(type='jpeg', quality=90)
                ff.stdin.write(previo)
                quieto, sub_prev = not est['mov'], est['sub']
            ff.stdin.close()
            if ff.wait() != 0: sys.exit(f'falló la escena {i}')
            final = carpeta / f'e{i:02d}.mp4'; tmp.rename(final); archivos.append(final)
            print(f'escena {i}: {dur:.1f} s ({reusados}/{n} cuadros repetidos)', flush=True)
        b.close()
    if cuadros is not None: return
    lista = carpeta / 'lista.txt'
    lista.write_text(''.join(f"file '{a}'\n" for a in archivos))
    unido = str(carpeta / 'unido.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', str(lista), '-c', 'copy', unido], check=True)
    dur_total = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', unido], capture_output=True, text=True).stdout)
    musica = str(carpeta / 'musica.wav'); hacer_musica(musica, dur_total)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', unido, '-i', musica, '-filter_complex',
                    '[1:a]volume=0.22,afade=t=out:st=%.2f:d=3[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5[a]' % (dur_total - 3),
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', salida], check=True)
    print('listo', salida)
