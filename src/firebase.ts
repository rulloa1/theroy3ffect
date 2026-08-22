import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your Firebase API key
  authDomain: "theroyeffect-d814e.firebaseapp.com",
  projectId: "theroyeffect-d814e",
  storageBucket: "theroyeffect-d814e.firebasestorage.app",
  messagingSenderId: "160788724375",
  appId: "YOUR_APP_ID", // Replace with your Firebase app ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export default app;
