/**
 * Firebase Client Configuration (Frontend)
 *
 * ARCHITECTURE DECISION: Client-side Firebase SDK
 *
 * Why separate from backend config:
 * - Backend: Uses Admin SDK (full database access)
 * - Frontend: Uses Client SDK (user-level permissions)
 *
 * Security model:
 * Backend (Admin): Can read/write everything (server-to-server)
 * Frontend (Client): Follows Firestore security rules (user-to-user)
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

/**
 * Firebase Configuration
 *
 * IMPORTANT: These are PUBLIC keys (safe to commit to Git)
 *
 * Why these aren't secrets:
 * - API Key: Identifies your Firebase project (like a public address)
 * - Auth Domain: Public URL for authentication
 * - Project ID: Public identifier
 *
 * Security comes from:
 * - Firestore Security Rules (backend)
 * - Authentication (only logged-in users can access data)
 *
 * Where to get these values:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select your project
 * 3. Project Settings (gear icon) → General
 * 4. Scroll to "Your apps" → Web app
 * 5. Copy the config object
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase App
 *
 * SINGLETON PATTERN: Only initialize once
 *
 * Why check getApps().length:
 * - Next.js hot reload can re-run this file
 * - Firebase throws error if initialized twice
 * - Check prevents duplicate initialization
 *
 * Real-world analogy:
 * Like checking if database connection already exists
 * before creating a new one
 */
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  console.log("✅ Firebase initialized:", firebaseConfig.projectId);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

/**
 * Usage Examples:
 *
 * Authentication:
 * import { auth } from '@/lib/firebase';
 * const user = await signInWithEmailAndPassword(auth, email, password);
 *
 * Firestore:
 * import { db } from '@/lib/firebase';
 * const docRef = doc(db, 'users', userId);
 * const docSnap = await getDoc(docRef);
 */
