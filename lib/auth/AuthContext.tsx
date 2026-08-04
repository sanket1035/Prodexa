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
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
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
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  resendVerification: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInAsDemoUser: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
  signInWithEmail: async () => ({ success: false }),
  resendVerification: async () => ({ success: false }),
  sendMagicLink: async () => ({ success: false }),
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

    // Complete Email Link (Magic Link) sign-in if URL contains link
    if (typeof window !== "undefined" && isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem("prodexa_emailForSignIn");
      if (!email) {
        email = window.prompt("Please provide your email for confirmation");
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then((result) => {
            window.localStorage.removeItem("prodexa_emailForSignIn");
            setUser({
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              emailVerified: true,
            });
          })
          .catch((err) => console.error("Email link sign-in error:", err));
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Enforce strict email verification for password auth
        await firebaseUser.reload();
        
        // Google OAuth or verified email
        const isOAuth = firebaseUser.providerData.some((p) => p.providerId === "google.com");
        if (firebaseUser.emailVerified || isOAuth) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("prodexa_demo_user");
          }
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: true,
          });
        } else {
          // Unverified user -> force sign out
          await firebaseSignOut(auth);
          setUser(null);
        }
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
        emailVerified: true, // Google accounts are pre-verified by Google
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
      
      // Send verification link with redirect to /login
      const actionCodeSettings = {
        url: typeof window !== "undefined" ? `${window.location.origin}/login?verified=true` : "http://localhost:3000/login",
        handleCodeInApp: true,
      };
      await sendEmailVerification(cred.user, actionCodeSettings);

      // Force sign out until email is verified by user clicking link
      await firebaseSignOut(auth);
      setUser(null);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Sign up failed." };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      if (!auth) throw new Error("Firebase Auth not initialized.");
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      
      await cred.user.reload();
      if (!cred.user.emailVerified) {
        await firebaseSignOut(auth);
        setUser(null);
        return {
          success: false,
          requiresVerification: true,
          error: "Email not verified! We sent a verification link to your email. Please click the link in your inbox before signing in.",
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
      return { success: false, error: error.message || "Invalid email or password." };
    }
  };

  const resendVerification = async (email: string, pass: string) => {
    try {
      if (!auth) throw new Error("Firebase Auth not initialized.");
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const actionCodeSettings = {
        url: typeof window !== "undefined" ? `${window.location.origin}/login?verified=true` : "http://localhost:3000/login",
        handleCodeInApp: true,
      };
      await sendEmailVerification(cred.user, actionCodeSettings);
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to resend verification link." };
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      if (!auth) throw new Error("Firebase Auth not initialized.");
      const actionCodeSettings = {
        url: typeof window !== "undefined" ? `${window.location.origin}/login` : "http://localhost:3000/login",
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("prodexa_emailForSignIn", email);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to send magic link." };
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
        resendVerification,
        sendMagicLink,
        signInAsDemoUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
