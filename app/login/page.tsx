"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight, Mail, Lock, User, AlertCircle,
  CheckCircle2, RefreshCw, Sparkles, Inbox, AlertTriangle, Zap,
} from "lucide-react";

type Mode = "signin" | "signup" | "magic" | "pending_verification";

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, resendVerification, sendMagicLink, signInAsDemoUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>("signin");
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
      setMode("signin");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) router.push("/projects");
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
    if (res.success) router.push("/projects");
    else setErrorMsg(res.error || "Google sign-in failed.");
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowResend(false);
    setSubmitting(true);

    if (mode === "signup") {
      if (!name.trim()) { setErrorMsg("Please enter your full name."); setSubmitting(false); return; }
      const res = await signUpWithEmail(name, email, password);
      if (res.success) setMode("pending_verification");
      else setErrorMsg(res.error || "Sign up failed.");
    } else if (mode === "magic") {
      const res = await sendMagicLink(email);
      if (res.success) setSuccessMsg(`Passwordless link sent to ${email}! Check your inbox.`);
      else setErrorMsg(res.error || "Failed to send email link.");
    } else {
      const res = await signInWithEmail(email, password);
      if (res.success) router.push("/projects");
      else if (res.requiresVerification) {
        setErrorMsg("Email not verified yet. Check your inbox and click the verification link.");
        setShowResend(true);
      } else {
        setErrorMsg(res.error || "Invalid email or password.");
      }
    }
    setSubmitting(false);
  };

  const handleResend = async () => {
    if (!email || !password) { setErrorMsg("Enter your email and password to resend."); return; }
    setSubmitting(true);
    const res = await resendVerification(email, password);
    if (res.success) { setSuccessMsg(`Verification link re-sent to ${email}.`); setErrorMsg(null); setShowResend(false); }
    else setErrorMsg(res.error || "Failed to resend.");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#71717A] text-sm font-mono">
          <div className="w-4 h-4 border-2 border-[#D97706]/30 border-t-[#D97706] rounded-full animate-spin" />
          Authenticating...
        </div>
      </div>
    );
  }

  const tabConfig = [
    { id: "signin" as const, label: "Sign In" },
    { id: "signup" as const, label: "Sign Up" },
    { id: "magic" as const, label: "Magic Link" },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-[#111113] border-r border-white/[0.06] p-10 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D97706]/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-7 h-7 bg-[#D97706] rounded-[6px] flex items-center justify-center">
              <span className="font-bold text-[#09090B] text-xs font-mono">P</span>
            </div>
            <span className="font-semibold text-sm text-[#FAFAFA]">prodexa</span>
          </div>

          <h2 className="text-2xl font-semibold text-[#FAFAFA] tracking-tight mb-3 leading-snug">
            The AI Operating System for Product Builders
          </h2>
          <p className="text-sm text-[#71717A] leading-relaxed mb-8">
            From idea to launch-ready product. Generate blueprints, audit readiness, and ship with confidence.
          </p>

          <div className="space-y-3">
            {[
              "AI Blueprint with Quality Score (0–100)",
              "6-module Launch Readiness Audit",
              "One-click Starter Kit Export",
              "AI Co-Founder with context memory",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5 text-sm text-[#A1A1AA]">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                {feat}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px] text-[#3F3F46] font-mono">
          Free for hackathons & open-source projects
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] space-y-6 animate-fade-in">

          {/* Pending Verification */}
          {mode === "pending_verification" ? (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-[#D97706]/10 border border-[#D97706]/20 rounded-2xl flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6 text-[#D97706]" />
                </div>
                <h1 className="text-2xl font-semibold text-[#FAFAFA]">Check your inbox</h1>
                <p className="text-sm text-[#71717A]">
                  Verification link sent to{" "}
                  <span className="text-[#D97706] font-mono font-medium">{email}</span>
                </p>
              </div>

              <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Check your Spam / Junk folder
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Verification emails may land in Spam. Mark it "Not Spam" and click the link to verify your account.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleResend}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#18181B] hover:bg-[#1C1C1F] border border-white/[0.10] text-[#FAFAFA] text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 text-[#71717A]" />
                  {submitting ? "Resending..." : "Resend Verification Link"}
                </button>
                <button
                  onClick={() => setMode("signin")}
                  className="w-full bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-4 lg:hidden">
                  <div className="w-6 h-6 bg-[#D97706] rounded-[5px] flex items-center justify-center">
                    <span className="font-bold text-[#09090B] text-[10px] font-mono">P</span>
                  </div>
                  <span className="font-semibold text-sm text-[#FAFAFA]">prodexa</span>
                </div>
                <h1 className="text-2xl font-semibold text-[#FAFAFA] tracking-tight">
                  {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Passwordless sign-in"}
                </h1>
                <p className="text-sm text-[#71717A]">
                  {mode === "signin" ? "Sign in to your Prodexa workspace" : mode === "signup" ? "Start building your launch-ready product" : "Receive a secure magic link via email"}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-[#111113] border border-white/[0.08] rounded-xl p-1 gap-1">
                {tabConfig.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                      mode === tab.id
                        ? "bg-[#1C1C1F] text-[#FAFAFA] shadow-sm border border-white/[0.08]"
                        : "text-[#71717A] hover:text-[#A1A1AA]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="bg-[#EF4444]/8 border border-[#EF4444]/20 text-[#EF4444] p-3.5 rounded-xl text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                  {showResend && (
                    <div className="pt-2 border-t border-[#EF4444]/15 space-y-2">
                      <p className="text-xs text-[#A1A1AA]">Also check your <strong>Spam / Junk</strong> folder.</p>
                      <button
                        onClick={handleResend}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Resend Verification Link
                      </button>
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="bg-[#22C55E]/8 border border-[#22C55E]/20 text-[#22C55E] p-3.5 rounded-xl text-sm flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 bg-[#18181B] hover:bg-[#1C1C1F] border border-white/[0.10] hover:border-white/[0.16] text-[#FAFAFA] text-sm font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {submitting ? "Signing in..." : "Continue with Google"}
              </button>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-white/[0.07]" />
                <span className="flex-shrink mx-3 text-[11px] font-mono uppercase text-[#3F3F46]">or</span>
                <div className="flex-grow border-t border-white/[0.07]" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="you@startup.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors font-mono"
                  />
                </div>

                {mode !== "magic" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A1A1AA] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#111113] border border-white/[0.10] hover:border-white/[0.16] focus:border-[#D97706]/60 rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-colors"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] text-sm font-semibold py-2.5 px-4 rounded-xl transition-all hover:shadow-[0_0_16px_rgba(217,119,6,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#09090B]/30 border-t-[#09090B] rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : mode === "signup" ? (
                    "Create Account & Verify Email"
                  ) : mode === "magic" ? (
                    "Send Magic Link"
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Demo Access */}
              <div className="pt-3 border-t border-white/[0.06] text-center">
                <button
                  onClick={() => { signInAsDemoUser(); router.push("/projects"); }}
                  className="inline-flex items-center gap-2 text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                  Explore Demo — No account required
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
