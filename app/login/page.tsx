"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle2, RefreshCw, Sparkles } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, resendVerification, sendMagicLink, signInAsDemoUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMsg("Email verified successfully! You can now sign in below.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.push("/projects");
    }
  }, [user, loading, router]);

  const switchTab = (newMode: "signin" | "signup" | "magic") => {
    setMode(newMode);
    setName("");
    setEmail("");
    setPassword("");
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowResend(false);
  };

  const handleGoogleClick = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const res = await signInWithGoogle();
    if (res.success) {
      router.push("/projects");
    } else {
      setErrorMsg(res.error || "Google sign-in failed.");
    }
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowResend(false);
    setSubmitting(true);

    if (mode === "signup") {
      if (!name.trim()) {
        setErrorMsg("Please enter your full name.");
        setSubmitting(false);
        return;
      }
      const res = await signUpWithEmail(name, email, password);
      if (res.success) {
        setSuccessMsg(`Verification link sent to ${email}! Please check your email inbox and click the verification link before signing in.`);
        switchTab("signin");
      } else {
        setErrorMsg(res.error || "Sign up failed.");
      }
    } else if (mode === "magic") {
      const res = await sendMagicLink(email);
      if (res.success) {
        setSuccessMsg(`Passwordless sign-in link sent to ${email}! Open your email and click the link to log in.`);
      } else {
        setErrorMsg(res.error || "Failed to send email link.");
      }
    } else {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        router.push("/projects");
      } else if (res.requiresVerification) {
        setErrorMsg(res.error || "Email not verified!");
        setShowResend(true);
      } else {
        setErrorMsg(res.error || "Invalid email or password.");
      }
    }
    setSubmitting(false);
  };

  const handleResend = async () => {
    if (!email || !password) {
      setErrorMsg("Please enter your email and password to resend verification link.");
      return;
    }
    setSubmitting(true);
    const res = await resendVerification(email, password);
    if (res.success) {
      setSuccessMsg(`Verification link re-sent to ${email}. Please check your inbox.`);
      setErrorMsg(null);
      setShowResend(false);
    } else {
      setErrorMsg(res.error || "Failed to resend verification email.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center text-[#8B8F97] font-mono text-sm">
        Authenticating session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDEF] flex flex-col justify-center items-center px-4 font-sans py-12">
      <div className="w-full max-w-md bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D97B3F] bg-[#D97B3F]/10 px-3 py-1 rounded-[4px] border border-[#D97B3F]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Authentication
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-[#EDEDEF]">
            {mode === "signin"
              ? "Sign in to Prodexa"
              : mode === "signup"
              ? "Create your Verified Account"
              : "Passwordless Email Link"}
          </h1>
          <p className="text-xs text-[#8B8F97] font-mono">
            Autonomous Pre-Launch AI Operating System
          </p>
        </div>

        {/* 3-Mode Tab Switcher */}
        <div className="grid grid-cols-3 bg-[#0B0C0E] border border-[#2A2D31] p-1 rounded-[6px] text-xs font-mono">
          <button
            onClick={() => switchTab("signin")}
            className={`py-1.5 rounded font-medium transition-colors ${
              mode === "signin" ? "bg-[#1E2124] text-[#D97B3F] font-bold" : "text-[#8B8F97] hover:text-[#EDEDEF]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchTab("signup")}
            className={`py-1.5 rounded font-medium transition-colors ${
              mode === "signup" ? "bg-[#1E2124] text-[#D97B3F] font-bold" : "text-[#8B8F97] hover:text-[#EDEDEF]"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => switchTab("magic")}
            className={`py-1.5 rounded font-medium transition-colors ${
              mode === "magic" ? "bg-[#1E2124] text-[#D97B3F] font-bold" : "text-[#8B8F97] hover:text-[#EDEDEF]"
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="bg-[#C25A4D]/10 border border-[#C25A4D]/30 text-[#C25A4D] p-3 rounded-[6px] text-xs font-mono space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {showResend && (
              <button
                onClick={handleResend}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 bg-[#C25A4D]/20 hover:bg-[#C25A4D]/30 text-[#EDEDEF] px-3 py-1 rounded text-[11px] font-mono transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend Verification Link</span>
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="bg-[#5FA88A]/10 border border-[#5FA88A]/30 text-[#5FA88A] p-3 rounded-[6px] text-xs font-mono flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 bg-[#1E2124] hover:bg-[#25292E] text-[#EDEDEF] font-mono text-xs font-medium py-2.5 px-4 rounded-[6px] border border-[#2A2D31] transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
          {submitting ? "Signing in..." : "Continue with Google (Instant Verification)"}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#2A2D31]"></div>
          <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-[#8B8F97]">or email</span>
          <div className="flex-grow border-t border-[#2A2D31]"></div>
        </div>

        {/* Email Form with AutoComplete Disabled */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#EDEDEF] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#8B8F97]" />
                Full Name
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2 text-xs text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none font-mono"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#EDEDEF] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#8B8F97]" />
              Email Address
            </label>
            <input
              type="email"
              required
              autoComplete="off"
              placeholder="founder@startup.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2 text-xs text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none font-mono"
            />
          </div>

          {mode !== "magic" && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#EDEDEF] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8B8F97]" />
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0C0E] border border-[#2A2D31] rounded-[6px] px-3.5 py-2 text-xs text-[#EDEDEF] placeholder-[#8B8F97]/50 focus:border-[#D97B3F] outline-none font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-mono text-xs font-medium py-2.5 px-4 rounded-[6px] transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Processing..."
              : mode === "signup"
              ? "Sign Up & Send Email Verification Link"
              : mode === "magic"
              ? "Send Passwordless Magic Link"
              : "Sign In"}
          </button>
        </form>

        {/* Instant Demo Guest Access */}
        <div className="pt-2 border-t border-[#2A2D31] text-center">
          <button
            onClick={() => {
              signInAsDemoUser();
              router.push("/projects");
            }}
            className="inline-flex items-center gap-2 text-xs font-mono text-[#D97B3F] hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97B3F]" />
            <span>Instant Demo Guest Access (No Email Required)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
