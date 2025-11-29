/**
 * Authentication Context
 *
 * REACT PATTERN: Context API for Global State
 *
 * Why Context instead of prop drilling:
 * ❌ Prop Drilling: Pass user through 10+ components
 * ✅ Context: Access user anywhere with useAuth()
 *
 * Real-world analogy:
 * Like a "currently logged in user" that any component can check
 * Similar to Redux store, but simpler (no reducers/actions)
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * User Type (Extended Firebase User)
 *
 * Firebase Auth provides:
 * - uid, email, emailVerified
 *
 * We add:
 * - displayName, role (stored in Firestore)
 */
export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: "student" | "senior";
  createdAt?: Date;
}

/**
 * Auth Context Interface
 *
 * All authentication methods available to components
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: "student" | "senior"
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Create Context
 *
 * undefined = Context not yet initialized
 * Will throw error if useAuth() called outside provider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 *
 * ARCHITECTURE: Wraps entire app to provide auth state
 *
 * Responsibilities:
 * 1. Listen for Firebase auth state changes
 * 2. Fetch user profile from Firestore when user logs in
 * 3. Provide authentication methods (signUp, signIn, signOut)
 * 4. Manage loading state during auth operations
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Listen for Auth State Changes
   *
   * FIREBASE PATTERN: onAuthStateChanged
   *
   * When does this fire:
   * - User logs in → Firebase auth state changes
   * - User logs out → Firebase auth state changes
   * - Page reload → Firebase checks if user still logged in
   * - Token expires → Firebase re-authenticates
   *
   * Why this works for session persistence:
   * - Firebase stores auth token in localStorage
   * - On page reload, Firebase auto-restores session
   * - onAuthStateChanged fires with restored user
   *
   * Cost: Free (no API calls, just local token check)
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch profile from Firestore
        await loadUserProfile(firebaseUser);
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Load User Profile from Firestore
   *
   * Why separate from Firebase Auth:
   * - Firebase Auth: email, uid (authentication data)
   * - Firestore: displayName, role (profile data)
   *
   * ALGORITHM:
   * 1. Fetch document from /users/{uid}
   * 2. If exists, merge with Firebase auth data
   * 3. If not exists, user might be incomplete (shouldn't happen)
   */
  const loadUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: userData.displayName,
          role: userData.role,
          createdAt: userData.createdAt?.toDate(),
        });
      } else {
        console.error("User profile not found in Firestore");
        setUser(null);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign Up New User
   *
   * TRANSACTION FLOW:
   * 1. Create Firebase Auth account (email/password)
   * 2. Create Firestore user profile (/users/{uid})
   * 3. Auto sign-in (Firebase does this automatically)
   * 4. onAuthStateChanged fires → loads profile
   *
   * Why this order:
   * - Need uid from Firebase Auth before creating Firestore doc
   * - If Firestore write fails, Firebase Auth still created (edge case)
   * - User can still log in later, but profile might be missing
   *
   * Error cases:
   * - Email already exists → Firebase throws auth/email-already-in-use
   * - Weak password → Firebase throws auth/weak-password
   * - Network error → Firebase throws auth/network-request-failed
   */
  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: "student" | "senior"
  ) => {
    setLoading(true);
    try {
      // Step 1: Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Step 2: Create Firestore user profile
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name,
        role: role,
        createdAt: serverTimestamp(),
      });

      // Step 3: onAuthStateChanged will auto-load profile
      console.log("✅ User created:", firebaseUser.uid);
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw error; // Re-throw to show error in UI
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign In Existing User
   *
   * FLOW:
   * 1. Firebase validates email/password
   * 2. Returns user credential
   * 3. onAuthStateChanged fires → loads profile
   *
   * Error cases:
   * - Wrong password → auth/wrong-password
   * - User not found → auth/user-not-found
   * - Too many attempts → auth/too-many-requests
   */
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ User signed in");
    } catch (error: any) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign Out User
   *
   * CLEANUP:
   * 1. Firebase clears auth token
   * 2. onAuthStateChanged fires with null
   * 3. Context updates user to null
   * 4. Protected routes redirect to login
   */
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      console.log("✅ User signed out");
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 *
 * CUSTOM HOOK PATTERN: Simplify context access
 *
 * Usage:
 * const { user, signIn, signOut } = useAuth();
 *
 * if (!user) return <Login />;
 *
 * Benefits:
 * - Type safety (TypeScript knows exact type)
 * - Error if used outside provider
 * - Cleaner than useContext(AuthContext)
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Real-world examples of similar patterns:
 *
 * Next.js: useRouter() - access router anywhere
 * React Router: useNavigate() - navigate anywhere
 * Redux: useSelector() - access store anywhere
 * Theme: useTheme() - access theme anywhere
 *
 * This pattern is called "Dependency Injection"
 * Components don't need to know HOW auth works
 * They just consume the useAuth() hook
 */
