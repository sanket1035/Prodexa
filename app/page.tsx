"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";

export default function LandingPage() {
  const { user, signInWithGoogle, signInAsDemoUser } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDEF] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-[#2A2D31] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#D97B3F] rounded-[4px] flex items-center justify-center font-mono font-bold text-[#0B0C0E] text-sm">
            P
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#EDEDEF]">prodexa</span>
          <span className="text-[10px] font-mono uppercase bg-[#1E2124] text-[#8B8F97] px-2 py-0.5 rounded-[4px] border border-[#2A2D31] ml-1">
            Pre-Launch Readiness
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => router.push("/projects")}
              className="flex items-center gap-2 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] text-sm font-medium px-4 py-2 rounded-[6px] transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 bg-[#1E2124] hover:bg-[#25292E] text-[#EDEDEF] border border-[#2A2D31] text-sm font-medium px-4 py-2 rounded-[6px] transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D97B3F] bg-[#D97B3F]/10 px-3 py-1.5 rounded-[4px] border border-[#D97B3F]/20">
          <Zap className="w-3.5 h-3.5" />
          Autonomous Pre-Launch Readiness Engine
        </div>

        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-[#EDEDEF] leading-[1.15]">
          Launch Better. Build Smarter. <br />
          Validate Faster.
        </h1>

        <p className="text-lg text-[#8B8F97] max-w-2xl font-normal leading-relaxed">
          Runs your product through 6 specialized, rubric-based analysis modules combining real deterministic signals—Lighthouse, GitHub metadata, page structure—to generate a single Launch Readiness Score with copy-pasteable fixes.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <button
            onClick={() => {
              if (user) {
                router.push("/projects/new");
              } else {
                signInWithGoogle();
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#D97B3F] hover:bg-[#E88A4E] text-[#0B0C0E] font-medium py-3 px-6 rounded-[6px] text-base transition-colors focus-visible:outline-2 focus-visible:outline-[#D97B3F]"
          >
            Validate Your Product
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              signInAsDemoUser();
              router.push("/dashboard/proj-prodexa-demo");
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#16181B] hover:bg-[#1E2124] text-[#EDEDEF] border border-[#2A2D31] font-medium py-3 px-5 rounded-[6px] text-sm transition-colors"
          >
            View Live Sample Report
          </button>
        </div>

        {/* 6 Module Chips */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-3 w-full text-left max-w-3xl">
          {[
            { name: "Product Understanding", desc: "Value prop clarity & positioning" },
            { name: "Engineering Analysis", desc: "GitHub metadata & repo completeness" },
            { name: "UX Validation", desc: "Heuristic CTA & viewport accessibility" },
            { name: "Performance Audit", desc: "Lighthouse core web vitals" },
            { name: "Business Review", desc: "Pitch deck & market alignment" },
            { name: "Launch Planner", desc: "Prioritized effort-reward roadmap" },
          ].map((m, idx) => (
            <div key={idx} className="bg-[#16181B] border border-[#2A2D31] rounded-[6px] p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#D97B3F]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5FA88A]" />
                Module 0{idx + 1}
              </div>
              <div className="font-medium text-sm text-[#EDEDEF]">{m.name}</div>
              <div className="text-xs text-[#8B8F97]">{m.desc}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2A2D31] py-6 px-6 text-center text-xs text-[#8B8F97] font-mono">
        Prodexa © 2026 • Deterministic Pre-Launch Intelligence Engine
      </footer>
    </div>
  );
}
