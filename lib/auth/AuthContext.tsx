"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
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
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
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
      if (auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        setUser({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
      } else {
        signInAsDemoUser();
      }
    } catch (error) {
      console.warn("Google sign-in popup error, falling back to demo session:", error);
      signInAsDemoUser();
    }
  };

  const signInAsDemoUser = () => {
    const demoUser: AuthUser = {
      uid: "demo-user-123",
      email: "founder@prodexa.ai",
      displayName: "Alex Rivera (Demo)",
      photoURL: null,
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAsDemoUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
