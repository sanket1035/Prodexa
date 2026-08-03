"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInAsDemoUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/projects");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center text-[#8B8F97] font-mono text-sm">
        Authenticating session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDEF] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D97B3F] bg-[#D97B3F]/10 px-2.5 py-1 rounded-[4px] border border-[#D97B3F]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Prodexa Authentication
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-[#EDEDEF]">
            Sign in to Prodexa
          </h1>
          <p className="text-sm text-[#8B8F97]">
            Autonomous Pre-Launch Readiness Platform
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium py-2.5 px-4 rounded-[6px] transition-colors focus-visible:outline-2 focus-visible:outline-[#D97B3F]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={() => {
              signInAsDemoUser();
              router.push("/projects");
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#1E2124] hover:bg-[#25292E] text-[#EDEDEF] font-medium py-2.5 px-4 rounded-[6px] border border-[#2A2D31] transition-colors text-sm"
          >
            Continue as Instant Demo Guest
            <ArrowRight className="w-4 h-4 text-[#8B8F97]" />
          </button>
        </div>

        <div className="border-t border-[#2A2D31] pt-4 text-center text-xs text-[#8B8F97] space-y-1">
          <p>Read-only analysis engine • No repository write access</p>
          <p className="font-mono text-[11px] text-[#8B8F97]/70">Deterministically backed by Lighthouse & GitHub signals</p>
        </div>
      </div>
    </div>
  );
}
