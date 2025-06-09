// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDlYMYl0llL-mSF7yDo21sQP2tF4X9xol4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ywc-storage.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ywc-storage",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ywc-storage.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "685075746401",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:685075746401:web:bc281fa4ba9233d0eee420"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Function to ensure user is authenticated for storage operations (optional for development)
export const ensureFirebaseAuth = async (): Promise<void> => {
  // Skip authentication for development - Firebase Storage rules will handle access
  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log("Development mode: Skipping Firebase authentication");
    return;
  }
  
  // For production, attempt anonymous authentication
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("Authenticated with Firebase anonymously for storage access");
    } catch (error) {
      console.warn("Firebase authentication failed, proceeding without auth:", error);
      // Don't throw error - let storage rules handle access control
    }
  }
};

export default app; 