import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  let credentialCert = undefined;

  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    try {
      const parsedServiceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
      credentialCert = cert(parsedServiceAccount);
    } catch (e) {
      console.warn("Failed to parse FIREBASE_ADMIN_CREDENTIALS JSON:", e);
    }
  }

  if (!credentialCert) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prodexa-103";

    if (privateKey && clientEmail) {
      credentialCert = cert({
        projectId,
        clientEmail,
        privateKey,
      });
    }
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "prodexa-103";

  if (credentialCert) {
    initializeApp({
      credential: credentialCert,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "prodexa-103.firebasestorage.app",
    });
  } else {
    initializeApp({
      projectId,
    });
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();
