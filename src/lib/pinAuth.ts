/**
 * Client helper for Option B (server-side PIN auth).
 *
 * This IS now wired into handlePinLogin in App.tsx as the preferred login path,
 * with a safe fallback: if the Cloud Function is not deployed yet, login falls
 * back to the legacy client-side flow, so the app works before and after the
 * phase-3 rollout. See SECURITY.md.
 *
 * Why: today the browser queries the `usuarios` collection and compares PINs,
 * which requires that collection to be readable by clients and exposes every
 * PIN. With this flow the PIN is verified on the server; the client only
 * receives a signed custom token and signs in with it.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { app, auth } from './firebase';

export interface PinLoginResult {
  token: string;
  role: 'admin' | 'user';
  workspace: string;
  name: string;
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
  region: string = 'us-central1'
): Promise<PinLoginResult> {
  const functions = getFunctions(app, region);
  const callable = httpsCallable<{ pin: string }, PinLoginResult>(functions, 'loginWithPin');
  const { data } = await callable({ pin: pin.trim() });

  // Establish the authenticated session from the server-minted token.
  await signInWithCustomToken(auth, data.token);

  return data;
}
