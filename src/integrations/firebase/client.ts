import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

import { getFirebaseConfig } from "./config";

export let firebaseApp: FirebaseApp | null = null;

export function initializeFirebase(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;

  const config = getFirebaseConfig();
  if (!config) {
    return null;
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
    ...(config.measurementId ? { measurementId: config.measurementId } : {}),
  });
  return firebaseApp;
}

export function getFirebaseAuth() {
  const app = initializeFirebase();
  if (!app) throw new Error("Firebase is not initialized.");
  return getAuth(app);
}

export function getFirebaseFirestore() {
  const app = initializeFirebase();
  if (!app) throw new Error("Firebase is not initialized.");
  return getFirestore(app);
}

export function getFirebaseStorage() {
  const app = initializeFirebase();
  if (!app) throw new Error("Firebase is not initialized.");
  return getStorage(app);
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  const app = initializeFirebase();
  if (!app) return null;
  if (typeof window === "undefined") return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  return getAnalytics(app);
}
