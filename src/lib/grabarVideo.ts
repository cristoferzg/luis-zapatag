// =============================================================================
// Grabación de los visores 3D. Se graba en MP4 (H.264) cuando el navegador lo
// permite —se abre en cualquier celular, WhatsApp o PC—; si no, en WebM.
// =============================================================================

const MP4 = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1.4D401F', 'video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4;codecs=avc3', 'video/mp4;codecs=h264', 'video/mp4'];
const WEBM = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

export function formatoVideo(): { mime: string; ext: 'mp4' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const ok = (m: string) => { try { return (MediaRecorder as any).isTypeSupported?.(m) === true; } catch { return false; } };
  const mp4 = MP4.find(ok);
  if (mp4) return { mime: mp4, ext: 'mp4' };
  const webm = WEBM.find(ok);
  return webm ? { mime: webm, ext: 'webm' } : null;
}

export const puedeGrabar = (canvas?: HTMLCanvasElement | null) =>
  !!canvas && typeof (canvas as any).captureStream === 'function' && !!formatoVideo();

/**
 * Graba el canvas durante `duracionMs` (o hasta llamar a detener) y descarga
 * el archivo `<nombre>_<fecha>.mp4`. Devuelve null si no se puede grabar.
 */
export function grabarCanvas(canvas: HTMLCanvasElement, nombre: string, opts: { duracionMs?: number; onFin?: (ext: string) => void; onPreparando?: () => void } = {}) {
  const fmt = formatoVideo();
  if (!fmt || typeof (canvas as any).captureStream !== 'function') return null;
  const stream = (canvas as any).captureStream(30) as MediaStream;
  const recorder = new MediaRecorder(stream, { mimeType: fmt.mime, videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  let timer = 0;
  recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = async () => {
    window.clearTimeout(timer);
    stream.getTracks().forEach(t => t.stop());
    let blob = new Blob(chunks, { type: fmt.mime.split(';')[0] });
    let ext: string = fmt.ext;
    // La grabación del navegador sale como MP4 fragmentado (o WebM) que WhatsApp no
    // reconoce: se convierte a un MP4 normal H.264. Si no se puede, queda el original.
    opts.onPreparando?.();
    try {
      const { videoParaWhatsApp } = await import('./comprimirVideo');
      const listo = await videoParaWhatsApp(blob);
      if (listo) { blob = listo; ext = 'mp4'; }
    } catch { /* se descarga el original */ }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}_${new Date().toISOString().split('T')[0]}.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    opts.onFin?.(ext);
  };
  recorder.start(1000);
  const detener = () => { if (recorder.state !== 'inactive') recorder.stop(); };
  if (opts.duracionMs) timer = window.setTimeout(detener, opts.duracionMs);
  return { detener, ext: fmt.ext };
}
