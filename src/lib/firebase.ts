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
let authReadyResolve: (v: boolean) => void;
export const authReady: Promise<boolean> = new Promise((resolve) => {
  authReadyResolve = resolve;
});

export function ensureAnonymousAuth(): void {
  try {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        authReadyResolve?.(true);
      }
    });
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        // Do not block the UI: log quietly and let the app run in offline/cached mode.
        console.warn('[auth] anonymous sign-in unavailable:', err?.code || err?.message || err);
        authReadyResolve?.(false);
      });
    } else {
      authReadyResolve?.(true);
    }
  } catch (err) {
    console.warn('[auth] ensureAnonymousAuth failed:', err);
    authReadyResolve?.(false);
  }
}

export { app };
