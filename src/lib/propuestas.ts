// =============================================================================
// Propuestas publicadas para el cliente (link público). Se guarda una copia de
// la propuesta (opciones, imagen, escena 3D) en `propuestas/<id>`; el cliente
// la abre sin PIN con ?propuesta=<id>, la ve en 3D y la acepta. Solo puede
// cambiar los campos de aceptación (ver firestore.rules).
//
// Privacidad: el contenido (proyecto, cliente, precios, fotos, 3D) se guarda
// CIFRADO (AES-GCM) con una llave que sale del DNI o celular del cliente
// (PBKDF2). En la base solo queda el texto cifrado, el nombre de la empresa y
// el estado; sin ese dato nadie puede ver la propuesta, aunque tenga el link.
// =============================================================================
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth, authReady } from './firebase';
import { safeStorage } from './storageManager';

export interface PropuestaPublica {
  empresa: { nombre: string; telefono: string; ruc: string; logo: string; color: string };
  proyecto: string; cliente: string; ubicacion: string;
  opciones: { nombre: string; cobertura: string; nota: string; total: number; recomendada: boolean }[];
  imagen: string; antes: string;
  carta?: string;
  escena: { nodes: any; segments: any; coverageZones: any };
  incluye: string[];
  estado?: 'enviada' | 'aceptada';
  aceptadaOpcion?: number; aceptadaNombre?: string; aceptadaEn?: string;
  creadaEn?: string; autor?: string;
}

/** Lo que queda a la vista en la base (el resto va cifrado). */
interface DocCifrado {
  v: 2; sal: string; iv: string; cifrado: string; comprimido?: boolean;
  pista: 'dni' | 'celular' | 'clave';
  empresa: { nombre: string; color: string; logo: string };
  estado?: 'enviada' | 'aceptada'; aceptadaOpcion?: number; aceptadaNombre?: string; aceptadaEn?: string;
  creadaEn?: string; autor?: string;
}

/** Solo dígitos: '987 654 321' → '987654321'. */
export const normalizarClave = (t: string) => (t || '').replace(/\D/g, '');
export const claveValida = (t: string) => { const n = normalizarClave(t).length; return n >= 8 && n <= 12; };
const pistaDe = (clave: string): DocCifrado['pista'] => { const n = normalizarClave(clave).length; return n === 8 ? 'dni' : n === 9 ? 'celular' : 'clave'; };

const b64 = (u: Uint8Array) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const deB64 = (t: string) => Uint8Array.from(atob(t), c => c.charCodeAt(0));
const ITER = 210_000;
async function llave(clave: string, sal: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normalizarClave(clave)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal as BufferSource, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const hayGzip = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
const pasar = async (u: Uint8Array, t: TransformStream<Uint8Array, Uint8Array>) => new Uint8Array(await new Response(new Blob([u as BlobPart]).stream().pipeThrough(t)).arrayBuffer());

async function cifrar(obj: unknown, clave: string) {
  const sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  let datos = new TextEncoder().encode(JSON.stringify(obj));
  const comprimido = hayGzip();
  if (comprimido) datos = await pasar(datos, new CompressionStream('gzip'));
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await llave(clave, sal), datos));
  return { sal: b64(sal), iv: b64(iv), cifrado: b64(c), comprimido };
}

async function descifrar<T>(d: DocCifrado, clave: string): Promise<T | null> {
  try {
    const plano = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(d.iv) }, await llave(clave, deB64(d.sal)), deB64(d.cifrado)));
    const u = d.comprimido ? await pasar(plano, new DecompressionStream('gzip')) : plano;
    return JSON.parse(new TextDecoder().decode(u)) as T;
  } catch { return null; } // dato incorrecto
}

const K_MIAS = 'innova_propuestas_enviadas';
export const propuestasEnviadas = () => safeStorage.getItem<{ id: string; proyecto: string; cliente: string; fecha: string }[]>(K_MIAS, []) || [];

