"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight, Mail, Lock, User, AlertCircle,
  CheckCircle2, RefreshCw, Sparkles, Inbox, AlertTriangle, Zap,
} from "lucide-react";

type Mode = "signin" | "signup" | "magic" | "pending_verification";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex items-center gap-3 text-sm font-mono" style={{ color: "var(--text-muted)" }}>
          <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full anim-spin" />
          Loading...
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="flex items-center gap-3 text-sm font-mono" style={{ color: "var(--text-muted)" }}>
          <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full anim-spin" />
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
    <div className="min-h-screen flex" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: "var(--bg-elevated)", borderRight: "1px solid var(--border)" }}
      >
        <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text)" }}>prodexa</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight mb-3 leading-snug" style={{ color: "var(--text)" }}>
            The AI Operating System for Product Builders
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
            From idea to launch-ready product. Generate blueprints, audit readiness, and ship with confidence.
          </p>

          <div className="space-y-3">
            {[
              "AI Blueprint with Quality Score (0–100)",
              "6-module Launch Readiness Audit",
              "One-click Starter Kit Export",
              "AI Co-Founder with context memory",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                {feat}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[11px] font-mono" style={{ color: "var(--text-faint)" }}>
          Free for hackathons &amp; open-source projects
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] space-y-6 anim-fade">

          {/* Pending Verification */}
          {mode === "pending_verification" ? (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.2)" }}>
                  <Inbox className="w-6 h-6" style={{ color: "var(--accent)" }} />
                </div>
                <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>Check your inbox</h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Verification link sent to{" "}
                  <span className="font-mono font-medium" style={{ color: "var(--accent)" }}>{email}</span>
                </p>
              </div>

              <div className="badge badge-amber p-4 rounded-xl space-y-2 w-full">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Check your Spam / Junk folder
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Verification emails may land in Spam. Mark it &quot;Not Spam&quot; and click the link to verify your account.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleResend}
                  disabled={submitting}
                  className="btn btn-secondary w-full"
                >
                  <RefreshCw className="w-4 h-4" />
                  {submitting ? "Resending..." : "Resend Verification Link"}
                </button>
                <button
                  onClick={() => setMode("signin")}
                  className="btn btn-primary w-full"
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
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--accent)" }}>
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>prodexa</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                  {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Passwordless sign-in"}
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {mode === "signin" ? "Sign in to your Prodexa workspace" : mode === "signup" ? "Start building your launch-ready product" : "Receive a secure magic link via email"}
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="tabs w-full">
                {tabConfig.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    className={`tab-btn flex-1 justify-center ${mode === tab.id ? "active" : ""}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="badge badge-red p-3.5 rounded-xl text-sm space-y-2 w-full">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                  {showResend && (
                    <div className="pt-2 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Check your <strong>Spam / Junk</strong> folder.</p>
                      <button
                        onClick={handleResend}
                        disabled={submitting}
                        className="btn btn-secondary btn-sm"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Resend Verification Link
                      </button>
                    </div>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="badge badge-green p-3.5 rounded-xl text-sm flex items-start gap-2 w-full">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={submitting}
                className="btn btn-secondary w-full py-2.5"
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
                <div className="flex-grow border-t" style={{ borderColor: "var(--border)" }} />
                <span className="flex-shrink mx-3 text-[11px] font-mono uppercase" style={{ color: "var(--text-faint)" }}>or</span>
                <div className="flex-grow border-t" style={{ borderColor: "var(--border)" }} />
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
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
                      className="input"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
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
                    className="input font-mono"
                  />
                </div>

                {mode !== "magic" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
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
                      className="input"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-lg w-full"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full anim-spin" />
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
              <div className="pt-3 border-t text-center" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={() => { signInAsDemoUser(); router.push("/projects"); }}
                  className="btn btn-ghost btn-sm text-xs font-normal"
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                  Explore Demo — No account required
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
