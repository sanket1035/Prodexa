"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Zap, Sparkles, FolderGit2, Lightbulb, ShieldCheck, Award } from "lucide-react";

export default function LandingPage() {
  const { user, signInWithGoogle, signInAsDemoUser } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDEF] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-[#2A2D31] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-[#D97B3F] rounded-[4px] flex items-center justify-center font-mono font-bold text-[#0B0C0E] text-xs">
            P
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-base tracking-tight text-[#EDEDEF]">prodexa</span>
            <span className="text-[10px] font-mono uppercase bg-[#1E2124] text-[#D97B3F] px-2 py-0.5 rounded-[4px] border border-[#2A2D31]">
              AI Product OS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => router.push("/projects")}
              className="flex items-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] text-xs font-mono font-medium px-3.5 py-1.5 rounded-[6px] transition-colors"
            >
              Go to Workspace
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 bg-[#1E2124] hover:bg-[#25292E] text-[#EDEDEF] border border-[#2A2D31] text-xs font-mono font-medium px-3.5 py-1.5 rounded-[6px] transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase text-[#D97B3F] bg-[#D97B3F]/10 px-3 py-1 rounded-[4px] border border-[#D97B3F]/20">
          <Zap className="w-3.5 h-3.5" />
          Autonomous Pre-Launch Product Operating System
        </div>

        <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-[#EDEDEF] leading-[1.1]">
          From an idea to a <br />
          <span className="text-[#D97B3F]">launch-ready product.</span>
        </h1>

        <p className="text-sm md:text-base text-[#8B8F97] max-w-2xl font-normal leading-relaxed">
          Most tools start after a product exists. <span className="text-[#EDEDEF] font-medium">Prodexa starts when you only have an idea</span>, then stays with you until launch.
        </p>

        {/* Visual Lifecycle Timeline (Idea -> Blueprint -> Build -> Launch Audit -> Investor Ready) */}
        <div className="w-full max-w-2xl bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-3 my-2">
          <div className="text-[10px] font-mono text-[#8B8F97] uppercase tracking-wider mb-2 text-left">
            Idea → Launch Operating Lifecycle:
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
            {[
              { step: "01", title: "Idea", color: "text-[#D97B3F]" },
              { step: "02", title: "Blueprint", color: "text-[#D97B3F]" },
              { step: "03", title: "Build", color: "text-[#5FA88A]" },
              { step: "04", title: "Launch Audit", color: "text-[#5FA88A]" },
              { step: "05", title: "Investor Ready", color: "text-[#C9A44C]" },
            ].map((st, idx) => (
              <div key={idx} className="bg-[#0B0C0E] border border-[#2A2D31] p-2 rounded-[4px] space-y-0.5">
                <div className={`text-[10px] font-bold ${st.color}`}>{st.step}</div>
                <div className="text-[#EDEDEF] font-medium text-[11px] truncate">{st.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dual Entry Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left">
          {/* Option B: Idea Only */}
          <div
            onClick={() => {
              if (user) {
                router.push("/blueprint/new");
              } else {
                signInWithGoogle();
              }
            }}
            className="bg-[#16181B] border border-[#D97B3F]/50 hover:border-[#D97B3F] rounded-[6px] p-5 space-y-3 cursor-pointer transition-all hover:bg-[#1E2124] group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 bg-[#D97B3F]/10 border border-[#D97B3F]/30 rounded-[6px] flex items-center justify-center text-[#D97B3F]">
                <Lightbulb className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#D97B3F]/20 text-[#D97B3F] px-2 py-0.5 rounded font-semibold">
                Option B — New Idea
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-medium text-[#EDEDEF] group-hover:text-[#D97B3F] transition-colors">
                "I only have an idea."
              </h3>
              <p className="text-xs text-[#8B8F97] leading-relaxed">
                Generate an AI Product Blueprint with Quality Score (0–100), Mermaid Architecture, and One-Click Starter Kit.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-xs font-mono font-medium text-[#D97B3F]">
              <span>Generate AI Blueprint</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Option A: Already Built Product */}
          <div
            onClick={() => {
              if (user) {
                router.push("/projects/new");
              } else {
                signInWithGoogle();
              }
            }}
            className="bg-[#16181B] border border-[#2A2D31] hover:border-[#3A3E45] rounded-[6px] p-5 space-y-3 cursor-pointer transition-all hover:bg-[#1E2124] group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 bg-[#1E2124] border border-[#2A2D31] rounded-[6px] flex items-center justify-center text-[#8B8F97]">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono uppercase bg-[#1E2124] text-[#8B8F97] px-2 py-0.5 rounded border border-[#2A2D31]">
                Option A — Launch Audit
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-medium text-[#EDEDEF] group-hover:text-[#D97B3F] transition-colors">
                "I already built my product."
              </h3>
              <p className="text-xs text-[#8B8F97] leading-relaxed">
                Run your website URL & GitHub repository through 6 deterministic readiness analysis modules with Copy-Fix fixes.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-xs font-mono font-medium text-[#EDEDEF]">
              <span>Audit Readiness Now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Demo Fast Access Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              signInAsDemoUser();
              router.push("/blueprint/bp-prodexa-demo");
            }}
            className="inline-flex items-center gap-2 bg-[#16181B] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] font-medium py-2 px-4 rounded-[6px] text-xs font-mono transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97B3F]" />
            View Sample AI Blueprint (Instant Demo)
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2D31] py-4 px-6 text-center text-xs text-[#8B8F97] font-mono">
        Prodexa © 2026 • The AI Product Operating System (Idea → Build → Launch)
      </footer>
    </div>
  );
}