/** Publica la propuesta cifrada con el DNI o celular del cliente (`clave`). */
export async function publicarPropuesta(p: PropuestaPublica, clave: string): Promise<string> {
  if (!claveValida(clave)) throw new Error('Escribe el DNI (8 dígitos) o el celular (9 dígitos) del cliente.');
  const creadaEn = new Date().toISOString();
  const contenido: PropuestaPublica = JSON.parse(JSON.stringify(p));
  const armar = async (): Promise<DocCifrado> => ({
    v: 2, ...(await cifrar(contenido, clave)), pista: pistaDe(clave),
    empresa: { nombre: p.empresa.nombre, color: p.empresa.color, logo: p.empresa.logo },
    estado: 'enviada', creadaEn, autor: auth.currentUser?.uid || '',
  });
  const pesa = (d: DocCifrado) => new Blob([JSON.stringify(d)]).size;
  let datos = await armar();
  if (pesa(datos) > 950_000) {
    // Firestore admite ~1 MB por documento: se quita la foto "antes" y, si aún no entra, la escena.
    contenido.antes = ''; datos = await armar();
    if (pesa(datos) > 950_000) { contenido.escena = { nodes: {}, segments: {}, coverageZones: {} }; datos = await armar(); }
    if (pesa(datos) > 950_000) { datos.empresa.logo = ''; }
    if (pesa(datos) > 950_000) throw new Error('La propuesta es demasiado grande para el link (quita la foto real o usa una imagen más pequeña).');
  }
  if (import.meta.env.DEV && (window as any).__publicarSimulado) { (window as any).__propuestaPublicada = datos; return 'demo'; }
  await authReady;
  const ref = await addDoc(collection(db, 'propuestas'), datos);
  safeStorage.setItem(K_MIAS, [{ id: ref.id, proyecto: p.proyecto, cliente: p.cliente, fecha: creadaEn }, ...propuestasEnviadas()].slice(0, 30));
  return ref.id;
}

// En desarrollo (capturas de prueba) se puede simular sin tocar la base de datos.
const simulada = () => (import.meta.env.DEV ? (window as any).__propuestaSimulada as (PropuestaPublica | DocCifrado) | undefined : undefined);

/** Lo que se ve antes de escribir el DNI/celular. */
export type PropuestaBloqueada = { bloqueada: true; pista: DocCifrado['pista']; empresa: DocCifrado['empresa']; doc: DocCifrado };

export async function leerPropuesta(id: string): Promise<PropuestaPublica | PropuestaBloqueada | null> {
  let d: any = simulada();
  if (!d) {
    await authReady;
    const s = await getDoc(doc(db, 'propuestas', id));
    if (!s.exists()) return null;
    d = s.data();
  }
  if (d?.v === 2 && d.cifrado) return { bloqueada: true, pista: d.pista, empresa: d.empresa || { nombre: '', color: '', logo: '' }, doc: d };
  return d as PropuestaPublica; // links anteriores (sin cifrar)
}

/** Abre una propuesta cifrada con el DNI/celular. null = dato incorrecto. */
export async function abrirPropuesta(b: PropuestaBloqueada, clave: string): Promise<PropuestaPublica | null> {
  const c = await descifrar<PropuestaPublica>(b.doc, clave);
  if (!c) return null;
  const { estado, aceptadaOpcion, aceptadaNombre, aceptadaEn, creadaEn } = b.doc;
  return { ...c, estado, aceptadaOpcion, aceptadaNombre, aceptadaEn, creadaEn };
}

export async function aceptarPropuesta(id: string, opcion: number, nombre: string) {
  if (simulada()) return;
  await authReady;
  await updateDoc(doc(db, 'propuestas', id), { estado: 'aceptada', aceptadaOpcion: opcion, aceptadaNombre: nombre.slice(0, 120), aceptadaEn: new Date().toISOString() });
}
