/**
 * Innova Contratistas — server-side PIN authentication (Option B).
 *
 * Goal: keep the familiar 6-digit PIN login UX, but make it trustworthy.
 * Instead of the browser reading the `usuarios` collection and comparing PINs
 * (which forces that collection to be world-readable and leaks every PIN),
 * the PIN is verified HERE, on the server, with the Admin SDK (which bypasses
 * security rules). The function returns a Firebase custom token carrying
 * verified claims (role + workspace). The client signs in with that token, so
 * `request.auth.uid` and `request.auth.token.role` become trustworthy and the
 * Firestore rules can enforce real per-workspace isolation.
 *
 * With this in place:
 *   - The `usuarios` collection no longer needs to be readable by normal
 *     clients — only admins (and this function) can read it.
 *   - A short PIN is no longer brute-forceable offline from the bundle, because
 *     nothing about the PIN ships in the client, and verification is rate-limit
 *     -able on the server.
 *
 * DEPLOY (requires the Firebase Blaze plan, which Cloud Functions need):
 *   1. cd functions && npm install
 *   2. Set the master admin PIN as a secret (do NOT hardcode it):
 *        firebase functions:secrets:set ADMIN_PIN
 *   3. firebase deploy --only functions
 *   4. Wire the client to call loginWithPin (see src/lib/pinAuth.ts) and only
 *      then deploy the claims-based rules in firestore.rules.phase3.
 *
 * This file is NOT wired into the running app yet; adding it changes nothing
 * until you deploy it and switch the client over.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash, timingSafeEqual } from 'node:crypto';

initializeApp();
const db = getFirestore();

const sha256Buf = (s) => createHash('sha256').update(String(s).trim()).digest();
// Constant-time comparison of two secrets (compared via their fixed-length
// SHA-256 digests so timingSafeEqual always gets equal-length buffers).
const secretsEqual = (a, b) => {
  try {
    return timingSafeEqual(sha256Buf(a), sha256Buf(b));
  } catch (_) {
    return false;
  }
};

/**
 * loginWithPin({ pin }) -> { token, role, workspace, name }
 * The client then calls signInWithCustomToken(token).
 */
export const loginWithPin = onCall(
  { secrets: ['ADMIN_PIN'], region: 'us-central1', cors: true },
  async (request) => {
    const pin = String(request.data?.pin || '').trim();

    if (!/^\d{6}$/.test(pin)) {
      throw new HttpsError('invalid-argument', 'El PIN debe tener 6 dígitos.');
    }

    // 1) Master administrator PIN (stored as a server secret, never in the bundle).
    const adminPin = process.env.ADMIN_PIN || '';
    if (adminPin && secretsEqual(pin, adminPin)) {
      const claims = { role: 'admin', workspace: 'admin' };
      const token = await getAuth().createCustomToken('admin', claims);
      return { token, role: 'admin', workspace: 'admin', name: 'Innova Contratistas' };
    }

    // 2) Registered users. Admin SDK bypasses rules, so the client never needs
    //    read access to this collection.
    const snap = await db.collection('usuarios').where('pin', '==', pin).limit(1).get();
    if (snap.empty) {
      // Generic message — do not reveal whether a PIN exists.
      throw new HttpsError('permission-denied', 'PIN no válido.');
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data() || {};
    if (data.isActive === false) {
      throw new HttpsError('permission-denied', 'Usuario desactivado.');
    }

    const uid = docSnap.id;
    const role = data.role === 'admin' ? 'admin' : 'user';
    // workspace MUST equal the `userId` the client stores on each record so the
    // Phase-3 rule `resource.data.userId == token.workspace` matches. The client
    // derives its id from `workspace` by stripping any `user_` prefix, and writes
    // records with that stripped value — and legacy records already use the bare
    // `usuarios` doc id. So the workspace claim must be the bare doc id (no prefix),
    // otherwise users get locked out of their own (and existing) data.
    const workspace = role === 'admin' ? 'admin' : uid;

    // Best-effort last-login stamp.
    try {
      await docSnap.ref.set(
        { lastLogin: new Date().toISOString(), lastLoginTimestamp: Date.now() },
        { merge: true }
      );
    } catch (_) { /* ignore */ }

    const token = await getAuth().createCustomToken(uid, { role, workspace });
    return { token, role, workspace, name: data.name || 'Usuario' };
  }
);
