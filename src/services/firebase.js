import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID
} = import.meta.env;

// Normalize the configured bucket while preserving custom names; only strip schemes like gs:// or https://
const normalizeStorageBucket = (bucket, projectId) => {
  const raw = bucket?.trim() || (projectId ? `${projectId}.appspot.com` : undefined);
  if (!raw) return undefined;

  return raw
    .replace(/^gs:\/\//, '')
    .replace(/^https?:\/\//, '');
};

const resolvedStorageBucket = normalizeStorageBucket(VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_PROJECT_ID);

const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: resolvedStorageBucket,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = resolvedStorageBucket ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = () => {
  return signOut(auth);
};
