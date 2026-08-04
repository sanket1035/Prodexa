"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Zap, Sparkles, FolderGit2, Lightbulb,
  CheckCircle2, Shield, Activity, Code2, GitBranch,
  BarChart3, Bot, ChevronRight,
} from "lucide-react";

const LIFECYCLE = [
  { step: "01", label: "Idea", desc: "Describe your concept" },
  { step: "02", label: "Blueprint", desc: "AI generates architecture" },
  { step: "03", label: "Build", desc: "Starter kit scaffolding" },
  { step: "04", label: "Audit", desc: "Launch readiness score" },
  { step: "05", label: "Investor Ready", desc: "Pitch-ready artifacts" },
];

const FEATURES = [
  {
    icon: Lightbulb,
    title: "AI Blueprint Engine",
    desc: "Turn any idea into a structured product document with quality scores, competitive analysis, and mermaid system architecture — in seconds.",
  },
  {
    icon: BarChart3,
    title: "Launch Readiness Score",
    desc: "6 deterministic analysis modules inspect your website, GitHub repo, performance, UX, engineering, and business viability.",
  },
  {
    icon: Bot,
    title: "AI Co-Founder",
    desc: "Context-aware AI remembers your entire product. Ask anything — pitch strategy, technical architecture, market sizing — with memory of all past decisions.",
  },
  {
    icon: Code2,
    title: "One-Click Starter Kit",
    desc: "Export PRD, TRD, database schema, and API contracts as a complete starter kit ZIP. Skip 20 hours of documentation.",
  },
  {
    icon: GitBranch,
    title: "GitHub Integration",
    desc: "Automated read-only audit of your repository — README quality, LICENSE presence, commit freshness, and package manifest.",
  },
  {
    icon: Shield,
    title: "Copy-Fix Drawer",
    desc: "Every detected issue ships with copy-pasteable code fixes. No vague recommendations — exact solutions for every problem.",
  },
];

const STEPS = [
  { num: "01", title: "Describe Your Idea", body: "Enter your product concept, problem statement, and target audience. No fluff — just what matters." },
  { num: "02", title: "AI Generates Blueprint", body: "Prodexa's AI engine produces a structured 6-section blueprint with quality score and system architecture in under 15 seconds." },
  { num: "03", title: "Connect Your Product", body: "Add your website URL and GitHub repo to unlock the full launch readiness audit across 6 analysis modules." },
  { num: "04", title: "Ship with Confidence", body: "Download your starter kit, fix flagged issues, and pitch investors with a complete readiness report." },
];

