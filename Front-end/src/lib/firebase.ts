import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let recaptchaVerifier: RecaptchaVerifier | null = null;

/** D-20: Firebase Phone OTP. `containerId` must be a rendered, empty element
 *  (invisible reCAPTCHA mounts into it). Reused across requests in one page life. */
export function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  }
  return recaptchaVerifier;
}

export async function sendOtp(e164Phone: string, containerId: string): Promise<ConfirmationResult> {
  const verifier = getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(auth, e164Phone, verifier);
}

export async function confirmOtp(confirmation: ConfirmationResult, code: string): Promise<User> {
  const credential = await confirmation.confirm(code);
  return credential.user;
}

/** D-20: Google Sign-In, used only as a registration identity provider
 *  (never as a login method). A phone or email that already belongs to
 *  an existing account is rejected by the backend, not merged. */
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}
