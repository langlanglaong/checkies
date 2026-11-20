import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZYeL9HFJOb0gaD7f9nzIWRSF4Xfy5tho",
  authDomain: "checkies-app.firebaseapp.com",
  projectId: "checkies-app",
  storageBucket: "checkies-app.firebasestorage.app",
  messagingSenderId: "762384811631",
  appId: "1:762384811631:web:234c579b6944b103796f9a",
  measurementId: "G-37N2GYL0J6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Sign up new user
export const signUpWithEmail = (email, password) => 
  createUserWithEmailAndPassword(auth, email, password);

// Log in existing user
export const loginWithEmail = (email, password) => 
  signInWithEmailAndPassword(auth, email, password);

// Sign in with Google Popup
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const logout = async () => await signOut(auth);