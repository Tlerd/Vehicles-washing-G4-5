import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCuMpSGMS2RbXhtBHi98nuy-Xcv5ewI_tE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "washpro-116cd.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "washpro-116cd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "washpro-116cd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "941416412328",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:941416412328:web:d0d9305626899136f73e9d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S7GS5TKWXZ"
};

// Check if Firebase app is already initialized, otherwise initialize it
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
