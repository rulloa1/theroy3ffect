export { getFirebaseConfig, type FirebaseConfig } from "./config";
export {
  initializeFirebase,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
  getFirebaseAnalytics,
  firebaseApp,
} from "./client";
export { FirebaseProvider, useFirebase } from "./provider";
