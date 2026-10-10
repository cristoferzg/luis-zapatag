import { initializeApp, getApps, getApp, setLogLevel, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
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
export { app };
