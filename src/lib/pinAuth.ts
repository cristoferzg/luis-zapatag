/**
 * Ingreso por PIN verificado en el servidor (Cloud Function `loginWithPin`).
 * El navegador nunca lee la lista de usuarios ni compara PIN: recibe un token firmado
 * con { role, workspace } y entra con él. Si el servidor no responde, no se entra.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { app, auth } from './firebase';

export interface PinLoginResult {
  token: string;
  role: 'admin' | 'user' | 'pendiente';
  workspace: string;
  name: string;
  /** 'pendiente' = cuenta creada desde la app que aún no pagó la membresía. */
  membresia?: 'pendiente';
}

/**
 * Verifies the PIN server-side and establishes a real Firebase Auth session
 * carrying verified { role, workspace } claims.
 *
 * @param pin 6-digit PIN
 * @param region Cloud Functions region (must match the function deployment)
 */
export async function loginWithPinViaFunction(
  pin: string,
  celular?: string,
  region: string = 'us-central1'
): Promise<PinLoginResult> {
  const functions = getFunctions(app, region);
  const callable = httpsCallable<{ pin: string; celular?: string }, PinLoginResult>(functions, 'loginWithPin');
  const { data } = await callable(celular ? { pin: pin.trim(), celular: celular.replace(/\D/g, '') } : { pin: pin.trim() });

  // Establish the authenticated session from the server-minted token.
  await signInWithCustomToken(auth, data.token);

  return data;
}
