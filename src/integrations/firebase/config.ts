import { z } from "zod";

export const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
  measurementId: z.string().optional(),
});

export type FirebaseConfig = z.infer<typeof firebaseConfigSchema>;

export function getFirebaseConfig(): FirebaseConfig | null {
  const raw = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  const result = firebaseConfigSchema.safeParse(raw);
  if (!result.success) {
    console.warn(
      `[Firebase] Client config incomplete. Set all VITE_FIREBASE_* environment variables. ${result.error.message}`
    );
    return null;
  }

  return result.data;
}
