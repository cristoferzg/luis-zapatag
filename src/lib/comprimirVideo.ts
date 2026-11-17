// =============================================================================
// Compresor automático de videos (tutoriales y clases) antes de subirlos.
// Re-codifica en el propio navegador con el codificador de video del equipo
// (WebCodecs, rápido y sin servidor): H.264 en MP4, máximo 1080p, con un
// bitrate pensado para grabaciones de pantalla (texto nítido) y audio AAC.
// Si el navegador no puede, o el resultado no pesa menos, se sube el original.
// =============================================================================
import { Input, Output, Conversion, BlobSource, BufferTarget, Mp4OutputFormat, ALL_FORMATS, getFirstEncodableVideoCodec } from 'mediabunny';

export const MIN_MB_COMPRIMIR = 20;   // videos más livianos se suben tal cual
const MAX_ANCHO = 1920, MAX_ALTO = 1080;

export interface ResultadoCompresion { archivo: File; comprimido: boolean; antes: number; despues: number }

/** Bitrate para que una grabación de pantalla se vea nítida: ~1.3 bit por píxel·s a 30 fps. */
const bitrateDe = (w: number, h: number) => Math.round(Math.min(4_000_000, Math.max(900_000, w * h * 1.3)));

export async function comprimirVideo(file: File, onProgreso?: (pct: number) => void): Promise<ResultadoCompresion> {
  const sinCambio: ResultadoCompresion = { archivo: file, comprimido: false, antes: file.size, despues: file.size };
  if (file.size < MIN_MB_COMPRIMIR * 1024 * 1024 || typeof VideoEncoder === 'undefined') return sinCambio;
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const pista = await input.getPrimaryVideoTrack();
    if (!pista) return sinCambio;
    const duracion = await input.computeDuration();
    const k = Math.min(1, MAX_ANCHO / pista.displayWidth, MAX_ALTO / pista.displayHeight);
    const w = Math.round((pista.displayWidth * k) / 2) * 2, h = Math.round((pista.displayHeight * k) / 2) * 2;
    const bitrate = bitrateDe(w, h);
    // Si el original ya viene liviano, no vale la pena recodificarlo.
    if (duracion > 0 && (file.size * 8) / duracion < bitrate * 1.25) return sinCambio;
    const codec = await getFirstEncodableVideoCodec(['avc', 'hevc', 'vp9'], { width: w, height: h });
    if (!codec) return sinCambio;

    const target = new BufferTarget();
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
    const conversion = await Conversion.init({
      input, output,
      video: { codec, width: w, height: h, fit: 'contain', bitrate, keyFrameInterval: 2, frameRate: 30 },
      audio: { bitrate: 128_000 }, // AAC u Opus, el que el navegador pueda codificar
    });
    if (!conversion.isValid) { console.warn('Video sin optimizar:', conversion.discardedTracks.map(d => d.reason)); return sinCambio; }
    conversion.onProgress = p => onProgreso?.(Math.round(p * 100));
    await conversion.execute();
    const buf = target.buffer;
    if (!buf || buf.byteLength >= file.size * 0.9) return sinCambio;
    const nombre = file.name.replace(/\.[^.]+$/, '') + '.mp4';
    return { archivo: new File([buf], nombre, { type: 'video/mp4' }), comprimido: true, antes: file.size, despues: buf.byteLength };
  } catch (e) {
    console.warn('No se pudo optimizar el video, se sube el original:', e);
    return sinCambio;
  } finally {
    input.dispose();
  }
}

/**
 * Deja un video grabado del 3D listo para WhatsApp y celulares: MP4 normal (no
 * fragmentado, con el índice al inicio), H.264, medidas pares, 30 cuadros/s
 * constantes y como máximo 1280 px de lado. Si el navegador no puede codificar
 * H.264, devuelve null (se usa el archivo original).
 */
export async function videoParaWhatsApp(blob: Blob): Promise<Blob | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  try {
    const pista = await input.getPrimaryVideoTrack();
    if (!pista) return null;
    const k = Math.min(1, 1280 / Math.max(pista.displayWidth, pista.displayHeight));
    const w = Math.max(2, Math.round((pista.displayWidth * k) / 2) * 2), h = Math.max(2, Math.round((pista.displayHeight * k) / 2) * 2);
    const codec = await getFirstEncodableVideoCodec(['avc'], { width: w, height: h });
    if (!codec) return null;
    const target = new BufferTarget();
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
    const conversion = await Conversion.init({
      input, output,
      video: { codec, width: w, height: h, fit: 'contain', bitrate: Math.round(Math.min(5_000_000, Math.max(1_500_000, w * h * 3))), keyFrameInterval: 2, frameRate: 30 },
      audio: { discard: true },
    });
    if (!conversion.isValid) return null;
    await conversion.execute();
    return target.buffer ? new Blob([target.buffer], { type: 'video/mp4' }) : null;
  } catch (e) {
    console.warn('No se pudo preparar el video para WhatsApp:', e);
    return null;
  } finally {
    input.dispose();
  }
}
