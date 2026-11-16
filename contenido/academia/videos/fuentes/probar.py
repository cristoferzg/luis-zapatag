import sys, numpy as np, sherpa_onnx
sys.path.insert(0, '/home/claude/video'); import motor
W = '/tmp/tts/sherpa-onnx-whisper-small/small-'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=W+'encoder.int8.onnx', decoder=W+'decoder.int8.onnx', tokens=W+'tokens.txt', language='es', task='transcribe', num_threads=4)
for t in open(sys.argv[1]).read().strip().split('\n'):
    a, sr = motor.decir(t); n = int(len(a)*16000/sr)
    s = rec.create_stream(); s.accept_waveform(16000, np.interp(np.linspace(0,len(a),n,endpoint=False), np.arange(len(a)), a).astype(np.float32)); rec.decode_stream(s)
    print(f'{t}\n  -> {s.result.text.strip()}')