export default function LandingPage() {
  const { user, signInAsDemoUser } = useAuth();
  const router = useRouter();

  const handleNavigateBlueprint = () => {
    if (!user) signInAsDemoUser();
    router.push("/blueprint/new");
  };

  const handleNavigateAudit = () => {
    if (!user) signInAsDemoUser();
    router.push("/projects/new");
  };

  const handleNavigateDemo = () => {
    signInAsDemoUser();
    router.push("/blueprint/bp-prodexa-demo");
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090B]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[#D97706] rounded-[5px] flex items-center justify-center">
              <span className="font-bold text-[#09090B] text-[10px] font-mono">P</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">prodexa</span>
            <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-widest text-[#71717A] bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md ml-1">
              AI Product OS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[#71717A]">
            <button onClick={handleNavigateBlueprint} className="hover:text-[#FAFAFA] transition-colors">Blueprint</button>
            <button onClick={handleNavigateAudit} className="hover:text-[#FAFAFA] transition-colors">Launch Audit</button>
            <button onClick={handleNavigateDemo} className="hover:text-[#FAFAFA] transition-colors">Demo</button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => router.push("/projects")}
                className="flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Go to Workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-2 bg-[#FAFAFA] hover:bg-white text-[#09090B] text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          {/* Grid bg */}
          <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D97706]/8 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-[#D97706] bg-[#D97706]/10 border border-[#D97706]/20 px-3 py-1.5 rounded-full mb-8 animate-fade-in">
              <Zap className="w-3 h-3" />
              Autonomous Pre-Launch AI Operating System
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#FAFAFA] leading-[1.08] mb-6 animate-fade-in delay-75">
              From an idea to a{" "}
              <span className="text-[#D97706]">launch-ready product.</span>
            </h1>

            <p className="text-base md:text-lg text-[#71717A] max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in delay-150">
              Most tools start after a product exists.{" "}
              <span className="text-[#A1A1AA]">Prodexa starts when you only have an idea</span>{" "}
              — then stays with you through architecture, build, and launch readiness.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 animate-fade-in delay-200">
              <button
                onClick={handleNavigateBlueprint}
                className="group flex items-center gap-2.5 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(217,119,6,0.4)] text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Blueprint
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={handleNavigateAudit}
                className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] hover:border-white/[0.16] text-[#FAFAFA] font-medium px-6 py-3 rounded-xl transition-all text-sm"
              >
                <Activity className="w-4 h-4 text-[#A1A1AA]" />
                Audit Existing Product
              </button>
              <button
                onClick={handleNavigateDemo}
                className="text-sm text-[#71717A] hover:text-[#A1A1AA] transition-colors underline underline-offset-4"
              >
                View live demo →
              </button>
            </div>

            {/* Product Preview Card */}
            <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/[0.10] bg-[#111113] animate-fade-in delay-300">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08] bg-[#0D0D0F]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]/70" />
                <span className="text-[11px] font-mono text-[#3F3F46] ml-3">prodexa.app/dashboard</span>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4 min-h-[240px]">
                {/* Score Card */}
                <div className="col-span-1 bg-[#18181B] border border-white/[0.08] rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                  <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider">Launch Score</div>
                  <div className="text-4xl font-bold text-[#D97706]">84</div>
                  <div className="text-[10px] text-[#22C55E] font-mono">↑ +6 pts</div>
                  <div className="w-full h-1.5 bg-[#27272A] rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] rounded-full" style={{ width: "84%" }} />
                  </div>
                </div>
                {/* Modules */}
                <div className="col-span-2 bg-[#18181B] border border-white/[0.08] rounded-xl p-4 space-y-2.5">
                  <div className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider mb-3">Audit Modules</div>
                  {[
                    { label: "Engineering", score: 82, color: "#22C55E" },
                    { label: "UX & Design", score: 85, color: "#22C55E" },
                    { label: "Performance", score: 90, color: "#22C55E" },
                    { label: "Accessibility", score: 78, color: "#F59E0B" },
                    { label: "Business", score: 82, color: "#22C55E" },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-3">
                      <div className="text-[11px] text-[#A1A1AA] w-24 font-mono">{m.label}</div>
                      <div className="flex-1 h-1.5 bg-[#27272A] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: m.color + "99" }} />
                      </div>
                      <div className="text-[11px] font-mono text-[#71717A]">{m.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lifecycle Steps */}
        <section className="border-b border-white/[0.06] py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] mb-3">The Operating Lifecycle</div>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#FAFAFA] tracking-tight">
                Idea → Blueprint → Build → Launch
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {LIFECYCLE.map((item, idx) => (
                <div key={idx} className="relative group">
                  {idx < LIFECYCLE.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-[calc(50%+24px)] right-0 h-px bg-white/[0.06]" />
                  )}
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#111113] border border-white/[0.07] hover:border-white/[0.12] transition-colors">
                    <div className="text-[10px] font-mono text-[#D97706] mb-2">{item.step}</div>
                    <div className="text-sm font-semibold text-[#FAFAFA] mb-1">{item.label}</div>
                    <div className="text-[11px] text-[#71717A] leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dual Entry Cards */}
        <section className="py-20 border-b border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] mb-3">Choose Your Entry Point</div>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#FAFAFA] tracking-tight">
                Where are you today?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={handleNavigateBlueprint}
                className="group bg-[#111113] border border-white/[0.08] hover:border-[#D97706]/40 rounded-2xl p-7 cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(217,119,6,0.08)] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-[#D97706]/10 border border-[#D97706]/20 rounded-xl flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-[#D97706]/10 text-[#D97706] px-2.5 py-1 rounded-lg border border-[#D97706]/20">
                    Option A
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#FAFAFA] group-hover:text-[#D97706] transition-colors mb-2">
                    "I only have an idea."
                  </h3>
                  <p className="text-sm text-[#71717A] leading-relaxed">
                    Generate a structured AI Product Blueprint with Quality Score (0–100), system architecture, and one-click starter kit.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-[#D97706]">
                  Generate AI Blueprint
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              <div
                onClick={handleNavigateAudit}
                className="group bg-[#111113] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-7 cursor-pointer transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-white/[0.05] border border-white/[0.08] rounded-xl flex items-center justify-center">
                    <FolderGit2 className="w-5 h-5 text-[#A1A1AA]" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-white/[0.05] text-[#71717A] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                    Option B
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#FAFAFA] group-hover:text-[#FAFAFA] transition-colors mb-2">
                    "I already built my product."
                  </h3>
                  <p className="text-sm text-[#71717A] leading-relaxed">
                    Run your website URL and GitHub repository through 6 deterministic readiness modules with copy-fix solutions.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors">
                  Audit Readiness Now
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] mb-3">Capabilities</div>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#FAFAFA] tracking-tight mb-3">
                Everything you need to launch.
              </h2>
              <p className="text-[#71717A] text-sm max-w-xl mx-auto">
                Prodexa combines deterministic checks with AI reasoning to give founders structured feedback at every stage.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div key={idx} className="bg-[#111113] border border-white/[0.07] hover:border-white/[0.12] rounded-xl p-5 space-y-3 transition-all group">
                    <div className="w-8 h-8 bg-[#D97706]/10 border border-[#D97706]/15 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#D97706]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#FAFAFA]">{f.title}</h3>
                    <p className="text-[13px] text-[#71717A] leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 border-b border-white/[0.06]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] mb-3">How It Works</div>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#FAFAFA] tracking-tight">
                From zero to launch in 4 steps.
              </h2>
            </div>
            <div className="space-y-4">
              {STEPS.map((step, idx) => (
                <div key={idx} className="flex gap-5 p-5 bg-[#111113] border border-white/[0.07] hover:border-white/[0.12] rounded-xl transition-all group">
                  <div className="w-10 h-10 bg-[#18181B] border border-white/[0.08] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-mono text-[#D97706] font-semibold">{step.num}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#FAFAFA] mb-1 group-hover:text-[#D97706] transition-colors">{step.title}</h3>
                    <p className="text-[13px] text-[#71717A] leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 border-b border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-semibold text-[#FAFAFA] tracking-tight">Frequently Asked</h2>
            </div>
            <div className="space-y-3">
              {[
                { q: "Do I need to write code?", a: "No. Prodexa is designed for founders at all technical levels. The AI handles architecture and documentation — you bring the idea." },
                { q: "What's the Blueprint Quality Score?", a: "A composite score (0-100) across 6 dimensions: Technical Feasibility, Business Potential, Innovation, Scalability, Market Readiness, and AI Necessity." },
                { q: "Is my data private?", a: "Yes. Your blueprints and project data are stored privately in your account. Nothing is shared or used for training." },
                { q: "Can I use this for a hackathon?", a: "Absolutely. Prodexa was built specifically for hackathon builders. Generate a full product blueprint in under 15 seconds." },
              ].map((item, idx) => (
                <details key={idx} className="group bg-[#111113] border border-white/[0.07] hover:border-white/[0.12] rounded-xl px-5 py-4 transition-colors cursor-pointer">
                  <summary className="text-sm font-medium text-[#FAFAFA] list-none flex items-center justify-between gap-4">
                    {item.q}
                    <ChevronRight className="w-4 h-4 text-[#71717A] flex-shrink-0 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="text-[13px] text-[#71717A] leading-relaxed mt-3 pt-3 border-t border-white/[0.06]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase text-[#D97706] bg-[#D97706]/10 border border-[#D97706]/20 px-3 py-1.5 rounded-full mb-6">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Free for hackathons &amp; open-source
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#FAFAFA] tracking-tight mb-4">
              Ready to build your product?
            </h2>
            <p className="text-[#71717A] mb-8 text-sm max-w-md mx-auto">
              Start for free. Generate your AI blueprint in seconds. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleNavigateBlueprint}
                className="group flex items-center gap-2 bg-[#D97706] hover:bg-[#F59E0B] text-[#09090B] font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(217,119,6,0.4)] text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Start Building Free
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={handleNavigateDemo}
                className="text-sm text-[#71717A] hover:text-[#A1A1AA] transition-colors"
              >
                View Sample Blueprint →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#D97706] rounded-[4px] flex items-center justify-center">
              <span className="font-bold text-[#09090B] text-[9px] font-mono">P</span>
            </div>
            <span className="text-sm text-[#71717A] font-mono">Prodexa © 2026</span>
          </div>
          <p className="text-xs text-[#3F3F46] font-mono">AI Product Operating System · Idea → Build → Launch</p>
        </div>
      </footer>
    </div>
  );
}
