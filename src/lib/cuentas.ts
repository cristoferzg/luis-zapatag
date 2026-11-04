// Cuentas creadas desde la app (registro propio) y su membresía de pago único.
//  - Registro: nombre, celular y PIN (Cloud Function `registrarCuenta`). Se entra con celular + PIN.
//  - Hasta pagar, el servidor da una sesión "pendiente" que no puede leer ni escribir datos.
//  - Pago: Google Play en la app de Android (producto `membresia_unica`); Yape en la web/PC
//    (`solicitarMembresia` → el admin lo valida en "Validar Compras").
//  - Borrar la cuenta (`eliminarMiCuenta`): lo exige Google Play para apps con registro.
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';

export interface ConfigMembresia { registroAbierto?: boolean; precioSoles?: number; yapeNumero?: string; yapeNombre?: string }
export const PRODUCTO_MEMBRESIA = 'membresia_unica';
const fn = <T = any>(nombre: string) => httpsCallable<any, T>(getFunctions(app, 'us-central1'), nombre);

export async function leerConfigMembresia(): Promise<ConfigMembresia> {
  if (import.meta.env.DEV && (window as any).__membresiaSimulada) return (window as any).__membresiaSimulada;
  try { const s = await getDoc(doc(db, 'config_ia', 'membresia')); return s.exists() ? (s.data() as ConfigMembresia) : {}; } catch { return {}; }
}
export const guardarConfigMembresia = (c: ConfigMembresia) => setDoc(doc(db, 'config_ia', 'membresia'), JSON.parse(JSON.stringify(c)), { merge: true });

export const registrarCuenta = async (nombre: string, celular: string, pin: string) => (await fn('registrarCuenta')({ nombre, celular, pin })).data;
export const solicitarMembresiaYape = async () => (await fn<{ ok: boolean; yaActiva?: boolean; yaEnviada?: boolean }>('solicitarMembresia')({})).data;
export const eliminarMiCuenta = async () => (await fn<{ ok: boolean }>('eliminarMiCuenta')({})).data;

/** Mensaje claro para los errores del registro. */
export function mensajeRegistro(e: any): string {
  const t = `${e?.message || ''} ${e?.code || ''}`;
  if (/CELULAR_REGISTRADO/.test(t)) return 'Ese celular ya tiene una cuenta. Entra con tu celular y tu PIN.';
  if (/PIN_FACIL/.test(t)) return 'Ese PIN es muy fácil de adivinar. Elige otro (no 123456 ni números repetidos).';
  if (/REGISTRO_CERRADO/.test(t)) return 'Por ahora no se están creando cuentas nuevas.';
  if (/resource-exhausted/.test(t)) return 'Se crearon demasiadas cuentas desde esta conexión hoy. Inténtalo mañana.';
  if (/invalid-argument/.test(t)) return e?.message || 'Revisa los datos.';
  return 'No se pudo crear la cuenta. Revisa tu conexión e inténtalo de nuevo.';
}
