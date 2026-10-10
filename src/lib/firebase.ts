import { initializeApp, getApps, getApp, setLogLevel, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import config from '../../firebase-applet-config.json';

setLogLevel('silent');

// Primary storage bucket for Innova Contratistas cloud
export const PRIMARY_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'innovacontratistas-434d2.firebasestorage.app';

const firebaseConfig = {
  apiKey: config.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: config.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.storageBucket || PRIMARY_STORAGE_BUCKET,
  messagingSenderId: config.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

const explicitDbId = (config as any).firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID;
const currentProjectId = config.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Use custom db instance in sandbox environment, or '(default)' in user Blaze project
const targetDbId = currentProjectId === 'innovacontratistas-434d2' ? undefined : (explicitDbId || undefined);

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db: Firestore = (targetDbId && targetDbId !== '(default)')
  ? getFirestore(app, targetDbId)
  : getFirestore(app);

export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

/**
 * Ensures there is always a Firebase Auth session (anonymous) so that every
 * Firestore/Storage request carries request.auth != null. This lets the
 * security rules reject completely unauthenticated traffic (e.g. scripts that
 * only have the public web API key) instead of leaving the database open.
 *
 * It is best-effort and non-blocking: if sign-in fails (offline, provider not
 * enabled yet), the app still renders. The PIN login flow is unchanged.
 *
 * NOTE: Enable the "Anonymous" provider in Firebase Console → Authentication →
 * Sign-in method BEFORE deploying the stricter Firestore rules, otherwise all
 * reads/writes will be denied.
 */
let authReadyResolve: ((v: boolean) => void) | undefined;
let authReadySettled = false;
// Resolves once there is an auth session (anonymous or restored), or once we
// know sign-in is unavailable. Consumers (e.g. Firestore subscriptions) await
// this so their first request is not sent before request.auth exists.
export const authReady: Promise<boolean> = new Promise((resolve) => {
  authReadyResolve = resolve;
});
const settleAuthReady = (ok: boolean) => {
  if (authReadySettled) return;
  authReadySettled = true;
  authReadyResolve?.(ok);
};

let anonymousStarted = false;

export function ensureAnonymousAuth(): void {
  try {
    // onAuthStateChanged is the source of truth. On reload it fires first with
    // any *restored* session (e.g. a custom-token admin/user session), so we
    // must NOT sign in anonymously before this callback runs — otherwise we
    // would overwrite the restored session and its role/workspace claims.
    onAuthStateChanged(auth, (user) => {
      if (user) {
        settleAuthReady(true);
        return;
      }
      // No session (first visit, or signed out): establish an anonymous one once.
      if (!anonymousStarted) {
        anonymousStarted = true;
        signInAnonymously(auth).catch((err) => {
          // Non-blocking: run in offline/cached mode if sign-in is unavailable.
          console.warn('[auth] anonymous sign-in unavailable:', err?.code || err?.message || err);
          settleAuthReady(false);
        });
      }
    });

    // Safety net: never leave consumers awaiting forever if Auth is unreachable.
    setTimeout(() => settleAuthReady(false), 8000);
  } catch (err) {
    console.warn('[auth] ensureAnonymousAuth failed:', err);
    settleAuthReady(false);
  }
}

export { app };
