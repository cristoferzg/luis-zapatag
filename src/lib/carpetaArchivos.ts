// Archivos de la Carpeta Privada: se suben a Firebase Storage y en el registro
// del cliente solo se guarda el enlace. Guardarlos en base64 dentro del
// documento hacía que Firestore los rechazara (límite de 1 MB por documento).
import { ClientFile } from '../types';
import { uploadFileToFirebaseStorage, optimizeImageFile } from './storage';

// Por debajo de este tamaño, si Storage falla, se guarda en base64 como respaldo.
const MAX_RESPALDO_BYTES = 450 * 1024;

const leerComoDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result as string);
  r.onerror = () => reject(r.error);
  r.readAsDataURL(blob);
});

// Firebase reintenta varios minutos si no hay red; se corta si no avanza en 20 s.
const SIN_AVANCE_MS = 20_000;
function subirConLimite(file: File, carpeta: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => reject(new Error('sin-avance')), SIN_AVANCE_MS);
    uploadFileToFirebaseStorage(file, carpeta, () => {
      clearTimeout(timer);
      timer = setTimeout(() => reject(new Error('sin-avance')), SIN_AVANCE_MS);
    }).then(url => { clearTimeout(timer); resolve(url); }, err => { clearTimeout(timer); reject(err); });
  });
}

const fechaHora = () =>
  new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

const carpetaDe = (clienteId: string) => `carpeta_privada/${clienteId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

export async function prepararArchivoCarpeta(file: File, tipo: ClientFile['type'], clienteId: string): Promise<ClientFile> {
  let archivo: File = file;
  if (file.type.startsWith('image/')) {
    try { archivo = await optimizeImageFile(file); } catch { archivo = file; }
  }
  let url: string;
  try {
    url = await subirConLimite(archivo, carpetaDe(clienteId));
  } catch (err) {
    if (archivo.size > MAX_RESPALDO_BYTES) {
      throw new Error(`No se pudo subir "${file.name}" a la nube (${(archivo.size / 1024 / 1024).toFixed(1)} MB). Revisa tu conexión e inténtalo de nuevo.`);
    }
    url = await leerComoDataUrl(archivo);
  }
  return {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: file.name,
    type: tipo,
    dataUrl: url,
    uploadedAt: fechaHora(),
    size: (archivo.size / 1024).toFixed(1) + ' KB',
  };
}

// Sube a Storage los archivos antiguos guardados en base64 que hacen que el
// documento del cliente supere el límite de Firestore. Si alguno falla, queda igual.
export async function migrarArchivosPesados(files: ClientFile[], clienteId: string): Promise<ClientFile[]> {
  return Promise.all(files.map(async f => {
    if (!f.dataUrl?.startsWith('data:') || f.dataUrl.length < 200_000) return f;
    try {
      const blob = await (await fetch(f.dataUrl)).blob();
      const url = await subirConLimite(new File([blob], f.name, { type: blob.type }), carpetaDe(clienteId));
      return { ...f, dataUrl: url };
    } catch {
      return f;
    }
  }));
}
