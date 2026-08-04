"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  signInAsDemoUser: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signInWithEmail: async () => ({ success: false }),
  signInAsDemoUser: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if demo user session exists in localStorage
    const storedDemo = typeof window !== "undefined" ? localStorage.getItem("prodexa_demo_user") : null;
    if (storedDemo) {
      try {
        setUser(JSON.parse(storedDemo));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("prodexa_demo_user");
      }
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Clear demo session if real Firebase user logs in
        if (typeof window !== "undefined") {
          localStorage.removeItem("prodexa_demo_user");
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        const demoStored = typeof window !== "undefined" ? localStorage.getItem("prodexa_demo_user") : null;
        if (demoStored) {
          setUser(JSON.parse(demoStored));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (!auth || !googleProvider) {
        throw new Error("Firebase auth SDK not initialized properly.");
      }
      const result = await signInWithPopup(auth, googleProvider);
      const authUser: AuthUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: true, // Google OAuth accounts are pre-verified
      };
      if (typeof window !== "undefined") {
        localStorage.removeItem("prodexa_demo_user");
      }
      setUser(authUser);
      return { success: true };
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      return { success: false, error: error.message || "Google sign-in failed. Check pop-up blockers." };
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    try {
      if (!auth) throw new Error("Firebase Auth not initialized.");
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      await sendEmailVerification(cred.user);

      return {
        success: true,
        requiresVerification: true,
      };
    } catch (error: any) {
      return { success: false, error: error.message || "Sign up failed." };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      if (!auth) throw new Error("Firebase Auth not initialized.");
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      
      // Reload user status to verify email
      await cred.user.reload();
      if (!cred.user.emailVerified) {
        return {
          success: false,
          requiresVerification: true,
          error: "Email not verified. Please check your inbox for the verification link.",
        };
      }

      const authUser: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName,
        photoURL: cred.user.photoURL,
        emailVerified: true,
      };
      if (typeof window !== "undefined") {
        localStorage.removeItem("prodexa_demo_user");
      }
      setUser(authUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Email login failed." };
    }
  };

  const signInAsDemoUser = () => {
    const demoUser: AuthUser = {
      uid: "demo-user-123",
      email: "founder@prodexa.ai",
      displayName: "Alex Rivera (Demo)",
      photoURL: null,
      emailVerified: true,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("prodexa_demo_user", JSON.stringify(demoUser));
    }
    setUser(demoUser);
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prodexa_demo_user");
    }
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        signInAsDemoUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
