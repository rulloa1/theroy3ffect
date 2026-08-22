import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { getFirebaseConfig } from "./config";

interface FirebaseContextValue {
  ready: boolean;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Firebase is only pulled into the bundle when a complete config is present.
    // This keeps ~200kB of SDK out of the initial page load for every visitor.
    if (!getFirebaseConfig()) return;

    let cancelled = false;

    void import("./client")
      .then(async (mod) => {
        const app = mod.initializeFirebase();
        if (cancelled) return;
        setReady(!!app);
        if (app) await mod.getFirebaseAnalytics().catch(() => null);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });

    return () => {
      cancelled = true;
    };
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
