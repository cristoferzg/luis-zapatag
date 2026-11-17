"""Corta la grabación del dueño en frases (por las pausas) y la carga en el motor en lugar de la voz sintética.
Uso: python3 voz_propia.py <modulo_clase> <salida.mp4> audio1 [audio2 ...]"""
import sys, importlib, subprocess, re, numpy as np
import motor

SR = 44100

def cargar(ruta):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', ruta, '-ac', '1', '-ar', str(SR),
                          '-af', 'highpass=f=80,afftdn=nf=-25,loudnorm=I=-18:TP=-2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def cortar(a, n, pausa_min=0.55):
    """Busca pausas (silencios) y deja exactamente n trozos: usa las n-1 pausas más largas."""
    v = 0.02; win = int(0.03 * SR)
    e = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, mode='same'))
    umbral = max(0.012, np.percentile(e, 30) * 1.8)
    voz = e > umbral
    # tramos de silencio
    sil = []; i = 0; L = len(voz)
    while i < L:
        if not voz[i]:
            j = i
            while j < L and not voz[j]: j += 1
            sil.append((i, j)); i = j
        else: i += 1
    inicio = next((k for k in range(L) if voz[k]), 0); fin = max((k for k in range(L) if voz[k]), default=L)
    internos = [(s, t) for s, t in sil if s > inicio and t < fin and (t - s) / SR >= pausa_min * 0.6]
    if len(internos) < n - 1:
        raise SystemExit(f'Encontré {len(internos)+1} frases y el guion tiene {n}. Faltan pausas entre frases.')
    elegidos = sorted(sorted(internos, key=lambda x: x[1] - x[0], reverse=True)[:n - 1])
    cortes = [inicio] + [(s + t) // 2 for s, t in elegidos] + [fin]
    trozos = []
    for k in range(n):
        seg = a[cortes[k]:cortes[k + 1]]
        ev = e[cortes[k]:cortes[k + 1]] > umbral
        if ev.any():
            i0 = max(0, np.argmax(ev) - int(0.05 * SR)); i1 = min(len(seg), len(ev) - np.argmax(ev[::-1]) + int(0.12 * SR))
            seg = seg[i0:i1]
        trozos.append((seg.astype(np.float32), SR))
    return trozos

if __name__ == '__main__':
    mod = importlib.import_module(sys.argv[1]); salida = sys.argv[2]; audios = sys.argv[3:]
    frases = [len(e['frases']) for e in mod.E]; total = sum(frases)
    if len(audios) == len(mod.E):  # un audio por escena
        clips = [c for a, n in zip(audios, frases) for c in cortar(cargar(a), n)]
    else:
        clips = cortar(np.concatenate([cargar(a) for a in audios]), total)
    motor.VOZ_PROPIA[:] = clips
    for e in mod.E: e['pausa'] = e.get('pausa', 0.3)
    motor.render(mod.E, mod.CURSO, salida)
