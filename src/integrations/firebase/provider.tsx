import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { initializeFirebase, getFirebaseAnalytics } from "./client";

interface FirebaseContextValue {
  ready: boolean;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const app = initializeFirebase();
    setReady(!!app);

    if (app) {
      getFirebaseAnalytics().catch(() => null);
    }
  }, []);

  return (
    <FirebaseContext.Provider value={{ ready }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error("useFirebase must be used within FirebaseProvider");
  return ctx;
}
