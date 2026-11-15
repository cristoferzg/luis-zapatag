# Videos de la Academia

- `naves-clase-1.mp4`: Naves Parabólicas · Clase 1 (7:41, 1080p). Formato aprobado por el dueño: voz es-MX ágil (vel. 1.12) con música
  sintetizada de fondo; teoría animada + ejemplo resuelto con números + práctica con pantallas reales de InnovApp → Techos Metálicos
  (cursor, clic, resaltado y zoom) + errores comunes + reto. Pantallas en `fuentes/pantallas/` (capturadas del módulo real).
- Generador: `fuentes/motor.py` (escenas HTML animadas + voz con sherpa-onnx `vits-piper-es_MX-claude-high`,
  modelo descargado de las versiones de k2-fsa/sherpa-onnx en GitHub a `/tmp/tts/`). Cada clase es un archivo
  `fuentes/naves_cNv2.py` con sus escenas. `python3 naves_clase1.py prueba` saca cuadros de control;
  sin argumento renderiza el video completo. Normalizar el audio al final (loudnorm I=-16).
- Subir con el MCP: `subir_archivo` (url cruda de GitHub de este archivo) → `guardar_clase` con esa `videoUrl`.

- Naves Parabólicas completo: `naves-clase-1.mp4` … `naves-clase-9.mp4` (fuentes `fuentes/naves_c1v2.py`, `naves_c2.py` … `naves_c9.py`;
  piezas comunes en `fuentes/comun.py`). El motor repite los cuadros quietos (render ~4 veces más rápido).
