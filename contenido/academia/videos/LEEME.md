# Videos de la Academia

- `naves-clase-1.mp4`: Naves Parabólicas · Clase 1 (1080p, voz IA femenina es-MX, subtítulos, animaciones).
- Generador: `fuentes/motor.py` (escenas HTML animadas + voz con sherpa-onnx `vits-piper-es_MX-claude-high`,
  modelo descargado de las versiones de k2-fsa/sherpa-onnx en GitHub a `/tmp/tts/`). Cada clase es un archivo
  `fuentes/<curso>_claseN.py` con sus escenas. `python3 naves_clase1.py prueba` saca cuadros de control;
  sin argumento renderiza el video completo. Normalizar el audio al final (loudnorm I=-16).
- Subir con el MCP: `subir_archivo` (url cruda de GitHub de este archivo) → `guardar_clase` con esa `videoUrl`.
