"""Corta la grabación por pausas y transcribe cada trozo (para alinear con el guion)."""
import sys, json, numpy as np, sherpa_onnx
import voz_propia as v
SR = v.SR
a = v.cargar(sys.argv[1]); salida = sys.argv[2]
win = int(0.03 * SR); e = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, mode='same'))
um = max(0.012, np.percentile(e, 30) * 1.8); voz = e > um
# tramos de voz separados por silencios >= 0.35 s
tr = []; i = 0; L = len(voz); ini = None; sil = 0
while i < L:
    if voz[i]:
        if ini is None: ini = i
        sil = 0
    else:
        sil += 1
        if ini is not None and sil >= int(0.35 * SR):
            tr.append((ini, i - sil + 1)); ini = None
    i += 1
if ini is not None: tr.append((ini, L))
tr = [(s, t) for s, t in tr if (t - s) / SR > 0.15]
M = '/tmp/tts/sherpa-onnx-whisper-small/'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=M + 'small-encoder.int8.onnx', decoder=M + 'small-decoder.int8.onnx', tokens=M + 'small-tokens.txt', language='es', task='transcribe', num_threads=2)

out = []
for s, t in tr:
    seg = a[max(0, s - 1600):min(L, t + 1600)]
    seg16 = np.interp(np.arange(0, len(seg), SR / 16000), np.arange(len(seg)), seg).astype(np.float32)
    st = rec.create_stream(); st.accept_waveform(16000, seg16); rec.decode_stream(st)
    out.append({'s': s / SR, 't': t / SR, 'txt': st.result.text.strip()})
    print(f"{s/SR:7.2f} {t/SR:7.2f} {out[-1]['txt']}", flush=True)
json.dump(out, open(salida, 'w'), ensure_ascii=False)
