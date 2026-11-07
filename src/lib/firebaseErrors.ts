import { auth } from './firebase';

export interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  const isQuotaError = errorMessage.toLowerCase().includes('resource-exhausted') || 
                        errorMessage.toLowerCase().includes('resource_exhausted') ||
                        (errorMessage.toLowerCase().includes('quota') && errorMessage.toLowerCase().includes('exceeded'));

  if (errorMessage.includes('Could not reach Cloud Firestore') || errorMessage.includes('offline') || errorMessage.includes('unavailable')) {
    console.warn('Firestore Offline/Connectivity Warning: ', JSON.stringify(errInfo));
  } else if (isQuotaError) {
    console.warn('Firestore Quota Warning: ', JSON.stringify(errInfo));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firestore-quota-error', { detail: errInfo }));
    }
  } else {
    // Log as warning and gracefully fall back instead of throwing unhandled exceptions that crash the app
    console.warn('Firestore Warning/Permission Notice: ', JSON.stringify(errInfo));
  }
}
