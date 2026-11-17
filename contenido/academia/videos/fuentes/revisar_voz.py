"""Revisa la pronunciación: genera cada frase con la voz y la transcribe con whisper (es)."""
import sys, importlib, numpy as np, sherpa_onnx
sys.path.insert(0, '/home/claude/video')
import motor
mod = importlib.import_module(sys.argv[1])
W = '/tmp/tts/sherpa-onnx-whisper-small/small-'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=W+'encoder.int8.onnx', decoder=W+'decoder.int8.onnx', tokens=W+'tokens.txt', language='es', task='transcribe', num_threads=4)
def resample(a, sr, to=16000):
    n = int(len(a) * to / sr); return np.interp(np.linspace(0, len(a), n, endpoint=False), np.arange(len(a)), a).astype(np.float32)
for i, e in enumerate(mod.E):
    for f in e['frases']:
        txt, hab = f if isinstance(f, tuple) else (f, f)
        a, sr = motor.decir(hab)
        s = rec.create_stream(); s.accept_waveform(16000, resample(a, sr)); rec.decode_stream(s)
        print(f'[{i}] DICE : {hab}\n    OÍDO : {s.result.text.strip()}\n')
